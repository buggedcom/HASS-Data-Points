import { html } from "lit";
import "../dp-annotation-chip";

export default {
  title: "Atoms/Interactive/Annotation Chip",
  component: "dp-annotation-chip",
};

export const Entity = {
  render: () => html`
    <dp-annotation-chip
      .type=${"entity"}
      .itemId=${"sensor.temperature"}
      .icon=${"mdi:thermometer"}
      .name=${"Temperature"}
    ></dp-annotation-chip>
  `,
};

export const Area = {
  render: () => html`
    <dp-annotation-chip
      .type=${"area"}
      .itemId=${"living_room"}
      .icon=${"mdi:sofa"}
      .name=${"Living Room"}
    ></dp-annotation-chip>
  `,
};

export const Device = {
  render: () => html`
    <dp-annotation-chip
      .type=${"device"}
      .itemId=${"hue_bridge"}
      .icon=${"mdi:bridge"}
      .name=${"Hue Bridge"}
    ></dp-annotation-chip>
  `,
};
