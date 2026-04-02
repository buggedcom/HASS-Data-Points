import {
  areaIcon,
  areaName,
  deviceIcon,
  deviceName,
  DOMAIN,
  entityIcon,
  entityName,
  esc,
  labelIcon,
  labelName,
} from "../../lib/shared.js";

/**
 * hass-datapoints-action-card – Full form to record a custom event.
 *
 * Related items UI:
 *   - Config-set targets (entity/device/area/label) rendered as non-removable chips.
 *   - A ha-selector (target schema) below lets the user add extra items per recording.
 *   - On submit both are merged; the selector resets to empty afterwards.
 */

export class HassRecordsActionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    this._userTarget = {};
  }

  setConfig(config) {
    this._config = config || {};
    if (this._rendered) {
      this._render();
      this._updateHassOnChildren();
    }
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
    const targetSel = this.shadowRoot.getElementById("target-sel");
    if (targetSel) targetSel.hass = this._hass;
  }

  _nowStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  // Resolve config target from `target`, or legacy `entity`/`entities`.
  // Normalises all fields to arrays (HA target selector may store single values as strings).
  _configTarget() {
    const cfg = this._config;
    const norm = (v) => !v ? [] : Array.isArray(v) ? v : [v];
    let raw;
    if (cfg.target) raw = cfg.target;
    else if (cfg.entity) raw = { entity_id: [cfg.entity] };
    else if (cfg.entities?.length) raw = { entity_id: cfg.entities };
    else return { entity_id: [], device_id: [], area_id: [], label_id: [] };
    return {
      entity_id: norm(raw.entity_id),
      device_id: norm(raw.device_id),
      area_id:   norm(raw.area_id),
      label_id:  norm(raw.label_id),
    };
  }

  _hasConfigTarget() {
    const t = this._configTarget();
    return !!(t.entity_id?.length || t.device_id?.length || t.area_id?.length || t.label_id?.length);
  }

  // Build read-only chips for config-set targets
  _buildConfigChips(wrap) {
    if (!this._hasConfigTarget()) return;
    const t = this._configTarget();

    const label = document.createElement("div");
    label.className = "chips-label";
    label.textContent = "Data point will be associated with";
    wrap.appendChild(label);

    const row = document.createElement("div");
    row.className = "config-chips";

    const addChip = (icon, name) => {
      const chip = document.createElement("span");
      chip.className = "config-chip";
      const ico = document.createElement("ha-icon");
      ico.setAttribute("icon", icon);
      chip.appendChild(ico);
      chip.appendChild(document.createTextNode(name));
      row.appendChild(chip);
    };

    (t.entity_id || []).forEach((id) => addChip(entityIcon(this._hass, id), entityName(this._hass, id)));
    (t.device_id || []).forEach((id) => addChip(deviceIcon(this._hass, id), deviceName(this._hass, id)));
    (t.area_id  || []).forEach((id) => addChip(areaIcon(this._hass, id), areaName(this._hass, id)));
    (t.label_id || []).forEach((id) => addChip(labelIcon(this._hass, id), labelName(this._hass, id)));

    wrap.appendChild(row);
  }

  _render() {
    this._rendered = true;
    const cfg = this._config;
    const hasTitle = !!cfg.title;
    const showDate = cfg.show_date !== false;
    const showAnnotation = cfg.show_annotation !== false;

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
        ha-textfield { display: block; width: 100%; }
        ha-icon-picker { display: block; width: 100%; }
        .field-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--secondary-text-color);
        }
        .annotation-input {
          display: block;
          width: 100%;
          min-height: 104px;
          resize: vertical;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
          border-radius: 12px;
          background: var(--card-background-color, var(--primary-background-color, #fff));
          color: var(--primary-text-color);
          font: inherit;
          line-height: 1.45;
        }
        .annotation-input::placeholder {
          color: var(--secondary-text-color);
        }
        .annotation-input:focus {
          outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 40%, transparent);
          outline-offset: 1px;
        }
        .color-preview {
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid var(--divider-color, #ccc);
          cursor: pointer; padding: 0; overflow: hidden;
          position: relative; flex-shrink: 0;
        }
        .color-preview input[type=color] {
          position: absolute; top: -4px; left: -4px;
          width: calc(100% + 8px); height: calc(100% + 8px);
          border: none; cursor: pointer; padding: 0; background: none; opacity: 0;
        }
        .color-swatch-inner {
          display: block; width: 100%; height: 100%;
          border-radius: 50%; pointer-events: none;
        }
        .chips-label {
          font-size: 0.75em;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        .config-chips {
          display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;
        }
        .config-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.78em;
          color: var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          padding: 2px 10px; border-radius: 999px;
          white-space: nowrap;
        }
        .config-chip ha-icon { --mdc-icon-size: 12px; }
        ha-button {
          display: block; margin-top: 8px;
          --mdc-theme-primary: var(--primary-color);
        }
        .feedback {
          font-size: 0.82em; margin-top: 8px; padding: 6px 10px;
          border-radius: 6px; display: none;
        }
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${hasTitle ? `<div class="card-header">${esc(cfg.title)}</div>` : ""}

        <div class="form-group">
          <ha-textfield id="msg" label="Message *" placeholder="What happened?" style="width:100%"></ha-textfield>
        </div>

        ${showAnnotation ? `
        <div class="form-group">
          <label class="field-label" for="ann">Annotation</label>
          <textarea id="ann" class="annotation-input" placeholder="Detailed note shown on chart hover…"></textarea>
        </div>
        ` : ""}

        ${showDate ? `
        <div class="form-group">
          <ha-textfield id="date" label="Date & Time" type="datetime-local" style="width:100%"></ha-textfield>
        </div>
        ` : ""}

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

        <div class="form-group" id="target-wrap"></div>

        <ha-button id="btn" raised>${esc(cfg.submit_label || "Record Event")}</ha-button>
        <div class="feedback" id="feedback"></div>
      </ha-card>`;

    // Build target section
    const targetWrap = this.shadowRoot.getElementById("target-wrap");
    if (cfg.show_config_targets !== false) this._buildConfigChips(targetWrap);

    if (cfg.show_target_picker !== false) {
      const targetSel = document.createElement("ha-selector");
      targetSel.id = "target-sel";
      targetSel.selector = { target: {} };
      targetSel.hass = this._hass;
      targetSel.value = {};
      this._userTarget = {};
      targetSel.addEventListener("value-changed", (e) => {
        this._userTarget = e.detail.value || {};
        targetSel.value = this._userTarget;
      });
      targetWrap.appendChild(targetSel);
    }

    this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());

    if (showDate) {
      const dateEl = this.shadowRoot.getElementById("date");
      if (dateEl) dateEl.value = cfg.default_date || this._nowStr();
    }

    const annEl = this.shadowRoot.getElementById("ann");
    if (annEl) annEl.value = cfg.default_annotation || "";
    if (annEl) {
      annEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this._record();
        }
      });
    }

    const iconPicker = this.shadowRoot.getElementById("icon-picker");
    if (iconPicker) iconPicker.value = cfg.default_icon || "mdi:bookmark";
    const msgEl = this.shadowRoot.getElementById("msg");
    if (msgEl) msgEl.value = cfg.default_message || "";

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

  _mergeTargets(a, b) {
    const norm = (v) => !v ? [] : Array.isArray(v) ? v : [v];
    const merge = (x, y) => [...new Set([...norm(x), ...norm(y)])];
    return {
      entity_id: merge(a.entity_id, b.entity_id),
      device_id: merge(a.device_id, b.device_id),
      area_id:   merge(a.area_id,   b.area_id),
      label_id:  merge(a.label_id,  b.label_id),
    };
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

    const dateEl = this.shadowRoot.getElementById("date");
    const dateVal = (dateEl?.value || "").trim();
    if (dateVal) data.date = dateVal;

    const merged = this._mergeTargets(this._configTarget(), this._userTarget || {});
    if (merged.entity_id?.length) data.entity_ids = merged.entity_id;
    if (merged.device_id?.length) data.device_ids = merged.device_id;
    if (merged.area_id?.length)   data.area_ids   = merged.area_id;
    if (merged.label_id?.length)  data.label_ids  = merged.label_id;

    const fb = this.shadowRoot.getElementById("feedback");
    try {
      await this._hass.callService(DOMAIN, "record", data);
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      this.dispatchEvent(new CustomEvent("hass-datapoints-action-recorded", {
        bubbles: true,
        composed: true,
        detail: { ...data },
      }));
      msgEl.value = "";
      if (annEl) annEl.value = "";
      if (dateEl) dateEl.value = this._config.default_date || this._nowStr();
      // Reset user target only (config chips stay)
      this._userTarget = {};
      const targetSel = this.shadowRoot.getElementById("target-sel");
      if (targetSel) targetSel.value = {};
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

  getGridOptions() {
    const hasAnnotation = this._config?.show_annotation !== false;
    return {
      rows: hasAnnotation ? 10 : 7,
      min_rows: hasAnnotation ? 10 : 7,
      max_rows: hasAnnotation ? 10 : 7,
    };
  }

  getCardSize() {
    return this._config?.show_annotation !== false ? 10 : 7;
  }
}
