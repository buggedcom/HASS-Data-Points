"""Bounded, cancellable anomaly detection job runner.

One *job* is one logical request: a chart request, a monitor request, an
activity request, a scheduled scan or a monitor warmup. Every entity, history
fetch and overlap calculation inside that request shares the job's single
cancellation token and absolute deadline, which starts at admission (so queue
wait counts against it).

All runner bookkeeping happens on the event loop thread, so no lock is needed:
admission, start and finish are synchronous critical sections.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
import itertools
import logging
import threading
import time
from collections import deque
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

_LOGGER = logging.getLogger(__name__)

MAX_ACTIVE_PIPELINES = 3
MAX_WAITING_JOBS = 6
JOB_DEADLINE_SECONDS = 30.0

# Stable error codes returned to WebSocket clients and stored as scan health.
ERROR_TIMEOUT = "detection_timeout"
ERROR_CANCELLED = "detection_cancelled"
ERROR_BUSY = "detection_busy"
ERROR_DETECTION = "detection_error"

# Persisted while a scan runs after an unknown (legacy/changed) status, so the
# retained results stay marked unverified until a scan succeeds.
SCAN_ERROR_UNVERIFIED = "unverified"

# Scan statuses (last_scan_status) that mean the latest attempt failed. The
# frontend mirrors this in src/lib/data/monitor-status.ts.
FAILED_SCAN_STATUSES = frozenset({"timeout", "error", "busy", "cancelled"})
FAILED_SCAN_ERRORS = frozenset(
    {ERROR_TIMEOUT, ERROR_DETECTION, ERROR_BUSY, ERROR_CANCELLED}
)


class DetectionError(Exception):
    """Base class for stable anomaly execution failures."""

    code = ERROR_DETECTION


class DetectionTimeout(DetectionError):
    """The request-wide deadline expired."""

    code = ERROR_TIMEOUT


class DetectionCancelled(DetectionError):
    """The request was cancelled, superseded or the runner is shutting down."""

    code = ERROR_CANCELLED


class DetectionBusy(DetectionError):
    """The bounded admission queue is full, or the keyed job is already queued/running."""

    code = ERROR_BUSY

    def __init__(self, reason: str = "capacity") -> None:
        super().__init__(reason)
        self.reason = reason


def error_code(err: BaseException) -> str:
    """Map any exception to a stable client-facing code (never raw text)."""
    if isinstance(err, DetectionError):
        return err.code
    return ERROR_DETECTION


class CancellationToken:
    """Thread-safe cancellation flag plus an absolute monotonic deadline."""

    def __init__(self, deadline: float) -> None:
        self.deadline = deadline
        self._event = threading.Event()

    def cancel(self) -> None:
        self._event.set()

    @property
    def cancelled(self) -> bool:
        return self._event.is_set()

    def is_set(self) -> bool:
        """Event-compatible check: True once cancelled or past the deadline."""
        return self._event.is_set() or time.monotonic() >= self.deadline

    def raise_if_cancelled(self) -> None:
        if self._event.is_set():
            raise DetectionCancelled
        if time.monotonic() >= self.deadline:
            raise DetectionTimeout


@dataclass(slots=True, eq=False)
class DetectionJob:
    """One request-wide pipeline, including queueing and preparation."""

    id: int
    token: CancellationToken
    work: Callable[[DetectionJob], Awaitable[Any]]
    started: asyncio.Future[asyncio.Task[Any]]
    key: str | None = None
    task: asyncio.Task[Any] | None = None

    def check(self) -> None:
        self.token.raise_if_cancelled()


class DetectionRunner:
    """Own one FIFO admission queue and the CPU pool for an integration entry."""

    def __init__(
        self,
        *,
        max_active: int = MAX_ACTIVE_PIPELINES,
        max_waiting: int = MAX_WAITING_JOBS,
        executor: concurrent.futures.Executor | None = None,
    ) -> None:
        self._max_active = max_active
        self._max_waiting = max_waiting
        self._executor = executor or concurrent.futures.ThreadPoolExecutor(
            max_workers=max_active,
            thread_name_prefix="datapoints",
        )
        self._owns_executor = executor is None
        self._waiting: deque[DetectionJob] = deque()
        self._active: dict[int, DetectionJob] = {}
        self._keys: dict[str, DetectionJob] = {}
        self._ids = itertools.count(1)
        self._accepting = True

    @property
    def active_count(self) -> int:
        return len(self._active)

    @property
    def waiting_count(self) -> int:
        return len(self._waiting)

    @property
    def accepting(self) -> bool:
        return self._accepting

    @staticmethod
    def new_token(deadline_seconds: float = JOB_DEADLINE_SECONDS) -> CancellationToken:
        """Create a token whose deadline starts now (create it right before submit)."""
        return CancellationToken(time.monotonic() + deadline_seconds)

    async def submit(
        self,
        work: Callable[[DetectionJob], Awaitable[Any]],
        *,
        key: str | None = None,
        token: CancellationToken | None = None,
    ) -> Any:
        """Admit and run one pipeline under a single absolute deadline.

        Raises ``DetectionBusy`` when the queue is full (or ``key`` is already
        queued/running), ``DetectionTimeout`` when the deadline passes and
        ``DetectionCancelled`` when the token is cancelled or the runner stops.
        Cancelling the awaiting task re-raises ``CancelledError`` after
        cancelling the token. On timeout or caller cancellation the job keeps
        its active slot until its already-submitted work really finishes.
        """
        if not self._accepting:
            raise DetectionCancelled
        if key is not None and key in self._keys:
            raise DetectionBusy("duplicate")
        if (
            len(self._active) >= self._max_active
            and len(self._waiting) >= self._max_waiting
        ):
            raise DetectionBusy

        job = DetectionJob(
            id=next(self._ids),
            token=token or self.new_token(),
            work=work,
            key=key,
            started=asyncio.get_running_loop().create_future(),
        )
        if key is not None:
            self._keys[key] = job
        if len(self._active) < self._max_active:
            self._start(job)
        else:
            self._waiting.append(job)

        try:
            task = await asyncio.wait_for(
                asyncio.shield(job.started), self._remaining(job)
            )
            return await asyncio.wait_for(asyncio.shield(task), self._remaining(job))
        except TimeoutError as err:
            job.token.cancel()
            self._drop_waiting(job)
            raise DetectionTimeout from err
        except asyncio.CancelledError as err:
            job.token.cancel()
            self._drop_waiting(job)
            current = asyncio.current_task()
            if current is not None and current.cancelling():
                raise
            # The queued job itself was dropped by cancel_key() or shutdown().
            raise DetectionCancelled from err

    async def run_cpu(
        self, job: DetectionJob, func: Callable[..., Any], *args: Any
    ) -> Any:
        """Run CPU work in the runner pool.

        The executor future is shielded, so the owning job task (and therefore
        its active slot) only completes once the worker has really returned.
        """
        job.check()
        future = asyncio.get_running_loop().run_in_executor(self._executor, func, *args)
        result = await asyncio.shield(future)
        job.check()
        return result

    def cancel_token(self, token: CancellationToken) -> None:
        """Cancel the job owning ``token``; a queued job leaves the queue at once.

        Without this a cancelled request would hold its waiting place until a
        worker freed up, so rapid range changes could fill the queue and make
        unrelated requests fail as busy.
        """
        token.cancel()
        for job in list(self._waiting):
            if job.token is token:
                self._drop_waiting(job)

    def cancel_key(self, key: str) -> bool:
        """Cancel a queued or active keyed job (an active slot is kept until it ends)."""
        job = self._keys.get(key)
        if job is None:
            return False
        job.token.cancel()
        self._drop_waiting(job)
        return True

    async def shutdown(self, timeout: float = 5.0) -> bool:
        """Stop admission, cancel all work and drain it before resources close.

        Returns False, leaving the runner quiesced with its executor alive, when
        active jobs do not finish within ``timeout``. Calling it again later
        retries the drain.
        """
        self._accepting = False
        for job in list(self._waiting):
            job.token.cancel()
            self._drop_waiting(job)
        active_tasks = []
        for job in self._active.values():
            job.token.cancel()
            if job.task is not None:
                active_tasks.append(job.task)
        if active_tasks:
            _, pending = await asyncio.wait(active_tasks, timeout=timeout)
            if pending:
                return False
        if self._owns_executor:
            # Every submitted future has completed, so this does not block.
            self._executor.shutdown(wait=False)
        return True

    # -- internals -----------------------------------------------------------

    @staticmethod
    def _remaining(job: DetectionJob) -> float:
        return max(0.0, job.token.deadline - time.monotonic())

    def _start(self, job: DetectionJob) -> None:
        self._active[job.id] = job
        job.task = asyncio.get_running_loop().create_task(
            self._run_owned(job), name=f"datapoints_detection_job_{job.id}"
        )
        job.task.add_done_callback(consume_task_result)
        if not job.started.done():
            job.started.set_result(job.task)

    async def _run_owned(self, job: DetectionJob) -> Any:
        try:
            job.check()
            return await job.work(job)
        finally:
            self._finish(job)

    def _finish(self, job: DetectionJob) -> None:
        self._active.pop(job.id, None)
        self._release_key(job)
        while (
            self._accepting and self._waiting and len(self._active) < self._max_active
        ):
            self._start(self._waiting.popleft())

    def _drop_waiting(self, job: DetectionJob) -> None:
        try:
            self._waiting.remove(job)
        except ValueError:
            return
        self._release_key(job)
        if not job.started.done():
            job.started.cancel()

    def _release_key(self, job: DetectionJob) -> None:
        if job.key is not None and self._keys.get(job.key) is job:
            del self._keys[job.key]


def consume_task_result(task: asyncio.Task[Any]) -> None:
    """Retrieve a detached task's failure so asyncio never logs it as unhandled."""
    if task.cancelled():
        return
    err = task.exception()
    if err is not None and not isinstance(err, DetectionError):
        _LOGGER.debug("hass_datapoints detection job failed: %r", err)
