import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

import type { TemplateResult } from "lit";
import { sharedStyles } from "../analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./analysis-rate-group.styles";
import type { NormalizedAnalysis } from "@/molecules/target-row/types";
import "@/atoms/analysis/analysis-group/analysis-group";

export const ANALYSIS_RATE_WINDOW_OPTIONS = [
  { value: "point_to_point", label: "Point to point" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

export class AnalysisRateGroup extends LitElement {
  @property({ type: Object }) accessor analysis: NormalizedAnalysis =
    {} as NormalizedAnalysis;

  @property({ type: String, attribute: "entity-id" })
  accessor entityId: string = "";

  static styles = [sharedStyles, styles];

  private _emit(key: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent("dp-group-analysis-change", {
        detail: { entityId: this.entityId, key, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _renderSelect(
    key: string,
    options: { value: string; label: string }[],
    value: string
  ): TemplateResult {
    return html`
      <select
        class="select"
        @change=${(e: Event) =>
          this._emit(key, (e.target as HTMLSelectElement).value)}
      >
        ${options.map(
          (opt) =>
            html`<option value=${opt.value} ?selected=${opt.value === value}>
              ${opt.label}
            </option>`
        )}
      </select>
    `;
  }

  private _onGroupChange(e: CustomEvent) {
    this._emit("show_rate_of_change", e.detail.checked);
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).checked);
  }

  render() {
    const a = this.analysis;
    return html`
      <analysis-group
        .label=${"Show rate of change"}
        .checked=${a.show_rate_of_change}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${a.show_rate_crosshairs}
            @change=${(e: Event) => this._onCheckbox("show_rate_crosshairs", e)}
          />
          <span>Show rate of change crosshairs</span>
        </label>
        <label class="field">
          <span class="field-label">Rate window</span>
          ${this._renderSelect(
            "rate_window",
            ANALYSIS_RATE_WINDOW_OPTIONS,
            a.rate_window
          )}
        </label>
      </analysis-group>
    `;
  }
}

customElements.define("analysis-rate-group", AnalysisRateGroup);
