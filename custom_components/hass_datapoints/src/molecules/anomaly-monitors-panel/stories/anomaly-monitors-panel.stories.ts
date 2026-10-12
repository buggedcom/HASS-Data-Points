import { html } from "lit";
import "../anomaly-monitors-panel";
import { expect, waitFor } from "storybook/test";
import { setFrontendLocale } from "@/lib/i18n/localize";
import { createMockHass } from "@/test-support/mock-hass";
import { DOMAIN } from "@/constants";

export default {
  title: "Molecules/Anomaly Monitors Panel",
  component: "anomaly-monitors-panel",
  loaders: [
    async () => {
      await setFrontendLocale("en");
    },
  ],
  parameters: {
    actions: { handles: ["dp-monitors-panel-close", "dp-monitors-panel-new"] },
  },
};

function makeHass(resolveWith: unknown[]) {
  return {
    states: {},
    connection: {
      subscribeEvents: () => Promise.resolve(() => undefined),
      sendMessagePromise: () => Promise.resolve({ monitors: resolveWith }),
    },
  };
}

function neverHass() {
  const never = () => new Promise<never>(() => {});
  return {
    states: {},
    connection: {
      subscribeEvents: never,
      sendMessagePromise: never,
    },
  };
}

export const Loading = {
  render: () => {
    const el = document.createElement(
      "anomaly-monitors-panel"
    ) as HTMLElement & { hass: unknown };
    el.hass = neverHass();
    return el;
  },
};

export const Empty = {
  render: () => {
    const el = document.createElement(
      "anomaly-monitors-panel"
    ) as HTMLElement & { hass: unknown };
    el.hass = makeHass([]);
    return el;
  },
};

export const WithMonitors = {
  render: () => {
    const monitors = [
      {
        id: "m1",
        name: "Living room temp spike",
        enabled: true,
        entity_ids: ["sensor.living_room_temp"],
        type: "individual",
        anomaly_methods: ["rolling_zscore"],
        sensitivity: "medium",
        scan_history: [],
      },
      {
        id: "m2",
        name: "Boiler efficiency (disabled)",
        enabled: false,
        entity_ids: ["sensor.boiler_efficiency"],
        type: "individual",
        anomaly_methods: ["trend_residual"],
        sensitivity: "low",
        scan_history: [],
      },
      {
        id: "m3",
        name: "Multi-sensor comparison",
        enabled: true,
        entity_ids: ["sensor.temp_a", "sensor.temp_b"],
        type: "combined",
        anomaly_methods: ["iqr"],
        sensitivity: "high",
        scan_history: [],
      },
    ];
    const el = document.createElement(
      "anomaly-monitors-panel"
    ) as HTMLElement & { hass: unknown };
    el.hass = makeHass(monitors);
    return el;
  },
};

export const Default = {
  render: () => html`
    <div style="width:700px;height:600px;border:1px solid #ccc;">
      ${WithMonitors.render()}
    </div>
  `,
};

// ---------------------------------------------------------------------------
// State fixtures (mirror `buildMonitor` in the panel spec)
// ---------------------------------------------------------------------------

type PanelEl = HTMLElement & { hass: unknown; shadowRoot: ShadowRoot | null };

function buildMonitor(overrides: Record<string, unknown> = {}) {
  return {
    id: "monitor-1",
    type: "individual",
    name: "Kitchen anomaly",
    enabled: true,
    look_back_hours: 24,
    scan_interval_minutes: 30,
    created_at: "2026-05-19T10:00:00Z",
    last_scan_at: "2026-05-20T10:00:00Z",
    last_anomaly_at: null,
    last_cluster_count: 0,
    last_scan_data_points: 120,
    scan_history: [],
    device_id: null,
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
    ...overrides,
  };
}

function history(counts: number[]) {
  return counts.map((count, i) => ({
    t: new Date(Date.UTC(2026, 4, 20, i)).toISOString(),
    count,
  }));
}

interface Routes {
  monitors?: unknown[];
  trash?: unknown[];
  anomalies?: unknown;
}

/** hass whose websocket mock routes by message `type`. */
function makeRoutedHass({ monitors = [], trash = [], anomalies }: Routes) {
  return createMockHass({
    connection: {
      subscribeEvents: () => Promise.resolve(() => undefined),
      sendMessagePromise: (message: { type: string }) => {
        switch (message.type) {
          case `${DOMAIN}/monitors/list`:
            return Promise.resolve({ monitors });
          case `${DOMAIN}/monitors/trash/list`:
            return Promise.resolve({ monitors: trash });
          case `${DOMAIN}/monitors/anomalies`:
            return Promise.resolve(
              anomalies ?? {
                monitor_id: "",
                anomaly_clusters: [],
                dismissed_windows: [],
                cluster_count: 0,
              }
            );
          default:
            return Promise.resolve({});
        }
      },
    },
  });
}

