"""Tests for the structured build_monitor_entities factory."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock


def _make_store(monitors=None):
    from custom_components.hass_datapoints.store import DatapointsStore

    store = DatapointsStore(MagicMock(), ":memory:")
    inner = MagicMock()
    inner.async_load = AsyncMock(return_value=None)
    inner.async_save = AsyncMock(return_value=None)
    store._store = inner
    store._data = {"monitors": monitors or []}
    return store


def _make_entry(entry_id="test_entry"):
    entry = MagicMock()
    entry.entry_id = entry_id
    return entry


def _store_with_monitor(monitor_id="abc123"):
    return _make_store(
        monitors=[{"id": monitor_id, "name": "Test Monitor", "last_cluster_count": 0}]
    )


# ---------------------------------------------------------------------------
# GIVEN a monitor id WHEN build_monitor_entities is called
# ---------------------------------------------------------------------------


def test_factory_returns_structured_roster():
    """THEN it returns MonitorEntities with 6 sensors / 2 binaries / 1 switch."""
    from custom_components.hass_datapoints.monitor_entities import (
        build_monitor_entities,
    )
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    entry = _make_entry("ent1")
    store = _store_with_monitor("abc123")
    hass = MagicMock()

    result = build_monitor_entities(entry, store, hass, "abc123")

    assert len(result.sensors) == 6
    assert isinstance(result.sensors[0], DatapointsMonitorSensor)
    assert len(result.binary_sensors) == 2
    assert result.switch is not None


def test_factory_covers_all_nine_unique_ids():
    """THEN the roster spans exactly the 9 pinned per-monitor unique_ids."""
    from custom_components.hass_datapoints.monitor_entities import (
        build_monitor_entities,
    )

    entry = _make_entry("ent1")
    store = _store_with_monitor("abc123")
    hass = MagicMock()

    result = build_monitor_entities(entry, store, hass, "abc123")
    all_entities = [
        *result.sensors,
        *result.binary_sensors,
        result.switch,
    ]
    unique_ids = {e._attr_unique_id for e in all_entities}

    assert unique_ids == {
        "ent1_monitor_abc123",
        "ent1_monitor_abc123_consecutive_scans",
        "ent1_monitor_abc123_last_scan_at",
        "ent1_monitor_abc123_last_anomaly_at",
        "ent1_monitor_abc123_anomaly_duration",
        "ent1_monitor_abc123_data_points",
        "ent1_monitor_abc123_stalled",
        "ent1_monitor_abc123_problem",
        "ent1_monitor_abc123_enabled",
    }


# ---------------------------------------------------------------------------
# GIVEN a monitor materialized on the restart path and the live-create path
# WHEN each real wiring path runs
# ---------------------------------------------------------------------------


def _domain_data(store):
    from custom_components.hass_datapoints.const import (
        KEY_ADD_BINARY_SENSOR_ENTITIES,
        KEY_ADD_SENSOR_ENTITIES,
        KEY_ADD_SWITCH_ENTITIES,
        KEY_MONITOR_BINARY_SENSORS,
        KEY_MONITOR_SENSORS,
        KEY_MONITOR_SWITCHES,
        KEY_STORE,
    )

    return {
        KEY_STORE: store,
        KEY_MONITOR_SENSORS: {},
        KEY_MONITOR_BINARY_SENSORS: {},
        KEY_MONITOR_SWITCHES: {},
        KEY_ADD_SENSOR_ENTITIES: MagicMock(),
        KEY_ADD_BINARY_SENSOR_ENTITIES: MagicMock(),
        KEY_ADD_SWITCH_ENTITIES: MagicMock(),
    }


def _delivered_monitor_unique_ids(domain_data, monitor_id):
    """Collect unique_ids delivered to the three add-callbacks for a monitor."""
    from custom_components.hass_datapoints.const import (
        KEY_ADD_BINARY_SENSOR_ENTITIES,
        KEY_ADD_SENSOR_ENTITIES,
        KEY_ADD_SWITCH_ENTITIES,
    )

    unique_ids: set[str] = set()
    for key in (
        KEY_ADD_SENSOR_ENTITIES,
        KEY_ADD_BINARY_SENSOR_ENTITIES,
        KEY_ADD_SWITCH_ENTITIES,
    ):
        for call in domain_data[key].call_args_list:
            for entity in call.args[0]:
                uid = entity._attr_unique_id
                if uid and f"_monitor_{monitor_id}" in uid:
                    unique_ids.add(uid)
    return unique_ids


async def test_setup_and_live_create_agree():
    """THEN the restart platform setups and the live-create path agree.

    Drives the real wiring paths — the three ``async_setup_entry`` callbacks
    (restart rehydration) and ``_register_monitor_entities`` (live create) —
    rather than calling the factory directly, and compares the unique-id sets
    actually delivered to the platform add-callbacks.
    """
    from custom_components.hass_datapoints import (
        binary_sensor,
        sensor,
        switch,
    )
    from custom_components.hass_datapoints.const import (
        DOMAIN,
        KEY_ADD_BINARY_SENSOR_ENTITIES,
        KEY_ADD_SENSOR_ENTITIES,
        KEY_ADD_SWITCH_ENTITIES,
    )
    from custom_components.hass_datapoints.websocket_api import (
        _register_monitor_entities,
    )

    entry = _make_entry("ent1")

    # --- Restart path: run the three platform setups. ---
    restart_store = _store_with_monitor("abc123")
    restart_data = _domain_data(restart_store)
    restart_hass = MagicMock()
    restart_hass.data = {DOMAIN: restart_data}
    await sensor.async_setup_entry(
        restart_hass, entry, restart_data[KEY_ADD_SENSOR_ENTITIES]
    )
    await binary_sensor.async_setup_entry(
        restart_hass, entry, restart_data[KEY_ADD_BINARY_SENSOR_ENTITIES]
    )
    await switch.async_setup_entry(
        restart_hass, entry, restart_data[KEY_ADD_SWITCH_ENTITIES]
    )
    restart_ids = _delivered_monitor_unique_ids(restart_hass.data[DOMAIN], "abc123")

    # --- Live-create path: run _register_monitor_entities. ---
    live_store = _store_with_monitor("abc123")
    live_data = _domain_data(live_store)
    live_hass = MagicMock()
    live_hass.data = {DOMAIN: live_data}
    live_hass.config_entries.async_entries.return_value = [entry]
    assert _register_monitor_entities(live_hass, "abc123") is True
    live_ids = _delivered_monitor_unique_ids(live_hass.data[DOMAIN], "abc123")

    assert restart_ids == live_ids
    assert len(restart_ids) == 9
