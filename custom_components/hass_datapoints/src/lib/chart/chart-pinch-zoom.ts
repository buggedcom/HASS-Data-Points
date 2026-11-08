/**
 * Pinch-to-zoom support for the history chart.
 *
 * The history chart zooms by widening its canvas inside a horizontally
 * scrolling viewport: the visible window is `zoomRange`, the canvas width is
 * `viewportWidth * (total / span)` and the scroll position maps linearly onto
 * the zoom start (see `calculateViewportScrollPosition`). This module adds a
 * two-finger pinch (and trackpad pinch / ctrl+wheel) gesture on top of that
 * model. While the gesture runs the existing canvas is stretched with a CSS
 * transform as a cheap preview; when it ends the resulting range is committed
 * once, which triggers a single real redraw.
 */

import { clampChartValue } from "@/lib/chart/chart-shell";

export interface PinchZoomGeometry {
  /** Full render range start (ms). */
  t0: number;
  /** Full render range end (ms). */
  t1: number;
  /** Visible viewport width in px (as used by the draw). */
  viewportWidth: number;
  /** Plot padding left of the time axis, in canvas px. */
  padLeft: number;
  /** Plot padding right of the time axis, in canvas px. */
  padRight: number;
  /** Largest canvas width the chart will render, in px. */
  maxCanvasWidth: number;
  /** Largest allowed total/span ratio. */
  maxZoomMultiplier: number;
}

export interface PinchZoomRange {
  start: number;
  end: number;
}

/** Spans within this fraction of the full range count as "fully zoomed out". */
const FULL_RANGE_EPSILON = 0.001;

/** Smallest and largest span the chart can actually display. */
export function getPinchSpanLimits(geometry: PinchZoomGeometry): {
  min: number;
  max: number;
} {
  const total = Math.max(1, geometry.t1 - geometry.t0);
  const byMultiplier = total / Math.max(1, geometry.maxZoomMultiplier);
  const byCanvas =
    geometry.maxCanvasWidth > 0
      ? (geometry.viewportWidth * total) / geometry.maxCanvasWidth
      : 0;
  return { min: Math.min(total, Math.max(byMultiplier, byCanvas)), max: total };
}

export function clampPinchSpan(
  span: number,
  geometry: PinchZoomGeometry
): number {
  const { min, max } = getPinchSpanLimits(geometry);
  return clampChartValue(span, min, max);
}

/** Canvas width the chart draws for a given visible span. */
export function canvasWidthForSpan(
  span: number,
  geometry: PinchZoomGeometry
): number {
  const total = Math.max(1, geometry.t1 - geometry.t0);
  const clampedSpan = clampPinchSpan(span, geometry);
  if (clampedSpan >= total * (1 - FULL_RANGE_EPSILON)) {
    return geometry.viewportWidth;
  }
  return Math.min(
    geometry.maxCanvasWidth,
    Math.max(
      geometry.viewportWidth,
      Math.round((geometry.viewportWidth * total) / clampedSpan)
    )
  );
}

/** Time under a canvas-local x position for a canvas of the given width. */
export function timeAtCanvasX(
  canvasX: number,
  canvasWidth: number,
  geometry: PinchZoomGeometry
): number {
  const cw = Math.max(1, canvasWidth - geometry.padLeft - geometry.padRight);
  const ratio = clampChartValue((canvasX - geometry.padLeft) / cw, 0, 1);
  return geometry.t0 + ratio * (geometry.t1 - geometry.t0);
}

/**
 * Resolve the zoom range that keeps `anchorTime` under `anchorViewportX`
 * (px from the viewport's left content edge) once the chart is redrawn with
 * the given span. Returns null when the span covers the whole range, meaning
 * the zoom should be cleared.
 */
export function resolvePinchZoomRange(
  geometry: PinchZoomGeometry,
  anchorTime: number,
  anchorViewportX: number,
  span: number
): Nullable<PinchZoomRange> {
  const total = Math.max(1, geometry.t1 - geometry.t0);
  const nextSpan = clampPinchSpan(span, geometry);
  if (nextSpan >= total * (1 - FULL_RANGE_EPSILON)) {
    return null;
  }
  const canvasWidth = canvasWidthForSpan(nextSpan, geometry);
  const cw = Math.max(1, canvasWidth - geometry.padLeft - geometry.padRight);
  const anchorRatio = clampChartValue((anchorTime - geometry.t0) / total, 0, 1);
  const anchorCanvasX = geometry.padLeft + anchorRatio * cw;
  const maxScrollLeft = Math.max(0, canvasWidth - geometry.viewportWidth);
  const scrollLeft = clampChartValue(
    anchorCanvasX - anchorViewportX,
    0,
    maxScrollLeft
  );
  const ratio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
  const start = geometry.t0 + ratio * (total - nextSpan);
  return { start, end: start + nextSpan };
}

