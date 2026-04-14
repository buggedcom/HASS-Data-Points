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
