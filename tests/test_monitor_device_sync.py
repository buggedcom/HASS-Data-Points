"""Tests for HA device → monitor name sync."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.monitor_device_sync import (
    async_setup_monitor_device_name_sync,
    async_sync_monitor_name_from_device,
    effective_device_name,
    monitor_id_from_identifiers,
)

ENTRY_ID = "entry1"
MONITOR_ID = "11111111-2222-3333-4444-555555555555"


def _device(name="Old name", name_by_user=None, monitor_id=MONITOR_ID):
    return SimpleNamespace(
        id="dev1",
        name=name,
        name_by_user=name_by_user,
        identifiers={(DOMAIN, f"{ENTRY_ID}_monitor_{monitor_id}")},
    )


def _store(monitor):
    store = MagicMock()
    store.get_monitor.side_effect = lambda mid: monitor if mid == MONITOR_ID else None
    store.async_update_monitor = AsyncMock()
    return store


def _patch_registry(device):
    registry = MagicMock()
    registry.async_get.return_value = device
    return patch(
        "homeassistant.helpers.device_registry.async_get", return_value=registry
    )


class TestMonitorIdFromIdentifiers:
    def test_given_monitor_identifier_then_returns_monitor_id(self):
        ids = {(DOMAIN, f"{ENTRY_ID}_monitor_{MONITOR_ID}")}
        assert monitor_id_from_identifiers(ENTRY_ID, ids) == MONITOR_ID

    def test_given_integration_device_then_returns_none(self):
        assert monitor_id_from_identifiers(ENTRY_ID, {(DOMAIN, ENTRY_ID)}) is None

    def test_given_other_domain_then_returns_none(self):
        ids = {("other", f"{ENTRY_ID}_monitor_{MONITOR_ID}")}
        assert monitor_id_from_identifiers(ENTRY_ID, ids) is None


class TestEffectiveDeviceName:
    def test_given_user_override_then_prefers_it(self):
        assert effective_device_name(_device("A", "B")) == "B"

    def test_given_no_override_then_uses_name(self):
        assert effective_device_name(_device("A", None)) == "A"


class TestSyncMonitorNameFromDevice:
    @pytest.mark.asyncio
    async def test_given_device_renamed_in_ha_then_monitor_renamed(self):
        store = _store({"id": MONITOR_ID, "name": "Old name"})
        with _patch_registry(_device("Old name", "Kitchen temp")):
            changed = await async_sync_monitor_name_from_device(
                MagicMock(), ENTRY_ID, store, "dev1"
            )
        assert changed is True
        store.async_update_monitor.assert_awaited_once_with(
            MONITOR_ID, {"name": "Kitchen temp"}
        )

    @pytest.mark.asyncio
    async def test_given_name_unchanged_then_no_update(self):
        store = _store({"id": MONITOR_ID, "name": "Same"})
        with _patch_registry(_device("Same", None)):
            changed = await async_sync_monitor_name_from_device(
                MagicMock(), ENTRY_ID, store, "dev1"
            )
        assert changed is False
        store.async_update_monitor.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_given_unknown_monitor_then_no_update(self):
        store = _store({"id": MONITOR_ID, "name": "Old"})
        with _patch_registry(_device("Old", "New", monitor_id="other")):
            changed = await async_sync_monitor_name_from_device(
                MagicMock(), ENTRY_ID, store, "dev1"
            )
        assert changed is False
        store.async_update_monitor.assert_not_awaited()


class TestSetupListener:
    def test_given_name_change_event_then_schedules_sync(self):
        hass = MagicMock()
        store = _store({"id": MONITOR_ID, "name": "Old"})
        async_setup_monitor_device_name_sync(hass, ENTRY_ID, store)
        handler = hass.bus.async_listen.call_args[0][1]

        handler(
            SimpleNamespace(
                data={
                    "action": "update",
                    "device_id": "dev1",
                    "changes": {"name_by_user": None},
                }
            )
        )
        assert hass.async_create_task.call_count == 1
        hass.async_create_task.call_args[0][0].close()

    def test_given_unrelated_change_then_ignored(self):
        hass = MagicMock()
        async_setup_monitor_device_name_sync(hass, ENTRY_ID, MagicMock())
        handler = hass.bus.async_listen.call_args[0][1]
        handler(
            SimpleNamespace(
                data={"action": "update", "device_id": "d", "changes": {"area_id": 1}}
            )
        )
        hass.async_create_task.assert_not_called()
