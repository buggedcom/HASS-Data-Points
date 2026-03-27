import { DOMAIN } from "../../constants.js";
import { clearStableRangeCacheMatching, normalizeCacheIdList, withStableRangeCache } from "./cache.js";

/**
 * Events data access layer.
 */

export async function fetchEvents(hass, startTime, endTime, entityIds) {
  try {
    const normalizedEntityIds = normalizeCacheIdList(entityIds);
    const cacheKey = JSON.stringify({
      type: `${DOMAIN}/events`,
      start_time: startTime,
      end_time: endTime,
      entity_ids: normalizedEntityIds,
    });
    return await withStableRangeCache(cacheKey, endTime, async () => {
      const msg = {
        type: `${DOMAIN}/events`,
        start_time: startTime,
        end_time: endTime,
      };
      if (normalizedEntityIds.length) {
        msg.entity_ids = normalizedEntityIds;
      }
      const result = await hass.connection.sendMessagePromise(msg);
      return result.events || [];
    });
  } catch (err) {
    console.warn("[hass-datapoints] fetchEvents failed:", err);
    return [];
  }
}

export function invalidateEventsCache() {
  return clearStableRangeCacheMatching((key) => {
    if (typeof key !== "string") {
      return false;
    }
    return key.includes(`"type":"${DOMAIN}/events"`);
  });
}

export async function fetchEventBounds(hass) {
  try {
    const result = await hass.connection.sendMessagePromise({
      type: `${DOMAIN}/events_bounds`,
    });
    return {
      start: result?.start_time || null,
      end: result?.end_time || null,
    };
  } catch (err) {
    console.warn("[hass-datapoints] fetchEventBounds failed:", err);
    return { start: null, end: null };
  }
}

export async function deleteEvent(hass, eventId) {
  const result = await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/events/delete`,
    event_id: eventId,
  });
  invalidateEventsCache();
  window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
  return result;
}

export async function updateEvent(hass, eventId, fields) {
  const result = await hass.connection.sendMessagePromise({
    type: `${DOMAIN}/events/update`,
    event_id: eventId,
    ...fields,
  });
  invalidateEventsCache();
  window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
  return result;
}
