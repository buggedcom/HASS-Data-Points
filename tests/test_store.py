"""Tests for custom_components.hass_datapoints.store."""

from __future__ import annotations

import pytest

# ---------------------------------------------------------------------------
# async_load
# ---------------------------------------------------------------------------


class DescribeAsyncLoad:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_no_persisted_data_WHEN_loaded_THEN_initialises_with_empty_events(
        self,
    ):
        self.store._store.async_load.return_value = None
        await self.store.async_load()
        assert self.store.get_events() == []
        assert "monitors" in self.store._data

    async def test_GIVEN_existing_persisted_events_WHEN_loaded_THEN_data_contains_those_events(
        self,
    ):
        existing = {
            "id": "abc",
            "timestamp": "2024-01-01T00:00:00+00:00",
            "message": "hello",
            "annotation": "hello",
            "entity_ids": ["sensor.a"],
            "device_ids": [],
            "area_ids": [],
            "label_ids": [],
            "icon": "mdi:bookmark",
            "color": "#03a9f4",
            "dev": False,
            "automation_id": None,
        }
        self.store._store.async_load.return_value = {"events": [existing]}
        await self.store.async_load()
        events = self.store.get_events()
        assert len(events) == 1
        assert events[0]["id"] == "abc"

    async def test_GIVEN_legacy_event_with_singular_entity_id_WHEN_loaded_THEN_migrates_to_entity_ids_list(
        self,
    ):
        old_event = {
            "id": "x",
            "timestamp": "2024-01-01T00:00:00",
            "entity_id": "sensor.old",
        }
        self.store._store.async_load.return_value = {"events": [old_event]}
        await self.store.async_load()
        events = self.store.get_events()
        assert len(events) == 1
        assert events[0]["entity_ids"] == ["sensor.old"]
        assert "entity_id" not in events[0]

    async def test_GIVEN_event_missing_dev_flag_WHEN_loaded_THEN_dev_defaults_to_false(
        self,
    ):
        event = {"id": "y", "timestamp": "2024-01-01T00:00:00", "entity_ids": []}
        self.store._store.async_load.return_value = {"events": [event]}
        await self.store.async_load()
        assert self.store.get_events()[0]["dev"] is False

    async def test_GIVEN_event_missing_automation_id_WHEN_loaded_THEN_automation_id_defaults_to_none(
        self,
    ):
        event = {"id": "z", "timestamp": "2024-01-01T00:00:00", "entity_ids": []}
        self.store._store.async_load.return_value = {"events": [event]}
        await self.store.async_load()
        assert self.store.get_events()[0]["automation_id"] is None

    async def test_GIVEN_event_missing_target_id_fields_WHEN_loaded_THEN_all_default_to_empty_lists(
        self,
    ):
        event = {"id": "w", "timestamp": "2024-01-01T00:00:00", "entity_ids": []}
        self.store._store.async_load.return_value = {"events": [event]}
        await self.store.async_load()
        ev = self.store.get_events()[0]
        assert ev["device_ids"] == []
        assert ev["area_ids"] == []
        assert ev["label_ids"] == []


# ---------------------------------------------------------------------------
# async_record
# ---------------------------------------------------------------------------


class DescribeAsyncRecord:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_message_and_entity_ids_WHEN_recorded_THEN_returns_event_with_correct_fields(
        self,
    ):
        event = await self.store.async_record("Test event", entity_ids=["sensor.a"])
        assert event["message"] == "Test event"
        assert event["entity_ids"] == ["sensor.a"]
        assert event["icon"] == "mdi:bookmark"
        assert event["color"] == "#03a9f4"
        assert event["dev"] is False

    async def test_GIVEN_two_records_WHEN_created_THEN_each_gets_a_unique_id(self):
        ev1 = await self.store.async_record("first")
        ev2 = await self.store.async_record("second")
        assert ev1["id"] != ev2["id"]

    async def test_GIVEN_no_explicit_annotation_WHEN_recorded_THEN_annotation_defaults_to_message(
        self,
    ):
        event = await self.store.async_record("my message")
        assert event["annotation"] == "my message"

    async def test_GIVEN_explicit_annotation_WHEN_recorded_THEN_annotation_is_used(
        self,
    ):
        event = await self.store.async_record("msg", annotation="custom note")
        assert event["annotation"] == "custom note"

    async def test_GIVEN_iso_date_string_WHEN_recorded_THEN_timestamp_contains_that_date(
        self,
    ):
        event = await self.store.async_record("dated", date="2024-06-15T10:30:00")
        assert "2024-06-15" in event["timestamp"]

    async def test_GIVEN_naive_date_string_WHEN_recorded_THEN_utc_offset_is_added(self):
        event = await self.store.async_record("naive date", date="2024-06-15T10:30:00")
        assert "+00:00" in event["timestamp"]

    async def test_GIVEN_new_event_WHEN_recorded_THEN_event_is_retrievable(self):
        await self.store.async_record("save me")
        assert len(self.store.get_events()) == 1
        assert self.store.get_events()[0]["message"] == "save me"

    async def test_GIVEN_no_optional_fields_WHEN_recorded_THEN_optional_fields_default_to_empty(
        self,
    ):
        event = await self.store.async_record("minimal")
        assert event["device_ids"] == []
        assert event["area_ids"] == []
        assert event["label_ids"] == []
        assert event["automation_id"] is None


