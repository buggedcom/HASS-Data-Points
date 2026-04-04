import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

import { styles } from "./sidebar-datapoints-section.styles";
import "@/atoms/display/sidebar-options-section/sidebar-options-section";
import "@/atoms/form/radio-group/radio-group";

export const DATAPOINT_SCOPE_OPTIONS = [
  { value: "linked", label: "Linked to selected targets" },
  { value: "all", label: "All datapoints" },
  { value: "hidden", label: "Hide datapoints" },
];

export class SidebarDatapointsSection extends LitElement {
  @property({ type: String, attribute: "datapoint-scope" })
  accessor datapointScope: string = "linked";

  @property({ type: Boolean }) accessor collapsible: boolean = false;

  @property({ type: Boolean }) accessor open: boolean = true;

  static styles = styles;

  private _onScopeChange(e: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent("dp-scope-change", {
        detail: { value: e.detail.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <sidebar-options-section
        .title=${"Datapoints"}
        .subtitle=${"Choose which annotation datapoints appear on the chart."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <radio-group
          .name=${"datapoint-scope"}
          .value=${this.datapointScope}
          .options=${DATAPOINT_SCOPE_OPTIONS}
          @dp-radio-change=${this._onScopeChange}
        ></radio-group>
      </sidebar-options-section>
    `;
  }
}

customElements.define("sidebar-datapoints-section", SidebarDatapointsSection);
