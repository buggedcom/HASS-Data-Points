import { DOMAIN } from "@/constants";
import { logger } from "@/lib/logger";
import type { HassLike } from "@/lib/types";

/**
 * Anomaly Monitors data access layer.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MonitorType = "individual" | "combined";
/** "all", "any", "any_N" (N>=2), or legacy "any_two_plus" */
export type OverlapMode = string;

export interface ScanHistoryEntry {
  t: string;
  count: number;
}

export interface DismissedWindow {
  id: string;
  start_ms: number;
  end_ms: number;
  dismissed_at: string;
  /** ISO datetime string, or null for permanent dismissal. */
  expires_at: string | null;
}

export interface AnomalyCluster {
  points: Array<{ timeMs: number; value: number; [k: string]: unknown }>;
  maxDeviation: number;
  anomalyMethod: string;
  [k: string]: unknown;
}

export interface MonitorAnomaliesResult {
  monitor_id: string;
  anomaly_clusters: AnomalyCluster[];
  dismissed_windows: DismissedWindow[];
  cluster_count: number;
}

export interface AnomalyActivityBucket {
  start_ms: number;
  end_ms: number;
  /** Anomalous readings inside this bucket. */
  anomaly_count: number;
  /** Incidents (clusters) that start inside this bucket. */
  incident_count: number;
}

export interface EntityAnomalyActivity {
  entity_id: string;
  /** Anomalous readings for this entity across the whole range. */
  total: number;
  incident_count: number;
  /** Contiguous, zero-filled buckets covering [start_ms, end_ms). */
  buckets: AnomalyActivityBucket[];
}

export interface MonitorAnomalyActivityResult {
  monitor_id: string;
  start_ms: number;
  end_ms: number;
  bucket_ms: number;
  total_anomalies: number;
  /** Combined monitors: overlap incidents; individual: sum of entity incidents. */
  incident_count: number;
  entities: EntityAnomalyActivity[];
}

interface MonitorBase {
  id: string;
  deleted_at?: string | null;
  type: MonitorType;
  name: string;
  enabled: boolean;
  look_back_hours: number;
  scan_interval_minutes: number;
  created_at: string;
  last_scan_at: string | null;
  last_anomaly_at: string | null;
  last_cluster_count: number;
  /**
   * Undismissed cluster count as of the last scan (dismissal-aware). The store
   * backfills it from `last_cluster_count` for records created before the field
   * existed, so it is optional on the wire.
   */
  active_cluster_count?: number;
  last_scan_data_points: number | null;
  scan_history: ScanHistoryEntry[];
  /** HA device registry ID — populated by the backend list endpoint. */
  device_id: string | null;
  anomaly_methods: string[];
  anomaly_sensitivity: string;
  anomaly_overlap_mode: string;
  anomaly_rate_window: string;
  anomaly_zscore_window: string;
  anomaly_persistence_window: string;
  anomaly_trend_method: string;
  anomaly_trend_window: string;
  // Per-method direction filter (#62). Optional: monitors created before the
  // feature omit them and default to "both".
  anomaly_trend_residual_direction?: string;
  anomaly_rate_of_change_direction?: string;
  anomaly_iqr_direction?: string;
  anomaly_rolling_zscore_direction?: string;
  anomaly_comparison_window_direction?: string;
  sample_interval: string | null;
  sample_aggregate: string;
  anomaly_use_sampled_data: boolean;
  baseline_entity_id: string | null;
  baseline_time_offset_hours: number;
  dismissed_windows: DismissedWindow[];
}

export interface IndividualMonitor extends MonitorBase {
  type: "individual";
  entity_id: string;
}

export interface CombinedMonitor extends MonitorBase {
  type: "combined";
  entity_ids: string[];
  overlap_mode: OverlapMode;
}

export type AnomalyMonitor = IndividualMonitor | CombinedMonitor;

export interface CreateMonitorPayload {
  monitor_type: MonitorType;
  name: string;
  entity_id?: string;
  entity_ids?: string[];
  look_back_hours?: number;
  scan_interval_minutes?: number;
  overlap_mode?: OverlapMode;
  enabled?: boolean;
  anomaly_methods?: string[];
  anomaly_sensitivity?: string;
  anomaly_overlap_mode?: string;
  anomaly_rate_window?: string;
  anomaly_zscore_window?: string;
  anomaly_persistence_window?: string;
  anomaly_trend_residual_direction?: string;
  anomaly_rate_of_change_direction?: string;
  anomaly_iqr_direction?: string;
  anomaly_rolling_zscore_direction?: string;
  anomaly_comparison_window_direction?: string;
  anomaly_trend_method?: string;
  anomaly_trend_window?: string;
  sample_interval?: string;
  sample_aggregate?: string;
  anomaly_use_sampled_data?: boolean;
  baseline_entity_id?: string | null;
  baseline_time_offset_hours?: number;
}

export type UpdateMonitorPayload = Partial<
  Omit<CreateMonitorPayload, "monitor_type">
