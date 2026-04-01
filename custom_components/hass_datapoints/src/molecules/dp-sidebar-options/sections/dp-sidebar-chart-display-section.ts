import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-chart-display-section.styles";
import "@/atoms/display/dp-sidebar-options-section/dp-sidebar-options-section";
import "@/atoms/form/dp-checkbox-list/dp-checkbox-list";
import "@/atoms/form/dp-radio-group/dp-radio-group";

export const DATA_GAP_THRESHOLD_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

export const Y_AXIS_MODE_OPTIONS = [
  { value: "combined", label: "Combine y-axis by unit" },
  { value: "unique", label: "Unique y-axis per series" },
  { value: "split", label: "Split series into rows" },
];

export class DpSidebarChartDisplaySection extends LitElement {
  static properties = {
    showTooltips: { type: Boolean, attribute: "show-tooltips" },
    showHoverGuides: { type: Boolean, attribute: "show-hover-guides" },
    showCorrelatedAnomalies: { type: Boolean, attribute: "show-correlated-anomalies" },
    showDataGaps: { type: Boolean, attribute: "show-data-gaps" },
    dataGapThreshold: { type: String, attribute: "data-gap-threshold" },
    yAxisMode: { type: String, attribute: "y-axis-mode" },
  };

  declare showTooltips: boolean;
  declare showHoverGuides: boolean;
  declare showCorrelatedAnomalies: boolean;
  declare showDataGaps: boolean;
  declare dataGapThreshold: string;
  declare yAxisMode: string;

  static styles = styles;

  constructor() {
    super();
    this.showTooltips = true;
    this.showHoverGuides = false;
    this.showCorrelatedAnomalies = false;
    this.showDataGaps = true;
    this.dataGapThreshold = "2h";
    this.yAxisMode = "combined";
  }

  private _emitDisplay(kind: string, value: boolean | string) {
    this.dispatchEvent(
      new CustomEvent("dp-display-change", { detail: { kind, value }, bubbles: true, composed: true }),
    );
  }

  private _onCheckboxChange(e: CustomEvent) {
    const { name, checked } = e.detail;
    this._emitDisplay(name, checked);
  }

  private _onGapThresholdChange(e: Event) {
    this._emitDisplay("data_gap_threshold", (e.target as HTMLSelectElement).value);
  }

  private _onYAxisModeChange(e: CustomEvent) {
    this._emitDisplay("y_axis_mode", e.detail.value);
  }

  render() {
    return html`
      <dp-sidebar-options-section
        .title=${"Chart Display"}
        .subtitle=${"Configure visual and interaction behaviour for the chart."}
      >
        <dp-checkbox-list
          .items=${[
            { name: "tooltips", label: "Show tooltips", checked: this.showTooltips },
            { name: "hover_guides", label: "Emphasize hover guides", checked: this.showHoverGuides },
            { name: "correlated_anomalies", label: "Highlight correlated anomalies", checked: this.showCorrelatedAnomalies },
            { name: "data_gaps", label: "Show data gaps", checked: this.showDataGaps },
          ]}
          @dp-item-change=${this._onCheckboxChange}
        ></dp-checkbox-list>
        <div class="is-subopt ${this.showDataGaps ? "" : "is-disabled"}">
          <select
            class="gap-select"
            ?disabled=${!this.showDataGaps}
            @change=${this._onGapThresholdChange}
          >
            ${DATA_GAP_THRESHOLD_OPTIONS.map((opt) => html`
              <option value=${opt.value} ?selected=${opt.value === this.dataGapThreshold}>${opt.label}</option>
            `)}
          </select>
          <span>Gap threshold</span>
        </div>
        <div class="y-axis-group">
          <dp-radio-group
            .name=${"chart-y-axis-mode"}
            .value=${this.yAxisMode}
            .options=${Y_AXIS_MODE_OPTIONS}
            @dp-radio-change=${this._onYAxisModeChange}
          ></dp-radio-group>
        </div>
      </dp-sidebar-options-section>
    `;
  }
}

customElements.define("dp-sidebar-chart-display-section", DpSidebarChartDisplaySection);
