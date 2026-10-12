import { describe, expect, it, vi } from "vitest";

import { ChartRenderer, reserveLaneSpace } from "@/lib/chart/chart-renderer";

function createRenderer() {
  const ctx = {
    clearRect: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 24 })),
    save: vi.fn(),
    restore: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    bezierCurveTo: vi.fn(),
    fillRect: vi.fn(),
    arc: vi.fn(),
  };
  const canvas = {
    width: 400,
    height: 200,
    getContext: vi.fn(() => ctx),
  };

  return {
    ctx,
    renderer: new ChartRenderer(canvas, 400, 200),
  };
}

describe("chart-renderer", () => {
  describe("GIVEN a renderer instance", () => {
    describe("WHEN the geometry helpers are called", () => {
      it("THEN they use the chart padding and drawable bounds", () => {
        expect.assertions(4);

        const { renderer } = createRenderer();

        expect(renderer.cw).toBe(376);
        expect(renderer.ch).toBe(128);
        expect(renderer.xOf(5, 0, 10)).toBe(200);
        expect(renderer.yOf(5, 0, 10)).toBe(88);
      });
    });
  });

  describe("GIVEN a renderer with multiple axes", () => {
    describe("WHEN _normalizeAxes is called", () => {
      it("THEN it assigns slots and expands the side padding", () => {
        expect.assertions(4);

        const { renderer } = createRenderer();
        const axes = renderer._normalizeAxes([
          { key: "left", min: 0, max: 10, side: "left", unit: "C" },
          { key: "right", min: 0, max: 100, side: "right", unit: "%" },
        ]);

        expect(axes[0].slot).toBe(0);
        expect(axes[1].slot).toBe(0);
        expect(renderer.pad.left).toBe(42);
        expect(renderer.pad.right).toBe(42);
      });
    });
  });

  describe("GIVEN a renderer instance and a canvas context", () => {
    describe("WHEN clear and drawLine are called", () => {
      it("THEN they clear and stroke using the underlying context", () => {
        expect.assertions(3);

        const { ctx, renderer } = createRenderer();

        renderer.clear();
        renderer.drawLine(
          [
            [0, 0],
            [10, 10],
          ],
          "#83c705",
          0,
          10,
          0,
          10,
          { smooth: false }
        );

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 200);
        expect(ctx.moveTo).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
      });

      it("THEN stepped lines draw horizontal and vertical segments", () => {
        expect.assertions(4);

        const { ctx, renderer } = createRenderer();

        renderer.drawLine(
          [
            [0, 0],
            [5, 10],
            [10, 4],
          ],
          "#83c705",
          0,
          10,
          0,
          10,
          { stepped: true }
        );

        expect(ctx.lineTo).toHaveBeenCalledTimes(4);
        expect(ctx.lineTo.mock.calls).toEqual(
          expect.arrayContaining([
            [200, 152],
            [200, 24],
            [388, 24],
            [388, 100.8],
          ])
        );
        expect(ctx.lineJoin).toBe("miter");
        expect(ctx.lineCap).toBe("butt");
      });
    });
  });

  describe("GIVEN a renderer and a binary lane rect", () => {
    const rect = { x: 12, y: 150, width: 376, height: 20 };

    describe("WHEN drawStateRow is called with on and off spans", () => {
      it("THEN it fills a muted track across the whole lane rect", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();

        renderer.drawStateRow(
          [
            { start: 25, end: 50, state: "on" },
            { start: 50, end: 100, state: "off" },
          ],
          0,
          100,
          rect,
          { color: "#83c705" }
        );

        expect(ctx.fillRect.mock.calls).toContainEqual([12, 150, 376, 20]);
      });

      it("THEN on-spans fill a segment mapped by xOf within the lane rect", () => {
        expect.assertions(2);

        const { ctx, renderer } = createRenderer();

        renderer.drawStateRow(
          [
            { start: 25, end: 50, state: "on" },
            { start: 50, end: 100, state: "off" },
          ],
          0,
          100,
          rect,
          { color: "#83c705" }
        );

        // xOf(25,0,100) = 12 + 0.25*376 = 106; xOf(50,...) = 12 + 0.5*376 = 200.
        expect(ctx.fillRect.mock.calls).toContainEqual([106, 150, 94, 20]);
        // track + exactly one on-segment (the off span is never filled as "on").
        expect(ctx.fillRect).toHaveBeenCalledTimes(2);
      });

      it("THEN off/unknown spans are not drawn as on-segments", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();

        renderer.drawStateRow(
          [
            { start: 0, end: 50, state: "off" },
            { start: 50, end: 100, state: "unavailable" },
          ],
          0,
          100,
          rect,
          { color: "#83c705" }
        );

        // only the muted track fill, no on-segment fills.
        expect(ctx.fillRect).toHaveBeenCalledTimes(1);
      });

      it("THEN on-segments are clamped to the lane rect horizontal bounds", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();
        const narrow = { x: 100, y: 150, width: 100, height: 20 };

        renderer.drawStateRow(
          [{ start: 0, end: 100, state: "on" }],
          0,
          100,
          narrow,
          { color: "#83c705" }
        );

        // on-span spans the full window but must not exceed [100, 200].
        expect(ctx.fillRect.mock.calls).toContainEqual([100, 150, 100, 20]);
      });
    });

    describe("WHEN drawStateRow is called with an optional label", () => {
      it("THEN it draws the label text at the lane's left edge", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();

        renderer.drawStateRow(
          [{ start: 25, end: 50, state: "on" }],
          0,
          100,
          rect,
          { color: "#83c705", label: "Front Door" }
        );

        expect(ctx.fillText.mock.calls).toContainEqual(["Front Door", 18, 160]);
      });

      it("THEN on-segments are offset past the label gutter so they never overlap the label", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();

        // measureText (mock) → 24px label; gutter = 6 + 24 + 6 = 36, so the
        // left-edge on-segment must start at x + 36 = 48 instead of x = 12.
        renderer.drawStateRow(
          [{ start: 0, end: 100, state: "on" }],
          0,
          100,
          rect,
          { color: "#83c705", label: "Front Door" }
        );

        expect(ctx.fillRect.mock.calls).toContainEqual([48, 150, 340, 20]);
      });
    });

    describe("WHEN drawStateRow is called with a zero-height rect", () => {
      it("THEN it draws nothing", () => {
        expect.assertions(1);

        const { ctx, renderer } = createRenderer();

        renderer.drawStateRow(
          [{ start: 25, end: 50, state: "on" }],
          0,
          100,
          { x: 12, y: 150, width: 376, height: 0 },
          { color: "#83c705" }
        );

        expect(ctx.fillRect).not.toHaveBeenCalled();
      });
    });
  });

  describe("GIVEN the lane-geometry helper", () => {
    describe("WHEN reserveLaneSpace is called with rows, lane height and gap", () => {
      it("THEN it reserves rowCount * (laneHeight + gap) of bottom space", () => {
        expect.assertions(1);

        expect(reserveLaneSpace(3, 20, 6)).toBe(78);
      });

      it("THEN the gap defaults to zero", () => {
        expect.assertions(1);

        expect(reserveLaneSpace(2, 20)).toBe(40);
      });
    });

    describe("WHEN reserveLaneSpace is called with no rows", () => {
      it("THEN it reserves no space", () => {
        expect.assertions(1);

        expect(reserveLaneSpace(0, 20, 6)).toBe(0);
      });
    });
  });
});
