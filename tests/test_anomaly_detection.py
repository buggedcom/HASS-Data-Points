"""Tests for custom_components.hass_datapoints.anomaly_detection."""
from __future__ import annotations

import pytest

from custom_components.hass_datapoints.anomaly_detection import (
    _build_linear_trend,
    _build_rolling_average,
    _iqr_k,
    _interpolate,
    _persistence_flat_fraction,
    _zscore_threshold,
    apply_overlap_mode,
    detect_comparison_window,
    detect_iqr,
    detect_persistence,
    detect_rate_of_change,
    detect_rolling_zscore,
    detect_trend_residual,
    run_anomaly_detection,
)


# ---------------------------------------------------------------------------
# _zscore_threshold
# ---------------------------------------------------------------------------

class DescribeZscoreThreshold:
    def test_GIVEN_low_sensitivity_WHEN_called_THEN_returns_higher_threshold(self):
        assert _zscore_threshold("low") == 2.8

    def test_GIVEN_medium_sensitivity_WHEN_called_THEN_returns_default_threshold(self):
        assert _zscore_threshold("medium") == 2.2

    def test_GIVEN_high_sensitivity_WHEN_called_THEN_returns_lower_threshold(self):
        assert _zscore_threshold("high") == 1.6

    def test_GIVEN_unknown_sensitivity_WHEN_called_THEN_falls_back_to_medium(self):
        assert _zscore_threshold("banana") == 2.2


class DescribeIqrK:
    def test_GIVEN_low_sensitivity_WHEN_called_THEN_returns_3_0(self):
        assert _iqr_k("low") == 3.0

    def test_GIVEN_medium_sensitivity_WHEN_called_THEN_returns_2_0(self):
        assert _iqr_k("medium") == 2.0

    def test_GIVEN_high_sensitivity_WHEN_called_THEN_returns_1_5(self):
        assert _iqr_k("high") == 1.5


class DescribePersistenceFlatFraction:
    def test_GIVEN_low_sensitivity_WHEN_called_THEN_returns_0_005(self):
        assert _persistence_flat_fraction("low") == 0.005

    def test_GIVEN_medium_sensitivity_WHEN_called_THEN_returns_0_02(self):
        assert _persistence_flat_fraction("medium") == 0.02

    def test_GIVEN_high_sensitivity_WHEN_called_THEN_returns_0_05(self):
        assert _persistence_flat_fraction("high") == 0.05


# ---------------------------------------------------------------------------
# _interpolate
# ---------------------------------------------------------------------------

class DescribeInterpolate:
    def test_GIVEN_empty_list_WHEN_called_THEN_returns_none(self):
        assert _interpolate([], 1000) is None

    def test_GIVEN_time_before_range_WHEN_called_THEN_returns_none(self):
        pts = [[100, 1.0], [200, 2.0]]
        assert _interpolate(pts, 50) is None

    def test_GIVEN_time_after_range_WHEN_called_THEN_returns_none(self):
        pts = [[100, 1.0], [200, 2.0]]
        assert _interpolate(pts, 300) is None

    def test_GIVEN_time_at_first_point_WHEN_called_THEN_returns_first_value(self):
        pts = [[100, 5.0], [200, 10.0]]
        assert _interpolate(pts, 100) == 5.0

    def test_GIVEN_time_at_last_point_WHEN_called_THEN_returns_last_value(self):
        pts = [[100, 5.0], [200, 10.0]]
        assert _interpolate(pts, 200) == 10.0

    def test_GIVEN_time_at_midpoint_WHEN_called_THEN_returns_linearly_interpolated_value(self):
        pts = [[0, 0.0], [100, 10.0]]
        assert _interpolate(pts, 50) == pytest.approx(5.0)

    def test_GIVEN_time_at_quarter_point_WHEN_called_THEN_returns_quarter_value(self):
        pts = [[0, 0.0], [100, 100.0]]
        assert _interpolate(pts, 25) == pytest.approx(25.0)


# ---------------------------------------------------------------------------
# _build_rolling_average
# ---------------------------------------------------------------------------

class DescribeBuildRollingAverage:
    def test_GIVEN_single_point_WHEN_called_THEN_returns_empty(self):
        assert _build_rolling_average([[0, 1.0]], 1000) == []

    def test_GIVEN_zero_window_WHEN_called_THEN_returns_empty(self):
        assert _build_rolling_average([[0, 1.0], [1000, 2.0]], 0) == []

    def test_GIVEN_window_larger_than_series_WHEN_called_THEN_averages_all_points(self):
        pts = [[0, 2.0], [1000, 4.0], [2000, 6.0]]
        result = _build_rolling_average(pts, 5000)
        assert len(result) == 3
        assert result[-1][1] == pytest.approx(4.0)

    def test_GIVEN_narrow_window_WHEN_called_THEN_excludes_old_points(self):
        pts = [[0, 0.0], [1000, 10.0], [2000, 20.0]]
        result = _build_rolling_average(pts, 500)
        assert result[2][1] == pytest.approx(20.0)


