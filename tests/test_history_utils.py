"""Tests for custom_components.hass_datapoints.history_utils."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from custom_components.hass_datapoints.history_utils import (
    _parse_dt,
    downsample_pts,
    fetch_entity_pts,
    fetch_entity_statistics_pts,
    parse_interval_seconds,
)


# ---------------------------------------------------------------------------
# parse_interval_seconds
# ---------------------------------------------------------------------------

class DescribeParseIntervalSeconds:
    def test_GIVEN_known_short_interval_WHEN_called_THEN_returns_correct_seconds(self):
        assert parse_interval_seconds("5s") == 5
        assert parse_interval_seconds("1m") == 60
        assert parse_interval_seconds("5m") == 300

    def test_GIVEN_known_hour_interval_WHEN_called_THEN_returns_correct_seconds(self):
        assert parse_interval_seconds("1h") == 3600
        assert parse_interval_seconds("24h") == 86400

    def test_GIVEN_unknown_string_WHEN_called_THEN_returns_zero(self):
        assert parse_interval_seconds("raw") == 0
        assert parse_interval_seconds("") == 0
        assert parse_interval_seconds("99x") == 0


# ---------------------------------------------------------------------------
# _parse_dt
# ---------------------------------------------------------------------------

class DescribeParseDt:
    def test_GIVEN_naive_iso_string_WHEN_called_THEN_attaches_utc_timezone(self):
        dt = _parse_dt("2024-01-15T12:00:00")
        assert dt.tzinfo == timezone.utc

    def test_GIVEN_aware_iso_string_WHEN_called_THEN_preserves_original_datetime(self):
        dt = _parse_dt("2024-01-15T12:00:00+00:00")
        assert dt.tzinfo is not None
        assert (dt.year, dt.month, dt.day, dt.hour) == (2024, 1, 15, 12)


# ---------------------------------------------------------------------------
# downsample_pts
# ---------------------------------------------------------------------------

class DescribeDownsamplePts:
    def test_GIVEN_empty_input_WHEN_called_THEN_returns_empty_list(self):
        assert downsample_pts([], 60, "mean") == []

    def test_GIVEN_zero_interval_WHEN_called_THEN_returns_original_list_unchanged(self):
        pts = [[0, 1.0], [1000, 2.0]]
        assert downsample_pts(pts, 0, "mean") is pts

    def test_GIVEN_negative_interval_WHEN_called_THEN_returns_original_list_unchanged(self):
        pts = [[0, 1.0], [1000, 2.0]]
        assert downsample_pts(pts, -1, "mean") is pts

    def test_GIVEN_two_points_in_same_bucket_WHEN_mean_aggregate_THEN_returns_their_mean(self):
        pts = [[0, 2.0], [500, 4.0], [2000, 10.0]]
        result = downsample_pts(pts, 1, "mean")
        assert len(result) == 2
        assert result[0][1] == pytest.approx(3.0)
        assert result[1][1] == pytest.approx(10.0)

    def test_GIVEN_values_in_same_bucket_WHEN_min_aggregate_THEN_returns_minimum(self):
        pts = [[0, 5.0], [500, 1.0], [2000, 8.0]]
        assert downsample_pts(pts, 1, "min")[0][1] == pytest.approx(1.0)

    def test_GIVEN_values_in_same_bucket_WHEN_max_aggregate_THEN_returns_maximum(self):
        pts = [[0, 5.0], [500, 1.0], [2000, 8.0]]
        assert downsample_pts(pts, 1, "max")[0][1] == pytest.approx(5.0)

    def test_GIVEN_odd_number_of_values_in_bucket_WHEN_median_aggregate_THEN_returns_middle_value(self):
        pts = [[0, 1.0], [300, 2.0], [600, 100.0], [2000, 9.0]]
        assert downsample_pts(pts, 1, "median")[0][1] == pytest.approx(2.0)

    def test_GIVEN_values_in_same_bucket_WHEN_first_aggregate_THEN_returns_first_value(self):
        pts = [[0, 10.0], [500, 20.0], [2000, 30.0]]
        assert downsample_pts(pts, 1, "first")[0][1] == pytest.approx(10.0)

    def test_GIVEN_values_in_same_bucket_WHEN_last_aggregate_THEN_returns_last_value(self):
        pts = [[0, 10.0], [500, 20.0], [2000, 30.0]]
        assert downsample_pts(pts, 1, "last")[0][1] == pytest.approx(20.0)

    def test_GIVEN_unknown_aggregate_name_WHEN_called_THEN_falls_back_to_mean(self):
        pts = [[0, 2.0], [500, 4.0]]
        assert downsample_pts(pts, 1, "unknown_agg")[0][1] == pytest.approx(3.0)

    def test_GIVEN_bucket_with_first_point_at_offset_WHEN_called_THEN_representative_time_is_first_point(self):
        pts = [[100, 1.0], [500, 2.0], [3000, 3.0]]
        result = downsample_pts(pts, 1, "mean")
        assert result[0][0] == 100

    def test_GIVEN_well_separated_points_WHEN_called_THEN_each_forms_its_own_bucket(self):
        pts = [[0, 1.0], [2000, 2.0], [4000, 3.0]]
        assert len(downsample_pts(pts, 1, "mean")) == 3


# ---------------------------------------------------------------------------
# fetch_entity_pts
# ---------------------------------------------------------------------------

class DescribeFetchEntityPts:
    def _make_state(self, state_str: str, ts_ms: int) -> MagicMock:
        s = MagicMock()
        s.state = state_str
        s.last_updated_timestamp = ts_ms / 1000.0
        return s

    def test_GIVEN_valid_numeric_states_WHEN_called_THEN_returns_time_value_pairs(self, monkeypatch):
        states = [self._make_state("10.5", 1_000_000), self._make_state("20.0", 2_000_000)]
        mock_history = MagicMock()
        mock_history.get_significant_states.return_value = {"sensor.temp": states}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.history", mock_history)
        result = fetch_entity_pts(MagicMock(), "sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert result == [[1_000_000, 10.5], [2_000_000, 20.0]]

    def test_GIVEN_mix_of_numeric_and_unavailable_states_WHEN_called_THEN_skips_non_numeric(self, monkeypatch):
        states = [self._make_state("unavailable", 1_000_000), self._make_state("5.0", 2_000_000)]
        mock_history = MagicMock()
        mock_history.get_significant_states.return_value = {"sensor.temp": states}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.history", mock_history)
        result = fetch_entity_pts(MagicMock(), "sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert result == [[2_000_000, 5.0]]

    def test_GIVEN_malformed_start_time_WHEN_called_THEN_returns_empty(self, monkeypatch):
        result = fetch_entity_pts(MagicMock(), "sensor.temp", "not-a-date", "2024-01-02T00:00:00")
        assert result == []

    def test_GIVEN_entity_not_in_ha_response_WHEN_called_THEN_returns_empty(self, monkeypatch):
        mock_history = MagicMock()
        mock_history.get_significant_states.return_value = {}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.history", mock_history)
        result = fetch_entity_pts(MagicMock(), "sensor.missing", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert result == []


# ---------------------------------------------------------------------------
# fetch_entity_statistics_pts
# ---------------------------------------------------------------------------

class DescribeFetchEntityStatisticsPts:
    def test_GIVEN_entries_with_unix_second_timestamps_WHEN_called_THEN_returns_time_value_pairs(self, monkeypatch):
        entries = [{"mean": 15.0, "start": 1_700_000_000}, {"mean": 20.0, "start": 1_700_003_600}]
        mock_stats = MagicMock()
        mock_stats.statistics_during_period.return_value = {"sensor.temp": entries}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.statistics", mock_stats)
        result = fetch_entity_statistics_pts(MagicMock(), "sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert len(result) == 2
        assert result[0][1] == 15.0

    def test_GIVEN_entries_with_datetime_start_WHEN_called_THEN_returns_time_value_pairs(self, monkeypatch):
        dt = datetime(2024, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        entries = [{"mean": 5.5, "start": dt}]
        mock_stats = MagicMock()
        mock_stats.statistics_during_period.return_value = {"sensor.temp": entries}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.statistics", mock_stats)
        result = fetch_entity_statistics_pts(MagicMock(), "sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert len(result) == 1
        assert result[0][1] == 5.5

    def test_GIVEN_entry_with_null_mean_WHEN_called_THEN_skips_that_entry(self, monkeypatch):
        entries = [{"mean": None, "start": 1_700_000_000}, {"mean": 7.0, "start": 1_700_003_600}]
        mock_stats = MagicMock()
        mock_stats.statistics_during_period.return_value = {"sensor.temp": entries}
        monkeypatch.setitem(sys.modules, "homeassistant.components.recorder.statistics", mock_stats)
        result = fetch_entity_statistics_pts(MagicMock(), "sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00")
        assert len(result) == 1
        assert result[0][1] == 7.0

    def test_GIVEN_malformed_start_time_WHEN_called_THEN_returns_empty(self, monkeypatch):
        result = fetch_entity_statistics_pts(MagicMock(), "sensor.temp", "bad", "2024-01-02T00:00:00")
        assert result == []
