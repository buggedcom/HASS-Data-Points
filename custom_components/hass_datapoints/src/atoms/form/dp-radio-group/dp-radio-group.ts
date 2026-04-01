import { LitElement, html, css } from "lit";
import type { SelectOption } from "@/lib/types";

export class DpRadioGroup extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    options: { type: Array },
  };

  declare name: string;
  declare value: string;
  declare options: SelectOption[];

  static styles = css`
    :host {
      display: block;
    }
    fieldset {
      border: none;
      margin: 0;
      padding: 0;
    }
    .radio-group {
      display: grid;
      gap: var(--dp-spacing-xs, 4px);
    }
    .radio-option {
      display: flex;
      align-items: center;
      gap: var(--dp-spacing-xs, 4px);
      font-size: 0.9rem;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .radio-option input[type="radio"] {
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.name = "";
    this.value = "";
    this.options = [];
  }

  _onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("dp-radio-change", {
        detail: { value: input.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <fieldset role="radiogroup">
        <div class="radio-group">
          ${this.options.map(
            (opt) => html`
              <label class="radio-option">
                <input
                  type="radio"
                  name=${this.name}
                  .value=${opt.value}
                  .checked=${this.value === opt.value}
                  @change=${this._onChange}
                />
                ${opt.label}
              </label>
            `,
          )}
        </div>
      </fieldset>
    `;
  }
}
customElements.define("dp-radio-group", DpRadioGroup);
