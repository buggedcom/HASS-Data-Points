/**
 * history-chart.ts
 *
 * LitElement sub-component that owns the canvas, the chart DOM shell
 * (loading spinner, tooltips, crosshair, legend, axis overlays), and all
 * drawing/interaction state for the history chart card.
 *
 * IMPORTANT: No shadow DOM — renders into its own children so the canvas and
 * legend remain accessible from the parent card's shadow root.
 */

import { esc } from "@/lib/util/format.js";
import {
  binaryOffLabel,
  binaryOnLabel,
  downsamplePts,
  getAxisValueExtent,
  getHistoryStatesForEntity,
  mergeNumericHistoryWithStatistics,
  normalizeNumericHistory,
  normalizeStatisticsHistory,
  SAMPLE_INTERVAL_MS,
} from "../history-data.js";
import { clampChartValue } from "@/lib/chart/chart-shell.js";
import {
  renderChartAxisOverlays,
  resolveChartLabelColor,
  setupCanvas,
} from "@/charts/utils/chart-dom.js";
import {
  attachLineChartHover,
  attachLineChartRangeZoom,
  dispatchLineChartHover,
  hideLineChartHover,
  hideTooltip,
  showLineChartCrosshair,
  showLineChartTooltip,
} from "@/lib/chart/chart-interaction.js";
import { entityName } from "@/lib/ha/entity-name.js";
import {
  fetchAnomaliesFromBackend,
  fetchDownsampledHistory,
} from "@/lib/data/history-api.js";
import { COLORS } from "@/constants.js";
import { contrastColor, hexToRgba } from "@/lib/util/color.js";
import { ChartRenderer } from "@/lib/chart/chart-renderer.js";
import { normalizeHistorySeriesAnalysis } from "@/lib/domain/history-series.js";
import {
  computeHistoryAnalysisInWorker,
  terminateHistoryAnalysisWorker,
} from "@/lib/workers/history-analysis-client.js";
import { logger } from "@/lib/logger.js";
import type { HassLike } from "@/lib/types";
import {
  buildDeltaPoints,
  buildLinearTrend,
  buildRateOfChangePoints,
  buildRollingAverageTrend,
  buildSummaryStats,
  getTrendWindowMs,
} from "../analysis/index";
import { navigateToDataPointsHistory } from "@/lib/ha/navigation.js";
import { styles } from "./history-chart.styles.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX = 500;
const HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX = 440;
const HISTORY_CHART_MAX_CANVAS_WIDTH_PX = Math.floor(
  16383 / (window.devicePixelRatio || 1)
);
const HISTORY_CHART_MAX_ZOOM_MULTIPLIER = 365;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeriesAnalysis {
  show_trend_lines?: boolean;
  show_summary_stats?: boolean;
  show_rate_of_change?: boolean;
  show_threshold_analysis?: boolean;
  show_anomalies?: boolean;
  show_delta_analysis?: boolean;
  hide_source_series?: boolean;
  trend_method?: string;
  trend_window?: string;
  rate_window?: string;
  anomaly_methods?: string[];
  anomaly_sensitivity?: string;
  anomaly_overlap_mode?: string;
  anomaly_rate_window?: string;
  anomaly_zscore_window?: string;
  anomaly_persistence_window?: string;
  anomaly_comparison_window_id?: string;
  [key: string]: unknown;
}

interface SeriesItem {
  entityId: string;
  pts: [number, number][];
  [key: string]: unknown;
}

