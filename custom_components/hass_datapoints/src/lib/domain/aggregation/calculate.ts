import { getPeriods } from "@/lib/domain/aggregation/calendar";
import type {
  AggregateInput,
  AggregatePeriod,
  AggregatePoint,
  AggregateRange,
  AggregateResult,
  AggregateSample,
} from "@/lib/domain/aggregation/types";

const MINUTE_MS = 60000;
const UNKNOWN_STATES = new Set(["unknown", "unavailable"]);
const CUMULATIVE_OPERATIONS = new Set([
  "consumption",
  "transition_count",
  "state_duration",
  "event_count",
]);

interface StateSpan extends AggregateRange {
  state: string;
}

interface Bucket {
  value: number | null;
  reasons: string[];
}

function isKnownState(state: string | undefined): state is string {
  return typeof state === "string" && !UNKNOWN_STATES.has(state);
}

function overlap(a: AggregateRange, b: AggregateRange): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

function inPeriod(time: number, period: AggregatePeriod): boolean {
  return time >= period.start && time < period.end;
}

function sortSamples(samples: AggregateSample[]): AggregateSample[] {
  return [...samples].sort((a, b) => a.time - b.time);
}

function knownDurationOf(
  period: AggregatePeriod,
  coverage: AggregateRange[] | undefined
): number {
  if (!coverage) {
    return period.end - period.start;
  }
  return coverage.reduce((sum, c) => sum + overlap(period, c), 0);
}

