"""Tests for custom_components.hass_datapoints.anomaly_cache."""
from __future__ import annotations

import time

import pytest

from custom_components.hass_datapoints.anomaly_cache import AnomalyCache, make_cache_key


# ---------------------------------------------------------------------------
# make_cache_key
# ---------------------------------------------------------------------------

class DescribeMakeCacheKey:
    def test_GIVEN_identical_inputs_WHEN_called_twice_THEN_returns_same_key(self):
        cfg = {"anomaly_methods": ["iqr"], "anomaly_sensitivity": "medium"}
        k1 = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg)
        k2 = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg)
        assert k1 == k2

    def test_GIVEN_methods_in_different_order_WHEN_called_THEN_returns_same_key(self):
        cfg_a = {"anomaly_methods": ["iqr", "rolling_zscore"]}
        cfg_b = {"anomaly_methods": ["rolling_zscore", "iqr"]}
        k_a = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg_a)
        k_b = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg_b)
        assert k_a == k_b

    def test_GIVEN_different_sensitivity_WHEN_called_THEN_returns_different_keys(self):
        k_med = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", {"anomaly_sensitivity": "medium"})
        k_high = make_cache_key("sensor.temp", "2024-01-01T00:00:00", "2024-01-02T00:00:00", {"anomaly_sensitivity": "high"})
        assert k_med != k_high

    def test_GIVEN_different_entity_ids_WHEN_called_THEN_returns_different_keys(self):
        cfg = {"anomaly_methods": ["iqr"]}
        k1 = make_cache_key("sensor.a", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg)
        k2 = make_cache_key("sensor.b", "2024-01-01T00:00:00", "2024-01-02T00:00:00", cfg)
        assert k1 != k2

    def test_GIVEN_any_config_WHEN_called_THEN_returns_64_char_hex_digest(self):
        key = make_cache_key("sensor.x", "2024-01-01T00:00:00", "2024-01-02T00:00:00", {})
        assert len(key) == 64
        assert all(c in "0123456789abcdef" for c in key)


# ---------------------------------------------------------------------------
# AnomalyCache.get
# ---------------------------------------------------------------------------

class DescribeAnomalyCacheGet:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        self.cache = AnomalyCache(str(tmp_path / "test_cache.db"))

    def test_GIVEN_empty_cache_WHEN_get_called_THEN_returns_none(self):
        assert self.cache.get("nonexistent_key") is None

    def test_GIVEN_stored_clusters_WHEN_get_called_with_same_key_THEN_returns_clusters(self):
        clusters = [{"anomalyMethod": "iqr", "points": [], "maxDeviation": 1.0}]
        self.cache.set("k1", "sensor.temp", time.time() - 10, clusters)
        assert self.cache.get("k1") == clusters

    def test_GIVEN_complex_cluster_structure_WHEN_stored_and_retrieved_THEN_roundtrips_intact(self):
        clusters = [{
            "anomalyMethod": "rolling_zscore",
            "points": [{"timeMs": 1000, "value": 42.0, "residual": 5.0}],
            "maxDeviation": 5.0,
            "isOverlap": False,
        }]
        self.cache.set("k2", "sensor.hum", time.time() - 5, clusters)
        assert self.cache.get("k2") == clusters


# ---------------------------------------------------------------------------
# AnomalyCache.set
# ---------------------------------------------------------------------------

class DescribeAnomalyCacheSet:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        self.cache = AnomalyCache(str(tmp_path / "test_cache.db"))

    def test_GIVEN_existing_entry_WHEN_set_called_with_same_key_THEN_replaces_it(self):
        self.cache.set("k", "sensor.a", time.time(), [{"v": 1}])
        self.cache.set("k", "sensor.a", time.time(), [{"v": 2}])
        assert self.cache.get("k") == [{"v": 2}]

    def test_GIVEN_empty_clusters_list_WHEN_set_called_THEN_stores_and_retrieves_empty_list(self):
        self.cache.set("k", "sensor.a", time.time(), [])
        assert self.cache.get("k") == []


# ---------------------------------------------------------------------------
# AnomalyCache.purge_old
# ---------------------------------------------------------------------------

class DescribeAnomalyCachePurgeOld:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        self.cache = AnomalyCache(str(tmp_path / "test_cache.db"))

    def test_GIVEN_stale_entry_WHEN_purge_old_called_THEN_removes_it(self):
        past_ts = time.time() - (40 * 86400)
        with self.cache._connect() as c:
            c.execute(
                "INSERT INTO anomaly_cache (cache_key, entity_id, end_time_ts, created_at, clusters_json) "
                "VALUES (?, ?, ?, ?, ?)",
                ("stale_key", "sensor.x", past_ts, past_ts, "[]"),
            )
        deleted = self.cache.purge_old(30)
        assert deleted >= 1
        assert self.cache.get("stale_key") is None

    def test_GIVEN_recent_entry_WHEN_purge_old_called_THEN_entry_survives(self):
        self.cache.set("recent", "sensor.x", time.time(), [{"v": 99}])
        self.cache.purge_old(30)
        assert self.cache.get("recent") == [{"v": 99}]


# ---------------------------------------------------------------------------
# AnomalyCache.clear_all
# ---------------------------------------------------------------------------

class DescribeAnomalyCacheClearAll:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        self.cache = AnomalyCache(str(tmp_path / "test_cache.db"))

    def test_GIVEN_two_entries_WHEN_clear_all_called_THEN_removes_both_and_returns_count(self):
        self.cache.set("k1", "sensor.a", time.time(), [])
        self.cache.set("k2", "sensor.b", time.time(), [])
        assert self.cache.clear_all() == 2
        assert self.cache.get("k1") is None
        assert self.cache.get("k2") is None

    def test_GIVEN_empty_cache_WHEN_clear_all_called_THEN_returns_zero(self):
        assert self.cache.clear_all() == 0


# ---------------------------------------------------------------------------
# AnomalyCache.clear_entity
# ---------------------------------------------------------------------------

class DescribeAnomalyCacheClearEntity:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        self.cache = AnomalyCache(str(tmp_path / "test_cache.db"))

    def test_GIVEN_two_entities_WHEN_clear_entity_called_THEN_removes_only_target(self):
        self.cache.set("k1", "sensor.a", time.time(), [{"v": 1}])
        self.cache.set("k2", "sensor.b", time.time(), [{"v": 2}])
        assert self.cache.clear_entity("sensor.a") == 1
        assert self.cache.get("k1") is None
        assert self.cache.get("k2") == [{"v": 2}]

    def test_GIVEN_unknown_entity_WHEN_clear_entity_called_THEN_returns_zero(self):
        assert self.cache.clear_entity("sensor.unknown") == 0
