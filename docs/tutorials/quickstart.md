# Quickstart

## Goal

In ~10 minutes you’ll:

- open the Datapoints panel
- add a couple of targets
- use the timeline slider to find an interesting range
- create your first annotation

<div class="dp-placeholder">
  <strong>Screenshot placeholder:</strong> Datapoints panel landing view.
</div>

## 1) Open the Datapoints panel

1. Install `hass_datapoints` in Home Assistant.
2. Open the **Datapoints** panel from the sidebar.

If you don’t see the panel, confirm the integration is loaded and your user has access to the panel.

## 2) Add a target row

A “target” is what you want to visualize (an entity, statistic, or derived series).

1. Add a target row.
2. Choose a sensor/entity that changes over time.
3. Confirm the chart renders a line or bars for the selected range.

## 3) Use the timeline slider to find the range

1. Drag the timeline handles to narrow the time window.
2. Zoom into a spike/dip/step change until you can see the shape clearly.
3. Pan left/right until you find the first moment it starts changing.

See: [/tutorials/range-explorer](/tutorials/range-explorer)

## 4) Create an annotation

Annotations are how you capture context. Create one whenever you see something meaningful (even if you’re not sure yet).

- If you’re in the panel: follow [/tutorials/annotations-panel](/tutorials/annotations-panel)
- If you prefer dashboards: follow [/tutorials/annotations-dashboard](/tutorials/annotations-dashboard)

## 5) Compare against “normal”

Use a comparison window to check whether the pattern is expected.

See: [/tutorials/comparisons](/tutorials/comparisons)
