/**
 * hass-datapoints-action-card – Full form to record a custom event.
 *
 * Uses HA native elements:
 *   <ha-textfield>      for text inputs
 *   <ha-textarea>       for annotation
 *   <ha-icon-picker>    for icon selection
 *   <ha-selector>       for entity/device/area/label selection (target schema)
 *   <ha-button>         for buttons
 */

class HassRecordsActionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    // Track entity selections in JS – avoids reading stale DOM picker values
    this._entityRows = []; // [{ el: <div>, value: "entity_id|..." }]
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._render();
    }
    this._updateHassOnChildren();
  }

  _updateHassOnChildren() {
    if (!this.shadowRoot || !this._hass) return;
    const iconPicker = this.shadowRoot.getElementById("icon-picker");
    if (iconPicker) iconPicker.hass = this._hass;
    // Push hass to every selector in the entity list
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-selector").forEach((el) => {
      el.hass = this._hass;
    });
  }

  _render() {
    this._rendered = true;
    const cfg = this._config;
    const showEntityField = !cfg.entity;
    const hasTitle = !!cfg.title;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; }
        .card-header {
          font-size: 1.1em;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--primary-text-color);
        }
        .form-group { margin-bottom: 12px; }
        .row { display: flex; gap: 10px; align-items: flex-end; }
        .row .form-group { flex: 1; min-width: 0; }
        ha-textfield, ha-textarea {
          display: block;
          width: 100%;
        }
        ha-icon-picker {
          display: block;
          width: 100%;
        }
        .color-preview {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--divider-color, #ccc);
          cursor: pointer;
          padding: 0;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }
        .color-preview input[type=color] {
          position: absolute;
          top: -4px; left: -4px;
          width: calc(100% + 8px);
          height: calc(100% + 8px);
          border: none;
          cursor: pointer;
          padding: 0;
          background: none;
          opacity: 0;
        }
        .color-swatch-inner {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          pointer-events: none;
        }
        .entity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 0;
        }
        .entity-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .entity-row ha-entity-picker,
        .entity-row ha-selector {
          flex: 1;
          min-width: 0;
          display: block;
        }
        .add-entity-wrap {
          /* only add top margin when there are rows above */
          margin-top: 0;
          transition: margin-top 0.1s;
        }
        .add-entity-wrap.has-rows { margin-top: 8px; }
        ha-button {
          display: block;
          margin-top: 8px;
          --mdc-theme-primary: var(--primary-color);
        }
        .feedback {
          font-size: 0.82em;
          margin-top: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          display: none;
        }
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${hasTitle ? `<div class="card-header">${esc(cfg.title)}</div>` : ""}

        <div class="form-group">
          <ha-textfield id="msg" label="Message *" placeholder="What happened?" style="width:100%"></ha-textfield>
        </div>

        <div class="form-group">
          <ha-textarea id="ann" label="Annotation" placeholder="Detailed note shown on chart hover…" autogrow style="width:100%"></ha-textarea>
        </div>

        <div class="row">
          <div class="form-group">
            <ha-icon-picker id="icon-picker" label="Icon"></ha-icon-picker>
          </div>
          <div class="form-group" style="max-width:64px;display:flex;align-items:center;justify-content:center;">
            <div class="color-preview" id="color-preview">
              <span class="color-swatch-inner" id="color-swatch"></span>
              <input id="color" type="color" value="${cfg.default_color || "#03a9f4"}" title="Colour" />
            </div>
          </div>
        </div>

        ${showEntityField ? `
        <div class="form-group" id="entity-section">
          <div class="entity-list" id="entity-list"></div>
          <div class="add-entity-wrap" id="add-entity-wrap">
            <ha-button id="add-entity-btn" variant="neutral">
              <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
              Add related item
            </ha-button>
          </div>
        </div>
        ` : ""}

        <ha-button id="btn" raised>Record Event</ha-button>
        <div class="feedback" id="feedback"></div>
      </ha-card>`;

    this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());

    // Ctrl+Enter in annotation to submit
    const annEl = this.shadowRoot.getElementById("ann");
    if (annEl) {
      annEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this._record();
        }
      });
    }

    if (showEntityField) {
      this.shadowRoot.getElementById("add-entity-btn").addEventListener("click", () => this._addEntityRow());
    }

    // Set default icon
    const iconPicker = this.shadowRoot.getElementById("icon-picker");
    if (iconPicker) {
      iconPicker.value = cfg.default_icon || "mdi:bookmark";
    }

    // Colour swatch
    const colorInput = this.shadowRoot.getElementById("color");
    const colorSwatch = this.shadowRoot.getElementById("color-swatch");
    const colorPreview = this.shadowRoot.getElementById("color-preview");
    if (colorInput && colorSwatch && colorPreview) {
      const initialColor = colorInput.value;
      colorSwatch.style.background = initialColor;
      colorPreview.style.background = initialColor;
      colorInput.addEventListener("input", () => {
        colorSwatch.style.background = colorInput.value;
        colorPreview.style.background = colorInput.value;
      });
    }

    this._updateHassOnChildren();
  }

  _addEntityRow() {
    const list = this.shadowRoot.getElementById("entity-list");
    if (!list) return;

    // Track entry in JS array
    const entry = { value: "" };
    this._entityRows.push(entry);

    // ── Row container ────────────────────────────────────────────────────────
    const row = document.createElement("div");
    row.className = "entity-row";
    entry.el = row;

    // ── Remove button ────────────────────────────────────────────────────────
    const removeBtn = document.createElement("ha-icon-button");
    removeBtn.setAttribute("label", "Remove");
    removeBtn.style.color = "var(--error-color, #f44336)";
    removeBtn.style.flexShrink = "0";
    const removeIcon = document.createElement("ha-icon");
    removeIcon.setAttribute("icon", "mdi:close");
    removeBtn.appendChild(removeIcon);
    removeBtn.addEventListener("click", () => {
      const idx = this._entityRows.indexOf(entry);
      if (idx !== -1) this._entityRows.splice(idx, 1);
      row.remove();
      this._updateAddBtnSpacing();
    });

    // ── Entity selector ──────────────────────────────────────────────────────
    const picker = document.createElement("ha-selector");
    picker.style.flex = "1";
    picker.style.minWidth = "0";
    picker.style.display = "block";
    picker.selector = { entity: {} };
    picker.hass = this._hass;
    picker.value = "";
    picker.label = "Entity";

    picker.addEventListener("value-changed", (e) => {
      entry.value = e.detail.value || "";
    });

    row.appendChild(picker);
    row.appendChild(removeBtn);
    list.appendChild(row);
    this._updateAddBtnSpacing();
  }

  _updateAddBtnSpacing() {
    const wrap = this.shadowRoot.getElementById("add-entity-wrap");
    if (!wrap) return;
    const hasRows = this._entityRows.length > 0;
    wrap.classList.toggle("has-rows", hasRows);
  }

  _getEntityIds() {
    const configEntity = this._config?.entity;
    if (configEntity) return [configEntity];

    return this._entityRows
      .map((e) => (e.value || "").trim())
      .filter(Boolean);
  }

  async _record() {
    const msgEl = this.shadowRoot.getElementById("msg");
    const message = (msgEl.value || "").trim();
    if (!message) { msgEl.focus(); return; }

    const btn = this.shadowRoot.getElementById("btn");
    btn.disabled = true;

    const data = { message };
    const annEl = this.shadowRoot.getElementById("ann");
    const ann = (annEl?.value || "").trim();
    if (ann) data.annotation = ann;

    const iconPicker = this.shadowRoot.getElementById("icon-picker");
    const icon = iconPicker?.value;
    if (icon) data.icon = icon;

    data.color = this.shadowRoot.getElementById("color")?.value || this._config.default_color || "#03a9f4";

    const entityIds = this._getEntityIds();
    if (entityIds.length) data.entity_ids = entityIds;

    const fb = this.shadowRoot.getElementById("feedback");
    try {
      await this._hass.callService(DOMAIN, "record", data);
      // Notify sibling cards on the same page to refresh immediately
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      msgEl.value = "";
      if (annEl) annEl.value = "";
      // Clear entity rows
      this._entityRows = [];
      const list = this.shadowRoot.getElementById("entity-list");
      if (list) list.innerHTML = "";
      this._updateAddBtnSpacing();
      fb.className = "feedback ok";
      fb.textContent = "Event recorded!";
      fb.style.display = "block";
      setTimeout(() => (fb.style.display = "none"), 3000);
    } catch (e) {
      fb.className = "feedback err";
      fb.textContent = `Error: ${e.message || "unknown error"}`;
      fb.style.display = "block";
      console.error("[hass-datapoints action-card]", e);
    }

    btn.disabled = false;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-action-card-editor");
  }

  static getStubConfig() {
    return { title: "Record Event" };
  }
}
