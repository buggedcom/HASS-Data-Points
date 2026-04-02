import { html } from "lit";
import "../dp-form-group";

export default {
  title: "Atoms/Display/Form Group",
  component: "dp-form-group",
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
  },
};

export const Default = {
  render: () => html`
    <dp-form-group
      .label=${"Entity"}
      .description=${"Select the entity to track for this data point"}
    >
      <input type="text" placeholder="sensor.temperature" />
    </dp-form-group>
  `,
};

export const LabelOnly = {
  render: () => html`
    <dp-form-group .label=${"Name"}>
      <input type="text" placeholder="Enter a name" />
    </dp-form-group>
  `,
};

export const DescriptionOnly = {
  render: () => html`
    <dp-form-group .description=${"Optional context about this data point"}>
      <textarea placeholder="Add notes..."></textarea>
    </dp-form-group>
  `,
};
