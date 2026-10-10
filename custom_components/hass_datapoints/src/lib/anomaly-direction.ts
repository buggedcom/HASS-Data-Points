/**
 * Shared per-method anomaly direction vocabulary (#62).
 *
 * The backend (const.py) mirrors these values: VALID_ANOMALY_DIRECTIONS and
 * DEFAULT_ANOMALY_DIRECTION. "up" keeps above-baseline points (residual > 0),
 * "down" keeps below-baseline points (residual < 0), "both" keeps everything.
 */

export type AnomalyDirection = "both" | "up" | "down";

export const DEFAULT_ANOMALY_DIRECTION: AnomalyDirection = "both";

/** Narrow an unknown value to a valid direction, defaulting to "both". */
export function coerceAnomalyDirection(value: unknown): AnomalyDirection {
  return value === "up" || value === "down" ? value : DEFAULT_ANOMALY_DIRECTION;
}
