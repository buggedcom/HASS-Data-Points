import { normalizeCacheIdList, withStableRangeCache } from "./cache.js";

/**
 * History data access layer.
 */

export async function fetchHistoryDuringPeriod(hass, startTime, endTime, entityIds, options = {}) {
  const normalizedEntityIds = normalizeCacheIdList(entityIds);
  const cacheKey = JSON.stringify({
    type: "history/history_during_period",
    start_time: startTime,
    end_time: endTime,
    entity_ids: normalizedEntityIds,
    include_start_time_state: options.include_start_time_state !== false,
    significant_changes_only: !!options.significant_changes_only,
    no_attributes: options.no_attributes !== false,
  });
  return withStableRangeCache(cacheKey, endTime, () => hass.connection.sendMessagePromise({
    type: "history/history_during_period",
    start_time: startTime,
    end_time: endTime,
    entity_ids: normalizedEntityIds,
    include_start_time_state: options.include_start_time_state !== false,
    significant_changes_only: !!options.significant_changes_only,
    no_attributes: options.no_attributes !== false,
  }));
}
