import { LitElement, html, css, PropertyValues } from "lit";
import type { SelectOption } from "@/lib/types";
type HaSelector = HTMLElement & {
  label?: string;
  selector?: unknown;
  value?: string;
};
export class DpEditorSelect extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    options: { type: Array },
  };
  declare label: string;
  declare value: string;
  declare options: SelectOption[];
  static styles = css`
    :host { display: block; }
    ha-selector { display: block; width: 100%; }
  `;
  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.options = [];
  }
  firstUpdated() {
    const el = this.shadowRoot!.querySelector("ha-selector") as HaSelector | null;
    if (el) {
      el.label = this.label;
      el.selector = { select: { options: this.options } };
      el.value = this.value;
    }
  }
  updated(changedProps: PropertyValues) {
    const el = this.shadowRoot!.querySelector("ha-selector") as HaSelector | null;
    if (!el) { return; }
    if (changedProps.has("value")) { el.value = this.value; }
    if (changedProps.has("options")) {
      el.selector = { select: { options: this.options } };
    }
  }
  _onValueChanged(e: CustomEvent<{ value: string }>) {
    this.dispatchEvent(
      new CustomEvent("dp-select-change", {
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
customElements.define("dp-editor-select", DpEditorSelect);
