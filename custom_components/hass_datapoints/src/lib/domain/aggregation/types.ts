export const AGGREGATE_OPERATIONS = [
  "mean",
  "min",
  "max",
  "median",
  "first",
  "last",
  "consumption",
  "transition_count",
  "state_duration",
  "state_percentage",
  "event_count",
] as const;
export type AggregateOperation = (typeof AGGREGATE_OPERATIONS)[number];
export const AGGREGATE_INTERVALS = [
  "minute",
  "15min",
  "30min",
  "hour",
  "day",
  "week",
  "month",
] as const;
export type AggregateInterval = (typeof AGGREGATE_INTERVALS)[number];
export interface AggregateDefinition {
  id: string;
  operation: AggregateOperation;
  interval: AggregateInterval;
  mode: "interval" | "cumulative";
  states?: string[];
  eventTypes?: string[];
  resetOnZoom: boolean;
  color?: string;
  visible?: boolean;
  label?: string;
}
export interface AggregateSample {
  time: number;
  state?: string;
  value?: number | null;
  eventType?: string;
  eventTime?: number;
  sum?: number | null;
  /** Consumption already computed by HA statistics for the period starting at `time`. */
  change?: number | null;
  lastReset?: number;
  boundary?: boolean;
}
export interface AggregateRange {
  start: number;
  end: number;
}
export interface AggregateInput {
  definition: AggregateDefinition;
  samples: AggregateSample[];
  range: AggregateRange;
  zoom?: AggregateRange;
  timeZone: string;
  stateClass?: string;
  unit?: string;
  coverage?: AggregateRange[];
}
export interface AggregatePeriod extends AggregateRange {
  periodStart: number;
  periodEnd: number;
  partial: boolean;
}
export interface AggregatePoint extends AggregatePeriod {
  time: number;
  value: number | null;
  incomplete: boolean;
  knownDuration: number;
  totalDuration: number;
  reasons: string[];
}
export interface AggregateResult {
  points: AggregatePoint[];
  unit: string;
  presentation: "bar" | "line";
  baseline: number | null;
}
