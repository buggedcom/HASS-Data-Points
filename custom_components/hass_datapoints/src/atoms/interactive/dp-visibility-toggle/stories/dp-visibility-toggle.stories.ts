import { html } from "lit";
import "../dp-visibility-toggle";

export default {
  title: "Atoms/Interactive/Visibility Toggle",
  component: "dp-visibility-toggle",
};

export const Visible = {
  render: () => html`
    <dp-visibility-toggle .pressed=${true} .label=${"Events"} .icon=${"mdi:eye"}></dp-visibility-toggle>
  `,
};

export const Hidden = {
  render: () => html`
    <dp-visibility-toggle .pressed=${false} .label=${"Events"} .icon=${"mdi:eye-off"}></dp-visibility-toggle>
  `,
};
