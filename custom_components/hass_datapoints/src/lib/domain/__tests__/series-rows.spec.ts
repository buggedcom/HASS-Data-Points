import { describe, expect, it } from "vitest";
import { mergeSavedSeriesRows } from "../series-rows";
import { normalizeHistorySeriesAnalysis } from "../history-series";

describe("series-rows", () => {
  describe("GIVEN mergeSavedSeriesRows", () => {
    const makeRow = (entityId: string, color = "#ff0000") => ({
      entity_id: entityId,
      color,
      visible: true,
      analysis: normalizeHistorySeriesAnalysis(null),
    });

    describe("WHEN savedRows is empty", () => {
      it("THEN returns the original rows unchanged", () => {
        expect.assertions(2);
        const rows = [makeRow("sensor.temp")];
        const result = mergeSavedSeriesRows(rows, []);
        expect(result).toHaveLength(1);
        expect(result[0].color).toBe("#ff0000");
      });
    });

    describe("WHEN savedRows has matching entities", () => {
      it("THEN applies saved color, visible, and analysis", () => {
        expect.assertions(2);
        const rows = [makeRow("sensor.temp", "#ff0000")];
        const saved = [makeRow("sensor.temp", "#00ff00")];
        const result = mergeSavedSeriesRows(rows, saved);
        expect(result).toHaveLength(1);
        expect(result[0].color).toBe("#00ff00");
      });
    });

    describe("WHEN savedRows has no matching entities", () => {
      it("THEN returns the original rows unchanged", () => {
        expect.assertions(2);
        const rows = [makeRow("sensor.temp")];
        const saved = [makeRow("sensor.humidity", "#00ff00")];
        const result = mergeSavedSeriesRows(rows, saved);
        expect(result).toHaveLength(1);
        expect(result[0].color).toBe("#ff0000");
      });
    });

    describe("WHEN rows is null", () => {
      it("THEN returns an empty array", () => {
        expect.assertions(1);
        const result = mergeSavedSeriesRows(null, [makeRow("sensor.temp")]);
        expect(result).toEqual([]);
      });
    });

    describe("WHEN savedRows preserves visibility state", () => {
      it("THEN uses the saved visible value", () => {
        expect.assertions(1);
        const rows = [makeRow("sensor.temp")];
        const saved = [{ ...makeRow("sensor.temp"), visible: false }];
        const result = mergeSavedSeriesRows(rows, saved);
        expect(result[0].visible).toBe(false);
      });
    });
  });
});
