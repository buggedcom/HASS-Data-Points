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
# GIVEN a monitor built on the restart path and the live-create path
# WHEN both go through the factory
# ---------------------------------------------------------------------------


def test_setup_and_live_create_agree():
    """THEN both paths produce the identical unique-id set."""
    from custom_components.hass_datapoints.monitor_entities import (
        build_monitor_entities,
    )

    entry = _make_entry("ent1")
    store = _store_with_monitor("abc123")
    hass = MagicMock()

    def _ids(result):
        return {
            e._attr_unique_id
            for e in (*result.sensors, *result.binary_sensors, result.switch)
        }

    restart = build_monitor_entities(entry, store, hass, "abc123")
    live = build_monitor_entities(entry, store, hass, "abc123")

    assert _ids(restart) == _ids(live)
