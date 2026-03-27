import { COLORS } from "../../constants.js";
import { normalizeEntityIds } from "./target-selection.js";

/**
 * Pure history-series state helpers.
 */

export function normalizeHistorySeriesAnalysis(analysis) {
  const source = analysis && typeof analysis === "object" ? analysis : {};
  return {
    expanded: source.expanded === true,
    show_trend_lines: source.show_trend_lines === true,
    trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",
    trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",
    show_trend_crosshairs: source.show_trend_crosshairs === true,
    show_summary_stats: source.show_summary_stats === true,
    show_rate_of_change: source.show_rate_of_change === true,
    rate_window: typeof source.rate_window === "string" && source.rate_window ? source.rate_window : "1h",
    show_threshold_analysis: source.show_threshold_analysis === true,
    show_threshold_shading: source.show_threshold_shading === true,
    threshold_value: typeof source.threshold_value === "string" || typeof source.threshold_value === "number"
      ? String(source.threshold_value).trim()
      : "",
    threshold_direction: source.threshold_direction === "below" ? "below" : "above",
    show_anomalies: source.show_anomalies === true,
    anomaly_methods: (() => {
      const VALID = ["trend_residual", "rate_of_change", "iqr", "rolling_zscore", "persistence", "comparison_window"];
      if (Array.isArray(source.anomaly_methods)) {
        // Explicit array provided (even empty) — preserve it as-is after filtering invalid entries.
        return source.anomaly_methods.filter((m) => VALID.includes(m));
      }
      // Migrate from legacy anomaly_method scalar; no array present at all.
      const legacy = VALID.includes(source.anomaly_method) ? source.anomaly_method : null;
      return legacy ? [legacy] : [];
    })(),
    anomaly_overlap_mode: ["all", "highlight", "only"].includes(source.anomaly_overlap_mode) ? source.anomaly_overlap_mode : "all",
    anomaly_sensitivity: typeof source.anomaly_sensitivity === "string" && source.anomaly_sensitivity
      ? source.anomaly_sensitivity
      : "medium",
    anomaly_rate_window: typeof source.anomaly_rate_window === "string" && source.anomaly_rate_window
      ? source.anomaly_rate_window
      : "1h",
    anomaly_zscore_window: typeof source.anomaly_zscore_window === "string" && source.anomaly_zscore_window
      ? source.anomaly_zscore_window
      : "24h",
    anomaly_persistence_window: typeof source.anomaly_persistence_window === "string" && source.anomaly_persistence_window
      ? source.anomaly_persistence_window
      : "1h",
    anomaly_comparison_window_id: typeof source.anomaly_comparison_window_id === "string" && source.anomaly_comparison_window_id
      ? source.anomaly_comparison_window_id
      : null,
    show_delta_analysis: source.show_delta_analysis === true,
    show_delta_tooltip: source.show_delta_tooltip !== false,
    show_delta_lines: source.show_delta_lines === true,
    hide_source_series: source.hide_source_series === true,
  };
}

export function historySeriesRowHasConfiguredAnalysis(row) {
  const analysis = normalizeHistorySeriesAnalysis(row?.analysis);
  return (
    analysis.show_trend_lines
    || analysis.show_summary_stats
    || analysis.show_rate_of_change
    || analysis.show_threshold_analysis
    || analysis.show_anomalies
    || analysis.show_delta_analysis
    || analysis.hide_source_series
  );
}

export function normalizeHistorySeriesRows(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  const normalized = [];
  rows.forEach((row, index) => {
    const entityId = typeof row?.entity_id === "string" ? row.entity_id.trim() : "";
    if (!entityId || seen.has(entityId)) return;
    seen.add(entityId);
    normalized.push({
      entity_id: entityId,
      color: typeof row?.color === "string" && /^#[0-9a-f]{6}$/i.test(row.color)
        ? row.color
        : COLORS[index % COLORS.length],
      visible: row?.visible !== false,
      analysis: normalizeHistorySeriesAnalysis(row?.analysis),
    });
  });
  return normalized;
}

export function buildHistorySeriesRows(entityIds, previousRows = []) {
  const previousMap = new Map(normalizeHistorySeriesRows(previousRows).map((row) => [row.entity_id, row]));
  return normalizeEntityIds(entityIds).map((entityId, index) => {
    const existing = previousMap.get(entityId);
    if (existing) return existing;
    return {
      entity_id: entityId,
      color: COLORS[index % COLORS.length],
      visible: true,
      analysis: normalizeHistorySeriesAnalysis(null),
    };
  });
}

export function slugifySeriesName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseSeriesColorsParam(value) {
  if (!value || typeof value !== "string") return {};
  return value.split(",").reduce((acc, entry) => {
    const [rawKey, rawColor] = entry.split(":");
    const key = decodeURIComponent(rawKey || "").trim();
    const color = String(rawColor || "").trim();
    if (!key || !/^#[0-9a-f]{6}$/i.test(color)) return acc;
    acc[key] = color;
    return acc;
  }, {});
}
