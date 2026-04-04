import { html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { EventRecordFull } from "@/lib/types";
import { styles } from "./sensor-records.styles";
import "@/atoms/interactive/pagination/pagination";
import "../sensor-record-item/sensor-record-item";

export class SensorRecords extends LitElement {
  @property({ type: Array, attribute: false })
  accessor events: EventRecordFull[] = [];

  @property({ type: Object, attribute: false })
  accessor hiddenEventIds: Set<string> = new Set();

  @property({ type: Number, attribute: "page-size" }) accessor pageSize:
    | number
    | null = null;

  @property({ type: Number }) accessor limit: number | null = null;

  @property({ type: Boolean, attribute: "show-full-message" })
  accessor showFullMessage: boolean = true;

  @state() accessor _page: number = 0;

  static styles = styles;

  render() {
    const sorted = [...this.events].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const limited = this.limit ? sorted.slice(0, this.limit) : sorted;
    const total = limited.length;

    if (!total) {
      return html`
        <div class="ann-section">
          <div class="ann-list" tabindex="0">
            <div class="ann-empty">No records in this time window.</div>
          </div>
        </div>
      `;
    }

    const totalPages = this.pageSize
      ? Math.max(1, Math.ceil(total / this.pageSize))
      : 1;
    const page = Math.min(this._page, totalPages - 1);
    const slice = this.pageSize
      ? limited.slice(page * this.pageSize, (page + 1) * this.pageSize)
      : limited;
    const showPagination = totalPages > 1;

    return html`
      <div class="ann-section">
        <div class="ann-list">
          ${slice.map(
            (ev) => html`
              <sensor-record-item
                .event=${ev}
                .hidden=${this.hiddenEventIds.has(ev.id)}
                .showFullMessage=${this.showFullMessage}
              ></sensor-record-item>
            `
          )}
        </div>
        ${showPagination
          ? html`
              <pagination-nav
                .page=${page}
                .totalPages=${totalPages}
                .totalItems=${total}
                label="records"
                @dp-page-change=${(e: CustomEvent<{ page: number }>) => {
                  this._page = e.detail.page;
                  this.shadowRoot?.querySelector(".ann-list")?.scrollTo(0, 0);
                }}
              ></pagination-nav>
            `
          : ""}
      </div>
    `;
  }
}
customElements.define("sensor-records", SensorRecords);
