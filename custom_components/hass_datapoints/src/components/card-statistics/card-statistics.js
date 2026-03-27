import {
  attachLineChartHover,
  attachLineChartRangeZoom,
  COLORS,
  esc,
  fetchEvents,
  fetchStatisticsDuringPeriod,
  renderChartAxisOverlays,
  resolveChartLabelColor,
  setupCanvas,
  ChartRenderer,
} from "../../lib/shared.js";
import { ChartCardBase } from "../card-chart-base/card-chart-base.js";

/**
 * hass-datapoints-statistics-card – Statistics chart with annotation markers.
 */

export class HassRecordsStatisticsCard extends ChartCardBase {
  setConfig(config) {
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

  get _statIds() {
    const ids = [];
    const addId = (value) => {
      const resolved = typeof value === "string"
        ? value
        : value?.entity
          || value?.entity_id
          || value?.statistics_id
          || "";
      if (resolved) ids.push(resolved);
    };
    addId(this._config.entity);
    (this._config.entities || []).forEach(addId);
    return [...new Set(ids)];
  }

  get _entityIds() {
    return this._statIds;
  }

  async _load() {
    const now = new Date();
    const start = new Date(now - this._config.hours_to_show * 3600 * 1000);
    const t0 = start.getTime();
    const t1 = now.getTime();
    const requestId = ++this._loadRequestId;
    this._setChartLoading(true);
    this._setChartMessage("");
    this._drawEmptyChartFrame(t0, t1);

    const partial = {
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
        this._setChartMessage("Failed to load statistics.");
        this._setChartLoading(false);
      }
    };

    try {
      fetchStatisticsDuringPeriod(
        this._hass,
        start.toISOString(),
        now.toISOString(),
        this._statIds,
        {
          period: this._config.period,
          types: this._config.stat_types,
          units: {},
        },
      ).then((statsResult) => {
        partial.statsResult = statsResult || {};
        partial.statsDone = true;
        maybeDraw();
        finalize();
      }).catch((err) => {
        partial.statsDone = true;
        partial.statsFailed = true;
        console.error("[hass-datapoints statistics-card] statistics load failed", err);
        maybeDraw();
        finalize();
      });

      fetchEvents(this._hass, start.toISOString(), now.toISOString(), this._statIds)
        .then((events) => {
          partial.events = events || [];
          partial.eventsDone = true;
          maybeDraw();
          finalize();
        })
        .catch((err) => {
          partial.eventsDone = true;
          console.error("[hass-datapoints statistics-card] event load failed", err);
          maybeDraw();
          finalize();
        });
    } catch (err) {
      this._setChartMessage("Failed to load statistics.");
      this._setChartLoading(false);
      console.error("[hass-datapoints statistics-card]", err);
    }
  }

  _drawEmptyChartFrame(t0, t1) {
    const canvas = this.shadowRoot.getElementById("chart");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    if (!canvas || !wrap) return;
    const { w, h } = setupCanvas(canvas, wrap, 220);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    renderer.drawGrid(t0, t1, [{ key: "placeholder", min: 0, max: 1, side: "left", unit: "", color: null }], undefined, 5, { fixedAxisOverlay: true });
    renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
  }

  _hasDrawableStatisticsData(statsResult = {}) {
    return Object.values(statsResult || {}).some((entries) => Array.isArray(entries) && entries.length > 0);
  }

  _drawChart(statsResult, events, t0, t1, options = {}) {
    this._lastHistResult = statsResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;
    this._lastDrawArgs = [statsResult, events, t0, t1, options];

    const canvas = this.shadowRoot.getElementById("chart");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    const { w, h } = setupCanvas(canvas, wrap, 220);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();

    const series = [];
    const allVals = [];
    let colorIdx = 0;

    for (const [statId, entries] of Object.entries(statsResult)) {
      for (const statType of this._config.stat_types) {
        const pts = [];
        for (const entry of entries) {
          const v = entry[statType];
          if (v === null || v === undefined) continue;
              const tRaw = entry.start;
          // HA returns start as Unix seconds (float). Guard against ms values (> 1e11).
          const t = typeof tRaw === "number"
            ? (tRaw > 1e11 ? tRaw : tRaw * 1000)
            : new Date(tRaw).getTime();
          pts.push([t, v]);
          allVals.push(v);
        }
        if (pts.length) {
          series.push({
            label: `${statId} (${statType})`,
            unit: this._hass?.states?.[statId]?.attributes?.unit_of_measurement || "",
            pts,
            color: COLORS[colorIdx % COLORS.length],
          });
          colorIdx++;
        }
      }
    }

    if (!allVals.length) {
      this._setChartLoading(!!options.loading);
      this._setChartMessage(options.loading ? "" : "No statistics available in the selected time range.");
      return;
    }

    this._setChartLoading(!!options.loading);
    this._setChartMessage("");

    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const vPad = (vMax - vMin) * 0.1 || 1;
    const chartMin = vMin - vPad;
    const chartMax = vMax + vPad;

    renderer.drawGrid(t0, t1, chartMin, chartMax, 5, { fixedAxisOverlay: true });
    renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
    for (const s of series) {
      renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax);
    }
    renderer.drawAnnotations(events, t0, t1);

    const legendEl = this.shadowRoot.getElementById("legend");
    legendEl.innerHTML =
      series.map((s) => `
        <div class="legend-item">
          <div class="legend-line" style="background:${esc(s.color)}"></div>
          ${esc(s.label)}
        </div>`
      ).join("") +
      (events.length
        ? `<div class="legend-item">
             <svg width="10" height="10" viewBox="-5 -5 10 10" style="flex-shrink:0">
               <polygon points="0,-4 4,0 0,4 -4,0" fill="#03a9f4"/>
             </svg>
             ${events.length} event${events.length !== 1 ? "s" : ""}
           </div>`
        : "");

    attachLineChartHover(this, canvas, renderer, series, events, t0, t1, chartMin, chartMax);
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
