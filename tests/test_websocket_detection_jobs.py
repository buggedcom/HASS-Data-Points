"""WebSocket detection requests as connection-owned runner jobs."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock, patch

import pytest

from custom_components.hass_datapoints.anomaly_cache import AnomalyCache
from custom_components.hass_datapoints.const import DOMAIN, KEY_STORE
from custom_components.hass_datapoints.detection_runner import (
    DetectionRunner,
    DetectionTimeout,
)
from custom_components.hass_datapoints.store import DatapointsStore
from custom_components.hass_datapoints.websocket_api import (
    ws_get_anomalies,
    ws_monitors_anomalies,
    ws_monitors_anomaly_activity,
)
from tests.conftest import make_inline_runner
from tests.test_websocket_api import _anomaly_msg, _make_connection

pytestmark = pytest.mark.asyncio

_WS = "custom_components.hass_datapoints.websocket_api"
_HU = "custom_components.hass_datapoints.history_utils"
_SENSOR = "custom_components.hass_datapoints.sensor"
_MID = "11111111-1111-4111-8111-111111111111"
_PTS = [[t * 60_000, float(t % 7)] for t in range(40)]
_CLOSED_RANGE = {
    "start_time": "2024-01-01T00:00:00+00:00",
    "end_time": "2024-01-02T00:00:00+00:00",
}


def _recorder():
    recorder = MagicMock()

    async def run(fn, *args):
        return fn(*args)

    recorder.async_add_executor_job = run
    return recorder


def _hass(runner=None, **data):
    hass = MagicMock()
    hass.data = {DOMAIN: {"runner": runner or make_inline_runner(), **data}}

    async def run(fn, *args):
        return fn(*args)

    hass.async_add_executor_job = run
    return hass


def _connection():
    connection = _make_connection(is_admin=True)
    connection.subscriptions = {}
    return connection


def _store(monitor):
    store = DatapointsStore(MagicMock(), ":memory:")
    store._data = {"monitors": [monitor]}
    return store


class DescribeErrorCodes:
    @pytest.mark.parametrize(
        ("raised", "code"),
        [
            (DetectionTimeout(), "detection_timeout"),
            (RuntimeError("/config/secret.db locked"), "detection_error"),
        ],
    )
    async def test_GIVEN_detection_failure_WHEN_chart_requests_anomalies_THEN_stable_code_without_raw_text(
        self, raised, code
    ):
        hass = _hass()
        connection = _connection()

        with (
            patch(f"{_HU}.get_instance", return_value=_recorder()),
            patch(f"{_HU}.fetch_entity_pts", return_value=list(_PTS)),
            patch(f"{_HU}.fetch_entity_statistics_pts", return_value=[]),
            patch(f"{_WS}._run_detection", side_effect=raised),
        ):
            await ws_get_anomalies(hass, connection, _anomaly_msg("sensor.temp"))

        connection.send_result.assert_not_called()
        _msg_id, sent_code, message = connection.send_error.call_args.args
        assert sent_code == code
        assert "secret" not in message

    async def test_GIVEN_full_queue_WHEN_chart_requests_anomalies_THEN_busy(self):
        runner = DetectionRunner(max_active=1, max_waiting=0)
        release = asyncio.Event()

        async def hog(_job):
            await release.wait()

        hog_task = asyncio.create_task(runner.submit(hog))
        await asyncio.sleep(0)
        connection = _connection()

        await ws_get_anomalies(_hass(runner), connection, _anomaly_msg("sensor.temp"))

        assert connection.send_error.call_args.args[1] == "detection_busy"
        release.set()
        await hog_task

    async def test_GIVEN_monitor_request_fails_WHEN_called_THEN_explicit_failure_not_partial(
        self,
    ):
        monitor = {
            "id": _MID,
            "type": "combined",
            "entity_ids": ["sensor.a", "sensor.b"],
            "anomaly_methods": ["iqr"],
        }
        hass = _hass(**{KEY_STORE: _store(monitor)})
        connection = _connection()
        calls = []

        def detect(pts, config, comparison_pts, cancel):
            calls.append(1)
            if len(calls) == 2:
                raise DetectionTimeout
            return []

        with (
            patch("homeassistant.components.recorder.get_instance"),
            patch(f"{_SENSOR}.async_prepare_entity_series", return_value=_PTS),
            patch(f"{_SENSOR}._run_detection_sync", side_effect=detect),
        ):
            await ws_monitors_anomalies(hass, connection, {"id": 4, "monitor_id": _MID})

        connection.send_result.assert_not_called()
        assert connection.send_error.call_args.args[1] == "detection_timeout"


class DescribeConnectionOwnership:
    async def test_GIVEN_running_request_WHEN_connection_closes_THEN_its_job_is_cancelled(
        self,
    ):
        hass = _hass()
        connection = _connection()
        prepared = asyncio.Event()
        release = asyncio.Event()

        async def slow_prepare(*_args, **_kwargs):
            prepared.set()
            await release.wait()
            return list(_PTS)

        with (
            patch(f"{_WS}.async_prepare_entity_series", side_effect=slow_prepare),
            patch(f"{_WS}._run_detection", return_value=[]) as detect,
        ):
            request = asyncio.create_task(
                ws_get_anomalies(
                    hass,
                    connection,
                    {**_anomaly_msg("sensor.temp"), "request_id": "chart-1"},
                )
            )
            await prepared.wait()
            assert len(connection.subscriptions) == 1

            # HA calls every subscription callback when the socket closes.
            for unsubscribe in list(connection.subscriptions.values()):
                unsubscribe()
            release.set()
            await request

        detect.assert_not_called()
        assert connection.send_error.call_args.args[1] == "detection_cancelled"
        assert connection.subscriptions == {}
        assert hass.data[DOMAIN].get("in_flight", {}) == {}


class DescribeCache:
    async def test_GIVEN_closed_range_with_no_anomalies_WHEN_requested_twice_THEN_second_is_an_empty_cache_hit(
        self, tmp_path
    ):
        cache = AnomalyCache(str(tmp_path / "cache.db"))
        hass = _hass(anomaly_cache=cache)
        msg = {**_anomaly_msg("sensor.temp"), **_CLOSED_RANGE}

        with (
            patch(f"{_WS}.async_prepare_entity_series", return_value=list(_PTS)),
            patch(f"{_WS}._run_detection", return_value=[]) as detect,
        ):
            first = _connection()
            await ws_get_anomalies(hass, first, msg)
            second = _connection()
            await ws_get_anomalies(hass, second, msg)

        assert detect.call_count == 1
        assert first.send_result.call_args.args[1]["cached"] is False
        assert second.send_result.call_args.args[1] == {
            "entity_id": "sensor.temp",
            "anomaly_clusters": [],
            "cached": True,
        }


class DescribeCombinedActivity:
    async def test_GIVEN_combined_monitor_WHEN_activity_requested_THEN_each_entity_detected_once(
        self,
    ):
        monitor = {
            "id": _MID,
            "type": "combined",
            "entity_ids": ["sensor.temp", "sensor.humidity"],
            "anomaly_methods": ["trend_residual", "rate_of_change"],
            "overlap_mode": "all",
            "dismissed_windows": [],
        }
        hass = _hass(**{KEY_STORE: _store(monitor)})
        connection = _connection()
        cluster = {
            "points": [
                {"timeMs": 1_700_000_001_000, "value": 1.0},
                {"timeMs": 1_700_000_002_000, "value": 1.0},
            ]
        }

        with (
            patch("homeassistant.components.recorder.get_instance"),
            patch(f"{_SENSOR}.async_prepare_entity_series", return_value=_PTS),
            patch(f"{_SENSOR}._run_detection_sync", return_value=[cluster]) as detect,
        ):
            await ws_monitors_anomaly_activity(
                hass,
                connection,
                {
                    "id": 9,
                    "monitor_id": _MID,
                    "start_time": "2023-11-14T22:13:20+00:00",
                    "end_time": "2023-11-14T22:13:30+00:00",
                    "bucket_count": 10,
                },
            )

        connection.send_error.assert_not_called()
        assert detect.call_count == 2
        result = connection.send_result.call_args.args[1]
        assert result["monitor_id"] == _MID


class DescribeCancelRequest:
    async def test_GIVEN_queued_request_WHEN_client_cancels_it_THEN_it_frees_its_queue_place(
        self,
    ):
        from custom_components.hass_datapoints.websocket_api import ws_cancel_request

        runner = DetectionRunner(max_active=1, max_waiting=1)
        release = asyncio.Event()

        async def hog(_job):
            await release.wait()

        hog_task = asyncio.create_task(runner.submit(hog))
        await asyncio.sleep(0)
        hass = _hass(runner)
        connection = _connection()
        gate = asyncio.Event()

        async def slow_prepare(*_args, **_kwargs):
            await gate.wait()
            return list(_PTS)

        with patch(f"{_WS}.async_prepare_entity_series", side_effect=slow_prepare):
            request = asyncio.create_task(
                ws_get_anomalies(
                    hass,
                    connection,
                    {**_anomaly_msg("sensor.temp"), "request_id": "chart-1"},
                )
            )
            for _ in range(5):
                await asyncio.sleep(0)
            assert runner.waiting_count == 1

            ws_cancel_request(
                hass, connection, {"id": 99, "request_id": "chart-1"}
            )
            await request

        assert runner.waiting_count == 0
        assert connection.send_error.call_args.args[1] == "detection_cancelled"
        release.set()
        await hog_task
