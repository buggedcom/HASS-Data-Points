/**
 * Date parsing and zoom state helpers shared by chart/timeline subsystems.
 */

export function parseDateValue(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createChartZoomRange(startValue, endValue) {
  const start = parseDateValue(startValue)?.getTime();
  const end = parseDateValue(endValue)?.getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start < end
    ? { start, end }
    : null;
}
