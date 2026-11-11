"""Sensor platform for Hass Data Points."""

from __future__ import annotations

import asyncio
import logging
import threading
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import partial
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_call_later, async_track_time_interval
from homeassistant.util import dt as dt_util

from .anomaly_detection import check_cancel, run_anomaly_detection
from .const import (
    ANOMALY_DIRECTION_FIELDS,
    ANOMALY_MAX_PTS,
    DEFAULT_ANOMALY_DIRECTION,
    DOMAIN,
    EVENT_ANOMALY_DETECTED,
    EVENT_ANOMALY_RESOLVED,
    KEY_ADD_SENSOR_ENTITIES,
    KEY_MONITOR_SENSORS,
    KEY_STORE,
    MONITOR_DEFAULT_LOOK_BACK_HOURS,
)
from .detection_runner import (
    ERROR_BUSY,
    ERROR_CANCELLED,
    ERROR_TIMEOUT,
    SCAN_ERROR_UNVERIFIED,
    DetectionBusy,
    DetectionCancelled,
    DetectionJob,
    DetectionRunner,
    DetectionTimeout,
    error_code,
)
from .history_utils import (
    async_prepare_entity_series,
    fetch_entity_pts,
)
from .monitor_entities import monitor_device_info
from .store import DatapointsStore

_LOGGER = logging.getLogger(__name__)

_UPDATE_INTERVAL = timedelta(minutes=5)
_MAX_CLUSTER_SUMMARIES = 25


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Hass Data Points sensor entities from a config entry."""
    store: DatapointsStore = hass.data[DOMAIN][KEY_STORE]

    # Store callback for dynamic sensor creation from WS handlers
    hass.data[DOMAIN][KEY_ADD_SENSOR_ENTITIES] = async_add_entities
    hass.data[DOMAIN][KEY_MONITOR_SENSORS] = {}

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

    # Re-register sensors for monitors that survived a restart. Soft-deleted
    # (trashed) monitors are skipped so their entities do not resurrect on boot.
    monitor_sensors: list[SensorEntity] = []
    for monitor in store.get_monitors():
        if monitor.get("deleted_at"):
            continue
        mid = monitor["id"]
        s = DatapointsMonitorSensor(entry, store, hass, mid)
        hass.data[DOMAIN][KEY_MONITOR_SENSORS][mid] = s
        monitor_sensors.extend(
            [
                s,
                DatapointsMonitorConsecutiveScansSensor(entry, store, mid),
                DatapointsMonitorLastScanSensor(entry, store, mid),
                DatapointsMonitorLastAnomalySensor(entry, store, mid),
                DatapointsMonitorAnomalyDurationSensor(entry, store, hass, mid),
                DatapointsMonitorDataPointsSensor(entry, store, mid),
            ]
        )
    monitor_sensors.append(DatapointsAggregateAnomalyMonitorsSensor(entry, store))
    async_add_entities(monitor_sensors)


# ---------------------------------------------------------------------------
# Base classes
# ---------------------------------------------------------------------------


class _DatapointsSensorBase(SensorEntity):
    """Shared base for all Hass Data Points sensor entities.

    Sensors that compute from in-memory monitor state use the synchronous
    ``_compute()`` hook and refresh inline (offloading those would race with
    loop-side mutations). Sensors backed by SQLite event reads subclass
    ``_DatapointsEventSensorBase`` instead, whose store accessors dispatch the
    blocking read to the executor.
    """

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
        self._refresh_value()

    def _refresh_value(self) -> None:
        """Recompute from in-memory state and write state inline."""
        self._attr_native_value = self._compute()
        self.async_write_ha_state()

    def _compute(self) -> Any:
        """Compute the current sensor value. Override in subclasses."""
        raise NotImplementedError


class _DatapointsEventSensorBase(_DatapointsSensorBase):
    """Base for sensors whose value comes from the event store (SQLite).

    The store's async accessors dispatch the blocking read to the executor,
    so these sensors never read on the event loop. The first value is
    populated in ``async_added_to_hass`` — never in ``__init__`` — and store
    updates / timer ticks reschedule the async refresh as a task.
    """

    # No SQLite read happens in __init__; the value stays None until the first
    # async refresh runs in async_added_to_hass.
    _attr_native_value = None

    async def async_added_to_hass(self) -> None:
        """Register store listener and populate the initial value off-loop."""
        await super().async_added_to_hass()
        await self._async_refresh_value()

    def _refresh_value(self) -> None:
        """Schedule an off-loop recompute; the store accessor does the dispatch."""
        self.hass.async_create_task(self._async_refresh_value())

    async def _async_refresh_value(self) -> None:
        """Recompute via the async store accessor, then write state."""
        self._attr_native_value = await self._async_compute()
        self.async_write_ha_state()

    async def _async_compute(self) -> Any:
        """Compute the current sensor value asynchronously. Override in subclasses."""
        raise NotImplementedError


class _PeriodicRefreshMixin:
    """Adds a periodic time-driven refresh on top of any sensor base.

    Mixed in before the sensor base so its ``async_added_to_hass`` runs first
    and delegates to the base via ``super()``.
    """

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise with config entry, data store, and hass instance."""
        super().__init__(entry, store)
        self._hass = hass

    async def async_added_to_hass(self) -> None:
        """Register the base listeners and a periodic refresh timer."""
        await super().async_added_to_hass()
        self.async_on_remove(
            async_track_time_interval(
                self._hass, self._handle_time_interval, _UPDATE_INTERVAL
            )
        )

    @callback
    def _handle_time_interval(self, now: datetime) -> None:
        """Refresh state on every timer tick."""
        self._refresh_value()


