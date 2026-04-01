import { LitElement, html } from "lit";
import { styles } from "./dp-panel-timeline.styles";
import type { EventMarker } from "./types";
import type { RangeBounds } from "@/atoms/interactive/dp-range-timeline/types";
import "@/atoms/interactive/dp-range-timeline/dp-range-timeline";
import { clampNumber } from "@/lib/timeline/timeline-scale.js";

/**
 * `dp-panel-timeline` is a panel-history-specific wrapper around `dp-range-timeline`.
 *
 * It adds the overlay layers (hover preview, comparison preview, zoom highlights,
 * chart hover lines, event dots) via named slots, keeping the core slider atom
 * free of panel-specific state.
 *
 * All `dp-range-*` events from the inner atom bubble through naturally.
 *
 * @fires dp-range-draft         - Bubbled from inner dp-range-timeline
 * @fires dp-range-commit        - Bubbled from inner dp-range-timeline
 * @fires dp-range-period-select - Bubbled from inner dp-range-timeline
 * @fires dp-range-period-hover  - Bubbled from inner dp-range-timeline
 * @fires dp-range-period-leave  - Bubbled from inner dp-range-timeline
 * @fires dp-range-scroll        - Bubbled from inner dp-range-timeline
 */
export class DpPanelTimeline extends LitElement {
  static properties = {
    // Core props — forwarded to dp-range-timeline
    startTime: { type: Object },
    endTime: { type: Object },
    rangeBounds: { type: Object },
    zoomLevel: { type: String },
    dateSnapping: { type: String },
    isLiveEdge: { type: Boolean },
    // Overlay props
    hoveredPeriodRange: { type: Object },
    comparisonPreview: { type: Object },
    zoomRange: { type: Object },
    zoomWindowRange: { type: Object },
    chartHoverTimeMs: { type: Number },
    chartHoverWindowTimeMs: { type: Number },
    events: { type: Array },
  };

  declare startTime: Date | null;
  declare endTime: Date | null;
  declare rangeBounds: RangeBounds | null;
  declare zoomLevel: string;
  declare dateSnapping: string;
  declare isLiveEdge: boolean;
  declare hoveredPeriodRange: { start: number; end: number } | null;
  declare comparisonPreview: { start: number; end: number } | null;
  declare zoomRange: { start: number; end: number } | null;
  declare zoomWindowRange: { start: number; end: number } | null;
  declare chartHoverTimeMs: number | null;
  declare chartHoverWindowTimeMs: number | null;
  declare events: EventMarker[];

  static styles = styles;

  // Cached overlay DOM refs (set in firstUpdated)
  _rangeHoverPreviewEl: HTMLElement | null = null;
  _rangeComparisonPreviewEl: HTMLElement | null = null;
  _rangeZoomHighlightEl: HTMLElement | null = null;
  _rangeZoomWindowHighlightEl: HTMLElement | null = null;
  _rangeChartHoverLineEl: HTMLElement | null = null;
  _rangeChartHoverWindowLineEl: HTMLElement | null = null;
  _rangeEventLayerEl: HTMLElement | null = null;

  constructor() {
    super();
    this.startTime = null;
    this.endTime = null;
    this.rangeBounds = null;
    this.zoomLevel = "day";
    this.dateSnapping = "auto";
    this.isLiveEdge = false;
    this.hoveredPeriodRange = null;
    this.comparisonPreview = null;
    this.zoomRange = null;
    this.zoomWindowRange = null;
    this.chartHoverTimeMs = null;
    this.chartHoverWindowTimeMs = null;
    this.events = [];
  }

  firstUpdated() {
    const sr = this.shadowRoot!;
    this._rangeHoverPreviewEl = sr.getElementById("range-hover-preview");
    this._rangeComparisonPreviewEl = sr.getElementById("range-comparison-preview");
    this._rangeZoomHighlightEl = sr.getElementById("range-zoom-highlight");
    this._rangeZoomWindowHighlightEl = sr.getElementById("range-zoom-window-highlight");
    this._rangeChartHoverLineEl = sr.getElementById("range-chart-hover-line");
    this._rangeChartHoverWindowLineEl = sr.getElementById("range-chart-hover-window-line");
    this._rangeEventLayerEl = sr.getElementById("range-event-layer");

    this._syncAllOverlays();
  }

  updated(changed: Map<string, unknown>) {
    const trackProps = ["hoveredPeriodRange", "comparisonPreview", "zoomRange", "zoomWindowRange", "rangeBounds"];
    const timelineProps = ["chartHoverTimeMs", "chartHoverWindowTimeMs", "events", "rangeBounds"];

    if (trackProps.some((p) => changed.has(p))) {
      this._syncTrackOverlays();
    }
    if (timelineProps.some((p) => changed.has(p))) {
      this._syncTimelineOverlays();
    }
  }

