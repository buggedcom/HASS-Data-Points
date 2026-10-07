"""History utilities for hass_datapoints: recorder access and downsampling."""

from __future__ import annotations

import inspect
import logging
import math
import statistics
from datetime import UTC, datetime

from homeassistant.components.recorder import get_instance
from homeassistant.helpers.recorder import session_scope
from sqlalchemy import inspect as sqlalchemy_inspect
from sqlalchemy import text

from .const import ANOMALY_MAX_PTS

_LOGGER = logging.getLogger(__name__)

INTERVAL_SECONDS: dict[str, int] = {
    "1s": 1,
    "5s": 5,
    "10s": 10,
    "15s": 15,
    "30s": 30,
    "1m": 60,
    "2m": 120,
    "5m": 300,
    "10m": 600,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "3h": 10800,
    "4h": 14400,
    "6h": 21600,
    "12h": 43200,
    "24h": 86400,
}


def parse_interval_seconds(interval: str) -> int:
    """Return interval in seconds; 0 for unknown / 'raw'."""
    return INTERVAL_SECONDS.get(interval, 0)


def _parse_dt(iso: str) -> datetime:
    dt = datetime.fromisoformat(iso)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt


def fetch_entity_pts(
    hass, entity_id: str, start_time_iso: str, end_time_iso: str
) -> list:
    """Fetch raw [[timeMs, value], ...] from recorder.

    Must be called via hass.async_add_executor_job — this function is blocking.
    Returns an empty list on any error.
    """
    try:
        from homeassistant.components.recorder.history import (  # noqa: PLC0415
            get_significant_states,
        )
    except ImportError:
        _LOGGER.warning("hass_datapoints: get_significant_states not available")
        return []

    try:
        start_dt = _parse_dt(start_time_iso)
        end_dt = _parse_dt(end_time_iso)
    except ValueError:
        _LOGGER.warning(
            "hass_datapoints: invalid time range %s – %s", start_time_iso, end_time_iso
        )
        return []

    try:
        signature = inspect.signature(get_significant_states)
        positional_args = []
        keyword_args = {}

        for parameter in signature.parameters.values():
            if parameter.kind in (
                inspect.Parameter.VAR_POSITIONAL,
                inspect.Parameter.VAR_KEYWORD,
            ):
                continue

            if parameter.name in ("hass", "instance", "recorder", "recorder_instance"):
                positional_args.append(hass)
                continue

            if parameter.name == "start_time":
                positional_args.append(start_dt)
                continue

            if parameter.name == "end_time":
                positional_args.append(end_dt)
                continue

            if parameter.name == "entity_ids":
                positional_args.append([entity_id])
                continue

            if parameter.name == "entity_id":
                positional_args.append(entity_id)
                continue

            if parameter.name == "include_start_time_state":
                keyword_args["include_start_time_state"] = False
                continue

            if parameter.name == "significant_changes_only":
                keyword_args["significant_changes_only"] = False
                continue

            if parameter.name == "minimal_response":
                keyword_args["minimal_response"] = False
                continue

            if parameter.name == "no_attributes":
                keyword_args["no_attributes"] = True
                continue

        states_dict = get_significant_states(*positional_args, **keyword_args)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning(
            "hass_datapoints: get_significant_states failed for %s: %s", entity_id, err
        )
        return []

    if isinstance(states_dict, dict):
        states = states_dict.get(entity_id, [])
    elif isinstance(states_dict, list):
        states = states_dict
    else:
        states = []
    pts: list = []
    for state in states:
        try:
            value = float(state.state)
        except (ValueError, TypeError, AttributeError):
            continue
        if not math.isfinite(value):
            continue
        # last_updated_timestamp is available in HA 2023.9+; fall back to last_updated.
        try:
            ts_ms = int(state.last_updated_timestamp * 1000)
        except (AttributeError, TypeError):
            try:
                ts_ms = int(state.last_updated.timestamp() * 1000)
            except Exception:  # noqa: BLE001
                continue
        pts.append([ts_ms, value])

    if len(pts) > ANOMALY_MAX_PTS:
        pts = pts[-ANOMALY_MAX_PTS:]

    _LOGGER.debug(
        "hass_datapoints: fetch_entity_pts %s → %d pts (%d states)",
        entity_id,
        len(pts),
        len(states),
    )
    return pts


