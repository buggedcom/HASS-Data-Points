import {
  addUnit,
  COLORS,
  buildHistoryPagePreferencesPayload,
  buildHistorySeriesRows,
  clampNumber,
  confirmDestructiveAction,
  contrastColor,
  DOMAIN,
  DAY_MS,
  downloadHistorySpreadsheet,
  ensureHaComponents,
  endOfUnit,
  entityName,
  esc,
  extractRangeValue,
  fetchEventBounds,
  fetchEvents,
  fetchUserData,
  formatContextLabel,
  formatPeriodSelectionLabel,
  formatRangeDateTime,
  formatRangeSummary,
  formatScaleLabel,
  historySeriesRowHasConfiguredAnalysis,
  makeDateWindowId,
  normalizeDateWindows,
  normalizeEntityIds,
  normalizeHistoryPagePreferences,
  normalizeHistorySeriesAnalysis,
  normalizeHistorySeriesRows,
  normalizeTargetValue,
  panelConfigTarget,
  parseDateValue,
  parseDateWindowsParam,
  parseSeriesColorsParam,
  RANGE_AUTO_ZOOM_DEBOUNCE_MS,
  RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO,
  RANGE_CONTEXT_LABEL_MIN_GAP_PX,
  RANGE_FUTURE_BUFFER_YEARS,
  RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX,
  RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
  RANGE_LABEL_MIN_GAP_PX,
  RANGE_SLIDER_MIN_SPAN_MS,
  RANGE_SLIDER_WINDOW_MS,
  RANGE_SNAP_OPTIONS,
  RANGE_ZOOM_CONFIGS,
  RANGE_ZOOM_OPTIONS,
  readHistoryPageSessionState,
  resolveEntityIdsFromTarget,
  saveUserData,
  SECOND_MS,
  serializeDateWindowsParam,
  snapDateToUnit,
  startOfUnit,
  slugifySeriesName,
  writeHistoryPageSessionState,
  HOUR_MS,
  MINUTE_MS,
  PANEL_HISTORY_PREFERENCES_KEY,
  WEEK_MS,
} from "@/lib/shared";

import "@/molecules/dp-target-row/dp-target-row";
import "@/molecules/dp-target-row-list/dp-target-row-list";
import "@/molecules/dp-sidebar-options/dp-sidebar-options";
import "@/molecules/dp-comparison-tab-rail/dp-comparison-tab-rail";
import "@/molecules/dp-date-window-dialog/dp-date-window-dialog";
import "@/molecules/dp-floating-menu/dp-floating-menu";
import "@/atoms/interactive/dp-page-menu-item/dp-page-menu-item";
import "@/molecules/dp-panel-timeline/dp-panel-timeline";

const DATA_GAP_THRESHOLD_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_TREND_METHOD_OPTIONS = [
  { value: "rolling_average", label: "Rolling average" },
  { value: "linear_trend", label: "Linear trend" },
];

const ANALYSIS_TREND_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "21d", label: "21 days" },
  { value: "28d", label: "28 days" },
];

