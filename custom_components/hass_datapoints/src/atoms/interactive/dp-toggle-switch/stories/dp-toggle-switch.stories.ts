import { html } from "lit";
import "../dp-toggle-switch";

export default {
  title: "Atoms/Interactive/Toggle Switch",
  component: "dp-toggle-switch",
};

export const Unchecked = {
  render: () => html`
    <dp-toggle-switch .checked=${false} .label=${"Show targets"}></dp-toggle-switch>
  `,
};

export const Checked = {
  render: () => html`
    <dp-toggle-switch .checked=${true} .label=${"Show targets"}></dp-toggle-switch>
  `,
};

export const WithEntityId = {
  render: () => html`
    <dp-toggle-switch .checked=${true} .label=${"Temperature"} .entityId=${"sensor.temperature"}></dp-toggle-switch>
  `,
};
