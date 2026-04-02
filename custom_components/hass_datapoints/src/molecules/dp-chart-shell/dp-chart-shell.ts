import { LitElement, html, css } from "lit";
import "@/atoms/display/dp-loading-indicator/dp-loading-indicator";
import "@/atoms/display/dp-chart-message/dp-chart-message";

export class DpChartShell extends LitElement {
  static properties = {
    cardTitle: { type: String, attribute: "card-title" },
    loading: { type: Boolean },
    message: { type: String },
  };

  declare cardTitle: string;

  declare loading: boolean;

  declare message: string;

  static styles = css`
    :host { display: block; height: 100%; min-height: 0; }
    ha-card {
      padding: 0; overflow: visible; height: 100%;
      display: flex; flex-direction: column;
    }
    .card-header {
      padding: var(--dp-spacing-lg, 16px) var(--dp-spacing-lg, 16px) 0;
      font-size: 1.1em; font-weight: 500; color: var(--primary-text-color);
      flex: 0 0 auto;
    }
    .chart-wrap { position: relative; flex: 1 1 0; min-height: 0; }
    dp-loading-indicator {
      position: absolute; top: var(--dp-spacing-sm, 8px);
      left: var(--dp-spacing-md, 12px); z-index: 6;
    }
    dp-chart-message { position: absolute; inset: 0; z-index: 2; }
    ::slotted(*) { width: 100%; height: 100%; }
  `;

  constructor() {
    super();
    this.cardTitle = "";
    this.loading = false;
    this.message = "";
  }

  render() {
    return html`
      <ha-card>
        ${this.cardTitle
          ? html`<div class="card-header">${this.cardTitle}</div>`
          : ""}
        <slot name="top"></slot>
        <div class="chart-wrap">
          <dp-loading-indicator .active=${this.loading}></dp-loading-indicator>
          <dp-chart-message .message=${this.message}></dp-chart-message>
          <slot></slot>
        </div>
        <slot name="legend"></slot>
        <slot name="bottom"></slot>
      </ha-card>
    `;
  }
}
customElements.define("dp-chart-shell", DpChartShell);