const ANALYSIS_RATE_WINDOW_OPTIONS = [
  { value: "point_to_point", label: "Point to point" },
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const ANALYSIS_ANOMALY_METHOD_OPTIONS = [
  { value: "trend_residual", label: "Trend deviation", help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline." },
  { value: "rate_of_change", label: "Sudden change", help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions." },
  { value: "iqr", label: "Statistical outlier (IQR)", help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages." },
  { value: "rolling_zscore", label: "Rolling Z-score", help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series." },
  { value: "persistence", label: "Flat-line / stuck value", help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings." },
  { value: "comparison_window", label: "Comparison window deviation", help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year." },
];

const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

function isAnalysisSupportedForRow(row) {
  return typeof row?.entity_id === "string" && !row.entity_id.startsWith("binary_sensor.");
}

function hasActiveSeriesAnalysis(analysis, hasSelectedComparisonWindow = false) {
  return (
    analysis.show_trend_lines
    || analysis.show_summary_stats
    || analysis.show_rate_of_change
    || analysis.show_threshold_analysis
    || analysis.show_anomalies
    || (analysis.show_delta_analysis && hasSelectedComparisonWindow)
  );
}

/**
 * hass-datapoints-history-panel – Sidebar panel for annotated history exploration.
 */

const PANEL_HISTORY_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    --ha-tooltip-background-color: color-mix(in srgb, #0f1218 96%, transparent);
    --ha-tooltip-text-color: rgba(255, 255, 255, 0.96);
    --ha-tooltip-padding: var(--dp-spacing-md) calc(var(--dp-spacing-md) + 10px);
    --ha-tooltip-border-radius: 10px;
    --ha-tooltip-arrow-size: 10px;
    --ha-tooltip-font-size: 0.86rem;
    --ha-tooltip-line-height: 1.1;
  }

  ha-tooltip::part(base__arrow) {
    z-index: -1;
  }

  ha-tooltip::part(body) {
    padding: var(--dp-spacing-md);
  }

  ha-top-app-bar-fixed {
    display: block;
    height: 100%;
    min-height: 100%;
    overflow: visible;
    --app-header-background-color: var(--card-background-color, var(--primary-background-color));
    --app-header-text-color: var(--primary-text-color);
  }

  ha-top-app-bar-fixed:not(:defined) {
    display: grid;
    min-height: 100%;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto 1fr;
    align-items: center;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="navigationIcon"] {
    grid-column: 1;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="title"] {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    padding: 0 var(--dp-spacing-lg);
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 64px;
    color: var(--app-header-text-color, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="actionItems"] {
    grid-column: 3;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > .controls-section {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  ha-top-app-bar-fixed:not(:defined) > .page-content {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  ha-menu-button:not(:defined),
  ha-icon-button:not(:defined) {
    display: block;
    width: 48px;
    height: 48px;
  }

  .controls-section {
    position: relative;
    overflow: visible;
    z-index: 1;
    background: var(--app-header-background-color, var(--card-background-color, var(--primary-background-color)));
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    box-sizing: border-box;
    padding: var(--dp-spacing-md) var(--dp-spacing-md) var(--dp-spacing-md) 0;
  }

  .page-header-actions {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 48px;
    z-index: 40;
  }

  .page-menu-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    z-index: 40;
  }

  .page-menu-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .page-menu-button:hover,
  .page-menu-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .page-menu {
    position: fixed;
    top: var(--page-menu-top, 56px);
    left: var(--page-menu-left, 0px);
    z-index: 9999;
    min-width: 220px;
    padding: var(--dp-spacing-xs);
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .page-menu[hidden] {
    display: none;
  }

  .page-menu-item {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .page-menu-item:hover,
  .page-menu-item:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .page-menu-item ha-icon {
    --mdc-icon-size: 18px;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }

  .controls-grid {
    display: block;
    width: 100%;
    overflow: visible;
    position: relative;
    z-index: 20;
  }

  .page-content {
    position: relative;
    z-index: 0;
    height: var(--history-page-content-height, 100%);
    min-height: 0;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
    align-items: stretch;
    padding: 0;
    transition: grid-template-columns 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-content.sidebar-collapsed {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .page-sidebar {
    position: relative;
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--dp-spacing-lg);
    border-right: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    overflow-y: auto;
    transition: padding 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-sidebar.collapsed {
    padding: 0;
  }

  .page-sidebar.collapsed .sidebar-toggle-button {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .sidebar-toggle-button {
    position: absolute;
    top: var(--dp-spacing-xs);
    right: calc(var(--dp-spacing-sm) / 2);
    width: 48px;
    height: 48px;
    padding: 0;
    margin: 0;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
    z-index: 2;
  }

  .sidebar-toggle-button:hover,
  .sidebar-toggle-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .sidebar-toggle-button ha-icon {
    display: block;
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-sidebar.collapsed .sidebar-toggle-button ha-icon {
    transform: rotate(180deg);
  }

  .content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, var(--content-top-size, 44%)) 24px minmax(240px, 1fr);
    min-width: 0;
    min-height: 0;
    height: 100%;
    align-self: stretch;
    box-sizing: border-box;
    overflow: hidden;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-lg);
  }

  .content.datapoints-hidden {
    grid-template-rows: minmax(280px, 1fr) 0 0;
    gap: 0;
  }

  .content.datapoints-hidden .content-splitter,
  .content.datapoints-hidden .list-host {
    display: none;
  }

  .control-target {
    width: 100%;
    max-width: none;
    min-width: 0;
    box-sizing: border-box;
  }

  .history-targets {
    display: grid;
    gap: var(--dp-spacing-md);
  }

  .sidebar-section-header {
    display: grid;
    gap: var(--dp-spacing-xs);
  }

  .sidebar-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .sidebar-section-subtitle {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }

  .history-target-picker-slot {
    min-width: 0;
    margin-top: 0;
    margin-bottom: calc(var(--spacing, 8px) * 2);
    margin-top: calc(var(--ha-space-3) * -1);
  }

  .history-targets-collapsed-summary {
    display: none;
    grid-auto-rows: max-content;
    gap: var(--dp-spacing-sm);
    justify-items: center;
    padding-top: calc(var(--spacing, 8px) * 7);
  }

  .history-targets-collapsed-empty {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
  }

  .history-targets-collapsed-item {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: 0;
    margin: 0;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
    color: var(--secondary-text-color);
    --mdc-icon-size: 18px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .history-targets-collapsed-item:hover,
  .history-targets-collapsed-item:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    outline: none;
  }

  .history-targets-collapsed-item.is-hidden {
    opacity: 0.55;
  }

  .history-targets-collapsed-item::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 3px var(--row-color, transparent);
    pointer-events: none;
  }

  .history-targets-collapsed-item ha-state-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin: 0;
  }

  /* ── Collapsed-sidebar target popup ──────────────────────────────────── */

  .collapsed-target-popup {
    position: fixed;
    z-index: 9;
    width: 300px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .collapsed-target-popup[hidden] {
    display: none;
  }

  /* Row inside popup: remove card styling (popup is the card) and collapse the drag-handle column */
  .collapsed-target-popup .history-target-row {
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
    grid-template-columns: 0 minmax(0, 1fr) auto;
  }

  .collapsed-target-popup .history-target-row:hover {
    border-color: transparent;
    background: transparent;
  }

  .history-target-empty {
    padding: var(--dp-spacing-md) var(--dp-spacing-sm);
    border-radius: 12px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
    color: var(--secondary-text-color);
    font-size: 0.84rem;
  }

  .history-target-table {
    display: grid;
  }

  .history-target-table-body {
    display: grid;
    gap: calc(var(--spacing, 8px) * 1.25);
  }

  .history-target-row {
    display: grid;
    position: relative;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "handle name actions"
      ". analysis analysis";
    gap: var(--dp-spacing-sm);
    align-items: center;
    margin: 0;
    padding: calc(var(--spacing, 8px) * 1.125) calc(var(--spacing, 8px) * 1.25);
    border-radius: 16px;
    background: var(--card-background-color, #fff);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    transition: border-color 140ms ease, background-color 140ms ease;
    padding-bottom: 0;
    padding-left: 3px;
  }
  
  .history-target-row.analysis-open {
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
  }

  .history-target-row.is-hidden {
    opacity: 0.62;
  }

  .history-target-row:hover {
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, var(--divider-color, rgba(0, 0, 0, 0.12)));
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 2%, var(--card-background-color, #fff));
  }

  .history-target-row.is-dragging {
    opacity: 0.35;
  }

  .history-target-row.is-drag-over-before {
    box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-row.is-drag-over-after {
    box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-drag-handle {
    grid-area: handle;
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: grab;
    opacity: 0;
    transition: opacity 140ms ease, background-color 120ms ease;
    touch-action: none;
    margin-right: calc(var(--dp-spacing-xs) * -0.5);
    margin-left: -8px;
    position: absolute;
  }

  .history-target-drag-handle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    pointer-events: none;
  }

  .history-target-row:hover .history-target-drag-handle {
    opacity: 0.45;
  }

  .history-target-drag-handle:hover,
  .history-target-drag-handle:focus-visible {
    opacity: 1;
    outline: none;
  }

  .history-target-drag-handle:active {
    cursor: grabbing;
  }

  .history-target-name {
    grid-area: name;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--dp-spacing-sm);
    align-items: center;
  }

  .history-target-name-text {
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .history-target-entity-id {
    margin-top: 4px;
    font-size: 0.74rem;
    font-weight: 400;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-target-color-field {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    overflow: hidden;
  }

  .history-target-controls {
    display: contents;
  }

  .history-target-color-icon {
    position: absolute;
    inset: 0;
    display: inline-grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: var(--row-icon-color, var(--text-primary-color, #fff));
    pointer-events: none;
    z-index: 1;
  }

  .history-target-color-icon ha-state-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .history-target-color {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 10px;
    padding: 0;
    background: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    opacity: 0;
    z-index: 2;
  }

  .history-target-color::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .history-target-color::-webkit-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color::-moz-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color-field::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--row-color, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, rgba(0, 0, 0, 0.18) 70%, transparent);
  }

  .history-target-color:focus-visible + .history-target-color-icon {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
    outline-offset: 2px;
    border-radius: inherit;
  }

  .history-target-actions,
  .history-target-actions-head {
    grid-area: actions;
    justify-self: end;
    align-self: center;
  }

  .history-target-actions {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }

  .history-target-analysis-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease, transform 120ms ease;
  }

  .history-target-analysis-toggle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    transition: transform 120ms ease;
  }

  .history-target-analysis-toggle.is-open ha-icon {
    transform: rotate(180deg);
  }

  .history-target-analysis-toggle:hover,
  .history-target-analysis-toggle:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }

  .history-target-analysis {
    grid-area: analysis;
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: calc(var(--spacing, 8px) * 0.25);
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 78%, transparent);
  }

  .history-target-analysis[hidden] {
    display: none;
  }

  .history-target-analysis-grid {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: var(--dp-spacing-sm);
  }

  .history-target-analysis-toggle-group {
    display: flex;
    gap: calc(var(--spacing, 8px) * 0.625);
    align-items: center;
  }

  .history-target-analysis-option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
  }
  
  .history-target-analysis-option.top {
    align-items: flex-start;
  }

  .history-target-analysis-option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .history-target-analysis-option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }
  
  .history-target-analysis-option-help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }

  .analysis-computing-spinner {
    display: none;
    width: 10px;
    height: 10px;
    border: 2px solid var(--divider-color, #ccc);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: analysis-spin 0.7s linear infinite;
    flex-shrink: 0;
    margin-left: 2px;
  }

  .analysis-computing-spinner.active {
    display: inline-block;
  }

  @keyframes analysis-spin {
    to { transform: rotate(360deg); }
  }

  .history-target-analysis-field {
    display: grid;
    gap: 4px;
    justify-items: start;
  }

  .history-target-analysis-field-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--secondary-text-color);
  }

  .history-target-analysis-select,
  .history-target-analysis-input {
    width: auto;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--spacing, 8px) * 0.75) calc(var(--spacing, 8px) * 0.875);
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.84rem;
  }

  .history-target-analysis-row {
    display: grid;
    gap: var(--dp-spacing-sm);
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .history-target-analysis-group {
    display: grid;
    gap: var(--dp-spacing-sm);
    border-radius: 6px;
  }
  
  .history-target-analysis-group.is-open {
      padding-bottom: 0;
  }

  .history-target-analysis-group-body {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
    padding-left: var(--dp-spacing-md);
  }

  .history-target-analysis-method-list {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .history-target-analysis-method-item {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .analysis-method-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--secondary-text-color, #888);
    background: transparent;
    color: var(--secondary-text-color, #888);
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: default;
    padding: 0;
    vertical-align: middle;
  }

  .history-target-analysis-method-subopts {
    padding-left: calc(var(--spacing, 8px) * 1.5);
    display: grid;
    gap: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
  }

  .history-target-visible-toggle {
    position: relative;
    display: inline-flex;
    width: 34px;
    height: 20px;
    flex: 0 0 auto;
    cursor: pointer;
  }

  .history-target-visible-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }

  .history-target-visible-toggle-track {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
    transition: background-color 120ms ease;
  }

  .history-target-visible-toggle-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: transform 120ms ease;
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track {
    background: var(--primary-color);
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track::after {
    transform: translateX(14px);
  }

  .history-target-visible-toggle input:focus-visible + .history-target-visible-toggle-track {
    outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
    outline-offset: 2px;
  }

  .history-target-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    min-width: 16px;
    line-height: 16px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .history-target-remove ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .history-target-remove:hover,
  .history-target-remove:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
    color: var(--error-color, #db4437);
    outline: none;
  }

  .page-sidebar.collapsed .control-target {
    display: block;
  }

  .sidebar-options {
    width: 100%;
    box-sizing: border-box;
  }

  .page-sidebar.collapsed .sidebar-options {
    display: none;
  }

  .page-sidebar.collapsed .history-targets-header,
  .page-sidebar.collapsed .history-target-picker-slot,
  .page-sidebar.collapsed .history-target-rows {
    display: none;
  }

  .page-sidebar.collapsed .history-targets-collapsed-summary {
    display: grid;
  }

  .sidebar-options-card {
    display: grid;
    gap: var(--dp-spacing-lg);
  }

  .sidebar-options-section {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-radio-group {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-radio-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }

  .sidebar-toggle-group {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-select-group {
    display: grid;
    gap: var(--dp-spacing-sm);
    margin-top: var(--dp-spacing-xs);
  }

  .sidebar-select-field {
    display: grid;
    gap: 6px;
  }

  .sidebar-select-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }

  .sidebar-helper-text {
    font-size: 0.8rem;
    line-height: 1.35;
    color: var(--secondary-text-color);
  }

  .sidebar-analysis-thresholds {
    display: grid;
    gap: var(--dp-spacing-sm);
    margin-top: var(--dp-spacing-sm);
  }

  .sidebar-threshold-row {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .sidebar-threshold-label {
    min-width: 0;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-threshold-input-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-threshold-input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    padding: 0 10px;
    min-height: 38px;
  }

  .sidebar-threshold-input:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 32%, transparent);
    outline-offset: 1px;
  }

  .sidebar-threshold-unit {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .sidebar-select {
    width: 100%;
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    border-radius: 10px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .sidebar-toggle-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }

  .sidebar-toggle-option input {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .sidebar-radio-option input {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .cw-scan-btn {
    display: block;
    width: 100%;
    padding: var(--dp-spacing-xs) var(--dp-spacing-sm);
    background: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    box-sizing: border-box;
  }

  .cw-scan-btn:hover {
    opacity: 0.88;
  }

  .cw-list {
    display: grid;
    gap: 4px;
    margin-top: var(--dp-spacing-sm);
  }

  .cw-row {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-xs);
    font-size: 0.82rem;
    color: var(--primary-text-color);
  }

  .cw-row input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .cw-row-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cw-remove-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0 2px;
    cursor: pointer;
    color: var(--secondary-text-color);
    font-size: 1rem;
    line-height: 1;
    border-radius: 3px;
  }

  .cw-remove-btn:hover {
    color: var(--error-color, #db4437);
  }

  .control-date {
    width: 100%;
    min-width: 0;
  }

  .chart-host,
  .list-host {
    width: 100%;
    min-width: 0;
    min-height: 0;
  }

  .chart-host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .list-host {
    min-height: 0;
    display: flex;
    overflow: hidden;
  }

  .content-splitter {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: row-resize;
    touch-action: none;
  }

  .content-splitter::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    transform: translateY(-50%);
  }

  .content-splitter::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 60px;
    height: 6px;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
  }

  .content-splitter:hover::after,
  .content-splitter:focus-visible::after,
  .content-splitter.dragging::after {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }

  .content-splitter:focus-visible {
    outline: none;
  }

  .list-host ha-card,
  .chart-host ha-card {
    width: 100%;
  }

  .list-host > *,
  .chart-host > * {
    width: 100%;
  }

  .chart-card-host {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    width: 100%;
    overflow: hidden;
  }

  .chart-card-host > * {
    height: 100%;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }

  .list-host > * {
    height: 100%;
  }

  .empty {
    padding: calc(var(--spacing, 8px) * 4) var(--dp-spacing-xl);
    text-align: center;
    color: var(--secondary-text-color);
  }

  .date-window-dialog-content {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) 0 0;
    overflow: visible;
  }

  .date-window-dialog-body {
    color: var(--secondary-text-color);
    line-height: 1.4;
    margin-bottom: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-field {
    display: grid;
    gap: var(--dp-spacing-xs);
    overflow: visible;
  }

  .date-window-dialog-field.name-field {
    max-width: 320px;
  }

  .date-window-dialog-field label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .date-window-dialog-field ha-textfield,
  .date-window-dialog-field input {
    width: 100%;
  }

  .date-window-dialog-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    border-radius: 12px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .date-window-dialog-input:focus {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 36%, transparent);
    outline-offset: 1px;
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
  }

  .date-window-dialog-shortcuts[hidden] {
    display: none;
  }

  .date-window-dialog-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
    padding-top: 0;
    margin-top: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-actions-right {
    display: flex;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
    margin-left: auto;
  }

  .date-window-dialog-actions ha-button {
    --mdc-typography-button-font-size: 0.875rem;
  }

  .date-window-dialog-cancel {
    --mdc-theme-primary: var(--primary-text-color);
  }

  .date-window-dialog-submit {
    --mdc-theme-primary: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-delete {
    --mdc-theme-primary: var(--error-color, #db4437);
  }

  @media (max-width: 720px) {
    .date-window-dialog-dates {
      grid-template-columns: 1fr;
    }
  }

  .range-control {
    position: relative;
    min-height: 58px;
    overflow: visible;
  }

  .range-toolbar {
    display: flex;
    align-items: stretch;
    flex-wrap: nowrap;
    min-height: 58px;
    overflow: visible;
  }

  .range-toolbar > * {
    min-width: 0;
  }

  .range-toolbar > * + * {
    position: relative;
    margin-left: var(--dp-spacing-xs);
    padding-left: var(--dp-spacing-lg);
  }

  .range-toolbar > * + *::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-timeline-shell {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-selection-jump {
    position: absolute;
    top: 50%;
    width: 30px;
    height: 30px;
    transform: translateY(-50%);
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: color-mix(in srgb, var(--primary-text-color, #111) 94%, transparent);
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.12),
      inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 82%, transparent);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    z-index: 12;
  }

  .range-selection-jump[hidden] {
    display: none;
  }

  .range-selection-jump.left {
    left: 6px;
  }

  .range-selection-jump.right {
    right: 6px;
  }

  .range-selection-jump:hover,
  .range-selection-jump:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 100%, transparent);
    outline: none;
  }

  .range-scroll-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    cursor: grab;
    touch-action: pan-y;
  }

  .range-scroll-viewport::-webkit-scrollbar {
    height: 8px;
  }

  .range-scroll-viewport::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
  }

  .range-scroll-viewport.dragging {
    cursor: grabbing;
  }

  .range-timeline {
    position: relative;
    height: 58px;
    min-width: 100%;
    touch-action: pan-y;
  }

  .range-context-layer,
  .range-label-layer,
  .range-tick-layer,
  .range-event-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-divider {
    position: absolute;
    top: 8px;
    bottom: 22px;
    width: 2px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
  }

  .range-context-label {
    font-weight: bold !important;
    position: absolute;
    top: 0;
    transform: translateX(8px);
    font-size: 0.92rem;
    line-height: 1;
    color: var(--primary-text-color);
    white-space: nowrap;
  }

  .range-scale-label {
    position: absolute;
    bottom: 0;
    opacity: 0.7;
    transform: translateX(-50%);
    font-size: 0.76rem;
    line-height: 1;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .range-period-button {
    padding: calc(var(--spacing, 8px) * 0.25) var(--dp-spacing-sm);
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    color: inherit;
    pointer-events: auto;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  .range-period-button:hover {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-period-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 26px;
    transform: translateY(-50%);
    height: 4px;
    border-radius: 999px;
    background: transparent;
  }

  .range-selection {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 82%, transparent);
    cursor: grab;
  }

  .range-selection.dragging {
    cursor: grabbing;
  }

  .range-hover-preview {
    position: absolute;
    top: 14px;
    height: 14px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-hover-preview.visible {
    opacity: 1;
  }

  .range-comparison-preview {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 58%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-comparison-preview.visible {
    opacity: 1;
  }

  .range-zoom-highlight {
    position: absolute;
    top: -6px;
    height: 16px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
    box-shadow:
      inset 0 0 0 2px var(--primary-color, #03a9f4),
      0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 72%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-highlight.visible {
    opacity: 1;
  }

  .range-zoom-window-highlight {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 4;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 52%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 85%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-window-highlight.visible {
    opacity: 1;
  }

  .range-tick {
    position: absolute;
    top: 14px;
    height: 14px;
    width: 1px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 16%, transparent);
  }

  .range-tick.major {
    top: 20px;
    height: 18px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }

  .range-tick.fine {
    top: 18px;
    height: 8px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 14%, transparent);
  }

  .range-tick.context {
    top: 2px;
    height: 34px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 38%, transparent);
  }

  .range-event-dot {
    position: absolute;
    top: 35px;
    width: 6px;
    height: 6px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    pointer-events: none;
  }

  .range-chart-hover-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-line.visible {
    opacity: 1;
  }

  .range-chart-hover-window-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-window-line.visible {
    opacity: 0.45;
  }

  .range-handle {
    position: absolute;
    top: 26px;
    left: 0;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    background: color-mix(in srgb, var(--primary-text-color, #111) 84%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    padding: 0;
    cursor: ew-resize;
    touch-action: none;
  }

  .range-handle:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
  }

  @keyframes dp-live-breathe {
    0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 0 rgba(239, 83, 80, 0); }
    50%       { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 5px rgba(239, 83, 80, 0.2); }
  }

  .range-handle.is-live {
    background: #ef5350;
    animation: dp-live-breathe 3s ease-in-out infinite;
  }

  .range-tooltip {
    position: absolute;
    top: 43px;
    left: 0;
    transform: translate(-50%, 0);
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    border-radius: 10px;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    color: rgba(255, 255, 255, 0.96);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    font-size: 0.86rem;
    line-height: 1.1;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    opacity: 0;
    visibility: hidden;
    transition: opacity 120ms ease, visibility 120ms ease;
    z-index: 8;
  }

  .range-tooltip-live-hint {
    display: block;
    font-size: 0.78rem;
    opacity: 0.72;
    margin-top: 4px;
  }

  .range-tooltip::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    width: 10px;
    height: 10px;
    background: inherit;
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 2px;
  }

  .range-tooltip.visible {
    opacity: 1;
    visibility: visible;
  }

  .range-tooltip.start {
    z-index: 8;
  }

  .range-tooltip.end {
    z-index: 9;
  }

  .range-picker-wrap,
  .range-options-wrap {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    align-self: stretch;
  }

  .range-picker-button,
  .range-options-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .range-picker-button:hover,
  .range-picker-button:focus-visible,
  .range-options-button:hover,
  .range-options-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .range-picker-menu,
  .range-options-menu {
    position: fixed;
    top: var(--floating-menu-top, 64px);
    left: var(--floating-menu-left, 0px);
    z-index: 9999;
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-picker-menu {
    width: min(340px, calc(100vw - 32px));
    min-height: 56px;
    padding: var(--dp-spacing-md);
  }

  .range-picker-menu[hidden],
  .range-options-menu[hidden] {
    display: none;
  }

  .range-picker {
    display: block;
    min-width: 0;
    width: 100%;
  }

  .range-options-menu {
    width: 280px;
    max-height: min(70vh, 520px);
    overflow: auto;
    padding: var(--dp-spacing-sm);
  }

  @media (max-width: 720px) {
    .range-toolbar > * + * {
      margin-left: 2px;
      padding-left: 8px;
    }

    .range-toolbar > * + *::before {
      top: 8px;
      bottom: 8px;
    }

    .range-picker-button,
    .range-options-button {
      min-width: 32px;
      --mdc-icon-size: 20px;
    }
  }

  .range-options-view[hidden] {
    display: none;
  }

  .range-options-header {
    display: block;
    min-height: 36px;
    margin-bottom: var(--dp-spacing-xs);
  }

  .range-options-header-trigger {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-options-header-trigger:hover,
  .range-options-header-trigger:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .range-options-title {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }

  .range-options-list {
    display: grid;
    gap: var(--dp-spacing-xs);
    padding: 0;
  }

  .range-option,
  .range-submenu-trigger,
  .range-options-back {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-submenu-trigger,
  .range-options-back {
    justify-content: space-between;
  }

  .range-options-back {
    width: auto;
    min-width: 0;
    padding-inline: 8px;
    flex: 0 0 auto;
  }

  .range-submenu-meta {
    color: var(--secondary-text-color);
    font-size: 0.84rem;
    margin-left: auto;
    padding-left: var(--dp-spacing-md);
  }

  .range-option:hover,
  .range-option:focus-visible,
  .range-submenu-trigger:hover,
  .range-submenu-trigger:focus-visible,
  .range-options-back:hover,
  .range-options-back:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .range-option::before {
    content: "";
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
    flex: 0 0 auto;
  }

  .range-option.selected::before {
    border-color: var(--primary-color, #03a9f4);
    box-shadow: inset 0 0 0 4px var(--card-background-color, #fff);
    background: var(--primary-color, #03a9f4);
  }

  .range-submenu-trigger::after {
    content: "›";
    color: var(--secondary-text-color);
    font-size: 1rem;
    line-height: 1;
    margin-left: var(--dp-spacing-sm);
  }

  .range-option-label {
    flex: 1;
    min-width: 0;
  }

  .range-caption {
    display: none;
  }

  @media (max-width: 900px) {
    .controls-section {
      padding: var(--dp-spacing-md);
    }

    .controls-grid,
    .content {
      gap: var(--dp-spacing-md);
    }

    .range-toolbar {
      flex-wrap: wrap;
    }

    .range-toolbar > * + * {
      margin-left: 0;
      padding-left: 0;
    }

    .range-toolbar > * + *::before {
      display: none;
    }

    .range-picker-menu,
    .range-options-menu {
      right: 0;
      max-width: calc(100vw - 32px);
    }

    .page-content {
      grid-template-columns: minmax(0, 1fr);
      padding: var(--dp-spacing-md);
    }

    .page-sidebar {
      min-height: 0;
      padding-right: 0;
      border-right: none;
    }

    .page-content.sidebar-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }

    .page-sidebar.collapsed {
      align-items: stretch;
      padding-bottom: 0;
    }

    .page-sidebar.collapsed .control-target {
      display: none;
    }
  }
`;

const PANEL_HISTORY_LOADING_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
  }

  .history-panel-loading {
    display: grid;
    place-items: center;
    min-height: 100%;
    padding: 32px;
    box-sizing: border-box;
  }

  .history-panel-loading-card {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    border-radius: 18px;
    background: var(--card-background-color, var(--primary-background-color));
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .history-panel-loading-spinner {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 80%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: history-panel-spin 0.85s linear infinite;
    flex: 0 0 auto;
  }

  .history-panel-loading-text {
    font-size: 0.98rem;
    color: var(--secondary-text-color, var(--primary-text-color));
    white-space: nowrap;
  }

  @keyframes history-panel-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function deriveSwatchIconColor(color) {
  const hex = String(color || "").trim();
  const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
  if (!normalizedHex) {
    return contrastColor(color);
  }
  const channels = normalizedHex
    .slice(1)
    .match(/.{2}/g)
    ?.map((part) => Number.parseInt(part, 16));
  if (!channels || channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
    return contrastColor(color);
  }
  const [red, green, blue] = channels;
  const luminance = ((0.299 * red) + (0.587 * green) + (0.114 * blue)) / 255;
  const mixTarget = luminance > 0.62 ? 0 : 255;
  const mixStrength = luminance > 0.62
    ? Math.min(0.82, 0.35 + ((luminance - 0.62) * 1.6))
    : Math.min(0.78, 0.4 + ((0.62 - luminance) * 0.9));
  const mixedChannels = [red, green, blue].map((channel) => {
    const mixed = Math.round((channel * (1 - mixStrength)) + (mixTarget * mixStrength));
    return Math.max(0, Math.min(255, mixed));
  });
  return `rgb(${mixedChannels[0]}, ${mixedChannels[1]}, ${mixedChannels[2]})`;
}

// Shared timeline, domain, and history-page helpers now live in dedicated subsystem files.

export class HassRecordsHistoryPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    this._shellBuilt = false;
    this._entities = [];
    this._seriesRows = [];
    this._targetSelection = {};
    this._targetSelectionRaw = {};
    this._hours = 24;
    this._startTime = null;
    this._endTime = null;
    this._panel = null;
    this._narrow = false;
    this._contentKey = "";
    this._contentSplitRatio = 0.44;
    this._sidebarCollapsed = false;
    this._collapsedPopupEntityId = null;
    this._collapsedPopupAnchorEl = null;
    this._collapsedPopupOutsideClickHandler = null;
    this._collapsedPopupKeyHandler = null;
    this._datapointScope = "linked";
    this._showChartDatapointIcons = true;
    this._showChartDatapointLines = true;
    this._showChartTooltips = true;
    this._showChartEmphasizedHoverGuides = false;
    this._delinkChartYAxis = false;
    this._showChartTrendLines = false;
    this._hideChartSourceSeries = false;
    this._showChartSummaryStats = false;
    this._showChartRateOfChange = false;
    this._showChartThresholdAnalysis = false;
    this._showChartThresholdShading = false;
    this._showChartAnomalies = false;
    this._showChartTrendCrosshairs = false;
    this._chartTrendMethod = "rolling_average";
    this._chartTrendWindow = "24h";
    this._chartRateWindow = "1h";
    this._chartAnomalyMethod = "trend_residual";
    this._chartAnomalySensitivity = "medium";
    this._chartAnomalyRateWindow = "1h";
    this._chartAnomalyZscoreWindow = "24h";
    this._chartAnomalyPersistenceWindow = "1h";
    this._chartAnomalyComparisonWindowId = null;
    this._chartThresholdValues = {};
    this._chartThresholdDirections = {};
    this._showChartDeltaAnalysis = false;
    this._showChartDeltaTooltip = true;
    this._showChartDeltaLines = false;
    this._showCorrelatedAnomalies = false;
    this._showDataGaps = true;
    this._dataGapThreshold = "2h";
    this._historyStartTime = null;
    this._historyEndTime = null;
    this._historyBoundsLoaded = false;
    this._historyBoundsPromise = null;
    this._timelineEvents = [];
    this._timelineEventsPromise = null;
    this._timelineEventsKey = "";
    this._preferredSeriesColors = {};
    this._preferencesLoaded = false;
    this._preferencesPromise = null;
    this._comparisonWindows = [];
    this._selectedComparisonWindowId = null;
    this._hoveredComparisonWindowId = null;
    this._loadingComparisonWindowIds = [];
    this._comparisonTabsRenderKey = "";
    this._comparisonTabsHostEl = null;
    this._comparisonTabRailComp = null;
    this._pendingAnomalyComparisonWindowEntityId = null;
    this._dateWindowDialogOpen = false;
    this._editingDateWindowId = null;
    this._dateWindowDialogComp = null;
    this._dragSourceIndex = null;
    this._splitChartView = false;
    this._dateWindowDialogNameEl = null;
    this._dateWindowDialogStartEl = null;
    this._dateWindowDialogEndEl = null;
    this._dateWindowDialogShortcutsEl = null;
    this._dateWindowDialogDraftRange = null;
    this._uiReadyPromise = null;
    this._uiReadyApplied = false;
    this._chartEl = null;
    this._listEl = null;
    this._chartConfigKey = "";
    this._listConfigKey = "";
    this._topAppBarEl = null;
    this._menuButtonEl = null;
    this._pageContentEl = null;
    this._pageSidebarEl = null;
    this._pageMenuButtonEl = null;
    this._pageMenuEl = null;
    this._sidebarToggleButtonEl = null;
    this._contentSplitterEl = null;
    this._targetControl = null;
    this._targetRowsEl = null;
    this._rowListEl = null;
    this._targetRowsRenderKey = "";
    this._sidebarOptionsEl = null;
    this._sidebarOptionsComp = null;
    this._dateControl = null;
    this._dateRangePickerEl = null;
    this._datePickerButtonEl = null;
    this._datePickerMenuEl = null;
    this._optionsButtonEl = null;
    this._optionsMenuEl = null;
    this._panelTimelineEl = null;
    this._rangeBounds = null;
    this._autoZoomTimer = null;
    this._resolvedAutoZoomLevel = null;
    this._hoveredPeriodRange = null;
    this._chartHoverTimeMs = null;
    this._chartZoomRange = null;
    this._chartZoomCommittedRange = null;
    this._chartZoomStateCommitTimer = null;
    this._zoomLevel = "auto";
    this._dateSnapping = "auto";
    this._recordsSearchQuery = "";
    this._hiddenEventIds = [];
    this._optionsMenuView = "root";
    this._restoredFromSession = false;
    this._datePickerOpen = false;
    this._optionsOpen = false;
    this._pageMenuOpen = false;
    this._exportBusy = false;
    this._contentSplitPointerId = null;
    this._onChartHover = (ev) => this._handleChartHover(ev);
    this._onChartZoom = (ev) => this._handleChartZoom(ev);
    this._onRecordsSearch = (ev) => this._handleRecordsSearch(ev);
    this._onToggleEventVisibility = (ev) => this._handleToggleEventVisibility(ev);
    this._onToggleSeriesVisibility = (ev) => this._handleToggleSeriesVisibility(ev);
    this._onComparisonLoading = (ev) => this._handleComparisonLoading(ev);
    this._onAnalysisComputing = (ev) => this._handleAnalysisComputing(ev);
    this._onWindowPointerDown = (ev) => this._handleWindowPointerDown(ev);
    this._onWindowResize = () => {
      if (this._rendered) {
        this._syncPageLayoutHeight();
        this._applyContentSplitLayout();
        this._syncRangeControl();
        if (this._pageMenuOpen) {
          this._positionPageMenu();
        }
        if (this._optionsOpen) {
          this._positionFloatingMenu(this._optionsMenuEl, this._optionsButtonEl, 280);
        }
        if (this._datePickerOpen) {
          this._positionFloatingMenu(this._datePickerMenuEl, this._datePickerButtonEl, 320);
        }
      }
    };
    this._onContentSplitPointerMove = (ev) => this._handleContentSplitPointerMove(ev);
    this._onContentSplitPointerUp = (ev) => this._finishContentSplitPointer(ev);
    this._onCollapsedSidebarClick = (ev) => this._handleCollapsedSidebarClick(ev);
    this._onEventRecorded = () => this._handleEventRecorded();
    this._haEventUnsubscribe = null;
    this._onPopState = () => {
      this._initFromContext();
      if (this._rendered) {
        this._syncControls();
        this._renderContent();
      }
    };
    this._onLocationChanged = () => {
      this._initFromContext();
      if (this._rendered) {
        this._syncControls();
        this._renderContent();
      }
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._haEventUnsubscribe && this._hass?.connection) {
      this._hass.connection
        .subscribeEvents(() => this._handleEventRecorded(), `${DOMAIN}_event_recorded`)
        .then((unsub) => { this._haEventUnsubscribe = unsub; })
        .catch(() => {});
    }
    if (!this._rendered) {
      this._rendered = true;
      this._initFromContext();
      if (this.isConnected) {
        this._buildLoadingShell();
      }
    }
    if (!this._seriesRows.length && Object.keys(this._targetSelection || {}).length) {
      this._seriesRows = buildHistorySeriesRows(resolveEntityIdsFromTarget(this._hass, this._targetSelection));
    }
    this._syncSeriesState();
    if (!this._shellBuilt) return;
    this._ensureHistoryBounds();
    this._ensureUserPreferences();
    this._syncHassBindings();
    this._renderContent();
  }

  set panel(panel) {
    this._panel = panel;
    this._initFromContext();
    if (this._rendered) {
      this._syncControls();
      this._renderContent();
    }
  }

  set narrow(value) {
    this._narrow = value;
  }

  connectedCallback() {
    window.addEventListener("popstate", this._onPopState);
    window.addEventListener("location-changed", this._onLocationChanged);
    window.addEventListener("pointerdown", this._onWindowPointerDown, true);
    window.addEventListener("resize", this._onWindowResize);
    window.addEventListener("hass-datapoints-event-recorded", this._onEventRecorded);
    this.addEventListener("hass-datapoints-chart-hover", this._onChartHover);
    this.addEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
    this.addEventListener("hass-datapoints-records-search", this._onRecordsSearch);
    this.addEventListener("hass-datapoints-toggle-event-visibility", this._onToggleEventVisibility);
    this.addEventListener("hass-datapoints-toggle-series-visibility", this._onToggleSeriesVisibility);
    this.addEventListener("hass-datapoints-comparison-loading", this._onComparisonLoading);
    this.addEventListener("hass-datapoints-analysis-computing", this._onAnalysisComputing);
    if (this._rendered && !this._shellBuilt) {
      this._buildLoadingShell();
    }
    this._ensureUiComponentsReady();
    if (this._rendered && this._shellBuilt) {
      window.requestAnimationFrame(() => {
        if (!this.isConnected) return;
        this._syncControls();
        this._renderContent();
        if (this._restoredFromSession) {
          this._restoredFromSession = false;
          this._updateUrl({ push: false });
        }
      });
    }
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this._onPopState);
    window.removeEventListener("location-changed", this._onLocationChanged);
    window.removeEventListener("pointerdown", this._onWindowPointerDown, true);
    window.removeEventListener("resize", this._onWindowResize);
    window.removeEventListener("hass-datapoints-event-recorded", this._onEventRecorded);
    if (this._haEventUnsubscribe) {
      this._haEventUnsubscribe();
      this._haEventUnsubscribe = null;
    }
    this.removeEventListener("hass-datapoints-chart-hover", this._onChartHover);
    this.removeEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
    this.removeEventListener("hass-datapoints-records-search", this._onRecordsSearch);
    this.removeEventListener("hass-datapoints-toggle-event-visibility", this._onToggleEventVisibility);
    this.removeEventListener("hass-datapoints-toggle-series-visibility", this._onToggleSeriesVisibility);
    this.removeEventListener("hass-datapoints-comparison-loading", this._onComparisonLoading);
    this.removeEventListener("hass-datapoints-analysis-computing", this._onAnalysisComputing);
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    if (this._autoZoomTimer) {
      window.clearTimeout(this._autoZoomTimer);
      this._autoZoomTimer = null;
    }
    this._contentSplitPointerId = null;
    window.removeEventListener("pointermove", this._onContentSplitPointerMove);
    window.removeEventListener("pointerup", this._onContentSplitPointerUp);
    window.removeEventListener("pointercancel", this._onContentSplitPointerUp);
  }

  _initFromContext() {
    const url = new URL(window.location.href);
    const entityFromUrl = url.searchParams.get("entity_id");
    const deviceFromUrl = url.searchParams.get("device_id");
    const areaFromUrl = url.searchParams.get("area_id");
    const labelFromUrl = url.searchParams.get("label_id");
    const datapointsScopeFromUrl = url.searchParams.get("datapoints_scope");
    const startFromUrl = url.searchParams.get("start_time");
    const endFromUrl = url.searchParams.get("end_time");
    const zoomStartFromUrl = url.searchParams.get("zoom_start_time");
    const zoomEndFromUrl = url.searchParams.get("zoom_end_time");
    const seriesColorsFromUrl = parseSeriesColorsParam(url.searchParams.get("series_colors"));
    const dateWindowsFromUrl = parseDateWindowsParam(url.searchParams.get("date_windows"));
    const hoursFromUrl = Number.parseInt(url.searchParams.get("hours_to_show") || "", 10);
    const hasTargetInUrl = !!(entityFromUrl || deviceFromUrl || areaFromUrl || labelFromUrl);
    const hasRangeInUrl = !!startFromUrl && !!endFromUrl;
    const panelCfg = this._panel?.config || {};
    const sessionState = this._readSessionState();
    this._restoredFromSession = !hasTargetInUrl && !hasRangeInUrl && !!sessionState;
    this._sidebarCollapsed = !!sessionState?.sidebar_collapsed;
    if (Number.isFinite(sessionState?.content_split_ratio)) {
      this._contentSplitRatio = clampNumber(sessionState.content_split_ratio, 0.25, 0.75);
    }
    this._datapointScope = datapointsScopeFromUrl === "all"
      ? "all"
      : datapointsScopeFromUrl === "hidden"
        ? "hidden"
        : (!datapointsScopeFromUrl && sessionState?.datapoint_scope === "all")
          ? "all"
          : (!datapointsScopeFromUrl && sessionState?.datapoint_scope === "hidden")
            ? "hidden"
            : "linked";
    this._showChartDatapointIcons = sessionState?.show_chart_datapoint_icons !== false;
    this._showChartDatapointLines = sessionState?.show_chart_datapoint_lines !== false;
    this._showChartTooltips = sessionState?.show_chart_tooltips !== false;
    this._showChartEmphasizedHoverGuides = sessionState?.show_chart_emphasized_hover_guides === true;
    this._delinkChartYAxis = sessionState?.delink_chart_y_axis === true;
    this._splitChartView = sessionState?.split_chart_view === true;
    this._showChartTrendLines = sessionState?.show_chart_trend_lines === true;
    this._hideChartSourceSeries = sessionState?.hide_chart_source_series === true
      || sessionState?.hide_chart_raw_data === true
      || sessionState?.hide_chart_delta_source_series === true;
    this._showChartSummaryStats = sessionState?.show_chart_summary_stats === true;
    this._showChartRateOfChange = sessionState?.show_chart_rate_of_change === true;
    this._showChartThresholdAnalysis = sessionState?.show_chart_threshold_analysis === true;
    this._showChartThresholdShading = sessionState?.show_chart_threshold_shading === true;
    this._showChartAnomalies = sessionState?.show_chart_anomalies === true;
    this._showChartTrendCrosshairs = sessionState?.show_chart_trend_crosshairs === true;
    this._chartTrendMethod = ANALYSIS_TREND_METHOD_OPTIONS.some((option) => option.value === sessionState?.chart_trend_method)
      ? sessionState.chart_trend_method
      : "rolling_average";
    this._chartTrendWindow = ANALYSIS_TREND_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_trend_window)
      ? sessionState.chart_trend_window
      : "24h";
    this._chartRateWindow = ANALYSIS_RATE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_rate_window)
      ? sessionState.chart_rate_window
      : "1h";
    this._chartAnomalyMethod = ANALYSIS_ANOMALY_METHOD_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_method)
      ? sessionState.chart_anomaly_method
      : "trend_residual";
    this._chartAnomalySensitivity = ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_sensitivity)
      ? sessionState.chart_anomaly_sensitivity
      : "medium";
    this._chartAnomalyRateWindow = ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_rate_window)
      ? sessionState.chart_anomaly_rate_window
      : "1h";
    this._chartAnomalyZscoreWindow = ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_zscore_window)
      ? sessionState.chart_anomaly_zscore_window
      : "24h";
    this._chartAnomalyPersistenceWindow = ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_persistence_window)
      ? sessionState.chart_anomaly_persistence_window
      : "1h";
    this._chartAnomalyComparisonWindowId = typeof sessionState?.chart_anomaly_comparison_window_id === "string" && sessionState.chart_anomaly_comparison_window_id
      ? sessionState.chart_anomaly_comparison_window_id
      : null;
    this._chartThresholdValues = sessionState?.chart_threshold_values && typeof sessionState.chart_threshold_values === "object"
      ? Object.entries(sessionState.chart_threshold_values).reduce((acc, [entityId, value]) => {
        if (typeof entityId !== "string") {
          return acc;
        }
        if (typeof value !== "string" && typeof value !== "number") {
          return acc;
        }
        const normalized = String(value).trim();
        if (!normalized) {
          return acc;
        }
        acc[entityId] = normalized;
        return acc;
      }, {})
      : {};
    this._chartThresholdDirections = sessionState?.chart_threshold_directions && typeof sessionState.chart_threshold_directions === "object"
      ? Object.entries(sessionState.chart_threshold_directions).reduce((acc, [entityId, value]) => {
        if (typeof entityId !== "string") {
          return acc;
        }
        if (value !== "below") {
          acc[entityId] = "above";
          return acc;
        }
        acc[entityId] = "below";
        return acc;
      }, {})
      : {};
    this._showChartDeltaAnalysis = sessionState?.show_chart_delta_analysis === true;
    this._showChartDeltaTooltip = sessionState?.show_chart_delta_tooltip !== false;
    this._showChartDeltaLines = sessionState?.show_chart_delta_lines === true;
    this._showCorrelatedAnomalies = sessionState?.show_chart_correlated_anomalies === true;
    this._showDataGaps = sessionState?.show_data_gaps !== false;
    this._dataGapThreshold = DATA_GAP_THRESHOLD_OPTIONS.some((option) => option.value === sessionState?.data_gap_threshold)
      ? sessionState.data_gap_threshold
      : "2h";
    this._comparisonWindows = dateWindowsFromUrl.length
      ? dateWindowsFromUrl
      : normalizeDateWindows(sessionState?.date_windows);
    const targetFromUrl = normalizeTargetValue({
      entity_id: entityFromUrl ? entityFromUrl.split(",") : [],
      device_id: deviceFromUrl ? deviceFromUrl.split(",") : [],
      area_id: areaFromUrl ? areaFromUrl.split(",") : [],
      label_id: labelFromUrl ? labelFromUrl.split(",") : [],
    });
    const panelTarget = panelConfigTarget(panelCfg);
    const nextTargetSelection = Object.keys(targetFromUrl).length
      ? targetFromUrl
      : !hasTargetInUrl && sessionState?.entities?.length
        ? normalizeTargetValue(sessionState.target_selection_raw || sessionState.target_selection || { entity_id: sessionState.entities })
        : panelTarget;
    this._targetSelection = nextTargetSelection;
    this._targetSelectionRaw = !hasTargetInUrl && sessionState?.target_selection_raw
      ? sessionState.target_selection_raw
      : nextTargetSelection;
    this._seriesRows = !hasTargetInUrl && Array.isArray(sessionState?.series_rows)
      ? normalizeHistorySeriesRows(sessionState.series_rows)
      : buildHistorySeriesRows(resolveEntityIdsFromTarget(this._hass, this._targetSelection));
    this._seriesRows = this._applyPreferredSeriesColors(this._seriesRows, seriesColorsFromUrl);
    this._syncSeriesState();
    this._migrateLegacyAnalysisSettingsToSeriesRows();

    const start = parseDateValue(startFromUrl)
      || (!hasRangeInUrl ? parseDateValue(sessionState?.start_time) : null)
      || parseDateValue(panelCfg.start_time);
    const end = parseDateValue(endFromUrl)
      || (!hasRangeInUrl ? parseDateValue(sessionState?.end_time) : null)
      || parseDateValue(panelCfg.end_time);
    const zoomStart = parseDateValue(zoomStartFromUrl)
      || (!zoomStartFromUrl && !zoomEndFromUrl ? parseDateValue(sessionState?.zoom_start_time) : null);
    const zoomEnd = parseDateValue(zoomEndFromUrl)
      || (!zoomStartFromUrl && !zoomEndFromUrl ? parseDateValue(sessionState?.zoom_end_time) : null);
    this._chartZoomRange = null;
    this._chartZoomCommittedRange = zoomStart && zoomEnd && zoomStart < zoomEnd
      ? { start: zoomStart.getTime(), end: zoomEnd.getTime() }
      : null;
    if (start && end && start < end) {
      this._startTime = start;
      this._endTime = end;
      this._hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
      return;
    }

    if (Number.isFinite(hoursFromUrl) && hoursFromUrl > 0) {
      this._hours = hoursFromUrl;
    } else if (!hasRangeInUrl && Number.isFinite(sessionState?.hours) && sessionState.hours > 0) {
      this._hours = sessionState.hours;
    } else if (panelCfg.hours_to_show) {
      this._hours = panelCfg.hours_to_show;
    }
    const now = new Date();
    this._startTime = startOfUnit(now, "week");
    this._endTime = endOfUnit(now, "week");
    this._hours = Math.max(1, Math.round((this._endTime.getTime() - this._startTime.getTime()) / 3600000));
  }

  _readSessionState() {
    return readHistoryPageSessionState();
  }

  _saveSessionState() {
    writeHistoryPageSessionState(this);
  }

  _buildLoadingShell() {
    this._shellBuilt = false;
    this.shadowRoot.innerHTML = `
      <style>${PANEL_HISTORY_LOADING_STYLE}</style>
      <div class="history-panel-loading">
        <div class="history-panel-loading-card" role="status" aria-live="polite">
          <div class="history-panel-loading-spinner" aria-hidden="true"></div>
          <div class="history-panel-loading-text">Loading Datapoints…</div>
        </div>
      </div>
    `;
  }

  _buildShell() {
    this._shellBuilt = true;
    this.shadowRoot.innerHTML = `
      <style>${PANEL_HISTORY_STYLE}</style>
      <ha-top-app-bar-fixed>
        <ha-menu-button slot="navigationIcon"></ha-menu-button>
        <div slot="title">Datapoints</div>
        <div slot="actionItems" class="page-header-actions">
          <div class="page-menu-wrap">
            <ha-icon-button
              id="page-menu-button"
              class="page-menu-button"
              label="Page options"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button>
            <dp-floating-menu id="page-menu">
              <dp-page-menu-item id="page-download-spreadsheet" icon="mdi:file-excel-outline" label="Download spreadsheet"></dp-page-menu-item>
            </dp-floating-menu>
          </div>
        </div>
        <div class="controls-section">
          <div class="controls-grid">
            <div id="date-slot" class="control-date"></div>
          </div>
        </div>
        <div id="page-content" class="page-content">
          <div id="page-sidebar" class="page-sidebar">
            <ha-icon-button
              id="sidebar-toggle"
              class="sidebar-toggle-button"
              label="Toggle targets sidebar"
            >
              <ha-icon icon="mdi:chevron-left"></ha-icon>
            </ha-icon-button>
            <div id="target-slot" class="control-target"></div>
            <div id="sidebar-options" class="sidebar-options"></div>
          </div>
          <div class="content" id="content"></div>
        </div>
        <div id="collapsed-target-popup" class="collapsed-target-popup" hidden></div>
      </ha-top-app-bar-fixed>
    `;
    this._topAppBarEl = this.shadowRoot.querySelector("ha-top-app-bar-fixed");
    this._menuButtonEl = this.shadowRoot.querySelector("ha-menu-button");
    this._pageContentEl = this.shadowRoot.querySelector("#page-content");
    this._pageSidebarEl = this.shadowRoot.querySelector("#page-sidebar");
    this._pageMenuButtonEl = this.shadowRoot.querySelector("#page-menu-button");
    this._pageMenuEl = this.shadowRoot.querySelector("#page-menu");
    this._sidebarToggleButtonEl = this.shadowRoot.querySelector("#sidebar-toggle");
    this._sidebarOptionsEl = this.shadowRoot.querySelector("#sidebar-options");
    this._pageMenuButtonEl?.addEventListener("click", () => this._togglePageMenu());
    this._pageMenuEl?.querySelector("#page-download-spreadsheet")?.addEventListener("dp-menu-action", () => this._downloadSpreadsheet());
    this._pageMenuEl?.addEventListener("dp-menu-close", () => this._togglePageMenu(false));
    this._sidebarToggleButtonEl?.addEventListener("click", () => this._toggleSidebarCollapsed());
    this._pageSidebarEl?.addEventListener("click", this._onCollapsedSidebarClick);
    this._syncPageLayoutHeight();
    this._applyContentSplitLayout();
    this._mountControls();
    this._renderSidebarOptions();
    this._ensureUiComponentsReady();
  }

  _syncPageLayoutHeight() {
    if (!this._pageContentEl) {
      return;
    }
    const pageRect = this._pageContentEl.getBoundingClientRect();
    const hostRect = this.getBoundingClientRect();
    const availableHeight = Math.max(0, hostRect.bottom - pageRect.top);
    if (availableHeight > 0) {
      this._pageContentEl.style.setProperty("--history-page-content-height", `${availableHeight}px`);
    }
  }

  _ensureUiComponentsReady() {
    if (this._uiReadyPromise) return this._uiReadyPromise;
    const componentTags = [
      "ha-top-app-bar-fixed",
      "ha-menu-button",
      "ha-icon-button",
      "ha-dialog",
      "ha-tooltip",
      "ha-target-picker",
      "ha-date-range-picker",
    ];
    this._uiReadyPromise = ensureHaComponents(componentTags)
      .then((results) => {
        return results;
      })
      .then(() => {
        if (!this.isConnected || !this._rendered) return;
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!this.isConnected || !this._rendered) return;
            this._uiReadyApplied = true;
            this._buildShell();
            this._syncControls();
            this._renderContent();
          });
        });
      })
      .catch((error) => {
        console.warn("[hass-datapoints panel] ensure UI components ready failed", {
          message: error?.message || String(error),
        });
      });
    return this._uiReadyPromise;
  }

  _syncControls() {
    this._syncPageLayoutHeight();
    this._syncHassBindings();
    this._syncRangeUi();
    this._renderSidebarOptions();
  }

  _syncSeriesState() {
    this._seriesRows = normalizeHistorySeriesRows(this._seriesRows);
    this._entities = this._seriesRows.map((row) => row.entity_id);
    this._targetSelection = this._entities.length ? { entity_id: [...this._entities] } : {};
    this._targetSelectionRaw = this._targetSelection;
  }

  _migrateLegacyAnalysisSettingsToSeriesRows() {
    const hasConfiguredRowAnalysis = this._seriesRows.some((row) => historySeriesRowHasConfiguredAnalysis(row));
    if (hasConfiguredRowAnalysis) {
      return;
    }
    const hasLegacyAnalysis =
      this._showChartTrendLines
      || this._showChartSummaryStats
      || this._showChartRateOfChange
      || this._showChartThresholdAnalysis
      || this._showChartAnomalies
      || this._showChartDeltaAnalysis
      || this._hideChartSourceSeries
      || Object.keys(this._chartThresholdValues || {}).length > 0
      || Object.keys(this._chartThresholdDirections || {}).length > 0;
    if (!hasLegacyAnalysis) {
      return;
    }
    this._seriesRows = this._seriesRows.map((row) => {
      if (!isAnalysisSupportedForRow(row)) {
        return row;
      }
      return {
        ...row,
        analysis: normalizeHistorySeriesAnalysis({
          ...row.analysis,
          expanded: true,
          show_trend_lines: this._showChartTrendLines,
          trend_method: this._chartTrendMethod,
          trend_window: this._chartTrendWindow,
          show_trend_crosshairs: this._showChartTrendCrosshairs,
          show_summary_stats: this._showChartSummaryStats,
          show_rate_of_change: this._showChartRateOfChange,
          rate_window: this._chartRateWindow,
          show_threshold_analysis: this._showChartThresholdAnalysis,
          show_threshold_shading: this._showChartThresholdShading,
          threshold_value: this._chartThresholdValues?.[row.entity_id] || "",
          threshold_direction: this._chartThresholdDirections?.[row.entity_id] || "above",
          show_anomalies: this._showChartAnomalies,
          anomaly_method: this._chartAnomalyMethod,
          anomaly_methods: [this._chartAnomalyMethod],
          anomaly_sensitivity: this._chartAnomalySensitivity,
          anomaly_rate_window: this._chartAnomalyRateWindow,
          anomaly_zscore_window: this._chartAnomalyZscoreWindow,
          anomaly_persistence_window: this._chartAnomalyPersistenceWindow,
          anomaly_comparison_window_id: this._chartAnomalyComparisonWindowId,
          show_delta_analysis: this._showChartDeltaAnalysis,
          show_delta_tooltip: this._showChartDeltaTooltip,
          show_delta_lines: this._showChartDeltaLines,
          hide_source_series: this._hideChartSourceSeries,
        }),
      };
    });
    this._syncSeriesState();
  }

  _seriesColorQueryKey(entityId) {
    return slugifySeriesName(entityName(this._hass, entityId) || entityId);
  }

  _applyPreferredSeriesColors(rows, urlColorMap = null) {
    const queryColors = urlColorMap && typeof urlColorMap === "object" ? urlColorMap : {};
    return normalizeHistorySeriesRows(rows).map((row) => {
      const queryColor = queryColors[this._seriesColorQueryKey(row.entity_id)];
      const preferredColor = this._preferredSeriesColors?.[row.entity_id];
      const nextColor = /^#[0-9a-f]{6}$/i.test(queryColor || "")
        ? queryColor
        : /^#[0-9a-f]{6}$/i.test(preferredColor || "")
          ? preferredColor
          : row.color;
      return nextColor === row.color ? row : { ...row, color: nextColor };
    });
  }

  _syncHassBindings() {
    if (this._topAppBarEl) {
      if (this._hass) this._topAppBarEl.hass = this._hass;
      this._topAppBarEl.narrow = this._narrow;
    }
    if (this._menuButtonEl) {
      if (this._hass) this._menuButtonEl.hass = this._hass;
      this._menuButtonEl.narrow = this._narrow;
    }
    if (this._pageMenuButtonEl) {
      if (this._hass) this._pageMenuButtonEl.hass = this._hass;
    }
    if (this._sidebarToggleButtonEl) {
      if (this._hass) this._sidebarToggleButtonEl.hass = this._hass;
    }
    this._syncSidebarUi();
    if (this._targetControl) {
      if (this._hass) this._targetControl.hass = this._hass;
      this._targetControl.value = {};
    }
    this._renderTargetRows();
    this.shadowRoot?.querySelectorAll("[data-series-icon-entity-id], [data-series-collapsed-icon-entity-id]").forEach((iconEl) => {
      const entityId = iconEl.dataset.seriesIconEntityId || iconEl.dataset.seriesCollapsedIconEntityId;
      if (!entityId) return;
      iconEl.stateObj = this._hass?.states?.[entityId];
      iconEl.hass = this._hass;
    });
    if (this._dateControl) {
      if (this._dateRangePickerEl) {
        if (this._hass) this._dateRangePickerEl.hass = this._hass;
        this._dateRangePickerEl.startDate = this._startTime;
        this._dateRangePickerEl.endDate = this._endTime;
        this._dateRangePickerEl.value = {
          startDate: this._startTime,
          endDate: this._endTime,
        };
      }
    }
  }

  _syncRangeUi() {
    if (!this._dateControl) return;
    this._syncOptionsMenu();
    this._syncRangeControl();
  }

  _renderSidebarOptions() {
    if (!this._sidebarOptionsComp) { return; }
    const yAxisMode = this._splitChartView ? "split" : this._delinkChartYAxis ? "unique" : "combined";
    this._sidebarOptionsComp.datapointScope = this._datapointScope;
    this._sidebarOptionsComp.showIcons = this._showChartDatapointIcons;
    this._sidebarOptionsComp.showLines = this._showChartDatapointLines;
    this._sidebarOptionsComp.showTooltips = this._showChartTooltips;
    this._sidebarOptionsComp.showHoverGuides = this._showChartEmphasizedHoverGuides;
    this._sidebarOptionsComp.showCorrelatedAnomalies = this._showCorrelatedAnomalies;
    this._sidebarOptionsComp.showDataGaps = this._showDataGaps;
    this._sidebarOptionsComp.dataGapThreshold = this._dataGapThreshold;
    this._sidebarOptionsComp.yAxisMode = yAxisMode;
  }

  _formatComparisonLabel(start, end) {
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const fmtYear = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const sameYear = start.getFullYear() === end.getFullYear();
    return sameYear ? `${fmt(start)} – ${fmt(end)}` : `${fmtYear(start)} – ${fmtYear(end)}`;
  }

  _getComparisonPreviewOverlay() {
    const comparisonWindow = this._getActiveComparisonWindow();
    if (!comparisonWindow || !this._startTime || !this._endTime) {
      return null;
    }
    const windowStart = parseDateValue(comparisonWindow.start_time);
    const windowEnd = parseDateValue(comparisonWindow.end_time);
    if (!windowStart || !windowEnd) {
      return null;
    }
    const actualSpanMs = this._endTime.getTime() - this._startTime.getTime();
    if (!Number.isFinite(actualSpanMs) || actualSpanMs <= 0) {
      return null;
    }
    const actualStart = new Date(windowStart.getTime());
    const actualEnd = new Date(windowStart.getTime() + actualSpanMs);
    const windowRangeLabel = this._formatComparisonLabel(windowStart, windowEnd);
    const actualRangeLabel = this._formatComparisonLabel(actualStart, actualEnd);
    if (windowRangeLabel === actualRangeLabel) {
      return null;
    }
    return {
      label: comparisonWindow.label || "Preview",
      window_range_label: windowRangeLabel,
      actual_range_label: actualRangeLabel,
    };
  }

  _getPreviewComparisonWindows() {
    const comparisonIds = [];
    if (this._selectedComparisonWindowId) {
      comparisonIds.push(this._selectedComparisonWindowId);
    }
    if (
      this._hoveredComparisonWindowId
      && !comparisonIds.includes(this._hoveredComparisonWindowId)
    ) {
      comparisonIds.push(this._hoveredComparisonWindowId);
    }
    if (!comparisonIds.length) {
      return [];
    }
    if (!this._startTime || !this._endTime) {
      return [];
    }
    const previewWindows = comparisonIds
      .map((id) => this._comparisonWindows.find((window) => window.id === id) || null)
      .filter(Boolean)
      .map((window) => ({
        ...window,
        time_offset_ms: new Date(window.start_time).getTime() - this._startTime.getTime(),
      }));
    return previewWindows;
  }

  _getPreloadComparisonWindows() {
    if (!this._startTime || !this._endTime) {
      return [];
    }
    const preloadWindows = this._comparisonWindows.map((window) => ({
      ...window,
      time_offset_ms: new Date(window.start_time).getTime() - this._startTime.getTime(),
    })).filter((window) => Number.isFinite(window.time_offset_ms));
    return preloadWindows;
  }

  _getActiveComparisonWindow() {
    if (this._hoveredComparisonWindowId) {
      return this._comparisonWindows.find((window) => window.id === this._hoveredComparisonWindowId) || null;
    }
    if (this._selectedComparisonWindowId) {
      return this._comparisonWindows.find((window) => window.id === this._selectedComparisonWindowId) || null;
    }
    return null;
  }

  _formatDateWindowInputValue(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  _parseDateWindowInputValue(value) {
    if (!value || typeof value !== "string") {
      return null;
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }
    const [, year, month, day, hour, minute] = match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0,
    );
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  _shiftDateWindowByUnit(date, unit, amount) {
    const shifted = new Date(date);
    if (unit === "day") {
      shifted.setDate(shifted.getDate() + amount);
      return shifted;
    }
    if (unit === "week") {
      shifted.setDate(shifted.getDate() + (amount * 7));
      return shifted;
    }
    if (unit === "month") {
      shifted.setMonth(shifted.getMonth() + amount);
      return shifted;
    }
    if (unit === "year") {
      shifted.setFullYear(shifted.getFullYear() + amount);
      return shifted;
    }
    return shifted;
  }

  _getRoundedDateWindowUnit(start, end) {
    if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) {
      return null;
    }
    const supportedUnits = ["day", "week", "month", "year"];
    for (const unit of supportedUnits) {
      const roundedStart = startOfUnit(start, unit);
      const roundedEnd = endOfUnit(start, unit);
      if (
        roundedStart?.getTime?.() === start.getTime()
        && roundedEnd?.getTime?.() === end.getTime()
      ) {
        return unit;
      }
    }
    return null;
  }

  _syncDateWindowDialogInputs() {
    const startVal = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.start || null);
    const endVal = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.end || null);
    // Update the LitElement component when mounted.
    if (this._dateWindowDialogComp) {
      this._dateWindowDialogComp.startValue = startVal;
      this._dateWindowDialogComp.endValue = endVal;
      return;
    }
    // Legacy ha-dialog fallback.
    if (this._dateWindowDialogStartEl) {
      this._dateWindowDialogStartEl.value = startVal;
    }
    if (this._dateWindowDialogEndEl) {
      this._dateWindowDialogEndEl.value = endVal;
    }
  }

  _handleDateWindowDialogInputChange() {
    const start = this._parseDateWindowInputValue(this._dateWindowDialogStartEl?.value || "");
    const end = this._parseDateWindowInputValue(this._dateWindowDialogEndEl?.value || "");
    if (start && end && start < end) {
      this._dateWindowDialogDraftRange = { start, end };
      return;
    }
    this._dateWindowDialogDraftRange = null;
  }

  _applyDateWindowShortcut(direction) {
    if (this._editingDateWindowId) {
      return;
    }
    const start = this._dateWindowDialogDraftRange?.start;
    const end = this._dateWindowDialogDraftRange?.end;
    if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) {
      return;
    }
    const roundedUnit = this._getRoundedDateWindowUnit(start, end);
    let nextStart;
    let nextEnd;
    if (roundedUnit) {
      nextStart = startOfUnit(this._shiftDateWindowByUnit(start, roundedUnit, direction), roundedUnit);
      nextEnd = endOfUnit(nextStart, roundedUnit);
    } else {
      const spanMs = end.getTime() - start.getTime();
      nextStart = new Date(start.getTime() + (direction * spanMs));
      nextEnd = new Date(end.getTime() + (direction * spanMs));
    }
    this._dateWindowDialogDraftRange = {
      start: nextStart,
      end: nextEnd,
    };
    this._syncDateWindowDialogInputs();
  }

  _ensureDateWindowDialog() {
    // The dialog is pre-mounted as a LitElement in _mountControls(); no legacy ha-dialog needed.
    if (this._dateWindowDialogComp || this._dateWindowDialogEl || !this.shadowRoot) return;
    const dialog = document.createElement("ha-dialog");
    dialog.id = "date-window-dialog";
    dialog.setAttribute("hideActions", "");
    dialog.scrimClickAction = true;
    dialog.escapeKeyAction = true;
    dialog.open = false;
    dialog.headerTitle = "Add date window";
    dialog.style.setProperty("--dialog-content-padding", `0 var(--dp-spacing-lg) var(--dp-spacing-lg)`);
    dialog.innerHTML = `
      <div class="date-window-dialog-content">
        <div class="date-window-dialog-body">
          A date window saves a named date range as a tab, so you can quickly preview it against the selected range or jump the chart back to it later.
        </div>
        <div class="date-window-dialog-field name-field">
          <ha-textfield id="date-window-name" label="Name" placeholder="e.g. Heating season start"></ha-textfield>
        </div>
        <div class="date-window-dialog-field">
          <label>Date range</label>
          <div class="date-window-dialog-dates">
            <div class="date-window-dialog-field">
              <label for="date-window-start">Start</label>
              <input id="date-window-start" class="date-window-dialog-input" type="datetime-local" step="60">
            </div>
            <div class="date-window-dialog-field">
              <label for="date-window-end">End</label>
              <input id="date-window-end" class="date-window-dialog-input" type="datetime-local" step="60">
            </div>
          </div>
        </div>
        <div class="date-window-dialog-shortcuts" id="date-window-shortcuts" hidden>
          <ha-button id="date-window-previous">Use previous range</ha-button>
          <ha-button id="date-window-next">Use next range</ha-button>
        </div>
        <div class="date-window-dialog-actions">
          <ha-button class="date-window-dialog-delete" id="date-window-delete" hidden>Delete date window</ha-button>
          <div class="date-window-dialog-actions-right">
            <ha-button class="date-window-dialog-cancel" id="date-window-cancel">Cancel</ha-button>
            <ha-button raised class="date-window-dialog-submit" id="date-window-submit">Create date window</ha-button>
          </div>
        </div>
      </div>
    `;
    dialog.addEventListener("closed", () => this._closeDateWindowDialog(true));
    this.shadowRoot.appendChild(dialog);
    this._dateWindowDialogEl = dialog;
    this._dateWindowDialogNameEl = dialog.querySelector("#date-window-name");
    this._dateWindowDialogStartEl = dialog.querySelector("#date-window-start");
    this._dateWindowDialogEndEl = dialog.querySelector("#date-window-end");
    this._dateWindowDialogShortcutsEl = dialog.querySelector("#date-window-shortcuts");
    if (this._hass && this._dateWindowDialogNameEl) {
      this._dateWindowDialogNameEl.hass = this._hass;
    }
    dialog.querySelector("#date-window-cancel")?.addEventListener("click", () => this._closeDateWindowDialog());
    dialog.querySelector("#date-window-submit")?.addEventListener("click", () => this._createDateWindowFromDialog());
    dialog.querySelector("#date-window-delete")?.addEventListener("click", () => this._deleteEditingDateWindow());
    this._dateWindowDialogStartEl?.addEventListener("change", () => this._handleDateWindowDialogInputChange());
    this._dateWindowDialogEndEl?.addEventListener("change", () => this._handleDateWindowDialogInputChange());
    dialog.querySelector("#date-window-previous")?.addEventListener("click", () => this._applyDateWindowShortcut(-1));
    dialog.querySelector("#date-window-next")?.addEventListener("click", () => this._applyDateWindowShortcut(1));
  }

  _openDateWindowDialog(targetWindow = null) {
    this._ensureDateWindowDialog();
    this._dateWindowDialogOpen = true;
    this._editingDateWindowId = targetWindow?.id || null;
    const dialogStart = targetWindow ? parseDateValue(targetWindow.start_time) : this._startTime;
    const dialogEnd = targetWindow ? parseDateValue(targetWindow.end_time) : this._endTime;
    this._dateWindowDialogDraftRange = dialogStart && dialogEnd && dialogStart < dialogEnd
      ? { start: new Date(dialogStart), end: new Date(dialogEnd) }
      : null;

    // Prefer the new LitElement component if mounted.
    if (this._dateWindowDialogComp) {
      this._dateWindowDialogComp.heading = targetWindow ? "Edit date window" : "Add date window";
      this._dateWindowDialogComp.submitLabel = targetWindow ? "Save date window" : "Create date window";
      this._dateWindowDialogComp.showDelete = !!targetWindow;
      this._dateWindowDialogComp.showShortcuts = !targetWindow;
      this._dateWindowDialogComp.name = targetWindow?.label || "";
      this._dateWindowDialogComp.startValue = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.start || null);
      this._dateWindowDialogComp.endValue = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.end || null);
      this._dateWindowDialogComp.open = true;
      return;
    }

    // Legacy ha-dialog fallback (used when _dateWindowDialogComp is not available).
    if (this._dateWindowDialogEl) {
      this._dateWindowDialogEl.open = true;
      this._dateWindowDialogEl.headerTitle = targetWindow ? "Edit date window" : "Add date window";
    }
    const submitButton = this._dateWindowDialogEl?.querySelector("#date-window-submit");
    if (submitButton) {
      submitButton.textContent = targetWindow ? "Save date window" : "Create date window";
    }
    const deleteButton = this._dateWindowDialogEl?.querySelector("#date-window-delete");
    if (deleteButton) {
      deleteButton.hidden = !targetWindow;
      deleteButton.style.display = targetWindow ? "" : "none";
    }
    if (this._dateWindowDialogShortcutsEl) {
      this._dateWindowDialogShortcutsEl.hidden = !!targetWindow;
    }
    if (this._dateWindowDialogNameEl) {
      this._dateWindowDialogNameEl.value = targetWindow?.label || "";
    }
    this._syncDateWindowDialogInputs();
    window.requestAnimationFrame(() => this._dateWindowDialogNameEl?.focus());
  }

  _closeDateWindowDialog(fromClosedEvent = false) {
    this._dateWindowDialogOpen = false;
    this._editingDateWindowId = null;
    this._dateWindowDialogDraftRange = null;
    this._pendingAnomalyComparisonWindowEntityId = null;
    if (!fromClosedEvent) {
      if (this._dateWindowDialogComp) {
        this._dateWindowDialogComp.open = false;
      } else if (this._dateWindowDialogEl) {
        this._dateWindowDialogEl.open = false;
      }
    }
  }

  _createDateWindowFromDialog(overrides = {}) {
    // Accept optional overrides from the LitElement component's dp-window-submit event.
    const rawName = overrides.name != null ? overrides.name : (this._dateWindowDialogNameEl?.value || "");
    const label = String(rawName).trim();
    const parsedStart = overrides.start ? this._parseDateWindowInputValue(overrides.start) : null;
    const parsedEnd = overrides.end ? this._parseDateWindowInputValue(overrides.end) : null;
    const start = parsedStart || this._dateWindowDialogDraftRange?.start || null;
    const end = parsedEnd || this._dateWindowDialogDraftRange?.end || null;
    if (!label || !start || !end || start >= end) return;
    const existingIds = new Set(this._comparisonWindows.map((window) => window.id));
    const nextWindow = {
      id: this._editingDateWindowId || makeDateWindowId(label, existingIds),
      label,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
    this._comparisonWindows = normalizeDateWindows(
      this._editingDateWindowId
        ? this._comparisonWindows.map((window) => window.id === this._editingDateWindowId ? nextWindow : window)
        : [...this._comparisonWindows, nextWindow]
    );
    this._saveUserPreferences();
    this._saveSessionState();
    this._updateUrl({ push: false });
    const pendingEntityId = this._pendingAnomalyComparisonWindowEntityId;
    const wasCreatingNew = !this._editingDateWindowId;
    this._pendingAnomalyComparisonWindowEntityId = null;
    this._closeDateWindowDialog();
    if (pendingEntityId && wasCreatingNew) {
      this._setSeriesAnalysisOption(pendingEntityId, "anomaly_comparison_window_id", nextWindow.id);
    }
    this._renderContent();
  }

  async _deleteDateWindow(id) {
    if (!id) return;
    const windowToDelete = this._comparisonWindows.find((window) => window.id === id);
    const confirmed = await confirmDestructiveAction(this, {
      title: "Delete date window",
      message: `Delete "${windowToDelete?.label || "this date window"}"?`,
      confirmLabel: "Delete date window",
    });
    if (!confirmed) return false;
    const nextWindows = this._comparisonWindows.filter((window) => window.id !== id);
    if (nextWindows.length === this._comparisonWindows.length) return false;
    if (this._hoveredComparisonWindowId === id) {
      this._hoveredComparisonWindowId = null;
    }
    if (this._selectedComparisonWindowId === id) {
      this._selectedComparisonWindowId = null;
      this._clearDeltaAnalysisSelectionState();
    }
    if (this._hoveredComparisonWindowId == null) {
      this._updateComparisonRangePreview();
    }
    this._comparisonWindows = nextWindows;
    this._saveUserPreferences();
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderContent();
    return true;
  }

  async _deleteEditingDateWindow() {
    const id = this._editingDateWindowId;
    if (!id) return;
    const deleted = await this._deleteDateWindow(id);
    if (deleted) this._closeDateWindowDialog();
  }

  _handleComparisonTabHover(id) {
    if (!id || this._hoveredComparisonWindowId === id) {
      return;
    }
    this._hoveredComparisonWindowId = id;
    this._updateComparisonRangePreview();
    this._updateChartHoverIndicator();
    this._renderContent();
  }

  _handleComparisonTabLeave(id) {
    if (!id || this._hoveredComparisonWindowId !== id) {
      return;
    }
    this._hoveredComparisonWindowId = null;
    this._updateComparisonRangePreview();
    this._updateChartHoverIndicator();
    this._renderContent();
  }

  _handleComparisonLoading(ev) {
    const ids = Array.isArray(ev?.detail?.ids) ? ev.detail.ids.filter(Boolean) : [];
    const loading = ev?.detail?.loading === true;
    this._loadingComparisonWindowIds = loading
      ? [...new Set([...this._loadingComparisonWindowIds, ...ids])]
      : this._loadingComparisonWindowIds.filter((id) => !ids.includes(id));
    this._renderComparisonTabs();
  }

  _handleAnalysisComputing(ev) {
    const computing = ev?.detail?.computing === true;
    const entityIds = Array.isArray(ev?.detail?.entityIds) ? ev.detail.entityIds : [];
    if (computing) {
      for (const id of entityIds) {
        if (this._analysisSpinnerTimers?.[id]) {
          clearTimeout(this._analysisSpinnerTimers[id]);
          delete this._analysisSpinnerTimers[id];
        }
        const spinners = this.shadowRoot?.querySelectorAll(`.analysis-computing-spinner[data-analysis-spinner="${CSS.escape(id)}"]`) || [];
        spinners.forEach((el) => el.classList.add("active"));
      }
    } else {
      for (const id of entityIds) {
        if (this._analysisSpinnerTimers?.[id]) {
          clearTimeout(this._analysisSpinnerTimers[id]);
          delete this._analysisSpinnerTimers[id];
        }
        const spinners = this.shadowRoot?.querySelectorAll(`.analysis-computing-spinner[data-analysis-spinner="${CSS.escape(id)}"]`) || [];
        spinners.forEach((el) => el.classList.remove("active"));
      }
    }
  }

  _clearDeltaAnalysisSelectionState() {
    return;
  }

  _handleComparisonTabActivate(id) {
    if (!id || id === "current-range") {
      this._selectedComparisonWindowId = null;
      this._hoveredComparisonWindowId = null;
      this._clearDeltaAnalysisSelectionState();
      this._updateComparisonRangePreview();
      this._renderComparisonTabs();
      if (this._chartEl) {
        this._chartEl._adjustComparisonAxisScale = false;
      }
      this._renderContent();
      return;
    }
    const targetWindow = this._comparisonWindows.find((window) => window.id === id);
    if (!targetWindow) {
      return;
    }
    this._selectedComparisonWindowId = this._selectedComparisonWindowId === id ? null : id;
    if (!this._selectedComparisonWindowId) {
      this._clearDeltaAnalysisSelectionState();
    }
    this._updateComparisonRangePreview();
    this._updateChartHoverIndicator();
    this._renderContent();
  }

  _syncSidebarUi() {
    this._pageContentEl?.classList.toggle("sidebar-collapsed", this._sidebarCollapsed);
    this._pageSidebarEl?.classList.toggle("collapsed", this._sidebarCollapsed);
    const label = this._sidebarCollapsed ? "Expand targets sidebar" : "Collapse targets sidebar";
    if (this._sidebarToggleButtonEl) {
      this._sidebarToggleButtonEl.label = label;
    }
  }

  _applyContentSplitLayout() {
    const content = this.shadowRoot?.getElementById("content");
    if (!content) return;
    content.style.setProperty("--content-top-size", `${Math.round(this._contentSplitRatio * 1000) / 10}%`);
    this._updateComparisonTabsOverflow();
  }

  _beginContentSplitPointer(ev) {
    if (ev.button !== 0 || !this._contentSplitterEl) return;
    ev.preventDefault();
    this._contentSplitPointerId = ev.pointerId;
    this._contentSplitterEl.classList.add("dragging");
    window.addEventListener("pointermove", this._onContentSplitPointerMove);
    window.addEventListener("pointerup", this._onContentSplitPointerUp);
    window.addEventListener("pointercancel", this._onContentSplitPointerUp);
  }

  _handleContentSplitPointerMove(ev) {
    if (this._contentSplitPointerId == null || ev.pointerId !== this._contentSplitPointerId) return;
    const content = this.shadowRoot?.getElementById("content");
    if (!content) return;
    const rect = content.getBoundingClientRect();
    if (!rect.height) return;
    const topMinPx = 280;
    const bottomMinPx = 240;
    const splitterPx = 24;
    const minRatio = clampNumber(topMinPx / rect.height, 0, 1);
    const maxRatio = clampNumber((rect.height - bottomMinPx - splitterPx) / rect.height, 0, 1);
    const ratio = clampNumber((ev.clientY - rect.top) / rect.height, minRatio, Math.max(minRatio, maxRatio));
    this._contentSplitRatio = ratio;
    this._applyContentSplitLayout();
    ev.preventDefault();
  }

  _finishContentSplitPointer(ev) {
    if (this._contentSplitPointerId == null || ev.pointerId !== this._contentSplitPointerId) return;
    this._contentSplitPointerId = null;
    this._contentSplitterEl?.classList.remove("dragging");
    window.removeEventListener("pointermove", this._onContentSplitPointerMove);
    window.removeEventListener("pointerup", this._onContentSplitPointerUp);
    window.removeEventListener("pointercancel", this._onContentSplitPointerUp);
    this._saveSessionState();
    window.requestAnimationFrame(() => this._syncRangeControl());
  }

  _toggleSidebarCollapsed() {
    this._sidebarCollapsed = !this._sidebarCollapsed;
    if (!this._sidebarCollapsed) {
      this._hideCollapsedTargetPopup();
    }
    this._saveSessionState();
    this._syncSidebarUi();
    window.requestAnimationFrame(() => {
      if (!this.isConnected) return;
      this._syncRangeControl();
    });
  }

  _handleCollapsedSidebarClick(ev) {
    if (!this._sidebarCollapsed) return;
    if (ev.target?.closest?.(".history-targets-collapsed-item")) return;
    if (ev.target?.closest?.(".sidebar-toggle-button")) return;
    this._toggleSidebarCollapsed();
  }

  _setDatapointScope(scope) {
    const nextScope = scope === "all" ? "all" : scope === "hidden" ? "hidden" : "linked";
    if (nextScope === this._datapointScope) return;
    this._datapointScope = nextScope;
    this._timelineEvents = [];
    this._timelineEventsKey = "";
    this._saveSessionState();
    this._renderSidebarOptions();
    this._updateUrl({ push: false });
    void this._ensureTimelineEvents();
    this._renderContent();
  }

  _setChartYAxisMode(mode) {
    const nextDelink = mode === "unique";
    const nextSplit = mode === "split";
    if (this._delinkChartYAxis === nextDelink && this._splitChartView === nextSplit) {
      return;
    }
    this._delinkChartYAxis = nextDelink;
    this._splitChartView = nextSplit;
    this._saveSessionState();
    this._renderSidebarOptions();
    this._renderContent();
  }

  _setChartDatapointDisplayOption(kind, enabled) {
    const normalized = !!enabled;
    if (kind === "icons") {
      if (this._showChartDatapointIcons === normalized) return;
      this._showChartDatapointIcons = normalized;
    } else if (kind === "lines") {
      if (this._showChartDatapointLines === normalized) return;
      this._showChartDatapointLines = normalized;
    } else if (kind === "tooltips") {
      if (this._showChartTooltips === normalized) return;
      this._showChartTooltips = normalized;
    } else if (kind === "hover_guides") {
      if (this._showChartEmphasizedHoverGuides === normalized) return;
      this._showChartEmphasizedHoverGuides = normalized;
    } else if (kind === "correlated_anomalies") {
      if (this._showCorrelatedAnomalies === normalized) return;
      this._showCorrelatedAnomalies = normalized;
    } else if (kind === "delink_y_axis") {
      if (this._delinkChartYAxis === normalized) return;
      this._delinkChartYAxis = normalized;
      if (normalized) {
        this._splitChartView = false;
      }
    } else if (kind === "split_chart_view") {
      if (this._splitChartView === normalized) return;
      this._splitChartView = normalized;
      if (normalized) {
        this._delinkChartYAxis = false;
      }
    } else if (kind === "data_gaps") {
      if (this._showDataGaps === normalized) return;
      this._showDataGaps = normalized;
    } else if (kind === "data_gap_threshold") {
      const value = String(enabled);
      if (this._dataGapThreshold === value) return;
      this._dataGapThreshold = value;
    } else {
      return;
    }
    this._saveSessionState();
    this._renderSidebarOptions();
    this._renderContent();
  }

  async _ensureHistoryBounds() {
    if (!this._hass || this._historyBoundsLoaded || this._historyBoundsPromise) return;
    this._historyBoundsPromise = fetchEventBounds(this._hass)
      .then(({ start, end }) => {
        this._historyStartTime = parseDateValue(start);
        this._historyEndTime = parseDateValue(end);
        this._historyBoundsLoaded = true;
        if (this._zoomLevel === "auto") {
          this._resolvedAutoZoomLevel = null;
        }
        if (this._rendered) {
          this._syncControls();
        }
      })
      .catch((err) => {
        console.warn("[hass-datapoints] failed to load event bounds:", err);
        this._historyBoundsLoaded = true;
      })
      .finally(() => {
        this._historyBoundsPromise = null;
      });
  }

  async _ensureTimelineEvents() {
    if (!this._hass || !this._rangeBounds) return;
    if (this._datapointScope === "hidden") {
      this._timelineEvents = [];
      this._timelineEventsKey = "";
      if (this._rendered && this._panelTimelineEl) this._panelTimelineEl.events = [];
      return;
    }
    const startIso = new Date(this._rangeBounds.min).toISOString();
    const endIso = new Date(this._rangeBounds.max).toISOString();
    const key = `${startIso}|${endIso}|${this._datapointScope}|${this._entities.join(",")}`;
    if (this._timelineEventsKey === key || this._timelineEventsPromise) return;

    this._timelineEventsPromise = fetchEvents(
      this._hass,
      startIso,
      endIso,
      this._datapointScope === "linked" ? this._entities : undefined,
    )
      .then((events) => {
        this._timelineEvents = Array.isArray(events) ? events : [];
        this._timelineEventsKey = key;
        if (this._rendered && this._panelTimelineEl) this._panelTimelineEl.events = this._timelineEvents;
      })
      .catch((err) => {
        console.warn("[hass-datapoints] failed to load timeline events:", err);
      })
      .finally(() => {
        this._timelineEventsPromise = null;
      });
  }

  async _ensureUserPreferences() {
    if (!this._hass || this._preferencesLoaded || this._preferencesPromise) return;
    this._preferencesPromise = fetchUserData(this._hass, PANEL_HISTORY_PREFERENCES_KEY, null)
      .then((preferences) => {
        const normalized = normalizeHistoryPagePreferences(preferences, {
          zoomOptions: RANGE_ZOOM_OPTIONS,
          snapOptions: RANGE_SNAP_OPTIONS,
        });
        this._zoomLevel = normalized.zoomLevel;
        this._dateSnapping = normalized.dateSnapping;
        this._resolvedAutoZoomLevel = normalized.zoomLevel === "auto" ? null : this._resolvedAutoZoomLevel;
        this._preferredSeriesColors = normalized.preferredSeriesColors;
        this._comparisonWindows = this._comparisonWindows.length
          ? this._comparisonWindows
          : normalized.comparisonWindows;
        this._seriesRows = this._applyPreferredSeriesColors(this._seriesRows);
        this._preferencesLoaded = true;
        if (normalized.shouldPersistDefaults) this._saveUserPreferences();
        if (this._rendered) {
          this._renderTargetRows();
          this._syncControls();
          this._updateUrl({ push: false });
          this._renderContent();
        }
      })
      .catch((err) => {
        console.warn("[hass-datapoints] failed to load panel preferences:", err);
        this._preferencesLoaded = true;
      })
      .finally(() => {
        this._preferencesPromise = null;
      });
  }

  _saveUserPreferences() {
    if (!this._hass) {
      return;
    }
    const payload = buildHistoryPagePreferencesPayload(this);
    this._preferredSeriesColors = payload.series_colors;
    void saveUserData(this._hass, PANEL_HISTORY_PREFERENCES_KEY, payload);
  }

  _mountControls() {
    const targetSlot = this.shadowRoot.getElementById("target-slot");
    const dateSlot = this.shadowRoot.getElementById("date-slot");
    if (!targetSlot || !dateSlot) return;

    targetSlot.innerHTML = `
      <div class="history-targets">
        <div class="sidebar-section-header history-targets-header">
          <div class="sidebar-section-title">Targets</div>
          <div class="sidebar-section-subtitle">Each row controls one chart series.</div>
        </div>
        <div id="target-rows" class="history-target-rows"></div>
        <div id="target-picker-slot" class="history-target-picker-slot"></div>
        <div id="target-collapsed-summary" class="history-targets-collapsed-summary"></div>
      </div>
    `;
    dateSlot.innerHTML = "";
    this._targetRowsEl = targetSlot.querySelector("#target-rows");
    const pickerSlot = targetSlot.querySelector("#target-picker-slot");

    // Create the dp-target-row-list element once and wire events at creation time.
    const rowListEl = document.createElement("dp-target-row-list");
    rowListEl.rows = [];
    rowListEl.states = {};
    rowListEl.hass = this._hass ?? null;
    rowListEl.canShowDeltaAnalysis = false;
    rowListEl.comparisonWindows = [];
    rowListEl.addEventListener("dp-row-color-change", (ev) => {
      const { index, color } = ev.detail || {};
      this._updateSeriesRowColor(index, color);
    });
    rowListEl.addEventListener("dp-row-visibility-change", (ev) => {
      const { entityId, visible } = ev.detail || {};
      this._updateSeriesRowVisibilityByEntityId(entityId, visible);
    });
    rowListEl.addEventListener("dp-row-remove", (ev) => {
      const { index } = ev.detail || {};
      this._removeSeriesRow(index);
    });
    rowListEl.addEventListener("dp-row-toggle-analysis", (ev) => {
      const { entityId } = ev.detail || {};
      this._toggleSeriesAnalysisExpanded(entityId);
    });
    rowListEl.addEventListener("dp-row-analysis-change", (ev) => {
      const { entityId, key, value } = ev.detail || {};
      this._setSeriesAnalysisOption(entityId, key, value);
    });
    rowListEl.addEventListener("dp-rows-reorder", (ev) => {
      const { rows } = ev.detail || {};
      if (!Array.isArray(rows)) { return; }
      this._seriesRows = rows;
      this._syncSeriesState();
      this._saveSessionState();
      this._renderTargetRows();
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    });
    this._targetRowsEl.appendChild(rowListEl);
    this._rowListEl = rowListEl;

    const targetControl = document.createElement("ha-target-picker");
    targetControl.style.display = "block";
    targetControl.style.width = "100%";
    if (this._hass) targetControl.hass = this._hass;
    targetControl.addEventListener("value-changed", (ev) => {
      const hasValue = ev.detail && Object.prototype.hasOwnProperty.call(ev.detail, "value");
      if (!hasValue) return;
      const rawValue = normalizeTargetValue(ev.detail.value);
      const nextEntityIds = resolveEntityIdsFromTarget(this._hass, rawValue);
      if (!nextEntityIds.length) return;
      this._addSeriesRows(nextEntityIds);
      targetControl.value = {};
      this._saveSessionState();
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    });
    pickerSlot.appendChild(targetControl);
    this._targetControl = targetControl;
    ensureHaComponents(["ha-target-picker"]).then(() => {
      if (!this.isConnected || this._targetControl !== targetControl) return;
      if (this._hass) targetControl.hass = this._hass;
      targetControl.value = {};
    });

    const dateControl = document.createElement("div");
    dateControl.className = "range-control";
    dateControl.innerHTML = `
      <div class="range-toolbar">
        <dp-panel-timeline id="range-panel-timeline"></dp-panel-timeline>
        <div class="range-picker-wrap">
          <ha-icon-button id="range-picker-button" class="range-picker-button" label="Select date range" aria-haspopup="dialog" aria-expanded="false">
            <ha-icon icon="mdi:calendar-range"></ha-icon>
          </ha-icon-button>
          <dp-floating-menu id="range-picker-menu" style="--floating-menu-width: min(340px, calc(100vw - 32px)); --floating-menu-padding: var(--dp-spacing-md, 16px);">
            <ha-date-range-picker id="range-picker" class="range-picker"></ha-date-range-picker>
          </dp-floating-menu>
        </div>
        <div class="range-options-wrap">
          <ha-icon-button id="range-options-button" class="range-options-button" label="Timeline options" aria-haspopup="menu" aria-expanded="false">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <dp-floating-menu id="range-options-menu" style="--floating-menu-width: 280px; --floating-menu-max-height: min(70vh, 520px); --floating-menu-overflow: auto; --floating-menu-padding: var(--dp-spacing-sm, 8px);">
            <div class="range-options-view" data-options-view="root">
              <div class="range-options-list">
                <button type="button" class="range-submenu-trigger" data-options-submenu="zoom">
                  <span class="range-option-label">Zoom level</span>
                  <span class="range-submenu-meta" data-options-current="zoom"></span>
                </button>
                <button type="button" class="range-submenu-trigger" data-options-submenu="snap">
                  <span class="range-option-label">Date snapping</span>
                  <span class="range-submenu-meta" data-options-current="snap"></span>
                </button>
              </div>
            </div>
            <div class="range-options-view" data-options-view="zoom" hidden>
              <div class="range-options-header">
                <button type="button" class="range-options-header-trigger" data-options-back>
                  <span class="range-options-back" aria-hidden="true">
                    <span>‹</span>
                  </span>
                  <div class="range-options-title">Zoom level</div>
                </button>
              </div>
              <div class="range-options-list">
                ${RANGE_ZOOM_OPTIONS.map((option) => `
                  <button type="button" class="range-option" data-option-group="zoom" data-option-value="${option.value}">
                    <span class="range-option-label">${option.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="range-options-view" data-options-view="snap" hidden>
              <div class="range-options-header">
                <button type="button" class="range-options-header-trigger" data-options-back>
                  <span class="range-options-back" aria-hidden="true">
                    <span>‹</span>
                  </span>
                  <div class="range-options-title">Date snapping</div>
                </button>
              </div>
              <div class="range-options-list">
                ${RANGE_SNAP_OPTIONS.map((option) => `
                  <button type="button" class="range-option" data-option-group="snap" data-option-value="${option.value}">
                    <span class="range-option-label">${option.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          </dp-floating-menu>
        </div>
      </div>
    `;
    this._panelTimelineEl = dateControl.querySelector("#range-panel-timeline");
    this._dateRangePickerEl = dateControl.querySelector("#range-picker");
    this._datePickerButtonEl = dateControl.querySelector("#range-picker-button");
    this._datePickerMenuEl = dateControl.querySelector("#range-picker-menu");
    this._optionsButtonEl = dateControl.querySelector("#range-options-button");
    this._optionsMenuEl = dateControl.querySelector("#range-options-menu");
    this._panelTimelineEl.addEventListener("dp-range-commit", (ev) => {
      this._applyCommittedRange(ev.detail.start, ev.detail.end, { push: ev.detail.push ?? false });
    });
    this._panelTimelineEl.addEventListener("dp-range-draft", (ev) => {
      this._scheduleAutoZoomUpdate(ev.detail.start, ev.detail.end);
    });
    this._datePickerButtonEl.addEventListener("click", () => this._toggleDatePickerMenu());
    this._datePickerMenuEl?.addEventListener("dp-menu-close", () => this._toggleDatePickerMenu(false));
    this._dateRangePickerEl.addEventListener("change", (ev) => this._handleDatePickerChange(ev));
    this._dateRangePickerEl.addEventListener("value-changed", (ev) => this._handleDatePickerChange(ev));
    this._optionsButtonEl.addEventListener("click", () => this._toggleOptionsMenu());
    this._optionsMenuEl?.addEventListener("dp-menu-close", () => this._toggleOptionsMenu(false));
    this._optionsMenuEl.querySelectorAll("[data-options-submenu]").forEach((button) => {
      button.addEventListener("click", () => this._setOptionsMenuView(button.dataset.optionsSubmenu || "root"));
    });
    this._optionsMenuEl.querySelectorAll("[data-options-back]").forEach((button) => {
      button.addEventListener("click", () => this._setOptionsMenuView("root"));
    });
    this._optionsMenuEl.querySelectorAll("[data-option-group]").forEach((button) => {
      button.addEventListener("click", () => this._handleOptionSelect(button));
    });
    dateSlot.appendChild(dateControl);
    this._dateControl = dateControl;

    // Create the dp-sidebar-options element once and wire events at creation time.
    if (this._sidebarOptionsEl) {
      const sidebarComp = document.createElement("dp-sidebar-options");
      sidebarComp.addEventListener("dp-scope-change", (ev) => {
        const { value } = ev.detail || {};
        if (value) {
          this._setDatapointScope(value);
        }
      });
      sidebarComp.addEventListener("dp-display-change", (ev) => {
        const { kind, value } = ev.detail || {};
        if (!kind) { return; }
        if (kind === "y_axis_mode") {
          this._setChartYAxisMode(value);
        } else {
          this._setChartDatapointDisplayOption(kind, value);
        }
      });
      this._sidebarOptionsEl.appendChild(sidebarComp);
      this._sidebarOptionsComp = sidebarComp;
    }

    // Create the dp-date-window-dialog element once and wire events at creation time.
    if (this.shadowRoot) {
      const dialogComp = document.createElement("dp-date-window-dialog");
      dialogComp.addEventListener("dp-window-close", () => this._closeDateWindowDialog());
      dialogComp.addEventListener("dp-window-submit", (ev) => {
        this._createDateWindowFromDialog(ev.detail || {});
      });
      dialogComp.addEventListener("dp-window-delete", () => this._deleteEditingDateWindow());
      dialogComp.addEventListener("dp-window-shortcut", (ev) => {
        this._applyDateWindowShortcut(ev.detail.direction);
      });
      dialogComp.addEventListener("dp-window-date-change", (ev) => {
        const start = this._parseDateWindowInputValue(ev.detail?.start || "");
        const end = this._parseDateWindowInputValue(ev.detail?.end || "");
        if (start && end && start < end) {
          this._dateWindowDialogDraftRange = { start, end };
        } else {
          this._dateWindowDialogDraftRange = null;
        }
      });
      this.shadowRoot.appendChild(dialogComp);
      this._dateWindowDialogComp = dialogComp;
    }

    this._syncControls();
  }

  _renderTargetRows() {
    if (!this._targetRowsEl) return;
    const collapsedSummaryEl = this.shadowRoot?.getElementById("target-collapsed-summary");

    // Update the dp-target-row-list element properties.
    if (this._rowListEl) {
      this._rowListEl.rows = this._seriesRows;
      this._rowListEl.states = this._hass?.states ?? {};
      this._rowListEl.hass = this._hass ?? null;
      this._rowListEl.canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
      this._rowListEl.comparisonWindows = this._comparisonWindows;
    }

    // Render the collapsed sidebar summary (unchanged — not migrated to dp-target-row-list).
    if (collapsedSummaryEl) {
      if (!this._seriesRows.length) {
        collapsedSummaryEl.innerHTML = `<div class="history-targets-collapsed-empty" title="No targets selected"></div>`;
      } else {
        collapsedSummaryEl.innerHTML = this._seriesRows.map((row, index) => {
          const label = entityName(this._hass, row.entity_id) || row.entity_id;
          const itemId = `collapsed-series-${index}`;
          return `
            <button
              type="button"
              id="${itemId}"
              class="history-targets-collapsed-item ${row.visible === false ? "is-hidden" : ""}"
              data-series-collapsed-entity-id="${esc(row.entity_id)}"
              style="--row-color:${esc(row.color)}"
              aria-label="${esc(label)}"
              aria-pressed="${row.visible === false ? "false" : "true"}"
            >
              <ha-state-icon
                data-series-collapsed-icon-entity-id="${esc(row.entity_id)}"
                aria-hidden="true"
              ></ha-state-icon>
            </button>
            <ha-tooltip for="${itemId}" placement="right" distance="4">${esc(label)}</ha-tooltip>
          `;
        }).join("");

        collapsedSummaryEl.querySelectorAll("[data-series-collapsed-icon-entity-id]").forEach((iconEl) => {
          const entityId = iconEl.dataset.seriesCollapsedIconEntityId;
          if (!entityId) { return; }
          iconEl.stateObj = this._hass?.states?.[entityId];
          iconEl.hass = this._hass;
        });
        collapsedSummaryEl.querySelectorAll("[data-series-collapsed-entity-id]").forEach((button) => {
          button.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const entityId = String(button.dataset.seriesCollapsedEntityId || "");
            if (this._collapsedPopupEntityId === entityId) {
              this._hideCollapsedTargetPopup();
            } else {
              this._showCollapsedTargetPopup(entityId, button);
            }
          });
        });
      }
    }

    this._refreshCollapsedTargetPopup();
  }

  _addSeriesRows(entityIds) {
    const merged = new Map(this._seriesRows.map((row) => [row.entity_id, row]));
    normalizeEntityIds(entityIds).forEach((entityId, index) => {
      if (merged.has(entityId)) return;
      merged.set(entityId, {
        entity_id: entityId,
        color: this._preferredSeriesColors?.[entityId] && /^#[0-9a-f]{6}$/i.test(this._preferredSeriesColors[entityId])
          ? this._preferredSeriesColors[entityId]
          : COLORS[(merged.size + index) % COLORS.length],
        visible: true,
        analysis: normalizeHistorySeriesAnalysis(null),
      });
    });
    this._seriesRows = [...merged.values()];
    this._syncSeriesState();
    this._renderTargetRows();
  }

  _updateSeriesRowColor(index, color) {
    if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
    if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
    if (this._seriesRows[index].color === color) return;
    this._seriesRows[index] = { ...this._seriesRows[index], color };
    this._saveUserPreferences();
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderContent();
  }

  _updateSeriesRowVisibility(index, visible) {
    if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
    if (this._seriesRows[index].visible === !!visible) return;
    this._seriesRows[index] = { ...this._seriesRows[index], visible: !!visible };
    this._saveSessionState();
    this._renderTargetRows();
    this._renderContent();
  }

  /** Open (or re-render) the collapsed-sidebar target popup for *entityId*,
   *  anchored to *anchorEl*.  Wires all the same controls as the full sidebar row. */
  _showCollapsedTargetPopup(entityId, anchorEl) {
    const popup = this.shadowRoot?.getElementById("collapsed-target-popup");
    if (!popup) {
      return;
    }
    const index = this._seriesRows.findIndex((r) => r.entity_id === entityId);
    if (index < 0) {
      this._hideCollapsedTargetPopup();
      return;
    }
    const row = this._seriesRows[index];

    // Store state for refresh after re-renders
    this._collapsedPopupEntityId = entityId;
    this._collapsedPopupAnchorEl = anchorEl;

    // Mount a dp-target-row — replacing the old _buildSingleRowHTML + data-attribute wiring.
    popup.innerHTML = "";
    const targetRow = document.createElement("dp-target-row");
    targetRow.color = row.color;
    targetRow.visible = row.visible !== false;
    targetRow.analysis = row.analysis || {};
    targetRow.index = index;
    targetRow.stateObj = this._hass?.states?.[row.entity_id] ?? null;
    targetRow.hass = this._hass ?? null;
    targetRow.canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
    targetRow.comparisonWindows = this._comparisonWindows || [];
    targetRow.addEventListener("dp-row-color-change", (ev) => {
      this._updateSeriesRowColor(ev.detail.index, ev.detail.color);
    });
    targetRow.addEventListener("dp-row-visibility-change", (ev) => {
      this._updateSeriesRowVisibilityByEntityId(ev.detail.entityId, ev.detail.visible);
    });
    targetRow.addEventListener("dp-row-toggle-analysis", (ev) => {
      this._toggleSeriesAnalysisExpanded(ev.detail.entityId);
    });
    targetRow.addEventListener("dp-row-analysis-change", (ev) => {
      this._setSeriesAnalysisOption(ev.detail.entityId, ev.detail.key, ev.detail.value);
    });
    targetRow.addEventListener("dp-row-remove", (ev) => {
      this._hideCollapsedTargetPopup();
      this._removeSeriesRow(ev.detail.index);
    });
    popup.appendChild(targetRow);

    // Position the popup to the right of the anchor button
    popup.removeAttribute("hidden");
    const anchorRect = anchorEl.getBoundingClientRect();
    const popupHeight = popup.offsetHeight;
    const top = Math.min(anchorRect.top, window.innerHeight - popupHeight - 16);
    popup.style.top = `${Math.max(8, top)}px`;
    popup.style.left = `${anchorRect.right + 8}px`;

    // Dismiss on outside click (uses composedPath to handle shadow DOM)
    if (this._collapsedPopupOutsideClickHandler) {
      document.removeEventListener("click", this._collapsedPopupOutsideClickHandler, true);
    }
    this._collapsedPopupOutsideClickHandler = (ev) => {
      const path = ev.composedPath();
      if (!path.includes(popup) && !path.includes(anchorEl)) {
        this._hideCollapsedTargetPopup();
      }
    };
    document.addEventListener("click", this._collapsedPopupOutsideClickHandler, true);

    // Dismiss on Escape key
    if (this._collapsedPopupKeyHandler) {
      document.removeEventListener("keydown", this._collapsedPopupKeyHandler);
    }
    this._collapsedPopupKeyHandler = (ev) => {
      if (ev.key === "Escape") {
        this._hideCollapsedTargetPopup();
        anchorEl.focus();
      }
    };
    document.addEventListener("keydown", this._collapsedPopupKeyHandler);
  }

  /** Close the collapsed-sidebar target popup and clean up all listeners. */
  _hideCollapsedTargetPopup() {
    const popup = this.shadowRoot?.getElementById("collapsed-target-popup");
    if (popup) {
      popup.setAttribute("hidden", "");
      popup.innerHTML = "";
    }
    if (this._collapsedPopupOutsideClickHandler) {
      document.removeEventListener("click", this._collapsedPopupOutsideClickHandler, true);
      this._collapsedPopupOutsideClickHandler = null;
    }
    if (this._collapsedPopupKeyHandler) {
      document.removeEventListener("keydown", this._collapsedPopupKeyHandler);
      this._collapsedPopupKeyHandler = null;
    }
    this._collapsedPopupEntityId = null;
    this._collapsedPopupAnchorEl = null;
  }

  /** Re-render the popup in-place after a state change (e.g. analysis toggle).
   *  Called at the end of _renderTargetRows so the popup stays in sync. */
  _refreshCollapsedTargetPopup() {
    if (!this._collapsedPopupEntityId) {
      return;
    }
    const exists = this._seriesRows.some((r) => r.entity_id === this._collapsedPopupEntityId);
    if (!exists) {
      this._hideCollapsedTargetPopup();
      return;
    }
    // Find the fresh anchor button in the re-rendered collapsed summary
    const collapsedSummaryEl = this.shadowRoot?.getElementById("target-collapsed-summary");
    const newAnchor = collapsedSummaryEl
      ? Array.from(collapsedSummaryEl.querySelectorAll("[data-series-collapsed-entity-id]"))
          .find((btn) => btn.dataset.seriesCollapsedEntityId === this._collapsedPopupEntityId) ?? null
      : null;
    if (!newAnchor) {
      this._hideCollapsedTargetPopup();
      return;
    }
    this._showCollapsedTargetPopup(this._collapsedPopupEntityId, newAnchor);
  }

  _updateSeriesRowVisibilityByEntityId(entityId, visible) {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId) return;
    const index = this._seriesRows.findIndex((row) => row.entity_id === normalizedEntityId);
    if (index === -1) return;
    this._updateSeriesRowVisibility(index, visible);
  }

  _toggleSeriesAnalysisExpanded(entityId) {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId) {
      return;
    }
    const index = this._seriesRows.findIndex((row) => row.entity_id === normalizedEntityId);
    if (index === -1) {
      return;
    }
    const row = this._seriesRows[index];
    const currentAnalysis = normalizeHistorySeriesAnalysis(row.analysis);
    const nextAnalysis = normalizeHistorySeriesAnalysis({
      ...row.analysis,
      expanded: !currentAnalysis.expanded,
    });
    this._seriesRows[index] = {
      ...row,
      analysis: nextAnalysis,
    };
    this._saveSessionState();
    this._renderTargetRows();
  }

  _setSeriesAnalysisOption(entityId, key, value) {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId || !key) {
      return;
    }
    if (key === "anomaly_comparison_window_id" && value === "__add_new__") {
      this._pendingAnomalyComparisonWindowEntityId = normalizedEntityId;
      this._openDateWindowDialog();
      return;
    }
    const index = this._seriesRows.findIndex((row) => row.entity_id === normalizedEntityId);
    if (index === -1) {
      return;
    }
    const row = this._seriesRows[index];
    const analysis = normalizeHistorySeriesAnalysis(row.analysis);

    // Handle method toggle: add/remove a method from anomaly_methods array
    if (key.startsWith("anomaly_method_toggle_")) {
      const method = key.slice("anomaly_method_toggle_".length);
      const currentMethods = analysis.anomaly_methods;
      const nextMethods = value === true
        ? [...new Set([...currentMethods, method])]
        : currentMethods.filter((m) => m !== method);
      key = "anomaly_methods";
      value = nextMethods;
    }

    const nextSource = {
      ...analysis,
      [key]: value,
    };
    if (key === "show_trend_lines" && value !== true) {
      nextSource.show_trend_crosshairs = false;
    }
    if (key === "show_threshold_analysis" && value !== true) {
      nextSource.show_threshold_shading = false;
    }
    if (key === "show_delta_analysis" && value !== true) {
      nextSource.show_delta_tooltip = true;
      nextSource.show_delta_lines = false;
    }
    if (key === "show_anomalies" && value === true && (!Array.isArray(analysis.anomaly_methods) || analysis.anomaly_methods.length === 0)) {
      // Default to trend_residual so anomalies appear immediately on first enable.
      nextSource.anomaly_methods = ["trend_residual"];
    }
    const nextAnalysis = normalizeHistorySeriesAnalysis({
      ...nextSource,
      expanded: true,
    });
    const unchanged = JSON.stringify(nextAnalysis) === JSON.stringify(analysis);
    if (unchanged) {
      return;
    }
    this._seriesRows[index] = {
      ...row,
      analysis: nextAnalysis,
    };
    this._saveSessionState();
    this._renderTargetRows();
    this._renderContent();
  }

  _removeSeriesRow(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
    this._seriesRows = this._seriesRows.filter((_, rowIndex) => rowIndex !== index);
    this._syncSeriesState();
    this._saveSessionState();
    this._renderTargetRows();
    this._syncControls();
    this._updateUrl({ push: true });
    this._renderContent();
  }

  _clearAutoZoomTimer() {
    if (this._autoZoomTimer) {
      window.clearTimeout(this._autoZoomTimer);
      this._autoZoomTimer = null;
    }
  }

  _toggleOptionsMenu(force = !this._optionsOpen) {
    if (force) {
      this._toggleDatePickerMenu(false);
      this._togglePageMenu(false);
    }
    this._optionsOpen = force;
    if (!force) {
      this._optionsMenuView = "root";
    }
    if (this._optionsMenuEl) {
      this._optionsMenuEl.open = force;
      if (force) {
        this._positionFloatingMenu(this._optionsMenuEl, this._optionsButtonEl, 280);
      }
    }
    if (this._optionsButtonEl) {
      this._optionsButtonEl.setAttribute("aria-expanded", String(force));
    }
    this._syncOptionsMenu();
  }

  _toggleDatePickerMenu(force = !this._datePickerOpen) {
    if (force) {
      this._toggleOptionsMenu(false);
      this._togglePageMenu(false);
    }
    this._datePickerOpen = force;
    if (this._datePickerMenuEl) {
      this._datePickerMenuEl.open = force;
      if (force) {
        this._positionFloatingMenu(this._datePickerMenuEl, this._datePickerButtonEl, 320);
      }
    }
    if (this._datePickerButtonEl) {
      this._datePickerButtonEl.setAttribute("aria-expanded", String(force));
    }
  }

  _togglePageMenu(force = !this._pageMenuOpen) {
    if (force) {
      this._toggleDatePickerMenu(false);
      this._toggleOptionsMenu(false);
    }
    this._pageMenuOpen = force;
    if (this._pageMenuEl) {
      this._pageMenuEl.open = force;
      if (force) {
        this._positionPageMenu();
      }
    }
    if (this._pageMenuButtonEl) {
      this._pageMenuButtonEl.setAttribute("aria-expanded", String(force));
    }
  }

  _handleWindowPointerDown(_ev) {
    // Outside-click dismissal for all floating menus is now handled internally
    // by dp-floating-menu via dp-menu-close events.
  }

  _syncOptionsMenu() {
    if (!this._optionsMenuEl) return;
    this._optionsMenuEl.querySelectorAll("[data-options-view]").forEach((view) => {
      view.hidden = view.dataset.optionsView !== this._optionsMenuView;
    });
    const zoomLabel = RANGE_ZOOM_OPTIONS.find((option) => option.value === this._zoomLevel)?.label || "Auto";
    const snapLabel = RANGE_SNAP_OPTIONS.find((option) => option.value === this._dateSnapping)?.label || "Hour";
    const zoomCurrent = this._optionsMenuEl.querySelector("[data-options-current='zoom']");
    const snapCurrent = this._optionsMenuEl.querySelector("[data-options-current='snap']");
    if (zoomCurrent) zoomCurrent.textContent = zoomLabel;
    if (snapCurrent) snapCurrent.textContent = snapLabel;
    this._optionsMenuEl.querySelectorAll("[data-option-group='zoom']").forEach((button) => {
      button.classList.toggle("selected", button.dataset.optionValue === this._zoomLevel);
    });
    this._optionsMenuEl.querySelectorAll("[data-option-group='snap']").forEach((button) => {
      button.classList.toggle("selected", button.dataset.optionValue === this._dateSnapping);
    });
  }

  _setOptionsMenuView(view) {
    this._optionsMenuView = view;
    this._syncOptionsMenu();
  }

  _handleOptionSelect(button) {
    const group = button.dataset.optionGroup;
    const value = button.dataset.optionValue;
    if (!group || !value) return;
    let didChange = false;

    if (group === "zoom" && value !== this._zoomLevel) {
      this._zoomLevel = value;
      this._clearAutoZoomTimer();
      this._resolvedAutoZoomLevel = value === "auto" ? null : this._resolvedAutoZoomLevel;
      this._syncRangeControl();
      didChange = true;
    }
    if (group === "snap" && value !== this._dateSnapping) {
      this._dateSnapping = value;
      this._syncRangeControl();
      didChange = true;
    }
    this._syncOptionsMenu();
    if (didChange) this._saveUserPreferences();
  }

  _handleDatePickerChange(ev) {
    const { start, end } = extractRangeValue(ev);
    if (!start || !end || start >= end) {
      return;
    }
    if (ev.type === "change") {
      this._toggleDatePickerMenu(false);
    }
    this._applyCommittedRange(start, end, { push: true });
  }

  async _downloadSpreadsheet() {
    if (this._exportBusy || !this._hass || !this._startTime || !this._endTime) {
      return;
    }
    this._exportBusy = true;
    this._togglePageMenu(false);
    try {
      await downloadHistorySpreadsheet({
        hass: this._hass,
        entityIds: this._entities,
        startTime: this._startTime,
        endTime: this._endTime,
        datapointScope: this._datapointScope,
      });
    } catch (error) {
      console.error("[hass-datapoints panel] spreadsheet export:failed", error);
    } finally {
      this._exportBusy = false;
    }
  }

  _computeFloatingMenuPosition(anchorEl, menuWidth) {
    const viewportPadding = 8;
    const anchorRect = anchorEl.getBoundingClientRect();
    const left = Math.max(
      viewportPadding,
      Math.min(anchorRect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding),
    );
    const top = Math.max(viewportPadding, anchorRect.bottom + 8);
    return { left, top };
  }

  _positionFloatingMenu(menuEl, anchorEl, minWidth = 0) {
    if (!menuEl || !anchorEl) {
      return;
    }
    const menuWidth = Math.max(minWidth, menuEl.offsetWidth || minWidth || 0);
    const { left, top } = this._computeFloatingMenuPosition(anchorEl, menuWidth);
    menuEl.style.setProperty("--floating-menu-left", `${left}px`);
    menuEl.style.setProperty("--floating-menu-top", `${top}px`);
  }

  _positionPageMenu() {
    if (!this._pageMenuEl || !this._pageMenuButtonEl) {
      return;
    }
    const menuWidth = Math.max(220, this._pageMenuEl.offsetWidth || 220);
    const { left, top } = this._computeFloatingMenuPosition(this._pageMenuButtonEl, menuWidth);
    this._pageMenuEl.style.setProperty("--floating-menu-left", `${left}px`);
    this._pageMenuEl.style.setProperty("--floating-menu-top", `${top}px`);
  }

  _getEffectiveZoomLevel() {
    if (this._zoomLevel !== "auto") return this._zoomLevel;
    if (!this._resolvedAutoZoomLevel) {
      const referenceSpanMs = Math.max(
        (this._endTime?.getTime() || Date.now()) - (this._startTime?.getTime() || Date.now() - RANGE_SLIDER_WINDOW_MS),
        RANGE_SLIDER_MIN_SPAN_MS,
      );
      this._resolvedAutoZoomLevel = this._computeZoomLevelForSpan(referenceSpanMs);
    }
    return this._resolvedAutoZoomLevel;
  }

  _getZoomConfig() {
    return RANGE_ZOOM_CONFIGS[this._getEffectiveZoomLevel()] || RANGE_ZOOM_CONFIGS.month_short;
  }

  _computeZoomLevelForSpan(spanMs) {
    const normalizedSpanMs = Math.max(spanMs, RANGE_SLIDER_MIN_SPAN_MS);
    if (normalizedSpanMs >= 180 * DAY_MS) return "quarterly";
    if (normalizedSpanMs >= 120 * DAY_MS) return "month_compressed";
    if (normalizedSpanMs >= 60 * DAY_MS) return "month_short";
    if (normalizedSpanMs >= 21 * DAY_MS) return "month_expanded";
    if (normalizedSpanMs >= 7 * DAY_MS) return "week_compressed";
    if (normalizedSpanMs >= 2 * DAY_MS) return "week_expanded";
    return "day";
  }

  _getEffectiveSnapUnit() {
    if (this._dateSnapping !== "auto") return this._dateSnapping;
    switch (this._getEffectiveZoomLevel()) {
      case "quarterly":
      case "month_compressed":
        return "month";
      case "month_short":
      case "month_expanded":
      case "week_compressed":
        return "week";
      case "week_expanded":
        return "day";
      case "day":
        return "hour";
      default:
        return "day";
    }
  }

  _getSnapSpanMs(reference = this._startTime || new Date()) {
    const snapUnit = this._getEffectiveSnapUnit();
    const start = startOfUnit(reference, snapUnit);
    const end = endOfUnit(reference, snapUnit);
    return Math.max(SECOND_MS, end.getTime() - start.getTime());
  }

  _deriveRangeBounds() {
    const config = this._getZoomConfig();
    const startMs = this._startTime?.getTime() || Date.now() - 24 * HOUR_MS;
    const endMs = this._endTime?.getTime() || Date.now();
    const historyStartMs = this._historyStartTime?.getTime();
    const historyEndMs = this._historyEndTime?.getTime();
    const maxLookAheadMs = addUnit(new Date(), "month", 3).getTime();

    // Anchor left bound to history start (if loaded) or selection start.
    // Also guarantee enough left context before the selection for centering —
    // take whichever is earlier: the natural anchor or (startMs - 30% baseline).
    const anchorMs = historyStartMs ?? startMs;
    const naturalMin = startOfUnit(new Date(anchorMs), config.boundsUnit).getTime();
    const paddedMin = startOfUnit(
      new Date(startMs - config.baselineMs * 0.3),
      config.boundsUnit,
    ).getTime();
    const min = Math.min(naturalMin, paddedMin);

    const futureReference = addUnit(
      new Date(historyEndMs ?? endMs),
      "year",
      RANGE_FUTURE_BUFFER_YEARS,
    ).getTime();
    const maxReference = Math.min(
      maxLookAheadMs,
      Math.max(
        futureReference,
        endMs,
        startMs + this._getSnapSpanMs(this._startTime || new Date()),
      ),
    );
    const max = endOfUnit(new Date(maxReference), config.boundsUnit).getTime();
    return { min, max: Math.max(max, min + SECOND_MS), config };
  }

  _syncRangeControl() {
    if (!this._dateControl || !this._panelTimelineEl) return;
    this._rangeBounds = this._deriveRangeBounds();
    void this._ensureTimelineEvents();
    this._panelTimelineEl.startTime = this._startTime ? new Date(this._startTime) : null;
    this._panelTimelineEl.endTime = this._endTime ? new Date(this._endTime) : null;
    this._panelTimelineEl.rangeBounds = this._rangeBounds;
    this._panelTimelineEl.zoomLevel = this._getEffectiveZoomLevel();
    this._panelTimelineEl.dateSnapping = this._dateSnapping;
    this._panelTimelineEl.isLiveEdge = this._isOnLiveEdge();
    this._panelTimelineEl.events = this._timelineEvents || [];
    this._updateComparisonRangePreview();
    this._updateChartHoverIndicator();
    this._updateChartZoomHighlight();
  }

  _updateComparisonRangePreview() {
    if (!this._panelTimelineEl) return;
    const comparisonWindow = this._getActiveComparisonWindow();
    if (!this._rangeBounds || !comparisonWindow) {
      this._panelTimelineEl.comparisonPreview = null;
      this._updateZoomWindowHighlight();
      return;
    }
    const startMs = new Date(comparisonWindow.start_time).getTime();
    const endMs = new Date(comparisonWindow.end_time).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
      this._panelTimelineEl.comparisonPreview = null;
      this._updateZoomWindowHighlight();
      return;
    }
    this._panelTimelineEl.comparisonPreview = { start: startMs, end: endMs };
    this._updateZoomWindowHighlight();
  }

  _handleChartHover(ev) {
    this._chartHoverTimeMs = ev?.detail?.timeMs ?? null;
    this._updateChartHoverIndicator();
  }

  _handleChartZoom(ev) {
    const start = Number.isFinite(ev?.detail?.startTime) ? ev.detail.startTime : null;
    const end = Number.isFinite(ev?.detail?.endTime) ? ev.detail.endTime : null;
    const isPreview = !!ev?.detail?.preview;
    const source = ev?.detail?.source || "select";
    const nextRange = start != null && end != null && start < end
      ? { start, end }
      : null;
    if (isPreview) {
      this._chartZoomRange = nextRange;
    } else {
      this._chartZoomRange = nextRange;
      this._chartZoomCommittedRange = nextRange
        ? { ...nextRange }
        : null;
      if (source === "scroll") {
        this._scheduleChartZoomStateCommit();
      } else {
        this._saveSessionState();
        this._updateUrl({ push: false });
        this._syncListZoomState();
      }
    }
    this._updateChartZoomHighlight();
    if (!nextRange) {
      this._panelTimelineEl?.revealSelection?.();
    }
  }

  _scheduleChartZoomStateCommit() {
    if (this._chartZoomStateCommitTimer) {
      window.clearTimeout(this._chartZoomStateCommitTimer);
    }
    this._chartZoomStateCommitTimer = window.setTimeout(() => {
      this._chartZoomStateCommitTimer = null;
      this._saveSessionState();
      this._updateUrl({ push: false });
      this._syncListZoomState();
    }, 180);
  }

  _syncListZoomState() {
    if (!this._listEl) return;
    const listConfig = {
      entities: this._entities,
      datapoint_scope: this._datapointScope,
      hours_to_show: this._hours,
      start_time: this._startTime?.toISOString(),
      end_time: this._endTime?.toISOString(),
      zoom_start_time: this._chartZoomCommittedRange
        ? new Date(this._chartZoomCommittedRange.start).toISOString()
        : null,
      zoom_end_time: this._chartZoomCommittedRange
        ? new Date(this._chartZoomCommittedRange.end).toISOString()
        : null,
      page_size: 15,
      show_entities: true,
      show_actions: true,
      show_search: true,
      hidden_event_ids: this._hiddenEventIds,
    };
    const nextListConfigKey = JSON.stringify(listConfig);
    if (this._listConfigKey !== nextListConfigKey) {
      this._listEl.setConfig(listConfig);
      this._listConfigKey = nextListConfigKey;
    }
    this._listEl.hass = this._hass;
  }

  _handleRecordsSearch(ev) {
    const nextQuery = String(ev?.detail?.query || "").trim().toLowerCase();
    if (nextQuery === this._recordsSearchQuery) return;
    this._recordsSearchQuery = nextQuery;
    this._renderContent();
  }

  _handleToggleEventVisibility(ev) {
    const eventId = ev?.detail?.eventId;
    if (!eventId) return;
    if (this._hiddenEventIds.includes(eventId)) {
      this._hiddenEventIds = this._hiddenEventIds.filter((id) => id !== eventId);
    } else {
      this._hiddenEventIds = [...this._hiddenEventIds, eventId];
    }
    this._renderContent();
  }

  _handleToggleSeriesVisibility(ev) {
    const entityId = String(ev?.detail?.entityId || "").trim();
    const visible = ev?.detail?.visible;
    if (!entityId || typeof visible !== "boolean") return;
    const index = this._seriesRows.findIndex((row) => row.entity_id === entityId);
    if (index === -1 || this._seriesRows[index].visible === visible) return;
    this._seriesRows[index] = { ...this._seriesRows[index], visible };
    this._saveSessionState();
    this._renderTargetRows();
    this._renderContent();
  }

  _updateChartHoverIndicator() {
    if (!this._panelTimelineEl) return;
    if (!this._rangeBounds || this._chartHoverTimeMs == null) {
      this._panelTimelineEl.chartHoverTimeMs = null;
      this._panelTimelineEl.chartHoverWindowTimeMs = null;
      return;
    }
    this._panelTimelineEl.chartHoverTimeMs = this._chartHoverTimeMs;
    const activeWindow = this._getActiveComparisonWindow();
    if (activeWindow && this._startTime) {
      const timeOffsetMs = new Date(activeWindow.start_time).getTime() - this._startTime.getTime();
      this._panelTimelineEl.chartHoverWindowTimeMs = this._chartHoverTimeMs + timeOffsetMs;
    } else {
      this._panelTimelineEl.chartHoverWindowTimeMs = null;
    }
  }

  _updateChartZoomHighlight() {
    if (!this._panelTimelineEl) return;
    const highlightRange = this._chartZoomRange || this._chartZoomCommittedRange;
    if (!this._rangeBounds || !highlightRange) {
      this._panelTimelineEl.zoomRange = null;
      this._updateZoomWindowHighlight();
      return;
    }
    this._panelTimelineEl.zoomRange = { start: +highlightRange.start, end: +highlightRange.end };
    this._updateZoomWindowHighlight();
  }

  _updateZoomWindowHighlight() {
    if (!this._panelTimelineEl) return;
    const activeWindow = this._getActiveComparisonWindow();
    const zoomRange = this._chartZoomRange || this._chartZoomCommittedRange;
    if (!this._rangeBounds || !activeWindow || !zoomRange || !this._startTime) {
      this._panelTimelineEl.zoomWindowRange = null;
      return;
    }
    const windowStartMs = new Date(activeWindow.start_time).getTime();
    const windowEndMs = new Date(activeWindow.end_time).getTime();
    if (!Number.isFinite(windowStartMs) || !Number.isFinite(windowEndMs) || windowStartMs >= windowEndMs) {
      this._panelTimelineEl.zoomWindowRange = null;
      return;
    }
    // The zoom range is in main-chart time. Shift it into the comparison
    // window's real-time coordinate space so it can be overlaid on the
    // comparison preview band (which uses actual dates on the timeline).
    const timeOffsetMs = windowStartMs - this._startTime.getTime();
    const zoomStartMs = +zoomRange.start + timeOffsetMs;
    const zoomEndMs = +zoomRange.end + timeOffsetMs;
    const intersectStart = Math.max(windowStartMs, zoomStartMs);
    const intersectEnd = Math.min(windowEndMs, zoomEndMs);
    if (intersectStart >= intersectEnd) {
      this._panelTimelineEl.zoomWindowRange = null;
      return;
    }
    this._panelTimelineEl.zoomWindowRange = { start: intersectStart, end: intersectEnd };
  }

  _setDraftRangeFromTimestamp(handle, timestamp) {
    if (!this._rangeBounds) return;
    const snapUnit = this._getEffectiveSnapUnit();
    let startMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? this._rangeBounds.min;
    let endMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? this._rangeBounds.max;
    const snapped = clampNumber(
      snapDateToUnit(new Date(timestamp), snapUnit).getTime(),
      this._rangeBounds.min,
      this._rangeBounds.max,
    );
    const minSpan = Math.max(this._getSnapSpanMs(new Date(snapped)), SECOND_MS);

    if (handle === "start") {
      startMs = clampNumber(snapped, this._rangeBounds.min, endMs - minSpan);
    } else {
      endMs = clampNumber(snapped, startMs + minSpan, this._rangeBounds.max);
    }
    this._draftStartTime = new Date(startMs);
    this._draftEndTime = new Date(endMs);
    this._updateHandleStacking(handle);
    this._updateRangePreview();
    this._scheduleAutoZoomUpdate();
    this._scheduleRangeCommit();
  }

  _scheduleRangeCommit() {
    if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
    if (this._rangeCommitTimer) window.clearTimeout(this._rangeCommitTimer);
    this._rangeCommitTimer = window.setTimeout(() => {
      this._rangeCommitTimer = null;
      this._commitRangeSelection({ push: false });
    }, 240);
  }

  _scheduleAutoZoomUpdate(draftStart, draftEnd) {
    if (this._zoomLevel !== "auto" || !this._rangeBounds) return;
    const start = draftStart || this._startTime;
    const end = draftEnd || this._endTime;
    if (!start || !end || start >= end) return;

    const currentLevel = this._getEffectiveZoomLevel();
    const selectionSpanMs = Math.max(end.getTime() - start.getTime(), RANGE_SLIDER_MIN_SPAN_MS);
    const paddedSelectionSpanMs = Math.max(
      selectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
      RANGE_SLIDER_MIN_SPAN_MS,
    );
    const candidateLevel = this._computeZoomLevelForSpan(paddedSelectionSpanMs);

    if (candidateLevel === currentLevel) {
      this._clearAutoZoomTimer();
      return;
    }

    this._clearAutoZoomTimer();
    this._autoZoomTimer = window.setTimeout(() => {
      this._autoZoomTimer = null;
      const latestStart = draftStart || this._startTime;
      const latestEnd = draftEnd || this._endTime;
      if (!latestStart || !latestEnd || latestStart >= latestEnd || this._zoomLevel !== "auto" || !this._rangeBounds) {
        return;
      }

      const latestLevel = this._getEffectiveZoomLevel();
      const latestSelectionSpanMs = Math.max(latestEnd.getTime() - latestStart.getTime(), RANGE_SLIDER_MIN_SPAN_MS);
      const latestPaddedSelectionSpanMs = Math.max(
        latestSelectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
        RANGE_SLIDER_MIN_SPAN_MS,
      );
      const latestCandidateLevel = this._computeZoomLevelForSpan(latestPaddedSelectionSpanMs);

      if (latestCandidateLevel === latestLevel) return;
      this._resolvedAutoZoomLevel = latestCandidateLevel;
      this._syncRangeControl();
    }, RANGE_AUTO_ZOOM_DEBOUNCE_MS);
  }

  // ---------------------------------------------------------------------------
  // Live-edge detection and handle indicator
  // ---------------------------------------------------------------------------

  /** Returns true when the committed end time is at or very near "now",
   *  meaning new annotations should cause the visible range to advance. */
  _isOnLiveEdge() {
    if (!this._endTime) {
      return false;
    }
    // Within 2 minutes of now, or in the future.
    return this._endTime.getTime() >= Date.now() - 2 * MINUTE_MS;
  }

  /** Toggle the live-edge indicator on the end handle. */
  _syncLiveEdgeHandle() {
    if (!this._panelTimelineEl) return;
    this._panelTimelineEl.isLiveEdge = this._isOnLiveEdge();
  }

  /** Called whenever a new annotation is recorded (HA event or window event).
   *  If the current range is on the live edge, advance the end time to now
   *  so the chart immediately shows the new data point. */
  _handleEventRecorded() {
    if (!this._isOnLiveEdge() || !this._startTime) {
      return;
    }
    this._applyCommittedRange(this._startTime, new Date(), { push: false });
  }

  _applyCommittedRange(start, end, { push = false } = {}) {
    if (!start || !end || start >= end) return;
    const nextStart = new Date(start);
    const nextEnd = new Date(end);
    const didChange = !this._startTime
      || !this._endTime
      || this._startTime.getTime() !== nextStart.getTime()
      || this._endTime.getTime() !== nextEnd.getTime();

    this._startTime = nextStart;
    this._endTime = nextEnd;
    this._hours = Math.max(1, Math.round((nextEnd.getTime() - nextStart.getTime()) / HOUR_MS));
    this._syncLiveEdgeHandle();
    this._scheduleAutoZoomUpdate();
    this._syncControls();
    this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
    if (!didChange) return;
    this._saveSessionState();
    this._updateUrl({ push });
    this._renderContent();
  }

  _commitRangeSelection({ push = false } = {}) {
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    if (!this._draftStartTime || !this._draftEndTime || this._draftStartTime >= this._draftEndTime) return;
    this._applyCommittedRange(this._draftStartTime, this._draftEndTime, { push });
  }

  _updateUrl({ push = false } = {}) {
    const url = new URL(window.location.href);
    const target = this._entities.length ? { entity_id: [...this._entities] } : {};
    if (target.entity_id?.length) url.searchParams.set("entity_id", target.entity_id.join(","));
    else url.searchParams.delete("entity_id");
    if (target.device_id?.length) url.searchParams.set("device_id", target.device_id.join(","));
    else url.searchParams.delete("device_id");
    if (target.area_id?.length) url.searchParams.set("area_id", target.area_id.join(","));
    else url.searchParams.delete("area_id");
    if (target.label_id?.length) url.searchParams.set("label_id", target.label_id.join(","));
    else url.searchParams.delete("label_id");
    if (this._datapointScope === "all") url.searchParams.set("datapoints_scope", "all");
    else if (this._datapointScope === "hidden") url.searchParams.set("datapoints_scope", "hidden");
    else url.searchParams.delete("datapoints_scope");
    if (this._startTime && this._endTime) {
      url.searchParams.set("start_time", this._startTime.toISOString());
      url.searchParams.set("end_time", this._endTime.toISOString());
      url.searchParams.set("hours_to_show", String(this._hours));
    } else {
      url.searchParams.delete("start_time");
      url.searchParams.delete("end_time");
      url.searchParams.delete("hours_to_show");
    }
    if (this._chartZoomCommittedRange) {
      url.searchParams.set("zoom_start_time", new Date(this._chartZoomCommittedRange.start).toISOString());
      url.searchParams.set("zoom_end_time", new Date(this._chartZoomCommittedRange.end).toISOString());
    } else {
      url.searchParams.delete("zoom_start_time");
      url.searchParams.delete("zoom_end_time");
    }
    const dateWindowsParam = serializeDateWindowsParam(this._comparisonWindows);
    if (dateWindowsParam) url.searchParams.set("date_windows", dateWindowsParam);
    else url.searchParams.delete("date_windows");
    const seriesColorEntries = this._seriesRows
      .map((row) => {
        const key = this._seriesColorQueryKey(row.entity_id);
        return key && /^#[0-9a-f]{6}$/i.test(row.color || "")
          ? `${encodeURIComponent(key)}:${row.color.toLowerCase()}`
          : null;
      })
      .filter(Boolean);
    if (seriesColorEntries.length) url.searchParams.set("series_colors", seriesColorEntries.join(","));
    else url.searchParams.delete("series_colors");
    const nextUrl = `${url.pathname}${url.search}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl === currentUrl) return;
    if (push) window.history.pushState(null, "", nextUrl);
    else window.history.replaceState(null, "", nextUrl);
  }

  _renderComparisonTabs() {
    const tabsEl = this._chartEl?.shadowRoot?.getElementById("chart-top-slot");
    if (!tabsEl) {
      return;
    }
    const comparisonTabs = Array.isArray(this._comparisonWindows) ? this._comparisonWindows : [];
    const activeComparisonWindowId = this._selectedComparisonWindowId || null;
    const currentTab = this._startTime && this._endTime
      ? {
        id: "current-range",
        label: "Selected range",
        detail: this._formatComparisonLabel(this._startTime, this._endTime),
        active: !activeComparisonWindowId,
        editable: false,
      }
      : null;
    const tabs = [
      ...(currentTab ? [currentTab] : []),
      ...comparisonTabs.map((window) => ({
        ...window,
        detail: this._formatComparisonLabel(
          new Date(window.start_time),
          new Date(window.end_time),
        ),
        active: window.id === activeComparisonWindowId,
        editable: true,
      })),
    ];
    tabsEl.hidden = false;

    // Mount the dp-comparison-tab-rail once; wire events at creation time.
    if (!this._comparisonTabRailComp || this._comparisonTabsHostEl !== tabsEl) {
      tabsEl.innerHTML = "";
      const rail = document.createElement("dp-comparison-tab-rail");
      rail.addEventListener("dp-tab-activate", (ev) => this._handleComparisonTabActivate(ev.detail.tabId));
      rail.addEventListener("dp-tab-hover", (ev) => this._handleComparisonTabHover(ev.detail.tabId));
      rail.addEventListener("dp-tab-leave", (ev) => this._handleComparisonTabLeave(ev.detail.tabId));
      rail.addEventListener("dp-tab-edit", (ev) => {
        const id = ev.detail.tabId;
        const win = this._comparisonWindows.find((entry) => entry.id === id);
        if (win) {
          this._openDateWindowDialog(win);
        }
      });
      rail.addEventListener("dp-tab-delete", (ev) => {
        this._deleteDateWindow(ev.detail.tabId);
      });
      rail.addEventListener("dp-tab-add", () => this._openDateWindowDialog());
      tabsEl.appendChild(rail);
      this._comparisonTabRailComp = rail;
      this._comparisonTabsHostEl = tabsEl;
    }

    // Update properties on every render.
    this._comparisonTabRailComp.tabs = tabs;
    this._comparisonTabRailComp.loadingIds = [...this._loadingComparisonWindowIds];
    this._comparisonTabRailComp.hoveredId = this._hoveredComparisonWindowId || "";
  }

  _updateComparisonTabsOverflow() {
    window.requestAnimationFrame(() => {
      const shell = this._chartEl?.shadowRoot?.querySelector("#chart-tabs-shell");
      const rail = this._chartEl?.shadowRoot?.querySelector("#chart-tabs-rail");
      if (!shell || !rail) return;
      shell.classList.toggle("overflowing", rail.scrollWidth > rail.clientWidth + 4);
    });
  }

  _renderContent() {
    const content = this.shadowRoot.getElementById("content");
    if (!content) return;

    if (!this._entities.length) {
      this._chartHoverTimeMs = null;
      this._updateChartHoverIndicator();
      this._chartZoomRange = null;
      this._chartZoomCommittedRange = null;
      this._updateChartZoomHighlight();
      content.innerHTML = `
        <ha-card class="empty">
          Select one or more entities to inspect annotated history.
        </ha-card>
      `;
      this._contentKey = "";
      this._chartEl = null;
      this._listEl = null;
      this._chartConfigKey = "";
      this._listConfigKey = "";
      return;
    }

    const contentKey = JSON.stringify({
      entities: this._entities,
      series_entity_ids: this._seriesRows.map((row) => row.entity_id),
      datapoint_scope: this._datapointScope,
      start: this._startTime?.toISOString() || null,
      end: this._endTime?.toISOString() || null,
      hours: this._hours,
    });

    const showRecordsPanel = this._datapointScope !== "hidden";
    const chartMounted = !!(this._chartEl && this._chartEl.isConnected && content.contains(this._chartEl));
    const listMounted = !showRecordsPanel
      || !!(this._listEl && this._listEl.isConnected && content.contains(this._listEl));

    if (this._contentKey !== contentKey || !chartMounted || !listMounted) {
      this._chartHoverTimeMs = null;
      this._updateChartHoverIndicator();
      this._chartZoomRange = null;
      this._chartZoomCommittedRange = null;
      this._updateChartZoomHighlight();
      content.innerHTML = `
        <div id="chart-host" class="chart-host">
          <div id="chart-card-host" class="chart-card-host"></div>
        </div>
        <button
          id="content-splitter"
          class="content-splitter"
          type="button"
          aria-label="Resize chart and records panes"
        ></button>
        <div id="list-host" class="list-host"></div>
      `;

      const chartConfig = {
        entities: this._entities,
        series_settings: this._seriesRows,
        datapoint_scope: this._datapointScope,
        show_event_markers: this._showChartDatapointIcons,
        show_event_lines: this._showChartDatapointLines,
        show_tooltips: this._showChartTooltips,
        emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
        show_correlated_anomalies: this._showCorrelatedAnomalies,
        delink_y_axis: this._delinkChartYAxis,
        split_view: this._splitChartView,
        show_data_gaps: this._showDataGaps,
        data_gap_threshold: this._dataGapThreshold,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
        zoom_start_time: this._chartZoomCommittedRange
          ? new Date(this._chartZoomCommittedRange.start).toISOString()
          : null,
        zoom_end_time: this._chartZoomCommittedRange
          ? new Date(this._chartZoomCommittedRange.end).toISOString()
          : null,
        message_filter: this._recordsSearchQuery || "",
        hidden_event_ids: this._hiddenEventIds,
        comparison_windows: this._getPreviewComparisonWindows(),
        preload_comparison_windows: this._getPreloadComparisonWindows(),
        comparison_preview_overlay: this._getComparisonPreviewOverlay(),
        comparison_hover_active: !!this._hoveredComparisonWindowId,
        selected_comparison_window_id: this._selectedComparisonWindowId,
        hovered_comparison_window_id: this._hoveredComparisonWindowId,
      };
      const chart = document.createElement("hass-datapoints-history-card");
      chart.setConfig(chartConfig);

      content.querySelector("#chart-card-host").appendChild(chart);
      if (showRecordsPanel) {
        const listConfig = {
          entities: this._entities,
          datapoint_scope: this._datapointScope,
          hours_to_show: this._hours,
          start_time: this._startTime?.toISOString(),
          end_time: this._endTime?.toISOString(),
          zoom_start_time: this._chartZoomCommittedRange
            ? new Date(this._chartZoomCommittedRange.start).toISOString()
            : null,
          zoom_end_time: this._chartZoomCommittedRange
            ? new Date(this._chartZoomCommittedRange.end).toISOString()
            : null,
          page_size: 15,
          show_entities: true,
          show_actions: true,
          show_search: true,
          hidden_event_ids: this._hiddenEventIds,
        };
        const list = document.createElement("hass-datapoints-list-card");
        list.setConfig(listConfig);
        content.querySelector("#list-host").appendChild(list);
        this._listEl = list;
      } else {
        this._listEl = null;
      }
      this._contentSplitterEl = content.querySelector("#content-splitter");
      this._contentSplitterEl?.addEventListener("pointerdown", (ev) => this._beginContentSplitPointer(ev));
      this._chartEl = chart;
      this._contentKey = contentKey;
      this._chartConfigKey = "";
      this._listConfigKey = "";
    }

    content.classList.toggle("datapoints-hidden", !showRecordsPanel);
    this._applyContentSplitLayout();
    this._renderComparisonTabs();
    const chartConfig = {
      entities: this._entities,
      series_settings: this._seriesRows,
      datapoint_scope: this._datapointScope,
      show_event_markers: this._showChartDatapointIcons,
      show_event_lines: this._showChartDatapointLines,
      show_tooltips: this._showChartTooltips,
      emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
      show_correlated_anomalies: this._showCorrelatedAnomalies,
      delink_y_axis: this._delinkChartYAxis,
      split_view: this._splitChartView,
      show_data_gaps: this._showDataGaps,
      data_gap_threshold: this._dataGapThreshold,
      hours_to_show: this._hours,
      start_time: this._startTime?.toISOString(),
      end_time: this._endTime?.toISOString(),
      zoom_start_time: this._chartZoomCommittedRange
        ? new Date(this._chartZoomCommittedRange.start).toISOString()
        : null,
      zoom_end_time: this._chartZoomCommittedRange
        ? new Date(this._chartZoomCommittedRange.end).toISOString()
        : null,
      message_filter: this._recordsSearchQuery || "",
      hidden_event_ids: this._hiddenEventIds,
      comparison_windows: this._getPreviewComparisonWindows(),
      preload_comparison_windows: this._getPreloadComparisonWindows(),
      comparison_preview_overlay: this._getComparisonPreviewOverlay(),
      comparison_hover_active: !!this._hoveredComparisonWindowId,
      selected_comparison_window_id: this._selectedComparisonWindowId,
      hovered_comparison_window_id: this._hoveredComparisonWindowId,
    };
    const nextChartConfigKey = JSON.stringify(chartConfig);
    if (this._chartEl && this._chartConfigKey !== nextChartConfigKey) {
      this._chartEl.setConfig(chartConfig);
      this._chartConfigKey = nextChartConfigKey;
    }
    if (showRecordsPanel) {
      const listConfig = {
        entities: this._entities,
        datapoint_scope: this._datapointScope,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
        zoom_start_time: this._chartZoomCommittedRange
          ? new Date(this._chartZoomCommittedRange.start).toISOString()
          : null,
        zoom_end_time: this._chartZoomCommittedRange
          ? new Date(this._chartZoomCommittedRange.end).toISOString()
          : null,
        page_size: 15,
        show_entities: true,
        show_actions: true,
        show_search: true,
        hidden_event_ids: this._hiddenEventIds,
      };
      const nextListConfigKey = JSON.stringify(listConfig);
      if (this._listEl && this._listConfigKey !== nextListConfigKey) {
        this._listEl.setConfig(listConfig);
        this._listConfigKey = nextListConfigKey;
      }
      if (this._listEl) this._listEl.hass = this._hass;
    } else {
      this._listConfigKey = "";
    }
    if (this._chartEl) this._chartEl.hass = this._hass;
    this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
  }
}
