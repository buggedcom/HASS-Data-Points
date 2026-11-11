"""Unload drains detection work and store commits before any teardown."""

from __future__ import annotations

import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.hass_datapoints import async_unload_entry
from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.detection_runner import (
    DetectionCancelled,
    DetectionRunner,
)

pytestmark = pytest.mark.asyncio


def _hass(runner, store):
    hass = MagicMock()
    hass.data = {DOMAIN: {"runner": runner, "store": store, "in_flight": {}}}
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)

    async def run(fn, *args):
        return fn(*args)

    hass.async_add_executor_job = run
    return hass


def _store(drained: bool = True):
    store = MagicMock()
    store.async_drain_commits = AsyncMock(return_value=drained)
    return store


class DescribeUnload:
    async def test_GIVEN_idle_integration_WHEN_unloaded_THEN_runner_drained_before_platforms_and_resources(
        self,
    ):
        runner = DetectionRunner()
        store = _store()
        hass = _hass(runner, store)

        assert await async_unload_entry(hass, MagicMock()) is True

        hass.config_entries.async_unload_platforms.assert_awaited_once()
        store.close.assert_called_once()
        assert runner.accepting is False
        assert "runner" not in hass.data[DOMAIN]

    async def test_GIVEN_worker_that_will_not_finish_WHEN_unloaded_THEN_reload_fails_and_resources_are_kept(
        self,
    ):
        executor = ThreadPoolExecutor(max_workers=1)
        release = threading.Event()
        started = threading.Event()
        runner = DetectionRunner(executor=executor)

        def stuck():
            started.set()
            release.wait(timeout=10)

        async def work(job):
            await runner.run_cpu(job, stuck)

        store = _store()
        hass = _hass(runner, store)
        try:
            task = asyncio.create_task(runner.submit(work))
            await asyncio.get_running_loop().run_in_executor(None, started.wait, 5)
            # Shrink the drain budget so the test stays fast.
            original = runner.shutdown

            async def quick_shutdown(timeout: float = 5.0) -> bool:
                return await original(timeout=0.05)

            runner.shutdown = quick_shutdown

            assert await async_unload_entry(hass, MagicMock()) is False

            hass.config_entries.async_unload_platforms.assert_not_awaited()
            store.close.assert_not_called()
            assert hass.data[DOMAIN]["runner"] is runner
            assert hass.data[DOMAIN]["store"] is store
            assert runner.accepting is False
        finally:
            release.set()
        with pytest.raises(DetectionCancelled):
            await task
        executor.shutdown(wait=True)

    async def test_GIVEN_store_commit_still_running_WHEN_unloaded_THEN_reload_fails_before_teardown(
        self,
    ):
        store = _store(drained=False)
        hass = _hass(DetectionRunner(), store)

        assert await async_unload_entry(hass, MagicMock()) is False

        hass.config_entries.async_unload_platforms.assert_not_awaited()
        store.close.assert_not_called()
