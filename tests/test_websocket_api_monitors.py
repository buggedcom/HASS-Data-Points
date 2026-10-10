"""Tests for anomaly monitor WebSocket command handlers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import voluptuous as vol
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import (
    ANOMALY_DIRECTION_FIELDS,
    DOMAIN,
    KEY_ADD_BINARY_SENSOR_ENTITIES,
    KEY_ADD_SENSOR_ENTITIES,
    KEY_ADD_SWITCH_ENTITIES,
    KEY_MONITOR_BINARY_SENSORS,
    KEY_MONITOR_SENSORS,
    KEY_MONITOR_SWITCHES,
    KEY_STORE,
)
from custom_components.hass_datapoints.websocket_api import (
    _MONITOR_ANALYSIS_FIELDS,
    ws_get_anomalies,
    ws_monitors_create,
    ws_monitors_delete,
    ws_monitors_dismiss,
    ws_monitors_list,
    ws_monitors_undismiss,
    ws_monitors_update,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_store(monitors=None):
    store = MagicMock()
    store.get_monitors.return_value = list(monitors or [])
    store.get_monitor.side_effect = lambda mid: next(
        (m for m in (monitors or []) if m["id"] == mid), None
    )
    store.async_create_monitor = AsyncMock(side_effect=lambda m: m)
    store.async_update_monitor = AsyncMock(
        side_effect=lambda mid, updates: next(
            ({**m, **updates} for m in (monitors or []) if m["id"] == mid), None
        )
    )
    store.async_delete_monitor = AsyncMock(return_value=True)
    store.async_dismiss_window = AsyncMock(
        side_effect=lambda mid, s, e, exp: next(
            (m for m in (monitors or []) if m["id"] == mid), None
        )
    )
    store.async_undismiss_window = AsyncMock(
        side_effect=lambda mid, wid: next(
            (m for m in (monitors or []) if m["id"] == mid), None
        )
    )
    return store


def _make_hass(store, sensors=None, add_entities=None):
    hass = MagicMock()
    add_sensor_entities = add_entities or MagicMock()
    add_binary_entities = MagicMock()
    add_switch_entities = MagicMock()
    hass.data = {
        DOMAIN: {
            KEY_STORE: store,
            KEY_MONITOR_SENSORS: sensors if sensors is not None else {},
            KEY_MONITOR_BINARY_SENSORS: {},
            KEY_MONITOR_SWITCHES: {},
            KEY_ADD_SENSOR_ENTITIES: add_sensor_entities,
            KEY_ADD_BINARY_SENSOR_ENTITIES: add_binary_entities,
            KEY_ADD_SWITCH_ENTITIES: add_switch_entities,
        }
    }
    hass.config_entries.async_entries.return_value = [MagicMock()]
    hass.async_add_executor_job = AsyncMock(return_value=None)
    return hass


def _make_connection(*, is_admin=True):
    connection = MagicMock()
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    connection.user.is_admin = is_admin
    return connection


# ---------------------------------------------------------------------------
# ws_monitors_list
# ---------------------------------------------------------------------------


class DescribeWsMonitorsList:
    async def test_GIVEN_admin_WHEN_called_THEN_returns_monitors(self):
        monitors = [{"id": "m1", "name": "A"}, {"id": "m2", "name": "B"}]
        store = _make_store(monitors)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {"id": 1, "type": f"{DOMAIN}/monitors/list"}

        await ws_monitors_list(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert len(result["monitors"]) == 2

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {"id": 1, "type": f"{DOMAIN}/monitors/list"}

        with pytest.raises(Unauthorized):
            await ws_monitors_list(hass, connection, msg)


# ---------------------------------------------------------------------------
# ws_monitors_create
# ---------------------------------------------------------------------------


class DescribeWsMonitorsCreate:
    async def test_GIVEN_valid_individual_payload_WHEN_called_THEN_creates_monitor(
        self,
    ):
        store = _make_store()
        add_entities = MagicMock()
        hass = _make_hass(store, add_entities=add_entities)
        connection = _make_connection()

        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "My Monitor",
            "entity_id": "sensor.temp",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
            "anomaly_methods": ["iqr"],
            "anomaly_sensitivity": "medium",
            "anomaly_overlap_mode": "all",
            "anomaly_rate_window": "1h",
            "anomaly_zscore_window": "24h",
            "anomaly_persistence_window": "1h",
            "anomaly_trend_method": "rolling_average",
            "anomaly_trend_window": "24h",
        }

        await ws_monitors_create(hass, connection, msg)

        store.async_create_monitor.assert_awaited_once()
        created_monitor = store.async_create_monitor.call_args[0][0]
        assert created_monitor["name"] == "My Monitor"
        assert created_monitor["entity_id"] == "sensor.temp"
        assert created_monitor["type"] == "individual"
        add_entities.assert_called_once()
        hass.data[DOMAIN][KEY_ADD_BINARY_SENSOR_ENTITIES].assert_called_once()
        hass.data[DOMAIN][KEY_ADD_SWITCH_ENTITIES].assert_called_once()
        assert len(hass.data[DOMAIN][KEY_MONITOR_SENSORS]) == 1
        assert len(hass.data[DOMAIN][KEY_MONITOR_BINARY_SENSORS]) == 1
        assert len(hass.data[DOMAIN][KEY_MONITOR_SWITCHES]) == 1
        connection.send_result.assert_called_once()

    async def test_GIVEN_missing_dynamic_callbacks_WHEN_called_THEN_creates_monitor_and_returns_success_without_crashing(
        self,
    ):
        store = _make_store()
        hass = _make_hass(store)
        hass.data[DOMAIN].pop(KEY_ADD_SENSOR_ENTITIES)
        hass.data[DOMAIN].pop(KEY_ADD_BINARY_SENSOR_ENTITIES)
        hass.data[DOMAIN].pop(KEY_ADD_SWITCH_ENTITIES)
        connection = _make_connection()

        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "My Monitor",
            "entity_id": "sensor.temp",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
        }

        await ws_monitors_create(hass, connection, msg)

        store.async_create_monitor.assert_awaited_once()
        connection.send_result.assert_called_once()

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "M",
            "entity_id": "sensor.x",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
        }

        with pytest.raises(Unauthorized):
            await ws_monitors_create(hass, connection, msg)

    async def test_GIVEN_created_monitor_entities_WHEN_switch_toggled_off_THEN_list_reports_disabled(
        self, mock_store
    ):
        from custom_components.hass_datapoints.switch import (
            DatapointsMonitorEnabledSwitch,
        )

        store = mock_store
        hass = _make_hass(store, add_entities=MagicMock())
        entry = MagicMock()
        entry.entry_id = "entry-1"
        hass.config_entries.async_entries.return_value = [entry]
        connection = _make_connection()

        create_msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "Lifecycle Monitor",
            "entity_id": "sensor.temp",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
        }

        await ws_monitors_create(hass, connection, create_msg)

        created_monitor = store.get_monitors()[0]
        monitor_id = created_monitor["id"]
        monitor_switch = hass.data[DOMAIN][KEY_MONITOR_SWITCHES][monitor_id]
        assert isinstance(monitor_switch, DatapointsMonitorEnabledSwitch)

        await monitor_switch.async_added_to_hass()
        monitor_switch.async_write_ha_state = MagicMock()

        await monitor_switch.async_turn_off()

        assert store.get_monitor(monitor_id)["enabled"] is False
        assert monitor_switch.is_on is False
        monitor_switch.async_write_ha_state.assert_called_once()

        list_connection = _make_connection()
        await ws_monitors_list(
            hass,
            list_connection,
            {"id": 2, "type": f"{DOMAIN}/monitors/list"},
        )

        listed_monitors = list_connection.send_result.call_args[0][1]["monitors"]
        assert listed_monitors[0]["id"] == monitor_id
        assert listed_monitors[0]["enabled"] is False


# ---------------------------------------------------------------------------
# ws_monitors_update
# ---------------------------------------------------------------------------


class DescribeWsMonitorsUpdate:
    async def test_GIVEN_valid_update_WHEN_called_THEN_updates_monitor(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        monitors = [{"id": monitor_id, "name": "Old", "enabled": True}]
        store = _make_store(monitors)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/update",
            "monitor_id": monitor_id,
            "name": "New",
            "enabled": False,
        }

        await ws_monitors_update(hass, connection, msg)

        store.async_update_monitor.assert_awaited_once()
        update_args = store.async_update_monitor.call_args[0]
        assert update_args[0] == monitor_id
        assert update_args[1]["name"] == "New"
        assert update_args[1]["enabled"] is False
        connection.send_result.assert_called_once()

    async def test_GIVEN_not_found_WHEN_called_THEN_sends_error(self):
        import uuid as _uuid

        store = _make_store()
        store.async_update_monitor = AsyncMock(return_value=None)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/update",
            "monitor_id": str(_uuid.uuid4()),
            "name": "X",
        }

        await ws_monitors_update(hass, connection, msg)

        connection.send_error.assert_called_once_with(
            1, "not_found", "Monitor not found"
        )

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        import uuid as _uuid

        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/update",
            "monitor_id": str(_uuid.uuid4()),
        }

        with pytest.raises(Unauthorized):
            await ws_monitors_update(hass, connection, msg)


# ---------------------------------------------------------------------------
# ws_monitors_delete
# ---------------------------------------------------------------------------


class DescribeWsMonitorsDelete:
    async def test_GIVEN_existing_monitor_WHEN_deleted_THEN_sensor_removed(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        store = _make_store([{"id": monitor_id}])
        mock_sensor = MagicMock()
        mock_sensor.async_remove = AsyncMock()
        sensors = {monitor_id: mock_sensor}
        hass = _make_hass(store, sensors=sensors)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/delete",
            "monitor_id": monitor_id,
        }

        await ws_monitors_delete(hass, connection, msg)

        store.async_delete_monitor.assert_awaited_once_with(monitor_id)
        mock_sensor.async_remove.assert_awaited_once()
        connection.send_result.assert_called_once_with(1, {"deleted": True})

    async def test_GIVEN_not_found_WHEN_deleted_THEN_sends_error(self):
        import uuid as _uuid

        store = _make_store()
        store.async_delete_monitor = AsyncMock(return_value=False)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/delete",
            "monitor_id": str(_uuid.uuid4()),
        }

        await ws_monitors_delete(hass, connection, msg)

        connection.send_error.assert_called_once_with(
            1, "not_found", "Monitor not found"
        )

    async def test_GIVEN_non_admin_WHEN_deleted_THEN_raises_unauthorized(self):
        import uuid as _uuid

        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/delete",
            "monitor_id": str(_uuid.uuid4()),
        }

        with pytest.raises(Unauthorized):
            await ws_monitors_delete(hass, connection, msg)


# ---------------------------------------------------------------------------
# ws_monitors_create — dismissed_windows initialised
# ---------------------------------------------------------------------------


class DescribeWsMonitorsCreateDismissedWindows:
    async def test_GIVEN_valid_payload_WHEN_created_THEN_dismissed_windows_empty(self):
        store = _make_store()
        # Return empty config entries so entity-registration code is skipped
        hass = _make_hass(store)
        hass.config_entries.async_entries.return_value = []
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "M",
            "entity_id": "sensor.temp",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
        }
        await ws_monitors_create(hass, connection, msg)

        created = store.async_create_monitor.call_args[0][0]
        assert created["dismissed_windows"] == []


# ---------------------------------------------------------------------------
# ws_monitors_dismiss
# ---------------------------------------------------------------------------


class DescribeWsMonitorsDismiss:
    async def test_GIVEN_valid_params_WHEN_called_THEN_dismisses_window(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        monitors = [
            {
                "id": monitor_id,
                "name": "M",
                "look_back_hours": 24,
                "dismissed_windows": [],
            }
        ]
        store = _make_store(monitors)
        store.async_dismiss_window = AsyncMock(return_value=monitors[0])
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/dismiss",
            "monitor_id": monitor_id,
            "start_ms": 1000,
            "end_ms": 2000,
        }

        await ws_monitors_dismiss(hass, connection, msg)

        store.async_dismiss_window.assert_awaited_once()
        call_args = store.async_dismiss_window.call_args[0]
        assert call_args[0] == monitor_id
        assert call_args[1] == 1000
        assert call_args[2] == 2000
        # expires_at should be a non-None default (auto-computed)
        assert call_args[3] is not None
        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["dismissed"] is True

    async def test_GIVEN_end_before_start_WHEN_called_THEN_sends_error(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        monitors = [{"id": monitor_id, "look_back_hours": 24}]
        store = _make_store(monitors)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/dismiss",
            "monitor_id": monitor_id,
            "start_ms": 5000,
            "end_ms": 1000,
        }

        await ws_monitors_dismiss(hass, connection, msg)

        connection.send_error.assert_called_once()
        assert connection.send_error.call_args[0][1] == "invalid_input"

    async def test_GIVEN_monitor_not_found_WHEN_called_THEN_sends_error(self):
        import uuid as _uuid

        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/dismiss",
            "monitor_id": str(_uuid.uuid4()),
            "start_ms": 0,
            "end_ms": 1000,
        }

        await ws_monitors_dismiss(hass, connection, msg)

        connection.send_error.assert_called_once()
        assert connection.send_error.call_args[0][1] == "not_found"

    async def test_GIVEN_permanent_dismissal_WHEN_called_THEN_expires_at_is_none(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        monitors = [{"id": monitor_id, "look_back_hours": 24, "dismissed_windows": []}]
        store = _make_store(monitors)
        store.async_dismiss_window = AsyncMock(return_value=monitors[0])
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/dismiss",
            "monitor_id": monitor_id,
            "start_ms": 0,
            "end_ms": 1000,
            "expires_at": None,
        }

        await ws_monitors_dismiss(hass, connection, msg)

        call_args = store.async_dismiss_window.call_args[0]
        assert call_args[3] is None  # permanent

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        import uuid as _uuid

        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/dismiss",
            "monitor_id": str(_uuid.uuid4()),
            "start_ms": 0,
            "end_ms": 1000,
        }

        with pytest.raises(Unauthorized):
            await ws_monitors_dismiss(hass, connection, msg)


# ---------------------------------------------------------------------------
# ws_monitors_undismiss
# ---------------------------------------------------------------------------


class DescribeWsMonitorsUndismiss:
    async def test_GIVEN_valid_params_WHEN_called_THEN_removes_window(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        window_id = str(_uuid.uuid4())
        monitors = [{"id": monitor_id, "dismissed_windows": [{"id": window_id}]}]
        store = _make_store(monitors)
        store.async_undismiss_window = AsyncMock(return_value=monitors[0])
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/undismiss",
            "monitor_id": monitor_id,
            "window_id": window_id,
        }

        await ws_monitors_undismiss(hass, connection, msg)

        store.async_undismiss_window.assert_awaited_once_with(monitor_id, window_id)
        result = connection.send_result.call_args[0][1]
        assert result["removed"] is True

    async def test_GIVEN_monitor_not_found_WHEN_called_THEN_sends_error(self):
        import uuid as _uuid

        store = _make_store()
        store.async_undismiss_window = AsyncMock(return_value=None)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/undismiss",
            "monitor_id": str(_uuid.uuid4()),
            "window_id": str(_uuid.uuid4()),
        }

        await ws_monitors_undismiss(hass, connection, msg)

        connection.send_error.assert_called_once()
        assert connection.send_error.call_args[0][1] == "not_found"

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        import uuid as _uuid

        store = _make_store()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/undismiss",
            "monitor_id": str(_uuid.uuid4()),
            "window_id": str(_uuid.uuid4()),
        }

        with pytest.raises(Unauthorized):
            await ws_monitors_undismiss(hass, connection, msg)


# ---------------------------------------------------------------------------
# ws_get_anomalies — prepared-series migration (async_prepare_entity_series)
# ---------------------------------------------------------------------------

_WS = "custom_components.hass_datapoints.websocket_api"
_HU = "custom_components.hass_datapoints.history_utils"


def _recorder_sync():
    """Recorder whose async_add_executor_job runs its fn synchronously."""
    recorder = MagicMock()

    async def run(fn, *args):
        return fn(*args)

    recorder.async_add_executor_job = run
    return recorder


def _anomaly_msg(entity_id="sensor.temp", **overrides):
    msg = {
        "id": 1,
        "entity_id": entity_id,
        "start_time": "2024-01-01T00:00:00+00:00",
        "end_time": "2024-01-02T00:00:00+00:00",
        "anomaly_methods": ["iqr"],
        "anomaly_sensitivity": "medium",
        "anomaly_overlap_mode": "all",
        "anomaly_rate_window": "1h",
        "anomaly_zscore_window": "24h",
        "anomaly_persistence_window": "1h",
        "trend_method": "rolling_average",
        "trend_window": "24h",
        "sample_aggregate": "mean",
        "comparison_time_offset_ms": 0,
    }
    msg.update(overrides)
    return msg


class DescribeWsGetAnomaliesPreparedSeries:
    """ws_get_anomalies prepares its series through async_prepare_entity_series.

    GIVEN raw recorder points and long-term statistics
    WHEN ws_get_anomalies prepares the series
    THEN the pts handed to detection are byte-identical to a pre-refactor golden
    (merge stats below the raw boundary → sort → downsample → cap).
    """

    async def _capture_pts(self, msg, raw, stats, *, max_pts=None):
        captured: dict = {}

        async def fake_detect(hass_ref, pool, pts, config, comparison_pts, cancel):
            captured["pts"] = pts
            return []

        hass = MagicMock()
        hass.data = {DOMAIN: {}}  # no cache, no executor
        connection = _make_connection(is_admin=True)

        ctx = [
            patch(f"{_HU}.get_instance", return_value=_recorder_sync()),
            patch(f"{_HU}.fetch_entity_pts", return_value=raw),
            patch(f"{_HU}.fetch_entity_statistics_pts", return_value=stats),
            patch(f"{_WS}._run_detection_with_timeout", fake_detect),
        ]
        if max_pts is not None:
            ctx.append(patch(f"{_WS}.ANOMALY_MAX_PTS", max_pts))

        from contextlib import ExitStack

        with ExitStack() as stack:
            for p in ctx:
                stack.enter_context(p)
            await ws_get_anomalies(hass, connection, msg)

        connection.send_error.assert_not_called()
        return captured.get("pts")

    async def test_GIVEN_raw_and_stats_WHEN_no_sampling_THEN_merged_golden(self):
        raw = [[10_000, 1.0], [20_000, 2.0], [30_000, 3.0]]
        stats = [[5_000, 0.5], [15_000, 1.5]]  # 15_000 >= raw boundary → dropped

        pts = await self._capture_pts(_anomaly_msg(), raw, stats)

        # stat at 5_000 kept and merged ahead of the raw window; 15_000 dropped.
        assert pts == [[5_000, 0.5], [10_000, 1.0], [20_000, 2.0], [30_000, 3.0]]

    async def test_GIVEN_sampling_and_overflow_THEN_downsample_before_cap(self):
        # A late bucket holds multiple points: downsampling collapses it to one
        # bucket-mean BEFORE the cap keeps the last max_pts. If the cap ran first,
        # the last raw points (all in the late bucket) would collapse to a single
        # point and the result would differ — this golden locks the order.
        raw = [
            [60_000, 1.0],
            [120_000, 2.0],
            [300_000, 3.0],
            [330_000, 3.5],  # same 1m bucket as 300_000
        ]
        stats = [[0, 0.0]]  # below the raw boundary (60_000)
        msg = _anomaly_msg(sample_interval="1m", sample_aggregate="mean")

        pts = await self._capture_pts(msg, raw, stats, max_pts=3)

        # downsample → [[0,0.0],[60_000,1.0],[120_000,2.0],[300_000,3.25]]
        # then cap to last 3.
        assert pts == [[60_000, 1.0], [120_000, 2.0], [300_000, 3.25]]


class DescribeWsGetAnomaliesWarmCacheConsistency:
    """Behaviour change (AC4, option b): async_warm_cache routes through the same
    seam, so the clusters it warms under a sampled cache key match what a later
    ws_get_anomalies read computes for the same sampled series.
    """

    def _sync_run_in_executor(self, hass):
        import asyncio

        def run(pool, fn, *args):
            fut = asyncio.get_event_loop().create_future()
            fut.set_result(fn(*args))
            return fut

        hass.loop = MagicMock()
        hass.loop.run_in_executor = run

    async def test_GIVEN_sampled_warm_WHEN_read_via_ws_THEN_cached_hit_is_consistent(
        self, tmp_path
    ):
        from datetime import UTC, datetime, timedelta

        from custom_components.hass_datapoints.anomaly_cache import AnomalyCache
        from custom_components.hass_datapoints.anomaly_detection import (
            run_anomaly_detection,
        )
        from custom_components.hass_datapoints.history_utils import prepare_series
        from custom_components.hass_datapoints.sensor import async_warm_cache

        # Varied baseline (so IQR > 0) with a clear spike; 2-minute spacing keeps
        # each point in its own 1m bucket, so sampling preserves the outlier.
        base = 1_000_000
        values = [8.0, 9.0, 10.0, 11.0, 100.0, 12.0, 8.0, 9.0, 10.0]
        raw = [[base + i * 120_000, v] for i, v in enumerate(values)]
        stats = [[base - 300_000, 9.5], [base - 120_000, 10.5]]

        entity_id = "sensor.temp"
        sample_interval = "1m"
        monitor = {
            "id": "warm-consistency",
            "name": "Warm Consistency",
            "type": "individual",
            "entity_id": entity_id,
            "enabled": True,
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
            "anomaly_methods": ["iqr"],
            "sample_interval": sample_interval,
            "sample_aggregate": "mean",
            "last_cluster_count": 0,
            "scan_history": [],
        }
        store = _make_store(monitors=[monitor])

        cache = AnomalyCache(str(tmp_path / "anomaly.db"))

        # Freeze warm's clock to a point well outside the live edge so the later
        # ws read treats the range as closed (cache-eligible) and shares the key.
        fixed_now = datetime.now(UTC) - timedelta(hours=1)
        start_t = (fixed_now - timedelta(hours=24)).isoformat()
        end_t = fixed_now.isoformat()

        class _FrozenDatetime:
            @staticmethod
            def now(tz=None):
                return fixed_now

            @staticmethod
            def fromisoformat(value):
                return datetime.fromisoformat(value)

        warm_hass = MagicMock()
        warm_hass.data = {DOMAIN: {"anomaly_cache": cache}}
        self._sync_run_in_executor(warm_hass)

        with (
            patch(f"{_HU}.get_instance", return_value=_recorder_sync()),
            patch(f"{_HU}.fetch_entity_pts", return_value=list(raw)),
            patch(f"{_HU}.fetch_entity_statistics_pts", return_value=list(stats)),
            patch("custom_components.hass_datapoints.sensor.datetime", _FrozenDatetime),
            patch("asyncio.sleep", new=AsyncMock()),
        ):
            await async_warm_cache(warm_hass, store, MagicMock(), {})

        # Independently reconstruct the sampled series + its clusters.
        prepared = prepare_series(
            list(raw),
            list(stats),
            sample_interval=sample_interval,
            sample_aggregate="mean",
        )
        config = {
            "anomaly_methods": ["iqr"],
            "anomaly_sensitivity": "medium",
            "anomaly_overlap_mode": "all",
            "anomaly_rate_window": "1h",
            "anomaly_zscore_window": "24h",
            "anomaly_persistence_window": "1h",
            "trend_method": "rolling_average",
            "trend_window": "24h",
            "sample_interval": sample_interval,
            "sample_aggregate": "mean",
            "comparison_time_offset_ms": 0,
        }
        expected_sampled = run_anomaly_detection(prepared, config)
        # Sanity: the sampled series still contains the outlier.
        assert expected_sampled, "fixture should produce at least one cluster"

        # Now read via ws_get_anomalies with the SAME window + sampling → hit.
        read_hass = MagicMock()
        read_hass.data = {DOMAIN: {"anomaly_cache": cache, "executor": MagicMock()}}
        self._sync_run_in_executor(read_hass)
        connection = _make_connection(is_admin=True)
        msg = _anomaly_msg(
            entity_id,
            start_time=start_t,
            end_time=end_t,
            sample_interval=sample_interval,
        )

        await ws_get_anomalies(read_hass, connection, msg)

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["cached"] is True
        assert result["anomaly_clusters"] == expected_sampled

    async def test_GIVEN_warm_under_sampled_key_WHEN_read_with_other_sampling_THEN_miss(
        self, tmp_path
    ):
        """A different sample_interval yields a different cache key, so the warmed
        (sampled) entry is not mis-served — proving the key/content now agree."""
        from datetime import UTC, datetime, timedelta

        from custom_components.hass_datapoints.anomaly_cache import AnomalyCache
        from custom_components.hass_datapoints.sensor import async_warm_cache

        base = 1_000_000
        values = [8.0, 9.0, 10.0, 11.0, 100.0, 12.0, 8.0, 9.0, 10.0]
        raw = [[base + i * 120_000, v] for i, v in enumerate(values)]
        stats: list = []

        entity_id = "sensor.temp"
        monitor = {
            "id": "warm-key",
            "name": "Warm Key",
            "type": "individual",
            "entity_id": entity_id,
            "enabled": True,
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
            "anomaly_methods": ["iqr"],
            "sample_interval": "1m",
            "sample_aggregate": "mean",
            "last_cluster_count": 0,
            "scan_history": [],
        }
        store = _make_store(monitors=[monitor])
        cache = AnomalyCache(str(tmp_path / "anomaly.db"))

        fixed_now = datetime.now(UTC) - timedelta(hours=1)
        start_t = (fixed_now - timedelta(hours=24)).isoformat()
        end_t = fixed_now.isoformat()

        class _FrozenDatetime:
            @staticmethod
            def now(tz=None):
                return fixed_now

            @staticmethod
            def fromisoformat(value):
                return datetime.fromisoformat(value)

        warm_hass = MagicMock()
        warm_hass.data = {DOMAIN: {"anomaly_cache": cache}}
        self._sync_run_in_executor(warm_hass)

        with (
            patch(f"{_HU}.get_instance", return_value=_recorder_sync()),
            patch(f"{_HU}.fetch_entity_pts", return_value=list(raw)),
            patch(f"{_HU}.fetch_entity_statistics_pts", return_value=list(stats)),
            patch("custom_components.hass_datapoints.sensor.datetime", _FrozenDatetime),
            patch("asyncio.sleep", new=AsyncMock()),
        ):
            await async_warm_cache(warm_hass, store, MagicMock(), {})

        # Read with a DIFFERENT sample_interval → different key → miss (recomputes).
        read_hass = MagicMock()
        read_hass.data = {DOMAIN: {"anomaly_cache": cache, "executor": MagicMock()}}
        self._sync_run_in_executor(read_hass)
        connection = _make_connection(is_admin=True)
        msg = _anomaly_msg(
            entity_id,
            start_time=start_t,
            end_time=end_t,
            sample_interval="5m",
        )

        with (
            patch(f"{_HU}.get_instance", return_value=_recorder_sync()),
            patch(f"{_HU}.fetch_entity_pts", return_value=list(raw)),
            patch(f"{_HU}.fetch_entity_statistics_pts", return_value=list(stats)),
            patch(f"{_WS}._run_detection_with_timeout", new=AsyncMock(return_value=[])),
        ):
            await ws_get_anomalies(read_hass, connection, msg)

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["cached"] is False


# ---------------------------------------------------------------------------
# Per-method anomaly direction (#62)
# ---------------------------------------------------------------------------


class DescribeMonitorDirectionSchema:
    """GIVEN the shared monitor analysis schema fields."""

    def test_GIVEN_valid_directions_WHEN_validated_THEN_accepted(self):
        schema = vol.Schema(dict(_MONITOR_ANALYSIS_FIELDS))
        for field in ANOMALY_DIRECTION_FIELDS:
            for value in ("both", "up", "down"):
                assert schema({field: value})[field] == value

    def test_GIVEN_invalid_direction_WHEN_validated_THEN_rejected(self):
        schema = vol.Schema(dict(_MONITOR_ANALYSIS_FIELDS))
        for field in ANOMALY_DIRECTION_FIELDS:
            with pytest.raises(vol.Invalid):
                schema({field: "sideways"})

    def test_GIVEN_omitted_direction_WHEN_validated_THEN_absent_not_defaulted(self):
        # Monitor schema uses partial-update semantics: omitted fields are not
        # injected with a default; the stored-monitor construction fills "both".
        schema = vol.Schema(dict(_MONITOR_ANALYSIS_FIELDS))
        result = schema({})
        for field in ANOMALY_DIRECTION_FIELDS:
            assert field not in result


class DescribeWsMonitorsCreateDirection:
    async def test_GIVEN_direction_set_WHEN_created_THEN_stored_on_monitor(self):
        store = _make_store()
        hass = _make_hass(store, add_entities=MagicMock())
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "Freezer",
            "entity_id": "sensor.freezer",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
            "anomaly_methods": ["iqr"],
            "anomaly_iqr_direction": "up",
        }

        await ws_monitors_create(hass, connection, msg)

        created = store.async_create_monitor.call_args[0][0]
        assert created["anomaly_iqr_direction"] == "up"

    async def test_GIVEN_no_direction_WHEN_created_THEN_defaults_both(self):
        store = _make_store()
        hass = _make_hass(store, add_entities=MagicMock())
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/create",
            "monitor_type": "individual",
            "name": "Plain",
            "entity_id": "sensor.temp",
            "look_back_hours": 24,
            "scan_interval_minutes": 30,
        }

        await ws_monitors_create(hass, connection, msg)

        created = store.async_create_monitor.call_args[0][0]
        for field in ANOMALY_DIRECTION_FIELDS:
            assert created[field] == "both"


class DescribeWsMonitorsUpdateDirection:
    async def test_GIVEN_direction_update_WHEN_called_THEN_passed_through(self):
        import uuid as _uuid

        monitor_id = str(_uuid.uuid4())
        monitors = [{"id": monitor_id, "name": "Old", "enabled": True}]
        store = _make_store(monitors)
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/monitors/update",
            "monitor_id": monitor_id,
            "anomaly_rate_of_change_direction": "down",
        }

        await ws_monitors_update(hass, connection, msg)

        updates = store.async_update_monitor.call_args[0][1]
        assert updates["anomaly_rate_of_change_direction"] == "down"
