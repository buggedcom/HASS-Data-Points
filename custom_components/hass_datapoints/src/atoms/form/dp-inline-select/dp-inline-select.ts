import { LitElement, html, css } from "lit";
import type { SelectOption } from "@/lib/types";

export class DpInlineSelect extends LitElement {
  static properties = {
    value: { type: String },
    options: { type: Array },
    disabled: { type: Boolean },
  };

  declare value: string;

  declare options: SelectOption[];

  declare disabled: boolean;

  static styles = css`
    :host {
      display: inline-block;
    }
    select {
      font: inherit;
      font-size: 0.85rem;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    select:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `;

  constructor() {
    super();
    this.value = "";
    this.options = [];
    this.disabled = false;
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent("dp-select-change", {
        detail: { value: target.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <select .value=${this.value} ?disabled=${this.disabled} @change=${this._onChange}>
        ${this.options.map(
          (opt) => html`
            <option value=${opt.value} ?selected=${opt.value === this.value}>
              ${opt.label}
            </option>
          `,
        )}
      </select>
    `;
  }
}

customElements.define("dp-inline-select", DpInlineSelect);
