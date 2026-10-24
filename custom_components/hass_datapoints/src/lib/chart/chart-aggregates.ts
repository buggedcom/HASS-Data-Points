import { msg } from "@/lib/i18n/localize";
import { calculateAggregate } from "@/lib/domain/aggregation/calculate";
import {
  AGGREGATE_INTERVAL_OPTIONS,
  BINARY_AGGREGATE_KINDS,
  getBinaryAggregateKind,
  getBinaryStateOptions,
  MEASUREMENT_OPERATIONS,
  isMeasurementOperation,
} from "@/lib/domain/aggregation/labels";
import type { HaStateEntry } from "@/cards/history/data/types";
import type { StatisticsChangeEntry } from "@/cards/history/data/statistics-normalization";
import type {
  AggregateDefinition,
  AggregateRange,
  AggregateResult,
  AggregateSample,
} from "@/lib/domain/aggregation/types";

const UNKNOWN_STATES = new Set(["unknown", "unavailable"]);

/** A derived series ready to be drawn by the history chart. */
export interface AggregateChartSeries {
  entityId: string;
  legendEntityId: string;
  sourceEntityId: string;
  definitionId: string;
  label: string;
  unit: string;
  pts: [number, number][];
  /** Calendar period behind each point, aligned with `pts`. */
  periods: { start: number; end: number }[];
  /** Localized caveats per point (e.g. a detected meter reset), aligned with `pts`. */
  periodNotes?: string[];
  /** Per-point coverage: edge-clipped (partial) vs gaps in history (incomplete). */
  periodFlags?: { partial: boolean; incomplete: boolean }[];
  color: string;
  axisKey: string;
  bars: boolean;
  result: AggregateResult;
}

export interface BuildBinaryAggregateSeriesArgs {
  entityId: string;
  entityLabel: string;
  color: string;
  deviceClass?: string;
  definitions: AggregateDefinition[];
  /** Recorded states; `lu` is the last-updated time in seconds. */
  stateList: { s: string; lu: number }[];
  range: AggregateRange;
  /** Visible zoom window; only used by cumulative series that reset on zoom. */
  zoom?: AggregateRange;
  timeZone: string;
}

/** Append the cumulative marker so the legend tells totals from per-period bars. */
function withCumulativeSuffix(
  definition: AggregateDefinition,
  label: string
): string {
  return definition.mode === "cumulative"
    ? `${label} · ${msg("Cumulative")}`
    : label;
}

interface ValuedPoint {
  partial: boolean;
  incomplete: boolean;
  reasons: string[];
}

/** Coverage flags and tooltip notes for each plotted period. */
function periodDetails(
  valued: ValuedPoint[],
  reasonNotes?: (reasons: string[]) => string
) {
  return {
    periodFlags: valued.map((p) => ({
      partial: p.partial,
      incomplete: p.incomplete,
    })),
    periodNotes: valued.map((p) =>
      [
        p.partial ? msg("Partial period") : "",
        p.incomplete ? msg("Incomplete history") : "",
        reasonNotes ? reasonNotes(p.reasons) : "",
      ]
        .filter(Boolean)
        .join(", ")
    ),
  };
}

export function getAggregateSeriesId(
  entityId: string,
  definitionId: string
): string {
  return `aggregate:${entityId}:${definitionId}`;
}

/** Spans where a known (not unknown/unavailable) state was recorded. */
function buildCoverage(
  samples: AggregateSample[],
  range: AggregateRange
): AggregateRange[] {
  const sorted = [...samples].sort((a, b) => a.time - b.time);
  const coverage: AggregateRange[] = [];
  let seed: AggregateSample | undefined;
  const inRange: AggregateSample[] = [];
  for (const sample of sorted) {
    if (sample.time <= range.start) {
      seed = sample;
    } else if (sample.time < range.end) {
      inRange.push(sample);
    }
  }
  const points = seed ? [{ ...seed, time: range.start }, ...inRange] : inRange;
  points.forEach((point, i) => {
    if (!point.state || UNKNOWN_STATES.has(point.state)) {
      return;
    }
    const end = i + 1 < points.length ? points[i + 1].time : range.end;
    if (end > point.time) {
      coverage.push({ start: point.time, end });
    }
  });
  return coverage;
}

