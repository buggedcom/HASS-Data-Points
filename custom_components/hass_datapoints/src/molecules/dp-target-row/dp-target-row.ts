import { LitElement, html, css, nothing } from "lit";
import type { TemplateResult } from "lit";

// ---------------------------------------------------------------------------
// Analysis option constants (mirrored from panel-history.js)
// ---------------------------------------------------------------------------

const ANALYSIS_TREND_METHOD_OPTIONS = [
  { value: "rolling_average", label: "Rolling average" },
  { value: "linear_trend", label: "Linear trend" },
];

const ANALYSIS_TREND_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "21d", label: "21 days" },
  { value: "28d", label: "28 days" },
];

const ANALYSIS_RATE_WINDOW_OPTIONS = [
  { value: "point_to_point", label: "Point to point" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const ANALYSIS_ANOMALY_METHOD_OPTIONS = [
  { value: "trend_residual", label: "Trend deviation", help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline." },
  { value: "rate_of_change", label: "Sudden change", help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions." },
  { value: "iqr", label: "Statistical outlier (IQR)", help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages." },
  { value: "rolling_zscore", label: "Rolling Z-score", help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series." },
  { value: "persistence", label: "Flat-line / stuck value", help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings." },
  { value: "comparison_window", label: "Comparison window deviation", help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year." },
];

const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

// ---------------------------------------------------------------------------
// Types (defined in ./types, re-exported here for backwards compatibility)
// ---------------------------------------------------------------------------

import type { NormalizedAnalysis, ComparisonWindow, HassEntityState } from "./types";
export type { NormalizedAnalysis, ComparisonWindow, HassEntityState };

function deriveSwatchIconColor(color: string): string {
  const hex = String(color || "").trim();
  const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
  if (!normalizedHex) return "#ffffff";
  const channels = normalizedHex.slice(1).match(/.{2}/g)?.map((p) => parseInt(p, 16));
  if (!channels || channels.length !== 3) return "#ffffff";
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

function _hasConfiguredAnalysis(a: NormalizedAnalysis): boolean {
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

function _hasActiveAnalysis(a: NormalizedAnalysis, hasComparisonWindow: boolean): boolean {
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
    comparisonWindows: { type: Array, attribute: "comparison-windows" },
  };

  declare color: string;
  declare visible: boolean;
  declare analysis: NormalizedAnalysis;
  declare index: number;
  declare canShowDeltaAnalysis: boolean;
  /** HA entity state object. Provides entity_id, display name, unit, and icon for the row. */
  declare stateObj: Record<string, unknown> | null;
  declare comparisonWindows: ComparisonWindow[];

  static styles = css`
    :host {
      display: block;
      --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
      --dp-spacing-sm: var(--spacing, 8px);
      --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
      --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
      --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    }

    .history-target-row {
      display: grid;
      position: relative;
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas:
        "handle name actions"
        ". analysis analysis";
      gap: var(--dp-spacing-sm);
      align-items: center;
      margin: 0;
      padding: calc(var(--spacing, 8px) * 1.125) calc(var(--spacing, 8px) * 1.25);
      border-radius: 16px;
      background: var(--card-background-color, #fff);
      border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
      transition: border-color 140ms ease, background-color 140ms ease;
      padding-bottom: 0;
      padding-left: 3px;
    }

    .history-target-row.analysis-open {
      padding-bottom: calc(var(--spacing, 8px) * 1.125);
    }

    .history-target-row.is-hidden {
      opacity: 0.62;
    }

    .history-target-row:hover {
      border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, var(--divider-color, rgba(0, 0, 0, 0.12)));
      background: color-mix(in srgb, var(--primary-color, #03a9f4) 2%, var(--card-background-color, #fff));
    }

    .history-target-row.is-dragging {
      opacity: 0.35;
    }

    .history-target-row.is-drag-over-before {
      box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
    }

    .history-target-row.is-drag-over-after {
      box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
    }

    .history-target-drag-handle {
      grid-area: handle;
      align-self: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: grab;
      opacity: 0;
      transition: opacity 140ms ease, background-color 120ms ease;
      touch-action: none;
      margin-right: calc(var(--dp-spacing-xs) * -0.5);
      margin-left: -8px;
      position: absolute;
    }

    .history-target-drag-handle ha-icon {
      --mdc-icon-size: 16px;
      display: block;
      pointer-events: none;
    }

    .history-target-row:hover .history-target-drag-handle {
      opacity: 0.45;
    }

    .history-target-drag-handle:hover,
    .history-target-drag-handle:focus-visible {
      opacity: 1;
      outline: none;
    }

    .history-target-drag-handle:active {
      cursor: grabbing;
    }

    .history-target-name {
      grid-area: name;
      min-width: 0;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--dp-spacing-sm);
      align-items: center;
    }

    .history-target-name-text {
      min-width: 0;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.2;
      color: var(--primary-text-color);
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .history-target-entity-id {
      margin-top: 4px;
      font-size: 0.74rem;
      font-weight: 400;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-target-color-field {
      position: relative;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      overflow: hidden;
    }

    .history-target-controls {
      display: contents;
    }

    .history-target-color-icon {
      position: absolute;
      inset: 0;
      display: inline-grid;
      place-items: center;
      width: 100%;
      height: 100%;
      color: var(--row-icon-color, var(--text-primary-color, #fff));
      pointer-events: none;
      z-index: 1;
    }

    .history-target-color-icon ha-state-icon {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }

    .history-target-color {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 10px;
      padding: 0;
      background: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      opacity: 0;
      z-index: 2;
    }

    .history-target-color::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    .history-target-color::-webkit-color-swatch {
      border: none;
      border-radius: 10px;
    }

    .history-target-color::-moz-color-swatch {
      border: none;
      border-radius: 10px;
    }

    .history-target-color-field::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--row-color, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, rgba(0, 0, 0, 0.18) 70%, transparent);
    }

    .history-target-color:focus-visible + .history-target-color-icon {
      outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
      outline-offset: 2px;
      border-radius: inherit;
    }

    .history-target-actions {
      grid-area: actions;
      justify-self: end;
      align-self: center;
      display: inline-flex;
      align-items: center;
      gap: calc(var(--spacing, 8px) * 0.75);
    }

    .history-target-analysis-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      min-width: 24px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      transition: background-color 120ms ease, color 120ms ease;
    }

    .history-target-analysis-toggle ha-icon {
      --mdc-icon-size: 16px;
      display: block;
      transition: transform 120ms ease;
    }

    .history-target-analysis-toggle.is-open ha-icon {
      transform: rotate(180deg);
    }

    .history-target-analysis-toggle:hover,
    .history-target-analysis-toggle:focus-visible {
      background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
      color: var(--primary-text-color);
      outline: none;
    }

    .history-target-visible-toggle {
      position: relative;
      display: inline-flex;
      width: 34px;
      height: 20px;
      flex: 0 0 auto;
      cursor: pointer;
    }

    .history-target-visible-toggle input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }

    .history-target-visible-toggle-track {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 999px;
      background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
      transition: background-color 120ms ease;
    }

    .history-target-visible-toggle-track::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
      transition: transform 120ms ease;
    }

    .history-target-visible-toggle input:checked + .history-target-visible-toggle-track {
      background: var(--primary-color);
    }

    .history-target-visible-toggle input:checked + .history-target-visible-toggle-track::after {
      transform: translateX(14px);
    }

    .history-target-visible-toggle input:focus-visible + .history-target-visible-toggle-track {
      outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
      outline-offset: 2px;
    }

    .history-target-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      min-width: 16px;
      line-height: 16px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
      color: var(--secondary-text-color);
      cursor: pointer;
      flex: 0 0 auto;
    }

    .history-target-remove ha-icon {
      --mdc-icon-size: 12px;
      display: block;
    }

    .history-target-remove:hover,
    .history-target-remove:focus-visible {
      background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
      color: var(--error-color, #db4437);
      outline: none;
    }

    /* ── Analysis panel ─────────────────────────────────────── */

    .history-target-analysis {
      grid-area: analysis;
      display: grid;
      gap: var(--dp-spacing-sm);
      padding-top: calc(var(--spacing, 8px) * 0.25);
      border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 78%, transparent);
    }

    .history-target-analysis-grid {
      display: grid;
      gap: var(--dp-spacing-sm);
      padding-top: var(--dp-spacing-sm);
    }

    .history-target-analysis-group {
      display: grid;
      gap: var(--dp-spacing-sm);
      border-radius: 6px;
    }

    .history-target-analysis-group-body {
      display: grid;
      gap: var(--dp-spacing-sm);
      padding: var(--dp-spacing-sm);
      border-left: 3px solid var(--primary-color);
      margin-left: 5px;
      padding-left: var(--dp-spacing-md);
    }

    .history-target-analysis-option {
      display: flex;
      align-items: center;
      gap: calc(var(--spacing, 8px) * 0.75);
      color: var(--primary-text-color);
      font-size: 0.84rem;
      cursor: pointer;
    }

    .history-target-analysis-option.top {
      align-items: flex-start;
    }

    .history-target-analysis-option.is-disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .history-target-analysis-option input[type="checkbox"] {
      margin: 0;
      accent-color: var(--primary-color, #03a9f4);
      cursor: pointer;
    }

    .history-target-analysis-option-help-text {
      display: inline-block;
      color: var(--secondary-text-color);
      opacity: 0.8;
      padding-top: 2px;
    }

    .history-target-analysis-row {
      display: grid;
      gap: var(--dp-spacing-sm);
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .history-target-analysis-toggle-group {
      display: flex;
      gap: calc(var(--spacing, 8px) * 0.625);
      align-items: center;
    }

    .history-target-analysis-field {
      display: grid;
      gap: 4px;
      justify-items: start;
    }

    .history-target-analysis-field-label {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--secondary-text-color);
    }

    .history-target-analysis-select,
    .history-target-analysis-input {
      width: auto;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: calc(var(--spacing, 8px) * 0.75) calc(var(--spacing, 8px) * 0.875);
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 0.84rem;
    }

    .history-target-analysis-method-list {
      display: grid;
      gap: var(--dp-spacing-sm);
    }

    .history-target-analysis-method-item {
      display: grid;
      gap: var(--dp-spacing-sm);
    }

    .history-target-analysis-method-subopts {
      padding-left: calc(var(--spacing, 8px) * 1.5);
      display: grid;
      gap: var(--dp-spacing-sm);
      border-left: 3px solid var(--primary-color);
      margin-left: 5px;
    }

    .analysis-method-help {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 10px;
      height: 10px;
      flex: 0 0 auto;
      border-radius: 50%;
      border: 1px solid var(--secondary-text-color, #888);
      background: transparent;
      color: var(--secondary-text-color, #888);
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
      cursor: default;
      padding: 0;
      vertical-align: middle;
    }

    .analysis-computing-spinner {
      display: none;
      width: 10px;
      height: 10px;
      border: 2px solid var(--divider-color, #ccc);
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: analysis-spin 0.7s linear infinite;
      flex-shrink: 0;
      margin-left: 2px;
    }

    .analysis-computing-spinner.active {
      display: inline-block;
    }

    @keyframes analysis-spin {
      to { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    this.color = "#03a9f4";
    this.visible = true;
    this.analysis = {} as NormalizedAnalysis;
    this.index = 0;
    this.canShowDeltaAnalysis = false;
    this.stateObj = null;
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

  private _onSelect(key: string, e: Event) {
    this._emit("dp-row-analysis-change", { entityId: this._entityId, key, value: (e.target as HTMLSelectElement).value });
  }

  private _onInput(key: string, e: Event) {
    this._emit("dp-row-analysis-change", { entityId: this._entityId, key, value: (e.target as HTMLInputElement).value });
  }

  // ── Analysis group renderers ──────────────────────────────────────────────

  private _renderSelect(key: string, options: { value: string; label: string }[], value: string): TemplateResult {
    return html`
      <select class="history-target-analysis-select" @change=${(e: Event) => this._onSelect(key, e)}>
        ${options.map((opt) => html`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
  }

  private _renderTrendGroup(a: NormalizedAnalysis): TemplateResult {
    return html`
      <div class="history-target-analysis-group ${a.show_trend_lines ? "is-open" : ""}">
        <label class="history-target-analysis-option">
          <input type="checkbox" .checked=${a.show_trend_lines} @change=${(e: Event) => this._onCheckbox("show_trend_lines", e)}>
          <span>Show trend lines</span>
        </label>
        ${a.show_trend_lines ? html`
          <div class="history-target-analysis-group-body">
            <label class="history-target-analysis-option">
              <input type="checkbox" .checked=${a.show_trend_crosshairs} @change=${(e: Event) => this._onCheckbox("show_trend_crosshairs", e)}>
              <span>Show trend crosshairs</span>
            </label>
            <label class="history-target-analysis-field">
              <span class="history-target-analysis-field-label">Trend method</span>
              ${this._renderSelect("trend_method", ANALYSIS_TREND_METHOD_OPTIONS, a.trend_method)}
            </label>
            ${a.trend_method === "rolling_average" ? html`
              <label class="history-target-analysis-field">
                <span class="history-target-analysis-field-label">Trend window</span>
                ${this._renderSelect("trend_window", ANALYSIS_TREND_WINDOW_OPTIONS, a.trend_window)}
              </label>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderRateGroup(a: NormalizedAnalysis): TemplateResult {
    return html`
      <div class="history-target-analysis-group ${a.show_rate_of_change ? "is-open" : ""}">
        <label class="history-target-analysis-option">
          <input type="checkbox" .checked=${a.show_rate_of_change} @change=${(e: Event) => this._onCheckbox("show_rate_of_change", e)}>
          <span>Show rate of change</span>
        </label>
        ${a.show_rate_of_change ? html`
          <div class="history-target-analysis-group-body">
            <label class="history-target-analysis-field">
              <span class="history-target-analysis-field-label">Rate window</span>
              ${this._renderSelect("rate_window", ANALYSIS_RATE_WINDOW_OPTIONS, a.rate_window)}
            </label>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderThresholdGroup(a: NormalizedAnalysis): TemplateResult {
    return html`
      <div class="history-target-analysis-group ${a.show_threshold_analysis ? "is-open" : ""}">
        <label class="history-target-analysis-option">
          <input type="checkbox" .checked=${a.show_threshold_analysis} @change=${(e: Event) => this._onCheckbox("show_threshold_analysis", e)}>
          <span>Show threshold analysis</span>
        </label>
        ${a.show_threshold_analysis ? html`
          <div class="history-target-analysis-group-body">
            <label class="history-target-analysis-option">
              <input type="checkbox" .checked=${a.show_threshold_shading} @change=${(e: Event) => this._onCheckbox("show_threshold_shading", e)}>
              <span>Shade threshold area</span>
            </label>
            <label class="history-target-analysis-field">
              <span class="history-target-analysis-field-label">Threshold</span>
              <div class="history-target-analysis-toggle-group">
                <input class="history-target-analysis-input" type="number" step="any" inputmode="decimal"
                  .value=${a.threshold_value} placeholder="Threshold"
                  @change=${(e: Event) => this._onInput("threshold_value", e)}>
                ${this._unit ? html`<span>${this._unit}</span>` : nothing}
              </div>
            </label>
            ${a.show_threshold_shading ? html`
              <label class="history-target-analysis-field">
                <span class="history-target-analysis-field-label">Shade area</span>
                <select class="history-target-analysis-select" @change=${(e: Event) => this._onSelect("threshold_direction", e)}>
                  <option value="above" ?selected=${a.threshold_direction !== "below"}>Shade above</option>
                  <option value="below" ?selected=${a.threshold_direction === "below"}>Shade below</option>
                </select>
              </label>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderAnomalyMethodSubopts(opt: { value: string }, a: NormalizedAnalysis): TemplateResult | typeof nothing {
    if (opt.value === "rate_of_change") {
      return html`
        <div class="history-target-analysis-method-subopts">
          <label class="history-target-analysis-field">
            <span class="history-target-analysis-field-label">Rate window</span>
            ${this._renderSelect("anomaly_rate_window", ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS, a.anomaly_rate_window)}
          </label>
        </div>
      `;
    }
    if (opt.value === "rolling_zscore") {
      return html`
        <div class="history-target-analysis-method-subopts">
          <label class="history-target-analysis-field">
            <span class="history-target-analysis-field-label">Rolling window</span>
            ${this._renderSelect("anomaly_zscore_window", ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS, a.anomaly_zscore_window)}
          </label>
        </div>
      `;
    }
    if (opt.value === "persistence") {
      return html`
        <div class="history-target-analysis-method-subopts">
          <label class="history-target-analysis-field">
            <span class="history-target-analysis-field-label">Min flat duration</span>
            ${this._renderSelect("anomaly_persistence_window", ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS, a.anomaly_persistence_window)}
          </label>
        </div>
      `;
    }
    if (opt.value === "comparison_window") {
      return html`
        <div class="history-target-analysis-method-subopts">
          <label class="history-target-analysis-field">
            <span class="history-target-analysis-field-label">Compare to window</span>
            <select class="history-target-analysis-select" @change=${(e: Event) => this._onSelect("anomaly_comparison_window_id", e)}>
              <option value="" ?selected=${!a.anomaly_comparison_window_id}>— select window —</option>
              ${this.comparisonWindows.map((win) => html`
                <option value=${win.id} ?selected=${a.anomaly_comparison_window_id === win.id}>${win.label || win.id}</option>
              `)}
            </select>
          </label>
        </div>
      `;
    }
    return nothing;
  }

  private _renderAnomalyGroup(a: NormalizedAnalysis): TemplateResult {
    return html`
      <div class="history-target-analysis-group ${a.show_anomalies ? "is-open" : ""}">
        <label class="history-target-analysis-option">
          <input type="checkbox" .checked=${a.show_anomalies} @change=${(e: Event) => this._onCheckbox("show_anomalies", e)}>
          <span>Show anomalies</span>
        </label>
        ${a.show_anomalies ? html`
          <div class="history-target-analysis-group-body">
            <label class="history-target-analysis-field">
              <span class="history-target-analysis-field-label">Sensitivity</span>
              ${this._renderSelect("anomaly_sensitivity", ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS, a.anomaly_sensitivity)}
            </label>
            <div class="history-target-analysis-method-list">
              ${ANALYSIS_ANOMALY_METHOD_OPTIONS.map((opt) => {
                const isChecked = Array.isArray(a.anomaly_methods) && a.anomaly_methods.includes(opt.value);
                return html`
                  <div class="history-target-analysis-method-item">
                    <label class="history-target-analysis-option">
                      <input type="checkbox" .checked=${isChecked}
                        @change=${(e: Event) => this._onCheckbox(`anomaly_method_toggle_${opt.value}`, e)}>
                      <span>${opt.label}</span>
                      ${opt.help ? html`
                        <span class="analysis-method-help" tabindex="0">?</span>
                      ` : nothing}
                    </label>
                    ${isChecked ? this._renderAnomalyMethodSubopts(opt, a) : nothing}
                  </div>
                `;
              })}
            </div>
            ${Array.isArray(a.anomaly_methods) && a.anomaly_methods.length >= 2 ? html`
              <label class="history-target-analysis-field">
                <span class="history-target-analysis-field-label">When methods overlap</span>
                ${this._renderSelect("anomaly_overlap_mode", ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS, a.anomaly_overlap_mode)}
              </label>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderDeltaGroup(a: NormalizedAnalysis): TemplateResult {
    return html`
      <div class="history-target-analysis-group ${a.show_delta_analysis && this.canShowDeltaAnalysis ? "is-open" : ""}">
        <label class="history-target-analysis-option top">
          <input type="checkbox"
            .checked=${a.show_delta_analysis && this.canShowDeltaAnalysis}
            ?disabled=${!this.canShowDeltaAnalysis}
            @change=${(e: Event) => this._onCheckbox("show_delta_analysis", e)}>
          <span>
            Show delta vs selected date window
            ${!this.canShowDeltaAnalysis ? html`<br /><span class="history-target-analysis-option-help-text">Select a date window tab to enable delta analysis.</span>` : nothing}
          </span>
        </label>
        ${a.show_delta_analysis && this.canShowDeltaAnalysis ? html`
          <div class="history-target-analysis-group-body">
            <label class="history-target-analysis-option">
              <input type="checkbox" .checked=${a.show_delta_tooltip} @change=${(e: Event) => this._onCheckbox("show_delta_tooltip", e)}>
              <span>Show delta in tooltip</span>
            </label>
            <label class="history-target-analysis-option">
              <input type="checkbox" .checked=${a.show_delta_lines} @change=${(e: Event) => this._onCheckbox("show_delta_lines", e)}>
              <span>Show delta lines</span>
            </label>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderAnalysisPanel(a: NormalizedAnalysis, hasActive: boolean): TemplateResult {
    return html`
      <div class="history-target-analysis" role="cell">
        <div class="history-target-analysis-grid">
          <label class="history-target-analysis-option ${!hasActive ? "is-disabled" : ""}">
            <input type="checkbox" .checked=${a.hide_source_series && hasActive}
              ?disabled=${!hasActive}
              @change=${(e: Event) => this._onCheckbox("hide_source_series", e)}>
            <span>Hide source series</span>
          </label>
          ${this._renderTrendGroup(a)}
          <label class="history-target-analysis-option">
            <input type="checkbox" .checked=${a.show_summary_stats} @change=${(e: Event) => this._onCheckbox("show_summary_stats", e)}>
            <span>Show min / max / mean</span>
          </label>
          ${this._renderRateGroup(a)}
          ${this._renderThresholdGroup(a)}
          ${this._renderAnomalyGroup(a)}
          ${this._renderDeltaGroup(a)}
        </div>
      </div>
    `;
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
                <ha-state-icon .stateObj=${this.stateObj ?? null}></ha-state-icon>
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

        ${this._supportsAnalysis && this.analysis?.expanded
          ? this._renderAnalysisPanel(a, hasActive)
          : nothing}
      </div>
    `;
  }
}

customElements.define("dp-target-row", DpTargetRow);
