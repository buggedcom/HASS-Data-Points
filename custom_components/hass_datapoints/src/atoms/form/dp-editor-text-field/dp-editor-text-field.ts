import { LitElement, html, css, PropertyValues } from "lit";

type HaTextField = HTMLElement & {
  label?: string;
  value?: string;
  type?: string;
  placeholder?: string;
  suffix?: string;
};
export class DpEditorTextField extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    type: { type: String },
    placeholder: { type: String },
    suffix: { type: String },
  };

  declare label: string;

  declare value: string;

  declare type: string;

  declare placeholder: string;

  declare suffix: string;

  static styles = css`
    :host { display: block; }
    ha-textfield { display: block; width: 100%; }
  `;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.type = "text";
    this.placeholder = "";
    this.suffix = "";
  }

  firstUpdated() {
    const field = this.shadowRoot!.querySelector("ha-textfield") as HaTextField | null;
    if (field) {
      field.label = this.label;
      field.value = this.value;
      if (this.type) { field.type = this.type; }
      if (this.placeholder) { field.placeholder = this.placeholder; }
      if (this.suffix) { field.suffix = this.suffix; }
    }
  }

  updated(changedProps: PropertyValues) {
    const field = this.shadowRoot!.querySelector("ha-textfield") as HaTextField | null;
    if (!field) { return; }
    if (changedProps.has("value")) { field.value = this.value; }
    if (changedProps.has("label")) { field.label = this.label; }
  }

  _onInput(e: Event) {
    const rawValue = (e.target as HTMLInputElement).value;
    const value = this.type === "number" ? parseFloat(rawValue) : rawValue;
    this.dispatchEvent(
      new CustomEvent("dp-field-change", {
        detail: { value: this.type === "number" && isNaN(value as number) ? undefined : value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`<ha-textfield @input=${this._onInput}></ha-textfield>`;
  }
}
customElements.define("dp-editor-text-field", DpEditorTextField);
