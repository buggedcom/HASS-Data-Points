"""Backend anomaly detection for hass_datapoints.

Pure Python (stdlib only: math, statistics) — no pip dependencies.
All six algorithms are ported faithfully from:
  src/lib/workers/history-analysis.worker.js
"""
from __future__ import annotations

import math
import statistics

# ---------------------------------------------------------------------------
# Sensitivity helpers
# ---------------------------------------------------------------------------

def _zscore_threshold(sensitivity: str) -> float:
    """Threshold multiplier for z-score / trend-residual / rate-of-change / comparison."""
    if sensitivity == "low":
        return 2.8
    if sensitivity == "high":
        return 1.6
    return 2.2  # medium


def _iqr_k(sensitivity: str) -> float:
    if sensitivity == "low":
        return 3.0
    if sensitivity == "high":
        return 1.5
    return 2.0  # medium


def _persistence_flat_fraction(sensitivity: str) -> float:
    if sensitivity == "low":
        return 0.005
    if sensitivity == "high":
        return 0.05
    return 0.02  # medium


# ---------------------------------------------------------------------------
# Window / time helpers
# ---------------------------------------------------------------------------

_TREND_WINDOWS_MS: dict[str, int] = {
    "1h": 3_600_000,
    "6h": 21_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
    "14d": 1_209_600_000,
    "21d": 1_814_400_000,
    "28d": 2_419_200_000,
}

_PERSISTENCE_WINDOWS_MS: dict[str, int] = {
    "30m": 1_800_000,
    "1h": 3_600_000,
    "3h": 10_800_000,
    "6h": 21_600_000,
    "12h": 43_200_000,
    "24h": 86_400_000,
}


def _trend_window_ms(value: str) -> int:
    return _TREND_WINDOWS_MS.get(value, _TREND_WINDOWS_MS["24h"])


def _persistence_window_ms(value: str) -> int:
    return _PERSISTENCE_WINDOWS_MS.get(value, _PERSISTENCE_WINDOWS_MS["1h"])


# ---------------------------------------------------------------------------
# Interpolation
# ---------------------------------------------------------------------------

def _interpolate(pts: list, time_ms: int) -> float | None:
    """Linear interpolation into a sorted pts list [[timeMs, value], ...]."""
    if not pts:
        return None
    if time_ms < pts[0][0] or time_ms > pts[-1][0]:
        return None
    if time_ms == pts[0][0]:
        return pts[0][1]
    if time_ms == pts[-1][0]:
        return pts[-1][1]
    for i in range(len(pts) - 1):
        t0, v0 = pts[i]
        t1, v1 = pts[i + 1]
        if t0 <= time_ms <= t1:
            frac = (time_ms - t0) / (t1 - t0)
            return v0 + (v1 - v0) * frac
    return None


# ---------------------------------------------------------------------------
# Trend helpers (for trend_residual)
# ---------------------------------------------------------------------------

def _build_rolling_average(pts: list, window_ms: int) -> list:
    if len(pts) < 2 or window_ms <= 0:
        return []
    result = []
    ws = 0
    w_sum = 0.0
    for i, (t, v) in enumerate(pts):
        w_sum += v
        while ws < i and (t - pts[ws][0]) > window_ms:
            w_sum -= pts[ws][1]
            ws += 1
        count = i - ws + 1
        result.append([t, w_sum / count])
    return result


def _build_linear_trend(pts: list) -> list:
    if len(pts) < 2:
        return []
    origin = pts[0][0]
    sum_x = sum_y = sum_xx = sum_xy = 0.0
    for t, v in pts:
        x = (t - origin) / 3_600_000.0
        sum_x += x
        sum_y += v
        sum_xx += x * x
        sum_xy += x * v
    n = len(pts)
    denom = n * sum_xx - sum_x * sum_x
    if not math.isfinite(denom) or abs(denom) < 1e-9:
        return []
    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    first_x = (pts[0][0] - origin) / 3_600_000.0
    last_x = (pts[-1][0] - origin) / 3_600_000.0
    return [
        [pts[0][0], intercept + slope * first_x],
        [pts[-1][0], intercept + slope * last_x],
    ]


