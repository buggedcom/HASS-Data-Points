import { LitElement, html, css, nothing } from "lit";

export class DpNumberInput extends LitElement {
  static properties = {
    value: { type: String },
    placeholder: { type: String },
    suffix: { type: String },
    step: { type: String },
  };

  declare value: string;

  declare placeholder: string;

  declare suffix: string;

  declare step: string;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    input {
      font: inherit;
      font-size: 0.85rem;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      width: 5em;
    }
    .suffix {
      font-size: 0.85rem;
      color: var(--secondary-text-color, #666);
    }
  `;

  constructor() {
    super();
    this.value = "";
    this.placeholder = "";
    this.suffix = "";
    this.step = "any";
  }

  private _onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("dp-number-change", {
        detail: { value: target.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <input
        type="number"
        .value=${this.value}
        placeholder=${this.placeholder}
        step=${this.step}
        @input=${this._onInput}
      />
      ${this.suffix ? html`<span class="suffix">${this.suffix}</span>` : nothing}
    `;
  }
}

customElements.define("dp-number-input", DpNumberInput);
