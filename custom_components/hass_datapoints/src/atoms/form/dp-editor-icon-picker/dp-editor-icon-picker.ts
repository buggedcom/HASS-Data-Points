import { LitElement, html, css, PropertyValues } from "lit";
import type { HassLike } from "@/lib/types";
type HaIconPicker = HTMLElement & {
  label?: string;
  hass?: HassLike;
  value?: string;
};
export class DpEditorIconPicker extends LitElement {
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
    ha-icon-picker { display: block; width: 100%; }
  `;
  constructor() {
    super();
    this.label = "";
    this.value = "mdi:bookmark";
    this.hass = null;
  }
  firstUpdated() {
    const el = this.shadowRoot!.querySelector("ha-icon-picker") as HaIconPicker | null;
    if (el) {
      el.label = this.label;
      if (this.hass) { el.hass = this.hass; }
      el.value = this.value;
    }
  }
  updated(changedProps: PropertyValues) {
    const el = this.shadowRoot!.querySelector("ha-icon-picker") as HaIconPicker | null;
    if (!el) { return; }
    if (changedProps.has("value")) { el.value = this.value; }
    if (changedProps.has("hass") && this.hass) { el.hass = this.hass; }
  }
  _onValueChanged(e: CustomEvent<{ value: string }>) {
    this.dispatchEvent(
      new CustomEvent("dp-icon-change", {
        detail: { value: e.detail.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`<ha-icon-picker @value-changed=${this._onValueChanged}></ha-icon-picker>`;
  }
}
customElements.define("dp-editor-icon-picker", DpEditorIconPicker);
