import { html } from "lit";
import "./dp-loading-indicator";

export default {
  title: "Atoms/Display/Loading Indicator",
  component: "dp-loading-indicator",
  argTypes: {
    active: { control: "boolean" },
  },
};

export const Inactive = {
  render: () => html`<dp-loading-indicator></dp-loading-indicator>`,
};

export const Active = {
  render: () => html`<dp-loading-indicator .active=${true}></dp-loading-indicator>`,
};
