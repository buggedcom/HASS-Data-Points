export type { Point, SummaryStats } from "./types";

export { getPersistenceWindowMs, getTrendWindowMs } from "./windows";
export {
  buildRollingAverageTrend,
  buildLinearTrend,
  interpolateSeriesValue,
  buildRateOfChangePoints,
  buildDeltaPoints,
} from "./series";
export { buildSummaryStats } from "./summary";
