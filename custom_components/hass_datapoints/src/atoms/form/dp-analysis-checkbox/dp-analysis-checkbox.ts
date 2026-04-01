import { LitElement, html, css, nothing } from "lit";

export class DpAnalysisCheckbox extends LitElement {
  static properties = {
    checked: { type: Boolean },
    label: { type: String },
    disabled: { type: Boolean },
    helpText: { type: String, attribute: "help-text" },
    helpId: { type: String, attribute: "help-id" },
  };

  declare checked: boolean;
  declare label: string;
  declare disabled: boolean;
  declare helpText: string;
  declare helpId: string;

  static styles = css`
    :host {
      display: inline-block;
    }
    label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      color: var(--primary-text-color);
    }
    label.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    input[type="checkbox"] {
      cursor: pointer;
      margin: 0;
    }
    input[type="checkbox"]:disabled {
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.checked = false;
    this.label = "";
    this.disabled = false;
    this.helpText = "";
    this.helpId = "";
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("dp-check-change", {
        detail: { checked: target.checked },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const labelClass = this.disabled ? "disabled" : "";
    const checkbox = html`
      <label class=${labelClass}>
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span>${this.label}</span>
        ${this.helpText
          ? html`<ha-tooltip .id=${this.helpId} .content=${this.helpText}></ha-tooltip>`
          : nothing}
      </label>
    `;
    return checkbox;
  }
}

customElements.define("dp-analysis-checkbox", DpAnalysisCheckbox);
