/**
 * Lovelace card editors for all Hass Records cards.
 *
 * HA contract:
 *   - HA calls  el.setConfig(config)  then sets  el.hass = hass
 *   - Editor must fire CustomEvent("config-changed", { detail: { config } })
 *     bubbles:true, composed:true whenever the user changes anything.
 *
 * Key rules:
 *   - NEVER set HA custom-element values via HTML attribute strings in innerHTML.
 *     Always create with document.createElement and set .property in JS.
 *   - ha-textfield fires "input", not "change".
 *   - ha-select: set .value as a JS property after appending to DOM.
 *   - ha-switch / ha-checkbox: set .checked as JS property.
 *   - ha-entity-picker / ha-icon-picker need .hass set before or immediately after appending.
 */

// ---------------------------------------------------------------------------
// Shared CSS (injected once as a <style> string into innerHTML)
// ---------------------------------------------------------------------------
const EDITOR_CSS = `
  <style>
    :host { display: block; }
    .ed { display: flex; flex-direction: column; gap: 16px; padding: 4px 0 8px; }
    .section {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--secondary-text-color);
      margin-bottom: -4px;
    }
    .note { font-size: 0.78rem; color: var(--secondary-text-color); }
    .ent-row { display: flex; gap: 8px; align-items: center; }
    .ent-row > * { flex: 1; min-width: 0; }
    .swatch-wrap { display: flex; align-items: center; gap: 12px; }
    .swatch-wrap span { font-size: 0.875rem; color: var(--primary-text-color); }
    .swatch-btn {
      width: 38px; height: 38px; border-radius: 50%;
      border: 2px solid var(--divider-color, #ccc);
      cursor: pointer; padding: 0; overflow: hidden;
      position: relative; flex-shrink: 0; background: transparent;
    }
    .swatch-btn input[type="color"] {
      position: absolute; top: -4px; left: -4px;
      width: calc(100% + 8px); height: calc(100% + 8px);
      border: none; cursor: pointer; padding: 0; background: none; opacity: 0;
    }
    .swatch-inner { display: block; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; }
    .switch-help-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .switch-help-row ha-formfield { flex: 1; }
    .help-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      cursor: default;
      flex-shrink: 0;
      position: relative;
    }
    .help-icon:hover .help-tooltip {
      display: block;
    }
    .help-tooltip {
      display: none;
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78rem;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10;
      pointer-events: none;
    }
  </style>`;

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------
class HassRecordsEditorBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  // HA calls setConfig first, then sets hass
  setConfig(config) {
    this._config = { ...config };
    this._build();
  }

  set hass(h) {
    this._hass = h;
    // Push hass to every picker already in the shadow root
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => {
      el.hass = h;
    });
  }

  _fire(cfg) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...cfg } },
      bubbles: true,
      composed: true,
    }));
  }

  _set(key, value) {
    const cfg = { ...this._config };
    if (value === "" || value === null || value === undefined) {
      delete cfg[key];
    } else {
      cfg[key] = value;
    }
    this._config = cfg;
    this._fire(cfg);
  }

  // Subclasses override _build() to populate the shadow root
  _build() {}

  // ── Factory helpers (all imperative) ──────────────────────────────────────

  _section(text) {
    const d = document.createElement("div");
    d.className = "section";
    d.textContent = text;
    return d;
  }

  _note(text) {
    const d = document.createElement("div");
    d.className = "note";
    d.textContent = text;
    return d;
  }

  // ha-textfield – fires "input"
  _textField(label, key, { type, placeholder, suffix, fallback = "" } = {}) {
    const el = document.createElement("ha-textfield");
    el.label = label;
    el.style.display = "block";
    el.style.width = "100%";
    if (type) el.type = type;
    if (placeholder) el.placeholder = placeholder;
    if (suffix) el.suffix = suffix;
    el.value = this._config[key] != null ? String(this._config[key]) : fallback;
    el.addEventListener("input", () => {
      if (type === "number") {
        const n = parseFloat(el.value);
        this._set(key, isNaN(n) ? undefined : n);
      } else {
        this._set(key, el.value || undefined);
      }
    });
    return el;
  }

  // ha-icon-picker
  _iconPicker(label, key, defaultVal = "mdi:bookmark") {
    const el = document.createElement("ha-icon-picker");
    el.label = label;
    el.style.display = "block";
    el.style.width = "100%";
    if (this._hass) el.hass = this._hass;
    // value must be set after the element upgrades
    requestAnimationFrame(() => { el.value = this._config[key] ?? defaultVal; });
    el.addEventListener("value-changed", (e) => this._set(key, e.detail.value || undefined));
    return el;
  }

  // ha-entity-picker
  _entityPicker(label, key) {
    const el = document.createElement("ha-entity-picker");
    el.label = label;
    el.setAttribute("allow-custom-entity", "");
    el.style.display = "block";
    el.style.width = "100%";
    if (this._hass) el.hass = this._hass;
    requestAnimationFrame(() => { el.value = this._config[key] ?? ""; });
    el.addEventListener("value-changed", (e) => this._set(key, e.detail.value || undefined));
    return el;
  }

  // ha-switch inside ha-formfield
  _switch(label, key, { defaultTrue = false } = {}) {
    const ff = document.createElement("ha-formfield");
    ff.label = label;
    const sw = document.createElement("ha-switch");
    // If key not in config and defaultTrue, treat as checked
    sw.checked = this._config[key] !== undefined ? !!this._config[key] : defaultTrue;
    sw.addEventListener("change", () => {
      // Store explicit false when defaultTrue so toggling off is saved
      this._set(key, defaultTrue ? (sw.checked ? undefined : false) : (sw.checked || undefined));
    });
    ff.appendChild(sw);
    return { el: ff, sw };
  }

  // ha-switch with an adjacent help icon tooltip
  _switchWithHelp(label, key, tooltip, { defaultTrue = false } = {}) {
    const { el: ffEl, sw } = this._switch(label, key, { defaultTrue });
    const row = document.createElement("div");
    row.className = "switch-help-row";

    const helpWrap = document.createElement("span");
    helpWrap.className = "help-icon";

    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", "mdi:help-circle-outline");

    const tip = document.createElement("span");
    tip.className = "help-tooltip";
    tip.textContent = tooltip;

    helpWrap.appendChild(icon);
    helpWrap.appendChild(tip);

    row.appendChild(ffEl);
    row.appendChild(helpWrap);
    return { el: row, sw };
  }

  // Colour swatch
  _colorSwatch(label, key, defaultColor = "#03a9f4") {
    const color = this._config[key] || defaultColor;
    const wrap = document.createElement("div");
    wrap.className = "swatch-wrap";

    const lbl = document.createElement("span");
    lbl.textContent = label;

    const btn = document.createElement("button");
    btn.className = "swatch-btn";
    btn.title = "Choose colour";
    btn.style.background = color;

    const inner = document.createElement("span");
    inner.className = "swatch-inner";
    inner.style.background = color;

    const inp = document.createElement("input");
    inp.type = "color";
    inp.value = color;
    inp.addEventListener("input", () => {
      btn.style.background = inp.value;
      inner.style.background = inp.value;
    });
    inp.addEventListener("change", () => this._set(key, inp.value));

    btn.appendChild(inner);
    btn.appendChild(inp);
    wrap.appendChild(lbl);
    wrap.appendChild(btn);
    return wrap;
  }

  // ha-select
  _select(label, key, options, fallback = "") {
    const el = document.createElement("ha-select");
    el.label = label;
    el.style.display = "block";
    el.style.width = "100%";

    options.forEach(([value, text]) => {
      const item = document.createElement("mwc-list-item");
      item.value = value;
      item.textContent = text;
      el.appendChild(item);
    });

    requestAnimationFrame(() => {
      el.value = this._config[key] != null ? String(this._config[key]) : fallback;
    });

    el.addEventListener("selected", () => {
      this._set(key, el.value || undefined);
    });

    return el;
  }

  // Dynamic entity list with add/remove
  _entityList(key, buttonLabel = "Add entity") {
    const outer = document.createElement("div");
    outer.style.display = "flex";
    outer.style.flexDirection = "column";
    outer.style.gap = "8px";

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "8px";

    const addWrap = document.createElement("div");

    const addBtn = document.createElement("ha-button");
    addBtn.setAttribute("outlined", "");
    const addIco = document.createElement("ha-icon");
    addIco.setAttribute("icon", "mdi:plus");
    addIco.setAttribute("slot", "icon");
    addBtn.appendChild(addIco);
    addBtn.appendChild(document.createTextNode(buttonLabel));
    addWrap.appendChild(addBtn);

    outer.appendChild(list);
    outer.appendChild(addWrap);

    const getArr = () => [...(this._config[key] || [])];

    const renderRows = () => {
      list.innerHTML = "";
      addWrap.style.marginTop = getArr().length ? "4px" : "0";
      getArr().forEach((eid, idx) => {
        const row = document.createElement("div");
        row.className = "ent-row";

        const picker = document.createElement("ha-entity-picker");
        picker.setAttribute("allow-custom-entity", "");
        picker.style.flex = "1";
        picker.style.minWidth = "0";
        if (this._hass) picker.hass = this._hass;
        requestAnimationFrame(() => { picker.value = eid || ""; });
        picker.addEventListener("value-changed", (e) => {
          const arr = getArr();
          arr[idx] = e.detail.value || "";
          this._set(key, arr.some(Boolean) ? arr : undefined);
        });

        const rm = document.createElement("ha-icon-button");
        rm.setAttribute("label", "Remove");
        rm.style.color = "var(--error-color, #f44336)";
        rm.style.flexShrink = "0";
        const rmIco = document.createElement("ha-icon");
        rmIco.setAttribute("icon", "mdi:close");
        rm.appendChild(rmIco);
        rm.addEventListener("click", () => {
          const arr = getArr();
          arr.splice(idx, 1);
          this._set(key, arr.length ? arr : undefined);
          renderRows();
        });

        row.appendChild(picker);
        row.appendChild(rm);
        list.appendChild(row);
      });
    };

    addBtn.addEventListener("click", () => {
      const arr = getArr();
      arr.push("");
      this._set(key, arr);
      renderRows();
    });

    renderRows();

    // Allow hass updates to reach dynamically created pickers
    outer._pushHass = (h) => {
      list.querySelectorAll("ha-entity-picker").forEach((p) => { p.hass = h; });
    };

    return outer;
  }
}

