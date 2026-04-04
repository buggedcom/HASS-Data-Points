/**
 * history.spec.ts — GIVEN/WHEN/THEN tests for HassRecordsHistoryCard.
 *
 * We test the public API surface: setConfig validation/normalisation,
 * _entityIds getter, static helpers, and basic rendering.
 * Canvas drawing and comparison-window logic are left to integration tests.
 */
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/domain/chart-zoom.js", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    createChartZoomRange: vi.fn(() => null),
  };
});

vi.mock("@/lib/chart/chart-state.js", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    createHiddenEventIdSet: vi.fn(() => new Set()),
    createHiddenSeriesSet: vi.fn(() => new Set()),
  };
});

vi.mock("../../../components/annotation-dialog/annotation-dialog.js", () => ({
  HistoryAnnotationDialogController: vi.fn().mockImplementation(() => ({
    teardown: vi.fn(),
    open: vi.fn(),
  })),
}));

vi.mock("../../../lib/workers/history-analysis-client.js", () => ({
  computeHistoryAnalysisInWorker: vi.fn().mockResolvedValue(null),
}));

// Import the card AFTER mocks are set up
let HassRecordsHistoryCard: typeof import("../history.ts").HassRecordsHistoryCard;

beforeAll(async () => {
  ({ HassRecordsHistoryCard } = await import("../history.ts"));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockHass(overrides = {}) {
  return {
    states: {
      "sensor.example": {
        state: "22",
        attributes: {
          friendly_name: "Example Sensor",
          unit_of_measurement: "°C",
        },
      },
    },
    connection: {
      subscribeEvents: vi.fn().mockResolvedValue(vi.fn()),
      sendMessagePromise: vi.fn().mockResolvedValue({ events: [] }),
    },
    callService: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createCard(
  config: Record<string, unknown> = { entity: "sensor.example" }
) {
  const el = new HassRecordsHistoryCard();
  el.setConfig(config);
  return el;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("history", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ── setConfig validation ──────────────────────────────────────────────────

  describe("GIVEN a config without entity or entities", () => {
    describe("WHEN setConfig is called", () => {
      it("THEN it throws an error", () => {
        expect.assertions(1);
        const el = new HassRecordsHistoryCard();
        expect(() => el.setConfig({})).toThrow();
      });
    });
  });

  // ── setConfig normalisation ───────────────────────────────────────────────

  describe("GIVEN a minimal config with entity", () => {
    describe("WHEN setConfig is called", () => {
      it("THEN hours_to_show defaults to 24", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        expect((el as any)._config.hours_to_show).toBe(24);
      });

      it("THEN show_trend_lines defaults to false", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        expect((el as any)._config.show_trend_lines).toBe(false);
      });

      it("THEN show_data_gaps defaults to true", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        expect((el as any)._config.show_data_gaps).toBe(true);
      });

      it("THEN show_delta_tooltip defaults to true", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        expect((el as any)._config.show_delta_tooltip).toBe(true);
      });
    });
  });

  describe("GIVEN a config with explicit options", () => {
    describe("WHEN setConfig is called", () => {
      it("THEN hours_to_show is preserved", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example", hours_to_show: 48 });
        expect((el as any)._config.hours_to_show).toBe(48);
      });

      it("THEN show_trend_lines: true is preserved", () => {
        expect.assertions(1);
        const el = createCard({
          entity: "sensor.example",
          show_trend_lines: true,
        });
        expect((el as any)._config.show_trend_lines).toBe(true);
      });

      it("THEN show_data_gaps: false is preserved", () => {
        expect.assertions(1);
        const el = createCard({
          entity: "sensor.example",
          show_data_gaps: false,
        });
        expect((el as any)._config.show_data_gaps).toBe(false);
      });
    });
  });

  describe("GIVEN an identical config is set twice", () => {
    describe("WHEN setConfig is called the second time", () => {
      it("THEN _load is not called again (config unchanged guard)", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        const firstConfig = (el as any)._config;
        el.setConfig({ entity: "sensor.example" });
        // Config key should match — the card should be a no-op
        expect((el as any)._config).toEqual(firstConfig);
      });
    });
  });

  describe("GIVEN the card is connected", () => {
    describe("WHEN the inner chart applies a zoom range", () => {
      it("THEN the card re-dispatches hass-datapoints-chart-zoom with the committed range", async () => {
        expect.assertions(4);
        vi.useFakeTimers();
        const el = createCard({ entity: "sensor.example" });
        const loadSpy = vi
          .spyOn(el as unknown as { _load: () => Promise<void> }, "_load")
          .mockResolvedValue();
        const events: CustomEvent[] = [];
        el.addEventListener("hass-datapoints-chart-zoom", (ev) => {
          events.push(ev as CustomEvent);
        });
        document.body.appendChild(el);

        el.dispatchEvent(
          new CustomEvent("hass-datapoints-zoom-apply", {
            bubbles: true,
            composed: true,
            detail: { start: 100, end: 200 },
          })
        );

        expect(
          (
            el as unknown as {
              _zoomRange: { start: number; end: number } | null;
            }
          )._zoomRange
        ).toEqual({
          start: 100,
          end: 200,
        });
        expect(events).toHaveLength(1);
        expect(events[0].detail).toEqual({
          startTime: 100,
          endTime: 200,
          preview: false,
          source: "zoom",
        });
        vi.advanceTimersByTime(140);
        expect(loadSpy).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
      });

      it("THEN it redraws immediately and defers the reload", () => {
        expect.assertions(4);
        vi.useFakeTimers();
        const el = createCard({ entity: "sensor.example" });
        document.body.appendChild(el);
        (el as any)._lastHistResult = {
          "sensor.example": [{ lu: 1, s: "22" }],
        };
        (el as any)._lastStatsResult = {};
        (el as any)._lastEvents = [];
        (el as any)._lastT0 = 100;
        (el as any)._lastT1 = 200;
        const queueSpy = vi
          .spyOn(
            el as unknown as { _queueDrawChart: (...args: unknown[]) => void },
            "_queueDrawChart"
          )
          .mockImplementation(() => {});
        const loadSpy = vi
          .spyOn(el as unknown as { _load: () => Promise<void> }, "_load")
          .mockResolvedValue();

        el.dispatchEvent(
          new CustomEvent("hass-datapoints-zoom-apply", {
            bubbles: true,
            composed: true,
            detail: { start: 110, end: 190 },
          })
        );

        expect(queueSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledTimes(0);

        vi.advanceTimersByTime(140);

        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(
          (
            el as unknown as {
              _zoomRange: { start: number; end: number } | null;
            }
          )._zoomRange
        ).toEqual({
          start: 110,
          end: 190,
        });
        vi.useRealTimers();
      });
    });
  });

  // ── _entityIds getter ─────────────────────────────────────────────────────

  describe("GIVEN a config with a single entity string", () => {
    describe("WHEN _entityIds is accessed", () => {
      it("THEN it returns an array with that entity id", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.temp" });
        expect((el as any)._entityIds).toEqual(["sensor.temp"]);
      });
    });
  });

  describe("GIVEN a config with entities array (string items)", () => {
    describe("WHEN _entityIds is accessed", () => {
      it("THEN it returns all entity ids", () => {
        expect.assertions(1);
        const el = createCard({ entities: ["sensor.a", "sensor.b"] });
        expect((el as any)._entityIds).toEqual(["sensor.a", "sensor.b"]);
      });
    });
  });

  describe("GIVEN a config with entities array (object items)", () => {
    describe("WHEN _entityIds is accessed", () => {
      it("THEN it extracts entity_id or entity from each object", () => {
        expect.assertions(1);
        const el = createCard({
          entities: [{ entity_id: "sensor.x" }, { entity: "sensor.y" }],
        });
        expect((el as any)._entityIds).toEqual(["sensor.x", "sensor.y"]);
      });
    });
  });

  // ── Static API ────────────────────────────────────────────────────────────

  describe("GIVEN the static API", () => {
    describe("WHEN getStubConfig is called", () => {
      it("THEN it returns an object with entity and hours_to_show", () => {
        expect.assertions(2);
        const stub = HassRecordsHistoryCard.getStubConfig();
        expect(stub).toHaveProperty("entity");
        expect(stub).toHaveProperty("hours_to_show");
      });
    });

    describe("WHEN getConfigElement is called", () => {
      it("THEN it returns the editor element tag name", () => {
        expect.assertions(1);
        const editor = HassRecordsHistoryCard.getConfigElement();
        expect(editor.tagName.toLowerCase()).toBe(
          "hass-datapoints-history-card-editor"
        );
      });
    });
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe("GIVEN a card connected to the DOM with hass", () => {
    let el: HassRecordsHistoryCard;

    beforeEach(async () => {
      el = createCard({ entity: "sensor.example", title: "Test Chart" });
      el.hass = createMockHass() as any;
      document.body.appendChild(el);
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it has an ha-card wrapper", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("ha-card")).toBeTruthy();
      });

      it("THEN it shows the title in card-header", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.textContent).toContain("Test Chart");
      });

      it("THEN it has a canvas element", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("canvas")).toBeTruthy();
      });

      it("THEN it has a legend element", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("#legend, .legend")).toBeTruthy();
      });
    });
  });

  describe("GIVEN the inner chart is already mounted", () => {
    describe("WHEN only the comparison preview overlay changes", () => {
      it("THEN it updates the inner chart overlay immediately", () => {
        expect.assertions(2);
        const el = createCard({ entity: "sensor.example" });
        const chartTag = {
          _renderComparisonPreviewOverlay: vi.fn(),
        } as unknown as HTMLElement & Record<string, unknown>;
        vi.spyOn(
          el as unknown as { _chartEl: () => HTMLElement | null },
          "_chartEl"
        ).mockReturnValue(chartTag);

        el.setConfig({
          entity: "sensor.example",
          comparison_preview_overlay: {
            label: "February",
            window_range_label: "1 Feb – 28 Feb",
            actual_range_label: "1 Feb – 8 Feb",
          },
        });

        expect(chartTag._renderComparisonPreviewOverlay).toHaveBeenCalledTimes(
          1
        );
        expect((el as any)._config.comparison_preview_overlay).toEqual({
          label: "February",
          window_range_label: "1 Feb – 28 Feb",
          actual_range_label: "1 Feb – 8 Feb",
        });
      });
    });

    describe("WHEN a preloaded comparison window is already cached", () => {
      it("THEN it passes that comparison result to the inner chart during hover-only updates", () => {
        expect.assertions(3);
        const el = createCard({
          entity: "sensor.example",
          start_time: "2026-03-23T00:00:00.000Z",
          end_time: "2026-03-30T00:00:00.000Z",
        });
        const chartTag = {
          _renderComparisonPreviewOverlay: vi.fn(),
        } as unknown as HTMLElement & Record<string, unknown>;
        vi.spyOn(
          el as unknown as { _chartEl: () => HTMLElement | null },
          "_chartEl"
        ).mockReturnValue(chartTag);

        const preloadWindow = {
          id: "february",
          label: "February",
          time_offset_ms: -4320000000,
        };
        const winStart = new Date(
          new Date("2026-03-23T00:00:00.000Z").getTime() +
            preloadWindow.time_offset_ms
        );
        const winEnd = new Date(
          new Date("2026-03-30T00:00:00.000Z").getTime() +
            preloadWindow.time_offset_ms
        );
        const cacheKey = (el as any)._getComparisonCacheKey(
          preloadWindow,
          winStart,
          winEnd
        );
        (el as any)._comparisonDataCache.set(cacheKey, {
          ...preloadWindow,
          histResult: { "sensor.example": [{ lu: 1, s: "22" }] },
          statsResult: {},
        });

        el.setConfig({
          entity: "sensor.example",
          start_time: "2026-03-23T00:00:00.000Z",
          end_time: "2026-03-30T00:00:00.000Z",
          preload_comparison_windows: [preloadWindow],
          hovered_comparison_window_id: "february",
          comparison_preview_overlay: {
            label: "February",
            window_range_label: "1 Feb – 28 Feb",
            actual_range_label: "1 Feb – 8 Feb",
          },
        });

        expect(chartTag._renderComparisonPreviewOverlay).toHaveBeenCalledTimes(
          1
        );
        expect(Array.isArray((chartTag as any)._lastComparisonResults)).toBe(
          true
        );
        expect((chartTag as any)._lastComparisonResults).toHaveLength(1);
      });
    });
  });

  describe("GIVEN a card without a title", () => {
    describe("WHEN rendered", () => {
      it("THEN no card-header element is present", async () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example" });
        el.hass = createMockHass() as any;
        document.body.appendChild(el);
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector(".card-header")).toBeNull();
      });
    });
  });
});
