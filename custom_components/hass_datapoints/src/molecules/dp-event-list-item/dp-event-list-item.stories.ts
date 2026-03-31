import { html } from "lit";
import "./dp-event-list-item";

export default {
  title: "Molecules/Event List Item",
  component: "dp-event-list-item",
};

const sampleEvent = {
  id: "evt-001",
  message: "Turned on lights",
  annotation: "Manual override due to guests arriving",
  icon: "mdi:lightbulb",
  color: "#ff9800",
  timestamp: "2026-03-31T08:15:00Z",
};

export const Editable = {
  render: () => html`
    <dp-event-list-item .event=${sampleEvent} .editable=${true}></dp-event-list-item>
  `,
};

export const ReadOnly = {
  render: () => html`
    <dp-event-list-item .event=${sampleEvent} .editable=${false}></dp-event-list-item>
  `,
};

export const NoAnnotation = {
  render: () => html`
    <dp-event-list-item
      .event=${{ ...sampleEvent, annotation: null }}
      .editable=${true}
    ></dp-event-list-item>
  `,
};
