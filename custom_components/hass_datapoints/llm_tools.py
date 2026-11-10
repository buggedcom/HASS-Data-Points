"""Native Data Points tools; HA owns discovery, transport and authentication."""

from __future__ import annotations

import asyncio
import math
import threading
from datetime import datetime, timedelta
from functools import partial
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import probatio as p
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.helpers import llm

from . import llm_schemas as schemas
from .aggregation import calculate_aggregate
from .analysis_data import aggregate_input, async_fetch_analysis_data, numeric_points
from .chart_analysis import analyze_series, correlated_spans
from .const import DOMAIN, KEY_STORE

MAX_ANALYSIS_POINTS = 5000
ANALYSIS_TIMEOUT = 30


def _date(value: str) -> datetime:
    try:
        result = datetime.fromisoformat(value)
    except ValueError as err:
        raise ValueError("Use an ISO datetime with a timezone") from err
    if result.tzinfo is None:
        raise ValueError("Datetime must include a timezone")
    return result


def _range(args: dict) -> dict:
    start, end = _date(args["start_time"]), _date(args["end_time"])
    if not timedelta(0) < end - start <= timedelta(days=90):
        raise ValueError("Time range must be positive and at most 90 days")
    return {"start": start.timestamp() * 1000, "end": end.timestamp() * 1000}


def _page(items: list, args: dict) -> dict:
    start, limit = args["offset"], args["limit"]
    return {
        "items": items[start : start + limit],
        "total": len(items),
        "next_offset": start + limit if start + limit < len(items) else None,
    }


def _check_size(points: list) -> None:
    if len(points) > MAX_ANALYSIS_POINTS:
        raise ValueError(
            "More than 5000 analysis points; use a coarser sample_interval or shorter time range"
        )


async def _compute(hass, function, *args):
    cancel = threading.Event()
    try:
        async with asyncio.timeout(ANALYSIS_TIMEOUT):
            async with hass.data[DOMAIN]["scan_semaphore"]:
                return await hass.loop.run_in_executor(
                    hass.data[DOMAIN]["executor"],
                    partial(function, *args, cancel=cancel),
                )
    finally:
        cancel.set()


async def _events(hass, args, context):
    for key in ("start_time", "end_time"):
        if key in args:
            _date(args[key])
    if "start_time" in args and "end_time" in args:
        _range(args)
    events = await hass.data[DOMAIN][KEY_STORE].async_get_events(
        args.get("start_time"),
        args.get("end_time"),
        args.get("entity_ids"),
        args["limit"] + 1,
        args["offset"],
    )
    return {
        "events": events[: args["limit"]],
        "next_offset": args["offset"] + args["limit"]
        if len(events) > args["limit"]
        else None,
    }


async def _monitors(hass, args, context):
    fields = (
        "id",
        "name",
        "type",
        "enabled",
        "entity_id",
        "entity_ids",
        "anomaly_methods",
        "anomaly_sensitivity",
        "look_back_hours",
        "scan_interval_minutes",
        "last_scan_at",
        "active_cluster_count",
    )
    monitors = hass.data[DOMAIN][KEY_STORE].get_active_monitors()
    return {
        "monitors": _page(
            [{field: monitor.get(field) for field in fields} for monitor in monitors],
            args,
        )
    }


async def _findings(hass, args, context):
    monitor = hass.data[DOMAIN][KEY_STORE].get_monitor(args["monitor_id"])
    if not monitor or monitor.get("deleted_at"):
        raise ValueError("Monitor not found")
    return {
        "monitor_id": monitor["id"],
        "last_scan_at": monitor.get("last_scan_at"),
        "source": "saved_monitor_scan",
        "enabled": monitor.get("enabled", False),
        "active_cluster_count": monitor.get("active_cluster_count", 0),
        "clusters": _page(monitor.get("active_clusters_summary", []), args),
        "dismissed_windows": _page(monitor.get("dismissed_windows", []), args),
        "note": "Saved bounded summaries, not a fresh scan. Use analyze_chart for live analysis.",
    }


async def _record(hass, args, context):
    await hass.services.async_call(
        DOMAIN, "record", args, blocking=True, context=context.context
    )
    return {"recorded": True}


def _calculate_rows(rows: list, cancel=None) -> dict:
    results = []
    for row in rows:
        if cancel and cancel.is_set():
            raise TimeoutError
        result = analyze_series(
            row["points"], row["options"], row["comparison_points"], cancel
        )
        result.update(
            entity_id=row["entity_id"], unit=row["unit"], comparison=row["comparison"]
        )
        if row["comparison_points"]:
            comparison_options = {**row["options"]}
            comparison_options.pop("anomalies", None)
            comparison_options.pop("anomaly_points", None)
            comparison_options.pop("anomaly_comparison_points", None)
            result["comparison_analysis"] = analyze_series(
                row["comparison_points"], comparison_options, [], cancel
            )
        results.append(result)
    return {"series": results, "correlated_anomaly_spans": correlated_spans(results)}


