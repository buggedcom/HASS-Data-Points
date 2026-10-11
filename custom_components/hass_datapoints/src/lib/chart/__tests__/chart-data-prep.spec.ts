import { describe, expect, it } from "vitest";
import {
  buildBinaryRenderModel,
  buildBinaryStateSpans,
  filterEvents,
  type BinaryRenderEntity,
} from "../chart-data-prep";

const makeEntity = (
  overrides: Partial<BinaryRenderEntity> & { entityId: string }
): BinaryRenderEntity => ({
  color: "#112233",
  label: overrides.entityId,
  onLabel: "on",
  offLabel: "off",
  stateList: [],
  ...overrides,
});

describe("chart-data-prep", () => {
  describe("GIVEN buildBinaryStateSpans", () => {
    describe("WHEN state list is empty", () => {
      it("THEN it returns empty", () => {
        expect.assertions(1);
        expect(buildBinaryStateSpans([], 0, 10000)).toEqual([]);
      });
    });

    describe("WHEN state list has one entry", () => {
      it("THEN it creates a single span to t1", () => {
        expect.assertions(2);
        const spans = buildBinaryStateSpans([{ lu: 1, s: "on" }], 0, 5000);
        expect(spans).toHaveLength(1);
        expect(spans[0]).toEqual({ start: 1000, end: 5000, state: "on" });
      });
    });

    describe("WHEN state list has multiple entries", () => {
      it("THEN it creates spans between transitions clamped to [t0, t1]", () => {
        expect.assertions(3);
        const spans = buildBinaryStateSpans(
          [
            { lu: 0, s: "off" },
            { lu: 2, s: "on" },
            { lu: 4, s: "off" },
          ],
          500,
          5000
        );
        expect(spans).toHaveLength(3);
        expect(spans[0]).toEqual({ start: 500, end: 2000, state: "off" });
        expect(spans[1]).toEqual({ start: 2000, end: 4000, state: "on" });
      });
    });

    describe("WHEN state transitions are outside [t0, t1]", () => {
      it("THEN those spans are excluded", () => {
        expect.assertions(1);
        const spans = buildBinaryStateSpans(
          [
            { lu: 0, s: "off" },
            { lu: 1, s: "on" },
          ],
          2000,
          5000
        );
        // First span end (1000) < t0 (2000), so only the last span remains
        expect(spans).toHaveLength(1);
      });
    });
  });

  describe("GIVEN buildBinaryRenderModel", () => {
    describe("WHEN a background sensor has on and off intervals", () => {
      it("THEN only the literal on spans are projected for shading", () => {
        expect.assertions(3);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.door",
              stateList: [
                { lu: 0, s: "off" },
                { lu: 2, s: "on" },
                { lu: 4, s: "off" },
              ],
            }),
          ],
          0,
          6000
        );
        expect(model.rows).toHaveLength(0);
        expect(model.backgrounds).toHaveLength(1);
        expect(model.backgrounds[0].spans).toEqual([
          { start: 2000, end: 4000, state: "on" },
        ]);
      });
    });

    describe("WHEN a background sensor reports unavailable and unknown states", () => {
      it("THEN non-on states are not shaded", () => {
        expect.assertions(1);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.door",
              stateList: [
                { lu: 0, s: "unavailable" },
                { lu: 2, s: "unknown" },
                { lu: 4, s: "off" },
              ],
            }),
          ],
          0,
          6000
        );
        expect(model.backgrounds[0].spans).toEqual([]);
      });
    });

    describe("WHEN a background sensor is always off", () => {
      it("THEN it is still represented with zero on spans for a legend entry", () => {
        expect.assertions(2);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.door",
              stateList: [{ lu: 0, s: "off" }],
            }),
          ],
          0,
          5000
        );
        expect(model.backgrounds).toHaveLength(1);
        expect(model.backgrounds[0].spans).toEqual([]);
      });
    });

    describe("WHEN a sensor has no state data in the window", () => {
      it("THEN it contributes neither a background nor a lane", () => {
        expect.assertions(2);
        const model = buildBinaryRenderModel(
          [makeEntity({ entityId: "binary_sensor.door", stateList: [] })],
          0,
          5000
        );
        expect(model.backgrounds).toHaveLength(0);
        expect(model.rows).toHaveLength(0);
      });
    });

    describe("WHEN binary_display is omitted", () => {
      it("THEN the sensor defaults to background mode", () => {
        expect.assertions(2);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.door",
              stateList: [{ lu: 0, s: "on" }],
            }),
          ],
          0,
          5000
        );
        expect(model.backgrounds).toHaveLength(1);
        expect(model.rows).toHaveLength(0);
      });
    });

    describe("WHEN a sensor is set to row mode", () => {
      it("THEN it is a row carrying the full on and off spans", () => {
        expect.assertions(2);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.door",
              binaryDisplay: "row",
              stateList: [
                { lu: 0, s: "off" },
                { lu: 2, s: "on" },
                { lu: 4, s: "off" },
              ],
            }),
          ],
          0,
          6000
        );
        expect(model.backgrounds).toHaveLength(0);
        expect(model.rows[0].spans).toEqual([
          { start: 0, end: 2000, state: "off" },
          { start: 2000, end: 4000, state: "on" },
          { start: 4000, end: 6000, state: "off" },
        ]);
      });
    });

    describe("WHEN several sensors are in row mode", () => {
      it("THEN lane indices are assigned deterministically in input order", () => {
        expect.assertions(3);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.a",
              binaryDisplay: "row",
              stateList: [{ lu: 0, s: "on" }],
            }),
            makeEntity({
              entityId: "binary_sensor.b",
              binaryDisplay: "background",
              stateList: [{ lu: 0, s: "on" }],
            }),
            makeEntity({
              entityId: "binary_sensor.c",
              binaryDisplay: "row",
              stateList: [{ lu: 0, s: "on" }],
            }),
          ],
          0,
          5000
        );
        expect(model.rows.map((r) => r.entityId)).toEqual([
          "binary_sensor.a",
          "binary_sensor.c",
        ]);
        expect(model.rows.map((r) => r.laneIndex)).toEqual([0, 1]);
        expect(model.backgrounds.map((b) => b.entityId)).toEqual([
          "binary_sensor.b",
        ]);
      });
    });

    describe("WHEN a row-mode sensor carries resolved labels and colour", () => {
      it("THEN the model preserves entity id, label, colour and labels", () => {
        expect.assertions(1);
        const model = buildBinaryRenderModel(
          [
            makeEntity({
              entityId: "binary_sensor.front",
              label: "Front Door",
              color: "#abcdef",
              onLabel: "open",
              offLabel: "closed",
              binaryDisplay: "row",
              stateList: [{ lu: 0, s: "on" }],
            }),
          ],
          0,
          5000
        );
        expect(model.rows[0]).toMatchObject({
          entityId: "binary_sensor.front",
          label: "Front Door",
          color: "#abcdef",
          onLabel: "open",
          offLabel: "closed",
          laneIndex: 0,
        });
      });
    });
  });

  describe("GIVEN filterEvents", () => {
    const events = [
      {
        id: "e1",
        message: "Turned on lights",
        annotation: "",
        entity_ids: ["light.living"],
      },
      {
        id: "e2",
        message: "Temperature alert",
        annotation: "Hot",
        entity_ids: ["sensor.temp"],
      },
      {
        id: "e3",
        message: "Door opened",
        annotation: "",
        entity_ids: ["binary_sensor.door"],
      },
    ];

    describe("WHEN no hidden IDs and no filter", () => {
      it("THEN all events are returned", () => {
        expect.assertions(1);
        expect(filterEvents(events, new Set(), "")).toHaveLength(3);
      });
    });

    describe("WHEN some events are hidden", () => {
      it("THEN hidden events are excluded", () => {
        expect.assertions(1);
        expect(filterEvents(events, new Set(["e2"]), "")).toHaveLength(2);
      });
    });

    describe("WHEN a message filter is applied", () => {
      it("THEN only matching events are returned", () => {
        expect.assertions(2);
        const result = filterEvents(events, new Set(), "temperature");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("e2");
      });
    });

    describe("WHEN filter matches annotation text", () => {
      it("THEN matching events are returned", () => {
        expect.assertions(1);
        const result = filterEvents(events, new Set(), "hot");
        expect(result).toHaveLength(1);
      });
    });

    describe("WHEN filter matches entity_id", () => {
      it("THEN matching events are returned", () => {
        expect.assertions(1);
        const result = filterEvents(events, new Set(), "light.living");
        expect(result).toHaveLength(1);
      });
    });

    describe("WHEN both hidden and filter are applied", () => {
      it("THEN hidden events are excluded before filtering", () => {
        expect.assertions(1);
        const result = filterEvents(events, new Set(["e2"]), "temperature");
        expect(result).toHaveLength(0);
      });
    });
  });
});
