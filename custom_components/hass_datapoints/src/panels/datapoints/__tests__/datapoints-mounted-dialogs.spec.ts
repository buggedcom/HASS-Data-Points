import { describe, expect, it } from "vitest";
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

describe("GIVEN a mounted panel's date-window dialog", () => {
  describe("WHEN the comparison rail requests a new window and it is cancelled", () => {
    it("THEN opens a prefilled dialog and closes it without adding a tab", async () => {
      expect.assertions(4);
      const panel = await mountPanel(createHassFixture().hass);
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      emitControlEvent(rail, "dp-tab-add");
      await settlePanel();
      const dialog = control(panel.shadowRoot!, "date-window-dialog");
      expect(dialog.open).toBe(true);
      expect(dialog.startValue).toContain("2025-01-06");
      emitControlEvent(dialog, "dp-window-close");
      await settlePanel();
      expect(dialog.open).toBe(false);
      expect(rail.tabs).toHaveLength(1);
    });
  });
  describe("WHEN a named date window is submitted", () => {
    it("THEN closes the dialog and adds the saved comparison tab", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const rail = control(chart.shadowRoot!, "comparison-tab-rail");
      emitControlEvent(rail, "dp-tab-add");
      const dialog = control(panel.shadowRoot!, "date-window-dialog");
      emitControlEvent(dialog, "dp-window-submit", {
        name: "Yesterday",
        start: "2025-01-05T00:00",
        end: "2025-01-06T00:00",
      });
      await settlePanel();
      expect(dialog.open).toBe(false);
      expect(rail.tabs.map((tab) => tab.label)).toContain("Yesterday");
      expect(
        new URLSearchParams(window.location.search).get("date_windows")
      ).toContain("Yesterday");
    });
  });
});

describe("GIVEN a mounted panel's anomaly-monitor wizard", () => {
  describe("WHEN the chart requests a monitor and the wizard is dismissed", () => {
    it("THEN forwards the selected series and analysis into the wizard and closes it", async () => {
      expect.assertions(4);
      const panel = await mountPanel(createHassFixture().hass);
      const chart = control(panel.shadowRoot!, "hass-datapoints-history-card");
      const analysis = { show_anomalies: true, anomaly_methods: ["iqr"] };
      emitControlEvent(chart, "dp-anomaly-save-monitor", {
        entityId: "sensor.temperature",
        analysis,
      });
      await settlePanel();
      const wizard = control(panel.shadowRoot!, "anomaly-monitor-wizard");
      expect(wizard.open).toBe(true);
      expect(wizard.prefillEntityIds).toEqual(["sensor.temperature"]);
      expect(wizard.prefillAnalysis).toEqual(analysis);
      emitControlEvent(wizard, "dp-monitor-wizard-close");
      await settlePanel();
      expect(wizard.open).toBe(false);
    });
  });
});
