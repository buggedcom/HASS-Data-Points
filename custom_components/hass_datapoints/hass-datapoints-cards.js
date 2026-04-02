(function() {
  "use strict";
  const DOMAIN$1 = "hass_datapoints";
  const PANEL_URL_PATH = "hass-datapoints-history";
  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899"
  ];
  const AMBER = "#ff9800";
  function entityName$1(hass, entityId) {
    if (!hass || !entityId) return entityId || "";
    const state = hass.states[entityId];
    return state && state.attributes && state.attributes.friendly_name || entityId;
  }
  function entityIcon$1(hass, entityId) {
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
    return _entityRegistryEntries(hass).find(([, entry]) => entry && typeof entry === "object" && matcher(entry))?.[0] || "";
  }
  function deviceName$1(hass, deviceId) {
    if (!hass || !deviceId) return deviceId || "";
    return hass.devices?.[deviceId]?.name ?? deviceId;
  }
  function deviceIcon$1(hass, deviceId) {
    if (!hass || !deviceId) return "mdi:devices";
    const entityId = _firstRelatedEntityId(hass, (entry) => (entry.device_id || entry.deviceId) === deviceId);
    return entityId ? entityIcon$1(hass, entityId) : "mdi:devices";
  }
  function areaName$1(hass, areaId) {
    if (!hass || !areaId) return areaId || "";
    return hass.areas?.[areaId]?.name ?? areaId;
  }
  function areaIcon$1(hass, areaId) {
    if (!hass || !areaId) return "mdi:floor-plan";
    const entityId = _firstRelatedEntityId(hass, (entry) => (entry.area_id || entry.areaId) === areaId);
    return entityId ? entityIcon$1(hass, entityId) : "mdi:floor-plan";
  }
  function labelName$1(hass, labelId) {
    if (!hass || !labelId) return labelId || "";
    return hass.labels?.[labelId]?.name ?? labelId;
  }
  function labelIcon$1(hass, labelId) {
    if (!hass || !labelId) return "mdi:label-outline";
    const entityId = _firstRelatedEntityId(hass, (entry) => {
      const labels = [
        ...Array.isArray(entry.labels) ? entry.labels : [],
        ...Array.isArray(entry.label_ids) ? entry.label_ids : []
      ];
      return labels.includes(labelId);
    });
    return entityId ? entityIcon$1(hass, entityId) : "mdi:label-outline";
  }
  const DEFAULT_HA_COMPONENTS = [
    "ha-form",
    "ha-icon",
    "ha-icon-button",
    "ha-selector",
    "ha-textfield",
    "ha-icon-picker",
    "ha-icon-button",
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
    "mwc-button"
  ];
  const loadHaComponents = async (components) => {
    const componentsToLoad = components || DEFAULT_HA_COMPONENTS;
    try {
      if (componentsToLoad.every((component) => customElements.get(component))) {
        return;
      }
      await Promise.race([
        customElements.whenDefined("partial-panel-resolver"),
        new Promise((_2, reject) => setTimeout(() => reject(new Error("Timeout waiting for partial-panel-resolver")), 1e4))
      ]);
      const ppr = document.createElement("partial-panel-resolver");
      if (!ppr) {
        throw new Error("Failed to create partial-panel-resolver element");
      }
      ppr.hass = {
        panels: [
          {
            url_path: "tmp",
            component_name: "config"
          }
        ]
      };
      if (typeof ppr._updateRoutes !== "function") {
        throw new Error("partial-panel-resolver does not have _updateRoutes method");
      }
      ppr._updateRoutes();
      if (!ppr.routerOptions?.routes?.tmp?.load) {
        throw new Error("Failed to create tmp route in partial-panel-resolver");
      }
      await Promise.race([
        ppr.routerOptions.routes.tmp.load(),
        new Promise((_2, reject) => setTimeout(() => reject(new Error("Timeout loading tmp route")), 1e4))
      ]);
      await Promise.race([
        customElements.whenDefined("ha-panel-config"),
        new Promise((_2, reject) => setTimeout(() => reject(new Error("Timeout waiting for ha-panel-config")), 1e4))
      ]);
      const cpr = document.createElement("ha-panel-config");
      if (!cpr) {
        throw new Error("Failed to create ha-panel-config element");
      }
      if (!cpr.routerOptions?.routes?.automation?.load) {
        throw new Error("ha-panel-config does not have automation route");
      }
      await Promise.race([
        cpr.routerOptions.routes.automation.load(),
        new Promise((_2, reject) => setTimeout(() => reject(new Error("Timeout loading automation components")), 1e4))
      ]);
      const missingComponents = componentsToLoad.filter((component) => !customElements.get(component));
      if (missingComponents.length > 0) {
        throw new Error(`Failed to load components: ${missingComponents.join(", ")}`);
      }
    } catch (error) {
      console.error("Error loading Home Assistant form components:", error);
      try {
        if (window.customElements && window.customElements.get("home-assistant")) {
          console.log("Attempting fallback loading method for HA components");
          const event = new CustomEvent("ha-request-load-components", {
            detail: {
              components: componentsToLoad
            },
            bubbles: true,
            composed: true
          });
          document.dispatchEvent(event);
        }
      } catch (fallbackError) {
        console.error("Fallback loading method failed:", fallbackError);
      }
    }
  };
  const HA_COMPONENT_LOAD_TIMEOUT_MS = 6e3;
  const HA_COMPONENT_LOADER_SUPPORTED_TAGS = /* @__PURE__ */ new Set([
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
    "mwc-button"
  ]);
  const HA_HISTORY_ROUTE_COMPONENT_TAGS = /* @__PURE__ */ new Set([
    "ha-target-picker",
    "ha-date-range-picker"
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
        message: error?.message || String(error)
      });
    }
  }
  function waitForHaComponent(tag, timeoutMs = HA_COMPONENT_LOAD_TIMEOUT_MS) {
    if (!tag) return Promise.resolve(false);
    if (customElements.get(tag)) {
      return Promise.resolve(true);
    }
    return Promise.race([
      customElements.whenDefined(tag).then(() => true),
      new Promise((resolve) => window.setTimeout(() => {
        logger.warn("[hass-datapoints ha] component wait timed out", { tag, timeoutMs });
        resolve(false);
      }, timeoutMs))
    ]);
  }
  function ensureHaComponents(tags = []) {
    const componentTags = [...new Set((tags || []).filter(Boolean))];
    const loaderTags = componentTags.filter((tag) => HA_COMPONENT_LOADER_SUPPORTED_TAGS.has(tag));
    const loadPromise = Promise.resolve().then(() => typeof loadHaComponents === "function" && loaderTags.length ? Promise.resolve(loadHaComponents(loaderTags)).catch((error) => {
      logger.warn("[hass-datapoints ha] loader failed", {
        loaderTags,
        message: error?.message || String(error)
      });
      return void 0;
    }) : void 0).then(() => preloadHistoryRouteComponents(componentTags));
    return loadPromise.then(() => Promise.all(componentTags.map((tag) => waitForHaComponent(tag)))).then((results) => {
      const summary = componentTags.map((tag, index) => ({
        tag,
        ready: !!results[index],
        defined: !!customElements.get(tag)
      }));
      return summary;
    });
  }
  function confirmDestructiveAction$1(host, options = {}) {
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
        <div class="confirm-dialog-message">${esc$1(options.message || "Are you sure you want to delete this item?")}</div>
        <div class="confirm-dialog-actions">
          <button type="button" class="confirm-dialog-button cancel">${esc$1(options.cancelLabel || "Cancel")}</button>
          <button type="button" class="confirm-dialog-button confirm">${esc$1(options.confirmLabel || "Delete")}</button>
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
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function fmtDateTime$1(iso) {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function fmtRelativeTime(iso) {
    const now = Date.now();
    const t2 = new Date(iso).getTime();
    const diff = now - t2;
    const mins = Math.floor(diff / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return fmtDateTime$1(iso);
  }
  function hexToRgba(hex, alpha) {
    const h2 = hex.replace("#", "");
    const r2 = parseInt(h2.substring(0, 2), 16);
    const g2 = parseInt(h2.substring(2, 4), 16);
    const b2 = parseInt(h2.substring(4, 6), 16);
    return `rgba(${r2},${g2},${b2},${alpha})`;
  }
  function esc$1(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function contrastColor$1(hex) {
    if (!hex || typeof hex !== "string") return "#fff";
    const h2 = hex.replace("#", "");
    if (h2.length !== 6) return "#fff";
    const r2 = parseInt(h2.substring(0, 2), 16) / 255;
    const g2 = parseInt(h2.substring(2, 4), 16) / 255;
    const b2 = parseInt(h2.substring(4, 6), 16) / 255;
    const lin = (c2) => c2 <= 0.04045 ? c2 / 12.92 : ((c2 + 0.055) / 1.055) ** 2.4;
    const L2 = 0.2126 * lin(r2) + 0.7152 * lin(g2) + 0.0722 * lin(b2);
    return L2 > 0.179 ? "#000" : "#fff";
  }
  function buildDataPointsHistoryPath$1(target = {}, options = {}) {
    const normalizedTarget = {
      entity_id: [...new Set((target.entity_id || []).filter(Boolean))],
      device_id: [...new Set((target.device_id || []).filter(Boolean))],
      area_id: [...new Set((target.area_id || []).filter(Boolean))],
      label_id: [...new Set((target.label_id || []).filter(Boolean))]
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
      params.set("hours_to_show", String(Math.max(1, Math.round((end.getTime() - start.getTime()) / 36e5))));
    }
    const zoomStart = options.zoom_start_time ? new Date(options.zoom_start_time) : null;
    const zoomEnd = options.zoom_end_time ? new Date(options.zoom_end_time) : null;
    if (zoomStart && zoomEnd && Number.isFinite(zoomStart.getTime()) && Number.isFinite(zoomEnd.getTime()) && zoomStart < zoomEnd) {
      params.set("zoom_start_time", zoomStart.toISOString());
      params.set("zoom_end_time", zoomEnd.toISOString());
    }
    return `/${PANEL_URL_PATH}?${params.toString()}`;
  }
  function navigateToDataPointsHistory$1(card, target = {}, options = {}) {
    const path = buildDataPointsHistoryPath$1(target, options);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }
    window.location.assign(path);
  }
  class ChartRenderer {
    constructor(canvas, cssWidth, cssHeight) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.cssW = cssWidth;
      this.cssH = cssHeight;
      this.basePad = { top: 24, right: 12, bottom: 48, left: 12 };
      this.pad = { ...this.basePad };
      this.labelColor = "rgba(214,218,224,0.92)";
    }
    static get AXIS_SLOT_WIDTH() {
      return 30;
    }
    get cw() {
      return this.cssW - this.pad.left - this.pad.right;
    }
    get ch() {
      return this.cssH - this.pad.top - this.pad.bottom;
    }
    xOf(t2, t0, t1) {
      return this.pad.left + (t2 - t0) / (t1 - t0) * this.cw;
    }
    yOf(v2, vMin, vMax) {
      return this.pad.top + this.ch - (v2 - vMin) / (vMax - vMin) * this.ch;
    }
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    _normalizeAxes(vMinOrAxes, vMax) {
      const axisColumnWidth = ChartRenderer.AXIS_SLOT_WIDTH;
      const inputAxes = Array.isArray(vMinOrAxes) ? vMinOrAxes : [{ key: "default", min: vMinOrAxes, max: vMax, side: "left", unit: "", color: null }];
      const leftAxes = [];
      const rightAxes = [];
      const axes = inputAxes.map((axis, index) => {
        const normalized = {
          key: axis.key || `axis-${index}`,
          min: axis.min,
          max: axis.max,
          side: axis.side === "right" ? "right" : "left",
          unit: axis.unit || "",
          color: axis.color || "rgba(128,128,128,0.85)"
        };
        const bucket = normalized.side === "right" ? rightAxes : leftAxes;
        normalized.slot = bucket.length;
        bucket.push(normalized);
        return normalized;
      });
      this.pad = {
        top: this.basePad.top,
        bottom: this.basePad.bottom,
        left: this.basePad.left + Math.max(1, leftAxes.length) * axisColumnWidth,
        right: this.basePad.right + rightAxes.length * axisColumnWidth
      };
      this._activeAxes = axes;
      return axes;
    }
    _formatAxisTick(v2, unit = "") {
      const numeric = Math.abs(v2) >= 1e3 ? `${(v2 / 1e3).toFixed(1).replace(/\.0$/, "")}k` : v2.toFixed(v2 % 1 !== 0 ? 1 : 0);
      return numeric;
    }
    _axisLabelX(axis) {
      const columnWidth = ChartRenderer.AXIS_SLOT_WIDTH;
      const leftAxisX = this.pad.left;
      const rightAxisX = this.pad.left + this.cw;
      if (axis.side === "right") {
        return rightAxisX + 10 + axis.slot * columnWidth;
      }
      return leftAxisX - 10 - axis.slot * columnWidth;
    }
    _formatTimeTick(t2, t0, t1, tickSpanMs = null) {
      const value = new Date(t2);
      const spanMs = Math.max(0, t1 - t0);
      const detailSpanMs = Number.isFinite(tickSpanMs) && tickSpanMs > 0 ? tickSpanMs : spanMs;
      const start = new Date(t0);
      const end = new Date(t1);
      const sameDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();
      const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
      if (detailSpanMs <= 2 * 60 * 60 * 1e3) {
        return value.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      if (detailSpanMs <= 12 * 60 * 60 * 1e3) {
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      if (detailSpanMs <= 2 * 24 * 60 * 60 * 1e3) {
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit"
        });
      }
      if (sameDay) {
        return value.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      if (detailSpanMs <= 6 * 60 * 60 * 1e3) {
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      if (detailSpanMs <= 24 * 60 * 60 * 1e3) {
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit"
        });
      }
      if (sameMonth && spanMs <= 14 * 24 * 60 * 60 * 1e3) {
        return value.toLocaleDateString([], { day: "numeric" });
      }
      if (spanMs >= 2 * 24 * 60 * 60 * 1e3) {
        return value.toLocaleDateString([], { month: "short", day: "numeric" });
      }
      if (spanMs >= 24 * 60 * 60 * 1e3) {
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      return fmtTime(value.toISOString());
    }
    _niceNumber(value, round) {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const exponent = Math.floor(Math.log10(value));
      const fraction = value / 10 ** exponent;
      let niceFraction;
      if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
      } else if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
      return niceFraction * 10 ** exponent;
    }
    _buildNiceAxisScale(axis, tickCount) {
      const rawMin = Number.isFinite(axis.min) ? axis.min : 0;
      const rawMax = Number.isFinite(axis.max) ? axis.max : 1;
      if (rawMin === rawMax) {
        const pad = Math.abs(rawMin || 1);
        const step2 = this._niceNumber(pad * 2 / Math.max(1, tickCount), true);
        const niceMin2 = Math.floor((rawMin - pad) / step2) * step2;
        const niceMax2 = Math.ceil((rawMax + pad) / step2) * step2;
        const ticks2 = [];
        for (let value = niceMin2; value <= niceMax2 + step2 * 0.5; value += step2) {
          ticks2.push(Number(value.toFixed(10)));
        }
        return { min: niceMin2, max: niceMax2, step: step2, ticks: ticks2 };
      }
      const range = this._niceNumber(rawMax - rawMin, false);
      const step = this._niceNumber(range / Math.max(1, tickCount), true);
      const niceMin = Math.floor(rawMin / step) * step;
      const niceMax = Math.ceil(rawMax / step) * step;
      const ticks = [];
      for (let value = niceMin; value <= niceMax + step * 0.5; value += step) {
        ticks.push(Number(value.toFixed(10)));
      }
      return { min: niceMin, max: niceMax, step, ticks };
    }
    _alignTimeTick(timestamp, stepMs) {
      const date = new Date(timestamp);
      if (stepMs < 60 * 1e3) {
        return Math.floor(timestamp / stepMs) * stepMs;
      }
      if (stepMs < 60 * 60 * 1e3) {
        const minutes = Math.max(1, Math.round(stepMs / (60 * 1e3)));
        date.setSeconds(0, 0);
        date.setMinutes(Math.floor(date.getMinutes() / minutes) * minutes);
        return date.getTime();
      }
      if (stepMs < 24 * 60 * 60 * 1e3) {
        const hours = Math.max(1, Math.round(stepMs / (60 * 60 * 1e3)));
        date.setMinutes(0, 0, 0);
        date.setHours(Math.floor(date.getHours() / hours) * hours);
        return date.getTime();
      }
      if (stepMs < 7 * 24 * 60 * 60 * 1e3) {
        const days = Math.max(1, Math.round(stepMs / (24 * 60 * 60 * 1e3)));
        date.setHours(0, 0, 0, 0);
        const dayOfMonth = date.getDate();
        date.setDate(dayOfMonth - (dayOfMonth - 1) % days);
        return date.getTime();
      }
      if (stepMs < 30 * 24 * 60 * 60 * 1e3) {
        date.setHours(0, 0, 0, 0);
        const day = date.getDay();
        const offset = (day + 6) % 7;
        date.setDate(date.getDate() - offset);
        return date.getTime();
      }
      date.setHours(0, 0, 0, 0);
      date.setDate(1);
      return date.getTime();
    }
    _getTimeTickStep(targetStepMs) {
      const candidates = [
        5 * 60 * 1e3,
        10 * 60 * 1e3,
        15 * 60 * 1e3,
        30 * 60 * 1e3,
        60 * 60 * 1e3,
        2 * 60 * 60 * 1e3,
        3 * 60 * 60 * 1e3,
        6 * 60 * 60 * 1e3,
        12 * 60 * 60 * 1e3,
        24 * 60 * 60 * 1e3,
        2 * 24 * 60 * 60 * 1e3,
        7 * 24 * 60 * 60 * 1e3,
        14 * 24 * 60 * 60 * 1e3,
        30 * 24 * 60 * 60 * 1e3
      ];
      return candidates.find((step) => step >= targetStepMs) || candidates[candidates.length - 1];
    }
    _buildTimeTicks(t0, t1) {
      const approxTickCount = Math.max(2, Math.min(96, Math.floor(this.cw / 120)));
      const stepMs = this._getTimeTickStep((t1 - t0) / Math.max(1, approxTickCount));
      const ticks = [];
      let tick = this._alignTimeTick(t0, stepMs);
      if (tick < t0) tick += stepMs;
      while (tick <= t1) {
        ticks.push(tick);
        tick += stepMs;
      }
      if (!ticks.length) {
        ticks.push(t0, t1);
      }
      return { ticks, stepMs };
    }
    drawGrid(t0, t1, vMin, vMax, yTicks = 5, options = {}) {
      const { ctx, pad } = this;
      const gridColor = "rgba(128,128,128,0.15)";
      const labelColor = this.labelColor;
      const fixedAxisOverlay = !!options.fixedAxisOverlay;
      const hideTimeLabels = !!options.hideTimeLabels;
      const axes = this._normalizeAxes(vMin, vMax);
      const unitCounts = axes.reduce((counts, axis) => {
        if (!axis?.unit) {
          return counts;
        }
        counts.set(axis.unit, (counts.get(axis.unit) || 0) + 1);
        return counts;
      }, /* @__PURE__ */ new Map());
      const axisLabelColor = (axis) => {
        const duplicateUnit = !!axis?.unit && (unitCounts.get(axis.unit) || 0) > 1;
        if (!duplicateUnit || !axis?.color) {
          return labelColor;
        }
        return axis.color;
      };
      axes.forEach((axis) => {
        const scale = this._buildNiceAxisScale(axis, yTicks);
        axis.min = scale.min;
        axis.max = scale.max;
        axis.ticks = scale.ticks;
      });
      const primaryAxis = axes[0];
      ctx.font = "12px sans-serif";
      for (const v2 of primaryAxis.ticks || []) {
        const y2 = this.yOf(v2, primaryAxis.min, primaryAxis.max);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y2);
        ctx.lineTo(pad.left + this.cw, y2);
        ctx.stroke();
        if (!fixedAxisOverlay) {
          ctx.fillStyle = axisLabelColor(primaryAxis);
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(this._formatAxisTick(v2, primaryAxis.unit), this._axisLabelX(primaryAxis), y2);
        }
      }
      if (!fixedAxisOverlay) {
        for (const axis of axes.slice(1)) {
          for (const v2 of axis.ticks || []) {
            const y2 = this.yOf(v2, axis.min, axis.max);
            ctx.fillStyle = axisLabelColor(axis);
            ctx.textAlign = axis.side === "right" ? "left" : "right";
            ctx.textBaseline = "middle";
            ctx.fillText(this._formatAxisTick(v2, axis.unit), this._axisLabelX(axis), y2);
          }
        }
      }
      if (!fixedAxisOverlay) {
        for (const axis of axes) {
          if (!axis.unit) continue;
          ctx.fillStyle = axisLabelColor(axis);
          ctx.textAlign = axis.side === "right" ? "left" : "right";
          ctx.textBaseline = "bottom";
          ctx.fillText(axis.unit, this._axisLabelX(axis), pad.top - 6);
        }
      }
      const { ticks: timeTicks, stepMs: tickSpanMs } = this._buildTimeTicks(t0, t1);
      for (const t2 of timeTicks) {
        const x2 = this.xOf(t2, t0, t1);
        const label = this._formatTimeTick(t2, t0, t1, tickSpanMs);
        ctx.strokeStyle = "rgba(128,128,128,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x2, pad.top);
        ctx.lineTo(x2, pad.top + this.ch);
        ctx.stroke();
        if (!hideTimeLabels) {
          ctx.fillStyle = labelColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const labelWidth = ctx.measureText(label).width;
          const labelX = Math.min(
            pad.left + this.cw - labelWidth / 2,
            Math.max(pad.left + labelWidth / 2, x2)
          );
          ctx.fillText(label, labelX, pad.top + this.ch + 6);
        }
      }
      ctx.strokeStyle = "rgba(128,128,128,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (!fixedAxisOverlay) {
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, pad.top + this.ch);
      }
      ctx.moveTo(pad.left, pad.top + this.ch);
      ctx.lineTo(pad.left + this.cw, pad.top + this.ch);
      if (axes.some((axis) => axis.side === "right") && !fixedAxisOverlay) {
        ctx.moveTo(pad.left + this.cw, pad.top);
        ctx.lineTo(pad.left + this.cw, pad.top + this.ch);
      }
      ctx.stroke();
    }
    drawRowLabel(text, color = "rgba(214,218,224,0.85)") {
      if (!text) {
        return;
      }
      const { ctx, pad } = this;
      ctx.save();
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(text, pad.left + 6, pad.top + 5);
      ctx.restore();
    }
    drawLine(points, color, t0, t1, vMin, vMax, options = {}) {
      if (!points.length) return;
      const { ctx, pad } = this;
      const fillAlpha = Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0;
      const dashed = !!options.dashed;
      const dotted = !!options.dotted;
      const dashPattern = Array.isArray(options.dashPattern) ? options.dashPattern.filter((entry) => Number.isFinite(entry) && entry > 0) : null;
      const lineOpacity = Number.isFinite(options.lineOpacity) ? options.lineOpacity : 1;
      const lineWidth = Number.isFinite(options.lineWidth) ? options.lineWidth : 1.75;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      if (dashPattern && dashPattern.length) {
        ctx.setLineDash(dashPattern);
      } else if (dotted) {
        ctx.setLineDash([1, 3]);
        ctx.lineCap = "round";
      } else if (dashed) {
        ctx.setLineDash([6, 4]);
      }
      if (lineOpacity < 1) ctx.globalAlpha = lineOpacity;
      if (fillAlpha > 0) {
        ctx.beginPath();
        let first2 = true;
        let lastX = pad.left;
        for (const [t2, v2] of points) {
          const x2 = this.xOf(t2, t0, t1);
          const y2 = this.yOf(v2, vMin, vMax);
          if (first2) {
            ctx.moveTo(x2, pad.top + this.ch);
            ctx.lineTo(x2, y2);
            first2 = false;
          } else {
            ctx.lineTo(x2, y2);
          }
          lastX = x2;
        }
        ctx.lineTo(lastX, pad.top + this.ch);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(color, fillAlpha);
        ctx.fill();
      }
      ctx.beginPath();
      let first = true;
      for (const [t2, v2] of points) {
        const x2 = this.xOf(t2, t0, t1);
        const y2 = this.yOf(v2, vMin, vMax);
        if (first) {
          ctx.moveTo(x2, y2);
          first = false;
        } else ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }
    drawBars(points, color, t0, t1, vMin, vMax, options = {}) {
      if (!points.length) return;
      const { ctx, pad } = this;
      const fillAlpha = Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0.78;
      const widthFactor = Number.isFinite(options.widthFactor) ? options.widthFactor : 0.72;
      const baselineY = this.yOf(Math.max(vMin, 0), vMin, vMax);
      const xs = points.map(([t2]) => this.xOf(t2, t0, t1));
      let minGap = this.cw / Math.max(points.length, 1);
      for (let i2 = 1; i2 < xs.length; i2++) {
        minGap = Math.min(minGap, xs[i2] - xs[i2 - 1]);
      }
      const barWidth = Math.max(3, Math.min(28, minGap * widthFactor));
      ctx.save();
      ctx.fillStyle = hexToRgba(color, fillAlpha);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i2 = 0; i2 < points.length; i2++) {
        const [, v2] = points[i2];
        const x2 = xs[i2];
        const y2 = this.yOf(v2, vMin, vMax);
        const top = Math.min(y2, baselineY);
        const height = Math.max(1, Math.abs(baselineY - y2));
        const left = x2 - barWidth / 2;
        ctx.fillRect(left, top, barWidth, height);
      }
      ctx.restore();
    }
    drawStateBands(spans, t0, t1, color = "#03a9f4", alpha = 0.12) {
      if (!spans?.length) return;
      const { ctx, pad } = this;
      ctx.save();
      ctx.fillStyle = hexToRgba(color, alpha);
      for (const span of spans) {
        const start = Math.max(t0, span.start);
        const end = Math.min(t1, span.end);
        if (!(start < end)) continue;
        const x0 = this.xOf(start, t0, t1);
        const x1 = this.xOf(end, t0, t1);
        ctx.fillRect(x0, pad.top, Math.max(1, x1 - x0), this.ch);
      }
      ctx.restore();
    }
    drawAnnotations(events, t0, t1, options = {}) {
      const { ctx, pad } = this;
      const hits = [];
      const showLines = options.showLines !== false;
      const showMarkers = options.showMarkers !== false;
      for (const event of events) {
        const t2 = new Date(event.timestamp).getTime();
        if (t2 < t0 || t2 > t1) continue;
        const x2 = this.xOf(t2, t0, t1);
        const color = event.color || "#03a9f4";
        if (showLines) {
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(x2, pad.top + 8);
          ctx.lineTo(x2, pad.top + this.ch);
          ctx.stroke();
          ctx.restore();
        }
        if (showMarkers) {
          const d2 = 5;
          ctx.save();
          ctx.fillStyle = color;
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x2, pad.top - d2);
          ctx.lineTo(x2 + d2, pad.top);
          ctx.lineTo(x2, pad.top + d2);
          ctx.lineTo(x2 - d2, pad.top);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        hits.push({ event, x: x2, y: pad.top });
      }
      return hits;
    }
    /**
     * Draw sensor-style vertical annotation lines that terminate on the data line
     * with a small circle marker.
     */
    drawAnnotationLinesOnLine(events, allSeries, t0, t1, vMin, vMax) {
      const { ctx, pad } = this;
      const firstPts = allSeries.length ? allSeries[0].pts : [];
      const hits = [];
      for (const event of events) {
        const t2 = new Date(event.timestamp).getTime();
        if (t2 < t0 || t2 > t1) continue;
        const x2 = this.xOf(t2, t0, t1);
        const value = this._interpolateValue(firstPts, t2);
        if (value === null) continue;
        const y2 = this.yOf(value, vMin, vMax);
        const color = event.color || "#03a9f4";
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(x2, pad.top + this.ch);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        hits.push({ event, x: x2, y: y2, value });
      }
      return hits;
    }
    /**
     * Interpolate the Y pixel position on a data series at a given timestamp.
     * Uses linear interpolation between surrounding data points.
     */
    _interpolateY(seriesPoints, t2, t0, t1, vMin, vMax) {
      if (!seriesPoints.length) return null;
      if (t2 <= seriesPoints[0][0]) return this.yOf(seriesPoints[0][1], vMin, vMax);
      if (t2 >= seriesPoints[seriesPoints.length - 1][0])
        return this.yOf(seriesPoints[seriesPoints.length - 1][1], vMin, vMax);
      for (let i2 = 0; i2 < seriesPoints.length - 1; i2++) {
        const [t1p, v1p] = seriesPoints[i2];
        const [t2p, v2p] = seriesPoints[i2 + 1];
        if (t2 >= t1p && t2 <= t2p) {
          const frac = (t2 - t1p) / (t2p - t1p);
          const v2 = v1p + frac * (v2p - v1p);
          return this.yOf(v2, vMin, vMax);
        }
      }
      return null;
    }
    _interpolateValue(seriesPoints, t2) {
      if (!seriesPoints.length) return null;
      if (t2 < seriesPoints[0][0]) return null;
      if (t2 > seriesPoints[seriesPoints.length - 1][0]) return null;
      if (t2 === seriesPoints[0][0]) return seriesPoints[0][1];
      if (t2 === seriesPoints[seriesPoints.length - 1][0]) {
        return seriesPoints[seriesPoints.length - 1][1];
      }
      for (let i2 = 0; i2 < seriesPoints.length - 1; i2++) {
        const [t1p, v1p] = seriesPoints[i2];
        const [t2p, v2p] = seriesPoints[i2 + 1];
        if (t2 >= t1p && t2 <= t2p) {
          const frac = (t2 - t1p) / (t2p - t1p);
          return v1p + frac * (v2p - v1p);
        }
      }
      return null;
    }
    /**
     * Draw annotation markers directly on a sensor data line.
     * No vertical dotted line — only a coloured circle on the line.
     *
     * @param {Array} events    Recorded events array
     * @param {Array} allSeries Array of {pts} objects — first series used for Y
     * @param {number} t0       Start time ms
     * @param {number} t1       End time ms
     * @param {number} vMin     Y axis min
     * @param {number} vMax     Y axis max
     * @returns {Array}         Array of {event, x, y} for hit-testing
     */
    drawAnnotationsOnLine(events, allSeries, t0, t1, vMin, vMax) {
      const { ctx } = this;
      const firstPts = allSeries.length ? allSeries[0].pts : [];
      const hits = [];
      for (const event of events) {
        const t2 = new Date(event.timestamp).getTime();
        if (t2 < t0 || t2 > t1) continue;
        const x2 = this.xOf(t2, t0, t1);
        const value = this._interpolateValue(firstPts, t2);
        if (value === null) continue;
        const y2 = this.yOf(value, vMin, vMax);
        const color = event.color || "#03a9f4";
        const r2 = 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x2, y2, r2 + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x2, y2, r2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        hits.push({ event, x: x2, y: y2, value });
      }
      return hits;
    }
    /**
     * Draw a gradient-filled band between two data values, fading from the edge
     * value toward the midpoint value. Used for min/max shading that fades toward
     * the mean line.
     *
     * @param {number} valueEdge  Data value at the opaque edge (the min or max line)
     * @param {number} valueMid   Data value at the transparent end (the mean line)
     * @param {string} color      Hex color string (e.g. "#03a9f4")
     * @param {number} t0         Render start time ms
     * @param {number} t1         Render end time ms
     * @param {number} vMin       Y-axis minimum data value
     * @param {number} vMax       Y-axis maximum data value
     * @param {object} options    { fillAlpha }
     */
    drawGradientBand(valueEdge, valueMid, color, t0, t1, vMin, vMax, options = {}) {
      const fillAlpha = Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0.08;
      if (fillAlpha <= 0) {
        return;
      }
      const hexMatch = String(color || "").match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      if (!hexMatch) {
        return;
      }
      const r2 = parseInt(hexMatch[1], 16);
      const g2 = parseInt(hexMatch[2], 16);
      const b2 = parseInt(hexMatch[3], 16);
      const yEdge = this.yOf(valueEdge, vMin, vMax);
      const yMid = this.yOf(valueMid, vMin, vMax);
      if (Math.abs(yMid - yEdge) < 1) {
        return;
      }
      const { ctx, pad } = this;
      const grad = ctx.createLinearGradient(0, yEdge, 0, yMid);
      grad.addColorStop(0, `rgba(${r2}, ${g2}, ${b2}, ${fillAlpha})`);
      grad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0)`);
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      ctx.fillStyle = grad;
      ctx.fillRect(pad.left, Math.min(yEdge, yMid), this.cw, Math.abs(yMid - yEdge));
      ctx.restore();
    }
    drawThresholdArea(points, thresholdValue, color, t0, t1, vMin, vMax, options = {}) {
      if (!Array.isArray(points) || points.length < 2) {
        return;
      }
      if (!Number.isFinite(thresholdValue)) {
        return;
      }
      const mode = options.mode === "below" ? "below" : "above";
      const fillAlpha = Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0.12;
      if (fillAlpha <= 0) {
        return;
      }
      const segments = [];
      let currentSegment = [];
      const isInside = (value) => {
        if (mode === "below") {
          return value <= thresholdValue;
        }
        return value >= thresholdValue;
      };
      const flushSegment = () => {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      };
      for (let index = 0; index < points.length - 1; index += 1) {
        const startPoint = points[index];
        const endPoint = points[index + 1];
        const startInside = isInside(startPoint[1]);
        const endInside = isInside(endPoint[1]);
        if (startInside && currentSegment.length === 0) {
          currentSegment.push(startPoint);
        }
        if (startInside && endInside) {
          currentSegment.push(endPoint);
          continue;
        }
        if (startInside !== endInside) {
          const deltaValue = endPoint[1] - startPoint[1];
          if (deltaValue === 0) {
            continue;
          }
          const fraction = (thresholdValue - startPoint[1]) / deltaValue;
          const crossingTime = startPoint[0] + (endPoint[0] - startPoint[0]) * fraction;
          const crossingPoint = [crossingTime, thresholdValue];
          if (startInside) {
            currentSegment.push(crossingPoint);
            flushSegment();
          } else {
            currentSegment.push(crossingPoint);
            currentSegment.push(endPoint);
          }
          continue;
        }
        if (!startInside && !endInside) {
          flushSegment();
        }
      }
      flushSegment();
      if (!segments.length) {
        return;
      }
      const { ctx, pad } = this;
      const thresholdY = this.yOf(thresholdValue, vMin, vMax);
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      ctx.fillStyle = hexToRgba(color, fillAlpha);
      segments.forEach((segment) => {
        if (!Array.isArray(segment) || segment.length < 2) {
          return;
        }
        ctx.beginPath();
        const firstPoint = segment[0];
        ctx.moveTo(this.xOf(firstPoint[0], t0, t1), thresholdY);
        segment.forEach((point) => {
          ctx.lineTo(this.xOf(point[0], t0, t1), this.yOf(point[1], vMin, vMax));
        });
        const lastPoint = segment[segment.length - 1];
        ctx.lineTo(this.xOf(lastPoint[0], t0, t1), thresholdY);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }
    /**
     * Draw diagonal hash marks at gap boundary points to indicate the start/end
     * of contiguous data ranges.
     *
     * @param {Array} boundaryPoints  Array of [timeMs, value] pairs at gap edges
     * @param {string} color          Stroke colour
     * @param {number} t0             Start time ms
     * @param {number} t1             End time ms
     * @param {number} vMin           Y axis min
     * @param {number} vMax           Y axis max
     */
    drawGapMarkers(boundaryPoints, color, t0, t1, vMin, vMax) {
      if (!boundaryPoints.length) return;
      const { ctx, pad } = this;
      const h2 = 7;
      const w = 3;
      const gap = 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.55;
      for (let i2 = 0; i2 < boundaryPoints.length; i2++) {
        const [t2, v2] = boundaryPoints[i2];
        const x2 = this.xOf(t2, t0, t1);
        const y2 = this.yOf(v2, vMin, vMax);
        const dir = i2 % 2 === 0 ? 1 : -1;
        for (let d2 = -gap; d2 <= gap; d2 += gap * 2) {
          ctx.beginPath();
          ctx.moveTo(x2 + d2 - w * dir, y2 - h2);
          ctx.lineTo(x2 + d2 + w * dir, y2 + h2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    drawAnomalyClusters(clusters, color, t0, t1, vMin, vMax, options = {}) {
      if (!Array.isArray(clusters) || clusters.length === 0) {
        return;
      }
      const strokeAlpha = Number.isFinite(options.strokeAlpha) ? options.strokeAlpha : 0.92;
      const lineWidth = Number.isFinite(options.lineWidth) ? options.lineWidth : 2;
      const haloWidth = Number.isFinite(options.haloWidth) ? options.haloWidth : Math.max(2.5, lineWidth + 1.5);
      const haloColor = typeof options.haloColor === "string" && options.haloColor ? options.haloColor : "rgba(255,255,255,0.9)";
      const haloAlpha = Number.isFinite(options.haloAlpha) ? options.haloAlpha : 0.9;
      const fillColor = typeof options.fillColor === "string" && options.fillColor ? options.fillColor : null;
      const fillAlpha = Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0;
      const pointPadding = Number.isFinite(options.pointPadding) ? options.pointPadding : 10;
      const minRadiusX = Number.isFinite(options.minRadiusX) ? options.minRadiusX : 10;
      const minRadiusY = Number.isFinite(options.minRadiusY) ? options.minRadiusY : 10;
      const clusterRegions = this.getAnomalyClusterRegions(clusters, t0, t1, vMin, vMax, {
        pointPadding,
        minRadiusX,
        minRadiusY
      });
      const { ctx, pad } = this;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      clusterRegions.forEach((region) => {
        ctx.save();
        ctx.setLineDash([]);
        if (fillColor && fillAlpha > 0) {
          ctx.globalAlpha = fillAlpha;
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.ellipse(region.centerX, region.centerY, region.radiusX, region.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = haloAlpha;
        ctx.strokeStyle = haloColor;
        ctx.lineWidth = haloWidth;
        ctx.beginPath();
        ctx.ellipse(region.centerX, region.centerY, region.radiusX, region.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = strokeAlpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.ellipse(region.centerX, region.centerY, region.radiusX, region.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    }
    /**
     * Animate a "blip" circle at the given canvas coordinates.
     * The circle expands with a bouncy overshoot, holds briefly, then shrinks to nothing.
     * Uses a separate overlay canvas so it doesn't interfere with the main chart.
     */
    drawBlip(cx, cy, color, options = {}) {
      const maxRadius = options.maxRadius || 6;
      const duration = options.duration || 600;
      const canvas = this.canvas;
      const parent = canvas.parentElement;
      if (!parent) return;
      const overlay = document.createElement("canvas");
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      overlay.style.cssText = `position:absolute;top:0;left:0;width:${canvas.style.width || `${canvas.offsetWidth}px`};height:${canvas.style.height || `${canvas.offsetHeight}px`};pointer-events:none;z-index:2;`;
      parent.style.position = parent.style.position || "relative";
      parent.appendChild(overlay);
      const ctx = overlay.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const pxCx = cx * dpr;
      const pxCy = cy * dpr;
      const pxMaxR = maxRadius * dpr;
      const start = performance.now();
      const animate = (now) => {
        const elapsed = now - start;
        const t2 = Math.min(elapsed / duration, 1);
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        let radius;
        let alpha;
        if (t2 < 0.35) {
          const p2 = t2 / 0.35;
          const bounce = p2 < 0.6 ? p2 / 0.6 * 1.3 : 1.3 - 0.3 * ((p2 - 0.6) / 0.4);
          radius = pxMaxR * Math.min(bounce, 1.3);
          alpha = Math.min(p2 * 2.5, 0.85);
        } else if (t2 < 0.6) {
          radius = pxMaxR;
          alpha = 0.85;
        } else {
          const p2 = (t2 - 0.6) / 0.4;
          const ease = 1 - (1 - p2) ** 3;
          radius = pxMaxR * (1 - ease);
          alpha = 0.85 * (1 - ease);
        }
        if (radius > 0.2 && alpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(pxCx, pxCy, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pxCx, pxCy, radius * 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2 * dpr;
          ctx.globalAlpha = alpha * 0.4;
          ctx.stroke();
          ctx.restore();
        }
        if (t2 < 1) {
          requestAnimationFrame(animate);
        } else {
          overlay.remove();
        }
      };
      requestAnimationFrame(animate);
    }
    getAnomalyClusterRegions(clusters, t0, t1, vMin, vMax, options = {}) {
      if (!Array.isArray(clusters) || clusters.length === 0) {
        return [];
      }
      const pointPadding = Number.isFinite(options.pointPadding) ? options.pointPadding : 10;
      const minRadiusX = Number.isFinite(options.minRadiusX) ? options.minRadiusX : 10;
      const minRadiusY = Number.isFinite(options.minRadiusY) ? options.minRadiusY : 10;
      return clusters.flatMap((cluster) => {
        if (!Array.isArray(cluster?.points) || cluster.points.length === 0) {
          return [];
        }
        const xs = [];
        const ys = [];
        cluster.points.forEach((point) => {
          xs.push(this.xOf(point.timeMs, t0, t1));
          ys.push(this.yOf(point.value, vMin, vMax));
        });
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return [{
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
          radiusX: Math.max(minRadiusX, (maxX - minX) / 2 + pointPadding),
          radiusY: Math.max(minRadiusY, (maxY - minY) / 2 + pointPadding),
          cluster
        }];
      });
    }
  }
  const CHART_STYLE = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    --ha-tooltip-background-color: color-mix(in srgb, #0f1218 96%, transparent);
    --ha-tooltip-text-color: rgba(255, 255, 255, 0.96);
    --ha-tooltip-padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    --ha-tooltip-border-radius: 10px;
    --ha-tooltip-arrow-size: 10px;
    --ha-tooltip-font-size: 0.86rem;
    --ha-tooltip-line-height: 1.1;
  }
  ha-card { padding: 0; overflow: visible; height: 100%; display: flex; flex-direction: column; }
  .card-header {
    padding: var(--dp-spacing-lg) var(--dp-spacing-lg) 0;
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
    flex: 0 0 auto;
  }
  .chart-top-slot[hidden] {
    display: none;
  }
  .chart-top-slot {
    position: relative;
    flex: 0 0 auto;
    min-width: 0;
    z-index: 1;
  }
  .chart-tabs-shell {
    position: relative;
    min-width: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    z-index: 1;
    display: flex;
    align-items: center;
    gap: calc(var(--dp-spacing-sm, 8px));
  }
  .chart-tabs-rail {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-right: 10px;
    flex-grow: 1;
  }
  .chart-tabs-rail::-webkit-scrollbar {
    display: none;
  }
  .chart-tabs {
    display: flex;
    align-items: flex-end;
    width: 100%;
    min-width: 0;
    gap: 0;
    padding: 0 var(--dp-spacing-md);
    box-sizing: border-box;
  }
  .chart-tab {
    display: flex;
    align-items: stretch;
    min-width: 0;
    border-bottom: 2px solid transparent;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }
  .chart-tab-trigger {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    border-radius: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.86rem;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }
  .chart-tab-trigger:hover,
  .chart-tab-trigger:focus-visible {
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-tab:hover {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 44%, transparent);
  }
  .chart-tab:hover .chart-tab-trigger {
    color: var(--primary-text-color);
  }
  .chart-tab.previewing {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }
  .chart-tab.previewing .chart-tab-trigger {
    color: var(--primary-text-color);
  }
  .chart-tab.active {
    border-bottom-color: var(--primary-color, #03a9f4);
  }
  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-actions {
    opacity: 0.55;
  }
  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-trigger .chart-tab-detail,
  .chart-tab.loading .chart-tab-action {
    color: var(--secondary-text-color);
  }
  .chart-tab.active .chart-tab-trigger {
    color: var(--primary-text-color);
    font-weight: 600;
    cursor: default;
  }
  .chart-tab-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .chart-tab-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .chart-tab-label {
    font-weight: inherit;
  }
  .chart-tab-spinner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--secondary-text-color, #6b7280) 28%, transparent);
    border-top-color: currentColor;
    animation: chart-spinner 0.9s linear infinite;
    flex: 0 0 auto;
  }
  .chart-tab-detail {
    font-size: 0.73rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
    font-weight: 400;
  }
  .chart-tab-detail-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }
  .chart-tab-preview-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }
  .chart-tab-preview {
    font-size: 0.68rem;
    line-height: 1.15;
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 58%, var(--secondary-text-color, #6b7280));
    font-weight: 500;
  }
  .chart-tab-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: -2px;
    padding-right: var(--dp-spacing-md);
    padding-bottom: 2px;
    align-self: center;
    transform: translateY(0);
    flex: 0 0 auto;
  }
  .chart-tab-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }
  .chart-tab-action ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }
  .chart-tab-action:hover,
  .chart-tab-action:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    color: var(--error-color, #db4437);
  }
  .chart-tab-action.delete {
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
  }
  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
  }
  .chart-tab.active .chart-tab-detail,
  .chart-tab.previewing .chart-tab-detail,
  .chart-tab.active .chart-tab-preview,
  .chart-tab.previewing .chart-tab-preview,
  .chart-tab:hover .chart-tab-detail,
  .chart-tab:hover .chart-tab-preview,
  .chart-tab-trigger:hover .chart-tab-detail,
  .chart-tab-trigger:hover .chart-tab-preview,
  .chart-tab-trigger:focus-visible .chart-tab-detail,
  .chart-tab-trigger:focus-visible .chart-tab-preview {
    color: color-mix(in srgb, var(--secondary-text-color, #6b7280) 88%, var(--primary-text-color, #111));
  }
  .chart-tabs-add {
    margin-right: calc(var(--dp-spacing-sm, 16px));
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--dp-spacing-sm, 8px) * 0.625) var(--dp-spacing-sm);
    height: 26px;
    border: 0px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    z-index: 2;
  }
  .chart-tabs-add ha-icon {
    --mdc-icon-size: 16px;
  }
  .chart-tabs-add:hover,
  .chart-tabs-add:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .chart-tabs-shell.overflowing .chart-tabs-add {
    top: var(--dp-spacing-xs);
    transform: none;
    width: 34px;
    min-width: 34px;
    height: 34px;
    padding: 0;
    justify-content: center;
    border-radius: 999px;
  }
  .chart-tabs-shell.overflowing .chart-tabs-add-label {
    display: none;
  }
  .chart-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    box-sizing: border-box;
    overflow: visible;
    isolation: isolate;
    z-index: 3;
  }
  .chart-preview-overlay[hidden] {
    display: none;
  }
  .chart-preview-overlay {
    position: absolute;
    top: var(--dp-spacing-sm);
    left: var(--dp-spacing-md);
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: min(340px, calc(100% - (var(--dp-spacing-lg) * 2)));
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(4px);
    pointer-events: none;
    z-index: 4;
  }
  .chart-preview-kicker {
    font-size: 0.68rem;
    line-height: 1.15;
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--secondary-text-color, #6b7280));
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .chart-preview-title {
    font-size: 0.84rem;
    line-height: 1.2;
    color: var(--primary-text-color);
    font-weight: 600;
  }
  .chart-preview-line {
    font-size: 0.74rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
  }
  .chart-preview-line strong {
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--primary-text-color, #111));
    font-weight: 600;
  }
  .chart-scroll-viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
    -webkit-overflow-scrolling: touch;
  }
  .chart-stage {
    position: relative;
    min-height: 100%;
  }
  .chart-icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .chart-event-icon {
    position: absolute;
    width: 18px;
    height: 18px;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    border-radius: 50%;
  }
  .chart-event-icon ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-axis-overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    display: none;
    pointer-events: none;
    background: var(--card-background-color, var(--primary-background-color, #fff));
    overflow: hidden;
    z-index: 3;
  }
  .chart-axis-overlay.visible {
    display: block;
  }
  .chart-axis-overlay.left {
    left: 0;
  }
  .chart-axis-overlay.right {
    right: 0;
  }
  .chart-axis-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(128,128,128,0.35);
  }
  .chart-axis-overlay.left .chart-axis-divider {
    right: 0;
  }
  .chart-axis-overlay.right .chart-axis-divider {
    left: 0;
  }
  .chart-axis-label,
  .chart-axis-unit {
    position: absolute;
    color: var(--secondary-text-color);
    font: 12px sans-serif;
    line-height: 1;
    white-space: nowrap;
  }
  .chart-axis-label {
    transform: translateY(calc(-50% + 6px));
  }
  .chart-axis-unit {
    font-weight: 500;
  }
  canvas { display: block; }
  .chart-loading {
    position: absolute;
    top: var(--dp-spacing-sm);
    left: var(--dp-spacing-md);
    display: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing, 8px) * 3);
    height: calc(var(--spacing, 8px) * 3);
    border-radius: 999px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 92%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    z-index: 6;
    pointer-events: none;
  }
  .chart-loading.active {
    display: inline-flex;
  }
  .chart-loading-spinner {
    width: calc(var(--spacing, 8px) * 2);
    height: calc(var(--spacing, 8px) * 2);
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: chart-spinner 0.9s linear infinite;
  }
  @keyframes chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }
  .chart-message {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    padding: calc(var(--spacing, 8px) * 5) var(--dp-spacing-lg);
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 2;
  }
  .chart-message.visible {
    display: flex;
  }
  .chart-crosshair {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .chart-crosshair[hidden] {
    display: none;
  }
  .crosshair-line {
    position: absolute;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }
  .crosshair-line.vertical {
    width: 1px;
    transform: translateX(-50%);
  }
  .crosshair-line.horizontal {
    height: 1px;
    transform: translateY(-50%);
  }
  .crosshair-line.horizontal.series {
    left: 0;
    width: 100%;
  }
  .crosshair-line.horizontal.series.subtle {
    background: currentColor;
    opacity: 0.22;
  }
  .crosshair-line.horizontal.series.emphasized {
    height: 0;
    background: transparent;
    border-top: 1px dashed currentColor;
    opacity: 0.9;
  }
  .crosshair-points {
    position: absolute;
    inset: 0;
  }
  .crosshair-point {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    transform: translate(-50%, -50%);
  }
  .crosshair-axis-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    transform: translate(-50%, -50%);
  }
  .chart-axis-hover-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    top: 0;
    transform: translateY(-50%);
  }
  .chart-axis-hover-dot.left {
    right: 0;
    transform: translate(50%, -50%);
  }
  .chart-axis-hover-dot.right {
    left: 0;
    transform: translate(-50%, -50%);
  }
  .chart-zoom-selection {
    position: absolute;
    border-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 78%, transparent);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .chart-zoom-selection.visible {
    opacity: 1;
  }
  .chart-add-annotation {
    position: absolute;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--secondary-text-color, #616161) 22%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 94%, transparent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
    color: var(--secondary-text-color, #616161);
    cursor: pointer;
    z-index: 4;
    transform: translate(-50%, -50%);
  }
  .chart-add-annotation ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-add-annotation:hover,
  .chart-add-annotation:focus-visible {
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 82%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-add-annotation[hidden] {
    display: none;
  }
  .chart-zoom-out {
    position: absolute;
    top: var(--dp-spacing-md);
    right: var(--dp-spacing-lg);
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-zoom-out ha-icon {
    --mdc-icon-size: 16px;
  }
  .chart-zoom-out[hidden] {
    display: none;
  }
  .chart-zoom-out:hover,
  .chart-zoom-out:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .chart-adjust-axis {
    position: absolute;
    left: var(--dp-spacing-lg);
    bottom: var(--dp-spacing-lg);
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-adjust-axis[hidden] {
    display: none;
  }
  .chart-adjust-axis:hover,
  .chart-adjust-axis:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .legend {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    padding-left: max(var(--dp-spacing-md), var(--dp-chart-axis-left-width, 0px));
    padding-right: max(var(--dp-spacing-md), var(--dp-chart-axis-right-width, 0px));
    flex: 0 0 auto;
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .legend.wrap-rows {
    flex-wrap: wrap;
    align-items: flex-start;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: calc((30px * 3) + (var(--dp-spacing-sm) * 2));
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.625);
    font-size: 0.78em;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }
  .legend.wrap-rows .legend-item {
    max-width: 100%;
  }
  .legend-toggle {
    border: 0;
    padding: calc(var(--spacing, 8px) * 0.375) var(--dp-spacing-sm);
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 999px;
    transition: opacity 120ms ease, color 120ms ease, background-color 120ms ease;
  }
  .legend-toggle:hover,
  .legend-toggle:focus-visible {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }
  .legend-toggle[aria-pressed="false"] {
    opacity: 0.45;
  }
  .legend-line {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex: 0 0 12px;
  }
  .tooltip {
    position: fixed;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    border-radius: 10px;
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    font-size: 0.86rem;
    line-height: 1.1;
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
    pointer-events: none;
    display: none;
    max-width: clamp(220px, 30vw, 320px);
    z-index: 1200;
    color: rgba(255, 255, 255, 0.96);
  }
  .tt-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: var(--dp-spacing-xs);
    flex-shrink: 0;
  }
  .tt-time { color: rgba(255, 255, 255, 0.72); margin-bottom: calc(var(--spacing, 8px) * 0.375); }
  .tt-value { color: rgba(255, 255, 255, 0.78); margin-bottom: var(--dp-spacing-xs); }
  .tt-series {
    display: grid;
    gap: var(--dp-spacing-xs);
    margin-bottom: var(--dp-spacing-xs);
  }
  .tt-series-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--dp-spacing-md);
    min-width: 0;
  }
  .tt-series-row.subordinate {
    padding-left: calc(var(--spacing, 8px) * 2.25);
  }
  .tt-series-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-series-label {
    min-width: 0;
    color: rgba(255, 255, 255, 0.76);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tt-series-value {
    flex: 0 0 auto;
    color: rgba(255, 255, 255, 0.96);
    font-weight: 500;
    white-space: nowrap;
    text-align: right;
  }
  .tt-message-row {
    display: flex;
    align-items: flex-start;
    gap: var(--dp-spacing-xs);
  }
  .tt-message { font-weight: 500; }
  .tt-annotation {
    color: rgba(255, 255, 255, 0.74);
    margin-top: var(--dp-spacing-xs);
    margin-left: calc(8px + var(--dp-spacing-xs) + calc(var(--spacing, 8px) * 0.75));
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .tooltip.secondary {
    max-width: 260px;
  }
  .tooltip.annotation-tooltip {
    max-width: 300px;
  }
  .tt-secondary {
    display: grid;
    gap: calc(var(--spacing, 8px) * 0.5);
  }
  .tt-secondary-title {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
  }
  .tt-secondary-text {
    font-size: 0.88rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.9);
    white-space: pre-wrap;
  }
  .tt-secondary-text.muted {
    color: rgba(255, 255, 255, 0.74);
  }
  .tt-entities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-xs);
    margin-top: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-entity-chip {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.5);
    max-width: 100%;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, #ffffff 10%, transparent);
    color: rgba(255, 255, 255, 0.82);
    white-space: nowrap;
  }
  .tt-entity-chip ha-icon {
    --mdc-icon-size: 12px;
    flex: 0 0 auto;
  }
  .tt-entity-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chart-modal[hidden] {
    display: none;
  }
  .chart-modal {
    position: absolute;
    inset: 0;
    z-index: 250;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--dp-spacing-lg);
    box-sizing: border-box;
  }
  .chart-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 18, 24, 0.42);
    backdrop-filter: blur(2px);
  }
  .chart-modal-panel {
    position: relative;
    z-index: 1;
    width: min(560px, calc(100vw - (var(--spacing, 8px) * 4)));
    max-height: calc(100% - (var(--spacing, 8px) * 4));
    overflow: auto;
    border-radius: 16px;
  }
`;
  function buildChartCardShell(title) {
    return `
    <style>${CHART_STYLE}</style>
    <ha-card>
      ${title ? `<div class="card-header">${esc$1(title)}</div>` : ""}
      <div class="chart-top-slot" id="chart-top-slot" hidden></div>
      <div class="chart-wrap">
        <div class="chart-preview-overlay" id="chart-preview-overlay" hidden></div>
        <div class="chart-scroll-viewport" id="chart-scroll-viewport">
          <div class="chart-stage" id="chart-stage">
            <div class="chart-loading active" id="loading" aria-hidden="true">
              <div class="chart-loading-spinner"></div>
            </div>
            <div class="chart-message" id="chart-message"></div>
            <canvas id="chart"></canvas>
            <div class="chart-icon-overlay" id="chart-icon-overlay"></div>
            <div class="chart-crosshair" id="chart-crosshair" hidden>
              <div class="crosshair-line vertical" id="crosshair-vertical"></div>
              <div class="crosshair-line horizontal" id="crosshair-horizontal"></div>
              <div class="crosshair-points" id="crosshair-points"></div>
            </div>
            <button type="button" class="chart-add-annotation" id="chart-add-annotation" hidden aria-label="Create data point">
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
            <ha-tooltip for="chart-add-annotation" placement="bottom" distance="8" show-delay="1000">Create Data Point</ha-tooltip>
            <div class="chart-zoom-selection" id="chart-zoom-selection" hidden></div>
          </div>
        </div>
        <div class="chart-axis-overlay left" id="chart-axis-left"></div>
        <div class="chart-axis-overlay right" id="chart-axis-right"></div>
        <button type="button" class="chart-zoom-out" id="chart-zoom-out" hidden>
          <ha-icon icon="mdi:magnify-minus-outline"></ha-icon>
          <span>Zoom out</span>
        </button>
        <button type="button" class="chart-adjust-axis" id="chart-adjust-axis" hidden>
          <span>Adjust Y-Axis</span>
        </button>
        <div class="tooltip" id="tooltip">
          <div class="tt-time" id="tt-time"></div>
          <div class="tt-value" id="tt-value" style="display:none"></div>
          <div class="tt-series" id="tt-series" style="display:none"></div>
          <div class="tt-message-row" id="tt-message-row" style="display:none">
            <span class="tt-dot" id="tt-dot"></span>
            <span class="tt-message" id="tt-message"></span>
          </div>
          <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
          <div class="tt-entities" id="tt-entities" style="display:none"></div>
        </div>
        <div class="tooltip secondary" id="anomaly-tooltip">
          <div class="tt-secondary">
            <div class="tt-secondary-title" id="tt-secondary-title"></div>
            <div class="tt-secondary-text" id="tt-secondary-description"></div>
            <div class="tt-secondary-text" id="tt-secondary-alert"></div>
            <div class="tt-secondary-text muted" id="tt-secondary-instruction"></div>
          </div>
        </div>
        <div id="annotation-tooltips"></div>
      <div class="legend" id="legend"></div>
    </ha-card>`;
  }
  function resolveChartLabelColor(el) {
    if (!el) {
      return "rgba(214,218,224,0.92)";
    }
    const raw = getComputedStyle(el).getPropertyValue("--secondary-text-color").trim();
    if (raw) {
      return raw;
    }
    return "rgba(214,218,224,0.92)";
  }
  function setupCanvas(canvas, container, cssHeight, cssWidth = null) {
    const dpr = window.devicePixelRatio || 1;
    const maxCssDim = Math.floor(16383 / dpr);
    const styles2 = getComputedStyle(container);
    const paddingX = (Number.parseFloat(styles2.paddingLeft || "0") || 0) + (Number.parseFloat(styles2.paddingRight || "0") || 0);
    const paddingY = (Number.parseFloat(styles2.paddingTop || "0") || 0) + (Number.parseFloat(styles2.paddingBottom || "0") || 0);
    const measuredWidth = cssWidth ?? (container.clientWidth || 360);
    const w = Math.min(maxCssDim, Math.max(1, Math.round(measuredWidth - paddingX)));
    const requestedHeight = cssHeight ?? container.clientHeight ?? 220;
    const h2 = Math.min(maxCssDim, Math.max(120, Math.round(requestedHeight - paddingY)));
    canvas.width = w * dpr;
    canvas.height = h2 * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h2}px`;
    canvas.getContext("2d").scale(dpr, dpr);
    return { w, h: h2 };
  }
  function renderChartAxisOverlays(card, renderer, axes = []) {
    const leftEl = card.shadowRoot?.getElementById("chart-axis-left");
    const rightEl = card.shadowRoot?.getElementById("chart-axis-right");
    if (!leftEl || !rightEl || !renderer) return;
    const leftWidth = Math.max(0, renderer.pad.left);
    const rightWidth = Math.max(0, renderer.pad.right);
    leftEl.style.width = `${leftWidth}px`;
    rightEl.style.width = `${rightWidth}px`;
    const chartWrap = card.shadowRoot?.querySelector(".chart-wrap");
    if (chartWrap) {
      chartWrap.style.setProperty("--dp-chart-axis-left-width", `${leftWidth}px`);
      chartWrap.style.setProperty("--dp-chart-axis-right-width", `${rightWidth}px`);
    }
    const axisSlotWidth = ChartRenderer.AXIS_SLOT_WIDTH;
    const axisOffset = (axis) => 10 + axis.slot * axisSlotWidth;
    const unitCounts = axes.reduce((counts, axis) => {
      if (!axis?.unit) {
        return counts;
      }
      counts.set(axis.unit, (counts.get(axis.unit) || 0) + 1);
      return counts;
    }, /* @__PURE__ */ new Map());
    const axisTextStyle = (axis) => {
      const duplicateUnit = !!axis?.unit && (unitCounts.get(axis.unit) || 0) > 1;
      if (!duplicateUnit || !axis?.color) {
        return "";
      }
      return `color:${esc$1(axis.color)};`;
    };
    const buildAxisMarkup = (axis) => {
      const labels = (axis.ticks || []).map((tick) => {
        const y2 = renderer.yOf(tick, axis.min, axis.max);
        return `<div class="chart-axis-label" style="top:${Math.round(y2) + 1}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc$1(renderer._formatAxisTick(tick, axis.unit))}</div>`;
      }).join("");
      const unit = axis.unit ? `<div class="chart-axis-unit" style="top:${Math.max(0, renderer.pad.top - 18)}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc$1(axis.unit)}</div>` : "";
      return `${labels}${unit}`;
    };
    const leftAxes = axes.filter((axis) => axis.side !== "right");
    const rightAxes = axes.filter((axis) => axis.side === "right");
    leftEl.innerHTML = leftAxes.length ? `<div class="chart-axis-divider"></div>${leftAxes.map((axis) => buildAxisMarkup(axis)).join("")}` : "";
    rightEl.innerHTML = rightAxes.length ? `<div class="chart-axis-divider"></div>${rightAxes.map((axis) => buildAxisMarkup(axis)).join("")}` : "";
    leftEl.classList.toggle("visible", !!leftAxes.length);
    rightEl.classList.toggle("visible", !!rightAxes.length);
  }
  function renderChartAxisHoverDots(card, hoverValues = []) {
    const leftEl = card.shadowRoot?.getElementById("chart-axis-left");
    const rightEl = card.shadowRoot?.getElementById("chart-axis-right");
    const scrollViewport = card.shadowRoot?.getElementById("chart-scroll-viewport");
    if (!leftEl || !rightEl) return;
    leftEl.querySelectorAll(".chart-axis-hover-dot").forEach((el) => el.remove());
    rightEl.querySelectorAll(".chart-axis-hover-dot").forEach((el) => el.remove());
    const verticalOffset = scrollViewport?.offsetTop || 0;
    hoverValues.filter((entry) => entry?.hasValue !== false && Number.isFinite(entry?.y)).forEach((entry) => {
      const target = entry.axisSide === "right" ? rightEl : leftEl;
      const dot = document.createElement("span");
      dot.className = `chart-axis-hover-dot ${entry.axisSide === "right" ? "right" : "left"}`;
      dot.style.top = `${verticalOffset + entry.y}px`;
      dot.style.background = entry.color || "#03a9f4";
      dot.style.opacity = `${Number.isFinite(entry.opacity) ? entry.opacity : 1}`;
      target.appendChild(dot);
    });
  }
  function clampChartValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function formatTooltipValue(value, unit = "") {
    if (value == null || value === "" || Number.isNaN(Number(value))) return "";
    return `${Number(value).toFixed(2).replace(/\.00$/, "")}${unit ? ` ${unit}` : ""}`;
  }
  function formatTooltipDisplayValue(value, unit = "") {
    if (value == null || value === "") return "No value";
    if (typeof value === "string") {
      return unit ? `${value} ${unit}` : value;
    }
    return formatTooltipValue(value, unit);
  }
  function formatTooltipDateTimeFromMs(timeMs) {
    if (!Number.isFinite(timeMs)) {
      return "";
    }
    return fmtDateTime$1(new Date(timeMs).toISOString());
  }
  const ANOMALY_METHOD_LABELS = {
    trend_residual: "Trend deviation",
    rate_of_change: "Sudden change",
    iqr: "Statistical outlier (IQR)",
    rolling_zscore: "Rolling Z-score",
    persistence: "Flat-line / stuck",
    comparison_window: "Comparison window"
  };
  function buildAnomalyMethodSection(region) {
    if (!region?.cluster?.points?.length) return null;
    const points = region.cluster.points;
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const peakPoint = points.reduce((peak, p2) => !peak || Math.abs(p2.residual) > Math.abs(peak.residual) ? p2 : peak, null);
    if (!peakPoint) return null;
    const label = region.label || region.relatedEntityId || "Series";
    const unit = region.unit || "";
    const cluster = region.cluster;
    const method = cluster.anomalyMethod;
    const methodLabel = ANOMALY_METHOD_LABELS[method] || method;
    let description;
    let alert;
    if (method === "rate_of_change") {
      const rateUnit = unit ? `${unit}/h` : "units/h";
      description = `${label} shows an unusual rate of change between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
      alert = `Peak rate deviation: ${formatTooltipValue(peakPoint.residual, rateUnit)} from a typical rate of ${formatTooltipValue(peakPoint.baselineValue, rateUnit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
    } else if (method === "iqr") {
      description = `${label} contains statistical outliers between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
      alert = `Peak value: ${formatTooltipValue(peakPoint.value, unit)}, deviating ${formatTooltipValue(Math.abs(peakPoint.residual), unit)} from the median at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
    } else if (method === "rolling_zscore") {
      description = `${label} shows statistically unusual values between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
      alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a rolling mean of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
    } else if (method === "persistence") {
      const flatRange = typeof cluster.flatRange === "number" ? cluster.flatRange : null;
      const rangeStr = flatRange !== null ? ` (range: ${formatTooltipValue(flatRange, unit)})` : "";
      description = `${label} appears stuck or flat between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}${rangeStr}.`;
      alert = `Value remained near ${formatTooltipValue(peakPoint.baselineValue, unit)} for an unusually long period.`;
    } else if (method === "comparison_window") {
      description = `${label} deviates significantly from the comparison window between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
      alert = `Peak deviation from comparison: ${formatTooltipValue(peakPoint.residual, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
    } else {
      description = `${label} deviates from its expected trend between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
      alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a baseline of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
    }
    return { methodLabel, description, alert };
  }
  function buildAnomalyTooltipContent(regions) {
    let regionsArray;
    if (Array.isArray(regions)) {
      regionsArray = regions;
    } else if (regions) {
      regionsArray = [regions];
    } else {
      regionsArray = [];
    }
    if (regionsArray.length === 0) return null;
    const sections = regionsArray.map(buildAnomalyMethodSection).filter(Boolean);
    if (sections.length === 0) return null;
    const instruction = "Click the highlighted circle to add an annotation.";
    if (sections.length === 1) {
      const section = sections[0];
      const cluster = regionsArray[0]?.cluster;
      const detectedByMethods = Array.isArray(cluster?.detectedByMethods) && cluster.detectedByMethods.length > 1 ? cluster.detectedByMethods : null;
      const isMultiMethod = detectedByMethods !== null;
      const title = isMultiMethod ? "⚠️ Multi-method Anomaly" : "⚠️ Anomaly Insight";
      const confirmedNote = isMultiMethod ? `
Confirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m2) => ANOMALY_METHOD_LABELS[m2] || m2).join(", ")}.` : "";
      return {
        title,
        description: section.description + confirmedNote,
        alert: `Alert: ${section.alert}`,
        instruction
      };
    }
    const description = sections.map((s2) => `${s2.methodLabel}:
${s2.description}`).join("\n\n");
    const alert = sections.map((s2) => `${s2.methodLabel}: ${s2.alert}`).join("\n");
    return {
      title: "⚠️ Multi-method Anomaly",
      description,
      alert,
      instruction
    };
  }
  function positionTooltip(tooltip, clientX, clientY, bounds = null) {
    tooltip.style.display = "block";
    const tipRect = tooltip.getBoundingClientRect();
    const tipW = tipRect.width || 220;
    const tipH = tipRect.height || 64;
    const gap = 12;
    const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
    const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : window.innerWidth - gap;
    const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
    const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : window.innerHeight - gap;
    let left = clientX + gap;
    if (left + tipW > maxLeft) {
      left = clientX - tipW - gap;
    }
    let top = clientY - tipH - gap;
    if (top < minTop) {
      top = clientY + gap;
    }
    if (top + tipH > maxTop) {
      top = Math.max(minTop, clientY - tipH - gap);
    }
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipW));
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipH));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  function positionAnomalyTooltip(tooltip, clientX, clientY, mainTooltip, bounds = null) {
    if (!tooltip) return;
    tooltip.style.display = "block";
    const tipRect = tooltip.getBoundingClientRect();
    const tipW = tipRect.width || 220;
    const tipH = tipRect.height || 64;
    const gap = 12;
    const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
    const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : window.innerWidth - gap;
    const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
    const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : window.innerHeight - gap;
    let left = clientX - gap - tipW;
    if (left < minLeft) {
      const mainRect2 = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
      left = mainRect2 ? mainRect2.right + gap : clientX + gap;
    }
    const mainRect = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
    let top = mainRect ? mainRect.top : clientY - tipH - gap;
    if (top + tipH > maxTop) top = Math.max(minTop, maxTop - tipH);
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipW));
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipH));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  function positionSecondaryTooltip(tooltip, anchorTooltip, bounds = null) {
    if (!tooltip || !anchorTooltip) {
      return;
    }
    tooltip.style.display = "block";
    const anchorRect = anchorTooltip.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const gap = 10;
    const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
    const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : window.innerWidth - gap;
    const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
    const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : window.innerHeight - gap;
    let left = anchorRect.right + gap;
    if (left + tipRect.width > maxLeft) {
      left = anchorRect.left - tipRect.width - gap;
    }
    let top = anchorRect.top;
    if (top + tipRect.height > maxTop) {
      top = Math.max(minTop, maxTop - tipRect.height);
    }
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipRect.width));
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipRect.height));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  function positionTooltipBelow(tooltip, anchorTooltip, bounds = null) {
    if (!tooltip || !anchorTooltip) {
      return;
    }
    tooltip.style.display = "block";
    const anchorRect = anchorTooltip.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const gap = 8;
    const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
    const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : window.innerWidth - gap;
    const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
    const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : window.innerHeight - gap;
    let left = anchorRect.left;
    if (left + tipRect.width > maxLeft) {
      left = Math.max(minLeft, maxLeft - tipRect.width);
    }
    let top = anchorRect.bottom + gap;
    if (top + tipRect.height > maxTop) {
      top = Math.max(minTop, anchorRect.top - tipRect.height - gap);
    }
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipRect.width));
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipRect.height));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  function getAnnotationTooltipContainer(card) {
    if (!card?.shadowRoot) {
      return null;
    }
    return card.shadowRoot.getElementById("annotation-tooltips");
  }
  function clearAnnotationTooltips(card) {
    const container = getAnnotationTooltipContainer(card);
    if (!container) {
      return;
    }
    container.innerHTML = "";
  }
  function buildAnnotationTooltip(card, event) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip secondary annotation-tooltip";
    const hasValue = event?.chart_value != null && event.chart_value !== "";
    const valueMarkup = hasValue ? `<div class="tt-value">${esc$1(formatTooltipValue(event.chart_value, event.chart_unit))}</div>` : "";
    const message = event?.message || "Data point";
    const annotation = event?.annotation && event.annotation !== event.message ? event.annotation : "";
    const relatedMarkup = buildTooltipRelatedChips(card?._hass, event);
    tooltip.innerHTML = `
    <div class="tt-time">${esc$1(fmtDateTime$1(event.timestamp))}</div>
    ${valueMarkup}
    <div class="tt-message-row">
      <span class="tt-dot" style="background:${esc$1(event?.color || "#03a9f4")}"></span>
      <span class="tt-message">${esc$1(message)}</span>
    </div>
    <div class="tt-annotation" style="display:${annotation ? "block" : "none"}">${esc$1(annotation)}</div>
    <div class="tt-entities" style="display:${relatedMarkup ? "flex" : "none"}">${relatedMarkup}</div>
  `;
    return tooltip;
  }
  function renderAnnotationTooltips(card, hover, anchorTooltip, bounds = null) {
    const container = getAnnotationTooltipContainer(card);
    if (!container) {
      return [];
    }
    clearAnnotationTooltips(card);
    const annotationEvents = Array.isArray(hover?.events) ? hover.events : [];
    if (!annotationEvents.length) {
      return [];
    }
    const renderedTooltips = [];
    let anchorEl = anchorTooltip;
    for (const event of annotationEvents) {
      const tooltip = buildAnnotationTooltip(card, event);
      container.appendChild(tooltip);
      if (renderedTooltips.length === 0) {
        positionSecondaryTooltip(tooltip, anchorEl, bounds);
      } else {
        positionTooltipBelow(tooltip, anchorEl, bounds);
      }
      renderedTooltips.push(tooltip);
      anchorEl = tooltip;
    }
    return renderedTooltips;
  }
  function showTooltip(card, canvas, renderer, event, clientX, clientY) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    const ttTime = card.shadowRoot.getElementById("tt-time");
    const ttValue = card.shadowRoot.getElementById("tt-value");
    const ttSeries = card.shadowRoot.getElementById("tt-series");
    const ttMessageRow = card.shadowRoot.getElementById("tt-message-row");
    const ttDot = card.shadowRoot.getElementById("tt-dot");
    const ttMsg = card.shadowRoot.getElementById("tt-message");
    const ttAnn = card.shadowRoot.getElementById("tt-annotation");
    const ttEntities = card.shadowRoot.getElementById("tt-entities");
    ttTime.textContent = fmtDateTime$1(event.timestamp);
    const hasValue = event.chart_value != null && event.chart_value !== "";
    ttValue.textContent = hasValue ? formatTooltipValue(event.chart_value, event.chart_unit) : "";
    ttValue.style.display = hasValue ? "block" : "none";
    if (ttSeries) {
      ttSeries.innerHTML = "";
      ttSeries.style.display = "none";
    }
    ttDot.style.background = event.color || "#03a9f4";
    ttMsg.textContent = event.message;
    if (ttMessageRow) ttMessageRow.style.display = "flex";
    const ann = event.annotation !== event.message ? event.annotation : "";
    ttAnn.textContent = ann || "";
    ttAnn.style.display = ann ? "block" : "none";
    const relatedMarkup = buildTooltipRelatedChips(card._hass, event);
    ttEntities.innerHTML = relatedMarkup;
    ttEntities.style.display = relatedMarkup ? "flex" : "none";
    const chartBounds = card.shadowRoot?.querySelector(".chart-wrap")?.getBoundingClientRect();
    positionTooltip(tooltip, clientX, clientY, chartBounds ? {
      left: chartBounds.left + 8,
      right: chartBounds.right - 8,
      top: chartBounds.top + 8,
      bottom: chartBounds.bottom - 8
    } : null);
  }
  function hideTooltip(card) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    const anomalyTooltip = card.shadowRoot.getElementById("anomaly-tooltip");
    if (tooltip) {
      tooltip.style.display = "none";
    }
    if (anomalyTooltip) {
      anomalyTooltip.style.display = "none";
    }
    clearAnnotationTooltips(card);
  }
  function resolveTooltipSeriesLabel(entry) {
    const isSubordinate = entry.grouped === true && entry.rawVisible === true;
    if (entry.comparison === true) {
      if (entry.grouped === true) {
        return entry.windowLabel || "Date window";
      }
      return `${entry.windowLabel || "Date window"}: ${entry.label || ""}`;
    }
    if (entry.trend === true) {
      if (isSubordinate) {
        return "Trend";
      }
      return `Trend: ${entry.baseLabel || entry.label || ""}`;
    }
    if (entry.rate === true) {
      if (isSubordinate) {
        return "Rate";
      }
      return `Rate: ${entry.baseLabel || entry.label || ""}`;
    }
    if (entry.delta === true) {
      if (isSubordinate) {
        return "Delta";
      }
      return `Delta: ${entry.baseLabel || entry.label || ""}`;
    }
    if (entry.summary === true) {
      const summaryLabel = String(entry.summaryType || "").toUpperCase();
      if (isSubordinate) {
        return summaryLabel;
      }
      return `${summaryLabel}: ${entry.baseLabel || entry.label || ""}`;
    }
    if (entry.threshold === true) {
      if (isSubordinate) {
        return "Threshold";
      } else {
        return `Threshold: ${entry.baseLabel || entry.label || ""}`;
      }
    } else {
      return entry.label || "";
    }
  }
  function showLineChartTooltip(card, hover, clientX, clientY) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    const ttTime = card.shadowRoot.getElementById("tt-time");
    const ttValue = card.shadowRoot.getElementById("tt-value");
    const ttSeries = card.shadowRoot.getElementById("tt-series");
    const anomalyTooltip = card.shadowRoot.getElementById("anomaly-tooltip");
    const ttSecondaryTitle = card.shadowRoot.getElementById("tt-secondary-title");
    const ttSecondaryDescription = card.shadowRoot.getElementById("tt-secondary-description");
    const ttSecondaryAlert = card.shadowRoot.getElementById("tt-secondary-alert");
    const ttSecondaryInstruction = card.shadowRoot.getElementById("tt-secondary-instruction");
    const ttMessageRow = card.shadowRoot.getElementById("tt-message-row");
    const ttMsg = card.shadowRoot.getElementById("tt-message");
    const ttAnn = card.shadowRoot.getElementById("tt-annotation");
    const ttEntities = card.shadowRoot.getElementById("tt-entities");
    if (!tooltip || !ttTime || !ttValue || !ttMessageRow || !ttMsg || !ttAnn || !ttEntities) {
      return;
    }
    const rangeStartMs = Number.isFinite(hover.rangeStartMs) ? hover.rangeStartMs : hover.timeMs;
    const rangeEndMs = Number.isFinite(hover.rangeEndMs) ? hover.rangeEndMs : hover.timeMs;
    ttTime.textContent = rangeStartMs === rangeEndMs ? fmtDateTime$1(new Date(hover.timeMs).toISOString()) : `${fmtDateTime$1(new Date(rangeStartMs).toISOString())} - ${fmtDateTime$1(new Date(rangeEndMs).toISOString())}`;
    const values = Array.isArray(hover.values) ? hover.values : [];
    const trendValues = Array.isArray(hover.trendValues) ? hover.trendValues : [];
    const rateValues = Array.isArray(hover.rateValues) ? hover.rateValues : [];
    const deltaValues = Array.isArray(hover.deltaValues) ? hover.deltaValues : [];
    const summaryValues = Array.isArray(hover.summaryValues) ? hover.summaryValues : [];
    const thresholdValues = Array.isArray(hover.thresholdValues) ? hover.thresholdValues : [];
    const binaryValues = Array.isArray(hover.binaryValues) ? hover.binaryValues : [];
    const comparisonValues = Array.isArray(hover.comparisonValues) ? hover.comparisonValues : [];
    const displayRows = [];
    const usedTrendRows = /* @__PURE__ */ new Set();
    const usedRateRows = /* @__PURE__ */ new Set();
    const usedDeltaRows = /* @__PURE__ */ new Set();
    const usedSummaryRows = /* @__PURE__ */ new Set();
    const usedThresholdRows = /* @__PURE__ */ new Set();
    const usedComparisonRows = /* @__PURE__ */ new Set();
    values.forEach((entry, index) => {
      displayRows.push(entry);
      trendValues.forEach((trendEntry, trendIndex) => {
        if (usedTrendRows.has(trendIndex)) {
          return;
        }
        const sameEntity = trendEntry.relatedEntityId && trendEntry.relatedEntityId === entry.entityId;
        const sameLabel = !trendEntry.relatedEntityId && trendEntry.baseLabel && trendEntry.baseLabel === entry.label;
        if (!sameEntity && !sameLabel) {
          return;
        }
        usedTrendRows.add(trendIndex);
        displayRows.push({
          ...trendEntry,
          rawVisible: trendEntry.rawVisible !== false,
          grouped: true,
          key: `trend-${index}-${trendIndex}`
        });
      });
      rateValues.forEach((rateEntry, rateIndex) => {
        if (usedRateRows.has(rateIndex)) {
          return;
        }
        const sameEntity = rateEntry.relatedEntityId && rateEntry.relatedEntityId === entry.entityId;
        const sameLabel = !rateEntry.relatedEntityId && rateEntry.baseLabel && rateEntry.baseLabel === entry.label;
        if (!sameEntity && !sameLabel) {
          return;
        }
        usedRateRows.add(rateIndex);
        displayRows.push({
          ...rateEntry,
          rawVisible: rateEntry.rawVisible !== false,
          grouped: true,
          key: `rate-${index}-${rateIndex}`
        });
      });
      deltaValues.forEach((deltaEntry, deltaIndex) => {
        if (usedDeltaRows.has(deltaIndex)) {
          return;
        }
        const sameEntity = deltaEntry.relatedEntityId && deltaEntry.relatedEntityId === entry.entityId;
        const sameLabel = !deltaEntry.relatedEntityId && deltaEntry.baseLabel && deltaEntry.baseLabel === entry.label;
        if (!sameEntity && !sameLabel) {
          return;
        }
        usedDeltaRows.add(deltaIndex);
        displayRows.push({
          ...deltaEntry,
          rawVisible: deltaEntry.rawVisible !== false,
          grouped: true,
          key: `delta-${index}-${deltaIndex}`
        });
      });
      summaryValues.forEach((summaryEntry, summaryIndex) => {
        if (usedSummaryRows.has(summaryIndex)) {
          return;
        }
        const sameEntity = summaryEntry.relatedEntityId && summaryEntry.relatedEntityId === entry.entityId;
        const sameLabel = !summaryEntry.relatedEntityId && summaryEntry.baseLabel && summaryEntry.baseLabel === entry.label;
        if (!sameEntity && !sameLabel) {
          return;
        }
        usedSummaryRows.add(summaryIndex);
        displayRows.push({
          ...summaryEntry,
          rawVisible: summaryEntry.rawVisible !== false,
          grouped: true,
          key: `summary-${index}-${summaryIndex}`
        });
      });
      thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
        if (usedThresholdRows.has(thresholdIndex)) {
          return;
        }
        const sameEntity = thresholdEntry.relatedEntityId && thresholdEntry.relatedEntityId === entry.entityId;
        const sameLabel = !thresholdEntry.relatedEntityId && thresholdEntry.baseLabel && thresholdEntry.baseLabel === entry.label;
        if (!sameEntity && !sameLabel) {
          return;
        }
        usedThresholdRows.add(thresholdIndex);
        displayRows.push({
          ...thresholdEntry,
          rawVisible: thresholdEntry.rawVisible !== false,
          grouped: true,
          key: `threshold-${index}-${thresholdIndex}`
        });
      });
      comparisonValues.forEach((compEntry, compIndex) => {
        if (usedComparisonRows.has(compIndex)) {
          return;
        }
        if (!compEntry.relatedEntityId || compEntry.relatedEntityId !== entry.entityId) {
          return;
        }
        usedComparisonRows.add(compIndex);
        displayRows.push({
          ...compEntry,
          grouped: true,
          comparison: true,
          key: `comparison-${index}-${compIndex}`
        });
      });
    });
    trendValues.forEach((trendEntry, trendIndex) => {
      if (usedTrendRows.has(trendIndex)) {
        return;
      }
      displayRows.push({
        ...trendEntry,
        rawVisible: trendEntry.rawVisible !== false
      });
    });
    rateValues.forEach((rateEntry, rateIndex) => {
      if (usedRateRows.has(rateIndex)) {
        return;
      }
      displayRows.push({
        ...rateEntry,
        rawVisible: rateEntry.rawVisible !== false
      });
    });
    deltaValues.forEach((deltaEntry, deltaIndex) => {
      if (usedDeltaRows.has(deltaIndex)) {
        return;
      }
      displayRows.push({
        ...deltaEntry,
        rawVisible: deltaEntry.rawVisible !== false
      });
    });
    summaryValues.forEach((summaryEntry, summaryIndex) => {
      if (usedSummaryRows.has(summaryIndex)) {
        return;
      }
      displayRows.push({
        ...summaryEntry,
        rawVisible: summaryEntry.rawVisible !== false
      });
    });
    thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
      if (usedThresholdRows.has(thresholdIndex)) {
        return;
      }
      displayRows.push({
        ...thresholdEntry,
        rawVisible: thresholdEntry.rawVisible !== false
      });
    });
    comparisonValues.forEach((compEntry, compIndex) => {
      if (usedComparisonRows.has(compIndex)) {
        return;
      }
      displayRows.push({ ...compEntry, comparison: true });
    });
    displayRows.push(...binaryValues);
    const useSingleValueMode = values.length === 1 && trendValues.length === 0 && rateValues.length === 0 && deltaValues.length === 0 && summaryValues.length === 0 && thresholdValues.length === 0 && comparisonValues.length === 0 && binaryValues.length === 0;
    if (useSingleValueMode) {
      const value = displayRows[0];
      ttValue.textContent = value ? formatTooltipDisplayValue(value.value, value.unit) : "";
      ttValue.style.display = value ? "block" : "none";
      if (ttSeries) {
        ttSeries.innerHTML = "";
        ttSeries.style.display = "none";
      }
    } else {
      ttValue.textContent = "";
      ttValue.style.display = "none";
      if (ttSeries) {
        ttSeries.innerHTML = displayRows.map((entry) => `
        <div class="tt-series-row ${entry.grouped === true && entry.rawVisible === true ? "subordinate" : ""}">
          <div class="tt-series-main">
            ${entry.grouped === true && entry.rawVisible === true ? "" : `<span class="tt-dot" style="background:${esc$1(entry.color || "#03a9f4")}"></span>`}
            <span class="tt-series-label">${esc$1(resolveTooltipSeriesLabel(entry))}</span>
          </div>
          <span class="tt-series-value">${esc$1(formatTooltipDisplayValue(entry.value, entry.unit))}</span>
        </div>
      `).join("");
        ttSeries.style.display = displayRows.length ? "grid" : "none";
      }
    }
    ttMessageRow.style.display = "none";
    ttMsg.textContent = "";
    ttAnn.textContent = "";
    ttAnn.style.display = "none";
    ttEntities.innerHTML = "";
    ttEntities.style.display = "none";
    if (anomalyTooltip && ttSecondaryTitle && ttSecondaryDescription && ttSecondaryAlert && ttSecondaryInstruction) {
      const anomalyContent = buildAnomalyTooltipContent(hover.anomalyRegions);
      if (anomalyContent) {
        ttSecondaryTitle.textContent = anomalyContent.title;
        ttSecondaryDescription.textContent = anomalyContent.description;
        ttSecondaryAlert.textContent = anomalyContent.alert;
        ttSecondaryInstruction.textContent = anomalyContent.instruction;
      } else {
        ttSecondaryTitle.textContent = "";
        ttSecondaryDescription.textContent = "";
        ttSecondaryAlert.textContent = "";
        ttSecondaryInstruction.textContent = "";
        anomalyTooltip.style.display = "none";
      }
    }
    const chartBounds = card.shadowRoot?.querySelector(".chart-wrap")?.getBoundingClientRect();
    positionTooltip(tooltip, clientX, clientY, chartBounds ? {
      left: chartBounds.left + 8,
      right: chartBounds.right - 8,
      top: chartBounds.top + 8,
      bottom: chartBounds.bottom - 8
    } : null);
    const annotationTooltips = renderAnnotationTooltips(card, hover, tooltip, chartBounds ? {
      left: chartBounds.left + 8,
      right: chartBounds.right - 8,
      top: chartBounds.top + 8,
      bottom: chartBounds.bottom - 8
    } : null);
    annotationTooltips[annotationTooltips.length - 1] || tooltip;
    if (anomalyTooltip && hover.anomalyRegions?.length > 0) {
      positionAnomalyTooltip(anomalyTooltip, clientX, clientY, tooltip, chartBounds ? {
        left: chartBounds.left + 8,
        right: chartBounds.right - 8,
        top: chartBounds.top + 8,
        bottom: chartBounds.bottom - 8
      } : null);
    }
  }
  function buildTooltipRelatedChips(hass, event) {
    const entities = Array.isArray(event?.entity_ids) ? event.entity_ids : [];
    const devices = Array.isArray(event?.device_ids) ? event.device_ids : [];
    const areas = Array.isArray(event?.area_ids) ? event.area_ids : [];
    const labels = Array.isArray(event?.label_ids) ? event.label_ids : [];
    const chips = [
      ...entities.map((id) => ({
        icon: entityIcon$1(hass, id),
        label: entityName$1(hass, id)
      })),
      ...devices.map((id) => ({
        icon: deviceIcon$1(hass, id),
        label: deviceName$1(hass, id)
      })),
      ...areas.map((id) => ({
        icon: areaIcon$1(hass, id),
        label: areaName$1(hass, id)
      })),
      ...labels.map((id) => ({
        icon: labelIcon$1(hass, id),
        label: labelName$1(hass, id)
      }))
    ].filter((chip) => chip.label);
    if (!chips.length) return "";
    return chips.map((chip) => `
    <span class="tt-entity-chip" title="${esc$1(chip.label)}">
      <ha-icon icon="${esc$1(chip.icon)}"></ha-icon>
      <span>${esc$1(chip.label)}</span>
    </span>
  `).join("");
  }
  function showLineChartCrosshair(card, renderer, hover) {
    const overlay = card.shadowRoot.getElementById("chart-crosshair");
    const vertical = card.shadowRoot.getElementById("crosshair-vertical");
    const horizontal = card.shadowRoot.getElementById("crosshair-horizontal");
    const points = card.shadowRoot.getElementById("crosshair-points");
    const addButton = card.shadowRoot.getElementById("chart-add-annotation");
    if (!overlay || !vertical || !horizontal || !points) return;
    overlay.hidden = false;
    vertical.style.left = `${hover.x}px`;
    if (hover.splitVertical) {
      vertical.style.top = `${hover.splitVertical.top}px`;
      vertical.style.height = `${hover.splitVertical.height}px`;
    } else {
      vertical.style.top = `${renderer.pad.top}px`;
      vertical.style.height = `${renderer.ch}px`;
    }
    horizontal.hidden = true;
    const crosshairValues = [
      ...hover.values || [],
      ...hover.showTrendCrosshairs === true ? (hover.trendValues || []).filter((entry) => entry.showCrosshair === true) : [],
      ...hover.rateValues || [],
      ...hover.comparisonValues || []
    ];
    points.innerHTML = `
    ${crosshairValues.filter((entry) => entry.hasValue !== false).map((entry) => `
      <span
        class="crosshair-line horizontal series ${hover.emphasizeGuides ? "emphasized" : "subtle"}"
        style="top:${entry.y}px;color:${esc$1(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
      ></span>
    `).join("")}
    ${crosshairValues.filter((entry) => entry.hasValue !== false).map((entry) => `
    <span
      class="crosshair-point"
      style="left:${entry.x}px;top:${entry.y}px;background:${esc$1(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
    ></span>
    `).join("")}
  `;
    renderChartAxisHoverDots(card, crosshairValues);
    if (addButton) {
      addButton.hidden = false;
      addButton.style.left = `${hover.x}px`;
      if (hover.splitVertical) {
        addButton.style.top = `${hover.splitVertical.top + hover.splitVertical.height}px`;
      } else {
        addButton.style.top = `${renderer.pad.top + renderer.ch}px`;
      }
    }
  }
  function dispatchLineChartHover(card, hover) {
    card.dispatchEvent(new CustomEvent("hass-datapoints-chart-hover", {
      bubbles: true,
      composed: true,
      detail: hover ? { timeMs: hover.timeMs } : { timeMs: null }
    }));
  }
  function hideLineChartHover(card) {
    dispatchLineChartHover(card, null);
    hideTooltip(card);
    const overlay = card.shadowRoot.getElementById("chart-crosshair");
    const points = card.shadowRoot.getElementById("crosshair-points");
    const addButton = card.shadowRoot.getElementById("chart-add-annotation");
    if (overlay) overlay.hidden = true;
    if (points) points.innerHTML = "";
    renderChartAxisHoverDots(card, []);
    const horizontal = card.shadowRoot.getElementById("crosshair-horizontal");
    if (horizontal) horizontal.hidden = true;
    if (addButton) addButton.hidden = true;
  }
  function attachLineChartHover(card, canvas, renderer, series, events, t0, t1, vMin, vMax, axes = null, options = {}) {
    if (!canvas || !renderer) return;
    if (card._chartHoverCleanup) {
      card._chartHoverCleanup();
      card._chartHoverCleanup = null;
    }
    const eventThresholdMs = renderer.cw ? 14 * ((t1 - t0) / renderer.cw) : 0;
    const binaryStates = Array.isArray(options.binaryStates) ? options.binaryStates : [];
    const comparisonSeries = Array.isArray(options.comparisonSeries) ? options.comparisonSeries : [];
    const trendSeries = Array.isArray(options.trendSeries) ? options.trendSeries : [];
    const rateSeries = Array.isArray(options.rateSeries) ? options.rateSeries : [];
    const deltaSeries = Array.isArray(options.deltaSeries) ? options.deltaSeries : [];
    const summarySeries = Array.isArray(options.summarySeries) ? options.summarySeries : [];
    const thresholdSeries = Array.isArray(options.thresholdSeries) ? options.thresholdSeries : [];
    const anomalyRegions = Array.isArray(options.anomalyRegions) ? options.anomalyRegions : [];
    if (!series?.length && !binaryStates.length && !comparisonSeries.length && !trendSeries.length && !rateSeries.length && !deltaSeries.length && !summarySeries.length && !thresholdSeries.length && !anomalyRegions.length) return;
    const hoverSurfaceEl = options.hoverSurfaceEl || null;
    const addAnnotationButton = card.shadowRoot?.getElementById("chart-add-annotation") || null;
    const findAnomalyRegions = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return [];
      }
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const hits = [];
      for (const region of anomalyRegions) {
        const radiusX = Number(region?.radiusX) || 0;
        const radiusY = Number(region?.radiusY) || 0;
        if (radiusX <= 0 || radiusY <= 0) {
          continue;
        }
        const dx = (localX - region.centerX) / radiusX;
        const dy = (localY - region.centerY) / radiusY;
        if (dx * dx + dy * dy <= 1) {
          hits.push(region);
        }
      }
      return hits;
    };
    const buildHoverState = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || !renderer.cw || !renderer.ch) return null;
      const localX = clampChartValue(clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
      const localY = clampChartValue(clientY - rect.top, renderer.pad.top, renderer.pad.top + renderer.ch);
      const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
      const timeMs = t0 + ratio * (t1 - t0);
      const x2 = renderer.xOf(timeMs, t0, t1);
      const values = series.map((seriesItem) => {
        const value = renderer._interpolateValue(seriesItem.pts, timeMs);
        const axis = seriesItem.axis || axes && axes[0] || { min: vMin, max: vMax };
        if (value == null) {
          return {
            entityId: seriesItem.entityId,
            label: seriesItem.label || seriesItem.entityId || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0
          };
        }
        return {
          entityId: seriesItem.entityId,
          label: seriesItem.label || seriesItem.entityId || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          x: x2,
          y: renderer.yOf(value, axis.min, axis.max),
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0
        };
      });
      const comparisonValues = comparisonSeries.map((seriesItem) => {
        const value = renderer._interpolateValue(seriesItem.pts, timeMs);
        const axis = seriesItem.axis || axes && axes[0] || { min: vMin, max: vMax };
        if (value == null) {
          return {
            entityId: seriesItem.entityId,
            label: seriesItem.label || seriesItem.entityId || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0
          };
        }
        return {
          entityId: seriesItem.entityId,
          label: seriesItem.label || seriesItem.entityId || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          x: x2,
          y: renderer.yOf(value, axis.min, axis.max),
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0
        };
      });
      const trendValues = trendSeries.map((seriesItem) => {
        const value = renderer._interpolateValue(seriesItem.pts, timeMs);
        const axis = seriesItem.axis || axes && axes[0] || { min: vMin, max: vMax };
        if (value == null) {
          return {
            entityId: seriesItem.entityId,
            relatedEntityId: seriesItem.relatedEntityId || "",
            label: seriesItem.label || seriesItem.entityId || "",
            baseLabel: seriesItem.baseLabel || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
            trend: true,
            rawVisible: seriesItem.rawVisible !== false,
            showCrosshair: seriesItem.showCrosshair === true
          };
        }
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          x: x2,
          y: renderer.yOf(value, axis.min, axis.max),
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          trend: true,
          rawVisible: seriesItem.rawVisible !== false,
          showCrosshair: seriesItem.showCrosshair === true
        };
      });
      const rateValues = rateSeries.map((seriesItem) => {
        const value = renderer._interpolateValue(seriesItem.pts, timeMs);
        const axis = seriesItem.axis || axes && axes[0] || { min: vMin, max: vMax };
        if (value == null) {
          return {
            entityId: seriesItem.entityId,
            relatedEntityId: seriesItem.relatedEntityId || "",
            label: seriesItem.label || seriesItem.entityId || "",
            baseLabel: seriesItem.baseLabel || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
            rate: true,
            rawVisible: seriesItem.rawVisible !== false
          };
        }
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          x: x2,
          y: renderer.yOf(value, axis.min, axis.max),
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          rate: true,
          rawVisible: seriesItem.rawVisible !== false
        };
      });
      const deltaValues = deltaSeries.map((seriesItem) => {
        const value = renderer._interpolateValue(seriesItem.pts, timeMs);
        const axis = seriesItem.axis || axes && axes[0] || { min: vMin, max: vMax };
        if (value == null) {
          return {
            entityId: seriesItem.entityId,
            relatedEntityId: seriesItem.relatedEntityId || "",
            label: seriesItem.label || seriesItem.entityId || "",
            baseLabel: seriesItem.baseLabel || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
            delta: true,
            rawVisible: seriesItem.rawVisible !== false
          };
        }
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          x: x2,
          y: renderer.yOf(value, axis.min, axis.max),
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          delta: true,
          rawVisible: seriesItem.rawVisible !== false
        };
      });
      const summaryValues = summarySeries.map((seriesItem) => {
        const axis = seriesItem.axis || axes && axes[0] || {};
        const value = Number(seriesItem.value);
        if (!Number.isFinite(value)) {
          return {
            entityId: seriesItem.entityId,
            relatedEntityId: seriesItem.relatedEntityId || "",
            label: seriesItem.label || seriesItem.entityId || "",
            baseLabel: seriesItem.baseLabel || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
            summaryType: seriesItem.summaryType || "",
            summary: true,
            rawVisible: seriesItem.rawVisible !== false
          };
        }
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          summaryType: seriesItem.summaryType || "",
          summary: true,
          rawVisible: seriesItem.rawVisible !== false
        };
      });
      const thresholdValues = thresholdSeries.map((seriesItem) => {
        const axis = seriesItem.axis || axes && axes[0] || {};
        const value = Number(seriesItem.value);
        if (!Number.isFinite(value)) {
          return {
            entityId: seriesItem.entityId,
            relatedEntityId: seriesItem.relatedEntityId || "",
            label: seriesItem.label || seriesItem.entityId || "",
            baseLabel: seriesItem.baseLabel || "",
            value: null,
            unit: seriesItem.unit || "",
            color: seriesItem.color,
            opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
            hasValue: false,
            axisSide: axis.side === "right" ? "right" : "left",
            axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
            threshold: true,
            rawVisible: seriesItem.rawVisible !== false
          };
        }
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: true,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          threshold: true,
          rawVisible: seriesItem.rawVisible !== false
        };
      });
      const plottedValues = [
        ...values.filter((entry) => entry?.hasValue !== false),
        ...comparisonValues.filter((entry) => entry?.hasValue !== false),
        ...rateValues.filter((entry) => entry?.hasValue !== false),
        ...options.showTrendCrosshairs === true ? trendValues.filter((entry) => entry?.hasValue !== false && entry.showCrosshair === true) : []
      ];
      let rangeStartMs = timeMs;
      let rangeEndMs = timeMs;
      let primary = plottedValues[0] || null;
      if (primary) {
        for (const entry of plottedValues) {
          if (Math.abs(entry.y - localY) < Math.abs(primary.y - localY)) {
            primary = entry;
          }
        }
      }
      const activePrimarySeries = primary ? series.find((seriesItem) => seriesItem.entityId === primary.entityId) || null : null;
      if (activePrimarySeries?.pts?.length) {
        const pts = activePrimarySeries.pts;
        let previous = null;
        let next = null;
        let previousIndex = -1;
        let nextIndex = -1;
        for (let index = 0; index < pts.length; index += 1) {
          const point = pts[index];
          if (point[0] <= timeMs) previous = point;
          if (point[0] <= timeMs) previousIndex = index;
          if (point[0] >= timeMs) {
            next = point;
            nextIndex = index;
            break;
          }
        }
        if (previous && next) {
          const prevPrev = pts[Math.max(0, previousIndex - 1)] || previous;
          const nextNext = pts[Math.min(pts.length - 1, nextIndex + 1)] || next;
          rangeStartMs = previous === next ? previous[0] : Math.round((previous[0] + prevPrev[0]) / 2);
          rangeEndMs = previous === next ? next[0] : Math.round((next[0] + nextNext[0]) / 2);
        } else if (previous) {
          rangeStartMs = previous[0];
          rangeEndMs = previous[0];
        } else if (next) {
          rangeStartMs = next[0];
          rangeEndMs = next[0];
        }
      }
      const binaryValues = binaryStates.map((entry) => {
        const activeSpan = (entry.spans || []).find((span) => timeMs >= span.start && timeMs <= span.end);
        return {
          label: entry.label || entry.entityId || "",
          value: activeSpan ? entry.onLabel || "on" : entry.offLabel || "off",
          unit: "",
          color: entry.color,
          active: !!activeSpan
        };
      }).filter(Boolean);
      if (!values.length && !binaryValues.length && !trendValues.length && !rateValues.length && !deltaValues.length && !summaryValues.length && !thresholdValues.length && !comparisonValues.length) {
        return null;
      }
      const fallbackY = renderer.pad.top + 12;
      const hoverY = primary ? primary.y : fallbackY;
      const hoveredEvents = [];
      for (const event of events || []) {
        const eventTime = new Date(event.timestamp).getTime();
        if (eventTime < t0 || eventTime > t1) {
          continue;
        }
        const distance = Math.abs(eventTime - timeMs);
        if (distance <= eventThresholdMs) {
          hoveredEvents.push({
            ...event,
            _hoverDistanceMs: distance
          });
        }
      }
      hoveredEvents.sort((left, right) => {
        const distanceDelta = (left._hoverDistanceMs || 0) - (right._hoverDistanceMs || 0);
        if (distanceDelta !== 0) {
          return distanceDelta;
        }
        return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
      });
      const normalizedHoveredEvents = hoveredEvents.map(({ _hoverDistanceMs, ...event }) => event);
      return {
        x: x2,
        y: hoverY,
        timeMs,
        rangeStartMs,
        rangeEndMs,
        values,
        trendValues,
        rateValues,
        deltaValues: options.showDeltaTooltip === true ? deltaValues : [],
        summaryValues,
        thresholdValues,
        comparisonValues,
        binaryValues,
        primary,
        event: normalizedHoveredEvents[0] || null,
        events: normalizedHoveredEvents,
        emphasizeGuides: options.emphasizeHoverGuides === true,
        showTrendCrosshairs: options.showTrendCrosshairs === true,
        hideRawData: options.hideRawData === true
      };
    };
    const showFromPointer = (clientX, clientY) => {
      if (card._chartZoomDragging) return;
      const anomalyRegionsHit = findAnomalyRegions(clientX, clientY);
      const hover = buildHoverState(clientX, clientY);
      if (!hover) {
        card._chartLastHover = null;
        hideLineChartHover(card);
        canvas.style.cursor = "default";
        return;
      }
      hover.anomalyRegions = anomalyRegionsHit;
      card._chartLastHover = hover;
      showLineChartCrosshair(card, renderer, hover);
      if (options.showTooltip !== false || Array.isArray(hover.events) && hover.events.length > 0) {
        showLineChartTooltip(card, hover, clientX, clientY);
      } else {
        hideTooltip(card);
      }
      dispatchLineChartHover(card, hover);
      canvas.style.cursor = anomalyRegionsHit.length > 0 ? "pointer" : "crosshair";
    };
    const hideHover = () => {
      card._chartLastHover = null;
      hideLineChartHover(card);
      canvas.style.cursor = "default";
    };
    const onMouseMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
    const onMouseLeave = (ev) => {
      const nextTarget = ev.relatedTarget;
      if (nextTarget && hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget)) return;
      if (nextTarget && addAnnotationButton && addAnnotationButton.contains(nextTarget)) return;
      hideHover();
    };
    const onOverlayMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
    const onOverlayLeave = (ev) => {
      const nextTarget = ev.relatedTarget;
      if (nextTarget && canvas.contains(nextTarget)) return;
      if (nextTarget && addAnnotationButton && addAnnotationButton.contains(nextTarget)) return;
      hideHover();
    };
    const onAddButtonLeave = (ev) => {
      const nextTarget = ev.relatedTarget;
      if (nextTarget && (canvas.contains(nextTarget) || hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget))) return;
      hideHover();
    };
    const onAddButtonClick = (ev) => {
      if (typeof options.onAddAnnotation !== "function" || !card._chartLastHover) return;
      ev.preventDefault();
      ev.stopPropagation();
      options.onAddAnnotation(card._chartLastHover, ev);
    };
    const onContextMenu = (ev) => {
      if (typeof options.onContextMenu !== "function") return;
      const hover = buildHoverState(ev.clientX, ev.clientY);
      if (!hover) return;
      ev.preventDefault();
      card._chartLastHover = hover;
      showLineChartCrosshair(card, renderer, hover);
      showLineChartTooltip(card, hover, ev.clientX, ev.clientY);
      dispatchLineChartHover(card, hover);
      options.onContextMenu(hover, ev);
    };
    const onClick = (ev) => {
      if (typeof options.onAnomalyClick !== "function") {
        return;
      }
      const regions = findAnomalyRegions(ev.clientX, ev.clientY);
      if (!regions.length) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      options.onAnomalyClick(regions, ev);
    };
    let touchTimer = null;
    const scheduleTouchHide = () => {
      if (touchTimer) window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => hideHover(), 1800);
    };
    const onTouchStart = (ev) => {
      ev.preventDefault();
      const touch = ev.touches[0];
      if (!touch) return;
      showFromPointer(touch.clientX, touch.clientY);
      scheduleTouchHide();
    };
    const onTouchMove = (ev) => {
      ev.preventDefault();
      const touch = ev.touches[0];
      if (!touch) return;
      showFromPointer(touch.clientX, touch.clientY);
      scheduleTouchHide();
    };
    const onTouchEnd = () => scheduleTouchHide();
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    hoverSurfaceEl?.addEventListener("mousemove", onOverlayMove);
    hoverSurfaceEl?.addEventListener("mouseleave", onOverlayLeave);
    addAnnotationButton?.addEventListener("mouseleave", onAddButtonLeave);
    addAnnotationButton?.addEventListener("click", onAddButtonClick);
    card._chartHoverCleanup = () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      hoverSurfaceEl?.removeEventListener("mousemove", onOverlayMove);
      hoverSurfaceEl?.removeEventListener("mouseleave", onOverlayLeave);
      addAnnotationButton?.removeEventListener("mouseleave", onAddButtonLeave);
      addAnnotationButton?.removeEventListener("click", onAddButtonClick);
      if (touchTimer) {
        window.clearTimeout(touchTimer);
        touchTimer = null;
      }
      hideHover();
    };
  }
  function attachLineChartRangeZoom(card, canvas, renderer, t0, t1, options = {}) {
    if (!canvas || !renderer) return;
    if (card._chartZoomCleanup) {
      card._chartZoomCleanup();
      card._chartZoomCleanup = null;
    }
    const selection = card.shadowRoot.getElementById("chart-zoom-selection");
    if (!selection) return;
    let pointerId = null;
    let startX = 0;
    let currentX = 0;
    let dragging = false;
    const hideSelection = () => {
      selection.hidden = true;
      selection.classList.remove("visible");
    };
    const clientXToTime = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const localX = clampChartValue(clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
      const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
      return t0 + ratio * (t1 - t0);
    };
    const inPlotBounds = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      return localX >= renderer.pad.left && localX <= renderer.pad.left + renderer.cw && localY >= renderer.pad.top && localY <= renderer.pad.top + renderer.ch;
    };
    const renderSelection = () => {
      const left = Math.min(startX, currentX);
      const width = Math.abs(currentX - startX);
      selection.style.left = `${left}px`;
      selection.style.top = `${renderer.pad.top}px`;
      selection.style.width = `${width}px`;
      selection.style.height = `${renderer.ch}px`;
      selection.hidden = false;
      selection.classList.add("visible");
    };
    const emitPreview = () => {
      if (!dragging || Math.abs(currentX - startX) < 8) {
        options.onPreview?.(null);
        return;
      }
      const rectLeft = canvas.getBoundingClientRect().left;
      const startTime = Math.min(
        clientXToTime(rectLeft + startX),
        clientXToTime(rectLeft + currentX)
      );
      const endTime = Math.max(
        clientXToTime(rectLeft + startX),
        clientXToTime(rectLeft + currentX)
      );
      options.onPreview?.({ startTime, endTime });
    };
    const resetDragging = (clearPreview = true) => {
      pointerId = null;
      dragging = false;
      card._chartZoomDragging = false;
      hideSelection();
      if (clearPreview) options.onPreview?.(null);
    };
    const onPointerMove = (ev) => {
      if (pointerId == null || ev.pointerId !== pointerId) return;
      currentX = clampChartValue(ev.clientX - canvas.getBoundingClientRect().left, renderer.pad.left, renderer.pad.left + renderer.cw);
      const movedPx = Math.abs(currentX - startX);
      if (!dragging && movedPx < 6) return;
      dragging = true;
      card._chartZoomDragging = true;
      hideLineChartHover(card);
      renderSelection();
      emitPreview();
      ev.preventDefault();
    };
    const finish = (ev) => {
      if (pointerId == null || ev.pointerId !== pointerId) return;
      const didDrag = dragging;
      const endX = currentX;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (!didDrag || Math.abs(endX - startX) < 8) {
        resetDragging(true);
        return;
      }
      const rectLeft = canvas.getBoundingClientRect().left;
      const startTime = Math.min(clientXToTime(rectLeft + startX), clientXToTime(rectLeft + endX));
      const endTime = Math.max(clientXToTime(rectLeft + startX), clientXToTime(rectLeft + endX));
      options.onZoom?.({ startTime, endTime });
      resetDragging(false);
    };
    const onPointerDown = (ev) => {
      if (ev.button !== 0 || !inPlotBounds(ev.clientX, ev.clientY)) return;
      pointerId = ev.pointerId;
      const rect = canvas.getBoundingClientRect();
      startX = clampChartValue(ev.clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
      currentX = startX;
      dragging = false;
      card._chartZoomDragging = false;
      options.onPreview?.(null);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
    };
    const onDoubleClick = (ev) => {
      if (!inPlotBounds(ev.clientX, ev.clientY)) return;
      if (!options.onReset) return;
      ev.preventDefault();
      options.onReset();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("dblclick", onDoubleClick);
    card._chartZoomCleanup = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      resetDragging();
    };
  }
  function attachTooltipBehaviour(card, canvas, renderer, events, t0, t1) {
    function findNearest(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x2 = clientX - rect.left;
      const msPerPx = (t1 - t0) / renderer.cw;
      const threshold = 14 * msPerPx;
      const tAtX = t0 + (x2 - renderer.pad.left) / renderer.cw * (t1 - t0);
      let best = null;
      let bestDist = Infinity;
      for (const ev of events) {
        const t2 = new Date(ev.timestamp).getTime();
        if (t2 < t0 || t2 > t1) continue;
        const d2 = Math.abs(t2 - tAtX);
        if (d2 < threshold && d2 < bestDist) {
          bestDist = d2;
          best = ev;
        }
      }
      return best;
    }
    canvas.addEventListener("mousemove", (e2) => {
      const best = findNearest(e2.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, e2.clientX, e2.clientY);
        canvas.style.cursor = "pointer";
      } else {
        hideTooltip(card);
        canvas.style.cursor = "default";
      }
    });
    canvas.addEventListener("mouseleave", () => hideTooltip(card));
    let touchTimer = null;
    canvas.addEventListener("touchstart", (e2) => {
      e2.preventDefault();
      const touch = e2.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip(card), 3e3);
      } else {
        hideTooltip(card);
      }
    }, { passive: false });
    canvas.addEventListener("touchmove", (e2) => {
      e2.preventDefault();
      const touch = e2.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip(card), 3e3);
      } else {
        hideTooltip(card);
      }
    }, { passive: false });
  }
  function createHiddenSeriesSet(seriesSettings = []) {
    return new Set(
      (Array.isArray(seriesSettings) ? seriesSettings : []).filter((entry) => entry?.visible === false).map((entry) => entry.entity_id || entry.entity || entry.entityId).filter(Boolean)
    );
  }
  function createHiddenEventIdSet(hiddenEventIds = []) {
    return new Set((Array.isArray(hiddenEventIds) ? hiddenEventIds : []).filter(Boolean));
  }
  const DATA_RANGE_CACHE_TTL_MS = 10 * 60 * 1e3;
  const DATA_RANGE_CACHE_LIVE_EDGE_MS = 5 * 60 * 1e3;
  const _dataRangeCache = /* @__PURE__ */ new Map();
  function normalizeCacheIdList(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))].sort();
  }
  function shouldUseStableRangeCache(endTime) {
    const endMs = new Date(endTime || 0).getTime();
    if (!Number.isFinite(endMs)) {
      return false;
    }
    return endMs < Date.now() - DATA_RANGE_CACHE_LIVE_EDGE_MS;
  }
  function getCachedRangePromise(key) {
    const entry = _dataRangeCache.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      _dataRangeCache.delete(key);
      return null;
    }
    return entry.promise;
  }
  function setCachedRangePromise(key, promise) {
    _dataRangeCache.set(key, {
      promise,
      expiresAt: Date.now() + DATA_RANGE_CACHE_TTL_MS
    });
    return promise;
  }
  function withStableRangeCache(key, endTime, loader) {
    if (!shouldUseStableRangeCache(endTime)) {
      return Promise.resolve().then(loader);
    }
    const cached = getCachedRangePromise(key);
    if (cached) {
      return cached;
    }
    const promise = Promise.resolve().then(loader).catch((err) => {
      _dataRangeCache.delete(key);
      throw err;
    });
    return setCachedRangePromise(key, promise);
  }
  function clearStableRangeCacheMatching(predicate) {
    if (typeof predicate !== "function") {
      return 0;
    }
    let deletedCount = 0;
    [..._dataRangeCache.keys()].forEach((key) => {
      if (predicate(key) === true) {
        _dataRangeCache.delete(key);
        deletedCount += 1;
      }
    });
    return deletedCount;
  }
  async function fetchHistoryDuringPeriod(hass, startTime, endTime, entityIds, options = {}) {
    const normalizedEntityIds = normalizeCacheIdList(entityIds);
    const cacheKey = JSON.stringify({
      type: "history/history_during_period",
      start_time: startTime,
      end_time: endTime,
      entity_ids: normalizedEntityIds,
      include_start_time_state: options.include_start_time_state !== false,
      significant_changes_only: !!options.significant_changes_only,
      no_attributes: options.no_attributes !== false
    });
    return withStableRangeCache(cacheKey, endTime, () => hass.connection.sendMessagePromise({
      type: "history/history_during_period",
      start_time: startTime,
      end_time: endTime,
      entity_ids: normalizedEntityIds,
      include_start_time_state: options.include_start_time_state !== false,
      significant_changes_only: !!options.significant_changes_only,
      no_attributes: options.no_attributes !== false
    }));
  }
  async function fetchStatisticsDuringPeriod(hass, startTime, endTime, statisticIds, options = {}) {
    const normalizedStatisticIds = normalizeCacheIdList(statisticIds);
    const normalizedTypes = normalizeCacheIdList(options.types);
    const cacheKey = JSON.stringify({
      type: "recorder/statistics_during_period",
      start_time: startTime,
      end_time: endTime,
      statistic_ids: normalizedStatisticIds,
      period: options.period || "hour",
      types: normalizedTypes
    });
    return withStableRangeCache(cacheKey, endTime, () => hass.connection.sendMessagePromise({
      type: "recorder/statistics_during_period",
      start_time: startTime,
      end_time: endTime,
      statistic_ids: normalizedStatisticIds,
      period: options.period || "hour",
      types: normalizedTypes,
      units: options.units || {}
    }));
  }
  async function fetchEvents$1(hass, startTime, endTime, entityIds) {
    try {
      const normalizedEntityIds = normalizeCacheIdList(entityIds);
      const cacheKey = JSON.stringify({
        type: `${DOMAIN$1}/events`,
        start_time: startTime,
        end_time: endTime,
        entity_ids: normalizedEntityIds
      });
      return await withStableRangeCache(cacheKey, endTime, async () => {
        const msg = {
          type: `${DOMAIN$1}/events`,
          start_time: startTime,
          end_time: endTime
        };
        if (normalizedEntityIds.length) {
          msg.entity_ids = normalizedEntityIds;
        }
        const result = await hass.connection.sendMessagePromise(msg);
        return result.events || [];
      });
    } catch (err) {
      logger.warn("[hass-datapoints] fetchEvents failed:", err);
      return [];
    }
  }
  function invalidateEventsCache() {
    return clearStableRangeCacheMatching((key) => {
      if (typeof key !== "string") {
        return false;
      }
      return key.includes(`"type":"${DOMAIN$1}/events"`);
    });
  }
  async function fetchEventBounds(hass) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: `${DOMAIN$1}/events_bounds`
      });
      return {
        start: result?.start_time || null,
        end: result?.end_time || null
      };
    } catch (err) {
      logger.warn("[hass-datapoints] fetchEventBounds failed:", err);
      return { start: null, end: null };
    }
  }
  async function deleteEvent$1(hass, eventId) {
    const result = await hass.connection.sendMessagePromise({
      type: `${DOMAIN$1}/events/delete`,
      event_id: eventId
    });
    invalidateEventsCache();
    window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    return result;
  }
  async function updateEvent$1(hass, eventId, fields) {
    const result = await hass.connection.sendMessagePromise({
      type: `${DOMAIN$1}/events/update`,
      event_id: eventId,
      ...fields
    });
    invalidateEventsCache();
    window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    return result;
  }
  const PANEL_HISTORY_SAVED_PAGE_KEY = "hass_datapoints:saved_page_v1";
  async function fetchUserData(hass, key, defaultValue = null) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: "frontend/get_user_data",
        key
      });
      return result?.value ?? defaultValue;
    } catch (err) {
      logger.warn("[hass-datapoints] fetchUserData failed:", err);
      return defaultValue;
    }
  }
  async function saveUserData(hass, key, value) {
    try {
      await hass.connection.sendMessagePromise({
        type: "frontend/set_user_data",
        key,
        value
      });
    } catch (err) {
      logger.warn("[hass-datapoints] saveUserData failed:", err);
    }
  }
  function parseDateValue(value) {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function createChartZoomRange(startValue, endValue) {
    const start = parseDateValue(startValue)?.getTime();
    const end = parseDateValue(endValue)?.getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : null;
  }
  function normalizeEntityIds(value) {
    if (!value) {
      return [];
    }
    return (Array.isArray(value) ? value : [value]).map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean);
  }
  function normalizeTargetValue(targetValue) {
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
        ...normalizeEntityIds(targetValue.entities)
      ],
      device_id: normalizeEntityIds(targetValue.device_id),
      area_id: normalizeEntityIds(targetValue.area_id),
      label_id: normalizeEntityIds(targetValue.label_id)
    };
    return Object.fromEntries(
      Object.entries(normalized).filter(([, entries]) => entries.length)
    );
  }
  function normalizeTargetSelection(targetValue) {
    const normalized = normalizeTargetValue(targetValue);
    return {
      entity_id: [...new Set(normalized.entity_id || [])],
      device_id: [...new Set(normalized.device_id || [])],
      area_id: [...new Set(normalized.area_id || [])],
      label_id: [...new Set(normalized.label_id || [])]
    };
  }
  function mergeTargetSelections(...targets) {
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
  function resolveEntityIdsFromTarget(hass, targetValue) {
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
        ...Array.isArray(entry.labels) ? entry.labels : [],
        ...Array.isArray(entry.label_ids) ? entry.label_ids : []
      ];
      if (deviceId && selectedDevices.has(deviceId) || areaId && selectedAreas.has(areaId) || labels.some((labelId) => selectedLabels.has(labelId))) {
        resolved.add(entityId);
      }
    });
    return [...resolved];
  }
  function panelConfigTarget(panelCfg) {
    if (!panelCfg) {
      return {};
    }
    if (panelCfg.target) {
      return normalizeTargetValue(panelCfg.target);
    }
    return normalizeTargetValue({
      entity_id: panelCfg.entities?.length ? panelCfg.entities : panelCfg.entity
    });
  }
  function normalizeHistorySeriesAnalysis(analysis) {
    const source = analysis && typeof analysis === "object" ? analysis : {};
    return {
      expanded: source.expanded === true,
      show_trend_lines: source.show_trend_lines === true,
      trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",
      trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",
      show_trend_crosshairs: source.show_trend_crosshairs === true,
      show_summary_stats: source.show_summary_stats === true,
      show_summary_stats_shading: source.show_summary_stats_shading === true,
      show_rate_of_change: source.show_rate_of_change === true,
      rate_window: typeof source.rate_window === "string" && source.rate_window ? source.rate_window : "1h",
      show_threshold_analysis: source.show_threshold_analysis === true,
      show_threshold_shading: source.show_threshold_shading === true,
      threshold_value: typeof source.threshold_value === "string" || typeof source.threshold_value === "number" ? String(source.threshold_value).trim() : "",
      threshold_direction: source.threshold_direction === "below" ? "below" : "above",
      show_anomalies: source.show_anomalies === true,
      anomaly_methods: (() => {
        const VALID = ["trend_residual", "rate_of_change", "iqr", "rolling_zscore", "persistence", "comparison_window"];
        if (Array.isArray(source.anomaly_methods)) {
          return source.anomaly_methods.filter((m2) => VALID.includes(m2));
        }
        const legacy = VALID.includes(source.anomaly_method) ? source.anomaly_method : null;
        return legacy ? [legacy] : [];
      })(),
      anomaly_overlap_mode: ["all", "highlight", "only"].includes(source.anomaly_overlap_mode) ? source.anomaly_overlap_mode : "all",
      anomaly_sensitivity: typeof source.anomaly_sensitivity === "string" && source.anomaly_sensitivity ? source.anomaly_sensitivity : "medium",
      anomaly_rate_window: typeof source.anomaly_rate_window === "string" && source.anomaly_rate_window ? source.anomaly_rate_window : "1h",
      anomaly_zscore_window: typeof source.anomaly_zscore_window === "string" && source.anomaly_zscore_window ? source.anomaly_zscore_window : "24h",
      anomaly_persistence_window: typeof source.anomaly_persistence_window === "string" && source.anomaly_persistence_window ? source.anomaly_persistence_window : "1h",
      anomaly_comparison_window_id: typeof source.anomaly_comparison_window_id === "string" && source.anomaly_comparison_window_id ? source.anomaly_comparison_window_id : null,
      show_delta_analysis: source.show_delta_analysis === true,
      show_delta_tooltip: source.show_delta_tooltip !== false,
      show_delta_lines: source.show_delta_lines === true,
      hide_source_series: source.hide_source_series === true
    };
  }
  function historySeriesRowHasConfiguredAnalysis(row) {
    const analysis = normalizeHistorySeriesAnalysis(row?.analysis);
    return analysis.show_trend_lines || analysis.show_summary_stats || analysis.show_rate_of_change || analysis.show_threshold_analysis || analysis.show_anomalies || analysis.show_delta_analysis || analysis.hide_source_series;
  }
  function normalizeHistorySeriesRows(rows) {
    if (!Array.isArray(rows)) return [];
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    rows.forEach((row, index) => {
      const entityId = typeof row?.entity_id === "string" ? row.entity_id.trim() : "";
      if (!entityId || seen.has(entityId)) return;
      seen.add(entityId);
      normalized.push({
        entity_id: entityId,
        color: typeof row?.color === "string" && /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : COLORS[index % COLORS.length],
        visible: row?.visible !== false,
        analysis: normalizeHistorySeriesAnalysis(row?.analysis)
      });
    });
    return normalized;
  }
  function buildHistorySeriesRows(entityIds, previousRows = []) {
    const previousMap = new Map(normalizeHistorySeriesRows(previousRows).map((row) => [row.entity_id, row]));
    return normalizeEntityIds(entityIds).map((entityId, index) => {
      const existing = previousMap.get(entityId);
      if (existing) return existing;
      return {
        entity_id: entityId,
        color: COLORS[index % COLORS.length],
        visible: true,
        analysis: normalizeHistorySeriesAnalysis(null)
      };
    });
  }
  function slugifySeriesName(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function parseSeriesColorsParam(value) {
    if (!value || typeof value !== "string") return {};
    return value.split(",").reduce((acc, entry) => {
      const [rawKey, rawColor] = entry.split(":");
      const key = decodeURIComponent(rawKey || "").trim();
      const color = String(rawColor || "").trim();
      if (!key || !/^#[0-9a-f]{6}$/i.test(color)) return acc;
      acc[key] = color;
      return acc;
    }, {});
  }
  function escapeXml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function sanitizeWorksheetName(name) {
    const cleaned = String(name || "Sheet").replace(/[\\/*?:[\]]/g, " ").trim();
    return cleaned.slice(0, 31) || "Sheet";
  }
  function columnNumberToName(index) {
    let value = index + 1;
    let name = "";
    while (value > 0) {
      const remainder = (value - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      value = Math.floor((value - 1) / 26);
    }
    return name;
  }
  function toIsoString(value) {
    if (!value) {
      return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString();
  }
  function normalizeHistoryTimestamp(rawTimestamp) {
    if (typeof rawTimestamp === "number") {
      if (rawTimestamp > 1e11) {
        return rawTimestamp;
      }
      return rawTimestamp * 1e3;
    }
    const timestamp = new Date(rawTimestamp || 0).getTime();
    if (!Number.isFinite(timestamp)) {
      return null;
    }
    return timestamp;
  }
  function getHistoryStatesForEntity(entityId, histResult, entityIds) {
    if (!histResult) {
      return [];
    }
    if (Array.isArray(histResult?.[entityId])) {
      return histResult[entityId];
    }
    if (Array.isArray(histResult)) {
      const entityIndex = entityIds.indexOf(entityId);
      if (entityIndex >= 0 && Array.isArray(histResult[entityIndex])) {
        return histResult[entityIndex];
      }
      if (histResult.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
        return histResult.filter((entry) => entry.entity_id === entityId);
      }
    }
    if (histResult && typeof histResult === "object") {
      if (Array.isArray(histResult.result?.[entityId])) {
        return histResult.result[entityId];
      }
      if (Array.isArray(histResult.result)) {
        const entityIndex = entityIds.indexOf(entityId);
        if (entityIndex >= 0 && Array.isArray(histResult.result[entityIndex])) {
          return histResult.result[entityIndex];
        }
      }
    }
    return [];
  }
  function createWorksheetXml(rows) {
    const rowXml = rows.map((row, rowIndex) => {
      const cellXml = row.map((cell, cellIndex) => {
        const cellRef = `${columnNumberToName(cellIndex)}${rowIndex + 1}`;
        const styleAttribute = rowIndex === 0 ? ' s="1"' : "";
        return `<c r="${cellRef}" t="inlineStr"${styleAttribute}><is><t>${escapeXml(cell)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cellXml}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
  }
  function createWorkbookXml(sheets) {
    const sheetXml = sheets.map((sheet, index) => `<sheet name="${escapeXml(sanitizeWorksheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetXml}</sheets>
</workbook>`;
  }
  function createWorkbookRelsXml(sheets) {
    const relXml = sheets.map((_2, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relXml}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  }
  function createRootRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  }
  function createStylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;
  }
  function createContentTypesXml(sheets) {
    const overrides = sheets.map((_2, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides}
</Types>`;
  }
  function createCrc32Table() {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        if ((value & 1) === 1) {
          value = 3988292384 ^ value >>> 1;
        } else {
          value >>>= 1;
        }
      }
      table[index] = value >>> 0;
    }
    return table;
  }
  const CRC32_TABLE = createCrc32Table();
  function crc32(bytes) {
    let crc = 4294967295;
    for (const byte of bytes) {
      crc = CRC32_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
    }
    return (crc ^ 4294967295) >>> 0;
  }
  function createZip(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.name);
      const dataBytes = encoder.encode(entry.content);
      const crc = crc32(dataBytes);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 67324752, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, dataBytes.length, true);
      localView.setUint32(22, dataBytes.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);
      localParts.push(localHeader, dataBytes);
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 33639248, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, dataBytes.length, true);
      centralView.setUint32(24, dataBytes.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);
      offset += localHeader.length + dataBytes.length;
    }
    const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 101010256, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralDirectorySize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);
    return new Blob([...localParts, ...centralParts, endRecord], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }
  function downloadWorkbook(filename, blob2) {
    const url = URL.createObjectURL(blob2);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }
  function createCombinedRows(hass, entityIds, histResult, events) {
    const entityColumns = entityIds.map((entityId) => {
      const stateObj = hass?.states?.[entityId];
      const unit = stateObj?.attributes?.unit_of_measurement || "";
      const name = entityName$1(hass, entityId) || entityId;
      return {
        entityId,
        unit,
        header: `${name} (${entityId})`
      };
    });
    const rows = [[
      "Timestamp",
      ...entityColumns.map((column) => column.header),
      "Datapoint Message",
      "Datapoint Annotation",
      "Datapoint Icon",
      "Datapoint Color",
      "Datapoint Entity IDs",
      "Datapoint Device IDs",
      "Datapoint Area IDs",
      "Datapoint Label IDs"
    ]];
    const timestampMap = /* @__PURE__ */ new Map();
    for (const column of entityColumns) {
      const states = getHistoryStatesForEntity(column.entityId, histResult, entityIds);
      for (const state of states) {
        const timestamp = normalizeHistoryTimestamp(
          state?.lu ?? state?.lc ?? state?.last_changed ?? state?.last_updated
        );
        if (!Number.isFinite(timestamp)) {
          continue;
        }
        const rawValue = state?.s ?? state?.state ?? "";
        const displayValue = column.unit ? `${rawValue} ${column.unit}` : `${rawValue}`;
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, /* @__PURE__ */ new Map());
        }
        timestampMap.get(timestamp).set(column.entityId, displayValue);
      }
    }
    for (const event of events || []) {
      const timestamp = normalizeHistoryTimestamp(event?.timestamp);
      if (!Number.isFinite(timestamp)) {
        continue;
      }
      if (!timestampMap.has(timestamp)) {
        timestampMap.set(timestamp, /* @__PURE__ */ new Map());
      }
      timestampMap.get(timestamp).set("__datapoints__", [
        ...timestampMap.get(timestamp).get("__datapoints__") || [],
        event
      ]);
    }
    const sortedTimestamps = [...timestampMap.keys()].sort((left, right) => left - right);
    for (const timestamp of sortedTimestamps) {
      const rowValues = timestampMap.get(timestamp);
      const datapointEvents = rowValues?.get("__datapoints__") || [];
      rows.push([
        toIsoString(timestamp),
        ...entityColumns.map((column) => rowValues?.get(column.entityId) || ""),
        datapointEvents.map((event) => event?.message || "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => event?.annotation || "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => event?.icon || "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => event?.color || "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => Array.isArray(event?.entity_ids) ? event.entity_ids.join(", ") : "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => Array.isArray(event?.device_ids) ? event.device_ids.join(", ") : "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => Array.isArray(event?.area_ids) ? event.area_ids.join(", ") : "").filter(Boolean).join("\n"),
        datapointEvents.map((event) => Array.isArray(event?.label_ids) ? event.label_ids.join(", ") : "").filter(Boolean).join("\n")
      ]);
    }
    return rows;
  }
  function buildFilename(prefix, startTime, endTime) {
    const start = toIsoString(startTime).replace(/[:]/g, "-");
    const end = toIsoString(endTime).replace(/[:]/g, "-");
    return `${prefix}-${start}-to-${end}.xlsx`;
  }
  async function downloadHistorySpreadsheet({
    hass,
    entityIds,
    startTime,
    endTime,
    datapointScope,
    filenamePrefix = "data-points-history"
  }) {
    const startIso = toIsoString(startTime);
    const endIso = toIsoString(endTime);
    const normalizedEntityIds = Array.isArray(entityIds) ? entityIds.filter(Boolean) : [];
    const eventEntityFilter = datapointScope === "all" ? void 0 : normalizedEntityIds;
    const [histResult, events] = await Promise.all([
      fetchHistoryDuringPeriod(
        hass,
        startIso,
        endIso,
        normalizedEntityIds,
        {
          include_start_time_state: true,
          significant_changes_only: false,
          no_attributes: true
        }
      ),
      fetchEvents$1(
        hass,
        startIso,
        endIso,
        eventEntityFilter
      )
    ]);
    const sheets = [
      {
        name: "History Export",
        rows: createCombinedRows(hass, normalizedEntityIds, histResult, events)
      }
    ];
    const workbookBlob = createZip([
      {
        name: "[Content_Types].xml",
        content: createContentTypesXml(sheets)
      },
      {
        name: "_rels/.rels",
        content: createRootRelsXml()
      },
      {
        name: "xl/workbook.xml",
        content: createWorkbookXml(sheets)
      },
      {
        name: "xl/_rels/workbook.xml.rels",
        content: createWorkbookRelsXml(sheets)
      },
      {
        name: "xl/styles.xml",
        content: createStylesXml()
      },
      ...sheets.map((sheet, index) => ({
        name: `xl/worksheets/sheet${index + 1}.xml`,
        content: createWorksheetXml(sheet.rows)
      }))
    ]);
    downloadWorkbook(buildFilename(filenamePrefix, startTime, endTime), workbookBlob);
  }
  function makeDateWindowId(label, existingIds = /* @__PURE__ */ new Set()) {
    const base = slugifySeriesName(label) || "date-window";
    let candidate = base;
    let suffix = 2;
    while (existingIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
  function normalizeDateWindows(windows) {
    if (!Array.isArray(windows)) {
      return [];
    }
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    windows.forEach((window2, index) => {
      const label = String(window2?.label || window2?.name || "").trim();
      const start = parseDateValue(window2?.start_time || window2?.start);
      const end = parseDateValue(window2?.end_time || window2?.end);
      if (!label || !start || !end || start >= end) {
        return;
      }
      const id = String(window2?.id || "").trim() || makeDateWindowId(`${label}-${index + 1}`, seen);
      if (seen.has(id)) {
        return;
      }
      seen.add(id);
      normalized.push({
        id,
        label,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    });
    return normalized;
  }
  function parseDateWindowsParam(value) {
    if (!value || typeof value !== "string") {
      return [];
    }
    return normalizeDateWindows(value.split("|").map((entry) => {
      const [rawId, rawLabel, rawStart, rawEnd] = String(entry).split("~");
      return {
        id: decodeURIComponent(rawId || ""),
        label: decodeURIComponent(rawLabel || ""),
        start_time: decodeURIComponent(rawStart || ""),
        end_time: decodeURIComponent(rawEnd || "")
      };
    }));
  }
  function serializeDateWindowsParam(windows) {
    const normalized = normalizeDateWindows(windows);
    if (!normalized.length) {
      return "";
    }
    return normalized.map((window2) => [
      encodeURIComponent(window2.id),
      encodeURIComponent(window2.label),
      encodeURIComponent(window2.start_time),
      encodeURIComponent(window2.end_time)
    ].join("~")).join("|");
  }
  const PANEL_HISTORY_PREFERENCES_KEY = `${DOMAIN$1}:panel_history_preferences`;
  const PANEL_HISTORY_SESSION_KEY = `${DOMAIN$1}:panel_history_session`;
  function readHistoryPageSessionState() {
    try {
      const raw = window.sessionStorage?.getItem(PANEL_HISTORY_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  function buildHistoryPageSessionState$1(source) {
    return {
      entities: source._entities,
      series_rows: source._seriesRows,
      target_selection: source._targetSelection,
      target_selection_raw: source._targetSelectionRaw,
      datapoint_scope: source._datapointScope,
      show_chart_datapoint_icons: source._showChartDatapointIcons,
      show_chart_datapoint_lines: source._showChartDatapointLines,
      show_chart_tooltips: source._showChartTooltips,
      show_chart_emphasized_hover_guides: source._showChartEmphasizedHoverGuides,
      delink_chart_y_axis: source._delinkChartYAxis,
      split_chart_view: source._splitChartView,
      show_chart_trend_lines: false,
      show_chart_summary_stats: false,
      show_chart_rate_of_change: false,
      show_chart_threshold_analysis: false,
      show_chart_threshold_shading: false,
      show_chart_anomalies: false,
      chart_anomaly_method: "trend_residual",
      chart_anomaly_rate_window: "1h",
      chart_anomaly_zscore_window: "24h",
      chart_anomaly_persistence_window: "1h",
      chart_anomaly_comparison_window_id: null,
      hide_chart_source_series: false,
      show_chart_trend_crosshairs: false,
      chart_trend_method: "rolling_average",
      chart_trend_window: "24h",
      chart_rate_window: "1h",
      chart_anomaly_sensitivity: "medium",
      chart_threshold_values: {},
      chart_threshold_directions: {},
      show_chart_delta_analysis: false,
      show_chart_delta_tooltip: true,
      show_chart_delta_lines: false,
      show_chart_correlated_anomalies: source._showCorrelatedAnomalies,
      chart_anomaly_overlap_mode: source._chartAnomalyOverlapMode || "all",
      show_data_gaps: source._showDataGaps,
      data_gap_threshold: source._dataGapThreshold,
      content_split_ratio: source._contentSplitRatio,
      start_time: source._startTime?.toISOString() || null,
      end_time: source._endTime?.toISOString() || null,
      zoom_start_time: source._chartZoomCommittedRange ? new Date(source._chartZoomCommittedRange.start).toISOString() : null,
      zoom_end_time: source._chartZoomCommittedRange ? new Date(source._chartZoomCommittedRange.end).toISOString() : null,
      date_windows: normalizeDateWindows(source._comparisonWindows),
      hours: source._hours,
      sidebar_collapsed: source._sidebarCollapsed,
      sidebar_accordion_targets_open: source._sidebarAccordionTargetsOpen !== false,
      sidebar_accordion_datapoints_open: source._sidebarAccordionDatapointsOpen !== false,
      sidebar_accordion_analysis_open: source._sidebarAccordionAnalysisOpen !== false,
      sidebar_accordion_chart_open: source._sidebarAccordionChartOpen !== false
    };
  }
  function writeHistoryPageSessionState(source) {
    try {
      window.sessionStorage?.setItem(PANEL_HISTORY_SESSION_KEY, JSON.stringify(buildHistoryPageSessionState$1(source)));
    } catch {
    }
  }
  function normalizeHistoryPagePreferences(preferences, options = {}) {
    const zoomValues = new Set((options.zoomOptions || []).map((option) => option.value));
    const snapValues = new Set((options.snapOptions || []).map((option) => option.value));
    let shouldPersistDefaults = false;
    const normalized = {
      zoomLevel: "auto",
      dateSnapping: "hour",
      preferredSeriesColors: {},
      comparisonWindows: [],
      shouldPersistDefaults
    };
    if (preferences && typeof preferences === "object") {
      if (zoomValues.has(preferences.zoom_level)) {
        normalized.zoomLevel = preferences.zoom_level;
      } else {
        shouldPersistDefaults = true;
      }
      if (snapValues.has(preferences.date_snapping)) {
        normalized.dateSnapping = preferences.date_snapping;
      } else {
        shouldPersistDefaults = true;
      }
      normalized.preferredSeriesColors = preferences.series_colors && typeof preferences.series_colors === "object" ? Object.entries(preferences.series_colors).reduce((acc, [entityId, color]) => {
        if (typeof entityId === "string" && /^#[0-9a-f]{6}$/i.test(color || "")) {
          acc[entityId] = color;
        }
        return acc;
      }, {}) : {};
      normalized.comparisonWindows = normalizeDateWindows(preferences.date_windows);
    } else {
      shouldPersistDefaults = true;
    }
    normalized.shouldPersistDefaults = shouldPersistDefaults;
    return normalized;
  }
  function buildHistoryPagePreferencesPayload(source) {
    const preferredSeriesColors = source._seriesRows.reduce((acc, row) => {
      if (row?.entity_id && /^#[0-9a-f]{6}$/i.test(row?.color || "")) {
        acc[row.entity_id] = row.color;
      }
      return acc;
    }, { ...source._preferredSeriesColors });
    return {
      zoom_level: source._zoomLevel,
      date_snapping: source._dateSnapping,
      series_colors: preferredSeriesColors,
      date_windows: normalizeDateWindows(source._comparisonWindows)
    };
  }
  const SECOND_MS = 1e3;
  const MINUTE_MS = 60 * SECOND_MS;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;
  const RANGE_SLIDER_MIN_SPAN_MS = 15 * 60 * 1e3;
  const RANGE_SLIDER_WINDOW_MS = 30 * DAY_MS;
  const RANGE_AUTO_ZOOM_DEBOUNCE_MS = 3e3;
  const RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO = 0.6;
  const RANGE_FUTURE_BUFFER_YEARS = 1;
  const RANGE_LABEL_MIN_GAP_PX = 10;
  const RANGE_CONTEXT_LABEL_MIN_GAP_PX = 14;
  const RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX = 48;
  const RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX = 28;
  const RANGE_ZOOM_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "quarterly", label: "Quarterly" },
    { value: "month_compressed", label: "Month Compressed" },
    { value: "month_short", label: "Month Short" },
    { value: "month_expanded", label: "Month Expanded" },
    { value: "week_compressed", label: "Week Compressed" },
    { value: "week_expanded", label: "Week Expanded" },
    { value: "day", label: "Day" }
  ];
  const RANGE_SNAP_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
    { value: "hour", label: "Hour" },
    { value: "minute", label: "Minute" },
    { value: "second", label: "Second" }
  ];
  const RANGE_ZOOM_CONFIGS = {
    quarterly: {
      baselineMs: 730 * DAY_MS,
      boundsUnit: "month",
      contextUnit: "year",
      detailUnit: "month",
      majorUnit: "quarter",
      labelUnit: "quarter",
      minorUnit: "month",
      pixelsPerUnit: 96
    },
    month_compressed: {
      baselineMs: 365 * DAY_MS,
      boundsUnit: "month",
      contextUnit: "year",
      detailUnit: "week",
      majorUnit: "month",
      labelUnit: "month",
      minorUnit: "month",
      pixelsPerUnit: 76
    },
    month_short: {
      baselineMs: 180 * DAY_MS,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 54
    },
    month_expanded: {
      baselineMs: 90 * DAY_MS,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 72
    },
    week_compressed: {
      baselineMs: 56 * DAY_MS,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 120
    },
    week_expanded: {
      baselineMs: 28 * DAY_MS,
      boundsUnit: "day",
      contextUnit: "month",
      detailUnit: "hour",
      detailStep: 12,
      majorUnit: "day",
      labelUnit: "day",
      minorUnit: "day",
      pixelsPerUnit: 30
    },
    day: {
      baselineMs: 48 * HOUR_MS,
      boundsUnit: "hour",
      contextUnit: "day",
      majorUnit: "hour",
      labelUnit: "hour",
      minorUnit: "hour",
      pixelsPerUnit: 9
    }
  };
  function extractRangeValue(source) {
    if (!source) {
      return { start: null, end: null };
    }
    const detail = source.detail || {};
    const value = detail.value || source.value || source.target?.value || {};
    return {
      start: parseDateValue(detail.startDate || value.startDate || source.startDate || source.target?.startDate),
      end: parseDateValue(detail.endDate || value.endDate || source.endDate || source.target?.endDate)
    };
  }
  function formatRangeDateTime(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "--";
    }
    return value.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function formatRangeTick(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return "--";
    }
    return value.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function startOfLocalDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  function startOfLocalHour(value) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      0,
      0,
      0
    );
  }
  function startOfLocalMinute(value) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      0,
      0
    );
  }
  function startOfLocalSecond(value) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      0
    );
  }
  function startOfLocalMonth(value) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }
  function endOfLocalMonth(value) {
    return new Date(value.getFullYear(), value.getMonth() + 1, 1);
  }
  function startOfLocalYear(value) {
    return new Date(value.getFullYear(), 0, 1);
  }
  function startOfLocalWeek(value) {
    const day = value.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const result = startOfLocalDay(value);
    result.setDate(result.getDate() + mondayOffset);
    return result;
  }
  function startOfLocalQuarter(value) {
    return new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);
  }
  function endOfLocalHour(value) {
    const result = startOfLocalHour(value);
    result.setHours(result.getHours() + 1);
    return result;
  }
  function endOfLocalDay(value) {
    const result = startOfLocalDay(value);
    result.setDate(result.getDate() + 1);
    return result;
  }
  function endOfLocalWeek(value) {
    const result = startOfLocalWeek(value);
    result.setDate(result.getDate() + 7);
    return result;
  }
  function endOfLocalQuarter(value) {
    const result = startOfLocalQuarter(value);
    result.setMonth(result.getMonth() + 3);
    return result;
  }
  function endOfLocalMinute(value) {
    const result = startOfLocalMinute(value);
    result.setMinutes(result.getMinutes() + 1);
    return result;
  }
  function endOfLocalSecond(value) {
    const result = startOfLocalSecond(value);
    result.setSeconds(result.getSeconds() + 1);
    return result;
  }
  function formatMonthLabel(value) {
    return value.toLocaleString([], { month: "short" });
  }
  function formatYearLabel(value) {
    return value.toLocaleString([], { year: "numeric" });
  }
  function getWeekOfYear(value) {
    const date = new Date(value.getTime());
    date.setHours(0, 0, 0, 0);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - day);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  }
  function getWeekLabel(value) {
    return value.toLocaleString([], { month: "short", day: "numeric" });
  }
  function formatDayLabel(value) {
    return value.toLocaleString([], { day: "numeric" });
  }
  function formatHourLabel(value) {
    return value.toLocaleTimeString([], { hour: "2-digit" });
  }
  function formatQuarterLabel(value, zoomLevel = "") {
    return zoomLevel === "quarterly" ? `Q${Math.floor(value.getMonth() / 3) + 1}` : formatMonthLabel(value);
  }
  function formatScaleLabel(value, unit, zoomLevel = "") {
    switch (unit) {
      case "quarter":
        return formatQuarterLabel(value, zoomLevel);
      case "month":
        return formatMonthLabel(value);
      case "week":
        return zoomLevel === "month_short" ? `Wk ${getWeekOfYear(value)}` : getWeekLabel(value);
      case "day":
        return formatDayLabel(value);
      case "hour":
        return formatHourLabel(value);
      default:
        return formatRangeTick(value);
    }
  }
  function formatContextLabel(value, unit) {
    switch (unit) {
      case "year":
        return formatYearLabel(value);
      case "month":
        return value.toLocaleString([], { month: "short", year: "numeric" });
      case "day":
        return value.toLocaleString([], { month: "short", day: "numeric" });
      default:
        return formatRangeTick(value);
    }
  }
  function formatPeriodSelectionLabel(value, unit) {
    switch (unit) {
      case "year":
        return formatYearLabel(value);
      case "quarter":
        return `${formatQuarterLabel(value)} ${formatYearLabel(value)}`;
      case "month":
        return value.toLocaleString([], { month: "long", year: "numeric" });
      case "week":
        return `Week of ${value.toLocaleString([], { month: "short", day: "numeric", year: "numeric" })}`;
      case "day":
        return value.toLocaleString([], { month: "short", day: "numeric", year: "numeric" });
      case "hour":
        return value.toLocaleString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit"
        });
      default:
        return formatRangeTick(value);
    }
  }
  function startOfUnit(value, unit) {
    switch (unit) {
      case "second":
        return startOfLocalSecond(value);
      case "minute":
        return startOfLocalMinute(value);
      case "hour":
        return startOfLocalHour(value);
      case "day":
        return startOfLocalDay(value);
      case "week":
        return startOfLocalWeek(value);
      case "month":
        return startOfLocalMonth(value);
      case "quarter":
        return startOfLocalQuarter(value);
      case "year":
        return startOfLocalYear(value);
      default:
        return new Date(value);
    }
  }
  function endOfUnit(value, unit) {
    switch (unit) {
      case "second":
        return endOfLocalSecond(value);
      case "minute":
        return endOfLocalMinute(value);
      case "hour":
        return endOfLocalHour(value);
      case "day":
        return endOfLocalDay(value);
      case "week":
        return endOfLocalWeek(value);
      case "month":
        return endOfLocalMonth(value);
      case "quarter":
        return endOfLocalQuarter(value);
      case "year": {
        const result = startOfLocalYear(value);
        result.setFullYear(result.getFullYear() + 1);
        return result;
      }
      default:
        return new Date(value);
    }
  }
  function addUnit(value, unit, amount = 1) {
    const result = new Date(value);
    switch (unit) {
      case "second":
        result.setSeconds(result.getSeconds() + amount);
        break;
      case "minute":
        result.setMinutes(result.getMinutes() + amount);
        break;
      case "hour":
        result.setHours(result.getHours() + amount);
        break;
      case "day":
        result.setDate(result.getDate() + amount);
        break;
      case "week":
        result.setDate(result.getDate() + amount * 7);
        break;
      case "month":
        result.setMonth(result.getMonth() + amount);
        break;
      case "quarter":
        result.setMonth(result.getMonth() + amount * 3);
        break;
      case "year":
        result.setFullYear(result.getFullYear() + amount);
        break;
    }
    return result;
  }
  function snapDateToUnit(value, unit) {
    const start = startOfUnit(value, unit);
    const end = endOfUnit(value, unit);
    return value.getTime() - start.getTime() < end.getTime() - value.getTime() ? start : end;
  }
  const shared = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    AMBER,
    CHART_STYLE,
    COLORS,
    ChartRenderer,
    DATA_RANGE_CACHE_LIVE_EDGE_MS,
    DATA_RANGE_CACHE_TTL_MS,
    DAY_MS,
    DOMAIN: DOMAIN$1,
    HOUR_MS,
    MINUTE_MS,
    PANEL_HISTORY_PREFERENCES_KEY,
    PANEL_HISTORY_SAVED_PAGE_KEY,
    PANEL_HISTORY_SESSION_KEY,
    PANEL_URL_PATH,
    RANGE_AUTO_ZOOM_DEBOUNCE_MS,
    RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO,
    RANGE_CONTEXT_LABEL_MIN_GAP_PX,
    RANGE_FUTURE_BUFFER_YEARS,
    RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX,
    RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
    RANGE_LABEL_MIN_GAP_PX,
    RANGE_SLIDER_MIN_SPAN_MS,
    RANGE_SLIDER_WINDOW_MS,
    RANGE_SNAP_OPTIONS,
    RANGE_ZOOM_CONFIGS,
    RANGE_ZOOM_OPTIONS,
    SECOND_MS,
    addUnit,
    areaIcon: areaIcon$1,
    areaName: areaName$1,
    attachLineChartHover,
    attachLineChartRangeZoom,
    attachTooltipBehaviour,
    buildChartCardShell,
    buildDataPointsHistoryPath: buildDataPointsHistoryPath$1,
    buildHistoryPagePreferencesPayload,
    buildHistoryPageSessionState: buildHistoryPageSessionState$1,
    buildHistorySeriesRows,
    buildTooltipRelatedChips,
    clampChartValue,
    clampNumber,
    clearStableRangeCacheMatching,
    confirmDestructiveAction: confirmDestructiveAction$1,
    contrastColor: contrastColor$1,
    createChartZoomRange,
    createHiddenEventIdSet,
    createHiddenSeriesSet,
    deleteEvent: deleteEvent$1,
    deviceIcon: deviceIcon$1,
    deviceName: deviceName$1,
    dispatchLineChartHover,
    downloadHistorySpreadsheet,
    endOfLocalDay,
    endOfLocalHour,
    endOfLocalMinute,
    endOfLocalMonth,
    endOfLocalQuarter,
    endOfLocalSecond,
    endOfLocalWeek,
    endOfUnit,
    ensureHaComponents,
    entityIcon: entityIcon$1,
    entityName: entityName$1,
    esc: esc$1,
    extractRangeValue,
    fetchEventBounds,
    fetchEvents: fetchEvents$1,
    fetchHistoryDuringPeriod,
    fetchStatisticsDuringPeriod,
    fetchUserData,
    fmtDateTime: fmtDateTime$1,
    fmtRelativeTime,
    fmtTime,
    formatContextLabel,
    formatDayLabel,
    formatHourLabel,
    formatMonthLabel,
    formatPeriodSelectionLabel,
    formatQuarterLabel,
    formatRangeDateTime,
    formatRangeTick,
    formatScaleLabel,
    formatTooltipDisplayValue,
    formatTooltipValue,
    formatYearLabel,
    getWeekLabel,
    getWeekOfYear,
    hexToRgba,
    hideLineChartHover,
    hideTooltip,
    historySeriesRowHasConfiguredAnalysis,
    invalidateEventsCache,
    labelIcon: labelIcon$1,
    labelName: labelName$1,
    makeDateWindowId,
    mergeTargetSelections,
    navigateToDataPointsHistory: navigateToDataPointsHistory$1,
    normalizeCacheIdList,
    normalizeDateWindows,
    normalizeEntityIds,
    normalizeHistoryPagePreferences,
    normalizeHistorySeriesAnalysis,
    normalizeHistorySeriesRows,
    normalizeTargetSelection,
    normalizeTargetValue,
    panelConfigTarget,
    parseDateValue,
    parseDateWindowsParam,
    parseSeriesColorsParam,
    positionTooltip,
    readHistoryPageSessionState,
    renderChartAxisHoverDots,
    renderChartAxisOverlays,
    resolveChartLabelColor,
    resolveEntityIdsFromTarget,
    saveUserData,
    serializeDateWindowsParam,
    setupCanvas,
    shouldUseStableRangeCache,
    showLineChartCrosshair,
    showLineChartTooltip,
    showTooltip,
    slugifySeriesName,
    snapDateToUnit,
    startOfLocalDay,
    startOfLocalHour,
    startOfLocalMinute,
    startOfLocalMonth,
    startOfLocalQuarter,
    startOfLocalSecond,
    startOfLocalWeek,
    startOfLocalYear,
    startOfUnit,
    updateEvent: updateEvent$1,
    waitForHaComponent,
    withStableRangeCache,
    writeHistoryPageSessionState
  }, Symbol.toStringTag, { value: "Module" }));
  const isDev = () => typeof window !== "undefined" && !!window.__HASS_DATAPOINTS_DEV__;
  const logger$1 = {
    log: (...args) => {
      if (isDev()) {
        console.log(...args);
      }
    },
    debug: (...args) => {
      if (isDev()) {
        console.debug(...args);
      }
    },
    info: (...args) => {
      if (isDev()) {
        console.info(...args);
      }
    },
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args)
  };
  class HistoryAnnotationDialogController {
    constructor(host) {
      this._host = host;
      this._dialogEl = null;
      this._panelEl = null;
      this._chipRowEl = null;
      this._linkedTarget = {};
      this._target = {};
    }
    isOpen() {
      return !!this._dialogEl?.open;
    }
    ensureDialog() {
      if (this._dialogEl || !this._host.shadowRoot) {
        return;
      }
      const dialog = document.createElement("ha-dialog");
      dialog.id = "chart-context-dialog";
      dialog.scrimClickAction = true;
      dialog.escapeKeyAction = true;
      dialog.open = false;
      dialog.headerTitle = "Create data point";
      dialog.style.setProperty("--dialog-content-padding", "0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px)");
      dialog.style.setProperty("--mdc-dialog-min-width", "min(920px, 96vw)");
      dialog.style.setProperty("--mdc-dialog-max-width", "96vw");
      if (this._host._hass) {
        dialog.hass = this._host._hass;
      }
      dialog.innerHTML = `
      <div id="chart-context-dialog-panel" class="chart-context-dialog-panel"></div>
    `;
      dialog.addEventListener("closed", () => this.finalizeClose());
      this._host.shadowRoot.appendChild(dialog);
      this._dialogEl = dialog;
      this._panelEl = dialog.querySelector("#chart-context-dialog-panel");
    }
    teardown() {
      this.resetFormState();
      this._dialogEl?.remove();
      this._dialogEl = null;
      this._panelEl = null;
      this._chipRowEl = null;
    }
    resetFormState() {
      this._linkedTarget = {};
      this._target = {};
    }
    finalizeClose() {
      this.teardown();
      this._host._creatingContextAnnotation = false;
    }
    formatDate(timeMs) {
      const value = new Date(timeMs);
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, "0");
      const dd = String(value.getDate()).padStart(2, "0");
      const hh = String(value.getHours()).padStart(2, "0");
      const min = String(value.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
    _buildChips(target) {
      return [
        ...(target.entity_id || []).map((id) => ({
          type: "entity_id",
          itemId: id,
          icon: entityIcon$1(this._host._hass, id),
          name: entityName$1(this._host._hass, id)
        })),
        ...(target.device_id || []).map((id) => ({
          type: "device_id",
          itemId: id,
          icon: deviceIcon$1(this._host._hass, id),
          name: deviceName$1(this._host._hass, id)
        })),
        ...(target.area_id || []).map((id) => ({
          type: "area_id",
          itemId: id,
          icon: areaIcon$1(this._host._hass, id),
          name: areaName$1(this._host._hass, id)
        })),
        ...(target.label_id || []).map((id) => ({
          type: "label_id",
          itemId: id,
          icon: labelIcon$1(this._host._hass, id),
          name: labelName$1(this._host._hass, id)
        }))
      ];
    }
    removeLinkedTarget(type, id) {
      if (!this._linkedTarget || !type || !id) {
        return;
      }
      const current = normalizeTargetSelection(this._linkedTarget);
      if (!current[type]) {
        return;
      }
      current[type] = current[type].filter((value) => value !== id);
      this._linkedTarget = current;
      if (this._chipRowEl) {
        this._chipRowEl.chips = this._buildChips(this._linkedTarget);
      }
    }
    bindTargetChipActions() {
    }
    bindFields(hover) {
      if (!this._panelEl) {
        return;
      }
      const prefill = hover?.annotationPrefill && typeof hover.annotationPrefill === "object" ? hover.annotationPrefill : {};
      const messageEl = this._panelEl.querySelector("#chart-context-message");
      const annotationEl = this._panelEl.querySelector("#chart-context-annotation");
      const iconPicker = this._panelEl.querySelector("#chart-context-icon");
      if (iconPicker) {
        iconPicker.hass = this._host._hass;
        iconPicker.value = prefill.icon || hover?.event?.icon || "mdi:bookmark";
      }
      const targetSel = this._panelEl.querySelector("#chart-context-target");
      if (targetSel) {
        targetSel.hass = this._host._hass;
        targetSel.value = {};
        targetSel.addEventListener("value-changed", (ev) => {
          this._target = normalizeTargetSelection(ev.detail.value || {});
        });
      }
      if (messageEl) {
        messageEl.value = prefill.message || "";
      }
      if (annotationEl) {
        annotationEl.value = prefill.annotation || "";
      }
      const chipContainer = this._panelEl.querySelector("#chart-context-linked-targets");
      if (chipContainer && !this._chipRowEl) {
        const chipRow = document.createElement("dp-annotation-chip-row");
        chipRow.addEventListener("dp-target-remove", (ev) => {
          this.removeLinkedTarget(ev.detail.type, ev.detail.id);
        });
        chipContainer.appendChild(chipRow);
        this._chipRowEl = chipRow;
      }
      if (this._chipRowEl) {
        this._chipRowEl.chips = this._buildChips(this._linkedTarget);
      }
      this.bindTargetChipActions();
      const colorInput = this._panelEl.querySelector("#chart-context-color");
      const colorPreview = this._panelEl.querySelector("#chart-context-color-preview");
      const syncColor = () => {
        if (colorPreview && colorInput) {
          colorPreview.style.background = colorInput.value;
        }
      };
      if (colorInput) {
        syncColor();
        colorInput.addEventListener("input", syncColor);
        colorInput.addEventListener("change", syncColor);
      }
      this._dialogEl?.querySelector("#chart-context-cancel")?.addEventListener("click", () => this.close());
      this._dialogEl?.querySelector("#chart-context-save")?.addEventListener("click", () => this.submit());
      [messageEl, annotationEl].forEach((field) => {
        field?.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            this.submit();
          }
        });
      });
    }
    async submit() {
      if (!this._panelEl || !this._host._hass) {
        return;
      }
      const messageEl = this._panelEl.querySelector("#chart-context-message");
      const annotationEl = this._panelEl.querySelector("#chart-context-annotation");
      const dateEl = this._panelEl.querySelector("#chart-context-date");
      const iconPicker = this._panelEl.querySelector("#chart-context-icon");
      const colorInput = this._panelEl.querySelector("#chart-context-color");
      const saveButton = this._dialogEl?.querySelector("#chart-context-save");
      const feedbackEl = this._panelEl.querySelector("#chart-context-feedback");
      const message = (messageEl?.value || "").trim();
      if (!message) {
        messageEl?.focus();
        return;
      }
      const mergedTarget = mergeTargetSelections(this._linkedTarget, this._target || {});
      const payload = { message };
      const annotation = (annotationEl?.value || "").trim();
      if (annotation) {
        payload.annotation = annotation;
      }
      const dateVal = (dateEl?.value || "").trim();
      if (dateVal) {
        const parsedDate = new Date(dateVal);
        payload.date = Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : dateVal;
      }
      const icon = iconPicker?.value;
      if (icon) {
        payload.icon = icon;
      }
      payload.color = colorInput?.value || "#03a9f4";
      if (mergedTarget.entity_id.length) {
        payload.entity_ids = mergedTarget.entity_id;
      }
      if (mergedTarget.device_id.length) {
        payload.device_ids = mergedTarget.device_id;
      }
      if (mergedTarget.area_id.length) {
        payload.area_ids = mergedTarget.area_id;
      }
      if (mergedTarget.label_id.length) {
        payload.label_ids = mergedTarget.label_id;
      }
      if (saveButton) saveButton.disabled = true;
      if (feedbackEl) {
        feedbackEl.hidden = true;
        feedbackEl.textContent = "";
      }
      try {
        await this._host._hass.callService(DOMAIN$1, "record", payload);
        invalidateEventsCache();
        window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
        this.close();
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.hidden = false;
          feedbackEl.textContent = err?.message || "Failed to create annotation.";
        }
        logger$1.error("[hass-datapoints history-card]", err);
      } finally {
        if (saveButton) saveButton.disabled = false;
      }
    }
    open(hover) {
      if (this._dialogEl && !this._dialogEl.open) {
        this.teardown();
      }
      this.ensureDialog();
      if (!this._dialogEl || !this._panelEl || this._dialogEl.open) return;
      this.resetFormState();
      const prefillLinkedTarget = hover?.annotationPrefill?.linkedTarget;
      if (prefillLinkedTarget && typeof prefillLinkedTarget === "object") {
        this._linkedTarget = normalizeTargetSelection(prefillLinkedTarget);
      } else {
        this._linkedTarget = normalizeTargetSelection({ entity_id: this._host._entityIds.filter(Boolean) });
      }
      const defaultColor = hover?.annotationPrefill?.color || hover?.primary?.color || hover?.event?.color || "#03a9f4";
      this._panelEl.innerHTML = `
      <style>
        .chart-context-dialog-panel { width: min(920px, 96vw); max-width: 100%; color: var(--primary-text-color); }
        .context-dialog-content { display: grid; gap: 16px; padding-top: 4px; }
        .context-form { display: grid; gap: 16px; }
        .context-form-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
        .context-form-main, .context-form-side { display: grid; gap: 16px; min-width: 0; }
        .context-form-side { align-content: start; justify-items: start; }
        .context-form-field { display: grid; gap: 6px; min-width: 0; }
        .context-form-field.compact-field { justify-items: start; }
        .context-form-label { font-size: 0.9rem; font-weight: 600; color: var(--primary-text-color); }
        .context-form-help { font-size: 0.8rem; color: var(--secondary-text-color); line-height: 1.45; }
        .context-form-help-inline { display: inline-flex; align-items: center; gap: 6px; }
        .context-annotation-input { width: 100%; min-height: 120px; box-sizing: border-box; resize: vertical; padding: 12px; border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e)); border-radius: 12px; background: var(--card-background-color, var(--primary-background-color, #fff)); color: var(--primary-text-color); font: inherit; line-height: 1.45; }
        .context-annotation-input::placeholder { color: var(--secondary-text-color); }
        .context-annotation-input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); }
        .context-help-icon { color: var(--secondary-text-color); cursor: help; --mdc-icon-size: 16px; }
        .context-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .context-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color) 12%, transparent); color: var(--primary-color); white-space: nowrap; }
        .context-chip ha-icon { --mdc-icon-size: 14px; }
        .context-chip-remove { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; border: none; border-radius: 50%; background: transparent; color: currentColor; cursor: pointer; flex: 0 0 auto; }
        .context-chip-remove:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
        .context-chip-remove ha-icon { --mdc-icon-size: 12px; pointer-events: none; }
        .context-color-control { display: flex; align-items: center; gap: 10px; }
        .context-color-preview { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--divider-color, #ccc); background: ${esc$1(defaultColor)}; flex: 0 0 auto; }
        .context-color-input { width: 56px; height: 36px; padding: 0; border: none; background: transparent; cursor: pointer; }
        .context-date-input { width: 220px; max-width: 100%; }
        .context-icon-input { width: 220px; max-width: 100%; }
        .context-form-feedback { color: var(--error-color); font-size: 0.84rem; }
        .context-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; }
        .context-form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-left: auto; }
      </style>
      <div class="context-dialog-content">
        <div class="context-form">
          <div class="context-form-grid">
            <div class="context-form-main">
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-message">Message</label>
                <div class="context-form-help">Use a short title that will be shown in the chart tooltip and records list.</div>
                <ha-textfield id="chart-context-message" placeholder="What happened?" style="width:100%"></ha-textfield>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-annotation">Annotation</label>
                <div class="context-form-help">Add any longer context, outcome, or note you want to keep with this data point.</div>
                <textarea id="chart-context-annotation" class="context-annotation-input" placeholder="Detailed note shown on chart hover..."></textarea>
              </div>
              <div id="chart-context-linked-targets"></div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-target">Additional related items</label>
                <div class="context-form-help">Optionally add more entities, devices, areas, or labels that should also be linked to this annotation.</div>
                <ha-selector id="chart-context-target"></ha-selector>
              </div>
            </div>
            <div class="context-form-side">
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-date">Date and time</label>
                <div class="context-form-help">The annotation will be placed at this exact moment on the chart.</div>
                <ha-textfield id="chart-context-date" class="context-date-input" type="datetime-local" value="${esc$1(this.formatDate(hover.timeMs))}"></ha-textfield>
              </div>
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-icon">Icon</label>
                <div class="context-form-help">Choose the icon shown for this data point in the chart and records list.</div>
                <ha-icon-picker id="chart-context-icon" class="context-icon-input" label="Icon"></ha-icon-picker>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-color">Color</label>
                <div class="context-form-help context-form-help-inline">
                  Pick a color for the point marker and its related timeline indicators.
                  <ha-icon class="context-help-icon" icon="mdi:information-outline" title="This color is used for the chart marker, timeline dot, and record icon."></ha-icon>
                </div>
                <div class="context-color-control">
                  <span id="chart-context-color-preview" class="context-color-preview" aria-hidden="true"></span>
                  <input id="chart-context-color" class="context-color-input" type="color" value="${esc$1(defaultColor)}" aria-label="Annotation color">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="context-form-footer">
          <div id="chart-context-feedback" class="context-form-feedback" hidden></div>
          <div class="context-form-actions">
            <ha-button id="chart-context-cancel">Cancel</ha-button>
            <ha-button id="chart-context-save" raised>Create data point</ha-button>
          </div>
        </div>
      </div>
    `;
      if (this._dialogEl) {
        this._dialogEl.hass = this._host._hass;
        this._dialogEl.dialogInitialFocus = "#chart-context-message";
      }
      const targetSel = this._panelEl.querySelector("#chart-context-target");
      if (targetSel) targetSel.selector = { target: {} };
      this.bindFields(hover);
      this._dialogEl.open = true;
      this._host._creatingContextAnnotation = true;
      window.requestAnimationFrame(() => {
        this._panelEl?.querySelector("#chart-context-message")?.focus?.();
      });
    }
    close() {
      this._host._creatingContextAnnotation = false;
      if (this._dialogEl) this._dialogEl.open = false;
      window.setTimeout(() => this.finalizeClose(), 0);
    }
  }
  class HassRecordsActionCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._userTarget = {};
    }
    setConfig(config) {
      this._config = config || {};
      if (this._rendered) {
        this._render();
        this._updateHassOnChildren();
      }
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._render();
      }
      this._updateHassOnChildren();
    }
    _updateHassOnChildren() {
      if (!this.shadowRoot || !this._hass) return;
      const iconPicker = this.shadowRoot.getElementById("icon-picker");
      if (iconPicker) iconPicker.hass = this._hass;
      const targetSel = this.shadowRoot.getElementById("target-sel");
      if (targetSel) targetSel.hass = this._hass;
    }
    _nowStr() {
      const d2 = /* @__PURE__ */ new Date();
      const yyyy = d2.getFullYear();
      const mm = String(d2.getMonth() + 1).padStart(2, "0");
      const dd = String(d2.getDate()).padStart(2, "0");
      const hh = String(d2.getHours()).padStart(2, "0");
      const min = String(d2.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
    // Resolve config target from `target`, or legacy `entity`/`entities`.
    // Normalises all fields to arrays (HA target selector may store single values as strings).
    _configTarget() {
      const cfg = this._config;
      const norm = (v2) => {
        if (!v2) {
          return [];
        }
        if (Array.isArray(v2)) {
          return v2;
        }
        return [v2];
      };
      let raw;
      if (cfg.target) raw = cfg.target;
      else if (cfg.entity) raw = { entity_id: [cfg.entity] };
      else if (cfg.entities?.length) raw = { entity_id: cfg.entities };
      else return { entity_id: [], device_id: [], area_id: [], label_id: [] };
      return {
        entity_id: norm(raw.entity_id),
        device_id: norm(raw.device_id),
        area_id: norm(raw.area_id),
        label_id: norm(raw.label_id)
      };
    }
    _hasConfigTarget() {
      const t2 = this._configTarget();
      return !!(t2.entity_id?.length || t2.device_id?.length || t2.area_id?.length || t2.label_id?.length);
    }
    // Build read-only chips for config-set targets
    _buildConfigChips(wrap) {
      if (!this._hasConfigTarget()) return;
      const t2 = this._configTarget();
      const label = document.createElement("div");
      label.className = "chips-label";
      label.textContent = "Data point will be associated with";
      wrap.appendChild(label);
      const row = document.createElement("div");
      row.className = "config-chips";
      const addChip = (icon, name) => {
        const chip = document.createElement("span");
        chip.className = "config-chip";
        const ico = document.createElement("ha-icon");
        ico.setAttribute("icon", icon);
        chip.appendChild(ico);
        chip.appendChild(document.createTextNode(name));
        row.appendChild(chip);
      };
      (t2.entity_id || []).forEach((id) => addChip(entityIcon$1(this._hass, id), entityName$1(this._hass, id)));
      (t2.device_id || []).forEach((id) => addChip(deviceIcon$1(this._hass, id), deviceName$1(this._hass, id)));
      (t2.area_id || []).forEach((id) => addChip(areaIcon$1(this._hass, id), areaName$1(this._hass, id)));
      (t2.label_id || []).forEach((id) => addChip(labelIcon$1(this._hass, id), labelName$1(this._hass, id)));
      wrap.appendChild(row);
    }
    _render() {
      this._rendered = true;
      const cfg = this._config;
      const hasTitle = !!cfg.title;
      const showDate = cfg.show_date !== false;
      const showAnnotation = cfg.show_annotation !== false;
      this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; }
        .card-header {
          font-size: 1.1em;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--primary-text-color);
        }
        .form-group { margin-bottom: 12px; }
        .row { display: flex; gap: 10px; align-items: flex-end; }
        .row .form-group { flex: 1; min-width: 0; }
        ha-textfield { display: block; width: 100%; }
        ha-icon-picker { display: block; width: 100%; }
        .field-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--secondary-text-color);
        }
        .annotation-input {
          display: block;
          width: 100%;
          min-height: 104px;
          resize: vertical;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
          border-radius: 12px;
          background: var(--card-background-color, var(--primary-background-color, #fff));
          color: var(--primary-text-color);
          font: inherit;
          line-height: 1.45;
        }
        .annotation-input::placeholder {
          color: var(--secondary-text-color);
        }
        .annotation-input:focus {
          outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 40%, transparent);
          outline-offset: 1px;
        }
        .color-preview {
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid var(--divider-color, #ccc);
          cursor: pointer; padding: 0; overflow: hidden;
          position: relative; flex-shrink: 0;
        }
        .color-preview input[type=color] {
          position: absolute; top: -4px; left: -4px;
          width: calc(100% + 8px); height: calc(100% + 8px);
          border: none; cursor: pointer; padding: 0; background: none; opacity: 0;
        }
        .color-swatch-inner {
          display: block; width: 100%; height: 100%;
          border-radius: 50%; pointer-events: none;
        }
        .chips-label {
          font-size: 0.75em;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        .config-chips {
          display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;
        }
        .config-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.78em;
          color: var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          padding: 2px 10px; border-radius: 999px;
          white-space: nowrap;
        }
        .config-chip ha-icon { --mdc-icon-size: 12px; }
        ha-button {
          display: block; margin-top: 8px;
          --mdc-theme-primary: var(--primary-color);
        }
        .feedback {
          font-size: 0.82em; margin-top: 8px; padding: 6px 10px;
          border-radius: 6px; display: none;
        }
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${hasTitle ? `<div class="card-header">${esc$1(cfg.title)}</div>` : ""}

        <div class="form-group">
          <ha-textfield id="msg" label="Message *" placeholder="What happened?" style="width:100%"></ha-textfield>
        </div>

        ${showAnnotation ? `
        <div class="form-group">
          <label class="field-label" for="ann">Annotation</label>
          <textarea id="ann" class="annotation-input" placeholder="Detailed note shown on chart hover…"></textarea>
        </div>
        ` : ""}

        ${showDate ? `
        <div class="form-group">
          <ha-textfield id="date" label="Date & Time" type="datetime-local" style="width:100%"></ha-textfield>
        </div>
        ` : ""}

        <div class="row">
          <div class="form-group">
            <ha-icon-picker id="icon-picker" label="Icon"></ha-icon-picker>
          </div>
          <div class="form-group" style="max-width:64px;display:flex;align-items:center;justify-content:center;">
            <div class="color-preview" id="color-preview">
              <span class="color-swatch-inner" id="color-swatch"></span>
              <input id="color" type="color" value="${cfg.default_color || "#03a9f4"}" title="Colour" />
            </div>
          </div>
        </div>

        <div class="form-group" id="target-wrap"></div>

        <ha-button id="btn" raised>${esc$1(cfg.submit_label || "Record Event")}</ha-button>
        <div class="feedback" id="feedback"></div>
      </ha-card>`;
      const targetWrap = this.shadowRoot.getElementById("target-wrap");
      if (cfg.show_config_targets !== false) this._buildConfigChips(targetWrap);
      if (cfg.show_target_picker !== false) {
        const targetSel = document.createElement("ha-selector");
        targetSel.id = "target-sel";
        targetSel.selector = { target: {} };
        targetSel.hass = this._hass;
        targetSel.value = {};
        this._userTarget = {};
        targetSel.addEventListener("value-changed", (e2) => {
          this._userTarget = e2.detail.value || {};
          targetSel.value = this._userTarget;
        });
        targetWrap.appendChild(targetSel);
      }
      this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());
      if (showDate) {
        const dateEl = this.shadowRoot.getElementById("date");
        if (dateEl) dateEl.value = cfg.default_date || this._nowStr();
      }
      const annEl = this.shadowRoot.getElementById("ann");
      if (annEl) annEl.value = cfg.default_annotation || "";
      if (annEl) {
        annEl.addEventListener("keydown", (e2) => {
          if (e2.key === "Enter" && (e2.ctrlKey || e2.metaKey)) {
            e2.preventDefault();
            this._record();
          }
        });
      }
      const iconPicker = this.shadowRoot.getElementById("icon-picker");
      if (iconPicker) iconPicker.value = cfg.default_icon || "mdi:bookmark";
      const msgEl = this.shadowRoot.getElementById("msg");
      if (msgEl) msgEl.value = cfg.default_message || "";
      const colorInput = this.shadowRoot.getElementById("color");
      const colorSwatch = this.shadowRoot.getElementById("color-swatch");
      const colorPreview = this.shadowRoot.getElementById("color-preview");
      if (colorInput && colorSwatch && colorPreview) {
        const initialColor = colorInput.value;
        colorSwatch.style.background = initialColor;
        colorPreview.style.background = initialColor;
        colorInput.addEventListener("input", () => {
          colorSwatch.style.background = colorInput.value;
          colorPreview.style.background = colorInput.value;
        });
      }
      this._updateHassOnChildren();
    }
    _mergeTargets(a2, b2) {
      const norm = (v2) => {
        if (!v2) {
          return [];
        }
        if (Array.isArray(v2)) {
          return v2;
        }
        return [v2];
      };
      const merge = (x2, y2) => [.../* @__PURE__ */ new Set([...norm(x2), ...norm(y2)])];
      return {
        entity_id: merge(a2.entity_id, b2.entity_id),
        device_id: merge(a2.device_id, b2.device_id),
        area_id: merge(a2.area_id, b2.area_id),
        label_id: merge(a2.label_id, b2.label_id)
      };
    }
    async _record() {
      const msgEl = this.shadowRoot.getElementById("msg");
      const message = (msgEl.value || "").trim();
      if (!message) {
        msgEl.focus();
        return;
      }
      const btn = this.shadowRoot.getElementById("btn");
      btn.disabled = true;
      const data = { message };
      const annEl = this.shadowRoot.getElementById("ann");
      const ann = (annEl?.value || "").trim();
      if (ann) data.annotation = ann;
      const iconPicker = this.shadowRoot.getElementById("icon-picker");
      const icon = iconPicker?.value;
      if (icon) data.icon = icon;
      data.color = this.shadowRoot.getElementById("color")?.value || this._config.default_color || "#03a9f4";
      const dateEl = this.shadowRoot.getElementById("date");
      const dateVal = (dateEl?.value || "").trim();
      if (dateVal) data.date = dateVal;
      const merged = this._mergeTargets(this._configTarget(), this._userTarget || {});
      if (merged.entity_id?.length) data.entity_ids = merged.entity_id;
      if (merged.device_id?.length) data.device_ids = merged.device_id;
      if (merged.area_id?.length) data.area_ids = merged.area_id;
      if (merged.label_id?.length) data.label_ids = merged.label_id;
      const fb = this.shadowRoot.getElementById("feedback");
      try {
        await this._hass.callService(DOMAIN$1, "record", data);
        window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
        this.dispatchEvent(new CustomEvent("hass-datapoints-action-recorded", {
          bubbles: true,
          composed: true,
          detail: { ...data }
        }));
        msgEl.value = "";
        if (annEl) annEl.value = "";
        if (dateEl) dateEl.value = this._config.default_date || this._nowStr();
        this._userTarget = {};
        const targetSel = this.shadowRoot.getElementById("target-sel");
        if (targetSel) targetSel.value = {};
        fb.className = "feedback ok";
        fb.textContent = "Event recorded!";
        fb.style.display = "block";
        setTimeout(() => fb.style.display = "none", 3e3);
      } catch (e2) {
        fb.className = "feedback err";
        fb.textContent = `Error: ${e2.message || "unknown error"}`;
        fb.style.display = "block";
        console.error("[hass-datapoints action-card]", e2);
      }
      btn.disabled = false;
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-action-card-editor");
    }
    static getStubConfig() {
      return { title: "Record Event" };
    }
    getGridOptions() {
      const hasAnnotation = this._config?.show_annotation !== false;
      return {
        rows: hasAnnotation ? 10 : 7,
        min_rows: hasAnnotation ? 10 : 7,
        max_rows: hasAnnotation ? 10 : 7
      };
    }
    getCardSize() {
      return this._config?.show_annotation !== false ? 10 : 7;
    }
  }
  const t$3 = globalThis, e$4 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$3 = /* @__PURE__ */ Symbol(), o$3 = /* @__PURE__ */ new WeakMap();
  let n$2 = class n {
    constructor(t2, e2, o2) {
      if (this._$cssResult$ = true, o2 !== s$3) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t2, this.t = e2;
    }
    get styleSheet() {
      let t2 = this.o;
      const s2 = this.t;
      if (e$4 && void 0 === t2) {
        const e2 = void 0 !== s2 && 1 === s2.length;
        e2 && (t2 = o$3.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$3.set(s2, t2));
      }
      return t2;
    }
    toString() {
      return this.cssText;
    }
  };
  const r$2 = (t2) => new n$2("string" == typeof t2 ? t2 : t2 + "", void 0, s$3), i$5 = (t2, ...e2) => {
    const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
      if (true === t3._$cssResult$) return t3.cssText;
      if ("number" == typeof t3) return t3;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s2) + t2[o3 + 1], t2[0]);
    return new n$2(o2, t2, s$3);
  }, S$1 = (s2, o2) => {
    if (e$4) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
    else for (const e2 of o2) {
      const o3 = document.createElement("style"), n2 = t$3.litNonce;
      void 0 !== n2 && o3.setAttribute("nonce", n2), o3.textContent = e2.cssText, s2.appendChild(o3);
    }
  }, c$3 = e$4 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
    let e2 = "";
    for (const s2 of t3.cssRules) e2 += s2.cssText;
    return r$2(e2);
  })(t2) : t2;
  const { is: i$4, defineProperty: e$3, getOwnPropertyDescriptor: h$2, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$2, getPrototypeOf: n$1 } = Object, a$1 = globalThis, c$2 = a$1.trustedTypes, l$1 = c$2 ? c$2.emptyScript : "", p$2 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$3 = { toAttribute(t2, s2) {
    switch (s2) {
      case Boolean:
        t2 = t2 ? l$1 : null;
        break;
      case Object:
      case Array:
        t2 = null == t2 ? t2 : JSON.stringify(t2);
    }
    return t2;
  }, fromAttribute(t2, s2) {
    let i2 = t2;
    switch (s2) {
      case Boolean:
        i2 = null !== t2;
        break;
      case Number:
        i2 = null === t2 ? null : Number(t2);
        break;
      case Object:
      case Array:
        try {
          i2 = JSON.parse(t2);
        } catch (t3) {
          i2 = null;
        }
    }
    return i2;
  } }, f$1 = (t2, s2) => !i$4(t2, s2), b$1 = { attribute: true, type: String, converter: u$3, reflect: false, useDefault: false, hasChanged: f$1 };
  Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
  let y$1 = class y extends HTMLElement {
    static addInitializer(t2) {
      this._$Ei(), (this.l ??= []).push(t2);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t2, s2 = b$1) {
      if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
        const i2 = /* @__PURE__ */ Symbol(), h2 = this.getPropertyDescriptor(t2, i2, s2);
        void 0 !== h2 && e$3(this.prototype, t2, h2);
      }
    }
    static getPropertyDescriptor(t2, s2, i2) {
      const { get: e2, set: r2 } = h$2(this.prototype, t2) ?? { get() {
        return this[s2];
      }, set(t3) {
        this[s2] = t3;
      } };
      return { get: e2, set(s3) {
        const h2 = e2?.call(this);
        r2?.call(this, s3), this.requestUpdate(t2, h2, i2);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t2) {
      return this.elementProperties.get(t2) ?? b$1;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d$1("elementProperties"))) return;
      const t2 = n$1(this);
      t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d$1("finalized"))) return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
        const t3 = this.properties, s2 = [...r$1(t3), ...o$2(t3)];
        for (const i2 of s2) this.createProperty(i2, t3[i2]);
      }
      const t2 = this[Symbol.metadata];
      if (null !== t2) {
        const s2 = litPropertyMetadata.get(t2);
        if (void 0 !== s2) for (const [t3, i2] of s2) this.elementProperties.set(t3, i2);
      }
      this._$Eh = /* @__PURE__ */ new Map();
      for (const [t3, s2] of this.elementProperties) {
        const i2 = this._$Eu(t3, s2);
        void 0 !== i2 && this._$Eh.set(i2, t3);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s2) {
      const i2 = [];
      if (Array.isArray(s2)) {
        const e2 = new Set(s2.flat(1 / 0).reverse());
        for (const s3 of e2) i2.unshift(c$3(s3));
      } else void 0 !== s2 && i2.push(c$3(s2));
      return i2;
    }
    static _$Eu(t2, s2) {
      const i2 = s2.attribute;
      return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
    }
    addController(t2) {
      (this._$EO ??= /* @__PURE__ */ new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
    }
    removeController(t2) {
      this._$EO?.delete(t2);
    }
    _$E_() {
      const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
      for (const i2 of s2.keys()) this.hasOwnProperty(i2) && (t2.set(i2, this[i2]), delete this[i2]);
      t2.size > 0 && (this._$Ep = t2);
    }
    createRenderRoot() {
      const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S$1(t2, this.constructor.elementStyles), t2;
    }
    connectedCallback() {
      this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
    }
    enableUpdating(t2) {
    }
    disconnectedCallback() {
      this._$EO?.forEach((t2) => t2.hostDisconnected?.());
    }
    attributeChangedCallback(t2, s2, i2) {
      this._$AK(t2, i2);
    }
    _$ET(t2, s2) {
      const i2 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i2);
      if (void 0 !== e2 && true === i2.reflect) {
        const h2 = (void 0 !== i2.converter?.toAttribute ? i2.converter : u$3).toAttribute(s2, i2.type);
        this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
      }
    }
    _$AK(t2, s2) {
      const i2 = this.constructor, e2 = i2._$Eh.get(t2);
      if (void 0 !== e2 && this._$Em !== e2) {
        const t3 = i2.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$3;
        this._$Em = e2;
        const r2 = h2.fromAttribute(s2, t3.type);
        this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
      }
    }
    requestUpdate(t2, s2, i2, e2 = false, h2) {
      if (void 0 !== t2) {
        const r2 = this.constructor;
        if (false === e2 && (h2 = this[t2]), i2 ??= r2.getPropertyOptions(t2), !((i2.hasChanged ?? f$1)(h2, s2) || i2.useDefault && i2.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(r2._$Eu(t2, i2)))) return;
        this.C(t2, s2, i2);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t2, s2, { useDefault: i2, reflect: e2, wrapped: h2 }, r2) {
      i2 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i2 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t2));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t3) {
        Promise.reject(t3);
      }
      const t2 = this.scheduleUpdate();
      return null != t2 && await t2, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
          for (const [t4, s3] of this._$Ep) this[t4] = s3;
          this._$Ep = void 0;
        }
        const t3 = this.constructor.elementProperties;
        if (t3.size > 0) for (const [s3, i2] of t3) {
          const { wrapped: t4 } = i2, e2 = this[s3];
          true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i2, e2);
        }
      }
      let t2 = false;
      const s2 = this._$AL;
      try {
        t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
      } catch (s3) {
        throw t2 = false, this._$EM(), s3;
      }
      t2 && this._$AE(s2);
    }
    willUpdate(t2) {
    }
    _$AE(t2) {
      this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
    }
    _$EM() {
      this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t2) {
      return true;
    }
    update(t2) {
      this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
    }
    updated(t2) {
    }
    firstUpdated(t2) {
    }
  };
  y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$2?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
  const t$2 = globalThis, i$3 = (t2) => t2, s$2 = t$2.trustedTypes, e$2 = s$2 ? s$2.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, h$1 = "$lit$", o$1 = `lit$${Math.random().toFixed(9).slice(2)}$`, n = "?" + o$1, r = `<${n}>`, l = document, c$1 = () => l.createComment(""), a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, u$2 = Array.isArray, d = (t2) => u$2(t2) || "function" == typeof t2?.[Symbol.iterator], f = "[ 	\n\f\r]", v$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m$1 = />/g, p$1 = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y = /^(?:script|style|textarea|title)$/i, x = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 }), b = x(1), E = /* @__PURE__ */ Symbol.for("lit-noChange"), A = /* @__PURE__ */ Symbol.for("lit-nothing"), C = /* @__PURE__ */ new WeakMap(), P = l.createTreeWalker(l, 129);
  function V(t2, i2) {
    if (!u$2(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== e$2 ? e$2.createHTML(i2) : i2;
  }
  const N = (t2, i2) => {
    const s2 = t2.length - 1, e2 = [];
    let n2, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = v$1;
    for (let i3 = 0; i3 < s2; i3++) {
      const s3 = t2[i3];
      let a2, u2, d2 = -1, f2 = 0;
      for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v$1 ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m$1 : void 0 !== u2[2] ? (y.test(u2[2]) && (n2 = RegExp("</" + u2[2], "g")), c2 = p$1) : void 0 !== u2[3] && (c2 = p$1) : c2 === p$1 ? ">" === u2[0] ? (c2 = n2 ?? v$1, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p$1 : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p$1 : c2 === _ || c2 === m$1 ? c2 = v$1 : (c2 = p$1, n2 = void 0);
      const x2 = c2 === p$1 && t2[i3 + 1].startsWith("/>") ? " " : "";
      l2 += c2 === v$1 ? s3 + r : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h$1 + s3.slice(d2) + o$1 + x2) : s3 + o$1 + (-2 === d2 ? i3 : x2);
    }
    return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), e2];
  };
  class S {
    constructor({ strings: t2, _$litType$: i2 }, e2) {
      let r2;
      this.parts = [];
      let l2 = 0, a2 = 0;
      const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i2);
      if (this.el = S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i2 || 3 === i2) {
        const t3 = this.el.content.firstChild;
        t3.replaceWith(...t3.childNodes);
      }
      for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
        if (1 === r2.nodeType) {
          if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h$1)) {
            const i3 = v2[a2++], s2 = r2.getAttribute(t3).split(o$1), e3 = /([.?@])?(.*)/.exec(i3);
            d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
          } else t3.startsWith(o$1) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
          if (y.test(r2.tagName)) {
            const t3 = r2.textContent.split(o$1), i3 = t3.length - 1;
            if (i3 > 0) {
              r2.textContent = s$2 ? s$2.emptyScript : "";
              for (let s2 = 0; s2 < i3; s2++) r2.append(t3[s2], c$1()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
              r2.append(t3[i3], c$1());
            }
          }
        } else if (8 === r2.nodeType) if (r2.data === n) d2.push({ type: 2, index: l2 });
        else {
          let t3 = -1;
          for (; -1 !== (t3 = r2.data.indexOf(o$1, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o$1.length - 1;
        }
        l2++;
      }
    }
    static createElement(t2, i2) {
      const s2 = l.createElement("template");
      return s2.innerHTML = t2, s2;
    }
  }
  function M$1(t2, i2, s2 = t2, e2) {
    if (i2 === E) return i2;
    let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
    const o2 = a(i2) ? void 0 : i2._$litDirective$;
    return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = M$1(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
  }
  class R {
    constructor(t2, i2) {
      this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t2) {
      const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i2, true);
      P.currentNode = e2;
      let h2 = P.nextNode(), o2 = 0, n2 = 0, r2 = s2[0];
      for (; void 0 !== r2; ) {
        if (o2 === r2.index) {
          let i3;
          2 === r2.type ? i3 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i3 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i3 = new Z(h2, this, t2)), this._$AV.push(i3), r2 = s2[++n2];
        }
        o2 !== r2?.index && (h2 = P.nextNode(), o2++);
      }
      return P.currentNode = l, e2;
    }
    p(t2) {
      let i2 = 0;
      for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
    }
  }
  class k {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t2, i2, s2, e2) {
      this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
    }
    get parentNode() {
      let t2 = this._$AA.parentNode;
      const i2 = this._$AM;
      return void 0 !== i2 && 11 === t2?.nodeType && (t2 = i2.parentNode), t2;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t2, i2 = this) {
      t2 = M$1(this, t2, i2), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
    }
    O(t2) {
      return this._$AA.parentNode.insertBefore(t2, this._$AB);
    }
    T(t2) {
      this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
    }
    _(t2) {
      this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
    }
    $(t2) {
      const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
      if (this._$AH?._$AD === e2) this._$AH.p(i2);
      else {
        const t3 = new R(e2, this), s3 = t3.u(this.options);
        t3.p(i2), this.T(s3), this._$AH = t3;
      }
    }
    _$AC(t2) {
      let i2 = C.get(t2.strings);
      return void 0 === i2 && C.set(t2.strings, i2 = new S(t2)), i2;
    }
    k(t2) {
      u$2(this._$AH) || (this._$AH = [], this._$AR());
      const i2 = this._$AH;
      let s2, e2 = 0;
      for (const h2 of t2) e2 === i2.length ? i2.push(s2 = new k(this.O(c$1()), this.O(c$1()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
      e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
    }
    _$AR(t2 = this._$AA.nextSibling, s2) {
      for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
        const s3 = i$3(t2).nextSibling;
        i$3(t2).remove(), t2 = s3;
      }
    }
    setConnected(t2) {
      void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
    }
  }
  class H {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t2, i2, s2, e2, h2) {
      this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
    }
    _$AI(t2, i2 = this, s2, e2) {
      const h2 = this.strings;
      let o2 = false;
      if (void 0 === h2) t2 = M$1(this, t2, i2, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
      else {
        const e3 = t2;
        let n2, r2;
        for (t2 = h2[0], n2 = 0; n2 < h2.length - 1; n2++) r2 = M$1(this, e3[s2 + n2], i2, n2), r2 === E && (r2 = this._$AH[n2]), o2 ||= !a(r2) || r2 !== this._$AH[n2], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n2 + 1]), this._$AH[n2] = r2;
      }
      o2 && !e2 && this.j(t2);
    }
    j(t2) {
      t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
    }
  }
  class I extends H {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t2) {
      this.element[this.name] = t2 === A ? void 0 : t2;
    }
  }
  class L extends H {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t2) {
      this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
    }
  }
  class z extends H {
    constructor(t2, i2, s2, e2, h2) {
      super(t2, i2, s2, e2, h2), this.type = 5;
    }
    _$AI(t2, i2 = this) {
      if ((t2 = M$1(this, t2, i2, 0) ?? A) === E) return;
      const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
      e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
    }
    handleEvent(t2) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
    }
  }
  class Z {
    constructor(t2, i2, s2) {
      this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t2) {
      M$1(this, t2);
    }
  }
  const j = { I: k }, B = t$2.litHtmlPolyfillSupport;
  B?.(S, k), (t$2.litHtmlVersions ??= []).push("3.3.2");
  const D = (t2, i2, s2) => {
    const e2 = s2?.renderBefore ?? i2;
    let h2 = e2._$litPart$;
    if (void 0 === h2) {
      const t3 = s2?.renderBefore ?? null;
      e2._$litPart$ = h2 = new k(i2.insertBefore(c$1(), t3), t3, void 0, s2 ?? {});
    }
    return h2._$AI(t2), h2;
  };
  const s$1 = globalThis;
  let i$2 = class i extends y$1 {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      const t2 = super.createRenderRoot();
      return this.renderOptions.renderBefore ??= t2.firstChild, t2;
    }
    update(t2) {
      const r2 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(r2, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(true);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(false);
    }
    render() {
      return E;
    }
  };
  i$2._$litElement$ = true, i$2["finalized"] = true, s$1.litElementHydrateSupport?.({ LitElement: i$2 });
  const o = s$1.litElementPolyfillSupport;
  o?.({ LitElement: i$2 });
  (s$1.litElementVersions ??= []).push("4.2.2");
  class HassRecordsDevToolCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._entities = [];
      this._suppressEntityChange = false;
      this._nextWindowId = 1;
      this._results = /* @__PURE__ */ new Map();
    }
    setConfig(config) {
      this._config = config || {};
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._render();
        this._refreshDevCount();
      }
      this._updateHassOnChildren();
    }
    _updateHassOnChildren() {
      if (!this.shadowRoot || !this._hass) return;
      const ep = this.shadowRoot.getElementById("entity-picker");
      if (!ep) return;
      this._suppressEntityChange = true;
      ep.hass = this._hass;
      ep.value = this._entities;
      setTimeout(() => {
        this._suppressEntityChange = false;
      }, 100);
    }
    _render() {
      this._rendered = true;
      const cfg = this._config;
      this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; }
        .card-header {
          font-size: 1.1em; font-weight: 500; margin-bottom: 16px;
          color: var(--primary-text-color);
        }
        .section-title {
          font-size: 0.8em; font-weight: 600; text-transform: uppercase;
          color: var(--secondary-text-color); letter-spacing: 0.06em;
          margin: 0 0 10px;
        }
        ha-selector { display: block; width: 100%; }
        .form-group { margin-bottom: 12px; }
        .feedback {
          font-size: 0.82em; margin-top: 8px; padding: 6px 10px;
          border-radius: 6px; display: none;
        }
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }

        /* ── Window config rows ── */
        .windows-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .windows-sub { font-size: 0.82em; color: var(--secondary-text-color); }
        .add-window-btn {
          font-size: 0.8em; color: var(--primary-color);
          border: 1px solid var(--primary-color); border-radius: 14px;
          background: none; cursor: pointer; padding: 3px 10px; font: inherit;
          transition: background 0.15s;
        }
        .add-window-btn:hover { background: rgba(var(--rgb-primary-color,3,169,244), 0.1); }

        .window-row {
          display: flex; align-items: flex-start; gap: 8px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          border-radius: 8px; padding: 10px 10px 10px 12px;
          margin-bottom: 6px;
        }
        .window-fields { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; }
        .w-label-wrap { flex: 1.2; min-width: 90px; }
        .w-start-wrap { flex: 1.8; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
        .w-start-label { font-size: 0.72em; color: var(--secondary-text-color); padding-left: 2px; }
        .w-start {
          padding: 9px 10px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font: inherit; font-size: 0.85em;
          width: 100%; box-sizing: border-box;
          height: 40px;
        }
        .w-start:focus { outline: 2px solid var(--primary-color); border-color: transparent; outline-offset: -1px; }
        .w-hours-wrap { flex: 0 0 74px; }
        .w-hours {
          padding: 9px 8px; width: 100%; box-sizing: border-box; height: 40px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font: inherit; font-size: 0.85em;
        }
        .w-hours:focus { outline: 2px solid var(--primary-color); border-color: transparent; outline-offset: -1px; }
        .w-label-native {
          padding: 9px 10px; width: 100%; box-sizing: border-box; height: 40px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font: inherit; font-size: 0.85em;
        }
        .w-label-native:focus { outline: 2px solid var(--primary-color); border-color: transparent; outline-offset: -1px; }
        .w-label-native::placeholder { color: var(--secondary-text-color); }
        .w-field-label { font-size: 0.72em; color: var(--secondary-text-color); padding-left: 2px; margin-bottom: 3px; }
        .remove-window-btn {
          flex-shrink: 0; align-self: center; border: none; background: none;
          cursor: pointer; color: var(--secondary-text-color); padding: 6px;
          border-radius: 50%; line-height: 0; transition: color 0.15s, background 0.15s;
        }
        .remove-window-btn:hover { color: var(--error-color, #f44336); background: rgba(244,67,54,0.1); }
        .remove-window-btn[disabled] { opacity: 0.25; pointer-events: none; }
        .remove-window-btn ha-icon { --mdc-icon-size: 18px; }

        .analyze-row { margin-top: 14px; display: flex; align-items: center; gap: 10px; }

        /* ── Results ── */
        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
        }
        .selected-summary { font-size: 0.84em; color: var(--secondary-text-color); flex: 1; }
        .selected-summary strong { color: var(--primary-text-color); }

        .window-result { margin-bottom: 10px; border-radius: 8px; overflow: hidden; border: 1px solid var(--divider-color, #e0e0e0); }
        .window-result-header {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          cursor: pointer; user-select: none;
        }
        .window-result-toggle { font-size: 0.7em; color: var(--secondary-text-color); flex-shrink: 0; transition: transform 0.15s; }
        .window-result.collapsed .window-result-toggle { transform: rotate(-90deg); }
        .window-result-title { flex: 1; font-size: 0.88em; font-weight: 600; color: var(--primary-text-color); }
        .window-result-meta { font-weight: 400; font-size: 0.88em; color: var(--secondary-text-color); }
        .window-result-links { display: flex; gap: 10px; flex-shrink: 0; }
        .window-link {
          font-size: 0.78em; color: var(--primary-color);
          cursor: pointer; border: none; background: none; padding: 0; font: inherit;
        }
        .window-link:hover { text-decoration: underline; }

        .window-result-body { display: block; }
        .window-result.collapsed .window-result-body { display: none; }

        .changes-list { max-height: 260px; overflow-y: auto; }
        .change-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 7px 12px;
          border-top: 1px solid var(--divider-color, #e0e0e0);
          cursor: pointer;
        }
        .change-item:hover { background: var(--secondary-background-color, rgba(0,0,0,0.04)); }
        .change-item input[type=checkbox] { margin-top: 3px; flex-shrink: 0; cursor: pointer; }
        .change-info { flex: 1; min-width: 0; }
        .change-msg { font-size: 0.88em; font-weight: 500; color: var(--primary-text-color); }
        .change-meta { font-size: 0.76em; color: var(--secondary-text-color); margin-top: 1px; }
        .empty-changes { padding: 16px 12px; font-size: 0.84em; color: var(--secondary-text-color); }

        /* ── Dev points section ── */
        .divider { border: none; border-top: 1px solid var(--divider-color, #e0e0e0); margin: 20px 0; }
        .dev-summary {
          display: flex; align-items: center; padding: 10px 14px;
          background: var(--secondary-background-color, rgba(0,0,0,0.04));
          border-radius: 8px; margin-bottom: 10px;
        }
        .dev-count-label { font-size: 0.88em; color: var(--primary-text-color); }
        .dev-count-num { font-weight: 600; color: var(--primary-color); }
        .delete-btn { --mdc-theme-primary: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${cfg.title ? `<div class="card-header">${esc$1(cfg.title)}</div>` : ""}

        <div class="section-title">Analyze HA History</div>

        <div class="form-group">
          <ha-selector id="entity-picker" label="Entities to analyze"></ha-selector>
        </div>

        <div class="windows-header">
          <span class="windows-sub">Comparison windows</span>
          <button class="add-window-btn" id="add-window-btn">+ Add window</button>
        </div>
        <div id="windows-list"></div>

        <div class="analyze-row">
          <ha-button id="analyze-btn" raised>Analyze all windows</ha-button>
        </div>
        <div id="analyze-status" class="feedback"></div>

        <div id="results-section" style="display:none; margin-top:18px;">
          <div class="results-bar">
            <span class="selected-summary" id="selected-summary"></span>
            <ha-button id="record-btn" raised>Record selected as dev datapoints</ha-button>
          </div>
          <div id="results-list"></div>
          <div id="record-status" class="feedback"></div>
        </div>

        <hr class="divider">

        <div class="section-title">Dev Datapoints</div>
        <div class="dev-summary">
          <span class="dev-count-label">Currently recorded:&nbsp;<span class="dev-count-num" id="dev-count">—</span>&nbsp;dev data point<span id="dev-count-plural">s</span></span>
        </div>
        <ha-button class="delete-btn" id="delete-dev-btn">Delete all dev datapoints</ha-button>
        <div id="delete-status" class="feedback"></div>
      </ha-card>
    `;
      const ep = this.shadowRoot.getElementById("entity-picker");
      ep.selector = { entity: { multiple: true } };
      ep.value = [];
      this._entities = [];
      this._suppressEntityChange = false;
      ep.addEventListener("value-changed", (e2) => {
        if (this._suppressEntityChange) return;
        const val = e2.detail.value;
        if (Array.isArray(val)) {
          this._entities = val;
        } else if (val) {
          this._entities = [val];
        } else {
          this._entities = [];
        }
      });
      this._addWindowRow();
      this.shadowRoot.getElementById("add-window-btn").addEventListener("click", () => this._addWindowRow());
      this.shadowRoot.getElementById("analyze-btn").addEventListener("click", () => this._analyzeHistory());
      this.shadowRoot.getElementById("record-btn").addEventListener("click", () => this._recordSelected());
      this.shadowRoot.getElementById("delete-dev-btn").addEventListener("click", () => this._deleteAllDev());
    }
    // ── Window management ──────────────────────────────────────────────────────
    _addWindowRow() {
      const id = this._nextWindowId++;
      const container = this.shadowRoot.getElementById("windows-list");
      const totalRows = container.querySelectorAll(".window-row").length;
      const row = document.createElement("div");
      row.className = "window-row";
      row.dataset.wid = id;
      row.innerHTML = `
      <div class="window-fields">
        <div class="w-label-wrap">
          <div class="w-field-label">Label (optional)</div>
          <input class="w-label-native w-label" type="text" placeholder="Window ${totalRows + 1}">
        </div>
        <div class="w-start-wrap">
          <span class="w-start-label">Start date/time (empty&nbsp;=&nbsp;most recent)</span>
          <input class="w-start" type="datetime-local">
        </div>
        <div class="w-hours-wrap">
          <div class="w-field-label">Hours</div>
          <input class="w-hours" type="number" min="1" max="8760" value="24">
        </div>
      </div>
      <button class="remove-window-btn" type="button" title="Remove this window">
        <ha-icon icon="mdi:close-circle-outline"></ha-icon>
      </button>
    `;
      row.querySelector(".remove-window-btn").addEventListener("click", () => {
        if (this.shadowRoot.querySelectorAll(".window-row").length > 1) {
          row.remove();
          this._results.delete(id);
          this._syncRemoveButtons();
          if (this._results.size > 0) this._renderResults();
        }
      });
      container.appendChild(row);
      this._syncRemoveButtons();
    }
    _syncRemoveButtons() {
      const rows = this.shadowRoot.querySelectorAll(".window-row");
      rows.forEach((r2) => {
        r2.querySelector(".remove-window-btn").disabled = rows.length <= 1;
      });
    }
    _readWindowConfigs() {
      return [...this.shadowRoot.querySelectorAll(".window-row")].map((row, idx) => {
        const wid = parseInt(row.dataset.wid);
        const label = (row.querySelector(".w-label").value || "").trim() || `Window ${idx + 1}`;
        const startDt = row.querySelector(".w-start").value;
        const hours = Math.max(1, parseInt(row.querySelector(".w-hours").value) || 24);
        return { id: wid, label, startDt, hours };
      });
    }
    // ── Analysis ───────────────────────────────────────────────────────────────
    async _analyzeHistory() {
      if (!this._entities.length) {
        this._showStatus("analyze-status", "err", "Please select at least one entity.");
        return;
      }
      const windowConfigs = this._readWindowConfigs();
      const btn = this.shadowRoot.getElementById("analyze-btn");
      btn.disabled = true;
      this._results.clear();
      this._showStatus(
        "analyze-status",
        "ok",
        `Fetching history for ${windowConfigs.length} window${windowConfigs.length !== 1 ? "s" : ""}…`
      );
      try {
        const now = /* @__PURE__ */ new Date();
        await Promise.all(windowConfigs.map(async (w) => {
          const start = w.startDt ? new Date(w.startDt) : new Date(now.getTime() - w.hours * 36e5);
          const end = w.startDt ? new Date(start.getTime() + w.hours * 36e5) : now;
          const raw = await this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            entity_ids: this._entities,
            include_start_time_state: false,
            significant_changes_only: false,
            no_attributes: false
          });
          const changes = this._detectChanges(raw || {});
          this._results.set(w.id, {
            label: w.label,
            startDt: w.startDt,
            hours: w.hours,
            changes,
            selected: new Set(changes.map((_2, i2) => i2))
          });
        }));
        this._renderResults();
        this._hideStatus("analyze-status");
        this.shadowRoot.getElementById("results-section").style.display = "block";
      } catch (err) {
        this._showStatus("analyze-status", "err", `Error: ${err.message || "Failed to fetch history"}`);
        console.error("[hass-datapoints dev-tool]", err);
      }
      btn.disabled = false;
    }
    // ── State-change detection ─────────────────────────────────────────────────
    _detectChanges(histResult) {
      const changes = [];
      for (const [entityId, states] of Object.entries(histResult)) {
        if (!states?.length) continue;
        const domain = entityId.split(".")[0];
        const entityState = this._hass?.states?.[entityId];
        const deviceClass = entityState?.attributes?.device_class || "";
        const friendlyName = entityState?.attributes?.friendly_name || entityId;
        const unit = entityState?.attributes?.unit_of_measurement || "";
        for (let i2 = 0; i2 < states.length; i2++) {
          const s2 = states[i2];
          const prev = i2 > 0 ? states[i2 - 1] : null;
          const cur = s2.s;
          const prevVal = prev?.s ?? null;
          if (cur === "unavailable" || cur === "unknown") continue;
          if (prev && prevVal === cur) {
            if (domain !== "climate") continue;
          }
          const tsRaw = s2.lc ?? s2.lu;
          const timestamp = tsRaw != null ? new Date(tsRaw * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
          let message = null;
          let icon = "mdi:bookmark";
          let color = "#03a9f4";
          if (domain === "binary_sensor" || domain === "input_boolean") {
            message = `${friendlyName}: ${this._binaryLabel(deviceClass, cur)}`;
            icon = cur === "on" ? "mdi:toggle-switch" : "mdi:toggle-switch-off";
            color = cur === "on" ? "#4caf50" : "#9e9e9e";
          } else if (domain === "switch") {
            message = `${friendlyName}: turned ${cur === "on" ? "on" : "off"}`;
            icon = cur === "on" ? "mdi:power-plug" : "mdi:power-plug-off";
            color = cur === "on" ? "#ff9800" : "#9e9e9e";
          } else if (domain === "light") {
            message = `${friendlyName}: ${cur === "on" ? "on" : "off"}`;
            icon = cur === "on" ? "mdi:lightbulb" : "mdi:lightbulb-off";
            color = cur === "on" ? "#ffee58" : "#9e9e9e";
          } else if (domain === "cover") {
            const labels = { open: "opened", closed: "closed", opening: "opening", closing: "closing" };
            if (!labels[cur]) continue;
            message = `${friendlyName}: ${labels[cur]}`;
            icon = cur === "open" || cur === "opening" ? "mdi:garage-open" : "mdi:garage";
            color = cur === "open" ? "#4caf50" : "#795548";
          } else if (domain === "climate") {
            const curTemp = s2.a?.temperature;
            const prevTemp = prev?.a?.temperature;
            if (curTemp != null && curTemp !== prevTemp) {
              const tu = s2.a?.temperature_unit || unit || "°";
              message = `${friendlyName}: setpoint → ${curTemp}${tu}`;
              icon = "mdi:thermostat";
              color = "#ff5722";
            } else if (!prev || prevVal !== cur) {
              const modes = { heat: "heating", cool: "cooling", auto: "auto", off: "off", heat_cool: "heat/cool", fan_only: "fan only", dry: "dry" };
              message = `${friendlyName}: mode → ${modes[cur] || cur}`;
              icon = "mdi:thermostat";
              color = "#ff5722";
            } else {
              continue;
            }
          } else if (domain === "sensor") {
            const num = parseFloat(cur);
            const prevNum = prevVal != null ? parseFloat(prevVal) : NaN;
            if (isNaN(num)) continue;
            if (!isNaN(prevNum) && Math.abs(num - prevNum) < 0.5) continue;
            message = `${friendlyName}: ${cur}${unit}`;
            icon = "mdi:gauge";
            color = "#2196f3";
          } else if (domain === "input_number" || domain === "number") {
            const num = parseFloat(cur);
            const prevNum = prevVal != null ? parseFloat(prevVal) : NaN;
            if (isNaN(num) || !isNaN(prevNum) && num === prevNum) continue;
            message = `${friendlyName}: → ${cur}${unit}`;
            icon = "mdi:numeric";
            color = "#9c27b0";
          } else if (domain === "input_select" || domain === "select") {
            if (!prev || prevVal === cur) continue;
            message = `${friendlyName}: → ${cur}`;
            icon = "mdi:form-select";
            color = "#009688";
          } else {
            if (!prev || prevVal === cur) continue;
            message = `${friendlyName}: ${prevVal} → ${cur}`;
            icon = "mdi:swap-horizontal";
            color = "#607d8b";
          }
          if (!message) continue;
          changes.push({ timestamp, message, entity_id: entityId, icon, color });
        }
      }
      changes.sort((a2, b2) => a2.timestamp < b2.timestamp ? -1 : 1);
      return changes;
    }
    _binaryLabel(deviceClass, state) {
      const on = state === "on";
      const map = {
        door: ["opened", "closed"],
        window: ["opened", "closed"],
        garage_door: ["opened", "closed"],
        opening: ["opened", "closed"],
        lock: ["locked", "unlocked"],
        motion: ["motion detected", "motion cleared"],
        occupancy: ["occupied", "vacant"],
        presence: ["home", "away"],
        vibration: ["vibrating", "still"],
        plug: ["plugged in", "unplugged"],
        outlet: ["on", "off"],
        smoke: ["smoke detected", "smoke cleared"],
        moisture: ["wet", "dry"],
        running: ["running", "stopped"],
        connectivity: ["connected", "disconnected"],
        power: ["on", "off"],
        battery_charging: ["charging", "not charging"],
        battery: ["low battery", "battery normal"],
        cold: ["cold", "temperature normal"],
        heat: ["heat", "temperature normal"],
        light: ["light detected", "dark"],
        sound: ["sound detected", "quiet"]
      };
      const pair = map[deviceClass];
      if (pair) {
        return on ? pair[0] : pair[1];
      }
      return on ? "on" : "off";
    }
    // ── Results rendering ──────────────────────────────────────────────────────
    _renderResults() {
      const container = this.shadowRoot.getElementById("results-list");
      const windowOrder = this._readWindowConfigs().map((w) => w.id).filter((id) => this._results.has(id));
      const remainingIds = [...this._results.keys()].filter((id) => !windowOrder.includes(id));
      const orderedIds = [...windowOrder, ...remainingIds];
      container.innerHTML = orderedIds.map((wid) => {
        const r2 = this._results.get(wid);
        if (!r2) return "";
        const { label, startDt, hours, changes, selected } = r2;
        const rangeLabel = startDt ? `from ${new Date(startDt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} · ${hours}h` : `most recent ${hours}h`;
        return `
        <div class="window-result" data-wid="${wid}">
          <div class="window-result-header">
            <span class="window-result-toggle">▼</span>
            <span class="window-result-title">
              ${esc$1(label)}
              <span class="window-result-meta">${esc$1(rangeLabel)} · ${changes.length} change${changes.length !== 1 ? "s" : ""}</span>
            </span>
            <span class="window-result-links">
              <button class="window-link" data-wid="${wid}" data-act="all">All</button>
              <button class="window-link" data-wid="${wid}" data-act="none">None</button>
            </span>
          </div>
          <div class="window-result-body">
            <div class="changes-list">
              ${changes.length === 0 ? `<div class="empty-changes">No state changes detected in this window.</div>` : changes.map((c2, i2) => `
                  <label class="change-item">
                    <input type="checkbox" data-wid="${wid}" data-idx="${i2}" ${selected.has(i2) ? "checked" : ""}>
                    <div class="change-info">
                      <div class="change-msg">${esc$1(c2.message)}</div>
                      <div class="change-meta">${esc$1(fmtDateTime$1(c2.timestamp))} &middot; ${esc$1(c2.entity_id)}</div>
                    </div>
                  </label>`).join("")}
            </div>
          </div>
        </div>
      `;
      }).join("");
      container.querySelectorAll(".window-result-header").forEach((header) => {
        header.addEventListener("click", (e2) => {
          if (e2.target.closest(".window-result-links")) return;
          header.closest(".window-result").classList.toggle("collapsed");
        });
      });
      container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.addEventListener("change", (e2) => {
          const wid = parseInt(e2.target.dataset.wid);
          const idx = parseInt(e2.target.dataset.idx);
          const r2 = this._results.get(wid);
          if (!r2) return;
          if (e2.target.checked) r2.selected.add(idx);
          else r2.selected.delete(idx);
          this._updateSelectedSummary();
        });
      });
      container.querySelectorAll(".window-link").forEach((btn) => {
        btn.addEventListener("click", (e2) => {
          e2.stopPropagation();
          const wid = parseInt(e2.currentTarget.dataset.wid);
          const act = e2.currentTarget.dataset.act;
          const r2 = this._results.get(wid);
          if (!r2) return;
          const cbs = container.querySelectorAll(`input[data-wid="${wid}"]`);
          if (act === "all") {
            r2.selected = new Set(r2.changes.map((_2, i2) => i2));
            cbs.forEach((cb) => {
              cb.checked = true;
            });
          } else {
            r2.selected.clear();
            cbs.forEach((cb) => {
              cb.checked = false;
            });
          }
          this._updateSelectedSummary();
        });
      });
      this._updateSelectedSummary();
    }
    _updateSelectedSummary() {
      let sel = 0;
      let total = 0;
      this._results.forEach((r2) => {
        sel += r2.selected.size;
        total += r2.changes.length;
      });
      const el = this.shadowRoot.getElementById("selected-summary");
      if (el) {
        const wn = this._results.size;
        el.innerHTML = `<strong>${sel}</strong> of ${total} selected across ${wn} window${wn !== 1 ? "s" : ""}`;
      }
    }
    // ── Record / Delete ────────────────────────────────────────────────────────
    async _recordSelected() {
      const allItems = [];
      this._results.forEach((r2) => {
        [...r2.selected].sort((a2, b2) => a2 - b2).forEach((i2) => allItems.push(r2.changes[i2]));
      });
      if (!allItems.length) {
        this._showStatus("record-status", "err", "No items selected.");
        return;
      }
      const btn = this.shadowRoot.getElementById("record-btn");
      btn.disabled = true;
      this._showStatus("record-status", "ok", `Recording ${allItems.length} data point${allItems.length !== 1 ? "s" : ""}…`);
      let ok = 0;
      let fail = 0;
      for (const item of allItems) {
        try {
          await this._hass.callService(DOMAIN$1, "record", {
            message: item.message,
            entity_ids: [item.entity_id],
            icon: item.icon,
            color: item.color,
            date: item.timestamp,
            dev: true
          });
          ok++;
        } catch {
          fail++;
        }
      }
      if (fail) {
        this._showStatus("record-status", "err", `Recorded ${ok}, failed ${fail}.`);
      } else {
        this._showStatus("record-status", "ok", `Recorded ${ok} dev data point${ok !== 1 ? "s" : ""}!`);
      }
      btn.disabled = false;
      await this._refreshDevCount();
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    }
    async _deleteAllDev() {
      const count = parseInt(this.shadowRoot.getElementById("dev-count")?.textContent) || 0;
      if (count === 0) {
        this._showStatus("delete-status", "err", "No dev datapoints to delete.");
        return;
      }
      const confirmed = await confirmDestructiveAction$1(this, {
        title: "Delete dev datapoints",
        message: `Delete all ${count} dev data point${count !== 1 ? "s" : ""}?`,
        confirmLabel: "Delete all"
      });
      if (!confirmed) return;
      const btn = this.shadowRoot.getElementById("delete-dev-btn");
      btn.disabled = true;
      try {
        const result = await this._hass.connection.sendMessagePromise({ type: `${DOMAIN$1}/events/delete_dev` });
        this._showStatus("delete-status", "ok", `Deleted ${result.deleted} dev data point${result.deleted !== 1 ? "s" : ""}.`);
        await this._refreshDevCount();
        window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      } catch (err) {
        this._showStatus("delete-status", "err", `Error: ${err.message || "failed"}`);
      }
      btn.disabled = false;
    }
    async _refreshDevCount() {
      try {
        const result = await this._hass.connection.sendMessagePromise({ type: `${DOMAIN$1}/events` });
        const n2 = (result.events || []).filter((e2) => e2.dev).length;
        const el = this.shadowRoot.getElementById("dev-count");
        const pl = this.shadowRoot.getElementById("dev-count-plural");
        if (el) el.textContent = String(n2);
        if (pl) pl.textContent = n2 === 1 ? "" : "s";
      } catch {
      }
    }
    // ── Utilities ──────────────────────────────────────────────────────────────
    _showStatus(id, cls, msg) {
      const el = this.shadowRoot.getElementById(id);
      if (!el) return;
      el.className = `feedback ${cls}`;
      el.textContent = msg;
      el.style.display = "block";
    }
    _hideStatus(id) {
      const el = this.shadowRoot.getElementById(id);
      if (el) el.style.display = "none";
    }
    static getStubConfig() {
      return { title: "Dev Tool" };
    }
  }
  class DpEditorBase extends i$2 {
    static properties = {
      _config: { type: Object, state: true },
      hass: { type: Object }
    };
    static styles = i$5`
    :host { display: block; }
    .ed {
      display: flex; flex-direction: column;
      gap: 16px; padding: 4px 0 8px;
    }
  `;
    constructor() {
      super();
      this._config = {};
      this.hass = null;
    }
    setConfig(config) {
      this._config = { ...config };
    }
    _fire(cfg) {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: { ...cfg } },
          bubbles: true,
          composed: true
        })
      );
    }
    _set(key, value) {
      const cfg = { ...this._config };
      if (value === "" || value === null || value === void 0) {
        delete cfg[key];
      } else {
        cfg[key] = value;
      }
      this._config = cfg;
      this._fire(cfg);
    }
  }
  customElements.define("dp-editor-base", DpEditorBase);
  class DpSectionHeading extends i$2 {
    static properties = {
      text: { type: String }
    };
    static styles = i$5`
    :host { display: block; }
    .heading {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }
  `;
    constructor() {
      super();
      this.text = "";
    }
    render() {
      return b`<div class="heading">${this.text}</div>`;
    }
  }
  customElements.define("dp-section-heading", DpSectionHeading);
  class DpColorSwatch extends i$2 {
    static properties = {
      color: { type: String },
      label: { type: String }
    };
    static styles = i$5`
    :host {
      display: block;
    }
    .swatch-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .label {
      font-size: 0.875rem;
      color: var(--primary-text-color);
    }
    .swatch-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2px solid var(--divider-color, #ccc);
      cursor: pointer;
      padding: 0;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      background: transparent;
    }
    .swatch-btn input[type="color"] {
      position: absolute;
      top: -4px;
      left: -4px;
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      border: none;
      cursor: pointer;
      padding: 0;
      background: none;
      opacity: 0;
    }
    .swatch-inner {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      pointer-events: none;
    }
  `;
    constructor() {
      super();
      this.color = "#ff9800";
      this.label = "";
    }
    _onInput(e2) {
      const newColor = e2.target.value;
      this.dispatchEvent(
        new CustomEvent("dp-color-change", {
          detail: { color: newColor },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="swatch-wrap">
        ${this.label ? b`<span class="label">${this.label}</span>` : ""}
        <button class="swatch-btn" type="button">
          <input
            type="color"
            .value=${this.color}
            @input=${this._onInput}
          />
          <span class="swatch-inner" style="background-color: ${this.color}"></span>
        </button>
      </div>
    `;
    }
  }
  customElements.define("dp-color-swatch", DpColorSwatch);
  class DpEditorTextField extends i$2 {
    static properties = {
      label: { type: String },
      value: { type: String },
      type: { type: String },
      placeholder: { type: String },
      suffix: { type: String }
    };
    static styles = i$5`
    :host { display: block; }
    ha-textfield { display: block; width: 100%; }
  `;
    constructor() {
      super();
      this.label = "";
      this.value = "";
      this.type = "text";
      this.placeholder = "";
      this.suffix = "";
    }
    firstUpdated() {
      const field = this.shadowRoot.querySelector("ha-textfield");
      if (field) {
        field.label = this.label;
        field.value = this.value;
        if (this.type) {
          field.type = this.type;
        }
        if (this.placeholder) {
          field.placeholder = this.placeholder;
        }
        if (this.suffix) {
          field.suffix = this.suffix;
        }
      }
    }
    updated(changedProps) {
      const field = this.shadowRoot.querySelector("ha-textfield");
      if (!field) {
        return;
      }
      if (changedProps.has("value")) {
        field.value = this.value;
      }
      if (changedProps.has("label")) {
        field.label = this.label;
      }
    }
    _onInput(e2) {
      const rawValue = e2.target.value;
      const value = this.type === "number" ? parseFloat(rawValue) : rawValue;
      this.dispatchEvent(
        new CustomEvent("dp-field-change", {
          detail: { value: this.type === "number" && Number.isNaN(value) ? void 0 : value },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`<ha-textfield @input=${this._onInput}></ha-textfield>`;
    }
  }
  customElements.define("dp-editor-text-field", DpEditorTextField);
  class DpEditorSwitch extends i$2 {
    static properties = {
      label: { type: String },
      checked: { type: Boolean },
      tooltip: { type: String }
    };
    static styles = i$5`
    :host { display: block; }
    .switch-row { display: flex; align-items: center; gap: 4px; }
    .switch-row ha-formfield { flex: 1; }
    .help-icon {
      color: var(--secondary-text-color); cursor: default;
      flex-shrink: 0; position: relative; font-size: 0.85rem;
    }
    .help-icon:hover .help-tooltip { display: block; }
    .help-tooltip {
      display: none; position: absolute; right: 0; top: calc(100% + 4px);
      background: var(--card-background-color, #fff); color: var(--primary-text-color);
      border: 1px solid var(--divider-color, #ccc); border-radius: 6px;
      padding: 6px 10px; font-size: 0.78rem; white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); z-index: 10; pointer-events: none;
    }
  `;
    constructor() {
      super();
      this.label = "";
      this.checked = false;
      this.tooltip = "";
    }
    firstUpdated() {
      const ff = this.shadowRoot.querySelector("ha-formfield");
      if (ff) {
        ff.label = this.label;
      }
      const sw = this.shadowRoot.querySelector("ha-switch");
      if (sw) {
        sw.checked = this.checked;
      }
    }
    updated(changedProps) {
      if (changedProps.has("checked")) {
        const sw = this.shadowRoot.querySelector("ha-switch");
        if (sw) {
          sw.checked = this.checked;
        }
      }
      if (changedProps.has("label")) {
        const ff = this.shadowRoot.querySelector("ha-formfield");
        if (ff) {
          ff.label = this.label;
        }
      }
    }
    _onChange(e2) {
      this.dispatchEvent(
        new CustomEvent("dp-switch-change", {
          detail: { checked: e2.target.checked },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="switch-row">
        <ha-formfield>
          <ha-switch @change=${this._onChange}></ha-switch>
        </ha-formfield>
        ${this.tooltip ? b`
              <span class="help-icon">
                ?
                <span class="help-tooltip">${this.tooltip}</span>
              </span>
            ` : ""}
      </div>
    `;
    }
  }
  customElements.define("dp-editor-switch", DpEditorSwitch);
  class DpEditorEntityPicker extends i$2 {
    static properties = {
      label: { type: String },
      value: { type: String },
      hass: { type: Object }
    };
    static styles = i$5`
    :host { display: block; }
    ha-selector { display: block; width: 100%; }
  `;
    constructor() {
      super();
      this.label = "";
      this.value = "";
      this.hass = null;
    }
    firstUpdated() {
      const el = this.shadowRoot.querySelector("ha-selector");
      if (el) {
        el.label = this.label;
        el.selector = { entity: {} };
        if (this.hass) {
          el.hass = this.hass;
        }
        el.value = this.value;
      }
    }
    updated(changedProps) {
      const el = this.shadowRoot.querySelector("ha-selector");
      if (!el) {
        return;
      }
      if (changedProps.has("value")) {
        el.value = this.value;
      }
      if (changedProps.has("hass") && this.hass) {
        el.hass = this.hass;
      }
    }
    _onValueChanged(e2) {
      this.dispatchEvent(
        new CustomEvent("dp-entity-change", {
          detail: { value: e2.detail.value },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`<ha-selector @value-changed=${this._onValueChanged}></ha-selector>`;
    }
  }
  customElements.define("dp-editor-entity-picker", DpEditorEntityPicker);
  class DpEditorIconPicker extends i$2 {
    static properties = {
      label: { type: String },
      value: { type: String },
      hass: { type: Object }
    };
    static styles = i$5`
    :host { display: block; }
    ha-icon-picker { display: block; width: 100%; }
  `;
    constructor() {
      super();
      this.label = "";
      this.value = "mdi:bookmark";
      this.hass = null;
    }
    firstUpdated() {
      const el = this.shadowRoot.querySelector("ha-icon-picker");
      if (el) {
        el.label = this.label;
        if (this.hass) {
          el.hass = this.hass;
        }
        el.value = this.value;
      }
    }
    updated(changedProps) {
      const el = this.shadowRoot.querySelector("ha-icon-picker");
      if (!el) {
        return;
      }
      if (changedProps.has("value")) {
        el.value = this.value;
      }
      if (changedProps.has("hass") && this.hass) {
        el.hass = this.hass;
      }
    }
    _onValueChanged(e2) {
      this.dispatchEvent(
        new CustomEvent("dp-icon-change", {
          detail: { value: e2.detail.value },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`<ha-icon-picker @value-changed=${this._onValueChanged}></ha-icon-picker>`;
    }
  }
  customElements.define("dp-editor-icon-picker", DpEditorIconPicker);
  class DpEditorSelect extends i$2 {
    static properties = {
      label: { type: String },
      value: { type: String },
      options: { type: Array }
    };
    static styles = i$5`
    :host { display: block; }
    ha-selector { display: block; width: 100%; }
  `;
    constructor() {
      super();
      this.label = "";
      this.value = "";
      this.options = [];
    }
    firstUpdated() {
      const el = this.shadowRoot.querySelector("ha-selector");
      if (el) {
        el.label = this.label;
        el.selector = { select: { options: this.options } };
        el.value = this.value;
      }
    }
    updated(changedProps) {
      const el = this.shadowRoot.querySelector("ha-selector");
      if (!el) {
        return;
      }
      if (changedProps.has("value")) {
        el.value = this.value;
      }
      if (changedProps.has("options")) {
        el.selector = { select: { options: this.options } };
      }
    }
    _onValueChanged(e2) {
      this.dispatchEvent(
        new CustomEvent("dp-select-change", {
          detail: { value: e2.detail.value },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`<ha-selector @value-changed=${this._onValueChanged}></ha-selector>`;
    }
  }
  customElements.define("dp-editor-select", DpEditorSelect);
  class DpEditorEntityList extends i$2 {
    static properties = {
      entities: { type: Array },
      hass: { type: Object },
      buttonLabel: { type: String, attribute: "button-label" }
    };
    static styles = i$5`
    :host { display: block; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .entity-row { display: flex; gap: 8px; align-items: center; }
    .entity-row ha-selector { flex: 1; min-width: 0; }
    .remove-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      font-size: 1.1rem; color: var(--secondary-text-color); line-height: 1;
    }
    .remove-btn:hover { color: var(--error-color, #f44336); }
    .add-wrap { margin-top: 4px; }
  `;
    constructor() {
      super();
      this.entities = [];
      this.hass = null;
      this.buttonLabel = "Add entity";
    }
    _onRemove(index) {
      const next = [...this.entities];
      next.splice(index, 1);
      this.dispatchEvent(
        new CustomEvent("dp-entity-list-change", {
          detail: { entities: next },
          bubbles: true,
          composed: true
        })
      );
    }
    _onAdd() {
      this.dispatchEvent(
        new CustomEvent("dp-entity-list-change", {
          detail: { entities: [...this.entities, ""] },
          bubbles: true,
          composed: true
        })
      );
    }
    _onEntityChange(index, e2) {
      const next = [...this.entities];
      next[index] = e2.detail.value;
      this.dispatchEvent(
        new CustomEvent("dp-entity-list-change", {
          detail: { entities: next },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="list">
        ${this.entities.map(
        (entityId, i2) => b`
            <div class="entity-row">
              <ha-selector
                .selector=${{ entity: {} }}
                .value=${entityId}
                .hass=${this.hass}
                @value-changed=${(e2) => this._onEntityChange(i2, e2)}
              ></ha-selector>
              <button
                class="remove-btn"
                data-action="remove"
                @click=${() => this._onRemove(i2)}
                aria-label="Remove entity"
              ></button>
            </div>
          `
      )}
      </div>
      <div class="add-wrap">
        <ha-button outlined data-action="add" @click=${this._onAdd}>
          ${this.buttonLabel}
        </ha-button>
      </div>
    `;
    }
  }
  customElements.define("dp-editor-entity-list", DpEditorEntityList);
  const editorStyles = i$5`
  .note {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
  }
`;
  class HassRecordsActionCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    _onTargetChanged(e2) {
      const val = e2.detail.value;
      const isEmpty = !val || Object.values(val).every((v2) => !v2?.length);
      this._set("target", isEmpty ? void 0 : val);
    }
    firstUpdated() {
      const tp = this.shadowRoot.querySelector("#target-picker");
      if (tp && this.hass) {
        tp.hass = this.hass;
        tp.value = this._config.target ?? {};
      }
    }
    updated(changedProps) {
      if (changedProps.has("hass") && this.hass) {
        this.shadowRoot.querySelectorAll("ha-selector").forEach((el) => {
          el.hass = this.hass;
        });
      }
    }
    render() {
      const c2 = this._config;
      return b`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c2.title || ""}
          @dp-field-change=${(e2) => this._set("title", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Related items"></dp-section-heading>
        <div class="note">Pre-fill entities, devices, areas or labels that are always linked to recordings from this card.</div>
        <ha-selector
          id="target-picker"
          .selector=${{ target: {} }}
          @value-changed=${this._onTargetChanged}
          style="display:block;width:100%"
        ></ha-selector>
        <dp-editor-switch
          label="Show always included targets on card"
          .checked=${c2.show_config_targets !== false}
          @dp-switch-change=${(e2) => this._set("show_config_targets", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Allow user to add more related items"
          .checked=${c2.show_target_picker !== false}
          @dp-switch-change=${(e2) => this._set("show_target_picker", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>

        <dp-section-heading text="Datapoint Appearance"></dp-section-heading>
        <dp-editor-icon-picker
          label="Default icon"
          .value=${c2.default_icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e2) => this._set("default_icon", e2.detail.value)}
        ></dp-editor-icon-picker>
        <dp-color-swatch
          label="Default colour"
          .color=${c2.default_color || "#03a9f4"}
          @dp-color-change=${(e2) => this._set("default_color", e2.detail.color)}
        ></dp-color-swatch>

        <dp-section-heading text="Form fields"></dp-section-heading>
        <dp-editor-switch
          label="Show date & time field"
          .checked=${c2.show_date !== false}
          @dp-switch-change=${(e2) => this._set("show_date", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show annotation field"
          .checked=${c2.show_annotation !== false}
          @dp-switch-change=${(e2) => this._set("show_annotation", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
      </div>
    `;
    }
  }
  class HassRecordsQuickCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    render() {
      const c2 = this._config;
      return b`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c2.title || ""}
          @dp-field-change=${(e2) => this._set("title", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Input placeholder text"
          .value=${c2.placeholder || ""}
          @dp-field-change=${(e2) => this._set("placeholder", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Icon & colour"></dp-section-heading>
        <dp-editor-icon-picker
          label="Icon"
          .value=${c2.icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e2) => this._set("icon", e2.detail.value)}
        ></dp-editor-icon-picker>
        <dp-color-swatch
          label="Colour"
          .color=${c2.color || AMBER}
          @dp-color-change=${(e2) => this._set("color", e2.detail.color)}
        ></dp-color-swatch>

        <dp-section-heading text="Related items"></dp-section-heading>
        <div class="note">These items will be linked to every record made with this card.</div>
        <dp-editor-entity-picker
          label="Single entity (optional)"
          .value=${c2.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e2) => this._set("entity", e2.detail.value)}
        ></dp-editor-entity-picker>
        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c2.entities || []}
          .hass=${this.hass}
          button-label="Add related items"
          @dp-entity-list-change=${(e2) => this._set("entities", e2.detail.entities.length ? e2.detail.entities : void 0)}
        ></dp-editor-entity-list>

        <dp-section-heading text="Form fields"></dp-section-heading>
        <dp-editor-switch
          label="Show annotation field"
          .checked=${!!c2.show_annotation}
          @dp-switch-change=${(e2) => this._set("show_annotation", e2.detail.checked || void 0)}
        ></dp-editor-switch>
      </div>
    `;
    }
  }
  class HassRecordsHistoryCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    render() {
      const c2 = this._config;
      return b`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c2.title || ""}
          @dp-field-change=${(e2) => this._set("title", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c2.hours_to_show ?? 24)}
          @dp-field-change=${(e2) => this._set("hours_to_show", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity"
          .value=${c2.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e2) => this._set("entity", e2.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c2.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e2) => this._set("entities", e2.detail.entities.length ? e2.detail.entities : void 0)}
        ></dp-editor-entity-list>

        <dp-section-heading text="Display"></dp-section-heading>
        <dp-editor-switch
          label="Show data gaps"
          .checked=${c2.show_data_gaps !== false}
          tooltip="Highlight missing data ranges with dashed lines and boundary markers"
          @dp-switch-change=${(e2) => this._set("show_data_gaps", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
      </div>
    `;
    }
  }
  class HassRecordsStatisticsCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    _onStatTypeChange(st, checked) {
      const cur = [...this._config.stat_types || ["mean"]];
      if (checked) {
        if (!cur.includes(st)) cur.push(st);
      } else {
        const i2 = cur.indexOf(st);
        if (i2 !== -1) cur.splice(i2, 1);
      }
      this._set("stat_types", cur.length ? cur : ["mean"]);
    }
    render() {
      const c2 = this._config;
      const statTypes = c2.stat_types || ["mean"];
      return b`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c2.title || ""}
          @dp-field-change=${(e2) => this._set("title", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c2.hours_to_show ?? 168)}
          @dp-field-change=${(e2) => this._set("hours_to_show", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Period"></dp-section-heading>
        <dp-editor-select
          label="Period"
          .value=${c2.period || "hour"}
          .options=${[
        { value: "5minute", label: "5 minutes" },
        { value: "hour", label: "Hour" },
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" }
      ]}
          @dp-select-change=${(e2) => this._set("period", e2.detail.value)}
        ></dp-editor-select>

        <dp-section-heading text="Stat types"></dp-section-heading>
        ${["mean", "min", "max", "sum", "state"].map(
        (st) => b`
            <dp-editor-switch
              label=${st}
              .checked=${statTypes.includes(st)}
              @dp-switch-change=${(e2) => this._onStatTypeChange(st, e2.detail.checked)}
            ></dp-editor-switch>
          `
      )}

        <dp-section-heading text="Entity / statistic ID"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity / statistic ID"
          .value=${c2.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e2) => this._set("entity", e2.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c2.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e2) => this._set("entities", e2.detail.entities.length ? e2.detail.entities : void 0)}
        ></dp-editor-entity-list>
      </div>
    `;
    }
  }
  class HassRecordsSensorCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    render() {
      const c2 = this._config;
      const showRecords = !!c2.show_records;
      return b`
      <div class="ed">
        <dp-section-heading text="Entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Sensor entity *"
          .value=${c2.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e2) => this._set("entity", e2.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Display"></dp-section-heading>
        <dp-editor-text-field
          label="Override display name (optional)"
          .value=${c2.name || ""}
          @dp-field-change=${(e2) => this._set("name", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c2.hours_to_show ?? 24)}
          @dp-field-change=${(e2) => this._set("hours_to_show", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-color-swatch
          label="Graph colour"
          .color=${c2.graph_color || COLORS[0]}
          @dp-color-change=${(e2) => this._set("graph_color", e2.detail.color)}
        ></dp-color-swatch>
        <dp-editor-select
          label="Annotation style"
          .value=${c2.annotation_style || ""}
          .options=${[
        { value: "circle", label: "Circle on line" },
        { value: "line", label: "Dotted vertical line" }
      ]}
          @dp-select-change=${(e2) => this._set("annotation_style", e2.detail.value)}
        ></dp-editor-select>

        <dp-section-heading text="Records list"></dp-section-heading>
        <dp-editor-switch
          label="Show records list below graph"
          .checked=${showRecords}
          @dp-switch-change=${(e2) => this._set("show_records", e2.detail.checked || void 0)}
        ></dp-editor-switch>
        <dp-editor-text-field
          label="Records per page (blank = show all)"
          type="number"
          .value=${c2.records_page_size != null ? String(c2.records_page_size) : ""}
          @dp-field-change=${(e2) => this._set("records_page_size", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Max records to show (blank = all)"
          type="number"
          .value=${c2.records_limit != null ? String(c2.records_limit) : ""}
          @dp-field-change=${(e2) => this._set("records_limit", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-switch
          label="Show full message"
          .checked=${c2.records_show_full_message !== false}
          tooltip="User will be able to expand the row if hidden"
          @dp-switch-change=${(e2) => this._set("records_show_full_message", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
      </div>
    `;
    }
  }
  class HassRecordsListCardEditor extends DpEditorBase {
    static styles = [DpEditorBase.styles, editorStyles];
    render() {
      const c2 = this._config;
      return b`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c2.title || ""}
          @dp-field-change=${(e2) => this._set("title", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show (blank = all time)"
          type="number"
          .value=${c2.hours_to_show != null ? String(c2.hours_to_show) : ""}
          @dp-field-change=${(e2) => this._set("hours_to_show", e2.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Records per page"
          type="number"
          .value=${String(c2.page_size ?? 15)}
          @dp-field-change=${(e2) => this._set("page_size", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Filtering"></dp-section-heading>
        <dp-editor-text-field
          label="Default message filter (always applied)"
          .value=${c2.message_filter || ""}
          @dp-field-change=${(e2) => this._set("message_filter", e2.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Visibility"></dp-section-heading>
        <dp-editor-switch
          label="Show search bar"
          .checked=${c2.show_search !== false}
          @dp-switch-change=${(e2) => this._set("show_search", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show related entities"
          .checked=${c2.show_entities !== false}
          @dp-switch-change=${(e2) => this._set("show_entities", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show edit & delete actions"
          .checked=${c2.show_actions !== false}
          @dp-switch-change=${(e2) => this._set("show_actions", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show full message"
          .checked=${c2.show_full_message !== false}
          tooltip="User will be able to expand the row if hidden"
          @dp-switch-change=${(e2) => this._set("show_full_message", e2.detail.checked ? void 0 : false)}
        ></dp-editor-switch>

        <dp-section-heading text="Filter by entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity (optional)"
          .value=${c2.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e2) => this._set("entity", e2.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entity filter"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c2.entities || []}
          .hass=${this.hass}
          button-label="Add default related items"
          @dp-entity-list-change=${(e2) => this._set("entities", e2.detail.entities.length ? e2.detail.entities : void 0)}
        ></dp-editor-entity-list>
      </div>
    `;
    }
  }
  class ChartCardBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._unsubscribe = null;
      this._resizeObserver = null;
      this._lastHistResult = null;
      this._lastEvents = null;
      this._lastT0 = null;
      this._lastT1 = null;
      this._chartHoverCleanup = null;
      this._chartZoomCleanup = null;
      this._loadRaf = null;
      this._lastDrawArgs = null;
      this._loadRequestId = 0;
      this._loadInFlight = false;
      this._hasStartedInitialLoad = false;
      this._windowListener = null;
      this._previousSeriesEndpoints = /* @__PURE__ */ new Map();
    }
    get _entityIds() {
      return [];
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._rendered = true;
        this.shadowRoot.innerHTML = buildChartCardShell(this._config.title);
        this._setupAutoRefresh();
        this._setupResizeObserver();
        this._scheduleLoad();
        return;
      }
      if (this.isConnected && !this._hasStartedInitialLoad) this._scheduleLoad();
    }
    connectedCallback() {
      if (this._rendered && this._hass && !this._hasStartedInitialLoad) {
        this._scheduleLoad();
      }
    }
    disconnectedCallback() {
      if (this._loadRaf) {
        window.cancelAnimationFrame(this._loadRaf);
        this._loadRaf = null;
      }
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (this._windowListener) {
        window.removeEventListener("hass-datapoints-event-recorded", this._windowListener);
        this._windowListener = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      if (this._chartHoverCleanup) {
        this._chartHoverCleanup();
        this._chartHoverCleanup = null;
      }
      if (this._chartZoomCleanup) {
        this._chartZoomCleanup();
        this._chartZoomCleanup = null;
      }
    }
    _setupAutoRefresh() {
      this._hass.connection.subscribeEvents(() => {
        this._load();
      }, `${DOMAIN$1}_event_recorded`).then((unsub) => {
        this._unsubscribe = unsub;
      }).catch(() => {
      });
      this._windowListener = () => {
        this._scheduleLoad();
      };
      window.addEventListener("hass-datapoints-event-recorded", this._windowListener);
    }
    _setupResizeObserver() {
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      if (!wrap || !window.ResizeObserver) return;
      this._resizeObserver = new ResizeObserver(() => {
        if (Array.isArray(this._lastDrawArgs) && this._lastDrawArgs.length) {
          this._drawChart(...this._lastDrawArgs);
        }
      });
      this._resizeObserver.observe(wrap);
    }
    _scheduleLoad() {
      if (!this._hass || this._loadRaf || this._loadInFlight) return;
      this._loadRaf = window.requestAnimationFrame(() => {
        this._loadRaf = null;
        if (!this._hass || !this.isConnected || this._loadInFlight) return;
        this._hasStartedInitialLoad = true;
        this._loadInFlight = true;
        Promise.resolve(this._load()).catch((err) => {
          logger$1.error("[hass-datapoints chart-base] load failed", err);
        }).finally(() => {
          this._loadInFlight = false;
        });
      });
    }
    _setChartLoading(isLoading) {
      const loadingEl = this.shadowRoot?.getElementById("loading");
      if (!loadingEl) return;
      loadingEl.classList.toggle("active", !!isLoading);
    }
    _setChartMessage(message = "") {
      const messageEl = this.shadowRoot?.getElementById("chart-message");
      if (!messageEl) return;
      messageEl.textContent = message || "";
      messageEl.classList.toggle("visible", !!message);
    }
  }
  const jsContent = '(function() {\n  "use strict";\n  function getTrendWindowMs(value) {\n    const windows = {\n      "1h": 60 * 60 * 1e3,\n      "6h": 6 * 60 * 60 * 1e3,\n      "24h": 24 * 60 * 60 * 1e3,\n      "7d": 7 * 24 * 60 * 60 * 1e3,\n      "14d": 14 * 24 * 60 * 60 * 1e3,\n      "21d": 21 * 24 * 60 * 60 * 1e3,\n      "28d": 28 * 24 * 60 * 60 * 1e3\n    };\n    return windows[value] || windows["24h"];\n  }\n  function buildRollingAverageTrend(points, windowMs) {\n    if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(windowMs) || windowMs <= 0) {\n      return [];\n    }\n    const trendPoints = [];\n    let windowStartIndex = 0;\n    let windowSum = 0;\n    for (let index = 0; index < points.length; index += 1) {\n      const [time, value] = points[index];\n      windowSum += value;\n      while (windowStartIndex < index && time - points[windowStartIndex][0] > windowMs) {\n        windowSum -= points[windowStartIndex][1];\n        windowStartIndex += 1;\n      }\n      const count = index - windowStartIndex + 1;\n      if (count > 0) {\n        trendPoints.push([time, windowSum / count]);\n      }\n    }\n    return trendPoints;\n  }\n  function buildLinearTrend(points) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    const origin = points[0][0];\n    let sumX = 0;\n    let sumY = 0;\n    let sumXX = 0;\n    let sumXY = 0;\n    for (const [time, value] of points) {\n      const x = (time - origin) / (60 * 60 * 1e3);\n      sumX += x;\n      sumY += value;\n      sumXX += x * x;\n      sumXY += x * value;\n    }\n    const count = points.length;\n    const denominator = count * sumXX - sumX * sumX;\n    if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {\n      return [];\n    }\n    const slope = (count * sumXY - sumX * sumY) / denominator;\n    const intercept = (sumY - slope * sumX) / count;\n    const firstTime = points[0][0];\n    const lastTime = points[points.length - 1][0];\n    const firstX = (firstTime - origin) / (60 * 60 * 1e3);\n    const lastX = (lastTime - origin) / (60 * 60 * 1e3);\n    return [\n      [firstTime, intercept + slope * firstX],\n      [lastTime, intercept + slope * lastX]\n    ];\n  }\n  function buildTrendPoints(points, method, trendWindow) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    if (method === "linear_trend") {\n      return buildLinearTrend(points);\n    }\n    return buildRollingAverageTrend(points, getTrendWindowMs(trendWindow));\n  }\n  function getPersistenceWindowMs(value) {\n    const windows = {\n      "30m": 30 * 60 * 1e3,\n      "1h": 60 * 60 * 1e3,\n      "3h": 3 * 60 * 60 * 1e3,\n      "6h": 6 * 60 * 60 * 1e3,\n      "12h": 12 * 60 * 60 * 1e3,\n      "24h": 24 * 60 * 60 * 1e3\n    };\n    return windows[value] || windows["1h"];\n  }\n  function buildIQRAnomalyClusters(points, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 4) {\n      return [];\n    }\n    const sorted = points.map(([, v]) => v).sort((a, b) => a - b);\n    const n = sorted.length;\n    const q1 = sorted[Math.floor(n * 0.25)];\n    const q2 = sorted[Math.floor(n * 0.5)];\n    const q3 = sorted[Math.floor(n * 0.75)];\n    const iqr = q3 - q1;\n    if (!Number.isFinite(iqr) || iqr <= 1e-6) {\n      return [];\n    }\n    let k;\n    if (anomalySensitivity === "low") {\n      k = 3;\n    } else if (anomalySensitivity === "high") {\n      k = 1.5;\n    } else {\n      k = 2;\n    }\n    const lowerFence = q1 - k * iqr;\n    const upperFence = q3 + k * iqr;\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "iqr" });\n      currentCluster = [];\n    };\n    for (const [timeMs, value] of points) {\n      if (value < lowerFence || value > upperFence) {\n        currentCluster.push({ timeMs, value, baselineValue: q2, residual: value - q2 });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildRollingZScoreAnomalyClusters(points, windowMs, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(windowMs) || windowMs <= 0) {\n      return [];\n    }\n    const threshold = getAnomalySensitivityThreshold(anomalySensitivity);\n    const residuals = [];\n    let windowStart = 0;\n    let windowSum = 0;\n    let windowSumSq = 0;\n    for (let i = 0; i < points.length; i += 1) {\n      const [timeMs, value] = points[i];\n      windowSum += value;\n      windowSumSq += value * value;\n      while (windowStart < i && timeMs - points[windowStart][0] > windowMs) {\n        const old = points[windowStart][1];\n        windowSum -= old;\n        windowSumSq -= old * old;\n        windowStart += 1;\n      }\n      const count = i - windowStart + 1;\n      if (count < 3) {\n        continue;\n      }\n      const mean = windowSum / count;\n      const variance = Math.max(0, windowSumSq / count - mean * mean);\n      const std = Math.sqrt(variance);\n      if (!Number.isFinite(std) || std <= 1e-6) {\n        continue;\n      }\n      const zscore = (value - mean) / std;\n      if (Math.abs(zscore) >= threshold) {\n        residuals.push({ timeMs, value, baselineValue: mean, residual: value - mean, flagged: true });\n      } else {\n        residuals.push({ timeMs, flagged: false });\n      }\n    }\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });\n      currentCluster = [];\n    };\n    for (const r of residuals) {\n      if (r.flagged) {\n        currentCluster.push(r);\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildPersistenceAnomalyClusters(points, minDurationMs, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(minDurationMs) || minDurationMs <= 0) {\n      return [];\n    }\n    let totalMin = Infinity;\n    let totalMax = -Infinity;\n    for (const [, v] of points) {\n      if (v < totalMin) totalMin = v;\n      if (v > totalMax) totalMax = v;\n    }\n    const totalRange = totalMax - totalMin;\n    if (!Number.isFinite(totalRange) || totalRange <= 1e-6) {\n      return [];\n    }\n    let flatFraction;\n    if (anomalySensitivity === "low") {\n      flatFraction = 5e-3;\n    } else if (anomalySensitivity === "high") {\n      flatFraction = 0.05;\n    } else {\n      flatFraction = 0.02;\n    }\n    const flatThreshold = flatFraction * totalRange;\n    const clusters = [];\n    let runStart = 0;\n    let runMin = points[0][1];\n    let runMax = points[0][1];\n    const flushRun = (runEnd) => {\n      const duration = points[runEnd][0] - points[runStart][0];\n      if (duration >= minDurationMs && runEnd > runStart) {\n        const mid = (runMin + runMax) / 2;\n        const clusterPoints = [];\n        for (let k = runStart; k <= runEnd; k += 1) {\n          clusterPoints.push({ timeMs: points[k][0], value: points[k][1], baselineValue: mid, residual: points[k][1] - mid });\n        }\n        clusters.push({\n          points: clusterPoints,\n          maxDeviation: runMax - runMin,\n          anomalyMethod: "persistence",\n          flatRange: runMax - runMin\n        });\n      }\n    };\n    for (let i = 1; i < points.length; i += 1) {\n      const v = points[i][1];\n      const nextMin = Math.min(runMin, v);\n      const nextMax = Math.max(runMax, v);\n      if (nextMax - nextMin > flatThreshold) {\n        flushRun(i - 1);\n        runStart = i;\n        runMin = v;\n        runMax = v;\n      } else {\n        runMin = nextMin;\n        runMax = nextMax;\n      }\n    }\n    flushRun(points.length - 1);\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildComparisonWindowAnomalyClusters(points, comparisonPoints, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 3) {\n      return [];\n    }\n    const deltaPoints = [];\n    for (const [timeMs, value] of points) {\n      const compValue = interpolateSeriesValue(comparisonPoints, timeMs);\n      if (!Number.isFinite(compValue)) {\n        continue;\n      }\n      deltaPoints.push({ timeMs, value, compValue, delta: value - compValue });\n    }\n    if (deltaPoints.length < 3) {\n      return [];\n    }\n    let sumDeltas = 0;\n    for (const p of deltaPoints) {\n      sumDeltas += p.delta;\n    }\n    const meanDelta = sumDeltas / deltaPoints.length;\n    let sumSqDev = 0;\n    for (const p of deltaPoints) {\n      const dev = p.delta - meanDelta;\n      sumSqDev += dev * dev;\n    }\n    const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);\n    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "comparison_window" });\n      currentCluster = [];\n    };\n    for (const { timeMs, value, compValue, delta } of deltaPoints) {\n      const residual = delta - meanDelta;\n      if (Math.abs(residual) >= threshold) {\n        currentCluster.push({ timeMs, value, baselineValue: compValue, residual: value - compValue });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildRateOfChangeAnomalyClusters(points, rateWindow, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3) {\n      return [];\n    }\n    const ratePoints = buildRateOfChangePoints(points, rateWindow);\n    if (!Array.isArray(ratePoints) || ratePoints.length < 3) {\n      return [];\n    }\n    let sumRates = 0;\n    for (const [, rate] of ratePoints) {\n      sumRates += rate;\n    }\n    const meanRate = sumRates / ratePoints.length;\n    let sumSqDev = 0;\n    for (const [, rate] of ratePoints) {\n      const dev = rate - meanRate;\n      sumSqDev += dev * dev;\n    }\n    const rmsDeviation = Math.sqrt(sumSqDev / ratePoints.length);\n    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) {\n        return;\n      }\n      const maxDeviation = currentCluster.reduce((maxVal, point) => Math.max(maxVal, Math.abs(point.residual)), 0);\n      clusters.push({\n        points: currentCluster.slice(),\n        maxDeviation,\n        anomalyMethod: "rate_of_change"\n      });\n      currentCluster = [];\n    };\n    for (const [timeMs, rate] of ratePoints) {\n      const residual = rate - meanRate;\n      if (Math.abs(residual) >= threshold) {\n        const sourceValue = interpolateSeriesValue(points, timeMs);\n        if (!Number.isFinite(sourceValue)) {\n          flushCluster();\n          continue;\n        }\n        currentCluster.push({\n          timeMs,\n          value: sourceValue,\n          baselineValue: meanRate,\n          residual\n        });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((cluster) => cluster.points.length > 0);\n  }\n  const VALID_ANOMALY_METHODS = ["trend_residual", "rate_of_change", "iqr", "rolling_zscore", "persistence", "comparison_window"];\n  function normalizeSeriesAnalysis(analysis) {\n    const source = analysis && typeof analysis === "object" ? analysis : {};\n    const legacyMethod = VALID_ANOMALY_METHODS.includes(source.anomaly_method) ? source.anomaly_method : null;\n    let anomalyMethods;\n    if (Array.isArray(source.anomaly_methods)) {\n      anomalyMethods = source.anomaly_methods.filter((m) => VALID_ANOMALY_METHODS.includes(m));\n    } else if (legacyMethod) {\n      anomalyMethods = [legacyMethod];\n    } else {\n      anomalyMethods = [];\n    }\n    return {\n      show_trend_lines: source.show_trend_lines === true,\n      trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",\n      trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",\n      show_summary_stats: source.show_summary_stats === true,\n      show_rate_of_change: source.show_rate_of_change === true,\n      rate_window: typeof source.rate_window === "string" && source.rate_window ? source.rate_window : "1h",\n      show_anomalies: source.show_anomalies === true,\n      anomaly_methods: anomalyMethods,\n      anomaly_overlap_mode: ["all", "highlight", "only"].includes(source.anomaly_overlap_mode) ? source.anomaly_overlap_mode : "all",\n      anomaly_sensitivity: typeof source.anomaly_sensitivity === "string" && source.anomaly_sensitivity ? source.anomaly_sensitivity : "medium",\n      anomaly_rate_window: typeof source.anomaly_rate_window === "string" && source.anomaly_rate_window ? source.anomaly_rate_window : "1h",\n      anomaly_zscore_window: typeof source.anomaly_zscore_window === "string" && source.anomaly_zscore_window ? source.anomaly_zscore_window : "24h",\n      anomaly_persistence_window: typeof source.anomaly_persistence_window === "string" && source.anomaly_persistence_window ? source.anomaly_persistence_window : "1h",\n      anomaly_comparison_window_id: typeof source.anomaly_comparison_window_id === "string" && source.anomaly_comparison_window_id ? source.anomaly_comparison_window_id : null,\n      show_delta_analysis: source.show_delta_analysis === true\n    };\n  }\n  function applyAnomalyOverlapMode(clustersByMethod, overlapMode) {\n    const methodKeys = Object.keys(clustersByMethod);\n    if (methodKeys.length <= 1 || overlapMode === "all") {\n      return methodKeys.flatMap((m) => clustersByMethod[m]);\n    }\n    const flaggedByMethod = {};\n    for (const m of methodKeys) {\n      flaggedByMethod[m] = new Set(clustersByMethod[m].flatMap((c) => c.points.map((p) => p.timeMs)));\n    }\n    const overlapTimes = /* @__PURE__ */ new Set();\n    for (const m of methodKeys) {\n      for (const t of flaggedByMethod[m]) {\n        if (methodKeys.some((other) => other !== m && flaggedByMethod[other].has(t))) {\n          overlapTimes.add(t);\n        }\n      }\n    }\n    if (overlapMode === "only") {\n      const seen = /* @__PURE__ */ new Set();\n      const result2 = [];\n      for (const m of methodKeys) {\n        for (const cluster of clustersByMethod[m]) {\n          const pts = cluster.points.filter((p) => overlapTimes.has(p.timeMs));\n          if (pts.length === 0) continue;\n          const key = pts.map((p) => p.timeMs).join(",");\n          if (seen.has(key)) continue;\n          seen.add(key);\n          const detectedByMethods = methodKeys.filter((other) => pts.some((p) => flaggedByMethod[other].has(p.timeMs)));\n          result2.push({\n            ...cluster,\n            points: pts,\n            maxDeviation: pts.reduce((maxVal, p) => Math.max(maxVal, Math.abs(p.residual || 0)), 0),\n            isOverlap: true,\n            detectedByMethods\n          });\n        }\n      }\n      return result2;\n    }\n    const result = [];\n    for (const m of methodKeys) {\n      for (const cluster of clustersByMethod[m]) {\n        const hasOverlap = cluster.points.some((p) => overlapTimes.has(p.timeMs));\n        const detectedByMethods = hasOverlap ? methodKeys.filter((other) => cluster.points.some((p) => flaggedByMethod[other].has(p.timeMs))) : [m];\n        result.push({ ...cluster, isOverlap: hasOverlap, detectedByMethods });\n      }\n    }\n    return result;\n  }\n  function interpolateSeriesValue(points, timeMs) {\n    if (!Array.isArray(points) || points.length === 0) {\n      return null;\n    }\n    if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {\n      return null;\n    }\n    if (timeMs === points[0][0]) {\n      return points[0][1];\n    }\n    if (timeMs === points[points.length - 1][0]) {\n      return points[points.length - 1][1];\n    }\n    for (let index = 0; index < points.length - 1; index += 1) {\n      const [startTime, startValue] = points[index];\n      const [endTime, endValue] = points[index + 1];\n      if (timeMs >= startTime && timeMs <= endTime) {\n        const fraction = (timeMs - startTime) / (endTime - startTime);\n        return startValue + (endValue - startValue) * fraction;\n      }\n    }\n    return null;\n  }\n  function buildRateOfChangePoints(points, rateWindow) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    const ratePoints = [];\n    for (let index = 1; index < points.length; index += 1) {\n      const [timeMs, value] = points[index];\n      let comparisonPoint = null;\n      if (rateWindow === "point_to_point") {\n        comparisonPoint = points[index - 1];\n      } else {\n        const windowMs = getTrendWindowMs(rateWindow);\n        if (!Number.isFinite(windowMs) || windowMs <= 0) {\n          continue;\n        }\n        for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {\n          const candidatePoint = points[candidateIndex];\n          if (timeMs - candidatePoint[0] >= windowMs) {\n            comparisonPoint = candidatePoint;\n            break;\n          }\n        }\n        if (!comparisonPoint) {\n          comparisonPoint = points[0];\n        }\n      }\n      if (!Array.isArray(comparisonPoint) || comparisonPoint.length < 2) {\n        continue;\n      }\n      const deltaMs = timeMs - comparisonPoint[0];\n      if (!Number.isFinite(deltaMs) || deltaMs <= 0) {\n        continue;\n      }\n      const deltaHours = deltaMs / (60 * 60 * 1e3);\n      if (!Number.isFinite(deltaHours) || deltaHours <= 0) {\n        continue;\n      }\n      const rateValue = (value - comparisonPoint[1]) / deltaHours;\n      if (!Number.isFinite(rateValue)) {\n        continue;\n      }\n      ratePoints.push([timeMs, rateValue]);\n    }\n    return ratePoints;\n  }\n  function buildDeltaPoints(sourcePoints, comparisonPoints) {\n    if (!Array.isArray(sourcePoints) || sourcePoints.length < 2 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 2) {\n      return [];\n    }\n    const deltaPoints = [];\n    for (const [timeMs, value] of sourcePoints) {\n      const comparisonValue = interpolateSeriesValue(comparisonPoints, timeMs);\n      if (comparisonValue == null) {\n        continue;\n      }\n      deltaPoints.push([timeMs, value - comparisonValue]);\n    }\n    return deltaPoints;\n  }\n  function buildSummaryStats(points) {\n    if (!Array.isArray(points) || points.length === 0) {\n      return null;\n    }\n    let min = Infinity;\n    let max = -Infinity;\n    let sum = 0;\n    let count = 0;\n    for (const point of points) {\n      const value = Number(point?.[1]);\n      if (!Number.isFinite(value)) {\n        continue;\n      }\n      if (value < min) {\n        min = value;\n      }\n      if (value > max) {\n        max = value;\n      }\n      sum += value;\n      count += 1;\n    }\n    if (!Number.isFinite(min) || !Number.isFinite(max) || count === 0) {\n      return null;\n    }\n    return {\n      min,\n      max,\n      mean: sum / count\n    };\n  }\n  function getAnomalySensitivityThreshold(sensitivity) {\n    if (sensitivity === "low") {\n      return 2.8;\n    }\n    if (sensitivity === "high") {\n      return 1.6;\n    }\n    return 2.2;\n  }\n  function buildAnomalyClusters(points, method, trendWindow, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3) {\n      return [];\n    }\n    const baselinePoints = buildTrendPoints(points, method, trendWindow);\n    if (!Array.isArray(baselinePoints) || baselinePoints.length < 2) {\n      return [];\n    }\n    const residualPoints = [];\n    for (const [timeMs, value] of points) {\n      const baselineValue = interpolateSeriesValue(baselinePoints, timeMs);\n      if (!Number.isFinite(baselineValue)) {\n        continue;\n      }\n      residualPoints.push({\n        timeMs,\n        value,\n        baselineValue,\n        residual: value - baselineValue\n      });\n    }\n    if (residualPoints.length < 3) {\n      return [];\n    }\n    let sumSquares = 0;\n    residualPoints.forEach((point) => {\n      sumSquares += point.residual * point.residual;\n    });\n    const rmsResidual = Math.sqrt(sumSquares / residualPoints.length);\n    if (!Number.isFinite(rmsResidual) || rmsResidual <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsResidual * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) {\n        return;\n      }\n      const maxDeviation = currentCluster.reduce((maxValue, point) => Math.max(maxValue, Math.abs(point.residual)), 0);\n      clusters.push({\n        points: currentCluster.slice(),\n        maxDeviation,\n        anomalyMethod: "trend_residual"\n      });\n      currentCluster = [];\n    };\n    residualPoints.forEach((point) => {\n      if (Math.abs(point.residual) >= threshold) {\n        currentCluster.push(point);\n      } else {\n        flushCluster();\n      }\n    });\n    flushCluster();\n    return clusters.filter((cluster) => cluster.points.length > 0);\n  }\n  function computeHistoryAnalysis(payload) {\n    const series = (Array.isArray(payload?.series) ? payload.series : []).map((seriesItem) => ({\n      ...seriesItem,\n      analysis: normalizeSeriesAnalysis(seriesItem?.analysis)\n    }));\n    const comparisonSeries = new Map(\n      (Array.isArray(payload?.comparisonSeries) ? payload.comparisonSeries : []).filter((entry) => entry?.entityId).map((entry) => [entry.entityId, entry])\n    );\n    const allComparisonWindowsData = payload?.allComparisonWindowsData && typeof payload.allComparisonWindowsData === "object" ? payload.allComparisonWindowsData : {};\n    const result = {\n      trendSeries: [],\n      rateSeries: [],\n      deltaSeries: [],\n      summaryStats: [],\n      anomalySeries: []\n    };\n    for (const seriesItem of series) {\n      const points = Array.isArray(seriesItem?.pts) ? seriesItem.pts : [];\n      const analysis = normalizeSeriesAnalysis(seriesItem?.analysis);\n      if (points.length < 2) {\n        continue;\n      }\n      const anomalyMethods = analysis.anomaly_methods;\n      const needsTrend = analysis.show_trend_lines === true || analysis.show_anomalies === true && anomalyMethods.includes("trend_residual");\n      if (needsTrend) {\n        const trendPoints = buildTrendPoints(points, analysis.trend_method, analysis.trend_window);\n        if (analysis.show_trend_lines === true && trendPoints.length >= 2) {\n          result.trendSeries.push({\n            entityId: seriesItem.entityId,\n            pts: trendPoints\n          });\n        }\n      }\n      if (analysis.show_anomalies === true) {\n        const clustersByMethod = {};\n        if (anomalyMethods.includes("trend_residual")) {\n          const clusters = buildAnomalyClusters(points, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod.trend_residual = clusters;\n        }\n        if (anomalyMethods.includes("rate_of_change")) {\n          const clusters = buildRateOfChangeAnomalyClusters(points, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod.rate_of_change = clusters;\n        }\n        if (anomalyMethods.includes("iqr")) {\n          const clusters = buildIQRAnomalyClusters(points, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod.iqr = clusters;\n        }\n        if (anomalyMethods.includes("rolling_zscore")) {\n          const windowMs = getTrendWindowMs(analysis.anomaly_zscore_window);\n          const clusters = buildRollingZScoreAnomalyClusters(points, windowMs, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod.rolling_zscore = clusters;\n        }\n        if (anomalyMethods.includes("persistence")) {\n          const minDurationMs = getPersistenceWindowMs(analysis.anomaly_persistence_window);\n          const clusters = buildPersistenceAnomalyClusters(points, minDurationMs, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod.persistence = clusters;\n        }\n        if (anomalyMethods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {\n          const windowData = allComparisonWindowsData[analysis.anomaly_comparison_window_id];\n          const comparisonPts = windowData && typeof windowData === "object" ? windowData[seriesItem.entityId] : null;\n          if (Array.isArray(comparisonPts) && comparisonPts.length >= 3) {\n            const clusters = buildComparisonWindowAnomalyClusters(points, comparisonPts, analysis.anomaly_sensitivity);\n            if (clusters.length > 0) clustersByMethod.comparison_window = clusters;\n          }\n        }\n        const anomalyClusters = applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);\n        if (anomalyClusters.length > 0) {\n          result.anomalySeries.push({ entityId: seriesItem.entityId, anomalyClusters });\n        }\n      }\n      if (analysis.show_rate_of_change === true) {\n        const ratePoints = buildRateOfChangePoints(points, analysis.rate_window);\n        if (ratePoints.length >= 2) {\n          result.rateSeries.push({\n            entityId: seriesItem.entityId,\n            pts: ratePoints\n          });\n        }\n      }\n      if (analysis.show_summary_stats === true) {\n        const summaryStats = buildSummaryStats(points);\n        if (summaryStats) {\n          result.summaryStats.push({\n            entityId: seriesItem.entityId,\n            ...summaryStats\n          });\n        }\n      }\n      if (analysis.show_delta_analysis === true && payload?.hasSelectedComparisonWindow === true) {\n        const comparisonEntry = comparisonSeries.get(seriesItem.entityId);\n        if (comparisonEntry?.pts?.length >= 2) {\n          const deltaPoints = buildDeltaPoints(points, comparisonEntry.pts);\n          if (deltaPoints.length >= 2) {\n            result.deltaSeries.push({\n              entityId: seriesItem.entityId,\n              pts: deltaPoints\n            });\n          }\n        }\n      }\n    }\n    return result;\n  }\n  self.onmessage = (event) => {\n    const { id, payload } = event.data || {};\n    try {\n      const result = computeHistoryAnalysis(payload);\n      self.postMessage({ id, result });\n    } catch (error) {\n      self.postMessage({\n        id,\n        error: error instanceof Error ? error.message : String(error)\n      });\n    }\n  };\n})();\n';
  const blob = typeof self !== "undefined" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", jsContent], { type: "text/javascript;charset=utf-8" });
  function WorkerWrapper(options) {
    let objURL;
    try {
      objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
      if (!objURL) throw "";
      const worker = new Worker(objURL, {
        name: options?.name
      });
      worker.addEventListener("error", () => {
        (self.URL || self.webkitURL).revokeObjectURL(objURL);
      });
      return worker;
    } catch (e2) {
      return new Worker(
        "data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent),
        {
          name: options?.name
        }
      );
    }
  }
  let workerInstance = null;
  let requestId = 0;
  const pending = /* @__PURE__ */ new Map();
  function getHistoryAnalysisWorker() {
    if (workerInstance) {
      return workerInstance;
    }
    workerInstance = new WorkerWrapper();
    workerInstance.addEventListener("message", (event) => {
      const { id, result, error } = event.data || {};
      const handlers = pending.get(id);
      if (!handlers) {
        return;
      }
      pending.delete(id);
      if (error) {
        handlers.reject(new Error(error));
        return;
      }
      handlers.resolve(result);
    });
    workerInstance.addEventListener("error", (error) => {
      pending.forEach((handlers) => {
        handlers.reject(error);
      });
      pending.clear();
      workerInstance = null;
    });
    return workerInstance;
  }
  function computeHistoryAnalysisInWorker(payload) {
    const worker = getHistoryAnalysisWorker();
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, payload });
    });
  }
  const HISTORY_CHART_MAX_CANVAS_WIDTH_PX = Math.floor(16383 / (window.devicePixelRatio || 1));
  const HISTORY_CHART_MAX_ZOOM_MULTIPLIER = 365;
  const HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX = 500;
  const HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX = 440;
  class HassRecordsHistoryCard extends ChartCardBase {
    constructor() {
      super();
      this._hiddenSeries = /* @__PURE__ */ new Set();
      this._hiddenEventIds = /* @__PURE__ */ new Set();
      this._zoomRange = null;
      this._comparisonRequestId = 0;
      this._comparisonDataCache = /* @__PURE__ */ new Map();
      this._scrollSyncSuspended = false;
      this._lastProgrammaticScrollLeft = null;
      this._ignoreNextProgrammaticScrollEvent = false;
      this._legendWrapRows = false;
      this._adjustComparisonAxisScale = false;
      this._drawRequestId = 0;
      this._onWindowKeyDown = (ev) => this._handleWindowKeyDown(ev);
      this._onChartScroll = () => this._handleChartScroll();
      this._creatingContextAnnotation = false;
      this._annotationDialog = new HistoryAnnotationDialogController(this);
    }
    connectedCallback() {
      window.addEventListener("keydown", this._onWindowKeyDown);
    }
    disconnectedCallback() {
      window.removeEventListener("keydown", this._onWindowKeyDown);
      if (this._chartScrollViewportEl) {
        this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
      }
      this._annotationDialog?.teardown();
      super.disconnectedCallback();
    }
    setConfig(config) {
      if (!config.entity && !config.entities) {
        throw new Error("hass-datapoints-history-card: define `entity` or `entities`");
      }
      const nextConfig = {
        hours_to_show: 24,
        ...config,
        series_settings: Array.isArray(config.series_settings) ? config.series_settings.map((entry) => ({
          ...entry,
          analysis: entry?.analysis && typeof entry.analysis === "object" ? { ...entry.analysis } : entry?.analysis
        })) : config.series_settings,
        hidden_event_ids: Array.isArray(config.hidden_event_ids) ? [...config.hidden_event_ids] : config.hidden_event_ids,
        comparison_windows: Array.isArray(config.comparison_windows) ? config.comparison_windows.map((entry) => ({ ...entry })) : config.comparison_windows,
        preload_comparison_windows: Array.isArray(config.preload_comparison_windows) ? config.preload_comparison_windows.map((entry) => ({ ...entry })) : config.preload_comparison_windows,
        comparison_preview_overlay: config.comparison_preview_overlay ? { ...config.comparison_preview_overlay } : null,
        selected_comparison_window_id: config.selected_comparison_window_id || null,
        hovered_comparison_window_id: config.hovered_comparison_window_id || null,
        show_trend_lines: config.show_trend_lines === true,
        show_summary_stats: config.show_summary_stats === true,
        show_rate_of_change: config.show_rate_of_change === true,
        show_threshold_analysis: config.show_threshold_analysis === true,
        show_threshold_shading: config.show_threshold_shading === true,
        hide_raw_data: config.hide_raw_data === true,
        show_trend_crosshairs: config.show_trend_crosshairs === true,
        trend_method: config.trend_method || "rolling_average",
        trend_window: config.trend_window || "24h",
        rate_window: config.rate_window || "1h",
        threshold_values: config.threshold_values && typeof config.threshold_values === "object" ? { ...config.threshold_values } : {},
        threshold_directions: config.threshold_directions && typeof config.threshold_directions === "object" ? { ...config.threshold_directions } : {},
        show_delta_analysis: config.show_delta_analysis === true,
        show_delta_tooltip: config.show_delta_tooltip !== false,
        show_delta_lines: config.show_delta_lines === true,
        hide_delta_source_series: config.hide_delta_source_series === true,
        delink_y_axis: config.delink_y_axis === true,
        split_view: config.split_view === true,
        show_data_gaps: config.show_data_gaps !== false,
        data_gap_threshold: config.data_gap_threshold || "2h"
      };
      const currentConfig = this._config || {};
      const currentDataKey = JSON.stringify({
        entities: currentConfig.entities,
        entity: currentConfig.entity,
        series_entities: Array.isArray(currentConfig.series_settings) ? currentConfig.series_settings.map((entry) => entry?.entity_id || entry?.entity || entry?.entityId || null) : null,
        datapoint_scope: currentConfig.datapoint_scope,
        hours_to_show: currentConfig.hours_to_show,
        start_time: currentConfig.start_time,
        end_time: currentConfig.end_time
      });
      const nextDataKey = JSON.stringify({
        entities: nextConfig.entities,
        entity: nextConfig.entity,
        series_entities: Array.isArray(nextConfig.series_settings) ? nextConfig.series_settings.map((entry) => entry?.entity_id || entry?.entity || entry?.entityId || null) : null,
        datapoint_scope: nextConfig.datapoint_scope,
        hours_to_show: nextConfig.hours_to_show,
        start_time: nextConfig.start_time,
        end_time: nextConfig.end_time
      });
      const currentViewKey = JSON.stringify({
        series_settings: currentConfig.series_settings || [],
        zoom_start_time: currentConfig.zoom_start_time,
        zoom_end_time: currentConfig.zoom_end_time,
        message_filter: currentConfig.message_filter || "",
        hidden_event_ids: currentConfig.hidden_event_ids || [],
        show_event_markers: currentConfig.show_event_markers !== false,
        show_event_lines: currentConfig.show_event_lines !== false,
        show_tooltips: currentConfig.show_tooltips !== false,
        emphasize_hover_guides: currentConfig.emphasize_hover_guides === true,
        show_correlated_anomalies: currentConfig.show_correlated_anomalies === true,
        show_trend_lines: currentConfig.show_trend_lines === true,
        show_summary_stats: currentConfig.show_summary_stats === true,
        show_rate_of_change: currentConfig.show_rate_of_change === true,
        show_threshold_analysis: currentConfig.show_threshold_analysis === true,
        show_threshold_shading: currentConfig.show_threshold_shading === true,
        show_anomalies: currentConfig.show_anomalies === true,
        hide_raw_data: currentConfig.hide_raw_data === true,
        show_trend_crosshairs: currentConfig.show_trend_crosshairs === true,
        trend_method: currentConfig.trend_method || "rolling_average",
        trend_window: currentConfig.trend_window || "24h",
        rate_window: currentConfig.rate_window || "1h",
        anomaly_sensitivity: currentConfig.anomaly_sensitivity || "medium",
        threshold_values: currentConfig.threshold_values || {},
        threshold_directions: currentConfig.threshold_directions || {},
        show_delta_analysis: currentConfig.show_delta_analysis === true,
        show_delta_tooltip: currentConfig.show_delta_tooltip !== false,
        show_delta_lines: currentConfig.show_delta_lines === true,
        hide_delta_source_series: currentConfig.hide_delta_source_series === true,
        delink_y_axis: currentConfig.delink_y_axis === true,
        split_view: currentConfig.split_view === true,
        show_data_gaps: currentConfig.show_data_gaps !== false,
        data_gap_threshold: currentConfig.data_gap_threshold || "2h",
        comparison_hover_active: currentConfig.comparison_hover_active === true,
        selected_comparison_window_id: currentConfig.selected_comparison_window_id || null,
        hovered_comparison_window_id: currentConfig.hovered_comparison_window_id || null
      });
      const nextViewKey = JSON.stringify({
        series_settings: nextConfig.series_settings || [],
        zoom_start_time: nextConfig.zoom_start_time,
        zoom_end_time: nextConfig.zoom_end_time,
        message_filter: nextConfig.message_filter || "",
        hidden_event_ids: nextConfig.hidden_event_ids || [],
        show_event_markers: nextConfig.show_event_markers !== false,
        show_event_lines: nextConfig.show_event_lines !== false,
        show_tooltips: nextConfig.show_tooltips !== false,
        emphasize_hover_guides: nextConfig.emphasize_hover_guides === true,
        show_trend_lines: nextConfig.show_trend_lines === true,
        show_summary_stats: nextConfig.show_summary_stats === true,
        show_rate_of_change: nextConfig.show_rate_of_change === true,
        show_threshold_analysis: nextConfig.show_threshold_analysis === true,
        show_threshold_shading: nextConfig.show_threshold_shading === true,
        show_anomalies: nextConfig.show_anomalies === true,
        hide_raw_data: nextConfig.hide_raw_data === true,
        show_trend_crosshairs: nextConfig.show_trend_crosshairs === true,
        trend_method: nextConfig.trend_method || "rolling_average",
        trend_window: nextConfig.trend_window || "24h",
        rate_window: nextConfig.rate_window || "1h",
        anomaly_sensitivity: nextConfig.anomaly_sensitivity || "medium",
        threshold_values: nextConfig.threshold_values || {},
        threshold_directions: nextConfig.threshold_directions || {},
        show_delta_analysis: nextConfig.show_delta_analysis === true,
        show_delta_tooltip: nextConfig.show_delta_tooltip !== false,
        show_delta_lines: nextConfig.show_delta_lines === true,
        hide_delta_source_series: nextConfig.hide_delta_source_series === true,
        delink_y_axis: nextConfig.delink_y_axis === true,
        split_view: nextConfig.split_view === true,
        show_data_gaps: nextConfig.show_data_gaps !== false,
        data_gap_threshold: nextConfig.data_gap_threshold || "2h",
        comparison_hover_active: nextConfig.comparison_hover_active === true,
        selected_comparison_window_id: nextConfig.selected_comparison_window_id || null,
        hovered_comparison_window_id: nextConfig.hovered_comparison_window_id || null
      });
      const currentComparisonKey = JSON.stringify(currentConfig.comparison_windows || []);
      const nextComparisonKey = JSON.stringify(nextConfig.comparison_windows || []);
      const currentPreloadComparisonKey = JSON.stringify(currentConfig.preload_comparison_windows || []);
      const nextPreloadComparisonKey = JSON.stringify(nextConfig.preload_comparison_windows || []);
      const currentComparisonOverlayKey = JSON.stringify(currentConfig.comparison_preview_overlay || null);
      const nextComparisonOverlayKey = JSON.stringify(nextConfig.comparison_preview_overlay || null);
      const dataChanged = currentDataKey !== nextDataKey;
      const viewChanged = currentViewKey !== nextViewKey;
      const comparisonChanged = currentComparisonKey !== nextComparisonKey;
      const preloadComparisonChanged = currentPreloadComparisonKey !== nextPreloadComparisonKey;
      const comparisonOverlayChanged = currentComparisonOverlayKey !== nextComparisonOverlayKey;
      if (!dataChanged && !viewChanged && !comparisonChanged && !preloadComparisonChanged && !comparisonOverlayChanged && this._configKey) {
        return;
      }
      this._config = nextConfig;
      this._configKey = JSON.stringify(nextConfig);
      this._hiddenSeries = createHiddenSeriesSet(nextConfig.series_settings);
      this._hiddenEventIds = createHiddenEventIdSet(nextConfig.hidden_event_ids);
      this._zoomRange = createChartZoomRange(nextConfig.zoom_start_time, nextConfig.zoom_end_time);
      if (dataChanged || !Array.isArray(nextConfig.comparison_windows) || !nextConfig.comparison_windows.length) {
        this._adjustComparisonAxisScale = false;
      }
      if (this._rendered && this._hass && dataChanged) {
        this._load();
        return;
      }
      if (this._rendered && this._hass && comparisonChanged) {
        this._loadComparisonWindows({ redraw: true });
        return;
      }
      if (this._rendered && this._hass && preloadComparisonChanged) {
        this._preloadComparisonWindows().catch(() => {
        });
      }
      if (this._rendered && this._hass && comparisonOverlayChanged && this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._filterEvents(this._lastEvents), this._lastT0, this._lastT1);
        return;
      }
      if (this._rendered && this._hass && viewChanged && this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._filterEvents(this._lastEvents), this._lastT0, this._lastT1);
      }
    }
    _renderComparisonPreviewOverlay(renderer = null) {
      const overlayEl = this.shadowRoot?.getElementById("chart-preview-overlay");
      if (!overlayEl) {
        return;
      }
      const overlay = this._config?.comparison_preview_overlay || null;
      if (!overlay?.window_range_label || !overlay?.actual_range_label) {
        overlayEl.hidden = true;
        overlayEl.innerHTML = "";
        return;
      }
      if (renderer?.pad?.left != null) {
        overlayEl.style.left = `${Math.max(8, renderer.pad.left + 8)}px`;
      } else {
        overlayEl.style.left = "";
      }
      overlayEl.innerHTML = `
      <div class="chart-preview-line"><strong>Date window:</strong> ${esc$1(overlay.window_range_label)}</div>
      <div class="chart-preview-line"><strong>Actual:</strong> ${esc$1(overlay.actual_range_label)}</div>
    `;
      overlayEl.hidden = false;
    }
    _getRange() {
      const end = this._config.end_time ? new Date(this._config.end_time) : /* @__PURE__ */ new Date();
      const start = this._config.start_time ? new Date(this._config.start_time) : new Date(end.getTime() - this._config.hours_to_show * 3600 * 1e3);
      return { start, end };
    }
    get _entityIds() {
      if (this._config.entities) {
        return this._config.entities.map((e2) => typeof e2 === "string" ? e2 : e2.entity || e2.entity_id);
      }
      return [this._config.entity];
    }
    get _seriesSettings() {
      const configured = Array.isArray(this._config?.series_settings) ? this._config.series_settings : [];
      const byEntityId = new Map(
        configured.filter((entry) => entry?.entity_id).map((entry, index) => [entry.entity_id, {
          entity_id: entry.entity_id,
          color: entry.color || COLORS[index % COLORS.length]
        }])
      );
      return this._entityIds.map((entityId, index) => byEntityId.get(entityId) || {
        entity_id: entityId,
        color: COLORS[index % COLORS.length]
      });
    }
    get _statisticsEntityIds() {
      return this._entityIds.filter((entityId) => !String(entityId).startsWith("binary_sensor."));
    }
    get _comparisonWindows() {
      return Array.isArray(this._config?.comparison_windows) ? this._config.comparison_windows.filter((w) => w?.time_offset_ms != null) : [];
    }
    get _preloadComparisonWindowsConfig() {
      return Array.isArray(this._config?.preload_comparison_windows) ? this._config.preload_comparison_windows.filter((w) => w?.time_offset_ms != null) : [];
    }
    _getComparisonCacheKey(win, start, end) {
      return JSON.stringify({
        id: win?.id || "",
        start: start?.toISOString?.() || "",
        end: end?.toISOString?.() || "",
        entities: this._entityIds,
        statistics_entities: this._statisticsEntityIds
      });
    }
    async _loadComparisonWindowData(win, start, end) {
      const cacheKey = this._getComparisonCacheKey(win, start, end);
      const cached = this._comparisonDataCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const historyPromise = fetchHistoryDuringPeriod(
        this._hass,
        start.toISOString(),
        end.toISOString(),
        this._entityIds,
        { include_start_time_state: true, significant_changes_only: false, no_attributes: true }
      ).catch(() => ({}));
      const statisticsPromise = this._statisticsEntityIds.length ? fetchStatisticsDuringPeriod(
        this._hass,
        start.toISOString(),
        end.toISOString(),
        this._statisticsEntityIds,
        {
          period: "hour",
          types: ["mean"],
          units: {}
        }
      ).catch(() => ({})) : Promise.resolve({});
      const [histResult, statsResult] = await Promise.all([historyPromise, statisticsPromise]);
      const result = {
        ...win,
        histResult: histResult || {},
        statsResult: statsResult || {}
      };
      this._comparisonDataCache.set(cacheKey, result);
      return result;
    }
    _preloadComparisonWindows() {
      const { start, end } = this._getRange();
      const comparisonWindows = this._preloadComparisonWindowsConfig;
      if (!comparisonWindows.length) {
        return Promise.resolve([]);
      }
      return Promise.all(comparisonWindows.map(async (win) => {
        const winStart = new Date(start.getTime() + win.time_offset_ms);
        const winEnd = new Date(end.getTime() + win.time_offset_ms);
        const result = await this._loadComparisonWindowData(win, winStart, winEnd);
        return { id: result.id, histResult: result.histResult, statsResult: result.statsResult };
      })).then((results) => results).catch((error) => {
        console.warn("[hass-datapoints history-card] comparison preload:failed", {
          message: error?.message || String(error)
        });
        return [];
      });
    }
    _loadComparisonWindows({ redraw = false, requestId: requestId2 = null } = {}) {
      const { start, end } = this._getRange();
      const comparisonWindows = this._comparisonWindows;
      const targetRequestId = requestId2 ?? this._loadRequestId;
      const comparisonRequestId = ++this._comparisonRequestId;
      if (!comparisonWindows.length) {
        this._lastComparisonResults = [];
        this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
          bubbles: true,
          composed: true,
          detail: { ids: [], loading: false }
        }));
        if (redraw && this._lastHistResult && this._lastEvents) {
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(this._lastEvents),
            this._lastT0,
            this._lastT1
          );
        }
        return Promise.resolve([]);
      }
      const cachedResults = [];
      const windowsToFetch = [];
      for (const win of comparisonWindows) {
        const winStart = new Date(start.getTime() + win.time_offset_ms);
        const winEnd = new Date(end.getTime() + win.time_offset_ms);
        const cacheKey = this._getComparisonCacheKey(win, winStart, winEnd);
        const cached = this._comparisonDataCache.get(cacheKey);
        if (cached) {
          cachedResults.push(cached);
        } else {
          windowsToFetch.push({ win, winStart, winEnd });
        }
      }
      if (!windowsToFetch.length) {
        this._lastComparisonResults = cachedResults;
        if (redraw && this._lastHistResult && this._lastEvents) {
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(this._lastEvents),
            this._lastT0,
            this._lastT1
          );
        }
        return Promise.resolve(cachedResults);
      }
      this._lastComparisonResults = cachedResults.length ? cachedResults : null;
      this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
        bubbles: true,
        composed: true,
        detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: true }
      }));
      return Promise.all(windowsToFetch.map(async ({ win, winStart, winEnd }) => this._loadComparisonWindowData(win, winStart, winEnd))).then((results) => {
        if (comparisonRequestId !== this._comparisonRequestId) {
          return this._lastComparisonResults || [];
        }
        if (targetRequestId != null && targetRequestId !== this._loadRequestId) {
          return this._lastComparisonResults || [];
        }
        this._lastComparisonResults = [...cachedResults, ...results];
        this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
          bubbles: true,
          composed: true,
          detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: false }
        }));
        if (redraw && this._lastHistResult && this._lastEvents) {
          this._queueDrawChart(
            this._lastHistResult,
            this._lastStatsResult || {},
            this._filterEvents(this._lastEvents),
            this._lastT0,
            this._lastT1
          );
        }
        return results;
      }).catch(() => {
        if (comparisonRequestId === this._comparisonRequestId) {
          this._lastComparisonResults = [];
          console.warn("[hass-datapoints history-card] comparison load:failed", {
            comparisonRequestId,
            ids: comparisonWindows.map((win) => win.id).filter(Boolean)
          });
          this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading", {
            bubbles: true,
            composed: true,
            detail: { ids: windowsToFetch.map(({ win }) => win.id).filter(Boolean), loading: false }
          }));
          if (redraw && this._lastHistResult && this._lastEvents) {
            this._queueDrawChart(
              this._lastHistResult,
              this._lastStatsResult || {},
              this._filterEvents(this._lastEvents),
              this._lastT0,
              this._lastT1
            );
          }
        }
        return [];
      });
    }
    async _load() {
      const { start, end } = this._getRange();
      const t0 = start.getTime();
      const t1 = end.getTime();
      const requestId2 = ++this._loadRequestId;
      logger$1.log("[hass-datapoints history-card] load triggered", {
        requestId: requestId2,
        entityIds: this._entityIds,
        start: start.toISOString(),
        end: end.toISOString()
      });
      this._setChartLoading(true);
      this._setChartMessage("");
      this._drawEmptyChartFrame(t0, t1);
      const partial = {
        histResult: null,
        statsResult: this._statisticsEntityIds.length ? null : {},
        events: null,
        histDone: false,
        statsDone: !this._statisticsEntityIds.length,
        eventsDone: false,
        histFailed: false,
        statsFailed: false,
        eventsFailed: false,
        hasDrawnDrawable: false,
        lastDrawState: null,
        lastDrawQuality: null
      };
      const maybeDraw = () => {
        if (requestId2 !== this._loadRequestId) {
          return;
        }
        const hasDrawableData = this._hasDrawableHistoryData(partial.histResult || {}, partial.statsResult || {});
        const numericRequestsFinished = partial.histDone && partial.statsDone;
        if (!hasDrawableData && !numericRequestsFinished) {
          return;
        }
        if (partial.hasDrawnDrawable) {
          const drawQuality = hasDrawableData ? this._getDrawableHistoryQuality(partial.histResult || {}, partial.statsResult || {}) : null;
          const redrawForHistory = hasDrawableData && !partial.lastDrawState?.histDone && partial.histDone;
          const redrawForEvents = hasDrawableData && !partial.lastDrawState?.eventsDone && partial.eventsDone;
          const shouldRedraw = redrawForHistory || redrawForEvents;
          const wouldDowngradeDraw = !!drawQuality && !!partial.lastDrawQuality && drawQuality.totalPoints < partial.lastDrawQuality.totalPoints;
          if (!shouldRedraw) {
            if (partial.histDone && partial.statsDone && partial.eventsDone) {
              this._setChartLoading(false);
            }
            return;
          }
          if (wouldDowngradeDraw) {
            if (partial.histDone && partial.statsDone && partial.eventsDone) {
              this._setChartLoading(false);
            }
            return;
          }
          if (redrawForEvents && !redrawForHistory && this._lastHistResult && Number.isFinite(this._lastT0) && Number.isFinite(this._lastT1)) {
            partial.lastDrawState = {
              histDone: partial.histDone,
              statsDone: partial.statsDone,
              eventsDone: partial.eventsDone
            };
            this._queueDrawChart(
              this._lastHistResult,
              this._lastStatsResult || {},
              this._filterEvents(partial.events || []),
              this._lastT0,
              this._lastT1,
              { loading: !(partial.histDone && partial.statsDone && partial.eventsDone) }
            );
            return;
          }
        }
        if (hasDrawableData) {
          const drawQuality = this._getDrawableHistoryQuality(partial.histResult || {}, partial.statsResult || {});
          partial.hasDrawnDrawable = true;
          partial.lastDrawState = {
            histDone: partial.histDone,
            statsDone: partial.statsDone,
            eventsDone: partial.eventsDone
          };
          partial.lastDrawQuality = drawQuality;
        }
        this._queueDrawChart(
          partial.histResult || {},
          partial.statsResult || {},
          this._filterEvents(partial.events || []),
          t0,
          t1,
          { loading: !(partial.histDone && partial.statsDone && partial.eventsDone) }
        );
      };
      const finalize = () => {
        if (requestId2 !== this._loadRequestId) {
          return;
        }
        if (!(partial.histDone && partial.statsDone && partial.eventsDone)) {
          return;
        }
        if (partial.histFailed && partial.statsFailed || partial.histResult == null && partial.statsResult == null) {
          this._setChartMessage("Failed to load data.");
          this._setChartLoading(false);
          return;
        }
        if (partial.hasDrawnDrawable) {
          this._setChartLoading(false);
        }
        this._preloadComparisonWindows().catch(() => {
        });
      };
      this._loadComparisonWindows({ redraw: true, requestId: requestId2 }).catch(() => {
      });
      try {
        fetchHistoryDuringPeriod(
          this._hass,
          start.toISOString(),
          end.toISOString(),
          this._entityIds,
          {
            include_start_time_state: true,
            significant_changes_only: false,
            no_attributes: true
          }
        ).then((histResult) => {
          partial.histResult = histResult || {};
          partial.histDone = true;
          maybeDraw();
          finalize();
        }).catch((err) => {
          partial.histDone = true;
          partial.histFailed = true;
          console.error("[hass-datapoints history-card] history load failed", err);
          maybeDraw();
          finalize();
        });
        if (this._statisticsEntityIds.length) {
          fetchStatisticsDuringPeriod(
            this._hass,
            start.toISOString(),
            end.toISOString(),
            this._statisticsEntityIds,
            {
              period: "hour",
              types: ["mean"],
              units: {}
            }
          ).then((statsResult) => {
            partial.statsResult = statsResult || {};
            partial.statsDone = true;
            maybeDraw();
            finalize();
          }).catch((err) => {
            partial.statsDone = true;
            partial.statsFailed = true;
            console.error("[hass-datapoints history-card] statistics load failed", err);
            maybeDraw();
            finalize();
          });
        }
        if (this._config.datapoint_scope === "hidden") {
          partial.events = [];
          partial.eventsDone = true;
          maybeDraw();
          finalize();
        } else {
          fetchEvents$1(
            this._hass,
            start.toISOString(),
            end.toISOString(),
            this._config.datapoint_scope === "all" ? void 0 : this._entityIds
          ).then((events) => {
            partial.events = events || [];
            partial.eventsDone = true;
            maybeDraw();
            finalize();
          }).catch((err) => {
            partial.eventsDone = true;
            partial.eventsFailed = true;
            console.error("[hass-datapoints history-card] event load failed", err);
            maybeDraw();
            finalize();
          });
        }
      } catch (err) {
        this._setChartMessage("Failed to load data.");
        this._setChartLoading(false);
        console.error("[hass-datapoints history-card]", err);
      }
    }
    _drawEmptyChartFrame(t0, t1) {
      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const scrollViewport = this.shadowRoot.getElementById("chart-scroll-viewport");
      const chartStage = this.shadowRoot.getElementById("chart-stage");
      if (!canvas || !wrap) {
        return;
      }
      const availableHeight = this._getAvailableChartHeight(280);
      const viewportWidth = Math.max(scrollViewport?.clientWidth || wrap?.clientWidth || 360, 360);
      if (chartStage) {
        chartStage.style.width = `${viewportWidth}px`;
        chartStage.style.height = `${availableHeight}px`;
      }
      const { w, h: h2 } = setupCanvas(canvas, chartStage || wrap, availableHeight, viewportWidth);
      const renderer = new ChartRenderer(canvas, w, h2);
      renderer.labelColor = resolveChartLabelColor(this);
      renderer.clear();
      renderer.drawGrid(t0, t1, [{ key: "placeholder", min: 0, max: 1, side: "left", unit: "", color: null }], void 0, 5, { fixedAxisOverlay: true });
      renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
    }
    _filterEvents(events) {
      const query = String(this._config?.message_filter || "").trim().toLowerCase();
      const visibleEvents = events.filter((event) => !this._hiddenEventIds.has(event?.id));
      if (!query) {
        return visibleEvents;
      }
      return visibleEvents.filter((event) => {
        const haystack = [
          event?.message || "",
          event?.annotation || "",
          ...(event?.entity_ids || []).filter(Boolean)
        ].join("\n").toLowerCase();
        return haystack.includes(query);
      });
    }
    _drawSplitChart({ visibleSeries, binaryBackgrounds, events, renderT0, renderT1, canvasWidth, availableHeight, chartStage, canvas, wrap, options, comparisonResults, selectedComparisonWindowId, hoveredComparisonWindowId, comparisonPreviewActive, hoveringDifferentComparison, analysisResult, analysisMap, hasSelectedComparisonWindow }) {
      if (canvas) {
        canvas.style.display = "none";
      }
      const N2 = visibleSeries.length;
      const MIN_ROW_HEIGHT = 140;
      const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor(availableHeight / N2));
      const totalHeight = rowHeight * N2;
      if (chartStage) {
        chartStage.style.width = `${canvasWidth}px`;
        chartStage.style.height = `${totalHeight}px`;
      }
      const splitScrollViewport = this.shadowRoot?.getElementById("chart-scroll-viewport");
      if (splitScrollViewport) {
        splitScrollViewport.style.overflowY = totalHeight > availableHeight ? "auto" : "hidden";
      }
      this._setChartLoading(!!options.loading);
      this._setChartMessage("");
      const iconOverlay = this.shadowRoot?.getElementById("chart-icon-overlay");
      if (iconOverlay) {
        iconOverlay.innerHTML = "";
      }
      const trendPointsMap = new Map((analysisResult?.trendSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const ratePointsMap = new Map((analysisResult?.rateSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const deltaPointsMap = new Map((analysisResult?.deltaSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const summaryStatsMap = new Map((analysisResult?.summaryStats || []).map((entry) => [entry.entityId, entry]));
      const anomalyClustersMap = new Map((analysisResult?.anomalySeries || []).map((entry) => [entry.entityId, entry.anomalyClusters]));
      const effectiveAnalysisMap = analysisMap || /* @__PURE__ */ new Map();
      const correlatedAnomalySpans = this._config?.show_correlated_anomalies === true ? this._buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, effectiveAnalysisMap) : [];
      const tracks = [];
      for (let i2 = 0; i2 < N2; i2 += 1) {
        const isLastRow = i2 === N2 - 1;
        const seriesItem = visibleSeries[i2];
        const rowOffset = i2 * rowHeight;
        const rowDiv = document.createElement("div");
        rowDiv.className = "split-series-row";
        rowDiv.style.cssText = `position:absolute;left:0;top:${rowOffset}px;width:${canvasWidth}px;height:${rowHeight}px;pointer-events:none;overflow:hidden;`;
        const rowCanvas = document.createElement("canvas");
        rowCanvas.className = "split-series-canvas";
        rowDiv.appendChild(rowCanvas);
        chartStage?.appendChild(rowDiv);
        const { w, h: h2 } = setupCanvas(rowCanvas, chartStage || wrap, rowHeight, canvasWidth);
        const renderer = new ChartRenderer(rowCanvas, w, h2);
        renderer.labelColor = resolveChartLabelColor(this);
        renderer.basePad = { top: 24, right: 12, bottom: isLastRow ? 48 : 10, left: 12 };
        renderer.clear();
        const rowAnalysis = effectiveAnalysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        const rowTrendPts = rowAnalysis.show_trend_lines === true ? trendPointsMap.get(seriesItem.entityId) || [] : [];
        const rowRatePts = rowAnalysis.show_rate_of_change === true ? ratePointsMap.get(seriesItem.entityId) || [] : [];
        const rowDeltaPts = rowAnalysis.show_delta_analysis === true && hasSelectedComparisonWindow ? deltaPointsMap.get(seriesItem.entityId) || [] : [];
        const rowSummaryStats = rowAnalysis.show_summary_stats === true ? summaryStatsMap.get(seriesItem.entityId) || null : null;
        const rowAnomalyClusters = rowAnalysis.show_anomalies === true ? anomalyClustersMap.get(seriesItem.entityId) || [] : [];
        const rowHideSource = this._seriesShouldHideSource(rowAnalysis, hasSelectedComparisonWindow);
        const axisValues = seriesItem.pts.map(([, v2]) => v2);
        const extent = this._getAxisValueExtent(axisValues);
        let axisMin = 0;
        let axisMax = 1;
        if (extent) {
          const pad = (extent.max - extent.min) * 0.1 || 1;
          axisMin = extent.min - pad;
          axisMax = extent.max + pad;
        }
        const primaryAxisKey = seriesItem.axisKey || seriesItem.unit || "__unitless__";
        const axis = {
          key: primaryAxisKey,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          side: "left",
          min: axisMin,
          max: axisMax,
          values: axisValues
        };
        const rowAxes = [axis];
        let rowRateAxisKey = null;
        if (rowRatePts.length >= 2) {
          const rateVals = rowRatePts.map(([, v2]) => v2);
          const rateExt = this._getAxisValueExtent(rateVals);
          if (rateExt) {
            const pad = (rateExt.max - rateExt.min) * 0.1 || 1;
            rowRateAxisKey = `rate:${primaryAxisKey}`;
            rowAxes.push({
              key: rowRateAxisKey,
              unit: seriesItem.unit ? `${seriesItem.unit}/h` : "Rate/h",
              color: seriesItem.color,
              side: "right",
              min: rateExt.min - pad,
              max: rateExt.max + pad,
              values: rateVals
            });
          }
        }
        let rowDeltaAxisKey = null;
        if (rowDeltaPts.length >= 2) {
          const deltaVals = rowDeltaPts.map(([, v2]) => v2);
          const deltaExt = this._getAxisValueExtent(deltaVals);
          if (deltaExt) {
            const pad = (deltaExt.max - deltaExt.min) * 0.1 || 1;
            rowDeltaAxisKey = `delta:${primaryAxisKey}`;
            rowAxes.push({
              key: rowDeltaAxisKey,
              unit: seriesItem.unit ? `Δ ${seriesItem.unit}` : "Δ",
              color: seriesItem.color,
              side: "right",
              min: deltaExt.min - pad,
              max: deltaExt.max + pad,
              values: deltaVals
            });
          }
        }
        renderer.drawGrid(renderT0, renderT1, rowAxes, void 0, 4, { fixedAxisOverlay: true, hideTimeLabels: !isLastRow });
        const resolvedAxis = renderer._activeAxes?.[0] || axis;
        const resolvedRateAxis = rowRateAxisKey ? renderer._activeAxes?.find((a2) => a2.key === rowRateAxisKey) || null : null;
        const resolvedDeltaAxis = rowDeltaAxisKey ? renderer._activeAxes?.find((a2) => a2.key === rowDeltaAxisKey) || null : null;
        seriesItem.axis = resolvedAxis;
        let mainSeriesOpacity;
        if (!comparisonPreviewActive) {
          mainSeriesOpacity = 1;
        } else if (hoveringDifferentComparison) {
          mainSeriesOpacity = 0.15;
        } else {
          mainSeriesOpacity = 0.25;
        }
        if (!rowHideSource) {
          this._drawSeriesLine(
            renderer,
            seriesItem.pts,
            seriesItem.color,
            renderT0,
            renderT1,
            resolvedAxis.min,
            resolvedAxis.max,
            {
              lineWidth: comparisonPreviewActive ? 1.25 : 1.75,
              lineOpacity: mainSeriesOpacity
            }
          );
        }
        for (const win of comparisonResults || []) {
          const stateList = this._buildEntityStateList(seriesItem.entityId, win.histResult, win.statsResult || {});
          const winPts = [];
          for (const s2 of stateList) {
            const v2 = parseFloat(s2.s);
            if (!isNaN(v2)) {
              winPts.push([Math.round(s2.lu * 1e3) - win.time_offset_ms, v2]);
            }
          }
          if (!winPts.length) {
            continue;
          }
          const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          let compLineOpacity;
          if (isHovered) {
            compLineOpacity = 0.85;
          } else if (hoveringDifferentComparison && isSelected) {
            compLineOpacity = 0.25;
          } else {
            compLineOpacity = 0.85;
          }
          renderer.drawLine(winPts, seriesItem.color, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, {
            lineOpacity: compLineOpacity,
            lineWidth: hoveringDifferentComparison && isSelected ? 1.25 : void 0
          });
        }
        binaryBackgrounds.forEach((bg) => {
          if (!this._hiddenSeries.has(bg.entityId) && bg.spans?.length) {
            renderer.drawStateBands(bg.spans, renderT0, renderT1, bg.color, 0.1);
          }
        });
        if (correlatedAnomalySpans.length) {
          renderer.drawStateBands(correlatedAnomalySpans, renderT0, renderT1, "#ef4444", 0.1);
        }
        renderer.drawAnnotations(events || [], renderT0, renderT1, {
          showLines: this._config.show_event_lines !== false,
          showMarkers: this._config.show_event_lines !== false
        });
        this._drawRecordedEventPoints(
          renderer,
          [seriesItem],
          events || [],
          renderT0,
          renderT1,
          {
            showIcons: this._config.show_event_markers !== false,
            yOffset: rowOffset,
            skipOverlayClear: true
          }
        );
        if (rowAnalysis.show_threshold_analysis === true) {
          const thresholdValue = Number(rowAnalysis.threshold_value);
          if (Number.isFinite(thresholdValue)) {
            if (rowAnalysis.show_threshold_shading === true && seriesItem.pts.length) {
              renderer.drawThresholdArea(
                seriesItem.pts,
                thresholdValue,
                seriesItem.color,
                renderT0,
                renderT1,
                resolvedAxis.min,
                resolvedAxis.max,
                {
                  mode: rowAnalysis.threshold_direction === "below" ? "below" : "above",
                  fillAlpha: rowHideSource ? 0.24 : 0.14
                }
              );
            }
            renderer.drawLine(
              [[renderT0, thresholdValue], [renderT1, thresholdValue]],
              hexToRgba(seriesItem.color, rowHideSource ? 0.82 : 0.46),
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              { lineOpacity: rowHideSource ? 0.84 : 0.48, lineWidth: 1.15 }
            );
          }
        }
        if (rowSummaryStats) {
          const summaryEntries = [
            { type: "min", value: rowSummaryStats.min, alpha: rowHideSource ? 0.78 : 0.42, width: 1.1, dotted: true },
            { type: "mean", value: rowSummaryStats.mean, alpha: rowHideSource ? 0.94 : 0.78, width: 1.8, dotted: false },
            { type: "max", value: rowSummaryStats.max, alpha: rowHideSource ? 0.78 : 0.42, width: 1.1, dotted: true }
          ];
          for (const entry of summaryEntries) {
            if (!Number.isFinite(entry.value)) continue;
            renderer.drawLine(
              [[renderT0, entry.value], [renderT1, entry.value]],
              hexToRgba(seriesItem.color, entry.alpha),
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              { lineOpacity: rowHideSource ? 0.82 : 0.34, lineWidth: entry.width, dotted: entry.dotted }
            );
          }
        }
        if (rowTrendPts.length >= 2) {
          const trendOpts = this._getTrendRenderOptions(rowAnalysis.trend_method, rowHideSource);
          renderer.drawLine(
            rowTrendPts,
            hexToRgba(seriesItem.color, trendOpts.colorAlpha),
            renderT0,
            renderT1,
            resolvedAxis.min,
            resolvedAxis.max,
            { lineOpacity: trendOpts.lineOpacity, lineWidth: trendOpts.lineWidth, dashed: trendOpts.dashed, dotted: trendOpts.dotted }
          );
        }
        if (rowRatePts.length >= 2 && resolvedRateAxis) {
          renderer.drawLine(
            rowRatePts,
            hexToRgba(seriesItem.color, rowHideSource ? 0.96 : 0.82),
            renderT0,
            renderT1,
            resolvedRateAxis.min,
            resolvedRateAxis.max,
            { lineOpacity: rowHideSource ? 0.88 : 0.66, lineWidth: 1.55, dashPattern: [7, 3, 1.5, 3] }
          );
        }
        if (rowDeltaPts.length >= 2 && resolvedDeltaAxis && rowAnalysis.show_delta_lines === true) {
          renderer.drawLine(
            rowDeltaPts,
            hexToRgba(seriesItem.color, 0.92),
            renderT0,
            renderT1,
            resolvedDeltaAxis.min,
            resolvedDeltaAxis.max,
            { lineOpacity: 0.82, lineWidth: 1.9, dashed: true }
          );
        }
        let rowAnomalyRegions = [];
        if (rowAnomalyClusters.length) {
          const filteredClusters = this._filterAnnotatedAnomalyClusters({ entityId: seriesItem.entityId, anomalyClusters: rowAnomalyClusters }, events || []);
          if (filteredClusters.length > 0) {
            const normalClusters = filteredClusters.filter((c2) => !c2.isOverlap);
            const overlapClusters = filteredClusters.filter((c2) => c2.isOverlap === true);
            const baseColor = hexToRgba(seriesItem.color, rowHideSource ? 0.96 : 0.86);
            const regionOpts = {
              strokeAlpha: rowHideSource ? 0.98 : 0.9,
              lineWidth: rowHideSource ? 2.5 : 2.1,
              haloWidth: rowHideSource ? 5.5 : 4.8,
              haloColor: "rgba(255,255,255,0.88)",
              haloAlpha: rowHideSource ? 0.92 : 0.82,
              fillColor: hexToRgba(seriesItem.color, rowHideSource ? 0.14 : 0.1),
              fillAlpha: 1,
              pointPadding: rowHideSource ? 12 : 10,
              minRadiusX: 10,
              minRadiusY: 10
            };
            const overlapOpts = {
              strokeAlpha: 0.98,
              lineWidth: 2.8,
              haloWidth: 7,
              haloColor: "rgba(232,160,32,0.22)",
              haloAlpha: 1,
              fillColor: "rgba(232,160,32,0.1)",
              fillAlpha: 1,
              pointPadding: rowHideSource ? 15 : 13,
              minRadiusX: 12,
              minRadiusY: 12
            };
            if (normalClusters.length > 0) {
              renderer.drawAnomalyClusters(normalClusters, baseColor, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, regionOpts);
            }
            if (overlapClusters.length > 0) {
              renderer.drawAnomalyClusters(overlapClusters, baseColor, renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, regionOpts);
              if (rowAnalysis.anomaly_overlap_mode !== "only") {
                renderer.drawAnomalyClusters(overlapClusters, "rgba(232,160,32,0.94)", renderT0, renderT1, resolvedAxis.min, resolvedAxis.max, overlapOpts);
              }
            }
            rowAnomalyRegions = renderer.getAnomalyClusterRegions(
              [...normalClusters, ...overlapClusters],
              renderT0,
              renderT1,
              resolvedAxis.min,
              resolvedAxis.max,
              regionOpts
            ).map((region) => ({
              ...region,
              relatedEntityId: seriesItem.entityId,
              label: seriesItem.label,
              unit: seriesItem.unit || "",
              color: seriesItem.color,
              sensitivity: rowAnalysis.anomaly_sensitivity
            }));
          }
        }
        tracks.push({
          canvas: rowCanvas,
          renderer,
          series: seriesItem,
          axis: resolvedAxis,
          rowOffset,
          analysis: rowAnalysis,
          summaryStats: rowSummaryStats,
          trendPts: rowTrendPts,
          ratePts: rowRatePts,
          rateAxis: resolvedRateAxis,
          deltaPts: rowDeltaPts,
          deltaAxis: resolvedDeltaAxis,
          anomalyRegions: rowAnomalyRegions
        });
      }
      this._renderSplitAxisOverlays(tracks);
      this._renderComparisonPreviewOverlay(tracks[0]?.renderer ?? null);
      const comparisonHoverSeries = [];
      for (const track of tracks) {
        for (const win of comparisonResults || []) {
          const stateList = this._buildEntityStateList(track.series.entityId, win.histResult, win.statsResult || {});
          const winPts = [];
          for (const s2 of stateList) {
            const v2 = parseFloat(s2.s);
            if (!isNaN(v2)) {
              winPts.push([Math.round(s2.lu * 1e3) - win.time_offset_ms, v2]);
            }
          }
          if (!winPts.length) {
            continue;
          }
          const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          let hoverOpacity;
          if (isHovered) {
            hoverOpacity = 0.85;
          } else if (hoveringDifferentComparison && isSelected) {
            hoverOpacity = 0.25;
          } else {
            hoverOpacity = 0.85;
          }
          comparisonHoverSeries.push({
            entityId: `${win.id}:${track.series.entityId}`,
            relatedEntityId: track.series.entityId,
            label: track.series.label,
            windowLabel: win.label || "Date window",
            unit: track.series.unit,
            pts: winPts,
            color: track.series.color,
            hoverOpacity,
            track
          });
        }
      }
      this._attachSplitHover(tracks, comparisonHoverSeries, events, renderT0, renderT1, chartStage, options, effectiveAnalysisMap, hasSelectedComparisonWindow);
    }
    _attachSplitHover(tracks, comparisonHoverSeries, events, t0, t1, chartStage, options, analysisMap, hasSelectedComparisonWindow) {
      if (this._chartHoverCleanup) {
        this._chartHoverCleanup();
        this._chartHoverCleanup = null;
      }
      if (!tracks.length || !chartStage) {
        return;
      }
      const primaryRenderer = tracks[0].renderer;
      const lastTrack = tracks[tracks.length - 1];
      const eventThresholdMs = primaryRenderer.cw ? 14 * ((t1 - t0) / primaryRenderer.cw) : 0;
      const splitSelTop = tracks[0].rowOffset + primaryRenderer.pad.top;
      const splitSelBottom = lastTrack.rowOffset + lastTrack.renderer.pad.top + lastTrack.renderer.ch;
      const splitSelHeight = splitSelBottom - splitSelTop;
      const overlayEl = document.createElement("div");
      overlayEl.id = "chart-split-overlay";
      overlayEl.style.cssText = "position:absolute;inset:0;pointer-events:auto;z-index:2;cursor:crosshair;";
      chartStage.appendChild(overlayEl);
      const overlayRelX = (clientX) => {
        const rect = overlayEl.getBoundingClientRect();
        return clampChartValue(
          clientX - rect.left,
          primaryRenderer.pad.left,
          primaryRenderer.pad.left + primaryRenderer.cw
        );
      };
      const stageXToTime = (stageX) => {
        const ratio = primaryRenderer.cw ? (stageX - primaryRenderer.pad.left) / primaryRenderer.cw : 0;
        return t0 + ratio * (t1 - t0);
      };
      const inPlotBoundsX = (clientX) => {
        const rect = overlayEl.getBoundingClientRect();
        const localX = clientX - rect.left;
        return localX >= primaryRenderer.pad.left && localX <= primaryRenderer.pad.left + primaryRenderer.cw;
      };
      const buildSplitHover = (clientX) => {
        const baseRect = tracks[0].canvas.getBoundingClientRect();
        if (!baseRect.width || !primaryRenderer.cw) {
          return null;
        }
        const localX = clampChartValue(clientX - baseRect.left, primaryRenderer.pad.left, primaryRenderer.pad.left + primaryRenderer.cw);
        const ratio = (localX - primaryRenderer.pad.left) / primaryRenderer.cw;
        const timeMs = t0 + ratio * (t1 - t0);
        const x2 = primaryRenderer.xOf(timeMs, t0, t1);
        const values = tracks.map(({ renderer, series, axis, rowOffset }) => {
          const value = renderer._interpolateValue(series.pts, timeMs);
          if (value == null) {
            return { entityId: series.entityId, label: series.label, value: null, unit: series.unit, color: series.color, opacity: 1, hasValue: false, axisSide: "left", axisSlot: 0 };
          }
          return {
            entityId: series.entityId,
            label: series.label,
            value,
            unit: series.unit,
            color: series.color,
            opacity: 1,
            hasValue: true,
            x: x2,
            y: rowOffset + renderer.yOf(value, axis.min, axis.max),
            axisSide: "left",
            axisSlot: 0
          };
        });
        const hoveredEvents = [];
        for (const event of events || []) {
          const eventTime = new Date(event.timestamp).getTime();
          if (eventTime < t0 || eventTime > t1) {
            continue;
          }
          const distance = Math.abs(eventTime - timeMs);
          if (distance <= eventThresholdMs) {
            hoveredEvents.push({ ...event, _hoverDistanceMs: distance });
          }
        }
        hoveredEvents.sort((a2, b2) => (a2._hoverDistanceMs || 0) - (b2._hoverDistanceMs || 0));
        const comparisonValues = (comparisonHoverSeries || []).map(({ pts, entityId, label, unit, color, hoverOpacity, track: cTrack }) => {
          const value = cTrack.renderer._interpolateValue(pts, timeMs);
          if (value == null) {
            return { entityId, label, value: null, unit, color, opacity: hoverOpacity, hasValue: false, axisSide: "left", axisSlot: 0 };
          }
          return {
            entityId,
            label,
            value,
            unit,
            color,
            opacity: hoverOpacity,
            hasValue: true,
            x: x2,
            y: cTrack.rowOffset + cTrack.renderer.yOf(value, cTrack.axis.min, cTrack.axis.max),
            axisSide: "left",
            axisSlot: 0
          };
        });
        const trendValues = [];
        const rateValues = [];
        const deltaValues = [];
        const summaryValues = [];
        const thresholdValues = [];
        const anomalyRegions = [];
        let showTrendCrosshairs = false;
        for (const track of tracks) {
          const {
            renderer: trackRenderer,
            series: trackSeries,
            axis: trackAxis,
            rowOffset: trackRowOffset,
            analysis: trackAnalysis,
            summaryStats: trackSummaryStats,
            trendPts: trackTrendPts,
            ratePts: trackRatePts,
            rateAxis: trackRateAxis,
            deltaPts: trackDeltaPts,
            deltaAxis: trackDeltaAxis,
            anomalyRegions: trackAnomalyRegions
          } = track;
          const effectiveAnalysis = trackAnalysis || (analysisMap || /* @__PURE__ */ new Map()).get(trackSeries.entityId) || normalizeHistorySeriesAnalysis(null);
          const trackHideSource = this._seriesShouldHideSource(effectiveAnalysis, hasSelectedComparisonWindow);
          if (effectiveAnalysis.show_trend_lines === true && Array.isArray(trackTrendPts) && trackTrendPts.length >= 2) {
            if (effectiveAnalysis.show_trend_crosshairs === true) showTrendCrosshairs = true;
            const trendOpts = this._getTrendRenderOptions(effectiveAnalysis.trend_method, trackHideSource);
            const trendVal = trackRenderer._interpolateValue(trackTrendPts, timeMs);
            trendValues.push({
              entityId: `trend:${trackSeries.entityId}`,
              relatedEntityId: trackSeries.entityId,
              label: trackSeries.label,
              baseLabel: trackSeries.label,
              unit: trackSeries.unit || "",
              color: hexToRgba(trackSeries.color, trendOpts.colorAlpha),
              opacity: trendOpts.lineOpacity,
              hasValue: trendVal != null,
              value: trendVal ?? null,
              ...trendVal != null ? { x: x2, y: trackRowOffset + trackRenderer.yOf(trendVal, trackAxis.min, trackAxis.max) } : {},
              axisSide: "left",
              axisSlot: 0,
              trend: true,
              rawVisible: !trackHideSource,
              showCrosshair: effectiveAnalysis.show_trend_crosshairs === true
            });
          }
          if (effectiveAnalysis.show_rate_of_change === true && Array.isArray(trackRatePts) && trackRatePts.length >= 2 && trackRateAxis) {
            const rateVal = trackRenderer._interpolateValue(trackRatePts, timeMs);
            rateValues.push({
              entityId: `rate:${trackSeries.entityId}`,
              relatedEntityId: trackSeries.entityId,
              label: trackSeries.label,
              baseLabel: trackSeries.label,
              unit: trackSeries.unit ? `${trackSeries.unit}/h` : "/h",
              color: hexToRgba(trackSeries.color, trackHideSource ? 0.96 : 0.82),
              opacity: trackHideSource ? 0.88 : 0.66,
              hasValue: rateVal != null,
              value: rateVal ?? null,
              ...rateVal != null ? { x: x2, y: trackRowOffset + trackRenderer.yOf(rateVal, trackRateAxis.min, trackRateAxis.max) } : {},
              axisSide: "right",
              axisSlot: 0,
              rate: true,
              rawVisible: !trackHideSource
            });
          }
          if (effectiveAnalysis.show_delta_analysis === true && effectiveAnalysis.show_delta_tooltip === true && Array.isArray(trackDeltaPts) && trackDeltaPts.length >= 2 && trackDeltaAxis) {
            const deltaVal = trackRenderer._interpolateValue(trackDeltaPts, timeMs);
            deltaValues.push({
              entityId: `delta:${trackSeries.entityId}`,
              relatedEntityId: trackSeries.entityId,
              label: trackSeries.label,
              baseLabel: trackSeries.label,
              unit: trackSeries.unit || "",
              color: hexToRgba(trackSeries.color, 0.92),
              opacity: 0.82,
              hasValue: deltaVal != null,
              value: deltaVal ?? null,
              ...deltaVal != null ? { x: x2, y: trackRowOffset + trackRenderer.yOf(deltaVal, trackDeltaAxis.min, trackDeltaAxis.max) } : {},
              axisSide: "right",
              axisSlot: 0,
              delta: true,
              rawVisible: !trackHideSource
            });
          }
          if (effectiveAnalysis.show_summary_stats === true && trackSummaryStats) {
            const summaryEntries = [
              { type: "min", value: trackSummaryStats.min, alphaV: trackHideSource ? 0.94 : 0.78, opac: trackHideSource ? 0.94 : 0.72 },
              { type: "mean", value: trackSummaryStats.mean, alphaV: trackHideSource ? 0.94 : 0.78, opac: trackHideSource ? 0.94 : 0.72 },
              { type: "max", value: trackSummaryStats.max, alphaV: trackHideSource ? 0.94 : 0.78, opac: trackHideSource ? 0.94 : 0.72 }
            ];
            for (const entry of summaryEntries) {
              if (!Number.isFinite(entry.value)) continue;
              summaryValues.push({
                entityId: `summary:${entry.type}:${trackSeries.entityId}`,
                relatedEntityId: trackSeries.entityId,
                label: trackSeries.label,
                baseLabel: trackSeries.label,
                unit: trackSeries.unit || "",
                color: hexToRgba(trackSeries.color, entry.alphaV),
                opacity: entry.opac,
                hasValue: true,
                value: entry.value,
                axisSide: "left",
                axisSlot: 0,
                summaryType: entry.type,
                summary: true,
                rawVisible: !trackHideSource
              });
            }
          }
          if (effectiveAnalysis.show_threshold_analysis === true) {
            const thresholdValue = Number(effectiveAnalysis.threshold_value);
            if (Number.isFinite(thresholdValue)) {
              thresholdValues.push({
                entityId: `threshold:${trackSeries.entityId}`,
                relatedEntityId: trackSeries.entityId,
                label: trackSeries.label,
                baseLabel: trackSeries.label,
                unit: trackSeries.unit || "",
                color: hexToRgba(trackSeries.color, trackHideSource ? 0.82 : 0.46),
                opacity: trackHideSource ? 0.84 : 0.48,
                hasValue: true,
                value: thresholdValue,
                axisSide: "left",
                axisSlot: 0,
                threshold: true,
                rawVisible: !trackHideSource
              });
            }
          }
          if (Array.isArray(trackAnomalyRegions)) {
            for (const region of trackAnomalyRegions) {
              const regionStartMs = region?.cluster?.points?.[0]?.timeMs ?? region.startTime;
              const regionEndMs = region?.cluster?.points?.[(region?.cluster?.points?.length ?? 1) - 1]?.timeMs ?? region.endTime;
              if (Number.isFinite(regionStartMs) && Number.isFinite(regionEndMs) && timeMs >= regionStartMs && timeMs <= regionEndMs) {
                anomalyRegions.push(region);
              }
            }
          }
        }
        const hideRawData = tracks.every((track) => {
          const eff = track.analysis || (analysisMap || /* @__PURE__ */ new Map()).get(track.series.entityId) || normalizeHistorySeriesAnalysis(null);
          return this._seriesShouldHideSource(eff, hasSelectedComparisonWindow);
        });
        return {
          x: x2,
          y: values.find((v2) => v2.hasValue)?.y ?? splitSelTop + 12,
          timeMs,
          rangeStartMs: timeMs,
          rangeEndMs: timeMs,
          values: values.filter((v2) => v2.hasValue),
          trendValues,
          rateValues,
          deltaValues,
          summaryValues,
          thresholdValues,
          comparisonValues: comparisonValues.filter((v2) => v2.hasValue),
          binaryValues: [],
          primary: values.find((v2) => v2.hasValue) ?? null,
          event: hoveredEvents.length > 0 ? (({ _hoverDistanceMs: _hd, ...rest }) => rest)(hoveredEvents[0]) : null,
          events: hoveredEvents.map(({ _hoverDistanceMs: _hd, ...rest }) => rest),
          anomalyRegions,
          emphasizeGuides: options.emphasizeHoverGuides === true,
          showTrendCrosshairs,
          hideRawData,
          splitVertical: { top: splitSelTop, height: splitSelHeight }
        };
      };
      const showFromPointer = (clientX, clientY) => {
        if (this._chartZoomDragging) {
          return;
        }
        const hover = buildSplitHover(clientX);
        if (!hover) {
          this._chartLastHover = null;
          hideLineChartHover(this);
          overlayEl.style.cursor = "default";
          return;
        }
        this._chartLastHover = hover;
        showLineChartCrosshair(this, primaryRenderer, hover);
        if (this._config.show_tooltips !== false) {
          showLineChartTooltip(this, hover, clientX, clientY);
        } else {
          hideTooltip(this);
        }
        dispatchLineChartHover(this, hover);
        overlayEl.style.cursor = "crosshair";
      };
      const hideHover = () => {
        this._chartLastHover = null;
        hideLineChartHover(this);
      };
      const onMouseMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
      const onMouseLeave = () => hideHover();
      const onTouchMove = (ev) => {
        if (ev.touches.length === 1) {
          showFromPointer(ev.touches[0].clientX, ev.touches[0].clientY);
        }
      };
      const onTouchEnd = () => hideHover();
      overlayEl.addEventListener("mousemove", onMouseMove);
      overlayEl.addEventListener("mouseleave", onMouseLeave);
      overlayEl.addEventListener("touchmove", onTouchMove, { passive: true });
      overlayEl.addEventListener("touchend", onTouchEnd);
      this._chartHoverCleanup = () => {
        overlayEl.removeEventListener("mousemove", onMouseMove);
        overlayEl.removeEventListener("mouseleave", onMouseLeave);
        overlayEl.removeEventListener("touchmove", onTouchMove);
        overlayEl.removeEventListener("touchend", onTouchEnd);
      };
      const selection = this.shadowRoot?.getElementById("chart-zoom-selection");
      const hideZoomSelection = () => {
        if (!selection) {
          return;
        }
        selection.hidden = true;
        selection.classList.remove("visible");
      };
      const renderZoomSelection = (startX, currentX) => {
        if (!selection) {
          return;
        }
        const left = Math.min(startX, currentX);
        const width = Math.abs(currentX - startX);
        selection.style.left = `${left}px`;
        selection.style.top = `${splitSelTop}px`;
        selection.style.width = `${width}px`;
        selection.style.height = `${splitSelHeight}px`;
        selection.hidden = false;
        selection.classList.add("visible");
      };
      let zoomPointerId = null;
      let zoomStartX = 0;
      let zoomCurrentX = 0;
      let zoomDragging = false;
      const onZoomPointerMove = (ev) => {
        if (zoomPointerId == null || ev.pointerId !== zoomPointerId) {
          return;
        }
        zoomCurrentX = overlayRelX(ev.clientX);
        if (!zoomDragging && Math.abs(zoomCurrentX - zoomStartX) < 6) {
          return;
        }
        zoomDragging = true;
        this._chartZoomDragging = true;
        hideLineChartHover(this);
        renderZoomSelection(zoomStartX, zoomCurrentX);
        ev.preventDefault();
      };
      const finishZoom = (ev) => {
        if (zoomPointerId == null || ev.pointerId !== zoomPointerId) {
          return;
        }
        const didDrag = zoomDragging;
        const endX = zoomCurrentX;
        window.removeEventListener("pointermove", onZoomPointerMove);
        window.removeEventListener("pointerup", finishZoom);
        window.removeEventListener("pointercancel", finishZoom);
        zoomPointerId = null;
        zoomDragging = false;
        this._chartZoomDragging = false;
        hideZoomSelection();
        if (!didDrag || Math.abs(endX - zoomStartX) < 8) {
          return;
        }
        const startTime = Math.min(stageXToTime(zoomStartX), stageXToTime(endX));
        const endTime = Math.max(stageXToTime(zoomStartX), stageXToTime(endX));
        this._applyZoomRange(startTime, endTime);
      };
      const onZoomPointerDown = (ev) => {
        if (ev.button !== 0 || !inPlotBoundsX(ev.clientX)) {
          return;
        }
        zoomPointerId = ev.pointerId;
        zoomStartX = overlayRelX(ev.clientX);
        zoomCurrentX = zoomStartX;
        zoomDragging = false;
        this._chartZoomDragging = false;
        window.addEventListener("pointermove", onZoomPointerMove);
        window.addEventListener("pointerup", finishZoom);
        window.addEventListener("pointercancel", finishZoom);
      };
      const onZoomDoubleClick = (ev) => {
        if (!inPlotBoundsX(ev.clientX)) {
          return;
        }
        ev.preventDefault();
        this._clearZoomRange();
      };
      overlayEl.addEventListener("pointerdown", onZoomPointerDown);
      overlayEl.addEventListener("dblclick", onZoomDoubleClick);
      if (this._chartZoomCleanup) {
        this._chartZoomCleanup();
      }
      this._chartZoomCleanup = () => {
        overlayEl.removeEventListener("pointerdown", onZoomPointerDown);
        overlayEl.removeEventListener("dblclick", onZoomDoubleClick);
        window.removeEventListener("pointermove", onZoomPointerMove);
        window.removeEventListener("pointerup", finishZoom);
        window.removeEventListener("pointercancel", finishZoom);
        zoomPointerId = null;
        zoomDragging = false;
        this._chartZoomDragging = false;
        hideZoomSelection();
      };
    }
    _binaryOnLabel(entityId) {
      const deviceClass = String(this._hass?.states?.[entityId]?.attributes?.device_class || "").toLowerCase();
      const labels = {
        battery: "low",
        battery_charging: "charging",
        carbon_monoxide: "detected",
        cold: "cold",
        connectivity: "connected",
        door: "open",
        garage_door: "open",
        gas: "detected",
        heat: "hot",
        lock: "unlocked",
        moisture: "wet",
        motion: "motion",
        moving: "moving",
        occupancy: "occupied",
        opening: "open",
        plug: "plugged in",
        power: "power",
        presence: "present",
        problem: "problem",
        running: "running",
        safety: "unsafe",
        smoke: "smoke",
        sound: "sound",
        tamper: "tampered",
        update: "update available",
        vibration: "vibration",
        window: "open"
      };
      return labels[deviceClass] || "on";
    }
    _binaryOffLabel(entityId) {
      const deviceClass = String(this._hass?.states?.[entityId]?.attributes?.device_class || "").toLowerCase();
      const labels = {
        battery: "normal",
        battery_charging: "not charging",
        carbon_monoxide: "clear",
        cold: "normal",
        connectivity: "disconnected",
        door: "closed",
        garage_door: "closed",
        gas: "clear",
        heat: "normal",
        lock: "locked",
        moisture: "dry",
        motion: "clear",
        moving: "still",
        occupancy: "clear",
        opening: "closed",
        plug: "unplugged",
        power: "off",
        presence: "away",
        problem: "ok",
        running: "idle",
        safety: "safe",
        smoke: "clear",
        sound: "quiet",
        tamper: "clear",
        update: "up to date",
        vibration: "still",
        window: "closed"
      };
      return labels[deviceClass] || "off";
    }
    _normalizeBinaryHistory(stateList) {
      return (Array.isArray(stateList) ? stateList : []).map((state) => {
        const rawTimestamp = state?.lu;
        const timeSec = typeof rawTimestamp === "number" ? rawTimestamp : new Date(state?.last_changed || state?.lu || 0).getTime() / 1e3;
        if (!Number.isFinite(timeSec)) {
          return null;
        }
        return {
          lu: Math.round(timeSec * 1e3) / 1e3,
          s: String(state?.s ?? state?.state ?? "")
        };
      }).filter(Boolean).sort((a2, b2) => a2.lu - b2.lu);
    }
    _normalizeNumericHistory(stateList) {
      return (Array.isArray(stateList) ? stateList : []).map((state) => {
        const value = parseFloat(state?.s);
        if (Number.isNaN(value)) {
          return null;
        }
        const rawTimestamp = state?.lu ?? state?.lc ?? state?.last_changed ?? state?.last_updated;
        const timeSec = typeof rawTimestamp === "number" ? rawTimestamp : new Date(rawTimestamp || 0).getTime() / 1e3;
        if (!Number.isFinite(timeSec)) {
          return null;
        }
        return {
          lu: Math.round(timeSec * 1e3) / 1e3,
          s: String(value)
        };
      }).filter(Boolean);
    }
    _getHistoryStatesForEntity(entityId, histResult) {
      if (!histResult) {
        return [];
      }
      if (Array.isArray(histResult?.[entityId])) {
        return histResult[entityId];
      }
      if (Array.isArray(histResult)) {
        const entityIndex = this._entityIds.indexOf(entityId);
        if (entityIndex >= 0 && Array.isArray(histResult[entityIndex])) {
          return histResult[entityIndex];
        }
        if (histResult.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
          return histResult.filter((entry) => entry.entity_id === entityId);
        }
      }
      if (histResult && typeof histResult === "object") {
        if (Array.isArray(histResult.result?.[entityId])) {
          return histResult.result[entityId];
        }
        if (Array.isArray(histResult.result)) {
          const entityIndex = this._entityIds.indexOf(entityId);
          if (entityIndex >= 0 && Array.isArray(histResult.result[entityIndex])) {
            return histResult.result[entityIndex];
          }
        }
      }
      return [];
    }
    _normalizeStatisticsHistory(statEntries) {
      return (Array.isArray(statEntries) ? statEntries : []).map((entry) => {
        const value = Number(entry?.mean);
        if (!Number.isFinite(value)) {
          return null;
        }
        const rawTimestamp = entry?.start;
        let timestamp;
        if (typeof rawTimestamp === "number") {
          timestamp = rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1e3;
        } else {
          timestamp = new Date(rawTimestamp).getTime();
        }
        if (!Number.isFinite(timestamp)) {
          return null;
        }
        return {
          lu: Math.round(timestamp) / 1e3,
          s: String(value)
        };
      }).filter(Boolean).sort((a2, b2) => a2.lu - b2.lu);
    }
    _mergeNumericHistoryWithStatistics(rawHistory, statisticsHistory) {
      const raw = Array.isArray(rawHistory) ? rawHistory : [];
      const stats = Array.isArray(statisticsHistory) ? statisticsHistory : [];
      if (!raw.length) {
        return [...stats];
      }
      if (!stats.length) {
        return [...raw];
      }
      const firstRawMs = raw[0].lu * 1e3;
      const lastRawMs = raw[raw.length - 1].lu * 1e3;
      const merged = [
        ...stats.filter((entry) => {
          const timeMs = entry.lu * 1e3;
          return timeMs < firstRawMs || timeMs > lastRawMs;
        }),
        ...raw
      ];
      merged.sort((a2, b2) => a2.lu - b2.lu);
      return merged;
    }
    _buildEntityStateList(entityId, histResult, statsResult = {}) {
      const domain = entityId.split(".")[0];
      const historyStates = this._getHistoryStatesForEntity(entityId, histResult);
      if (domain === "binary_sensor") {
        return this._normalizeBinaryHistory(historyStates);
      }
      const rawHistory = this._normalizeNumericHistory(historyStates);
      const statisticsHistory = this._normalizeStatisticsHistory(statsResult?.[entityId]);
      return this._mergeNumericHistoryWithStatistics(rawHistory, statisticsHistory);
    }
    _hasDrawableHistoryData(histResult = {}, statsResult = {}) {
      return this._seriesSettings.some((seriesSetting) => {
        const stateList = this._buildEntityStateList(seriesSetting.entity_id, histResult, statsResult);
        return Array.isArray(stateList) && stateList.length > 0;
      });
    }
    _getDrawableHistoryQuality(histResult = {}, statsResult = {}) {
      let totalPoints = 0;
      let populatedSeries = 0;
      for (const seriesSetting of this._seriesSettings) {
        const stateList = this._buildEntityStateList(seriesSetting.entity_id, histResult, statsResult);
        const count = Array.isArray(stateList) ? stateList.length : 0;
        totalPoints += count;
        if (count > 0) {
          populatedSeries += 1;
        }
      }
      return { totalPoints, populatedSeries };
    }
    _getAxisValueExtent(values = []) {
      let min = Infinity;
      let max = -Infinity;
      for (const value of values) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          continue;
        }
        if (numeric < min) {
          min = numeric;
        }
        if (numeric > max) {
          max = numeric;
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null;
      }
      return { min, max };
    }
    _getAvailableChartHeight(minChartHeight = 280) {
      const card = this.shadowRoot?.querySelector("ha-card");
      const header = this.shadowRoot?.querySelector(".card-header");
      const topSlot = this.shadowRoot?.getElementById("chart-top-slot");
      const legend = this.shadowRoot?.getElementById("legend");
      const scrollViewport = this.shadowRoot?.getElementById("chart-scroll-viewport");
      const wrap = this.shadowRoot?.querySelector(".chart-wrap");
      const cardHeight = card?.clientHeight || 0;
      const occupiedHeight = (header?.offsetHeight || 0) + (topSlot && !topSlot.hidden ? topSlot.offsetHeight || 0 : 0) + (legend?.offsetHeight || 0);
      const cardDerivedHeight = cardHeight ? Math.max(0, cardHeight - occupiedHeight) : 0;
      const viewportHeight = scrollViewport?.clientHeight || 0;
      const wrapHeight = wrap?.clientHeight || 0;
      return Math.max(
        minChartHeight,
        cardDerivedHeight || viewportHeight || wrapHeight || 0
      );
    }
    _getTrendWindowMs(value) {
      const windows = {
        "1h": 60 * 60 * 1e3,
        "6h": 6 * 60 * 60 * 1e3,
        "24h": 24 * 60 * 60 * 1e3,
        "7d": 7 * 24 * 60 * 60 * 1e3,
        "14d": 14 * 24 * 60 * 60 * 1e3,
        "21d": 21 * 24 * 60 * 60 * 1e3,
        "28d": 28 * 24 * 60 * 60 * 1e3
      };
      return windows[value] || windows["24h"];
    }
    _buildRollingAverageTrend(points, windowMs) {
      if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(windowMs) || windowMs <= 0) {
        return [];
      }
      const trendPoints = [];
      let windowStartIndex = 0;
      let windowSum = 0;
      for (let index = 0; index < points.length; index += 1) {
        const [time, value] = points[index];
        windowSum += value;
        while (windowStartIndex < index && time - points[windowStartIndex][0] > windowMs) {
          windowSum -= points[windowStartIndex][1];
          windowStartIndex += 1;
        }
        const count = index - windowStartIndex + 1;
        if (count > 0) {
          trendPoints.push([time, windowSum / count]);
        }
      }
      return trendPoints;
    }
    _buildLinearTrend(points) {
      if (!Array.isArray(points) || points.length < 2) {
        return [];
      }
      const origin = points[0][0];
      let sumX = 0;
      let sumY = 0;
      let sumXX = 0;
      let sumXY = 0;
      for (const [time, value] of points) {
        const x2 = (time - origin) / (60 * 60 * 1e3);
        sumX += x2;
        sumY += value;
        sumXX += x2 * x2;
        sumXY += x2 * value;
      }
      const count = points.length;
      const denominator = count * sumXX - sumX * sumX;
      if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
        return [];
      }
      const slope = (count * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / count;
      const firstTime = points[0][0];
      const lastTime = points[points.length - 1][0];
      const firstX = (firstTime - origin) / (60 * 60 * 1e3);
      const lastX = (lastTime - origin) / (60 * 60 * 1e3);
      return [
        [firstTime, intercept + slope * firstX],
        [lastTime, intercept + slope * lastX]
      ];
    }
    // ── Data gap detection & rendering ────────────────────────────────────────
    /**
     * Find gaps in a sorted points array using adaptive local density.
     *
     * For each interval, compare it to the local neighbourhood (the surrounding
     * intervals within a sliding window). An interval is a gap when it exceeds
     * 3× the local median. This handles merged data where raw history (seconds/
     * minutes apart) and long-term statistics (hourly) coexist – each region's
     * density is evaluated independently.
     *
     * When a fixed threshold is provided (non-null), it is used directly instead
     * of the adaptive approach.
     *
     * Returns array of { startIdx, endIdx } where startIdx is the last point
     * before the gap and endIdx is the first point after.
     */
    _findGaps(pts, fixedThreshold) {
      if (pts.length < 5) return [];
      const intervals = [];
      for (let i2 = 1; i2 < pts.length; i2++) {
        intervals.push(pts[i2][0] - pts[i2 - 1][0]);
      }
      if (fixedThreshold != null) {
        const gaps2 = [];
        for (let i2 = 0; i2 < intervals.length; i2++) {
          if (intervals[i2] > fixedThreshold) {
            gaps2.push({ startIdx: i2, endIdx: i2 + 1 });
          }
        }
        return gaps2;
      }
      const windowRadius = Math.max(3, Math.min(12, Math.floor(intervals.length / 6)));
      const gaps = [];
      for (let i2 = 0; i2 < intervals.length; i2++) {
        const lo = Math.max(0, i2 - windowRadius);
        const hi = Math.min(intervals.length, i2 + windowRadius + 1);
        const neighbours = intervals.slice(lo, hi).sort((a2, b2) => a2 - b2);
        const localMedian = neighbours[Math.floor(neighbours.length / 2)];
        if (intervals[i2] > localMedian * 3 && intervals[i2] > 1e4) {
          gaps.push({ startIdx: i2, endIdx: i2 + 1 });
        }
      }
      return gaps;
    }
    /**
     * Split a points array into contiguous segments separated by gaps.
     */
    _splitPointsByGaps(pts, gaps) {
      if (!gaps.length) return [pts];
      const segments = [];
      let start = 0;
      for (const gap of gaps) {
        segments.push(pts.slice(start, gap.startIdx + 1));
        start = gap.endIdx;
      }
      segments.push(pts.slice(start));
      return segments;
    }
    /**
     * Draw a series line with automatic gap detection. Solid segments are drawn
     * normally, gaps are drawn as dashed lines, and diagonal hash markers are
     * placed at every gap boundary.
     */
    /**
     * Parse a duration string like "5m", "1h", "24h" into milliseconds.
     */
    _parseGapThresholdMs(value) {
      if (!value || value === "auto") return null;
      const match = String(value).match(/^(\d+(?:\.\d+)?)\s*(m|h|d)$/);
      if (!match) return null;
      const num = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "m") return num * 60 * 1e3;
      if (unit === "h") return num * 60 * 60 * 1e3;
      if (unit === "d") return num * 24 * 60 * 60 * 1e3;
      return null;
    }
    _drawSeriesLine(renderer, pts, color, t0, t1, vMin, vMax, options = {}) {
      if (this._config.show_data_gaps === false || pts.length < 5) {
        renderer.drawLine(pts, color, t0, t1, vMin, vMax, options);
        return;
      }
      const fixedThreshold = this._parseGapThresholdMs(this._config.data_gap_threshold);
      const gaps = this._findGaps(pts, fixedThreshold);
      if (!gaps.length) {
        renderer.drawLine(pts, color, t0, t1, vMin, vMax, options);
        return;
      }
      const segments = this._splitPointsByGaps(pts, gaps);
      for (const seg of segments) {
        if (seg.length >= 2) {
          renderer.drawLine(seg, color, t0, t1, vMin, vMax, options);
        }
      }
      for (const gap of gaps) {
        renderer.drawLine(
          [pts[gap.startIdx], pts[gap.endIdx]],
          color,
          t0,
          t1,
          vMin,
          vMax,
          { ...options, dashed: true, lineOpacity: (options.lineOpacity || 1) * 0.3, fillAlpha: 0 }
        );
      }
      const boundaryPoints = [];
      for (const gap of gaps) {
        boundaryPoints.push(pts[gap.startIdx], pts[gap.endIdx]);
      }
      renderer.drawGapMarkers(boundaryPoints, color, t0, t1, vMin, vMax);
    }
    _buildTrendPoints(points, method = "rolling_average", trendWindow = "24h") {
      if (!Array.isArray(points) || points.length < 2) {
        return [];
      }
      if (method === "linear_trend") {
        return this._buildLinearTrend(points);
      }
      return this._buildRollingAverageTrend(points, this._getTrendWindowMs(trendWindow));
    }
    _buildTrendBaselinePoints(points, method = "rolling_average", trendWindow = "24h") {
      if (!Array.isArray(points) || points.length < 2) {
        return [];
      }
      if (method === "linear_trend") {
        return this._buildLinearTrend(points);
      }
      return this._buildRollingAverageTrend(points, this._getTrendWindowMs(trendWindow));
    }
    _interpolateSeriesValue(points, timeMs) {
      if (!Array.isArray(points) || points.length === 0) {
        return null;
      }
      if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {
        return null;
      }
      if (timeMs === points[0][0]) {
        return points[0][1];
      }
      if (timeMs === points[points.length - 1][0]) {
        return points[points.length - 1][1];
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const [startTime, startValue] = points[index];
        const [endTime, endValue] = points[index + 1];
        if (timeMs >= startTime && timeMs <= endTime) {
          const fraction = (timeMs - startTime) / (endTime - startTime);
          return startValue + (endValue - startValue) * fraction;
        }
      }
      return null;
    }
    _getAnomalySensitivityThreshold(sensitivity = "medium") {
      if (sensitivity === "low") {
        return 2.8;
      }
      if (sensitivity === "high") {
        return 1.6;
      }
      return 2.2;
    }
    _buildAnomalyClusters(points, method = "rolling_average", trendWindow = "24h", sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 3) {
        return [];
      }
      const baselinePoints = this._buildTrendBaselinePoints(points, method, trendWindow);
      if (!Array.isArray(baselinePoints) || baselinePoints.length < 2) {
        return [];
      }
      const residualPoints = [];
      for (const [timeMs, value] of points) {
        const baselineValue = this._interpolateSeriesValue(baselinePoints, timeMs);
        if (!Number.isFinite(baselineValue)) {
          continue;
        }
        residualPoints.push({
          timeMs,
          value,
          baselineValue,
          residual: value - baselineValue
        });
      }
      if (residualPoints.length < 3) {
        return [];
      }
      let sumSquares = 0;
      residualPoints.forEach((point) => {
        sumSquares += point.residual * point.residual;
      });
      const rmsResidual = Math.sqrt(sumSquares / residualPoints.length);
      if (!Number.isFinite(rmsResidual) || rmsResidual <= 1e-6) {
        return [];
      }
      const threshold = rmsResidual * this._getAnomalySensitivityThreshold(sensitivity);
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) {
          return;
        }
        const maxDeviation = currentCluster.reduce((maxValue, point) => Math.max(maxValue, Math.abs(point.residual)), 0);
        clusters.push({
          points: currentCluster.slice(),
          maxDeviation,
          anomalyMethod: "trend_residual"
        });
        currentCluster = [];
      };
      residualPoints.forEach((point) => {
        if (Math.abs(point.residual) >= threshold) {
          currentCluster.push(point);
        } else {
          flushCluster();
        }
      });
      flushCluster();
      return clusters.filter((cluster) => cluster.points.length > 0);
    }
    _buildRateOfChangeAnomalyClusters(points, rateWindow = "1h", sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 3) {
        return [];
      }
      const ratePoints = this._buildRateOfChangePoints(points, rateWindow);
      if (!Array.isArray(ratePoints) || ratePoints.length < 3) {
        return [];
      }
      let sumRates = 0;
      for (const [, rate] of ratePoints) {
        sumRates += rate;
      }
      const meanRate = sumRates / ratePoints.length;
      let sumSqDev = 0;
      for (const [, rate] of ratePoints) {
        const dev = rate - meanRate;
        sumSqDev += dev * dev;
      }
      const rmsDeviation = Math.sqrt(sumSqDev / ratePoints.length);
      if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) {
        return [];
      }
      const threshold = rmsDeviation * this._getAnomalySensitivityThreshold(sensitivity);
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) {
          return;
        }
        const maxDeviation = currentCluster.reduce((maxVal, point) => Math.max(maxVal, Math.abs(point.residual)), 0);
        clusters.push({
          points: currentCluster.slice(),
          maxDeviation,
          anomalyMethod: "rate_of_change"
        });
        currentCluster = [];
      };
      for (const [timeMs, rate] of ratePoints) {
        const residual = rate - meanRate;
        if (Math.abs(residual) >= threshold) {
          const sourceValue = this._interpolateSeriesValue(points, timeMs);
          if (!Number.isFinite(sourceValue)) {
            flushCluster();
            continue;
          }
          currentCluster.push({
            timeMs,
            value: sourceValue,
            baselineValue: meanRate,
            residual
          });
        } else {
          flushCluster();
        }
      }
      flushCluster();
      return clusters.filter((cluster) => cluster.points.length > 0);
    }
    _buildIQRAnomalyClusters(points, sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 4) return [];
      const sorted = points.map(([, v2]) => v2).sort((a2, b2) => a2 - b2);
      const n2 = sorted.length;
      const q1 = sorted[Math.floor(n2 * 0.25)];
      const q2 = sorted[Math.floor(n2 * 0.5)];
      const q3 = sorted[Math.floor(n2 * 0.75)];
      const iqr = q3 - q1;
      if (!Number.isFinite(iqr) || iqr <= 1e-6) return [];
      let k2;
      if (sensitivity === "low") {
        k2 = 3;
      } else if (sensitivity === "high") {
        k2 = 1.5;
      } else {
        k2 = 2;
      }
      const lowerFence = q1 - k2 * iqr;
      const upperFence = q3 + k2 * iqr;
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const maxDeviation = currentCluster.reduce((m2, p2) => Math.max(m2, Math.abs(p2.residual)), 0);
        clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "iqr" });
        currentCluster = [];
      };
      for (const [timeMs, value] of points) {
        if (value < lowerFence || value > upperFence) {
          currentCluster.push({ timeMs, value, baselineValue: q2, residual: value - q2 });
        } else {
          flushCluster();
        }
      }
      flushCluster();
      return clusters.filter((c2) => c2.points.length > 0);
    }
    _buildRollingZScoreAnomalyClusters(points, windowValue = "24h", sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 3) return [];
      const windowMs = this._getTrendWindowMs(windowValue);
      if (!Number.isFinite(windowMs) || windowMs <= 0) return [];
      const threshold = this._getAnomalySensitivityThreshold(sensitivity);
      const residuals = [];
      let windowStart = 0;
      let windowSum = 0;
      let windowSumSq = 0;
      for (let i2 = 0; i2 < points.length; i2 += 1) {
        const [timeMs, value] = points[i2];
        windowSum += value;
        windowSumSq += value * value;
        while (windowStart < i2 && timeMs - points[windowStart][0] > windowMs) {
          const old = points[windowStart][1];
          windowSum -= old;
          windowSumSq -= old * old;
          windowStart += 1;
        }
        const count = i2 - windowStart + 1;
        if (count < 3) continue;
        const mean = windowSum / count;
        const variance = Math.max(0, windowSumSq / count - mean * mean);
        const std = Math.sqrt(variance);
        if (!Number.isFinite(std) || std <= 1e-6) continue;
        const zscore = (value - mean) / std;
        residuals.push(Math.abs(zscore) >= threshold ? { timeMs, value, baselineValue: mean, residual: value - mean, flagged: true } : { timeMs, flagged: false });
      }
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const maxDeviation = currentCluster.reduce((m2, p2) => Math.max(m2, Math.abs(p2.residual)), 0);
        clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });
        currentCluster = [];
      };
      for (const r2 of residuals) {
        if (r2.flagged) currentCluster.push(r2);
        else flushCluster();
      }
      flushCluster();
      return clusters.filter((c2) => c2.points.length > 0);
    }
    _getPersistenceWindowMs(value) {
      const windows = { "30m": 30 * 60 * 1e3, "1h": 60 * 60 * 1e3, "3h": 3 * 60 * 60 * 1e3, "6h": 6 * 60 * 60 * 1e3, "12h": 12 * 60 * 60 * 1e3, "24h": 24 * 60 * 60 * 1e3 };
      return windows[value] || windows["1h"];
    }
    _buildPersistenceAnomalyClusters(points, windowValue = "1h", sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 3) return [];
      const minDurationMs = this._getPersistenceWindowMs(windowValue);
      let totalMin = Infinity;
      let totalMax = -Infinity;
      for (const [, v2] of points) {
        if (v2 < totalMin) totalMin = v2;
        if (v2 > totalMax) totalMax = v2;
      }
      const totalRange = totalMax - totalMin;
      if (!Number.isFinite(totalRange) || totalRange <= 1e-6) return [];
      let flatFraction;
      if (sensitivity === "low") {
        flatFraction = 5e-3;
      } else if (sensitivity === "high") {
        flatFraction = 0.05;
      } else {
        flatFraction = 0.02;
      }
      const flatThreshold = flatFraction * totalRange;
      const clusters = [];
      let runStart = 0;
      let runMin = points[0][1];
      let runMax = points[0][1];
      const flushRun = (runEnd) => {
        const duration = points[runEnd][0] - points[runStart][0];
        if (duration >= minDurationMs && runEnd > runStart) {
          const mid = (runMin + runMax) / 2;
          const clusterPoints = [];
          for (let k2 = runStart; k2 <= runEnd; k2 += 1) {
            clusterPoints.push({ timeMs: points[k2][0], value: points[k2][1], baselineValue: mid, residual: points[k2][1] - mid });
          }
          clusters.push({ points: clusterPoints, maxDeviation: runMax - runMin, anomalyMethod: "persistence", flatRange: runMax - runMin });
        }
      };
      for (let i2 = 1; i2 < points.length; i2 += 1) {
        const v2 = points[i2][1];
        const nextMin = Math.min(runMin, v2);
        const nextMax = Math.max(runMax, v2);
        if (nextMax - nextMin > flatThreshold) {
          flushRun(i2 - 1);
          runStart = i2;
          runMin = v2;
          runMax = v2;
        } else {
          runMin = nextMin;
          runMax = nextMax;
        }
      }
      flushRun(points.length - 1);
      return clusters.filter((c2) => c2.points.length > 0);
    }
    _buildComparisonWindowAnomalyClusters(points, comparisonPoints, sensitivity = "medium") {
      if (!Array.isArray(points) || points.length < 3 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 3) return [];
      const deltaPoints = [];
      for (const [timeMs, value] of points) {
        const compValue = this._interpolateSeriesValue(comparisonPoints, timeMs);
        if (!Number.isFinite(compValue)) continue;
        deltaPoints.push({ timeMs, value, compValue, delta: value - compValue });
      }
      if (deltaPoints.length < 3) return [];
      let sumDeltas = 0;
      for (const p2 of deltaPoints) sumDeltas += p2.delta;
      const meanDelta = sumDeltas / deltaPoints.length;
      let sumSqDev = 0;
      for (const p2 of deltaPoints) {
        const dev = p2.delta - meanDelta;
        sumSqDev += dev * dev;
      }
      const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);
      if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) return [];
      const threshold = rmsDeviation * this._getAnomalySensitivityThreshold(sensitivity);
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const maxDeviation = currentCluster.reduce((m2, p2) => Math.max(m2, Math.abs(p2.residual)), 0);
        clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "comparison_window" });
        currentCluster = [];
      };
      for (const { timeMs, value, compValue, delta } of deltaPoints) {
        const residual = delta - meanDelta;
        if (Math.abs(residual) >= threshold) {
          currentCluster.push({ timeMs, value, baselineValue: compValue, residual: value - compValue });
        } else {
          flushCluster();
        }
      }
      flushCluster();
      return clusters.filter((c2) => c2.points.length > 0);
    }
    _applyAnomalyOverlapMode(clustersByMethod, overlapMode) {
      const methodKeys = Object.keys(clustersByMethod);
      if (methodKeys.length <= 1 || overlapMode === "all") {
        return methodKeys.flatMap((m2) => clustersByMethod[m2]);
      }
      const flaggedByMethod = {};
      for (const m2 of methodKeys) {
        flaggedByMethod[m2] = new Set(clustersByMethod[m2].flatMap((c2) => c2.points.map((p2) => p2.timeMs)));
      }
      const overlapTimes = /* @__PURE__ */ new Set();
      for (const m2 of methodKeys) {
        for (const t2 of flaggedByMethod[m2]) {
          if (methodKeys.some((other) => other !== m2 && flaggedByMethod[other].has(t2))) overlapTimes.add(t2);
        }
      }
      if (overlapMode === "only") {
        const seen = /* @__PURE__ */ new Set();
        const result2 = [];
        for (const m2 of methodKeys) {
          for (const cluster of clustersByMethod[m2]) {
            const pts = cluster.points.filter((p2) => overlapTimes.has(p2.timeMs));
            if (pts.length === 0) continue;
            const key = pts.map((p2) => p2.timeMs).join(",");
            if (seen.has(key)) continue;
            seen.add(key);
            const detectedByMethods = methodKeys.filter((other) => pts.some((p2) => flaggedByMethod[other].has(p2.timeMs)));
            result2.push({ ...cluster, points: pts, maxDeviation: pts.reduce((v2, p2) => Math.max(v2, Math.abs(p2.residual || 0)), 0), isOverlap: true, detectedByMethods });
          }
        }
        return result2;
      }
      const result = [];
      for (const m2 of methodKeys) {
        for (const cluster of clustersByMethod[m2]) {
          const hasOverlap = cluster.points.some((p2) => overlapTimes.has(p2.timeMs));
          const detectedByMethods = hasOverlap ? methodKeys.filter((other) => cluster.points.some((p2) => flaggedByMethod[other].has(p2.timeMs))) : [m2];
          result.push({ ...cluster, isOverlap: hasOverlap, detectedByMethods });
        }
      }
      return result;
    }
    _buildRateOfChangePoints(points, rateWindow = "1h") {
      if (!Array.isArray(points) || points.length < 2) {
        return [];
      }
      const ratePoints = [];
      for (let index = 1; index < points.length; index += 1) {
        const [timeMs, value] = points[index];
        let comparisonPoint = null;
        if (rateWindow === "point_to_point") {
          comparisonPoint = points[index - 1];
        } else {
          const windowMs = this._getTrendWindowMs(rateWindow);
          if (!Number.isFinite(windowMs) || windowMs <= 0) {
            continue;
          }
          for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {
            const candidatePoint = points[candidateIndex];
            if (timeMs - candidatePoint[0] >= windowMs) {
              comparisonPoint = candidatePoint;
              break;
            }
          }
          if (!comparisonPoint) {
            comparisonPoint = points[0];
          }
        }
        if (!Array.isArray(comparisonPoint) || comparisonPoint.length < 2) {
          continue;
        }
        const deltaMs = timeMs - comparisonPoint[0];
        if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
          continue;
        }
        const deltaHours = deltaMs / (60 * 60 * 1e3);
        if (!Number.isFinite(deltaHours) || deltaHours <= 0) {
          continue;
        }
        const rateValue = (value - comparisonPoint[1]) / deltaHours;
        if (!Number.isFinite(rateValue)) {
          continue;
        }
        ratePoints.push([timeMs, rateValue]);
      }
      return ratePoints;
    }
    _interpolateSeriesValue(points, timeMs) {
      if (!Array.isArray(points) || !points.length) {
        return null;
      }
      if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {
        return null;
      }
      if (timeMs === points[0][0]) {
        return points[0][1];
      }
      if (timeMs === points[points.length - 1][0]) {
        return points[points.length - 1][1];
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const [startTime, startValue] = points[index];
        const [endTime, endValue] = points[index + 1];
        if (timeMs >= startTime && timeMs <= endTime) {
          const fraction = (timeMs - startTime) / (endTime - startTime);
          return startValue + fraction * (endValue - startValue);
        }
      }
      return null;
    }
    _buildDeltaPoints(sourcePoints, comparisonPoints) {
      if (!Array.isArray(sourcePoints) || sourcePoints.length < 2 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 2) {
        return [];
      }
      const deltaPoints = [];
      for (const [timeMs, value] of sourcePoints) {
        const comparisonValue = this._interpolateSeriesValue(comparisonPoints, timeMs);
        if (comparisonValue == null) {
          continue;
        }
        deltaPoints.push([timeMs, value - comparisonValue]);
      }
      return deltaPoints;
    }
    _buildSummaryStats(points) {
      if (!Array.isArray(points) || !points.length) {
        return null;
      }
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let count = 0;
      for (const point of points) {
        const value = Number(point?.[1]);
        if (!Number.isFinite(value)) {
          continue;
        }
        if (value < min) {
          min = value;
        }
        if (value > max) {
          max = value;
        }
        sum += value;
        count += 1;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || count === 0) {
        return null;
      }
      return {
        min,
        max,
        mean: sum / count
      };
    }
    _getTrendRenderOptions(method = "rolling_average", hideRawData = false) {
      if (method === "linear_trend") {
        return {
          colorAlpha: hideRawData ? 0.94 : 0.88,
          lineOpacity: hideRawData ? 0.86 : 0.74,
          lineWidth: 2.1,
          dashed: true,
          dotted: false
        };
      }
      return {
        colorAlpha: hideRawData ? 0.9 : 0.82,
        lineOpacity: hideRawData ? 0.84 : 0.62,
        lineWidth: 2.2,
        dashed: false,
        dotted: true
      };
    }
    _getSeriesAnalysisMap() {
      const seriesSettings = Array.isArray(this._config?.series_settings) ? this._config.series_settings : [];
      return new Map(seriesSettings.map((entry) => [entry?.entity_id, normalizeHistorySeriesAnalysis(entry?.analysis)]));
    }
    _getSeriesAnalysis(entityId, analysisMap = null) {
      const map = analysisMap || this._getSeriesAnalysisMap();
      return normalizeHistorySeriesAnalysis(map.get(entityId));
    }
    _seriesHasActiveAnalysis(analysis, hasSelectedComparisonWindow = false) {
      return analysis.show_trend_lines || analysis.show_summary_stats || analysis.show_rate_of_change || analysis.show_threshold_analysis || analysis.show_anomalies || analysis.show_delta_analysis && hasSelectedComparisonWindow;
    }
    _seriesShouldHideSource(analysis, hasSelectedComparisonWindow = false) {
      return analysis.hide_source_series === true && this._seriesHasActiveAnalysis(analysis, hasSelectedComparisonWindow);
    }
    _updateLegendLayout(legendEl) {
      if (!legendEl) {
        return;
      }
      const cardHeight = this.shadowRoot?.querySelector("ha-card")?.clientHeight || 0;
      if (this._legendWrapRows) {
        this._legendWrapRows = cardHeight >= HISTORY_LEGEND_WRAP_DISABLE_HEIGHT_PX;
      } else {
        this._legendWrapRows = cardHeight >= HISTORY_LEGEND_WRAP_ENABLE_HEIGHT_PX;
      }
      legendEl.classList.toggle("wrap-rows", this._legendWrapRows);
    }
    _setAdjustAxisButtonVisibility(visible) {
      const button = this.shadowRoot?.getElementById("chart-adjust-axis");
      if (!button) {
        return;
      }
      button.hidden = !visible;
      if (visible) {
        button.onclick = () => {
          this._adjustComparisonAxisScale = true;
          if (this._lastHistResult && this._lastEvents) {
            this._queueDrawChart(
              this._lastHistResult,
              this._lastStatsResult || {},
              this._filterEvents(this._lastEvents),
              this._lastT0,
              this._lastT1
            );
          }
        };
        return;
      }
      button.onclick = null;
    }
    _queueDrawChart(histResult, statsResult, events, t0, t1, options = {}) {
      const drawRequestId = ++this._drawRequestId;
      logger$1.log("[hass-datapoints history-card] draw queued", {
        drawRequestId,
        loading: options.loading ?? false
      });
      this._drawChart(histResult, statsResult, events, t0, t1, {
        ...options,
        drawRequestId
      }).catch((error) => {
        if (drawRequestId !== this._drawRequestId) {
          return;
        }
        console.error("[hass-datapoints history-card] draw failed", error);
        this._setChartLoading(false);
        this._setChartMessage("Failed to render chart.");
      });
    }
    _buildHistoryAnalysisPayload(visibleSeries, selectedComparisonSeriesMap, analysisMap, hasSelectedComparisonWindow, allComparisonWindowsData = {}) {
      return {
        series: visibleSeries.map((seriesItem) => ({
          entityId: seriesItem.entityId,
          pts: seriesItem.pts,
          analysis: analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null)
        })),
        comparisonSeries: Array.from(selectedComparisonSeriesMap.values()).map((seriesItem) => ({
          entityId: seriesItem.entityId,
          pts: seriesItem.pts
        })),
        hasSelectedComparisonWindow: hasSelectedComparisonWindow === true,
        allComparisonWindowsData
      };
    }
    async _computeHistoryAnalysis(visibleSeries, selectedComparisonSeriesMap, analysisMap, hasSelectedComparisonWindow, allComparisonWindowsData = {}) {
      const payload = this._buildHistoryAnalysisPayload(
        visibleSeries,
        selectedComparisonSeriesMap,
        analysisMap,
        hasSelectedComparisonWindow,
        allComparisonWindowsData
      );
      try {
        return await computeHistoryAnalysisInWorker(payload);
      } catch (error) {
        console.warn("[hass-datapoints history-card] analysis worker fallback", {
          message: error?.message || String(error)
        });
        return {
          trendSeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_trend_lines !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildTrendPoints(seriesItem.pts, analysis.trend_method, analysis.trend_window)
            };
          }).filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2).filter(Boolean),
          rateSeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_rate_of_change !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildRateOfChangePoints(seriesItem.pts, analysis.rate_window)
            };
          }).filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2).filter(Boolean),
          deltaSeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (!(analysis.show_delta_analysis === true && hasSelectedComparisonWindow === true)) {
              return null;
            }
            const comparisonSeries = selectedComparisonSeriesMap.get(seriesItem.entityId);
            return {
              entityId: seriesItem.entityId,
              pts: comparisonSeries ? this._buildDeltaPoints(seriesItem.pts, comparisonSeries.pts) : []
            };
          }).filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2).filter(Boolean),
          summaryStats: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_summary_stats !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              ...this._buildSummaryStats(seriesItem.pts)
            };
          }).filter((entry) => entry && Number.isFinite(entry.min) && Number.isFinite(entry.max) && Number.isFinite(entry.mean)),
          anomalySeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            if (analysis.show_anomalies !== true) return null;
            const clustersByMethod = {};
            const methods = analysis.anomaly_methods;
            if (methods.includes("trend_residual")) {
              const c2 = this._buildAnomalyClusters(seriesItem.pts, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);
              if (c2.length > 0) clustersByMethod.trend_residual = c2;
            }
            if (methods.includes("rate_of_change")) {
              const c2 = this._buildRateOfChangeAnomalyClusters(seriesItem.pts, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);
              if (c2.length > 0) clustersByMethod.rate_of_change = c2;
            }
            if (methods.includes("iqr")) {
              const c2 = this._buildIQRAnomalyClusters(seriesItem.pts, analysis.anomaly_sensitivity);
              if (c2.length > 0) clustersByMethod.iqr = c2;
            }
            if (methods.includes("rolling_zscore")) {
              const c2 = this._buildRollingZScoreAnomalyClusters(seriesItem.pts, analysis.anomaly_zscore_window, analysis.anomaly_sensitivity);
              if (c2.length > 0) clustersByMethod.rolling_zscore = c2;
            }
            if (methods.includes("persistence")) {
              const c2 = this._buildPersistenceAnomalyClusters(seriesItem.pts, analysis.anomaly_persistence_window, analysis.anomaly_sensitivity);
              if (c2.length > 0) clustersByMethod.persistence = c2;
            }
            if (methods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {
              const compPts = allComparisonWindowsData[analysis.anomaly_comparison_window_id]?.[seriesItem.entityId];
              if (Array.isArray(compPts) && compPts.length >= 3) {
                const c2 = this._buildComparisonWindowAnomalyClusters(seriesItem.pts, compPts, analysis.anomaly_sensitivity);
                if (c2.length > 0) clustersByMethod.comparison_window = c2;
              }
            }
            const anomalyClusters = this._applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);
            return anomalyClusters.length > 0 ? { entityId: seriesItem.entityId, anomalyClusters } : null;
          }).filter(Boolean)
        };
      }
    }
    async _drawChart(histResult, statsResult, events, t0, t1, options = {}) {
      hideTooltip(this);
      const canvas = this.shadowRoot.getElementById("chart");
      const zoomOutButton = this.shadowRoot.getElementById("chart-zoom-out");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const scrollViewport = this.shadowRoot.getElementById("chart-scroll-viewport");
      const chartStage = this.shadowRoot.getElementById("chart-stage");
      this.shadowRoot.querySelector(".card-header");
      this.shadowRoot.getElementById("legend");
      this._chartScrollViewportEl = scrollViewport;
      this._chartStageEl = chartStage;
      const series = [];
      const axes = [];
      const axisMap = /* @__PURE__ */ new Map();
      const binaryBackgrounds = [];
      const seriesSettings = this._seriesSettings;
      const analysisMap = this._getSeriesAnalysisMap();
      const comparisonResults = Array.isArray(this._lastComparisonResults) ? this._lastComparisonResults : [];
      const selectedComparisonWindowId = this._config?.selected_comparison_window_id || null;
      const hoveredComparisonWindowId = this._config?.hovered_comparison_window_id || null;
      const comparisonPreviewActive = this._comparisonWindows.length > 0;
      const delinkYAxis = this._config?.delink_y_axis === true;
      const hoveringDifferentComparison = !!hoveredComparisonWindowId && !!selectedComparisonWindowId && hoveredComparisonWindowId !== selectedComparisonWindowId;
      const hasSelectedComparisonWindow = !!selectedComparisonWindowId;
      seriesSettings.forEach((seriesSetting, i2) => {
        const entityId = seriesSetting.entity_id;
        const domain = entityId.split(".")[0];
        if (domain === "binary_sensor") {
          const stateList2 = this._buildEntityStateList(entityId, histResult, statsResult);
          const spans = this._buildBinaryStateSpans(stateList2, t0, t1);
          if (spans.length) {
            binaryBackgrounds.push({
              entityId,
              label: entityName$1(this._hass, entityId) || entityId,
              color: seriesSetting.color || COLORS[i2 % COLORS.length],
              onLabel: this._binaryOnLabel(entityId),
              offLabel: this._binaryOffLabel(entityId),
              spans
            });
          }
          return;
        }
        const stateList = this._buildEntityStateList(entityId, histResult, statsResult);
        const pts = [];
        const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
        const axisKey = delinkYAxis ? `${unit || "__unitless__"}::${entityId}` : unit || "__unitless__";
        let axis = axisMap.get(axisKey);
        if (!axis) {
          axis = {
            key: axisKey,
            unit,
            color: seriesSetting.color || COLORS[i2 % COLORS.length],
            side: axisMap.size === 0 ? "left" : "right",
            values: []
          };
          axisMap.set(axisKey, axis);
          axes.push(axis);
        }
        for (const s2 of stateList) {
          const v2 = parseFloat(s2.s);
          if (!isNaN(v2)) {
            pts.push([Math.round(s2.lu * 1e3), v2]);
            axis.values.push(v2);
          }
        }
        if (pts.length) {
          series.push({
            entityId,
            legendEntityId: entityId,
            label: entityName$1(this._hass, entityId) || entityId,
            unit,
            pts,
            color: seriesSetting.color || COLORS[i2 % COLORS.length],
            axisKey
          });
        }
      });
      for (const seriesItem of series) {
        if (!seriesItem.pts.length) {
          continue;
        }
        const lastPt = seriesItem.pts[seriesItem.pts.length - 1];
        const prev = this._previousSeriesEndpoints.get(seriesItem.entityId);
        if (!prev) {
          logger$1.log("[hass-datapoints history-card] series initial draw", {
            entityId: seriesItem.entityId,
            pointCount: seriesItem.pts.length,
            lastPt
          });
        } else if (lastPt[0] !== prev.t || lastPt[1] !== prev.v) {
          logger$1.log("[hass-datapoints history-card] series updated — live update detected", {
            entityId: seriesItem.entityId,
            pointCount: seriesItem.pts.length,
            prev,
            lastPt
          });
        } else {
          logger$1.log("[hass-datapoints history-card] series unchanged — no new data", {
            entityId: seriesItem.entityId,
            pointCount: seriesItem.pts.length,
            lastPt
          });
        }
        this._previousSeriesEndpoints.set(seriesItem.entityId, { t: lastPt[0], v: lastPt[1] });
      }
      if (!series.length && !binaryBackgrounds.length) {
        this._setAdjustAxisButtonVisibility(false);
        this._renderComparisonPreviewOverlay();
        const sameRangeAsLastDraw = Number.isFinite(this._lastT0) && Number.isFinite(this._lastT1) && this._lastT0 === t0 && this._lastT1 === t1 && Array.isArray(this._lastDrawArgs) && this._lastDrawArgs.length;
        this._setChartLoading(!!options.loading);
        this._setChartMessage(options.loading ? "" : "No numeric data in the selected time range.");
        if (sameRangeAsLastDraw) {
          return;
        }
        this._lastHistResult = histResult;
        this._lastStatsResult = statsResult;
        this._lastEvents = events;
        this._lastT0 = t0;
        this._lastT1 = t1;
        this._lastDrawArgs = [histResult, statsResult, events, t0, t1, options];
        return;
      }
      this._lastHistResult = histResult;
      this._lastStatsResult = statsResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;
      this._lastDrawArgs = [histResult, statsResult, events, t0, t1, options];
      const visibleSeries = series.filter((entry) => !this._hiddenSeries.has(entry.legendEntityId || entry.entityId));
      const selectedComparisonResult = comparisonResults.find((window2) => window2.id === selectedComparisonWindowId) || null;
      const selectedComparisonSeriesMap = /* @__PURE__ */ new Map();
      if (selectedComparisonResult) {
        for (let index = 0; index < seriesSettings.length; index += 1) {
          const seriesSetting = seriesSettings[index];
          const entityId = seriesSetting.entity_id;
          if (entityId.split(".")[0] === "binary_sensor") {
            continue;
          }
          if (this._hiddenSeries.has(entityId)) {
            continue;
          }
          const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
          const stateList = this._buildEntityStateList(entityId, selectedComparisonResult.histResult, selectedComparisonResult.statsResult || {});
          const points = [];
          for (const state of stateList) {
            const numericValue = parseFloat(state.s);
            if (!Number.isNaN(numericValue)) {
              points.push([Math.round(state.lu * 1e3) - selectedComparisonResult.time_offset_ms, numericValue]);
            }
          }
          if (!points.length) {
            continue;
          }
          selectedComparisonSeriesMap.set(entityId, {
            entityId,
            label: entityName$1(this._hass, entityId) || entityId,
            unit,
            color: seriesSetting.color || COLORS[index % COLORS.length],
            pts: points
          });
        }
      }
      const allComparisonWindowsData = {};
      for (const seriesItem of visibleSeries) {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_anomalies !== true || !analysis.anomaly_methods.includes("comparison_window") || !analysis.anomaly_comparison_window_id) {
          continue;
        }
        const windowId = analysis.anomaly_comparison_window_id;
        if (!allComparisonWindowsData[windowId]) {
          allComparisonWindowsData[windowId] = {};
        }
        if (!allComparisonWindowsData[windowId][seriesItem.entityId]) {
          const compResult = comparisonResults.find((win) => win.id === windowId);
          if (compResult) {
            seriesSettings.findIndex((s2) => s2.entity_id === seriesItem.entityId);
            const stateList = this._buildEntityStateList(seriesItem.entityId, compResult.histResult, compResult.statsResult || {});
            const pts = [];
            for (const s2 of stateList) {
              const v2 = parseFloat(s2.s);
              if (!isNaN(v2)) pts.push([Math.round(s2.lu * 1e3) - compResult.time_offset_ms, v2]);
            }
            if (pts.length) {
              allComparisonWindowsData[windowId][seriesItem.entityId] = pts;
            }
          }
        }
      }
      const analysisEntityIds = visibleSeries.filter((s2) => {
        const a2 = analysisMap.get(s2.entityId) || {};
        return a2.show_anomalies || a2.show_trend_lines || a2.show_summary_stats || a2.show_rate_of_change;
      }).map((s2) => s2.entityId);
      if (analysisEntityIds.length) {
        this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing", {
          bubbles: true,
          composed: true,
          detail: { computing: true, entityIds: analysisEntityIds }
        }));
      }
      const analysisResult = await this._computeHistoryAnalysis(
        visibleSeries,
        selectedComparisonSeriesMap,
        analysisMap,
        hasSelectedComparisonWindow,
        allComparisonWindowsData
      );
      if (analysisEntityIds.length) {
        this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing", {
          bubbles: true,
          composed: true,
          detail: { computing: false, entityIds: analysisEntityIds }
        }));
      }
      if (options.drawRequestId && options.drawRequestId !== this._drawRequestId) {
        return;
      }
      if (canvas) {
        canvas.style.display = "";
      }
      chartStage?.querySelectorAll(".split-series-row").forEach((el) => el.remove());
      chartStage?.querySelector("#chart-split-overlay")?.remove();
      const axisLeftEl = this.shadowRoot?.getElementById("chart-axis-left");
      const axisRightEl = this.shadowRoot?.getElementById("chart-axis-right");
      if (axisLeftEl) {
        axisLeftEl.style.display = "";
      }
      if (axisRightEl) {
        axisRightEl.style.display = "";
      }
      scrollViewport?.clientHeight || 0;
      let minChartHeight;
      if (series.length) {
        minChartHeight = 280;
      } else if (binaryBackgrounds.length) {
        minChartHeight = 100;
      } else {
        minChartHeight = 280;
      }
      const availableHeight = this._getAvailableChartHeight(minChartHeight);
      const viewportWidth = Math.max(scrollViewport?.clientWidth || wrap?.clientWidth || 360, 360);
      const totalSpanMs = Math.max(1, t1 - t0);
      const zoomSpanMs = this._zoomRange ? Math.max(1, this._zoomRange.end - this._zoomRange.start) : null;
      const rawZoomMultiplier = zoomSpanMs ? totalSpanMs / zoomSpanMs : 1;
      const zoomMultiplier = clampChartValue(rawZoomMultiplier, 1, HISTORY_CHART_MAX_ZOOM_MULTIPLIER);
      const canvasWidth = Math.min(
        HISTORY_CHART_MAX_CANVAS_WIDTH_PX,
        zoomSpanMs ? Math.max(viewportWidth, Math.round(viewportWidth * zoomMultiplier)) : viewportWidth
      );
      if (this._config?.split_view === true && visibleSeries.length >= 2) {
        if (zoomOutButton) {
          zoomOutButton.hidden = !this._zoomRange;
          zoomOutButton.onclick = () => this._clearZoomRange();
        }
        this._renderLegend(series, binaryBackgrounds);
        this._drawSplitChart({
          visibleSeries,
          binaryBackgrounds,
          events,
          renderT0: t0,
          renderT1: t1,
          canvasWidth,
          availableHeight,
          chartStage,
          canvas,
          wrap,
          options,
          comparisonResults,
          selectedComparisonWindowId,
          hoveredComparisonWindowId,
          comparisonPreviewActive,
          hoveringDifferentComparison,
          analysisResult,
          analysisMap,
          hasSelectedComparisonWindow
        });
        if (this._chartScrollViewportEl) {
          this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
          this._chartScrollViewportEl.addEventListener("scroll", this._onChartScroll, { passive: true });
          this._syncChartViewportScroll(t0, t1, canvasWidth);
        }
        return;
      }
      if (chartStage) {
        chartStage.style.width = `${canvasWidth}px`;
        chartStage.style.height = `${availableHeight}px`;
      }
      if (scrollViewport) {
        scrollViewport.style.overflowY = "";
      }
      const { w, h: h2 } = setupCanvas(canvas, chartStage || wrap, availableHeight, canvasWidth);
      const renderer = new ChartRenderer(canvas, w, h2);
      renderer.labelColor = resolveChartLabelColor(this);
      renderer.clear();
      const renderT0 = t0;
      const renderT1 = t1;
      const trendPointsMap = new Map((analysisResult?.trendSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const ratePointsMap = new Map((analysisResult?.rateSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const deltaPointsMap = new Map((analysisResult?.deltaSeries || []).map((entry) => [entry.entityId, entry.pts]));
      const summaryStatsMap = new Map((analysisResult?.summaryStats || []).map((entry) => [entry.entityId, entry]));
      const anomalyClustersMap = new Map((analysisResult?.anomalySeries || []).map((entry) => [entry.entityId, entry.anomalyClusters]));
      const hiddenSourceEntityIds = /* @__PURE__ */ new Set();
      const hiddenComparisonEntityIds = /* @__PURE__ */ new Set();
      visibleSeries.forEach((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (this._seriesShouldHideSource(analysis, hasSelectedComparisonWindow)) {
          hiddenSourceEntityIds.add(seriesItem.entityId);
        }
        if (analysis.hide_source_series === true && analysis.show_delta_analysis === true && hasSelectedComparisonWindow) {
          hiddenComparisonEntityIds.add(seriesItem.entityId);
        }
      });
      const anyTrendCrosshairs = visibleSeries.some((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        return analysis.show_trend_lines === true && analysis.show_trend_crosshairs === true;
      });
      this._setChartLoading(!!options.loading);
      this._setChartMessage("");
      if (zoomOutButton) {
        zoomOutButton.hidden = !this._zoomRange;
        zoomOutButton.onclick = () => this._clearZoomRange();
      }
      const comparisonAxisValues = /* @__PURE__ */ new Map();
      if (this._adjustComparisonAxisScale) {
        for (const win of comparisonResults) {
          for (const seriesSetting of seriesSettings) {
            const entityId = seriesSetting.entity_id;
            if (entityId.split(".")[0] === "binary_sensor") {
              continue;
            }
            if (this._hiddenSeries.has(entityId)) {
              continue;
            }
            const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
            const axisKey = delinkYAxis ? `${unit || "__unitless__"}::${entityId}` : unit || "__unitless__";
            const stateList = this._buildEntityStateList(entityId, win.histResult, win.statsResult || {});
            for (const state of stateList) {
              const numericValue = parseFloat(state.s);
              if (!Number.isNaN(numericValue)) {
                if (!comparisonAxisValues.has(axisKey)) {
                  comparisonAxisValues.set(axisKey, []);
                }
                comparisonAxisValues.get(axisKey).push(numericValue);
              }
            }
          }
        }
      }
      const deltaAxisMap = /* @__PURE__ */ new Map();
      const rateAxisMap = /* @__PURE__ */ new Map();
      visibleSeries.forEach((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_delta_analysis === true && hasSelectedComparisonWindow && analysis.show_delta_lines === true) {
          const deltaPoints = deltaPointsMap.get(seriesItem.entityId) || [];
          if (deltaPoints.length) {
            const axisKey = `delta:${seriesItem.axisKey}`;
            const unitLabel = seriesItem.unit ? `Δ ${seriesItem.unit}` : "Δ";
            let axis = deltaAxisMap.get(axisKey);
            if (!axis) {
              axis = {
                key: axisKey,
                unit: unitLabel,
                color: seriesItem.color,
                side: "right",
                values: []
              };
              deltaAxisMap.set(axisKey, axis);
            }
            deltaPoints.forEach((point) => {
              axis.values.push(point[1]);
            });
          }
        }
        if (analysis.show_rate_of_change === true) {
          const ratePoints = ratePointsMap.get(seriesItem.entityId) || [];
          if (ratePoints.length) {
            const axisKey = `rate:${seriesItem.axisKey}`;
            const unitLabel = seriesItem.unit ? `${seriesItem.unit}/h` : "Rate/h";
            let axis = rateAxisMap.get(axisKey);
            if (!axis) {
              axis = {
                key: axisKey,
                unit: unitLabel,
                color: seriesItem.color,
                side: "right",
                values: []
              };
              rateAxisMap.set(axisKey, axis);
            }
            ratePoints.forEach((point) => {
              axis.values.push(point[1]);
            });
          }
        }
      });
      const resolvedAxes = axes.filter((axis) => axis.values.length).map((axis) => {
        const axisValues = series.filter((entry) => entry.axisKey === axis.key).flatMap((entry) => entry.pts.map((point) => point[1]));
        if (this._adjustComparisonAxisScale && comparisonAxisValues.has(axis.key)) {
          axisValues.push(...comparisonAxisValues.get(axis.key));
        }
        const extent = this._getAxisValueExtent(axisValues);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad
        };
      }).filter(Boolean);
      const deltaResolvedAxes = Array.from(deltaAxisMap.values()).filter((axis) => axis.values.length).map((axis) => {
        const extent = this._getAxisValueExtent(axis.values);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad
        };
      }).filter(Boolean);
      const rateResolvedAxes = Array.from(rateAxisMap.values()).filter((axis) => axis.values.length).map((axis) => {
        const extent = this._getAxisValueExtent(axis.values);
        if (!extent) {
          return null;
        }
        const { min, max } = extent;
        const pad = (max - min) * 0.1 || 1;
        return {
          key: axis.key,
          unit: axis.unit,
          color: axis.color,
          side: axis.side,
          min: min - pad,
          max: max + pad
        };
      }).filter(Boolean);
      const gridAxes = resolvedAxes.length || deltaResolvedAxes.length ? [...resolvedAxes, ...deltaResolvedAxes, ...rateResolvedAxes] : [{ key: "binary", min: 0, max: 1, side: "left", unit: "", color: null }];
      renderer.drawGrid(renderT0, renderT1, gridAxes, void 0, 5, { fixedAxisOverlay: true });
      this._renderComparisonPreviewOverlay(renderer);
      const activeAxes = resolvedAxes.length ? renderer._activeAxes || [] : [];
      const axisLookup = new Map(activeAxes.map((axis) => [axis.key, axis]));
      series.forEach((s2) => {
        s2.axis = axisLookup.get(s2.axisKey) || activeAxes[0] || resolvedAxes[0];
      });
      renderChartAxisOverlays(this, renderer, activeAxes);
      binaryBackgrounds.forEach((binaryBackground) => {
        if (binaryBackground?.spans?.length && !this._hiddenSeries.has(binaryBackground.entityId)) {
          renderer.drawStateBands(binaryBackground.spans, renderT0, renderT1, binaryBackground.color, 0.12);
        }
      });
      if (this._config?.show_correlated_anomalies === true) {
        const correlatedSpans = this._buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, analysisMap);
        if (correlatedSpans.length) {
          renderer.drawStateBands(correlatedSpans, renderT0, renderT1, "#ef4444", 0.1);
        }
      }
      let comparisonOutOfBounds = false;
      let mainSeriesHoverOpacity;
      if (!comparisonPreviewActive) {
        mainSeriesHoverOpacity = 1;
      } else if (hoveringDifferentComparison) {
        mainSeriesHoverOpacity = 0.15;
      } else {
        mainSeriesHoverOpacity = 0.25;
      }
      const anyHiddenSourceSeries = hiddenSourceEntityIds.size > 0;
      const hoverSeries = visibleSeries.filter((seriesItem) => !hiddenSourceEntityIds.has(seriesItem.entityId)).map((seriesItem) => ({
        ...seriesItem,
        hoverOpacity: mainSeriesHoverOpacity
      }));
      const summaryHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_summary_stats !== true) {
          return [];
        }
        const stats = summaryStatsMap.get(seriesItem.entityId) || null;
        if (!stats) {
          return [];
        }
        return [
          {
            entityId: `summary:min:${seriesItem.entityId}`,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            baseLabel: seriesItem.label,
            unit: seriesItem.unit || "",
            value: stats.min,
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.94 : 0.78),
            baseColor: seriesItem.color,
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
            summaryType: "min",
            summary: true
          },
          {
            entityId: `summary:mean:${seriesItem.entityId}`,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            baseLabel: seriesItem.label,
            unit: seriesItem.unit || "",
            value: stats.mean,
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.94 : 0.78),
            baseColor: seriesItem.color,
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
            summaryType: "mean",
            summary: true
          },
          {
            entityId: `summary:max:${seriesItem.entityId}`,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            baseLabel: seriesItem.label,
            unit: seriesItem.unit || "",
            value: stats.max,
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.94 : 0.78),
            baseColor: seriesItem.color,
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.94 : 0.72,
            summaryType: "max",
            summary: true
          }
        ];
      });
      const thresholdHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_threshold_analysis !== true) {
          return [];
        }
        const rawThreshold = analysis.threshold_value;
        const thresholdValue = Number(rawThreshold);
        if (!Number.isFinite(thresholdValue)) {
          return [];
        }
        return [{
          entityId: `threshold:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          value: thresholdValue,
          baseColor: seriesItem.color,
          color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.82 : 0.46),
          axis: seriesItem.axis,
          hoverOpacity: anyHiddenSourceSeries ? 0.84 : 0.48,
          direction: analysis.threshold_direction === "below" ? "below" : "above",
          threshold: true
        }];
      });
      const trendSeries = visibleSeries.map((seriesItem) => ({
        ...seriesItem,
        trendPts: trendPointsMap.get(seriesItem.entityId) || []
      })).filter((seriesItem) => Array.isArray(seriesItem.trendPts) && seriesItem.trendPts.length >= 2);
      const rateSeries = visibleSeries.map((seriesItem) => {
        const ratePoints = ratePointsMap.get(seriesItem.entityId) || [];
        if (!Array.isArray(ratePoints) || ratePoints.length < 2) {
          return null;
        }
        const axis = axisLookup.get(`rate:${seriesItem.axisKey}`);
        if (!axis) {
          return null;
        }
        return {
          ...seriesItem,
          ratePts: ratePoints,
          rateAxis: axis
        };
      }).filter(Boolean);
      const anomalySeries = visibleSeries.map((seriesItem) => {
        const anomalyClusters = anomalyClustersMap.get(seriesItem.entityId) || [];
        if (!Array.isArray(anomalyClusters) || anomalyClusters.length === 0) {
          return null;
        }
        return {
          ...seriesItem,
          anomalyClusters
        };
      }).filter(Boolean);
      const comparisonHoverSeries = [];
      const deltaHoverSeries = [];
      for (const win of comparisonResults) {
        for (const seriesSetting of seriesSettings) {
          const entityId = seriesSetting.entity_id;
          if (entityId.split(".")[0] === "binary_sensor") continue;
          if (this._hiddenSeries.has(entityId)) continue;
          const stateList = this._buildEntityStateList(entityId, win.histResult, win.statsResult || {});
          const winPts = [];
          for (const s2 of stateList) {
            const v2 = parseFloat(s2.s);
            if (!isNaN(v2)) {
              winPts.push([Math.round(s2.lu * 1e3) - win.time_offset_ms, v2]);
            }
          }
          if (!winPts.length) continue;
          const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
          const axisKey = delinkYAxis ? `${unit || "__unitless__"}::${entityId}` : unit || "__unitless__";
          const axis = axisLookup.get(axisKey);
          if (!axis) continue;
          if (!this._adjustComparisonAxisScale) {
            const hasOutOfBoundsPoint = winPts.some((point) => point[1] < axis.min || point[1] > axis.max);
            if (hasOutOfBoundsPoint) {
              comparisonOutOfBounds = true;
            }
          }
          const baseColor = seriesSetting.color || COLORS[seriesSettings.indexOf(seriesSetting) % COLORS.length];
          const isHoveredComparison = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelectedComparison = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          let comparisonLineOpacity;
          if (isHoveredComparison) {
            comparisonLineOpacity = 0.85;
          } else if (hoveringDifferentComparison && isSelectedComparison) {
            comparisonLineOpacity = 0.25;
          } else {
            comparisonLineOpacity = 0.85;
          }
          comparisonHoverSeries.push({
            entityId: `${win.id}:${entityId}`,
            relatedEntityId: entityId,
            label: seriesSetting.label || entityName$1(this._hass, entityId) || entityId,
            windowLabel: win.label || "Date window",
            unit,
            pts: winPts,
            color: baseColor,
            axis,
            hoverOpacity: comparisonLineOpacity
          });
          if (!hiddenComparisonEntityIds.has(entityId)) {
            renderer.drawLine(winPts, baseColor, renderT0, renderT1, axis.min, axis.max, {
              lineOpacity: comparisonLineOpacity,
              lineWidth: hoveringDifferentComparison && isSelectedComparison ? 1.25 : void 0
            });
          }
        }
      }
      this._setAdjustAxisButtonVisibility(comparisonPreviewActive && comparisonOutOfBounds && !this._adjustComparisonAxisScale);
      for (const s2 of visibleSeries) {
        if (hiddenSourceEntityIds.has(s2.entityId)) {
          continue;
        }
        this._drawSeriesLine(renderer, s2.pts, s2.color, renderT0, renderT1, s2.axis.min, s2.axis.max, {
          lineOpacity: mainSeriesHoverOpacity,
          lineWidth: this._config?.comparison_hover_active === true ? 1.25 : void 0
        });
      }
      const trendHoverSeries = trendSeries.map((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        const hiddenSource = hiddenSourceEntityIds.has(seriesItem.entityId);
        const trendRenderOptions = this._getTrendRenderOptions(analysis.trend_method, hiddenSource);
        return {
          entityId: `trend:${seriesItem.entityId}`,
          relatedEntityId: seriesItem.entityId,
          label: seriesItem.label,
          baseLabel: seriesItem.label,
          unit: seriesItem.unit || "",
          pts: seriesItem.trendPts,
          color: hexToRgba(seriesItem.color, trendRenderOptions.colorAlpha),
          axis: seriesItem.axis,
          rawVisible: !hiddenSource,
          showCrosshair: analysis.show_trend_crosshairs === true,
          hoverOpacity: comparisonPreviewActive ? Math.max(0.25, Math.min(0.9, mainSeriesHoverOpacity + 0.12)) : trendRenderOptions.lineOpacity,
          trend: true
        };
      });
      const rateHoverSeries = rateSeries.map((seriesItem) => ({
        entityId: `rate:${seriesItem.entityId}`,
        relatedEntityId: seriesItem.entityId,
        label: seriesItem.label,
        baseLabel: seriesItem.label,
        unit: seriesItem.unit ? `${seriesItem.unit}/h` : "/h",
        pts: seriesItem.ratePts,
        color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.9 : 0.72),
        axis: seriesItem.rateAxis,
        rawVisible: !hiddenSourceEntityIds.has(seriesItem.entityId),
        hoverOpacity: anyHiddenSourceSeries ? 0.88 : 0.66,
        rate: true
      }));
      for (const trend of trendSeries) {
        const analysis = analysisMap.get(trend.entityId) || normalizeHistorySeriesAnalysis(null);
        const trendRenderOptions = this._getTrendRenderOptions(
          analysis.trend_method,
          hiddenSourceEntityIds.has(trend.entityId)
        );
        renderer.drawLine(
          trend.trendPts,
          hexToRgba(trend.color, trendRenderOptions.colorAlpha),
          renderT0,
          renderT1,
          trend.axis.min,
          trend.axis.max,
          {
            lineOpacity: comparisonPreviewActive ? Math.max(0.25, Math.min(0.9, mainSeriesHoverOpacity + 0.12)) : trendRenderOptions.lineOpacity,
            lineWidth: trendRenderOptions.lineWidth,
            dashed: trendRenderOptions.dashed,
            dotted: trendRenderOptions.dotted
          }
        );
      }
      for (const rateSeriesItem of rateSeries) {
        renderer.drawLine(
          rateSeriesItem.ratePts,
          hexToRgba(rateSeriesItem.color, anyHiddenSourceSeries ? 0.96 : 0.82),
          renderT0,
          renderT1,
          rateSeriesItem.rateAxis.min,
          rateSeriesItem.rateAxis.max,
          {
            lineOpacity: anyHiddenSourceSeries ? 0.88 : 0.66,
            lineWidth: 1.55,
            dashed: false,
            dotted: false,
            dashPattern: [7, 3, 1.5, 3]
          }
        );
      }
      for (const seriesItem of visibleSeries) {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (!(analysis.show_delta_analysis === true && hasSelectedComparisonWindow === true)) {
          continue;
        }
        const deltaAxis = axisLookup.get(`delta:${seriesItem.axisKey}`);
        if (!deltaAxis) {
          continue;
        }
        const deltaPoints = deltaPointsMap.get(seriesItem.entityId) || [];
        if (!deltaPoints.length) {
          continue;
        }
        if (analysis.show_delta_tooltip === true) {
          deltaHoverSeries.push({
            entityId: `delta:${seriesItem.entityId}`,
            relatedEntityId: seriesItem.entityId,
            label: seriesItem.label,
            baseLabel: seriesItem.label,
            unit: seriesItem.unit || "",
            pts: deltaPoints,
            color: hexToRgba(seriesItem.color, 0.92),
            axis: deltaAxis,
            rawVisible: !hiddenSourceEntityIds.has(seriesItem.entityId),
            hoverOpacity: 0.82,
            delta: true
          });
        }
        if (analysis.show_delta_lines === true) {
          renderer.drawLine(
            deltaPoints,
            hexToRgba(seriesItem.color, 0.92),
            renderT0,
            renderT1,
            deltaAxis.min,
            deltaAxis.max,
            {
              lineOpacity: 0.82,
              lineWidth: 1.9,
              dashed: true
            }
          );
        }
      }
      visibleSeries.forEach((seriesItem) => {
        const shadingAnalysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (shadingAnalysis.show_summary_stats !== true || shadingAnalysis.show_summary_stats_shading !== true) {
          return;
        }
        const stats = summaryStatsMap.get(seriesItem.entityId);
        const axis = seriesItem.axis;
        if (!stats || !axis) {
          return;
        }
        if (!Number.isFinite(stats.min) || !Number.isFinite(stats.max) || !Number.isFinite(stats.mean)) {
          return;
        }
        const fillAlpha = anyHiddenSourceSeries ? 0.1 : 0.06;
        renderer.drawGradientBand(stats.min, stats.mean, seriesItem.color, renderT0, renderT1, axis.min, axis.max, { fillAlpha });
        renderer.drawGradientBand(stats.max, stats.mean, seriesItem.color, renderT0, renderT1, axis.min, axis.max, { fillAlpha });
      });
      summaryHoverSeries.forEach((summarySeries) => {
        const axis = summarySeries.axis;
        if (!axis) {
          return;
        }
        renderer.drawLine(
          [[renderT0, summarySeries.value], [renderT1, summarySeries.value]],
          summarySeries.color,
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          {
            lineOpacity: summarySeries.hoverOpacity,
            lineWidth: 1.8,
            dashed: false,
            dotted: false
          }
        );
      });
      thresholdHoverSeries.forEach((thresholdSeries) => {
        const axis = thresholdSeries.axis;
        if (!axis) {
          return;
        }
        const thresholdAnalysis = analysisMap.get(thresholdSeries.relatedEntityId) || normalizeHistorySeriesAnalysis(null);
        if (thresholdAnalysis.show_threshold_shading === true) {
          const relatedSeries = visibleSeries.find((seriesItem) => seriesItem.entityId === thresholdSeries.relatedEntityId);
          if (relatedSeries?.pts?.length) {
            renderer.drawThresholdArea(
              relatedSeries.pts,
              thresholdSeries.value,
              thresholdSeries.baseColor || relatedSeries.color,
              renderT0,
              renderT1,
              axis.min,
              axis.max,
              {
                mode: thresholdSeries.direction === "below" ? "below" : "above",
                fillAlpha: anyHiddenSourceSeries ? 0.24 : 0.14
              }
            );
          }
        }
        renderer.drawLine(
          [[renderT0, thresholdSeries.value], [renderT1, thresholdSeries.value]],
          thresholdSeries.color,
          renderT0,
          renderT1,
          axis.min,
          axis.max,
          {
            lineOpacity: thresholdSeries.hoverOpacity,
            lineWidth: 1.15
          }
        );
      });
      if (anomalySeries.length) {
        const anomalyRegions = [];
        anomalySeries.forEach((seriesItem) => {
          const axis = seriesItem.axis;
          if (!axis) {
            return;
          }
          const visibleAnomalyClusters = this._filterAnnotatedAnomalyClusters(seriesItem, events);
          if (visibleAnomalyClusters.length === 0) {
            return;
          }
          const normalClusters = visibleAnomalyClusters.filter((c2) => !c2.isOverlap);
          const overlapClusters = visibleAnomalyClusters.filter((c2) => c2.isOverlap === true);
          const baseColor = hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.96 : 0.86);
          const regionOptions = {
            strokeAlpha: anyHiddenSourceSeries ? 0.98 : 0.9,
            lineWidth: anyHiddenSourceSeries ? 2.5 : 2.1,
            haloWidth: anyHiddenSourceSeries ? 5.5 : 4.8,
            haloColor: "rgba(255,255,255,0.88)",
            haloAlpha: anyHiddenSourceSeries ? 0.92 : 0.82,
            fillColor: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.14 : 0.1),
            fillAlpha: 1,
            pointPadding: anyHiddenSourceSeries ? 12 : 10,
            minRadiusX: 10,
            minRadiusY: 10
          };
          const overlapOptions = {
            strokeAlpha: 0.98,
            lineWidth: 2.8,
            haloWidth: 7,
            haloColor: "rgba(232,160,32,0.22)",
            haloAlpha: 1,
            fillColor: "rgba(232,160,32,0.1)",
            fillAlpha: 1,
            pointPadding: anyHiddenSourceSeries ? 15 : 13,
            minRadiusX: 12,
            minRadiusY: 12
          };
          const overlapAccentColor = "rgba(232,160,32,0.94)";
          if (normalClusters.length > 0) {
            renderer.drawAnomalyClusters(normalClusters, baseColor, renderT0, renderT1, axis.min, axis.max, regionOptions);
          }
          if (overlapClusters.length > 0) {
            const overlapMode = (analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null)).anomaly_overlap_mode;
            renderer.drawAnomalyClusters(overlapClusters, baseColor, renderT0, renderT1, axis.min, axis.max, regionOptions);
            if (overlapMode !== "only") {
              renderer.drawAnomalyClusters(overlapClusters, overlapAccentColor, renderT0, renderT1, axis.min, axis.max, overlapOptions);
            }
          }
          const allRegionClusters = [...normalClusters, ...overlapClusters];
          const clusterRegions = renderer.getAnomalyClusterRegions(
            allRegionClusters,
            renderT0,
            renderT1,
            axis.min,
            axis.max,
            regionOptions
          );
          clusterRegions.forEach((region) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
            anomalyRegions.push({
              ...region,
              relatedEntityId: seriesItem.entityId,
              label: seriesItem.label,
              unit: seriesItem.unit || "",
              color: seriesItem.color,
              sensitivity: analysis.anomaly_sensitivity
            });
          });
        });
        this._lastAnomalyRegions = anomalyRegions;
      } else {
        this._lastAnomalyRegions = [];
      }
      const effectiveComparisonHoverSeries = comparisonHoverSeries.filter((entry) => !hiddenComparisonEntityIds.has(entry.relatedEntityId || entry.entityId));
      renderer.drawAnnotations(events, renderT0, renderT1, {
        showLines: this._config.show_event_lines !== false,
        showMarkers: this._config.show_event_lines !== false
      });
      const eventHits = this._drawRecordedEventPoints(
        renderer,
        visibleSeries,
        events,
        renderT0,
        renderT1,
        { showIcons: this._config.show_event_markers !== false }
      );
      this._renderLegend(series, binaryBackgrounds);
      const eventValueMap = new Map(eventHits.map((hit) => [hit.event.id, hit]));
      const enrichedEvents = events.map((event) => {
        const hit = eventValueMap.get(event.id);
        return hit ? {
          ...event,
          chart_value: hit.value,
          chart_unit: hit.unit
        } : event;
      });
      if (visibleSeries.length) {
        this._ensureContextAnnotationDialog();
        attachLineChartHover(this, canvas, renderer, hoverSeries, enrichedEvents, renderT0, renderT1, null, null, activeAxes, {
          onContextMenu: (hover) => this._handleChartContextMenu(hover),
          onAddAnnotation: (hover) => this._handleChartAddAnnotation(hover),
          binaryStates: binaryBackgrounds.filter((entry) => !this._hiddenSeries.has(entry.entityId)),
          comparisonSeries: effectiveComparisonHoverSeries,
          trendSeries: trendHoverSeries,
          rateSeries: rateHoverSeries,
          deltaSeries: deltaHoverSeries,
          summarySeries: summaryHoverSeries,
          thresholdSeries: thresholdHoverSeries,
          anomalyRegions: Array.isArray(this._lastAnomalyRegions) ? this._lastAnomalyRegions : [],
          hoverSurfaceEl: this.shadowRoot?.getElementById("chart-icon-overlay"),
          showTooltip: this._config.show_tooltips !== false,
          emphasizeHoverGuides: this._config.emphasize_hover_guides === true,
          showTrendCrosshairs: anyTrendCrosshairs,
          hideRawData: hiddenSourceEntityIds.size === visibleSeries.length && visibleSeries.length > 0,
          showDeltaTooltip: deltaHoverSeries.length > 0,
          onAnomalyClick: (regions) => this._handleAnomalyAddAnnotation(regions)
        });
        attachLineChartRangeZoom(this, canvas, renderer, renderT0, renderT1, {
          onPreview: (range) => this._dispatchZoomPreview(range),
          onZoom: ({ startTime, endTime }) => this._applyZoomRange(startTime, endTime),
          onReset: () => this._clearZoomRange()
        });
      } else {
        if (this._chartHoverCleanup) {
          this._chartHoverCleanup();
          this._chartHoverCleanup = null;
        }
        if (this._chartZoomCleanup) {
          this._chartZoomCleanup();
          this._chartZoomCleanup = null;
        }
      }
      if (this._chartScrollViewportEl) {
        this._chartScrollViewportEl.removeEventListener("scroll", this._onChartScroll);
        this._chartScrollViewportEl.addEventListener("scroll", this._onChartScroll, { passive: true });
        this._syncChartViewportScroll(t0, t1, w);
      }
    }
    async _handleChartContextMenu(hover) {
      if (!hover || !this._hass || this._annotationDialog?.isOpen()) {
        return;
      }
      this._openContextAnnotationDialog(hover);
    }
    _handleChartAddAnnotation(hover) {
      if (!hover || !this._hass || this._annotationDialog?.isOpen()) {
        return;
      }
      this._openContextAnnotationDialog(hover);
    }
    _handleAnomalyAddAnnotation(regions) {
      let regionsArray;
      if (Array.isArray(regions)) {
        regionsArray = regions;
      } else if (regions) {
        regionsArray = [regions];
      } else {
        regionsArray = [];
      }
      if (!regionsArray.length || !this._hass || this._annotationDialog?.isOpen()) {
        return;
      }
      const hover = this._buildAnomalyAnnotationPrefill(regionsArray);
      if (!hover) {
        return;
      }
      this._openContextAnnotationDialog(hover);
    }
    _formatContextDialogDate(timeMs) {
      return this._annotationDialog?.formatDate(timeMs) || "";
    }
    _formatAnomalyPrefillTimestamp(timeMs) {
      if (!Number.isFinite(timeMs)) {
        return "";
      }
      return new Date(timeMs).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    _formatAnomalyPrefillValue(value, unit = "") {
      if (!Number.isFinite(value)) {
        return "";
      }
      const numeric = Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
      return unit ? `${numeric} ${unit}` : numeric;
    }
    _buildCorrelatedAnomalySpans(visibleSeries, anomalyClustersMap, analysisMap) {
      const seriesIntervals = [];
      for (const seriesItem of visibleSeries) {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis(null);
        if (analysis.show_anomalies !== true) continue;
        const clusters = anomalyClustersMap.get(seriesItem.entityId) || [];
        if (!clusters.length) continue;
        const pts = seriesItem.pts;
        let tolerance = 6e4;
        if (Array.isArray(pts) && pts.length >= 2) {
          const intervals = [];
          for (let i2 = 1; i2 < pts.length; i2++) {
            const diff = pts[i2][0] - pts[i2 - 1][0];
            if (diff > 0) intervals.push(diff);
          }
          if (intervals.length) {
            intervals.sort((a2, b2) => a2 - b2);
            const mid = Math.floor(intervals.length / 2);
            tolerance = intervals.length % 2 === 0 ? (intervals[mid - 1] + intervals[mid]) / 2 : intervals[mid];
            tolerance = Math.max(tolerance, 1e3);
          }
        }
        const entityIntervals = [];
        for (const cluster of clusters) {
          const range = this._getAnomalyClusterTimeRange(cluster);
          if (!range) continue;
          entityIntervals.push({ start: range.startTime - tolerance, end: range.endTime + tolerance });
        }
        if (entityIntervals.length) {
          seriesIntervals.push({ entityId: seriesItem.entityId, intervals: entityIntervals });
        }
      }
      if (seriesIntervals.length < 2) return [];
      const events = [];
      for (const { entityId, intervals } of seriesIntervals) {
        for (const { start, end } of intervals) {
          events.push({ time: start, delta: 1, entityId });
          events.push({ time: end, delta: -1, entityId });
        }
      }
      events.sort((a2, b2) => a2.time - b2.time || a2.delta - b2.delta);
      const activeCounts = /* @__PURE__ */ new Map();
      const spans = [];
      let spanStart = null;
      for (const event of events) {
        const prev = activeCounts.get(event.entityId) || 0;
        const next = prev + event.delta;
        if (next <= 0) {
          activeCounts.delete(event.entityId);
        } else {
          activeCounts.set(event.entityId, next);
        }
        const activeCount = activeCounts.size;
        if (spanStart === null && activeCount >= 2) {
          spanStart = event.time;
        } else if (spanStart !== null && activeCount < 2) {
          spans.push({ start: spanStart, end: event.time });
          spanStart = null;
        }
      }
      if (spanStart !== null) {
        spans.push({ start: spanStart, end: events[events.length - 1].time });
      }
      return spans;
    }
    _getAnomalyClusterTimeRange(cluster) {
      if (!Array.isArray(cluster?.points) || cluster.points.length === 0) {
        return null;
      }
      const startTime = cluster.points[0]?.timeMs;
      const endTime = cluster.points[cluster.points.length - 1]?.timeMs;
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
        return null;
      }
      return {
        startTime: Math.min(startTime, endTime),
        endTime: Math.max(startTime, endTime)
      };
    }
    _eventMatchesAnomalyCluster(event, relatedEntityId, cluster) {
      if (!event || !relatedEntityId) {
        return false;
      }
      const clusterRange = this._getAnomalyClusterTimeRange(cluster);
      if (!clusterRange) {
        return false;
      }
      const eventEntityIds = Array.isArray(event.entity_ids) ? event.entity_ids.filter(Boolean) : [];
      if (!eventEntityIds.includes(relatedEntityId)) {
        return false;
      }
      const eventTime = new Date(event.timestamp).getTime();
      if (!Number.isFinite(eventTime)) {
        return false;
      }
      return eventTime >= clusterRange.startTime && eventTime <= clusterRange.endTime;
    }
    _filterAnnotatedAnomalyClusters(seriesItem, events) {
      if (!Array.isArray(seriesItem?.anomalyClusters) || seriesItem.anomalyClusters.length === 0) {
        return [];
      }
      const visibleEvents = Array.isArray(events) ? events : [];
      if (visibleEvents.length === 0) {
        return seriesItem.anomalyClusters;
      }
      return seriesItem.anomalyClusters.filter((cluster) => !visibleEvents.some((event) => this._eventMatchesAnomalyCluster(event, seriesItem.entityId, cluster)));
    }
    _buildAnomalyAnnotationPrefill(regions) {
      let regionsArray;
      if (Array.isArray(regions)) {
        regionsArray = regions;
      } else if (regions) {
        regionsArray = [regions];
      } else {
        regionsArray = [];
      }
      const validRegions = regionsArray.filter((r2) => r2?.cluster?.points?.length > 0);
      if (!validRegions.length) return null;
      const primaryRegion = validRegions[0];
      const label = primaryRegion.label || primaryRegion.relatedEntityId || "Series";
      const unit = primaryRegion.unit || "";
      const trackedEntityIds = Array.isArray(this._entityIds) ? this._entityIds.filter(Boolean) : [];
      const linkedEntityIds = [
        primaryRegion.relatedEntityId,
        ...trackedEntityIds.filter((entityId) => entityId && entityId !== primaryRegion.relatedEntityId)
      ].filter((entityId, index, values) => values.indexOf(entityId) === index);
      const ANOMALY_METHOD_LABELS2 = {
        trend_residual: "Trend deviation",
        rate_of_change: "Sudden change",
        iqr: "Statistical outlier (IQR)",
        rolling_zscore: "Rolling Z-score",
        persistence: "Flat-line / stuck",
        comparison_window: "Comparison window"
      };
      const annotationSections = validRegions.map((region) => {
        const points = region.cluster.points;
        const startPoint = points[0];
        const endPoint = points[points.length - 1];
        const peakPoint = points.reduce((peak, p2) => !peak || Math.abs(p2.residual) > Math.abs(peak.residual) ? p2 : peak, null);
        if (!peakPoint) return null;
        const method = region.cluster.anomalyMethod;
        const methodLabel = ANOMALY_METHOD_LABELS2[method] || method || "Anomaly";
        const regionLabel = region.label || region.relatedEntityId || "Series";
        const regionUnit = region.unit || "";
        let description;
        let alertLine;
        if (method === "rate_of_change") {
          const rateUnit = regionUnit ? `${regionUnit}/h` : "units/h";
          description = `${regionLabel} shows an unusual rate of change between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
          alertLine = `Peak rate deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, rateUnit)} from typical ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, rateUnit)}.`;
        } else if (method === "iqr") {
          description = `${regionLabel} contains statistical outliers between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
          alertLine = `Peak value: ${this._formatAnomalyPrefillValue(peakPoint.value, regionUnit)}, deviating ${this._formatAnomalyPrefillValue(Math.abs(peakPoint.residual), regionUnit)} from median.`;
        } else if (method === "rolling_zscore") {
          description = `${regionLabel} shows statistically unusual values between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
          alertLine = `Peak deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} from rolling mean of ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)}.`;
        } else if (method === "persistence") {
          const flatRange = typeof region.cluster.flatRange === "number" ? region.cluster.flatRange : null;
          const rangeStr = flatRange !== null ? ` (range: ${this._formatAnomalyPrefillValue(flatRange, regionUnit)})` : "";
          description = `${regionLabel} appears stuck or flat between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}${rangeStr}.`;
          alertLine = `Value remained near ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)} for an unusually long period.`;
        } else if (method === "comparison_window") {
          description = `${regionLabel} deviates from the comparison window between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
          alertLine = `Peak deviation from comparison: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} at ${this._formatAnomalyPrefillTimestamp(peakPoint.timeMs)}.`;
        } else {
          description = `${regionLabel} deviates from its expected trend between ${this._formatAnomalyPrefillTimestamp(startPoint.timeMs)} and ${this._formatAnomalyPrefillTimestamp(endPoint.timeMs)}.`;
          alertLine = `Peak deviation: ${this._formatAnomalyPrefillValue(peakPoint.residual, regionUnit)} from baseline of ${this._formatAnomalyPrefillValue(peakPoint.baselineValue, regionUnit)} at ${this._formatAnomalyPrefillTimestamp(peakPoint.timeMs)}.`;
        }
        return { methodLabel, description, alertLine, peakPoint };
      }).filter(Boolean);
      if (!annotationSections.length) return null;
      const isSingleRegion = annotationSections.length === 1;
      let detectedByMethods;
      if (!isSingleRegion) {
        detectedByMethods = null;
      } else if (Array.isArray(primaryRegion.cluster?.detectedByMethods) && primaryRegion.cluster.detectedByMethods.length > 1) {
        detectedByMethods = primaryRegion.cluster.detectedByMethods;
      } else {
        detectedByMethods = null;
      }
      let message;
      let annotation;
      if (isSingleRegion) {
        const s2 = annotationSections[0];
        const peakPoint = s2.peakPoint;
        message = `${this._formatAnomalyPrefillValue(peakPoint.residual, unit)} ${s2.methodLabel.toLowerCase()} anomaly in ${label}`;
        const lines = [s2.description, `Alert: ${s2.alertLine}`];
        if (detectedByMethods) {
          lines.push(`Confirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m2) => ANOMALY_METHOD_LABELS2[m2] || m2).join(", ")}.`);
        }
        lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c2) => c2.toUpperCase())}.`);
        annotation = lines.join("\n");
      } else {
        message = `Multi-method anomaly in ${label}`;
        const lines = [];
        annotationSections.forEach((s2) => {
          lines.push(`[${s2.methodLabel}]`);
          lines.push(s2.description);
          lines.push(`Alert: ${s2.alertLine}`);
          lines.push("");
        });
        lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c2) => c2.toUpperCase())}.`);
        annotation = lines.join("\n").trim();
      }
      const allStartPoints = validRegions.map((r2) => r2.cluster.points[0]?.timeMs).filter(Number.isFinite);
      const timeMs = allStartPoints.length ? Math.min(...allStartPoints) : primaryRegion.cluster.points[0].timeMs;
      return {
        timeMs,
        primary: {
          color: primaryRegion.color || "#03a9f4"
        },
        annotationPrefill: {
          message,
          annotation,
          icon: "mdi:alert-outline",
          color: primaryRegion.color || "#03a9f4",
          linkedTarget: {
            entity_id: linkedEntityIds
          }
        }
      };
    }
    _ensureContextAnnotationDialog() {
      this._annotationDialog?.ensureDialog();
    }
    _teardownContextAnnotationDialog() {
      this._annotationDialog?.teardown();
    }
    _cleanupContextAnnotationForm() {
      this._annotationDialog?.resetFormState();
    }
    _finalizeContextAnnotationDialogClose() {
      this._annotationDialog?.finalizeClose();
    }
    _renderContextAnnotationTargetChips(target) {
      return this._annotationDialog?.renderTargetChips(target) || "";
    }
    _normalizeTargetSelection(target) {
      return normalizeTargetSelection(target);
    }
    _mergeTargetSelections(...targets) {
      return mergeTargetSelections(...targets);
    }
    _removeContextDialogLinkedTarget(type, id) {
      this._annotationDialog?.removeLinkedTarget(type, id);
    }
    _bindContextAnnotationTargetChipActions() {
      this._annotationDialog?.bindTargetChipActions();
    }
    _bindContextAnnotationDialogFields(hover) {
      this._annotationDialog?.bindFields(hover);
    }
    async _submitContextAnnotationDialog() {
      return this._annotationDialog?.submit();
    }
    _openContextAnnotationDialog(hover) {
      this._annotationDialog?.open(hover);
    }
    _closeContextAnnotationDialog() {
      this._annotationDialog?.close();
    }
    _getScrollViewportRange(t0 = this._lastT0, t1 = this._lastT1) {
      if (!this._chartScrollViewportEl || !this._chartStageEl || t0 == null || t1 == null) {
        return null;
      }
      const viewportWidth = this._chartScrollViewportEl.clientWidth;
      const contentWidth = this._chartStageEl.clientWidth;
      if (!viewportWidth || !contentWidth) {
        return null;
      }
      const totalMs = Math.max(1, t1 - t0);
      const visibleSpanMs = totalMs * Math.min(1, viewportWidth / contentWidth);
      const maxScrollLeft = Math.max(0, contentWidth - viewportWidth);
      const maxStartOffsetMs = Math.max(0, totalMs - visibleSpanMs);
      const ratio = maxScrollLeft > 0 ? clampChartValue(this._chartScrollViewportEl.scrollLeft / maxScrollLeft, 0, 1) : 0;
      const start = t0 + ratio * maxStartOffsetMs;
      return {
        start,
        end: start + visibleSpanMs,
        span: visibleSpanMs,
        maxScrollLeft
      };
    }
    _syncChartViewportScroll(t0, t1, contentWidth) {
      if (!this._chartScrollViewportEl || !this._zoomRange) {
        return;
      }
      this._chartStageEl = this.shadowRoot.getElementById("chart-stage");
      const viewportWidth = this._chartScrollViewportEl.clientWidth;
      const totalMs = Math.max(1, t1 - t0);
      const visibleSpanMs = totalMs * Math.min(1, viewportWidth / Math.max(contentWidth, viewportWidth));
      const maxScrollLeft = Math.max(0, Math.max(contentWidth, viewportWidth) - viewportWidth);
      const maxStartOffsetMs = Math.max(0, totalMs - visibleSpanMs);
      const clampedStart = clampChartValue(this._zoomRange.start, t0, t1 - visibleSpanMs);
      const ratio = maxStartOffsetMs > 0 ? (clampedStart - t0) / maxStartOffsetMs : 0;
      const nextLeft = ratio * maxScrollLeft;
      this._scrollSyncSuspended = true;
      this._lastProgrammaticScrollLeft = nextLeft;
      this._ignoreNextProgrammaticScrollEvent = true;
      this._chartScrollViewportEl.scrollLeft = nextLeft;
      window.requestAnimationFrame(() => {
        this._scrollSyncSuspended = false;
      });
    }
    _handleChartScroll() {
      if (this._scrollSyncSuspended || !this._zoomRange) {
        return;
      }
      if (this._ignoreNextProgrammaticScrollEvent) {
        this._ignoreNextProgrammaticScrollEvent = false;
        this._lastProgrammaticScrollLeft = null;
        return;
      }
      if (this._lastProgrammaticScrollLeft != null && Math.abs((this._chartScrollViewportEl?.scrollLeft || 0) - this._lastProgrammaticScrollLeft) < 1) {
        this._lastProgrammaticScrollLeft = null;
        return;
      }
      this._lastProgrammaticScrollLeft = null;
      const nextRange = this._getScrollViewportRange();
      if (!nextRange) {
        return;
      }
      if (this._zoomRange.start === nextRange.start && this._zoomRange.end === nextRange.end) {
        return;
      }
      this._zoomRange = { start: nextRange.start, end: nextRange.end };
      this._dispatchZoomRange("scroll");
    }
    _applyZoomRange(startTime, endTime) {
      const start = Math.min(startTime, endTime);
      const end = Math.max(startTime, endTime);
      if (!(start < end)) {
        return;
      }
      this._zoomRange = { start, end };
      this._dispatchZoomRange("select");
      if (this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
      }
    }
    _clearZoomRange() {
      if (!this._zoomRange) {
        return;
      }
      this._zoomRange = null;
      this._dispatchZoomRange("reset");
      if (this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
      }
    }
    setExternalZoomRange(range) {
      const nextRange = range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.start < range.end ? {
        start: Math.min(range.start, range.end),
        end: Math.max(range.start, range.end)
      } : null;
      const current = this._zoomRange;
      if (current?.start === nextRange?.start && current?.end === nextRange?.end) {
        return;
      }
      this._zoomRange = nextRange;
      if (this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
      }
    }
    _dispatchZoomRange(source = "select") {
      this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom", {
        bubbles: true,
        composed: true,
        detail: this._zoomRange ? { startTime: this._zoomRange.start, endTime: this._zoomRange.end, preview: false, source } : { startTime: null, endTime: null, preview: false, source }
      }));
    }
    _dispatchZoomPreview(range) {
      this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom", {
        bubbles: true,
        composed: true,
        detail: range ? { startTime: range.startTime, endTime: range.endTime, preview: true } : { startTime: null, endTime: null, preview: true }
      }));
    }
    _handleWindowKeyDown(ev) {
      if (ev.key !== "Escape") {
        return;
      }
      if (this._annotationDialog?.isOpen()) {
        ev.preventDefault();
        this._closeContextAnnotationDialog();
        return;
      }
      if (!this._zoomRange) {
        return;
      }
      ev.preventDefault();
      this._clearZoomRange();
    }
    _navigateToEventHistory(event) {
      if (!event) {
        return;
      }
      navigateToDataPointsHistory$1(this, {
        entity_id: event.entity_ids || [],
        device_id: event.device_ids || [],
        area_id: event.area_ids || [],
        label_id: event.label_ids || []
      }, {
        start_time: this._config?.start_time || null,
        end_time: this._config?.end_time || null,
        zoom_start_time: this._config?.zoom_start_time || null,
        zoom_end_time: this._config?.zoom_end_time || null,
        datapoint_scope: this._config?.datapoint_scope
      });
    }
    _drawRecordedEventPoints(renderer, series, events, t0, t1, options = {}) {
      const overlay = this.shadowRoot?.getElementById("chart-icon-overlay");
      if (overlay && !options.skipOverlayClear) {
        overlay.innerHTML = "";
      }
      if (!renderer || !events?.length) {
        return [];
      }
      const yOffset = Number.isFinite(options.yOffset) ? options.yOffset : 0;
      const hits = [];
      const { ctx } = renderer;
      const showIcons = options.showIcons !== false;
      for (const event of events) {
        const timestamp = new Date(event.timestamp).getTime();
        if (timestamp < t0 || timestamp > t1) continue;
        const eventEntityIds = Array.isArray(event.entity_ids) ? event.entity_ids : [];
        const x2 = renderer.xOf(timestamp, t0, t1);
        const findSeriesWithValue = (candidates) => {
          for (const candidate of candidates) {
            if (!candidate?.pts?.length || !candidate.axis) {
              continue;
            }
            const candidateValue = renderer._interpolateValue(candidate.pts, timestamp);
            if (candidateValue == null) {
              continue;
            }
            return {
              series: candidate,
              value: candidateValue
            };
          }
          return null;
        };
        const matchingSeriesCandidates = eventEntityIds.map((entityId) => series.find((entry) => entry.entityId === entityId)).filter(Boolean);
        const matchingSeriesHit = findSeriesWithValue(matchingSeriesCandidates);
        const fallbackSeriesHit = matchingSeriesHit || findSeriesWithValue([...series].reverse());
        const targetSeries = fallbackSeriesHit?.series || null;
        const hasNumericTarget = !!(targetSeries?.pts?.length && targetSeries.axis);
        const value = hasNumericTarget ? fallbackSeriesHit?.value ?? null : null;
        if (hasNumericTarget && value == null) continue;
        const y2 = hasNumericTarget ? renderer.yOf(value, targetSeries.axis.min, targetSeries.axis.max) : renderer.pad.top + 12;
        const color = event.color || targetSeries.color || "#03a9f4";
        const outerRadius = showIcons ? 13 : 6;
        const innerRadius = showIcons ? 11 : 4;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x2, y2, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x2, y2, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        if (overlay && showIcons) {
          const iconEl = document.createElement("button");
          iconEl.type = "button";
          iconEl.className = "chart-event-icon";
          iconEl.style.left = `${x2}px`;
          iconEl.style.top = `${y2 + yOffset}px`;
          iconEl.title = event.message || "Open related history";
          iconEl.setAttribute("aria-label", event.message || "Open related history");
          iconEl.innerHTML = `<ha-icon icon="${esc$1(event.icon || "mdi:bookmark")}" style="color:${contrastColor$1(color)}"></ha-icon>`;
          iconEl.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this._navigateToEventHistory(event);
          });
          overlay.appendChild(iconEl);
        } else if (overlay) {
          const hitEl = document.createElement("button");
          hitEl.type = "button";
          hitEl.className = "chart-event-icon";
          hitEl.style.left = `${x2}px`;
          hitEl.style.top = `${y2 + yOffset}px`;
          hitEl.title = event.message || "Open related history";
          hitEl.setAttribute("aria-label", event.message || "Open related history");
          hitEl.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this._navigateToEventHistory(event);
          });
          overlay.appendChild(hitEl);
        }
        hits.push({
          event,
          entityId: targetSeries?.entityId || null,
          unit: targetSeries?.unit || "",
          value,
          x: x2,
          y: y2
        });
      }
      return hits;
    }
    _buildBinaryStateSpans(stateList, t0, t1) {
      if (!Array.isArray(stateList) || !stateList.length) {
        return [];
      }
      const spans = [];
      for (let i2 = 0; i2 < stateList.length; i2++) {
        const current = stateList[i2];
        const currentTime = Math.round((current?.lu || 0) * 1e3);
        const next = stateList[i2 + 1];
        const nextTime = next ? Math.round((next.lu || 0) * 1e3) : t1;
        if (!this._isBinaryOnState(current?.s)) continue;
        spans.push({
          start: Math.max(t0, currentTime),
          end: Math.max(Math.max(t0, currentTime), Math.min(t1, nextTime))
        });
      }
      return spans.filter((span) => span.start < span.end);
    }
    _isBinaryOnState(state) {
      return String(state).toLowerCase() === "on";
    }
    _renderSplitAxisOverlays(tracks) {
      const leftEl = this.shadowRoot?.getElementById("chart-axis-left");
      const rightEl = this.shadowRoot?.getElementById("chart-axis-right");
      if (!leftEl || !rightEl || !tracks.length) {
        return;
      }
      const primaryRenderer = tracks[0].renderer;
      const leftWidth = Math.max(0, primaryRenderer.pad.left);
      leftEl.style.width = `${leftWidth}px`;
      rightEl.style.width = "0px";
      const chartWrap = this.shadowRoot?.querySelector(".chart-wrap");
      if (chartWrap) {
        chartWrap.style.setProperty("--dp-chart-axis-left-width", `${leftWidth}px`);
        chartWrap.style.setProperty("--dp-chart-axis-right-width", "0px");
      }
      const labelRight = 10;
      let labelsHtml = "";
      for (const { renderer, axis, rowOffset } of tracks) {
        if (!axis?.ticks?.length) {
          continue;
        }
        for (const tick of axis.ticks) {
          const y2 = rowOffset + renderer.yOf(tick, axis.min, axis.max);
          const formatted = renderer._formatAxisTick(tick, axis.unit);
          labelsHtml += `<div class="chart-axis-label" style="top:${Math.round(y2) + 1}px;right:${labelRight}px;text-align:right;">${esc$1(formatted)}</div>`;
        }
        if (axis.unit) {
          const unitY = rowOffset + Math.max(0, renderer.pad.top - 18);
          labelsHtml += `<div class="chart-axis-unit" style="top:${unitY}px;right:${labelRight}px;text-align:right;">${esc$1(axis.unit)}</div>`;
        }
      }
      leftEl.innerHTML = `<div class="chart-axis-divider"></div>${labelsHtml}`;
      leftEl.classList.add("visible");
      rightEl.innerHTML = "";
      rightEl.classList.remove("visible");
    }
    _renderLegend(series, binaryBackgrounds) {
      const legendEl = this.shadowRoot?.getElementById("legend");
      if (!legendEl) {
        return;
      }
      legendEl.innerHTML = series.map(
        (s2) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc$1(s2.legendEntityId || s2.entityId)}"
          aria-pressed="${this._hiddenSeries.has(s2.legendEntityId || s2.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(s2.legendEntityId || s2.entityId) ? "Show" : "Hide"} ${esc$1(s2.label)}"
        >
          <div class="legend-line" style="background:${esc$1(s2.color)}"></div>
          ${esc$1(s2.label)}${s2.unit ? ` (${esc$1(s2.unit)})` : ""}
        </button>`
      ).join("") + binaryBackgrounds.map((bg) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc$1(bg.entityId)}"
          aria-pressed="${this._hiddenSeries.has(bg.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(bg.entityId) ? "Show" : "Hide"} ${esc$1(bg.label)} ${esc$1(this._binaryOnLabel(bg.entityId))}"
        >
          <div class="legend-line" style="background:${esc$1(bg.color)};opacity:0.35"></div>
          ${esc$1(bg.label)} (${esc$1(this._binaryOnLabel(bg.entityId))})
        </button>`).join("");
      this._updateLegendLayout(legendEl);
      legendEl.querySelectorAll("[data-entity-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const entityId = button.dataset.entityId;
          if (!entityId) {
            return;
          }
          this._toggleSeriesVisibility(entityId);
        });
      });
    }
    _toggleSeriesVisibility(entityId) {
      let visible;
      if (this._hiddenSeries.has(entityId)) {
        this._hiddenSeries.delete(entityId);
        visible = true;
      } else {
        this._hiddenSeries.add(entityId);
        visible = false;
      }
      this.dispatchEvent(new CustomEvent("hass-datapoints-toggle-series-visibility", {
        detail: { entityId, visible },
        bubbles: true,
        composed: true
      }));
      if (this._lastHistResult && this._lastEvents) {
        this._queueDrawChart(this._lastHistResult, this._lastStatsResult || {}, this._lastEvents, this._lastT0, this._lastT1);
      }
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-history-card-editor");
    }
    static getStubConfig() {
      return { title: "History with Events", entity: "sensor.example", hours_to_show: 24 };
    }
  }
  const {
    areaIcon,
    areaName,
    buildDataPointsHistoryPath,
    confirmDestructiveAction,
    contrastColor,
    deleteEvent,
    DOMAIN,
    deviceIcon,
    deviceName,
    entityIcon,
    entityName,
    esc,
    fetchEvents,
    fmtDateTime,
    labelIcon,
    labelName,
    navigateToDataPointsHistory,
    updateEvent
  } = shared;
  class HassRecordsListCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._allEvents = [];
      this._searchQuery = "";
      this._page = 0;
      this._pageSize = 15;
      this._unsubscribe = null;
    }
    setConfig(config) {
      const nextConfig = { ...config };
      const nextKey = JSON.stringify(nextConfig);
      if (this._configKey === nextKey) return;
      this._config = nextConfig;
      this._configKey = nextKey;
      if (config.page_size) this._pageSize = config.page_size;
      if (this._rendered && this._hass) {
        this._load();
      }
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._render();
        this._load();
        this._setupAutoRefresh();
      }
      this._updateEditHass();
    }
    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (this._windowListener) {
        window.removeEventListener("hass-datapoints-event-recorded", this._windowListener);
        this._windowListener = null;
      }
    }
    _setupAutoRefresh() {
      this._hass.connection.subscribeEvents(() => {
        this._load();
      }, `${DOMAIN}_event_recorded`).then((unsub) => {
        this._unsubscribe = unsub;
      }).catch(() => {
      });
      this._windowListener = () => this._load();
      window.addEventListener("hass-datapoints-event-recorded", this._windowListener);
    }
    _updateEditHass() {
      if (!this.shadowRoot || !this._hass) return;
      this.shadowRoot.querySelectorAll("ha-icon-picker, ha-entity-picker").forEach((el) => {
        el.hass = this._hass;
      });
    }
    _navigateToEventHistory(ev) {
      const range = this._getNavigationContextForEvent(ev);
      navigateToDataPointsHistory(this, {
        entity_id: ev?.entity_ids || [],
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || []
      }, {
        start_time: range?.start_time,
        end_time: range?.end_time,
        zoom_start_time: range?.zoom_start_time,
        zoom_end_time: range?.zoom_end_time,
        datapoint_scope: this._config?.datapoint_scope
      });
    }
    _getNavigationContextForEvent(ev) {
      const cfg = this._config || {};
      const startTime = cfg.start_time || null;
      const endTime = cfg.end_time || null;
      const zoomStartTime = cfg.zoom_start_time || null;
      const zoomEndTime = cfg.zoom_end_time || null;
      if (startTime && endTime) {
        return {
          start_time: startTime,
          end_time: endTime,
          zoom_start_time: zoomStartTime,
          zoom_end_time: zoomEndTime
        };
      }
      const eventTime = ev?.timestamp ? new Date(ev.timestamp) : null;
      if (!eventTime || !Number.isFinite(eventTime.getTime())) return null;
      const start = new Date(eventTime.getTime() - 12 * 3600 * 1e3);
      const end = new Date(eventTime.getTime() + 12 * 3600 * 1e3);
      return {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      };
    }
    _getHistoryLinkForEvent(ev) {
      const range = this._getNavigationContextForEvent(ev);
      return buildDataPointsHistoryPath({
        entity_id: ev?.entity_ids || [],
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || []
      }, {
        start_time: range?.start_time,
        end_time: range?.end_time,
        zoom_start_time: range?.zoom_start_time,
        zoom_end_time: range?.zoom_end_time,
        datapoint_scope: this._config?.datapoint_scope
      });
    }
    _render() {
      this._rendered = true;
      const cfg = this._config;
      const showSearch = cfg.show_search !== false;
      this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
        ha-card {
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .toolbar {
          padding: 12px 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }
        .toolbar-search-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .toolbar-search-icon {
          position: absolute;
          left: 12px;
          color: var(--secondary-text-color);
          pointer-events: none;
          --mdc-icon-size: 18px;
        }
        .toolbar-search {
          flex: 1;
          width: 100%;
          min-height: 42px;
          padding: 0 14px 0 40px;
          border-radius: 12px;
          border: 1px solid color-mix(in srgb, var(--divider-color, #d8dbe2) 84%, transparent);
          background: color-mix(in srgb, var(--card-background-color, #fff) 96%, var(--secondary-background-color, rgba(0, 0, 0, 0.04)) 4%);
          color: var(--primary-text-color);
          font: inherit;
          box-sizing: border-box;
          outline: none;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }
        .toolbar-search::placeholder {
          color: var(--secondary-text-color);
        }
        .toolbar-search:hover {
          border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--divider-color, #d8dbe2));
        }
        .toolbar-search:focus {
          border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 42%, var(--divider-color, #d8dbe2));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
          background: var(--card-background-color, #fff);
        }

        .list-scroll {
          flex: 1 1 0;
          min-height: 0;
          overflow-y: auto;
        }
        
        .ann-expand-chip {
          display: inline-flex;
          align-items: center;
          margin-top: 4px;
          padding: 1px 8px;
          border-radius: 999px;
          font-size: 0.75em;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--secondary-text-color);
          background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .event-list {
          padding: 0 12px 12px;
          box-sizing: border-box;
        }
        .event-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--divider-color, #eee);
          border-radius: 12px;
          position: relative;
          transition: background 0.15s;
          cursor: default;
        }
        .event-item.simple { align-items: center; }
        .event-item:hover { background: var(--secondary-background-color, rgba(0,0,0,0.02)); }
        .event-item:last-child { border-bottom: none; }
        .event-item.expandable { cursor: pointer; }
        .event-item.is-hidden .ev-icon-main,
        .event-item:hover .ev-icon-main {
          opacity: 0.22;
        }

        .ev-icon-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ev-icon-main {
          transition: opacity 120ms ease;
        }
        .ev-visibility-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
          color: var(--primary-text-color);
          cursor: pointer;
          opacity: 0;
          transition: opacity 120ms ease;
          padding: 0;
          font: inherit;
        }
        .ev-visibility-btn ha-icon { --mdc-icon-size: 15px; }
        .event-item:hover .ev-visibility-btn,
        .event-item.is-hidden .ev-visibility-btn,
        .ev-visibility-btn:focus-visible {
          opacity: 1;
          outline: none;
        }

        /* ev-body takes full remaining width */
        .ev-body { flex: 1; min-width: 0; }

        /* Header row: message + action buttons on same line */
        .ev-header {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
        .ev-header-text {
          flex: 1;
          min-width: 0;
        }
        .ev-message {
          display: block;
          font-weight: 600;
          font-size: 1rem;
          line-height: 1.45;
          color: var(--primary-text-color);
          word-break: break-word;
        }
        .ev-meta {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ev-time-actions-below {
          display: inline-flex;
          align-items: center;
          gap: 0;
        }
        .ev-history-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary-text-color);
          padding: 0;
          margin: 0;
          cursor: pointer;
          font: inherit;
          text-align: left;
          border-radius: 8px;
          text-decoration: none;
        }
        .ev-history-link:hover,
        .ev-history-link:focus-visible {
          color: var(--primary-text-color);
          outline: none;
        }
        .ev-time-below {
          font-size: 0.92rem;
          font-weight: 500;
          line-height: 1.35;
          color: var(--secondary-text-color);
          display: block;
        }
        .ev-history-link ha-icon { --mdc-icon-size: 18px; }

        .ev-full-message {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--primary-text-color);
          margin-top: 10px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ev-full-message.hidden { display: none; }

        .ev-entities {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .ev-entity-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.92em;
          line-height: 1.2;
          color: var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: background 0.15s;
        }
        .ev-entity-chip:hover { background: color-mix(in srgb, var(--primary-color) 22%, transparent); }
        .ev-entity-chip ha-icon { --mdc-icon-size: 16px; }
        .ev-dev-badge {
          display: inline-block;
          font-size: 0.68em; font-weight: 700; letter-spacing: 0.04em;
          color: #fff;
          background: #ff9800;
          padding: 1px 5px; border-radius: 4px;
          vertical-align: middle; margin-left: 4px;
        }

        /* Actions sit inside ev-body header row, always visible on hover */
        .ev-actions {
          display: flex;
          gap: 0;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .event-item:hover .ev-actions { opacity: 1; }

        /* Edit form spans full ev-body width */
        .edit-form {
          background: var(--secondary-background-color, #f5f5f5);
          border-radius: 8px;
          padding: 10px;
          margin-top: 8px;
          display: none;
          flex-direction: column;
          gap: 8px;
        }
        .edit-form.open { display: flex; }
        .edit-form ha-textfield, .edit-form ha-textarea { display: block; width: 100%; }
        .edit-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .edit-row > * { min-width: 0; }

        .color-swatch-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid var(--divider-color, #ccc);
          cursor: pointer; padding: 0; overflow: hidden;
          flex-shrink: 0; background: none; position: relative;
        }
        .color-swatch-btn input[type="color"] {
          position: absolute; top: -4px; left: -4px;
          width: calc(100% + 8px); height: calc(100% + 8px);
          border: none; cursor: pointer; padding: 0; background: none; opacity: 0;
        }
        .color-swatch-inner { display: block; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; }

        .pagination {
          display: flex;
          flex: 0 0 auto;
          justify-content: space-between;
          align-items: center;
          padding: 8px 8px;
          border-top: 1px solid var(--divider-color, #eee);
          font-size: 0.82em;
          color: var(--secondary-text-color);
        }

        .empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--secondary-text-color);
          font-size: 0.9em;
        }
        .empty ha-icon { --mdc-icon-size: 32px; display: block; margin: 0 auto 8px; opacity: 0.5; }
      </style>
      <ha-card>
        ${cfg.title ? `<div class="card-header">${esc(cfg.title)}</div>` : ""}
        ${showSearch ? `
        <div class="toolbar">
          <label class="toolbar-search-wrap" aria-label="Search datapoints">
            <ha-icon class="toolbar-search-icon" icon="mdi:magnify"></ha-icon>
            <input id="search" class="toolbar-search" type="search" placeholder="Search datapoints…" aria-label="Search datapoints">
          </label>
        </div>` : ""}
        <div class="list-scroll" id="list-scroll">
          <div class="event-list" id="list">
            <div class="empty">Loading…</div>
          </div>
        </div>
        <div class="pagination" id="pagination" style="display:none">
          <ha-icon-button id="prev" label="Previous page">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </ha-icon-button>
          <span id="page-info"></span>
          <ha-icon-button id="next" label="Next page">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </ha-icon-button>
        </div>
      </ha-card>`;
      if (showSearch) {
        this.shadowRoot.getElementById("search").addEventListener("input", (e2) => {
          this._searchQuery = e2.target.value.toLowerCase();
          this._page = 0;
          this.dispatchEvent(new CustomEvent("hass-datapoints-records-search", {
            bubbles: true,
            composed: true,
            detail: { query: this._searchQuery }
          }));
          this._renderList();
        });
      }
      this.shadowRoot.getElementById("prev").addEventListener("click", () => {
        if (this._page > 0) {
          this._page--;
          this._renderList();
          this.shadowRoot.getElementById("list-scroll").scrollTop = 0;
        }
      });
      this.shadowRoot.getElementById("next").addEventListener("click", () => {
        const pages = Math.ceil(this._filtered().length / this._pageSize);
        if (this._page < pages - 1) {
          this._page++;
          this._renderList();
          this.shadowRoot.getElementById("list-scroll").scrollTop = 0;
        }
      });
    }
    async _load() {
      const cfg = this._config;
      const endTime = cfg.zoom_end_time || cfg.end_time || void 0;
      let startTime = cfg.zoom_start_time || cfg.start_time || void 0;
      if (!startTime && cfg.hours_to_show) {
        const end = endTime ? new Date(endTime) : /* @__PURE__ */ new Date();
        startTime = new Date(end.getTime() - cfg.hours_to_show * 3600 * 1e3).toISOString();
      }
      let entityIds;
      if (cfg.entity) {
        entityIds = [cfg.entity];
      } else if (cfg.entities) {
        entityIds = cfg.entities.map((e2) => typeof e2 === "string" ? e2 : e2.entity);
      } else {
        entityIds = void 0;
      }
      this._allEvents = await fetchEvents(
        this._hass,
        startTime,
        endTime,
        this._config.datapoint_scope === "all" ? void 0 : entityIds
      );
      this._allEvents = [...this._allEvents].reverse();
      this._renderList();
    }
    _filtered() {
      const msgFilter = (this._config.message_filter || "").toLowerCase().trim();
      return this._allEvents.filter((e2) => {
        const haystack = [
          e2.message.toLowerCase(),
          (e2.annotation || "").toLowerCase(),
          ...(e2.entity_ids || []).map((id) => id.toLowerCase())
        ];
        if (msgFilter && !haystack.some((h2) => h2.includes(msgFilter))) return false;
        if (this._searchQuery && !haystack.some((h2) => h2.includes(this._searchQuery))) return false;
        return true;
      });
    }
    _renderList() {
      const cfg = this._config;
      const showEntities = cfg.show_entities !== false;
      const showFullMessage = cfg.show_full_message !== false;
      const showActions = cfg.show_actions !== false;
      const filtered = this._filtered();
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / this._pageSize));
      this._page = Math.min(this._page, pages - 1);
      const slice = filtered.slice(this._page * this._pageSize, (this._page + 1) * this._pageSize);
      const listEl = this.shadowRoot.getElementById("list");
      const pagEl = this.shadowRoot.getElementById("pagination");
      if (!total) {
        listEl.innerHTML = `
        <div class="empty">
          <ha-icon icon="mdi:bookmark-off-outline"></ha-icon>
          ${this._searchQuery ? "No matching datapoints." : "No datapoints yet."}
        </div>`;
        pagEl.style.display = "none";
        return;
      }
      listEl.innerHTML = slice.map((e2) => {
        const annText = e2.annotation && e2.annotation !== e2.message ? e2.annotation : "";
        const color = e2.color || "#03a9f4";
        const icon = e2.icon || "mdi:bookmark";
        const iconColor = contrastColor(color);
        const entities = e2.entity_ids || [];
        const devices = e2.device_ids || [];
        const areas = e2.area_ids || [];
        const labels = e2.label_ids || [];
        const hasRelated = entities.length || devices.length || areas.length || labels.length;
        const isExpandable = !showFullMessage && annText;
        const isHidden = (this._config.hidden_event_ids || []).includes(e2.id);
        const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
        const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
        const historyLinkHref = this._getHistoryLinkForEvent(e2);
        const historyLink = `<a class="ev-history-link" href="${esc(historyLinkHref)}" data-event-id="${esc(e2.id)}" title="Open related data point history" aria-label="Open related data point history"><ha-icon icon="mdi:history"></ha-icon><span class="ev-time-below" title="${esc(fmtDateTime(e2.timestamp))}">${esc(fmtDateTime(e2.timestamp))}</span></a>`;
        const isSimple = !annText && !hasRelated;
        return `
        <div class="event-item${isExpandable ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}" data-id="${esc(e2.id)}">
          <div class="ev-icon-wrap" style="background:${esc(color)}">
            <ha-icon class="ev-icon-main" icon="${esc(icon)}" style="--mdc-icon-size:18px;color:${esc(iconColor)}"></ha-icon>
            <button class="ev-visibility-btn" type="button" data-event-id="${esc(e2.id)}" title="${esc(visibilityLabel)}" aria-label="${esc(visibilityLabel)}">
              <ha-icon icon="${esc(visibilityIcon)}"></ha-icon>
            </button>
          </div>
          <div class="ev-body">
            <div class="ev-header">
              <div class="ev-header-text">
                <span class="ev-message">
                  ${esc(e2.message)}
                  ${e2.dev ? `<span class="ev-dev-badge">DEV</span>` : ""}
                  ${isExpandable ? `<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
                </span>
                <div class="ev-meta">
                  <span class="ev-time-actions-below">${historyLink}</span>
                </div>
              </div>
              ${showActions ? `
              <div class="ev-actions">
                <ha-icon-button class="edit-btn" label="Edit record">
                  <ha-icon icon="mdi:pencil-outline"></ha-icon>
                </ha-icon-button>
                <ha-icon-button class="delete-btn" label="Delete record" style="--icon-primary-color:var(--error-color,#f44336)">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </ha-icon-button>
              </div>` : ""}
            </div>
            ${annText ? `<div class="ev-full-message${showFullMessage ? "" : " hidden"}">${esc(annText)}</div>` : ""}
            ${showEntities && hasRelated ? `
              <div class="ev-entities">
                ${entities.map((eid) => `
                  <button class="ev-entity-chip" data-entity="${esc(eid)}">
                    <ha-icon icon="${esc(entityIcon(this._hass, eid))}"></ha-icon>
                    ${esc(entityName(this._hass, eid))}
                  </button>`).join("")}
                ${devices.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc(deviceIcon(this._hass, id))}"></ha-icon>
                    ${esc(deviceName(this._hass, id))}
                  </span>`).join("")}
                ${areas.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc(areaIcon(this._hass, id))}"></ha-icon>
                    ${esc(areaName(this._hass, id))}
                  </span>`).join("")}
                ${labels.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc(labelIcon(this._hass, id))}"></ha-icon>
                    ${esc(labelName(this._hass, id))}
                  </span>`).join("")}
              </div>
            ` : ""}
            ${showActions ? `
            <div class="edit-form" id="edit-${esc(e2.id)}">
              <ha-textfield class="edit-msg" label="Message" style="width:100%"></ha-textfield>
              <ha-textarea class="edit-ann" label="Full message / annotation" autogrow style="width:100%"></ha-textarea>
              <div class="edit-row">
                <ha-icon-picker class="edit-icon-picker" style="flex:1"></ha-icon-picker>
                <button class="color-swatch-btn" title="Choose colour" style="background:${esc(color)}">
                  <span class="color-swatch-inner" style="background:${esc(color)}"></span>
                  <input type="color" class="edit-color" value="${esc(color)}" />
                </button>
              </div>
              <div class="edit-row">
                <ha-button class="edit-save" raised>Save</ha-button>
                <ha-button class="edit-cancel">Cancel</ha-button>
              </div>
            </div>` : ""}
          </div>
        </div>`;
      }).join("");
      if (pages > 1) {
        pagEl.style.display = "flex";
        this.shadowRoot.getElementById("page-info").textContent = `Page ${this._page + 1} of ${pages} · ${total} records`;
        this.shadowRoot.getElementById("prev").disabled = this._page === 0;
        this.shadowRoot.getElementById("next").disabled = this._page >= pages - 1;
      } else {
        pagEl.style.display = "none";
      }
      if (!showFullMessage) {
        listEl.querySelectorAll(".event-item.expandable").forEach((item) => {
          item.addEventListener("click", (e2) => {
            if (e2.target.closest(".ev-actions, .ev-entity-chip, .edit-form, ha-icon-button, ha-button")) return;
            const ann = item.querySelector(".ev-full-message");
            if (ann) ann.classList.toggle("hidden");
          });
        });
      }
      listEl.querySelectorAll(".ev-history-link").forEach((link) => {
        link.addEventListener("click", (e2) => {
          if (e2.defaultPrevented || e2.button !== 0 || e2.metaKey || e2.ctrlKey || e2.shiftKey || e2.altKey) {
            return;
          }
          e2.preventDefault();
          e2.stopPropagation();
          const item = e2.target.closest(".event-item");
          const id = item?.dataset.id;
          const record = this._allEvents.find((ev) => ev.id === id);
          if (record) this._navigateToEventHistory(record);
        });
      });
      listEl.querySelectorAll(".ev-visibility-btn").forEach((btn) => {
        btn.addEventListener("click", (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          this.dispatchEvent(new CustomEvent("hass-datapoints-toggle-event-visibility", {
            bubbles: true,
            composed: true,
            detail: { eventId: btn.dataset.eventId }
          }));
        });
      });
      listEl.querySelectorAll(".ev-entity-chip").forEach((btn) => {
        btn.addEventListener("click", (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          const entityId = btn.dataset.entity;
          if (entityId) {
            const ev = new Event("hass-more-info", { bubbles: true, composed: true });
            ev.detail = { entityId };
            this.dispatchEvent(ev);
          }
        });
      });
      listEl.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e2) => {
          e2.stopPropagation();
          const item = e2.target.closest(".event-item");
          const id = item?.dataset.id;
          if (!id) return;
          const message = item.querySelector(".ev-message")?.textContent?.trim() || "this record";
          const confirmed = await confirmDestructiveAction(this, {
            title: "Delete record",
            message: `Delete ${message}?`,
            confirmLabel: "Delete record"
          });
          if (!confirmed) return;
          try {
            await deleteEvent(this._hass, id);
            await this._load();
          } catch (err) {
            console.error("[hass-datapoints list-card] delete failed", err);
          }
        });
      });
      listEl.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e2) => {
          e2.stopPropagation();
          const item = e2.target.closest(".event-item");
          const id = item?.dataset.id;
          if (!id) return;
          const form = this.shadowRoot.getElementById(`edit-${id}`);
          if (!form) return;
          const isOpen = form.classList.contains("open");
          this.shadowRoot.querySelectorAll(".edit-form.open").forEach((f2) => f2.classList.remove("open"));
          if (!isOpen) {
            form.classList.add("open");
            const ev = this._allEvents.find((ev2) => ev2.id === id);
            const msgField = form.querySelector(".edit-msg");
            if (msgField && ev) msgField.value = ev.message || "";
            const annField = form.querySelector(".edit-ann");
            if (annField && ev) {
              const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
              annField.value = annText;
            }
            const iconPicker = form.querySelector(".edit-icon-picker");
            if (iconPicker && this._hass) {
              iconPicker.hass = this._hass;
              if (ev) iconPicker.value = ev.icon || "mdi:bookmark";
            }
            const colorInput = form.querySelector(".edit-color");
            if (colorInput) {
              colorInput.addEventListener("input", () => {
                const swatchBtn = colorInput.closest(".color-swatch-btn");
                const swatchInner = swatchBtn.querySelector(".color-swatch-inner");
                swatchBtn.style.background = colorInput.value;
                swatchInner.style.background = colorInput.value;
              });
            }
          }
        });
      });
      listEl.querySelectorAll(".edit-save").forEach((btn) => {
        btn.addEventListener("click", async (e2) => {
          e2.stopPropagation();
          const form = e2.target.closest(".edit-form");
          if (!form) return;
          const id = form.id.replace("edit-", "");
          const msg = (form.querySelector(".edit-msg").value || "").trim();
          const ann = (form.querySelector(".edit-ann").value || "").trim();
          const iconPicker = form.querySelector(".edit-icon-picker");
          const icon = iconPicker?.value || "mdi:bookmark";
          const color = form.querySelector(".edit-color").value;
          if (!msg) return;
          try {
            await updateEvent(this._hass, id, { message: msg, annotation: ann || msg, icon, color });
            form.classList.remove("open");
            await this._load();
          } catch (err) {
            console.error("[hass-datapoints list-card] update failed", err);
          }
        });
      });
      listEl.querySelectorAll(".edit-cancel").forEach((btn) => {
        btn.addEventListener("click", (e2) => {
          e2.stopPropagation();
          e2.target.closest(".edit-form").classList.remove("open");
        });
      });
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-list-card-editor");
    }
    static getStubConfig() {
      return {};
    }
    getGridOptions() {
      const rows = this._config?.show_search !== false ? 4 : 3;
      return {
        rows,
        min_rows: rows
      };
    }
  }
  class HassRecordsQuickCard extends i$2 {
    static properties = {
      _config: { type: Object, state: true },
      _hass: { type: Object, state: true },
      _feedbackClass: { type: String, state: true },
      _feedbackText: { type: String, state: true },
      _feedbackVisible: { type: Boolean, state: true }
    };
    static styles = i$5`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      gap: 8px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .input-row ha-textfield {
      flex: 1;
    }
    .annotation-row {
      display: grid;
      gap: 6px;
    }
    .annotation-label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .annotation-row textarea {
      width: 100%;
      min-height: 92px;
      resize: vertical;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid
        var(
          --input-outlined-idle-border-color,
          var(--divider-color, #9e9e9e)
        );
      border-radius: 12px;
      background: var(
        --card-background-color,
        var(--primary-background-color, #fff)
      );
      color: var(--primary-text-color);
      font: inherit;
      line-height: 1.45;
    }
    .feedback {
      position: absolute;
      bottom: 2px;
      left: 12px;
      right: 12px;
      font-size: 0.78em;
      padding: 2px 8px;
      border-radius: 4px;
      display: none;
      pointer-events: none;
    }
    .feedback.visible {
      display: block;
    }
    .feedback.ok {
      background: rgba(76, 175, 80, 0.12);
      color: var(--success-color, #4caf50);
    }
    .feedback.err {
      background: rgba(244, 67, 54, 0.12);
      color: var(--error-color, #f44336);
    }
  `;
    constructor() {
      super();
      this._config = {};
      this._hass = null;
      this._feedbackClass = "";
      this._feedbackText = "";
      this._feedbackVisible = false;
    }
    setConfig(config) {
      this._config = config || {};
    }
    set hass(hass) {
      this._hass = hass;
    }
    firstUpdated() {
      const msgEl = this.shadowRoot.querySelector("#msg");
      if (msgEl) {
        msgEl.addEventListener("keydown", (e2) => {
          if (e2.key === "Enter") {
            e2.preventDefault();
            this._record();
          }
        });
      }
    }
    async _record() {
      const msgEl = this.shadowRoot.querySelector("#msg");
      const message = (msgEl?.value || "").trim();
      if (!message) {
        msgEl?.focus();
        return;
      }
      const btn = this.shadowRoot.querySelector("#btn");
      if (btn) btn.disabled = true;
      const cfg = this._config;
      const data = {
        message,
        icon: cfg.icon || "mdi:bookmark",
        color: cfg.color || AMBER
      };
      const annEl = this.shadowRoot.querySelector("#ann");
      const annotation = (annEl?.value || "").trim();
      if (annotation) data.annotation = annotation;
      let entityIds;
      if (cfg.entity) {
        entityIds = [cfg.entity];
      } else if (cfg.entities) {
        entityIds = Array.isArray(cfg.entities) ? cfg.entities : [cfg.entities];
      } else {
        entityIds = [];
      }
      if (entityIds.length) data.entity_ids = entityIds;
      try {
        await this._hass.callService(DOMAIN$1, "record", data);
        window.dispatchEvent(
          new CustomEvent("hass-datapoints-event-recorded")
        );
        if (msgEl) msgEl.value = "";
        if (annEl) annEl.value = "";
        this._feedbackClass = "ok";
        this._feedbackText = "Recorded!";
        this._feedbackVisible = true;
        setTimeout(() => this._feedbackVisible = false, 2500);
      } catch (e2) {
        this._feedbackClass = "err";
        this._feedbackText = `Error: ${e2.message || "unknown error"}`;
        this._feedbackVisible = true;
        logger$1.error("[hass-datapoints quick-card]", e2);
      }
      if (btn) btn.disabled = false;
    }
    render() {
      const cfg = this._config;
      const cfgIcon = cfg.icon || "mdi:bookmark";
      const cfgColor = cfg.color || AMBER;
      const hasTitle = !!cfg.title;
      const showAnnotation = !!cfg.show_annotation;
      return b`
      <ha-card>
        ${hasTitle ? b`
              <div class="card-header">
                <ha-icon .icon=${cfgIcon}></ha-icon>
                ${cfg.title}
              </div>
            ` : ""}
        <div class="input-row">
          <ha-textfield
            id="msg"
            .placeholder=${cfg.placeholder || "Note something…"}
          ></ha-textfield>
          <ha-button
            id="btn"
            raised
            style="--mdc-theme-primary: ${cfgColor}"
            @click=${() => this._record()}
          >
            <ha-icon .icon=${cfgIcon} slot="icon"></ha-icon>
            Record
          </ha-button>
        </div>
        ${showAnnotation ? b`
              <div class="annotation-row">
                <label class="annotation-label" for="ann">Annotation</label>
                <textarea
                  id="ann"
                  placeholder="Detailed note shown on chart hover…"
                ></textarea>
              </div>
            ` : ""}
        <div
          class="feedback ${this._feedbackClass} ${this._feedbackVisible ? "visible" : ""}"
        >
          ${this._feedbackText}
        </div>
      </ha-card>
    `;
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-quick-card-editor");
    }
    static getStubConfig() {
      return { title: "Quick Record" };
    }
    getGridOptions() {
      const hasAnnotation = !!this._config?.show_annotation;
      return {
        rows: hasAnnotation ? 3 : 1,
        min_rows: hasAnnotation ? 3 : 1,
        max_rows: hasAnnotation ? 3 : 1
      };
    }
    getCardSize() {
      return this._config?.show_annotation ? 3 : 1;
    }
  }
  class DpPagination extends i$2 {
    static properties = {
      page: { type: Number },
      totalPages: { type: Number },
      totalItems: { type: Number },
      label: { type: String }
    };
    static styles = i$5`
    :host {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 8px; font-size: 0.8rem;
      color: var(--secondary-text-color);
    }
    button {
      background: none; border: 1px solid var(--divider-color, #444);
      border-radius: 4px; color: var(--primary-text-color);
      cursor: pointer; padding: 4px 8px; font-family: inherit; font-size: 0.8rem;
    }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    button:not(:disabled):hover {
      background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    }
    .info { min-width: 120px; text-align: center; }
  `;
    constructor() {
      super();
      this.page = 0;
      this.totalPages = 1;
      this.totalItems = 0;
      this.label = "records";
    }
    _onPrev() {
      if (this.page > 0) {
        this.dispatchEvent(
          new CustomEvent("dp-page-change", {
            detail: { page: this.page - 1 },
            bubbles: true,
            composed: true
          })
        );
      }
    }
    _onNext() {
      if (this.page < this.totalPages - 1) {
        this.dispatchEvent(
          new CustomEvent("dp-page-change", {
            detail: { page: this.page + 1 },
            bubbles: true,
            composed: true
          })
        );
      }
    }
    render() {
      return b`
      <button
        type="button"
        data-action="prev"
        ?disabled=${this.page <= 0}
        @click=${this._onPrev}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span class="info">
        <span>Page ${this.page + 1} of ${this.totalPages} </span>
        <span> ${this.totalItems} ${this.label}</span>
      </span>
      <button
        type="button"
        data-action="next"
        ?disabled=${this.page >= this.totalPages - 1}
        @click=${this._onNext}
        aria-label="Next page"
      >
        ›
      </button>
    `;
    }
  }
  customElements.define("dp-pagination", DpPagination);
  class HassRecordsSensorCard extends i$2 {
    static properties = {
      _config: { state: true },
      _hass: { state: true },
      _loadMessage: { state: true },
      _chartReady: { state: true },
      _annEvents: { state: true },
      _annPage: { state: true },
      _hiddenEventIds: { state: true }
    };
    _initialized = false;
    _lastHistResult = null;
    _lastEvents = [];
    _lastT0 = null;
    _lastT1 = null;
    _unsubscribe = null;
    _resizeObserver = null;
    _canvasClickHandler = null;
    _previousSeriesEndpoints = /* @__PURE__ */ new Map();
    static styles = i$5`
    :host { display: block; height: 100%; }
    ha-card { padding: 0; overflow: hidden; height: 100%; }
    .card-shell { height: 100%; min-height: 0; display: flex; flex-direction: column; }
    .card-body {
      display: flex; flex-direction: column; flex: 0 0 auto;
      height: calc(
        (var(--hr-body-rows, var(--row-size, 1)) * (var(--row-height, 1px) + var(--row-gap, 0px)))
        - var(--row-gap, 0px)
      );
      min-height: 0; position: relative;
    }
    .header {
      padding: 8px 16px 0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .name {
      font-size: 1.1rem; font-weight: 500; color: var(--secondary-text-color);
      line-height: 40px; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; min-width: 0;
    }
    .icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--state-icon-color, var(--secondary-text-color)); }
    .icon ha-state-icon { --mdc-icon-size: 24px; }
    .info {
      display: flex; align-items: baseline; padding: 0 16px 16px; margin-top: -4px;
      line-height: var(--ha-line-height-condensed);
    }
    .value {
      font-size: var(--ha-font-size-3xl, 2.5rem);
      font-weight: var(--ha-font-weight-bold, 700);
      line-height: 0.95; letter-spacing: -0.03em; color: var(--primary-text-color);
    }
    .measurement { font-size: 1rem; color: var(--secondary-text-color); font-weight: 400; }
    .footer { position: absolute; bottom: 0; left: 0; right: 0; height: 100%; }
    .chart-wrap { position: relative; height: 100%; padding: 0; box-sizing: border-box; overflow: visible; min-height: 78px; }
    .chart-viewport { position: relative; height: 100%; overflow: hidden; }
    canvas { display: block; }
    .chart-loading { text-align: center; padding: 28px 16px 24px; color: var(--secondary-text-color); }
    .icon-overlay { position: absolute; inset: 0; pointer-events: none; }
    .ann-icon {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer;
      box-shadow: 0 0 0 2px var(--card-background-color, #fff);
    }
    .ann-icon ha-icon { --mdc-icon-size: 12px; }
    .tooltip {
      position: fixed; background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ddd); border-radius: 8px;
      padding: 8px 12px; font-size: 0.8em; line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none;
      display: none; max-width: 220px; z-index: 10; color: var(--primary-text-color);
    }
    .tt-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; flex-shrink: 0; }
    .tt-time { color: var(--secondary-text-color); margin-bottom: 3px; }
    .tt-value { color: var(--secondary-text-color); margin-bottom: 4px; }
    .tt-message { font-weight: 500; }
    .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
    .tt-entities { color: var(--secondary-text-color); margin-top: 6px; white-space: pre-wrap; }
    .ann-section {
      border-top: 1px solid var(--divider-color, #eee);
      flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
    }
    .ann-list { flex: 1 1 0; min-height: 0; overflow-y: auto; }
    .ann-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 16px; border-bottom: 1px solid var(--divider-color, #eee); cursor: default;
    }
    .ann-item:last-child { border-bottom: none; }
    .ann-item.simple { align-items: center; }
    .ann-item.is-hidden .ann-icon-main,
    .ann-item:hover .ann-icon-main { opacity: 0.22; }
    .ann-icon-wrap {
      position: relative; width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 0 0 2px var(--card-background-color, #fff);
    }
    .ann-icon-main { transition: opacity 120ms ease; }
    .ann-visibility-btn {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: 50%;
      background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
      color: var(--primary-text-color); cursor: pointer; opacity: 0;
      transition: opacity 120ms ease; padding: 0; font: inherit;
    }
    .ann-item:hover .ann-visibility-btn,
    .ann-item.is-hidden .ann-visibility-btn { opacity: 1; }
    .ann-body { flex: 1; min-width: 0; }
    .ann-header { display: flex; align-items: baseline; gap: 6px; flex-wrap: nowrap; }
    .ann-msg { font-size: 0.85em; font-weight: 500; color: var(--primary-text-color); word-break: break-word; flex: 1; min-width: 0; }
    .ann-dev-badge {
      display: inline-block; font-size: 0.68em; font-weight: 700;
      color: #fff; background: #ff9800; padding: 1px 5px; border-radius: 4px;
      vertical-align: middle; margin-left: 4px;
    }
    .ann-time-wrap { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .ann-time { font-size: 0.75em; color: var(--secondary-text-color); white-space: nowrap; }
    .ann-history-btn {
      display: inline-flex; align-items: center; justify-content: center;
      border: none; background: none; color: var(--secondary-text-color); padding: 0; cursor: pointer;
    }
    .ann-history-btn ha-icon { --mdc-icon-size: 14px; }
    .ann-note { font-size: 0.78em; color: var(--secondary-text-color); margin-top: 2px; white-space: pre-wrap; word-break: break-word; }
    .ann-note.hidden { display: none; }
    .ann-expand-chip {
      display: inline-flex; align-items: center; margin-top: 4px; padding: 1px 8px; border-radius: 999px;
      font-size: 0.75em; font-weight: 600; color: var(--secondary-text-color);
      background: var(--secondary-background-color, rgba(0,0,0,0.06));
      border: none; cursor: pointer; font-family: inherit;
    }
    .ann-empty { text-align: center; padding: 16px; color: var(--secondary-text-color); font-size: 0.85em; }
  `;
    constructor() {
      super();
      this._config = {};
      this._hass = null;
      this._loadMessage = "Loading…";
      this._chartReady = false;
      this._annEvents = [];
      this._annPage = 0;
      this._hiddenEventIds = /* @__PURE__ */ new Set();
    }
    setConfig(config) {
      if (!config.entity) {
        throw new Error("hass-datapoints-sensor-card: `entity` is required");
      }
      this._config = {
        hours_to_show: 24,
        annotation_style: "circle",
        show_records: false,
        records_page_size: null,
        records_limit: null,
        ...config
      };
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._initialized) {
        this._initialized = true;
        this._setupAutoRefresh();
      }
    }
    firstUpdated() {
      this._setupResizeObserver();
      if (this._hass) this._load();
    }
    connectedCallback() {
      super.connectedCallback();
      if (this._initialized && this._hass) this._load();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      if (this._canvasClickHandler) {
        this.shadowRoot?.querySelector("canvas#chart")?.removeEventListener("click", this._canvasClickHandler);
      }
    }
    _setupAutoRefresh() {
      if (!this._hass) return;
      this._hass.connection.subscribeEvents(() => this._load(), `${DOMAIN$1}_event_recorded`).then((unsub) => {
        this._unsubscribe = unsub;
      }).catch(() => {
      });
    }
    _setupResizeObserver() {
      if (!window.ResizeObserver) return;
      this._resizeObserver = new ResizeObserver(() => {
        this._applyLayoutSizing();
        if (this._lastHistResult !== null) {
          this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0, this._lastT1);
        }
      });
      this._resizeObserver.observe(this);
    }
    _applyLayoutSizing() {
      const body = this.shadowRoot?.querySelector(".card-body");
      if (!body) return;
      const gridRows = this._gridRows();
      if (!this._config?.show_records) {
        body.style.setProperty("--hr-body-rows", String(gridRows));
        return;
      }
      const totalRows = Math.max(3, gridRows);
      const bodyRows = Math.max(2, this._bodyRows(totalRows));
      body.style.setProperty("--hr-body-rows", String(bodyRows));
    }
    _gridRows() {
      const raw = getComputedStyle(this).getPropertyValue("--row-size").trim();
      const rows = Number.parseInt(raw, 10);
      if (Number.isFinite(rows) && rows > 0) return rows;
      return this._config?.show_records ? 3 : 2;
    }
    _bodyRows(totalRows) {
      if (!this._config?.show_records) return totalRows;
      return Math.min(totalRows - 1, 2 + Math.floor(Math.max(0, totalRows - 3) / 4));
    }
    _visibleEvents(events) {
      return events.filter((ev) => !this._hiddenEventIds.has(ev.id));
    }
    _toggleEventVisibility(eventId) {
      const next = new Set(this._hiddenEventIds);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      this._hiddenEventIds = next;
      if (this._lastHistResult !== null) {
        this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0, this._lastT1);
      }
    }
    _navigateToEventHistory(ev) {
      navigateToDataPointsHistory$1(
        this,
        {
          entity_id: [this._config?.entity, ...ev?.entity_ids || []].filter(Boolean),
          device_id: ev?.device_ids || [],
          area_id: ev?.area_ids || [],
          label_id: ev?.label_ids || []
        },
        {
          start_time: Number.isFinite(this._lastT0) ? new Date(this._lastT0).toISOString() : null,
          end_time: Number.isFinite(this._lastT1) ? new Date(this._lastT1).toISOString() : null
        }
      );
    }
    _getHistoryStatesForEntity(entityId, histResult) {
      if (!histResult) return [];
      const r2 = histResult;
      if (Array.isArray(r2?.[entityId])) return r2[entityId];
      if (Array.isArray(r2)) {
        if (Array.isArray(r2[0])) return r2[0] || [];
        if (r2.every((e2) => e2 && typeof e2 === "object" && !Array.isArray(e2))) {
          return r2.filter((e2) => e2.entity_id === entityId);
        }
      }
      if (r2 && typeof r2 === "object") {
        if (Array.isArray(r2.result?.[entityId])) return r2.result[entityId];
        if (Array.isArray(r2.result?.[0])) return r2.result[0] || [];
      }
      return [];
    }
    async _load() {
      if (!this._hass) return;
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getTime() - this._config.hours_to_show * 3600 * 1e3);
      const t0 = start.getTime();
      const t1 = now.getTime();
      const entityIds = [this._config.entity];
      try {
        const [histResult, events] = await Promise.all([
          this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: start.toISOString(),
            end_time: now.toISOString(),
            entity_ids: entityIds,
            include_start_time_state: true,
            significant_changes_only: false,
            no_attributes: true
          }),
          fetchEvents$1(this._hass, start.toISOString(), now.toISOString(), entityIds)
        ]);
        this._annPage = 0;
        this._drawChart(histResult || {}, events || [], t0, t1);
      } catch (err) {
        this._loadMessage = "Failed to load data.";
        logger$1.error("[hass-datapoints sensor-card]", err);
      }
    }
    _drawChart(histResult, events, t0, t1) {
      this._lastHistResult = histResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;
      const canvas = this.shadowRoot?.querySelector("canvas#chart");
      const wrap = this.shadowRoot?.querySelector(".chart-wrap");
      if (!canvas || !wrap) return;
      const { w, h: h2 } = setupCanvas(canvas, wrap, 220);
      const renderer = new ChartRenderer(canvas, w, h2);
      const topPadPx = Math.max(6, Math.round(h2 * 0.05));
      renderer.pad = { top: topPadPx, right: 0, bottom: 0, left: 0 };
      renderer.clear();
      const entityId = this._config.entity;
      const lineColor = this._config.graph_color || COLORS[0];
      const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
      const stateList = this._getHistoryStatesForEntity(entityId, histResult);
      const pts = [];
      const allVals = [];
      for (const s2 of stateList) {
        const v2 = parseFloat(s2.s);
        if (!Number.isNaN(v2)) {
          pts.push([Math.round(s2.lu * 1e3), v2]);
          allVals.push(v2);
        }
      }
      if (!allVals.length) {
        this._loadMessage = "No numeric data in the selected time range.";
        this._chartReady = false;
        this._annEvents = events;
        return;
      }
      this._loadMessage = "";
      this._chartReady = true;
      const series = [{ entityId, pts, color: lineColor }];
      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const range = vMax - vMin;
      const chartMin = vMin - (range * 0.03 || 0.2);
      const chartMax = vMax + (range * 0.54 || 0.8);
      for (const s2 of series) {
        renderer.drawLine(s2.pts, s2.color, t0, t1, chartMin, chartMax, { fillAlpha: 0.18 });
        if (s2.pts.length) {
          const lastPt = s2.pts[s2.pts.length - 1];
          const prev = this._previousSeriesEndpoints.get(s2.entityId);
          if (prev && (lastPt[0] !== prev.t || lastPt[1] !== prev.v)) {
            const cx = renderer.xOf(lastPt[0], t0, t1);
            const cy = renderer.yOf(lastPt[1], chartMin, chartMax);
            renderer.drawBlip(cx, cy, s2.color);
          }
          this._previousSeriesEndpoints.set(s2.entityId, { t: lastPt[0], v: lastPt[1] });
        }
      }
      const visibleEvents = this._visibleEvents(events);
      const annotationStyle = this._config.annotation_style === "line" ? "line" : "circle";
      const hits = annotationStyle === "line" ? renderer.drawAnnotationLinesOnLine(visibleEvents, series, t0, t1, chartMin, chartMax) : renderer.drawAnnotationsOnLine(visibleEvents, series, t0, t1, chartMin, chartMax);
      const hitValues = new Map(hits.map((h22) => [h22.event.id, h22.value]));
      const enrichedEvents = visibleEvents.map((ev) => ({
        ...ev,
        chart_value: hitValues.get(ev.id),
        chart_unit: unit
      }));
      const overlay = this.shadowRoot?.querySelector(".icon-overlay");
      if (overlay) {
        overlay.innerHTML = "";
        if (annotationStyle === "circle") {
          for (const hit of hits) {
            const bgColor = hit.event.color || "#03a9f4";
            const el = document.createElement("div");
            el.className = "ann-icon";
            el.style.left = `${hit.x}px`;
            el.style.top = `${hit.y}px`;
            el.style.background = bgColor;
            el.innerHTML = `<ha-icon icon="${hit.event.icon || "mdi:bookmark"}" style="--mdc-icon-size:12px;color:${contrastColor$1(bgColor)}"></ha-icon>`;
            el.dataset.eventId = hit.event.id;
            el.addEventListener("click", (e2) => {
              e2.preventDefault();
              e2.stopPropagation();
              this._navigateToEventHistory(hit.event);
            });
            overlay.appendChild(el);
          }
        }
      }
      attachTooltipBehaviour(this, canvas, renderer, enrichedEvents, t0, t1);
      if (this._canvasClickHandler) canvas.removeEventListener("click", this._canvasClickHandler);
      this._canvasClickHandler = (e2) => {
        const rect = canvas.getBoundingClientRect();
        const x2 = e2.clientX - rect.left;
        const y2 = e2.clientY - rect.top;
        const best = hits.reduce((closest, hit) => {
          const dist = Math.hypot(hit.x - x2, hit.y - y2);
          if (dist > 18) return closest;
          if (!closest || dist < closest.dist) return { hit, dist };
          return closest;
        }, null);
        if (best) {
          e2.preventDefault();
          e2.stopPropagation();
          this._navigateToEventHistory(best.hit.event);
        }
      };
      canvas.addEventListener("click", this._canvasClickHandler);
      this._annEvents = events;
    }
    _renderAnnItem(ev) {
      const color = ev.color || "#03a9f4";
      const icon = ev.icon || "mdi:bookmark";
      const iconColor = contrastColor$1(color);
      const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
      const showAnn = this._config.records_show_full_message !== false;
      const isHidden = this._hiddenEventIds.has(ev.id);
      const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
      const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
      const isSimple = !annText;
      const timestamp = ev.timestamp;
      return b`
      <div
        class="ann-item${!showAnn && annText ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}"
        @click=${!showAnn && annText ? (e2) => {
        const item = e2.currentTarget;
        item.querySelector(".ann-note")?.classList.toggle("hidden");
      } : void 0}
      >
        <div class="ann-icon-wrap" style="background:${color}">
          <ha-icon
            class="ann-icon-main"
            .icon=${icon}
            style="--mdc-icon-size:18px;color:${iconColor}"
          ></ha-icon>
          <button
            class="ann-visibility-btn"
            type="button"
            title=${visibilityLabel}
            aria-label=${visibilityLabel}
            @click=${(e2) => {
        e2.preventDefault();
        e2.stopPropagation();
        this._toggleEventVisibility(ev.id);
      }}
          >
            <ha-icon .icon=${visibilityIcon}></ha-icon>
          </button>
        </div>
        <div class="ann-body">
          <div class="ann-header">
            <span class="ann-msg">
              ${ev.message}
              ${ev.dev ? b`<span class="ann-dev-badge">DEV</span>` : ""}
              ${annText && !showAnn ? b`<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
            </span>
            <span class="ann-time-wrap">
              <span class="ann-time" title=${fmtDateTime$1(timestamp)}>
                ${fmtRelativeTime(timestamp)}
              </span>
              <button
                class="ann-history-btn"
                type="button"
                title="Open related history"
                @click=${(e2) => {
        e2.preventDefault();
        e2.stopPropagation();
        this._navigateToEventHistory(ev);
      }}
              >
                <ha-icon icon="mdi:history"></ha-icon>
              </button>
            </span>
          </div>
          ${annText ? b`<div class="ann-note${showAnn ? "" : " hidden"}">${annText}</div>` : ""}
        </div>
      </div>
    `;
    }
    _renderAnnSection() {
      if (!this._config?.show_records) return "";
      const cfg = this._config;
      const sorted = [...this._annEvents].sort(
        (a2, b2) => new Date(b2.timestamp).getTime() - new Date(a2.timestamp).getTime()
      );
      const limited = cfg.records_limit ? sorted.slice(0, cfg.records_limit) : sorted;
      const total = limited.length;
      if (!total) {
        return b`
        <div class="ann-section">
          <div class="ann-list">
            <div class="ann-empty">No records in this time window.</div>
          </div>
        </div>
      `;
      }
      const pageSize = cfg.records_page_size;
      const totalPages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      const page = Math.min(this._annPage, totalPages - 1);
      const slice = pageSize ? limited.slice(page * pageSize, (page + 1) * pageSize) : limited;
      const showPagination = totalPages > 1;
      return b`
      <div class="ann-section">
        <div class="ann-list">
          ${slice.map((ev) => this._renderAnnItem(ev))}
        </div>
        ${showPagination ? b`
              <dp-pagination
                .page=${page}
                .totalPages=${totalPages}
                .totalItems=${total}
                label="records"
                @dp-page-change=${(e2) => {
        this._annPage = e2.detail.page;
        this.shadowRoot?.querySelector(".ann-list")?.scrollTo(0, 0);
      }}
              ></dp-pagination>
            ` : ""}
      </div>
    `;
    }
    render() {
      const stateObj = this._hass?.states?.[this._config?.entity];
      const sensorName = this._config?.name || stateObj?.attributes?.friendly_name || this._config?.entity || "—";
      const sensorValue = stateObj?.state ?? "—";
      const sensorUnit = stateObj?.attributes?.unit_of_measurement || "";
      return b`
      <ha-card>
        <div class="card-shell">
          <div class="card-body">
            <div class="header">
              <div class="name">${sensorName}</div>
              <div class="icon">
                <ha-state-icon
                  .stateObj=${stateObj}
                  .hass=${this._hass}
                ></ha-state-icon>
              </div>
            </div>
            <div class="info">
              <span class="value">${sensorValue}</span>
              <span class="measurement">${sensorUnit}</span>
            </div>
            <div class="footer">
              <div class="chart-wrap">
                <div class="chart-viewport">
                  ${!this._chartReady ? b`<div class="chart-loading">${this._loadMessage}</div>` : ""}
                  <canvas
                    id="chart"
                    style=${this._chartReady ? "" : "display:none"}
                  ></canvas>
                  <div class="icon-overlay"></div>
                </div>
                <div class="tooltip" id="tooltip">
                  <div class="tt-time" id="tt-time"></div>
                  <div class="tt-value" id="tt-value" style="display:none"></div>
                  <div style="display:flex;align-items:flex-start;gap:4px">
                    <span class="tt-dot" id="tt-dot"></span>
                    <span class="tt-message" id="tt-message"></span>
                  </div>
                  <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
                  <div class="tt-entities" id="tt-entities" style="display:none"></div>
                </div>
              </div>
            </div>
          </div>
          ${this._renderAnnSection()}
        </div>
      </ha-card>
    `;
    }
    updated() {
      this._applyLayoutSizing();
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-sensor-card-editor");
    }
    static getStubConfig() {
      return { entity: "sensor.example", hours_to_show: 24 };
    }
    getGridOptions() {
      const rows = this._config?.show_records ? 3 : 2;
      return { rows, min_rows: rows, max_rows: rows };
    }
  }
  class HassRecordsStatisticsCard extends ChartCardBase {
    setConfig(config) {
      if (!config.entity && !config.entities) {
        throw new Error("hass-datapoints-statistics-card: define `entity` or `entities`");
      }
      this._config = {
        hours_to_show: 24,
        period: "hour",
        stat_types: ["mean"],
        ...config
      };
    }
    get _statIds() {
      const ids = [];
      const addId = (value) => {
        const resolved = typeof value === "string" ? value : value?.entity || value?.entity_id || value?.statistics_id || "";
        if (resolved) ids.push(resolved);
      };
      addId(this._config.entity);
      (this._config.entities || []).forEach(addId);
      return [...new Set(ids)];
    }
    get _entityIds() {
      return this._statIds;
    }
    async _load() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now - this._config.hours_to_show * 3600 * 1e3);
      const t0 = start.getTime();
      const t1 = now.getTime();
      const requestId2 = ++this._loadRequestId;
      this._setChartLoading(true);
      this._setChartMessage("");
      this._drawEmptyChartFrame(t0, t1);
      const partial = {
        statsResult: null,
        events: null,
        statsDone: false,
        eventsDone: false,
        statsFailed: false
      };
      const maybeDraw = () => {
        if (requestId2 !== this._loadRequestId) return;
        const hasDrawableData = this._hasDrawableStatisticsData(partial.statsResult || {});
        if (!hasDrawableData && !partial.statsDone) return;
        this._drawChart(
          partial.statsResult || {},
          partial.events || [],
          t0,
          t1,
          { loading: !(partial.statsDone && partial.eventsDone) }
        );
      };
      const finalize = () => {
        if (requestId2 !== this._loadRequestId) return;
        if (!(partial.statsDone && partial.eventsDone)) return;
        if (partial.statsFailed && partial.statsResult == null) {
          this._setChartMessage("Failed to load statistics.");
          this._setChartLoading(false);
        }
      };
      try {
        fetchStatisticsDuringPeriod(
          this._hass,
          start.toISOString(),
          now.toISOString(),
          this._statIds,
          {
            period: this._config.period,
            types: this._config.stat_types,
            units: {}
          }
        ).then((statsResult) => {
          partial.statsResult = statsResult || {};
          partial.statsDone = true;
          maybeDraw();
          finalize();
        }).catch((err) => {
          partial.statsDone = true;
          partial.statsFailed = true;
          console.error("[hass-datapoints statistics-card] statistics load failed", err);
          maybeDraw();
          finalize();
        });
        fetchEvents$1(this._hass, start.toISOString(), now.toISOString(), this._statIds).then((events) => {
          partial.events = events || [];
          partial.eventsDone = true;
          maybeDraw();
          finalize();
        }).catch((err) => {
          partial.eventsDone = true;
          console.error("[hass-datapoints statistics-card] event load failed", err);
          maybeDraw();
          finalize();
        });
      } catch (err) {
        this._setChartMessage("Failed to load statistics.");
        this._setChartLoading(false);
        console.error("[hass-datapoints statistics-card]", err);
      }
    }
    _drawEmptyChartFrame(t0, t1) {
      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      if (!canvas || !wrap) return;
      const { w, h: h2 } = setupCanvas(canvas, wrap, 220);
      const renderer = new ChartRenderer(canvas, w, h2);
      renderer.labelColor = resolveChartLabelColor(this);
      renderer.clear();
      renderer.drawGrid(t0, t1, [{ key: "placeholder", min: 0, max: 1, side: "left", unit: "", color: null }], void 0, 5, { fixedAxisOverlay: true });
      renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
    }
    _hasDrawableStatisticsData(statsResult = {}) {
      return Object.values(statsResult || {}).some((entries) => Array.isArray(entries) && entries.length > 0);
    }
    _drawChart(statsResult, events, t0, t1, options = {}) {
      this._lastHistResult = statsResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;
      this._lastDrawArgs = [statsResult, events, t0, t1, options];
      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const { w, h: h2 } = setupCanvas(canvas, wrap, 220);
      const renderer = new ChartRenderer(canvas, w, h2);
      renderer.labelColor = resolveChartLabelColor(this);
      renderer.clear();
      const series = [];
      const allVals = [];
      let colorIdx = 0;
      for (const [statId, entries] of Object.entries(statsResult)) {
        for (const statType of this._config.stat_types) {
          const pts = [];
          for (const entry of entries) {
            const v2 = entry[statType];
            if (v2 === null || v2 === void 0) continue;
            const tRaw = entry.start;
            let t2;
            if (typeof tRaw === "number") {
              t2 = tRaw > 1e11 ? tRaw : tRaw * 1e3;
            } else {
              t2 = new Date(tRaw).getTime();
            }
            pts.push([t2, v2]);
            allVals.push(v2);
          }
          if (pts.length) {
            series.push({
              label: `${statId} (${statType})`,
              unit: this._hass?.states?.[statId]?.attributes?.unit_of_measurement || "",
              pts,
              color: COLORS[colorIdx % COLORS.length]
            });
            colorIdx++;
          }
        }
      }
      if (!allVals.length) {
        this._setChartLoading(!!options.loading);
        this._setChartMessage(options.loading ? "" : "No statistics available in the selected time range.");
        return;
      }
      this._setChartLoading(!!options.loading);
      this._setChartMessage("");
      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const vPad = (vMax - vMin) * 0.1 || 1;
      const chartMin = vMin - vPad;
      const chartMax = vMax + vPad;
      renderer.drawGrid(t0, t1, chartMin, chartMax, 5, { fixedAxisOverlay: true });
      renderChartAxisOverlays(this, renderer, renderer._activeAxes || []);
      for (const s2 of series) {
        renderer.drawLine(s2.pts, s2.color, t0, t1, chartMin, chartMax);
      }
      renderer.drawAnnotations(events, t0, t1);
      const legendEl = this.shadowRoot.getElementById("legend");
      legendEl.innerHTML = series.map(
        (s2) => `
        <div class="legend-item">
          <div class="legend-line" style="background:${esc$1(s2.color)}"></div>
          ${esc$1(s2.label)}
        </div>`
      ).join("") + (events.length ? `<div class="legend-item">
             <svg width="10" height="10" viewBox="-5 -5 10 10" style="flex-shrink:0">
               <polygon points="0,-4 4,0 0,4 -4,0" fill="#03a9f4"/>
             </svg>
             ${events.length} event${events.length !== 1 ? "s" : ""}
           </div>` : "");
      attachLineChartHover(this, canvas, renderer, series, events, t0, t1, chartMin, chartMax);
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-statistics-card-editor");
    }
    static getStubConfig() {
      return {
        title: "Statistics with Events",
        entity: "sensor.example",
        hours_to_show: 168,
        period: "hour",
        stat_types: ["mean"]
      };
    }
  }
  const styles$n = i$5`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
  }

  .history-target-row {
    display: grid;
    position: relative;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "handle name actions"
      ". analysis analysis";
    gap: var(--dp-spacing-sm);
    align-items: center;
    margin: 0;
    padding: calc(var(--spacing, 8px) * 1.125) calc(var(--spacing, 8px) * 1.25);
    border-radius: 16px;
    background: var(--card-background-color, #fff);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    transition: border-color 140ms ease, background-color 140ms ease;
    padding-bottom: 0;
    padding-left: 3px;
  }

  .history-target-row.analysis-open {
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
  }

  .history-target-row.is-hidden {
    opacity: 0.62;
  }

  .history-target-row:hover {
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, var(--divider-color, rgba(0, 0, 0, 0.12)));
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 2%, var(--card-background-color, #fff));
  }

  .history-target-row.is-dragging {
    opacity: 0.35;
  }

  .history-target-row.is-drag-over-before {
    box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-row.is-drag-over-after {
    box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-drag-handle {
    grid-area: handle;
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--secondary-text-color);
    opacity: 0;
    transition: opacity 140ms ease, background-color 120ms ease;
    touch-action: none;
    margin-right: calc(var(--dp-spacing-xs) * -0.5);
    margin-left: -8px;
    position: absolute;
  }

  .history-target-drag-handle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    pointer-events: none;
  }

  .history-target-row:hover .history-target-drag-handle {
    opacity: 0.45;
  }

  .history-target-drag-handle:hover,
  .history-target-drag-handle:focus-visible {
    opacity: 1;
    outline: none;
  }


  .history-target-name {
    grid-area: name;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--dp-spacing-sm);
    align-items: center;
  }

  .history-target-name-text {
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .history-target-entity-id {
    margin-top: 4px;
    font-size: 0.74rem;
    font-weight: 400;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-target-color-field {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    overflow: hidden;
  }

  .history-target-controls {
    display: contents;
  }

  .history-target-color-icon {
    position: absolute;
    inset: 0;
    display: inline-grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: var(--row-icon-color, var(--text-primary-color, #fff));
    pointer-events: none;
    z-index: 1;
  }

  .history-target-color-icon ha-state-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .history-target-color {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 10px;
    padding: 0;
    background: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    opacity: 0;
    z-index: 2;
  }

  .history-target-color::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .history-target-color::-webkit-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color::-moz-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color-field::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--row-color, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, rgba(0, 0, 0, 0.18) 70%, transparent);
  }

  .history-target-color:focus-visible + .history-target-color-icon {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
    outline-offset: 2px;
    border-radius: inherit;
  }

  .history-target-actions {
    grid-area: actions;
    justify-self: end;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }

  .history-target-analysis-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease;
  }

  .history-target-analysis-toggle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    transition: transform 120ms ease;
  }

  .history-target-analysis-toggle.is-open ha-icon {
    transform: rotate(180deg);
  }

  .history-target-analysis-toggle:hover,
  .history-target-analysis-toggle:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }

  .history-target-visible-toggle {
    position: relative;
    display: inline-flex;
    width: 34px;
    height: 20px;
    flex: 0 0 auto;
    cursor: pointer;
  }

  .history-target-visible-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }

  .history-target-visible-toggle-track {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
    transition: background-color 120ms ease;
  }

  .history-target-visible-toggle-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: transform 120ms ease;
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track {
    background: var(--primary-color);
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track::after {
    transform: translateX(14px);
  }

  .history-target-visible-toggle input:focus-visible + .history-target-visible-toggle-track {
    outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
    outline-offset: 2px;
  }

  .history-target-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    min-width: 16px;
    line-height: 16px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .history-target-remove ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .history-target-remove:hover,
  .history-target-remove:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
    color: var(--error-color, #db4437);
    outline: none;
  }

  /* ── Analysis panel ─────────────────────────────────────── */

  .history-target-analysis {
    grid-area: analysis;
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: calc(var(--spacing, 8px) * 0.25);
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 78%, transparent);
  }

  .history-target-analysis-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
  }

  .history-target-analysis-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: none;
    border-radius: 6px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
    color: var(--primary-color, #03a9f4);
    font-size: 0.78rem;
    font: inherit;
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .history-target-analysis-copy-btn:hover,
  .history-target-analysis-copy-btn:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 20%, transparent);
  }

  .history-target-analysis-copy-btn ha-icon {
    --mdc-icon-size: 14px;
  }

  .history-target-analysis-grid {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: var(--dp-spacing-sm);
  }

  .history-target-analysis-option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .history-target-analysis-option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .history-target-analysis-option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .analysis-computing-spinner {
    display: none;
    width: 10px;
    height: 10px;
    border: 2px solid var(--divider-color, #ccc);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: analysis-spin 0.7s linear infinite;
    flex-shrink: 0;
    margin-left: 2px;
  }

  .analysis-computing-spinner.active {
    display: inline-block;
  }

  @keyframes analysis-spin {
    to { transform: rotate(360deg); }
  }
`;
  const sharedStyles = i$5`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .field {
    display: grid;
    gap: 4px;
    justify-items: start;
  }

  .field-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--secondary-text-color);
  }

  .select,
  .input {
    width: auto;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--spacing, 8px) * 0.75) calc(var(--spacing, 8px) * 0.875);
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.84rem;
  }

  .toggle-group {
    display: flex;
    gap: calc(var(--spacing, 8px) * 0.625);
    align-items: center;
  }

  .option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }
`;
  const styles$m = i$5``;
  const styles$l = i$5`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .group {
    display: grid;
    gap: var(--dp-spacing-sm);
    border-radius: 6px;
  }

  .group-body {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
    padding-left: var(--dp-spacing-md);
  }

  .option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .option.top {
    align-items: flex-start;
  }

  .option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }
`;
  class DpAnalysisGroup extends i$2 {
    static properties = {
      label: { type: String },
      checked: { type: Boolean },
      disabled: { type: Boolean },
      alignTop: { type: Boolean, attribute: "align-top" }
    };
    static styles = styles$l;
    constructor() {
      super();
      this.label = "";
      this.checked = false;
      this.disabled = false;
      this.alignTop = false;
    }
    _onChange(e2) {
      const checked = e2.target.checked;
      this.checked = checked;
      this.dispatchEvent(
        new CustomEvent("dp-group-change", {
          detail: { checked },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      const groupClass = ["group", this.checked ? "is-open" : ""].filter(Boolean).join(" ");
      const optionClass = [
        "option",
        this.alignTop ? "top" : "",
        this.disabled ? "is-disabled" : ""
      ].filter(Boolean).join(" ");
      return b`
      <div class=${groupClass}>
        <label class=${optionClass}>
          <input
            type="checkbox"
            .checked=${this.checked}
            ?disabled=${this.disabled}
            @change=${this._onChange}
          >
          <span><slot name="label">${this.label}</slot><slot name="hint"></slot></span>
        </label>
        ${this.checked ? b`
          <div class="group-body">
            <slot></slot>
          </div>
        ` : A}
      </div>
    `;
    }
  }
  customElements.define("dp-analysis-group", DpAnalysisGroup);
  const ANALYSIS_TREND_METHOD_OPTIONS$1 = [
    { value: "rolling_average", label: "Rolling average" },
    { value: "linear_trend", label: "Linear trend" }
  ];
  const ANALYSIS_TREND_WINDOW_OPTIONS$1 = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "14d", label: "14 days" },
    { value: "21d", label: "21 days" },
    { value: "28d", label: "28 days" }
  ];
  class DpAnalysisTrendGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" }
    };
    static styles = [sharedStyles, styles$m];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _renderSelect(key, options, value) {
      return b`
      <select class="select" @change=${(e2) => this._emit(key, e2.target.value)}>
        ${options.map((opt) => b`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
    }
    _onGroupChange(e2) {
      this._emit("show_trend_lines", e2.detail.checked);
    }
    _onCheckbox(key, e2) {
      this._emit(key, e2.target.checked);
    }
    render() {
      const a2 = this.analysis;
      return b`
      <dp-analysis-group
        .label=${"Show trend lines"}
        .checked=${a2.show_trend_lines}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input type="checkbox" .checked=${a2.show_trend_crosshairs} @change=${(e2) => this._onCheckbox("show_trend_crosshairs", e2)}>
          <span>Show trend crosshairs</span>
        </label>
        <label class="field">
          <span class="field-label">Trend method</span>
          ${this._renderSelect("trend_method", ANALYSIS_TREND_METHOD_OPTIONS$1, a2.trend_method)}
        </label>
        ${a2.trend_method === "rolling_average" ? b`
          <label class="field">
            <span class="field-label">Trend window</span>
            ${this._renderSelect("trend_window", ANALYSIS_TREND_WINDOW_OPTIONS$1, a2.trend_window)}
          </label>
        ` : A}
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-trend-group", DpAnalysisTrendGroup);
  const styles$k = i$5``;
  class DpAnalysisSummaryGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" }
    };
    static styles = [sharedStyles, styles$k];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _onGroupChange(e2) {
      this._emit("show_summary_stats", e2.detail.checked);
    }
    _onCheckbox(key, e2) {
      this._emit(key, e2.target.checked);
    }
    render() {
      const a2 = this.analysis;
      return b`
      <dp-analysis-group
        .label=${"Show min / max / mean"}
        .checked=${a2.show_summary_stats}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${a2.show_summary_stats_shading}
            @change=${(e2) => this._onCheckbox("show_summary_stats_shading", e2)}
          >
          <span>Show range shading</span>
        </label>
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-summary-group", DpAnalysisSummaryGroup);
  const styles$j = i$5``;
  const ANALYSIS_RATE_WINDOW_OPTIONS$1 = [
    { value: "point_to_point", label: "Point to point" },
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" }
  ];
  class DpAnalysisRateGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" }
    };
    static styles = [sharedStyles, styles$j];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _renderSelect(key, options, value) {
      return b`
      <select class="select" @change=${(e2) => this._emit(key, e2.target.value)}>
        ${options.map((opt) => b`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
    }
    _onGroupChange(e2) {
      this._emit("show_rate_of_change", e2.detail.checked);
    }
    render() {
      const a2 = this.analysis;
      return b`
      <dp-analysis-group
        .label=${"Show rate of change"}
        .checked=${a2.show_rate_of_change}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">Rate window</span>
          ${this._renderSelect("rate_window", ANALYSIS_RATE_WINDOW_OPTIONS$1, a2.rate_window)}
        </label>
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-rate-group", DpAnalysisRateGroup);
  const styles$i = i$5``;
  class DpAnalysisThresholdGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" },
      unit: { type: String }
    };
    static styles = [sharedStyles, styles$i];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
      this.unit = "";
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _renderSelect(key, options, value) {
      return b`
      <select class="select" @change=${(e2) => this._emit(key, e2.target.value)}>
        ${options.map((opt) => b`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
    }
    _onGroupChange(e2) {
      this._emit("show_threshold_analysis", e2.detail.checked);
    }
    _onCheckbox(key, e2) {
      this._emit(key, e2.target.checked);
    }
    _onInput(key, e2) {
      this._emit(key, e2.target.value);
    }
    render() {
      const a2 = this.analysis;
      return b`
      <dp-analysis-group
        .label=${"Show threshold analysis"}
        .checked=${a2.show_threshold_analysis}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input type="checkbox" .checked=${a2.show_threshold_shading} @change=${(e2) => this._onCheckbox("show_threshold_shading", e2)}>
          <span>Shade threshold area</span>
        </label>
        <label class="field">
          <span class="field-label">Threshold</span>
          <div class="toggle-group">
            <input class="input" type="number" step="any" inputmode="decimal"
              .value=${a2.threshold_value} placeholder="Threshold"
              @change=${(e2) => this._onInput("threshold_value", e2)}>
            ${this.unit ? b`<span>${this.unit}</span>` : A}
          </div>
        </label>
        ${a2.show_threshold_shading ? b`
          <label class="field">
            <span class="field-label">Shade area</span>
            ${this._renderSelect("threshold_direction", [
        { value: "above", label: "Shade above" },
        { value: "below", label: "Shade below" }
      ], a2.threshold_direction)}
          </label>
        ` : A}
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-threshold-group", DpAnalysisThresholdGroup);
  const styles$h = i$5`
  .method-list {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  .method-item {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  .method-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--secondary-text-color, #888);
    background: transparent;
    color: var(--secondary-text-color, #888);
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: default;
    padding: 0;
    vertical-align: middle;
  }
`;
  const styles$g = i$5`
  :host {
    display: block;
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .subopts {
    padding-left: calc(var(--spacing, 8px) * 1.5);
    display: grid;
    gap: var(--dp-spacing-sm);
    justify-items: start;
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
  }
`;
  class DpAnalysisMethodSubopts extends i$2 {
    static styles = styles$g;
    render() {
      return b`<div class="subopts"><slot></slot></div>`;
    }
  }
  customElements.define("dp-analysis-method-subopts", DpAnalysisMethodSubopts);
  const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS$1 = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];
  const ANALYSIS_ANOMALY_METHOD_OPTIONS$1 = [
    { value: "trend_residual", label: "Trend deviation", help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline." },
    { value: "rate_of_change", label: "Sudden change", help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions." },
    { value: "iqr", label: "Statistical outlier (IQR)", help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages." },
    { value: "rolling_zscore", label: "Rolling Z-score", help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series." },
    { value: "persistence", label: "Flat-line / stuck value", help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings." },
    { value: "comparison_window", label: "Comparison window deviation", help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year." }
  ];
  const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS$1 = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS$1 = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" }
  ];
  const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS$1 = [
    { value: "30m", label: "30 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "3h", label: "3 hours" },
    { value: "6h", label: "6 hours" },
    { value: "12h", label: "12 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS$2 = [
    { value: "all", label: "Show all anomalies" },
    { value: "highlight", label: "Highlight overlaps" },
    { value: "only", label: "Overlaps only" }
  ];
  class DpAnalysisAnomalyGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" },
      comparisonWindows: { type: Array, attribute: "comparison-windows" }
    };
    static styles = [sharedStyles, styles$h];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
      this.comparisonWindows = [];
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _renderSelect(key, options, value) {
      return b`
      <select class="select" @change=${(e2) => this._emit(key, e2.target.value)}>
        ${options.map((opt) => b`<option value=${opt.value} ?selected=${opt.value === value}>${opt.label}</option>`)}
      </select>
    `;
    }
    _onGroupChange(e2) {
      this._emit("show_anomalies", e2.detail.checked);
    }
    _renderMethodSubopts(opt, a2) {
      if (opt.value === "rate_of_change") {
        return b`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Rate window</span>
            ${this._renderSelect("anomaly_rate_window", ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS$1, a2.anomaly_rate_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
      }
      if (opt.value === "rolling_zscore") {
        return b`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Rolling window</span>
            ${this._renderSelect("anomaly_zscore_window", ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS$1, a2.anomaly_zscore_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
      }
      if (opt.value === "persistence") {
        return b`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Min flat duration</span>
            ${this._renderSelect("anomaly_persistence_window", ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS$1, a2.anomaly_persistence_window)}
          </label>
        </dp-analysis-method-subopts>
      `;
      }
      if (opt.value === "comparison_window") {
        return b`
        <dp-analysis-method-subopts>
          <label class="field">
            <span class="field-label">Compare to window</span>
            <select class="select" @change=${(e2) => this._emit("anomaly_comparison_window_id", e2.target.value)}>
              <option value="" ?selected=${!a2.anomaly_comparison_window_id}>— select window —</option>
              ${this.comparisonWindows.map((win) => b`
                <option value=${win.id} ?selected=${a2.anomaly_comparison_window_id === win.id}>${win.label || win.id}</option>
              `)}
            </select>
          </label>
        </dp-analysis-method-subopts>
      `;
      }
      return A;
    }
    render() {
      const a2 = this.analysis;
      return b`
      <dp-analysis-group
        .label=${"Show anomalies"}
        .checked=${a2.show_anomalies}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">Sensitivity</span>
          ${this._renderSelect("anomaly_sensitivity", ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS$1, a2.anomaly_sensitivity)}
        </label>
        <div class="method-list">
          ${ANALYSIS_ANOMALY_METHOD_OPTIONS$1.map((opt) => {
        const isChecked = Array.isArray(a2.anomaly_methods) && a2.anomaly_methods.includes(opt.value);
        return b`
              <div class="method-item">
                <label class="option">
                  <input type="checkbox" .checked=${isChecked}
                    @change=${(e2) => this._emit(`anomaly_method_toggle_${opt.value}`, e2.target.checked)}>
                  <span>${opt.label}</span>
                  ${opt.help ? b`<span class="method-help" tabindex="0">?</span>` : A}
                </label>
                ${isChecked ? this._renderMethodSubopts(opt, a2) : A}
              </div>
            `;
      })}
        </div>
        ${Array.isArray(a2.anomaly_methods) && a2.anomaly_methods.length >= 2 ? b`
          <label class="field">
            <span class="field-label">When methods overlap</span>
            ${this._renderSelect("anomaly_overlap_mode", ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS$2, a2.anomaly_overlap_mode)}
          </label>
        ` : A}
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-anomaly-group", DpAnalysisAnomalyGroup);
  const styles$f = i$5`
  .help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }
`;
  class DpAnalysisDeltaGroup extends i$2 {
    static properties = {
      analysis: { type: Object },
      entityId: { type: String, attribute: "entity-id" },
      canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" }
    };
    static styles = [sharedStyles, styles$f];
    constructor() {
      super();
      this.analysis = {};
      this.entityId = "";
      this.canShowDeltaAnalysis = false;
    }
    _emit(key, value) {
      this.dispatchEvent(
        new CustomEvent("dp-group-analysis-change", {
          detail: { entityId: this.entityId, key, value },
          bubbles: true,
          composed: true
        })
      );
    }
    _onGroupChange(e2) {
      this._emit("show_delta_analysis", e2.detail.checked);
    }
    _onCheckbox(key, e2) {
      this._emit(key, e2.target.checked);
    }
    render() {
      const a2 = this.analysis;
      const isOpen = a2.show_delta_analysis && this.canShowDeltaAnalysis;
      return b`
      <dp-analysis-group
        .label=${"Show delta vs selected date window"}
        .checked=${isOpen}
        .disabled=${!this.canShowDeltaAnalysis}
        .alignTop=${true}
        @dp-group-change=${this._onGroupChange}
      >
        ${!this.canShowDeltaAnalysis ? b`
          <span slot="hint"><br /><span class="help-text">Select a date window tab to enable delta analysis.</span></span>
        ` : A}
        <label class="option">
          <input type="checkbox" .checked=${a2.show_delta_tooltip} @change=${(e2) => this._onCheckbox("show_delta_tooltip", e2)}>
          <span>Show delta in tooltip</span>
        </label>
        <label class="option">
          <input type="checkbox" .checked=${a2.show_delta_lines} @change=${(e2) => this._onCheckbox("show_delta_lines", e2)}>
          <span>Show delta lines</span>
        </label>
      </dp-analysis-group>
    `;
    }
  }
  customElements.define("dp-analysis-delta-group", DpAnalysisDeltaGroup);
  function deriveSwatchIconColor(color) {
    const hex = String(color || "").trim();
    const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
    if (!normalizedHex) {
      return "#ffffff";
    }
    const channels = normalizedHex.slice(1).match(/.{2}/g)?.map((p2) => parseInt(p2, 16));
    if (!channels || channels.length !== 3) {
      return "#ffffff";
    }
    const [r2, g2, b2] = channels;
    const luminance = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;
    const mixTarget = luminance > 0.62 ? 0 : 255;
    const mixStrength = luminance > 0.62 ? Math.min(0.82, 0.35 + (luminance - 0.62) * 1.6) : Math.min(0.78, 0.4 + (0.62 - luminance) * 0.9);
    const mixed = [r2, g2, b2].map(
      (c2) => Math.max(0, Math.min(255, Math.round(c2 * (1 - mixStrength) + mixTarget * mixStrength)))
    );
    return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  }
  function _hasConfiguredAnalysis(a2) {
    return a2.show_trend_lines || a2.show_summary_stats || a2.show_rate_of_change || a2.show_threshold_analysis || a2.show_anomalies || a2.show_delta_analysis || a2.hide_source_series;
  }
  function _hasActiveAnalysis(a2, hasComparisonWindow) {
    return a2.show_trend_lines || a2.show_summary_stats || a2.show_rate_of_change || a2.show_threshold_analysis || a2.show_anomalies || a2.show_delta_analysis && hasComparisonWindow;
  }
  class DpTargetRow extends i$2 {
    static properties = {
      color: { type: String },
      visible: { type: Boolean },
      analysis: { type: Object },
      index: { type: Number },
      canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" },
      stateObj: { type: Object, attribute: false },
      hass: { type: Object, attribute: false },
      comparisonWindows: { type: Array, attribute: "comparison-windows" }
    };
    static styles = styles$n;
    constructor() {
      super();
      this.color = "#03a9f4";
      this.visible = true;
      this.analysis = {};
      this.index = 0;
      this.canShowDeltaAnalysis = false;
      this.stateObj = null;
      this.hass = null;
      this.comparisonWindows = [];
    }
    /** Entity ID derived from the HA state object. */
    get _entityId() {
      return this.stateObj?.entity_id ?? "";
    }
    /** Display name derived from the HA state object, falling back to the entity ID. */
    get _entityName() {
      return this.stateObj?.attributes?.friendly_name ?? this._entityId;
    }
    /** Unit of measurement derived from the HA state object. */
    get _unit() {
      return this.stateObj?.attributes?.unit_of_measurement ?? "";
    }
    get _supportsAnalysis() {
      return typeof this._entityId === "string" && !this._entityId.startsWith("binary_sensor.");
    }
    _emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    _onColorChange(e2) {
      this._emit("dp-row-color-change", { index: this.index, color: e2.target.value });
    }
    _onVisibilityChange(e2) {
      this._emit("dp-row-visibility-change", { entityId: this._entityId, visible: e2.target.checked });
    }
    _onAnalysisToggle() {
      this._emit("dp-row-toggle-analysis", { entityId: this._entityId });
    }
    _onRemove() {
      this._emit("dp-row-remove", { index: this.index });
    }
    _onCheckbox(key, e2) {
      this._emit("dp-row-analysis-change", { entityId: this._entityId, key, value: e2.target.checked });
    }
    _onCopyAnalysisToAll() {
      this._emit("dp-row-copy-analysis-to-all", { entityId: this._entityId, analysis: this.analysis });
    }
    _onGroupAnalysisChange(e2) {
      this._emit("dp-row-analysis-change", e2.detail);
    }
    render() {
      const a2 = this.analysis || {};
      const hasConfigured = _hasConfiguredAnalysis(a2);
      const hasActive = _hasActiveAnalysis(a2, this.canShowDeltaAnalysis);
      const rowClass = [
        "history-target-row",
        this.visible === false ? "is-hidden" : "",
        this.analysis?.expanded ? "analysis-open" : ""
      ].filter(Boolean).join(" ");
      return b`
      <div class=${rowClass} role="row">
        <button
          type="button"
          class="history-target-drag-handle"
          draggable="true"
          aria-label="Drag to reorder ${this._entityName}"
          title="Drag to reorder"
        >
          <ha-icon icon="mdi:drag-vertical"></ha-icon>
        </button>

        <div class="history-target-name" role="cell" title=${this._entityName}>
          <div class="history-target-controls">
            <label
              class="history-target-color-field"
              style="--row-color:${this.color};--row-icon-color:${deriveSwatchIconColor(this.color)}"
            >
              <input
                type="color"
                class="history-target-color"
                .value=${this.color}
                aria-label="Line color for ${this._entityId}"
                @change=${this._onColorChange}
              >
              <span class="history-target-color-icon" aria-hidden="true">
                <ha-state-icon .stateObj=${this.stateObj ?? null} .hass=${this.hass ?? null}></ha-state-icon>
              </span>
            </label>
          </div>
          <div class="history-target-name-text">
            ${this._entityName}
            <div class="history-target-entity-id">${this._entityId}</div>
          </div>
        </div>

        <div class="history-target-actions" role="cell">
          ${this._supportsAnalysis ? b`
            <button
              type="button"
              class="history-target-analysis-toggle ${this.analysis?.expanded ? "is-open" : ""} ${hasConfigured ? "configured" : ""}"
              aria-label="${this.analysis?.expanded ? "Collapse" : "Expand"} analysis options for ${this._entityName}"
              aria-expanded=${this.analysis?.expanded}
              title=${hasConfigured ? "Analysis configured" : "Configure analysis"}
              @click=${this._onAnalysisToggle}
            >
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          ` : A}

          <label
            class="history-target-visible-toggle"
            title="${this.visible === false ? "Show" : "Hide"} ${this._entityName}"
          >
            <input
              type="checkbox"
              aria-label="Show ${this._entityName} on chart"
              .checked=${this.visible !== false}
              @change=${this._onVisibilityChange}
            >
            <span class="history-target-visible-toggle-track"></span>
          </label>

          <button
            type="button"
            class="history-target-remove"
            aria-label="Remove ${this._entityId}"
            @click=${this._onRemove}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        ${this._supportsAnalysis && this.analysis?.expanded ? b`
          <div class="history-target-analysis" role="cell">
            <div class="history-target-analysis-grid">
              <dp-analysis-trend-group
                .analysis=${a2}
                .entityId=${this._entityId}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-trend-group>
              <dp-analysis-summary-group
                .analysis=${a2}
                .entityId=${this._entityId}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-summary-group>
              <dp-analysis-rate-group
                .analysis=${a2}
                .entityId=${this._entityId}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-rate-group>
              <dp-analysis-threshold-group
                .analysis=${a2}
                .entityId=${this._entityId}
                .unit=${this._unit}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-threshold-group>
              <dp-analysis-anomaly-group
                .analysis=${a2}
                .entityId=${this._entityId}
                .comparisonWindows=${this.comparisonWindows}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-anomaly-group>
              <dp-analysis-delta-group
                .analysis=${a2}
                .entityId=${this._entityId}
                .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                @dp-group-analysis-change=${this._onGroupAnalysisChange}
              ></dp-analysis-delta-group>
              <div class="history-target-analysis-bottom-row">
                <label class="history-target-analysis-option ${!hasActive ? "is-disabled" : ""}">
                  <input type="checkbox" .checked=${a2.hide_source_series && hasActive}
                    ?disabled=${!hasActive}
                    @change=${(e2) => this._onCheckbox("hide_source_series", e2)}>
                  <span>Hide source series</span>
                </label>
                <button
                  type="button"
                  class="history-target-analysis-copy-btn"
                  title="Copy these analysis settings to all targets"
                  @click=${this._onCopyAnalysisToAll}
                >
                  <ha-icon icon="mdi:content-copy"></ha-icon>
                  Copy to all targets
                </button>
              </div>
            </div>
          </div>
        ` : A}
      </div>
    `;
    }
  }
  customElements.define("dp-target-row", DpTargetRow);
  const styles$e = i$5`
    :host {
        display: block;
        --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
        --dp-spacing-sm: var(--spacing, 8px);
        --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
        --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
        --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    }

    .history-target-table {
        display: grid;
    }

    .history-target-table-body {
        display: grid;
        gap: calc(var(--spacing, 8px) * 1.25);
    }

    .history-target-empty {
        padding: var(--dp-spacing-md) var(--dp-spacing-sm);
        border-radius: 12px;
        background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
        color: var(--secondary-text-color, #9e9e9e);
        font-size: 0.84rem;
    }

    /* Cursor — dragging is a list concern; cursor inherits into the row's shadow DOM */
    dp-target-row {
        cursor: grab;
    }

    dp-target-row.is-dragging {
        cursor: grabbing;
    }

    /* Drag states applied to the dp-target-row host element */

    dp-target-row {
        border-radius: 16px;
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;
    }

    dp-target-row.is-dragging {
        opacity: 0.35;
        pointer-events: none;
    }

    dp-target-row.is-drag-over-before,
    dp-target-row.is-drag-over-after {
        position: relative;
        overflow: visible;
    }

    dp-target-row.is-drag-over-before {
        border-top: 1px solid var(--primary-color, #03a9f4);
    }

    dp-target-row.is-drag-over-after {
        border-bottom: 1px solid var(--primary-color, #03a9f4);
    }

    dp-target-row .history-target-row {
        cursor: grab;
    }
`;
  class DpTargetRowList extends i$2 {
    static properties = {
      rows: { type: Array },
      states: { type: Object, attribute: false },
      hass: { type: Object, attribute: false },
      canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" },
      comparisonWindows: { type: Array, attribute: false }
    };
    /** Index of the row currently being dragged, or null when not dragging. */
    _dragSourceIndex = null;
    static styles = styles$e;
    /**
     * Optimistically toggle the expanded state of a row's analysis panel
     * immediately (before the panel's round-trip mutation arrives). This gives
     * instant visual feedback with no perceived delay.
     */
    _onToggleAnalysisFast = (e2) => {
      const entityId = String(e2?.detail?.entityId || "").trim();
      if (!entityId) {
        return;
      }
      const index = this.rows?.findIndex((r2) => r2.entity_id === entityId) ?? -1;
      if (index === -1) {
        return;
      }
      this.rows = this.rows.map((row, i2) => {
        if (i2 !== index) {
          return row;
        }
        return {
          ...row,
          analysis: {
            ...row.analysis,
            expanded: !row.analysis?.expanded
          }
        };
      });
    };
    /**
     * Optimistically apply analysis option changes immediately so sub-option
     * groups (e.g. method-specific windows) appear without waiting for the
     * panel round-trip. Handles both plain key/value changes and the special
     * `anomaly_method_toggle_*` keys used by the anomaly group.
     */
    _onRowAnalysisChangeFast = (e2) => {
      const { entityId, key, value } = e2.detail || {};
      if (!entityId || !key) {
        return;
      }
      const index = this.rows?.findIndex((r2) => r2.entity_id === entityId) ?? -1;
      if (index === -1) {
        return;
      }
      const row = this.rows[index];
      const currentAnalysis = row.analysis || {};
      let nextAnalysis;
      if (key.startsWith("anomaly_method_toggle_")) {
        const method = key.slice("anomaly_method_toggle_".length);
        const currentMethods = Array.isArray(currentAnalysis.anomaly_methods) ? currentAnalysis.anomaly_methods : [];
        const nextMethods = value === true ? [.../* @__PURE__ */ new Set([...currentMethods, method])] : currentMethods.filter((m2) => m2 !== method);
        nextAnalysis = { ...currentAnalysis, anomaly_methods: nextMethods };
      } else {
        nextAnalysis = { ...currentAnalysis, [key]: value };
      }
      this.rows = this.rows.map((r2, i2) => i2 === index ? { ...r2, analysis: nextAnalysis } : r2);
    };
    render() {
      if (!this.rows.length) {
        return b`
        <div class="history-target-table">
          <div class="history-target-empty">No data points added yet.</div>
        </div>
      `;
      }
      return b`
      <div class="history-target-table">
        <div
          class="history-target-table-body"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
          @dp-row-toggle-analysis=${this._onToggleAnalysisFast}
          @dp-row-analysis-change=${this._onRowAnalysisChangeFast}
        >
          ${this.rows.map(
        (row, index) => b`
              <dp-target-row
                draggable="true"
                .color=${row.color}
                .visible=${row.visible}
                .analysis=${row.analysis}
                .index=${index}
                .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                .stateObj=${this.states?.[row.entity_id] ?? null}
                .hass=${this.hass ?? null}
                .comparisonWindows=${this.comparisonWindows}
                data-row-index=${index}
                @dragstart=${(e2) => this._onDragStart(e2, index)}
                @dragend=${this._onDragEnd}
              ></dp-target-row>
            `
      )}
        </div>
      </div>
    `;
    }
    // ---------------------------------------------------------------------------
    // Drag-to-reorder handlers
    // ---------------------------------------------------------------------------
    _onDragStart(e2, index) {
      this._dragSourceIndex = index;
      if (e2.dataTransfer) {
        e2.dataTransfer.effectAllowed = "move";
        e2.dataTransfer.setData("text/plain", String(index));
        const rowEl = e2.currentTarget;
        const rect = rowEl.getBoundingClientRect();
        e2.dataTransfer.setDragImage(rowEl, e2.clientX - rect.left, e2.clientY - rect.top);
      }
      const target = e2.currentTarget;
      setTimeout(() => target.classList.add("is-dragging"), 0);
    }
    _onDragEnd = (e2) => {
      this._dragSourceIndex = null;
      const target = e2.currentTarget;
      target.classList.remove("is-dragging");
      this._clearDropIndicators();
    };
    _onDragOver(e2) {
      if (this._dragSourceIndex === null) return;
      e2.preventDefault();
      if (e2.dataTransfer) e2.dataTransfer.dropEffect = "move";
      const rowEl = this._rowFromEvent(e2);
      if (!rowEl) return;
      const rect = rowEl.getBoundingClientRect();
      const isAbove = e2.clientY < rect.top + rect.height / 2;
      this._clearDropIndicators();
      rowEl.classList.add(isAbove ? "is-drag-over-before" : "is-drag-over-after");
    }
    _onDragLeave(e2) {
      const rowEl = this._rowFromEvent(e2);
      if (rowEl && !rowEl.contains(e2.relatedTarget)) {
        rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");
      }
    }
    _onDrop(e2) {
      e2.preventDefault();
      const fromIndex = this._dragSourceIndex ?? parseInt(e2.dataTransfer?.getData("text/plain") ?? "", 10);
      const rowEl = this._rowFromEvent(e2);
      if (!rowEl || !Number.isFinite(fromIndex)) return;
      const toIndexRaw = parseInt(rowEl.dataset.rowIndex ?? "", 10);
      if (!Number.isFinite(toIndexRaw)) return;
      const rect = rowEl.getBoundingClientRect();
      const isAbove = e2.clientY < rect.top + rect.height / 2;
      const insertBeforeIndex = isAbove ? toIndexRaw : toIndexRaw + 1;
      const toIndex = fromIndex < insertBeforeIndex ? insertBeforeIndex - 1 : insertBeforeIndex;
      rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");
      if (fromIndex !== toIndex) {
        const newRows = [...this.rows];
        const [moved] = newRows.splice(fromIndex, 1);
        newRows.splice(toIndex, 0, moved);
        this.dispatchEvent(
          new CustomEvent("dp-rows-reorder", {
            detail: { rows: newRows },
            bubbles: true,
            composed: true
          })
        );
      }
    }
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    /** Walk the composed event path to find the nearest dp-target-row element. */
    _rowFromEvent(e2) {
      for (const node of e2.composedPath()) {
        if (node instanceof Element && node.tagName?.toLowerCase() === "dp-target-row") {
          return node;
        }
      }
      return null;
    }
    _clearDropIndicators() {
      this.shadowRoot?.querySelectorAll("dp-target-row").forEach((r2) => {
        r2.classList.remove("is-drag-over-before", "is-drag-over-after");
      });
    }
  }
  customElements.define("dp-target-row-list", DpTargetRowList);
  const styles$d = i$5`
  :host {
    display: block;
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .sidebar-options-card {
    display: grid;
    gap: var(--dp-spacing-lg);
  }
`;
  const styles$c = i$5`
  :host {
    display: block;
  }
`;
  const styles$b = i$5`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .section {
    display: grid;
    gap: var(--dp-spacing-sm);
  }
`;
  class DpSidebarSectionHeader extends i$2 {
    static properties = {
      title: { type: String },
      subtitle: { type: String },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = i$5`
    :host { display: block; }
    .sidebar-section-header { display: grid; gap: var(--dp-spacing-xs); }
    .sidebar-section-header.is-collapsible {
      cursor: pointer;
      user-select: none;
    }
    .sidebar-section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .sidebar-section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .sidebar-section-subtitle {
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .sidebar-section-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
      transition: background-color 120ms ease;
    }
    .sidebar-section-toggle:hover,
    .sidebar-section-toggle:focus-visible {
      background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    }
    .sidebar-section-toggle ha-icon {
      --mdc-icon-size: 18px;
      display: block;
      transition: transform 140ms ease;
    }
    .sidebar-section-toggle.is-open ha-icon {
      transform: rotate(180deg);
    }
  `;
    constructor() {
      super();
      this.title = "";
      this.subtitle = "";
      this.collapsible = false;
      this.open = true;
    }
    _onToggle() {
      this.dispatchEvent(new CustomEvent("dp-section-toggle", { bubbles: true, composed: true }));
    }
    render() {
      return b`
      <div class="sidebar-section-header ${this.collapsible ? "is-collapsible" : ""}">
        <div class="sidebar-section-header-row">
          <div class="sidebar-section-title">${this.title}</div>
          ${this.collapsible ? b`
            <button
              type="button"
              class="sidebar-section-toggle ${this.open ? "is-open" : ""}"
              aria-label="${this.open ? "Collapse" : "Expand"} ${this.title}"
              aria-expanded=${this.open}
              @click=${this._onToggle}
            >
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          ` : A}
        </div>
        ${this.subtitle ? b`<div class="sidebar-section-subtitle">${this.subtitle}</div>` : A}
      </div>
    `;
    }
  }
  customElements.define("dp-sidebar-section-header", DpSidebarSectionHeader);
  class DpSidebarOptionsSection extends i$2 {
    static properties = {
      title: { type: String },
      subtitle: { type: String },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = styles$b;
    constructor() {
      super();
      this.title = "";
      this.subtitle = "";
      this.collapsible = false;
      this.open = true;
    }
    _onToggle() {
      this.open = !this.open;
      this.dispatchEvent(
        new CustomEvent("dp-section-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="section">
        <dp-sidebar-section-header
          .title=${this.title}
          .subtitle=${this.subtitle}
          .collapsible=${this.collapsible}
          .open=${this.open}
          @dp-section-toggle=${this._onToggle}
        ></dp-sidebar-section-header>
        ${this.collapsible && !this.open ? A : b`<slot></slot>`}
      </div>
    `;
    }
  }
  customElements.define("dp-sidebar-options-section", DpSidebarOptionsSection);
  class DpRadioGroup extends i$2 {
    static properties = {
      name: { type: String },
      value: { type: String },
      options: { type: Array }
    };
    static styles = i$5`
    :host {
      display: block;
    }
    fieldset {
      border: none;
      margin: 0;
      padding: 0;
    }
    .radio-group {
      display: grid;
      gap: var(--dp-spacing-xs, 4px);
    }
    .radio-option {
      display: flex;
      align-items: center;
      gap: var(--dp-spacing-xs, 4px);
      font-size: 0.9rem;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .radio-option input[type="radio"] {
      cursor: pointer;
    }
  `;
    constructor() {
      super();
      this.name = "";
      this.value = "";
      this.options = [];
    }
    _onChange(e2) {
      const input = e2.target;
      this.dispatchEvent(
        new CustomEvent("dp-radio-change", {
          detail: { value: input.value },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <fieldset role="radiogroup">
        <div class="radio-group">
          ${this.options.map(
        (opt) => b`
              <label class="radio-option">
                <input
                  type="radio"
                  name=${this.name}
                  .value=${opt.value}
                  .checked=${this.value === opt.value}
                  @change=${this._onChange}
                />
                ${opt.label}
              </label>
            `
      )}
        </div>
      </fieldset>
    `;
    }
  }
  customElements.define("dp-radio-group", DpRadioGroup);
  const DATAPOINT_SCOPE_OPTIONS = [
    { value: "linked", label: "Linked to selected targets" },
    { value: "all", label: "All datapoints" },
    { value: "hidden", label: "Hide datapoints" }
  ];
  class DpSidebarDatapointsSection extends i$2 {
    static properties = {
      datapointScope: { type: String, attribute: "datapoint-scope" },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = styles$c;
    constructor() {
      super();
      this.datapointScope = "linked";
      this.collapsible = false;
      this.open = true;
    }
    _onScopeChange(e2) {
      this.dispatchEvent(
        new CustomEvent("dp-scope-change", { detail: { value: e2.detail.value }, bubbles: true, composed: true })
      );
    }
    render() {
      return b`
      <dp-sidebar-options-section
        .title=${"Datapoints"}
        .subtitle=${"Choose which annotation datapoints appear on the chart."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <dp-radio-group
          .name=${"datapoint-scope"}
          .value=${this.datapointScope}
          .options=${DATAPOINT_SCOPE_OPTIONS}
          @dp-radio-change=${this._onScopeChange}
        ></dp-radio-group>
      </dp-sidebar-options-section>
    `;
    }
  }
  customElements.define("dp-sidebar-datapoints-section", DpSidebarDatapointsSection);
  const styles$a = i$5`
  :host {
    display: block;
  }
`;
  class DpCheckboxList extends i$2 {
    static properties = {
      items: { type: Array }
    };
    static styles = i$5`
    :host {
      display: block;
    }
    .checkbox-group {
      display: grid;
      gap: var(--dp-spacing-xs, 4px);
    }
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: var(--dp-spacing-xs, 4px);
      font-size: 0.9rem;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .checkbox-option input[type="checkbox"] {
      cursor: pointer;
    }
  `;
    constructor() {
      super();
      this.items = [];
    }
    _onChange(e2) {
      const input = e2.target;
      this.dispatchEvent(
        new CustomEvent("dp-item-change", {
          detail: { name: input.name, checked: input.checked },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="checkbox-group">
        ${this.items.map(
        (item) => b`
            <label class="checkbox-option">
              <input
                type="checkbox"
                name=${item.name}
                .checked=${item.checked}
                @change=${this._onChange}
              />
              ${item.label}
            </label>
          `
      )}
      </div>
    `;
    }
  }
  customElements.define("dp-checkbox-list", DpCheckboxList);
  class DpSidebarDatapointDisplaySection extends i$2 {
    static properties = {
      showIcons: { type: Boolean, attribute: "show-icons" },
      showLines: { type: Boolean, attribute: "show-lines" },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = styles$a;
    constructor() {
      super();
      this.showIcons = true;
      this.showLines = true;
      this.collapsible = false;
      this.open = true;
    }
    _onCheckboxChange(e2) {
      const { name, checked } = e2.detail;
      this.dispatchEvent(
        new CustomEvent("dp-display-change", { detail: { kind: name, value: checked }, bubbles: true, composed: true })
      );
    }
    render() {
      return b`
      <dp-sidebar-options-section
        .title=${"Datapoint Display"}
        .subtitle=${"Control how annotation datapoints are rendered on the chart."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <dp-checkbox-list
          .items=${[
        { name: "icons", label: "Show datapoint icons", checked: this.showIcons },
        { name: "lines", label: "Show dotted lines", checked: this.showLines }
      ]}
          @dp-item-change=${this._onCheckboxChange}
        ></dp-checkbox-list>
      </dp-sidebar-options-section>
    `;
    }
  }
  customElements.define("dp-sidebar-datapoint-display-section", DpSidebarDatapointDisplaySection);
  const styles$9 = i$5`
  :host {
    display: block;
  }
`;
  const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS$1 = [
    { value: "all", label: "Show all anomalies" },
    { value: "highlight", label: "Highlight overlaps" },
    { value: "only", label: "Overlaps only" }
  ];
  class DpSidebarAnalysisSection extends i$2 {
    static properties = {
      anomalyOverlapMode: { type: String, attribute: "anomaly-overlap-mode" },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = styles$9;
    constructor() {
      super();
      this.anomalyOverlapMode = "all";
      this.collapsible = false;
      this.open = true;
    }
    _emitAnalysis(kind, value) {
      this.dispatchEvent(
        new CustomEvent("dp-analysis-change", { detail: { kind, value }, bubbles: true, composed: true })
      );
    }
    _onAnomalyOverlapModeChange(e2) {
      this._emitAnalysis("anomaly_overlap_mode", e2.detail.value);
    }
    render() {
      return b`
      <dp-sidebar-options-section
        .title=${"Analysis"}
        .subtitle=${"Configure how anomalies and overlapping detections are displayed."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <dp-radio-group
          .name=${"chart-anomaly-overlap-mode"}
          .value=${this.anomalyOverlapMode}
          .options=${ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS$1}
          @dp-radio-change=${this._onAnomalyOverlapModeChange}
        ></dp-radio-group>
      </dp-sidebar-options-section>
    `;
    }
  }
  customElements.define("dp-sidebar-analysis-section", DpSidebarAnalysisSection);
  const styles$8 = i$5`
  :host {
    display: block;
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .y-axis-group {
    margin-top: var(--dp-spacing-sm);
  }

  .is-subopt {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    padding-left: 22px;
  }

  .is-disabled {
    opacity: 0.5;
  }

  .gap-select {
    width: auto;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--spacing, 8px) * 0.5) calc(var(--spacing, 8px) * 0.75);
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.84rem;
  }
`;
  const DATA_GAP_THRESHOLD_OPTIONS$1 = [
    { value: "auto", label: "Auto-detect" },
    { value: "5m", label: "5 minutes" },
    { value: "15m", label: "15 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "2h", label: "2 hours" },
    { value: "3h", label: "3 hours" },
    { value: "6h", label: "6 hours" },
    { value: "12h", label: "12 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const Y_AXIS_MODE_OPTIONS = [
    { value: "combined", label: "Combine y-axis by unit" },
    { value: "unique", label: "Unique y-axis per series" },
    { value: "split", label: "Split series into rows" }
  ];
  class DpSidebarChartDisplaySection extends i$2 {
    static properties = {
      showTooltips: { type: Boolean, attribute: "show-tooltips" },
      showHoverGuides: { type: Boolean, attribute: "show-hover-guides" },
      showCorrelatedAnomalies: { type: Boolean, attribute: "show-correlated-anomalies" },
      showDataGaps: { type: Boolean, attribute: "show-data-gaps" },
      dataGapThreshold: { type: String, attribute: "data-gap-threshold" },
      yAxisMode: { type: String, attribute: "y-axis-mode" },
      collapsible: { type: Boolean },
      open: { type: Boolean }
    };
    static styles = styles$8;
    constructor() {
      super();
      this.showTooltips = true;
      this.showHoverGuides = false;
      this.showCorrelatedAnomalies = false;
      this.showDataGaps = true;
      this.dataGapThreshold = "2h";
      this.yAxisMode = "combined";
      this.collapsible = false;
      this.open = true;
    }
    _emitDisplay(kind, value) {
      this.dispatchEvent(
        new CustomEvent("dp-display-change", { detail: { kind, value }, bubbles: true, composed: true })
      );
    }
    _onCheckboxChange(e2) {
      const { name, checked } = e2.detail;
      this._emitDisplay(name, checked);
    }
    _onGapThresholdChange(e2) {
      this._emitDisplay("data_gap_threshold", e2.target.value);
    }
    _onYAxisModeChange(e2) {
      this._emitDisplay("y_axis_mode", e2.detail.value);
    }
    render() {
      return b`
      <dp-sidebar-options-section
        .title=${"Chart Display"}
        .subtitle=${"Configure visual and interaction behaviour for the chart."}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <dp-checkbox-list
          .items=${[
        { name: "tooltips", label: "Show tooltips", checked: this.showTooltips },
        { name: "hover_guides", label: "Emphasize hover guides", checked: this.showHoverGuides },
        { name: "correlated_anomalies", label: "Highlight correlated anomalies", checked: this.showCorrelatedAnomalies },
        { name: "data_gaps", label: "Show data gaps", checked: this.showDataGaps }
      ]}
          @dp-item-change=${this._onCheckboxChange}
        ></dp-checkbox-list>
        <div class="is-subopt ${this.showDataGaps ? "" : "is-disabled"}">
          <select
            class="gap-select"
            ?disabled=${!this.showDataGaps}
            @change=${this._onGapThresholdChange}
          >
            ${DATA_GAP_THRESHOLD_OPTIONS$1.map((opt) => b`
              <option value=${opt.value} ?selected=${opt.value === this.dataGapThreshold}>${opt.label}</option>
            `)}
          </select>
          <span>Gap threshold</span>
        </div>
        <div class="y-axis-group">
          <dp-radio-group
            .name=${"chart-y-axis-mode"}
            .value=${this.yAxisMode}
            .options=${Y_AXIS_MODE_OPTIONS}
            @dp-radio-change=${this._onYAxisModeChange}
          ></dp-radio-group>
        </div>
      </dp-sidebar-options-section>
    `;
    }
  }
  customElements.define("dp-sidebar-chart-display-section", DpSidebarChartDisplaySection);
  class DpSidebarOptions extends i$2 {
    static properties = {
      datapointScope: { type: String, attribute: "datapoint-scope" },
      showIcons: { type: Boolean, attribute: "show-icons" },
      showLines: { type: Boolean, attribute: "show-lines" },
      showTooltips: { type: Boolean, attribute: "show-tooltips" },
      showHoverGuides: { type: Boolean, attribute: "show-hover-guides" },
      showCorrelatedAnomalies: { type: Boolean, attribute: "show-correlated-anomalies" },
      showDataGaps: { type: Boolean, attribute: "show-data-gaps" },
      dataGapThreshold: { type: String, attribute: "data-gap-threshold" },
      yAxisMode: { type: String, attribute: "y-axis-mode" },
      anomalyOverlapMode: { type: String, attribute: "anomaly-overlap-mode" },
      // Accordion open states
      targetsOpen: { type: Boolean, attribute: "targets-open" },
      datapointsOpen: { type: Boolean, attribute: "datapoints-open" },
      analysisOpen: { type: Boolean, attribute: "analysis-open" },
      chartOpen: { type: Boolean, attribute: "chart-open" }
    };
    static styles = styles$d;
    constructor() {
      super();
      this.datapointScope = "linked";
      this.showIcons = true;
      this.showLines = true;
      this.showTooltips = true;
      this.showHoverGuides = false;
      this.showCorrelatedAnomalies = false;
      this.showDataGaps = true;
      this.dataGapThreshold = "2h";
      this.yAxisMode = "combined";
      this.anomalyOverlapMode = "all";
      this.targetsOpen = true;
      this.datapointsOpen = true;
      this.analysisOpen = true;
      this.chartOpen = true;
    }
    _onTargetsToggle(e2) {
      this.targetsOpen = e2.detail.open;
      this._emitAccordionChange();
    }
    _onDatapointsToggle(e2) {
      this.datapointsOpen = e2.detail.open;
      this._emitAccordionChange();
    }
    _onAnalysisToggle(e2) {
      this.analysisOpen = e2.detail.open;
      this._emitAccordionChange();
    }
    _onChartToggle(e2) {
      this.chartOpen = e2.detail.open;
      this._emitAccordionChange();
    }
    _emitAccordionChange() {
      this.dispatchEvent(
        new CustomEvent("dp-accordion-change", {
          detail: {
            targetsOpen: this.targetsOpen,
            datapointsOpen: this.datapointsOpen,
            analysisOpen: this.analysisOpen,
            chartOpen: this.chartOpen
          },
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <div class="sidebar-options-card">
        <dp-sidebar-datapoints-section
          .datapointScope=${this.datapointScope}
          collapsible
          .open=${this.targetsOpen}
          @dp-section-toggle=${this._onTargetsToggle}
        ></dp-sidebar-datapoints-section>
        <dp-sidebar-datapoint-display-section
          .showIcons=${this.showIcons}
          .showLines=${this.showLines}
          collapsible
          .open=${this.datapointsOpen}
          @dp-section-toggle=${this._onDatapointsToggle}
        ></dp-sidebar-datapoint-display-section>
        <dp-sidebar-analysis-section
          .anomalyOverlapMode=${this.anomalyOverlapMode}
          collapsible
          .open=${this.analysisOpen}
          @dp-section-toggle=${this._onAnalysisToggle}
        ></dp-sidebar-analysis-section>
        <dp-sidebar-chart-display-section
          .showTooltips=${this.showTooltips}
          .showHoverGuides=${this.showHoverGuides}
          .showCorrelatedAnomalies=${this.showCorrelatedAnomalies}
          .showDataGaps=${this.showDataGaps}
          .dataGapThreshold=${this.dataGapThreshold}
          .yAxisMode=${this.yAxisMode}
          collapsible
          .open=${this.chartOpen}
          @dp-section-toggle=${this._onChartToggle}
        ></dp-sidebar-chart-display-section>
      </div>
    `;
    }
  }
  customElements.define("dp-sidebar-options", DpSidebarOptions);
  const t$1 = { ATTRIBUTE: 1, CHILD: 2 }, e$1 = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
  let i$1 = class i {
    constructor(t2) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t2, e2, i2) {
      this._$Ct = t2, this._$AM = e2, this._$Ci = i2;
    }
    _$AS(t2, e2) {
      return this.update(t2, e2);
    }
    update(t2, e2) {
      return this.render(...e2);
    }
  };
  const e = e$1(class extends i$1 {
    constructor(t2) {
      if (super(t2), t2.type !== t$1.ATTRIBUTE || "class" !== t2.name || t2.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
    }
    render(t2) {
      return " " + Object.keys(t2).filter((s2) => t2[s2]).join(" ") + " ";
    }
    update(s2, [i2]) {
      if (void 0 === this.st) {
        this.st = /* @__PURE__ */ new Set(), void 0 !== s2.strings && (this.nt = new Set(s2.strings.join(" ").split(/\s/).filter((t2) => "" !== t2)));
        for (const t2 in i2) i2[t2] && !this.nt?.has(t2) && this.st.add(t2);
        return this.render(i2);
      }
      const r2 = s2.element.classList;
      for (const t2 of this.st) t2 in i2 || (r2.remove(t2), this.st.delete(t2));
      for (const t2 in i2) {
        const s3 = !!i2[t2];
        s3 === this.st.has(t2) || this.nt?.has(t2) || (s3 ? (r2.add(t2), this.st.add(t2)) : (r2.remove(t2), this.st.delete(t2)));
      }
      return E;
    }
  });
  const { I: t } = j, i = (o2) => o2, s = () => document.createComment(""), v = (o2, n2, e2) => {
    const l2 = o2._$AA.parentNode, d2 = void 0 === n2 ? o2._$AB : n2._$AA;
    if (void 0 === e2) {
      const i2 = l2.insertBefore(s(), d2), n3 = l2.insertBefore(s(), d2);
      e2 = new t(i2, n3, o2, o2.options);
    } else {
      const t2 = e2._$AB.nextSibling, n3 = e2._$AM, c2 = n3 !== o2;
      if (c2) {
        let t3;
        e2._$AQ?.(o2), e2._$AM = o2, void 0 !== e2._$AP && (t3 = o2._$AU) !== n3._$AU && e2._$AP(t3);
      }
      if (t2 !== d2 || c2) {
        let o3 = e2._$AA;
        for (; o3 !== t2; ) {
          const t3 = i(o3).nextSibling;
          i(l2).insertBefore(o3, d2), o3 = t3;
        }
      }
    }
    return e2;
  }, u$1 = (o2, t2, i2 = o2) => (o2._$AI(t2, i2), o2), m = {}, p = (o2, t2 = m) => o2._$AH = t2, M = (o2) => o2._$AH, h = (o2) => {
    o2._$AR(), o2._$AA.remove();
  };
  const u = (e2, s2, t2) => {
    const r2 = /* @__PURE__ */ new Map();
    for (let l2 = s2; l2 <= t2; l2++) r2.set(e2[l2], l2);
    return r2;
  }, c = e$1(class extends i$1 {
    constructor(e2) {
      if (super(e2), e2.type !== t$1.CHILD) throw Error("repeat() can only be used in text expressions");
    }
    dt(e2, s2, t2) {
      let r2;
      void 0 === t2 ? t2 = s2 : void 0 !== s2 && (r2 = s2);
      const l2 = [], o2 = [];
      let i2 = 0;
      for (const s3 of e2) l2[i2] = r2 ? r2(s3, i2) : i2, o2[i2] = t2(s3, i2), i2++;
      return { values: o2, keys: l2 };
    }
    render(e2, s2, t2) {
      return this.dt(e2, s2, t2).values;
    }
    update(s2, [t2, r2, c2]) {
      const d2 = M(s2), { values: p$12, keys: a2 } = this.dt(t2, r2, c2);
      if (!Array.isArray(d2)) return this.ut = a2, p$12;
      const h$12 = this.ut ??= [], v$12 = [];
      let m2, y2, x2 = 0, j2 = d2.length - 1, k2 = 0, w = p$12.length - 1;
      for (; x2 <= j2 && k2 <= w; ) if (null === d2[x2]) x2++;
      else if (null === d2[j2]) j2--;
      else if (h$12[x2] === a2[k2]) v$12[k2] = u$1(d2[x2], p$12[k2]), x2++, k2++;
      else if (h$12[j2] === a2[w]) v$12[w] = u$1(d2[j2], p$12[w]), j2--, w--;
      else if (h$12[x2] === a2[w]) v$12[w] = u$1(d2[x2], p$12[w]), v(s2, v$12[w + 1], d2[x2]), x2++, w--;
      else if (h$12[j2] === a2[k2]) v$12[k2] = u$1(d2[j2], p$12[k2]), v(s2, d2[x2], d2[j2]), j2--, k2++;
      else if (void 0 === m2 && (m2 = u(a2, k2, w), y2 = u(h$12, x2, j2)), m2.has(h$12[x2])) if (m2.has(h$12[j2])) {
        const e2 = y2.get(a2[k2]), t3 = void 0 !== e2 ? d2[e2] : null;
        if (null === t3) {
          const e3 = v(s2, d2[x2]);
          u$1(e3, p$12[k2]), v$12[k2] = e3;
        } else v$12[k2] = u$1(t3, p$12[k2]), v(s2, d2[x2], t3), d2[e2] = null;
        k2++;
      } else h(d2[j2]), j2--;
      else h(d2[x2]), x2++;
      for (; k2 <= w; ) {
        const e2 = v(s2, v$12[w + 1]);
        u$1(e2, p$12[k2]), v$12[k2++] = e2;
      }
      for (; x2 <= j2; ) {
        const e2 = d2[x2++];
        null !== e2 && h(e2);
      }
      return this.ut = a2, p(s2, v$12), E;
    }
  });
  const styles$7 = i$5`
  :host {
    display: block;
  }

  .chart-tabs-shell {
    position: relative;
    min-width: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    z-index: 1;
    display: flex;
    align-items: center;
    gap: calc(var(--dp-spacing-sm, 8px));
  }

  .chart-tabs-rail {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-right: 10px;
    flex-grow: 1;
  }

  .chart-tabs-rail::-webkit-scrollbar {
    display: none;
  }

  .chart-tabs {
    display: flex;
    align-items: flex-end;
    width: 100%;
    min-width: 0;
    gap: 0;
    padding: 0 var(--dp-spacing-md);
    box-sizing: border-box;
  }

  .chart-tabs-add {
    margin-right: calc(var(--dp-spacing-sm, 16px));
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--dp-spacing-sm, 8px) * 0.625) var(--dp-spacing-sm);
    height: 26px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    z-index: 2;
  }

  .chart-tabs-add ha-icon {
    --mdc-icon-size: 16px;
  }

  .chart-tabs-add:hover,
  .chart-tabs-add:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }

  .chart-tabs-shell.overflowing .chart-tabs-add {
    top: var(--dp-spacing-xs);
    transform: none;
    width: 34px;
    min-width: 34px;
    height: 34px;
    padding: 0;
    justify-content: center;
    border-radius: 999px;
  }

  .chart-tabs-shell.overflowing .chart-tabs-add-label {
    display: none;
  }
`;
  const styles$6 = i$5`
  :host {
    display: contents;
  }

  .chart-tab {
    display: flex;
    align-items: stretch;
    min-width: 0;
    border-bottom: 2px solid transparent;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .chart-tab:hover {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 44%, transparent);
  }

  .chart-tab:hover .chart-tab-trigger {
    color: var(--primary-text-color);
  }

  .chart-tab.previewing {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }

  .chart-tab.previewing .chart-tab-trigger {
    color: var(--primary-text-color);
  }

  .chart-tab.active {
    border-bottom-color: var(--primary-color, #03a9f4);
  }

  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-actions {
    opacity: 0.55;
  }

  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-trigger .chart-tab-detail,
  .chart-tab.loading .chart-tab-action {
    color: var(--secondary-text-color);
  }

  .chart-tab.active .chart-tab-trigger {
    color: var(--primary-text-color);
    font-weight: 600;
    cursor: default;
  }

  .chart-tab-trigger {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    border-radius: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.86rem;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .chart-tab-trigger:hover,
  .chart-tab-trigger:focus-visible {
    color: var(--primary-text-color);
    outline: none;
  }

  .chart-tab-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .chart-tab-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .chart-tab-label {
    font-weight: inherit;
  }

  .chart-tab-spinner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--secondary-text-color, #6b7280) 28%, transparent);
    border-top-color: currentColor;
    animation: chart-spinner 0.9s linear infinite;
    flex: 0 0 auto;
  }

  @keyframes chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }

  .chart-tab-detail {
    font-size: 0.73rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .chart-tab-detail-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }

  .chart-tab.active .chart-tab-detail,
  .chart-tab.previewing .chart-tab-detail,
  .chart-tab:hover .chart-tab-detail,
  .chart-tab-trigger:hover .chart-tab-detail,
  .chart-tab-trigger:focus-visible .chart-tab-detail {
    color: color-mix(in srgb, var(--secondary-text-color, #6b7280) 88%, var(--primary-text-color, #111));
  }

  .chart-tab-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: -2px;
    padding-right: var(--dp-spacing-md);
    padding-bottom: 2px;
    align-self: center;
    flex: 0 0 auto;
  }

  .chart-tab-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .chart-tab-action ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .chart-tab-action:hover,
  .chart-tab-action:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }

  .chart-tab-action.delete {
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
  }

  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
    color: var(--error-color, #db4437);
  }
`;
  class DpComparisonTab extends i$2 {
    static styles = styles$6;
    static properties = {
      tabId: { type: String, attribute: "tab-id" },
      label: { type: String },
      detail: { type: String },
      active: { type: Boolean },
      previewing: { type: Boolean },
      loading: { type: Boolean },
      editable: { type: Boolean }
    };
    constructor() {
      super();
      this.tabId = "";
      this.label = "";
      this.detail = "";
      this.active = false;
      this.previewing = false;
      this.loading = false;
      this.editable = false;
    }
    _emit(name) {
      this.dispatchEvent(
        new CustomEvent(name, {
          detail: { tabId: this.tabId },
          bubbles: true,
          composed: true
        })
      );
    }
    _onTriggerClick() {
      this._emit("dp-tab-activate");
    }
    _onMouseEnter() {
      this._emit("dp-tab-hover");
    }
    _onMouseLeave() {
      this._emit("dp-tab-leave");
    }
    _onTriggerFocus() {
      this._emit("dp-tab-hover");
    }
    _onTriggerBlur() {
      this._emit("dp-tab-leave");
    }
    _onEditClick(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      this._emit("dp-tab-edit");
    }
    _onDeleteClick(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      this._emit("dp-tab-delete");
    }
    render() {
      const tabClasses = e({
        "chart-tab": true,
        active: this.active,
        previewing: this.previewing,
        loading: this.loading
      });
      return b`
      <div
        class=${tabClasses}
        @mouseenter=${this._onMouseEnter}
        @mouseleave=${this._onMouseLeave}
      >
        <button
          type="button"
          class="chart-tab-trigger"
          ?aria-current=${this.active}
          @click=${this._onTriggerClick}
          @focus=${this._onTriggerFocus}
          @blur=${this._onTriggerBlur}
        >
          <span class="chart-tab-content">
            <span class="chart-tab-main">
              ${this.loading ? b`<span class="chart-tab-spinner" aria-hidden="true"></span>` : null}
              <span class="chart-tab-label">${this.label}</span>
            </span>
            <span class="chart-tab-detail-row">
              <span class="chart-tab-detail">${this.detail}</span>
            </span>
          </span>
        </button>
        ${this.editable ? b`
              <span class="chart-tab-actions">
                <button
                  type="button"
                  class="chart-tab-action edit"
                  aria-label="Edit ${this.label}"
                  @click=${this._onEditClick}
                >
                  <ha-icon icon="mdi:pencil-outline"></ha-icon>
                </button>
                <button
                  type="button"
                  class="chart-tab-action delete"
                  aria-label="Delete ${this.label}"
                  @click=${this._onDeleteClick}
                >
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </span>
            ` : null}
      </div>
    `;
    }
  }
  customElements.define("dp-comparison-tab", DpComparisonTab);
  class DpComparisonTabRail extends i$2 {
    static styles = styles$7;
    static properties = {
      tabs: { type: Array },
      loadingIds: { type: Array, attribute: false },
      hoveredId: { type: String, attribute: "hovered-id" },
      overflowing: { type: Boolean }
    };
    _resizeObserver;
    constructor() {
      super();
      this.tabs = [];
      this.loadingIds = [];
      this.hoveredId = "";
      this.overflowing = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this._resizeObserver = new ResizeObserver(() => this._checkOverflow());
      this.updateComplete.then(() => {
        const shell = this.shadowRoot?.querySelector(".chart-tabs-shell");
        if (shell) {
          this._resizeObserver.observe(shell);
        }
      });
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._resizeObserver?.disconnect();
    }
    _checkOverflow() {
      const shell = this.shadowRoot?.querySelector(".chart-tabs-shell");
      if (!shell) {
        return;
      }
      const rail = shell.querySelector(".chart-tabs-rail");
      if (!rail) {
        return;
      }
      this.overflowing = rail.scrollWidth > rail.clientWidth;
    }
    _onAddClick() {
      this.dispatchEvent(
        new CustomEvent("dp-tab-add", {
          detail: {},
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      const shellClasses = e({
        "chart-tabs-shell": true,
        overflowing: this.overflowing
      });
      return b`
      <div class=${shellClasses}>
        <div class="chart-tabs-rail">
          <div class="chart-tabs">
            ${c(
        this.tabs,
        (tab) => tab.id,
        (tab) => b`
                <dp-comparison-tab
                  .tabId=${tab.id}
                  .label=${tab.label}
                  .detail=${tab.detail}
                  .active=${tab.active}
                  .previewing=${this.hoveredId === tab.id}
                  .loading=${this.loadingIds.includes(tab.id)}
                  .editable=${tab.editable}
                ></dp-comparison-tab>
              `
      )}
          </div>
        </div>
        <button
          type="button"
          class="chart-tabs-add"
          @click=${this._onAddClick}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
          <span class="chart-tabs-add-label">Add date window</span>
        </button>
      </div>
    `;
    }
  }
  customElements.define("dp-comparison-tab-rail", DpComparisonTabRail);
  const styles$5 = i$5`
  :host {
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .date-window-dialog-content {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) 0 0;
    overflow: visible;
  }

  .date-window-dialog-body {
    color: var(--secondary-text-color);
    line-height: 1.4;
    margin-bottom: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-field {
    display: grid;
    gap: var(--dp-spacing-xs);
    overflow: visible;
  }

  .date-window-dialog-field.name-field {
    max-width: 320px;
  }

  .date-window-dialog-field label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .date-window-dialog-field ha-textfield,
  .date-window-dialog-field input {
    width: 100%;
  }

  .date-window-dialog-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    border-radius: 12px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .date-window-dialog-input:focus {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 36%, transparent);
    outline-offset: 1px;
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
  }

  .date-window-dialog-timeline {
    border-radius: 8px;
    overflow: hidden;
    margin: calc(var(--dp-spacing-xs) * -1) 0;
  }

  .date-window-dialog-timeline dp-range-timeline {
    display: block;
    height: 64px;
  }

  .date-window-dialog-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
    padding-top: 0;
    margin-top: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-actions-right {
    display: flex;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
    margin-left: auto;
  }

  .date-window-dialog-actions ha-button {
    --mdc-typography-button-font-size: 0.875rem;
  }

  .date-window-dialog-cancel {
    --mdc-theme-primary: var(--primary-text-color);
  }

  .date-window-dialog-submit {
    --mdc-theme-primary: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-delete {
    --mdc-theme-primary: var(--error-color, #db4437);
  }

  @media (max-width: 720px) {
    .date-window-dialog-dates {
      grid-template-columns: 1fr;
    }
  }
`;
  const styles$4 = i$5`
  :host {
    display: block;
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-selection-jump {
    position: absolute;
    top: 50%;
    width: 30px;
    height: 30px;
    transform: translateY(-50%);
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: color-mix(in srgb, var(--primary-text-color, #111) 94%, transparent);
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.12),
      inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 82%, transparent);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    z-index: 12;
  }

  .range-selection-jump[hidden] {
    display: none;
  }

  .range-selection-jump.left {
    left: 6px;
  }

  .range-selection-jump.right {
    right: 6px;
  }

  .range-selection-jump:hover,
  .range-selection-jump:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 100%, transparent);
    outline: none;
  }

  .range-scroll-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    cursor: grab;
    touch-action: pan-y;
  }

  .range-scroll-viewport {
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 200ms ease;
  }

  .range-scroll-viewport.scrollbar-visible {
    scrollbar-color: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent) transparent;
  }

  .range-scroll-viewport::-webkit-scrollbar {
    height: 8px;
  }

  .range-scroll-viewport::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: transparent;
    transition: background 200ms ease;
  }

  .range-scroll-viewport.scrollbar-visible::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
  }

  .range-scroll-viewport.dragging {
    cursor: grabbing;
  }

  .range-timeline {
    position: relative;
    height: 58px;
    min-width: 100%;
    touch-action: pan-y;
  }

  .range-context-layer,
  .range-label-layer,
  .range-tick-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-scale-label {
    position: absolute;
    bottom: 0;
    opacity: 0.7;
    transform: translateX(-50%);
    font-size: 0.76rem;
    line-height: 1;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .range-period-button {
    padding: calc(var(--spacing, 8px) * 0.25) var(--dp-spacing-sm);
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    color: inherit;
    pointer-events: auto;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  .range-period-button:hover {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-period-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 26px;
    transform: translateY(-50%);
    height: 4px;
    border-radius: 999px;
    background: transparent;
  }

  .range-selection {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 82%, transparent);
    cursor: grab;
  }

  .range-selection.dragging {
    cursor: grabbing;
  }

  .range-tick {
    position: absolute;
    top: 14px;
    height: 14px;
    width: 1px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 16%, transparent);
  }

  .range-tick.major {
    top: 20px;
    height: 18px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }

  .range-tick.fine {
    top: 18px;
    height: 8px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 14%, transparent);
  }

  .range-tick.context {
    top: 2px;
    height: 34px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 38%, transparent);
  }

  .range-divider {
    position: absolute;
    top: 8px;
    bottom: 22px;
    width: 2px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
  }

  .range-context-label {
    font-weight: bold !important;
    position: absolute;
    top: 0;
    transform: translateX(8px);
    font-size: 0.92rem;
    line-height: 1;
    color: var(--primary-text-color);
    white-space: nowrap;
  }

  .range-tooltip {
    position: absolute;
    top: 43px;
    left: 0;
    transform: translate(-50%, 0);
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    border-radius: 10px;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    color: rgba(255, 255, 255, 0.96);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    font-size: 0.86rem;
    line-height: 1.1;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    opacity: 0;
    visibility: hidden;
    transition: opacity 120ms ease, visibility 120ms ease;
    z-index: 8;
  }

  .range-tooltip-live-hint {
    display: block;
    font-size: 0.78rem;
    opacity: 0.72;
    margin-top: 4px;
  }

  .range-tooltip::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    width: 10px;
    height: 10px;
    background: inherit;
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 2px;
  }

  .range-tooltip.visible {
    opacity: 1;
    visibility: visible;
  }

  .range-tooltip.start {
    z-index: 8;
  }

  .range-tooltip.end {
    z-index: 9;
  }
`;
  const styles$3 = i$5`
  :host {
    position: absolute;
    top: 26px;
    left: 0;
    transform: translate(-50%, -50%);
    display: block;
    width: 20px;
    height: 20px;
  }

  .handle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    background: color-mix(in srgb, var(--primary-text-color, #111) 84%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    padding: 0;
    cursor: ew-resize;
    touch-action: none;
  }

  .handle:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
  }

  @keyframes dp-live-breathe {
    0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 0 rgba(239, 83, 80, 0); }
    50%       { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 5px rgba(239, 83, 80, 0.2); }
  }

  .handle.is-live {
    background: #ef5350;
    animation: dp-live-breathe 3s ease-in-out infinite;
  }
`;
  class DpRangeHandle extends i$2 {
    static properties = {
      position: { type: Number },
      label: { type: String },
      live: { type: Boolean }
    };
    static styles = styles$3;
    constructor() {
      super();
      this.position = 0;
      this.label = "";
      this.live = false;
    }
    updated(changed) {
      if (changed.has("position")) {
        this.style.left = `${this.position}%`;
      }
    }
    _onPointerDown(e2) {
      e2.preventDefault();
      this.dispatchEvent(
        new CustomEvent("dp-handle-drag-start", {
          detail: { pointerId: e2.pointerId, clientX: e2.clientX },
          bubbles: true,
          composed: true
        })
      );
    }
    _onKeyDown(e2) {
      const navKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
      if (!navKeys.includes(e2.key)) return;
      e2.preventDefault();
      this.dispatchEvent(
        new CustomEvent("dp-handle-keydown", {
          detail: { key: e2.key, shiftKey: e2.shiftKey },
          bubbles: true,
          composed: true
        })
      );
    }
    _onPointerEnter() {
      this.dispatchEvent(new CustomEvent("dp-handle-hover", { bubbles: true, composed: true }));
    }
    _onPointerLeave() {
      this.dispatchEvent(new CustomEvent("dp-handle-leave", { bubbles: true, composed: true }));
    }
    _onFocus() {
      this.dispatchEvent(new CustomEvent("dp-handle-focus", { bubbles: true, composed: true }));
    }
    _onBlur() {
      this.dispatchEvent(new CustomEvent("dp-handle-blur", { bubbles: true, composed: true }));
    }
    render() {
      return b`
      <button
        type="button"
        class="handle ${this.live ? "is-live" : ""}"
        aria-label="${this.label}"
        @pointerdown=${this._onPointerDown}
        @keydown=${this._onKeyDown}
        @pointerenter=${this._onPointerEnter}
        @pointerleave=${this._onPointerLeave}
        @focus=${this._onFocus}
        @blur=${this._onBlur}
      ></button>
    `;
    }
  }
  customElements.define("dp-range-handle", DpRangeHandle);
  class DpRangeTimeline extends i$2 {
    static properties = {
      startTime: { type: Object },
      endTime: { type: Object },
      rangeBounds: { type: Object },
      zoomLevel: { type: String },
      dateSnapping: { type: String },
      isLiveEdge: { type: Boolean }
    };
    static styles = styles$4;
    // --- Internal drag state ---
    _draftStartTime = null;
    _draftEndTime = null;
    _activeRangeHandle = null;
    _hoveredRangeHandle = null;
    _focusedRangeHandle = null;
    _hoveredPeriodRange = null;
    _rangePointerId = null;
    _rangeInteractionActive = false;
    _rangeContentWidth = 0;
    _rangeCommitTimer = null;
    // Scrollbar visibility state
    _isProgrammaticScroll = false;
    _scrollbarHideTimer = null;
    // Timeline pan/select state
    _timelinePointerId = null;
    _timelinePointerStartX = 0;
    _timelinePointerStartScrollLeft = 0;
    _timelinePointerStartTimestamp = null;
    _timelinePointerMode = null;
    _timelineDragStartRangeMs = 0;
    _timelineDragEndRangeMs = 0;
    _timelineDragStartZoomRange = null;
    _timelinePointerMoved = false;
    _timelineTrackClickPending = false;
    // Cached DOM refs (set in firstUpdated)
    _rangeScrollViewportEl = null;
    _rangeTimelineEl = null;
    _rangeTrackEl = null;
    _rangeTickLayerEl = null;
    _rangeLabelLayerEl = null;
    _rangeContextLayerEl = null;
    _rangeSelectionEl = null;
    _rangeStartHandleEl = null;
    _rangeEndHandleEl = null;
    _rangeStartTooltipEl = null;
    _rangeEndTooltipEl = null;
    _rangeJumpLeftEl = null;
    _rangeJumpRightEl = null;
    // Bound handlers
    _onRangePointerMove;
    _onRangePointerUp;
    _onTimelinePointerMove;
    _onTimelinePointerUp;
    constructor() {
      super();
      this.startTime = null;
      this.endTime = null;
      this.rangeBounds = null;
      this.zoomLevel = "day";
      this.dateSnapping = "auto";
      this.isLiveEdge = false;
      this._onRangePointerMove = (ev) => this._handleRangePointerMove(ev);
      this._onRangePointerUp = (ev) => this._finishRangePointerInteraction(ev);
      this._onTimelinePointerMove = (ev) => this._handleTimelinePointerMove(ev);
      this._onTimelinePointerUp = (ev) => this._finishTimelinePointerInteraction(ev);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._detachRangePointerListeners();
      this._detachTimelinePointerListeners();
    }
    firstUpdated() {
      const sr = this.shadowRoot;
      this._rangeScrollViewportEl = sr.getElementById("range-scroll-viewport");
      this._rangeTimelineEl = sr.getElementById("range-timeline");
      this._rangeTrackEl = sr.getElementById("range-track");
      this._rangeTickLayerEl = sr.getElementById("range-tick-layer");
      this._rangeLabelLayerEl = sr.getElementById("range-label-layer");
      this._rangeContextLayerEl = sr.getElementById("range-context-layer");
      this._rangeSelectionEl = sr.getElementById("range-selection");
      this._rangeStartHandleEl = sr.getElementById("range-start-handle");
      this._rangeEndHandleEl = sr.getElementById("range-end-handle");
      this._rangeStartTooltipEl = sr.getElementById("range-tooltip-start");
      this._rangeEndTooltipEl = sr.getElementById("range-tooltip-end");
      this._rangeJumpLeftEl = sr.getElementById("range-jump-left");
      this._rangeJumpRightEl = sr.getElementById("range-jump-right");
      this._rangeScrollViewportEl?.addEventListener("scroll", () => {
        this._updateSelectionJumpControls();
        this._syncVisibleRangeLabels();
        this._updateRangeTooltip();
        this.dispatchEvent(new CustomEvent("dp-range-scroll", { bubbles: true, composed: true }));
        if (!this._isProgrammaticScroll) {
          this._showScrollbar();
        }
      });
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
          this._syncTimelineWidth();
          this._updateSelectionJumpControls();
          this._syncVisibleRangeLabels();
          this._revealSelectionInTimeline("auto");
        });
        if (this._rangeScrollViewportEl) ro.observe(this._rangeScrollViewportEl);
      }
      this._syncRangeControl();
    }
    updated(changed) {
      const rangeProps = ["startTime", "endTime", "rangeBounds", "zoomLevel", "dateSnapping"];
      if (rangeProps.some((p2) => changed.has(p2))) {
        this._syncRangeControl();
      }
    }
    _pctForTime(time) {
      if (!time || !this.rangeBounds) return 0;
      const { min, max } = this.rangeBounds;
      return Math.max(0, Math.min(100, (time.getTime() - min) / (max - min) * 100));
    }
    render() {
      return b`
      <ha-icon-button
        id="range-jump-left"
        class="range-selection-jump left"
        label="Scroll to selected range"
        hidden
        @click=${() => this._revealSelectionInTimeline("smooth")}
      >
        <ha-icon icon="mdi:chevron-left"></ha-icon>
      </ha-icon-button>
      <ha-icon-button
        id="range-jump-right"
        class="range-selection-jump right"
        label="Scroll to selected range"
        hidden
        @click=${() => this._revealSelectionInTimeline("smooth")}
      >
        <ha-icon icon="mdi:chevron-right"></ha-icon>
      </ha-icon-button>
      <div
        id="range-scroll-viewport"
        class="range-scroll-viewport"
        @pointerdown=${this._handleTimelinePointerDown}
        @pointermove=${this._handleRangeViewportPointerMove}
        @pointerleave=${this._handleRangeViewportPointerLeave}
      >
        <div id="range-timeline" class="range-timeline">
          <slot name="timeline-overlays"></slot>
          <div id="range-context-layer" class="range-context-layer"></div>
          <div id="range-tick-layer" class="range-tick-layer"></div>
          <div id="range-track" class="range-track">
            <slot name="track-overlays"></slot>
            <div id="range-selection" class="range-selection"></div>
          </div>
          <div id="range-label-layer" class="range-label-layer"></div>
          <dp-range-handle
            id="range-start-handle"
            label="Start date and time"
            .position=${this._pctForTime(this.startTime)}
            @dp-handle-drag-start=${(e2) => this._beginRangePointerInteraction("start", e2.detail.pointerId, e2.detail.clientX)}
            @dp-handle-keydown=${(e2) => this._handleRangeHandleKeyDown("start", e2.detail)}
            @dp-handle-hover=${() => this._setRangeTooltipHoverHandle("start")}
            @dp-handle-leave=${() => this._clearRangeTooltipHoverHandle("start")}
            @dp-handle-focus=${() => this._setRangeTooltipFocusHandle("start")}
            @dp-handle-blur=${() => this._clearRangeTooltipFocusHandle("start")}
          ></dp-range-handle>
          <dp-range-handle
            id="range-end-handle"
            label="End date and time"
            .position=${this._pctForTime(this.endTime)}
            .live=${this.isLiveEdge}
            @dp-handle-drag-start=${(e2) => this._beginRangePointerInteraction("end", e2.detail.pointerId, e2.detail.clientX)}
            @dp-handle-keydown=${(e2) => this._handleRangeHandleKeyDown("end", e2.detail)}
            @dp-handle-hover=${() => this._setRangeTooltipHoverHandle("end")}
            @dp-handle-leave=${() => this._clearRangeTooltipHoverHandle("end")}
            @dp-handle-focus=${() => this._setRangeTooltipFocusHandle("end")}
            @dp-handle-blur=${() => this._clearRangeTooltipFocusHandle("end")}
          ></dp-range-handle>
        </div>
      </div>
      <div id="range-tooltip-start" class="range-tooltip start" aria-hidden="true"></div>
      <div id="range-tooltip-end" class="range-tooltip end" aria-hidden="true"></div>
    `;
    }
    // ---------------------------------------------------------------------------
    // Zoom / snap helpers
    // ---------------------------------------------------------------------------
    _getZoomConfig() {
      return RANGE_ZOOM_CONFIGS[this.zoomLevel] || RANGE_ZOOM_CONFIGS.month_short;
    }
    _getEffectiveSnapUnit() {
      if (this.dateSnapping !== "auto") return this.dateSnapping;
      switch (this.zoomLevel) {
        case "quarterly":
        case "month_compressed":
          return "month";
        case "month_short":
        case "month_expanded":
        case "week_compressed":
          return "week";
        case "week_expanded":
          return "day";
        case "day":
          return "hour";
        default:
          return "day";
      }
    }
    _getSnapSpanMs(reference = /* @__PURE__ */ new Date()) {
      const snapUnit = this._getEffectiveSnapUnit();
      const start = startOfUnit(reference, snapUnit);
      const end = endOfUnit(reference, snapUnit);
      return Math.max(SECOND_MS, end.getTime() - start.getTime());
    }
    _countUnitsInRange(startMs, endMs, unit) {
      const totalMs = Math.max(0, endMs - startMs);
      const perMs = {
        second: SECOND_MS,
        minute: 60 * SECOND_MS,
        hour: 60 * 60 * SECOND_MS,
        day: 24 * 60 * 60 * SECOND_MS,
        week: 7 * 24 * 60 * 60 * SECOND_MS
      };
      if (perMs[unit]) return Math.ceil(totalMs / perMs[unit]);
      if (unit === "month") return Math.ceil(totalMs / (30.44 * 24 * 60 * 60 * SECOND_MS));
      if (unit === "quarter") return Math.ceil(totalMs / (91.3 * 24 * 60 * 60 * SECOND_MS));
      if (unit === "year") return Math.ceil(totalMs / (365.25 * 24 * 60 * 60 * SECOND_MS));
      return Math.max(1, Math.ceil(totalMs / (24 * 60 * 60 * SECOND_MS)));
    }
    // ---------------------------------------------------------------------------
    // Sync / render
    // ---------------------------------------------------------------------------
    _syncRangeControl() {
      if (!this._rangeTrackEl || !this._rangeStartHandleEl || !this._rangeEndHandleEl) return;
      if (!this.rangeBounds) return;
      this._draftStartTime = this.startTime ? new Date(this.startTime) : null;
      this._draftEndTime = this.endTime ? new Date(this.endTime) : null;
      this._syncTimelineWidth();
      this._updateHandleStacking();
      this._renderRangeScale();
      this._updateRangePreview();
      this._updateSelectionJumpControls();
      this._revealSelectionInTimeline("auto");
    }
    _syncTimelineWidth() {
      if (!this.rangeBounds || !this._rangeTimelineEl) return;
      const { config } = this.rangeBounds;
      const viewportWidth = Math.max(this._rangeScrollViewportEl?.clientWidth || 0, 320);
      const unitCount = this._countUnitsInRange(this.rangeBounds.min, this.rangeBounds.max, config.majorUnit);
      const contentWidth = Math.max(viewportWidth, unitCount * (config.pixelsPerUnit || 60));
      this._rangeContentWidth = contentWidth;
      this._rangeTimelineEl.style.width = `${contentWidth}px`;
    }
    _renderScaleMarkers(fragment, unit, className, total, step = 1) {
      if (!this.rangeBounds) return;
      let markerTime = addUnit(startOfUnit(new Date(this.rangeBounds.min), unit), unit, 0);
      if (markerTime.getTime() < this.rangeBounds.min) {
        markerTime = addUnit(markerTime, unit, step);
      }
      while (markerTime.getTime() < this.rangeBounds.max) {
        const tick = document.createElement("span");
        tick.className = `range-tick ${className}`;
        tick.style.left = `${(markerTime.getTime() - this.rangeBounds.min) / total * 100}%`;
        fragment.appendChild(tick);
        markerTime = addUnit(markerTime, unit, step);
      }
    }
    _buildRangePeriodButton(className, leftValue, total, text, unit, startTime) {
      if (!this.rangeBounds) return document.createElement("button");
      const button = document.createElement("button");
      button.type = "button";
      button.className = `range-period-button ${className}`;
      button.style.left = `${(leftValue - this.rangeBounds.min) / total * 100}%`;
      button.textContent = text;
      const selectionLabel = formatPeriodSelectionLabel(startTime, unit);
      button.title = `Select ${selectionLabel}`;
      button.setAttribute("aria-label", `Select ${selectionLabel}`);
      button.addEventListener("click", (ev) => this._handleRangePeriodSelect(unit, startTime, ev));
      button.addEventListener("pointerenter", () => this._setHoveredPeriodRange(unit, startTime));
      button.addEventListener("pointerleave", () => this._clearHoveredPeriodRange(unit, startTime));
      button.addEventListener("focus", () => this._setHoveredPeriodRange(unit, startTime));
      button.addEventListener("blur", () => this._clearHoveredPeriodRange(unit, startTime));
      return button;
    }
    _getRangeUnitAnchorMs(startTime, unit, anchor = "auto") {
      const unitStart = Math.max(startOfUnit(new Date(startTime), unit).getTime(), this.rangeBounds?.min ?? -Infinity);
      const unitEnd = Math.min(endOfUnit(new Date(startTime), unit).getTime(), this.rangeBounds?.max ?? Infinity);
      let resolvedAnchor = anchor;
      if (resolvedAnchor === "auto") {
        resolvedAnchor = unit === "day" || unit === "week" ? "center" : "start";
      }
      if (resolvedAnchor === "center") {
        return unitStart + Math.max(0, (unitEnd - unitStart) / 2);
      }
      return unitStart;
    }
    _estimateRangeLabelWidth(text, className, minGap) {
      const basePadding = className === "range-context-label" ? 20 : 14;
      const charWidth = className === "range-context-label" ? 8.2 : 7.2;
      return String(text).length * charWidth + basePadding + minGap;
    }
    _computeRangeLabelStride(unit, formatter, className, minGap) {
      if (!this.rangeBounds || !this._rangeContentWidth) return 1;
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      let current = startOfUnit(new Date(this.rangeBounds.min), unit);
      let previousMs = null;
      let minSpacingPx = Infinity;
      let maxLabelWidthPx = 0;
      let samples = 0;
      while (current.getTime() < this.rangeBounds.max && samples < 24) {
        const currentMs = Math.max(current.getTime(), this.rangeBounds.min);
        const text = formatter(current);
        maxLabelWidthPx = Math.max(maxLabelWidthPx, this._estimateRangeLabelWidth(text, className, minGap));
        if (previousMs != null) {
          const spacingPx = (currentMs - previousMs) / total * this._rangeContentWidth;
          if (spacingPx > 0) minSpacingPx = Math.min(minSpacingPx, spacingPx);
        }
        previousMs = currentMs;
        current = addUnit(current, unit, 1);
        samples += 1;
      }
      if (!Number.isFinite(minSpacingPx) || minSpacingPx <= 0) return 1;
      return Math.max(1, Math.ceil(maxLabelWidthPx / minSpacingPx));
    }
    _syncVisibleRangeLabels() {
    }
    _renderRangeScale() {
      if (!this.rangeBounds || !this._rangeTickLayerEl || !this._rangeLabelLayerEl || !this._rangeContextLayerEl) return;
      this._rangeTickLayerEl.innerHTML = "";
      this._rangeLabelLayerEl.innerHTML = "";
      this._rangeContextLayerEl.innerHTML = "";
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const { config } = this.rangeBounds;
      const tickFragment = document.createDocumentFragment();
      const labelFragment = document.createDocumentFragment();
      const contextFragment = document.createDocumentFragment();
      const scaleLabelStride = config.labelUnit === "month" || config.labelUnit === "day" ? 1 : this._computeRangeLabelStride(
        config.labelUnit,
        (value) => formatScaleLabel(value, config.labelUnit, this.zoomLevel),
        "range-scale-label",
        RANGE_LABEL_MIN_GAP_PX
      );
      const contextLabelStride = config.contextUnit === "month" || config.contextUnit === "day" ? 1 : this._computeRangeLabelStride(
        config.contextUnit,
        (value) => formatContextLabel(value, config.contextUnit),
        "range-context-label",
        RANGE_CONTEXT_LABEL_MIN_GAP_PX
      );
      if (config.detailUnit && config.detailUnit !== config.minorUnit && config.detailUnit !== config.majorUnit) {
        this._renderScaleMarkers(tickFragment, config.detailUnit, "fine", total, config.detailStep || 1);
      }
      if (config.minorUnit !== config.majorUnit) {
        this._renderScaleMarkers(tickFragment, config.minorUnit, "", total);
      }
      this._renderScaleMarkers(tickFragment, config.majorUnit, "major", total);
      let labelRef = startOfUnit(new Date(this.rangeBounds.min), config.labelUnit);
      let labelIndex = 0;
      while (labelRef.getTime() < this.rangeBounds.max) {
        if (labelIndex % scaleLabelStride === 0) {
          const leftValue = this._getRangeUnitAnchorMs(labelRef, config.labelUnit, "auto");
          const label = this._buildRangePeriodButton(
            "range-scale-label",
            leftValue,
            total,
            formatScaleLabel(labelRef, config.labelUnit, this.zoomLevel),
            config.labelUnit,
            labelRef
          );
          labelFragment.appendChild(label);
        }
        labelRef = addUnit(labelRef, config.labelUnit, 1);
        labelIndex += 1;
      }
      let contextRef = startOfUnit(new Date(this.rangeBounds.min), config.contextUnit);
      if (contextRef.getTime() < this.rangeBounds.min) {
        contextRef = addUnit(contextRef, config.contextUnit, 1);
      }
      let contextIndex = 0;
      while (contextRef.getTime() < this.rangeBounds.max) {
        const left = `${(contextRef.getTime() - this.rangeBounds.min) / total * 100}%`;
        const divider = document.createElement("span");
        divider.className = "range-divider";
        divider.style.left = left;
        contextFragment.appendChild(divider);
        if (contextIndex % contextLabelStride === 0) {
          const label = this._buildRangePeriodButton(
            "range-context-label",
            contextRef.getTime(),
            total,
            formatContextLabel(contextRef, config.contextUnit),
            config.contextUnit,
            contextRef
          );
          contextFragment.appendChild(label);
        }
        contextRef = addUnit(contextRef, config.contextUnit, 1);
        contextIndex += 1;
      }
      this._rangeTickLayerEl.appendChild(tickFragment);
      this._rangeLabelLayerEl.appendChild(labelFragment);
      this._rangeContextLayerEl.appendChild(contextFragment);
      this._syncVisibleRangeLabels();
    }
    // ---------------------------------------------------------------------------
    // Handle position / tooltip
    // ---------------------------------------------------------------------------
    _updateHandleStacking(activeHandle = this._activeRangeHandle) {
      if (!this._rangeStartHandleEl || !this._rangeEndHandleEl) return;
      this._rangeStartHandleEl.style.zIndex = activeHandle === "start" ? "5" : "3";
      this._rangeEndHandleEl.style.zIndex = activeHandle === "end" ? "5" : "4";
    }
    _updateRangePreview() {
      if (!this.rangeBounds || !this._draftStartTime || !this._draftEndTime) return;
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const startPct = (this._draftStartTime.getTime() - this.rangeBounds.min) / total * 100;
      const endPct = (this._draftEndTime.getTime() - this.rangeBounds.min) / total * 100;
      if (this._rangeSelectionEl) {
        this._rangeSelectionEl.style.left = `${startPct}%`;
        this._rangeSelectionEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      }
      if (this._rangeStartHandleEl) {
        this._rangeStartHandleEl.style.left = `${startPct}%`;
        this._rangeStartHandleEl.setAttribute("aria-valuetext", formatRangeDateTime(this._draftStartTime));
      }
      if (this._rangeEndHandleEl) {
        this._rangeEndHandleEl.style.left = `${endPct}%`;
        this._rangeEndHandleEl.setAttribute("aria-valuetext", formatRangeDateTime(this._draftEndTime));
      }
      this._updateRangeTooltip();
    }
    _getVisibleRangeTooltipHandles() {
      if (this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") {
        return ["start", "end"];
      }
      const handle = this._activeRangeHandle || this._focusedRangeHandle || this._hoveredRangeHandle || null;
      return handle ? [handle] : [];
    }
    _setRangeTooltipHoverHandle(handle) {
      this._hoveredRangeHandle = handle;
      this._updateRangeTooltip();
    }
    _clearRangeTooltipHoverHandle(handle) {
      if (this._activeRangeHandle === handle) return;
      if (this._hoveredRangeHandle === handle) this._hoveredRangeHandle = null;
      this._updateRangeTooltip();
    }
    _setRangeTooltipFocusHandle(handle) {
      this._focusedRangeHandle = handle;
      this._updateRangeTooltip();
    }
    _clearRangeTooltipFocusHandle(handle) {
      if (this._activeRangeHandle === handle) return;
      if (this._focusedRangeHandle === handle) this._focusedRangeHandle = null;
      this._updateRangeTooltip();
    }
    _updateRangeTooltip() {
      if (!this.rangeBounds || !this._rangeScrollViewportEl) return;
      const visibleHandles = new Set(this._getVisibleRangeTooltipHandles());
      this._updateRangeTooltipForHandle("start", visibleHandles.has("start"));
      this._updateRangeTooltipForHandle("end", visibleHandles.has("end"));
    }
    _updateRangeTooltipForHandle(handle, visible) {
      const tooltip = handle === "start" ? this._rangeStartTooltipEl : this._rangeEndTooltipEl;
      if (!tooltip) return;
      if (!visible) {
        tooltip.classList.remove("visible");
        tooltip.setAttribute("aria-hidden", "true");
        return;
      }
      const value = handle === "start" ? this._draftStartTime : this._draftEndTime;
      if (!value || !this.rangeBounds || !this._rangeScrollViewportEl) {
        tooltip.classList.remove("visible");
        tooltip.setAttribute("aria-hidden", "true");
        return;
      }
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const contentWidth = Math.max(this._rangeContentWidth || 0, this._rangeScrollViewportEl.clientWidth || 0, 1);
      const valuePx = (value.getTime() - this.rangeBounds.min) / total * contentWidth;
      const viewportX = valuePx - this._rangeScrollViewportEl.scrollLeft;
      const clampedX = clampNumber(viewportX, 0, this._rangeScrollViewportEl.clientWidth);
      if (handle === "end" && this.isLiveEdge) {
        const dateEl = document.createElement("span");
        dateEl.textContent = formatRangeDateTime(value);
        const hintEl = document.createElement("span");
        hintEl.className = "range-tooltip-live-hint";
        hintEl.textContent = "Updates with new data";
        tooltip.textContent = "";
        tooltip.append(dateEl, hintEl);
      } else {
        tooltip.textContent = formatRangeDateTime(value);
      }
      tooltip.style.left = `${clampedX}px`;
      tooltip.classList.add("visible");
      tooltip.setAttribute("aria-hidden", "false");
    }
    // ---------------------------------------------------------------------------
    // Period hover
    // ---------------------------------------------------------------------------
    _handleRangePeriodSelect(unit, startTime, ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const periodStart = startOfUnit(new Date(startTime), unit);
      const periodEnd = endOfUnit(new Date(startTime), unit);
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      this._draftStartTime = new Date(periodStart);
      this._draftEndTime = new Date(periodEnd);
      this._updateRangePreview();
      this.dispatchEvent(new CustomEvent("dp-range-period-select", {
        detail: { unit, startTime: periodStart },
        bubbles: true,
        composed: true
      }));
      this._commitRangeSelection({ push: true });
    }
    _setHoveredPeriodRange(unit, startTime) {
      const start = startOfUnit(new Date(startTime), unit);
      const end = endOfUnit(new Date(startTime), unit);
      this._hoveredPeriodRange = { unit, start: start.getTime(), end: end.getTime() };
      this.dispatchEvent(new CustomEvent("dp-range-period-hover", {
        detail: { start, end },
        bubbles: true,
        composed: true
      }));
    }
    _clearHoveredPeriodRange(unit, startTime) {
      if (!this._hoveredPeriodRange) return;
      const start = startOfUnit(new Date(startTime), unit).getTime();
      const end = endOfUnit(new Date(startTime), unit).getTime();
      if (this._hoveredPeriodRange.start === start && this._hoveredPeriodRange.end === end) {
        this._hoveredPeriodRange = null;
        this.dispatchEvent(new CustomEvent("dp-range-period-leave", { bubbles: true, composed: true }));
      }
    }
    // ---------------------------------------------------------------------------
    // Jump controls / scroll
    // ---------------------------------------------------------------------------
    _updateSelectionJumpControls() {
      if (!this._rangeScrollViewportEl || !this.rangeBounds || !this._rangeContentWidth || !this.startTime || !this.endTime) {
        if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = true;
        if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = true;
        return;
      }
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const viewportWidth = this._rangeScrollViewportEl.clientWidth;
      const currentLeft = this._rangeScrollViewportEl.scrollLeft;
      const currentRight = currentLeft + viewportWidth;
      const startPx = (this.startTime.getTime() - this.rangeBounds.min) / total * this._rangeContentWidth;
      const endPx = (this.endTime.getTime() - this.rangeBounds.min) / total * this._rangeContentWidth;
      if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = !(endPx < currentLeft);
      if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = !(startPx > currentRight);
    }
    _scrollTimelineToRange(range, behavior = "auto", { center = false } = {}) {
      if (!this._rangeScrollViewportEl || !this.rangeBounds || !this._rangeContentWidth || !range) return;
      const viewportWidth = this._rangeScrollViewportEl.clientWidth;
      if (!viewportWidth || this._rangeContentWidth <= viewportWidth) return;
      const totalMs = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const visibleSpanMs = totalMs * Math.min(1, viewportWidth / this._rangeContentWidth);
      const maxScrollLeft = Math.max(0, this._rangeContentWidth - viewportWidth);
      const viewportRangeMs = Math.max(0, totalMs - visibleSpanMs);
      if (viewportRangeMs <= 0) return;
      const targetStart = center ? clampNumber(
        (range.start + range.end) / 2 - visibleSpanMs / 2,
        this.rangeBounds.min,
        this.rangeBounds.max - visibleSpanMs
      ) : clampNumber(range.start, this.rangeBounds.min, this.rangeBounds.max - visibleSpanMs);
      const ratio = (targetStart - this.rangeBounds.min) / viewportRangeMs;
      const nextLeft = clampNumber(ratio * maxScrollLeft, 0, maxScrollLeft);
      this._rangeScrollViewportEl.scrollTo({ left: nextLeft, behavior });
    }
    revealSelection() {
      this._revealSelectionInTimeline("smooth");
    }
    _revealSelectionInTimeline(behavior = "auto") {
      if (!this.startTime || !this.endTime) return;
      this._isProgrammaticScroll = true;
      this._scrollTimelineToRange(
        { start: this.startTime.getTime(), end: this.endTime.getTime() },
        behavior,
        { center: true }
      );
      window.setTimeout(() => {
        this._isProgrammaticScroll = false;
      }, 50);
    }
    _showScrollbar() {
      if (!this._rangeScrollViewportEl) return;
      this._rangeScrollViewportEl.classList.add("scrollbar-visible");
      if (this._scrollbarHideTimer) window.clearTimeout(this._scrollbarHideTimer);
      this._scrollbarHideTimer = window.setTimeout(() => {
        this._scrollbarHideTimer = null;
        this._rangeScrollViewportEl?.classList.remove("scrollbar-visible");
      }, 1500);
    }
    // ---------------------------------------------------------------------------
    // Coordinate math
    // ---------------------------------------------------------------------------
    _timestampFromClientX(clientX) {
      if (!this.rangeBounds || !this._rangeTrackEl) return null;
      const rect = this._rangeTrackEl.getBoundingClientRect();
      if (!rect.width) return null;
      const ratio = clampNumber((clientX - rect.left) / rect.width, 0, 1);
      return this.rangeBounds.min + ratio * (this.rangeBounds.max - this.rangeBounds.min);
    }
    _getTimelineSelectionDragDeltaMs(timestamp) {
      if (timestamp == null || this._timelinePointerStartTimestamp == null) return 0;
      const snapUnit = this._getEffectiveSnapUnit();
      if (!snapUnit) return timestamp - this._timelinePointerStartTimestamp;
      const snappedStart = snapDateToUnit(new Date(this._timelinePointerStartTimestamp), snapUnit).getTime();
      const snappedCurrent = snapDateToUnit(new Date(timestamp), snapUnit).getTime();
      return snappedCurrent - snappedStart;
    }
    // ---------------------------------------------------------------------------
    // Draft range manipulation
    // ---------------------------------------------------------------------------
    _setDraftRangeFromTimestamp(handle, timestamp) {
      if (!this.rangeBounds) return;
      const snapUnit = this._getEffectiveSnapUnit();
      let startMs = this._draftStartTime?.getTime() ?? this.startTime?.getTime() ?? this.rangeBounds.min;
      let endMs = this._draftEndTime?.getTime() ?? this.endTime?.getTime() ?? this.rangeBounds.max;
      const snapped = clampNumber(
        snapDateToUnit(new Date(timestamp), snapUnit).getTime(),
        this.rangeBounds.min,
        this.rangeBounds.max
      );
      const minSpan = Math.max(
        this._getSnapSpanMs(new Date(snapped)),
        SECOND_MS
      );
      if (handle === "start") {
        startMs = clampNumber(snapped, this.rangeBounds.min, endMs - minSpan);
      } else {
        endMs = clampNumber(snapped, startMs + minSpan, this.rangeBounds.max);
      }
      this._draftStartTime = new Date(startMs);
      this._draftEndTime = new Date(endMs);
      this._updateHandleStacking(handle);
      this._updateRangePreview();
      this._fireDraftEvent();
      this._scheduleRangeCommit();
    }
    _shiftDraftRangeByDelta(deltaMs) {
      if (!this.rangeBounds) return;
      const startMs = this._timelineDragStartRangeMs;
      const endMs = this._timelineDragEndRangeMs;
      const minDelta = this.rangeBounds.min - startMs;
      const maxDelta = this.rangeBounds.max - endMs;
      const clampedDelta = clampNumber(deltaMs, minDelta, maxDelta);
      this._draftStartTime = new Date(startMs + clampedDelta);
      this._draftEndTime = new Date(endMs + clampedDelta);
      this._updateRangePreview();
      this._fireDraftEvent();
      this._scheduleRangeCommit();
    }
    _setDraftRangeFromIntervalSelection(startTimestamp, endTimestamp) {
      if (!this.rangeBounds) return;
      const unit = this.rangeBounds.config?.labelUnit || this._getEffectiveSnapUnit();
      const startValue = Math.min(startTimestamp, endTimestamp);
      const endValue = Math.max(startTimestamp, endTimestamp);
      const rangeStart = clampNumber(startOfUnit(new Date(startValue), unit).getTime(), this.rangeBounds.min, this.rangeBounds.max);
      const rangeEnd = clampNumber(endOfUnit(new Date(endValue), unit).getTime(), this.rangeBounds.min, this.rangeBounds.max);
      if (rangeStart >= rangeEnd) return;
      this._draftStartTime = new Date(rangeStart);
      this._draftEndTime = new Date(rangeEnd);
      this._updateRangePreview();
    }
    _fireDraftEvent() {
      if (!this._draftStartTime || !this._draftEndTime) return;
      this.dispatchEvent(new CustomEvent("dp-range-draft", {
        detail: { start: new Date(this._draftStartTime), end: new Date(this._draftEndTime) },
        bubbles: true,
        composed: true
      }));
    }
    _scheduleRangeCommit() {
      if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
      if (this._rangeCommitTimer) window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = window.setTimeout(() => {
        this._rangeCommitTimer = null;
        this._commitRangeSelection({ push: false });
      }, 240);
    }
    _commitRangeSelection({ push = false } = {}) {
      if (!this._draftStartTime || !this._draftEndTime) return;
      this.dispatchEvent(new CustomEvent("dp-range-commit", {
        detail: { start: new Date(this._draftStartTime), end: new Date(this._draftEndTime), push },
        bubbles: true,
        composed: true
      }));
    }
    // ---------------------------------------------------------------------------
    // Handle drag interaction
    // ---------------------------------------------------------------------------
    _beginRangePointerInteraction(handle, pointerId, clientX) {
      if (!this._rangeTrackEl) return;
      this._rangeInteractionActive = true;
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      this._activeRangeHandle = handle;
      this._hoveredRangeHandle = handle;
      this._rangePointerId = pointerId;
      this._updateHandleStacking(handle);
      this._updateRangeTooltip();
      this._attachRangePointerListeners();
      const target = handle === "start" ? this._rangeStartHandleEl : this._rangeEndHandleEl;
      target?.focus?.();
      const timestamp = this._timestampFromClientX(clientX);
      if (timestamp != null) {
        this._setDraftRangeFromTimestamp(handle, timestamp);
      }
    }
    _maybeAutoScrollTimelineDuringHandleDrag(clientX) {
      if (!this._rangeScrollViewportEl) return;
      const viewport = this._rangeScrollViewportEl;
      const rect = viewport.getBoundingClientRect();
      if (!rect.width) return;
      const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      if (maxScrollLeft <= 0) return;
      let delta = 0;
      const leftDistance = clientX - rect.left;
      const rightDistance = rect.right - clientX;
      if (leftDistance < RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX) {
        const ratio = clampNumber((RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - leftDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX, 0, 1);
        delta = -Math.max(1, Math.round(ratio * RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX));
      } else if (rightDistance < RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX) {
        const ratio = clampNumber((RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - rightDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX, 0, 1);
        delta = Math.max(1, Math.round(ratio * RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX));
      }
      if (!delta) return;
      viewport.scrollLeft = clampNumber(viewport.scrollLeft + delta, 0, maxScrollLeft);
    }
    _attachRangePointerListeners() {
      window.addEventListener("pointermove", this._onRangePointerMove);
      window.addEventListener("pointerup", this._onRangePointerUp);
      window.addEventListener("pointercancel", this._onRangePointerUp);
    }
    _detachRangePointerListeners() {
      window.removeEventListener("pointermove", this._onRangePointerMove);
      window.removeEventListener("pointerup", this._onRangePointerUp);
      window.removeEventListener("pointercancel", this._onRangePointerUp);
      this._rangePointerId = null;
      this._activeRangeHandle = null;
      this._rangeInteractionActive = false;
      this._updateHandleStacking();
      this._updateRangeTooltip();
    }
    _handleRangePointerMove(ev) {
      if (!this._activeRangeHandle) return;
      if (this._rangePointerId != null && ev.pointerId !== this._rangePointerId) return;
      this._maybeAutoScrollTimelineDuringHandleDrag(ev.clientX);
      const timestamp = this._timestampFromClientX(ev.clientX);
      if (timestamp == null) return;
      ev.preventDefault();
      this._setDraftRangeFromTimestamp(this._activeRangeHandle, timestamp);
    }
    _finishRangePointerInteraction(ev) {
      if (!this._activeRangeHandle) return;
      if (this._rangePointerId != null && ev.pointerId !== this._rangePointerId) return;
      this._detachRangePointerListeners();
      this._focusedRangeHandle = null;
      this._hoveredRangeHandle = null;
      this._updateRangeTooltip();
      this._commitRangeSelection({ push: true });
    }
    _handleRangeHandleKeyDown(handle, detail) {
      if (!this.rangeBounds) return;
      const snapUnit = this._getEffectiveSnapUnit();
      const currentValue = handle === "start" ? this._draftStartTime?.getTime() ?? this.startTime?.getTime() : this._draftEndTime?.getTime() ?? this.endTime?.getTime();
      if (currentValue == null) return;
      const config = this._getZoomConfig();
      let nextValue = null;
      if (detail.key === "ArrowLeft" || detail.key === "ArrowDown") nextValue = addUnit(new Date(currentValue), snapUnit, -1).getTime();
      if (detail.key === "ArrowRight" || detail.key === "ArrowUp") nextValue = addUnit(new Date(currentValue), snapUnit, 1).getTime();
      if (detail.key === "PageDown") nextValue = addUnit(new Date(currentValue), config.majorUnit, -1).getTime();
      if (detail.key === "PageUp") nextValue = addUnit(new Date(currentValue), config.majorUnit, 1).getTime();
      if (detail.key === "Home") nextValue = this.rangeBounds.min;
      if (detail.key === "End") nextValue = this.rangeBounds.max;
      if (nextValue == null) return;
      this._focusedRangeHandle = handle;
      this._setDraftRangeFromTimestamp(handle, nextValue);
    }
    // ---------------------------------------------------------------------------
    // Timeline pan / interval-select interactions
    // ---------------------------------------------------------------------------
    _handleTimelinePointerDown(ev) {
      if (ev.button !== 0) return;
      if (ev.composedPath().some((el) => el.tagName === "DP-RANGE-HANDLE")) return;
      if (ev.target?.closest?.(".range-period-button")) return;
      if (!this._rangeScrollViewportEl) return;
      const isSelectionDrag = !!ev.target?.closest?.(".range-selection");
      const trackRect = this._rangeTrackEl?.getBoundingClientRect();
      const isTrackRegion = !!trackRect && ev.clientY >= trackRect.top - 6 && ev.clientY <= trackRect.bottom + 6;
      const isIntervalSelect = !isSelectionDrag && !isTrackRegion;
      this._detachTimelinePointerListeners();
      this._rangeInteractionActive = isSelectionDrag || isIntervalSelect;
      if ((isSelectionDrag || isIntervalSelect) && this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      this._timelinePointerId = ev.pointerId;
      this._timelinePointerStartX = ev.clientX;
      this._timelinePointerStartScrollLeft = this._rangeScrollViewportEl.scrollLeft;
      this._timelinePointerStartTimestamp = isSelectionDrag || isIntervalSelect ? this._timestampFromClientX(ev.clientX) : null;
      if (isSelectionDrag) {
        this._timelinePointerMode = "selection";
      } else if (isIntervalSelect) {
        this._timelinePointerMode = "interval_select";
      } else {
        this._timelinePointerMode = "pan";
      }
      this._timelineDragStartRangeMs = this._draftStartTime?.getTime() ?? this.startTime?.getTime() ?? 0;
      this._timelineDragEndRangeMs = this._draftEndTime?.getTime() ?? this.endTime?.getTime() ?? 0;
      this._timelinePointerMoved = false;
      this._timelineTrackClickPending = !isSelectionDrag && !isIntervalSelect && !!ev.target?.closest?.(".range-track");
      this._rangeScrollViewportEl.classList.remove("dragging");
      this._rangeSelectionEl?.classList.toggle("dragging", isSelectionDrag);
      window.addEventListener("pointermove", this._onTimelinePointerMove);
      window.addEventListener("pointerup", this._onTimelinePointerUp);
      window.addEventListener("pointercancel", this._onTimelinePointerUp);
    }
    _detachTimelinePointerListeners() {
      window.removeEventListener("pointermove", this._onTimelinePointerMove);
      window.removeEventListener("pointerup", this._onTimelinePointerUp);
      window.removeEventListener("pointercancel", this._onTimelinePointerUp);
      if (this._rangeScrollViewportEl) this._rangeScrollViewportEl.classList.remove("dragging");
      this._rangeSelectionEl?.classList.remove("dragging");
      this._timelinePointerId = null;
      this._timelinePointerStartTimestamp = null;
      this._timelinePointerMode = null;
      this._rangeInteractionActive = false;
      this._timelinePointerMoved = false;
      this._timelineTrackClickPending = false;
    }
    _handleTimelinePointerMove(ev) {
      if (this._timelinePointerId == null || ev.pointerId !== this._timelinePointerId || !this._rangeScrollViewportEl) return;
      if (this._timelinePointerMode === "selection") {
        const timestamp = this._timestampFromClientX(ev.clientX);
        if (timestamp == null || this._timelinePointerStartTimestamp == null) return;
        const deltaX2 = ev.clientX - this._timelinePointerStartX;
        if (!this._timelinePointerMoved && Math.abs(deltaX2) < 4) return;
        this._timelinePointerMoved = true;
        this._shiftDraftRangeByDelta(this._getTimelineSelectionDragDeltaMs(timestamp));
        ev.preventDefault();
        return;
      }
      if (this._timelinePointerMode === "interval_select") {
        const timestamp = this._timestampFromClientX(ev.clientX);
        if (timestamp == null || this._timelinePointerStartTimestamp == null) return;
        const deltaX2 = ev.clientX - this._timelinePointerStartX;
        if (!this._timelinePointerMoved && Math.abs(deltaX2) < 4) return;
        this._timelinePointerMoved = true;
        this._setDraftRangeFromIntervalSelection(this._timelinePointerStartTimestamp, timestamp);
        ev.preventDefault();
        return;
      }
      const deltaX = ev.clientX - this._timelinePointerStartX;
      if (!this._timelinePointerMoved && Math.abs(deltaX) < 4) return;
      this._timelinePointerMoved = true;
      this._timelineTrackClickPending = false;
      this._rangeScrollViewportEl.classList.add("dragging");
      const maxScrollLeft = Math.max(0, this._rangeScrollViewportEl.scrollWidth - this._rangeScrollViewportEl.clientWidth);
      this._rangeScrollViewportEl.scrollLeft = clampNumber(
        this._timelinePointerStartScrollLeft - deltaX,
        0,
        maxScrollLeft
      );
      ev.preventDefault();
    }
    _finishTimelinePointerInteraction(ev) {
      if (this._timelinePointerId == null || ev.pointerId !== this._timelinePointerId) return;
      const mode = this._timelinePointerMode;
      const didMove = this._timelinePointerMoved;
      const shouldSelectTrack = this._timelineTrackClickPending && !didMove;
      const clientX = ev.clientX;
      this._detachTimelinePointerListeners();
      if (mode === "selection") {
        this._focusedRangeHandle = null;
        this._hoveredRangeHandle = null;
        this._updateRangeTooltip();
        if (didMove) {
          this._commitRangeSelection({ push: true });
        }
        return;
      }
      if (mode === "interval_select") {
        this._hoveredPeriodRange = null;
        this._updateRangeTooltip();
        if (didMove) {
          this._commitRangeSelection({ push: true });
        }
        return;
      }
      if (shouldSelectTrack) {
        this._handleTrackSelectionAtClientX(clientX);
      }
    }
    _handleTrackSelectionAtClientX(clientX) {
      const timestamp = this._timestampFromClientX(clientX);
      if (timestamp == null) return;
      const startMs = this._draftStartTime?.getTime() ?? this.startTime?.getTime() ?? this.rangeBounds?.min;
      const endMs = this._draftEndTime?.getTime() ?? this.endTime?.getTime() ?? this.rangeBounds?.max;
      if (startMs == null || endMs == null) return;
      const handle = Math.abs(timestamp - startMs) <= Math.abs(timestamp - endMs) ? "start" : "end";
      this._setDraftRangeFromTimestamp(handle, timestamp);
    }
    _handleRangeViewportPointerMove(ev) {
      if (this._timelinePointerId != null || this._rangePointerId != null) return;
      if (ev.composedPath().some((el) => el.tagName === "DP-RANGE-HANDLE")) return;
      if (ev.target?.closest?.(".range-period-button")) return;
      if (ev.target?.closest?.(".range-selection")) return;
      const timestamp = this._timestampFromClientX(ev.clientX);
      if (timestamp == null || !this.rangeBounds) return;
      const unit = this.rangeBounds.config?.labelUnit || this._getEffectiveSnapUnit();
      if (!unit) return;
      this._setHoveredPeriodRange(unit, new Date(timestamp));
    }
    _handleRangeViewportPointerLeave() {
      if (this._timelinePointerId != null || this._rangePointerId != null) return;
      if (this._hoveredPeriodRange) {
        this._hoveredPeriodRange = null;
        this.dispatchEvent(new CustomEvent("dp-range-period-leave", { bubbles: true, composed: true }));
      }
    }
  }
  customElements.define("dp-range-timeline", DpRangeTimeline);
  class DpDateWindowDialog extends i$2 {
    static styles = styles$5;
    static properties = {
      open: { type: Boolean },
      heading: { type: String },
      name: { type: String },
      startValue: { type: String, attribute: "start-value" },
      endValue: { type: String, attribute: "end-value" },
      showDelete: { type: Boolean, attribute: "show-delete" },
      showShortcuts: { type: Boolean, attribute: "show-shortcuts" },
      submitLabel: { type: String, attribute: "submit-label" },
      rangeBounds: { type: Object },
      zoomLevel: { type: String, attribute: "zoom-level" },
      dateSnapping: { type: String, attribute: "date-snapping" }
    };
    constructor() {
      super();
      this.open = false;
      this.heading = "Add date window";
      this.name = "";
      this.startValue = "";
      this.endValue = "";
      this.showDelete = false;
      this.showShortcuts = false;
      this.submitLabel = "Create date window";
      this.rangeBounds = null;
      this.zoomLevel = "auto";
      this.dateSnapping = "hour";
    }
    _emit(name, detail = {}) {
      this.dispatchEvent(
        new CustomEvent(name, {
          detail,
          bubbles: true,
          composed: true
        })
      );
    }
    _onDialogClosed() {
      this._emit("dp-window-close");
    }
    _onCancel() {
      this._emit("dp-window-close");
    }
    _onSubmit() {
      const nameInput = this.shadowRoot?.querySelector("#date-window-name");
      const startInput = this.shadowRoot?.querySelector("#date-window-start");
      const endInput = this.shadowRoot?.querySelector("#date-window-end");
      const nameVal = nameInput?.value ?? this.name;
      this._emit("dp-window-submit", {
        name: String(nameVal ?? "").trim(),
        start: startInput?.value ?? this.startValue,
        end: endInput?.value ?? this.endValue
      });
    }
    _onDelete() {
      this._emit("dp-window-delete");
    }
    _onPreviousShortcut() {
      this._emit("dp-window-shortcut", { direction: -1 });
    }
    _onNextShortcut() {
      this._emit("dp-window-shortcut", { direction: 1 });
    }
    _onDateChange() {
      const startInput = this.shadowRoot?.querySelector("#date-window-start");
      const endInput = this.shadowRoot?.querySelector("#date-window-end");
      this._emit("dp-window-date-change", {
        start: startInput?.value ?? "",
        end: endInput?.value ?? ""
      });
    }
    _onRangeCommit(ev) {
      const { start, end } = ev.detail ?? {};
      if (!start || !end) return;
      const fmt = (ms) => {
        const d2 = new Date(ms);
        const pad = (n2) => String(n2).padStart(2, "0");
        return `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}T${pad(d2.getHours())}:${pad(d2.getMinutes())}`;
      };
      const startStr = fmt(start);
      const endStr = fmt(end);
      const startInput = this.shadowRoot?.querySelector("#date-window-start");
      const endInput = this.shadowRoot?.querySelector("#date-window-end");
      if (startInput) startInput.value = startStr;
      if (endInput) endInput.value = endStr;
      this._emit("dp-window-date-change", { start: startStr, end: endStr });
    }
    /** Parse the startValue / endValue strings to Date objects for the timeline. */
    _parseValueToDate(value) {
      if (!value) return null;
      const d2 = new Date(value);
      return Number.isNaN(d2.getTime()) ? null : d2;
    }
    render() {
      return b`
      <ha-dialog
        ?open=${this.open}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onDialogClosed}
      >
        <span slot="heading">${this.heading}</span>
        <div class="date-window-dialog-content">
          <div class="date-window-dialog-body">
            A date window saves a named date range as a tab, so you can quickly preview it against
            the selected range or jump the chart back to it later.
          </div>

          <div class="date-window-dialog-field name-field">
            <ha-textfield
              id="date-window-name"
              label="Name"
              placeholder="e.g. Heating season start"
              .value=${this.name}
            ></ha-textfield>
          </div>

          <div class="date-window-dialog-field">
            <label>Date range</label>
            <div class="date-window-dialog-dates">
              <div class="date-window-dialog-field">
                <label for="date-window-start">Start</label>
                <input
                  id="date-window-start"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.startValue}
                  @change=${this._onDateChange}
                />
              </div>
              <div class="date-window-dialog-field">
                <label for="date-window-end">End</label>
                <input
                  id="date-window-end"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.endValue}
                  @change=${this._onDateChange}
                />
              </div>
            </div>
          </div>

          ${this.rangeBounds ? b`
                <div class="date-window-dialog-timeline">
                  <dp-range-timeline
                    .startTime=${this._parseValueToDate(this.startValue)}
                    .endTime=${this._parseValueToDate(this.endValue)}
                    .rangeBounds=${this.rangeBounds}
                    .zoomLevel=${this.zoomLevel}
                    .dateSnapping=${this.dateSnapping}
                    @dp-range-commit=${this._onRangeCommit}
                  ></dp-range-timeline>
                </div>
              ` : A}

          ${this.showShortcuts ? b`
                <div class="date-window-dialog-shortcuts">
                  <ha-button @click=${this._onPreviousShortcut}>Use previous range</ha-button>
                  <ha-button @click=${this._onNextShortcut}>Use next range</ha-button>
                </div>
              ` : A}

          <div class="date-window-dialog-actions">
            ${this.showDelete ? b`
                  <ha-button
                    class="date-window-dialog-delete"
                    @click=${this._onDelete}
                  >Delete date window</ha-button>
                ` : A}
            <div class="date-window-dialog-actions-right">
              <ha-button
                class="date-window-dialog-cancel"
                @click=${this._onCancel}
              >Cancel</ha-button>
              <ha-button
                raised
                class="date-window-dialog-submit"
                @click=${this._onSubmit}
              >${this.submitLabel}</ha-button>
            </div>
          </div>
        </div>
      </ha-dialog>
    `;
    }
  }
  customElements.define("dp-date-window-dialog", DpDateWindowDialog);
  const styles$2 = i$5`
  :host {
    display: contents;
  }

  .floating-menu {
    position: fixed;
    top: var(--floating-menu-top, 64px);
    left: var(--floating-menu-left, 0px);
    z-index: 9999;
    min-width: var(--floating-menu-min-width, 220px);
    width: var(--floating-menu-width, auto);
    max-height: var(--floating-menu-max-height, none);
    overflow: var(--floating-menu-overflow, visible);
    padding: var(--floating-menu-padding, var(--dp-spacing-xs, 4px));
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .floating-menu[hidden] {
    display: none;
  }
`;
  class DpFloatingMenu extends i$2 {
    static styles = styles$2;
    static properties = {
      open: { type: Boolean, reflect: true }
    };
    constructor() {
      super();
      this.open = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this._onPointerDown = this._onPointerDown.bind(this);
      window.addEventListener("pointerdown", this._onPointerDown, true);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("pointerdown", this._onPointerDown, true);
    }
    _onPointerDown(e2) {
      if (!this.open) {
        return;
      }
      const path = e2.composedPath();
      const clickedInside = path.some((node) => node === this);
      if (!clickedInside) {
        this.dispatchEvent(
          new CustomEvent("dp-menu-close", {
            detail: {},
            bubbles: true,
            composed: true
          })
        );
      }
    }
    render() {
      return b`
      <div
        class="floating-menu"
        role="menu"
        ?hidden=${!this.open}
      >
        <slot></slot>
      </div>
    `;
    }
  }
  customElements.define("dp-floating-menu", DpFloatingMenu);
  class DpPageMenuItem extends i$2 {
    static properties = {
      icon: { type: String },
      label: { type: String },
      disabled: { type: Boolean }
    };
    static styles = i$5`
    :host { display: block; }
    button {
      width: 100%; min-height: 38px;
      padding: var(--dp-spacing-sm, 8px) var(--dp-spacing-sm, 8px);
      display: flex; align-items: center; gap: var(--dp-spacing-sm, 8px);
      border: none; border-radius: 10px; background: transparent;
      color: var(--primary-text-color); font: inherit; text-align: left; cursor: pointer;
    }
    button:hover, button:focus-visible {
      background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
      outline: none;
    }
    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button[disabled]:hover {
      background: transparent;
    }
    ha-icon {
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
      flex: 0 0 auto;
    }
  `;
    constructor() {
      super();
      this.icon = "";
      this.label = "";
      this.disabled = false;
    }
    _onClick() {
      if (this.disabled) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("dp-menu-action", {
          bubbles: true,
          composed: true
        })
      );
    }
    render() {
      return b`
      <button
        type="button"
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <ha-icon icon="${this.icon}"></ha-icon>
        ${this.label}
      </button>
    `;
    }
  }
  customElements.define("dp-page-menu-item", DpPageMenuItem);
  const styles$1 = i$5`
  :host {
    display: contents;
  }

  /* ---- track overlays (positioned inside dp-range-timeline's .range-track) ---- */

  .range-hover-preview {
    position: absolute;
    top: 14px;
    height: 14px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-hover-preview.visible {
    opacity: 1;
  }

  .range-comparison-preview {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 58%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-comparison-preview.visible {
    opacity: 1;
  }

  .range-zoom-highlight {
    position: absolute;
    top: -6px;
    height: 16px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
    box-shadow:
      inset 0 0 0 2px var(--primary-color, #03a9f4),
      0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 72%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-highlight.visible {
    opacity: 1;
  }

  .range-zoom-window-highlight {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 4;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 52%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 85%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-window-highlight.visible {
    opacity: 1;
  }

  /* ---- timeline overlays (positioned inside dp-range-timeline's .range-timeline) ---- */

  .range-event-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-event-dot {
    position: absolute;
    bottom: 18px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .range-chart-hover-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-line.visible {
    opacity: 1;
  }

  .range-chart-hover-window-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-window-line.visible {
    opacity: 0.45;
  }
`;
  class DpPanelTimeline extends i$2 {
    static properties = {
      // Core props — forwarded to dp-range-timeline
      startTime: { type: Object },
      endTime: { type: Object },
      rangeBounds: { type: Object },
      zoomLevel: { type: String },
      dateSnapping: { type: String },
      isLiveEdge: { type: Boolean },
      // Overlay props
      hoveredPeriodRange: { type: Object },
      comparisonPreview: { type: Object },
      zoomRange: { type: Object },
      zoomWindowRange: { type: Object },
      chartHoverTimeMs: { type: Number },
      chartHoverWindowTimeMs: { type: Number },
      events: { type: Array }
    };
    static styles = styles$1;
    // Cached overlay DOM refs (set in firstUpdated)
    _rangeHoverPreviewEl = null;
    _rangeComparisonPreviewEl = null;
    _rangeZoomHighlightEl = null;
    _rangeZoomWindowHighlightEl = null;
    _rangeChartHoverLineEl = null;
    _rangeChartHoverWindowLineEl = null;
    _rangeEventLayerEl = null;
    constructor() {
      super();
      this.startTime = null;
      this.endTime = null;
      this.rangeBounds = null;
      this.zoomLevel = "day";
      this.dateSnapping = "auto";
      this.isLiveEdge = false;
      this.hoveredPeriodRange = null;
      this.comparisonPreview = null;
      this.zoomRange = null;
      this.zoomWindowRange = null;
      this.chartHoverTimeMs = null;
      this.chartHoverWindowTimeMs = null;
      this.events = [];
    }
    firstUpdated() {
      const sr = this.shadowRoot;
      this._rangeHoverPreviewEl = sr.getElementById("range-hover-preview");
      this._rangeComparisonPreviewEl = sr.getElementById("range-comparison-preview");
      this._rangeZoomHighlightEl = sr.getElementById("range-zoom-highlight");
      this._rangeZoomWindowHighlightEl = sr.getElementById("range-zoom-window-highlight");
      this._rangeChartHoverLineEl = sr.getElementById("range-chart-hover-line");
      this._rangeChartHoverWindowLineEl = sr.getElementById("range-chart-hover-window-line");
      this._rangeEventLayerEl = sr.getElementById("range-event-layer");
      this._syncAllOverlays();
    }
    updated(changed) {
      const trackProps = ["hoveredPeriodRange", "comparisonPreview", "zoomRange", "zoomWindowRange", "rangeBounds"];
      const timelineProps = ["chartHoverTimeMs", "chartHoverWindowTimeMs", "events", "rangeBounds"];
      if (trackProps.some((p2) => changed.has(p2))) {
        this._syncTrackOverlays();
      }
      if (timelineProps.some((p2) => changed.has(p2))) {
        this._syncTimelineOverlays();
      }
    }
    render() {
      return b`
      <dp-range-timeline
        .startTime=${this.startTime}
        .endTime=${this.endTime}
        .rangeBounds=${this.rangeBounds}
        .zoomLevel=${this.zoomLevel}
        .dateSnapping=${this.dateSnapping}
        .isLiveEdge=${this.isLiveEdge}
        @dp-range-period-hover=${this._onPeriodHoverInternal}
        @dp-range-period-leave=${this._onPeriodLeaveInternal}
      >
        <!-- track overlays: positioned inside .range-track of dp-range-timeline -->
        <div slot="track-overlays" id="range-hover-preview" class="range-hover-preview"></div>
        <div slot="track-overlays" id="range-comparison-preview" class="range-comparison-preview"></div>
        <div slot="track-overlays" id="range-zoom-highlight" class="range-zoom-highlight"></div>
        <div slot="track-overlays" id="range-zoom-window-highlight" class="range-zoom-window-highlight"></div>
        <!-- timeline overlays: positioned inside .range-timeline of dp-range-timeline -->
        <div slot="timeline-overlays" id="range-chart-hover-line" class="range-chart-hover-line" aria-hidden="true"></div>
        <div slot="timeline-overlays" id="range-chart-hover-window-line" class="range-chart-hover-window-line" aria-hidden="true"></div>
        <div slot="timeline-overlays" id="range-event-layer" class="range-event-layer"></div>
      </dp-range-timeline>
    `;
    }
    // ---------------------------------------------------------------------------
    // Coordinate helper
    // ---------------------------------------------------------------------------
    _pct(ms) {
      if (!this.rangeBounds) return 0;
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      return (ms - this.rangeBounds.min) / total * 100;
    }
    // ---------------------------------------------------------------------------
    // Internal period hover handling (from dp-range-period-hover/leave events
    // bubbling up from the inner dp-range-timeline atom)
    // ---------------------------------------------------------------------------
    revealSelection() {
      const timeline = this.shadowRoot?.querySelector("dp-range-timeline");
      timeline?.revealSelection?.();
    }
    _onPeriodHoverInternal(ev) {
      const { start, end } = ev.detail;
      this.hoveredPeriodRange = { start: start.getTime(), end: end.getTime() };
    }
    _onPeriodLeaveInternal() {
      this.hoveredPeriodRange = null;
    }
    // ---------------------------------------------------------------------------
    // Overlay sync
    // ---------------------------------------------------------------------------
    _syncAllOverlays() {
      this._syncTrackOverlays();
      this._syncTimelineOverlays();
    }
    _setRangeOverlay(el, range) {
      if (!el) return;
      if (!range || !this.rangeBounds) {
        el.classList.remove("visible");
        return;
      }
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      const startClamped = clampNumber(range.start, this.rangeBounds.min, this.rangeBounds.max);
      const endClamped = clampNumber(range.end, this.rangeBounds.min, this.rangeBounds.max);
      const startPct = (startClamped - this.rangeBounds.min) / total * 100;
      const endPct = (endClamped - this.rangeBounds.min) / total * 100;
      el.style.left = `${startPct}%`;
      el.style.width = `${Math.max(0, endPct - startPct)}%`;
      el.classList.add("visible");
    }
    _setHoverLine(el, timeMs) {
      if (!el) return;
      if (timeMs == null || !this.rangeBounds) {
        el.classList.remove("visible");
        return;
      }
      const clamped = clampNumber(timeMs, this.rangeBounds.min, this.rangeBounds.max);
      el.style.left = `${this._pct(clamped)}%`;
      el.classList.add("visible");
    }
    _syncTrackOverlays() {
      this._setRangeOverlay(this._rangeHoverPreviewEl, this.hoveredPeriodRange ?? null);
      this._setRangeOverlay(this._rangeComparisonPreviewEl, this.comparisonPreview ?? null);
      this._setRangeOverlay(this._rangeZoomHighlightEl, this.zoomRange ?? null);
      this._setRangeOverlay(this._rangeZoomWindowHighlightEl, this.zoomWindowRange ?? null);
    }
    _syncTimelineOverlays() {
      this._setHoverLine(this._rangeChartHoverLineEl, this.chartHoverTimeMs ?? null);
      this._setHoverLine(this._rangeChartHoverWindowLineEl, this.chartHoverWindowTimeMs ?? null);
      this._syncEventLayer();
    }
    _syncEventLayer() {
      if (!this._rangeEventLayerEl || !this.rangeBounds) return;
      this._rangeEventLayerEl.innerHTML = "";
      const fragment = document.createDocumentFragment();
      const total = Math.max(1, this.rangeBounds.max - this.rangeBounds.min);
      for (const event of this.events) {
        const timestamp = new Date(event.timestamp).getTime();
        if (!Number.isFinite(timestamp) || timestamp < this.rangeBounds.min || timestamp > this.rangeBounds.max) continue;
        const dot = document.createElement("span");
        dot.className = "range-event-dot";
        dot.style.left = `${(timestamp - this.rangeBounds.min) / total * 100}%`;
        dot.style.background = event.color ?? "#03a9f4";
        fragment.appendChild(dot);
      }
      this._rangeEventLayerEl.appendChild(fragment);
    }
  }
  customElements.define("dp-panel-timeline", DpPanelTimeline);
  const styles = i$5`
  :host {
    display: grid;
    overflow: hidden;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Vertical (top / bottom) layout ─────────────────────────────────────── */

  :host([direction="vertical"]),
  :host(:not([direction])) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows:
      minmax(var(--dp-panes-min-first, 0px), var(--dp-panes-top-size, 50%))
      var(--dp-panes-splitter-size, 24px)
      minmax(var(--dp-panes-min-second, 0px), 1fr);
  }

  /* When second pane is hidden, first pane fills all space */
  :host([second-hidden]) {
    grid-template-rows: minmax(0, 1fr) !important;
    grid-template-columns: minmax(0, 1fr) !important;
  }

  /* ── Horizontal (left / right) layout ───────────────────────────────────── */

  :host([direction="horizontal"]) {
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns:
      minmax(var(--dp-panes-min-first, 0px), var(--dp-panes-top-size, 50%))
      var(--dp-panes-splitter-size, 24px)
      minmax(var(--dp-panes-min-second, 0px), 1fr);
  }

  /* ── Slots ───────────────────────────────────────────────────────────────── */

  .pane-first {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .pane-second {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  /* Slotted content must fill the pane — the pane's grid height is definite
     so height:100% resolves correctly for slotted elements. */
  ::slotted(*) {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  /* ── Splitter handle ─────────────────────────────────────────────────────── */

  .pane-splitter {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([direction="vertical"]) .pane-splitter,
  :host(:not([direction])) .pane-splitter {
    cursor: row-resize;
    width: 100%;
  }

  :host([direction="horizontal"]) .pane-splitter {
    cursor: col-resize;
    height: 100%;
  }

  /* Drag indicator pill */
  .pane-splitter::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
    transition: background 120ms ease;
  }

  :host([direction="vertical"]) .pane-splitter::after,
  :host(:not([direction])) .pane-splitter::after {
    width: 60px;
    height: 6px;
  }

  :host([direction="horizontal"]) .pane-splitter::after {
    width: 6px;
    height: 60px;
  }

  .pane-splitter:hover::after,
  .pane-splitter:focus-visible::after,
  .pane-splitter.dragging::after {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }

  .pane-splitter:focus-visible {
    outline: none;
  }
`;
  class DpResizablePanes extends i$2 {
    static styles = styles;
    static properties = {
      direction: { type: String, reflect: true },
      ratio: { type: Number },
      min: { type: Number },
      max: { type: Number },
      secondHidden: { type: Boolean, attribute: "second-hidden", reflect: true }
    };
    // ── Internal drag state ────────────────────────────────────────────────────
    _pointerId = null;
    _splitterEl = null;
    constructor() {
      super();
      this.direction = "vertical";
      this.ratio = 0.5;
      this.min = 0.25;
      this.max = 0.75;
      this.secondHidden = false;
    }
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    firstUpdated() {
      this._splitterEl = this.shadowRoot?.querySelector(".pane-splitter") ?? null;
      this._applyRatio();
    }
    updated(changed) {
      if (changed.has("ratio") || changed.has("direction") || changed.has("secondHidden")) {
        this._applyRatio();
      }
    }
    // ── Layout ─────────────────────────────────────────────────────────────────
    _applyRatio() {
      this.style.setProperty("--dp-panes-top-size", `${Math.round(this.ratio * 1e3) / 10}%`);
    }
    // ── Pointer handling ───────────────────────────────────────────────────────
    _onPointerDown = (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      this._pointerId = ev.pointerId;
      this._splitterEl?.classList.add("dragging");
      window.addEventListener("pointermove", this._onPointerMove);
      window.addEventListener("pointerup", this._onPointerUp);
      window.addEventListener("pointercancel", this._onPointerUp);
    };
    _onPointerMove = (ev) => {
      if (this._pointerId == null || ev.pointerId !== this._pointerId) return;
      ev.preventDefault();
      const rect = this.getBoundingClientRect();
      const totalSize = this.direction === "horizontal" ? rect.width : rect.height;
      if (!totalSize) return;
      const pointerOffset = this.direction === "horizontal" ? ev.clientX - rect.left : ev.clientY - rect.top;
      const clamped = Math.min(Math.max(this.min, pointerOffset / totalSize), this.max);
      this.ratio = clamped;
      this._applyRatio();
      this.dispatchEvent(new CustomEvent("dp-panes-resize", {
        detail: { ratio: clamped },
        bubbles: true,
        composed: true
      }));
    };
    _onPointerUp = (ev) => {
      if (this._pointerId == null || ev.pointerId !== this._pointerId) return;
      this._pointerId = null;
      this._splitterEl?.classList.remove("dragging");
      window.removeEventListener("pointermove", this._onPointerMove);
      window.removeEventListener("pointerup", this._onPointerUp);
      window.removeEventListener("pointercancel", this._onPointerUp);
      this.dispatchEvent(new CustomEvent("dp-panes-resize", {
        detail: { ratio: this.ratio, committed: true },
        bubbles: true,
        composed: true
      }));
    };
    // ── Render ─────────────────────────────────────────────────────────────────
    render() {
      return b`
      <div class="pane-first"><slot name="first"></slot></div>
      ${!this.secondHidden ? b`
        <button
          class="pane-splitter"
          type="button"
          aria-label="Resize panes"
          @pointerdown=${this._onPointerDown}
        ></button>
        <div class="pane-second"><slot name="second"></slot></div>
      ` : null}
    `;
    }
  }
  customElements.define("dp-resizable-panes", DpResizablePanes);
  class DpHistoryChart extends HTMLElement {
    // ── Internal state ─────────────────────────────────────────────────────────
    _configKey = "";
    _config = null;
    _hass = null;
    _chartEl = null;
    // ── Construction ───────────────────────────────────────────────────────────
    connectedCallback() {
      if (!this._chartEl) {
        const card = document.createElement("hass-datapoints-history-card");
        card.style.cssText = "flex:1 1 auto;min-width:0;min-height:0;width:100%;height:100%;";
        this.appendChild(card);
        this._chartEl = card;
        this._applyConfig();
        if (this._hass !== null && this._chartEl) {
          this._chartEl.hass = this._hass;
        }
      }
    }
    // ── Public API ─────────────────────────────────────────────────────────────
    /** Direct reference to the inner `hass-datapoints-history-card` element. */
    get chartEl() {
      return this._chartEl;
    }
    get config() {
      return this._config;
    }
    set config(value) {
      this._config = value;
      this._applyConfig();
    }
    get hass() {
      return this._hass;
    }
    set hass(value) {
      this._hass = value;
      if (this._chartEl) {
        this._chartEl.hass = value;
      }
    }
    /**
     * Passes an external committed zoom range to the inner card.
     */
    setExternalZoomRange(range) {
      this._chartEl?.setExternalZoomRange?.(range);
    }
    // ── Internal helpers ───────────────────────────────────────────────────────
    _applyConfig() {
      if (!this._chartEl || !this._config) return;
      const nextKey = JSON.stringify(this._config);
      if (nextKey !== this._configKey) {
        this._chartEl.setConfig(this._config);
        this._configKey = nextKey;
      }
    }
  }
  customElements.define("dp-history-chart", DpHistoryChart);
  const DATA_GAP_THRESHOLD_OPTIONS = [
    { value: "auto", label: "Auto-detect" },
    { value: "5m", label: "5 minutes" },
    { value: "15m", label: "15 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "2h", label: "2 hours" },
    { value: "3h", label: "3 hours" },
    { value: "6h", label: "6 hours" },
    { value: "12h", label: "12 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_TREND_METHOD_OPTIONS = [
    { value: "rolling_average", label: "Rolling average" },
    { value: "linear_trend", label: "Linear trend" }
  ];
  const ANALYSIS_TREND_WINDOW_OPTIONS = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "14d", label: "14 days" },
    { value: "21d", label: "21 days" },
    { value: "28d", label: "28 days" }
  ];
  const ANALYSIS_RATE_WINDOW_OPTIONS = [
    { value: "point_to_point", label: "Point to point" },
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];
  const ANALYSIS_ANOMALY_METHOD_OPTIONS = [
    { value: "trend_residual", label: "Trend deviation", help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline." },
    { value: "rate_of_change", label: "Sudden change", help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions." },
    { value: "iqr", label: "Statistical outlier (IQR)", help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages." },
    { value: "rolling_zscore", label: "Rolling Z-score", help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series." },
    { value: "persistence", label: "Flat-line / stuck value", help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings." },
    { value: "comparison_window", label: "Comparison window deviation", help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year." }
  ];
  const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS = [
    { value: "1h", label: "1 hour" },
    { value: "6h", label: "6 hours" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" }
  ];
  const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS = [
    { value: "30m", label: "30 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "3h", label: "3 hours" },
    { value: "6h", label: "6 hours" },
    { value: "12h", label: "12 hours" },
    { value: "24h", label: "24 hours" }
  ];
  const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
    { value: "all", label: "Show all anomalies" },
    { value: "highlight", label: "Highlight overlaps" },
    { value: "only", label: "Overlaps only" }
  ];
  function isAnalysisSupportedForRow(row) {
    return typeof row?.entity_id === "string" && !row.entity_id.startsWith("binary_sensor.");
  }
  const PANEL_HISTORY_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    --ha-tooltip-background-color: color-mix(in srgb, #0f1218 96%, transparent);
    --ha-tooltip-text-color: rgba(255, 255, 255, 0.96);
    --ha-tooltip-padding: var(--dp-spacing-md) calc(var(--dp-spacing-md) + 10px);
    --ha-tooltip-border-radius: 10px;
    --ha-tooltip-arrow-size: 10px;
    --ha-tooltip-font-size: 0.86rem;
    --ha-tooltip-line-height: 1.1;
  }

  ha-tooltip::part(base__arrow) {
    z-index: -1;
  }

  ha-tooltip::part(body) {
    padding: var(--dp-spacing-md);
  }

  ha-top-app-bar-fixed {
    display: block;
    height: 100%;
    min-height: 100%;
    overflow: visible;
    --app-header-background-color: var(--card-background-color, var(--primary-background-color));
    --app-header-text-color: var(--primary-text-color);
  }

  ha-top-app-bar-fixed:not(:defined) {
    display: grid;
    min-height: 100%;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto 1fr;
    align-items: center;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="navigationIcon"] {
    grid-column: 1;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="title"] {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    padding: 0 var(--dp-spacing-lg);
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 64px;
    color: var(--app-header-text-color, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="actionItems"] {
    grid-column: 3;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > .controls-section {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  ha-top-app-bar-fixed:not(:defined) > .page-content {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  ha-menu-button:not(:defined),
  ha-icon-button:not(:defined) {
    display: block;
    width: 48px;
    height: 48px;
  }

  .controls-section {
    position: relative;
    overflow: visible;
    z-index: 1;
    background: var(--app-header-background-color, var(--card-background-color, var(--primary-background-color)));
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    box-sizing: border-box;
    padding: var(--dp-spacing-md) var(--dp-spacing-md) var(--dp-spacing-md) 0;
  }

  .page-header-actions {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 48px;
    z-index: 40;
  }

  .page-menu-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    z-index: 40;
  }

  .page-menu-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .page-menu-button:hover,
  .page-menu-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .page-menu {
    position: fixed;
    top: var(--page-menu-top, 56px);
    left: var(--page-menu-left, 0px);
    z-index: 9999;
    min-width: 220px;
    padding: var(--dp-spacing-xs);
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .page-menu[hidden] {
    display: none;
  }

  .page-menu-item {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .page-menu-item:hover,
  .page-menu-item:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .page-menu-item ha-icon {
    --mdc-icon-size: 18px;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }

  .controls-grid {
    display: block;
    width: 100%;
    overflow: visible;
    position: relative;
    z-index: 20;
  }

  .page-content {
    position: relative;
    z-index: 0;
    height: var(--history-page-content-height, 100%);
    min-height: 0;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
    align-items: stretch;
    padding: 0;
    transition: grid-template-columns 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-content.sidebar-collapsed {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .page-sidebar {
    position: relative;
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--dp-spacing-lg);
    border-right: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    overflow-y: auto;
    transition: padding 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-sidebar.collapsed {
    padding: 0;
  }

  .page-sidebar.collapsed .sidebar-toggle-button {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .sidebar-toggle-button {
    position: absolute;
    top: var(--dp-spacing-xs);
    right: calc(var(--dp-spacing-sm) / 2);
    width: 48px;
    height: 48px;
    padding: 0;
    margin: 0;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
    z-index: 2;
  }

  .sidebar-toggle-button:hover,
  .sidebar-toggle-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .sidebar-toggle-button ha-icon {
    display: block;
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-sidebar.collapsed .sidebar-toggle-button ha-icon {
    transform: rotate(180deg);
  }

  .content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    align-self: stretch;
    box-sizing: border-box;
    overflow: hidden;
    padding: var(--dp-spacing-lg);
  }

  .content > dp-resizable-panes {
    flex: 1 1 0;
    min-height: 0;
  }

  /* Legacy: when dp-resizable-panes is not used (e.g. empty state) */
  .content > ha-card.empty {
    flex: 0 0 auto;
  }

  .content.datapoints-hidden dp-resizable-panes {
    --dp-panes-second-hidden: 1;
  }

  .control-target {
    width: 100%;
    max-width: none;
    min-width: 0;
    box-sizing: border-box;
  }

  .history-targets {
    display: grid;
    gap: var(--dp-spacing-md);
  }

  .sidebar-section-header {
    display: grid;
    gap: var(--dp-spacing-xs);
  }

  .sidebar-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .sidebar-section-subtitle {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }

  .history-target-picker-slot {
    min-width: 0;
    margin-top: 0;
    margin-bottom: calc(var(--spacing, 8px) * 2);
    margin-top: calc(var(--ha-space-3) * -1);
  }

  .history-targets-collapsed-summary {
    display: none;
    grid-auto-rows: max-content;
    gap: var(--dp-spacing-sm);
    justify-items: center;
    padding-top: calc(var(--spacing, 8px) * 7);
  }

  .history-targets-collapsed-empty {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
  }

  .history-targets-collapsed-item {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: 0;
    margin: 0;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
    color: var(--secondary-text-color);
    --mdc-icon-size: 18px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .history-targets-collapsed-item:hover,
  .history-targets-collapsed-item:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    outline: none;
  }

  .history-targets-collapsed-item.is-hidden {
    opacity: 0.55;
  }

  .history-targets-collapsed-item::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 3px var(--row-color, transparent);
    pointer-events: none;
  }

  .history-targets-collapsed-item ha-state-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin: 0;
  }

  /* ── Collapsed-sidebar target popup ──────────────────────────────────── */

  .collapsed-target-popup {
    position: fixed;
    z-index: 9;
    width: 300px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .collapsed-target-popup[hidden] {
    display: none;
  }

  /* Row inside popup: remove card styling (popup is the card) and collapse the drag-handle column */
  .collapsed-target-popup .history-target-row {
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
    grid-template-columns: 0 minmax(0, 1fr) auto;
  }

  .collapsed-target-popup .history-target-row:hover {
    border-color: transparent;
    background: transparent;
  }

  .history-target-empty {
    padding: var(--dp-spacing-md) var(--dp-spacing-sm);
    border-radius: 12px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
    color: var(--secondary-text-color);
    font-size: 0.84rem;
  }

  .history-target-table {
    display: grid;
  }

  .history-target-table-body {
    display: grid;
    gap: calc(var(--spacing, 8px) * 1.25);
  }

  .history-target-row {
    display: grid;
    position: relative;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "handle name actions"
      ". analysis analysis";
    gap: var(--dp-spacing-sm);
    align-items: center;
    margin: 0;
    padding: calc(var(--spacing, 8px) * 1.125) calc(var(--spacing, 8px) * 1.25);
    border-radius: 16px;
    background: var(--card-background-color, #fff);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    transition: border-color 140ms ease, background-color 140ms ease;
    padding-bottom: 0;
    padding-left: 3px;
  }
  
  .history-target-row.analysis-open {
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
  }

  .history-target-row.is-hidden {
    opacity: 0.62;
  }

  .history-target-row:hover {
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, var(--divider-color, rgba(0, 0, 0, 0.12)));
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 2%, var(--card-background-color, #fff));
  }

  .history-target-row.is-dragging {
    opacity: 0.35;
  }

  .history-target-row.is-drag-over-before {
    box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-row.is-drag-over-after {
    box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-drag-handle {
    grid-area: handle;
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: grab;
    opacity: 0;
    transition: opacity 140ms ease, background-color 120ms ease;
    touch-action: none;
    margin-right: calc(var(--dp-spacing-xs) * -0.5);
    margin-left: -8px;
    position: absolute;
  }

  .history-target-drag-handle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    pointer-events: none;
  }

  .history-target-row:hover .history-target-drag-handle {
    opacity: 0.45;
  }

  .history-target-drag-handle:hover,
  .history-target-drag-handle:focus-visible {
    opacity: 1;
    outline: none;
  }

  .history-target-drag-handle:active {
    cursor: grabbing;
  }

  .history-target-name {
    grid-area: name;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--dp-spacing-sm);
    align-items: center;
  }

  .history-target-name-text {
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .history-target-entity-id {
    margin-top: 4px;
    font-size: 0.74rem;
    font-weight: 400;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-target-color-field {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    overflow: hidden;
  }

  .history-target-controls {
    display: contents;
  }

  .history-target-color-icon {
    position: absolute;
    inset: 0;
    display: inline-grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: var(--row-icon-color, var(--text-primary-color, #fff));
    pointer-events: none;
    z-index: 1;
  }

  .history-target-color-icon ha-state-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .history-target-color {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 10px;
    padding: 0;
    background: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    opacity: 0;
    z-index: 2;
  }

  .history-target-color::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .history-target-color::-webkit-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color::-moz-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color-field::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--row-color, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, rgba(0, 0, 0, 0.18) 70%, transparent);
  }

  .history-target-color:focus-visible + .history-target-color-icon {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
    outline-offset: 2px;
    border-radius: inherit;
  }

  .history-target-actions,
  .history-target-actions-head {
    grid-area: actions;
    justify-self: end;
    align-self: center;
  }

  .history-target-actions {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }

  .history-target-analysis-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease, transform 120ms ease;
  }

  .history-target-analysis-toggle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    transition: transform 120ms ease;
  }

  .history-target-analysis-toggle.is-open ha-icon {
    transform: rotate(180deg);
  }

  .history-target-analysis-toggle:hover,
  .history-target-analysis-toggle:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }

  .history-target-analysis {
    grid-area: analysis;
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: calc(var(--spacing, 8px) * 0.25);
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 78%, transparent);
  }

  .history-target-analysis[hidden] {
    display: none;
  }

  .history-target-analysis-grid {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: var(--dp-spacing-sm);
  }

  .history-target-analysis-toggle-group {
    display: flex;
    gap: calc(var(--spacing, 8px) * 0.625);
    align-items: center;
  }

  .history-target-analysis-option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
  }
  
  .history-target-analysis-option.top {
    align-items: flex-start;
  }

  .history-target-analysis-option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .history-target-analysis-option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }
  
  .history-target-analysis-option-help-text {
    display: inline-block;
    color: var(--secondary-text-color);
    opacity: 0.8;
    padding-top: 2px;
  }

  .analysis-computing-spinner {
    display: none;
    width: 10px;
    height: 10px;
    border: 2px solid var(--divider-color, #ccc);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: analysis-spin 0.7s linear infinite;
    flex-shrink: 0;
    margin-left: 2px;
  }

  .analysis-computing-spinner.active {
    display: inline-block;
  }

  @keyframes analysis-spin {
    to { transform: rotate(360deg); }
  }

  .history-target-analysis-field {
    display: grid;
    gap: 4px;
    justify-items: start;
  }

  .history-target-analysis-field-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--secondary-text-color);
  }

  .history-target-analysis-select,
  .history-target-analysis-input {
    width: auto;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--spacing, 8px) * 0.75) calc(var(--spacing, 8px) * 0.875);
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.84rem;
  }

  .history-target-analysis-row {
    display: grid;
    gap: var(--dp-spacing-sm);
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .history-target-analysis-group {
    display: grid;
    gap: var(--dp-spacing-sm);
    border-radius: 6px;
  }
  
  .history-target-analysis-group.is-open {
      padding-bottom: 0;
  }

  .history-target-analysis-group-body {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
    padding-left: var(--dp-spacing-md);
  }

  .history-target-analysis-method-list {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .history-target-analysis-method-item {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .analysis-method-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--secondary-text-color, #888);
    background: transparent;
    color: var(--secondary-text-color, #888);
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: default;
    padding: 0;
    vertical-align: middle;
  }

  .history-target-analysis-method-subopts {
    padding-left: calc(var(--spacing, 8px) * 1.5);
    display: grid;
    gap: var(--dp-spacing-sm);
    border-left: 3px solid var(--primary-color);
    margin-left: 5px;
  }

  .history-target-visible-toggle {
    position: relative;
    display: inline-flex;
    width: 34px;
    height: 20px;
    flex: 0 0 auto;
    cursor: pointer;
  }

  .history-target-visible-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }

  .history-target-visible-toggle-track {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--secondary-text-color, #6b7280) 45%, transparent);
    transition: background-color 120ms ease;
  }

  .history-target-visible-toggle-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: transform 120ms ease;
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track {
    background: var(--primary-color);
  }

  .history-target-visible-toggle input:checked + .history-target-visible-toggle-track::after {
    transform: translateX(14px);
  }

  .history-target-visible-toggle input:focus-visible + .history-target-visible-toggle-track {
    outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
    outline-offset: 2px;
  }

  .history-target-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    min-width: 16px;
    line-height: 16px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .history-target-remove ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .history-target-remove:hover,
  .history-target-remove:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
    color: var(--error-color, #db4437);
    outline: none;
  }

  .page-sidebar.collapsed .control-target {
    display: block;
  }

  .sidebar-options {
    width: 100%;
    box-sizing: border-box;
  }

  .page-sidebar.collapsed .sidebar-options {
    display: none;
  }

  .page-sidebar.collapsed .history-targets-header,
  .page-sidebar.collapsed .history-target-picker-slot,
  .page-sidebar.collapsed .history-target-rows {
    display: none;
  }

  .page-sidebar.collapsed .history-targets-collapsed-summary {
    display: grid;
  }

  .sidebar-options-card {
    display: grid;
    gap: var(--dp-spacing-lg);
  }

  .sidebar-options-section {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-radio-group {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-radio-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }

  .sidebar-toggle-group {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-select-group {
    display: grid;
    gap: var(--dp-spacing-sm);
    margin-top: var(--dp-spacing-xs);
  }

  .sidebar-select-field {
    display: grid;
    gap: 6px;
  }

  .sidebar-select-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }

  .sidebar-helper-text {
    font-size: 0.8rem;
    line-height: 1.35;
    color: var(--secondary-text-color);
  }

  .sidebar-analysis-thresholds {
    display: grid;
    gap: var(--dp-spacing-sm);
    margin-top: var(--dp-spacing-sm);
  }

  .sidebar-threshold-row {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .sidebar-threshold-label {
    min-width: 0;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-threshold-input-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--dp-spacing-sm);
  }

  .sidebar-threshold-input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    padding: 0 10px;
    min-height: 38px;
  }

  .sidebar-threshold-input:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 32%, transparent);
    outline-offset: 1px;
  }

  .sidebar-threshold-unit {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .sidebar-select {
    width: 100%;
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    border-radius: 10px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .sidebar-toggle-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }

  .sidebar-toggle-option input {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .sidebar-radio-option input {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .cw-scan-btn {
    display: block;
    width: 100%;
    padding: var(--dp-spacing-xs) var(--dp-spacing-sm);
    background: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    box-sizing: border-box;
  }

  .cw-scan-btn:hover {
    opacity: 0.88;
  }

  .cw-list {
    display: grid;
    gap: 4px;
    margin-top: var(--dp-spacing-sm);
  }

  .cw-row {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-xs);
    font-size: 0.82rem;
    color: var(--primary-text-color);
  }

  .cw-row input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
    accent-color: var(--primary-color, #03a9f4);
  }

  .cw-row-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cw-remove-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0 2px;
    cursor: pointer;
    color: var(--secondary-text-color);
    font-size: 1rem;
    line-height: 1;
    border-radius: 3px;
  }

  .cw-remove-btn:hover {
    color: var(--error-color, #db4437);
  }

  .control-date {
    width: 100%;
    min-width: 0;
  }

  .chart-host,
  .list-host {
    width: 100%;
    min-width: 0;
    min-height: 0;
  }

  .chart-host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .list-host {
    min-height: 0;
    display: flex;
    overflow: hidden;
  }

  .content-splitter {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: row-resize;
    touch-action: none;
  }

  .content-splitter::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    transform: translateY(-50%);
  }

  .content-splitter::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 60px;
    height: 6px;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
  }

  .content-splitter:hover::after,
  .content-splitter:focus-visible::after,
  .content-splitter.dragging::after {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }

  .content-splitter:focus-visible {
    outline: none;
  }

  .list-host ha-card,
  .chart-host ha-card {
    width: 100%;
  }

  .list-host > *,
  .chart-host > * {
    width: 100%;
  }

  .chart-card-host {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    width: 100%;
    overflow: hidden;
  }

  .chart-card-host > * {
    height: 100%;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }

  .list-host > * {
    height: 100%;
  }

  .empty {
    padding: calc(var(--spacing, 8px) * 4) var(--dp-spacing-xl);
    text-align: center;
    color: var(--secondary-text-color);
  }

  .date-window-dialog-content {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) 0 0;
    overflow: visible;
  }

  .date-window-dialog-body {
    color: var(--secondary-text-color);
    line-height: 1.4;
    margin-bottom: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-field {
    display: grid;
    gap: var(--dp-spacing-xs);
    overflow: visible;
  }

  .date-window-dialog-field.name-field {
    max-width: 320px;
  }

  .date-window-dialog-field label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .date-window-dialog-field ha-textfield,
  .date-window-dialog-field input {
    width: 100%;
  }

  .date-window-dialog-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 92%, transparent);
    border-radius: 12px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .date-window-dialog-input:focus {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 36%, transparent);
    outline-offset: 1px;
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
  }

  .date-window-dialog-shortcuts[hidden] {
    display: none;
  }

  .date-window-dialog-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
    padding-top: 0;
    margin-top: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-actions-right {
    display: flex;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
    margin-left: auto;
  }

  .date-window-dialog-actions ha-button {
    --mdc-typography-button-font-size: 0.875rem;
  }

  .date-window-dialog-cancel {
    --mdc-theme-primary: var(--primary-text-color);
  }

  .date-window-dialog-submit {
    --mdc-theme-primary: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-delete {
    --mdc-theme-primary: var(--error-color, #db4437);
  }

  @media (max-width: 720px) {
    .date-window-dialog-dates {
      grid-template-columns: 1fr;
    }
  }

  .range-control {
    position: relative;
    min-height: 58px;
    overflow: visible;
  }

  .range-toolbar {
    display: flex;
    align-items: stretch;
    flex-wrap: nowrap;
    min-height: 58px;
    overflow: visible;
  }

  .range-toolbar > * {
    min-width: 0;
  }

  .range-toolbar > * + * {
    position: relative;
    margin-left: var(--dp-spacing-xs);
    padding-left: var(--dp-spacing-lg);
  }

  .range-toolbar > * + *::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-timeline-shell {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-selection-jump {
    position: absolute;
    top: 50%;
    width: 30px;
    height: 30px;
    transform: translateY(-50%);
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: color-mix(in srgb, var(--primary-text-color, #111) 94%, transparent);
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.12),
      inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 82%, transparent);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    z-index: 12;
  }

  .range-selection-jump[hidden] {
    display: none;
  }

  .range-selection-jump.left {
    left: 6px;
  }

  .range-selection-jump.right {
    right: 6px;
  }

  .range-selection-jump:hover,
  .range-selection-jump:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 100%, transparent);
    outline: none;
  }

  .range-scroll-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    cursor: grab;
    touch-action: pan-y;
  }

  .range-scroll-viewport::-webkit-scrollbar {
    height: 8px;
  }

  .range-scroll-viewport::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 18%, transparent);
  }

  .range-scroll-viewport.dragging {
    cursor: grabbing;
  }

  .range-timeline {
    position: relative;
    height: 58px;
    min-width: 100%;
    touch-action: pan-y;
  }

  .range-context-layer,
  .range-label-layer,
  .range-tick-layer,
  .range-event-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-divider {
    position: absolute;
    top: 8px;
    bottom: 22px;
    width: 2px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
  }

  .range-context-label {
    font-weight: bold !important;
    position: absolute;
    top: 0;
    transform: translateX(8px);
    font-size: 0.92rem;
    line-height: 1;
    color: var(--primary-text-color);
    white-space: nowrap;
  }

  .range-scale-label {
    position: absolute;
    bottom: 0;
    opacity: 0.7;
    transform: translateX(-50%);
    font-size: 0.76rem;
    line-height: 1;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .range-period-button {
    padding: calc(var(--spacing, 8px) * 0.25) var(--dp-spacing-sm);
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    color: inherit;
    pointer-events: auto;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  .range-period-button:hover {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-period-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, var(--card-background-color, #fff));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 26px;
    transform: translateY(-50%);
    height: 4px;
    border-radius: 999px;
    background: transparent;
  }

  .range-selection {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 82%, transparent);
    cursor: grab;
  }

  .range-selection.dragging {
    cursor: grabbing;
  }

  .range-hover-preview {
    position: absolute;
    top: 14px;
    height: 14px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-hover-preview.visible {
    opacity: 1;
  }

  .range-comparison-preview {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 58%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-comparison-preview.visible {
    opacity: 1;
  }

  .range-zoom-highlight {
    position: absolute;
    top: -6px;
    height: 16px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
    box-shadow:
      inset 0 0 0 2px var(--primary-color, #03a9f4),
      0 0 0 1px color-mix(in srgb, var(--card-background-color, #fff) 72%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-highlight.visible {
    opacity: 1;
  }

  .range-zoom-window-highlight {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 4;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 52%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color, #03a9f4) 85%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-window-highlight.visible {
    opacity: 1;
  }

  .range-tick {
    position: absolute;
    top: 14px;
    height: 14px;
    width: 1px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--primary-text-color, #111) 16%, transparent);
  }

  .range-tick.major {
    top: 20px;
    height: 18px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }

  .range-tick.fine {
    top: 18px;
    height: 8px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 14%, transparent);
  }

  .range-tick.context {
    top: 2px;
    height: 34px;
    background: color-mix(in srgb, var(--primary-text-color, #111) 38%, transparent);
  }

  .range-event-dot {
    position: absolute;
    top: 35px;
    width: 6px;
    height: 6px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    pointer-events: none;
  }

  .range-chart-hover-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-line.visible {
    opacity: 1;
  }

  .range-chart-hover-window-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-window-line.visible {
    opacity: 0.45;
  }

  .range-handle {
    position: absolute;
    top: 26px;
    left: 0;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    background: color-mix(in srgb, var(--primary-text-color, #111) 84%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    padding: 0;
    cursor: ew-resize;
    touch-action: none;
  }

  .range-handle:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
  }

  @keyframes dp-live-breathe {
    0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 0 rgba(239, 83, 80, 0); }
    50%       { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 0 0 5px rgba(239, 83, 80, 0.2); }
  }

  .range-handle.is-live {
    background: #ef5350;
    animation: dp-live-breathe 3s ease-in-out infinite;
  }

  .range-tooltip {
    position: absolute;
    top: 43px;
    left: 0;
    transform: translate(-50%, 0);
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    border-radius: 10px;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    color: rgba(255, 255, 255, 0.96);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    font-size: 0.86rem;
    line-height: 1.1;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    opacity: 0;
    visibility: hidden;
    transition: opacity 120ms ease, visibility 120ms ease;
    z-index: 8;
  }

  .range-tooltip-live-hint {
    display: block;
    font-size: 0.78rem;
    opacity: 0.72;
    margin-top: 4px;
  }

  .range-tooltip::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    width: 10px;
    height: 10px;
    background: inherit;
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 2px;
  }

  .range-tooltip.visible {
    opacity: 1;
    visibility: visible;
  }

  .range-tooltip.start {
    z-index: 8;
  }

  .range-tooltip.end {
    z-index: 9;
  }

  .range-picker-wrap,
  .range-options-wrap {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    align-self: stretch;
  }

  .range-picker-button,
  .range-options-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .range-picker-button:hover,
  .range-picker-button:focus-visible,
  .range-options-button:hover,
  .range-options-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .range-picker-menu,
  .range-options-menu {
    position: fixed;
    top: var(--floating-menu-top, 64px);
    left: var(--floating-menu-left, 0px);
    z-index: 9999;
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
  }

  .range-picker-menu {
    width: min(340px, calc(100vw - 32px));
    min-height: 56px;
    padding: var(--dp-spacing-md);
  }

  .range-picker-menu[hidden],
  .range-options-menu[hidden] {
    display: none;
  }

  .range-picker {
    display: block;
    min-width: 0;
    width: 100%;
  }

  .range-options-menu {
    width: 280px;
    max-height: min(70vh, 520px);
    overflow: auto;
    padding: var(--dp-spacing-sm);
  }

  @media (max-width: 720px) {
    .range-toolbar > * + * {
      margin-left: 2px;
      padding-left: 8px;
    }

    .range-toolbar > * + *::before {
      top: 8px;
      bottom: 8px;
    }

    .range-picker-button,
    .range-options-button {
      min-width: 32px;
      --mdc-icon-size: 20px;
    }
  }

  .range-options-view[hidden] {
    display: none;
  }

  .range-options-header {
    display: block;
    min-height: 36px;
    margin-bottom: var(--dp-spacing-xs);
  }

  .range-options-header-trigger {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-options-header-trigger:hover,
  .range-options-header-trigger:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .range-options-title {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }

  .range-options-list {
    display: grid;
    gap: var(--dp-spacing-xs);
    padding: 0;
  }

  .range-option,
  .range-submenu-trigger,
  .range-options-back {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-submenu-trigger,
  .range-options-back {
    justify-content: space-between;
  }

  .range-options-back {
    width: auto;
    min-width: 0;
    padding-inline: 8px;
    flex: 0 0 auto;
  }

  .range-submenu-meta {
    color: var(--secondary-text-color);
    font-size: 0.84rem;
    margin-left: auto;
    padding-left: var(--dp-spacing-md);
  }

  .range-option:hover,
  .range-option:focus-visible,
  .range-submenu-trigger:hover,
  .range-submenu-trigger:focus-visible,
  .range-options-back:hover,
  .range-options-back:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }

  .range-option::before {
    content: "";
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
    flex: 0 0 auto;
  }

  .range-option.selected::before {
    border-color: var(--primary-color, #03a9f4);
    box-shadow: inset 0 0 0 4px var(--card-background-color, #fff);
    background: var(--primary-color, #03a9f4);
  }

  .range-submenu-trigger::after {
    content: "›";
    color: var(--secondary-text-color);
    font-size: 1rem;
    line-height: 1;
    margin-left: var(--dp-spacing-sm);
  }

  .range-option-label {
    flex: 1;
    min-width: 0;
  }

  .range-caption {
    display: none;
  }

  @media (max-width: 900px) {
    .controls-section {
      padding: var(--dp-spacing-md);
    }

    .controls-grid,
    .content {
      gap: var(--dp-spacing-md);
    }

    .range-toolbar {
      flex-wrap: wrap;
    }

    .range-toolbar > * + * {
      margin-left: 0;
      padding-left: 0;
    }

    .range-toolbar > * + *::before {
      display: none;
    }

    .range-picker-menu,
    .range-options-menu {
      right: 0;
      max-width: calc(100vw - 32px);
    }

    .page-content {
      grid-template-columns: minmax(0, 1fr);
      padding: var(--dp-spacing-md);
    }

    .page-sidebar {
      min-height: 0;
      padding-right: 0;
      border-right: none;
    }

    .page-content.sidebar-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }

    .page-sidebar.collapsed {
      align-items: stretch;
      padding-bottom: 0;
    }

    .page-sidebar.collapsed .control-target {
      display: none;
    }
  }
`;
  const PANEL_HISTORY_LOADING_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
  }

  .history-panel-loading {
    display: grid;
    place-items: center;
    min-height: 100%;
    padding: 32px;
    box-sizing: border-box;
  }

  .history-panel-loading-card {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    border-radius: 18px;
    background: var(--card-background-color, var(--primary-background-color));
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .history-panel-loading-spinner {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 80%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: history-panel-spin 0.85s linear infinite;
    flex: 0 0 auto;
  }

  .history-panel-loading-text {
    font-size: 0.98rem;
    color: var(--secondary-text-color, var(--primary-text-color));
    white-space: nowrap;
  }

  @keyframes history-panel-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
  class HassRecordsHistoryPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._shellBuilt = false;
      this._entities = [];
      this._seriesRows = [];
      this._targetSelection = {};
      this._targetSelectionRaw = {};
      this._hours = 24;
      this._startTime = null;
      this._endTime = null;
      this._panel = null;
      this._narrow = false;
      this._contentKey = "";
      this._contentSplitRatio = 0.44;
      this._sidebarCollapsed = false;
      this._collapsedPopupEntityId = null;
      this._collapsedPopupAnchorEl = null;
      this._collapsedPopupOutsideClickHandler = null;
      this._collapsedPopupKeyHandler = null;
      this._datapointScope = "linked";
      this._showChartDatapointIcons = true;
      this._showChartDatapointLines = true;
      this._showChartTooltips = true;
      this._showChartEmphasizedHoverGuides = false;
      this._delinkChartYAxis = false;
      this._showChartTrendLines = false;
      this._hideChartSourceSeries = false;
      this._showChartSummaryStats = false;
      this._showChartRateOfChange = false;
      this._showChartThresholdAnalysis = false;
      this._showChartThresholdShading = false;
      this._showChartAnomalies = false;
      this._showChartTrendCrosshairs = false;
      this._chartTrendMethod = "rolling_average";
      this._chartTrendWindow = "24h";
      this._chartRateWindow = "1h";
      this._chartAnomalyMethod = "trend_residual";
      this._chartAnomalySensitivity = "medium";
      this._chartAnomalyRateWindow = "1h";
      this._chartAnomalyZscoreWindow = "24h";
      this._chartAnomalyPersistenceWindow = "1h";
      this._chartAnomalyComparisonWindowId = null;
      this._chartThresholdValues = {};
      this._chartThresholdDirections = {};
      this._showChartDeltaAnalysis = false;
      this._showChartDeltaTooltip = true;
      this._showChartDeltaLines = false;
      this._showCorrelatedAnomalies = false;
      this._chartAnomalyOverlapMode = "all";
      this._showDataGaps = true;
      this._dataGapThreshold = "2h";
      this._historyStartTime = null;
      this._historyEndTime = null;
      this._historyBoundsLoaded = false;
      this._historyBoundsPromise = null;
      this._timelineEvents = [];
      this._timelineEventsPromise = null;
      this._timelineEventsKey = "";
      this._preferredSeriesColors = {};
      this._preferencesLoaded = false;
      this._preferencesPromise = null;
      this._comparisonWindows = [];
      this._selectedComparisonWindowId = null;
      this._hoveredComparisonWindowId = null;
      this._loadingComparisonWindowIds = [];
      this._comparisonTabsRenderKey = "";
      this._comparisonTabsHostEl = null;
      this._comparisonTabRailComp = null;
      this._pendingAnomalyComparisonWindowEntityId = null;
      this._dateWindowDialogOpen = false;
      this._editingDateWindowId = null;
      this._dateWindowDialogComp = null;
      this._dragSourceIndex = null;
      this._splitChartView = false;
      this._dateWindowDialogNameEl = null;
      this._dateWindowDialogStartEl = null;
      this._dateWindowDialogEndEl = null;
      this._dateWindowDialogShortcutsEl = null;
      this._dateWindowDialogDraftRange = null;
      this._uiReadyPromise = null;
      this._uiReadyApplied = false;
      this._chartEl = null;
      this._historyChartMol = null;
      this._listEl = null;
      this._chartConfigKey = "";
      this._listConfigKey = "";
      this._topAppBarEl = null;
      this._menuButtonEl = null;
      this._pageContentEl = null;
      this._pageSidebarEl = null;
      this._pageMenuButtonEl = null;
      this._pageMenuEl = null;
      this._sidebarToggleButtonEl = null;
      this._contentSplitterEl = null;
      this._targetControl = null;
      this._targetRowsEl = null;
      this._rowListEl = null;
      this._targetRowsRenderKey = "";
      this._sidebarOptionsEl = null;
      this._sidebarOptionsComp = null;
      this._sidebarAccordionTargetsOpen = true;
      this._sidebarAccordionDatapointsOpen = true;
      this._sidebarAccordionAnalysisOpen = true;
      this._sidebarAccordionChartOpen = true;
      this._dateControl = null;
      this._dateRangePickerEl = null;
      this._datePickerButtonEl = null;
      this._datePickerMenuEl = null;
      this._optionsButtonEl = null;
      this._optionsMenuEl = null;
      this._panelTimelineEl = null;
      this._rangeBounds = null;
      this._autoZoomTimer = null;
      this._resolvedAutoZoomLevel = null;
      this._hoveredPeriodRange = null;
      this._chartHoverTimeMs = null;
      this._chartZoomRange = null;
      this._chartZoomCommittedRange = null;
      this._chartZoomStateCommitTimer = null;
      this._zoomLevel = "auto";
      this._dateSnapping = "auto";
      this._recordsSearchQuery = "";
      this._hiddenEventIds = [];
      this._optionsMenuView = "root";
      this._restoredFromSession = false;
      this._savedPageLoaded = false;
      this._hasSavedPage = false;
      this._savePageBusy = false;
      this._datePickerOpen = false;
      this._optionsOpen = false;
      this._pageMenuOpen = false;
      this._exportBusy = false;
      this._contentSplitPointerId = null;
      this._onChartHover = (ev) => this._handleChartHover(ev);
      this._onChartZoom = (ev) => this._handleChartZoom(ev);
      this._onRecordsSearch = (ev) => this._handleRecordsSearch(ev);
      this._onToggleEventVisibility = (ev) => this._handleToggleEventVisibility(ev);
      this._onToggleSeriesVisibility = (ev) => this._handleToggleSeriesVisibility(ev);
      this._onComparisonLoading = (ev) => this._handleComparisonLoading(ev);
      this._onAnalysisComputing = (ev) => this._handleAnalysisComputing(ev);
      this._onWindowPointerDown = (ev) => this._handleWindowPointerDown(ev);
      this._onWindowResize = () => {
        if (this._rendered) {
          this._syncPageLayoutHeight();
          this._applyContentSplitLayout();
          this._syncRangeControl();
          if (this._pageMenuOpen) {
            this._positionPageMenu();
          }
          if (this._optionsOpen) {
            this._positionFloatingMenu(this._optionsMenuEl, this._optionsButtonEl, 280);
          }
          if (this._datePickerOpen) {
            this._positionFloatingMenu(this._datePickerMenuEl, this._datePickerButtonEl, 320);
          }
        }
      };
      this._onContentSplitPointerMove = (ev) => this._handleContentSplitPointerMove(ev);
      this._onContentSplitPointerUp = (ev) => this._finishContentSplitPointer(ev);
      this._onCollapsedSidebarClick = (ev) => this._handleCollapsedSidebarClick(ev);
      this._onEventRecorded = () => this._handleEventRecorded();
      this._haEventUnsubscribe = null;
      this._onPopState = () => {
        this._initFromContext();
        if (this._rendered) {
          this._syncControls();
          this._renderContent();
        }
      };
      this._onLocationChanged = () => {
        this._initFromContext();
        if (this._rendered) {
          this._syncControls();
          this._renderContent();
        }
      };
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._haEventUnsubscribe && this._hass?.connection) {
        this._hass.connection.subscribeEvents(() => this._handleEventRecorded(), `${DOMAIN$1}_event_recorded`).then((unsub) => {
          this._haEventUnsubscribe = unsub;
        }).catch(() => {
        });
      }
      if (!this._rendered) {
        this._rendered = true;
        this._initFromContext();
        if (this.isConnected) {
          this._buildLoadingShell();
        }
      }
      if (!this._seriesRows.length && Object.keys(this._targetSelection || {}).length) {
        this._seriesRows = buildHistorySeriesRows(resolveEntityIdsFromTarget(this._hass, this._targetSelection));
      }
      this._syncSeriesState();
      if (!this._shellBuilt) return;
      this._ensureHistoryBounds();
      this._ensureUserPreferences();
      this._loadSavedPageIndicator();
      this._syncHassBindings();
      this._renderContent();
    }
    set panel(panel) {
      this._panel = panel;
      this._initFromContext();
      if (this._rendered) {
        this._syncControls();
        this._renderContent();
      }
    }
    set narrow(value) {
      this._narrow = value;
    }
    connectedCallback() {
      window.addEventListener("popstate", this._onPopState);
      window.addEventListener("location-changed", this._onLocationChanged);
      window.addEventListener("pointerdown", this._onWindowPointerDown, true);
      window.addEventListener("resize", this._onWindowResize);
      window.addEventListener("hass-datapoints-event-recorded", this._onEventRecorded);
      this.addEventListener("hass-datapoints-chart-hover", this._onChartHover);
      this.addEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
      this.addEventListener("hass-datapoints-records-search", this._onRecordsSearch);
      this.addEventListener("hass-datapoints-toggle-event-visibility", this._onToggleEventVisibility);
      this.addEventListener("hass-datapoints-toggle-series-visibility", this._onToggleSeriesVisibility);
      this.addEventListener("hass-datapoints-comparison-loading", this._onComparisonLoading);
      this.addEventListener("hass-datapoints-analysis-computing", this._onAnalysisComputing);
      if (this._rendered && !this._shellBuilt) {
        this._buildLoadingShell();
      }
      this._ensureUiComponentsReady();
      if (this._rendered && this._shellBuilt) {
        window.requestAnimationFrame(() => {
          if (!this.isConnected) return;
          this._syncControls();
          this._renderContent();
          if (this._restoredFromSession) {
            this._restoredFromSession = false;
            this._updateUrl({ push: false });
          }
        });
      }
    }
    disconnectedCallback() {
      window.removeEventListener("popstate", this._onPopState);
      window.removeEventListener("location-changed", this._onLocationChanged);
      window.removeEventListener("pointerdown", this._onWindowPointerDown, true);
      window.removeEventListener("resize", this._onWindowResize);
      window.removeEventListener("hass-datapoints-event-recorded", this._onEventRecorded);
      if (this._haEventUnsubscribe) {
        this._haEventUnsubscribe();
        this._haEventUnsubscribe = null;
      }
      this.removeEventListener("hass-datapoints-chart-hover", this._onChartHover);
      this.removeEventListener("hass-datapoints-chart-zoom", this._onChartZoom);
      this.removeEventListener("hass-datapoints-records-search", this._onRecordsSearch);
      this.removeEventListener("hass-datapoints-toggle-event-visibility", this._onToggleEventVisibility);
      this.removeEventListener("hass-datapoints-toggle-series-visibility", this._onToggleSeriesVisibility);
      this.removeEventListener("hass-datapoints-comparison-loading", this._onComparisonLoading);
      this.removeEventListener("hass-datapoints-analysis-computing", this._onAnalysisComputing);
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      if (this._autoZoomTimer) {
        window.clearTimeout(this._autoZoomTimer);
        this._autoZoomTimer = null;
      }
      this._contentSplitPointerId = null;
      window.removeEventListener("pointermove", this._onContentSplitPointerMove);
      window.removeEventListener("pointerup", this._onContentSplitPointerUp);
      window.removeEventListener("pointercancel", this._onContentSplitPointerUp);
    }
    _initFromContext() {
      const url = new URL(window.location.href);
      const entityFromUrl = url.searchParams.get("entity_id");
      const deviceFromUrl = url.searchParams.get("device_id");
      const areaFromUrl = url.searchParams.get("area_id");
      const labelFromUrl = url.searchParams.get("label_id");
      const datapointsScopeFromUrl = url.searchParams.get("datapoints_scope");
      const startFromUrl = url.searchParams.get("start_time");
      const endFromUrl = url.searchParams.get("end_time");
      const zoomStartFromUrl = url.searchParams.get("zoom_start_time");
      const zoomEndFromUrl = url.searchParams.get("zoom_end_time");
      const seriesColorsFromUrl = parseSeriesColorsParam(url.searchParams.get("series_colors"));
      const dateWindowsFromUrl = parseDateWindowsParam(url.searchParams.get("date_windows"));
      const hoursFromUrl = Number.parseInt(url.searchParams.get("hours_to_show") || "", 10);
      const hasTargetInUrl = !!(entityFromUrl || deviceFromUrl || areaFromUrl || labelFromUrl);
      const hasRangeInUrl = !!startFromUrl && !!endFromUrl;
      const panelCfg = this._panel?.config || {};
      const sessionState = this._readSessionState();
      this._restoredFromSession = !hasTargetInUrl && !hasRangeInUrl && !!sessionState;
      this._sidebarCollapsed = !!sessionState?.sidebar_collapsed;
      this._sidebarAccordionTargetsOpen = sessionState?.sidebar_accordion_targets_open !== false;
      this._sidebarAccordionDatapointsOpen = sessionState?.sidebar_accordion_datapoints_open !== false;
      this._sidebarAccordionAnalysisOpen = sessionState?.sidebar_accordion_analysis_open !== false;
      this._sidebarAccordionChartOpen = sessionState?.sidebar_accordion_chart_open !== false;
      if (Number.isFinite(sessionState?.content_split_ratio)) {
        this._contentSplitRatio = clampNumber(sessionState.content_split_ratio, 0.25, 0.75);
      }
      let resolvedDatapointScope;
      if (datapointsScopeFromUrl === "all") {
        resolvedDatapointScope = "all";
      } else if (datapointsScopeFromUrl === "hidden") {
        resolvedDatapointScope = "hidden";
      } else if (!datapointsScopeFromUrl && sessionState?.datapoint_scope === "all") {
        resolvedDatapointScope = "all";
      } else if (!datapointsScopeFromUrl && sessionState?.datapoint_scope === "hidden") {
        resolvedDatapointScope = "hidden";
      } else {
        resolvedDatapointScope = "linked";
      }
      this._datapointScope = resolvedDatapointScope;
      this._showChartDatapointIcons = sessionState?.show_chart_datapoint_icons !== false;
      this._showChartDatapointLines = sessionState?.show_chart_datapoint_lines !== false;
      this._showChartTooltips = sessionState?.show_chart_tooltips !== false;
      this._showChartEmphasizedHoverGuides = sessionState?.show_chart_emphasized_hover_guides === true;
      this._delinkChartYAxis = sessionState?.delink_chart_y_axis === true;
      this._splitChartView = sessionState?.split_chart_view === true;
      this._showChartTrendLines = sessionState?.show_chart_trend_lines === true;
      this._hideChartSourceSeries = sessionState?.hide_chart_source_series === true || sessionState?.hide_chart_raw_data === true || sessionState?.hide_chart_delta_source_series === true;
      this._showChartSummaryStats = sessionState?.show_chart_summary_stats === true;
      this._showChartRateOfChange = sessionState?.show_chart_rate_of_change === true;
      this._showChartThresholdAnalysis = sessionState?.show_chart_threshold_analysis === true;
      this._showChartThresholdShading = sessionState?.show_chart_threshold_shading === true;
      this._showChartAnomalies = sessionState?.show_chart_anomalies === true;
      this._showChartTrendCrosshairs = sessionState?.show_chart_trend_crosshairs === true;
      this._chartTrendMethod = ANALYSIS_TREND_METHOD_OPTIONS.some((option) => option.value === sessionState?.chart_trend_method) ? sessionState.chart_trend_method : "rolling_average";
      this._chartTrendWindow = ANALYSIS_TREND_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_trend_window) ? sessionState.chart_trend_window : "24h";
      this._chartRateWindow = ANALYSIS_RATE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_rate_window) ? sessionState.chart_rate_window : "1h";
      this._chartAnomalyMethod = ANALYSIS_ANOMALY_METHOD_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_method) ? sessionState.chart_anomaly_method : "trend_residual";
      this._chartAnomalySensitivity = ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_sensitivity) ? sessionState.chart_anomaly_sensitivity : "medium";
      this._chartAnomalyRateWindow = ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_rate_window) ? sessionState.chart_anomaly_rate_window : "1h";
      this._chartAnomalyZscoreWindow = ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_zscore_window) ? sessionState.chart_anomaly_zscore_window : "24h";
      this._chartAnomalyPersistenceWindow = ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS.some((option) => option.value === sessionState?.chart_anomaly_persistence_window) ? sessionState.chart_anomaly_persistence_window : "1h";
      this._chartAnomalyComparisonWindowId = typeof sessionState?.chart_anomaly_comparison_window_id === "string" && sessionState.chart_anomaly_comparison_window_id ? sessionState.chart_anomaly_comparison_window_id : null;
      this._chartThresholdValues = sessionState?.chart_threshold_values && typeof sessionState.chart_threshold_values === "object" ? Object.entries(sessionState.chart_threshold_values).reduce((acc, [entityId, value]) => {
        if (typeof entityId !== "string") {
          return acc;
        }
        if (typeof value !== "string" && typeof value !== "number") {
          return acc;
        }
        const normalized = String(value).trim();
        if (!normalized) {
          return acc;
        }
        acc[entityId] = normalized;
        return acc;
      }, {}) : {};
      this._chartThresholdDirections = sessionState?.chart_threshold_directions && typeof sessionState.chart_threshold_directions === "object" ? Object.entries(sessionState.chart_threshold_directions).reduce((acc, [entityId, value]) => {
        if (typeof entityId !== "string") {
          return acc;
        }
        if (value !== "below") {
          acc[entityId] = "above";
          return acc;
        }
        acc[entityId] = "below";
        return acc;
      }, {}) : {};
      this._showChartDeltaAnalysis = sessionState?.show_chart_delta_analysis === true;
      this._showChartDeltaTooltip = sessionState?.show_chart_delta_tooltip !== false;
      this._showChartDeltaLines = sessionState?.show_chart_delta_lines === true;
      this._showCorrelatedAnomalies = sessionState?.show_chart_correlated_anomalies === true;
      this._chartAnomalyOverlapMode = ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS.some((o2) => o2.value === sessionState?.chart_anomaly_overlap_mode) ? sessionState.chart_anomaly_overlap_mode : "all";
      this._showDataGaps = sessionState?.show_data_gaps !== false;
      this._dataGapThreshold = DATA_GAP_THRESHOLD_OPTIONS.some((option) => option.value === sessionState?.data_gap_threshold) ? sessionState.data_gap_threshold : "2h";
      this._comparisonWindows = dateWindowsFromUrl.length ? dateWindowsFromUrl : normalizeDateWindows(sessionState?.date_windows);
      const targetFromUrl = normalizeTargetValue({
        entity_id: entityFromUrl ? entityFromUrl.split(",") : [],
        device_id: deviceFromUrl ? deviceFromUrl.split(",") : [],
        area_id: areaFromUrl ? areaFromUrl.split(",") : [],
        label_id: labelFromUrl ? labelFromUrl.split(",") : []
      });
      const panelTarget = panelConfigTarget(panelCfg);
      let nextTargetSelection;
      if (Object.keys(targetFromUrl).length) {
        nextTargetSelection = targetFromUrl;
      } else if (!hasTargetInUrl && sessionState?.entities?.length) {
        nextTargetSelection = normalizeTargetValue(sessionState.target_selection_raw || sessionState.target_selection || { entity_id: sessionState.entities });
      } else {
        nextTargetSelection = panelTarget;
      }
      this._targetSelection = nextTargetSelection;
      this._targetSelectionRaw = !hasTargetInUrl && sessionState?.target_selection_raw ? sessionState.target_selection_raw : nextTargetSelection;
      this._seriesRows = !hasTargetInUrl && Array.isArray(sessionState?.series_rows) ? normalizeHistorySeriesRows(sessionState.series_rows) : buildHistorySeriesRows(resolveEntityIdsFromTarget(this._hass, this._targetSelection));
      this._seriesRows = this._applyPreferredSeriesColors(this._seriesRows, seriesColorsFromUrl);
      this._syncSeriesState();
      this._migrateLegacyAnalysisSettingsToSeriesRows();
      const start = parseDateValue(startFromUrl) || (!hasRangeInUrl ? parseDateValue(sessionState?.start_time) : null) || parseDateValue(panelCfg.start_time);
      const end = parseDateValue(endFromUrl) || (!hasRangeInUrl ? parseDateValue(sessionState?.end_time) : null) || parseDateValue(panelCfg.end_time);
      const zoomStart = parseDateValue(zoomStartFromUrl) || (!zoomStartFromUrl && !zoomEndFromUrl ? parseDateValue(sessionState?.zoom_start_time) : null);
      const zoomEnd = parseDateValue(zoomEndFromUrl) || (!zoomStartFromUrl && !zoomEndFromUrl ? parseDateValue(sessionState?.zoom_end_time) : null);
      this._chartZoomRange = null;
      this._chartZoomCommittedRange = zoomStart && zoomEnd && zoomStart < zoomEnd ? { start: zoomStart.getTime(), end: zoomEnd.getTime() } : null;
      if (start && end && start < end) {
        this._startTime = start;
        this._endTime = end;
        this._hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 36e5));
        return;
      }
      if (Number.isFinite(hoursFromUrl) && hoursFromUrl > 0) {
        this._hours = hoursFromUrl;
      } else if (!hasRangeInUrl && Number.isFinite(sessionState?.hours) && sessionState.hours > 0) {
        this._hours = sessionState.hours;
      } else if (panelCfg.hours_to_show) {
        this._hours = panelCfg.hours_to_show;
      }
      const now = /* @__PURE__ */ new Date();
      this._startTime = startOfUnit(now, "week");
      this._endTime = endOfUnit(now, "week");
      this._hours = Math.max(1, Math.round((this._endTime.getTime() - this._startTime.getTime()) / 36e5));
    }
    _readSessionState() {
      return readHistoryPageSessionState();
    }
    _saveSessionState() {
      writeHistoryPageSessionState(this);
    }
    _buildLoadingShell() {
      this._shellBuilt = false;
      this.shadowRoot.innerHTML = `
      <style>${PANEL_HISTORY_LOADING_STYLE}</style>
      <div class="history-panel-loading">
        <div class="history-panel-loading-card" role="status" aria-live="polite">
          <div class="history-panel-loading-spinner" aria-hidden="true"></div>
          <div class="history-panel-loading-text">Loading Datapoints…</div>
        </div>
      </div>
    `;
    }
    _buildShell() {
      this._shellBuilt = true;
      this.shadowRoot.innerHTML = `
      <style>${PANEL_HISTORY_STYLE}</style>
      <ha-top-app-bar-fixed>
        <ha-menu-button slot="navigationIcon"></ha-menu-button>
        <div slot="title">Datapoints</div>
        <div slot="actionItems" class="page-header-actions">
          <div class="page-menu-wrap">
            <ha-icon-button
              id="page-menu-button"
              class="page-menu-button"
              label="Page options"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button>
            <dp-floating-menu id="page-menu">
              <dp-page-menu-item id="page-download-spreadsheet" icon="mdi:file-excel-outline" label="Download spreadsheet"></dp-page-menu-item>
              <dp-page-menu-item id="page-save-page" icon="mdi:content-save-outline" label="Save page state"></dp-page-menu-item>
              <dp-page-menu-item id="page-restore-page" icon="mdi:restore" label="Restore saved page" hidden></dp-page-menu-item>
              <dp-page-menu-item id="page-clear-saved-page" icon="mdi:delete-outline" label="Clear saved page" hidden></dp-page-menu-item>
            </dp-floating-menu>
          </div>
        </div>
        <div class="controls-section">
          <div class="controls-grid">
            <div id="date-slot" class="control-date"></div>
          </div>
        </div>
        <div id="page-content" class="page-content">
          <div id="page-sidebar" class="page-sidebar">
            <ha-icon-button
              id="sidebar-toggle"
              class="sidebar-toggle-button"
              label="Toggle targets sidebar"
            >
              <ha-icon icon="mdi:chevron-left"></ha-icon>
            </ha-icon-button>
            <div id="target-slot" class="control-target"></div>
            <div id="sidebar-options" class="sidebar-options"></div>
          </div>
          <div class="content" id="content"></div>
        </div>
        <div id="collapsed-target-popup" class="collapsed-target-popup" hidden></div>
      </ha-top-app-bar-fixed>
    `;
      this._topAppBarEl = this.shadowRoot.querySelector("ha-top-app-bar-fixed");
      this._menuButtonEl = this.shadowRoot.querySelector("ha-menu-button");
      this._pageContentEl = this.shadowRoot.querySelector("#page-content");
      this._pageSidebarEl = this.shadowRoot.querySelector("#page-sidebar");
      this._pageMenuButtonEl = this.shadowRoot.querySelector("#page-menu-button");
      this._pageMenuEl = this.shadowRoot.querySelector("#page-menu");
      this._sidebarToggleButtonEl = this.shadowRoot.querySelector("#sidebar-toggle");
      this._sidebarOptionsEl = this.shadowRoot.querySelector("#sidebar-options");
      this._pageMenuButtonEl?.addEventListener("click", () => this._togglePageMenu());
      this._pageMenuEl?.querySelector("#page-download-spreadsheet")?.addEventListener("dp-menu-action", () => this._downloadSpreadsheet());
      this._pageMenuEl?.querySelector("#page-save-page")?.addEventListener("dp-menu-action", () => this._savePageState());
      this._pageMenuEl?.querySelector("#page-restore-page")?.addEventListener("dp-menu-action", () => this._restorePageState());
      this._pageMenuEl?.querySelector("#page-clear-saved-page")?.addEventListener("dp-menu-action", () => this._clearSavedPageState());
      this._pageMenuEl?.addEventListener("dp-menu-close", () => this._togglePageMenu(false));
      this._sidebarToggleButtonEl?.addEventListener("click", () => this._toggleSidebarCollapsed());
      this._pageSidebarEl?.addEventListener("click", this._onCollapsedSidebarClick);
      this._syncPageLayoutHeight();
      this._applyContentSplitLayout();
      this._mountControls();
      this._renderSidebarOptions();
      this._ensureUiComponentsReady();
    }
    _syncPageLayoutHeight() {
      if (!this._pageContentEl) {
        return;
      }
      const pageRect = this._pageContentEl.getBoundingClientRect();
      const hostRect = this.getBoundingClientRect();
      const availableHeight = Math.max(0, hostRect.bottom - pageRect.top);
      if (availableHeight > 0) {
        this._pageContentEl.style.setProperty("--history-page-content-height", `${availableHeight}px`);
      }
    }
    _ensureUiComponentsReady() {
      if (this._uiReadyPromise) return this._uiReadyPromise;
      const componentTags = [
        "ha-top-app-bar-fixed",
        "ha-menu-button",
        "ha-icon-button",
        "ha-dialog",
        "ha-tooltip",
        "ha-target-picker",
        "ha-date-range-picker"
      ];
      this._uiReadyPromise = ensureHaComponents(componentTags).then((results) => results).then(() => {
        if (!this.isConnected || !this._rendered) return;
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!this.isConnected || !this._rendered) return;
            this._uiReadyApplied = true;
            this._buildShell();
            this._syncControls();
            this._renderContent();
          });
        });
      }).catch((error) => {
        logger$1.warn("[hass-datapoints panel] ensure UI components ready failed", {
          message: error?.message || String(error)
        });
      });
      return this._uiReadyPromise;
    }
    _syncControls() {
      this._syncPageLayoutHeight();
      this._syncHassBindings();
      this._syncRangeUi();
      this._renderSidebarOptions();
    }
    _syncSeriesState() {
      this._seriesRows = normalizeHistorySeriesRows(this._seriesRows);
      this._entities = this._seriesRows.map((row) => row.entity_id);
      this._targetSelection = this._entities.length ? { entity_id: [...this._entities] } : {};
      this._targetSelectionRaw = this._targetSelection;
    }
    _migrateLegacyAnalysisSettingsToSeriesRows() {
      const hasConfiguredRowAnalysis = this._seriesRows.some((row) => historySeriesRowHasConfiguredAnalysis(row));
      if (hasConfiguredRowAnalysis) {
        return;
      }
      const hasLegacyAnalysis = this._showChartTrendLines || this._showChartSummaryStats || this._showChartRateOfChange || this._showChartThresholdAnalysis || this._showChartAnomalies || this._showChartDeltaAnalysis || this._hideChartSourceSeries || Object.keys(this._chartThresholdValues || {}).length > 0 || Object.keys(this._chartThresholdDirections || {}).length > 0;
      if (!hasLegacyAnalysis) {
        return;
      }
      this._seriesRows = this._seriesRows.map((row) => {
        if (!isAnalysisSupportedForRow(row)) {
          return row;
        }
        return {
          ...row,
          analysis: normalizeHistorySeriesAnalysis({
            ...row.analysis,
            expanded: true,
            show_trend_lines: this._showChartTrendLines,
            trend_method: this._chartTrendMethod,
            trend_window: this._chartTrendWindow,
            show_trend_crosshairs: this._showChartTrendCrosshairs,
            show_summary_stats: this._showChartSummaryStats,
            show_rate_of_change: this._showChartRateOfChange,
            rate_window: this._chartRateWindow,
            show_threshold_analysis: this._showChartThresholdAnalysis,
            show_threshold_shading: this._showChartThresholdShading,
            threshold_value: this._chartThresholdValues?.[row.entity_id] || "",
            threshold_direction: this._chartThresholdDirections?.[row.entity_id] || "above",
            show_anomalies: this._showChartAnomalies,
            anomaly_method: this._chartAnomalyMethod,
            anomaly_methods: [this._chartAnomalyMethod],
            anomaly_sensitivity: this._chartAnomalySensitivity,
            anomaly_rate_window: this._chartAnomalyRateWindow,
            anomaly_zscore_window: this._chartAnomalyZscoreWindow,
            anomaly_persistence_window: this._chartAnomalyPersistenceWindow,
            anomaly_comparison_window_id: this._chartAnomalyComparisonWindowId,
            show_delta_analysis: this._showChartDeltaAnalysis,
            show_delta_tooltip: this._showChartDeltaTooltip,
            show_delta_lines: this._showChartDeltaLines,
            hide_source_series: this._hideChartSourceSeries
          })
        };
      });
      this._syncSeriesState();
    }
    _seriesColorQueryKey(entityId) {
      return slugifySeriesName(entityName$1(this._hass, entityId) || entityId);
    }
    _applyPreferredSeriesColors(rows, urlColorMap = null) {
      const queryColors = urlColorMap && typeof urlColorMap === "object" ? urlColorMap : {};
      return normalizeHistorySeriesRows(rows).map((row) => {
        const queryColor = queryColors[this._seriesColorQueryKey(row.entity_id)];
        const preferredColor = this._preferredSeriesColors?.[row.entity_id];
        let nextColor;
        if (/^#[0-9a-f]{6}$/i.test(queryColor || "")) {
          nextColor = queryColor;
        } else if (/^#[0-9a-f]{6}$/i.test(preferredColor || "")) {
          nextColor = preferredColor;
        } else {
          nextColor = row.color;
        }
        return nextColor === row.color ? row : { ...row, color: nextColor };
      });
    }
    _syncHassBindings() {
      if (this._topAppBarEl) {
        if (this._hass) this._topAppBarEl.hass = this._hass;
        this._topAppBarEl.narrow = this._narrow;
      }
      if (this._menuButtonEl) {
        if (this._hass) this._menuButtonEl.hass = this._hass;
        this._menuButtonEl.narrow = this._narrow;
      }
      if (this._pageMenuButtonEl) {
        if (this._hass) this._pageMenuButtonEl.hass = this._hass;
      }
      if (this._sidebarToggleButtonEl) {
        if (this._hass) this._sidebarToggleButtonEl.hass = this._hass;
      }
      this._syncSidebarUi();
      if (this._targetControl) {
        if (this._hass) this._targetControl.hass = this._hass;
        this._targetControl.value = {};
      }
      this._renderTargetRows();
      this.shadowRoot?.querySelectorAll("[data-series-icon-entity-id], [data-series-collapsed-icon-entity-id]").forEach((iconEl) => {
        const entityId = iconEl.dataset.seriesIconEntityId || iconEl.dataset.seriesCollapsedIconEntityId;
        if (!entityId) return;
        iconEl.stateObj = this._hass?.states?.[entityId];
        iconEl.hass = this._hass;
      });
      if (this._dateControl) {
        if (this._dateRangePickerEl) {
          if (this._hass) this._dateRangePickerEl.hass = this._hass;
          this._dateRangePickerEl.startDate = this._startTime;
          this._dateRangePickerEl.endDate = this._endTime;
          this._dateRangePickerEl.value = {
            startDate: this._startTime,
            endDate: this._endTime
          };
        }
      }
    }
    _syncRangeUi() {
      if (!this._dateControl) return;
      this._syncOptionsMenu();
      this._syncRangeControl();
    }
    _renderSidebarOptions() {
      if (!this._sidebarOptionsComp) {
        return;
      }
      let yAxisMode;
      if (this._splitChartView) {
        yAxisMode = "split";
      } else if (this._delinkChartYAxis) {
        yAxisMode = "unique";
      } else {
        yAxisMode = "combined";
      }
      this._sidebarOptionsComp.datapointScope = this._datapointScope;
      this._sidebarOptionsComp.showIcons = this._showChartDatapointIcons;
      this._sidebarOptionsComp.showLines = this._showChartDatapointLines;
      this._sidebarOptionsComp.showTooltips = this._showChartTooltips;
      this._sidebarOptionsComp.showHoverGuides = this._showChartEmphasizedHoverGuides;
      this._sidebarOptionsComp.showCorrelatedAnomalies = this._showCorrelatedAnomalies;
      this._sidebarOptionsComp.showDataGaps = this._showDataGaps;
      this._sidebarOptionsComp.dataGapThreshold = this._dataGapThreshold;
      this._sidebarOptionsComp.yAxisMode = yAxisMode;
      this._sidebarOptionsComp.anomalyOverlapMode = this._chartAnomalyOverlapMode;
      this._sidebarOptionsComp.targetsOpen = this._sidebarAccordionTargetsOpen;
      this._sidebarOptionsComp.datapointsOpen = this._sidebarAccordionDatapointsOpen;
      this._sidebarOptionsComp.analysisOpen = this._sidebarAccordionAnalysisOpen;
      this._sidebarOptionsComp.chartOpen = this._sidebarAccordionChartOpen;
    }
    _formatComparisonLabel(start, end) {
      const fmt = (d2) => d2.toLocaleDateString(void 0, { month: "short", day: "numeric" });
      const fmtYear = (d2) => d2.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
      const sameYear = start.getFullYear() === end.getFullYear();
      return sameYear ? `${fmt(start)} – ${fmt(end)}` : `${fmtYear(start)} – ${fmtYear(end)}`;
    }
    _getComparisonPreviewOverlay() {
      const comparisonWindow = this._getActiveComparisonWindow();
      if (!comparisonWindow || !this._startTime || !this._endTime) {
        return null;
      }
      const windowStart = parseDateValue(comparisonWindow.start_time);
      const windowEnd = parseDateValue(comparisonWindow.end_time);
      if (!windowStart || !windowEnd) {
        return null;
      }
      const actualSpanMs = this._endTime.getTime() - this._startTime.getTime();
      if (!Number.isFinite(actualSpanMs) || actualSpanMs <= 0) {
        return null;
      }
      const actualStart = new Date(windowStart.getTime());
      const actualEnd = new Date(windowStart.getTime() + actualSpanMs);
      const windowRangeLabel = this._formatComparisonLabel(windowStart, windowEnd);
      const actualRangeLabel = this._formatComparisonLabel(actualStart, actualEnd);
      if (windowRangeLabel === actualRangeLabel) {
        return null;
      }
      return {
        label: comparisonWindow.label || "Preview",
        window_range_label: windowRangeLabel,
        actual_range_label: actualRangeLabel
      };
    }
    _getPreviewComparisonWindows() {
      const comparisonIds = [];
      if (this._selectedComparisonWindowId) {
        comparisonIds.push(this._selectedComparisonWindowId);
      }
      if (this._hoveredComparisonWindowId && !comparisonIds.includes(this._hoveredComparisonWindowId)) {
        comparisonIds.push(this._hoveredComparisonWindowId);
      }
      if (!comparisonIds.length) {
        return [];
      }
      if (!this._startTime || !this._endTime) {
        return [];
      }
      const previewWindows = comparisonIds.map((id) => this._comparisonWindows.find((window2) => window2.id === id) || null).filter(Boolean).map((window2) => ({
        ...window2,
        time_offset_ms: new Date(window2.start_time).getTime() - this._startTime.getTime()
      }));
      return previewWindows;
    }
    _getPreloadComparisonWindows() {
      if (!this._startTime || !this._endTime) {
        return [];
      }
      const preloadWindows = this._comparisonWindows.map((window2) => ({
        ...window2,
        time_offset_ms: new Date(window2.start_time).getTime() - this._startTime.getTime()
      })).filter((window2) => Number.isFinite(window2.time_offset_ms));
      return preloadWindows;
    }
    _getActiveComparisonWindow() {
      if (this._hoveredComparisonWindowId) {
        return this._comparisonWindows.find((window2) => window2.id === this._hoveredComparisonWindowId) || null;
      }
      if (this._selectedComparisonWindowId) {
        return this._comparisonWindows.find((window2) => window2.id === this._selectedComparisonWindowId) || null;
      }
      return null;
    }
    _formatDateWindowInputValue(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return "";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    _parseDateWindowInputValue(value) {
      if (!value || typeof value !== "string") {
        return null;
      }
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
      if (!match) {
        return null;
      }
      const [, year, month, day, hour, minute] = match;
      const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        0,
        0
      );
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed;
    }
    _shiftDateWindowByUnit(date, unit, amount) {
      const shifted = new Date(date);
      if (unit === "day") {
        shifted.setDate(shifted.getDate() + amount);
        return shifted;
      }
      if (unit === "week") {
        shifted.setDate(shifted.getDate() + amount * 7);
        return shifted;
      }
      if (unit === "month") {
        shifted.setMonth(shifted.getMonth() + amount);
        return shifted;
      }
      if (unit === "year") {
        shifted.setFullYear(shifted.getFullYear() + amount);
        return shifted;
      }
      return shifted;
    }
    _getRoundedDateWindowUnit(start, end) {
      if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) {
        return null;
      }
      const supportedUnits = ["day", "week", "month", "year"];
      for (const unit of supportedUnits) {
        const roundedStart = startOfUnit(start, unit);
        const roundedEnd = endOfUnit(start, unit);
        if (roundedStart?.getTime?.() === start.getTime() && roundedEnd?.getTime?.() === end.getTime()) {
          return unit;
        }
      }
      return null;
    }
    _syncDateWindowDialogInputs() {
      const startVal = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.start || null);
      const endVal = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.end || null);
      if (this._dateWindowDialogComp) {
        this._dateWindowDialogComp.startValue = startVal;
        this._dateWindowDialogComp.endValue = endVal;
        return;
      }
      if (this._dateWindowDialogStartEl) {
        this._dateWindowDialogStartEl.value = startVal;
      }
      if (this._dateWindowDialogEndEl) {
        this._dateWindowDialogEndEl.value = endVal;
      }
    }
    _handleDateWindowDialogInputChange() {
      const start = this._parseDateWindowInputValue(this._dateWindowDialogStartEl?.value || "");
      const end = this._parseDateWindowInputValue(this._dateWindowDialogEndEl?.value || "");
      if (start && end && start < end) {
        this._dateWindowDialogDraftRange = { start, end };
        return;
      }
      this._dateWindowDialogDraftRange = null;
    }
    _applyDateWindowShortcut(direction) {
      if (this._editingDateWindowId) {
        return;
      }
      const start = this._dateWindowDialogDraftRange?.start;
      const end = this._dateWindowDialogDraftRange?.end;
      if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) {
        return;
      }
      const roundedUnit = this._getRoundedDateWindowUnit(start, end);
      let nextStart;
      let nextEnd;
      if (roundedUnit) {
        nextStart = startOfUnit(this._shiftDateWindowByUnit(start, roundedUnit, direction), roundedUnit);
        nextEnd = endOfUnit(nextStart, roundedUnit);
      } else {
        const spanMs = end.getTime() - start.getTime();
        nextStart = new Date(start.getTime() + direction * spanMs);
        nextEnd = new Date(end.getTime() + direction * spanMs);
      }
      this._dateWindowDialogDraftRange = {
        start: nextStart,
        end: nextEnd
      };
      this._syncDateWindowDialogInputs();
    }
    _ensureDateWindowDialog() {
      if (this._dateWindowDialogComp || this._dateWindowDialogEl || !this.shadowRoot) return;
      const dialog = document.createElement("ha-dialog");
      dialog.id = "date-window-dialog";
      dialog.setAttribute("hideActions", "");
      dialog.scrimClickAction = true;
      dialog.escapeKeyAction = true;
      dialog.open = false;
      dialog.headerTitle = "Add date window";
      dialog.style.setProperty("--dialog-content-padding", `0 var(--dp-spacing-lg) var(--dp-spacing-lg)`);
      dialog.innerHTML = `
      <div class="date-window-dialog-content">
        <div class="date-window-dialog-body">
          A date window saves a named date range as a tab, so you can quickly preview it against the selected range or jump the chart back to it later.
        </div>
        <div class="date-window-dialog-field name-field">
          <ha-textfield id="date-window-name" label="Name" placeholder="e.g. Heating season start"></ha-textfield>
        </div>
        <div class="date-window-dialog-field">
          <label>Date range</label>
          <div class="date-window-dialog-dates">
            <div class="date-window-dialog-field">
              <label for="date-window-start">Start</label>
              <input id="date-window-start" class="date-window-dialog-input" type="datetime-local" step="60">
            </div>
            <div class="date-window-dialog-field">
              <label for="date-window-end">End</label>
              <input id="date-window-end" class="date-window-dialog-input" type="datetime-local" step="60">
            </div>
          </div>
        </div>
        <div class="date-window-dialog-shortcuts" id="date-window-shortcuts" hidden>
          <ha-button id="date-window-previous">Use previous range</ha-button>
          <ha-button id="date-window-next">Use next range</ha-button>
        </div>
        <div class="date-window-dialog-actions">
          <ha-button class="date-window-dialog-delete" id="date-window-delete" hidden>Delete date window</ha-button>
          <div class="date-window-dialog-actions-right">
            <ha-button class="date-window-dialog-cancel" id="date-window-cancel">Cancel</ha-button>
            <ha-button raised class="date-window-dialog-submit" id="date-window-submit">Create date window</ha-button>
          </div>
        </div>
      </div>
    `;
      dialog.addEventListener("closed", () => this._closeDateWindowDialog(true));
      this.shadowRoot.appendChild(dialog);
      this._dateWindowDialogEl = dialog;
      this._dateWindowDialogNameEl = dialog.querySelector("#date-window-name");
      this._dateWindowDialogStartEl = dialog.querySelector("#date-window-start");
      this._dateWindowDialogEndEl = dialog.querySelector("#date-window-end");
      this._dateWindowDialogShortcutsEl = dialog.querySelector("#date-window-shortcuts");
      if (this._hass && this._dateWindowDialogNameEl) {
        this._dateWindowDialogNameEl.hass = this._hass;
      }
      dialog.querySelector("#date-window-cancel")?.addEventListener("click", () => this._closeDateWindowDialog());
      dialog.querySelector("#date-window-submit")?.addEventListener("click", () => this._createDateWindowFromDialog());
      dialog.querySelector("#date-window-delete")?.addEventListener("click", () => this._deleteEditingDateWindow());
      this._dateWindowDialogStartEl?.addEventListener("change", () => this._handleDateWindowDialogInputChange());
      this._dateWindowDialogEndEl?.addEventListener("change", () => this._handleDateWindowDialogInputChange());
      dialog.querySelector("#date-window-previous")?.addEventListener("click", () => this._applyDateWindowShortcut(-1));
      dialog.querySelector("#date-window-next")?.addEventListener("click", () => this._applyDateWindowShortcut(1));
    }
    _openDateWindowDialog(targetWindow = null) {
      this._ensureDateWindowDialog();
      this._dateWindowDialogOpen = true;
      this._editingDateWindowId = targetWindow?.id || null;
      const dialogStart = targetWindow ? parseDateValue(targetWindow.start_time) : this._startTime;
      const dialogEnd = targetWindow ? parseDateValue(targetWindow.end_time) : this._endTime;
      this._dateWindowDialogDraftRange = dialogStart && dialogEnd && dialogStart < dialogEnd ? { start: new Date(dialogStart), end: new Date(dialogEnd) } : null;
      if (this._dateWindowDialogComp) {
        this._dateWindowDialogComp.heading = targetWindow ? "Edit date window" : "Add date window";
        this._dateWindowDialogComp.submitLabel = targetWindow ? "Save date window" : "Create date window";
        this._dateWindowDialogComp.showDelete = !!targetWindow;
        this._dateWindowDialogComp.showShortcuts = !targetWindow;
        this._dateWindowDialogComp.name = targetWindow?.label || "";
        this._dateWindowDialogComp.startValue = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.start || null);
        this._dateWindowDialogComp.endValue = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.end || null);
        this._dateWindowDialogComp.rangeBounds = this._rangeBounds ?? null;
        this._dateWindowDialogComp.zoomLevel = this._zoomLevel ?? "auto";
        this._dateWindowDialogComp.dateSnapping = this._dateSnapping ?? "hour";
        this._dateWindowDialogComp.open = true;
        return;
      }
      if (this._dateWindowDialogEl) {
        this._dateWindowDialogEl.open = true;
        this._dateWindowDialogEl.headerTitle = targetWindow ? "Edit date window" : "Add date window";
      }
      const submitButton = this._dateWindowDialogEl?.querySelector("#date-window-submit");
      if (submitButton) {
        submitButton.textContent = targetWindow ? "Save date window" : "Create date window";
      }
      const deleteButton = this._dateWindowDialogEl?.querySelector("#date-window-delete");
      if (deleteButton) {
        deleteButton.hidden = !targetWindow;
        deleteButton.style.display = targetWindow ? "" : "none";
      }
      if (this._dateWindowDialogShortcutsEl) {
        this._dateWindowDialogShortcutsEl.hidden = !!targetWindow;
      }
      if (this._dateWindowDialogNameEl) {
        this._dateWindowDialogNameEl.value = targetWindow?.label || "";
      }
      this._syncDateWindowDialogInputs();
      window.requestAnimationFrame(() => this._dateWindowDialogNameEl?.focus());
    }
    _closeDateWindowDialog(fromClosedEvent = false) {
      this._dateWindowDialogOpen = false;
      this._editingDateWindowId = null;
      this._dateWindowDialogDraftRange = null;
      this._pendingAnomalyComparisonWindowEntityId = null;
      if (!fromClosedEvent) {
        if (this._dateWindowDialogComp) {
          this._dateWindowDialogComp.open = false;
        } else if (this._dateWindowDialogEl) {
          this._dateWindowDialogEl.open = false;
        }
      }
    }
    _createDateWindowFromDialog(overrides = {}) {
      const rawName = overrides.name != null ? overrides.name : this._dateWindowDialogNameEl?.value || "";
      const label = String(rawName).trim();
      const parsedStart = overrides.start ? this._parseDateWindowInputValue(overrides.start) : null;
      const parsedEnd = overrides.end ? this._parseDateWindowInputValue(overrides.end) : null;
      const start = parsedStart || this._dateWindowDialogDraftRange?.start || null;
      const end = parsedEnd || this._dateWindowDialogDraftRange?.end || null;
      if (!label || !start || !end || start >= end) return;
      const existingIds = new Set(this._comparisonWindows.map((window2) => window2.id));
      const nextWindow = {
        id: this._editingDateWindowId || makeDateWindowId(label, existingIds),
        label,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      };
      this._comparisonWindows = normalizeDateWindows(
        this._editingDateWindowId ? this._comparisonWindows.map((window2) => window2.id === this._editingDateWindowId ? nextWindow : window2) : [...this._comparisonWindows, nextWindow]
      );
      this._saveUserPreferences();
      this._saveSessionState();
      this._updateUrl({ push: false });
      const pendingEntityId = this._pendingAnomalyComparisonWindowEntityId;
      const wasCreatingNew = !this._editingDateWindowId;
      this._pendingAnomalyComparisonWindowEntityId = null;
      this._closeDateWindowDialog();
      if (pendingEntityId && wasCreatingNew) {
        this._setSeriesAnalysisOption(pendingEntityId, "anomaly_comparison_window_id", nextWindow.id);
      }
      this._renderContent();
    }
    async _deleteDateWindow(id) {
      if (!id) return;
      const windowToDelete = this._comparisonWindows.find((window2) => window2.id === id);
      const confirmed = await confirmDestructiveAction$1(this, {
        title: "Delete date window",
        message: `Delete "${windowToDelete?.label || "this date window"}"?`,
        confirmLabel: "Delete date window"
      });
      if (!confirmed) return false;
      const nextWindows = this._comparisonWindows.filter((window2) => window2.id !== id);
      if (nextWindows.length === this._comparisonWindows.length) return false;
      if (this._hoveredComparisonWindowId === id) {
        this._hoveredComparisonWindowId = null;
      }
      if (this._selectedComparisonWindowId === id) {
        this._selectedComparisonWindowId = null;
        this._clearDeltaAnalysisSelectionState();
      }
      if (this._hoveredComparisonWindowId == null) {
        this._updateComparisonRangePreview();
      }
      this._comparisonWindows = nextWindows;
      this._saveUserPreferences();
      this._saveSessionState();
      this._updateUrl({ push: false });
      this._renderContent();
      return true;
    }
    async _deleteEditingDateWindow() {
      const id = this._editingDateWindowId;
      if (!id) return;
      const deleted = await this._deleteDateWindow(id);
      if (deleted) this._closeDateWindowDialog();
    }
    _handleComparisonTabHover(id) {
      if (!id || this._hoveredComparisonWindowId === id) {
        return;
      }
      this._hoveredComparisonWindowId = id;
      this._updateComparisonRangePreview();
      this._updateChartHoverIndicator();
      this._renderContent();
    }
    _handleComparisonTabLeave(id) {
      if (!id || this._hoveredComparisonWindowId !== id) {
        return;
      }
      this._hoveredComparisonWindowId = null;
      this._updateComparisonRangePreview();
      this._updateChartHoverIndicator();
      this._renderContent();
    }
    _handleComparisonLoading(ev) {
      const ids = Array.isArray(ev?.detail?.ids) ? ev.detail.ids.filter(Boolean) : [];
      const loading = ev?.detail?.loading === true;
      this._loadingComparisonWindowIds = loading ? [.../* @__PURE__ */ new Set([...this._loadingComparisonWindowIds, ...ids])] : this._loadingComparisonWindowIds.filter((id) => !ids.includes(id));
      this._renderComparisonTabs();
    }
    _handleAnalysisComputing(ev) {
      const computing = ev?.detail?.computing === true;
      const entityIds = Array.isArray(ev?.detail?.entityIds) ? ev.detail.entityIds : [];
      if (computing) {
        for (const id of entityIds) {
          if (this._analysisSpinnerTimers?.[id]) {
            clearTimeout(this._analysisSpinnerTimers[id]);
            delete this._analysisSpinnerTimers[id];
          }
          const spinners = this.shadowRoot?.querySelectorAll(`.analysis-computing-spinner[data-analysis-spinner="${CSS.escape(id)}"]`) || [];
          spinners.forEach((el) => el.classList.add("active"));
        }
      } else {
        for (const id of entityIds) {
          if (this._analysisSpinnerTimers?.[id]) {
            clearTimeout(this._analysisSpinnerTimers[id]);
            delete this._analysisSpinnerTimers[id];
          }
          const spinners = this.shadowRoot?.querySelectorAll(`.analysis-computing-spinner[data-analysis-spinner="${CSS.escape(id)}"]`) || [];
          spinners.forEach((el) => el.classList.remove("active"));
        }
      }
    }
    _clearDeltaAnalysisSelectionState() {
    }
    _handleComparisonTabActivate(id) {
      if (!id || id === "current-range") {
        this._selectedComparisonWindowId = null;
        this._hoveredComparisonWindowId = null;
        this._clearDeltaAnalysisSelectionState();
        this._updateComparisonRangePreview();
        this._renderComparisonTabs();
        if (this._chartEl) {
          this._chartEl._adjustComparisonAxisScale = false;
        }
        this._renderContent();
        return;
      }
      const targetWindow = this._comparisonWindows.find((window2) => window2.id === id);
      if (!targetWindow) {
        return;
      }
      this._selectedComparisonWindowId = this._selectedComparisonWindowId === id ? null : id;
      if (!this._selectedComparisonWindowId) {
        this._clearDeltaAnalysisSelectionState();
      }
      this._updateComparisonRangePreview();
      this._updateChartHoverIndicator();
      this._renderContent();
    }
    _syncSidebarUi() {
      this._pageContentEl?.classList.toggle("sidebar-collapsed", this._sidebarCollapsed);
      this._pageSidebarEl?.classList.toggle("collapsed", this._sidebarCollapsed);
      const label = this._sidebarCollapsed ? "Expand targets sidebar" : "Collapse targets sidebar";
      if (this._sidebarToggleButtonEl) {
        this._sidebarToggleButtonEl.label = label;
      }
    }
    _applyContentSplitLayout() {
      const content = this.shadowRoot?.getElementById("content");
      if (!content) return;
      const resizablePanes = content.querySelector("#content-resizable-panes");
      if (resizablePanes) {
        resizablePanes.ratio = this._contentSplitRatio;
      } else {
        content.style.setProperty("--content-top-size", `${Math.round(this._contentSplitRatio * 1e3) / 10}%`);
      }
      this._updateComparisonTabsOverflow();
    }
    _beginContentSplitPointer(ev) {
      if (ev.button !== 0 || !this._contentSplitterEl) return;
      ev.preventDefault();
      this._contentSplitPointerId = ev.pointerId;
      this._contentSplitterEl.classList.add("dragging");
      window.addEventListener("pointermove", this._onContentSplitPointerMove);
      window.addEventListener("pointerup", this._onContentSplitPointerUp);
      window.addEventListener("pointercancel", this._onContentSplitPointerUp);
    }
    _handleContentSplitPointerMove(ev) {
      if (this._contentSplitPointerId == null || ev.pointerId !== this._contentSplitPointerId) return;
      const content = this.shadowRoot?.getElementById("content");
      if (!content) return;
      const rect = content.getBoundingClientRect();
      if (!rect.height) return;
      const topMinPx = 280;
      const bottomMinPx = 240;
      const splitterPx = 24;
      const minRatio = clampNumber(topMinPx / rect.height, 0, 1);
      const maxRatio = clampNumber((rect.height - bottomMinPx - splitterPx) / rect.height, 0, 1);
      const ratio = clampNumber((ev.clientY - rect.top) / rect.height, minRatio, Math.max(minRatio, maxRatio));
      this._contentSplitRatio = ratio;
      this._applyContentSplitLayout();
      ev.preventDefault();
    }
    _finishContentSplitPointer(ev) {
      if (this._contentSplitPointerId == null || ev.pointerId !== this._contentSplitPointerId) return;
      this._contentSplitPointerId = null;
      this._contentSplitterEl?.classList.remove("dragging");
      window.removeEventListener("pointermove", this._onContentSplitPointerMove);
      window.removeEventListener("pointerup", this._onContentSplitPointerUp);
      window.removeEventListener("pointercancel", this._onContentSplitPointerUp);
      this._saveSessionState();
      window.requestAnimationFrame(() => this._syncRangeControl());
    }
    _toggleSidebarCollapsed() {
      this._sidebarCollapsed = !this._sidebarCollapsed;
      if (!this._sidebarCollapsed) {
        this._hideCollapsedTargetPopup();
      }
      this._saveSessionState();
      this._syncSidebarUi();
      window.requestAnimationFrame(() => {
        if (!this.isConnected) return;
        this._syncRangeControl();
      });
    }
    _handleCollapsedSidebarClick(ev) {
      if (!this._sidebarCollapsed) return;
      if (ev.target?.closest?.(".history-targets-collapsed-item")) return;
      if (ev.target?.closest?.(".sidebar-toggle-button")) return;
      this._toggleSidebarCollapsed();
    }
    _setDatapointScope(scope) {
      let nextScope;
      if (scope === "all") {
        nextScope = "all";
      } else if (scope === "hidden") {
        nextScope = "hidden";
      } else {
        nextScope = "linked";
      }
      if (nextScope === this._datapointScope) return;
      this._datapointScope = nextScope;
      this._timelineEvents = [];
      this._timelineEventsKey = "";
      this._saveSessionState();
      this._renderSidebarOptions();
      this._updateUrl({ push: false });
      void this._ensureTimelineEvents();
      this._renderContent();
    }
    _setChartYAxisMode(mode) {
      const nextDelink = mode === "unique";
      const nextSplit = mode === "split";
      if (this._delinkChartYAxis === nextDelink && this._splitChartView === nextSplit) {
        return;
      }
      this._delinkChartYAxis = nextDelink;
      this._splitChartView = nextSplit;
      this._saveSessionState();
      this._renderSidebarOptions();
      this._renderContent();
    }
    _setChartDatapointDisplayOption(kind, enabled) {
      const normalized = !!enabled;
      if (kind === "icons") {
        if (this._showChartDatapointIcons === normalized) return;
        this._showChartDatapointIcons = normalized;
      } else if (kind === "lines") {
        if (this._showChartDatapointLines === normalized) return;
        this._showChartDatapointLines = normalized;
      } else if (kind === "tooltips") {
        if (this._showChartTooltips === normalized) return;
        this._showChartTooltips = normalized;
      } else if (kind === "hover_guides") {
        if (this._showChartEmphasizedHoverGuides === normalized) return;
        this._showChartEmphasizedHoverGuides = normalized;
      } else if (kind === "correlated_anomalies") {
        if (this._showCorrelatedAnomalies === normalized) return;
        this._showCorrelatedAnomalies = normalized;
      } else if (kind === "delink_y_axis") {
        if (this._delinkChartYAxis === normalized) return;
        this._delinkChartYAxis = normalized;
        if (normalized) {
          this._splitChartView = false;
        }
      } else if (kind === "split_chart_view") {
        if (this._splitChartView === normalized) return;
        this._splitChartView = normalized;
        if (normalized) {
          this._delinkChartYAxis = false;
        }
      } else if (kind === "data_gaps") {
        if (this._showDataGaps === normalized) return;
        this._showDataGaps = normalized;
      } else if (kind === "data_gap_threshold") {
        const value = String(enabled);
        if (this._dataGapThreshold === value) return;
        this._dataGapThreshold = value;
      } else {
        return;
      }
      this._saveSessionState();
      this._renderSidebarOptions();
      this._renderContent();
    }
    async _ensureHistoryBounds() {
      if (!this._hass || this._historyBoundsLoaded || this._historyBoundsPromise) return;
      this._historyBoundsPromise = fetchEventBounds(this._hass).then(({ start, end }) => {
        this._historyStartTime = parseDateValue(start);
        this._historyEndTime = parseDateValue(end);
        this._historyBoundsLoaded = true;
        if (this._zoomLevel === "auto") {
          this._resolvedAutoZoomLevel = null;
        }
        if (this._rendered) {
          this._syncControls();
        }
      }).catch((err) => {
        logger$1.warn("[hass-datapoints] failed to load event bounds:", err);
        this._historyBoundsLoaded = true;
      }).finally(() => {
        this._historyBoundsPromise = null;
      });
    }
    async _ensureTimelineEvents() {
      if (!this._hass || !this._rangeBounds) return;
      if (this._datapointScope === "hidden") {
        this._timelineEvents = [];
        this._timelineEventsKey = "";
        if (this._rendered && this._panelTimelineEl) this._panelTimelineEl.events = [];
        return;
      }
      const startIso = new Date(this._rangeBounds.min).toISOString();
      const endIso = new Date(this._rangeBounds.max).toISOString();
      const key = `${startIso}|${endIso}|${this._datapointScope}|${this._entities.join(",")}`;
      if (this._timelineEventsKey === key || this._timelineEventsPromise) return;
      this._timelineEventsPromise = fetchEvents$1(
        this._hass,
        startIso,
        endIso,
        this._datapointScope === "linked" ? this._entities : void 0
      ).then((events) => {
        this._timelineEvents = Array.isArray(events) ? events : [];
        this._timelineEventsKey = key;
        if (this._rendered && this._panelTimelineEl) this._panelTimelineEl.events = this._timelineEvents;
      }).catch((err) => {
        logger$1.warn("[hass-datapoints] failed to load timeline events:", err);
      }).finally(() => {
        this._timelineEventsPromise = null;
      });
    }
    async _ensureUserPreferences() {
      if (!this._hass || this._preferencesLoaded || this._preferencesPromise) return;
      this._preferencesPromise = fetchUserData(this._hass, PANEL_HISTORY_PREFERENCES_KEY, null).then((preferences) => {
        const normalized = normalizeHistoryPagePreferences(preferences, {
          zoomOptions: RANGE_ZOOM_OPTIONS,
          snapOptions: RANGE_SNAP_OPTIONS
        });
        this._zoomLevel = normalized.zoomLevel;
        this._dateSnapping = normalized.dateSnapping;
        this._resolvedAutoZoomLevel = normalized.zoomLevel === "auto" ? null : this._resolvedAutoZoomLevel;
        this._preferredSeriesColors = normalized.preferredSeriesColors;
        this._comparisonWindows = this._comparisonWindows.length ? this._comparisonWindows : normalized.comparisonWindows;
        this._seriesRows = this._applyPreferredSeriesColors(this._seriesRows);
        this._preferencesLoaded = true;
        if (normalized.shouldPersistDefaults) this._saveUserPreferences();
        if (this._rendered) {
          this._renderTargetRows();
          this._syncControls();
          this._updateUrl({ push: false });
          this._renderContent();
        }
      }).catch((err) => {
        logger$1.warn("[hass-datapoints] failed to load panel preferences:", err);
        this._preferencesLoaded = true;
      }).finally(() => {
        this._preferencesPromise = null;
      });
    }
    _saveUserPreferences() {
      if (!this._hass) {
        return;
      }
      const payload = buildHistoryPagePreferencesPayload(this);
      this._preferredSeriesColors = payload.series_colors;
      void saveUserData(this._hass, PANEL_HISTORY_PREFERENCES_KEY, payload);
    }
    _mountControls() {
      const targetSlot = this.shadowRoot.getElementById("target-slot");
      const dateSlot = this.shadowRoot.getElementById("date-slot");
      if (!targetSlot || !dateSlot) return;
      targetSlot.innerHTML = `
      <div class="history-targets">
        <div class="sidebar-section-header history-targets-header">
          <div class="sidebar-section-title">Targets</div>
          <div class="sidebar-section-subtitle">Each row controls one chart series.</div>
        </div>
        <div id="target-rows" class="history-target-rows"></div>
        <div id="target-picker-slot" class="history-target-picker-slot"></div>
        <div id="target-collapsed-summary" class="history-targets-collapsed-summary"></div>
      </div>
    `;
      dateSlot.innerHTML = "";
      this._targetRowsEl = targetSlot.querySelector("#target-rows");
      const pickerSlot = targetSlot.querySelector("#target-picker-slot");
      const rowListEl = document.createElement("dp-target-row-list");
      rowListEl.rows = [];
      rowListEl.states = {};
      rowListEl.hass = this._hass ?? null;
      rowListEl.canShowDeltaAnalysis = false;
      rowListEl.comparisonWindows = [];
      rowListEl.addEventListener("dp-row-color-change", (ev) => {
        const { index, color } = ev.detail || {};
        this._updateSeriesRowColor(index, color);
      });
      rowListEl.addEventListener("dp-row-visibility-change", (ev) => {
        const { entityId, visible } = ev.detail || {};
        this._updateSeriesRowVisibilityByEntityId(entityId, visible);
      });
      rowListEl.addEventListener("dp-row-remove", (ev) => {
        const { index } = ev.detail || {};
        this._removeSeriesRow(index);
      });
      rowListEl.addEventListener("dp-row-toggle-analysis", (ev) => {
        const { entityId } = ev.detail || {};
        this._toggleSeriesAnalysisExpanded(entityId);
      });
      rowListEl.addEventListener("dp-row-analysis-change", (ev) => {
        const { entityId, key, value } = ev.detail || {};
        this._setSeriesAnalysisOption(entityId, key, value);
      });
      rowListEl.addEventListener("dp-row-copy-analysis-to-all", (ev) => {
        const { entityId, analysis } = ev.detail || {};
        this._copyAnalysisToAll(entityId, analysis);
      });
      rowListEl.addEventListener("dp-rows-reorder", (ev) => {
        const { rows } = ev.detail || {};
        if (!Array.isArray(rows)) {
          return;
        }
        this._seriesRows = rows;
        this._syncSeriesState();
        this._saveSessionState();
        this._renderTargetRows();
        this._syncControls();
        this._updateUrl({ push: true });
        this._renderContent();
      });
      this._targetRowsEl.appendChild(rowListEl);
      this._rowListEl = rowListEl;
      const targetControl = document.createElement("ha-target-picker");
      targetControl.style.display = "block";
      targetControl.style.width = "100%";
      if (this._hass) targetControl.hass = this._hass;
      targetControl.addEventListener("value-changed", (ev) => {
        const hasValue = ev.detail && Object.prototype.hasOwnProperty.call(ev.detail, "value");
        if (!hasValue) return;
        const rawValue = normalizeTargetValue(ev.detail.value);
        const nextEntityIds = resolveEntityIdsFromTarget(this._hass, rawValue);
        if (!nextEntityIds.length) return;
        this._addSeriesRows(nextEntityIds);
        targetControl.value = {};
        this._saveSessionState();
        this._syncControls();
        this._updateUrl({ push: true });
        this._renderContent();
      });
      pickerSlot.appendChild(targetControl);
      this._targetControl = targetControl;
      ensureHaComponents(["ha-target-picker"]).then(() => {
        if (!this.isConnected || this._targetControl !== targetControl) return;
        if (this._hass) targetControl.hass = this._hass;
        targetControl.value = {};
      });
      const dateControl = document.createElement("div");
      dateControl.className = "range-control";
      dateControl.innerHTML = `
      <div class="range-toolbar">
        <dp-panel-timeline id="range-panel-timeline"></dp-panel-timeline>
        <div class="range-picker-wrap">
          <ha-icon-button id="range-picker-button" class="range-picker-button" label="Select date range" aria-haspopup="dialog" aria-expanded="false">
            <ha-icon icon="mdi:calendar-range"></ha-icon>
          </ha-icon-button>
          <dp-floating-menu id="range-picker-menu" style="--floating-menu-width: min(340px, calc(100vw - 32px)); --floating-menu-padding: var(--dp-spacing-md, 16px);">
            <ha-date-range-picker id="range-picker" class="range-picker"></ha-date-range-picker>
          </dp-floating-menu>
        </div>
        <div class="range-options-wrap">
          <ha-icon-button id="range-options-button" class="range-options-button" label="Timeline options" aria-haspopup="menu" aria-expanded="false">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <dp-floating-menu id="range-options-menu" style="--floating-menu-width: 280px; --floating-menu-max-height: min(70vh, 520px); --floating-menu-overflow: auto; --floating-menu-padding: var(--dp-spacing-sm, 8px);">
            <div class="range-options-view" data-options-view="root">
              <div class="range-options-list">
                <button type="button" class="range-submenu-trigger" data-options-submenu="zoom">
                  <span class="range-option-label">Zoom level</span>
                  <span class="range-submenu-meta" data-options-current="zoom"></span>
                </button>
                <button type="button" class="range-submenu-trigger" data-options-submenu="snap">
                  <span class="range-option-label">Date snapping</span>
                  <span class="range-submenu-meta" data-options-current="snap"></span>
                </button>
              </div>
            </div>
            <div class="range-options-view" data-options-view="zoom" hidden>
              <div class="range-options-header">
                <button type="button" class="range-options-header-trigger" data-options-back>
                  <span class="range-options-back" aria-hidden="true">
                    <span>‹</span>
                  </span>
                  <div class="range-options-title">Zoom level</div>
                </button>
              </div>
              <div class="range-options-list">
                ${RANGE_ZOOM_OPTIONS.map((option) => `
                  <button type="button" class="range-option" data-option-group="zoom" data-option-value="${option.value}">
                    <span class="range-option-label">${option.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="range-options-view" data-options-view="snap" hidden>
              <div class="range-options-header">
                <button type="button" class="range-options-header-trigger" data-options-back>
                  <span class="range-options-back" aria-hidden="true">
                    <span>‹</span>
                  </span>
                  <div class="range-options-title">Date snapping</div>
                </button>
              </div>
              <div class="range-options-list">
                ${RANGE_SNAP_OPTIONS.map((option) => `
                  <button type="button" class="range-option" data-option-group="snap" data-option-value="${option.value}">
                    <span class="range-option-label">${option.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          </dp-floating-menu>
        </div>
      </div>
    `;
      this._panelTimelineEl = dateControl.querySelector("#range-panel-timeline");
      this._dateRangePickerEl = dateControl.querySelector("#range-picker");
      this._datePickerButtonEl = dateControl.querySelector("#range-picker-button");
      this._datePickerMenuEl = dateControl.querySelector("#range-picker-menu");
      this._optionsButtonEl = dateControl.querySelector("#range-options-button");
      this._optionsMenuEl = dateControl.querySelector("#range-options-menu");
      this._panelTimelineEl.addEventListener("dp-range-commit", (ev) => {
        this._applyCommittedRange(ev.detail.start, ev.detail.end, { push: ev.detail.push ?? false });
      });
      this._panelTimelineEl.addEventListener("dp-range-draft", (ev) => {
        this._scheduleAutoZoomUpdate(ev.detail.start, ev.detail.end);
      });
      this._datePickerButtonEl.addEventListener("click", () => this._toggleDatePickerMenu());
      this._datePickerMenuEl?.addEventListener("dp-menu-close", () => this._toggleDatePickerMenu(false));
      this._dateRangePickerEl.addEventListener("change", (ev) => this._handleDatePickerChange(ev));
      this._dateRangePickerEl.addEventListener("value-changed", (ev) => this._handleDatePickerChange(ev));
      this._optionsButtonEl.addEventListener("click", () => this._toggleOptionsMenu());
      this._optionsMenuEl?.addEventListener("dp-menu-close", () => this._toggleOptionsMenu(false));
      this._optionsMenuEl.querySelectorAll("[data-options-submenu]").forEach((button) => {
        button.addEventListener("click", () => this._setOptionsMenuView(button.dataset.optionsSubmenu || "root"));
      });
      this._optionsMenuEl.querySelectorAll("[data-options-back]").forEach((button) => {
        button.addEventListener("click", () => this._setOptionsMenuView("root"));
      });
      this._optionsMenuEl.querySelectorAll("[data-option-group]").forEach((button) => {
        button.addEventListener("click", () => this._handleOptionSelect(button));
      });
      dateSlot.appendChild(dateControl);
      this._dateControl = dateControl;
      if (this._sidebarOptionsEl) {
        const sidebarComp = document.createElement("dp-sidebar-options");
        sidebarComp.addEventListener("dp-scope-change", (ev) => {
          const { value } = ev.detail || {};
          if (value) {
            this._setDatapointScope(value);
          }
        });
        sidebarComp.addEventListener("dp-display-change", (ev) => {
          const { kind, value } = ev.detail || {};
          if (!kind) {
            return;
          }
          if (kind === "y_axis_mode") {
            this._setChartYAxisMode(value);
          } else {
            this._setChartDatapointDisplayOption(kind, value);
          }
        });
        sidebarComp.addEventListener("dp-analysis-change", (ev) => {
          const { kind, value } = ev.detail || {};
          if (kind === "anomaly_overlap_mode" && ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS.some((o2) => o2.value === value)) {
            if (this._chartAnomalyOverlapMode === value) {
              return;
            }
            this._chartAnomalyOverlapMode = value;
            this._saveSessionState();
            this._renderSidebarOptions();
            this._renderContent();
          }
        });
        sidebarComp.addEventListener("dp-accordion-change", (ev) => {
          const { targetsOpen, datapointsOpen, analysisOpen, chartOpen } = ev.detail || {};
          if (typeof targetsOpen === "boolean") this._sidebarAccordionTargetsOpen = targetsOpen;
          if (typeof datapointsOpen === "boolean") this._sidebarAccordionDatapointsOpen = datapointsOpen;
          if (typeof analysisOpen === "boolean") this._sidebarAccordionAnalysisOpen = analysisOpen;
          if (typeof chartOpen === "boolean") this._sidebarAccordionChartOpen = chartOpen;
          this._saveSessionState();
        });
        this._sidebarOptionsEl.appendChild(sidebarComp);
        this._sidebarOptionsComp = sidebarComp;
      }
      if (this.shadowRoot) {
        const dialogComp = document.createElement("dp-date-window-dialog");
        dialogComp.addEventListener("dp-window-close", () => this._closeDateWindowDialog());
        dialogComp.addEventListener("dp-window-submit", (ev) => {
          this._createDateWindowFromDialog(ev.detail || {});
        });
        dialogComp.addEventListener("dp-window-delete", () => this._deleteEditingDateWindow());
        dialogComp.addEventListener("dp-window-shortcut", (ev) => {
          this._applyDateWindowShortcut(ev.detail.direction);
        });
        dialogComp.addEventListener("dp-window-date-change", (ev) => {
          const start = this._parseDateWindowInputValue(ev.detail?.start || "");
          const end = this._parseDateWindowInputValue(ev.detail?.end || "");
          if (start && end && start < end) {
            this._dateWindowDialogDraftRange = { start, end };
          } else {
            this._dateWindowDialogDraftRange = null;
          }
        });
        this.shadowRoot.appendChild(dialogComp);
        this._dateWindowDialogComp = dialogComp;
      }
      this._syncControls();
    }
    _renderTargetRows() {
      if (!this._targetRowsEl) return;
      const collapsedSummaryEl = this.shadowRoot?.getElementById("target-collapsed-summary");
      if (this._rowListEl) {
        this._rowListEl.rows = this._seriesRows;
        this._rowListEl.states = this._hass?.states ?? {};
        this._rowListEl.hass = this._hass ?? null;
        this._rowListEl.canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
        this._rowListEl.comparisonWindows = this._comparisonWindows;
      }
      if (collapsedSummaryEl) {
        if (!this._seriesRows.length) {
          collapsedSummaryEl.innerHTML = `<div class="history-targets-collapsed-empty" title="No targets selected"></div>`;
        } else {
          collapsedSummaryEl.innerHTML = this._seriesRows.map((row, index) => {
            const label = entityName$1(this._hass, row.entity_id) || row.entity_id;
            const itemId = `collapsed-series-${index}`;
            return `
            <button
              type="button"
              id="${itemId}"
              class="history-targets-collapsed-item ${row.visible === false ? "is-hidden" : ""}"
              data-series-collapsed-entity-id="${esc$1(row.entity_id)}"
              style="--row-color:${esc$1(row.color)}"
              aria-label="${esc$1(label)}"
              aria-pressed="${row.visible === false ? "false" : "true"}"
            >
              <ha-state-icon
                data-series-collapsed-icon-entity-id="${esc$1(row.entity_id)}"
                aria-hidden="true"
              ></ha-state-icon>
            </button>
            <ha-tooltip for="${itemId}" placement="right" distance="4">${esc$1(label)}</ha-tooltip>
          `;
          }).join("");
          collapsedSummaryEl.querySelectorAll("[data-series-collapsed-icon-entity-id]").forEach((iconEl) => {
            const entityId = iconEl.dataset.seriesCollapsedIconEntityId;
            if (!entityId) {
              return;
            }
            iconEl.stateObj = this._hass?.states?.[entityId];
            iconEl.hass = this._hass;
          });
          collapsedSummaryEl.querySelectorAll("[data-series-collapsed-entity-id]").forEach((button) => {
            button.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const entityId = String(button.dataset.seriesCollapsedEntityId || "");
              if (this._collapsedPopupEntityId === entityId) {
                this._hideCollapsedTargetPopup();
              } else {
                this._showCollapsedTargetPopup(entityId, button);
              }
            });
          });
        }
      }
      this._refreshCollapsedTargetPopup();
    }
    _addSeriesRows(entityIds) {
      const merged = new Map(this._seriesRows.map((row) => [row.entity_id, row]));
      normalizeEntityIds(entityIds).forEach((entityId, index) => {
        if (merged.has(entityId)) return;
        merged.set(entityId, {
          entity_id: entityId,
          color: this._preferredSeriesColors?.[entityId] && /^#[0-9a-f]{6}$/i.test(this._preferredSeriesColors[entityId]) ? this._preferredSeriesColors[entityId] : COLORS[(merged.size + index) % COLORS.length],
          visible: true,
          analysis: normalizeHistorySeriesAnalysis(null)
        });
      });
      this._seriesRows = [...merged.values()];
      this._syncSeriesState();
      this._renderTargetRows();
    }
    _updateSeriesRowColor(index, color) {
      if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
      if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
      if (this._seriesRows[index].color === color) return;
      this._seriesRows[index] = { ...this._seriesRows[index], color };
      this._saveUserPreferences();
      this._saveSessionState();
      this._updateUrl({ push: false });
      this._renderTargetRows();
      this._renderContent();
    }
    _updateSeriesRowVisibility(index, visible) {
      if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
      if (this._seriesRows[index].visible === !!visible) return;
      this._seriesRows[index] = { ...this._seriesRows[index], visible: !!visible };
      this._saveSessionState();
      this._renderTargetRows();
      this._renderContent();
    }
    /** Open (or re-render) the collapsed-sidebar target popup for *entityId*,
     *  anchored to *anchorEl*.  Wires all the same controls as the full sidebar row. */
    _showCollapsedTargetPopup(entityId, anchorEl) {
      const popup = this.shadowRoot?.getElementById("collapsed-target-popup");
      if (!popup) {
        return;
      }
      const index = this._seriesRows.findIndex((r2) => r2.entity_id === entityId);
      if (index < 0) {
        this._hideCollapsedTargetPopup();
        return;
      }
      const row = this._seriesRows[index];
      this._collapsedPopupEntityId = entityId;
      this._collapsedPopupAnchorEl = anchorEl;
      popup.innerHTML = "";
      const targetRow = document.createElement("dp-target-row");
      targetRow.color = row.color;
      targetRow.visible = row.visible !== false;
      targetRow.analysis = row.analysis || {};
      targetRow.index = index;
      targetRow.stateObj = this._hass?.states?.[row.entity_id] ?? null;
      targetRow.hass = this._hass ?? null;
      targetRow.canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
      targetRow.comparisonWindows = this._comparisonWindows || [];
      targetRow.addEventListener("dp-row-color-change", (ev) => {
        this._updateSeriesRowColor(ev.detail.index, ev.detail.color);
      });
      targetRow.addEventListener("dp-row-visibility-change", (ev) => {
        this._updateSeriesRowVisibilityByEntityId(ev.detail.entityId, ev.detail.visible);
      });
      targetRow.addEventListener("dp-row-toggle-analysis", (ev) => {
        this._toggleSeriesAnalysisExpanded(ev.detail.entityId);
      });
      targetRow.addEventListener("dp-row-analysis-change", (ev) => {
        this._setSeriesAnalysisOption(ev.detail.entityId, ev.detail.key, ev.detail.value);
      });
      targetRow.addEventListener("dp-row-copy-analysis-to-all", (ev) => {
        const { entityId: entityId2, analysis } = ev.detail || {};
        this._copyAnalysisToAll(entityId2, analysis);
      });
      targetRow.addEventListener("dp-row-remove", (ev) => {
        this._hideCollapsedTargetPopup();
        this._removeSeriesRow(ev.detail.index);
      });
      popup.appendChild(targetRow);
      popup.removeAttribute("hidden");
      const anchorRect = anchorEl.getBoundingClientRect();
      const popupHeight = popup.offsetHeight;
      const top = Math.min(anchorRect.top, window.innerHeight - popupHeight - 16);
      popup.style.top = `${Math.max(8, top)}px`;
      popup.style.left = `${anchorRect.right + 8}px`;
      if (this._collapsedPopupOutsideClickHandler) {
        document.removeEventListener("click", this._collapsedPopupOutsideClickHandler, true);
      }
      this._collapsedPopupOutsideClickHandler = (ev) => {
        const path = ev.composedPath();
        if (!path.includes(popup) && !path.includes(anchorEl)) {
          this._hideCollapsedTargetPopup();
        }
      };
      document.addEventListener("click", this._collapsedPopupOutsideClickHandler, true);
      if (this._collapsedPopupKeyHandler) {
        document.removeEventListener("keydown", this._collapsedPopupKeyHandler);
      }
      this._collapsedPopupKeyHandler = (ev) => {
        if (ev.key === "Escape") {
          this._hideCollapsedTargetPopup();
          anchorEl.focus();
        }
      };
      document.addEventListener("keydown", this._collapsedPopupKeyHandler);
    }
    /** Close the collapsed-sidebar target popup and clean up all listeners. */
    _hideCollapsedTargetPopup() {
      const popup = this.shadowRoot?.getElementById("collapsed-target-popup");
      if (popup) {
        popup.setAttribute("hidden", "");
        popup.innerHTML = "";
      }
      if (this._collapsedPopupOutsideClickHandler) {
        document.removeEventListener("click", this._collapsedPopupOutsideClickHandler, true);
        this._collapsedPopupOutsideClickHandler = null;
      }
      if (this._collapsedPopupKeyHandler) {
        document.removeEventListener("keydown", this._collapsedPopupKeyHandler);
        this._collapsedPopupKeyHandler = null;
      }
      this._collapsedPopupEntityId = null;
      this._collapsedPopupAnchorEl = null;
    }
    /** Re-render the popup in-place after a state change (e.g. analysis toggle).
     *  Called at the end of _renderTargetRows so the popup stays in sync. */
    _refreshCollapsedTargetPopup() {
      if (!this._collapsedPopupEntityId) {
        return;
      }
      const exists = this._seriesRows.some((r2) => r2.entity_id === this._collapsedPopupEntityId);
      if (!exists) {
        this._hideCollapsedTargetPopup();
        return;
      }
      const collapsedSummaryEl = this.shadowRoot?.getElementById("target-collapsed-summary");
      const newAnchor = collapsedSummaryEl ? Array.from(collapsedSummaryEl.querySelectorAll("[data-series-collapsed-entity-id]")).find((btn) => btn.dataset.seriesCollapsedEntityId === this._collapsedPopupEntityId) ?? null : null;
      if (!newAnchor) {
        this._hideCollapsedTargetPopup();
        return;
      }
      this._showCollapsedTargetPopup(this._collapsedPopupEntityId, newAnchor);
    }
    _updateSeriesRowVisibilityByEntityId(entityId, visible) {
      const normalizedEntityId = String(entityId || "").trim();
      if (!normalizedEntityId) return;
      const index = this._seriesRows.findIndex((row) => row.entity_id === normalizedEntityId);
      if (index === -1) return;
      this._updateSeriesRowVisibility(index, visible);
    }
    _toggleSeriesAnalysisExpanded(entityId) {
      const normalizedEntityId = String(entityId || "").trim();
      if (!normalizedEntityId) {
        return;
      }
      const index = this._seriesRows.findIndex((row2) => row2.entity_id === normalizedEntityId);
      if (index === -1) {
        return;
      }
      const row = this._seriesRows[index];
      const currentAnalysis = normalizeHistorySeriesAnalysis(row.analysis);
      const nextAnalysis = normalizeHistorySeriesAnalysis({
        ...row.analysis,
        expanded: !currentAnalysis.expanded
      });
      this._seriesRows[index] = {
        ...row,
        analysis: nextAnalysis
      };
      this._saveSessionState();
      this._renderTargetRows();
    }
    _setSeriesAnalysisOption(entityId, key, value) {
      const normalizedEntityId = String(entityId || "").trim();
      if (!normalizedEntityId || !key) {
        return;
      }
      if (key === "anomaly_comparison_window_id" && value === "__add_new__") {
        this._pendingAnomalyComparisonWindowEntityId = normalizedEntityId;
        this._openDateWindowDialog();
        return;
      }
      const index = this._seriesRows.findIndex((row2) => row2.entity_id === normalizedEntityId);
      if (index === -1) {
        return;
      }
      const row = this._seriesRows[index];
      const analysis = normalizeHistorySeriesAnalysis(row.analysis);
      if (key.startsWith("anomaly_method_toggle_")) {
        const method = key.slice("anomaly_method_toggle_".length);
        const currentMethods = analysis.anomaly_methods;
        const nextMethods = value === true ? [.../* @__PURE__ */ new Set([...currentMethods, method])] : currentMethods.filter((m2) => m2 !== method);
        key = "anomaly_methods";
        value = nextMethods;
      }
      const nextSource = {
        ...analysis,
        [key]: value
      };
      if (key === "show_trend_lines" && value !== true) {
        nextSource.show_trend_crosshairs = false;
      }
      if (key === "show_threshold_analysis" && value !== true) {
        nextSource.show_threshold_shading = false;
      }
      if (key === "show_delta_analysis" && value !== true) {
        nextSource.show_delta_tooltip = true;
        nextSource.show_delta_lines = false;
      }
      if (key === "show_anomalies" && value === true && (!Array.isArray(analysis.anomaly_methods) || analysis.anomaly_methods.length === 0)) {
        nextSource.anomaly_methods = ["trend_residual"];
      }
      const nextAnalysis = normalizeHistorySeriesAnalysis({
        ...nextSource,
        expanded: true
      });
      const unchanged = JSON.stringify(nextAnalysis) === JSON.stringify(analysis);
      if (unchanged) {
        return;
      }
      this._seriesRows[index] = {
        ...row,
        analysis: nextAnalysis
      };
      this._saveSessionState();
      this._renderTargetRows();
      this._renderContent();
    }
    _copyAnalysisToAll(sourceEntityId, sourceAnalysis) {
      const normalizedEntityId = String(sourceEntityId || "").trim();
      if (!normalizedEntityId || !sourceAnalysis) {
        return;
      }
      let changed = false;
      this._seriesRows = this._seriesRows.map((row) => {
        if (row.entity_id === normalizedEntityId) {
          return row;
        }
        const currentAnalysis = normalizeHistorySeriesAnalysis(row.analysis);
        const nextAnalysis = normalizeHistorySeriesAnalysis({
          ...sourceAnalysis,
          // Preserve per-row state that shouldn't be overwritten
          expanded: currentAnalysis.expanded,
          // Don't copy anomaly_comparison_window_id — it's entity-specific
          anomaly_comparison_window_id: currentAnalysis.anomaly_comparison_window_id
        });
        if (JSON.stringify(nextAnalysis) === JSON.stringify(currentAnalysis)) {
          return row;
        }
        changed = true;
        return { ...row, analysis: nextAnalysis };
      });
      if (!changed) {
        return;
      }
      this._saveSessionState();
      this._renderTargetRows();
      this._renderContent();
    }
    _removeSeriesRow(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
      this._seriesRows = this._seriesRows.filter((_2, rowIndex) => rowIndex !== index);
      this._syncSeriesState();
      this._saveSessionState();
      this._renderTargetRows();
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    }
    _clearAutoZoomTimer() {
      if (this._autoZoomTimer) {
        window.clearTimeout(this._autoZoomTimer);
        this._autoZoomTimer = null;
      }
    }
    _toggleOptionsMenu(force = !this._optionsOpen) {
      if (force) {
        this._toggleDatePickerMenu(false);
        this._togglePageMenu(false);
      }
      this._optionsOpen = force;
      if (!force) {
        this._optionsMenuView = "root";
      }
      if (this._optionsMenuEl) {
        this._optionsMenuEl.open = force;
        if (force) {
          this._positionFloatingMenu(this._optionsMenuEl, this._optionsButtonEl, 280);
        }
      }
      if (this._optionsButtonEl) {
        this._optionsButtonEl.setAttribute("aria-expanded", String(force));
      }
      this._syncOptionsMenu();
    }
    _toggleDatePickerMenu(force = !this._datePickerOpen) {
      if (force) {
        this._toggleOptionsMenu(false);
        this._togglePageMenu(false);
      }
      this._datePickerOpen = force;
      if (this._datePickerMenuEl) {
        this._datePickerMenuEl.open = force;
        if (force) {
          this._positionFloatingMenu(this._datePickerMenuEl, this._datePickerButtonEl, 320);
        }
      }
      if (this._datePickerButtonEl) {
        this._datePickerButtonEl.setAttribute("aria-expanded", String(force));
      }
    }
    _togglePageMenu(force = !this._pageMenuOpen) {
      if (force) {
        this._toggleDatePickerMenu(false);
        this._toggleOptionsMenu(false);
      }
      this._pageMenuOpen = force;
      if (this._pageMenuEl) {
        this._pageMenuEl.open = force;
        if (force) {
          this._positionPageMenu();
        }
      }
      if (this._pageMenuButtonEl) {
        this._pageMenuButtonEl.setAttribute("aria-expanded", String(force));
      }
    }
    _handleWindowPointerDown(_ev) {
    }
    _syncOptionsMenu() {
      if (!this._optionsMenuEl) return;
      this._optionsMenuEl.querySelectorAll("[data-options-view]").forEach((view) => {
        view.hidden = view.dataset.optionsView !== this._optionsMenuView;
      });
      const zoomLabel = RANGE_ZOOM_OPTIONS.find((option) => option.value === this._zoomLevel)?.label || "Auto";
      const snapLabel = RANGE_SNAP_OPTIONS.find((option) => option.value === this._dateSnapping)?.label || "Hour";
      const zoomCurrent = this._optionsMenuEl.querySelector("[data-options-current='zoom']");
      const snapCurrent = this._optionsMenuEl.querySelector("[data-options-current='snap']");
      if (zoomCurrent) zoomCurrent.textContent = zoomLabel;
      if (snapCurrent) snapCurrent.textContent = snapLabel;
      this._optionsMenuEl.querySelectorAll("[data-option-group='zoom']").forEach((button) => {
        button.classList.toggle("selected", button.dataset.optionValue === this._zoomLevel);
      });
      this._optionsMenuEl.querySelectorAll("[data-option-group='snap']").forEach((button) => {
        button.classList.toggle("selected", button.dataset.optionValue === this._dateSnapping);
      });
    }
    _setOptionsMenuView(view) {
      this._optionsMenuView = view;
      this._syncOptionsMenu();
    }
    _handleOptionSelect(button) {
      const group = button.dataset.optionGroup;
      const value = button.dataset.optionValue;
      if (!group || !value) return;
      let didChange = false;
      if (group === "zoom" && value !== this._zoomLevel) {
        this._zoomLevel = value;
        this._clearAutoZoomTimer();
        this._resolvedAutoZoomLevel = value === "auto" ? null : this._resolvedAutoZoomLevel;
        this._syncRangeControl();
        didChange = true;
      }
      if (group === "snap" && value !== this._dateSnapping) {
        this._dateSnapping = value;
        this._syncRangeControl();
        didChange = true;
      }
      this._syncOptionsMenu();
      if (didChange) this._saveUserPreferences();
    }
    _handleDatePickerChange(ev) {
      const { start, end } = extractRangeValue(ev);
      if (!start || !end || start >= end) {
        return;
      }
      if (ev.type === "change") {
        this._toggleDatePickerMenu(false);
      }
      this._applyCommittedRange(start, end, { push: true });
    }
    async _downloadSpreadsheet() {
      if (this._exportBusy || !this._hass || !this._startTime || !this._endTime) {
        return;
      }
      this._exportBusy = true;
      this._togglePageMenu(false);
      try {
        await downloadHistorySpreadsheet({
          hass: this._hass,
          entityIds: this._entities,
          startTime: this._startTime,
          endTime: this._endTime,
          datapointScope: this._datapointScope
        });
      } catch (error) {
        logger$1.error("[hass-datapoints panel] spreadsheet export:failed", error);
      } finally {
        this._exportBusy = false;
      }
    }
    // ---------------------------------------------------------------------------
    // Saved page state (persistent via HA frontend user data)
    // ---------------------------------------------------------------------------
    async _loadSavedPageIndicator() {
      if (!this._hass || this._savedPageLoaded) return;
      this._savedPageLoaded = true;
      try {
        const saved = await fetchUserData(this._hass, PANEL_HISTORY_SAVED_PAGE_KEY, null);
        this._hasSavedPage = !!saved;
        this._syncSavedPageMenuItems();
      } catch (_err) {
      }
    }
    _syncSavedPageMenuItems() {
      const restoreEl = this._pageMenuEl?.querySelector("#page-restore-page");
      const clearEl = this._pageMenuEl?.querySelector("#page-clear-saved-page");
      if (restoreEl) restoreEl.hidden = !this._hasSavedPage;
      if (clearEl) clearEl.hidden = !this._hasSavedPage;
    }
    async _savePageState() {
      if (this._savePageBusy || !this._hass) return;
      this._savePageBusy = true;
      this._togglePageMenu(false);
      try {
        const state = buildHistoryPageSessionState(this);
        await saveUserData(this._hass, PANEL_HISTORY_SAVED_PAGE_KEY, state);
        this._hasSavedPage = true;
        this._syncSavedPageMenuItems();
      } catch (err) {
        logger$1.error("[hass-datapoints panel] save page state failed:", err);
      } finally {
        this._savePageBusy = false;
      }
    }
    async _restorePageState() {
      if (!this._hass) return;
      this._togglePageMenu(false);
      try {
        const saved = await fetchUserData(this._hass, PANEL_HISTORY_SAVED_PAGE_KEY, null);
        if (!saved || typeof saved !== "object") return;
        try {
          window.sessionStorage.setItem(
            `${DOMAIN$1}:panel_history_session`,
            JSON.stringify(saved)
          );
        } catch (_storageErr) {
        }
        const baseUrl = window.location.pathname;
        window.history.replaceState(null, "", baseUrl);
        window.location.reload();
      } catch (err) {
        logger$1.error("[hass-datapoints panel] restore page state failed:", err);
      }
    }
    async _clearSavedPageState() {
      if (!this._hass) return;
      this._togglePageMenu(false);
      try {
        await saveUserData(this._hass, PANEL_HISTORY_SAVED_PAGE_KEY, null);
        this._hasSavedPage = false;
        this._syncSavedPageMenuItems();
      } catch (err) {
        logger$1.error("[hass-datapoints panel] clear saved page state failed:", err);
      }
    }
    _computeFloatingMenuPosition(anchorEl, menuWidth) {
      const viewportPadding = 8;
      const anchorRect = anchorEl.getBoundingClientRect();
      const left = Math.max(
        viewportPadding,
        Math.min(anchorRect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
      );
      const top = Math.max(viewportPadding, anchorRect.bottom + 8);
      return { left, top };
    }
    _positionFloatingMenu(menuEl, anchorEl, minWidth = 0) {
      if (!menuEl || !anchorEl) {
        return;
      }
      const menuWidth = Math.max(minWidth, menuEl.offsetWidth || minWidth || 0);
      const { left, top } = this._computeFloatingMenuPosition(anchorEl, menuWidth);
      menuEl.style.setProperty("--floating-menu-left", `${left}px`);
      menuEl.style.setProperty("--floating-menu-top", `${top}px`);
    }
    _positionPageMenu() {
      if (!this._pageMenuEl || !this._pageMenuButtonEl) {
        return;
      }
      const menuWidth = Math.max(220, this._pageMenuEl.offsetWidth || 220);
      const { left, top } = this._computeFloatingMenuPosition(this._pageMenuButtonEl, menuWidth);
      this._pageMenuEl.style.setProperty("--floating-menu-left", `${left}px`);
      this._pageMenuEl.style.setProperty("--floating-menu-top", `${top}px`);
    }
    _getEffectiveZoomLevel() {
      if (this._zoomLevel !== "auto") return this._zoomLevel;
      if (!this._resolvedAutoZoomLevel) {
        const referenceSpanMs = Math.max(
          (this._endTime?.getTime() || Date.now()) - (this._startTime?.getTime() || Date.now() - RANGE_SLIDER_WINDOW_MS),
          RANGE_SLIDER_MIN_SPAN_MS
        );
        this._resolvedAutoZoomLevel = this._computeZoomLevelForSpan(referenceSpanMs);
      }
      return this._resolvedAutoZoomLevel;
    }
    _getZoomConfig() {
      return RANGE_ZOOM_CONFIGS[this._getEffectiveZoomLevel()] || RANGE_ZOOM_CONFIGS.month_short;
    }
    _computeZoomLevelForSpan(spanMs) {
      const normalizedSpanMs = Math.max(spanMs, RANGE_SLIDER_MIN_SPAN_MS);
      if (normalizedSpanMs >= 180 * DAY_MS) return "quarterly";
      if (normalizedSpanMs >= 120 * DAY_MS) return "month_compressed";
      if (normalizedSpanMs >= 60 * DAY_MS) return "month_short";
      if (normalizedSpanMs >= 21 * DAY_MS) return "month_expanded";
      if (normalizedSpanMs >= 7 * DAY_MS) return "week_compressed";
      if (normalizedSpanMs >= 2 * DAY_MS) return "week_expanded";
      return "day";
    }
    _getEffectiveSnapUnit() {
      if (this._dateSnapping !== "auto") return this._dateSnapping;
      switch (this._getEffectiveZoomLevel()) {
        case "quarterly":
        case "month_compressed":
          return "month";
        case "month_short":
        case "month_expanded":
        case "week_compressed":
          return "week";
        case "week_expanded":
          return "day";
        case "day":
          return "hour";
        default:
          return "day";
      }
    }
    _getSnapSpanMs(reference = this._startTime || /* @__PURE__ */ new Date()) {
      const snapUnit = this._getEffectiveSnapUnit();
      const start = startOfUnit(reference, snapUnit);
      const end = endOfUnit(reference, snapUnit);
      return Math.max(SECOND_MS, end.getTime() - start.getTime());
    }
    _deriveRangeBounds() {
      const config = this._getZoomConfig();
      const startMs = this._startTime?.getTime() || Date.now() - 24 * HOUR_MS;
      const endMs = this._endTime?.getTime() || Date.now();
      const historyStartMs = this._historyStartTime?.getTime();
      const historyEndMs = this._historyEndTime?.getTime();
      const maxLookAheadMs = addUnit(/* @__PURE__ */ new Date(), "month", 3).getTime();
      const anchorMs = historyStartMs ?? startMs;
      const naturalMin = startOfUnit(new Date(anchorMs), config.boundsUnit).getTime();
      const paddedMin = startOfUnit(
        new Date(startMs - config.baselineMs * 0.3),
        config.boundsUnit
      ).getTime();
      const min = Math.min(naturalMin, paddedMin);
      const futureReference = addUnit(
        new Date(historyEndMs ?? endMs),
        "year",
        RANGE_FUTURE_BUFFER_YEARS
      ).getTime();
      const maxReference = Math.min(
        maxLookAheadMs,
        Math.max(
          futureReference,
          endMs,
          startMs + this._getSnapSpanMs(this._startTime || /* @__PURE__ */ new Date())
        )
      );
      const max = endOfUnit(new Date(maxReference), config.boundsUnit).getTime();
      return { min, max: Math.max(max, min + SECOND_MS), config };
    }
    _syncRangeControl() {
      if (!this._dateControl || !this._panelTimelineEl) return;
      this._rangeBounds = this._deriveRangeBounds();
      void this._ensureTimelineEvents();
      this._panelTimelineEl.startTime = this._startTime ? new Date(this._startTime) : null;
      this._panelTimelineEl.endTime = this._endTime ? new Date(this._endTime) : null;
      this._panelTimelineEl.rangeBounds = this._rangeBounds;
      this._panelTimelineEl.zoomLevel = this._getEffectiveZoomLevel();
      this._panelTimelineEl.dateSnapping = this._dateSnapping;
      this._panelTimelineEl.isLiveEdge = this._isOnLiveEdge();
      this._panelTimelineEl.events = this._timelineEvents || [];
      this._updateComparisonRangePreview();
      this._updateChartHoverIndicator();
      this._updateChartZoomHighlight();
    }
    _updateComparisonRangePreview() {
      if (!this._panelTimelineEl) return;
      const comparisonWindow = this._getActiveComparisonWindow();
      if (!this._rangeBounds || !comparisonWindow) {
        this._panelTimelineEl.comparisonPreview = null;
        this._updateZoomWindowHighlight();
        return;
      }
      const startMs = new Date(comparisonWindow.start_time).getTime();
      const endMs = new Date(comparisonWindow.end_time).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
        this._panelTimelineEl.comparisonPreview = null;
        this._updateZoomWindowHighlight();
        return;
      }
      this._panelTimelineEl.comparisonPreview = { start: startMs, end: endMs };
      this._updateZoomWindowHighlight();
    }
    _handleChartHover(ev) {
      this._chartHoverTimeMs = ev?.detail?.timeMs ?? null;
      this._updateChartHoverIndicator();
    }
    _handleChartZoom(ev) {
      const start = Number.isFinite(ev?.detail?.startTime) ? ev.detail.startTime : null;
      const end = Number.isFinite(ev?.detail?.endTime) ? ev.detail.endTime : null;
      const isPreview = !!ev?.detail?.preview;
      const source = ev?.detail?.source || "select";
      const nextRange = start != null && end != null && start < end ? { start, end } : null;
      if (isPreview) {
        this._chartZoomRange = nextRange;
      } else {
        this._chartZoomRange = nextRange;
        this._chartZoomCommittedRange = nextRange ? { ...nextRange } : null;
        if (source === "scroll") {
          this._scheduleChartZoomStateCommit();
        } else {
          this._saveSessionState();
          this._updateUrl({ push: false });
          this._syncListZoomState();
        }
      }
      this._updateChartZoomHighlight();
      if (!nextRange) {
        this._panelTimelineEl?.revealSelection?.();
      }
    }
    _scheduleChartZoomStateCommit() {
      if (this._chartZoomStateCommitTimer) {
        window.clearTimeout(this._chartZoomStateCommitTimer);
      }
      this._chartZoomStateCommitTimer = window.setTimeout(() => {
        this._chartZoomStateCommitTimer = null;
        this._saveSessionState();
        this._updateUrl({ push: false });
        this._syncListZoomState();
      }, 180);
    }
    _syncListZoomState() {
      if (!this._listEl) return;
      const listConfig = {
        entities: this._entities,
        datapoint_scope: this._datapointScope,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
        zoom_start_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.start).toISOString() : null,
        zoom_end_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.end).toISOString() : null,
        page_size: 15,
        show_entities: true,
        show_actions: true,
        show_search: true,
        hidden_event_ids: this._hiddenEventIds
      };
      const nextListConfigKey = JSON.stringify(listConfig);
      if (this._listConfigKey !== nextListConfigKey) {
        this._listEl.setConfig(listConfig);
        this._listConfigKey = nextListConfigKey;
      }
      this._listEl.hass = this._hass;
    }
    _handleRecordsSearch(ev) {
      const nextQuery = String(ev?.detail?.query || "").trim().toLowerCase();
      if (nextQuery === this._recordsSearchQuery) return;
      this._recordsSearchQuery = nextQuery;
      this._renderContent();
    }
    _handleToggleEventVisibility(ev) {
      const eventId = ev?.detail?.eventId;
      if (!eventId) return;
      if (this._hiddenEventIds.includes(eventId)) {
        this._hiddenEventIds = this._hiddenEventIds.filter((id) => id !== eventId);
      } else {
        this._hiddenEventIds = [...this._hiddenEventIds, eventId];
      }
      this._renderContent();
    }
    _handleToggleSeriesVisibility(ev) {
      const entityId = String(ev?.detail?.entityId || "").trim();
      const visible = ev?.detail?.visible;
      if (!entityId || typeof visible !== "boolean") return;
      const index = this._seriesRows.findIndex((row) => row.entity_id === entityId);
      if (index === -1 || this._seriesRows[index].visible === visible) return;
      this._seriesRows[index] = { ...this._seriesRows[index], visible };
      this._saveSessionState();
      this._renderTargetRows();
      this._renderContent();
    }
    _updateChartHoverIndicator() {
      if (!this._panelTimelineEl) return;
      if (!this._rangeBounds || this._chartHoverTimeMs == null) {
        this._panelTimelineEl.chartHoverTimeMs = null;
        this._panelTimelineEl.chartHoverWindowTimeMs = null;
        return;
      }
      this._panelTimelineEl.chartHoverTimeMs = this._chartHoverTimeMs;
      const activeWindow = this._getActiveComparisonWindow();
      if (activeWindow && this._startTime) {
        const timeOffsetMs = new Date(activeWindow.start_time).getTime() - this._startTime.getTime();
        this._panelTimelineEl.chartHoverWindowTimeMs = this._chartHoverTimeMs + timeOffsetMs;
      } else {
        this._panelTimelineEl.chartHoverWindowTimeMs = null;
      }
    }
    _updateChartZoomHighlight() {
      if (!this._panelTimelineEl) return;
      const highlightRange = this._chartZoomRange || this._chartZoomCommittedRange;
      if (!this._rangeBounds || !highlightRange) {
        this._panelTimelineEl.zoomRange = null;
        this._updateZoomWindowHighlight();
        return;
      }
      this._panelTimelineEl.zoomRange = { start: +highlightRange.start, end: +highlightRange.end };
      this._updateZoomWindowHighlight();
    }
    _updateZoomWindowHighlight() {
      if (!this._panelTimelineEl) return;
      const activeWindow = this._getActiveComparisonWindow();
      const zoomRange = this._chartZoomRange || this._chartZoomCommittedRange;
      if (!this._rangeBounds || !activeWindow || !zoomRange || !this._startTime) {
        this._panelTimelineEl.zoomWindowRange = null;
        return;
      }
      const windowStartMs = new Date(activeWindow.start_time).getTime();
      const windowEndMs = new Date(activeWindow.end_time).getTime();
      if (!Number.isFinite(windowStartMs) || !Number.isFinite(windowEndMs) || windowStartMs >= windowEndMs) {
        this._panelTimelineEl.zoomWindowRange = null;
        return;
      }
      const timeOffsetMs = windowStartMs - this._startTime.getTime();
      const zoomStartMs = +zoomRange.start + timeOffsetMs;
      const zoomEndMs = +zoomRange.end + timeOffsetMs;
      const intersectStart = Math.max(windowStartMs, zoomStartMs);
      const intersectEnd = Math.min(windowEndMs, zoomEndMs);
      if (intersectStart >= intersectEnd) {
        this._panelTimelineEl.zoomWindowRange = null;
        return;
      }
      this._panelTimelineEl.zoomWindowRange = { start: intersectStart, end: intersectEnd };
    }
    _setDraftRangeFromTimestamp(handle, timestamp) {
      if (!this._rangeBounds) return;
      const snapUnit = this._getEffectiveSnapUnit();
      let startMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? this._rangeBounds.min;
      let endMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? this._rangeBounds.max;
      const snapped = clampNumber(
        snapDateToUnit(new Date(timestamp), snapUnit).getTime(),
        this._rangeBounds.min,
        this._rangeBounds.max
      );
      const minSpan = Math.max(this._getSnapSpanMs(new Date(snapped)), SECOND_MS);
      if (handle === "start") {
        startMs = clampNumber(snapped, this._rangeBounds.min, endMs - minSpan);
      } else {
        endMs = clampNumber(snapped, startMs + minSpan, this._rangeBounds.max);
      }
      this._draftStartTime = new Date(startMs);
      this._draftEndTime = new Date(endMs);
      this._updateHandleStacking(handle);
      this._updateRangePreview();
      this._scheduleAutoZoomUpdate();
      this._scheduleRangeCommit();
    }
    _scheduleRangeCommit() {
      if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
      if (this._rangeCommitTimer) window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = window.setTimeout(() => {
        this._rangeCommitTimer = null;
        this._commitRangeSelection({ push: false });
      }, 240);
    }
    _scheduleAutoZoomUpdate(draftStart, draftEnd) {
      if (this._zoomLevel !== "auto" || !this._rangeBounds) return;
      const start = draftStart || this._startTime;
      const end = draftEnd || this._endTime;
      if (!start || !end || start >= end) return;
      const currentLevel = this._getEffectiveZoomLevel();
      const selectionSpanMs = Math.max(end.getTime() - start.getTime(), RANGE_SLIDER_MIN_SPAN_MS);
      const paddedSelectionSpanMs = Math.max(
        selectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
        RANGE_SLIDER_MIN_SPAN_MS
      );
      const candidateLevel = this._computeZoomLevelForSpan(paddedSelectionSpanMs);
      if (candidateLevel === currentLevel) {
        this._clearAutoZoomTimer();
        return;
      }
      this._clearAutoZoomTimer();
      this._autoZoomTimer = window.setTimeout(() => {
        this._autoZoomTimer = null;
        const latestStart = draftStart || this._startTime;
        const latestEnd = draftEnd || this._endTime;
        if (!latestStart || !latestEnd || latestStart >= latestEnd || this._zoomLevel !== "auto" || !this._rangeBounds) {
          return;
        }
        const latestLevel = this._getEffectiveZoomLevel();
        const latestSelectionSpanMs = Math.max(latestEnd.getTime() - latestStart.getTime(), RANGE_SLIDER_MIN_SPAN_MS);
        const latestPaddedSelectionSpanMs = Math.max(
          latestSelectionSpanMs * (1 + RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO),
          RANGE_SLIDER_MIN_SPAN_MS
        );
        const latestCandidateLevel = this._computeZoomLevelForSpan(latestPaddedSelectionSpanMs);
        if (latestCandidateLevel === latestLevel) return;
        this._resolvedAutoZoomLevel = latestCandidateLevel;
        this._syncRangeControl();
      }, RANGE_AUTO_ZOOM_DEBOUNCE_MS);
    }
    // ---------------------------------------------------------------------------
    // Live-edge detection and handle indicator
    // ---------------------------------------------------------------------------
    /** Returns true when the committed end time is at or very near "now",
     *  meaning new annotations should cause the visible range to advance. */
    _isOnLiveEdge() {
      if (!this._endTime) {
        return false;
      }
      return this._endTime.getTime() >= Date.now() - 2 * MINUTE_MS;
    }
    /** Toggle the live-edge indicator on the end handle. */
    _syncLiveEdgeHandle() {
      if (!this._panelTimelineEl) return;
      this._panelTimelineEl.isLiveEdge = this._isOnLiveEdge();
    }
    /** Called whenever a new annotation is recorded (HA event or window event).
     *  If the current range is on the live edge, advance the end time to now
     *  so the chart immediately shows the new data point. */
    _handleEventRecorded() {
      if (!this._isOnLiveEdge() || !this._startTime) {
        return;
      }
      this._applyCommittedRange(this._startTime, /* @__PURE__ */ new Date(), { push: false });
    }
    _applyCommittedRange(start, end, { push = false } = {}) {
      if (!start || !end || start >= end) return;
      const nextStart = new Date(start);
      const nextEnd = new Date(end);
      const didChange = !this._startTime || !this._endTime || this._startTime.getTime() !== nextStart.getTime() || this._endTime.getTime() !== nextEnd.getTime();
      this._startTime = nextStart;
      this._endTime = nextEnd;
      this._hours = Math.max(1, Math.round((nextEnd.getTime() - nextStart.getTime()) / HOUR_MS));
      this._syncLiveEdgeHandle();
      this._scheduleAutoZoomUpdate();
      this._syncControls();
      this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
      if (!didChange) return;
      this._saveSessionState();
      this._updateUrl({ push });
      this._renderContent();
    }
    _commitRangeSelection({ push = false } = {}) {
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      if (!this._draftStartTime || !this._draftEndTime || this._draftStartTime >= this._draftEndTime) return;
      this._applyCommittedRange(this._draftStartTime, this._draftEndTime, { push });
    }
    _updateUrl({ push = false } = {}) {
      const url = new URL(window.location.href);
      const target = this._entities.length ? { entity_id: [...this._entities] } : {};
      if (target.entity_id?.length) url.searchParams.set("entity_id", target.entity_id.join(","));
      else url.searchParams.delete("entity_id");
      if (target.device_id?.length) url.searchParams.set("device_id", target.device_id.join(","));
      else url.searchParams.delete("device_id");
      if (target.area_id?.length) url.searchParams.set("area_id", target.area_id.join(","));
      else url.searchParams.delete("area_id");
      if (target.label_id?.length) url.searchParams.set("label_id", target.label_id.join(","));
      else url.searchParams.delete("label_id");
      if (this._datapointScope === "all") url.searchParams.set("datapoints_scope", "all");
      else if (this._datapointScope === "hidden") url.searchParams.set("datapoints_scope", "hidden");
      else url.searchParams.delete("datapoints_scope");
      if (this._startTime && this._endTime) {
        url.searchParams.set("start_time", this._startTime.toISOString());
        url.searchParams.set("end_time", this._endTime.toISOString());
        url.searchParams.set("hours_to_show", String(this._hours));
      } else {
        url.searchParams.delete("start_time");
        url.searchParams.delete("end_time");
        url.searchParams.delete("hours_to_show");
      }
      if (this._chartZoomCommittedRange) {
        url.searchParams.set("zoom_start_time", new Date(this._chartZoomCommittedRange.start).toISOString());
        url.searchParams.set("zoom_end_time", new Date(this._chartZoomCommittedRange.end).toISOString());
      } else {
        url.searchParams.delete("zoom_start_time");
        url.searchParams.delete("zoom_end_time");
      }
      const dateWindowsParam = serializeDateWindowsParam(this._comparisonWindows);
      if (dateWindowsParam) url.searchParams.set("date_windows", dateWindowsParam);
      else url.searchParams.delete("date_windows");
      const seriesColorEntries = this._seriesRows.map((row) => {
        const key = this._seriesColorQueryKey(row.entity_id);
        return key && /^#[0-9a-f]{6}$/i.test(row.color || "") ? `${encodeURIComponent(key)}:${row.color.toLowerCase()}` : null;
      }).filter(Boolean);
      if (seriesColorEntries.length) url.searchParams.set("series_colors", seriesColorEntries.join(","));
      else url.searchParams.delete("series_colors");
      const nextUrl = `${url.pathname}${url.search}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (nextUrl === currentUrl) return;
      if (push) window.history.pushState(null, "", nextUrl);
      else window.history.replaceState(null, "", nextUrl);
    }
    _renderComparisonTabs() {
      const tabsEl = this._chartEl?.shadowRoot?.getElementById("chart-top-slot");
      if (!tabsEl) {
        return;
      }
      const comparisonTabs = Array.isArray(this._comparisonWindows) ? this._comparisonWindows : [];
      const activeComparisonWindowId = this._selectedComparisonWindowId || null;
      const currentTab = this._startTime && this._endTime ? {
        id: "current-range",
        label: "Selected range",
        detail: this._formatComparisonLabel(this._startTime, this._endTime),
        active: !activeComparisonWindowId,
        editable: false
      } : null;
      const tabs = [
        ...currentTab ? [currentTab] : [],
        ...comparisonTabs.map((window2) => ({
          ...window2,
          detail: this._formatComparisonLabel(
            new Date(window2.start_time),
            new Date(window2.end_time)
          ),
          active: window2.id === activeComparisonWindowId,
          editable: true
        }))
      ];
      tabsEl.hidden = false;
      if (!this._comparisonTabRailComp || this._comparisonTabsHostEl !== tabsEl) {
        tabsEl.innerHTML = "";
        const rail = document.createElement("dp-comparison-tab-rail");
        rail.addEventListener("dp-tab-activate", (ev) => this._handleComparisonTabActivate(ev.detail.tabId));
        rail.addEventListener("dp-tab-hover", (ev) => this._handleComparisonTabHover(ev.detail.tabId));
        rail.addEventListener("dp-tab-leave", (ev) => this._handleComparisonTabLeave(ev.detail.tabId));
        rail.addEventListener("dp-tab-edit", (ev) => {
          const id = ev.detail.tabId;
          const win = this._comparisonWindows.find((entry) => entry.id === id);
          if (win) {
            this._openDateWindowDialog(win);
          }
        });
        rail.addEventListener("dp-tab-delete", (ev) => {
          this._deleteDateWindow(ev.detail.tabId);
        });
        rail.addEventListener("dp-tab-add", () => this._openDateWindowDialog());
        tabsEl.appendChild(rail);
        this._comparisonTabRailComp = rail;
        this._comparisonTabsHostEl = tabsEl;
      }
      this._comparisonTabRailComp.tabs = tabs;
      this._comparisonTabRailComp.loadingIds = [...this._loadingComparisonWindowIds];
      this._comparisonTabRailComp.hoveredId = this._hoveredComparisonWindowId || "";
    }
    _updateComparisonTabsOverflow() {
      window.requestAnimationFrame(() => {
        const shell = this._chartEl?.shadowRoot?.querySelector("#chart-tabs-shell");
        const rail = this._chartEl?.shadowRoot?.querySelector("#chart-tabs-rail");
        if (!shell || !rail) return;
        shell.classList.toggle("overflowing", rail.scrollWidth > rail.clientWidth + 4);
      });
    }
    _renderContent() {
      const content = this.shadowRoot.getElementById("content");
      if (!content) return;
      if (!this._entities.length) {
        this._chartHoverTimeMs = null;
        this._updateChartHoverIndicator();
        this._chartZoomRange = null;
        this._chartZoomCommittedRange = null;
        this._updateChartZoomHighlight();
        content.innerHTML = `
        <ha-card class="empty">
          Select one or more entities to inspect annotated history.
        </ha-card>
      `;
        this._contentKey = "";
        this._chartEl = null;
        this._historyChartMol = null;
        this._listEl = null;
        this._chartConfigKey = "";
        this._listConfigKey = "";
        return;
      }
      const contentKey = JSON.stringify({
        entities: this._entities,
        series_entity_ids: this._seriesRows.map((row) => row.entity_id),
        datapoint_scope: this._datapointScope,
        start: this._startTime?.toISOString() || null,
        end: this._endTime?.toISOString() || null,
        hours: this._hours
      });
      const showRecordsPanel = this._datapointScope !== "hidden";
      const chartMounted = !!(this._chartEl && this._chartEl.isConnected && content.contains(this._chartEl));
      const listMounted = !showRecordsPanel || !!(this._listEl && this._listEl.isConnected && content.contains(this._listEl));
      if (this._contentKey !== contentKey || !chartMounted || !listMounted) {
        this._chartHoverTimeMs = null;
        this._updateChartHoverIndicator();
        this._chartZoomRange = null;
        this._chartZoomCommittedRange = null;
        this._updateChartZoomHighlight();
        this._recordsSearchQuery = "";
        content.innerHTML = `
        <dp-resizable-panes
          id="content-resizable-panes"
          direction="vertical"
          style="height:100%;min-height:0;"
        >
          <div slot="first" id="chart-host" class="chart-host">
            <div id="chart-card-host" class="chart-card-host"></div>
          </div>
          <div slot="second" id="list-host" class="list-host"></div>
        </dp-resizable-panes>
      `;
        const chartConfig2 = {
          entities: this._entities,
          series_settings: this._seriesRows,
          datapoint_scope: this._datapointScope,
          show_event_markers: this._showChartDatapointIcons,
          show_event_lines: this._showChartDatapointLines,
          show_tooltips: this._showChartTooltips,
          emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
          show_correlated_anomalies: this._showCorrelatedAnomalies,
          anomaly_overlap_mode: this._chartAnomalyOverlapMode,
          delink_y_axis: this._delinkChartYAxis,
          split_view: this._splitChartView,
          show_data_gaps: this._showDataGaps,
          data_gap_threshold: this._dataGapThreshold,
          hours_to_show: this._hours,
          start_time: this._startTime?.toISOString(),
          end_time: this._endTime?.toISOString(),
          zoom_start_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.start).toISOString() : null,
          zoom_end_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.end).toISOString() : null,
          message_filter: this._recordsSearchQuery || "",
          hidden_event_ids: this._hiddenEventIds,
          comparison_windows: this._getPreviewComparisonWindows(),
          preload_comparison_windows: this._getPreloadComparisonWindows(),
          comparison_preview_overlay: this._getComparisonPreviewOverlay(),
          comparison_hover_active: !!this._hoveredComparisonWindowId,
          selected_comparison_window_id: this._selectedComparisonWindowId,
          hovered_comparison_window_id: this._hoveredComparisonWindowId
        };
        const chart = document.createElement("hass-datapoints-history-card");
        chart.setConfig(chartConfig2);
        content.querySelector("#chart-card-host").appendChild(chart);
        const historyChartMol = { _configKey: JSON.stringify(chartConfig2), chartEl: chart };
        this._historyChartMol = historyChartMol;
        if (showRecordsPanel) {
          const listConfig = {
            entities: this._entities,
            datapoint_scope: this._datapointScope,
            hours_to_show: this._hours,
            start_time: this._startTime?.toISOString(),
            end_time: this._endTime?.toISOString(),
            zoom_start_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.start).toISOString() : null,
            zoom_end_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.end).toISOString() : null,
            page_size: 15,
            show_entities: true,
            show_actions: true,
            show_search: true,
            hidden_event_ids: this._hiddenEventIds
          };
          const list = document.createElement("hass-datapoints-list-card");
          list.setConfig(listConfig);
          content.querySelector("#list-host").appendChild(list);
          this._listEl = list;
        } else {
          this._listEl = null;
        }
        const resizablePanes = content.querySelector("#content-resizable-panes");
        this._contentSplitterEl = resizablePanes;
        if (resizablePanes) {
          resizablePanes.ratio = this._contentSplitRatio;
          resizablePanes.min = 0.2;
          resizablePanes.max = 0.8;
          resizablePanes.addEventListener("dp-panes-resize", (ev) => {
            this._contentSplitRatio = ev.detail.ratio;
            if (ev.detail.committed) {
              this._saveSessionState();
              window.requestAnimationFrame(() => this._syncRangeControl());
            }
          });
        }
        this._chartEl = chart;
        this._historyChartMol = historyChartMol;
        this._contentKey = contentKey;
        this._chartConfigKey = "";
        this._listConfigKey = "";
      }
      content.classList.toggle("datapoints-hidden", !showRecordsPanel);
      const resizablePanesEl = content.querySelector("#content-resizable-panes");
      if (resizablePanesEl) {
        resizablePanesEl.secondHidden = !showRecordsPanel;
      }
      this._applyContentSplitLayout();
      this._renderComparisonTabs();
      const chartConfig = {
        entities: this._entities,
        series_settings: this._seriesRows,
        datapoint_scope: this._datapointScope,
        show_event_markers: this._showChartDatapointIcons,
        show_event_lines: this._showChartDatapointLines,
        show_tooltips: this._showChartTooltips,
        emphasize_hover_guides: this._showChartEmphasizedHoverGuides,
        show_correlated_anomalies: this._showCorrelatedAnomalies,
        delink_y_axis: this._delinkChartYAxis,
        split_view: this._splitChartView,
        show_data_gaps: this._showDataGaps,
        data_gap_threshold: this._dataGapThreshold,
        hours_to_show: this._hours,
        start_time: this._startTime?.toISOString(),
        end_time: this._endTime?.toISOString(),
        zoom_start_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.start).toISOString() : null,
        zoom_end_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.end).toISOString() : null,
        message_filter: this._recordsSearchQuery || "",
        hidden_event_ids: this._hiddenEventIds,
        comparison_windows: this._getPreviewComparisonWindows(),
        preload_comparison_windows: this._getPreloadComparisonWindows(),
        comparison_preview_overlay: this._getComparisonPreviewOverlay(),
        comparison_hover_active: !!this._hoveredComparisonWindowId,
        selected_comparison_window_id: this._selectedComparisonWindowId,
        hovered_comparison_window_id: this._hoveredComparisonWindowId
      };
      if (this._chartEl) {
        const nextChartConfigKey = JSON.stringify(chartConfig);
        const molKey = this._historyChartMol?._configKey;
        const prevKey = molKey !== void 0 ? molKey : this._chartConfigKey;
        if (prevKey !== nextChartConfigKey) {
          this._chartEl.setConfig(chartConfig);
          if (this._historyChartMol) {
            this._historyChartMol._configKey = nextChartConfigKey;
          } else {
            this._chartConfigKey = nextChartConfigKey;
          }
        }
      }
      if (showRecordsPanel) {
        const listConfig = {
          entities: this._entities,
          datapoint_scope: this._datapointScope,
          hours_to_show: this._hours,
          start_time: this._startTime?.toISOString(),
          end_time: this._endTime?.toISOString(),
          zoom_start_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.start).toISOString() : null,
          zoom_end_time: this._chartZoomCommittedRange ? new Date(this._chartZoomCommittedRange.end).toISOString() : null,
          page_size: 15,
          show_entities: true,
          show_actions: true,
          show_search: true,
          hidden_event_ids: this._hiddenEventIds
        };
        const nextListConfigKey = JSON.stringify(listConfig);
        if (this._listEl && this._listConfigKey !== nextListConfigKey) {
          this._listEl.setConfig(listConfig);
          this._listConfigKey = nextListConfigKey;
        }
        if (this._listEl) this._listEl.hass = this._hass;
      } else {
        this._listConfigKey = "";
      }
      if (this._chartEl) this._chartEl.hass = this._hass;
      this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
    }
  }
  if (!customElements.get("hass-datapoints-action-card")) {
    customElements.define("hass-datapoints-action-card", HassRecordsActionCard);
  }
  if (!customElements.get("hass-datapoints-quick-card")) {
    customElements.define("hass-datapoints-quick-card", HassRecordsQuickCard);
  }
  if (!customElements.get("hass-datapoints-history-card")) {
    customElements.define("hass-datapoints-history-card", HassRecordsHistoryCard);
  }
  if (!customElements.get("hass-datapoints-statistics-card")) {
    customElements.define("hass-datapoints-statistics-card", HassRecordsStatisticsCard);
  }
  if (!customElements.get("hass-datapoints-sensor-card")) {
    customElements.define("hass-datapoints-sensor-card", HassRecordsSensorCard);
  }
  if (!customElements.get("hass-datapoints-list-card")) {
    customElements.define("hass-datapoints-list-card", HassRecordsListCard);
  }
  if (!customElements.get("hass-datapoints-history-panel")) {
    customElements.define("hass-datapoints-history-panel", HassRecordsHistoryPanel);
  }
  if (!customElements.get("hass-datapoints-dev-tool-card")) {
    customElements.define("hass-datapoints-dev-tool-card", HassRecordsDevToolCard);
  }
  if (!customElements.get("hass-datapoints-action-card-editor")) {
    customElements.define("hass-datapoints-action-card-editor", HassRecordsActionCardEditor);
  }
  if (!customElements.get("hass-datapoints-quick-card-editor")) {
    customElements.define("hass-datapoints-quick-card-editor", HassRecordsQuickCardEditor);
  }
  if (!customElements.get("hass-datapoints-history-card-editor")) {
    customElements.define("hass-datapoints-history-card-editor", HassRecordsHistoryCardEditor);
  }
  if (!customElements.get("hass-datapoints-statistics-card-editor")) {
    customElements.define("hass-datapoints-statistics-card-editor", HassRecordsStatisticsCardEditor);
  }
  if (!customElements.get("hass-datapoints-sensor-card-editor")) {
    customElements.define("hass-datapoints-sensor-card-editor", HassRecordsSensorCardEditor);
  }
  if (!customElements.get("hass-datapoints-list-card-editor")) {
    customElements.define("hass-datapoints-list-card-editor", HassRecordsListCardEditor);
  }
  window.customCards = window.customCards || [];
  const registeredTypes = new Set(window.customCards.map((c2) => c2.type));
  const cardsToAdd = [
    {
      type: "hass-datapoints-action-card",
      name: "Hass Records – Action Card",
      description: "Full form to record a custom event with message, annotation, icon, colour and entity association.",
      preview: false
    },
    {
      type: "hass-datapoints-quick-card",
      name: "Hass Records – Quick Card",
      description: "Simple one-field card to quickly record a note with a bookmark icon.",
      preview: false
    },
    {
      type: "hass-datapoints-history-card",
      name: "Hass Records – History Card",
      description: "History line chart with coloured annotation markers for recorded events.",
      preview: false
    },
    {
      type: "hass-datapoints-statistics-card",
      name: "Hass Records – Statistics Card",
      description: "Statistics line chart with coloured annotation markers for recorded events.",
      preview: false
    },
    {
      type: "hass-datapoints-sensor-card",
      name: "Hass Records – Sensor Card",
      description: "Sensor card with line chart — annotations shown as icons on the data line.",
      preview: false
    },
    {
      type: "hass-datapoints-list-card",
      name: "Hass Records – List Card",
      description: "Activity-style datagrid to browse, search, edit and delete all recorded events.",
      preview: false
    },
    {
      type: "hass-datapoints-dev-tool-card",
      name: "Hass Records – Dev Tool",
      description: "Generate demo datapoints from HA history and bulk-delete dev-flagged events.",
      preview: false
    }
  ];
  cardsToAdd.forEach((card) => {
    if (!registeredTypes.has(card.type)) {
      window.customCards.push(card);
    }
  });
  console.groupCollapsed(
    "%c hass-datapoints %c v0.3.0 loaded ",
    "color:#fff;background:#03a9f4;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
    "color:#03a9f4;background:#fff;font-weight:bold;padding:2px 6px;border:1px solid #03a9f4;border-radius:0 3px 3px 0"
  );
  console.log("Enable debug logging by setting %cwindow.__HASS_DATAPOINTS_DEV__ = true", "color:#333;background:#eee;border:1px solid #777;padding:2px 6px;border-radius:5px; font-family: Courier");
  console.groupEnd();
})();
