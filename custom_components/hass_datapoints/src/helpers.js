import { loadHaComponents } from "@kipk/load-ha-components";
import { PANEL_URL_PATH } from "./constants.js";

/**
 * Shared helper functions – data fetching, formatting, escaping.
 */

const HA_COMPONENT_LOAD_TIMEOUT_MS = 6000;
const HA_COMPONENT_LOADER_SUPPORTED_TAGS = new Set([
  "ha-form",
  "ha-icon",
  "ha-icon-button",
  "ha-selector",
  "ha-textfield",
  "ha-icon-picker",
  "ha-entity-picker",
  "ha-select",
  "ha-dialog",
  "ha-sortable",
  "ha-svg-icon",
  "ha-alert",
  "ha-button",
  "ha-color-picker",
  "ha-badge",
  "ha-sankey-chart",
  "mwc-button",
]);
const HA_HISTORY_ROUTE_COMPONENT_TAGS = new Set([
  "ha-target-picker",
  "ha-date-range-picker",
]);

async function preloadHistoryRouteComponents(tags = []) {
  const historyTags = tags.filter((tag) => HA_HISTORY_ROUTE_COMPONENT_TAGS.has(tag) && !customElements.get(tag));
  if (!historyTags.length) {
    return;
  }
  try {
    const app = document.querySelector("home-assistant");
    const panels = app?.hass?.panels;
    if (!panels?.history) {
      logger.warn("[hass-datapoints ha] history panel not available for preload");
      return;
    }
    const resolver = document.createElement("partial-panel-resolver");
    if (typeof resolver._updateRoutes !== "function") {
      logger.warn("[hass-datapoints ha] partial-panel-resolver missing _updateRoutes");
      return;
    }
    resolver.hass = { panels };
    resolver._updateRoutes();
    const load = resolver.routerOptions?.routes?.history?.load;
    if (typeof load !== "function") {
      logger.warn("[hass-datapoints ha] history route loader missing");
      return;
    }
    await load();
  } catch (error) {
    logger.warn("[hass-datapoints ha] history route preload failed", {
      historyTags,
      message: error?.message || String(error),
    });
  }
}

export function waitForHaComponent(tag, timeoutMs = HA_COMPONENT_LOAD_TIMEOUT_MS) {
  if (!tag) return Promise.resolve(false);
  if (customElements.get(tag)) {
    return Promise.resolve(true);
  }
  return Promise.race([
    customElements.whenDefined(tag).then(() => true),
    new Promise((resolve) => window.setTimeout(() => {
      logger.warn("[hass-datapoints ha] component wait timed out", { tag, timeoutMs });
      resolve(false);
    }, timeoutMs)),
  ]);
}

export function ensureHaComponents(tags = []) {
  const componentTags = [...new Set((tags || []).filter(Boolean))];
  const loaderTags = componentTags.filter((tag) => HA_COMPONENT_LOADER_SUPPORTED_TAGS.has(tag));
  const loadPromise = Promise.resolve()
    .then(() => (typeof loadHaComponents === "function" && loaderTags.length
      ? Promise.resolve(loadHaComponents(loaderTags))
        .catch((error) => {
          logger.warn("[hass-datapoints ha] loader failed", {
            loaderTags,
            message: error?.message || String(error),
          });
          return undefined;
        })
      : undefined))
    .then(() => preloadHistoryRouteComponents(componentTags));
  return loadPromise.then(() => Promise.all(componentTags.map((tag) => waitForHaComponent(tag))))
    .then((results) => {
      const summary = componentTags.map((tag, index) => ({
        tag,
        ready: !!results[index],
        defined: !!customElements.get(tag),
      }));
      return summary;
    });
}

