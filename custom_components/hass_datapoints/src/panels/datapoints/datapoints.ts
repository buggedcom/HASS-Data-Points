import {
  LitElement,
  html,
  nothing,
  render as renderInto,
  unsafeCSS,
  type PropertyValues,
} from "lit";
import { property, state as reactiveState } from "lit/decorators.js";
import type { RangeToolbar } from "@/panels/datapoints/components/range-toolbar/range-toolbar";
import { DOMAIN } from "@/constants";
import { disambiguateEntityNames, entityName } from "@/lib/ha/entity-name";
import { localized, msg, syncFrontendLocale } from "@/lib/i18n/localize";
import {
  confirmDestructiveAction,
  ensureHaComponents,
} from "@/lib/ha/ha-components";
import { PANEL_HISTORY_SAVED_PAGE_KEY } from "@/lib/data/preferences-api";
import {
  buildHistorySeriesRows,
  normalizeHistorySeriesAnalysis,
  normalizeHistorySeriesRows,
  slugifySeriesName,
} from "@/lib/domain/history-series";
import {
  normalizeEntityIds,
  normalizeTargetValue,
  panelConfigTarget,
  resolveEntityIdsFromTarget,
} from "@/lib/domain/target-selection";
import { parseDateValue } from "@/lib/domain/chart-zoom";
import {
  formatComparisonLabel,
  formatDateWindowInputValue,
  getRoundedDateWindowUnit,
  parseDateWindowInputValue,
  shiftDateWindowByUnit,
} from "@/lib/domain/date-window";
import {
  addSeriesRows,
  computeNextAnalysis,
  copyAnalysisToAll,
  mergeSavedSeriesRows,
  removeSeriesRow,
  toggleSeriesAnalysisExpanded,
  updateSeriesRowColor,
  updateSeriesRowVisibility,
} from "@/lib/domain/series-rows";
import {
  applyDateWindowShortcut,
  getActiveComparisonWindow,
  getComparisonPreviewOverlay,
  getPreloadComparisonWindows,
  getPreviewComparisonWindows,
} from "@/lib/domain/comparison-windows";
import {
  buildHistoryPagePreferencesPayload,
  buildHistoryPageSessionState,
  type HistoryPageSessionState,
  type HistoryPageSource,
  normalizeHistoryPagePreferences,
  PANEL_HISTORY_PREFERENCES_KEY,
} from "@/lib/history-page/history-session-state";
import {
  buildAiQueryBrief,
  type AiQueryBriefAnomalySnapshot,
  type AiQueryBriefMonitorContext,
} from "@/lib/history-page/ai-query-brief";
import type { AnomalyMonitor } from "@/lib/data/monitors-api";
import {
  type NormalizedHistoryDateWindow,
  makeDateWindowId,
  normalizeDateWindows,
} from "@/lib/history-page/history-url-state";
import {
  clampNumber,
  computeZoomLevelForSpan,
  deriveRangeBounds,
  endOfUnit,
  getEffectiveSnapUnit,
  getSnapSpanMs,
  extractRangeValue,
  HOUR_MS,
  MINUTE_MS,
  RANGE_AUTO_ZOOM_DEBOUNCE_MS,
  RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO,
  RANGE_SLIDER_MIN_SPAN_MS,
  RANGE_SLIDER_WINDOW_MS,
  RANGE_SNAP_OPTIONS,
  RANGE_ZOOM_CONFIGS,
  RANGE_ZOOM_OPTIONS,
  type RangeUnit,
  startOfUnit,
} from "@/lib/timeline/timeline-scale";
import {
  attachPopupDismissListeners,
  computePopupPosition,
  type DismissCleanup,
} from "@/lib/util/popup";
import { logger } from "@/lib/logger";
import type { HassLike } from "@/lib/types";

import "@/molecules/target-row/target-row";
import "@/molecules/target-row-list/target-row-list";
import "@/molecules/sidebar-options/sidebar-options";
import "@/molecules/collapsed-options-menu/collapsed-options-menu";
import "@/molecules/comparison-tab-rail/comparison-tab-rail";
import "@/molecules/date-window-dialog/date-window-dialog";
import "@/molecules/anomaly-monitor-wizard/anomaly-monitor-wizard";
import "@/molecules/anomaly-monitors-panel/anomaly-monitors-panel";
import "@/atoms/interactive/resizable-panes/resizable-panes";
import "@/molecules/history-chart/history-chart";
import "@/panels/datapoints/components/panel-shell/panel-shell";
import type { PanelShell } from "@/panels/datapoints/components/panel-shell/panel-shell";
import "@/panels/datapoints/components/ai-query-brief-dialog/ai-query-brief-dialog";
import "@/panels/datapoints/components/history-targets/history-targets";
import "@/panels/datapoints/components/range-toolbar/range-toolbar";
import { createHistoryPageContext } from "@/panels/datapoints/context/create-history-page-context";
import { HostResizeController } from "@/panels/datapoints/host-resize-controller";
import type {
  HistoryPageContext,
  HistoryTargetRowState,
} from "@/panels/datapoints/context/types";
import {
  PANEL_HISTORY_LOADING_STYLE,
  PANEL_HISTORY_STYLE,
} from "./datapoints.styles";

/** Module-level set of all currently-connected panel instances.
 *  Used by the orphan-recovery guard to avoid disrupting a live replacement. */
const _liveInstances = new Set<object>();

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

const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "only", label: "Overlaps only" },
];

type DetailEvent<T> = Event & { detail?: T };

type HistoryTargetsElement = HTMLElement & {
  rows: unknown[];
  states: RecordWithUnknownValues;
  hass: unknown;
  comparisonWindows: NormalizedHistoryDateWindow[];
  canShowDeltaAnalysis: boolean;
  sidebarCollapsed: boolean;
  labelMap: Map<string, string>;
  computingEntityIds: Set<string>;
  analysisProgress: number;
  computingMethodsByEntity: Map<string, Set<string>>;
};

type TargetPickerElement = HTMLElement & {
  hass?: unknown;
  value: RecordWithUnknownValues;
};

type TargetRowElement = HTMLElement & {
  hideDragHandle: boolean;
  color: Nullable<string>;
  visible: boolean;
  analysis: RecordWithUnknownValues;
  index: number;
  entityId: string;
  stateObj: unknown;
  hass: unknown;
  canShowDeltaAnalysis: boolean;
  comparisonWindows: NormalizedHistoryDateWindow[];
};

type DateWindowDraftRange = { start: Date; end: Date };

/** Open-time payload fed to the `<anomaly-monitor-wizard>`. */
type MonitorWizardPayload = {
  prefillEntityIds: string[];
  prefillAnalysis: unknown;
  editMonitor: unknown;
  suggestedEntityIds: string[];
  allSeriesEntityIds: string[];
};

type HistoryCardElement = HTMLElement & {
  hass?: unknown;
  setConfig(config: RecordWithUnknownValues): void;
  setExternalZoomRange?(range: Nullable<{ start: number; end: number }>): void;
  updateComplete?: Promise<unknown>;
  getComparisonTabsHost(): Nullable<HTMLElement>;
  getAiQueryBriefAnomalySnapshot?(): Nullable<AiQueryBriefAnomalySnapshot>;
  requestResizeRedraw?(): void;
  updateComparisonTabsOverflow?(): void;
  setAdjustComparisonAxisScale?(value: boolean): void;
};

type ListCardElement = HTMLElement & {
  hass?: unknown;
  setConfig(config: RecordWithUnknownValues): void;
};

type ResizablePanesElement = HTMLElement & {
  ratio: number;
  min: number;
  max: number;
  secondHidden: boolean;
};

/**
 * hass-datapoints-history-panel – Sidebar panel for annotated history exploration.
 */

// Shared timeline, domain, and history-page helpers now live in dedicated subsystem files.

@localized()
export class HassDatapointsHistoryPanel extends LitElement {
  static styles = [unsafeCSS(PANEL_HISTORY_STYLE)];

  // HA may reassign the same object after navigation or an in-place update.
  @property({ attribute: false, hasChanged: () => true })
  accessor hass: Nullable<HassLike> = null;

  @property({ attribute: false, hasChanged: () => true })
  accessor panel: Nullable<{ config?: RecordWithUnknownValues }> = null;

  @property({ attribute: false })
  accessor narrow = false;

  [key: string]: unknown;

  // Explicit declarations take precedence over the index signature so TypeScript
  // knows the concrete types for the properties accessed most frequently.
  declare _context: HistoryPageContext;

  declare _hass: Nullable<HassLike>;

  declare _mqTablet: MediaQueryList;

  declare _mqMobile: MediaQueryList;

  declare _onLayoutChange: () => void;

  declare _onChartHover: EventListener;

  declare _onChartZoom: EventListener;

  declare _onRecordsSearch: EventListener;

  declare _onToggleEventVisibility: EventListener;

  declare _onHoverEventRecord: EventListener;

  declare _onToggleSeriesVisibility: EventListener;

  declare _onComparisonLoading: EventListener;

  declare _onAnalysisComputing: EventListener;

  declare _onAnalysisMethodResult: EventListener;

  declare _onEventRecorded: () => void;

  declare _onPopState: () => void;

  declare _onLocationChanged: () => void;

  declare _onOverlayKeydown: Nullable<(ev: KeyboardEvent) => void>;

  // Additional typed property declarations
  @reactiveState()
  private accessor _rendered = false;

  @reactiveState()
  private accessor _shellBuilt = false;

  declare _narrow: boolean;

  declare _hours: number;

  declare _panel: Nullable<{ config?: RecordWithUnknownValues }>;

  @reactiveState()
  accessor _layoutMode: string = "desktop";

  declare _contentKey: string;

  declare _contentSplitRatio: number;

  @reactiveState()
  accessor _datapointScope: string = "linked";

  @reactiveState()
  accessor _showChartDatapointIcons: boolean = true;

  @reactiveState()
  accessor _showChartDatapointLines: boolean = true;

  @reactiveState()
  accessor _showChartTooltips: boolean = true;

  @reactiveState()
  accessor _showChartEmphasizedHoverGuides: boolean = false;

  @reactiveState()
  accessor _chartHoverSnapMode: string = "follow_series";

  @reactiveState()
  accessor _delinkChartYAxis: boolean = false;

  @reactiveState()
  accessor _splitChartView: boolean = false;

  @reactiveState()
  accessor _showCorrelatedAnomalies: boolean = false;

  @reactiveState()
  accessor _chartAnomalyOverlapMode: string = "all";

  @reactiveState()
  accessor _showDataGaps: boolean = true;

  @reactiveState()
  accessor _dataGapThreshold: string = "2h";

  @reactiveState()
  accessor _historyStartTime: Nullable<Date> = null;

  @reactiveState()
  accessor _historyEndTime: Nullable<Date> = null;

  @reactiveState()
  accessor _timelineEvents: unknown[] = [];

  declare _preferredSeriesColors: RecordWithStringValues;

  @reactiveState()
  accessor _loadingComparisonWindowIds: string[] = [];

  private _comparisonTabsRoot: Nullable<HTMLElement> = null;

  declare _pendingAnomalyComparisonWindowEntityId: Nullable<string>;

  @reactiveState()
  accessor _dateWindowDialogOpen: boolean = false;

  declare _editingDateWindowId: Nullable<string>;

  /** Controlled form values for the declarative `<date-window-dialog>`. */
  @reactiveState()
  accessor _dateWindowDialogName: string = "";

  @reactiveState()
  accessor _dateWindowDialogStartValue: string = "";

  @reactiveState()
  accessor _dateWindowDialogEndValue: string = "";

  declare _dateWindowDialogDraftRange: Nullable<DateWindowDraftRange>;

  declare _uiReadyPromise: Nullable<Promise<unknown>>;

  declare _uiReadyApplied: boolean;

  declare _chartEl: Nullable<HistoryCardElement>;

  declare _historyChartMol: Nullable<{
    _configKey: string;
    chartEl: HTMLElement;
  }>;

  declare _listEl: Nullable<ListCardElement>;

  declare _chartConfigKey: string;

  declare _listConfigKey: string;

  declare _shellEl: Nullable<PanelShell>;

  declare _contentHostEl: Nullable<HTMLElement>;

  declare _contentSplitterEl: Nullable<ResizablePanesElement>;

  declare _targetControl: Nullable<TargetPickerElement>;

  declare _targetRowsEl: Nullable<HistoryTargetsElement>;

  declare _historyTargetsComp: Nullable<HistoryTargetsElement>;

  declare _targetRowsRenderKey: string;

  @reactiveState()
  accessor _sidebarAccordionTargetsOpen: boolean = true;

  @reactiveState()
  accessor _sidebarAccordionDatapointsOpen: boolean = true;

  @reactiveState()
  accessor _sidebarAccordionAnalysisOpen: boolean = true;

  @reactiveState()
  accessor _sidebarAccordionChartOpen: boolean = true;

  declare _rangeToolbarComp: Nullable<RangeToolbar>;

  declare _rangeBounds: Nullable<{ min: number; max: number; config: unknown }>;

  /** Derived in willUpdate: disambiguated entity → display-name map for the rows. */
  declare _rowLabelMap: Map<string, string>;

  declare _autoZoomTimer: Nullable<number>;

  declare _rangeCommitTimer: Nullable<number>;

  declare _chartZoomStateCommitTimer: Nullable<number>;

  @reactiveState()
  accessor _resolvedAutoZoomLevel: Nullable<string> = null;

  declare _hoveredPeriodRange: Nullable<unknown>;

  @reactiveState()
  accessor _chartHoverTimeMs: Nullable<number> = null;

  @reactiveState()
  accessor _zoomLevel: string = "auto";

  @reactiveState()
  accessor _dateSnapping: string = "auto";

  declare _hasTargetInUrl: boolean;

  declare _hasRangeInUrl: boolean;

  declare _hasPageStateInUrl: boolean;

  declare _localPageStateDirty: boolean;

  declare _pendingPreferencesSaveTimer: Nullable<number>;

  /** Timer ID for the orphan-recovery guard set in disconnectedCallback. */
  declare _orphanRecoveryTimer: Nullable<number>;

  declare _recordsSearchQuery: string;

  declare _hiddenEventIds: string[];

  declare _hoveredEventIds: string[];

  declare _restoredFromSession: boolean;

  declare _onWindowPointerDown: EventListener;

  /** Observes the host size for measured layout side effects. */
  declare _resizeController: HostResizeController;

  declare _onCollapsedSidebarClick: EventListener;

  declare _haEventUnsubscribe: Nullable<() => void>;

  declare _computingEntityIds: Set<string>;

  declare _analysisProgress: number;

  declare _computingMethods: Map<string, Set<string>>;

  declare _draftStartTime: Nullable<Date>;

  declare _draftEndTime: Nullable<Date>;

  declare _entities: string[];

  declare _collapsedPopupEntityId: Nullable<string>;

  declare _collapsedPopupAnchorEl: Nullable<HTMLElement>;

  declare _collapsedPopupDismiss: Nullable<DismissCleanup>;

  declare _collapsedOptionsDismiss: Nullable<DismissCleanup>;

  @reactiveState()
  accessor _collapsedOptionsPopupOpen: boolean = false;

  declare _collapsedOptionsAnchorEl: Nullable<HTMLElement>;

  /** The last locale string returned by syncFrontendLocale — used to detect
   *  actual locale changes so we can avoid a full re-render on routine hass
   *  updates where the locale hasn't changed. */
  declare _lastSyncedLocale: string;

  /** Whether the anomaly monitors management panel is currently shown. */
  declare _showMonitorsPanel: boolean;

  /** Declarative open-state + payload for the `<anomaly-monitor-wizard>`. */
  @reactiveState()
  accessor _monitorWizardOpen: boolean = false;

  @reactiveState()
  accessor _monitorWizardPayload: MonitorWizardPayload = {
    prefillEntityIds: [],
    prefillAnalysis: null,
    editMonitor: null,
    suggestedEntityIds: [],
    allSeriesEntityIds: [],
  };

  /** Declarative open-state + payload for the `<ai-query-brief-dialog>`. */
  @reactiveState()
  accessor _aiQueryBriefDialogOpen: boolean = false;

  @reactiveState()
  accessor _aiQueryBriefHeading: string = "";

  @reactiveState()
  accessor _aiQueryBriefText: string = "";

