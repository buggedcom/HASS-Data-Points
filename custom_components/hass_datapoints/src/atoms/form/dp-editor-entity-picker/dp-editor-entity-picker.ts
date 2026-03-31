import { LitElement, html, css, PropertyValues } from "lit";
import type { HassLike } from "@/lib/types";
type HaSelector = HTMLElement & {
  label?: string;
  selector?: unknown;
  hass?: HassLike;
  value?: string;
};
export class DpEditorEntityPicker extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    hass: { type: Object },
  };
  declare label: string;
  declare value: string;
  declare hass: HassLike | null;
  static styles = css`
    :host { display: block; }
    ha-selector { display: block; width: 100%; }
  `;
  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.hass = null;
  }
  firstUpdated() {
    const el = this.shadowRoot!.querySelector("ha-selector") as HaSelector | null;
    if (el) {
      el.label = this.label;
      el.selector = { entity: {} };
      if (this.hass) { el.hass = this.hass; }
      el.value = this.value;
    }
  }
  updated(changedProps: PropertyValues) {
    const el = this.shadowRoot!.querySelector("ha-selector") as HaSelector | null;
    if (!el) { return; }
    if (changedProps.has("value")) { el.value = this.value; }
    if (changedProps.has("hass") && this.hass) { el.hass = this.hass; }
  }
  _onValueChanged(e: CustomEvent<{ value: string }>) {
    this.dispatchEvent(
      new CustomEvent("dp-entity-change", {
        detail: { value: e.detail.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`<ha-selector @value-changed=${this._onValueChanged}></ha-selector>`;
  }
}
customElements.define("dp-editor-entity-picker", DpEditorEntityPicker);
