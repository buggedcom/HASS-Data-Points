import type {
  AggregateDefinition,
  AggregateInterval,
  AggregateOperation,
} from "@/lib/domain/aggregation/types";

export interface AggregateStateOption {
  /** Canonical HA state value, stored in the definition. */
  value: string;
  /** English label; localize with `msg()` at render time. */
  label: string;
}

/** Choices a user makes for a binary row; maps onto an operation + states. */
export type BinaryAggregateKind =
  | "transition_count"
  | "all_changes"
  | "state_duration"
  | "state_percentage";

export const BINARY_AGGREGATE_KINDS: {
  value: BinaryAggregateKind;
  label: string;
}[] = [
  { value: "transition_count", label: "Count changes to a state" },
  { value: "all_changes", label: "Count all state changes" },
  { value: "state_duration", label: "Time in a state" },
  { value: "state_percentage", label: "Percentage of time in a state" },
];

export const AGGREGATE_INTERVAL_OPTIONS: {
  value: AggregateInterval;
  label: string;
}[] = [
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

const STATE_LABELS: Record<string, [on: string, off: string]> = {
  door: ["Open", "Closed"],
  garage_door: ["Open", "Closed"],
  window: ["Open", "Closed"],
  opening: ["Open", "Closed"],
  motion: ["Detected", "Clear"],
  occupancy: ["Occupied", "Clear"],
  lock: ["Unlocked", "Locked"],
};

/** On/off options labelled for the entity's device class (e.g. Open/Closed). */
export function getBinaryStateOptions(
  deviceClass?: string
): AggregateStateOption[] {
  const [on, off] = STATE_LABELS[deviceClass ?? ""] ?? ["On", "Off"];
  return [
    { value: "on", label: on },
    { value: "off", label: off },
  ];
}

export function getBinaryAggregateKind(
  definition: AggregateDefinition
): BinaryAggregateKind {
  if (definition.operation === "transition_count") {
    return definition.states?.length ? "transition_count" : "all_changes";
  }
  return definition.operation === "state_percentage"
    ? "state_percentage"
    : "state_duration";
}

/** Apply a user-facing kind to a definition, keeping states consistent. */
export function applyBinaryAggregateKind(
  definition: AggregateDefinition,
  kind: BinaryAggregateKind,
  defaultState = "on"
): AggregateDefinition {
  const states = definition.states?.length ? definition.states : [defaultState];
  if (kind === "all_changes") {
    return { ...definition, operation: "transition_count", states: [] };
  }
  const operation = kind;
  // Cumulative is only valid for counts and durations.
  const mode = operation === "state_percentage" ? "interval" : definition.mode;
  return { ...definition, operation, mode, states };
}

export function createBinaryAggregate(
  existingIds: string[],
  defaultState = "on"
): AggregateDefinition {
  let id: string;
  do {
    id = `agg_${Math.random().toString(36).slice(2, 8)}`;
  } while (existingIds.includes(id));
  return {
    id,
    operation: "transition_count",
    interval: "day",
    mode: "interval",
    states: [defaultState],
    resetOnZoom: false,
  };
}

export const MEASUREMENT_OPERATIONS: {
  value: AggregateOperation;
  label: string;
}[] = [
  { value: "mean", label: "Mean" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "median", label: "Median" },
  { value: "first", label: "First reading" },
  { value: "last", label: "Last reading" },
];

/** Everything offered on a numeric row: measurement summaries plus consumption. */
export const NUMERIC_AGGREGATE_OPERATIONS: {
  value: AggregateOperation;
  label: string;
}[] = [
  ...MEASUREMENT_OPERATIONS,
  { value: "consumption", label: "Consumption" },
];

export function isNumericAggregateOperation(operation: string): boolean {
  return NUMERIC_AGGREGATE_OPERATIONS.some((o) => o.value === operation);
}

const MEASUREMENT_VALUES = new Set<string>(
  MEASUREMENT_OPERATIONS.map((o) => o.value)
);

export function isMeasurementOperation(operation: string): boolean {
  return MEASUREMENT_VALUES.has(operation);
}

export function createMeasurementAggregate(
  existingIds: string[],
  operation: AggregateOperation = "mean"
): AggregateDefinition {
  const base = createBinaryAggregate(existingIds);
  return { ...base, operation, states: undefined };
}

export function createEventAggregate(
  existingIds: string[],
  eventTypes: string[] = []
): AggregateDefinition {
  const base = createBinaryAggregate(existingIds);
  return {
    ...base,
    operation: "event_count",
    states: undefined,
    eventTypes,
  };
}
