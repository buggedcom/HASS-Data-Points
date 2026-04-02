import { LitElement, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-anomaly-group.styles";
import type { NormalizedAnalysis, ComparisonWindow } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";
import "@/atoms/analysis/dp-analysis-method-subopts/dp-analysis-method-subopts";

export const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const ANALYSIS_ANOMALY_METHOD_OPTIONS = [
  { value: "trend_residual", label: "Trend deviation", help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline." },
  { value: "rate_of_change", label: "Sudden change", help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions." },
  { value: "iqr", label: "Statistical outlier (IQR)", help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages." },
  { value: "rolling_zscore", label: "Rolling Z-score", help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series." },
  { value: "persistence", label: "Flat-line / stuck value", help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings." },
  { value: "comparison_window", label: "Comparison window deviation", help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year." },
];

export const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

export const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

export const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

export class DpAnalysisAnomalyGroup extends LitElement {
  static properties = {
    analysis: { type: Object },
    entityId: { type: String, attribute: "entity-id" },
    comparisonWindows: { type: Array, attribute: "comparison-windows" },
  };

  declare analysis: NormalizedAnalysis;

  declare entityId: string;

  declare comparisonWindows: ComparisonWindow[];

  static styles = [sharedStyles, styles];

  constructor() {
    super();
    this.analysis = {} as NormalizedAnalysis;
    this.entityId = "";
    this.comparisonWindows = [];
  }

  private _emit(key: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent("dp-group-analysis-change", {
        detail: { entityId: this.entityId, key, value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _renderSelect(key: string, options: { value: string; label: string }[], value: string): TemplateResult {
    return html`
      <select class="select" @change=${(e: Event) => this._emit(key, (e.target as HTMLSelectElement).value)}>
        ${options.map((opt) => html`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
  }

  private _onGroupChange(e: CustomEvent) {
    this._emit("show_anomalies", e.detail.checked);
  }

  private _renderMethodSubopts(opt: { value: string }, a: NormalizedAnalysis): TemplateResult | typeof nothing {
    if (opt.value === "rate_of_change") {
      return html`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Rate window</span>
            ${this._renderSelect("anomaly_rate_window", ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS, a.anomaly_rate_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
    }
    if (opt.value === "rolling_zscore") {
      return html`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Rolling window</span>
            ${this._renderSelect("anomaly_zscore_window", ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS, a.anomaly_zscore_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
    }
    if (opt.value === "persistence") {
      return html`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Min flat duration</span>
            ${this._renderSelect("anomaly_persistence_window", ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS, a.anomaly_persistence_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
    }
    if (opt.value === "comparison_window") {
      return html`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Compare to window</span>
            <select class="select" @change=${(e: Event) => this._emit("anomaly_comparison_window_id", (e.target as HTMLSelectElement).value)}>
              <option value="" ?selected=${!a.anomaly_comparison_window_id}>— select window —</option>
              ${this.comparisonWindows.map((win) => html`
                <option value=${win.id} ?selected=${a.anomaly_comparison_window_id === win.id}>${win.label || win.id}</option>
              `)}
            </select>
          </label>
        </dp-analysis-method-subopts>
      `;
    }
    return nothing;
  }

  render() {
    const a = this.analysis;
    return html`
      <dp-analysis-group
        .label=${"Show anomalies"}
        .checked=${a.show_anomalies}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">Sensitivity</span>
          ${this._renderSelect("anomaly_sensitivity", ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS, a.anomaly_sensitivity)}
        </label>
        <div class="method-list">
          ${ANALYSIS_ANOMALY_METHOD_OPTIONS.map((opt) => {
            const isChecked = Array.isArray(a.anomaly_methods) && a.anomaly_methods.includes(opt.value);
            return html`
              <div class="method-item">
                <label class="option">
                  <input type="checkbox" .checked=${isChecked}
                    @change=${(e: Event) => this._emit(`anomaly_method_toggle_${opt.value}`, (e.target as HTMLInputElement).checked)}>
                  <span>${opt.label}</span>
                  ${opt.help ? html`<span class="method-help" tabindex="0">?</span>` : nothing}
                </label>
                ${isChecked ? this._renderMethodSubopts(opt, a) : nothing}
              </div>
            `;
          })}
        </div>
        ${Array.isArray(a.anomaly_methods) && a.anomaly_methods.length >= 2 ? html`
          <label class="field">
            <span class="field-label">When methods overlap</span>
            ${this._renderSelect("anomaly_overlap_mode", ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS, a.anomaly_overlap_mode)}
          </label>
        ` : nothing}
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-anomaly-group", DpAnalysisAnomalyGroup);