// ---------------------------------------------------------------------------
// 1. Action Card editor
// ---------------------------------------------------------------------------
class HassRecordsActionCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("General"));
    ed.appendChild(this._textField("Card title (optional)", "title"));

    ed.appendChild(this._section("Default icon & colour"));
    ed.appendChild(this._iconPicker("Default icon", "default_icon", "mdi:bookmark"));
    ed.appendChild(this._colorSwatch("Default colour", "default_color", "#03a9f4"));

    ed.appendChild(this._section("Default related items"));
    ed.appendChild(this._note("Pre-fill related items. Leave blank so the user chooses when recording."));
    ed.appendChild(this._entityPicker("Single entity (optional)", "entity"));
    ed.appendChild(this._section("Multiple entities"));
    this._entList = this._entityList("entities", "Add default related items");
    ed.appendChild(this._entList);

    this.shadowRoot.appendChild(ed);
  }

  set hass(h) {
    this._hass = h;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => { el.hass = h; });
    this._entList?._pushHass(h);
  }
}

// ---------------------------------------------------------------------------
// 2. Quick Card editor
// ---------------------------------------------------------------------------
class HassRecordsQuickCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("General"));
    ed.appendChild(this._textField("Card title (optional)", "title"));
    ed.appendChild(this._textField("Input placeholder text", "placeholder"));

    ed.appendChild(this._section("Icon & colour"));
    ed.appendChild(this._iconPicker("Icon", "icon", "mdi:bookmark"));
    ed.appendChild(this._colorSwatch("Colour", "color", AMBER));

    ed.appendChild(this._section("Related items"));
    ed.appendChild(this._note("These items will be linked to every record made with this card."));
    ed.appendChild(this._entityPicker("Single entity (optional)", "entity"));
    ed.appendChild(this._section("Multiple entities"));
    this._entList = this._entityList("entities", "Add related items");
    ed.appendChild(this._entList);

    this.shadowRoot.appendChild(ed);
  }

  set hass(h) {
    this._hass = h;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => { el.hass = h; });
    this._entList?._pushHass(h);
  }
}