# ---------------------------------------------------------------------------
# _build_linear_trend
# ---------------------------------------------------------------------------

class DescribeBuildLinearTrend:
    def test_GIVEN_single_point_WHEN_called_THEN_returns_empty(self):
        assert _build_linear_trend([[0, 1.0]]) == []

    def test_GIVEN_identical_timestamps_WHEN_called_THEN_returns_empty(self):
        pts = [[1000, 1.0], [1000, 2.0], [1000, 3.0]]
        assert _build_linear_trend(pts) == []

    def test_GIVEN_flat_series_WHEN_called_THEN_trend_is_also_flat(self):
        pts = [[0, 5.0], [3_600_000, 5.0]]
        result = _build_linear_trend(pts)
        assert len(result) == 2
        assert result[0][1] == pytest.approx(5.0)
        assert result[1][1] == pytest.approx(5.0)

    def test_GIVEN_ascending_series_WHEN_called_THEN_trend_matches_slope(self):
        pts = [[0, 0.0], [3_600_000, 1.0], [7_200_000, 2.0]]
        result = _build_linear_trend(pts)
        assert len(result) == 2
        assert result[0][1] == pytest.approx(0.0, abs=1e-6)
        assert result[1][1] == pytest.approx(2.0, abs=1e-6)


# ---------------------------------------------------------------------------
# detect_iqr
# ---------------------------------------------------------------------------

class DescribeDetectIqr:
    def test_GIVEN_fewer_than_4_points_WHEN_called_THEN_returns_empty(self):
        assert detect_iqr([[0, 1], [1, 2], [2, 3]], "medium") == []

    def test_GIVEN_constant_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 1000, 5.0] for i in range(20)]
        assert detect_iqr(pts, "medium") == []

    def test_GIVEN_series_with_extreme_outliers_WHEN_called_THEN_returns_clusters(self):
        pts = [[i * 1000, float(i % 5)] for i in range(18)]
        pts.append([18000, 1000.0])
        pts.append([19000, -1000.0])
        result = detect_iqr(pts, "medium")
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "iqr"

    def test_GIVEN_clean_linear_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 1000, float(i)] for i in range(20)]
        assert detect_iqr(pts, "medium") == []

    def test_GIVEN_mild_outlier_WHEN_high_sensitivity_THEN_flags_more_than_low(self):
        pts = [[i * 1000, 0.0] for i in range(15)]
        pts[7] = [7000, 5.0]
        assert len(detect_iqr(pts, "high")) >= len(detect_iqr(pts, "low"))


# ---------------------------------------------------------------------------
# detect_rolling_zscore
# ---------------------------------------------------------------------------

class DescribeDetectRollingZscore:
    def test_GIVEN_fewer_than_3_points_WHEN_called_THEN_returns_empty(self):
        assert detect_rolling_zscore([[0, 1], [1, 2]], "medium", 3600) == []

    def test_GIVEN_flatline_with_spike_WHEN_called_THEN_returns_cluster(self):
        pts = [[i * 60_000, 0.0] for i in range(30)]
        pts[15] = [15 * 60_000, 1_000.0]
        result = detect_rolling_zscore(pts, "medium", 3600)
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "rolling_zscore"

    def test_GIVEN_gradual_increase_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 60_000, float(i)] for i in range(30)]
        assert detect_rolling_zscore(pts, "medium", 86400) == []

    def test_GIVEN_flat_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 60_000, 5.0] for i in range(30)]
        assert detect_rolling_zscore(pts, "medium", 3600) == []


# ---------------------------------------------------------------------------
# detect_trend_residual
# ---------------------------------------------------------------------------

class DescribeDetectTrendResidual:
    def test_GIVEN_fewer_than_3_points_WHEN_called_THEN_returns_empty(self):
        assert detect_trend_residual([[0, 1], [1, 2]], "medium", "rolling_average", "24h") == []

    def test_GIVEN_flatline_with_spike_WHEN_rolling_average_method_THEN_returns_cluster(self):
        base = [[i * 3_600_000, 10.0] for i in range(48)]
        base[24] = [24 * 3_600_000, 10_000.0]
        result = detect_trend_residual(base, "medium", "rolling_average", "6h")
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "trend_residual"

    def test_GIVEN_perfectly_linear_series_WHEN_linear_trend_method_THEN_returns_empty(self):
        pts = [[i * 3_600_000, float(i)] for i in range(24)]
        assert detect_trend_residual(pts, "medium", "linear_trend", "24h") == []

    def test_GIVEN_flat_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 3_600_000, 8.0] for i in range(24)]
        assert detect_trend_residual(pts, "medium", "rolling_average", "24h") == []