# ---------------------------------------------------------------------------
# Concrete sensors
# ---------------------------------------------------------------------------


class DatapointsCountSensor(_DatapointsEventSensorBase):
    """Expose the total number of recorded datapoints."""

    _attr_icon = "mdi:counter"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the datapoint count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_datapoint_count"
        self._attr_name = "Datapoint count"

    async def _async_compute(self) -> int:
        return await self._store.async_get_event_count()


class DatapointsLastTimestampSensor(_DatapointsEventSensorBase):
    """Expose the timestamp of the most recently recorded datapoint."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:clock-outline"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the last recorded timestamp sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_last_timestamp"
        self._attr_name = "Last recorded"

    async def _async_compute(self) -> datetime | None:
        event = await self._store.async_get_last_event()
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


class DatapointsLastMessageSensor(_DatapointsEventSensorBase):
    """Expose the message of the most recently recorded datapoint."""

    _attr_icon = "mdi:text"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the last recorded message sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_last_message"
        self._attr_name = "Last message"

    async def _async_compute(self) -> str | None:
        event = await self._store.async_get_last_event()
        if event is None:
            return None
        return event.get("message")


class DatapointsTimeSinceLastSensor(_PeriodicRefreshMixin, _DatapointsEventSensorBase):
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

    async def _async_compute(self) -> float | None:
        event = await self._store.async_get_last_event()
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


class DatapointsTodayCountSensor(_PeriodicRefreshMixin, _DatapointsEventSensorBase):
    """Expose the count of datapoints recorded since the start of today (local time)."""

    _attr_icon = "mdi:calendar-today"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise the today count sensor."""
        super().__init__(entry, store, hass)
        self._attr_unique_id = f"{entry.entry_id}_today_count"
        self._attr_name = "Recorded today"

    async def _async_compute(self) -> int:
        today_start = dt_util.as_utc(dt_util.start_of_local_day())
        return await self._store.async_get_events_count_in_range(
            start=today_start.isoformat()
        )


class DatapointsWeekCountSensor(_PeriodicRefreshMixin, _DatapointsEventSensorBase):
    """Expose the count of datapoints recorded since the start of this week (Mon, local time)."""

    _attr_icon = "mdi:calendar-week"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, hass: HomeAssistant
    ) -> None:
        """Initialise the week count sensor."""
        super().__init__(entry, store, hass)
        self._attr_unique_id = f"{entry.entry_id}_week_count"
        self._attr_name = "Recorded this week"

    async def _async_compute(self) -> int:
        today_start = dt_util.start_of_local_day()
        week_start = dt_util.as_utc(today_start - timedelta(days=today_start.weekday()))
        return await self._store.async_get_events_count_in_range(
            start=week_start.isoformat()
        )


class DatapointsAutomationCountSensor(_DatapointsEventSensorBase):
    """Expose the count of automation-triggered datapoints."""

    _attr_icon = "mdi:robot"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the automation count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_automation_count"
        self._attr_name = "Automation recorded"

    async def _async_compute(self) -> int:
        automation, _ = await self._store.async_get_automation_manual_counts()
        return automation


class DatapointsManualCountSensor(_DatapointsEventSensorBase):
    """Expose the count of manually recorded datapoints."""

    _attr_icon = "mdi:hand-back-right"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the manual count sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_manual_count"
        self._attr_name = "Manually recorded"

    async def _async_compute(self) -> int:
        _, manual = await self._store.async_get_automation_manual_counts()
        return manual


# ---------------------------------------------------------------------------
# Monitor helpers
# ---------------------------------------------------------------------------


def _build_detection_config(monitor: dict[str, Any]) -> dict[str, Any]:
    """Map monitor record → anomaly_detection config dict."""
    return {
        "anomaly_methods": monitor.get("anomaly_methods", ["trend_residual"]),
        "anomaly_sensitivity": monitor.get("anomaly_sensitivity", "medium"),
        "anomaly_overlap_mode": monitor.get("anomaly_overlap_mode", "all"),
        "anomaly_rate_window": monitor.get("anomaly_rate_window", "1h"),
        "anomaly_zscore_window": monitor.get("anomaly_zscore_window", "24h"),
        "anomaly_persistence_window": monitor.get("anomaly_persistence_window", "1h"),
        **{
            field: monitor.get(field, DEFAULT_ANOMALY_DIRECTION)
            for field in ANOMALY_DIRECTION_FIELDS
        },
        "trend_method": monitor.get("anomaly_trend_method", "rolling_average"),
        "trend_window": monitor.get("anomaly_trend_window", "24h"),
        "sample_interval": monitor.get("sample_interval"),
        "sample_aggregate": monitor.get("sample_aggregate", "mean"),
        "comparison_time_offset_ms": monitor.get("baseline_time_offset_hours", 0)
        * 3600
        * 1000,
    }


def _run_detection_sync(
    pts: list,
    config: dict[str, Any],
    comparison_pts: list | None = None,
    cancel: threading.Event | None = None,
) -> list:
    """Blocking wrapper: run anomaly detection and return clusters."""
    return run_anomaly_detection(pts, config, comparison_pts, cancel=cancel)


