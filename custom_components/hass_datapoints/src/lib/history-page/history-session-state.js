import { DOMAIN } from "../../constants.js";
import { normalizeDateWindows } from "./history-url-state.js";

/**
 * Session and preference ownership helpers for the history page.
 */

export const PANEL_HISTORY_PREFERENCES_KEY = `${DOMAIN}:panel_history_preferences`;
export const PANEL_HISTORY_SESSION_KEY = `${DOMAIN}:panel_history_session`;

export function readHistoryPageSessionState() {
  try {
    const raw = window.sessionStorage?.getItem(PANEL_HISTORY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_err) {
    return null;
  }
}

export function buildHistoryPageSessionState(source) {
  return {
    entities: source._entities,
    series_rows: source._seriesRows,
    target_selection: source._targetSelection,
    target_selection_raw: source._targetSelectionRaw,
    datapoint_scope: source._datapointScope,
    show_chart_datapoint_icons: source._showChartDatapointIcons,
    show_chart_datapoint_lines: source._showChartDatapointLines,
    show_chart_tooltips: source._showChartTooltips,
    show_chart_emphasized_hover_guides: source._showChartEmphasizedHoverGuides,
    delink_chart_y_axis: source._delinkChartYAxis,
    split_chart_view: source._splitChartView,
    show_chart_trend_lines: false,
    show_chart_summary_stats: false,
    show_chart_rate_of_change: false,
    show_chart_threshold_analysis: false,
    show_chart_threshold_shading: false,
    show_chart_anomalies: false,
    chart_anomaly_method: "trend_residual",
    chart_anomaly_rate_window: "1h",
    chart_anomaly_zscore_window: "24h",
    chart_anomaly_persistence_window: "1h",
    chart_anomaly_comparison_window_id: null,
    hide_chart_source_series: false,
    show_chart_trend_crosshairs: false,
    chart_trend_method: "rolling_average",
    chart_trend_window: "24h",
    chart_rate_window: "1h",
    chart_anomaly_sensitivity: "medium",
    chart_threshold_values: {},
    chart_threshold_directions: {},
    show_chart_delta_analysis: false,
    show_chart_delta_tooltip: true,
    show_chart_delta_lines: false,
    show_chart_correlated_anomalies: source._showCorrelatedAnomalies,
    chart_anomaly_overlap_mode: source._chartAnomalyOverlapMode || "all",
    show_data_gaps: source._showDataGaps,
    data_gap_threshold: source._dataGapThreshold,
    content_split_ratio: source._contentSplitRatio,
    start_time: source._startTime?.toISOString() || null,
    end_time: source._endTime?.toISOString() || null,
    zoom_start_time: source._chartZoomCommittedRange
      ? new Date(source._chartZoomCommittedRange.start).toISOString()
      : null,
    zoom_end_time: source._chartZoomCommittedRange
      ? new Date(source._chartZoomCommittedRange.end).toISOString()
      : null,
    date_windows: normalizeDateWindows(source._comparisonWindows),
    hours: source._hours,
    sidebar_collapsed: source._sidebarCollapsed,
    sidebar_accordion_targets_open: source._sidebarAccordionTargetsOpen !== false,
    sidebar_accordion_datapoints_open: source._sidebarAccordionDatapointsOpen !== false,
    sidebar_accordion_analysis_open: source._sidebarAccordionAnalysisOpen !== false,
    sidebar_accordion_chart_open: source._sidebarAccordionChartOpen !== false,
  };
}

export function writeHistoryPageSessionState(source) {
  try {
    window.sessionStorage?.setItem(PANEL_HISTORY_SESSION_KEY, JSON.stringify(buildHistoryPageSessionState(source)));
  } catch (_err) {
    // Ignore session storage failures.
  }
}

export function normalizeHistoryPagePreferences(preferences, options = {}) {
  const zoomValues = new Set((options.zoomOptions || []).map((option) => option.value));
  const snapValues = new Set((options.snapOptions || []).map((option) => option.value));
  let shouldPersistDefaults = false;

  const normalized = {
    zoomLevel: "auto",
    dateSnapping: "hour",
    preferredSeriesColors: {},
    comparisonWindows: [],
    shouldPersistDefaults,
  };

  if (preferences && typeof preferences === "object") {
    if (zoomValues.has(preferences.zoom_level)) {
      normalized.zoomLevel = preferences.zoom_level;
    } else {
      shouldPersistDefaults = true;
    }

    if (snapValues.has(preferences.date_snapping)) {
      normalized.dateSnapping = preferences.date_snapping;
    } else {
      shouldPersistDefaults = true;
    }

    normalized.preferredSeriesColors = preferences.series_colors && typeof preferences.series_colors === "object"
      ? Object.entries(preferences.series_colors).reduce((acc, [entityId, color]) => {
        if (typeof entityId === "string" && /^#[0-9a-f]{6}$/i.test(color || "")) {
          acc[entityId] = color;
        }
        return acc;
      }, {})
      : {};

    normalized.comparisonWindows = normalizeDateWindows(preferences.date_windows);
  } else {
    shouldPersistDefaults = true;
  }

  normalized.shouldPersistDefaults = shouldPersistDefaults;
  return normalized;
}

export function buildHistoryPagePreferencesPayload(source) {
  const preferredSeriesColors = source._seriesRows.reduce((acc, row) => {
    if (row?.entity_id && /^#[0-9a-f]{6}$/i.test(row?.color || "")) {
      acc[row.entity_id] = row.color;
    }
    return acc;
  }, { ...source._preferredSeriesColors });

  return {
    zoom_level: source._zoomLevel,
    date_snapping: source._dateSnapping,
    series_colors: preferredSeriesColors,
    date_windows: normalizeDateWindows(source._comparisonWindows),
  };
}
