import { LitElement, html, css } from "lit";

export class DpVisibilityToggle extends LitElement {
  static properties = {
    pressed: { type: Boolean },
    label: { type: String },
    icon: { type: String },
  };

  declare pressed: boolean;

  declare label: string;

  declare icon: string;

  static styles = css`
    :host { display: inline-block; }
    button {
      display: flex; align-items: center; gap: 4px;
      background: none; border: 1px solid var(--divider-color, #444);
      border-radius: 6px; cursor: pointer; padding: 4px 8px;
      font-size: 0.75rem; color: var(--secondary-text-color); font-family: inherit;
    }
    button:hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    button[aria-pressed="false"] { opacity: 0.5; }
  `;

  constructor() {
    super();
    this.pressed = true;
    this.label = "";
    this.icon = "mdi:eye";
  }

  _onClick() {
    this.dispatchEvent(
      new CustomEvent("dp-visibility-change", {
        detail: { pressed: !this.pressed },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <button
        type="button"
        aria-pressed="${this.pressed}"
        title="${this.pressed ? "Hide" : "Show"} ${this.label}"
        @click=${this._onClick}
      >
        ${this.label}
      </button>
    `;
  }
}
customElements.define("dp-visibility-toggle", DpVisibilityToggle);
