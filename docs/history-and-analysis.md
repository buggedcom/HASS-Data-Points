# History Chart & Analysis

The history surfaces are the most powerful part of the integration. This document covers the chart controls, all analysis methods, and anomaly detection.

---

## History chart features

### Target rows

Each target row controls one visible chart series and supports:

- visibility on or off
- color selection
- drag-to-reorder
- analysis expansion
- chart participation for datapoints and anomaly overlays

When a target is hidden, it can be restored from the same row without losing its configuration.

### Datapoint visibility modes

The history chart can show:

- datapoints linked to selected targets
- all datapoints
- no datapoints

### Chart display options

- tooltips
- emphasized hover guides
- correlated anomaly highlighting
- data-gap rendering
- shared vs split y-axis
- split series into rows
- hover mode: follow the series vs snap to datapoints

### Date windows

Date windows let you save named historical periods and then:

- preview them from tabs above the chart
- compare the current period against a known baseline
- investigate seasonal or maintenance-driven changes
- support comparison-based anomaly detection

Useful date windows include:

- `Last week`
- `Before maintenance`
- `Heating baseline`
- `After insulation`
- `Last cold snap`

### Zoom and timeline controls

- drag-to-zoom directly on the chart
- a timeline slider for the full available range
- zoom highlight synchronization between chart and timeline
- zoom-out control
- timeline drag handles for precise range control

### Creating datapoints from the chart

The chart `+` action creates a datapoint at the inspected time. The dialog can prefill related items from the currently visible target rows so the note is immediately linked to the right series.

---

## Trend analysis

Trend analysis overlays a computed curve on top of the raw sensor data. Each method answers a different question, so choosing the right one depends on what you are investigating.

Enable trend lines from the analysis panel for each target row. The trend window selector controls how much history the smoothing methods use to compute each point.

### Linear trend

A straight line fitted to all visible points using least-squares regression.

**What it shows:** The overall direction of the data — whether the value is rising, falling, or flat across the whole window.

**Use it when:**

- You want to confirm a slow long-term drift (e.g. sensor calibration drift, gradual battery discharge)
- You are comparing the slope between two time windows to detect a change in behavior
- The data is noisy but you only care about the broad direction, not local variation

**Avoid it when:** The signal is clearly non-linear (curved, periodic, or mean-reverting). A straight line will misrepresent those patterns.

---

### Rolling average

A sliding-window mean that replaces each point with the average of all points within the preceding time window.

**What it shows:** The local level of the data, smoothed to remove high-frequency noise. The resulting curve lags the true signal — the tighter the window, the less lag; the wider the window, the smoother the result.

**Use it when:**

- You want to see the general level of a noisy sensor (temperature, humidity, energy)
- You are trying to compare two smoothed series to spot divergence
- The window length roughly matches the natural timescale of the change you are investigating (e.g. a 1h window for heating dynamics, a 24h window for daily patterns)

**Avoid it when:** You need responsiveness to recent changes. Because the window weights all points equally, a sharp step up will only be fully reflected in the average after the window has fully moved past the step.

---

### Exponential moving average (EMA)

A weighted average where recent points contribute more than older ones. The `alpha` parameter controls responsiveness: values near 1 track the signal closely with little smoothing; values near 0 produce a heavily smoothed curve that responds slowly.

The window selector maps to alpha values tuned for typical HA data cadences:
`30m → 0.97`, `1h → 0.92`, `6h → 0.75`, `24h → 0.50`, `7d → 0.25`, `14d → 0.15`, `21d → 0.10`, `28d → 0.07`.

**What it shows:** The local level of the data, like rolling average, but with less lag. A step change will begin appearing in the EMA immediately; a rolling average of equivalent width will not reflect it until the window moves past the old values.

**Use it when:**

- You want smoothing similar to rolling average but with faster response to real changes
- You are investigating whether a recent change represents a new pattern or a transient spike
- The data has an irregular update cadence (EMA is computed point-to-point, so it does not require evenly spaced samples)

**Avoid it when:** You need a precise, interpretable window like "the average over the last hour". EMA is adaptive and does not have a hard time boundary, so its output at any point blends all past data with exponentially decaying weight.

---

### Polynomial trend (quadratic)

A quadratic (degree-2) curve fitted globally to all visible points using least-squares regression.

**What it shows:** The overall shape of the data — whether it is arcing upward, bending back down, or following a U or inverted-U curve. A linear trend can only say "up" or "down"; the polynomial trend can also say "accelerating" or "decelerating".

**Use it when:**

- You suspect a non-linear drift — for example a battery whose discharge rate changes over time, or a room that heats quickly then tapers off
- You want to see whether a recovery is complete or still in progress
- Seasonal effects within the window create a visible curve

**Avoid it when:**

- The data is periodic or highly variable — the polynomial fit covers the entire window and will be distorted by extreme values at either end
- You only need a directional signal; use linear trend instead as it is easier to interpret

---

### LOWESS (Locally Weighted Scatterplot Smoothing)

A non-parametric smoother that computes a weighted local linear regression at each point, using only nearby data within a bandwidth window. The tricubic weight function gives maximum influence to very close neighbors and smoothly reduces weight toward the bandwidth boundary.

