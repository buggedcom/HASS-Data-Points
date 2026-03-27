import { normalizeCacheIdList, withStableRangeCache } from "./cache.js";

/**
 * Statistics data access layer.
 */

export async function fetchStatisticsDuringPeriod(hass, startTime, endTime, statisticIds, options = {}) {
  const normalizedStatisticIds = normalizeCacheIdList(statisticIds);
  const normalizedTypes = normalizeCacheIdList(options.types);
  const cacheKey = JSON.stringify({
    type: "recorder/statistics_during_period",
    start_time: startTime,
    end_time: endTime,
    statistic_ids: normalizedStatisticIds,
    period: options.period || "hour",
    types: normalizedTypes,
  });
  return withStableRangeCache(cacheKey, endTime, () => hass.connection.sendMessagePromise({
    type: "recorder/statistics_during_period",
    start_time: startTime,
    end_time: endTime,
    statistic_ids: normalizedStatisticIds,
    period: options.period || "hour",
    types: normalizedTypes,
    units: options.units || {},
  }));
}
