/**
 * Pure scroll position calculation extracted from history-chart.ts.
 */

import { clampChartValue } from "@/lib/chart/chart-shell";

export function calculateViewportScrollPosition(
  t0: number,
  t1: number,
  canvasWidth: number,
  viewportWidth: number,
  zoomStart: number,
  zoomEnd: number
): number {
  const totalMs = Math.max(1, t1 - t0);
  const spanMs = Math.max(1, zoomEnd - zoomStart);
  const maxScrollLeft = Math.max(
    0,
    Math.max(canvasWidth, viewportWidth) - viewportWidth
  );
  const maxStartOffsetMs = Math.max(0, totalMs - spanMs);
  const clampedStart = clampChartValue(zoomStart, t0, t1 - spanMs);
  const ratio =
    maxStartOffsetMs > 0 ? (clampedStart - t0) / maxStartOffsetMs : 0;
  return ratio * maxScrollLeft;
}

export interface ChartRenderWindow {
  /** Start of the time range the canvas covers (ms). */
  renderT0: number;
  /** End of the time range the canvas covers (ms). */
  renderT1: number;
  /** Canvas width in px. */
  canvasWidth: number;
}

/**
 * Work out which slice of the full range the chart canvas should cover.
 *
 * A zoomed chart is drawn on a canvas `viewportWidth * (total / span)` wide
 * inside a horizontally scrolling viewport. Browsers cap canvas size, so when
 * that width would exceed `maxCanvasWidth` the canvas instead covers only a
 * window around the zoom range (as wide as the cap allows, clamped to the full
 * range). Panning past the window's edge commits a new zoom range, which
 * redraws with a window centred on it. This keeps the pixel scale exact at any
 * zoom depth instead of silently capping how far you can zoom in.
 */
export function resolveChartRenderWindow(
  t0: number,
  t1: number,
  zoomRange: Nullable<{ start: number; end: number }>,
  viewportWidth: number,
  maxCanvasWidth: number
): ChartRenderWindow {
  const total = Math.max(1, t1 - t0);
  if (!zoomRange) {
    return { renderT0: t0, renderT1: t1, canvasWidth: viewportWidth };
  }
  const span = clampChartValue(zoomRange.end - zoomRange.start, 1, total);
  const desiredWidth = Math.max(
    viewportWidth,
    Math.round((viewportWidth * total) / span)
  );
  if (desiredWidth <= maxCanvasWidth || maxCanvasWidth <= viewportWidth) {
    return {
      renderT0: t0,
      renderT1: t1,
      canvasWidth: Math.min(desiredWidth, Math.max(maxCanvasWidth, 1)),
    };
  }
  const windowSpan = Math.min(total, (span * maxCanvasWidth) / viewportWidth);
  const centre = (zoomRange.start + zoomRange.end) / 2;
  const renderT0 = clampChartValue(
    centre - windowSpan / 2,
    t0,
    t1 - windowSpan
  );
  return {
    renderT0,
    renderT1: renderT0 + windowSpan,
    canvasWidth: Math.round((viewportWidth * windowSpan) / span),
  };
}
