"""WebSocket API for Hass Records frontend cards."""
from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """Register websocket commands."""
    websocket_api.async_register_command(hass, ws_get_events)
    websocket_api.async_register_command(hass, ws_update_event)
    websocket_api.async_register_command(hass, ws_delete_event)


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
        vol.Required("type"): f"{DOMAIN}/events/update",
        vol.Required("event_id"): str,
        vol.Optional("message"): str,
        vol.Optional("annotation"): str,
        vol.Optional("entity_ids"): [str],
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
