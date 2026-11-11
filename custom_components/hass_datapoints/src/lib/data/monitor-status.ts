import type {
  DismissedWindow,
  ScanHistoryEntry,
  ScanStatus,
} from "@/lib/data/monitors-api";
import {
  SCAN_ERROR_UNVERIFIED,
  type ScanErrorCode,
} from "@/lib/data/detection-errors";

/**
 * Monitor display-status model.
 *
 * A single source of truth for the one-word health state a monitor presents in
 * the UI, derived purely from its `enabled` flag and anomaly state. The pill
 * atom (`monitor-status-pill`) renders this; the monitors panel derives it per
 * card. Keep this pure and side-effect free so it is trivially unit-testable.
 */
export type MonitorStatus =
  | "paused"
  | "healthy"
  | "unverified"
  | "warning"
  | "triggered";

/**
 * Health of the monitor's *scanning*, kept separate from its anomaly state.
 *
 * - ok:         the latest scan succeeded (or one is running after a success)
 * - running:    a scan is running after a success; results still verified
 * - unverified: no successful scan since load/upgrade/config change
 * - failed:     the latest scan (or the one before the running one) failed;
 *               counts are the last successful scan's, not current
 * - paused:     the monitor is disabled
 */
export type ScanHealth = "ok" | "running" | "unverified" | "failed" | "paused";

/**
 * The subset of a monitor needed to decide its display status. `AnomalyMonitor`
 * satisfies this structurally, but tests (and the pill's stories) can pass a
 * minimal fixture instead of the full monitor shape.
 */
export interface MonitorStatusInput {
  /** Whether the monitor is actively scanning. Disabled → Paused. */
  enabled: boolean;
  /**
   * Undismissed anomaly clusters as of the last scan. This is the backend's
   * dismissal-aware count (the same field its binary sensor uses), so it is the
   * correct signal for Triggered. It is only recomputed on each scan, so a
   * dismissal made between scans is not reflected until the next scan.
   */
  active_cluster_count?: number | null;
  /** Raw cluster count from the last scan; fallback when active count is absent. */
  last_cluster_count?: number | null;
  /** ISO timestamp of the most recent anomaly ever seen, or null if none. */
  last_anomaly_at?: string | null;
  /** Per-scan anomaly counts; a non-zero count means anomalies were seen. */
  scan_history?: ScanHistoryEntry[];
  /** Detections the user has dismissed; their presence implies past anomalies. */
  dismissed_windows?: DismissedWindow[];
  /** Latest scan outcome; absent on legacy records (treated as unknown). */
  last_scan_status?: ScanStatus | null;
  /** Failure code of the latest attempt (kept while a retry scan is running). */
  last_scan_error?: ScanErrorCode | null;
}

/** Mirrors FAILED_SCAN_STATUSES in the backend's detection_runner.py. */
const FAILED_SCAN_STATUSES: ReadonlySet<string> = new Set([
  "timeout",
  "error",
  "busy",
  "cancelled",
]);

/** Derive the scanning health shown separately from the anomaly counts. */
export function deriveScanHealth(monitor: MonitorStatusInput): ScanHealth {
  if (!monitor.enabled) {
    return "paused";
  }
  const status = monitor.last_scan_status ?? "unknown";
  if (status === "success") {
    return "ok";
  }
  if (FAILED_SCAN_STATUSES.has(status)) {
    return "failed";
  }
  if (status === "running") {
    const error = monitor.last_scan_error ?? null;
    if (error === null) {
      return "running";
    }
    return error === SCAN_ERROR_UNVERIFIED ? "unverified" : "failed";
  }
  return "unverified";
}

/** Undismissed cluster count, preferring the dismissal-aware backend field. */
function activeClusterCount(monitor: MonitorStatusInput): number {
  return monitor.active_cluster_count ?? monitor.last_cluster_count ?? 0;
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
 *   3. latest scan failed or not yet verified     → Unverified
 *   4. anomalies seen before but none active now  → Warning
 *   5. otherwise                                  → Healthy
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
  if (activeClusterCount(monitor) > 0) {
    // Last-known anomalies stay visible even when the latest scan failed; the
    // separate scan-health line says they are not current.
    return "triggered";
  }
  const health = deriveScanHealth(monitor);
  if (health === "unverified" || health === "failed") {
    // Never present an unverified zero as Healthy.
    return "unverified";
  }
  if (hasSeenAnomaly(monitor)) {
    return "warning";
  }
  return "healthy";
}
