"""Concurrency regressions for the bounded anomaly detection runner.

These use real asyncio tasks and a real ThreadPoolExecutor with threading
barriers. Every blocking worker is released in a ``finally`` so a failing
assertion can never leave a non-daemon worker thread hanging the test run.
"""

from __future__ import annotations

import asyncio
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import pytest

from custom_components.hass_datapoints.anomaly_detection import (
    run_anomaly_detection,
)
from custom_components.hass_datapoints.detection_runner import (
    DetectionBusy,
    DetectionCancelled,
    DetectionRunner,
    DetectionTimeout,
)

pytestmark = pytest.mark.asyncio


class _BlockingWorker:
    """A CPU stand-in that blocks a real worker thread until released."""

    def __init__(self) -> None:
        self.started = threading.Event()
        self.release = threading.Event()
        self.finished = threading.Event()

    def __call__(self) -> str:
        self.started.set()
        self.release.wait(timeout=10)
        self.finished.set()
        return "done"

    async def wait_started(self) -> None:
        await asyncio.get_running_loop().run_in_executor(None, self.started.wait, 5)


async def _until(predicate, timeout: float = 2.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        await asyncio.sleep(0.001)
    raise AssertionError("condition never became true")


class DescribeAdmission:
    async def test_GIVEN_three_active_and_six_waiting_WHEN_tenth_submitted_THEN_it_is_busy(
        self,
    ):
        release = asyncio.Event()
        started: asyncio.Queue[int] = asyncio.Queue()
        runner = DetectionRunner()

        async def work(job):
            await started.put(job.id)
            await release.wait()
            return job.id

        tasks = [asyncio.create_task(runner.submit(work)) for _ in range(9)]
        try:
            for _ in range(3):
                await started.get()
            await _until(lambda: runner.waiting_count == 6)

            with pytest.raises(DetectionBusy) as err:
                await runner.submit(work)

            assert err.value.reason == "capacity"
            assert runner.active_count == 3
            assert runner.waiting_count == 6
        finally:
            release.set()
            await asyncio.gather(*tasks)
        assert await runner.shutdown()

    async def test_GIVEN_waiting_jobs_WHEN_slots_free_THEN_they_start_in_fifo_order(
        self,
    ):
        release = asyncio.Event()
        order: list[str] = []
        runner = DetectionRunner(max_active=1, max_waiting=3)

        def make(name):
            async def work(_job):
                order.append(name)
                await release.wait()

            return work

        tasks = [asyncio.create_task(runner.submit(make(n))) for n in "abcd"]
        await _until(lambda: runner.waiting_count == 3)
        release.set()
        await asyncio.gather(*tasks)

        assert order == ["a", "b", "c", "d"]
        assert await runner.shutdown()

    async def test_GIVEN_keyed_job_running_WHEN_same_key_submitted_THEN_duplicate_busy(
        self,
    ):
        release = asyncio.Event()
        runner = DetectionRunner()

        async def work(_job):
            await release.wait()

        first = asyncio.create_task(runner.submit(work, key="scan:m1"))
        await _until(lambda: runner.active_count == 1)
        with pytest.raises(DetectionBusy) as err:
            await runner.submit(work, key="scan:m1")
        release.set()
        await first

        assert err.value.reason == "duplicate"
        # The key is free again once the first job finishes.
        await runner.submit(work, key="scan:m1")
        assert await runner.shutdown()


class DescribeDeadline:
    async def test_GIVEN_job_waiting_in_queue_WHEN_deadline_passes_THEN_timeout_and_never_starts(
        self,
    ):
        release = asyncio.Event()
        started = False
        runner = DetectionRunner(max_active=1, max_waiting=1)

        async def blocker(_job):
            await release.wait()

        async def queued(_job):
            nonlocal started
            started = True

        blocking = asyncio.create_task(runner.submit(blocker))
        await _until(lambda: runner.active_count == 1)

        with pytest.raises(DetectionTimeout):
            await runner.submit(queued, token=runner.new_token(0.05))

        assert runner.waiting_count == 0
        release.set()
        await blocking
        assert started is False
        assert await runner.shutdown()

    async def test_GIVEN_multi_step_job_WHEN_steps_exceed_one_shared_deadline_THEN_timeout(
        self,
    ):
        """The deadline covers the whole request, never resetting per entity."""
        runner = DetectionRunner()
        steps: list[int] = []

        async def work(job):
            for entity in range(5):
                job.check()
                steps.append(entity)
                await asyncio.sleep(0.04)

        with pytest.raises(DetectionTimeout):
            await runner.submit(work, token=runner.new_token(0.1))

        assert len(steps) < 5
        await _until(lambda: runner.active_count == 0)
        assert await runner.shutdown()

    async def test_GIVEN_worker_running_WHEN_deadline_passes_THEN_caller_gets_timeout_promptly_and_slot_is_retained(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=1)
        worker = _BlockingWorker()
        runner = DetectionRunner(max_active=1, max_waiting=1, executor=executor)

        async def work(job):
            return await runner.run_cpu(job, worker)

        try:
            began = time.monotonic()
            with pytest.raises(DetectionTimeout):
                await runner.submit(work, token=runner.new_token(0.1))
            assert time.monotonic() - began < 1.0

            # The worker is still running, so the slot is not reusable yet.
            assert worker.finished.is_set() is False
            assert runner.active_count == 1
        finally:
            worker.release.set()
        await asyncio.get_running_loop().run_in_executor(None, worker.finished.wait, 5)
        await _until(lambda: runner.active_count == 0)
        assert await runner.shutdown()
        executor.shutdown(wait=True)


class DescribeCancellation:
    async def test_GIVEN_queued_job_WHEN_caller_is_cancelled_THEN_work_never_starts(
        self,
    ):
        release = asyncio.Event()
        queued_started = False
        runner = DetectionRunner(max_active=1, max_waiting=1)

        async def active(_job):
            await release.wait()

        async def queued(_job):
            nonlocal queued_started
            queued_started = True

        active_task = asyncio.create_task(runner.submit(active))
        await _until(lambda: runner.active_count == 1)
        queued_task = asyncio.create_task(runner.submit(queued))
        await _until(lambda: runner.waiting_count == 1)

        queued_task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await queued_task

        assert runner.waiting_count == 0
        release.set()
        await active_task
        assert queued_started is False
        assert await runner.shutdown()

    async def test_GIVEN_submitted_worker_WHEN_caller_is_cancelled_THEN_slot_is_retained_until_worker_finishes(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=2)
        worker = _BlockingWorker()
        next_started = asyncio.Event()
        runner = DetectionRunner(max_active=1, max_waiting=1, executor=executor)

        async def work(job):
            return await runner.run_cpu(job, worker)

        async def next_job(_job):
            next_started.set()

        try:
            task = asyncio.create_task(runner.submit(work))
            await worker.wait_started()
            follower = asyncio.create_task(runner.submit(next_job))
            await _until(lambda: runner.waiting_count == 1)

            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
            for _ in range(20):
                await asyncio.sleep(0)

            # No permit reuse: the follower must not start while the worker runs.
            assert runner.active_count == 1
            assert next_started.is_set() is False
        finally:
            worker.release.set()
        await follower
        assert next_started.is_set() is True
        assert await runner.shutdown()
        executor.shutdown(wait=True)

    async def test_GIVEN_active_keyed_job_WHEN_cancel_key_THEN_job_raises_cancelled_after_its_worker(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=1)
        worker = _BlockingWorker()
        runner = DetectionRunner(executor=executor)

        async def work(job):
            await runner.run_cpu(job, worker)
            return "published"

        try:
            task = asyncio.create_task(runner.submit(work, key="scan:m1"))
            await worker.wait_started()

            assert runner.cancel_key("scan:m1") is True
            assert runner.active_count == 1
        finally:
            worker.release.set()
        with pytest.raises(DetectionCancelled):
            await task
        assert runner.active_count == 0
        assert await runner.shutdown()
        executor.shutdown(wait=True)

    async def test_GIVEN_queued_keyed_job_WHEN_cancel_key_THEN_caller_gets_cancelled(
        self,
    ):
        release = asyncio.Event()
        runner = DetectionRunner(max_active=1, max_waiting=1)

        async def work(_job):
            await release.wait()

        blocker = asyncio.create_task(runner.submit(work))
        await _until(lambda: runner.active_count == 1)
        queued = asyncio.create_task(runner.submit(work, key="warmup:m1"))
        await _until(lambda: runner.waiting_count == 1)

        runner.cancel_key("warmup:m1")

        with pytest.raises(DetectionCancelled):
            await queued
        release.set()
        await blocker
        assert await runner.shutdown()

    async def test_GIVEN_large_detection_in_worker_WHEN_token_cancelled_THEN_detector_loop_stops_within_500ms(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=1)
        runner = DetectionRunner(executor=executor)
        # Big enough that a full run takes well over the cancellation budget.
        pts = [[i * 10_000, float((i * 7919) % 101)] for i in range(400_000)]
        config = {
            "anomaly_methods": ["trend_residual", "rate_of_change", "rolling_zscore"],
            "trend_method": "lowess",
            "trend_window": "24h",
            "anomaly_rate_window": "1h",
        }
        started = threading.Event()
        tokens = []

        def detect(cancel):
            started.set()
            return run_anomaly_detection(pts, config, cancel=cancel)

        async def work(job):
            tokens.append(job.token)
            return await runner.run_cpu(job, detect, job.token)

        task = asyncio.create_task(runner.submit(work))
        await asyncio.get_running_loop().run_in_executor(None, started.wait, 5)
        await asyncio.sleep(0.05)
        cancelled_at = time.monotonic()
        tokens[0].cancel()

        with pytest.raises(DetectionCancelled):
            await task
        await _until(lambda: runner.active_count == 0)

        assert time.monotonic() - cancelled_at < 0.5
        assert await runner.shutdown()
        executor.shutdown(wait=True)


class DescribeShutdown:
    async def test_GIVEN_active_and_queued_jobs_WHEN_shutdown_THEN_all_cancelled_drained_and_admission_stops(
        self,
    ):
        runner = DetectionRunner(max_active=1, max_waiting=2)

        async def cooperative(job):
            while True:
                job.check()
                await asyncio.sleep(0.01)

        active = asyncio.create_task(runner.submit(cooperative))
        await _until(lambda: runner.active_count == 1)
        queued = asyncio.create_task(runner.submit(cooperative))
        await _until(lambda: runner.waiting_count == 1)

        assert await runner.shutdown(timeout=1.0) is True

        with pytest.raises(DetectionCancelled):
            await active
        with pytest.raises(DetectionCancelled):
            await queued
        with pytest.raises(DetectionCancelled):
            await runner.submit(cooperative)

    async def test_GIVEN_worker_that_will_not_finish_WHEN_shutdown_THEN_reports_failure_and_stays_quiesced(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=1)
        worker = _BlockingWorker()
        runner = DetectionRunner(executor=executor)

        async def work(job):
            return await runner.run_cpu(job, worker)

        try:
            task = asyncio.create_task(runner.submit(work))
            await worker.wait_started()

            assert await runner.shutdown(timeout=0.05) is False
            assert runner.accepting is False
            assert runner.active_count == 1
            with pytest.raises(DetectionCancelled):
                await runner.submit(work)
        finally:
            worker.release.set()
        with pytest.raises(DetectionCancelled):
            await task
        # Once drained, a retried shutdown succeeds.
        assert await runner.shutdown(timeout=1.0) is True
        executor.shutdown(wait=True)


class DescribeCancelToken:
    async def test_GIVEN_queued_job_WHEN_its_token_is_cancelled_THEN_it_leaves_the_queue_at_once(
        self,
    ):
        release = asyncio.Event()
        runner = DetectionRunner(max_active=1, max_waiting=1)

        async def work(_job):
            await release.wait()

        blocker = asyncio.create_task(runner.submit(work))
        await _until(lambda: runner.active_count == 1)
        token = runner.new_token()
        queued = asyncio.create_task(runner.submit(work, token=token))
        await _until(lambda: runner.waiting_count == 1)

        runner.cancel_token(token)

        with pytest.raises(DetectionCancelled):
            await queued
        assert runner.waiting_count == 0
        # The freed place is immediately usable instead of reporting busy.
        replacement = asyncio.create_task(runner.submit(work))
        await _until(lambda: runner.waiting_count == 1)
        release.set()
        await asyncio.gather(blocker, replacement)
        assert await runner.shutdown()
