import { html } from "lit";
import "../dp-editor-icon-picker";

export default {
  title: "Atoms/Form/Editor Icon Picker",
  component: "dp-editor-icon-picker",
  parameters: {
    actions: { handles: ["dp-icon-change"] },
  },
};

export const Default = {
  render: () => html`
    <dp-editor-icon-picker .label=${"Icon"}></dp-editor-icon-picker>
  `,
};

export const WithValue = {
  render: () => html`
    <dp-editor-icon-picker
      .label=${"Icon"}
      .value=${"mdi:thermometer"}
    ></dp-editor-icon-picker>
  `,
};

export const NoLabel = {
  render: () => html`
    <dp-editor-icon-picker .value=${"mdi:home"}></dp-editor-icon-picker>
  `,
};
