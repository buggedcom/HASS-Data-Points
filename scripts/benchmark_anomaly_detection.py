#!/usr/bin/env python3
"""Benchmark the Household Climate Monitor detection workload.

Builds a deterministic stand-in for the observed combined monitor (two
entities, seven days of irregular raw readings, ~53,104 points in total;
polynomial trend_residual plus one-hour rate_of_change) and reports:

  * full detection-stage time: both entities plus the overlap calculation,
  * cancellation latency: time from cancelling the token mid-detection until
    the detector loop raises.

Recorder/history preparation is not included; on the device that stage is
measured separately from the integration's debug job timings.

Run on the target hardware (e.g. the HA host) with plain Python 3.12+:

    python3 scripts/benchmark_anomaly_detection.py [--repeat 3]

Acceptance targets: detection < 5 s, cancellation < 0.5 s.
"""

from __future__ import annotations

import argparse
import math
import os
import random
import statistics
import sys
import threading
import time

sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(__file__), "..", "custom_components", "hass_datapoints"
    ),
)
from anomaly_detection import run_anomaly_detection  # noqa: E402
from detection_runner import CancellationToken, DetectionCancelled  # noqa: E402

TOTAL_POINTS = 53_104
SEVEN_DAYS_MS = 7 * 24 * 3_600_000
CONFIG = {
    "anomaly_methods": ["trend_residual", "rate_of_change"],
    "anomaly_sensitivity": "medium",
    "anomaly_overlap_mode": "all",
    "trend_method": "polynomial_trend",
    "trend_window": "24h",
    "anomaly_rate_window": "1h",
}


def _series(seed: int, count: int, base: float, amplitude: float) -> list:
    """Irregular, duplicate-free timestamps with a daily cycle, noise and steps."""
    rng = random.Random(seed)
    start = 1_762_000_000_000
    times = sorted(rng.sample(range(start, start + SEVEN_DAYS_MS), count))
    pts = []
    for index, t in enumerate(times):
        phase = (t - start) / 86_400_000 * 6.283185307179586
        value = base + amplitude * math.sin(phase)
        value += rng.gauss(0, amplitude * 0.05)
        if index % 4_000 < 25:
            value += amplitude * 1.5  # occasional excursions
        pts.append([t, round(value, 2)])
    return pts


def _combined(all_pts: dict, cancel=None) -> tuple[dict, int]:
    entity_clusters = {
        entity_id: run_anomaly_detection(pts, CONFIG, cancel=cancel)
        for entity_id, pts in all_pts.items()
    }
    # Overlap of cluster windows (same rule as the integration's combined
    # monitors) is linear in the number of clusters; include a direct
    # equivalent so the timing covers the full detection stage.
    windows = [
        sorted(
            (
                min(p["timeMs"] for p in c["points"]),
                max(p["timeMs"] for p in c["points"]),
            )
            for c in clusters
            if c.get("points")
        )
        for clusters in entity_clusters.values()
    ]
    overlaps = sum(
        1
        for start, end in windows[0]
        if any(s <= (start + end) // 2 <= e for s, e in windows[1])
    )
    return entity_clusters, overlaps


def _measure_detection(all_pts: dict) -> tuple[float, dict]:
    began = time.perf_counter()
    entity_clusters, _ = _combined(all_pts)
    return time.perf_counter() - began, entity_clusters


def _measure_cancellation(all_pts: dict, after: float) -> float | None:
    token = CancellationToken(time.monotonic() + 3600)
    raised_at: list[float] = []

    def run() -> None:
        try:
            _combined(all_pts, token)
        except DetectionCancelled:
            raised_at.append(time.perf_counter())

    worker = threading.Thread(target=run)
    worker.start()
    time.sleep(after)
    cancelled_at = time.perf_counter()
    token.cancel()
    worker.join()
    if not raised_at:
        return None  # finished before the cancel landed
    return raised_at[0] - cancelled_at


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repeat", type=int, default=3)
    args = parser.parse_args()

    half = TOTAL_POINTS // 2
    all_pts = {
        "sensor.household_temperature": _series(1, half, 21.0, 1.5),
        "sensor.household_humidity": _series(2, TOTAL_POINTS - half, 45.0, 6.0),
    }
    print(
        f"points: {sum(len(p) for p in all_pts.values())} across {len(all_pts)} entities"
    )

    timings = []
    clusters: dict = {}
    for _ in range(args.repeat):
        elapsed, clusters = _measure_detection(all_pts)
        timings.append(elapsed)
    counts = {k: len(v) for k, v in clusters.items()}
    print(
        f"detection: median {statistics.median(timings):.2f}s "
        f"(runs {', '.join(f'{t:.2f}s' for t in timings)}) clusters={counts}"
    )

    median = statistics.median(timings)
    latencies = [
        latency
        for fraction in (0.2, 0.5, 0.8)
        if (latency := _measure_cancellation(all_pts, median * fraction)) is not None
    ]
    if latencies:
        print(
            "cancellation: max "
            f"{max(latencies) * 1000:.0f}ms "
            f"(samples {', '.join(f'{x * 1000:.0f}ms' for x in latencies)})"
        )
    ok = median < 5.0 and (not latencies or max(latencies) < 0.5)
    print("targets: detection < 5s, cancellation < 500ms ->", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
