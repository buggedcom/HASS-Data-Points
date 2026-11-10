import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../series-preview-dialog";

type PreviewEl = HTMLElement & {
  open: boolean;
  heading: string;
  subheading: string;
  hass: unknown;
  chartConfig: RecordWithUnknownValues | null;
  showOpenChart: boolean;
  updateComplete: Promise<boolean>;
};

type ChartStub = HTMLElement & {
  config?: RecordWithUnknownValues;
  hass?: unknown;
};

// A stand-in for the real history card: records the config it was given.
if (!customElements.get("hass-datapoints-history-card")) {
  customElements.define(
    "hass-datapoints-history-card",
    class extends HTMLElement {
      config?: RecordWithUnknownValues;

      setConfig(config: RecordWithUnknownValues) {
        this.config = config;
      }
    }
  );
}

function createElement(props: Partial<PreviewEl> = {}): PreviewEl {
  const el = document.createElement("series-preview-dialog") as PreviewEl;
  Object.assign(el, {
    open: true,
    heading: "Kitchen",
    chartConfig: { entities: ["sensor.a"] },
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

const chartOf = (el: PreviewEl) =>
  el.shadowRoot!.querySelector(
    "hass-datapoints-history-card"
  ) as ChartStub | null;

describe("series-preview-dialog", () => {
  let el: PreviewEl;

  afterEach(() => {
    el?.remove();
    vi.restoreAllMocks();
  });

  describe("GIVEN an open dialog with a chart config", () => {
    beforeEach(async () => {
      el = createElement({ hass: { states: {} } });
      await el.updateComplete;
    });

    it("THEN mounts the history card with that config", () => {
      expect.assertions(2);
      expect(chartOf(el)?.config).toEqual({ entities: ["sensor.a"] });
      expect(chartOf(el)?.hass).toEqual({ states: {} });
    });

    describe("WHEN the config changes", () => {
      it("THEN re-configures the same chart element", async () => {
        expect.assertions(2);
        const first = chartOf(el);
        el.chartConfig = { entities: ["sensor.b"] };
        await el.updateComplete;
        expect(chartOf(el)).toBe(first);
        expect(chartOf(el)?.config).toEqual({ entities: ["sensor.b"] });
      });
    });

    describe("WHEN Open in chart is clicked", () => {
      it("THEN fires dp-series-preview-open-chart", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-series-preview-open-chart", handler);
        (
          el.shadowRoot!.querySelector(
            ".series-preview-open-chart"
          ) as HTMLElement
        ).click();
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    describe("WHEN Close is clicked", () => {
      it("THEN fires dp-series-preview-close", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-series-preview-close", handler);
        (
          el.shadowRoot!.querySelector(".series-preview-close") as HTMLElement
        ).click();
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    describe("WHEN the dialog closes", () => {
      it("THEN unmounts the chart", async () => {
        expect.assertions(1);
        el.open = false;
        await el.updateComplete;
        expect(chartOf(el)).toBeNull();
      });
    });
  });

  describe("GIVEN showOpenChart=false", () => {
    it("THEN hides the Open in chart action", async () => {
      expect.assertions(1);
      el = createElement({ showOpenChart: false });
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector(".series-preview-open-chart")
      ).toBeNull();
    });
  });
});
