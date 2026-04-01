import { html } from "lit";
import "../dp-floating-menu";
import "@/atoms/interactive/dp-page-menu-item/dp-page-menu-item";

/**
 * `dp-floating-menu` is a positioned floating overlay panel. The parent sets
 * `--floating-menu-top` / `--floating-menu-left` on the element to position it
 * below an anchor button. Content is projected via the default slot.
 *
 * @fires dp-menu-close - `{}` fired when the user clicks outside the open menu
 */
export default {
  title: "Molecules/Floating Menu",
  component: "dp-floating-menu",
  parameters: {
    actions: {
      handles: ["dp-menu-close", "dp-menu-action"],
    },
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the menu panel is visible.",
    },
  },
  args: {
    open: true,
  },
  render: (args: { open: boolean }) => html`
    <div style="position: relative; height: 200px; padding: 16px;">
      <dp-floating-menu
        .open=${args.open}
        style="--floating-menu-top: 56px; --floating-menu-left: 16px;"
      >
        <dp-page-menu-item icon="mdi:file-excel-outline" label="Download spreadsheet"></dp-page-menu-item>
        <dp-page-menu-item icon="mdi:refresh" label="Refresh data"></dp-page-menu-item>
        <dp-page-menu-item icon="mdi:cog-outline" label="Settings"></dp-page-menu-item>
      </dp-floating-menu>
    </div>
  `,
};

export const Open = {
  args: { open: true },
};

export const Closed = {
  args: { open: false },
};

export const SingleItem = {
  args: { open: true },
  render: () => html`
    <div style="position: relative; height: 120px; padding: 16px;">
      <dp-floating-menu
        .open=${true}
        style="--floating-menu-top: 56px; --floating-menu-left: 16px;"
      >
        <dp-page-menu-item icon="mdi:download" label="Download"></dp-page-menu-item>
      </dp-floating-menu>
    </div>
  `,
};

export const CustomContent = {
  args: { open: true },
  render: () => html`
    <div style="position: relative; height: 160px; padding: 16px;">
      <dp-floating-menu
        .open=${true}
        style="
          --floating-menu-top: 56px;
          --floating-menu-left: 16px;
          --floating-menu-padding: 16px;
          --floating-menu-min-width: 280px;
        "
      >
        <p style="margin: 0; color: var(--primary-text-color);">Custom slotted content can be anything — date pickers, option lists, forms, etc.</p>
      </dp-floating-menu>
    </div>
  `,
};
