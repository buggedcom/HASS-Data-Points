"""Serialized, staged and cancellation-safe monitor store transactions.

The JSON save is replaced by a gate so tests can hold persistence open and
cancel callers or queue edits around it, with no sleep-based ordering.
"""

from __future__ import annotations

import asyncio
import copy
from unittest.mock import MagicMock

import pytest

from custom_components.hass_datapoints.store import DatapointsStore

pytestmark = pytest.mark.asyncio


class _GatedSave:
    """Stand-in for the HA JSON Store whose save can be held open."""

    def __init__(self) -> None:
        self.saved: list[dict] = []
        self.entered = asyncio.Event()
        self.release = asyncio.Event()
        self.release.set()
        self.fail_next = False

    def hold(self) -> None:
        self.entered.clear()
        self.release.clear()

    async def async_save(self, data: dict) -> None:
        self.entered.set()
        await self.release.wait()
        if self.fail_next:
            self.fail_next = False
            raise OSError("disk full")
        self.saved.append(copy.deepcopy(data))

    async def async_load(self):
        return None


def _store(monitors=None) -> tuple[DatapointsStore, _GatedSave]:
    store = DatapointsStore(MagicMock(), ":memory:")
    gate = _GatedSave()
    store._store = gate
    store._data = {"monitors": monitors or []}
    for monitor in store._data["monitors"]:
        store._monitor_revisions[monitor["id"]] = 0
    return store, gate


def _monitor(**overrides) -> dict:
    monitor = {
        "id": "m1",
        "name": "Climate",
        "enabled": True,
        "deleted_at": None,
        "anomaly_methods": ["iqr"],
        "last_cluster_count": 2,
        "active_cluster_count": 2,
        "scan_history": [{"t": "2026-11-11T10:00:00+00:00", "count": 2}],
        "last_scan_at": "2026-11-11T10:00:00+00:00",
        "last_scan_status": "success",
        "last_scan_error": None,
        "dismissed_windows": [],
    }
    monitor.update(overrides)
    return monitor


def _scan_success(count: int):
    return lambda _current: {"last_cluster_count": count, "last_scan_status": "success"}


class DescribeSnapshots:
    async def test_GIVEN_monitor_WHEN_reader_mutates_returned_copy_THEN_store_is_unchanged(
        self,
    ):
        store, _ = _store([_monitor()])

        snapshot = store.get_monitor("m1")
        snapshot["dismissed_windows"].append({"id": "w"})
        DatapointsStore.prune_dismissed_windows(store.get_monitors()[0], None)

        assert store._data["monitors"][0]["dismissed_windows"] == []


class DescribeCancellationDuringPersistence:
    async def test_GIVEN_save_in_progress_WHEN_caller_is_cancelled_THEN_commit_still_completes_and_disk_matches_memory(
        self,
    ):
        store, gate = _store([_monitor()])
        gate.hold()
        caller = asyncio.create_task(
            store.async_update_monitor("m1", {"anomaly_sensitivity": "high"})
        )
        await gate.entered.wait()

        caller.cancel()
        with pytest.raises(asyncio.CancelledError):
            await caller
        # Not yet published: readers never see staged fields.
        assert store.get_monitor("m1").get("anomaly_sensitivity") is None

        gate.release.set()
        assert await store.async_drain_commits(timeout=1.0) is True

        assert store.get_monitor("m1")["anomaly_sensitivity"] == "high"
        assert gate.saved[-1]["monitors"] == store._data["monitors"]

    async def test_GIVEN_commit_held_WHEN_queued_caller_is_cancelled_before_lock_THEN_it_publishes_nothing(
        self,
    ):
        store, gate = _store([_monitor()])
        gate.hold()
        first = asyncio.create_task(store.async_update_monitor("m1", {"name": "A"}))
        await gate.entered.wait()
        second = asyncio.create_task(
            store.async_update_monitor("m1", {"anomaly_sensitivity": "low"})
        )
        await asyncio.sleep(0)

        second.cancel()
        with pytest.raises(asyncio.CancelledError):
            await second
        gate.release.set()
        await first

        assert store.get_monitor("m1")["name"] == "A"
        assert "anomaly_sensitivity" not in store.get_monitor("m1")
        assert len(gate.saved) == 1

    async def test_GIVEN_save_fails_WHEN_committing_THEN_no_tentative_state_is_exposed(
        self,
    ):
        store, gate = _store([_monitor()])
        gate.fail_next = True
        notified = []
        store.async_add_listener(lambda: notified.append(True))

        with pytest.raises(OSError):
            await store.async_commit_monitor_scan(
                "m1", store.get_monitor_revision("m1"), _scan_success(0)
            )

        assert store.get_monitor("m1")["last_cluster_count"] == 2
        assert notified == []


