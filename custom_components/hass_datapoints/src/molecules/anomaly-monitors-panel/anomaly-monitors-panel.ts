import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";
import { COLORS, DOMAIN } from "@/constants";
import { localized, msg } from "@/lib/i18n/localize";
import { fmtDateTimeRange, fmtRelativeTime } from "@/lib/util/format";

import { styles } from "./anomaly-monitors-panel.styles";
import {
  fetchMonitors,
  fetchDeletedMonitors,
  updateMonitor,
  deleteMonitor,
  restoreMonitor,
  purgeMonitor,
  monitorEntityIds,
  fetchMonitorAnomalies,
  fetchMonitorAnomalyActivity,
  dismissMonitorAnomaly,
  undismissMonitorAnomaly,
  type AnomalyMonitor,
  type CombinedMonitor,
  type AnomalyCluster,
  type MonitorAnomalyActivityResult,
  type DismissedWindow,
} from "@/lib/data/monitors-api";
import type { HassLike } from "@/lib/types";
import type {
  MonitorsOpenChartDetail,
  MonitorsOpenEntityDetail,
} from "@/lib/events";
import { HOUR_MS } from "@/lib/timeline/timeline-scale";
import { confirmDestructiveAction } from "@/lib/ha/ha-components";
import {
  deriveMonitorStatus,
  type MonitorStatus,
} from "@/lib/data/monitor-status";
import "@/molecules/anomaly-monitor-wizard/anomaly-monitor-wizard";
import "@/atoms/form/entity-chip/entity-chip";
import "@/atoms/display/monitor-status-pill/monitor-status-pill";
import "@/molecules/monitor-entity-heatmap/monitor-entity-heatmap";
import type { HeatmapBlockClickDetail } from "@/molecules/monitor-entity-heatmap/monitor-entity-heatmap";

/**
 * Fallback detection methods when a monitor has no configured methods. Mirrors
 * the chart-side default so the overlay still renders anomalies for a monitor
 * that somehow stored an empty method list.
 */
const PANEL_DEFAULT_ANOMALY_METHODS = ["trend_residual"];

/** The monitor's detection methods, or the panel default when it has none. */
function monitorAnomalyMethods(monitor: AnomalyMonitor): string[] {
  return Array.isArray(monitor.anomaly_methods) &&
    monitor.anomaly_methods.length > 0
    ? monitor.anomaly_methods
    : PANEL_DEFAULT_ANOMALY_METHODS;
}

/**
 * Stable, non-negative string hash used only to pick a palette slot. Avoids
 * bitwise ops (repo lint bans them) by staying in positive integer arithmetic.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

/**
 * Deterministic series colour for a monitor: the same monitor always maps to
 * the same palette slot, keyed off its first entity id (falling back to its id).
 */
function monitorSeriesColor(monitor: AnomalyMonitor): string {
  const key = monitorEntityIds(monitor)[0] ?? monitor.id;
  return COLORS[hashCode(key) % COLORS.length];
}

/** Format a scan interval in minutes as a compact "N min" / "N h" label. */
function fmtScanInterval(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

/** Format a look-back window in hours as a compact "N h" / "N d" label. */
function fmtLookBack(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) {
    return `${hours / 24} d`;
  }
  return `${hours} h`;
}

/**
 * `anomaly-monitors-panel` shows a management view of all anomaly monitors.
 *
 * @fires dp-monitors-panel-close        — user clicked the back/close button
 * @fires dp-monitors-panel-new          — user clicked "New monitor"
 * @fires dp-monitors-panel-open-chart   — user clicked "View series" or
 *   "View window on chart"
 *   (`{ entityIds: string[]; startMs: number; endMs: number; monitorId: string }`)
 * @fires dp-monitors-panel-open-entity  — user activated an entity chip
 *   (`{ entityId: string; monitorId: string }`)
 * @fires hass-notification              — transient toast (undo after delete,
 *   or a failure message) consumed by HA's global snackbar
 *   (`{ message: string; action?: { text: string; action: () => void } }`)
 */
@localized()
export class AnomalyMonitorsPanel extends LitElement {
  static styles = styles;

  @property({ type: Object }) accessor hass: Nullable<HassLike> = null;

  /** Start of the datapoints timeline's selected range (epoch ms). */
  @property({ type: Number }) accessor rangeStartMs: Nullable<number> = null;

  /** End of the datapoints timeline's selected range (epoch ms). */
  @property({ type: Number }) accessor rangeEndMs: Nullable<number> = null;

  /**
   * Range-scoped per-entity activity per monitor id. A monitor that is paused
   * or whose fetch failed is absent: it renders a flat row, and its stats show
   * 0 (paused) or an unavailable dash (failed / not yet loaded).
   */
  @state() accessor _activity: Map<string, MonitorAnomalyActivityResult> =
    new Map();

  private _activityToken = 0;

  @state() accessor _monitors: AnomalyMonitor[] = [];

