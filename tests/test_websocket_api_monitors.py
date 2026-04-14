"""Tests for anomaly monitor WebSocket command handlers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import (
    DOMAIN,
    KEY_ADD_SENSOR_ENTITIES,
    KEY_MONITOR_SENSORS,
    KEY_STORE,
)
from custom_components.hass_datapoints.websocket_api import (
    _require_admin,
    ws_monitors_create,
    ws_monitors_delete,
    ws_monitors_list,
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
    return store


def _make_hass(store, sensors=None, add_entities=None):
    hass = MagicMock()
    hass.data = {
        DOMAIN: {
            KEY_STORE: store,
            KEY_MONITOR_SENSORS: sensors if sensors is not None else {},
            KEY_ADD_SENSOR_ENTITIES: add_entities or MagicMock(),
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
    async def test_GIVEN_valid_individual_payload_WHEN_called_THEN_creates_monitor(self):
        store = _make_store()
        add_entities = MagicMock()
        hass = _make_hass(store, add_entities=add_entities)
        connection = _make_connection()

        import uuid as _uuid

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

        with patch(
            "custom_components.hass_datapoints.sensor.DatapointsMonitorSensor"
        ) as mock_sensor_cls:
            mock_sensor_cls.return_value = MagicMock()
            await ws_monitors_create(hass, connection, msg)

        store.async_create_monitor.assert_awaited_once()
        created_monitor = store.async_create_monitor.call_args[0][0]
        assert created_monitor["name"] == "My Monitor"
        assert created_monitor["entity_id"] == "sensor.temp"
        assert created_monitor["type"] == "individual"
        add_entities.assert_called_once()
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

        connection.send_error.assert_called_once_with(1, "not_found", "Monitor not found")

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

        connection.send_error.assert_called_once_with(1, "not_found", "Monitor not found")

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