# ---------------------------------------------------------------------------
# detect_persistence
# ---------------------------------------------------------------------------

class DescribeDetectPersistence:
    def test_GIVEN_fewer_than_3_points_WHEN_called_THEN_returns_empty(self):
        assert detect_persistence([[0, 1], [1, 2]], "medium", 3600) == []

    def test_GIVEN_flat_segment_longer_than_window_WHEN_called_THEN_returns_cluster(self):
        flat = [[i * 3_600_000, 5.0] for i in range(5)]
        change = [[5 * 3_600_000 + i * 3_600_000, float(10 + i)] for i in range(10)]
        result = detect_persistence(flat + change, "medium", 3600)
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "persistence"

    def test_GIVEN_flat_segment_shorter_than_window_WHEN_called_THEN_returns_empty(self):
        flat = [[i * 60_000, 5.0] for i in range(10)]
        change = [[10 * 60_000 + i * 60_000, float(10 + i)] for i in range(20)]
        assert detect_persistence(flat + change, "medium", 3600) == []

    def test_GIVEN_entire_series_is_flat_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 60_000, 5.0] for i in range(20)]
        assert detect_persistence(pts, "medium", 3600) == []

    def test_GIVEN_single_flat_run_WHEN_called_THEN_returns_exactly_one_cluster(self):
        pts = [[i * 3_600_000, 5.0] for i in range(4)]
        pts += [[4 * 3_600_000, 20.0], [5 * 3_600_000, 22.0], [6 * 3_600_000, 24.0]]
        result = detect_persistence(pts, "medium", 3600)
        assert len(result) == 1


# ---------------------------------------------------------------------------
# detect_rate_of_change
# ---------------------------------------------------------------------------

class DescribeDetectRateOfChange:
    def test_GIVEN_fewer_than_3_points_WHEN_called_THEN_returns_empty(self):
        assert detect_rate_of_change([[0, 1], [1, 2]], "medium", "1h") == []

    def test_GIVEN_slow_ramp_then_sudden_jump_WHEN_called_THEN_returns_cluster(self):
        pts = [[i * 3_600_000, float(i)] for i in range(20)]
        pts += [[20 * 3_600_000, 1_000.0], [21 * 3_600_000, 1_001.0], [22 * 3_600_000, 1_002.0]]
        result = detect_rate_of_change(pts, "medium", "1h")
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "rate_of_change"

    def test_GIVEN_constant_rate_of_change_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 3_600_000, float(i * 10)] for i in range(24)]
        assert detect_rate_of_change(pts, "medium", "1h") == []

    def test_GIVEN_flat_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 3_600_000, 7.0] for i in range(24)]
        assert detect_rate_of_change(pts, "medium", "1h") == []

    def test_GIVEN_single_sudden_jump_WHEN_called_THEN_returns_one_cluster(self):
        pts = [[i * 3_600_000, float(i)] for i in range(10)]
        pts += [[10 * 3_600_000, 100.0], [11 * 3_600_000, 101.0], [12 * 3_600_000, 102.0]]
        result = detect_rate_of_change(pts, "medium", "1h")
        assert len(result) == 1


# ---------------------------------------------------------------------------
# detect_comparison_window
# ---------------------------------------------------------------------------

class DescribeDetectComparisonWindow:
    def test_GIVEN_fewer_than_3_primary_points_WHEN_called_THEN_returns_empty(self):
        pts = [[0, 1], [1, 2]]
        comp = [[0, 1], [1, 2], [2, 2]]
        assert detect_comparison_window(pts, comp, "medium") == []

    def test_GIVEN_primary_diverges_from_comparison_WHEN_called_THEN_returns_cluster(self):
        n = 24
        comp = [[i * 3_600_000, 10.0] for i in range(n)]
        pts = [[i * 3_600_000, 10.0] for i in range(n)]
        pts[12] = [12 * 3_600_000, 10_000.0]
        result = detect_comparison_window(pts, comp, "medium")
        assert len(result) >= 1
        assert result[0]["anomalyMethod"] == "comparison_window"

    def test_GIVEN_identical_primary_and_comparison_WHEN_called_THEN_returns_empty(self):
        series = [[i * 3_600_000, float(i)] for i in range(24)]
        assert detect_comparison_window(series, series, "medium") == []

    def test_GIVEN_flat_matching_series_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 3_600_000, 10.0] for i in range(24)]
        comp = [[i * 3_600_000, 10.0] for i in range(24)]
        assert detect_comparison_window(pts, comp, "medium") == []

    def test_GIVEN_single_spike_against_comparison_WHEN_called_THEN_returns_one_cluster(self):
        pts = [[i * 3_600_000, 10.0] for i in range(24)]
        comp = [[i * 3_600_000, 10.0] for i in range(24)]
        pts[8] = [8 * 3_600_000, 1000.0]
        result = detect_comparison_window(pts, comp, "medium")
        assert len(result) == 1


