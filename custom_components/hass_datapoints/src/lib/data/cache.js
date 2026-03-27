/**
 * Shared cache utilities for history/statistics/event lookups.
 */

export const DATA_RANGE_CACHE_TTL_MS = 10 * 60 * 1000;
export const DATA_RANGE_CACHE_LIVE_EDGE_MS = 5 * 60 * 1000;
const _dataRangeCache = new Map();

export function normalizeCacheIdList(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))].sort();
}

export function shouldUseStableRangeCache(endTime) {
  const endMs = new Date(endTime || 0).getTime();
  if (!Number.isFinite(endMs)) {
    return false;
  }
  return endMs < (Date.now() - DATA_RANGE_CACHE_LIVE_EDGE_MS);
}

function getCachedRangePromise(key) {
  const entry = _dataRangeCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    _dataRangeCache.delete(key);
    return null;
  }
  return entry.promise;
}

function setCachedRangePromise(key, promise) {
  _dataRangeCache.set(key, {
    promise,
    expiresAt: Date.now() + DATA_RANGE_CACHE_TTL_MS,
  });
  return promise;
}

export function withStableRangeCache(key, endTime, loader) {
  if (!shouldUseStableRangeCache(endTime)) {
    return Promise.resolve().then(loader);
  }
  const cached = getCachedRangePromise(key);
  if (cached) {
    return cached;
  }
  const promise = Promise.resolve()
    .then(loader)
    .catch((err) => {
      _dataRangeCache.delete(key);
      throw err;
    });
  return setCachedRangePromise(key, promise);
}

export function clearStableRangeCacheMatching(predicate) {
  if (typeof predicate !== "function") {
    return 0;
  }
  let deletedCount = 0;
  [..._dataRangeCache.keys()].forEach((key) => {
    if (predicate(key) === true) {
      _dataRangeCache.delete(key);
      deletedCount += 1;
    }
  });
  return deletedCount;
}
