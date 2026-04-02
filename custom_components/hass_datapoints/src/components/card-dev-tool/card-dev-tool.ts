import { confirmDestructiveAction, DOMAIN, esc, fmtDateTime } from "@/lib/shared";
import type { HassLike } from "@/lib/types";

interface ChangeItem {
  timestamp: string;
  message: string;
  entity_id: string;
  icon: string;
  color: string;
}
interface WindowResult {
  label: string;
  startDt: string;
  hours: number;
  changes: ChangeItem[];
  selected: Set<number>;
}
interface WindowConfig {
  id: number;
  label: string;
  startDt: string;
  hours: number;
}
/**
 * hass-datapoints-dev-tool-card – Generate demo data points from HA history.
 *
 * Multiple named time windows can be defined and analyzed in parallel.
 * Each window's detected state changes are shown in its own panel with
 * independent checkboxes. "Record selected" aggregates across all windows.
 */
export class HassRecordsDevToolCard extends HTMLElement {
  _config: Record<string, unknown> = {};

  _hass: HassLike | null = null;

  _rendered = false;

  _entities: string[] = [];

  _suppressEntityChange = false;

  _nextWindowId = 1;

  _results: Map<number, WindowResult> = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: Record<string, unknown>) {
    this._config = config || {};
  }

  set hass(hass: HassLike) {
    this._hass = hass;
    if (!this._rendered) {
      this._render();
      this._refreshDevCount();
    }
    this._updateHassOnChildren();
  }

  _updateHassOnChildren() {
    if (!this.shadowRoot || !this._hass) { return; }
    const ep = this.shadowRoot.getElementById("entity-picker") as (HTMLElement & Record<string, unknown>) | null;
    if (!ep) { return; }
    this._suppressEntityChange = true;
    ep.hass = this._hass;
    ep.value = this._entities;
    setTimeout(() => { this._suppressEntityChange = false; }, 100);
  }

  _render() {
    this._rendered = true;
    const cfg = this._config;
    this.shadowRoot!.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; }
        .card-header {
          font-size: 1.1em; font-weight: 500; margin-bottom: 16px;
          color: var(--primary-text-color);
        }
        .section-title {
          font-size: 0.8em; font-weight: 600; text-transform: uppercase;
          color: var(--secondary-text-color); letter-spacing: 0.06em;
          margin: 0 0 10px;
        }
        ha-selector { display: block; width: 100%; }
        .form-group { margin-bottom: 12px; }
        .feedback {
          font-size: 0.82em; margin-top: 8px; padding: 6px 10px;
          border-radius: 6px; display: none;
        }
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
        .windows-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .windows-sub { font-size: 0.82em; color: var(--secondary-text-color); }
        .add-window-btn {
          font-size: 0.8em; color: var(--primary-color);
          border: 1px solid var(--primary-color); border-radius: 14px;
          background: none; cursor: pointer; padding: 3px 10px; font: inherit;
        }
        .add-window-btn:hover { background: rgba(var(--rgb-primary-color,3,169,244), 0.1); }
        .window-row {
          display: flex; align-items: flex-start; gap: 8px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          border-radius: 8px; padding: 10px 10px 10px 12px; margin-bottom: 6px;
        }
        .window-fields { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; }
        .w-label-wrap { flex: 1.2; min-width: 90px; }
        .w-start-wrap { flex: 1.8; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
        .w-start-label { font-size: 0.72em; color: var(--secondary-text-color); padding-left: 2px; }
        .w-start {
          padding: 9px 10px; border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px; background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font: inherit; font-size: 0.85em;
          width: 100%; box-sizing: border-box; height: 40px;
        }
        .w-hours-wrap { flex: 0 0 74px; }
        .w-hours {
          padding: 9px 8px; width: 100%; box-sizing: border-box; height: 40px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px; background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font: inherit; font-size: 0.85em;
        }
        .w-label-native {
          padding: 9px 10px; width: 100%; box-sizing: border-box; height: 40px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px; background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font: inherit; font-size: 0.85em;
        }
        .w-label-native::placeholder { color: var(--secondary-text-color); }
        .w-field-label { font-size: 0.72em; color: var(--secondary-text-color); padding-left: 2px; margin-bottom: 3px; }
        .remove-window-btn {
          flex-shrink: 0; align-self: center; border: none; background: none;
          cursor: pointer; color: var(--secondary-text-color); padding: 6px;
          border-radius: 50%; line-height: 0;
        }
        .remove-window-btn:hover { color: var(--error-color, #f44336); background: rgba(244,67,54,0.1); }
        .remove-window-btn[disabled] { opacity: 0.25; pointer-events: none; }
        .remove-window-btn ha-icon { --mdc-icon-size: 18px; }
        .analyze-row { margin-top: 14px; display: flex; align-items: center; gap: 10px; }
        .results-section { margin-top: 18px; }
        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
        }
        .selected-summary { font-size: 0.84em; color: var(--secondary-text-color); flex: 1; }
        .selected-summary strong { color: var(--primary-text-color); }
        .window-result { margin-bottom: 10px; border-radius: 8px; overflow: hidden; border: 1px solid var(--divider-color, #e0e0e0); }
        .window-result-header {
          display: flex; align-items: center; gap: 8px; padding: 9px 12px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          cursor: pointer; user-select: none;
        }
        .window-result-toggle { font-size: 0.7em; color: var(--secondary-text-color); flex-shrink: 0; }
        .window-result.collapsed .window-result-toggle { transform: rotate(-90deg); }
        .window-result-title { flex: 1; font-size: 0.88em; font-weight: 600; color: var(--primary-text-color); }
        .window-result-meta { font-weight: 400; font-size: 0.88em; color: var(--secondary-text-color); }
        .window-result-links { display: flex; gap: 10px; flex-shrink: 0; }
        .window-link {
          font-size: 0.78em; color: var(--primary-color);
          cursor: pointer; border: none; background: none; padding: 0; font: inherit;
        }
        .window-result-body { display: block; }
        .window-result.collapsed .window-result-body { display: none; }
        .changes-list { max-height: 260px; overflow-y: auto; }
        .change-item {
          display: flex; align-items: flex-start; gap: 10px; padding: 7px 12px;
          border-top: 1px solid var(--divider-color, #e0e0e0); cursor: pointer;
        }
        .change-item:hover { background: var(--secondary-background-color, rgba(0,0,0,0.04)); }
        .change-item input[type=checkbox] { margin-top: 3px; flex-shrink: 0; cursor: pointer; }
        .change-info { flex: 1; min-width: 0; }
        .change-msg { font-size: 0.88em; font-weight: 500; color: var(--primary-text-color); }
        .change-meta { font-size: 0.76em; color: var(--secondary-text-color); margin-top: 1px; }
        .empty-changes { padding: 16px 12px; font-size: 0.84em; color: var(--secondary-text-color); }
        .divider { border: none; border-top: 1px solid var(--divider-color, #e0e0e0); margin: 20px 0; }
        .dev-summary {
          display: flex; align-items: center; padding: 10px 14px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          border-radius: 8px; margin-bottom: 10px;
        }
        .dev-count-label { font-size: 0.88em; color: var(--primary-text-color); }
        .dev-count-num { font-weight: 600; color: var(--primary-color); }
        .delete-btn { --mdc-theme-primary: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${cfg.title ? `<div class="card-header">${esc(cfg.title)}</div>` : ""}
        <div class="section-title">Analyze HA History</div>
        <div class="form-group">
          <ha-selector id="entity-picker" label="Entities to analyze"></ha-selector>
        </div>
        <div class="windows-header">
          <span class="windows-sub">Comparison windows</span>
          <button class="add-window-btn" id="add-window-btn">+ Add window</button>
        </div>
        <div id="windows-list"></div>
        <div class="analyze-row">
          <ha-button id="analyze-btn" class="analyze-btn" raised>Analyze all windows</ha-button>
        </div>
        <div id="analyze-status" class="feedback"></div>
        <div id="results-container"></div>
        <hr class="divider">
        <div class="dev-section">
          <div class="section-title">Dev Datapoints</div>
          <div class="dev-summary">
            <span class="dev-count-label">Currently recorded:&nbsp;<span class="dev-count-num" id="dev-count">\u2014</span>&nbsp;dev data point<span id="dev-count-plural">s</span></span>
          </div>
          <ha-button class="delete-btn" id="delete-dev-btn">Delete all dev datapoints</ha-button>
          <div id="delete-status" class="feedback"></div>
        </div>
      </ha-card>
    `;
    // Entity picker
    const ep = this.shadowRoot!.getElementById("entity-picker") as (HTMLElement & Record<string, unknown>) | null;
    if (ep) {
      ep.selector = { entity: { multiple: true } };
      ep.value = [];
      this._entities = [];
      this._suppressEntityChange = false;
      ep.addEventListener("value-changed", (e: Event) => {
        if (this._suppressEntityChange) { return; }
        const val = (e as CustomEvent<{ value: unknown }>).detail.value;
        this._entities = Array.isArray(val) ? (val as string[]) : (val ? [val as string] : []);
      });
    }
    this._addWindowRow();
    this.shadowRoot!.getElementById("add-window-btn")!.addEventListener("click", () => this._addWindowRow());
    this.shadowRoot!.getElementById("analyze-btn")!.addEventListener("click", () => this._analyzeHistory());
    this.shadowRoot!.getElementById("delete-dev-btn")!.addEventListener("click", () => this._deleteAllDev());
  }

  _addWindowRow() {
    const id = this._nextWindowId++;
    const container = this.shadowRoot!.getElementById("windows-list")!;
    const totalRows = container.querySelectorAll(".window-row").length;
    const row = document.createElement("div");
    row.className = "window-row";
    row.dataset.wid = String(id);
    row.innerHTML = `
      <div class="window-fields">
        <div class="w-label-wrap">
          <div class="w-field-label">Label (optional)</div>
          <input class="w-label-native w-label" type="text" placeholder="Window ${totalRows + 1}">
        </div>
        <div class="w-start-wrap">
          <span class="w-start-label">Start date/time (empty\u00a0=\u00a0most recent)</span>
          <input class="w-start" type="datetime-local">
        </div>
        <div class="w-hours-wrap">
          <div class="w-field-label">Hours</div>
          <input class="w-hours" type="number" min="1" max="8760" value="24">
        </div>
      </div>
      <button class="remove-window-btn" type="button" title="Remove this window">
        <ha-icon icon="mdi:close-circle-outline"></ha-icon>
      </button>
    `;
    (row.querySelector(".remove-window-btn") as HTMLButtonElement).addEventListener("click", () => {
      if (this.shadowRoot!.querySelectorAll(".window-row").length > 1) {
        row.remove();
        this._results.delete(id);
        this._syncRemoveButtons();
        if (this._results.size > 0) { this._renderResults(); }
      }
    });
    container.appendChild(row);
    this._syncRemoveButtons();
  }

  _syncRemoveButtons() {
    const rows = this.shadowRoot!.querySelectorAll(".window-row");
    rows.forEach((r) => {
      (r.querySelector(".remove-window-btn") as HTMLButtonElement).disabled = rows.length <= 1;
    });
  }

  _readWindowConfigs(): WindowConfig[] {
    return [...this.shadowRoot!.querySelectorAll(".window-row")].map((row, idx) => {
      const el = row as HTMLElement;
      const wid = parseInt(el.dataset.wid ?? "0");
      const label = ((row.querySelector(".w-label") as HTMLInputElement).value || "").trim() || `Window ${idx + 1}`;
      const startDt = (row.querySelector(".w-start") as HTMLInputElement).value;
      const hours = Math.max(1, parseInt((row.querySelector(".w-hours") as HTMLInputElement).value) || 24);
      return { id: wid, label, startDt, hours };
    });
  }

  async _analyzeHistory() {
    if (!this._entities.length) {
      this._showStatus("analyze-status", "err", "Please select at least one entity.");
      return;
    }
    const windowConfigs = this._readWindowConfigs();
    const btn = this.shadowRoot!.getElementById("analyze-btn") as HTMLButtonElement;
    btn.disabled = true;
    this._results.clear();
    this._showStatus("analyze-status", "ok",
      `Fetching history for ${windowConfigs.length} window${windowConfigs.length !== 1 ? "s" : ""}\u2026`);
    try {
      const now = new Date();
      await Promise.all(windowConfigs.map(async (w) => {
        const start = w.startDt ? new Date(w.startDt) : new Date(now.getTime() - w.hours * 3_600_000);
        const end = w.startDt ? new Date(start.getTime() + w.hours * 3_600_000) : now;
        const raw = await this._hass!.connection.sendMessagePromise({
          type: "history/history_during_period",
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          entity_ids: this._entities,
          include_start_time_state: false,
          significant_changes_only: false,
          no_attributes: false,
        });
        const changes = this._detectChanges((raw as Record<string, unknown>) || {});
        this._results.set(w.id, {
          label: w.label,
          startDt: w.startDt,
          hours: w.hours,
          changes,
          selected: new Set(changes.map((_, i) => i)),
        });
      }));
      this._renderResults();
      this._hideStatus("analyze-status");
    } catch (err) {
      this._showStatus("analyze-status", "err", `Error: ${(err as Error).message || "Failed to fetch history"}`);
      console.error("[hass-datapoints dev-tool]", err);
    }
    btn.disabled = false;
  }

  _detectChanges(histResult: Record<string, unknown>): ChangeItem[] {
    const changes: ChangeItem[] = [];
    for (const [entityId, statesRaw] of Object.entries(histResult)) {
      const states = statesRaw as Array<Record<string, unknown>>;
      if (!states?.length) { continue; }
      const domain = entityId.split(".")[0];
      const entityState = this._hass?.states?.[entityId];
      const deviceClass = (entityState?.attributes?.device_class as string | undefined) || "";
      const friendlyName = (entityState?.attributes?.friendly_name as string | undefined) || entityId;
      const unit = (entityState?.attributes?.unit_of_measurement as string | undefined) || "";
      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        const prev = i > 0 ? states[i - 1] : null;
        const cur = s.s as string;
        const prevVal = (prev?.s as string | undefined) ?? null;
        if (cur === "unavailable" || cur === "unknown") { continue; }
        if (prev && prevVal === cur) {
          if (domain !== "climate") { continue; }
        }
        const tsRaw = (s.lc ?? s.lu) as number | undefined;
        const timestamp = tsRaw != null ? new Date(tsRaw * 1000).toISOString() : new Date().toISOString();
        let message: string | null = null;
        let icon = "mdi:bookmark";
        let color = "#03a9f4";
        if (domain === "binary_sensor" || domain === "input_boolean") {
          message = `${friendlyName}: ${this._binaryLabel(deviceClass, cur)}`;
          icon = cur === "on" ? "mdi:toggle-switch" : "mdi:toggle-switch-off";
          color = cur === "on" ? "#4caf50" : "#9e9e9e";
        } else if (domain === "switch") {
          message = `${friendlyName}: turned ${cur === "on" ? "on" : "off"}`;
          icon = cur === "on" ? "mdi:power-plug" : "mdi:power-plug-off";
          color = cur === "on" ? "#ff9800" : "#9e9e9e";
        } else if (domain === "light") {
          message = `${friendlyName}: ${cur === "on" ? "on" : "off"}`;
          icon = cur === "on" ? "mdi:lightbulb" : "mdi:lightbulb-off";
          color = cur === "on" ? "#ffee58" : "#9e9e9e";
        } else if (domain === "cover") {
          const labels: Record<string, string> = { open: "opened", closed: "closed", opening: "opening", closing: "closing" };
          if (!labels[cur]) { continue; }
          message = `${friendlyName}: ${labels[cur]}`;
          icon = cur === "open" || cur === "opening" ? "mdi:garage-open" : "mdi:garage";
          color = cur === "open" ? "#4caf50" : "#795548";
        } else if (domain === "climate") {
          const sAttrs = s.a as Record<string, unknown> | undefined;
          const prevAttrs = prev?.a as Record<string, unknown> | undefined;
          const curTemp = sAttrs?.temperature;
          const prevTemp = prevAttrs?.temperature;
          if (curTemp != null && curTemp !== prevTemp) {
            const tu = (sAttrs?.temperature_unit as string | undefined) || unit || "\u00b0";
            message = `${friendlyName}: setpoint \u2192 ${curTemp}${tu}`;
            icon = "mdi:thermostat"; color = "#ff5722";
          } else if (!prev || prevVal !== cur) {
            const modes: Record<string, string> = { heat: "heating", cool: "cooling", auto: "auto", off: "off", heat_cool: "heat/cool", fan_only: "fan only", dry: "dry" };
            message = `${friendlyName}: mode \u2192 ${modes[cur] || cur}`;
            icon = "mdi:thermostat"; color = "#ff5722";
          } else { continue; }
        } else if (domain === "sensor") {
          const num = parseFloat(cur);
          const prevNum = prevVal != null ? parseFloat(prevVal) : NaN;
          if (isNaN(num)) { continue; }
          if (!isNaN(prevNum) && Math.abs(num - prevNum) < 0.5) { continue; }
          message = `${friendlyName}: ${cur}${unit}`;
          icon = "mdi:gauge"; color = "#2196f3";
        } else if (domain === "input_number" || domain === "number") {
          const num = parseFloat(cur);
          const prevNum = prevVal != null ? parseFloat(prevVal) : NaN;
          if (isNaN(num) || (!isNaN(prevNum) && num === prevNum)) { continue; }
          message = `${friendlyName}: \u2192 ${cur}${unit}`;
          icon = "mdi:numeric"; color = "#9c27b0";
        } else if (domain === "input_select" || domain === "select") {
          if (!prev || prevVal === cur) { continue; }
          message = `${friendlyName}: \u2192 ${cur}`;
          icon = "mdi:form-select"; color = "#009688";
        } else {
          if (!prev || prevVal === cur) { continue; }
          message = `${friendlyName}: ${prevVal} \u2192 ${cur}`;
          icon = "mdi:swap-horizontal"; color = "#607d8b";
        }
        if (!message) { continue; }
        changes.push({ timestamp, message, entity_id: entityId, icon, color });
      }
    }
    changes.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    return changes;
  }

  _binaryLabel(deviceClass: string, state: string): string {
    const on = state === "on";
    const map: Record<string, [string, string]> = {
      door: ["opened", "closed"], window: ["opened", "closed"],
      garage_door: ["opened", "closed"], opening: ["opened", "closed"],
      lock: ["locked", "unlocked"], motion: ["motion detected", "motion cleared"],
      occupancy: ["occupied", "vacant"], presence: ["home", "away"],
      vibration: ["vibrating", "still"], plug: ["plugged in", "unplugged"],
      outlet: ["on", "off"], smoke: ["smoke detected", "smoke cleared"],
      moisture: ["wet", "dry"], running: ["running", "stopped"],
      connectivity: ["connected", "disconnected"], power: ["on", "off"],
      battery_charging: ["charging", "not charging"], battery: ["low battery", "battery normal"],
      cold: ["cold", "temperature normal"], heat: ["heat", "temperature normal"],
      light: ["light detected", "dark"], sound: ["sound detected", "quiet"],
    };
    const pair = map[deviceClass];
    return pair ? (on ? pair[0] : pair[1]) : (on ? "on" : "off");
  }

  _renderResults() {
    const container = this.shadowRoot!.getElementById("results-container")!;
    const windowOrder = this._readWindowConfigs().map((w) => w.id).filter((id) => this._results.has(id));
    const remainingIds = [...this._results.keys()].filter((id) => !windowOrder.includes(id));
    const orderedIds = [...windowOrder, ...remainingIds];
    const resultRows = orderedIds.map((wid) => {
      const r = this._results.get(wid);
      if (!r) { return ""; }
      const { label, startDt, hours, changes, selected } = r;
      const rangeLabel = startDt
        ? `from ${new Date(startDt).toLocaleString([], { dateStyle: "short", timeStyle: "short" } as Intl.DateTimeFormatOptions)} \u00b7 ${hours}h`
        : `most recent ${hours}h`;
      return `
        <div class="window-result" data-wid="${wid}">
          <div class="window-result-header">
            <span class="window-result-toggle">\u25bc</span>
            <span class="window-result-title">
              ${esc(label)}
              <span class="window-result-meta">${esc(rangeLabel)} \u00b7 ${changes.length} change${changes.length !== 1 ? "s" : ""}</span>
            </span>
            <span class="window-result-links">
              <button class="window-link" data-wid="${wid}" data-act="all">All</button>
              <button class="window-link" data-wid="${wid}" data-act="none">None</button>
            </span>
          </div>
          <div class="window-result-body">
            <div class="changes-list">
              ${changes.length === 0
                ? `<div class="empty-changes">No state changes detected in this window.</div>`
                : changes.map((c, i) => `
                  <label class="change-item">
                    <input type="checkbox" data-wid="${wid}" data-idx="${i}" ${selected.has(i) ? "checked" : ""}>
                    <div class="change-info">
                      <div class="change-msg">${esc(c.message)}</div>
                      <div class="change-meta">${esc(fmtDateTime(c.timestamp))} &middot; ${esc(c.entity_id)}</div>
                    </div>
                  </label>`).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");
    container.innerHTML = `
      <div class="results-section">
        <div class="results-bar">
          <span class="selected-summary" id="selected-summary"></span>
          <ha-button id="record-btn" raised>Record selected as dev datapoints</ha-button>
        </div>
        <div id="results-list">${resultRows}</div>
        <div id="record-status" class="feedback"></div>
      </div>
    `;
    const resultsList = container.querySelector("#results-list")!;
    resultsList.querySelectorAll(".window-result-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest(".window-result-links")) { return; }
        header.closest(".window-result")!.classList.toggle("collapsed");
      });
    });
    resultsList.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const input = e.target as HTMLInputElement;
        const wid = parseInt(input.dataset.wid ?? "0");
        const idx = parseInt(input.dataset.idx ?? "0");
        const r = this._results.get(wid);
        if (!r) { return; }
        if (input.checked) { r.selected.add(idx); } else { r.selected.delete(idx); }
        this._updateSelectedSummary();
      });
    });
    resultsList.querySelectorAll(".window-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLButtonElement;
        const wid = parseInt(el.dataset.wid ?? "0");
        const act = el.dataset.act;
        const r = this._results.get(wid);
        if (!r) { return; }
        const cbs = resultsList.querySelectorAll<HTMLInputElement>(`input[data-wid="${wid}"]`);
        if (act === "all") {
          r.selected = new Set(r.changes.map((_, i) => i));
          cbs.forEach((cb) => { cb.checked = true; });
        } else {
          r.selected.clear();
          cbs.forEach((cb) => { cb.checked = false; });
        }
        this._updateSelectedSummary();
      });
    });
    container.querySelector("#record-btn")!.addEventListener("click", () => this._recordSelected());
    this._updateSelectedSummary();
  }

  _updateSelectedSummary() {
    let sel = 0;
    let total = 0;
    this._results.forEach((r) => { sel += r.selected.size; total += r.changes.length; });
    const el = this.shadowRoot!.getElementById("selected-summary");
    if (el) {
      const wn = this._results.size;
      el.innerHTML = `<strong>${sel}</strong> of ${total} selected across ${wn} window${wn !== 1 ? "s" : ""}`;
    }
  }

  async _recordSelected() {
    const allItems: ChangeItem[] = [];
    this._results.forEach((r) => {
      [...r.selected].sort((a, b) => a - b).forEach((i) => allItems.push(r.changes[i]));
    });
    if (!allItems.length) {
      this._showStatus("record-status", "err", "No items selected.");
      return;
    }
    const btn = this.shadowRoot!.getElementById("record-btn") as HTMLButtonElement;
    btn.disabled = true;
    this._showStatus("record-status", "ok", `Recording ${allItems.length} data point${allItems.length !== 1 ? "s" : ""}\u2026`);
    let ok = 0;
    let fail = 0;
    for (const item of allItems) {
      try {
        await this._hass!.callService(DOMAIN as string, "record", {
          message: item.message,
          entity_ids: [item.entity_id],
          icon: item.icon,
          color: item.color,
          date: item.timestamp,
          dev: true,
        });
        ok++;
      } catch { fail++; }
    }
    if (fail) {
      this._showStatus("record-status", "err", `Recorded ${ok}, failed ${fail}.`);
    } else {
      this._showStatus("record-status", "ok", `Recorded ${ok} dev data point${ok !== 1 ? "s" : ""}!`);
    }
    btn.disabled = false;
    await this._refreshDevCount();
    window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
  }

  async _deleteAllDev() {
    const devCountEl = this.shadowRoot!.getElementById("dev-count");
    const count = parseInt(devCountEl?.textContent ?? "0") || 0;
    if (count === 0) {
      this._showStatus("delete-status", "err", "No dev datapoints to delete.");
      return;
    }
    const confirmed = await confirmDestructiveAction(this, {
      title: "Delete dev datapoints",
      message: `Delete all ${count} dev data point${count !== 1 ? "s" : ""}?`,
      confirmLabel: "Delete all",
    });
    if (!confirmed) { return; }
    const btn = this.shadowRoot!.getElementById("delete-dev-btn") as HTMLButtonElement;
    btn.disabled = true;
    try {
      const result = await this._hass!.connection.sendMessagePromise({ type: `${DOMAIN}/events/delete_dev` }) as Record<string, unknown>;
      const deleted = result.deleted as number;
      this._showStatus("delete-status", "ok", `Deleted ${deleted} dev data point${deleted !== 1 ? "s" : ""}.`);
      await this._refreshDevCount();
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    } catch (err) {
      this._showStatus("delete-status", "err", `Error: ${(err as Error).message || "failed"}`);
    }
    btn.disabled = false;
  }

  async _refreshDevCount() {
    try {
      const result = await this._hass!.connection.sendMessagePromise({ type: `${DOMAIN}/events` }) as Record<string, unknown>;
      const events = (result.events as Array<Record<string, unknown>>) || [];
      const n = events.filter((e) => e.dev).length;
      const el = this.shadowRoot!.getElementById("dev-count");
      const pl = this.shadowRoot!.getElementById("dev-count-plural");
      if (el) { el.textContent = String(n); }
      if (pl) { pl.textContent = n === 1 ? "" : "s"; }
    } catch { /* ignore */ }
  }

  _showStatus(id: string, cls: "ok" | "err", msg: string) {
    const el = this.shadowRoot!.getElementById(id);
    if (!el) { return; }
    el.className = `feedback ${cls}`;
    el.textContent = msg;
    el.style.display = "block";
  }

  _hideStatus(id: string) {
    const el = this.shadowRoot!.getElementById(id);
    if (el) { el.style.display = "none"; }
  }

  static getStubConfig() {
    return { title: "Dev Tool" };
  }
}
