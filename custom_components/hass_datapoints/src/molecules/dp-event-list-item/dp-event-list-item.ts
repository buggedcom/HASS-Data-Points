import { LitElement, html, css } from "lit";
import type { EventRecord, HassLike } from "@/lib/types";
export class DpEventListItem extends LitElement {
  static properties = {
    event: { type: Object },
    hass: { type: Object },
    editable: { type: Boolean },
  };
  declare event: EventRecord | null;
  declare hass: HassLike | null;
  declare editable: boolean;
  static styles = css`
    :host { display: block; }
    .item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 12px; border-bottom: 1px solid var(--divider-color, #333);
    }
    .icon-wrap {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 0.75rem;
    }
    .content { flex: 1; min-width: 0; }
    .message { font-size: 0.85rem; color: var(--primary-text-color); word-break: break-word; }
    .annotation { font-size: 0.78rem; color: var(--secondary-text-color); margin-top: 2px; font-style: italic; }
    .time { font-size: 0.72rem; color: var(--secondary-text-color); margin-top: 2px; }
    .actions { display: flex; gap: 4px; flex-shrink: 0; }
    .action-btn {
      background: none; border: none; cursor: pointer;
      padding: 2px 6px; font-size: 0.75rem;
      color: var(--secondary-text-color); border-radius: 4px;
    }
    .action-btn:hover {
      background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    }
    .action-btn.delete:hover { color: var(--error-color, #f44336); }
  `;
  constructor() {
    super();
    this.event = null;
    this.hass = null;
    this.editable = false;
  }
  _formatTime(isoStr: string | null | undefined): string {
    if (!isoStr) { return ""; }
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch {
      return isoStr;
    }
  }
  _onDelete() {
    this.dispatchEvent(
      new CustomEvent("dp-event-delete", {
        detail: { id: this.event?.id },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _onEdit() {
    this.dispatchEvent(
      new CustomEvent("dp-event-edit", {
        detail: { id: this.event?.id },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    if (!this.event) { return html``; }
    const ev = this.event;
    return html`
      <div class="item">
        <div
          class="icon-wrap"
          style="background-color: ${ev.color || "#888"}"
        >
          ${ev.icon ? html`<ha-icon .icon=${ev.icon} style="--mdc-icon-size: 16px; color: #fff;"></ha-icon>` : ""}
        </div>
        <div class="content">
          <div class="message">${ev.message || ""}</div>
          ${ev.annotation ? html`<div class="annotation">${ev.annotation}</div>` : ""}
          <div class="time">${this._formatTime(ev.timestamp)}</div>
        </div>
        ${this.editable
          ? html`
              <div class="actions">
                <button class="action-btn" data-action="edit" @click=${this._onEdit}>Edit</button>
                <button class="action-btn delete" data-action="delete" @click=${this._onDelete}>Delete</button>
              </div>
            `
          : ""}
      </div>
    `;
  }
}
customElements.define("dp-event-list-item", DpEventListItem);
