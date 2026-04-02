import { html } from "lit";
import "../dp-legend-item";

export default {
  title: "Atoms/Interactive/Legend Item",
  component: "dp-legend-item",
};

export const Visible = {
  render: () => html`
    <dp-legend-item .label=${"Temperature"} .color=${"#2196f3"} .unit=${"°C"} .pressed=${true}></dp-legend-item>
  `,
};

export const Hidden = {
  render: () => html`
    <dp-legend-item .label=${"Humidity"} .color=${"#4caf50"} .unit=${"%"} .pressed=${false}></dp-legend-item>
  `,
};

export const NoUnit = {
  render: () => html`
    <dp-legend-item .label=${"Motion"} .color=${"#ff9800"} .pressed=${true}></dp-legend-item>
  `,
};

export const LowOpacity = {
  render: () => html`
    <dp-legend-item .label=${"Binary State"} .color=${"#e91e63"} .pressed=${true} .opacity=${0.35}></dp-legend-item>
  `,
};
