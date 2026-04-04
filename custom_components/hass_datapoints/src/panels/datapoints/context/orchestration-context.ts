import type { HistoryOrchestrationContext } from "./types";

function getInnerHistoryChart(chartEl: HTMLElement | null): HTMLElement | null {
  if (!chartEl?.shadowRoot) {
    return null;
  }

  return (
    chartEl.shadowRoot.querySelector?.("hass-datapoints-history-chart") ??
    chartEl.shadowRoot.querySelector?.("dp-history-chart") ??
    chartEl.shadowRoot.querySelector?.("history-chart") ??
    null
  );
}

function getComparisonTabsHost(
  chartEl: HTMLElement | null
): HTMLElement | null {
  const innerChart = getInnerHistoryChart(chartEl);
  return innerChart?.querySelector?.("#chart-top-slot") ?? null;
}

export function createHistoryPageOrchestrationContext(): HistoryOrchestrationContext {
  let chartResizeRaf: number | null = null;

  return {
    requestChartResizeRedraw(chartEl: HTMLElement | null): void {
      if (chartResizeRaf != null) {
        return;
      }

      let ranSynchronously = false;
      const rafId = window.requestAnimationFrame(() => {
        ranSynchronously = true;
        chartResizeRaf = null;
        if (!chartEl) {
          return;
        }
        if (
          Array.isArray(
            (chartEl as { _lastDrawArgs?: unknown[] })._lastDrawArgs
          ) &&
          (chartEl as { _lastDrawArgs?: unknown[] })._lastDrawArgs!.length >
            0 &&
          typeof (chartEl as { _drawChart?: (...args: unknown[]) => void })
            ._drawChart === "function"
        ) {
          (
            chartEl as {
              _drawChart: (...args: unknown[]) => void;
              _lastDrawArgs: unknown[];
            }
          )._drawChart(
            ...(
              chartEl as {
                _drawChart: (...args: unknown[]) => void;
                _lastDrawArgs: unknown[];
              }
            )._lastDrawArgs
          );
          return;
        }

        const innerChart = getInnerHistoryChart(chartEl);
        if (
          innerChart &&
          Array.isArray(
            (innerChart as { _lastDrawArgs?: unknown[] })._lastDrawArgs
          ) &&
          (innerChart as { _lastDrawArgs?: unknown[] })._lastDrawArgs!.length >
            0
        ) {
          if (
            typeof (
              innerChart as { _queueDrawChart?: (...args: unknown[]) => void }
            )._queueDrawChart === "function"
          ) {
            (
              innerChart as {
                _queueDrawChart: (...args: unknown[]) => void;
                _lastDrawArgs: unknown[];
              }
            )._queueDrawChart(
              ...(
                innerChart as {
                  _queueDrawChart: (...args: unknown[]) => void;
                  _lastDrawArgs: unknown[];
                }
              )._lastDrawArgs
            );
            return;
          }

          if (
            typeof (innerChart as { _drawChart?: (...args: unknown[]) => void })
              ._drawChart === "function"
          ) {
            (
              innerChart as {
                _drawChart: (...args: unknown[]) => void;
                _lastDrawArgs: unknown[];
              }
            )._drawChart(
              ...(
                innerChart as {
                  _drawChart: (...args: unknown[]) => void;
                  _lastDrawArgs: unknown[];
                }
              )._lastDrawArgs
            );
          }
        }
      });

      chartResizeRaf = ranSynchronously ? null : rafId;
    },

    cancelChartResizeRedraw(): void {
      if (chartResizeRaf != null) {
        window.cancelAnimationFrame(chartResizeRaf);
        chartResizeRaf = null;
      }
    },

    openTargetPicker(targetControl: HTMLElement | null): void {
      if (!targetControl) {
        return;
      }

      const genericPicker =
        targetControl.shadowRoot?.querySelector?.("ha-generic-picker") ?? null;
      if (genericPicker && typeof genericPicker.open === "function") {
        genericPicker.open();
        return;
      }
      if (
        typeof (targetControl as { focus?: () => void }).focus === "function"
      ) {
        (targetControl as { focus: () => void }).focus();
      }
      if (
        typeof (targetControl as { click?: () => void }).click === "function"
      ) {
        (targetControl as { click: () => void }).click();
      }
    },

    renderComparisonTabs(options) {
      const tabsEl = getComparisonTabsHost(options.chartEl);
      if (!tabsEl || !options.startTime || !options.endTime) {
        return {
          comparisonTabRailComp: options.comparisonTabRailComp,
          comparisonTabsHostEl: options.comparisonTabsHostEl,
        };
      }

      const activeComparisonWindowId =
        options.selectedComparisonWindowId || null;
      const currentTab =
        options.startTime && options.endTime
          ? {
              id: "current-range",
              label: "Selected range",
              detail: options.formatComparisonLabel(
                options.startTime,
                options.endTime
              ),
              active: activeComparisonWindowId == null,
              editable: false,
            }
          : null;
      const tabs = [
        ...(currentTab ? [currentTab] : []),
        ...options.comparisonWindows.map((window) => ({
          ...window,
          detail: options.formatComparisonLabel(
            new Date(window.start_time),
            new Date(window.end_time)
          ),
          active: window.id === activeComparisonWindowId,
          editable: true,
        })),
      ];
      tabsEl.hidden = false;

      let comparisonTabRailComp = options.comparisonTabRailComp;
      let comparisonTabsHostEl = options.comparisonTabsHostEl;

      if (!comparisonTabRailComp || comparisonTabsHostEl !== tabsEl) {
        tabsEl.innerHTML = "";
        const rail = document.createElement("comparison-tab-rail");
        rail.addEventListener("dp-tab-activate", (ev) =>
          options.onActivate((ev as CustomEvent).detail.tabId)
        );
        rail.addEventListener("dp-tab-hover", (ev) =>
          options.onHover((ev as CustomEvent).detail.tabId)
        );
        rail.addEventListener("dp-tab-leave", (ev) =>
          options.onLeave((ev as CustomEvent).detail.tabId)
        );
        rail.addEventListener("dp-tab-edit", (ev) =>
          options.onEdit((ev as CustomEvent).detail.tabId)
        );
        rail.addEventListener("dp-tab-delete", (ev) =>
          options.onDelete((ev as CustomEvent).detail.tabId)
        );
        rail.addEventListener("dp-tab-add", () => options.onAdd());
        tabsEl.appendChild(rail);
        comparisonTabRailComp = rail;
        comparisonTabsHostEl = tabsEl;
      }

      (
        comparisonTabRailComp as unknown as {
          tabs: unknown[];
          loadingIds: string[];
          hoveredId: string;
        }
      ).tabs = tabs;
      (
        comparisonTabRailComp as unknown as {
          tabs: unknown[];
          loadingIds: string[];
          hoveredId: string;
        }
      ).loadingIds = [...options.loadingComparisonWindowIds];
      (
        comparisonTabRailComp as unknown as {
          tabs: unknown[];
          loadingIds: string[];
          hoveredId: string;
        }
      ).hoveredId = options.hoveredComparisonWindowId || "";

      return {
        comparisonTabRailComp,
        comparisonTabsHostEl,
      };
    },

    updateComparisonTabsOverflow(chartEl: HTMLElement | null): void {
      window.requestAnimationFrame(() => {
        const innerChart = getInnerHistoryChart(chartEl);
        const shell = innerChart?.querySelector?.("#chart-tabs-shell") ?? null;
        const rail = innerChart?.querySelector?.("#chart-tabs-rail") ?? null;
        if (!shell || !rail) {
          return;
        }
        shell.classList.toggle(
          "overflowing",
          rail.scrollWidth > rail.clientWidth + 4
        );
      });
    },

    handleComparisonTabHover(options): void {
      if (!options.id || options.hoveredComparisonWindowId === options.id) {
        return;
      }
      options.setHoveredComparisonWindowId(options.id);
      options.updateComparisonRangePreview();
      options.updateChartHoverIndicator();
      options.renderContent();
    },

    handleComparisonTabLeave(options): void {
      if (!options.id || options.hoveredComparisonWindowId !== options.id) {
        return;
      }
      options.setHoveredComparisonWindowId(null);
      options.updateComparisonRangePreview();
      options.updateChartHoverIndicator();
      options.renderContent();
    },

    handleComparisonTabActivate(options): void {
      if (!options.id || options.id === "current-range") {
        options.setSelectedComparisonWindowId(null);
        options.setHoveredComparisonWindowId(null);
        options.clearDeltaAnalysisSelectionState();
        options.updateComparisonRangePreview();
        options.renderComparisonTabs();
        options.setAdjustComparisonAxisScale(false);
        options.renderContent();
        return;
      }

      const targetWindow = options.comparisonWindows.find(
        (window) => window.id === options.id
      );
      if (!targetWindow) {
        return;
      }

      const nextSelectedWindowId =
        options.selectedComparisonWindowId === options.id ? null : options.id;
      options.setSelectedComparisonWindowId(nextSelectedWindowId);
      if (!nextSelectedWindowId) {
        options.clearDeltaAnalysisSelectionState();
      }
      options.updateComparisonRangePreview();
      options.updateChartHoverIndicator();
      options.renderContent();
    },
  };
}
