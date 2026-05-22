# Watching for Anomalies

This guide assumes you already know how to:

- add targets
- use the timeline slider range explorer
- create annotations

If not, start with:

- [/tutorials/quickstart](/tutorials/quickstart)
- [/tutorials/range-explorer](/tutorials/range-explorer)
- [/tutorials/annotations-panel](/tutorials/annotations-panel)

## The anomaly investigation loop

### 1) Detect

Detection sources:

- you notice something in the UI
- an HA notification
- an automation “bookmarks” a suspicious moment

When you detect, create an annotation immediately (even if it’s vague). You can refine it later.

### 2) Locate the start

Use the timeline slider to find the first deviation and annotate it.

### 3) Compare to normal

Use comparison windows to answer:

- Is this pattern new?
- Is it only happening at certain times?
- Is it seasonal or weekly?

### 4) Correlate

Add targets that might explain the change:

- occupancy / presence
- HVAC mode
- doors/windows open
- weather
- power usage

### 5) Record what you changed

If you take action (fix a leak, change an automation, replace a filter), create an annotation for the action time too. This makes the “did it help?” question much easier later.

## Practical “recipes”

### Recipe: “humidity rising faster than usual”

1. Add humidity target(s).
2. Use the timeline slider to find the start of the rise.
3. Add HVAC/dehumidifier/power targets.
4. Compare against the same weekday last week.
5. Annotate likely causes and any interventions.

### Recipe: “heating runs longer than normal”

1. Add indoor temperature + HVAC state + outdoor temperature.
2. Compare yesterday vs today.
3. Annotate:
   - the time heating starts
   - the time it stops
   - any unusual gaps/cycling
