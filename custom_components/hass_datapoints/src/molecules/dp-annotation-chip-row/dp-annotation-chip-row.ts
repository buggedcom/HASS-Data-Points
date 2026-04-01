import { LitElement, html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { styles } from "./dp-annotation-chip-row.styles";
import "@/atoms/interactive/dp-annotation-chip/dp-annotation-chip";

export interface ChipItem {
  /** Target type: "entity_id" | "device_id" | "area_id" | "label_id" */
  type: string;
  /** ID of the linked target item. */
  itemId: string;
  /** Icon path shown inside the chip. */
  icon: string;
  /** Display name shown as the chip label. */
  name: string;
}

/**
 * `dp-annotation-chip-row` renders a labelled group of removable annotation
 * target chips. When the list is empty it shows an empty-state help text instead.
 *
 * @fires dp-target-remove - `{ type: string, id: string }` fired when a chip's
 *   remove button is clicked.
 */
export class DpAnnotationChipRow extends LitElement {
  static styles = styles;

  static properties = {
    chips: { type: Array },
    label: { type: String },
    helpText: { type: String, attribute: "help-text" },
    emptyText: { type: String, attribute: "empty-text" },
  };

  /** Array of pre-resolved chip items to display. */
  declare chips: ChipItem[];

  /** Section label shown above the chips. */
  declare label: string;

  /** Help text shown below the label when chips are present. */
  declare helpText: string;

  /** Help text shown below the label when there are no chips. */
  declare emptyText: string;

  constructor() {
    super();
    this.chips = [];
    this.label = "Linked targets";
    this.helpText =
      "These targets will be associated with the new data point by default. Remove any that should not be linked.";
    this.emptyText = "No linked targets will be associated with this data point.";
  }

  private _onChipRemove(ev: Event) {
    const detail = (ev as CustomEvent).detail as { type: string; itemId: string };
    // Stop the raw dp-chip-remove so consumers only see dp-target-remove.
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("dp-target-remove", {
        detail: { type: detail.type, id: detail.itemId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="context-form-field">
        <label class="context-form-label">${this.label}</label>
        <div class="context-form-help">
          ${this.chips.length > 0 ? this.helpText : this.emptyText}
        </div>
        ${this.chips.length > 0
          ? html`
              <div class="context-chip-row" @dp-chip-remove=${this._onChipRemove}>
                ${repeat(
                  this.chips,
                  (chip) => `${chip.type}:${chip.itemId}`,
                  (chip) => html`
                    <dp-annotation-chip
                      .type=${chip.type}
                      .itemId=${chip.itemId}
                      .icon=${chip.icon}
                      .name=${chip.name}
                    ></dp-annotation-chip>
                  `,
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define("dp-annotation-chip-row", DpAnnotationChipRow);

declare global {
  interface HTMLElementTagNameMap {
    "dp-annotation-chip-row": DpAnnotationChipRow;
  }
}
