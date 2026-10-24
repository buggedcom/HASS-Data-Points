import { msg } from "@/lib/i18n/localize";
import { calculateAggregate } from "@/lib/domain/aggregation/calculate";
import {
  AGGREGATE_INTERVAL_OPTIONS,
  BINARY_AGGREGATE_KINDS,
  getBinaryAggregateKind,
  getBinaryStateOptions,
} from "@/lib/domain/aggregation/labels";
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
  color: string;
  axisKey: string;
  bars: true;
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
  timeZone: string;
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
            `${args.entityLabel} · ${describe(definition, stateLabel)}`,
          unit: result.unit,
          pts,
          periods: valued.map((p) => ({ start: p.start, end: p.end })),
          color: definition.color || args.color,
          axisKey: `aggregate:${result.unit || "count"}`,
          bars: true as const,
          result,
        },
      ];
    });
}
