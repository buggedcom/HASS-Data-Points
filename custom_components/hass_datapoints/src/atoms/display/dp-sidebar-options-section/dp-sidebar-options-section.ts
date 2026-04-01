import { LitElement, html } from "lit";
import { styles } from "./dp-sidebar-options-section.styles";
import "@/atoms/dp-sidebar-section-header/dp-sidebar-section-header";

export class DpSidebarOptionsSection extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
  };

  declare title: string;
  declare subtitle: string;

  static styles = styles;

  constructor() {
    super();
    this.title = "";
    this.subtitle = "";
  }

  render() {
    return html`
      <div class="section">
        <dp-sidebar-section-header
          .title=${this.title}
          .subtitle=${this.subtitle}
        ></dp-sidebar-section-header>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("dp-sidebar-options-section", DpSidebarOptionsSection);
