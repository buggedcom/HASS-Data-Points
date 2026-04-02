import { LitElement, html } from "lit";
import type { TemplateResult } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-rate-group.styles";
import type { NormalizedAnalysis } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";

export const ANALYSIS_RATE_WINDOW_OPTIONS = [
  { value: "point_to_point", label: "Point to point" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

export class DpAnalysisRateGroup extends LitElement {
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
    this._emit("show_rate_of_change", e.detail.checked);
  }

  render() {
    const a = this.analysis;
    return html`
      <dp-analysis-group
        .label=${"Show rate of change"}
        .checked=${a.show_rate_of_change}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">Rate window</span>
          ${this._renderSelect("rate_window", ANALYSIS_RATE_WINDOW_OPTIONS, a.rate_window)}
        </label>
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-rate-group", DpAnalysisRateGroup);
