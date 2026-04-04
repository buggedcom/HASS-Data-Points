import { html } from "lit";
import { expect } from "@storybook/test";
import "../dev-tool-windows";

export default {
  title: "Cards/Dev Tool/Windows",
  component: "dev-tool-windows",
};

export const Default = {
  render: () => html`<dev-tool-windows></dev-tool-windows>`,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "dev-tool-windows"
    ) as HTMLElement & { shadowRoot: ShadowRoot };
    expect(el.shadowRoot.querySelectorAll(".window-row")).toHaveLength(1);
  },
};

export const Multiple = {
  render: () => html`
    <dev-tool-windows
      .windows=${[
        { id: 1, label: "Bedroom", startDt: "", hours: 24 },
        { id: 2, label: "Outside", startDt: "2026-03-31T10:00", hours: 48 },
      ]}
    ></dev-tool-windows>
  `,
};
