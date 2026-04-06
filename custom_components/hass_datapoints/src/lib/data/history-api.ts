import { normalizeCacheIdList, withStableRangeCache } from "@/lib/data/cache";
import type { HassLike } from "@/lib/types";

/**
 * History data access layer.
 */

export interface BackendAnomalyConfig {
  anomaly_methods?: string[];
  anomaly_sensitivity?: string;
  anomaly_overlap_mode?: string;
  anomaly_rate_window?: string;
  anomaly_zscore_window?: string;
  anomaly_persistence_window?: string;
  trend_method?: string;
  trend_window?: string;
  anomaly_use_sampled_data?: boolean;
  sample_interval?: Nullable<string>;
  sample_aggregate?: Nullable<string>;
  comparison_entity_id?: Nullable<string>;
  comparison_start_time?: Nullable<string>;
  comparison_end_time?: Nullable<string>;
  comparison_time_offset_ms?: number;
}

export interface HistoryPeriodOptions {
  include_start_time_state?: boolean;
  significant_changes_only?: boolean;
  no_attributes?: boolean;
}

interface DownsampledHistoryResult<TPoint> {
  pts?: TPoint[];
}

interface BackendAnomalyResult<TCluster> {
  anomaly_clusters?: TCluster[];
}

export function fetchDownsampledHistory<TPoint = unknown>(
  hass: Pick<HassLike, "connection">,
  entityId: string,
  startTime: string,
  endTime: string,
  interval: string,
  aggregate: string
): Promise<TPoint[]> {
  const cacheKey = JSON.stringify({
    type: "hass_datapoints/history",
    entity_id: entityId,
    start_time: startTime,
    end_time: endTime,
    interval,
    aggregate,
  });

  return withStableRangeCache(cacheKey, endTime, () => hass.connection
      .sendMessagePromise({
        type: "hass_datapoints/history",
        entity_id: entityId,
        start_time: startTime,
        end_time: endTime,
        interval,
        aggregate,
      })
      .then((result) => ((result as DownsampledHistoryResult<TPoint>).pts || []) as TPoint[]));
}

export function fetchAnomaliesFromBackend<TCluster = unknown>(
  hass: Pick<HassLike, "connection">,
  entityId: string,
  startTime: string,
  endTime: string,
  config: BackendAnomalyConfig
): Promise<TCluster[]> {
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
      ...(config.anomaly_use_sampled_data !== false &&
      config.sample_interval &&
      config.sample_interval !== "raw"
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
    .then((result) => ((result as BackendAnomalyResult<TCluster>).anomaly_clusters || []) as TCluster[]);
}

export async function fetchHistoryDuringPeriod<TResponse = unknown>(
  hass: Pick<HassLike, "connection">,
  startTime: string,
  endTime: string,
  entityIds: unknown,
  options: HistoryPeriodOptions = {}
): Promise<TResponse> {
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
    }) as Promise<TResponse>);
}
