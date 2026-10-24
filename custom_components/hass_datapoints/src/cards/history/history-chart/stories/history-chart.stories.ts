/**
 * Stories for `hass-datapoints-history-chart` — the canvas chart element that
 * draws numeric line series plus binary sensors. Binary sensors can be shown in
 * two styles, chosen per sensor via `binary_display` on the series setting:
 *
 *   - "background" (default) — a full-height translucent band over the plot,
 *     shaded only during ON windows.
 *   - "row" — a compact HA-style on/off strip in its own lane stacked below the
 *     numeric plot.
 *
 * The element exposes a public `draw(model)` method; stories feed it a fixture
 * `history` payload (the `{ [entity_id]: [{ lu, s }] }` shape HA returns) so the
 * real draw path (classification → lanes → legend) is exercised without a live
 * HA connection.
 */
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { createMockHass } from "@/test-support/mock-hass";
import "../history-chart";

type DrawableChart = HTMLElement & {
  hass: unknown;
  draw(model: Record<string, unknown>): void;
};

type BinaryState = { lu: number; s: string };

// ── Deterministic 24h window ──────────────────────────────────────────────────
const T1 = Date.UTC(2026, 2, 31, 12, 0, 0); // 2026-03-31T12:00:00Z (ms)
const T0 = T1 - 24 * 60 * 60 * 1000;
const SEC = (fractionThroughWindow: number): number =>
  Math.round((T0 + fractionThroughWindow * (T1 - T0)) / 1000);

/** Build a binary on/off history (lu in seconds, as HA sends it). */
function binaryHistory(
  toggles: Array<{ at: number; s: "on" | "off" }>
): BinaryState[] {
  return toggles.map(({ at, s }) => ({ lu: SEC(at), s }));
}

/** Build a simple numeric history (lu in seconds). */
function numericHistory(
  points: Array<{ at: number; v: number }>
): BinaryState[] {
  return points.map(({ at, v }) => ({ lu: SEC(at), s: String(v) }));
}

/** A hass mock carrying device-class-aware binary sensors for label wording. */
function makeHass(): Record<string, unknown> {
  const hass = createMockHass() as unknown as {
    states: Record<string, unknown>;
  };
  hass.states["binary_sensor.front_door"] = {
    entity_id: "binary_sensor.front_door",
    state: "off",
    attributes: {
      friendly_name: "Front Door",
      icon: "mdi:door",
      device_class: "door",
    },
  };
  hass.states["binary_sensor.window"] = {
    entity_id: "binary_sensor.window",
    state: "off",
    attributes: {
      friendly_name: "Window",
      icon: "mdi:window-closed",
      device_class: "window",
    },
  };
  return hass as unknown as Record<string, unknown>;
}

function makeChart(): DrawableChart {
  const el = document.createElement(
    "hass-datapoints-history-chart"
  ) as DrawableChart;
  el.style.cssText = "display:block;width:860px;height:360px;";
  return el;
}

function drawArgs(
  config: Record<string, unknown>,
  history: Record<string, BinaryState[]>
) {
  return {
    hass: makeHass(),
    config,
    history,
    stats: {},
    events: [],
    t0: T0,
    t1: T1,
    options: {},
  };
}

function legendLabels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll("#legend .legend-label")).map(
    (node) => node.textContent?.trim() ?? ""
  );
}

const meta: Meta = {
  title: "Charts/History Chart Binary",
  component: "hass-datapoints-history-chart",
};
export default meta;

type Story = StoryObj;

// ── (a) Background-only ────────────────────────────────────────────────────────
/**
 * Two binary sensors, both in the default background mode. Each shades the plot
 * only during its ON windows (no whole-plot wash — the #61/#64 fix). Both appear
 * in the legend.
 */