class DescribeScanPublicationOrdering:
    async def test_GIVEN_config_edit_committed_WHEN_old_scan_publishes_THEN_it_is_a_no_op(
        self,
    ):
        store, gate = _store([_monitor()])
        revision = store.get_monitor_revision("m1")

        await store.async_update_monitor("m1", {"anomaly_methods": ["persistence"]})
        result = await store.async_commit_monitor_scan("m1", revision, _scan_success(0))

        assert result is None
        assert store.get_monitor("m1")["last_cluster_count"] == 2
        assert store.get_monitor("m1")["last_scan_status"] == "unknown"

    async def test_GIVEN_scan_commit_holding_lock_WHEN_edit_queues_behind_it_THEN_edit_linearizes_after_scan(
        self,
    ):
        store, gate = _store([_monitor()])
        revision = store.get_monitor_revision("m1")
        gate.hold()
        scan = asyncio.create_task(
            store.async_commit_monitor_scan("m1", revision, _scan_success(5))
        )
        await gate.entered.wait()
        edit = asyncio.create_task(
            store.async_update_monitor("m1", {"anomaly_methods": ["persistence"]})
        )
        await asyncio.sleep(0)

        gate.release.set()
        await asyncio.gather(scan, edit)

        committed = store.get_monitor("m1")
        assert committed["last_cluster_count"] == 5
        assert committed["anomaly_methods"] == ["persistence"]
        assert committed["last_scan_status"] == "unknown"
        assert gate.saved[-1]["monitors"] == store._data["monitors"]

    @pytest.mark.parametrize(
        ("first", "second"),
        [
            ({"enabled": False}, {"enabled": True}),
            ("delete", "restore"),
        ],
    )
    async def test_GIVEN_lifecycle_round_trip_WHEN_old_scan_publishes_THEN_rejected(
        self, first, second
    ):
        store, _ = _store([_monitor()])
        revision = store.get_monitor_revision("m1")

        if first == "delete":
            await store.async_soft_delete_monitor("m1")
            await store.async_restore_monitor("m1")
        else:
            await store.async_update_monitor("m1", first)
            await store.async_update_monitor("m1", second)
        result = await store.async_commit_monitor_scan("m1", revision, _scan_success(0))

        assert result is None
        assert store.get_monitor("m1")["last_cluster_count"] == 2

    async def test_GIVEN_rename_WHEN_scan_publishes_THEN_scan_is_still_current(self):
        store, _ = _store([_monitor()])
        revision = store.get_monitor_revision("m1")

        await store.async_update_monitor("m1", {"name": "Renamed"})
        result = await store.async_commit_monitor_scan("m1", revision, _scan_success(0))

        assert result is not None
        assert store.get_monitor("m1")["last_scan_status"] == "success"

    async def test_GIVEN_other_monitor_edit_WHEN_scan_publishes_THEN_both_are_kept(
        self,
    ):
        store, _ = _store([_monitor(), _monitor(id="m2", name="Other")])
        revision = store.get_monitor_revision("m1")

        await store.async_update_monitor("m2", {"anomaly_sensitivity": "high"})
        await store.async_commit_monitor_scan("m1", revision, _scan_success(0))

        assert store.get_monitor("m1")["last_cluster_count"] == 0
        assert store.get_monitor("m2")["anomaly_sensitivity"] == "high"

    async def test_GIVEN_listener_WHEN_scan_commits_THEN_it_observes_committed_state_and_revision_listeners_skip_scans(
        self,
    ):
        store, _ = _store([_monitor()])
        observed = []
        revisions = []
        store.async_add_listener(
            lambda: observed.append(store.get_monitor("m1")["last_cluster_count"])
        )
        store.async_add_revision_listener(revisions.append)

        await store.async_commit_monitor_scan(
            "m1", store.get_monitor_revision("m1"), _scan_success(7)
        )
        await store.async_update_monitor("m1", {"anomaly_sensitivity": "high"})

        assert observed == [7, 7]
        assert revisions == ["m1"]


class DescribeLegacyLoad:
    async def test_GIVEN_legacy_and_running_monitors_WHEN_loaded_THEN_status_is_unknown_and_results_kept(
        self,
    ):
        store, gate = _store()
        legacy = _monitor()
        for field in ("last_scan_status", "last_scan_error"):
            legacy.pop(field)
        running = _monitor(id="m2", last_scan_status="running")

        async def load():
            return {"monitors": [legacy, running]}

        gate.async_load = load
        await store.async_load()

        for monitor_id in ("m1", "m2"):
            monitor = store.get_monitor(monitor_id)
            assert monitor["last_scan_status"] == "unknown"
            assert monitor["last_cluster_count"] == 2
            assert monitor["last_scan_at"] == "2026-11-11T10:00:00+00:00"


class DescribeDismissals:
    async def test_GIVEN_scan_running_WHEN_window_dismissed_THEN_scan_still_publishes(
        self,
    ):
        store, _ = _store([_monitor()])
        revision = store.get_monitor_revision("m1")

        await store.async_dismiss_window("m1", 0, 10, None)
        result = await store.async_commit_monitor_scan(
            "m1", revision, _scan_success(0)
        )

        assert result is not None
        assert store.get_monitor("m1")["last_cluster_count"] == 0
