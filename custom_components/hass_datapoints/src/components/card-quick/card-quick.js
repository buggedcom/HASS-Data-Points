import { AMBER, DOMAIN, esc } from "../../lib/shared.js";

/**
 * hass-datapoints-quick-card – Simple one-field quick record card.
 *
 * Configurable icon and color (defaults to mdi:bookmark / amber).
 * Uses HA native <ha-textfield> and <ha-button>.
 */

export class HassRecordsQuickCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._rendered) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
  }

  _render() {
    this._rendered = true;
    const cfg = this._config;
    const cfgIcon = cfg.icon || "mdi:bookmark";
    const cfgColor = cfg.color || AMBER;
    const hasTitle = !!(cfg.title);
    const showAnnotation = !!cfg.show_annotation;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
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
        .card-header { display: none; }
        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .input-row ha-textfield { flex: 1; }
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
          border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
          border-radius: 12px;
          background: var(--card-background-color, var(--primary-background-color, #fff));
          color: var(--primary-text-color);
          font: inherit;
          line-height: 1.45;
        }
        ha-button {
          --mdc-theme-primary: ${esc(cfgColor)};
        }
        ha-button ha-icon {
          --mdc-icon-size: 18px;
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
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${hasTitle ? `
        <div class="card-header">
          <ha-icon class="header-icon" icon="${esc(cfgIcon)}"></ha-icon>
          ${esc(cfg.title)}
        </div>` : ""}
        <div class="input-row">
          <ha-textfield id="msg" placeholder="${esc(cfg.placeholder || "Note something…")}" style="flex:1"></ha-textfield>
          <ha-button id="btn" raised>
            <ha-icon icon="${esc(cfgIcon)}" slot="icon"></ha-icon>
            Record
          </ha-button>
        </div>
        ${showAnnotation ? `
        <div class="annotation-row">
          <label class="annotation-label" for="ann">Annotation</label>
          <textarea id="ann" placeholder="Detailed note shown on chart hover…"></textarea>
        </div>
        ` : ""}
        <div class="feedback" id="feedback"></div>
      </ha-card>`;

    this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());
    const msgEl = this.shadowRoot.getElementById("msg");
    if (msgEl) {
      msgEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); this._record(); }
      });
    }
  }

  async _record() {
    const msgEl = this.shadowRoot.getElementById("msg");
    const message = (msgEl.value || "").trim();
    if (!message) { msgEl.focus(); return; }

    const btn = this.shadowRoot.getElementById("btn");
    btn.disabled = true;

    const cfg = this._config;
    const data = {
      message,
      icon: cfg.icon || "mdi:bookmark",
      color: cfg.color || AMBER,
    };
    const annEl = this.shadowRoot.getElementById("ann");
    const annotation = (annEl?.value || "").trim();
    if (annotation) data.annotation = annotation;

    const entityIds = cfg.entity
      ? [cfg.entity]
      : cfg.entities
        ? (Array.isArray(cfg.entities) ? cfg.entities : [cfg.entities])
        : [];
    if (entityIds.length) data.entity_ids = entityIds;

    const fb = this.shadowRoot.getElementById("feedback");
    try {
      await this._hass.callService(DOMAIN, "record", data);
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      msgEl.value = "";
      if (annEl) annEl.value = "";
      fb.className = "feedback ok";
      fb.textContent = "Recorded!";
      fb.style.display = "block";
      setTimeout(() => (fb.style.display = "none"), 2500);
    } catch (e) {
      fb.className = "feedback err";
      fb.textContent = `Error: ${e.message || "unknown error"}`;
      fb.style.display = "block";
      console.error("[hass-datapoints quick-card]", e);
    }
    btn.disabled = false;
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
