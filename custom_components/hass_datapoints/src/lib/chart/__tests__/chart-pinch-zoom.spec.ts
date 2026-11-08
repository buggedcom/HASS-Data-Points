import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachPinchZoom,
  clampPinchSpan,
  getPinchSpanLimits,
  resolvePinchZoomRange,
  timeAtCanvasX,
  wheelDeltaToSpanFactor,
  type PinchZoomGeometry,
  type PinchZoomRange,
} from "../chart-pinch-zoom";

const geometry: PinchZoomGeometry = {
  t0: 0,
  t1: 100_000,
  renderT0: 0,
  renderT1: 100_000,
  viewportWidth: 1000,
  padLeft: 0,
  padRight: 0,
  maxCanvasWidth: 50_000,
  minSpanMs: 100,
};

describe("chart-pinch-zoom", () => {
  describe("GIVEN span limits", () => {
    describe("WHEN a span outside the limits is clamped", () => {
      it("THEN it is pulled back to the minimum span or the full range", () => {
        expect.assertions(3);
        expect(getPinchSpanLimits(geometry)).toEqual({
          min: 100,
          max: 100_000,
        });
        expect(clampPinchSpan(10, geometry)).toBe(100);
        expect(clampPinchSpan(1e9, geometry)).toBe(100_000);
      });
    });

    describe("WHEN the zoom is far deeper than the canvas cap allows", () => {
      it("THEN the span is not limited by the canvas size", () => {
        expect.assertions(1);
        // 1000px * 100000 / 50000px cap would have limited the old code to 2000ms.
        expect(clampPinchSpan(500, geometry)).toBe(500);
      });
    });
  });

  describe("GIVEN timeAtCanvasX", () => {
    describe("WHEN the canvas has plot padding", () => {
      it("THEN x is mapped through the plot area", () => {
        expect.assertions(2);
        const padded = { ...geometry, padLeft: 50, padRight: 50 };
        expect(timeAtCanvasX(50, 1100, padded)).toBe(0);
        expect(timeAtCanvasX(550, 1100, padded)).toBe(50_000);
      });
    });
  });

  describe("GIVEN resolvePinchZoomRange", () => {
    describe("WHEN zooming in around the centre of an unzoomed chart", () => {
      it("THEN the anchor time stays centred", () => {
        expect.assertions(2);
        const range = resolvePinchZoomRange(geometry, 50_000, 500, 20_000)!;
        expect(range.start).toBeCloseTo(40_000, 6);
        expect(range.end).toBeCloseTo(60_000, 6);
      });
    });

    describe("WHEN zooming in near the left edge", () => {
      it("THEN the range is clamped to the start of the data", () => {
        expect.assertions(2);
        const range = resolvePinchZoomRange(geometry, 1000, 900, 10_000)!;
        expect(range.start).toBe(0);
        expect(range.end).toBe(10_000);
      });
    });

    describe("WHEN zooming out of a zoomed chart past the full range", () => {
      it("THEN null is returned so the zoom is cleared", () => {
        expect.assertions(1);
        expect(resolvePinchZoomRange(geometry, 50_000, 500, 250_000)).toBe(
          null
        );
      });
    });

    describe("WHEN zooming out partially", () => {
      it("THEN a wider range around the anchor is returned", () => {
        expect.assertions(2);
        const range = resolvePinchZoomRange(geometry, 50_000, 500, 50_000)!;
        expect(range.start).toBeCloseTo(25_000, 6);
        expect(range.end).toBeCloseTo(75_000, 6);
      });
    });

    describe("WHEN zooming deeper than the canvas cap", () => {
      it("THEN the anchor is kept under the fingers inside the render window", () => {
        expect.assertions(2);
        const range = resolvePinchZoomRange(geometry, 30_000, 250, 400)!;
        expect(range.end - range.start).toBeCloseTo(400, 6);
        // Anchor 25% across the viewport → 25% into the visible span.
        expect(range.start).toBeCloseTo(30_000 - 100, 0);
      });
    });
  });

  describe("GIVEN wheelDeltaToSpanFactor", () => {
    describe("WHEN the wheel scrolls up (pinch out on a trackpad)", () => {
      it("THEN the span shrinks", () => {
        expect.assertions(2);
        expect(wheelDeltaToSpanFactor(-10)).toBeLessThan(1);
        expect(wheelDeltaToSpanFactor(10)).toBeGreaterThan(1);
      });
    });
  });

  describe("GIVEN attachPinchZoom on a viewport", () => {
    let viewport: HTMLElement;
    let stage: HTMLElement;
    let span: number;
    let commits: Array<Nullable<PinchZoomRange>>;
    let cleanup: () => void;

    const touchEvent = (type: string, points: Array<[number, number]>) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      const touches = points.map(([clientX, clientY]) => ({
        clientX,
        clientY,
      }));
      Object.defineProperty(ev, "touches", { value: touches });
      return ev;
    };

    beforeEach(() => {
      viewport = document.createElement("div");
      stage = document.createElement("div");
      viewport.appendChild(stage);
      document.body.appendChild(viewport);
      Object.defineProperty(viewport, "clientWidth", { value: 1000 });
      Object.defineProperty(stage, "offsetWidth", { value: 1000 });
      stage.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 1000, height: 300 }) as DOMRect;
      span = 100_000;
      commits = [];
      cleanup = attachPinchZoom({
        viewport,
        stage,
        getState: () => ({ geometry, span }),
        onCommit: (range) => {
          commits.push(range);
          return false;
        },
      });
    });

    afterEach(() => {
      cleanup();
      viewport.remove();
    });

    describe("WHEN two fingers spread apart around the centre", () => {
      it("THEN a zoomed-in range centred on the fingers is committed", () => {
        expect.assertions(4);
        viewport.dispatchEvent(
          touchEvent("touchstart", [
            [450, 100],
            [550, 100],
          ])
        );
        const move = touchEvent("touchmove", [
          [300, 100],
          [700, 100],
        ]);
        viewport.dispatchEvent(move);
        expect(move.defaultPrevented).toBe(true);
        expect(stage.style.transform).toContain("scaleX(4)");
        viewport.dispatchEvent(touchEvent("touchend", [[300, 100]]));
        expect(commits).toHaveLength(1);
        expect(commits[0]).toEqual({ start: 37_500, end: 62_500 });
      });
    });

    describe("WHEN two fingers pinch together on a zoomed-in chart", () => {
      it("THEN zooming past the full range commits null to clear the zoom", () => {
        expect.assertions(3);
        span = 25_000;
        viewport.dispatchEvent(
          touchEvent("touchstart", [
            [100, 100],
            [900, 100],
          ])
        );
        viewport.dispatchEvent(
          touchEvent("touchmove", [
            [480, 100],
            [520, 100],
          ])
        );
        viewport.dispatchEvent(touchEvent("touchend", []));
        expect(commits).toHaveLength(1);
        expect(commits[0]).toBe(null);
        expect(stage.style.transform).toBe("");
      });
    });

    describe("WHEN only one finger touches the chart", () => {
      it("THEN no pinch is started", () => {
        expect.assertions(2);
        const start = touchEvent("touchstart", [[500, 100]]);
        viewport.dispatchEvent(start);
        viewport.dispatchEvent(touchEvent("touchmove", [[600, 100]]));
        viewport.dispatchEvent(touchEvent("touchend", []));
        expect(start.defaultPrevented).toBe(false);
        expect(commits).toHaveLength(0);
      });
    });

    describe("WHEN a trackpad pinch sends ctrl+wheel events", () => {
      it("THEN the zoom is committed after the gesture settles", () => {
        vi.useFakeTimers();
        try {
          expect.assertions(3);
          const wheel = new WheelEvent("wheel", {
            deltaY: -50,
            ctrlKey: true,
            clientX: 500,
            cancelable: true,
          });
          // happy-dom ignores ctrlKey in the WheelEvent init dictionary.
          Object.defineProperty(wheel, "ctrlKey", { value: true });
          viewport.dispatchEvent(wheel);
          expect(wheel.defaultPrevented).toBe(true);
          expect(commits).toHaveLength(0);
          vi.advanceTimersByTime(300);
          expect(commits).toHaveLength(1);
        } finally {
          vi.useRealTimers();
        }
      });
    });

    describe("WHEN a plain wheel event (no ctrl) is received", () => {
      it("THEN it is left alone for normal scrolling", () => {
        expect.assertions(1);
        const wheel = new WheelEvent("wheel", {
          deltaY: -50,
          cancelable: true,
        });
        viewport.dispatchEvent(wheel);
        expect(wheel.defaultPrevented).toBe(false);
      });
    });
  });
});
