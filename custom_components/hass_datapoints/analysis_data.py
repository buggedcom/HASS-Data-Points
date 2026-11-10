"""Recorder input preparation for the chart's native AI analysis tools."""

from __future__ import annotations

import math
from datetime import datetime

from homeassistant.components.recorder import get_instance

from .const import ANOMALY_MAX_PTS
from .history_utils import (
    fetch_entity_states,
    fetch_entity_statistics,
    prepare_series,
    statistics_points,
)


def fetch_analysis_data(
    hass, entity_id: str, start: str, end: str, statistics: bool
) -> dict:
    """Fetch bounded full states and hourly statistics in the recorder executor.

    Failures propagate so an unavailable recorder is not mistaken for no data.
    The cap is checked before any sampling: aggregation must not silently lose
    transitions, consumption or events.
    """
    states = fetch_entity_states(
        hass,
        entity_id,
        start,
        end,
        include_start=True,
        attributes=entity_id.startswith("event."),
    )
    if len(states) > ANOMALY_MAX_PTS:
        raise ValueError("Too many history states; request a shorter time range")
    samples = []
    start_ms = datetime.fromisoformat(start).timestamp() * 1000
    for state in states:
        time = state.last_updated.timestamp() * 1000
        sample = {"time": time, "state": state.state}
        try:
            value = float(state.state)
            if math.isfinite(value):
                sample["value"] = value
        except (ValueError, TypeError):
            pass
        if entity_id.startswith("event.") and state.state not in (
            "unknown",
            "unavailable",
        ):
            event_type = state.attributes.get("event_type")
            if isinstance(event_type, str) and event_type:
                try:
                    event_time = datetime.fromisoformat(state.state).timestamp() * 1000
                except ValueError:
                    event_time = time
                sample.update(
                    eventType=event_type,
                    eventTime=event_time,
                    boundary=time <= start_ms,
                )
        samples.append(sample)
    entries = (
        fetch_entity_statistics(hass, entity_id, start, end, {"mean", "change"})
        if statistics
        else []
    )
    return {
        "samples": sorted(samples, key=lambda s: s["time"]),
        "statistics": sorted(statistics_points(entries, "mean")),
        "changes": sorted(statistics_points(entries, "change")),
    }


async def async_fetch_analysis_data(
    hass, entity_id: str, start: str, end: str, statistics: bool = True
) -> dict:
    return await get_instance(hass).async_add_executor_job(
        fetch_analysis_data, hass, entity_id, start, end, statistics
    )


def numeric_points(data: dict, interval: str, aggregate: str) -> list:
    raw = [[s["time"], s["value"]] for s in data["samples"] if "value" in s]
    return prepare_series(
        raw,
        data["statistics"],
        sample_interval=interval,
        sample_aggregate=aggregate,
        max_pts=ANOMALY_MAX_PTS,
    )


def aggregate_input(
    data: dict,
    definition: dict,
    bounds: dict,
    zone: str,
    attributes: dict,
    zoom: dict | None = None,
) -> dict:
    """Mirror chart-aggregates input adapters, including statistics/raw stitching."""
    samples = data["samples"]
    op = definition["operation"]
    coverage = [bounds] if samples or data.get("changes") else []
    if op in ("transition_count", "state_duration", "state_percentage"):
        coverage = []
        for i, sample in enumerate(samples):
            end = samples[i + 1]["time"] if i + 1 < len(samples) else bounds["end"]
            start, end = max(sample["time"], bounds["start"]), min(end, bounds["end"])
            if sample["state"] not in ("unknown", "unavailable") and end > start:
                coverage.append({"start": start, "end": end})
    elif op == "consumption" and data["changes"]:
        cutoff = data["changes"][-1][0] + 3600000
        readings = [s for s in samples if "value" in s]
        before = [s for s in readings if s["time"] < cutoff]
        samples = [
            *[{"time": time, "change": value} for time, value in data["changes"]],
            *before[-1:],
            *[s for s in readings if s["time"] >= cutoff],
        ]
    return {
        "definition": definition,
        "samples": samples,
        "range": bounds,
        "zoom": zoom,
        "timeZone": zone,
        "stateClass": attributes.get("state_class"),
        "unit": attributes.get("unit_of_measurement", ""),
        "coverage": coverage,
    }
