/**
 * Shared helper to resolve an entity ID to its friendly name.
 * Falls back to the raw entity_id if the entity is not found.
 */
function entityName(hass, entityId) {
  if (!hass || !entityId) return entityId || "";
  const state = hass.states[entityId];
  return (state && state.attributes && state.attributes.friendly_name) || entityId;
}

