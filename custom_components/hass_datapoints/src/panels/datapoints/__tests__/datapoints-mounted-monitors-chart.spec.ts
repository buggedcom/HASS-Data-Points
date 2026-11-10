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

type PreviewDialogEl = HTMLElement & {
  open: boolean;
  heading: string;
  updateComplete: Promise<boolean>;
};

function previewDialog(panel: HTMLElement): PreviewDialogEl {
  const el = panel.shadowRoot!.querySelector("series-preview-dialog");
  if (!el) {
    throw new Error("series-preview-dialog not rendered");
  }
  return el as unknown as PreviewDialogEl;
}

function previewChart(preview: PreviewDialogEl): PanelCardFixture {
  const chart = preview.shadowRoot!.querySelector(
    "hass-datapoints-history-card"
  );
  if (!chart) {
    throw new Error("preview chart not mounted");
  }
  return chart as unknown as PanelCardFixture;
}

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
  describe("WHEN the selected range changes while the overlay is open", () => {
    it("THEN the monitors panel receives the new range live", async () => {
      expect.assertions(4);
      const { panel, monitorsPanel } = await openMonitorsPanel();
      const target = monitorsPanel as HTMLElement & {
        rangeStartMs: number | null;
        rangeEndMs: number | null;
      };
      const host = panel as unknown as {
        _startTime: Date;
        _endTime: Date;
      };
      expect(target.rangeStartMs).toBe(host._startTime.getTime());

      const start = new Date("2025-02-01T00:00:00.000Z");
      const end = new Date("2025-02-03T00:00:00.000Z");
      host._startTime = start;
      host._endTime = end;

      expect(target.rangeStartMs).toBe(start.getTime());
      expect(target.rangeEndMs).toBe(end.getTime());
    });
  });

  describe("WHEN it receives dp-monitors-panel-open-chart", () => {
    it("THEN closes the overlay, loads those entities with the anomaly overlay, and sets the range", async () => {
      expect.assertions(8);
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
        analysis: { show_anomalies: boolean; anomaly_methods: string[] };
      }>;
      expect(series.map((s) => s.entity_id)).toEqual([
        "sensor.temperature",
        "sensor.humidity",
      ]);
      expect(series.every((s) => s.analysis.show_anomalies === true)).toBe(
        true
      );
      // The monitor's own method (from the event detail) drives the overlay,
      // not the hardcoded chart default.
      expect(
        series.every(
          (s) =>
            s.analysis.anomaly_methods.length === 1 &&
            s.analysis.anomaly_methods[0] === "iqr"
        )
      ).toBe(true);
    });
  });

  describe("WHEN open-chart carries no anomaly methods", () => {
    it("THEN the overlay falls back to the chart default method", async () => {
      expect.assertions(2);
      const { panel, monitorsPanel } = await openMonitorsPanel();

      emitControlEvent(monitorsPanel, "dp-monitors-panel-open-chart", {
        entityIds: ["sensor.temperature"],
        startMs: Date.parse("2025-01-06T00:00:00.000Z"),
        endMs: Date.parse("2025-01-07T00:00:00.000Z"),
        monitorId: "monitor-1",
        anomalyMethods: [],
      });
      await settlePanel();

      const chart = control(
        panel.shadowRoot!,
        "hass-datapoints-history-card"
      ) as PanelCardFixture;
      const series = chart.config.series_settings as Array<{
        analysis: { anomaly_methods: string[] };
      }>;
      expect(series[0].analysis.anomaly_methods).toEqual(["trend_residual"]);
    });
  });

  describe("WHEN it receives dp-monitors-panel-open-entity", () => {
    it("THEN opens the preview popup with a chart for that single entity", async () => {
      expect.assertions(6);
      const { panel, monitorsPanel } = await openMonitorsPanel();

      emitControlEvent(monitorsPanel, "dp-monitors-panel-open-entity", {
        entityId: "sensor.humidity",
        monitorId: "monitor-1",
        anomalyMethods: ["iqr"],
      });
      await settlePanel();

      const preview = previewDialog(panel);
      expect(preview.open).toBe(true);
      const dialogChart = previewChart(preview);
      expect(dialogChart.config.entities).toEqual(["sensor.humidity"]);
      const series = dialogChart.config.series_settings as Array<{
        entity_id: string;
        analysis: { show_anomalies: boolean; anomaly_methods: string[] };
      }>;
      expect(
        series.length === 1 && series[0].analysis.show_anomalies === true
      ).toBe(true);
      // The dialog overlay uses the monitor's method from the event detail.
      expect(series[0].analysis.anomaly_methods).toEqual(["iqr"]);
      // The monitors page stays open underneath the popup.
      expect(
        panel.shadowRoot!.querySelector("anomaly-monitors-panel")
      ).not.toBeNull();
    });
  });

  describe("WHEN it receives dp-monitors-panel-preview-series", () => {
    const startMs = Date.parse("2025-01-06T00:00:00.000Z");
    const endMs = Date.parse("2025-01-07T00:00:00.000Z");
    const detail = {
      title: "Kitchen anomaly",
      entityIds: ["sensor.temperature", "sensor.humidity"],
      startMs,
      endMs,
      monitorId: "monitor-1",
      anomalyMethods: ["iqr"],
      anomalySensitivity: "high",
    };

    it("THEN opens a preview popup of the main chart for the monitor's series", async () => {
      expect.assertions(6);
      const { panel, monitorsPanel } = await openMonitorsPanel();

      emitControlEvent(
        monitorsPanel,
        "dp-monitors-panel-preview-series",
        detail
      );
      await settlePanel();

      const preview = previewDialog(panel);
      expect(preview.open).toBe(true);
      expect(preview.heading).toBe("Kitchen anomaly");
      const chart = previewChart(preview);
      expect(chart.config.entities).toEqual([
        "sensor.temperature",
        "sensor.humidity",
      ]);
      expect(chart.config.start_time).toBe(new Date(startMs).toISOString());
      expect(
        panel.shadowRoot!.querySelector("anomaly-monitors-panel")
      ).not.toBeNull();
    });

    it("THEN Open in chart closes the popup and loads the series on the main chart", async () => {
      expect.assertions(4);
      const { panel, monitorsPanel } = await openMonitorsPanel();
      emitControlEvent(
        monitorsPanel,
        "dp-monitors-panel-preview-series",
        detail
      );
      await settlePanel();

      const preview = previewDialog(panel);
      emitControlEvent(preview, "dp-series-preview-open-chart");
      await settlePanel();

      expect(preview.open).toBe(false);
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
    });
  });
});

