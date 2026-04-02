import { LitElement, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-trend-group.styles";
import type { NormalizedAnalysis } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";

export const ANALYSIS_TREND_METHOD_OPTIONS = [
  { value: "rolling_average", label: "Rolling average" },
  { value: "linear_trend", label: "Linear trend" },
];

export const ANALYSIS_TREND_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "21d", label: "21 days" },
  { value: "28d", label: "28 days" },
];

export class DpAnalysisTrendGroup extends LitElement {
  static properties = {
    analysis: { type: Object },
    entityId: { type: String, attribute: "entity-id" },
  };

  declare analysis: NormalizedAnalysis;

  declare entityId: string;

  static styles = [sharedStyles, styles];

  constructor() {
    super();
    this.analysis = {} as NormalizedAnalysis;
    this.entityId = "";
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
    this._emit("show_trend_lines", e.detail.checked);
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).checked);
  }

  render() {
    const a = this.analysis;
    return html`
      <dp-analysis-group
        .label=${"Show trend lines"}
        .checked=${a.show_trend_lines}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input type="checkbox" .checked=${a.show_trend_crosshairs} @change=${(e: Event) => this._onCheckbox("show_trend_crosshairs", e)}>
          <span>Show trend crosshairs</span>
        </label>
        <label class="field">
          <span class="field-label">Trend method</span>
          ${this._renderSelect("trend_method", ANALYSIS_TREND_METHOD_OPTIONS, a.trend_method)}
        </label>
        ${a.trend_method === "rolling_average" ? html`
          <label class="field">
            <span class="field-label">Trend window</span>
            ${this._renderSelect("trend_window", ANALYSIS_TREND_WINDOW_OPTIONS, a.trend_window)}
          </label>
        ` : nothing}
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-trend-group", DpAnalysisTrendGroup);
