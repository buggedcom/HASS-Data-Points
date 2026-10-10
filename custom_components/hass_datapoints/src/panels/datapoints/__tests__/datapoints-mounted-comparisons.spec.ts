import { describe, expect, it } from "vitest";
import {
  COMPARISON,
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a mounted panel with a saved comparison window", () => {
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
