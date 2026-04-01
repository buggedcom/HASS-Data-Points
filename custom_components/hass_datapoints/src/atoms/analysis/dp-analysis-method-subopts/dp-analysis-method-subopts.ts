import { LitElement, html } from "lit";
import { styles } from "./dp-analysis-method-subopts.styles";

export class DpAnalysisMethodSubopts extends LitElement {
  static styles = styles;

  render() {
    return html`<div class="subopts"><slot></slot></div>`;
  }
}

customElements.define("dp-analysis-method-subopts", DpAnalysisMethodSubopts);
