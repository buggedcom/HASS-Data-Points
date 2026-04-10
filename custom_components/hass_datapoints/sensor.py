"""Sensor platform for Hass Data Points."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .store import DatapointsStore

_UPDATE_INTERVAL = timedelta(minutes=5)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Hass Data Points sensor entities from a config entry."""
    store: DatapointsStore = hass.data[DOMAIN]["store"]
    async_add_entities(
        [
            DatapointsCountSensor(entry, store),
            DatapointsLastTimestampSensor(entry, store),
            DatapointsLastMessageSensor(entry, store),
            DatapointsTimeSinceLastSensor(entry, store, hass),
            DatapointsTodayCountSensor(entry, store, hass),
            DatapointsWeekCountSensor(entry, store, hass),
            DatapointsAutomationCountSensor(entry, store),
            DatapointsManualCountSensor(entry, store),
        ]
    )


# ---------------------------------------------------------------------------
# Base classes
# ---------------------------------------------------------------------------


class _DatapointsSensorBase(SensorEntity):
    """Shared base for all Hass Data Points sensor entities."""

    _attr_has_entity_name = True

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise with config entry and data store."""
        self._entry = entry
        self._store = store

    @property
    def device_info(self) -> DeviceInfo:
        """Return device information shared across all sensors."""
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry.entry_id)},
            name="Hass Data Points",
            manufacturer="buggedcom",
            model="Data Points",
        )

    async def async_added_to_hass(self) -> None:
        """Register store listener when entity is added."""
        await super().async_added_to_hass()
        self.async_on_remove(self._store.async_add_listener(self._handle_store_update))

    def _handle_store_update(self) -> None:
        """Refresh state after any store mutation."""
        self._attr_native_value = self._compute()
        self.async_write_ha_state()

    def _compute(self) -> Any:
        """Compute the current sensor value. Override in subclasses."""
        raise NotImplementedError


class _DatapointsPeriodicSensorBase(_DatapointsSensorBase):
    """Base for sensors that need periodic time-driven refreshes as well as store updates."""

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise with config entry, data store, and hass instance."""
        super().__init__(entry, store)
        self._hass = hass

    async def async_added_to_hass(self) -> None:
        """Register store listener and periodic refresh timer."""
        await super().async_added_to_hass()
        self.async_on_remove(
            async_track_time_interval(
                self._hass, self._handle_time_interval, _UPDATE_INTERVAL
            )
        )

    def _handle_time_interval(self, now: datetime) -> None:
        """Refresh state on every timer tick."""
        self._attr_native_value = self._compute()
        self.async_write_ha_state()


# ---------------------------------------------------------------------------
# Concrete sensors
# ---------------------------------------------------------------------------


class DatapointsCountSensor(_DatapointsSensorBase):
    """Expose the total number of recorded datapoints."""

    _attr_icon = "mdi:counter"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the datapoint count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_datapoint_count"
        self._attr_name = "Datapoint count"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        return self._store.get_event_count()


class DatapointsLastTimestampSensor(_DatapointsSensorBase):
    """Expose the timestamp of the most recently recorded datapoint."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:clock-outline"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the last recorded timestamp sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_last_timestamp"
        self._attr_name = "Last recorded"
        self._attr_native_value = self._compute()

    def _compute(self) -> datetime | None:
        event = self._store.get_last_event()
        if event is None:
            return None
        ts = event.get("timestamp")
        if not ts:
            return None
        try:
            dt = datetime.fromisoformat(ts)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt


class DatapointsLastMessageSensor(_DatapointsSensorBase):
    """Expose the message of the most recently recorded datapoint."""

    _attr_icon = "mdi:text"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the last recorded message sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_last_message"
        self._attr_name = "Last message"
        self._attr_native_value = self._compute()

    def _compute(self) -> str | None:
        event = self._store.get_last_event()
        if event is None:
            return None
        return event.get("message")


class DatapointsTimeSinceLastSensor(_DatapointsPeriodicSensorBase):
    """Expose the hours elapsed since the most recently recorded datapoint."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_suggested_display_precision = 1
    _attr_icon = "mdi:timer-outline"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise the time-since-last sensor."""
        super().__init__(entry, store, hass)
        self._attr_unique_id = f"{entry.entry_id}_time_since_last"
        self._attr_name = "Time since last datapoint"
        self._attr_native_value = self._compute()

    def _compute(self) -> float | None:
        event = self._store.get_last_event()
        if event is None:
            return None
        ts = event.get("timestamp")
        if not ts:
            return None
        try:
            dt = datetime.fromisoformat(ts)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        delta = dt_util.now() - dt
        return round(delta.total_seconds() / 3600, 1)


class DatapointsTodayCountSensor(_DatapointsPeriodicSensorBase):
    """Expose the count of datapoints recorded since the start of today (local time)."""

    _attr_icon = "mdi:calendar-today"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise the today count sensor."""
        super().__init__(entry, store, hass)
        self._attr_unique_id = f"{entry.entry_id}_today_count"
        self._attr_name = "Recorded today"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        today_start = dt_util.as_utc(dt_util.start_of_local_day())
        return self._store.get_events_count_in_range(start=today_start.isoformat())


class DatapointsWeekCountSensor(_DatapointsPeriodicSensorBase):
    """Expose the count of datapoints recorded since the start of this week (Mon, local time)."""

    _attr_icon = "mdi:calendar-week"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise the week count sensor."""
        super().__init__(entry, store, hass)
        self._attr_unique_id = f"{entry.entry_id}_week_count"
        self._attr_name = "Recorded this week"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        today_start = dt_util.start_of_local_day()
        week_start = dt_util.as_utc(today_start - timedelta(days=today_start.weekday()))
        return self._store.get_events_count_in_range(start=week_start.isoformat())


class DatapointsAutomationCountSensor(_DatapointsSensorBase):
    """Expose the count of automation-triggered datapoints."""

    _attr_icon = "mdi:robot"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the automation count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_automation_count"
        self._attr_name = "Automation recorded"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        automation, _ = self._store.get_automation_manual_counts()
        return automation


class DatapointsManualCountSensor(_DatapointsSensorBase):
    """Expose the count of manually recorded datapoints."""

    _attr_icon = "mdi:hand-back-right"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the manual count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_manual_count"
        self._attr_name = "Manually recorded"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        _, manual = self._store.get_automation_manual_counts()
        return manual
