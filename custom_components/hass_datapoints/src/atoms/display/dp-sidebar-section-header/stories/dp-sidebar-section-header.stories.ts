import { html } from "lit";
import "./dp-sidebar-section-header";

export default {
  title: "Atoms/Display/Sidebar Section Header",
  component: "dp-sidebar-section-header",
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
};

export const Default = {
  render: () => html`
    <dp-sidebar-section-header
      .title=${"Target Analysis"}
      .subtitle=${"3 entities tracked"}
    ></dp-sidebar-section-header>
  `,
};

export const TitleOnly = {
  render: () => html`
    <dp-sidebar-section-header
      .title=${"Filters"}
    ></dp-sidebar-section-header>
  `,
};

export const LongSubtitle = {
  render: () => html`
    <dp-sidebar-section-header
      .title=${"Data Points"}
      .subtitle=${"Showing results for the last 30 days across all entities"}
    ></dp-sidebar-section-header>
  `,
};
