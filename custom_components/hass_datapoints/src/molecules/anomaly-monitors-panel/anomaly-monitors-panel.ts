import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";

import { styles } from "./anomaly-monitors-panel.styles";
import {
  fetchMonitors,
  updateMonitor,
  deleteMonitor,
  monitorEntityIds,
  type AnomalyMonitor,
  type ScanHistoryEntry,
} from "@/lib/data/monitors-api";
import type { HassLike } from "@/lib/types";
import "@/molecules/anomaly-monitor-wizard/anomaly-monitor-wizard";
import "@/atoms/form/entity-chip/entity-chip";

/**
 * `anomaly-monitors-panel` shows a management view of all anomaly monitors.
 *
 * @fires dp-monitors-panel-close  — user clicked the back/close button
 * @fires dp-monitors-panel-new    — user clicked "New monitor"
 */
@localized()
export class AnomalyMonitorsPanel extends LitElement {
  static styles = styles;

  @property({ type: Object }) accessor hass: Nullable<HassLike> = null;

  @state() accessor _monitors: AnomalyMonitor[] = [];

  @state() accessor _loading: boolean = true;

  @state() accessor _editMonitor: AnomalyMonitor | null = null;

  @state() accessor _wizardOpen: boolean = false;

  private _pollInterval: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._load();
    this._pollInterval = setInterval(() => this._load(), 30_000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._pollInterval !== null) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  private async _load() {
    if (!this.hass) return;
    try {
      this._monitors = await fetchMonitors(this.hass);
    } catch {
      // ignore
    } finally {
      this._loading = false;
    }
  }

  private _emit(name: string, detail: RecordWithUnknownValues = {}) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  private _onNewMonitor() {
    this._emit("dp-monitors-panel-new");
  }

  private _onClose() {
    this._emit("dp-monitors-panel-close");
  }

  private _onEdit(monitor: AnomalyMonitor) {
    this._editMonitor = monitor;
    this._wizardOpen = true;
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

    if (
      !window.confirm(
        msg(`Delete monitor "${monitor.name}"? This cannot be undone.`)
      )
    ) {
      return;
    }
    await deleteMonitor(this.hass, monitor.id);
    await this._load();
  }

  private _renderSparkline(history: ScanHistoryEntry[]) {
    const W = 120;
    const H = 28;
    const PAD = 2;
    const counts = history.map((e) => e.count);
    if (counts.length < 2) {
      return html`<svg width=${W} height=${H}></svg>`;
    }
    const max = Math.max(...counts, 1);
    const pts = counts
      .map((c, i) => {
        const x = PAD + (i / Math.max(counts.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - (c / max) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return html`<svg
      class="monitor-sparkline"
      width=${W}
      height=${H}
      aria-hidden="true"
    >
      <polyline
        points=${pts}
        fill="none"
        stroke="var(--primary-color)"
        stroke-width="1.5"
      />
    </svg>`;
  }

  private _renderMonitorCard(monitor: AnomalyMonitor) {
    const entityIds = monitorEntityIds(monitor);
    const clusterCount = monitor.last_cluster_count ?? 0;
    const isDisabled = !monitor.enabled;
    const hasAnomaly = !isDisabled && clusterCount > 0;

    let statusLabel: string;
    let statusClass: string;
    if (isDisabled) {
      statusLabel = msg("Disabled");
      statusClass = "disabled";
    } else if (hasAnomaly) {
      statusLabel = msg("Anomaly detected");
      statusClass = "anomaly";
    } else {
      statusLabel = msg("Normal");
      statusClass = "normal";
    }

    // Consecutive anomalous scans
    const history = monitor.scan_history ?? [];
    let consecutive = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if ((history[i].count ?? 0) > 0) consecutive++;
      else break;
    }

    return html`
      <div class="monitor-card">
        <div class="monitor-card-header">
          <span class="monitor-name">${monitor.name}</span>
          <span class="monitor-type-badge">
            ${monitor.type === "combined" ? "⬡ combined" : "● individual"}
          </span>
          <span class="monitor-status-badge ${statusClass}"
            >${statusLabel}</span
          >
        </div>

        <div class="monitor-entities">
          ${entityIds.map(
            (eid) => html`
              <entity-chip
                .hass=${this.hass}
                type="entity"
                itemId=${eid}
              ></entity-chip>
            `
          )}
        </div>

        <div class="monitor-stats">
          ${this._renderSparkline(history)}
          <span>
            ${clusterCount} ${msg("cluster(s)")}
            ${consecutive > 0
              ? html`· ${msg(`persistent for ${consecutive} scans`)}`
              : nothing}
          </span>
          ${monitor.last_scan_at
            ? html`<span
                >${msg("Last scan:")}
                ${new Date(monitor.last_scan_at).toLocaleString()}</span
              >`
            : nothing}
        </div>

        <div class="monitor-actions">
          <ha-button @click=${() => this._onEdit(monitor)}
            >${msg("Edit")}</ha-button
          >
          <ha-button @click=${() => this._onToggleEnabled(monitor)}>
            ${monitor.enabled ? msg("Disable") : msg("Enable")}
          </ha-button>
          ${monitor.device_id
            ? html`<a
                class="device-link"
                href=${`/config/devices/device/${monitor.device_id}`}
                title=${msg("View device")}
              >
                <ha-icon icon="mdi:chip"></ha-icon>
                ${msg("Device")}
              </a>`
            : nothing}
          <div class="monitor-actions-spacer"></div>
          <ha-button class="delete-btn" @click=${() => this._onDelete(monitor)}
            >${msg("Delete")}</ha-button
          >
        </div>
      </div>
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

  render() {
    return html`
      <div class="monitors-panel">
        <div class="monitors-header">
          <ha-icon-button label=${msg("Back")} @click=${this._onClose}>
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </ha-icon-button>
          <h2>${msg("Anomaly monitors")}</h2>
          <button class="new-monitor-btn" @click=${this._onNewMonitor}>
            <ha-icon icon="mdi:bell-plus-outline"></ha-icon>
            ${msg("New monitor")}
          </button>
        </div>

        ${this._renderMonitorList()}
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
