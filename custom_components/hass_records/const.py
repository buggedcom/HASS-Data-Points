"""Constants for Hass Records."""

DOMAIN = "hass_records"

STORAGE_KEY = "hass_records.events"
STORAGE_VERSION = 1

EVENT_RECORDED = f"{DOMAIN}_event_recorded"

# Service fields
ATTR_MESSAGE = "message"
ATTR_ANNOTATION = "annotation"
ATTR_ENTITY_IDS = "entity_ids"
ATTR_ICON = "icon"
ATTR_COLOR = "color"

SERVICE_RECORD = "record"

# Frontend resource URL (served by integration)
FRONTEND_URL = "/hass_records/cards.js"