/** Wheel delta → span multiplier for trackpad pinch / ctrl+wheel. */
export function wheelDeltaToSpanFactor(deltaY: number, deltaMode = 0): number {
  // deltaMode 1 = lines, 2 = pages; normalise to roughly pixels.
  let px = deltaY;
  if (deltaMode === 1) {
    px = deltaY * 16;
  } else if (deltaMode === 2) {
    px = deltaY * 400;
  }
  return Math.exp(clampChartValue(px, -100, 100) * 0.005);
}

// ── DOM controller ────────────────────────────────────────────────────────────

export interface PinchZoomState {
  geometry: PinchZoomGeometry;
  /** Currently visible span (ms). */
  span: number;
}

export interface AttachPinchZoomOptions {
  viewport: HTMLElement;
  stage: HTMLElement;
  /** Current geometry, or null when the chart cannot be zoomed right now. */
  getState: () => Nullable<PinchZoomState>;
  /** Called when a gesture begins (cancel drag-select, hide hover, …). */
  onStart?: () => void;
  /**
   * Commit the gesture. `range` is null when the chart should zoom fully out.
   * Return true when a redraw was triggered; the preview transform is then
   * left in place until the redraw clears it via `clearPinchPreview`.
   */
  onCommit: (range: Nullable<PinchZoomRange>) => boolean;
  /** Called after the gesture has fully ended (committed or abandoned). */
  onEnd?: () => void;
}

const WHEEL_COMMIT_DELAY_MS = 220;
const PREVIEW_SAFETY_CLEAR_MS = 1500;

/** Remove any pinch preview transform from the chart stage. */
export function clearPinchPreview(stage: Nullable<HTMLElement>): void {
  if (!stage) {
    return;
  }
  stage.style.transform = "";
  stage.style.transformOrigin = "";
}

interface PinchSession {
  state: PinchZoomState;
  /** Stage left edge (client px) at scrollLeft = 0. */
  stageOriginLeft: number;
  anchorCanvasX: number;
  anchorTime: number;
  startCanvasWidth: number;
  span: number;
  focusClientX: number;
}

/**
 * Attach pinch (two-finger touch) and trackpad pinch / ctrl+wheel zoom to the
 * chart's scroll viewport. Returns a cleanup function.
 */