  constructor() {
    super();
    this._context = createHistoryPageContext();
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
    this._mqTablet = window.matchMedia("(max-width: 900px)");
    this._mqMobile = window.matchMedia("(max-width: 720px)");
    this._onLayoutChange = () => this._updateLayoutMode();
    this._collapsedPopupEntityId = null;
    this._collapsedPopupAnchorEl = null;
    this._collapsedPopupOutsideClickHandler = null;
    this._collapsedPopupKeyHandler = null;
    this._lastSyncedLocale = "";
    this._historyBoundsLoaded = false;
    this._timelineEventsKey = "";
    this._preferredSeriesColors = {};
    this._preferencesLoaded = false;
    this._comparisonWindows = [];
    this._selectedComparisonWindowId = null;
    this._hoveredComparisonWindowId = null;
    this._pendingAnomalyComparisonWindowEntityId = null;
    this._editingDateWindowId = null;
    this._dateWindowDialogDraftRange = null;
    this._uiReadyPromise = null;
    this._uiReadyApplied = false;
    this._chartEl = null;
    this._historyChartMol = null;
    this._listEl = null;
    this._chartConfigKey = "";
    this._listConfigKey = "";
    this._shellEl = null;
    this._contentHostEl = null;
    this._contentSplitterEl = null;
    this._targetControl = null;
    this._targetRowsEl = null;
    this._targetRowsRenderKey = "";
    this._rangeBounds = null;
    this._rowLabelMap = new Map();
    this._autoZoomTimer = null;
    this._hoveredPeriodRange = null;
    this._chartZoomRange = null;
    this._chartZoomCommittedRange = null;
    this._chartZoomStateCommitTimer = null;
    this._hasTargetInUrl = false;
    this._hasRangeInUrl = false;
    this._hasPageStateInUrl = false;
    this._localPageStateDirty = false;
    this._pendingPreferencesSaveTimer = null;
    this._orphanRecoveryTimer = null;
    this._showMonitorsPanel = false;
    this._recordsSearchQuery = "";
    this._hiddenEventIds = [];
    this._hoveredEventIds = [];
    this._restoredFromSession = false;
    this._savedPageLoaded = false;
    this._hasSavedPage = false;
    this._onChartHover = (ev: Event) => this._handleChartHover(ev);
    this._onChartZoom = (ev: Event) => this._handleChartZoom(ev);
    this._onRecordsSearch = (ev: Event) => this._handleRecordsSearch(ev);
    this._onToggleEventVisibility = (ev: Event) =>
      this._handleToggleEventVisibility(ev);
    this._onHoverEventRecord = (ev: Event) => this._handleHoverEventRecord(ev);
    this._onToggleSeriesVisibility = (ev: Event) =>
      this._handleToggleSeriesVisibility(ev);
    this._onComparisonLoading = (ev: Event) =>
      this._handleComparisonLoading(ev);
    this._computingEntityIds = new Set();
    this._analysisProgress = 0;
    this._computingMethods = new Map(); // entityId → Set<methodName> of in-flight anomaly methods
    this._onAnalysisComputing = (ev: Event) =>
      this._handleAnalysisComputing(ev);
    this._onAnalysisMethodResult = (ev: Event) =>
      this._handleAnalysisMethodResult(ev);
    this._onWindowPointerDown = (_ev: Event) => this._handleWindowPointerDown();
    this._resizeController = new HostResizeController(this, () =>
      this._handleHostResize()
    );
    this._onCollapsedSidebarClick = (_ev: Event) =>
      this._handleCollapsedSidebarClick();
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

  _appState() {
    return this._context.app;
  }

  get _targetSelection() {
    return this._appState().state.targets.selection;
  }

  set _targetSelection(value) {
    this._appState().setTargetSelection(value || {});
  }

  get _targetSelectionRaw() {
    return this._appState().state.targets.rawSelection;
  }

  set _targetSelectionRaw(value) {
    this._appState().setTargetSelectionRaw(value || {});
  }

  get _seriesRows() {
    return this._appState().state.targets.rows;
  }

  set _seriesRows(value) {
    this._appState().setSeriesRows(Array.isArray(value) ? value : []);
  }

  get _startTime() {
    return this._appState().state.range.startTime;
  }

  @reactiveState()
  set _startTime(value) {
    this._appState().setRange(value || null, this._endTime || null);
  }

  get _endTime() {
    return this._appState().state.range.endTime;
  }

  @reactiveState()
  set _endTime(value) {
    this._appState().setRange(this._startTime || null, value || null);
  }

  get _sidebarCollapsed() {
    return this._appState().state.display.sidebarCollapsed;
  }

  @reactiveState()
  set _sidebarCollapsed(value) {
    this._appState().setSidebarCollapsed(!!value);
  }

  get _comparisonWindows() {
    return this._appState().state.comparison.windows;
  }

  @reactiveState()
  set _comparisonWindows(value) {
    this._appState().setComparisonWindows(Array.isArray(value) ? value : []);
  }

  get _selectedComparisonWindowId() {
    return this._appState().state.comparison.selectedWindowId;
  }

  @reactiveState()
  set _selectedComparisonWindowId(value) {
    this._appState().setSelectedComparisonWindowId(value || null);
  }

  get _hoveredComparisonWindowId() {
    return this._appState().state.comparison.hoveredWindowId;
  }

  @reactiveState()
  set _hoveredComparisonWindowId(value) {
    this._appState().setHoveredComparisonWindowId(value || null);
  }

  get _chartZoomRange() {
    return this._appState().state.range.previewZoomRange;
  }

  @reactiveState()
  set _chartZoomRange(value) {
    this._appState().setPreviewZoomRange(value || null);
  }

  get _chartZoomCommittedRange() {
    return this._appState().state.range.committedZoomRange;
  }

  @reactiveState()
  set _chartZoomCommittedRange(value) {
    this._appState().setCommittedZoomRange(value || null);
  }

  get _historyBoundsLoaded() {
    return this._context.fetch.state.historyBoundsLoaded;
  }

  set _historyBoundsLoaded(value) {
    this._context.fetch.state.historyBoundsLoaded = !!value;
  }

  get _preferencesLoaded() {
    return this._context.fetch.state.preferencesLoaded;
  }

  set _preferencesLoaded(value) {
    this._context.fetch.state.preferencesLoaded = !!value;
  }

  get _savedPageLoaded() {
    return this._context.fetch.state.savedPageLoaded;
  }

  set _savedPageLoaded(value) {
    this._context.fetch.state.savedPageLoaded = !!value;
  }

  get _hasSavedPage() {
    return this._context.fetch.state.hasSavedPage;
  }

  @reactiveState()
  set _hasSavedPage(value) {
    this._context.fetch.state.hasSavedPage = !!value;
  }

  get _timelineEventsKey() {
    return this._context.fetch.state.timelineEventsKey;
  }

  set _timelineEventsKey(value) {
    this._context.fetch.state.timelineEventsKey = String(value || "");
  }

  get _savePageBusy() {
    return this._context.persistence.state.savePageBusy;
  }

  set _savePageBusy(value) {
    this._context.persistence.state.savePageBusy = !!value;
  }

  get _exportBusy() {
    return this._context.persistence.state.exportBusy;
  }

  set _exportBusy(value) {
    this._context.persistence.state.exportBusy = !!value;
  }

  _applyHass(hass: HassLike) {
    this._hass = hass;
    this._context.hass = hass;
    syncFrontendLocale(this._hass).then((locale) => {
      const localeChanged = locale !== this._lastSyncedLocale;
      this._lastSyncedLocale = locale;
      if (!this.isConnected) {
        return;
      }
      if (!this._shellBuilt && this._rendered) {
        this._buildLoadingShell();
        return;
      }
      if (!this._rendered) {
        return;
      }
      if (localeChanged) {
        // Locale changed (e.g. user switched language) — full re-render needed
        // to pick up newly translated strings.
        this._renderContent();
      } else {
        // Routine hass update — push hass directly to already-mounted
        // sub-components without a full re-render.  _renderContent() is
        // called explicitly from every code path that actually changes
        // entity / config state.
        if (this._chartEl) {
          this._chartEl.hass = this._hass;
        }
        if (this._listEl) {
          this._listEl.hass = this._hass;
        }
        if (this._targetControl && this._hass) {
          this._targetControl.hass = this._hass;
        }
        // The sidebar `history-targets` (and its row list) receive hass/states/
        // labelMap declaratively from render(); the hass property re-renders the
        // panel on every tick (hasChanged: () => true), so no imperative push here.
        // Inline HA state-icon elements rendered directly into the shadow DOM.
        this.shadowRoot
          ?.querySelectorAll(
            "[data-series-icon-entity-id], [data-series-collapsed-icon-entity-id]"
          )
          .forEach((iconEl) => {
            const icon = iconEl as HTMLElement & {
              dataset: DOMStringMap;
              stateObj?: unknown;
              hass?: unknown;
            };
            const entityId =
              icon.dataset.seriesIconEntityId ||
              icon.dataset.seriesCollapsedIconEntityId;
            if (!entityId) return;
            icon.stateObj = this._hass?.states?.[entityId];
            icon.hass = this._hass;
          });
      }
    });
    if (!this._haEventUnsubscribe && this._hass?.connection) {
      this._hass.connection
        .subscribeEvents(
          () => this._handleEventRecorded(),
          `${DOMAIN}_event_recorded`
        )
        .then((unsub: () => void) => {
          this._haEventUnsubscribe = unsub;
        })
        .catch(() => {});
    }
    if (!this._rendered) {
      logger.warn(
        "[dp-lifecycle] set hass: first hass — transitioning to rendered",
        {
          isConnected: this.isConnected,
          hadUiReadyPromise: !!this._uiReadyPromise,
          shellBuilt: this._shellBuilt,
        }
      );
      this._rendered = true;
      this._initFromContext();
      if (this.isConnected) {
        this._buildLoadingShell();
        // _ensureUiComponentsReady() may have already resolved (all HA components
        // were already registered) before hass arrived and set _rendered = true.
        // In that case its callback bailed out early and the shell was never built.
        // Reset the promise so the call below creates a fresh one and runs the
        // shell-build logic now that _rendered is true.
        logger.warn(
          "[dp-lifecycle] set hass: resetting uiReadyPromise and re-running ensureUiComponentsReady"
        );
        this._uiReadyPromise = null;
        this._ensureUiComponentsReady();
      } else {
        logger.warn(
          "[dp-lifecycle] set hass: not connected — skipping shell build"
        );
      }
    }
    if (
      !this._seriesRows.length &&
      Object.keys(this._targetSelection || {}).length
    ) {
      this._seriesRows = buildHistorySeriesRows(
        resolveEntityIdsFromTarget(this._hass, this._targetSelection)
      );
    }
    this._syncSeriesState();
    if (!this._shellBuilt) {
      return;
    }
    // Re-attempt the one-time data fetches on every hass update — the fetch
    // context guards each with a loaded/loading flag so they only fire once.
    // This handles the case where hass arrived after the shell was first built
    // and the initial bootstrap ran without a valid connection.
    this._ensureHistoryBounds();
    this._ensureUserPreferences();
    this._loadSavedPageIndicator();
    // _bootstrapAfterShellBuilt() is intentionally NOT called here — it was
    // previously called on every hass update which triggered _renderContent()
    // and a full target-picker/target-row refresh multiple times per second.
    // Those are now handled by the microtask above (hass push) and by explicit
    // calls from state-change handlers.
  }

  _applyPanel(panel: Nullable<{ config?: RecordWithUnknownValues }>) {
    this._panel = panel;
    this._initFromContext();
    if (this._rendered) {
      this._syncControls();
      this._renderContent();
    }
  }

  protected willUpdate(changed: PropertyValues<this>) {
    // Resolve configuration targets against the latest HA registry in this batch.
    if (changed.has("hass") && this.hass) {
      this._applyHass(this.hass);
    }
    if (changed.has("panel")) {
      this._applyPanel(this.panel);
    }
    if (changed.has("narrow")) {
      this._narrow = this.narrow;
    }
    if (this._rendered) {
      this._rangeBounds = this._deriveRangeBounds();
      this._ensureTimelineEvents();
      this._rowLabelMap = this._computeRowLabelMap();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Cancel any pending orphan-recovery dispatch from a previous disconnect.
    if (this._orphanRecoveryTimer) {
      window.clearTimeout(this._orphanRecoveryTimer);
      this._orphanRecoveryTimer = null;
    }
    _liveInstances.add(this);
    logger.warn("[dp-lifecycle] connectedCallback", {
      rendered: this._rendered,
      shellBuilt: this._shellBuilt,
      uiReadyPromise: !!this._uiReadyPromise,
      uiReadyApplied: this._uiReadyApplied,
      entityCount: this._entities?.length ?? 0,
      contentKey: this._contentKey,
      hasContentHostEl: !!this._contentHostEl,
      hasShellEl: !!this._shellEl,
    });
    this._mqTablet.addEventListener("change", this._onLayoutChange);
    this._mqMobile.addEventListener("change", this._onLayoutChange);
    this._updateLayoutMode();
    this._onOverlayKeydown = (ev: KeyboardEvent) => {
      if (
        ev.key === "Escape" &&
        !this._sidebarCollapsed &&
        this._layoutMode !== "desktop"
      ) {
        this._toggleSidebarCollapsed();
      }
    };
    window.addEventListener("keydown", this._onOverlayKeydown);
    window.addEventListener("popstate", this._onPopState);
    window.addEventListener("location-changed", this._onLocationChanged);
    window.addEventListener("pointerdown", this._onWindowPointerDown, true);
    window.addEventListener(
      "hass-datapoints-event-recorded",
      this._onEventRecorded
    );
    this.addEventListener("hass-datapoints-chart-hover", this._onChartHover);
    this.addEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
    this.addEventListener(
      "hass-datapoints-records-search",
      this._onRecordsSearch
    );
    this.addEventListener(
      "hass-datapoints-toggle-event-visibility",
      this._onToggleEventVisibility
    );
    this.addEventListener(
      "hass-datapoints-hover-event-record",
      this._onHoverEventRecord
    );
    this.addEventListener(
      "hass-datapoints-toggle-series-visibility",
      this._onToggleSeriesVisibility
    );
    this.addEventListener(
      "hass-datapoints-comparison-loading",
      this._onComparisonLoading
    );
    this.addEventListener(
      "hass-datapoints-analysis-computing",
      this._onAnalysisComputing
    );
    this.addEventListener(
      "hass-datapoints-analysis-method-result",
      this._onAnalysisMethodResult
    );
    this.addEventListener("dp-anomaly-save-monitor", (ev: Event) => {
      const detail = (ev as CustomEvent).detail ?? {};
      const entityId: string = detail.entityId ?? "";
      const analysis = detail.analysis ?? null;
      this._openMonitorWizardFromChartAnalysis(entityId, analysis);
    });
    if (this._rendered && !this._shellBuilt) {
      logger.warn(
        "[dp-lifecycle] connectedCallback: rendered but no shell — building loading shell"
      );
      this._buildLoadingShell();
    }
    this._ensureUiComponentsReady();
    if (this._rendered && this._shellBuilt) {
      logger.warn(
        "[dp-lifecycle] connectedCallback: shell already built — scheduling reconnect RAF render"
      );
      window.requestAnimationFrame(() => {
        if (!this.isConnected) {
          logger.warn(
            "[dp-lifecycle] connectedCallback RAF: aborted (not connected)"
          );
          return;
        }
        logger.warn(
          "[dp-lifecycle] connectedCallback RAF: calling syncControls + renderContent"
        );
        this._syncControls();
        this._renderContent();
        if (this._restoredFromSession) {
          this._restoredFromSession = false;
          this._updateUrl({ push: false });
        }
      });
    } else {
      logger.warn("[dp-lifecycle] connectedCallback: no RAF scheduled", {
        rendered: this._rendered,
        shellBuilt: this._shellBuilt,
      });
    }
    // Keep the loading indicator visible immediately when HA attaches the panel.
    this.performUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    _liveInstances.delete(this);
    this._mqTablet.removeEventListener("change", this._onLayoutChange);
    this._mqMobile.removeEventListener("change", this._onLayoutChange);
    if (this._onOverlayKeydown) {
      window.removeEventListener("keydown", this._onOverlayKeydown);
    }
    window.removeEventListener("popstate", this._onPopState);
    window.removeEventListener("location-changed", this._onLocationChanged);
    window.removeEventListener("pointerdown", this._onWindowPointerDown, true);
    window.removeEventListener(
      "hass-datapoints-event-recorded",
      this._onEventRecorded
    );
    if (this._haEventUnsubscribe) {
      this._haEventUnsubscribe();
      this._haEventUnsubscribe = null;
    }
    this.removeEventListener("hass-datapoints-chart-hover", this._onChartHover);
    this.removeEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
    this.removeEventListener(
      "hass-datapoints-records-search",
      this._onRecordsSearch
    );
    this.removeEventListener(
      "hass-datapoints-toggle-event-visibility",
      this._onToggleEventVisibility
    );
    this.removeEventListener(
      "hass-datapoints-hover-event-record",
      this._onHoverEventRecord
    );
    this.removeEventListener(
      "hass-datapoints-toggle-series-visibility",
      this._onToggleSeriesVisibility
    );
    this.removeEventListener(
      "hass-datapoints-comparison-loading",
      this._onComparisonLoading
    );
    this.removeEventListener(
      "hass-datapoints-analysis-computing",
      this._onAnalysisComputing
    );
    this.removeEventListener(
      "hass-datapoints-analysis-method-result",
      this._onAnalysisMethodResult
    );
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    if (this._autoZoomTimer) {
      window.clearTimeout(this._autoZoomTimer);
      this._autoZoomTimer = null;
    }
    if (this._pendingPreferencesSaveTimer) {
      window.clearTimeout(this._pendingPreferencesSaveTimer);
      this._pendingPreferencesSaveTimer = null;
    }
    if (this._chartZoomStateCommitTimer) {
      window.clearTimeout(this._chartZoomStateCommitTimer);
      this._chartZoomStateCommitTimer = null;
    }
    if (this._orphanRecoveryTimer) {
      window.clearTimeout(this._orphanRecoveryTimer);
      this._orphanRecoveryTimer = null;
    }
    this._hideCollapsedTargetPopup();
    this._hideCollapsedOptionsPopup();
    logger.warn("[dp-lifecycle] disconnectedCallback", {
      rendered: this._rendered,
      shellBuilt: this._shellBuilt,
      uiReadyApplied: this._uiReadyApplied,
      entityCount: this._entities?.length ?? 0,
    });
    this._uiReadyPromise = null;
    this._uiReadyApplied = false;
    this._context.orchestration.cancelChartResizeRedraw();

    // Orphan-recovery guard: HA's WebSocket reconnect flow can remove this
    // element without ever re-adding it (connectedCallback never fires again),
    // leaving the panel area blank.  If we are still detached after a grace
    // period, fire a synthetic location-changed so HA's router re-evaluates
    // the current URL and re-mounts the panel.
    this._orphanRecoveryTimer = window.setTimeout(() => {
      this._orphanRecoveryTimer = null;
      if (!this.isConnected) {
        // Don't fire if another instance is already live — would disrupt it.
        const hasLiveInstance = [..._liveInstances].some((i) => i !== this);
        if (hasLiveInstance) {
          logger.warn(
            "[dp-lifecycle] orphan recovery: another instance already live — skipping location-changed"
          );
          return;
        }
        logger.warn(
          "[dp-lifecycle] orphan recovery: still detached after grace period — dispatching location-changed"
        );
        window.dispatchEvent(
          new CustomEvent("location-changed", { bubbles: true })
        );
      }
    }, 3000);
  }

  _initFromContext() {
    const {
      entityFromUrl,
      deviceFromUrl,
      areaFromUrl,
      labelFromUrl,
      datapointsScopeFromUrl,
      startFromUrl,
      endFromUrl,
      zoomStartFromUrl,
      zoomEndFromUrl,
      seriesColorsFromUrl,
      dateWindowsFromUrl,
      hoursFromUrl,
      hasTargetInUrl,
      hasRangeInUrl,
      pageStateFromUrl,
      sessionState,
    } = this._context.navigation.readStateFromLocation();
    type PersistedState = Partial<HistoryPageSessionState> & {
      [key: string]: unknown;
    };
    const persistedState: PersistedState | null = (
      pageStateFromUrl && typeof pageStateFromUrl === "object"
        ? { ...(sessionState || {}), ...pageStateFromUrl }
        : sessionState
    ) as PersistedState | null;
    const panelCfg = this._panel?.config ?? ({} as RecordWithUnknownValues);
    this._hasTargetInUrl = hasTargetInUrl;
    this._hasRangeInUrl = hasRangeInUrl;
    this._hasPageStateInUrl = !!pageStateFromUrl;
    this._localPageStateDirty = false;
    this._restoredFromSession =
      !hasTargetInUrl && !hasRangeInUrl && !!persistedState;
    this._sidebarCollapsed = !!persistedState?.sidebar_collapsed;
    this._sidebarAccordionTargetsOpen =
      persistedState?.sidebar_accordion_targets_open !== false;
    this._sidebarAccordionDatapointsOpen =
      persistedState?.sidebar_accordion_datapoints_open !== false;
    this._sidebarAccordionAnalysisOpen =
      persistedState?.sidebar_accordion_analysis_open !== false;
    this._sidebarAccordionChartOpen =
      persistedState?.sidebar_accordion_chart_open !== false;
    if (persistedState && Number.isFinite(persistedState.content_split_ratio)) {
      this._contentSplitRatio = clampNumber(
        persistedState.content_split_ratio as number,
        0.25,
        0.75
      );
    }
    let resolvedDatapointScope;
    if (datapointsScopeFromUrl === "all") {
      resolvedDatapointScope = "all";
    } else if (datapointsScopeFromUrl === "hidden") {
      resolvedDatapointScope = "hidden";
    } else if (
      !datapointsScopeFromUrl &&
      persistedState?.datapoint_scope === "all"
    ) {
      resolvedDatapointScope = "all";
    } else if (
      !datapointsScopeFromUrl &&
      persistedState?.datapoint_scope === "hidden"
    ) {
      resolvedDatapointScope = "hidden";
    } else {
      resolvedDatapointScope = "linked";
    }
    this._datapointScope = resolvedDatapointScope;
    this._showChartDatapointIcons =
      persistedState?.show_chart_datapoint_icons !== false;
    this._showChartDatapointLines =
      persistedState?.show_chart_datapoint_lines !== false;
    this._showChartTooltips = persistedState?.show_chart_tooltips !== false;
    this._showChartEmphasizedHoverGuides =
      persistedState?.show_chart_emphasized_hover_guides === true;
    this._chartHoverSnapMode =
      persistedState?.chart_hover_snap_mode === "snap_to_data_points"
        ? "snap_to_data_points"
        : "follow_series";
    this._delinkChartYAxis = persistedState?.delink_chart_y_axis === true;
    this._splitChartView = persistedState?.split_chart_view === true;
    this._showCorrelatedAnomalies =
      persistedState?.show_chart_correlated_anomalies === true;
    this._chartAnomalyOverlapMode = ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS.some(
      (o) => o.value === persistedState?.chart_anomaly_overlap_mode
    )
      ? (persistedState!.chart_anomaly_overlap_mode as string)
      : "all";
    this._showDataGaps = persistedState?.show_data_gaps !== false;
    this._dataGapThreshold = DATA_GAP_THRESHOLD_OPTIONS.some(
      (option) => option.value === persistedState?.data_gap_threshold
    )
      ? (persistedState!.data_gap_threshold as string)
      : "2h";
    this._comparisonWindows = dateWindowsFromUrl.length
      ? dateWindowsFromUrl
      : normalizeDateWindows(
          persistedState?.date_windows as
            | NormalizedHistoryDateWindow[]
            | undefined
        );
    const targetFromUrl = normalizeTargetValue({
      entity_id: entityFromUrl ? entityFromUrl.split(",") : [],
      device_id: deviceFromUrl ? deviceFromUrl.split(",") : [],
      area_id: areaFromUrl ? areaFromUrl.split(",") : [],
      label_id: labelFromUrl ? labelFromUrl.split(",") : [],
    });
    const panelTarget = panelConfigTarget(panelCfg);
    let nextTargetSelection;
    if (Object.keys(targetFromUrl).length) {
      nextTargetSelection = targetFromUrl;
    } else if (!hasTargetInUrl && persistedState?.entities?.length) {
      nextTargetSelection = normalizeTargetValue(
        persistedState.target_selection_raw ||
          persistedState.target_selection || {
            entity_id: persistedState.entities,
          }
      );
    } else {
      nextTargetSelection = panelTarget;
    }
    this._targetSelection = nextTargetSelection;
    this._targetSelectionRaw =
      !hasTargetInUrl && persistedState?.target_selection_raw
        ? persistedState.target_selection_raw
        : nextTargetSelection;
    this._seriesRows =
      !hasTargetInUrl && Array.isArray(persistedState?.series_rows)
        ? normalizeHistorySeriesRows(persistedState.series_rows)
        : buildHistorySeriesRows(
            resolveEntityIdsFromTarget(this._hass, this._targetSelection)
          );
    if (Array.isArray(persistedState?.series_rows)) {
      this._seriesRows = this._mergeSavedSeriesRows(
        this._seriesRows,
        persistedState.series_rows
      );
    }
    this._seriesRows = this._applyPreferredSeriesColors(
      this._seriesRows,
      seriesColorsFromUrl
    );
    this._syncSeriesState();

    const start =
      parseDateValue(startFromUrl) ||
      (!hasRangeInUrl ? parseDateValue(persistedState?.start_time) : null) ||
      parseDateValue(panelCfg.start_time as string | undefined);
    const end =
      parseDateValue(endFromUrl) ||
      (!hasRangeInUrl ? parseDateValue(persistedState?.end_time) : null) ||
      parseDateValue(panelCfg.end_time as string | undefined);
    const zoomStart =
      parseDateValue(zoomStartFromUrl) ||
      (!zoomStartFromUrl && !zoomEndFromUrl
        ? parseDateValue(persistedState?.zoom_start_time)
        : null);
    const zoomEnd =
      parseDateValue(zoomEndFromUrl) ||
      (!zoomStartFromUrl && !zoomEndFromUrl
        ? parseDateValue(persistedState?.zoom_end_time)
        : null);
    this._chartZoomRange = null;
    this._chartZoomCommittedRange =
      zoomStart && zoomEnd && zoomStart < zoomEnd
        ? { start: zoomStart.getTime(), end: zoomEnd.getTime() }
        : null;
    if (start && end && start < end) {
      this._startTime = start;
      this._endTime = end;
      this._hours = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 3600000)
      );
      return;
    }

    if (Number.isFinite(hoursFromUrl) && hoursFromUrl > 0) {
      this._hours = hoursFromUrl;
    } else if (
      !hasRangeInUrl &&
      persistedState &&
      Number.isFinite(persistedState.hours) &&
      (persistedState.hours as number) > 0
    ) {
      this._hours = persistedState.hours as number;
    } else if (panelCfg.hours_to_show) {
      this._hours = panelCfg.hours_to_show as number;
    }
    const now = new Date();
    this._startTime = startOfUnit(now, "week");
    this._endTime = endOfUnit(now, "week");
    this._hours = Math.max(
      1,
      Math.round(
        (this._endTime.getTime() - this._startTime.getTime()) / 3600000
      )
    );
  }

