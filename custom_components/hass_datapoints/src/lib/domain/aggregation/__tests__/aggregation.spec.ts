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

const day = 24 * hour;
function dayInput(overrides: Partial<AggregateInput>): AggregateInput {
  return input({
    definition: {
      id: "a",
      operation: "transition_count",
      interval: "day",
      mode: "interval",
      resetOnZoom: false,
      states: ["on"],
    },
    range: { start, end: start + 2 * day },
    coverage: [{ start, end: start + 2 * day }],
    ...overrides,
  });
}

describe("GIVEN a door that opens twice with an initial open boundary", () => {
  describe("WHEN counting transitions into on", () => {
    it("THEN the boundary state is not counted as a transition", () => {
      expect.assertions(1);
      const result = calculateAggregate(
        dayInput({
          samples: [
            { time: start - hour, state: "on", boundary: true },
            { time: start + hour, state: "off" },
            { time: start + 2 * hour, state: "on" },
            { time: start + 3 * hour, state: "off" },
            { time: start + 4 * hour, state: "on" },
          ],
        })
      );
      expect(result.points[0].value).toBe(2);
    });
  });
  describe("WHEN counting all state changes", () => {
    it("THEN both directions are counted", () => {
      expect.assertions(1);
      const base = dayInput({});
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, states: [] },
        samples: [
          { time: start, state: "off" },
          { time: start + hour, state: "on" },
          { time: start + 2 * hour, state: "off" },
        ],
      });
      expect(result.points[0].value).toBe(2);
    });
  });
});

describe("GIVEN a sensor that goes unavailable between two on readings", () => {
  describe("WHEN counting transitions into on", () => {
    it("THEN recovery from unavailable is not counted", () => {
      expect.assertions(1);
      const result = calculateAggregate(
        dayInput({
          samples: [
            { time: start, state: "on" },
            { time: start + hour, state: "unavailable" },
            { time: start + 2 * hour, state: "on" },
          ],
        })
      );
      expect(result.points[0].value).toBe(0);
    });
  });
});

describe("GIVEN a door on for 6 hours then off", () => {
  const samples = [
    { time: start, state: "off" },
    { time: start + 6 * hour, state: "on" },
    { time: start + 12 * hour, state: "off" },
  ];
  const base = dayInput({ samples });
  describe("WHEN showing duration on", () => {
    it("THEN returns 360 minutes", () => {
      expect.assertions(2);
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "state_duration" },
      });
      expect(result.points[0].value).toBe(360);
      expect(result.presentation).toBe("bar");
    });
  });
  describe("WHEN showing percentage on", () => {
    it("THEN uses known time as the denominator", () => {
      expect.assertions(1);
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "state_percentage" },
        coverage: [{ start, end: start + 12 * hour }],
      });
      expect(result.points[0].value).toBe(50);
    });
  });
});

describe("GIVEN a day with no recorded history", () => {
  describe("WHEN counting events", () => {
    it("THEN the value is null and incomplete, not zero", () => {
      expect.assertions(2);
      const base = dayInput({ coverage: [] });
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "event_count" },
      });
      expect(result.points[0].value).toBeNull();
      expect(result.points[0].incomplete).toBe(true);
    });
  });
});

describe("GIVEN a button with single and double presses", () => {
  const samples = [
    { time: start + hour, eventType: "single_press" },
    { time: start + 2 * hour, eventType: "double_press" },
    { time: start + 3 * hour, eventType: "single_press" },
    { time: start - hour, eventType: "single_press", boundary: true },
  ];
  const base = dayInput({ samples });
  describe("WHEN selecting single_press", () => {
    it("THEN only those occurrences are counted", () => {
      expect.assertions(1);
      const result = calculateAggregate({
        ...base,
        definition: {
          ...base.definition,
          operation: "event_count",
          eventTypes: ["single_press"],
        },
      });
      expect(result.points[0].value).toBe(2);
    });
  });
  describe("WHEN selecting all types cumulatively", () => {
    it("THEN the running total begins at the first matching event", () => {
      expect.assertions(2);
      const result = calculateAggregate({
        ...base,
        definition: {
          ...base.definition,
          operation: "event_count",
          eventTypes: [],
          mode: "cumulative",
        },
        samples: [{ time: start + day + hour, eventType: "single_press" }],
      });
      expect(result.points.map((p) => p.value)).toEqual([1]);
      expect(result.presentation).toBe("line");
    });
  });
});

