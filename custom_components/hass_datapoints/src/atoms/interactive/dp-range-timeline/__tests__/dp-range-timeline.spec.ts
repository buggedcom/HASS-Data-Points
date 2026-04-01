import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../dp-range-timeline";
import type { RangeBounds } from "../types";

// A representative day-level zoom config (mirrors RANGE_ZOOM_CONFIGS.day)
const DAY_CONFIG = {
  baselineMs: 48 * 60 * 60 * 1000,
  boundsUnit: "hour",
  contextUnit: "day",
  majorUnit: "hour",
  labelUnit: "hour",
  minorUnit: "hour",
  pixelsPerUnit: 9,
};

// Two-day range centred on 2024-01-15
const JAN_15 = new Date("2024-01-15T12:00:00Z").getTime();
const JAN_13 = new Date("2024-01-13T00:00:00Z").getTime();
const JAN_17 = new Date("2024-01-17T00:00:00Z").getTime();

const SAMPLE_BOUNDS: RangeBounds = {
  min: JAN_13,
  max: JAN_17,
  config: DAY_CONFIG,
};

function createElement(props: Record<string, unknown> = {}) {
  const el = document.createElement("dp-range-timeline") as HTMLElement & {
    startTime: Date | null;
    endTime: Date | null;
    rangeBounds: RangeBounds | null;
    zoomLevel: string;
    dateSnapping: string;
    isLiveEdge: boolean;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, {
    startTime: null,
    endTime: null,
    rangeBounds: null,
    zoomLevel: "day",
    dateSnapping: "auto",
    isLiveEdge: false,
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

describe("dp-range-timeline", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  describe("GIVEN default props (no rangeBounds)", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders a scroll viewport", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.getElementById("range-scroll-viewport")).not.toBeNull();
      });

      it("THEN renders a start dp-range-handle", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.getElementById("range-start-handle")).not.toBeNull();
      });

      it("THEN renders an end dp-range-handle", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.getElementById("range-end-handle")).not.toBeNull();
      });

      it("THEN renders start and end tooltip elements", () => {
        expect.assertions(2);
        expect(el.shadowRoot!.getElementById("range-tooltip-start")).not.toBeNull();
        expect(el.shadowRoot!.getElementById("range-tooltip-end")).not.toBeNull();
      });

      it("THEN exposes a timeline-overlays slot", () => {
        expect.assertions(1);
        const slot = el.shadowRoot!.querySelector('slot[name="timeline-overlays"]');
        expect(slot).not.toBeNull();
      });

      it("THEN exposes a track-overlays slot", () => {
        expect.assertions(1);
        const slot = el.shadowRoot!.querySelector('slot[name="track-overlays"]');
        expect(slot).not.toBeNull();
      });

      it("THEN end handle does not have live set", async () => {
        expect.assertions(1);
        const endHandle = el.shadowRoot!.getElementById("range-end-handle") as HTMLElement & { live: boolean; updateComplete: Promise<boolean> };
        await endHandle.updateComplete;
        expect(endHandle.live).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Prop binding
  // ---------------------------------------------------------------------------

  describe("GIVEN isLiveEdge=true", () => {
    beforeEach(async () => {
      el = createElement({ isLiveEdge: true });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the end handle has live=true", async () => {
        expect.assertions(1);
        const endHandle = el.shadowRoot!.getElementById("range-end-handle") as HTMLElement & { live: boolean; updateComplete: Promise<boolean> };
        await endHandle.updateComplete;
        expect(endHandle.live).toBe(true);
      });

      it("THEN the start handle does not have live=true", async () => {
        expect.assertions(1);
        const startHandle = el.shadowRoot!.getElementById("range-start-handle") as HTMLElement & { live: boolean; updateComplete: Promise<boolean> };
        await startHandle.updateComplete;
        expect(startHandle.live).toBe(false);
      });
    });
  });

  describe("GIVEN isLiveEdge updated from false to true", () => {
    beforeEach(async () => {
      el = createElement({ isLiveEdge: false });
      await el.updateComplete;
    });

    describe("WHEN isLiveEdge is set to true", () => {
      it("THEN the end handle live property updates", async () => {
        expect.assertions(1);
        el.isLiveEdge = true;
        await el.updateComplete;
        const endHandle = el.shadowRoot!.getElementById("range-end-handle") as HTMLElement & { live: boolean; updateComplete: Promise<boolean> };
        await endHandle.updateComplete;
        expect(endHandle.live).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering with rangeBounds
  // ---------------------------------------------------------------------------

  describe("GIVEN rangeBounds and start/end times", () => {
    beforeEach(async () => {
      el = createElement({
        rangeBounds: SAMPLE_BOUNDS,
        startTime: new Date(JAN_15),
        endTime: new Date(JAN_15 + 3600_000),
      });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the range-timeline element has an inline width style set", () => {
        expect.assertions(1);
        const timeline = el.shadowRoot!.getElementById("range-timeline") as HTMLElement;
        expect(timeline.style.width).not.toBe("");
      });

      it("THEN the range-selection element has inline left and width styles set", () => {
        expect.assertions(2);
        const selection = el.shadowRoot!.getElementById("range-selection") as HTMLElement;
        expect(selection.style.left).not.toBe("");
        expect(selection.style.width).not.toBe("");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Events — scroll
  // ---------------------------------------------------------------------------

  describe("GIVEN a rendered dp-range-timeline", () => {
    beforeEach(async () => {
      el = createElement({ rangeBounds: SAMPLE_BOUNDS });
      await el.updateComplete;
    });

    describe("WHEN the scroll viewport emits a scroll event", () => {
      it("THEN dp-range-scroll is dispatched on the host", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-range-scroll", handler);
        const viewport = el.shadowRoot!.getElementById("range-scroll-viewport")!;
        viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
        expect(handler).toHaveBeenCalledOnce();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Events — period buttons
  // ---------------------------------------------------------------------------

  describe("GIVEN rangeBounds with start/end times so scale renders period buttons", () => {
    beforeEach(async () => {
      el = createElement({
        rangeBounds: SAMPLE_BOUNDS,
        startTime: new Date(JAN_15),
        endTime: new Date(JAN_15 + 3600_000),
      });
      await el.updateComplete;
    });

    describe("WHEN a period button is hovered", () => {
      it("THEN dp-range-period-hover is dispatched", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-range-period-hover", handler);
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".range-period-button");
        button?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
        expect(handler).toHaveBeenCalledOnce();
      });
    });

    describe("WHEN a period button is left", () => {
      it("THEN dp-range-period-leave is dispatched", () => {
        expect.assertions(1);
        const hoverHandler = vi.fn();
        const leaveHandler = vi.fn();
        el.addEventListener("dp-range-period-hover", hoverHandler);
        el.addEventListener("dp-range-period-leave", leaveHandler);
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".range-period-button");
        // hover first so the internal _hoveredPeriodRange is set
        button?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
        button?.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
        expect(leaveHandler).toHaveBeenCalledOnce();
      });
    });

    describe("WHEN a period button is clicked", () => {
      it("THEN dp-range-period-select is dispatched with unit and startTime", () => {
        expect.assertions(2);
        const handler = vi.fn();
        el.addEventListener("dp-range-period-select", handler);
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".range-period-button");
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail).toMatchObject({ unit: expect.any(String), startTime: expect.any(Date) });
      });

      it("THEN dp-range-commit is dispatched", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-range-commit", handler);
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".range-period-button");
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(handler).toHaveBeenCalledOnce();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Events — handle hover shows tooltip
  // ---------------------------------------------------------------------------

  describe("GIVEN a rendered dp-range-timeline with rangeBounds and times", () => {
    beforeEach(async () => {
      el = createElement({
        rangeBounds: SAMPLE_BOUNDS,
        startTime: new Date(JAN_15),
        endTime: new Date(JAN_15 + 3600_000),
      });
      await el.updateComplete;
    });

    describe("WHEN dp-handle-hover fires on the start handle", () => {
      it("THEN the start tooltip becomes visible", async () => {
        expect.assertions(1);
        const startHandle = el.shadowRoot!.getElementById("range-start-handle")!;
        startHandle.dispatchEvent(new CustomEvent("dp-handle-hover", { bubbles: true, composed: true }));
        const tooltip = el.shadowRoot!.getElementById("range-tooltip-start")!;
        expect(tooltip.classList.contains("visible")).toBe(true);
      });
    });

    describe("WHEN dp-handle-hover fires on the end handle", () => {
      it("THEN the end tooltip becomes visible", async () => {
        expect.assertions(1);
        const endHandle = el.shadowRoot!.getElementById("range-end-handle")!;
        endHandle.dispatchEvent(new CustomEvent("dp-handle-hover", { bubbles: true, composed: true }));
        const tooltip = el.shadowRoot!.getElementById("range-tooltip-end")!;
        expect(tooltip.classList.contains("visible")).toBe(true);
      });
    });

    describe("WHEN dp-handle-leave fires after dp-handle-hover on the start handle", () => {
      it("THEN the start tooltip is no longer visible", () => {
        expect.assertions(1);
        const startHandle = el.shadowRoot!.getElementById("range-start-handle")!;
        startHandle.dispatchEvent(new CustomEvent("dp-handle-hover", { bubbles: true, composed: true }));
        startHandle.dispatchEvent(new CustomEvent("dp-handle-leave", { bubbles: true, composed: true }));
        const tooltip = el.shadowRoot!.getElementById("range-tooltip-start")!;
        expect(tooltip.classList.contains("visible")).toBe(false);
      });
    });
  });
});