function describe(definition: AggregateDefinition, stateLabel: string): string {
  const kind = getBinaryAggregateKind(definition);
  const kindLabel = msg(
    BINARY_AGGREGATE_KINDS.find((k) => k.value === kind)?.label ?? kind
  );
  const intervalLabel = msg(
    AGGREGATE_INTERVAL_OPTIONS.find((o) => o.value === definition.interval)
      ?.label ?? definition.interval
  );
  const suffix = kind === "all_changes" ? "" : ` (${stateLabel})`;
  return `${intervalLabel} · ${kindLabel}${suffix}`;
}

/**
 * Calculate every configured aggregate for a binary row and shape the results
 * as chart series. Periods with no known history have no bar (never zero).
 */
export function buildBinaryAggregateSeries(
  args: BuildBinaryAggregateSeriesArgs
): AggregateChartSeries[] {
  const samples: AggregateSample[] = args.stateList.map((entry) => ({
    time: Math.round(entry.lu * 1000),
    state: entry.s,
  }));
  const coverage = buildCoverage(samples, args.range);
  const stateOptions = getBinaryStateOptions(args.deviceClass);
  return args.definitions
    .filter((definition) => definition.visible !== false)
    .flatMap((definition) => {
      const result = calculateAggregate({
        definition,
        samples,
        range: args.range,
        zoom: args.zoom,
        timeZone: args.timeZone,
        coverage,
      });
      const valued = result.points.filter(
        (p): p is typeof p & { value: number } =>
          typeof p.value === "number" && Number.isFinite(p.value)
      );
      const pts = valued.map((p): [number, number] => [
        (p.start + p.end) / 2,
        p.value,
      ]);
      if (!pts.length) {
        return [];
      }
      const stateValue = definition.states?.[0] ?? stateOptions[0].value;
      const stateLabel = msg(
        stateOptions.find((o) => o.value === stateValue)?.label ?? stateValue
      );
      const id = getAggregateSeriesId(args.entityId, definition.id);
      return [
        {
          entityId: id,
          legendEntityId: id,
          sourceEntityId: args.entityId,
          definitionId: definition.id,
          label:
            definition.label ||
            withCumulativeSuffix(
              definition,
              `${args.entityLabel} · ${describe(definition, stateLabel)}`
            ),
          unit: result.unit,
          pts,
          periods: valued.map((p) => ({ start: p.start, end: p.end })),
          ...periodDetails(valued),
          color: definition.color || args.color,
          axisKey: `aggregate:${result.unit || "count"}`,
          bars: result.presentation === "bar",
          result,
        },
      ];
    });
}

export interface BuildMeasurementAggregateSeriesArgs {
  entityId: string;
  entityLabel: string;
  /** Colours cycled across this row's aggregates so they differ from the source line. */
  colors: string[];
  definitions: AggregateDefinition[];
  stateList: { s: string; lu: number }[];
  range: AggregateRange;
  /** Visible zoom window; only used by cumulative series that reset on zoom. */
  zoom?: AggregateRange;
  timeZone: string;
  unit: string;
  /** Value axis shared with the source row (same unit). */
  axisKey: string;
}