function renderPanel(routes: Routes) {
  const el = document.createElement("anomaly-monitors-panel") as PanelEl;
  el.hass = makeRoutedHass(routes);
  return el;
}

function panelRoot(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector(
    "anomaly-monitors-panel"
  )?.shadowRoot;
  if (!root) throw new Error("anomaly-monitors-panel not rendered");
  return root;
}

const dismissedAt = "2026-05-20T08:00:00Z";

export const Quiet = {
  render: () =>
    renderPanel({
      monitors: [
        buildMonitor({
          id: "quiet-flat",
          name: "Flat-zero history",
          scan_history: history([0, 0, 0, 0, 0, 0]),
        }),
        buildMonitor({
          id: "quiet-new",
          name: "Not enough data yet",
          scan_history: history([0]),
        }),
      ],
    }),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() =>
      expect(
        panelRoot(canvasElement).querySelectorAll(".monitor-card")
      ).toHaveLength(2)
    );
    const root = panelRoot(canvasElement);
    await expect(root.querySelector(".monitor-anomaly-indicator")).toBeNull();
    await expect(root.querySelector(".monitor-sparkline")).not.toBeNull();
    await expect(root.querySelector(".sparkline-empty")).not.toBeNull();
    await expect(root.querySelector(".trash-section")).toBeNull();
  },
};

export const Firing = {
  render: () =>
    renderPanel({
      monitors: [
        buildMonitor({
          id: "firing-1",
          name: "Living room temp spike",
          last_cluster_count: 2,
          last_anomaly_at: "2026-05-20T09:30:00Z",
          scan_history: history([0, 0, 1, 1, 2, 3, 2]),
        }),
      ],
      anomalies: {
        monitor_id: "firing-1",
        cluster_count: 2,
        dismissed_windows: [],
        anomaly_clusters: [
          {
            anomalyMethod: "trend_residual",
            maxDeviation: 4.2,
            points: [
              { timeMs: Date.UTC(2026, 4, 20, 6), value: 31.2 },
              { timeMs: Date.UTC(2026, 4, 20, 7), value: 33.8 },
            ],
          },
          {
            anomalyMethod: "trend_residual",
            maxDeviation: 3.1,
            points: [{ timeMs: Date.UTC(2026, 4, 20, 9), value: 29.9 }],
          },
        ],
      },
    }),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() =>
      expect(
        panelRoot(canvasElement).querySelector(".monitor-anomaly-indicator")
      ).not.toBeNull()
    );
    const root = panelRoot(canvasElement);
    await expect(root.querySelector(".sparkline-latest")).not.toBeNull();
    await waitFor(() =>
      expect(root.querySelectorAll(".cluster-item")).toHaveLength(2)
    );
  },
};

export const WithTrash = {
  render: () =>
    renderPanel({
      monitors: [buildMonitor({ name: "Active monitor" })],
      trash: [
        buildMonitor({
          id: "deleted-1",
          name: "Old garage monitor",
          deleted_at: "2026-05-19T12:00:00Z",
        }),
        buildMonitor({
          id: "deleted-2",
          name: "Retired boiler monitor",
          deleted_at: "2026-05-18T09:30:00Z",
        }),
      ],
    }),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() =>
      expect(
        panelRoot(canvasElement).querySelector(".trash-section")
      ).not.toBeNull()
    );
    const root = panelRoot(canvasElement);
    await expect(root.querySelectorAll(".trash-item")).toHaveLength(2);
    await expect(root.querySelectorAll(".restore-btn")).toHaveLength(2);
    await expect(root.querySelectorAll(".purge-btn")).toHaveLength(2);
  },
};

export const WithDismissed = {
  render: () =>
    renderPanel({
      monitors: [
        buildMonitor({
          name: "Kitchen anomaly",
          dismissed_windows: [
            {
              id: "d1",
              start_ms: Date.UTC(2026, 4, 19, 6),
              end_ms: Date.UTC(2026, 4, 19, 8),
              dismissed_at: dismissedAt,
              expires_at: "2026-05-22T08:00:00Z",
            },
            {
              id: "d2",
              start_ms: Date.UTC(2026, 4, 18, 14),
              end_ms: Date.UTC(2026, 4, 18, 15),
              dismissed_at: dismissedAt,
              expires_at: null,
            },
          ],
        }),
      ],
    }),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() =>
      expect(
        panelRoot(canvasElement).querySelector(".dismissed-windows")
      ).not.toBeNull()
    );
    const root = panelRoot(canvasElement);
    await expect(root.querySelectorAll(".dismissed-item")).toHaveLength(2);
    await expect(root.querySelectorAll(".undismiss-btn")).toHaveLength(2);
  },
};
