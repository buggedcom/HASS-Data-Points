import { html } from "lit";
import "../dp-section-heading";

export default {
  title: "Atoms/Display/Section Heading",
  component: "dp-section-heading",
  argTypes: {
    text: { control: "text" },
  },
};

export const Default = {
  render: () => html`<dp-section-heading .text=${"General Settings"}></dp-section-heading>`,
};

export const EntitySection = {
  render: () => html`<dp-section-heading .text=${"Entities"}></dp-section-heading>`,
};
