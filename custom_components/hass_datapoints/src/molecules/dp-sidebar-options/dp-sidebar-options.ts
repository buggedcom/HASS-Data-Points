import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-options.styles";
import "./sections/dp-sidebar-datapoints-section";
import "./sections/dp-sidebar-datapoint-display-section";
import "./sections/dp-sidebar-chart-display-section";

export class DpSidebarOptions extends LitElement {
  static properties = {
    datapointScope: { type: String, attribute: "datapoint-scope" },
    showIcons: { type: Boolean, attribute: "show-icons" },
    showLines: { type: Boolean, attribute: "show-lines" },
    showTooltips: { type: Boolean, attribute: "show-tooltips" },
    showHoverGuides: { type: Boolean, attribute: "show-hover-guides" },
    showCorrelatedAnomalies: { type: Boolean, attribute: "show-correlated-anomalies" },
    showDataGaps: { type: Boolean, attribute: "show-data-gaps" },
    dataGapThreshold: { type: String, attribute: "data-gap-threshold" },
    yAxisMode: { type: String, attribute: "y-axis-mode" },
    // Accordion open states
    targetsOpen: { type: Boolean, attribute: "targets-open" },
    datapointsOpen: { type: Boolean, attribute: "datapoints-open" },
    chartOpen: { type: Boolean, attribute: "chart-open" },
  };

  declare datapointScope: string;

  declare showIcons: boolean;

  declare showLines: boolean;

  declare showTooltips: boolean;

  declare showHoverGuides: boolean;

  declare showCorrelatedAnomalies: boolean;

  declare showDataGaps: boolean;

  declare dataGapThreshold: string;

  declare yAxisMode: string;

  declare targetsOpen: boolean;

  declare datapointsOpen: boolean;

  declare chartOpen: boolean;

  static styles = styles;

  constructor() {
    super();
    this.datapointScope = "linked";
    this.showIcons = true;
    this.showLines = true;
    this.showTooltips = true;
    this.showHoverGuides = false;
    this.showCorrelatedAnomalies = false;
    this.showDataGaps = true;
    this.dataGapThreshold = "2h";
    this.yAxisMode = "combined";
    this.targetsOpen = true;
    this.datapointsOpen = true;
    this.chartOpen = true;
  }

  private _onTargetsToggle(e: CustomEvent) {
    this.targetsOpen = e.detail.open;
    this._emitAccordionChange();
  }

  private _onDatapointsToggle(e: CustomEvent) {
    this.datapointsOpen = e.detail.open;
    this._emitAccordionChange();
  }

  private _onChartToggle(e: CustomEvent) {
    this.chartOpen = e.detail.open;
    this._emitAccordionChange();
  }

  private _emitAccordionChange() {
    this.dispatchEvent(
      new CustomEvent("dp-accordion-change", {
        detail: {
          targetsOpen: this.targetsOpen,
          datapointsOpen: this.datapointsOpen,
          chartOpen: this.chartOpen,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="sidebar-options-card">
        <dp-sidebar-datapoints-section
          .datapointScope=${this.datapointScope}
          collapsible
          .open=${this.targetsOpen}
          @dp-section-toggle=${this._onTargetsToggle}
        ></dp-sidebar-datapoints-section>
        <dp-sidebar-datapoint-display-section
          .showIcons=${this.showIcons}
          .showLines=${this.showLines}
          collapsible
          .open=${this.datapointsOpen}
          @dp-section-toggle=${this._onDatapointsToggle}
        ></dp-sidebar-datapoint-display-section>
        <dp-sidebar-chart-display-section
          .showTooltips=${this.showTooltips}
          .showHoverGuides=${this.showHoverGuides}
          .showCorrelatedAnomalies=${this.showCorrelatedAnomalies}
          .showDataGaps=${this.showDataGaps}
          .dataGapThreshold=${this.dataGapThreshold}
          .yAxisMode=${this.yAxisMode}
          collapsible
          .open=${this.chartOpen}
          @dp-section-toggle=${this._onChartToggle}
        ></dp-sidebar-chart-display-section>
      </div>
    `;
  }
}

customElements.define("dp-sidebar-options", DpSidebarOptions);
