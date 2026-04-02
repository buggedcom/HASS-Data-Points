import { html } from "lit";
import "../dp-editor-text-field";

export default {
  title: "Atoms/Form/Editor Text Field",
  component: "dp-editor-text-field",
  parameters: {
    actions: { handles: ["dp-field-change"] },
  },
};

export const Default = {
  render: () => html`
    <dp-editor-text-field .label=${"Title"}></dp-editor-text-field>
  `,
};

export const WithValue = {
  render: () => html`
    <dp-editor-text-field
      .label=${"Title"}
      .value=${"My data points card"}
    ></dp-editor-text-field>
  `,
};

export const WithPlaceholder = {
  render: () => html`
    <dp-editor-text-field
      .label=${"Description"}
      .placeholder=${"Enter a description…"}
    ></dp-editor-text-field>
  `,
};

export const WithSuffix = {
  render: () => html`
    <dp-editor-text-field
      .label=${"Threshold"}
      .value=${"25"}
      .suffix=${"°C"}
    ></dp-editor-text-field>
  `,
};

export const NumberType = {
  render: () => html`
    <dp-editor-text-field
      .label=${"Hours"}
      .type=${"number"}
      .value=${"24"}
    ></dp-editor-text-field>
  `,
};
