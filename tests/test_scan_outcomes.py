"""Scheduled scan outcomes: failures keep last-known results and stay honest."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.hass_datapoints.const import (
    EVENT_ANOMALY_DETECTED,
    EVENT_ANOMALY_RESOLVED,
)
from custom_components.hass_datapoints.detection_runner import (
    DetectionRunner,
    DetectionTimeout,
)
from custom_components.hass_datapoints.store import DatapointsStore
from tests.conftest import make_inline_runner

pytestmark = pytest.mark.asyncio

_PREP = "custom_components.hass_datapoints.sensor.async_prepare_entity_series"
_DETECT = "custom_components.hass_datapoints.sensor._run_detection_sync"
_RECORDER = "homeassistant.components.recorder.get_instance"
_PTS = [[t * 60_000, float(t % 5)] for t in range(50)]
_CLUSTER = {
    "points": [{"timeMs": 60_000, "value": 9.0}, {"timeMs": 120_000, "value": 9.0}],
    "anomalyMethod": "iqr",
    "maxDeviation": 3.0,
}


def _monitor(**overrides):
    monitor = {
        "id": "m1",
        "name": "Household Climate",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "deleted_at": None,
        "look_back_hours": 24,
        "scan_interval_minutes": 15,
        "anomaly_methods": ["iqr"],
        "dismissed_windows": [],
        "scan_history": [],
        "last_cluster_count": 0,
        "active_clusters_summary": [],
        "last_scan_status": "unknown",
        "last_scan_error": None,
    }
    monitor.update(overrides)
    return monitor


def _scan_sensor(monitor, runner=None):
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = DatapointsStore(MagicMock(), ":memory:")
    inner = MagicMock()
    inner.async_save = AsyncMock(return_value=None)
    store._store = inner
    store._data = {"monitors": [monitor]}
    hass = MagicMock()
    hass.data = {"hass_datapoints": {"runner": runner or make_inline_runner()}}
    entry = MagicMock()
    entry.entry_id = "entry"
    sensor = DatapointsMonitorSensor(entry, store, hass, monitor["id"])
    sensor.async_write_ha_state = MagicMock()
    return sensor, store, hass


async def _scan(sensor, *, clusters=None, side_effect=None):
    detect = (
        patch(_DETECT, side_effect=side_effect)
        if side_effect is not None
        else patch(_DETECT, return_value=clusters or [])
    )
    with (
        patch(_RECORDER, return_value=MagicMock()),
        patch(_PREP, new_callable=AsyncMock, return_value=_PTS),
        detect,
    ):
        await sensor._run_scan()


def _fired(hass, event_name):
    return [c for c in hass.bus.async_fire.call_args_list if c.args[0] == event_name]


class DescribeFailedScans:
    async def test_GIVEN_active_anomaly_WHEN_scan_times_out_THEN_results_kept_and_no_resolved_event(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor())
        await _scan(sensor, clusters=[_CLUSTER])
        before = store.get_monitor("m1")

        await _scan(sensor, side_effect=DetectionTimeout())

        after = store.get_monitor("m1")
        assert after["last_scan_status"] == "timeout"
        assert after["last_scan_error"] == "detection_timeout"
        for field in (
            "last_cluster_count",
            "active_clusters_summary",
            "scan_history",
            "last_scan_at",
        ):
            assert after[field] == before[field]
        assert after["last_scan_attempt_at"] >= before["last_scan_at"]
        assert _fired(hass, EVENT_ANOMALY_RESOLVED) == []

    async def test_GIVEN_detector_raises_WHEN_scanned_THEN_error_status_without_raw_text(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor(last_cluster_count=1))

        await _scan(sensor, side_effect=RuntimeError("secret path /config/x"))

        monitor = store.get_monitor("m1")
        assert monitor["last_scan_status"] == "error"
        assert monitor["last_scan_error"] == "detection_error"
        assert monitor["last_cluster_count"] == 1
        hass.bus.async_fire.assert_not_called()

    async def test_GIVEN_failed_scan_WHEN_later_success_finds_nothing_THEN_it_resolves(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor())
        await _scan(sensor, clusters=[_CLUSTER])
        await _scan(sensor, side_effect=DetectionTimeout())

        await _scan(sensor, clusters=[])

        monitor = store.get_monitor("m1")
        assert monitor["last_scan_status"] == "success"
        assert monitor["last_cluster_count"] == 0
        assert len(_fired(hass, EVENT_ANOMALY_DETECTED)) == 1
        assert len(_fired(hass, EVENT_ANOMALY_RESOLVED)) == 1

    async def test_GIVEN_anomaly_then_failure_then_anomaly_WHEN_scanned_THEN_no_new_detected_event(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor())
        await _scan(sensor, clusters=[_CLUSTER])
        await _scan(sensor, side_effect=DetectionTimeout())

        await _scan(sensor, clusters=[_CLUSTER])

        assert len(_fired(hass, EVENT_ANOMALY_DETECTED)) == 1
        assert [h["count"] for h in store.get_monitor("m1")["scan_history"]] == [1, 1]

    async def test_GIVEN_queue_full_WHEN_scheduled_scan_ticks_THEN_busy_is_recorded(
        self,
    ):
        runner = DetectionRunner(max_active=1, max_waiting=0)
        release = asyncio.Event()

        async def hog(_job):
            await release.wait()

        hog_task = asyncio.create_task(runner.submit(hog))
        await asyncio.sleep(0)
        sensor, store, _ = _scan_sensor(_monitor(last_cluster_count=3), runner)

        await _scan(sensor, clusters=[])

        monitor = store.get_monitor("m1")
        assert monitor["last_scan_status"] == "busy"
        assert monitor["last_scan_error"] == "detection_busy"
        assert monitor["last_cluster_count"] == 3
        release.set()
        await hog_task

    async def test_GIVEN_scan_already_running_WHEN_tick_overlaps_THEN_skipped_without_status_change(
        self,
    ):
        runner = make_inline_runner()
        sensor, store, _ = _scan_sensor(_monitor(), runner)
        release = asyncio.Event()

        async def slow_prep(*_args, **_kwargs):
            await release.wait()
            return _PTS

        with (
            patch(_RECORDER, return_value=MagicMock()),
            patch(_PREP, side_effect=slow_prep),
            patch(_DETECT, return_value=[]),
        ):
            first = asyncio.create_task(sensor._run_scan())
            for _ in range(5):
                await asyncio.sleep(0)
            assert store.get_monitor("m1")["last_scan_status"] == "running"

            await sensor._run_scan()  # overlapping tick

            assert store.get_monitor("m1")["last_scan_status"] == "running"
            release.set()
            await first
        assert store.get_monitor("m1")["last_scan_status"] == "success"
        assert len(store.get_monitor("m1")["scan_history"]) == 1

    async def test_GIVEN_scan_running_WHEN_monitor_reconfigured_THEN_scan_publishes_nothing(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor(last_cluster_count=2))
        edited = asyncio.Event()

        async def prep_then_edit(*_args, **_kwargs):
            await store.async_update_monitor("m1", {"anomaly_methods": ["persistence"]})
            edited.set()
            return _PTS

        with (
            patch(_RECORDER, return_value=MagicMock()),
            patch(_PREP, side_effect=prep_then_edit),
            patch(_DETECT, return_value=[]),
        ):
            await sensor._run_scan()

        monitor = store.get_monitor("m1")
        assert edited.is_set()
        assert monitor["last_cluster_count"] == 2
        assert monitor["last_scan_status"] == "unknown"
        hass.bus.async_fire.assert_not_called()


class DescribeDiagnostics:
    def _diagnostics(self, monitor):
        from custom_components.hass_datapoints.binary_sensor import (
            DatapointsMonitorProblemBinarySensor,
        )
        from custom_components.hass_datapoints.sensor import (
            DatapointsMonitorAnomalyDurationSensor,
            DatapointsMonitorConsecutiveScansSensor,
        )

        store = DatapointsStore(MagicMock(), ":memory:")
        store._data = {"monitors": [monitor]}
        entry = MagicMock()
        entry.entry_id = "entry"
        return (
            DatapointsMonitorConsecutiveScansSensor(entry, store, "m1"),
            DatapointsMonitorAnomalyDurationSensor(entry, store, MagicMock(), "m1"),
            DatapointsMonitorProblemBinarySensor(entry, store, MagicMock(), "m1"),
        )

    @pytest.mark.parametrize(
        ("status", "error", "available", "problem"),
        [
            ("success", None, True, False),
            ("running", None, True, False),
            ("unknown", None, False, False),
            ("timeout", "detection_timeout", False, True),
            ("busy", "detection_busy", False, True),
            ("error", "detection_error", False, True),
            ("running", "detection_timeout", False, True),
            ("running", "unverified", False, False),
        ],
    )
    async def test_GIVEN_scan_status_WHEN_reading_diagnostics_THEN_availability_and_problem_follow_evidence(
        self, status, error, available, problem
    ):
        consecutive, duration, problem_sensor = self._diagnostics(
            _monitor(
                last_scan_status=status,
                last_scan_error=error,
                last_cluster_count=1,
                last_scan_data_points=50,
                scan_history=[{"t": "2026-11-11T10:00:00+00:00", "count": 1}],
            )
        )

        assert consecutive.available is available
        assert duration.available is available
        assert problem_sensor.is_on is problem
        assert consecutive.extra_state_attributes["evidence"] == "last_successful_scan"

    async def test_GIVEN_failed_scan_WHEN_next_scan_starts_THEN_running_keeps_failure_code(
        self,
    ):
        from custom_components.hass_datapoints.sensor import _mark_scan_running

        build = _mark_scan_running("2026-11-11T11:00:00+00:00")

        assert (
            build(
                _monitor(
                    last_scan_status="timeout", last_scan_error="detection_timeout"
                )
            )["last_scan_error"]
            == "detection_timeout"
        )
        assert build(_monitor(last_scan_status="success"))["last_scan_error"] is None
        assert (
            build(_monitor(last_scan_status="unknown"))["last_scan_error"]
            == "unverified"
        )


class DescribeTimeoutCommitRace:
    async def test_GIVEN_success_committed_for_attempt_WHEN_late_timeout_failure_lands_THEN_it_is_ignored(
        self,
    ):
        from custom_components.hass_datapoints.sensor import _failure_updates

        current = _monitor(
            last_scan_status="success", last_scan_at="2026-11-11T20:13:08+00:00"
        )

        assert (
            _failure_updates(
                "2026-11-11T20:13:07+00:00", "timeout", "detection_timeout", current
            )
            is None
        )
        assert _failure_updates(
            "2026-11-11T20:30:00+00:00", "timeout", "detection_timeout", current
        ) == {
            "last_scan_attempt_at": "2026-11-11T20:30:00+00:00",
            "last_scan_status": "timeout",
            "last_scan_error": "detection_timeout",
        }

    async def test_GIVEN_deadline_passed_before_commit_WHEN_scan_finishes_THEN_only_the_timeout_is_recorded(
        self,
    ):
        sensor, store, hass = _scan_sensor(_monitor(last_cluster_count=2))

        def detect_then_expire(_pts, _config, _comparison, cancel):
            cancel.deadline = 0  # deadline passes after detection, before commit
            return []

        await _scan(sensor, side_effect=detect_then_expire)

        monitor = store.get_monitor("m1")
        assert monitor["last_scan_status"] == "timeout"
        assert monitor["last_cluster_count"] == 2
        hass.bus.async_fire.assert_not_called()

    async def test_GIVEN_token_expired_WHEN_running_mark_is_built_THEN_it_is_skipped(
        self,
    ):
        from custom_components.hass_datapoints.detection_runner import (
            CancellationToken,
        )
        from custom_components.hass_datapoints.sensor import _mark_scan_running

        build = _mark_scan_running("2026-11-11T20:00:00+00:00", CancellationToken(0))

        assert build(_monitor(last_scan_status="success")) is None

