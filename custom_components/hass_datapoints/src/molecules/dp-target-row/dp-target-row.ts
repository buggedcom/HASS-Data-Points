import { LitElement, html, nothing } from "lit";
import { styles } from "./dp-target-row.styles";

// ---------------------------------------------------------------------------
// Types (defined in ./types, re-exported here for backwards compatibility)
// ---------------------------------------------------------------------------

import type { NormalizedAnalysis, ComparisonWindow, HassEntityState } from "./types";

import "@/molecules/dp-analysis-trend-group/dp-analysis-trend-group";
import "@/molecules/dp-analysis-rate-group/dp-analysis-rate-group";
import "@/molecules/dp-analysis-threshold-group/dp-analysis-threshold-group";
import "@/molecules/dp-analysis-anomaly-group/dp-analysis-anomaly-group";
import "@/molecules/dp-analysis-delta-group/dp-analysis-delta-group";

export type { NormalizedAnalysis, ComparisonWindow, HassEntityState };

export function deriveSwatchIconColor(color: string): string {
  const hex = String(color || "").trim();
  const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
  if (!normalizedHex) { return "#ffffff"; }
  const channels = normalizedHex.slice(1).match(/.{2}/g)?.map((p) => parseInt(p, 16));
  if (!channels || channels.length !== 3) { return "#ffffff"; }
  const [r, g, b] = channels;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const mixTarget = luminance > 0.62 ? 0 : 255;
  const mixStrength = luminance > 0.62
    ? Math.min(0.82, 0.35 + (luminance - 0.62) * 1.6)
    : Math.min(0.78, 0.4 + (0.62 - luminance) * 0.9);
  const mixed = [r, g, b].map((c) =>
    Math.max(0, Math.min(255, Math.round(c * (1 - mixStrength) + mixTarget * mixStrength))),
  );
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

export function _hasConfiguredAnalysis(a: NormalizedAnalysis): boolean {
  return (
    a.show_trend_lines
    || a.show_summary_stats
    || a.show_rate_of_change
    || a.show_threshold_analysis
    || a.show_anomalies
    || a.show_delta_analysis
    || a.hide_source_series
  );
}

export function _hasActiveAnalysis(a: NormalizedAnalysis, hasComparisonWindow: boolean): boolean {
  return (
    a.show_trend_lines
    || a.show_summary_stats
    || a.show_rate_of_change
    || a.show_threshold_analysis
    || a.show_anomalies
    || (a.show_delta_analysis && hasComparisonWindow)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class DpTargetRow extends LitElement {
  static properties = {
    color: { type: String },
    visible: { type: Boolean },
    analysis: { type: Object },
    index: { type: Number },
    canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" },
    stateObj: { type: Object, attribute: false },
    hass: { type: Object, attribute: false },
    comparisonWindows: { type: Array, attribute: "comparison-windows" },
  };

  declare color: string;

  declare visible: boolean;

  declare analysis: NormalizedAnalysis;

  declare index: number;

  declare canShowDeltaAnalysis: boolean;

  /** HA entity state object. Provides entity_id, display name, unit, and icon for the row. */
  declare stateObj: Record<string, unknown> | null;

  /** HA hass object. Required by ha-state-icon to resolve entity icons correctly. */
  declare hass: Record<string, unknown> | null;

  declare comparisonWindows: ComparisonWindow[];

  static styles = styles;

  constructor() {
    super();
    this.color = "#03a9f4";
    this.visible = true;
    this.analysis = {} as NormalizedAnalysis;
    this.index = 0;
    this.canShowDeltaAnalysis = false;
    this.stateObj = null;
    this.hass = null;
    this.comparisonWindows = [];
  }

  /** Entity ID derived from the HA state object. */
  private get _entityId(): string {
    return (this.stateObj?.entity_id as string) ?? "";
  }

  /** Display name derived from the HA state object, falling back to the entity ID. */
  private get _entityName(): string {
    return (this.stateObj?.attributes as Record<string, unknown> | undefined)?.friendly_name as string
      ?? this._entityId;
  }

  /** Unit of measurement derived from the HA state object. */
  private get _unit(): string {
    return (this.stateObj?.attributes as Record<string, unknown> | undefined)?.unit_of_measurement as string
      ?? "";
  }

  private get _supportsAnalysis(): boolean {
    return typeof this._entityId === "string" && !this._entityId.startsWith("binary_sensor.");
  }

  private _emit(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private _onColorChange(e: Event) {
    this._emit("dp-row-color-change", { index: this.index, color: (e.target as HTMLInputElement).value });
  }

  private _onVisibilityChange(e: Event) {
    this._emit("dp-row-visibility-change", { entityId: this._entityId, visible: (e.target as HTMLInputElement).checked });
  }

  private _onAnalysisToggle() {
    this._emit("dp-row-toggle-analysis", { entityId: this._entityId });
  }

  private _onRemove() {
    this._emit("dp-row-remove", { index: this.index });
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit("dp-row-analysis-change", { entityId: this._entityId, key, value: (e.target as HTMLInputElement).checked });
  }

  private _onCopyAnalysisToAll() {
    this._emit("dp-row-copy-analysis-to-all", { entityId: this._entityId, analysis: this.analysis });
  }

  private _onGroupAnalysisChange(e: CustomEvent) {
    this._emit("dp-row-analysis-change", e.detail as Record<string, unknown>);
  }

  render() {
    const a = this.analysis || ({} as NormalizedAnalysis);
    const hasConfigured = _hasConfiguredAnalysis(a);
    const hasActive = _hasActiveAnalysis(a, this.canShowDeltaAnalysis);

    const rowClass = [
      "history-target-row",
      this.visible === false ? "is-hidden" : "",
      this.analysis?.expanded ? "analysis-open" : "",
    ].filter(Boolean).join(" ");

    return html`
      <div class=${rowClass} role="row">
        <button
          type="button"
          class="history-target-drag-handle"
          draggable="true"
          aria-label="Drag to reorder ${this._entityName}"
          title="Drag to reorder"
        >
          <ha-icon icon="mdi:drag-vertical"></ha-icon>
        </button>

        <div class="history-target-name" role="cell" title=${this._entityName}>
          <div class="history-target-controls">
            <label
              class="history-target-color-field"
              style="--row-color:${this.color};--row-icon-color:${deriveSwatchIconColor(this.color)}"
            >
              <input
                type="color"
                class="history-target-color"
                .value=${this.color}
                aria-label="Line color for ${this._entityId}"
                @change=${this._onColorChange}
              >
              <span class="history-target-color-icon" aria-hidden="true">
                <ha-state-icon .stateObj=${this.stateObj ?? null} .hass=${this.hass ?? null}></ha-state-icon>
              </span>
            </label>
          </div>
          <div class="history-target-name-text">
            ${this._entityName}
            <div class="history-target-entity-id">${this._entityId}</div>
          </div>
        </div>

        <div class="history-target-actions" role="cell">
          ${this._supportsAnalysis ? html`
            <button
              type="button"
              class="history-target-analysis-toggle ${this.analysis?.expanded ? "is-open" : ""} ${hasConfigured ? "configured" : ""}"
              aria-label="${this.analysis?.expanded ? "Collapse" : "Expand"} analysis options for ${this._entityName}"
              aria-expanded=${this.analysis?.expanded}
              title=${hasConfigured ? "Analysis configured" : "Configure analysis"}
              @click=${this._onAnalysisToggle}
            >
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          ` : nothing}

          <label
            class="history-target-visible-toggle"
            title="${this.visible === false ? "Show" : "Hide"} ${this._entityName}"
          >
            <input
              type="checkbox"
              aria-label="Show ${this._entityName} on chart"
              .checked=${this.visible !== false}
              @change=${this._onVisibilityChange}
            >
            <span class="history-target-visible-toggle-track"></span>
          </label>

          <button
            type="button"
            class="history-target-remove"
            aria-label="Remove ${this._entityId}"
            @click=${this._onRemove}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        ${this._supportsAnalysis && this.analysis?.expanded ? html`
          <div class="history-target-analysis" role="cell">
            <div class="history-target-analysis-grid">
              <dp-analysis-trend-group
                .analysis=${a}
                .entityId=${this._entityId}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-trend-group>
              <label class="history-target-analysis-option">
                <input type="checkbox" .checked=${a.show_summary_stats} @change=${(e: Event) => this._onCheckbox("show_summary_stats", e)}>
                <span>Show min / max / mean</span>
              </label>
              <dp-analysis-rate-group
                .analysis=${a}
                .entityId=${this._entityId}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-rate-group>
              <dp-analysis-threshold-group
                .analysis=${a}
                .entityId=${this._entityId}
                .unit=${this._unit}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-threshold-group>
              <dp-analysis-anomaly-group
                .analysis=${a}
                .entityId=${this._entityId}
                .comparisonWindows=${this.comparisonWindows}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-anomaly-group>
              <dp-analysis-delta-group
                .analysis=${a}
                .entityId=${this._entityId}
                .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-delta-group>
              <div class="history-target-analysis-bottom-row">
                <label class="history-target-analysis-option ${!hasActive ? "is-disabled" : ""}">
                  <input type="checkbox" .checked=${a.hide_source_series && hasActive}
                    ?disabled=${!hasActive}
                    @change=${(e: Event) => this._onCheckbox("hide_source_series", e)}>
                  <span>Hide source series</span>
                </label>
                <button
                  type="button"
                  class="history-target-analysis-copy-btn"
                  title="Copy these analysis settings to all targets"
                  @click=${this._onCopyAnalysisToAll}
                >
                  <ha-icon icon="mdi:content-copy"></ha-icon>
                  Copy to all targets
                </button>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }
}

customElements.define("dp-target-row", DpTargetRow);