interface AnalysisResult {
  trendSeries: unknown[];
  rateSeries: unknown[];
  deltaSeries: unknown[];
  summaryStats: unknown[];
  anomalySeries: unknown[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export class HistoryChart extends HTMLElement {
  // ── No shadow DOM ───────────────────────────────────────────────────────────
  // Renders synchronously into its own children so the canvas and legend are
  // accessible from the parent card's shadow root (required by existing tests).

  /** Called once when the element is inserted into the DOM. */
  connectedCallback(): void {
    // Apply flex-column layout to the element itself — it replaces .chart-wrap.
    this.style.cssText =
      "position:relative;display:flex;flex-direction:column;height:100%;min-height:0;" +
      "padding:var(--dp-spacing-sm,8px) var(--dp-spacing-md,12px) var(--dp-spacing-md,12px);" +
      "box-sizing:border-box;overflow:visible;isolation:isolate;z-index:3;";

    // Only inject HTML once (guard against re-insertion).
    if (this.querySelector("#chart")) return;

    // Inject a scoped <style> block followed by the chart shell markup.
    this.innerHTML = `<style>${styles}</style>
      <div class="chart-top-slot" id="chart-top-slot" hidden></div>
      <div class="chart-preview-overlay" id="chart-preview-overlay" hidden></div>
      <div class="chart-scroll-viewport" id="chart-scroll-viewport">
        <div class="chart-stage" id="chart-stage">
          <div class="chart-loading active" id="loading" aria-hidden="true">
            <div class="chart-loading-spinner"></div>
          </div>
          <div class="chart-message" id="chart-message"></div>
          <canvas id="chart"></canvas>
          <div class="chart-icon-overlay" id="chart-icon-overlay"></div>
          <div class="chart-crosshair" id="chart-crosshair" hidden>
            <div class="crosshair-line vertical" id="crosshair-vertical"></div>
            <div class="crosshair-line horizontal" id="crosshair-horizontal"></div>
            <div class="crosshair-points" id="crosshair-points"></div>
          </div>
          <button type="button" class="chart-add-annotation" id="chart-add-annotation" hidden aria-label="Create data point">
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
          <ha-tooltip for="chart-add-annotation" placement="bottom" distance="8" show-delay="1000">Create Data Point</ha-tooltip>
          <div class="chart-zoom-selection" id="chart-zoom-selection" hidden></div>
        </div>
      </div>
      <div class="chart-axis-overlay left" id="chart-axis-left"></div>
      <div class="chart-axis-overlay right" id="chart-axis-right"></div>
      <button type="button" class="chart-zoom-out" id="chart-zoom-out" hidden>
        <ha-icon icon="mdi:magnify-minus-outline"></ha-icon>
        <span>Zoom out</span>
      </button>
      <button type="button" class="chart-adjust-axis" id="chart-adjust-axis" hidden>
        <span>Adjust Y-Axis</span>
      </button>
      <div class="tooltip" id="tooltip">
        <div class="tt-time" id="tt-time"></div>
        <div class="tt-value" id="tt-value" style="display:none"></div>
        <div class="tt-series" id="tt-series" style="display:none"></div>
        <div class="tt-message-row" id="tt-message-row" style="display:none">
          <span class="tt-dot" id="tt-dot"></span>
          <span class="tt-message" id="tt-message"></span>
        </div>
        <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
        <div class="tt-entities" id="tt-entities" style="display:none"></div>
      </div>
      <div class="tooltip secondary" id="anomaly-tooltip">
        <div class="tt-secondary">
          <div class="tt-secondary-title" id="tt-secondary-title"></div>
          <div class="tt-secondary-text" id="tt-secondary-description"></div>
          <div class="tt-secondary-text" id="tt-secondary-alert"></div>
          <div class="tt-secondary-text muted" id="tt-secondary-instruction"></div>
        </div>
      </div>
      <div id="annotation-tooltips"></div>
      <div class="legend" id="legend"></div>`;
  }

  // ── Public API — set by parent card after construction ──────────────────────
  private _hass: HassLike | null = null;

  get hass(): HassLike | null {
    return this._hass;
  }

  set hass(value: HassLike | null) {
    this._hass = value;
  }

  _config: Record<string, unknown> = {};

  // ── Instance state ──────────────────────────────────────────────────────────

  /** Whether the legend should wrap to multiple rows. */
  _legendWrapRows = false;

  /** When true, the comparison axis scale has been manually adjusted by the user. */
  _adjustComparisonAxisScale = false;

  /** Monotonically-incrementing request ID — stale draws are discarded. */
  _drawRequestId = 0;

  /** Cached analysis result keyed by a content hash. */
  _analysisCache: { key: string; result: AnalysisResult } | null = null;

  /** Backend anomaly data keyed by entity ID. */
  _backendAnomalyByEntity: Map<string, unknown> = new Map();

  /** Backend anomaly data keyed by comparison window ID + entity ID. */
  _backendComparisonAnomalyByKey: Map<string, unknown> = new Map();

  /** Entity IDs whose anomaly fetch is currently in-flight. */
  _pendingAnomalyEntityIds: Set<string> = new Set();

  /** Comparison window + entity keys whose anomaly fetch is currently in-flight. */
  _pendingComparisonAnomalyKeys: Set<string> = new Set();

  /**
   * Cleanup function returned by attachLineChartHover.
   * Must be called before re-attaching hover or before unmount.
   */
  _chartHoverCleanup: (() => void) | null = null;

  /**
   * Cleanup function returned by attachLineChartRangeZoom.
   * Must be called before re-attaching zoom or before unmount.
   */
  _chartZoomCleanup: (() => void) | null = null;

  /** True while the user is drag-zooming on the split chart overlay. */
  _chartZoomDragging = false;

  /** Last computed hover object — used by split-chart crosshair/tooltip. */
  _chartLastHover: unknown = null;

  /**
   * When true, scroll sync events from the secondary (comparison) chart
   * viewport are temporarily ignored to prevent feedback loops.
   */
  _scrollSyncSuspended = false;

  /**
   * The scrollLeft value of the last programmatic scroll, used to detect
   * and ignore the scroll event that the browser fires for that scroll.
   */
  _lastProgrammaticScrollLeft: number | null = null;

  /**
   * Set to true immediately before a programmatic scroll so the resulting
   * scroll event can be identified and skipped by the scroll handler.
   */
  _ignoreNextProgrammaticScrollEvent = false;

  /**
   * True while the user is in the process of creating a context annotation
   * (i.e. after clicking the "+" button but before the dialog closes).
   */
  _creatingContextAnnotation = false;

  // ── DOM helpers ─────────────────────────────────────────────────────────────
  // Use `this.querySelector` / `this.querySelectorAll` instead of
  // `this.shadowRoot.querySelector` because there is no shadow root.

  private _el(id: string): Element | null {
    return this.querySelector(`#${id}`);
  }

  private _els(selector: string): NodeListOf<Element> {
    return this.querySelectorAll(selector);
  }

  // ── Public draw-state helpers ───────────────────────────────────────────────

  /**
   * Show or hide the loading spinner.
   * Mirrors _setChartLoading from card-chart-base-legacy.js.
   */
  _setChartLoading(isLoading: boolean): void {
    const loadingEl = this._el("loading");
    if (!loadingEl) {
      return;
    }
    loadingEl.classList.toggle("active", !!isLoading);
  }

  /**
   * Set or clear the chart message (shown when data is unavailable).
   * Mirrors _setChartMessage from card-chart-base-legacy.js.
   */
  _setChartMessage(message = ""): void {
    const messageEl = this._el("chart-message");
    if (!messageEl) {
      return;
    }
    messageEl.textContent = message || "";
    messageEl.classList.toggle("visible", !!message);
  }

  // ── Chart frame helpers ─────────────────────────────────────────────────────

  /**
   * Draw an empty grid frame (shown while data is loading for the first time).
   * Ported from _drawEmptyChartFrame in card-history.js.
   */
  _drawEmptyChartFrame(t0: number, t1: number): void {
    const canvas = this._el("chart") as HTMLCanvasElement | null;
    const wrap = this as HTMLElement;
    const scrollViewport = this._el(
      "chart-scroll-viewport"
    ) as HTMLElement | null;
    const chartStage = this._el("chart-stage") as HTMLElement | null;
    if (!canvas) {
      return;
    }
    this._syncTopSlotOffset();
    const availableHeight = this._getAvailableChartHeight(280);
    const viewportWidth = Math.max(
      scrollViewport?.clientWidth || wrap?.clientWidth || 360,
      360
    );
    if (chartStage) {
      chartStage.style.width = `${viewportWidth}px`;
      chartStage.style.height = `${availableHeight}px`;
    }
    const { w, h } = (
      setupCanvas as (
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        cssHeight: number,
        cssWidth?: number | null
      ) => { w: number; h: number }
    )(canvas, chartStage || wrap, availableHeight, viewportWidth);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    renderer.drawGrid(
      t0,
      t1,
      [
        {
          key: "placeholder",
          min: 0,
          max: 1,
          side: "left",
          unit: "",
          color: null,
        },
      ],
      undefined,
      5,
      { fixedAxisOverlay: true }
    );
    renderChartAxisOverlays(
      this,
      renderer,
      (renderer as unknown as { _activeAxes?: unknown[] })._activeAxes || []
    );
  }

  /**
   * Compute the chart canvas height from the surrounding card layout.
   * Ported from _getAvailableChartHeight in card-history.js.
   * When called from within this component (no shadow root) all selectors
   * target the host element's light DOM ancestors via `closest`.
   */
  _getAvailableChartHeight(minChartHeight = 280): number {
    // Walk up to the ha-card ancestor which may live in the parent's shadow root.
    const card = this.closest("ha-card") as HTMLElement | null;
    const header = card?.querySelector(".card-header") as HTMLElement | null;
    const topSlot = this._el("chart-top-slot") as HTMLElement | null;
    const legend = this._el("legend") as HTMLElement | null;
    const scrollViewport = this._el(
      "chart-scroll-viewport"
    ) as HTMLElement | null;
    const wrap = this as HTMLElement;

    const cardHeight = card?.clientHeight || 0;
    const occupiedHeight =
      (header?.offsetHeight || 0) +
      (topSlot && !topSlot.hidden ? topSlot.offsetHeight || 0 : 0) +
      (legend?.offsetHeight || 0);
    const cardDerivedHeight = cardHeight
      ? Math.max(0, cardHeight - occupiedHeight)
      : 0;
    const viewportHeight = scrollViewport?.clientHeight || 0;
    const wrapHeight = wrap?.clientHeight || 0;

    return Math.max(
      minChartHeight,
      cardDerivedHeight || viewportHeight || wrapHeight || 0
    );
  }

  _syncTopSlotOffset(): void {
    const topSlot = this._el("chart-top-slot") as HTMLElement | null;
    const topSlotHeight =
      topSlot && !topSlot.hidden ? topSlot.offsetHeight || 0 : 0;
    this.style.setProperty("--dp-chart-top-slot-height", `${topSlotHeight}px`);
  }

  /**
   * Toggle the legend `wrap-rows` class based on the card height.
   * Ported from _updateLegendLayout in card-history.js.
   */
  _updateLegendLayout(legendEl: Element | null): void {
    if (!legendEl) {
      return;
    }
    const card = this.closest("ha-card") as HTMLElement | null;
    const cardHeight = card?.clientHeight || 0;
    if (this._legendWrapRows) {
      this._legendWrapRows =
        cardHeight >= HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX;
    } else {
      this._legendWrapRows = cardHeight >= HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX;
    }
    legendEl.classList.toggle("wrap-rows", this._legendWrapRows);
  }

  /**
   * Show or hide the "Adjust Y-Axis" button and wire up its click handler.
   * Ported from _setAdjustAxisButtonVisibility in card-history.js.
   */
  _setAdjustAxisButtonVisibility(
    visible: boolean,
    onAdjust?: () => void
  ): void {
    const button = this._el("chart-adjust-axis") as HTMLButtonElement | null;
    if (!button) {
      return;
    }
    button.hidden = !visible;
    if (visible) {
      button.onclick = () => {
        this._adjustComparisonAxisScale = true;
        onAdjust?.();
      };
      return;
    }
    button.onclick = null;
  }

  /**
   * Render (or clear) the comparison preview overlay badge.
   * Ported from _renderComparisonPreviewOverlay in card-history.js.
   */
  _renderComparisonPreviewOverlay(
    renderer: { pad?: { left?: number } } | null = null
  ): void {
    const overlayEl = this._el("chart-preview-overlay") as HTMLElement | null;
    if (!overlayEl) {
      return;
    }
    const overlay =
      (this._config?.comparison_preview_overlay as
        | { window_range_label?: string; actual_range_label?: string }
        | null
        | undefined) || null;
    if (!overlay?.window_range_label || !overlay?.actual_range_label) {
      overlayEl.hidden = true;
      overlayEl.innerHTML = "";
      return;
    }
    if (renderer?.pad?.left != null) {
      overlayEl.style.left = `${Math.max(8, renderer.pad.left + 8)}px`;
    } else {
      overlayEl.style.left = "";
    }
    overlayEl.innerHTML = `
      <div class="chart-preview-line"><strong>Date window:</strong> ${esc(overlay.window_range_label)}</div>
      <div class="chart-preview-line"><strong>Actual:</strong> ${esc(overlay.actual_range_label)}</div>
    `;
    overlayEl.hidden = false;
  }

  // ── Draw queue ──────────────────────────────────────────────────────────────

  /**
   * Queue an async draw, discarding any in-flight stale requests.
   * Ported from _queueDrawChart in card-history.js.
   */
  _queueDrawChart(
    histResult: unknown,
    statsResult: unknown,
    events: unknown[],
    t0: number,
    t1: number,
    options: Record<string, unknown> = {}
  ): void {
    const drawRequestId = ++this._drawRequestId;
    logger.log("[hass-datapoints history-card] draw queued", {
      drawRequestId,
      loading: options.loading ?? false,
    });
    (
      this._drawChart(histResult, statsResult, events, t0, t1, {
        ...options,
        drawRequestId,
      }) as Promise<void>
    ).catch((error: unknown) => {
      if (drawRequestId !== this._drawRequestId) {
        return;
      }
      logger.error("[hass-datapoints history-card] draw failed", error);
      this._setChartLoading(false);
      this._setChartMessage("Failed to render chart.");
    });
  }

  // ── Instance method stubs — implemented by the parent card / JS layer ────────

  /** Build normalised state list for an entity from histResult/statsResult. Overridden by parent. */
  _buildEntityStateList(
    entityId: string,
    histResult: unknown,
    statsResult: unknown
  ): Array<{ lu: number; s: string }> {
    const entityIds =
      this._seriesSettings
        ?.map((s: Record<string, string>) => s.entity_id)
        .filter(Boolean) ?? [];
    const historyStates = getHistoryStatesForEntity(
      histResult,
      entityId,
      entityIds
    );
    const rawHistory = normalizeNumericHistory(
      entityId,
      historyStates,
      this._config
    );
    const statsHistory = normalizeStatisticsHistory(
      entityId,
      statsResult,
      this._config
    );
    return mergeNumericHistoryWithStatistics(rawHistory, statsHistory);
  }

  /** Build binary state spans from a state list. */
  _buildBinaryStateSpans(
    stateList: Array<{ lu: number; s: string }>,
    t0: number,
    t1: number
  ): Array<{ start: number; end: number; state: string }> {
    const spans: Array<{ start: number; end: number; state: string }> = [];
    if (!stateList.length) return spans;
    let current = stateList[0];
    for (let i = 1; i < stateList.length; i++) {
      const next = stateList[i];
      const start = Math.max(current.lu * 1000, t0);
      const end = Math.min(next.lu * 1000, t1);
      if (end > start) {
        spans.push({ start, end, state: current.s });
      }
      current = next;
    }
    // Last span extends to t1
    const lastStart = Math.max(current.lu * 1000, t0);
    if (t1 > lastStart) {
      spans.push({ start: lastStart, end: t1, state: current.s });
    }
    return spans;
  }

  /** Return the "on" label for a binary_sensor entity. */
  _binaryOnLabel(entityId: string): string {
    const dc = (
      this._hass as {
        states?: Record<string, { attributes: Record<string, unknown> }>;
      } | null
    )?.states?.[entityId]?.attributes?.device_class as string | undefined;
    return binaryOnLabel(dc ?? "");
  }

  /** Return the "off" label for a binary_sensor entity. */
  _binaryOffLabel(entityId: string): string {
    const dc = (
      this._hass as {
        states?: Record<string, { attributes: Record<string, unknown> }>;
      } | null
    )?.states?.[entityId]?.attributes?.device_class as string | undefined;
    return binaryOffLabel(dc ?? "");
  }

  /** Normalise the statistics history array for an entity. */
  _normalizeStatisticsHistory(
    entityId: string,
    statsData: unknown
  ): Array<{ lu: number; s: string }> {
    return normalizeStatisticsHistory(entityId, statsData, this._config);
  }

  /** Render legend items for the given series and binary backgrounds. */
  _renderLegend(series: unknown[], binaryBackgrounds: unknown[]): void {
    const legendEl = this.querySelector("#legend") as HTMLElement | null;
    if (!legendEl) return;
    const allItems = [
      ...(series as Array<{ entityId: string; label: string; color: string }>),
      ...(binaryBackgrounds as Array<{
        entityId: string;
        label: string;
        color: string;
      }>),
    ];
    this._updateLegendLayout(legendEl);
    legendEl.innerHTML = allItems
      .map((item) => {
        const hidden = this._hiddenSeries?.has(item.entityId);
        return `<div class="legend-item">
        <button type="button" class="legend-toggle" aria-pressed="${hidden ? "false" : "true"}" data-entity-id="${esc(item.entityId)}">
          <span class="legend-line" style="background:${esc(item.color)}"></span>
          <span class="legend-label">${esc(item.label)}</span>
        </button>
      </div>`;
      })
      .join("");
    legendEl.querySelectorAll(".legend-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entityId = (btn as HTMLElement).dataset.entityId;
        if (!entityId || !this._hiddenSeries) return;
        if (this._hiddenSeries.has(entityId)) {
          this._hiddenSeries.delete(entityId);
        } else {
          this._hiddenSeries.add(entityId);
        }
        btn.setAttribute(
          "aria-pressed",
          this._hiddenSeries.has(entityId) ? "false" : "true"
        );
        this._queueDrawChart(...(this._lastDrawArgs ?? []));
      });
    });
  }

  /** Draw a single series line onto the renderer. */
  _drawSeriesLine(
    renderer: unknown,
    pts: [number, number][],
    color: string,
    t0: number,
    t1: number,
    min: number,
    max: number,
    opts: Record<string, unknown>
  ): void {
    (
      renderer as {
        drawLine: (
          pts: [number, number][],
          color: string,
          t0: number,
          t1: number,
          min: number,
          max: number,
          opts: Record<string, unknown>
        ) => void;
      }
    ).drawLine(pts, color, t0, t1, min, max, opts);
  }

  /** Draw event point icons onto the renderer. */
  _drawRecordedEventPoints(
    _renderer: unknown,
    _visibleSeries: unknown[],
    _events: unknown[],
    _t0: number,
    _t1: number,
    _opts: Record<string, unknown>
  ): Array<{ event: { id: string }; value: number; unit: string }> {
    const renderer = _renderer as {
      ctx: CanvasRenderingContext2D;
      xOf(t: number, t0: number, t1: number): number;
      yOf(v: number, min: number, max: number): number;
      pad: { top: number; left: number };
      ch: number;
      _interpolateValue(pts: [number, number][], t: number): number | null;
    };
    const series = _visibleSeries as Array<{
      entityId: string;
      pts: [number, number][];
      axis?: { min: number; max: number };
      unit?: string;
      color: string;
    }>;
    const events = _events as Array<{
      id: string;
      timestamp: string;
      entity_ids?: string[];
      message?: string;
      icon?: string;
      color?: string;
    }>;
    const opts = _opts as Record<string, unknown>;

    const overlay = this.querySelector(
      "#chart-icon-overlay"
    ) as HTMLElement | null;
    if (overlay && !opts.skipOverlayClear) {
      overlay.innerHTML = "";
    }
    if (!renderer || !events?.length) {
      return [];
    }
    const yOffset = Number.isFinite(opts.yOffset as number)
      ? (opts.yOffset as number)
      : 0;
    const hits: Array<{
      event: { id: string };
      value: number | null;
      unit: string;
      x: number;
      y: number;
      entityId: string | null;
    }> = [];
    const { ctx } = renderer;
    const showIcons = opts.showIcons !== false;

    for (const event of events) {
      const timestamp = new Date(event.timestamp).getTime();
      if (timestamp < _t0 || timestamp > _t1) continue;

      const eventEntityIds = Array.isArray(event.entity_ids)
        ? event.entity_ids
        : [];
      const x = renderer.xOf(timestamp, _t0, _t1);

      const findSeriesWithValue = (candidates: typeof series) => {
        for (const candidate of candidates) {
          if (!candidate?.pts?.length || !candidate.axis) continue;
          const candidateValue = renderer._interpolateValue(
            candidate.pts,
            timestamp
          );
          if (candidateValue == null) continue;
          return { series: candidate, value: candidateValue };
        }
        return null;
      };

      const matchingSeriesCandidates = eventEntityIds
        .map((entityId) => series.find((entry) => entry.entityId === entityId))
        .filter((s): s is NonNullable<typeof s> => s != null);
      const matchingSeriesHit = findSeriesWithValue(matchingSeriesCandidates);
      const linkedToOtherTarget =
        eventEntityIds.length > 0 && matchingSeriesCandidates.length === 0;
      const fallbackSeriesHit =
        matchingSeriesHit ||
        (linkedToOtherTarget
          ? null
          : findSeriesWithValue([...series].reverse()));
      const targetSeries = fallbackSeriesHit?.series || null;
      const hasNumericTarget = !!(
        targetSeries?.pts?.length && targetSeries.axis
      );
      const value = hasNumericTarget
        ? (fallbackSeriesHit?.value ?? null)
        : null;
      if (hasNumericTarget && value == null) continue;
      let y;
      if (hasNumericTarget) {
        y = renderer.yOf(value!, targetSeries!.axis!.min, targetSeries!.axis!.max);
      } else if (linkedToOtherTarget) {
        y = renderer.pad.top + renderer.ch;
      } else {
        y = renderer.pad.top + 12;
      }
      const color = event.color || targetSeries?.color || "#03a9f4";
      const outerRadius = showIcons ? 13 : 6;
      const innerRadius = showIcons ? 11 : 4;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      const navigateToHistory = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        navigateToDataPointsHistory(
          this,
          {
            entity_id: event.entity_ids || [],
            device_id: [],
            area_id: [],
            label_id: [],
          },
          {
            start_time:
              ((this._config as Record<string, unknown>)
                ?.start_time as string) || null,
            end_time:
              ((this._config as Record<string, unknown>)?.end_time as string) ||
              null,
            zoom_start_time:
              ((this._config as Record<string, unknown>)
                ?.zoom_start_time as string) || null,
            zoom_end_time:
              ((this._config as Record<string, unknown>)
                ?.zoom_end_time as string) || null,
            datapoint_scope: (this._config as Record<string, unknown>)
              ?.datapoint_scope as string,
          }
        );
      };

      if (overlay && showIcons) {
        const iconEl = document.createElement("button");
        iconEl.type = "button";
        iconEl.className = "chart-event-icon";
        iconEl.style.left = `${x}px`;
        iconEl.style.top = `${y + yOffset}px`;
        iconEl.title = event.message || "Open related history";
        iconEl.setAttribute(
          "aria-label",
          event.message || "Open related history"
        );
        iconEl.innerHTML = `<ha-icon icon="${esc(event.icon || "mdi:bookmark")}" style="color:${contrastColor(color)}"></ha-icon>`;
        iconEl.addEventListener("click", navigateToHistory);
        overlay.appendChild(iconEl);
      } else if (overlay) {
        const hitEl = document.createElement("button");
        hitEl.type = "button";
        hitEl.className = "chart-event-icon";
        hitEl.style.left = `${x}px`;
        hitEl.style.top = `${y + yOffset}px`;
        hitEl.title = event.message || "Open related history";
        hitEl.setAttribute(
          "aria-label",
          event.message || "Open related history"
        );
        hitEl.addEventListener("click", navigateToHistory);
        overlay.appendChild(hitEl);
      }

      hits.push({
        event: event as { id: string },
        entityId: targetSeries?.entityId || null,
        unit: targetSeries?.unit || "",
        value: value as number,
        x,
        y,
      });
    }

    return hits as Array<{
      event: { id: string };
      value: number;
      unit: string;
    }>;
  }

  /** Get [min, max] extent for an axis value array. */
  _getAxisValueExtent(values: number[]): { min: number; max: number } | null {
    return getAxisValueExtent(values);
  }

  /** Sync chart viewport scroll to the current zoom range. */
  _syncChartViewportScroll(
    _t0: number,
    _t1: number,
    _canvasWidth: number
  ): void {
    if (!this._chartScrollViewportEl || !this._zoomRange) {
      return;
    }
    const viewportWidth = (this._chartScrollViewportEl as HTMLElement)
      .clientWidth;
    const totalMs = Math.max(1, _t1 - _t0);
    const visibleSpanMs =
      totalMs *
      Math.min(1, viewportWidth / Math.max(_canvasWidth, viewportWidth));
    const maxScrollLeft = Math.max(
      0,
      Math.max(_canvasWidth, viewportWidth) - viewportWidth
    );
    const maxStartOffsetMs = Math.max(0, totalMs - visibleSpanMs);
    const clampedStart = clampChartValue(
      this._zoomRange.start,
      _t0,
      _t1 - visibleSpanMs
    );
    const ratio =
      maxStartOffsetMs > 0 ? (clampedStart - _t0) / maxStartOffsetMs : 0;
    const nextLeft = ratio * maxScrollLeft;
    this._scrollSyncSuspended = true;
    this._lastProgrammaticScrollLeft = nextLeft;
    this._ignoreNextProgrammaticScrollEvent = true;
    (this._chartScrollViewportEl as HTMLElement).scrollLeft = nextLeft;
    window.requestAnimationFrame(() => {
      this._scrollSyncSuspended = false;
    });
  }

  /** Ensure the context annotation dialog element is present. */
  _ensureContextAnnotationDialog(): void {
    const parentCard = (this.getRootNode() as ShadowRoot | null)
      ?.host as Record<string, unknown> | null;
    if (
      parentCard?._annotationDialog &&
      typeof (parentCard._annotationDialog as Record<string, unknown>)
        .ensureDialog === "function"
    ) {
      (parentCard._annotationDialog as { ensureDialog(): void }).ensureDialog();
    }
  }

  /** Open the context annotation dialog with the given hover data. */
  _openContextAnnotationDialog(_hover: unknown): void {
    const parentCard = (this.getRootNode() as ShadowRoot | null)
      ?.host as Record<string, unknown> | null;
    if (
      parentCard?._annotationDialog &&
      typeof (parentCard._annotationDialog as Record<string, unknown>).open ===
        "function"
    ) {
      (parentCard._annotationDialog as { open(hover: unknown): void }).open(
        _hover
      );
    }
  }

  /** Handle context menu on the chart canvas. */
  async _handleChartContextMenu(_hover: unknown): Promise<void> {
    const parentCard = (this.getRootNode() as ShadowRoot | null)
      ?.host as Record<string, unknown> | null;
    const annotationDialog = parentCard?._annotationDialog as {
      isOpen?(): boolean;
      open(hover: unknown): void;
    } | null;
    if (!_hover || !this._hass || annotationDialog?.isOpen?.()) {
      return;
    }
    this._openContextAnnotationDialog(_hover);
  }

  /** Handle add-annotation click from the chart hover layer. */
  _handleChartAddAnnotation(_hover: unknown): void {
    const parentCard = (this.getRootNode() as ShadowRoot | null)
      ?.host as Record<string, unknown> | null;
    const annotationDialog = parentCard?._annotationDialog as {
      isOpen?(): boolean;
    } | null;
    if (!_hover || !this._hass || annotationDialog?.isOpen?.()) {
      return;
    }
    this._openContextAnnotationDialog(_hover);
  }

  /** Handle anomaly cluster click (add annotation prefill). Overridden by parent. */
  _handleAnomalyAddAnnotation(): void {
    // Overridden by parent.
  }

  /** Build an annotation prefill object from anomaly regions. Overridden by parent. */
  _buildAnomalyAnnotationPrefill(): unknown {
    return null;
  }

  /** Fire backend anomaly detection requests. */
  _fireBackendAnomalyRequests(
    _anomalyEntityIds: string[],
    _analysisMap: Map<string, unknown>,
    _startIso: string,
    _endIso: string
  ): void {
    if (!_anomalyEntityIds || !_anomalyEntityIds.length || !this._hass) {
      return;
    }
    _anomalyEntityIds.forEach((entityId) => {
      const analysis = _analysisMap.get(entityId) as
        | Record<string, unknown>
        | undefined;
      if (!analysis) {
        return;
      }
      const config = {
        anomaly_methods: analysis.anomaly_methods,
        anomaly_sensitivity: analysis.anomaly_sensitivity,
        anomaly_overlap_mode: analysis.anomaly_overlap_mode,
        anomaly_rate_window: analysis.anomaly_rate_window,
        anomaly_zscore_window: analysis.anomaly_zscore_window,
        anomaly_persistence_window: analysis.anomaly_persistence_window,
        trend_method: analysis.trend_method,
        trend_window: analysis.trend_window,
      };
      const configKey = JSON.stringify({
        ...config,
        anomaly_methods: [
          ...((config.anomaly_methods as string[] | null) || []),
        ].sort(),
      });
      const cached = this._backendAnomalyByEntity.get(entityId) as
        | { configKey: string; clusters: unknown[] }
        | undefined;
      if (cached && cached.configKey === configKey) return;
      this._pendingAnomalyEntityIds.add(entityId);
      this._setChartLoading(true);
      fetchAnomaliesFromBackend(
        this._hass,
        entityId,
        _startIso,
        _endIso,
        config
      )
        .then((clusters) => {
          this._pendingAnomalyEntityIds.delete(entityId);
          // Discard if the time range changed while this request was in-flight.
          if (
            _startIso !== new Date(this._lastT0).toISOString() ||
            _endIso !== new Date(this._lastT1).toISOString()
          ) {
            if (this._pendingAnomalyEntityIds.size === 0) {
              this._setChartLoading(false);
            }
            return;
          }
          this._backendAnomalyByEntity.set(entityId, { configKey, clusters });
          // Patch the cached analysisResult directly so the worker cache remains valid.
          if (this._analysisCache?.result) {
            const existing = this._analysisCache.result.anomalySeries || [];
            const idx = existing.findIndex((e) => e.entityId === entityId);
            const entry = { entityId, anomalyClusters: clusters };
            if (idx >= 0) {
              existing[idx] = entry;
            } else {
              existing.push(entry);
            }
          }
          if (this._lastHistResult && this._lastEvents) {
            this._queueDrawChart(
              this._lastHistResult,
              this._lastStatsResult || {},
              this._filterEvents(this._lastEvents),
              this._lastT0,
              this._lastT1,
              { loading: this._pendingAnomalyEntityIds.size > 0 }
            );
          } else if (this._pendingAnomalyEntityIds.size === 0) {
            this._setChartLoading(false);
          }
        })
        .catch((err) => {
          this._pendingAnomalyEntityIds.delete(entityId);
          if (this._pendingAnomalyEntityIds.size === 0) {
            this._setChartLoading(false);
          }
          logger.warn(
            "[hass-datapoints history-card] backend anomaly fetch failed",
            { entityId, err }
          );
        });
    });
  }

  /** Dispatch a zoom preview event. */
  _dispatchZoomPreview(_range: unknown): void {
    const range = _range as { startTime: number; endTime: number } | null;
    this.dispatchEvent(
      new CustomEvent("hass-datapoints-chart-zoom", {
        bubbles: true,
        composed: true,
        detail: range
          ? {
              startTime: range.startTime,
              endTime: range.endTime,
              preview: true,
            }
          : { startTime: null, endTime: null, preview: true },
      })
    );
  }

  /** Apply a zoom range to the chart. */
  _applyZoomRange(_startTime: number, _endTime: number): void {
    const start = Math.min(_startTime, _endTime);
    const end = Math.max(_startTime, _endTime);
    if (!(start < end)) {
      return;
    }
    this._zoomRange = { start, end };
    this.dispatchEvent(
      new CustomEvent("hass-datapoints-zoom-apply", {
        bubbles: true,
        composed: true,
        detail: { start, end },
      })
    );
    this._queueDrawChart(...(this._lastDrawArgs ?? []));
  }

  /** Clear the active zoom range. */
  _clearZoomRange(): void {
    if (!this._zoomRange) {
      return;
    }
    this._zoomRange = null;
    this.dispatchEvent(
      new CustomEvent("hass-datapoints-zoom-apply", {
        bubbles: true,
        composed: true,
        detail: null,
      })
    );
    this._queueDrawChart(...(this._lastDrawArgs ?? []));
  }

  /** Filter events list by hidden IDs and message filter. */
  _filterEvents(_events: unknown[]): unknown[] {
    const events = _events as Array<{
      id?: string;
      message?: string;
      annotation?: string;
      entity_ids?: string[];
    }>;
    const query = String(
      (this._config as Record<string, unknown>)?.message_filter || ""
    )
      .trim()
      .toLowerCase();
    const visibleEvents = events.filter(
      (event) => !this._hiddenEventIds.has(event?.id ?? "")
    );
    if (!query) {
      return visibleEvents;
    }
    return visibleEvents.filter((event) => {
      const haystack = [
        event?.message || "",
        event?.annotation || "",
        ...(event?.entity_ids || []).filter(Boolean),
      ]
        .join("\n")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  /** Build correlated anomaly spans across series. */
  _buildCorrelatedAnomalySpans(
    _visibleSeries: unknown[],
    _anomalyClustersMap: Map<string, unknown>,
    _analysisMap: Map<string, unknown>
  ): Array<{ start: number; end: number }> {
    const visibleSeries = _visibleSeries as Array<{
      entityId: string;
      pts: [number, number][];
    }>;
    const anomalyClustersMap = _anomalyClustersMap as Map<
      string,
      Array<{ points: Array<{ timeMs: number }> }>
    >;

    const seriesIntervals: Array<{
      entityId: string;
      intervals: Array<{ start: number; end: number }>;
    }> = [];
    for (const seriesItem of visibleSeries) {
      const analysis = _analysisMap.get(seriesItem.entityId) as
        | Record<string, unknown>
        | undefined;
      if (analysis?.show_anomalies !== true) continue;
      const clusters = anomalyClustersMap.get(seriesItem.entityId) || [];
      if (!clusters.length) continue;

      const pts = seriesItem.pts;
      let tolerance = 60000;
      if (Array.isArray(pts) && pts.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < pts.length; i++) {
          const diff = pts[i][0] - pts[i - 1][0];
          if (diff > 0) intervals.push(diff);
        }
        if (intervals.length) {
          intervals.sort((a, b) => a - b);
          const mid = Math.floor(intervals.length / 2);
          tolerance =
            intervals.length % 2 === 0
              ? (intervals[mid - 1] + intervals[mid]) / 2
              : intervals[mid];
          tolerance = Math.max(tolerance, 1000);
        }
      }

      const entityIntervals: Array<{ start: number; end: number }> = [];
      for (const cluster of clusters) {
        if (!Array.isArray(cluster.points) || cluster.points.length === 0)
          continue;
        const startTime = cluster.points[0]?.timeMs;
        const endTime = cluster.points[cluster.points.length - 1]?.timeMs;
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) continue;
        entityIntervals.push({
          start: Math.min(startTime, endTime) - tolerance,
          end: Math.max(startTime, endTime) + tolerance,
        });
      }
      if (entityIntervals.length) {
        seriesIntervals.push({
          entityId: seriesItem.entityId,
          intervals: entityIntervals,
        });
      }
    }

    if (seriesIntervals.length < 2) return [];

    const events: Array<{ time: number; delta: number; entityId: string }> = [];
    for (const { entityId, intervals } of seriesIntervals) {
      for (const { start, end } of intervals) {
        events.push({ time: start, delta: 1, entityId });
        events.push({ time: end, delta: -1, entityId });
      }
    }
    events.sort((a, b) => a.time - b.time || a.delta - b.delta);

    const activeCounts = new Map<string, number>();
    const spans: Array<{ start: number; end: number }> = [];
    let spanStart: number | null = null;

    for (const event of events) {
      const prev = activeCounts.get(event.entityId) || 0;
      const next = prev + event.delta;
      if (next <= 0) {
        activeCounts.delete(event.entityId);
      } else {
        activeCounts.set(event.entityId, next);
      }
      const activeCount = activeCounts.size;
      if (spanStart === null && activeCount >= 2) {
        spanStart = event.time;
      } else if (spanStart !== null && activeCount < 2) {
        spans.push({ start: spanStart, end: event.time });
        spanStart = null;
      }
    }
    if (spanStart !== null && events.length > 0) {
      spans.push({ start: spanStart, end: events[events.length - 1].time });
    }

    return spans;
  }

  /** Filter out annotated anomaly clusters. */
  _filterAnnotatedAnomalyClusters(
    _seriesItem: unknown,
    _events: unknown[]
  ): unknown[] {
    const seriesItem = _seriesItem as {
      entityId: string;
      anomalyClusters?: Array<{ points: Array<{ timeMs: number }> }>;
    };
    if (
      !Array.isArray(seriesItem?.anomalyClusters) ||
      seriesItem.anomalyClusters.length === 0
    ) {
      return [];
    }
    const visibleEvents = Array.isArray(_events)
      ? (_events as Array<{
          entity_ids?: string[];
          timestamp: string;
        }>)
      : [];
    if (visibleEvents.length === 0) {
      return seriesItem.anomalyClusters;
    }

    const getClusterRange = (cluster: {
      points: Array<{ timeMs: number }>;
    }) => {
      if (!Array.isArray(cluster.points) || cluster.points.length === 0)
        return null;
      const startTime = cluster.points[0]?.timeMs;
      const endTime = cluster.points[cluster.points.length - 1]?.timeMs;
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;
      return {
        startTime: Math.min(startTime, endTime),
        endTime: Math.max(startTime, endTime),
      };
    };

    return seriesItem.anomalyClusters.filter((cluster) => {
      const clusterRange = getClusterRange(cluster);
      if (!clusterRange) return true;
      return !visibleEvents.some((event) => {
        const eventEntityIds = Array.isArray(event.entity_ids)
          ? (event.entity_ids as string[]).filter(Boolean)
          : [];
        if (!eventEntityIds.includes(seriesItem.entityId)) return false;
        const eventTime = new Date(event.timestamp).getTime();
        if (!Number.isFinite(eventTime)) return false;
        return (
          eventTime >= clusterRange.startTime &&
          eventTime <= clusterRange.endTime
        );
      });
    });
  }

  _fireComparisonBackendAnomalyRequests(
    drawableComparisonResults: Array<{
      id: string;
      time_offset_ms: number;
      histResult: unknown;
      statsResult: unknown;
      label?: string;
    }>,
    analysisMap: Map<string, unknown>,
    renderT0: number,
    renderT1: number
  ): void {
    if (!drawableComparisonResults.length || !this._hass) {
      return;
    }
    const startIso = new Date(renderT0).toISOString();
    const endIso = new Date(renderT1).toISOString();
    drawableComparisonResults.forEach((comparisonWindow) => {
      const comparisonStartIso = new Date(
        renderT0 + comparisonWindow.time_offset_ms
      ).toISOString();
      const comparisonEndIso = new Date(
        renderT1 + comparisonWindow.time_offset_ms
      ).toISOString();
      this._seriesSettings.forEach((seriesSetting) => {
        const entityId = String(seriesSetting.entity_id || "");
        if (!entityId || this._hiddenSeries.has(entityId)) {
          return;
        }
        const analysis = analysisMap.get(entityId) as
          | Record<string, unknown>
          | undefined;
        if (!analysis || analysis.show_anomalies !== true) {
          return;
        }
        const config = {
          anomaly_methods: analysis.anomaly_methods,
          anomaly_sensitivity: analysis.anomaly_sensitivity,
          anomaly_overlap_mode: analysis.anomaly_overlap_mode,
          anomaly_rate_window: analysis.anomaly_rate_window,
          anomaly_zscore_window: analysis.anomaly_zscore_window,
          anomaly_persistence_window: analysis.anomaly_persistence_window,
          trend_method: analysis.trend_method,
          trend_window: analysis.trend_window,
          sample_interval: analysis.sample_interval,
          sample_aggregate: analysis.sample_aggregate,
        };
        const configKey = JSON.stringify({
          ...config,
          windowId: comparisonWindow.id,
          startIso,
          endIso,
          anomaly_methods: [
            ...((config.anomaly_methods as string[] | null) || []),
          ].sort(),
        });
        const cacheKey = this._getComparisonAnomalyCacheKey(
          comparisonWindow.id,
          entityId
        );
        const cached = this._backendComparisonAnomalyByKey.get(cacheKey) as
          | { configKey: string; clusters: unknown[] }
          | undefined;
        if (cached && cached.configKey === configKey) {
          return;
        }
        if (this._pendingComparisonAnomalyKeys.has(cacheKey)) {
          return;
        }
        this._pendingComparisonAnomalyKeys.add(cacheKey);
        fetchAnomaliesFromBackend(
          this._hass,
          entityId,
          comparisonStartIso,
          comparisonEndIso,
          config
        )
          .then((clusters) => {
            this._pendingComparisonAnomalyKeys.delete(cacheKey);
            if (
              startIso !== new Date(this._lastT0).toISOString() ||
              endIso !== new Date(this._lastT1).toISOString()
            ) {
              return;
            }
            const shiftedClusters = this._shiftComparisonAnomalyClusters(
              Array.isArray(clusters) ? clusters : [],
              comparisonWindow.time_offset_ms
            );
            this._backendComparisonAnomalyByKey.set(cacheKey, {
              configKey,
              clusters: shiftedClusters,
            });
            if (this._lastHistResult && this._lastEvents) {
              this._queueDrawChart(
                this._lastHistResult,
                this._lastStatsResult || {},
                this._filterEvents(this._lastEvents),
                this._lastT0,
                this._lastT1,
                { loading: false }
              );
            }
          })
          .catch(() => {
            this._pendingComparisonAnomalyKeys.delete(cacheKey);
          });
      });
    });
  }

  /** Render per-row axis overlays for split-view chart. */
  _renderSplitAxisOverlays(_tracks: unknown[]): void {
    const tracks = _tracks as Array<{
      renderer: {
        pad: { left: number; top: number };
        ch: number;
        yOf(v: number, min: number, max: number): number;
        _formatAxisTick(v: number, unit?: string): string;
      };
      axis?: { ticks?: number[]; min: number; max: number; unit?: string };
      rowOffset: number;
    }>;
    const leftEl = this.querySelector("#chart-axis-left") as HTMLElement | null;
    const rightEl = this.querySelector(
      "#chart-axis-right"
    ) as HTMLElement | null;
    if (!leftEl || !rightEl || !tracks.length) {
      return;
    }

    const primaryRenderer = tracks[0].renderer;
    const leftWidth = Math.max(0, primaryRenderer.pad.left);

    leftEl.style.width = `${leftWidth}px`;
    rightEl.style.width = "0px";

    this.style.setProperty("--dp-chart-axis-left-width", `${leftWidth}px`);
    this.style.setProperty("--dp-chart-axis-right-width", "0px");

    const labelRight = 10;
    let labelsHtml = "";
    for (const { renderer, axis, rowOffset } of tracks) {
      if (!axis?.ticks?.length) continue;
      for (const tick of axis.ticks) {
        const y = rowOffset + renderer.yOf(tick, axis.min, axis.max);
        const formatted = renderer._formatAxisTick(tick, axis.unit);
        labelsHtml += `<div class="chart-axis-label" style="top:${Math.round(y) + 1}px;right:${labelRight}px;text-align:right;">${esc(formatted)}</div>`;
      }
      if (axis.unit) {
        const unitY = rowOffset + Math.max(0, primaryRenderer.pad.top - 18);
        labelsHtml += `<div class="chart-axis-unit" style="top:${unitY}px;right:${labelRight}px;text-align:right;">${esc(axis.unit)}</div>`;
      }
    }

    leftEl.innerHTML = `<div class="chart-axis-divider"></div>${labelsHtml}`;
    leftEl.classList.add("visible");
    rightEl.innerHTML = "";
    rightEl.classList.remove("visible");
  }

  // ── State stubs — owned by the parent card / JS layer ─────────────────────────

  /** Ordered series settings from the card config. */
  get _seriesSettings(): Array<{
    entity_id: string;
    color?: string;
    [key: string]: unknown;
  }> {
    return Array.isArray(
      (this._config as Record<string, unknown>)?.series_settings
    )
      ? ((this._config as Record<string, unknown>).series_settings as Array<{
          entity_id: string;
          color?: string;
          [key: string]: unknown;
        }>)
      : [];
  }

  /** Active comparison windows from the card config. */
  get _comparisonWindows(): unknown[] {
    return Array.isArray(
      (this._config as Record<string, unknown>)?.comparison_windows
    )
      ? ((this._config as Record<string, unknown>)
          .comparison_windows as unknown[])
      : [];
  }

  _getDrawableComparisonResults(
    comparisonResults: Array<{
      id: string;
      time_offset_ms: number;
      histResult: unknown;
      statsResult: unknown;
      label?: string;
    }>
  ): Array<{
    id: string;
    time_offset_ms: number;
    histResult: unknown;
      statsResult: unknown;
      label?: string;
    }> {
    const drawableComparisonWindowIds = new Set(
      this._comparisonWindows
        .map((window) =>
          String((window as Record<string, unknown> | null)?.id || "")
        )
        .filter((id) => id.length > 0)
    );
    const selectedComparisonWindowId = String(
      ((this._config as Record<string, unknown>)
        ?.selected_comparison_window_id as string) || ""
    );
    const hoveredComparisonWindowId = String(
      ((this._config as Record<string, unknown>)
        ?.hovered_comparison_window_id as string) || ""
    );
    if (selectedComparisonWindowId) {
      drawableComparisonWindowIds.add(selectedComparisonWindowId);
    }
    if (hoveredComparisonWindowId) {
      drawableComparisonWindowIds.add(hoveredComparisonWindowId);
    }
    if (drawableComparisonWindowIds.size === 0) {
      return [];
    }
    return comparisonResults.filter((window) =>
      drawableComparisonWindowIds.has(String(window.id || ""))
    );
  }

  _getComparisonAnomalyCacheKey(windowId: string, entityId: string): string {
    return `${windowId}:${entityId}`;
  }

  _shiftComparisonAnomalyClusters(
    clusters: unknown[],
    timeOffsetMs: number
  ): unknown[] {
    return (Array.isArray(clusters) ? clusters : []).map((cluster) => ({
      ...(cluster as Record<string, unknown>),
      points: Array.isArray((cluster as Record<string, unknown>).points)
        ? ((cluster as Record<string, unknown>).points as unknown[]).map(
            (point) => ({
              ...(point as Record<string, unknown>),
              timeMs:
                Number((point as Record<string, unknown>).timeMs) -
                timeOffsetMs,
            })
          )
        : [],
    }));
  }

  async _resolveComparisonWindowPoints(
    entityId: string,
    comparisonWindow: {
      id: string;
      time_offset_ms: number;
      histResult: unknown;
      statsResult: unknown;
      label?: string;
    },
    analysis: SeriesAnalysis,
    renderT0: number,
    renderT1: number
  ): Promise<[number, number][]> {
    const stateList = this._buildEntityStateList(
      entityId,
      comparisonWindow.histResult,
      comparisonWindow.statsResult || {}
    );
    const rawPoints: [number, number][] = [];
    for (const state of stateList) {
      const value = parseFloat(state.s);
      if (!Number.isNaN(value)) {
        rawPoints.push([
          Math.round(state.lu * 1000) - comparisonWindow.time_offset_ms,
          value,
        ]);
      }
    }

    const interval = (analysis.sample_interval as string) || "raw";
    if (interval === "raw" || !this._hass) {
      return rawPoints;
    }

    const winStartIso = new Date(
      renderT0 + comparisonWindow.time_offset_ms
    ).toISOString();
    const winEndIso = new Date(
      renderT1 + comparisonWindow.time_offset_ms
    ).toISOString();
    const sampledPts = (await fetchDownsampledHistory(
      this._hass,
      entityId,
      winStartIso,
      winEndIso,
      interval,
      (analysis.sample_aggregate as string) || "mean"
    )) as [number, number][] | null;
    if (!Array.isArray(sampledPts) || sampledPts.length === 0) {
      const targetIntervalMs = SAMPLE_INTERVAL_MS[interval] ?? 0;
      if (targetIntervalMs <= 0 || rawPoints.length === 0) {
        return rawPoints;
      }
      const sampleAggregate = ((analysis.sample_aggregate as string) ||
        "mean") as Parameters<typeof downsamplePts>[2];
      return downsamplePts(rawPoints, targetIntervalMs, sampleAggregate);
    }

    let finalPts = sampledPts.map(
      ([timestamp, value]) =>
        [timestamp - comparisonWindow.time_offset_ms, value] as [number, number]
    );
    const statsForEntity = this._normalizeStatisticsHistory(
      entityId,
      comparisonWindow.statsResult || {}
    );
    const statsPts: [number, number][] = statsForEntity
      .map(
        (state) =>
          [
            Math.round(state.lu * 1000) - comparisonWindow.time_offset_ms,
            parseFloat(state.s),
          ] as [number, number]
      )
      .filter(([, value]) => !Number.isNaN(value));

    if (statsPts.length > 0) {
      const firstSampledMs = finalPts[0][0];
      const lastSampledMs = finalPts[finalPts.length - 1][0];
      const rawOutsidePts = statsPts.filter(
        ([timestamp]) => timestamp < firstSampledMs || timestamp > lastSampledMs
      );
      if (rawOutsidePts.length > 0) {
        const targetIntervalMs = SAMPLE_INTERVAL_MS[interval] ?? 0;
        const sampleAggregate = ((analysis.sample_aggregate as string) ||
          "mean") as Parameters<typeof downsamplePts>[2];
        const outsideStatsPts: [number, number][] =
          targetIntervalMs > 0
            ? downsamplePts(rawOutsidePts, targetIntervalMs, sampleAggregate)
            : rawOutsidePts;
        finalPts = [...outsideStatsPts, ...finalPts];
        finalPts.sort((a, b) => a[0] - b[0]);
      }
    }

    return finalPts;
  }

  _drawComparisonAnalysisOverlays({
    renderer,
    entityId,
    seriesColor,
    comparisonPts,
    analysis,
    renderT0,
    renderT1,
    axis,
    rateAxis = null,
    events = [],
    comparisonWindowId,
  }: {
    renderer: ChartRenderer;
    entityId: string;
    seriesColor: string;
    comparisonPts: [number, number][];
    analysis: SeriesAnalysis;
    renderT0: number;
    renderT1: number;
    axis: { min: number; max: number };
    rateAxis?: { min: number; max: number } | null;
    events?: unknown[];
    comparisonWindowId: string;
  }): void {
    if (analysis.show_threshold_analysis === true) {
      const thresholdValue = Number(analysis.threshold_value);
      if (Number.isFinite(thresholdValue)) {
        if (analysis.show_threshold_shading === true && comparisonPts.length) {
          renderer.drawThresholdArea(
            comparisonPts,
            thresholdValue,
            seriesColor,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            {
              mode:
                analysis.threshold_direction === "below" ? "below" : "above",
              fillAlpha: 0.08,
            }
          );
        }
        renderer.drawLine(
          [
            [renderT0, thresholdValue],
            [renderT1, thresholdValue],
          ],
          hexToRgba(seriesColor, 0.28),
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          { lineOpacity: 0.34, lineWidth: 1.05, dashed: true }
        );
      }
    }

    if (analysis.show_summary_stats === true) {
      const summaryStats = this._buildSummaryStats(comparisonPts);
      if (
        Number.isFinite(summaryStats.min) &&
        Number.isFinite(summaryStats.max) &&
        Number.isFinite(summaryStats.mean)
      ) {
        if (analysis.show_summary_stats_shading === true) {
          renderer.drawGradientBand(
            summaryStats.min,
            summaryStats.mean,
            seriesColor,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            { fillAlpha: 0.04 }
          );
          renderer.drawGradientBand(
            summaryStats.max,
            summaryStats.mean,
            seriesColor,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            { fillAlpha: 0.04 }
          );
        }
        const summaryEntries = [
          { value: summaryStats.min, alpha: 0.24, width: 1, dotted: true },
          { value: summaryStats.mean, alpha: 0.44, width: 1.45, dotted: false },
          { value: summaryStats.max, alpha: 0.24, width: 1, dotted: true },
        ];
        for (const entry of summaryEntries) {
          renderer.drawLine(
            [
              [renderT0, entry.value],
              [renderT1, entry.value],
            ],
            hexToRgba(seriesColor, entry.alpha),
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            {
              lineOpacity: entry.alpha + 0.08,
              lineWidth: entry.width,
              dotted: entry.dotted,
            }
          );
        }
      }
    }

    if (analysis.show_trend_lines === true && comparisonPts.length >= 2) {
      const trendPts = this._buildTrendPoints(
        comparisonPts,
        analysis.trend_method,
        analysis.trend_window
      );
      if (trendPts.length >= 2) {
        const trendOptions = this._getTrendRenderOptions(
          analysis.trend_method as string,
          false
        );
        renderer.drawLine(
          trendPts,
          hexToRgba(seriesColor, Math.max(0.3, trendOptions.colorAlpha - 0.18)),
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          {
            lineOpacity: Math.max(0.3, trendOptions.lineOpacity - 0.18),
            lineWidth: Math.max(1.35, trendOptions.lineWidth - 0.35),
            dashed: trendOptions.dashed,
            dotted: trendOptions.dotted,
          }
        );
      }
    }

    if (
      analysis.show_rate_of_change === true &&
      rateAxis &&
      comparisonPts.length >= 2
    ) {
      const ratePts = this._buildRateOfChangePoints(
        comparisonPts,
        analysis.rate_window
      );
      if (ratePts.length >= 2) {
        renderer.drawLine(
          ratePts,
          hexToRgba(seriesColor, 0.52),
          renderT0,
          renderT1,
          rateAxis.min,
          rateAxis.max,
          {
            lineOpacity: 0.46,
            lineWidth: 1.35,
            dashPattern: [6, 3, 1.5, 3],
          }
        );
      }
    }

    if (analysis.show_anomalies === true) {
      const cacheKey = this._getComparisonAnomalyCacheKey(
        comparisonWindowId,
        entityId
      );
      const cached = this._backendComparisonAnomalyByKey.get(cacheKey) as
        | { clusters?: unknown[] }
        | undefined;
      const clusters = Array.isArray(cached?.clusters) ? cached.clusters : [];
      if (clusters.length > 0) {
        const regionOptions = {
          strokeAlpha: 0.72,
          lineWidth: 1.6,
          haloWidth: 3.4,
          haloColor: "rgba(255,255,255,0.72)",
          haloAlpha: 0.64,
          fillColor: hexToRgba(seriesColor, 0.06),
          fillAlpha: 1,
          pointPadding: 8,
          minRadiusX: 8,
          minRadiusY: 8,
        };
        const filteredClusters = this._filterAnnotatedAnomalyClusters(
          {
            entityId,
            anomalyClusters: clusters,
          },
          events
        );
        if (filteredClusters.length > 0) {
          renderer.drawAnomalyClusters(
            filteredClusters,
            hexToRgba(seriesColor, 0.74),
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            regionOptions
          );
        }
      }
    }

  }

  /** Last comparison results fetched by the card. */
  _lastComparisonResults: unknown[] | null = null;

  /** Series entity IDs that are currently hidden from the chart. */
  _hiddenSeries: Set<string> = new Set();

  /** Entity IDs tracked by this card instance. */
  _entityIds: string[] = [];

  /** Previous drawn endpoints per entity, used for live-update logging. */
  _previousSeriesEndpoints: Map<string, { t: number; v: number }> = new Map();

  /** The currently active zoom range, or null if not zoomed. */
  _zoomRange: { start: number; end: number } | null = null;

  /** The chart scroll viewport element (set during draw). */
  _chartScrollViewportEl: Element | null = null;

  /** The chart stage element (set during draw). */
  _chartStageEl: Element | null = null;

  /** The annotation dialog controller. */
  _annotationDialog: { isOpen?(): boolean } | null = null;

  /** Debounce timer for dispatching zoom-apply after a user scroll. */
  _scrollZoomApplyTimer: ReturnType<typeof setTimeout> | null = null;

  /** Bound scroll handler — wired to _chartScrollViewportEl. */
  _onChartScroll: () => void = () => {
    if (this._scrollSyncSuspended || this._ignoreNextProgrammaticScrollEvent) {
      this._ignoreNextProgrammaticScrollEvent = false;
      return;
    }
    if (!this._chartScrollViewportEl || !this._zoomRange) return;
    const viewport = this._chartScrollViewportEl as HTMLElement;
    const scrollLeft = viewport.scrollLeft;
    const maxScrollLeft = Math.max(
      1,
      viewport.scrollWidth - viewport.clientWidth
    );
    const ratio = scrollLeft / maxScrollLeft;
    const totalMs = Math.max(1, this._lastT1 - this._lastT0);
    const spanMs = this._zoomRange.end - this._zoomRange.start;
    const maxStartOffsetMs = Math.max(0, totalMs - spanMs);
    const newStart = this._lastT0 + ratio * maxStartOffsetMs;
    this._zoomRange = { start: newStart, end: newStart + spanMs };
    this._dispatchZoomPreview({
      startTime: newStart,
      endTime: newStart + spanMs,
    });
    if (this._scrollZoomApplyTimer !== null) {
      clearTimeout(this._scrollZoomApplyTimer);
    }
    this._scrollZoomApplyTimer = setTimeout(() => {
      this._scrollZoomApplyTimer = null;
      if (!this._zoomRange) return;
      this.dispatchEvent(
        new CustomEvent("hass-datapoints-zoom-apply", {
          bubbles: true,
          composed: true,
          detail: { start: this._zoomRange.start, end: this._zoomRange.end },
        })
      );
    }, 300);
  };

  /** Last drawn anomaly regions (for hover hit-testing). */
  _lastAnomalyRegions: unknown[] = [];

  /** Cache of last drawn history result. */
  _lastHistResult: unknown = null;

  /** Cache of last drawn statistics result. */
  _lastStatsResult: unknown = null;

  /** Cache of last drawn events list. */
  _lastEvents: unknown[] | null = null;

  /** Cache of last draw time range start (ms). */
  _lastT0: number = 0;

  /** Cache of last draw time range end (ms). */
  _lastT1: number = 0;

  /** Cache of last _drawChart argument list. */
  _lastDrawArgs: unknown[] = [];

  /** Backend anomaly cache keyed by entity ID. Already declared above. */
  // _backendAnomalyByEntity — declared above

  /**
   * Full chart draw implementation.
   * Ported from _drawChart in card-history.js.
   */
  async _drawChart(
    histResult: unknown,
    statsResult: unknown,
    events: unknown[],
    t0: number,
    t1: number,
    options: Record<string, unknown> = {}
  ): Promise<void> {
    hideTooltip(this);
    this._syncTopSlotOffset();

    const canvas = this.querySelector("#chart") as HTMLCanvasElement | null;
    const zoomOutButton = this.querySelector(
      "#chart-zoom-out"
    ) as HTMLButtonElement | null;
    const wrap = this as HTMLElement;
    const scrollViewport = this.querySelector(
      "#chart-scroll-viewport"
    ) as HTMLElement | null;
    const chartStage = this.querySelector("#chart-stage") as HTMLElement | null;
    this._chartScrollViewportEl = scrollViewport;
    this._chartStageEl = chartStage;
    const series: Array<{
      entityId: string;
      legendEntityId: string;
      label: string;
      unit: string;
      pts: [number, number][];
      color: string;
      axisKey: string;
      axis?: unknown;
    }> = [];
    const axes: Array<{
      key: string;
      unit: string;
      color: string;
      side: string;
      values: number[];
    }> = [];
    const axisMap = new Map<string, (typeof axes)[0]>();
    const binaryBackgrounds: Array<{
      entityId: string;
      label: string;
      color: string;
      onLabel: string;
      offLabel: string;
      spans: unknown[];
    }> = [];
    const seriesSettings = this._seriesSettings;
    const analysisMap = this._getSeriesAnalysisMap();
    const comparisonResults = Array.isArray(this._lastComparisonResults)
      ? (this._lastComparisonResults as Array<{
          id: string;
          time_offset_ms: number;
          histResult: unknown;
          statsResult: unknown;
          label?: string;
        }>)
      : [];
    const drawableComparisonResults =
      this._getDrawableComparisonResults(comparisonResults);
    const selectedComparisonWindowId =
      ((this._config as Record<string, unknown>)
        ?.selected_comparison_window_id as string | null) || null;
    const hoveredComparisonWindowId =
      ((this._config as Record<string, unknown>)
        ?.hovered_comparison_window_id as string | null) || null;
    const comparisonPreviewActive = this._comparisonWindows.length > 0;
    const delinkYAxis =
      (this._config as Record<string, unknown>)?.delink_y_axis === true;
    const autoAdjustHoveredComparisonAxis =
      comparisonPreviewActive &&
      !!hoveredComparisonWindowId &&
      !this._zoomRange &&
      !this._chartZoomDragging;
    const hoveringDifferentComparison =
      !!hoveredComparisonWindowId &&
      !!selectedComparisonWindowId &&
      hoveredComparisonWindowId !== selectedComparisonWindowId;
    const hasSelectedComparisonWindow = !!selectedComparisonWindowId;

    seriesSettings.forEach((seriesSetting, i) => {
      const entityId = seriesSetting.entity_id;
      const domain = entityId.split(".")[0];
      if (domain === "binary_sensor") {
        const stateList = this._buildEntityStateList(
          entityId,
          histResult,
          statsResult
        );
        const spans = this._buildBinaryStateSpans(stateList, t0, t1);
        if (spans.length) {
          binaryBackgrounds.push({
            entityId,
            label: entityName(this._hass, entityId) || entityId,
            color: seriesSetting.color || COLORS[i % COLORS.length],
            onLabel: this._binaryOnLabel(entityId),
            offLabel: this._binaryOffLabel(entityId),
            spans,
          });
        }
        return;
      }
      const stateList = this._buildEntityStateList(
        entityId,
        histResult,
        statsResult
      );
      const pts: [number, number][] = [];
      const unit =
        ((
          this._hass as {
            states?: Record<string, { attributes: Record<string, unknown> }>;
          } | null
        )?.states?.[entityId]?.attributes?.unit_of_measurement as string) || "";
      const axisKey = delinkYAxis
        ? `${unit || "__unitless__"}::${entityId}`
        : unit || "__unitless__";
      let axis = axisMap.get(axisKey);
      if (!axis) {
        axis = {
          key: axisKey,
          unit,
          color: seriesSetting.color || COLORS[i % COLORS.length],
          side: axisMap.size === 0 ? "left" : "right",
          values: [],
        };
        axisMap.set(axisKey, axis);
        axes.push(axis);
      }
      for (const s of stateList) {
        const v = parseFloat(s.s);
        if (!Number.isNaN(v)) {
          pts.push([Math.round(s.lu * 1000), v]);
          axis.values.push(v);
        }
      }
      if (pts.length) {
        series.push({
          entityId,
          legendEntityId: entityId,
          label: entityName(this._hass, entityId) || entityId,
          unit,
          pts,
          color: seriesSetting.color || COLORS[i % COLORS.length],
          axisKey,
        });
      }
    });

    // Fetch backend-downsampled pts for entities with sample_interval !== "raw".
    // This replaces the raw pts built from histResult above.
    const _startIso = new Date(t0).toISOString();
    const _endIso = new Date(t1).toISOString();
    if (series.length && this._hass) {
      // Clear backend anomaly cache when the time range changes.
      if (t0 !== this._lastT0 || t1 !== this._lastT1) {
        this._backendAnomalyByEntity.clear();
        this._backendComparisonAnomalyByKey.clear();
      }
      await Promise.all(
        series.map(async (seriesItem) => {
          const analysis =
            analysisMap.get(seriesItem.entityId) ||
            normalizeHistorySeriesAnalysis(null);
          const interval =
            ((analysis as SeriesAnalysis).sample_interval as string) || "raw";
          if (interval === "raw") return;
          try {
            const sampledPts = (await fetchDownsampledHistory(
              this._hass,
              seriesItem.entityId,
              _startIso,
              _endIso,
              interval,
              ((analysis as SeriesAnalysis).sample_aggregate as string) ||
                "mean"
            )) as [number, number][] | null;
            if (Array.isArray(sampledPts) && sampledPts.length > 0) {
              // Re-include statistics data for periods not covered by the downsampled range.
              // The backend only queries the recorder (high-res), so older long-term stats
              // that predate the recorder range would otherwise be lost when we replace pts.
              const statsForEntity = this._normalizeStatisticsHistory(
                seriesItem.entityId,
                statsResult
              );
              const statsPts: [number, number][] = statsForEntity
                .map(
                  (s) =>
                    [Math.round(s.lu * 1000), parseFloat(s.s)] as [
                      number,
                      number,
                    ]
                )
                .filter(([, v]) => !Number.isNaN(v));

              let finalPts: [number, number][] = sampledPts;
              if (statsPts.length > 0) {
                const firstSampledMs = sampledPts[0][0];
                const lastSampledMs = sampledPts[sampledPts.length - 1][0];
                const rawOutsidePts = statsPts.filter(
                  ([t]) => t < firstSampledMs || t > lastSampledMs
                );
                if (rawOutsidePts.length > 0) {
                  // Re-aggregate the historical stats pts to the same interval
                  // as the downsampled recorder data so the chart looks visually
                  // consistent (e.g. 24h means throughout, not hourly oscillations
                  // on the left and 24h means on the right).
                  const targetIntervalMs = SAMPLE_INTERVAL_MS[interval] ?? 0;
                  const sampleAggregate = (((analysis as SeriesAnalysis)
                    .sample_aggregate as string) || "mean") as Parameters<
                    typeof downsamplePts
                  >[2];
                  const outsideStatsPts: [number, number][] =
                    targetIntervalMs > 0
                      ? downsamplePts(
                          rawOutsidePts,
                          targetIntervalMs,
                          sampleAggregate
                        )
                      : rawOutsidePts;
                  finalPts = [...outsideStatsPts, ...sampledPts];
                  finalPts.sort((a, b) => a[0] - b[0]);
                }
              }

              seriesItem.pts = finalPts;
              // Update axis values to reflect the full merged data.
              const axisEntry = axes.find(
                (ax) => ax.key === seriesItem.axisKey
              );
              if (axisEntry) {
                axisEntry.values = finalPts
                  .map(([, v]) => v)
                  .filter(Number.isFinite);
              }
            }
          } catch (err) {
            logger.warn(
              "[hass-datapoints history-card] downsampled history fetch failed",
              { entityId: seriesItem.entityId, err }
            );
          }
        })
      );
    }

    for (const seriesItem of series) {
      if (!seriesItem.pts.length) {
        continue;
      }
      const lastPt = seriesItem.pts[seriesItem.pts.length - 1];
      const prev = this._previousSeriesEndpoints.get(seriesItem.entityId);
      if (!prev) {
        logger.log("[hass-datapoints history-card] series initial draw", {
          entityId: seriesItem.entityId,
          pointCount: seriesItem.pts.length,
          lastPt,
        });
      } else if (lastPt[0] !== prev.t || lastPt[1] !== prev.v) {
        logger.log(
          "[hass-datapoints history-card] series updated — live update detected",
          {
            entityId: seriesItem.entityId,
            pointCount: seriesItem.pts.length,
            prev,
            lastPt,
          }
        );
      } else {
        logger.log(
          "[hass-datapoints history-card] series unchanged — no new data",
          {
            entityId: seriesItem.entityId,
            pointCount: seriesItem.pts.length,
            lastPt,
          }
        );
      }
      this._previousSeriesEndpoints.set(seriesItem.entityId, {
        t: lastPt[0],
        v: lastPt[1],
      });
    }

    if (!series.length && !binaryBackgrounds.length) {
      this._setAdjustAxisButtonVisibility(false);
      this._renderComparisonPreviewOverlay();
      const sameRangeAsLastDraw =
        Number.isFinite(this._lastT0) &&
        Number.isFinite(this._lastT1) &&
        this._lastT0 === t0 &&
        this._lastT1 === t1 &&
        Array.isArray(this._lastDrawArgs) &&
        this._lastDrawArgs.length > 0;
      this._setChartLoading(!!options.loading);
      this._setChartMessage(
        options.loading ? "" : "No numeric data in the selected time range."
      );
      if (sameRangeAsLastDraw) {
        return;
      }
      this._lastHistResult = histResult;
      this._lastStatsResult = statsResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;
      this._lastDrawArgs = [histResult, statsResult, events, t0, t1, options];
      return;
    }

    this._lastHistResult = histResult;
    this._lastStatsResult = statsResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;
    this._lastDrawArgs = [histResult, statsResult, events, t0, t1, options];

    const visibleSeries = series.filter(
      (entry) => !this._hiddenSeries.has(entry.legendEntityId || entry.entityId)
    );
    const selectedComparisonResult =
      drawableComparisonResults.find(
        (window) => window.id === selectedComparisonWindowId
      ) || null;
    const selectedComparisonSeriesMap = new Map<
      string,
      {
        entityId: string;
        label: string;
        unit: string;
        color: string;
        pts: [number, number][];
      }
    >();
    if (selectedComparisonResult) {
      for (let index = 0; index < seriesSettings.length; index += 1) {
        const seriesSetting = seriesSettings[index];
        const entityId = seriesSetting.entity_id;
        if (entityId.split(".")[0] === "binary_sensor") {
          continue;
        }
        if (this._hiddenSeries.has(entityId)) {
          continue;
        }
        const unit =
          ((
            this._hass as {
              states?: Record<string, { attributes: Record<string, unknown> }>;
            } | null
          )?.states?.[entityId]?.attributes?.unit_of_measurement as string) ||
          "";
        const analysis =
          analysisMap.get(entityId) ||
          (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
        const points = await this._resolveComparisonWindowPoints(
          entityId,
          selectedComparisonResult,
          analysis,
          t0,
          t1
        );
        if (!points.length) {
          continue;
        }
        selectedComparisonSeriesMap.set(entityId, {
          entityId,
          label: entityName(this._hass, entityId) || entityId,
          unit,
          color: seriesSetting.color || COLORS[index % COLORS.length],
          pts: points,
        });
      }
    }
    // Build comparison data for any window referenced by anomaly_comparison_window_id
    const allComparisonWindowsData: Record<
      string,
      Record<string, [number, number][]>
    > = {};
    for (const seriesItem of visibleSeries) {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        (analysis as SeriesAnalysis).show_anomalies !== true ||
        !(analysis as SeriesAnalysis).anomaly_methods?.includes(
          "comparison_window"
        ) ||
        !(analysis as SeriesAnalysis).anomaly_comparison_window_id
      ) {
        continue;
      }
      const windowId = (analysis as SeriesAnalysis)
        .anomaly_comparison_window_id as string;
      if (!allComparisonWindowsData[windowId]) {
        allComparisonWindowsData[windowId] = {};
      }
      if (!allComparisonWindowsData[windowId][seriesItem.entityId]) {
        const compResult = comparisonResults.find((win) => win.id === windowId);
        if (compResult) {
          const pts = await this._resolveComparisonWindowPoints(
            seriesItem.entityId,
            compResult,
            analysis as SeriesAnalysis,
            t0,
            t1
          );
          if (pts.length) {
            allComparisonWindowsData[windowId][seriesItem.entityId] = pts;
          }
        }
      }
    }
    const analysisEntityIds = visibleSeries
      .filter((s) => {
        const a = analysisMap.get(s.entityId) || {};
        return (
          (a as SeriesAnalysis).show_trend_lines ||
          (a as SeriesAnalysis).show_summary_stats ||
          (a as SeriesAnalysis).show_rate_of_change
        );
      })
      .map((s) => s.entityId);
    // onAnalysisProgress is called by _computeHistoryAnalysis only when a real worker
    // computation is needed (not on cache hits). Each call receives the current 0–100 value.
    const onAnalysisProgress = analysisEntityIds.length
      ? (progress: number) => {
          this.dispatchEvent(
            new CustomEvent("hass-datapoints-analysis-computing", {
              bubbles: true,
              composed: true,
              detail: {
                computing: true,
                entityIds: analysisEntityIds,
                progress,
              },
            })
          );
        }
      : null;
    const analysisResult = await this._computeHistoryAnalysis(
      visibleSeries,
      selectedComparisonSeriesMap as Map<string, SeriesItem>,
      analysisMap,
      hasSelectedComparisonWindow,
      allComparisonWindowsData,
      t0,
      t1,
      onAnalysisProgress
    );
    if (analysisEntityIds.length) {
      this.dispatchEvent(
        new CustomEvent("hass-datapoints-analysis-computing", {
          bubbles: true,
          composed: true,
          detail: {
            computing: false,
            entityIds: analysisEntityIds,
            progress: 100,
          },
        })
      );
    }

    // Merge available backend anomaly results into analysisResult.
    const _anomalyEntityIds = visibleSeries
      .filter((s) => {
        const a = analysisMap.get(s.entityId);
        return (
          a &&
          (a as SeriesAnalysis).show_anomalies === true &&
          Array.isArray((a as SeriesAnalysis).anomaly_methods) &&
          (a as SeriesAnalysis).anomaly_methods!.length > 0
        );
      })
      .map((s) => s.entityId);
    if (_anomalyEntityIds.length > 0) {
      const merged = _anomalyEntityIds
        .map((entityId) => {
          const cached = this._backendAnomalyByEntity.get(entityId) as
            | { clusters: unknown[] }
            | undefined;
          if (!cached) return null;
          return { entityId, anomalyClusters: cached.clusters };
        })
        .filter(Boolean);
      analysisResult.anomalySeries = merged as AnalysisResult["anomalySeries"];
    }
    if (
      options.drawRequestId &&
      options.drawRequestId !== this._drawRequestId
    ) {
      return;
    }

    // Restore axis overlays and the primary canvas in case a previous split render hid them.
    if (canvas) {
      canvas.style.display = "";
    }
    chartStage
      ?.querySelectorAll(".split-series-row")
      .forEach((el) => (el as HTMLElement).remove());
    chartStage?.querySelector("#chart-split-overlay")?.remove();
    const axisLeftEl = this.querySelector(
      "#chart-axis-left"
    ) as HTMLElement | null;
    const axisRightEl = this.querySelector(
      "#chart-axis-right"
    ) as HTMLElement | null;
    if (axisLeftEl) {
      axisLeftEl.style.display = "";
    }
    if (axisRightEl) {
      axisRightEl.style.display = "";
    }

    let minChartHeight: number;
    if (series.length) {
      minChartHeight = 280;
    } else if (binaryBackgrounds.length) {
      minChartHeight = 100;
    } else {
      minChartHeight = 280;
    }
    const availableHeight = this._getAvailableChartHeight(minChartHeight);
    const viewportWidth = Math.max(
      (scrollViewport as HTMLElement | null)?.clientWidth ||
        (wrap as HTMLElement | null)?.clientWidth ||
        360,
      360
    );
    const totalSpanMs = Math.max(1, t1 - t0);
    const zoomSpanMs = this._zoomRange
      ? Math.max(1, this._zoomRange.end - this._zoomRange.start)
      : null;
    const rawZoomMultiplier = zoomSpanMs ? totalSpanMs / zoomSpanMs : 1;
    const zoomMultiplier = clampChartValue(
      rawZoomMultiplier,
      1,
      HISTORY_CHART_MAX_ZOOM_MULTIPLIER
    );
    const canvasWidth = Math.min(
      HISTORY_CHART_MAX_CANVAS_WIDTH_PX,
      zoomSpanMs
        ? Math.max(viewportWidth, Math.round(viewportWidth * zoomMultiplier))
        : viewportWidth
    );

    if (
      (this._config as Record<string, unknown>)?.split_view === true &&
      visibleSeries.length >= 2
    ) {
      if (zoomOutButton) {
        zoomOutButton.hidden = !this._zoomRange;
        zoomOutButton.onclick = () => this._clearZoomRange();
      }
      this._renderLegend(series, binaryBackgrounds);
      await this._drawSplitChart({
        visibleSeries,
        binaryBackgrounds,
        events,
        renderT0: t0,
        renderT1: t1,
        canvasWidth,
        availableHeight,
        chartStage,
        canvas,
        wrap: wrap as HTMLElement,
        options,
        drawableComparisonResults,
        selectedComparisonWindowId,
        hoveredComparisonWindowId,
        comparisonPreviewActive,
        hoveringDifferentComparison,
        analysisResult,
        analysisMap,
        hasSelectedComparisonWindow,
      });
      if (this._chartScrollViewportEl) {
        this._chartScrollViewportEl.removeEventListener(
          "scroll",
          this._onChartScroll
        );
        this._chartScrollViewportEl.addEventListener(
          "scroll",
          this._onChartScroll,
          { passive: true }
        );
        this._syncChartViewportScroll(t0, t1, canvasWidth);
      }
      this._fireBackendAnomalyRequests(
        _anomalyEntityIds,
        analysisMap,
        _startIso,
        _endIso,
        options.drawRequestId as number
      );
      return;
    }

    if (chartStage) {
      chartStage.style.width = `${canvasWidth}px`;
      chartStage.style.height = `${availableHeight}px`;
    }
    // Restore default vertical overflow in non-split mode (split mode may have set it to auto).
    if (scrollViewport) {
      scrollViewport.style.overflowY = "";
    }
    const { w, h } = (
      setupCanvas as (
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        cssHeight: number,
        cssWidth?: number | null
      ) => { w: number; h: number }
    )(canvas!, (chartStage || wrap)!, availableHeight, canvasWidth);
    const renderer = new ChartRenderer(canvas!, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    const renderT0 = t0;
    const renderT1 = t1;

    const trendPointsMap = new Map<string, [number, number][]>(
      (analysisResult?.trendSeries || []).map((entry) => [
        (entry as { entityId: string; pts: [number, number][] }).entityId,
        (entry as { entityId: string; pts: [number, number][] }).pts,
      ])
    );
    const ratePointsMap = new Map<string, [number, number][]>(
      (analysisResult?.rateSeries || []).map((entry) => [
        (entry as { entityId: string; pts: [number, number][] }).entityId,
        (entry as { entityId: string; pts: [number, number][] }).pts,
      ])
    );
    const deltaPointsMap = new Map<string, [number, number][]>(
      (analysisResult?.deltaSeries || []).map((entry) => [
        (entry as { entityId: string; pts: [number, number][] }).entityId,
        (entry as { entityId: string; pts: [number, number][] }).pts,
      ])
    );
    const summaryStatsMap = new Map<string, unknown>(
      (analysisResult?.summaryStats || []).map((entry) => [
        (entry as { entityId: string }).entityId,
        entry,
      ])
    );
    const anomalyClustersMap = new Map<string, unknown[]>(
      (analysisResult?.anomalySeries || []).map((entry) => [
        (entry as { entityId: string; anomalyClusters: unknown[] }).entityId,
        (entry as { entityId: string; anomalyClusters: unknown[] })
          .anomalyClusters,
      ])
    );
    const hiddenSourceEntityIds = new Set<string>();
    const hiddenComparisonEntityIds = new Set<string>();
    visibleSeries.forEach((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        this._seriesShouldHideSource(
          analysis as SeriesAnalysis,
          hasSelectedComparisonWindow
        )
      ) {
        hiddenSourceEntityIds.add(seriesItem.entityId);
      }
      if (
        (analysis as SeriesAnalysis).hide_source_series === true &&
        (analysis as SeriesAnalysis).show_delta_analysis === true &&
        hasSelectedComparisonWindow
      ) {
        hiddenComparisonEntityIds.add(seriesItem.entityId);
      }
    });
    const anyTrendCrosshairs = visibleSeries.some((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      return (
        (analysis as SeriesAnalysis).show_trend_lines === true &&
        (analysis as SeriesAnalysis).show_trend_crosshairs === true
      );
    });
    this._setChartLoading(!!options.loading);
    this._setChartMessage("");
    if (zoomOutButton) {
      zoomOutButton.hidden = !this._zoomRange;
      zoomOutButton.onclick = () => this._clearZoomRange();
    }

    const comparisonAxisValues = new Map<string, number[]>();
    if (this._adjustComparisonAxisScale || autoAdjustHoveredComparisonAxis) {
      for (const win of drawableComparisonResults) {
        if (
          autoAdjustHoveredComparisonAxis &&
          hoveredComparisonWindowId &&
          win.id !== hoveredComparisonWindowId
        ) {
          continue;
        }
        for (const seriesSetting of seriesSettings) {
          const entityId = seriesSetting.entity_id;
          if (entityId.split(".")[0] === "binary_sensor") {
            continue;
          }
          if (this._hiddenSeries.has(entityId)) {
            continue;
          }
          const unit =
            ((
              this._hass as {
                states?: Record<
                  string,
                  { attributes: Record<string, unknown> }
                >;
              } | null
            )?.states?.[entityId]?.attributes?.unit_of_measurement as string) ||
            "";
          const axisKey = delinkYAxis
            ? `${unit || "__unitless__"}::${entityId}`
            : unit || "__unitless__";
          const analysis =
            analysisMap.get(entityId) ||
            (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
          const points = await this._resolveComparisonWindowPoints(
            entityId,
            win,
            analysis,
            renderT0,
            renderT1
          );
          for (const [, numericValue] of points) {
            if (!comparisonAxisValues.has(axisKey)) {
              comparisonAxisValues.set(axisKey, []);
            }
            comparisonAxisValues.get(axisKey)!.push(numericValue);
          }
        }
      }
    }

    const deltaAxisMap = new Map<
      string,
      {
        key: string;
        unit: string;
        color: string;
        side: string;
        values: number[];
      }
    >();
    const rateAxisMap = new Map<
      string,
      {
        key: string;
        unit: string;
        color: string;
        side: string;
        values: number[];
      }
    >();
    visibleSeries.forEach((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        (analysis as SeriesAnalysis).show_delta_analysis === true &&
        hasSelectedComparisonWindow &&
        (analysis as SeriesAnalysis).show_delta_lines === true
      ) {
        const deltaPoints = deltaPointsMap.get(seriesItem.entityId) || [];
        if (deltaPoints.length) {
          const axisKey = `delta:${seriesItem.axisKey}`;
          const unitLabel = seriesItem.unit ? `Δ ${seriesItem.unit}` : "Δ";
          let axis = deltaAxisMap.get(axisKey);
          if (!axis) {
            axis = {
              key: axisKey,
              unit: unitLabel,
              color: seriesItem.color,
              side: "right",
              values: [],
            };
            deltaAxisMap.set(axisKey, axis);
          }
          deltaPoints.forEach((point) => {
            axis!.values.push(point[1]);
          });
        }
      }
      if ((analysis as SeriesAnalysis).show_rate_of_change === true) {
        const ratePoints = ratePointsMap.get(seriesItem.entityId) || [];
        if (ratePoints.length) {
          const axisKey = `rate:${seriesItem.axisKey}`;
          const unitLabel = seriesItem.unit ? `${seriesItem.unit}/h` : "Rate/h";
          let axis = rateAxisMap.get(axisKey);
          if (!axis) {
            axis = {
              key: axisKey,
              unit: unitLabel,
              color: seriesItem.color,
              side: "right",
              values: [],
            };
            rateAxisMap.set(axisKey, axis);
          }
          ratePoints.forEach((point) => {
            axis!.values.push(point[1]);
          });
        }
      }
    });

    type ResolvedAxis = {
      key: string;
      unit: string;
      color: string | null;
      side: string;
      min: number;
      max: number;
    };

    const resolvedAxes: ResolvedAxis[] = axes
      .filter((axis) => axis.values.length)
      .map((axis) => {
        const axisValues = series
          .filter((entry) => entry.axisKey === axis.key)
          .flatMap((entry) => entry.pts.map((point) => point[1]));
        if (
          (this._adjustComparisonAxisScale ||
            autoAdjustHoveredComparisonAxis) &&
          comparisonAxisValues.has(axis.key)
        ) {
          axisValues.push(...comparisonAxisValues.get(axis.key)!);
        }
        const extent = this._getAxisValueExtent(axisValues);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad,
        };
      })
      .filter((ax): ax is NonNullable<typeof ax> => ax !== null);
    const deltaResolvedAxes: ResolvedAxis[] = Array.from(deltaAxisMap.values())
      .filter((axis) => axis.values.length)
      .map((axis) => {
        const extent = this._getAxisValueExtent(axis.values);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad,
        };
      })
      .filter((ax): ax is NonNullable<typeof ax> => ax !== null);
    const rateResolvedAxes: ResolvedAxis[] = Array.from(rateAxisMap.values())
      .filter((axis) => axis.values.length)
      .map((axis) => {
        const extent = this._getAxisValueExtent(axis.values);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad,
        };
      })
      .filter((ax): ax is NonNullable<typeof ax> => ax !== null);
    const gridAxes: ResolvedAxis[] =
      resolvedAxes.length || deltaResolvedAxes.length
        ? [...resolvedAxes, ...deltaResolvedAxes, ...rateResolvedAxes]
        : [
            {
              key: "binary",
              min: 0,
              max: 1,
              side: "left",
              unit: "",
              color: null,
            },
          ];
    renderer.drawGrid(renderT0, renderT1, gridAxes, undefined, 5, {
      fixedAxisOverlay: true,
    });
    this._renderComparisonPreviewOverlay(
      renderer as { pad?: { left?: number } }
    );
    const activeAxes: ResolvedAxis[] = resolvedAxes.length
      ? (renderer as unknown as { _activeAxes?: ResolvedAxis[] })._activeAxes ||
        []
      : [];
    const axisLookup = new Map<string, ResolvedAxis>(
      activeAxes.map((axis) => [axis.key, axis])
    );
    series.forEach((s) => {
      (s as typeof s & { axis?: ResolvedAxis }).axis =
        axisLookup.get(s.axisKey) || activeAxes[0] || resolvedAxes[0];
    });
    renderChartAxisOverlays(this, renderer, activeAxes);
    binaryBackgrounds.forEach((binaryBackground) => {
      if (
        binaryBackground?.spans?.length &&
        !this._hiddenSeries.has(binaryBackground.entityId)
      ) {
        renderer.drawStateBands(
          binaryBackground.spans,
          renderT0,
          renderT1,
          binaryBackground.color,
          0.12
        );
      }
    });
    if (
      (this._config as Record<string, unknown>)?.show_correlated_anomalies ===
      true
    ) {
      const correlatedSpans = this._buildCorrelatedAnomalySpans(
        visibleSeries,
        anomalyClustersMap,
        analysisMap
      );
      if (correlatedSpans.length) {
        renderer.drawStateBands(
          correlatedSpans,
          renderT0,
          renderT1,
          "#ef4444",
          0.1
        );
      }
    }
    let comparisonOutOfBounds = false;
    let mainSeriesHoverOpacity: number;
    if (!comparisonPreviewActive) {
      mainSeriesHoverOpacity = 1;
    } else if (hoveringDifferentComparison) {
      mainSeriesHoverOpacity = 0.15;
    } else {
      mainSeriesHoverOpacity = 0.25;
    }
    const anyHiddenSourceSeries = hiddenSourceEntityIds.size > 0;
    const hoverSeries = visibleSeries
      .filter((seriesItem) => !hiddenSourceEntityIds.has(seriesItem.entityId))
      .map((seriesItem) => ({
        ...seriesItem,
        hoverOpacity: mainSeriesHoverOpacity,
      }));
    const summaryHoverSeries = visibleSeries.flatMap((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if ((analysis as SeriesAnalysis).show_summary_stats !== true) {
        return [];
      }
      const stats =
        (summaryStatsMap.get(seriesItem.entityId) as {
          min: number;
          mean: number;
          max: number;
        } | null) || null;
      if (!stats) {
        return [];
      }
      const seriesWithAxis = seriesItem as typeof seriesItem & {
        axis?: ResolvedAxis;
      };
      return [
        {
          entityId: `summary:min:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: stats.min,
          color: hexToRgba(
            seriesItem.color,
            anyHiddenSourceSeries ? 0.94 : 0.78
          ),
          baseColor: seriesItem.color,
          axis: seriesWithAxis.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
          summaryType: "min",
          summary: true,
        },
        {
          entityId: `summary:mean:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: stats.mean,
          color: hexToRgba(
            seriesItem.color,
            anyHiddenSourceSeries ? 0.94 : 0.78
          ),
          baseColor: seriesItem.color,
          axis: seriesWithAxis.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
          summaryType: "mean",
          summary: true,
        },
        {
          entityId: `summary:max:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: stats.max,
          color: hexToRgba(
            seriesItem.color,
            anyHiddenSourceSeries ? 0.94 : 0.78
          ),
          baseColor: seriesItem.color,
          axis: seriesWithAxis.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
          summaryType: "max",
          summary: true,
        },
      ];
    });
    const thresholdHoverSeries = visibleSeries.flatMap((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if ((analysis as SeriesAnalysis).show_threshold_analysis !== true) {
        return [];
      }
      const rawThreshold = (analysis as SeriesAnalysis).threshold_value;
      const thresholdValue = Number(rawThreshold);
      if (!Number.isFinite(thresholdValue)) {
        return [];
      }
      const seriesWithAxis = seriesItem as typeof seriesItem & {
        axis?: ResolvedAxis;
      };
      return [
        {
          entityId: `threshold:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: thresholdValue,
          baseColor: seriesItem.color,
          color: hexToRgba(
            seriesItem.color,
            anyHiddenSourceSeries ? 0.82 : 0.46
          ),
          axis: seriesWithAxis.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.84 : 0.48,
          direction:
            (analysis as SeriesAnalysis).threshold_direction === "below"
              ? "below"
              : "above",
          threshold: true,
        },
      ];
    });
    const trendSeries = visibleSeries
      .map((seriesItem) => ({
        ...seriesItem,
        trendPts: trendPointsMap.get(seriesItem.entityId) || [],
      }))
      .filter(
        (seriesItem) =>
          Array.isArray(seriesItem.trendPts) && seriesItem.trendPts.length >= 2
      );
    const rateSeries = visibleSeries
      .map((seriesItem) => {
        const ratePoints = ratePointsMap.get(seriesItem.entityId) || [];
        if (!Array.isArray(ratePoints) || ratePoints.length < 2) {
          return null;
        }
        const axis = axisLookup.get(`rate:${seriesItem.axisKey}`);
        if (!axis) {
          return null;
        }
        return {
          ...seriesItem,
          ratePts: ratePoints,
          rateAxis: axis,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const anomalySeries = visibleSeries
      .map((seriesItem) => {
        const anomalyClusters =
          anomalyClustersMap.get(seriesItem.entityId) || [];
        if (!Array.isArray(anomalyClusters) || anomalyClusters.length === 0) {
          return null;
        }
        return {
          ...seriesItem,
          anomalyClusters,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const comparisonHoverSeries: unknown[] = [];
    const comparisonTrendHoverSeries: unknown[] = [];
    const comparisonRateHoverSeries: unknown[] = [];
    const comparisonSummaryHoverSeries: unknown[] = [];
    const comparisonThresholdHoverSeries: unknown[] = [];
    const deltaHoverSeries: unknown[] = [];
    for (const win of drawableComparisonResults) {
      for (const seriesSetting of seriesSettings) {
        const entityId = seriesSetting.entity_id;
        if (entityId.split(".")[0] === "binary_sensor") {
          continue;
        }
        if (this._hiddenSeries.has(entityId)) {
          continue;
        }
        const analysis =
          analysisMap.get(entityId) ||
          (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
        const winPts = await this._resolveComparisonWindowPoints(
          entityId,
          win,
          analysis,
          renderT0,
          renderT1
        );
        if (!winPts.length) {
          continue;
        }
        // Find the axis this entity belongs to
        const unit =
          ((
            this._hass as {
              states?: Record<string, { attributes: Record<string, unknown> }>;
            } | null
          )?.states?.[entityId]?.attributes?.unit_of_measurement as string) ||
          "";
        const axisKey = delinkYAxis
          ? `${unit || "__unitless__"}::${entityId}`
          : unit || "__unitless__";
        const axis = axisLookup.get(axisKey);
        if (!axis) continue;
        if (
          !this._adjustComparisonAxisScale &&
          !autoAdjustHoveredComparisonAxis
        ) {
          const hasOutOfBoundsPoint = winPts.some(
            (point) => point[1] < axis.min || point[1] > axis.max
          );
          if (hasOutOfBoundsPoint) {
            comparisonOutOfBounds = true;
          }
        }
        const baseColor =
          seriesSetting.color ||
          COLORS[seriesSettings.indexOf(seriesSetting) % COLORS.length];
        const isHoveredComparison =
          !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
        const isSelectedComparison =
          !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
        let comparisonLineOpacity: number;
        if (isHoveredComparison) {
          comparisonLineOpacity = 1;
        } else if (hoveringDifferentComparison && isSelectedComparison) {
          comparisonLineOpacity = 0.25;
        } else {
          comparisonLineOpacity = 0.85;
        }
        comparisonHoverSeries.push({
          entityId: `${win.id}:${entityId}`,
          relatedEntityId: entityId,
          label:
            seriesSetting.label || entityName(this._hass, entityId) || entityId,
          windowLabel: win.label || "Date window",
          unit,
          pts: winPts,
          color: baseColor,
          axis,
          hoverOpacity: comparisonLineOpacity,
        });
        if (analysis.show_trend_lines === true && winPts.length >= 2) {
          const trendPts = this._buildTrendPoints(
            winPts,
            analysis.trend_method,
            analysis.trend_window
          );
          if (trendPts.length >= 2) {
            const trendOptions = this._getTrendRenderOptions(
              analysis.trend_method as string,
              false
            );
            comparisonTrendHoverSeries.push({
              entityId: `trend:${win.id}:${entityId}`,
              relatedEntityId: entityId,
              comparisonParentId: `${win.id}:${entityId}`,
              label:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              baseLabel:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              windowLabel: win.label || "Date window",
              unit,
              pts: trendPts,
              color: hexToRgba(baseColor, Math.max(0.3, trendOptions.colorAlpha - 0.18)),
              axis,
              rawVisible: true,
              hoverOpacity: Math.max(0.3, trendOptions.lineOpacity - 0.18),
              trend: true,
            });
          }
        }
        if (analysis.show_rate_of_change === true && winPts.length >= 2) {
          const ratePts = this._buildRateOfChangePoints(
            winPts,
            analysis.rate_window
          );
          const rateAxis = axisLookup.get(`rate:${axisKey}`) || axis;
          if (ratePts.length >= 2) {
            comparisonRateHoverSeries.push({
              entityId: `rate:${win.id}:${entityId}`,
              relatedEntityId: entityId,
              comparisonParentId: `${win.id}:${entityId}`,
              label:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              baseLabel:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              windowLabel: win.label || "Date window",
              unit: unit ? `${unit}/h` : "/h",
              pts: ratePts,
              color: hexToRgba(baseColor, 0.52),
              axis: rateAxis,
              rawVisible: true,
              hoverOpacity: 0.46,
              rate: true,
            });
          }
        }
        if (analysis.show_summary_stats === true) {
          const summaryStats = this._buildSummaryStats(winPts);
          [
            { type: "min", value: summaryStats.min },
            { type: "mean", value: summaryStats.mean },
            { type: "max", value: summaryStats.max },
          ].forEach((entry) => {
            if (!Number.isFinite(entry.value)) {
              return;
            }
            comparisonSummaryHoverSeries.push({
              entityId: `summary:${entry.type}:${win.id}:${entityId}`,
              relatedEntityId: entityId,
              comparisonParentId: `${win.id}:${entityId}`,
              label:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              baseLabel:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              windowLabel: win.label || "Date window",
              unit,
              value: entry.value,
              color: hexToRgba(baseColor, entry.type === "mean" ? 0.44 : 0.24),
              axis,
              rawVisible: true,
              hoverOpacity: entry.type === "mean" ? 0.52 : 0.3,
              summaryType: entry.type,
              summary: true,
            });
          });
        }
        if (analysis.show_threshold_analysis === true) {
          const thresholdValue = Number(analysis.threshold_value);
          if (Number.isFinite(thresholdValue)) {
            comparisonThresholdHoverSeries.push({
              entityId: `threshold:${win.id}:${entityId}`,
              relatedEntityId: entityId,
              comparisonParentId: `${win.id}:${entityId}`,
              label:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              baseLabel:
                seriesSetting.label ||
                entityName(this._hass, entityId) ||
                entityId,
              windowLabel: win.label || "Date window",
              unit,
              value: thresholdValue,
              color: hexToRgba(baseColor, 0.28),
              axis,
              rawVisible: true,
              hoverOpacity: 0.34,
              threshold: true,
            });
          }
        }
        if (!hiddenComparisonEntityIds.has(entityId)) {
        renderer.drawLine(
          winPts,
          baseColor,
          renderT0,
            renderT1,
            axis.min,
            axis.max,
            {
              lineOpacity: comparisonLineOpacity,
            lineWidth:
              hoveringDifferentComparison && isSelectedComparison
                ? 1.25
                : undefined,
            }
          );
        }
        const rateAxis = axisLookup.get(`rate:${axisKey}`) || null;
        this._drawComparisonAnalysisOverlays({
          renderer,
          entityId,
          seriesColor: baseColor,
          comparisonPts: winPts,
          analysis,
          renderT0,
          renderT1,
          axis,
          rateAxis,
          events,
          comparisonWindowId: win.id,
        });
      }
    }
    this._setAdjustAxisButtonVisibility(
      comparisonPreviewActive &&
        comparisonOutOfBounds &&
        !this._adjustComparisonAxisScale &&
        !autoAdjustHoveredComparisonAxis
    );

    for (const s of visibleSeries) {
      if (hiddenSourceEntityIds.has(s.entityId)) {
        continue;
      }
      const sWithAxis = s as typeof s & { axis: ResolvedAxis };
      this._drawSeriesLine(
        renderer,
        s.pts,
        s.color,
        renderT0,
        renderT1,
        sWithAxis.axis.min,
        sWithAxis.axis.max,
        {
          lineOpacity: mainSeriesHoverOpacity,
          lineWidth:
            (this._config as Record<string, unknown>)
              ?.comparison_hover_active === true
              ? 1.25
              : undefined,
        }
      );
    }
    const trendHoverSeries = trendSeries.map((seriesItem) => {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      const hiddenSource = hiddenSourceEntityIds.has(seriesItem.entityId);
      const trendRenderOptions = this._getTrendRenderOptions(
        (analysis as SeriesAnalysis).trend_method,
        hiddenSource
      );
      const seriesWithAxis = seriesItem as typeof seriesItem & {
        axis?: ResolvedAxis;
      };
      return {
        entityId: `trend:${seriesItem.entityId}`,
        relatedEntityId: seriesItem.entityId,
        label: seriesItem.label,
        baseLabel: seriesItem.label,
        unit: seriesItem.unit || "",
        pts: seriesItem.trendPts,
        color: hexToRgba(seriesItem.color, trendRenderOptions.colorAlpha),
        axis: seriesWithAxis.axis,
        rawVisible: !hiddenSource,
        showCrosshair:
          (analysis as SeriesAnalysis).show_trend_crosshairs === true,
        hoverOpacity: comparisonPreviewActive
          ? Math.max(0.25, Math.min(0.9, mainSeriesHoverOpacity + 0.12))
          : trendRenderOptions.lineOpacity,
        trend: true,
      };
    });
    const rateHoverSeries = rateSeries.map((seriesItem) => ({
      entityId: `rate:${seriesItem.entityId}`,
      relatedEntityId: seriesItem.entityId,
      label: seriesItem.label,
      baseLabel: seriesItem.label,
      unit: seriesItem.unit ? `${seriesItem.unit}/h` : "/h",
      pts: seriesItem.ratePts,
      color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.9 : 0.72),
      axis: seriesItem.rateAxis,
      rawVisible: !hiddenSourceEntityIds.has(seriesItem.entityId),
      hoverOpacity: anyHiddenSourceSeries ? 0.88 : 0.66,
      rate: true,
    }));
    for (const trend of trendSeries) {
      const analysis =
        analysisMap.get(trend.entityId) || normalizeHistorySeriesAnalysis(null);
      const trendRenderOptions = this._getTrendRenderOptions(
        (analysis as SeriesAnalysis).trend_method,
        hiddenSourceEntityIds.has(trend.entityId)
      );
      const trendWithAxis = trend as typeof trend & { axis: ResolvedAxis };
      renderer.drawLine(
        trend.trendPts,
        hexToRgba(trend.color, trendRenderOptions.colorAlpha),
        renderT0,
        renderT1,
        trendWithAxis.axis.min,
        trendWithAxis.axis.max,
        {
          lineOpacity: comparisonPreviewActive
            ? Math.max(0.25, Math.min(0.9, mainSeriesHoverOpacity + 0.12))
            : trendRenderOptions.lineOpacity,
          lineWidth: trendRenderOptions.lineWidth,
          dashed: trendRenderOptions.dashed,
          dotted: trendRenderOptions.dotted,
        }
      );
    }
    for (const rateSeriesItem of rateSeries) {
      renderer.drawLine(
        rateSeriesItem.ratePts,
        hexToRgba(rateSeriesItem.color, anyHiddenSourceSeries ? 0.96 : 0.82),
        renderT0,
        renderT1,
        rateSeriesItem.rateAxis.min,
        rateSeriesItem.rateAxis.max,
        {
          lineOpacity: anyHiddenSourceSeries ? 0.88 : 0.66,
          lineWidth: 1.55,
          dashed: false,
          dotted: false,
          dashPattern: [7, 3, 1.5, 3],
        }
      );
    }
    for (const seriesItem of visibleSeries) {
      const analysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        !(
          (analysis as SeriesAnalysis).show_delta_analysis === true &&
          hasSelectedComparisonWindow === true
        )
      ) {
        continue;
      }
      const deltaAxis = axisLookup.get(`delta:${seriesItem.axisKey}`);
      if (!deltaAxis) {
        continue;
      }
      const deltaPoints = deltaPointsMap.get(seriesItem.entityId) || [];
      if (!deltaPoints.length) {
        continue;
      }
      if ((analysis as SeriesAnalysis).show_delta_tooltip === true) {
        deltaHoverSeries.push({
          entityId: `delta:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          pts: deltaPoints,
          color: hexToRgba(seriesItem.color, 0.92),
          axis: deltaAxis,
          rawVisible: !hiddenSourceEntityIds.has(seriesItem.entityId),
          hoverOpacity: 0.82,
          delta: true,
        });
      }
      if ((analysis as SeriesAnalysis).show_delta_lines === true) {
        renderer.drawLine(
          deltaPoints,
          hexToRgba(seriesItem.color, 0.92),
          renderT0,
          renderT1,
          deltaAxis.min,
          deltaAxis.max,
          {
            lineOpacity: 0.82,
            lineWidth: 1.9,
            dashed: true,
          }
        );
      }
    }
    // Draw gradient shading between min/max lines and the mean (inside only),
    // gated on the per-series show_summary_stats_shading flag. Drawn before the
    // lines so the lines sit on top of the fill.
    visibleSeries.forEach((seriesItem) => {
      const shadingAnalysis =
        analysisMap.get(seriesItem.entityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        (shadingAnalysis as SeriesAnalysis).show_summary_stats !== true ||
        (shadingAnalysis as SeriesAnalysis).show_summary_stats_shading !== true
      ) {
        return;
      }
      const stats = summaryStatsMap.get(seriesItem.entityId) as
        | { min: number; max: number; mean: number }
        | undefined;
      const seriesWithAxis = seriesItem as typeof seriesItem & {
        axis?: ResolvedAxis;
      };
      const axis = seriesWithAxis.axis;
      if (!stats || !axis) {
        return;
      }
      if (
        !Number.isFinite(stats.min) ||
        !Number.isFinite(stats.max) ||
        !Number.isFinite(stats.mean)
      ) {
        return;
      }
      const fillAlpha = anyHiddenSourceSeries ? 0.1 : 0.06;
      renderer.drawGradientBand(
        stats.min,
        stats.mean,
        seriesItem.color,
        renderT0,
        renderT1,
        axis.min,
        axis.max,
        { fillAlpha }
      );
      renderer.drawGradientBand(
        stats.max,
        stats.mean,
        seriesItem.color,
        renderT0,
        renderT1,
        axis.min,
        axis.max,
        { fillAlpha }
      );
    });
    summaryHoverSeries.forEach((summarySeries) => {
      const axis = summarySeries.axis as ResolvedAxis | undefined;
      if (!axis) {
        return;
      }
      renderer.drawLine(
        [
          [renderT0, summarySeries.value],
          [renderT1, summarySeries.value],
        ],
        summarySeries.color,
        renderT0,
        renderT1,
        axis.min,
        axis.max,
        {
          lineOpacity: summarySeries.hoverOpacity,
          lineWidth: 1.8,
          dashed: false,
          dotted: false,
        }
      );
    });
    thresholdHoverSeries.forEach((thresholdSeries) => {
      const axis = thresholdSeries.axis as ResolvedAxis | undefined;
      if (!axis) {
        return;
      }
      const thresholdAnalysis =
        analysisMap.get(thresholdSeries.relatedEntityId) ||
        normalizeHistorySeriesAnalysis(null);
      if (
        (thresholdAnalysis as SeriesAnalysis).show_threshold_shading === true
      ) {
        const relatedSeries = visibleSeries.find(
          (seriesItem) =>
            seriesItem.entityId === thresholdSeries.relatedEntityId
        );
        if (relatedSeries?.pts?.length) {
          renderer.drawThresholdArea(
            relatedSeries.pts,
            thresholdSeries.value,
            thresholdSeries.baseColor || relatedSeries.color,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            {
              mode: thresholdSeries.direction === "below" ? "below" : "above",
              fillAlpha: anyHiddenSourceSeries ? 0.24 : 0.14,
            }
          );
        }
      }
      renderer.drawLine(
        [
          [renderT0, thresholdSeries.value],
          [renderT1, thresholdSeries.value],
        ],
        thresholdSeries.color,
        renderT0,
        renderT1,
        axis.min,
        axis.max,
        {
          lineOpacity: thresholdSeries.hoverOpacity,
          lineWidth: 1.15,
        }
      );
    });
    if (anomalySeries.length) {
      const anomalyRegions: unknown[] = [];
      anomalySeries.forEach((seriesItem) => {
        const seriesWithAxis = seriesItem as typeof seriesItem & {
          axis?: ResolvedAxis;
        };
        const axis = seriesWithAxis.axis;
        if (!axis) {
          return;
        }
        const visibleAnomalyClusters = this._filterAnnotatedAnomalyClusters(
          seriesItem,
          events
        );
        if (visibleAnomalyClusters.length === 0) {
          return;
        }
        const normalClusters = visibleAnomalyClusters.filter(
          (c) => !(c as { isOverlap?: boolean }).isOverlap
        );
        const overlapClusters = visibleAnomalyClusters.filter(
          (c) => (c as { isOverlap?: boolean }).isOverlap === true
        );
        const baseColor = hexToRgba(
          seriesItem.color,
          anyHiddenSourceSeries ? 0.96 : 0.86
        );
        const regionOptions = {
          strokeAlpha: anyHiddenSourceSeries ? 0.98 : 0.9,
          lineWidth: anyHiddenSourceSeries ? 2.5 : 2.1,
          haloWidth: anyHiddenSourceSeries ? 5.5 : 4.8,
          haloColor: "rgba(255,255,255,0.88)",
          haloAlpha: anyHiddenSourceSeries ? 0.92 : 0.82,
          fillColor: hexToRgba(
            seriesItem.color,
            anyHiddenSourceSeries ? 0.14 : 0.1
          ),
          fillAlpha: 1,
          pointPadding: anyHiddenSourceSeries ? 12 : 10,
          minRadiusX: 10,
          minRadiusY: 10,
        };
        const overlapOptions = {
          strokeAlpha: 0.98,
          lineWidth: 2.8,
          haloWidth: 7,
          haloColor: "rgba(232,160,32,0.22)",
          haloAlpha: 1,
          fillColor: "rgba(232,160,32,0.1)",
          fillAlpha: 1,
          pointPadding: anyHiddenSourceSeries ? 15 : 13,
          minRadiusX: 12,
          minRadiusY: 12,
        };
        const overlapAccentColor = "rgba(232,160,32,0.94)";
        if (normalClusters.length > 0) {
          renderer.drawAnomalyClusters(
            normalClusters,
            baseColor,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            regionOptions
          );
        }
        if (overlapClusters.length > 0) {
          const overlapMode = (
            analysisMap.get(seriesItem.entityId) ||
            normalizeHistorySeriesAnalysis(null)
          ).anomaly_overlap_mode;
          // In "only" mode all shown clusters are already overlaps — draw with base style, no accent
          renderer.drawAnomalyClusters(
            overlapClusters,
            baseColor,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            regionOptions
          );
          if (overlapMode !== "only") {
            renderer.drawAnomalyClusters(
              overlapClusters,
              overlapAccentColor,
              renderT0,
              renderT1,
              axis.min,
              axis.max,
              overlapOptions
            );
          }
        }
        const allRegionClusters = [...normalClusters, ...overlapClusters];
        const clusterRegions = renderer.getAnomalyClusterRegions(
          allRegionClusters,
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          regionOptions
        );
        clusterRegions.forEach((region: unknown) => {
          const analysis =
            analysisMap.get(seriesItem.entityId) ||
            normalizeHistorySeriesAnalysis(null);
          anomalyRegions.push({
            ...(region as object),
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            sensitivity: (analysis as SeriesAnalysis).anomaly_sensitivity,
          });
        });
      });
      this._lastAnomalyRegions = anomalyRegions;
    } else {
      this._lastAnomalyRegions = [];
    }
    const effectiveComparisonHoverSeries = comparisonHoverSeries.filter(
      (entry) =>
        !hiddenComparisonEntityIds.has(
          (entry as { relatedEntityId?: string; entityId: string })
            .relatedEntityId ||
            (entry as { relatedEntityId?: string; entityId: string }).entityId
        )
    );
    renderer.drawAnnotations(events, renderT0, renderT1, {
      showLines:
        (this._config as Record<string, unknown>).show_event_lines !== false,
      showMarkers:
        (this._config as Record<string, unknown>).show_event_lines !== false,
    });
    const eventHits = this._drawRecordedEventPoints(
      renderer,
      visibleSeries,
      events,
      renderT0,
      renderT1,
      {
        showIcons:
          (this._config as Record<string, unknown>).show_event_markers !==
          false,
      }
    );

    this._renderLegend(series, binaryBackgrounds);

    const eventValueMap = new Map(eventHits.map((hit) => [hit.event.id, hit]));
    const enrichedEvents = events.map((event) => {
      const hit = eventValueMap.get((event as { id: string }).id);
      return hit
        ? {
            ...(event as object),
            chart_value: hit.value,
            chart_unit: hit.unit,
          }
        : event;
    });

    if (visibleSeries.length) {
      this._ensureContextAnnotationDialog();
      attachLineChartHover(
        this,
        canvas!,
        renderer,
        hoverSeries,
        enrichedEvents,
        renderT0,
        renderT1,
        null,
        null,
        activeAxes as unknown as null,
        {
          onContextMenu: (hover: unknown) =>
            this._handleChartContextMenu(hover),
          onAddAnnotation: (hover: unknown) =>
            this._handleChartAddAnnotation(hover),
          binaryStates: binaryBackgrounds.filter(
            (entry) => !this._hiddenSeries.has(entry.entityId)
          ),
          comparisonSeries: effectiveComparisonHoverSeries,
          trendSeries: [...trendHoverSeries, ...comparisonTrendHoverSeries],
          rateSeries: [...rateHoverSeries, ...comparisonRateHoverSeries],
          deltaSeries: deltaHoverSeries,
          summarySeries: [
            ...summaryHoverSeries,
            ...comparisonSummaryHoverSeries,
          ],
          thresholdSeries: [
            ...thresholdHoverSeries,
            ...comparisonThresholdHoverSeries,
          ],
          anomalyRegions: Array.isArray(this._lastAnomalyRegions)
            ? this._lastAnomalyRegions
            : [],
          hoverSurfaceEl: this.querySelector("#chart-icon-overlay"),
          showTooltip:
            (this._config as Record<string, unknown>).show_tooltips !== false,
          emphasizeHoverGuides:
            (this._config as Record<string, unknown>).emphasize_hover_guides ===
            true,
          hoverSnapMode:
            (this._config as Record<string, unknown>).hover_snap_mode ===
            "snap_to_data_points"
              ? "snap_to_data_points"
              : "follow_series",
          showTrendCrosshairs: anyTrendCrosshairs,
          hideRawData:
            hiddenSourceEntityIds.size === visibleSeries.length &&
            visibleSeries.length > 0,
          showDeltaTooltip: deltaHoverSeries.length > 0,
          onAnomalyClick: (regions: unknown) =>
            this._handleAnomalyAddAnnotation(regions),
        }
      );
      attachLineChartRangeZoom(this, canvas!, renderer, renderT0, renderT1, {
        onPreview: (range: unknown) => this._dispatchZoomPreview(range),
        onZoom: ({
          startTime,
          endTime,
        }: {
          startTime: number;
          endTime: number;
        }) => this._applyZoomRange(startTime, endTime),
        onReset: () => this._clearZoomRange(),
      });
    } else {
      if (this._chartHoverCleanup) {
        this._chartHoverCleanup();
        this._chartHoverCleanup = null;
      }
      if (this._chartZoomCleanup) {
        this._chartZoomCleanup();
        this._chartZoomCleanup = null;
      }
    }

    if (this._chartScrollViewportEl) {
      this._chartScrollViewportEl.removeEventListener(
        "scroll",
        this._onChartScroll
      );
      this._chartScrollViewportEl.addEventListener(
        "scroll",
        this._onChartScroll,
        { passive: true }
      );
      this._syncChartViewportScroll(t0, t1, w);
    }
    this._fireBackendAnomalyRequests(
      _anomalyEntityIds,
      analysisMap,
      _startIso,
      _endIso,
      options.drawRequestId as number
    );
    this._fireComparisonBackendAnomalyRequests(
      drawableComparisonResults,
      analysisMap,
      renderT0,
      renderT1
    );
  }

  // ── Analysis cache helpers ──────────────────────────────────────────────────

  /**
   * Build a lightweight string key that captures all inputs that affect the
   * analysis result.  Used to skip the worker when data and settings haven't
   * changed (e.g. on zoom/pan).
   * Ported from _buildAnalysisCacheKey in card-history.js.
   */
  _buildAnalysisCacheKey(
    visibleSeries: SeriesItem[],
    selectedComparisonSeriesMap: Map<string, SeriesItem>,
    analysisMap: Map<string, SeriesAnalysis>,
    allComparisonWindowsData: Record<
      string,
      Record<string, [number, number][]>
    >,
    t0: number,
    t1: number
  ): string {
    const ANALYSIS_FIELDS = [
      "show_trend_lines",
      "trend_method",
      "trend_window",
      "show_rate_of_change",
      "rate_window",
      "show_delta_analysis",
      "show_summary_stats",
      "show_anomalies",
      "anomaly_methods",
      "anomaly_sensitivity",
      "anomaly_overlap_mode",
      "anomaly_rate_window",
      "anomaly_zscore_window",
      "anomaly_persistence_window",
      "anomaly_comparison_window_id",
    ] as const;

    const seriesPart = visibleSeries
      .map((s) => {
        const a = analysisMap.get(s.entityId) || {};
        const first = s.pts[0]?.[0] ?? 0;
        const last = s.pts[s.pts.length - 1]?.[0] ?? 0;
        const aKey = ANALYSIS_FIELDS.map((f) => JSON.stringify(a[f])).join(",");
        return `${s.entityId}:${s.pts.length}:${first}:${last}:${aKey}`;
      })
      .join("|");

    const cmpPart = Array.from(selectedComparisonSeriesMap.values())
      .map((s) => {
        const first = s.pts[0]?.[0] ?? 0;
        const last = s.pts[s.pts.length - 1]?.[0] ?? 0;
        return `${s.entityId}:${s.pts.length}:${first}:${last}`;
      })
      .sort()
      .join("|");

    const allCmpPart = Object.entries(allComparisonWindowsData)
      .flatMap(([windowId, entities]) =>
        Object.entries(entities).map(([entityId, pts]) => {
          const first = pts[0]?.[0] ?? 0;
          const last = pts[pts.length - 1]?.[0] ?? 0;
          return `${windowId}:${entityId}:${pts.length}:${first}:${last}`;
        })
      )
      .sort()
      .join("|");

    return `${t0}:${t1}|${seriesPart}|${cmpPart}|${allCmpPart}`;
  }

  /**
   * Build the serialisable payload sent to the history-analysis worker.
   * Ported from _buildHistoryAnalysisPayload in card-history.js.
   */
  _buildHistoryAnalysisPayload(
    visibleSeries: SeriesItem[],
    selectedComparisonSeriesMap: Map<string, SeriesItem>,
    analysisMap: Map<string, SeriesAnalysis>,
    hasSelectedComparisonWindow: boolean,
    allComparisonWindowsData: Record<
      string,
      Record<string, [number, number][]>
    > = {}
  ): {
    series: {
      entityId: string;
      pts: [number, number][];
      analysis: SeriesAnalysis;
    }[];
    comparisonSeries: { entityId: string; pts: [number, number][] }[];
    hasSelectedComparisonWindow: boolean;
    allComparisonWindowsData: Record<
      string,
      Record<string, [number, number][]>
    >;
  } {
    return {
      series: visibleSeries.map((seriesItem) => ({
        entityId: seriesItem.entityId,
        pts: seriesItem.pts,
        analysis:
          analysisMap.get(seriesItem.entityId) ||
          (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis),
      })),
      comparisonSeries: Array.from(selectedComparisonSeriesMap.values()).map(
        (seriesItem) => ({
          entityId: seriesItem.entityId,
          pts: seriesItem.pts,
        })
      ),
      hasSelectedComparisonWindow: hasSelectedComparisonWindow === true,
      allComparisonWindowsData,
    };
  }

  /**
   * Run or cache the history analysis computation.
   * Terminates any in-flight worker before starting a new one.
   * Falls back to a synchronous main-thread path when the worker fails.
   * Ported from _computeHistoryAnalysis in card-history.js.
   */
  async _computeHistoryAnalysis(
    visibleSeries: SeriesItem[],
    selectedComparisonSeriesMap: Map<string, SeriesItem>,
    analysisMap: Map<string, SeriesAnalysis>,
    hasSelectedComparisonWindow: boolean,
    allComparisonWindowsData: Record<
      string,
      Record<string, [number, number][]>
    > = {},
    t0 = 0,
    t1 = 0,
    onProgress: ((progress: number) => void) | null = null
  ): Promise<AnalysisResult> {
    // Abort any in-flight worker computation from a previous (now stale) draw
    // request. This prevents the chart from hanging while waiting for a worker
    // result that will be discarded anyway once the stale-request check runs.
    terminateHistoryAnalysisWorker();

    // Return the cached result if the data and analysis settings are identical
    // to the previous call — this is the common case when zooming or panning
    // (viewport changes but the underlying series data and settings do not).
    const cacheKey = this._buildAnalysisCacheKey(
      visibleSeries,
      selectedComparisonSeriesMap,
      analysisMap,
      allComparisonWindowsData,
      t0,
      t1
    );
    if (this._analysisCache?.key === cacheKey) {
      // Cache hit — no worker computation needed, skip progress indicator.
      return this._analysisCache.result;
    }

    // Not a cache hit — signal that computation is starting (0 %).
    onProgress?.(0);

    const payload = this._buildHistoryAnalysisPayload(
      visibleSeries,
      selectedComparisonSeriesMap,
      analysisMap,
      hasSelectedComparisonWindow,
      allComparisonWindowsData
    );
    try {
      const result = (await computeHistoryAnalysisInWorker(
        payload
      )) as AnalysisResult;
      this._analysisCache = { key: cacheKey, result };
      return result;
    } catch (error: unknown) {
      // If this draw was superseded by a newer one, return a safe empty result
      // quickly. The stale-request check in _drawChart will discard it before
      // any rendering occurs.
      const errorMessage = (error as Error)?.message ?? "";
      if (errorMessage.startsWith("Aborted")) {
        return {
          trendSeries: [],
          rateSeries: [],
          deltaSeries: [],
          summaryStats: [],
          anomalySeries: [],
        };
      }

      logger.warn("[hass-datapoints history-card] analysis worker fallback", {
        message: errorMessage || String(error),
      });

      // Main-thread fallback — runs when the worker crashes or fails to start.
      // Anomaly detection is deliberately skipped here: those algorithms
      // (especially IQR sort) are too expensive to run synchronously on the
      // main thread for large datasets, and the user will get the full result
      // on the next successful worker invocation.
      try {
        return {
          trendSeries: visibleSeries
            .map((seriesItem) => {
              const analysis =
                analysisMap.get(seriesItem.entityId) ||
                (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
              if (analysis.show_trend_lines !== true) {
                return null;
              }
              return {
                entityId: seriesItem.entityId,
                pts: this._buildTrendPoints(
                  seriesItem.pts,
                  analysis.trend_method,
                  analysis.trend_window
                ),
              };
            })
            .filter(Boolean)
            .filter(
              (s) =>
                Array.isArray((s as SeriesItem).pts) &&
                (s as SeriesItem).pts.length >= 2
            ),
          rateSeries: visibleSeries
            .map((seriesItem) => {
              const analysis =
                analysisMap.get(seriesItem.entityId) ||
                (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
              if (analysis.show_rate_of_change !== true) {
                return null;
              }
              return {
                entityId: seriesItem.entityId,
                pts: this._buildRateOfChangePoints(
                  seriesItem.pts,
                  analysis.rate_window
                ),
              };
            })
            .filter(Boolean)
            .filter(
              (s) =>
                Array.isArray((s as SeriesItem).pts) &&
                (s as SeriesItem).pts.length >= 2
            ),
          deltaSeries: visibleSeries
            .map((seriesItem) => {
              const analysis =
                analysisMap.get(seriesItem.entityId) ||
                (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
              if (
                !(
                  analysis.show_delta_analysis === true &&
                  hasSelectedComparisonWindow === true
                )
              ) {
                return null;
              }
              const comparisonSeries = selectedComparisonSeriesMap.get(
                seriesItem.entityId
              );
              return {
                entityId: seriesItem.entityId,
                pts: comparisonSeries
                  ? this._buildDeltaPoints(seriesItem.pts, comparisonSeries.pts)
                  : [],
              };
            })
            .filter(Boolean)
            .filter(
              (s) =>
                Array.isArray((s as SeriesItem).pts) &&
                (s as SeriesItem).pts.length >= 2
            ),
          summaryStats: visibleSeries
            .map((seriesItem) => {
              const analysis =
                analysisMap.get(seriesItem.entityId) ||
                (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
              if (analysis.show_summary_stats !== true) {
                return null;
              }
              return {
                entityId: seriesItem.entityId,
                ...this._buildSummaryStats(seriesItem.pts),
              };
            })
            .filter(
              (entry) =>
                entry &&
                Number.isFinite(
                  (entry as Record<string, unknown>).min as number
                ) &&
                Number.isFinite(
                  (entry as Record<string, unknown>).max as number
                ) &&
                Number.isFinite(
                  (entry as Record<string, unknown>).mean as number
                )
            ),
          // Anomaly detection intentionally omitted in the fallback path.
          anomalySeries: [],
        };
      } catch (fallbackError: unknown) {
        logger.error(
          "[hass-datapoints history-card] analysis fallback failed",
          fallbackError
        );
        return {
          trendSeries: [],
          rateSeries: [],
          deltaSeries: [],
          summaryStats: [],
          anomalySeries: [],
        };
      }
    }
  }

  // ── Analysis helper stubs ───────────────────────────────────────────────────
  // These are called by _computeHistoryAnalysis fallback path.
  // Implementations live in history/analysis/index.ts / the parent card.

  /** Build trend points from raw series data. */
  _buildTrendPoints(
    _pts: [number, number][],
    _method?: string,
    _window?: string
  ): [number, number][] {
    if (!Array.isArray(_pts) || _pts.length < 2) {
      return [];
    }
    const method = _method || "rolling_average";
    if (method === "linear_trend") {
      return buildLinearTrend(_pts);
    }
    return buildRollingAverageTrend(_pts, getTrendWindowMs(_window || "24h"));
  }

  /** Build rate-of-change points from raw series data. */
  _buildRateOfChangePoints(
    _pts: [number, number][],
    _window?: string
  ): [number, number][] {
    if (!Array.isArray(_pts) || _pts.length < 2) {
      return [];
    }
    return buildRateOfChangePoints(_pts, _window || "1h");
  }

  /** Build delta points (main vs comparison series). */
  _buildDeltaPoints(
    _pts: [number, number][],
    _comparisonPts: [number, number][]
  ): [number, number][] {
    return buildDeltaPoints(_pts, _comparisonPts);
  }

  /** Build summary statistics from raw series data. */
  _buildSummaryStats(_pts: [number, number][]): {
    min: number;
    max: number;
    mean: number;
  } {
    return buildSummaryStats(_pts) ?? { min: 0, max: 0, mean: 0 };
  }

  // ── Series analysis helpers ─────────────────────────────────────────────────

  /**
   * Build a Map of entityId → normalised analysis settings from config.
   * Ported from _getSeriesAnalysisMap in card-history.js.
   */
  _getSeriesAnalysisMap(): Map<string, SeriesAnalysis> {
    const seriesSettings = Array.isArray(this._config?.series_settings)
      ? (this._config.series_settings as Array<{
          entity_id?: string;
          analysis?: unknown;
        }>)
      : [];
    return new Map(
      seriesSettings
        .filter((entry) => entry?.entity_id != null)
        .map((entry) => [
          entry.entity_id as string,
          normalizeHistorySeriesAnalysis(entry?.analysis) as SeriesAnalysis,
        ])
    );
  }

  /**
   * Get the normalised analysis settings for a single entity.
   * Ported from _getSeriesAnalysis in card-history.js.
   */
  _getSeriesAnalysis(
    entityId: string,
    analysisMap: Map<string, SeriesAnalysis> | null = null
  ): SeriesAnalysis {
    const map = analysisMap || this._getSeriesAnalysisMap();
    return normalizeHistorySeriesAnalysis(map.get(entityId)) as SeriesAnalysis;
  }

  /**
   * Returns true if any analysis feature is active for the given series.
   * Ported from _seriesHasActiveAnalysis in card-history.js.
   */
  _seriesHasActiveAnalysis(
    analysis: SeriesAnalysis,
    hasSelectedComparisonWindow = false
  ): boolean {
    return !!(
      analysis.show_trend_lines ||
      analysis.show_summary_stats ||
      analysis.show_rate_of_change ||
      analysis.show_threshold_analysis ||
      analysis.show_anomalies ||
      (analysis.show_delta_analysis && hasSelectedComparisonWindow)
    );
  }

  /**
   * Returns true if the source series should be hidden (replaced by its
   * analysis overlay series).
   * Ported from _seriesShouldHideSource in card-history.js.
   */
  _seriesShouldHideSource(
    analysis: SeriesAnalysis,
    hasSelectedComparisonWindow = false
  ): boolean {
    return (
      analysis.hide_source_series === true &&
      this._seriesHasActiveAnalysis(analysis, hasSelectedComparisonWindow)
    );
  }

  /**
   * Return ChartRenderer render options for the active trend method.
   * Ported from _getTrendRenderOptions in card-history.js.
   */
  _getTrendRenderOptions(
    method = "rolling_average",
    hideRawData = false
  ): {
    colorAlpha: number;
    lineOpacity: number;
    lineWidth: number;
    dashed: boolean;
    dotted: boolean;
  } {
    if (method === "linear_trend") {
      return {
        colorAlpha: hideRawData ? 0.94 : 0.88,
        lineOpacity: hideRawData ? 0.86 : 0.74,
        lineWidth: 2.1,
        dashed: true,
        dotted: false,
      };
    }
    return {
      colorAlpha: hideRawData ? 0.9 : 0.82,
      lineOpacity: hideRawData ? 0.84 : 0.62,
      lineWidth: 2.2,
      dashed: false,
      dotted: true,
    };
  }

  // ── Split-view chart rendering ───────────────────────────────────────────────

  async _drawSplitChart({
    visibleSeries,
    binaryBackgrounds,
    events,
    renderT0,
    renderT1,
    canvasWidth,
    availableHeight,
    chartStage,
    canvas,
    wrap,
    options,
    drawableComparisonResults,
    selectedComparisonWindowId,
    hoveredComparisonWindowId,
    comparisonPreviewActive,
    hoveringDifferentComparison,
    analysisResult,
    analysisMap,
    hasSelectedComparisonWindow,
  }: {
    visibleSeries: unknown[];
    binaryBackgrounds: unknown[];
    events: unknown[];
    renderT0: number;
    renderT1: number;
    canvasWidth: number;
    availableHeight: number;
    chartStage: HTMLElement | null;
    canvas: HTMLElement | null;
    wrap: HTMLElement;
    options: Record<string, unknown>;
    drawableComparisonResults: unknown[];
    selectedComparisonWindowId: string | null;
    hoveredComparisonWindowId: string | null;
    comparisonPreviewActive: boolean;
    hoveringDifferentComparison: boolean;
    analysisResult: unknown;
    analysisMap: Map<string, unknown> | null;
    hasSelectedComparisonWindow: boolean;
  }): Promise<void> {
    // Hide the shared canvas; split rows use their own canvases.
    if (canvas) {
      (canvas as HTMLElement).style.display = "none";
    }

    const N = (visibleSeries as unknown[]).length;
    const MIN_ROW_HEIGHT = 140;
    const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor(availableHeight / N));
    const totalHeight = rowHeight * N;

    if (chartStage) {
      chartStage.style.width = `${canvasWidth}px`;
      chartStage.style.height = `${totalHeight}px`;
    }

    // Enable vertical scrolling in the viewport when the split rows don't all
    // fit within the available height (e.g. many series with a small panel).
    const splitScrollViewport = this.querySelector("#chart-scroll-viewport");
    if (splitScrollViewport) {
      (splitScrollViewport as HTMLElement).style.overflowY =
        totalHeight > availableHeight ? "auto" : "hidden";
    }

    this._setChartLoading(!!(options as Record<string, unknown>).loading);
    this._setChartMessage("");

    // Clear the shared icon overlay once before iterating rows.
    const iconOverlay = this.querySelector("#chart-icon-overlay");
    if (iconOverlay) {
      iconOverlay.innerHTML = "";
    }

    // Build analysis lookup maps keyed by entityId.
    const trendPointsMap = new Map(
      (
        ((analysisResult as Record<string, unknown>)
          ?.trendSeries as unknown[]) || []
      ).map((entry: unknown) => [
        (entry as Record<string, unknown>).entityId,
        (entry as Record<string, unknown>).pts,
      ])
    );
    const ratePointsMap = new Map(
      (
        ((analysisResult as Record<string, unknown>)
          ?.rateSeries as unknown[]) || []
      ).map((entry: unknown) => [
        (entry as Record<string, unknown>).entityId,
        (entry as Record<string, unknown>).pts,
      ])
    );
    const deltaPointsMap = new Map(
      (
        ((analysisResult as Record<string, unknown>)
          ?.deltaSeries as unknown[]) || []
      ).map((entry: unknown) => [
        (entry as Record<string, unknown>).entityId,
        (entry as Record<string, unknown>).pts,
      ])
    );
    const summaryStatsMap = new Map(
      (
        ((analysisResult as Record<string, unknown>)
          ?.summaryStats as unknown[]) || []
      ).map((entry: unknown) => [
        (entry as Record<string, unknown>).entityId,
        entry,
      ])
    );
    const anomalyClustersMap = new Map<string, unknown>(
      (
        ((analysisResult as Record<string, unknown>)
          ?.anomalySeries as unknown[]) || []
      ).map(
        (entry: unknown) =>
          [
            (entry as Record<string, unknown>).entityId as string,
            (entry as Record<string, unknown>).anomalyClusters,
          ] as [string, unknown]
      )
    );
    const effectiveAnalysisMap: Map<string, unknown> =
      analysisMap || new Map<string, unknown>();

    const correlatedAnomalySpans: unknown[] =
      (this._config as Record<string, unknown>)?.show_correlated_anomalies ===
      true
        ? this._buildCorrelatedAnomalySpans(
            visibleSeries,
            anomalyClustersMap as Map<string, unknown>,
            effectiveAnalysisMap
          )
        : [];

    const tracks: unknown[] = [];
    for (let i = 0; i < N; i += 1) {
      const isLastRow = i === N - 1;
      const seriesItem = visibleSeries[i] as Record<string, unknown>;
      const rowOffset = i * rowHeight;

      const rowDiv = document.createElement("div");
      rowDiv.className = "split-series-row";
      rowDiv.style.cssText = `position:absolute;left:0;top:${rowOffset}px;width:${canvasWidth}px;height:${rowHeight}px;pointer-events:none;overflow:hidden;`;

      const rowCanvas = document.createElement("canvas");
      rowCanvas.className = "split-series-canvas";
      rowDiv.appendChild(rowCanvas);
      chartStage?.appendChild(rowDiv);

      const { w, h } = (
        setupCanvas as (
          canvas: HTMLCanvasElement,
          container: HTMLElement,
          cssHeight: number,
          cssWidth?: number | null
        ) => { w: number; h: number }
      )(rowCanvas, (chartStage || wrap)!, rowHeight, canvasWidth);
      const renderer = new ChartRenderer(rowCanvas, w, h);
      renderer.labelColor = resolveChartLabelColor(this);
      // Shrink bottom padding on intermediate rows — time labels only appear on the last row.
      renderer.basePad = {
        top: 24,
        right: 12,
        bottom: isLastRow ? 48 : 10,
        left: 12,
      };
      renderer.clear();

      // ── Per-row analysis data ──────────────────────────────────────────────
      const rowAnalysis = (effectiveAnalysisMap.get(
        seriesItem.entityId as string
      ) || normalizeHistorySeriesAnalysis(null)) as SeriesAnalysis;
      const rowTrendPts =
        rowAnalysis.show_trend_lines === true
          ? (trendPointsMap.get(seriesItem.entityId as string) as unknown[]) ||
            []
          : [];
      const rowRatePts =
        rowAnalysis.show_rate_of_change === true
          ? (ratePointsMap.get(seriesItem.entityId as string) as unknown[]) ||
            []
          : [];
      const rowDeltaPts =
        rowAnalysis.show_delta_analysis === true && hasSelectedComparisonWindow
          ? (deltaPointsMap.get(seriesItem.entityId as string) as unknown[]) ||
            []
          : [];
      const rowSummaryStats =
        rowAnalysis.show_summary_stats === true
          ? summaryStatsMap.get(seriesItem.entityId as string) || null
          : null;
      const rowAnomalyClusters =
        rowAnalysis.show_anomalies === true
          ? (anomalyClustersMap.get(
              seriesItem.entityId as string
            ) as unknown[]) || []
          : [];
      const rowHideSource = this._seriesShouldHideSource(
        rowAnalysis,
        hasSelectedComparisonWindow
      );

      const axisValues = (seriesItem.pts as [number, number][]).map(
        ([, v]) => v
      );
      const extent = this._getAxisValueExtent(axisValues);
      let axisMin = 0;
      let axisMax = 1;
      if (extent) {
        const pad =
          ((extent as Record<string, number>).max -
            (extent as Record<string, number>).min) *
            0.1 || 1;
        axisMin = (extent as Record<string, number>).min - pad;
        axisMax = (extent as Record<string, number>).max + pad;
      }
      const primaryAxisKey =
        (seriesItem.axisKey as string) ||
        (seriesItem.unit as string) ||
        "__unitless__";
      const axis = {
        key: primaryAxisKey,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        side: "left",
        min: axisMin,
        max: axisMax,
        values: axisValues,
      };

      // Build secondary axes for rate-of-change and delta if needed.
      const rowAxes: unknown[] = [axis];
      let rowRateAxisKey: string | null = null;
      if ((rowRatePts as [number, number][]).length >= 2) {
        const rateVals = (rowRatePts as [number, number][]).map(([, v]) => v);
        const rateExt = this._getAxisValueExtent(rateVals);
        if (rateExt) {
          const pad =
            ((rateExt as Record<string, number>).max -
              (rateExt as Record<string, number>).min) *
              0.1 || 1;
          rowRateAxisKey = `rate:${primaryAxisKey}`;
          rowAxes.push({
            key: rowRateAxisKey,
            unit: seriesItem.unit ? `${seriesItem.unit}/h` : "Rate/h",
            color: seriesItem.color,
            side: "right",
            min: (rateExt as Record<string, number>).min - pad,
            max: (rateExt as Record<string, number>).max + pad,
            values: rateVals,
          });
        }
      }
      let rowDeltaAxisKey: string | null = null;
      if ((rowDeltaPts as [number, number][]).length >= 2) {
        const deltaVals = (rowDeltaPts as [number, number][]).map(([, v]) => v);
        const deltaExt = this._getAxisValueExtent(deltaVals);
        if (deltaExt) {
          const pad =
            ((deltaExt as Record<string, number>).max -
              (deltaExt as Record<string, number>).min) *
              0.1 || 1;
          rowDeltaAxisKey = `delta:${primaryAxisKey}`;
          rowAxes.push({
            key: rowDeltaAxisKey,
            unit: seriesItem.unit ? `Δ ${seriesItem.unit}` : "Δ",
            color: seriesItem.color,
            side: "right",
            min: (deltaExt as Record<string, number>).min - pad,
            max: (deltaExt as Record<string, number>).max + pad,
            values: deltaVals,
          });
        }
      }

      renderer.drawGrid(renderT0, renderT1, rowAxes, undefined, 4, {
        fixedAxisOverlay: true,
        hideTimeLabels: !isLastRow,
      });

      // Retrieve the scaled axes back from the renderer after grid normalisation.
      type AxisLike = {
        key: string;
        min: number;
        max: number;
        [k: string]: unknown;
      };
      const activeAxes = (renderer as unknown as Record<string, unknown>)
        ._activeAxes as AxisLike[] | undefined;
      const resolvedAxis: AxisLike = activeAxes?.[0] || (axis as AxisLike);
      const resolvedRateAxis: AxisLike | null = rowRateAxisKey
        ? activeAxes?.find((a) => a.key === rowRateAxisKey) || null
        : null;
      const resolvedDeltaAxis: AxisLike | null = rowDeltaAxisKey
        ? activeAxes?.find((a) => a.key === rowDeltaAxisKey) || null
        : null;
      seriesItem.axis = resolvedAxis;

      // Dim the main series when a comparison preview is active, matching the
      // behaviour of the regular (non-split) chart.
      let mainSeriesOpacity: number;
      if (!comparisonPreviewActive) {
        mainSeriesOpacity = 1;
      } else if (hoveringDifferentComparison) {
        mainSeriesOpacity = 0.15;
      } else {
        mainSeriesOpacity = 0.25;
      }

      if (!rowHideSource) {
        this._drawSeriesLine(
          renderer,
          seriesItem.pts as [number, number][],
          seriesItem.color as string,
          renderT0,
          renderT1,
          resolvedAxis.min,
          resolvedAxis.max,
          {
            lineWidth: comparisonPreviewActive ? 1.25 : 1.75,
            lineOpacity: mainSeriesOpacity,
          }
        );
      }

      // Draw comparison window series for this row's entity.
      for (const win of (drawableComparisonResults || []) as unknown[]) {
        const winPts = await this._resolveComparisonWindowPoints(
          seriesItem.entityId as string,
          win as {
            id: string;
            time_offset_ms: number;
            histResult: unknown;
            statsResult: unknown;
            label?: string;
          },
          rowAnalysis,
          renderT0,
          renderT1
        );
        if (!winPts.length) {
          continue;
        }
        const isHovered =
          !!hoveredComparisonWindowId &&
          (win as Record<string, unknown>).id === hoveredComparisonWindowId;
        const isSelected =
          !!selectedComparisonWindowId &&
          (win as Record<string, unknown>).id === selectedComparisonWindowId;
        let compLineOpacity: number;
        if (isHovered) {
          compLineOpacity = 1;
        } else if (hoveringDifferentComparison && isSelected) {
          compLineOpacity = 0.25;
        } else {
          compLineOpacity = 0.85;
        }
        let comparisonLineWidth;
        if (isHovered) {
          comparisonLineWidth = 3.2;
        } else if (hoveringDifferentComparison && isSelected) {
          comparisonLineWidth = 1.25;
        } else {
          comparisonLineWidth = undefined;
        }
        renderer.drawLine(
          winPts,
          seriesItem.color as string,
          renderT0,
          renderT1,
          resolvedAxis.min,
          resolvedAxis.max,
          {
            lineOpacity: compLineOpacity,
            lineWidth: comparisonLineWidth,
            dashed: isHovered,
            dashPattern: isHovered ? [8, 4] : undefined,
          }
        );
        this._drawComparisonAnalysisOverlays({
          renderer,
          entityId: seriesItem.entityId as string,
          seriesColor: seriesItem.color as string,
          comparisonPts: winPts,
          analysis: rowAnalysis,
          renderT0,
          renderT1,
          axis: resolvedAxis,
          rateAxis: resolvedRateAxis,
          events,
          comparisonWindowId: String(
            (win as Record<string, unknown>).id || ""
          ),
        });
      }

      // Draw binary state backgrounds on every row.
      (binaryBackgrounds as unknown[]).forEach((bg: unknown) => {
        const bgItem = bg as Record<string, unknown>;
        if (
          !this._hiddenSeries.has(bgItem.entityId as string) &&
          (bgItem.spans as unknown[])?.length
        ) {
          renderer.drawStateBands(
            bgItem.spans,
            renderT0,
            renderT1,
            bgItem.color as string,
            0.1
          );
        }
      });
      if ((correlatedAnomalySpans as unknown[]).length) {
        renderer.drawStateBands(
          correlatedAnomalySpans,
          renderT0,
          renderT1,
          "#ef4444",
          0.1
        );
      }

      // Draw annotation event lines and diamond markers on this row's canvas.
      renderer.drawAnnotations(events || [], renderT0, renderT1, {
        showLines:
          (this._config as Record<string, unknown>).show_event_lines !== false,
        showMarkers:
          (this._config as Record<string, unknown>).show_event_lines !== false,
      });

      // Draw recorded event point markers (circles + icon overlay elements).
      // The overlay has already been cleared above; skip clearing per-row and
      // apply the row's vertical offset so icons land at the correct stage position.
      this._drawRecordedEventPoints(
        renderer,
        [seriesItem],
        events || [],
        renderT0,
        renderT1,
        {
          showIcons: this._config.show_event_markers !== false,
          yOffset: rowOffset,
          skipOverlayClear: true,
        }
      );

      // ── Analysis overlays ─────────────────────────────────────────────────
      // Threshold shading and horizontal line.
      if (rowAnalysis.show_threshold_analysis === true) {
        const thresholdValue = Number(rowAnalysis.threshold_value);
        if (Number.isFinite(thresholdValue)) {
          if (
            rowAnalysis.show_threshold_shading === true &&
            (seriesItem.pts as unknown[]).length
          ) {
            renderer.drawThresholdArea(
              seriesItem.pts,
              thresholdValue,
              seriesItem.color as string,
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              {
                mode:
                  rowAnalysis.threshold_direction === "below"
                    ? "below"
                    : "above",
                fillAlpha: rowHideSource ? 0.24 : 0.14,
              }
            );
          }
          renderer.drawLine(
            [
              [renderT0, thresholdValue],
              [renderT1, thresholdValue],
            ],
            hexToRgba(seriesItem.color as string, rowHideSource ? 0.82 : 0.46),
            renderT0,
            renderT1,
            (resolvedAxis as Record<string, number>).min,
            (resolvedAxis as Record<string, number>).max,
            { lineOpacity: rowHideSource ? 0.84 : 0.48, lineWidth: 1.15 }
          );
        }
      }

      // Summary stat lines (min / mean / max).
      if (rowSummaryStats) {
        // Gradient shading between min/max and the mean — drawn first so lines sit on top.
        if (rowAnalysis.show_summary_stats_shading === true) {
          const fillAlpha = rowHideSource ? 0.1 : 0.06;
          renderer.drawGradientBand(
            (rowSummaryStats as Record<string, number>).min,
            (rowSummaryStats as Record<string, number>).mean,
            seriesItem.color as string,
            renderT0,
            renderT1,
            (resolvedAxis as Record<string, number>).min,
            (resolvedAxis as Record<string, number>).max,
            { fillAlpha }
          );
          renderer.drawGradientBand(
            (rowSummaryStats as Record<string, number>).max,
            (rowSummaryStats as Record<string, number>).mean,
            seriesItem.color as string,
            renderT0,
            renderT1,
            (resolvedAxis as Record<string, number>).min,
            (resolvedAxis as Record<string, number>).max,
            { fillAlpha }
          );
        }
        const summaryEntries = [
          {
            type: "min",
            value: (rowSummaryStats as Record<string, number>).min,
            alpha: rowHideSource ? 0.78 : 0.42,
            width: 1.1,
            dotted: true,
          },
          {
            type: "mean",
            value: (rowSummaryStats as Record<string, number>).mean,
            alpha: rowHideSource ? 0.94 : 0.78,
            width: 1.8,
            dotted: false,
          },
          {
            type: "max",
            value: (rowSummaryStats as Record<string, number>).max,
            alpha: rowHideSource ? 0.78 : 0.42,
            width: 1.1,
            dotted: true,
          },
        ];
        for (const entry of summaryEntries) {
          if (!Number.isFinite(entry.value)) continue;
          renderer.drawLine(
            [
              [renderT0, entry.value],
              [renderT1, entry.value],
            ],
            hexToRgba(seriesItem.color as string, entry.alpha),
            renderT0,
            renderT1,
            (resolvedAxis as Record<string, number>).min,
            (resolvedAxis as Record<string, number>).max,
            {
              lineOpacity: rowHideSource ? 0.82 : 0.34,
              lineWidth: entry.width,
              dotted: entry.dotted,
            }
          );
        }
      }

      // Trend line.
      if ((rowTrendPts as unknown[]).length >= 2) {
        const trendOpts = this._getTrendRenderOptions(
          rowAnalysis.trend_method as string,
          rowHideSource
        );
        renderer.drawLine(
          rowTrendPts,
          hexToRgba(seriesItem.color as string, trendOpts.colorAlpha),
          renderT0,
          renderT1,
          (resolvedAxis as Record<string, number>).min,
          (resolvedAxis as Record<string, number>).max,
          {
            lineOpacity: trendOpts.lineOpacity,
            lineWidth: trendOpts.lineWidth,
            dashed: trendOpts.dashed,
            dotted: trendOpts.dotted,
          }
        );
      }

      // Rate-of-change line (secondary right axis).
      if ((rowRatePts as unknown[]).length >= 2 && resolvedRateAxis) {
        renderer.drawLine(
          rowRatePts,
          hexToRgba(seriesItem.color as string, rowHideSource ? 0.96 : 0.82),
          renderT0,
          renderT1,
          resolvedRateAxis!.min,
          resolvedRateAxis!.max,
          {
            lineOpacity: rowHideSource ? 0.88 : 0.66,
            lineWidth: 1.55,
            dashPattern: [7, 3, 1.5, 3],
          }
        );
      }

      // Delta line (secondary right axis, comparison mode only).
      if (
        (rowDeltaPts as unknown[]).length >= 2 &&
        resolvedDeltaAxis &&
        rowAnalysis.show_delta_lines === true
      ) {
        renderer.drawLine(
          rowDeltaPts,
          hexToRgba(seriesItem.color as string, 0.92),
          renderT0,
          renderT1,
          resolvedDeltaAxis!.min,
          resolvedDeltaAxis!.max,
          { lineOpacity: 0.82, lineWidth: 1.9, dashed: true }
        );
      }

      // Anomaly clusters.
      let rowAnomalyRegions: unknown[] = [];
      if ((rowAnomalyClusters as unknown[]).length) {
        const filteredClusters = this._filterAnnotatedAnomalyClusters(
          {
            entityId: seriesItem.entityId as string,
            anomalyClusters: rowAnomalyClusters,
          },
          events || []
        );
        if ((filteredClusters as unknown[]).length > 0) {
          const normalClusters = (filteredClusters as unknown[]).filter(
            (c: unknown) => !(c as Record<string, unknown>).isOverlap
          );
          const overlapClusters = (filteredClusters as unknown[]).filter(
            (c: unknown) => (c as Record<string, unknown>).isOverlap === true
          );
          const baseColor = hexToRgba(
            seriesItem.color as string,
            rowHideSource ? 0.96 : 0.86
          );
          const regionOpts = {
            strokeAlpha: rowHideSource ? 0.98 : 0.9,
            lineWidth: rowHideSource ? 2.5 : 2.1,
            haloWidth: rowHideSource ? 5.5 : 4.8,
            haloColor: "rgba(255,255,255,0.88)",
            haloAlpha: rowHideSource ? 0.92 : 0.82,
            fillColor: hexToRgba(
              seriesItem.color as string,
              rowHideSource ? 0.14 : 0.1
            ),
            fillAlpha: 1,
            pointPadding: rowHideSource ? 12 : 10,
            minRadiusX: 10,
            minRadiusY: 10,
          };
          const overlapOpts = {
            strokeAlpha: 0.98,
            lineWidth: 2.8,
            haloWidth: 7,
            haloColor: "rgba(232,160,32,0.22)",
            haloAlpha: 1,
            fillColor: "rgba(232,160,32,0.1)",
            fillAlpha: 1,
            pointPadding: rowHideSource ? 15 : 13,
            minRadiusX: 12,
            minRadiusY: 12,
          };
          if (normalClusters.length > 0) {
            renderer.drawAnomalyClusters(
              normalClusters,
              baseColor,
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              regionOpts
            );
          }
          if (overlapClusters.length > 0) {
            renderer.drawAnomalyClusters(
              overlapClusters,
              baseColor,
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              regionOpts
            );
            if (rowAnalysis.anomaly_overlap_mode !== "only") {
              renderer.drawAnomalyClusters(
                overlapClusters,
                "rgba(232,160,32,0.94)",
                renderT0,
                renderT1,
                (resolvedAxis as Record<string, number>).min,
                (resolvedAxis as Record<string, number>).max,
                overlapOpts
              );
            }
          }
          rowAnomalyRegions = renderer
            .getAnomalyClusterRegions(
              [...normalClusters, ...overlapClusters],
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              regionOpts
            )
            .map((region: unknown) => ({
              ...(region as Record<string, unknown>),
              relatedEntityId: seriesItem.entityId,
              label: seriesItem.label,
              unit: seriesItem.unit || "",
              color: seriesItem.color,
              sensitivity: rowAnalysis.anomaly_sensitivity,
            }));
        }
      }

      tracks.push({
        canvas: rowCanvas,
        renderer,
        series: seriesItem,
        axis: resolvedAxis,
        rowOffset,
        analysis: rowAnalysis,
        summaryStats: rowSummaryStats,
        trendPts: rowTrendPts,
        ratePts: rowRatePts,
        rateAxis: resolvedRateAxis,
        deltaPts: rowDeltaPts,
        deltaAxis: resolvedDeltaAxis,
        anomalyRegions: rowAnomalyRegions,
      });
    }

    this._renderSplitAxisOverlays(tracks);
    this._renderComparisonPreviewOverlay(
      tracks[0]
        ? ((tracks[0] as Record<string, unknown>).renderer as {
            pad?: { left?: number };
          })
        : null
    );

    // Build comparison hover series for the tooltip, keyed to each track so the
    // tooltip can show interpolated values for the active date window.
    const comparisonHoverSeries: unknown[] = [];
    for (const track of tracks) {
      const trackSeries = (track as Record<string, unknown>).series as Record<
        string,
        unknown
      >;
      const trackAnalysis = ((track as Record<string, unknown>)
        .analysis || normalizeHistorySeriesAnalysis(null)) as SeriesAnalysis;
      for (const win of (drawableComparisonResults || []) as unknown[]) {
        const winPts = await this._resolveComparisonWindowPoints(
          trackSeries.entityId as string,
          win as {
            id: string;
            time_offset_ms: number;
            histResult: unknown;
            statsResult: unknown;
            label?: string;
          },
          trackAnalysis,
          renderT0,
          renderT1
        );
        if (!winPts.length) {
          continue;
        }
        const isHovered =
          !!hoveredComparisonWindowId &&
          (win as Record<string, unknown>).id === hoveredComparisonWindowId;
        const isSelected =
          !!selectedComparisonWindowId &&
          (win as Record<string, unknown>).id === selectedComparisonWindowId;
        let hoverOpacity: number;
        if (isHovered) {
          hoverOpacity = 0.85;
        } else if (hoveringDifferentComparison && isSelected) {
          hoverOpacity = 0.25;
        } else {
          hoverOpacity = 0.85;
        }
        comparisonHoverSeries.push({
          entityId: `${(win as Record<string, unknown>).id}:${trackSeries.entityId}`,
          relatedEntityId: trackSeries.entityId,
          comparisonParentId: `${(win as Record<string, unknown>).id}:${trackSeries.entityId}`,
          label: trackSeries.label,
          windowLabel: (win as Record<string, unknown>).label || "Date window",
          unit: trackSeries.unit,
          pts: winPts,
          trendPts:
            trackAnalysis.show_trend_lines === true && winPts.length >= 2
              ? this._buildTrendPoints(
                  winPts,
                  trackAnalysis.trend_method,
                  trackAnalysis.trend_window
                )
              : [],
          ratePts:
            trackAnalysis.show_rate_of_change === true && winPts.length >= 2
              ? this._buildRateOfChangePoints(
                  winPts,
                  trackAnalysis.rate_window
                )
              : [],
          summaryStats:
            trackAnalysis.show_summary_stats === true
              ? this._buildSummaryStats(winPts)
              : null,
          thresholdValue:
            trackAnalysis.show_threshold_analysis === true
              ? Number(trackAnalysis.threshold_value)
              : null,
          color: trackSeries.color,
          hoverOpacity,
          track,
        });
      }
    }

    this._attachSplitHover(
      tracks,
      comparisonHoverSeries,
      events,
      renderT0,
      renderT1,
      chartStage,
      options,
      effectiveAnalysisMap,
      hasSelectedComparisonWindow
    );
    this._fireComparisonBackendAnomalyRequests(
      drawableComparisonResults as Array<{
        id: string;
        time_offset_ms: number;
        histResult: unknown;
        statsResult: unknown;
        label?: string;
      }>,
      effectiveAnalysisMap as Map<string, unknown>,
      renderT0,
      renderT1
    );
  }

  // ── Split-view hover / zoom / scroll interaction ─────────────────────────────

  _attachSplitHover(
    tracks: unknown[],
    comparisonHoverSeries: unknown[],
    events: unknown[],
    t0: number,
    t1: number,
    chartStage: HTMLElement | null,
    options: Record<string, unknown>,
    analysisMap: Map<string, unknown>,
    hasSelectedComparisonWindow: boolean
  ): void {
    if (this._chartHoverCleanup) {
      this._chartHoverCleanup();
      this._chartHoverCleanup = null;
    }
    if (!tracks.length || !chartStage) {
      return;
    }

    const primaryRenderer = (tracks[0] as Record<string, unknown>)
      .renderer as InstanceType<typeof ChartRenderer>;
    const lastTrack = tracks[tracks.length - 1] as Record<string, unknown>;
    const eventThresholdMs = (
      primaryRenderer as unknown as Record<string, number>
    ).cw
      ? 14 *
        ((t1 - t0) / (primaryRenderer as unknown as Record<string, number>).cw)
      : 0;

    // Vertical span of the plot area across all rows — used for the zoom selection highlight.
    const splitSelTop =
      ((tracks[0] as Record<string, unknown>).rowOffset as number) +
      (primaryRenderer.pad as Record<string, number>).top;
    const splitSelBottom =
      (lastTrack.rowOffset as number) +
      (
        (lastTrack.renderer as InstanceType<typeof ChartRenderer>)
          .pad as Record<string, number>
      ).top +
      (lastTrack.renderer as unknown as Record<string, number>).ch;
    const splitSelHeight = splitSelBottom - splitSelTop;

    // Shared transparent overlay spanning all rows.
    const overlayEl = document.createElement("div");
    overlayEl.id = "chart-split-overlay";
    overlayEl.style.cssText =
      "position:absolute;inset:0;pointer-events:auto;z-index:2;cursor:crosshair;";
    chartStage.appendChild(overlayEl);

    // ── Coordinate helpers ─────────────────────────────────────────────────────
    // Both the overlay and the selection div are absolute within chart-stage, so
    // (clientX - overlayRect.left) gives stage-relative X directly.
    const overlayRelX = (clientX: number) => {
      const rect = overlayEl.getBoundingClientRect();
      return clampChartValue(
        clientX - rect.left,
        (primaryRenderer.pad as Record<string, number>).left,
        (primaryRenderer.pad as Record<string, number>).left +
          (primaryRenderer as unknown as Record<string, number>).cw
      );
    };

    const stageXToTime = (stageX: number) => {
      const ratio = (primaryRenderer as unknown as Record<string, number>).cw
        ? (stageX - (primaryRenderer.pad as Record<string, number>).left) /
          (primaryRenderer as unknown as Record<string, number>).cw
        : 0;
      return t0 + ratio * (t1 - t0);
    };

    const inPlotBoundsX = (clientX: number) => {
      const rect = overlayEl.getBoundingClientRect();
      const localX = clientX - rect.left;
      return (
        localX >= (primaryRenderer.pad as Record<string, number>).left &&
        localX <=
          (primaryRenderer.pad as Record<string, number>).left +
            (primaryRenderer as unknown as Record<string, number>).cw
      );
    };

    // ── Hover ──────────────────────────────────────────────────────────────────
    const buildSplitHover = (clientX: number) => {
      const baseRect = (
        (tracks[0] as Record<string, unknown>).canvas as HTMLCanvasElement
      ).getBoundingClientRect();
      if (
        !baseRect.width ||
        !(primaryRenderer as unknown as Record<string, number>).cw
      ) {
        return null;
      }
      const localX = clampChartValue(
        clientX - baseRect.left,
        (primaryRenderer.pad as Record<string, number>).left,
        (primaryRenderer.pad as Record<string, number>).left +
          (primaryRenderer as unknown as Record<string, number>).cw
      );
      const ratio =
        (localX - (primaryRenderer.pad as Record<string, number>).left) /
        (primaryRenderer as unknown as Record<string, number>).cw;
      const timeMs = t0 + ratio * (t1 - t0);
      const x = primaryRenderer.xOf(timeMs, t0, t1);

      const values = (tracks as unknown[]).map((trackItem: unknown) => {
        const {
          renderer: trackRenderer,
          series,
          axis,
          rowOffset,
        } = trackItem as Record<string, unknown>;
        const value = (
          trackRenderer as InstanceType<typeof ChartRenderer>
        )._interpolateValue((series as Record<string, unknown>).pts, timeMs);
        if (value == null) {
          return {
            entityId: (series as Record<string, unknown>).entityId,
            label: (series as Record<string, unknown>).label,
            value: null,
            unit: (series as Record<string, unknown>).unit,
            color: (series as Record<string, unknown>).color,
            opacity: 1,
            hasValue: false,
            axisSide: "left",
            axisSlot: 0,
          };
        }
        return {
          entityId: (series as Record<string, unknown>).entityId,
          label: (series as Record<string, unknown>).label,
          value,
          unit: (series as Record<string, unknown>).unit,
          color: (series as Record<string, unknown>).color,
          opacity: 1,
          hasValue: true,
          x,
          y:
            (rowOffset as number) +
            (trackRenderer as InstanceType<typeof ChartRenderer>).yOf(
              value,
              (axis as Record<string, number>).min,
              (axis as Record<string, number>).max
            ),
          axisSide: "left",
          axisSlot: 0,
        };
      });

      const hoveredEvents: unknown[] = [];
      for (const event of (events || []) as unknown[]) {
        const eventTime = new Date(
          (event as Record<string, unknown>).timestamp as string
        ).getTime();
        if (eventTime < t0 || eventTime > t1) {
          continue;
        }
        const distance = Math.abs(eventTime - timeMs);
        if (distance <= eventThresholdMs) {
          hoveredEvents.push({
            ...(event as Record<string, unknown>),
            _hoverDistanceMs: distance,
          });
        }
      }
      hoveredEvents.sort(
        (a, b) =>
          ((a as Record<string, number>)._hoverDistanceMs || 0) -
          ((b as Record<string, number>)._hoverDistanceMs || 0)
      );

      const comparisonValues = (comparisonHoverSeries || []).map(
        (chs: unknown) => {
          const {
            pts,
            entityId,
            relatedEntityId,
            comparisonParentId,
            label,
            windowLabel,
            unit,
            color,
            hoverOpacity,
            track: cTrack,
          } = chs as Record<string, unknown>;
          const value = (
            (cTrack as Record<string, unknown>).renderer as InstanceType<
              typeof ChartRenderer
            >
          )._interpolateValue(pts, timeMs);
          if (value == null) {
            return {
              entityId,
              label,
              value: null,
              unit,
              color,
              opacity: hoverOpacity,
              hasValue: false,
              axisSide: "left",
              axisSlot: 0,
            };
          }
          return {
            entityId,
            relatedEntityId,
            comparisonParentId,
            label,
            windowLabel,
            value,
            unit,
            color,
            opacity: hoverOpacity,
            hasValue: true,
            x,
            y:
              ((cTrack as Record<string, unknown>).rowOffset as number) +
              (
                (cTrack as Record<string, unknown>).renderer as InstanceType<
                  typeof ChartRenderer
                >
              ).yOf(
                value,
                (
                  (cTrack as Record<string, unknown>).axis as Record<
                    string,
                    number
                  >
                ).min,
                (
                  (cTrack as Record<string, unknown>).axis as Record<
                    string,
                    number
                  >
                ).max
              ),
            axisSide: "left",
            axisSlot: 0,
          };
        }
      );

      // ── Analysis hover values ────────────────────────────────────────────
      const trendValues: unknown[] = [];
      const rateValues: unknown[] = [];
      const deltaValues: unknown[] = [];
      const summaryValues: unknown[] = [];
      const thresholdValues: unknown[] = [];
      const anomalyRegions: unknown[] = [];
      let showTrendCrosshairs = false;

      for (const track of tracks as unknown[]) {
        const {
          renderer: trackRenderer,
          series: trackSeries,
          axis: trackAxis,
          rowOffset: trackRowOffset,
          analysis: trackAnalysis,
          summaryStats: trackSummaryStats,
          trendPts: trackTrendPts,
          ratePts: trackRatePts,
          rateAxis: trackRateAxis,
          deltaPts: trackDeltaPts,
          deltaAxis: trackDeltaAxis,
          anomalyRegions: trackAnomalyRegions,
        } = track as Record<string, unknown>;

        const effectiveAnalysis = (trackAnalysis ||
          (analysisMap || new Map()).get(
            (trackSeries as Record<string, unknown>).entityId as string
          ) ||
          normalizeHistorySeriesAnalysis(null)) as SeriesAnalysis;
        const trackHideSource = this._seriesShouldHideSource(
          effectiveAnalysis,
          hasSelectedComparisonWindow
        );

        // Trend values.
        if (
          effectiveAnalysis.show_trend_lines === true &&
          Array.isArray(trackTrendPts) &&
          (trackTrendPts as unknown[]).length >= 2
        ) {
          if (effectiveAnalysis.show_trend_crosshairs === true)
            showTrendCrosshairs = true;
          const trendOpts = this._getTrendRenderOptions(
            effectiveAnalysis.trend_method as string,
            trackHideSource
          );
          const trendVal = (
            trackRenderer as InstanceType<typeof ChartRenderer>
          )._interpolateValue(trackTrendPts, timeMs);
          trendValues.push({
            entityId: `trend:${(trackSeries as Record<string, unknown>).entityId}`,
            relatedEntityId: (trackSeries as Record<string, unknown>).entityId,
            label: (trackSeries as Record<string, unknown>).label,
            baseLabel: (trackSeries as Record<string, unknown>).label,
            unit: (trackSeries as Record<string, unknown>).unit || "",
            color: hexToRgba(
              (trackSeries as Record<string, unknown>).color as string,
              trendOpts.colorAlpha
            ),
            opacity: trendOpts.lineOpacity,
            hasValue: trendVal != null,
            value: trendVal ?? null,
            ...(trendVal != null
              ? {
                  x,
                  y:
                    (trackRowOffset as number) +
                    (trackRenderer as InstanceType<typeof ChartRenderer>).yOf(
                      trendVal,
                      (trackAxis as Record<string, number>).min,
                      (trackAxis as Record<string, number>).max
                    ),
                }
              : {}),
            axisSide: "left",
            axisSlot: 0,
            trend: true,
            rawVisible: !trackHideSource,
            showCrosshair: effectiveAnalysis.show_trend_crosshairs === true,
          });
        }

        // Rate-of-change values.
        if (
          effectiveAnalysis.show_rate_of_change === true &&
          Array.isArray(trackRatePts) &&
          (trackRatePts as unknown[]).length >= 2 &&
          trackRateAxis
        ) {
          const rateVal = (
            trackRenderer as InstanceType<typeof ChartRenderer>
          )._interpolateValue(trackRatePts, timeMs);
          rateValues.push({
            entityId: `rate:${(trackSeries as Record<string, unknown>).entityId}`,
            relatedEntityId: (trackSeries as Record<string, unknown>).entityId,
            label: (trackSeries as Record<string, unknown>).label,
            baseLabel: (trackSeries as Record<string, unknown>).label,
            unit: (trackSeries as Record<string, unknown>).unit
              ? `${(trackSeries as Record<string, unknown>).unit}/h`
              : "/h",
            color: hexToRgba(
              (trackSeries as Record<string, unknown>).color as string,
              trackHideSource ? 0.96 : 0.82
            ),
            opacity: trackHideSource ? 0.88 : 0.66,
            hasValue: rateVal != null,
            value: rateVal ?? null,
            ...(rateVal != null
              ? {
                  x,
                  y:
                    (trackRowOffset as number) +
                    (trackRenderer as InstanceType<typeof ChartRenderer>).yOf(
                      rateVal,
                      (trackRateAxis as Record<string, number>).min,
                      (trackRateAxis as Record<string, number>).max
                    ),
                }
              : {}),
            axisSide: "right",
            axisSlot: 0,
            rate: true,
            rawVisible: !trackHideSource,
          });
        }

        // Delta values.
        if (
          effectiveAnalysis.show_delta_analysis === true &&
          effectiveAnalysis.show_delta_tooltip === true &&
          Array.isArray(trackDeltaPts) &&
          (trackDeltaPts as unknown[]).length >= 2 &&
          trackDeltaAxis
        ) {
          const deltaVal = (
            trackRenderer as InstanceType<typeof ChartRenderer>
          )._interpolateValue(trackDeltaPts, timeMs);
          deltaValues.push({
            entityId: `delta:${(trackSeries as Record<string, unknown>).entityId}`,
            relatedEntityId: (trackSeries as Record<string, unknown>).entityId,
            label: (trackSeries as Record<string, unknown>).label,
            baseLabel: (trackSeries as Record<string, unknown>).label,
            unit: (trackSeries as Record<string, unknown>).unit || "",
            color: hexToRgba(
              (trackSeries as Record<string, unknown>).color as string,
              0.92
            ),
            opacity: 0.82,
            hasValue: deltaVal != null,
            value: deltaVal ?? null,
            ...(deltaVal != null
              ? {
                  x,
                  y:
                    (trackRowOffset as number) +
                    (trackRenderer as InstanceType<typeof ChartRenderer>).yOf(
                      deltaVal,
                      (trackDeltaAxis as Record<string, number>).min,
                      (trackDeltaAxis as Record<string, number>).max
                    ),
                }
              : {}),
            axisSide: "right",
            axisSlot: 0,
            delta: true,
            rawVisible: !trackHideSource,
          });
        }

        // Summary stat values (constant horizontal lines).
        if (
          effectiveAnalysis.show_summary_stats === true &&
          trackSummaryStats
        ) {
          const summaryEntries = [
            {
              type: "min",
              value: (trackSummaryStats as Record<string, number>).min,
              alphaV: trackHideSource ? 0.94 : 0.78,
              opac: trackHideSource ? 0.94 : 0.72,
            },
            {
              type: "mean",
              value: (trackSummaryStats as Record<string, number>).mean,
              alphaV: trackHideSource ? 0.94 : 0.78,
              opac: trackHideSource ? 0.94 : 0.72,
            },
            {
              type: "max",
              value: (trackSummaryStats as Record<string, number>).max,
              alphaV: trackHideSource ? 0.94 : 0.78,
              opac: trackHideSource ? 0.94 : 0.72,
            },
          ];
          for (const entry of summaryEntries) {
            if (!Number.isFinite(entry.value)) continue;
            summaryValues.push({
              entityId: `summary:${entry.type}:${(trackSeries as Record<string, unknown>).entityId}`,
              relatedEntityId: (trackSeries as Record<string, unknown>)
                .entityId,
              label: (trackSeries as Record<string, unknown>).label,
              baseLabel: (trackSeries as Record<string, unknown>).label,
              unit: (trackSeries as Record<string, unknown>).unit || "",
              color: hexToRgba(
                (trackSeries as Record<string, unknown>).color as string,
                entry.alphaV
              ),
              opacity: entry.opac,
              hasValue: true,
              value: entry.value,
              axisSide: "left",
              axisSlot: 0,
              summaryType: entry.type,
              summary: true,
              rawVisible: !trackHideSource,
            });
          }
        }

        // Threshold value (constant horizontal line).
        if (effectiveAnalysis.show_threshold_analysis === true) {
          const thresholdValue = Number(effectiveAnalysis.threshold_value);
          if (Number.isFinite(thresholdValue)) {
            thresholdValues.push({
              entityId: `threshold:${(trackSeries as Record<string, unknown>).entityId}`,
              relatedEntityId: (trackSeries as Record<string, unknown>)
                .entityId,
              label: (trackSeries as Record<string, unknown>).label,
              baseLabel: (trackSeries as Record<string, unknown>).label,
              unit: (trackSeries as Record<string, unknown>).unit || "",
              color: hexToRgba(
                (trackSeries as Record<string, unknown>).color as string,
                trackHideSource ? 0.82 : 0.46
              ),
              opacity: trackHideSource ? 0.84 : 0.48,
              hasValue: true,
              value: thresholdValue,
              axisSide: "left",
              axisSlot: 0,
              threshold: true,
              rawVisible: !trackHideSource,
            });
          }
        }

        // Anomaly regions — check which (if any) the cursor time falls within.
        if (Array.isArray(trackAnomalyRegions)) {
          for (const region of trackAnomalyRegions as unknown[]) {
            const clusterPoints = (region as Record<string, unknown>)?.cluster
              ? ((
                  (region as Record<string, unknown>).cluster as Record<
                    string,
                    unknown
                  >
                )?.points as unknown[] | undefined)
              : undefined;
            const regionStartMs = clusterPoints?.[0]
              ? ((clusterPoints[0] as Record<string, number>)?.timeMs ??
                (region as Record<string, number>).startTime)
              : (region as Record<string, number>).startTime;
            const regionEndMs = clusterPoints?.length
              ? ((
                  clusterPoints[clusterPoints.length - 1] as Record<
                    string,
                    number
                  >
                )?.timeMs ?? (region as Record<string, number>).endTime)
              : (region as Record<string, number>).endTime;
            if (
              Number.isFinite(regionStartMs) &&
              Number.isFinite(regionEndMs) &&
              timeMs >= regionStartMs &&
              timeMs <= regionEndMs
            ) {
              anomalyRegions.push(region);
            }
          }
        }
      }

      for (const comparisonSeries of comparisonHoverSeries as unknown[]) {
        const seriesEntry = comparisonSeries as Record<string, unknown>;
        const track = seriesEntry.track as Record<string, unknown>;
        const trackRenderer =
          track.renderer as InstanceType<typeof ChartRenderer>;
        const trackAxis = track.axis as Record<string, number>;
        const trackRateAxis =
          (track.rateAxis as Record<string, number> | null) || null;
        const trackRowOffset = track.rowOffset as number;
        const trendPts = Array.isArray(seriesEntry.trendPts)
          ? (seriesEntry.trendPts as [number, number][])
          : [];
        if (trendPts.length >= 2) {
          const trendVal = trackRenderer._interpolateValue(trendPts, timeMs);
          trendValues.push({
            entityId: `trend:${seriesEntry.entityId as string}`,
            relatedEntityId: seriesEntry.relatedEntityId || "",
            comparisonParentId: seriesEntry.comparisonParentId || "",
            label: seriesEntry.label,
            baseLabel: seriesEntry.label,
            windowLabel: seriesEntry.windowLabel || "Date window",
            unit: seriesEntry.unit || "",
            color: hexToRgba(seriesEntry.color as string, 0.34),
            opacity: 0.34,
            hasValue: trendVal != null,
            value: trendVal ?? null,
            ...(trendVal != null
              ? {
                  x,
                  y:
                    trackRowOffset +
                    trackRenderer.yOf(
                      trendVal,
                      trackAxis.min,
                      trackAxis.max
                    ),
                }
              : {}),
            axisSide: "left",
            axisSlot: 0,
            trend: true,
            rawVisible: true,
            comparisonDerived: true,
          });
        }
        const ratePts = Array.isArray(seriesEntry.ratePts)
          ? (seriesEntry.ratePts as [number, number][])
          : [];
        if (ratePts.length >= 2 && trackRateAxis) {
          const rateVal = trackRenderer._interpolateValue(ratePts, timeMs);
          rateValues.push({
            entityId: `rate:${seriesEntry.entityId as string}`,
            relatedEntityId: seriesEntry.relatedEntityId || "",
            comparisonParentId: seriesEntry.comparisonParentId || "",
            label: seriesEntry.label,
            baseLabel: seriesEntry.label,
            windowLabel: seriesEntry.windowLabel || "Date window",
            unit: seriesEntry.unit ? `${seriesEntry.unit}/h` : "/h",
            color: hexToRgba(seriesEntry.color as string, 0.46),
            opacity: 0.46,
            hasValue: rateVal != null,
            value: rateVal ?? null,
            ...(rateVal != null
              ? {
                  x,
                  y:
                    trackRowOffset +
                    trackRenderer.yOf(
                      rateVal,
                      trackRateAxis.min,
                      trackRateAxis.max
                    ),
                }
              : {}),
            axisSide: "right",
            axisSlot: 0,
            rate: true,
            rawVisible: true,
            comparisonDerived: true,
          });
        }
        const summaryStats = seriesEntry.summaryStats as
          | Record<string, number>
          | null;
        if (summaryStats) {
          [
            { type: "min", value: summaryStats.min },
            { type: "mean", value: summaryStats.mean },
            { type: "max", value: summaryStats.max },
          ].forEach((entry) => {
            if (!Number.isFinite(entry.value)) {
              return;
            }
            summaryValues.push({
              entityId: `summary:${entry.type}:${seriesEntry.entityId as string}`,
              relatedEntityId: seriesEntry.relatedEntityId || "",
              comparisonParentId: seriesEntry.comparisonParentId || "",
              label: seriesEntry.label,
              baseLabel: seriesEntry.label,
              windowLabel: seriesEntry.windowLabel || "Date window",
              unit: seriesEntry.unit || "",
              color: hexToRgba(
                seriesEntry.color as string,
                entry.type === "mean" ? 0.44 : 0.24
              ),
              opacity: entry.type === "mean" ? 0.52 : 0.3,
              hasValue: true,
              value: entry.value,
              axisSide: "left",
              axisSlot: 0,
              summaryType: entry.type,
              summary: true,
              rawVisible: true,
              comparisonDerived: true,
            });
          });
        }
        const thresholdValue = Number(seriesEntry.thresholdValue);
        if (Number.isFinite(thresholdValue)) {
          thresholdValues.push({
            entityId: `threshold:${seriesEntry.entityId as string}`,
            relatedEntityId: seriesEntry.relatedEntityId || "",
            comparisonParentId: seriesEntry.comparisonParentId || "",
            label: seriesEntry.label,
            baseLabel: seriesEntry.label,
            windowLabel: seriesEntry.windowLabel || "Date window",
            unit: seriesEntry.unit || "",
            color: hexToRgba(seriesEntry.color as string, 0.28),
            opacity: 0.34,
            hasValue: true,
            value: thresholdValue,
            axisSide: "left",
            axisSlot: 0,
            threshold: true,
            rawVisible: true,
            comparisonDerived: true,
          });
        }
      }

      const hideRawData = (tracks as unknown[]).every((track: unknown) => {
        const eff =
          (track as Record<string, unknown>).analysis ||
          (analysisMap || new Map()).get(
            (
              (track as Record<string, unknown>).series as Record<
                string,
                unknown
              >
            ).entityId as string
          ) ||
          (normalizeHistorySeriesAnalysis(null) as SeriesAnalysis);
        return this._seriesShouldHideSource(
          eff as SeriesAnalysis,
          hasSelectedComparisonWindow
        );
      });

      const firstWithValue = (values as unknown[]).find(
        (v: unknown) => (v as Record<string, unknown>).hasValue
      ) as Record<string, unknown> | undefined;
      return {
        x,
        y: firstWithValue?.y ?? splitSelTop + 12,
        timeMs,
        rangeStartMs: timeMs,
        rangeEndMs: timeMs,
        values: (values as unknown[]).filter(
          (v: unknown) => (v as Record<string, unknown>).hasValue
        ),
        trendValues,
        rateValues,
        deltaValues,
        summaryValues,
        thresholdValues,
        comparisonValues: (comparisonValues as unknown[]).filter(
          (v: unknown) => (v as Record<string, unknown>).hasValue
        ),
        binaryValues: [],
        primary: firstWithValue ?? null,
        event:
          hoveredEvents.length > 0
            ? Object.fromEntries(
                Object.entries(
                  hoveredEvents[0] as Record<string, unknown>
                ).filter(([key]) => key !== "_hoverDistanceMs")
              )
            : null,
        events: (hoveredEvents as unknown[]).map((ev: unknown) =>
          Object.fromEntries(
            Object.entries(ev as Record<string, unknown>).filter(
              ([key]) => key !== "_hoverDistanceMs"
            )
          )
        ),
        anomalyRegions,
        emphasizeGuides: options.emphasizeHoverGuides === true,
        showTrendCrosshairs,
        hideRawData,
        splitVertical: { top: splitSelTop, height: splitSelHeight },
      };
    };

    const showFromPointer = (clientX: number, clientY: number) => {
      if (this._chartZoomDragging) {
        return;
      }
      const hover = buildSplitHover(clientX);
      if (!hover) {
        this._chartLastHover = null;
        hideLineChartHover(this);
        overlayEl.style.cursor = "default";
        return;
      }
      this._chartLastHover = hover;
      showLineChartCrosshair(this, primaryRenderer, hover);
      if ((this._config as Record<string, unknown>).show_tooltips !== false) {
        showLineChartTooltip(this, hover, clientX, clientY);
      } else {
        hideTooltip(this);
      }
      dispatchLineChartHover(this, hover);
      overlayEl.style.cursor = "crosshair";
    };

    const hideHover = () => {
      this._chartLastHover = null;
      hideLineChartHover(this);
    };

    const onMouseMove = (ev: MouseEvent) =>
      showFromPointer(ev.clientX, ev.clientY);
    const onMouseLeave = (ev: MouseEvent) => {
      const nextTarget = ev.relatedTarget;
      const addButton = this.querySelector("#chart-add-annotation");
      if (
        nextTarget &&
        addButton instanceof HTMLElement &&
        addButton.contains(nextTarget as Node)
      ) {
        return;
      }
      hideHover();
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length === 1) {
        showFromPointer(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };
    const onTouchEnd = () => hideHover();

    overlayEl.addEventListener("mousemove", onMouseMove);
    overlayEl.addEventListener("mouseleave", onMouseLeave);
    overlayEl.addEventListener("touchmove", onTouchMove, { passive: true });
    overlayEl.addEventListener("touchend", onTouchEnd);

    this._chartHoverCleanup = () => {
      overlayEl.removeEventListener("mousemove", onMouseMove);
      overlayEl.removeEventListener("mouseleave", onMouseLeave);
      overlayEl.removeEventListener("touchmove", onTouchMove);
      overlayEl.removeEventListener("touchend", onTouchEnd);
    };

    // ── Zoom drag-select ───────────────────────────────────────────────────────
    const selection = this.querySelector("#chart-zoom-selection");

    const hideZoomSelection = () => {
      if (!selection) {
        return;
      }
      (selection as HTMLElement).hidden = true;
      (selection as HTMLElement).classList.remove("visible");
    };

    const renderZoomSelection = (startX: number, currentX: number) => {
      if (!selection) {
        return;
      }
      const left = Math.min(startX, currentX);
      const width = Math.abs(currentX - startX);
      (selection as HTMLElement).style.left = `${left}px`;
      (selection as HTMLElement).style.top = `${splitSelTop}px`;
      (selection as HTMLElement).style.width = `${width}px`;
      (selection as HTMLElement).style.height = `${splitSelHeight}px`;
      (selection as HTMLElement).hidden = false;
      (selection as HTMLElement).classList.add("visible");
    };

    let zoomPointerId: number | null = null;
    let zoomStartX = 0;
    let zoomCurrentX = 0;
    let zoomDragging = false;

    const onZoomPointerMove = (ev: PointerEvent) => {
      if (zoomPointerId == null || ev.pointerId !== zoomPointerId) {
        return;
      }
      zoomCurrentX = overlayRelX(ev.clientX);
      if (!zoomDragging && Math.abs(zoomCurrentX - zoomStartX) < 6) {
        return;
      }
      zoomDragging = true;
      this._chartZoomDragging = true;
      hideLineChartHover(this);
      renderZoomSelection(zoomStartX, zoomCurrentX);
      ev.preventDefault();
    };

    const finishZoom = (ev: PointerEvent) => {
      if (zoomPointerId == null || ev.pointerId !== zoomPointerId) {
        return;
      }
      const didDrag = zoomDragging;
      const endX = zoomCurrentX;
      window.removeEventListener("pointermove", onZoomPointerMove);
      window.removeEventListener("pointerup", finishZoom);
      window.removeEventListener("pointercancel", finishZoom);
      zoomPointerId = null;
      zoomDragging = false;
      this._chartZoomDragging = false;
      hideZoomSelection();
      if (!didDrag || Math.abs(endX - zoomStartX) < 8) {
        return;
      }
      const startTime = Math.min(stageXToTime(zoomStartX), stageXToTime(endX));
      const endTime = Math.max(stageXToTime(zoomStartX), stageXToTime(endX));
      this._applyZoomRange(startTime, endTime);
    };

    const onZoomPointerDown = (ev: PointerEvent) => {
      if (ev.button !== 0 || !inPlotBoundsX(ev.clientX)) {
        return;
      }
      zoomPointerId = ev.pointerId;
      zoomStartX = overlayRelX(ev.clientX);
      zoomCurrentX = zoomStartX;
      zoomDragging = false;
      this._chartZoomDragging = false;
      window.addEventListener("pointermove", onZoomPointerMove);
      window.addEventListener("pointerup", finishZoom);
      window.addEventListener("pointercancel", finishZoom);
    };

    const onZoomDoubleClick = (ev: MouseEvent) => {
      if (!inPlotBoundsX(ev.clientX)) {
        return;
      }
      ev.preventDefault();
      this._clearZoomRange();
    };

    overlayEl.addEventListener("pointerdown", onZoomPointerDown);
    overlayEl.addEventListener("dblclick", onZoomDoubleClick);

    if (this._chartZoomCleanup) {
      this._chartZoomCleanup();
    }
    this._chartZoomCleanup = () => {
      overlayEl.removeEventListener("pointerdown", onZoomPointerDown);
      overlayEl.removeEventListener("dblclick", onZoomDoubleClick);
      window.removeEventListener("pointermove", onZoomPointerMove);
      window.removeEventListener("pointerup", finishZoom);
      window.removeEventListener("pointercancel", finishZoom);
      zoomPointerId = null;
      zoomDragging = false;
      this._chartZoomDragging = false;
      hideZoomSelection();
    };
  }
}

if (!customElements.get("hass-datapoints-history-chart")) {
  customElements.define("hass-datapoints-history-chart", HistoryChart);
}
