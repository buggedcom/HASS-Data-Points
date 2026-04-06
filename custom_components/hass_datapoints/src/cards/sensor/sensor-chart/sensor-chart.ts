import { html, LitElement } from "lit";
import { COLORS } from "@/constants";
import { contrastColor } from "@/lib/util/color";
import { attachTooltipBehaviour } from "@/lib/chart/chart-interaction";
import { setupCanvas } from "@/charts/utils/chart-dom";
import { ChartRenderer } from "@/lib/chart/chart-renderer";
import type {
  CardConfig,
  EventRecordFull,
  HassLike,
  HassStateEntry,
} from "@/lib/types";
import { styles } from "./sensor-chart.styles";

/** Typed shape of a renderer hit returned by drawAnnotations*. */
interface ChartHit {
  x: number;
  y: number;
  value: number;
  event: EventRecordFull;
}

/** Minimal interface covering the ChartRenderer methods used in this file. */
interface RendererLike {
  pad: { top: number; right: number; bottom: number; left: number };

  clear(): void;

  drawLine(...args: unknown[]): void;

  drawAnnotationsOnLine(
    events: unknown[],
    series: unknown[],
    t0: number,
    t1: number,
    min: number,
    max: number
  ): ChartHit[];

  drawAnnotationLinesOnLine(
    events: unknown[],
    series: unknown[],
    t0: number,
    t1: number,
    min: number,
    max: number
  ): ChartHit[];

  xOf(t: number, t0: number, t1: number): number;

  yOf(v: number, min: number, max: number): number;

  drawBlip(cx: number, cy: number, color: string): void;
}

export class SensorChart extends LitElement {
  static properties = {
    _chartReady: { state: true },
    _loadMessage: { state: true },
  };

  declare _chartReady: boolean;

  declare _loadMessage: string;

  // Set by parent before draw(); not reactive to avoid unnecessary re-renders
  private _hass: Nullable<HassLike> = null;

  get hass(): Nullable<HassLike> {
    return this._hass;
  }

  set hass(value: Nullable<HassLike>) {
    this._hass = value;
  }

  private _canvasClickHandler: Nullable<(e: MouseEvent) => void> = null;

  private _previousSeriesEndpoints: Map<string, { t: number; v: number }> =
    new Map();

  private _lastDrawArgs: Nullable<
    [
      unknown,
      EventRecordFull[],
      number,
      number,
      CardConfig,
      string,
      Set<string>
    ]
  > = null;

  private _resizeObserver: Nullable<ResizeObserver> = null;

  static styles = styles;

  constructor() {
    super();
    this._chartReady = false;
    this._loadMessage = "Loading…";
  }

  firstUpdated() {
    this._setupResizeObserver();
  }

  disconnectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    const canvas =
      this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart");
    if (canvas && this._canvasClickHandler)
      canvas.removeEventListener("click", this._canvasClickHandler);
  }

  private _setupResizeObserver() {
    if (!window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (this._lastDrawArgs) this.draw(...this._lastDrawArgs);
    });
    this._resizeObserver.observe(this);
  }

  /** Draw the chart. Called by the parent card after data loads or on resize/toggle. */
  draw(
    histResult: unknown,
    events: EventRecordFull[],
    t0: number,
    t1: number,
    config: CardConfig,
    unit: string,
    hiddenEventIds: Set<string>
  ) {
    this._lastDrawArgs = [
      histResult,
      events,
      t0,
      t1,
      config,
      unit,
      hiddenEventIds,
    ];

    const canvas =
      this.shadowRoot?.querySelector<HTMLCanvasElement>("canvas#chart");
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (!canvas || !wrap) return;

    const { w, h } = setupCanvas(canvas, wrap as HTMLElement, null) as {
      w: number;
      h: number;
    };
    const renderer = new (ChartRenderer as unknown as new (
      c: HTMLCanvasElement,
      w: number,
      h: number
    ) => RendererLike)(canvas, w, h);
    const topPadPx = Math.max(6, Math.round(h * 0.05));
    renderer.pad = { top: topPadPx, right: 0, bottom: 0, left: 0 };
    renderer.clear();

    const entityId = config.entity as string;
    const lineColor =
      (config.graph_color as string) ||
      (COLORS as unknown as string[])[0];
    const stateList = this._getHistoryStatesForEntity(entityId, histResult);

    const pts: [number, number][] = [];
    const allVals: number[] = [];
    for (const s of stateList) {
      const v = parseFloat(s.s);
      if (!Number.isNaN(v)) {
        pts.push([Math.round(s.lu * 1000), v]);
        allVals.push(v);
      }
    }

    if (!allVals.length) {
      this._loadMessage = "No numeric data in the selected time range.";
      this._chartReady = false;
      return;
    }

    this._loadMessage = "";
    this._chartReady = true;

    const annotationStyle = (config.annotation_style as string) ?? "circle";
    const visibleEvents = events.filter((ev) => !hiddenEventIds.has(ev.id));
    const series = [{ entityId, pts, color: lineColor }];
    const vMin = Math.min(...allVals);
    const vMax = Math.max(...allVals);
    const range = vMax - vMin;
    const chartMin = vMin - (range * 0.03 || 0.2);
    const chartMax = vMax + (range * 0.54 || 0.8);

    for (const s of series) {
      renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax, {
        fillAlpha: 0.18,
      });
      if (s.pts.length) {
        const lastPt = s.pts[s.pts.length - 1];
        const prev = this._previousSeriesEndpoints.get(s.entityId);
        if (prev && (lastPt[0] !== prev.t || lastPt[1] !== prev.v)) {
          const cx = renderer.xOf(lastPt[0], t0, t1);
          const cy = renderer.yOf(lastPt[1], chartMin, chartMax);
          renderer.drawBlip(cx, cy, s.color);
        }
        this._previousSeriesEndpoints.set(s.entityId, {
          t: lastPt[0],
          v: lastPt[1],
        });
      }
    }

    const hits: ChartHit[] =
      annotationStyle === "line"
        ? renderer.drawAnnotationLinesOnLine(
            visibleEvents,
            series,
            t0,
            t1,
            chartMin,
            chartMax
          )
        : renderer.drawAnnotationsOnLine(
            visibleEvents,
            series,
            t0,
            t1,
            chartMin,
            chartMax
          );

    const hitValues = new Map(hits.map((hit) => [hit.event.id, hit.value]));
    const enrichedEvents: EventRecordFull[] = visibleEvents.map((ev) => ({
      ...ev,
      chart_value: hitValues.get(ev.id),
      chart_unit: unit,
    }));

    const overlay =
      this.shadowRoot?.querySelector<HTMLElement>(".icon-overlay");
    if (overlay) {
      overlay.innerHTML = "";
      if (annotationStyle === "circle") {
        for (const hit of hits) {
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
            this._emitAnnotationClick(hit.event);
          });
          overlay.appendChild(el);
        }
      }
    }

    attachTooltipBehaviour(
      this,
      canvas,
      renderer as unknown as import("@/lib/chart/chart-renderer").ChartRenderer,
      enrichedEvents as unknown as import("@/lib/chart/chart-interaction").ChartEventRecord[],
      t0,
      t1
    );

    if (this._canvasClickHandler)
      canvas.removeEventListener("click", this._canvasClickHandler);
    this._canvasClickHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const best = hits.reduce(
        (closest: Nullable<{ hit: ChartHit; dist: number }>, hit: ChartHit) => {
          const dist = Math.hypot(hit.x - x, hit.y - y);
          if (dist > 18) return closest;
          if (!closest || dist < closest.dist) return { hit, dist };
          return closest;
        },
        null
      );
      if (best) {
        e.preventDefault();
        e.stopPropagation();
        this._emitAnnotationClick(best.hit.event);
      }
    };
    canvas.addEventListener("click", this._canvasClickHandler);
  }

  private _emitAnnotationClick(event: EventRecordFull) {
    this.dispatchEvent(
      new CustomEvent("dp-sensor-annotation-click", {
        detail: { event },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _getHistoryStatesForEntity(
    entityId: string,
    histResult: unknown
  ): HassStateEntry[] {
    if (!histResult) return [];
    const r = histResult as RecordWithUnknownValues;
    if (Array.isArray(r[entityId])) return r[entityId] as HassStateEntry[];
    if (Array.isArray(r)) {
      const rArr = r as unknown[];
      if (Array.isArray(rArr[0])) return (rArr[0] as HassStateEntry[]) || [];
      if (
        rArr.every(
          (e: unknown) => e && typeof e === "object" && !Array.isArray(e)
        )
      )
        return (rArr as HassStateEntry[]).filter(
          (e) => e.entity_id === entityId
        );
    }
    const rObj = histResult as {
      result?: RecordWithUnknownValues | unknown[][];
    };
    if (rObj && typeof rObj === "object") {
      const result = rObj.result;
      if (Array.isArray((result as RecordWithUnknownValues)?.[entityId]))
        return (result as Record<string, HassStateEntry[]>)[entityId];
      if (Array.isArray((result as unknown[])?.[0]))
        return ((result as unknown[])[0] as HassStateEntry[]) || [];
    }
    return [];
  }

  render() {
    return html`
      <div class="chart-wrap">
        <div class="chart-viewport">
          ${!this._chartReady
            ? html` <div class="chart-loading">${this._loadMessage}</div>`
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
          <div
            class="tt-annotation"
            id="tt-annotation"
            style="display:none"
          ></div>
          <div class="tt-entities" id="tt-entities" style="display:none"></div>
        </div>
      </div>
    `;
  }
}

customElements.define("sensor-chart", SensorChart);
