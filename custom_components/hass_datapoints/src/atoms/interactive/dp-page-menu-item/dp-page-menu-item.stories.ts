import { html } from "lit";
import "./dp-page-menu-item";

export default {
  title: "Atoms/Interactive/Page Menu Item",
  component: "dp-page-menu-item",
};

export const Default = {
  render: () => html`
    <dp-page-menu-item .icon=${"mdi:chart-line"} .label=${"History"}></dp-page-menu-item>
  `,
};

export const Settings = {
  render: () => html`
    <dp-page-menu-item .icon=${"mdi:cog"} .label=${"Settings"}></dp-page-menu-item>
  `,
};

export const Disabled = {
  render: () => html`
    <dp-page-menu-item .icon=${"mdi:delete"} .label=${"Delete"} .disabled=${true}></dp-page-menu-item>
  `,
};