// ---------------------------------------------------------------------------
// 3. History Card editor
// ---------------------------------------------------------------------------
class HassRecordsHistoryCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("General"));
    ed.appendChild(this._textField("Card title (optional)", "title"));
    ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "24" }));

    ed.appendChild(this._section("Entity"));
    ed.appendChild(this._entityPicker("Single entity", "entity"));

    ed.appendChild(this._section("Multiple entities"));
    this._entList = this._entityList("entities");
    ed.appendChild(this._entList);

    this.shadowRoot.appendChild(ed);
  }

  set hass(h) {
    this._hass = h;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => { el.hass = h; });
    this._entList?._pushHass(h);
  }
}

// ---------------------------------------------------------------------------
// 4. Statistics Card editor
// ---------------------------------------------------------------------------
class HassRecordsStatisticsCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("General"));
    ed.appendChild(this._textField("Card title (optional)", "title"));
    ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "168" }));

    ed.appendChild(this._section("Period"));
    const periodSel = document.createElement("ha-select");
    periodSel.label = "Period";
    periodSel.style.display = "block";
    periodSel.style.width = "100%";
    ["5minute", "hour", "day", "week", "month"].forEach((p) => {
      const item = document.createElement("ha-list-item");
      item.value = p;
      item.textContent = p;
      periodSel.appendChild(item);
    });
    ed.appendChild(periodSel);
    requestAnimationFrame(() => { periodSel.value = this._config.period || "hour"; });
    periodSel.addEventListener("selected", () => {
      if (periodSel.value) this._set("period", periodSel.value);
    });

    ed.appendChild(this._section("Stat types"));
    ["mean", "min", "max", "sum", "state"].forEach((st) => {
      const ff = document.createElement("ha-formfield");
      ff.label = st;
      const cb = document.createElement("ha-checkbox");
      cb.checked = (this._config.stat_types || ["mean"]).includes(st);
      cb.addEventListener("change", () => {
        const cur = [...(this._config.stat_types || ["mean"])];
        if (cb.checked) { if (!cur.includes(st)) cur.push(st); }
        else { const i = cur.indexOf(st); if (i !== -1) cur.splice(i, 1); }
        this._set("stat_types", cur.length ? cur : ["mean"]);
      });
      ff.appendChild(cb);
      ed.appendChild(ff);
    });

    ed.appendChild(this._section("Entity / statistic ID"));
    ed.appendChild(this._entityPicker("Single entity / statistic ID", "entity"));

    ed.appendChild(this._section("Multiple entities"));
    this._entList = this._entityList("entities");
    ed.appendChild(this._entList);

    this.shadowRoot.appendChild(ed);
  }

  set hass(h) {
    this._hass = h;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => { el.hass = h; });
    this._entList?._pushHass(h);
  }
}