describe("GIVEN an energy meter reading 100, 110, then reset to 5", () => {
  const samples = [
    { time: start, value: 100 },
    { time: start + hour, value: 110 },
    { time: start + 2 * hour, value: 5 },
  ];
  const base = dayInput({ samples, stateClass: "total_increasing" });
  const definition = { ...base.definition, operation: "consumption" as const };
  describe("WHEN showing consumption", () => {
    it("THEN reflects consumption, not summed readings, and flags the reset", () => {
      expect.assertions(2);
      const result = calculateAggregate({ ...base, definition });
      expect(result.points[0].value).toBe(15);
      expect(result.points[0].reasons).toContain("reset");
    });
  });
  describe("WHEN the state class is unknown", () => {
    it("THEN a negative change is flagged ambiguous and not guessed", () => {
      expect.assertions(2);
      const result = calculateAggregate({
        ...base,
        stateClass: undefined,
        definition,
      });
      expect(result.points[0].value).toBe(10);
      expect(result.points[0].reasons).toContain("ambiguous-reset");
    });
  });
});

describe("GIVEN a bidirectional total meter", () => {
  describe("WHEN the total decreases", () => {
    it("THEN the signed change is retained", () => {
      expect.assertions(1);
      const base = dayInput({
        stateClass: "total",
        samples: [
          { time: start, value: 50 },
          { time: start + hour, value: 40 },
        ],
      });
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "consumption" },
      });
      expect(result.points[0].value).toBe(-10);
    });
  });
});

describe("GIVEN cumulative consumption with a zoomed range", () => {
  const samples = [
    { time: start, value: 0 },
    { time: start + hour, value: 10 },
    { time: start + day + hour, value: 30 },
  ];
  const zoom = { start: start + day, end: start + 2 * day };
  const base = dayInput({ samples, stateClass: "total_increasing", zoom });
  describe("WHEN reset on zoom is disabled", () => {
    it("THEN the full-range baseline is retained", () => {
      expect.assertions(1);
      const result = calculateAggregate({
        ...base,
        definition: {
          ...base.definition,
          operation: "consumption",
          mode: "cumulative",
        },
      });
      expect(result.points.map((p) => p.value)).toEqual([10, 30]);
    });
  });
  describe("WHEN reset on zoom is enabled", () => {
    it("THEN accumulation restarts within the zoomed range", () => {
      expect.assertions(1);
      const result = calculateAggregate({
        ...base,
        definition: {
          ...base.definition,
          operation: "consumption",
          mode: "cumulative",
          resetOnZoom: true,
        },
      });
      expect(result.points.map((p) => p.value)).toEqual([20]);
    });
  });
});

describe("GIVEN a range ending mid-day", () => {
  describe("WHEN aggregating by day", () => {
    it("THEN the edge bucket is partial and ignores later activity", () => {
      expect.assertions(2);
      const base = dayInput({
        range: { start, end: start + 12 * hour },
        coverage: [{ start, end: start + 12 * hour }],
        samples: [
          { time: start + hour, eventType: "press" },
          { time: start + 13 * hour, eventType: "press" },
        ],
      });
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "event_count" },
      });
      expect(result.points[0].partial).toBe(true);
      expect(result.points[0].value).toBe(1);
    });
  });
});

describe("GIVEN readings 1, 2, 3, 9 in one hour", () => {
  const samples = [1, 2, 3, 9].map((value, i) => ({
    time: start + i * 1000,
    value,
  }));
  it.each([
    ["min", 1],
    ["max", 9],
    ["median", 2.5],
    ["first", 1],
    ["last", 9],
  ] as const)("THEN %s is %d", (operation, expected) => {
    expect.assertions(2);
    const base = input({ samples });
    const result = calculateAggregate({
      ...base,
      definition: { ...base.definition, operation },
    });
    expect(result.points[0].value).toBe(expected);
    expect(result.presentation).toBe("line");
  });
});

describe("GIVEN HA statistics reporting hourly consumption", () => {
  describe("WHEN summing a day", () => {
    it("THEN uses the statistics change values directly", () => {
      expect.assertions(1);
      const base = dayInput({
        samples: [0.5, 1.5, 2].map((change, i) => ({
          time: start + i * hour,
          change,
        })),
      });
      const result = calculateAggregate({
        ...base,
        definition: { ...base.definition, operation: "consumption" },
      });
      expect(result.points[0].value).toBe(4);
    });
  });
});
