"""Tests for custom_components.hass_datapoints.websocket_api."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
import voluptuous as vol
from homeassistant.exceptions import Unauthorized

from custom_components.hass_datapoints.const import DOMAIN
from custom_components.hass_datapoints.websocket_api import (
    _MAX_LEN_COLOR,
    _MAX_LEN_ICON,
    _MAX_LEN_MESSAGE,
    _MAX_LEN_WINDOW,
    _RE_DURATION,
    _RE_HEX_COLOR,
    _RE_MDI_ICON,
    _VALID_ANOMALY_METHODS,
    _VALID_ANOMALY_OVERLAP_MODES,
    _VALID_ANOMALY_SENSITIVITY,
    _VALID_TREND_METHODS,
    _can_read_entity,
    _normalize_recorder_timestamp,
    _require_admin,
    ws_clear_cache,
    ws_delete_dev_events,
    ws_delete_event,
    ws_get_anomalies,
    ws_get_events,
    ws_get_history,
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


def _make_connection(
    *,
    is_admin: bool = True,
    allowed_entities: list[str] | None = None,
) -> MagicMock:
    """Return a mock ActiveConnection.

    *allowed_entities* is only relevant for non-admin users.  When provided,
    ``user.permissions.check_entity`` returns True only for listed entity IDs.
    When omitted for a non-admin user, all entity checks return False (no access).
    """
    connection = MagicMock()
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    connection.user.is_admin = is_admin
    if not is_admin:
        allowed = set(allowed_entities or [])
        connection.user.permissions.check_entity.side_effect = (
            lambda entity_id, _policy: entity_id in allowed
        )
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

    async def test_GIVEN_non_admin_user_WHEN_called_THEN_raises_unauthorized(self):
        cache = MagicMock()
        hass = MagicMock()
        hass.data = {DOMAIN: {"anomaly_cache": cache}}
        connection = _make_connection(is_admin=False)
        msg = {"id": 1}

        with pytest.raises(Unauthorized):
            await ws_clear_cache(hass, connection, msg)

        cache.clear_all.assert_not_called()
        connection.send_result.assert_not_called()


# ---------------------------------------------------------------------------
# Validation constants — unit tests for regex patterns and allowed values
# ---------------------------------------------------------------------------


class DescribeValidationConstants:
    # --- _RE_MDI_ICON ---

    def test_GIVEN_valid_mdi_icon_WHEN_matched_THEN_passes(self):
        validator = vol.Match(_RE_MDI_ICON)
        assert validator("mdi:home") == "mdi:home"
        assert validator("mdi:thermometer-lines") == "mdi:thermometer-lines"
        assert validator("mdi:ab1") == "mdi:ab1"

    def test_GIVEN_invalid_icon_WHEN_matched_THEN_raises(self):
        validator = vol.Match(_RE_MDI_ICON)
        with pytest.raises(vol.Invalid):
            validator("home")
        with pytest.raises(vol.Invalid):
            validator("fa:home")
        with pytest.raises(vol.Invalid):
            validator("mdi:")
        with pytest.raises(vol.Invalid):
            validator("mdi:Home")  # uppercase not allowed

    def test_GIVEN_icon_exceeds_max_len_WHEN_validated_THEN_raises(self):
        validator = vol.Length(max=_MAX_LEN_ICON)
        with pytest.raises(vol.Invalid):
            validator("x" * (_MAX_LEN_ICON + 1))

    # --- _RE_HEX_COLOR ---

    def test_GIVEN_valid_hex_colors_WHEN_matched_THEN_passes(self):
        validator = vol.Match(_RE_HEX_COLOR)
        assert validator("#fff") == "#fff"
        assert validator("#FF0000") == "#FF0000"
        assert validator("#aabbccdd") == "#aabbccdd"

    def test_GIVEN_invalid_hex_color_WHEN_matched_THEN_raises(self):
        validator = vol.Match(_RE_HEX_COLOR)
        with pytest.raises(vol.Invalid):
            validator("red")
        with pytest.raises(vol.Invalid):
            validator("ff0000")  # missing #
        with pytest.raises(vol.Invalid):
            validator("#gg0000")  # invalid hex chars

    def test_GIVEN_color_exceeds_max_len_WHEN_validated_THEN_raises(self):
        validator = vol.Length(max=_MAX_LEN_COLOR)
        with pytest.raises(vol.Invalid):
            validator("#" + "0" * _MAX_LEN_COLOR)

    # --- _RE_DURATION ---

    def test_GIVEN_valid_duration_strings_WHEN_matched_THEN_passes(self):
        validator = vol.Match(_RE_DURATION)
        for value in ["1s", "30m", "24h", "7d", "100s"]:
            assert validator(value) == value

    def test_GIVEN_invalid_duration_WHEN_matched_THEN_raises(self):
        validator = vol.Match(_RE_DURATION)
        with pytest.raises(vol.Invalid):
            validator("1hour")
        with pytest.raises(vol.Invalid):
            validator("h")
        with pytest.raises(vol.Invalid):
            validator("1H")  # uppercase not allowed
        with pytest.raises(vol.Invalid):
            validator("")

    def test_GIVEN_window_exceeds_max_len_WHEN_validated_THEN_raises(self):
        validator = vol.Length(max=_MAX_LEN_WINDOW)
        with pytest.raises(vol.Invalid):
            validator("1" * (_MAX_LEN_WINDOW + 1) + "h")

    # --- _VALID_ANOMALY_SENSITIVITY ---

    def test_GIVEN_valid_sensitivity_WHEN_checked_THEN_passes(self):
        validator = vol.In(_VALID_ANOMALY_SENSITIVITY)
        for value in ["low", "medium", "high"]:
            assert validator(value) == value

    def test_GIVEN_invalid_sensitivity_WHEN_checked_THEN_raises(self):
        validator = vol.In(_VALID_ANOMALY_SENSITIVITY)
        with pytest.raises(vol.Invalid):
            validator("extreme")

    # --- _VALID_ANOMALY_OVERLAP_MODES ---

    def test_GIVEN_valid_overlap_mode_WHEN_checked_THEN_passes(self):
        validator = vol.In(_VALID_ANOMALY_OVERLAP_MODES)
        for value in ["all", "highlight", "only"]:
            assert validator(value) == value

    def test_GIVEN_invalid_overlap_mode_WHEN_checked_THEN_raises(self):
        validator = vol.In(_VALID_ANOMALY_OVERLAP_MODES)
        with pytest.raises(vol.Invalid):
            validator("none")

    # --- _VALID_TREND_METHODS ---

    def test_GIVEN_valid_trend_method_WHEN_checked_THEN_passes(self):
        validator = vol.In(_VALID_TREND_METHODS)
        for value in ["rolling_average", "linear_trend"]:
            assert validator(value) == value

    def test_GIVEN_invalid_trend_method_WHEN_checked_THEN_raises(self):
        validator = vol.In(_VALID_TREND_METHODS)
        with pytest.raises(vol.Invalid):
            validator("polynomial")

    # --- _VALID_ANOMALY_METHODS list ---

    def test_GIVEN_valid_anomaly_methods_WHEN_checked_THEN_all_pass(self):
        for method in _VALID_ANOMALY_METHODS:
            assert vol.In(_VALID_ANOMALY_METHODS)(method) == method

    def test_GIVEN_invalid_anomaly_method_in_list_WHEN_validated_THEN_raises(self):
        schema = vol.All([vol.In(_VALID_ANOMALY_METHODS)], vol.Length(min=1))
        with pytest.raises(vol.Invalid):
            schema(["not_a_method"])

    def test_GIVEN_empty_anomaly_methods_list_WHEN_validated_THEN_raises(self):
        schema = vol.All([vol.In(_VALID_ANOMALY_METHODS)], vol.Length(min=1))
        with pytest.raises(vol.Invalid):
            schema([])

    # --- comparison_time_offset_ms range ---

    def test_GIVEN_offset_within_range_WHEN_validated_THEN_passes(self):
        validator = vol.Range(min=-315_576_000_000, max=315_576_000_000)
        assert validator(0) == 0
        assert validator(-315_576_000_000) == -315_576_000_000
        assert validator(315_576_000_000) == 315_576_000_000

    def test_GIVEN_offset_outside_range_WHEN_validated_THEN_raises(self):
        validator = vol.Range(min=-315_576_000_000, max=315_576_000_000)
        with pytest.raises(vol.Invalid):
            validator(315_576_000_001)
        with pytest.raises(vol.Invalid):
            validator(-315_576_000_001)

    # --- message / annotation length cap ---

    def test_GIVEN_message_within_limit_WHEN_validated_THEN_passes(self):
        validator = vol.Length(max=_MAX_LEN_MESSAGE)
        assert validator("hello") == "hello"
        assert validator("x" * _MAX_LEN_MESSAGE) == "x" * _MAX_LEN_MESSAGE

    def test_GIVEN_message_exceeds_limit_WHEN_validated_THEN_raises(self):
        validator = vol.Length(max=_MAX_LEN_MESSAGE)
        with pytest.raises(vol.Invalid):
            validator("x" * (_MAX_LEN_MESSAGE + 1))


# ---------------------------------------------------------------------------
# _can_read_entity — unit tests for the permission helper
# ---------------------------------------------------------------------------


class DescribeCanReadEntity:
    def test_GIVEN_admin_user_WHEN_called_THEN_returns_true_for_any_entity(self):
        user = MagicMock()
        user.is_admin = True
        assert _can_read_entity(user, "sensor.secret") is True

    def test_GIVEN_non_admin_with_permission_WHEN_called_THEN_returns_true(self):
        user = MagicMock()
        user.is_admin = False
        user.permissions.check_entity.return_value = True
        assert _can_read_entity(user, "sensor.allowed") is True

    def test_GIVEN_non_admin_without_permission_WHEN_called_THEN_returns_false(self):
        user = MagicMock()
        user.is_admin = False
        user.permissions.check_entity.return_value = False
        assert _can_read_entity(user, "sensor.forbidden") is False

    def test_GIVEN_permissions_raises_WHEN_called_THEN_returns_true_permissive(self):
        """Unexpected permission errors should not block the caller."""
        user = MagicMock()
        user.is_admin = False
        user.permissions.check_entity.side_effect = RuntimeError("boom")
        assert _can_read_entity(user, "sensor.any") is True


# ---------------------------------------------------------------------------
# ws_get_events — entity permission filtering
# ---------------------------------------------------------------------------


class DescribeWsGetEventsPermissions:
    async def test_GIVEN_admin_user_with_entity_filter_WHEN_called_THEN_passes_filter_unchanged(
        self,
    ):
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        connection = _make_connection(is_admin=True)
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/events",
            "entity_ids": ["sensor.a", "sensor.b"],
        }

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(
            start=None, end=None, entity_ids=["sensor.a", "sensor.b"]
        )

    async def test_GIVEN_non_admin_user_WHEN_entity_ids_include_forbidden_THEN_forbidden_stripped(
        self,
    ):
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        # sensor.a is allowed, sensor.secret is not
        connection = _make_connection(is_admin=False, allowed_entities=["sensor.a"])
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/events",
            "entity_ids": ["sensor.a", "sensor.secret"],
        }

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(
            start=None, end=None, entity_ids=["sensor.a"]
        )

    async def test_GIVEN_non_admin_user_WHEN_all_entity_ids_forbidden_THEN_empty_filter_passed(
        self,
    ):
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False, allowed_entities=[])
        msg = {
            "id": 1,
            "type": f"{DOMAIN}/events",
            "entity_ids": ["sensor.secret"],
        }

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(start=None, end=None, entity_ids=[])

    async def test_GIVEN_non_admin_user_WHEN_no_entity_filter_THEN_store_called_with_none(
        self,
    ):
        """No entity_ids in message → pass None to store (no filtering applied)."""
        store = MagicMock()
        store.get_events.return_value = []
        hass = _make_hass(store)
        connection = _make_connection(is_admin=False, allowed_entities=[])
        msg = {"id": 1, "type": f"{DOMAIN}/events"}

        await ws_get_events(hass, connection, msg)

        store.get_events.assert_called_once_with(start=None, end=None, entity_ids=None)


# ---------------------------------------------------------------------------
# ws_get_history — entity permission check
# ---------------------------------------------------------------------------


def _make_hass_for_history() -> MagicMock:
    """hass mock whose recorder instance has an awaitable async_add_executor_job."""
    import custom_components.hass_datapoints.websocket_api as ws_mod  # noqa: PLC0415

    hass = MagicMock()
    hass.data = {DOMAIN: {}}
    recorder_instance = MagicMock()
    recorder_instance.async_add_executor_job = AsyncMock(return_value=[])
    # get_instance is imported at module level; patch it on the module object.
    ws_mod.get_instance = MagicMock(return_value=recorder_instance)
    return hass


class DescribeWsGetHistoryPermissions:
    async def test_GIVEN_admin_user_WHEN_entity_requested_THEN_proceeds(self):
        hass = _make_hass_for_history()
        connection = _make_connection(is_admin=True)
        msg = {
            "id": 1,
            "entity_id": "sensor.secret",
            "start_time": "2024-01-01T00:00:00+00:00",
            "end_time": "2024-01-02T00:00:00+00:00",
            "interval": "raw",
            "aggregate": "mean",
        }

        await ws_get_history(hass, connection, msg)

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()

    async def test_GIVEN_non_admin_user_with_permission_WHEN_called_THEN_proceeds(self):
        hass = _make_hass_for_history()
        connection = _make_connection(
            is_admin=False, allowed_entities=["sensor.allowed"]
        )
        msg = {
            "id": 1,
            "entity_id": "sensor.allowed",
            "start_time": "2024-01-01T00:00:00+00:00",
            "end_time": "2024-01-02T00:00:00+00:00",
            "interval": "raw",
            "aggregate": "mean",
        }

        await ws_get_history(hass, connection, msg)

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()

    async def test_GIVEN_non_admin_user_without_permission_WHEN_called_THEN_sends_unauthorized(
        self,
    ):
        hass = _make_hass_for_history()
        connection = _make_connection(is_admin=False, allowed_entities=[])
        msg = {
            "id": 1,
            "entity_id": "sensor.secret",
            "start_time": "2024-01-01T00:00:00+00:00",
            "end_time": "2024-01-02T00:00:00+00:00",
            "interval": "raw",
            "aggregate": "mean",
        }

        await ws_get_history(hass, connection, msg)

        connection.send_result.assert_not_called()
        connection.send_error.assert_called_once()
        error_code = connection.send_error.call_args[0][1]
        assert error_code == "unauthorized"


# ---------------------------------------------------------------------------
# ws_get_anomalies — entity permission check
# ---------------------------------------------------------------------------


def _make_hass_for_anomalies() -> MagicMock:
    """hass mock suitable for ws_get_anomalies (cache absent, executor returns [])."""
    import custom_components.hass_datapoints.websocket_api as ws_mod  # noqa: PLC0415

    hass = MagicMock()
    hass.data = {DOMAIN: {}}  # no anomaly_cache
    recorder_instance = MagicMock()
    recorder_instance.async_add_executor_job = AsyncMock(return_value=[])
    ws_mod.get_instance = MagicMock(return_value=recorder_instance)
    hass.async_add_executor_job = AsyncMock(return_value=[])
    return hass


def _anomaly_msg(entity_id: str, comparison_entity_id: str | None = None) -> dict:
    msg = {
        "id": 1,
        "entity_id": entity_id,
        "start_time": "2024-01-01T00:00:00+00:00",
        "end_time": "2024-01-02T00:00:00+00:00",
        "anomaly_methods": ["iqr"],
        "anomaly_sensitivity": "medium",
        "anomaly_overlap_mode": "all",
        "anomaly_rate_window": "1h",
        "anomaly_zscore_window": "24h",
        "anomaly_persistence_window": "1h",
        "trend_method": "rolling_average",
        "trend_window": "24h",
        "comparison_time_offset_ms": 0,
    }
    if comparison_entity_id:
        msg["comparison_entity_id"] = comparison_entity_id
        msg["comparison_start_time"] = "2024-01-01T00:00:00+00:00"
        msg["comparison_end_time"] = "2024-01-02T00:00:00+00:00"
    return msg


class DescribeWsGetAnomaliesPermissions:
    async def test_GIVEN_non_admin_without_permission_WHEN_called_THEN_sends_unauthorized(
        self,
    ):
        hass = _make_hass_for_anomalies()
        connection = _make_connection(is_admin=False, allowed_entities=[])

        await ws_get_anomalies(hass, connection, _anomaly_msg("sensor.secret"))

        connection.send_result.assert_not_called()
        connection.send_error.assert_called_once()
        assert connection.send_error.call_args[0][1] == "unauthorized"

    async def test_GIVEN_admin_WHEN_called_THEN_proceeds(self):
        hass = _make_hass_for_anomalies()
        connection = _make_connection(is_admin=True)

        await ws_get_anomalies(hass, connection, _anomaly_msg("sensor.any"))

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()

    async def test_GIVEN_non_admin_with_primary_permission_but_not_comparison_WHEN_called_THEN_sends_unauthorized(
        self,
    ):
        hass = _make_hass_for_anomalies()
        connection = _make_connection(
            is_admin=False, allowed_entities=["sensor.primary"]
        )

        await ws_get_anomalies(
            hass,
            connection,
            _anomaly_msg("sensor.primary", comparison_entity_id="sensor.forbidden"),
        )

        connection.send_result.assert_not_called()
        connection.send_error.assert_called_once()
        assert connection.send_error.call_args[0][1] == "unauthorized"

    async def test_GIVEN_non_admin_with_both_permissions_WHEN_called_THEN_proceeds(
        self,
    ):
        hass = _make_hass_for_anomalies()
        connection = _make_connection(
            is_admin=False,
            allowed_entities=["sensor.primary", "sensor.comparison"],
        )

        await ws_get_anomalies(
            hass,
            connection,
            _anomaly_msg("sensor.primary", comparison_entity_id="sensor.comparison"),
        )

        connection.send_error.assert_not_called()
        connection.send_result.assert_called_once()