/** Aggregate numeric history into per-period measurement summaries (lines). */
export function buildMeasurementAggregateSeries(
  args: BuildMeasurementAggregateSeriesArgs
): AggregateChartSeries[] {
  const samples: AggregateSample[] = args.stateList.flatMap((entry) => {
    const value = parseFloat(entry.s);
    return Number.isNaN(value)
      ? []
      : [{ time: Math.round(entry.lu * 1000), value }];
  });
  if (!samples.length) {
    return [];
  }
  return args.definitions
    .filter(
      (definition) =>
        definition.visible !== false &&
        isMeasurementOperation(definition.operation)
    )
    .flatMap((definition, index) => {
      const result = calculateAggregate({
        definition,
        samples,
        range: args.range,
        zoom: args.zoom,
        timeZone: args.timeZone,
        unit: args.unit,
        coverage: [args.range],
      });
      const valued = result.points.filter(
        (p): p is typeof p & { value: number } =>
          typeof p.value === "number" && Number.isFinite(p.value)
      );
      if (!valued.length) {
        return [];
      }
      const operationLabel = msg(
        MEASUREMENT_OPERATIONS.find((o) => o.value === definition.operation)
          ?.label ?? definition.operation
      );
      const intervalLabel = msg(
        AGGREGATE_INTERVAL_OPTIONS.find((o) => o.value === definition.interval)
          ?.label ?? definition.interval
      );
      const id = getAggregateSeriesId(args.entityId, definition.id);
      return [
        {
          entityId: id,
          legendEntityId: id,
          sourceEntityId: args.entityId,
          definitionId: definition.id,
          label:
            definition.label ||
            withCumulativeSuffix(
              definition,
              `${args.entityLabel} · ${intervalLabel} · ${operationLabel}`
            ),
          unit: args.unit,
          pts: valued.map((p): [number, number] => [
            (p.start + p.end) / 2,
            p.value,
          ]),
          periods: valued.map((p) => ({ start: p.start, end: p.end })),
          ...periodDetails(valued),
          color: definition.color || args.colors[index % args.colors.length],
          axisKey: args.axisKey,
          bars: result.presentation === "bar",
          result,
        },
      ];
    });
}

export interface BuildEventAggregateSeriesArgs {
  entityId: string;
  entityLabel: string;
  color: string;
  definitions: AggregateDefinition[];
  /** Raw history states for the event entity, requested with attributes. */
  states: HaStateEntry[];
  range: AggregateRange;
  /** Visible zoom window; only used by cumulative series that reset on zoom. */
  zoom?: AggregateRange;
  timeZone: string;
}

/**
 * Turn an event entity's recorded states into occurrences. The state value is
 * the event timestamp and `event_type` is an attribute. States at or before the
 * range start are the initial snapshot, not events that happened in range.
 */
export function extractEventSamples(
  states: HaStateEntry[],
  range: AggregateRange
): AggregateSample[] {
  return states.flatMap((entry): AggregateSample[] => {
    const raw = entry.s ?? entry.state;
    if (raw === undefined || UNKNOWN_STATES.has(raw)) {
      return [];
    }
    const attributes = entry.a ?? entry.attributes;
    const eventType = attributes?.event_type;
    if (typeof eventType !== "string" || !eventType) {
      return [];
    }
    const recordedAt =
      typeof entry.lu === "number"
        ? entry.lu * 1000
        : Date.parse(entry.last_updated ?? "");
    const parsed = Date.parse(raw);
    const eventTime = Number.isFinite(parsed) ? parsed : recordedAt;
    if (!Number.isFinite(eventTime)) {
      return [];
    }
    return [
      {
        time: Number.isFinite(recordedAt) ? recordedAt : eventTime,
        eventTime,
        eventType,
        boundary: Number.isFinite(recordedAt) && recordedAt <= range.start,
      },
    ];
  });
}

/** Count event occurrences per calendar period as bars (or cumulative lines). */
export function buildEventAggregateSeries(
  args: BuildEventAggregateSeriesArgs
): AggregateChartSeries[] {
  if (!args.states.length) {
    return [];
  }
  const samples = extractEventSamples(args.states, args.range);
  return args.definitions
    .filter(
      (definition) =>
        definition.visible !== false && definition.operation === "event_count"
    )
    .flatMap((definition) => {
      const result = calculateAggregate({
        definition,
        samples,
        range: args.range,
        zoom: args.zoom,
        timeZone: args.timeZone,
        coverage: [args.range],
      });
      const valued = result.points.filter(
        (p): p is typeof p & { value: number } =>
          typeof p.value === "number" && Number.isFinite(p.value)
      );
      if (!valued.length) {
        return [];
      }
      const intervalLabel = msg(
        AGGREGATE_INTERVAL_OPTIONS.find((o) => o.value === definition.interval)
          ?.label ?? definition.interval
      );
      const typesLabel = definition.eventTypes?.length
        ? definition.eventTypes.join(", ")
        : msg("All event types");
      const id = getAggregateSeriesId(args.entityId, definition.id);
      return [
        {
          entityId: id,
          legendEntityId: id,
          sourceEntityId: args.entityId,
          definitionId: definition.id,
          label:
            definition.label ||
            withCumulativeSuffix(
              definition,
              `${args.entityLabel} · ${intervalLabel} · ${typesLabel}`
            ),
          unit: result.unit,
          pts: valued.map((p): [number, number] => [
            (p.start + p.end) / 2,
            p.value,
          ]),
          periods: valued.map((p) => ({ start: p.start, end: p.end })),
          ...periodDetails(valued),
          color: definition.color || args.color,
          axisKey: `aggregate:${result.unit || "count"}`,
          bars: result.presentation === "bar",
          result,
        },
      ];
    });
}

