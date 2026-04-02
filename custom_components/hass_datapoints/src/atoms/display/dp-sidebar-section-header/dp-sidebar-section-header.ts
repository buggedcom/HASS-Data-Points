import { LitElement, html, css, nothing } from "lit";

export class DpSidebarSectionHeader extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    collapsible: { type: Boolean },
    open: { type: Boolean },
  };

  declare title: string;

  declare subtitle: string;

  declare collapsible: boolean;

  declare open: boolean;

  static styles = css`
    :host { display: block; }
    .sidebar-section-header { display: grid; gap: var(--dp-spacing-xs); }
    .sidebar-section-header.is-collapsible {
      cursor: pointer;
      user-select: none;
    }
    .sidebar-section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .sidebar-section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .sidebar-section-subtitle {
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .sidebar-section-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
      transition: background-color 120ms ease;
    }
    .sidebar-section-toggle:hover,
    .sidebar-section-toggle:focus-visible {
      background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    }
    .sidebar-section-toggle ha-icon {
      --mdc-icon-size: 18px;
      display: block;
      transition: transform 140ms ease;
    }
    .sidebar-section-toggle.is-open ha-icon {
      transform: rotate(180deg);
    }
  `;

  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
    this.collapsible = false;
    this.open = true;
  }

  private _onToggle() {
    this.dispatchEvent(new CustomEvent("dp-section-toggle", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="sidebar-section-header ${this.collapsible ? "is-collapsible" : ""}">
        <div class="sidebar-section-header-row">
          <div class="sidebar-section-title">${this.title}</div>
          ${this.collapsible ? html`
            <button
              type="button"
              class="sidebar-section-toggle ${this.open ? "is-open" : ""}"
              aria-label="${this.open ? "Collapse" : "Expand"} ${this.title}"
              aria-expanded=${this.open}
              @click=${this._onToggle}
            >
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          ` : nothing}
        </div>
        ${this.subtitle ? html`<div class="sidebar-section-subtitle">${this.subtitle}</div>` : nothing}
      </div>
    `;
  }
}
customElements.define("dp-sidebar-section-header", DpSidebarSectionHeader);
