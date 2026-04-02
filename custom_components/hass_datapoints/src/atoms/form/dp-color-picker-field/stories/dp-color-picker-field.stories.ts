import { html } from "lit";
import "../dp-color-picker-field";

export default {
  title: "Atoms/Form/Color Picker Field",
  component: "dp-color-picker-field",
  argTypes: {
    color: { control: "color" },
    entityId: { control: "text" },
  },
};

export const Default = {
  render: () => html`
    <dp-color-picker-field .color=${"#4caf50"}></dp-color-picker-field>
  `,
};

export const WithEntityIcon = {
  render: () => html`
    <dp-color-picker-field
      .color=${"#2196f3"}
      .entityId=${"sensor.temperature"}
    ></dp-color-picker-field>
  `,
};

export const Orange = {
  render: () => html`
    <dp-color-picker-field .color=${"#ff9800"}></dp-color-picker-field>
  `,
};
