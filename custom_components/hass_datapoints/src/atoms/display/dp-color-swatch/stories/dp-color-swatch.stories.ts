import { html } from "lit";
import "../dp-color-swatch";

export default {
  title: "Atoms/Display/Color Swatch",
  component: "dp-color-swatch",
  argTypes: {
    color: { control: "color" },
    label: { control: "text" },
  },
};

export const Default = {
  render: () => html`<dp-color-swatch .color=${"#ff9800"} .label=${"Event Color"}></dp-color-swatch>`,
};

export const NoLabel = {
  render: () => html`<dp-color-swatch .color=${"#4caf50"}></dp-color-swatch>`,
};

export const Blue = {
  render: () => html`<dp-color-swatch .color=${"#2196f3"} .label=${"Series Color"}></dp-color-swatch>`,
};