  _saveSessionState() {
    this._localPageStateDirty = true;
    this._context.navigation.saveSessionState(this);
    this._scheduleUserPreferencesSave();
  }

  _scheduleUserPreferencesSave() {
    if (this._pendingPreferencesSaveTimer) {
      window.clearTimeout(this._pendingPreferencesSaveTimer);
    }
    this._pendingPreferencesSaveTimer = window.setTimeout(() => {
      this._pendingPreferencesSaveTimer = null;
      this._saveUserPreferences();
    }, 160);
  }

  _applyPreferencePageState(state: Nullable<RecordWithUnknownValues>) {
    if (!state || typeof state !== "object") {
      return;
    }
    // Cast to typed partial for safe property access
    const s = state as Partial<HistoryPageSessionState> & {
      [key: string]: unknown;
    };
    if (!this._hasPageStateInUrl) {
      this._sidebarCollapsed = !!s.sidebar_collapsed;
      this._sidebarAccordionTargetsOpen =
        s.sidebar_accordion_targets_open !== false;
      this._sidebarAccordionDatapointsOpen =
        s.sidebar_accordion_datapoints_open !== false;
      this._sidebarAccordionAnalysisOpen =
        s.sidebar_accordion_analysis_open !== false;
      this._sidebarAccordionChartOpen =
        s.sidebar_accordion_chart_open !== false;
      if (Number.isFinite(s.content_split_ratio)) {
        this._contentSplitRatio = clampNumber(
          s.content_split_ratio as number,
          0.25,
          0.75
        );
      }
      this._showChartDatapointIcons = s.show_chart_datapoint_icons !== false;
      this._showChartDatapointLines = s.show_chart_datapoint_lines !== false;
      this._showChartTooltips = s.show_chart_tooltips !== false;
      this._showChartEmphasizedHoverGuides =
        s.show_chart_emphasized_hover_guides === true;
      this._chartHoverSnapMode =
        s.chart_hover_snap_mode === "snap_to_data_points"
          ? "snap_to_data_points"
          : "follow_series";
      this._delinkChartYAxis = s.delink_chart_y_axis === true;
      this._splitChartView = s.split_chart_view === true;
      this._showCorrelatedAnomalies =
        s.show_chart_correlated_anomalies === true;
      this._chartAnomalyOverlapMode =
        ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS.some(
          (option) => option.value === s.chart_anomaly_overlap_mode
        )
          ? (s.chart_anomaly_overlap_mode as string)
          : "all";
      this._showDataGaps = s.show_data_gaps !== false;
      this._dataGapThreshold = DATA_GAP_THRESHOLD_OPTIONS.some(
        (option) => option.value === s.data_gap_threshold
      )
        ? (s.data_gap_threshold as string)
        : this._dataGapThreshold;
      this._datapointScope =
        s.datapoint_scope === "all" || s.datapoint_scope === "hidden"
          ? s.datapoint_scope
          : "linked";
    }

    if (!this._hasTargetInUrl) {
      if (s.target_selection) {
        this._targetSelection = normalizeTargetValue(
          s.target_selection as RecordWithUnknownValues
        );
      }
      if (s.target_selection_raw) {
        this._targetSelectionRaw =
          s.target_selection_raw as RecordWithUnknownValues;
      }
    }

    if (Array.isArray(s.series_rows)) {
      const nextRows = !this._hasTargetInUrl
        ? normalizeHistorySeriesRows(s.series_rows)
        : this._mergeSavedSeriesRows(this._seriesRows, s.series_rows);
      this._seriesRows = this._applyPreferredSeriesColors(nextRows);
      this._syncSeriesState();
    }

    if (!this._hasRangeInUrl) {
      const start = parseDateValue(s.start_time);
      const end = parseDateValue(s.end_time);
      if (start && end && start < end) {
        this._startTime = start;
        this._endTime = end;
      }
      const zoomStart = parseDateValue(s.zoom_start_time);
      const zoomEnd = parseDateValue(s.zoom_end_time);
      this._chartZoomCommittedRange =
        zoomStart && zoomEnd && zoomStart < zoomEnd
          ? { start: zoomStart.getTime(), end: zoomEnd.getTime() }
          : this._chartZoomCommittedRange;
      if (s.hours && Number.isFinite(s.hours) && (s.hours as number) > 0) {
        this._hours = s.hours as number;
      }
      if (Array.isArray(s.date_windows) && !this._hasPageStateInUrl) {
        this._comparisonWindows = normalizeDateWindows(
          s.date_windows as NormalizedHistoryDateWindow[]
        );
      }
    }
  }

  _buildLoadingShell() {
    logger.warn("[dp-lifecycle] _buildLoadingShell called", {
      rendered: this._rendered,
      shellBuilt: this._shellBuilt,
      isConnected: this.isConnected,
    });
    this._shellBuilt = false;
    this.requestUpdate();
  }

  _buildShell() {
    this._shellBuilt = true;
  }

