"""Tests for custom_components.hass_datapoints.websocket_api."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.websocket_api import (
    _normalize_recorder_timestamp,
    _require_admin,
    ws_clear_cache,
    ws_delete_dev_events,
    ws_delete_event,
    ws_get_events,
    ws_update_event,
)

# ---------------------------------------------------------------------------
# _normalize_recorder_timestamp — pure function
# ---------------------------------------------------------------------------


class DescribeNormalizeRecorderTimestamp:
    def test_GIVEN_none_WHEN_called_THEN_returns_none(self):
        assert _normalize_recorder_timestamp(None) is None

    def test_GIVEN_integer_unix_ts_WHEN_called_THEN_returns_iso_string(self):
        result = _normalize_recorder_timestamp(0)
        assert result is not None
        assert "1970-01-01" in result

    def test_GIVEN_float_unix_ts_WHEN_called_THEN_returns_iso_string_with_utc(self):
        result = _normalize_recorder_timestamp(1_700_000_000.0)
        assert result is not None
        assert "+00:00" in result

    def test_GIVEN_naive_iso_string_WHEN_called_THEN_adds_utc_offset(self):
        result = _normalize_recorder_timestamp("2024-06-15T10:30:00")
        assert result is not None
        assert "+00:00" in result

    def test_GIVEN_aware_iso_string_WHEN_called_THEN_preserves_it(self):
        result = _normalize_recorder_timestamp("2024-06-15T10:30:00+00:00")
        assert result is not None
        assert "2024-06-15" in result

    def test_GIVEN_invalid_string_WHEN_called_THEN_returns_none(self):
        assert _normalize_recorder_timestamp("not-a-date") is None

    def test_GIVEN_naive_datetime_WHEN_called_THEN_returns_utc_iso_string(self):
        dt = datetime(2024, 1, 1, 12, 0, 0)
        result = _normalize_recorder_timestamp(dt)
        assert result is not None
        assert "2024-01-01" in result
        assert "+00:00" in result

    def test_GIVEN_aware_datetime_WHEN_called_THEN_returns_iso_string(self):
        dt = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
        result = _normalize_recorder_timestamp(dt)
        assert result is not None
        assert "2024-01-01" in result

    def test_GIVEN_unsupported_type_WHEN_called_THEN_returns_none(self):
        assert _normalize_recorder_timestamp([1, 2, 3]) is None

    def test_GIVEN_integer_zero_WHEN_called_THEN_is_unix_epoch(self):
        result = _normalize_recorder_timestamp(0)
        assert result is not None
        parsed = datetime.fromisoformat(result)
        assert parsed.year == 1970


# ---------------------------------------------------------------------------
# ws_get_events
# ---------------------------------------------------------------------------


def _make_hass(store: object) -> MagicMock:
    hass = MagicMock()
    hass.data = {DOMAIN: {"store": store}}
    return hass


def _make_connection(*, is_admin: bool = True) -> MagicMock:
    """Return a mock ActiveConnection. Defaults to an admin user."""
    connection = MagicMock()
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    connection.user.is_admin = is_admin
    return connection


# ---------------------------------------------------------------------------
# _require_admin — unit tests for the guard helper itself
# ---------------------------------------------------------------------------


class DescribeRequireAdmin:
    def test_GIVEN_admin_user_WHEN_called_THEN_returns_true(self):
        connection = _make_connection(is_admin=True)
        assert _require_admin(connection, {}) is True

    def test_GIVEN_non_admin_user_WHEN_called_THEN_raises_unauthorized(self):
        connection = _make_connection(is_admin=False)
        with pytest.raises(Unauthorized):
            _require_admin(connection, {})


class DescribeWsGetEvents:
    async def test_GIVEN_no_filters_WHEN_called_THEN_sends_all_events(self):
        store = MagicMock()
        store.get_events.return_value = [{"id": "1"}, {"id": "2"}]
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {"id": 1, "type": f"{DOMAIN}/events"}

        await ws_get_events(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert len(result["events"]) == 2

    async def test_GIVEN_time_filters_WHEN_called_THEN_passes_filters_to_store(self):
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/events",
            "start_time": "2024-01-01T00:00:00+00:00",
            "end_time": "2024-12-31T00:00:00+00:00",
        }

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(
            start="2024-01-01T00:00:00+00:00",
            end="2024-12-31T00:00:00+00:00",
            entity_ids=None,
        )

    async def test_GIVEN_entity_filter_WHEN_called_THEN_passes_entity_ids_to_store(
        self,
    ):
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        connection = _make_connection()
        msg = {"id": 1, "type": f"{DOMAIN}/events", "entity_ids": ["sensor.a"]}

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(
            start=None,
            end=None,
            entity_ids=["sensor.a"],
        )


# ---------------------------------------------------------------------------
# ws_update_event
# ---------------------------------------------------------------------------


class DescribeWsUpdateEvent:
    async def test_GIVEN_existing_event_WHEN_updated_THEN_sends_updated_true(self):
        store = MagicMock()
        store.async_update_event = AsyncMock(
            return_value={"id": "abc", "message": "new"}
        )
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1, "event_id": "abc", "message": "new"}

        await ws_update_event(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["updated"] is True
        assert result["event"]["message"] == "new"

    async def test_GIVEN_nonexistent_event_WHEN_updated_THEN_sends_not_found_error(
        self,
    ):
        store = MagicMock()
        store.async_update_event = AsyncMock(return_value=None)
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1, "event_id": "ghost"}

        await ws_update_event(hass, connection, msg)

        connection.send_error.assert_called_once()
        args = connection.send_error.call_args[0]
        assert args[1] == "not_found"

    async def test_GIVEN_non_admin_user_WHEN_updated_THEN_raises_unauthorized(self):
        store = MagicMock()
        store.async_update_event = AsyncMock()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {"id": 1, "event_id": "abc", "message": "new"}

        with pytest.raises(Unauthorized):
            await ws_update_event(hass, connection, msg)

        store.async_update_event.assert_not_called()
        connection.send_result.assert_not_called()


# ---------------------------------------------------------------------------
# ws_delete_event
# ---------------------------------------------------------------------------


class DescribeWsDeleteEvent:
    async def test_GIVEN_existing_event_WHEN_deleted_THEN_sends_deleted_true(self):
        store = MagicMock()
        store.async_delete_event = AsyncMock(return_value=True)
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1, "event_id": "abc"}

        await ws_delete_event(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["deleted"] is True

    async def test_GIVEN_nonexistent_event_WHEN_deleted_THEN_sends_deleted_false(self):
        store = MagicMock()
        store.async_delete_event = AsyncMock(return_value=False)
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1, "event_id": "ghost"}

        await ws_delete_event(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["deleted"] is False

    async def test_GIVEN_non_admin_user_WHEN_deleted_THEN_raises_unauthorized(self):
        store = MagicMock()
        store.async_delete_event = AsyncMock()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {"id": 1, "event_id": "abc"}

        with pytest.raises(Unauthorized):
            await ws_delete_event(hass, connection, msg)

        store.async_delete_event.assert_not_called()
        connection.send_result.assert_not_called()


# ---------------------------------------------------------------------------
# ws_delete_dev_events
# ---------------------------------------------------------------------------


class DescribeWsDeleteDevEvents:
    async def test_GIVEN_dev_events_exist_WHEN_called_THEN_sends_count_deleted(self):
        store = MagicMock()
        store.async_delete_dev_events = AsyncMock(return_value=3)
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1}

        await ws_delete_dev_events(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["deleted"] == 3

    async def test_GIVEN_no_dev_events_WHEN_called_THEN_sends_zero(self):
        store = MagicMock()
        store.async_delete_dev_events = AsyncMock(return_value=0)
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {"id": 1}

        await ws_delete_dev_events(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["deleted"] == 0

    async def test_GIVEN_non_admin_user_WHEN_called_THEN_raises_unauthorized(self):
        store = MagicMock()
        store.async_delete_dev_events = AsyncMock()
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False)
        msg = {"id": 1}

        with pytest.raises(Unauthorized):
            await ws_delete_dev_events(hass, connection, msg)

        store.async_delete_dev_events.assert_not_called()
        connection.send_result.assert_not_called()


# ---------------------------------------------------------------------------
# ws_clear_cache
# ---------------------------------------------------------------------------


class DescribeWsClearCache:
    async def test_GIVEN_no_cache_in_hass_data_WHEN_called_THEN_sends_cleared_zero(
        self,
    ):
        hass = MagicMock()
        hass.data = {DOMAIN: {}}  # no anomaly_cache key
        connection = _make_connection()
        msg = {"id": 1}

        await ws_clear_cache(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["cleared"] == 0

    async def test_GIVEN_cache_present_and_no_entity_id_WHEN_called_THEN_clears_all(
        self,
    ):
        cache = MagicMock()
        cache.clear_all = MagicMock(return_value=5)
        hass = MagicMock()
        hass.data = {DOMAIN: {"anomaly_cache": cache}}
        hass.async_add_executor_job = AsyncMock(side_effect=lambda fn, *args: fn(*args))
        connection = _make_connection()
        msg = {"id": 1}

        await ws_clear_cache(hass, connection, msg)

        cache.clear_all.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["cleared"] == 5

    async def test_GIVEN_cache_present_and_entity_id_provided_WHEN_called_THEN_clears_entity(
        self,
    ):
        cache = MagicMock()
        cache.clear_entity = MagicMock(return_value=2)
        hass = MagicMock()
        hass.data = {DOMAIN: {"anomaly_cache": cache}}
        hass.async_add_executor_job = AsyncMock(side_effect=lambda fn, *args: fn(*args))
        connection = _make_connection()
        msg = {"id": 1, "entity_id": "sensor.temp"}

        await ws_clear_cache(hass, connection, msg)

        cache.clear_entity.assert_called_once_with("sensor.temp")
        result = connection.send_result.call_args[0][1]
        assert result["cleared"] == 2
