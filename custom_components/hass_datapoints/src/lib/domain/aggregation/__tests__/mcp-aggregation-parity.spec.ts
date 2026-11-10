import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateAggregate } from "../calculate";
import { AGGREGATE_OPERATIONS, type AggregateInput } from "../types";

const HOUR = 3_600_000;
const start = Date.parse("2026-03-29T00:00:00+02:00");
const range = { start, end: start + 25 * HOUR };
const samples = [
  { time: start - 1, state: "off", value: 40 },
  { time: start + HOUR, state: "on", value: 44, eventType: "press" },
  { time: start + 2 * HOUR, state: "unavailable" },
  { time: start + 3 * HOUR, state: "off", value: 2, eventType: "release" },
  { time: start + 24 * HOUR, state: "on", value: 7, eventType: "press" },
];

const cases: AggregateInput[] = AGGREGATE_OPERATIONS.map((operation) => ({
  range,
  samples,
  stateClass: "total_increasing",
  timeZone: "Europe/Helsinki",
  coverage: [
    { start, end: start + 2 * HOUR },
    { start: start + 3 * HOUR, end: range.end },
  ],
  definition: {
    id: operation,
    operation,
    interval: "day",
    mode: "interval",
    states: ["on"],
    eventTypes: ["press"],
    resetOnZoom: false,
  },
}));

cases.push({
  ...cases[6],
  zoom: { start: start + HOUR, end: range.end },
  definition: { ...cases[6].definition, mode: "cumulative", resetOnZoom: true },
});

describe("GIVEN chart aggregates across a daylight saving transition", () => {
  describe("WHEN the frontend and native MCP backend aggregate the same data", () => {
    it("THEN all operations and the cumulative zoom reset match", () => {
      expect.assertions(cases.length);
      const python =
        process.env.PYTHON_BIN ?? join(process.cwd(), ".venv/bin/python3");
      const directory = join(
        process.cwd(),
        "custom_components/hass_datapoints"
      );
      const run = spawnSync(
        python,
        [
          "-c",
          `
import json, sys
sys.path.insert(0, sys.argv[1])
from aggregation import calculate_aggregate
json.dump([calculate_aggregate(case) for case in json.load(sys.stdin)], sys.stdout)
`,
          directory,
        ],
        { input: JSON.stringify(cases), encoding: "utf-8" }
      );
      if (run.status !== 0 || run.error) {
        throw new Error(
          `Python aggregation failed: ${run.error ?? run.stderr}`
        );
      }
      const backend = JSON.parse(run.stdout) as unknown[];
      cases.forEach((input, index) => {
        expect(backend[index], input.definition.operation).toEqual(
          calculateAggregate(input)
        );
      });
    });
  });
});
