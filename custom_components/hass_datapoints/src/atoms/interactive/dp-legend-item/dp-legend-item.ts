import { LitElement, html, css } from "lit";
export class DpLegendItem extends LitElement {
  static properties = {
    label: { type: String },
    color: { type: String },
    unit: { type: String },
    pressed: { type: Boolean },
    opacity: { type: Number },
  };
  declare label: string;
  declare color: string;
  declare unit: string;
  declare pressed: boolean;
  declare opacity: number;
  static styles = css`
    :host { display: inline-block; }
    button {
      display: flex; align-items: center;
      gap: calc(var(--spacing, 8px) * 0.625);
      font-size: 0.72rem; color: var(--secondary-text-color);
      flex: 0 0 auto; background: none; border: none; cursor: pointer;
      padding: 2px 4px; border-radius: 4px; white-space: nowrap; font-family: inherit;
    }
    button:hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    .legend-line {
      width: calc(var(--spacing, 8px) * 2);
      height: 3px; border-radius: 2px; flex-shrink: 0;
    }
  `;
  constructor() {
    super();
    this.label = "";
    this.color = "#888";
    this.unit = "";
    this.pressed = true;
    this.opacity = 1;
  }
  _onClick() {
    this.dispatchEvent(
      new CustomEvent("dp-legend-toggle", {
        detail: { pressed: !this.pressed },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    const displayText = this.unit ? `${this.label} (${this.unit})` : this.label;
    return html`
      <button
        type="button"
        aria-pressed="${this.pressed}"
        title="${this.pressed ? "Hide" : "Show"} ${this.label}"
        @click=${this._onClick}
      >
        <div
          class="legend-line"
          style="background-color: ${this.color}; opacity: ${this.opacity}"
        ></div>
        ${displayText}
      </button>
    `;
  }
}
customElements.define("dp-legend-item", DpLegendItem);
