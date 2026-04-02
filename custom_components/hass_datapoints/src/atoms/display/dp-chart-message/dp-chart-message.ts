import { LitElement, html, css } from "lit";

export class DpChartMessage extends LitElement {
  static properties = {
    message: { type: String },
  };

  declare message: string;

  static styles = css`
    :host {
      display: block;
      pointer-events: none;
    }
    .message {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.95rem;
      z-index: 2;
    }
    .message.visible {
      display: flex;
    }
  `;

  constructor() {
    super();
    this.message = "";
  }

  render() {
    return html`
      <div class="message ${this.message ? "visible" : ""}">${this.message}</div>
    `;
  }
}
customElements.define("dp-chart-message", DpChartMessage);
