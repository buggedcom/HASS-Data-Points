"""Calendar aggregations matching src/lib/domain/aggregation/calculate.ts."""

from __future__ import annotations

import math
from bisect import bisect_right
from datetime import datetime, timedelta
from statistics import median
from zoneinfo import ZoneInfo

OPERATIONS = (
    "mean",
    "min",
    "max",
    "median",
    "first",
    "last",
    "consumption",
    "transition_count",
    "state_duration",
    "state_percentage",
    "event_count",
)
INTERVALS = ("minute", "15min", "30min", "hour", "day", "week", "month")
CUMULATIVE = {"consumption", "transition_count", "state_duration", "event_count"}
FIXED_MS = {"minute": 60000, "15min": 900000, "30min": 1800000, "hour": 3600000}


def periods(start: float, end: float, interval: str, time_zone: str) -> list[dict]:
    """Local calendar boundaries, preserving repeated hours and DST day lengths."""
    zone = ZoneInfo(time_zone)
    local = datetime.fromtimestamp(start / 1000, zone)
    fixed = FIXED_MS.get(interval)
    if fixed:
        cursor = (
            start
            - start % 1000
            - local.second * 1000
            - (local.minute % (fixed // 60000)) * 60000
        )
    else:
        local = local.replace(hour=0, minute=0, second=0, microsecond=0)
        if interval == "week":
            local -= timedelta(days=local.weekday())
        elif interval == "month":
            local = local.replace(day=1)
        cursor = local.timestamp() * 1000
    result = []
    while cursor < end:
        if len(result) >= 10000:
            raise ValueError(
                "Too many calendar periods; choose a larger interval or shorter range"
            )
        if fixed:
            following = cursor + fixed
        else:
            local = datetime.fromtimestamp((cursor + 7200000) / 1000, zone).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            if interval == "month":
                local = local.replace(
                    year=local.year + (local.month == 12),
                    month=local.month % 12 + 1,
                    day=1,
                )
            else:
                local += timedelta(days=7 if interval == "week" else 1)
            following = local.timestamp() * 1000
        clipped_start, clipped_end = max(start, cursor), min(end, following)
        result.append(
            {
                "periodStart": cursor,
                "periodEnd": following,
                "start": clipped_start,
                "end": clipped_end,
                "partial": clipped_start != cursor or clipped_end != following,
            }
        )
        cursor = following
    return result


def _number(value) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def _known(state) -> bool:
    return isinstance(state, str) and state not in ("unknown", "unavailable")


def _overlap(a: dict, b: dict) -> float:
    return max(0, min(a["end"], b["end"]) - max(a["start"], b["start"]))


def calculate_aggregate(data: dict) -> dict:
    """Apply the chart's measurement, state, event and consumption semantics."""
    definition = data["definition"]
    op = definition["operation"]
    cumulative = definition["mode"] == "cumulative" and op in CUMULATIVE
    bounds = data["range"]
    if cumulative and definition.get("resetOnZoom") and data.get("zoom"):
        start, end = (
            max(bounds["start"], data["zoom"]["start"]),
            min(bounds["end"], data["zoom"]["end"]),
        )
        if end > start:
            return calculate_aggregate(
                {**data, "zoom": None, "range": {"start": start, "end": end}}
            )
    calendar = periods(
        bounds["start"], bounds["end"], definition["interval"], data["timeZone"]
    )
    samples = sorted(data["samples"], key=lambda s: s["time"])
    ends = [p["end"] for p in calendar]
    groups = [[] for _ in calendar]

    def add(time, value, reason=None):
        index = bisect_right(ends, time)
        if index < len(calendar) and time >= calendar[index]["start"]:
            groups[index].append((value, reason))

    selected = definition.get("states", [])
    stateful = [s for s in samples if isinstance(s.get("state"), str)]
    coverage = sorted(data.get("coverage", [bounds]), key=lambda c: c["start"])
    coverage_ends = [span["end"] for span in coverage]
    spans = []
    duration_operation = op in ("state_duration", "state_percentage")
    for i, sample in enumerate(stateful if duration_operation else []):
        start = max(sample["time"], bounds["start"])
        end = min(
            stateful[i + 1]["time"] if i + 1 < len(stateful) else bounds["end"],
            bounds["end"],
        )
        if _known(sample["state"]) and end > start:
            span = {"start": start, "end": end, "state": sample["state"]}
            for index in range(bisect_right(coverage_ends, start), len(coverage)):
                covered = coverage[index]
                if covered["start"] >= end:
                    break
                if _overlap(span, covered) > 0:
                    spans.append(
                        {
                            **span,
                            "start": max(start, covered["start"]),
                            "end": min(end, covered["end"]),
                        }
                    )
    if op == "transition_count":
        for previous, current in zip(stateful, stateful[1:], strict=False):
            if (
                current["time"] > bounds["start"]
                and _known(previous["state"])
                and _known(current["state"])
                and previous["state"] != current["state"]
                and (not selected or current["state"] in selected)
            ):
                add(current["time"], 1)
    elif op == "event_count":
        types = definition.get("eventTypes", [])
        for sample in samples:
            if (
                not sample.get("boundary")
                and isinstance(sample.get("eventType"), str)
                and (not types or sample["eventType"] in types)
            ):
                add(sample.get("eventTime", sample["time"]), 1)
    elif op == "consumption":
        for sample in samples:
            if _number(sample.get("change")):
                add(sample["time"], sample["change"])
        readings = [
            s
            for s in samples
            if "change" not in s and _number(s.get("sum", s.get("value")))
        ]
        for previous, current in zip(readings, readings[1:], strict=False):
            if current["time"] <= bounds["start"]:
                continue
            uses_sum = _number(current.get("sum")) and _number(previous.get("sum"))
            key = "sum" if uses_sum else "value"
            delta = current[key] - previous[key]
            reason = None
            if not uses_sum and delta < 0:
                if data.get("stateClass") == "total_increasing" or (
                    "lastReset" in current
                    and current["lastReset"] != previous.get("lastReset")
                ):
                    delta, reason = current[key], "reset"
                elif data.get("stateClass") != "total":
                    delta, reason = 0, "ambiguous-reset"
            add(current["time"], delta, reason)
    elif op not in ("state_duration", "state_percentage"):
        for sample in samples:
            if not sample.get("boundary") and _number(sample.get("value")):
                add(sample["time"], sample["value"])

    buckets = []
    span_cursor = 0
    for index, period in enumerate(calendar):
        values = [v for v, _ in groups[index]]
        reasons = list(dict.fromkeys(reason for _, reason in groups[index] if reason))
        if op in ("state_duration", "state_percentage"):
            while (
                span_cursor < len(spans)
                and spans[span_cursor]["end"] <= period["start"]
            ):
                span_cursor += 1
            known = matching = 0
            for span_index in range(span_cursor, len(spans)):
                span = spans[span_index]
                if span["start"] >= period["end"]:
                    break
                duration = _overlap(period, span)
                known += duration
                if span["state"] in selected:
                    matching += duration
            value = (
                matching / known * 100
                if known and op == "state_percentage"
                else matching / 60000
            )
            if not known or not selected:
                value = None
                reasons = ["no-state-selected" if not selected else "no-known-time"]
        elif op in ("transition_count", "event_count"):
            value = sum(values)
        elif not values:
            value, reasons = None, ["no-data"]
        elif op == "consumption":
            value = sum(values)
        elif op == "min":
            value = min(values)
        elif op == "max":
            value = max(values)
        elif op == "median":
            value = median(values)
        elif op == "first":
            value = values[0]
        elif op == "last":
            value = values[-1]
        else:
            value = sum(values) / len(values)
        buckets.append((period, value, reasons))

    running = 0
    started = not cumulative
    points = []
    coverage_cursor = 0
    for period, value, reasons in buckets:
        if cumulative:
            if not started:
                started = value is not None and (op == "consumption" or value > 0)
                if not started:
                    continue
            running += value or 0
            value = running
        while (
            coverage_cursor < len(coverage)
            and coverage[coverage_cursor]["end"] <= period["start"]
        ):
            coverage_cursor += 1
        known = 0
        for span_index in range(coverage_cursor, len(coverage)):
            span = coverage[span_index]
            if span["start"] >= period["end"]:
                break
            known += _overlap(period, span)
        total = period["end"] - period["start"]
        if known < total:
            reasons = [*reasons, "incomplete-coverage"]
        points.append(
            {
                **period,
                "time": period["start"],
                "value": value if known else None,
                "incomplete": known < total or "no-data" in reasons,
                "knownDuration": known,
                "totalDuration": total,
                "reasons": reasons,
            }
        )
    unit = {
        "transition_count": "",
        "event_count": "",
        "state_duration": "min",
        "state_percentage": "%",
    }.get(op, data.get("unit", ""))
    return {
        "points": points,
        "unit": unit,
        "presentation": "line" if cumulative or op in OPERATIONS[:6] else "bar",
        "baseline": 0 if cumulative and started and points else None,
    }
