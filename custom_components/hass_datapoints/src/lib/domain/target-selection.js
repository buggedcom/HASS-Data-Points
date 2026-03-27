/**
 * Pure target selection helpers shared by cards and the history page.
 */

export function normalizeEntityIds(value) {
  if (!value) {
    return [];
  }
  return (Array.isArray(value) ? value : [value])
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
}

export function normalizeTargetValue(targetValue) {
  if (!targetValue) {
    return {};
  }
  if (Array.isArray(targetValue)) {
    return { entity_id: normalizeEntityIds(targetValue) };
  }
  if (typeof targetValue === "string") {
    return targetValue ? { entity_id: [targetValue] } : {};
  }
  const normalized = {
    entity_id: [
      ...normalizeEntityIds(targetValue.entity_id),
      ...normalizeEntityIds(targetValue.entity_ids),
      ...normalizeEntityIds(targetValue.entity),
      ...normalizeEntityIds(targetValue.entities),
    ],
    device_id: normalizeEntityIds(targetValue.device_id),
    area_id: normalizeEntityIds(targetValue.area_id),
    label_id: normalizeEntityIds(targetValue.label_id),
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, entries]) => entries.length),
  );
}

export function normalizeTargetSelection(targetValue) {
  const normalized = normalizeTargetValue(targetValue);
  return {
    entity_id: [...new Set(normalized.entity_id || [])],
    device_id: [...new Set(normalized.device_id || [])],
    area_id: [...new Set(normalized.area_id || [])],
    label_id: [...new Set(normalized.label_id || [])],
  };
}

export function mergeTargetSelections(...targets) {
  const merged = { entity_id: [], device_id: [], area_id: [], label_id: [] };
  for (const target of targets) {
    const normalized = normalizeTargetSelection(target);
    for (const key of Object.keys(merged)) {
      merged[key].push(...normalized[key]);
    }
  }
  for (const key of Object.keys(merged)) {
    merged[key] = [...new Set(merged[key])];
  }
  return merged;
}

export function resolveEntityIdsFromTarget(hass, targetValue) {
  const target = normalizeTargetSelection(targetValue);
  const resolved = new Set(normalizeEntityIds(target.entity_id));
  const entityRegistry = hass?.entities || {};
  const selectedDevices = new Set(normalizeEntityIds(target.device_id));
  const selectedAreas = new Set(normalizeEntityIds(target.area_id));
  const selectedLabels = new Set(normalizeEntityIds(target.label_id));

  Object.entries(entityRegistry).forEach(([entityId, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const deviceId = entry.device_id || entry.deviceId || null;
    const areaId = entry.area_id || entry.areaId || null;
    const labels = [
      ...(Array.isArray(entry.labels) ? entry.labels : []),
      ...(Array.isArray(entry.label_ids) ? entry.label_ids : []),
    ];
    if (
      (deviceId && selectedDevices.has(deviceId))
      || (areaId && selectedAreas.has(areaId))
      || labels.some((labelId) => selectedLabels.has(labelId))
    ) {
      resolved.add(entityId);
    }
  });

  return [...resolved];
}

export function panelConfigTarget(panelCfg) {
  if (!panelCfg) {
    return {};
  }
  if (panelCfg.target) {
    return normalizeTargetValue(panelCfg.target);
  }
  return normalizeTargetValue({
    entity_id: panelCfg.entities?.length ? panelCfg.entities : panelCfg.entity,
  });
}
