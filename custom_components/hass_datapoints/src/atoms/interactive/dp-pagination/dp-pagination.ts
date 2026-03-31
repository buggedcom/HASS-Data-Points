import { LitElement, html, css } from "lit";
export class DpPagination extends LitElement {
  static properties = {
    page: { type: Number },
    totalPages: { type: Number },
    totalItems: { type: Number },
    label: { type: String },
  };
  declare page: number;
  declare totalPages: number;
  declare totalItems: number;
  declare label: string;
  static styles = css`
    :host {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 8px; font-size: 0.8rem;
      color: var(--secondary-text-color);
    }
    button {
      background: none; border: 1px solid var(--divider-color, #444);
      border-radius: 4px; color: var(--primary-text-color);
      cursor: pointer; padding: 4px 8px; font-family: inherit; font-size: 0.8rem;
    }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    button:not(:disabled):hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    .info { min-width: 120px; text-align: center; }
  `;
  constructor() {
    super();
    this.page = 0;
    this.totalPages = 1;
    this.totalItems = 0;
    this.label = "records";
  }
  _onPrev() {
    if (this.page > 0) {
      this.dispatchEvent(
        new CustomEvent("dp-page-change", {
          detail: { page: this.page - 1 },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
  _onNext() {
    if (this.page < this.totalPages - 1) {
      this.dispatchEvent(
        new CustomEvent("dp-page-change", {
          detail: { page: this.page + 1 },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
  render() {
    return html`
      <button
        type="button"
        data-action="prev"
        ?disabled=${this.page <= 0}
        @click=${this._onPrev}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span class="info">
        Page ${this.page + 1} of ${this.totalPages}   ${this.totalItems} ${this.label}
      </span>
      <button
        type="button"
        data-action="next"
        ?disabled=${this.page >= this.totalPages - 1}
        @click=${this._onNext}
        aria-label="Next page"
      >
        ›
      </button>
    `;
  }
}
customElements.define("dp-pagination", DpPagination);
