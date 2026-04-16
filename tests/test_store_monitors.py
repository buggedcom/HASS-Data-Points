"""Tests for DatapointsStore monitor CRUD and ring buffer."""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture()
def store(mock_store):
    return mock_store


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_migration_adds_monitors_key(store):
    """Loaded data without 'monitors' key gets an empty list injected."""
    store._store.async_load = AsyncMock(return_value={"events": []})
    await store.async_load()
    assert "monitors" in store._data
    assert store._data["monitors"] == []


@pytest.mark.asyncio
async def test_migration_preserves_existing_monitors(store):
    """If 'monitors' already present it is not overwritten."""
    existing = [{"id": "abc", "name": "Test"}]
    store._store.async_load = AsyncMock(return_value={"events": [], "monitors": existing})
    await store.async_load()
    assert store._data["monitors"] == existing


# ---------------------------------------------------------------------------
# Getters
# ---------------------------------------------------------------------------


def test_get_monitors_empty(store):
    store._data["monitors"] = []
    assert store.get_monitors() == []


def test_get_monitors_returns_copy(store):
    store._data["monitors"] = [{"id": "x"}]
    result = store.get_monitors()
    assert result == [{"id": "x"}]
    result.append({"id": "y"})
    assert len(store._data["monitors"]) == 1


def test_get_monitor_found(store):
    store._data["monitors"] = [{"id": "aaa", "name": "MyMon"}]
    m = store.get_monitor("aaa")
    assert m is not None
    assert m["name"] == "MyMon"


def test_get_monitor_not_found(store):
    store._data["monitors"] = [{"id": "aaa"}]
    assert store.get_monitor("bbb") is None


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_monitor(store):
    monitor = {"id": "m1", "name": "Mon 1", "type": "individual"}
    result = await store.async_create_monitor(monitor)
    assert result == monitor
    assert store._data["monitors"] == [monitor]
    store._store.async_save.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_monitor_notifies_listeners(store):
    called = []
    store.async_add_listener(lambda: called.append(1))
    await store.async_create_monitor({"id": "x"})
    assert len(called) == 1


@pytest.mark.asyncio
async def test_update_monitor(store):
    store._data["monitors"] = [{"id": "m1", "name": "Old", "enabled": True}]
    result = await store.async_update_monitor("m1", {"name": "New", "enabled": False})
    assert result is not None
    assert result["name"] == "New"
    assert result["enabled"] is False
    store._store.async_save.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_monitor_not_found(store):
    store._data["monitors"] = []
    result = await store.async_update_monitor("missing", {"name": "X"})
    assert result is None


@pytest.mark.asyncio
async def test_update_monitor_notifies_listeners(store):
    store._data["monitors"] = [{"id": "m1"}]
    called = []
    store.async_add_listener(lambda: called.append(1))
    await store.async_update_monitor("m1", {"x": 1})
    assert len(called) == 1


@pytest.mark.asyncio
async def test_delete_monitor(store):
    store._data["monitors"] = [{"id": "m1"}, {"id": "m2"}]
    result = await store.async_delete_monitor("m1")
    assert result is True
    assert len(store._data["monitors"]) == 1
    assert store._data["monitors"][0]["id"] == "m2"
    store._store.async_save.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_monitor_not_found(store):
    store._data["monitors"] = []
    result = await store.async_delete_monitor("missing")
    assert result is False
    store._store.async_save.assert_not_awaited()


@pytest.mark.asyncio
async def test_delete_monitor_notifies_listeners(store):
    store._data["monitors"] = [{"id": "m1"}]
    called = []
    store.async_add_listener(lambda: called.append(1))
    await store.async_delete_monitor("m1")
    assert len(called) == 1


# ---------------------------------------------------------------------------
# Ring buffer
# ---------------------------------------------------------------------------


def test_append_scan_history_basic():
    from custom_components.hass_datapoints.store import DatapointsStore

    monitor: dict = {}
    DatapointsStore.append_scan_history(monitor, "2024-01-01T00:00:00", 3)
    assert monitor["scan_history"] == [{"t": "2024-01-01T00:00:00", "count": 3}]


def test_append_scan_history_cap():
    from custom_components.hass_datapoints.store import DatapointsStore

    monitor: dict = {}
    for i in range(100):
        DatapointsStore.append_scan_history(monitor, f"t{i}", i, max_entries=96)
    assert len(monitor["scan_history"]) == 96
    # Should keep most recent 96 entries
    assert monitor["scan_history"][0]["t"] == "t4"
    assert monitor["scan_history"][-1]["t"] == "t99"


def test_append_scan_history_creates_key():
    from custom_components.hass_datapoints.store import DatapointsStore

    monitor: dict = {}
    DatapointsStore.append_scan_history(monitor, "t0", 0)
    assert "scan_history" in monitor


# ---------------------------------------------------------------------------
# Migration — baseline_entity_id and dismissed_windows
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_migration_adds_baseline_entity_id_to_existing_monitors(store):
    """Monitors loaded without baseline_entity_id get None injected."""
    existing = [{"id": "m1", "name": "Old monitor"}]
    store._store.async_load = AsyncMock(return_value={"events": [], "monitors": existing})
    await store.async_load()
    assert store._data["monitors"][0].get("baseline_entity_id") is None


