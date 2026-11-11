import { DATA_RANGE_CACHE_LIVE_EDGE_MS } from "@/lib/data/cache";
import {
  detectionErrorCode,
  type DetectionErrorCode,
} from "@/lib/data/detection-errors";
import type {
  AnomalyMonitor,
  CombinedMonitor,
  DismissedWindow,
  IndividualMonitor,
  MonitorAnomalyActivityResult,
} from "@/lib/data/monitors-api";

/**
 * Range-scoped monitor activity, decoupled from monitor-list polling.
 *
 * The monitors panel polls the cheap monitor list every 30 seconds and on
 * every `monitors_updated` event (each scan publishes one). Activity, however,
 * runs full detection on the backend, so it must only be requested when the
 * *answer* could change: a new range, a detection/sampling config change, a
 * change in the effective dismissals (including one expiring), a live-edge
 * success going stale, or an explicit retry. Name, scan status and counts are
 * deliberately not part of that identity.
 */

/** How long a success for a range touching "now" stays fresh. */
export const LIVE_ACTIVITY_TTL_MS = 60_000;

export interface ActivityRange {
  startMs: number;
  endMs: number;
}

/** What an activity result depends on, plus how long a success stays valid. */
export interface ActivityIdentity {
  key: string;
  /** Epoch ms at which a success for this identity must be refetched, if ever. */
  validUntil: Nullable<number>;
}

/** Tagged per-monitor state; one variant at a time, never contradictory flags. */
export type ActivityState =
  | {
      status: "loading";
      identity: string;
      stale: Nullable<MonitorAnomalyActivityResult>;
    }
  | {
      status: "success";
      identity: string;
      result: MonitorAnomalyActivityResult;
      validUntil: Nullable<number>;
    }
  | {
      status: "error";
      identity: string;
      code: DetectionErrorCode;
      stale: Nullable<MonitorAnomalyActivityResult>;
    };

/** Detection/sampling fields that change what activity detection computes. */
const DETECTION_FIELDS = [
  "type",
  "anomaly_methods",
  "anomaly_sensitivity",
  "anomaly_overlap_mode",
  "anomaly_rate_window",
  "anomaly_zscore_window",
  "anomaly_persistence_window",
  "anomaly_trend_method",
  "anomaly_trend_window",
  "anomaly_trend_residual_direction",
  "anomaly_rate_of_change_direction",
  "anomaly_iqr_direction",
  "anomaly_rolling_zscore_direction",
  "anomaly_comparison_window_direction",
  "sample_interval",
  "sample_aggregate",
  "anomaly_use_sampled_data",
  "baseline_entity_id",
  "baseline_time_offset_hours",
] as const;

