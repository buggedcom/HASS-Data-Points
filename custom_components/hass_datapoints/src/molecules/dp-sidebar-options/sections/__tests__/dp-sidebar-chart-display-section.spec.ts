import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../dp-sidebar-chart-display-section";

function createElement(props: Record<string, unknown> = {}) {
  const el = document.createElement("dp-sidebar-chart-display-section") as HTMLElement & {
    showTooltips: boolean;
    showHoverGuides: boolean;
    showCorrelatedAnomalies: boolean;
    showDataGaps: boolean;
    dataGapThreshold: string;
    yAxisMode: string;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, {
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

type CheckboxListEl = HTMLElement & { items: { name: string; label: string; checked: boolean }[] };
type RadioGroupEl = HTMLElement & { name: string; value: string };

describe("dp-sidebar-chart-display-section", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  describe("GIVEN default props", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders a dp-sidebar-options-section", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-sidebar-options-section")).not.toBeNull();
      });

      it("THEN renders a dp-checkbox-list", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-checkbox-list")).not.toBeNull();
      });

      it("THEN renders the gap threshold select", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".gap-select")).not.toBeNull();
      });

      it("THEN renders the y-axis dp-radio-group", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("dp-radio-group")).not.toBeNull();
      });
    });
  });

  describe("GIVEN showDataGaps is true", () => {
    beforeEach(async () => {
      el = createElement({ showDataGaps: true });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the gap threshold select is not disabled", () => {
        expect.assertions(1);
        const select = el.shadowRoot!.querySelector<HTMLSelectElement>(".gap-select")!;
        expect(select.disabled).toBe(false);
      });

      it("THEN the subopt wrapper does not have is-disabled class", () => {
        expect.assertions(1);
        const subopt = el.shadowRoot!.querySelector(".is-subopt")!;
        expect(subopt.classList.contains("is-disabled")).toBe(false);
      });
    });
  });

  describe("GIVEN showDataGaps is false", () => {
    beforeEach(async () => {
      el = createElement({ showDataGaps: false });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the gap threshold select is disabled", () => {
        expect.assertions(1);
        const select = el.shadowRoot!.querySelector<HTMLSelectElement>(".gap-select")!;
        expect(select.disabled).toBe(true);
      });

      it("THEN the subopt wrapper has is-disabled class", () => {
        expect.assertions(1);
        const subopt = el.shadowRoot!.querySelector(".is-subopt")!;
        expect(subopt.classList.contains("is-disabled")).toBe(true);
      });
    });
  });

  describe("GIVEN yAxisMode is unique", () => {
    beforeEach(async () => {
      el = createElement({ yAxisMode: "unique" });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the y-axis radio group value is unique", () => {
        expect.assertions(1);
        const group = el.shadowRoot!.querySelector<RadioGroupEl>("dp-radio-group")!;
        expect(group.value).toBe("unique");
      });
    });
  });

  describe("GIVEN the component is rendered", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN the checkbox list emits dp-item-change for data_gaps=false", () => {
      it("THEN dispatches dp-display-change with kind=data_gaps and value=false", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-display-change", handler);
        el.shadowRoot!.querySelector<CheckboxListEl>("dp-checkbox-list")!.dispatchEvent(
          new CustomEvent("dp-item-change", { detail: { name: "data_gaps", checked: false }, bubbles: true, composed: true }),
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.kind).toBe("data_gaps");
        expect(handler.mock.calls[0][0].detail.value).toBe(false);
      });
    });

    describe("WHEN the gap threshold select changes", () => {
      it("THEN dispatches dp-display-change with kind=data_gap_threshold and the new value", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-display-change", handler);
        const select = el.shadowRoot!.querySelector<HTMLSelectElement>(".gap-select")!;
        select.value = "6h";
        select.dispatchEvent(new Event("change"));
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.kind).toBe("data_gap_threshold");
        expect(handler.mock.calls[0][0].detail.value).toBe("6h");
      });
    });

    describe("WHEN the y-axis radio group emits dp-radio-change with value=split", () => {
      it("THEN dispatches dp-display-change with kind=y_axis_mode and value=split", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-display-change", handler);
        el.shadowRoot!.querySelector<RadioGroupEl>("dp-radio-group")!.dispatchEvent(
          new CustomEvent("dp-radio-change", { detail: { value: "split" }, bubbles: true, composed: true }),
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.kind).toBe("y_axis_mode");
        expect(handler.mock.calls[0][0].detail.value).toBe("split");
      });
    });
  });
});
