import { afterEach, describe, expect, it } from "vitest";
import { _hasActiveAnalysis, _hasConfiguredAnalysis } from "../target-row";
import { normalizeHistorySeriesAnalysis } from "@/lib/domain/history-series";
import type { NormalizedAnalysis } from "../types";

const withAggregate = (hide = false) =>
  normalizeHistorySeriesAnalysis({
    aggregates: [
      {
        id: "a1",
        operation: "state_duration",
        interval: "day",
        states: ["on"],
      },
    ],
    hide_source_series: hide,
  }) as unknown as NormalizedAnalysis;

describe("target-row aggregates", () => {
  let el: HTMLElement | undefined;
  afterEach(() => el?.remove());

  describe("GIVEN a row with an aggregate and no other analysis", () => {
    describe("WHEN checking analysis state", () => {
      it("THEN it is configured and active so Hide source series is enabled", () => {
        expect.assertions(2);
        expect(_hasConfiguredAnalysis(withAggregate())).toBe(true);
        expect(_hasActiveAnalysis(withAggregate(), false)).toBe(true);
      });
    });
  });

  describe("GIVEN a row whose last aggregate was removed", () => {
    describe("WHEN checking analysis state", () => {
      it("THEN it is inactive but keeps the stored hide preference", () => {
        expect.assertions(2);
        const analysis = normalizeHistorySeriesAnalysis({
          aggregates: [],
          hide_source_series: true,
        }) as unknown as NormalizedAnalysis;
        expect(_hasActiveAnalysis(analysis, false)).toBe(false);
        expect(analysis.hide_source_series).toBe(true);
      });
    });
  });

  describe("GIVEN an expanded binary row with display options enabled", () => {
    describe("WHEN rendered", () => {
      it("THEN the aggregate group and Hide source series are offered", async () => {
        expect.assertions(2);
        el = document.createElement("target-row");
        Object.assign(el, {
          entityId: "binary_sensor.front_door",
          showBinaryDisplay: true,
          analysis: { ...withAggregate(), expanded: true },
        });
        document.body.appendChild(el);
        await (el as HTMLElement & { updateComplete: Promise<boolean> })
          .updateComplete;
        expect(
          el.shadowRoot!.querySelector("analysis-aggregate-group")
        ).not.toBeNull();
        expect(el.shadowRoot!.textContent).toContain("Hide source series");
      });
    });
  });
});
