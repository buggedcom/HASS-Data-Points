import { LitElement, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-threshold-group.styles";
import type { NormalizedAnalysis } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";

export class DpAnalysisThresholdGroup extends LitElement {
  static properties = {
    analysis: { type: Object },
    entityId: { type: String, attribute: "entity-id" },
    unit: { type: String },
  };

  declare analysis: NormalizedAnalysis;

  declare entityId: string;

  declare unit: string;

  static styles = [sharedStyles, styles];

  constructor() {
    super();
    this.analysis = {} as NormalizedAnalysis;
    this.entityId = "";
    this.unit = "";
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
    this._emit("show_threshold_analysis", e.detail.checked);
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).checked);
  }

  private _onInput(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).value);
  }

  render() {
    const a = this.analysis;
    return html`
      <dp-analysis-group
        .label=${"Show threshold analysis"}
        .checked=${a.show_threshold_analysis}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input type="checkbox" .checked=${a.show_threshold_shading} @change=${(e: Event) => this._onCheckbox("show_threshold_shading", e)}>
          <span>Shade threshold area</span>
        </label>
        <label class="field">
          <span class="field-label">Threshold</span>
          <div class="toggle-group">
            <input class="input" type="number" step="any" inputmode="decimal"
              .value=${a.threshold_value} placeholder="Threshold"
              @change=${(e: Event) => this._onInput("threshold_value", e)}>
            ${this.unit ? html`<span>${this.unit}</span>` : nothing}
          </div>
        </label>
        ${a.show_threshold_shading ? html`
          <label class="field">
            <span class="field-label">Shade area</span>
            ${this._renderSelect("threshold_direction", [
              { value: "above", label: "Shade above" },
              { value: "below", label: "Shade below" },
            ], a.threshold_direction)}
          </label>
        ` : nothing}
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-threshold-group", DpAnalysisThresholdGroup);
