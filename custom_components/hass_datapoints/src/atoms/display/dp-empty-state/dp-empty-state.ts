import { LitElement, html, css } from "lit";

export class DpEmptyState extends LitElement {
  static properties = {
    message: { type: String },
  };

  declare message: string;

  static styles = css`
    :host { display: block; }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--dp-spacing-lg);
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }
  `;

  constructor() {
    super();
    this.message = "";
  }

  render() {
    return html`<div class="empty-state">${this.message}</div>`;
  }
}
customElements.define("dp-empty-state", DpEmptyState);