def _build_trend_pts(pts: list, method: str, trend_window: str) -> list:
    if len(pts) < 2:
        return []
    if method == "linear_trend":
        return _build_linear_trend(pts)
    return _build_rolling_average(pts, _trend_window_ms(trend_window))


def _build_rate_pts(pts: list, rate_window: str) -> list:
    """Build rate-of-change points [[timeMs, rate_per_hour], ...]."""
    if len(pts) < 2:
        return []
    window_ms = _trend_window_ms(rate_window)
    rate_pts = []
    for i in range(1, len(pts)):
        t, v = pts[i]
        comp = pts[0]
        for j in range(i - 1, -1, -1):
            if (t - pts[j][0]) >= window_ms:
                comp = pts[j]
                break
        delta_ms = t - comp[0]
        if not (delta_ms > 0 and math.isfinite(delta_ms)):
            continue
        delta_h = delta_ms / 3_600_000.0
        rate = (v - comp[1]) / delta_h
        if math.isfinite(rate):
            rate_pts.append([t, rate])
    return rate_pts


# ---------------------------------------------------------------------------
# Algorithm 1: IQR
# ---------------------------------------------------------------------------

def detect_iqr(pts: list, sensitivity: str) -> list[dict]:
    """Detect anomalies via interquartile range fencing."""
    if len(pts) < 4:
        return []
    sorted_vals = sorted(p[1] for p in pts)
    n = len(sorted_vals)
    q1 = sorted_vals[int(n * 0.25)]
    q2 = sorted_vals[int(n * 0.5)]
    q3 = sorted_vals[int(n * 0.75)]
    iqr = q3 - q1
    if not math.isfinite(iqr) or iqr <= 1e-6:
        return []
    k = _iqr_k(sensitivity)
    lower = q1 - k * iqr
    upper = q3 + k * iqr

    clusters: list[dict] = []
    current: list[dict] = []

    def flush() -> None:
        if current:
            max_dev = max(abs(p["residual"]) for p in current)
            clusters.append({"points": current[:], "maxDeviation": max_dev, "anomalyMethod": "iqr"})
            current.clear()

    for t, v in pts:
        if v < lower or v > upper:
            current.append({"timeMs": t, "value": v, "baselineValue": q2, "residual": v - q2})
        else:
            flush()
    flush()
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Algorithm 2: Rolling z-score
# ---------------------------------------------------------------------------

def detect_rolling_zscore(pts: list, sensitivity: str, window_seconds: int) -> list[dict]:
    """Detect anomalies via rolling z-score within a sliding time window."""
    if len(pts) < 3:
        return []
    window_ms = window_seconds * 1000
    threshold = _zscore_threshold(sensitivity)
    residuals: list[dict] = []
    ws = 0
    w_sum = w_sumsq = 0.0

    for i, (t, v) in enumerate(pts):
        w_sum += v
        w_sumsq += v * v
        while ws < i and (t - pts[ws][0]) > window_ms:
            old = pts[ws][1]
            w_sum -= old
            w_sumsq -= old * old
            ws += 1
        count = i - ws + 1
        if count < 3:
            continue
        mean = w_sum / count
        variance = max(0.0, w_sumsq / count - mean * mean)
        std = math.sqrt(variance)
        if not math.isfinite(std) or std <= 1e-6:
            continue
        zscore = (v - mean) / std
        if abs(zscore) >= threshold:
            residuals.append({"timeMs": t, "value": v, "baselineValue": mean, "residual": v - mean, "flagged": True})
        else:
            residuals.append({"timeMs": t, "flagged": False})

    clusters: list[dict] = []
    current: list[dict] = []

    def flush() -> None:
        if current:
            max_dev = max(abs(p["residual"]) for p in current)
            clusters.append({"points": current[:], "maxDeviation": max_dev, "anomalyMethod": "rolling_zscore"})
            current.clear()

    for r in residuals:
        if r["flagged"]:
            current.append(r)
        else:
            flush()
    flush()
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Algorithm 3: Trend residual
# ---------------------------------------------------------------------------

