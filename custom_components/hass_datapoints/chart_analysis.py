"""Chart calculations shared by native AI tools (no Home Assistant I/O).

Trend/rate/anomaly algorithms reuse the backend implementations already checked
against the chart. Delta, threshold and correlation mirror the chart helpers.
"""

from __future__ import annotations

from statistics import median

from .anomaly_detection import (
    _build_rate_pts,
    _build_trend_pts,
    _interpolate,
    run_anomaly_detection,
)


def threshold_spans(points: list, value: float, direction: str) -> list[dict]:
    """Return the chart's inclusive, linearly interpolated shaded intervals."""
    spans = []
    for (t0, v0), (t1, v1) in zip(points, points[1:], strict=False):
        inside0 = v0 <= value if direction == "below" else v0 >= value
        inside1 = v1 <= value if direction == "below" else v1 >= value
        if not inside0 and not inside1:
            continue
        start, end = t0, t1
        if inside0 != inside1:
            crossing = t0 + (t1 - t0) * (value - v0) / (v1 - v0)
            if inside0:
                end = crossing
            else:
                start = crossing
        if spans and spans[-1]["end"] == start:
            spans[-1]["end"] = end
        else:
            spans.append({"start": start, "end": end})
    return spans


def analyze_series(points: list, options: dict, comparison: list, cancel=None) -> dict:
    """Calculate a numeric chart row, with an already aligned comparison series."""
    values = [point[1] for point in points]
    result = {
        "points": points,
        "summary": {
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / len(values),
        }
        if values
        else None,
        "trends": {
            method: _build_trend_pts(points, method, options["trend_window"])
            for method in options["trend_methods"]
        },
    }
    if options.get("rate_window"):
        result["rate_of_change"] = _build_rate_pts(points, options["rate_window"])
    if comparison:
        result["comparison_points"] = comparison
        result["delta"] = [
            [time, value - baseline]
            for time, value in points
            if len(points) >= 2
            and len(comparison) >= 2
            and (baseline := _interpolate(comparison, time)) is not None
        ]
    if "threshold_value" in options:
        result["threshold_spans"] = threshold_spans(
            points, options["threshold_value"], options["threshold_direction"]
        )
    anomaly_points = options.get("anomaly_points", points)
    config = options.get("anomalies")
    if config:
        # Comparison timestamps have already been aligned with the main window.
        config = {**config, "comparison_time_offset_ms": 0}
        result["anomaly_clusters"] = run_anomaly_detection(
            anomaly_points,
            config,
            options.get("anomaly_comparison_points", comparison) or None,
            cancel,
        )
    return result


def correlated_spans(series: list[dict]) -> list[dict]:
    """Mirror chart-comparison's overlap across at least two distinct entities."""
    events = []
    for item in series:
        points = item["points"]
        intervals = [
            b[0] - a[0] for a, b in zip(points, points[1:], strict=False) if b[0] > a[0]
        ]
        tolerance = max(median(intervals), 1000) if intervals else 60000
        for cluster in item.get("anomaly_clusters", []):
            times = [p["timeMs"] for p in cluster.get("points", [])]
            if times:
                events.extend(
                    [
                        (min(times[0], times[-1]) - tolerance, 1, item["entity_id"]),
                        (max(times[0], times[-1]) + tolerance, -1, item["entity_id"]),
                    ]
                )
    active = {}
    start = None
    spans = []
    for time, delta, entity_id in sorted(events):
        active[entity_id] = active.get(entity_id, 0) + delta
        if active[entity_id] <= 0:
            del active[entity_id]
        if start is None and len(active) >= 2:
            start = time
        elif start is not None and len(active) < 2:
            spans.append({"start": start, "end": time})
            start = None
    return spans
