import { describe, expect, it, vi } from "vitest";
import {
  COMPARISON,
  control,
  createHassFixture,
  emitControlEvent,
  END,
  mountPanel,
  PanelCardFixture,
  START,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a mounted panel with a saved comparison window", () => {
  describe("WHEN the chart is hovered with the comparison active", () => {
    it("THEN moves both hover indicators without rendering the panel", async () => {
      expect.assertions(3);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(panel.shadowRoot!, "hass-datapoints-history-card");
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      emitControlEvent(rail, "dp-tab-activate", { tabId: COMPARISON.id });
      await settlePanel();
      const render = vi.spyOn(panel, "render");
      const timeMs = Date.parse("2025-01-06T12:00:00Z");
      emitControlEvent(chart, "hass-datapoints-chart-hover", { timeMs });
      await settlePanel();
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      expect(toolbar.chartHoverTimeMs).toBe(timeMs);
      expect(toolbar.chartHoverWindowTimeMs).toBe(
        timeMs + Date.parse(COMPARISON.start_time) - Date.parse(START)
      );
      expect(render).not.toHaveBeenCalled();
    });
  });
  describe("WHEN its comparison tab is activated", () => {
    it("THEN selects the tab and forwards its preview to the toolbar and chart", async () => {
      expect.assertions(4);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      expect(rail.tabs.map((tab) => tab.label)).toContain("Previous day");
      emitControlEvent(rail, "dp-tab-activate", { tabId: COMPARISON.id });
      await settlePanel();
      expect(rail.tabs.find((tab) => tab.id === COMPARISON.id)?.active).toBe(
        true
      );
      expect(chart.config.selected_comparison_window_id).toBe(COMPARISON.id);
      expect(
        control(panel.shadowRoot!, "range-toolbar").comparisonPreview
      ).toEqual({
        start: Date.parse(COMPARISON.start_time),
        end: Date.parse(COMPARISON.end_time),
      });
    });
  });
  describe("WHEN a comparison is hovered and then left", () => {
    it("THEN clears the transient preview without selecting the tab", async () => {
      expect.assertions(4);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      emitControlEvent(rail, "dp-tab-hover", { tabId: COMPARISON.id });
      await settlePanel();
      expect(chart.config.hovered_comparison_window_id).toBe(COMPARISON.id);
      emitControlEvent(rail, "dp-tab-leave", { tabId: COMPARISON.id });
      await settlePanel();
      expect(chart.config.hovered_comparison_window_id).toBeNull();
      expect(chart.config.selected_comparison_window_id).toBeNull();
      expect(
        control(panel.shadowRoot!, "range-toolbar").comparisonPreview
      ).toBeNull();
    });
  });
});

describe("GIVEN a mounted panel with a saved relative window", () => {
  const RELATIVE = {
    id: "relative-previous",
    label: "Previous period",
    kind: "relative",
    preset: "previous_period",
  };

  describe("WHEN the comparison tabs render", () => {
    it("THEN the tab shows the dates it resolves to and the relative icon", async () => {
      expect.assertions(3);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [RELATIVE] } }).hass
      );
      const chart = control(panel.shadowRoot!, "hass-datapoints-history-card");
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      const tab = rail.tabs.find((entry) => entry.id === RELATIVE.id);
      expect(tab?.label).toBe("Previous period");
      expect(tab?.icon).toBe("mdi:calendar-sync");
      expect(tab?.disabled).toBe(false);
    });
  });

  describe("WHEN its tab is activated", () => {
    it("THEN the preview covers the period of the same length before the range", async () => {
      expect.assertions(1);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [RELATIVE] } }).hass
      );
      const chart = control(panel.shadowRoot!, "hass-datapoints-history-card");
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      emitControlEvent(rail, "dp-tab-activate", { tabId: RELATIVE.id });
      await settlePanel();
      const spanMs = Date.parse(END) - Date.parse(START);
      expect(
        control(panel.shadowRoot!, "range-toolbar").comparisonPreview
      ).toEqual({
        start: Date.parse(START) - spanMs,
        end: Date.parse(START),
      });
    });
  });

  describe("WHEN the series analysis rows render", () => {
    it("THEN the relative window is not offered as an anomaly comparison window", async () => {
      expect.assertions(1);
      const panel = await mountPanel(
        createHassFixture({
          preferences: { date_windows: [RELATIVE, COMPARISON] },
        }).hass
      );
      const targets = control(panel.shadowRoot!, "history-targets");
      expect(
        (targets.comparisonWindows as Array<{ id: string }>).map((w) => w.id)
      ).toEqual([COMPARISON.id]);
    });
  });
});
