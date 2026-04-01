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

function renderAnalysisSelectOptions(options, selectedValue) {
  return options.map((option) => {
    return `<option value="${esc(option.value)}" ${selectedValue === option.value ? "selected" : ""}>${esc(option.label)}</option>`;
  }).join("");
}

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
    this._rangeScrollViewportEl = null;
    this._rangeTimelineEl = null;
    this._rangeJumpLeftEl = null;
    this._rangeJumpRightEl = null;
    this._rangeTrackEl = null;
    this._rangeTickLayerEl = null;
    this._rangeEventLayerEl = null;
    this._rangeLabelLayerEl = null;
    this._rangeContextLayerEl = null;
    this._rangeChartHoverLineEl = null;
    this._rangeChartHoverWindowLineEl = null;
    this._rangeHoverPreviewEl = null;
    this._rangeZoomHighlightEl = null;
    this._rangeZoomWindowHighlightEl = null;
    this._rangeSelectionEl = null;
    this._rangeStartHandle = null;
    this._rangeEndHandle = null;
    this._rangeStartTooltipEl = null;
    this._rangeEndTooltipEl = null;
    this._rangeCaptionEl = null;
    this._rangeBounds = null;
    this._rangeContentWidth = 0;
    this._draftStartTime = null;
    this._draftEndTime = null;
    this._rangeCommitTimer = null;
    this._autoZoomTimer = null;
    this._rangeInteractionActive = false;
    this._resolvedAutoZoomLevel = null;
    this._activeRangeHandle = null;
    this._hoveredRangeHandle = null;
    this._focusedRangeHandle = null;
    this._hoveredPeriodRange = null;
    this._chartHoverTimeMs = null;
    this._chartZoomRange = null;
    this._chartZoomCommittedRange = null;
    this._chartZoomStateCommitTimer = null;
    this._rangePointerId = null;
    this._timelinePointerId = null;
    this._timelinePointerStartX = 0;
    this._timelinePointerStartScrollLeft = 0;
    this._timelinePointerStartTimestamp = null;
    this._timelinePointerMode = null;
    this._timelineDragStartRangeMs = 0;
    this._timelineDragEndRangeMs = 0;
    this._timelineDragStartZoomRange = null;
    this._timelinePointerMoved = false;
    this._timelineTrackClickPending = false;
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
    this._onRangePointerMove = (ev) => this._handleRangePointerMove(ev);
    this._onRangePointerUp = (ev) => this._finishRangePointerInteraction(ev);
    this._onTimelinePointerMove = (ev) => this._handleTimelinePointerMove(ev);
    this._onTimelinePointerUp = (ev) => this._finishTimelinePointerInteraction(ev);
    this._onRangeViewportScroll = () => {
      this._syncVisibleRangeLabels();
      this._updateRangeTooltip();
      this._updateSelectionJumpControls();
    };
    this._onRangeViewportPointerMove = (ev) => this._handleRangeViewportPointerMove(ev);
    this._onRangeViewportPointerLeave = () => this._handleRangeViewportPointerLeave();
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
    this._detachRangePointerListeners();
    this._detachTimelinePointerListeners();
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

  _getHoveredComparisonWindow() {
    if (!this._hoveredComparisonWindowId) return null;
    return this._comparisonWindows.find((window) => window.id === this._hoveredComparisonWindowId) || null;
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
    this._renderRangeScale();
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

  _setChartAnalysisOption(kind, value) {
    if (kind === "show_trend_lines") {
      const normalized = !!value;
      if (this._showChartTrendLines === normalized) {
        return;
      }
      this._showChartTrendLines = normalized;
      if (!normalized && this._showChartTrendCrosshairs) {
        this._showChartTrendCrosshairs = false;
      }
    } else if (kind === "show_summary_stats") {
      const normalized = !!value;
      if (this._showChartSummaryStats === normalized) {
        return;
      }
      this._showChartSummaryStats = normalized;
    } else if (kind === "show_rate_of_change") {
      const normalized = !!value;
      if (this._showChartRateOfChange === normalized) {
        return;
      }
      this._showChartRateOfChange = normalized;
    } else if (kind === "show_threshold_analysis") {
      const normalized = !!value;
      if (this._showChartThresholdAnalysis === normalized) {
        return;
      }
      this._showChartThresholdAnalysis = normalized;
      if (!normalized && this._showChartThresholdShading) {
        this._showChartThresholdShading = false;
      }
    } else if (kind === "show_threshold_shading") {
      const normalized = !!value;
      if (this._showChartThresholdShading === normalized) {
        return;
      }
      this._showChartThresholdShading = normalized;
    } else if (kind === "show_anomalies") {
      const normalized = !!value;
      if (this._showChartAnomalies === normalized) {
        return;
      }
      this._showChartAnomalies = normalized;
    } else if (kind === "hide_source_series") {
      const normalized = !!value;
      if (this._hideChartSourceSeries === normalized) {
        return;
      }
      this._hideChartSourceSeries = normalized;
    } else if (kind === "show_trend_crosshairs") {
      const normalized = !!value;
      if (this._showChartTrendCrosshairs === normalized) {
        return;
      }
      this._showChartTrendCrosshairs = normalized;
    } else if (kind === "trend_method") {
      const normalized = ANALYSIS_TREND_METHOD_OPTIONS.some((option) => option.value === value)
        ? value
        : "rolling_average";
      if (this._chartTrendMethod === normalized) {
        return;
      }
      this._chartTrendMethod = normalized;
    } else if (kind === "trend_window") {
      const normalized = ANALYSIS_TREND_WINDOW_OPTIONS.some((option) => option.value === value)
        ? value
        : "24h";
      if (this._chartTrendWindow === normalized) {
        return;
      }
      this._chartTrendWindow = normalized;
    } else if (kind === "rate_window") {
      const normalized = ANALYSIS_RATE_WINDOW_OPTIONS.some((option) => option.value === value)
        ? value
        : "1h";
      if (this._chartRateWindow === normalized) {
        return;
      }
      this._chartRateWindow = normalized;
    } else if (kind === "anomaly_method") {
      const normalized = ANALYSIS_ANOMALY_METHOD_OPTIONS.some((option) => option.value === value)
        ? value
        : "trend_residual";
      if (this._chartAnomalyMethod === normalized) {
        return;
      }
      this._chartAnomalyMethod = normalized;
    } else if (kind === "anomaly_sensitivity") {
      const normalized = ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS.some((option) => option.value === value)
        ? value
        : "medium";
      if (this._chartAnomalySensitivity === normalized) {
        return;
      }
      this._chartAnomalySensitivity = normalized;
    } else if (kind === "anomaly_rate_window") {
      const normalized = ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS.some((option) => option.value === value)
        ? value
        : "1h";
      if (this._chartAnomalyRateWindow === normalized) {
        return;
      }
      this._chartAnomalyRateWindow = normalized;
    } else if (kind === "show_delta_analysis") {
      const normalized = !!value;
      if (this._showChartDeltaAnalysis === normalized) {
        return;
      }
      this._showChartDeltaAnalysis = normalized;
    } else if (kind === "show_delta_tooltip") {
      const normalized = !!value;
      if (this._showChartDeltaTooltip === normalized) {
        return;
      }
      this._showChartDeltaTooltip = normalized;
    } else if (kind === "show_delta_lines") {
      const normalized = !!value;
      if (this._showChartDeltaLines === normalized) {
        return;
      }
      this._showChartDeltaLines = normalized;
    } else {
      return;
    }
    this._saveSessionState();
    this._renderSidebarOptions();
    this._renderContent();
  }

  _setChartAnalysisThresholdValue(entityId, value) {
    if (!entityId) {
      return;
    }
    const normalized = String(value || "").trim();
    const nextValues = { ...(this._chartThresholdValues || {}) };
    if (!normalized) {
      delete nextValues[entityId];
    } else {
      nextValues[entityId] = normalized;
    }
    if (JSON.stringify(nextValues) === JSON.stringify(this._chartThresholdValues || {})) {
      return;
    }
    this._chartThresholdValues = nextValues;
    this._saveSessionState();
    this._renderContent();
  }

  _setChartAnalysisThresholdDirection(entityId, value) {
    if (!entityId) {
      return;
    }
    const normalized = value === "below" ? "below" : "above";
    const nextDirections = { ...(this._chartThresholdDirections || {}) };
    nextDirections[entityId] = normalized;
    if (JSON.stringify(nextDirections) === JSON.stringify(this._chartThresholdDirections || {})) {
      return;
    }
    this._chartThresholdDirections = nextDirections;
    this._saveSessionState();
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
      if (this._rendered) this._renderRangeScale();
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
        if (this._rendered) this._renderRangeScale();
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
        <div class="range-timeline-shell">
          <ha-icon-button
            id="range-jump-left"
            class="range-selection-jump left"
            label="Scroll to selected range"
            hidden
          >
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            id="range-jump-right"
            class="range-selection-jump right"
            label="Scroll to selected range"
            hidden
          >
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </ha-icon-button>
          <div id="range-scroll-viewport" class="range-scroll-viewport">
            <div id="range-timeline" class="range-timeline">
              <div id="range-context-layer" class="range-context-layer"></div>
              <div id="range-tick-layer" class="range-tick-layer"></div>
              <div id="range-event-layer" class="range-event-layer"></div>
              <div id="range-chart-hover-line" class="range-chart-hover-line" aria-hidden="true"></div>
              <div id="range-chart-hover-window-line" class="range-chart-hover-window-line" aria-hidden="true"></div>
              <div id="range-track" class="range-track">
                <div id="range-hover-preview" class="range-hover-preview"></div>
                <div id="range-comparison-preview" class="range-comparison-preview"></div>
                <div id="range-zoom-highlight" class="range-zoom-highlight"></div>
                <div id="range-zoom-window-highlight" class="range-zoom-window-highlight"></div>
                <div id="range-selection" class="range-selection"></div>
              </div>
              <div id="range-label-layer" class="range-label-layer"></div>
              <button id="range-start-handle" class="range-handle" type="button" aria-label="Start date and time"></button>
              <button id="range-end-handle" class="range-handle" type="button" aria-label="End date and time"></button>
            </div>
          </div>
          <div id="range-tooltip-start" class="range-tooltip start" aria-hidden="true"></div>
          <div id="range-tooltip-end" class="range-tooltip end" aria-hidden="true"></div>
          <div id="range-caption" class="range-caption"></div>
        </div>
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
    this._rangeScrollViewportEl = dateControl.querySelector("#range-scroll-viewport");
    this._rangeJumpLeftEl = dateControl.querySelector("#range-jump-left");
    this._rangeJumpRightEl = dateControl.querySelector("#range-jump-right");
    this._rangeTimelineEl = dateControl.querySelector("#range-timeline");
    this._rangeTrackEl = dateControl.querySelector("#range-track");
    this._dateRangePickerEl = dateControl.querySelector("#range-picker");
    this._datePickerButtonEl = dateControl.querySelector("#range-picker-button");
    this._datePickerMenuEl = dateControl.querySelector("#range-picker-menu");
    this._optionsButtonEl = dateControl.querySelector("#range-options-button");
    this._optionsMenuEl = dateControl.querySelector("#range-options-menu");
    this._rangeTickLayerEl = dateControl.querySelector("#range-tick-layer");
    this._rangeEventLayerEl = dateControl.querySelector("#range-event-layer");
    this._rangeLabelLayerEl = dateControl.querySelector("#range-label-layer");
    this._rangeContextLayerEl = dateControl.querySelector("#range-context-layer");
    this._rangeChartHoverLineEl = dateControl.querySelector("#range-chart-hover-line");
    this._rangeChartHoverWindowLineEl = dateControl.querySelector("#range-chart-hover-window-line");
    this._rangeHoverPreviewEl = dateControl.querySelector("#range-hover-preview");
    this._rangeComparisonPreviewEl = dateControl.querySelector("#range-comparison-preview");
    this._rangeZoomHighlightEl = dateControl.querySelector("#range-zoom-highlight");
    this._rangeZoomWindowHighlightEl = dateControl.querySelector("#range-zoom-window-highlight");
    this._rangeStartTooltipEl = dateControl.querySelector("#range-tooltip-start");
    this._rangeEndTooltipEl = dateControl.querySelector("#range-tooltip-end");
    this._rangeSelectionEl = dateControl.querySelector("#range-selection");
    this._rangeStartHandle = dateControl.querySelector("#range-start-handle");
    this._rangeEndHandle = dateControl.querySelector("#range-end-handle");
    this._rangeStartHandle?.removeAttribute("title");
    this._rangeEndHandle?.removeAttribute("title");
    this._rangeCaptionEl = dateControl.querySelector("#range-caption");
    this._rangeScrollViewportEl.addEventListener("pointerdown", (ev) => this._handleTimelinePointerDown(ev));
    this._rangeScrollViewportEl.addEventListener("scroll", this._onRangeViewportScroll, { passive: true });
    this._rangeScrollViewportEl.addEventListener("pointermove", this._onRangeViewportPointerMove, { passive: true });
    this._rangeScrollViewportEl.addEventListener("pointerleave", this._onRangeViewportPointerLeave);
    this._rangeStartHandle.addEventListener("pointerdown", (ev) => this._beginRangePointerInteraction("start", ev));
    this._rangeEndHandle.addEventListener("pointerdown", (ev) => this._beginRangePointerInteraction("end", ev));
    this._rangeStartHandle.addEventListener("keydown", (ev) => this._handleRangeHandleKeyDown("start", ev));
    this._rangeEndHandle.addEventListener("keydown", (ev) => this._handleRangeHandleKeyDown("end", ev));
    this._rangeStartHandle.addEventListener("pointerenter", () => this._setRangeTooltipHoverHandle("start"));
    this._rangeEndHandle.addEventListener("pointerenter", () => this._setRangeTooltipHoverHandle("end"));
    this._rangeStartHandle.addEventListener("pointerleave", () => this._clearRangeTooltipHoverHandle("start"));
    this._rangeEndHandle.addEventListener("pointerleave", () => this._clearRangeTooltipHoverHandle("end"));
    this._rangeStartHandle.addEventListener("focus", () => this._setRangeTooltipFocusHandle("start"));
    this._rangeEndHandle.addEventListener("focus", () => this._setRangeTooltipFocusHandle("end"));
    this._rangeStartHandle.addEventListener("blur", () => this._clearRangeTooltipFocusHandle("start"));
    this._rangeEndHandle.addEventListener("blur", () => this._clearRangeTooltipFocusHandle("end"));
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
    this._rangeJumpLeftEl?.addEventListener("click", () => this._revealSelectionInTimeline("smooth"));
    this._rangeJumpRightEl?.addEventListener("click", () => this._revealSelectionInTimeline("smooth"));
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

  /** Generate the HTML for a single target row.
   *  @param {object} row  - series row object
   *  @param {number} index - position in _seriesRows
   *  @param {{ includeDragHandle?: boolean }} opts
   */
  _buildSingleRowHTML(row, index, { includeDragHandle = true } = {}) {
    const analysis = normalizeHistorySeriesAnalysis(row.analysis);
    const supportsAnalysis = isAnalysisSupportedForRow(row);
    const hasConfiguredAnalysis = historySeriesRowHasConfiguredAnalysis(row);
    const isExpanded = supportsAnalysis && analysis.expanded === true;
    const canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
    const hasActiveAnalysis = hasActiveSeriesAnalysis(analysis, canShowDeltaAnalysis);
    const rowName = entityName(this._hass, row.entity_id) || row.entity_id;
    const unit = this._hass?.states?.[row.entity_id]?.attributes?.unit_of_measurement || "";
    return `
      <div class="history-target-row ${row.visible === false ? "is-hidden" : ""} ${isExpanded ? "analysis-open" : ""}" role="row" data-series-reorder-index="${index}" ${supportsAnalysis ? `data-series-row-entity-id="${esc(row.entity_id)}"` : ""}>
        ${includeDragHandle ? `
          <button type="button" class="history-target-drag-handle" draggable="true" data-series-drag-index="${index}" aria-label="Drag to reorder ${esc(rowName)}" title="Drag to reorder">
            <ha-icon icon="mdi:drag-vertical"></ha-icon>
          </button>
        ` : ""}
        <div class="history-target-name" role="cell" title="${esc(entityName(this._hass, row.entity_id) || row.entity_id)}">
          <div role="cell" class="history-target-controls">
            <label class="history-target-color-field" style="--row-color:${esc(row.color)};--row-icon-color:${deriveSwatchIconColor(row.color)}">
              <input type="color" class="history-target-color" data-series-color-index="${index}" value="${esc(row.color)}" aria-label="Line color for ${esc(row.entity_id)}">
              <span class="history-target-color-icon" aria-hidden="true">
                <ha-state-icon data-series-icon-entity-id="${esc(row.entity_id)}"></ha-state-icon>
              </span>
            </label>
          </div>
          <div class="history-target-name-text">
            ${esc(entityName(this._hass, row.entity_id) || row.entity_id)}
            <div class="history-target-entity-id">${esc(row.entity_id)}</div>
          </div>
        </div>
        <div role="cell" class="history-target-actions">
          ${supportsAnalysis ? `
            <button
              type="button"
              class="history-target-analysis-toggle ${hasConfiguredAnalysis ? "configured" : ""}"
              data-series-analysis-toggle-entity-id="${esc(row.entity_id)}"
              aria-label="${isExpanded ? "Collapse" : "Expand"} analysis options for ${esc(rowName)}"
              aria-expanded="${isExpanded ? "true" : "false"}"
              title="${hasConfiguredAnalysis ? "Analysis configured" : "Configure analysis"}"
            >
              <ha-icon icon="${isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon>
            </button>
          ` : ""}
          <label class="history-target-visible-toggle" title="${row.visible === false ? "Show" : "Hide"} ${esc(entityName(this._hass, row.entity_id) || row.entity_id)}">
            <input
              type="checkbox"
              data-series-visible-entity-id="${esc(row.entity_id)}"
              aria-label="Show ${esc(entityName(this._hass, row.entity_id) || row.entity_id)} on chart"
              ${row.visible === false ? "" : "checked"}
            >
            <span class="history-target-visible-toggle-track"></span>
          </label>
          <button type="button" class="history-target-remove" data-series-remove-index="${index}" aria-label="Remove ${esc(row.entity_id)}">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        ${supportsAnalysis && isExpanded ? `
          <div class="history-target-analysis" role="cell">
            <div class="history-target-analysis-grid">
              <label class="history-target-analysis-option ${!hasActiveAnalysis ? "is-disabled" : ""}">
                <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::hide_source_series" ${analysis.hide_source_series && hasActiveAnalysis ? "checked" : ""} ${!hasActiveAnalysis ? "disabled" : ""}>
                <span>Hide source series</span>
              </label>
              <div class="history-target-analysis-group ${analysis.show_trend_lines ? "is-open" : ""}">
                <label class="history-target-analysis-option">
                  <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_trend_lines" ${analysis.show_trend_lines ? "checked" : ""}>
                  <span>Show trend lines</span>
                </label>
                ${analysis.show_trend_lines ? `
                  <div class="history-target-analysis-group-body">
                    <label class="history-target-analysis-option">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_trend_crosshairs" ${analysis.show_trend_crosshairs ? "checked" : ""}>
                      <span>Show trend crosshairs</span>
                    </label>
                    <label class="history-target-analysis-field">
                      <span class="history-target-analysis-field-label">Trend method</span>
                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::trend_method">
                        ${renderAnalysisSelectOptions(ANALYSIS_TREND_METHOD_OPTIONS, analysis.trend_method)}
                      </select>
                    </label>
                    ${analysis.trend_method === "rolling_average" ? `
                      <label class="history-target-analysis-field">
                        <span class="history-target-analysis-field-label">Trend window</span>
                        <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::trend_window">
                          ${renderAnalysisSelectOptions(ANALYSIS_TREND_WINDOW_OPTIONS, analysis.trend_window)}
                        </select>
                      </label>
                    ` : ""}
                  </div>
                ` : ""}
              </div>
              <label class="history-target-analysis-option">
                <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_summary_stats" ${analysis.show_summary_stats ? "checked" : ""}>
                <span>Show min / max / mean</span>
              </label>
              <div class="history-target-analysis-group ${analysis.show_rate_of_change ? "is-open" : ""}">
                <label class="history-target-analysis-option">
                  <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_rate_of_change" ${analysis.show_rate_of_change ? "checked" : ""}>
                  <span>Show rate of change</span>
                </label>
                ${analysis.show_rate_of_change ? `
                  <div class="history-target-analysis-group-body">
                    <label class="history-target-analysis-field">
                      <span class="history-target-analysis-field-label">Rate window</span>
                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::rate_window">
                        ${renderAnalysisSelectOptions(ANALYSIS_RATE_WINDOW_OPTIONS, analysis.rate_window)}
                      </select>
                    </label>
                  </div>
                ` : ""}
              </div>
              <div class="history-target-analysis-group ${analysis.show_threshold_analysis ? "is-open" : ""}">
                <label class="history-target-analysis-option">
                  <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_threshold_analysis" ${analysis.show_threshold_analysis ? "checked" : ""}>
                  <span>Show threshold analysis</span>
                </label>
                ${analysis.show_threshold_analysis ? `
                  <div class="history-target-analysis-group-body">
                    <label class="history-target-analysis-option">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_threshold_shading" ${analysis.show_threshold_shading ? "checked" : ""}>
                      <span>Shade threshold area</span>
                    </label>
                    <label class="history-target-analysis-field">
                      <span class="history-target-analysis-field-label">Threshold</span>
                      <div class="history-target-analysis-toggle-group">
                        <input
                          class="history-target-analysis-input"
                          type="number"
                          step="any"
                          inputmode="decimal"
                          data-series-analysis-input="${esc(row.entity_id)}::threshold_value"
                          value="${esc(analysis.threshold_value)}"
                          placeholder="Threshold"
                        >
                        <span class="sidebar-analysis-threshold-unit">${esc(unit)}</span>
                      </div>
                    </label>
                    ${analysis.show_threshold_shading ? `
                      <label class="history-target-analysis-field">
                        <span class="history-target-analysis-field-label">Shade area</span>
                        <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::threshold_direction">
                          <option value="above" ${analysis.threshold_direction !== "below" ? "selected" : ""}>Shade above</option>
                          <option value="below" ${analysis.threshold_direction === "below" ? "selected" : ""}>Shade below</option>
                        </select>
                      </label>
                    ` : ""}
                  </div>
                ` : ""}
              </div>
              <div class="history-target-analysis-group ${analysis.show_anomalies ? "is-open" : ""}">
                <label class="history-target-analysis-option">
                  <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_anomalies" ${analysis.show_anomalies ? "checked" : ""}>
                  <span>Show anomalies</span>
                </label>
                ${analysis.show_anomalies ? `
                  <div class="history-target-analysis-group-body">
                    <label class="history-target-analysis-field">
                      <span class="history-target-analysis-field-label">Sensitivity</span>
                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_sensitivity">
                        ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS, analysis.anomaly_sensitivity)}
                      </select>
                    </label>
                    <div class="history-target-analysis-method-list">
                      ${ANALYSIS_ANOMALY_METHOD_OPTIONS.map((opt) => {
                        const isChecked = analysis.anomaly_methods.includes(opt.value);
                        return `
                        <div class="history-target-analysis-method-item">
                          <label class="history-target-analysis-option">
                            <input type="checkbox"
                              data-series-analysis-option="${esc(row.entity_id)}::anomaly_method_toggle_${esc(opt.value)}"
                              ${isChecked ? "checked" : ""}>
                            <span>${esc(opt.label)}</span>
                            ${opt.help ? `
                              <span class="analysis-method-help" id="amh-${esc(row.entity_id.replace(/\./g, "-"))}-${esc(opt.value)}" tabindex="0">?</span>
                              <ha-tooltip for="amh-${esc(row.entity_id.replace(/\./g, "-"))}-${esc(opt.value)}" placement="right" hoist>${esc(opt.help)}</ha-tooltip>
                            ` : ""}
                            ${isChecked ? `<span class="analysis-computing-spinner" data-analysis-spinner="${esc(row.entity_id)}"></span>` : ""}
                          </label>
                          ${isChecked && opt.value === "rate_of_change" ? `
                            <div class="history-target-analysis-method-subopts">
                              <label class="history-target-analysis-field">
                                <span class="history-target-analysis-field-label">Rate window</span>
                                <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_rate_window">
                                  ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS, analysis.anomaly_rate_window)}
                                </select>
                              </label>
                            </div>
                          ` : ""}
                          ${isChecked && opt.value === "rolling_zscore" ? `
                            <div class="history-target-analysis-method-subopts">
                              <label class="history-target-analysis-field">
                                <span class="history-target-analysis-field-label">Rolling window</span>
                                <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_zscore_window">
                                  ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS, analysis.anomaly_zscore_window)}
                                </select>
                              </label>
                            </div>
                          ` : ""}
                          ${isChecked && opt.value === "persistence" ? `
                            <div class="history-target-analysis-method-subopts">
                              <label class="history-target-analysis-field">
                                <span class="history-target-analysis-field-label">Min flat duration</span>
                                <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_persistence_window">
                                  ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS, analysis.anomaly_persistence_window)}
                                </select>
                              </label>
                            </div>
                          ` : ""}
                          ${isChecked && opt.value === "comparison_window" ? `
                            <div class="history-target-analysis-method-subopts">
                              <label class="history-target-analysis-field">
                                <span class="history-target-analysis-field-label">Compare to window</span>
                                <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_comparison_window_id">
                                  <option value="" ${!analysis.anomaly_comparison_window_id ? "selected" : ""}>— select window —</option>
                                  ${this._comparisonWindows.map((win) => `<option value="${esc(win.id)}" ${analysis.anomaly_comparison_window_id === win.id ? "selected" : ""}>${esc(win.label || win.id)}</option>`).join("")}
                                  <option value="__add_new__">+ Add date window</option>
                                </select>
                              </label>
                            </div>
                          ` : ""}
                        </div>`;
                      }).join("")}
                    </div>
                    ${analysis.anomaly_methods.length >= 2 ? `
                      <label class="history-target-analysis-field">
                        <span class="history-target-analysis-field-label">When methods overlap</span>
                        <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_overlap_mode">
                          ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS, analysis.anomaly_overlap_mode)}
                        </select>
                      </label>
                    ` : ""}
                  </div>
                ` : ""}
              </div>
              <div class="history-target-analysis-group ${analysis.show_delta_analysis && canShowDeltaAnalysis ? "is-open" : ""}">
                <label class="history-target-analysis-option top">
                  <input
                    type="checkbox"
                    data-series-analysis-option="${esc(row.entity_id)}::show_delta_analysis"
                    ${analysis.show_delta_analysis && canShowDeltaAnalysis ? "checked" : ""}
                    ${canShowDeltaAnalysis ? "" : "disabled"}
                  >
                  <span>Show delta vs selected date window<br />
                    ${!canShowDeltaAnalysis ? `
                      <span class="history-target-analysis-option-help-text">Select a date window tab to enable delta analysis.</span>
                    ` : ""}
                  </span>
                </label>
                ${analysis.show_delta_analysis && canShowDeltaAnalysis ? `
                  <div class="history-target-analysis-group-body">
                    <label class="history-target-analysis-option">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_delta_tooltip" ${analysis.show_delta_tooltip ? "checked" : ""}>
                      <span>Show delta in tooltip</span>
                    </label>
                    <label class="history-target-analysis-option">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_delta_lines" ${analysis.show_delta_lines ? "checked" : ""}>
                      <span>Show delta lines</span>
                    </label>
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        ` : ""}
      </div>
    `;
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

  _reorderSeriesRows(fromIndex, toIndex) {
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
      return;
    }
    if (fromIndex < 0 || fromIndex >= this._seriesRows.length) {
      return;
    }
    if (toIndex < 0 || toIndex >= this._seriesRows.length) {
      return;
    }
    if (fromIndex === toIndex) {
      return;
    }
    const rows = [...this._seriesRows];
    const [removed] = rows.splice(fromIndex, 1);
    rows.splice(toIndex, 0, removed);
    this._seriesRows = rows;
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
      const historySpanMs = this._historyStartTime && this._historyEndTime
        ? Math.max(
          this._historyEndTime.getTime() - this._historyStartTime.getTime(),
          RANGE_SLIDER_MIN_SPAN_MS,
        )
        : null;
      const referenceSpanMs = historySpanMs ?? Math.max(
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

    if (historyStartMs != null) {
      const min = startOfUnit(new Date(historyStartMs), config.boundsUnit).getTime();
      const futureReference = addUnit(
        new Date(historyEndMs ?? endMs),
        "year",
        RANGE_FUTURE_BUFFER_YEARS,
      ).getTime();
      const maxReference = Math.max(
        futureReference,
        endMs,
        startMs + this._getSnapSpanMs(this._startTime || new Date()),
      );
      const max = endOfUnit(new Date(maxReference), config.boundsUnit).getTime();
      return { min, max: Math.max(max, min + SECOND_MS), config };
    }

    const selectionMs = Math.max(endMs - startMs, this._getSnapSpanMs(this._startTime || new Date()));
    const visibleMs = Math.max(config.baselineMs, selectionMs * 1.6);
    const centerMs = startMs + ((endMs - startMs) / 2);
    const rawMin = centerMs - (visibleMs / 2);
    const rawMax = centerMs + (visibleMs / 2);
    const min = startOfUnit(new Date(rawMin), config.boundsUnit).getTime();
    const max = endOfUnit(new Date(rawMax), config.boundsUnit).getTime();
    return { min, max, config };
  }

  _countUnitsInRange(startMs, endMs, unit) {
    const totalMs = Math.max(0, endMs - startMs);
    switch (unit) {
      case "second":
        return Math.ceil(totalMs / SECOND_MS);
      case "minute":
        return Math.ceil(totalMs / MINUTE_MS);
      case "hour":
        return Math.ceil(totalMs / HOUR_MS);
      case "day":
        return Math.ceil(totalMs / DAY_MS);
      case "week":
        return Math.ceil(totalMs / WEEK_MS);
      case "month": {
        const start = new Date(startMs);
        const end = new Date(endMs);
        return Math.max(
          1,
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
        );
      }
      case "quarter":
        return Math.max(1, Math.ceil(this._countUnitsInRange(startMs, endMs, "month") / 3));
      case "year": {
        const start = new Date(startMs);
        const end = new Date(endMs);
        return Math.max(1, end.getFullYear() - start.getFullYear() + 1);
      }
      default:
        return Math.max(1, Math.ceil(totalMs / DAY_MS));
    }
  }

  _syncTimelineWidth() {
    if (!this._rangeBounds || !this._rangeTimelineEl) return;
    const { config } = this._rangeBounds;
    const viewportWidth = Math.max(this._rangeScrollViewportEl?.clientWidth || 0, 320);
    const unitCount = this._countUnitsInRange(this._rangeBounds.min, this._rangeBounds.max, config.majorUnit);
    const contentWidth = Math.max(viewportWidth, unitCount * (config.pixelsPerUnit || 60));
    this._rangeContentWidth = contentWidth;
    this._rangeTimelineEl.style.width = `${contentWidth}px`;
  }

  _scrollTimelineToRange(range, behavior = "auto", { center = false } = {}) {
    if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !range) return;
    const viewportWidth = this._rangeScrollViewportEl.clientWidth;
    if (!viewportWidth || this._rangeContentWidth <= viewportWidth) return;
    const totalMs = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const visibleSpanMs = totalMs * Math.min(1, viewportWidth / this._rangeContentWidth);
    const maxScrollLeft = Math.max(0, this._rangeContentWidth - viewportWidth);
    const viewportRangeMs = Math.max(0, totalMs - visibleSpanMs);
    if (viewportRangeMs <= 0) return;

    const targetStart = center
      ? clampNumber(
        ((range.start + range.end) / 2) - (visibleSpanMs / 2),
        this._rangeBounds.min,
        this._rangeBounds.max - visibleSpanMs,
      )
      : clampNumber(range.start, this._rangeBounds.min, this._rangeBounds.max - visibleSpanMs);
    const ratio = (targetStart - this._rangeBounds.min) / viewportRangeMs;
    const nextLeft = clampNumber(ratio * maxScrollLeft, 0, maxScrollLeft);
    this._rangeScrollViewportEl.scrollTo({ left: nextLeft, behavior });
  }

  _revealSelectionInTimeline(behavior = "auto") {
    if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !this._startTime || !this._endTime) return;
    const focusRange = this._chartZoomCommittedRange || {
      start: this._startTime.getTime(),
      end: this._endTime.getTime(),
    };
    this._scrollTimelineToRange(focusRange, behavior, { center: true });
  }

  _updateSelectionJumpControls() {
    if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !this._startTime || !this._endTime) {
      if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = true;
      if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = true;
      return;
    }

    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const viewportWidth = this._rangeScrollViewportEl.clientWidth;
    const currentLeft = this._rangeScrollViewportEl.scrollLeft;
    const currentRight = currentLeft + viewportWidth;
    const startPx = ((this._startTime.getTime() - this._rangeBounds.min) / total) * this._rangeContentWidth;
    const endPx = ((this._endTime.getTime() - this._rangeBounds.min) / total) * this._rangeContentWidth;
    const isLeftHidden = endPx < currentLeft;
    const isRightHidden = startPx > currentRight;

    if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = !isLeftHidden;
    if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = !isRightHidden;
  }

  _getVisibleTimelineSpanMs() {
    if (!this._rangeBounds) return RANGE_SLIDER_WINDOW_MS;
    const viewportWidth = Math.max(this._rangeScrollViewportEl?.clientWidth || 0, 1);
    const contentWidth = Math.max(this._rangeContentWidth || viewportWidth, viewportWidth);
    const totalMs = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    return totalMs * Math.min(1, viewportWidth / contentWidth);
  }

  _syncRangeControl() {
    if (!this._dateControl || !this._rangeTrackEl || !this._rangeStartHandle || !this._rangeEndHandle) return;
    this._rangeBounds = this._deriveRangeBounds();
    void this._ensureTimelineEvents();
    this._draftStartTime = new Date(this._startTime);
    this._draftEndTime = new Date(this._endTime);

    this._syncTimelineWidth();
    this._updateHandleStacking();
    this._renderRangeScale();
    this._updateRangePreview();
    this._updateComparisonRangePreview();
    this._updateChartHoverIndicator();
    this._updateChartZoomHighlight();
    this._updateSelectionJumpControls();
    this._syncLiveEdgeHandle();
    window.requestAnimationFrame(() => this._revealSelectionInTimeline("auto"));
  }

  _renderScaleMarkers(fragment, unit, className, total, step = 1) {
    let markerTime = addUnit(startOfUnit(new Date(this._rangeBounds.min), unit), unit, 0);
    if (markerTime.getTime() < this._rangeBounds.min) {
      markerTime = addUnit(markerTime, unit, step);
    }
    while (markerTime.getTime() < this._rangeBounds.max) {
      const tick = document.createElement("span");
      tick.className = `range-tick ${className}`;
      tick.style.left = `${((markerTime.getTime() - this._rangeBounds.min) / total) * 100}%`;
      fragment.appendChild(tick);
      markerTime = addUnit(markerTime, unit, step);
    }
  }

  _buildRangePeriodButton(className, leftValue, total, text, unit, startTime) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `range-period-button ${className}`;
    button.style.left = `${((leftValue - this._rangeBounds.min) / total) * 100}%`;
    button.textContent = text;
    const selectionLabel = formatPeriodSelectionLabel(startTime, unit);
    button.title = `Select ${selectionLabel}`;
    button.setAttribute("aria-label", `Select ${selectionLabel}`);
    button.addEventListener("click", (ev) => this._handleRangePeriodSelect(unit, startTime, ev));
    button.addEventListener("pointerenter", () => this._setHoveredPeriodRange(unit, startTime));
    button.addEventListener("pointerleave", () => this._clearHoveredPeriodRange(unit, startTime));
    button.addEventListener("focus", () => this._setHoveredPeriodRange(unit, startTime));
    button.addEventListener("blur", () => this._clearHoveredPeriodRange(unit, startTime));
    return button;
  }

  _getRangeUnitAnchorMs(startTime, unit, anchor = "auto") {
    const unitStart = Math.max(startOfUnit(new Date(startTime), unit).getTime(), this._rangeBounds?.min ?? -Infinity);
    const unitEnd = Math.min(endOfUnit(new Date(startTime), unit).getTime(), this._rangeBounds?.max ?? Infinity);
    if (anchor === "auto") {
      if (unit === "day" || unit === "week") {
        anchor = "center";
      } else {
        anchor = "start";
      }
    }
    if (anchor === "center") {
      return unitStart + Math.max(0, (unitEnd - unitStart) / 2);
    }
    return unitStart;
  }

  _estimateRangeLabelWidth(text, className, minGap) {
    const basePadding = className === "range-context-label" ? 20 : 14;
    const charWidth = className === "range-context-label" ? 8.2 : 7.2;
    return (String(text).length * charWidth) + basePadding + minGap;
  }

  _computeRangeLabelStride(unit, formatter, className, minGap) {
    if (!this._rangeBounds || !this._rangeContentWidth) return 1;
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    let current = startOfUnit(new Date(this._rangeBounds.min), unit);
    let previousMs = null;
    let minSpacingPx = Infinity;
    let maxLabelWidthPx = 0;
    let samples = 0;

    while (current.getTime() < this._rangeBounds.max && samples < 24) {
      const currentMs = Math.max(current.getTime(), this._rangeBounds.min);
      const text = formatter(current);
      maxLabelWidthPx = Math.max(
        maxLabelWidthPx,
        this._estimateRangeLabelWidth(text, className, minGap),
      );
      if (previousMs != null) {
        const spacingPx = ((currentMs - previousMs) / total) * this._rangeContentWidth;
        if (spacingPx > 0) minSpacingPx = Math.min(minSpacingPx, spacingPx);
      }
      previousMs = currentMs;
      current = addUnit(current, unit, 1);
      samples += 1;
    }

    if (!Number.isFinite(minSpacingPx) || minSpacingPx <= 0) return 1;
    return Math.max(1, Math.ceil(maxLabelWidthPx / minSpacingPx));
  }

  _updateRangeLabelVisibility(selector, minGap = RANGE_LABEL_MIN_GAP_PX) {

  }

  _syncVisibleRangeLabels() {
    if (!this._rangeScrollViewportEl) return;
    this._updateRangeLabelVisibility(".range-scale-label", RANGE_LABEL_MIN_GAP_PX);
    this._updateRangeLabelVisibility(".range-context-label", RANGE_CONTEXT_LABEL_MIN_GAP_PX);
  }

  _renderRangeScale() {
    if (!this._rangeBounds || !this._rangeTickLayerEl || !this._rangeLabelLayerEl || !this._rangeContextLayerEl || !this._rangeEventLayerEl) return;
    this._rangeTickLayerEl.innerHTML = "";
    this._rangeEventLayerEl.innerHTML = "";
    this._rangeLabelLayerEl.innerHTML = "";
    this._rangeContextLayerEl.innerHTML = "";
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const { config } = this._rangeBounds;
    const tickFragment = document.createDocumentFragment();
    const eventFragment = document.createDocumentFragment();
    const labelFragment = document.createDocumentFragment();
    const contextFragment = document.createDocumentFragment();
    const scaleLabelStride = config.labelUnit === "month"
      ? 1
      : config.labelUnit === "day"
        ? 1
      : this._computeRangeLabelStride(
        config.labelUnit,
        (value) => formatScaleLabel(value, config.labelUnit, this._getEffectiveZoomLevel()),
        "range-scale-label",
        RANGE_LABEL_MIN_GAP_PX,
      );
    const contextLabelStride = config.contextUnit === "month"
      ? 1
      : config.contextUnit === "day"
        ? 1
      : this._computeRangeLabelStride(
        config.contextUnit,
        (value) => formatContextLabel(value, config.contextUnit),
        "range-context-label",
        RANGE_CONTEXT_LABEL_MIN_GAP_PX,
      );

    if (config.detailUnit && config.detailUnit !== config.minorUnit && config.detailUnit !== config.majorUnit) {
      this._renderScaleMarkers(tickFragment, config.detailUnit, "fine", total, config.detailStep || 1);
    }
    if (config.minorUnit !== config.majorUnit) {
      this._renderScaleMarkers(tickFragment, config.minorUnit, "", total);
    }
    this._renderScaleMarkers(tickFragment, config.majorUnit, "major", total);

    let labelRef = startOfUnit(new Date(this._rangeBounds.min), config.labelUnit);
    let labelIndex = 0;
    while (labelRef.getTime() < this._rangeBounds.max) {
      if (labelIndex % scaleLabelStride === 0) {
        const leftValue = this._getRangeUnitAnchorMs(labelRef, config.labelUnit, "auto");
        const label = this._buildRangePeriodButton(
          "range-scale-label",
          leftValue,
          total,
          formatScaleLabel(labelRef, config.labelUnit, this._getEffectiveZoomLevel()),
          config.labelUnit,
          labelRef,
        );
        labelFragment.appendChild(label);
      }
      labelRef = addUnit(labelRef, config.labelUnit, 1);
      labelIndex += 1;
    }

    let contextRef = startOfUnit(new Date(this._rangeBounds.min), config.contextUnit);
    if (contextRef.getTime() < this._rangeBounds.min) {
      contextRef = addUnit(contextRef, config.contextUnit, 1);
    }
    let contextIndex = 0;
    while (contextRef.getTime() < this._rangeBounds.max) {
      const left = `${((contextRef.getTime() - this._rangeBounds.min) / total) * 100}%`;

      const divider = document.createElement("span");
      divider.className = "range-divider";
      divider.style.left = left;
      contextFragment.appendChild(divider);

      if (contextIndex % contextLabelStride === 0) {
        const label = this._buildRangePeriodButton(
          "range-context-label",
          contextRef.getTime(),
          total,
          formatContextLabel(contextRef, config.contextUnit),
          config.contextUnit,
          contextRef,
        );
        contextFragment.appendChild(label);
      }

      contextRef = addUnit(contextRef, config.contextUnit, 1);
      contextIndex += 1;
    }

    for (const event of this._timelineEvents || []) {
      const timestamp = new Date(event.timestamp).getTime();
      if (!Number.isFinite(timestamp) || timestamp < this._rangeBounds.min || timestamp > this._rangeBounds.max) continue;
      const dot = document.createElement("span");
      dot.className = "range-event-dot";
      dot.style.left = `${((timestamp - this._rangeBounds.min) / total) * 100}%`;
      dot.style.background = event.color || "#03a9f4";
      eventFragment.appendChild(dot);
    }

    this._rangeTickLayerEl.appendChild(tickFragment);
    this._rangeEventLayerEl.appendChild(eventFragment);
    this._rangeLabelLayerEl.appendChild(labelFragment);
    this._rangeContextLayerEl.appendChild(contextFragment);
    this._updateHoveredPeriodPreview();
    this._updateComparisonRangePreview();
    this._syncVisibleRangeLabels();
  }

  _handleRangePeriodSelect(unit, startTime, ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const periodStart = startOfUnit(new Date(startTime), unit);
    const periodEnd = endOfUnit(new Date(startTime), unit);
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    this._clearAutoZoomTimer();
    this._draftStartTime = new Date(periodStart);
    this._draftEndTime = new Date(periodEnd);
    this._updateRangePreview();
    this._applyCommittedRange(periodStart, periodEnd, { push: true });
  }

  _setHoveredPeriodRange(unit, startTime) {
    const start = startOfUnit(new Date(startTime), unit);
    const end = endOfUnit(new Date(startTime), unit);
    this._hoveredPeriodRange = {
      unit,
      start: start.getTime(),
      end: end.getTime(),
    };
    this._updateHoveredPeriodPreview();
  }

  _setHoveredPeriodRangeFromTimestamp(timestamp, unit = this._rangeBounds?.config?.labelUnit) {
    if (timestamp == null || !unit) return;
    this._setHoveredPeriodRange(unit, new Date(timestamp));
  }

  _clearHoveredPeriodRange(unit, startTime) {
    if (!this._hoveredPeriodRange) return;
    const start = startOfUnit(new Date(startTime), unit).getTime();
    const end = endOfUnit(new Date(startTime), unit).getTime();
    if (this._hoveredPeriodRange.start === start && this._hoveredPeriodRange.end === end) {
      this._hoveredPeriodRange = null;
      this._updateHoveredPeriodPreview();
    }
  }

  _updateHoveredPeriodPreview() {
    if (!this._rangeHoverPreviewEl || !this._rangeBounds || !this._hoveredPeriodRange) {
      if (this._rangeHoverPreviewEl) {
        this._rangeHoverPreviewEl.classList.remove("visible");
      }
      return;
    }
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const start = clampNumber(this._hoveredPeriodRange.start, this._rangeBounds.min, this._rangeBounds.max);
    const end = clampNumber(this._hoveredPeriodRange.end, this._rangeBounds.min, this._rangeBounds.max);
    const startPct = ((start - this._rangeBounds.min) / total) * 100;
    const endPct = ((end - this._rangeBounds.min) / total) * 100;
    this._rangeHoverPreviewEl.style.left = `${startPct}%`;
    this._rangeHoverPreviewEl.style.width = `${Math.max(0, endPct - startPct)}%`;
    this._rangeHoverPreviewEl.classList.add("visible");
  }

  _updateComparisonRangePreview() {
    const comparisonWindow = this._getActiveComparisonWindow();
    if (!this._rangeComparisonPreviewEl || !this._rangeBounds || !comparisonWindow) {
      if (this._rangeComparisonPreviewEl) {
        this._rangeComparisonPreviewEl.classList.remove("visible");
      }
      this._updateZoomWindowHighlight();
      return;
    }
    const startMs = new Date(comparisonWindow.start_time).getTime();
    const endMs = new Date(comparisonWindow.end_time).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
      this._rangeComparisonPreviewEl.classList.remove("visible");
      this._updateZoomWindowHighlight();
      return;
    }
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const start = clampNumber(startMs, this._rangeBounds.min, this._rangeBounds.max);
    const end = clampNumber(endMs, this._rangeBounds.min, this._rangeBounds.max);
    const startPct = ((start - this._rangeBounds.min) / total) * 100;
    const endPct = ((end - this._rangeBounds.min) / total) * 100;
    this._rangeComparisonPreviewEl.style.left = `${startPct}%`;
    this._rangeComparisonPreviewEl.style.width = `${Math.max(0, endPct - startPct)}%`;
    this._rangeComparisonPreviewEl.classList.add("visible");
    this._updateZoomWindowHighlight();
  }

  _updateHandleStacking(activeHandle = this._activeRangeHandle) {
    if (!this._rangeStartHandle || !this._rangeEndHandle) return;
    this._rangeStartHandle.style.zIndex = activeHandle === "start" ? "5" : "3";
    this._rangeEndHandle.style.zIndex = activeHandle === "end" ? "5" : "4";
  }

  _getVisibleRangeTooltipHandles() {
    if (this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return ["start", "end"];
    const handle = this._activeRangeHandle || this._focusedRangeHandle || this._hoveredRangeHandle || null;
    return handle ? [handle] : [];
  }

  _handleRangeViewportPointerMove(ev) {
    if (this._timelinePointerId != null || this._rangePointerId != null) return;
    if (ev.target === this._rangeStartHandle || ev.target === this._rangeEndHandle) return;
    if (ev.target.closest?.(".range-period-button") || ev.target.closest?.(".range-selection")) return;
    const timestamp = this._timestampFromClientX(ev.clientX);
    if (timestamp == null) return;
    this._setHoveredPeriodRangeFromTimestamp(timestamp);
  }

  _handleRangeViewportPointerLeave() {
    if (this._timelinePointerId != null || this._rangePointerId != null) return;
    this._hoveredPeriodRange = null;
    this._updateHoveredPeriodPreview();
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
    if (!this._rangeChartHoverLineEl || !this._rangeBounds || this._chartHoverTimeMs == null) {
      if (this._rangeChartHoverLineEl) {
        this._rangeChartHoverLineEl.classList.remove("visible");
      }
      if (this._rangeChartHoverWindowLineEl) {
        this._rangeChartHoverWindowLineEl.classList.remove("visible");
      }
      return;
    }
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const clamped = clampNumber(this._chartHoverTimeMs, this._rangeBounds.min, this._rangeBounds.max);
    const leftPct = ((clamped - this._rangeBounds.min) / total) * 100;
    this._rangeChartHoverLineEl.style.left = `${leftPct}%`;
    this._rangeChartHoverLineEl.classList.add("visible");

    const activeWindow = this._getActiveComparisonWindow();
    if (this._rangeChartHoverWindowLineEl && activeWindow && this._startTime) {
      const timeOffsetMs = new Date(activeWindow.start_time).getTime() - this._startTime.getTime();
      const windowTimeMs = this._chartHoverTimeMs + timeOffsetMs;
      const clampedWindow = clampNumber(windowTimeMs, this._rangeBounds.min, this._rangeBounds.max);
      const windowLeftPct = ((clampedWindow - this._rangeBounds.min) / total) * 100;
      this._rangeChartHoverWindowLineEl.style.left = `${windowLeftPct}%`;
      this._rangeChartHoverWindowLineEl.classList.add("visible");
    } else if (this._rangeChartHoverWindowLineEl) {
      this._rangeChartHoverWindowLineEl.classList.remove("visible");
    }
  }

  _updateChartZoomHighlight() {
    const highlightRange = this._chartZoomRange || this._chartZoomCommittedRange;
    if (!this._rangeZoomHighlightEl || !this._rangeBounds || !highlightRange) {
      if (this._rangeZoomHighlightEl) {
        this._rangeZoomHighlightEl.classList.remove("visible");
      }
      this._updateZoomWindowHighlight();
      return;
    }
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const start = clampNumber(highlightRange.start, this._rangeBounds.min, this._rangeBounds.max);
    const end = clampNumber(highlightRange.end, this._rangeBounds.min, this._rangeBounds.max);
    const startPct = ((start - this._rangeBounds.min) / total) * 100;
    const endPct = ((end - this._rangeBounds.min) / total) * 100;
    this._rangeZoomHighlightEl.style.left = `${startPct}%`;
    this._rangeZoomHighlightEl.style.width = `${Math.max(0, endPct - startPct)}%`;
    this._rangeZoomHighlightEl.classList.add("visible");
    this._updateZoomWindowHighlight();
  }

  _updateZoomWindowHighlight() {
    const activeWindow = this._getActiveComparisonWindow();
    const zoomRange = this._chartZoomRange || this._chartZoomCommittedRange;
    if (!this._rangeZoomWindowHighlightEl || !this._rangeBounds || !activeWindow || !zoomRange || !this._startTime) {
      if (this._rangeZoomWindowHighlightEl) {
        this._rangeZoomWindowHighlightEl.classList.remove("visible");
      }
      return;
    }
    const windowStartMs = new Date(activeWindow.start_time).getTime();
    const windowEndMs = new Date(activeWindow.end_time).getTime();
    if (!Number.isFinite(windowStartMs) || !Number.isFinite(windowEndMs) || windowStartMs >= windowEndMs) {
      this._rangeZoomWindowHighlightEl.classList.remove("visible");
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
      this._rangeZoomWindowHighlightEl.classList.remove("visible");
      return;
    }
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const clampedStart = clampNumber(intersectStart, this._rangeBounds.min, this._rangeBounds.max);
    const clampedEnd = clampNumber(intersectEnd, this._rangeBounds.min, this._rangeBounds.max);
    if (clampedEnd <= clampedStart) {
      this._rangeZoomWindowHighlightEl.classList.remove("visible");
      return;
    }
    const startPct = ((clampedStart - this._rangeBounds.min) / total) * 100;
    const endPct = ((clampedEnd - this._rangeBounds.min) / total) * 100;
    this._rangeZoomWindowHighlightEl.style.left = `${startPct}%`;
    this._rangeZoomWindowHighlightEl.style.width = `${Math.max(0, endPct - startPct)}%`;
    this._rangeZoomWindowHighlightEl.classList.add("visible");
  }

  _setRangeTooltipHoverHandle(handle) {
    if (handle !== "start" && handle !== "end") return;
    this._hoveredRangeHandle = handle;
    this._updateRangeTooltip();
  }

  _clearRangeTooltipHoverHandle(handle) {
    if (this._activeRangeHandle === handle) return;
    if (this._hoveredRangeHandle === handle) {
      this._hoveredRangeHandle = null;
    }
    this._updateRangeTooltip();
  }

  _setRangeTooltipFocusHandle(handle) {
    if (handle !== "start" && handle !== "end") return;
    this._focusedRangeHandle = handle;
    this._updateRangeTooltip();
  }

  _clearRangeTooltipFocusHandle(handle) {
    if (this._activeRangeHandle === handle) return;
    if (this._focusedRangeHandle === handle) {
      this._focusedRangeHandle = null;
    }
    this._updateRangeTooltip();
  }

  _updateRangeTooltip() {
    if (!this._rangeBounds || !this._rangeScrollViewportEl) return;
    const visibleHandles = new Set(this._getVisibleRangeTooltipHandles());
    this._updateRangeTooltipForHandle("start", visibleHandles.has("start"));
    this._updateRangeTooltipForHandle("end", visibleHandles.has("end"));
  }

  _updateRangeTooltipForHandle(handle, visible) {
    const tooltip = handle === "start" ? this._rangeStartTooltipEl : this._rangeEndTooltipEl;
    if (!tooltip) return;
    if (!visible) {
      tooltip.classList.remove("visible");
      tooltip.setAttribute("aria-hidden", "true");
      return;
    }

    const value = handle === "start" ? this._draftStartTime : this._draftEndTime;
    if (!value || !this._rangeBounds || !this._rangeScrollViewportEl) {
      tooltip.classList.remove("visible");
      tooltip.setAttribute("aria-hidden", "true");
      return;
    }

    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const contentWidth = Math.max(
      this._rangeContentWidth || 0,
      this._rangeScrollViewportEl.clientWidth || 0,
      1,
    );
    const valuePx = ((value.getTime() - this._rangeBounds.min) / total) * contentWidth;
    const viewportX = valuePx - this._rangeScrollViewportEl.scrollLeft;
    const clampedX = clampNumber(viewportX, 0, this._rangeScrollViewportEl.clientWidth);
    if (handle === "end" && this._isOnLiveEdge()) {
      const dateEl = document.createElement("span");
      dateEl.textContent = formatRangeDateTime(value);
      const hintEl = document.createElement("span");
      hintEl.className = "range-tooltip-live-hint";
      hintEl.textContent = "Updates with new data";
      tooltip.textContent = "";
      tooltip.append(dateEl, hintEl);
    } else {
      tooltip.textContent = formatRangeDateTime(value);
    }
    tooltip.style.left = `${clampedX}px`;
    tooltip.classList.add("visible");
    tooltip.setAttribute("aria-hidden", "false");
  }

  _handleTimelinePointerDown(ev) {
    if (ev.button !== 0) return;
    if (ev.target === this._rangeStartHandle || ev.target === this._rangeEndHandle) return;
    if (ev.target.closest?.(".range-period-button")) return;
    if (!this._rangeScrollViewportEl) return;
    const isSelectionDrag = !!ev.target.closest?.(".range-selection");
    const trackRect = this._rangeTrackEl?.getBoundingClientRect();
    const isTrackRegion = !!trackRect && ev.clientY >= (trackRect.top - 6) && ev.clientY <= (trackRect.bottom + 6);
    const isIntervalSelect = !isSelectionDrag && !isTrackRegion;

    this._detachTimelinePointerListeners();
    this._rangeInteractionActive = isSelectionDrag || isIntervalSelect;
    if ((isSelectionDrag || isIntervalSelect) && this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    this._timelinePointerId = ev.pointerId;
    this._timelinePointerStartX = ev.clientX;
    this._timelinePointerStartScrollLeft = this._rangeScrollViewportEl.scrollLeft;
    this._timelinePointerStartTimestamp = (isSelectionDrag || isIntervalSelect) ? this._timestampFromClientX(ev.clientX) : null;
    this._timelinePointerMode = isSelectionDrag ? "selection" : isIntervalSelect ? "interval_select" : "pan";
    this._timelineDragStartRangeMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? 0;
    this._timelineDragEndRangeMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? 0;
    this._timelineDragStartZoomRange = this._chartZoomCommittedRange
      ? { ...this._chartZoomCommittedRange }
      : null;
    this._timelinePointerMoved = false;
    this._timelineTrackClickPending = !isSelectionDrag && !isIntervalSelect && !!ev.target.closest?.(".range-track");
    this._rangeScrollViewportEl.classList.remove("dragging");
    this._rangeSelectionEl?.classList.toggle("dragging", isSelectionDrag);
    window.addEventListener("pointermove", this._onTimelinePointerMove);
    window.addEventListener("pointerup", this._onTimelinePointerUp);
    window.addEventListener("pointercancel", this._onTimelinePointerUp);
  }

  _detachTimelinePointerListeners() {
    window.removeEventListener("pointermove", this._onTimelinePointerMove);
    window.removeEventListener("pointerup", this._onTimelinePointerUp);
    window.removeEventListener("pointercancel", this._onTimelinePointerUp);
    if (this._rangeScrollViewportEl) {
      this._rangeScrollViewportEl.classList.remove("dragging");
    }
    this._rangeSelectionEl?.classList.remove("dragging");
    this._timelinePointerId = null;
    this._timelinePointerStartTimestamp = null;
    this._timelinePointerMode = null;
    this._timelineDragStartZoomRange = null;
    this._rangeInteractionActive = false;
    this._timelinePointerMoved = false;
    this._timelineTrackClickPending = false;
  }

  _handleTimelinePointerMove(ev) {
    if (this._timelinePointerId == null || ev.pointerId !== this._timelinePointerId || !this._rangeScrollViewportEl) return;
    if (this._timelinePointerMode === "selection") {
      const timestamp = this._timestampFromClientX(ev.clientX);
      if (timestamp == null || this._timelinePointerStartTimestamp == null) return;
      const deltaX = ev.clientX - this._timelinePointerStartX;
      if (!this._timelinePointerMoved && Math.abs(deltaX) < 4) return;
      this._timelinePointerMoved = true;
      this._shiftDraftRangeByDelta(this._getTimelineSelectionDragDeltaMs(timestamp));
      ev.preventDefault();
      return;
    }
    if (this._timelinePointerMode === "interval_select") {
      const timestamp = this._timestampFromClientX(ev.clientX);
      if (timestamp == null || this._timelinePointerStartTimestamp == null) return;
      const deltaX = ev.clientX - this._timelinePointerStartX;
      if (!this._timelinePointerMoved && Math.abs(deltaX) < 4) return;
      this._timelinePointerMoved = true;
      this._setDraftRangeFromIntervalSelection(this._timelinePointerStartTimestamp, timestamp);
      ev.preventDefault();
      return;
    }
    const deltaX = ev.clientX - this._timelinePointerStartX;
    if (!this._timelinePointerMoved && Math.abs(deltaX) < 4) return;
    this._timelinePointerMoved = true;
    this._timelineTrackClickPending = false;
    this._rangeScrollViewportEl.classList.add("dragging");
    const maxScrollLeft = Math.max(0, this._rangeScrollViewportEl.scrollWidth - this._rangeScrollViewportEl.clientWidth);
    this._rangeScrollViewportEl.scrollLeft = clampNumber(
      this._timelinePointerStartScrollLeft - deltaX,
      0,
      maxScrollLeft,
    );
    ev.preventDefault();
  }

  _finishTimelinePointerInteraction(ev) {
    if (this._timelinePointerId == null || ev.pointerId !== this._timelinePointerId) return;
    const mode = this._timelinePointerMode;
    const shouldSelectTrack = this._timelineTrackClickPending && !this._timelinePointerMoved;
    const clientX = ev.clientX;
    this._detachTimelinePointerListeners();
    if (mode === "selection") {
      this._focusedRangeHandle = null;
      this._hoveredRangeHandle = null;
      this._updateRangeTooltip();
      if (this._timelinePointerMoved) {
        this._chartZoomCommittedRange = this._chartZoomRange
          ? { ...this._chartZoomRange }
          : this._chartZoomCommittedRange;
        this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
        this._commitRangeSelection({ push: true });
      } else {
        this._chartZoomRange = this._chartZoomCommittedRange
          ? { ...this._chartZoomCommittedRange }
          : null;
        this._updateChartZoomHighlight();
      }
      return;
    }
    if (mode === "interval_select") {
      this._hoveredPeriodRange = null;
      this._updateHoveredPeriodPreview();
      this._updateRangeTooltip();
      if (this._timelinePointerMoved) {
        this._commitRangeSelection({ push: true });
      }
      return;
    }
    if (shouldSelectTrack) {
      this._handleTrackSelectionAtClientX(clientX);
    }
  }

  _timestampFromClientX(clientX) {
    if (!this._rangeBounds || !this._rangeTrackEl) return null;
    const rect = this._rangeTrackEl.getBoundingClientRect();
    if (!rect.width) return null;
    const ratio = clampNumber((clientX - rect.left) / rect.width, 0, 1);
    return this._rangeBounds.min + ratio * (this._rangeBounds.max - this._rangeBounds.min);
  }

  _getTimelineSelectionDragDeltaMs(timestamp) {
    if (timestamp == null || this._timelinePointerStartTimestamp == null) return 0;
    const snapUnit = this._getEffectiveSnapUnit();
    if (!snapUnit) return timestamp - this._timelinePointerStartTimestamp;
    const snappedStart = snapDateToUnit(new Date(this._timelinePointerStartTimestamp), snapUnit).getTime();
    const snappedCurrent = snapDateToUnit(new Date(timestamp), snapUnit).getTime();
    return snappedCurrent - snappedStart;
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

  _shiftDraftRangeByDelta(deltaMs) {
    if (!this._rangeBounds) return;
    const startMs = this._timelineDragStartRangeMs;
    const endMs = this._timelineDragEndRangeMs;
    const spanMs = Math.max(SECOND_MS, endMs - startMs);
    const minDelta = this._rangeBounds.min - startMs;
    const maxDelta = this._rangeBounds.max - endMs;
    const clampedDelta = clampNumber(deltaMs, minDelta, maxDelta);
    this._draftStartTime = new Date(startMs + clampedDelta);
    this._draftEndTime = new Date(endMs + clampedDelta);
    if (this._timelineDragStartZoomRange) {
      this._chartZoomRange = {
        start: this._timelineDragStartZoomRange.start + clampedDelta,
        end: this._timelineDragStartZoomRange.end + clampedDelta,
      };
      this._updateChartZoomHighlight();
    }
    this._updateRangePreview();
    this._scheduleAutoZoomUpdate();
    this._scheduleRangeCommit();
  }

  _setDraftRangeFromIntervalSelection(startTimestamp, endTimestamp) {
    if (!this._rangeBounds) return;
    const unit = this._rangeBounds.config?.labelUnit || this._getEffectiveSnapUnit();
    const startValue = Math.min(startTimestamp, endTimestamp);
    const endValue = Math.max(startTimestamp, endTimestamp);
    const rangeStart = clampNumber(startOfUnit(new Date(startValue), unit).getTime(), this._rangeBounds.min, this._rangeBounds.max);
    const rangeEnd = clampNumber(endOfUnit(new Date(endValue), unit).getTime(), this._rangeBounds.min, this._rangeBounds.max);
    if (rangeStart >= rangeEnd) return;
    this._draftStartTime = new Date(rangeStart);
    this._draftEndTime = new Date(rangeEnd);
    this._updateRangePreview();
  }

  _handleTrackSelectionAtClientX(clientX) {
    const timestamp = this._timestampFromClientX(clientX);
    if (timestamp == null) return;
    const startMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? this._rangeBounds?.min;
    const endMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? this._rangeBounds?.max;
    const handle = Math.abs(timestamp - startMs) <= Math.abs(timestamp - endMs) ? "start" : "end";
    this._setDraftRangeFromTimestamp(handle, timestamp);
  }

  _beginRangePointerInteraction(handle, ev) {
    if (!this._rangeTrackEl) return;
    ev.preventDefault();
    this._rangeInteractionActive = true;
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    this._activeRangeHandle = handle;
    this._hoveredRangeHandle = handle;
    this._rangePointerId = ev.pointerId;
    this._updateHandleStacking(handle);
    this._updateRangeTooltip();
    this._attachRangePointerListeners();
    const target = handle === "start" ? this._rangeStartHandle : this._rangeEndHandle;
    target?.focus();
    const timestamp = this._timestampFromClientX(ev.clientX);
    if (timestamp != null) {
      this._setDraftRangeFromTimestamp(handle, timestamp);
    }
  }

  _maybeAutoScrollTimelineDuringHandleDrag(clientX) {
    if (!this._rangeScrollViewportEl) return;
    const viewport = this._rangeScrollViewportEl;
    const rect = viewport.getBoundingClientRect();
    if (!rect.width) return;
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    if (maxScrollLeft <= 0) return;

    let delta = 0;
    const leftDistance = clientX - rect.left;
    const rightDistance = rect.right - clientX;

    if (leftDistance < RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX) {
      const ratio = clampNumber(
        (RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - leftDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
        0,
        1,
      );
      delta = -Math.max(1, Math.round(ratio * RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX));
    } else if (rightDistance < RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX) {
      const ratio = clampNumber(
        (RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - rightDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
        0,
        1,
      );
      delta = Math.max(1, Math.round(ratio * RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX));
    }

    if (!delta) return;
    viewport.scrollLeft = clampNumber(viewport.scrollLeft + delta, 0, maxScrollLeft);
  }

  _attachRangePointerListeners() {
    window.addEventListener("pointermove", this._onRangePointerMove);
    window.addEventListener("pointerup", this._onRangePointerUp);
    window.addEventListener("pointercancel", this._onRangePointerUp);
  }

  _detachRangePointerListeners() {
    window.removeEventListener("pointermove", this._onRangePointerMove);
    window.removeEventListener("pointerup", this._onRangePointerUp);
    window.removeEventListener("pointercancel", this._onRangePointerUp);
    this._rangePointerId = null;
    this._activeRangeHandle = null;
    this._rangeInteractionActive = false;
    this._updateHandleStacking();
    this._updateRangeTooltip();
  }

  _handleRangePointerMove(ev) {
    if (!this._activeRangeHandle) return;
    if (this._rangePointerId != null && ev.pointerId !== this._rangePointerId) return;
    this._maybeAutoScrollTimelineDuringHandleDrag(ev.clientX);
    const timestamp = this._timestampFromClientX(ev.clientX);
    if (timestamp == null) return;
    ev.preventDefault();
    this._setDraftRangeFromTimestamp(this._activeRangeHandle, timestamp);
  }

  _finishRangePointerInteraction(ev) {
    if (!this._activeRangeHandle) return;
    if (this._rangePointerId != null && ev.pointerId !== this._rangePointerId) return;
    this._detachRangePointerListeners();
    this._focusedRangeHandle = null;
    this._hoveredRangeHandle = null;
    this._updateRangeTooltip();
    this._commitRangeSelection({ push: true });
  }

  _handleRangeHandleKeyDown(handle, ev) {
    if (!this._rangeBounds) return;
    const snapUnit = this._getEffectiveSnapUnit();
    const currentValue = handle === "start"
      ? this._draftStartTime?.getTime() ?? this._startTime?.getTime()
      : this._draftEndTime?.getTime() ?? this._endTime?.getTime();
    if (currentValue == null) return;

    let nextValue = null;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") nextValue = addUnit(new Date(currentValue), snapUnit, -1).getTime();
    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") nextValue = addUnit(new Date(currentValue), snapUnit, 1).getTime();
    if (ev.key === "PageDown") nextValue = addUnit(new Date(currentValue), this._getZoomConfig().majorUnit, -1).getTime();
    if (ev.key === "PageUp") nextValue = addUnit(new Date(currentValue), this._getZoomConfig().majorUnit, 1).getTime();
    if (ev.key === "Home") nextValue = this._rangeBounds.min;
    if (ev.key === "End") nextValue = this._rangeBounds.max;
    if (nextValue == null) return;

    ev.preventDefault();
    this._focusedRangeHandle = handle;
    this._setDraftRangeFromTimestamp(handle, nextValue);
  }

  _updateRangePreview() {
    if (!this._rangeBounds || !this._draftStartTime || !this._draftEndTime) return;
    const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
    const startPct = ((this._draftStartTime.getTime() - this._rangeBounds.min) / total) * 100;
    const endPct = ((this._draftEndTime.getTime() - this._rangeBounds.min) / total) * 100;
    if (this._rangeSelectionEl) {
      this._rangeSelectionEl.style.left = `${startPct}%`;
      this._rangeSelectionEl.style.width = `${Math.max(0, endPct - startPct)}%`;
    }
    if (this._rangeStartHandle) {
      this._rangeStartHandle.style.left = `${startPct}%`;
      this._rangeStartHandle.setAttribute("aria-valuetext", formatRangeDateTime(this._draftStartTime));
      this._rangeStartHandle.removeAttribute("title");
    }
    if (this._rangeEndHandle) {
      this._rangeEndHandle.style.left = `${endPct}%`;
      this._rangeEndHandle.setAttribute("aria-valuetext", formatRangeDateTime(this._draftEndTime));
      this._rangeEndHandle.removeAttribute("title");
    }
    if (this._rangeCaptionEl) {
      this._rangeCaptionEl.textContent = formatRangeSummary(this._draftStartTime, this._draftEndTime);
    }
    if (this._dateControl) {
      this._dateControl.title = formatRangeSummary(this._draftStartTime, this._draftEndTime);
    }
    this._updateRangeTooltip();
  }

  _scheduleRangeCommit() {
    if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
    if (this._rangeCommitTimer) window.clearTimeout(this._rangeCommitTimer);
    this._rangeCommitTimer = window.setTimeout(() => {
      this._rangeCommitTimer = null;
      this._commitRangeSelection({ push: false });
    }, 240);
  }

  _scheduleAutoZoomUpdate() {
    if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
    if (this._zoomLevel !== "auto" || !this._rangeBounds) return;
    const start = this._draftStartTime || this._startTime;
    const end = this._draftEndTime || this._endTime;
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
      const latestStart = this._draftStartTime || this._startTime;
      const latestEnd = this._draftEndTime || this._endTime;
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

  /** Toggle the red breathing indicator on the end handle. */
  _syncLiveEdgeHandle() {
    if (!this._rangeEndHandle) {
      return;
    }
    this._rangeEndHandle.classList.toggle("is-live", this._isOnLiveEdge());
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
    this._updateSelectionJumpControls();
    this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
    window.requestAnimationFrame(() => this._revealSelectionInTimeline(push ? "smooth" : "auto"));
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
