import { describe, expect, it, vi } from "vitest";
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

describe("GIVEN a comparison rail whose descriptors no longer match panel state", () => {
  describe("WHEN the panel renders its comparison windows", () => {
    it("THEN restores the tab descriptors through bindings in the retained rail", async () => {
      expect.assertions(2);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      rail.tabs = [];
      panel.requestUpdate();
      await panel.updateComplete;
      await settlePanel();
      expect(control(chart.shadowRoot!, "comparison-tab-rail")).toBe(rail);
      expect(rail.tabs.map((tab) => tab.id)).toEqual([
        "current-range",
        "previous",
      ]);
    });
  });
});

describe("GIVEN comparison tabs rendered in the chart slot", () => {
  describe("WHEN a comparison tab is clicked", () => {
    it("THEN emits one activation and updates the selected tab", async () => {
      expect.assertions(4);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      const activated = vi.fn();
      rail.addEventListener("dp-tab-activate", activated);
      const tab = Array.from(
        rail.shadowRoot!.querySelectorAll("comparison-tab")
      ).find((item) => item.tabId === COMPARISON.id)!;
      tab
        .shadowRoot!.querySelector<HTMLButtonElement>(".chart-tab-trigger")!
        .click();
      await settlePanel();
      expect(activated).toHaveBeenCalledTimes(1);
      expect(activated.mock.calls[0][0].detail).toEqual({
        tabId: COMPARISON.id,
      });
      expect(tab.active).toBe(true);
      expect(
        rail.tabs.find((item) => item.id === "current-range")?.active
      ).toBe(false);
    });
  });
  describe("WHEN the chart reports comparison data loading and completion", () => {
    it("THEN updates the retained tab's loading state through bindings", async () => {
      expect.assertions(3);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      const tab = Array.from(
        rail.shadowRoot!.querySelectorAll("comparison-tab")
      ).find((item) => item.tabId === COMPARISON.id)!;
      emitControlEvent(chart, "hass-datapoints-comparison-loading", {
        ids: [COMPARISON.id],
        loading: true,
      });
      await settlePanel();
      expect(tab.loading).toBe(true);
      emitControlEvent(chart, "hass-datapoints-comparison-loading", {
        ids: [COMPARISON.id],
        loading: false,
      });
      await settlePanel();
      expect(tab.loading).toBe(false);
      expect(control(chart.shadowRoot!, "comparison-tab-rail")).toBe(rail);
    });
  });
});

describe("GIVEN comparison windows rendered in the current chart slot", () => {
  describe("WHEN the chart slot is replaced during rendering", () => {
    it("THEN renders the same comparison state in the new host and clears the retired host", async () => {
      expect.assertions(3);
      const panel = await mountPanel(
        createHassFixture({ preferences: { date_windows: [COMPARISON] } }).hass
      );
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const oldHost = chart.getComparisonTabsHost()!;
      const legacyChart = document.createElement("dp-history-chart");
      const newHost = document.createElement("div");
      newHost.id = "chart-top-slot";
      newHost.hidden = true;
      legacyChart.appendChild(newHost);
      chart.shadowRoot!.replaceChildren(legacyChart);
      panel.requestUpdate();
      await panel.updateComplete;
      await settlePanel();
      expect(newHost.hidden).toBe(false);
      expect(
        control(newHost, "comparison-tab-rail").tabs.map((tab) => tab.id)
      ).toEqual(["current-range", "previous"]);
      expect(oldHost.querySelector("comparison-tab-rail")).toBeNull();
    });
  });
});
