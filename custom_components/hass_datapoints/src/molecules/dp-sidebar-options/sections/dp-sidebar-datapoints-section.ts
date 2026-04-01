import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-datapoints-section.styles";
import "@/atoms/display/dp-sidebar-options-section/dp-sidebar-options-section";
import "@/atoms/form/dp-radio-group/dp-radio-group";

export const DATAPOINT_SCOPE_OPTIONS = [
  { value: "linked", label: "Linked to selected targets" },
  { value: "all", label: "All datapoints" },
  { value: "hidden", label: "Hide datapoints" },
];

export class DpSidebarDatapointsSection extends LitElement {
  static properties = {
    datapointScope: { type: String, attribute: "datapoint-scope" },
  };

  declare datapointScope: string;

  static styles = styles;

  constructor() {
    super();
    this.datapointScope = "linked";
  }

  private _onScopeChange(e: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent("dp-scope-change", { detail: { value: e.detail.value }, bubbles: true, composed: true }),
    );
  }

  render() {
    return html`
      <dp-sidebar-options-section
        .title=${"Datapoints"}
        .subtitle=${"Choose which annotation datapoints appear on the chart."}
      >
        <dp-radio-group
          .name=${"datapoint-scope"}
          .value=${this.datapointScope}
          .options=${DATAPOINT_SCOPE_OPTIONS}
          @dp-radio-change=${this._onScopeChange}
        ></dp-radio-group>
      </dp-sidebar-options-section>
    `;
  }
}

customElements.define("dp-sidebar-datapoints-section", DpSidebarDatapointsSection);
