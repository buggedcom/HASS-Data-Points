/**
 * Relative date windows: comparison windows defined by a preset ("Previous
 * period", "Same period last year", …) instead of fixed dates. A relative
 * window is resolved against the range currently selected on the chart and
 * always lasts exactly as long as that range.
 *
 * Pure and DOM-free. This module is the only place that does date maths on
 * presets.
 */

import { msg } from "@/lib/i18n/localize";

export const RELATIVE_DATE_WINDOW_PRESETS = [
  "previous_period",
  "next_period",
  "months_back_1",
  "months_back_2",
  "months_back_3",
  "months_ahead_1",
  "months_ahead_2",
  "months_ahead_3",
  "year_back_1",
  "year_ahead_1",
  "weekdays_back_1y",
  "year_back_2",
] as const;

export type RelativeDateWindowPreset =
  (typeof RELATIVE_DATE_WINDOW_PRESETS)[number];

export const DEFAULT_RELATIVE_DATE_WINDOW_PRESET: RelativeDateWindowPreset =
  "previous_period";

const DAY_MS = 24 * 60 * 60 * 1000;

type Shift =
  | { kind: "period"; direction: -1 | 1 }
  | { kind: "months"; amount: number }
  | { kind: "ms"; amount: number };

const PRESET_SHIFTS: Record<RelativeDateWindowPreset, Shift> = {
  previous_period: { kind: "period", direction: -1 },
  next_period: { kind: "period", direction: 1 },
  months_back_1: { kind: "months", amount: -1 },
  months_back_2: { kind: "months", amount: -2 },
  months_back_3: { kind: "months", amount: -3 },
  months_ahead_1: { kind: "months", amount: 1 },
  months_ahead_2: { kind: "months", amount: 2 },
  months_ahead_3: { kind: "months", amount: 3 },
  year_back_1: { kind: "months", amount: -12 },
  year_ahead_1: { kind: "months", amount: 12 },
  weekdays_back_1y: { kind: "ms", amount: -364 * DAY_MS },
  year_back_2: { kind: "months", amount: -24 },
};

export function isRelativeDateWindowPreset(
  value: unknown
): value is RelativeDateWindowPreset {
  return (
    typeof value === "string" &&
    (RELATIVE_DATE_WINDOW_PRESETS as readonly string[]).includes(value)
  );
}

/** Localized, user-facing label for a preset. */
export function relativeDateWindowPresetLabel(
  preset: RelativeDateWindowPreset
): string {
  switch (preset) {
    case "previous_period":
      return msg("Previous period");
    case "next_period":
      return msg("Next period");
    case "months_back_1":
      return msg("Same period last month");
    case "months_back_2":
      return msg("Same period 2 months ago");
    case "months_back_3":
      return msg("Same period 3 months ago");
    case "months_ahead_1":
      return msg("Same period next month");
    case "months_ahead_2":
      return msg("Same period in 2 months");
    case "months_ahead_3":
      return msg("Same period in 3 months");
    case "year_back_1":
      return msg("Same period last year");
    case "year_ahead_1":
      return msg("Same period next year");
    case "weekdays_back_1y":
      return msg("Same weekdays last year");
    case "year_back_2":
      return msg("Same period 2 years ago");
    default:
      return preset;
  }
}

/**
 * Shift `date` by whole calendar months, keeping the local wall-clock time and
 * clamping the day to the target month's last day (31 Mar − 1 month = 28 Feb,
 * 29 Feb − 12 months = 28 Feb).
 */
export function addCalendarMonthsClamped(date: Date, months: number): Date {
  const year = date.getFullYear();
  const monthIndex = date.getMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(
    targetYear,
    targetMonth,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

export interface ResolvedRelativeRange {
  start: Date;
  end: Date;
  /** False when the whole window lies at or after `now` (no data can exist yet). */
  available: boolean;
}

/**
 * Resolve a preset against the selected range. The resolved window always
 * lasts exactly `rangeEnd - rangeStart`; only its start is shifted. Returns
 * null for an invalid range.
 */
export function resolveRelativeDateWindow(
  preset: RelativeDateWindowPreset,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date = new Date()
): Nullable<ResolvedRelativeRange> {
  const startMs = rangeStart?.getTime?.();
  const endMs = rangeEnd?.getTime?.();
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return null;
  }
  const durationMs = endMs - startMs;
  const shift = PRESET_SHIFTS[preset];
  if (!shift) return null;

  let resolvedStartMs: number;
  if (shift.kind === "period") {
    resolvedStartMs = startMs + shift.direction * durationMs;
  } else if (shift.kind === "ms") {
    resolvedStartMs = startMs + shift.amount;
  } else {
    resolvedStartMs = addCalendarMonthsClamped(
      rangeStart,
      shift.amount
    ).getTime();
  }

  return {
    start: new Date(resolvedStartMs),
    end: new Date(resolvedStartMs + durationMs),
    available: resolvedStartMs < now.getTime(),
  };
}
