import { LitElement, html, css, nothing } from "lit";
export class DpSidebarSectionHeader extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
  };
  declare title: string;
  declare subtitle: string;
  static styles = css`
    :host { display: block; }
    .sidebar-section-header { display: grid; gap: var(--dp-spacing-xs); }
    .sidebar-section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .sidebar-section-subtitle {
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
  `;
  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
  }
  render() {
    return html`
      <div class="sidebar-section-header">
        <div class="sidebar-section-title">${this.title}</div>
        ${this.subtitle ? html`<div class="sidebar-section-subtitle">${this.subtitle}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define("dp-sidebar-section-header", DpSidebarSectionHeader);
