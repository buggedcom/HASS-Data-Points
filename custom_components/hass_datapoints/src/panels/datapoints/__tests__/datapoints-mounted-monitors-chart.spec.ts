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

async function openMonitorsPanel() {
  const panel = await mountPanel(createHassFixture().hass);
  const shell = control(panel.shadowRoot!, "panel-shell");
  emitControlEvent(shell, "dp-shell-menu-monitors");
  await settlePanel();
  const monitorsPanel = panel.shadowRoot!.querySelector(
    "anomaly-monitors-panel"
  );
  expect(monitorsPanel).not.toBeNull();
  return { panel, monitorsPanel: monitorsPanel! };
}

describe("GIVEN a mounted panel with the monitors overlay open", () => {
  describe("WHEN it receives dp-monitors-panel-open-chart", () => {
    it("THEN closes the overlay, loads those entities with the anomaly overlay, and sets the range", async () => {
      expect.assertions(7);
      const { panel, monitorsPanel } = await openMonitorsPanel();
      const startMs = Date.parse("2025-01-06T00:00:00.000Z");
      const endMs = Date.parse("2025-01-07T00:00:00.000Z");

      emitControlEvent(monitorsPanel, "dp-monitors-panel-open-chart", {
        entityIds: ["sensor.temperature", "sensor.humidity"],
        startMs,
        endMs,
        monitorId: "monitor-1",
        anomalyMethods: ["iqr"],
      });
      await settlePanel();

      expect(
        panel.shadowRoot!.querySelector("anomaly-monitors-panel")
      ).toBeNull();
      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      expect(chart.config.entities).toEqual([
        "sensor.temperature",
        "sensor.humidity",
      ]);
      expect(chart.config.start_time).toBe(new Date(startMs).toISOString());
      expect(chart.config.end_time).toBe(new Date(endMs).toISOString());
      const series = chart.config.series_settings as Array<{
        entity_id: string;
        analysis: { show_anomalies: boolean };
      }>;
      expect(series.map((s) => s.entity_id)).toEqual([
        "sensor.temperature",
        "sensor.humidity",
      ]);
      expect(series.every((s) => s.analysis.show_anomalies === true)).toBe(
        true
      );
    });
  });

  describe("WHEN it receives dp-monitors-panel-open-entity", () => {
    it("THEN mounts a dialog containing a chart configured for that single entity", async () => {
      expect.assertions(4);
      const { panel, monitorsPanel } = await openMonitorsPanel();

      emitControlEvent(monitorsPanel, "dp-monitors-panel-open-entity", {
        entityId: "sensor.humidity",
        monitorId: "monitor-1",
        anomalyMethods: ["iqr"],
      });
      await settlePanel();

      const dialog = panel.shadowRoot!.querySelector("ha-dialog");
      expect(dialog).not.toBeNull();
      const dialogChart = dialog!.querySelector(
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      expect(dialogChart.config.entities).toEqual(["sensor.humidity"]);
      const series = dialogChart.config.series_settings as Array<{
        entity_id: string;
        analysis: { show_anomalies: boolean };
      }>;
      expect(
        series.length === 1 && series[0].analysis.show_anomalies === true
      ).toBe(true);
    });
  });
});
