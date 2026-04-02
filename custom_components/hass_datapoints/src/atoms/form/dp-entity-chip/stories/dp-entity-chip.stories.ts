import { html } from "lit";
import "../dp-entity-chip";

export default {
  title: "Atoms/Form/Entity Chip",
  component: "dp-entity-chip",
  parameters: {
    actions: { handles: ["dp-chip-remove"] },
  },
};

export const Default = {
  render: () => html`
    <dp-entity-chip
      .type=${"entity"}
      .itemId=${"sensor.living_room_temperature"}
    ></dp-entity-chip>
  `,
};

export const Removable = {
  render: () => html`
    <dp-entity-chip
      .type=${"entity"}
      .itemId=${"sensor.living_room_temperature"}
      .removable=${true}
    ></dp-entity-chip>
  `,
};

export const DeviceType = {
  render: () => html`
    <dp-entity-chip
      .type=${"device"}
      .itemId=${"abc123def456"}
      .removable=${true}
    ></dp-entity-chip>
  `,
};

export const AreaType = {
  render: () => html`
    <dp-entity-chip
      .type=${"area"}
      .itemId=${"living_room"}
      .removable=${true}
    ></dp-entity-chip>
  `,
};
