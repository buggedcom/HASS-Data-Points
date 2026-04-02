import { LitElement, html, css } from "lit";

export class DpAnnotationChip extends LitElement {
  static properties = {
    type: { type: String },
    itemId: { type: String, attribute: "item-id" },
    icon: { type: String },
    name: { type: String },
  };

  declare type: string;

  declare itemId: string;

  declare icon: string;

  declare name: string;

  static styles = css`
    :host { display: inline-flex; }
    .context-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      color: var(--primary-color); white-space: nowrap;
      font-size: 0.82rem; font-family: inherit;
    }
    .context-chip ha-icon {
      --mdc-icon-size: 14px;
    }
    .context-chip-remove {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; padding: 0;
      border: none; border-radius: 50%;
      background: transparent; color: currentColor;
      cursor: pointer; flex: 0 0 auto;
    }
    .context-chip-remove:hover {
      background: color-mix(in srgb, currentColor 12%, transparent);
    }
    .context-chip-remove ha-icon {
      --mdc-icon-size: 12px;
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    this.type = "";
    this.itemId = "";
    this.icon = "";
    this.name = "";
  }

  _onRemove() {
    this.dispatchEvent(
      new CustomEvent("dp-chip-remove", {
        detail: { type: this.type, itemId: this.itemId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <span class="context-chip">
        <ha-icon icon="${this.icon}"></ha-icon>
        ${this.name}
        <button
          class="context-chip-remove"
          type="button"
          aria-label="Remove ${this.name}"
          @click=${this._onRemove}
        >
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </span>
    `;
  }
}
customElements.define("dp-annotation-chip", DpAnnotationChip);
