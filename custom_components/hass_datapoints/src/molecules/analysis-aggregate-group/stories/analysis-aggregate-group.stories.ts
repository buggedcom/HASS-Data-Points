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

const opens: AggregateDefinition = {
  id: "transition_count",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
};

export const Off = {
  render: () => html`
    <analysis-aggregate-group
      .analysis=${{ aggregates: [] }}
      .entityId=${"binary_sensor.front_door"}
      .deviceClass=${"door"}
    ></analysis-aggregate-group>
  `,
};

/** Checked aggregates show their settings nested beneath them. */
export const DoorSensorWithAggregates = {
  render: () => html`
    <analysis-aggregate-group
      .analysis=${{
        aggregates: [
          opens,
          {
            ...opens,
            id: "state_duration",
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
    // Keyboard: focus an unchecked choice and press space to enable it.
    const percentage = group.shadowRoot!.querySelector(
      '.aggregate-choice[data-key="state_percentage"]'
    ) as HTMLInputElement;
    percentage.focus();
    await userEvent.keyboard(" ");
    await expect(events.at(-1)!.detail.value).toHaveLength(3);
  },
};

export const NumericMeter = {
  render: () => html`
    <analysis-aggregate-group
      variant="measurement"
      .operations=${["mean", "min", "max", "consumption"]}
      .analysis=${{
        aggregates: [
          {
            ...opens,
            id: "consumption",
            operation: "consumption",
            states: undefined,
          },
        ],
      }}
      .entityId=${"sensor.energy"}
    ></analysis-aggregate-group>
  `,
};
