import { html } from "lit";
import "../dp-date-time-input";

export default {
  title: "Atoms/Form/Date Time Input",
  component: "dp-date-time-input",
  parameters: {
    actions: { handles: ["dp-datetime-change"] },
  },
};

export const Default = {
  render: () => html`
    <dp-date-time-input
      .label=${"Start time"}
      .value=${"2024-06-01T12:00"}
    ></dp-date-time-input>
  `,
};

export const WithoutLabel = {
  render: () => html`
    <dp-date-time-input .value=${"2024-06-01T09:30"}></dp-date-time-input>
  `,
};

export const Empty = {
  render: () => html`
    <dp-date-time-input .label=${"End time"}></dp-date-time-input>
  `,
};