  render() {
    return html`
      <dp-range-timeline
        .startTime=${this.startTime}
        .endTime=${this.endTime}
        .rangeBounds=${this.rangeBounds}
        .zoomLevel=${this.zoomLevel}
        .dateSnapping=${this.dateSnapping}
        .isLiveEdge=${this.isLiveEdge}
        @dp-range-period-hover=${this._onPeriodHoverInternal}
        @dp-range-period-leave=${this._onPeriodLeaveInternal}
      >
        <!-- track overlays: positioned inside .range-track of dp-range-timeline -->
        <div slot="track-overlays" id="range-hover-preview" class="range-hover-preview"></div>
        <div slot="track-overlays" id="range-comparison-preview" class="range-comparison-preview"></div>
        <div slot="track-overlays" id="range-zoom-highlight" class="range-zoom-highlight"></div>
        <div slot="track-overlays" id="range-zoom-window-highlight" class="range-zoom-window-highlight"></div>
        <!-- timeline overlays: positioned inside .range-timeline of dp-range-timeline -->
        <div slot="timeline-overlays" id="range-chart-hover-line" class="range-chart-hover-line" aria-hidden="true"></div>
        <div slot="timeline-overlays" id="range-chart-hover-window-line" class="range-chart-hover-window-line" aria-hidden="true"></div>
        <div slot="timeline-overlays" id="range-event-layer" class="range-event-layer"></div>
      </dp-range-timeline>
    `;
  }

  // ---------------------------------------------------------------------------
  // Coordinate helper
  // ---------------------------------------------------------------------------

  _pct(ms: number): number {
    if (!this.rangeBounds) return 0;
    const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
    return ((ms - this.rangeBounds.min) / total) * 100;
  }

  // ---------------------------------------------------------------------------
  // Internal period hover handling (from dp-range-period-hover/leave events
  // bubbling up from the inner dp-range-timeline atom)
  // ---------------------------------------------------------------------------

  _onPeriodHoverInternal(ev: CustomEvent) {
    const { start, end } = ev.detail as { start: Date; end: Date };
    this.hoveredPeriodRange = { start: start.getTime(), end: end.getTime() };
  }

  _onPeriodLeaveInternal() {
    this.hoveredPeriodRange = null;
  }

  // ---------------------------------------------------------------------------
  // Overlay sync
  // ---------------------------------------------------------------------------

  _syncAllOverlays() {
    this._syncTrackOverlays();
    this._syncTimelineOverlays();
  }

  _setRangeOverlay(
    el: HTMLElement | null,
    range: { start: number; end: number } | null,
  ) {
    if (!el) return;
    if (!range || !this.rangeBounds) {
      el.classList.remove("visible");
      return;
    }
    const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
    const startClamped = clampNumber(range.start, this.rangeBounds.min, this.rangeBounds.max);
    const endClamped = clampNumber(range.end, this.rangeBounds.min, this.rangeBounds.max);
    const startPct = ((startClamped - this.rangeBounds.min) / total) * 100;
    const endPct = ((endClamped - this.rangeBounds.min) / total) * 100;
    el.style.left = `${startPct}%`;
    el.style.width = `${Math.max(0, endPct - startPct)}%`;
    el.classList.add("visible");
  }

  _setHoverLine(el: HTMLElement | null, timeMs: number | null) {
    if (!el) return;
    if (timeMs == null || !this.rangeBounds) {
      el.classList.remove("visible");
      return;
    }
    const clamped = clampNumber(timeMs, this.rangeBounds.min, this.rangeBounds.max);
    el.style.left = `${this._pct(clamped)}%`;
    el.classList.add("visible");
  }

  _syncTrackOverlays() {
    this._setRangeOverlay(this._rangeHoverPreviewEl, this.hoveredPeriodRange ?? null);
    this._setRangeOverlay(this._rangeComparisonPreviewEl, this.comparisonPreview ?? null);
    this._setRangeOverlay(this._rangeZoomHighlightEl, this.zoomRange ?? null);
    this._setRangeOverlay(this._rangeZoomWindowHighlightEl, this.zoomWindowRange ?? null);
  }

  _syncTimelineOverlays() {
    this._setHoverLine(this._rangeChartHoverLineEl, this.chartHoverTimeMs ?? null);
    this._setHoverLine(this._rangeChartHoverWindowLineEl, this.chartHoverWindowTimeMs ?? null);
    this._syncEventLayer();
  }

  _syncEventLayer() {
    if (!this._rangeEventLayerEl || !this.rangeBounds) return;
    this._rangeEventLayerEl.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
    for (const event of this.events) {
      const timestamp = new Date(event.timestamp as string).getTime();
      if (!Number.isFinite(timestamp) || timestamp < this.rangeBounds.min || timestamp > this.rangeBounds.max) continue;
      const dot = document.createElement("span");
      dot.className = "range-event-dot";
      dot.style.left = `${((timestamp - this.rangeBounds.min) / total) * 100}%`;
      dot.style.background = event.color ?? "#03a9f4";
      fragment.appendChild(dot);
    }
    this._rangeEventLayerEl.appendChild(fragment);
  }
}

customElements.define("dp-panel-timeline", DpPanelTimeline);