> & {
  monitor_id: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return all entity IDs associated with a monitor (works for both types). */
export function monitorEntityIds(monitor: AnomalyMonitor): string[] {
  if (monitor.type === "combined") {
    return (monitor as CombinedMonitor).entity_ids;
  }
  return [(monitor as IndividualMonitor).entity_id];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

interface MonitorsListResult {
  monitors?: AnomalyMonitor[];
}

interface MonitorResult {
  monitor?: AnomalyMonitor;
}

export async function fetchMonitors(
  hass: Pick<HassLike, "connection">
): Promise<AnomalyMonitor[]> {
  try {
    const result = (await hass.connection.sendMessagePromise({
      type: `${DOMAIN}/monitors/list`,
    })) as MonitorsListResult;
    return result.monitors ?? [];
  } catch (err) {
    logger.warn("[hass-datapoints] fetchMonitors failed:", err);
    return [];
  }
}

export async function createMonitor(
  hass: Pick<HassLike, "connection">,
  payload: CreateMonitorPayload
): Promise<AnomalyMonitor> {
  const result = (await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/create`,
    ...payload,
  })) as MonitorResult;
  if (!result.monitor) {
    throw new Error("createMonitor: no monitor in response");
  }
  return result.monitor;
}

export async function updateMonitor(
  hass: Pick<HassLike, "connection">,
  payload: UpdateMonitorPayload
): Promise<AnomalyMonitor> {
  const result = (await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/update`,
    ...payload,
  })) as MonitorResult;
  if (!result.monitor) {
    throw new Error("updateMonitor: no monitor in response");
  }
  return result.monitor;
}

export async function deleteMonitor(
  hass: Pick<HassLike, "connection">,
  monitorId: string
): Promise<void> {
  await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/delete`,
    monitor_id: monitorId,
  });
}

export async function restoreMonitor(
  hass: Pick<HassLike, "connection">,
  monitorId: string
): Promise<AnomalyMonitor> {
  const result = (await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/restore`,
    monitor_id: monitorId,
  })) as MonitorResult;
  if (!result.monitor) {
    throw new Error("restoreMonitor: no monitor in response");
  }
  return result.monitor;
}

export async function purgeMonitor(
  hass: Pick<HassLike, "connection">,
  monitorId: string
): Promise<void> {
  await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/purge`,
    monitor_id: monitorId,
  });
}

export async function fetchDeletedMonitors(
  hass: Pick<HassLike, "connection">
): Promise<AnomalyMonitor[]> {
  try {
    const result = (await hass.connection.sendMessagePromise({
      type: `${DOMAIN}/monitors/trash/list`,
    })) as MonitorsListResult;
    return result.monitors ?? [];
  } catch (err) {
    logger.warn("[hass-datapoints] fetchDeletedMonitors failed:", err);
    return [];
  }
}

export async function fetchMonitorAnomalies(
  hass: Pick<HassLike, "connection">,
  monitorId: string
): Promise<MonitorAnomaliesResult> {
  const result = (await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/anomalies`,
    monitor_id: monitorId,
  })) as MonitorAnomaliesResult;
  return result;
}

/**
 * Per-entity anomaly activity buckets and counts for a monitor over an
 * arbitrary range, using the monitor's own detection config.
 * @param startMs Range start (epoch ms, inclusive).
 * @param endMs Range end (epoch ms, exclusive).
 * @param bucketCount Number of buckets per entity; server default (48) if omitted.
 */
export async function fetchMonitorAnomalyActivity(
  hass: Pick<HassLike, "connection">,
  monitorId: string,
  startMs: number,
  endMs: number,
  bucketCount?: number
): Promise<MonitorAnomalyActivityResult> {
  const payload: Record<string, unknown> = {
    type: `${DOMAIN}/monitors/anomaly_activity`,
    monitor_id: monitorId,
    start_time: new Date(startMs).toISOString(),
    end_time: new Date(endMs).toISOString(),
  };
  if (bucketCount !== undefined) {
    payload.bucket_count = bucketCount;
  }
  return (await hass.connection.sendMessagePromise(
    payload
  )) as MonitorAnomalyActivityResult;
}

/**
 * Dismiss an anomaly cluster window.
 * @param expiresAt ISO datetime string for expiry, or null for permanent, or
 *   undefined to use the server default (2× look_back_hours).
 */
export async function dismissMonitorAnomaly(
  hass: Pick<HassLike, "connection">,
  monitorId: string,
  startMs: number,
  endMs: number,
  expiresAt?: string | null
): Promise<AnomalyMonitor> {
  const payload: Record<string, unknown> = {
    type: `${DOMAIN}/monitors/dismiss`,
    monitor_id: monitorId,
    start_ms: startMs,
    end_ms: endMs,
  };
  if (expiresAt !== undefined) {
    payload.expires_at = expiresAt;
  }
  const result = (await hass.connection.sendMessagePromise(
    payload
  )) as MonitorResult;
  if (!result.monitor) {
    throw new Error("dismissMonitorAnomaly: no monitor in response");
  }
  return result.monitor;
}

export async function undismissMonitorAnomaly(
  hass: Pick<HassLike, "connection">,
  monitorId: string,
  windowId: string
): Promise<AnomalyMonitor> {
  const result = (await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/monitors/undismiss`,
    monitor_id: monitorId,
    window_id: windowId,
  })) as MonitorResult;
  if (!result.monitor) {
    throw new Error("undismissMonitorAnomaly: no monitor in response");
  }
  return result.monitor;
}