# ---------------------------------------------------------------------------
# get_events – time range filtering
# ---------------------------------------------------------------------------


class DescribeGetEventsByTimeRange:
    @pytest.fixture(autouse=True)
    async def setup(self, mock_store):
        self.store = mock_store
        await self.store.async_record("early", date="2024-01-01T00:00:00+00:00")
        await self.store.async_record("mid", date="2024-06-01T00:00:00+00:00")
        await self.store.async_record("late", date="2024-12-31T00:00:00+00:00")

    def test_GIVEN_three_events_WHEN_no_filter_applied_THEN_returns_all_three(self):
        assert len(self.store.get_events()) == 3

    def test_GIVEN_start_filter_from_mid_year_WHEN_applied_THEN_excludes_early_event(
        self,
    ):
        messages = [
            e["message"]
            for e in self.store.get_events(start="2024-06-01T00:00:00+00:00")
        ]
        assert "early" not in messages
        assert "mid" in messages
        assert "late" in messages

    def test_GIVEN_end_filter_at_mid_year_WHEN_applied_THEN_excludes_late_event(self):
        messages = [
            e["message"] for e in self.store.get_events(end="2024-06-01T00:00:00+00:00")
        ]
        assert "early" in messages
        assert "mid" in messages
        assert "late" not in messages


# ---------------------------------------------------------------------------
# get_events – entity filtering
# ---------------------------------------------------------------------------


class DescribeGetEventsByEntity:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_entity_tagged_and_global_events_WHEN_filter_by_entity_THEN_includes_both(
        self,
    ):
        await self.store.async_record("tagged", entity_ids=["sensor.a"])
        await self.store.async_record("global")
        messages = [
            e["message"] for e in self.store.get_events(entity_ids=["sensor.a"])
        ]
        assert "tagged" in messages
        assert "global" in messages

    async def test_GIVEN_event_tagged_to_other_entity_WHEN_filter_by_entity_THEN_excludes_it(
        self,
    ):
        await self.store.async_record("tagged_b", entity_ids=["sensor.b"])
        messages = [
            e["message"] for e in self.store.get_events(entity_ids=["sensor.a"])
        ]
        assert "tagged_b" not in messages

    async def test_GIVEN_event_tagged_to_two_entities_WHEN_both_in_filter_THEN_appears_only_once(
        self,
    ):
        await self.store.async_record("both", entity_ids=["sensor.a", "sensor.b"])
        events = self.store.get_events(entity_ids=["sensor.a", "sensor.b"])
        assert len([e for e in events if e["message"] == "both"]) == 1


# ---------------------------------------------------------------------------
# get_event_bounds
# ---------------------------------------------------------------------------


class DescribeGetEventBounds:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_empty_store_WHEN_called_THEN_returns_none_none(self):
        earliest, latest = self.store.get_event_bounds()
        assert earliest is None
        assert latest is None

    async def test_GIVEN_single_event_WHEN_called_THEN_returns_same_timestamp_for_both_bounds(
        self,
    ):
        await self.store.async_record("only", date="2024-07-04T12:00:00+00:00")
        earliest, latest = self.store.get_event_bounds()
        assert earliest == latest
        assert "2024-07-04" in earliest

    async def test_GIVEN_three_events_across_the_year_WHEN_called_THEN_returns_first_and_last_timestamps(
        self,
    ):
        await self.store.async_record("a", date="2024-01-01T00:00:00+00:00")
        await self.store.async_record("b", date="2024-06-15T00:00:00+00:00")
        await self.store.async_record("c", date="2024-12-31T00:00:00+00:00")
        earliest, latest = self.store.get_event_bounds()
        assert "2024-01-01" in earliest
        assert "2024-12-31" in latest


# ---------------------------------------------------------------------------
# async_update_event
# ---------------------------------------------------------------------------


