import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachLineChartHover,
  attachLineChartRangeZoom,
} from "@/lib/chart/chart-interaction";
import "../history-chart";

// ── Characterization net (issue #27, AC1) ─────────────────────────────────────
// Pins the live hover / crosshair / tooltip / zoom behaviour of the history
// chart's interaction layer in BOTH single-canvas and split modes, driving real
// pointer events against a connected element so the shell ids the attach helpers
// query (#chart-crosshair, #tooltip, #chart-add-annotation, #chart-zoom-selection,
// #chart-stage) resolve. These tests must stay green on today's code; they are
// the safety net that #23 and any future lifecycle-seam work refactor against.
//
// They also demonstrate the property #27/AC3 worried about: disconnectedCallback
// tears down the listeners in split mode (no orphaned cleanup), because
// _attachSplitHover stores its teardown in the same _chartHoverCleanup /
// _chartZoomCleanup fields disconnectedCallback invokes.

type Cleanup = (() => void) | null;

type InteractionChartEl = HTMLElement & {
  _config?: Record<string, unknown>;
  _chartLastHover?: unknown;
  _chartHoverCleanup: Cleanup;
  _chartZoomCleanup: Cleanup;
  _chartZoomDragging?: boolean;
  disconnectedCallback(): void;
  _attachSplitHover(
    tracks: unknown[],
    comparisonHoverSeries: unknown[],
    events: unknown[],
    t0: number,
    t1: number,
    chartStage: HTMLElement | null,
    options: Record<string, unknown>,
    analysisMap: Map<string, unknown>,
    hasSelectedComparisonWindow: boolean
  ): void;
};

function stubRect(
  element: HTMLElement,
  rect: Partial<DOMRect> & { width: number; height: number }
) {
  Object.defineProperty(element, "getBoundingClientRect", {
    value: () => ({
      left: 0,
      top: 0,
      right: rect.width,
      bottom: rect.height,
      ...rect,
    }),
    configurable: true,
  });
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  stubRect(canvas, {
    left: 0,
    top: 0,
    right: 400,
    bottom: 200,
    width: 400,
    height: 200,
  });
  return canvas;
}

function createRenderer() {
  return {
    cw: 360,
    ch: 160,
    pad: { left: 20, top: 20 },
    xOf: () => 100,
    yOf: () => 80,
    _interpolateValue: () => 10,
  };
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

describe("history-chart interaction layer", () => {
  let el: InteractionChartEl;

  beforeEach(() => {
    el = document.createElement(
      "hass-datapoints-history-chart"
    ) as InteractionChartEl;
    el._config = { show_tooltips: true };
    document.body.appendChild(el);
  });

  afterEach(() => {
    el?.remove();
  });

  describe("GIVEN a single-canvas chart with hover and zoom attached", () => {
    function attachSingleCanvas() {
      const canvas = createCanvas();
      const renderer = createRenderer();
      const onReset = vi.fn();

      attachLineChartHover({
        card: el,
        canvas,
        renderer,
        series: [
          {
            entityId: "sensor.alpha",
            label: "Alpha",
            unit: "",
            color: "#83c705",
            pts: [
              [0, 10],
              [100, 10],
            ],
          },
        ],
        events: [],
        t0: 0,
        t1: 100,
        vMin: 0,
        vMax: 100,
        axes: null,
        showTooltip: true,
      });
      attachLineChartRangeZoom(el, canvas, renderer, 0, 100, {
        onReset,
      });

      return { canvas, onReset };
    }

    describe("WHEN the pointer moves over the canvas", () => {
      it("THEN it reveals the crosshair and records the hover state", async () => {
        expect.assertions(2);
        const { canvas } = attachSingleCanvas();

        canvas.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 100, clientY: 80 })
        );
        await nextFrame();

        expect(el._chartLastHover).not.toBeNull();
        expect(
          el.querySelector("#chart-crosshair")?.hasAttribute("hidden")
        ).toBe(false);
      });
    });

    describe("WHEN hover and zoom are attached", () => {
      it("THEN both cleanup handles are registered on the host", () => {
        expect.assertions(2);
        attachSingleCanvas();

        expect(typeof el._chartHoverCleanup).toBe("function");
        expect(typeof el._chartZoomCleanup).toBe("function");
      });
    });

    describe("WHEN the canvas is double-clicked inside the plot area", () => {
      it("THEN the zoom reset handler fires", () => {
        expect.assertions(1);
        const { canvas, onReset } = attachSingleCanvas();

        canvas.dispatchEvent(
          new MouseEvent("dblclick", { clientX: 100, clientY: 80 })
        );

        expect(onReset).toHaveBeenCalledTimes(1);
      });
    });

    describe("WHEN the host disconnects", () => {
      it("THEN the hover listener is torn down and stops updating", async () => {
        expect.assertions(3);
        const { canvas } = attachSingleCanvas();

        el.disconnectedCallback();

        expect(el._chartHoverCleanup).toBeNull();
        expect(el._chartZoomCleanup).toBeNull();

        el._chartLastHover = null;
        canvas.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 100, clientY: 80 })
        );
        await nextFrame();
        expect(el._chartLastHover).toBeNull();
      });
    });
  });

  describe("GIVEN a split-view chart with hover attached", () => {
    function attachSplit() {
      const renderer = createRenderer();
      const canvas = createCanvas();
      const chartStage = el.querySelector<HTMLElement>("#chart-stage");
      const track = {
        renderer,
        canvas,
        rowOffset: 0,
        axis: { min: 0, max: 100, side: "left" },
        series: {
          entityId: "sensor.alpha",
          label: "Alpha",
          unit: "",
          color: "#83c705",
          stepped: false,
          pts: [
            [0, 10],
            [100, 10],
          ],
        },
      };

      el._attachSplitHover(
        [track],
        [],
        [],
        0,
        100,
        chartStage,
        { show_tooltips: true },
        new Map(),
        false
      );

      const overlay = el.querySelector<HTMLElement>("#chart-split-overlay");
      return { overlay };
    }

    describe("WHEN the overlay exists after attaching", () => {
      it("THEN a shared split overlay is mounted into the chart stage", () => {
        expect.assertions(2);
        const { overlay } = attachSplit();

        expect(overlay).not.toBeNull();
        expect(typeof el._chartHoverCleanup).toBe("function");
      });
    });

    describe("WHEN the pointer moves over the split overlay", () => {
      it("THEN it reveals the crosshair and records the hover state", () => {
        expect.assertions(2);
        const { overlay } = attachSplit();

        overlay?.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 100, clientY: 40 })
        );

        expect(el._chartLastHover).not.toBeNull();
        expect(
          el.querySelector("#chart-crosshair")?.hasAttribute("hidden")
        ).toBe(false);
      });
    });

    describe("WHEN the host disconnects in split mode", () => {
      it("THEN the overlay listeners are torn down and stop updating", () => {
        expect.assertions(3);
        const { overlay } = attachSplit();

        el.disconnectedCallback();

        expect(el._chartHoverCleanup).toBeNull();
        expect(el._chartZoomCleanup).toBeNull();

        el._chartLastHover = null;
        overlay?.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 100, clientY: 40 })
        );
        expect(el._chartLastHover).toBeNull();
      });
    });
  });
});
