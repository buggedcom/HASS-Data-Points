import { afterEach, describe, expect, it, vi } from "vitest";
import "../analysis-aggregate-group";
import type {
  AggregateDefinition,
  AggregateOperation,
} from "@/lib/domain/aggregation/types";
import type { NormalizedAnalysis } from "../../target-row/types";

type GroupElement = HTMLElement & {
  analysis: NormalizedAnalysis;
  entityId: string;
  deviceClass: string;
  variant: string;
  operations: AggregateOperation[];
  eventTypes: string[];
  updateComplete: Promise<boolean>;
};

const definition = (
  overrides: Partial<AggregateDefinition> = {}
): AggregateDefinition => ({
  id: "transition_count",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
  ...overrides,
});

async function mount(
  aggregates: AggregateDefinition[],
  props: Partial<GroupElement> = {}
) {
  const el = document.createElement("analysis-aggregate-group") as GroupElement;
  Object.assign(el, {
    analysis: { aggregates } as NormalizedAnalysis,
    entityId: "binary_sensor.front_door",
    deviceClass: "door",
    ...props,
  });
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const choice = (el: GroupElement, key: string) =>
  el.shadowRoot!.querySelector(
    `.aggregate-choice[data-key="${key}"]`
  ) as HTMLInputElement;

const check = (input: HTMLInputElement, checked: boolean) => {
  input.checked = checked;
  input.dispatchEvent(new Event("change"));
};

const selects = (el: GroupElement) =>
  [...el.shadowRoot!.querySelectorAll("inline-select")] as (HTMLElement & {
    value: string;
    options: { value: string; label: string }[];
  })[];

function choose(select: HTMLElement, value: string) {
  select.dispatchEvent(
    new CustomEvent("dp-change", {
      detail: { type: "select", value },
      bubbles: true,
      composed: true,
    })
  );
}

const lastValue = (handler: ReturnType<typeof vi.fn>) =>
  handler.mock.calls.at(-1)![0].detail.value as AggregateDefinition[];

describe("analysis-aggregate-group", () => {
  let el: GroupElement;
  afterEach(() => el?.remove());

  describe("GIVEN a door sensor with no aggregates", () => {
    describe("WHEN the group is rendered", () => {
      it("THEN the group is closed", async () => {
        expect.assertions(1);
        el = await mount([]);
        const group = el.shadowRoot!.querySelector(
          "analysis-group"
        ) as HTMLElement & { checked: boolean };
        expect(group.checked).toBe(false);
      });
    });

    describe("WHEN the group is switched on", () => {
      it("THEN the four binary choices appear unchecked", async () => {
        expect.assertions(2);
        el = await mount([]);
        el.shadowRoot!.querySelector("analysis-group")!.dispatchEvent(
          new CustomEvent("dp-group-change", {
            detail: { checked: true },
            bubbles: true,
            composed: true,
          })
        );
        await el.updateComplete;
        const boxes = [
          ...el.shadowRoot!.querySelectorAll(".aggregate-choice"),
        ] as HTMLInputElement[];
        expect(boxes.map((b) => b.dataset.key)).toStrictEqual([
          "transition_count",
          "all_changes",
          "state_duration",
          "state_percentage",
        ]);
        expect(boxes.every((b) => !b.checked)).toBe(true);
      });
    });
  });

  describe("GIVEN an enabled group on a door sensor", () => {
    describe("WHEN Count changes to a state is checked", () => {
      it("THEN a daily aggregate for the open state is added", async () => {
        expect.assertions(2);
        el = await mount([
          definition({ id: "state_duration", operation: "state_duration" }),
        ]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(choice(el, "transition_count"), true);
        const added = lastValue(handler).find(
          (d) => d.id === "transition_count"
        );
        expect(added).toMatchObject({
          operation: "transition_count",
          interval: "day",
          states: ["on"],
        });
        expect(lastValue(handler)).toHaveLength(2);
      });
    });

    describe("WHEN a checked aggregate is unchecked", () => {
      it("THEN only that aggregate is removed", async () => {
        expect.assertions(1);
        el = await mount([
          definition(),
          definition({ id: "state_duration", operation: "state_duration" }),
        ]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(choice(el, "transition_count"), false);
        expect(lastValue(handler).map((d) => d.id)).toStrictEqual([
          "state_duration",
        ]);
      });
    });

    describe("WHEN the master checkbox is switched off", () => {
      it("THEN every aggregate is cleared", async () => {
        expect.assertions(1);
        el = await mount([definition()]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        el.shadowRoot!.querySelector("analysis-group")!.dispatchEvent(
          new CustomEvent("dp-group-change", {
            detail: { checked: false },
            bubbles: true,
            composed: true,
          })
        );
        expect(lastValue(handler)).toStrictEqual([]);
      });
    });
  });

  describe("GIVEN a checked changes-to-state aggregate", () => {
    describe("WHEN its settings are shown", () => {
      it("THEN state choices use device labels but store canonical values", async () => {
        expect.assertions(2);
        el = await mount([definition()]);
        const [stateSelect] = selects(el);
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
        choose(selects(el)[0], "off");
        expect(lastValue(handler)[0].states).toStrictEqual(["off"]);
      });
    });

    describe("WHEN the interval is changed", () => {
      it("THEN only that aggregate changes", async () => {
        expect.assertions(2);
        el = await mount([
          definition(),
          definition({ id: "state_duration", operation: "state_duration" }),
        ]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        choose(selects(el)[1], "month");
        const next = lastValue(handler);
        expect(next[0].interval).toBe("month");
        expect(next[1].interval).toBe("day");
      });
    });
  });

  describe("GIVEN a checked all-state-changes aggregate", () => {
    it("THEN no state selector is shown, only the interval", async () => {
      expect.assertions(2);
      el = await mount([definition({ id: "all_changes", states: [] })]);
      expect(selects(el)).toHaveLength(1);
      expect(selects(el)[0].value).toBe("day");
    });
  });

  describe("GIVEN a percentage-of-time aggregate", () => {
    it("THEN no cumulative option is offered", async () => {
      expect.assertions(1);
      el = await mount([
        definition({ id: "state_percentage", operation: "state_percentage" }),
      ]);
      expect(el.shadowRoot!.querySelector(".cumulative")).toBeNull();
    });
  });

  describe("GIVEN a checked count aggregate", () => {
    describe("WHEN Cumulative is checked", () => {
      it("THEN the mode becomes cumulative and the zoom reset option appears", async () => {
        expect.assertions(3);
        el = await mount([definition()]);
        expect(el.shadowRoot!.querySelector(".reset-on-zoom")).toBeNull();
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(el.shadowRoot!.querySelector(".cumulative")!, true);
        expect(lastValue(handler)[0].mode).toBe("cumulative");
        el.analysis = { aggregates: lastValue(handler) } as NormalizedAnalysis;
        await el.updateComplete;
        check(el.shadowRoot!.querySelector(".reset-on-zoom")!, true);
        expect(lastValue(handler)[0].resetOnZoom).toBe(true);
      });
    });
  });
});

describe("analysis-aggregate-group measurement variant", () => {
  let el: GroupElement;
  afterEach(() => el?.remove());

  const mountMeasurement = (aggregates: AggregateDefinition[]) =>
    mount(aggregates, {
      variant: "measurement",
      operations: ["mean", "min", "consumption"],
      entityId: "sensor.energy",
    });

  describe("GIVEN a meter suggesting mean, min and consumption", () => {
    describe("WHEN an aggregate is checked", () => {
      it("THEN only suggested operations are offered and the definition has no states", async () => {
        expect.assertions(3);
        el = await mountMeasurement([
          definition({ id: "mean", operation: "mean", states: undefined }),
        ]);
        const keys = [
          ...el.shadowRoot!.querySelectorAll(".aggregate-choice"),
        ].map((b) => (b as HTMLInputElement).dataset.key);
        expect(keys).toStrictEqual(["mean", "min", "consumption"]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(choice(el, "min"), true);
        const added = lastValue(handler).find((d) => d.id === "min");
        expect(added).toMatchObject({ operation: "min", interval: "day" });
        expect(added!.states).toBeUndefined();
      });
    });

    describe("WHEN consumption is checked", () => {
      it("THEN its settings offer a cumulative option", async () => {
        expect.assertions(1);
        el = await mountMeasurement([
          definition({
            id: "consumption",
            operation: "consumption",
            states: undefined,
          }),
        ]);
        expect(el.shadowRoot!.querySelector(".cumulative")).not.toBeNull();
      });
    });

    describe("WHEN a mean aggregate is checked", () => {
      it("THEN no cumulative option is offered", async () => {
        expect.assertions(1);
        el = await mountMeasurement([
          definition({ id: "mean", operation: "mean", states: undefined }),
        ]);
        expect(el.shadowRoot!.querySelector(".cumulative")).toBeNull();
      });
    });
  });
});

describe("analysis-aggregate-group event variant", () => {
  let el: GroupElement;
  afterEach(() => el?.remove());

  const mountEvent = (aggregates: AggregateDefinition[]) =>
    mount(aggregates, {
      variant: "event",
      eventTypes: ["single_press", "double_press"],
      entityId: "event.button",
    });
  const eventDefinition = (eventTypes: string[]) =>
    definition({
      id: "event_count",
      operation: "event_count",
      states: undefined,
      eventTypes,
    });

  describe("GIVEN a button reporting single and double presses", () => {
    describe("WHEN Count events is checked", () => {
      it("THEN it counts all event types by default", async () => {
        expect.assertions(1);
        el = await mountEvent([eventDefinition([])]);
        check(choice(el, "event_count"), false);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(choice(el, "event_count"), true);
        expect(lastValue(handler)[0]).toMatchObject({
          operation: "event_count",
          eventTypes: [],
        });
      });
    });

    describe("WHEN All event types is unchecked", () => {
      it("THEN the first type is selected", async () => {
        expect.assertions(1);
        el = await mountEvent([eventDefinition([])]);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(el.shadowRoot!.querySelector(".all-types")!, false);
        expect(lastValue(handler)[0].eventTypes).toStrictEqual([
          "single_press",
        ]);
      });
    });

    describe("WHEN specific types are selected", () => {
      it("THEN each type is individually toggleable", async () => {
        expect.assertions(2);
        el = await mountEvent([eventDefinition(["single_press"])]);
        const boxes = el.shadowRoot!.querySelectorAll(".event-type");
        expect(boxes).toHaveLength(2);
        const handler = vi.fn();
        el.addEventListener("dp-group-analysis-change", handler);
        check(boxes[1] as HTMLInputElement, true);
        expect(lastValue(handler)[0].eventTypes).toStrictEqual([
          "single_press",
          "double_press",
        ]);
      });
    });
  });
});
