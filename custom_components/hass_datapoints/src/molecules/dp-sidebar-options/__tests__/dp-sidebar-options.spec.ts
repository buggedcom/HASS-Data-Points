import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../dp-sidebar-options";

function createElement(props: Record<string, unknown> = {}) {
  const el = document.createElement("dp-sidebar-options") as HTMLElement & {
    datapointScope: string;
    showIcons: boolean;
    showLines: boolean;
    showTooltips: boolean;
    showHoverGuides: boolean;
    showCorrelatedAnomalies: boolean;
    showDataGaps: boolean;
    dataGapThreshold: string;
    yAxisMode: string;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, {
    datapointScope: "linked",
    showIcons: true,
    showLines: true,
    showTooltips: true,
    showHoverGuides: false,
    showCorrelatedAnomalies: false,
    showDataGaps: true,
    dataGapThreshold: "2h",
    yAxisMode: "combined",
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

type DatapointsSectionEl = HTMLElement & { datapointScope: string };
type DatapointDisplaySectionEl = HTMLElement & { showIcons: boolean; showLines: boolean };
type ChartDisplaySectionEl = HTMLElement & {
  showTooltips: boolean;
  showHoverGuides: boolean;
  showCorrelatedAnomalies: boolean;
  showDataGaps: boolean;
  dataGapThreshold: string;
  yAxisMode: string;
};

describe("dp-sidebar-options", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  describe("GIVEN default props", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders dp-sidebar-datapoints-section", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-sidebar-datapoints-section")).not.toBeNull();
      });

      it("THEN renders dp-sidebar-datapoint-display-section", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-sidebar-datapoint-display-section")).not.toBeNull();
      });

      it("THEN renders dp-sidebar-chart-display-section", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-sidebar-chart-display-section")).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Prop binding — datapoints section
  // ---------------------------------------------------------------------------

  describe("GIVEN datapointScope is all", () => {
    beforeEach(async () => {
      el = createElement({ datapointScope: "all" });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN dp-sidebar-datapoints-section receives datapointScope=all", () => {
        expect.assertions(1);
        const section = el.shadowRoot!.querySelector<DatapointsSectionEl>("dp-sidebar-datapoints-section")!;
        expect(section.datapointScope).toBe("all");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Prop binding — datapoint display section
  // ---------------------------------------------------------------------------

  describe("GIVEN showIcons=false and showLines=false", () => {
    beforeEach(async () => {
      el = createElement({ showIcons: false, showLines: false });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN dp-sidebar-datapoint-display-section receives showIcons=false", () => {
        expect.assertions(1);
        const section = el.shadowRoot!.querySelector<DatapointDisplaySectionEl>("dp-sidebar-datapoint-display-section")!;
        expect(section.showIcons).toBe(false);
      });

      it("THEN dp-sidebar-datapoint-display-section receives showLines=false", () => {
        expect.assertions(1);
        const section = el.shadowRoot!.querySelector<DatapointDisplaySectionEl>("dp-sidebar-datapoint-display-section")!;
        expect(section.showLines).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Prop binding — chart display section
  // ---------------------------------------------------------------------------

  describe("GIVEN showDataGaps=false and yAxisMode=split", () => {
    beforeEach(async () => {
      el = createElement({ showDataGaps: false, yAxisMode: "split" });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN dp-sidebar-chart-display-section receives showDataGaps=false", () => {
        expect.assertions(1);
        const section = el.shadowRoot!.querySelector<ChartDisplaySectionEl>("dp-sidebar-chart-display-section")!;
        expect(section.showDataGaps).toBe(false);
      });

      it("THEN dp-sidebar-chart-display-section receives yAxisMode=split", () => {
        expect.assertions(1);
        const section = el.shadowRoot!.querySelector<ChartDisplaySectionEl>("dp-sidebar-chart-display-section")!;
        expect(section.yAxisMode).toBe("split");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Event bubbling
  // ---------------------------------------------------------------------------

  describe("GIVEN the component is rendered", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN dp-scope-change bubbles from dp-sidebar-datapoints-section", () => {
      it("THEN the event reaches listeners on the host element", () => {
        expect.assertions(2);
        const handler = vi.fn();
        el.addEventListener("dp-scope-change", handler);
        el.shadowRoot!.querySelector("dp-sidebar-datapoints-section")!.dispatchEvent(
          new CustomEvent("dp-scope-change", { detail: { value: "all" }, bubbles: true, composed: true }),
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.value).toBe("all");
      });
    });

    describe("WHEN dp-display-change bubbles from dp-sidebar-chart-display-section", () => {
      it("THEN the event reaches listeners on the host element", () => {
        expect.assertions(2);
        const handler = vi.fn();
        el.addEventListener("dp-display-change", handler);
        el.shadowRoot!.querySelector("dp-sidebar-chart-display-section")!.dispatchEvent(
          new CustomEvent("dp-display-change", { detail: { kind: "tooltips", value: false }, bubbles: true, composed: true }),
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.kind).toBe("tooltips");
      });
    });
  });
});