  /** Soft-deleted monitors still within the trash retention window. */
  @state() accessor _deletedMonitors: AnomalyMonitor[] = [];

  @state() accessor _loading: boolean = true;

  @state() accessor _editMonitor: AnomalyMonitor | null = null;

  @state() accessor _wizardOpen: boolean = false;

  /** Clusters loaded per monitor ID (only for monitors currently showing anomalies). */
  @state() accessor _monitorClusters: Map<string, AnomalyCluster[]> = new Map();

  /** Monitor IDs currently loading their cluster list. */
  @state() accessor _loadingClusters: Set<string> = new Set();

  /** Tracks which monitor+cluster is showing the dismiss expiry picker. Key: `${monitorId}:${clusterIndex}` */
  @state() accessor _dismissPickerKey: string | null = null;

  /** Monitor id whose header "more actions" overflow menu is currently open. */
  @state() accessor _overflowOpenId: string | null = null;

  /** Whether the document-level listeners that close the overflow menu are active. */
  private _overflowCloseHandlersActive = false;

  private _pollInterval: ReturnType<typeof setInterval> | null = null;

  private _monitorsEventUnsubscribe: Nullable<() => void> = null;

  private _monitorsSubscriptionToken = 0;

  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) {
      this._scheduleLoad();
      this._scheduleMonitorSubscription();
    }
    this._pollInterval = setInterval(() => this._load(), 30_000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._pollInterval !== null) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
    this._teardownMonitorSubscription();
    // Independent of the monitor subscription teardown above: drop the
    // overflow-menu document listeners so a disconnected panel leaks nothing.
    this._closeOverflow();
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has("rangeStartMs") ||
      changedProperties.has("rangeEndMs")
    ) {
      this._scheduleActivityLoad();
    }
    if (changedProperties.has("hass")) {
      this._teardownMonitorSubscription();
      this._scheduleMonitorSubscription();
      this._scheduleLoad();
    }
  }

  private _scheduleLoad() {
    this._load().catch(() => {});
  }

  private _scheduleActivityLoad() {
    this._loadActivity().catch(() => {});
  }

  /** The selected range, or null when the host has not provided a valid one. */
  private _selectedRange(): Nullable<{ startMs: number; endMs: number }> {
    const { rangeStartMs: startMs, rangeEndMs: endMs } = this;
    return typeof startMs === "number" &&
      typeof endMs === "number" &&
      endMs > startMs
      ? { startMs, endMs }
      : null;
  }

  /**
   * Fetch range-scoped per-entity activity for each active monitor. Requests are
   * per monitor (combined monitors are costlier server-side) and a failure for
   * one monitor only drops that monitor to a flat zero row.
   */
  private async _loadActivity() {
    const range = this._selectedRange();
    const hass = this.hass;
    if (!hass || !range) {
      return;
    }
    const token = ++this._activityToken;
    const results = await Promise.all(
      this._monitors.map(async (monitor) => {
        // Paused monitors have no live detection: skip the request entirely.
        if (!monitor.enabled) {
          return null;
        }
        try {
          const result = await fetchMonitorAnomalyActivity(
            hass,
            monitor.id,
            range.startMs,
            range.endMs
          );
          return Array.isArray(result?.entities) ? result : null;
        } catch {
          return null;
        }
      })
    );
    if (token !== this._activityToken) {
      return;
    }
    const next = new Map<string, MonitorAnomalyActivityResult>();
    this._monitors.forEach((monitor, i) => {
      const result = results[i];
      if (result) {
        next.set(monitor.id, result);
      }
    });
    this._activity = next;
  }

  private _scheduleMonitorSubscription() {
    this._ensureMonitorSubscription().catch(() => {});
  }

  private async _ensureMonitorSubscription() {
    if (!this.hass?.connection || this._monitorsEventUnsubscribe) {
      return;
    }

    const token = ++this._monitorsSubscriptionToken;
    try {
      const unsubscribe = await this.hass.connection.subscribeEvents(() => {
        this._scheduleLoad();
      }, `${DOMAIN}_monitors_updated`);
      if (!this.isConnected || token !== this._monitorsSubscriptionToken) {
        unsubscribe();
        return;
      }
      this._monitorsEventUnsubscribe = unsubscribe;
    } catch {
      // ignore
    }
  }

  private _teardownMonitorSubscription() {
    this._monitorsSubscriptionToken += 1;
    if (this._monitorsEventUnsubscribe) {
      this._monitorsEventUnsubscribe();
      this._monitorsEventUnsubscribe = null;
    }
  }

  private async _load() {
    if (!this.hass) {
      return;
    }
    try {
      // Both helpers swallow their own transport errors (→ []), so the active
      // list and the trash list refresh independently in one pass.
      const [active, deleted] = await Promise.all([
        fetchMonitors(this.hass),
        fetchDeletedMonitors(this.hass),
      ]);
      this._monitors = active;
      this._deletedMonitors = deleted;
      this._scheduleActivityLoad();
    } catch {
      // ignore
    } finally {
      this._loading = false;
    }
  }

  private _emit(name: string, detail: unknown = {}) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  /**
   * Surface a transient message via HA's global notification snackbar. HA's
   * frontend listens for `hass-notification` on the DOM and renders its own
   * toast, with an optional action button when `action` is provided.
   */
  private _notify(
    message: string,
    action?: { text: string; action: () => void }
  ) {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: action ? { message, action } : { message },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onNewMonitor() {
    this._editMonitor = null;
    this._wizardOpen = true;
  }

  private _onClose() {
    this._emit("dp-monitors-panel-close");
  }

  private _onEdit(monitor: AnomalyMonitor) {
    this._closeOverflow();
    this._editMonitor = monitor;
    this._wizardOpen = true;
  }

  private _toggleOverflow(monitor: AnomalyMonitor) {
    if (this._overflowOpenId === monitor.id) {
      this._closeOverflow();
    } else {
      this._openOverflow(monitor.id);
    }
  }

  /** Open the given monitor's overflow menu and arm the outside-close listeners. */
  private _openOverflow(id: string) {
    this._overflowOpenId = id;
    if (!this._overflowCloseHandlersActive) {
      document.addEventListener("mousedown", this._onDocumentPointerDown, true);
      document.addEventListener("keydown", this._onDocumentKeyDown, true);
      this._overflowCloseHandlersActive = true;
    }
  }

  /** Close any open overflow menu and remove the outside-close listeners. */
  private _closeOverflow() {
    if (this._overflowOpenId !== null) {
      this._overflowOpenId = null;
    }
    if (this._overflowCloseHandlersActive) {
      document.removeEventListener(
        "mousedown",
        this._onDocumentPointerDown,
        true
      );
      document.removeEventListener("keydown", this._onDocumentKeyDown, true);
      this._overflowCloseHandlersActive = false;
    }
  }

  /** Close the overflow menu on a mousedown outside the menu or its toggle. */
  private readonly _onDocumentPointerDown = (event: MouseEvent) => {
    const insideOverflow = event
      .composedPath()
      .some(
        (node) =>
          node instanceof Element && node.classList.contains("monitor-overflow")
      );
    if (!insideOverflow) {
      this._closeOverflow();
    }
  };

  /** Close the overflow menu when Escape is pressed. */
  private readonly _onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this._closeOverflow();
    }
  };

  private _onOpenEntity(monitor: AnomalyMonitor, entityId: string) {
    const detail: MonitorsOpenEntityDetail = {
      entityId,
      monitorId: monitor.id,
      anomalyMethods: monitorAnomalyMethods(monitor),
      anomalySensitivity: monitor.anomaly_sensitivity,
    };
    this._emit("dp-monitors-panel-open-entity", detail);
  }

  private _onHeatmapBlockClick(
    monitor: AnomalyMonitor,
    detail: HeatmapBlockClickDetail
  ) {
    const chartDetail: MonitorsOpenChartDetail = {
      entityIds: [detail.entityId],
      startMs: detail.startMs,
      endMs: detail.endMs,
      monitorId: monitor.id,
      anomalyMethods: monitorAnomalyMethods(monitor),
      anomalySensitivity: monitor.anomaly_sensitivity,
    };
    this._emit("dp-monitors-panel-open-chart", chartDetail);
  }

  private _onViewSeries(monitor: AnomalyMonitor) {
    const endMs = Date.now();
    const startMs = endMs - (monitor.look_back_hours ?? 24) * HOUR_MS;
    const detail: MonitorsOpenChartDetail = {
      entityIds: monitorEntityIds(monitor),
      startMs,
      endMs,
      monitorId: monitor.id,
      anomalyMethods: monitorAnomalyMethods(monitor),
      anomalySensitivity: monitor.anomaly_sensitivity,
    };
    this._emit("dp-monitors-panel-open-chart", detail);
  }

  private _onWizardClose() {
    this._wizardOpen = false;
    this._editMonitor = null;
  }

  private async _onWizardSaved() {
    this._wizardOpen = false;
    this._editMonitor = null;
    await this._load();
  }

  private async _onToggleEnabled(monitor: AnomalyMonitor) {
    if (!this.hass) return;
    await updateMonitor(this.hass, {
      monitor_id: monitor.id,
      enabled: !monitor.enabled,
    });
    await this._load();
  }

  private async _onDelete(monitor: AnomalyMonitor) {
    if (!this.hass) return;
    this._closeOverflow();

    const confirmed = await confirmDestructiveAction(this, {
      title: msg(`Delete "${monitor.name}"?`),
      message: msg(
        "The monitor device and all its sensors will be removed. You can restore it from Recently deleted for a limited time."
      ),
      confirmLabel: msg("Delete"),
    });
    if (!confirmed) {
      return;
    }

    const id = monitor.id;
    const name = monitor.name;
    // Optimistically drop the card; the soft-delete + undo path reconciles.
    this._monitors = this._monitors.filter((m) => m.id !== id);
    try {
      await deleteMonitor(this.hass, id);
      this._notify(msg(`Deleted "${name}"`), {
        text: msg("Undo"),
        action: () => {
          if (!this.hass) return;
          restoreMonitor(this.hass, id)
            .then(() => this._load())
            .catch(() => this._notify(msg("Could not restore monitor")));
        },
      });
    } catch {
      this._notify(msg("Could not delete monitor"));
    }
    await this._load();
  }

  private async _onRestore(monitor: AnomalyMonitor) {
    if (!this.hass) return;
    try {
      await restoreMonitor(this.hass, monitor.id);
      await this._load();
    } catch {
      this._notify(msg("Could not restore monitor"));
    }
  }

  private async _onPurge(monitor: AnomalyMonitor) {
    if (!this.hass) return;
    const confirmed = await confirmDestructiveAction(this, {
      title: msg(`Permanently delete "${monitor.name}"?`),
      message: msg(
        "This permanently removes the monitor and its history. This cannot be undone."
      ),
      confirmLabel: msg("Delete permanently"),
    });
    if (!confirmed) {
      return;
    }
    try {
      await purgeMonitor(this.hass, monitor.id);
      await this._load();
    } catch {
      this._notify(msg("Could not permanently delete monitor"));
    }
  }

  private _onViewWindow(monitor: AnomalyMonitor, window: DismissedWindow) {
    const detail: MonitorsOpenChartDetail = {
      entityIds: monitorEntityIds(monitor),
      startMs: window.start_ms,
      endMs: window.end_ms,
      monitorId: monitor.id,
      anomalyMethods: monitorAnomalyMethods(monitor),
      anomalySensitivity: monitor.anomaly_sensitivity,
    };
    this._emit("dp-monitors-panel-open-chart", detail);
  }

  private async _loadClusters(monitorId: string) {
    if (!this.hass || this._loadingClusters.has(monitorId)) return;
    this._loadingClusters = new Set([...this._loadingClusters, monitorId]);
    try {
      const result = await fetchMonitorAnomalies(this.hass, monitorId);
      const updated = new Map(this._monitorClusters);
      updated.set(monitorId, result.anomaly_clusters);
      this._monitorClusters = updated;
    } catch {
      // ignore — UI will fall back to count display
    } finally {
      const next = new Set(this._loadingClusters);
      next.delete(monitorId);
      this._loadingClusters = next;
    }
  }

  private async _onDismiss(
    monitor: AnomalyMonitor,
    cluster: AnomalyCluster,
    expiresAt: string | null | undefined
  ) {
    if (!this.hass) return;
    const times = cluster.points.map((p) => p.timeMs);
    const startMs = Math.min(...times);
    const endMs = Math.max(...times);
    await dismissMonitorAnomaly(
      this.hass,
      monitor.id,
      startMs,
      endMs,
      expiresAt
    );
    this._dismissPickerKey = null;
    // Invalidate cluster cache so next render re-fetches
    const updated = new Map(this._monitorClusters);
    updated.delete(monitor.id);
    this._monitorClusters = updated;
    await this._load();
  }

  private async _onUndismiss(monitor: AnomalyMonitor, windowId: string) {
    if (!this.hass) return;
    try {
      await undismissMonitorAnomaly(this.hass, monitor.id, windowId);
      await this._load();
    } catch {
      this._notify(msg("Could not restore dismissed detection"));
    }
  }

  private _formatClusterRange(cluster: AnomalyCluster): string {
    const times = cluster.points.map((p) => p.timeMs);
    if (times.length === 0) return "—";
    const start = new Date(Math.min(...times)).toLocaleString();
    const end = new Date(Math.max(...times)).toLocaleString();
    return start === end ? start : `${start} – ${end}`;
  }

  private _renderDismissExpiry(
    monitor: AnomalyMonitor,
    cluster: AnomalyCluster,
    clusterIndex: number
  ) {
    const pickerKey = `${monitor.id}:${clusterIndex}`;
    const isOpen = this._dismissPickerKey === pickerKey;
    const lookBackHours = monitor.look_back_hours ?? 24;

    if (!isOpen) {
      return html`
        <button
          class="icon-action dismiss-btn"
          type="button"
          title=${msg("Dismiss")}
          aria-label=${msg("Dismiss this anomaly")}
          @click=${() => {
            this._dismissPickerKey = pickerKey;
          }}
        >
          <ha-icon icon="mdi:bell-off-outline"></ha-icon>
        </button>
      `;
    }

    const autoLabel =
      lookBackHours < 48
        ? `${lookBackHours * 2}h`
        : `${Math.round(lookBackHours / 12)}d`;

    return html`
      <div class="dismiss-picker">
        <span class="dismiss-picker-label">${msg("Dismiss until:")}</span>
        <button
          class="text-action"
          type="button"
          @click=${() => this._onDismiss(monitor, cluster, undefined)}
        >
          ${msg("Auto")} (${autoLabel})
        </button>
        <button
          class="text-action"
          type="button"
          @click=${() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            this._onDismiss(monitor, cluster, d.toISOString());
          }}
        >
          ${msg("1 day")}
        </button>
        <button
          class="text-action"
          type="button"
          @click=${() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            this._onDismiss(monitor, cluster, d.toISOString());
          }}
        >
          ${msg("1 week")}
        </button>
        <button
          class="text-action"
          type="button"
          @click=${() => this._onDismiss(monitor, cluster, null)}
        >
          ${msg("Permanent")}
        </button>
        <button
          class="text-action"
          type="button"
          @click=${() => {
            this._dismissPickerKey = null;
          }}
        >
          ${msg("Cancel")}
        </button>
      </div>
    `;
  }

  private _renderClusterList(monitor: AnomalyMonitor) {
    const clusters = this._monitorClusters.get(monitor.id);
    const isLoading = this._loadingClusters.has(monitor.id);

    if (isLoading) {
      return html`<div class="clusters-loading">
        ${msg("Loading anomaly details…")}
      </div>`;
    }
    if (!clusters) return nothing;
    if (clusters.length === 0) {
      return html`<div class="clusters-empty">
        ${msg("No active anomaly clusters after dismissals.")}
      </div>`;
    }

    return html`
      <div class="cluster-list">
        ${clusters.map(
          (cluster, i) => html`
            <div class="cluster-item">
              <span class="cluster-method">${cluster.anomalyMethod}</span>
              <span class="cluster-range"
                >${this._formatClusterRange(cluster)}</span
              >
              ${this._renderDismissExpiry(monitor, cluster, i)}
            </div>
          `
        )}
      </div>
    `;
  }

  private _renderDismissedWindows(monitor: AnomalyMonitor) {
    const windows: DismissedWindow[] = monitor.dismissed_windows ?? [];
    if (windows.length === 0) return nothing;

    return html`
      <div
        class="dismissed-windows"
        role="group"
        aria-label=${msg("Dismissed detections")}
      >
        <span class="dismissed-heading"
          >${msg("Dismissed")} (${windows.length})</span
        >
        <ul class="dismissed-list">
          ${windows.map((w) => {
            const start = new Date(w.start_ms).toLocaleString();
            const end = new Date(w.end_ms).toLocaleString();
            const dismissedAt = w.dismissed_at
              ? new Date(w.dismissed_at).toLocaleString()
              : null;
            const expiry = w.expires_at
              ? new Date(w.expires_at).toLocaleString()
              : msg("Permanent");
            return html`
              <li class="dismissed-item">
                <div class="dismissed-meta">
                  <span class="dismissed-range">${start} – ${end}</span>
                  ${dismissedAt
                    ? html`<span class="dismissed-at"
                        >${msg("Dismissed:")} ${dismissedAt}</span
                      >`
                    : nothing}
                  <span class="dismissed-expiry"
                    >${msg("Expires:")} ${expiry}</span
                  >
                </div>
                <div class="dismissed-item-actions">
                  <button
                    class="icon-action view-window-btn"
                    type="button"
                    title=${msg("View window on chart")}
                    aria-label=${msg("View dismissed window on chart")}
                    @click=${() => this._onViewWindow(monitor, w)}
                  >
                    <ha-icon icon="mdi:chart-line"></ha-icon>
                  </button>
                  <button
                    class="icon-action undismiss-btn"
                    type="button"
                    title=${msg("Restore detection")}
                    aria-label=${msg("Restore dismissed detection")}
                    @click=${() => this._onUndismiss(monitor, w.id)}
                  >
                    <ha-icon icon="mdi:bell-ring-outline"></ha-icon>
                  </button>
                </div>
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }

  /**
   * Render a single entity chip wrapped in a keyboard-activatable button so a
   * user can open that entity's series. The `entity-chip` atom stays inert; the
   * panel owns the click/keyboard affordance (lowest-risk integration seam).
   */
  private _renderEntityChip(monitor: AnomalyMonitor, eid: string) {
    return html`
      <button
        class="monitor-entity-chip"
        type="button"
        aria-label=${msg(`View series for ${eid}`)}
        @click=${() => this._onOpenEntity(monitor, eid)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this._onOpenEntity(monitor, eid);
          }
        }}
      >
        <entity-chip
          .hass=${this.hass}
          type="entity"
          .itemId=${eid}
        ></entity-chip>
      </button>
    `;
  }

  /** Per-entity heatmap over the selected range (flat zero rows if no data). */
  private _renderEntityHeatmap(monitor: AnomalyMonitor) {
    const range = this._selectedRange()!;
    return html`<monitor-entity-heatmap
      .hass=${this.hass}
      .entityIds=${monitorEntityIds(monitor)}
      .activity=${(monitor.enabled &&
        this._activity.get(monitor.id)?.entities) ||
      null}
      .startMs=${range.startMs}
      .endMs=${range.endMs}
      style="--heatmap-color:${monitorSeriesColor(monitor)}"
      @dp-heatmap-block-click=${(e: CustomEvent<HeatmapBlockClickDetail>) =>
        this._onHeatmapBlockClick(monitor, e.detail)}
      @dp-heatmap-entity-click=${(e: CustomEvent<{ entityId: string }>) =>
        this._onOpenEntity(monitor, e.detail.entityId)}
    ></monitor-entity-heatmap>`;
  }

  private _renderEntityDisplay(monitor: AnomalyMonitor) {
    if (this._selectedRange()) {
      return this._renderEntityHeatmap(monitor);
    }
    const entityIds = monitorEntityIds(monitor);

    if (monitor.type === "individual" || entityIds.length <= 1) {
      return html`
        <div class="monitor-entities">
          ${entityIds.map(
            (eid) => html` ${this._renderEntityChip(monitor, eid)} `
          )}
        </div>
      `;
    }

    // Combined monitor — show overlap logic
    const m = monitor as CombinedMonitor;
    const mode = m.overlap_mode ?? "all";

    if (mode === "any") {
      return html`
        <div class="monitor-overlap-row">
          ${entityIds.map(
            (eid, i) => html`
              ${i > 0 ? html`<span class="overlap-op">OR</span>` : nothing}
              ${this._renderEntityChip(monitor, eid)}
            `
          )}
        </div>
      `;
    }

    const anyMatch =
      /^any_(\d+)$/.exec(mode) ?? (mode === "any_two_plus" ? ["", "2"] : null);
    if (anyMatch) {
      const n = parseInt(anyMatch[1], 10);
      return html`
        <div class="monitor-overlap-row">
          <span class="overlap-prefix"
            >${msg("AT LEAST")} ${n} ${msg("OF")}</span
          >
          ${entityIds.map(
            (eid) => html` ${this._renderEntityChip(monitor, eid)} `
          )}
        </div>
      `;
    }

    // Default: "all" — every entity must have an overlapping anomaly
    return html`
      <div class="monitor-overlap-row">
        ${entityIds.map(
          (eid, i) => html`
            ${i > 0 ? html`<span class="overlap-op">AND</span>` : nothing}
            ${this._renderEntityChip(monitor, eid)}
          `
        )}
      </div>
    `;
  }

  /** The localized label for a derived display status. */
  private _statusLabel(status: MonitorStatus): string {
    const labels: Record<MonitorStatus, string> = {
      paused: msg("Paused"),
      healthy: msg("Healthy"),
      warning: msg("Warning"),
      triggered: msg("Triggered"),
    };
    return labels[status];
  }

  /**
   * The plain-language trigger rule shown in the card footer. Individual
   * monitors watch a single entity; combined monitors either fire when any one
   * entity is anomalous (OR) or require every entity to be anomalous (AND).
   */
  private _triggerLogicLabel(monitor: AnomalyMonitor): string {
    if (monitor.type !== "combined") {
      return msg("Single-entity monitor");
    }
    const mode = (monitor as CombinedMonitor).overlap_mode ?? "all";
    const isOr = mode === "any" || /^any_/.test(mode);
    return isOr
      ? msg("Triggers when any entity is anomalous (OR)")
      : msg("Triggers when all entities are anomalous (AND)");
  }

  /**
   * The edit + delete button pair. Rendered in two slots: the wide
   * `.monitor-header-actions` set (`variant: "header"`, icon-only) and the
   * mobile `.overflow-menu` (`variant: "menu"`, labelled menu items). A single
   * source keeps the click handlers, icons and labels defined once.
   */
  private _renderEditDeleteActions(
    monitor: AnomalyMonitor,
    variant: "header" | "menu"
  ) {
    const menu = variant === "menu";
    const btnClass = (name: string) =>
      menu ? `overflow-item ${name}` : `icon-action ${name}`;
    return html`
      <button
        class=${btnClass("edit-btn")}
        type="button"
        role=${menu ? "menuitem" : nothing}
        title=${menu ? nothing : msg("Edit monitor")}
        aria-label=${msg("Edit monitor")}
        @click=${() => this._onEdit(monitor)}
      >
        <ha-icon icon="mdi:pencil"></ha-icon>
        ${menu ? html`<span>${msg("Edit")}</span>` : nothing}
      </button>
      <button
        class=${btnClass("delete-btn")}
        type="button"
        role=${menu ? "menuitem" : nothing}
        title=${menu ? nothing : msg("Delete monitor")}
        aria-label=${msg("Delete monitor")}
        @click=${() => this._onDelete(monitor)}
      >
        <ha-icon icon="mdi:trash-can-outline"></ha-icon>
        ${menu ? html`<span>${msg("Delete")}</span>` : nothing}
      </button>
    `;
  }

  private _renderCardHeader(monitor: AnomalyMonitor, status: MonitorStatus) {
    const overflowOpen = this._overflowOpenId === monitor.id;
    return html`
      <div class="monitor-card-header">
        <monitor-status-pill
          .status=${status}
          .label=${this._statusLabel(status)}
        ></monitor-status-pill>
        <span class="monitor-name">${monitor.name}</span>
        <span class="monitor-header-spacer"></span>
        <button
          class="monitor-switch"
          type="button"
          role="switch"
          aria-checked=${monitor.enabled ? "true" : "false"}
          title=${monitor.enabled
            ? msg("Disable monitor")
            : msg("Enable monitor")}
          aria-label=${monitor.enabled
            ? msg("Disable monitor")
            : msg("Enable monitor")}
          @click=${() => this._onToggleEnabled(monitor)}
        >
          <span class="switch-track"><span class="switch-thumb"></span></span>
        </button>
        <div class="monitor-header-actions">
          ${this._renderEditDeleteActions(monitor, "header")}
        </div>
        <div class="monitor-overflow">
          <button
            class="icon-action overflow-toggle"
            type="button"
            aria-haspopup="menu"
            aria-expanded=${overflowOpen ? "true" : "false"}
            title=${msg("More actions")}
            aria-label=${msg("More actions")}
            @click=${() => this._toggleOverflow(monitor)}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
          ${overflowOpen
            ? html`<div class="overflow-menu" role="menu">
                ${this._renderEditDeleteActions(monitor, "menu")}
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderStatsBlock(monitor: AnomalyMonitor) {
    // With a selected range the counts cover that range (0 when the activity
    // is unavailable); otherwise fall back to the latest scan figures.
    const activity = this._activity.get(monitor.id);
    const ranged = this._selectedRange() !== null;
    // Ranged: paused monitors are 0; an enabled monitor without activity
    // (failed or still loading) is unavailable, shown as a dash, never 0.
    const rangedValue = (value: number | undefined): number | string =>
      !monitor.enabled ? 0 : (value ?? "—");
    const anomalousReadings = ranged
      ? rangedValue(activity?.total_anomalies)
      : (monitor.scan_history?.at(-1)?.count ?? 0);
    const incidents = ranged
      ? rangedValue(activity?.incident_count)
      : (monitor.active_cluster_count ?? monitor.last_cluster_count ?? 0);
    const lastAnomaly =
      monitor.enabled && monitor.last_anomaly_at
        ? fmtRelativeTime(monitor.last_anomaly_at)
        : "—";
    const seriesColor = monitorSeriesColor(monitor);

    return html`
      <div class="monitor-stats-block" role="group" aria-label=${msg("Stats")}>
        <div class="monitor-stat stat-anomalous">
          <span class="stat-label">${msg("Anomalous readings")}</span>
          <span class="stat-value" style="color:${seriesColor}"
            >${anomalousReadings}</span
          >
        </div>
        <div class="monitor-stat stat-incidents">
          <span class="stat-label">${msg("Incidents")}</span>
          <span class="stat-value">${incidents}</span>
          <span class="stat-caption"
            >${msg("Group(s) of nearby readings")}</span
          >
        </div>
        <div class="monitor-stat stat-last-anomaly">
          <span class="stat-label">${msg("Last anomaly")}</span>
          <span class="stat-value">${lastAnomaly}</span>
        </div>
        <div class="monitor-stat stat-interval">
          <span class="stat-label">${msg("Checks every")}</span>
          <span class="stat-value"
            >${fmtScanInterval(monitor.scan_interval_minutes)}</span
          >
          <span class="stat-caption"
            >${msg(`Looks back ${fmtLookBack(monitor.look_back_hours)}`)}</span
          >
        </div>
      </div>
    `;
  }

  private _renderMonitorCard(monitor: AnomalyMonitor) {
    const clusterCount = monitor.last_cluster_count ?? 0;
    const isDisabled = !monitor.enabled;
    const hasAnomaly = !isDisabled && clusterCount > 0;
    const status = deriveMonitorStatus(monitor);

    // Lazily load clusters when anomaly is active
    if (hasAnomaly && !this._monitorClusters.has(monitor.id)) {
      this._loadClusters(monitor.id);
    }

    return html`
      <div class="monitor-card" data-enabled=${monitor.enabled}>
        ${this._renderCardHeader(monitor, status)}

        <div class="monitor-body">
          <div class="monitor-entity-area">
            ${this._renderEntityDisplay(monitor)}
          </div>
          ${this._renderStatsBlock(monitor)}
        </div>

        ${hasAnomaly ? this._renderClusterList(monitor) : nothing}
        ${this._renderDismissedWindows(monitor)}

        <div class="monitor-footer">
          <span class="monitor-trigger-logic"
            >${this._triggerLogicLabel(monitor)}</span
          >
          <span class="monitor-footer-spacer"></span>
          <button
            class="icon-action view-series-btn"
            type="button"
            title=${msg("View series")}
            aria-label=${msg("View series on chart")}
            @click=${() => this._onViewSeries(monitor)}
          >
            <ha-icon icon="mdi:chart-line"></ha-icon>
          </button>
          ${monitor.device_id
            ? html`<a
                class="monitor-device-link"
                href=${`/config/devices/device/${monitor.device_id}`}
                title=${msg("Open HASS Datapoints device")}
              >
                <ha-icon icon="mdi:open-in-new"></ha-icon>
                <span>${msg("Open HASS Datapoints device")}</span>
              </a>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderTrashItem(monitor: AnomalyMonitor) {
    const deletedAt = monitor.deleted_at
      ? new Date(monitor.deleted_at).toLocaleString()
      : null;
    return html`
      <div class="trash-item" data-monitor-id=${monitor.id}>
        <div class="trash-item-info">
          <span class="trash-name">${monitor.name}</span>
          ${deletedAt
            ? html`<span class="trash-deleted-at"
                >${msg("Deleted:")} ${deletedAt}</span
              >`
            : nothing}
        </div>
        <div class="trash-item-actions">
          <button
            class="icon-action restore-btn"
            type="button"
            title=${msg("Restore monitor")}
            aria-label=${msg(`Restore "${monitor.name}"`)}
            @click=${() => this._onRestore(monitor)}
          >
            <ha-icon icon="mdi:restore"></ha-icon>
          </button>
          <button
            class="icon-action delete-btn purge-btn"
            type="button"
            title=${msg("Delete permanently")}
            aria-label=${msg(`Permanently delete "${monitor.name}"`)}
            @click=${() => this._onPurge(monitor)}
          >
            <ha-icon icon="mdi:delete-forever"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }

  private _renderTrashSection() {
    if (this._deletedMonitors.length === 0) {
      return nothing;
    }
    return html`
      <section class="trash-section" aria-label=${msg("Recently deleted")}>
        <h3 class="trash-heading">
          ${msg("Recently deleted")} (${this._deletedMonitors.length})
        </h3>
        <div class="trash-list">
          ${this._deletedMonitors.map((m) => this._renderTrashItem(m))}
        </div>
      </section>
    `;
  }

  private _renderMonitorList() {
    if (this._loading) {
      return html`<div class="monitors-empty">${msg("Loading…")}</div>`;
    }
    if (this._monitors.length === 0) {
      return html`<div class="monitors-empty">
        ${msg('No monitors configured. Click "New monitor" to get started.')}
      </div>`;
    }
    return html`<div class="monitors-grid">
      ${this._monitors.map((m) => this._renderMonitorCard(m))}
    </div>`;
  }

  private _rangeLabel(): string {
    const range = this._selectedRange();
    return range ? fmtDateTimeRange(range.startMs, range.endMs) : "";
  }

  private _renderSubtitle() {
    if (!this._selectedRange()) {
      return nothing;
    }
    // The count is only known once monitors have loaded; until then show the
    // range alone so the subtitle never pops in late.
    const text = this._loading
      ? msg(`Counts cover ${this._rangeLabel()}`)
      : msg(
          `${this._monitors.length} monitors · counts cover ${this._rangeLabel()}`
        );
    return html`<span class="monitors-subtitle">${text}</span>`;
  }

  /** Compact range indicator shown only on narrow (mobile) viewports. */
  private _renderRangeBar() {
    if (!this._selectedRange()) {
      return nothing;
    }
    return html`<div class="monitors-range-bar" role="status">
      <ha-icon icon="mdi:calendar-range"></ha-icon>
      <span>${this._rangeLabel()}</span>
    </div>`;
  }

  render() {
    return html`
      <div class="monitors-panel">
        <div class="monitors-header">
          <ha-icon-button label=${msg("Back")} @click=${this._onClose}>
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </ha-icon-button>
          <div class="monitors-title">
            <h2>${msg("Anomaly monitors")}</h2>
            ${this._renderSubtitle()}
          </div>
          <button class="new-monitor-btn" @click=${this._onNewMonitor}>
            <ha-icon icon="mdi:bell-plus-outline"></ha-icon>
            ${msg("New monitor")}
          </button>
        </div>

        ${this._renderRangeBar()} ${this._renderMonitorList()}
        ${this._renderTrashSection()}
      </div>

      <anomaly-monitor-wizard
        .hass=${this.hass}
        .open=${this._wizardOpen}
        .editMonitor=${this._editMonitor}
        @dp-monitor-wizard-close=${this._onWizardClose}
        @dp-monitor-wizard-saved=${this._onWizardSaved}
      ></anomaly-monitor-wizard>
    `;
  }
}

customElements.define("anomaly-monitors-panel", AnomalyMonitorsPanel);

declare global {
  interface HTMLElementTagNameMap {
    "anomaly-monitors-panel": AnomalyMonitorsPanel;
  }
}