def fetch_entity_statistics_pts(
    hass, entity_id: str, start_time_iso: str, end_time_iso: str
) -> list:
    """Fetch hourly long-term statistics as [[timeMs, mean], ...].

    Must be called via hass.async_add_executor_job — this function is blocking.
    Returns an empty list on any error or if no statistics exist for the entity.
    """
    try:
        from homeassistant.components.recorder.statistics import (  # noqa: PLC0415
            statistics_during_period,
        )
    except ImportError:
        _LOGGER.debug("hass_datapoints: statistics_during_period not available")
        return []

    try:
        start_dt = _parse_dt(start_time_iso)
        end_dt = _parse_dt(end_time_iso)
    except ValueError:
        return []

    try:
        stats_dict = statistics_during_period(
            hass,
            start_dt,
            end_dt,
            [entity_id],
            "hour",
            {},
            {"mean"},
        )
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug(
            "hass_datapoints: statistics_during_period failed for %s: %s",
            entity_id,
            err,
        )
        return []

    entries = stats_dict.get(entity_id, [])
    pts: list = []
    for entry in entries:
        mean = entry.get("mean")
        if mean is None:
            continue
        try:
            mean_f = float(mean)
        except (TypeError, ValueError):
            continue
        if not math.isfinite(mean_f):
            continue
        start_val = entry.get("start")
        try:
            if isinstance(start_val, (int, float)):
                # HA 2023.9+ stores start as a Unix timestamp (seconds); older
                # versions may store it as milliseconds (> 1e11 threshold).
                ts_ms = int(start_val * 1000) if start_val < 1e11 else int(start_val)
            elif isinstance(start_val, datetime):
                ts_ms = int(start_val.timestamp() * 1000)
            else:
                continue
        except Exception:  # noqa: BLE001
            continue
        pts.append([ts_ms, mean_f])

    _LOGGER.debug(
        "hass_datapoints: fetch_entity_statistics_pts %s → %d pts", entity_id, len(pts)
    )
    return pts


def downsample_pts(pts: list, interval_seconds: int, aggregate: str) -> list:
    """Bucket pts into fixed-width time buckets and reduce with aggregate function.

    Returns the input unchanged when interval_seconds <= 0.
    The representative timestamp for each bucket is the timestamp of the first
    point that falls into that bucket (same behaviour as the JS worker approach).
    """
    if not pts or interval_seconds <= 0:
        return pts

    interval_ms = interval_seconds * 1000
    buckets: dict[int, list[float]] = {}
    bucket_rep_time: dict[int, int] = {}

    for time_ms, value in pts:
        idx = time_ms // interval_ms
        if idx not in buckets:
            buckets[idx] = []
            bucket_rep_time[idx] = time_ms
        buckets[idx].append(value)

    result: list = []
    for idx in sorted(buckets):
        values = buckets[idx]
        rep_time = bucket_rep_time[idx]
        if aggregate == "min":
            agg: float = min(values)
        elif aggregate == "max":
            agg = max(values)
        elif aggregate == "median":
            agg = statistics.median(values)
        elif aggregate == "first":
            agg = values[0]
        elif aggregate == "last":
            agg = values[-1]
        else:
            agg = statistics.mean(values)
        result.append([rep_time, agg])

    return result


def prepare_series(
    pts: list,
    stats: list,
    *,
    sample_interval: str | None = None,
    sample_aggregate: str | None = None,
    max_pts: int = ANOMALY_MAX_PTS,
) -> list:
    """Merge long-term statistics with raw recorder points, sample, and cap.

    Owns the canonical ordering (verbatim from the anomaly websocket site):

    1. Drop statistics points that overlap the raw recorder window — i.e. keep
       only those strictly before ``pts[0][0]``. When ``pts`` is empty, ALL
       statistics are retained (never touch ``pts[0][0]``).
    2. Merge the surviving statistics into ``pts`` and sort by timestamp.
    3. Downsample when ``sample_interval`` is set and not ``"raw"`` — BEFORE the
       cap, so long ranges collapse into buckets first.
    4. Cap to the most-recent ``max_pts`` points.
    """
    if stats:
        if pts:
            first_recorder_ms = pts[0][0]
            stats = [p for p in stats if p[0] < first_recorder_ms]
        if stats:
            pts = sorted(stats + pts, key=lambda p: p[0])

    if sample_interval and sample_interval != "raw":
        interval_secs = parse_interval_seconds(sample_interval)
        pts = downsample_pts(pts, interval_secs, sample_aggregate or "mean")

    if len(pts) > max_pts:
        pts = pts[-max_pts:]

    return pts


async def async_prepare_entity_series(
    hass,
    entity_id: str,
    start: str,
    end: str,
    *,
    sample_interval: str | None = None,
    sample_aggregate: str | None = None,
    max_pts: int = ANOMALY_MAX_PTS,
) -> list:
    """Fetch raw + statistics points for an entity and prepare the merged series.

    Thin async shell over :func:`prepare_series`: the caller needs no knowledge
    of the merge / sample / cap ordering.
    """
    recorder = get_instance(hass)
    pts: list = await recorder.async_add_executor_job(
        fetch_entity_pts, hass, entity_id, start, end
    )
    stats: list = await recorder.async_add_executor_job(
        fetch_entity_statistics_pts, hass, entity_id, start, end
    )
    return prepare_series(
        pts,
        stats,
        sample_interval=sample_interval,
        sample_aggregate=sample_aggregate,
        max_pts=max_pts,
    )


