import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./sensor-header.styles";
import type { HassLike } from "@/lib/types";

export class SensorHeader extends LitElement {
  @property({ type: String }) accessor name: string = "—";

  @property({ type: String }) accessor value: string = "—";

  @property({ type: String }) accessor unit: string = "";

  @property({ type: Object, attribute: false }) accessor stateObj: Record<
    string,
    unknown
  > | null = null;

  @property({ type: Object, attribute: false }) accessor hass: HassLike | null =
    null;

  static styles = styles;

  render() {
    return html`
      <div class="header">
        <div class="name">${this.name}</div>
        <div class="icon">
          <ha-state-icon
            .stateObj=${this.stateObj}
            .hass=${this.hass}
          ></ha-state-icon>
        </div>
      </div>
      <div class="info">
        <span class="value first-part">${this.value}</span>
        <span class="measurement">${this.unit}</span>
      </div>
    `;
  }
}
customElements.define("sensor-header", SensorHeader);