def _paginate_analysis(result: dict, args: dict) -> dict:
    paged = dict(result)
    for key in (
        "points",
        "comparison_points",
        "delta",
        "rate_of_change",
        "threshold_spans",
    ):
        if key in result:
            paged[key] = _page(result[key], args)
    paged["trends"] = {
        method: _page(points, args)
        for method, points in result.get("trends", {}).items()
    }
    if "anomaly_clusters" in result:
        paged["anomaly_clusters"] = _page(result["anomaly_clusters"], args)
        paged["anomaly_clusters"]["items"] = [
            {
                **cluster,
                "points": _page(
                    cluster.get("points", []),
                    {
                        "offset": args["cluster_point_offset"],
                        "limit": min(args["limit"], 25),
                    },
                ),
            }
            for cluster in paged["anomaly_clusters"]["items"]
        ]
    if "comparison_analysis" in result:
        paged["comparison_analysis"] = _paginate_analysis(
            result["comparison_analysis"], args
        )
    return paged


async def _analyze(hass, args, context):
    bounds = _range(args)
    # Validate all ranges before making potentially expensive recorder requests.
    for options in args["series"]:
        if "threshold_value" in options and not math.isfinite(
            options["threshold_value"]
        ):
            raise ValueError("Threshold must be finite")
        if comparison := options.get("comparison"):
            _range(comparison)
            if not math.isfinite(comparison.get("time_offset_ms", 0)):
                raise ValueError("Comparison offset must be finite")
        anomaly = options.get("anomalies")
        if (
            anomaly
            and not comparison
            and {"comparison_window", "similar_entity"}.intersection(
                anomaly["anomaly_methods"]
            )
        ):
            raise ValueError(
                "Comparison anomaly methods require a comparison entity and range"
            )
    rows = []
    for options in args["series"]:
        entity_id = options["entity_id"]
        data = await async_fetch_analysis_data(
            hass, entity_id, args["start_time"], args["end_time"]
        )
        points = numeric_points(
            data, options["sample_interval"], options["sample_aggregate"]
        )
        _check_size(points)
        comparison_points = []
        comparison_metadata = None
        comparison_data = None
        if comparison := options.get("comparison"):
            comparison_bounds = _range(comparison)
            offset = comparison.get(
                "time_offset_ms", comparison_bounds["start"] - bounds["start"]
            )
            comparison_data = await async_fetch_analysis_data(
                hass,
                comparison["entity_id"],
                comparison["start_time"],
                comparison["end_time"],
            )
            comparison_points = [
                [time - offset, value]
                for time, value in numeric_points(
                    comparison_data,
                    options["sample_interval"],
                    options["sample_aggregate"],
                )
            ]
            _check_size(comparison_points)
            comparison_metadata = {**comparison, "time_offset_ms": offset}
        options = dict(options)
        if anomaly := options.get("anomalies"):
            anomaly = dict(anomaly)
            anomaly.setdefault(
                "trend_method", next(iter(options["trend_methods"]), "rolling_average")
            )
            anomaly.setdefault("trend_window", options["trend_window"])
            if "similar_entity" in anomaly["anomaly_methods"]:
                anomaly["anomaly_comparison_window_direction"] = anomaly[
                    "anomaly_similar_entity_direction"
                ]
            anomaly["anomaly_methods"] = list(
                dict.fromkeys(
                    "comparison_window" if method == "similar_entity" else method
                    for method in anomaly["anomaly_methods"]
                )
            )
            options["anomalies"] = anomaly
            if not anomaly["use_sampled_data"]:
                options["anomaly_points"] = numeric_points(data, "raw", "mean")
                _check_size(options["anomaly_points"])
                if comparison_data is not None:
                    options["anomaly_comparison_points"] = [
                        [time - offset, value]
                        for time, value in numeric_points(
                            comparison_data, "raw", "mean"
                        )
                    ]
                    _check_size(options["anomaly_comparison_points"])
        state = hass.states.get(entity_id)
        rows.append(
            {
                "entity_id": entity_id,
                "points": points,
                "options": options,
                "comparison_points": comparison_points,
                "comparison": comparison_metadata,
                "unit": state.attributes.get("unit_of_measurement", "")
                if state
                else "",
            }
        )
    result = await _compute(hass, _calculate_rows, rows)
    return {
        "start_time": args["start_time"],
        "end_time": args["end_time"],
        "timestamp_unit": "milliseconds_since_epoch",
        "rate_unit": "entity_unit_per_hour",
        "series": [_paginate_analysis(row, args) for row in result["series"]],
        "correlated_anomaly_spans": _page(result["correlated_anomaly_spans"], args),
        "note": "Numeric history merges recorder states and hourly long-term means as in the chart. Summary mean is sample-weighted. Correlation means temporal overlap, not causation.",
    }


