"""Two-way name sync between anomaly monitors and their HA devices.

Datapoints → HA is handled by ``monitors/update`` (it writes the device name).
This module handles HA → Datapoints: when the user renames a monitor's device
in Home Assistant (which sets ``name_by_user``), the stored monitor record is
renamed to match so the Datapoints UI shows the same name.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Iterable
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def monitor_id_from_identifiers(
    entry_id: str, identifiers: Iterable[tuple[str, str]]
) -> str | None:
    """Return the monitor id encoded in a device's identifiers, if any.

    Mirrors :func:`monitor_entities.monitor_device_identifier`, which builds
    ``(DOMAIN, f"{entry_id}_monitor_{monitor_id}")``.
    """
    prefix = f"{entry_id}_monitor_"
    for domain, value in identifiers:
        if domain == DOMAIN and isinstance(value, str) and value.startswith(prefix):
            monitor_id = value[len(prefix) :]
            if monitor_id:
                return monitor_id
    return None


def effective_device_name(device: Any) -> str | None:
    """Return the name HA displays for *device* (user override first)."""
    name = getattr(device, "name_by_user", None) or getattr(device, "name", None)
    if isinstance(name, str) and name.strip():
        return name.strip()
    return None


async def async_sync_monitor_name_from_device(
    hass: HomeAssistant, entry_id: str, store: Any, device_id: str
) -> bool:
    """Copy a monitor device's displayed name onto its stored monitor record.

    Returns True when the stored name was changed.
    """
    from homeassistant.helpers import device_registry as dr  # noqa: PLC0415

    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        return False
    monitor_id = monitor_id_from_identifiers(entry_id, device.identifiers)
    if monitor_id is None:
        return False
    monitor = store.get_monitor(monitor_id)
    if not monitor or monitor.get("deleted_at"):
        return False
    name = effective_device_name(device)
    if name is None or name == monitor.get("name"):
        return False
    _LOGGER.debug(
        "hass_datapoints: syncing monitor %s name from HA device: %r",
        monitor_id,
        name,
    )
    await store.async_update_monitor(monitor_id, {"name": name})
    return True


def async_setup_monitor_device_name_sync(
    hass: HomeAssistant, entry_id: str, store: Any
) -> Callable[[], None]:
    """Listen for monitor device renames in HA; return the unsubscribe callable."""
    from homeassistant.helpers import device_registry as dr  # noqa: PLC0415

    @callback
    def _on_device_updated(event: Event) -> None:
        data = event.data
        if data.get("action") != "update":
            return
        changes = data.get("changes") or {}
        if "name_by_user" not in changes and "name" not in changes:
            return
        device_id = data.get("device_id")
        if not device_id:
            return
        hass.async_create_task(
            async_sync_monitor_name_from_device(hass, entry_id, store, device_id)
        )

    return hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, _on_device_updated)
