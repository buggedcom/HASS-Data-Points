"""Logbook integration for Hass Records."""
from __future__ import annotations

from homeassistant.core import Event, HomeAssistant, callback

from .const import DOMAIN, EVENT_RECORDED, ATTR_MESSAGE, ATTR_ENTITY_IDS, ATTR_ICON, ATTR_COLOR


def async_describe_events(
    hass: HomeAssistant,
    async_describe_event: callback,
) -> None:
    """Describe how Hass Records events appear in the logbook."""

    @callback
    def async_describe_hass_records_event(event: Event) -> dict:
        data = event.data
        message = data.get(ATTR_MESSAGE, "Event recorded")
        entity_ids: list[str] = data.get(ATTR_ENTITY_IDS, [])
        icon = data.get(ATTR_ICON, "mdi:bookmark")
        color = data.get(ATTR_COLOR, "#03a9f4")

        result: dict = {
            "name": "Hass Records",
            "message": message,
            "icon": icon,
        }

        # HA logbook supports icon coloring via the context user
        # but we use the domain_data approach for the icon
        if color:
            result["icon_color"] = color

        # Logbook accepts a single entity_id; use the first one if present
        if entity_ids:
            result["entity_id"] = entity_ids[0]

        return result

    async_describe_event(DOMAIN, EVENT_RECORDED, async_describe_hass_records_event)
