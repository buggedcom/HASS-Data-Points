import { describe, expect, it, vi } from "vitest";
import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a mounted chart and records list", () => {
  describe("WHEN the chart emits a committed zoom selection", () => {
    it("THEN forwards zoom to the toolbar, list and URL", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const startTime = Date.parse("2025-01-06T06:00:00Z");
      const endTime = Date.parse("2025-01-06T12:00:00Z");
      emitControlEvent(
        control(panel.shadowRoot!, "hass-datapoints-history-card"),
        "hass-datapoints-chart-zoom",
        { startTime, endTime, source: "select" }
      );
      await settlePanel();
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      const timeline = control(toolbar.shadowRoot!, "panel-timeline");
      expect(
        timeline.shadowRoot!.querySelector<HTMLElement>(
          "#range-zoom-highlight"
        )!.hidden
      ).toBe(false);
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-list-card"
          ) as PanelCardFixture
        ).config.zoom_start_time
      ).toBe("2025-01-06T06:00:00.000Z");
      expect(
        new URLSearchParams(window.location.search).get("zoom_end_time")
      ).toBe("2025-01-06T12:00:00.000Z");
    });
  });
  describe("WHEN the chart emits hover time", () => {
    it("THEN moves the toolbar indicator without rendering the panel", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const render = vi.spyOn(panel, "render");
      const timeMs = Date.parse("2025-01-06T12:00:00Z");
      emitControlEvent(
        control(panel.shadowRoot!, "hass-datapoints-history-card"),
        "hass-datapoints-chart-hover",
        { timeMs }
      );
      await settlePanel();
      expect(control(panel.shadowRoot!, "range-toolbar").chartHoverTimeMs).toBe(
        timeMs
      );
      expect(render).not.toHaveBeenCalled();
    });
    it("THEN forwards that timestamp to the toolbar hover indicator", async () => {
      expect.assertions(1);
      const panel = await mountPanel(createHassFixture().hass);
      const timeMs = Date.parse("2025-01-06T12:00:00Z");
      emitControlEvent(
        control(panel.shadowRoot!, "hass-datapoints-history-card"),
        "hass-datapoints-chart-hover",
        { timeMs }
      );
      await settlePanel();
      expect(control(panel.shadowRoot!, "range-toolbar").chartHoverTimeMs).toBe(
        timeMs
      );
    });
  });
  describe("WHEN the chart clears its hover time", () => {
    it("THEN clears the toolbar indicator without rendering the panel", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const chart = control(panel.shadowRoot!, "hass-datapoints-history-card");
      emitControlEvent(chart, "hass-datapoints-chart-hover", {
        timeMs: Date.parse("2025-01-06T12:00:00Z"),
      });
      await settlePanel();
      const render = vi.spyOn(panel, "render");
      emitControlEvent(chart, "hass-datapoints-chart-hover", { timeMs: null });
      await settlePanel();
      expect(
        control(panel.shadowRoot!, "range-toolbar").chartHoverTimeMs
      ).toBeNull();
      expect(render).not.toHaveBeenCalled();
    });
  });
  describe("WHEN the records list emits a search query", () => {
    it("THEN forwards the normalized message filter to the chart", async () => {
      expect.assertions(1);
      const panel = await mountPanel(createHassFixture().hass);
      emitControlEvent(
        control(panel.shadowRoot!, "hass-datapoints-list-card"),
        "hass-datapoints-records-search",
        { query: "  Heating  " }
      );
      await settlePanel();
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.message_filter
      ).toBe("heating");
    });
  });
  describe("WHEN an event's visibility is toggled from the list", () => {
    it("THEN forwards the hidden event to both chart and list", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      emitControlEvent(
        control(panel.shadowRoot!, "hass-datapoints-list-card"),
        "hass-datapoints-toggle-event-visibility",
        { eventId: "annotation-1" }
      );
      await settlePanel();
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.hidden_event_ids
      ).toEqual(["annotation-1"]);
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-list-card"
          ) as PanelCardFixture
        ).config.hidden_event_ids
      ).toEqual(["annotation-1"]);
    });
  });
});
