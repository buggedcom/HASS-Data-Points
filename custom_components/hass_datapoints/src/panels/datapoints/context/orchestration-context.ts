import type { HistoryOrchestrationContext } from "./types";
import { resolveTargetPickerWidthPx } from "@/lib/ui/target-picker-width";

/**
 * Public seam the history card exposes so the panel orchestration can drive the
 * chart without reaching through the card's shadow root into the inner chart.
 */
type ChartCardLike = HTMLElement & {
  requestResizeRedraw?: () => void;
  getComparisonTabsHost?: () => Nullable<HTMLElement>;
  updateComparisonTabsOverflow?: () => void;
};

type PickerLike = Element & { open?: () => void };

/**
 * Floats the slotted target picker as a fixed-position popover anchored next to
 * `anchorEl`, at the shared target-picker width (see `target-picker-width`).
 *
 * This runs for both the collapsed sidebar (anchored to the "+" icon button)
 * and the expanded sidebar (anchored to the inline "Add target" button). In
 * both cases the picker must escape the sidebar's `overflow-x: hidden` scroll
 * clip, so its width is driven by {@link resolveTargetPickerWidthPx}, never by
 * the anchor or the sidebar column (issue #89). The actual picker UI is the
 * generic picker's own top-layer overlay, which inherits this width; the
 * floated host itself stays invisible (`opacity: 0`, `pointer-events: none`).
 *
 * Re-applied on every open so it is idempotent and repositions from a fresh
 * anchor rect.
 */
function floatTargetPickerAnchor(
  targetControl: HTMLElement,
  anchorEl: Nullable<HTMLElement> | undefined
): void {
  const assignedSlot =
    (
      targetControl as HTMLElement & {
        assignedSlot?: Nullable<HTMLSlotElement>;
      }
    ).assignedSlot ?? null;
  if (!assignedSlot) {
    return;
  }

  const slotContainer =
    assignedSlot.parentElement instanceof HTMLElement
      ? assignedSlot.parentElement
      : null;
  const hiddenAnchorHost: HTMLElement = slotContainer ?? assignedSlot;

  const anchorRect = anchorEl?.getBoundingClientRect();
  const popupWidth = resolveTargetPickerWidthPx();
  const viewportPadding = 8;
  const left = Math.max(
    viewportPadding,
    Math.min(
      Math.round(anchorRect?.left ?? 0),
      window.innerWidth - popupWidth - viewportPadding
    )
  );
  const top = Math.round(anchorRect?.top ?? 0);
  const width = popupWidth;
  const height = Math.max(1, Math.round(anchorRect?.height ?? 1));

  hiddenAnchorHost.style.display = "block";
  hiddenAnchorHost.style.position = "fixed";
  hiddenAnchorHost.style.left = `${left}px`;
  hiddenAnchorHost.style.top = `${top}px`;
  hiddenAnchorHost.style.width = `${width}px`;
  hiddenAnchorHost.style.height = `${height}px`;
  hiddenAnchorHost.style.margin = "0";
  hiddenAnchorHost.style.padding = "0";
  hiddenAnchorHost.style.opacity = "0";
  hiddenAnchorHost.style.pointerEvents = "none";
  hiddenAnchorHost.style.overflow = "visible";
  hiddenAnchorHost.style.zIndex = "2147483647";

  targetControl.style.display = "block";
  targetControl.style.width = `${width}px`;
  targetControl.style.height = `${height}px`;
  targetControl.style.opacity = "0";
  targetControl.style.pointerEvents = "none";
}

export function createHistoryPageOrchestrationContext(): HistoryOrchestrationContext {
  let chartResizeRaf: Nullable<number> = null;

  return {
    requestChartResizeRedraw(chartEl: Nullable<HTMLElement>): void {
      if (chartResizeRaf != null) {
        return;
      }

      let ranSynchronously = false;
      const rafId = window.requestAnimationFrame(() => {
        ranSynchronously = true;
        chartResizeRaf = null;
        (chartEl as Nullable<ChartCardLike>)?.requestResizeRedraw?.();
      });

      chartResizeRaf = ranSynchronously ? null : rafId;
    },

    cancelChartResizeRedraw(): void {
      if (chartResizeRaf != null) {
        window.cancelAnimationFrame(chartResizeRaf);
        chartResizeRaf = null;
      }
    },

    openTargetPicker(
      targetControl: Nullable<HTMLElement>,
      anchorEl?: Nullable<HTMLElement>
    ): void {
      if (!targetControl) {
        return;
      }

      floatTargetPickerAnchor(targetControl, anchorEl);

      const genericPicker =
        (targetControl.shadowRoot?.querySelector?.(
          "ha-generic-picker"
        ) as Nullable<PickerLike>) ?? null;
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
      const tabsEl =
        (
          options.chartEl as Nullable<ChartCardLike>
        )?.getComparisonTabsHost?.() ?? null;
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

    updateComparisonTabsOverflow(chartEl: Nullable<HTMLElement>): void {
      window.requestAnimationFrame(() => {
        (chartEl as Nullable<ChartCardLike>)?.updateComparisonTabsOverflow?.();
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
