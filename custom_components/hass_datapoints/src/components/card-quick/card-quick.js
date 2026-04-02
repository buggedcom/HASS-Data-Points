import { LitElement, html, css } from "lit";
import { AMBER, DOMAIN } from "@/lib/shared.js";
import { logger } from "@/lib/logger.js";

/**
 * hass-datapoints-quick-card – Simple one-field quick record card.
 *
 * Configurable icon and color (defaults to mdi:bookmark / amber).
 * Uses HA native <ha-textfield> and <ha-button>.
 */

export class HassRecordsQuickCard extends LitElement {
  static properties = {
    _config: { type: Object, state: true },
    _hass: { type: Object, state: true },
    _feedbackClass: { type: String, state: true },
    _feedbackText: { type: String, state: true },
    _feedbackVisible: { type: Boolean, state: true },
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      gap: 8px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .input-row ha-textfield {
      flex: 1;
    }
    .annotation-row {
      display: grid;
      gap: 6px;
    }
    .annotation-label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .annotation-row textarea {
      width: 100%;
      min-height: 92px;
      resize: vertical;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid
        var(
          --input-outlined-idle-border-color,
          var(--divider-color, #9e9e9e)
        );
      border-radius: 12px;
      background: var(
        --card-background-color,
        var(--primary-background-color, #fff)
      );
      color: var(--primary-text-color);
      font: inherit;
      line-height: 1.45;
    }
    .feedback {
      position: absolute;
      bottom: 2px;
      left: 12px;
      right: 12px;
      font-size: 0.78em;
      padding: 2px 8px;
      border-radius: 4px;
      display: none;
      pointer-events: none;
    }
    .feedback.visible {
      display: block;
    }
    .feedback.ok {
      background: rgba(76, 175, 80, 0.12);
      color: var(--success-color, #4caf50);
    }
    .feedback.err {
      background: rgba(244, 67, 54, 0.12);
      color: var(--error-color, #f44336);
    }
  `;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._feedbackClass = "";
    this._feedbackText = "";
    this._feedbackVisible = false;
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
  }

  firstUpdated() {
    const msgEl = this.shadowRoot.querySelector("#msg");
    if (msgEl) {
      msgEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this._record();
        }
      });
    }
  }

  async _record() {
    const msgEl = this.shadowRoot.querySelector("#msg");
    const message = (msgEl?.value || "").trim();
    if (!message) {
      msgEl?.focus();
      return;
    }

    const btn = this.shadowRoot.querySelector("#btn");
    if (btn) btn.disabled = true;

    const cfg = this._config;
    const data = {
      message,
      icon: cfg.icon || "mdi:bookmark",
      color: cfg.color || AMBER,
    };
    const annEl = this.shadowRoot.querySelector("#ann");
    const annotation = (annEl?.value || "").trim();
    if (annotation) data.annotation = annotation;

    let entityIds;
    if (cfg.entity) {
      entityIds = [cfg.entity];
    } else if (cfg.entities) {
      entityIds = Array.isArray(cfg.entities) ? cfg.entities : [cfg.entities];
    } else {
      entityIds = [];
    }
    if (entityIds.length) data.entity_ids = entityIds;

    try {
      await this._hass.callService(DOMAIN, "record", data);
      window.dispatchEvent(
        new CustomEvent("hass-datapoints-event-recorded"),
      );
      if (msgEl) msgEl.value = "";
      if (annEl) annEl.value = "";
      this._feedbackClass = "ok";
      this._feedbackText = "Recorded!";
      this._feedbackVisible = true;
      setTimeout(() => {
        this._feedbackVisible = false
      }, 2500);
    } catch (e) {
      this._feedbackClass = "err";
      this._feedbackText = `Error: ${e.message || "unknown error"}`;
      this._feedbackVisible = true;

      logger.error("[hass-datapoints quick-card]", e);
    }
    if (btn) btn.disabled = false;
  }

  render() {
    const cfg = this._config;
    const cfgIcon = cfg.icon || "mdi:bookmark";
    const cfgColor = cfg.color || AMBER;
    const hasTitle = !!cfg.title;
    const showAnnotation = !!cfg.show_annotation;

    return html`
      <ha-card>
        ${hasTitle
          ? html`
              <div class="card-header">
                <ha-icon .icon=${cfgIcon}></ha-icon>
                ${cfg.title}
              </div>
            `
          : ""}
        <div class="input-row">
          <ha-textfield
            id="msg"
            .placeholder=${cfg.placeholder || "Note something…"}
          ></ha-textfield>
          <ha-button
            id="btn"
            raised
            style="--mdc-theme-primary: ${cfgColor}"
            @click=${() => this._record()}
          >
            <ha-icon .icon=${cfgIcon} slot="icon"></ha-icon>
            Record
          </ha-button>
        </div>
        ${showAnnotation
          ? html`
              <div class="annotation-row">
                <label class="annotation-label" for="ann">Annotation</label>
                <textarea
                  id="ann"
                  placeholder="Detailed note shown on chart hover…"
                ></textarea>
              </div>
            `
          : ""}
        <div
          class="feedback ${this._feedbackClass} ${this._feedbackVisible ? "visible" : ""}"
        >
          ${this._feedbackText}
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-quick-card-editor");
  }

  static getStubConfig() {
    return { title: "Quick Record" };
  }

  getGridOptions() {
    const hasAnnotation = !!this._config?.show_annotation;
    return {
      rows: hasAnnotation ? 3 : 1,
      min_rows: hasAnnotation ? 3 : 1,
      max_rows: hasAnnotation ? 3 : 1,
    };
  }

  getCardSize() {
    return this._config?.show_annotation ? 3 : 1;
  }
}