export const BackgroundOnly: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          series_settings: [
            { entity_id: "binary_sensor.front_door" },
            { entity_id: "binary_sensor.window", binary_display: "background" },
          ],
        },
        {
          "binary_sensor.front_door": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.25, s: "on" },
            { at: 0.5, s: "off" },
          ]),
          "binary_sensor.window": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.6, s: "on" },
            { at: 0.8, s: "off" },
          ]),
        }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual(["Front Door", "Window"])
    );
  },
};

// ── (b) Row-only ───────────────────────────────────────────────────────────────
/**
 * All-binary chart (no numeric series) with every sensor in row mode. Each gets
 * its own compact lane below where the plot would be, and the chart still
 * renders (user story 14). Device-class wording resolves (door → open/closed).
 */
export const RowOnly: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          series_settings: [
            { entity_id: "binary_sensor.front_door", binary_display: "row" },
            { entity_id: "binary_sensor.window", binary_display: "row" },
          ],
        },
        {
          "binary_sensor.front_door": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.2, s: "on" },
            { at: 0.4, s: "off" },
            { at: 0.7, s: "on" },
            { at: 0.9, s: "off" },
          ]),
          "binary_sensor.window": binaryHistory([
            { at: 0, s: "on" },
            { at: 0.35, s: "off" },
            { at: 0.75, s: "on" },
          ]),
        }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual(["Front Door", "Window"])
    );
    // All-binary row chart must render its lanes, not the "no data" message.
    const message = el.querySelector("#chart-message")?.textContent?.trim();
    expect(message ?? "").toBe("");
  },
};

// ── (c) Mixed background + row ──────────────────────────────────────────────────
/**
 * A numeric series with one background-mode and one row-mode binary sensor,
 * mixed freely. The numeric plot keeps its line; the background sensor shades
 * ON windows; the row sensor gets a lane beneath the plot. Toggling the row
 * sensor off in the legend reclaims its lane on the next draw.
 */
export const MixedBackgroundAndRow: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          series_settings: [
            { entity_id: "sensor.temperature" },
            { entity_id: "binary_sensor.window", binary_display: "background" },
            { entity_id: "binary_sensor.front_door", binary_display: "row" },
          ],
        },
        {
          "sensor.temperature": numericHistory([
            { at: 0, v: 19 },
            { at: 0.25, v: 21 },
            { at: 0.5, v: 20 },
            { at: 0.75, v: 22.5 },
            { at: 1, v: 21.5 },
          ]),
          "binary_sensor.window": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.4, s: "on" },
            { at: 0.6, s: "off" },
          ]),
          "binary_sensor.front_door": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.3, s: "on" },
            { at: 0.55, s: "off" },
            { at: 0.85, s: "on" },
          ]),
        }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual(["Temperature", "Window", "Front Door"])
    );

    // Toggling the row sensor's legend entry flips its pressed state (and
    // reclaims the lane on the next draw).
    const rowToggle = () =>
      el.querySelectorAll<HTMLButtonElement>("#legend .legend-toggle")[2];
    expect(rowToggle().getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(rowToggle());
    await waitFor(() =>
      expect(rowToggle().getAttribute("aria-pressed")).toBe("false")
    );
  },
};

// ── (d) Split view + row mode ───────────────────────────────────────────────────
/**
 * Split view (one plot per numeric series) with a row-mode binary sensor. The
 * row lane must render in its own dedicated region beneath the split row stack
 * (no empty reserved gap, no dead legend entry — the #63 split-view fix).
 * Toggling the row sensor off reclaims its lane region on the next draw.
 */
