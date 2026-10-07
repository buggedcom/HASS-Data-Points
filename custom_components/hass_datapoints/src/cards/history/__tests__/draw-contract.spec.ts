/**
 * draw-contract.spec.ts — the typed card→chart draw contract (issue #20).
 *
 * The history card used to drive the inner history-chart by poking private
 * fields (`_config`, `_hiddenSeries`, `_zoomRange`, …) and then calling an
 * `unknown`-typed `_queueDrawChart`. These tests pin the replacement: a single
 * typed `draw(model)` entry on the chart, a `applyViewState(model)` state-push,
 * and the ownership rule that the chart — not the card — owns live zoom/hidden
 * interaction state (so a redraw can never clobber a user's zoom).
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { HistoryChart } from "../history-chart/history-chart";

// Import the card AFTER the chart element is registered.
let HassDatapointsHistoryCard: typeof import("../history.ts").HassDatapointsHistoryCard;

beforeAll(async () => {
  ({ HassDatapointsHistoryCard } = await import("../history.ts"));
});

function createCard(
  config: RecordWithUnknownValues = { entity: "sensor.example" }
) {
  const el = new HassDatapointsHistoryCard();
  el.setConfig(config);
  return el;
}

describe("card→chart draw contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // ── AC1 / AC3: the card draws via a single typed model ────────────────────
  describe("GIVEN the card queues a draw", () => {
    describe("WHEN it pushes data to the chart", () => {
      it("THEN it calls chartEl.draw once with one model carrying the draw inputs", () => {
        expect.assertions(6);
        const el = createCard({ entity: "sensor.example" });
        const drawSpy = vi.fn();
        vi.spyOn(
          el as unknown as {
            _chartEl: () => Nullable<RecordWithUnknownValues>;
          },
          "_chartEl"
        ).mockReturnValue({ draw: drawSpy });

        (
          el as unknown as {
            _queueDrawChart: (
              histResult: RecordWithUnknownValues,
              statsResult: RecordWithUnknownValues,
              events: unknown[],
              t0: number,
              t1: number
            ) => void;
          }
        )._queueDrawChart({ "sensor.example": [] }, {}, [], 100, 200);

        expect(drawSpy).toHaveBeenCalledTimes(1);
        const model = drawSpy.mock.calls[0][0] as RecordWithUnknownValues;
        expect(model.history).toEqual({ "sensor.example": [] });
        expect(model.events).toEqual([]);
        expect(model.t0).toBe(100);
        expect(model.t1).toBe(200);
        expect(model.config).toBeDefined();
      });

      it("THEN the model's events are the card-filtered events, not the raw list", () => {
        expect.assertions(2);
        const el = createCard({
          entity: "sensor.example",
          hidden_event_ids: ["evt-1"],
        });
        (el as unknown as { _hiddenEventIds: Set<string> })._hiddenEventIds =
          new Set(["evt-1"]);
        const drawSpy = vi.fn();
        vi.spyOn(
          el as unknown as {
            _chartEl: () => Nullable<RecordWithUnknownValues>;
          },
          "_chartEl"
        ).mockReturnValue({ draw: drawSpy });

        (
          el as unknown as {
            _queueDrawChart: (
              h: RecordWithUnknownValues,
              s: RecordWithUnknownValues,
              e: unknown[],
              t0: number,
              t1: number
            ) => void;
          }
        )._queueDrawChart(
          {},
          {},
          [{ id: "evt-1", timestamp: "2026-03-31T10:00:00Z" }],
          0,
          1
        );

        // The card still caches the raw events for resize replay…
        expect(
          (el as unknown as { _lastEvents: unknown[] })._lastEvents
        ).toHaveLength(1);
        // …but the chart is handed only the visible ones.
        const model = drawSpy.mock.calls[0][0] as { events: unknown[] };
        expect(model.events).toEqual([]);
      });
    });
  });

  // ── AC4: the resize replay goes through draw() ────────────────────────────
  describe("GIVEN the base-class ResizeObserver replays the last draw", () => {
    describe("WHEN _drawChart fires with the cached args", () => {
      it("THEN the override reassembles a model and delegates to chartEl.draw", () => {
        expect.assertions(4);
        const el = createCard({ entity: "sensor.example" });
        const drawSpy = vi.fn();
        vi.spyOn(
          el as unknown as {
            _chartEl: () => Nullable<RecordWithUnknownValues>;
          },
          "_chartEl"
        ).mockReturnValue({ draw: drawSpy });

        (el as unknown as { _drawChart: (...a: unknown[]) => void })._drawChart(
          { "sensor.example": [] },
          {},
          [],
          300,
          400,
          {
            loading: false,
          }
        );

        expect(drawSpy).toHaveBeenCalledTimes(1);
        const model = drawSpy.mock.calls[0][0] as RecordWithUnknownValues;
        expect(model.history).toEqual({ "sensor.example": [] });
        expect(model.t0).toBe(300);
        expect(model.t1).toBe(400);
      });
    });
  });

  // ── AC5: the chart owns live zoom/hidden state ────────────────────────────
  describe("GIVEN the user has zoomed (chart owns the zoom range)", () => {
    describe("WHEN draw(model) runs with a stale zoom in the model", () => {
      it("THEN the chart keeps the user's zoom rather than the model's", () => {
        expect.assertions(1);
        const chart = new HistoryChart();
        document.body.appendChild(chart);
        // Simulate a drag/scroll interaction: the chart set its own zoom.
        chart._zoomRange = { start: 100, end: 200 };

        chart.draw({
          hass: null,
          config: {},
          history: {},
          stats: {},
          events: [],
          t0: 0,
          t1: 1000,
          options: {},
          // A stale initial zoom the card happened to carry — must be ignored.
          zoomRange: { start: 999, end: 9999 },
        });

        expect(chart._zoomRange).toEqual({ start: 100, end: 200 });
      });
    });
  });

  describe("GIVEN a fresh config-driven view state", () => {
    describe("WHEN applyViewState(model) runs", () => {
      it("THEN the chart adopts the model's initial zoom and hidden series", () => {
        expect.assertions(2);
        const chart = new HistoryChart();
        document.body.appendChild(chart);

        chart.applyViewState({
          hass: null,
          config: {},
          zoomRange: { start: 5, end: 6 },
          hiddenSeries: new Set(["sensor.a"]),
        });

        expect(chart._zoomRange).toEqual({ start: 5, end: 6 });
        expect(chart._hiddenSeries.has("sensor.a")).toBe(true);
      });
    });
  });
});
