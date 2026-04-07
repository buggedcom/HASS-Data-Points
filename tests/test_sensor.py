"""Tests for custom_components.hass_datapoints.sensor."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.hass_datapoints.sensor import DatapointsCountSensor
from custom_components.hass_datapoints.const import DOMAIN


def _make_entry(entry_id: str = "test_entry_id") -> MagicMock:
    entry = MagicMock()
    entry.entry_id = entry_id
    return entry


# ---------------------------------------------------------------------------
# DatapointsCountSensor — initialisation
# ---------------------------------------------------------------------------

class DescribeDatapointsCountSensor:
    class DescribeInit:
        def test_GIVEN_store_with_no_events_WHEN_sensor_created_THEN_native_value_is_zero(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_native_value == 0

        def test_GIVEN_store_with_three_events_WHEN_sensor_created_THEN_native_value_is_three(self):
            store = MagicMock()
            store.get_event_count.return_value = 3
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_native_value == 3

        def test_GIVEN_entry_id_WHEN_sensor_created_THEN_unique_id_includes_entry_id(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry("abc123"), store)
            assert sensor._attr_unique_id == "abc123_datapoint_count"

        def test_GIVEN_sensor_created_WHEN_name_read_THEN_returns_datapoint_count(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_name == "Datapoint count"

        def test_GIVEN_sensor_created_WHEN_icon_read_THEN_returns_counter_icon(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_icon == "mdi:counter"

    # ---------------------------------------------------------------------------
    # device_info
    # ---------------------------------------------------------------------------

    class DescribeDeviceInfo:
        def test_GIVEN_sensor_WHEN_device_info_read_THEN_name_is_hass_data_points(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            info = sensor.device_info
            assert info["name"] == "Hass Data Points"

        def test_GIVEN_sensor_WHEN_device_info_read_THEN_manufacturer_is_buggedcom(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            info = sensor.device_info
            assert info["manufacturer"] == "buggedcom"

        def test_GIVEN_sensor_WHEN_device_info_read_THEN_model_is_data_points(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            info = sensor.device_info
            assert info["model"] == "Data Points"

        def test_GIVEN_entry_id_WHEN_device_info_read_THEN_identifiers_include_domain_and_entry_id(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry("myentry"), store)
            info = sensor.device_info
            assert (DOMAIN, "myentry") in info["identifiers"]

    # ---------------------------------------------------------------------------
    # _handle_store_update
    # ---------------------------------------------------------------------------

    class DescribeHandleStoreUpdate:
        def test_GIVEN_store_count_changes_WHEN_handle_update_called_THEN_native_value_updated(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            store.get_event_count.return_value = 5
            sensor._handle_store_update()
            assert sensor._attr_native_value == 5

        def test_GIVEN_store_update_WHEN_handle_update_called_THEN_ha_state_written(self):
            store = MagicMock()
            store.get_event_count.return_value = 0
            sensor = DatapointsCountSensor(_make_entry(), store)
            sensor._handle_store_update()
            sensor.async_write_ha_state.assert_called_once()

    # ---------------------------------------------------------------------------
    # async_added_to_hass
    # ---------------------------------------------------------------------------

    class DescribeAsyncAddedToHass:
        async def test_GIVEN_sensor_added_to_hass_WHEN_store_mutates_THEN_listener_fires(self):
            store = MagicMock()
            store.get_event_count.return_value = 0

            captured_listener = None

            def fake_add_listener(callback):
                nonlocal captured_listener
                captured_listener = callback
                return lambda: None  # unsubscribe stub

            store.async_add_listener.side_effect = fake_add_listener
            sensor = DatapointsCountSensor(_make_entry(), store)
            await sensor.async_added_to_hass()

            store.get_event_count.return_value = 7
            captured_listener()
            assert sensor._attr_native_value == 7