export const SplitViewRow: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          split_view: true,
          series_settings: [
            { entity_id: "sensor.temperature" },
            { entity_id: "sensor.humidity" },
            { entity_id: "binary_sensor.front_door", binary_display: "row" },
          ],
        },
        {
          "sensor.temperature": numericHistory([
            { at: 0, v: 19 },
            { at: 0.5, v: 21 },
            { at: 1, v: 20 },
          ]),
          "sensor.humidity": numericHistory([
            { at: 0, v: 55 },
            { at: 0.5, v: 60 },
            { at: 1, v: 58 },
          ]),
          "binary_sensor.front_door": binaryHistory([
            { at: 0, s: "off" },
            { at: 0.3, s: "on" },
            { at: 0.6, s: "off" },
          ]),
        }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual([
        "Temperature",
        "Humidity",
        "Front Door",
      ])
    );

    // The row lane renders in its own dedicated region beneath the split rows,
    // with a canvas (not an empty reserved gap).
    const laneRegion = () =>
      el.querySelector<HTMLElement>(".split-binary-lane-region");
    await waitFor(() => expect(laneRegion()).not.toBeNull());
    expect(
      laneRegion()!.querySelector(".split-binary-lane-canvas")
    ).not.toBeNull();

    // Toggling the row sensor off reclaims the lane region on the next draw.
    const rowToggle = () =>
      el.querySelectorAll<HTMLButtonElement>("#legend .legend-toggle")[2];
    await userEvent.click(rowToggle());
    await waitFor(() => expect(laneRegion()).toBeNull());
  },
};

// ── (d) Binary aggregates as bars ───────────────────────────────────────────────
const doorToggles = binaryHistory([
  { at: 0, s: "off" },
  { at: 0.2, s: "on" },
  { at: 0.3, s: "off" },
  { at: 0.6, s: "on" },
  { at: 0.7, s: "off" },
]);

const dailyOpens = {
  id: "opens",
  operation: "transition_count",
  interval: "day",
  mode: "interval",
  states: ["on"],
  resetOnZoom: false,
};

/**
 * A door sensor with a daily "changes to open" aggregate. The aggregate appears
 * as a bar series in the legend alongside the source band.
 */
export const BinaryAggregateBars: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          series_settings: [
            {
              entity_id: "binary_sensor.front_door",
              analysis: { aggregates: [dailyOpens] },
            },
          ],
        },
        { "binary_sensor.front_door": doorToggles }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual([
        "Front Door · Daily · Count changes to a state (Open)",
        "Front Door",
      ])
    );
    // The 24h window cuts both days short, so the partial-period explanation
    // and the retained-history limit are shown as text, not only as styling.
    const note = el.querySelector("#aggregate-note") as HTMLElement;
    await waitFor(() => {
      expect(note.hidden).toBe(false);
      expect(note.textContent).toContain("partial periods");
      expect(note.textContent).toContain("retained history");
    });
  },
};

/** With Hide source series on, only the aggregate remains in the legend. */
export const BinaryAggregateHidesSource: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        {
          series_settings: [
            {
              entity_id: "binary_sensor.front_door",
              analysis: {
                aggregates: [dailyOpens],
                hide_source_series: true,
              },
            },
          ],
        },
        { "binary_sensor.front_door": doorToggles }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual([
        "Front Door · Daily · Count changes to a state (Open)",
      ])
    );
  },
};

// ── (e) Event counts ─────────────────────────────────────────────────────────────
/** An event entity's presses are counted per day as bars, by selected type. */
export const EventCountBars: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    const press = (at: number, type: string) => ({
      lu: SEC(at),
      s: new Date(SEC(at) * 1000).toISOString(),
      a: { event_type: type },
    });
    el.draw(
      drawArgs(
        {
          series_settings: [
            {
              entity_id: "event.button",
              analysis: {
                aggregates: [
                  {
                    id: "presses",
                    operation: "event_count",
                    interval: "hour",
                    mode: "interval",
                    eventTypes: ["double_press"],
                    resetOnZoom: false,
                  },
                ],
              },
            },
          ],
        },
        {
          "event.button": [
            press(0.2, "single_press"),
            press(0.4, "double_press"),
            press(0.6, "double_press"),
          ],
        }
      )
    );

    await waitFor(() =>
      expect(legendLabels(el)).toEqual(["event.button · Hourly · double_press"])
    );
  },
};

