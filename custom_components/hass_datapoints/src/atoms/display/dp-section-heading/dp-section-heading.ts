import { LitElement, html, css } from "lit";

export class DpSectionHeading extends LitElement {
  static properties = {
    text: { type: String },
  };

  declare text: string;

  static styles = css`
    :host { display: block; }
    .heading {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }
  `;

  constructor() {
    super();
    this.text = "";
  }

  render() {
    return html`<div class="heading">${this.text}</div>`;
  }
}
customElements.define("dp-section-heading", DpSectionHeading);
