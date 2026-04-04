import type { HassLike } from "@/lib/types";

export interface HistoryTargetRowState {
  entity_id: string;
  color: string;
  visible?: boolean;
  analysis?: Record<string, unknown>;
}

export interface HistoryRangeState {
  startTime: Date | null;
  endTime: Date | null;
  previewZoomRange: { start: number; end: number } | null;
  committedZoomRange: { start: number; end: number } | null;
}

export interface HistoryComparisonWindowState {
  id: string;
  name?: string;
  start_time: string;
  end_time: string;
  color?: string;
  [key: string]: unknown;
}

export interface HistoryComparisonState {
  windows: HistoryComparisonWindowState[];
  selectedWindowId: string | null;
  hoveredWindowId: string | null;
}

export interface HistoryDisplayState {
  sidebarCollapsed: boolean;
}

export interface HistoryTargetSelectionState {
  selection: Record<string, unknown>;
  rawSelection: Record<string, unknown>;
  rows: HistoryTargetRowState[];
}

export interface HistoryPageState {
  display: HistoryDisplayState;
  range: HistoryRangeState;
  comparison: HistoryComparisonState;
  targets: HistoryTargetSelectionState;
}

export interface HistoryFetchState {
  historyBoundsLoaded: boolean;
  historyBoundsLoading: boolean;
  preferencesLoaded: boolean;
  preferencesLoading: boolean;
  savedPageLoaded: boolean;
  hasSavedPage: boolean;
  timelineEventsLoading: boolean;
  timelineEventsKey: string;
}

export interface HistoryPersistenceState {
  savingPreferences: boolean;
  savePageBusy: boolean;
  exportBusy: boolean;
}

export interface HistoryNavigationReadState {
  entityFromUrl: string | null;
  deviceFromUrl: string | null;
  areaFromUrl: string | null;
  labelFromUrl: string | null;
  datapointsScopeFromUrl: string | null;
  startFromUrl: string | null;
  endFromUrl: string | null;
  zoomStartFromUrl: string | null;
  zoomEndFromUrl: string | null;
  seriesColorsFromUrl: Record<string, string>;
  dateWindowsFromUrl: Array<Record<string, unknown>>;
  hoursFromUrl: number;
  hasTargetInUrl: boolean;
  hasRangeInUrl: boolean;
  sessionState: Record<string, unknown> | null;
}

export interface HistoryPanelRefs {
  shellEl: HTMLElement | null;
  chartEl: HTMLElement | null;
  listEl: HTMLElement | null;
  historyTargetsEl: HTMLElement | null;
  rangeToolbarEl: HTMLElement | null;
}

export interface HistoryAppStateContext {
  state: HistoryPageState;
  setSidebarCollapsed(value: boolean): void;
  setRange(startTime: Date | null, endTime: Date | null): void;
  setPreviewZoomRange(value: { start: number; end: number } | null): void;
  setCommittedZoomRange(value: { start: number; end: number } | null): void;
  setTargetSelection(value: Record<string, unknown>): void;
  setTargetSelectionRaw(value: Record<string, unknown>): void;
  setSeriesRows(rows: HistoryTargetRowState[]): void;
  setComparisonWindows(windows: HistoryComparisonWindowState[]): void;
  setSelectedComparisonWindowId(value: string | null): void;
  setHoveredComparisonWindowId(value: string | null): void;
}

export interface HistoryPageContext {
  hass: HassLike | null;
  app: HistoryAppStateContext;
  fetch: HistoryFetchContext;
  persistence: HistoryPersistenceContext;
  orchestration: HistoryOrchestrationContext;
  navigation: HistoryNavigationContext;
}

