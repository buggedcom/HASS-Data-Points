/**
 * statistics.stories.ts
 *
 * Stories for hass-datapoints-statistics-card — the HA statistics chart card.
 * The card fetches data via hass.connection.sendMessagePromise. Stories mock that
 * connection with realistic sample data so the chart actually renders.
 */
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { HassRecordsStatisticsCard } from "../statistics";

// Self-registers with guard for Storybook isolation / HMR safety.
if (!customElements.get("hass-datapoints-statistics-card")) {
  customElements.define(
    "hass-datapoints-statistics-card",
    HassRecordsStatisticsCard
  );
}

type Story = StoryObj;

const meta: Meta = {
  title: "Charts/Statistics Card",
  component: "hass-datapoints-statistics-card",
};
export default meta;

// ── Sample data generators ────────────────────────────────────────────────────

/** Generate hourly statistics entries for a given stat id over the last N hours. */
function makeStats(
  statId: string,
  hours: number,
  baseValue: number,
  amplitude: number
) {
  const now = Date.now();
  const entries = [];
  for (let i = hours; i >= 0; i--) {
    const start = now - i * 3600 * 1000;
    const v = baseValue + amplitude * Math.sin((i / hours) * Math.PI * 4);
    entries.push({
      start,
      mean: parseFloat(v.toFixed(2)),
      min: parseFloat((v - amplitude * 0.3).toFixed(2)),
      max: parseFloat((v + amplitude * 0.3).toFixed(2)),
      sum: parseFloat((v * 3600).toFixed(2)),
    });
  }
  return { [statId]: entries };
}

// ── Mock hass ─────────────────────────────────────────────────────────────────

const mockStates = {
  "sensor.energy": {
    state: "1234.5",
    attributes: {
      friendly_name: "Energy Usage",
      unit_of_measurement: "kWh",
    },
  },
  "sensor.gas": {
    state: "89.3",
    attributes: {
      friendly_name: "Gas Consumption",
      unit_of_measurement: "m³",
    },
  },
};

function makeMockHass(
  statsData: Record<string, unknown[]>,
  states = mockStates
) {
  return {
    states,
    connection: {
      subscribeEvents: () => Promise.resolve(() => {}),
      sendMessagePromise: (msg: { type: string }) => {
        if (msg.type === "hass_datapoints/events")
          return Promise.resolve({ events: [] });
        if (msg.type === "recorder/statistics_during_period")
          return Promise.resolve(statsData);
        return Promise.resolve({});
      },
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCard(canvasElement: HTMLElement): any {
  return canvasElement.querySelector("hass-datapoints-statistics-card");
}

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Before hass is attached the card shows its loading state — chart-shell
 * with no data yet.
 */
export const Loading: Story = {
  name: "Loading (no hass)",
  render: () =>
    html` <hass-datapoints-statistics-card></hass-datapoints-statistics-card>`,
  play: async ({ canvasElement }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      entity: "sensor.energy",
      hours_to_show: 168,
      period: "hour",
      stat_types: ["mean"],
    });
    // hass not set — card stays in initial loading state
  },
};

/** Single entity with 7 days of hourly mean statistics rendered as a chart. */
export const Default: Story = {
  render: () =>
    html` <hass-datapoints-statistics-card></hass-datapoints-statistics-card>`,
  play: async ({ canvasElement }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      entity: "sensor.energy",
      hours_to_show: 168,
      period: "hour",
      stat_types: ["mean"],
    });
    card.hass = makeMockHass(makeStats("sensor.energy", 168, 1200, 300));
  },
};

/** Card with a visible title. */
export const WithTitle: Story = {
  render: () =>
    html` <hass-datapoints-statistics-card></hass-datapoints-statistics-card>`,
  play: async ({ canvasElement }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Energy Usage — Last 7 Days",
      entity: "sensor.energy",
      hours_to_show: 168,
      period: "hour",
      stat_types: ["mean"],
    });
    card.hass = makeMockHass(makeStats("sensor.energy", 168, 1200, 300));
  },
};

/** Multiple stat types on the same entity (mean + max). */
export const MultipleStatTypes: Story = {
  name: "Multiple Stat Types",
  render: () =>
    html` <hass-datapoints-statistics-card></hass-datapoints-statistics-card>`,
  play: async ({ canvasElement }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Energy — mean & max",
      entity: "sensor.energy",
      hours_to_show: 24,
      period: "hour",
      stat_types: ["mean", "max"],
    });
    card.hass = makeMockHass(makeStats("sensor.energy", 24, 1200, 300));
  },
};

/** Two entities on one chart. */
export const MultipleEntities: Story = {
  name: "Multiple Entities",
  render: () =>
    html` <hass-datapoints-statistics-card></hass-datapoints-statistics-card>`,
  play: async ({ canvasElement }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Energy & Gas",
      entities: ["sensor.energy", "sensor.gas"],
      hours_to_show: 168,
      period: "day",
      stat_types: ["mean"],
    });
    card.hass = makeMockHass({
      ...makeStats("sensor.energy", 168, 1200, 300),
      ...makeStats("sensor.gas", 168, 85, 15),
    });
  },
};
