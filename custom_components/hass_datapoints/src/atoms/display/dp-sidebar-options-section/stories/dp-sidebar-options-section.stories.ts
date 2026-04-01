import { html } from "lit";
import "../dp-sidebar-options-section";

/**
 * `dp-sidebar-options-section` is a layout atom that wraps a titled sidebar section.
 * It composes `dp-sidebar-section-header` for the heading and exposes a default slot
 * for any body content (radio groups, checkbox lists, selects, etc.).
 */
export default {
  title: "Atoms/Display/Sidebar Options Section",
  component: "dp-sidebar-options-section",
  argTypes: {
    title: {
      control: "text",
      description: "The section heading text.",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle shown below the heading in a smaller muted style.",
    },
  },
  args: {
    title: "Chart Display",
    subtitle: "Configure visual and interaction behaviour for the chart.",
  },
  render: (args: Record<string, unknown>) => html`
    <dp-sidebar-options-section
      .title=${args.title}
      .subtitle=${args.subtitle}
    >
      <div style="color: var(--secondary-text-color); font-size: 0.9rem;">Slotted body content goes here.</div>
    </dp-sidebar-options-section>
  `,
};

/** Default section with title, subtitle, and placeholder body content. */
export const Default = {};

/** Section with no subtitle — only the title is shown. */
export const TitleOnly = {
  args: { subtitle: "" },
};

/** A realistic example with a dp-checkbox-list as the slotted body. */
export const WithCheckboxList = {
  render: () => html`
    <dp-sidebar-options-section
      title="Datapoints"
      subtitle="Choose which annotation datapoints appear on the chart."
    >
      <p style="margin: 0; color: var(--secondary-text-color); font-size: 0.9rem;">
        (Body content slotted in here)
      </p>
    </dp-sidebar-options-section>
  `,
};