def get_global_history_bounds(
    recorder,
) -> tuple[str | None, str | None, str]:
    """Return earliest/latest recorder timestamps for Home Assistant globally."""
    get_session = getattr(recorder, "get_session", None)
    if get_session is None:
        return None, None, "recorder_session_unavailable"

    query_variants = [
        # HA recorder has long exposed recorder_runs as the broadest source of
        # database coverage. Newer schemas use explicit start/end columns.
        ("recorder_runs:start_end", "recorder_runs", "start", "end"),
        # Older recorder schemas used created/closed style columns instead of
        # start/end, so keep this fallback for older Core installs and upgrades.
        (
            "recorder_runs:created_closed",
            "recorder_runs",
            "created",
            "closed_incorrect",
        ),
        # Modern recorder tables expose UNIX-second timestamp mirrors for fast
        # numeric filtering; these appeared after the older datetime columns.
        ("states:last_updated_ts", "states", "last_updated_ts", "last_updated_ts"),
        # Older and mid-era HA recorder schemas only had datetime columns on
        # states, so we still probe them for long-lived upgraded databases.
        ("states:last_updated", "states", "last_updated", "last_updated"),
        # Events gained *_ts numeric mirrors in newer HA recorder versions, so
        # prefer them when available for consistent timestamp normalization.
        ("events:time_fired_ts", "events", "time_fired_ts", "time_fired_ts"),
        # Older event tables only expose datetime values, especially on
        # databases that have been upgraded across many HA releases.
        ("events:time_fired", "events", "time_fired", "time_fired"),
        # Long-term statistics in newer HA versions expose start_ts as a numeric
        # mirror of start, which is the most robust source when present.
        ("statistics:start_ts", "statistics", "start_ts", "start_ts"),
        # Older statistics schemas only expose the datetime start column.
        ("statistics:start", "statistics", "start", "start"),
        # statistics_short_term followed the same migration path as statistics:
        # newer HA builds provide numeric *_ts columns for recorder access.
        (
            "statistics_short_term:start_ts",
            "statistics_short_term",
            "start_ts",
            "start_ts",
        ),
        # Older short-term statistics tables only expose datetime start.
        ("statistics_short_term:start", "statistics_short_term", "start", "start"),
    ]

    def _quote(identifier: str) -> str:
        return '"' + identifier.replace('"', '""') + '"'

    def _run_bounds_query() -> tuple[str | None, str | None, str]:
        start_candidates: list[tuple[datetime, str]] = []
        end_candidates: list[tuple[datetime, str]] = []

        try:
            with session_scope(session=get_session()) as session:
                bind = session.get_bind()
                if bind is None:
                    return None, None, "recorder_bind_unavailable"

                inspector = sqlalchemy_inspect(bind)
                available_tables = set(inspector.get_table_names())
                column_cache: dict[str, set[str]] = {}

                def _get_columns(table_name: str) -> set[str]:
                    if table_name not in column_cache:
                        try:
                            column_cache[table_name] = {
                                column["name"]
                                for column in inspector.get_columns(table_name)
                            }
                        except Exception:
                            column_cache[table_name] = set()
                    return column_cache[table_name]

                for label, table_name, start_column, end_column in query_variants:
                    if table_name not in available_tables:
                        continue
                    columns = _get_columns(table_name)
                    if start_column not in columns:
                        continue
                    end_expr = (
                        f"MAX({_quote(end_column)})"
                        if end_column in columns
                        else "NULL"
                    )
                    query = text(
                        f"SELECT MIN({_quote(start_column)}) AS start_ts, "
                        f"{end_expr} AS end_ts FROM {_quote(table_name)}"
                    )
                    try:
                        row = session.execute(query).one_or_none()
                    except Exception:
                        continue
                    if not row:
                        continue
                    start_time = _normalize_recorder_timestamp(row[0])
                    end_time = _normalize_recorder_timestamp(row[1])
                    if start_time:
                        start_candidates.append(
                            (datetime.fromisoformat(start_time), label)
                        )
                    if end_time:
                        end_candidates.append((datetime.fromisoformat(end_time), label))
        except Exception as err:
            return None, None, f"recorder_query_error:{type(err).__name__}"

        if not start_candidates:
            return None, None, "no_recorder_start_found"

        min_start, start_source = min(start_candidates, key=lambda item: item[0])
        if end_candidates:
            max_end, end_source = max(end_candidates, key=lambda item: item[0])
            max_end_iso = max_end.isoformat()
        else:
            max_end_iso = None
            end_source = "missing"
        return (
            min_start.isoformat(),
            max_end_iso,
            f"start:{start_source};end:{end_source}",
        )

    return _run_bounds_query()


def _normalize_recorder_timestamp(value: object) -> str | None:
    """Normalize recorder query results to ISO timestamps."""
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=UTC).isoformat()

    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed.isoformat()

    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.isoformat()

    return None
