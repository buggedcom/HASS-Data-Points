import { LitElement, html, css } from "lit";
import type { HassLike } from "@/lib/types";
export class DpEditorEntityList extends LitElement {
  static properties = {
    entities: { type: Array },
    hass: { type: Object },
    buttonLabel: { type: String, attribute: "button-label" },
  };
  declare entities: string[];
  declare hass: HassLike | null;
  declare buttonLabel: string;
  static styles = css`
    :host { display: block; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .entity-row { display: flex; gap: 8px; align-items: center; }
    .entity-row ha-selector { flex: 1; min-width: 0; }
    .remove-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      font-size: 1.1rem; color: var(--secondary-text-color); line-height: 1;
    }
    .remove-btn:hover { color: var(--error-color, #f44336); }
    .add-wrap { margin-top: 4px; }
  `;
  constructor() {
    super();
    this.entities = [];
    this.hass = null;
    this.buttonLabel = "Add entity";
  }
  _onRemove(index: number) {
    const next = [...this.entities];
    next.splice(index, 1);
    this.dispatchEvent(
      new CustomEvent("dp-entity-list-change", {
        detail: { entities: next },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _onAdd() {
    this.dispatchEvent(
      new CustomEvent("dp-entity-list-change", {
        detail: { entities: [...this.entities, ""] },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _onEntityChange(index: number, e: CustomEvent<{ value: string }>) {
    const next = [...this.entities];
    next[index] = e.detail.value;
    this.dispatchEvent(
      new CustomEvent("dp-entity-list-change", {
        detail: { entities: next },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <div class="list">
        ${this.entities.map(
          (entityId, i) => html`
            <div class="entity-row">
              <ha-selector
                .selector=${{ entity: {} }}
                .value=${entityId}
                .hass=${this.hass}
                @value-changed=${(e: CustomEvent<{ value: string }>) => this._onEntityChange(i, e)}
              ></ha-selector>
              <button
                class="remove-btn"
                data-action="remove"
                @click=${() => this._onRemove(i)}
                aria-label="Remove entity"
              ></button>
            </div>
          `,
        )}
      </div>
      <div class="add-wrap">
        <ha-button outlined data-action="add" @click=${this._onAdd}>
          ${this.buttonLabel}
        </ha-button>
      </div>
    `;
  }
}
customElements.define("dp-editor-entity-list", DpEditorEntityList);
