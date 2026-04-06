import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { HassRecordsStatisticsCard } from "../statistics.ts";

import { fetchEvents } from "@/lib/data/events-api";
import { fetchStatisticsDuringPeriod } from "@/lib/data/statistics-api";

vi.mock("@/chart-utils.js", async (importOriginal) => {
  const mod = (await importOriginal()) as RecordWithUnknownValues;
  return {
    ...mod,
    setupCanvas: vi.fn().mockReturnValue({ w: 400, h: 220 }),
    resolveChartLabelColor: vi.fn().mockReturnValue("#ccc"),
    renderChartAxisOverlays: vi.fn(),
    attachLineChartHover: vi.fn().mockReturnValue(() => {}),
  };
});

vi.mock("@/chart-renderer.js", () => ({
  ChartRenderer: vi.fn().mockImplementation(() => ({
    labelColor: "",
    clear: vi.fn(),
    drawGrid: vi.fn(),
    drawLine: vi.fn(),
    drawAnnotations: vi.fn(),
    _activeAxes: [],
  })),
}));

vi.mock("@/lib/data/statistics-api", async (importOriginal) => {
  const mod = (await importOriginal()) as RecordWithUnknownValues;
  return {
    ...mod,
    fetchStatisticsDuringPeriod: vi.fn().mockResolvedValue({}),
  };
});

vi.mock("@/lib/data/events-api", async (importOriginal) => {
  const mod = (await importOriginal()) as RecordWithUnknownValues;
  return {
    ...mod,
    fetchEvents: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/constants", async (importOriginal) => {
  const mod = (await importOriginal()) as RecordWithUnknownValues;
  return {
    ...mod,
    COLORS: ["#03a9f4", "#ff9800", "#4caf50"],
  };
});

if (!customElements.get("hass-datapoints-statistics-card")) {
  customElements.define(
    "hass-datapoints-statistics-card",
    HassRecordsStatisticsCard
  );
}

function createCard(config: RecordWithUnknownValues = {}) {
  const el = document.createElement("hass-datapoints-statistics-card") as any;
  document.body.appendChild(el);
  el.setConfig({ entity: "sensor.temperature", ...config });
  return el;
}

describe("statistics", () => {
  let el: any;

  afterEach(() => {
    el?.remove();
    vi.clearAllMocks();
  });

  describe("GIVEN a card with default config", () => {
    beforeEach(async () => {
      el = createCard({ title: "My Statistics" });
      el.hass = createMockHass();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it uses a chart-shell wrapper", () => {
        expect(el.shadowRoot.querySelector("chart-shell")).toBeTruthy();
      });

      it("THEN it passes the title to chart-shell", () => {
        const shell = el.shadowRoot.querySelector("chart-shell");
        expect(shell.cardTitle).toBe("My Statistics");
      });

      it("THEN it has a canvas element for the chart", () => {
        expect(el.shadowRoot.querySelector("canvas#chart")).toBeTruthy();
      });

      it("THEN it has a chart-legend", () => {
        expect(el.shadowRoot.querySelector("chart-legend")).toBeTruthy();
      });
    });
  });

  describe("GIVEN a card without a title", () => {
    beforeEach(async () => {
      el = createCard();
      el.hass = createMockHass();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN chart-shell has an empty card title", () => {
        const shell = el.shadowRoot.querySelector("chart-shell");
        expect(shell.cardTitle).toBe("");
      });
    });
  });

  describe("GIVEN a card where statistics are loading", () => {
    beforeEach(async () => {
      // Hold the promise so loading stays true
      vi.mocked(fetchStatisticsDuringPeriod).mockReturnValue(
        new Promise(() => {})
      );
      vi.mocked(fetchEvents).mockReturnValue(new Promise(() => {}));
      el = createCard();
      el.hass = createMockHass();
      await el.updateComplete;
      await el._load();
      await el.updateComplete;
    });

    describe("WHEN the data is still loading", () => {
      it("THEN chart-shell shows the loading indicator", () => {
        const shell = el.shadowRoot.querySelector("chart-shell");
        expect(shell.loading).toBe(true);
      });
    });
  });

  describe("GIVEN a card where statistics fail to load", () => {
    beforeEach(async () => {
      vi.mocked(fetchStatisticsDuringPeriod).mockRejectedValue(
        new Error("Network error")
      );
      vi.mocked(fetchEvents).mockResolvedValue([]);
      el = createCard();
      el.hass = createMockHass();
      await el.updateComplete;
      await el._load();
      await el.updateComplete;
    });

    describe("WHEN the load fails", () => {
      it("THEN chart-shell shows an error message", () => {
        const shell = el.shadowRoot.querySelector("chart-shell");
        expect(shell.message).toBeTruthy();
        expect(shell.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("GIVEN setConfig with missing entity", () => {
    describe("WHEN setConfig is called without entity or entities", () => {
      it("THEN it throws an error", () => {
        const el2 = document.createElement(
          "hass-datapoints-statistics-card"
        ) as any;
        expect(() => el2.setConfig({})).toThrow();
      });
    });
  });

  describe("GIVEN the static config methods", () => {
    describe("WHEN getStubConfig is called", () => {
      it("THEN it returns a config with an entity", () => {
        const cfg = HassRecordsStatisticsCard.getStubConfig();
        expect(cfg).toHaveProperty("entity");
      });
    });

    describe("WHEN getConfigElement is called", () => {
      it("THEN it returns the editor element tag", () => {
        const editorEl = HassRecordsStatisticsCard.getConfigElement();
        expect(editorEl.tagName.toLowerCase()).toBe(
          "hass-datapoints-statistics-card-editor"
        );
      });
    });
  });
});
