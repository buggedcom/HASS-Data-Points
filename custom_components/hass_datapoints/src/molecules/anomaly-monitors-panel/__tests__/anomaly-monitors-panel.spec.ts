import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { DOMAIN } from "@/constants";
import { confirmDestructiveAction } from "@/lib/ha/ha-components";
import "../anomaly-monitors-panel";

vi.mock("@/lib/ha/ha-components", () => ({
  confirmDestructiveAction: vi.fn(() => Promise.resolve(true)),
}));

const mockConfirm = vi.mocked(confirmDestructiveAction);

function flushMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

/**
 * A `sendMessagePromise` stub that routes by websocket message `type`, so a
 * single load (which now fetches both the active list and the trash list) does
 * not consume a positional `mockResolvedValueOnce` queue.
 */
function routeSend(
  routes: Partial<Record<string, (message: { type: string }) => unknown>>
) {
  return vi.fn((message: { type: string }) =>
    Promise.resolve(routes[message.type]?.(message) ?? {})
  );
}

const T = {
  list: `${DOMAIN}/monitors/list`,
  trash: `${DOMAIN}/monitors/trash/list`,
  delete: `${DOMAIN}/monitors/delete`,
  restore: `${DOMAIN}/monitors/restore`,
  purge: `${DOMAIN}/monitors/purge`,
  undismiss: `${DOMAIN}/monitors/undismiss`,
} as const;

