import { describe, expect, it } from "vitest";
import { computeZoomLevelForSpan, DAY_MS } from "../timeline-scale";

describe("computeZoomLevelForSpan", () => {
  describe("WHEN span is >= 180 days", () => {
    it("THEN returns 'quarterly'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(180 * DAY_MS)).toBe("quarterly");
    });
  });

  describe("WHEN span is >= 120 days but < 180 days", () => {
    it("THEN returns 'month_compressed'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(120 * DAY_MS)).toBe("month_compressed");
    });
  });

  describe("WHEN span is >= 60 days but < 120 days", () => {
    it("THEN returns 'month_short'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(60 * DAY_MS)).toBe("month_short");
    });
  });

  describe("WHEN span is >= 21 days but < 60 days", () => {
    it("THEN returns 'month_expanded'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(21 * DAY_MS)).toBe("month_expanded");
    });
  });

  describe("WHEN span is >= 7 days but < 21 days", () => {
    it("THEN returns 'week_compressed'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(7 * DAY_MS)).toBe("week_compressed");
    });
  });

  describe("WHEN span is >= 2 days but < 7 days", () => {
    it("THEN returns 'week_expanded'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(2 * DAY_MS)).toBe("week_expanded");
    });
  });

  describe("WHEN span is < 2 days", () => {
    it("THEN returns 'day'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(DAY_MS)).toBe("day");
    });
  });

  describe("WHEN span is very small (below minimum)", () => {
    it("THEN clamps to minimum and returns 'day'", () => {
      expect.assertions(1);
      expect(computeZoomLevelForSpan(100)).toBe("day");
    });
  });
});
