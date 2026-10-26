import { html } from "lit";
import "../monitor-entity-filter";
import { expect } from "storybook/test";
import { setFrontendLocale } from "@/lib/i18n/localize";

export default {
  title: "Molecules/Monitor Entity Filter",
  component: "monitor-entity-filter",
  loaders: [
    async () => {
      await setFrontendLocale("en");
    },
  ],
};

const hass = {
  states: {
    "sensor.temp": { attributes: { friendly_name: "Kitchen temperature" } },
    "sensor.humidity": { attributes: { friendly_name: "Bathroom humidity" } },
    "sensor.power": { attributes: { friendly_name: "Boiler power" } },
  },
};
const entityIds = ["sensor.temp", "sensor.humidity", "sensor.power"];

type FilterEl = HTMLElement & { updateComplete: Promise<boolean> };

export const NoFilter = {
  render: () =>
    html`<monitor-entity-filter
      .hass=${hass}
      .entityIds=${entityIds}
      .selected=${[]}
    ></monitor-entity-filter>`,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector("monitor-entity-filter") as FilterEl;
    await el.updateComplete;
    await expect(el.shadowRoot!.querySelector(".filter-badge")).toBeNull();
  },
};

export const WithSelection = {
  render: () =>
    html`<monitor-entity-filter
      .hass=${hass}
      .entityIds=${entityIds}
      .selected=${["sensor.temp", "sensor.power"]}
    ></monitor-entity-filter>`,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const el = canvasElement.querySelector("monitor-entity-filter") as FilterEl;
    await el.updateComplete;
    await expect(
      el.shadowRoot!.querySelector(".filter-badge")!.textContent
    ).toContain("2");
  },
};
