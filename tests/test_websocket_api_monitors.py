"""Tests for anomaly monitor WebSocket command handlers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import (
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
