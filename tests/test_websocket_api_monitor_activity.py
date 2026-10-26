"""Tests for the range-scoped monitor anomaly activity WebSocket command."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.websocket_api import (
    ws_monitors_anomaly_activity,
)
from tests.test_websocket_api_monitors import (
    _WS,
    _make_connection,
    _make_hass,
    _make_store,
    _recorder_sync,
)

_MID = "11111111-1111-4111-8111-111111111111"
_T0 = 1_700_000_000_000  # range start (ms)
_RANGE_MS = 10_000


def _iso(ms):
    return datetime.fromtimestamp(ms / 1000, UTC).isoformat()


def _cluster_at(*offsets):
    return {"points": [{"timeMs": _T0 + o, "value": 1.0} for o in offsets]}


def _activity_msg(**overrides):
    msg = {
        "id": 1,
        "type": f"{DOMAIN}/monitors/anomaly_activity",
        "monitor_id": _MID,
        "start_time": _iso(_T0),
        "end_time": _iso(_T0 + _RANGE_MS),
        "bucket_count": 10,
    }
    msg.update(overrides)
    return msg


async def _run_activity(
    monitor, msg, clusters_by_entity, combined_clusters=None, kwargs_sink=None
):
    store = _make_store([monitor])
    hass = _make_hass(store)
    hass.data[DOMAIN]["executor"] = None
    connection = _make_connection()
    seen_ranges = []
    detected = []

    async def run_in_executor(pool, fn, *args):
        return fn(*args)

    hass.loop.run_in_executor = run_in_executor

    async def fake_prepare(hass_, entity_id, start, end, **kwargs):
        seen_ranges.append((entity_id, start, end))
        if kwargs_sink is not None:
            kwargs_sink.append(kwargs)
        return [[i, 0.0] for i in range(5)]

    async def fake_detect(hass_, pool, pts, config, comparison_pts, cancel):
        # Entities are prepared and detected in the same order.
        entity_id = seen_ranges[len(detected)][0]
        detected.append(entity_id)
        return clusters_by_entity.get(entity_id, [])

    with (
        patch(f"{_WS}.async_prepare_entity_series", fake_prepare),
        patch(f"{_WS}._run_detection_with_timeout", fake_detect),
        patch(f"{_WS}.get_instance", return_value=_recorder_sync()),
        patch(
            "custom_components.hass_datapoints.sensor._run_combined_detection",
            return_value=combined_clusters or [],
        ),
    ):
        await ws_monitors_anomaly_activity(hass, connection, msg)

    return connection, seen_ranges


class DescribeWsMonitorsAnomalyActivity:
    async def test_GIVEN_sampled_monitor_WHEN_called_THEN_series_prepared_like_scan(
        self,
    ):
        from custom_components.hass_datapoints.const import ANOMALY_MAX_PTS

        monitor = {
            "id": _MID,
            "type": "individual",
            "entity_id": "sensor.a",
            "sample_interval": "1h",
            "sample_aggregate": "max",
        }
        sink: list = []

        await _run_activity(monitor, _activity_msg(), {}, kwargs_sink=sink)

        assert sink == [
            {
                "sample_interval": "1h",
                "sample_aggregate": "max",
                "max_pts": ANOMALY_MAX_PTS,
            }
        ]

    async def test_GIVEN_individual_monitor_WHEN_called_THEN_range_scoped_counts(
        self,
    ):
        monitor = {"id": _MID, "type": "individual", "entity_id": "sensor.a"}
        clusters = {
            "sensor.a": [_cluster_at(100, 200), _cluster_at(5500), _cluster_at(-50)]
        }

        connection, seen = await _run_activity(monitor, _activity_msg(), clusters)

        connection.send_error.assert_not_called()
        assert seen == [("sensor.a", _iso(_T0), _iso(_T0 + _RANGE_MS))]
        result = connection.send_result.call_args[0][1]
        assert result["monitor_id"] == _MID
        assert result["start_ms"] == _T0
        assert result["end_ms"] == _T0 + _RANGE_MS
        assert result["bucket_ms"] == 1000
        assert result["total_anomalies"] == 3
        assert result["incident_count"] == 2
        (entity,) = result["entities"]
        assert entity["entity_id"] == "sensor.a"
        assert entity["total"] == 3
        assert len(entity["buckets"]) == 10
        assert entity["buckets"][0]["anomaly_count"] == 2
        assert entity["buckets"][5]["anomaly_count"] == 1

    async def test_GIVEN_combined_monitor_WHEN_called_THEN_attributes_each_member(
        self,
    ):
        monitor = {
            "id": _MID,
            "type": "combined",
            "entity_ids": ["sensor.a", "sensor.b"],
            "overlap_mode": "all",
        }
        clusters = {
            "sensor.a": [_cluster_at(100)],
            "sensor.b": [_cluster_at(150), _cluster_at(8000)],
        }

        connection, _ = await _run_activity(
            monitor,
            _activity_msg(),
            clusters,
            combined_clusters=[_cluster_at(100, 150)],
        )

        result = connection.send_result.call_args[0][1]
        by_id = {e["entity_id"]: e for e in result["entities"]}
        assert by_id["sensor.a"]["total"] == 1
        assert by_id["sensor.b"]["total"] == 2
        assert result["total_anomalies"] == 3
        # Combined monitors report overlap incidents, not per-entity clusters.
        assert result["incident_count"] == 1

    async def test_GIVEN_dismissed_window_WHEN_called_THEN_cluster_excluded(self):
        monitor = {
            "id": _MID,
            "type": "individual",
            "entity_id": "sensor.a",
            "dismissed_windows": [
                {
                    "id": "w",
                    "start_ms": _T0 + 50,
                    "end_ms": _T0 + 250,
                    "dismissed_at": _iso(_T0),
                    "expires_at": None,
                }
            ],
        }
        clusters = {"sensor.a": [_cluster_at(100, 200), _cluster_at(5500)]}

        connection, _ = await _run_activity(monitor, _activity_msg(), clusters)

        result = connection.send_result.call_args[0][1]
        assert result["total_anomalies"] == 1
        assert result["incident_count"] == 1

    async def test_GIVEN_monitor_without_entities_WHEN_called_THEN_empty_result(
        self,
    ):
        monitor = {"id": _MID, "type": "individual", "entity_id": ""}

        connection, seen = await _run_activity(monitor, _activity_msg(), {})

        assert seen == []
        result = connection.send_result.call_args[0][1]
        assert result["entities"] == []
        assert result["total_anomalies"] == 0
        assert result["incident_count"] == 0

    async def test_GIVEN_unknown_monitor_WHEN_called_THEN_not_found(self):
        hass = _make_hass(_make_store())
        connection = _make_connection()

        await ws_monitors_anomaly_activity(hass, connection, _activity_msg())

        assert connection.send_error.call_args[0][1] == "not_found"

    async def test_GIVEN_end_before_start_WHEN_called_THEN_invalid_range(self):
        monitor = {"id": _MID, "type": "individual", "entity_id": "sensor.a"}
        hass = _make_hass(_make_store([monitor]))
        connection = _make_connection()
        msg = _activity_msg(start_time=_iso(_T0 + 10), end_time=_iso(_T0))

        await ws_monitors_anomaly_activity(hass, connection, msg)

        assert connection.send_error.call_args[0][1] == "invalid_range"

    async def test_GIVEN_non_admin_WHEN_called_THEN_raises_unauthorized(self):
        hass = _make_hass(_make_store())
        connection = _make_connection(is_admin=False)

        with pytest.raises(Unauthorized):
            await ws_monitors_anomaly_activity(hass, connection, _activity_msg())
