import type {
  HistoryAppStateContext,
  HistoryComparisonWindowState,
  HistoryPageState,
  HistoryTargetRowState,
} from "./types";

function createInitialHistoryPageState(): HistoryPageState {
  return {
    display: {
      sidebarCollapsed: false,
    },
    range: {
      startTime: null,
      endTime: null,
      previewZoomRange: null,
      committedZoomRange: null,
    },
    comparison: {
      windows: [],
      selectedWindowId: null,
      hoveredWindowId: null,
    },
    targets: {
      selection: {},
      rawSelection: {},
      rows: [],
    },
  };
}

export function createHistoryPageAppStateContext(): HistoryAppStateContext {
  const state = createInitialHistoryPageState();

  return {
    state,

    setSidebarCollapsed(value: boolean): void {
      state.display.sidebarCollapsed = value;
    },

    setRange(startTime: Date | null, endTime: Date | null): void {
      state.range.startTime = startTime;
      state.range.endTime = endTime;
    },

    setPreviewZoomRange(value: { start: number; end: number } | null): void {
      state.range.previewZoomRange = value ? { ...value } : null;
    },

    setCommittedZoomRange(value: { start: number; end: number } | null): void {
      state.range.committedZoomRange = value ? { ...value } : null;
    },

    setTargetSelection(value: Record<string, unknown>): void {
      state.targets.selection = { ...(value || {}) };
    },

    setTargetSelectionRaw(value: Record<string, unknown>): void {
      state.targets.rawSelection = { ...(value || {}) };
    },

    setSeriesRows(rows: HistoryTargetRowState[]): void {
      state.targets.rows = Array.isArray(rows)
        ? rows.map((row) => ({ ...row }))
        : [];
    },

    setComparisonWindows(windows: HistoryComparisonWindowState[]): void {
      state.comparison.windows = Array.isArray(windows)
        ? windows.map((window) => ({ ...window }))
        : [];
    },

    setSelectedComparisonWindowId(value: string | null): void {
      state.comparison.selectedWindowId = value || null;
    },

    setHoveredComparisonWindowId(value: string | null): void {
      state.comparison.hoveredWindowId = value || null;
    },
  };
}
