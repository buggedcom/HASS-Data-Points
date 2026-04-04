/**
 * Shared helpers to resolve registry IDs to friendly names.
 * All fall back to the raw ID if not found.
 */
export function entityName(hass, entityId) {
  if (!hass || !entityId) return entityId || "";
  const state = hass.states[entityId];
  return (
    (state && state.attributes && state.attributes.friendly_name) || entityId
  );
}

export function entityIcon(hass, entityId) {
  if (!hass || !entityId) return "mdi:link-variant";
  const state = hass.states?.[entityId];
  if (state?.attributes?.icon) return state.attributes.icon;
  const domain = String(entityId).split(".")[0];
  const entry = hass.entities?.[entityId];
  if (entry?.icon) return entry.icon;
  switch (domain) {
    case "light":
      return "mdi:lightbulb";
    case "switch":
      return "mdi:toggle-switch";
    case "binary_sensor":
      return "mdi:radiobox-marked";
    case "sensor":
      return "mdi:chart-line";
    case "climate":
      return "mdi:thermostat";
    case "cover":
      return "mdi:window-shutter";
    case "lock":
      return "mdi:lock";
    case "media_player":
      return "mdi:play-box";
    case "person":
      return "mdi:account";
    case "device_tracker":
      return "mdi:crosshairs-gps";
    default:
      return "mdi:link-variant";
  }
}

function _entityRegistryEntries(hass) {
  return Object.entries(hass?.entities || {});
}

function _firstRelatedEntityId(hass, matcher) {
  return (
    _entityRegistryEntries(hass).find(
      ([, entry]) => entry && typeof entry === "object" && matcher(entry)
    )?.[0] || ""
  );
}

export function deviceName(hass, deviceId) {
  if (!hass || !deviceId) return deviceId || "";
  return hass.devices?.[deviceId]?.name ?? deviceId;
}

export function deviceIcon(hass, deviceId) {
  if (!hass || !deviceId) return "mdi:devices";
  const entityId = _firstRelatedEntityId(
    hass,
    (entry) => (entry.device_id || entry.deviceId) === deviceId
  );
  return entityId ? entityIcon(hass, entityId) : "mdi:devices";
}

export function areaName(hass, areaId) {
  if (!hass || !areaId) return areaId || "";
  return hass.areas?.[areaId]?.name ?? areaId;
}

export function areaIcon(hass, areaId) {
  if (!hass || !areaId) return "mdi:floor-plan";
  const entityId = _firstRelatedEntityId(
    hass,
    (entry) => (entry.area_id || entry.areaId) === areaId
  );
  return entityId ? entityIcon(hass, entityId) : "mdi:floor-plan";
}

export function labelName(hass, labelId) {
  if (!hass || !labelId) return labelId || "";
  return hass.labels?.[labelId]?.name ?? labelId;
}

export function labelIcon(hass, labelId) {
  if (!hass || !labelId) return "mdi:label-outline";
  const entityId = _firstRelatedEntityId(hass, (entry) => {
    const labels = [
      ...(Array.isArray(entry.labels) ? entry.labels : []),
      ...(Array.isArray(entry.label_ids) ? entry.label_ids : []),
    ];
    return labels.includes(labelId);
  });
  return entityId ? entityIcon(hass, entityId) : "mdi:label-outline";
}
