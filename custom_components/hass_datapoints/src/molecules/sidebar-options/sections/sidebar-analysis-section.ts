import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

import { styles } from "./sidebar-analysis-section.styles";
import "@/atoms/display/sidebar-options-section/sidebar-options-section";
import "@/atoms/form/radio-group/radio-group";

export const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

export class SidebarAnalysisSection extends LitElement {
  @property({ type: String, attribute: "anomaly-overlap-mode" })
  accessor anomalyOverlapMode: string = "all";

  /** True when at least one target has "Show anomalies" enabled. */
  @property({ type: Boolean, attribute: false })
  accessor anyAnomaliesEnabled: boolean = false;

  @property({ type: Boolean }) accessor collapsible: boolean = false;

  @property({ type: Boolean }) accessor open: boolean = true;

  static styles = styles;

  private _emitAnalysis(kind: string, value: boolean | string) {
    this.dispatchEvent(
      new CustomEvent("dp-analysis-change", {
        detail: { kind, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onAnomalyOverlapModeChange(e: CustomEvent) {
    this._emitAnalysis("anomaly_overlap_mode", e.detail.value);
  }

  render() {
    return html`
      <sidebar-options-section
        .title=${"Analysis"}
        .subtitle=${"Configure how anomalies and overlapping detections are displayed."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        ${this.anyAnomaliesEnabled
          ? html`
              <radio-group
                .name=${"chart-anomaly-overlap-mode"}
                .value=${this.anomalyOverlapMode}
                .options=${ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS}
                @dp-radio-change=${this._onAnomalyOverlapModeChange}
              ></radio-group>
            `
          : html`
              <p class="no-anomalies-notice">
                Enable anomaly detection on a target first — open a target's
                settings and check <strong>Show anomalies</strong>.
              </p>
            `}
      </sidebar-options-section>
    `;
  }
}

customElements.define("sidebar-analysis-section", SidebarAnalysisSection);