  protected render() {
    if (!this._rendered) {
      return nothing;
    }
    if (!this._shellBuilt) {
      return html`
        <style>
          ${PANEL_HISTORY_LOADING_STYLE}
        </style>
        <div class="history-panel-loading">
          <div
            class="history-panel-loading-card"
            role="status"
            aria-live="polite"
          >
            <div class="history-panel-loading-spinner" aria-hidden="true"></div>
            <div class="history-panel-loading-text">
              ${msg("Loading Datapoints…")}
            </div>
          </div>
        </div>
      `;
    }
    return html`
      <panel-shell
        .hass=${this._hass ?? null}
        .narrow=${this._narrow}
        .sidebarCollapsed=${this._sidebarCollapsed}
        .hasSavedState=${this._hasSavedPage}
        .layoutMode=${this._layoutMode}
        .collapsedOptionsOpen=${this._collapsedOptionsPopupOpen}
        @dp-shell-menu-download=${() => this._downloadSpreadsheet()}
        @dp-shell-menu-ai-brief=${() => {
          this._openAiQueryBriefDialog().catch((error: unknown) => {
            logger.warn(
              "[hass-datapoints] failed to open AI query brief:",
              error
            );
          });
        }}
        @dp-shell-menu-save=${() => this._savePageState()}
        @dp-shell-menu-restore=${() => this._restorePageState()}
        @dp-shell-menu-clear=${() => this._clearSavedPageState()}
        @dp-shell-menu-monitors=${() => {
          this._showMonitorsPanel = true;
          this._renderContent();
        }}
        @dp-shell-sidebar-toggle=${() => this._toggleSidebarCollapsed()}
        @dp-shell-scrim-click=${() => {
          if (!this._sidebarCollapsed) {
            this._toggleSidebarCollapsed();
          }
        }}
        @click=${this._onCollapsedSidebarClick}
      >
        <range-toolbar
          slot="controls"
          .hass=${this.hass}
          .startTime=${this._startTime ? new Date(this._startTime) : null}
          .endTime=${this._endTime ? new Date(this._endTime) : null}
          .rangeBounds=${this._rangeBounds}
          .zoomLevel=${this._getEffectiveZoomLevel()}
          .dateSnapping=${this._dateSnapping}
          .sidebarCollapsed=${this._sidebarCollapsed}
          .isLiveEdge=${this._isOnLiveEdge()}
          .timelineEvents=${this._timelineEvents}
          .comparisonPreview=${this._getComparisonRangePreview()}
          .zoomRange=${this._getChartZoomHighlightRange()}
          .zoomWindowRange=${this._getZoomWindowHighlightRange()}
          .chartHoverTimeMs=${this._rangeBounds ? this._chartHoverTimeMs : null}
          .chartHoverWindowTimeMs=${this._getChartHoverWindowTimeMs()}
          @dp-range-commit=${(
            ev: DetailEvent<{ start?: Date; end?: Date; push?: boolean }>
          ) => {
            this._applyCommittedRange(ev.detail?.start, ev.detail?.end, {
              push: ev.detail?.push ?? false,
            });
          }}
          @dp-range-draft=${(ev: DetailEvent<{ start?: Date; end?: Date }>) => {
            this._scheduleAutoZoomUpdate(ev.detail?.start, ev.detail?.end);
          }}
          @dp-toolbar-sidebar-toggle=${() => this._toggleSidebarCollapsed()}
          @dp-zoom-level-change=${(ev: DetailEvent<{ value?: string }>) => {
            const { value } = ev.detail || {};
            if (value && value !== this._zoomLevel) {
              this._zoomLevel = value;
              this._clearAutoZoomTimer();
              this._resolvedAutoZoomLevel =
                value === "auto" ? null : this._resolvedAutoZoomLevel;
              this._saveSessionState();
              this._updateUrl({ push: false });
              this._saveUserPreferences();
            }
          }}
          @dp-snap-change=${(ev: DetailEvent<{ value?: string }>) => {
            const { value } = ev.detail || {};
            if (value && value !== this._dateSnapping) {
              this._dateSnapping = value;
              this._saveSessionState();
              this._updateUrl({ push: false });
              this._saveUserPreferences();
            }
          }}
          @dp-date-picker-change=${(ev: Event) =>
            this._handleDatePickerChange(ev)}
        ></range-toolbar>
        <sidebar-options
          slot="sidebar-options"
          .datapointScope=${this._datapointScope}
          .showIcons=${this._showChartDatapointIcons}
          .showLines=${this._showChartDatapointLines}
          .showTooltips=${this._showChartTooltips}
          .showHoverGuides=${this._showChartEmphasizedHoverGuides}
          .hoverSnapMode=${this._chartHoverSnapMode}
          .showCorrelatedAnomalies=${this._showCorrelatedAnomalies}
          .showDataGaps=${this._showDataGaps}
          .dataGapThreshold=${this._dataGapThreshold}
          .yAxisMode=${this._sidebarYAxisMode}
          .anomalyOverlapMode=${this._chartAnomalyOverlapMode}
          .anyAnomaliesEnabled=${(this._seriesRows ?? []).some(
            (row) => row.analysis?.show_anomalies === true
          )}
          @dp-scope-change=${this._handlePreferenceScope}
          @dp-display-change=${this._handlePreferenceDisplay}
          @dp-analysis-change=${this._handlePreferenceAnalysis}
          .targetsOpen=${this._sidebarAccordionTargetsOpen}
          .datapointsOpen=${this._sidebarAccordionDatapointsOpen}
          .analysisOpen=${this._sidebarAccordionAnalysisOpen}
          .chartOpen=${this._sidebarAccordionChartOpen}
          @dp-accordion-change=${this._handlePreferenceAccordion}
        ></sidebar-options>
        <collapsed-options-menu
          slot="collapsed-options"
          .datapointScope=${this._datapointScope}
          .showIcons=${this._showChartDatapointIcons}
          .showLines=${this._showChartDatapointLines}
          .showTooltips=${this._showChartTooltips}
          .showHoverGuides=${this._showChartEmphasizedHoverGuides}
          .hoverSnapMode=${this._chartHoverSnapMode}
          .showCorrelatedAnomalies=${this._showCorrelatedAnomalies}
          .showDataGaps=${this._showDataGaps}
          .dataGapThreshold=${this._dataGapThreshold}
          .yAxisMode=${this._sidebarYAxisMode}
          .anomalyOverlapMode=${this._chartAnomalyOverlapMode}
          .anyAnomaliesEnabled=${(this._seriesRows ?? []).some(
            (row) => row.analysis?.show_anomalies === true
          )}
          @dp-scope-change=${this._handlePreferenceScope}
          @dp-display-change=${this._handlePreferenceDisplay}
          @dp-analysis-change=${this._handlePreferenceAnalysis}
        ></collapsed-options-menu>
        <history-targets
          slot="sidebar"
          .rows=${this._seriesRows}
          .states=${this._hass?.states ?? {}}
          .hass=${this._hass ?? null}
          .labelMap=${this._rowLabelMap}
          .comparisonWindows=${this._comparisonWindows}
          .canShowDeltaAnalysis=${!!this._selectedComparisonWindowId}
          .sidebarCollapsed=${this._sidebarCollapsed}
          .computingEntityIds=${this._computingEntityIds}
          .analysisProgress=${this._analysisProgress}
          .computingMethodsByEntity=${this._computingMethods}
          @dp-row-color-change=${(
            ev: DetailEvent<{ index?: number; color?: string }>
          ) => {
            const { index, color } = ev.detail || {};
            this._updateSeriesRowColor(index, color);
          }}
          @dp-row-visibility-change=${(
            ev: DetailEvent<{ entityId?: string; visible?: boolean }>
          ) => {
            const { entityId, visible } = ev.detail || {};
            this._updateSeriesRowVisibilityByEntityId(entityId, visible);
          }}
          @dp-row-remove=${(ev: DetailEvent<{ index?: number }>) => {
            this._removeSeriesRow(ev.detail?.index);
          }}
          @dp-row-toggle-analysis=${(
            ev: DetailEvent<{ entityId?: string }>
          ) => {
            this._toggleSeriesAnalysisExpanded(ev.detail?.entityId);
          }}
          @dp-row-analysis-change=${(
            ev: DetailEvent<{
              entityId?: string;
              key?: string;
              value?: unknown;
            }>
          ) => {
            const { entityId, key, value } = ev.detail || {};
            this._setSeriesAnalysisOption(entityId, key, value);
          }}
          @dp-row-copy-analysis-to-all=${(
            ev: DetailEvent<{ entityId?: string; analysis?: unknown }>
          ) => {
            const { entityId, analysis } = ev.detail || {};
            this._copyAnalysisToAll(entityId, analysis);
          }}
          @dp-rows-reorder=${(ev: DetailEvent<{ rows?: unknown[] }>) => {
            const { rows } = ev.detail || {};
            if (!Array.isArray(rows)) {
              return;
            }
            this._seriesRows = rows as HistoryTargetRowState[];
            this._syncSeriesState();
            this._saveSessionState();
            this._renderTargetRows();
            this._syncControls();
            this._updateUrl({ push: true });
            this._renderContent();
          }}
          @dp-targets-prefs-click=${(ev: Event) => {
            ev.stopPropagation();
            const anchor = ev.composedPath()[0] || ev.target;
            if (!(anchor instanceof HTMLElement)) {
              return;
            }
            if (this._collapsedOptionsPopupOpen) {
              this._hideCollapsedOptionsPopup();
            } else {
              this._showCollapsedOptionsPopup(anchor);
            }
          }}
          @dp-targets-add-click=${(
            ev: DetailEvent<{ buttonEl?: Nullable<HTMLElement> }>
          ) => {
            this._openTargetPicker(ev.detail?.buttonEl ?? undefined);
          }}
          @dp-targets-clear-all=${() => this._clearAllSeriesRows()}
          @dp-collapsed-entity-click=${(
            ev: DetailEvent<{
              entityId?: string;
              buttonEl?: Nullable<HTMLElement>;
            }>
          ) => {
            const { entityId, buttonEl } = ev.detail || {};
            if (!entityId) {
              return;
            }
            if (this._collapsedPopupEntityId === entityId) {
              this._hideCollapsedTargetPopup();
            } else {
              this._showCollapsedTargetPopup(entityId, buttonEl ?? undefined);
            }
          }}
        ></history-targets>
        <div id="content"></div>
      </panel-shell>
      <date-window-dialog
        ?open=${this._dateWindowDialogOpen}
        .heading=${this._editingDateWindowId
          ? msg("Edit date window")
          : msg("Add date window")}
        .submitLabel=${this._editingDateWindowId
          ? msg("Save date window")
          : msg("Create date window")}
        .showDelete=${!!this._editingDateWindowId}
        .showShortcuts=${!this._editingDateWindowId}
        .name=${this._dateWindowDialogName}
        .startValue=${this._dateWindowDialogStartValue}
        .endValue=${this._dateWindowDialogEndValue}
        .rangeBounds=${this._rangeBounds ?? null}
        .zoomLevel=${this._zoomLevel ?? "auto"}
        .dateSnapping=${this._dateSnapping ?? "hour"}
        @dp-window-close=${() => this._closeDateWindowDialog()}
        @dp-window-submit=${(ev: DetailEvent<RecordWithUnknownValues>) =>
          this._createDateWindowFromDialog(ev.detail || {})}
        @dp-window-delete=${() => this._deleteEditingDateWindow()}
        @dp-window-shortcut=${(ev: DetailEvent<{ direction?: number }>) => {
          if (typeof ev.detail?.direction === "number") {
            this._applyDateWindowShortcut(ev.detail.direction);
          }
        }}
        @dp-window-date-change=${(
          ev: DetailEvent<{ start?: string; end?: string }>
        ) =>
          this._handleDateWindowDateChange(
            ev.detail?.start || "",
            ev.detail?.end || ""
          )}
      ></date-window-dialog>
      <anomaly-monitor-wizard
        .hass=${this._hass}
        ?open=${this._monitorWizardOpen}
        .prefillEntityIds=${this._monitorWizardPayload.prefillEntityIds}
        .prefillAnalysis=${this._monitorWizardPayload.prefillAnalysis}
        .editMonitor=${this._monitorWizardPayload.editMonitor}
        .suggestedEntityIds=${this._monitorWizardPayload.suggestedEntityIds}
        .allSeriesEntityIds=${this._monitorWizardPayload.allSeriesEntityIds}
        @dp-monitor-wizard-close=${() => {
          this._monitorWizardOpen = false;
        }}
        @dp-monitor-wizard-saved=${() => {
          this._monitorWizardOpen = false;
        }}
      ></anomaly-monitor-wizard>
      <ai-query-brief-dialog
        ?open=${this._aiQueryBriefDialogOpen}
        .heading=${this._aiQueryBriefHeading}
        .text=${this._aiQueryBriefText}
        @dp-ai-query-brief-close=${() => {
          this._aiQueryBriefDialogOpen = false;
        }}
      ></ai-query-brief-dialog>
    `;
  }

  /** Disambiguated entity → display-name map for the current series rows. */
  _computeRowLabelMap(): Map<string, string> {
    return disambiguateEntityNames(
      this._hass,
      (this._seriesRows ?? []).map((r: { entity_id: string }) => r.entity_id)
    );
  }

  protected updated() {
    this._renderComparisonTabSlot();
    this._positionCollapsedOptionsPopup();
    this._rangeToolbarComp = this.renderRoot.querySelector("range-toolbar");
    if (this._shellBuilt && !this._shellEl) {
      this._mountShellControls();
    }
    // Measured-DOM side effect: push the current zoom window into the list card
    // (keyed, so it is a no-op unless the config actually changed).
    this._applyListZoomConfig();
  }

  /** Measured layout side effects, driven by the host ResizeController. */
  private _handleHostResize(): void {
    if (!this._rendered) {
      return;
    }
    this._shellEl?.syncLayoutHeight();
    this._applyContentSplitLayout();
    this._requestChartResizeRedraw();
    this.requestUpdate();
  }

  private async _mountShellControls() {
    const shell = this.renderRoot.querySelector("panel-shell");
    if (!shell) {
      return;
    }
    this._shellEl = shell;
    this._contentHostEl = shell.querySelector("#content");
    await shell.updateComplete;
    if (!this.isConnected) {
      // Let a subsequent connection complete mounting the retained scaffold.
      this._shellEl = null;
      this.requestUpdate();
      return;
    }
    shell.syncLayoutHeight();
    this._applyContentSplitLayout();
    this._mountControls();
    this._renderSidebarOptions();
    this._syncControls();
    this._bootstrapAfterShellBuilt();
  }

  _bootstrapAfterShellBuilt() {
    if (!this._shellBuilt) {
      logger.warn(
        "[dp-lifecycle] _bootstrapAfterShellBuilt: skipped — shell not built"
      );
      return;
    }
    logger.warn("[dp-lifecycle] _bootstrapAfterShellBuilt: running", {
      rendered: this._rendered,
      entityCount: this._entities?.length ?? 0,
      contentKey: this._contentKey,
    });
    this._ensureHistoryBounds();
    this._ensureUserPreferences();
    this._loadSavedPageIndicator();
    this._refreshTargetPickerHass();
    this._renderTargetRows();
    this._renderContent();
    if (this._restoredFromSession) {
      this._restoredFromSession = false;
      this._updateUrl({ push: false });
    }
  }

