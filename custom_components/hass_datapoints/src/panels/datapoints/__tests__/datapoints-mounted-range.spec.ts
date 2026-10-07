import { describe, expect, it } from "vitest";
import { PANEL_HISTORY_PREFERENCES_KEY } from "@/lib/history-page/history-session-state";
import {
  control,
  createHassFixture,
  emitControlEvent,
  lastSavedValue,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN the mounted range toolbar", () => {
  describe("WHEN a date range is committed", () => {
    it("THEN updates the toolbar, chart, records and URL with the selected dates", async () => {
      expect.assertions(5);
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      const start = new Date("2025-01-08T00:00:00Z");
      const end = new Date("2025-01-09T00:00:00Z");
      emitControlEvent(toolbar, "dp-range-commit", { start, end, push: true });
      await settlePanel();
      expect(toolbar.startTime).toEqual(start);
      expect(toolbar.endTime).toEqual(end);
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.start_time
      ).toBe(start.toISOString());
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-list-card"
          ) as PanelCardFixture
        ).config.end_time
      ).toBe(end.toISOString());
      expect(
        new URLSearchParams(window.location.search).get("start_time")
      ).toBe(start.toISOString());
    });
  });
  describe("WHEN zoom level and date snapping are changed", () => {
    it("THEN forwards the preferences to the toolbar and persists them", async () => {
      expect.assertions(3);
      const { hass, sendMessagePromise } = createHassFixture();
      const panel = await mountPanel(hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      emitControlEvent(toolbar, "dp-zoom-level-change", { value: "day" });
      emitControlEvent(toolbar, "dp-snap-change", { value: "day" });
      await settlePanel();
      expect(toolbar.zoomLevel).toBe("day");
      expect(toolbar.dateSnapping).toBe("day");
      expect(
        lastSavedValue(sendMessagePromise, PANEL_HISTORY_PREFERENCES_KEY)
      ).toMatchObject({ zoom_level: "day", date_snapping: "day" });
    });
  });
});
