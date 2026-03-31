import { LitElement, html, css } from "lit";

export interface CheckboxItem {
  name: string;
  label: string;
  checked: boolean;
}

export class DpCheckboxList extends LitElement {
  static properties = {
    items: { type: Array },
  };

  declare items: CheckboxItem[];

  static styles = css`
    :host {
      display: block;
    }
    .checkbox-group {
      display: grid;
      gap: var(--dp-spacing-sm, 8px);
    }
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: var(--dp-spacing-sm, 8px);
      font-size: 0.9rem;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .checkbox-option input[type="checkbox"] {
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.items = [];
  }

  _onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("dp-item-change", {
        detail: { name: input.name, checked: input.checked },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="checkbox-group">
        ${this.items.map(
          (item) => html`
            <label class="checkbox-option">
              <input
                type="checkbox"
                name=${item.name}
                .checked=${item.checked}
                @change=${this._onChange}
              />
              ${item.label}
            </label>
          `,
        )}
      </div>
    `;
  }
}
customElements.define("dp-checkbox-list", DpCheckboxList);
