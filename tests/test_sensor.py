"""Tests for custom_components.hass_datapoints.sensor."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.sensor import (
    DatapointsAutomationCountSensor,
    DatapointsCountSensor,
    DatapointsLastMessageSensor,
    DatapointsLastTimestampSensor,
    DatapointsManualCountSensor,
    DatapointsTimeSinceLastSensor,
    DatapointsTodayCountSensor,
    DatapointsWeekCountSensor,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_entry(entry_id: str = "test_entry_id") -> MagicMock:
    entry = MagicMock()
    entry.entry_id = entry_id
    return entry


def _make_store(**kwargs) -> MagicMock:
    """Return a MagicMock store with sensible defaults that tests can override."""
    store = MagicMock()
    store.get_event_count.return_value = kwargs.get("count", 0)
    store.get_last_event.return_value = kwargs.get("last_event")
    store.get_events_count_in_range.return_value = kwargs.get("range_count", 0)
    store.get_automation_manual_counts.return_value = kwargs.get("auto_manual", (0, 0))
    store.async_add_listener.return_value = lambda: None
    return store


def _make_hass() -> MagicMock:
    return MagicMock()


# ---------------------------------------------------------------------------
# DatapointsCountSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsCountSensor:
    class DescribeInit:
        def test_GIVEN_store_with_no_events_WHEN_sensor_created_THEN_native_value_is_zero(
            self,
        ):
            store = _make_store(count=0)
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_native_value == 0

        def test_GIVEN_store_with_three_events_WHEN_sensor_created_THEN_native_value_is_three(
            self,
        ):
            store = _make_store(count=3)
            sensor = DatapointsCountSensor(_make_entry(), store)
            assert sensor._attr_native_value == 3

        def test_GIVEN_entry_id_WHEN_sensor_created_THEN_unique_id_includes_entry_id(
            self,
        ):
            store = _make_store()
            sensor = DatapointsCountSensor(_make_entry("abc123"), store)
            assert sensor._attr_unique_id == "abc123_datapoint_count"

        def test_GIVEN_sensor_created_WHEN_name_read_THEN_returns_datapoint_count(self):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            assert sensor._attr_name == "Datapoint count"

        def test_GIVEN_sensor_created_WHEN_icon_read_THEN_returns_counter_icon(self):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            assert sensor._attr_icon == "mdi:counter"

    class DescribeDeviceInfo:
        def test_GIVEN_sensor_WHEN_device_info_read_THEN_name_is_hass_data_points(self):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            assert sensor.device_info["name"] == "Hass Data Points"

        def test_GIVEN_sensor_WHEN_device_info_read_THEN_manufacturer_is_buggedcom(
            self,
        ):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            assert sensor.device_info["manufacturer"] == "buggedcom"

        def test_GIVEN_sensor_WHEN_device_info_read_THEN_model_is_data_points(self):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            assert sensor.device_info["model"] == "Data Points"

        def test_GIVEN_entry_id_WHEN_device_info_read_THEN_identifiers_include_domain_and_entry_id(
            self,
        ):
            sensor = DatapointsCountSensor(_make_entry("myentry"), _make_store())
            assert (DOMAIN, "myentry") in sensor.device_info["identifiers"]

    class DescribeHandleStoreUpdate:
        def test_GIVEN_store_count_changes_WHEN_handle_update_called_THEN_native_value_updated(
            self,
        ):
            store = _make_store(count=0)
            sensor = DatapointsCountSensor(_make_entry(), store)
            store.get_event_count.return_value = 5
            sensor._handle_store_update()
            assert sensor._attr_native_value == 5

        def test_GIVEN_store_update_WHEN_handle_update_called_THEN_ha_state_written(
            self,
        ):
            sensor = DatapointsCountSensor(_make_entry(), _make_store())
            sensor._handle_store_update()
            sensor.async_write_ha_state.assert_called_once()

    class DescribeAsyncAddedToHass:
        async def test_GIVEN_sensor_added_to_hass_WHEN_store_mutates_THEN_listener_fires(
            self,
        ):
            store = _make_store(count=0)
            captured_listener = None

            def fake_add_listener(callback):
                nonlocal captured_listener
                captured_listener = callback
                return lambda: None

            store.async_add_listener.side_effect = fake_add_listener
            sensor = DatapointsCountSensor(_make_entry(), store)
            await sensor.async_added_to_hass()

            store.get_event_count.return_value = 7
            captured_listener()
            assert sensor._attr_native_value == 7


# ---------------------------------------------------------------------------
# DatapointsLastTimestampSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsLastTimestampSensor:
    class DescribeInit:
        def test_GIVEN_no_last_event_WHEN_created_THEN_native_value_is_none(self):
            sensor = DatapointsLastTimestampSensor(_make_entry(), _make_store())
            assert sensor._attr_native_value is None

        def test_GIVEN_last_event_with_timestamp_WHEN_created_THEN_native_value_is_datetime(
            self,
        ):
            store = _make_store(
                last_event={"timestamp": "2024-06-01T12:00:00+00:00", "message": "hi"}
            )
            sensor = DatapointsLastTimestampSensor(_make_entry(), store)
            assert isinstance(sensor._attr_native_value, datetime)
            assert sensor._attr_native_value == datetime(
                2024, 6, 1, 12, 0, 0, tzinfo=UTC
            )

        def test_GIVEN_naive_timestamp_WHEN_created_THEN_utc_tzinfo_added(self):
            store = _make_store(
                last_event={"timestamp": "2024-06-01T12:00:00", "message": "hi"}
            )
            sensor = DatapointsLastTimestampSensor(_make_entry(), store)
            assert sensor._attr_native_value is not None
            assert sensor._attr_native_value.tzinfo is not None

        def test_GIVEN_invalid_timestamp_WHEN_created_THEN_native_value_is_none(self):
            store = _make_store(last_event={"timestamp": "not-a-date", "message": "hi"})
            sensor = DatapointsLastTimestampSensor(_make_entry(), store)
            assert sensor._attr_native_value is None

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsLastTimestampSensor(_make_entry("eid"), _make_store())
            assert sensor._attr_unique_id == "eid_last_timestamp"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_last_recorded(self):
            sensor = DatapointsLastTimestampSensor(_make_entry(), _make_store())
            assert sensor._attr_name == "Last recorded"

    class DescribeHandleStoreUpdate:
        def test_GIVEN_store_gains_event_WHEN_update_called_THEN_value_set_to_datetime(
            self,
        ):
            store = _make_store()
            sensor = DatapointsLastTimestampSensor(_make_entry(), store)
            store.get_last_event.return_value = {
                "timestamp": "2024-09-15T08:30:00+00:00",
                "message": "new",
            }
            sensor._handle_store_update()
            assert sensor._attr_native_value == datetime(
                2024, 9, 15, 8, 30, 0, tzinfo=UTC
            )


# ---------------------------------------------------------------------------
# DatapointsLastMessageSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsLastMessageSensor:
    class DescribeInit:
        def test_GIVEN_no_last_event_WHEN_created_THEN_native_value_is_none(self):
            sensor = DatapointsLastMessageSensor(_make_entry(), _make_store())
            assert sensor._attr_native_value is None

        def test_GIVEN_last_event_WHEN_created_THEN_native_value_is_message_string(
            self,
        ):
            store = _make_store(
                last_event={
                    "timestamp": "2024-06-01T12:00:00+00:00",
                    "message": "Hello world",
                }
            )
            sensor = DatapointsLastMessageSensor(_make_entry(), store)
            assert sensor._attr_native_value == "Hello world"

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsLastMessageSensor(_make_entry("eid"), _make_store())
            assert sensor._attr_unique_id == "eid_last_message"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_last_message(self):
            sensor = DatapointsLastMessageSensor(_make_entry(), _make_store())
            assert sensor._attr_name == "Last message"

    class DescribeHandleStoreUpdate:
        def test_GIVEN_store_gains_event_WHEN_update_called_THEN_value_is_new_message(
            self,
        ):
            store = _make_store()
            sensor = DatapointsLastMessageSensor(_make_entry(), store)
            store.get_last_event.return_value = {
                "timestamp": "2024-09-15T08:30:00+00:00",
                "message": "Updated",
            }
            sensor._handle_store_update()
            assert sensor._attr_native_value == "Updated"

        def test_GIVEN_no_last_event_WHEN_update_called_THEN_value_is_none(self):
            store = _make_store(
                last_event={"timestamp": "2024-06-01T00:00:00+00:00", "message": "old"}
            )
            sensor = DatapointsLastMessageSensor(_make_entry(), store)
            store.get_last_event.return_value = None
            sensor._handle_store_update()
            assert sensor._attr_native_value is None


# ---------------------------------------------------------------------------
# DatapointsTimeSinceLastSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsTimeSinceLastSensor:
    class DescribeInit:
        def test_GIVEN_no_last_event_WHEN_created_THEN_native_value_is_none(self):
            sensor = DatapointsTimeSinceLastSensor(
                _make_entry(), _make_store(), _make_hass()
            )
            assert sensor._attr_native_value is None

        def test_GIVEN_last_event_two_hours_ago_WHEN_created_THEN_native_value_is_two(
            self,
        ):
            two_hours_ago = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
            store = _make_store(last_event={"timestamp": two_hours_ago, "message": "x"})
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, _make_hass())
            assert sensor._attr_native_value == pytest.approx(2.0, abs=0.1)

        def test_GIVEN_last_event_in_future_WHEN_created_THEN_native_value_is_negative(
            self,
        ):
            future = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
            store = _make_store(last_event={"timestamp": future, "message": "x"})
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, _make_hass())
            assert sensor._attr_native_value < 0

        def test_GIVEN_invalid_timestamp_WHEN_created_THEN_native_value_is_none(self):
            store = _make_store(last_event={"timestamp": "bad", "message": "x"})
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, _make_hass())
            assert sensor._attr_native_value is None

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsTimeSinceLastSensor(
                _make_entry("eid"), _make_store(), _make_hass()
            )
            assert sensor._attr_unique_id == "eid_time_since_last"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_time_since_last_datapoint(
            self,
        ):
            sensor = DatapointsTimeSinceLastSensor(
                _make_entry(), _make_store(), _make_hass()
            )
            assert sensor._attr_name == "Time since last datapoint"

        def test_GIVEN_sensor_WHEN_unit_read_THEN_returns_hours(self):
            from custom_components.hass_datapoints.sensor import UnitOfTime

            sensor = DatapointsTimeSinceLastSensor(
                _make_entry(), _make_store(), _make_hass()
            )
            assert sensor._attr_native_unit_of_measurement == UnitOfTime.HOURS

    class DescribeAsyncAddedToHass:
        async def test_GIVEN_sensor_added_to_hass_WHEN_added_THEN_time_interval_registered(
            self,
        ):
            from homeassistant.helpers.event import async_track_time_interval

            store = _make_store()
            hass = _make_hass()
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, hass)
            await sensor.async_added_to_hass()

            async_track_time_interval.assert_called_once()

        async def test_GIVEN_sensor_added_to_hass_WHEN_added_THEN_store_listener_registered(
            self,
        ):
            store = _make_store()
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, _make_hass())
            await sensor.async_added_to_hass()
            store.async_add_listener.assert_called_once()

    class DescribeHandleTimeInterval:
        def test_GIVEN_time_passes_WHEN_interval_fires_THEN_value_refreshed(self):
            one_hour_ago = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
            store = _make_store(last_event={"timestamp": one_hour_ago, "message": "x"})
            sensor = DatapointsTimeSinceLastSensor(_make_entry(), store, _make_hass())
            sensor._handle_time_interval(datetime.now(UTC))
            assert sensor._attr_native_value == pytest.approx(1.0, abs=0.1)
            sensor.async_write_ha_state.assert_called_once()


# ---------------------------------------------------------------------------
# DatapointsTodayCountSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsTodayCountSensor:
    class DescribeInit:
        def test_GIVEN_no_events_today_WHEN_created_THEN_native_value_is_zero(self):
            sensor = DatapointsTodayCountSensor(
                _make_entry(), _make_store(range_count=0), _make_hass()
            )
            assert sensor._attr_native_value == 0

        def test_GIVEN_three_events_today_WHEN_created_THEN_native_value_is_three(self):
            sensor = DatapointsTodayCountSensor(
                _make_entry(), _make_store(range_count=3), _make_hass()
            )
            assert sensor._attr_native_value == 3

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsTodayCountSensor(
                _make_entry("eid"), _make_store(), _make_hass()
            )
            assert sensor._attr_unique_id == "eid_today_count"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_recorded_today(self):
            sensor = DatapointsTodayCountSensor(
                _make_entry(), _make_store(), _make_hass()
            )
            assert sensor._attr_name == "Recorded today"

        def test_GIVEN_sensor_WHEN_compute_called_THEN_store_queried_with_start_of_today(
            self,
        ):
            store = _make_store(range_count=2)
            DatapointsTodayCountSensor(_make_entry(), store, _make_hass())
            store.get_events_count_in_range.assert_called_once()
            # The start argument passed should be an ISO string representing today's start
            call_kwargs = store.get_events_count_in_range.call_args
            start_str = call_kwargs[1].get("start") or call_kwargs[0][0]
            # Must parse as a valid datetime
            dt = datetime.fromisoformat(start_str)
            assert dt.tzinfo is not None

    class DescribeHandleStoreUpdate:
        def test_GIVEN_new_event_today_WHEN_update_called_THEN_count_incremented(self):
            store = _make_store(range_count=0)
            sensor = DatapointsTodayCountSensor(_make_entry(), store, _make_hass())
            store.get_events_count_in_range.return_value = 1
            sensor._handle_store_update()
            assert sensor._attr_native_value == 1

    class DescribeAsyncAddedToHass:
        async def test_GIVEN_sensor_added_WHEN_added_THEN_time_interval_registered(
            self,
        ):
            from homeassistant.helpers.event import async_track_time_interval

            async_track_time_interval.reset_mock()

            store = _make_store()
            sensor = DatapointsTodayCountSensor(_make_entry(), store, _make_hass())
            await sensor.async_added_to_hass()
            async_track_time_interval.assert_called_once()


# ---------------------------------------------------------------------------
# DatapointsWeekCountSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsWeekCountSensor:
    class DescribeInit:
        def test_GIVEN_no_events_this_week_WHEN_created_THEN_native_value_is_zero(self):
            sensor = DatapointsWeekCountSensor(
                _make_entry(), _make_store(range_count=0), _make_hass()
            )
            assert sensor._attr_native_value == 0

        def test_GIVEN_five_events_this_week_WHEN_created_THEN_native_value_is_five(
            self,
        ):
            sensor = DatapointsWeekCountSensor(
                _make_entry(), _make_store(range_count=5), _make_hass()
            )
            assert sensor._attr_native_value == 5

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsWeekCountSensor(
                _make_entry("eid"), _make_store(), _make_hass()
            )
            assert sensor._attr_unique_id == "eid_week_count"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_recorded_this_week(self):
            sensor = DatapointsWeekCountSensor(
                _make_entry(), _make_store(), _make_hass()
            )
            assert sensor._attr_name == "Recorded this week"

        def test_GIVEN_sensor_WHEN_compute_called_THEN_store_queried_with_start_of_week_before_today(
            self,
        ):
            store = _make_store(range_count=0)
            DatapointsWeekCountSensor(_make_entry(), store, _make_hass())
            store.get_events_count_in_range.assert_called_once()
            call_kwargs = store.get_events_count_in_range.call_args
            start_str = call_kwargs[1].get("start") or call_kwargs[0][0]
            dt = datetime.fromisoformat(start_str)
            assert dt.tzinfo is not None
            # Week start must be <= today start
            today_start = datetime.now(UTC).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            assert dt <= today_start


# ---------------------------------------------------------------------------
# DatapointsAutomationCountSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsAutomationCountSensor:
    class DescribeInit:
        def test_GIVEN_no_automation_events_WHEN_created_THEN_native_value_is_zero(
            self,
        ):
            sensor = DatapointsAutomationCountSensor(
                _make_entry(), _make_store(auto_manual=(0, 3))
            )
            assert sensor._attr_native_value == 0

        def test_GIVEN_two_automation_events_WHEN_created_THEN_native_value_is_two(
            self,
        ):
            sensor = DatapointsAutomationCountSensor(
                _make_entry(), _make_store(auto_manual=(2, 5))
            )
            assert sensor._attr_native_value == 2

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsAutomationCountSensor(_make_entry("eid"), _make_store())
            assert sensor._attr_unique_id == "eid_automation_count"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_automation_recorded(self):
            sensor = DatapointsAutomationCountSensor(_make_entry(), _make_store())
            assert sensor._attr_name == "Automation recorded"

    class DescribeHandleStoreUpdate:
        def test_GIVEN_new_automation_event_WHEN_update_called_THEN_count_incremented(
            self,
        ):
            store = _make_store(auto_manual=(1, 0))
            sensor = DatapointsAutomationCountSensor(_make_entry(), store)
            store.get_automation_manual_counts.return_value = (3, 0)
            sensor._handle_store_update()
            assert sensor._attr_native_value == 3

        def test_GIVEN_store_update_WHEN_handle_called_THEN_ha_state_written(self):
            sensor = DatapointsAutomationCountSensor(_make_entry(), _make_store())
            sensor._handle_store_update()
            sensor.async_write_ha_state.assert_called_once()


# ---------------------------------------------------------------------------
# DatapointsManualCountSensor
# ---------------------------------------------------------------------------


class DescribeDatapointsManualCountSensor:
    class DescribeInit:
        def test_GIVEN_no_manual_events_WHEN_created_THEN_native_value_is_zero(self):
            sensor = DatapointsManualCountSensor(
                _make_entry(), _make_store(auto_manual=(3, 0))
            )
            assert sensor._attr_native_value == 0

        def test_GIVEN_four_manual_events_WHEN_created_THEN_native_value_is_four(self):
            sensor = DatapointsManualCountSensor(
                _make_entry(), _make_store(auto_manual=(1, 4))
            )
            assert sensor._attr_native_value == 4

        def test_GIVEN_entry_id_WHEN_created_THEN_unique_id_correct(self):
            sensor = DatapointsManualCountSensor(_make_entry("eid"), _make_store())
            assert sensor._attr_unique_id == "eid_manual_count"

        def test_GIVEN_sensor_WHEN_name_read_THEN_returns_manually_recorded(self):
            sensor = DatapointsManualCountSensor(_make_entry(), _make_store())
            assert sensor._attr_name == "Manually recorded"

    class DescribeHandleStoreUpdate:
        def test_GIVEN_new_manual_event_WHEN_update_called_THEN_count_incremented(self):
            store = _make_store(auto_manual=(0, 2))
            sensor = DatapointsManualCountSensor(_make_entry(), store)
            store.get_automation_manual_counts.return_value = (0, 5)
            sensor._handle_store_update()
            assert sensor._attr_native_value == 5

        def test_GIVEN_store_update_WHEN_handle_called_THEN_ha_state_written(self):
            sensor = DatapointsManualCountSensor(_make_entry(), _make_store())
            sensor._handle_store_update()
            sensor.async_write_ha_state.assert_called_once()

    class DescribeAutomationManualConsistency:
        def test_GIVEN_mixed_events_WHEN_both_sensors_created_THEN_counts_reflect_store(
            self,
        ):
            store = _make_store(auto_manual=(3, 7))
            auto_sensor = DatapointsAutomationCountSensor(_make_entry(), store)
            manual_sensor = DatapointsManualCountSensor(_make_entry(), store)
            assert auto_sensor._attr_native_value == 3
            assert manual_sensor._attr_native_value == 7
