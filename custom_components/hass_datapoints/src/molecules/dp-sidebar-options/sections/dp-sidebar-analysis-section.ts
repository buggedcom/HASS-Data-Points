import { LitElement, html, nothing } from "lit";
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
    anyAnomaliesEnabled: { type: Boolean, attribute: false },
    collapsible: { type: Boolean },
    open: { type: Boolean },
  };

  declare anomalyOverlapMode: string;

  /** True when at least one target has "Show anomalies" enabled. */
  declare anyAnomaliesEnabled: boolean;

  declare collapsible: boolean;

  declare open: boolean;

  static styles = styles;

  constructor() {
    super();
    this.anomalyOverlapMode = "all";
    this.anyAnomaliesEnabled = false;
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
        ${this.anyAnomaliesEnabled ? html`
          <dp-radio-group
            .name=${"chart-anomaly-overlap-mode"}
            .value=${this.anomalyOverlapMode}
            .options=${ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS}
            @dp-radio-change=${this._onAnomalyOverlapModeChange}
          ></dp-radio-group>
        ` : html`
          <p class="no-anomalies-notice">
            Enable anomaly detection on a target first — open a target's settings and check <strong>Show anomalies</strong>.
          </p>
        `}
      </dp-sidebar-options-section>
    `;
  }
}

customElements.define("dp-sidebar-analysis-section", DpSidebarAnalysisSection);
