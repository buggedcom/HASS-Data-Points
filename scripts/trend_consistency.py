#!/usr/bin/env python3
"""CLI wrapper for trend cross-language consistency tests.

Reads JSON from stdin:  {"pts": [[timeMs, value], ...], "method": str, "window": str}
Writes JSON to stdout:  {"pts": [[timeMs, value], ...]}

Used by the Vitest cross-language spec to verify that the TypeScript and Python
implementations produce numerically identical results for all duplicated algorithms.

Supported methods:
  Trend:  linear_trend | rolling_average | ema | polynomial_trend | lowess
  Other:  rate_of_change
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

data = json.loads(sys.stdin.read())
pts = data["pts"]
method = data["method"]
window = data.get("window", "24h")

if method == "rate_of_change":
    result = _build_rate_pts(pts, window)
else:
    result = _build_trend_pts(pts, method, window)

json.dump({"pts": result}, sys.stdout)
