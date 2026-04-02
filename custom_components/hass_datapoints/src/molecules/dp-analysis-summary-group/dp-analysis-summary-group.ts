import { LitElement, html } from "lit";
import { sharedStyles } from "../dp-analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./dp-analysis-summary-group.styles";
import type { NormalizedAnalysis } from "../dp-target-row/types";
import "@/atoms/analysis/dp-analysis-group/dp-analysis-group";

export class DpAnalysisSummaryGroup extends LitElement {
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

  private _onGroupChange(e: CustomEvent) {
    this._emit("show_summary_stats", e.detail.checked);
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit(key, (e.target as HTMLInputElement).checked);
  }

  render() {
    const a = this.analysis;
    return html`
      <dp-analysis-group
        .label=${"Show min / max / mean"}
        .checked=${a.show_summary_stats}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${a.show_summary_stats_shading}
            @change=${(e: Event) => this._onCheckbox("show_summary_stats_shading", e)}
          >
          <span>Show range shading</span>
        </label>
      </dp-analysis-group>
    `;
  }
}

customElements.define("dp-analysis-summary-group", DpAnalysisSummaryGroup);