export interface HistoryFetchContext {
  state: HistoryFetchState;
  ensureHistoryBounds(options: {
    onSuccess(payload: { start: string | null; end: string | null }): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  ensureUserPreferences<T>(options: {
    preferencesKey: string;
    fallbackValue: T;
    onSuccess(preferences: T): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  loadSavedPageIndicator<T>(options: {
    savedPageKey: string;
    fallbackValue: T;
    onSuccess(saved: T | null): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  resetTimelineEvents(): void;
  loadTimelineEvents(options: {
    startIso: string;
    endIso: string;
    datapointScope: string;
    entityIds: string[];
    onSuccess(events: unknown[], key: string): void;
    onError?(error: unknown): void;
  }): Promise<void>;
}

export interface HistoryPersistenceContext {
  state: HistoryPersistenceState;
  saveUserPreferences<T>(options: {
    preferencesKey: string;
    payload: T;
    onSuccess?(): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  downloadSpreadsheet(options: {
    entityIds: string[];
    startTime: Date;
    endTime: Date;
    datapointScope: string;
    onSuccess?(): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  savePageState<T>(options: {
    savedPageKey: string;
    state: T;
    onSuccess?(): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  restorePageState<T>(options: {
    savedPageKey: string;
    fallbackValue: T;
    onSuccess?(saved: T): void;
    onMissing?(): void;
    onError?(error: unknown): void;
  }): Promise<void>;
  clearSavedPageState(options: {
    savedPageKey: string;
    onSuccess?(): void;
    onError?(error: unknown): void;
  }): Promise<void>;
}

export interface HistoryOrchestrationContext {
  requestChartResizeRedraw(chartEl: HTMLElement | null): void;
  cancelChartResizeRedraw(): void;
  openTargetPicker(targetControl: HTMLElement | null): void;
  renderComparisonTabs(options: {
    chartEl: HTMLElement | null;
    comparisonWindows: Array<{
      id: string;
      label?: string;
      start_time: string;
      end_time: string;
    }>;
    selectedComparisonWindowId: string | null;
    hoveredComparisonWindowId: string | null;
    startTime: Date | null;
    endTime: Date | null;
    loadingComparisonWindowIds: string[];
    comparisonTabRailComp: HTMLElement | null;
    comparisonTabsHostEl: HTMLElement | null;
    formatComparisonLabel(startTime: Date, endTime: Date): string;
    onActivate(tabId: string): void;
    onHover(tabId: string): void;
    onLeave(tabId: string): void;
    onEdit(tabId: string): void;
    onDelete(tabId: string): void;
    onAdd(): void;
  }): {
    comparisonTabRailComp: HTMLElement | null;
    comparisonTabsHostEl: HTMLElement | null;
  };
  updateComparisonTabsOverflow(chartEl: HTMLElement | null): void;
  handleComparisonTabHover(options: {
    id: string | null | undefined;
    hoveredComparisonWindowId: string | null;
    setHoveredComparisonWindowId(value: string | null): void;
    updateComparisonRangePreview(): void;
    updateChartHoverIndicator(): void;
    renderContent(): void;
  }): void;
  handleComparisonTabLeave(options: {
    id: string | null | undefined;
    hoveredComparisonWindowId: string | null;
    setHoveredComparisonWindowId(value: string | null): void;
    updateComparisonRangePreview(): void;
    updateChartHoverIndicator(): void;
    renderContent(): void;
  }): void;
  handleComparisonTabActivate(options: {
    id: string | null | undefined;
    comparisonWindows: Array<{ id: string }>;
    selectedComparisonWindowId: string | null;
    setSelectedComparisonWindowId(value: string | null): void;
    setHoveredComparisonWindowId(value: string | null): void;
    clearDeltaAnalysisSelectionState(): void;
    updateComparisonRangePreview(): void;
    updateChartHoverIndicator(): void;
    renderComparisonTabs(): void;
    renderContent(): void;
    setAdjustComparisonAxisScale(value: boolean): void;
  }): void;
}

export interface HistoryNavigationContext {
  readStateFromLocation(): HistoryNavigationReadState;
  readSessionState(): Record<string, unknown> | null;
  saveSessionState(source: unknown): void;
  updateUrl(options: {
    entities: string[];
    datapointScope: string;
    startTime: Date | null;
    endTime: Date | null;
    hours: number;
    committedZoomRange: { start: number; end: number } | null;
    comparisonWindows: Array<Record<string, unknown>>;
    seriesRows: Array<{ entity_id: string; color: string }>;
    seriesColorQueryKey(entityId: string): string;
    push?: boolean;
  }): void;
}
