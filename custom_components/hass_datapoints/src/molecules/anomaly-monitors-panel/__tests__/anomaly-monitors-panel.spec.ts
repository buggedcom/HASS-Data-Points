import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import "../anomaly-monitors-panel";

function flushMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

function buildCombinedMonitor() {
  return {
    ...buildMonitor(true),
    id: "monitor-combined",
    type: "combined",
    overlap_mode: "all",
    entity_id: undefined,
    entity_ids: ["sensor.temperature", "sensor.humidity"],
  };
}

function buildMonitor(enabled: boolean) {
  return {
    id: "monitor-1",
    type: "individual",
    name: "Kitchen anomaly",
    enabled,
    look_back_hours: 24,
    scan_interval_minutes: 30,
    created_at: "2026-05-19T10:00:00Z",
    last_scan_at: null,
    last_anomaly_at: null,
    last_cluster_count: 0,
    last_scan_data_points: null,
    scan_history: [],
    device_id: "device-1",
    anomaly_methods: ["trend_residual"],
    anomaly_sensitivity: "medium",
    anomaly_overlap_mode: "all",
    anomaly_rate_window: "1h",
    anomaly_zscore_window: "24h",
    anomaly_persistence_window: "1h",
    anomaly_trend_method: "rolling_average",
    anomaly_trend_window: "24h",
    sample_interval: null,
    sample_aggregate: "mean",
    anomaly_use_sampled_data: false,
    baseline_entity_id: null,
    baseline_time_offset_hours: 0,
    dismissed_windows: [],
    entity_id: "sensor.temperature",
  };
}

function createElement(hass: unknown) {
  const el = document.createElement("anomaly-monitors-panel") as HTMLElement & {
    hass: unknown;
    updateComplete: Promise<boolean>;
  };
  el.hass = hass;
  document.body.appendChild(el);
  return el;
}

describe("anomaly-monitors-panel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("GIVEN hass is available", () => {
    describe("WHEN the panel connects", () => {
      it("THEN it subscribes to monitor update events", async () => {
        expect.assertions(1);
        const subscribeEvents = vi.fn(() => Promise.resolve(vi.fn()));
        const hass = createMockHass({
          connection: {
            subscribeEvents,
            sendMessagePromise: vi.fn().mockResolvedValue({ monitors: [] }),
          },
        });

        createElement(hass);
        await flushMicrotasks();

        expect(subscribeEvents).toHaveBeenCalledWith(
          expect.any(Function),
          "hass_datapoints_monitors_updated"
        );
      });
    });
  });

  describe("GIVEN the panel is showing a monitor", () => {
    describe("WHEN a monitor-updated event arrives from Home Assistant", () => {
      it("THEN it reloads and reflects the latest enabled state", async () => {
        expect.assertions(2);
        let handler: Nullable<(...args: unknown[]) => void> = null;
        const sendMessagePromise = vi
          .fn()
          .mockResolvedValueOnce({ monitors: [buildMonitor(false)] })
          .mockResolvedValueOnce({ monitors: [buildMonitor(true)] });
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn((callback) => {
              handler = callback;
              return Promise.resolve(vi.fn());
            }),
            sendMessagePromise,
          },
        });

        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();

        expect(
          el.shadowRoot
            ?.querySelector(".monitor-card")
            ?.getAttribute("data-enabled")
        ).toBe("false");

        handler?.({});
        await flushMicrotasks();
        await el.updateComplete;

        expect(
          el.shadowRoot
            ?.querySelector(".monitor-card")
            ?.getAttribute("data-enabled")
        ).toBe("true");
      });
    });
  });

  describe("GIVEN the panel has subscribed to monitor updates", () => {
    describe("WHEN the element disconnects", () => {
      it("THEN it tears down the subscription", async () => {
        expect.assertions(1);
        const unsubscribe = vi.fn();
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(unsubscribe)),
            sendMessagePromise: vi.fn().mockResolvedValue({ monitors: [] }),
          },
        });

        const el = createElement(hass);
        await flushMicrotasks();
        el.remove();

        expect(unsubscribe).toHaveBeenCalledOnce();
      });
    });
  });

  describe("GIVEN a combined monitor is shown", () => {
    describe("WHEN a user activates an entity chip", () => {
      it("THEN it emits dp-monitors-panel-open-entity with the entityId and monitorId", async () => {
        expect.assertions(1);
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: vi
              .fn()
              .mockResolvedValue({ monitors: [buildCombinedMonitor()] }),
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        let detail: unknown = null;
        el.addEventListener("dp-monitors-panel-open-entity", (e) => {
          detail = (e as CustomEvent).detail;
        });
        const chipButton = el.shadowRoot?.querySelector<HTMLElement>(
          ".monitor-entity-chip"
        );
        chipButton?.click();

        expect(detail).toEqual({
          entityId: "sensor.temperature",
          monitorId: "monitor-combined",
        });
      });
    });

    describe("WHEN a chip has keyboard focus and Enter is pressed", () => {
      it("THEN it emits dp-monitors-panel-open-entity", async () => {
        expect.assertions(1);
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: vi
              .fn()
              .mockResolvedValue({ monitors: [buildCombinedMonitor()] }),
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        let detail: unknown = null;
        el.addEventListener("dp-monitors-panel-open-entity", (e) => {
          detail = (e as CustomEvent).detail;
        });
        const chipButton = el.shadowRoot?.querySelector<HTMLElement>(
          ".monitor-entity-chip"
        );
        chipButton?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
        );

        expect(detail).toEqual({
          entityId: "sensor.temperature",
          monitorId: "monitor-combined",
        });
      });
    });
  });

  describe("GIVEN a monitor with a look-back window", () => {
    describe("WHEN the View series action is activated", () => {
      it("THEN it emits dp-monitors-panel-open-chart with the monitor entities and matching range", async () => {
        expect.assertions(4);
        const monitor = { ...buildMonitor(true), look_back_hours: 6 };
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: vi
              .fn()
              .mockResolvedValue({ monitors: [monitor] }),
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        let detail: {
          entityIds: string[];
          startMs: number;
          endMs: number;
          monitorId: string;
        } | null = null;
        el.addEventListener("dp-monitors-panel-open-chart", (e) => {
          detail = (e as CustomEvent).detail;
        });
        const viewSeriesButton =
          el.shadowRoot?.querySelector<HTMLElement>(".view-series-btn");
        const before = Date.now();
        viewSeriesButton?.click();
        const after = Date.now();

        expect(detail).not.toBeNull();
        expect(detail!.entityIds).toEqual(["sensor.temperature"]);
        expect(detail!.endMs - detail!.startMs).toBe(6 * 3_600_000);
        expect(detail!.endMs >= before && detail!.endMs <= after).toBe(true);
      });
    });
  });
});
