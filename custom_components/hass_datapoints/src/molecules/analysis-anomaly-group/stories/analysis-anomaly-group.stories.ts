import { html } from "lit";
import { expect } from "@storybook/test";
import "../analysis-anomaly-group";
import type {
  NormalizedAnalysis,
  ComparisonWindow,
} from "../../target-row/types";
import { setFrontendLocale } from "@/lib/i18n/localize";

export default {
  title: "Molecules/Analysis/Anomaly Group",
  component: "analysis-anomaly-group",
  parameters: {
    actions: {
      handles: ["dp-group-analysis-change"],
    },
  },
  loaders: [
    async () => {
      await setFrontendLocale("en");
      return {};
    },
  ],
};

function makeAnalysis(
  overrides: Partial<NormalizedAnalysis> = {}
): NormalizedAnalysis {
  return {
    expanded: false,
    show_trend_lines: false,
    trend_method: "rolling_average",
    trend_window: "24h",
    show_trend_crosshairs: false,
    show_summary_stats: false,
    show_summary_stats_shading: false,
    show_rate_of_change: false,
    show_rate_crosshairs: false,
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
    sample_interval: "raw",
    sample_aggregate: "mean",
    stepped_series: false,
    anomaly_use_sampled_data: false,
    anomaly_trend_method: "",
    anomaly_trend_window: "24h",
    ...overrides,
  };
}

const comparisonWindows: ComparisonWindow[] = [
  { id: "last-week", label: "Last week" },
  { id: "last-month", label: "Last month" },
];

export const Default = {
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis()}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
};

export const Checked = {
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["iqr"],
        anomaly_sensitivity: "medium",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "analysis-anomaly-group"
    ) as HTMLElement & {
      shadowRoot: ShadowRoot;
      analysis: NormalizedAnalysis;
    };
    expect(
      el.shadowRoot.querySelector('ha-tooltip[for="anomaly-help-iqr"]')
    ).toBeTruthy();
    expect(el.shadowRoot.textContent).toContain("Statistical outlier");
  },
};

export const CheckedWithMultipleMethods = {
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["iqr", "rolling_zscore"],
        anomaly_sensitivity: "high",
        anomaly_overlap_mode: "only",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
};

export const TrendDeviationDefaultTrend = {
  name: "Trend deviation — same as display trend",
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["trend_residual"],
        anomaly_trend_method: "",
        anomaly_trend_window: "24h",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "analysis-anomaly-group"
    ) as HTMLElement & { shadowRoot: ShadowRoot };
    // Subopts should render with a single method select
    const selects = el.shadowRoot.querySelectorAll(
      "analysis-method-subopts select"
    );
    expect(selects.length).toBe(1);
    expect((selects[0] as HTMLSelectElement).value).toBe("");
    expect(el.shadowRoot.textContent).toContain("Same as display trend");
  },
};

export const TrendDeviationOverriddenWithEma = {
  name: "Trend deviation — overridden with EMA 6h",
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["trend_residual"],
        anomaly_trend_method: "ema",
        anomaly_trend_window: "6h",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "analysis-anomaly-group"
    ) as HTMLElement & { shadowRoot: ShadowRoot };
    // Both method and window selects should be visible
    const selects = el.shadowRoot.querySelectorAll(
      "analysis-method-subopts select"
    );
    expect(selects.length).toBe(2);
    expect(
      (selects[0] as HTMLSelectElement).querySelector('option[value="ema"]')
    ).toBeTruthy();
    expect(
      (selects[1] as HTMLSelectElement).querySelector('option[value="6h"]')
    ).toBeTruthy();
  },
};

export const TrendDeviationOverriddenWithLowess = {
  name: "Trend deviation — overridden with LOWESS 24h",
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["trend_residual"],
        anomaly_trend_method: "lowess",
        anomaly_trend_window: "24h",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
};

export const TrendDeviationOverriddenWithLinear = {
  name: "Trend deviation — overridden with linear (no window)",
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["trend_residual"],
        anomaly_trend_method: "linear_trend",
        anomaly_trend_window: "24h",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "analysis-anomaly-group"
    ) as HTMLElement & { shadowRoot: ShadowRoot };
    // Linear trend has no window — only the method select should render
    const selects = el.shadowRoot.querySelectorAll(
      "analysis-method-subopts select"
    );
    expect(selects.length).toBe(1);
  },
};

export const TrendDeviationAlongsideOtherMethods = {
  name: "Trend deviation alongside other methods",
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["trend_residual", "rate_of_change", "iqr"],
        anomaly_sensitivity: "high",
        anomaly_overlap_mode: "only",
        anomaly_trend_method: "polynomial_trend",
        anomaly_trend_window: "24h",
        anomaly_rate_window: "6h",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
};

export const Finnish = {
  loaders: [
    async () => {
      await setFrontendLocale("fi");
      return {};
    },
  ],
  render: () => html`
    <analysis-anomaly-group
      .analysis=${makeAnalysis({
        show_anomalies: true,
        anomaly_methods: ["iqr"],
        anomaly_sensitivity: "medium",
      })}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${comparisonWindows}
    ></analysis-anomaly-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "analysis-anomaly-group"
    ) as HTMLElement & {
      shadowRoot: ShadowRoot;
      analysis: NormalizedAnalysis;
    };
    expect(el.analysis.show_anomalies).toBe(true);
    expect(el.shadowRoot.textContent).toContain("Herkkyys");
    expect(el.shadowRoot.textContent).toContain("Tilastollinen poikkeama");
  },
};
