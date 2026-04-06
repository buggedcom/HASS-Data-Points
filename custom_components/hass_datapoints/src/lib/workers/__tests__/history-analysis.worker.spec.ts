import { describe, expect, it } from "vitest";

import {
  buildDeltaPoints,
  buildLinearTrend,
  buildRateOfChangePoints,
  buildRollingAverageTrend,
  buildSummaryStats,
  buildTrendPoints,
  computeHistoryAnalysis,
  getTrendWindowMs,
  interpolateSeriesValue,
  normalizeSeriesAnalysis,
} from "@/lib/workers/history-analysis.worker";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function hourly(values: number[]): [number, number][] {
  return values.map((value, index) => [index * HOUR_MS, value]);
}

describe("history-analysis.worker", () => {
  describe("GIVEN getTrendWindowMs", () => {
    describe("WHEN called with an unknown key", () => {
      it("THEN it falls back to 24 hours", () => {
        expect.assertions(1);
        expect(getTrendWindowMs("unknown")).toBe(DAY_MS);
      });
    });
  });

  describe("GIVEN buildRollingAverageTrend", () => {
    describe("WHEN the input is too short", () => {
      it("THEN it returns an empty array", () => {
        expect.assertions(1);
        expect(buildRollingAverageTrend([[0, 1]], HOUR_MS)).toEqual([]);
      });
    });

    describe("WHEN the window covers all prior points", () => {
      it("THEN it returns the running average", () => {
        expect.assertions(1);
        expect(buildRollingAverageTrend(hourly([2, 4, 6]), DAY_MS)).toEqual([
          [0, 2],
          [HOUR_MS, 3],
          [2 * HOUR_MS, 4],
        ]);
      });
    });
  });

  describe("GIVEN buildLinearTrend", () => {
    describe("WHEN the points form a straight line", () => {
      it("THEN it returns the first and last trend points", () => {
        expect.assertions(1);
        expect(buildLinearTrend(hourly([0, 1, 2]))).toEqual([
          [0, 0],
          [2 * HOUR_MS, 2],
        ]);
      });
    });
  });

  describe("GIVEN buildTrendPoints", () => {
    describe("WHEN linear_trend is requested", () => {
      it("THEN it delegates to the linear trend builder", () => {
        expect.assertions(1);
        expect(
          buildTrendPoints(hourly([0, 1, 2]), "linear_trend", "24h")
        ).toEqual([
          [0, 0],
          [2 * HOUR_MS, 2],
        ]);
      });
    });
  });

  describe("GIVEN interpolateSeriesValue", () => {
    describe("WHEN the query time falls between two points", () => {
      it("THEN it interpolates the intermediate value", () => {
        expect.assertions(1);
        expect(
          interpolateSeriesValue(
            [
              [0, 0],
              [HOUR_MS, 10],
            ],
            HOUR_MS / 2
          )
        ).toBe(5);
      });
    });
  });

  describe("GIVEN buildRateOfChangePoints", () => {
    describe("WHEN point_to_point mode is used", () => {
      it("THEN it returns hourly deltas", () => {
        expect.assertions(1);
        expect(
          buildRateOfChangePoints(hourly([1, 3, 6]), "point_to_point")
        ).toEqual([
          [HOUR_MS, 2],
          [2 * HOUR_MS, 3],
        ]);
      });
    });
  });

  describe("GIVEN buildDeltaPoints", () => {
    describe("WHEN both series overlap in time", () => {
      it("THEN it returns the source-minus-comparison delta", () => {
        expect.assertions(1);
        expect(
          buildDeltaPoints(
            [
              [0, 10],
              [HOUR_MS, 20],
            ],
            [
              [0, 4],
              [HOUR_MS, 5],
            ]
          )
        ).toEqual([
          [0, 6],
          [HOUR_MS, 15],
        ]);
      });
    });
  });

  describe("GIVEN buildSummaryStats", () => {
    describe("WHEN numeric points are provided", () => {
      it("THEN it returns min max and mean", () => {
        expect.assertions(1);
        expect(buildSummaryStats(hourly([10, 20, 30]))).toEqual({
          min: 10,
          max: 30,
          mean: 20,
        });
      });
    });
  });

  describe("GIVEN normalizeSeriesAnalysis", () => {
    describe("WHEN optional fields are missing", () => {
      it("THEN it applies the frontend analysis defaults still used by the worker", () => {
        expect.assertions(1);
        expect(normalizeSeriesAnalysis({})).toEqual({
          show_trend_lines: false,
          trend_method: "rolling_average",
          trend_window: "24h",
          show_summary_stats: false,
          show_rate_of_change: false,
          rate_window: "1h",
          show_delta_analysis: false,
        });
      });
    });
  });

  describe("GIVEN computeHistoryAnalysis", () => {
    describe("WHEN trend, rate, delta, summary, and anomaly flags are enabled", () => {
      it("THEN it computes only the non-anomaly frontend analysis and leaves anomalySeries empty", () => {
        expect.assertions(5);
        const result = computeHistoryAnalysis({
          series: [
            {
              entityId: "sensor.temperature",
              pts: hourly([10, 14, 18]),
              analysis: {
                show_trend_lines: true,
                show_summary_stats: true,
                show_rate_of_change: true,
                rate_window: "point_to_point",
                show_delta_analysis: true,
                show_anomalies: true,
                anomaly_methods: ["iqr"],
              },
            },
          ],
          comparisonSeries: [
            {
              entityId: "sensor.temperature",
              pts: hourly([8, 12, 15]),
            },
          ],
          hasSelectedComparisonWindow: true,
        });

        expect(result.trendSeries).toHaveLength(1);
        expect(result.rateSeries).toHaveLength(1);
        expect(result.deltaSeries).toHaveLength(1);
        expect(result.summaryStats).toHaveLength(1);
        expect(result.anomalySeries).toEqual([]);
      });
    });
  });
});
