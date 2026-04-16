/**
 * Pure series-row utilities extracted from datapoints.ts.
 *
 * All functions are stateless data transformations with no DOM dependency.
 */

import {
  type HistorySeriesAnalysis,
  normalizeHistorySeriesRows,
} from "@/lib/domain/history-series";

// ── Types ──────────────────────────────────────────────────────────────────

interface SeriesRow {
  entity_id: string;
  color: string;
  visible: boolean;
  analysis: HistorySeriesAnalysis;
}

// ── Merge saved series rows ────────────────────────────────────────────────

export function mergeSavedSeriesRows(
  rows: unknown,
  savedRows: unknown
): SeriesRow[] {
  const normalizedRows = normalizeHistorySeriesRows(rows);
  const normalizedSavedRows = normalizeHistorySeriesRows(savedRows);
  if (!normalizedSavedRows.length) {
    return normalizedRows;
  }
  const savedRowMap = new Map(
    normalizedSavedRows.map((row) => [row.entity_id, row])
  );
  return normalizedRows.map((row) => {
    const savedRow = savedRowMap.get(row.entity_id);
    if (!savedRow) {
      return row;
    }
    return {
      ...row,
      color: savedRow.color,
      visible: savedRow.visible,
      analysis: savedRow.analysis,
    };
  });
}
