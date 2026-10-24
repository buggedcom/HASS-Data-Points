import { html } from "lit";
import { expect, userEvent } from "@storybook/test";
import "../analysis-aggregate-group";
import type { AggregateDefinition } from "@/lib/domain/aggregation/types";

export default {
  title: "Molecules/Analysis/Aggregate Group",
  component: "analysis-aggregate-group",
  parameters: {
    actions: { handles: ["dp-group-analysis-change"] },
  },
};

const door: AggregateDefinition = {
  id: "door-opens",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
};

export const Empty = {
  render: () => html`
    <analysis-aggregate-group
      .analysis=${{ aggregates: [] }}
      .entityId=${"binary_sensor.front_door"}
      .deviceClass=${"door"}
    ></analysis-aggregate-group>
  `,
};

export const DoorSensorWithAggregates = {
  render: () => html`
    <analysis-aggregate-group
      .analysis=${{
        aggregates: [
          door,
          {
            ...door,
            id: "door-open-time",
            operation: "state_duration",
            interval: "week",
          },
        ],
      }}
      .entityId=${"binary_sensor.front_door"}
      .deviceClass=${"door"}
    ></analysis-aggregate-group>
  `,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const group = canvasElement.querySelector(
      "analysis-aggregate-group"
    ) as HTMLElement;
    const events: CustomEvent[] = [];
    group.addEventListener("dp-group-analysis-change", (e) =>
      events.push(e as CustomEvent)
    );
    const add = group.shadowRoot!.querySelector(".add") as HTMLElement;
    add.focus();
    await userEvent.keyboard("{Enter}");
    await expect(events[0].detail.value).toHaveLength(3);
  },
};
