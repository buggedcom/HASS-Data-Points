"""Tests for DatapointsMonitorSensor and related helpers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helper imports
# ---------------------------------------------------------------------------


def _make_store(monitors=None):
    from custom_components.hass_datapoints.store import DatapointsStore

    store = DatapointsStore(MagicMock())
    inner = MagicMock()
    inner.async_load = AsyncMock(return_value=None)
    inner.async_save = AsyncMock(return_value=None)
    store._store = inner
    store._data = {"events": [], "monitors": monitors or []}
    return store


def _make_entry(entry_id="test_entry"):
    entry = MagicMock()
    entry.entry_id = entry_id
    return entry


# ---------------------------------------------------------------------------
# _build_detection_config
# ---------------------------------------------------------------------------


def test_build_detection_config_defaults():
    from custom_components.hass_datapoints.sensor import _build_detection_config

    monitor = {}
    cfg = _build_detection_config(monitor)
    assert cfg["anomaly_methods"] == ["trend_residual"]
    assert cfg["anomaly_sensitivity"] == "medium"
    assert cfg["trend_method"] == "rolling_average"
    assert cfg["trend_window"] == "24h"


def test_build_detection_config_custom():
    from custom_components.hass_datapoints.sensor import _build_detection_config

    monitor = {
        "anomaly_methods": ["iqr", "persistence"],
        "anomaly_sensitivity": "high",
        "anomaly_trend_method": "ema",
        "anomaly_trend_window": "7d",
        "sample_interval": "1h",
        "sample_aggregate": "max",
    }
    cfg = _build_detection_config(monitor)
    assert cfg["anomaly_methods"] == ["iqr", "persistence"]
    assert cfg["anomaly_sensitivity"] == "high"
    assert cfg["trend_method"] == "ema"
    assert cfg["trend_window"] == "7d"
    assert cfg["sample_interval"] == "1h"
    assert cfg["sample_aggregate"] == "max"


def test_summarize_clusters_returns_compact_shape():
    from custom_components.hass_datapoints.sensor import _summarize_clusters

    summaries = _summarize_clusters(
        [
            {
                "points": [
                    {"timeMs": 1000, "value": 1.0, "other": "x"},
                    {"timeMs": 2000, "value": 2.0, "other": "y"},
                ],
                "anomalyMethod": "iqr",
                "maxDeviation": 3.5,
                "ignored": True,
            }
        ]
    )

    assert summaries == [
        {
            "start_ms": 1000,
            "end_ms": 2000,
            "anomaly_method": "iqr",
            "max_deviation": 3.5,
            "point_count": 2,
        }
    ]


def test_summarize_clusters_caps_to_latest_25_entries():
    from custom_components.hass_datapoints.sensor import _summarize_clusters

    clusters = [
        {
            "points": [{"timeMs": idx, "value": 0.0}],
            "anomalyMethod": f"m{idx}",
            "maxDeviation": idx,
        }
        for idx in range(30)
    ]

    summaries = _summarize_clusters(clusters)

    assert len(summaries) == 25
    assert summaries[0]["start_ms"] == 5
    assert summaries[-1]["start_ms"] == 29


# ---------------------------------------------------------------------------
# DatapointsMonitorSensor
# ---------------------------------------------------------------------------


def test_unique_id_format():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(
        monitors=[{"id": "abc123", "name": "Test Monitor", "last_cluster_count": 0}]
    )
    sensor = DatapointsMonitorSensor(_make_entry("ent1"), store, MagicMock(), "abc123")
    assert sensor._attr_unique_id == "ent1_monitor_abc123"


def test_compute_reads_last_cluster_count():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(monitors=[{"id": "m1", "name": "M1", "last_cluster_count": 7}])
    sensor = DatapointsMonitorSensor(_make_entry(), store, MagicMock(), "m1")
    assert sensor._attr_native_value == 7


def test_handle_store_update_refreshes_state():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(monitors=[{"id": "m1", "name": "Old", "last_cluster_count": 0}])
    hass = MagicMock()
    sensor = DatapointsMonitorSensor(_make_entry(), store, hass, "m1")

    # Simulate store mutation
    store._data["monitors"][0]["last_cluster_count"] = 5
    store._data["monitors"][0]["name"] = "New Name"
    sensor._schedule_timer = MagicMock()
    sensor._handle_store_update()

    assert sensor._attr_native_value == 5
    assert sensor._attr_name == "New Name"


def test_extra_state_attributes_expose_compact_cluster_summaries_only():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(
        monitors=[
            {
                "id": "m1",
                "name": "M1",
                "type": "individual",
                "entity_id": "sensor.temp",
                "last_cluster_count": 2,
                "active_cluster_count": 2,
                "active_clusters_summary": [
                    {
                        "start_ms": 1000,
                        "end_ms": 2000,
                        "anomaly_method": "iqr",
                        "max_deviation": 2.5,
                        "point_count": 3,
                    }
                ],
                "last_scan_data_points": 42,
                "last_scan_at": "2024-01-01T00:00:00+00:00",
                "last_anomaly_at": "2024-01-01T00:00:00+00:00",
                "dismissed_windows": [],
                "anomaly_methods": ["iqr"],
            }
        ]
    )
    sensor = DatapointsMonitorSensor(_make_entry(), store, MagicMock(), "m1")

    attrs = sensor.extra_state_attributes

    assert attrs["active_cluster_count"] == 2
    assert attrs["active_clusters"] == [
        {
            "start_ms": 1000,
            "end_ms": 2000,
            "anomaly_method": "iqr",
            "max_deviation": 2.5,
            "point_count": 3,
        }
    ]
    assert "points" not in attrs["active_clusters"][0]


def test_schedule_timer_skips_when_disabled():

    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(
        monitors=[{"id": "m1", "name": "M1", "last_cluster_count": 0, "enabled": False}]
    )
    hass = MagicMock()
    sensor = DatapointsMonitorSensor(_make_entry(), store, hass, "m1")
    sensor._unsub_timer = None
    sensor.async_on_remove = MagicMock()
    sensor._schedule_timer()
    assert sensor._unsub_timer is None


def test_schedule_timer_creates_interval_when_enabled():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(
        monitors=[
            {
                "id": "m1",
                "name": "M1",
                "last_cluster_count": 0,
                "enabled": True,
                "scan_interval_minutes": 30,
            }
        ]
    )
    hass = MagicMock()
    sensor = DatapointsMonitorSensor(_make_entry(), store, hass, "m1")
    sensor.async_on_remove = MagicMock()
    sensor._schedule_timer()
    assert sensor._unsub_timer is not None


def test_schedule_timer_cancels_previous():
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(
        monitors=[
            {
                "id": "m1",
                "name": "M1",
                "last_cluster_count": 0,
                "enabled": True,
                "scan_interval_minutes": 30,
            }
        ]
    )
    hass = MagicMock()
    sensor = DatapointsMonitorSensor(_make_entry(), store, hass, "m1")
    sensor.async_on_remove = MagicMock()

    old_unsub = MagicMock()
    sensor._unsub_timer = old_unsub
    sensor._schedule_timer()
    old_unsub.assert_called_once()


@pytest.mark.asyncio
async def test_run_scan_persists_cluster_summaries_and_detected_event_payload():
    from custom_components.hass_datapoints.const import EVENT_ANOMALY_DETECTED

    monitor = {
        "id": "m1",
        "name": "Monitor 1",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "anomaly_methods": ["iqr"],
        "dismissed_windows": [],
        "scan_history": [],
        "last_cluster_count": 0,
    }
    sensor, hass = _make_scan_sensor(monitor)

    detected_clusters = [
        {
            "points": [
                {"timeMs": 1000, "value": 1.0},
                {"timeMs": 2000, "value": 2.0},
            ],
            "anomalyMethod": "iqr",
            "maxDeviation": 4.2,
        }
    ]

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=detected_clusters),
    ):
        await sensor._run_scan()

    updated_monitor = sensor._store.get_monitor("m1")
    assert updated_monitor is not None
    assert updated_monitor["active_cluster_count"] == 1
    assert updated_monitor["active_clusters_summary"] == [
        {
            "start_ms": 1000,
            "end_ms": 2000,
            "anomaly_method": "iqr",
            "max_deviation": 4.2,
            "point_count": 2,
        }
    ]

    hass.bus.async_fire.assert_called_once()
    event_name, payload = hass.bus.async_fire.call_args.args
    assert event_name == EVENT_ANOMALY_DETECTED
    assert payload["active_cluster_count"] == 1
    assert payload["active_clusters"] == updated_monitor["active_clusters_summary"]
    assert payload["consecutive_anomalous_scans"] == 1
    assert payload["cluster_count"] == 1


@pytest.mark.asyncio
async def test_run_scan_resolution_clears_active_clusters_and_emits_resolved_clusters():
    from custom_components.hass_datapoints.const import EVENT_ANOMALY_RESOLVED

    existing_summary = [
        {
            "start_ms": 1000,
            "end_ms": 2000,
            "anomaly_method": "iqr",
            "max_deviation": 4.2,
            "point_count": 2,
        }
    ]
    monitor = {
        "id": "m1",
        "name": "Monitor 1",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "anomaly_methods": ["iqr"],
        "dismissed_windows": [],
        "scan_history": [{"t": "prev", "count": 1}],
        "last_cluster_count": 1,
        "active_cluster_count": 1,
        "active_clusters_summary": existing_summary,
    }
    sensor, hass = _make_scan_sensor(monitor)

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[]),
    ):
        await sensor._run_scan()

    updated_monitor = sensor._store.get_monitor("m1")
    assert updated_monitor is not None
    assert updated_monitor["active_cluster_count"] == 0
    assert updated_monitor["active_clusters_summary"] == []
    assert updated_monitor["last_resolved_clusters_summary"] == existing_summary

    hass.bus.async_fire.assert_called_once()
    event_name, payload = hass.bus.async_fire.call_args.args
    assert event_name == EVENT_ANOMALY_RESOLVED
    assert payload["active_cluster_count"] == 0
    assert payload["active_clusters"] == []
    assert payload["resolved_clusters"] == existing_summary


# ---------------------------------------------------------------------------
# _run_combined_detection
# ---------------------------------------------------------------------------


def _make_cluster(start_ms: int, end_ms: int) -> dict:
    """Create a cluster dict in the new format (points with timeMs)."""
    return {
        "points": [
            {"timeMs": start_ms, "value": 0.0},
            {"timeMs": end_ms, "value": 0.0},
        ],
        "anomalyMethod": "trend_residual",
        "maxDeviation": 1.0,
    }


def test_run_combined_detection_all_mode_overlap():
    """Two entities each have a cluster at overlapping times → returns ≥1 cluster."""
    from custom_components.hass_datapoints.sensor import _run_combined_detection

    pts_a = [[t, float(t)] for t in range(100, 200, 5)]
    pts_b = [[t, float(t)] for t in range(100, 200, 5)]

    with patch(
        "custom_components.hass_datapoints.sensor.run_anomaly_detection"
    ) as mock_det:
        mock_det.side_effect = [
            [_make_cluster(100, 200)],
            [_make_cluster(100, 200)],
        ]
        clusters = _run_combined_detection(
            {"a": pts_a, "b": pts_b},
            {},
            "all",
        )
    assert isinstance(clusters, list)
    assert len(clusters) >= 1
    # Cluster should have the correct structure
    assert "points" in clusters[0]
    assert clusters[0]["anomalyMethod"] == "combined_overlap"


def test_run_combined_detection_no_overlap():
    """Clusters at different times → empty list in 'all' mode."""
    from custom_components.hass_datapoints.sensor import _run_combined_detection

    pts_a = [[t, 1.0] for t in range(100, 200, 5)]
    pts_b = [[t, 1.0] for t in range(500, 600, 5)]

    with patch(
        "custom_components.hass_datapoints.sensor.run_anomaly_detection"
    ) as mock_det:
        mock_det.side_effect = [
            [_make_cluster(100, 200)],
            [_make_cluster(500, 600)],
        ]
        clusters = _run_combined_detection(
            {"a": pts_a, "b": pts_b},
            {},
            "all",
        )
    assert clusters == []


def test_run_combined_detection_any_two_plus():
    """any_two_plus mode: returns clusters where >= 2 entities overlap."""
    from custom_components.hass_datapoints.sensor import _run_combined_detection

    pts = {
        "a": [[t, 1.0] for t in range(100, 200, 5)],
        "b": [[t, 1.0] for t in range(100, 200, 5)],
        "c": [[t, 1.0] for t in range(500, 600, 5)],
    }

    with patch(
        "custom_components.hass_datapoints.sensor.run_anomaly_detection"
    ) as mock_det:
        mock_det.side_effect = [
            [_make_cluster(100, 200)],
            [_make_cluster(100, 200)],
            [_make_cluster(500, 600)],
        ]
        clusters = _run_combined_detection(pts, {}, "any_two_plus")
    assert isinstance(clusters, list)
    assert len(clusters) >= 1


def test_run_combined_detection_too_few_entities():
    """Single entity → returns empty list immediately."""
    from custom_components.hass_datapoints.sensor import _run_combined_detection

    clusters = _run_combined_detection({"a": [[1, 1.0], [2, 2.0]]}, {}, "all")
    assert clusters == []


# ---------------------------------------------------------------------------
# _apply_dismissals
# ---------------------------------------------------------------------------


def test_apply_dismissals_no_dismissed_windows():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    clusters = [_make_cluster(1000, 2000)]
    assert _apply_dismissals(clusters, []) == clusters


def test_apply_dismissals_filters_overlapping_cluster():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    clusters = [_make_cluster(1000, 2000)]
    dismissed = [{"start_ms": 1500, "end_ms": 2500}]
    result = _apply_dismissals(clusters, dismissed)
    assert result == []


def test_apply_dismissals_keeps_non_overlapping_cluster():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    clusters = [_make_cluster(5000, 6000)]
    dismissed = [{"start_ms": 1000, "end_ms": 2000}]
    result = _apply_dismissals(clusters, dismissed)
    assert len(result) == 1


def test_apply_dismissals_partial_overlap_filters():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    # Cluster at 1000-2000, dismissed window starts in the middle
    clusters = [_make_cluster(1000, 2000)]
    dismissed = [{"start_ms": 1500, "end_ms": 3000}]
    result = _apply_dismissals(clusters, dismissed)
    assert result == []


def test_apply_dismissals_cluster_without_points_is_kept():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    # Clusters with no points are always kept (safe fallback)
    clusters = [{"anomalyMethod": "x", "maxDeviation": 0.0}]
    dismissed = [{"start_ms": 0, "end_ms": 9999}]
    result = _apply_dismissals(clusters, dismissed)
    assert len(result) == 1


def test_apply_dismissals_multiple_clusters_filtered_selectively():
    from custom_components.hass_datapoints.sensor import _apply_dismissals

    clusters = [_make_cluster(1000, 2000), _make_cluster(5000, 6000)]
    dismissed = [{"start_ms": 900, "end_ms": 2100}]
    result = _apply_dismissals(clusters, dismissed)
    assert len(result) == 1
    assert result[0]["points"][0]["timeMs"] == 5000


# ---------------------------------------------------------------------------
# DatapointsAggregateAnomalyMonitorsSensor
# ---------------------------------------------------------------------------


def test_aggregate_sensor_unique_id():
    from custom_components.hass_datapoints.sensor import (
        DatapointsAggregateAnomalyMonitorsSensor,
    )

    store = _make_store()
    sensor = DatapointsAggregateAnomalyMonitorsSensor(_make_entry("ent1"), store)
    assert sensor._attr_unique_id == "ent1_anomaly_monitors_active"


def test_aggregate_sensor_compute():
    from custom_components.hass_datapoints.sensor import (
        DatapointsAggregateAnomalyMonitorsSensor,
    )

    store = _make_store(
        monitors=[
            {"id": "m1", "enabled": True, "last_cluster_count": 3},
            {"id": "m2", "enabled": True, "last_cluster_count": 0},
            {"id": "m3", "enabled": False, "last_cluster_count": 5},
        ]
    )
    sensor = DatapointsAggregateAnomalyMonitorsSensor(_make_entry(), store)
    # Only m1 qualifies (enabled + count > 0)
    assert sensor._compute() == 1


# ---------------------------------------------------------------------------
# _run_scan — transition events
# ---------------------------------------------------------------------------

_MANY_PTS = [[t * 1000, float(t)] for t in range(50)]
_RECORDER_PATCH = "homeassistant.components.recorder.get_instance"
_FETCH_PTS_PATCH = "custom_components.hass_datapoints.sensor.fetch_entity_pts"
_FETCH_STATS_PATCH = (
    "custom_components.hass_datapoints.sensor.fetch_entity_statistics_pts"
)
_DETECT_PATCH = "custom_components.hass_datapoints.sensor._run_detection_sync"


def _make_scan_sensor(monitor_dict):
    """Create a DatapointsMonitorSensor wired for _run_scan() tests."""
    from custom_components.hass_datapoints.sensor import DatapointsMonitorSensor

    store = _make_store(monitors=[monitor_dict])

    async def fake_update_monitor(monitor_id, updates):
        monitor = store.get_monitor(monitor_id)
        if monitor is None:
            return None
        monitor.update(updates)
        return monitor

    store.async_update_monitor = AsyncMock(side_effect=fake_update_monitor)

    hass = MagicMock()
    hass.bus = MagicMock()

    async def fake_executor(fn, *args):
        return fn(*args)

    hass.async_add_executor_job = fake_executor

    sensor = DatapointsMonitorSensor(_make_entry(), store, hass, monitor_dict["id"])
    sensor.async_write_ha_state = MagicMock()
    return sensor, hass


def _recorder_mock():
    recorder = MagicMock()

    async def fake_executor(fn, *args):
        return fn(*args)

    recorder.async_add_executor_job = fake_executor
    return recorder


async def test_run_scan_fires_detected_zero_to_nonzero():
    """0 → 2 clusters fires EVENT_ANOMALY_DETECTED with correct payload."""
    from custom_components.hass_datapoints.const import EVENT_ANOMALY_DETECTED

    monitor = {
        "id": "m1",
        "name": "My Monitor",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 0,
        "scan_history": [],
    }
    sensor, hass = _make_scan_sensor(monitor)

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(
            _DETECT_PATCH, return_value=[{"pts": [[100, 1.0]]}, {"pts": [[200, 1.0]]}]
        ),
    ):
        await sensor._run_scan()

    hass.bus.async_fire.assert_called_once()
    event_name, payload = hass.bus.async_fire.call_args[0]
    assert event_name == EVENT_ANOMALY_DETECTED
    assert payload["monitor_id"] == "m1"
    assert payload["monitor_name"] == "My Monitor"
    assert payload["entity_id"] == "sensor.temp"
    assert payload["cluster_count"] == 2
    assert "consecutive_anomalous_scans" in payload


async def test_run_scan_fires_resolved_nonzero_to_zero():
    """3 → 0 clusters fires EVENT_ANOMALY_RESOLVED without cluster_count."""
    from custom_components.hass_datapoints.const import EVENT_ANOMALY_RESOLVED

    monitor = {
        "id": "m1",
        "name": "My Monitor",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 3,
        "scan_history": [{"t": "2024-01-01T00:00:00", "count": 3}],
    }
    sensor, hass = _make_scan_sensor(monitor)

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[]),
    ):
        await sensor._run_scan()

    hass.bus.async_fire.assert_called_once()
    event_name, payload = hass.bus.async_fire.call_args[0]
    assert event_name == EVENT_ANOMALY_RESOLVED
    assert payload["monitor_id"] == "m1"
    assert payload["entity_id"] == "sensor.temp"
    assert "cluster_count" not in payload


async def test_run_scan_no_event_nonzero_to_nonzero():
    """2 → 4 clusters fires no event (already anomalous)."""
    monitor = {
        "id": "m1",
        "name": "M",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 2,
        "scan_history": [{"t": "2024-01-01T00:00:00", "count": 2}],
    }
    sensor, hass = _make_scan_sensor(monitor)

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[{"pts": [[t, 1.0]]} for t in range(4)]),
    ):
        await sensor._run_scan()

    hass.bus.async_fire.assert_not_called()


async def test_run_scan_no_event_zero_to_zero():
    """0 → 0 clusters fires no event."""
    monitor = {
        "id": "m1",
        "name": "M",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 0,
        "scan_history": [],
    }
    sensor, hass = _make_scan_sensor(monitor)

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[]),
    ):
        await sensor._run_scan()

    hass.bus.async_fire.assert_not_called()


# ---------------------------------------------------------------------------
# _run_scan — baseline entity fetch
# ---------------------------------------------------------------------------


async def test_run_scan_fetches_comparison_entity_when_baseline_set():
    """When baseline_entity_id is set and comparison_window is in methods,
    fetch_entity_pts is called a second time for the baseline entity."""
    monitor = {
        "id": "m1",
        "name": "M",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 0,
        "scan_history": [],
        "anomaly_methods": ["comparison_window"],
        "baseline_entity_id": "sensor.outdoor_temp",
        "dismissed_windows": [],
    }
    sensor, hass = _make_scan_sensor(monitor)

    fetch_calls = []

    def fake_fetch(hass_ref, entity_id, *args):
        fetch_calls.append(entity_id)
        return _MANY_PTS

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, side_effect=fake_fetch),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[]),
    ):
        await sensor._run_scan()

    assert "sensor.temp" in fetch_calls
    assert "sensor.outdoor_temp" in fetch_calls


async def test_run_scan_no_comparison_fetch_without_baseline():
    """If baseline_entity_id is absent, only the primary entity is fetched."""
    monitor = {
        "id": "m1",
        "name": "M",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 0,
        "scan_history": [],
        "anomaly_methods": ["trend_residual"],
        "dismissed_windows": [],
    }
    sensor, hass = _make_scan_sensor(monitor)

    fetch_calls = []

    def fake_fetch(hass_ref, entity_id, *args):
        fetch_calls.append(entity_id)
        return _MANY_PTS

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, side_effect=fake_fetch),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=[]),
    ):
        await sensor._run_scan()

    assert fetch_calls == ["sensor.temp"]


# ---------------------------------------------------------------------------
# _run_scan — dismissals applied
# ---------------------------------------------------------------------------


async def test_run_scan_applies_dismissals_to_clusters():
    """Clusters overlapping a dismissed window are filtered out before counting."""
    from datetime import UTC, datetime, timedelta

    expires_far_future = (datetime.now(UTC) + timedelta(days=365)).isoformat()
    monitor = {
        "id": "m1",
        "name": "M",
        "type": "individual",
        "entity_id": "sensor.temp",
        "enabled": True,
        "look_back_hours": 24,
        "scan_interval_minutes": 30,
        "last_cluster_count": 0,
        "scan_history": [],
        "anomaly_methods": ["trend_residual"],
        "dismissed_windows": [
            {
                "id": "w1",
                "start_ms": 1000,
                "end_ms": 3000,
                "dismissed_at": "2024-01-01T00:00:00+00:00",
                "expires_at": expires_far_future,
            },
        ],
    }
    sensor, hass = _make_scan_sensor(monitor)

    # Return 2 clusters: one overlapping the dismissed window, one outside
    detected_clusters = [
        {
            "points": [{"timeMs": 2000, "value": 1.0}],
            "anomalyMethod": "trend_residual",
            "maxDeviation": 1.0,
        },
        {
            "points": [{"timeMs": 9000, "value": 1.0}],
            "anomalyMethod": "trend_residual",
            "maxDeviation": 1.0,
        },
    ]

    with (
        patch(_RECORDER_PATCH, return_value=_recorder_mock()),
        patch(_FETCH_PTS_PATCH, return_value=_MANY_PTS),
        patch(_FETCH_STATS_PATCH, return_value=[]),
        patch(_DETECT_PATCH, return_value=detected_clusters),
    ):
        await sensor._run_scan()

    # Only 1 cluster (the non-dismissed one) should be counted
    update_call = sensor._store.async_update_monitor.call_args
    assert update_call is not None
    updates = update_call[0][1]
    assert updates["last_cluster_count"] == 1
