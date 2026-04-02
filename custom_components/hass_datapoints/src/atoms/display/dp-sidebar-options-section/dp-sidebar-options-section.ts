import { LitElement, html, nothing } from "lit";
import { styles } from "./dp-sidebar-options-section.styles";
import "@/atoms/display/dp-sidebar-section-header/dp-sidebar-section-header";

export class DpSidebarOptionsSection extends LitElement {
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

  static styles = styles;

  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
    this.collapsible = false;
    this.open = true;
  }

  private _onToggle() {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("dp-section-toggle", {
        detail: { open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="section">
        <dp-sidebar-section-header
          .title=${this.title}
          .subtitle=${this.subtitle}
          .collapsible=${this.collapsible}
          .open=${this.open}
          @dp-section-toggle=${this._onToggle}
        ></dp-sidebar-section-header>
        ${this.collapsible && !this.open ? nothing : html`<slot></slot>`}
      </div>
    `;
  }
}

customElements.define("dp-sidebar-options-section", DpSidebarOptionsSection);
