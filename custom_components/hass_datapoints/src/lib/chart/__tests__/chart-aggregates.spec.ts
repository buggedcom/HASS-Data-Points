import { describe, expect, it } from "vitest";
import {
  buildBinaryAggregateSeries,
  buildMeasurementAggregateSeries,
} from "@/lib/chart/chart-aggregates";
import type { AggregateDefinition } from "@/lib/domain/aggregation/types";

const start = Date.parse("2026-03-01T00:00:00Z");
const hour = 3600000;
const day = 24 * hour;
const sec = (ms: number) => ms / 1000;

const definition = (
  overrides: Partial<AggregateDefinition> = {}
): AggregateDefinition => ({
  id: "a1",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
  ...overrides,
});

const build = (
  definitions: AggregateDefinition[],
  stateList: { s: string; lu: number }[]
) =>
  buildBinaryAggregateSeries({
    entityId: "binary_sensor.front_door",
    entityLabel: "Front Door",
    color: "#ff9800",
    deviceClass: "door",
    definitions,
    stateList,
    range: { start, end: start + 2 * day },
    timeZone: "UTC",
  });

describe("buildBinaryAggregateSeries", () => {
  describe("GIVEN a door opened three times on day one and never on day two", () => {
    const stateList = [
      { s: "off", lu: sec(start) },
      { s: "on", lu: sec(start + hour) },
      { s: "off", lu: sec(start + 2 * hour) },
      { s: "on", lu: sec(start + 3 * hour) },
      { s: "off", lu: sec(start + 4 * hour) },
      { s: "on", lu: sec(start + 5 * hour) },
      { s: "off", lu: sec(start + 6 * hour) },
    ];
    describe("WHEN counting daily changes to open", () => {
      it("THEN draws bars of 3 and 0 at the period centres with a count axis", () => {
        expect.assertions(5);
        const [series] = build([definition()], stateList);
        expect(series.pts).toStrictEqual([
          [start + day / 2, 3],
          [start + day + day / 2, 0],
        ]);
        expect(series.bars).toBe(true);
        expect(series.axisKey).toBe("aggregate:count");
        expect(series.entityId).toBe("aggregate:binary_sensor.front_door:a1");
        expect(series.label).toBe(
          "Front Door · Daily · Count changes to a state (Open)"
        );
      });
    });
    describe("WHEN showing daily time open", () => {
      it("THEN reports minutes on a minutes axis", () => {
        expect.assertions(2);
        const [series] = build(
          [definition({ operation: "state_duration" })],
          stateList
        );
        expect(series.pts[0][1]).toBe(180);
        expect(series.unit).toBe("min");
      });
    });
    describe("WHEN two aggregates are configured", () => {
      it("THEN each gets an independent series", () => {
        expect.assertions(1);
        const out = build(
          [
            definition(),
            definition({ id: "a2", operation: "state_percentage" }),
          ],
          stateList
        );
        expect(out.map((s) => s.definitionId)).toStrictEqual(["a1", "a2"]);
      });
    });
  });

  describe("GIVEN a sensor with no recorded history", () => {
    describe("WHEN duration is requested", () => {
      it("THEN no bars are produced rather than zeros", () => {
        expect.assertions(1);
        expect(
          build([definition({ operation: "state_duration" })], [])
        ).toStrictEqual([]);
      });
    });
  });
});

describe("buildMeasurementAggregateSeries", () => {
  const readings = [2, 3, 10, 4, 6].map((v, i) => ({
    s: String(v),
    lu: sec(start + (i < 3 ? i : 24 + i) * hour),
  }));
  const run = (operation: AggregateDefinition["operation"]) =>
    buildMeasurementAggregateSeries({
      entityId: "sensor.temp",
      entityLabel: "Temperature",
      colors: ["#111111", "#222222"],
      definitions: [
        definition({ operation, states: undefined, interval: "day" }),
      ],
      stateList: readings,
      range: { start, end: start + 2 * day },
      timeZone: "UTC",
      unit: "°C",
      axisKey: "°C",
    });

  describe("GIVEN readings 2, 3, 10 on day one and 4, 6 on day two", () => {
    describe("WHEN showing the daily mean", () => {
      it("THEN draws a line of arithmetic means on the source axis", () => {
        expect.assertions(4);
        const [series] = run("mean");
        expect(series.pts.map(([, v]) => v)).toStrictEqual([5, 5]);
        expect(series.bars).toBe(false);
        expect(series.axisKey).toBe("°C");
        expect(series.color).toBe("#111111");
      });
    });
    describe("WHEN showing the daily maximum", () => {
      it("THEN reports the peak of each period", () => {
        expect.assertions(1);
        expect(run("max")[0].pts.map(([, v]) => v)).toStrictEqual([10, 6]);
      });
    });
    describe("WHEN a period has no readings", () => {
      it("THEN no point is produced for it", () => {
        expect.assertions(1);
        const out = buildMeasurementAggregateSeries({
          entityId: "sensor.temp",
          entityLabel: "Temperature",
          colors: ["#111111"],
          definitions: [definition({ operation: "mean", states: undefined })],
          stateList: [{ s: "5", lu: sec(start + hour) }],
          range: { start, end: start + 2 * day },
          timeZone: "UTC",
          unit: "°C",
          axisKey: "°C",
        });
        expect(out[0].pts).toHaveLength(1);
      });
    });
  });
});
