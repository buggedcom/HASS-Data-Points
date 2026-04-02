import { LitElement, html, css, type TemplateResult } from "lit";
import {
  attachTooltipBehaviour,
  COLORS,
  contrastColor,
  DOMAIN,
  fetchEvents,
  fmtDateTime,
  fmtRelativeTime,
  navigateToDataPointsHistory,
  setupCanvas,
  ChartRenderer,
} from "@/lib/shared";
import type { CardConfig, EventRecord, HassLike } from "@/lib/types";
import "@/atoms/interactive/dp-pagination/dp-pagination";
import { logger } from "@/lib/logger.js";

interface EventRecordFull extends EventRecord {
  entity_ids?: string[];
  device_ids?: string[];
  area_ids?: string[];
  label_ids?: string[];
  chart_value?: number;
  chart_unit?: string;
}

/**
 * hass-datapoints-sensor-card – Sensor card with inline annotation icons.
 * Canvas rendering stays imperative; annotation list and state display are reactive.
 */
export class HassRecordsSensorCard extends LitElement {
  static properties = {
    _config: { state: true },
    _hass: { state: true },
    _loadMessage: { state: true },
    _chartReady: { state: true },
    _annEvents: { state: true },
    _annPage: { state: true },
    _hiddenEventIds: { state: true },
  };

  declare _config: CardConfig;

  declare _hass: HassLike | null;

  declare _loadMessage: string;

  declare _chartReady: boolean;

  declare _annEvents: EventRecordFull[];

  declare _annPage: number;

  declare _hiddenEventIds: Set<string>;

  private _initialized = false;

  private _lastHistResult: unknown = null;

  private _lastEvents: EventRecordFull[] = [];

  private _lastT0: number | null = null;

  private _lastT1: number | null = null;

  private _unsubscribe: (() => void) | null = null;

  private _resizeObserver: ResizeObserver | null = null;

  private _canvasClickHandler: ((e: MouseEvent) => void) | null = null;

  private _previousSeriesEndpoints: Map<string, { t: number; v: number }> = new Map();