def _summarize_clusters(
    clusters: list[dict[str, Any]], max_entries: int = _MAX_CLUSTER_SUMMARIES
) -> list[dict[str, Any]]:
    """Return compact, bounded cluster summaries for entity attrs and events."""
    summaries: list[dict[str, Any]] = []
    for cluster in clusters:
        points = cluster.get("points", [])
        times = [
            point.get("timeMs")
            for point in points
            if isinstance(point, dict) and isinstance(point.get("timeMs"), (int, float))
        ]
        if times:
            start_ms = int(min(times))
            end_ms = int(max(times))
        else:
            start_ms = 0
            end_ms = 0

        max_deviation = cluster.get("maxDeviation", 0.0)
        if not isinstance(max_deviation, (int, float)):
            max_deviation = 0.0

        summaries.append(
            {
                "start_ms": start_ms,
                "end_ms": end_ms,
                "anomaly_method": cluster.get("anomalyMethod", "unknown"),
                "max_deviation": float(max_deviation),
                "point_count": len(points),
            }
        )

    if len(summaries) > max_entries:
        return summaries[-max_entries:]

    return summaries


def _overlap_threshold(mode: str, entity_count: int) -> int:
    """Return the minimum number of entities that must be anomalous simultaneously.

    Supports:
      "all"          → all entities (entity_count)
      "any" / "any_1"→ any single entity (1)
      "any_two_plus" → legacy alias for 2
      "any_N"        → at least N (N >= 2)
    """
    if mode == "all":
        return entity_count
    if mode in ("any", "any_1"):
        return 1
    if mode == "any_two_plus":
        return 2
    if mode.startswith("any_") and mode[4:].isdigit():
        return max(1, int(mode[4:]))
    return 1  # safe fallback


def _apply_dismissals(clusters: list, dismissed_windows: list) -> list:
    """Remove clusters whose time range overlaps any active dismissed window."""
    if not dismissed_windows:
        return clusters
    result = []
    for cluster in clusters:
        times = [p["timeMs"] for p in cluster.get("points", [])]
        if not times:
            result.append(cluster)
            continue
        cluster_start, cluster_end = min(times), max(times)
        overlaps = any(
            w["start_ms"] <= cluster_end and w["end_ms"] >= cluster_start
            for w in dismissed_windows
        )
        if not overlaps:
            result.append(cluster)
    return result


def _run_combined_detection(
    all_entity_pts: dict[str, list],
    config: dict[str, Any],
    overlap_mode: str,
    cancel: threading.Event | None = None,
) -> list[dict[str, Any]]:
    """Run detection per entity; return overlap windows as cluster-like dicts."""
    entity_ids = list(all_entity_pts.keys())
    if len(entity_ids) < 2:
        return []

    entity_clusters: dict[str, list[dict[str, Any]]] = {}
    for eid in entity_ids:
        check_cancel(cancel)
        pts = all_entity_pts[eid]
        if len(pts) < 3:
            entity_clusters[eid] = []
            continue
        entity_clusters[eid] = run_anomaly_detection(pts, config, cancel=cancel)

    return _combined_overlap_from_clusters(entity_clusters, overlap_mode, cancel)


def _combined_overlap_from_clusters(
    entity_clusters: dict[str, list[dict[str, Any]]],
    overlap_mode: str,
    cancel=None,
) -> list[dict[str, Any]]:
    """Build combined overlap windows without recalculating entity clusters."""
    import bisect  # noqa: PLC0415

    entity_ids = list(entity_clusters)
    if len(entity_ids) < 2:
        return []

    entity_windows: list[list[tuple[int, int]]] = []
    for eid in entity_ids:
        clusters = entity_clusters[eid]
        windows: list[tuple[int, int]] = []
        for cluster in clusters:
            pts_in_cluster = cluster.get("points", [])
            if pts_in_cluster:
                times = [p["timeMs"] for p in pts_in_cluster]
                windows.append((min(times), max(times)))
        # Keep sorted by start for binary-search overlap check below
        windows.sort(key=lambda x: x[0])
        entity_windows.append(windows)

    # Pre-compute sorted start lists for O(log w) point-in-interval lookup
    sorted_starts: list[list[int]] = [[s for s, _ in ws] for ws in entity_windows]

    # Collect qualifying overlap windows as cluster-like dicts
    required = _overlap_threshold(overlap_mode, len(entity_ids))
    overlap_clusters: list[dict[str, Any]] = []
    seen: set[tuple[int, int]] = set()
    for i, windows_i in enumerate(entity_windows):
        check_cancel(cancel)
        for win_start, win_end in windows_i:
            if (win_start, win_end) in seen:
                continue
            check_time = (win_start + win_end) // 2
            hits = 0
            for j, windows_j in enumerate(entity_windows):
                if j == i or not windows_j:
                    continue
                # Binary search: find rightmost start <= check_time
                idx = bisect.bisect_right(sorted_starts[j], check_time) - 1
                if idx >= 0 and windows_j[idx][0] <= check_time <= windows_j[idx][1]:
                    hits += 1
            if hits + 1 >= required:
                seen.add((win_start, win_end))
                overlap_clusters.append(
                    {
                        "points": [
                            {"timeMs": win_start, "value": 0.0},
                            {"timeMs": win_end, "value": 0.0},
                        ],
                        "anomalyMethod": "combined_overlap",
                        "maxDeviation": 0.0,
                    }
                )
    return overlap_clusters


