import type { HaStatEntry, NormalisedState } from "./types";

/**
 * Normalises statistics data from the HA statistics API for a single entity
 * into a sorted array of `{ lu, s }` records.
 */
export function normalizeStatisticsHistory(
  entityId: string,
  statsData: unknown
): NormalisedState[] {
  const statEntries =
    statsData && typeof statsData === "object"
      ? ((statsData as RecordWithUnknownValues)[entityId] ?? [])
      : [];
  return (Array.isArray(statEntries) ? (statEntries as HaStatEntry[]) : [])
    .map((entry) => {
      const value = Number(entry?.mean);
      if (!Number.isFinite(value)) {
        return null;
      }
      const rawTimestamp = entry?.start;
      let timestamp: number;
      if (typeof rawTimestamp === "number") {
        if (rawTimestamp > 1e11) {
          timestamp = rawTimestamp;
        } else {
          timestamp = rawTimestamp * 1000;
        }
      } else {
        timestamp = new Date(rawTimestamp as string).getTime();
      }
      if (!Number.isFinite(timestamp)) {
        return null;
      }
      return {
        lu: Math.round(timestamp) / 1000,
        s: String(value),
      };
    })
    .filter((entry): entry is NormalisedState => entry !== null)
    .sort((a, b) => a.lu - b.lu);
}

/**
 * Merges a raw (high-resolution) history point list with a statistics
 * (long-term) point list, preferring raw data for the period it covers and
 * filling in statistics data outside that period.
 */
export function mergeNumericHistoryWithStatistics(
  histPts: NormalisedState[],
  statsPts: NormalisedState[]
): NormalisedState[] {
  const raw = Array.isArray(histPts) ? histPts : [];
  const stats = Array.isArray(statsPts) ? statsPts : [];
  if (!raw.length) {
    return [...stats];
  }
  if (!stats.length) {
    return [...raw];
  }

  const firstRawMs = raw[0].lu * 1000;
  const lastRawMs = raw[raw.length - 1].lu * 1000;
  const merged = [
    ...stats.filter((entry) => {
      const timeMs = entry.lu * 1000;
      return timeMs < firstRawMs || timeMs > lastRawMs;
    }),
    ...raw,
  ];
  merged.sort((a, b) => a.lu - b.lu);
  return merged;
}

export interface StatisticsChangeEntry {
  /** Start of the statistics period, in ms. */
  time: number;
  /** Consumption during the period (HA `change`). */
  change: number;
}

/**
 * Per-period consumption from HA cumulative statistics (`change`). Entities
 * without cumulative statistics yield an empty list.
 */
export function normalizeStatisticsChanges(
  entityId: string,
  statsData: unknown
): StatisticsChangeEntry[] {
  const statEntries =
    statsData && typeof statsData === "object"
      ? ((statsData as RecordWithUnknownValues)[entityId] ?? [])
      : [];
  return (Array.isArray(statEntries) ? (statEntries as HaStatEntry[]) : [])
    .flatMap((entry) => {
      const change = Number(entry?.change);
      const raw = entry?.start;
      let time: number;
      if (typeof raw === "number") {
        time = raw > 1e11 ? raw : raw * 1000;
      } else {
        time = new Date(raw as string).getTime();
      }
      return entry?.change == null ||
        !Number.isFinite(change) ||
        !Number.isFinite(time)
        ? []
        : [{ time: Math.round(time), change }];
    })
    .sort((a, b) => a.time - b.time);
}
