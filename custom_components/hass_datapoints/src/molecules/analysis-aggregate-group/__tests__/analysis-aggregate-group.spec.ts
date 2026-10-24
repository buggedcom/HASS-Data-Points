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

describe("analysis-aggregate-group measurement variant", () => {
  let el: GroupElement;
  afterEach(() => el?.remove());

  async function mountMeasurement(aggregates: AggregateDefinition[]) {
    el = document.createElement("analysis-aggregate-group") as GroupElement;
    Object.assign(el, {
      variant: "measurement",
      operations: ["mean", "min", "max"],
      analysis: { aggregates } as NormalizedAnalysis,
      entityId: "sensor.temp",
    });
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  describe("GIVEN a numeric sensor suggesting mean, min and max", () => {
    describe("WHEN an aggregate is added", () => {
      it("THEN a daily mean is created without states", async () => {
        expect.assertions(2);
        await mountMeasurement([]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        (el.shadowRoot!.querySelector(".add") as HTMLButtonElement).click();
        const [created] = handler.mock.calls[0][0].detail.value;
        expect(created).toMatchObject({ operation: "mean", interval: "day" });
        expect(created.states).toBeUndefined();
      });
    });
    describe("WHEN the operation select is rendered", () => {
      it("THEN offers only the suggested operations", async () => {
        expect.assertions(1);
        await mountMeasurement([
          definition({ operation: "mean", states: undefined }),
        ]);
        expect(selects(el)[0].options.map((o) => o.value)).toStrictEqual([
          "mean",
          "min",
          "max",
        ]);
      });
    });
    describe("WHEN the operation is changed to max", () => {
      it("THEN the definition keeps its id and interval", async () => {
        expect.assertions(1);
        await mountMeasurement([
          definition({
            operation: "mean",
            interval: "week",
            states: undefined,
          }),
        ]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[0], "max");
        expect(handler.mock.calls[0][0].detail.value[0]).toMatchObject({
          id: "a1",
          operation: "max",
          interval: "week",
        });
      });
    });
  });
});

describe("analysis-aggregate-group event variant", () => {
  let el: GroupElement & { eventTypes: string[]; variant: string };
  afterEach(() => el?.remove());

  async function mountEvent(aggregates: AggregateDefinition[]) {
    el = document.createElement("analysis-aggregate-group") as typeof el;
    Object.assign(el, {
      variant: "event",
      eventTypes: ["single_press", "double_press"],
      analysis: { aggregates } as NormalizedAnalysis,
      entityId: "event.button",
    });
    document.body.appendChild(el);
    await el.updateComplete;
  }
  const eventDefinition = (eventTypes: string[]) =>
    definition({ operation: "event_count", states: undefined, eventTypes });

  describe("GIVEN a button reporting single and double presses", () => {
    describe("WHEN an aggregate is added", () => {
      it("THEN it counts all event types by default", async () => {
        expect.assertions(1);
        await mountEvent([]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        (el.shadowRoot!.querySelector(".add") as HTMLButtonElement).click();
        expect(handler.mock.calls[0][0].detail.value[0]).toMatchObject({
          operation: "event_count",
          eventTypes: [],
        });
      });
    });
    describe("WHEN All event types is unchecked", () => {
      it("THEN the first type is selected and type choices appear", async () => {
        expect.assertions(2);
        await mountEvent([eventDefinition([])]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        const all = el.shadowRoot!.querySelector(
          ".all-types"
        ) as HTMLInputElement;
        all.checked = false;
        all.dispatchEvent(new Event("change"));
        expect(
          handler.mock.calls[0][0].detail.value[0].eventTypes
        ).toStrictEqual(["single_press"]);
        expect(el.shadowRoot!.querySelectorAll(".event-type")).toHaveLength(0);
      });
    });
    describe("WHEN specific types are selected", () => {
      it("THEN each type is individually toggleable", async () => {
        expect.assertions(2);
        await mountEvent([eventDefinition(["single_press"])]);
        const boxes = el.shadowRoot!.querySelectorAll(".event-type");
        expect(boxes).toHaveLength(2);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        const second = boxes[1] as HTMLInputElement;
        second.checked = true;
        second.dispatchEvent(new Event("change"));
        expect(
          handler.mock.calls[0][0].detail.value[0].eventTypes
        ).toStrictEqual(["single_press", "double_press"]);
      });
    });
  });
});