# ---------------------------------------------------------------------------
# apply_overlap_mode
# ---------------------------------------------------------------------------

def _make_cluster(method: str, time_ms: int, value: float = 1.0) -> dict:
    return {
        "points": [{"timeMs": time_ms, "value": value, "residual": value, "baselineValue": 0}],
        "maxDeviation": value,
        "anomalyMethod": method,
    }


class DescribeApplyOverlapMode:
    def test_GIVEN_single_method_WHEN_any_mode_THEN_returns_all_clusters(self):
        clusters = [_make_cluster("iqr", 1000)]
        assert apply_overlap_mode({"iqr": clusters}, "all") == clusters

    def test_GIVEN_two_methods_flagging_different_times_WHEN_all_mode_THEN_returns_every_cluster(self):
        c1 = _make_cluster("iqr", 1000)
        c2 = _make_cluster("rolling_zscore", 2000)
        result = apply_overlap_mode({"iqr": [c1], "rolling_zscore": [c2]}, "all")
        assert len(result) == 2

    def test_GIVEN_overlap_at_one_time_WHEN_only_mode_THEN_returns_only_overlapping_clusters(self):
        c_iqr_shared = _make_cluster("iqr", 1000)
        c_iqr_only = _make_cluster("iqr", 2000)
        c_zscore_shared = _make_cluster("rolling_zscore", 1000)
        result = apply_overlap_mode(
            {"iqr": [c_iqr_shared, c_iqr_only], "rolling_zscore": [c_zscore_shared]},
            "only",
        )
        assert len(result) >= 1
        assert all(r.get("isOverlap") for r in result)

    def test_GIVEN_overlap_at_shared_time_WHEN_highlight_mode_THEN_marks_clusters_as_overlapping(self):
        c_iqr = _make_cluster("iqr", 1000)
        c_zscore = _make_cluster("rolling_zscore", 1000)
        result = apply_overlap_mode({"iqr": [c_iqr], "rolling_zscore": [c_zscore]}, "highlight")
        assert len(result) == 2
        assert all(r.get("isOverlap") for r in result)


# ---------------------------------------------------------------------------
# run_anomaly_detection
# ---------------------------------------------------------------------------

class DescribeRunAnomalyDetection:
    def test_GIVEN_empty_pts_WHEN_called_THEN_returns_empty(self):
        assert run_anomaly_detection([], {"anomaly_methods": ["iqr"]}) == []

    def test_GIVEN_fewer_than_3_pts_WHEN_called_THEN_returns_empty(self):
        assert run_anomaly_detection([[0, 1], [1, 2]], {"anomaly_methods": ["iqr"]}) == []

    def test_GIVEN_empty_methods_list_WHEN_called_THEN_returns_empty(self):
        pts = [[i * 1000, float(i)] for i in range(20)]
        assert run_anomaly_detection(pts, {"anomaly_methods": []}) == []

    def test_GIVEN_unknown_method_name_WHEN_called_THEN_ignores_it_and_returns_empty(self):
        pts = [[i * 1000, float(i)] for i in range(20)]
        assert run_anomaly_detection(pts, {"anomaly_methods": ["not_a_method"]}) == []

    def test_GIVEN_oscillating_series_with_extreme_outlier_WHEN_iqr_method_THEN_returns_cluster(self):
        pts = [[i * 1000, float(i % 10)] for i in range(30)]
        pts[15] = [15000, 10_000.0]
        result = run_anomaly_detection(
            pts, {"anomaly_methods": ["iqr"], "anomaly_sensitivity": "medium"}
        )
        assert len(result) >= 1

    def test_GIVEN_flatline_with_spike_WHEN_two_methods_and_all_overlap_mode_THEN_returns_clusters(self):
        pts = [[i * 3_600_000, 0.0] for i in range(48)]
        pts[24] = [24 * 3_600_000, 10_000.0]
        result = run_anomaly_detection(pts, {
            "anomaly_methods": ["iqr", "rolling_zscore"],
            "anomaly_overlap_mode": "all",
            "anomaly_sensitivity": "medium",
            "anomaly_zscore_window": "24h",
        })
        assert len(result) >= 1
