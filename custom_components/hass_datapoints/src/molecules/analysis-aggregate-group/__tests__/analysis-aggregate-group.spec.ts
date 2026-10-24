import { afterEach, describe, expect, it, vi } from "vitest";
import "../analysis-aggregate-group";
import type { AggregateDefinition } from "@/lib/domain/aggregation/types";
import type { NormalizedAnalysis } from "../../target-row/types";

type GroupElement = HTMLElement & {
  analysis: NormalizedAnalysis;
  entityId: string;
  deviceClass: string;
  updateComplete: Promise<boolean>;
};

const definition = (
  overrides: Partial<AggregateDefinition> = {}
): AggregateDefinition => ({
  id: "a1",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
  ...overrides,
});

async function mount(aggregates: AggregateDefinition[], deviceClass = "door") {
  const el = document.createElement("analysis-aggregate-group") as GroupElement;
  el.analysis = { aggregates } as NormalizedAnalysis;
  el.entityId = "binary_sensor.front_door";
  el.deviceClass = deviceClass;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function selects(el: GroupElement) {
  return [
    ...el.shadowRoot!.querySelectorAll("inline-select"),
  ] as (HTMLElement & {
    value: string;
    options: { value: string; label: string }[];
  })[];
}

function choose(select: HTMLElement, value: string) {
  select.dispatchEvent(
    new CustomEvent("dp-change", {
      detail: { type: "select", value },
      bubbles: true,
      composed: true,
    })
  );
}

describe("analysis-aggregate-group", () => {
  let el: GroupElement;
  afterEach(() => el?.remove());

  describe("GIVEN no aggregates on a door sensor", () => {
    describe("WHEN the add button is activated", () => {
      it("THEN emits the full list with one new daily transition aggregate for the open state", async () => {
        expect.assertions(4);
        el = await mount([]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        (el.shadowRoot!.querySelector(".add") as HTMLButtonElement).click();
        const { key, value, entityId } = handler.mock.calls[0][0].detail;
        expect(key).toBe("aggregates");
        expect(entityId).toBe("binary_sensor.front_door");
        expect(value).toHaveLength(1);
        expect(value[0]).toMatchObject({
          operation: "transition_count",
          interval: "day",
          states: ["on"],
        });
      });
    });
  });

  describe("GIVEN an aggregate on a door sensor", () => {
    describe("WHEN rendered", () => {
      it("THEN state choices use device labels but store canonical values", async () => {
        expect.assertions(2);
        el = await mount([definition()]);
        const stateSelect = selects(el)[1];
        expect(stateSelect.options.map((o) => o.label)).toStrictEqual([
          "Open",
          "Closed",
        ]);
        expect(stateSelect.options.map((o) => o.value)).toStrictEqual([
          "on",
          "off",
        ]);
      });
    });

    describe("WHEN the state is changed to Closed", () => {
      it("THEN emits the stored value off", async () => {
        expect.assertions(1);
        el = await mount([definition()]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[1], "off");
        expect(handler.mock.calls[0][0].detail.value[0].states).toStrictEqual([
          "off",
        ]);
      });
    });

    describe("WHEN the operation is changed to all state changes", () => {
      it("THEN states are cleared and the state selector is hidden", async () => {
        expect.assertions(2);
        el = await mount([definition()]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[0], "all_changes");
        expect(handler.mock.calls[0][0].detail.value[0]).toMatchObject({
          operation: "transition_count",
          states: [],
        });
        el.analysis = {
          aggregates: handler.mock.calls[0][0].detail.value,
        } as NormalizedAnalysis;
        await el.updateComplete;
        expect(selects(el)).toHaveLength(2);
      });
    });

    describe("WHEN the operation is changed to percentage of time", () => {
      it("THEN a cumulative aggregate falls back to per-interval mode", async () => {
        expect.assertions(1);
        el = await mount([definition({ mode: "cumulative" })]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[0], "state_percentage");
        expect(handler.mock.calls[0][0].detail.value[0]).toMatchObject({
          operation: "state_percentage",
          mode: "interval",
        });
      });
    });

    describe("WHEN the interval is changed", () => {
      it("THEN only that definition changes", async () => {
        expect.assertions(2);
        el = await mount([definition(), definition({ id: "a2" })]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[2], "month");
        const next = handler.mock.calls[0][0].detail.value;
        expect(next[0].interval).toBe("month");
        expect(next[1].interval).toBe("day");
      });
    });

    describe("WHEN the remove button is activated", () => {
      it("THEN emits the list without that definition", async () => {
        expect.assertions(1);
        el = await mount([definition(), definition({ id: "a2" })]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        (el.shadowRoot!.querySelector(".remove") as HTMLButtonElement).click();
        expect(
          handler.mock.calls[0][0].detail.value.map(
            (d: AggregateDefinition) => d.id
          )
        ).toStrictEqual(["a2"]);
      });
    });
  });
});
