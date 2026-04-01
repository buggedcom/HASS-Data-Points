import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-datapoint-display-section.styles";
import "@/atoms/display/dp-sidebar-options-section/dp-sidebar-options-section";
import "@/atoms/form/dp-checkbox-list/dp-checkbox-list";

export class DpSidebarDatapointDisplaySection extends LitElement {
  static properties = {
    showIcons: { type: Boolean, attribute: "show-icons" },
    showLines: { type: Boolean, attribute: "show-lines" },
  };

  declare showIcons: boolean;
  declare showLines: boolean;

  static styles = styles;

  constructor() {
    super();
    this.showIcons = true;
    this.showLines = true;
  }

  private _onCheckboxChange(e: CustomEvent) {
    const { name, checked } = e.detail;
    this.dispatchEvent(
      new CustomEvent("dp-display-change", { detail: { kind: name, value: checked }, bubbles: true, composed: true }),
    );
  }

  render() {
    return html`
      <dp-sidebar-options-section
        .title=${"Datapoint Display"}
        .subtitle=${"Control how annotation datapoints are rendered on the chart."}
      >
        <dp-checkbox-list
          .items=${[
            { name: "icons", label: "Show datapoint icons", checked: this.showIcons },
            { name: "lines", label: "Show dotted lines", checked: this.showLines },
          ]}
          @dp-item-change=${this._onCheckboxChange}
        ></dp-checkbox-list>
      </dp-sidebar-options-section>
    `;
  }
}

customElements.define("dp-sidebar-datapoint-display-section", DpSidebarDatapointDisplaySection);
