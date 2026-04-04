import { PANEL_URL_PATH } from "@/constants.js";

export function navigateToHistory(card, entityIds) {
  const uniq = [...new Set((entityIds || []).filter(Boolean))];
  const params = new URLSearchParams();
  if (uniq.length) {
    params.set("entity_id", uniq.join(","));
  }
  const path = `/history?${params.toString()}`;

  if (window.history && window.history.pushState) {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
    return;
  }

  // Fallback for environments without HA router handling.
  window.location.assign(path);
}

export function buildDataPointsHistoryPath(target = {}, options = {}) {
  const normalizedTarget = {
    entity_id: [...new Set((target.entity_id || []).filter(Boolean))],
    device_id: [...new Set((target.device_id || []).filter(Boolean))],
    area_id: [...new Set((target.area_id || []).filter(Boolean))],
    label_id: [...new Set((target.label_id || []).filter(Boolean))],
  };
  const params = new URLSearchParams();
  if (normalizedTarget.entity_id.length)
    params.set("entity_id", normalizedTarget.entity_id.join(","));
  if (normalizedTarget.device_id.length)
    params.set("device_id", normalizedTarget.device_id.join(","));
  if (normalizedTarget.area_id.length)
    params.set("area_id", normalizedTarget.area_id.join(","));
  if (normalizedTarget.label_id.length)
    params.set("label_id", normalizedTarget.label_id.join(","));
  if (options.datapoint_scope === "all") params.set("datapoints_scope", "all");

  const start = options.start_time ? new Date(options.start_time) : null;
  const end = options.end_time ? new Date(options.end_time) : null;
  if (
    start &&
    end &&
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    start < end
  ) {
    params.set("start_time", start.toISOString());
    params.set("end_time", end.toISOString());
    params.set(
      "hours_to_show",
      String(
        Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000))
      )
    );
  }

  const zoomStart = options.zoom_start_time
    ? new Date(options.zoom_start_time)
    : null;
  const zoomEnd = options.zoom_end_time
    ? new Date(options.zoom_end_time)
    : null;
  if (
    zoomStart &&
    zoomEnd &&
    Number.isFinite(zoomStart.getTime()) &&
    Number.isFinite(zoomEnd.getTime()) &&
    zoomStart < zoomEnd
  ) {
    params.set("zoom_start_time", zoomStart.toISOString());
    params.set("zoom_end_time", zoomEnd.toISOString());
  }

  return `/${PANEL_URL_PATH}?${params.toString()}`;
}

export function navigateToDataPointsHistory(card, target = {}, options = {}) {
  const path = buildDataPointsHistoryPath(target, options);

  if (window.history && window.history.pushState) {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
    return;
  }

  window.location.assign(path);
}
