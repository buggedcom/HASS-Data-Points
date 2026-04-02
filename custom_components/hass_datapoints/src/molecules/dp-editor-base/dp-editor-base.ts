import { LitElement, css } from "lit";
import type { CardConfig, HassLike } from "@/lib/types";
/**
 * DpEditorBase — Lit base class for all card editors.
 *
 * Subclasses override `render()` to compose form atoms.
 * Provides `_set(key, value)` and `_fire(config)` for config updates.
 */
export class DpEditorBase extends LitElement {
  static properties = {
    _config: { type: Object, state: true },
    hass: { type: Object },
  };

  declare _config: CardConfig;

  declare hass: HassLike | null;

  static styles = css`
    :host { display: block; }
    .ed {
      display: flex; flex-direction: column;
      gap: 16px; padding: 4px 0 8px;
    }
  `;

  constructor() {
    super();
    this._config = {};
    this.hass = null;
  }

  setConfig(config: CardConfig) {
    this._config = { ...config };
  }

  _fire(cfg: CardConfig) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...cfg } },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _set(key: string, value: unknown) {
    const cfg = { ...this._config };
    if (value === "" || value === null || value === undefined) {
      delete cfg[key];
    } else {
      cfg[key] = value;
    }
    this._config = cfg;
    this._fire(cfg);
  }
}
customElements.define("dp-editor-base", DpEditorBase);
