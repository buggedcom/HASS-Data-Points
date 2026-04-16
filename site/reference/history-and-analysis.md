# History & analysis

## How hass_datapoints approaches analysis

The integration is built around “investigation primitives”:

- range selection (timeline slider)
- multi-target views (targets)
- comparisons (windows)
- context capture (annotations)

Together, these allow you to analyze without requiring a single “magic anomaly detector”.

## Typical analysis loop

1. Choose targets that represent the system outcome you care about.
2. Use the timeline slider to isolate the range where it changes.
3. Compare against “normal” windows.
4. Add targets that represent likely causes.
5. Annotate discoveries and interventions.

See: [/tutorials/anomalies](/tutorials/anomalies)