def detect_trend_residual(pts: list, sensitivity: str, method: str, trend_window: str) -> list[dict]:
    """Detect anomalies as residuals against a trend line / rolling average."""
    if len(pts) < 3:
        return []
    baseline = _build_trend_pts(pts, method, trend_window)
    if len(baseline) < 2:
        return []
    res_pts: list[dict] = []
    for t, v in pts:
        bv = _interpolate(baseline, t)
        if bv is None or not math.isfinite(bv):
            continue
        res_pts.append({"timeMs": t, "value": v, "baselineValue": bv, "residual": v - bv})
    if len(res_pts) < 3:
        return []
    sum_sq = sum(p["residual"] ** 2 for p in res_pts)
    rms = math.sqrt(sum_sq / len(res_pts))
    if not math.isfinite(rms) or rms <= 1e-6:
        return []
    threshold = rms * _zscore_threshold(sensitivity)

    clusters: list[dict] = []
    current: list[dict] = []

    def flush() -> None:
        if current:
            max_dev = max(abs(p["residual"]) for p in current)
            clusters.append({"points": current[:], "maxDeviation": max_dev, "anomalyMethod": "trend_residual"})
            current.clear()

    for p in res_pts:
        if abs(p["residual"]) >= threshold:
            current.append(p)
        else:
            flush()
    flush()
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Algorithm 4: Persistence (stuck / flat segments)
# ---------------------------------------------------------------------------

def detect_persistence(pts: list, sensitivity: str, window_seconds: int) -> list[dict]:
    """Detect anomalies where the signal is stuck flat for longer than window_seconds."""
    if len(pts) < 3:
        return []
    min_dur_ms = window_seconds * 1000
    total_min = min(p[1] for p in pts)
    total_max = max(p[1] for p in pts)
    total_range = total_max - total_min
    if not math.isfinite(total_range) or total_range <= 1e-6:
        return []
    flat_thresh = _persistence_flat_fraction(sensitivity) * total_range

    clusters: list[dict] = []
    run_start = 0
    run_min = run_max = pts[0][1]

    def flush_run(run_end: int) -> None:
        nonlocal run_start, run_min, run_max
        duration = pts[run_end][0] - pts[run_start][0]
        if duration >= min_dur_ms and run_end > run_start:
            mid = (run_min + run_max) / 2
            cluster_pts = [
                {
                    "timeMs": pts[k][0],
                    "value": pts[k][1],
                    "baselineValue": mid,
                    "residual": pts[k][1] - mid,
                }
                for k in range(run_start, run_end + 1)
            ]
            clusters.append({
                "points": cluster_pts,
                "maxDeviation": run_max - run_min,
                "anomalyMethod": "persistence",
                "flatRange": run_max - run_min,
            })

    for i in range(1, len(pts)):
        v = pts[i][1]
        next_min = min(run_min, v)
        next_max = max(run_max, v)
        if next_max - next_min > flat_thresh:
            flush_run(i - 1)
            run_start = i
            run_min = run_max = v
        else:
            run_min = next_min
            run_max = next_max
    flush_run(len(pts) - 1)
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Algorithm 5: Rate of change
# ---------------------------------------------------------------------------

def detect_rate_of_change(pts: list, sensitivity: str, rate_window: str) -> list[dict]:
    """Detect anomalies via unusual rate-of-change."""
    if len(pts) < 3:
        return []
    rate_pts = _build_rate_pts(pts, rate_window)
    if len(rate_pts) < 3:
        return []

    mean_rate = statistics.mean(r[1] for r in rate_pts)
    sum_sq_dev = sum((r[1] - mean_rate) ** 2 for r in rate_pts)
    rms_dev = math.sqrt(sum_sq_dev / len(rate_pts))
    if not math.isfinite(rms_dev) or rms_dev <= 1e-6:
        return []
    threshold = rms_dev * _zscore_threshold(sensitivity)

    clusters: list[dict] = []
    current: list[dict] = []

    def flush() -> None:
        if current:
            max_dev = max(abs(p["residual"]) for p in current)
            clusters.append({"points": current[:], "maxDeviation": max_dev, "anomalyMethod": "rate_of_change"})
            current.clear()

    for t, rate in rate_pts:
        residual = rate - mean_rate
        if abs(residual) >= threshold:
            src_val = _interpolate(pts, t)
            if src_val is None or not math.isfinite(src_val):
                flush()
                continue
            current.append({"timeMs": t, "value": src_val, "baselineValue": mean_rate, "residual": residual})
        else:
            flush()
    flush()
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Algorithm 6: Comparison window
# ---------------------------------------------------------------------------

