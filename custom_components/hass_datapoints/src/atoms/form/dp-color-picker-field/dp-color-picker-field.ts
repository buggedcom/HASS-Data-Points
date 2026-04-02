import { LitElement, html, css } from "lit";

export class DpColorPickerField extends LitElement {
  static properties = {
    color: { type: String },
    entityId: { type: String, attribute: "entity-id" },
  };

  declare color: string;

  declare entityId: string | undefined;

  static styles = css`
    :host {
      display: block;
    }
    .color-field {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--divider-color, #ccc);
      cursor: pointer;
    }
    input[type="color"] {
      position: absolute;
      top: -4px;
      left: -4px;
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      border: none;
      cursor: pointer;
      padding: 0;
      background: none;
    }
    .icon-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 1;
    }
    .icon-overlay ha-state-icon {
      --mdc-icon-size: 20px;
      color: var(--text-primary-color, #fff);
    }
  `;

  constructor() {
    super();
    this.color = "#ff9800";
    this.entityId = undefined;
  }

  _onInput(e: Event) {
    const newColor = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("dp-color-change", {
        detail: { color: newColor },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="color-field" style="background-color: ${this.color}">
        <input
          type="color"
          .value=${this.color}
          @input=${this._onInput}
        />
        ${this.entityId
          ? html`
              <div class="icon-overlay">
                <ha-state-icon .entityId=${this.entityId}></ha-state-icon>
              </div>
            `
          : ""}
      </div>
    `;
  }
}
customElements.define("dp-color-picker-field", DpColorPickerField);
