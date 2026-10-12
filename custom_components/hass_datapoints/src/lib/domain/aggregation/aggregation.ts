import {
  AGGREGATE_OPERATIONS,
  type AggregateDefinition,
  type AggregateInput,
  type AggregateOperation,
  type AggregateResult,
} from "@/lib/domain/aggregation/types";

export function normalizeAggregateDefinitions(
  value: unknown
): AggregateDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids = new Set<string>();
  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !item.id ||
      ids.has(item.id) ||
      !AGGREGATE_OPERATIONS.includes(item.operation) ||
      !["hour", "day", "week", "month"].includes(item.interval)
    ) {
      return [];
    }
    ids.add(item.id);
    const definition: AggregateDefinition = {
      id: item.id,
      operation: item.operation,
      interval: item.interval,
      mode:
        item.mode === "cumulative" &&
        [
          "consumption",
          "transition_count",
          "state_duration",
          "event_count",
        ].includes(item.operation)
          ? "cumulative"
          : "interval",
      resetOnZoom: item.resetOnZoom === true,
    };
    for (const key of ["states", "eventTypes"] as const) {
      if (Array.isArray(item[key])) {
        definition[key] = [
          ...new Set<string>(
            item[key].filter(
              (v: unknown): v is string => typeof v === "string" && v.length > 0
            )
          ),
        ];
      }
    }
    for (const key of ["color", "label"] as const) {
      if (typeof item[key] === "string") {
        definition[key] = item[key];
      }
    }
    if (typeof item.visible === "boolean") {
      definition.visible = item.visible;
    }
    return [definition];
  });
}
export function getAggregateOperations(entity: {
  entity_id: string;
  state?: string;
  attributes?: Record<string, unknown>;
}): AggregateOperation[] {
  if (entity.entity_id.startsWith("event.")) {
    return ["event_count"];
  }
  if (
    entity.entity_id.startsWith("binary_sensor.") ||
    (entity.state !== undefined &&
      !["unknown", "unavailable"].includes(entity.state) &&
      !Number.isFinite(Number(entity.state)))
  ) {
    return ["transition_count", "state_duration", "state_percentage"];
  }
  const operations: AggregateOperation[] = [
    "mean",
    "min",
    "max",
    "median",
    "first",
    "last",
  ];
  if (
    ["total", "total_increasing"].includes(
      String(entity.attributes?.state_class)
    )
  ) {
    operations.push("consumption");
  }
  return operations;
}
export function calculateAggregate(input: AggregateInput): AggregateResult {
  const values = input.samples
    .map((s) => s.value)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return {
    points: [
      {
        time: input.range.start,
        value: values.reduce((s, v) => s + v, 0) / values.length,
        periodStart: input.range.start,
        periodEnd: input.range.end,
        start: input.range.start,
        end: input.range.end,
        partial: false,
        incomplete: false,
        knownDuration: input.range.end - input.range.start,
        totalDuration: input.range.end - input.range.start,
        reasons: [],
      },
    ],
    unit: input.unit ?? "",
    presentation: "line",
    baseline: null,
  };
}
