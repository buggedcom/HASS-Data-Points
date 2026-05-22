# Range Explorer (Timeline Slider)

## Why the timeline slider matters

Most “what changed?” investigations fail because you lose time context while zooming. The timeline slider keeps a stable mental model:

- The full-range context stays visible.
- Your selected range is always explicit.
- You can repeatedly zoom/pan without getting lost.

<div class="dp-placeholder">
  <strong>Screenshot placeholder:</strong> timeline slider + selected range highlighted.
</div>

## Workflow: find the start of a problem

### Step 1 — Identify “now”

Start with a range that includes “now” (or the time you noticed the issue).

### Step 2 — Narrow the window

Drag the handles until you see the signal clearly:

- For sudden spikes: reduce to minutes/hours.
- For drift: reduce to hours/days.
- For state changes: reduce to the point where the step is obvious.

### Step 3 — Walk backwards to the first deviation

1. Pan left (earlier).
2. Keep narrowing until you find the first moment that diverges from normal.
3. When you find it, create an annotation right away.

See: [/tutorials/annotations-panel](/tutorials/annotations-panel)

## Workflow: correlate signals

When you have multiple targets:

1. Align the range so the anomaly is centered.
2. Add a second target that might explain it (HVAC state, power, occupancy, outdoor temperature).
3. If the timeline matches, add an annotation describing the correlation.