// ---------------------------------------------------------------------------
// 5. Sensor Card editor
// ---------------------------------------------------------------------------
class HassRecordsSensorCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("Entity"));
    ed.appendChild(this._entityPicker("Sensor entity *", "entity"));

    ed.appendChild(this._section("Display"));
    ed.appendChild(this._textField("Override display name (optional)", "name"));
    ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "24" }));
    ed.appendChild(this._colorSwatch("Graph colour", "graph_color", COLORS[0]));
    ed.appendChild(this._select("Annotation style", "annotation_style", [
      ["circle", "Circle on line"],
      ["line", "Dotted vertical line"],
    ]));

    ed.appendChild(this._section("Records list"));
    const { el: swEl, sw } = this._switch("Show records list below graph", "show_records");
    ed.appendChild(swEl);

    const pageS = this._textField("Records per page (blank = show all)", "records_page_size", { type: "number" });
    const limit = this._textField("Max records to show (blank = all)", "records_limit", { type: "number" });
    const showAnn = this._switchWithHelp(
      "Show full message",
      "records_show_full_message",
      "User will be able to expand the row if hidden",
      { defaultTrue: true }
    );
    ed.appendChild(pageS);
    ed.appendChild(limit);
    ed.appendChild(showAnn.el);

    const syncDisabled = () => {
      const on = !!this._config.show_records;
      pageS.disabled = !on;
      limit.disabled = !on;
      showAnn.el.style.opacity = on ? "1" : "0.5";
      showAnn.sw.disabled = !on;
    };
    sw.addEventListener("change", syncDisabled);
    syncDisabled();

    this.shadowRoot.appendChild(ed);
  }
}

// ---------------------------------------------------------------------------
// 6. List Card editor
// ---------------------------------------------------------------------------
class HassRecordsListCardEditor extends HassRecordsEditorBase {
  _build() {
    this.shadowRoot.innerHTML = EDITOR_CSS;
    const ed = document.createElement("div");
    ed.className = "ed";

    ed.appendChild(this._section("General"));
    ed.appendChild(this._textField("Card title (optional)", "title"));
    ed.appendChild(this._textField("Hours to show (blank = all time)", "hours_to_show", { type: "number" }));
    ed.appendChild(this._textField("Records per page", "page_size", { type: "number", fallback: "15" }));
    ed.appendChild(this._textField("Max height of list (px, blank = unlimited)", "max_height", { type: "number" }));

    ed.appendChild(this._section("Filtering"));
    ed.appendChild(this._textField("Default message filter (always applied)", "message_filter"));

    ed.appendChild(this._section("Visibility"));
    ed.appendChild(this._switch("Show search bar", "show_search", { defaultTrue: true }).el);
    ed.appendChild(this._switch("Show related entities", "show_entities", { defaultTrue: true }).el);
    ed.appendChild(this._switch("Show edit & delete actions", "show_actions", { defaultTrue: true }).el);
    ed.appendChild(this._switchWithHelp(
      "Show full message",
      "show_full_message",
      "User will be able to expand the row if hidden",
      { defaultTrue: true }
    ).el);

    ed.appendChild(this._section("Filter by entity"));
    ed.appendChild(this._entityPicker("Single entity (optional)", "entity"));

    ed.appendChild(this._section("Multiple entity filter"));
    this._entList = this._entityList("entities", "Add default related items");
    ed.appendChild(this._entList);

    this.shadowRoot.appendChild(ed);
  }

  set hass(h) {
    this._hass = h;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker").forEach((el) => { el.hass = h; });
    this._entList?._pushHass(h);
  }
}
