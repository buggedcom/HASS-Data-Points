import { LitElement, html } from "lit";
import { styles } from "./dp-range-handle.styles";

/**
 * `dp-range-handle` is a circular drag-handle button for a timeline range slider.
 *
 * The parent positions the handle by setting the `position` prop (reflected to
 * `style.left` as a percentage). The handle fires events for all pointer and keyboard
 * interactions; the parent owns drag logic and tooltips.
 *
 * @fires dp-handle-drag-start - `{ pointerId, clientX }` — pointer down on handle
 * @fires dp-handle-keydown    - `{ key, shiftKey }` — navigation key pressed (arrows, Page, Home, End)
 * @fires dp-handle-hover      - `{}` — pointer entered the handle
 * @fires dp-handle-leave      - `{}` — pointer left the handle
 * @fires dp-handle-focus      - `{}` — handle received focus
 * @fires dp-handle-blur       - `{}` — handle lost focus
 */
export class DpRangeHandle extends LitElement {
  static properties = {
    position: { type: Number },
    label: { type: String },
    live: { type: Boolean },
  };

  declare position: number;

  declare label: string;

  declare live: boolean;

  static styles = styles;

  constructor() {
    super();
    this.position = 0;
    this.label = "";
    this.live = false;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("position")) {
      this.style.left = `${this.position}%`;
    }
  }

  _onPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("dp-handle-drag-start", {
        detail: { pointerId: e.pointerId, clientX: e.clientX },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _onKeyDown(e: KeyboardEvent) {
    const navKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
    if (!navKeys.includes(e.key)) return;
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("dp-handle-keydown", {
        detail: { key: e.key, shiftKey: e.shiftKey },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _onPointerEnter() {
    this.dispatchEvent(new CustomEvent("dp-handle-hover", { bubbles: true, composed: true }));
  }

  _onPointerLeave() {
    this.dispatchEvent(new CustomEvent("dp-handle-leave", { bubbles: true, composed: true }));
  }

  _onFocus() {
    this.dispatchEvent(new CustomEvent("dp-handle-focus", { bubbles: true, composed: true }));
  }

  _onBlur() {
    this.dispatchEvent(new CustomEvent("dp-handle-blur", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button
        type="button"
        class="handle ${this.live ? "is-live" : ""}"
        aria-label="${this.label}"
        @pointerdown=${this._onPointerDown}
        @keydown=${this._onKeyDown}
        @pointerenter=${this._onPointerEnter}
        @pointerleave=${this._onPointerLeave}
        @focus=${this._onFocus}
        @blur=${this._onBlur}
      ></button>
    `;
  }
}
customElements.define("dp-range-handle", DpRangeHandle);
