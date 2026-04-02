import { html } from "lit";
import "../dp-empty-state";

export default {
  title: "Atoms/Display/Empty State",
  component: "dp-empty-state",
  argTypes: {
    message: { control: "text" },
  },
};

export const Default = {
  render: () => html`<dp-empty-state .message=${"No data points recorded yet"}></dp-empty-state>`,
};

export const NoEntities = {
  render: () => html`<dp-empty-state .message=${"No entities match the current filter"}></dp-empty-state>`,
};

export const EmptyHistory = {
  render: () => html`<dp-empty-state .message=${"No history available for this period"}></dp-empty-state>`,
};
