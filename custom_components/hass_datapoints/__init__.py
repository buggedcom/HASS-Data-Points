"""Hass Records - Record custom events with chart annotations."""
from __future__ import annotations

from pathlib import Path

import voluptuous as vol

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_ANNOTATION,
    ATTR_COLOR,
    ATTR_ENTITY_IDS,
    ATTR_ICON,
    ATTR_MESSAGE,
    DOMAIN,
    EVENT_RECORDED,
    FRONTEND_URL,
    PANEL_COMPONENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    SERVICE_RECORD,
)
from .store import HassRecordsStore
from . import websocket_api as ws_api

type HassRecordsConfigEntry = ConfigEntry[HassRecordsStore]



SERVICE_RECORD_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_MESSAGE): cv.string,
        vol.Optional(ATTR_ANNOTATION): cv.string,
        vol.Optional(ATTR_ENTITY_IDS): vol.All(cv.ensure_list, [cv.entity_id]),
        vol.Optional(ATTR_ICON): cv.string,
        vol.Optional(ATTR_COLOR): vol.Any(
            cv.string,
            vol.All(
                [vol.Coerce(int)],
                vol.Length(min=3, max=3),
            ),
        ),
    }
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up static resources shared across all config entries."""
    # Serve the frontend card JS file
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            FRONTEND_URL,
            str(Path(__file__).parent / "hass-datapoints-cards.js"),
            cache_headers=False,
        )
    ])

    # Auto-register as a Lovelace module resource so cards are immediately available
    add_extra_js_url(hass, FRONTEND_URL)

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_COMPONENT,
        frontend_url_path=PANEL_URL_PATH,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=FRONTEND_URL,
        require_admin=False,
    )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: HassRecordsConfigEntry) -> bool:
    """Set up Hass Records from a config entry."""
    store = HassRecordsStore(hass)
    await store.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = store

    # Register the record service
    async def handle_record(call: ServiceCall) -> None:
        color = call.data.get(ATTR_COLOR)
        # Convert RGB list [R, G, B] to hex string
        if isinstance(color, list) and len(color) == 3:
            color = "#{:02x}{:02x}{:02x}".format(*color)

        event_data = await store.async_record(
            message=call.data[ATTR_MESSAGE],
            annotation=call.data.get(ATTR_ANNOTATION),
            entity_ids=call.data.get(ATTR_ENTITY_IDS),
            icon=call.data.get(ATTR_ICON),
            color=color,
        )
        hass.bus.async_fire(EVENT_RECORDED, event_data)

    hass.services.async_register(
        DOMAIN, SERVICE_RECORD, handle_record, schema=SERVICE_RECORD_SCHEMA
    )

    # Register websocket commands used by the frontend cards
    ws_api.async_register_commands(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: HassRecordsConfigEntry) -> bool:
    """Unload a config entry."""
    hass.services.async_remove(DOMAIN, SERVICE_RECORD)
    hass.data[DOMAIN].pop("store", None)
    return True
