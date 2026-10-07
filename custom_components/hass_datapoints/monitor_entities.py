"""Shared identity helpers for per-monitor entities.

This module is deliberately import-light: it depends only on ``DOMAIN`` and
Home Assistant's ``DeviceInfo``, never on the entity classes themselves. That
keeps it free of import cycles so the structured ``build_monitor_entities``
factory can live beside these helpers with function-local entity imports.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN


def monitor_device_identifier(entry_id: str, monitor_id: str) -> tuple[str, str]:
    """Return the HA device-registry identifier tuple for a monitor.

    This is the single source of truth for the ``(DOMAIN, ...)`` identifier
    shared by all per-monitor entities and the registry device itself.
    """
    return (DOMAIN, f"{entry_id}_monitor_{monitor_id}")


def monitor_device_info(
    entry_id: str, monitor_id: str, monitor: Mapping[str, Any] | None
) -> DeviceInfo:
    """Return DeviceInfo for the per-monitor device.

    Each monitor is its own device, nested under the main integration device
    via ``via_device``.
    """
    monitor = monitor or {}
    return DeviceInfo(
        identifiers={monitor_device_identifier(entry_id, monitor_id)},
        name=monitor.get("name", f"Anomaly monitor {monitor_id[:8]}"),
        manufacturer="buggedcom",
        model="Anomaly Monitor",
        via_device=(DOMAIN, entry_id),
    )
