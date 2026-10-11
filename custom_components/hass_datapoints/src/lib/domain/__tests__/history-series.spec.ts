import { describe, expect, it, vi } from "vitest";

import {
  buildHistorySeriesRows,
  historySeriesRowHasConfiguredAnalysis,
  normalizeHistorySeriesAnalysis,
  normalizeHistorySeriesRows,
  parseSeriesColorsParam,
  slugifySeriesName,
} from "@/lib/domain/history-series";

vi.mock("@/constants", async (importOriginal) => {
  const real = (await importOriginal()) as RecordWithUnknownValues;
  return { ...real, COLORS: ["#111111", "#222222", "#333333"] };
});

describe("history-series", () => {
  describe("GIVEN partial or legacy analysis config", () => {
    describe("WHEN normalizeHistorySeriesAnalysis is called", () => {
      it("THEN it applies the stable defaults and migrations", () => {
        expect.assertions(4);

        const normalized = normalizeHistorySeriesAnalysis({
          show_anomalies: true,
          anomaly_method: "iqr",
          sample_interval: "raw",
          sample_aggregate: "median",
          stepped_series: true,
        });

        expect(normalized.show_anomalies).toBe(true);
        expect(normalized.anomaly_methods).toEqual(["iqr"]);
        expect(normalized.sample_aggregate).toBe("median");
        expect(normalized.stepped_series).toBe(true);
      });
    });
  });

  describe("GIVEN anomaly trend override fields", () => {
    describe("WHEN normalizeHistorySeriesAnalysis is called with no anomaly_trend_method", () => {
      it("THEN anomaly_trend_method defaults to empty string", () => {
        expect.assertions(1);
        const normalized = normalizeHistorySeriesAnalysis({});
        expect(normalized.anomaly_trend_method).toBe("");
      });
    });

    describe("WHEN normalizeHistorySeriesAnalysis is called with anomaly_trend_method set", () => {
      it("THEN anomaly_trend_method is preserved", () => {
        expect.assertions(1);
        const normalized = normalizeHistorySeriesAnalysis({
          anomaly_trend_method: "lowess",
        });
        expect(normalized.anomaly_trend_method).toBe("lowess");
      });
    });

    describe("WHEN normalizeHistorySeriesAnalysis is called with no anomaly_trend_window", () => {
      it("THEN anomaly_trend_window defaults to 24h", () => {
        expect.assertions(1);
        const normalized = normalizeHistorySeriesAnalysis({});
        expect(normalized.anomaly_trend_window).toBe("24h");
      });
    });

    describe("WHEN normalizeHistorySeriesAnalysis is called with anomaly_trend_window set", () => {
      it("THEN anomaly_trend_window is preserved", () => {
        expect.assertions(1);
        const normalized = normalizeHistorySeriesAnalysis({
          anomaly_trend_method: "ema",
          anomaly_trend_window: "6h",
        });
        expect(normalized.anomaly_trend_window).toBe("6h");
      });
    });
  });

  describe("GIVEN a row analysis payload", () => {
    describe("WHEN historySeriesRowHasConfiguredAnalysis is called", () => {
      it("THEN it reports whether any analysis is enabled", () => {
        expect.assertions(3);

        expect(
          historySeriesRowHasConfiguredAnalysis({
            analysis: { show_trend_lines: true },
          })
        ).toBe(true);
        expect(
          historySeriesRowHasConfiguredAnalysis({
            analysis: { stepped_series: true },
          })
        ).toBe(true);
        expect(historySeriesRowHasConfiguredAnalysis({ analysis: {} })).toBe(
          false
        );
      });
    });
  });

  describe("GIVEN mixed history rows", () => {
    describe("WHEN normalizeHistorySeriesRows is called", () => {
      it("THEN it removes duplicates and fills defaults", () => {
        expect.assertions(1);

        expect(
          normalizeHistorySeriesRows([
            { entity_id: "sensor.a", color: "#abcdef", visible: false },
            { entity_id: "sensor.a", color: "#111111", visible: true },
            { entity_id: "sensor.b", color: "bad" },
          ])
        ).toEqual([
          expect.objectContaining({
            entity_id: "sensor.a",
            color: "#abcdef",
            visible: false,
          }),
          expect.objectContaining({
            entity_id: "sensor.b",
            color: "#333333",
            visible: true,
          }),
        ]);
      });
    });
  });

  describe("GIVEN rows carrying a binary_display choice", () => {
    describe("WHEN the entity is a binary_sensor with binary_display row", () => {
      it("THEN normalizeHistorySeriesRows preserves the row value", () => {
        expect.assertions(1);
        const [row] = normalizeHistorySeriesRows([
          {
            entity_id: "binary_sensor.door",
            color: "#111111",
            binary_display: "row",
          },
        ]);
        expect(row.binary_display).toBe("row");
      });
    });

    describe("WHEN the entity is a binary_sensor with binary_display background", () => {
      it("THEN normalizeHistorySeriesRows preserves the explicit background value", () => {
        expect.assertions(1);
        const [row] = normalizeHistorySeriesRows([
          {
            entity_id: "binary_sensor.door",
            color: "#111111",
            binary_display: "background",
          },
        ]);
        expect(row.binary_display).toBe("background");
      });
    });

    describe("WHEN the entity is a binary_sensor with no binary_display", () => {
      it("THEN normalizeHistorySeriesRows does not materialize the field", () => {
        expect.assertions(1);
        const [row] = normalizeHistorySeriesRows([
          { entity_id: "binary_sensor.door", color: "#111111" },
        ]);
        expect("binary_display" in row).toBe(false);
      });
    });

    describe("WHEN binary_display is set to an invalid value", () => {
      it("THEN normalizeHistorySeriesRows drops the field", () => {
        expect.assertions(1);
        const [row] = normalizeHistorySeriesRows([
          {
            entity_id: "binary_sensor.door",
            color: "#111111",
            binary_display: "nonsense",
          },
        ]);
        expect("binary_display" in row).toBe(false);
      });
    });

    describe("WHEN binary_display is set on a non-binary_sensor entity", () => {
      it("THEN normalizeHistorySeriesRows normalizes the field away", () => {
        expect.assertions(1);
        const [row] = normalizeHistorySeriesRows([
          { entity_id: "sensor.temp", color: "#111111", binary_display: "row" },
        ]);
        expect("binary_display" in row).toBe(false);
      });
    });

    describe("WHEN buildHistorySeriesRows preserves a previous binary row", () => {
      it("THEN the binary_display choice survives", () => {
        expect.assertions(1);
        const rows = buildHistorySeriesRows(
          ["binary_sensor.door"],
          [
            {
              entity_id: "binary_sensor.door",
              color: "#111111",
              binary_display: "row",
            },
          ]
        );
        expect(rows[0].binary_display).toBe("row");
      });
    });
  });

  describe("GIVEN entity ids and previous rows", () => {
    describe("WHEN buildHistorySeriesRows is called", () => {
      it("THEN it preserves rows and inherits unanimous sampling config", () => {
        expect.assertions(2);

        const rows = buildHistorySeriesRows(
          ["sensor.a", "sensor.b", "sensor.c"],
          [
            {
              entity_id: "sensor.a",
              color: "#999999",
              analysis: { sample_interval: "5m", sample_aggregate: "max" },
            },
            {
              entity_id: "sensor.b",
              color: "#888888",
              analysis: { sample_interval: "5m", sample_aggregate: "max" },
            },
          ]
        );

        expect(rows[0]).toEqual(
          expect.objectContaining({ entity_id: "sensor.a", color: "#999999" })
        );
        expect(rows[2].analysis).toEqual(
          expect.objectContaining({
            sample_interval: "5m",
            sample_aggregate: "max",
          })
        );
      });
    });
  });

  describe("GIVEN free text and query color params", () => {
    describe("WHEN the URL helpers are called", () => {
      it("THEN they normalize the values", () => {
        expect.assertions(2);

        expect(slugifySeriesName(" Adults Bedroom Temp ")).toBe(
          "adults-bedroom-temp"
        );
        expect(
          parseSeriesColorsParam("temperature:#83c705,broken:red")
        ).toEqual({
          temperature: "#83c705",
        });
      });
    });
  });
});
