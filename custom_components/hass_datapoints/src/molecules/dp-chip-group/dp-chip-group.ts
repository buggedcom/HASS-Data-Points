import { LitElement, html, css } from "lit";
import type { ChipItem, HassLike } from "@/lib/types";
import "@/atoms/form/dp-entity-chip/dp-entity-chip";

export class DpChipGroup extends LitElement {
  static properties = {
    items: { type: Array },
    hass: { type: Object },
    removable: { type: Boolean },
    label: { type: String },
  };

  declare items: ChipItem[];

  declare hass: HassLike | null;

  declare removable: boolean;

  declare label: string;

  static styles = css`
    :host { display: block; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .label { font-size: 0.78rem; color: var(--secondary-text-color); margin-bottom: 4px; }
  `;

  constructor() {
    super();
    this.items = [];
    this.hass = null;
    this.removable = false;
    this.label = "";
  }

  _onRemove(e: CustomEvent<{ type: string; itemId: string }>) {
    const { type, itemId } = e.detail;
    const next = this.items.filter(
      (item) => !(item.type === type && item.id === itemId),
    );
    this.dispatchEvent(
      new CustomEvent("dp-chips-change", {
        detail: { items: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : ""}
      <div class="chips">
        ${this.items.map(
          (item) => html`
            <dp-entity-chip
              .type=${item.type}
              .itemId=${item.id}
              .hass=${this.hass}
              .removable=${this.removable}
              @dp-chip-remove=${this._onRemove}
            ></dp-entity-chip>
          `,
        )}
      </div>
    `;
  }
}
customElements.define("dp-chip-group", DpChipGroup);