function expiresAtMs(window: DismissedWindow): Nullable<number> {
  if (window.expires_at === null || window.expires_at === undefined) {
    return null;
  }
  const ms = Date.parse(window.expires_at);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** Dismissals still in effect at ``nowMs`` (permanent or not yet expired). */
export function effectiveDismissals(
  windows: DismissedWindow[] | undefined,
  nowMs: number
): DismissedWindow[] {
  return (windows ?? []).filter((window) => {
    const expires = expiresAtMs(window);
    return expires === null || expires > nowMs;
  });
}

function isLiveRange(range: ActivityRange, nowMs: number): boolean {
  return range.endMs >= nowMs - DATA_RANGE_CACHE_LIVE_EDGE_MS;
}

/**
 * Identity of the activity answer for one monitor/range/bucket count at
 * ``nowMs``. ``validUntil`` is the earlier of the next dismissal expiry and,
 * for a live-edge range, the live TTL measured from ``nowMs``.
 */
export function activityIdentity(
  monitor: AnomalyMonitor,
  range: ActivityRange,
  bucketCount: Nullable<number>,
  nowMs: number
): ActivityIdentity {
  const dismissals = effectiveDismissals(monitor.dismissed_windows, nowMs);
  const record = monitor as unknown as Record<string, unknown>;
  const detection: Record<string, unknown> = {};
  for (const field of DETECTION_FIELDS) {
    const value = record[field];
    detection[field] =
      field === "anomaly_methods" && Array.isArray(value)
        ? [...value].sort()
        : (value ?? null);
  }
  const entities =
    monitor.type === "combined"
      ? [...((monitor as CombinedMonitor).entity_ids ?? [])]
      : [(monitor as IndividualMonitor).entity_id];
  if (monitor.type === "combined") {
    detection.overlap_mode = (monitor as CombinedMonitor).overlap_mode ?? null;
  }
  const key = JSON.stringify({
    id: monitor.id,
    start: range.startMs,
    end: range.endMs,
    buckets: bucketCount,
    entities,
    detection,
    dismissals: dismissals
      .map((w) => [w.id, w.start_ms, w.end_ms])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  });

  const expiries = dismissals
    .map(expiresAtMs)
    .filter((ms): ms is number => ms !== null && Number.isFinite(ms));
  const candidates = [...expiries];
  if (isLiveRange(range, nowMs)) {
    candidates.push(nowMs + LIVE_ACTIVITY_TTL_MS);
  }
  return {
    key,
    validUntil: candidates.length > 0 ? Math.min(...candidates) : null,
  };
}

export interface ActivityFetcher {
  fetch(
    monitorId: string,
    range: ActivityRange,
    bucketCount: Nullable<number>,
    requestId: string
  ): Promise<MonitorAnomalyActivityResult>;
  cancel(requestId: string): void;
  createRequestId(): string;
}

interface InFlight {
  identity: string;
  requestId: string;
}

/**
 * Owns activity requests for one component instance.
 *
 * ``sync`` is cheap and idempotent: call it on every list refresh, range
 * change or poll tick. It starts at most one request per monitor whose
 * identity changed (or whose success expired), coalesces identical in-flight
 * requests, cancels a monitor's superseded request, and never retries a
 * failure on its own. Successes are cached for the component's lifetime.
 */
export class MonitorActivityController {
  private readonly _states = new Map<string, ActivityState>();

  private readonly _inFlight = new Map<string, InFlight>();

  private readonly _cache = new Map<
    string,
    { result: MonitorAnomalyActivityResult; validUntil: Nullable<number> }
  >();

  private _disposed = false;

  private _expiryTimer: Nullable<ReturnType<typeof setTimeout>> = null;

  /**
   * @param _onExpire Called when the earliest success expires (live-edge TTL
   *   or a dismissal expiry), so the owner can re-``sync`` with fresh inputs
   *   instead of waiting for its next poll.
   */
  constructor(
    private readonly _fetcher: ActivityFetcher,
    private readonly _onChange: () => void,
    private readonly _now: () => number = Date.now,
    private readonly _onExpire: Nullable<() => void> = null
  ) {}

  state(monitorId: string): Nullable<ActivityState> {
    return this._states.get(monitorId) ?? null;
  }

  /** Bring every enabled monitor's activity in line with the current inputs. */
  sync(
    monitors: AnomalyMonitor[],
    range: Nullable<ActivityRange>,
    bucketCount: Nullable<number> = null
  ): void {
    if (this._disposed) {
      return;
    }
    let changed = false;
    const live = new Set<string>();
    if (range) {
      const nowMs = this._now();
      for (const monitor of monitors) {
        if (!monitor.enabled) {
          continue;
        }
        live.add(monitor.id);
        changed =
          this._syncMonitor(monitor, range, bucketCount, nowMs, false) ||
          changed;
      }
    }
    // Paused, removed, or (no range) monitors: cancel and forget.
    for (const monitorId of [
      ...this._states.keys(),
      ...this._inFlight.keys(),
    ]) {
      if (!live.has(monitorId)) {
        this._cancelInFlight(monitorId);
        changed = this._states.delete(monitorId) || changed;
      }
    }
    if (changed) {
      this._onChange();
    }
    this._scheduleExpiry();
  }

  /** Explicit retry for one monitor (the only way a failure is refetched). */
  retry(
    monitor: AnomalyMonitor,
    range: Nullable<ActivityRange>,
    bucketCount: Nullable<number> = null
  ): void {
    if (this._disposed || !range || !monitor.enabled) {
      return;
    }
    if (this._syncMonitor(monitor, range, bucketCount, this._now(), true)) {
      this._onChange();
    }
  }

  /** Cancel everything and stop accepting work (component disconnect). */
  dispose(): void {
    this._disposed = true;
    this._clearExpiry();
    for (const monitorId of [...this._inFlight.keys()]) {
      this._cancelInFlight(monitorId);
    }
    this._states.clear();
    this._cache.clear();
  }

  private _syncMonitor(
    monitor: AnomalyMonitor,
    range: ActivityRange,
    bucketCount: Nullable<number>,
    nowMs: number,
    force: boolean
  ): boolean {
    const identity = activityIdentity(monitor, range, bucketCount, nowMs);
    const current = this._states.get(monitor.id);
    const inFlight = this._inFlight.get(monitor.id);

    if (inFlight && inFlight.identity === identity.key) {
      return false; // coalesce identical in-flight request
    }
    if (current && current.identity === identity.key && !force) {
      if (current.status === "error") {
        return false; // never auto-retry a failure
      }
      if (
        current.status === "success" &&
        (current.validUntil === null || current.validUntil > nowMs)
      ) {
        return false;
      }
    }

    const cached = this._cache.get(identity.key);
    if (
      cached &&
      !force &&
      (cached.validUntil === null || cached.validUntil > nowMs)
    ) {
      this._cancelInFlight(monitor.id);
      this._states.set(monitor.id, {
        status: "success",
        identity: identity.key,
        result: cached.result,
        validUntil: cached.validUntil,
      });
      return true;
    }

    // Keep the previous payload only as explicitly stale for the same identity.
    let stale: Nullable<MonitorAnomalyActivityResult> = null;
    if (current && current.identity === identity.key) {
      stale = current.status === "success" ? current.result : current.stale;
    }
    this._cancelInFlight(monitor.id);
    this._states.set(monitor.id, {
      status: "loading",
      identity: identity.key,
      stale,
    });
    this._start(monitor.id, identity, range, bucketCount);
    return true;
  }

  private _start(
    monitorId: string,
    identity: ActivityIdentity,
    range: ActivityRange,
    bucketCount: Nullable<number>
  ): void {
    const requestId = this._fetcher.createRequestId();
    this._inFlight.set(monitorId, { identity: identity.key, requestId });
    const isCurrent = () =>
      !this._disposed && this._inFlight.get(monitorId)?.requestId === requestId;

    this._fetcher.fetch(monitorId, range, bucketCount, requestId).then(
      (result) => {
        if (!isCurrent()) {
          return;
        }
        this._inFlight.delete(monitorId);
        if (!Array.isArray(result?.entities)) {
          this._fail(monitorId, identity.key, "detection_error");
          return;
        }
        this._cache.set(identity.key, {
          result,
          validUntil: identity.validUntil,
        });
        this._states.set(monitorId, {
          status: "success",
          identity: identity.key,
          result,
          validUntil: identity.validUntil,
        });
        this._onChange();
        this._scheduleExpiry();
      },
      (err: unknown) => {
        if (!isCurrent()) {
          return;
        }
        this._inFlight.delete(monitorId);
        this._fail(monitorId, identity.key, detectionErrorCode(err));
      }
    );
  }

  private _fail(
    monitorId: string,
    identity: string,
    code: DetectionErrorCode
  ): void {
    const current = this._states.get(monitorId);
    const stale =
      current && current.identity === identity && current.status === "loading"
        ? current.stale
        : null;
    this._states.set(monitorId, { status: "error", identity, code, stale });
    this._onChange();
  }

  private _clearExpiry(): void {
    if (this._expiryTimer !== null) {
      clearTimeout(this._expiryTimer);
      this._expiryTimer = null;
    }
  }

  /** Arm one timer for the earliest success expiry across all monitors. */
  private _scheduleExpiry(): void {
    this._clearExpiry();
    if (this._disposed || !this._onExpire) {
      return;
    }
    let earliest: Nullable<number> = null;
    for (const state of this._states.values()) {
      if (state.status === "success" && state.validUntil !== null) {
        earliest =
          earliest === null
            ? state.validUntil
            : Math.min(earliest, state.validUntil);
      }
    }
    if (earliest === null) {
      return;
    }
    const onExpire = this._onExpire;
    this._expiryTimer = setTimeout(
      () => {
        this._expiryTimer = null;
        onExpire();
      },
      Math.max(0, earliest - this._now()) + 1
    );
  }

  private _cancelInFlight(monitorId: string): void {
    const inFlight = this._inFlight.get(monitorId);
    if (inFlight) {
      this._inFlight.delete(monitorId);
      this._fetcher.cancel(inFlight.requestId);
    }
  }
}
