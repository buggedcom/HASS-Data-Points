"""Range-scoped per-entity anomaly activity bucketing (pure, no HA imports)."""

from __future__ import annotations

from typing import Any


def _times_in_range(cluster: dict[str, Any], start_ms: int, end_ms: int) -> list[float]:
    """Return the sorted in-range point times of a detection cluster."""
    times: list[float] = []
    for point in cluster.get("points", []):
        if not isinstance(point, dict):
            continue
        t = point.get("timeMs")
        if isinstance(t, (int, float)) and start_ms <= t < end_ms:
            times.append(t)
    return sorted(times)


def compute_anomaly_activity(
    entity_clusters: dict[str, list[dict[str, Any]]],
    incident_clusters: list[dict[str, Any]] | None,
    start_ms: int,
    end_ms: int,
    bucket_count: int,
) -> dict[str, Any]:
    """Bucket per-entity detection clusters over ``[start_ms, end_ms)``.

    Each anomalous cluster point counts as one anomaly in the bucket holding its
    time; each cluster counts as one incident in the bucket holding its first
    in-range point. ``incident_clusters`` (combined monitors) overrides the
    monitor-level incident count; otherwise it is the sum of per-entity incidents.
    """
    span = max(end_ms - start_ms, 1)
    bucket_ms = max(span // bucket_count, 1)

    def index(t: float) -> int:
        return min(int((t - start_ms) // bucket_ms), bucket_count - 1)

    entities: list[dict[str, Any]] = []
    for entity_id, clusters in entity_clusters.items():
        buckets = [
            {
                "start_ms": start_ms + i * bucket_ms,
                "end_ms": (
                    start_ms + (i + 1) * bucket_ms if i < bucket_count - 1 else end_ms
                ),
                "anomaly_count": 0,
                "incident_count": 0,
            }
            for i in range(bucket_count)
        ]
        total = incidents = 0
        for cluster in clusters:
            times = _times_in_range(cluster, start_ms, end_ms)
            if not times:
                continue
            for t in times:
                buckets[index(t)]["anomaly_count"] += 1
            buckets[index(times[0])]["incident_count"] += 1
            total += len(times)
            incidents += 1
        entities.append(
            {
                "entity_id": entity_id,
                "total": total,
                "incident_count": incidents,
                "buckets": buckets,
            }
        )

    if incident_clusters is None:
        incident_count = sum(e["incident_count"] for e in entities)
    else:
        incident_count = sum(
            1 for c in incident_clusters if _times_in_range(c, start_ms, end_ms)
        )

    return {
        "bucket_ms": bucket_ms,
        "total_anomalies": sum(e["total"] for e in entities),
        "incident_count": incident_count,
        "entities": entities,
    }
