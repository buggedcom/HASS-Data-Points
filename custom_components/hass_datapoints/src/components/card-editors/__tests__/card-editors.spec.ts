import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import {
  HassRecordsActionCardEditor,
  HassRecordsQuickCardEditor,
  HassRecordsHistoryCardEditor,
  HassRecordsStatisticsCardEditor,
  HassRecordsSensorCardEditor,
  HassRecordsListCardEditor,
} from "../card-editors";

// Register editors for testing (normally done in register.js)
const editors = [
  ["hass-datapoints-action-card-editor", HassRecordsActionCardEditor],
  ["hass-datapoints-quick-card-editor", HassRecordsQuickCardEditor],
  ["hass-datapoints-history-card-editor", HassRecordsHistoryCardEditor],
  ["hass-datapoints-statistics-card-editor", HassRecordsStatisticsCardEditor],
  ["hass-datapoints-sensor-card-editor", HassRecordsSensorCardEditor],
  ["hass-datapoints-list-card-editor", HassRecordsListCardEditor],
] as const;

for (const [tag, cls] of editors) {
  if (!customElements.get(tag)) {
    customElements.define(tag, cls);
  }
}

function createEditor(tag: string, config: Record<string, unknown> = {}) {
  const el = document.createElement(tag) as any;
  document.body.appendChild(el);
  el.setConfig(config);
  el.hass = createMockHass();
  return el;
}

describe("card-editors", () => {
  let el: any;

  afterEach(() => el?.remove());

  describe("HassRecordsQuickCardEditor", () => {
    describe("GIVEN a quick card editor with default config", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-quick-card-editor", { title: "Quick" });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it contains form elements in shadow DOM", () => {
          expect(el.shadowRoot).toBeTruthy();
          // Should have section headings
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });

        it("THEN _config reflects the config", () => {
          expect(el._config.title).toBe("Quick");
        });
      });

      describe("WHEN _set is called", () => {
        it("THEN it fires config-changed", () => {
          const handler = vi.fn();
          el.addEventListener("config-changed", handler);
          el._set("title", "Updated");
          expect(handler).toHaveBeenCalledOnce();
          expect(handler.mock.calls[0][0].detail.config.title).toBe("Updated");
        });
      });
    });
  });

  describe("HassRecordsActionCardEditor", () => {
    describe("GIVEN an action card editor", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-action-card-editor", { title: "Action" });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it has section headings", () => {
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("HassRecordsHistoryCardEditor", () => {
    describe("GIVEN a history card editor", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-history-card-editor", { title: "History", hours_to_show: 24 });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it has section headings", () => {
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("HassRecordsStatisticsCardEditor", () => {
    describe("GIVEN a statistics card editor", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-statistics-card-editor", { title: "Stats" });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it has section headings", () => {
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("HassRecordsSensorCardEditor", () => {
    describe("GIVEN a sensor card editor", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-sensor-card-editor", { entity: "sensor.temperature" });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it has section headings", () => {
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("HassRecordsListCardEditor", () => {
    describe("GIVEN a list card editor", () => {
      beforeEach(async () => {
        el = createEditor("hass-datapoints-list-card-editor", { title: "Events" });
        await el.updateComplete;
      });

      describe("WHEN rendered", () => {
        it("THEN it has section headings", () => {
          const sections = el.shadowRoot.querySelectorAll("dp-section-heading");
          expect(sections.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
