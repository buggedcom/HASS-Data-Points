/**
 * Re-export chart-side history data helpers from the split history-data modules.
 */

export type {
  HaStateEntry,
  HaStatEntry,
  NormalisedState,
  Point,
  ValueExtent,
} from "./data/types.js";
export { SAMPLE_INTERVAL_MS, downsamplePts } from "./data/downsampling.js";
export { binaryOffLabel, binaryOnLabel } from "./data/binary-labels.js";
export {
  getHistoryStatesForEntity,
  normalizeBinaryHistory,
  normalizeNumericHistory,
} from "./data/history-normalization.js";
export {
  mergeNumericHistoryWithStatistics,
  normalizeStatisticsHistory,
} from "./data/statistics-normalization.js";
export { getAxisValueExtent } from "./data/axis-extent.js";
