/**
 * Pure date-window utilities extracted from datapoints.ts.
 *
 * All functions are stateless data transformations with no DOM dependency.
 */

import {
  endOfUnit,
  type RangeUnit,
  startOfUnit,
} from "@/lib/timeline/timeline-scale";

// ── Format comparison label ────────────────────────────────────────────────

export function formatComparisonLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtYear = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const sameYear = start.getFullYear() === end.getFullYear();
  return sameYear
    ? `${fmt(start)} – ${fmt(end)}`
    : `${fmtYear(start)} – ${fmtYear(end)}`;
}

/**
 * Compact, localized "start – end" label that includes times, e.g.
 * "Nov 9, 11:33 – 20:40" when both fall on the same day, otherwise
 * "Nov 9, 11:33 – Nov 10, 20:40". The year is added when they differ.
 */
export function formatDateTimeRange(start: Date, end: Date): string {
  const withYear = start.getFullYear() !== end.getFullYear();
  const day = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  const time = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${day(start)}, ${time(start)} – ${time(end)}`
    : `${day(start)}, ${time(start)} – ${day(end)}, ${time(end)}`;
}

// ── Shift date window by unit ──────────────────────────────────────────────

export function shiftDateWindowByUnit(
  date: Date,
  unit: RangeUnit,
  amount: number
): Date {
  const shifted = new Date(date);
  if (unit === "day") {
    shifted.setDate(shifted.getDate() + amount);
    return shifted;
  }
  if (unit === "week") {
    shifted.setDate(shifted.getDate() + amount * 7);
    return shifted;
  }
  if (unit === "month") {
    shifted.setMonth(shifted.getMonth() + amount);
    return shifted;
  }
  if (unit === "year") {
    shifted.setFullYear(shifted.getFullYear() + amount);
    return shifted;
  }
  return shifted;
}

// ── Get rounded date window unit ───────────────────────────────────────────

export function getRoundedDateWindowUnit(
  start: Date,
  end: Date
): Nullable<RangeUnit> {
  if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) {
    return null;
  }
  const supportedUnits: RangeUnit[] = ["day", "week", "month", "year"];
  for (const unit of supportedUnits) {
    const roundedStart = startOfUnit(start, unit);
    const roundedEnd = endOfUnit(start, unit);
    if (
      roundedStart?.getTime?.() === start.getTime() &&
      roundedEnd?.getTime?.() === end.getTime()
    ) {
      return unit;
    }
  }
  return null;
}

// ── Format date window input value ─────────────────────────────────────────

export function formatDateWindowInputValue(date: Nullable<Date>): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ── Parse date window input value ──────────────────────────────────────────

export function parseDateWindowInputValue(
  value: Nullable<string> | undefined
): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  );
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