@pytest.mark.asyncio
async def test_migration_adds_dismissed_windows_to_existing_monitors(store):
    """Monitors loaded without dismissed_windows get an empty list injected."""
    existing = [{"id": "m1", "name": "Old monitor"}]
    store._store.async_load = AsyncMock(return_value={"events": [], "monitors": existing})
    await store.async_load()
    assert store._data["monitors"][0].get("dismissed_windows") == []


@pytest.mark.asyncio
async def test_migration_preserves_existing_dismissed_windows(store):
    """If dismissed_windows already present it is not overwritten."""
    window = {"id": "w1", "start_ms": 1000, "end_ms": 2000, "dismissed_at": "2024-01-01", "expires_at": None}
    existing = [{"id": "m1", "dismissed_windows": [window]}]
    store._store.async_load = AsyncMock(return_value={"events": [], "monitors": existing})
    await store.async_load()
    assert store._data["monitors"][0]["dismissed_windows"] == [window]


# ---------------------------------------------------------------------------
# async_dismiss_window
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_async_dismiss_window_appends_entry(store):
    store._data["monitors"] = [{"id": "m1", "dismissed_windows": []}]
    result = await store.async_dismiss_window("m1", 1000, 2000, "2099-01-01T00:00:00+00:00")
    assert result is not None
    assert len(result["dismissed_windows"]) == 1
    w = result["dismissed_windows"][0]
    assert w["start_ms"] == 1000
    assert w["end_ms"] == 2000
    assert w["expires_at"] == "2099-01-01T00:00:00+00:00"
    assert "id" in w
    assert "dismissed_at" in w
    store._store.async_save.assert_awaited()


@pytest.mark.asyncio
async def test_async_dismiss_window_permanent(store):
    store._data["monitors"] = [{"id": "m1", "dismissed_windows": []}]
    result = await store.async_dismiss_window("m1", 0, 999, None)
    assert result["dismissed_windows"][0]["expires_at"] is None


@pytest.mark.asyncio
async def test_async_dismiss_window_not_found(store):
    store._data["monitors"] = []
    result = await store.async_dismiss_window("missing", 0, 999, None)
    assert result is None


# ---------------------------------------------------------------------------
# async_undismiss_window
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_async_undismiss_window_removes_entry(store):
    store._data["monitors"] = [{"id": "m1", "dismissed_windows": [
        {"id": "w1", "start_ms": 0, "end_ms": 1000},
        {"id": "w2", "start_ms": 2000, "end_ms": 3000},
    ]}]
    result = await store.async_undismiss_window("m1", "w1")
    assert result is not None
    assert len(result["dismissed_windows"]) == 1
    assert result["dismissed_windows"][0]["id"] == "w2"
    store._store.async_save.assert_awaited()


@pytest.mark.asyncio
async def test_async_undismiss_window_noop_when_window_not_found(store):
    store._data["monitors"] = [{"id": "m1", "dismissed_windows": [
        {"id": "w1", "start_ms": 0, "end_ms": 1000},
    ]}]
    result = await store.async_undismiss_window("m1", "not-a-real-window")
    assert result is not None
    assert len(result["dismissed_windows"]) == 1  # unchanged
    store._store.async_save.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_undismiss_window_monitor_not_found(store):
    store._data["monitors"] = []
    result = await store.async_undismiss_window("missing", "w1")
    assert result is None


# ---------------------------------------------------------------------------
# prune_dismissed_windows
# ---------------------------------------------------------------------------


def test_prune_dismissed_windows_removes_expired():
    from custom_components.hass_datapoints.store import DatapointsStore
    from datetime import UTC, datetime

    monitor = {
        "dismissed_windows": [
            {"id": "w1", "start_ms": 0, "end_ms": 1000, "expires_at": "2000-01-01T00:00:00+00:00"},
        ]
    }
    DatapointsStore.prune_dismissed_windows(monitor, datetime.now(UTC))
    assert monitor["dismissed_windows"] == []


def test_prune_dismissed_windows_keeps_permanent():
    from custom_components.hass_datapoints.store import DatapointsStore
    from datetime import UTC, datetime

    monitor = {
        "dismissed_windows": [
            {"id": "w1", "start_ms": 0, "end_ms": 1000, "expires_at": None},
        ]
    }
    DatapointsStore.prune_dismissed_windows(monitor, datetime.now(UTC))
    assert len(monitor["dismissed_windows"]) == 1


def test_prune_dismissed_windows_keeps_future_expiry():
    from custom_components.hass_datapoints.store import DatapointsStore
    from datetime import UTC, datetime

    monitor = {
        "dismissed_windows": [
            {"id": "w1", "start_ms": 0, "end_ms": 1000, "expires_at": "2099-01-01T00:00:00+00:00"},
        ]
    }
    DatapointsStore.prune_dismissed_windows(monitor, datetime.now(UTC))
    assert len(monitor["dismissed_windows"]) == 1


def test_prune_dismissed_windows_drops_malformed():
    from custom_components.hass_datapoints.store import DatapointsStore
    from datetime import UTC, datetime

    monitor = {
        "dismissed_windows": [
            {"id": "w1", "start_ms": 0, "end_ms": 1000, "expires_at": "not-a-date"},
        ]
    }
    DatapointsStore.prune_dismissed_windows(monitor, datetime.now(UTC))
    assert monitor["dismissed_windows"] == []
