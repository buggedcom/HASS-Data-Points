/**
 * hass-records-history-card – History line chart with annotation markers.
 */

class HassRecordsHistoryCard extends ChartCardBase {
  setConfig(config) {
    if (!config.entity && !config.entities) {
      throw new Error("hass-records-history-card: define `entity` or `entities`");
    }
    this._config = { hours_to_show: 24, ...config };
  }

  _getRange() {
    const end = this._config.end_time ? new Date(this._config.end_time) : new Date();
    const start = this._config.start_time
      ? new Date(this._config.start_time)
      : new Date(end.getTime() - this._config.hours_to_show * 3600 * 1000);
    return { start, end };
  }

  get _entityIds() {
    if (this._config.entities) {
      return this._config.entities.map((e) => typeof e === "string" ? e : e.entity);
    }
    return [this._config.entity];
  }

  async _load() {
    const { start, end } = this._getRange();
    const t0 = start.getTime();
    const t1 = end.getTime();

    try {
      const [histResult, events] = await Promise.all([
        this._hass.connection.sendMessagePromise({
          type: "history/history_during_period",
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          entity_ids: this._entityIds,
          include_start_time_state: true,
          significant_changes_only: false,
          no_attributes: true,
        }),
        fetchEvents(this._hass, start.toISOString(), end.toISOString(), this._entityIds),
      ]);

      this._drawChart(histResult || {}, events, t0, t1);
    } catch (err) {
      this.shadowRoot.getElementById("loading").textContent = "Failed to load data.";
      console.error("[hass-records history-card]", err);
    }
  }

  _drawChart(histResult, events, t0, t1) {
    this._lastHistResult = histResult;
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

    Object.entries(histResult).forEach(([entityId, stateList], i) => {
      const pts = [];
      for (const s of stateList) {
        const v = parseFloat(s.s);
        if (!isNaN(v)) {
          pts.push([Math.round(s.lu * 1000), v]);
          allVals.push(v);
        }
      }
      if (pts.length) {
        series.push({ entityId, pts, color: COLORS[i % COLORS.length] });
      }
    });

    if (!allVals.length) {
      this.shadowRoot.getElementById("loading").textContent = "No numeric data in the selected time range.";
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
          ${esc(s.entityId)}
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
    return document.createElement("hass-records-history-card-editor");
  }

  static getStubConfig() {
    return { title: "History with Events", entity: "sensor.example", hours_to_show: 24 };
  }
}
