/**
 * hass-datapoints-history-panel – Sidebar panel for annotated history exploration.
 */

const PANEL_HISTORY_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
  }

  .page {
    min-height: 100%;
    box-sizing: border-box;
    padding: 16px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-title {
    margin: 0;
    font-size: 1.75rem;
    line-height: 1.2;
    font-weight: 400;
  }

  .controls-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .control-target {
    min-width: min(520px, 100%);
    flex: 1 1 520px;
  }

  .control-date {
    flex: 0 1 420px;
    min-width: min(320px, 100%);
  }

  .chart-host,
  .list-host {
    width: 100%;
  }

  .list-host ha-card,
  .chart-host ha-card {
    width: 100%;
  }

  .empty {
    padding: 32px 20px;
    text-align: center;
    color: var(--secondary-text-color);
  }

  @media (max-width: 900px) {
    .page {
      padding: 16px;
    }

    .controls-grid,
    .content {
      gap: 12px;
    }
  }
`;

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeEntityIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function extractEntityIds(targetValue) {
  if (!targetValue) return [];
  if (Array.isArray(targetValue)) return targetValue.filter(Boolean);
  if (typeof targetValue === "string") return targetValue ? [targetValue] : [];
  return [
    ...normalizeEntityIds(targetValue.entity_id),
    ...normalizeEntityIds(targetValue.entity_ids),
    ...normalizeEntityIds(targetValue.entity),
    ...normalizeEntityIds(targetValue.entities),
  ];
}

function buildTargetValue(entityIds) {
  return entityIds?.length ? { entity_id: entityIds } : {};
}

function extractRangeValue(source) {
  if (!source) return { start: null, end: null };
  const detail = source.detail || {};
  const value = detail.value || source.target?.value || {};
  return {
    start: parseDateValue(detail.startDate || value.startDate || source.target?.startDate),
    end: parseDateValue(detail.endDate || value.endDate || source.target?.endDate),
  };
}

class HassRecordsHistoryPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    this._entities = [];
    this._hours = 24;
    this._startTime = null;
    this._endTime = null;
    this._panel = null;
    this._narrow = false;
    this._contentKey = "";
    this._chartEl = null;
    this._listEl = null;
    this._targetControl = null;
    this._dateControl = null;
    this._onPopState = () => {
      this._initFromContext();
      if (this._rendered) {
        this._syncControls();
        this._renderContent();
      }
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._rendered = true;
      this._initFromContext();
      this._buildShell();
    }
    this._syncControls();
    this._renderContent();
  }

  set panel(panel) {
    this._panel = panel;
    this._initFromContext();
    if (this._rendered) {
      this._syncControls();
      this._renderContent();
    }
  }

  set narrow(value) {
    this._narrow = value;
  }

  connectedCallback() {
    window.addEventListener("popstate", this._onPopState);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this._onPopState);
  }

  _initFromContext() {
    const url = new URL(window.location.href);
    const entityFromUrl = url.searchParams.get("entity_id");
    const startFromUrl = url.searchParams.get("start_time");
    const endFromUrl = url.searchParams.get("end_time");
    const hoursFromUrl = Number.parseInt(url.searchParams.get("hours_to_show") || "", 10);
    const panelCfg = this._panel?.config || {};
    const entitiesFromUrl = entityFromUrl
      ? entityFromUrl.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    const panelEntities = panelCfg.entities
      ? panelCfg.entities.map((item) => typeof item === "string" ? item : item.entity).filter(Boolean)
      : panelCfg.entity
        ? [panelCfg.entity]
        : [];
    const nextEntities = entitiesFromUrl.length ? entitiesFromUrl : panelEntities;
    if (nextEntities.length) {
      this._entities = [...new Set(nextEntities)];
    } else {
      this._entities = [];
    }

    const start = parseDateValue(startFromUrl) || parseDateValue(panelCfg.start_time);
    const end = parseDateValue(endFromUrl) || parseDateValue(panelCfg.end_time);
    if (start && end && start < end) {
      this._startTime = start;
      this._endTime = end;
      this._hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
      return;
    }

    if (Number.isFinite(hoursFromUrl) && hoursFromUrl > 0) {
      this._hours = hoursFromUrl;
    } else if (panelCfg.hours_to_show) {
      this._hours = panelCfg.hours_to_show;
    }
    this._endTime = new Date();
    this._startTime = new Date(this._endTime.getTime() - this._hours * 3600000);
  }

  _buildShell() {
    this.shadowRoot.innerHTML = `
      <style>${PANEL_HISTORY_STYLE}</style>
      <div class="page">
        <h1 class="page-title">History</h1>
        <div class="controls-grid">
          <div id="target-slot" class="control-target"></div>
          <div id="date-slot" class="control-date"></div>
        </div>

        <div class="content" id="content"></div>
      </div>
    `;
    this._mountControls();
  }

  _syncControls() {
    if (this._targetControl) {
      if (this._hass) this._targetControl.hass = this._hass;
      this._targetControl.value = buildTargetValue(this._entities);
    }
    if (this._dateControl) {
      if (this._hass) this._dateControl.hass = this._hass;
      this._dateControl.startDate = this._startTime;
      this._dateControl.endDate = this._endTime;
      this._dateControl.value = {
        startDate: this._startTime,
        endDate: this._endTime,
      };
    }
  }

  _mountControls() {
    const targetSlot = this.shadowRoot.getElementById("target-slot");
    const dateSlot = this.shadowRoot.getElementById("date-slot");
    if (!targetSlot || !dateSlot) return;

    targetSlot.innerHTML = "";
    dateSlot.innerHTML = "";

    const targetControl = customElements.get("ha-target-picker")
      ? document.createElement("ha-target-picker")
      : document.createElement("ha-selector");
    targetControl.style.display = "block";
    targetControl.style.width = "100%";
    if (targetControl.tagName === "HA-SELECTOR") {
      targetControl.selector = { target: {} };
      targetControl.label = "Targets";
    } else {
      targetControl.label = "Targets";
    }
    if (this._hass) targetControl.hass = this._hass;
    targetControl.addEventListener("value-changed", (ev) => {
      const hasValue = ev.detail && Object.prototype.hasOwnProperty.call(ev.detail, "value");
      const rawValue = hasValue ? ev.detail.value : ev.target?.value;
      const nextEntities = [...new Set(extractEntityIds(rawValue))];
      this._entities = nextEntities;
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    });
    targetSlot.appendChild(targetControl);
    this._targetControl = targetControl;

    const handleDateChange = (ev) => {
      const { start, end } = extractRangeValue(ev);
      if (!start || !end || start >= end) return;
      this._startTime = start;
      this._endTime = end;
      this._hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    };

    const dateControl = document.createElement("ha-date-range-picker");
    dateControl.style.display = "block";
    dateControl.style.width = "100%";
    if (this._hass) dateControl.hass = this._hass;
    dateControl.addEventListener("change", handleDateChange);
    dateControl.addEventListener("value-changed", handleDateChange);
    dateSlot.appendChild(dateControl);
    this._dateControl = dateControl;

    this._syncControls();
  }

  _updateUrl({ push = false } = {}) {
    const url = new URL(window.location.href);
    if (this._entities.length) url.searchParams.set("entity_id", this._entities.join(","));
    else url.searchParams.delete("entity_id");
    if (this._startTime && this._endTime) {
      url.searchParams.set("start_time", this._startTime.toISOString());
      url.searchParams.set("end_time", this._endTime.toISOString());
      url.searchParams.set("hours_to_show", String(this._hours));
    } else {
      url.searchParams.delete("start_time");
      url.searchParams.delete("end_time");
      url.searchParams.delete("hours_to_show");
    }
    const nextUrl = `${url.pathname}${url.search}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl === currentUrl) return;
    if (push) window.history.pushState(null, "", nextUrl);
    else window.history.replaceState(null, "", nextUrl);
  }

  _renderContent() {
    const content = this.shadowRoot.getElementById("content");
    if (!content) return;

    if (!this._entities.length) {
      content.innerHTML = `
        <ha-card class="empty">
          Select one or more entities to inspect annotated history.
        </ha-card>
      `;
      this._contentKey = "";
      this._chartEl = null;
      this._listEl = null;
      return;
    }

    const contentKey = JSON.stringify({
      entities: this._entities,
      start: this._startTime?.toISOString() || null,
      end: this._endTime?.toISOString() || null,
      hours: this._hours,
    });

    if (this._contentKey !== contentKey || !this._chartEl || !this._listEl) {
      content.innerHTML = `
        <div id="chart-host" class="chart-host"></div>
        <div id="list-host" class="list-host"></div>
      `;

      const chart = document.createElement("hass-datapoints-history-card");
      chart.setConfig({
        entities: this._entities,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
      });

      const list = document.createElement("hass-datapoints-list-card");
      list.setConfig({
        entities: this._entities,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
        page_size: 15,
        show_entities: true,
        show_actions: true,
        show_search: true,
      });

      content.querySelector("#chart-host").appendChild(chart);
      content.querySelector("#list-host").appendChild(list);
      this._chartEl = chart;
      this._listEl = list;
      this._contentKey = contentKey;
    }

    if (this._chartEl) this._chartEl.hass = this._hass;
    if (this._listEl) this._listEl.hass = this._hass;
  }
}
