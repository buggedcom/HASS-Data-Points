import { describe, expect, it } from "vitest";
import { buildBackendAnomalyConfig } from "../chart-anomaly-config";

describe("chart-anomaly-config", () => {
  describe("GIVEN buildBackendAnomalyConfig", () => {
    describe("WHEN analysis has standard anomaly methods", () => {
      it("THEN it maps them directly", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["iqr", "zscore"],
          anomaly_sensitivity: "medium",
        });
        expect(config.anomaly_methods).toEqual(["iqr", "zscore"]);
      });
    });

    describe("WHEN analysis includes similar_entity method", () => {
      it("THEN it maps similar_entity to comparison_window", () => {
        expect.assertions(2);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["similar_entity", "iqr"],
          anomaly_comparison_entity_id: "sensor.other",
        });
        expect(config.anomaly_methods).toContain("comparison_window");
        expect(config.comparison_entity_id).toBe("sensor.other");
      });
    });

    describe("WHEN analysis includes both similar_entity and comparison_window", () => {
      it("THEN it deduplicates comparison_window", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["similar_entity", "comparison_window"],
        });
        expect(
          config.anomaly_methods!.filter((m) => m === "comparison_window")
        ).toHaveLength(1);
      });
    });

    describe("WHEN analysis has anomaly_trend_method", () => {
      it("THEN it uses anomaly_trend_method over trend_method", () => {
        expect.assertions(2);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["iqr"],
          anomaly_trend_method: "ema",
          anomaly_trend_window: "12h",
          trend_method: "linear_trend",
          trend_window: "24h",
        });
        expect(config.trend_method).toBe("ema");
        expect(config.trend_window).toBe("12h");
      });
    });

    describe("WHEN anomaly_use_sampled_data is not false", () => {
      it("THEN it includes sample_interval and sample_aggregate", () => {
        expect.assertions(2);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["iqr"],
          sample_interval: "1h",
          sample_aggregate: "mean",
        });
        expect(config.sample_interval).toBe("1h");
        expect(config.sample_aggregate).toBe("mean");
      });
    });

    describe("WHEN anomaly_use_sampled_data is false", () => {
      it("THEN it omits sample settings", () => {
        expect.assertions(2);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["iqr"],
          anomaly_use_sampled_data: false,
          sample_interval: "1h",
          sample_aggregate: "mean",
        });
        expect(config.sample_interval).toBeUndefined();
        expect(config.sample_aggregate).toBeUndefined();
      });
    });

    describe("WHEN no methods are provided", () => {
      it("THEN anomaly_methods is undefined", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({});
        expect(config.anomaly_methods).toBeUndefined();
      });
    });

    describe("WHEN no direction fields are provided", () => {
      it("THEN every direction defaults to both", () => {
        expect.assertions(5);
        const config = buildBackendAnomalyConfig({ anomaly_methods: ["iqr"] });
        expect(config.anomaly_trend_residual_direction).toBe("both");
        expect(config.anomaly_rate_of_change_direction).toBe("both");
        expect(config.anomaly_iqr_direction).toBe("both");
        expect(config.anomaly_rolling_zscore_direction).toBe("both");
        expect(config.anomaly_comparison_window_direction).toBe("both");
      });
    });

    describe("WHEN per-method direction fields are provided", () => {
      it("THEN each flows through unchanged", () => {
        expect.assertions(4);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["trend_residual", "rate_of_change", "iqr"],
          anomaly_trend_residual_direction: "up",
          anomaly_rate_of_change_direction: "down",
          anomaly_iqr_direction: "up",
          anomaly_rolling_zscore_direction: "down",
        });
        expect(config.anomaly_trend_residual_direction).toBe("up");
        expect(config.anomaly_rate_of_change_direction).toBe("down");
        expect(config.anomaly_iqr_direction).toBe("up");
        expect(config.anomaly_rolling_zscore_direction).toBe("down");
      });
    });

    describe("WHEN an invalid direction value is provided", () => {
      it("THEN it falls back to both", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["iqr"],
          anomaly_iqr_direction: "sideways",
        });
        expect(config.anomaly_iqr_direction).toBe("both");
      });
    });

    describe("WHEN comparison_window is the active method", () => {
      it("THEN its direction resolves onto anomaly_comparison_window_direction", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["comparison_window"],
          anomaly_comparison_window_direction: "up",
          anomaly_similar_entity_direction: "down",
        });
        expect(config.anomaly_comparison_window_direction).toBe("up");
      });
    });

    describe("WHEN similar_entity is the active comparison method", () => {
      it("THEN similar_entity direction resolves onto anomaly_comparison_window_direction", () => {
        expect.assertions(1);
        const config = buildBackendAnomalyConfig({
          anomaly_methods: ["similar_entity"],
          anomaly_comparison_entity_id: "sensor.other",
          anomaly_comparison_window_direction: "down",
          anomaly_similar_entity_direction: "up",
        });
        expect(config.anomaly_comparison_window_direction).toBe("up");
      });
    });
  });
});
