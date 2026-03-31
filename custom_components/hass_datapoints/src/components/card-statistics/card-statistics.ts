import { LitElement, html, css } from "lit";
import {
  attachLineChartHover,
  COLORS,
  fetchEvents,
  fetchStatisticsDuringPeriod,
  renderChartAxisOverlays,
  resolveChartLabelColor,
  setupCanvas,
  ChartRenderer,
  DOMAIN,
} from "@/lib/shared";
import type { CardConfig, HassLike, SeriesItem } from "@/lib/types";
import "@/molecules/dp-chart-shell/dp-chart-shell";
import "@/molecules/dp-chart-legend/dp-chart-legend";

/**
 * hass-datapoints-statistics-card – Statistics chart with annotation markers.
 * LitElement migration — canvas rendering stays imperative.
 */
export class HassRecordsStatisticsCard extends LitElement {
  static properties = {
    _config: { state: true },
    _hass: { state: true },
    _loading: { state: true },
    _chartMessage: { state: true },
    _series: { state: true },
    _eventCount: { state: true },
  };

  declare _config: CardConfig;
  declare _hass: HassLike | null;
  declare _loading: boolean;
  declare _chartMessage: string;
  declare _series: SeriesItem[];
  declare _eventCount: number;

  private _loadRequestId = 0;
  private _lastDrawArgs: unknown[] | null = null;
  private _chartHoverCleanup: (() => void) | null = null;
  private _unsubscribe: (() => void) | null = null;
  private _windowListener: (() => void) | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _hasStartedInitialLoad = false;
  private _previousSeriesEndpoints: Map<string, { t: number; v: number }> = new Map();

