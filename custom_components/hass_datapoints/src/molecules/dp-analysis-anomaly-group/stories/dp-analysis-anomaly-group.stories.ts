import { html } from "lit";
import "../dp-analysis-anomaly-group";
import type { NormalizedAnalysis, ComparisonWindow } from "../../dp-target-row/types";

export default {
  title: "Molecules/Analysis/Anomaly Group",
  component: "dp-analysis-anomaly-group",
  parameters: {
    actions: {
      handles: ["dp-group-analysis-change"],
    },
  },
};

function makeAnalysis(overrides: Partial<NormalizedAnalysis> = {}): NormalizedAnalysis {
  return {
    expanded: false,
    show_trend_lines: false,
    trend_method: "rolling_average",
    trend_window: "24h",
    show_trend_crosshairs: false,
    show_summary_stats: false,
    show_rate_of_change: false,
    rate_window: "1h",
    show_threshold_analysis: false,
    show_threshold_shading: false,
    threshold_value: "",
    threshold_direction: "above",
    show_anomalies: false,
    anomaly_methods: [],
    anomaly_overlap_mode: "all",
    anomaly_sensitivity: "medium",
    anomaly_rate_window: "1h",
    anomaly_zscore_window: "24h",
    anomaly_persistence_window: "1h",
    anomaly_comparison_window_id: null,
    show_delta_analysis: false,
    show_delta_tooltip: false,
    show_delta_lines: false,
    hide_source_series: false,
    ...overrides,
  };
}

const comparisonWindows: ComparisonWindow[] = [
  { id: "last-week", label: "Last week" },
  { id: "last-month", label: "Last month" },
];

export const Default = {
  render: () => html`
    <dp-analysis-anomaly-group
      .analysis=${makeAnalysis()}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></dp-analysis-anomaly-group>
  `,
};

export const Checked = {
  render: () => html`
    <dp-analysis-anomaly-group
      .analysis=${makeAnalysis({ show_anomalies: true, anomaly_methods: ["iqr"], anomaly_sensitivity: "medium" })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></dp-analysis-anomaly-group>
  `,
};

export const CheckedWithMultipleMethods = {
  render: () => html`
    <dp-analysis-anomaly-group
      .analysis=${makeAnalysis({ show_anomalies: true, anomaly_methods: ["iqr", "rolling_zscore"], anomaly_sensitivity: "high", anomaly_overlap_mode: "highlight" })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></dp-analysis-anomaly-group>
  `,
};