// ── (f) Comparison window aggregates ────────────────────────────────────────────
/** A comparison window aggregates its own history and overlays the main bars. */
export const BinaryAggregateComparison: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    const week = 7 * 24 * 3600 * 1000;
    const args = drawArgs(
      {
        comparison_windows: [
          { id: "last-week", label: "Last week", time_offset_ms: -week },
        ],
        selected_comparison_window_id: "last-week",
        series_settings: [
          {
            entity_id: "binary_sensor.front_door",
            analysis: { aggregates: [dailyOpens] },
          },
        ],
      },
      { "binary_sensor.front_door": doorToggles }
    ) as Record<string, unknown>;
    args.comparisonResults = [
      {
        id: "last-week",
        label: "Last week",
        time_offset_ms: -week,
        histResult: {
          "binary_sensor.front_door": doorToggles.map((state) => ({
            ...state,
            lu: state.lu - week / 1000,
          })),
        },
        statsResult: {},
      },
    ];
    el.draw(args);

    await waitFor(() =>
      expect(legendLabels(el)).toEqual([
        "Front Door · Daily · Count changes to a state (Open)",
        "Front Door",
      ])
    );
  },
};

// ── (g) Mixed units ─────────────────────────────────────────────────────────────
const mixedSettings = () => [
  {
    entity_id: "sensor.temperature",
    analysis: {
      aggregates: [
        {
          id: "mean",
          operation: "mean",
          interval: "hour",
          mode: "interval",
          resetOnZoom: false,
        },
      ],
    },
  },
  {
    entity_id: "binary_sensor.front_door",
    analysis: {
      aggregates: [
        dailyOpens,
        {
          ...dailyOpens,
          id: "open-time",
          operation: "state_duration",
        },
      ],
    },
  },
];

const mixedHistory = () => ({
  "sensor.temperature": numericHistory([
    { at: 0, v: 19 },
    { at: 0.5, v: 21 },
    { at: 1, v: 20 },
  ]),
  "binary_sensor.front_door": doorToggles,
});

/**
 * Counts, minutes and temperature never share a value axis: each unit gets its
 * own axis, while the mean line reuses the temperature axis.
 */
export const MixedUnitAggregatesCombined: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(drawArgs({ series_settings: mixedSettings() }, mixedHistory()));

    await waitFor(() => expect(legendLabels(el)).toHaveLength(5));
    const axisUnits = () =>
      Array.from(el.querySelectorAll(".chart-axis-unit")).map((node) =>
        node.textContent?.trim()
      );
    // Temperature and its mean share one axis; minutes get their own, so the
    // two units are never drawn against a single scale.
    await waitFor(() => {
      expect(axisUnits()).toContain("min");
      expect(axisUnits().filter((unit) => unit === "min")).toHaveLength(1);
      expect(axisUnits().length).toBeGreaterThanOrEqual(2);
    });

    // Legend toggles hide an aggregate like any other series.
    const toggles = () =>
      Array.from(
        el.querySelectorAll<HTMLButtonElement>("#legend .legend-toggle")
      );
    const minutesToggle = toggles().find((button) =>
      button.textContent?.includes("Time in a state")
    )!;
    await userEvent.click(minutesToggle);
    await waitFor(() =>
      expect(
        toggles()
          .find((button) => button.textContent?.includes("Time in a state"))
          ?.getAttribute("aria-pressed")
      ).toBe("false")
    );
  },
};

/** In split view each aggregate series gets its own row with its own axis. */
export const MixedUnitAggregatesSplit: Story = {
  render: () => makeChart(),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(
      "hass-datapoints-history-chart"
    ) as DrawableChart;
    el.draw(
      drawArgs(
        { split_view: true, series_settings: mixedSettings() },
        mixedHistory()
      )
    );

    await waitFor(() => expect(legendLabels(el)).toHaveLength(5));
    await waitFor(() =>
      expect(
        el.querySelectorAll(".split-series-row").length
      ).toBeGreaterThanOrEqual(4)
    );
  },
};
