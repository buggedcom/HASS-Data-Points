import { LitElement, html, css } from "lit";

export class DpToggleSwitch extends LitElement {
  static properties = {
    checked: { type: Boolean },
    label: { type: String },
    entityId: { type: String, attribute: "entity-id" },
  };

  declare checked: boolean;

  declare label: string;

  declare entityId: string | undefined;

  static styles = css`
    :host { display: inline-flex; }
    label {
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; font-size: 0.85rem;
      color: var(--primary-text-color); font-family: inherit;
    }
    .track {
      position: relative;
      width: 36px; height: 20px;
      border-radius: 10px;
      background: var(--disabled-color, #bdbdbd);
      transition: background 0.2s ease;
      flex: 0 0 auto;
    }
    .track.on {
      background: var(--primary-color, #03a9f4);
    }
    .thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s ease;
    }
    .track.on .thumb {
      transform: translateX(16px);
    }
    input {
      position: absolute;
      width: 1px; height: 1px;
      overflow: hidden; clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    this.checked = false;
    this.label = "";
    this.entityId = undefined;
  }

  _onChange() {
    this.dispatchEvent(
      new CustomEvent("dp-toggle-change", {
        detail: { checked: !this.checked, entityId: this.entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <label>
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._onChange}
        />
        <div class="track ${this.checked ? "on" : ""}">
          <div class="thumb"></div>
        </div>
        ${this.label}
      </label>
    `;
  }
}
customElements.define("dp-toggle-switch", DpToggleSwitch);
