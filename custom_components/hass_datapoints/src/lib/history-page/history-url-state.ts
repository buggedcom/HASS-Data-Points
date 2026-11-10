import { slugifySeriesName } from "@/lib/domain/history-series";
import { parseDateValue } from "@/lib/domain/chart-zoom";
import {
  isRelativeDateWindowPreset,
  type RelativeDateWindowPreset,
  resolveRelativeDateWindow,
} from "@/lib/domain/relative-date-window";

/**
 * URL/session-friendly helpers for saved comparison date windows.
 *
 * A saved window is either **fixed** (its own start/end dates) or
 * **relative** (a preset resolved against the selected chart range, see
 * `lib/domain/relative-date-window.ts`). Records without a `kind` are fixed,
 * so everything saved before relative windows existed loads unchanged.
 */

export interface HistoryDateWindowInput {
  id?: unknown;
  label?: unknown;
  name?: unknown;
  kind?: unknown;
  preset?: unknown;
  start_time?: unknown;
  start?: unknown;
  end_time?: unknown;
  end?: unknown;
}

/** A window with concrete dates: a fixed window, or a relative one after resolution. */
export interface NormalizedHistoryDateWindow {
  id: string;
  label?: string;
  start_time: string;
  end_time: string;
  /** "relative" only on a resolved relative window; absent or "fixed" otherwise. */
  kind?: "fixed" | "relative";
  /** Preset of a resolved relative window. */
  preset?: RelativeDateWindowPreset;
  /** False when a resolved relative window lies entirely in the future. */
  available?: boolean;
  [key: string]: unknown;
}

export interface RelativeHistoryDateWindow {
  id: string;
  label: string;
  kind: "relative";
  preset: RelativeDateWindowPreset;
}

/** A window as it is saved (URL, session, user preferences). */
export type StoredHistoryDateWindow =
  | NormalizedHistoryDateWindow
  | RelativeHistoryDateWindow;

export function isRelativeDateWindow(
  window: Nullable<StoredHistoryDateWindow> | undefined
): window is RelativeHistoryDateWindow {
  return window?.kind === "relative" && "preset" in window && !!window.preset;
}

export function makeDateWindowId(
  label: string,
  existingIds = new Set<string>()
): string {
  const base = slugifySeriesName(label) || "date-window";
  let candidate = base;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function normalizeDateWindows(
  windows: Nullable<HistoryDateWindowInput[]> | undefined
): StoredHistoryDateWindow[] {
  if (!Array.isArray(windows)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: StoredHistoryDateWindow[] = [];

  windows.forEach((window, index) => {
    const label = String(window?.label || window?.name || "").trim();
    if (!label) {
      return;
    }

    const isRelative = window?.kind === "relative";
    let entry:
      | Omit<RelativeHistoryDateWindow, "id">
      | Omit<NormalizedHistoryDateWindow, "id">;

    if (isRelative) {
      if (!isRelativeDateWindowPreset(window?.preset)) {
        return;
      }
      entry = { label, kind: "relative", preset: window.preset };
    } else {
      const start = parseDateValue(
        (window?.start_time || window?.start) as
          | string
          | number
          | Nullable<Date>
          | undefined
      );
      const end = parseDateValue(
        (window?.end_time || window?.end) as
          | string
          | number
          | Nullable<Date>
          | undefined
      );
      if (!start || !end || start >= end) {
        return;
      }
      entry = {
        label,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };
    }

    const id =
      String(window?.id || "").trim() ||
      makeDateWindowId(`${label}-${index + 1}`, seen);

    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    normalized.push({ id, ...entry } as StoredHistoryDateWindow);
  });

  return normalized;
}

/**
 * Resolve saved windows against the selected range. Fixed windows pass through
 * unchanged (`available: true`); relative windows get the dates their preset
 * resolves to. Relative windows are dropped when there is no valid range.
 */
export function resolveDateWindows(
  windows: Nullable<StoredHistoryDateWindow[]> | undefined,
  rangeStart: Nullable<Date> | undefined,
  rangeEnd: Nullable<Date> | undefined,
  now: Date = new Date()
): NormalizedHistoryDateWindow[] {
  if (!Array.isArray(windows)) {
    return [];
  }
  const resolved: NormalizedHistoryDateWindow[] = [];
  windows.forEach((window) => {
    if (!isRelativeDateWindow(window)) {
      resolved.push({ ...window, available: true });
      return;
    }
    if (!rangeStart || !rangeEnd) {
      return;
    }
    const range = resolveRelativeDateWindow(
      window.preset,
      rangeStart,
      rangeEnd,
      now
    );
    if (!range) {
      return;
    }
    resolved.push({
      id: window.id,
      label: window.label,
      kind: "relative",
      preset: window.preset,
      start_time: range.start.toISOString(),
      end_time: range.end.toISOString(),
      available: range.available,
    });
  });
  return resolved;
}

const RELATIVE_URL_PREFIX = "@";

export function parseDateWindowsParam(
  value: unknown
): StoredHistoryDateWindow[] {
  if (!value || typeof value !== "string") {
    return [];
  }

  return normalizeDateWindows(
    value.split("|").map((entry) => {
      const [rawId, rawLabel, rawStart, rawEnd] = String(entry).split("~");
      const id = decodeURIComponent(rawId || "");
      const label = decodeURIComponent(rawLabel || "");
      const third = decodeURIComponent(rawStart || "");
      if (third.startsWith(RELATIVE_URL_PREFIX)) {
        return {
          id,
          label,
          kind: "relative",
          preset: third.slice(RELATIVE_URL_PREFIX.length),
        };
      }
      return {
        id,
        label,
        start_time: third,
        end_time: decodeURIComponent(rawEnd || ""),
      };
    })
  );
}

export function serializeDateWindowsParam(
  windows: Nullable<HistoryDateWindowInput[]> | undefined
): string {
  const normalized = normalizeDateWindows(windows);
  if (!normalized.length) {
    return "";
  }

  return normalized
    .map((window) =>
      (isRelativeDateWindow(window)
        ? [
            encodeURIComponent(window.id),
            encodeURIComponent(window.label ?? ""),
            encodeURIComponent(`${RELATIVE_URL_PREFIX}${window.preset}`),
          ]
        : [
            encodeURIComponent(window.id),
            encodeURIComponent(window.label ?? ""),
            encodeURIComponent(window.start_time),
            encodeURIComponent(window.end_time),
          ]
      ).join("~")
    )
    .join("|");
}

export function parseHistoryPageStateParam(
  value: unknown
): Nullable<RecordWithUnknownValues> {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as RecordWithUnknownValues)
      : null;
  } catch {
    return null;
  }
}

export function serializeHistoryPageStateParam(
  state: Nullable<RecordWithUnknownValues> | undefined
): string {
  if (!state || typeof state !== "object") {
    return "";
  }

  try {
    return JSON.stringify(state);
  } catch {
    return "";
  }
}
