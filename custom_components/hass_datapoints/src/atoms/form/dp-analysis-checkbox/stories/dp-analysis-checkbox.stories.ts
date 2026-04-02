import { html } from "lit";
import "../dp-analysis-checkbox";

export default {
  title: "Atoms/Form/Analysis Checkbox",
  component: "dp-analysis-checkbox",
};

export const Unchecked = {
  render: () => html`
    <dp-analysis-checkbox .label=${"Enable threshold"}></dp-analysis-checkbox>
  `,
};

export const Checked = {
  render: () => html`
    <dp-analysis-checkbox .checked=${true} .label=${"Show trend line"}></dp-analysis-checkbox>
  `,
};

export const Disabled = {
  render: () => html`
    <dp-analysis-checkbox
      .label=${"Moving average"}
      .disabled=${true}
    ></dp-analysis-checkbox>
  `,
};

export const WithHelpText = {
  render: () => html`
    <dp-analysis-checkbox
      .label=${"Threshold"}
      .helpText=${"Draws a horizontal reference line at the specified value"}
      .helpId=${"threshold-help"}
    ></dp-analysis-checkbox>
  `,
};

export const CheckedWithHelp = {
  render: () => html`
    <dp-analysis-checkbox
      .checked=${true}
      .label=${"Standard deviation"}
      .helpText=${"Shows the standard deviation band around the mean"}
      .helpId=${"stddev-help"}
    ></dp-analysis-checkbox>
  `,
};
