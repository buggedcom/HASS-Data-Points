import { LitElement, html, css } from "lit";

export class DpDragHandle extends LitElement {
  static properties = {
    label: { type: String },
  };

  declare label: string | undefined;

  static styles = css`
    :host { display: inline-flex; }
    button {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none;
      cursor: grab; padding: 4px;
      color: var(--secondary-text-color);
      border-radius: 4px;
    }
    button:hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    button:active {
      cursor: grabbing;
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }
  `;

  constructor() {
    super();
    this.label = undefined;
  }

  _onDragStart() {
    this.dispatchEvent(
      new CustomEvent("dp-drag-start", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _onDragEnd() {
    this.dispatchEvent(
      new CustomEvent("dp-drag-end", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <button
        type="button"
        draggable="true"
        aria-label="${this.label || "Drag to reorder"}"
        @dragstart=${this._onDragStart}
        @dragend=${this._onDragEnd}
      >
        <ha-icon icon="mdi:drag-vertical"></ha-icon>
      </button>
    `;
  }
}
customElements.define("dp-drag-handle", DpDragHandle);
