import { html } from "lit";
import "./dp-radio-group";

export default {
  title: "Atoms/Form/Radio Group",
  component: "dp-radio-group",
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
  },
};

export const Default = {
  render: () => html`
    <dp-radio-group
      .name=${"period"}
      .value=${"day"}
      .options=${[
        { value: "hour", label: "Hour" },
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
      ]}
    ></dp-radio-group>
  `,
};

export const NoneSelected = {
  render: () => html`
    <dp-radio-group
      .name=${"stat"}
      .value=${""}
      .options=${[
        { value: "mean", label: "Mean" },
        { value: "min", label: "Min" },
        { value: "max", label: "Max" },
      ]}
    ></dp-radio-group>
  `,
};

export const TwoOptions = {
  render: () => html`
    <dp-radio-group
      .name=${"mode"}
      .value=${"light"}
      .options=${[
        { value: "light", label: "Light Mode" },
        { value: "dark", label: "Dark Mode" },
      ]}
    ></dp-radio-group>
  `,
};
