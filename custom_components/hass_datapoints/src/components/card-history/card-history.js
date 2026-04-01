import {
  attachLineChartHover,
  attachLineChartRangeZoom,
  buildDataPointsHistoryPath,
  clampChartValue,
  COLORS,
  contrastColor,
  createChartZoomRange,
  createHiddenEventIdSet,
  createHiddenSeriesSet,
  dispatchLineChartHover,
  entityName,
  esc,
  fetchEvents,
  fetchHistoryDuringPeriod,
  fetchStatisticsDuringPeriod,
  hexToRgba,
  hideLineChartHover,
  hideTooltip,
  mergeTargetSelections,
  navigateToDataPointsHistory,
  normalizeCacheIdList,
  normalizeHistorySeriesAnalysis,
  normalizeTargetSelection,
  parseDateValue,
  renderChartAxisHoverDots,
  renderChartAxisOverlays,
  resolveChartLabelColor,
  setupCanvas,
  showLineChartCrosshair,
  showLineChartTooltip,
  ChartRenderer,
} from "../../lib/shared.js";
import { HistoryAnnotationDialogController } from "../annotation-dialog/annotation-dialog.js";
import { ChartCardBase } from "../card-chart-base/card-chart-base-legacy.js";
import { computeHistoryAnalysisInWorker } from "../../lib/workers/history-analysis-client.js";

/**
 * hass-datapoints-history-card – History line chart with annotation markers.
 */

const HISTORY_CHART_MAX_CANVAS_WIDTH_PX = 65536;
const HISTORY_CHART_MAX_ZOOM_MULTIPLIER = 365;
const HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX = 500;
const HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX = 440;

export class HassRecordsHistoryCard extends ChartCardBase {
  constructor() {
    super();
    this._hiddenSeries = new Set();
    this._hiddenEventIds = new Set();
    this._zoomRange = null;
    this._comparisonRequestId = 0;
    this._comparisonDataCache = new Map();
    this._scrollSyncSuspended = false;
    this._lastProgrammaticScrollLeft = null;
    this._ignoreNextProgrammaticScrollEvent = false;
    this._legendWrapRows = false;
    this._adjustComparisonAxisScale = false;
    this._drawRequestId = 0;
    this._onWindowKeyDown = (ev) => this._handleWindowKeyDown(ev);
    this._onChartScroll = () => this._handleChartScroll();
    this._creatingContextAnnotation = false;
    this._annotationDialog = new HistoryAnnotationDialogController(this);
  }

