/**
 * Pure data preparation utilities extracted from history-chart.ts.
 *
 * All functions are stateless data transformations with no DOM dependency.
 */

import {
  getHistoryStatesForEntity,
  mergeNumericHistoryWithStatistics,
  normalizeBinaryHistory,
  normalizeNumericHistory,
  normalizeStatisticsHistory,
} from "@/cards/history/history-data";
import type { BinaryDisplayMode } from "@/lib/domain/history-series";

// ── Build binary state spans ────────────────────────────────────────────────

export function buildBinaryStateSpans(
  stateList: Array<{ lu: number; s: string }>,
  t0: number,
  t1: number
): Array<{ start: number; end: number; state: string }> {
  const spans: Array<{ start: number; end: number; state: string }> = [];
  if (!stateList.length) return spans;
  let current = stateList[0];
  for (let i = 1; i < stateList.length; i++) {
    const next = stateList[i];
    const start = Math.max(current.lu * 1000, t0);
    const end = Math.min(next.lu * 1000, t1);
    if (end > start) {
      spans.push({ start, end, state: current.s });
    }
    current = next;
  }
  // Last span extends to t1
  const lastStart = Math.max(current.lu * 1000, t0);
  if (t1 > lastStart) {
    spans.push({ start: lastStart, end: t1, state: current.s });
  }
  return spans;
}

// ── Binary render model ──────────────────────────────────────────────────────

/** A single on/off interval produced by {@link buildBinaryStateSpans}. */
export interface BinaryStateSpan {
  start: number;
  end: number;
  state: string;
}

/**
 * Fields shared by every resolved binary-sensor model: the entity, its legend
 * label, series colour and device-class on/off wording. Labels and colour are
 * resolved against live `hass` state upstream, so this layer stays pure and
 * canvas-free.
 */
export interface BinarySensorBase {
  entityId: string;
  label: string;
  color: string;
  onLabel: string;
  offLabel: string;
}

/** A binary sensor with its display settings and raw state list resolved. */
export interface BinaryRenderEntity extends BinarySensorBase {
  /** Absence (or any value other than `"row"`) is treated as `"background"`. */
  binaryDisplay?: BinaryDisplayMode;
  stateList: Array<{ lu: number; s: string }>;
}

/** A background-mode binary sensor: `spans` are the on-only windows to shade. */
export interface BinaryBackgroundModel extends BinarySensorBase {
  /** On-only projected spans (literal `state === "on"`); may be empty. */
  spans: BinaryStateSpan[];
}

/** A row-mode binary sensor: `spans` are the full on+off strip for its lane. */
export interface BinaryRowModel extends BinarySensorBase {
  /** Full on+off spans for the lane strip. */
  spans: BinaryStateSpan[];
  /** Deterministic lane position, assigned in input order (0-based). */
  laneIndex: number;
}

export interface BinaryRenderModel {
  backgrounds: BinaryBackgroundModel[];
  rows: BinaryRowModel[];
}

/**
 * Classifies resolved binary sensors into background-mode and row-mode render
 * models for the given `[t0, t1]` window.
 *
 * - Background sensors carry an **on-only** span projection (literal
 *   `state === "on"`); off/unavailable/unknown windows are never shaded. This
 *   is the fix for the whole-plot wash reported in #61/#64.
 * - Row sensors carry the **full** on+off spans plus a deterministic
 *   `laneIndex` assigned in input order.
 *
 * A sensor with no spans in the window (no data) contributes neither a
 * background nor a lane. A sensor that is present but never "on" is still
 * represented (with zero on-spans) so a legend entry remains possible.
 */
export function buildBinaryRenderModel(
  entities: BinaryRenderEntity[],
  t0: number,
  t1: number
): BinaryRenderModel {
  const backgrounds: BinaryBackgroundModel[] = [];
  const rows: BinaryRowModel[] = [];
  entities.forEach((entity) => {
    const spans = buildBinaryStateSpans(entity.stateList, t0, t1);
    if (!spans.length) {
      return;
    }
    const { entityId, label, color, onLabel, offLabel } = entity;
    if (entity.binaryDisplay === "row") {
      rows.push({
        entityId,
        label,
        color,
        onLabel,
        offLabel,
        spans,
        laneIndex: rows.length,
      });
      return;
    }
    backgrounds.push({
      entityId,
      label,
      color,
      onLabel,
      offLabel,
      spans: spans.filter((span) => span.state === "on"),
    });
  });
  return { backgrounds, rows };
}

// ── Build entity state list ─────────────────────────────────────────────────

export function buildEntityStateList(
  entityId: string,
  histResult: unknown,
  statsResult: unknown,
  entityIds: string[]
): Array<{ lu: number; s: string }> {
  const historyStates = getHistoryStatesForEntity(
    histResult,
    entityId,
    entityIds
  );
  const isBinary = entityId.split(".")[0] === "binary_sensor";
  const rawHistory = isBinary
    ? normalizeBinaryHistory(entityId, historyStates)
    : normalizeNumericHistory(entityId, historyStates);
  const statsHistory = normalizeStatisticsHistory(entityId, statsResult);
  return mergeNumericHistoryWithStatistics(rawHistory, statsHistory);
}

// ── Filter events ───────────────────────────────────��───────────────────────

export function filterEvents(
  events: Array<{
    id?: string;
    message?: string;
    annotation?: string;
    entity_ids?: string[];
  }>,
  hiddenEventIds: Set<string>,
  messageFilter: string
): Array<{
  id?: string;
  message?: string;
  annotation?: string;
  entity_ids?: string[];
}> {
  const query = String(messageFilter || "")
    .trim()
    .toLowerCase();
  const visibleEvents = events.filter(
    (event) => !hiddenEventIds.has(event?.id ?? "")
  );
  if (!query) {
    return visibleEvents;
  }
  return visibleEvents.filter((event) => {
    const haystack = [
      event?.message || "",
      event?.annotation || "",
      ...(event?.entity_ids || []).filter(Boolean),
    ]
      .join("\n")
      .toLowerCase();
    return haystack.includes(query);
  });
}