function buildCombinedMonitor() {
  return {
    ...buildMonitor(true),
    id: "monitor-combined",
    type: "combined",
    overlap_mode: "all",
    entity_id: undefined,
    entity_ids: ["sensor.temperature", "sensor.humidity"],
    // A non-default detection config, so tests prove the monitor's OWN methods
    // flow through the open-chart/open-entity events (not the chart default).
    anomaly_methods: ["rolling_zscore"],
    anomaly_sensitivity: "high",
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
  beforeEach(() => {
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(true);
  });

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
        let loadCount = 0;
        const sendMessagePromise = routeSend({
          [T.list]: () => {
            loadCount += 1;
            return { monitors: [buildMonitor(loadCount > 1)] };
          },
          [T.trash]: () => ({ monitors: [] }),
        });
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
          anomalyMethods: ["rolling_zscore"],
          anomalySensitivity: "high",
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
          anomalyMethods: ["rolling_zscore"],
          anomalySensitivity: "high",
        });
      });
    });
  });

  describe("GIVEN a monitor with a look-back window", () => {
    describe("WHEN the View series action is activated", () => {
      it("THEN it emits dp-monitors-panel-open-chart with the monitor entities and matching range", async () => {
        expect.assertions(6);
        const monitor = {
          ...buildMonitor(true),
          look_back_hours: 6,
          anomaly_methods: ["rolling_zscore"],
          anomaly_sensitivity: "high",
        };
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
          anomalyMethods: string[];
          anomalySensitivity: string;
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
        // The monitor's OWN detection config rides along on the event.
        expect(detail!.anomalyMethods).toEqual(["rolling_zscore"]);
        expect(detail!.anomalySensitivity).toBe("high");
      });
    });
  });

  describe("GIVEN a monitor with scan history", () => {
    async function renderWithHistory(counts: number[]) {
      const monitor = {
        ...buildMonitor(true),
        scan_history: counts.map((count, i) => ({
          t: `2026-05-19T1${i % 10}:00:00Z`,
          count,
        })),
      };
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
      return el;
    }

    describe.each([[[]], [[3]]])("WHEN it has %j scans", (counts) => {
      it("THEN it shows a not-enough-data state that is not aria-hidden", async () => {
        expect.assertions(4);
        const el = await renderWithHistory(counts);
        const empty = el.shadowRoot?.querySelector(".sparkline-empty");
        expect(empty).not.toBeNull();
        expect(empty?.textContent).toContain("Not enough data yet");
        expect(empty?.hasAttribute("aria-hidden")).toBe(false);
        expect(el.shadowRoot?.querySelector("polyline")).toBeNull();
      });
    });

    describe("WHEN it has many scans", () => {
      it("THEN it draws a polyline, latest dot, baseline, caption and titles", async () => {
        expect.assertions(7);
        const el = await renderWithHistory([0, 2, 5, 1]);
        const svg = el.shadowRoot?.querySelector(".monitor-sparkline");
        expect(svg?.querySelector("polyline")).not.toBeNull();
        expect(svg?.querySelectorAll("circle.sparkline-latest")).toHaveLength(
          1
        );
        expect(svg?.querySelector(".sparkline-baseline")).not.toBeNull();
        expect(svg?.querySelectorAll("title").length).toBeGreaterThanOrEqual(4);
        expect(svg?.hasAttribute("aria-hidden")).toBe(false);
        expect(svg?.getAttribute("aria-label")).toContain("1");
        expect(
          el.shadowRoot?.querySelector(".sparkline-caption")?.textContent
        ).toContain("last 4 scans");
      });
    });
  });

  describe("GIVEN a monitor is shown", () => {
    async function mountWithDeletableMonitor() {
      let deleted = false;
      const send = vi.fn((message: { type: string; monitor_id?: string }) => {
        switch (message.type) {
          case T.list:
            return Promise.resolve({
              monitors: deleted ? [] : [buildMonitor(true)],
            });
          case T.trash:
            return Promise.resolve({ monitors: [] });
          case T.delete:
            deleted = true;
            return Promise.resolve({});
          case T.restore:
            deleted = false;
            return Promise.resolve({ monitor: buildMonitor(true) });
          default:
            return Promise.resolve({});
        }
      });
      const hass = createMockHass({
        connection: {
          subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
          sendMessagePromise: send,
        },
      });
      const el = createElement(hass);
      await el.updateComplete;
      await flushMicrotasks();
      await el.updateComplete;
      return { el, send };
    }

    describe("WHEN delete is confirmed", () => {
      it("THEN deleteMonitor is called and the card is optimistically removed", async () => {
        expect.assertions(2);
        const { el, send } = await mountWithDeletableMonitor();

        const deleteBtn =
          el.shadowRoot?.querySelector<HTMLElement>(".delete-btn");
        deleteBtn?.click();
        await flushMicrotasks();
        await flushMicrotasks();
        await el.updateComplete;

        expect(
          send.mock.calls.some(
            (c) =>
              (c[0] as { type: string }).type === T.delete &&
              (c[0] as { monitor_id?: string }).monitor_id === "monitor-1"
          )
        ).toBe(true);
        expect(el.shadowRoot?.querySelector(".monitor-card")).toBeNull();
      });

      it("THEN an undo notification is fired whose action restores the monitor", async () => {
        expect.assertions(3);
        const { el, send } = await mountWithDeletableMonitor();

        let notification: {
          message: string;
          action?: { text: string; action: () => void };
        } | null = null;
        el.addEventListener("hass-notification", (e) => {
          notification = (e as CustomEvent).detail;
        });

        const deleteBtn =
          el.shadowRoot?.querySelector<HTMLElement>(".delete-btn");
        deleteBtn?.click();
        await flushMicrotasks();
        await flushMicrotasks();
        await el.updateComplete;

        expect(notification).not.toBeNull();
        expect(notification!.action?.text).toBeTruthy();

        notification!.action?.action();
        await flushMicrotasks();

        expect(
          send.mock.calls.some(
            (c) =>
              (c[0] as { type: string }).type === T.restore &&
              (c[0] as { monitor_id?: string }).monitor_id === "monitor-1"
          )
        ).toBe(true);
      });
    });

    describe("WHEN the delete confirmation is shown", () => {
      it("THEN its copy states the monitor is restorable and not that it cannot be undone", async () => {
        expect.assertions(2);
        const { el } = await mountWithDeletableMonitor();

        const deleteBtn =
          el.shadowRoot?.querySelector<HTMLElement>(".delete-btn");
        deleteBtn?.click();
        await flushMicrotasks();

        const options = mockConfirm.mock.calls[0]?.[1] as {
          message?: string;
        };
        expect(options.message?.toLowerCase()).toContain("restore");
        expect(options.message?.toLowerCase()).not.toContain(
          "cannot be undone"
        );
      });
    });
  });

  describe("GIVEN the delete request fails", () => {
    describe("WHEN delete is confirmed", () => {
      it("THEN a failure notification is surfaced", async () => {
        expect.assertions(1);
        const send = routeSend({
          [T.list]: () => ({ monitors: [buildMonitor(true)] }),
          [T.trash]: () => ({ monitors: [] }),
          [T.delete]: () => {
            throw new Error("boom");
          },
        });
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: send,
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        let notification: { message: string } | null = null;
        el.addEventListener("hass-notification", (e) => {
          notification = (e as CustomEvent).detail;
        });

        el.shadowRoot?.querySelector<HTMLElement>(".delete-btn")?.click();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(notification?.message).toBeTruthy();
      });
    });
  });

  describe("GIVEN there are recently-deleted monitors", () => {
    function buildTrashed(id: string, name: string, deletedAt: string) {
      return {
        ...buildMonitor(false),
        id,
        name,
        deleted_at: deletedAt,
      };
    }

    async function mountWithTrash() {
      const trashA = buildTrashed("t1", "Old A", "2026-10-01T10:00:00Z");
      const trashB = buildTrashed("t2", "Old B", "2026-10-02T10:00:00Z");
      const send = routeSend({
        [T.list]: () => ({ monitors: [] }),
        [T.trash]: () => ({ monitors: [trashA, trashB] }),
        [T.restore]: () => ({ monitor: buildMonitor(true) }),
        [T.purge]: () => ({}),
      });
      const hass = createMockHass({
        connection: {
          subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
          sendMessagePromise: send,
        },
      });
      const el = createElement(hass);
      await el.updateComplete;
      await flushMicrotasks();
      await el.updateComplete;
      return { el, send };
    }

    describe("WHEN the panel renders", () => {
      it("THEN a Recently deleted section lists each trashed monitor with its name and deletion time", async () => {
        expect.assertions(3);
        const { el } = await mountWithTrash();

        const items =
          el.shadowRoot?.querySelectorAll<HTMLElement>(".trash-item");
        expect(items).toHaveLength(2);
        const text =
          el.shadowRoot?.querySelector(".trash-section")?.textContent;
        expect(text).toContain("Old A");
        expect(text).toContain("Old B");
      });
    });

    describe("WHEN Restore is activated on a trashed monitor", () => {
      it("THEN restoreMonitor is called with that id", async () => {
        expect.assertions(1);
        const { el, send } = await mountWithTrash();

        el.shadowRoot
          ?.querySelector<HTMLElement>(
            '.trash-item[data-monitor-id="t1"] .restore-btn'
          )
          ?.click();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(
          send.mock.calls.some(
            (c) =>
              (c[0] as { type: string }).type === T.restore &&
              (c[0] as { monitor_id?: string }).monitor_id === "t1"
          )
        ).toBe(true);
      });
    });

    describe("WHEN Purge is confirmed on a trashed monitor", () => {
      it("THEN purgeMonitor is called with that id", async () => {
        expect.assertions(1);
        const { el, send } = await mountWithTrash();

        el.shadowRoot
          ?.querySelector<HTMLElement>(
            '.trash-item[data-monitor-id="t2"] .purge-btn'
          )
          ?.click();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(
          send.mock.calls.some(
            (c) =>
              (c[0] as { type: string }).type === T.purge &&
              (c[0] as { monitor_id?: string }).monitor_id === "t2"
          )
        ).toBe(true);
      });
    });

    describe("WHEN restoring a trashed monitor fails", () => {
      it("THEN a failure notification is surfaced", async () => {
        expect.assertions(1);
        const trashA = buildTrashed("t1", "Old A", "2026-10-01T10:00:00Z");
        const send = routeSend({
          [T.list]: () => ({ monitors: [] }),
          [T.trash]: () => ({ monitors: [trashA] }),
          [T.restore]: () => {
            throw new Error("boom");
          },
        });
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: send,
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        let notification: { message: string } | null = null;
        el.addEventListener("hass-notification", (e) => {
          notification = (e as CustomEvent).detail;
        });

        el.shadowRoot?.querySelector<HTMLElement>(".restore-btn")?.click();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(notification?.message).toBeTruthy();
      });
    });
  });

  describe("GIVEN a monitor with dismissed windows", () => {
    async function mountWithDismissed() {
      const monitor = {
        ...buildMonitor(true),
        look_back_hours: 6,
        dismissed_windows: [
          {
            id: "w1",
            start_ms: 1000,
            end_ms: 2000,
            dismissed_at: "2026-10-01T00:00:00Z",
            expires_at: "2026-10-05T00:00:00Z",
          },
        ],
      };
      const send = routeSend({
        [T.list]: () => ({ monitors: [monitor] }),
        [T.trash]: () => ({ monitors: [] }),
        [T.undismiss]: () => ({ monitor }),
      });
      const hass = createMockHass({
        connection: {
          subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
          sendMessagePromise: send,
        },
      });
      const el = createElement(hass);
      await el.updateComplete;
      await flushMicrotasks();
      await el.updateComplete;
      return { el, send };
    }

    describe("WHEN the panel renders", () => {
      it("THEN each dismissed window shows its range, dismissed-at and expiry in a browsable list", async () => {
        expect.assertions(4);
        const { el } = await mountWithDismissed();

        const items =
          el.shadowRoot?.querySelectorAll<HTMLElement>(".dismissed-item");
        expect(items).toHaveLength(1);
        const text =
          el.shadowRoot?.querySelector(".dismissed-windows")?.textContent;
        expect(text?.toLowerCase()).toContain("dismissed");
        expect(text?.toLowerCase()).toContain("expires");
        expect(
          el.shadowRoot?.querySelector("details.dismissed-windows")
        ).toBeNull();
      });
    });

    describe("WHEN View window on chart is activated", () => {
      it("THEN dp-monitors-panel-open-chart fires with the window range", async () => {
        expect.assertions(3);
        const { el } = await mountWithDismissed();

        let detail: {
          entityIds: string[];
          startMs: number;
          endMs: number;
        } | null = null;
        el.addEventListener("dp-monitors-panel-open-chart", (e) => {
          detail = (e as CustomEvent).detail;
        });

        el.shadowRoot?.querySelector<HTMLElement>(".view-window-btn")?.click();

        expect(detail).not.toBeNull();
        expect(detail!.startMs).toBe(1000);
        expect(detail!.endMs).toBe(2000);
      });
    });

    describe("WHEN Restore (un-dismiss) is activated", () => {
      it("THEN undismissMonitorAnomaly is called with the window id", async () => {
        expect.assertions(1);
        const { el, send } = await mountWithDismissed();

        el.shadowRoot?.querySelector<HTMLElement>(".undismiss-btn")?.click();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(
          send.mock.calls.some(
            (c) =>
              (c[0] as { type: string }).type === T.undismiss &&
              (c[0] as { window_id?: string }).window_id === "w1"
          )
        ).toBe(true);
      });
    });
  });

  describe("GIVEN the compact action controls are shown", () => {
    describe("WHEN the panel renders a monitor card", () => {
      it("THEN each action control has an accessible label and tooltip", async () => {
        expect.assertions(6);
        const send = routeSend({
          [T.list]: () => ({ monitors: [buildMonitor(true)] }),
          [T.trash]: () => ({ monitors: [] }),
        });
        const hass = createMockHass({
          connection: {
            subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
            sendMessagePromise: send,
          },
        });
        const el = createElement(hass);
        await el.updateComplete;
        await flushMicrotasks();
        await el.updateComplete;

        for (const selector of [
          ".view-series-btn",
          ".edit-btn",
          ".delete-btn",
        ]) {
          const btn = el.shadowRoot?.querySelector<HTMLElement>(selector);
          expect(btn?.getAttribute("aria-label")).toBeTruthy();
          expect(btn?.getAttribute("title")).toBeTruthy();
        }
      });
    });
  });
});
