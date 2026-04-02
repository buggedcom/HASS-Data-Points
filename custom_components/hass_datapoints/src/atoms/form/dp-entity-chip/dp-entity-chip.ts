import { LitElement, html, css } from "lit";
import type { ChipItemType, HassLike } from "@/lib/types";

export class DpEntityChip extends LitElement {
  static properties = {
    type: { type: String },
    itemId: { type: String, attribute: "item-id" },
    hass: { type: Object },
    removable: { type: Boolean },
  };

  declare type: ChipItemType;

  declare itemId: string;

  declare hass: HassLike | null;

  declare removable: boolean;

  static styles = css`
    :host { display: inline-flex; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 12px; font-size: 0.78rem;
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      color: var(--primary-text-color); white-space: nowrap;
    }
    .remove {
      background: none; border: none; cursor: pointer; padding: 0 2px;
      font-size: 0.9rem; color: var(--secondary-text-color); line-height: 1;
    }
    .remove:hover { color: var(--error-color, #f44336); }
  `;

  constructor() {
    super();
    this.type = "entity";
    this.itemId = "";
    this.hass = null;
    this.removable = false;
  }

  _getName(): string {
    if (!this.hass || !this.itemId) {
      return this.itemId || "";
    }
    switch (this.type) {
      case "entity": {
        const state = this.hass.states?.[this.itemId];
        return (state?.attributes?.friendly_name as string | undefined) ?? this.itemId;
      }
      case "device": {
        const device = this.hass.devices?.[this.itemId];
        return device?.name ?? this.itemId;
      }
      case "area": {
        const area = this.hass.areas?.[this.itemId];
        return area?.name ?? this.itemId;
      }
      default:
        return this.itemId;
    }
  }

  _onRemove() {
    this.dispatchEvent(
      new CustomEvent("dp-chip-remove", {
        detail: { type: this.type, itemId: this.itemId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <span class="chip">
        ${this._getName()}
        ${this.removable
          ? html`<button
              class="remove"
              data-action="remove"
              @click=${this._onRemove}
              aria-label="Remove"
            ></button>`
          : ""}
      </span>
    `;
  }
}
customElements.define("dp-entity-chip", DpEntityChip);
