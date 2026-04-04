import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../analysis-anomaly-group";
import type {
  NormalizedAnalysis,
  ComparisonWindow,
} from "../../target-row/types";
import { setFrontendLocale } from "@/lib/i18n/localize";

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

function createElement(
  props: {
    analysis?: Partial<NormalizedAnalysis>;
    entityId?: string;
    comparisonWindows?: ComparisonWindow[];
  } = {}
) {
  const el = document.createElement("analysis-anomaly-group") as HTMLElement & {
    analysis: NormalizedAnalysis;
    entityId: string;
    comparisonWindows: ComparisonWindow[];
    updateComplete: Promise<boolean>;
  };
  el.analysis = makeAnalysis(props.analysis);
  el.entityId = props.entityId ?? "sensor.test";
  el.comparisonWindows = props.comparisonWindows ?? [];
  document.body.appendChild(el);
  return el;
}

describe("analysis-anomaly-group", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(async () => {
    el?.remove();
    await setFrontendLocale("en");
  });

  describe("GIVEN show_anomalies=false", () => {
    beforeEach(async () => {
      el = createElement({ analysis: { show_anomalies: false } });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders analysis-group with checked=false", () => {
        expect.assertions(1);
        const group = el.shadowRoot!.querySelector(
          "analysis-group"
        ) as HTMLElement & { checked: boolean };
        expect(group.checked).toBe(false);
      });
    });
  });

  describe("GIVEN show_anomalies=true", () => {
    beforeEach(async () => {
      el = createElement({
        analysis: { show_anomalies: true, anomaly_methods: ["iqr"] },
      });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders analysis-group with checked=true", () => {
        expect.assertions(1);
        const group = el.shadowRoot!.querySelector(
          "analysis-group"
        ) as HTMLElement & { checked: boolean };
        expect(group.checked).toBe(true);
      });

      it("THEN it renders tooltip help for anomaly methods", () => {
        expect.assertions(4);
        const trigger = el.shadowRoot!.querySelector("#anomaly-help-iqr");
        const tooltip = el.shadowRoot!.querySelector(
          'ha-tooltip[for="anomaly-help-iqr"]'
        );
        expect(trigger).toBeTruthy();
        expect(trigger?.textContent?.trim()).toBe("?");
        expect(tooltip).toBeTruthy();
        expect(tooltip?.textContent?.trim()).toContain("interquartile range");
      });
    });
  });

  describe("GIVEN a rendered anomaly group", () => {
    beforeEach(async () => {
      el = createElement({ analysis: { show_anomalies: false } });
      await el.updateComplete;
    });

    describe("WHEN dp-group-change fires with checked=true", () => {
      it("THEN dispatches dp-group-analysis-change with key=show_anomalies and value=true", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        const group = el.shadowRoot!.querySelector("analysis-group")!;
        group.dispatchEvent(
          new CustomEvent("dp-group-change", {
            detail: { checked: true },
            bubbles: true,
            composed: true,
          })
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.key).toBe("show_anomalies");
        expect(handler.mock.calls[0][0].detail.value).toBe(true);
      });
    });
  });

  describe("GIVEN a translated language object", () => {
    beforeEach(async () => {
      await setFrontendLocale("fi");
      el = createElement({
        analysis: { show_anomalies: true, anomaly_methods: ["iqr"] },
      });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the passed translated strings", () => {
        expect.assertions(3);
        const analysisGroup = el.shadowRoot!.querySelector(
          "analysis-group"
        ) as HTMLElement & { label: string };
        const sensitivityLabel = el.shadowRoot!.querySelector(".field-label");
        const iqrHelpTrigger =
          el.shadowRoot!.querySelector("#anomaly-help-iqr");
        const methodLabel = iqrHelpTrigger?.previousElementSibling;

        expect(analysisGroup.label).toBe("Näytä poikkeamat");
        expect(sensitivityLabel?.textContent).toBe("Herkkyys");
        expect(methodLabel?.textContent).toBe("Tilastollinen poikkeama (IQR)");
      });
    });
  });
});
