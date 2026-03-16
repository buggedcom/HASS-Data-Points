/**
 * hass-records-sensor-card – Sensor card with inline annotation icons on the data line.
 * Layout mirrors the standard HA sensor card:
 *   row 1 – name (left)  +  ha-state-icon (right)
 *   row 2 – numeric value  +  unit
 *   row 3 – graph with annotation icon overlays
 *   row 4 – (optional) paginated annotation list
 */

const SENSOR_STYLE = `
  :host { display: block; height: 100%; }
  ha-card {
    padding: 0;
    overflow: hidden;
    height: 100%;
  }

  .card-shell {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: calc(
      (var(--hr-body-rows, var(--row-size, 1)) * (var(--row-height, 1px) + var(--row-gap, 0px)))
      - var(--row-gap, 0px)
    );
    min-height: 0;
    position: relative;
  }

  /* Mirrors the default HA sensor card structure */
  .header {
    padding: 8px 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .name {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    line-height: 40px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--state-icon-color, var(--secondary-text-color));
  }
  .icon ha-state-icon {
    --mdc-icon-size: 24px;
  }

  .info {
    display: flex;
    align-items: baseline;
    padding: 0px 16px 16px;
    margin-top: -4px;
    line-height: var(--ha-line-height-condensed);
  }
  .value {
    font-size: var(--ha-font-size-3xl);
    font-weight: var(--ha-font-size-3xl);
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--primary-text-color);
  }
  .measurement {
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
  }

  .chart-wrap {
    position: relative;
    height: 100%;
    padding: 0;
    box-sizing: border-box;
    overflow: visible;
    min-height: 78px;
  }
  .chart-viewport {
    position: relative;
    height: 100%;
    overflow: hidden;
  }
  canvas { display: block; }
  .icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Annotation icon circles – border adapts to colour scheme */
  .ann-icon {
    position: absolute;
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    cursor: pointer;
    /* Use the card background so the ring blends with the theme */
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }
  @media (prefers-color-scheme: dark) {
    .ann-icon {
      box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1e);
    }
  }
  .ann-icon ha-icon {
    --mdc-icon-size: 12px;
    /* icon color set imperatively via contrastColor() */
  }
  .loading {
    text-align: center;
    padding: 28px 16px 24px;
    color: var(--secondary-text-color);
  }
  .tooltip {
    position: fixed;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8em;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: none;
    display: none;
    max-width: 220px;
    z-index: 10;
    color: var(--primary-text-color);
  }
  .tt-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
  }
  .tt-time { color: var(--secondary-text-color); margin-bottom: 3px; }
  .tt-value { color: var(--secondary-text-color); margin-bottom: 4px; }
  .tt-message { font-weight: 500; }
  .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
  .tt-entities { color: var(--secondary-text-color); margin-top: 6px; white-space: pre-wrap; }

  /* ── Row 4: Annotation list (optional) ── */
  .ann-section {
    border-top: 1px solid var(--divider-color, #eee);
    display: none;
    flex: 1 1 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .ann-list {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }
  .ann-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
    cursor: default;
  }
  .ann-item:last-child { border-bottom: none; }
  .ann-item.expandable { cursor: pointer; }

  /* Coloured icon circle – replaces the plain dot */
  .ann-icon-wrap {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }
  @media (prefers-color-scheme: dark) {
    .ann-icon-wrap { box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1e); }
  }
  .ann-icon-main {
    transition: opacity 120ms ease;
  }
  .ann-visibility-btn {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
    color: var(--primary-text-color);
    cursor: pointer;
    opacity: 0;
    transition: opacity 120ms ease;
    padding: 0;
    font: inherit;
  }
  .ann-visibility-btn ha-icon {
    --mdc-icon-size: 15px;
  }
  .ann-item:hover .ann-visibility-btn,
  .ann-item.is-hidden .ann-visibility-btn,
  .ann-visibility-btn:focus-visible {
    opacity: 1;
  }
  .ann-item:hover .ann-icon-main,
  .ann-item.is-hidden .ann-icon-main {
    opacity: 0.22;
  }

  .ann-body { flex: 1; min-width: 0; }
  .ann-header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: nowrap;
  }
  .ann-msg {
    font-size: 0.85em;
    font-weight: 500;
    color: var(--primary-text-color);
    word-break: break-word;
    flex: 1;
    min-width: 0;
  }
  .ann-time {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ann-time-wrap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .ann-history-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: var(--secondary-text-color);
    padding: 0;
    cursor: pointer;
  }
  .ann-history-btn ha-icon { --mdc-icon-size: 14px; }
  .ann-note {
    font-size: 0.78em;
    color: var(--secondary-text-color);
    margin-top: 2px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .ann-note.hidden { display: none; }

  /* "..." expand chip shown when annotation is hidden */
  .ann-expand-chip {
    display: inline-flex;
    align-items: center;
    margin-top: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--secondary-text-color);
    background: var(--secondary-background-color, rgba(0,0,0,0.06));
    border: none;
    cursor: pointer;
    font-family: inherit;
  }
  .ann-expand-chip:hover { background: var(--divider-color, rgba(0,0,0,0.12)); }

  /* Pagination bar – sits outside the scroll area */
  .ann-pagination {
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-top: 1px solid var(--divider-color, #eee);
    font-size: 0.8em;
    color: var(--secondary-text-color);
  }
  .ann-empty {
    text-align: center;
    padding: 16px;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }
`;

class HassRecordsSensorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    this._unsubscribe = null;
    this._resizeObserver = null;
    this._lastHistResult = null;
    this._lastEvents = null;
    this._lastT0 = null;
    this._lastT1 = null;
    this._annPage = 0;
    this._hiddenEventIds = new Set();
    this._canvasClickHandler = null;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("hass-records-sensor-card: `entity` is required");
    }
    this._config = {
      hours_to_show: 24,
      annotation_style: "circle",
      show_records: false,
      records_page_size: null,
      records_limit: null,       // max number of records to show (null = all)
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._rendered = true;
      this._buildShell();
      this._setupAutoRefresh();
      this._setupResizeObserver();
      this._load();
    }
    this._updateState();
  }

  disconnectedCallback() {
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
  }

  _buildShell() {
    const cfg = this._config;
    this.shadowRoot.innerHTML = `
      <style>${SENSOR_STYLE}</style>
      <ha-card class=" with-fixed-footer action">
        <div class="card-shell">
          <div class="card-body">
            <div class="header">
              <div class="name" id="sensor-name">${esc(cfg.name || cfg.entity)}</div>
              <div class="icon">
                <ha-state-icon id="sensor-state-icon"></ha-state-icon>
              </div>
            </div>
  
            <div class="info">
              <span class="value" id="sensor-value">—</span>
              <span class="measurement" id="sensor-unit"></span>
            </div>
  
            <div class="footer">
              <div class="chart-wrap">
                <div class="chart-viewport">
                  <div class="loading" id="loading">Loading…</div>
                  <canvas id="chart" style="display:none"></canvas>
                  <div class="icon-overlay" id="icon-overlay"></div>
                </div>
                <div class="tooltip" id="tooltip">
                  <div class="tt-time" id="tt-time"></div>
                <div class="tt-value" id="tt-value" style="display:none"></div>
                <div style="display:flex;align-items:flex-start;gap:4px">
                  <span class="tt-dot" id="tt-dot"></span>
                  <span class="tt-message" id="tt-message"></span>
                </div>
                <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
                <div class="tt-entities" id="tt-entities" style="display:none"></div>
              </div>
            </div>
            </div>
          </div>
          <div class="ann-section" id="ann-section">
            <div class="ann-list" id="ann-list"></div>
            <div class="ann-pagination" id="ann-pagination" style="display:none">
              <ha-icon-button id="ann-prev" label="Previous page">
                <ha-icon icon="mdi:chevron-left"></ha-icon>
              </ha-icon-button>
              <span id="ann-page-info"></span>
              <ha-icon-button id="ann-next" label="Next page">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </ha-icon-button>
            </div>
          </div>
        </div>
      </ha-card>`;
    this._applyLayoutSizing();

    // Pagination button wiring
    this.shadowRoot.getElementById("ann-prev").addEventListener("click", () => {
      if (this._annPage > 0) { this._annPage--; this._renderAnnList(this._lastEvents || []); this.shadowRoot.getElementById("ann-list").scrollTop = 0; }
    });
    this.shadowRoot.getElementById("ann-next").addEventListener("click", () => {
      const total = (this._lastEvents || []).length;
      const pageSize = this._config.records_page_size;
      const pages = pageSize ? Math.ceil(total / pageSize) : 1;
      if (this._annPage < pages - 1) { this._annPage++; this._renderAnnList(this._lastEvents || []); this.shadowRoot.getElementById("ann-list").scrollTop = 0; }
    });
  }

  _updateState() {
    if (!this._hass || !this._config) return;
    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];

    const nameEl = this.shadowRoot.getElementById("sensor-name");
    const valueEl = this.shadowRoot.getElementById("sensor-value");
    const unitEl = this.shadowRoot.getElementById("sensor-unit");
    const stateIconEl = this.shadowRoot.getElementById("sensor-state-icon");

    if (nameEl) {
      nameEl.textContent = this._config.name ||
        (stateObj && stateObj.attributes && stateObj.attributes.friendly_name) ||
        entityId;
    }

    if (!stateObj) return;

    if (valueEl) valueEl.textContent = stateObj.state;
    if (unitEl) unitEl.textContent = stateObj.attributes.unit_of_measurement || "";

    if (stateIconEl) {
      stateIconEl.stateObj = stateObj;
      stateIconEl.hass = this._hass;
    }
  }

  _setupAutoRefresh() {
    this._hass.connection.subscribeEvents(() => {
      this._load();
    }, `${DOMAIN}_event_recorded`).then((unsub) => {
      this._unsubscribe = unsub;
    }).catch(() => {});
  }

  _setupResizeObserver() {
    if (!window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      this._applyLayoutSizing();
      if (this._lastHistResult !== null) {
        this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0, this._lastT1);
      }
    });
    this._resizeObserver.observe(this);
  }

  _gridRows() {
    const raw = getComputedStyle(this).getPropertyValue("--row-size").trim();
    const rows = Number.parseInt(raw, 10);
    if (Number.isFinite(rows) && rows > 0) return rows;
    return this._config?.show_records ? 3 : 2;
  }

  _bodyRows(totalRows) {
    if (!this._config?.show_records) return totalRows;
    return Math.min(totalRows - 1, 2 + Math.floor(Math.max(0, totalRows - 3) / 4));
  }

  _visibleEvents(events) {
    return (events || []).filter((ev) => !this._hiddenEventIds.has(ev.id));
  }

  _toggleEventVisibility(eventId) {
    if (this._hiddenEventIds.has(eventId)) this._hiddenEventIds.delete(eventId);
    else this._hiddenEventIds.add(eventId);

    if (this._lastHistResult !== null) {
      this._drawChart(this._lastHistResult, this._lastEvents || [], this._lastT0, this._lastT1);
    } else {
      this._renderAnnList(this._lastEvents || []);
    }
  }

  _navigateToEventHistory(ev) {
    const entityIds = [
      this._config?.entity,
      ...((ev && ev.entity_ids) || []),
    ];
    navigateToHistory(this, entityIds);
  }

  _applyLayoutSizing() {
    const body = this.shadowRoot?.querySelector(".card-body");
    const list = this.shadowRoot?.querySelector(".ann-list");
    if (!body) return;

    if (!this._config?.show_records) {
      body.style.setProperty("--hr-body-rows", String(this._gridRows()));
      if (list) list.style.setProperty("--hr-list-rows", "1");
      return;
    }

    const totalRows = Math.max(3, this._gridRows());
    const bodyRows = Math.max(2, this._bodyRows(totalRows));
    const listRows = Math.max(1, totalRows - bodyRows);
    body.style.setProperty("--hr-body-rows", String(bodyRows));
    if (list) list.style.setProperty("--hr-list-rows", String(listRows));
  }

  _bodyHeightPx() {
    const styles = getComputedStyle(this);
    const rowHeight = Number.parseFloat(styles.getPropertyValue("--row-height")) || 0;
    const rowGap = Number.parseFloat(styles.getPropertyValue("--row-gap")) || 0;
    const totalRows = Math.max(this._config?.show_records ? 3 : 2, this._gridRows());
    const bodyRows = this._config?.show_records ? Math.max(2, this._bodyRows(totalRows)) : totalRows;
    return Math.max(0, (bodyRows * (rowHeight + rowGap)) - rowGap);
  }

  async _load() {
    const now = new Date();
    const start = new Date(now - this._config.hours_to_show * 3600 * 1000);
    const t0 = start.getTime();
    const t1 = now.getTime();
    const entityIds = [this._config.entity];

    try {
      const [histResult, events] = await Promise.all([
        this._hass.connection.sendMessagePromise({
          type: "history/history_during_period",
          start_time: start.toISOString(),
          end_time: now.toISOString(),
          entity_ids: entityIds,
          include_start_time_state: true,
          significant_changes_only: false,
          no_attributes: true,
        }),
        fetchEvents(this._hass, start.toISOString(), now.toISOString(), entityIds),
      ]);

      this._annPage = 0;
      this._drawChart(histResult || {}, events, t0, t1);
    } catch (err) {
      const loadEl = this.shadowRoot.getElementById("loading");
      if (loadEl) loadEl.textContent = "Failed to load data.";
      console.error("[hass-records sensor-card]", err);
    }
  }

  _drawChart(histResult, events, t0, t1) {
    this._lastHistResult = histResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;

    const canvas = this.shadowRoot.getElementById("chart");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    const header = this.shadowRoot.querySelector(".header");
    const info = this.shadowRoot.querySelector(".info");
    const footer = this.shadowRoot.querySelector(".footer");
    const footerStyles = footer ? getComputedStyle(footer) : null;
    const reservedHeight =
      (header?.offsetHeight || 0) +
      (info?.offsetHeight || 0) +
      (Number.parseFloat(footerStyles?.marginTop || "0") || 0);
    const bodyHeight = this._bodyHeightPx();
    const chartHeight = Math.max(78, Math.round(bodyHeight - reservedHeight), wrap?.clientHeight || 0);
    const { w, h } = setupCanvas(canvas, wrap, chartHeight);
    const renderer = new ChartRenderer(canvas, w, h);
    const topPadPx = Math.max(6, Math.round(h * 0.05));
    renderer.pad = { top: topPadPx, right: 0, bottom: 0, left: 0 };
    renderer.clear();

    const series = [];
    let allVals = [];
    const entityId = this._config.entity;
    const lineColor = this._config.graph_color || COLORS[0];
    const unit = (this._hass?.states?.[entityId]?.attributes?.unit_of_measurement) || "";

    const stateList = histResult[entityId] || [];
    const pts = [];
    for (const s of stateList) {
      const v = parseFloat(s.s);
      if (!isNaN(v)) {
        pts.push([Math.round(s.lu * 1000), v]);
        allVals.push(v);
      }
    }
    if (pts.length) {
      series.push({ entityId, pts, color: lineColor });
    }

    if (!allVals.length) {
      const loadEl = this.shadowRoot.getElementById("loading");
      if (loadEl) loadEl.textContent = "No numeric data in the selected time range.";
      return;
    }

    this.shadowRoot.getElementById("loading").style.display = "none";
    canvas.style.display = "block";

    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const range = vMax - vMin;
    const topPad = range * 0.14 || 0.8;
    const bottomPad = range * 0.03 || 0.2;
    const chartMin = vMin - bottomPad;
    const chartMax = vMax + topPad;

    for (const s of series) {
      renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax);
    }

    const visibleEvents = this._visibleEvents(events);
    const annotationStyle = this._config.annotation_style === "line" ? "line" : "circle";
    const hits = annotationStyle === "line"
      ? renderer.drawAnnotationLinesOnLine(visibleEvents, series, t0, t1, chartMin, chartMax)
      : renderer.drawAnnotationsOnLine(visibleEvents, series, t0, t1, chartMin, chartMax);
    const hitValues = new Map(hits.map((hit) => [hit.event.id, hit.value]));
    const enrichedEvents = visibleEvents.map((ev) => ({
      ...ev,
      chart_value: hitValues.get(ev.id),
      chart_unit: unit,
    }));

    // Overlay ha-icon elements on top of the canvas at each hit position
    const overlay = this.shadowRoot.getElementById("icon-overlay");
    overlay.innerHTML = "";
    if (annotationStyle === "circle") {
      for (const hit of hits) {
        const bgColor = hit.event.color || "#03a9f4";
        const el = document.createElement("div");
        el.className = "ann-icon";
        el.style.left = hit.x + "px";
        el.style.top = hit.y + "px";
        el.style.background = bgColor;
        el.innerHTML = `<ha-icon icon="${esc(hit.event.icon || "mdi:bookmark")}" style="--mdc-icon-size:12px;color:${contrastColor(bgColor)}"></ha-icon>`;
        el.dataset.eventId = hit.event.id;
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this._navigateToEventHistory(hit.event);
        });
        overlay.appendChild(el);
      }
    }

    this._attachSensorTooltips(canvas, renderer, enrichedEvents, hits, t0, t1);

    // Render optional annotation list
    this._renderAnnList(events);
  }

  _renderAnnList(events) {
    const cfg = this._config;
    const sectionEl = this.shadowRoot.getElementById("ann-section");
    const listEl = this.shadowRoot.getElementById("ann-list");
    const pagEl = this.shadowRoot.getElementById("ann-pagination");
    if (!sectionEl || !listEl) return;

    // Feature is opt-in
    if (!cfg.show_records) {
      sectionEl.style.display = "none";
      return;
    }

    const sorted = [...(events || [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    // Apply optional limit
    const limited = cfg.records_limit ? sorted.slice(0, cfg.records_limit) : sorted;
    const total = limited.length;

    if (!total) {
      sectionEl.style.display = "flex";
      listEl.innerHTML = `<div class="ann-empty">No records in this time window.</div>`;
      pagEl.style.display = "none";
      return;
    }

    sectionEl.style.display = "flex";

    // Pagination
    const pageSize = cfg.records_page_size;
    const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    this._annPage = Math.min(this._annPage, pages - 1);
    const slice = pageSize
      ? limited.slice(this._annPage * pageSize, (this._annPage + 1) * pageSize)
      : limited;

    listEl.innerHTML = slice.map((ev) => {
      const color = ev.color || "#03a9f4";
      const icon = ev.icon || "mdi:bookmark";
      const iconColor = contrastColor(color);
      const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
      const showAnn = cfg.records_show_full_message !== false; // default true
      const isHidden = this._hiddenEventIds.has(ev.id);
      const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
      const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";

      return `
        <div class="ann-item${!showAnn && annText ? " expandable" : ""}${isHidden ? " is-hidden" : ""}">
          <div class="ann-icon-wrap" style="background:${esc(color)}">
            <ha-icon class="ann-icon-main" icon="${esc(icon)}" style="--mdc-icon-size:14px;color:${esc(iconColor)}"></ha-icon>
            <button class="ann-visibility-btn" type="button" data-event-id="${esc(ev.id)}" title="${esc(visibilityLabel)}" aria-label="${esc(visibilityLabel)}">
              <ha-icon icon="${esc(visibilityIcon)}"></ha-icon>
            </button>
          </div>
          <div class="ann-body">
            <div class="ann-header">
              <span class="ann-msg">
                ${esc(ev.message)}
                ${annText && !showAnn ? `<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
              </span>
              <span class="ann-time-wrap">
                <span class="ann-time" title="${esc(fmtDateTime(ev.timestamp))}">
                  ${fmtRelativeTime(ev.timestamp)}
                </span>
                <button class="ann-history-btn" type="button" data-event-id="${esc(ev.id)}" title="Open related history" aria-label="Open related history">
                  <ha-icon icon="mdi:history"></ha-icon>
                </button>
              </span>
            </div>
            ${annText ? `
              <div class="ann-note${showAnn ? "" : " hidden"}">${esc(annText)}</div>
            ` : ""}
          </div>
        </div>`;
    }).join("");

    listEl.querySelectorAll(".ann-history-btn").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const eventId = btn.dataset.eventId;
        const record = (events || []).find((item) => item.id === eventId);
        if (record) this._navigateToEventHistory(record);
      });
    });

    listEl.querySelectorAll(".ann-visibility-btn").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this._toggleEventVisibility(btn.dataset.eventId);
      });
    });

    // Wire click-to-expand when records_show_full_message is false
    if (cfg.records_show_full_message === false) {
      listEl.querySelectorAll(".ann-item.expandable").forEach((item) => {
        const toggle = () => {
          const note = item.querySelector(".ann-note");
          const chip = item.querySelector(".ann-expand-chip");
          if (!note) return;
          const hidden = note.classList.toggle("hidden");
          if (chip) chip.textContent = hidden ? "···" : "▲";
        };
        item.addEventListener("click", toggle);
      });
    }

    // Show/hide pagination bar
    if (pageSize && pages > 1) {
      pagEl.style.display = "flex";
      this.shadowRoot.getElementById("ann-page-info").textContent =
        `Page ${this._annPage + 1} of ${pages}`;
      this.shadowRoot.getElementById("ann-prev").disabled = this._annPage === 0;
      this.shadowRoot.getElementById("ann-next").disabled = this._annPage >= pages - 1;
    } else {
      pagEl.style.display = "none";
    }
  }

  _attachSensorTooltips(canvas, renderer, events, hits, t0, t1) {
    const card = this;

    const overlay = this.shadowRoot.getElementById("icon-overlay");
    overlay.querySelectorAll(".ann-icon").forEach((el) => {
      const evId = el.dataset.eventId;
      const ev = events.find((e) => e.id === evId);
      if (!ev) return;

      el.addEventListener("mouseenter", (e) => {
        showTooltip(card, canvas, renderer, ev, e.clientX, e.clientY);
      });
      el.addEventListener("mousemove", (e) => {
        showTooltip(card, canvas, renderer, ev, e.clientX, e.clientY);
      });
      el.addEventListener("mouseleave", () => {
        hideTooltip(card);
      });

      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        showTooltip(card, canvas, renderer, ev, touch.clientX, touch.clientY);
        setTimeout(() => hideTooltip(card), 3000);
      }, { passive: false });
    });

    attachTooltipBehaviour(card, canvas, renderer, events, t0, t1);

    if (this._canvasClickHandler) {
      canvas.removeEventListener("click", this._canvasClickHandler);
    }
    this._canvasClickHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const best = hits.reduce((closest, hit) => {
        const dx = hit.x - x;
        const dy = hit.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 18) return closest;
        if (!closest || dist < closest.dist) return { hit, dist };
        return closest;
      }, null);
      if (best) {
        e.preventDefault();
        e.stopPropagation();
        this._navigateToEventHistory(best.hit.event);
      }
    };
    canvas.addEventListener("click", this._canvasClickHandler);
  }

  static getConfigElement() {
    return document.createElement("hass-records-sensor-card-editor");
  }

  static getStubConfig() {
    return { entity: "sensor.example", hours_to_show: 24 };
  }

  getGridOptions() {
    const rows = this._config?.show_records ? 3 : 2;
    return {
      rows,
      min_rows: rows,
    };
  }
}
