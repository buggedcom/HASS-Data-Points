"""Tests for custom_components.hass_datapoints.history_utils.prepare_series."""
from __future__ import annotations

from custom_components.hass_datapoints.history_utils import prepare_series

# ---------------------------------------------------------------------------
# prepare_series — stats / raw merge boundary
# ---------------------------------------------------------------------------

class DescribePrepareSeriesMergeBoundary:
    def test_GIVEN_stats_straddling_raw_boundary_WHEN_called_THEN_drops_stats_at_or_after_boundary(self):
        # raw starts at t=1000; stats at/after 1000 must be dropped.
        pts = [[1000, 10.0], [2000, 20.0]]
        stats = [[0, 1.0], [500, 2.0], [1000, 3.0], [1500, 4.0]]
        result = prepare_series(pts, stats)
        # kept stats: t=0 and t=500 (strictly < 1000); 1000 and 1500 dropped.
        assert result == [[0, 1.0], [500, 2.0], [1000, 10.0], [2000, 20.0]]

    def test_GIVEN_pts_empty_WHEN_stats_present_THEN_keeps_every_stat(self):
        # Guards AC2: must NOT touch pts[0][0] when pts is empty (latent IndexError).
        pts: list = []
        stats = [[0, 1.0], [500, 2.0], [1000, 3.0]]
        result = prepare_series(pts, stats)
        assert result == [[0, 1.0], [500, 2.0], [1000, 3.0]]

    def test_GIVEN_both_empty_WHEN_called_THEN_returns_empty(self):
        assert prepare_series([], []) == []

    def test_GIVEN_single_raw_point_WHEN_stats_straddle_boundary_THEN_merges_correctly(self):
        pts = [[1000, 99.0]]
        stats = [[0, 1.0], [1000, 2.0], [2000, 3.0]]
        result = prepare_series(pts, stats)
        assert result == [[0, 1.0], [1000, 99.0]]

    def test_GIVEN_no_stats_WHEN_called_THEN_returns_raw_unchanged(self):
        pts = [[1000, 10.0], [2000, 20.0]]
        result = prepare_series(pts, [])
        assert result == [[1000, 10.0], [2000, 20.0]]

    def test_GIVEN_all_stats_at_or_after_boundary_WHEN_called_THEN_returns_raw_only(self):
        pts = [[1000, 10.0]]
        stats = [[1000, 1.0], [2000, 2.0]]
        result = prepare_series(pts, stats)
        assert result == [[1000, 10.0]]


# ---------------------------------------------------------------------------
# prepare_series — cap
# ---------------------------------------------------------------------------

class DescribePrepareSeriesCap:
    def test_GIVEN_merged_total_over_max_WHEN_no_sample_interval_THEN_keeps_last_max_pts(self):
        pts = [[t * 1000, float(t)] for t in range(10)]
        result = prepare_series(pts, [], max_pts=5)
        assert len(result) == 5
        assert result == [[5000, 5.0], [6000, 6.0], [7000, 7.0], [8000, 8.0], [9000, 9.0]]

    def test_GIVEN_total_at_max_WHEN_called_THEN_returns_all(self):
        pts = [[t * 1000, float(t)] for t in range(5)]
        result = prepare_series(pts, [], max_pts=5)
        assert len(result) == 5


# ---------------------------------------------------------------------------
# prepare_series — downsample ordering
# ---------------------------------------------------------------------------

class DescribePrepareSeriesDownsampleOrder:
    def test_GIVEN_sampling_and_overflow_WHEN_called_THEN_downsample_runs_before_cap(self):
        # interval 1s → 1000ms buckets.
        #   bucket A (0-999):   [0,1],[500,3]   -> mean 2.0 @ t=0
        #   bucket B (1000-1999): [1000,5]       -> 5.0 @ t=1000
        #   bucket C (2000-2999): [2000,7],[2500,9] -> mean 8.0 @ t=2000
        # downsample-then-cap(max=2): keep last 2 buckets -> [[1000,5.0],[2000,8.0]]
        # cap-then-downsample(max=2): last 2 raw = [[2000,7],[2500,9]] -> [[2000,8.0]]
        pts = [[0, 1.0], [500, 3.0], [1000, 5.0], [2000, 7.0], [2500, 9.0]]
        result = prepare_series(
            pts, [], sample_interval="1s", sample_aggregate="mean", max_pts=2
        )
        assert result == [[1000, 5.0], [2000, 8.0]]

    def test_GIVEN_sample_interval_raw_WHEN_called_THEN_no_downsampling(self):
        pts = [[0, 1.0], [500, 3.0], [1000, 5.0]]
        result = prepare_series(pts, [], sample_interval="raw")
        assert result == [[0, 1.0], [500, 3.0], [1000, 5.0]]

    def test_GIVEN_sample_interval_none_WHEN_called_THEN_no_downsampling(self):
        pts = [[0, 1.0], [500, 3.0], [1000, 5.0]]
        result = prepare_series(pts, [], sample_interval=None)
        assert result == [[0, 1.0], [500, 3.0], [1000, 5.0]]

    def test_GIVEN_sample_aggregate_none_WHEN_interval_set_THEN_defaults_to_mean(self):
        pts = [[0, 2.0], [500, 4.0]]
        result = prepare_series(pts, [], sample_interval="1s", sample_aggregate=None)
        assert result == [[0, 3.0]]
