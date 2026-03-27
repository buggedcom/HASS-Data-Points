"""WebSocket API for Hass Records frontend cards."""
from __future__ import annotations

from datetime import datetime, timezone

import voluptuous as vol
from sqlalchemy import inspect as sqlalchemy_inspect, text

from homeassistant.components.recorder import get_instance
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.recorder import session_scope

from .const import DOMAIN


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """Register websocket commands."""
    websocket_api.async_register_command(hass, ws_get_events)
    websocket_api.async_register_command(hass, ws_get_event_bounds)
    websocket_api.async_register_command(hass, ws_update_event)
    websocket_api.async_register_command(hass, ws_delete_event)
    websocket_api.async_register_command(hass, ws_delete_dev_events)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/events",
        vol.Optional("start_time"): str,
        vol.Optional("end_time"): str,
        # entity_ids: list of entity IDs to filter by (global events always included)
        vol.Optional("entity_ids"): [str],
    }
)
@websocket_api.async_response
async def ws_get_events(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return recorded events, with optional time/entity filters."""
    store = hass.data[DOMAIN]["store"]
    events = store.get_events(
        start=msg.get("start_time"),
        end=msg.get("end_time"),
        entity_ids=msg.get("entity_ids"),
    )
    connection.send_result(msg["id"], {"events": events})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/events_bounds",
    }
)
@websocket_api.async_response
async def ws_get_event_bounds(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return the earliest and latest recorded event timestamps."""
    store = hass.data[DOMAIN]["store"]
    start_time, end_time, source = await hass.async_add_executor_job(_get_global_history_bounds, hass)
    if start_time is None and end_time is None:
        start_time, end_time = store.get_event_bounds()
        source = "datapoints_store_fallback"
    connection.send_result(
        msg["id"],
        {"start_time": start_time, "end_time": end_time, "source": source},
    )


def _get_global_history_bounds(hass: HomeAssistant) -> tuple[str | None, str | None, str]:
    """Return earliest/latest recorder timestamps for Home Assistant globally."""
    recorder = get_instance(hass)
    get_session = getattr(recorder, "get_session", None)
    if get_session is None:
        return None, None, "recorder_session_unavailable"

    query_variants = [
        ("recorder_runs:start_end", "recorder_runs", "start", "end"),
        ("recorder_runs:created_closed", "recorder_runs", "created", "closed_incorrect"),
        ("states:last_updated_ts", "states", "last_updated_ts", "last_updated_ts"),
        ("states:last_updated", "states", "last_updated", "last_updated"),
        ("events:time_fired_ts", "events", "time_fired_ts", "time_fired_ts"),
        ("events:time_fired", "events", "time_fired", "time_fired"),
        ("statistics:start_ts", "statistics", "start_ts", "start_ts"),
        ("statistics:start", "statistics", "start", "start"),
        ("statistics_short_term:start_ts", "statistics_short_term", "start_ts", "start_ts"),
        ("statistics_short_term:start", "statistics_short_term", "start", "start"),
    ]

    start_candidates: list[tuple[datetime, str]] = []
    end_candidates: list[tuple[datetime, str]] = []

    def _quote(identifier: str) -> str:
        return f'"{identifier}"'

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
                            column["name"] for column in inspector.get_columns(table_name)
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
                end_expr = f"MAX({_quote(end_column)})" if end_column in columns else "NULL"
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
                    start_candidates.append((datetime.fromisoformat(start_time), label))
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
    return min_start.isoformat(), max_end_iso, f"start:{start_source};end:{end_source}"


def _normalize_recorder_timestamp(value: object) -> str | None:
    """Normalize recorder query results to ISO timestamps."""
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()

    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.isoformat()

    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()

    return None


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/events/update",
        vol.Required("event_id"): str,
        vol.Optional("message"): str,
        vol.Optional("annotation"): str,
        vol.Optional("entity_ids"): [str],
        vol.Optional("device_ids"): [str],
        vol.Optional("area_ids"): [str],
        vol.Optional("label_ids"): [str],
        vol.Optional("icon"): str,
        vol.Optional("color"): str,
    }
)
@websocket_api.async_response
async def ws_update_event(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Update a recorded event by ID."""
    store = hass.data[DOMAIN]["store"]
    updated = await store.async_update_event(
        event_id=msg["event_id"],
        message=msg.get("message"),
        annotation=msg.get("annotation"),
        entity_ids=msg.get("entity_ids"),
        device_ids=msg.get("device_ids"),
        area_ids=msg.get("area_ids"),
        label_ids=msg.get("label_ids"),
        icon=msg.get("icon"),
        color=msg.get("color"),
    )
    if updated is not None:
        connection.send_result(msg["id"], {"updated": True, "event": updated})
    else:
        connection.send_error(msg["id"], "not_found", "Event not found")


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/events/delete",
        vol.Required("event_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_event(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Delete a recorded event by ID."""
    store = hass.data[DOMAIN]["store"]
    deleted = await store.async_delete_event(msg["event_id"])
    connection.send_result(msg["id"], {"deleted": deleted})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/events/delete_dev",
    }
)
@websocket_api.async_response
async def ws_delete_dev_events(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Delete all dev-flagged events."""
    store = hass.data[DOMAIN]["store"]
    deleted = await store.async_delete_dev_events()
    connection.send_result(msg["id"], {"deleted": deleted})
