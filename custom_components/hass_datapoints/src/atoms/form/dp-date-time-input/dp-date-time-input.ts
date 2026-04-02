import { LitElement, html, css } from "lit";

export class DpDateTimeInput extends LitElement {
  static properties = {
    value: { type: String },
    label: { type: String },
  };

  declare value: string;

  declare label: string;

  static styles = css`
    :host { display: block; }
    label {
      display: block; font-size: 0.78rem;
      color: var(--secondary-text-color); margin-bottom: 4px;
    }
    input {
      display: block; width: 100%; box-sizing: border-box;
      padding: 8px 10px; border: 1px solid var(--divider-color, #444);
      border-radius: 6px; background: transparent;
      color: var(--primary-text-color); font-size: 0.85rem; font-family: inherit;
    }
    input:focus { border-color: var(--primary-color, #03a9f4); outline: none; }
  `;

  constructor() {
    super();
    this.value = "";
    this.label = "";
  }

  _onChange(e: Event) {
    this.dispatchEvent(
      new CustomEvent("dp-datetime-change", {
        detail: { value: (e.target as HTMLInputElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ""}
      <input
        type="datetime-local"
        .value=${this.value}
        @change=${this._onChange}
      />
    `;
  }
}
customElements.define("dp-date-time-input", DpDateTimeInput);
