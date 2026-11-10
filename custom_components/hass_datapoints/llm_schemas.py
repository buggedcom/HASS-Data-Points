"""Discoverable, validated inputs for HA 2026.11+ native tools."""

import probatio as p

from .aggregation import INTERVALS, OPERATIONS
from .anomaly_detection import VALID_ANOMALY_METHODS
from .const import ANOMALY_DIRECTION_FIELDS
from .websocket_api import (
    _VALID_AGGREGATES,
    _VALID_INTERVALS,
    _VALID_RATE_WINDOWS,
    _VALID_TREND_METHODS,
)

ENTITY = p.All(str, p.Match(r"^[a-z0-9_]+\.[a-z0-9_]+$"))
WINDOWS = ["30m", "1h", "2h", "3h", "6h", "24h", "7d", "14d", "21d", "28d"]
PAGE = {
    p.Optional("limit", default=200): p.All(int, p.Range(min=1, max=1000)),
    p.Optional("offset", default=0): p.All(int, p.Range(min=0)),
}
RANGE = {p.Required("start_time"): str, p.Required("end_time"): str}
ANOMALIES = {
    p.Required("anomaly_methods"): p.All(
        [p.In(sorted(VALID_ANOMALY_METHODS) + ["similar_entity"])],
        p.Length(min=1, max=7),
    ),
    p.Optional("anomaly_sensitivity", default="medium"): p.In(
        ["low", "medium", "high"]
    ),
    p.Optional("anomaly_overlap_mode", default="all"): p.In(
        ["all", "highlight", "only"]
    ),
    p.Optional("anomaly_rate_window", default="1h"): p.In(_VALID_RATE_WINDOWS),
    p.Optional("anomaly_zscore_window", default="24h"): p.In(WINDOWS),
    p.Optional("anomaly_persistence_window", default="1h"): p.In(
        ["30m", "1h", "3h", "6h", "12h", "24h"]
    ),
    p.Optional("trend_method"): p.In(_VALID_TREND_METHODS),
    p.Optional("trend_window"): p.In(WINDOWS),
    p.Optional("use_sampled_data", default=True): bool,
    **{
        p.Optional(field, default="both"): p.In(["up", "down", "both"])
        for field in (*ANOMALY_DIRECTION_FIELDS, "anomaly_similar_entity_direction")
    },
}
SERIES = {
    p.Required("entity_id"): ENTITY,
    p.Optional("sample_interval", default="raw"): p.In(_VALID_INTERVALS),
    p.Optional("sample_aggregate", default="mean"): p.In(_VALID_AGGREGATES),
    p.Optional("trend_methods", default=[]): p.All(
        [p.In(_VALID_TREND_METHODS)], p.Length(max=5)
    ),
    p.Optional("trend_window", default="24h"): p.In(WINDOWS),
    p.Optional("rate_window"): p.In(_VALID_RATE_WINDOWS),
    p.Optional("threshold_value"): p.Any(int, float),
    p.Optional("threshold_direction", default="above"): p.In(["above", "below"]),
    p.Optional("comparison"): {
        p.Required("entity_id"): ENTITY,
        **RANGE,
        p.Optional(
            "time_offset_ms",
            description="Comparison timestamps minus main timestamps; subtracted to align. Defaults to start-time difference.",
        ): p.Any(int, float),
    },
    p.Optional("anomalies"): ANOMALIES,
}
ANALYZE = p.Schema(
    {
        p.Optional("cluster_point_offset", default=0): p.All(int, p.Range(min=0)),
        **RANGE,
        p.Required("series"): p.All([SERIES], p.Length(min=1, max=5)),
        **PAGE,
    }
)
AGGREGATE = p.Schema(
    {
        **RANGE,
        p.Required("entity_id"): ENTITY,
        p.Required("operation"): p.In(OPERATIONS),
        p.Required("interval"): p.In(INTERVALS),
        p.Optional("mode", default="interval"): p.In(["interval", "cumulative"]),
        p.Optional("states", default=[]): p.All([str], p.Length(max=50)),
        p.Optional("event_types", default=[]): p.All([str], p.Length(max=50)),
        p.Optional("time_zone"): str,
        p.Optional("zoom"): RANGE,
        p.Optional("reset_on_zoom", default=False): bool,
        **PAGE,
    }
)
EVENTS = p.Schema(
    {
        p.Optional("start_time"): str,
        p.Optional("end_time"): str,
        p.Optional("entity_ids"): p.All([ENTITY], p.Length(max=50)),
        **PAGE,
    }
)
MONITORS = p.Schema(PAGE)
FINDINGS = p.Schema({p.Required("monitor_id"): str, **PAGE})
RECORD = p.Schema(
    {
        p.Required("message"): p.All(str, p.Length(min=1, max=10000)),
        p.Optional("annotation"): p.All(str, p.Length(max=10000)),
        p.Optional("entity_ids"): p.All([ENTITY], p.Length(max=50)),
        p.Optional("icon"): p.All(str, p.Match(r"^mdi:[a-z0-9][a-z0-9\-]*$")),
        p.Optional("color"): p.All(str, p.Match(r"^#[0-9a-fA-F]{6}$")),
    }
)
