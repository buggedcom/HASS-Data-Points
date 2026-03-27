/**
 * Chart subsystem helpers for hidden and zoom state.
 */

export function createHiddenSeriesSet(seriesSettings = []) {
  return new Set(
    (Array.isArray(seriesSettings) ? seriesSettings : [])
      .filter((entry) => entry?.visible === false)
      .map((entry) => entry.entity_id || entry.entity || entry.entityId)
      .filter(Boolean),
  );
}

export function createHiddenEventIdSet(hiddenEventIds = []) {
  return new Set((Array.isArray(hiddenEventIds) ? hiddenEventIds : []).filter(Boolean));
}
