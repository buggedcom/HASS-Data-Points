import { slugifySeriesName } from "../domain/history-series.js";
import { parseDateValue } from "../domain/chart-zoom.js";

/**
 * URL/session-friendly helpers for saved comparison date windows.
 */

export function makeDateWindowId(label, existingIds = new Set()) {
  const base = slugifySeriesName(label) || "date-window";
  let candidate = base;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function normalizeDateWindows(windows) {
  if (!Array.isArray(windows)) {
    return [];
  }
  const seen = new Set();
  const normalized = [];
  windows.forEach((window, index) => {
    const label = String(window?.label || window?.name || "").trim();
    const start = parseDateValue(window?.start_time || window?.start);
    const end = parseDateValue(window?.end_time || window?.end);
    if (!label || !start || !end || start >= end) {
      return;
    }
    const id = String(window?.id || "").trim() || makeDateWindowId(`${label}-${index + 1}`, seen);
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    normalized.push({
      id,
      label,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
  });
  return normalized;
}

export function parseDateWindowsParam(value) {
  if (!value || typeof value !== "string") {
    return [];
  }
  return normalizeDateWindows(value.split("|").map((entry) => {
    const [rawId, rawLabel, rawStart, rawEnd] = String(entry).split("~");
    return {
      id: decodeURIComponent(rawId || ""),
      label: decodeURIComponent(rawLabel || ""),
      start_time: decodeURIComponent(rawStart || ""),
      end_time: decodeURIComponent(rawEnd || ""),
    };
  }));
}

export function serializeDateWindowsParam(windows) {
  const normalized = normalizeDateWindows(windows);
  if (!normalized.length) {
    return "";
  }
  return normalized.map((window) => [
    encodeURIComponent(window.id),
    encodeURIComponent(window.label),
    encodeURIComponent(window.start_time),
    encodeURIComponent(window.end_time),
  ].join("~")).join("|");
}