def detect_comparison_window(
    pts: list,
    comparison_pts: list,
    sensitivity: str,
    time_offset_ms: int = 0,
) -> list[dict]:
    """Detect anomalies by comparing to a shifted comparison series."""
    if len(pts) < 3 or len(comparison_pts) < 3:
        return []

    delta_pts: list[dict] = []
    for t, v in pts:
        comp_t = t - time_offset_ms
        comp_v = _interpolate(comparison_pts, comp_t)
        if comp_v is None or not math.isfinite(comp_v):
            continue
        delta_pts.append({"timeMs": t, "value": v, "compValue": comp_v, "delta": v - comp_v})

    if len(delta_pts) < 3:
        return []

    mean_delta = statistics.mean(p["delta"] for p in delta_pts)
    sum_sq_dev = sum((p["delta"] - mean_delta) ** 2 for p in delta_pts)
    rms_dev = math.sqrt(sum_sq_dev / len(delta_pts))
    if not math.isfinite(rms_dev) or rms_dev <= 1e-6:
        return []
    threshold = rms_dev * _zscore_threshold(sensitivity)

    clusters: list[dict] = []
    current: list[dict] = []

    def flush() -> None:
        if current:
            max_dev = max(abs(p["residual"]) for p in current)
            clusters.append({"points": current[:], "maxDeviation": max_dev, "anomalyMethod": "comparison_window"})
            current.clear()

    for p in delta_pts:
        residual = p["delta"] - mean_delta
        if abs(residual) >= threshold:
            current.append({
                "timeMs": p["timeMs"],
                "value": p["value"],
                "baselineValue": p["compValue"],
                "residual": p["value"] - p["compValue"],
            })
        else:
            flush()
    flush()
    return [c for c in clusters if c["points"]]


# ---------------------------------------------------------------------------
# Overlap mode
# ---------------------------------------------------------------------------

def apply_overlap_mode(clusters_by_method: dict[str, list[dict]], mode: str) -> list[dict]:
    """Apply overlap mode logic matching the JS worker's applyAnomalyOverlapMode."""
    method_keys = list(clusters_by_method.keys())
    if len(method_keys) <= 1 or mode == "all":
        return [c for clusters in clusters_by_method.values() for c in clusters]

    flagged_by_method: dict[str, set[int]] = {}
    for m in method_keys:
        flagged_by_method[m] = {p["timeMs"] for c in clusters_by_method[m] for p in c["points"]}

    overlap_times: set[int] = set()
    for m in method_keys:
        for t in flagged_by_method[m]:
            if any(other != m and t in flagged_by_method[other] for other in method_keys):
                overlap_times.add(t)

    if mode == "only":
        seen: set[str] = set()
        result: list[dict] = []
        for m in method_keys:
            for cluster in clusters_by_method[m]:
                pts = [p for p in cluster["points"] if p["timeMs"] in overlap_times]
                if not pts:
                    continue
                key = ",".join(str(p["timeMs"]) for p in pts)
                if key in seen:
                    continue
                seen.add(key)
                detected_by = [
                    other for other in method_keys
                    if any(p["timeMs"] in flagged_by_method[other] for p in pts)
                ]
                result.append({
                    **cluster,
                    "points": pts,
                    "maxDeviation": max((abs(p.get("residual", 0)) for p in pts), default=0),
                    "isOverlap": True,
                    "detectedByMethods": detected_by,
                })
        return result

    # "highlight" mode
    result = []
    for m in method_keys:
        for cluster in clusters_by_method[m]:
            has_overlap = any(p["timeMs"] in overlap_times for p in cluster["points"])
            detected_by = (
                [
                    other for other in method_keys
                    if any(p["timeMs"] in flagged_by_method[other] for p in cluster["points"])
                ]
                if has_overlap else [m]
            )
            result.append({**cluster, "isOverlap": has_overlap, "detectedByMethods": detected_by})
    return result


