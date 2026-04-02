import { html } from "lit";
import "../dp-editor-entity-picker";

export default {
  title: "Atoms/Form/Editor Entity Picker",
  component: "dp-editor-entity-picker",
  parameters: {
    actions: { handles: ["dp-entity-change"] },
  },
};

export const Default = {
  render: () => html`
    <dp-editor-entity-picker .label=${"Entity"}></dp-editor-entity-picker>
  `,
};

export const WithValue = {
  render: () => html`
    <dp-editor-entity-picker
      .label=${"Entity"}
      .value=${"sensor.living_room_temperature"}
    ></dp-editor-entity-picker>
  `,
};

export const NoLabel = {
  render: () => html`
    <dp-editor-entity-picker></dp-editor-entity-picker>
  `,
};
