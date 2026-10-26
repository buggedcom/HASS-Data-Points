import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";
import { localized, msg } from "@/lib/i18n/localize";
import type { HassLike } from "@/lib/types";
import type { DpChangeDetail } from "@/lib/events";
import "@/atoms/form/entity-chip/entity-chip";

import { styles } from "./monitor-entity-filter.styles";

interface FilterOption {
  id: string;
  name: string;
}

/**
 * Entity filter for the monitors list: a trigger button (with an active-count
 * badge) opening a searchable multi-select, plus removable chips and a Clear
 * action for the active selection. Stateless about the selection itself; it
 * fires `dp-change` (`entity-list`) and the parent owns `selected`.
 */
@localized()
export class MonitorEntityFilter extends LitElement {
  @property({ type: Object }) accessor hass: Nullable<HassLike> = null;

  /** Every entity the user can filter by. */
  @property({ attribute: false }) accessor entityIds: string[] = [];

  /** Currently selected entity ids. */
  @property({ attribute: false }) accessor selected: string[] = [];

  @state() accessor _open: boolean = false;

  @state() accessor _query: string = "";

  static styles = styles;

  private _options: FilterOption[] = [];

  private _name(id: string): string {
    return (
      (this.hass?.states?.[id]?.attributes?.friendly_name as
        | string
        | undefined) ?? id
    );
  }

  willUpdate(changed: PropertyValues) {
    if (changed.has("entityIds") || changed.has("hass")) {
      this._options = this.entityIds
        .map((id) => ({ id, name: this._name(id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private _emit(value: string[]) {
    this.dispatchEvent(
      new CustomEvent<DpChangeDetail>("dp-change", {
        detail: { type: "entity-list", value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _toggle(id: string) {
    this._emit(
      this.selected.includes(id)
        ? this.selected.filter((s) => s !== id)
        : [...this.selected, id]
    );
  }

  private _onChipRemove = (e: Event) => {
    const { itemId } = (e as CustomEvent<{ itemId: string }>).detail;
    this._emit(this.selected.filter((s) => s !== itemId));
  };

  private _onDocumentClick = (e: MouseEvent) => {
    if (this._open && !e.composedPath().includes(this)) {
      this._open = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onDocumentClick);
  }

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this._open) {
      this._open = false;
    }
  };

  private _renderPicker() {
    const q = this._query.trim().toLowerCase();
    const visible = q
      ? this._options.filter(
          (o) => o.name.toLowerCase().includes(q) || o.id.includes(q)
        )
      : this._options;
    return html`<div class="picker" role="dialog">
      <input
        class="search"
        type="search"
        placeholder=${msg("Search entities")}
        aria-label=${msg("Search entities")}
        .value=${this._query}
        @input=${(e: Event) => {
          this._query = (e.target as HTMLInputElement).value;
        }}
      />
      <div class="options">
        ${visible.length === 0
          ? html`<div class="no-results">${msg("No matching entities")}</div>`
          : visible.map(
              (o) =>
                html`<label class="option">
                  <input
                    type="checkbox"
                    .checked=${this.selected.includes(o.id)}
                    @change=${() => this._toggle(o.id)}
                  />
                  <span class="option-name">${o.name}</span>
                  <span class="option-id">${o.id}</span>
                </label>`
            )}
      </div>
    </div>`;
  }

  render() {
    const count = this.selected.length;
    return html`
      <div class="filter" @keydown=${this._onKeydown}>
        <div class="filter-bar">
          <button
            class="filter-trigger"
            type="button"
            aria-haspopup="dialog"
            aria-expanded=${this._open ? "true" : "false"}
            @click=${() => {
              this._open = !this._open;
            }}
          >
            <ha-icon icon="mdi:filter-variant"></ha-icon>
            <span>${msg("Filter by entity")}</span>
            ${count > 0
              ? html`<span
                  class="filter-badge"
                  aria-label=${count === 1
                    ? msg("1 active filter")
                    : msg(`${count} active filters`)}
                  >${count}</span
                >`
              : nothing}
          </button>
          ${count > 0
            ? html`<button
                class="clear-filter"
                type="button"
                @click=${() => this._emit([])}
              >
                ${msg("Clear")}
              </button>`
            : nothing}
        </div>
        ${this._open ? this._renderPicker() : nothing}
        ${count > 0
          ? html`<div class="chips" @dp-chip-remove=${this._onChipRemove}>
              ${this.selected.map(
                (id) =>
                  html`<entity-chip
                    .hass=${this.hass}
                    type="entity"
                    .itemId=${id}
                    removable
                  ></entity-chip>`
              )}
            </div>`
          : nothing}
      </div>
    `;
  }
}
customElements.define("monitor-entity-filter", MonitorEntityFilter);

declare global {
  interface HTMLElementTagNameMap {
    "monitor-entity-filter": MonitorEntityFilter;
  }
}