  _ensureUiComponentsReady() {
    if (this._uiReadyPromise) {
      logger.warn(
        "[dp-lifecycle] _ensureUiComponentsReady: promise already exists — returning cached",
        {
          rendered: this._rendered,
          shellBuilt: this._shellBuilt,
          uiReadyApplied: this._uiReadyApplied,
        }
      );
      return this._uiReadyPromise;
    }
    logger.warn(
      "[dp-lifecycle] _ensureUiComponentsReady: creating new promise",
      {
        rendered: this._rendered,
        shellBuilt: this._shellBuilt,
        isConnected: this.isConnected,
      }
    );
    const componentTags = [
      "ha-top-app-bar-fixed",
      "ha-menu-button",
      "ha-icon-button",
      "ha-dialog",
      "ha-tooltip",
      "ha-target-picker",
      "ha-date-range-picker",
      "ha-entity-picker",
    ];
    this._uiReadyPromise = ensureHaComponents(componentTags)
      .then((results) => results)
      .then(() => {
        if (!this.isConnected || !this._rendered) {
          // hass hasn't arrived yet (or element disconnected).  Clear the stored
          // promise so that the next call — triggered once hass sets _rendered=true
          // or connectedCallback fires again — will create a fresh one and actually
          // build the shell.
          logger.warn(
            "[dp-lifecycle] _ensureUiComponentsReady: components ready but bailing early",
            {
              isConnected: this.isConnected,
              rendered: this._rendered,
              shellBuilt: this._shellBuilt,
            }
          );
          this._uiReadyPromise = null;
          return;
        }
        logger.warn(
          "[dp-lifecycle] _ensureUiComponentsReady: components ready — scheduling double RAF",
          {
            shellBuilt: this._shellBuilt,
            uiReadyApplied: this._uiReadyApplied,
          }
        );
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!this.isConnected || !this._rendered) {
              logger.warn(
                "[dp-lifecycle] _ensureUiComponentsReady double RAF: aborted",
                {
                  isConnected: this.isConnected,
                  rendered: this._rendered,
                }
              );
              return;
            }
            this._uiReadyApplied = true;
            if (!this._shellBuilt) {
              // First load only — build the full shell DOM.  On reconnect after
              // navigation, _shellBuilt is already true so we skip this; tearing
              // down root.innerHTML while connectedCallback's RAF is mid-flight
              // was the root cause of the crash-on-return bug.
              logger.warn(
                "[dp-lifecycle] _ensureUiComponentsReady double RAF: calling _buildShell"
              );
              this._buildShell();
              return;
            }
            logger.warn(
              "[dp-lifecycle] _ensureUiComponentsReady double RAF: shell already built — skipping _buildShell"
            );

            logger.warn(
              "[dp-lifecycle] _ensureUiComponentsReady double RAF: calling syncControls + bootstrapAfterShellBuilt"
            );
            this._syncControls();
            this._bootstrapAfterShellBuilt();
          });
        });
      })
      .catch((error) => {
        logger.warn(
          "[hass-datapoints panel] ensure UI components ready failed",
          {
            message: error?.message || String(error),
          }
        );
      });
    return this._uiReadyPromise;
  }

  _syncControls() {
    this._shellEl?.syncLayoutHeight();
    this._refreshTargetPickerHass();
    this._renderTargetRows();
    this.requestUpdate();
    this._renderSidebarOptions();
  }

  /** Push the latest hass into the imperatively-mounted target picker. */
  private _refreshTargetPickerHass() {
    if (!this._targetControl) {
      return;
    }
    if (this._hass) {
      this._targetControl.hass = this._hass;
    }
    this._targetControl.value = {};
  }

  _syncSeriesState() {
    this._seriesRows = normalizeHistorySeriesRows(this._seriesRows);
    this._entities = this._seriesRows.map(
      (row: { entity_id: string }) => row.entity_id
    );
    this._targetSelection = this._entities.length
      ? { entity_id: [...this._entities] }
      : {};
    this._targetSelectionRaw = this._targetSelection;
  }

  _seriesColorQueryKey(entityId: string) {
    return slugifySeriesName(entityName(this._hass, entityId) || entityId);
  }

  _applyPreferredSeriesColors(
    rows: unknown,
    urlColorMap: Nullable<RecordWithStringValues> = null
  ) {
    const queryColors =
      urlColorMap && typeof urlColorMap === "object"
        ? urlColorMap
        : ({} as RecordWithStringValues);
    return normalizeHistorySeriesRows(rows).map((row) => {
      const queryColor = queryColors[this._seriesColorQueryKey(row.entity_id)];
      const preferredColor = this._preferredSeriesColors?.[row.entity_id];
      let nextColor;
      if (/^#[0-9a-f]{6}$/i.test(queryColor || "")) {
        nextColor = queryColor;
      } else if (/^#[0-9a-f]{6}$/i.test(preferredColor || "")) {
        nextColor = preferredColor;
      } else {
        nextColor = row.color;
      }
      return nextColor === row.color ? row : { ...row, color: nextColor };
    });
  }

  _mergeSavedSeriesRows(rows: unknown, savedRows: unknown) {
    return mergeSavedSeriesRows(rows, savedRows);
  }

  _renderSidebarOptions() {
    // Context callbacks may mutate row analysis in place.
    this.requestUpdate();
  }

  private get _sidebarYAxisMode(): string {
    if (this._splitChartView) {
      return "split";
    }
    if (this._delinkChartYAxis) {
      return "unique";
    }
    return "combined";
  }

  _formatComparisonLabel(start: Date, end: Date) {
    return formatComparisonLabel(start, end);
  }

  _getComparisonPreviewOverlay() {
    return getComparisonPreviewOverlay(
      this._getActiveComparisonWindow(),
      this._startTime,
      this._endTime
    );
  }

  _getPreviewComparisonWindows() {
    return getPreviewComparisonWindows(
      this._comparisonWindows,
      this._selectedComparisonWindowId,
      this._hoveredComparisonWindowId,
      this._startTime
    );
  }

  _getPreloadComparisonWindows() {
    return getPreloadComparisonWindows(
      this._comparisonWindows,
      this._startTime
    );
  }

  _getActiveComparisonWindow() {
    return getActiveComparisonWindow(
      this._comparisonWindows,
      this._hoveredComparisonWindowId,
      this._selectedComparisonWindowId
    );
  }

  _formatDateWindowInputValue(date: Nullable<Date>) {
    return formatDateWindowInputValue(date);
  }

  _parseDateWindowInputValue(value: Nullable<string> | undefined) {
    return parseDateWindowInputValue(value);
  }

  _shiftDateWindowByUnit(date: Date, unit: RangeUnit, amount: number) {
    return shiftDateWindowByUnit(date, unit, amount);
  }

  _getRoundedDateWindowUnit(start: Date, end: Date): Nullable<RangeUnit> {
    return getRoundedDateWindowUnit(start, end);
  }

  /** Push the current draft range into the controlled start/end form values. */
  _syncDateWindowDialogInputs() {
    this._dateWindowDialogStartValue = this._formatDateWindowInputValue(
      this._dateWindowDialogDraftRange?.start || null
    );
    this._dateWindowDialogEndValue = this._formatDateWindowInputValue(
      this._dateWindowDialogDraftRange?.end || null
    );
  }

  _applyDateWindowShortcut(direction: number) {
    if (this._editingDateWindowId) return;
    const result = applyDateWindowShortcut(
      this._dateWindowDialogDraftRange,
      direction,
      (s, e) => this._getRoundedDateWindowUnit(s, e),
      (d, u, a) => this._shiftDateWindowByUnit(d, u as RangeUnit, a),
      (d, u) => startOfUnit(d, u as RangeUnit),
      (d, u) => endOfUnit(d, u as RangeUnit)
    );
    if (!result) return;
    this._dateWindowDialogDraftRange = result;
    this._syncDateWindowDialogInputs();
  }

  _openDateWindowDialog(
    targetWindow: Nullable<NormalizedHistoryDateWindow> = null
  ) {
    this._editingDateWindowId = targetWindow?.id || null;
    const dialogStart = targetWindow
      ? parseDateValue(targetWindow.start_time)
      : this._startTime;
    const dialogEnd = targetWindow
      ? parseDateValue(targetWindow.end_time)
      : this._endTime;
    this._dateWindowDialogDraftRange =
      dialogStart && dialogEnd && dialogStart < dialogEnd
        ? { start: new Date(dialogStart), end: new Date(dialogEnd) }
        : null;
    this._dateWindowDialogName = targetWindow?.label || "";
    this._syncDateWindowDialogInputs();
    // Flipping the reactive open flag renders the declarative <date-window-dialog>.
    this._dateWindowDialogOpen = true;
  }

  _closeDateWindowDialog() {
    this._dateWindowDialogOpen = false;
    this._editingDateWindowId = null;
    this._dateWindowDialogDraftRange = null;
    this._pendingAnomalyComparisonWindowEntityId = null;
  }

  _createDateWindowFromDialog(
    overrides: { name?: unknown; start?: unknown; end?: unknown } = {}
  ) {
    // Values arrive from the date-window-dialog's dp-window-submit event.
    const rawName = overrides.name != null ? overrides.name : "";
    const label = String(rawName).trim();
    const parsedStart = overrides.start
      ? this._parseDateWindowInputValue(String(overrides.start))
      : null;
    const parsedEnd = overrides.end
      ? this._parseDateWindowInputValue(String(overrides.end))
      : null;
    const start =
      parsedStart || this._dateWindowDialogDraftRange?.start || null;
    const end = parsedEnd || this._dateWindowDialogDraftRange?.end || null;
    if (!label || !start || !end || start >= end) {
      return;
    }
    const existingIds = new Set<string>(
      this._comparisonWindows.map(
        (window: NormalizedHistoryDateWindow) => window.id
      )
    );
    const nextWindow = {
      id: this._editingDateWindowId || makeDateWindowId(label, existingIds),
      label,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
    this._comparisonWindows = normalizeDateWindows(
      this._editingDateWindowId
        ? this._comparisonWindows.map((window: NormalizedHistoryDateWindow) =>
            window.id === this._editingDateWindowId ? nextWindow : window
          )
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
      this._setSeriesAnalysisOption(
        pendingEntityId,
        "anomaly_comparison_window_id",
        nextWindow.id
      );
    }
    this._renderContent();
  }

  async _deleteDateWindow(id: string) {
    if (!id) {
      return;
    }
    const windowToDelete = this._comparisonWindows.find(
      (window: NormalizedHistoryDateWindow) => window.id === id
    );
    const confirmed = await confirmDestructiveAction(this, {
      title: msg("Delete date window"),
      message: `${msg("Delete")} "${windowToDelete?.label || msg("this date window")}"?`,
      confirmLabel: msg("Delete date window"),
    });
    if (!confirmed) {
      return false;
    }
    const nextWindows = this._comparisonWindows.filter(
      (window: NormalizedHistoryDateWindow) => window.id !== id
    );
    if (nextWindows.length === this._comparisonWindows.length) {
      return false;
    }
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
    if (!id) {
      return;
    }
    const deleted = await this._deleteDateWindow(id);
    if (deleted) {
      this._closeDateWindowDialog();
    }
  }

  _handleComparisonTabHover(id: Nullable<string>) {
    this._context.orchestration.handleComparisonTabHover({
      id,
      hoveredComparisonWindowId: this._hoveredComparisonWindowId,
      setHoveredComparisonWindowId: (value: Nullable<string>) => {
        this._hoveredComparisonWindowId = value;
      },
      updateComparisonRangePreview: () => {
        this._updateComparisonRangePreview();
      },
      updateChartHoverIndicator: () => {
        this._updateChartHoverIndicator();
      },
      renderContent: () => {
        this._renderContent();
      },
    });
  }

  _handleComparisonTabLeave(id: Nullable<string>) {
    this._context.orchestration.handleComparisonTabLeave({
      id,
      hoveredComparisonWindowId: this._hoveredComparisonWindowId,
      setHoveredComparisonWindowId: (value: Nullable<string>) => {
        this._hoveredComparisonWindowId = value;
      },
      updateComparisonRangePreview: () => {
        this._updateComparisonRangePreview();
      },
      updateChartHoverIndicator: () => {
        this._updateChartHoverIndicator();
      },
      renderContent: () => {
        this._renderContent();
      },
    });
  }

  _handleComparisonLoading(
    ev: DetailEvent<{ ids?: string[]; loading?: boolean }>
  ) {
    const ids = Array.isArray(ev?.detail?.ids)
      ? ev.detail.ids.filter(Boolean)
      : [];
    const loading = ev?.detail?.loading === true;
    this._loadingComparisonWindowIds = loading
      ? [...new Set([...this._loadingComparisonWindowIds, ...ids])]
      : this._loadingComparisonWindowIds.filter(
          (id: string) => !ids.includes(id)
        );
    this._renderComparisonTabs();
  }

  _handleAnalysisComputing(
    ev: DetailEvent<{
      computing?: boolean;
      entityIds?: string[];
      progress?: number;
    }>
  ) {
    const computing = ev?.detail?.computing === true;
    const entityIds = Array.isArray(ev?.detail?.entityIds)
      ? ev.detail.entityIds
      : [];
    const computingProgress = computing ? 0 : 100;
    const progress =
      typeof ev?.detail?.progress === "number"
        ? ev.detail.progress
        : computingProgress;

    if (computing) {
      for (const id of entityIds) {
        this._computingEntityIds.add(id);
      }
      // On the initial progress=0 signal, seed _computingMethods from the current row
      // configs so each entity knows which anomaly method spinners to show.
      if (progress === 0) {
        for (const id of entityIds) {
          const row = this._seriesRows?.find((r) => r.entity_id === id);
          const methods =
            row?.analysis?.show_anomalies === true &&
            Array.isArray(row.analysis.anomaly_methods)
              ? row.analysis.anomaly_methods
              : [];
          this._computingMethods.set(id, new Set(methods));
          logger.log(
            `[datapoints] analysis started for ${id} — methods: [${methods.join(", ")}]`
          );
        }
      } else {
        logger.log(`[datapoints] analysis progress ${progress}%`);
      }
    } else {
      for (const id of entityIds) {
        this._computingEntityIds.delete(id);
        this._computingMethods.delete(id);
      }
      logger.log(`[datapoints] analysis complete (${entityIds.join(", ")})`);
    }
    this._analysisProgress = progress;
    this._invalidateComputingState();
  }

  _handleAnalysisMethodResult(
    ev: DetailEvent<{ entityId?: string; method?: string }>
  ) {
    logger.log("[datapoints] _handleAnalysisMethodResult received", ev?.detail);
    const entityId = ev?.detail?.entityId;
    const method = ev?.detail?.method;
    if (!entityId || !method) {
      logger.log(
        "[datapoints] _handleAnalysisMethodResult: missing entityId or method, ignoring"
      );
      return;
    }
    // Replace the Set with a new instance so Lit detects the reference change and re-renders.
    // Mutating the existing Set in place would leave the same object reference in the Map,
    // which Lit treats as unchanged and skips the re-render.
    const current = this._computingMethods.get(entityId);
    if (current) {
      const next = new Set(current);
      next.delete(method);
      this._computingMethods.set(entityId, next);
    }
    const remaining = [...(this._computingMethods.get(entityId) ?? [])];
    logger.log(
      `[datapoints] method done: ${method} for ${entityId} — remaining: [${remaining.join(", ") || "none"}]`
    );
    this._invalidateComputingState();
  }

  /**
   * Publishes the in-flight anomaly-computation state to the sidebar.  These
   * collections are plain fields mutated in place, so every mutation site MUST
   * route through here: it reassigns fresh Set/Map references (so the
   * declarative `<history-targets>` bindings, and the row list it owns, detect
   * the change) and requests a re-render.
   */
  _invalidateComputingState() {
    this._computingEntityIds = new Set(this._computingEntityIds);
    this._computingMethods = new Map(this._computingMethods);
    this.requestUpdate();
  }

  _clearDeltaAnalysisSelectionState() {}

  _handleComparisonTabActivate(id: Nullable<string>) {
    this._context.orchestration.handleComparisonTabActivate({
      id,
      comparisonWindows: this._comparisonWindows,
      selectedComparisonWindowId: this._selectedComparisonWindowId,
      setSelectedComparisonWindowId: (value: Nullable<string>) => {
        this._selectedComparisonWindowId = value;
      },
      setHoveredComparisonWindowId: (value: Nullable<string>) => {
        this._hoveredComparisonWindowId = value;
      },
      clearDeltaAnalysisSelectionState: () => {
        this._clearDeltaAnalysisSelectionState();
      },
      updateComparisonRangePreview: () => {
        this._updateComparisonRangePreview();
      },
      updateChartHoverIndicator: () => {
        this._updateChartHoverIndicator();
      },
      renderComparisonTabs: () => {
        this._renderComparisonTabs();
      },
      renderContent: () => {
        this._renderContent();
      },
      setAdjustComparisonAxisScale: (value: boolean) => {
        this._chartEl?.setAdjustComparisonAxisScale?.(value);
      },
    });
  }

  _updateLayoutMode() {
    const prev = this._layoutMode;
    if (this._mqMobile.matches) {
      this._layoutMode = "mobile";
    } else if (this._mqTablet.matches) {
      this._layoutMode = "tablet";
    } else {
      this._layoutMode = "desktop";
    }
    if (prev !== this._layoutMode) {
      this._renderTargetRows();
    }
  }

  _applyContentSplitLayout() {
    const content = this._contentHostEl;
    if (!content) {
      return;
    }
    // Drive the resizable-panes atom when present; fall back to CSS variable.
    const resizablePanes = content.querySelector(
      "#content-resizable-panes"
    ) as Nullable<ResizablePanesElement>;
    if (resizablePanes) {
      resizablePanes.ratio = this._contentSplitRatio;
    } else {
      content.style.setProperty(
        "--content-top-size",
        `${Math.round(this._contentSplitRatio * 1000) / 10}%`
      );
    }
    this._updateComparisonTabsOverflow();
  }

  _requestChartResizeRedraw() {
    this._context.orchestration.requestChartResizeRedraw(this._chartEl);
  }

  _toggleSidebarCollapsed() {
    this._sidebarCollapsed = !this._sidebarCollapsed;
    if (!this._sidebarCollapsed) {
      this._hideCollapsedTargetPopup();
    }
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
  }

  _handleCollapsedSidebarClick() {
    if (!this._sidebarCollapsed) {
      // Intentionally ignored. Background clicks in the collapsed rail should do nothing.
    }
  }

  _openTargetPicker(anchorEl: Nullable<HTMLElement> | undefined = null) {
    this._context.orchestration.openTargetPicker(this._targetControl, anchorEl);
  }

  _setDatapointScope(scope: string) {
    let nextScope;
    if (scope === "all") {
      nextScope = "all";
    } else if (scope === "hidden") {
      nextScope = "hidden";
    } else {
      nextScope = "linked";
    }
    if (nextScope === this._datapointScope) {
      return;
    }
    this._datapointScope = nextScope;
    this._timelineEvents = [];
    this._timelineEventsKey = "";
    this._saveSessionState();
    this._renderSidebarOptions();
    this._updateUrl({ push: false });
    this._ensureTimelineEvents();
    this._renderContent();
  }

  _setChartYAxisMode(mode: string) {
    const nextDelink = mode === "unique";
    const nextSplit = mode === "split";
    if (
      this._delinkChartYAxis === nextDelink &&
      this._splitChartView === nextSplit
    ) {
      return;
    }
    this._delinkChartYAxis = nextDelink;
    this._splitChartView = nextSplit;
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderSidebarOptions();
    this._renderContent();
  }

  _setChartDatapointDisplayOption(kind: string, enabled: unknown) {
    const normalized = !!enabled;
    if (kind === "icons") {
      if (this._showChartDatapointIcons === normalized) {
        return;
      }
      this._showChartDatapointIcons = normalized;
    } else if (kind === "lines") {
      if (this._showChartDatapointLines === normalized) {
        return;
      }
      this._showChartDatapointLines = normalized;
    } else if (kind === "tooltips") {
      if (this._showChartTooltips === normalized) {
        return;
      }
      this._showChartTooltips = normalized;
    } else if (kind === "hover_guides") {
      if (this._showChartEmphasizedHoverGuides === normalized) {
        return;
      }
      this._showChartEmphasizedHoverGuides = normalized;
    } else if (kind === "hover_snap_mode") {
      const value =
        String(enabled) === "snap_to_data_points"
          ? "snap_to_data_points"
          : "follow_series";
      if (this._chartHoverSnapMode === value) {
        return;
      }
      this._chartHoverSnapMode = value;
    } else if (kind === "correlated_anomalies") {
      if (this._showCorrelatedAnomalies === normalized) {
        return;
      }
      this._showCorrelatedAnomalies = normalized;
    } else if (kind === "delink_y_axis") {
      if (this._delinkChartYAxis === normalized) {
        return;
      }
      this._delinkChartYAxis = normalized;
      if (normalized) {
        this._splitChartView = false;
      }
    } else if (kind === "split_chart_view") {
      if (this._splitChartView === normalized) {
        return;
      }
      this._splitChartView = normalized;
      if (normalized) {
        this._delinkChartYAxis = false;
      }
    } else if (kind === "data_gaps") {
      if (this._showDataGaps === normalized) {
        return;
      }
      this._showDataGaps = normalized;
    } else if (kind === "data_gap_threshold") {
      const value = String(enabled);
      if (this._dataGapThreshold === value) {
        return;
      }
      this._dataGapThreshold = value;
    } else {
      return;
    }
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderSidebarOptions();
    this._renderContent();
  }

  async _ensureHistoryBounds() {
    await this._context.fetch.ensureHistoryBounds({
      onSuccess: ({ start, end }: { start: unknown; end: unknown }) => {
        this._historyStartTime = parseDateValue(
          start as string | number | Nullable<Date> | undefined
        );
        this._historyEndTime = parseDateValue(
          end as string | number | Nullable<Date> | undefined
        );
        if (this._zoomLevel === "auto") {
          this._resolvedAutoZoomLevel = null;
        }
        if (this._rendered) {
          this._syncControls();
        }
      },
      onError: (err: unknown) => {
        logger.warn("[hass-datapoints] failed to load event bounds:", err);
      },
    });
  }

  async _ensureTimelineEvents() {
    if (!this._hass || !this._rangeBounds) {
      return;
    }
    if (
      this._datapointScope === "hidden" ||
      (this._datapointScope === "linked" && this._entities.length === 0)
    ) {
      this._timelineEvents = [];
      this._context.fetch.resetTimelineEvents();
      return;
    }
    const startIso = new Date(this._rangeBounds!.min).toISOString();
    const endIso = new Date(this._rangeBounds!.max).toISOString();
    await this._context.fetch.loadTimelineEvents({
      startIso,
      endIso,
      datapointScope: this._datapointScope,
      entityIds: this._entities,
      onSuccess: (events: unknown[], key: string) => {
        this._timelineEvents = events;
        this._timelineEventsKey = key;
      },
      onError: (err: unknown) => {
        logger.warn("[hass-datapoints] failed to load timeline events:", err);
      },
    });
  }

  async _ensureUserPreferences() {
    await this._context.fetch.ensureUserPreferences({
      preferencesKey: PANEL_HISTORY_PREFERENCES_KEY,
      fallbackValue: null,
      onSuccess: (preferences: unknown) => {
        const normalized = normalizeHistoryPagePreferences(
          preferences as Nullable<RecordWithUnknownValues>,
          {
            zoomOptions: RANGE_ZOOM_OPTIONS,
            snapOptions: RANGE_SNAP_OPTIONS,
          }
        );
        this._zoomLevel = normalized.zoomLevel;
        this._dateSnapping = normalized.dateSnapping;
        this._resolvedAutoZoomLevel =
          normalized.zoomLevel === "auto" ? null : this._resolvedAutoZoomLevel;
        this._preferredSeriesColors = normalized.preferredSeriesColors;
        this._comparisonWindows = this._comparisonWindows.length
          ? this._comparisonWindows
          : normalized.comparisonWindows;
        this._seriesRows = this._applyPreferredSeriesColors(this._seriesRows);
        if (!this._localPageStateDirty) {
          this._applyPreferencePageState(normalized.pageState);
        }
        if (normalized.shouldPersistDefaults) {
          this._saveUserPreferences();
        }
        if (this._rendered) {
          this._renderTargetRows();
          this._syncControls();
          this._updateUrl({ push: false });
          this._renderContent();
        }
      },
      onError: (err: unknown) => {
        logger.warn("[hass-datapoints] failed to load panel preferences:", err);
      },
    });
  }

  _saveUserPreferences() {
    if (!this._hass) {
      return;
    }
    const payload = buildHistoryPagePreferencesPayload(
      this as unknown as HistoryPageSource
    );
    this._preferredSeriesColors = payload.series_colors ?? {};
    this._context.persistence.saveUserPreferences({
      preferencesKey: PANEL_HISTORY_PREFERENCES_KEY,
      payload,
    });
  }

  _mountControls() {
    if (!this._shellEl) {
      return;
    }

    // `history-targets` is rendered declaratively in render(); grab the element
    // and mount the imperative target picker into its `picker` slot once.
    const histTargets = this.renderRoot.querySelector(
      "history-targets"
    ) as Nullable<HistoryTargetsElement>;
    this._historyTargetsComp = histTargets;
    if (histTargets && !this._targetControl) {
      this._mountTargetPickerControl(histTargets);
    }
    // The date-window dialog, monitor wizard and AI-brief dialog are rendered
    // declaratively in render() with `?open=` state — no imperative mount.
    this._syncControls();
  }

  _mountTargetPickerControl(histTargets: HTMLElement) {
    const targetControl = document.createElement(
      "ha-target-picker"
    ) as TargetPickerElement;
    targetControl.slot = "picker";
    targetControl.style.display = "block";
    targetControl.style.width = "100%";
    if (this._hass) {
      targetControl.hass = this._hass;
    }
    targetControl.addEventListener(
      "value-changed",
      (ev: DetailEvent<{ value?: unknown }>) => {
        const hasValue = ev.detail && Object.hasOwn(ev.detail, "value");
        if (!hasValue) {
          return;
        }
        const rawValue = normalizeTargetValue(
          (ev.detail?.value ?? null) as RecordWithUnknownValues
        );
        const nextEntityIds = resolveEntityIdsFromTarget(this._hass, rawValue);
        if (!nextEntityIds.length) {
          return;
        }
        this._addSeriesRows(nextEntityIds);
        targetControl.value = {};
        this._saveSessionState();
        this._syncControls();
        this._updateUrl({ push: true });
        this._renderContent();
      }
    );
    histTargets.appendChild(targetControl);
    this._targetControl = targetControl;
    ensureHaComponents(["ha-target-picker"]).then(() => {
      if (!this.isConnected || this._targetControl !== targetControl) {
        return;
      }
      if (this._hass) {
        targetControl.hass = this._hass;
      }
      targetControl.value = {};
    });
  }

  private _handlePreferenceScope(ev: DetailEvent<{ value?: string }>) {
    const { value } = ev.detail || {};
    if (value) {
      this._setDatapointScope(value);
    }
  }

  private _handlePreferenceDisplay(
    ev: DetailEvent<{ kind?: string; value?: unknown }>
  ) {
    const { kind, value } = ev.detail || {};
    if (!kind) {
      return;
    }
    if (kind === "y_axis_mode") {
      this._setChartYAxisMode(String(value || ""));
    } else {
      this._setChartDatapointDisplayOption(kind, value);
    }
  }

  private _handlePreferenceAnalysis(
    ev: DetailEvent<{ kind?: string; value?: string }>
  ) {
    const { kind, value } = ev.detail || {};
    if (
      kind === "anomaly_overlap_mode" &&
      ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS.some(
        (option) => option.value === value
      ) &&
      value !== this._chartAnomalyOverlapMode
    ) {
      this._chartAnomalyOverlapMode = value!;
      this._saveSessionState();
      this._updateUrl({ push: false });
      this._renderContent();
    }
  }

  private _handlePreferenceAccordion(
    ev: DetailEvent<{
      targetsOpen?: boolean;
      datapointsOpen?: boolean;
      analysisOpen?: boolean;
      chartOpen?: boolean;
    }>
  ) {
    const { targetsOpen, datapointsOpen, analysisOpen, chartOpen } =
      ev.detail || {};
    if (typeof targetsOpen === "boolean") {
      this._sidebarAccordionTargetsOpen = targetsOpen;
    }
    if (typeof datapointsOpen === "boolean") {
      this._sidebarAccordionDatapointsOpen = datapointsOpen;
    }
    if (typeof analysisOpen === "boolean") {
      this._sidebarAccordionAnalysisOpen = analysisOpen;
    }
    if (typeof chartOpen === "boolean") {
      this._sidebarAccordionChartOpen = chartOpen;
    }
    this._saveSessionState();
    this._updateUrl({ push: false });
  }

  _openMonitorWizardFromChartAnalysis(entityId: string, analysis: unknown) {
    const suggestedIds: string[] = (this._seriesRows ?? [])
      .filter(
        (r: {
          entity_id: string;
          analysis?: { show_anomalies?: boolean; anomaly_methods?: string[] };
        }) =>
          r.analysis?.show_anomalies === true &&
          Array.isArray(r.analysis.anomaly_methods) &&
          r.analysis.anomaly_methods.length > 0 &&
          !r.entity_id.startsWith("binary_sensor.") &&
          r.entity_id !== entityId
      )
      .map((r: { entity_id: string }) => r.entity_id);
    const allSeriesIds: string[] = (this._seriesRows ?? [])
      .filter(
        (r: { entity_id: string }) => !r.entity_id.startsWith("binary_sensor.")
      )
      .map((r: { entity_id: string }) => r.entity_id);

    this._openMonitorWizard(
      entityId ? [entityId] : [],
      analysis,
      null,
      suggestedIds,
      allSeriesIds
    );
  }

  _openMonitorWizard(
    entityIds: string[],
    analysis: unknown,
    editMonitor: unknown = null,
    suggestedEntityIds: string[] = [],
    allSeriesEntityIds: string[] = []
  ) {
    this._monitorWizardPayload = {
      prefillEntityIds: entityIds,
      prefillAnalysis: analysis,
      editMonitor,
      suggestedEntityIds,
      allSeriesEntityIds,
    };
    // Flipping the reactive flag renders the declarative <anomaly-monitor-wizard>.
    this._monitorWizardOpen = true;
  }

  /**
   * Date-window-dialog `dp-window-date-change` handler: update the draft range
   * and keep the controlled start/end value fields in step with the inputs
   * (the component is fully controlled, so the parent owns these values).
   */
  _handleDateWindowDateChange(startStr: string, endStr: string) {
    this._dateWindowDialogStartValue = startStr;
    this._dateWindowDialogEndValue = endStr;
    const start = this._parseDateWindowInputValue(startStr);
    const end = this._parseDateWindowInputValue(endStr);
    this._dateWindowDialogDraftRange =
      start && end && start < end ? { start, end } : null;
  }

  async _resolveAiQueryBriefMonitorContext(): Promise<AiQueryBriefMonitorContext> {
    if (!this._hass) {
      return {
        access: "unavailable",
        monitors: [],
        note: "Monitor context could not be included because Home Assistant is not currently available.",
      };
    }
    if (this._hass.user?.is_admin !== true) {
      return {
        access: "not_admin",
        monitors: [],
        note: "Monitor context could not be included because the current Home Assistant user is not an admin.",
      };
    }
    try {
      const result = (await this._hass.connection.sendMessagePromise({
        type: `${DOMAIN}/monitors/list`,
      })) as {
        monitors?: AnomalyMonitor[];
      };
      const monitors = Array.isArray(result?.monitors) ? result.monitors : [];
      return {
        access: "loaded",
        monitors,
        note: monitors.length
          ? ""
          : "No persisted anomaly monitors are currently configured.",
      };
    } catch {
      return {
        access: "unavailable",
        monitors: [],
        note: "Monitor context could not be included because the monitor list request failed.",
      };
    }
  }

  async _openAiQueryBriefDialog() {
    const monitorContext = await this._resolveAiQueryBriefMonitorContext();
    const brief = buildAiQueryBrief({
      hass: this._hass,
      entities: [...this._entities],
      targetSelectionRaw: this._targetSelectionRaw,
      seriesRows: this._seriesRows,
      datapointScope: this._datapointScope,
      startTime: this._startTime,
      endTime: this._endTime,
      committedZoomRange: this._chartZoomCommittedRange,
      comparisonWindows: this._comparisonWindows,
      selectedComparisonWindowId: this._selectedComparisonWindowId,
      chartAnomalyOverlapMode: this._chartAnomalyOverlapMode,
      monitorContext,
      anomalySnapshot:
        this._chartEl?.getAiQueryBriefAnomalySnapshot?.() ?? null,
    });
    this._aiQueryBriefHeading = msg("AI query brief");
    this._aiQueryBriefText = brief.plainText;
    // Flipping the reactive flag renders the declarative <ai-query-brief-dialog>.
    this._aiQueryBriefDialogOpen = true;
  }

  _renderTargetRows() {
    // `history-targets` and its row list are bound declaratively in render()
    // from `_seriesRows`, `_hass`, `_computeRowLabelMap()` and the computing
    // state; a re-render pushes the latest values across the shadow boundary.
    this.requestUpdate();
    this._refreshCollapsedTargetPopup();
  }

  _addSeriesRows(entityIds: string[] | string) {
    this._seriesRows = addSeriesRows(
      this._seriesRows,
      normalizeEntityIds(entityIds),
      this._preferredSeriesColors
    );
    this._syncSeriesState();
    this._renderTargetRows();
  }

  _updateSeriesRowColor(index: number | undefined, color: string | undefined) {
    const next = updateSeriesRowColor(this._seriesRows, index, color);
    if (!next) return;
    this._seriesRows = next;
    this._saveUserPreferences();
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderContent();
  }

  _updateSeriesRowVisibility(index: number | undefined, visible: unknown) {
    const next = updateSeriesRowVisibility(this._seriesRows, index, visible);
    if (!next) return;
    this._seriesRows = next;
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderContent();
  }

  /** Open (or re-render) the collapsed-sidebar target popup for *entityId*,
   *  anchored to *anchorEl*.  Wires all the same controls as the full sidebar row. */
  _showCollapsedTargetPopup(
    entityId: string,
    anchorEl: Nullable<HTMLElement> | undefined
  ) {
    const popup = this._shellEl?.getTargetPopupEl();
    if (!popup) {
      return;
    }
    const index = this._seriesRows.findIndex(
      (r: { entity_id: string }) => r.entity_id === entityId
    );
    if (index < 0) {
      this._hideCollapsedTargetPopup();
      return;
    }
    const row = this._seriesRows[index];

    // Store state for refresh after re-renders
    this._collapsedPopupEntityId = entityId;
    this._collapsedPopupAnchorEl = anchorEl ?? null;

    // Mount a target-row — replacing the old _buildSingleRowHTML + data-attribute wiring.
    popup.innerHTML = "";
    const targetRow = document.createElement("target-row") as TargetRowElement;
    targetRow.hideDragHandle = true;
    targetRow.color = row.color;
    targetRow.visible = row.visible !== false;
    targetRow.analysis = (row.analysis || {}) as RecordWithUnknownValues;
    targetRow.index = index;
    targetRow.entityId = row.entity_id;
    targetRow.stateObj = this._hass?.states?.[row.entity_id] ?? null;
    targetRow.hass = this._hass ?? null;
    targetRow.canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
    targetRow.comparisonWindows = this._comparisonWindows || [];
    targetRow.addEventListener(
      "dp-row-color-change",
      (ev: DetailEvent<{ index?: number; color?: string }>) => {
        this._updateSeriesRowColor(ev.detail?.index, ev.detail?.color);
      }
    );
    targetRow.addEventListener(
      "dp-row-visibility-change",
      (ev: DetailEvent<{ entityId?: string; visible?: boolean }>) => {
        this._updateSeriesRowVisibilityByEntityId(
          ev.detail?.entityId,
          ev.detail?.visible
        );
      }
    );
    targetRow.addEventListener(
      "dp-row-toggle-analysis",
      (ev: DetailEvent<{ entityId?: string }>) => {
        this._toggleSeriesAnalysisExpanded(ev.detail?.entityId);
      }
    );
    targetRow.addEventListener(
      "dp-row-analysis-change",
      (
        ev: DetailEvent<{ entityId?: string; key?: string; value?: unknown }>
      ) => {
        this._setSeriesAnalysisOption(
          ev.detail?.entityId,
          ev.detail?.key,
          ev.detail?.value
        );
      }
    );
    targetRow.addEventListener(
      "dp-row-copy-analysis-to-all",
      (ev: DetailEvent<{ entityId?: string; analysis?: unknown }>) => {
        const { entityId: id, analysis } = ev.detail || {};
        this._copyAnalysisToAll(id, analysis);
      }
    );
    targetRow.addEventListener(
      "dp-row-remove",
      (ev: DetailEvent<{ index?: number }>) => {
        this._hideCollapsedTargetPopup();
        this._removeSeriesRow(ev.detail?.index);
      }
    );
    popup.appendChild(targetRow);

    popup.removeAttribute("hidden");
    if (!anchorEl) {
      return;
    }
    const anchorRect = anchorEl.getBoundingClientRect();
    const pos = computePopupPosition(
      anchorRect,
      popup.offsetHeight,
      window.innerHeight
    );
    popup.style.top = `${pos.top}px`;
    popup.style.left = `${pos.left}px`;
    popup.style.maxHeight = `${pos.maxHeight}px`;

    this._collapsedPopupDismiss?.destroy();
    this._collapsedPopupDismiss = attachPopupDismissListeners(
      popup,
      anchorEl,
      () => this._hideCollapsedTargetPopup()
    );
  }

  /** Close the collapsed-sidebar target popup and clean up all listeners. */
  _hideCollapsedTargetPopup() {
    const popup = this._shellEl?.getTargetPopupEl();
    if (popup) {
      popup.setAttribute("hidden", "");
      popup.innerHTML = "";
    }
    this._collapsedPopupDismiss?.destroy();
    this._collapsedPopupDismiss = null;
    this._collapsedPopupEntityId = null;
    this._collapsedPopupAnchorEl = null;
  }

  /** Re-render the popup in-place after a state change (e.g. analysis toggle).
   *  Called at the end of _renderTargetRows so the popup stays in sync. */
  _refreshCollapsedTargetPopup() {
    if (!this._collapsedPopupEntityId) {
      return;
    }
    const row = this._seriesRows.find(
      (r: { entity_id: string }) => r.entity_id === this._collapsedPopupEntityId
    );
    if (!row) {
      this._hideCollapsedTargetPopup();
      return;
    }
    // Sync lightweight properties on the existing targetRow without rebuilding
    // the DOM — avoids flickering and preserves in-progress user interaction.
    const popup = this._shellEl?.getTargetPopupEl();
    const targetRow = popup?.querySelector(
      "target-row"
    ) as TargetRowElement | null;
    if (targetRow) {
      targetRow.analysis = row.analysis as unknown as RecordWithUnknownValues;
      targetRow.color = row.color;
      targetRow.visible = row.visible !== false;
      targetRow.stateObj = this._hass?.states?.[row.entity_id] ?? null;
      targetRow.hass = this._hass ?? null;
    }
  }

  // ── Collapsed-sidebar options popup ──────────────────────────────────────

  /** Open the collapsed-sidebar options popup, anchored to *anchorEl*. */
  _showCollapsedOptionsPopup(anchorEl: HTMLElement) {
    const popup = this._shellEl?.getOptionsPopupEl();
    if (!popup) {
      return;
    }

    this._collapsedOptionsAnchorEl = anchorEl;
    this._collapsedOptionsPopupOpen = true;
    this.requestUpdate();

    this._collapsedOptionsDismiss?.destroy();
    this._collapsedOptionsDismiss = attachPopupDismissListeners(
      popup,
      anchorEl,
      () => this._hideCollapsedOptionsPopup()
    );
  }

  /** Close the collapsed-sidebar options popup and clean up all listeners. */
  _hideCollapsedOptionsPopup() {
    this._collapsedOptionsDismiss?.destroy();
    this._collapsedOptionsDismiss = null;
    this._collapsedOptionsPopupOpen = false;
    this._collapsedOptionsAnchorEl = null;
  }

  private async _positionCollapsedOptionsPopup() {
    const shell = this._shellEl;
    const anchor = this._collapsedOptionsAnchorEl;
    if (!shell || !anchor || !this._collapsedOptionsPopupOpen) {
      return;
    }
    await shell.updateComplete;
    const menu = this.renderRoot.querySelector("collapsed-options-menu");
    await menu?.updateComplete;
    if (
      !this.isConnected ||
      this._shellEl !== shell ||
      this._collapsedOptionsAnchorEl !== anchor ||
      !this._collapsedOptionsPopupOpen
    ) {
      return;
    }
    const popup = shell.getOptionsPopupEl();
    if (!popup) {
      return;
    }
    const pos = computePopupPosition(
      anchor.getBoundingClientRect(),
      popup.offsetHeight,
      window.innerHeight
    );
    popup.style.top = `${pos.top}px`;
    popup.style.left = `${pos.left}px`;
  }

  _updateSeriesRowVisibilityByEntityId(entityId: unknown, visible: unknown) {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId) {
      return;
    }
    const index = this._seriesRows.findIndex(
      (row: { entity_id: string }) => row.entity_id === normalizedEntityId
    );
    if (index === -1) {
      return;
    }
    this._updateSeriesRowVisibility(index, visible);
  }

  _toggleSeriesAnalysisExpanded(entityId: unknown) {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId) return;
    const next = toggleSeriesAnalysisExpanded(
      this._seriesRows,
      normalizedEntityId
    );
    if (!next) return;
    this._seriesRows = next;
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
  }

  _setSeriesAnalysisOption(entityId: unknown, key: unknown, value: unknown) {
    const normalizedEntityId = String(entityId || "").trim();
    const normalizedKey = String(key || "").trim();
    if (!normalizedEntityId || !normalizedKey) return;
    if (
      normalizedKey === "anomaly_comparison_window_id" &&
      value === "__add_new__"
    ) {
      this._pendingAnomalyComparisonWindowEntityId = normalizedEntityId;
      this._openDateWindowDialog();
      return;
    }
    const index = this._seriesRows.findIndex(
      (row: { entity_id: string }) => row.entity_id === normalizedEntityId
    );
    if (index === -1) return;
    const row = this._seriesRows[index];
    const analysis = normalizeHistorySeriesAnalysis(row.analysis);
    const nextAnalysis = computeNextAnalysis(analysis, normalizedKey, value);
    if (!nextAnalysis) return;
    this._seriesRows[index] = { ...row, analysis: nextAnalysis };
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderSidebarOptions();
    this._renderContent();
  }

  _copyAnalysisToAll(sourceEntityId: unknown, sourceAnalysis: unknown) {
    const normalizedEntityId = String(sourceEntityId || "").trim();
    const next = copyAnalysisToAll(
      this._seriesRows,
      normalizedEntityId,
      sourceAnalysis
    );
    if (!next) return;
    this._seriesRows = next;
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderContent();
  }

  _removeSeriesRow(index: number | undefined) {
    const next = removeSeriesRow(this._seriesRows, index);
    if (!next) return;
    this._seriesRows = next;
    this._syncSeriesState();
    this._saveSessionState();
    this._renderTargetRows();
    this._syncControls();
    this._updateUrl({ push: true });
    this._renderContent();
  }

  _clearAllSeriesRows() {
    this._seriesRows = [];
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

  _toggleDatePickerMenu(force = false) {
    if (!force) {
      this._rangeToolbarComp?.closeMenus();
    }
  }

  _handleWindowPointerDown() {
    // Outside-click dismissal for all floating menus is now handled internally
    // by floating-menu via dp-menu-close events.
  }

  _handleDatePickerChange(ev: Event) {
    const { start, end } = extractRangeValue(
      ev as Parameters<typeof extractRangeValue>[0]
    );
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
    this._shellEl?.closePageMenu();
    await this._context.persistence.downloadSpreadsheet({
      entityIds: this._entities,
      startTime: this._startTime,
      endTime: this._endTime,
      datapointScope: this._datapointScope,
      onError: (error: unknown) => {
        logger.error(
          "[hass-datapoints panel] spreadsheet export:failed",
          error
        );
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Saved page state (persistent via HA frontend user data)
  // ---------------------------------------------------------------------------

  async _loadSavedPageIndicator() {
    await this._context.fetch.loadSavedPageIndicator({
      savedPageKey: PANEL_HISTORY_SAVED_PAGE_KEY,
      fallbackValue: null,
      onSuccess: () => {
        this._syncSavedPageMenuItems();
      },
      onError: () => {
        // Non-critical — ignore failures.
      },
    });
  }

  _syncSavedPageMenuItems() {
    this.requestUpdate();
  }

  async _savePageState() {
    if (this._savePageBusy || !this._hass) {
      return;
    }
    this._shellEl?.closePageMenu();
    await this._context.persistence.savePageState({
      savedPageKey: PANEL_HISTORY_SAVED_PAGE_KEY,
      state: buildHistoryPageSessionState(this as unknown as HistoryPageSource),
      onSuccess: () => {
        this._hasSavedPage = true;
        this._syncSavedPageMenuItems();
      },
      onError: (err: unknown) => {
        logger.error("[hass-datapoints panel] save page state failed:", err);
      },
    });
  }

  async _restorePageState() {
    if (!this._hass) {
      return;
    }
    this._shellEl?.closePageMenu();
    await this._context.persistence.restorePageState({
      savedPageKey: PANEL_HISTORY_SAVED_PAGE_KEY,
      fallbackValue: null,
      onSuccess: (saved: unknown) => {
        try {
          window.sessionStorage.setItem(
            `${DOMAIN}:panel_history_session`,
            JSON.stringify(saved)
          );
        } catch {
          // sessionStorage may be unavailable — ignore.
        }
        const baseUrl = window.location.pathname;
        window.history.replaceState(null, "", baseUrl);
        window.location.reload();
      },
      onError: (err: unknown) => {
        logger.error("[hass-datapoints panel] restore page state failed:", err);
      },
    });
  }

  async _clearSavedPageState() {
    if (!this._hass) {
      return;
    }
    this._shellEl?.closePageMenu();
    await this._context.persistence.clearSavedPageState({
      savedPageKey: PANEL_HISTORY_SAVED_PAGE_KEY,
      onSuccess: () => {
        this._hasSavedPage = false;
        this._syncSavedPageMenuItems();
      },
      onError: (err: unknown) => {
        logger.error(
          "[hass-datapoints panel] clear saved page state failed:",
          err
        );
      },
    });
  }

  _getEffectiveZoomLevel() {
    if (this._zoomLevel !== "auto") {
      return this._zoomLevel;
    }
    if (!this._resolvedAutoZoomLevel) {
      const referenceSpanMs = Math.max(
        (this._endTime?.getTime() || Date.now()) -
          (this._startTime?.getTime() || Date.now() - RANGE_SLIDER_WINDOW_MS),
        RANGE_SLIDER_MIN_SPAN_MS
      );
      this._resolvedAutoZoomLevel =
        this._computeZoomLevelForSpan(referenceSpanMs);
    }
    return this._resolvedAutoZoomLevel;
  }

  _getZoomConfig() {
    return (
      RANGE_ZOOM_CONFIGS[this._getEffectiveZoomLevel()] ||
      RANGE_ZOOM_CONFIGS.month_short
    );
  }

  _computeZoomLevelForSpan(spanMs: number) {
    return computeZoomLevelForSpan(spanMs);
  }

  _getEffectiveSnapUnit() {
    return getEffectiveSnapUnit(
      this._getEffectiveZoomLevel(),
      this._dateSnapping
    );
  }

  _getSnapSpanMs(reference = this._startTime || new Date()) {
    const snapUnit = this._getEffectiveSnapUnit() as RangeUnit;
    return getSnapSpanMs(snapUnit, reference);
  }

  _deriveRangeBounds() {
    const config = this._getZoomConfig();
    const startMs = this._startTime?.getTime() || Date.now() - 24 * HOUR_MS;
    const endMs = this._endTime?.getTime() || Date.now();
    return deriveRangeBounds(
      config,
      startMs,
      endMs,
      this._historyStartTime?.getTime(),
      this._historyEndTime?.getTime(),
      this._getSnapSpanMs(this._startTime || new Date())
    );
  }

  _updateComparisonRangePreview() {
    this.requestUpdate();
  }

  _getComparisonRangePreview() {
    const comparisonWindow = this._getActiveComparisonWindow();
    if (!this._rangeBounds || !comparisonWindow) {
      return null;
    }
    const start = new Date(comparisonWindow.start_time).getTime();
    const end = new Date(comparisonWindow.end_time).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      return null;
    }
    return { start, end };
  }

  _handleChartHover(ev: DetailEvent<{ timeMs?: Nullable<number> }>) {
    this._chartHoverTimeMs = ev?.detail?.timeMs ?? null;
    this._updateChartHoverIndicator();
  }

  _handleChartZoom(
    ev: DetailEvent<{
      startTime?: number;
      endTime?: number;
      preview?: boolean;
      source?: string;
    }>
  ) {
    const detail = ev.detail;
    const start = Number.isFinite(detail?.startTime)
      ? (detail?.startTime ?? null)
      : null;
    const end = Number.isFinite(detail?.endTime)
      ? (detail?.endTime ?? null)
      : null;
    const isPreview = !!detail?.preview;
    const source = detail?.source || "select";
    const nextRange =
      start != null && end != null && start < end ? { start, end } : null;
    if (isPreview) {
      this._chartZoomRange = nextRange;
    } else {
      this._chartZoomRange = nextRange;
      this._chartZoomCommittedRange = nextRange ? { ...nextRange } : null;
      if (this._hoveredComparisonWindowId) {
        this._hoveredComparisonWindowId = null;
      }
      if (source === "scroll") {
        this._scheduleChartZoomStateCommit();
      } else {
        this._saveSessionState();
        this._updateUrl({ push: false });
        // The list zoom config is pushed from updated() — the reactive
        // _chartZoomCommittedRange change above schedules that render.
      }
    }
    this._updateChartZoomHighlight();
    if (!isPreview && source !== "scroll") {
      this._renderComparisonTabs();
    }
    if (!nextRange) {
      this._rangeToolbarComp?.revealSelection?.();
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
    }, 180);
  }

  /** Push the current zoom window into the list card (keyed; no-op if unchanged). */
  private _applyListZoomConfig() {
    if (!this._listEl) {
      return;
    }
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

  _handleRecordsSearch(ev: DetailEvent<{ query?: string }>) {
    const nextQuery = String(ev?.detail?.query || "")
      .trim()
      .toLowerCase();
    if (nextQuery === this._recordsSearchQuery) {
      return;
    }
    this._recordsSearchQuery = nextQuery;
    this._renderContent();
  }

  _handleToggleEventVisibility(ev: DetailEvent<{ eventId?: string }>) {
    const eventId = ev?.detail?.eventId;
    if (!eventId) {
      return;
    }
    const wasPreviouslyHidden = this._hiddenEventIds.includes(eventId);
    if (wasPreviouslyHidden) {
      this._hiddenEventIds = this._hiddenEventIds.filter(
        (id: string) => id !== eventId
      );
    } else {
      this._hiddenEventIds = [...this._hiddenEventIds, eventId];
    }
    this._renderContent();
  }

  _handleHoverEventRecord(
    ev: DetailEvent<{ eventId?: string; hovered?: boolean }>
  ) {
    const eventId = String(ev?.detail?.eventId || "").trim();
    if (!eventId) {
      return;
    }
    const hovered = ev?.detail?.hovered === true;
    const alreadyHovered = this._hoveredEventIds.includes(eventId);
    if (hovered && alreadyHovered) {
      return;
    }
    if (!hovered && !alreadyHovered) {
      return;
    }
    this._hoveredEventIds = hovered ? [eventId] : [];
    this._renderContent();
  }

  _handleToggleSeriesVisibility(
    ev: DetailEvent<{ entityId?: string; visible?: boolean }>
  ) {
    const entityId = String(ev?.detail?.entityId || "").trim();
    const visible = ev?.detail?.visible;
    if (!entityId || typeof visible !== "boolean") {
      return;
    }
    const index = this._seriesRows.findIndex(
      (row: { entity_id: string; visible?: boolean }) =>
        row.entity_id === entityId
    );
    if (index === -1 || this._seriesRows[index].visible === visible) {
      return;
    }
    this._seriesRows[index] = { ...this._seriesRows[index], visible };
    this._saveSessionState();
    this._updateUrl({ push: false });
    this._renderTargetRows();
    this._renderContent();
  }

  _updateChartHoverIndicator() {
    this.requestUpdate();
  }

  _getChartHoverWindowTimeMs() {
    if (
      !this._rangeBounds ||
      this._chartHoverTimeMs == null ||
      !this._startTime
    ) {
      return null;
    }
    const activeWindow = this._getActiveComparisonWindow();
    if (!activeWindow) {
      return null;
    }
    return (
      this._chartHoverTimeMs +
      new Date(activeWindow.start_time).getTime() -
      this._startTime.getTime()
    );
  }

  _updateChartZoomHighlight() {
    this.requestUpdate();
  }

  _getChartZoomHighlightRange() {
    const highlightRange =
      this._chartZoomRange || this._chartZoomCommittedRange;
    return this._rangeBounds && highlightRange
      ? { start: +highlightRange.start, end: +highlightRange.end }
      : null;
  }

  _getZoomWindowHighlightRange() {
    const activeWindow = this._getActiveComparisonWindow();
    const zoomRange = this._chartZoomRange || this._chartZoomCommittedRange;
    if (!this._rangeBounds || !activeWindow || !zoomRange || !this._startTime) {
      return null;
    }
    const windowStartMs = new Date(activeWindow.start_time).getTime();
    const windowEndMs = new Date(activeWindow.end_time).getTime();
    if (
      !Number.isFinite(windowStartMs) ||
      !Number.isFinite(windowEndMs) ||
      windowStartMs >= windowEndMs
    ) {
      return null;
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
      return null;
    }
    return {
      start: intersectStart,
      end: intersectEnd,
    };
  }

  _scheduleAutoZoomUpdate(
    draftStart?: Nullable<Date>,
    draftEnd?: Nullable<Date>
  ) {
    if (this._zoomLevel !== "auto" || !this._rangeBounds) {
      return;
    }
    const start = draftStart || this._startTime;
    const end = draftEnd || this._endTime;
    if (!start || !end || start >= end) {
      return;
    }

    const currentLevel = this._getEffectiveZoomLevel();
    const selectionSpanMs = Math.max(
      end.getTime() - start.getTime(),
      RANGE_SLIDER_MIN_SPAN_MS
    );
    const paddedSelectionSpanMs = Math.max(
      selectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
      RANGE_SLIDER_MIN_SPAN_MS
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
      if (
        !latestStart ||
        !latestEnd ||
        latestStart >= latestEnd ||
        this._zoomLevel !== "auto" ||
        !this._rangeBounds
      ) {
        return;
      }

      const latestLevel = this._getEffectiveZoomLevel();
      const latestSelectionSpanMs = Math.max(
        latestEnd.getTime() - latestStart.getTime(),
        RANGE_SLIDER_MIN_SPAN_MS
      );
      const latestPaddedSelectionSpanMs = Math.max(
        latestSelectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
        RANGE_SLIDER_MIN_SPAN_MS
      );
      const latestCandidateLevel = this._computeZoomLevelForSpan(
        latestPaddedSelectionSpanMs
      );

      if (latestCandidateLevel === latestLevel) {
        return;
      }
      this._resolvedAutoZoomLevel = latestCandidateLevel;
      this.requestUpdate();
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

  /** Called whenever a new annotation is recorded (HA event or window event).
   *  If the current range is on the live edge, advance the end time to now
   *  so the chart immediately shows the new data point. */
  _handleEventRecorded() {
    if (!this._isOnLiveEdge() || !this._startTime) {
      return;
    }
    this._applyCommittedRange(this._startTime, new Date(), { push: false });
  }

  _applyCommittedRange(
    start: Nullable<Date> | undefined,
    end: Nullable<Date> | undefined,
    { push = false }: { push?: boolean } = {}
  ) {
    if (!start || !end || start >= end) {
      return;
    }
    const nextStart = new Date(start);
    const nextEnd = new Date(end);
    const didChange =
      !this._startTime ||
      !this._endTime ||
      this._startTime.getTime() !== nextStart.getTime() ||
      this._endTime.getTime() !== nextEnd.getTime();

    this._startTime = nextStart;
    this._endTime = nextEnd;
    this._hours = Math.max(
      1,
      Math.round((nextEnd.getTime() - nextStart.getTime()) / HOUR_MS)
    );
    this._scheduleAutoZoomUpdate(undefined, undefined);
    // _syncControls() below requests the update that refreshes the live-edge
    // handle (bound declaratively on <range-toolbar>).
    this._syncControls();
    this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
    if (!didChange) {
      return;
    }
    this._saveSessionState();
    this._updateUrl({ push });
    this._renderContent();
  }

  _commitRangeSelection({ push = false } = {}) {
    if (this._rangeCommitTimer) {
      window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = null;
    }
    if (
      !this._draftStartTime ||
      !this._draftEndTime ||
      this._draftStartTime >= this._draftEndTime
    ) {
      return;
    }
    this._applyCommittedRange(this._draftStartTime, this._draftEndTime, {
      push,
    });
  }

  _updateUrl({ push = false }: { push?: boolean } = {}) {
    this._context.navigation.updateUrl({
      entities: this._entities,
      datapointScope: this._datapointScope,
      startTime: this._startTime,
      endTime: this._endTime,
      hours: this._hours,
      committedZoomRange: this._chartZoomCommittedRange,
      comparisonWindows: this._comparisonWindows,
      pageState: buildHistoryPageSessionState(
        this as unknown as HistoryPageSource
      ),
      seriesRows: this._seriesRows,
      seriesColorQueryKey: (entityId: string) =>
        this._seriesColorQueryKey(entityId),
      push,
    });
  }

  _renderComparisonTabs() {
    this.requestUpdate();
  }

  private _comparisonTabsTemplate() {
    if (!this._startTime || !this._endTime) {
      return nothing;
    }
    const tabs = [
      {
        id: "current-range",
        label: msg("Selected range"),
        detail: this._formatComparisonLabel(this._startTime, this._endTime),
        active: this._selectedComparisonWindowId == null,
        editable: false,
      },
      ...this._comparisonWindows.map((window) => ({
        ...window,
        detail: this._formatComparisonLabel(
          new Date(window.start_time),
          new Date(window.end_time)
        ),
        active: window.id === this._selectedComparisonWindowId,
        editable: true,
      })),
    ];
    return html`
      <comparison-tab-rail
        .tabs=${tabs}
        .loadingIds=${this._loadingComparisonWindowIds}
        .hoveredId=${this._hoveredComparisonWindowId || ""}
        @dp-tab-activate=${(ev: CustomEvent<{ tabId: Nullable<string> }>) =>
          this._handleComparisonTabActivate(ev.detail.tabId)}
        @dp-tab-hover=${(ev: CustomEvent<{ tabId: Nullable<string> }>) =>
          this._handleComparisonTabHover(ev.detail.tabId)}
        @dp-tab-leave=${(ev: CustomEvent<{ tabId: Nullable<string> }>) =>
          this._handleComparisonTabLeave(ev.detail.tabId)}
        @dp-tab-edit=${(ev: CustomEvent<{ tabId: Nullable<string> }>) => {
          const window = this._comparisonWindows.find(
            (entry) => entry.id === ev.detail.tabId
          );
          if (window) {
            this._openDateWindowDialog(window);
          }
        }}
        @dp-tab-delete=${(ev: CustomEvent<{ tabId: Nullable<string> }>) => {
          if (ev.detail.tabId) {
            this._deleteDateWindow(ev.detail.tabId);
          }
        }}
        @dp-tab-add=${() => this._openDateWindowDialog()}
      ></comparison-tab-rail>
    `;
  }

  private async _renderComparisonTabSlot() {
    const chart = this._chartEl;
    if (!chart) {
      if (this._comparisonTabsRoot) {
        renderInto(nothing, this._comparisonTabsRoot);
        this._comparisonTabsRoot = null;
      }
      return;
    }
    await chart.updateComplete;
    if (!this.isConnected || chart !== this._chartEl) {
      return;
    }
    const host = chart.getComparisonTabsHost();
    if (!host) {
      return;
    }
    if (this._comparisonTabsRoot && this._comparisonTabsRoot !== host) {
      renderInto(nothing, this._comparisonTabsRoot);
    }
    this._comparisonTabsRoot = host;
    host.hidden = !this._startTime || !this._endTime;
    // The chart remains imperative until #35; Lit owns just this existing slot.
    renderInto(this._comparisonTabsTemplate(), host);
  }

  _updateComparisonTabsOverflow() {
    this._context.orchestration.updateComparisonTabsOverflow(this._chartEl);
  }

  _renderContent() {
    const content = this._contentHostEl;
    if (!content) {
      logger.warn("[dp-lifecycle] _renderContent: aborted — no contentHostEl", {
        rendered: this._rendered,
        shellBuilt: this._shellBuilt,
        entityCount: this._entities?.length ?? 0,
      });
      return;
    }

    // Monitors panel overlay — replaces normal content area when active
    if (this._showMonitorsPanel) {
      this._contentKey = "__monitors__";
      this._chartEl = null;
      this._listEl = null;
      content.innerHTML = "";
      const panel = document.createElement(
        "anomaly-monitors-panel"
      ) as HTMLElement & {
        hass: unknown;
      };
      panel.hass = this._hass;
      panel.addEventListener("dp-monitors-panel-close", () => {
        this._showMonitorsPanel = false;
        this._contentKey = "";
        this._renderContent();
      });
      panel.addEventListener("dp-monitors-panel-new", () => {
        this._openMonitorWizard([], null);
      });
      content.appendChild(panel);
      return;
    }

    // Clear monitors panel sentinel when returning to normal content
    if (this._contentKey === "__monitors__") {
      this._contentKey = "";
    }

    if (!this._entities.length) {
      // Guard: if the empty-state card is already shown there's nothing to do.
      if (this._contentKey === "__empty__") {
        return;
      }
      logger.warn(
        "[dp-lifecycle] _renderContent: rendering empty state (no entities)"
      );
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
      // Use a sentinel so subsequent calls (e.g. on every hass update) know
      // the empty state is already rendered and bail out immediately above.
      this._contentKey = "__empty__";
      this._chartEl = null;
      this._historyChartMol = null;
      this._listEl = null;
      this._chartConfigKey = "";
      this._listConfigKey = "";
      return;
    }

    const contentKey = JSON.stringify({
      entities: this._entities,
      series_entity_ids: this._seriesRows.map(
        (row: { entity_id: string }) => row.entity_id
      ),
      datapoint_scope: this._datapointScope,
      start: this._startTime?.toISOString() || null,
      end: this._endTime?.toISOString() || null,
      hours: this._hours,
    });

    const showRecordsPanel = this._datapointScope !== "hidden";
    const chartMounted = !!(
      this._chartEl &&
      this._chartEl.isConnected &&
      content.contains(this._chartEl)
    );
    const listMounted =
      !showRecordsPanel ||
      !!(
        this._listEl &&
        this._listEl.isConnected &&
        content.contains(this._listEl)
      );

    logger.warn("[dp-lifecycle] _renderContent: key check", {
      keyMatch: this._contentKey === contentKey,
      chartMounted,
      listMounted,
      hasChartEl: !!this._chartEl,
      chartElConnected: this._chartEl?.isConnected,
      contentContainsChart: this._chartEl
        ? content.contains(this._chartEl)
        : false,
      entityCount: this._entities.length,
    });

    if (this._contentKey !== contentKey || !chartMounted || !listMounted) {
      this._chartHoverTimeMs = null;
      this._updateChartHoverIndicator();
      this._chartZoomRange = null;
      this._updateChartZoomHighlight();
      this._hoveredEventIds = [];
      // Reset the records search filter so the new list card and chart start
      // in sync — the list card always renders with an empty search field when
      // newly created, so we must clear our cached query to match.
      this._recordsSearchQuery = "";
      content.innerHTML = `
        <resizable-panes
          id="content-resizable-panes"
          direction="vertical"
          style="height:100%;min-height:0;"
        >
          <div slot="first" id="chart-host" class="chart-host">
            <div id="chart-card-host" class="chart-card-host"></div>
          </div>
          <div slot="second" id="list-host" class="list-host"></div>
        </resizable-panes>
      `;

      const chartConfig = {
        entities: this._entities,
        series_settings: this._seriesRows.map((row) => ({
          ...row,
          analysis: {
            ...(row.analysis || {}),
            anomaly_overlap_mode: this._chartAnomalyOverlapMode,
          },
        })),
        datapoint_scope: this._datapointScope,
        show_event_markers: this._showChartDatapointIcons,
        show_event_lines: this._showChartDatapointLines,
        show_tooltips: this._showChartTooltips,
        emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
        hover_snap_mode: this._chartHoverSnapMode,
        show_correlated_anomalies: this._showCorrelatedAnomalies,
        anomaly_overlap_mode: this._chartAnomalyOverlapMode,
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
        hovered_event_ids: this._hoveredEventIds,
        comparison_windows: this._getPreviewComparisonWindows(),
        preload_comparison_windows: this._getPreloadComparisonWindows(),
        comparison_preview_overlay: this._getComparisonPreviewOverlay(),
        comparison_hover_active: !!this._hoveredComparisonWindowId,
        selected_comparison_window_id: this._selectedComparisonWindowId,
        hovered_comparison_window_id: this._hoveredComparisonWindowId,
      };
      // Create the chart card directly to avoid any extra DOM wrapping that could
      // disrupt HA's tooltip element hierarchy (getElementById lookups).
      const chart = document.createElement(
        "hass-datapoints-history-card"
      ) as HistoryCardElement;
      chart.setConfig(chartConfig);
      (content.querySelector("#chart-card-host") as HTMLElement).appendChild(
        chart
      );
      // Use history-chart as a pure JS config-diffing controller — not a DOM wrapper.
      const historyChartMol = {
        _configKey: JSON.stringify(chartConfig),
        chartEl: chart,
      };
      this._historyChartMol = historyChartMol;
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
        const list = document.createElement(
          "hass-datapoints-list-card"
        ) as ListCardElement;
        list.setConfig(listConfig);
        (content.querySelector("#list-host") as HTMLElement).appendChild(list);
        this._listEl = list;
      } else {
        this._listEl = null;
      }
      // Wire the resizable-panes atom for the content split ratio.
      const resizablePanes = content.querySelector(
        "#content-resizable-panes"
      ) as Nullable<ResizablePanesElement>;
      this._contentSplitterEl = resizablePanes; // kept for legacy _applyContentSplitLayout reference
      if (resizablePanes) {
        resizablePanes.ratio = this._contentSplitRatio;
        resizablePanes.min = 0.2;
        resizablePanes.max = 0.8;
        resizablePanes.addEventListener(
          "dp-panes-resize",
          (ev: DetailEvent<{ ratio?: number; committed?: boolean }>) => {
            this._contentSplitRatio =
              ev.detail?.ratio ?? this._contentSplitRatio;
            this._requestChartResizeRedraw();
            if (ev.detail?.committed) {
              this._saveSessionState();
              window.requestAnimationFrame(() => this.requestUpdate());
            }
          }
        );
      }
      this._chartEl = chart;
      this._historyChartMol = historyChartMol;
      this._contentKey = contentKey;
      this._chartConfigKey = "";
      this._listConfigKey = "";
      logger.warn("[dp-lifecycle] _renderContent: full render complete", {
        entityCount: this._entities.length,
      });
    }

    content.classList.toggle("datapoints-hidden", !showRecordsPanel);
    const resizablePanesEl = content.querySelector(
      "#content-resizable-panes"
    ) as Nullable<ResizablePanesElement>;
    if (resizablePanesEl) {
      resizablePanesEl.secondHidden = !showRecordsPanel;
    }
    this._applyContentSplitLayout();
    this._renderComparisonTabs();
    const chartConfig = {
      entities: this._entities,
      series_settings: this._seriesRows.map((row) => ({
        ...row,
        analysis: {
          ...(row.analysis || {}),
          anomaly_overlap_mode: this._chartAnomalyOverlapMode,
        },
      })),
      datapoint_scope: this._datapointScope,
      show_event_markers: this._showChartDatapointIcons,
      show_event_lines: this._showChartDatapointLines,
      show_tooltips: this._showChartTooltips,
      emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
      hover_snap_mode: this._chartHoverSnapMode,
      show_correlated_anomalies: this._showCorrelatedAnomalies,
      anomaly_overlap_mode: this._chartAnomalyOverlapMode,
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
      hovered_event_ids: this._hoveredEventIds,
      comparison_windows: this._getPreviewComparisonWindows(),
      preload_comparison_windows: this._getPreloadComparisonWindows(),
      comparison_preview_overlay: this._getComparisonPreviewOverlay(),
      comparison_hover_active: !!this._hoveredComparisonWindowId,
      selected_comparison_window_id: this._selectedComparisonWindowId,
      hovered_comparison_window_id: this._hoveredComparisonWindowId,
    };
    // Use the config-diffing controller to avoid unnecessary setConfig calls.
    if (this._chartEl) {
      const nextChartConfigKey = JSON.stringify(chartConfig);
      const molKey = this._historyChartMol?._configKey;
      const prevKey = molKey !== undefined ? molKey : this._chartConfigKey;
      if (prevKey !== nextChartConfigKey) {
        this._chartEl.setConfig(chartConfig);
        if (this._historyChartMol) {
          this._historyChartMol._configKey = nextChartConfigKey;
        } else {
          this._chartConfigKey = nextChartConfigKey;
        }
      }
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
      if (this._listEl) {
        this._listEl.hass = this._hass;
      }
    } else {
      this._listConfigKey = "";
    }
    if (this._chartEl) {
      this._chartEl.hass = this._hass;
    }
    this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
  }
}
