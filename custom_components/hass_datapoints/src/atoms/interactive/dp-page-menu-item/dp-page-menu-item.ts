import { LitElement, html, css } from "lit";
export class DpPageMenuItem extends LitElement {
  static properties = {
    icon: { type: String },
    label: { type: String },
    disabled: { type: Boolean },
  };
  declare icon: string;
  declare label: string;
  declare disabled: boolean;
  static styles = css`
    :host { display: block; }
    button {
      width: 100%; min-height: 38px;
      padding: var(--dp-spacing-sm, 8px) var(--dp-spacing-sm, 8px);
      display: flex; align-items: center; gap: var(--dp-spacing-sm, 8px);
      border: none; border-radius: 10px; background: transparent;
      color: var(--primary-text-color); font: inherit; text-align: left; cursor: pointer;
    }
    button:hover, button:focus-visible {
      background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
      outline: none;
    }
    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button[disabled]:hover {
      background: transparent;
    }
    ha-icon {
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
      flex: 0 0 auto;
    }
  `;
  constructor() {
    super();
    this.icon = "";
    this.label = "";
    this.disabled = false;
  }
  _onClick() {
    if (this.disabled) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("dp-menu-action", {
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <button
        type="button"
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <ha-icon icon="${this.icon}"></ha-icon>
        ${this.label}
      </button>
    `;
  }
}
customElements.define("dp-page-menu-item", DpPageMenuItem);
