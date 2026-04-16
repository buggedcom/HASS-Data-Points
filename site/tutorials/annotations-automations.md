# Annotations via Automations

## Why automate annotations

Some context is only available at the time it happens:

- devices changing state briefly
- notifications you receive
- a threshold crossing
- “human events” (door opened, laundry started, guest arrived)

Automations can create annotations at the exact moment, so later you can correlate it with trends and anomalies.

<div class="dp-placeholder">
  <strong>Screenshot placeholder:</strong> automation example + resulting annotation.
</div>

## Pattern 1: annotate a device event

Use when a state change is meaningful on its own.

Example ideas:

- `Washing machine: started`
- `Garage door: opened`
- `Heat pump: defrost cycle`

## Pattern 2: annotate threshold crossings

Use when you want to capture “first time it happened”:

- temperature above/below threshold
- power usage spike
- humidity rising unusually fast

## Pattern 3: annotate anomaly candidates

Use when you want an automation to “bookmark” suspicious windows for later review in the panel.

Suggested workflow:

1. Automation detects “suspicious” condition.
2. It creates an annotation including the measured value.
3. You open Datapoints later and use the timeline slider to explore around that moment.

## Notes

Exact services/entities depend on your Home Assistant configuration and how `hass_datapoints` exposes annotation creation. This tutorial will be updated with copy-paste YAML examples once the integration’s service schema is finalized for stable docs.