class DescribeAsyncUpdateEvent:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_existing_event_WHEN_message_updated_THEN_returns_updated_event(
        self,
    ):
        event = await self.store.async_record("original message")
        updated = await self.store.async_update_event(
            event["id"], message="new message"
        )
        assert updated is not None
        assert updated["message"] == "new message"

    async def test_GIVEN_existing_event_WHEN_only_annotation_updated_THEN_other_fields_unchanged(
        self,
    ):
        event = await self.store.async_record("msg", icon="mdi:star")
        updated = await self.store.async_update_event(
            event["id"], annotation="new note"
        )
        assert updated["icon"] == "mdi:star"
        assert updated["annotation"] == "new note"

    async def test_GIVEN_nonexistent_id_WHEN_update_called_THEN_returns_none(self):
        assert (
            await self.store.async_update_event("nonexistent-id", message="x") is None
        )


# ---------------------------------------------------------------------------
# async_delete_event
# ---------------------------------------------------------------------------


class DescribeAsyncDeleteEvent:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_existing_event_WHEN_deleted_THEN_returns_true_and_removes_event(
        self,
    ):
        event = await self.store.async_record("to delete")
        assert await self.store.async_delete_event(event["id"]) is True
        assert self.store.get_events() == []

    async def test_GIVEN_nonexistent_id_WHEN_delete_called_THEN_returns_false(self):
        assert await self.store.async_delete_event("ghost-id") is False


# ---------------------------------------------------------------------------
# async_delete_dev_events
# ---------------------------------------------------------------------------


class DescribeAsyncDeleteDevEvents:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_mix_of_dev_and_real_events_WHEN_called_THEN_removes_only_dev_events(
        self,
    ):
        await self.store.async_record("dev event", dev=True)
        await self.store.async_record("real event", dev=False)
        count = await self.store.async_delete_dev_events()
        assert count == 1
        remaining = self.store.get_events()
        assert len(remaining) == 1
        assert remaining[0]["message"] == "real event"

    async def test_GIVEN_no_dev_events_WHEN_called_THEN_returns_zero(self):
        await self.store.async_record("real")
        assert await self.store.async_delete_dev_events() == 0

    async def test_GIVEN_three_dev_events_WHEN_called_THEN_removes_all_and_returns_count_3(
        self,
    ):
        for i in range(3):
            await self.store.async_record(f"dev {i}", dev=True)
        assert await self.store.async_delete_dev_events() == 3
        assert self.store.get_events() == []


# ---------------------------------------------------------------------------
# get_last_event
# ---------------------------------------------------------------------------


class DescribeGetLastEvent:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_no_events_WHEN_called_THEN_returns_none(self):
        assert self.store.get_last_event() is None

    async def test_GIVEN_one_event_WHEN_called_THEN_returns_that_event(self):
        await self.store.async_record("only", date="2024-06-01T12:00:00+00:00")
        result = self.store.get_last_event()
        assert result is not None
        assert result["message"] == "only"

    async def test_GIVEN_multiple_events_WHEN_called_THEN_returns_most_recent_by_timestamp(
        self,
    ):
        await self.store.async_record("early", date="2024-01-01T00:00:00+00:00")
        await self.store.async_record("middle", date="2024-06-01T00:00:00+00:00")
        await self.store.async_record("latest", date="2024-12-31T23:59:59+00:00")
        result = self.store.get_last_event()
        assert result is not None
        assert result["message"] == "latest"

    async def test_GIVEN_events_inserted_out_of_order_WHEN_called_THEN_returns_highest_timestamp(
        self,
    ):
        await self.store.async_record("later", date="2024-09-01T00:00:00+00:00")
        await self.store.async_record("earlier", date="2024-01-01T00:00:00+00:00")
        result = self.store.get_last_event()
        assert result is not None
        assert result["message"] == "later"


# ---------------------------------------------------------------------------
# get_events_count_in_range
# ---------------------------------------------------------------------------


class DescribeGetEventsCountInRange:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_no_events_WHEN_called_THEN_returns_zero(self):
        assert (
            self.store.get_events_count_in_range(start="2024-01-01T00:00:00+00:00") == 0
        )

    async def test_GIVEN_events_all_in_range_WHEN_called_THEN_returns_full_count(self):
        await self.store.async_record("a", date="2024-06-01T00:00:00+00:00")
        await self.store.async_record("b", date="2024-06-02T00:00:00+00:00")
        count = self.store.get_events_count_in_range(start="2024-05-01T00:00:00+00:00")
        assert count == 2

    async def test_GIVEN_some_events_before_start_WHEN_called_THEN_excludes_earlier_events(
        self,
    ):
        await self.store.async_record("before", date="2024-01-01T00:00:00+00:00")
        await self.store.async_record("after", date="2024-06-01T00:00:00+00:00")
        count = self.store.get_events_count_in_range(start="2024-03-01T00:00:00+00:00")
        assert count == 1

    async def test_GIVEN_start_and_end_provided_WHEN_called_THEN_counts_only_events_in_window(
        self,
    ):
        await self.store.async_record("jan", date="2024-01-15T00:00:00+00:00")
        await self.store.async_record("jun", date="2024-06-15T00:00:00+00:00")
        await self.store.async_record("dec", date="2024-12-15T00:00:00+00:00")
        count = self.store.get_events_count_in_range(
            start="2024-03-01T00:00:00+00:00",
            end="2024-09-01T00:00:00+00:00",
        )
        assert count == 1


