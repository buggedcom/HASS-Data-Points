import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-analysis-section.styles";
import "@/atoms/display/dp-sidebar-options-section/dp-sidebar-options-section";
import "@/atoms/form/dp-radio-group/dp-radio-group";

export const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

export class DpSidebarAnalysisSection extends LitElement {
  static properties = {
    anomalyOverlapMode: { type: String, attribute: "anomaly-overlap-mode" },
    collapsible: { type: Boolean },
    open: { type: Boolean },
  };

  declare anomalyOverlapMode: string;

  declare collapsible: boolean;

  declare open: boolean;

  static styles = styles;

  constructor() {
    super();
    this.anomalyOverlapMode = "all";
    this.collapsible = false;
    this.open = true;
  }

  private _emitAnalysis(kind: string, value: boolean | string) {
    this.dispatchEvent(
      new CustomEvent("dp-analysis-change", { detail: { kind, value }, bubbles: true, composed: true }),
    );
  }

  private _onAnomalyOverlapModeChange(e: CustomEvent) {
    this._emitAnalysis("anomaly_overlap_mode", e.detail.value);
  }

  render() {
    return html`
      <dp-sidebar-options-section
        .title=${"Analysis"}
        .subtitle=${"Configure how anomalies and overlapping detections are displayed."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <dp-radio-group
          .name=${"chart-anomaly-overlap-mode"}
          .value=${this.anomalyOverlapMode}
          .options=${ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS}
          @dp-radio-change=${this._onAnomalyOverlapModeChange}
        ></dp-radio-group>
      </dp-sidebar-options-section>
    `;
  }
}

customElements.define("dp-sidebar-analysis-section", DpSidebarAnalysisSection);
