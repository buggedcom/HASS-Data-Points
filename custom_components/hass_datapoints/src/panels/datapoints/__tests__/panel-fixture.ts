import { afterEach, beforeEach, vi } from "vitest";
import type { HassLike } from "@/lib/types";
import { PANEL_HISTORY_PREFERENCES_KEY } from "@/lib/history-page/history-session-state";
import { PANEL_HISTORY_SAVED_PAGE_KEY } from "@/lib/data/preferences-api";
import { HassDatapointsHistoryPanel } from "../datapoints";
import "./panel-list-fixture";

export { PanelCardFixture } from "./panel-card-fixture";

vi.mock("@kipk/load-ha-components", () => ({
  loadHaComponents: async () => {},
}));

export function usePanelFixture(): void {
  const timers = new Set<number>();
  const scheduleTimeout = window.setTimeout.bind(window);
  const cancelTimeout = window.clearTimeout.bind(window);
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-07T12:00:00Z"));
    vi.spyOn(window, "setTimeout").mockImplementation(
      (callback, delay, ...args) => {
        const id = scheduleTimeout(callback, delay, ...args);
        timers.add(id);
        return id;
      }
    );
    window.history.replaceState(null, "", "/datapoints");
    window.sessionStorage.clear();
  });
  afterEach(async () => {
    document.body.replaceChildren();
    await Promise.resolve();
    for (const id of timers) {
      cancelTimeout(id);
    }
    timers.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });
}

customElements.define("test-datapoints-panel", HassDatapointsHistoryPanel);

export const START = "2025-01-06T00:00:00.000Z";
export const END = "2025-01-07T00:00:00.000Z";
export const COMPARISON = {
  id: "previous",
  label: "Previous day",
  start_time: "2025-01-05T00:00:00.000Z",
  end_time: START,
};

export function createHassFixture(
  options: {
    admin?: boolean;
    preferences?: RecordWithUnknownValues;
    savedPage?: RecordWithUnknownValues;
  } = {}
) {
  const unsubscribe = vi.fn();
  const sendMessagePromise = vi.fn(async (message: RecordWithUnknownValues) => {
    switch (message.type) {
      case "frontend/get_user_data": {
        return {
          value:
            message.key === PANEL_HISTORY_PREFERENCES_KEY
              ? {
                  zoom_level: "auto",
                  date_snapping: "hour",
                  ...options.preferences,
                }
              : (options.savedPage ?? null),
        };
      }
      case "frontend/set_user_data": {
        return {};
      }
      case "hass_datapoints/events_bounds": {
        return { start_time: "2025-01-01T00:00:00Z", end_time: END };
      }
      case "hass_datapoints/events": {
        return { events: [] };
      }
      case "hass_datapoints/monitors/list": {
        return { monitors: [] };
      }
      default: {
        throw new Error(`Unexpected HA request: ${String(message.type)}`);
      }
    }
  });
  const hass: HassLike = {
    states: {
      "sensor.temperature": {
        entity_id: "sensor.temperature",
        state: "21",
        attributes: { friendly_name: "Temperature", unit_of_measurement: "°C" },
        last_changed: START,
        last_updated: START,
      },
      "sensor.humidity": {
        entity_id: "sensor.humidity",
        state: "45",
        attributes: { friendly_name: "Humidity", unit_of_measurement: "%" },
        last_changed: START,
        last_updated: START,
      },
    },
    entities: {},
    devices: {},
    areas: {},
    user: { is_admin: options.admin ?? false },
    locale: { language: "en" },
    connection: {
      sendMessagePromise,
      subscribeEvents: vi.fn(async () => unsubscribe),
    },
    callService: vi.fn(async () => {}),
  };
  return { hass, sendMessagePromise, unsubscribe };
}

export function createPanel(
  hass: HassLike,
  config: RecordWithUnknownValues = {
    entities: ["sensor.temperature"],
    start_time: START,
    end_time: END,
  }
) {
  const panel = document.createElement(
    "test-datapoints-panel"
  ) as HassDatapointsHistoryPanel;
  panel.panel = { config };
  panel.hass = hass;
  return panel;
}

// Advance browser scheduling, never invoke a panel lifecycle/private method.
export async function settlePanel(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 300);
  });
}

export async function mountPanel(
  hass: HassLike,
  config?: RecordWithUnknownValues
) {
  const panel = createPanel(hass, config);
  document.body.appendChild(panel);
  await settlePanel();
  // HA keeps feeding properties after connection. Complete the first locale
  // synchronization before exercising subsequent routine hass updates.
  panel.hass = hass;
  await settlePanel();
  return panel;
}

export function control<K extends keyof HTMLElementTagNameMap>(
  root: ParentNode,
  tag: K
): HTMLElementTagNameMap[K] {
  const element = root.querySelector(tag);
  if (!element) {
    throw new Error(`Missing mounted control: ${tag}`);
  }
  return element;
}

export function emitControlEvent(
  target: EventTarget,
  name: string,
  detail: RecordWithUnknownValues = {}
): void {
  target.dispatchEvent(
    new CustomEvent(name, { detail, bubbles: true, composed: true })
  );
}

export function lastSavedValue(
  sendMessagePromise: ReturnType<
    typeof createHassFixture
  >["sendMessagePromise"],
  key = PANEL_HISTORY_SAVED_PAGE_KEY
): unknown {
  return sendMessagePromise.mock.calls
    .filter(
      ([message]) =>
        message.type === "frontend/set_user_data" && message.key === key
    )
    .at(-1)?.[0].value;
}
