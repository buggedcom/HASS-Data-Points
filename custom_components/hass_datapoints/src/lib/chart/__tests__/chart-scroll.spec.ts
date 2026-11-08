import { describe, expect, it } from "vitest";
import {
  calculateViewportScrollPosition,
  resolveChartRenderWindow,
} from "../chart-scroll";

describe("chart-scroll", () => {
  describe("GIVEN calculateViewportScrollPosition", () => {
    describe("WHEN zoom range is at the start", () => {
      it("THEN scroll position is 0", () => {
        expect.assertions(1);
        expect(
          calculateViewportScrollPosition(0, 1000, 1000, 400, 0, 400)
        ).toBe(0);
      });
    });

    describe("WHEN zoom range is at the end", () => {
      it("THEN scroll position is at maxScrollLeft", () => {
        expect.assertions(1);
        const result = calculateViewportScrollPosition(
          0,
          1000,
          1000,
          400,
          600,
          1000
        );
        expect(result).toBe(600);
      });
    });

    describe("WHEN zoom range is in the middle", () => {
      it("THEN scroll position is proportional", () => {
        expect.assertions(1);
        const result = calculateViewportScrollPosition(
          0,
          1000,
          1001,
          400,
          300,
          700
        );
        // ratio = (300 - 0) / (1000 - 400) = 0.5, maxScroll = 601
        expect(result).toBeCloseTo(300.5, 0);
      });
    });

    describe("WHEN canvas width equals viewport width", () => {
      it("THEN scroll position is 0 regardless of zoom", () => {
        expect.assertions(1);
        expect(
          calculateViewportScrollPosition(0, 1000, 400, 400, 200, 600)
        ).toBe(0);
      });
    });
  });
});

describe("chart-scroll render window", () => {
  describe("GIVEN resolveChartRenderWindow", () => {
    describe("WHEN there is no zoom", () => {
      it("THEN the canvas covers the full range at viewport width", () => {
        expect.assertions(1);
        expect(resolveChartRenderWindow(0, 1000, null, 400, 8000)).toEqual({
          renderT0: 0,
          renderT1: 1000,
          canvasWidth: 400,
        });
      });
    });

    describe("WHEN the zoomed canvas fits under the cap", () => {
      it("THEN the canvas covers the full range, widened", () => {
        expect.assertions(1);
        expect(
          resolveChartRenderWindow(0, 1000, { start: 100, end: 200 }, 400, 8000)
        ).toEqual({ renderT0: 0, renderT1: 1000, canvasWidth: 4000 });
      });
    });

    describe("WHEN the zoomed canvas would exceed the cap", () => {
      it("THEN only a window centred on the zoom range is drawn at the true scale", () => {
        expect.assertions(1);
        // span 10 → desired 40000px; cap 8000 allows a 200ms window.
        expect(
          resolveChartRenderWindow(0, 1000, { start: 500, end: 510 }, 400, 8000)
        ).toEqual({ renderT0: 405, renderT1: 605, canvasWidth: 8000 });
      });
    });

    describe("WHEN the window would run past the start of the data", () => {
      it("THEN it is clamped to the full range", () => {
        expect.assertions(1);
        expect(
          resolveChartRenderWindow(0, 1000, { start: 0, end: 10 }, 400, 8000)
        ).toEqual({ renderT0: 0, renderT1: 200, canvasWidth: 8000 });
      });
    });
  });
});