describe("GIVEN page navigation between the chart and the monitors page", () => {
  it("THEN opening the monitors page pushes a view=monitors history entry", async () => {
    expect.assertions(3);
    const lengthBefore = window.history.length;
    await openMonitorsPanel();
    expect(new URL(window.location.href).searchParams.get("view")).toBe(
      "monitors"
    );
    expect(window.history.length).toBe(lengthBefore + 1);
  });

  it("THEN the range toolbar stays visible on the monitors page", async () => {
    expect.assertions(2);
    const { panel } = await openMonitorsPanel();
    expect(panel.shadowRoot!.querySelector("range-toolbar")).not.toBeNull();
  });

  it("THEN going back (popstate without view) returns to the chart page", async () => {
    expect.assertions(3);
    const { panel } = await openMonitorsPanel();
    window.history.replaceState(null, "", "/datapoints");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await settlePanel();
    expect(
      panel.shadowRoot!.querySelector("anomaly-monitors-panel")
    ).toBeNull();
    expect(
      (
        control(panel.shadowRoot!, "panel-shell") as HTMLElement & {
          monitorsActive: boolean;
        }
      ).monitorsActive
    ).toBe(false);
  });

  it("THEN going forward (popstate with view=monitors) reopens the monitors page", async () => {
    expect.assertions(1);
    const panel = await mountPanel(createHassFixture().hass);
    window.history.replaceState(null, "", "/datapoints?view=monitors");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await settlePanel();
    expect(
      panel.shadowRoot!.querySelector("anomaly-monitors-panel")
    ).not.toBeNull();
  });

  it("THEN the close button pushes a chart-page entry without view", async () => {
    expect.assertions(3);
    const { panel, monitorsPanel } = await openMonitorsPanel();
    emitControlEvent(monitorsPanel, "dp-monitors-panel-close");
    await settlePanel();
    expect(new URL(window.location.href).searchParams.has("view")).toBe(false);
    expect(
      panel.shadowRoot!.querySelector("anomaly-monitors-panel")
    ).toBeNull();
  });
});
