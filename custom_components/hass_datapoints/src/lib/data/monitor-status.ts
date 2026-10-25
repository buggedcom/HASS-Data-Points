import type {
  DismissedWindow,
  ScanHistoryEntry,
} from "@/lib/data/monitors-api";

/**
 * Monitor display-status model.
 *
 * A single source of truth for the one-word health state a monitor presents in
 * the UI, derived purely from its `enabled` flag and anomaly state. The pill
 * atom (`monitor-status-pill`) renders this; the monitors panel derives it per
 * card. Keep this pure and side-effect free so it is trivially unit-testable.
 */
export type MonitorStatus = "paused" | "healthy" | "warning" | "triggered";

/**
 * The subset of a monitor needed to decide its display status. `AnomalyMonitor`
 * satisfies this structurally, but tests (and the pill's stories) can pass a
 * minimal fixture instead of the full monitor shape.
 */
export interface MonitorStatusInput {
  /** Whether the monitor is actively scanning. Disabled → Paused. */
  enabled: boolean;
  /** Active (undismissed) anomaly clusters from the last scan. */
  last_cluster_count?: number | null;
  /** ISO timestamp of the most recent anomaly ever seen, or null if none. */
  last_anomaly_at?: string | null;
  /** Per-scan anomaly counts; a non-zero count means anomalies were seen. */
  scan_history?: ScanHistoryEntry[];
  /** Detections the user has dismissed; their presence implies past anomalies. */
  dismissed_windows?: DismissedWindow[];
}

/** True when the monitor has seen an anomaly at some point, dismissed or not. */
function hasSeenAnomaly(monitor: MonitorStatusInput): boolean {
  if (monitor.last_anomaly_at) {
    return true;
  }
  if ((monitor.dismissed_windows?.length ?? 0) > 0) {
    return true;
  }
  return (monitor.scan_history ?? []).some((entry) => (entry.count ?? 0) > 0);
}

/**
 * Derive a monitor's display status.
 *
 * Default rule (adjust here if the product rule changes):
 *   1. disabled                                   → Paused
 *   2. active (undismissed) anomaly clusters      → Triggered
 *   3. anomalies seen before but none active now  → Warning
 *   4. otherwise                                  → Healthy
 *
 * Paused always wins: a disabled monitor is not scanning, so its stale anomaly
 * state should not surface as Triggered/Warning.
 */
export function deriveMonitorStatus(
  monitor: MonitorStatusInput
): MonitorStatus {
  if (!monitor.enabled) {
    return "paused";
  }
  if ((monitor.last_cluster_count ?? 0) > 0) {
    return "triggered";
  }
  if (hasSeenAnomaly(monitor)) {
    return "warning";
  }
  return "healthy";
}
