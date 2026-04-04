/* eslint-disable no-restricted-globals */
/**
 * Chart data worker — offloads CPU-bound data preparation from the main thread.
 *
 * Currently handles:
 *   • downsample  — fixed-width time-bucket aggregation (mean/min/max/median/first/last)
 */

function downsamplePts(pts, intervalMs, aggregate) {
  if (!pts.length || intervalMs <= 0) return pts;
  const buckets = new Map();
  const bucketRepTime = new Map();
  for (const [t, v] of pts) {
    const idx = Math.floor(t / intervalMs);
    if (!buckets.has(idx)) {
      buckets.set(idx, []);
      bucketRepTime.set(idx, t);
    }
    buckets.get(idx).push(v);
  }
  const result = [];
  for (const idx of [...buckets.keys()].sort((a, b) => a - b)) {
    const values = buckets.get(idx);
    const repTime = bucketRepTime.get(idx);
    let agg;
    if (aggregate === "min") {
      agg = Math.min(...values);
    } else if (aggregate === "max") {
      agg = Math.max(...values);
    } else if (aggregate === "median") {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      agg =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
    } else if (aggregate === "first") {
      agg = values[0];
    } else if (aggregate === "last") {
      agg = values[values.length - 1];
    } else {
      // mean (default)
      agg = values.reduce((s, x) => s + x, 0) / values.length;
    }
    result.push([repTime, agg]);
  }
  return result;
}

self.onmessage = ({ data: { id, type, payload } }) => {
  try {
    let result;
    if (type === "downsample") {
      result = downsamplePts(
        payload.pts,
        payload.intervalMs,
        payload.aggregate
      );
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