export function attachPinchZoom(options: AttachPinchZoomOptions): () => void {
  const { viewport, stage } = options;
  let session: Nullable<PinchSession> = null;
  let touchStartDistance = 0;
  let touchStartSpan = 0;
  let wheelTimer: Nullable<ReturnType<typeof setTimeout>> = null;
  let safetyTimer: Nullable<ReturnType<typeof setTimeout>> = null;

  const beginSession = (focusClientX: number): boolean => {
    const state = options.getState();
    if (!state) {
      return false;
    }
    if (safetyTimer !== null) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    clearPinchPreview(stage);
    const stageRect = stage.getBoundingClientRect();
    const startCanvasWidth = Math.max(1, stage.offsetWidth || stageRect.width);
    const anchorCanvasX = focusClientX - stageRect.left;
    session = {
      state,
      stageOriginLeft: stageRect.left + viewport.scrollLeft,
      anchorCanvasX,
      anchorTime: timeAtCanvasX(
        anchorCanvasX,
        startCanvasWidth,
        state.geometry
      ),
      startCanvasWidth,
      span: clampPinchSpan(state.span, state.geometry),
      focusClientX,
    };
    options.onStart?.();
    return true;
  };

  const renderPreview = (): void => {
    if (!session) {
      return;
    }
    const { geometry } = session.state;
    const nextWidth = canvasWidthForSpan(session.span, geometry);
    const scale = nextWidth / session.startCanvasWidth;
    const stageLeft = session.stageOriginLeft - viewport.scrollLeft;
    const tx = session.focusClientX - stageLeft - session.anchorCanvasX * scale;
    stage.style.transformOrigin = "0 0";
    stage.style.transform = `translateX(${tx}px) scaleX(${scale})`;
  };

  const endSession = (commit: boolean): void => {
    const current = session;
    session = null;
    if (!current) {
      return;
    }
    let redrawing = false;
    const startSpan = clampPinchSpan(
      current.state.span,
      current.state.geometry
    );
    const changed = Math.abs(current.span - startSpan) > startSpan * 0.01;
    if (commit && changed) {
      const range = resolvePinchZoomRange(
        current.state.geometry,
        current.anchorTime,
        current.focusClientX - current.stageOriginLeft,
        current.span
      );
      redrawing = options.onCommit(range);
    }
    if (redrawing) {
      safetyTimer = setTimeout(() => {
        safetyTimer = null;
        clearPinchPreview(stage);
      }, PREVIEW_SAFETY_CLEAR_MS);
    } else {
      clearPinchPreview(stage);
    }
    options.onEnd?.();
  };

  const touchDistance = (touches: TouchList): number => {
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const touchMidX = (touches: TouchList): number =>
    (touches[0].clientX + touches[1].clientX) / 2;

  const onTouchStart = (ev: TouchEvent): void => {
    if (ev.touches.length !== 2) {
      return;
    }
    if (wheelTimer !== null) {
      clearTimeout(wheelTimer);
      wheelTimer = null;
      endSession(true);
    }
    if (!beginSession(touchMidX(ev.touches))) {
      return;
    }
    touchStartDistance = Math.max(1, touchDistance(ev.touches));
    touchStartSpan = session!.span;
    ev.preventDefault();
  };

  const onTouchMove = (ev: TouchEvent): void => {
    if (!session || ev.touches.length < 2) {
      return;
    }
    ev.preventDefault();
    const distance = Math.max(1, touchDistance(ev.touches));
    session.span = clampPinchSpan(
      touchStartSpan * (touchStartDistance / distance),
      session.state.geometry
    );
    session.focusClientX = touchMidX(ev.touches);
    renderPreview();
  };

  const onTouchEnd = (ev: TouchEvent): void => {
    if (!session || ev.touches.length >= 2) {
      return;
    }
    endSession(ev.type !== "touchcancel");
  };

  const onWheel = (ev: WheelEvent): void => {
    // Browsers report trackpad pinch as a ctrl+wheel event.
    if (!ev.ctrlKey || ev.deltaY === 0) {
      return;
    }
    ev.preventDefault();
    if (!session && !beginSession(ev.clientX)) {
      return;
    }
    session!.span = clampPinchSpan(
      session!.span * wheelDeltaToSpanFactor(ev.deltaY, ev.deltaMode),
      session!.state.geometry
    );
    renderPreview();
    if (wheelTimer !== null) {
      clearTimeout(wheelTimer);
    }
    wheelTimer = setTimeout(() => {
      wheelTimer = null;
      endSession(true);
    }, WHEEL_COMMIT_DELAY_MS);
  };

  // Safari fires proprietary gesture events for pinches; swallow them so the
  // page itself does not zoom while the chart handles the gesture.
  const onGesture = (ev: Event): void => {
    ev.preventDefault();
  };

  viewport.addEventListener("touchstart", onTouchStart, { passive: false });
  viewport.addEventListener("touchmove", onTouchMove, { passive: false });
  viewport.addEventListener("touchend", onTouchEnd);
  viewport.addEventListener("touchcancel", onTouchEnd);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("gesturestart", onGesture);
  viewport.addEventListener("gesturechange", onGesture);

  return () => {
    viewport.removeEventListener("touchstart", onTouchStart);
    viewport.removeEventListener("touchmove", onTouchMove);
    viewport.removeEventListener("touchend", onTouchEnd);
    viewport.removeEventListener("touchcancel", onTouchEnd);
    viewport.removeEventListener("wheel", onWheel);
    viewport.removeEventListener("gesturestart", onGesture);
    viewport.removeEventListener("gesturechange", onGesture);
    if (wheelTimer !== null) {
      clearTimeout(wheelTimer);
      wheelTimer = null;
    }
    if (safetyTimer !== null) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    session = null;
    clearPinchPreview(stage);
  };
}
