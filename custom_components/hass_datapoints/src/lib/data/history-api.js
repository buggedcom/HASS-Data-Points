import {
  normalizeCacheIdList,
  withStableRangeCache,
} from "@/lib/data/cache.js";

/**
 * History data access layer.
 */

export function fetchDownsampledHistory(
  hass,
  entityId,
  startTime,
  endTime,
  interval,
  aggregate
) {
  const cacheKey = JSON.stringify({
    type: "hass_datapoints/history",
    entity_id: entityId,
    start_time: startTime,
    end_time: endTime,
    interval,
    aggregate,
  });
  return withStableRangeCache(cacheKey, endTime, () =>
    hass.connection
      .sendMessagePromise({
        type: "hass_datapoints/history",
        entity_id: entityId,
        start_time: startTime,
        end_time: endTime,
        interval,
        aggregate,
      })
      .then((result) => result.pts || [])
  );
}

export function fetchAnomaliesFromBackend(
  hass,
  entityId,
  startTime,
  endTime,
  config
) {
  return hass.connection
    .sendMessagePromise({
      type: "hass_datapoints/anomalies",
      entity_id: entityId,
      start_time: startTime,
      end_time: endTime,
      anomaly_methods: config.anomaly_methods || [],
      anomaly_sensitivity: config.anomaly_sensitivity || "medium",
      anomaly_overlap_mode: config.anomaly_overlap_mode || "all",
      anomaly_rate_window: config.anomaly_rate_window || "1h",
      anomaly_zscore_window: config.anomaly_zscore_window || "24h",
      anomaly_persistence_window: config.anomaly_persistence_window || "1h",
      trend_method: config.trend_method || "rolling_average",
      trend_window: config.trend_window || "24h",
      ...(config.sample_interval && config.sample_interval !== "raw"
        ? {
            sample_interval: config.sample_interval,
            sample_aggregate: config.sample_aggregate || "mean",
          }
        : {}),
      ...(config.comparison_entity_id
        ? {
            comparison_entity_id: config.comparison_entity_id,
            comparison_start_time: config.comparison_start_time,
            comparison_end_time: config.comparison_end_time,
            comparison_time_offset_ms: config.comparison_time_offset_ms || 0,
          }
        : {}),
    })
    .then((result) => result.anomaly_clusters || []);
}

export async function fetchHistoryDuringPeriod(
  hass,
  startTime,
  endTime,
  entityIds,
  options = {}
) {
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
  return withStableRangeCache(cacheKey, endTime, () =>
    hass.connection.sendMessagePromise({
      type: "history/history_during_period",
      start_time: startTime,
      end_time: endTime,
      entity_ids: normalizedEntityIds,
      include_start_time_state: options.include_start_time_state !== false,
      significant_changes_only: !!options.significant_changes_only,
      no_attributes: options.no_attributes !== false,
    })
  );
}
