import { LitElement, html, nothing } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-delta-group.styles";
import type { NormalizedAnalysis } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";

export class DpAnalysisDeltaGroup extends LitElement {
  static properties = {
    analysis: { type: Object },
    entityId: { type: String, attribute: "entity-id" },
    canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" },
  };

  declare analysis: NormalizedAnalysis;
  declare entityId: string;
  declare canShowDeltaAnalysis: boolean;

  static styles = [sharedStyles, styles];

  constructor() {
    super();
    this.analysis = {} as NormalizedAnalysis;
    this.entityId = "";
    this.canShowDeltaAnalysis = false;
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

  private _onGroupChange(e: CustomEvent) {
    this._emit("show_delta_analysis", e.detail.checked);
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).checked);
  }

  render() {
    const a = this.analysis;
    const isOpen = a.show_delta_analysis && this.canShowDeltaAnalysis;

    return html`
      <dp-analysis-group
        .label=${"Show delta vs selected date window"}
        .checked=${isOpen}
        .disabled=${!this.canShowDeltaAnalysis}
        .alignTop=${true}
        @dp-group-change=${this._onGroupChange}
      >
        ${!this.canShowDeltaAnalysis ? html`
          <span slot="hint"><br /><span class="help-text">Select a date window tab to enable delta analysis.</span></span>
        ` : nothing}
        <label class="option">
          <input type="checkbox" .checked=${a.show_delta_tooltip} @change=${(e: Event) => this._onCheckbox("show_delta_tooltip", e)}>
          <span>Show delta in tooltip</span>
        </label>
        <label class="option">
          <input type="checkbox" .checked=${a.show_delta_lines} @change=${(e: Event) => this._onCheckbox("show_delta_lines", e)}>
          <span>Show delta lines</span>
        </label>
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-delta-group", DpAnalysisDeltaGroup);