  static styles = css`
    :host { display: block; height: 100%; }
    .chart-wrap {
      position: relative; width: 100%; height: 100%;
    }
    canvas { display: block; }
    .legend-events {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 16px 8px;
      font-size: 0.8rem; color: var(--secondary-text-color);
    }
  `;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._loading = false;
    this._chartMessage = "";
    this._series = [];
    this._eventCount = 0;
  }

  setConfig(config: CardConfig) {
    if (!config.entity && !config.entities) {
      throw new Error("hass-datapoints-statistics-card: define `entity` or `entities`");
    }
    this._config = {
      hours_to_show: 24,
      period: "hour",
      stat_types: ["mean"],
      ...config,
    };
  }

  set hass(hass: HassLike) {
    this._hass = hass;
    if (this.isConnected && !this._hasStartedInitialLoad) {
      this._hasStartedInitialLoad = true;
      this._load();
    }
  }

  firstUpdated() {
    this._setupResizeObserver();
    this._setupAutoRefresh();
    if (!this._hasStartedInitialLoad && this._hass) {
      this._hasStartedInitialLoad = true;
      this._load();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._hass && !this._hasStartedInitialLoad) {
      this._hasStartedInitialLoad = true;
      this._load();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._windowListener) {
      window.removeEventListener("hass-datapoints-event-recorded", this._windowListener);
      this._windowListener = null;
    }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    if (this._chartHoverCleanup) { this._chartHoverCleanup(); this._chartHoverCleanup = null; }
  }

  private _setupAutoRefresh() {
    if (!this._hass) return;
    this._hass.connection
      .subscribeEvents(() => this._load(), `${DOMAIN}_event_recorded`)
      .then((unsub: () => void) => { this._unsubscribe = unsub; })
      .catch(() => {});
    this._windowListener = () => this._load();
    window.addEventListener("hass-datapoints-event-recorded", this._windowListener);
  }

  private _setupResizeObserver() {
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (!wrap || !window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (Array.isArray(this._lastDrawArgs) && this._lastDrawArgs.length) {
        (this._drawChart as (...args: unknown[]) => void)(...this._lastDrawArgs);
      }
    });
    this._resizeObserver.observe(wrap);
  }

  private get _statIds(): string[] {
    const ids: string[] = [];
    const addId = (value: unknown) => {
      const resolved =
        typeof value === "string"
          ? value
          : (value as any)?.entity ||
            (value as any)?.entity_id ||
            (value as any)?.statistics_id ||
            "";
      if (resolved) ids.push(resolved as string);
    };
    addId(this._config.entity);
    ((this._config.entities as unknown[]) || []).forEach(addId);
    return [...new Set(ids)];
  }

  async _load() {
    if (!this._hass) return;
    const now = new Date();
    const start = new Date(now.getTime() - (this._config.hours_to_show as number) * 3600 * 1000);
    const t0 = start.getTime();
    const t1 = now.getTime();
    const requestId = ++this._loadRequestId;

    this._loading = true;
    this._chartMessage = "";
    this._drawEmptyChartFrame(t0, t1);

    const partial: {
      statsResult: Record<string, unknown[]> | null;
      events: unknown[] | null;
      statsDone: boolean;
      eventsDone: boolean;
      statsFailed: boolean;
    } = {
      statsResult: null,
      events: null,
      statsDone: false,
      eventsDone: false,
      statsFailed: false,
    };

    const maybeDraw = () => {
      if (requestId !== this._loadRequestId) return;
      const hasDrawableData = this._hasDrawableStatisticsData(partial.statsResult || {});
      if (!hasDrawableData && !partial.statsDone) return;
      this._drawChart(
        partial.statsResult || {},
        partial.events || [],
        t0,
        t1,
        { loading: !(partial.statsDone && partial.eventsDone) },
      );
    };

    const finalize = () => {
      if (requestId !== this._loadRequestId) return;
      if (!(partial.statsDone && partial.eventsDone)) return;
      if (partial.statsFailed && partial.statsResult == null) {
        this._chartMessage = "Failed to load statistics.";
        this._loading = false;
      }
    };

    try {
      (fetchStatisticsDuringPeriod(
        this._hass,
        start.toISOString(),
        now.toISOString(),
        this._statIds,
        {
          period: this._config.period,
          types: this._config.stat_types,
          units: {},
        },
      ) as Promise<Record<string, unknown[]>>)
        .then((statsResult) => {
          partial.statsResult = statsResult || {};
          partial.statsDone = true;
          maybeDraw();
          finalize();
        })
        .catch((err: unknown) => {
          partial.statsDone = true;
          partial.statsFailed = true;
          // eslint-disable-next-line no-console
          console.error("[hass-datapoints statistics-card] statistics load failed", err);
          maybeDraw();
          finalize();
        });

      (fetchEvents(this._hass, start.toISOString(), now.toISOString(), this._statIds) as Promise<unknown[]>)
        .then((events) => {
          partial.events = events || [];
          partial.eventsDone = true;
          maybeDraw();
          finalize();
        })
        .catch((err: unknown) => {
          partial.eventsDone = true;
          // eslint-disable-next-line no-console
          console.error("[hass-datapoints statistics-card] event load failed", err);
          maybeDraw();
          finalize();
        });
    } catch (err) {
      this._chartMessage = "Failed to load statistics.";
      this._loading = false;
      // eslint-disable-next-line no-console
      console.error("[hass-datapoints statistics-card]", err);
    }
  }

  private _drawEmptyChartFrame(t0: number, t1: number) {
    const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart");
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (!canvas || !wrap) return;
    const { w, h } = setupCanvas(canvas, wrap, 220) as { w: number; h: number };
    const renderer = new (ChartRenderer as any)(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    renderer.drawGrid(
      t0, t1,
      [{ key: "placeholder", min: 0, max: 1, side: "left", unit: "", color: null }],
      undefined, 5,
      { fixedAxisOverlay: true },
    );
    renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
  }

  private _hasDrawableStatisticsData(statsResult: Record<string, unknown>): boolean {
    return Object.values(statsResult || {}).some(
      (entries) => Array.isArray(entries) && entries.length > 0,
    );
  }

  private _drawChart(
    statsResult: Record<string, unknown[]>,
    events: unknown[],
    t0: number,
    t1: number,
    options: { loading?: boolean } = {},
  ) {
    this._lastDrawArgs = [statsResult, events, t0, t1, options];

    const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart");
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (!canvas || !wrap) return;

    const { w, h } = setupCanvas(canvas, wrap, 220) as { w: number; h: number };
    const renderer = new (ChartRenderer as any)(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();

    const series: SeriesItem[] = [];
    const allVals: number[] = [];
    let colorIdx = 0;
    const colors = COLORS as string[];

    for (const [statId, entries] of Object.entries(statsResult)) {
      for (const statType of (this._config.stat_types as string[])) {
        const pts: [number, number][] = [];
        for (const entry of entries) {
          const v = (entry as any)[statType];
          if (v === null || v === undefined) continue;
          const tRaw = (entry as any).start;
          const t =
            typeof tRaw === "number"
              ? tRaw > 1e11 ? tRaw : tRaw * 1000
              : new Date(tRaw).getTime();
          pts.push([t, v]);
          allVals.push(v as number);
        }
        if (pts.length) {
          const color = colors[colorIdx % colors.length];
          series.push({
            entityId: `${statId}:${statType}`,
            label: `${statId} (${statType})`,
            unit: (this._hass?.states?.[statId]?.attributes?.unit_of_measurement as string) || "",
            color,
          });
          colorIdx++;
        }
      }
    }

    if (!allVals.length) {
      this._loading = !!options.loading;
      this._chartMessage = options.loading ? "" : "No statistics available in the selected time range.";
      this._series = series;
      this._eventCount = events.length;
      return;
    }

    this._loading = !!options.loading;
    this._chartMessage = "";
    this._series = series;
    this._eventCount = events.length;

    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const vPad = (vMax - vMin) * 0.1 || 1;
    const chartMin = vMin - vPad;
    const chartMax = vMax + vPad;

    renderer.drawGrid(t0, t1, chartMin, chartMax, 5, { fixedAxisOverlay: true });
    renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
    for (const s of series) {
      const seriesPts = (() => {
        const pts: [number, number][] = [];
        const [sid, stype] = s.entityId.split(":");
        for (const entry of statsResult[sid] || []) {
          const v = (entry as any)[stype];
          if (v === null || v === undefined) continue;
          const tRaw = (entry as any).start;
          const t = typeof tRaw === "number" ? (tRaw > 1e11 ? tRaw : tRaw * 1000) : new Date(tRaw).getTime();
          pts.push([t, v]);
        }
        return pts;
      })();
      renderer.drawLine(seriesPts, s.color, t0, t1, chartMin, chartMax);

      // Blip animation when series receives new data.
      if (seriesPts.length) {
        const lastPt = seriesPts[seriesPts.length - 1];
        const prev = this._previousSeriesEndpoints.get(s.entityId);
        if (prev && (lastPt[0] !== prev.t || lastPt[1] !== prev.v)) {
          const cx = (renderer as any).xOf(lastPt[0], t0, t1);
          const cy = (renderer as any).yOf(lastPt[1], chartMin, chartMax);
          (renderer as any).drawBlip(cx, cy, s.color);
        }
        this._previousSeriesEndpoints.set(s.entityId, { t: lastPt[0], v: lastPt[1] });
      }
    }
    renderer.drawAnnotations(events, t0, t1);

    if (this._chartHoverCleanup) this._chartHoverCleanup();
    this._chartHoverCleanup = attachLineChartHover(
      this, canvas, renderer, series, events, t0, t1, chartMin, chartMax,
    ) as unknown as (() => void) | null;
  }

  render() {
    const cfg = this._config;
    return html`
      <dp-chart-shell
        .cardTitle=${(cfg.title as string) || ""}
        .loading=${this._loading}
        .message=${this._chartMessage}
      >
        <div class="chart-wrap">
          <canvas id="chart"></canvas>
        </div>
        <div slot="legend">
          <dp-chart-legend .series=${this._series}></dp-chart-legend>
          ${this._eventCount > 0
            ? html`
                <span class="legend-events">
                  <svg width="10" height="10" viewBox="-5 -5 10 10" style="flex-shrink:0">
                    <polygon points="0,-4 4,0 0,4 -4,0" fill="#03a9f4"></polygon>
                  </svg>
                  ${this._eventCount} event${this._eventCount !== 1 ? "s" : ""}
                </span>
              `
            : ""}
        </div>
      </dp-chart-shell>
    `;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-statistics-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Statistics with Events",
      entity: "sensor.example",
      hours_to_show: 168,
      period: "hour",
      stat_types: ["mean"],
    };
  }
}
