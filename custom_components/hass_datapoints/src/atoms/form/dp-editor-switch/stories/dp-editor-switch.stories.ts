import { html } from "lit";
import "../dp-editor-switch";

export default {
  title: "Atoms/Form/Editor Switch",
  component: "dp-editor-switch",
  parameters: {
    actions: { handles: ["dp-switch-change"] },
  },
};

export const Default = {
  render: () => html`
    <dp-editor-switch .label=${"Show annotations"}></dp-editor-switch>
  `,
};

export const Checked = {
  render: () => html`
    <dp-editor-switch
      .label=${"Show annotations"}
      .checked=${true}
    ></dp-editor-switch>
  `,
};

export const WithTooltip = {
  render: () => html`
    <dp-editor-switch
      .label=${"Normalise values"}
      .tooltip=${"Scale all series to a 0–100 range for comparison"}
    ></dp-editor-switch>
  `,
};
