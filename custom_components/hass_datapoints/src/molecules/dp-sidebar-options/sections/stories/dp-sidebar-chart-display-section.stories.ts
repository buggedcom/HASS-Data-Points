import { html } from "lit";
import "../dp-sidebar-chart-display-section";

/**
 * `dp-sidebar-chart-display-section` renders the "Chart Display" sidebar section,
 * grouping chart visual options: tooltips, hover guides, correlated anomalies, data gaps
 * (with a dependent gap-threshold select), and y-axis layout mode.
 *
 * @fires dp-display-change - `{ kind: string, value: boolean | string }` fired when any option changes
 */
export default {
  title: "Molecules/Sidebar Options/Chart Display Section",
  component: "dp-sidebar-chart-display-section",
  parameters: {
    actions: {
      handles: ["dp-display-change", "dp-item-change", "dp-radio-change"],
    },
  },
  argTypes: {
    showTooltips: {
      control: "boolean",
      description: "Whether chart tooltips are shown on hover.",
    },
    showHoverGuides: {
      control: "boolean",
      description: "Whether hover guide lines are emphasized.",
    },
    showCorrelatedAnomalies: {
      control: "boolean",
      description: "Whether correlated anomalies across series are highlighted.",
    },
    showDataGaps: {
      control: "boolean",
      description: "Whether data gaps are visually indicated. When false the gap threshold select is disabled.",
    },
    dataGapThreshold: {
      control: "select",
      options: ["auto", "5m", "15m", "1h", "2h", "3h", "6h", "12h", "24h"],
      description: "Minimum gap duration treated as a data gap. Active only when showDataGaps is true.",
    },
    yAxisMode: {
      control: "select",
      options: ["combined", "unique", "split"],
      description: "Y-axis layout: \"combined\" groups by unit, \"unique\" gives each series its own axis, \"split\" renders rows.",
    },
  },
  args: {
    showTooltips: true,
    showHoverGuides: false,
    showCorrelatedAnomalies: false,
    showDataGaps: true,
    dataGapThreshold: "2h",
    yAxisMode: "combined",
  },
  render: (args: Record<string, unknown>) => html`
    <dp-sidebar-chart-display-section
      .showTooltips=${args.showTooltips}
      .showHoverGuides=${args.showHoverGuides}
      .showCorrelatedAnomalies=${args.showCorrelatedAnomalies}
      .showDataGaps=${args.showDataGaps}
      .dataGapThreshold=${args.dataGapThreshold}
      .yAxisMode=${args.yAxisMode}
    ></dp-sidebar-chart-display-section>
  `,
};

/** Default state — tooltips on, data gaps on, y-axis combined. */
export const Default = {};

/** Data gaps off — the gap threshold select is disabled and dimmed. */
export const DataGapsOff = {
  args: { showDataGaps: false },
};

/** All chart display checkboxes enabled. */
export const AllCheckboxesOn = {
  args: {
    showTooltips: true,
    showHoverGuides: true,
    showCorrelatedAnomalies: true,
    showDataGaps: true,
    dataGapThreshold: "1h",
  },
};

/** Y-axis set to unique — each series gets its own axis. */
export const YAxisUnique = {
  args: { yAxisMode: "unique" },
};

/** Y-axis set to split — each series rendered in its own chart row. */
export const YAxisSplit = {
  args: { yAxisMode: "split" },
};