/** Known-state spans over `range`, seeded by the last sample at/before start. */
function buildStateSpans(
  samples: AggregateSample[],
  range: AggregateRange,
  coverage: AggregateRange[] | undefined
): StateSpan[] {
  const stateful = sortSamples(samples).filter(
    (s) => typeof s.state === "string"
  );
  const points: { time: number; state: string }[] = [];
  let seed: { time: number; state: string } | undefined;
  for (const s of stateful) {
    if (s.time <= range.start) {
      seed = { time: range.start, state: s.state as string };
    } else if (s.time < range.end) {
      points.push({ time: s.time, state: s.state as string });
    }
  }
  if (seed) {
    points.unshift(seed);
  }
  const spans: StateSpan[] = [];
  points.forEach((point, i) => {
    if (!isKnownState(point.state)) {
      return;
    }
    const end = i + 1 < points.length ? points[i + 1].time : range.end;
    const span = { start: point.time, end, state: point.state };
    if (!coverage) {
      spans.push(span);
      return;
    }
    for (const c of coverage) {
      const start = Math.max(span.start, c.start);
      const clippedEnd = Math.min(span.end, c.end);
      if (clippedEnd > start) {
        spans.push({ start, end: clippedEnd, state: span.state });
      }
    }
  });
  return spans;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateMeasurement(
  input: AggregateInput,
  periods: AggregatePeriod[]
): Bucket[] {
  const readings = sortSamples(input.samples).filter(
    (s) =>
      !s.boundary && typeof s.value === "number" && Number.isFinite(s.value)
  );
  return periods.map((period) => {
    const values = readings
      .filter((s) => inPeriod(s.time, period))
      .map((s) => s.value as number);
    if (!values.length) {
      return { value: null, reasons: ["no-data"] };
    }
    const op = input.definition.operation;
    let value: number;
    if (op === "min") {
      value = Math.min(...values);
    } else if (op === "max") {
      value = Math.max(...values);
    } else if (op === "median") {
      value = median(values);
    } else if (op === "first") {
      value = values[0];
    } else if (op === "last") {
      value = values[values.length - 1];
    } else {
      value = values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    return { value, reasons: [] };
  });
}

function calculateTransitions(
  input: AggregateInput,
  periods: AggregatePeriod[]
): Bucket[] {
  const selected = input.definition.states ?? [];
  const stateful = sortSamples(input.samples).filter(
    (s) => typeof s.state === "string"
  );
  const times: number[] = [];
  stateful.forEach((curr, i) => {
    const prev = stateful[i - 1];
    if (
      !prev ||
      curr.time <= input.range.start ||
      curr.time >= input.range.end ||
      !isKnownState(prev.state) ||
      !isKnownState(curr.state) ||
      prev.state === curr.state ||
      (selected.length > 0 && !selected.includes(curr.state))
    ) {
      return;
    }
    times.push(curr.time);
  });
  return periods.map((period) => ({
    value: times.filter((t) => inPeriod(t, period)).length,
    reasons: [],
  }));
}

function calculateDurations(
  input: AggregateInput,
  periods: AggregatePeriod[],
  percentage: boolean
): Bucket[] {
  const selected = input.definition.states ?? [];
  if (!selected.length) {
    return periods.map(() => ({ value: null, reasons: ["no-state-selected"] }));
  }
  const spans = buildStateSpans(input.samples, input.range, input.coverage);
  return periods.map((period) => {
    let known = 0;
    let matching = 0;
    for (const span of spans) {
      const ms = overlap(period, span);
      known += ms;
      if (selected.includes(span.state)) {
        matching += ms;
      }
    }
    if (percentage) {
      return known > 0
        ? { value: (matching / known) * 100, reasons: [] }
        : { value: null, reasons: ["no-known-time"] };
    }
    return known > 0
      ? { value: matching / MINUTE_MS, reasons: [] }
      : { value: null, reasons: ["no-known-time"] };
  });
}

function calculateEvents(
  input: AggregateInput,
  periods: AggregatePeriod[]
): Bucket[] {
  const types = input.definition.eventTypes ?? [];
  const times = input.samples
    .filter(
      (s) =>
        !s.boundary &&
        typeof s.eventType === "string" &&
        (types.length === 0 || types.includes(s.eventType))
    )
    .map((s) => s.eventTime ?? s.time);
  return periods.map((period) => ({
    value: times.filter((t) => inPeriod(t, period)).length,
    reasons: [],
  }));
}

function calculateConsumption(
  input: AggregateInput,
  periods: AggregatePeriod[]
): Bucket[] {
  const deltas: { time: number; value: number; reason?: string }[] = [];
  // HA statistics supply per-period consumption directly (reset-aware).
  for (const s of input.samples) {
    if (
      typeof s.change === "number" &&
      Number.isFinite(s.change) &&
      s.time >= input.range.start &&
      s.time < input.range.end
    ) {
      deltas.push({ time: s.time, value: s.change });
    }
  }
  const readings = sortSamples(input.samples).filter((s) => {
    const v = s.sum ?? s.value;
    return (
      s.change === undefined && typeof v === "number" && Number.isFinite(v)
    );
  });
  readings.forEach((curr, i) => {
    const prev = readings[i - 1];
    if (
      !prev ||
      curr.time <= input.range.start ||
      curr.time >= input.range.end
    ) {
      return;
    }
    const usesSum =
      typeof curr.sum === "number" && typeof prev.sum === "number";
    const currValue = (usesSum ? curr.sum : curr.value) as number;
    const prevValue = (usesSum ? prev.sum : prev.value) as number;
    const delta = currValue - prevValue;
    if (usesSum || delta >= 0) {
      deltas.push({ time: curr.time, value: delta });
    } else if (
      input.stateClass === "total_increasing" ||
      (curr.lastReset !== undefined && curr.lastReset !== prev.lastReset)
    ) {
      deltas.push({ time: curr.time, value: currValue, reason: "reset" });
    } else if (input.stateClass === "total") {
      deltas.push({ time: curr.time, value: delta });
    } else {
      deltas.push({ time: curr.time, value: 0, reason: "ambiguous-reset" });
    }
  });
  return periods.map((period) => {
    const inside = deltas.filter((d) => inPeriod(d.time, period));
    if (!inside.length) {
      return { value: null, reasons: ["no-data"] };
    }
    return {
      value: inside.reduce((sum, d) => sum + d.value, 0),
      reasons: [
        ...new Set(inside.flatMap((d) => (d.reason ? [d.reason] : []))),
      ],
    };
  });
}

function toCumulative(
  operation: string,
  periods: AggregatePeriod[],
  buckets: Bucket[]
): { buckets: Bucket[]; periods: AggregatePeriod[]; started: boolean } {
  const startsAtZeroActivity = operation !== "consumption";
  let running = 0;
  let started = false;
  const keptBuckets: Bucket[] = [];
  const keptPeriods: AggregatePeriod[] = [];
  buckets.forEach((bucket, i) => {
    if (!started) {
      started =
        bucket.value !== null && (!startsAtZeroActivity || bucket.value > 0);
      if (!started) {
        return;
      }
    }
    running += bucket.value ?? 0;
    keptBuckets.push({ value: running, reasons: bucket.reasons });
    keptPeriods.push(periods[i]);
  });
  return { buckets: keptBuckets, periods: keptPeriods, started };
}

export function calculateAggregate(input: AggregateInput): AggregateResult {
  const { definition } = input;
  const cumulative =
    definition.mode === "cumulative" &&
    CUMULATIVE_OPERATIONS.has(definition.operation);
  if (cumulative && definition.resetOnZoom && input.zoom) {
    const start = Math.max(input.range.start, input.zoom.start);
    const end = Math.min(input.range.end, input.zoom.end);
    if (end > start) {
      return calculateAggregate({
        ...input,
        zoom: undefined,
        range: { start, end },
      });
    }
  }

  let periods = getPeriods(input.range, definition.interval, input.timeZone);
  const op = definition.operation;
  let buckets: Bucket[];
  let unit = input.unit ?? "";
  if (op === "transition_count") {
    buckets = calculateTransitions(input, periods);
    unit = "";
  } else if (op === "state_duration") {
    buckets = calculateDurations(input, periods, false);
    unit = "min";
  } else if (op === "state_percentage") {
    buckets = calculateDurations(input, periods, true);
    unit = "%";
  } else if (op === "event_count") {
    buckets = calculateEvents(input, periods);
    unit = "";
  } else if (op === "consumption") {
    buckets = calculateConsumption(input, periods);
  } else {
    buckets = calculateMeasurement(input, periods);
  }

  let started = true;
  if (cumulative) {
    const result = toCumulative(op, periods, buckets);
    ({ buckets, periods, started } = result);
  }

  const points: AggregatePoint[] = periods.map((period, i) => {
    const totalDuration = period.end - period.start;
    const knownDuration = knownDurationOf(period, input.coverage);
    const reasons = [...buckets[i].reasons];
    const incomplete = knownDuration < totalDuration;
    if (incomplete) {
      reasons.push("incomplete-coverage");
    }
    return {
      ...period,
      time: period.start,
      // Missing history is never reported as zero activity.
      value: knownDuration === 0 ? null : buckets[i].value,
      incomplete: incomplete || reasons.includes("no-data"),
      knownDuration,
      totalDuration,
      reasons,
    };
  });

  const isBar =
    !cumulative &&
    !["mean", "min", "max", "median", "first", "last"].includes(op);
  return {
    points,
    unit,
    presentation: isBar ? "bar" : "line",
    baseline: cumulative && started && points.length ? 0 : null,
  };
}
