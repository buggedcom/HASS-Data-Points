"""Persistent storage for Hass Records events."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION


class HassRecordsStore:
    """Manages persistent storage of recorded events."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"events": []}

    async def async_load(self) -> None:
        """Load data from persistent storage."""
        data = await self._store.async_load()
        if data is not None:
            self._data = data
            # Migrate legacy single entity_id → entity_ids list
            for event in self._data.get("events", []):
                if "entity_id" in event and "entity_ids" not in event:
                    event["entity_ids"] = [event.pop("entity_id")]
                elif "entity_ids" not in event:
                    event["entity_ids"] = []

    async def async_record(
        self,
        message: str,
        annotation: str | None = None,
        entity_ids: list[str] | None = None,
        icon: str | None = None,
        color: str | None = None,
    ) -> dict[str, Any]:
        """Record a new event and persist it."""
        event: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message,
            "annotation": annotation if annotation is not None else message,
            "entity_ids": entity_ids or [],
            "icon": icon or "mdi:bookmark",
            "color": color or "#03a9f4",
        }

        self._data["events"].append(event)
        await self._store.async_save(self._data)
        return event

    def get_events(
        self,
        start: str | None = None,
        end: str | None = None,
        entity_ids: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Return events, optionally filtered by time range and entity list.

        Filter logic:
        - Events with no entity_ids are global and always included.
        - Events with entity_ids are included only if they intersect with the
          requested entity_ids list.
        - Results are deduplicated by event id (relevant when multiple entity
          filters would match the same event).
        """
        events: list[dict[str, Any]] = self._data.get("events", [])

        if start is not None:
            events = [e for e in events if e["timestamp"] >= start]
        if end is not None:
            events = [e for e in events if e["timestamp"] <= end]

        if entity_ids is not None:
            requested = set(entity_ids)
            filtered: list[dict[str, Any]] = []
            seen_ids: set[str] = set()
            for event in events:
                ev_entities = set(event.get("entity_ids", []))
                if not ev_entities or ev_entities & requested:
                    if event["id"] not in seen_ids:
                        seen_ids.add(event["id"])
                        filtered.append(event)
            events = filtered

        return events

    async def async_update_event(
        self,
        event_id: str,
        message: str | None = None,
        annotation: str | None = None,
        entity_ids: list[str] | None = None,
        icon: str | None = None,
        color: str | None = None,
    ) -> dict[str, Any] | None:
        """Update an existing event. Returns the updated event or None if not found."""
        for event in self._data["events"]:
            if event["id"] == event_id:
                if message is not None:
                    event["message"] = message
                if annotation is not None:
                    event["annotation"] = annotation
                if entity_ids is not None:
                    event["entity_ids"] = entity_ids
                if icon is not None:
                    event["icon"] = icon
                if color is not None:
                    event["color"] = color
                await self._store.async_save(self._data)
                return event
        return None

    async def async_delete_event(self, event_id: str) -> bool:
        """Delete an event by ID. Returns True if found and deleted."""
        original_len = len(self._data["events"])
        self._data["events"] = [
            e for e in self._data["events"] if e["id"] != event_id
        ]
        if len(self._data["events"]) < original_len:
            await self._store.async_save(self._data)
            return True
        return False
