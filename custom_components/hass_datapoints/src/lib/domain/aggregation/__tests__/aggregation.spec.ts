import { describe, expect, it } from "vitest";
import { calculateAggregate } from "@/lib/domain/aggregation/aggregation";
import type { AggregateInput } from "@/lib/domain/aggregation/types";

const start = Date.parse("2026-01-01T00:00:00Z");
const hour = 3600000;
function input(overrides: Partial<AggregateInput> = {}): AggregateInput {
  return {
    definition: {
      id: "a",
      operation: "mean",
      interval: "hour",
      mode: "interval",
      resetOnZoom: false,
    },
    samples: [],
    range: { start, end: start + hour },
    timeZone: "UTC",
    coverage: [{ start, end: start + hour }],
    ...overrides,
  };
}
describe("GIVEN measurement readings 2, 3, and 10", () => {
  describe("WHEN displaying the hourly average", () => {
    it("THEN returns their arithmetic mean", () => {
      expect.assertions(1);
      expect(
        calculateAggregate(
          input({
            samples: [
              { time: start, value: 2 },
              { time: start + 1000, value: 3 },
              { time: start + 2000, value: 10 },
            ],
          })
        ).points[0].value
      ).toBe(5);
    });
  });
});
