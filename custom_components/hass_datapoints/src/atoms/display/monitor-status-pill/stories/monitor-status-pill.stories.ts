import { html } from "lit";
import { expect } from "@storybook/test";
import "../monitor-status-pill";

export default {
  title: "Atoms/Display/Monitor Status Pill",
  component: "monitor-status-pill",
  argTypes: {
    status: {
      control: "select",
      options: ["healthy", "warning", "triggered", "paused"],
    },
    label: { control: "text" },
  },
};

export const Healthy = {
  render: () =>
    html`<monitor-status-pill .status=${"healthy"}></monitor-status-pill>`,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector(
      "monitor-status-pill"
    ) as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("Healthy");
  },
};

export const Warning = {
  render: () =>
    html`<monitor-status-pill .status=${"warning"}></monitor-status-pill>`,
};

export const Triggered = {
  render: () =>
    html`<monitor-status-pill .status=${"triggered"}></monitor-status-pill>`,
};

export const Paused = {
  render: () =>
    html`<monitor-status-pill .status=${"paused"}></monitor-status-pill>`,
};

export const CustomLabel = {
  render: () =>
    html`<monitor-status-pill
      .status=${"triggered"}
      .label=${"Déclenché"}
    ></monitor-status-pill>`,
};

export const AllStatuses = {
  render: () => html`
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <monitor-status-pill .status=${"healthy"}></monitor-status-pill>
      <monitor-status-pill .status=${"warning"}></monitor-status-pill>
      <monitor-status-pill .status=${"triggered"}></monitor-status-pill>
      <monitor-status-pill .status=${"paused"}></monitor-status-pill>
    </div>
  `,
};