export interface BuildConsumptionAggregateSeriesArgs {
  entityId: string;
  entityLabel: string;
  color: string;
  definitions: AggregateDefinition[];
  /** Per-period consumption from HA cumulative statistics (preferred). */
  changes: StatisticsChangeEntry[];
  /** Raw meter readings from history; bridges the period statistics lack. */
  readings: { s: string; lu: number }[];
  stateClass?: string;
  unit: string;
  range: AggregateRange;
  /** Visible zoom window; only used by cumulative series that reset on zoom. */
  zoom?: AggregateRange;
  timeZone: string;
}

const STATISTICS_PERIOD_MS = 3600000;

function describeConsumptionReasons(reasons: string[]): string {
  const notes: string[] = [];
  if (reasons.includes("reset")) {
    notes.push(msg("Meter reset detected"));
  }
  if (reasons.includes("ambiguous-reset")) {
    notes.push(msg("Ambiguous meter reset, not counted"));
  }
  return notes.join(", ");
}

/**
 * Consumption per period for total / total_increasing meters. Statistics
 * `change` is used where HA has compiled it; raw readings cover the rest.
 */
export function buildConsumptionAggregateSeries(
  args: BuildConsumptionAggregateSeriesArgs
): AggregateChartSeries[] {
  const readings: AggregateSample[] = args.readings.flatMap((entry) => {
    const value = parseFloat(entry.s);
    return Number.isNaN(value)
      ? []
      : [{ time: Math.round(entry.lu * 1000), value }];
  });
  const changeSamples: AggregateSample[] = args.changes.map((entry) => ({
    time: entry.time,
    change: entry.change,
  }));
  let samples: AggregateSample[];
  if (changeSamples.length) {
    const cutoff =
      changeSamples[changeSamples.length - 1].time + STATISTICS_PERIOD_MS;
    const before = readings.filter((r) => r.time < cutoff);
    const seed = before[before.length - 1];
    samples = [
      ...changeSamples,
      ...(seed ? [seed] : []),
      ...readings.filter((r) => r.time >= cutoff),
    ];
  } else {
    samples = readings;
  }
  if (!samples.length) {
    return [];
  }
  return args.definitions
    .filter(
      (definition) =>
        definition.visible !== false && definition.operation === "consumption"
    )
    .flatMap((definition) => {
      const result = calculateAggregate({
        definition,
        samples,
        range: args.range,
        zoom: args.zoom,
        timeZone: args.timeZone,
        stateClass: args.stateClass,
        unit: args.unit,
        coverage: [args.range],
      });
      const valued = result.points.filter(
        (p): p is typeof p & { value: number } =>
          typeof p.value === "number" && Number.isFinite(p.value)
      );
      if (!valued.length) {
        return [];
      }
      const intervalLabel = msg(
        AGGREGATE_INTERVAL_OPTIONS.find((o) => o.value === definition.interval)
          ?.label ?? definition.interval
      );
      const id = getAggregateSeriesId(args.entityId, definition.id);
      return [
        {
          entityId: id,
          legendEntityId: id,
          sourceEntityId: args.entityId,
          definitionId: definition.id,
          label:
            definition.label ||
            withCumulativeSuffix(
              definition,
              `${args.entityLabel} · ${intervalLabel} · ${msg("Consumption")}`
            ),
          unit: args.unit,
          pts: valued.map((p): [number, number] => [
            (p.start + p.end) / 2,
            p.value,
          ]),
          periods: valued.map((p) => ({ start: p.start, end: p.end })),
          ...periodDetails(valued, describeConsumptionReasons),
          color: definition.color || args.color,
          axisKey: `aggregate:${args.unit || "count"}`,
          bars: result.presentation === "bar",
          result,
        },
      ];
    });
}
