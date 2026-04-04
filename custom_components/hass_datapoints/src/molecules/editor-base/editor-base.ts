import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";

import { styles } from "./editor-base.styles";
import type { CardConfig, HassLike } from "@/lib/types";
/**
 * EditorBase — Lit base class for all card editors.
 *
 * Subclasses override `render()` to compose form atoms.
 * Provides `_set(key, value)` and `_fire(config)` for config updates.
 */
export class EditorBase extends LitElement {
  @state() accessor _config: CardConfig = {};

  @property({ type: Object }) accessor hass: HassLike | null = null;

  static styles = styles;

  setConfig(config: CardConfig) {
    this._config = { ...config };
  }

  _fire(cfg: CardConfig) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...cfg } },
        bubbles: true,
        composed: true,
      })
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
customElements.define("editor-base", EditorBase);
