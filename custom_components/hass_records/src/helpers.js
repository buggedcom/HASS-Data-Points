/**
 * Shared helper functions – data fetching, formatting, escaping.
 */

async function fetchEvents(hass, startTime, endTime, entityIds) {
  try {
    const msg = {
      type: `${DOMAIN}/events`,
      start_time: startTime,
      end_time: endTime,
    };
    if (entityIds && entityIds.length) msg.entity_ids = entityIds;
    const result = await hass.connection.sendMessagePromise(msg);
    return result.events || [];
  } catch (err) {
    console.warn("[hass-records] fetchEvents failed:", err);
    return [];
  }
}

async function deleteEvent(hass, eventId) {
  return hass.connection.sendMessagePromise({
    type: `${DOMAIN}/events/delete`,
    event_id: eventId,
  });
}

async function updateEvent(hass, eventId, fields) {
  return hass.connection.sendMessagePromise({
    type: `${DOMAIN}/events/update`,
    event_id: eventId,
    ...fields,
  });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelativeTime(iso) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDateTime(iso);
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Escape HTML for safe inline insertion */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Return "#fff" or "#000" whichever has better contrast against the given hex
 * background colour, using the WCAG relative-luminance formula.
 */
function contrastColor(hex) {
  if (!hex || typeof hex !== "string") return "#fff";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  // Linearise sRGB channels
  const lin = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast against white (L=1) vs black (L=0) – pick the higher ratio
  return L > 0.179 ? "#000" : "#fff";
}

function navigateToHistory(card, entityIds) {
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
