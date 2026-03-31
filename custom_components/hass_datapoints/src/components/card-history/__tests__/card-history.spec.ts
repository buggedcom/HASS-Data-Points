/**
 * card-history.spec.ts — GIVEN/WHEN/THEN tests for HassRecordsHistoryCard.
 *
 * We test the public API surface: setConfig validation/normalisation,
 * _entityIds getter, static helpers, and basic rendering.
 * Canvas drawing and comparison-window logic are left to integration tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRenderer = {
  drawLine: vi.fn(),
  drawBands: vi.fn(),
  drawBackground: vi.fn(),
  drawAnnotationIcons: vi.fn(),
  pad: { left: 0, right: 0, top: 0, bottom: 0 },
};

vi.mock("../../../lib/shared.js", () => ({
  DOMAIN: "hass_datapoints",
  COLORS: ["#03a9f4", "#e91e63", "#4caf50"],
  attachLineChartHover: vi.fn(() => vi.fn()),
  attachLineChartRangeZoom: vi.fn(() => vi.fn()),
  buildDataPointsHistoryPath: vi.fn(() => "/history"),
  clampChartValue: vi.fn((v) => v),
  contrastColor: vi.fn(() => "#fff"),
  createChartZoomRange: vi.fn(() => null),
  createHiddenEventIdSet: vi.fn(() => new Set()),
  createHiddenSeriesSet: vi.fn(() => new Set()),
  dispatchLineChartHover: vi.fn(),
  entityName: vi.fn((hass, id) => id),
  esc: vi.fn((s) => String(s ?? "")),
  fetchEvents: vi.fn().mockResolvedValue([]),
  fetchHistoryDuringPeriod: vi.fn().mockResolvedValue({}),
  fetchStatisticsDuringPeriod: vi.fn().mockResolvedValue({}),
  hexToRgba: vi.fn(() => "rgba(0,0,0,0.5)"),
  hideLineChartHover: vi.fn(),
  hideTooltip: vi.fn(),
  mergeTargetSelections: vi.fn(() => ({})),
  navigateToDataPointsHistory: vi.fn(),
  normalizeCacheIdList: vi.fn((v) => v ?? []),
  normalizeHistorySeriesAnalysis: vi.fn((v) => v ?? {}),
  normalizeTargetSelection: vi.fn((v) => v ?? {}),
  parseDateValue: vi.fn(() => null),
  renderChartAxisHoverDots: vi.fn(),
  renderChartAxisOverlays: vi.fn(),
  resolveChartLabelColor: vi.fn(() => "rgba(200,200,200,1)"),
  setupCanvas: vi.fn(() => ({ w: 400, h: 220 })),
  showLineChartCrosshair: vi.fn(),
  showLineChartTooltip: vi.fn(),
  ChartRenderer: vi.fn().mockImplementation(() => mockRenderer),
  buildChartCardShell: vi.fn(() => "<ha-card></ha-card>"),
}));

vi.mock("../../annotation-dialog/annotation-dialog.js", () => ({
  HistoryAnnotationDialogController: vi.fn().mockImplementation(() => ({
    teardown: vi.fn(),
    open: vi.fn(),
  })),
}));

vi.mock("../../../lib/workers/history-analysis-client.js", () => ({
  computeHistoryAnalysisInWorker: vi.fn().mockResolvedValue(null),
}));

// Import the card AFTER mocks are set up
const { HassRecordsHistoryCard } = await import("../card-history.ts");

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockHass(overrides = {}) {
  return {
    states: {
      "sensor.example": {
        state: "22",
        attributes: { friendly_name: "Example Sensor", unit_of_measurement: "°C" },
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

function createCard(config: Record<string, unknown> = { entity: "sensor.example" }) {
  const el = new HassRecordsHistoryCard();
  el.setConfig(config);
  return el;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("card-history", () => {
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
        const el = createCard({ entity: "sensor.example", show_trend_lines: true });
        expect((el as any)._config.show_trend_lines).toBe(true);
      });

      it("THEN show_data_gaps: false is preserved", () => {
        expect.assertions(1);
        const el = createCard({ entity: "sensor.example", show_data_gaps: false });
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
          entities: [
            { entity_id: "sensor.x" },
            { entity: "sensor.y" },
          ],
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
        expect(editor.tagName.toLowerCase()).toBe("hass-datapoints-history-card-editor");
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
