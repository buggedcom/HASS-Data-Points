import { LitElement, html } from "lit";
import { styles } from "./dp-floating-menu.styles";

/**
 * `dp-floating-menu` renders a positioned floating overlay panel.
 *
 * The parent is responsible for positioning the menu by setting the CSS custom
 * properties `--floating-menu-top` and `--floating-menu-left` on this element,
 * and for toggling `open` in response to the trigger button.
 *
 * Content is projected via the default `<slot>`.
 *
 * @fires dp-menu-close - `{}` fired when the user clicks outside the menu while it is open
 */
export class DpFloatingMenu extends LitElement {
  static styles = styles;

  static properties = {
    open: { type: Boolean, reflect: true },
  };

  /** Whether the menu is currently visible. */
  declare open: boolean;

  constructor() {
    super();
    this.open = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._onPointerDown = this._onPointerDown.bind(this);
    window.addEventListener("pointerdown", this._onPointerDown, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pointerdown", this._onPointerDown, true);
  }

  private _onPointerDown(e: PointerEvent) {
    if (!this.open) {
      return;
    }
    const path = e.composedPath();
    const clickedInside = path.some((node) => node === this);
    if (!clickedInside) {
      this.dispatchEvent(
        new CustomEvent("dp-menu-close", {
          detail: {},
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  render() {
    return html`
      <div
        class="floating-menu"
        role="menu"
        ?hidden=${!this.open}
      >
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("dp-floating-menu", DpFloatingMenu);

declare global {
  interface HTMLElementTagNameMap {
    "dp-floating-menu": DpFloatingMenu;
  }
}
