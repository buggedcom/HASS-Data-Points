"""Behavioral coverage for the native Data Points tool boundary."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import probatio
import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints import llm_tools
from custom_components.hass_datapoints.const import DOMAIN, KEY_STORE
from custom_components.hass_datapoints.llm import async_get_tools

START = "2026-01-01T00:00:00+00:00"
END = "2026-01-01T03:00:00+00:00"
T0 = 1767225600000
HOUR = 3600000


@pytest.fixture
async def hass():
    instance = MagicMock()
    instance.data = {
        DOMAIN: {
            KEY_STORE: MagicMock(),
            "scan_semaphore": asyncio.Semaphore(2),
            "executor": None,
        }
    }
    instance.loop = asyncio.get_running_loop()
    instance.auth.async_get_user = AsyncMock(
        return_value=SimpleNamespace(is_admin=True)
    )
    instance.states.get.return_value = None
    return instance


async def call(hass, name, arguments):
    tool = next(t for t in llm_tools.create_tools() if t.name == f"{DOMAIN}__{name}")
    return (
        await tool.async_call(
            hass,
            SimpleNamespace(tool_args=arguments),
            SimpleNamespace(context=SimpleNamespace(user_id="test-user")),
        )
    ).data


class DescribeDiscovery:
    async def test_GIVEN_loaded_integration_WHEN_HA_discovers_tools_THEN_only_admin_set_has_serializable_tools(
        self, hass, monkeypatch
    ):
        import sys

        monkeypatch.setitem(
            sys.modules,
            "homeassistant.components.llm",
            SimpleNamespace(LLMTools=SimpleNamespace),
        )
        assert async_get_tools(hass, None, "assist") is None
        tools = async_get_tools(hass, None, "homeassistant").tools
        assert {tool.name for tool in tools} == {
            f"{DOMAIN}__{name}"
            for name in (
                "list_events",
                "list_monitors",
                "get_monitor_anomalies",
                "analyze_chart",
                "aggregate_entity",
                "record",
            )
        }
        for tool in tools:
            assert probatio.to_openapi(tool.parameters)["type"] == "object"
            assert tool.annotations.read_only == (tool.name != f"{DOMAIN}__record")
        hass.data.clear()
        assert async_get_tools(hass, None, "homeassistant") is None

    async def test_GIVEN_non_admin_WHEN_reading_annotations_THEN_access_is_denied(
        self, hass
    ):
        hass.auth.async_get_user.return_value.is_admin = False
        store = hass.data[DOMAIN][KEY_STORE]
        with pytest.raises(Unauthorized):
            await call(hass, "list_events", {})
        store.async_get_events.assert_not_called()


class DescribeChartAnalysis:
    async def test_GIVEN_numeric_history_and_a_prior_window_WHEN_analyzed_THEN_returns_chart_values_and_paging(
        self, hass, monkeypatch
    ):
        async def fetch(_hass, entity_id, start, end):
            if start == START:
                times, values = [T0, T0 + HOUR, T0 + 2 * HOUR], [2, 6, 10]
            else:
                times, values = [T0 - 24 * HOUR, T0 - 22 * HOUR], [1, 5]
            return {
                "samples": [
                    {"time": t, "value": v} for t, v in zip(times, values, strict=True)
                ],
                "statistics": [],
            }

        monkeypatch.setattr(llm_tools, "async_fetch_analysis_data", fetch)
        result = await call(
            hass,
            "analyze_chart",
            {
                "start_time": START,
                "end_time": END,
                "limit": 2,
                "series": [
                    {
                        "entity_id": "sensor.temperature",
                        "trend_methods": [
                            "rolling_average",
                            "linear_trend",
                            "ema",
                            "polynomial_trend",
                            "lowess",
                        ],
                        "trend_window": "1h",
                        "rate_window": "point_to_point",
                        "threshold_value": 4,
                        "comparison": {
                            "entity_id": "sensor.temperature",
                            "start_time": "2025-12-31T00:00:00+00:00",
                            "end_time": "2025-12-31T03:00:00+00:00",
                        },
                    }
                ],
            },
        )
        row = result["series"][0]
        assert row["summary"] == {"min": 2, "max": 10, "mean": 6}
        assert row["points"]["next_offset"] == 2
        assert len(row["trends"]) == 5
        assert row["trends"]["rolling_average"]["items"] == [[T0, 2], [T0 + HOUR, 4]]
        assert row["rate_of_change"]["items"] == [[T0 + HOUR, 4], [T0 + 2 * HOUR, 4]]
        assert row["delta"]["items"] == [[T0, 1], [T0 + HOUR, 3]]
        assert row["threshold_spans"]["items"] == [
            {"start": T0 + HOUR / 2, "end": T0 + 2 * HOUR}
        ]

    async def test_GIVEN_binary_history_with_unknown_time_WHEN_aggregated_THEN_percent_uses_known_time(
        self, hass, monkeypatch
    ):
        monkeypatch.setattr(
            llm_tools,
            "async_fetch_analysis_data",
            AsyncMock(
                return_value={
                    "samples": [
                        {"time": T0, "state": "on"},
                        {"time": T0 + HOUR / 4, "state": "unavailable"},
                        {"time": T0 + HOUR / 2, "state": "off"},
                    ]
                }
            ),
        )
        result = await call(
            hass,
            "aggregate_entity",
            {
                "entity_id": "binary_sensor.door",
                "operation": "state_percentage",
                "interval": "hour",
                "time_zone": "UTC",
                "start_time": START,
                "end_time": END,
                "states": ["on"],
            },
        )
        first = result["points"]["items"][0]
        assert first["value"] == pytest.approx(100 / 3)
        assert first["incomplete"] is True
        assert first["knownDuration"] == 2700000
