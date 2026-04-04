import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as historyApi from "@/lib/data/history-api.js";
import "../history-chart";

type HistoryChartEl = HTMLElement & {
  _hiddenSeries: Set<string>;
  _config?: Record<string, unknown>;
  _hass?: Record<string, unknown> | null;
  _getDrawableComparisonResults(
    comparisonResults: Array<{
      id: string;
      time_offset_ms: number;
      histResult: unknown;
      statsResult: unknown;
      label?: string;
    }>
  ): Array<{
    id: string;
    time_offset_ms: number;
    histResult: unknown;
    statsResult: unknown;
    label?: string;
  }>;
  _resolveComparisonWindowPoints(
    entityId: string,
    comparisonWindow: {
      id: string;
      time_offset_ms: number;
      histResult: unknown;
      statsResult: unknown;
      label?: string;
    },
    analysis: Record<string, unknown>,
    renderT0: number,
    renderT1: number
  ): Promise<[number, number][]>;
  _renderLegend(series: unknown[], binaryBackgrounds: unknown[]): void;
  _syncTopSlotOffset(): void;
};

describe("hass-datapoints-history-chart", () => {
  let el: HistoryChartEl;

  beforeEach(() => {
    el = document.createElement(
      "hass-datapoints-history-chart"
    ) as HistoryChartEl;
    el._hiddenSeries = new Set();
    document.body.appendChild(el);
  });

  afterEach(() => {
    el?.remove();
  });

  describe("GIVEN the chart shell is initialized", () => {
    describe("WHEN the top slot host is inspected", () => {
      it("THEN it renders the comparison tab mount point", () => {
        expect.assertions(5);
        const topSlot = el.querySelector<HTMLElement>("#chart-top-slot");

        expect(topSlot).not.toBeNull();
        expect(topSlot?.classList.contains("chart-top-slot")).toBe(true);
        expect(topSlot?.hasAttribute("hidden")).toBe(true);
        expect(el.innerHTML).toContain(
          "margin-left: calc(var(--dp-spacing-md) * -1);"
        );
        expect(el.innerHTML).toContain(
          "top: calc(var(--dp-chart-top-slot-height, 0px) + var(--dp-spacing-sm));"
        );
      });
    });
  });

  describe("GIVEN cached comparison results include preloaded windows", () => {
    describe("WHEN resolving drawable comparison results", () => {
      it("THEN it keeps only the actively previewed windows", () => {
        expect.assertions(1);
        el._config = {
          comparison_windows: [{ id: "active-window" }],
        };

        const drawableResults = el._getDrawableComparisonResults([
          {
            id: "active-window",
            time_offset_ms: 0,
            histResult: {},
            statsResult: {},
            label: "Active",
          },
          {
            id: "preloaded-window",
            time_offset_ms: 1000,
            histResult: {},
            statsResult: {},
            label: "Preloaded",
          },
        ]);

        expect(drawableResults.map((result) => result.id)).toEqual([
          "active-window",
        ]);
      });

      it("THEN it includes a hovered preloaded window without drawing every cached preload", () => {
        expect.assertions(1);
        el._config = {
          comparison_windows: [],
          hovered_comparison_window_id: "hovered-window",
        };

        const drawableResults = el._getDrawableComparisonResults([
          {
            id: "hovered-window",
            time_offset_ms: 0,
            histResult: {},
            statsResult: {},
            label: "Hovered",
          },
          {
            id: "preloaded-window",
            time_offset_ms: 1000,
            histResult: {},
            statsResult: {},
            label: "Preloaded",
          },
        ]);

        expect(drawableResults.map((result) => result.id)).toEqual([
          "hovered-window",
        ]);
      });
    });
  });

  describe("GIVEN a comparison window uses sampled series settings", () => {
    describe("WHEN resolving its chart points", () => {
      it("THEN it fetches downsampled history and shifts the timestamps back to the main range", async () => {
        expect.assertions(2);
        const fetchSpy = vi
          .spyOn(historyApi, "fetchDownsampledHistory")
          .mockResolvedValue([[3_600_000, 12]]);
        el._hass = { connection: {} };

        const points = await el._resolveComparisonWindowPoints(
          "sensor.temperature",
          {
            id: "window-a",
            time_offset_ms: 3_600_000,
            histResult: {},
            statsResult: {},
            label: "Window A",
          },
          {
            sample_interval: "1h",
            sample_aggregate: "mean",
          },
          0,
          7_200_000
        );

        expect(fetchSpy).toHaveBeenCalledWith(
          el._hass,
          "sensor.temperature",
          new Date(3_600_000).toISOString(),
          new Date(10_800_000).toISOString(),
          "1h",
          "mean"
        );
        expect(points).toEqual([[0, 12]]);
      });
    });
  });

  describe("GIVEN sampled comparison data is unavailable", () => {
    describe("WHEN resolving comparison points", () => {
      it("THEN it falls back to the raw comparison series instead of hiding the line", async () => {
        expect.assertions(2);
        const fetchSpy = vi
          .spyOn(historyApi, "fetchDownsampledHistory")
          .mockResolvedValue([]);
        el._hass = { connection: {} };
        el._buildEntityStateList = () => [
          { lu: 3600, s: "12" },
          { lu: 7200, s: "13" },
        ];

        const points = await el._resolveComparisonWindowPoints(
          "sensor.temperature",
          {
            id: "window-a",
            time_offset_ms: 3_600_000,
            histResult: {},
            statsResult: {},
            label: "Window A",
          },
          {
            sample_interval: "1h",
            sample_aggregate: "mean",
          },
          0,
          7_200_000
        );

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(points).toEqual([
          [0, 12],
          [3_600_000, 13],
        ]);
      });

      it("THEN it re-aggregates the available raw comparison points to the requested interval", async () => {
        expect.assertions(2);
        vi.spyOn(historyApi, "fetchDownsampledHistory").mockResolvedValue([]);
        el._hass = { connection: {} };
        el._buildEntityStateList = () => [
          { lu: 3600, s: "12" },
          { lu: 7200, s: "18" },
          { lu: 10800, s: "6" },
        ];

        const points = await el._resolveComparisonWindowPoints(
          "sensor.temperature",
          {
            id: "window-a",
            time_offset_ms: 3_600_000,
            histResult: {},
            statsResult: {},
            label: "Window A",
          },
          {
            sample_interval: "3h",
            sample_aggregate: "mean",
          } as never,
          0,
          10_800_000
        );

        expect(points).toHaveLength(1);
        expect(points[0]).toEqual([0, 12]);
      });
    });
  });

  describe("GIVEN the comparison tab rail is visible", () => {
    describe("WHEN syncing the top slot offset", () => {
      it("THEN it stores the top slot height on the chart host", () => {
        expect.assertions(1);
        const topSlot = el.querySelector<HTMLElement>("#chart-top-slot")!;
        topSlot.hidden = false;
        Object.defineProperty(topSlot, "offsetHeight", {
          configurable: true,
          value: 54,
        });

        el._syncTopSlotOffset();

        expect(el.style.getPropertyValue("--dp-chart-top-slot-height")).toBe(
          "54px"
        );
      });
    });
  });

  describe("GIVEN legend items are rendered", () => {
    beforeEach(() => {
      el._renderLegend(
        [
          {
            entityId: "sensor.temperature",
            label: "Temperature",
            color: "#83c705",
          },
        ],
        []
      );
    });

    describe("WHEN the legend markup is inspected", () => {
      it("THEN it renders a swatch and label inside the legend toggle", () => {
        expect.assertions(6);
        const toggle = el.querySelector<HTMLElement>(".legend-toggle");
        const line = el.querySelector<HTMLElement>(".legend-line");
        const label = el.querySelector<HTMLElement>(".legend-label");
        const legend = el.querySelector<HTMLElement>(".legend");

        legend!.style.setProperty("--dp-chart-axis-left-width", "24px");

        expect(toggle).not.toBeNull();
        expect(line).not.toBeNull();
        expect(label?.textContent).toBe("Temperature");
        expect(getComputedStyle(toggle!).display).toBe("inline-flex");
        expect(getComputedStyle(line!).display).toBe("inline-block");
        expect(el.innerHTML).toContain(
          "padding-left: calc(var(--dp-spacing-md) + var(--dp-chart-axis-left-width, 0px));"
        );
      });
    });
  });

  describe("GIVEN chart axis overlay widths are updated", () => {
    describe("WHEN the host receives the axis width variable", () => {
      it("THEN the legend offset variable is stored on the chart host", () => {
        expect.assertions(2);
        el.style.setProperty("--dp-chart-axis-left-width", "28px");
        el.style.setProperty("--dp-chart-axis-right-width", "0px");

        expect(el.style.getPropertyValue("--dp-chart-axis-left-width")).toBe(
          "28px"
        );
        expect(el.style.getPropertyValue("--dp-chart-axis-right-width")).toBe(
          "0px"
        );
      });
    });
  });

  describe("GIVEN the split chart add-annotation button exists", () => {
    beforeEach(() => {
      const addButton = el.querySelector<HTMLElement>("#chart-add-annotation");
      addButton?.removeAttribute("hidden");
      el._chartLastHover = { timeMs: 1 };
    });

    describe("WHEN the overlay mouse leaves onto the add button", () => {
      it("THEN the current hover state is preserved", () => {
        expect.assertions(1);
        const addButton = el.querySelector<HTMLElement>(
          "#chart-add-annotation"
        )!;
        const onMouseLeave = (ev: MouseEvent) => {
          const nextTarget = ev.relatedTarget;
          const button = el.querySelector("#chart-add-annotation");
          if (
            nextTarget &&
            button instanceof HTMLElement &&
            button.contains(nextTarget as Node)
          ) {
            return;
          }
          el._chartLastHover = null;
        };

        onMouseLeave({ relatedTarget: addButton } as MouseEvent);

        expect(el._chartLastHover).toEqual({ timeMs: 1 });
      });
    });
  });
});