def _calculate_aggregate(data, cancel=None):
    return calculate_aggregate(data)


async def _aggregate(hass, args, context):
    bounds = _range(args)
    zoom = _range(args["zoom"]) if "zoom" in args else None
    zone = args.get("time_zone", hass.config.time_zone)
    ZoneInfo(zone)
    definition = {
        "operation": args["operation"],
        "interval": args["interval"],
        "mode": args["mode"],
        "states": args["states"],
        "eventTypes": args["event_types"],
        "resetOnZoom": args["reset_on_zoom"],
    }
    data = await async_fetch_analysis_data(
        hass,
        args["entity_id"],
        args["start_time"],
        args["end_time"],
        statistics=args["operation"] == "consumption",
    )
    state = hass.states.get(args["entity_id"])
    attributes = state.attributes if state else {}
    result = await _compute(
        hass,
        _calculate_aggregate,
        aggregate_input(data, definition, bounds, zone, attributes, zoom),
    )
    return {
        **result,
        "points": _page(result["points"], args),
        "entity_id": args["entity_id"],
        "definition": definition,
        "time_zone": zone,
        "timestamp_unit": "milliseconds_since_epoch",
    }


class DatapointsTool(llm.Tool):
    """Small checked adapter around backend operations; never a WebSocket shim."""

    integration = DOMAIN

    def __init__(self, name, description, parameters, handler, *, read_only=True):
        self.name = f"{DOMAIN}__{name}"
        self.description = description
        self.parameters = parameters
        self._handler = handler
        self.annotations = llm.ToolAnnotations(
            read_only=read_only,
            destructive=False,
            idempotent=read_only,
            open_world=False,
        )

    async def async_call(
        self,
        hass: HomeAssistant,
        tool_input: llm.ToolInput,
        llm_context: llm.LLMContext,
    ) -> llm.ToolResult:
        user_id = llm_context.context.user_id if llm_context.context else None
        user = await hass.auth.async_get_user(user_id) if user_id else None
        if user is None or not user.is_admin:
            raise Unauthorized
        if KEY_STORE not in hass.data.get(DOMAIN, {}):
            raise HomeAssistantError("Data Points is not loaded")
        try:
            args = self.parameters(tool_input.tool_args)
            result = await self._handler(hass, args, llm_context)
        except (p.Invalid, ValueError, ZoneInfoNotFoundError) as err:
            raise HomeAssistantError(str(err)) from err
        except TimeoutError as err:
            raise HomeAssistantError(
                "Analysis timed out; use fewer series or a shorter range"
            ) from err
        return llm.ToolResult(data=result)


def create_tools() -> list[llm.Tool]:
    return [
        DatapointsTool(
            "list_events",
            "Browse recorded Data Points annotations with time/entity filters and pagination. Global events are included.",
            schemas.EVENTS,
            _events,
        ),
        DatapointsTool(
            "list_monitors",
            "List active anomaly monitors, settings and latest scan time; excludes deleted monitors and verbose scan history.",
            schemas.MONITORS,
            _monitors,
        ),
        DatapointsTool(
            "get_monitor_anomalies",
            "Read bounded saved monitor anomaly summaries and dismissals. This does not rescan; last_scan_at describes freshness.",
            schemas.FINDINGS,
            _findings,
        ),
        DatapointsTool(
            "analyze_chart",
            "Analyze up to five chart rows: history, all five trends, rate/hour, summary, threshold crossings, comparison windows/deltas, all anomaly methods and cross-entity anomaly overlap. Set anomalies.trend_method/window for an independent anomaly trend override. A comparison may use another entity or date range. At most 90 days and 5000 points per series; sample more coarsely if needed. Pagination applies independently to each output array; repeat with offset to retrieve remaining points/clusters.",
            schemas.ANALYZE,
            _analyze,
        ),
        DatapointsTool(
            "aggregate_entity",
            "Chart calendar aggregates: mean/min/max/median/first/last, consumption, state transitions/duration/percentage, and event counts. All calendar intervals, timezone/DST, cumulative mode and zoom reset are supported. State percentages use known time. Missing history, partial periods and meter resets are reported. Consumption prefers hourly HA statistics then raw readings.",
            schemas.AGGREGATE,
            _aggregate,
        ),
        DatapointsTool(
            "record",
            "Create a Data Points annotation when requested by the user. This writes a new record; repeating the call creates another record.",
            schemas.RECORD,
            _record,
            read_only=False,
        ),
    ]
