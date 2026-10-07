"""Shared identity helpers for per-monitor entities.

This module is deliberately import-light: it depends only on ``DOMAIN`` and
Home Assistant's ``DeviceInfo``, never on the entity classes themselves. That
keeps it free of import cycles so the structured ``build_monitor_entities``
factory can live beside these helpers with function-local entity imports.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.components.binary_sensor import BinarySensorEntity
    from homeassistant.components.sensor import SensorEntity
    from homeassistant.components.switch import SwitchEntity
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from .store import DatapointsStore


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


@dataclass
class MonitorEntities:
    """The structured roster of entities for one monitor.

    The shape mirrors the three platforms and their tracking maps:
    ``sensors[0]`` is the main ``DatapointsMonitorSensor`` (the only sensor
    tracked for timer reschedule + explicit ``async_remove``; the other five
    die via the device-registry cascade), ``binary_sensors`` is the
    ``(stalled, problem)`` tuple, and ``switch`` is the single enabled switch.
    """

    sensors: list[SensorEntity]
    binary_sensors: tuple[BinarySensorEntity, BinarySensorEntity]
    switch: SwitchEntity


def build_monitor_entities(
    entry: ConfigEntry,
    store: DatapointsStore,
    hass: HomeAssistant,
    monitor_id: str,
) -> MonitorEntities:
    """Build the full per-monitor entity roster as a structured result.

    Entity-class imports are kept function-local: the factory must import the
    9 classes while the three platforms import this factory, so a module-level
    import would create a load-time cycle.
    """
    from .binary_sensor import (  # noqa: PLC0415
        DatapointsMonitorProblemBinarySensor,
        DatapointsMonitorStalledBinarySensor,
    )
    from .sensor import (  # noqa: PLC0415
        DatapointsMonitorAnomalyDurationSensor,
        DatapointsMonitorConsecutiveScansSensor,
        DatapointsMonitorDataPointsSensor,
        DatapointsMonitorLastAnomalySensor,
        DatapointsMonitorLastScanSensor,
        DatapointsMonitorSensor,
    )
    from .switch import DatapointsMonitorEnabledSwitch  # noqa: PLC0415

    # sensors[0] must be the main sensor (tracked individually on delete).
    sensors: list[SensorEntity] = [
        DatapointsMonitorSensor(entry, store, hass, monitor_id),
        DatapointsMonitorConsecutiveScansSensor(entry, store, monitor_id),
        DatapointsMonitorLastScanSensor(entry, store, monitor_id),
        DatapointsMonitorLastAnomalySensor(entry, store, monitor_id),
        DatapointsMonitorAnomalyDurationSensor(entry, store, hass, monitor_id),
        DatapointsMonitorDataPointsSensor(entry, store, monitor_id),
    ]
    binary_sensors = (
        DatapointsMonitorStalledBinarySensor(entry, store, hass, monitor_id),
        DatapointsMonitorProblemBinarySensor(entry, store, hass, monitor_id),
    )
    switch = DatapointsMonitorEnabledSwitch(entry, store, hass, monitor_id)

    return MonitorEntities(
        sensors=sensors,
        binary_sensors=binary_sensors,
        switch=switch,
    )