export function confirmDestructiveAction(host, options = {}) {
  return ensureHaComponents(["ha-dialog"]).then(() => new Promise((resolve) => {
    const root = host?.shadowRoot || host;
    if (!root || !root.appendChild) {
      resolve(window.confirm(options.message || options.title || "Are you sure?"));
      return;
    }

    const dialog = document.createElement("ha-dialog");
    dialog.setAttribute("hideActions", "");
    dialog.scrimClickAction = true;
    dialog.escapeKeyAction = true;
    dialog.open = false;
    dialog.headerTitle = options.title || "Confirm delete";
    if (host?._hass) dialog.hass = host._hass;
    dialog.innerHTML = `
      <style>
        .confirm-dialog-body {
          padding: 0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px);
          color: var(--primary-text-color);
        }
        .confirm-dialog-message {
          line-height: 1.5;
          color: var(--secondary-text-color, var(--primary-text-color));
        }
        .confirm-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--dp-spacing-sm, 8px);
          margin-top: var(--dp-spacing-lg, 24px);
        }
        .confirm-dialog-button {
          border: 0;
          border-radius: 999px;
          padding: 0 16px;
          height: 36px;
          font: inherit;
          cursor: pointer;
        }
        .confirm-dialog-button.cancel {
          background: transparent;
          color: var(--primary-text-color);
        }
        .confirm-dialog-button.confirm {
          background: var(--error-color, #db4437);
          color: white;
        }
      </style>
      <div class="confirm-dialog-body">
        <div class="confirm-dialog-message">${esc(options.message || "Are you sure you want to delete this item?")}</div>
        <div class="confirm-dialog-actions">
          <button type="button" class="confirm-dialog-button cancel">${esc(options.cancelLabel || "Cancel")}</button>
          <button type="button" class="confirm-dialog-button confirm">${esc(options.confirmLabel || "Delete")}</button>
        </div>
      </div>
    `;

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.open = false;
      resolve(value);
    };

    const cancelButton = dialog.querySelector(".confirm-dialog-button.cancel");
    const confirmButton = dialog.querySelector(".confirm-dialog-button.confirm");

    cancelButton?.addEventListener("click", () => finish(false));
    confirmButton?.addEventListener("click", () => finish(true));
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      finish(true);
    });
    dialog.addEventListener("closed", () => {
      dialog.remove();
      if (!settled) resolve(false);
    }, { once: true });

    root.appendChild(dialog);
    dialog.open = true;
    window.requestAnimationFrame(() => {
      confirmButton?.focus();
    });
  }));
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtRelativeTime(iso) {
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

export function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Escape HTML for safe inline insertion */
export function esc(str) {
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
export function contrastColor(hex) {
  if (!hex || typeof hex !== "string") return "#fff";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  // Linearise sRGB channels
  const lin = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055)**2.4;
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast against white (L=1) vs black (L=0) – pick the higher ratio
  return L > 0.179 ? "#000" : "#fff";
}

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
  if (normalizedTarget.entity_id.length) params.set("entity_id", normalizedTarget.entity_id.join(","));
  if (normalizedTarget.device_id.length) params.set("device_id", normalizedTarget.device_id.join(","));
  if (normalizedTarget.area_id.length) params.set("area_id", normalizedTarget.area_id.join(","));
  if (normalizedTarget.label_id.length) params.set("label_id", normalizedTarget.label_id.join(","));
  if (options.datapoint_scope === "all") params.set("datapoints_scope", "all");

  const start = options.start_time ? new Date(options.start_time) : null;
  const end = options.end_time ? new Date(options.end_time) : null;
  if (start && end && Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start < end) {
    params.set("start_time", start.toISOString());
    params.set("end_time", end.toISOString());
    params.set("hours_to_show", String(Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000))));
  }

  const zoomStart = options.zoom_start_time ? new Date(options.zoom_start_time) : null;
  const zoomEnd = options.zoom_end_time ? new Date(options.zoom_end_time) : null;
  if (zoomStart && zoomEnd && Number.isFinite(zoomStart.getTime()) && Number.isFinite(zoomEnd.getTime()) && zoomStart < zoomEnd) {
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