# ---------------------------------------------------------------------------
# get_automation_manual_counts
# ---------------------------------------------------------------------------


class DescribeGetAutomationManualCounts:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_no_events_WHEN_called_THEN_returns_zero_zero(self):
        assert self.store.get_automation_manual_counts() == (0, 0)

    async def test_GIVEN_only_manual_events_WHEN_called_THEN_automation_count_is_zero(
        self,
    ):
        await self.store.async_record("manual a")
        await self.store.async_record("manual b")
        automation, manual = self.store.get_automation_manual_counts()
        assert automation == 0
        assert manual == 2

    async def test_GIVEN_only_automation_events_WHEN_called_THEN_manual_count_is_zero(
        self,
    ):
        await self.store.async_record("auto a", automation_id="auto.1")
        await self.store.async_record("auto b", automation_id="auto.2")
        automation, manual = self.store.get_automation_manual_counts()
        assert automation == 2
        assert manual == 0

    async def test_GIVEN_mix_of_automation_and_manual_WHEN_called_THEN_returns_correct_split(
        self,
    ):
        await self.store.async_record("auto", automation_id="auto.1")
        await self.store.async_record("manual a")
        await self.store.async_record("manual b")
        automation, manual = self.store.get_automation_manual_counts()
        assert automation == 1
        assert manual == 2

    async def test_GIVEN_automation_count_plus_manual_WHEN_called_THEN_sums_to_total(
        self,
    ):
        for i in range(4):
            await self.store.async_record(f"m{i}")
        for i in range(3):
            await self.store.async_record(f"a{i}", automation_id=f"auto.{i}")
        automation, manual = self.store.get_automation_manual_counts()
        assert automation + manual == self.store.get_event_count()


# ---------------------------------------------------------------------------
# Migration from JSON store to SQLite
# ---------------------------------------------------------------------------


class DescribeMigration:
    @pytest.fixture(autouse=True)
    def setup(self, mock_store):
        self.store = mock_store

    async def test_GIVEN_json_events_in_store_WHEN_loaded_THEN_events_accessible_via_get_events(
        self,
    ):
        legacy = {
            "id": "migrated-1",
            "timestamp": "2023-06-01T12:00:00+00:00",
            "message": "legacy event",
            "annotation": "legacy event",
            "entity_ids": ["sensor.x"],
            "device_ids": [],
            "area_ids": [],
            "label_ids": [],
            "icon": "mdi:bookmark",
            "color": "#03a9f4",
            "dev": False,
            "automation_id": None,
        }
        self.store._store.async_load.return_value = {"events": [legacy]}
        await self.store.async_load()
        events = self.store.get_events()
        assert len(events) == 1
        assert events[0]["id"] == "migrated-1"
        assert events[0]["message"] == "legacy event"
        assert events[0]["entity_ids"] == ["sensor.x"]

    async def test_GIVEN_json_events_in_store_WHEN_loaded_THEN_events_key_removed_from_json_store(
        self,
    ):
        legacy = {
            "id": "migrated-2",
            "timestamp": "2023-01-01T00:00:00+00:00",
            "message": "to migrate",
            "entity_ids": [],
        }
        self.store._store.async_load.return_value = {"events": [legacy]}
        await self.store.async_load()
        # JSON store should have been re-saved without the events key
        self.store._store.async_save.assert_called_once()
        saved_data = self.store._store.async_save.call_args[0][0]
        assert "events" not in saved_data

    async def test_GIVEN_migration_already_run_WHEN_loaded_again_THEN_events_not_duplicated(
        self,
    ):
        legacy = {
            "id": "migrated-3",
            "timestamp": "2023-03-01T00:00:00+00:00",
            "message": "dedup check",
            "entity_ids": [],
        }
        # First load — migrates the event
        self.store._store.async_load.return_value = {"events": [legacy]}
        await self.store.async_load()
        assert self.store.get_event_count() == 1

        # Second load — JSON store no longer has events (simulates post-migration state)
        self.store._store.async_load.return_value = {}
        await self.store.async_load()
        # Event count must still be 1, not 2
        assert self.store.get_event_count() == 1