  static styles = css`
    :host { display: block; height: 100%; }
    ha-card { padding: 0; overflow: hidden; height: 100%; }
    .card-shell { height: 100%; min-height: 0; display: flex; flex-direction: column; }
    .card-body {
      display: flex; flex-direction: column; flex: 0 0 auto;
      height: calc(
        (var(--hr-body-rows, var(--row-size, 1)) * (var(--row-height, 1px) + var(--row-gap, 0px)))
        - var(--row-gap, 0px)
      );
      min-height: 0; position: relative;
    }
    .header {
      padding: 8px 16px 0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .name {
      font-size: 1.1rem; font-weight: 500; color: var(--secondary-text-color);
      line-height: 40px; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; min-width: 0;
    }
    .icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--state-icon-color, var(--secondary-text-color)); }
    .icon ha-state-icon { --mdc-icon-size: 24px; }
    .info {
      display: flex; align-items: baseline; padding: 0 16px 16px; margin-top: -4px;
      line-height: var(--ha-line-height-condensed);
    }
    .value {
      font-size: var(--ha-font-size-3xl, 2.5rem);
      font-weight: var(--ha-font-weight-bold, 700);
      line-height: 0.95; letter-spacing: -0.03em; color: var(--primary-text-color);
    }
    .measurement { font-size: 1rem; color: var(--secondary-text-color); font-weight: 400; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; height: 100%; }
    .chart-wrap { position: relative; height: 100%; padding: 0; box-sizing: border-box; overflow: visible; min-height: 78px; }
    .chart-viewport { position: relative; height: 100%; overflow: hidden; }
    canvas { display: block; }
    .chart-loading { text-align: center; padding: 28px 16px 24px; color: var(--secondary-text-color); }
    .icon-overlay { position: absolute; inset: 0; pointer-events: none; }
    .ann-icon {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer;
      box-shadow: 0 0 0 2px var(--card-background-color, #fff);
    }
    .ann-icon ha-icon { --mdc-icon-size: 12px; }
    .tooltip {
      position: fixed; background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ddd); border-radius: 8px;
      padding: 8px 12px; font-size: 0.8em; line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none;
      display: none; max-width: 220px; z-index: 10; color: var(--primary-text-color);
    }
    .tt-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; flex-shrink: 0; }
    .tt-time { color: var(--secondary-text-color); margin-bottom: 3px; }
    .tt-value { color: var(--secondary-text-color); margin-bottom: 4px; }
    .tt-message { font-weight: 500; }
    .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
    .tt-entities { color: var(--secondary-text-color); margin-top: 6px; white-space: pre-wrap; }
    .ann-section {
      border-top: 1px solid var(--divider-color, #eee);
      flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
    }
    .ann-list { flex: 1 1 0; min-height: 0; overflow-y: auto; }
    .ann-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 16px; border-bottom: 1px solid var(--divider-color, #eee); cursor: default;
    }
    .ann-item:last-child { border-bottom: none; }
    .ann-item.simple { align-items: center; }
    .ann-item.is-hidden .ann-icon-main,
    .ann-item:hover .ann-icon-main { opacity: 0.22; }
    .ann-icon-wrap {
      position: relative; width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 0 0 2px var(--card-background-color, #fff);
    }
    .ann-icon-main { transition: opacity 120ms ease; }
    .ann-visibility-btn {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: 50%;
      background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
      color: var(--primary-text-color); cursor: pointer; opacity: 0;
      transition: opacity 120ms ease; padding: 0; font: inherit;
    }
    .ann-item:hover .ann-visibility-btn,
    .ann-item.is-hidden .ann-visibility-btn { opacity: 1; }
    .ann-body { flex: 1; min-width: 0; }
    .ann-header { display: flex; align-items: baseline; gap: 6px; flex-wrap: nowrap; }
    .ann-msg { font-size: 0.85em; font-weight: 500; color: var(--primary-text-color); word-break: break-word; flex: 1; min-width: 0; }
    .ann-dev-badge {
      display: inline-block; font-size: 0.68em; font-weight: 700;
      color: #fff; background: #ff9800; padding: 1px 5px; border-radius: 4px;
      vertical-align: middle; margin-left: 4px;
    }
    .ann-time-wrap { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .ann-time { font-size: 0.75em; color: var(--secondary-text-color); white-space: nowrap; }
    .ann-history-btn {
      display: inline-flex; align-items: center; justify-content: center;
      border: none; background: none; color: var(--secondary-text-color); padding: 0; cursor: pointer;
    }
    .ann-history-btn ha-icon { --mdc-icon-size: 14px; }
    .ann-note { font-size: 0.78em; color: var(--secondary-text-color); margin-top: 2px; white-space: pre-wrap; word-break: break-word; }
    .ann-note.hidden { display: none; }
    .ann-expand-chip {
      display: inline-flex; align-items: center; margin-top: 4px; padding: 1px 8px; border-radius: 999px;
      font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color);
      background: var(--secondary-background-color, rgba(0,0,0,0.06));
      border: none; cursor: pointer; font-family: inherit;
    }
    .ann-empty { text-align: center; padding: 16px; color: var(--secondary-text-color); font-size: 0.85em; }
  `;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._loadMessage = "Loading…";
    this._chartReady = false;
    this._annEvents = [];
    this._annPage = 0;
    this._hiddenEventIds = new Set();
  }

  setConfig(config: CardConfig) {
    if (!config.entity) {
      throw new Error("hass-datapoints-sensor-card: `entity` is required");
    }
    this._config = {
      hours_to_show: 24,
      annotation_style: "circle",
      show_records: false,
      records_page_size: null,
      records_limit: null,
      ...config,
    };
  }

  set hass(hass: HassLike) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._setupAutoRefresh();
    }
  }

  firstUpdated() {
    this._setupResizeObserver();
    if (this._hass) this._load();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._initialized && this._hass) this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    if (this._canvasClickHandler) {
      this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart")
        ?.removeEventListener("click", this._canvasClickHandler);
    }
  }

  private _setupAutoRefresh() {
    if (!this._hass) return;
    this._hass.connection
      .subscribeEvents(() => this._load(), `${DOMAIN}_event_recorded`)
      .then((unsub: () => void) => { this._unsubscribe = unsub; })
      .catch(() => {});
  }

  private _setupResizeObserver() {
    if (!window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      this._applyLayoutSizing();
      if (this._lastHistResult !== null) {
        this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0!, this._lastT1!);
      }
    });
    this._resizeObserver.observe(this);
  }

  private _applyLayoutSizing() {
    const body = this.shadowRoot?.querySelector<HTMLElement>(".card-body");
    if (!body) return;
    const gridRows = this._gridRows();
    if (!this._config?.show_records) {
      body.style.setProperty("--hr-body-rows", String(gridRows));
      return;
    }
    const totalRows = Math.max(3, gridRows);
    const bodyRows = Math.max(2, this._bodyRows(totalRows));
    body.style.setProperty("--hr-body-rows", String(bodyRows));
  }

  private _gridRows(): number {
    const raw = getComputedStyle(this).getPropertyValue("--row-size").trim();
    const rows = Number.parseInt(raw, 10);
    if (Number.isFinite(rows) && rows > 0) return rows;
    return this._config?.show_records ? 3 : 2;
  }

  private _bodyRows(totalRows: number): number {
    if (!this._config?.show_records) return totalRows;
    return Math.min(totalRows - 1, 2 + Math.floor(Math.max(0, totalRows - 3) / 4));
  }

  private _visibleEvents(events: EventRecordFull[]): EventRecordFull[] {
    return events.filter((ev) => !this._hiddenEventIds.has(ev.id));
  }

  private _toggleEventVisibility(eventId: string) {
    const next = new Set(this._hiddenEventIds);
    if (next.has(eventId)) next.delete(eventId);
    else next.add(eventId);
    this._hiddenEventIds = next;
    if (this._lastHistResult !== null) {
      this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0!, this._lastT1!);
    }
  }

  private _navigateToEventHistory(ev: EventRecordFull) {
    navigateToDataPointsHistory(
      this,
      {
        entity_id: [this._config?.entity as string, ...((ev?.entity_ids) || [])].filter(Boolean),
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || [],
      },
      {
        start_time: Number.isFinite(this._lastT0) ? new Date(this._lastT0!).toISOString() : null,
        end_time: Number.isFinite(this._lastT1) ? new Date(this._lastT1!).toISOString() : null,
      },
    );
  }

  private _getHistoryStatesForEntity(entityId: string, histResult: unknown): unknown[] {
    if (!histResult) return [];
    const r = histResult as any;
    if (Array.isArray(r?.[entityId])) return r[entityId];
    if (Array.isArray(r)) {
      if (Array.isArray(r[0])) return r[0] || [];
      if (r.every((e: unknown) => e && typeof e === "object" && !Array.isArray(e))) {
        return r.filter((e: any) => e.entity_id === entityId);
      }
    }
    if (r && typeof r === "object") {
      if (Array.isArray(r.result?.[entityId])) return r.result[entityId];
      if (Array.isArray(r.result?.[0])) return r.result[0] || [];
    }
    return [];
  }

  async _load() {
    if (!this._hass) return;
    const now = new Date();
    const start = new Date(now.getTime() - (this._config.hours_to_show as number) * 3600 * 1000);
    const t0 = start.getTime();
    const t1 = now.getTime();
    const entityIds = [this._config.entity as string];

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
        fetchEvents(this._hass, start.toISOString(), now.toISOString(), entityIds) as Promise<EventRecordFull[]>,
      ]);

      this._annPage = 0;
      this._drawChart(histResult || {}, events || [], t0, t1);
    } catch (err) {
      this._loadMessage = "Failed to load data.";
       
      logger.error("[hass-datapoints sensor-card]", err);
    }
  }

  private _drawChart(histResult: unknown, events: EventRecordFull[], t0: number, t1: number) {
    this._lastHistResult = histResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;

    const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart");
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (!canvas || !wrap) return;

    const { w, h } = setupCanvas(canvas, wrap, 220) as { w: number; h: number };
    const renderer = new (ChartRenderer as any)(canvas, w, h);
    const topPadPx = Math.max(6, Math.round(h * 0.05));
    renderer.pad = { top: topPadPx, right: 0, bottom: 0, left: 0 };
    renderer.clear();

    const entityId = this._config.entity as string;
    const lineColor = (this._config.graph_color as string) || (COLORS as string[])[0];
    const unit = (this._hass?.states?.[entityId]?.attributes?.unit_of_measurement as string) || "";
    const stateList = this._getHistoryStatesForEntity(entityId, histResult);

    const pts: [number, number][] = [];
    const allVals: number[] = [];
    for (const s of stateList) {
      const v = parseFloat((s as any).s);
      if (!isNaN(v)) {
        pts.push([Math.round((s as any).lu * 1000), v]);
        allVals.push(v);
      }
    }

    if (!allVals.length) {
      this._loadMessage = "No numeric data in the selected time range.";
      this._chartReady = false;
      this._annEvents = events;
      return;
    }

    this._loadMessage = "";
    this._chartReady = true;

    const series = [{ entityId, pts, color: lineColor }];
    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const range = vMax - vMin;
    const chartMin = vMin - (range * 0.03 || 0.2);
    const chartMax = vMax + (range * 0.54 || 0.8);

    for (const s of series) {
      renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax, { fillAlpha: 0.18 });

      // Blip animation when series receives new data.
      if (s.pts.length) {
        const lastPt = s.pts[s.pts.length - 1];
        const prev = this._previousSeriesEndpoints.get(s.entityId);
        if (prev && (lastPt[0] !== prev.t || lastPt[1] !== prev.v)) {
          const cx = (renderer as any).xOf(lastPt[0], t0, t1);
          const cy = (renderer as any).yOf(lastPt[1], chartMin, chartMax);
          (renderer as any).drawBlip(cx, cy, s.color);
        }
        this._previousSeriesEndpoints.set(s.entityId, { t: lastPt[0], v: lastPt[1] });
      }
    }

    const visibleEvents = this._visibleEvents(events);
    const annotationStyle = (this._config.annotation_style as string) === "line" ? "line" : "circle";
    const hits: unknown[] = annotationStyle === "line"
      ? renderer.drawAnnotationLinesOnLine(visibleEvents, series, t0, t1, chartMin, chartMax)
      : renderer.drawAnnotationsOnLine(visibleEvents, series, t0, t1, chartMin, chartMax);

    const hitValues = new Map((hits as any[]).map((h) => [h.event.id, h.value]));
    const enrichedEvents: EventRecordFull[] = visibleEvents.map((ev) => ({
      ...ev,
      chart_value: hitValues.get(ev.id),
      chart_unit: unit,
    }));

    // Imperatively place annotation icon overlays
    const overlay = this.shadowRoot?.querySelector<HTMLElement>(".icon-overlay");
    if (overlay) {
      overlay.innerHTML = "";
      if (annotationStyle === "circle") {
        for (const hit of hits as any[]) {
          const bgColor = hit.event.color || "#03a9f4";
          const el = document.createElement("div");
          el.className = "ann-icon";
          el.style.left = `${hit.x}px`;
          el.style.top = `${hit.y}px`;
          el.style.background = bgColor;
          el.innerHTML = `<ha-icon icon="${hit.event.icon || "mdi:bookmark"}" style="--mdc-icon-size:12px;color:${contrastColor(bgColor)}"></ha-icon>`;
          el.dataset.eventId = hit.event.id;
          el.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._navigateToEventHistory(hit.event);
          });
          overlay.appendChild(el);
        }
      }
    }

    attachTooltipBehaviour(this, canvas, renderer, enrichedEvents, t0, t1);

    if (this._canvasClickHandler) canvas.removeEventListener("click", this._canvasClickHandler);
    this._canvasClickHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const best = (hits as any[]).reduce((closest: any, hit: any) => {
        const dist = Math.hypot(hit.x - x, hit.y - y);
        if (dist > 18) return closest;
        if (!closest || dist < closest.dist) return { hit, dist };
        return closest;
      }, null);
      if (best) { e.preventDefault(); e.stopPropagation(); this._navigateToEventHistory(best.hit.event); }
    };
    canvas.addEventListener("click", this._canvasClickHandler);

    this._annEvents = events;
  }

  private _renderAnnItem(ev: EventRecordFull): TemplateResult {
    const color = ev.color || "#03a9f4";
    const icon = ev.icon || "mdi:bookmark";
    const iconColor = contrastColor(color) as string;
    const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
    const showAnn = this._config.records_show_full_message !== false;
    const isHidden = this._hiddenEventIds.has(ev.id);
    const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
    const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
    const isSimple = !annText;
    const timestamp = ev.timestamp;

    return html`
      <div
        class="ann-item${!showAnn && annText ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}"
        @click=${!showAnn && annText
          ? (e: Event) => {
              const item = e.currentTarget as HTMLElement;
              item.querySelector(".ann-note")?.classList.toggle("hidden");
            }
          : undefined}
      >
        <div class="ann-icon-wrap" style="background:${color}">
          <ha-icon
            class="ann-icon-main"
            .icon=${icon}
            style="--mdc-icon-size:18px;color:${iconColor}"
          ></ha-icon>
          <button
            class="ann-visibility-btn"
            type="button"
            title=${visibilityLabel}
            aria-label=${visibilityLabel}
            @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this._toggleEventVisibility(ev.id); }}
          >
            <ha-icon .icon=${visibilityIcon}></ha-icon>
          </button>
        </div>
        <div class="ann-body">
          <div class="ann-header">
            <span class="ann-msg">
              ${ev.message}
              ${ev.dev ? html`<span class="ann-dev-badge">DEV</span>` : ""}
              ${annText && !showAnn ? html`<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
            </span>
            <span class="ann-time-wrap">
              <span class="ann-time" title=${fmtDateTime(timestamp) as string}>
                ${fmtRelativeTime(timestamp)}
              </span>
              <button
                class="ann-history-btn"
                type="button"
                title="Open related history"
                @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this._navigateToEventHistory(ev); }}
              >
                <ha-icon icon="mdi:history"></ha-icon>
              </button>
            </span>
          </div>
          ${annText
            ? html`<div class="ann-note${showAnn ? "" : " hidden"}">${annText}</div>`
            : ""}
        </div>
      </div>
    `;
  }

  private _renderAnnSection(): TemplateResult | string {
    if (!this._config?.show_records) return "";
    const cfg = this._config;
    const sorted = [...this._annEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const limited = cfg.records_limit ? sorted.slice(0, cfg.records_limit as number) : sorted;
    const total = limited.length;

    if (!total) {
      return html`
        <div class="ann-section">
          <div class="ann-list">
            <div class="ann-empty">No records in this time window.</div>
          </div>
        </div>
      `;
    }

    const pageSize = cfg.records_page_size as number | null;
    const totalPages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const page = Math.min(this._annPage, totalPages - 1);
    const slice = pageSize ? limited.slice(page * pageSize, (page + 1) * pageSize) : limited;
    const showPagination = totalPages > 1;

    return html`
      <div class="ann-section">
        <div class="ann-list">
          ${slice.map((ev) => this._renderAnnItem(ev))}
        </div>
        ${showPagination
          ? html`
              <dp-pagination
                .page=${page}
                .totalPages=${totalPages}
                .totalItems=${total}
                label="records"
                @dp-page-change=${(e: CustomEvent<{ page: number }>) => {
                  this._annPage = e.detail.page;
                  this.shadowRoot?.querySelector(".ann-list")?.scrollTo(0, 0);
                }}
              ></dp-pagination>
            `
          : ""}
      </div>
    `;
  }

  render() {
    const stateObj = this._hass?.states?.[this._config?.entity as string];
    const sensorName =
      (this._config?.name as string) ||
      (stateObj?.attributes?.friendly_name as string) ||
      (this._config?.entity as string) ||
      "—";
    const sensorValue = stateObj?.state ?? "—";
    const sensorUnit = (stateObj?.attributes?.unit_of_measurement as string) || "";

    return html`
      <ha-card>
        <div class="card-shell">
          <div class="card-body">
            <div class="header">
              <div class="name">${sensorName}</div>
              <div class="icon">
                <ha-state-icon
                  .stateObj=${stateObj}
                  .hass=${this._hass}
                ></ha-state-icon>
              </div>
            </div>
            <div class="info">
              <span class="value">${sensorValue}</span>
              <span class="measurement">${sensorUnit}</span>
            </div>
            <div class="footer">
              <div class="chart-wrap">
                <div class="chart-viewport">
                  ${!this._chartReady
                    ? html`<div class="chart-loading">${this._loadMessage}</div>`
                    : ""}
                  <canvas
                    id="chart"
                    style=${this._chartReady ? "" : "display:none"}
                  ></canvas>
                  <div class="icon-overlay"></div>
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
          ${this._renderAnnSection()}
        </div>
      </ha-card>
    `;
  }

  updated() {
    this._applyLayoutSizing();
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-sensor-card-editor");
  }

  static getStubConfig() {
    return { entity: "sensor.example", hours_to_show: 24 };
  }

  getGridOptions() {
    const rows = this._config?.show_records ? 3 : 2;
    return { rows, min_rows: rows, max_rows: rows };
  }
}
