import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

import { styles } from "./sidebar-chart-display-section.styles";
import "@/atoms/display/sidebar-options-section/sidebar-options-section";
import "@/atoms/form/checkbox-list/checkbox-list";
import "@/atoms/form/radio-group/radio-group";

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

export const HOVER_SNAP_MODE_OPTIONS = [
  { value: "follow_series", label: "Follow the series" },
  { value: "snap_to_data_points", label: "Snap to data points" },
];

export class SidebarChartDisplaySection extends LitElement {
  @property({ type: Boolean, attribute: "show-tooltips" })
  accessor showTooltips: boolean = true;

  @property({ type: Boolean, attribute: "show-hover-guides" })
  accessor showHoverGuides: boolean = false;

  @property({ type: Boolean, attribute: "show-correlated-anomalies" })
  accessor showCorrelatedAnomalies: boolean = false;

  @property({ type: Boolean, attribute: "show-data-gaps" })
  accessor showDataGaps: boolean = true;

  @property({ type: String, attribute: "data-gap-threshold" })
  accessor dataGapThreshold: string = "2h";

  @property({ type: String, attribute: "y-axis-mode" })
  accessor yAxisMode: string = "combined";

  @property({ type: String, attribute: "hover-snap-mode" })
  accessor hoverSnapMode: string = "follow_series";

  @property({ type: Boolean }) accessor collapsible: boolean = false;

  @property({ type: Boolean }) accessor open: boolean = true;

  static styles = styles;

  private _emitDisplay(kind: string, value: boolean | string) {
    this.dispatchEvent(
      new CustomEvent("dp-display-change", {
        detail: { kind, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onCheckboxChange(e: CustomEvent) {
    const { name, checked } = e.detail;
    this._emitDisplay(name, checked);
  }

  private _onGapThresholdChange(e: Event) {
    this._emitDisplay(
      "data_gap_threshold",
      (e.target as HTMLSelectElement).value
    );
  }

  private _onYAxisModeChange(e: CustomEvent) {
    this._emitDisplay("y_axis_mode", e.detail.value);
  }

  private _onHoverSnapModeChange(e: CustomEvent) {
    this._emitDisplay("hover_snap_mode", e.detail.value);
  }

  render() {
    return html`
      <sidebar-options-section
        .title=${"Chart Display"}
        .subtitle=${"Configure visual and interaction behaviour for the chart."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <checkbox-list
          .items=${[
            {
              name: "tooltips",
              label: "Show tooltips",
              checked: this.showTooltips,
            },
            {
              name: "hover_guides",
              label: "Emphasize hover guides",
              checked: this.showHoverGuides,
            },
            {
              name: "correlated_anomalies",
              label: "Highlight correlated anomalies",
              checked: this.showCorrelatedAnomalies,
            },
            {
              name: "data_gaps",
              label: "Show data gaps",
              checked: this.showDataGaps,
            },
          ]}
          @dp-item-change=${this._onCheckboxChange}
        ></checkbox-list>
        <div class="is-subopt ${this.showDataGaps ? "" : "is-disabled"}">
          <select
            class="gap-select"
            ?disabled=${!this.showDataGaps}
            @change=${this._onGapThresholdChange}
          >
            ${DATA_GAP_THRESHOLD_OPTIONS.map(
              (opt) => html`
                <option
                  value=${opt.value}
                  ?selected=${opt.value === this.dataGapThreshold}
                >
                  ${opt.label}
                </option>
              `
            )}
          </select>
          <span>Gap threshold</span>
        </div>
        <div class="y-axis-group">
          <radio-group
            .name=${"chart-y-axis-mode"}
            .value=${this.yAxisMode}
            .options=${Y_AXIS_MODE_OPTIONS}
            @dp-radio-change=${this._onYAxisModeChange}
          ></radio-group>
        </div>
        <div class="y-axis-group">
          <radio-group
            .name=${"chart-hover-snap-mode"}
            .value=${this.hoverSnapMode}
            .options=${HOVER_SNAP_MODE_OPTIONS}
            @dp-radio-change=${this._onHoverSnapModeChange}
          ></radio-group>
        </div>
      </sidebar-options-section>
    `;
  }
}

customElements.define(
  "sidebar-chart-display-section",
  SidebarChartDisplaySection
);