**What it shows:** The underlying shape of the data without assuming any global functional form. LOWESS can follow curves, plateaus, transitions, and reversals that would require a high-degree polynomial to approximate analytically.

**Use it when:**

- The signal has a complex or unknown shape — for example temperature that rises, plateaus during occupancy, then drops overnight
- You want a visually clean, intuitive curve that roughly follows the "center" of the data at every local region
- You are investigating whether a specific period deviates from the local pattern (compare the LOWESS curve to the raw signal)
- The window selector controls locality: a 1h bandwidth tracks rapid changes; a 24h bandwidth gives a broad global shape

**Avoid it when:**

- The series is very short (fewer than 5–10 points) — local regression needs enough neighbors to be meaningful
- You need a mathematically interpretable output; LOWESS is empirical and does not produce slope or intercept values

---

### Rate of change

Computes the per-hour rate of change between each point and a lookback comparison. In point-to-point mode, each point is compared to the immediately preceding one. In windowed mode (e.g. 1h), each point is compared to the nearest point that is at least one window-width earlier.

**What it shows:** How fast the value is changing, expressed in units per hour. A flat original series produces a rate near zero. A sharp spike appears as a large positive or negative value.

**Use it when:**

- You want to confirm whether a temperature is rising or falling fast enough to be significant
- You are investigating an abrupt event — an open window, a power surge, a pump starting — that shows up as a spike in rate of change
- You are comparing rate-of-change between two periods to detect whether the dynamics have changed (e.g. heating slower than it used to be)
- Point-to-point mode is useful for fine-grained detection; windowed mode reduces noise from rapid oscillations

**Avoid it when:** The sensor updates irregularly or has long gaps — rate of change over a large gap can produce misleadingly large or small values. Use a windowed mode with a window wider than typical gaps to reduce this.

---

## Anomaly detection

Anomaly detection helps you spot suspicious patterns in time series without having to inspect every line manually. Results are computed by the backend and rendered as highlighted regions in the chart.

### What anomaly detection helps you find

- stuck or flat-lined sensors
- sudden spikes and drops
- values drifting away from their normal trend
- unusual rate-of-change behavior
- differences between the current period and a known-good date window
- suspicious clusters of events or repeated abnormal periods

### Available methods

| Method                    | What it detects                                                           |
| ------------------------- | ------------------------------------------------------------------------- |
| Trend deviation           | Points that deviate significantly from a fitted trend line.               |
| Sudden change             | Unusually fast rises or drops compared to the typical rate of change.     |
| Statistical outlier (IQR) | Values far outside the interquartile range of the series.                 |
| Rolling Z-score           | Readings unusual relative to a rolling mean and standard deviation.       |
| Flat-line / stuck value   | A sensor reporting nearly the same value for an unusually long time.      |
| Comparison window         | Differences between the current period and a saved reference date window. |

### How to enable anomaly detection

1. Open the history page or history card.
2. Add one or more target entities.
3. Expand a target row's analysis options.
4. Enable **Show anomalies** for that target.
5. Choose one or more anomaly methods.
6. Tune sensitivity and method-specific windows.
7. Hover highlighted regions and compare them with datapoints and related context.

### Practical workflow

For a single series:

1. Start with one visible target.
2. Enable **Trend deviation** or **Rolling Z-score** first.
3. Add **Flat-line** if you suspect the sensor stopped updating.
4. Use **Sudden change** for abrupt transitions such as open windows or sudden heating.
5. Add a date window from a known-good period if you want to compare behavior against a baseline.
6. If multiple targets are visible, switch to split rows to reduce visual density.

### Example use cases

#### Detect a stuck sensor

Use:

- Flat-line / stuck value
- medium or high sensitivity
- a window that matches the expected update cadence

Useful for room temperature sensors, humidity sensors, and power sensors that silently stop updating.

#### Investigate abnormal heating behavior

Use:

- Comparison window against a normal day or week
- Threshold and trend analysis alongside anomalies

Useful for rooms that heat too slowly, delayed radiator response, or unexplained overnight heating.

#### Find unusual environmental spikes

Use:

- Rolling Z-score
- Sudden change

Useful for windows opening, hot water usage spikes, unexpected ventilation events, and sensor glitches.

### Reading anomaly output effectively

Anomaly markers are most useful when paired with datapoints that explain likely causes.

For example:

- `Boiler serviced`
- `Window left open`
- `Heating mode changed`
- `Fan speed manually increased`
- `Dehumidifier moved`

The ideal workflow is:

1. Let anomaly detection tell you where to look.
2. Use datapoints to record likely causes.
3. Compare against date windows to see whether the anomaly is new or expected.

That turns anomalies from a visual warning into an actionable investigative tool.

---

## Anomaly trend override

When **Trend deviation** is enabled, it uses the same trend method as the chart display by default. You can override this independently — for example to detect trend-deviation anomalies using LOWESS while the chart itself shows a linear trend. The override is set in the trend method subopts within the anomaly panel.

The "Same as display trend" option is only available when trend lines are enabled for the series.
