/**
 * hass-datapoints-statistics-card – Statistics chart with annotation markers.
 */

class HassRecordsStatisticsCard extends ChartCardBase {
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
    if (this._config.entities) {
      return this._config.entities.map((e) => typeof e === "string" ? e : e.entity || e.statistics_id);
    }
    return [this._config.entity];
  }

  get _entityIds() {
    return this._statIds;
  }

  async _load() {
    const now = new Date();
    const start = new Date(now - this._config.hours_to_show * 3600 * 1000);
    const t0 = start.getTime();
    const t1 = now.getTime();

    try {
      const [statsResult, events] = await Promise.all([
        this._hass.connection.sendMessagePromise({
          type: "recorder/statistics_during_period",
          start_time: start.toISOString(),
          end_time: now.toISOString(),
          statistic_ids: this._statIds,
          period: this._config.period,
          types: this._config.stat_types,
          units: {},
        }),
        fetchEvents(this._hass, start.toISOString(), now.toISOString(), this._statIds),
      ]);

      this._drawChart(statsResult || {}, events, t0, t1);
    } catch (err) {
      this.shadowRoot.getElementById("loading").textContent = "Failed to load statistics.";
      console.error("[hass-datapoints statistics-card]", err);
    }
  }

  _drawChart(statsResult, events, t0, t1) {
    this._lastHistResult = statsResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;

    const canvas = this.shadowRoot.getElementById("chart");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    const { w, h } = setupCanvas(canvas, wrap, 220);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.clear();

    const series = [];
    let allVals = [];
    let colorIdx = 0;

    for (const [statId, entries] of Object.entries(statsResult)) {
      for (const statType of this._config.stat_types) {
        const pts = [];
        for (const entry of entries) {
          const v = entry[statType];
          if (v === null || v === undefined) continue;
          const tRaw = entry.start;
          const t = typeof tRaw === "number" ? tRaw * 1000 : new Date(tRaw).getTime();
          pts.push([t, v]);
          allVals.push(v);
        }
        if (pts.length) {
          series.push({
            label: `${statId} (${statType})`,
            pts,
            color: COLORS[colorIdx % COLORS.length],
          });
          colorIdx++;
        }
      }
    }

    if (!allVals.length) {
      this.shadowRoot.getElementById("loading").textContent = "No statistics available in the selected time range.";
      return;
    }

    this.shadowRoot.getElementById("loading").style.display = "none";
    canvas.style.display = "block";

    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const vPad = (vMax - vMin) * 0.1 || 1;

    renderer.drawGrid(t0, t1, vMin - vPad, vMax + vPad);
    for (const s of series) {
      renderer.drawLine(s.pts, s.color, t0, t1, vMin - vPad, vMax + vPad);
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

    attachTooltipBehaviour(this, canvas, renderer, events, t0, t1);
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

