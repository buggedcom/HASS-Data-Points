import { describe, expect, it } from "vitest";
import {
  buildBinaryAggregateSeries,
  buildConsumptionAggregateSeries,
  buildEventAggregateSeries,
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
      color: "#111111",
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
          color: "#111111",
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

describe("buildEventAggregateSeries", () => {
  const state = (type: string, at: number, recordedAt = at) => ({
    s: new Date(at).toISOString(),
    lu: sec(recordedAt),
    a: { event_type: type },
  });
  const states = [
    // Initial snapshot recorded at the start of the range: not an occurrence.
    state("single_press", start - 5 * hour, start),
    state("single_press", start + hour),
    state("double_press", start + 2 * hour),
    state("single_press", start + day + hour),
    { s: "unavailable", lu: sec(start + day + 2 * hour) },
  ];
  const run = (eventTypes: string[]) =>
    buildEventAggregateSeries({
      entityId: "event.button",
      entityLabel: "Button",
      color: "#4caf50",
      definitions: [
        definition({
          operation: "event_count",
          states: undefined,
          eventTypes,
        }),
      ],
      states,
      range: { start, end: start + 2 * day },
      timeZone: "UTC",
    });

  describe("GIVEN single and double presses with an initial snapshot", () => {
    describe("WHEN counting all event types", () => {
      it("THEN occurrences are counted per day and the snapshot is ignored", () => {
        expect.assertions(2);
        const [series] = run([]);
        expect(series.pts.map(([, v]) => v)).toStrictEqual([2, 1]);
        expect(series.label).toBe("Button · Daily · All event types");
      });
    });
    describe("WHEN selecting only double_press", () => {
      it("THEN other types are not counted and zero-activity days stay zero", () => {
        expect.assertions(1);
        const [series] = run(["double_press"]);
        expect(series.pts.map(([, v]) => v)).toStrictEqual([1, 0]);
      });
    });
    describe("WHEN the required attribute is absent", () => {
      it("THEN those states are not counted as events", () => {
        expect.assertions(1);
        const out = buildEventAggregateSeries({
          entityId: "event.button",
          entityLabel: "Button",
          color: "#4caf50",
          definitions: [
            definition({ operation: "event_count", states: undefined }),
          ],
          states: [
            { s: new Date(start + hour).toISOString(), lu: sec(start + hour) },
          ],
          range: { start, end: start + 2 * day },
          timeZone: "UTC",
        });
        expect(out.flatMap((s) => s.pts.map(([, v]) => v))).toStrictEqual([
          0, 0,
        ]);
      });
    });
  });
});

describe("buildConsumptionAggregateSeries", () => {
  const consumption = definition({
    operation: "consumption",
    states: undefined,
  });
  const run = (args: {
    changes?: { time: number; change: number }[];
    readings?: { s: string; lu: number }[];
    stateClass?: string;
  }) =>
    buildConsumptionAggregateSeries({
      entityId: "sensor.energy",
      entityLabel: "Energy",
      color: "#ff9800",
      definitions: [consumption],
      changes: args.changes ?? [],
      readings: args.readings ?? [],
      stateClass: args.stateClass,
      unit: "kWh",
      range: { start, end: start + 2 * day },
      timeZone: "UTC",
    });

  describe("GIVEN a meter reading 1000 then 1010 then 1012", () => {
    const readings = [
      { s: "1000", lu: sec(start) },
      { s: "1010", lu: sec(start + hour) },
      { s: "1012", lu: sec(start + day + hour) },
    ];
    describe("WHEN showing daily consumption", () => {
      it("THEN draws consumption bars on their own kWh axis, not the meter reading", () => {
        expect.assertions(3);
        const [series] = run({ readings, stateClass: "total_increasing" });
        expect(series.pts.map(([, v]) => v)).toStrictEqual([10, 2]);
        expect(series.axisKey).toBe("aggregate:kWh");
        expect(series.bars).toBe(true);
      });
    });
  });

  describe("GIVEN a meter that resets mid-day", () => {
    describe("WHEN showing daily consumption", () => {
      it("THEN counts post-reset usage and notes the reset", () => {
        expect.assertions(2);
        const [series] = run({
          readings: [
            { s: "100", lu: sec(start) },
            { s: "110", lu: sec(start + hour) },
            { s: "5", lu: sec(start + 2 * hour) },
          ],
          stateClass: "total_increasing",
        });
        expect(series.pts[0][1]).toBe(15);
        expect(series.periodNotes?.[0]).toBe("Meter reset detected");
      });
    });
  });

  describe("GIVEN statistics for day one and a raw reading after the last statistic", () => {
    describe("WHEN showing daily consumption", () => {
      it("THEN statistics cover compiled hours and readings bridge the rest", () => {
        expect.assertions(1);
        const [series] = run({
          changes: [
            { time: start, change: 1 },
            { time: start + hour, change: 2 },
          ],
          readings: [
            { s: "50", lu: sec(start + 2 * hour) },
            { s: "53", lu: sec(start + 3 * hour) },
          ],
          stateClass: "total_increasing",
        });
        expect(series.pts[0][1]).toBe(6);
      });
    });
  });

  describe("GIVEN no statistics and no readings", () => {
    describe("WHEN showing consumption", () => {
      it("THEN no series is produced", () => {
        expect.assertions(1);
        expect(run({})).toStrictEqual([]);
      });
    });
  });
});

describe("cumulative aggregate series", () => {
  const states = [
    { s: "off", lu: sec(start) },
    { s: "on", lu: sec(start + hour) },
    { s: "off", lu: sec(start + 2 * hour) },
    { s: "on", lu: sec(start + day + hour) },
  ];
  const run = (resetOnZoom: boolean, zoom?: { start: number; end: number }) =>
    buildBinaryAggregateSeries({
      entityId: "binary_sensor.front_door",
      entityLabel: "Front Door",
      color: "#ff9800",
      deviceClass: "door",
      definitions: [definition({ mode: "cumulative", resetOnZoom })],
      stateList: states,
      range: { start, end: start + 2 * day },
      zoom,
      timeZone: "UTC",
    });

  describe("GIVEN a cumulative count of openings across two days", () => {
    describe("WHEN no zoom is applied", () => {
      it("THEN draws a running total line labelled cumulative", () => {
        expect.assertions(3);
        const [series] = run(false);
        expect(series.pts.map(([, v]) => v)).toStrictEqual([1, 2]);
        expect(series.bars).toBe(false);
        expect(series.label).toContain("Cumulative");
      });
    });
    describe("WHEN zoomed to day two without reset", () => {
      it("THEN the full-range baseline is kept", () => {
        expect.assertions(1);
        const [series] = run(false, {
          start: start + day,
          end: start + 2 * day,
        });
        expect(series.pts.map(([, v]) => v)).toStrictEqual([1, 2]);
      });
    });
    describe("WHEN zoomed to day two with reset enabled", () => {
      it("THEN accumulation restarts inside the zoom", () => {
        expect.assertions(1);
        const [series] = run(true, {
          start: start + day,
          end: start + 2 * day,
        });
        expect(series.pts.map(([, v]) => v)).toStrictEqual([1]);
      });
    });
  });
});

describe("aggregates for a comparison window", () => {
  // London springs forward on 30 March 2025; the window is the week before.
  const week = 7 * day;
  const mainStart = Date.parse("2025-04-05T23:00:00Z");
  const windowStart = mainStart - week;
  const toggles = [
    { s: "off", lu: sec(windowStart) },
    { s: "on", lu: sec(Date.parse("2025-03-29T23:30:00Z")) },
    { s: "off", lu: sec(Date.parse("2025-03-30T09:00:00Z")) },
  ];
  const run = (range: { start: number; end: number }) =>
    buildBinaryAggregateSeries({
      entityId: "binary_sensor.front_door",
      entityLabel: "Front Door",
      color: "#ff9800",
      deviceClass: "door",
      definitions: [
        definition({ operation: "state_duration", states: ["on"] }),
      ],
      stateList: toggles,
      range,
      timeZone: "Europe/London",
    })[0];

  describe("GIVEN a window range spanning a spring-forward day", () => {
    describe("WHEN calculated against its own calendar", () => {
      it("THEN the 23-hour local day is a single period with original dates", () => {
        expect.assertions(3);
        const series = run({ start: windowStart, end: windowStart + 2 * day });
        const spring = series.periods.find(
          (period) => period.start === Date.parse("2025-03-30T00:00:00Z")
        );
        expect(spring).toBeDefined();
        expect(spring!.end - spring!.start).toBe(23 * hour);
        expect(series.result.points[1].partial).toBe(false);
      });
    });
  });

  describe("GIVEN a window result shifted onto the main range", () => {
    describe("WHEN subtracting the window offset", () => {
      it("THEN positions move while the calculated periods keep their dates", () => {
        expect.assertions(2);
        const series = run({ start: windowStart, end: windowStart + 2 * day });
        const offset = -week;
        const shifted = series.pts.map(([time]) => time - offset);
        expect(shifted[0]).toBe(series.pts[0][0] + week);
        expect(series.periods[0].start).toBeLessThan(mainStart);
      });
    });
  });
});

describe("coverage flags", () => {
  const stateList = [
    { s: "off", lu: sec(start + 6 * hour) },
    { s: "on", lu: sec(start + 8 * hour) },
    { s: "unavailable", lu: sec(start + 12 * hour) },
    { s: "on", lu: sec(start + 16 * hour) },
  ];
  const run = (range: { start: number; end: number }) =>
    buildBinaryAggregateSeries({
      entityId: "binary_sensor.front_door",
      entityLabel: "Front Door",
      color: "#ff9800",
      deviceClass: "door",
      definitions: [definition({ operation: "state_duration" })],
      stateList,
      range,
      timeZone: "UTC",
    })[0];

  describe("GIVEN a range cutting the day short and an unavailable gap", () => {
    describe("WHEN calculated", () => {
      it("THEN partial and incomplete are flagged separately with tooltip notes", () => {
        expect.assertions(4);
        const series = run({ start, end: start + 20 * hour });
        const [flags] = series.periodFlags!;
        expect(flags.partial).toBe(true);
        expect(flags.incomplete).toBe(true);
        expect(series.periodNotes![0]).toContain("Partial period");
        expect(series.periodNotes![0]).toContain("Incomplete history");
      });
    });
    describe("WHEN the range covers the whole day with no gaps", () => {
      it("THEN the period is neither partial nor incomplete", () => {
        expect.assertions(2);
        const series = buildBinaryAggregateSeries({
          entityId: "binary_sensor.front_door",
          entityLabel: "Front Door",
          color: "#ff9800",
          definitions: [definition({ operation: "state_duration" })],
          stateList: [{ s: "on", lu: sec(start) }],
          range: { start, end: start + day },
          timeZone: "UTC",
        })[0];
        expect(series.periodFlags![0]).toStrictEqual({
          partial: false,
          incomplete: false,
        });
        expect(series.periodNotes![0]).toBe("");
      });
    });
  });
});

describe("aggregate line styling", () => {
  const readings = [2, 3].map((v, i) => ({
    s: String(v),
    lu: sec(start + i * hour),
  }));
  const run = (operation: AggregateDefinition["operation"]) =>
    buildMeasurementAggregateSeries({
      entityId: "sensor.temp",
      entityLabel: "Temperature",
      color: "#ff9800",
      definitions: [definition({ operation, states: undefined })],
      stateList: readings,
      range: { start, end: start + day },
      timeZone: "UTC",
      unit: "°C",
      axisKey: "°C",
    })[0];

  describe("GIVEN aggregates of different types on the same row", () => {
    describe("WHEN built", () => {
      it("THEN they share the source colour but have distinct dash patterns", () => {
        expect.assertions(2);
        const ops = ["mean", "min", "max", "median", "first", "last"] as const;
        const series = ops.map(run);
        expect(new Set(series.map((s) => s.color))).toStrictEqual(
          new Set(["#ff9800"])
        );
        expect(
          new Set(series.map((s) => JSON.stringify(s.dashPattern))).size
        ).toBe(ops.length);
      });
    });
  });
});
