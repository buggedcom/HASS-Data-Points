import { html } from "lit";
import "../dp-editor-entity-list";

export default {
  title: "Atoms/Form/Editor Entity List",
  component: "dp-editor-entity-list",
  parameters: {
    actions: { handles: ["dp-entity-list-change"] },
  },
};

export const Empty = {
  render: () => html`
    <dp-editor-entity-list .entities=${[]}></dp-editor-entity-list>
  `,
};

export const WithEntities = {
  render: () => html`
    <dp-editor-entity-list
      .entities=${[
        "sensor.living_room_temperature",
        "sensor.bedroom_humidity",
        "binary_sensor.front_door",
      ]}
    ></dp-editor-entity-list>
  `,
};

export const CustomButtonLabel = {
  render: () => html`
    <dp-editor-entity-list
      .entities=${["sensor.outdoor_temperature"]}
      .buttonLabel=${"Add sensor"}
    ></dp-editor-entity-list>
  `,
};
