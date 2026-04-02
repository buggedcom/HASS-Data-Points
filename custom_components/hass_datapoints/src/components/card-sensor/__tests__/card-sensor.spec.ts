import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { HassRecordsSensorCard } from "../card-sensor.ts";
import type { EventRecord } from "@/lib/types";

import { fetchEvents } from "@/lib/shared";

vi.mock("@/lib/shared.js", async (importOriginal) => {
  const mod = await importOriginal() as Record<string, unknown>;
  const mockRenderer = {
    pad: {},
    labelColor: "",
    clear: vi.fn(),
    drawGrid: vi.fn(),
    drawLine: vi.fn(),
    drawAnnotations: vi.fn(),
    drawAnnotationsOnLine: vi.fn().mockReturnValue([]),
    drawAnnotationLinesOnLine: vi.fn().mockReturnValue([]),
    _activeAxes: [],
  };
  return {
    ...mod,
    fetchEvents: vi.fn().mockResolvedValue([]),
    setupCanvas: vi.fn().mockReturnValue({ w: 400, h: 220 }),
    resolveChartLabelColor: vi.fn().mockReturnValue("#ccc"),
    renderChartAxisOverlays: vi.fn(),
    attachLineChartHover: vi.fn().mockReturnValue(() => {}),
    attachTooltipBehaviour: vi.fn(),
    showTooltip: vi.fn(),
    hideTooltip: vi.fn(),
    contrastColor: vi.fn().mockReturnValue("#fff"),
    fmtDateTime: vi.fn().mockReturnValue("2026-03-31 10:00"),
    fmtRelativeTime: vi.fn().mockReturnValue("2 hours ago"),
    navigateToDataPointsHistory: vi.fn(),
    COLORS: ["#03a9f4"],
    AMBER: "#ffb300",
    ChartRenderer: vi.fn().mockImplementation(() => mockRenderer),
  };
});

if (!customElements.get("hass-datapoints-sensor-card")) {
  customElements.define("hass-datapoints-sensor-card", HassRecordsSensorCard);
}

const mockEvents: EventRecord[] = [
  {
    id: "evt-1",
    message: "Test event",
    annotation: "Full note",
    icon: "mdi:bookmark",
    color: "#03a9f4",
    timestamp: "2026-03-31T10:00:00Z",
    entity_id: "sensor.temperature",
    device_id: null,
    area_id: null,
    label_id: null,
    dev: false,
  },
  {
    id: "evt-2",
    message: "Second event",
    annotation: null,
    icon: "mdi:star",
    color: "#ff5722",
    timestamp: "2026-03-31T09:00:00Z",
    entity_id: "sensor.temperature",
    device_id: null,
    area_id: null,
    label_id: null,
    dev: false,
  },
];

function createCard(config: Record<string, unknown> = {}) {
  const el = document.createElement("hass-datapoints-sensor-card") as any;
  document.body.appendChild(el);
  el.setConfig({ entity: "sensor.temperature", ...config });
  return el;
}

async function setupCard(config: Record<string, unknown> = {}, events: EventRecord[] = []) {
  vi.mocked(fetchEvents).mockResolvedValue(events as any);
  const el = createCard(config);
  const hass = createMockHass({
    connection: {
      subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
      sendMessagePromise: vi.fn().mockResolvedValue({}),
    },
    callService: vi.fn(() => Promise.resolve()),
  });
  el.hass = hass;
  await el.updateComplete;
  return el;
}

describe("card-sensor", () => {
  let el: any;

  afterEach(() => {
    el?.remove();
    vi.clearAllMocks();
  });

  describe("GIVEN a card with default config", () => {
    beforeEach(async () => {
      el = await setupCard();
    });

    describe("WHEN rendered", () => {
      it("THEN it has an ha-card wrapper", () => {
        expect(el.shadowRoot.querySelector("ha-card")).toBeTruthy();
      });

      it("THEN it shows the entity name", () => {
        // Friendly name from mock hass state
        expect(el.shadowRoot.textContent).toContain("Temperature");
      });

      it("THEN it shows the sensor value", () => {
        expect(el.shadowRoot.textContent).toContain("22.5");
      });

      it("THEN it shows the unit of measurement", () => {
        expect(el.shadowRoot.textContent).toContain("°C");
      });

      it("THEN it has a canvas element for the chart", () => {
        expect(el.shadowRoot.querySelector("canvas#chart")).toBeTruthy();
      });

      it("THEN no annotation section is shown by default", () => {
        const annSection = el.shadowRoot.querySelector(".ann-section");
        expect(annSection).toBeNull();
      });
    });
  });

  describe("GIVEN a card with a custom name", () => {
    beforeEach(async () => {
      el = await setupCard({ name: "My Sensor" });
    });

    describe("WHEN rendered", () => {
      it("THEN it shows the custom name", () => {
        expect(el.shadowRoot.textContent).toContain("My Sensor");
      });
    });
  });

  describe("GIVEN setConfig without entity", () => {
    describe("WHEN setConfig is called", () => {
      it("THEN it throws an error", () => {
        const bare = document.createElement("hass-datapoints-sensor-card") as any;
        expect(() => bare.setConfig({})).toThrow();
      });
    });
  });

  describe("GIVEN a card with show_records: true and events", () => {
    beforeEach(async () => {
      el = await setupCard({ show_records: true }, mockEvents);
      await el._load();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the annotation section is visible", () => {
        expect(el.shadowRoot.querySelector(".ann-section")).toBeTruthy();
      });

      it("THEN it shows the event messages", () => {
        expect(el.shadowRoot.textContent).toContain("Test event");
        expect(el.shadowRoot.textContent).toContain("Second event");
      });
    });
  });

  describe("GIVEN a card with show_records: true and paginated events", () => {
    beforeEach(async () => {
      const manyEvents = Array.from({ length: 5 }, (_, i) => ({
        ...mockEvents[0],
        id: `evt-${i}`,
        message: `Event ${i}`,
      }));
      el = await setupCard({ show_records: true, records_page_size: 2 }, manyEvents as any);
      await el._load();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN pagination controls are shown in the annotation list", () => {
        expect(el.shadowRoot.querySelector("dp-pagination")).toBeTruthy();
      });
    });

    describe("WHEN the page changes", () => {
      it("THEN _annPage updates", async () => {
        const pagination = el.shadowRoot.querySelector("dp-pagination");
        pagination.dispatchEvent(
          new CustomEvent("dp-page-change", { detail: { page: 1 }, bubbles: true, composed: true }),
        );
        await el.updateComplete;
        expect(el._annPage).toBe(1);
      });
    });
  });

  describe("GIVEN the static config methods", () => {
    describe("WHEN getStubConfig is called", () => {
      it("THEN it returns a config with an entity", () => {
        const cfg = HassRecordsSensorCard.getStubConfig();
        expect(cfg).toHaveProperty("entity");
      });
    });

    describe("WHEN getConfigElement is called", () => {
      it("THEN it returns the editor element tag", () => {
        const editorEl = HassRecordsSensorCard.getConfigElement();
        expect(editorEl.tagName.toLowerCase()).toBe("hass-datapoints-sensor-card-editor");
      });
    });
  });

  describe("GIVEN getGridOptions", () => {
    describe("WHEN show_records is false", () => {
      it("THEN it returns rows: 2", async () => {
        el = await setupCard({ show_records: false });
        expect(el.getGridOptions().rows).toBe(2);
      });
    });

    describe("WHEN show_records is true", () => {
      it("THEN it returns rows: 3", async () => {
        el = await setupCard({ show_records: true });
        expect(el.getGridOptions().rows).toBe(3);
      });
    });
  });
});
