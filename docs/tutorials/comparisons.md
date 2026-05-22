# Comparisons & Windows

## Why comparisons reduce false alarms

Many “anomalies” are normal when compared correctly:

- weekends vs weekdays
- seasonal shifts
- “someone is home” vs “away”

Comparison windows help you answer: “is this different from normal?”

<div class="dp-placeholder">
  <strong>Screenshot placeholder:</strong> comparison tabs/windows UI.
</div>

## Workflow: verify “today looks wrong”

1. Select the range where you think the behavior is wrong.
2. Enable a comparison window that represents normal:
   - same weekday last week
   - yesterday
   - last 24 hours vs previous 24 hours
3. Check whether:
   - timing changed (shifted earlier/later)
   - amplitude changed (higher/lower)
   - duration changed (longer/shorter)
4. If it is genuinely different, add an annotation explaining what is different.

## Tip: compare correlated signals too

If temperature looks wrong, compare HVAC state and outdoor temperature at the same time window.