@dataclass(slots=True)
class MonitorDetection:
    """Result of running a monitor's detection over one range (one job)."""

    entity_clusters: dict[str, list[dict[str, Any]]]
    clusters: list[dict[str, Any]]
    data_point_count: int


async def async_detect_monitor(
    hass: HomeAssistant,
    runner: DetectionRunner,
    job: DetectionJob,
    monitor: dict[str, Any],
    start_time: str,
    end_time: str,
) -> MonitorDetection:
    """Prepare history and run detection for every monitor entity, once each.

    ``clusters`` is the monitor-level result: the entity's clusters for an
    individual monitor, or the overlap windows for a combined one. Both are
    derived from the same per-entity calculation, so activity and scans never
    detect an entity twice. Raises a ``DetectionError`` on timeout/cancel;
    never converts a failure into an empty result.
    """
    from homeassistant.components.recorder import get_instance  # noqa: PLC0415

    config = _build_detection_config(monitor)
    combined = monitor.get("type", "individual") == "combined"
    if combined:
        entity_ids = [e for e in monitor.get("entity_ids", []) if e]
    else:
        entity_ids = [e for e in [monitor.get("entity_id", "")] if e]

    entity_clusters: dict[str, list[dict[str, Any]]] = {}
    data_point_count = 0
    for entity_id in entity_ids:
        job.check()
        pts = await async_prepare_entity_series(
            hass,
            entity_id,
            start_time,
            end_time,
            sample_interval=monitor.get("sample_interval"),
            sample_aggregate=monitor.get("sample_aggregate", "mean"),
            max_pts=ANOMALY_MAX_PTS,
        )
        job.check()
        data_point_count += len(pts)
        if len(pts) < 3:
            entity_clusters[entity_id] = []
            continue
        comparison_pts: list | None = None
        baseline_entity_id = monitor.get("baseline_entity_id")
        if (
            not combined
            and baseline_entity_id
            and "comparison_window" in config.get("anomaly_methods", [])
        ):
            comparison_pts = await get_instance(hass).async_add_executor_job(
                fetch_entity_pts, hass, baseline_entity_id, start_time, end_time
            )
        entity_clusters[entity_id] = await runner.run_cpu(
            job, _run_detection_sync, pts, config, comparison_pts, job.token
        )

    if combined:
        clusters = await runner.run_cpu(
            job,
            _combined_overlap_from_clusters,
            entity_clusters,
            monitor.get("overlap_mode", "all"),
            job.token,
        )
    else:
        clusters = next(iter(entity_clusters.values()), [])
    return MonitorDetection(entity_clusters, clusters, data_point_count)


async def async_warm_cache(
    hass: HomeAssistant,
    store: DatapointsStore,
) -> None:
    """Pre-populate anomaly cache for all enabled monitors at startup (best-effort).

    Each monitor is one runner job; busy or failed warmups are skipped and the
    loop stops when the runner shuts down.
    """
    from .anomaly_cache import AnomalyCache, make_cache_key  # noqa: PLC0415

    cache: AnomalyCache = hass.data[DOMAIN]["anomaly_cache"]
    runner: DetectionRunner = hass.data[DOMAIN]["runner"]
    now = datetime.now(UTC)
    for monitor in store.get_monitors():
        if not monitor.get("enabled", True) or monitor.get("deleted_at"):
            continue
        monitor_type = monitor.get("type", "individual")
        if monitor_type == "combined":
            entity_ids = monitor.get("entity_ids", [])
        else:
            eid = monitor.get("entity_id", "")
            entity_ids = [eid] if eid else []
        if not entity_ids:
            continue

        await asyncio.sleep(0)  # yield between monitors
        look_back = monitor.get("look_back_hours", MONITOR_DEFAULT_LOOK_BACK_HOURS)
        start_t = (now - timedelta(hours=look_back)).isoformat()
        end_t = now.isoformat()
        try:
            end_ts = datetime.fromisoformat(end_t).timestamp()
        except ValueError:
            continue
        config = _build_detection_config(monitor)

        async def warm(
            job: DetectionJob,
            monitor: dict[str, Any] = monitor,
            entity_ids: list[str] = entity_ids,
            start_t: str = start_t,
            end_t: str = end_t,
            end_ts: float = end_ts,
            config: dict[str, Any] = config,
        ) -> None:
            for entity_id in entity_ids:
                job.check()
                # Prepare the series exactly as ws_get_anomalies does (merge
                # stats + downsample + cap) so the clusters we warm under this
                # cache key match what a later ws_get_anomalies read computes.
                # make_cache_key includes sample_interval, so a raw-only warm
                # would otherwise write clusters that a sampled read mis-serves.
                pts = await async_prepare_entity_series(
                    hass,
                    entity_id,
                    start_t,
                    end_t,
                    sample_interval=monitor.get("sample_interval"),
                    sample_aggregate=monitor.get("sample_aggregate", "mean"),
                    max_pts=ANOMALY_MAX_PTS,
                )
                if len(pts) < 3:
                    continue
                clusters = await runner.run_cpu(
                    job, _run_detection_sync, pts, config, None, job.token
                )
                cache_key = make_cache_key(entity_id, start_t, end_t, config)
                await hass.async_add_executor_job(
                    cache.set, cache_key, entity_id, end_ts, clusters
                )

        try:
            await runner.submit(warm, key=f"warmup:{monitor.get('id', '')}")
        except DetectionCancelled:
            if not runner.accepting:
                return
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug(
                "hass_datapoints: cache warmup skipped for monitor %s: %r",
                monitor.get("id"),
                err,
            )


