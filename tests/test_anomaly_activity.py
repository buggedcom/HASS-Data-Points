"""Tests for range-scoped per-entity anomaly activity bucketing."""

from __future__ import annotations

from custom_components.hass_datapoints.anomaly_activity import compute_anomaly_activity

START = 0
END = 1000  # 4 buckets of 250 ms


def _cluster(*times):
    return {"points": [{"timeMs": t, "value": 1.0} for t in times]}


class DescribeComputeAnomalyActivity:
    def test_GIVEN_no_clusters_WHEN_computed_THEN_zero_filled_buckets(self):
        result = compute_anomaly_activity({"sensor.a": []}, None, START, END, 4)

        assert result["total_anomalies"] == 0
        assert result["incident_count"] == 0
        assert result["bucket_ms"] == 250
        (entity,) = result["entities"]
        assert entity["entity_id"] == "sensor.a"
        assert entity["total"] == 0
        assert entity["incident_count"] == 0
        assert entity["buckets"] == [
            {"start_ms": 0, "end_ms": 250, "anomaly_count": 0, "incident_count": 0},
            {"start_ms": 250, "end_ms": 500, "anomaly_count": 0, "incident_count": 0},
            {"start_ms": 500, "end_ms": 750, "anomaly_count": 0, "incident_count": 0},
            {"start_ms": 750, "end_ms": 1000, "anomaly_count": 0, "incident_count": 0},
        ]

    def test_GIVEN_cluster_points_WHEN_computed_THEN_points_bucketed_by_time(self):
        clusters = {"sensor.a": [_cluster(10, 20, 600)]}

        result = compute_anomaly_activity(clusters, None, START, END, 4)

        buckets = result["entities"][0]["buckets"]
        assert [b["anomaly_count"] for b in buckets] == [2, 0, 1, 0]
        assert result["entities"][0]["total"] == 3
        assert result["total_anomalies"] == 3

    def test_GIVEN_cluster_WHEN_computed_THEN_incident_counted_in_start_bucket(self):
        clusters = {"sensor.a": [_cluster(240, 260)]}

        result = compute_anomaly_activity(clusters, None, START, END, 4)

        buckets = result["entities"][0]["buckets"]
        assert [b["incident_count"] for b in buckets] == [1, 0, 0, 0]
        assert [b["anomaly_count"] for b in buckets] == [1, 1, 0, 0]
        assert result["entities"][0]["incident_count"] == 1
        assert result["incident_count"] == 1

    def test_GIVEN_points_outside_range_WHEN_computed_THEN_they_are_ignored(self):
        clusters = {"sensor.a": [_cluster(-5, 100), _cluster(1000, 2000)]}

        result = compute_anomaly_activity(clusters, None, START, END, 4)

        assert result["total_anomalies"] == 1
        assert result["incident_count"] == 1

    def test_GIVEN_multiple_entities_WHEN_computed_THEN_attributed_per_entity(self):
        clusters = {
            "sensor.a": [_cluster(10)],
            "sensor.b": [_cluster(900, 910), _cluster(500)],
        }

        result = compute_anomaly_activity(clusters, None, START, END, 4)

        by_id = {e["entity_id"]: e for e in result["entities"]}
        assert [e["entity_id"] for e in result["entities"]] == ["sensor.a", "sensor.b"]
        assert by_id["sensor.a"]["total"] == 1
        assert by_id["sensor.b"]["total"] == 3
        assert by_id["sensor.b"]["incident_count"] == 2
        assert result["total_anomalies"] == 4
        assert result["incident_count"] == 3

    def test_GIVEN_incident_clusters_WHEN_computed_THEN_they_set_incident_count(self):
        clusters = {"sensor.a": [_cluster(10)], "sensor.b": [_cluster(20)]}
        incidents = [_cluster(10, 20)]

        result = compute_anomaly_activity(clusters, incidents, START, END, 4)

        assert result["incident_count"] == 1
        assert result["total_anomalies"] == 2
        assert [e["incident_count"] for e in result["entities"]] == [1, 1]

    def test_GIVEN_point_at_range_end_WHEN_computed_THEN_excluded(self):
        result = compute_anomaly_activity({"a": [_cluster(1000)]}, None, START, END, 4)

        assert result["total_anomalies"] == 0
