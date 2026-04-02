import { html } from "lit";
import "../dp-inline-select";

export default {
  title: "Atoms/Form/Inline Select",
  component: "dp-inline-select",
};

export const Default = {
  render: () => html`
    <dp-inline-select
      .value=${"hour"}
      .options=${[
        { value: "5minute", label: "5 Minutes" },
        { value: "hour", label: "Hour" },
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
      ]}
    ></dp-inline-select>
  `,
};

export const Disabled = {
  render: () => html`
    <dp-inline-select
      .value=${"day"}
      .options=${[
        { value: "hour", label: "Hour" },
        { value: "day", label: "Day" },
      ]}
      .disabled=${true}
    ></dp-inline-select>
  `,
};

export const ManyOptions = {
  render: () => html`
    <dp-inline-select
      .value=${"mean"}
      .options=${[
        { value: "mean", label: "Mean" },
        { value: "min", label: "Min" },
        { value: "max", label: "Max" },
        { value: "sum", label: "Sum" },
        { value: "change", label: "Change" },
      ]}
    ></dp-inline-select>
  `,
};
