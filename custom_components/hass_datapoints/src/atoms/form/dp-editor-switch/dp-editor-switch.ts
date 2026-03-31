import { LitElement, html, css, PropertyValues } from "lit";
type HaFormField = HTMLElement & { label?: string };
type HaSwitch = HTMLElement & { checked?: boolean };
export class DpEditorSwitch extends LitElement {
  static properties = {
    label: { type: String },
    checked: { type: Boolean },
    tooltip: { type: String },
  };
  declare label: string;
  declare checked: boolean;
  declare tooltip: string;
  static styles = css`
    :host { display: block; }
    .switch-row { display: flex; align-items: center; gap: 4px; }
    .switch-row ha-formfield { flex: 1; }
    .help-icon {
      color: var(--secondary-text-color); cursor: default;
      flex-shrink: 0; position: relative; font-size: 0.85rem;
    }
    .help-icon:hover .help-tooltip { display: block; }
    .help-tooltip {
      display: none; position: absolute; right: 0; top: calc(100% + 4px);
      background: var(--card-background-color, #fff); color: var(--primary-text-color);
      border: 1px solid var(--divider-color, #ccc); border-radius: 6px;
      padding: 6px 10px; font-size: 0.78rem; white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); z-index: 10; pointer-events: none;
    }
  `;
  constructor() {
    super();
    this.label = "";
    this.checked = false;
    this.tooltip = "";
  }
  firstUpdated() {
    const ff = this.shadowRoot!.querySelector("ha-formfield") as HaFormField | null;
    if (ff) { ff.label = this.label; }
    const sw = this.shadowRoot!.querySelector("ha-switch") as HaSwitch | null;
    if (sw) { sw.checked = this.checked; }
  }
  updated(changedProps: PropertyValues) {
    if (changedProps.has("checked")) {
      const sw = this.shadowRoot!.querySelector("ha-switch") as HaSwitch | null;
      if (sw) { sw.checked = this.checked; }
    }
    if (changedProps.has("label")) {
      const ff = this.shadowRoot!.querySelector("ha-formfield") as HaFormField | null;
      if (ff) { ff.label = this.label; }
    }
  }
  _onChange(e: Event) {
    this.dispatchEvent(
      new CustomEvent("dp-switch-change", {
        detail: { checked: (e.target as HTMLInputElement).checked },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <div class="switch-row">
        <ha-formfield>
          <ha-switch @change=${this._onChange}></ha-switch>
        </ha-formfield>
        ${this.tooltip
          ? html`
              <span class="help-icon">
                ?
                <span class="help-tooltip">${this.tooltip}</span>
              </span>
            `
          : ""}
      </div>
    `;
  }
}
customElements.define("dp-editor-switch", DpEditorSwitch);