  connectedCallback() {
    window.addEventListener("keydown", this._onWindowKeyDown);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this._onWindowKeyDown);
    if (this._chartScrollViewportEl) {
      this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
    }
    this._annotationDialog?.teardown();
    super.disconnectedCallback();
  }

  setConfig(config) {
    if (!config.entity && !config.entities) {
      throw new Error("hass-datapoints-history-card: define `entity` or `entities`");
    }
    const nextConfig = {
      hours_to_show: 24,
      ...config,
      series_settings: Array.isArray(config.series_settings)
        ? config.series_settings.map((entry) => ({
          ...entry,
          analysis: entry?.analysis && typeof entry.analysis === "object"
            ? { ...entry.analysis }
            : entry?.analysis,
        }))
        : config.series_settings,
      hidden_event_ids: Array.isArray(config.hidden_event_ids)
        ? [...config.hidden_event_ids]
        : config.hidden_event_ids,
      comparison_windows: Array.isArray(config.comparison_windows)
        ? config.comparison_windows.map((entry) => ({ ...entry }))
        : config.comparison_windows,
      preload_comparison_windows: Array.isArray(config.preload_comparison_windows)
        ? config.preload_comparison_windows.map((entry) => ({ ...entry }))
        : config.preload_comparison_windows,
      comparison_preview_overlay: config.comparison_preview_overlay
        ? { ...config.comparison_preview_overlay }
        : null,
      selected_comparison_window_id: config.selected_comparison_window_id || null,
      hovered_comparison_window_id: config.hovered_comparison_window_id || null,
      show_trend_lines: config.show_trend_lines === true,
      show_summary_stats: config.show_summary_stats === true,
      show_rate_of_change: config.show_rate_of_change === true,
      show_threshold_analysis: config.show_threshold_analysis === true,
      show_threshold_shading: config.show_threshold_shading === true,
      hide_raw_data: config.hide_raw_data === true,
      show_trend_crosshairs: config.show_trend_crosshairs === true,
      trend_method: config.trend_method || "rolling_average",
      trend_window: config.trend_window || "24h",
      rate_window: config.rate_window || "1h",
      threshold_values: config.threshold_values && typeof config.threshold_values === "object"
        ? { ...config.threshold_values }
        : {},
      threshold_directions: config.threshold_directions && typeof config.threshold_directions === "object"
        ? { ...config.threshold_directions }
        : {},
      show_delta_analysis: config.show_delta_analysis === true,
      show_delta_tooltip: config.show_delta_tooltip !== false,
      show_delta_lines: config.show_delta_lines === true,
      hide_delta_source_series: config.hide_delta_source_series === true,
      delink_y_axis: config.delink_y_axis === true,
      split_view: config.split_view === true,
      show_data_gaps: config.show_data_gaps !== false,
      data_gap_threshold: config.data_gap_threshold || "2h",
    };
    const currentConfig = this._config || {};
    const currentDataKey = JSON.stringify({
      entities: currentConfig.entities,
      entity: currentConfig.entity,
      series_entities: Array.isArray(currentConfig.series_settings)
        ? currentConfig.series_settings.map((entry) => entry?.entity_id || entry?.entity || entry?.entityId || null)
        : null,
      datapoint_scope: currentConfig.datapoint_scope,
      hours_to_show: currentConfig.hours_to_show,
      start_time: currentConfig.start_time,
      end_time: currentConfig.end_time,
    });
    const nextDataKey = JSON.stringify({
      entities: nextConfig.entities,
      entity: nextConfig.entity,
      series_entities: Array.isArray(nextConfig.series_settings)
        ? nextConfig.series_settings.map((entry) => entry?.entity_id || entry?.entity || entry?.entityId || null)
        : null,
      datapoint_scope: nextConfig.datapoint_scope,
      hours_to_show: nextConfig.hours_to_show,
      start_time: nextConfig.start_time,
      end_time: nextConfig.end_time,
    });
    const currentViewKey = JSON.stringify({
      series_settings: currentConfig.series_settings || [],
      zoom_start_time: currentConfig.zoom_start_time,
      zoom_end_time: currentConfig.zoom_end_time,
      message_filter: currentConfig.message_filter || "",
      hidden_event_ids: currentConfig.hidden_event_ids || [],
      show_event_markers: currentConfig.show_event_markers !== false,
      show_event_lines: currentConfig.show_event_lines !== false,
      show_tooltips: currentConfig.show_tooltips !== false,
      emphasize_hover_guides: currentConfig.emphasize_hover_guides === true,
      show_correlated_anomalies: currentConfig.show_correlated_anomalies === true,
      show_trend_lines: currentConfig.show_trend_lines === true,
      show_summary_stats: currentConfig.show_summary_stats === true,
      show_rate_of_change: currentConfig.show_rate_of_change === true,
      show_threshold_analysis: currentConfig.show_threshold_analysis === true,
      show_threshold_shading: currentConfig.show_threshold_shading === true,
      show_anomalies: currentConfig.show_anomalies === true,
      hide_raw_data: currentConfig.hide_raw_data === true,
      show_trend_crosshairs: currentConfig.show_trend_crosshairs === true,
      trend_method: currentConfig.trend_method || "rolling_average",
      trend_window: currentConfig.trend_window || "24h",
      rate_window: currentConfig.rate_window || "1h",
      anomaly_sensitivity: currentConfig.anomaly_sensitivity || "medium",
      threshold_values: currentConfig.threshold_values || {},
      threshold_directions: currentConfig.threshold_directions || {},
      show_delta_analysis: currentConfig.show_delta_analysis === true,
      show_delta_tooltip: currentConfig.show_delta_tooltip !== false,
      show_delta_lines: currentConfig.show_delta_lines === true,
      hide_delta_source_series: currentConfig.hide_delta_source_series === true,
      delink_y_axis: currentConfig.delink_y_axis === true,
      split_view: currentConfig.split_view === true,
      show_data_gaps: currentConfig.show_data_gaps !== false,
      data_gap_threshold: currentConfig.data_gap_threshold || "2h",
      comparison_hover_active: currentConfig.comparison_hover_active === true,
      selected_comparison_window_id: currentConfig.selected_comparison_window_id || null,
      hovered_comparison_window_id: currentConfig.hovered_comparison_window_id || null,
    });
    const nextViewKey = JSON.stringify({
      series_settings: nextConfig.series_settings || [],
      zoom_start_time: nextConfig.zoom_start_time,
      zoom_end_time: nextConfig.zoom_end_time,
      message_filter: nextConfig.message_filter || "",
      hidden_event_ids: nextConfig.hidden_event_ids || [],
      show_event_markers: nextConfig.show_event_markers !== false,
      show_event_lines: nextConfig.show_event_lines !== false,
      show_tooltips: nextConfig.show_tooltips !== false,
      emphasize_hover_guides: nextConfig.emphasize_hover_guides === true,
      show_trend_lines: nextConfig.show_trend_lines === true,
      show_summary_stats: nextConfig.show_summary_stats === true,
      show_rate_of_change: nextConfig.show_rate_of_change === true,
      show_threshold_analysis: nextConfig.show_threshold_analysis === true,
      show_threshold_shading: nextConfig.show_threshold_shading === true,
      show_anomalies: nextConfig.show_anomalies === true,
      hide_raw_data: nextConfig.hide_raw_data === true,
      show_trend_crosshairs: nextConfig.show_trend_crosshairs === true,
      trend_method: nextConfig.trend_method || "rolling_average",
      trend_window: nextConfig.trend_window || "24h",
      rate_window: nextConfig.rate_window || "1h",
      anomaly_sensitivity: nextConfig.anomaly_sensitivity || "medium",
      threshold_values: nextConfig.threshold_values || {},
      threshold_directions: nextConfig.threshold_directions || {},
      show_delta_analysis: nextConfig.show_delta_analysis === true,
      show_delta_tooltip: nextConfig.show_delta_tooltip !== false,
      show_delta_lines: nextConfig.show_delta_lines === true,
      hide_delta_source_series: nextConfig.hide_delta_source_series === true,
      delink_y_axis: nextConfig.delink_y_axis === true,
      split_view: nextConfig.split_view === true,
      show_data_gaps: nextConfig.show_data_gaps !== false,
      data_gap_threshold: nextConfig.data_gap_threshold || "2h",
      comparison_hover_active: nextConfig.comparison_hover_active === true,
      selected_comparison_window_id: nextConfig.selected_comparison_window_id || null,
      hovered_comparison_window_id: nextConfig.hovered_comparison_window_id || null,
    });
    const currentComparisonKey = JSON.stringify(currentConfig.comparison_windows || []);
    const nextComparisonKey = JSON.stringify(nextConfig.comparison_windows || []);
    const currentPreloadComparisonKey = JSON.stringify(currentConfig.preload_comparison_windows || []);
    const nextPreloadComparisonKey = JSON.stringify(nextConfig.preload_comparison_windows || []);
    const currentComparisonOverlayKey = JSON.stringify(currentConfig.comparison_preview_overlay || null);
    const nextComparisonOverlayKey = JSON.stringify(nextConfig.comparison_preview_overlay || null);
    const dataChanged = currentDataKey !== nextDataKey;
    const viewChanged = currentViewKey !== nextViewKey;
    const comparisonChanged = currentComparisonKey !== nextComparisonKey;
    const preloadComparisonChanged = currentPreloadComparisonKey !== nextPreloadComparisonKey;
    const comparisonOverlayChanged = currentComparisonOverlayKey !== nextComparisonOverlayKey;
    if (!dataChanged && !viewChanged && !comparisonChanged && !preloadComparisonChanged && !comparisonOverlayChanged && this._configKey) {
      return;
    }

    this._config = nextConfig;
    this._configKey = JSON.stringify(nextConfig);
    this._hiddenSeries = createHiddenSeriesSet(nextConfig.series_settings);
    this._hiddenEventIds = createHiddenEventIdSet(nextConfig.hidden_event_ids);
    this._zoomRange = createChartZoomRange(nextConfig.zoom_start_time, nextConfig.zoom_end_time);
    if (dataChanged || !Array.isArray(nextConfig.comparison_windows) || !nextConfig.comparison_windows.length) {
      this._adjustComparisonAxisScale = false;
    }
    if (this._rendered && this._hass && dataChanged) {
      this._load();
      return;
    }
    if (this._rendered && this._hass && comparisonChanged) {
      this._loadComparisonWindows({ redraw: true });
      return;
    }
    if (this._rendered && this._hass && preloadComparisonChanged) {
      this._preloadComparisonWindows().catch(() => {});
    }
    if (this._rendered && this._hass && comparisonOverlayChanged && this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._filterEvents(this._lastEvents), this._lastT0, this._lastT1);
      return;
    }
    if (this._rendered && this._hass && viewChanged && this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._filterEvents(this._lastEvents), this._lastT0, this._lastT1);
    }
  }

  _renderComparisonPreviewOverlay(renderer = null) {
    const overlayEl = this.shadowRoot?.getElementById("chart-preview-overlay");
    if (!overlayEl) {
      return;
    }
    const overlay = this._config?.comparison_preview_overlay || null;
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

  _getRange() {
    const end = this._config.end_time ? new Date(this._config.end_time) : new Date();
    const start = this._config.start_time
      ? new Date(this._config.start_time)
      : new Date(end.getTime() - this._config.hours_to_show * 3600 * 1000);
    return { start, end };
  }

  get _entityIds() {
    if (this._config.entities) {
      return this._config.entities.map((e) => typeof e === "string" ? e : e.entity || e.entity_id);
    }
    return [this._config.entity];
  }

  get _seriesSettings() {
    const configured = Array.isArray(this._config?.series_settings) ? this._config.series_settings : [];
    const byEntityId = new Map(
      configured
        .filter((entry) => entry?.entity_id)
        .map((entry, index) => [entry.entity_id, {
          entity_id: entry.entity_id,
          color: entry.color || COLORS[index % COLORS.length],
        }]),
    );
    return this._entityIds.map((entityId, index) => byEntityId.get(entityId) || {
      entity_id: entityId,
      color: COLORS[index % COLORS.length],
    });
  }

  get _statisticsEntityIds() {
    return this._entityIds.filter((entityId) => !String(entityId).startsWith("binary_sensor."));
  }

  get _comparisonWindows() {
    return Array.isArray(this._config?.comparison_windows)
      ? this._config.comparison_windows.filter((w) => w?.time_offset_ms != null)
      : [];
  }

  get _preloadComparisonWindowsConfig() {
    return Array.isArray(this._config?.preload_comparison_windows)
      ? this._config.preload_comparison_windows.filter((w) => w?.time_offset_ms != null)
      : [];
  }

  _getComparisonCacheKey(win, start, end) {
    return JSON.stringify({
      id: win?.id || "",
      start: start?.toISOString?.() || "",
      end: end?.toISOString?.() || "",
      entities: this._entityIds,
      statistics_entities: this._statisticsEntityIds,
    });
  }

  async _loadComparisonWindowData(win, start, end) {
    const cacheKey = this._getComparisonCacheKey(win, start, end);
    const cached = this._comparisonDataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const historyPromise = fetchHistoryDuringPeriod(
      this._hass,
      start.toISOString(),
      end.toISOString(),
      this._entityIds,
      { include_start_time_state: true, significant_changes_only: false, no_attributes: true },
    ).catch(() => ({}));
    const statisticsPromise = this._statisticsEntityIds.length
      ? fetchStatisticsDuringPeriod(
        this._hass,
        start.toISOString(),
        end.toISOString(),
        this._statisticsEntityIds,
        {
          period: "hour",
          types: ["mean"],
          units: {},
        },
      ).catch(() => ({}))
      : Promise.resolve({});
    const [histResult, statsResult] = await Promise.all([historyPromise, statisticsPromise]);
    const result = {
      ...win,
      histResult: histResult || {},
      statsResult: statsResult || {},
    };
    this._comparisonDataCache.set(cacheKey, result);
    return result;
  }

  _preloadComparisonWindows() {
    const { start, end } = this._getRange();
    const comparisonWindows = this._preloadComparisonWindowsConfig;
    if (!comparisonWindows.length) {
      return Promise.resolve([]);
    }
    return Promise.all(comparisonWindows.map(async (win) => {
      const winStart = new Date(start.getTime() + win.time_offset_ms);
      const winEnd = new Date(end.getTime() + win.time_offset_ms);
      const result = await this._loadComparisonWindowData(win, winStart, winEnd);
      return { id: result.id, histResult: result.histResult, statsResult: result.statsResult };
    })).then((results) => {
      return results;
    }).catch((error) => {
      console.warn("[hass-datapoints history-card] comparison preload:failed", {
        message: error?.message || String(error),
      });
      return [];
    });
  }

  _loadComparisonWindows({ redraw = false, requestId = null } = {}) {
    const { start, end } = this._getRange();
    const comparisonWindows = this._comparisonWindows;
    const targetRequestId = requestId ?? this._loadRequestId;
    const comparisonRequestId = ++this._comparisonRequestId;
    if (!comparisonWindows.length) {
      this._lastComparisonResults = [];
      this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
        bubbles: true,
        composed: true,
        detail: { ids: [], loading: false },
      }));
      if (redraw && this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(
          this._lastHistResult,
          this._lastStatsResult || {},
          this._filterEvents(this._lastEvents),
          this._lastT0,
          this._lastT1,
        );
      }
      return Promise.resolve([]);
    }

    const cachedResults = [];
    const windowsToFetch = [];
    for (const win of comparisonWindows) {
      const winStart = new Date(start.getTime() + win.time_offset_ms);
      const winEnd = new Date(end.getTime() + win.time_offset_ms);
      const cacheKey = this._getComparisonCacheKey(win, winStart, winEnd);
      const cached = this._comparisonDataCache.get(cacheKey);
      if (cached) {
        cachedResults.push(cached);
      } else {
        windowsToFetch.push({ win, winStart, winEnd });
      }
    }

    if (!windowsToFetch.length) {
      this._lastComparisonResults = cachedResults;
      if (redraw && this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(
          this._lastHistResult,
          this._lastStatsResult || {},
          this._filterEvents(this._lastEvents),
          this._lastT0,
          this._lastT1,
        );
      }
      return Promise.resolve(cachedResults);
    }

    this._lastComparisonResults = cachedResults.length ? cachedResults : null;
    this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
      bubbles: true,
      composed: true,
      detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: true },
    }));
    return Promise.all(windowsToFetch.map(async ({ win, winStart, winEnd }) => {
      return this._loadComparisonWindowData(win, winStart, winEnd);
    })).then((results) => {
      if (comparisonRequestId !== this._comparisonRequestId) {
        return this._lastComparisonResults || [];
      }
      if (targetRequestId != null && targetRequestId !== this._loadRequestId) {
        return this._lastComparisonResults || [];
      }
      this._lastComparisonResults = [...cachedResults, ...results];
      this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
        bubbles: true,
        composed: true,
        detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: false },
      }));
      if (redraw && this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(
          this._lastHistResult,
          this._lastStatsResult || {},
          this._filterEvents(this._lastEvents),
          this._lastT0,
          this._lastT1,
        );
      }
      return results;
    }).catch(() => {
      if (comparisonRequestId === this._comparisonRequestId) {
        this._lastComparisonResults = [];
        console.warn("[hass-datapoints history-card] comparison load:failed", {
          comparisonRequestId,
          ids: comparisonWindows.map((win) => win.id).filter(Boolean),
        });
        this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
          bubbles: true,
          composed: true,
          detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: false },
        }));
        if (redraw && this._lastHistResult && this._lastEvents) {
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(this._lastEvents),
            this._lastT0,
            this._lastT1,
          );
        }
      }
      return [];
    });
  }

  async _load() {
    const { start, end } = this._getRange();
    const t0 = start.getTime();
    const t1 = end.getTime();
    const requestId = ++this._loadRequestId;
    console.log("[hass-datapoints history-card] load triggered", {
      requestId,
      entityIds: this._entityIds,
      start: start.toISOString(),
      end: end.toISOString(),
    });
    this._setChartLoading(true);
    this._setChartMessage("");
    this._drawEmptyChartFrame(t0, t1);

    const partial = {
      histResult: null,
      statsResult: this._statisticsEntityIds.length ? null : {},
      events: null,
      histDone: false,
      statsDone: !this._statisticsEntityIds.length,
      eventsDone: false,
      histFailed: false,
      statsFailed: false,
      eventsFailed: false,
      hasDrawnDrawable: false,
      lastDrawState: null,
      lastDrawQuality: null,
    };

    const maybeDraw = () => {
      if (requestId !== this._loadRequestId) {
        return;
      }
      const hasDrawableData = this._hasDrawableHistoryData(partial.histResult || {}, partial.statsResult || {});
      const numericRequestsFinished = partial.histDone && partial.statsDone;
      if (!hasDrawableData && !numericRequestsFinished) {
        return;
      }
      if (partial.hasDrawnDrawable) {
        const drawQuality = hasDrawableData
          ? this._getDrawableHistoryQuality(partial.histResult || {}, partial.statsResult || {})
          : null;
        const redrawForHistory = hasDrawableData && !partial.lastDrawState?.histDone && partial.histDone;
        const redrawForEvents = hasDrawableData && !partial.lastDrawState?.eventsDone && partial.eventsDone;
        const shouldRedraw =
          redrawForHistory || redrawForEvents;
        const wouldDowngradeDraw =
          !!drawQuality
          && !!partial.lastDrawQuality
          && drawQuality.totalPoints < partial.lastDrawQuality.totalPoints;
        if (!shouldRedraw) {
          if (partial.histDone && partial.statsDone && partial.eventsDone) {
            this._setChartLoading(false);
          }
          return;
        }
        if (wouldDowngradeDraw) {
          if (partial.histDone && partial.statsDone && partial.eventsDone) {
            this._setChartLoading(false);
          }
          return;
        }
        if (
          redrawForEvents
          && !redrawForHistory
          && this._lastHistResult
          && Number.isFinite(this._lastT0)
          && Number.isFinite(this._lastT1)
        ) {
          partial.lastDrawState = {
            histDone: partial.histDone,
            statsDone: partial.statsDone,
            eventsDone: partial.eventsDone,
          };
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(partial.events || []),
            this._lastT0,
            this._lastT1,
            { loading: !(partial.histDone && partial.statsDone && partial.eventsDone) },
          );
          return;
        }
      }
      if (hasDrawableData) {
        const drawQuality = this._getDrawableHistoryQuality(partial.histResult || {}, partial.statsResult || {});
        partial.hasDrawnDrawable = true;
        partial.lastDrawState = {
          histDone: partial.histDone,
          statsDone: partial.statsDone,
          eventsDone: partial.eventsDone,
        };
        partial.lastDrawQuality = drawQuality;
      }
      this._queueDrawChart(
        partial.histResult || {},
        partial.statsResult || {},
        this._filterEvents(partial.events || []),
        t0,
        t1,
        { loading: !(partial.histDone && partial.statsDone && partial.eventsDone) },
      );
    };

    const finalize = () => {
      if (requestId !== this._loadRequestId) {
        return;
      }
      if (!(partial.histDone && partial.statsDone && partial.eventsDone)) {
        return;
      }
      if ((partial.histFailed && partial.statsFailed) || (partial.histResult == null && partial.statsResult == null)) {
        this._setChartMessage("Failed to load data.");
        this._setChartLoading(false);
        return;
      }
      if (partial.hasDrawnDrawable) {
        this._setChartLoading(false);
      }
      this._preloadComparisonWindows().catch(() => {});
    };

    // Fetch comparison window history in parallel (fire-and-forget; redraws when done)
    this._loadComparisonWindows({ redraw: true, requestId }).catch(() => {});

    try {
      fetchHistoryDuringPeriod(
        this._hass,
        start.toISOString(),
        end.toISOString(),
        this._entityIds,
        {
          include_start_time_state: true,
          significant_changes_only: false,
          no_attributes: true,
        },
      ).then((histResult) => {
        partial.histResult = histResult || {};
        partial.histDone = true;
        maybeDraw();
        finalize();
      }).catch((err) => {
        partial.histDone = true;
        partial.histFailed = true;
        console.error("[hass-datapoints history-card] history load failed", err);
        maybeDraw();
        finalize();
      });

      if (this._statisticsEntityIds.length) {
        fetchStatisticsDuringPeriod(
          this._hass,
          start.toISOString(),
          end.toISOString(),
          this._statisticsEntityIds,
          {
            period: "hour",
            types: ["mean"],
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
          console.error("[hass-datapoints history-card] statistics load failed", err);
          maybeDraw();
          finalize();
        });
      }

      if (this._config.datapoint_scope === "hidden") {
        partial.events = [];
        partial.eventsDone = true;
        maybeDraw();
        finalize();
      } else {
        fetchEvents(
          this._hass,
          start.toISOString(),
          end.toISOString(),
          this._config.datapoint_scope === "all" ? undefined : this._entityIds,
        ).then((events) => {
          partial.events = events || [];
          partial.eventsDone = true;
          maybeDraw();
          finalize();
        }).catch((err) => {
          partial.eventsDone = true;
          partial.eventsFailed = true;
          console.error("[hass-datapoints history-card] event load failed", err);
          maybeDraw();
          finalize();
        });
      }
    } catch (err) {
      this._setChartMessage("Failed to load data.");
      this._setChartLoading(false);
      console.error("[hass-datapoints history-card]", err);
    }
  }

  _drawEmptyChartFrame(t0, t1) {
    const canvas = this.shadowRoot.getElementById("chart");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    const scrollViewport = this.shadowRoot.getElementById("chart-scroll-viewport");
    const chartStage = this.shadowRoot.getElementById("chart-stage");
    if (!canvas || !wrap) {
      return;
    }
    const availableHeight = this._getAvailableChartHeight(280);
    const viewportWidth = Math.max(scrollViewport?.clientWidth || wrap?.clientWidth || 360, 360);
    if (chartStage) {
      chartStage.style.width = `${viewportWidth}px`;
      chartStage.style.height = `${availableHeight}px`;
    }
    const { w, h } = setupCanvas(canvas, chartStage || wrap, availableHeight, viewportWidth);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    renderer.drawGrid(t0, t1, [{ key: "placeholder", min: 0, max: 1, side: "left", unit: "", color: null }], undefined, 5, { fixedAxisOverlay: true });
    renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
  }

  _filterEvents(events) {
    const query = String(this._config?.message_filter || "").trim().toLowerCase();
    const visibleEvents = events.filter((event) => !this._hiddenEventIds.has(event?.id));
    if (!query) {
      return visibleEvents;
    }
    return visibleEvents.filter((event) => {
      const haystack = [
        event?.message || "",
        event?.annotation || "",
        ...((event?.entity_ids || []).filter(Boolean)),
      ].join("\n").toLowerCase();
      return haystack.includes(query);
    });
  }

  _drawSplitChart({ visibleSeries, binaryBackgrounds, events, renderT0, renderT1, canvasWidth, availableHeight, chartStage, canvas, wrap, options, comparisonResults, selectedComparisonWindowId, hoveredComparisonWindowId, comparisonPreviewActive, hoveringDifferentComparison, analysisResult, analysisMap, hasSelectedComparisonWindow }) {
    // Hide the shared canvas; split rows use their own canvases.
    if (canvas) {
      canvas.style.display = "none";
    }

    const N = visibleSeries.length;
    const MIN_ROW_HEIGHT = 140;
    const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor(availableHeight / N));
    const totalHeight = rowHeight * N;

    if (chartStage) {
      chartStage.style.width = `${canvasWidth}px`;
      chartStage.style.height = `${totalHeight}px`;
    }

    this._setChartLoading(!!options.loading);
    this._setChartMessage("");

    // Clear the shared icon overlay once before iterating rows.
    const iconOverlay = this.shadowRoot?.getElementById("chart-icon-overlay");
    if (iconOverlay) {
      iconOverlay.innerHTML = "";
    }

    // Build analysis lookup maps keyed by entityId.
    const trendPointsMap = new Map((analysisResult?.trendSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const ratePointsMap = new Map((analysisResult?.rateSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const deltaPointsMap = new Map((analysisResult?.deltaSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const summaryStatsMap = new Map((analysisResult?.summaryStats || []).map((entry) => [entry.entityId, entry]));
    const anomalyClustersMap = new Map((analysisResult?.anomalySeries || []).map((entry) => [entry.entityId, entry.anomalyClusters]));
    const effectiveAnalysisMap = analysisMap || new Map();

    const correlatedAnomalySpans = this._config?.show_correlated_anomalies === true
      ? this._buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, effectiveAnalysisMap)
      : [];

    const tracks = [];
    for (let i = 0; i < N; i += 1) {
      const isLastRow = i === N - 1;
      const seriesItem = visibleSeries[i];
      const rowOffset = i * rowHeight;

      const rowDiv = document.createElement("div");
      rowDiv.className = "split-series-row";
      rowDiv.style.cssText = `position:absolute;left:0;top:${rowOffset}px;width:${canvasWidth}px;height:${rowHeight}px;pointer-events:none;overflow:hidden;`;

      const rowCanvas = document.createElement("canvas");
      rowCanvas.className = "split-series-canvas";
      rowDiv.appendChild(rowCanvas);
      chartStage?.appendChild(rowDiv);

      const { w, h } = setupCanvas(rowCanvas, chartStage || wrap, rowHeight, canvasWidth);
      const renderer = new ChartRenderer(rowCanvas, w, h);
      renderer.labelColor = resolveChartLabelColor(this);
      // Shrink bottom padding on intermediate rows — time labels only appear on the last row.
      renderer.basePad = { top: 24, right: 12, bottom: isLastRow ? 48 : 10, left: 12 };
      renderer.clear();

      // ── Per-row analysis data ──────────────────────────────────────────────
      const rowAnalysis = effectiveAnalysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      const rowTrendPts = rowAnalysis.show_trend_lines === true ? (trendPointsMap.get(seriesItem.entityId) || []) : [];
      const rowRatePts = rowAnalysis.show_rate_of_change === true ? (ratePointsMap.get(seriesItem.entityId) || []) : [];
      const rowDeltaPts = (rowAnalysis.show_delta_analysis === true && hasSelectedComparisonWindow) ? (deltaPointsMap.get(seriesItem.entityId) || []) : [];
      const rowSummaryStats = rowAnalysis.show_summary_stats === true ? (summaryStatsMap.get(seriesItem.entityId) || null) : null;
      const rowAnomalyClusters = rowAnalysis.show_anomalies === true ? (anomalyClustersMap.get(seriesItem.entityId) || []) : [];
      const rowHideSource = this._seriesShouldHideSource(rowAnalysis, hasSelectedComparisonWindow);

      const axisValues = seriesItem.pts.map(([, v]) => v);
      const extent = this._getAxisValueExtent(axisValues);
      let axisMin = 0;
      let axisMax = 1;
      if (extent) {
        const pad = (extent.max - extent.min) * 0.1 || 1;
        axisMin = extent.min - pad;
        axisMax = extent.max + pad;
      }
      const primaryAxisKey = seriesItem.axisKey || seriesItem.unit || "__unitless__";
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
      const rowAxes = [axis];
      let rowRateAxisKey = null;
      if (rowRatePts.length >= 2) {
        const rateVals = rowRatePts.map(([, v]) => v);
        const rateExt = this._getAxisValueExtent(rateVals);
        if (rateExt) {
          const pad = (rateExt.max - rateExt.min) * 0.1 || 1;
          rowRateAxisKey = `rate:${primaryAxisKey}`;
          rowAxes.push({
            key: rowRateAxisKey,
            unit: seriesItem.unit ? `${seriesItem.unit}/h` : "Rate/h",
            color: seriesItem.color,
            side: "right",
            min: rateExt.min - pad,
            max: rateExt.max + pad,
            values: rateVals,
          });
        }
      }
      let rowDeltaAxisKey = null;
      if (rowDeltaPts.length >= 2) {
        const deltaVals = rowDeltaPts.map(([, v]) => v);
        const deltaExt = this._getAxisValueExtent(deltaVals);
        if (deltaExt) {
          const pad = (deltaExt.max - deltaExt.min) * 0.1 || 1;
          rowDeltaAxisKey = `delta:${primaryAxisKey}`;
          rowAxes.push({
            key: rowDeltaAxisKey,
            unit: seriesItem.unit ? `Δ ${seriesItem.unit}` : "Δ",
            color: seriesItem.color,
            side: "right",
            min: deltaExt.min - pad,
            max: deltaExt.max + pad,
            values: deltaVals,
          });
        }
      }

      renderer.drawGrid(renderT0, renderT1, rowAxes, undefined, 4, { fixedAxisOverlay: true, hideTimeLabels: !isLastRow });

      // Retrieve the scaled axes back from the renderer after grid normalisation.
      const resolvedAxis = renderer._activeAxes?.[0] || axis;
      const resolvedRateAxis = rowRateAxisKey ? (renderer._activeAxes?.find((a) => a.key === rowRateAxisKey) || null) : null;
      const resolvedDeltaAxis = rowDeltaAxisKey ? (renderer._activeAxes?.find((a) => a.key === rowDeltaAxisKey) || null) : null;
      seriesItem.axis = resolvedAxis;

      // Dim the main series when a comparison preview is active, matching the
      // behaviour of the regular (non-split) chart.
      const mainSeriesOpacity = comparisonPreviewActive ? (hoveringDifferentComparison ? 0.15 : 0.25) : 1;

      if (!rowHideSource) {
        this._drawSeriesLine(
          renderer,
          seriesItem.pts,
          seriesItem.color,
          renderT0,
          renderT1,
          resolvedAxis.min,
          resolvedAxis.max,
          {
            lineWidth: comparisonPreviewActive ? 1.25 : 1.75,
            lineOpacity: mainSeriesOpacity,
          },
        );
      }

      // Draw comparison window series for this row's entity.
      for (const win of (comparisonResults || [])) {
        const stateList = this._buildEntityStateList(seriesItem.entityId, win.histResult, win.statsResult || {});
        const winPts = [];
        for (const s of stateList) {
          const v = parseFloat(s.s);
          if (!isNaN(v)) {
            winPts.push([Math.round(s.lu * 1000) - win.time_offset_ms, v]);
          }
        }
        if (!winPts.length) {
          continue;
        }
        const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
        const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
        const compLineOpacity = isHovered
          ? 0.85
          : (hoveringDifferentComparison && isSelected ? 0.25 : 0.85);
        renderer.drawLine(winPts, seriesItem.color, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, {
          lineOpacity: compLineOpacity,
          lineWidth: hoveringDifferentComparison && isSelected ? 1.25 : undefined,
        });
      }

      // Draw binary state backgrounds on every row.
      binaryBackgrounds.forEach((bg) => {
        if (!this._hiddenSeries.has(bg.entityId) && bg.spans?.length) {
          renderer.drawStateBands(bg.spans, renderT0, renderT1, bg.color, 0.10);
        }
      });
      if (correlatedAnomalySpans.length) {
        renderer.drawStateBands(correlatedAnomalySpans, renderT0, renderT1, "#ef4444", 0.10);
      }

      // Draw annotation event lines and diamond markers on this row's canvas.
      renderer.drawAnnotations(events || [], renderT0, renderT1, {
        showLines: this._config.show_event_lines !== false,
        showMarkers: this._config.show_event_lines !== false,
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
        },
      );

      // ── Analysis overlays ─────────────────────────────────────────────────
      // Threshold shading and horizontal line.
      if (rowAnalysis.show_threshold_analysis === true) {
        const thresholdValue = Number(rowAnalysis.threshold_value);
        if (Number.isFinite(thresholdValue)) {
          if (rowAnalysis.show_threshold_shading === true && seriesItem.pts.length) {
            renderer.drawThresholdArea(
              seriesItem.pts,
              thresholdValue,
              seriesItem.color,
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              {
                mode: rowAnalysis.threshold_direction === "below" ? "below" : "above",
                fillAlpha: rowHideSource ? 0.24 : 0.14,
              },
            );
          }
          renderer.drawLine(
            [[renderT0, thresholdValue], [renderT1, thresholdValue]],
            hexToRgba(seriesItem.color, rowHideSource ? 0.82 : 0.46),
            renderT0,
            renderT1,
            resolvedAxis.min,
            resolvedAxis.max,
            { lineOpacity: rowHideSource ? 0.84 : 0.48, lineWidth: 1.15 },
          );
        }
      }

      // Summary stat lines (min / mean / max).
      if (rowSummaryStats) {
        const summaryEntries = [
          { type: "min",  value: rowSummaryStats.min,  alpha: rowHideSource ? 0.78 : 0.42, width: 1.1,  dotted: true },
          { type: "mean", value: rowSummaryStats.mean, alpha: rowHideSource ? 0.94 : 0.78, width: 1.8,  dotted: false },
          { type: "max",  value: rowSummaryStats.max,  alpha: rowHideSource ? 0.78 : 0.42, width: 1.1,  dotted: true },
        ];
        for (const entry of summaryEntries) {
          if (!Number.isFinite(entry.value)) continue;
          renderer.drawLine(
            [[renderT0, entry.value], [renderT1, entry.value]],
            hexToRgba(seriesItem.color, entry.alpha),
            renderT0,
            renderT1,
            resolvedAxis.min,
            resolvedAxis.max,
            { lineOpacity: rowHideSource ? 0.82 : 0.34, lineWidth: entry.width, dotted: entry.dotted },
          );
        }
      }

      // Trend line.
      if (rowTrendPts.length >= 2) {
        const trendOpts = this._getTrendRenderOptions(rowAnalysis.trend_method, rowHideSource);
        renderer.drawLine(
          rowTrendPts,
          hexToRgba(seriesItem.color, trendOpts.colorAlpha),
          renderT0,
          renderT1,
          resolvedAxis.min,
          resolvedAxis.max,
          { lineOpacity: trendOpts.lineOpacity, lineWidth: trendOpts.lineWidth, dashed: trendOpts.dashed, dotted: trendOpts.dotted },
        );
      }

      // Rate-of-change line (secondary right axis).
      if (rowRatePts.length >= 2 && resolvedRateAxis) {
        renderer.drawLine(
          rowRatePts,
          hexToRgba(seriesItem.color, rowHideSource ? 0.96 : 0.82),
          renderT0,
          renderT1,
          resolvedRateAxis.min,
          resolvedRateAxis.max,
          { lineOpacity: rowHideSource ? 0.88 : 0.66, lineWidth: 1.55, dashPattern: [7, 3, 1.5, 3] },
        );
      }

      // Delta line (secondary right axis, comparison mode only).
      if (rowDeltaPts.length >= 2 && resolvedDeltaAxis && rowAnalysis.show_delta_lines === true) {
        renderer.drawLine(
          rowDeltaPts,
          hexToRgba(seriesItem.color, 0.92),
          renderT0,
          renderT1,
          resolvedDeltaAxis.min,
          resolvedDeltaAxis.max,
          { lineOpacity: 0.82, lineWidth: 1.9, dashed: true },
        );
      }

      // Anomaly clusters.
      let rowAnomalyRegions = [];
      if (rowAnomalyClusters.length) {
        const filteredClusters = this._filterAnnotatedAnomalyClusters({ entityId: seriesItem.entityId, anomalyClusters: rowAnomalyClusters }, events || []);
        if (filteredClusters.length > 0) {
          const normalClusters = filteredClusters.filter((c) => !c.isOverlap);
          const overlapClusters = filteredClusters.filter((c) => c.isOverlap === true);
          const baseColor = hexToRgba(seriesItem.color, rowHideSource ? 0.96 : 0.86);
          const regionOpts = {
            strokeAlpha: rowHideSource ? 0.98 : 0.9, lineWidth: rowHideSource ? 2.5 : 2.1,
            haloWidth: rowHideSource ? 5.5 : 4.8, haloColor: "rgba(255,255,255,0.88)", haloAlpha: rowHideSource ? 0.92 : 0.82,
            fillColor: hexToRgba(seriesItem.color, rowHideSource ? 0.14 : 0.1), fillAlpha: 1,
            pointPadding: rowHideSource ? 12 : 10, minRadiusX: 10, minRadiusY: 10,
          };
          const overlapOpts = {
            strokeAlpha: 0.98, lineWidth: 2.8, haloWidth: 7,
            haloColor: "rgba(232,160,32,0.22)", haloAlpha: 1,
            fillColor: "rgba(232,160,32,0.1)", fillAlpha: 1,
            pointPadding: rowHideSource ? 15 : 13, minRadiusX: 12, minRadiusY: 12,
          };
          if (normalClusters.length > 0) {
            renderer.drawAnomalyClusters(normalClusters, baseColor, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, regionOpts);
          }
          if (overlapClusters.length > 0) {
            renderer.drawAnomalyClusters(overlapClusters, baseColor, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, regionOpts);
            if (rowAnalysis.anomaly_overlap_mode !== "only") {
              renderer.drawAnomalyClusters(overlapClusters, "rgba(232,160,32,0.94)", renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, overlapOpts);
            }
          }
          rowAnomalyRegions = renderer.getAnomalyClusterRegions(
            [...normalClusters, ...overlapClusters], renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, regionOpts,
          ).map((region) => ({
            ...region,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            sensitivity: rowAnalysis.anomaly_sensitivity,
          }));
        }
      }

      tracks.push({
        canvas: rowCanvas, renderer, series: seriesItem, axis: resolvedAxis, rowOffset,
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
    this._renderComparisonPreviewOverlay(tracks[0]?.renderer ?? null);

    // Build comparison hover series for the tooltip, keyed to each track so the
    // tooltip can show interpolated values for the active date window.
    const comparisonHoverSeries = [];
    for (const track of tracks) {
      for (const win of (comparisonResults || [])) {
        const stateList = this._buildEntityStateList(track.series.entityId, win.histResult, win.statsResult || {});
        const winPts = [];
        for (const s of stateList) {
          const v = parseFloat(s.s);
          if (!isNaN(v)) {
            winPts.push([Math.round(s.lu * 1000) - win.time_offset_ms, v]);
          }
        }
        if (!winPts.length) {
          continue;
        }
        const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
        const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
        const hoverOpacity = isHovered ? 0.85 : (hoveringDifferentComparison && isSelected ? 0.25 : 0.85);
        comparisonHoverSeries.push({
          entityId: `${win.id}:${track.series.entityId}`,
          relatedEntityId: track.series.entityId,
          label: track.series.label,
          windowLabel: win.label || "Date window",
          unit: track.series.unit,
          pts: winPts,
          color: track.series.color,
          hoverOpacity,
          track,
        });
      }
    }

    this._attachSplitHover(tracks, comparisonHoverSeries, events, renderT0, renderT1, chartStage, options, effectiveAnalysisMap, hasSelectedComparisonWindow);
  }

  _attachSplitHover(tracks, comparisonHoverSeries, events, t0, t1, chartStage, options, analysisMap, hasSelectedComparisonWindow) {
    if (this._chartHoverCleanup) {
      this._chartHoverCleanup();
      this._chartHoverCleanup = null;
    }
    if (!tracks.length || !chartStage) {
      return;
    }

    const primaryRenderer = tracks[0].renderer;
    const lastTrack = tracks[tracks.length - 1];
    const eventThresholdMs = primaryRenderer.cw ? 14 * ((t1 - t0) / primaryRenderer.cw) : 0;

    // Vertical span of the plot area across all rows — used for the zoom selection highlight.
    const splitSelTop = tracks[0].rowOffset + primaryRenderer.pad.top;
    const splitSelBottom = lastTrack.rowOffset + lastTrack.renderer.pad.top + lastTrack.renderer.ch;
    const splitSelHeight = splitSelBottom - splitSelTop;

    // Shared transparent overlay spanning all rows.
    const overlayEl = document.createElement("div");
    overlayEl.id = "chart-split-overlay";
    overlayEl.style.cssText = "position:absolute;inset:0;pointer-events:auto;z-index:2;cursor:crosshair;";
    chartStage.appendChild(overlayEl);

    // ── Coordinate helpers ─────────────────────────────────────────────────────
    // Both the overlay and the selection div are absolute within chart-stage, so
    // (clientX - overlayRect.left) gives stage-relative X directly.
    const overlayRelX = (clientX) => {
      const rect = overlayEl.getBoundingClientRect();
      return clampChartValue(
        clientX - rect.left,
        primaryRenderer.pad.left,
        primaryRenderer.pad.left + primaryRenderer.cw,
      );
    };

    const stageXToTime = (stageX) => {
      const ratio = primaryRenderer.cw
        ? (stageX - primaryRenderer.pad.left) / primaryRenderer.cw
        : 0;
      return t0 + ratio * (t1 - t0);
    };

    const inPlotBoundsX = (clientX) => {
      const rect = overlayEl.getBoundingClientRect();
      const localX = clientX - rect.left;
      return localX >= primaryRenderer.pad.left
        && localX <= primaryRenderer.pad.left + primaryRenderer.cw;
    };

    // ── Hover ──────────────────────────────────────────────────────────────────
    const buildSplitHover = (clientX) => {
      const baseRect = tracks[0].canvas.getBoundingClientRect();
      if (!baseRect.width || !primaryRenderer.cw) {
        return null;
      }
      const localX = clampChartValue(clientX - baseRect.left, primaryRenderer.pad.left, primaryRenderer.pad.left + primaryRenderer.cw);
      const ratio = (localX - primaryRenderer.pad.left) / primaryRenderer.cw;
      const timeMs = t0 + ratio * (t1 - t0);
      const x = primaryRenderer.xOf(timeMs, t0, t1);

      const values = tracks.map(({ renderer, series, axis, rowOffset }) => {
        const value = renderer._interpolateValue(series.pts, timeMs);
        if (value == null) {
          return { entityId: series.entityId, label: series.label, value: null, unit: series.unit, color: series.color, opacity: 1, hasValue: false, axisSide: "left", axisSlot: 0 };
        }
        return {
          entityId: series.entityId,
          label: series.label,
          value,
          unit: series.unit,
          color: series.color,
          opacity: 1,
          hasValue: true,
          x,
          y: rowOffset + renderer.yOf(value, axis.min, axis.max),
          axisSide: "left",
          axisSlot: 0,
        };
      });

      const hoveredEvents = [];
      for (const event of events || []) {
        const eventTime = new Date(event.timestamp).getTime();
        if (eventTime < t0 || eventTime > t1) {
          continue;
        }
        const distance = Math.abs(eventTime - timeMs);
        if (distance <= eventThresholdMs) {
          hoveredEvents.push({ ...event, _hoverDistanceMs: distance });
        }
      }
      hoveredEvents.sort((a, b) => (a._hoverDistanceMs || 0) - (b._hoverDistanceMs || 0));

      const comparisonValues = (comparisonHoverSeries || []).map(({ pts, entityId, label, unit, color, hoverOpacity, track: cTrack }) => {
        const value = cTrack.renderer._interpolateValue(pts, timeMs);
        if (value == null) {
          return { entityId, label, value: null, unit, color, opacity: hoverOpacity, hasValue: false, axisSide: "left", axisSlot: 0 };
        }
        return {
          entityId,
          label,
          value,
          unit,
          color,
          opacity: hoverOpacity,
          hasValue: true,
          x,
          y: cTrack.rowOffset + cTrack.renderer.yOf(value, cTrack.axis.min, cTrack.axis.max),
          axisSide: "left",
          axisSlot: 0,
        };
      });

      // ── Analysis hover values ────────────────────────────────────────────
      const trendValues = [];
      const rateValues = [];
      const deltaValues = [];
      const summaryValues = [];
      const thresholdValues = [];
      const anomalyRegions = [];
      let showTrendCrosshairs = false;

      for (const track of tracks) {
        const { renderer: trackRenderer, series: trackSeries, axis: trackAxis, rowOffset: trackRowOffset,
          analysis: trackAnalysis, summaryStats: trackSummaryStats,
          trendPts: trackTrendPts, ratePts: trackRatePts, rateAxis: trackRateAxis,
          deltaPts: trackDeltaPts, deltaAxis: trackDeltaAxis, anomalyRegions: trackAnomalyRegions } = track;

        const effectiveAnalysis = trackAnalysis || (analysisMap || new Map()).get(trackSeries.entityId) || normalizeHistorySeriesAnalysis(null);
        const trackHideSource = this._seriesShouldHideSource(effectiveAnalysis, hasSelectedComparisonWindow);

        // Trend values.
        if (effectiveAnalysis.show_trend_lines === true && Array.isArray(trackTrendPts) && trackTrendPts.length >= 2) {
          if (effectiveAnalysis.show_trend_crosshairs === true) showTrendCrosshairs = true;
          const trendOpts = this._getTrendRenderOptions(effectiveAnalysis.trend_method, trackHideSource);
          const trendVal = trackRenderer._interpolateValue(trackTrendPts, timeMs);
          trendValues.push({
            entityId: `trend:${trackSeries.entityId}`,
            relatedEntityId: trackSeries.entityId,
            label: trackSeries.label,
            baseLabel: trackSeries.label,
            unit: trackSeries.unit || "",
            color: hexToRgba(trackSeries.color, trendOpts.colorAlpha),
            opacity: trendOpts.lineOpacity,
            hasValue: trendVal != null,
            value: trendVal ?? null,
            ...(trendVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(trendVal, trackAxis.min, trackAxis.max) } : {}),
            axisSide: "left", axisSlot: 0, trend: true, rawVisible: !trackHideSource,
            showCrosshair: effectiveAnalysis.show_trend_crosshairs === true,
          });
        }

        // Rate-of-change values.
        if (effectiveAnalysis.show_rate_of_change === true && Array.isArray(trackRatePts) && trackRatePts.length >= 2 && trackRateAxis) {
          const rateVal = trackRenderer._interpolateValue(trackRatePts, timeMs);
          rateValues.push({
            entityId: `rate:${trackSeries.entityId}`,
            relatedEntityId: trackSeries.entityId,
            label: trackSeries.label,
            baseLabel: trackSeries.label,
            unit: trackSeries.unit ? `${trackSeries.unit}/h` : "/h",
            color: hexToRgba(trackSeries.color, trackHideSource ? 0.96 : 0.82),
            opacity: trackHideSource ? 0.88 : 0.66,
            hasValue: rateVal != null,
            value: rateVal ?? null,
            ...(rateVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(rateVal, trackRateAxis.min, trackRateAxis.max) } : {}),
            axisSide: "right", axisSlot: 0, rate: true, rawVisible: !trackHideSource,
          });
        }

        // Delta values.
        if (effectiveAnalysis.show_delta_analysis === true && effectiveAnalysis.show_delta_tooltip === true
            && Array.isArray(trackDeltaPts) && trackDeltaPts.length >= 2 && trackDeltaAxis) {
          const deltaVal = trackRenderer._interpolateValue(trackDeltaPts, timeMs);
          deltaValues.push({
            entityId: `delta:${trackSeries.entityId}`,
            relatedEntityId: trackSeries.entityId,
            label: trackSeries.label,
            baseLabel: trackSeries.label,
            unit: trackSeries.unit || "",
            color: hexToRgba(trackSeries.color, 0.92),
            opacity: 0.82,
            hasValue: deltaVal != null,
            value: deltaVal ?? null,
            ...(deltaVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(deltaVal, trackDeltaAxis.min, trackDeltaAxis.max) } : {}),
            axisSide: "right", axisSlot: 0, delta: true, rawVisible: !trackHideSource,
          });
        }

        // Summary stat values (constant horizontal lines).
        if (effectiveAnalysis.show_summary_stats === true && trackSummaryStats) {
          const summaryEntries = [
            { type: "min",  value: trackSummaryStats.min,  alphaV: trackHideSource ? 0.78 : 0.42, opac: trackHideSource ? 0.82 : 0.34 },
            { type: "mean", value: trackSummaryStats.mean, alphaV: trackHideSource ? 0.94 : 0.78, opac: trackHideSource ? 0.94 : 0.72 },
            { type: "max",  value: trackSummaryStats.max,  alphaV: trackHideSource ? 0.78 : 0.42, opac: trackHideSource ? 0.82 : 0.34 },
          ];
          for (const entry of summaryEntries) {
            if (!Number.isFinite(entry.value)) continue;
            summaryValues.push({
              entityId: `summary:${entry.type}:${trackSeries.entityId}`,
              relatedEntityId: trackSeries.entityId,
              label: trackSeries.label,
              baseLabel: trackSeries.label,
              unit: trackSeries.unit || "",
              color: hexToRgba(trackSeries.color, entry.alphaV),
              opacity: entry.opac,
              hasValue: true,
              value: entry.value,
              axisSide: "left", axisSlot: 0, summaryType: entry.type, summary: true, rawVisible: !trackHideSource,
            });
          }
        }

        // Threshold value (constant horizontal line).
        if (effectiveAnalysis.show_threshold_analysis === true) {
          const thresholdValue = Number(effectiveAnalysis.threshold_value);
          if (Number.isFinite(thresholdValue)) {
            thresholdValues.push({
              entityId: `threshold:${trackSeries.entityId}`,
              relatedEntityId: trackSeries.entityId,
              label: trackSeries.label,
              baseLabel: trackSeries.label,
              unit: trackSeries.unit || "",
              color: hexToRgba(trackSeries.color, trackHideSource ? 0.82 : 0.46),
              opacity: trackHideSource ? 0.84 : 0.48,
              hasValue: true,
              value: thresholdValue,
              axisSide: "left", axisSlot: 0, threshold: true, rawVisible: !trackHideSource,
            });
          }
        }

        // Anomaly regions — check which (if any) the cursor time falls within.
        if (Array.isArray(trackAnomalyRegions)) {
          for (const region of trackAnomalyRegions) {
            const regionStartMs = region?.cluster?.points?.[0]?.timeMs ?? region.startTime;
            const regionEndMs = region?.cluster?.points?.[(region?.cluster?.points?.length ?? 1) - 1]?.timeMs ?? region.endTime;
            if (Number.isFinite(regionStartMs) && Number.isFinite(regionEndMs)
                && timeMs >= regionStartMs && timeMs <= regionEndMs) {
              anomalyRegions.push(region);
            }
          }
        }
      }

      const hideRawData = tracks.every((track) => {
        const eff = track.analysis || (analysisMap || new Map()).get(track.series.entityId) || normalizeHistorySeriesAnalysis(null);
        return this._seriesShouldHideSource(eff, hasSelectedComparisonWindow);
      });

      return {
        x,
        y: (values.find((v) => v.hasValue)?.y) ?? (splitSelTop + 12),
        timeMs,
        rangeStartMs: timeMs,
        rangeEndMs: timeMs,
        values: values.filter((v) => v.hasValue),
        trendValues,
        rateValues,
        deltaValues,
        summaryValues,
        thresholdValues,
        comparisonValues: comparisonValues.filter((v) => v.hasValue),
        binaryValues: [],
        primary: values.find((v) => v.hasValue) ?? null,
        event: hoveredEvents.length > 0 ? (({ _hoverDistanceMs: _hd, ...rest }) => rest)(hoveredEvents[0]) : null,
        events: hoveredEvents.map(({ _hoverDistanceMs: _hd, ...rest }) => rest),
        anomalyRegions,
        emphasizeGuides: options.emphasizeHoverGuides === true,
        showTrendCrosshairs,
        hideRawData,
        splitVertical: { top: splitSelTop, height: splitSelHeight },
      };
    };

    const showFromPointer = (clientX, clientY) => {
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
      if (this._config.show_tooltips !== false) {
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

    const onMouseMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
    const onMouseLeave = () => hideHover();
    const onTouchMove = (ev) => {
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
    const selection = this.shadowRoot?.getElementById("chart-zoom-selection");

    const hideZoomSelection = () => {
      if (!selection) {
        return;
      }
      selection.hidden = true;
      selection.classList.remove("visible");
    };

    const renderZoomSelection = (startX, currentX) => {
      if (!selection) {
        return;
      }
      const left = Math.min(startX, currentX);
      const width = Math.abs(currentX - startX);
      selection.style.left = `${left}px`;
      selection.style.top = `${splitSelTop}px`;
      selection.style.width = `${width}px`;
      selection.style.height = `${splitSelHeight}px`;
      selection.hidden = false;
      selection.classList.add("visible");
    };

    let zoomPointerId = null;
    let zoomStartX = 0;
    let zoomCurrentX = 0;
    let zoomDragging = false;

    const onZoomPointerMove = (ev) => {
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

    const finishZoom = (ev) => {
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

    const onZoomPointerDown = (ev) => {
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

    const onZoomDoubleClick = (ev) => {
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

  _binaryOnLabel(entityId) {
    const deviceClass = String(this._hass?.states?.[entityId]?.attributes?.device_class || "").toLowerCase();
    const labels = {
      battery: "low",
      battery_charging: "charging",
      carbon_monoxide: "detected",
      cold: "cold",
      connectivity: "connected",
      door: "open",
      garage_door: "open",
      gas: "detected",
      heat: "hot",
      lock: "unlocked",
      moisture: "wet",
      motion: "motion",
      moving: "moving",
      occupancy: "occupied",
      opening: "open",
      plug: "plugged in",
      power: "power",
      presence: "present",
      problem: "problem",
      running: "running",
      safety: "unsafe",
      smoke: "smoke",
      sound: "sound",
      tamper: "tampered",
      update: "update available",
      vibration: "vibration",
      window: "open",
    };
    return labels[deviceClass] || "on";
  }

  _binaryOffLabel(entityId) {
    const deviceClass = String(this._hass?.states?.[entityId]?.attributes?.device_class || "").toLowerCase();
    const labels = {
      battery: "normal",
      battery_charging: "not charging",
      carbon_monoxide: "clear",
      cold: "normal",
      connectivity: "disconnected",
      door: "closed",
      garage_door: "closed",
      gas: "clear",
      heat: "normal",
      lock: "locked",
      moisture: "dry",
      motion: "clear",
      moving: "still",
      occupancy: "clear",
      opening: "closed",
      plug: "unplugged",
      power: "off",
      presence: "away",
      problem: "ok",
      running: "idle",
      safety: "safe",
      smoke: "clear",
      sound: "quiet",
      tamper: "clear",
      update: "up to date",
      vibration: "still",
      window: "closed",
    };
    return labels[deviceClass] || "off";
  }

  _normalizeBinaryHistory(stateList) {
    return (Array.isArray(stateList) ? stateList : [])
      .map((state) => {
        const rawTimestamp = state?.lu;
        const timeSec = typeof rawTimestamp === "number"
          ? rawTimestamp
          : new Date(state?.last_changed || state?.lu || 0).getTime() / 1000;
        if (!Number.isFinite(timeSec)) {
          return null;
        }
        return {
          lu: Math.round(timeSec * 1000) / 1000,
          s: String(state?.s ?? state?.state ?? ""),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.lu - b.lu);
  }

  _normalizeNumericHistory(stateList) {
    return (Array.isArray(stateList) ? stateList : [])
      .map((state) => {
        const value = parseFloat(state?.s);
        if (Number.isNaN(value)) {
          return null;
        }
        const rawTimestamp = state?.lu ?? state?.lc ?? state?.last_changed ?? state?.last_updated;
        const timeSec = typeof rawTimestamp === "number"
          ? rawTimestamp
          : new Date(rawTimestamp || 0).getTime() / 1000;
        if (!Number.isFinite(timeSec)) {
          return null;
        }
        return {
          lu: Math.round(timeSec * 1000) / 1000,
          s: String(value),
        };
      })
      .filter(Boolean);
  }

  _getHistoryStatesForEntity(entityId, histResult) {
    if (!histResult) {
      return [];
    }
    if (Array.isArray(histResult?.[entityId])) {
      return histResult[entityId];
    }
    if (Array.isArray(histResult)) {
      const entityIndex = this._entityIds.indexOf(entityId);
      if (entityIndex >= 0 && Array.isArray(histResult[entityIndex])) {
        return histResult[entityIndex];
      }
      if (histResult.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
        return histResult.filter((entry) => entry.entity_id === entityId);
      }
    }
    if (histResult && typeof histResult === "object") {
      if (Array.isArray(histResult.result?.[entityId])) {
        return histResult.result[entityId];
      }
      if (Array.isArray(histResult.result)) {
        const entityIndex = this._entityIds.indexOf(entityId);
        if (entityIndex >= 0 && Array.isArray(histResult.result[entityIndex])) {
          return histResult.result[entityIndex];
        }
      }
    }
    return [];
  }

  _normalizeStatisticsHistory(statEntries) {
    return (Array.isArray(statEntries) ? statEntries : [])
      .map((entry) => {
        const value = Number(entry?.mean);
        if (!Number.isFinite(value)) {
          return null;
        }
        const rawTimestamp = entry?.start;
        const timestamp = typeof rawTimestamp === "number"
          ? (rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1000)
          : new Date(rawTimestamp).getTime();
        if (!Number.isFinite(timestamp)) {
          return null;
        }
        return {
          lu: Math.round(timestamp) / 1000,
          s: String(value),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.lu - b.lu);
  }

  _mergeNumericHistoryWithStatistics(rawHistory, statisticsHistory) {
    const raw = Array.isArray(rawHistory) ? rawHistory : [];
    const stats = Array.isArray(statisticsHistory) ? statisticsHistory : [];
    if (!raw.length) {
      return [...stats];
    }
    if (!stats.length) {
      return [...raw];
    }

    const firstRawMs = raw[0].lu * 1000;
    const lastRawMs = raw[raw.length - 1].lu * 1000;
    const merged = [
      ...stats.filter((entry) => {
        const timeMs = entry.lu * 1000;
        return timeMs < firstRawMs || timeMs > lastRawMs;
      }),
      ...raw,
    ];
    merged.sort((a, b) => a.lu - b.lu);
    return merged;
  }

  _buildEntityStateList(entityId, histResult, statsResult = {}) {
    const domain = entityId.split(".")[0];
    const historyStates = this._getHistoryStatesForEntity(entityId, histResult);
    if (domain === "binary_sensor") {
      return this._normalizeBinaryHistory(historyStates);
    }
    const rawHistory = this._normalizeNumericHistory(historyStates);
    const statisticsHistory = this._normalizeStatisticsHistory(statsResult?.[entityId]);
    return this._mergeNumericHistoryWithStatistics(rawHistory, statisticsHistory);
  }

  _hasDrawableHistoryData(histResult = {}, statsResult = {}) {
    return this._seriesSettings.some((seriesSetting) => {
      const stateList = this._buildEntityStateList(seriesSetting.entity_id, histResult, statsResult);
      return Array.isArray(stateList) && stateList.length > 0;
    });
  }

  _getDrawableHistoryQuality(histResult = {}, statsResult = {}) {
    let totalPoints = 0;
    let populatedSeries = 0;
    for (const seriesSetting of this._seriesSettings) {
      const stateList = this._buildEntityStateList(seriesSetting.entity_id, histResult, statsResult);
      const count = Array.isArray(stateList) ? stateList.length : 0;
      totalPoints += count;
      if (count > 0) {
        populatedSeries += 1;
      }
    }
    return { totalPoints, populatedSeries };
  }

  _getAxisValueExtent(values = []) {
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        continue;
      }
      if (numeric < min) {
        min = numeric;
      }
      if (numeric > max) {
        max = numeric;
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    return { min, max };
  }

  _getAvailableChartHeight(minChartHeight = 280) {
    const card = this.shadowRoot?.querySelector("ha-card");
    const header = this.shadowRoot?.querySelector(".card-header");
    const topSlot = this.shadowRoot?.getElementById("chart-top-slot");
    const legend = this.shadowRoot?.getElementById("legend");
    const scrollViewport = this.shadowRoot?.getElementById("chart-scroll-viewport");
    const wrap = this.shadowRoot?.querySelector(".chart-wrap");

    const cardHeight = card?.clientHeight || 0;
    const occupiedHeight =
      (header?.offsetHeight || 0)
      + ((topSlot && !topSlot.hidden) ? (topSlot.offsetHeight || 0) : 0)
      + (legend?.offsetHeight || 0);
    const cardDerivedHeight = cardHeight ? Math.max(0, cardHeight - occupiedHeight) : 0;
    const viewportHeight = scrollViewport?.clientHeight || 0;
    const wrapHeight = wrap?.clientHeight || 0;

    return Math.max(
      minChartHeight,
      cardDerivedHeight || viewportHeight || wrapHeight || 0,
    );
  }

  _getTrendWindowMs(value) {
    const windows = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "14d": 14 * 24 * 60 * 60 * 1000,
      "21d": 21 * 24 * 60 * 60 * 1000,
      "28d": 28 * 24 * 60 * 60 * 1000,
    };
    return windows[value] || windows["24h"];
  }

  _buildRollingAverageTrend(points, windowMs) {
    if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(windowMs) || windowMs <= 0) {
      return [];
    }
    const trendPoints = [];
    let windowStartIndex = 0;
    let windowSum = 0;
    for (let index = 0; index < points.length; index += 1) {
      const [time, value] = points[index];
      windowSum += value;
      while (windowStartIndex < index && (time - points[windowStartIndex][0]) > windowMs) {
        windowSum -= points[windowStartIndex][1];
        windowStartIndex += 1;
      }
      const count = index - windowStartIndex + 1;
      if (count > 0) {
        trendPoints.push([time, windowSum / count]);
      }
    }
    return trendPoints;
  }

  _buildLinearTrend(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return [];
    }
    const origin = points[0][0];
    let sumX = 0;
    let sumY = 0;
    let sumXX = 0;
    let sumXY = 0;
    for (const [time, value] of points) {
      const x = (time - origin) / (60 * 60 * 1000);
      sumX += x;
      sumY += value;
      sumXX += x * x;
      sumXY += x * value;
    }
    const count = points.length;
    const denominator = (count * sumXX) - (sumX * sumX);
    if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
      return [];
    }
    const slope = ((count * sumXY) - (sumX * sumY)) / denominator;
    const intercept = (sumY - (slope * sumX)) / count;
    const firstTime = points[0][0];
    const lastTime = points[points.length - 1][0];
    const firstX = (firstTime - origin) / (60 * 60 * 1000);
    const lastX = (lastTime - origin) / (60 * 60 * 1000);
    return [
      [firstTime, intercept + (slope * firstX)],
      [lastTime, intercept + (slope * lastX)],
    ];
  }

  // ── Data gap detection & rendering ────────────────────────────────────────

  /**
   * Find gaps in a sorted points array using adaptive local density.
   *
   * For each interval, compare it to the local neighbourhood (the surrounding
   * intervals within a sliding window). An interval is a gap when it exceeds
   * 3× the local median. This handles merged data where raw history (seconds/
   * minutes apart) and long-term statistics (hourly) coexist – each region's
   * density is evaluated independently.
   *
   * When a fixed threshold is provided (non-null), it is used directly instead
   * of the adaptive approach.
   *
   * Returns array of { startIdx, endIdx } where startIdx is the last point
   * before the gap and endIdx is the first point after.
   */
  _findGaps(pts, fixedThreshold) {
    if (pts.length < 5) return [];

    const intervals = [];
    for (let i = 1; i < pts.length; i++) {
      intervals.push(pts[i][0] - pts[i - 1][0]);
    }

    if (fixedThreshold != null) {
      const gaps = [];
      for (let i = 0; i < intervals.length; i++) {
        if (intervals[i] > fixedThreshold) {
          gaps.push({ startIdx: i, endIdx: i + 1 });
        }
      }
      return gaps;
    }

    // Adaptive: compare each interval to a local window of neighbours.
    const windowRadius = Math.max(3, Math.min(12, Math.floor(intervals.length / 6)));
    const gaps = [];
    for (let i = 0; i < intervals.length; i++) {
      const lo = Math.max(0, i - windowRadius);
      const hi = Math.min(intervals.length, i + windowRadius + 1);
      const neighbours = intervals.slice(lo, hi).sort((a, b) => a - b);
      const localMedian = neighbours[Math.floor(neighbours.length / 2)];
      if (intervals[i] > localMedian * 3 && intervals[i] > 10_000) {
        gaps.push({ startIdx: i, endIdx: i + 1 });
      }
    }
    return gaps;
  }

  /**
   * Split a points array into contiguous segments separated by gaps.
   */
  _splitPointsByGaps(pts, gaps) {
    if (!gaps.length) return [pts];
    const segments = [];
    let start = 0;
    for (const gap of gaps) {
      segments.push(pts.slice(start, gap.startIdx + 1));
      start = gap.endIdx;
    }
    segments.push(pts.slice(start));
    return segments;
  }

  /**
   * Draw a series line with automatic gap detection. Solid segments are drawn
   * normally, gaps are drawn as dashed lines, and diagonal hash markers are
   * placed at every gap boundary.
   */
  /**
   * Parse a duration string like "5m", "1h", "24h" into milliseconds.
   */
  _parseGapThresholdMs(value) {
    if (!value || value === "auto") return null;
    const match = String(value).match(/^(\d+(?:\.\d+)?)\s*(m|h|d)$/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (unit === "m") return num * 60 * 1000;
    if (unit === "h") return num * 60 * 60 * 1000;
    if (unit === "d") return num * 24 * 60 * 60 * 1000;
    return null;
  }

  _drawSeriesLine(renderer, pts, color, t0, t1, vMin, vMax, options = {}) {
    if (this._config.show_data_gaps === false || pts.length < 5) {
      renderer.drawLine(pts, color, t0, t1, vMin, vMax, options);
      return;
    }
    const fixedThreshold = this._parseGapThresholdMs(this._config.data_gap_threshold);
    const gaps = this._findGaps(pts, fixedThreshold);
    if (!gaps.length) {
      renderer.drawLine(pts, color, t0, t1, vMin, vMax, options);
      return;
    }

    const segments = this._splitPointsByGaps(pts, gaps);
    // Draw each solid data segment.
    for (const seg of segments) {
      if (seg.length >= 2) {
        renderer.drawLine(seg, color, t0, t1, vMin, vMax, options);
      }
    }
    // Draw dashed lines across each gap.
    for (const gap of gaps) {
      renderer.drawLine(
        [pts[gap.startIdx], pts[gap.endIdx]],
        color,
        t0, t1, vMin, vMax,
        { ...options, dashed: true, lineOpacity: (options.lineOpacity || 1) * 0.3, fillAlpha: 0 },
      );
    }
    // Draw diagonal hash markers at gap boundaries.
    const boundaryPoints = [];
    for (const gap of gaps) {
      boundaryPoints.push(pts[gap.startIdx], pts[gap.endIdx]);
    }
    renderer.drawGapMarkers(boundaryPoints, color, t0, t1, vMin, vMax);
  }

  _buildTrendPoints(points, method = "rolling_average", trendWindow = "24h") {
    if (!Array.isArray(points) || points.length < 2) {
      return [];
    }
    if (method === "linear_trend") {
      return this._buildLinearTrend(points);
    }
    return this._buildRollingAverageTrend(points, this._getTrendWindowMs(trendWindow));
  }

  _buildTrendBaselinePoints(points, method = "rolling_average", trendWindow = "24h") {
    if (!Array.isArray(points) || points.length < 2) {
      return [];
    }
    if (method === "linear_trend") {
      return this._buildLinearTrend(points);
    }
    return this._buildRollingAverageTrend(points, this._getTrendWindowMs(trendWindow));
  }

  _interpolateSeriesValue(points, timeMs) {
    if (!Array.isArray(points) || points.length === 0) {
      return null;
    }
    if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {
      return null;
    }
    if (timeMs === points[0][0]) {
      return points[0][1];
    }
    if (timeMs === points[points.length - 1][0]) {
      return points[points.length - 1][1];
    }
    for (let index = 0; index < points.length - 1; index += 1) {
      const [startTime, startValue] = points[index];
      const [endTime, endValue] = points[index + 1];
      if (timeMs >= startTime && timeMs <= endTime) {
        const fraction = (timeMs - startTime) / (endTime - startTime);
        return startValue + ((endValue - startValue) * fraction);
      }
    }
    return null;
  }

  _getAnomalySensitivityThreshold(sensitivity = "medium") {
    if (sensitivity === "low") {
      return 2.8;
    }
    if (sensitivity === "high") {
      return 1.6;
    }
    return 2.2;
  }

  _buildAnomalyClusters(points, method = "rolling_average", trendWindow = "24h", sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 3) {
      return [];
    }
    const baselinePoints = this._buildTrendBaselinePoints(points, method, trendWindow);
    if (!Array.isArray(baselinePoints) || baselinePoints.length < 2) {
      return [];
    }

    const residualPoints = [];
    for (const [timeMs, value] of points) {
      const baselineValue = this._interpolateSeriesValue(baselinePoints, timeMs);
      if (!Number.isFinite(baselineValue)) {
        continue;
      }
      residualPoints.push({
        timeMs,
        value,
        baselineValue,
        residual: value - baselineValue,
      });
    }

    if (residualPoints.length < 3) {
      return [];
    }

    let sumSquares = 0;
    residualPoints.forEach((point) => {
      sumSquares += point.residual * point.residual;
    });
    const rmsResidual = Math.sqrt(sumSquares / residualPoints.length);
    if (!Number.isFinite(rmsResidual) || rmsResidual <= 0.000001) {
      return [];
    }

    const threshold = rmsResidual * this._getAnomalySensitivityThreshold(sensitivity);
    const clusters = [];
    let currentCluster = [];

    const flushCluster = () => {
      if (currentCluster.length === 0) {
        return;
      }
      const maxDeviation = currentCluster.reduce((maxValue, point) => {
        return Math.max(maxValue, Math.abs(point.residual));
      }, 0);
      clusters.push({
        points: currentCluster.slice(),
        maxDeviation,
        anomalyMethod: "trend_residual",
      });
      currentCluster = [];
    };

    residualPoints.forEach((point) => {
      if (Math.abs(point.residual) >= threshold) {
        currentCluster.push(point);
      } else {
        flushCluster();
      }
    });
    flushCluster();

    return clusters.filter((cluster) => cluster.points.length > 0);
  }

  _buildRateOfChangeAnomalyClusters(points, rateWindow = "1h", sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 3) {
      return [];
    }
    const ratePoints = this._buildRateOfChangePoints(points, rateWindow);
    if (!Array.isArray(ratePoints) || ratePoints.length < 3) {
      return [];
    }

    let sumRates = 0;
    for (const [, rate] of ratePoints) {
      sumRates += rate;
    }
    const meanRate = sumRates / ratePoints.length;

    let sumSqDev = 0;
    for (const [, rate] of ratePoints) {
      const dev = rate - meanRate;
      sumSqDev += dev * dev;
    }
    const rmsDeviation = Math.sqrt(sumSqDev / ratePoints.length);
    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 0.000001) {
      return [];
    }

    const threshold = rmsDeviation * this._getAnomalySensitivityThreshold(sensitivity);
    const clusters = [];
    let currentCluster = [];

    const flushCluster = () => {
      if (currentCluster.length === 0) {
        return;
      }
      const maxDeviation = currentCluster.reduce((maxVal, point) => {
        return Math.max(maxVal, Math.abs(point.residual));
      }, 0);
      clusters.push({
        points: currentCluster.slice(),
        maxDeviation,
        anomalyMethod: "rate_of_change",
      });
      currentCluster = [];
    };

    for (const [timeMs, rate] of ratePoints) {
      const residual = rate - meanRate;
      if (Math.abs(residual) >= threshold) {
        const sourceValue = this._interpolateSeriesValue(points, timeMs);
        if (!Number.isFinite(sourceValue)) {
          flushCluster();
          continue;
        }
        currentCluster.push({
          timeMs,
          value: sourceValue,
          baselineValue: meanRate,
          residual,
        });
      } else {
        flushCluster();
      }
    }
    flushCluster();

    return clusters.filter((cluster) => cluster.points.length > 0);
  }

  _buildIQRAnomalyClusters(points, sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 4) return [];
    const sorted = points.map(([, v]) => v).sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n * 0.25)];
    const q2 = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    if (!Number.isFinite(iqr) || iqr <= 0.000001) return [];
    const k = sensitivity === "low" ? 3.0 : sensitivity === "high" ? 1.5 : 2.0;
    const lowerFence = q1 - k * iqr;
    const upperFence = q3 + k * iqr;
    const clusters = [];
    let currentCluster = [];
    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "iqr" });
      currentCluster = [];
    };
    for (const [timeMs, value] of points) {
      if (value < lowerFence || value > upperFence) {
        currentCluster.push({ timeMs, value, baselineValue: q2, residual: value - q2 });
      } else {
        flushCluster();
      }
    }
    flushCluster();
    return clusters.filter((c) => c.points.length > 0);
  }

  _buildRollingZScoreAnomalyClusters(points, windowValue = "24h", sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 3) return [];
    const windowMs = this._getTrendWindowMs(windowValue);
    if (!Number.isFinite(windowMs) || windowMs <= 0) return [];
    const threshold = this._getAnomalySensitivityThreshold(sensitivity);
    const residuals = [];
    let windowStart = 0;
    let windowSum = 0;
    let windowSumSq = 0;
    for (let i = 0; i < points.length; i += 1) {
      const [timeMs, value] = points[i];
      windowSum += value;
      windowSumSq += value * value;
      while (windowStart < i && (timeMs - points[windowStart][0]) > windowMs) {
        const old = points[windowStart][1];
        windowSum -= old;
        windowSumSq -= old * old;
        windowStart += 1;
      }
      const count = i - windowStart + 1;
      if (count < 3) continue;
      const mean = windowSum / count;
      const variance = Math.max(0, (windowSumSq / count) - (mean * mean));
      const std = Math.sqrt(variance);
      if (!Number.isFinite(std) || std <= 0.000001) continue;
      const zscore = (value - mean) / std;
      residuals.push(Math.abs(zscore) >= threshold
        ? { timeMs, value, baselineValue: mean, residual: value - mean, flagged: true }
        : { timeMs, flagged: false });
    }
    const clusters = [];
    let currentCluster = [];
    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });
      currentCluster = [];
    };
    for (const r of residuals) {
      if (r.flagged) currentCluster.push(r); else flushCluster();
    }
    flushCluster();
    return clusters.filter((c) => c.points.length > 0);
  }

  _getPersistenceWindowMs(value) {
    const windows = { "30m": 30 * 60 * 1000, "1h": 60 * 60 * 1000, "3h": 3 * 60 * 60 * 1000, "6h": 6 * 60 * 60 * 1000, "12h": 12 * 60 * 60 * 1000, "24h": 24 * 60 * 60 * 1000 };
    return windows[value] || windows["1h"];
  }

  _buildPersistenceAnomalyClusters(points, windowValue = "1h", sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 3) return [];
    const minDurationMs = this._getPersistenceWindowMs(windowValue);
    let totalMin = Infinity;
    let totalMax = -Infinity;
    for (const [, v] of points) {
      if (v < totalMin) totalMin = v;
      if (v > totalMax) totalMax = v;
    }
    const totalRange = totalMax - totalMin;
    if (!Number.isFinite(totalRange) || totalRange <= 0.000001) return [];
    const flatFraction = sensitivity === "low" ? 0.005 : sensitivity === "high" ? 0.05 : 0.02;
    const flatThreshold = flatFraction * totalRange;
    const clusters = [];
    let runStart = 0;
    let runMin = points[0][1];
    let runMax = points[0][1];
    const flushRun = (runEnd) => {
      const duration = points[runEnd][0] - points[runStart][0];
      if (duration >= minDurationMs && runEnd > runStart) {
        const mid = (runMin + runMax) / 2;
        const clusterPoints = [];
        for (let k = runStart; k <= runEnd; k += 1) {
          clusterPoints.push({ timeMs: points[k][0], value: points[k][1], baselineValue: mid, residual: points[k][1] - mid });
        }
        clusters.push({ points: clusterPoints, maxDeviation: runMax - runMin, anomalyMethod: "persistence", flatRange: runMax - runMin });
      }
    };
    for (let i = 1; i < points.length; i += 1) {
      const v = points[i][1];
      const nextMin = Math.min(runMin, v);
      const nextMax = Math.max(runMax, v);
      if (nextMax - nextMin > flatThreshold) {
        flushRun(i - 1);
        runStart = i;
        runMin = v;
        runMax = v;
      } else {
        runMin = nextMin;
        runMax = nextMax;
      }
    }
    flushRun(points.length - 1);
    return clusters.filter((c) => c.points.length > 0);
  }

  _buildComparisonWindowAnomalyClusters(points, comparisonPoints, sensitivity = "medium") {
    if (!Array.isArray(points) || points.length < 3 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 3) return [];
    const deltaPoints = [];
    for (const [timeMs, value] of points) {
      const compValue = this._interpolateSeriesValue(comparisonPoints, timeMs);
      if (!Number.isFinite(compValue)) continue;
      deltaPoints.push({ timeMs, value, compValue, delta: value - compValue });
    }
    if (deltaPoints.length < 3) return [];
    let sumDeltas = 0;
    for (const p of deltaPoints) sumDeltas += p.delta;
    const meanDelta = sumDeltas / deltaPoints.length;
    let sumSqDev = 0;
    for (const p of deltaPoints) {
      const dev = p.delta - meanDelta;
      sumSqDev += dev * dev;
    }
    const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);
    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 0.000001) return [];
    const threshold = rmsDeviation * this._getAnomalySensitivityThreshold(sensitivity);
    const clusters = [];
    let currentCluster = [];
    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "comparison_window" });
      currentCluster = [];
    };
    for (const { timeMs, value, compValue, delta } of deltaPoints) {
      const residual = delta - meanDelta;
      if (Math.abs(residual) >= threshold) {
        currentCluster.push({ timeMs, value, baselineValue: compValue, residual: value - compValue });
      } else {
        flushCluster();
      }
    }
    flushCluster();
    return clusters.filter((c) => c.points.length > 0);
  }

  _applyAnomalyOverlapMode(clustersByMethod, overlapMode) {
    const methodKeys = Object.keys(clustersByMethod);
    if (methodKeys.length <= 1 || overlapMode === "all") {
      return methodKeys.flatMap((m) => clustersByMethod[m]);
    }
    const flaggedByMethod = {};
    for (const m of methodKeys) {
      flaggedByMethod[m] = new Set(clustersByMethod[m].flatMap((c) => c.points.map((p) => p.timeMs)));
    }
    const overlapTimes = new Set();
    for (const m of methodKeys) {
      for (const t of flaggedByMethod[m]) {
        if (methodKeys.some((other) => other !== m && flaggedByMethod[other].has(t))) overlapTimes.add(t);
      }
    }
    if (overlapMode === "only") {
      const seen = new Set();
      const result = [];
      for (const m of methodKeys) {
        for (const cluster of clustersByMethod[m]) {
          const pts = cluster.points.filter((p) => overlapTimes.has(p.timeMs));
          if (pts.length === 0) continue;
          const key = pts.map((p) => p.timeMs).join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          const detectedByMethods = methodKeys.filter((other) => pts.some((p) => flaggedByMethod[other].has(p.timeMs)));
          result.push({ ...cluster, points: pts, maxDeviation: pts.reduce((v, p) => Math.max(v, Math.abs(p.residual || 0)), 0), isOverlap: true, detectedByMethods });
        }
      }
      return result;
    }
    const result = [];
    for (const m of methodKeys) {
      for (const cluster of clustersByMethod[m]) {
        const hasOverlap = cluster.points.some((p) => overlapTimes.has(p.timeMs));
        const detectedByMethods = hasOverlap
          ? methodKeys.filter((other) => cluster.points.some((p) => flaggedByMethod[other].has(p.timeMs)))
          : [m];
        result.push({ ...cluster, isOverlap: hasOverlap, detectedByMethods });
      }
    }
    return result;
  }

  _buildRateOfChangePoints(points, rateWindow = "1h") {
    if (!Array.isArray(points) || points.length < 2) {
      return [];
    }
    const ratePoints = [];
    for (let index = 1; index < points.length; index += 1) {
      const [timeMs, value] = points[index];
      let comparisonPoint = null;
      if (rateWindow === "point_to_point") {
        comparisonPoint = points[index - 1];
      } else {
        const windowMs = this._getTrendWindowMs(rateWindow);
        if (!Number.isFinite(windowMs) || windowMs <= 0) {
          continue;
        }
        for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {
          const candidatePoint = points[candidateIndex];
          if ((timeMs - candidatePoint[0]) >= windowMs) {
            comparisonPoint = candidatePoint;
            break;
          }
        }
        if (!comparisonPoint) {
          comparisonPoint = points[0];
        }
      }
      if (!Array.isArray(comparisonPoint) || comparisonPoint.length < 2) {
        continue;
      }
      const deltaMs = timeMs - comparisonPoint[0];
      if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
        continue;
      }
      const deltaHours = deltaMs / (60 * 60 * 1000);
      if (!Number.isFinite(deltaHours) || deltaHours <= 0) {
        continue;
      }
      const rateValue = (value - comparisonPoint[1]) / deltaHours;
      if (!Number.isFinite(rateValue)) {
        continue;
      }
      ratePoints.push([timeMs, rateValue]);
    }
    return ratePoints;
  }

  _interpolateSeriesValue(points, timeMs) {
    if (!Array.isArray(points) || !points.length) {
      return null;
    }
    if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {
      return null;
    }
    if (timeMs === points[0][0]) {
      return points[0][1];
    }
    if (timeMs === points[points.length - 1][0]) {
      return points[points.length - 1][1];
    }
    for (let index = 0; index < points.length - 1; index += 1) {
      const [startTime, startValue] = points[index];
      const [endTime, endValue] = points[index + 1];
      if (timeMs >= startTime && timeMs <= endTime) {
        const fraction = (timeMs - startTime) / (endTime - startTime);
        return startValue + (fraction * (endValue - startValue));
      }
    }
    return null;
  }

  _buildDeltaPoints(sourcePoints, comparisonPoints) {
    if (!Array.isArray(sourcePoints) || sourcePoints.length < 2 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 2) {
      return [];
    }
    const deltaPoints = [];
    for (const [timeMs, value] of sourcePoints) {
      const comparisonValue = this._interpolateSeriesValue(comparisonPoints, timeMs);
      if (comparisonValue == null) {
        continue;
      }
      deltaPoints.push([timeMs, value - comparisonValue]);
    }
    return deltaPoints;
  }

  _buildSummaryStats(points) {
    if (!Array.isArray(points) || !points.length) {
      return null;
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;
    for (const point of points) {
      const value = Number(point?.[1]);
      if (!Number.isFinite(value)) {
        continue;
      }
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
      sum += value;
      count += 1;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || count === 0) {
      return null;
    }
    return {
      min,
      max,
      mean: sum / count,
    };
  }

  _getTrendRenderOptions(method = "rolling_average", hideRawData = false) {
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

  _getSeriesAnalysisMap() {
    const seriesSettings = Array.isArray(this._config?.series_settings) ? this._config.series_settings : [];
    return new Map(seriesSettings.map((entry) => {
      return [entry?.entity_id, normalizeHistorySeriesAnalysis(entry?.analysis)];
    }));
  }

  _getSeriesAnalysis(entityId, analysisMap = null) {
    const map = analysisMap || this._getSeriesAnalysisMap();
    return normalizeHistorySeriesAnalysis(map.get(entityId));
  }

  _seriesHasActiveAnalysis(analysis, hasSelectedComparisonWindow = false) {
    return (
      analysis.show_trend_lines
      || analysis.show_summary_stats
      || analysis.show_rate_of_change
      || analysis.show_threshold_analysis
      || analysis.show_anomalies
      || (analysis.show_delta_analysis && hasSelectedComparisonWindow)
    );
  }

  _seriesShouldHideSource(analysis, hasSelectedComparisonWindow = false) {
    return analysis.hide_source_series === true && this._seriesHasActiveAnalysis(analysis, hasSelectedComparisonWindow);
  }

  _updateLegendLayout(legendEl) {
    if (!legendEl) {
      return;
    }
    const cardHeight = this.shadowRoot?.querySelector("ha-card")?.clientHeight || 0;
    if (this._legendWrapRows) {
      this._legendWrapRows = cardHeight >= HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX;
    } else {
      this._legendWrapRows = cardHeight >= HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX;
    }
    legendEl.classList.toggle("wrap-rows", this._legendWrapRows);
  }

  _setAdjustAxisButtonVisibility(visible) {
    const button = this.shadowRoot?.getElementById("chart-adjust-axis");
    if (!button) {
      return;
    }
    button.hidden = !visible;
    if (visible) {
      button.onclick = () => {
        this._adjustComparisonAxisScale = true;
        if (this._lastHistResult && this._lastEvents) {
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(this._lastEvents),
            this._lastT0,
            this._lastT1,
          );
        }
      };
      return;
    }
    button.onclick = null;
  }

  _queueDrawChart(histResult, statsResult, events, t0, t1, options = {}) {
    const drawRequestId = ++this._drawRequestId;
    console.log("[hass-datapoints history-card] draw queued", {
      drawRequestId,
      loading: options.loading ?? false,
    });
    this._drawChart(histResult, statsResult, events, t0, t1, {
      ...options,
      drawRequestId,
    }).catch((error) => {
      if (drawRequestId !== this._drawRequestId) {
        return;
      }
      console.error("[hass-datapoints history-card] draw failed", error);
      this._setChartLoading(false);
      this._setChartMessage("Failed to render chart.");
    });
  }

  _buildHistoryAnalysisPayload(visibleSeries, selectedComparisonSeriesMap, analysisMap, hasSelectedComparisonWindow, allComparisonWindowsData = {}) {
    return {
      series: visibleSeries.map((seriesItem) => ({
        entityId: seriesItem.entityId,
        pts: seriesItem.pts,
        analysis: analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null),
      })),
      comparisonSeries: Array.from(selectedComparisonSeriesMap.values()).map((seriesItem) => ({
        entityId: seriesItem.entityId,
        pts: seriesItem.pts,
      })),
      hasSelectedComparisonWindow: hasSelectedComparisonWindow === true,
      allComparisonWindowsData,
    };
  }

  async _computeHistoryAnalysis(visibleSeries, selectedComparisonSeriesMap, analysisMap, hasSelectedComparisonWindow, allComparisonWindowsData = {}) {
    const payload = this._buildHistoryAnalysisPayload(
      visibleSeries,
      selectedComparisonSeriesMap,
      analysisMap,
      hasSelectedComparisonWindow,
      allComparisonWindowsData,
    );
    try {
      return await computeHistoryAnalysisInWorker(payload);
    } catch (error) {
      console.warn("[hass-datapoints history-card] analysis worker fallback", {
        message: error?.message || String(error),
      });
      return {
        trendSeries: visibleSeries
          .map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_trend_lines !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildTrendPoints(seriesItem.pts, analysis.trend_method, analysis.trend_window),
            };
          })
            .filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2)
          .filter(Boolean),
        rateSeries: visibleSeries
          .map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_rate_of_change !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildRateOfChangePoints(seriesItem.pts, analysis.rate_window),
            };
          })
            .filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2)
          .filter(Boolean),
        deltaSeries: visibleSeries
          .map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (!(analysis.show_delta_analysis === true && hasSelectedComparisonWindow === true)) {
              return null;
            }
            const comparisonSeries = selectedComparisonSeriesMap.get(seriesItem.entityId);
            return {
              entityId: seriesItem.entityId,
              pts: comparisonSeries ? this._buildDeltaPoints(seriesItem.pts, comparisonSeries.pts) : [],
            };
          })
            .filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2)
          .filter(Boolean),
        summaryStats: visibleSeries
          .map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_summary_stats !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              ...this._buildSummaryStats(seriesItem.pts),
            };
          })
          .filter((entry) => entry && Number.isFinite(entry.min) && Number.isFinite(entry.max) && Number.isFinite(entry.mean)),
        anomalySeries: visibleSeries
          .map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_anomalies !== true) return null;
            const clustersByMethod = {};
            const methods = analysis.anomaly_methods;
            if (methods.includes("trend_residual")) {
              const c = this._buildAnomalyClusters(seriesItem.pts, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["trend_residual"] = c;
            }
            if (methods.includes("rate_of_change")) {
              const c = this._buildRateOfChangeAnomalyClusters(seriesItem.pts, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["rate_of_change"] = c;
            }
            if (methods.includes("iqr")) {
              const c = this._buildIQRAnomalyClusters(seriesItem.pts, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["iqr"] = c;
            }
            if (methods.includes("rolling_zscore")) {
              const c = this._buildRollingZScoreAnomalyClusters(seriesItem.pts, analysis.anomaly_zscore_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["rolling_zscore"] = c;
            }
            if (methods.includes("persistence")) {
              const c = this._buildPersistenceAnomalyClusters(seriesItem.pts, analysis.anomaly_persistence_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["persistence"] = c;
            }
            if (methods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {
              const compPts = allComparisonWindowsData[analysis.anomaly_comparison_window_id]?.[seriesItem.entityId];
              if (Array.isArray(compPts) && compPts.length >= 3) {
                const c = this._buildComparisonWindowAnomalyClusters(seriesItem.pts, compPts, analysis.anomaly_sensitivity);
                if (c.length > 0) clustersByMethod["comparison_window"] = c;
              }
            }
            const anomalyClusters = this._applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);
            return anomalyClusters.length > 0 ? { entityId: seriesItem.entityId, anomalyClusters } : null;
          })
          .filter(Boolean),
      };
    }
  }

  async _drawChart(histResult, statsResult, events, t0, t1, options = {}) {
    hideTooltip(this);

    const canvas = this.shadowRoot.getElementById("chart");
    const zoomOutButton = this.shadowRoot.getElementById("chart-zoom-out");
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    const scrollViewport = this.shadowRoot.getElementById("chart-scroll-viewport");
    const chartStage = this.shadowRoot.getElementById("chart-stage");
    const header = this.shadowRoot.querySelector(".card-header");
    const legend = this.shadowRoot.getElementById("legend");
    this._chartScrollViewportEl = scrollViewport;
    this._chartStageEl = chartStage;
    const series = [];
    const axes = [];
    const axisMap = new Map();
    const binaryBackgrounds = [];
    const seriesSettings = this._seriesSettings;
    const analysisMap = this._getSeriesAnalysisMap();
    const comparisonResults = Array.isArray(this._lastComparisonResults) ? this._lastComparisonResults : [];
    const selectedComparisonWindowId = this._config?.selected_comparison_window_id || null;
    const hoveredComparisonWindowId = this._config?.hovered_comparison_window_id || null;
    const comparisonPreviewActive = this._comparisonWindows.length > 0;
    const delinkYAxis = this._config?.delink_y_axis === true;
    const hoveringDifferentComparison =
      !!hoveredComparisonWindowId
      && !!selectedComparisonWindowId
      && hoveredComparisonWindowId !== selectedComparisonWindowId;
    const hasSelectedComparisonWindow = !!selectedComparisonWindowId;

    seriesSettings.forEach((seriesSetting, i) => {
      const entityId = seriesSetting.entity_id;
      const domain = entityId.split(".")[0];
      if (domain === "binary_sensor") {
        const stateList = this._buildEntityStateList(entityId, histResult, statsResult);
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
      const stateList = this._buildEntityStateList(entityId, histResult, statsResult);
      const pts = [];
      const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
      const axisKey = delinkYAxis
        ? `${unit || "__unitless__"}::${entityId}`
        : (unit || "__unitless__");
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
        if (!isNaN(v)) {
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

    for (const seriesItem of series) {
      if (!seriesItem.pts.length) {
        continue;
      }
      const lastPt = seriesItem.pts[seriesItem.pts.length - 1];
      const prev = this._previousSeriesEndpoints.get(seriesItem.entityId);
      if (!prev) {
        console.log("[hass-datapoints history-card] series initial draw", {
          entityId: seriesItem.entityId,
          pointCount: seriesItem.pts.length,
          lastPt,
        });
      } else if (lastPt[0] !== prev.t || lastPt[1] !== prev.v) {
        console.log("[hass-datapoints history-card] series updated — live update detected", {
          entityId: seriesItem.entityId,
          pointCount: seriesItem.pts.length,
          prev,
          lastPt,
        });
      } else {
        console.log("[hass-datapoints history-card] series unchanged — no new data", {
          entityId: seriesItem.entityId,
          pointCount: seriesItem.pts.length,
          lastPt,
        });
      }
      this._previousSeriesEndpoints.set(seriesItem.entityId, { t: lastPt[0], v: lastPt[1] });
    }

    if (!series.length && !binaryBackgrounds.length) {
      this._setAdjustAxisButtonVisibility(false);
      this._renderComparisonPreviewOverlay();
      const sameRangeAsLastDraw =
        Number.isFinite(this._lastT0)
        && Number.isFinite(this._lastT1)
        && this._lastT0 === t0
        && this._lastT1 === t1
        && Array.isArray(this._lastDrawArgs)
        && this._lastDrawArgs.length;
      this._setChartLoading(!!options.loading);
      this._setChartMessage(options.loading ? "" : "No numeric data in the selected time range.");
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

    const visibleSeries = series.filter((entry) => !this._hiddenSeries.has(entry.legendEntityId || entry.entityId));
    const selectedComparisonResult = comparisonResults.find((window) => window.id === selectedComparisonWindowId) || null;
    const selectedComparisonSeriesMap = new Map();
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
        const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
        const stateList = this._buildEntityStateList(entityId, selectedComparisonResult.histResult, selectedComparisonResult.statsResult || {});
        const points = [];
        for (const state of stateList) {
          const numericValue = parseFloat(state.s);
          if (!Number.isNaN(numericValue)) {
            points.push([Math.round(state.lu * 1000) - selectedComparisonResult.time_offset_ms, numericValue]);
          }
        }
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
    const allComparisonWindowsData = {};
    for (const seriesItem of visibleSeries) {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      if (analysis.show_anomalies !== true || !analysis.anomaly_methods.includes("comparison_window") || !analysis.anomaly_comparison_window_id) {
        continue;
      }
      const windowId = analysis.anomaly_comparison_window_id;
      if (!allComparisonWindowsData[windowId]) {
        allComparisonWindowsData[windowId] = {};
      }
      if (!allComparisonWindowsData[windowId][seriesItem.entityId]) {
        const compResult = comparisonResults.find((win) => win.id === windowId);
        if (compResult) {
          const idx = seriesSettings.findIndex((s) => s.entity_id === seriesItem.entityId);
          const stateList = this._buildEntityStateList(seriesItem.entityId, compResult.histResult, compResult.statsResult || {});
          const pts = [];
          for (const s of stateList) {
            const v = parseFloat(s.s);
            if (!isNaN(v)) pts.push([Math.round(s.lu * 1000) - compResult.time_offset_ms, v]);
          }
          if (pts.length) {
            allComparisonWindowsData[windowId][seriesItem.entityId] = pts;
          }
        }
      }
    }
    const analysisEntityIds = visibleSeries
      .filter((s) => {
        const a = analysisMap.get(s.entityId) || {};
        return a.show_anomalies || a.show_trend_lines || a.show_summary_stats || a.show_rate_of_change;
      })
      .map((s) => s.entityId);
    if (analysisEntityIds.length) {
      this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing", {
        bubbles: true, composed: true, detail: { computing: true, entityIds: analysisEntityIds },
      }));
    }
    const analysisResult = await this._computeHistoryAnalysis(
      visibleSeries,
      selectedComparisonSeriesMap,
      analysisMap,
      hasSelectedComparisonWindow,
      allComparisonWindowsData,
    );
    if (analysisEntityIds.length) {
      this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing", {
        bubbles: true, composed: true, detail: { computing: false, entityIds: analysisEntityIds },
      }));
    }
    if (options.drawRequestId && options.drawRequestId !== this._drawRequestId) {
      return;
    }

    // Restore axis overlays and the primary canvas in case a previous split render hid them.
    if (canvas) {
      canvas.style.display = "";
    }
    chartStage?.querySelectorAll(".split-series-row").forEach((el) => el.remove());
    chartStage?.querySelector("#chart-split-overlay")?.remove();
    const axisLeftEl = this.shadowRoot?.getElementById("chart-axis-left");
    const axisRightEl = this.shadowRoot?.getElementById("chart-axis-right");
    if (axisLeftEl) {
      axisLeftEl.style.display = "";
    }
    if (axisRightEl) {
      axisRightEl.style.display = "";
    }

    const viewportHeight = scrollViewport?.clientHeight || 0;
    const minChartHeight = series.length ? 280 : (binaryBackgrounds.length ? 100 : 280);
    const availableHeight = this._getAvailableChartHeight(minChartHeight);
    const viewportWidth = Math.max(scrollViewport?.clientWidth || wrap?.clientWidth || 360, 360);
    const totalSpanMs = Math.max(1, t1 - t0);
    const zoomSpanMs = this._zoomRange ? Math.max(1, this._zoomRange.end - this._zoomRange.start) : null;
    const rawZoomMultiplier = zoomSpanMs ? (totalSpanMs / zoomSpanMs) : 1;
    const zoomMultiplier = clampChartValue(rawZoomMultiplier, 1, HISTORY_CHART_MAX_ZOOM_MULTIPLIER);
    const canvasWidth = Math.min(
      HISTORY_CHART_MAX_CANVAS_WIDTH_PX,
      zoomSpanMs
        ? Math.max(viewportWidth, Math.round(viewportWidth * zoomMultiplier))
        : viewportWidth,
    );

    if (this._config?.split_view === true && visibleSeries.length >= 2) {
      if (zoomOutButton) {
        zoomOutButton.hidden = !this._zoomRange;
        zoomOutButton.onclick = () => this._clearZoomRange();
      }
      this._renderLegend(series, binaryBackgrounds);
      this._drawSplitChart({
        visibleSeries,
        binaryBackgrounds,
        events,
        renderT0: t0,
        renderT1: t1,
        canvasWidth,
        availableHeight,
        chartStage,
        canvas,
        wrap,
        options,
        comparisonResults,
        selectedComparisonWindowId,
        hoveredComparisonWindowId,
        comparisonPreviewActive,
        hoveringDifferentComparison,
        analysisResult,
        analysisMap,
        hasSelectedComparisonWindow,
      });
      if (this._chartScrollViewportEl) {
        this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
        this._chartScrollViewportEl.addEventListener("scroll", this._onChartScroll, { passive: true });
        this._syncChartViewportScroll(t0, t1, canvasWidth);
      }
      return;
    }

    if (chartStage) {
      chartStage.style.width = `${canvasWidth}px`;
      chartStage.style.height = `${availableHeight}px`;
    }
    const { w, h } = setupCanvas(canvas, chartStage || wrap, availableHeight, canvasWidth);
    const renderer = new ChartRenderer(canvas, w, h);
    renderer.labelColor = resolveChartLabelColor(this);
    renderer.clear();
    const renderT0 = t0;
    const renderT1 = t1;

    const trendPointsMap = new Map((analysisResult?.trendSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const ratePointsMap = new Map((analysisResult?.rateSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const deltaPointsMap = new Map((analysisResult?.deltaSeries || []).map((entry) => [entry.entityId, entry.pts]));
    const summaryStatsMap = new Map((analysisResult?.summaryStats || []).map((entry) => [entry.entityId, entry]));
    const anomalyClustersMap = new Map((analysisResult?.anomalySeries || []).map((entry) => [entry.entityId, entry.anomalyClusters]));
    const hiddenSourceEntityIds = new Set();
    const hiddenComparisonEntityIds = new Set();
    visibleSeries.forEach((seriesItem) => {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      if (this._seriesShouldHideSource(analysis, hasSelectedComparisonWindow)) {
        hiddenSourceEntityIds.add(seriesItem.entityId);
      }
      if (analysis.hide_source_series === true && analysis.show_delta_analysis === true && hasSelectedComparisonWindow) {
        hiddenComparisonEntityIds.add(seriesItem.entityId);
      }
    });
    const anyTrendCrosshairs = visibleSeries.some((seriesItem) => {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      return analysis.show_trend_lines === true && analysis.show_trend_crosshairs === true;
    });
    this._setChartLoading(!!options.loading);
    this._setChartMessage("");
    if (zoomOutButton) {
      zoomOutButton.hidden = !this._zoomRange;
      zoomOutButton.onclick = () => this._clearZoomRange();
    }

    const comparisonAxisValues = new Map();
    if (this._adjustComparisonAxisScale) {
      for (const win of comparisonResults) {
        for (const seriesSetting of seriesSettings) {
          const entityId = seriesSetting.entity_id;
          if (entityId.split(".")[0] === "binary_sensor") {
            continue;
          }
          if (this._hiddenSeries.has(entityId)) {
            continue;
          }
          const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
          const axisKey = delinkYAxis
            ? `${unit || "__unitless__"}::${entityId}`
            : (unit || "__unitless__");
          const stateList = this._buildEntityStateList(entityId, win.histResult, win.statsResult || {});
          for (const state of stateList) {
            const numericValue = parseFloat(state.s);
            if (!Number.isNaN(numericValue)) {
              if (!comparisonAxisValues.has(axisKey)) {
                comparisonAxisValues.set(axisKey, []);
              }
              comparisonAxisValues.get(axisKey).push(numericValue);
            }
          }
        }
      }
    }

    const deltaAxisMap = new Map();
    const rateAxisMap = new Map();
    visibleSeries.forEach((seriesItem) => {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      if (analysis.show_delta_analysis === true && hasSelectedComparisonWindow && analysis.show_delta_lines === true) {
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
            axis.values.push(point[1]);
          });
        }
      }
      if (analysis.show_rate_of_change === true) {
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
            axis.values.push(point[1]);
          });
        }
      }
    });

    const resolvedAxes = axes
      .filter((axis) => axis.values.length)
      .map((axis) => {
        const axisValues = series
          .filter((entry) => entry.axisKey === axis.key)
          .flatMap((entry) => entry.pts.map((point) => point[1]));
        if (this._adjustComparisonAxisScale && comparisonAxisValues.has(axis.key)) {
          axisValues.push(...comparisonAxisValues.get(axis.key));
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
      .filter(Boolean);
    const deltaResolvedAxes = Array.from(deltaAxisMap.values())
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
      .filter(Boolean);
    const rateResolvedAxes = Array.from(rateAxisMap.values())
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
      .filter(Boolean);
    const gridAxes = (resolvedAxes.length || deltaResolvedAxes.length)
      ? [...resolvedAxes, ...deltaResolvedAxes, ...rateResolvedAxes]
      : [{ key: "binary", min: 0, max: 1, side: "left", unit: "", color: null }];
    renderer.drawGrid(renderT0, renderT1, gridAxes, undefined, 5, { fixedAxisOverlay: true });
    this._renderComparisonPreviewOverlay(renderer);
    const activeAxes = resolvedAxes.length ? (renderer._activeAxes || []) : [];
    const axisLookup = new Map(activeAxes.map((axis) => [axis.key, axis]));
    series.forEach((s) => {
      s.axis = axisLookup.get(s.axisKey) || activeAxes[0] || resolvedAxes[0];
    });
    renderChartAxisOverlays(this, renderer, activeAxes);
    binaryBackgrounds.forEach((binaryBackground) => {
      if (binaryBackground?.spans?.length && !this._hiddenSeries.has(binaryBackground.entityId)) {
        renderer.drawStateBands(binaryBackground.spans, renderT0, renderT1, binaryBackground.color, 0.12);
      }
    });
    if (this._config?.show_correlated_anomalies === true) {
      const correlatedSpans = this._buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, analysisMap);
      if (correlatedSpans.length) {
        renderer.drawStateBands(correlatedSpans, renderT0, renderT1, "#ef4444", 0.10);
      }
    }
    let comparisonOutOfBounds = false;
    const mainSeriesHoverOpacity = comparisonPreviewActive ? (hoveringDifferentComparison ? 0.15 : 0.25) : 1;
    const anyHiddenSourceSeries = hiddenSourceEntityIds.size > 0;
    const hoverSeries = visibleSeries
      .filter((seriesItem) => !hiddenSourceEntityIds.has(seriesItem.entityId))
      .map((seriesItem) => ({
        ...seriesItem,
        hoverOpacity: mainSeriesHoverOpacity,
      }));
    const summaryHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_summary_stats !== true) {
          return [];
        }
        const stats = summaryStatsMap.get(seriesItem.entityId) || null;
        if (!stats) {
          return [];
        }
        return [
          {
            entityId: `summary:min:${seriesItem.entityId}`,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            baseLabel: seriesItem.label,
            unit: seriesItem.unit || "",
            value: stats.min,
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.78 : 0.42),
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.82 : 0.34,
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
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.94 : 0.78),
            axis: seriesItem.axis,
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
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.78 : 0.42),
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.82 : 0.34,
            summaryType: "max",
            summary: true,
          },
        ];
      });
    const thresholdHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_threshold_analysis !== true) {
          return [];
        }
        const rawThreshold = analysis.threshold_value;
        const thresholdValue = Number(rawThreshold);
        if (!Number.isFinite(thresholdValue)) {
          return [];
        }
        return [{
          entityId: `threshold:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: thresholdValue,
          baseColor: seriesItem.color,
          color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.82 : 0.46),
          axis: seriesItem.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.84 : 0.48,
          direction: analysis.threshold_direction === "below" ? "below" : "above",
          threshold: true,
        }];
      });
    const trendSeries = visibleSeries
      .map((seriesItem) => ({
        ...seriesItem,
        trendPts: trendPointsMap.get(seriesItem.entityId) || [],
      }))
      .filter((seriesItem) => Array.isArray(seriesItem.trendPts) && seriesItem.trendPts.length >= 2);
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
      .filter(Boolean);
    const anomalySeries = visibleSeries
      .map((seriesItem) => {
        const anomalyClusters = anomalyClustersMap.get(seriesItem.entityId) || [];
        if (!Array.isArray(anomalyClusters) || anomalyClusters.length === 0) {
          return null;
        }
        return {
          ...seriesItem,
          anomalyClusters,
        };
      })
      .filter(Boolean);
    const comparisonHoverSeries = [];
    const deltaHoverSeries = [];
    for (const win of comparisonResults) {
      for (const seriesSetting of seriesSettings) {
        const entityId = seriesSetting.entity_id;
        if (entityId.split(".")[0] === "binary_sensor") continue;
        if (this._hiddenSeries.has(entityId)) continue;
        const stateList = this._buildEntityStateList(entityId, win.histResult, win.statsResult || {});
        const winPts = [];
        for (const s of stateList) {
          const v = parseFloat(s.s);
          if (!isNaN(v)) {
            // Shift timestamp forward by -time_offset_ms to align with the main range
            winPts.push([Math.round(s.lu * 1000) - win.time_offset_ms, v]);
          }
        }
        if (!winPts.length) continue;
        // Find the axis this entity belongs to
        const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
        const axisKey = delinkYAxis
          ? `${unit || "__unitless__"}::${entityId}`
          : (unit || "__unitless__");
        const axis = axisLookup.get(axisKey);
        if (!axis) continue;
        if (!this._adjustComparisonAxisScale) {
          const hasOutOfBoundsPoint = winPts.some((point) => point[1] < axis.min || point[1] > axis.max);
          if (hasOutOfBoundsPoint) {
            comparisonOutOfBounds = true;
          }
        }
        const baseColor = seriesSetting.color || COLORS[seriesSettings.indexOf(seriesSetting) % COLORS.length];
        const isHoveredComparison = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
        const isSelectedComparison = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
        const comparisonLineOpacity = isHoveredComparison
          ? 0.85
          : (hoveringDifferentComparison && isSelectedComparison ? 0.25 : 0.85);
        comparisonHoverSeries.push({
          entityId: `${win.id}:${entityId}`,
          relatedEntityId: entityId,
          label: seriesSetting.label || entityName(this._hass, entityId) || entityId,
          windowLabel: win.label || "Date window",
          unit,
          pts: winPts,
          color: baseColor,
          axis,
          hoverOpacity: comparisonLineOpacity,
        });
        if (!hiddenComparisonEntityIds.has(entityId)) {
          renderer.drawLine(winPts, baseColor, renderT0, renderT1, axis.min, axis.max, {
            lineOpacity: comparisonLineOpacity,
            lineWidth: hoveringDifferentComparison && isSelectedComparison ? 1.25 : undefined,
          });
        }
      }
    }
    this._setAdjustAxisButtonVisibility(comparisonPreviewActive && comparisonOutOfBounds && !this._adjustComparisonAxisScale);

    for (const s of visibleSeries) {
      if (hiddenSourceEntityIds.has(s.entityId)) {
        continue;
      }
      this._drawSeriesLine(renderer, s.pts, s.color, renderT0, renderT1, s.axis.min, s.axis.max, {
        lineOpacity: mainSeriesHoverOpacity,
        lineWidth: this._config?.comparison_hover_active === true ? 1.25 : undefined,
      });
    }
    const trendHoverSeries = trendSeries.map((seriesItem) => {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      const hiddenSource = hiddenSourceEntityIds.has(seriesItem.entityId);
      const trendRenderOptions = this._getTrendRenderOptions(analysis.trend_method, hiddenSource);
      return {
        entityId: `trend:${seriesItem.entityId}`,
        relatedEntityId: seriesItem.entityId,
        label: seriesItem.label,
        baseLabel: seriesItem.label,
        unit: seriesItem.unit || "",
        pts: seriesItem.trendPts,
        color: hexToRgba(seriesItem.color, trendRenderOptions.colorAlpha),
        axis: seriesItem.axis,
        rawVisible: !hiddenSource,
        showCrosshair: analysis.show_trend_crosshairs === true,
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
      const analysis = analysisMap.get(trend.entityId) || normalizeHistorySeriesAnalysis(null);
      const trendRenderOptions = this._getTrendRenderOptions(
        analysis.trend_method,
        hiddenSourceEntityIds.has(trend.entityId),
      );
      renderer.drawLine(
        trend.trendPts,
        hexToRgba(trend.color, trendRenderOptions.colorAlpha),
        renderT0,
        renderT1,
        trend.axis.min,
        trend.axis.max,
        {
          lineOpacity: comparisonPreviewActive
            ? Math.max(0.25, Math.min(0.9, mainSeriesHoverOpacity + 0.12))
            : trendRenderOptions.lineOpacity,
          lineWidth: trendRenderOptions.lineWidth,
          dashed: trendRenderOptions.dashed,
          dotted: trendRenderOptions.dotted,
        },
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
        },
      );
    }
    for (const seriesItem of visibleSeries) {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (!(analysis.show_delta_analysis === true && hasSelectedComparisonWindow === true)) {
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
        if (analysis.show_delta_tooltip === true) {
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
        if (analysis.show_delta_lines === true) {
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
            },
          );
        }
    }
    summaryHoverSeries.forEach((summarySeries) => {
      const axis = summarySeries.axis;
      if (!axis) {
        return;
      }
      renderer.drawLine(
        [[renderT0, summarySeries.value], [renderT1, summarySeries.value]],
        summarySeries.color,
        renderT0,
        renderT1,
        axis.min,
        axis.max,
        {
          lineOpacity: summarySeries.hoverOpacity,
          lineWidth: summarySeries.summaryType === "mean" ? 1.8 : 1.1,
          dashed: false,
          dotted: summarySeries.summaryType !== "mean",
        },
      );
    });
    thresholdHoverSeries.forEach((thresholdSeries) => {
        const axis = thresholdSeries.axis;
        if (!axis) {
          return;
        }
        const thresholdAnalysis = analysisMap.get(thresholdSeries.relatedEntityId) || normalizeHistorySeriesAnalysis(null);
        if (thresholdAnalysis.show_threshold_shading === true) {
          const relatedSeries = visibleSeries.find((seriesItem) => seriesItem.entityId === thresholdSeries.relatedEntityId);
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
              },
            );
          }
        }
        renderer.drawLine(
          [[renderT0, thresholdSeries.value], [renderT1, thresholdSeries.value]],
          thresholdSeries.color,
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          {
            lineOpacity: thresholdSeries.hoverOpacity,
            lineWidth: 1.15,
          },
        );
      });
    if (anomalySeries.length) {
      const anomalyRegions = [];
      anomalySeries.forEach((seriesItem) => {
        const axis = seriesItem.axis;
        if (!axis) {
          return;
        }
        const visibleAnomalyClusters = this._filterAnnotatedAnomalyClusters(seriesItem, events);
        if (visibleAnomalyClusters.length === 0) {
          return;
        }
        const normalClusters = visibleAnomalyClusters.filter((c) => !c.isOverlap);
        const overlapClusters = visibleAnomalyClusters.filter((c) => c.isOverlap === true);
        const baseColor = hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.96 : 0.86);
        const regionOptions = {
          strokeAlpha: anyHiddenSourceSeries ? 0.98 : 0.9,
          lineWidth: anyHiddenSourceSeries ? 2.5 : 2.1,
          haloWidth: anyHiddenSourceSeries ? 5.5 : 4.8,
          haloColor: "rgba(255,255,255,0.88)",
          haloAlpha: anyHiddenSourceSeries ? 0.92 : 0.82,
          fillColor: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.14 : 0.1),
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
          renderer.drawAnomalyClusters(normalClusters, baseColor, renderT0, renderT1, axis.min, axis.max, regionOptions);
        }
        if (overlapClusters.length > 0) {
          const overlapMode = (analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null)).anomaly_overlap_mode;
          // In "only" mode all shown clusters are already overlaps — draw with base style, no accent
          renderer.drawAnomalyClusters(overlapClusters, baseColor, renderT0, renderT1, axis.min, axis.max, regionOptions);
          if (overlapMode !== "only") {
            renderer.drawAnomalyClusters(overlapClusters, overlapAccentColor, renderT0, renderT1, axis.min, axis.max, overlapOptions);
          }
        }
        const allRegionClusters = [...normalClusters, ...overlapClusters];
        const clusterRegions = renderer.getAnomalyClusterRegions(
          allRegionClusters,
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          regionOptions,
        );
        clusterRegions.forEach((region) => {
          const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
          anomalyRegions.push({
            ...region,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            sensitivity: analysis.anomaly_sensitivity,
          });
        });
      });
      this._lastAnomalyRegions = anomalyRegions;
    } else {
      this._lastAnomalyRegions = [];
    }
    const effectiveComparisonHoverSeries = comparisonHoverSeries.filter((entry) => {
      return !hiddenComparisonEntityIds.has(entry.relatedEntityId || entry.entityId);
    });
    renderer.drawAnnotations(events, renderT0, renderT1, {
      showLines: this._config.show_event_lines !== false,
      showMarkers: this._config.show_event_lines !== false,
    });
    const eventHits = this._drawRecordedEventPoints(
      renderer,
      visibleSeries,
      events,
      renderT0,
      renderT1,
      { showIcons: this._config.show_event_markers !== false },
    );

    this._renderLegend(series, binaryBackgrounds);

    const eventValueMap = new Map(eventHits.map((hit) => [hit.event.id, hit]));
    const enrichedEvents = events.map((event) => {
      const hit = eventValueMap.get(event.id);
      return hit
        ? {
          ...event,
          chart_value: hit.value,
          chart_unit: hit.unit,
        }
        : event;
    });

    if (visibleSeries.length) {
      this._ensureContextAnnotationDialog();
      attachLineChartHover(this, canvas, renderer, hoverSeries, enrichedEvents, renderT0, renderT1, null, null, activeAxes, {
        onContextMenu: (hover) => this._handleChartContextMenu(hover),
        onAddAnnotation: (hover) => this._handleChartAddAnnotation(hover),
        binaryStates: binaryBackgrounds.filter((entry) => !this._hiddenSeries.has(entry.entityId)),
        comparisonSeries: effectiveComparisonHoverSeries,
        trendSeries: trendHoverSeries,
        rateSeries: rateHoverSeries,
        deltaSeries: deltaHoverSeries,
        summarySeries: summaryHoverSeries,
        thresholdSeries: thresholdHoverSeries,
        anomalyRegions: Array.isArray(this._lastAnomalyRegions) ? this._lastAnomalyRegions : [],
        hoverSurfaceEl: this.shadowRoot?.getElementById("chart-icon-overlay"),
        showTooltip: this._config.show_tooltips !== false,
        emphasizeHoverGuides: this._config.emphasize_hover_guides === true,
        showTrendCrosshairs: anyTrendCrosshairs,
        hideRawData: hiddenSourceEntityIds.size === visibleSeries.length && visibleSeries.length > 0,
        showDeltaTooltip: deltaHoverSeries.length > 0,
        onAnomalyClick: (regions) => this._handleAnomalyAddAnnotation(regions),
      });
      attachLineChartRangeZoom(this, canvas, renderer, renderT0, renderT1, {
        onPreview: (range) => this._dispatchZoomPreview(range),
        onZoom: ({ startTime, endTime }) => this._applyZoomRange(startTime, endTime),
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
      this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
      this._chartScrollViewportEl.addEventListener("scroll", this._onChartScroll, { passive: true });
      this._syncChartViewportScroll(t0, t1, w);
    }
  }

  async _handleChartContextMenu(hover) {
    if (!hover || !this._hass || this._annotationDialog?.isOpen()) {
      return;
    }
    this._openContextAnnotationDialog(hover);
  }

  _handleChartAddAnnotation(hover) {
    if (!hover || !this._hass || this._annotationDialog?.isOpen()) {
      return;
    }
    this._openContextAnnotationDialog(hover);
  }

  _handleAnomalyAddAnnotation(regions) {
    const regionsArray = Array.isArray(regions) ? regions : (regions ? [regions] : []);
    if (!regionsArray.length || !this._hass || this._annotationDialog?.isOpen()) {
      return;
    }
    const hover = this._buildAnomalyAnnotationPrefill(regionsArray);
    if (!hover) {
      return;
    }
    this._openContextAnnotationDialog(hover);
  }

  _formatContextDialogDate(timeMs) {
    return this._annotationDialog?.formatDate(timeMs) || "";
  }

  _formatAnomalyPrefillTimestamp(timeMs) {
    if (!Number.isFinite(timeMs)) {
      return "";
    }
    return new Date(timeMs).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _formatAnomalyPrefillValue(value, unit = "") {
    if (!Number.isFinite(value)) {
      return "";
    }
    const numeric = Math.abs(value) >= 100
      ? value.toFixed(1)
      : value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return unit ? `${numeric} ${unit}` : numeric;
  }

  _buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, analysisMap) {
    // Collect cluster time ranges (expanded by data-frequency tolerance) per series.
    const seriesIntervals = [];
    for (const seriesItem of visibleSeries) {
      const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
      if (analysis.show_anomalies !== true) continue;
      const clusters = anomalyClustersMap.get(seriesItem.entityId) || [];
      if (!clusters.length) continue;

      // Compute median sample interval as overlap tolerance.
      const pts = seriesItem.pts;
      let tolerance = 60000; // default: 1 minute
      if (Array.isArray(pts) && pts.length >= 2) {
        const intervals = [];
        for (let i = 1; i < pts.length; i++) {
          const diff = pts[i][0] - pts[i - 1][0];
          if (diff > 0) intervals.push(diff);
        }
        if (intervals.length) {
          intervals.sort((a, b) => a - b);
          const mid = Math.floor(intervals.length / 2);
          tolerance = intervals.length % 2 === 0
            ? (intervals[mid - 1] + intervals[mid]) / 2
            : intervals[mid];
          tolerance = Math.max(tolerance, 1000);
        }
      }

      const entityIntervals = [];
      for (const cluster of clusters) {
        const range = this._getAnomalyClusterTimeRange(cluster);
        if (!range) continue;
        entityIntervals.push({ start: range.startTime - tolerance, end: range.endTime + tolerance });
      }
      if (entityIntervals.length) {
        seriesIntervals.push({ entityId: seriesItem.entityId, intervals: entityIntervals });
      }
    }

    if (seriesIntervals.length < 2) return [];

    // Event-sweep to find time windows covered by ≥2 distinct series.
    const events = [];
    for (const { entityId, intervals } of seriesIntervals) {
      for (const { start, end } of intervals) {
        events.push({ time: start, delta: 1, entityId });
        events.push({ time: end, delta: -1, entityId });
      }
    }
    events.sort((a, b) => a.time - b.time || a.delta - b.delta);

    const activeCounts = new Map(); // entityId -> count of currently-open intervals
    const spans = [];
    let spanStart = null;

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
    if (spanStart !== null) {
      spans.push({ start: spanStart, end: events[events.length - 1].time });
    }

    return spans;
  }

  _getAnomalyClusterTimeRange(cluster) {
    if (!Array.isArray(cluster?.points) || cluster.points.length === 0) {
      return null;
    }
    const startTime = cluster.points[0]?.timeMs;
    const endTime = cluster.points[cluster.points.length - 1]?.timeMs;
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return null;
    }
    return {
      startTime: Math.min(startTime, endTime),
      endTime: Math.max(startTime, endTime),
    };
  }

  _eventMatchesAnomalyCluster(event, relatedEntityId, cluster) {
    if (!event || !relatedEntityId) {
      return false;
    }
    const clusterRange = this._getAnomalyClusterTimeRange(cluster);
    if (!clusterRange) {
      return false;
    }
    const eventEntityIds = Array.isArray(event.entity_ids) ? event.entity_ids.filter(Boolean) : [];
    if (!eventEntityIds.includes(relatedEntityId)) {
      return false;
    }
    const eventTime = new Date(event.timestamp).getTime();
    if (!Number.isFinite(eventTime)) {
      return false;
    }
    return eventTime >= clusterRange.startTime && eventTime <= clusterRange.endTime;
  }

  _filterAnnotatedAnomalyClusters(seriesItem, events) {
    if (!Array.isArray(seriesItem?.anomalyClusters) || seriesItem.anomalyClusters.length === 0) {
      return [];
    }
    const visibleEvents = Array.isArray(events) ? events : [];
    if (visibleEvents.length === 0) {
      return seriesItem.anomalyClusters;
    }
    return seriesItem.anomalyClusters.filter((cluster) => {
      return !visibleEvents.some((event) => {
        return this._eventMatchesAnomalyCluster(event, seriesItem.entityId, cluster);
      });
    });
  }

  _buildAnomalyAnnotationPrefill(regions) {
    const regionsArray = Array.isArray(regions) ? regions : (regions ? [regions] : []);
    const validRegions = regionsArray.filter((r) => r?.cluster?.points?.length > 0);
    if (!validRegions.length) return null;

    // Use first valid region as anchor for timeMs, color, entity
    const primaryRegion = validRegions[0];
    const label = primaryRegion.label || primaryRegion.relatedEntityId || "Series";
    const unit = primaryRegion.unit || "";
    const trackedEntityIds = Array.isArray(this._entityIds) ? this._entityIds.filter(Boolean) : [];
    const linkedEntityIds = [
      primaryRegion.relatedEntityId,
      ...trackedEntityIds.filter((entityId) => entityId && entityId !== primaryRegion.relatedEntityId),
    ].filter((entityId, index, values) => values.indexOf(entityId) === index);

    const ANOMALY_METHOD_LABELS = {
      trend_residual: "Trend deviation",
      rate_of_change: "Sudden change",
      iqr: "Statistical outlier (IQR)",
      rolling_zscore: "Rolling Z-score",
      persistence: "Flat-line / stuck",
      comparison_window: "Comparison window",
    };

    // Build per-method annotation sections
    const annotationSections = validRegions.map((region) => {
      const points = region.cluster.points;
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      const peakPoint = points.reduce((peak, p) => (!peak || Math.abs(p.residual) > Math.abs(peak.residual) ? p : peak), null);
      if (!peakPoint) return null;
      const method = region.cluster.anomalyMethod;
      const methodLabel = ANOMALY_METHOD_LABELS[method] || method || "Anomaly";
      const regionLabel = region.label || region.relatedEntityId || "Series";
      const regionUnit = region.unit || "";

      let description;
      let alertLine;
      if (method === "rate_of_change") {
        const rateUnit = regionUnit ? `${regionUnit}/h` : "units/h";
        description = `${regionLabel} shows an unusual rate of change between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
        alertLine = `Peak rate deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, rateUnit)} from typical ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, rateUnit)}.`;
      } else if (method === "iqr") {
        description = `${regionLabel} contains statistical outliers between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
        alertLine = `Peak value: ${this._formatAnomalyPrefillValue(peakPoint.value, regionUnit)}, deviating ${this._formatAnomalyPrefillValue(Math.abs(peakPoint.residual), regionUnit)} from median.`;
      } else if (method === "rolling_zscore") {
        description = `${regionLabel} shows statistically unusual values between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
        alertLine = `Peak deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} from rolling mean of ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)}.`;
      } else if (method === "persistence") {
        const flatRange = typeof region.cluster.flatRange === "number" ? region.cluster.flatRange : null;
        const rangeStr = flatRange !== null ? ` (range: ${this._formatAnomalyPrefillValue(flatRange, regionUnit)})` : "";
        description = `${regionLabel} appears stuck or flat between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}${rangeStr}.`;
        alertLine = `Value remained near ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)} for an unusually long period.`;
      } else if (method === "comparison_window") {
        description = `${regionLabel} deviates from the comparison window between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
        alertLine = `Peak deviation from comparison: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} at ${this._formatAnomalyPrefillTimestamp(peakPoint.timeMs)}.`;
      } else {
        description = `${regionLabel} deviates from its expected trend between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
        alertLine = `Peak deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} from baseline of ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)} at ${this._formatAnomalyPrefillTimestamp(peakPoint.timeMs)}.`;
      }
      return { methodLabel, description, alertLine, peakPoint };
    }).filter(Boolean);

    if (!annotationSections.length) return null;

    const isSingleRegion = annotationSections.length === 1;
    // Check if the single cluster was confirmed by multiple methods (overlap "only" mode)
    const detectedByMethods = !isSingleRegion ? null
      : (Array.isArray(primaryRegion.cluster?.detectedByMethods) && primaryRegion.cluster.detectedByMethods.length > 1
        ? primaryRegion.cluster.detectedByMethods
        : null);

    let message;
    let annotation;

    if (isSingleRegion) {
      const s = annotationSections[0];
      const peakPoint = s.peakPoint;
      message = `${this._formatAnomalyPrefillValue(peakPoint.residual, unit)} ${s.methodLabel.toLowerCase()} anomaly in ${label}`;
      const lines = [s.description, `Alert: ${s.alertLine}`];
      if (detectedByMethods) {
        lines.push(`Confirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m) => ANOMALY_METHOD_LABELS[m] || m).join(", ")}.`);
      }
      lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c) => c.toUpperCase())}.`);
      annotation = lines.join("\n");
    } else {
      message = `Multi-method anomaly in ${label}`;
      const lines = [];
      annotationSections.forEach((s) => {
        lines.push(`[${s.methodLabel}]`);
        lines.push(s.description);
        lines.push(`Alert: ${s.alertLine}`);
        lines.push("");
      });
      lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c) => c.toUpperCase())}.`);
      annotation = lines.join("\n").trim();
    }

    // Anchor time to the earliest start across all regions
    const allStartPoints = validRegions.map((r) => r.cluster.points[0]?.timeMs).filter(Number.isFinite);
    const timeMs = allStartPoints.length ? Math.min(...allStartPoints) : primaryRegion.cluster.points[0].timeMs;

    return {
      timeMs,
      primary: {
        color: primaryRegion.color || "#03a9f4",
      },
      annotationPrefill: {
        message,
        annotation,
        icon: "mdi:alert-outline",
        color: primaryRegion.color || "#03a9f4",
        linkedTarget: {
          entity_id: linkedEntityIds,
        },
      },
    };
  }

  _ensureContextAnnotationDialog() {
    this._annotationDialog?.ensureDialog();
  }

  _teardownContextAnnotationDialog() {
    this._annotationDialog?.teardown();
  }

  _cleanupContextAnnotationForm() {
    this._annotationDialog?.resetFormState();
  }

  _finalizeContextAnnotationDialogClose() {
    this._annotationDialog?.finalizeClose();
  }

  _renderContextAnnotationTargetChips(target) {
    return this._annotationDialog?.renderTargetChips(target) || "";
  }

  _normalizeTargetSelection(target) {
    return normalizeTargetSelection(target);
  }

  _mergeTargetSelections(...targets) {
    return mergeTargetSelections(...targets);
  }

  _removeContextDialogLinkedTarget(type, id) {
    this._annotationDialog?.removeLinkedTarget(type, id);
  }

  _bindContextAnnotationTargetChipActions() {
    this._annotationDialog?.bindTargetChipActions();
  }

  _bindContextAnnotationDialogFields(hover) {
    this._annotationDialog?.bindFields(hover);
  }

  async _submitContextAnnotationDialog() {
    return this._annotationDialog?.submit();
  }

  _openContextAnnotationDialog(hover) {
    this._annotationDialog?.open(hover);
  }

  _closeContextAnnotationDialog() {
    this._annotationDialog?.close();
  }

  _getScrollViewportRange(t0 = this._lastT0, t1 = this._lastT1) {
    if (!this._chartScrollViewportEl || !this._chartStageEl || t0 == null || t1 == null) {
      return null;
    }
    const viewportWidth = this._chartScrollViewportEl.clientWidth;
    const contentWidth = this._chartStageEl.clientWidth;
    if (!viewportWidth || !contentWidth) {
      return null;
    }
    const totalMs = Math.max(1, t1 - t0);
    const visibleSpanMs = totalMs * Math.min(1, viewportWidth / contentWidth);
    const maxScrollLeft = Math.max(0, contentWidth - viewportWidth);
    const maxStartOffsetMs = Math.max(0, totalMs - visibleSpanMs);
    const ratio = maxScrollLeft > 0
      ? clampChartValue(this._chartScrollViewportEl.scrollLeft / maxScrollLeft, 0, 1)
      : 0;
    const start = t0 + (ratio * maxStartOffsetMs);
    return {
      start,
      end: start + visibleSpanMs,
      span: visibleSpanMs,
      maxScrollLeft,
    };
  }

  _syncChartViewportScroll(t0, t1, contentWidth) {
    if (!this._chartScrollViewportEl || !this._zoomRange) {
      return;
    }
    this._chartStageEl = this.shadowRoot.getElementById("chart-stage");
    const viewportWidth = this._chartScrollViewportEl.clientWidth;
    const totalMs = Math.max(1, t1 - t0);
    const visibleSpanMs = totalMs * Math.min(1, viewportWidth / Math.max(contentWidth, viewportWidth));
    const maxScrollLeft = Math.max(0, Math.max(contentWidth, viewportWidth) - viewportWidth);
    const maxStartOffsetMs = Math.max(0, totalMs - visibleSpanMs);
    const clampedStart = clampChartValue(this._zoomRange.start, t0, t1 - visibleSpanMs);
    const ratio = maxStartOffsetMs > 0 ? (clampedStart - t0) / maxStartOffsetMs : 0;
    const nextLeft = ratio * maxScrollLeft;
    this._scrollSyncSuspended = true;
    this._lastProgrammaticScrollLeft = nextLeft;
    this._ignoreNextProgrammaticScrollEvent = true;
    this._chartScrollViewportEl.scrollLeft = nextLeft;
    window.requestAnimationFrame(() => {
      this._scrollSyncSuspended = false;
    });
  }

  _handleChartScroll() {
    if (this._scrollSyncSuspended || !this._zoomRange) {
      return;
    }
    if (this._ignoreNextProgrammaticScrollEvent) {
      this._ignoreNextProgrammaticScrollEvent = false;
      this._lastProgrammaticScrollLeft = null;
      return;
    }
    if (
      this._lastProgrammaticScrollLeft != null
      && Math.abs((this._chartScrollViewportEl?.scrollLeft || 0) - this._lastProgrammaticScrollLeft) < 1
    ) {
      this._lastProgrammaticScrollLeft = null;
      return;
    }
    this._lastProgrammaticScrollLeft = null;
    const nextRange = this._getScrollViewportRange();
    if (!nextRange) {
      return;
    }
    if (
      this._zoomRange.start === nextRange.start
      && this._zoomRange.end === nextRange.end
    ) {
      return;
    }
    this._zoomRange = { start: nextRange.start, end: nextRange.end };
    this._dispatchZoomRange("scroll");
  }

  _applyZoomRange(startTime, endTime) {
    const start = Math.min(startTime, endTime);
    const end = Math.max(startTime, endTime);
    if (!(start < end)) {
      return;
    }
    this._zoomRange = { start, end };
    this._dispatchZoomRange("select");
    if (this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
    }
  }

  _clearZoomRange() {
    if (!this._zoomRange) {
      return;
    }
    this._zoomRange = null;
    this._dispatchZoomRange("reset");
    if (this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
    }
  }

  setExternalZoomRange(range) {
    const nextRange = range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.start < range.end
      ? {
        start: Math.min(range.start, range.end),
        end: Math.max(range.start, range.end),
      }
      : null;
    const current = this._zoomRange;
    if (
      current?.start === nextRange?.start
      && current?.end === nextRange?.end
    ) {
      return;
    }
    this._zoomRange = nextRange;
    if (this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
    }
  }

  _dispatchZoomRange(source = "select") {
    this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom", {
      bubbles: true,
      composed: true,
      detail: this._zoomRange
        ? { startTime: this._zoomRange.start, endTime: this._zoomRange.end, preview: false, source }
        : { startTime: null, endTime: null, preview: false, source },
    }));
  }

  _dispatchZoomPreview(range) {
    this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom", {
      bubbles: true,
      composed: true,
      detail: range
        ? { startTime: range.startTime, endTime: range.endTime, preview: true }
        : { startTime: null, endTime: null, preview: true },
    }));
  }

  _handleWindowKeyDown(ev) {
    if (ev.key !== "Escape") {
      return;
    }
    if (this._annotationDialog?.isOpen()) {
      ev.preventDefault();
      this._closeContextAnnotationDialog();
      return;
    }
    if (!this._zoomRange) {
      return;
    }
    ev.preventDefault();
    this._clearZoomRange();
  }

  _navigateToEventHistory(event) {
    if (!event) {
      return;
    }
    navigateToDataPointsHistory(this, {
      entity_id: event.entity_ids || [],
      device_id: event.device_ids || [],
      area_id: event.area_ids || [],
      label_id: event.label_ids || [],
    }, {
      start_time: this._config?.start_time || null,
      end_time: this._config?.end_time || null,
      zoom_start_time: this._config?.zoom_start_time || null,
      zoom_end_time: this._config?.zoom_end_time || null,
      datapoint_scope: this._config?.datapoint_scope,
    });
  }

  _drawRecordedEventPoints(renderer, series, events, t0, t1, options = {}) {
    const overlay = this.shadowRoot?.getElementById("chart-icon-overlay");
    if (overlay && !options.skipOverlayClear) {
      overlay.innerHTML = "";
    }
    if (!renderer || !events?.length) {
      return [];
    }
    const yOffset = Number.isFinite(options.yOffset) ? options.yOffset : 0;
    const hits = [];
    const { ctx } = renderer;
    const showIcons = options.showIcons !== false;

    for (const event of events) {
      const timestamp = new Date(event.timestamp).getTime();
      if (timestamp < t0 || timestamp > t1) continue;

      const eventEntityIds = Array.isArray(event.entity_ids) ? event.entity_ids : [];
      const x = renderer.xOf(timestamp, t0, t1);
      const findSeriesWithValue = (candidates) => {
        for (const candidate of candidates) {
          if (!candidate?.pts?.length || !candidate.axis) {
            continue;
          }
          const candidateValue = renderer._interpolateValue(candidate.pts, timestamp);
          if (candidateValue == null) {
            continue;
          }
          return {
            series: candidate,
            value: candidateValue,
          };
        }
        return null;
      };

      const matchingSeriesCandidates = eventEntityIds
        .map((entityId) => series.find((entry) => entry.entityId === entityId))
        .filter(Boolean);
      const matchingSeriesHit = findSeriesWithValue(matchingSeriesCandidates);
      const fallbackSeriesHit = matchingSeriesHit || findSeriesWithValue([...series].reverse());
      const targetSeries = fallbackSeriesHit?.series || null;
      const hasNumericTarget = !!(targetSeries?.pts?.length && targetSeries.axis);
      const value = hasNumericTarget ? fallbackSeriesHit?.value ?? null : null;
      if (hasNumericTarget && value == null) continue;
      const y = hasNumericTarget
        ? renderer.yOf(value, targetSeries.axis.min, targetSeries.axis.max)
        : renderer.pad.top + 12;
      const color = event.color || targetSeries.color || "#03a9f4";
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

      if (overlay && showIcons) {
        const iconEl = document.createElement("button");
        iconEl.type = "button";
        iconEl.className = "chart-event-icon";
        iconEl.style.left = `${x}px`;
        iconEl.style.top = `${y + yOffset}px`;
        iconEl.title = event.message || "Open related history";
        iconEl.setAttribute("aria-label", event.message || "Open related history");
        iconEl.innerHTML = `<ha-icon icon="${esc(event.icon || "mdi:bookmark")}" style="color:${contrastColor(color)}"></ha-icon>`;
        iconEl.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this._navigateToEventHistory(event);
        });
        overlay.appendChild(iconEl);
      } else if (overlay) {
        const hitEl = document.createElement("button");
        hitEl.type = "button";
        hitEl.className = "chart-event-icon";
        hitEl.style.left = `${x}px`;
        hitEl.style.top = `${y + yOffset}px`;
        hitEl.title = event.message || "Open related history";
        hitEl.setAttribute("aria-label", event.message || "Open related history");
        hitEl.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this._navigateToEventHistory(event);
        });
        overlay.appendChild(hitEl);
      }

      hits.push({
        event,
        entityId: targetSeries?.entityId || null,
        unit: targetSeries?.unit || "",
        value,
        x,
        y,
      });
    }

    return hits;
  }

  _buildBinaryStateSpans(stateList, t0, t1) {
    if (!Array.isArray(stateList) || !stateList.length) {
      return [];
    }
    const spans = [];
    for (let i = 0; i < stateList.length; i++) {
      const current = stateList[i];
      const currentTime = Math.round((current?.lu || 0) * 1000);
      const next = stateList[i + 1];
      const nextTime = next ? Math.round((next.lu || 0) * 1000) : t1;
      if (!this._isBinaryOnState(current?.s)) continue;
      spans.push({
        start: Math.max(t0, currentTime),
        end: Math.max(Math.max(t0, currentTime), Math.min(t1, nextTime)),
      });
    }
    return spans.filter((span) => span.start < span.end);
  }

  _isBinaryOnState(state) {
    return String(state).toLowerCase() === "on";
  }

  _renderSplitAxisOverlays(tracks) {
    const leftEl = this.shadowRoot?.getElementById("chart-axis-left");
    const rightEl = this.shadowRoot?.getElementById("chart-axis-right");
    if (!leftEl || !rightEl || !tracks.length) {
      return;
    }

    // All split rows have exactly one left axis (slot 0), so every renderer shares
    // the same pad.left. Use the first as the reference for sizing.
    const primaryRenderer = tracks[0].renderer;
    const leftWidth = Math.max(0, primaryRenderer.pad.left);

    leftEl.style.width = `${leftWidth}px`;
    rightEl.style.width = "0px";

    const chartWrap = this.shadowRoot?.querySelector(".chart-wrap");
    if (chartWrap) {
      chartWrap.style.setProperty("--dp-chart-axis-left-width", `${leftWidth}px`);
      chartWrap.style.setProperty("--dp-chart-axis-right-width", "0px");
    }

    // Offset from the right edge of the overlay for slot-0 labels (mirrors
    // the logic in renderChartAxisOverlays: 10 + slot * AXIS_SLOT_WIDTH).
    const labelRight = 10;

    let labelsHtml = "";
    for (const { renderer, axis, rowOffset } of tracks) {
      if (!axis?.ticks?.length) {
        continue;
      }
      for (const tick of axis.ticks) {
        const y = rowOffset + renderer.yOf(tick, axis.min, axis.max);
        const formatted = renderer._formatAxisTick(tick, axis.unit);
        labelsHtml += `<div class="chart-axis-label" style="top:${Math.round(y) + 1}px;right:${labelRight}px;text-align:right;">${esc(formatted)}</div>`;
      }
      if (axis.unit) {
        const unitY = rowOffset + Math.max(0, renderer.pad.top - 18);
        labelsHtml += `<div class="chart-axis-unit" style="top:${unitY}px;right:${labelRight}px;text-align:right;">${esc(axis.unit)}</div>`;
      }
    }

    leftEl.innerHTML = `<div class="chart-axis-divider"></div>${labelsHtml}`;
    leftEl.classList.add("visible");
    rightEl.innerHTML = "";
    rightEl.classList.remove("visible");
  }

  _renderLegend(series, binaryBackgrounds) {
    const legendEl = this.shadowRoot?.getElementById("legend");
    if (!legendEl) {
      return;
    }
    legendEl.innerHTML =
      series.map((s) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc(s.legendEntityId || s.entityId)}"
          aria-pressed="${this._hiddenSeries.has(s.legendEntityId || s.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(s.legendEntityId || s.entityId) ? "Show" : "Hide"} ${esc(s.label)}"
        >
          <div class="legend-line" style="background:${esc(s.color)}"></div>
          ${esc(s.label)}${s.unit ? ` (${esc(s.unit)})` : ""}
        </button>`
      ).join("") +
      binaryBackgrounds.map((bg) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc(bg.entityId)}"
          aria-pressed="${this._hiddenSeries.has(bg.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(bg.entityId) ? "Show" : "Hide"} ${esc(bg.label)} ${esc(this._binaryOnLabel(bg.entityId))}"
        >
          <div class="legend-line" style="background:${esc(bg.color)};opacity:0.35"></div>
          ${esc(bg.label)} (${esc(this._binaryOnLabel(bg.entityId))})
        </button>`).join("");
    this._updateLegendLayout(legendEl);
    legendEl.querySelectorAll("[data-entity-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const entityId = button.dataset.entityId;
        if (!entityId) {
          return;
        }
        this._toggleSeriesVisibility(entityId);
      });
    });
  }

  _toggleSeriesVisibility(entityId) {
    let visible;
    if (this._hiddenSeries.has(entityId)) {
      this._hiddenSeries.delete(entityId);
      visible = true;
    } else {
      this._hiddenSeries.add(entityId);
      visible = false;
    }
    this.dispatchEvent(new CustomEvent("hass-datapoints-toggle-series-visibility", {
      detail: { entityId, visible },
      bubbles: true,
      composed: true,
    }));
    if (this._lastHistResult && this._lastEvents) {
      this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
    }
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-history-card-editor");
  }

  static getStubConfig() {
    return { title: "History with Events", entity: "sensor.example", hours_to_show: 24 };
  }
}
