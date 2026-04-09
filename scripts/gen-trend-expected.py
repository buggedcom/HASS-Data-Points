#!/usr/bin/env python3
"""Generate golden expected results for trend cross-language tests.

Writes fixtures/trend-expected.json, which is the static baseline both the
TypeScript and Python implementations are tested against in the golden master
test block of trend-cross-language.spec.ts.

Run from repo root:
    python3 scripts/gen-trend-expected.py
"""

import json
import os
import sys

sys.path.insert(
    0,
    os.path.join(
        os.path.dirname(__file__), "..", "custom_components", "hass_datapoints"
    ),
)
from anomaly_detection import _build_rate_pts, _build_trend_pts  # noqa: E402

FIXTURES = os.path.join(
    os.path.dirname(__file__),
    "..",
    "custom_components",
    "hass_datapoints",
    "src",
    "lib",
    "workers",
    "__tests__",
    "fixtures",
)

with open(os.path.join(FIXTURES, "trend-dataset.json")) as f:
    pts = json.load(f)

results = {}

results["linear_trend"] = _build_trend_pts(pts, "linear_trend", "24h")
for w in ["1h", "6h", "24h"]:
    results[f"rolling_average/{w}"] = _build_trend_pts(pts, "rolling_average", w)
    results[f"ema/{w}"] = _build_trend_pts(pts, "ema", w)
results["polynomial_trend"] = _build_trend_pts(pts, "polynomial_trend", "24h")
for w in ["1h", "24h"]:
    results[f"lowess/{w}"] = _build_trend_pts(pts, "lowess", w)
for w in ["1h", "6h"]:
    results[f"rate_of_change/{w}"] = _build_rate_pts(pts, w)

out = os.path.join(FIXTURES, "trend-expected.json")
with open(out, "w") as f:
    json.dump(results, f, separators=(",", ":"))

print(f"Written {out}")
for key, val in results.items():
    print(f"  {key}: {len(val)} points")
