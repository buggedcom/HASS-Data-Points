import type {
  AggregateInterval,
  AggregatePeriod,
  AggregateRange,
} from "@/lib/domain/aggregation/types";

const HOUR_MS = 3600000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  minute: number;
  second: number;
  weekday: number;
}

function getLocalParts(ts: number, timeZone: string): LocalParts {
  const values: Record<string, number> = {};
  for (const part of getFormatter(timeZone).formatToParts(ts)) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    minute: values.minute,
    second: values.second,
    weekday: new Date(
      Date.UTC(values.year, values.month - 1, values.day)
    ).getUTCDay(),
  };
}

function getOffsetMs(ts: number, timeZone: string): number {
  const whole = Math.floor(ts / 1000) * 1000;
  const values: Record<string, number> = {};
  for (const part of getFormatter(timeZone).formatToParts(whole)) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }
  return (
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    ) - whole
  );
}

/** Local midnight (in `timeZone`) of a possibly un-normalised calendar date. */
function localMidnight(
  year: number,
  month: number,
  day: number,
  timeZone: string
): number {
  const wall = Date.UTC(year, month - 1, day);
  const guess = wall - getOffsetMs(wall, timeZone);
  return wall - getOffsetMs(guess, timeZone);
}

export function getPeriodStart(
  ts: number,
  interval: AggregateInterval,
  timeZone: string
): number {
  const p = getLocalParts(ts, timeZone);
  if (interval === "hour") {
    const ms = ((ts % 1000) + 1000) % 1000;
    return ts - ((p.minute * 60 + p.second) * 1000 + ms);
  }
  if (interval === "day") {
    return localMidnight(p.year, p.month, p.day, timeZone);
  }
  if (interval === "week") {
    return localMidnight(
      p.year,
      p.month,
      p.day - ((p.weekday + 6) % 7),
      timeZone
    );
  }
  return localMidnight(p.year, p.month, 1, timeZone);
}

export function getNextPeriodStart(
  periodStart: number,
  interval: AggregateInterval,
  timeZone: string
): number {
  if (interval === "hour") {
    return periodStart + HOUR_MS;
  }
  const p = getLocalParts(periodStart + HOUR_MS * 2, timeZone);
  if (interval === "day") {
    return localMidnight(p.year, p.month, p.day + 1, timeZone);
  }
  if (interval === "week") {
    return localMidnight(p.year, p.month, p.day + 7, timeZone);
  }
  return localMidnight(p.year, p.month + 1, 1, timeZone);
}

/**
 * Calendar periods overlapping `range`, clipped to it. Periods cut by the
 * range edge are flagged partial; the full period bounds are preserved.
 */
export function getPeriods(
  range: AggregateRange,
  interval: AggregateInterval,
  timeZone: string
): AggregatePeriod[] {
  const periods: AggregatePeriod[] = [];
  if (!(range.end > range.start)) {
    return periods;
  }
  let periodStart = getPeriodStart(range.start, interval, timeZone);
  while (periodStart < range.end) {
    const periodEnd = getNextPeriodStart(periodStart, interval, timeZone);
    const start = Math.max(periodStart, range.start);
    const end = Math.min(periodEnd, range.end);
    periods.push({
      periodStart,
      periodEnd,
      start,
      end,
      partial: start !== periodStart || end !== periodEnd,
    });
    periodStart = periodEnd;
  }
  return periods;
}
