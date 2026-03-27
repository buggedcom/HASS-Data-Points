/**
 * hass-datapoints-quick-card – Simple one-field quick record card.
 *
 * Configurable icon and color (defaults to mdi:bookmark / amber).
 * Uses HA native <ha-textfield> and <ha-button>.
 */

class HassRecordsQuickCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  setConfig(config) {
    this._config = config || {};
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

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
        ha-card {
          height: 100%;
          padding: 0 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          position: relative;
        }
        .card-header { display: none; }
        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .input-row ha-textfield { flex: 1; }
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
    return {
      rows: 1,
      min_rows: 1,
      max_rows: 1,
    };
  }
}

