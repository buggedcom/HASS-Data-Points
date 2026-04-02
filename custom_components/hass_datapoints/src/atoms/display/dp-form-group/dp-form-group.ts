import { LitElement, html, css, nothing } from "lit";

export class DpFormGroup extends LitElement {
  static properties = {
    label: { type: String },
    description: { type: String },
  };

  declare label: string;

  declare description: string;

  static styles = css`
    :host { display: block; min-width: 0; }
    .form-group { display: grid; gap: 6px; min-width: 0; }
    .form-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .form-help {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      line-height: 1.45;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.description = "";
  }

  render() {
    return html`
      <div class="form-group">
        ${this.label ? html`<div class="form-label">${this.label}</div>` : nothing}
        ${this.description ? html`<div class="form-help">${this.description}</div>` : nothing}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define("dp-form-group", DpFormGroup);
