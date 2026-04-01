import { LitElement, html, css } from "lit";
export class DpSearchBar extends LitElement {
  static properties = {
    query: { type: String },
    placeholder: { type: String },
  };
  declare query: string;
  declare placeholder: string;
  static styles = css`
    :host { display: block; }
    .search-wrap { display: flex; align-items: center; gap: 8px; padding: 4px 12px; }
    input {
      flex: 1; background: transparent;
      border: 1px solid var(--divider-color, #444); border-radius: 6px;
      padding: 6px 10px; font-size: 0.85rem; color: var(--primary-text-color);
      outline: none; font-family: inherit;
    }
    input:focus { border-color: var(--primary-color, #03a9f4); }
    input::placeholder { color: var(--secondary-text-color); opacity: 0.6; }
  `;
  constructor() {
    super();
    this.query = "";
    this.placeholder = "Search...";
  }
  _onInput(e: Event) {
    this.dispatchEvent(
      new CustomEvent("dp-search", {
        detail: { query: (e.target as HTMLInputElement).value },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <div class="search-wrap">
        <input
          type="text"
          .value=${this.query}
          placeholder=${this.placeholder}
          @input=${this._onInput}
        />
      </div>
    `;
  }
}
customElements.define("dp-search-bar", DpSearchBar);
