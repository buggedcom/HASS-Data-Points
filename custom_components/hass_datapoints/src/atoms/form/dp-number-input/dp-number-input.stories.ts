import { html } from "lit";
import "./dp-number-input";

export default {
  title: "Atoms/Form/Number Input",
  component: "dp-number-input",
};

export const Default = {
  render: () => html`
    <dp-number-input .value=${"10"} .placeholder=${"Enter value"}></dp-number-input>
  `,
};

export const WithSuffix = {
  render: () => html`
    <dp-number-input .value=${"75"} .suffix=${"%"}></dp-number-input>
  `,
};

export const WithStep = {
  render: () => html`
    <dp-number-input
      .value=${"1.5"}
      .step=${"0.1"}
      .suffix=${"units"}
    ></dp-number-input>
  `,
};

export const Empty = {
  render: () => html`
    <dp-number-input .placeholder=${"Threshold..."}></dp-number-input>
  `,
};