# ---------------------------------------------------------------------------
# Top-level entry point
# ---------------------------------------------------------------------------

def _parse_window_seconds(window_str: str, window_map: dict) -> int:
    """Convert a window string like '1h' to seconds."""
    ms = window_map.get(window_str, 0)
    return ms // 1000 if ms else 0


_TREND_WINDOWS_SECONDS: dict[str, int] = {k: v // 1000 for k, v in {
    "1h": 3_600_000,
    "6h": 21_600_000,
    "24h": 86_400_000,
    "7d": 604_800_000,
    "14d": 1_209_600_000,
    "21d": 1_814_400_000,
    "28d": 2_419_200_000,
}.items()}

_PERSISTENCE_WINDOWS_SECONDS: dict[str, int] = {k: v // 1000 for k, v in {
    "30m": 1_800_000,
    "1h": 3_600_000,
    "3h": 10_800_000,
    "6h": 21_600_000,
    "12h": 43_200_000,
    "24h": 86_400_000,
}.items()}

VALID_ANOMALY_METHODS = frozenset([
    "trend_residual",
    "rate_of_change",
    "iqr",
    "rolling_zscore",
    "persistence",
    "comparison_window",
])


def run_anomaly_detection(pts: list, config: dict, comparison_pts: list | None = None) -> list[dict]:
    """Run all requested anomaly detection methods and apply overlap mode.

    config keys (matching NormalizedAnalysis):
        anomaly_methods: list[str]
        anomaly_sensitivity: str ("low" | "medium" | "high")
        anomaly_overlap_mode: str ("all" | "highlight" | "only")
        anomaly_rate_window: str (e.g. "1h")
        anomaly_zscore_window: str (e.g. "24h")
        anomaly_persistence_window: str (e.g. "1h")
        (for comparison_window) comparison_time_offset_ms: int
        trend_method: str
        trend_window: str
    """
    if not pts or len(pts) < 3:
        return []

    methods: list[str] = [m for m in config.get("anomaly_methods", []) if m in VALID_ANOMALY_METHODS]
    if not methods:
        return []

    sensitivity: str = config.get("anomaly_sensitivity", "medium")
    overlap_mode: str = config.get("anomaly_overlap_mode", "all")
    rate_window: str = config.get("anomaly_rate_window", "1h")
    zscore_window: str = config.get("anomaly_zscore_window", "24h")
    persistence_window: str = config.get("anomaly_persistence_window", "1h")
    trend_method: str = config.get("trend_method", "rolling_average")
    trend_window: str = config.get("trend_window", "24h")
    time_offset_ms: int = int(config.get("comparison_time_offset_ms", 0))

    zscore_seconds = _TREND_WINDOWS_SECONDS.get(zscore_window, _TREND_WINDOWS_SECONDS["24h"])
    persistence_seconds = _PERSISTENCE_WINDOWS_SECONDS.get(persistence_window, _PERSISTENCE_WINDOWS_SECONDS["1h"])

    clusters_by_method: dict[str, list[dict]] = {}

    if "trend_residual" in methods:
        result = detect_trend_residual(pts, sensitivity, trend_method, trend_window)
        if result:
            clusters_by_method["trend_residual"] = result

    if "rate_of_change" in methods:
        result = detect_rate_of_change(pts, sensitivity, rate_window)
        if result:
            clusters_by_method["rate_of_change"] = result

    if "iqr" in methods:
        result = detect_iqr(pts, sensitivity)
        if result:
            clusters_by_method["iqr"] = result

    if "rolling_zscore" in methods:
        result = detect_rolling_zscore(pts, sensitivity, zscore_seconds)
        if result:
            clusters_by_method["rolling_zscore"] = result

    if "persistence" in methods:
        result = detect_persistence(pts, sensitivity, persistence_seconds)
        if result:
            clusters_by_method["persistence"] = result

    if "comparison_window" in methods and comparison_pts and len(comparison_pts) >= 3:
        result = detect_comparison_window(pts, comparison_pts, sensitivity, time_offset_ms)
        if result:
            clusters_by_method["comparison_window"] = result

    return apply_overlap_mode(clusters_by_method, overlap_mode)
