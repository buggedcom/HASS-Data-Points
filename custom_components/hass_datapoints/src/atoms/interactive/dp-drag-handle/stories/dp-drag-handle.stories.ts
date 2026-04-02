import { html } from "lit";
import "../dp-drag-handle";

export default {
  title: "Atoms/Interactive/Drag Handle",
  component: "dp-drag-handle",
};

export const Default = {
  render: () => html`
    <dp-drag-handle></dp-drag-handle>
  `,
};

export const WithLabel = {
  render: () => html`
    <dp-drag-handle .label=${"Reorder temperature"}></dp-drag-handle>
  `,
};
