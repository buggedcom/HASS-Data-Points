"""Tests for custom_components.hass_datapoints.logbook."""
from __future__ import annotations

from unittest.mock import MagicMock

from custom_components.hass_datapoints.logbook import async_describe_events
from custom_components.hass_datapoints.const import DOMAIN, EVENT_RECORDED


def _make_event(data: dict) -> MagicMock:
    event = MagicMock()
    event.data = data
    return event


def _get_describer() -> tuple:
    """Call async_describe_events and capture the registered describer callback."""
    captured: dict = {}

    def fake_async_describe_event(domain, event_type, callback):
        captured["domain"] = domain
        captured["event_type"] = event_type
        captured["callback"] = callback

    hass = MagicMock()
    async_describe_events(hass, fake_async_describe_event)
    return captured


# ---------------------------------------------------------------------------
# async_describe_events — registration
# ---------------------------------------------------------------------------

class DescribeAsyncDescribeEvents:
    def test_GIVEN_registered_WHEN_called_THEN_registers_for_correct_domain(self):
        captured = _get_describer()
        assert captured["domain"] == DOMAIN

    def test_GIVEN_registered_WHEN_called_THEN_registers_for_event_recorded_type(self):
        captured = _get_describer()
        assert captured["event_type"] == EVENT_RECORDED


# ---------------------------------------------------------------------------
# async_describe_hass_datapoints_event — callback behaviour
# ---------------------------------------------------------------------------

class DescribeEventDescriber:
    def setup_method(self):
        self.describer = _get_describer()["callback"]

    def test_GIVEN_event_with_message_WHEN_described_THEN_message_is_returned(self):
        result = self.describer(_make_event({"message": "deployment"}))
        assert result["message"] == "deployment"

    def test_GIVEN_event_without_message_WHEN_described_THEN_defaults_to_event_recorded(self):
        result = self.describer(_make_event({}))
        assert result["message"] == "Event recorded"

    def test_GIVEN_event_WHEN_described_THEN_name_is_datapoint(self):
        result = self.describer(_make_event({}))
        assert result["name"] == "Datapoint"

    def test_GIVEN_event_with_custom_icon_WHEN_described_THEN_icon_is_used(self):
        result = self.describer(_make_event({"icon": "mdi:star"}))
        assert result["icon"] == "mdi:star"

    def test_GIVEN_event_without_icon_WHEN_described_THEN_defaults_to_bookmark(self):
        result = self.describer(_make_event({}))
        assert result["icon"] == "mdi:bookmark"

    def test_GIVEN_event_with_color_WHEN_described_THEN_icon_color_is_set(self):
        result = self.describer(_make_event({"color": "#ff0000"}))
        assert result["icon_color"] == "#ff0000"

    def test_GIVEN_event_without_color_WHEN_described_THEN_icon_color_defaults_to_blue(self):
        result = self.describer(_make_event({}))
        assert result["icon_color"] == "#03a9f4"

    def test_GIVEN_event_with_entity_ids_WHEN_described_THEN_first_entity_id_is_set(self):
        result = self.describer(_make_event({"entity_ids": ["sensor.a", "sensor.b"]}))
        assert result["entity_id"] == "sensor.a"

    def test_GIVEN_event_with_empty_entity_ids_WHEN_described_THEN_entity_id_not_in_result(self):
        result = self.describer(_make_event({"entity_ids": []}))
        assert "entity_id" not in result

    def test_GIVEN_event_without_entity_ids_WHEN_described_THEN_entity_id_not_in_result(self):
        result = self.describer(_make_event({}))
        assert "entity_id" not in result