# ---------------------------------------------------------------------------
# Monitor sensor
# ---------------------------------------------------------------------------


class DatapointsMonitorSensor(_DatapointsSensorBase):
    """A sensor that runs scheduled anomaly detection for a single monitor config."""

    _attr_icon = "mdi:bell-alert-outline"

    def __init__(
        self,
        entry: ConfigEntry,
        store: DatapointsStore,
        hass: HomeAssistant,
        monitor_id: str,
    ) -> None:
        """Initialise the monitor sensor."""
        super().__init__(entry, store)
        self._hass = hass
        self._monitor_id = monitor_id
        self._unsub_timer: Any = None
        self._unsub_stagger: Any = None
        self._timer_signature: tuple[bool, int] | None = None

        monitor = store.get_monitor(monitor_id) or {}
        self._attr_unique_id = f"{entry.entry_id}_monitor_{monitor_id}"
        self._attr_name = monitor.get("name", f"Anomaly monitor {monitor_id[:8]}")
        self._attr_native_value = monitor.get("last_cluster_count", 0)

    def _compute_timer_signature(
        self, monitor: dict[str, Any] | None
    ) -> tuple[bool, int] | None:
        """Return the timer-driving config tuple for the current monitor."""
        if not monitor:
            return None
        enabled = bool(monitor.get("enabled", True))
        interval_minutes = int(monitor.get("scan_interval_minutes", 30))
        return enabled, interval_minutes

    @property
    def device_info(self) -> DeviceInfo:
        """Each monitor is its own device, nested under the main integration device."""
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    async def async_added_to_hass(self) -> None:
        """Register store listener and schedule the scan timer."""
        await super().async_added_to_hass()
        self._schedule_timer()

    def _schedule_timer(self) -> None:
        """Cancel any existing timer and create a new one if the monitor is enabled."""
        import uuid as _uuid  # noqa: PLC0415

        # Cancel any pending stagger that hasn't fired yet (guards against double-call).
        if self._unsub_stagger is not None:
            self._unsub_stagger()
            self._unsub_stagger = None

        if self._unsub_timer is not None:
            self._unsub_timer()
            self._unsub_timer = None

        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor or not monitor.get("enabled", True):
            self._timer_signature = self._compute_timer_signature(monitor)
            return

        interval_minutes = monitor.get("scan_interval_minutes", 30)
        interval = timedelta(minutes=max(1, interval_minutes))
        self._timer_signature = self._compute_timer_signature(monitor)

        # Deterministic 0–29 s stagger per monitor to avoid simultaneous startup bursts.
        # uuid.UUID(id).int is stable across restarts unlike hash() (PYTHONHASHSEED).
        try:
            stagger_secs = _uuid.UUID(self._monitor_id).int % 30
        except ValueError:
            stagger_secs = 0

        @callback
        def _start(_now: Any = None) -> None:
            self._unsub_stagger = None  # stagger has fired; clear reference
            self._unsub_timer = async_track_time_interval(
                self._hass, self._handle_scan_tick, interval
            )
            self.async_on_remove(
                lambda: self._unsub_timer and self._unsub_timer()  # type: ignore[func-returns-value]
            )

        self._unsub_stagger = async_call_later(self._hass, stagger_secs, _start)
        self.async_on_remove(
            lambda: self._unsub_stagger and self._unsub_stagger()  # type: ignore[func-returns-value]
        )

    @callback
    def _handle_scan_tick(self, now: datetime) -> None:
        """Trigger a scan on the next event loop iteration."""
        coroutine = self._run_scan()
        try:
            self._hass.async_create_task(coroutine)
        except RuntimeError:
            coroutine.close()
            _LOGGER.debug(
                "DatapointsMonitorSensor could not schedule scan for monitor %s",
                self._monitor_id,
            )

    async def _run_scan(self) -> None:
        """Run one scheduled scan as a single runner job and record its outcome.

        Success publishes counts/clusters/history; timeout, error and busy only
        update scan health, preserving the last successful results and never
        emitting a resolved event. Overlapping ticks for the same monitor are
        skipped without touching its status; superseded scans publish nothing.
        """
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor or not monitor.get("enabled", True) or monitor.get("deleted_at"):
            return
        runner: DetectionRunner | None = self._hass.data.get(DOMAIN, {}).get("runner")
        if runner is None:
            return
        revision = self._store.get_monitor_revision(self._monitor_id)
        attempt_time = datetime.now(UTC).isoformat()

        async def scan(job: DetectionJob) -> None:
            await self._store.async_commit_monitor_scan(
                self._monitor_id,
                revision,
                _mark_scan_running(attempt_time, job.token),
            )
            await self._run_scan_inner(monitor, revision, runner, job)

        try:
            await runner.submit(scan, key=f"scan:{self._monitor_id}")
        except DetectionBusy as err:
            if err.reason == "duplicate":
                return
            await self._publish_scan_failure(revision, attempt_time, err)
        except DetectionCancelled:
            return
        except Exception as err:  # noqa: BLE001
            if not isinstance(err, DetectionTimeout):
                _LOGGER.exception(
                    "DatapointsMonitorSensor scan failed for monitor %s",
                    self._monitor_id,
                )
            await self._publish_scan_failure(revision, attempt_time, err)

    async def _publish_scan_failure(
        self,
        revision: tuple[str, int],
        attempt_time: str,
        err: BaseException,
    ) -> None:
        code = error_code(err)
        status = _SCAN_STATUS_BY_ERROR.get(code, "error")
        await self._store.async_commit_monitor_scan(
            self._monitor_id,
            revision,
            partial(_failure_updates, attempt_time, status, code),
        )

    async def _run_scan_inner(
        self,
        monitor: dict,
        revision: tuple[str, int],
        runner: DetectionRunner,
        job: DetectionJob,
    ) -> None:
        """Detect over the look-back window and commit a successful result."""
        monitor_type = monitor.get("type", "individual")
        look_back_hours = monitor.get("look_back_hours", 24)
        now = datetime.now(UTC)
        start_time = (now - timedelta(hours=look_back_hours)).isoformat()
        end_time = now.isoformat()

        detection = await async_detect_monitor(
            self._hass, runner, job, monitor, start_time, end_time
        )
        job.check()
        scan_time = now.isoformat()
        raw_clusters = detection.clusters
        transition: dict[str, Any] = {}

        def build_updates(current: dict[str, Any]) -> dict[str, Any] | None:
            # Re-check the deadline under the store lock: a scan that timed
            # out while waiting to commit must not publish after (or race
            # with) its own timeout failure.
            if job.token.is_set():
                return None
            # Dismissals and previous counts come from the committed record
            # under the store lock, so transitions match the committed order.
            DatapointsStore.prune_dismissed_windows(current, now)
            clusters = _apply_dismissals(
                raw_clusters, current.get("dismissed_windows", [])
            )
            cluster_count = len(clusters)
            cluster_summaries = _summarize_clusters(clusters)
            prev_count: int = current.get("last_cluster_count", 0) or 0
            prev_summaries = current.get("active_clusters_summary", [])
            DatapointsStore.append_scan_history(current, scan_time, cluster_count)
            updates: dict[str, Any] = {
                "last_scan_attempt_at": scan_time,
                "last_scan_status": "success",
                "last_scan_error": None,
                "last_scan_at": scan_time,
                "last_cluster_count": cluster_count,
                "active_cluster_count": cluster_count,
                "active_clusters_summary": cluster_summaries,
                "scan_history": current["scan_history"],
                "last_scan_data_points": detection.data_point_count,
                "dismissed_windows": current.get("dismissed_windows", []),
            }
            if prev_count == 0 and cluster_count > 0:
                updates["last_anomaly_at"] = scan_time
            if prev_count > 0 and cluster_count == 0:
                updates["last_resolved_clusters_summary"] = prev_summaries
            transition.update(
                prev_count=prev_count,
                prev_summaries=prev_summaries,
                cluster_count=cluster_count,
                cluster_summaries=cluster_summaries,
                scan_history=current["scan_history"],
            )
            return updates

        def on_published(_committed: dict[str, Any]) -> None:
            self._attr_native_value = transition["cluster_count"]
            self.async_write_ha_state()
            self._fire_transition(monitor, monitor_type, scan_time, transition)

        await self._store.async_commit_monitor_scan(
            self._monitor_id, revision, build_updates, on_published
        )

    def _fire_transition(
        self,
        monitor: dict[str, Any],
        monitor_type: str,
        scan_time: str,
        transition: dict[str, Any],
    ) -> None:
        """Fire detected/resolved events for a committed successful scan."""
        prev_count = transition["prev_count"]
        cluster_count = transition["cluster_count"]
        if (prev_count == 0) == (cluster_count == 0):
            return
        base: dict[str, Any] = {
            "monitor_id": self._monitor_id,
            "monitor_name": monitor.get("name", ""),
            "monitor_type": monitor_type,
            "scan_time": scan_time,
        }
        if monitor_type == "combined":
            base["entity_ids"] = monitor.get("entity_ids", [])
        else:
            base["entity_id"] = monitor.get("entity_id", "")
        if cluster_count > 0:
            self._hass.bus.async_fire(
                EVENT_ANOMALY_DETECTED,
                {
                    **base,
                    "cluster_count": cluster_count,
                    "active_cluster_count": cluster_count,
                    "active_clusters": transition["cluster_summaries"],
                    "consecutive_anomalous_scans": _consecutive_anomalous_scans(
                        transition["scan_history"]
                    ),
                },
            )
        else:
            self._hass.bus.async_fire(
                EVENT_ANOMALY_RESOLVED,
                {
                    **base,
                    "active_cluster_count": 0,
                    "active_clusters": [],
                    "resolved_clusters": transition["prev_summaries"],
                },
            )

    async def _handle_entity_unavailable(self, entity_id: str) -> None:
        """Disable the monitor and fire a persistent notification."""
        from homeassistant.components import persistent_notification  # noqa: PLC0415

        await self._store.async_update_monitor(self._monitor_id, {"enabled": False})
        persistent_notification.async_create(
            self._hass,
            f"Anomaly monitor **{self._store.get_monitor(self._monitor_id) or {}}** was disabled because entity `{entity_id}` is unavailable.",
            title="Hass Data Points — Monitor disabled",
            notification_id=f"dp_monitor_disabled_{self._monitor_id}",
        )

    def _handle_store_update(self) -> None:
        """Refresh name, value, and reschedule timer when the monitor config changes."""
        monitor = self._store.get_monitor(self._monitor_id)
        if monitor is None:
            return
        self._attr_name = monitor.get("name", self._attr_name)
        self._attr_native_value = monitor.get(
            "last_cluster_count", self._attr_native_value
        )
        next_signature = self._compute_timer_signature(monitor)
        if next_signature != self._timer_signature:
            self._schedule_timer()
        self.async_write_ha_state()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extended attributes for automations and dashboards."""
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor:
            return {}
        attrs: dict[str, Any] = {
            "look_back_hours": monitor.get("look_back_hours", 24),
            "scan_interval_minutes": monitor.get("scan_interval_minutes", 30),
            "anomaly_methods": monitor.get("anomaly_methods", []),
            "sensitivity": monitor.get("anomaly_sensitivity", "medium"),
            **{
                field: monitor.get(field, DEFAULT_ANOMALY_DIRECTION)
                for field in ANOMALY_DIRECTION_FIELDS
            },
            "active_cluster_count": monitor.get(
                "active_cluster_count", monitor.get("last_cluster_count", 0)
            ),
            "active_clusters": monitor.get("active_clusters_summary", []),
            "last_scan_data_points": monitor.get("last_scan_data_points"),
            "last_scan_at": monitor.get("last_scan_at"),
            "last_scan_attempt_at": monitor.get("last_scan_attempt_at"),
            "last_scan_status": monitor.get("last_scan_status", "unknown"),
            "last_scan_error": monitor.get("last_scan_error"),
            "last_anomaly_at": monitor.get("last_anomaly_at"),
            "dismissed_windows": monitor.get("dismissed_windows", []),
        }
        if monitor.get("type") == "combined":
            attrs["entity_ids"] = monitor.get("entity_ids", [])
        else:
            attrs["entity_id"] = monitor.get("entity_id", "")
        return attrs


# ---------------------------------------------------------------------------
# Per-monitor device helper
# ---------------------------------------------------------------------------


_SCAN_STATUS_BY_ERROR = {
    ERROR_TIMEOUT: "timeout",
    ERROR_BUSY: "busy",
    ERROR_CANCELLED: "cancelled",
}


def _mark_scan_running(attempt_time: str, token=None):
    """Build the 'running' update, remembering whether prior evidence was verified.

    ``last_scan_error`` is kept as the previous failure code (or ``unverified``
    when the previous status was unknown), so diagnostics stay unavailable
    while a scan that follows a failure is running, and stay available while a
    scan that follows a success is running.
    """

    def build(current: dict[str, Any]) -> dict[str, Any] | None:
        if token is not None and token.is_set():
            # Timed out or cancelled while waiting for the store: the failure
            # (if any) is recorded by the caller; never leave "running" behind.
            return None
        previous = current.get("last_scan_status", "unknown")
        if previous == "success":
            error = None
        elif previous == "running":
            error = current.get("last_scan_error")
        else:
            error = current.get("last_scan_error") or SCAN_ERROR_UNVERIFIED
        return {
            "last_scan_attempt_at": attempt_time,
            "last_scan_status": "running",
            "last_scan_error": error,
        }

    return build


def _failure_updates(
    attempt_time: str, status: str, code: str, current: dict[str, Any]
) -> dict[str, Any] | None:
    """Failure fields for one attempt, unless that attempt already succeeded.

    The success commit may have started just before the deadline and finished
    after the caller saw the timeout; the store lock orders the two writes,
    and this keeps a committed success from being overwritten as failed.
    """
    last_success = current.get("last_scan_at") or ""
    if current.get("last_scan_status") == "success" and last_success >= attempt_time:
        return None
    return {
        "last_scan_attempt_at": attempt_time,
        "last_scan_status": status,
        "last_scan_error": code,
    }


def scan_evidence_verified(monitor: dict[str, Any]) -> bool:
    """True when retained results come from a successful scan that still applies."""
    status = monitor.get("last_scan_status", "unknown")
    if status == "success":
        return True
    return status == "running" and monitor.get("last_scan_error") is None


def _consecutive_anomalous_scans(scan_history: list[dict[str, Any]]) -> int:
    """Return the trailing streak of scans with cluster_count > 0."""
    consecutive = 0
    for entry in reversed(scan_history):
        if entry.get("count", 0) > 0:
            consecutive += 1
        else:
            break
    return consecutive


# ---------------------------------------------------------------------------
# Per-monitor device sensors
# ---------------------------------------------------------------------------


class _LastSuccessfulScanEvidenceMixin:
    """Diagnostics derived from successful scans only.

    They are unavailable while the latest scan outcome is unknown or failed
    (including a scan running after a failure) rather than claiming failed
    intervals were observed, and come back with the next successful scan.
    """

    _store: DatapointsStore
    _monitor_id: str

    @property
    def available(self) -> bool:
        monitor = self._store.get_monitor(self._monitor_id)
        return bool(monitor) and scan_evidence_verified(monitor)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        monitor = self._store.get_monitor(self._monitor_id) or {}
        return {
            "evidence": "last_successful_scan",
            "last_successful_scan_at": monitor.get("last_scan_at"),
        }


class DatapointsMonitorConsecutiveScansSensor(
    _LastSuccessfulScanEvidenceMixin, _DatapointsSensorBase
):
    """Reports the number of consecutive anomalous scans for a monitor."""

    _attr_icon = "mdi:repeat-variant"
    _attr_native_unit_of_measurement = "scans"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, monitor_id: str
    ) -> None:
        super().__init__(entry, store)
        self._monitor_id = monitor_id
        self._attr_unique_id = (
            f"{entry.entry_id}_monitor_{monitor_id}_consecutive_scans"
        )
        self._attr_name = "Consecutive anomalous scans"
        self._attr_native_value = self._compute()

    @property
    def device_info(self) -> DeviceInfo:
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    def _compute(self) -> int:
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor:
            return 0
        return _consecutive_anomalous_scans(monitor.get("scan_history", []))


class DatapointsMonitorLastScanSensor(_DatapointsSensorBase):
    """Reports the timestamp of the last scan for a monitor."""

    _attr_icon = "mdi:clock-check-outline"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_registry_enabled_default = False  # diagnostic — hidden by default

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, monitor_id: str
    ) -> None:
        super().__init__(entry, store)
        self._monitor_id = monitor_id
        self._attr_unique_id = f"{entry.entry_id}_monitor_{monitor_id}_last_scan_at"
        self._attr_name = "Last scan"
        self._attr_native_value = self._compute()

    @property
    def device_info(self) -> DeviceInfo:
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    def _compute(self) -> datetime | None:
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor:
            return None
        raw = monitor.get("last_scan_at")
        if not raw:
            return None
        try:
            dt = datetime.fromisoformat(raw)
            return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
        except ValueError:
            return None


class DatapointsMonitorLastAnomalySensor(_DatapointsSensorBase):
    """Reports the timestamp when an anomaly was last detected for a monitor."""

    _attr_icon = "mdi:clock-alert-outline"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, monitor_id: str
    ) -> None:
        super().__init__(entry, store)
        self._monitor_id = monitor_id
        self._attr_unique_id = f"{entry.entry_id}_monitor_{monitor_id}_last_anomaly_at"
        self._attr_name = "Last anomaly detected"
        self._attr_native_value = self._compute()

    @property
    def device_info(self) -> DeviceInfo:
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    def _compute(self) -> datetime | None:
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor:
            return None
        raw = monitor.get("last_anomaly_at")
        if not raw:
            return None
        try:
            dt = datetime.fromisoformat(raw)
            return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
        except ValueError:
            return None


class DatapointsMonitorAnomalyDurationSensor(
    _LastSuccessfulScanEvidenceMixin, _PeriodicRefreshMixin, _DatapointsSensorBase
):
    """Reports how many minutes the current anomaly has been active.

    Returns 0 when there is no active anomaly. Time-driven so the value
    increases with wall clock time without needing a store update.
    """

    _attr_icon = "mdi:timer-alert-outline"
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES

    def __init__(
        self,
        entry: ConfigEntry,
        store: DatapointsStore,
        hass: HomeAssistant,
        monitor_id: str,
    ) -> None:
        super().__init__(entry, store, hass)
        self._monitor_id = monitor_id
        self._attr_unique_id = f"{entry.entry_id}_monitor_{monitor_id}_anomaly_duration"
        self._attr_name = "Anomaly duration"
        self._attr_native_value = self._compute()

    @property
    def device_info(self) -> DeviceInfo:
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    def _compute(self) -> int:
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor or (monitor.get("last_cluster_count") or 0) == 0:
            return 0
        consecutive = _consecutive_anomalous_scans(monitor.get("scan_history", []))
        interval = monitor.get("scan_interval_minutes", 30)
        return consecutive * interval


class DatapointsMonitorDataPointsSensor(_DatapointsSensorBase):
    """Reports the number of data points found in the last scan."""

    _attr_icon = "mdi:chart-scatter-plot"
    _attr_native_unit_of_measurement = "points"

    def __init__(
        self, entry: ConfigEntry, store: DatapointsStore, monitor_id: str
    ) -> None:
        super().__init__(entry, store)
        self._monitor_id = monitor_id
        self._attr_unique_id = f"{entry.entry_id}_monitor_{monitor_id}_data_points"
        self._attr_name = "Data points in last scan"
        self._attr_native_value = self._compute()

    @property
    def device_info(self) -> DeviceInfo:
        return monitor_device_info(
            self._entry.entry_id,
            self._monitor_id,
            self._store.get_monitor(self._monitor_id),
        )

    def _compute(self) -> int:
        monitor = self._store.get_monitor(self._monitor_id)
        if not monitor:
            return 0
        return monitor.get("last_scan_data_points") or 0


# ---------------------------------------------------------------------------
# Aggregate monitor sensor
# ---------------------------------------------------------------------------


class DatapointsAggregateAnomalyMonitorsSensor(_DatapointsSensorBase):
    """Reports the count of enabled monitors that currently have anomalies detected."""

    _attr_icon = "mdi:bell-alert"

    def __init__(self, entry: ConfigEntry, store: DatapointsStore) -> None:
        """Initialise the aggregate anomaly monitors sensor."""
        super().__init__(entry, store)
        self._attr_unique_id = f"{entry.entry_id}_anomaly_monitors_active"
        self._attr_name = "Anomaly monitors active"
        self._attr_native_value = self._compute()

    def _compute(self) -> int:
        return sum(
            1
            for m in self._store.get_monitors()
            if m.get("enabled", True) and (m.get("last_cluster_count") or 0) > 0
        )
