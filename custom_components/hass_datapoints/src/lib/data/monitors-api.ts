import { DOMAIN } from "@/constants";
import type { HassLike } from "@/lib/types";

/**
 * Anomaly Monitors data access layer.
 */

declare const logger: {
  warn: (...args: unknown[]) => void;
};

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

interface MonitorBase {
  id: string;
  type: MonitorType;
  name: string;
  enabled: boolean;
  look_back_hours: number;
  scan_interval_minutes: number;
  created_at: string;
  last_scan_at: string | null;
  last_anomaly_at: string | null;
  last_cluster_count: number;
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
  sample_interval: string | null;
  sample_aggregate: string;
  anomaly_use_sampled_data: boolean;
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
  anomaly_trend_method?: string;
  anomaly_trend_window?: string;
  sample_interval?: string;
  sample_aggregate?: string;
  anomaly_use_sampled_data?: boolean;
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
