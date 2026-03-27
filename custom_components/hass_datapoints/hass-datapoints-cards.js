(function() {
  "use strict";
  const DOMAIN$2 = "hass_datapoints";
  const PANEL_URL_PATH = "hass-datapoints-history";
  const COLORS$2 = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899"
  ];
  const AMBER = "#ff9800";
  function entityName$2(hass, entityId) {
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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for partial-panel-resolver")), 1e4))
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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout loading tmp route")), 1e4))
      ]);
      await Promise.race([
        customElements.whenDefined("ha-panel-config"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for ha-panel-config")), 1e4))
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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout loading automation components")), 1e4))
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
        console.warn("[hass-datapoints ha] history panel not available for preload");
        return;
      }
      const resolver = document.createElement("partial-panel-resolver");
      if (typeof resolver._updateRoutes !== "function") {
        console.warn("[hass-datapoints ha] partial-panel-resolver missing _updateRoutes");
        return;
      }
      resolver.hass = { panels };
      resolver._updateRoutes();
      const load = resolver.routerOptions?.routes?.history?.load;
      if (typeof load !== "function") {
        console.warn("[hass-datapoints ha] history route loader missing");
        return;
      }
      await load();
    } catch (error) {
      console.warn("[hass-datapoints ha] history route preload failed", {
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
      customElements.whenDefined(tag).then(() => {
        return true;
      }),
      new Promise((resolve) => window.setTimeout(() => {
        console.warn("[hass-datapoints ha] component wait timed out", { tag, timeoutMs });
        resolve(false);
      }, timeoutMs))
    ]);
  }
  function ensureHaComponents$1(tags = []) {
    const componentTags = [...new Set((tags || []).filter(Boolean))];
    const loaderTags = componentTags.filter((tag) => HA_COMPONENT_LOADER_SUPPORTED_TAGS.has(tag));
    const loadPromise = Promise.resolve().then(() => typeof loadHaComponents === "function" && loaderTags.length ? Promise.resolve(loadHaComponents(loaderTags)).catch((error) => {
      console.warn("[hass-datapoints ha] loader failed", {
        loaderTags,
        message: error?.message || String(error)
      });
      return void 0;
    }) : void 0).then(() => preloadHistoryRouteComponents(componentTags));
    return loadPromise.then(() => Promise.all(componentTags.map((tag) => waitForHaComponent(tag)))).then((results) => {
      componentTags.map((tag, index) => ({
        tag,
        ready: !!results[index],
        defined: !!customElements.get(tag)
      }));
      return results;
    });
  }
  function confirmDestructiveAction$2(host, options = {}) {
    return ensureHaComponents$1(["ha-dialog"]).then(() => new Promise((resolve) => {
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
        <div class="confirm-dialog-message">${esc$3(options.message || "Are you sure you want to delete this item?")}</div>
        <div class="confirm-dialog-actions">
          <button type="button" class="confirm-dialog-button cancel">${esc$3(options.cancelLabel || "Cancel")}</button>
          <button type="button" class="confirm-dialog-button confirm">${esc$3(options.confirmLabel || "Delete")}</button>
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
  function fmtDateTime$2(iso) {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function fmtRelativeTime$1(iso) {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const diff = now - t;
    const mins = Math.floor(diff / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return fmtDateTime$2(iso);
  }
  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function esc$3(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function contrastColor$3(hex) {
    if (!hex || typeof hex !== "string") return "#fff";
    const h = hex.replace("#", "");
    if (h.length !== 6) return "#fff";
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const lin = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.179 ? "#000" : "#fff";
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
  function navigateToDataPointsHistory$2(card, target = {}, options = {}) {
    const path = buildDataPointsHistoryPath$1(target, options);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }
    window.location.assign(path);
  }
  let ChartRenderer$1 = class ChartRenderer2 {
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
    xOf(t, t0, t1) {
      return this.pad.left + (t - t0) / (t1 - t0) * this.cw;
    }
    yOf(v, vMin, vMax) {
      return this.pad.top + this.ch - (v - vMin) / (vMax - vMin) * this.ch;
    }
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    _normalizeAxes(vMinOrAxes, vMax) {
      const axisColumnWidth = ChartRenderer2.AXIS_SLOT_WIDTH;
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
    _formatAxisTick(v, unit = "") {
      const numeric = Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}k` : v.toFixed(v % 1 !== 0 ? 1 : 0);
      return numeric;
    }
    _axisLabelX(axis) {
      const columnWidth = ChartRenderer2.AXIS_SLOT_WIDTH;
      const leftAxisX = this.pad.left;
      const rightAxisX = this.pad.left + this.cw;
      if (axis.side === "right") {
        return rightAxisX + 10 + axis.slot * columnWidth;
      }
      return leftAxisX - 10 - axis.slot * columnWidth;
    }
    _formatTimeTick(t, t0, t1, tickSpanMs = null) {
      const value = new Date(t);
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
      for (const v of primaryAxis.ticks || []) {
        const y = this.yOf(v, primaryAxis.min, primaryAxis.max);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + this.cw, y);
        ctx.stroke();
        if (!fixedAxisOverlay) {
          ctx.fillStyle = axisLabelColor(primaryAxis);
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(this._formatAxisTick(v, primaryAxis.unit), this._axisLabelX(primaryAxis), y);
        }
      }
      if (!fixedAxisOverlay) {
        for (const axis of axes.slice(1)) {
          for (const v of axis.ticks || []) {
            const y = this.yOf(v, axis.min, axis.max);
            ctx.fillStyle = axisLabelColor(axis);
            ctx.textAlign = axis.side === "right" ? "left" : "right";
            ctx.textBaseline = "middle";
            ctx.fillText(this._formatAxisTick(v, axis.unit), this._axisLabelX(axis), y);
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
      for (const t of timeTicks) {
        const x = this.xOf(t, t0, t1);
        const label = this._formatTimeTick(t, t0, t1, tickSpanMs);
        ctx.strokeStyle = "rgba(128,128,128,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + this.ch);
        ctx.stroke();
        if (!hideTimeLabels) {
          ctx.fillStyle = labelColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const labelWidth = ctx.measureText(label).width;
          const labelX = Math.min(
            pad.left + this.cw - labelWidth / 2,
            Math.max(pad.left + labelWidth / 2, x)
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
        for (const [t, v] of points) {
          const x = this.xOf(t, t0, t1);
          const y = this.yOf(v, vMin, vMax);
          if (first2) {
            ctx.moveTo(x, pad.top + this.ch);
            ctx.lineTo(x, y);
            first2 = false;
          } else {
            ctx.lineTo(x, y);
          }
          lastX = x;
        }
        ctx.lineTo(lastX, pad.top + this.ch);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(color, fillAlpha);
        ctx.fill();
      }
      ctx.beginPath();
      let first = true;
      for (const [t, v] of points) {
        const x = this.xOf(t, t0, t1);
        const y = this.yOf(v, vMin, vMax);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
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
      const xs = points.map(([t]) => this.xOf(t, t0, t1));
      let minGap = this.cw / Math.max(points.length, 1);
      for (let i = 1; i < xs.length; i++) {
        minGap = Math.min(minGap, xs[i] - xs[i - 1]);
      }
      const barWidth = Math.max(3, Math.min(28, minGap * widthFactor));
      ctx.save();
      ctx.fillStyle = hexToRgba(color, fillAlpha);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const [, v] = points[i];
        const x = xs[i];
        const y = this.yOf(v, vMin, vMax);
        const top = Math.min(y, baselineY);
        const height = Math.max(1, Math.abs(baselineY - y));
        const left = x - barWidth / 2;
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
        const t = new Date(event.timestamp).getTime();
        if (t < t0 || t > t1) continue;
        const x = this.xOf(t, t0, t1);
        const color = event.color || "#03a9f4";
        if (showLines) {
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(x, pad.top + 8);
          ctx.lineTo(x, pad.top + this.ch);
          ctx.stroke();
          ctx.restore();
        }
        if (showMarkers) {
          const d = 5;
          ctx.save();
          ctx.fillStyle = color;
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, pad.top - d);
          ctx.lineTo(x + d, pad.top);
          ctx.lineTo(x, pad.top + d);
          ctx.lineTo(x - d, pad.top);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        hits.push({ event, x, y: pad.top });
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
        const t = new Date(event.timestamp).getTime();
        if (t < t0 || t > t1) continue;
        const x = this.xOf(t, t0, t1);
        const value = this._interpolateValue(firstPts, t);
        if (value === null) continue;
        const y = this.yOf(value, vMin, vMax);
        const color = event.color || "#03a9f4";
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(x, pad.top + this.ch);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        hits.push({ event, x, y, value });
      }
      return hits;
    }
    /**
     * Interpolate the Y pixel position on a data series at a given timestamp.
     * Uses linear interpolation between surrounding data points.
     */
    _interpolateY(seriesPoints, t, t0, t1, vMin, vMax) {
      if (!seriesPoints.length) return null;
      if (t <= seriesPoints[0][0]) return this.yOf(seriesPoints[0][1], vMin, vMax);
      if (t >= seriesPoints[seriesPoints.length - 1][0])
        return this.yOf(seriesPoints[seriesPoints.length - 1][1], vMin, vMax);
      for (let i = 0; i < seriesPoints.length - 1; i++) {
        const [t1p, v1p] = seriesPoints[i];
        const [t2p, v2p] = seriesPoints[i + 1];
        if (t >= t1p && t <= t2p) {
          const frac = (t - t1p) / (t2p - t1p);
          const v = v1p + frac * (v2p - v1p);
          return this.yOf(v, vMin, vMax);
        }
      }
      return null;
    }
    _interpolateValue(seriesPoints, t) {
      if (!seriesPoints.length) return null;
      if (t < seriesPoints[0][0]) return null;
      if (t > seriesPoints[seriesPoints.length - 1][0]) return null;
      if (t === seriesPoints[0][0]) return seriesPoints[0][1];
      if (t === seriesPoints[seriesPoints.length - 1][0]) {
        return seriesPoints[seriesPoints.length - 1][1];
      }
      for (let i = 0; i < seriesPoints.length - 1; i++) {
        const [t1p, v1p] = seriesPoints[i];
        const [t2p, v2p] = seriesPoints[i + 1];
        if (t >= t1p && t <= t2p) {
          const frac = (t - t1p) / (t2p - t1p);
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
        const t = new Date(event.timestamp).getTime();
        if (t < t0 || t > t1) continue;
        const x = this.xOf(t, t0, t1);
        const value = this._interpolateValue(firstPts, t);
        if (value === null) continue;
        const y = this.yOf(value, vMin, vMax);
        const color = event.color || "#03a9f4";
        const r = 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        hits.push({ event, x, y, value });
      }
      return hits;
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
      const h = 7;
      const w = 3;
      const gap = 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, this.cw, this.ch);
      ctx.clip();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < boundaryPoints.length; i++) {
        const [t, v] = boundaryPoints[i];
        const x = this.xOf(t, t0, t1);
        const y = this.yOf(v, vMin, vMax);
        const dir = i % 2 === 0 ? 1 : -1;
        for (let d = -gap; d <= gap; d += gap * 2) {
          ctx.beginPath();
          ctx.moveTo(x + d - w * dir, y - h);
          ctx.lineTo(x + d + w * dir, y + h);
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
  };
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
      ${title ? `<div class="card-header">${esc$3(title)}</div>` : ""}
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
  function setupCanvas$1(canvas, container, cssHeight, cssWidth = null) {
    const dpr = window.devicePixelRatio || 1;
    const styles = getComputedStyle(container);
    const paddingX = (Number.parseFloat(styles.paddingLeft || "0") || 0) + (Number.parseFloat(styles.paddingRight || "0") || 0);
    const paddingY = (Number.parseFloat(styles.paddingTop || "0") || 0) + (Number.parseFloat(styles.paddingBottom || "0") || 0);
    const measuredWidth = cssWidth ?? (container.clientWidth || 360);
    const w = Math.max(1, Math.round(measuredWidth - paddingX));
    const requestedHeight = cssHeight ?? container.clientHeight ?? 220;
    const h = Math.max(120, Math.round(requestedHeight - paddingY));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext("2d").scale(dpr, dpr);
    return { w, h };
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
    const axisSlotWidth = ChartRenderer$1.AXIS_SLOT_WIDTH;
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
      return `color:${esc$3(axis.color)};`;
    };
    const buildAxisMarkup = (axis) => {
      const labels = (axis.ticks || []).map((tick) => {
        const y = renderer.yOf(tick, axis.min, axis.max);
        return `<div class="chart-axis-label" style="top:${Math.round(y) + 1}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc$3(renderer._formatAxisTick(tick, axis.unit))}</div>`;
      }).join("");
      const unit = axis.unit ? `<div class="chart-axis-unit" style="top:${Math.max(0, renderer.pad.top - 18)}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc$3(axis.unit)}</div>` : "";
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
    return fmtDateTime$2(new Date(timeMs).toISOString());
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
    const peakPoint = points.reduce((peak, p) => !peak || Math.abs(p.residual) > Math.abs(peak.residual) ? p : peak, null);
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
    const regionsArray = Array.isArray(regions) ? regions : regions ? [regions] : [];
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
Confirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m) => ANOMALY_METHOD_LABELS[m] || m).join(", ")}.` : "";
      return {
        title,
        description: section.description + confirmedNote,
        alert: `Alert: ${section.alert}`,
        instruction
      };
    }
    const description = sections.map((s) => `${s.methodLabel}:
${s.description}`).join("\n\n");
    const alert = sections.map((s) => `${s.methodLabel}: ${s.alert}`).join("\n");
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
    const valueMarkup = hasValue ? `<div class="tt-value">${esc$3(formatTooltipValue(event.chart_value, event.chart_unit))}</div>` : "";
    const message = event?.message || "Data point";
    const annotation = event?.annotation && event.annotation !== event.message ? event.annotation : "";
    const relatedMarkup = buildTooltipRelatedChips(card?._hass, event);
    tooltip.innerHTML = `
    <div class="tt-time">${esc$3(fmtDateTime$2(event.timestamp))}</div>
    ${valueMarkup}
    <div class="tt-message-row">
      <span class="tt-dot" style="background:${esc$3(event?.color || "#03a9f4")}"></span>
      <span class="tt-message">${esc$3(message)}</span>
    </div>
    <div class="tt-annotation" style="display:${annotation ? "block" : "none"}">${esc$3(annotation)}</div>
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
  function showTooltip$1(card, canvas, renderer, event, clientX, clientY) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    const ttTime = card.shadowRoot.getElementById("tt-time");
    const ttValue = card.shadowRoot.getElementById("tt-value");
    const ttSeries = card.shadowRoot.getElementById("tt-series");
    const ttMessageRow = card.shadowRoot.getElementById("tt-message-row");
    const ttDot = card.shadowRoot.getElementById("tt-dot");
    const ttMsg = card.shadowRoot.getElementById("tt-message");
    const ttAnn = card.shadowRoot.getElementById("tt-annotation");
    const ttEntities = card.shadowRoot.getElementById("tt-entities");
    ttTime.textContent = fmtDateTime$2(event.timestamp);
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
  function hideTooltip$1(card) {
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
    ttTime.textContent = rangeStartMs === rangeEndMs ? fmtDateTime$2(new Date(hover.timeMs).toISOString()) : `${fmtDateTime$2(new Date(rangeStartMs).toISOString())} - ${fmtDateTime$2(new Date(rangeEndMs).toISOString())}`;
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
            ${entry.grouped === true && entry.rawVisible === true ? "" : `<span class="tt-dot" style="background:${esc$3(entry.color || "#03a9f4")}"></span>`}
            <span class="tt-series-label">${esc$3(
          entry.comparison === true ? entry.grouped === true ? entry.windowLabel || "Date window" : `${entry.windowLabel || "Date window"}: ${entry.label || ""}` : entry.trend === true ? entry.grouped === true && entry.rawVisible === true ? "Trend" : `Trend: ${entry.baseLabel || entry.label || ""}` : entry.rate === true ? entry.grouped === true && entry.rawVisible === true ? "Rate" : `Rate: ${entry.baseLabel || entry.label || ""}` : entry.delta === true ? entry.grouped === true && entry.rawVisible === true ? "Delta" : `Delta: ${entry.baseLabel || entry.label || ""}` : entry.summary === true ? entry.grouped === true && entry.rawVisible === true ? String(entry.summaryType || "").toUpperCase() : `${String(entry.summaryType || "").toUpperCase()}: ${entry.baseLabel || entry.label || ""}` : entry.threshold === true ? entry.grouped === true && entry.rawVisible === true ? "Threshold" : `Threshold: ${entry.baseLabel || entry.label || ""}` : entry.label || ""
        )}</span>
          </div>
          <span class="tt-series-value">${esc$3(formatTooltipDisplayValue(entry.value, entry.unit))}</span>
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
        label: entityName$2(hass, id)
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
    <span class="tt-entity-chip" title="${esc$3(chip.label)}">
      <ha-icon icon="${esc$3(chip.icon)}"></ha-icon>
      <span>${esc$3(chip.label)}</span>
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
        style="top:${entry.y}px;color:${esc$3(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
      ></span>
    `).join("")}
    ${crosshairValues.filter((entry) => entry.hasValue !== false).map((entry) => `
    <span
      class="crosshair-point"
      style="left:${entry.x}px;top:${entry.y}px;background:${esc$3(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
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
    hideTooltip$1(card);
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
      const x = renderer.xOf(timeMs, t0, t1);
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
          x,
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
          x,
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
          x,
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
          x,
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
          x,
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
        x,
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
        hideTooltip$1(card);
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
  function attachTooltipBehaviour$1(card, canvas, renderer, events, t0, t1) {
    function findNearest(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const msPerPx = (t1 - t0) / renderer.cw;
      const threshold = 14 * msPerPx;
      const tAtX = t0 + (x - renderer.pad.left) / renderer.cw * (t1 - t0);
      let best = null;
      let bestDist = Infinity;
      for (const ev of events) {
        const t = new Date(ev.timestamp).getTime();
        if (t < t0 || t > t1) continue;
        const d = Math.abs(t - tAtX);
        if (d < threshold && d < bestDist) {
          bestDist = d;
          best = ev;
        }
      }
      return best;
    }
    canvas.addEventListener("mousemove", (e) => {
      const best = findNearest(e.clientX);
      if (best) {
        showTooltip$1(card, canvas, renderer, best, e.clientX, e.clientY);
        canvas.style.cursor = "pointer";
      } else {
        hideTooltip$1(card);
        canvas.style.cursor = "default";
      }
    });
    canvas.addEventListener("mouseleave", () => hideTooltip$1(card));
    let touchTimer = null;
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip$1(card, canvas, renderer, best, touch.clientX, touch.clientY);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip$1(card), 3e3);
      } else {
        hideTooltip$1(card);
      }
    }, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip$1(card, canvas, renderer, best, touch.clientX, touch.clientY);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip$1(card), 3e3);
      } else {
        hideTooltip$1(card);
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
  async function fetchEvents$3(hass, startTime, endTime, entityIds) {
    try {
      const normalizedEntityIds = normalizeCacheIdList(entityIds);
      const cacheKey = JSON.stringify({
        type: `${DOMAIN$2}/events`,
        start_time: startTime,
        end_time: endTime,
        entity_ids: normalizedEntityIds
      });
      return await withStableRangeCache(cacheKey, endTime, async () => {
        const msg = {
          type: `${DOMAIN$2}/events`,
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
      console.warn("[hass-datapoints] fetchEvents failed:", err);
      return [];
    }
  }
  function invalidateEventsCache() {
    return clearStableRangeCacheMatching((key) => {
      if (typeof key !== "string") {
        return false;
      }
      return key.includes(`"type":"${DOMAIN$2}/events"`);
    });
  }
  async function fetchEventBounds$1(hass) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: `${DOMAIN$2}/events_bounds`
      });
      return {
        start: result?.start_time || null,
        end: result?.end_time || null
      };
    } catch (err) {
      console.warn("[hass-datapoints] fetchEventBounds failed:", err);
      return { start: null, end: null };
    }
  }
  async function deleteEvent$1(hass, eventId) {
    const result = await hass.connection.sendMessagePromise({
      type: `${DOMAIN$2}/events/delete`,
      event_id: eventId
    });
    invalidateEventsCache();
    window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    return result;
  }
  async function updateEvent$1(hass, eventId, fields) {
    const result = await hass.connection.sendMessagePromise({
      type: `${DOMAIN$2}/events/update`,
      event_id: eventId,
      ...fields
    });
    invalidateEventsCache();
    window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
    return result;
  }
  async function fetchUserData$1(hass, key, defaultValue = null) {
    try {
      const result = await hass.connection.sendMessagePromise({
        type: "frontend/get_user_data",
        key
      });
      return result?.value ?? defaultValue;
    } catch (err) {
      console.warn("[hass-datapoints] fetchUserData failed:", err);
      return defaultValue;
    }
  }
  async function saveUserData$1(hass, key, value) {
    try {
      await hass.connection.sendMessagePromise({
        type: "frontend/set_user_data",
        key,
        value
      });
    } catch (err) {
      console.warn("[hass-datapoints] saveUserData failed:", err);
    }
  }
  function parseDateValue$1(value) {
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
    const start = parseDateValue$1(startValue)?.getTime();
    const end = parseDateValue$1(endValue)?.getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : null;
  }
  function normalizeEntityIds$1(value) {
    if (!value) {
      return [];
    }
    return (Array.isArray(value) ? value : [value]).map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean);
  }
  function normalizeTargetValue$1(targetValue) {
    if (!targetValue) {
      return {};
    }
    if (Array.isArray(targetValue)) {
      return { entity_id: normalizeEntityIds$1(targetValue) };
    }
    if (typeof targetValue === "string") {
      return targetValue ? { entity_id: [targetValue] } : {};
    }
    const normalized = {
      entity_id: [
        ...normalizeEntityIds$1(targetValue.entity_id),
        ...normalizeEntityIds$1(targetValue.entity_ids),
        ...normalizeEntityIds$1(targetValue.entity),
        ...normalizeEntityIds$1(targetValue.entities)
      ],
      device_id: normalizeEntityIds$1(targetValue.device_id),
      area_id: normalizeEntityIds$1(targetValue.area_id),
      label_id: normalizeEntityIds$1(targetValue.label_id)
    };
    return Object.fromEntries(
      Object.entries(normalized).filter(([, entries]) => entries.length)
    );
  }
  function normalizeTargetSelection(targetValue) {
    const normalized = normalizeTargetValue$1(targetValue);
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
  function resolveEntityIdsFromTarget$1(hass, targetValue) {
    const target = normalizeTargetSelection(targetValue);
    const resolved = new Set(normalizeEntityIds$1(target.entity_id));
    const entityRegistry = hass?.entities || {};
    const selectedDevices = new Set(normalizeEntityIds$1(target.device_id));
    const selectedAreas = new Set(normalizeEntityIds$1(target.area_id));
    const selectedLabels = new Set(normalizeEntityIds$1(target.label_id));
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
  function panelConfigTarget$1(panelCfg) {
    if (!panelCfg) {
      return {};
    }
    if (panelCfg.target) {
      return normalizeTargetValue$1(panelCfg.target);
    }
    return normalizeTargetValue$1({
      entity_id: panelCfg.entities?.length ? panelCfg.entities : panelCfg.entity
    });
  }
  function normalizeHistorySeriesAnalysis$1(analysis) {
    const source = analysis && typeof analysis === "object" ? analysis : {};
    return {
      expanded: source.expanded === true,
      show_trend_lines: source.show_trend_lines === true,
      trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",
      trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",
      show_trend_crosshairs: source.show_trend_crosshairs === true,
      show_summary_stats: source.show_summary_stats === true,
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
          return source.anomaly_methods.filter((m) => VALID.includes(m));
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
  function historySeriesRowHasConfiguredAnalysis$1(row) {
    const analysis = normalizeHistorySeriesAnalysis$1(row?.analysis);
    return analysis.show_trend_lines || analysis.show_summary_stats || analysis.show_rate_of_change || analysis.show_threshold_analysis || analysis.show_anomalies || analysis.show_delta_analysis || analysis.hide_source_series;
  }
  function normalizeHistorySeriesRows$1(rows) {
    if (!Array.isArray(rows)) return [];
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    rows.forEach((row, index) => {
      const entityId = typeof row?.entity_id === "string" ? row.entity_id.trim() : "";
      if (!entityId || seen.has(entityId)) return;
      seen.add(entityId);
      normalized.push({
        entity_id: entityId,
        color: typeof row?.color === "string" && /^#[0-9a-f]{6}$/i.test(row.color) ? row.color : COLORS$2[index % COLORS$2.length],
        visible: row?.visible !== false,
        analysis: normalizeHistorySeriesAnalysis$1(row?.analysis)
      });
    });
    return normalized;
  }
  function buildHistorySeriesRows$1(entityIds, previousRows = []) {
    const previousMap = new Map(normalizeHistorySeriesRows$1(previousRows).map((row) => [row.entity_id, row]));
    return normalizeEntityIds$1(entityIds).map((entityId, index) => {
      const existing = previousMap.get(entityId);
      if (existing) return existing;
      return {
        entity_id: entityId,
        color: COLORS$2[index % COLORS$2.length],
        visible: true,
        analysis: normalizeHistorySeriesAnalysis$1(null)
      };
    });
  }
  function slugifySeriesName$1(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function parseSeriesColorsParam$1(value) {
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
    const sheetXml = sheets.map((sheet, index) => {
      return `<sheet name="${escapeXml(sanitizeWorksheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetXml}</sheets>
</workbook>`;
  }
  function createWorkbookRelsXml(sheets) {
    const relXml = sheets.map((_, index) => {
      return `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`;
    }).join("");
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
    const overrides = sheets.map((_, index) => {
      return `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    }).join("");
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
      const name = entityName$2(hass, entityId) || entityId;
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
  async function downloadHistorySpreadsheet$1({
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
      fetchEvents$3(
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
  function makeDateWindowId$1(label, existingIds = /* @__PURE__ */ new Set()) {
    const base = slugifySeriesName$1(label) || "date-window";
    let candidate = base;
    let suffix = 2;
    while (existingIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
  function normalizeDateWindows$1(windows) {
    if (!Array.isArray(windows)) {
      return [];
    }
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    windows.forEach((window2, index) => {
      const label = String(window2?.label || window2?.name || "").trim();
      const start = parseDateValue$1(window2?.start_time || window2?.start);
      const end = parseDateValue$1(window2?.end_time || window2?.end);
      if (!label || !start || !end || start >= end) {
        return;
      }
      const id = String(window2?.id || "").trim() || makeDateWindowId$1(`${label}-${index + 1}`, seen);
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
  function parseDateWindowsParam$1(value) {
    if (!value || typeof value !== "string") {
      return [];
    }
    return normalizeDateWindows$1(value.split("|").map((entry) => {
      const [rawId, rawLabel, rawStart, rawEnd] = String(entry).split("~");
      return {
        id: decodeURIComponent(rawId || ""),
        label: decodeURIComponent(rawLabel || ""),
        start_time: decodeURIComponent(rawStart || ""),
        end_time: decodeURIComponent(rawEnd || "")
      };
    }));
  }
  function serializeDateWindowsParam$1(windows) {
    const normalized = normalizeDateWindows$1(windows);
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
  const PANEL_HISTORY_PREFERENCES_KEY$1 = `${DOMAIN$2}:panel_history_preferences`;
  const PANEL_HISTORY_SESSION_KEY = `${DOMAIN$2}:panel_history_session`;
  function readHistoryPageSessionState$1() {
    try {
      const raw = window.sessionStorage?.getItem(PANEL_HISTORY_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_err) {
      return null;
    }
  }
  function buildHistoryPageSessionState(source) {
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
      show_data_gaps: source._showDataGaps,
      data_gap_threshold: source._dataGapThreshold,
      content_split_ratio: source._contentSplitRatio,
      start_time: source._startTime?.toISOString() || null,
      end_time: source._endTime?.toISOString() || null,
      zoom_start_time: source._chartZoomCommittedRange ? new Date(source._chartZoomCommittedRange.start).toISOString() : null,
      zoom_end_time: source._chartZoomCommittedRange ? new Date(source._chartZoomCommittedRange.end).toISOString() : null,
      date_windows: normalizeDateWindows$1(source._comparisonWindows),
      hours: source._hours,
      sidebar_collapsed: source._sidebarCollapsed
    };
  }
  function writeHistoryPageSessionState$1(source) {
    try {
      window.sessionStorage?.setItem(PANEL_HISTORY_SESSION_KEY, JSON.stringify(buildHistoryPageSessionState(source)));
    } catch (_err) {
    }
  }
  function normalizeHistoryPagePreferences$1(preferences, options = {}) {
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
      normalized.comparisonWindows = normalizeDateWindows$1(preferences.date_windows);
    } else {
      shouldPersistDefaults = true;
    }
    normalized.shouldPersistDefaults = shouldPersistDefaults;
    return normalized;
  }
  function buildHistoryPagePreferencesPayload$1(source) {
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
      date_windows: normalizeDateWindows$1(source._comparisonWindows)
    };
  }
  const SECOND_MS$1 = 1e3;
  const MINUTE_MS$1 = 60 * SECOND_MS$1;
  const HOUR_MS$1 = 60 * MINUTE_MS$1;
  const DAY_MS$1 = 24 * HOUR_MS$1;
  const WEEK_MS$1 = 7 * DAY_MS$1;
  const RANGE_SLIDER_MIN_SPAN_MS$1 = 15 * 60 * 1e3;
  const RANGE_SLIDER_WINDOW_MS$1 = 30 * DAY_MS$1;
  const RANGE_AUTO_ZOOM_DEBOUNCE_MS$1 = 3e3;
  const RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO$1 = 0.6;
  const RANGE_FUTURE_BUFFER_YEARS$1 = 1;
  const RANGE_LABEL_MIN_GAP_PX$1 = 10;
  const RANGE_CONTEXT_LABEL_MIN_GAP_PX$1 = 14;
  const RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX$1 = 48;
  const RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX$1 = 28;
  const RANGE_ZOOM_OPTIONS$1 = [
    { value: "auto", label: "Auto" },
    { value: "quarterly", label: "Quarterly" },
    { value: "month_compressed", label: "Month Compressed" },
    { value: "month_short", label: "Month Short" },
    { value: "month_expanded", label: "Month Expanded" },
    { value: "week_compressed", label: "Week Compressed" },
    { value: "week_expanded", label: "Week Expanded" },
    { value: "day", label: "Day" }
  ];
  const RANGE_SNAP_OPTIONS$1 = [
    { value: "auto", label: "Auto" },
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
    { value: "hour", label: "Hour" },
    { value: "minute", label: "Minute" },
    { value: "second", label: "Second" }
  ];
  const RANGE_ZOOM_CONFIGS$1 = {
    quarterly: {
      baselineMs: 730 * DAY_MS$1,
      boundsUnit: "month",
      contextUnit: "year",
      detailUnit: "month",
      majorUnit: "quarter",
      labelUnit: "quarter",
      minorUnit: "month",
      pixelsPerUnit: 96
    },
    month_compressed: {
      baselineMs: 365 * DAY_MS$1,
      boundsUnit: "month",
      contextUnit: "year",
      detailUnit: "week",
      majorUnit: "month",
      labelUnit: "month",
      minorUnit: "month",
      pixelsPerUnit: 76
    },
    month_short: {
      baselineMs: 180 * DAY_MS$1,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 54
    },
    month_expanded: {
      baselineMs: 90 * DAY_MS$1,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 72
    },
    week_compressed: {
      baselineMs: 56 * DAY_MS$1,
      boundsUnit: "week",
      contextUnit: "month",
      detailUnit: "day",
      majorUnit: "week",
      labelUnit: "week",
      minorUnit: "week",
      pixelsPerUnit: 120
    },
    week_expanded: {
      baselineMs: 28 * DAY_MS$1,
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
      baselineMs: 48 * HOUR_MS$1,
      boundsUnit: "hour",
      contextUnit: "day",
      majorUnit: "hour",
      labelUnit: "hour",
      minorUnit: "hour",
      pixelsPerUnit: 9
    }
  };
  function extractRangeValue$1(source) {
    if (!source) {
      return { start: null, end: null };
    }
    const detail = source.detail || {};
    const value = detail.value || source.value || source.target?.value || {};
    return {
      start: parseDateValue$1(detail.startDate || value.startDate || source.startDate || source.target?.startDate),
      end: parseDateValue$1(detail.endDate || value.endDate || source.endDate || source.target?.endDate)
    };
  }
  function formatRangeDateTime$1(value) {
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
  function formatRangeDuration(start, end) {
    if (!(start instanceof Date) || !(end instanceof Date)) {
      return "--";
    }
    const totalMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 6e4));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor(totalMinutes % 1440 / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) {
      parts.push(`${days}d`);
    }
    if (hours) {
      parts.push(`${hours}h`);
    }
    if (minutes || !parts.length) {
      parts.push(`${minutes}m`);
    }
    return parts.join(" ");
  }
  function clampNumber$1(value, min, max) {
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
  function formatRangeSummary$1(start, end) {
    return `${formatRangeDateTime$1(start)} - ${formatRangeDateTime$1(end)} (${formatRangeDuration(start, end)})`;
  }
  function getWeekOfYear(value) {
    const date = new Date(value.getTime());
    date.setHours(0, 0, 0, 0);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - day);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS$1 + 1) / 7);
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
  function formatScaleLabel$1(value, unit, zoomLevel = "") {
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
  function formatContextLabel$1(value, unit) {
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
  function formatPeriodSelectionLabel$1(value, unit) {
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
  function startOfUnit$1(value, unit) {
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
  function endOfUnit$1(value, unit) {
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
  function addUnit$1(value, unit, amount = 1) {
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
  function snapDateToUnit$1(value, unit) {
    const start = startOfUnit$1(value, unit);
    const end = endOfUnit$1(value, unit);
    return value.getTime() - start.getTime() < end.getTime() - value.getTime() ? start : end;
  }
  const shared = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    AMBER,
    CHART_STYLE,
    COLORS: COLORS$2,
    ChartRenderer: ChartRenderer$1,
    DATA_RANGE_CACHE_LIVE_EDGE_MS,
    DATA_RANGE_CACHE_TTL_MS,
    DAY_MS: DAY_MS$1,
    DOMAIN: DOMAIN$2,
    HOUR_MS: HOUR_MS$1,
    MINUTE_MS: MINUTE_MS$1,
    PANEL_HISTORY_PREFERENCES_KEY: PANEL_HISTORY_PREFERENCES_KEY$1,
    PANEL_HISTORY_SESSION_KEY,
    PANEL_URL_PATH,
    RANGE_AUTO_ZOOM_DEBOUNCE_MS: RANGE_AUTO_ZOOM_DEBOUNCE_MS$1,
    RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO: RANGE_AUTO_ZOOM_SELECTION_PADDING_RATIO$1,
    RANGE_CONTEXT_LABEL_MIN_GAP_PX: RANGE_CONTEXT_LABEL_MIN_GAP_PX$1,
    RANGE_FUTURE_BUFFER_YEARS: RANGE_FUTURE_BUFFER_YEARS$1,
    RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX: RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX$1,
    RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX: RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX$1,
    RANGE_LABEL_MIN_GAP_PX: RANGE_LABEL_MIN_GAP_PX$1,
    RANGE_SLIDER_MIN_SPAN_MS: RANGE_SLIDER_MIN_SPAN_MS$1,
    RANGE_SLIDER_WINDOW_MS: RANGE_SLIDER_WINDOW_MS$1,
    RANGE_SNAP_OPTIONS: RANGE_SNAP_OPTIONS$1,
    RANGE_ZOOM_CONFIGS: RANGE_ZOOM_CONFIGS$1,
    RANGE_ZOOM_OPTIONS: RANGE_ZOOM_OPTIONS$1,
    SECOND_MS: SECOND_MS$1,
    WEEK_MS: WEEK_MS$1,
    addUnit: addUnit$1,
    areaIcon: areaIcon$1,
    areaName: areaName$1,
    attachLineChartHover,
    attachLineChartRangeZoom,
    attachTooltipBehaviour: attachTooltipBehaviour$1,
    buildChartCardShell,
    buildDataPointsHistoryPath: buildDataPointsHistoryPath$1,
    buildHistoryPagePreferencesPayload: buildHistoryPagePreferencesPayload$1,
    buildHistoryPageSessionState,
    buildHistorySeriesRows: buildHistorySeriesRows$1,
    buildTooltipRelatedChips,
    clampChartValue,
    clampNumber: clampNumber$1,
    clearStableRangeCacheMatching,
    confirmDestructiveAction: confirmDestructiveAction$2,
    contrastColor: contrastColor$3,
    createChartZoomRange,
    createHiddenEventIdSet,
    createHiddenSeriesSet,
    deleteEvent: deleteEvent$1,
    deviceIcon: deviceIcon$1,
    deviceName: deviceName$1,
    dispatchLineChartHover,
    downloadHistorySpreadsheet: downloadHistorySpreadsheet$1,
    endOfLocalDay,
    endOfLocalHour,
    endOfLocalMinute,
    endOfLocalMonth,
    endOfLocalQuarter,
    endOfLocalSecond,
    endOfLocalWeek,
    endOfUnit: endOfUnit$1,
    ensureHaComponents: ensureHaComponents$1,
    entityIcon: entityIcon$1,
    entityName: entityName$2,
    esc: esc$3,
    extractRangeValue: extractRangeValue$1,
    fetchEventBounds: fetchEventBounds$1,
    fetchEvents: fetchEvents$3,
    fetchHistoryDuringPeriod,
    fetchStatisticsDuringPeriod,
    fetchUserData: fetchUserData$1,
    fmtDateTime: fmtDateTime$2,
    fmtRelativeTime: fmtRelativeTime$1,
    fmtTime,
    formatContextLabel: formatContextLabel$1,
    formatDayLabel,
    formatHourLabel,
    formatMonthLabel,
    formatPeriodSelectionLabel: formatPeriodSelectionLabel$1,
    formatQuarterLabel,
    formatRangeDateTime: formatRangeDateTime$1,
    formatRangeDuration,
    formatRangeSummary: formatRangeSummary$1,
    formatRangeTick,
    formatScaleLabel: formatScaleLabel$1,
    formatTooltipDisplayValue,
    formatTooltipValue,
    formatYearLabel,
    getWeekLabel,
    getWeekOfYear,
    hexToRgba,
    hideLineChartHover,
    hideTooltip: hideTooltip$1,
    historySeriesRowHasConfiguredAnalysis: historySeriesRowHasConfiguredAnalysis$1,
    invalidateEventsCache,
    labelIcon: labelIcon$1,
    labelName: labelName$1,
    makeDateWindowId: makeDateWindowId$1,
    mergeTargetSelections,
    navigateToDataPointsHistory: navigateToDataPointsHistory$2,
    normalizeCacheIdList,
    normalizeDateWindows: normalizeDateWindows$1,
    normalizeEntityIds: normalizeEntityIds$1,
    normalizeHistoryPagePreferences: normalizeHistoryPagePreferences$1,
    normalizeHistorySeriesAnalysis: normalizeHistorySeriesAnalysis$1,
    normalizeHistorySeriesRows: normalizeHistorySeriesRows$1,
    normalizeTargetSelection,
    normalizeTargetValue: normalizeTargetValue$1,
    panelConfigTarget: panelConfigTarget$1,
    parseDateValue: parseDateValue$1,
    parseDateWindowsParam: parseDateWindowsParam$1,
    parseSeriesColorsParam: parseSeriesColorsParam$1,
    positionTooltip,
    readHistoryPageSessionState: readHistoryPageSessionState$1,
    renderChartAxisHoverDots,
    renderChartAxisOverlays,
    resolveChartLabelColor,
    resolveEntityIdsFromTarget: resolveEntityIdsFromTarget$1,
    saveUserData: saveUserData$1,
    serializeDateWindowsParam: serializeDateWindowsParam$1,
    setupCanvas: setupCanvas$1,
    shouldUseStableRangeCache,
    showLineChartCrosshair,
    showLineChartTooltip,
    showTooltip: showTooltip$1,
    slugifySeriesName: slugifySeriesName$1,
    snapDateToUnit: snapDateToUnit$1,
    startOfLocalDay,
    startOfLocalHour,
    startOfLocalMinute,
    startOfLocalMonth,
    startOfLocalQuarter,
    startOfLocalSecond,
    startOfLocalWeek,
    startOfLocalYear,
    startOfUnit: startOfUnit$1,
    updateEvent: updateEvent$1,
    waitForHaComponent,
    withStableRangeCache,
    writeHistoryPageSessionState: writeHistoryPageSessionState$1
  }, Symbol.toStringTag, { value: "Module" }));
  class HistoryAnnotationDialogController {
    constructor(host) {
      this._host = host;
      this._dialogEl = null;
      this._panelEl = null;
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
    renderTargetChips(target) {
      const groups = [
        ...(target.entity_id || []).map((id) => ({
          type: "entity_id",
          id,
          icon: entityIcon$1(this._host._hass, id),
          name: entityName$2(this._host._hass, id)
        })),
        ...(target.device_id || []).map((id) => ({
          type: "device_id",
          id,
          icon: deviceIcon$1(this._host._hass, id),
          name: deviceName$1(this._host._hass, id)
        })),
        ...(target.area_id || []).map((id) => ({
          type: "area_id",
          id,
          icon: areaIcon$1(this._host._hass, id),
          name: areaName$1(this._host._hass, id)
        })),
        ...(target.label_id || []).map((id) => ({
          type: "label_id",
          id,
          icon: labelIcon$1(this._host._hass, id),
          name: labelName$1(this._host._hass, id)
        }))
      ];
      if (!groups.length) {
        return `
        <div id="chart-context-linked-targets" class="context-form-field">
          <label class="context-form-label">Linked targets</label>
          <div class="context-form-help">No linked targets will be associated with this data point.</div>
        </div>
      `;
      }
      return `
      <div id="chart-context-linked-targets" class="context-form-field">
        <label class="context-form-label">Linked targets</label>
        <div class="context-form-help">These targets will be associated with the new data point by default. Remove any that should not be linked.</div>
        <div class="context-chip-row">
          ${groups.map((chip) => `
            <span class="context-chip" title="${esc$3(chip.name)}">
              <ha-icon icon="${esc$3(chip.icon)}"></ha-icon>
              <span class="context-chip-text">${esc$3(chip.name)}</span>
              <button
                type="button"
                class="context-chip-remove"
                data-target-type="${esc$3(chip.type)}"
                data-target-id="${esc$3(chip.id)}"
                aria-label="Remove ${esc$3(chip.name)}"
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </span>
          `).join("")}
        </div>
      </div>
    `;
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
      const container = this._panelEl?.querySelector("#chart-context-linked-targets");
      if (container) {
        container.outerHTML = this.renderTargetChips(this._linkedTarget);
        this.bindTargetChipActions();
      }
    }
    bindTargetChipActions() {
      this._panelEl?.querySelectorAll(".context-chip-remove")?.forEach((button) => {
        button.addEventListener("click", () => {
          this.removeLinkedTarget(button.dataset.targetType, button.dataset.targetId);
        });
      });
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
        await this._host._hass.callService(DOMAIN$2, "record", payload);
        invalidateEventsCache();
        window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
        this.close();
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.hidden = false;
          feedbackEl.textContent = err?.message || "Failed to create annotation.";
        }
        console.error("[hass-datapoints history-card]", err);
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
        .context-color-preview { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--divider-color, #ccc); background: ${esc$3(defaultColor)}; flex: 0 0 auto; }
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
              ${this.renderTargetChips(this._linkedTarget)}
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
                <ha-textfield id="chart-context-date" class="context-date-input" type="datetime-local" value="${esc$3(this.formatDate(hover.timeMs))}"></ha-textfield>
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
                  <input id="chart-context-color" class="context-color-input" type="color" value="${esc$3(defaultColor)}" aria-label="Annotation color">
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
      const d = /* @__PURE__ */ new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
    // Resolve config target from `target`, or legacy `entity`/`entities`.
    // Normalises all fields to arrays (HA target selector may store single values as strings).
    _configTarget() {
      const cfg = this._config;
      const norm = (v) => !v ? [] : Array.isArray(v) ? v : [v];
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
      const t = this._configTarget();
      return !!(t.entity_id?.length || t.device_id?.length || t.area_id?.length || t.label_id?.length);
    }
    // Build read-only chips for config-set targets
    _buildConfigChips(wrap) {
      if (!this._hasConfigTarget()) return;
      const t = this._configTarget();
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
      (t.entity_id || []).forEach((id) => addChip(entityIcon$1(this._hass, id), entityName$2(this._hass, id)));
      (t.device_id || []).forEach((id) => addChip(deviceIcon$1(this._hass, id), deviceName$1(this._hass, id)));
      (t.area_id || []).forEach((id) => addChip(areaIcon$1(this._hass, id), areaName$1(this._hass, id)));
      (t.label_id || []).forEach((id) => addChip(labelIcon$1(this._hass, id), labelName$1(this._hass, id)));
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
        ${hasTitle ? `<div class="card-header">${esc$3(cfg.title)}</div>` : ""}

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

        <ha-button id="btn" raised>${esc$3(cfg.submit_label || "Record Event")}</ha-button>
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
        targetSel.addEventListener("value-changed", (e) => {
          this._userTarget = e.detail.value || {};
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
        annEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
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
    _mergeTargets(a, b) {
      const norm = (v) => !v ? [] : Array.isArray(v) ? v : [v];
      const merge = (x, y) => [.../* @__PURE__ */ new Set([...norm(x), ...norm(y)])];
      return {
        entity_id: merge(a.entity_id, b.entity_id),
        device_id: merge(a.device_id, b.device_id),
        area_id: merge(a.area_id, b.area_id),
        label_id: merge(a.label_id, b.label_id)
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
        await this._hass.callService(DOMAIN$2, "record", data);
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
      } catch (e) {
        fb.className = "feedback err";
        fb.textContent = `Error: ${e.message || "unknown error"}`;
        fb.style.display = "block";
        console.error("[hass-datapoints action-card]", e);
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
      }, `${DOMAIN$2}_event_recorded`).then((unsub) => {
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
          console.error("[hass-datapoints chart-base] load failed", err);
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
        ${cfg.title ? `<div class="card-header">${esc$3(cfg.title)}</div>` : ""}

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
      ep.addEventListener("value-changed", (e) => {
        if (this._suppressEntityChange) return;
        const val = e.detail.value;
        this._entities = Array.isArray(val) ? val : val ? [val] : [];
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
      rows.forEach((r) => {
        r.querySelector(".remove-window-btn").disabled = rows.length <= 1;
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
            selected: new Set(changes.map((_, i) => i))
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
        for (let i = 0; i < states.length; i++) {
          const s = states[i];
          const prev = i > 0 ? states[i - 1] : null;
          const cur = s.s;
          const prevVal = prev?.s ?? null;
          if (cur === "unavailable" || cur === "unknown") continue;
          if (prev && prevVal === cur) {
            if (domain !== "climate") continue;
          }
          const tsRaw = s.lc ?? s.lu;
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
            const curTemp = s.a?.temperature;
            const prevTemp = prev?.a?.temperature;
            if (curTemp != null && curTemp !== prevTemp) {
              const tu = s.a?.temperature_unit || unit || "°";
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
      changes.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
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
      return pair ? on ? pair[0] : pair[1] : on ? "on" : "off";
    }
    // ── Results rendering ──────────────────────────────────────────────────────
    _renderResults() {
      const container = this.shadowRoot.getElementById("results-list");
      const windowOrder = this._readWindowConfigs().map((w) => w.id).filter((id) => this._results.has(id));
      const remainingIds = [...this._results.keys()].filter((id) => !windowOrder.includes(id));
      const orderedIds = [...windowOrder, ...remainingIds];
      container.innerHTML = orderedIds.map((wid) => {
        const r = this._results.get(wid);
        if (!r) return "";
        const { label, startDt, hours, changes, selected } = r;
        const rangeLabel = startDt ? `from ${new Date(startDt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} · ${hours}h` : `most recent ${hours}h`;
        return `
        <div class="window-result" data-wid="${wid}">
          <div class="window-result-header">
            <span class="window-result-toggle">▼</span>
            <span class="window-result-title">
              ${esc$3(label)}
              <span class="window-result-meta">${esc$3(rangeLabel)} · ${changes.length} change${changes.length !== 1 ? "s" : ""}</span>
            </span>
            <span class="window-result-links">
              <button class="window-link" data-wid="${wid}" data-act="all">All</button>
              <button class="window-link" data-wid="${wid}" data-act="none">None</button>
            </span>
          </div>
          <div class="window-result-body">
            <div class="changes-list">
              ${changes.length === 0 ? `<div class="empty-changes">No state changes detected in this window.</div>` : changes.map((c, i) => `
                  <label class="change-item">
                    <input type="checkbox" data-wid="${wid}" data-idx="${i}" ${selected.has(i) ? "checked" : ""}>
                    <div class="change-info">
                      <div class="change-msg">${esc$3(c.message)}</div>
                      <div class="change-meta">${esc$3(fmtDateTime$2(c.timestamp))} &middot; ${esc$3(c.entity_id)}</div>
                    </div>
                  </label>`).join("")}
            </div>
          </div>
        </div>
      `;
      }).join("");
      container.querySelectorAll(".window-result-header").forEach((header) => {
        header.addEventListener("click", (e) => {
          if (e.target.closest(".window-result-links")) return;
          header.closest(".window-result").classList.toggle("collapsed");
        });
      });
      container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          const wid = parseInt(e.target.dataset.wid);
          const idx = parseInt(e.target.dataset.idx);
          const r = this._results.get(wid);
          if (!r) return;
          if (e.target.checked) r.selected.add(idx);
          else r.selected.delete(idx);
          this._updateSelectedSummary();
        });
      });
      container.querySelectorAll(".window-link").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const wid = parseInt(e.currentTarget.dataset.wid);
          const act = e.currentTarget.dataset.act;
          const r = this._results.get(wid);
          if (!r) return;
          const cbs = container.querySelectorAll(`input[data-wid="${wid}"]`);
          if (act === "all") {
            r.selected = new Set(r.changes.map((_, i) => i));
            cbs.forEach((cb) => {
              cb.checked = true;
            });
          } else {
            r.selected.clear();
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
      this._results.forEach((r) => {
        sel += r.selected.size;
        total += r.changes.length;
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
      this._results.forEach((r) => {
        [...r.selected].sort((a, b) => a - b).forEach((i) => allItems.push(r.changes[i]));
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
          await this._hass.callService(DOMAIN$2, "record", {
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
      const confirmed = await confirmDestructiveAction$2(this, {
        title: "Delete dev datapoints",
        message: `Delete all ${count} dev data point${count !== 1 ? "s" : ""}?`,
        confirmLabel: "Delete all"
      });
      if (!confirmed) return;
      const btn = this.shadowRoot.getElementById("delete-dev-btn");
      btn.disabled = true;
      try {
        const result = await this._hass.connection.sendMessagePromise({ type: `${DOMAIN$2}/events/delete_dev` });
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
        const result = await this._hass.connection.sendMessagePromise({ type: `${DOMAIN$2}/events` });
        const n = (result.events || []).filter((e) => e.dev).length;
        const el = this.shadowRoot.getElementById("dev-count");
        const pl = this.shadowRoot.getElementById("dev-count-plural");
        if (el) el.textContent = String(n);
        if (pl) pl.textContent = n === 1 ? "" : "s";
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
  const EDITOR_CSS = `
  <style>
    :host { display: block; }
    .ed { display: flex; flex-direction: column; gap: 16px; padding: 4px 0 8px; }
    .section {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--secondary-text-color);
      margin-bottom: -4px;
    }
    .note { font-size: 0.78rem; color: var(--secondary-text-color); }
    .ent-row { display: flex; gap: 8px; align-items: center; }
    .ent-row > * { flex: 1; min-width: 0; }
    .swatch-wrap { display: flex; align-items: center; gap: 12px; }
    .swatch-wrap span { font-size: 0.875rem; color: var(--primary-text-color); }
    .swatch-btn {
      width: 38px; height: 38px; border-radius: 50%;
      border: 2px solid var(--divider-color, #ccc);
      cursor: pointer; padding: 0; overflow: hidden;
      position: relative; flex-shrink: 0; background: transparent;
    }
    .swatch-btn input[type="color"] {
      position: absolute; top: -4px; left: -4px;
      width: calc(100% + 8px); height: calc(100% + 8px);
      border: none; cursor: pointer; padding: 0; background: none; opacity: 0;
    }
    .swatch-inner { display: block; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; }
    .switch-help-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .switch-help-row ha-formfield { flex: 1; }
    .help-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      cursor: default;
      flex-shrink: 0;
      position: relative;
    }
    .help-icon:hover .help-tooltip {
      display: block;
    }
    .help-tooltip {
      display: none;
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78rem;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10;
      pointer-events: none;
    }
  </style>`;
  class HassRecordsEditorBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = {};
      this._hass = null;
    }
    // HA calls setConfig first, then sets hass
    setConfig(config) {
      this._config = { ...config };
      this._needsBuild = true;
      if (this._hass) {
        this._needsBuild = false;
        this._build();
      }
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
    }
    _fire(cfg) {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: { ...cfg } },
        bubbles: true,
        composed: true
      }));
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
    // Subclasses override _build() to populate the shadow root
    _build() {
    }
    // ── Factory helpers (all imperative) ──────────────────────────────────────
    _section(text) {
      const d = document.createElement("div");
      d.className = "section";
      d.textContent = text;
      return d;
    }
    _note(text) {
      const d = document.createElement("div");
      d.className = "note";
      d.textContent = text;
      return d;
    }
    // ha-textfield – fires "input"
    _textField(label, key, { type, placeholder, suffix, fallback = "" } = {}) {
      const el = document.createElement("ha-textfield");
      el.label = label;
      el.style.display = "block";
      el.style.width = "100%";
      if (type) el.type = type;
      if (placeholder) el.placeholder = placeholder;
      if (suffix) el.suffix = suffix;
      el.value = this._config[key] != null ? String(this._config[key]) : fallback;
      el.addEventListener("input", () => {
        if (type === "number") {
          const n = parseFloat(el.value);
          this._set(key, isNaN(n) ? void 0 : n);
        } else {
          this._set(key, el.value || void 0);
        }
      });
      return el;
    }
    // ha-icon-picker
    _iconPicker(label, key, defaultVal = "mdi:bookmark") {
      const el = document.createElement("ha-icon-picker");
      el.label = label;
      el.style.display = "block";
      el.style.width = "100%";
      if (this._hass) el.hass = this._hass;
      requestAnimationFrame(() => {
        el.value = this._config[key] ?? defaultVal;
      });
      el.addEventListener("value-changed", (e) => this._set(key, e.detail.value || void 0));
      return el;
    }
    // ha-selector (entity)
    _entityPicker(label, key) {
      const el = document.createElement("ha-selector");
      el.label = label;
      el.selector = { entity: {} };
      el.style.display = "block";
      el.style.width = "100%";
      if (this._hass) el.hass = this._hass;
      requestAnimationFrame(() => {
        el.value = this._config[key] ?? "";
      });
      el.addEventListener("value-changed", (e) => this._set(key, e.detail.value || void 0));
      return el;
    }
    // ha-switch inside ha-formfield
    _switch(label, key, { defaultTrue = false } = {}) {
      const ff = document.createElement("ha-formfield");
      ff.label = label;
      const sw = document.createElement("ha-switch");
      sw.checked = this._config[key] !== void 0 ? !!this._config[key] : defaultTrue;
      sw.addEventListener("change", () => {
        this._set(key, defaultTrue ? sw.checked ? void 0 : false : sw.checked || void 0);
      });
      ff.appendChild(sw);
      return { el: ff, sw };
    }
    // ha-switch with an adjacent help icon tooltip
    _switchWithHelp(label, key, tooltip, { defaultTrue = false } = {}) {
      const { el: ffEl, sw } = this._switch(label, key, { defaultTrue });
      const row = document.createElement("div");
      row.className = "switch-help-row";
      const helpWrap = document.createElement("span");
      helpWrap.className = "help-icon";
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", "mdi:help-circle-outline");
      const tip = document.createElement("span");
      tip.className = "help-tooltip";
      tip.textContent = tooltip;
      helpWrap.appendChild(icon);
      helpWrap.appendChild(tip);
      row.appendChild(ffEl);
      row.appendChild(helpWrap);
      return { el: row, sw };
    }
    // Colour swatch
    _colorSwatch(label, key, defaultColor = "#03a9f4") {
      const color = this._config[key] || defaultColor;
      const wrap = document.createElement("div");
      wrap.className = "swatch-wrap";
      const lbl = document.createElement("span");
      lbl.textContent = label;
      const btn = document.createElement("button");
      btn.className = "swatch-btn";
      btn.title = "Choose colour";
      btn.style.background = color;
      const inner = document.createElement("span");
      inner.className = "swatch-inner";
      inner.style.background = color;
      const inp = document.createElement("input");
      inp.type = "color";
      inp.value = color;
      inp.addEventListener("input", () => {
        btn.style.background = inp.value;
        inner.style.background = inp.value;
      });
      inp.addEventListener("change", () => this._set(key, inp.value));
      btn.appendChild(inner);
      btn.appendChild(inp);
      wrap.appendChild(lbl);
      wrap.appendChild(btn);
      return wrap;
    }
    // ha-selector (select)
    _select(label, key, options, fallback = "") {
      const el = document.createElement("ha-selector");
      el.label = label;
      el.style.display = "block";
      el.style.width = "100%";
      el.selector = { select: { options: options.map(([value, text]) => ({ value, label: text })) } };
      el.value = this._config[key] ?? fallback;
      el.addEventListener("value-changed", (e) => {
        this._set(key, e.detail.value || void 0);
      });
      return el;
    }
    // Dynamic entity list with add/remove
    _entityList(key, buttonLabel = "Add entity") {
      const outer = document.createElement("div");
      outer.style.display = "flex";
      outer.style.flexDirection = "column";
      outer.style.gap = "8px";
      const list = document.createElement("div");
      list.style.display = "flex";
      list.style.flexDirection = "column";
      list.style.gap = "8px";
      const addWrap = document.createElement("div");
      const addBtn = document.createElement("ha-button");
      addBtn.setAttribute("outlined", "");
      const addIco = document.createElement("ha-icon");
      addIco.setAttribute("icon", "mdi:plus");
      addIco.setAttribute("slot", "icon");
      addBtn.appendChild(addIco);
      addBtn.appendChild(document.createTextNode(buttonLabel));
      addWrap.appendChild(addBtn);
      outer.appendChild(list);
      outer.appendChild(addWrap);
      const getArr = () => [...this._config[key] || []];
      const renderRows = () => {
        list.innerHTML = "";
        addWrap.style.marginTop = getArr().length ? "4px" : "0";
        getArr().forEach((eid, idx) => {
          const row = document.createElement("div");
          row.className = "ent-row";
          const picker = document.createElement("ha-selector");
          picker.selector = { entity: {} };
          picker.style.flex = "1";
          picker.style.minWidth = "0";
          if (this._hass) picker.hass = this._hass;
          requestAnimationFrame(() => {
            picker.value = eid || "";
          });
          picker.addEventListener("value-changed", (e) => {
            const arr = getArr();
            arr[idx] = e.detail.value || "";
            this._set(key, arr.some(Boolean) ? arr : void 0);
          });
          const rm = document.createElement("ha-icon-button");
          rm.setAttribute("label", "Remove");
          rm.style.color = "var(--error-color, #f44336)";
          rm.style.flex = "0 0 auto";
          rm.style.alignSelf = "center";
          const rmIco = document.createElement("ha-icon");
          rmIco.setAttribute("icon", "mdi:close");
          rm.appendChild(rmIco);
          rm.addEventListener("click", () => {
            const arr = getArr();
            arr.splice(idx, 1);
            this._set(key, arr.length ? arr : void 0);
            renderRows();
          });
          row.appendChild(picker);
          row.appendChild(rm);
          list.appendChild(row);
        });
      };
      addBtn.addEventListener("click", () => {
        const arr = getArr();
        arr.push("");
        this._set(key, arr);
        renderRows();
      });
      renderRows();
      outer._pushHass = (h) => {
        list.querySelectorAll("ha-selector").forEach((p) => {
          p.hass = h;
        });
      };
      return outer;
    }
  }
  class HassRecordsActionCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("General"));
      ed.appendChild(this._textField("Card title (optional)", "title"));
      ed.appendChild(this._section("Related items"));
      ed.appendChild(this._note("Pre-fill entities, devices, areas or labels that are always linked to recordings from this card."));
      const targetPicker = document.createElement("ha-selector");
      targetPicker.selector = { target: {} };
      targetPicker.style.display = "block";
      targetPicker.style.width = "100%";
      if (this._hass) targetPicker.hass = this._hass;
      requestAnimationFrame(() => {
        targetPicker.value = this._config.target ?? {};
      });
      targetPicker.addEventListener("value-changed", (e) => {
        const val = e.detail.value;
        const isEmpty = !val || Object.values(val).every((v) => !v?.length);
        this._set("target", isEmpty ? void 0 : val);
      });
      ed.appendChild(targetPicker);
      ed.appendChild(this._switch("Show always included targets on card", "show_config_targets", { defaultTrue: true }).el);
      ed.appendChild(this._switch("Allow user to add more related items", "show_target_picker", { defaultTrue: true }).el);
      ed.appendChild(this._section("Datapoint Appearance"));
      ed.appendChild(this._iconPicker("Default icon", "default_icon", "mdi:bookmark"));
      ed.appendChild(this._colorSwatch("Default colour", "default_color", "#03a9f4"));
      ed.appendChild(this._section("Form fields"));
      ed.appendChild(this._switch("Show date & time field", "show_date", { defaultTrue: true }).el);
      ed.appendChild(this._switch("Show annotation field", "show_annotation", { defaultTrue: true }).el);
      this.shadowRoot.appendChild(ed);
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
    }
  }
  class HassRecordsQuickCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("General"));
      ed.appendChild(this._textField("Card title (optional)", "title"));
      ed.appendChild(this._textField("Input placeholder text", "placeholder"));
      ed.appendChild(this._section("Icon & colour"));
      ed.appendChild(this._iconPicker("Icon", "icon", "mdi:bookmark"));
      ed.appendChild(this._colorSwatch("Colour", "color", AMBER));
      ed.appendChild(this._section("Related items"));
      ed.appendChild(this._note("These items will be linked to every record made with this card."));
      ed.appendChild(this._entityPicker("Single entity (optional)", "entity"));
      ed.appendChild(this._section("Multiple entities"));
      this._entList = this._entityList("entities", "Add related items");
      ed.appendChild(this._entList);
      ed.appendChild(this._section("Form fields"));
      ed.appendChild(this._switch("Show annotation field", "show_annotation").el);
      this.shadowRoot.appendChild(ed);
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
      this._entList?._pushHass(h);
    }
  }
  class HassRecordsHistoryCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("General"));
      ed.appendChild(this._textField("Card title (optional)", "title"));
      ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "24" }));
      ed.appendChild(this._section("Entity"));
      ed.appendChild(this._entityPicker("Single entity", "entity"));
      ed.appendChild(this._section("Multiple entities"));
      this._entList = this._entityList("entities");
      ed.appendChild(this._entList);
      ed.appendChild(this._section("Display"));
      ed.appendChild(this._switchWithHelp(
        "Show data gaps",
        "show_data_gaps",
        "Highlight missing data ranges with dashed lines and boundary markers",
        { defaultTrue: true }
      ).el);
      this.shadowRoot.appendChild(ed);
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
      this._entList?._pushHass(h);
    }
  }
  class HassRecordsStatisticsCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("General"));
      ed.appendChild(this._textField("Card title (optional)", "title"));
      ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "168" }));
      ed.appendChild(this._section("Period"));
      ed.appendChild(this._select("Period", "period", [
        ["5minute", "5 minutes"],
        ["hour", "Hour"],
        ["day", "Day"],
        ["week", "Week"],
        ["month", "Month"]
      ], "hour"));
      ed.appendChild(this._section("Stat types"));
      ["mean", "min", "max", "sum", "state"].forEach((st) => {
        const ff = document.createElement("ha-formfield");
        ff.label = st;
        const cb = document.createElement("ha-checkbox");
        cb.checked = (this._config.stat_types || ["mean"]).includes(st);
        cb.addEventListener("change", () => {
          const cur = [...this._config.stat_types || ["mean"]];
          if (cb.checked) {
            if (!cur.includes(st)) cur.push(st);
          } else {
            const i = cur.indexOf(st);
            if (i !== -1) cur.splice(i, 1);
          }
          this._set("stat_types", cur.length ? cur : ["mean"]);
        });
        ff.appendChild(cb);
        ed.appendChild(ff);
      });
      ed.appendChild(this._section("Entity / statistic ID"));
      ed.appendChild(this._entityPicker("Single entity / statistic ID", "entity"));
      ed.appendChild(this._section("Multiple entities"));
      this._entList = this._entityList("entities");
      ed.appendChild(this._entList);
      this.shadowRoot.appendChild(ed);
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
      this._entList?._pushHass(h);
    }
  }
  class HassRecordsSensorCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("Entity"));
      ed.appendChild(this._entityPicker("Sensor entity *", "entity"));
      ed.appendChild(this._section("Display"));
      ed.appendChild(this._textField("Override display name (optional)", "name"));
      ed.appendChild(this._textField("Hours to show", "hours_to_show", { type: "number", fallback: "24" }));
      ed.appendChild(this._colorSwatch("Graph colour", "graph_color", COLORS$2[0]));
      ed.appendChild(this._select("Annotation style", "annotation_style", [
        ["circle", "Circle on line"],
        ["line", "Dotted vertical line"]
      ]));
      ed.appendChild(this._section("Records list"));
      const { el: swEl, sw } = this._switch("Show records list below graph", "show_records");
      ed.appendChild(swEl);
      const pageS = this._textField("Records per page (blank = show all)", "records_page_size", { type: "number" });
      const limit = this._textField("Max records to show (blank = all)", "records_limit", { type: "number" });
      const showAnn = this._switchWithHelp(
        "Show full message",
        "records_show_full_message",
        "User will be able to expand the row if hidden",
        { defaultTrue: true }
      );
      ed.appendChild(pageS);
      ed.appendChild(limit);
      ed.appendChild(showAnn.el);
      const syncDisabled = () => {
        const on = !!this._config.show_records;
        pageS.disabled = !on;
        limit.disabled = !on;
        showAnn.el.style.opacity = on ? "1" : "0.5";
        showAnn.sw.disabled = !on;
      };
      sw.addEventListener("change", syncDisabled);
      syncDisabled();
      this.shadowRoot.appendChild(ed);
    }
  }
  class HassRecordsListCardEditor extends HassRecordsEditorBase {
    _build() {
      this.shadowRoot.innerHTML = EDITOR_CSS;
      const ed = document.createElement("div");
      ed.className = "ed";
      ed.appendChild(this._section("General"));
      ed.appendChild(this._textField("Card title (optional)", "title"));
      ed.appendChild(this._textField("Hours to show (blank = all time)", "hours_to_show", { type: "number" }));
      ed.appendChild(this._textField("Records per page", "page_size", { type: "number", fallback: "15" }));
      ed.appendChild(this._section("Filtering"));
      ed.appendChild(this._textField("Default message filter (always applied)", "message_filter"));
      ed.appendChild(this._section("Visibility"));
      ed.appendChild(this._switch("Show search bar", "show_search", { defaultTrue: true }).el);
      ed.appendChild(this._switch("Show related entities", "show_entities", { defaultTrue: true }).el);
      ed.appendChild(this._switch("Show edit & delete actions", "show_actions", { defaultTrue: true }).el);
      ed.appendChild(this._switchWithHelp(
        "Show full message",
        "show_full_message",
        "User will be able to expand the row if hidden",
        { defaultTrue: true }
      ).el);
      ed.appendChild(this._section("Filter by entity"));
      ed.appendChild(this._entityPicker("Single entity (optional)", "entity"));
      ed.appendChild(this._section("Multiple entity filter"));
      this._entList = this._entityList("entities", "Add default related items");
      ed.appendChild(this._entList);
      this.shadowRoot.appendChild(ed);
    }
    set hass(h) {
      this._hass = h;
      if (this._needsBuild) {
        this._needsBuild = false;
        this._build();
        return;
      }
      this.shadowRoot.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector").forEach((el) => {
        el.hass = h;
      });
      this._entList?._pushHass(h);
    }
  }
  const jsContent = '(function() {\n  "use strict";\n  function getTrendWindowMs(value) {\n    const windows = {\n      "1h": 60 * 60 * 1e3,\n      "6h": 6 * 60 * 60 * 1e3,\n      "24h": 24 * 60 * 60 * 1e3,\n      "7d": 7 * 24 * 60 * 60 * 1e3,\n      "14d": 14 * 24 * 60 * 60 * 1e3,\n      "21d": 21 * 24 * 60 * 60 * 1e3,\n      "28d": 28 * 24 * 60 * 60 * 1e3\n    };\n    return windows[value] || windows["24h"];\n  }\n  function buildRollingAverageTrend(points, windowMs) {\n    if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(windowMs) || windowMs <= 0) {\n      return [];\n    }\n    const trendPoints = [];\n    let windowStartIndex = 0;\n    let windowSum = 0;\n    for (let index = 0; index < points.length; index += 1) {\n      const [time, value] = points[index];\n      windowSum += value;\n      while (windowStartIndex < index && time - points[windowStartIndex][0] > windowMs) {\n        windowSum -= points[windowStartIndex][1];\n        windowStartIndex += 1;\n      }\n      const count = index - windowStartIndex + 1;\n      if (count > 0) {\n        trendPoints.push([time, windowSum / count]);\n      }\n    }\n    return trendPoints;\n  }\n  function buildLinearTrend(points) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    const origin = points[0][0];\n    let sumX = 0;\n    let sumY = 0;\n    let sumXX = 0;\n    let sumXY = 0;\n    for (const [time, value] of points) {\n      const x = (time - origin) / (60 * 60 * 1e3);\n      sumX += x;\n      sumY += value;\n      sumXX += x * x;\n      sumXY += x * value;\n    }\n    const count = points.length;\n    const denominator = count * sumXX - sumX * sumX;\n    if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {\n      return [];\n    }\n    const slope = (count * sumXY - sumX * sumY) / denominator;\n    const intercept = (sumY - slope * sumX) / count;\n    const firstTime = points[0][0];\n    const lastTime = points[points.length - 1][0];\n    const firstX = (firstTime - origin) / (60 * 60 * 1e3);\n    const lastX = (lastTime - origin) / (60 * 60 * 1e3);\n    return [\n      [firstTime, intercept + slope * firstX],\n      [lastTime, intercept + slope * lastX]\n    ];\n  }\n  function buildTrendPoints(points, method, trendWindow) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    if (method === "linear_trend") {\n      return buildLinearTrend(points);\n    }\n    return buildRollingAverageTrend(points, getTrendWindowMs(trendWindow));\n  }\n  function getPersistenceWindowMs(value) {\n    const windows = {\n      "30m": 30 * 60 * 1e3,\n      "1h": 60 * 60 * 1e3,\n      "3h": 3 * 60 * 60 * 1e3,\n      "6h": 6 * 60 * 60 * 1e3,\n      "12h": 12 * 60 * 60 * 1e3,\n      "24h": 24 * 60 * 60 * 1e3\n    };\n    return windows[value] || windows["1h"];\n  }\n  function buildIQRAnomalyClusters(points, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 4) {\n      return [];\n    }\n    const sorted = points.map(([, v]) => v).sort((a, b) => a - b);\n    const n = sorted.length;\n    const q1 = sorted[Math.floor(n * 0.25)];\n    const q2 = sorted[Math.floor(n * 0.5)];\n    const q3 = sorted[Math.floor(n * 0.75)];\n    const iqr = q3 - q1;\n    if (!Number.isFinite(iqr) || iqr <= 1e-6) {\n      return [];\n    }\n    const k = anomalySensitivity === "low" ? 3 : anomalySensitivity === "high" ? 1.5 : 2;\n    const lowerFence = q1 - k * iqr;\n    const upperFence = q3 + k * iqr;\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "iqr" });\n      currentCluster = [];\n    };\n    for (const [timeMs, value] of points) {\n      if (value < lowerFence || value > upperFence) {\n        currentCluster.push({ timeMs, value, baselineValue: q2, residual: value - q2 });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildRollingZScoreAnomalyClusters(points, windowMs, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(windowMs) || windowMs <= 0) {\n      return [];\n    }\n    const threshold = getAnomalySensitivityThreshold(anomalySensitivity);\n    const residuals = [];\n    let windowStart = 0;\n    let windowSum = 0;\n    let windowSumSq = 0;\n    for (let i = 0; i < points.length; i += 1) {\n      const [timeMs, value] = points[i];\n      windowSum += value;\n      windowSumSq += value * value;\n      while (windowStart < i && timeMs - points[windowStart][0] > windowMs) {\n        const old = points[windowStart][1];\n        windowSum -= old;\n        windowSumSq -= old * old;\n        windowStart += 1;\n      }\n      const count = i - windowStart + 1;\n      if (count < 3) {\n        continue;\n      }\n      const mean = windowSum / count;\n      const variance = Math.max(0, windowSumSq / count - mean * mean);\n      const std = Math.sqrt(variance);\n      if (!Number.isFinite(std) || std <= 1e-6) {\n        continue;\n      }\n      const zscore = (value - mean) / std;\n      if (Math.abs(zscore) >= threshold) {\n        residuals.push({ timeMs, value, baselineValue: mean, residual: value - mean, flagged: true });\n      } else {\n        residuals.push({ timeMs, flagged: false });\n      }\n    }\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });\n      currentCluster = [];\n    };\n    for (const r of residuals) {\n      if (r.flagged) {\n        currentCluster.push(r);\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildPersistenceAnomalyClusters(points, minDurationMs, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(minDurationMs) || minDurationMs <= 0) {\n      return [];\n    }\n    let totalMin = Infinity;\n    let totalMax = -Infinity;\n    for (const [, v] of points) {\n      if (v < totalMin) totalMin = v;\n      if (v > totalMax) totalMax = v;\n    }\n    const totalRange = totalMax - totalMin;\n    if (!Number.isFinite(totalRange) || totalRange <= 1e-6) {\n      return [];\n    }\n    const flatFraction = anomalySensitivity === "low" ? 5e-3 : anomalySensitivity === "high" ? 0.05 : 0.02;\n    const flatThreshold = flatFraction * totalRange;\n    const clusters = [];\n    let runStart = 0;\n    let runMin = points[0][1];\n    let runMax = points[0][1];\n    const flushRun = (runEnd) => {\n      const duration = points[runEnd][0] - points[runStart][0];\n      if (duration >= minDurationMs && runEnd > runStart) {\n        const mid = (runMin + runMax) / 2;\n        const clusterPoints = [];\n        for (let k = runStart; k <= runEnd; k += 1) {\n          clusterPoints.push({ timeMs: points[k][0], value: points[k][1], baselineValue: mid, residual: points[k][1] - mid });\n        }\n        clusters.push({\n          points: clusterPoints,\n          maxDeviation: runMax - runMin,\n          anomalyMethod: "persistence",\n          flatRange: runMax - runMin\n        });\n      }\n    };\n    for (let i = 1; i < points.length; i += 1) {\n      const v = points[i][1];\n      const nextMin = Math.min(runMin, v);\n      const nextMax = Math.max(runMax, v);\n      if (nextMax - nextMin > flatThreshold) {\n        flushRun(i - 1);\n        runStart = i;\n        runMin = v;\n        runMax = v;\n      } else {\n        runMin = nextMin;\n        runMax = nextMax;\n      }\n    }\n    flushRun(points.length - 1);\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildComparisonWindowAnomalyClusters(points, comparisonPoints, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 3) {\n      return [];\n    }\n    const deltaPoints = [];\n    for (const [timeMs, value] of points) {\n      const compValue = interpolateSeriesValue(comparisonPoints, timeMs);\n      if (!Number.isFinite(compValue)) {\n        continue;\n      }\n      deltaPoints.push({ timeMs, value, compValue, delta: value - compValue });\n    }\n    if (deltaPoints.length < 3) {\n      return [];\n    }\n    let sumDeltas = 0;\n    for (const p of deltaPoints) {\n      sumDeltas += p.delta;\n    }\n    const meanDelta = sumDeltas / deltaPoints.length;\n    let sumSqDev = 0;\n    for (const p of deltaPoints) {\n      const dev = p.delta - meanDelta;\n      sumSqDev += dev * dev;\n    }\n    const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);\n    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) return;\n      const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);\n      clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "comparison_window" });\n      currentCluster = [];\n    };\n    for (const { timeMs, value, compValue, delta } of deltaPoints) {\n      const residual = delta - meanDelta;\n      if (Math.abs(residual) >= threshold) {\n        currentCluster.push({ timeMs, value, baselineValue: compValue, residual: value - compValue });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((c) => c.points.length > 0);\n  }\n  function buildRateOfChangeAnomalyClusters(points, rateWindow, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3) {\n      return [];\n    }\n    const ratePoints = buildRateOfChangePoints(points, rateWindow);\n    if (!Array.isArray(ratePoints) || ratePoints.length < 3) {\n      return [];\n    }\n    let sumRates = 0;\n    for (const [, rate] of ratePoints) {\n      sumRates += rate;\n    }\n    const meanRate = sumRates / ratePoints.length;\n    let sumSqDev = 0;\n    for (const [, rate] of ratePoints) {\n      const dev = rate - meanRate;\n      sumSqDev += dev * dev;\n    }\n    const rmsDeviation = Math.sqrt(sumSqDev / ratePoints.length);\n    if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) {\n        return;\n      }\n      const maxDeviation = currentCluster.reduce((maxVal, point) => {\n        return Math.max(maxVal, Math.abs(point.residual));\n      }, 0);\n      clusters.push({\n        points: currentCluster.slice(),\n        maxDeviation,\n        anomalyMethod: "rate_of_change"\n      });\n      currentCluster = [];\n    };\n    for (const [timeMs, rate] of ratePoints) {\n      const residual = rate - meanRate;\n      if (Math.abs(residual) >= threshold) {\n        const sourceValue = interpolateSeriesValue(points, timeMs);\n        if (!Number.isFinite(sourceValue)) {\n          flushCluster();\n          continue;\n        }\n        currentCluster.push({\n          timeMs,\n          value: sourceValue,\n          baselineValue: meanRate,\n          residual\n        });\n      } else {\n        flushCluster();\n      }\n    }\n    flushCluster();\n    return clusters.filter((cluster) => cluster.points.length > 0);\n  }\n  const VALID_ANOMALY_METHODS = ["trend_residual", "rate_of_change", "iqr", "rolling_zscore", "persistence", "comparison_window"];\n  function normalizeSeriesAnalysis(analysis) {\n    const source = analysis && typeof analysis === "object" ? analysis : {};\n    const legacyMethod = VALID_ANOMALY_METHODS.includes(source.anomaly_method) ? source.anomaly_method : null;\n    return {\n      show_trend_lines: source.show_trend_lines === true,\n      trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",\n      trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",\n      show_summary_stats: source.show_summary_stats === true,\n      show_rate_of_change: source.show_rate_of_change === true,\n      rate_window: typeof source.rate_window === "string" && source.rate_window ? source.rate_window : "1h",\n      show_anomalies: source.show_anomalies === true,\n      anomaly_methods: Array.isArray(source.anomaly_methods) ? source.anomaly_methods.filter((m) => VALID_ANOMALY_METHODS.includes(m)) : legacyMethod ? [legacyMethod] : [],\n      anomaly_overlap_mode: ["all", "highlight", "only"].includes(source.anomaly_overlap_mode) ? source.anomaly_overlap_mode : "all",\n      anomaly_sensitivity: typeof source.anomaly_sensitivity === "string" && source.anomaly_sensitivity ? source.anomaly_sensitivity : "medium",\n      anomaly_rate_window: typeof source.anomaly_rate_window === "string" && source.anomaly_rate_window ? source.anomaly_rate_window : "1h",\n      anomaly_zscore_window: typeof source.anomaly_zscore_window === "string" && source.anomaly_zscore_window ? source.anomaly_zscore_window : "24h",\n      anomaly_persistence_window: typeof source.anomaly_persistence_window === "string" && source.anomaly_persistence_window ? source.anomaly_persistence_window : "1h",\n      anomaly_comparison_window_id: typeof source.anomaly_comparison_window_id === "string" && source.anomaly_comparison_window_id ? source.anomaly_comparison_window_id : null,\n      show_delta_analysis: source.show_delta_analysis === true\n    };\n  }\n  function applyAnomalyOverlapMode(clustersByMethod, overlapMode) {\n    const methodKeys = Object.keys(clustersByMethod);\n    if (methodKeys.length <= 1 || overlapMode === "all") {\n      return methodKeys.flatMap((m) => clustersByMethod[m]);\n    }\n    const flaggedByMethod = {};\n    for (const m of methodKeys) {\n      flaggedByMethod[m] = new Set(clustersByMethod[m].flatMap((c) => c.points.map((p) => p.timeMs)));\n    }\n    const overlapTimes = /* @__PURE__ */ new Set();\n    for (const m of methodKeys) {\n      for (const t of flaggedByMethod[m]) {\n        if (methodKeys.some((other) => other !== m && flaggedByMethod[other].has(t))) {\n          overlapTimes.add(t);\n        }\n      }\n    }\n    if (overlapMode === "only") {\n      const seen = /* @__PURE__ */ new Set();\n      const result2 = [];\n      for (const m of methodKeys) {\n        for (const cluster of clustersByMethod[m]) {\n          const pts = cluster.points.filter((p) => overlapTimes.has(p.timeMs));\n          if (pts.length === 0) continue;\n          const key = pts.map((p) => p.timeMs).join(",");\n          if (seen.has(key)) continue;\n          seen.add(key);\n          const detectedByMethods = methodKeys.filter((other) => pts.some((p) => flaggedByMethod[other].has(p.timeMs)));\n          result2.push({\n            ...cluster,\n            points: pts,\n            maxDeviation: pts.reduce((maxVal, p) => Math.max(maxVal, Math.abs(p.residual || 0)), 0),\n            isOverlap: true,\n            detectedByMethods\n          });\n        }\n      }\n      return result2;\n    }\n    const result = [];\n    for (const m of methodKeys) {\n      for (const cluster of clustersByMethod[m]) {\n        const hasOverlap = cluster.points.some((p) => overlapTimes.has(p.timeMs));\n        const detectedByMethods = hasOverlap ? methodKeys.filter((other) => cluster.points.some((p) => flaggedByMethod[other].has(p.timeMs))) : [m];\n        result.push({ ...cluster, isOverlap: hasOverlap, detectedByMethods });\n      }\n    }\n    return result;\n  }\n  function interpolateSeriesValue(points, timeMs) {\n    if (!Array.isArray(points) || points.length === 0) {\n      return null;\n    }\n    if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {\n      return null;\n    }\n    if (timeMs === points[0][0]) {\n      return points[0][1];\n    }\n    if (timeMs === points[points.length - 1][0]) {\n      return points[points.length - 1][1];\n    }\n    for (let index = 0; index < points.length - 1; index += 1) {\n      const [startTime, startValue] = points[index];\n      const [endTime, endValue] = points[index + 1];\n      if (timeMs >= startTime && timeMs <= endTime) {\n        const fraction = (timeMs - startTime) / (endTime - startTime);\n        return startValue + (endValue - startValue) * fraction;\n      }\n    }\n    return null;\n  }\n  function buildRateOfChangePoints(points, rateWindow) {\n    if (!Array.isArray(points) || points.length < 2) {\n      return [];\n    }\n    const ratePoints = [];\n    for (let index = 1; index < points.length; index += 1) {\n      const [timeMs, value] = points[index];\n      let comparisonPoint = null;\n      if (rateWindow === "point_to_point") {\n        comparisonPoint = points[index - 1];\n      } else {\n        const windowMs = getTrendWindowMs(rateWindow);\n        if (!Number.isFinite(windowMs) || windowMs <= 0) {\n          continue;\n        }\n        for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {\n          const candidatePoint = points[candidateIndex];\n          if (timeMs - candidatePoint[0] >= windowMs) {\n            comparisonPoint = candidatePoint;\n            break;\n          }\n        }\n        if (!comparisonPoint) {\n          comparisonPoint = points[0];\n        }\n      }\n      if (!Array.isArray(comparisonPoint) || comparisonPoint.length < 2) {\n        continue;\n      }\n      const deltaMs = timeMs - comparisonPoint[0];\n      if (!Number.isFinite(deltaMs) || deltaMs <= 0) {\n        continue;\n      }\n      const deltaHours = deltaMs / (60 * 60 * 1e3);\n      if (!Number.isFinite(deltaHours) || deltaHours <= 0) {\n        continue;\n      }\n      const rateValue = (value - comparisonPoint[1]) / deltaHours;\n      if (!Number.isFinite(rateValue)) {\n        continue;\n      }\n      ratePoints.push([timeMs, rateValue]);\n    }\n    return ratePoints;\n  }\n  function buildDeltaPoints(sourcePoints, comparisonPoints) {\n    if (!Array.isArray(sourcePoints) || sourcePoints.length < 2 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 2) {\n      return [];\n    }\n    const deltaPoints = [];\n    for (const [timeMs, value] of sourcePoints) {\n      const comparisonValue = interpolateSeriesValue(comparisonPoints, timeMs);\n      if (comparisonValue == null) {\n        continue;\n      }\n      deltaPoints.push([timeMs, value - comparisonValue]);\n    }\n    return deltaPoints;\n  }\n  function buildSummaryStats(points) {\n    if (!Array.isArray(points) || points.length === 0) {\n      return null;\n    }\n    let min = Infinity;\n    let max = -Infinity;\n    let sum = 0;\n    let count = 0;\n    for (const point of points) {\n      const value = Number(point?.[1]);\n      if (!Number.isFinite(value)) {\n        continue;\n      }\n      if (value < min) {\n        min = value;\n      }\n      if (value > max) {\n        max = value;\n      }\n      sum += value;\n      count += 1;\n    }\n    if (!Number.isFinite(min) || !Number.isFinite(max) || count === 0) {\n      return null;\n    }\n    return {\n      min,\n      max,\n      mean: sum / count\n    };\n  }\n  function getAnomalySensitivityThreshold(sensitivity) {\n    if (sensitivity === "low") {\n      return 2.8;\n    }\n    if (sensitivity === "high") {\n      return 1.6;\n    }\n    return 2.2;\n  }\n  function buildAnomalyClusters(points, method, trendWindow, anomalySensitivity) {\n    if (!Array.isArray(points) || points.length < 3) {\n      return [];\n    }\n    const baselinePoints = buildTrendPoints(points, method, trendWindow);\n    if (!Array.isArray(baselinePoints) || baselinePoints.length < 2) {\n      return [];\n    }\n    const residualPoints = [];\n    for (const [timeMs, value] of points) {\n      const baselineValue = interpolateSeriesValue(baselinePoints, timeMs);\n      if (!Number.isFinite(baselineValue)) {\n        continue;\n      }\n      residualPoints.push({\n        timeMs,\n        value,\n        baselineValue,\n        residual: value - baselineValue\n      });\n    }\n    if (residualPoints.length < 3) {\n      return [];\n    }\n    let sumSquares = 0;\n    residualPoints.forEach((point) => {\n      sumSquares += point.residual * point.residual;\n    });\n    const rmsResidual = Math.sqrt(sumSquares / residualPoints.length);\n    if (!Number.isFinite(rmsResidual) || rmsResidual <= 1e-6) {\n      return [];\n    }\n    const threshold = rmsResidual * getAnomalySensitivityThreshold(anomalySensitivity);\n    const clusters = [];\n    let currentCluster = [];\n    const flushCluster = () => {\n      if (currentCluster.length === 0) {\n        return;\n      }\n      const maxDeviation = currentCluster.reduce((maxValue, point) => {\n        return Math.max(maxValue, Math.abs(point.residual));\n      }, 0);\n      clusters.push({\n        points: currentCluster.slice(),\n        maxDeviation,\n        anomalyMethod: "trend_residual"\n      });\n      currentCluster = [];\n    };\n    residualPoints.forEach((point) => {\n      if (Math.abs(point.residual) >= threshold) {\n        currentCluster.push(point);\n      } else {\n        flushCluster();\n      }\n    });\n    flushCluster();\n    return clusters.filter((cluster) => cluster.points.length > 0);\n  }\n  function computeHistoryAnalysis(payload) {\n    const series = (Array.isArray(payload?.series) ? payload.series : []).map((seriesItem) => {\n      return {\n        ...seriesItem,\n        analysis: normalizeSeriesAnalysis(seriesItem?.analysis)\n      };\n    });\n    const comparisonSeries = new Map(\n      (Array.isArray(payload?.comparisonSeries) ? payload.comparisonSeries : []).filter((entry) => entry?.entityId).map((entry) => [entry.entityId, entry])\n    );\n    const allComparisonWindowsData = payload?.allComparisonWindowsData && typeof payload.allComparisonWindowsData === "object" ? payload.allComparisonWindowsData : {};\n    const result = {\n      trendSeries: [],\n      rateSeries: [],\n      deltaSeries: [],\n      summaryStats: [],\n      anomalySeries: []\n    };\n    for (const seriesItem of series) {\n      const points = Array.isArray(seriesItem?.pts) ? seriesItem.pts : [];\n      const analysis = normalizeSeriesAnalysis(seriesItem?.analysis);\n      if (points.length < 2) {\n        continue;\n      }\n      const anomalyMethods = analysis.anomaly_methods;\n      const needsTrend = analysis.show_trend_lines === true || analysis.show_anomalies === true && anomalyMethods.includes("trend_residual");\n      if (needsTrend) {\n        const trendPoints = buildTrendPoints(points, analysis.trend_method, analysis.trend_window);\n        if (analysis.show_trend_lines === true && trendPoints.length >= 2) {\n          result.trendSeries.push({\n            entityId: seriesItem.entityId,\n            pts: trendPoints\n          });\n        }\n      }\n      if (analysis.show_anomalies === true) {\n        const clustersByMethod = {};\n        if (anomalyMethods.includes("trend_residual")) {\n          const clusters = buildAnomalyClusters(points, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod["trend_residual"] = clusters;\n        }\n        if (anomalyMethods.includes("rate_of_change")) {\n          const clusters = buildRateOfChangeAnomalyClusters(points, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod["rate_of_change"] = clusters;\n        }\n        if (anomalyMethods.includes("iqr")) {\n          const clusters = buildIQRAnomalyClusters(points, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod["iqr"] = clusters;\n        }\n        if (anomalyMethods.includes("rolling_zscore")) {\n          const windowMs = getTrendWindowMs(analysis.anomaly_zscore_window);\n          const clusters = buildRollingZScoreAnomalyClusters(points, windowMs, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod["rolling_zscore"] = clusters;\n        }\n        if (anomalyMethods.includes("persistence")) {\n          const minDurationMs = getPersistenceWindowMs(analysis.anomaly_persistence_window);\n          const clusters = buildPersistenceAnomalyClusters(points, minDurationMs, analysis.anomaly_sensitivity);\n          if (clusters.length > 0) clustersByMethod["persistence"] = clusters;\n        }\n        if (anomalyMethods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {\n          const windowData = allComparisonWindowsData[analysis.anomaly_comparison_window_id];\n          const comparisonPts = windowData && typeof windowData === "object" ? windowData[seriesItem.entityId] : null;\n          if (Array.isArray(comparisonPts) && comparisonPts.length >= 3) {\n            const clusters = buildComparisonWindowAnomalyClusters(points, comparisonPts, analysis.anomaly_sensitivity);\n            if (clusters.length > 0) clustersByMethod["comparison_window"] = clusters;\n          }\n        }\n        const anomalyClusters = applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);\n        if (anomalyClusters.length > 0) {\n          result.anomalySeries.push({ entityId: seriesItem.entityId, anomalyClusters });\n        }\n      }\n      if (analysis.show_rate_of_change === true) {\n        const ratePoints = buildRateOfChangePoints(points, analysis.rate_window);\n        if (ratePoints.length >= 2) {\n          result.rateSeries.push({\n            entityId: seriesItem.entityId,\n            pts: ratePoints\n          });\n        }\n      }\n      if (analysis.show_summary_stats === true) {\n        const summaryStats = buildSummaryStats(points);\n        if (summaryStats) {\n          result.summaryStats.push({\n            entityId: seriesItem.entityId,\n            ...summaryStats\n          });\n        }\n      }\n      if (analysis.show_delta_analysis === true && payload?.hasSelectedComparisonWindow === true) {\n        const comparisonEntry = comparisonSeries.get(seriesItem.entityId);\n        if (comparisonEntry?.pts?.length >= 2) {\n          const deltaPoints = buildDeltaPoints(points, comparisonEntry.pts);\n          if (deltaPoints.length >= 2) {\n            result.deltaSeries.push({\n              entityId: seriesItem.entityId,\n              pts: deltaPoints\n            });\n          }\n        }\n      }\n    }\n    return result;\n  }\n  self.onmessage = (event) => {\n    const { id, payload } = event.data || {};\n    try {\n      const result = computeHistoryAnalysis(payload);\n      self.postMessage({ id, result });\n    } catch (error) {\n      self.postMessage({\n        id,\n        error: error instanceof Error ? error.message : String(error)\n      });\n    }\n  };\n})();\n';
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
    } catch (e) {
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
  const HISTORY_CHART_MAX_CANVAS_WIDTH_PX = 65536;
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
      <div class="chart-preview-line"><strong>Date window:</strong> ${esc$3(overlay.window_range_label)}</div>
      <div class="chart-preview-line"><strong>Actual:</strong> ${esc$3(overlay.actual_range_label)}</div>
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
        return this._config.entities.map((e) => typeof e === "string" ? e : e.entity || e.entity_id);
      }
      return [this._config.entity];
    }
    get _seriesSettings() {
      const configured = Array.isArray(this._config?.series_settings) ? this._config.series_settings : [];
      const byEntityId = new Map(
        configured.filter((entry) => entry?.entity_id).map((entry, index) => [entry.entity_id, {
          entity_id: entry.entity_id,
          color: entry.color || COLORS$2[index % COLORS$2.length]
        }])
      );
      return this._entityIds.map((entityId, index) => byEntityId.get(entityId) || {
        entity_id: entityId,
        color: COLORS$2[index % COLORS$2.length]
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
      })).then((results) => {
        return results;
      }).catch((error) => {
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
      return Promise.all(windowsToFetch.map(async ({ win, winStart, winEnd }) => {
        return this._loadComparisonWindowData(win, winStart, winEnd);
      })).then((results) => {
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
          fetchEvents$3(
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
      const { w, h } = setupCanvas$1(canvas, chartStage || wrap, availableHeight, viewportWidth);
      const renderer = new ChartRenderer$1(canvas, w, h);
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
      const N = visibleSeries.length;
      const MIN_ROW_HEIGHT = 140;
      const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor(availableHeight / N));
      const totalHeight = rowHeight * N;
      if (chartStage) {
        chartStage.style.width = `${canvasWidth}px`;
        chartStage.style.height = `${totalHeight}px`;
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
      for (let i = 0; i < N; i += 1) {
        const isLastRow = i === N - 1;
        const seriesItem = visibleSeries[i];
        const rowOffset = i * rowHeight;
        const rowDiv = document.createElement("div");
        rowDiv.className = "split-series-row";
        rowDiv.style.cssText = `position:absolute;left:0;top:${rowOffset}px;width:${canvasWidth}px;height:${rowHeight}px;pointer-events:none;overflow:hidden;`;
        const rowCanvas = document.createElement("canvas");
        rowCanvas.className = "split-series-canvas";
        rowDiv.appendChild(rowCanvas);
        chartStage?.appendChild(rowDiv);
        const { w, h } = setupCanvas$1(rowCanvas, chartStage || wrap, rowHeight, canvasWidth);
        const renderer = new ChartRenderer$1(rowCanvas, w, h);
        renderer.labelColor = resolveChartLabelColor(this);
        renderer.basePad = { top: 24, right: 12, bottom: isLastRow ? 48 : 10, left: 12 };
        renderer.clear();
        const rowAnalysis = effectiveAnalysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
        const rowTrendPts = rowAnalysis.show_trend_lines === true ? trendPointsMap.get(seriesItem.entityId) || [] : [];
        const rowRatePts = rowAnalysis.show_rate_of_change === true ? ratePointsMap.get(seriesItem.entityId) || [] : [];
        const rowDeltaPts = rowAnalysis.show_delta_analysis === true && hasSelectedComparisonWindow ? deltaPointsMap.get(seriesItem.entityId) || [] : [];
        const rowSummaryStats = rowAnalysis.show_summary_stats === true ? summaryStatsMap.get(seriesItem.entityId) || null : null;
        const rowAnomalyClusters = rowAnalysis.show_anomalies === true ? anomalyClustersMap.get(seriesItem.entityId) || [] : [];
        const rowHideSource = this._seriesShouldHideSource(rowAnalysis, hasSelectedComparisonWindow);
        const axisValues = seriesItem.pts.map(([, v]) => v);
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
          const rateVals = rowRatePts.map(([, v]) => v);
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
          const deltaVals = rowDeltaPts.map(([, v]) => v);
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
        const resolvedRateAxis = rowRateAxisKey ? renderer._activeAxes?.find((a) => a.key === rowRateAxisKey) || null : null;
        const resolvedDeltaAxis = rowDeltaAxisKey ? renderer._activeAxes?.find((a) => a.key === rowDeltaAxisKey) || null : null;
        seriesItem.axis = resolvedAxis;
        const mainSeriesOpacity = comparisonPreviewActive ? hoveringDifferentComparison ? 0.15 : 0.25 : 1;
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
          for (const s of stateList) {
            const v = parseFloat(s.s);
            if (!isNaN(v)) {
              winPts.push([Math.round(s.lu * 1e3) - win.time_offset_ms, v]);
            }
          }
          if (!winPts.length) {
            continue;
          }
          const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          const compLineOpacity = isHovered ? 0.85 : hoveringDifferentComparison && isSelected ? 0.25 : 0.85;
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
            const normalClusters = filteredClusters.filter((c) => !c.isOverlap);
            const overlapClusters = filteredClusters.filter((c) => c.isOverlap === true);
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
          for (const s of stateList) {
            const v = parseFloat(s.s);
            if (!isNaN(v)) {
              winPts.push([Math.round(s.lu * 1e3) - win.time_offset_ms, v]);
            }
          }
          if (!winPts.length) {
            continue;
          }
          const isHovered = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelected = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          const hoverOpacity = isHovered ? 0.85 : hoveringDifferentComparison && isSelected ? 0.25 : 0.85;
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
        const x = primaryRenderer.xOf(timeMs, t0, t1);
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
            x,
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
        hoveredEvents.sort((a, b) => (a._hoverDistanceMs || 0) - (b._hoverDistanceMs || 0));
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
            x,
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
          const effectiveAnalysis = trackAnalysis || (analysisMap || /* @__PURE__ */ new Map()).get(trackSeries.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
              ...trendVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(trendVal, trackAxis.min, trackAxis.max) } : {},
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
              ...rateVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(rateVal, trackRateAxis.min, trackRateAxis.max) } : {},
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
              ...deltaVal != null ? { x, y: trackRowOffset + trackRenderer.yOf(deltaVal, trackDeltaAxis.min, trackDeltaAxis.max) } : {},
              axisSide: "right",
              axisSlot: 0,
              delta: true,
              rawVisible: !trackHideSource
            });
          }
          if (effectiveAnalysis.show_summary_stats === true && trackSummaryStats) {
            const summaryEntries = [
              { type: "min", value: trackSummaryStats.min, alphaV: trackHideSource ? 0.78 : 0.42, opac: trackHideSource ? 0.82 : 0.34 },
              { type: "mean", value: trackSummaryStats.mean, alphaV: trackHideSource ? 0.94 : 0.78, opac: trackHideSource ? 0.94 : 0.72 },
              { type: "max", value: trackSummaryStats.max, alphaV: trackHideSource ? 0.78 : 0.42, opac: trackHideSource ? 0.82 : 0.34 }
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
          const eff = track.analysis || (analysisMap || /* @__PURE__ */ new Map()).get(track.series.entityId) || normalizeHistorySeriesAnalysis$1(null);
          return this._seriesShouldHideSource(eff, hasSelectedComparisonWindow);
        });
        return {
          x,
          y: values.find((v) => v.hasValue)?.y ?? splitSelTop + 12,
          timeMs,
          rangeStartMs: timeMs,
          rangeEndMs: timeMs,
          values: values.filter((v) => v.hasValue),
          trendValues,
          rateValues,
          deltaValues,
          summaryValues,
          thresholdValues,
          comparisonValues: comparisonValues.filter((v) => v.hasValue),
          binaryValues: [],
          primary: values.find((v) => v.hasValue) ?? null,
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
          hideTooltip$1(this);
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
      }).filter(Boolean).sort((a, b) => a.lu - b.lu);
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
        const timestamp = typeof rawTimestamp === "number" ? rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1e3 : new Date(rawTimestamp).getTime();
        if (!Number.isFinite(timestamp)) {
          return null;
        }
        return {
          lu: Math.round(timestamp) / 1e3,
          s: String(value)
        };
      }).filter(Boolean).sort((a, b) => a.lu - b.lu);
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
      merged.sort((a, b) => a.lu - b.lu);
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
        const x = (time - origin) / (60 * 60 * 1e3);
        sumX += x;
        sumY += value;
        sumXX += x * x;
        sumXY += x * value;
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
      for (let i = 1; i < pts.length; i++) {
        intervals.push(pts[i][0] - pts[i - 1][0]);
      }
      if (fixedThreshold != null) {
        const gaps2 = [];
        for (let i = 0; i < intervals.length; i++) {
          if (intervals[i] > fixedThreshold) {
            gaps2.push({ startIdx: i, endIdx: i + 1 });
          }
        }
        return gaps2;
      }
      const windowRadius = Math.max(3, Math.min(12, Math.floor(intervals.length / 6)));
      const gaps = [];
      for (let i = 0; i < intervals.length; i++) {
        const lo = Math.max(0, i - windowRadius);
        const hi = Math.min(intervals.length, i + windowRadius + 1);
        const neighbours = intervals.slice(lo, hi).sort((a, b) => a - b);
        const localMedian = neighbours[Math.floor(neighbours.length / 2)];
        if (intervals[i] > localMedian * 3 && intervals[i] > 1e4) {
          gaps.push({ startIdx: i, endIdx: i + 1 });
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
        const maxDeviation = currentCluster.reduce((maxValue, point) => {
          return Math.max(maxValue, Math.abs(point.residual));
        }, 0);
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
        const maxDeviation = currentCluster.reduce((maxVal, point) => {
          return Math.max(maxVal, Math.abs(point.residual));
        }, 0);
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
      const sorted = points.map(([, v]) => v).sort((a, b) => a - b);
      const n = sorted.length;
      const q1 = sorted[Math.floor(n * 0.25)];
      const q2 = sorted[Math.floor(n * 0.5)];
      const q3 = sorted[Math.floor(n * 0.75)];
      const iqr = q3 - q1;
      if (!Number.isFinite(iqr) || iqr <= 1e-6) return [];
      const k = sensitivity === "low" ? 3 : sensitivity === "high" ? 1.5 : 2;
      const lowerFence = q1 - k * iqr;
      const upperFence = q3 + k * iqr;
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
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
      return clusters.filter((c) => c.points.length > 0);
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
      for (let i = 0; i < points.length; i += 1) {
        const [timeMs, value] = points[i];
        windowSum += value;
        windowSumSq += value * value;
        while (windowStart < i && timeMs - points[windowStart][0] > windowMs) {
          const old = points[windowStart][1];
          windowSum -= old;
          windowSumSq -= old * old;
          windowStart += 1;
        }
        const count = i - windowStart + 1;
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
        const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
        clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });
        currentCluster = [];
      };
      for (const r of residuals) {
        if (r.flagged) currentCluster.push(r);
        else flushCluster();
      }
      flushCluster();
      return clusters.filter((c) => c.points.length > 0);
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
      for (const [, v] of points) {
        if (v < totalMin) totalMin = v;
        if (v > totalMax) totalMax = v;
      }
      const totalRange = totalMax - totalMin;
      if (!Number.isFinite(totalRange) || totalRange <= 1e-6) return [];
      const flatFraction = sensitivity === "low" ? 5e-3 : sensitivity === "high" ? 0.05 : 0.02;
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
          for (let k = runStart; k <= runEnd; k += 1) {
            clusterPoints.push({ timeMs: points[k][0], value: points[k][1], baselineValue: mid, residual: points[k][1] - mid });
          }
          clusters.push({ points: clusterPoints, maxDeviation: runMax - runMin, anomalyMethod: "persistence", flatRange: runMax - runMin });
        }
      };
      for (let i = 1; i < points.length; i += 1) {
        const v = points[i][1];
        const nextMin = Math.min(runMin, v);
        const nextMax = Math.max(runMax, v);
        if (nextMax - nextMin > flatThreshold) {
          flushRun(i - 1);
          runStart = i;
          runMin = v;
          runMax = v;
        } else {
          runMin = nextMin;
          runMax = nextMax;
        }
      }
      flushRun(points.length - 1);
      return clusters.filter((c) => c.points.length > 0);
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
      for (const p of deltaPoints) sumDeltas += p.delta;
      const meanDelta = sumDeltas / deltaPoints.length;
      let sumSqDev = 0;
      for (const p of deltaPoints) {
        const dev = p.delta - meanDelta;
        sumSqDev += dev * dev;
      }
      const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);
      if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 1e-6) return [];
      const threshold = rmsDeviation * this._getAnomalySensitivityThreshold(sensitivity);
      const clusters = [];
      let currentCluster = [];
      const flushCluster = () => {
        if (currentCluster.length === 0) return;
        const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
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
      return clusters.filter((c) => c.points.length > 0);
    }
    _applyAnomalyOverlapMode(clustersByMethod, overlapMode) {
      const methodKeys = Object.keys(clustersByMethod);
      if (methodKeys.length <= 1 || overlapMode === "all") {
        return methodKeys.flatMap((m) => clustersByMethod[m]);
      }
      const flaggedByMethod = {};
      for (const m of methodKeys) {
        flaggedByMethod[m] = new Set(clustersByMethod[m].flatMap((c) => c.points.map((p) => p.timeMs)));
      }
      const overlapTimes = /* @__PURE__ */ new Set();
      for (const m of methodKeys) {
        for (const t of flaggedByMethod[m]) {
          if (methodKeys.some((other) => other !== m && flaggedByMethod[other].has(t))) overlapTimes.add(t);
        }
      }
      if (overlapMode === "only") {
        const seen = /* @__PURE__ */ new Set();
        const result2 = [];
        for (const m of methodKeys) {
          for (const cluster of clustersByMethod[m]) {
            const pts = cluster.points.filter((p) => overlapTimes.has(p.timeMs));
            if (pts.length === 0) continue;
            const key = pts.map((p) => p.timeMs).join(",");
            if (seen.has(key)) continue;
            seen.add(key);
            const detectedByMethods = methodKeys.filter((other) => pts.some((p) => flaggedByMethod[other].has(p.timeMs)));
            result2.push({ ...cluster, points: pts, maxDeviation: pts.reduce((v, p) => Math.max(v, Math.abs(p.residual || 0)), 0), isOverlap: true, detectedByMethods });
          }
        }
        return result2;
      }
      const result = [];
      for (const m of methodKeys) {
        for (const cluster of clustersByMethod[m]) {
          const hasOverlap = cluster.points.some((p) => overlapTimes.has(p.timeMs));
          const detectedByMethods = hasOverlap ? methodKeys.filter((other) => cluster.points.some((p) => flaggedByMethod[other].has(p.timeMs))) : [m];
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
      return new Map(seriesSettings.map((entry) => {
        return [entry?.entity_id, normalizeHistorySeriesAnalysis$1(entry?.analysis)];
      }));
    }
    _getSeriesAnalysis(entityId, analysisMap = null) {
      const map = analysisMap || this._getSeriesAnalysisMap();
      return normalizeHistorySeriesAnalysis$1(map.get(entityId));
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
          analysis: analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null)
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
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
            if (analysis.show_trend_lines !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildTrendPoints(seriesItem.pts, analysis.trend_method, analysis.trend_window)
            };
          }).filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2).filter(Boolean),
          rateSeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
            if (analysis.show_rate_of_change !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              pts: this._buildRateOfChangePoints(seriesItem.pts, analysis.rate_window)
            };
          }).filter((seriesItem) => Array.isArray(seriesItem.pts) && seriesItem.pts.length >= 2).filter(Boolean),
          deltaSeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
            if (analysis.show_summary_stats !== true) {
              return null;
            }
            return {
              entityId: seriesItem.entityId,
              ...this._buildSummaryStats(seriesItem.pts)
            };
          }).filter((entry) => entry && Number.isFinite(entry.min) && Number.isFinite(entry.max) && Number.isFinite(entry.mean)),
          anomalySeries: visibleSeries.map((seriesItem) => {
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
            if (analysis.show_anomalies !== true) return null;
            const clustersByMethod = {};
            const methods = analysis.anomaly_methods;
            if (methods.includes("trend_residual")) {
              const c = this._buildAnomalyClusters(seriesItem.pts, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["trend_residual"] = c;
            }
            if (methods.includes("rate_of_change")) {
              const c = this._buildRateOfChangeAnomalyClusters(seriesItem.pts, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["rate_of_change"] = c;
            }
            if (methods.includes("iqr")) {
              const c = this._buildIQRAnomalyClusters(seriesItem.pts, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["iqr"] = c;
            }
            if (methods.includes("rolling_zscore")) {
              const c = this._buildRollingZScoreAnomalyClusters(seriesItem.pts, analysis.anomaly_zscore_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["rolling_zscore"] = c;
            }
            if (methods.includes("persistence")) {
              const c = this._buildPersistenceAnomalyClusters(seriesItem.pts, analysis.anomaly_persistence_window, analysis.anomaly_sensitivity);
              if (c.length > 0) clustersByMethod["persistence"] = c;
            }
            if (methods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {
              const compPts = allComparisonWindowsData[analysis.anomaly_comparison_window_id]?.[seriesItem.entityId];
              if (Array.isArray(compPts) && compPts.length >= 3) {
                const c = this._buildComparisonWindowAnomalyClusters(seriesItem.pts, compPts, analysis.anomaly_sensitivity);
                if (c.length > 0) clustersByMethod["comparison_window"] = c;
              }
            }
            const anomalyClusters = this._applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);
            return anomalyClusters.length > 0 ? { entityId: seriesItem.entityId, anomalyClusters } : null;
          }).filter(Boolean)
        };
      }
    }
    async _drawChart(histResult, statsResult, events, t0, t1, options = {}) {
      hideTooltip$1(this);
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
      seriesSettings.forEach((seriesSetting, i) => {
        const entityId = seriesSetting.entity_id;
        const domain = entityId.split(".")[0];
        if (domain === "binary_sensor") {
          const stateList2 = this._buildEntityStateList(entityId, histResult, statsResult);
          const spans = this._buildBinaryStateSpans(stateList2, t0, t1);
          if (spans.length) {
            binaryBackgrounds.push({
              entityId,
              label: entityName$2(this._hass, entityId) || entityId,
              color: seriesSetting.color || COLORS$2[i % COLORS$2.length],
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
            color: seriesSetting.color || COLORS$2[i % COLORS$2.length],
            side: axisMap.size === 0 ? "left" : "right",
            values: []
          };
          axisMap.set(axisKey, axis);
          axes.push(axis);
        }
        for (const s of stateList) {
          const v = parseFloat(s.s);
          if (!isNaN(v)) {
            pts.push([Math.round(s.lu * 1e3), v]);
            axis.values.push(v);
          }
        }
        if (pts.length) {
          series.push({
            entityId,
            legendEntityId: entityId,
            label: entityName$2(this._hass, entityId) || entityId,
            unit,
            pts,
            color: seriesSetting.color || COLORS$2[i % COLORS$2.length],
            axisKey
          });
        }
      });
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
            label: entityName$2(this._hass, entityId) || entityId,
            unit,
            color: seriesSetting.color || COLORS$2[index % COLORS$2.length],
            pts: points
          });
        }
      }
      const allComparisonWindowsData = {};
      for (const seriesItem of visibleSeries) {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
            seriesSettings.findIndex((s) => s.entity_id === seriesItem.entityId);
            const stateList = this._buildEntityStateList(seriesItem.entityId, compResult.histResult, compResult.statsResult || {});
            const pts = [];
            for (const s of stateList) {
              const v = parseFloat(s.s);
              if (!isNaN(v)) pts.push([Math.round(s.lu * 1e3) - compResult.time_offset_ms, v]);
            }
            if (pts.length) {
              allComparisonWindowsData[windowId][seriesItem.entityId] = pts;
            }
          }
        }
      }
      const analysisEntityIds = visibleSeries.filter((s) => {
        const a = analysisMap.get(s.entityId) || {};
        return a.show_anomalies || a.show_trend_lines || a.show_summary_stats || a.show_rate_of_change;
      }).map((s) => s.entityId);
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
      const minChartHeight = series.length ? 280 : binaryBackgrounds.length ? 100 : 280;
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
      const { w, h } = setupCanvas$1(canvas, chartStage || wrap, availableHeight, canvasWidth);
      const renderer = new ChartRenderer$1(canvas, w, h);
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
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
        if (this._seriesShouldHideSource(analysis, hasSelectedComparisonWindow)) {
          hiddenSourceEntityIds.add(seriesItem.entityId);
        }
        if (analysis.hide_source_series === true && analysis.show_delta_analysis === true && hasSelectedComparisonWindow) {
          hiddenComparisonEntityIds.add(seriesItem.entityId);
        }
      });
      const anyTrendCrosshairs = visibleSeries.some((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
      series.forEach((s) => {
        s.axis = axisLookup.get(s.axisKey) || activeAxes[0] || resolvedAxes[0];
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
      const mainSeriesHoverOpacity = comparisonPreviewActive ? hoveringDifferentComparison ? 0.15 : 0.25 : 1;
      const anyHiddenSourceSeries = hiddenSourceEntityIds.size > 0;
      const hoverSeries = visibleSeries.filter((seriesItem) => !hiddenSourceEntityIds.has(seriesItem.entityId)).map((seriesItem) => ({
        ...seriesItem,
        hoverOpacity: mainSeriesHoverOpacity
      }));
      const summaryHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.78 : 0.42),
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.82 : 0.34,
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
            color: hexToRgba(seriesItem.color, anyHiddenSourceSeries ? 0.78 : 0.42),
            axis: seriesItem.axis,
            hoverOpacity: anyHiddenSourceSeries ? 0.82 : 0.34,
            summaryType: "max",
            summary: true
          }
        ];
      });
      const thresholdHoverSeries = visibleSeries.flatMap((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
          for (const s of stateList) {
            const v = parseFloat(s.s);
            if (!isNaN(v)) {
              winPts.push([Math.round(s.lu * 1e3) - win.time_offset_ms, v]);
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
          const baseColor = seriesSetting.color || COLORS$2[seriesSettings.indexOf(seriesSetting) % COLORS$2.length];
          const isHoveredComparison = !!hoveredComparisonWindowId && win.id === hoveredComparisonWindowId;
          const isSelectedComparison = !!selectedComparisonWindowId && win.id === selectedComparisonWindowId;
          const comparisonLineOpacity = isHoveredComparison ? 0.85 : hoveringDifferentComparison && isSelectedComparison ? 0.25 : 0.85;
          comparisonHoverSeries.push({
            entityId: `${win.id}:${entityId}`,
            relatedEntityId: entityId,
            label: seriesSetting.label || entityName$2(this._hass, entityId) || entityId,
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
      for (const s of visibleSeries) {
        if (hiddenSourceEntityIds.has(s.entityId)) {
          continue;
        }
        this._drawSeriesLine(renderer, s.pts, s.color, renderT0, renderT1, s.axis.min, s.axis.max, {
          lineOpacity: mainSeriesHoverOpacity,
          lineWidth: this._config?.comparison_hover_active === true ? 1.25 : void 0
        });
      }
      const trendHoverSeries = trendSeries.map((seriesItem) => {
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
        const analysis = analysisMap.get(trend.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
            lineWidth: summarySeries.summaryType === "mean" ? 1.8 : 1.1,
            dashed: false,
            dotted: summarySeries.summaryType !== "mean"
          }
        );
      });
      thresholdHoverSeries.forEach((thresholdSeries) => {
        const axis = thresholdSeries.axis;
        if (!axis) {
          return;
        }
        const thresholdAnalysis = analysisMap.get(thresholdSeries.relatedEntityId) || normalizeHistorySeriesAnalysis$1(null);
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
          const normalClusters = visibleAnomalyClusters.filter((c) => !c.isOverlap);
          const overlapClusters = visibleAnomalyClusters.filter((c) => c.isOverlap === true);
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
            const overlapMode = (analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null)).anomaly_overlap_mode;
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
            const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
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
      const effectiveComparisonHoverSeries = comparisonHoverSeries.filter((entry) => {
        return !hiddenComparisonEntityIds.has(entry.relatedEntityId || entry.entityId);
      });
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
      const regionsArray = Array.isArray(regions) ? regions : regions ? [regions] : [];
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
        const analysis = analysisMap.get(seriesItem.entityId) || normalizeHistorySeriesAnalysis$1(null);
        if (analysis.show_anomalies !== true) continue;
        const clusters = anomalyClustersMap.get(seriesItem.entityId) || [];
        if (!clusters.length) continue;
        const pts = seriesItem.pts;
        let tolerance = 6e4;
        if (Array.isArray(pts) && pts.length >= 2) {
          const intervals = [];
          for (let i = 1; i < pts.length; i++) {
            const diff = pts[i][0] - pts[i - 1][0];
            if (diff > 0) intervals.push(diff);
          }
          if (intervals.length) {
            intervals.sort((a, b) => a - b);
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
      events.sort((a, b) => a.time - b.time || a.delta - b.delta);
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
      return seriesItem.anomalyClusters.filter((cluster) => {
        return !visibleEvents.some((event) => {
          return this._eventMatchesAnomalyCluster(event, seriesItem.entityId, cluster);
        });
      });
    }
    _buildAnomalyAnnotationPrefill(regions) {
      const regionsArray = Array.isArray(regions) ? regions : regions ? [regions] : [];
      const validRegions = regionsArray.filter((r) => r?.cluster?.points?.length > 0);
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
        const peakPoint = points.reduce((peak, p) => !peak || Math.abs(p.residual) > Math.abs(peak.residual) ? p : peak, null);
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
      const detectedByMethods = !isSingleRegion ? null : Array.isArray(primaryRegion.cluster?.detectedByMethods) && primaryRegion.cluster.detectedByMethods.length > 1 ? primaryRegion.cluster.detectedByMethods : null;
      let message;
      let annotation;
      if (isSingleRegion) {
        const s = annotationSections[0];
        const peakPoint = s.peakPoint;
        message = `${this._formatAnomalyPrefillValue(peakPoint.residual, unit)} ${s.methodLabel.toLowerCase()} anomaly in ${label}`;
        const lines = [s.description, `Alert: ${s.alertLine}`];
        if (detectedByMethods) {
          lines.push(`Confirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m) => ANOMALY_METHOD_LABELS2[m] || m).join(", ")}.`);
        }
        lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c) => c.toUpperCase())}.`);
        annotation = lines.join("\n");
      } else {
        message = `Multi-method anomaly in ${label}`;
        const lines = [];
        annotationSections.forEach((s) => {
          lines.push(`[${s.methodLabel}]`);
          lines.push(s.description);
          lines.push(`Alert: ${s.alertLine}`);
          lines.push("");
        });
        lines.push(`Sensitivity: ${String(primaryRegion.sensitivity || "medium").replace(/^./, (c) => c.toUpperCase())}.`);
        annotation = lines.join("\n").trim();
      }
      const allStartPoints = validRegions.map((r) => r.cluster.points[0]?.timeMs).filter(Number.isFinite);
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
      navigateToDataPointsHistory$2(this, {
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
        const x = renderer.xOf(timestamp, t0, t1);
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
        const y = hasNumericTarget ? renderer.yOf(value, targetSeries.axis.min, targetSeries.axis.max) : renderer.pad.top + 12;
        const color = event.color || targetSeries.color || "#03a9f4";
        const outerRadius = showIcons ? 13 : 6;
        const innerRadius = showIcons ? 11 : 4;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        if (overlay && showIcons) {
          const iconEl = document.createElement("button");
          iconEl.type = "button";
          iconEl.className = "chart-event-icon";
          iconEl.style.left = `${x}px`;
          iconEl.style.top = `${y + yOffset}px`;
          iconEl.title = event.message || "Open related history";
          iconEl.setAttribute("aria-label", event.message || "Open related history");
          iconEl.innerHTML = `<ha-icon icon="${esc$3(event.icon || "mdi:bookmark")}" style="color:${contrastColor$3(color)}"></ha-icon>`;
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
          hitEl.style.left = `${x}px`;
          hitEl.style.top = `${y + yOffset}px`;
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
          x,
          y
        });
      }
      return hits;
    }
    _buildBinaryStateSpans(stateList, t0, t1) {
      if (!Array.isArray(stateList) || !stateList.length) {
        return [];
      }
      const spans = [];
      for (let i = 0; i < stateList.length; i++) {
        const current = stateList[i];
        const currentTime = Math.round((current?.lu || 0) * 1e3);
        const next = stateList[i + 1];
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
          const y = rowOffset + renderer.yOf(tick, axis.min, axis.max);
          const formatted = renderer._formatAxisTick(tick, axis.unit);
          labelsHtml += `<div class="chart-axis-label" style="top:${Math.round(y) + 1}px;right:${labelRight}px;text-align:right;">${esc$3(formatted)}</div>`;
        }
        if (axis.unit) {
          const unitY = rowOffset + Math.max(0, renderer.pad.top - 18);
          labelsHtml += `<div class="chart-axis-unit" style="top:${unitY}px;right:${labelRight}px;text-align:right;">${esc$3(axis.unit)}</div>`;
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
        (s) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc$3(s.legendEntityId || s.entityId)}"
          aria-pressed="${this._hiddenSeries.has(s.legendEntityId || s.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(s.legendEntityId || s.entityId) ? "Show" : "Hide"} ${esc$3(s.label)}"
        >
          <div class="legend-line" style="background:${esc$3(s.color)}"></div>
          ${esc$3(s.label)}${s.unit ? ` (${esc$3(s.unit)})` : ""}
        </button>`
      ).join("") + binaryBackgrounds.map((bg) => `
        <button
          type="button"
          class="legend-item legend-toggle"
          data-entity-id="${esc$3(bg.entityId)}"
          aria-pressed="${this._hiddenSeries.has(bg.entityId) ? "false" : "true"}"
          title="${this._hiddenSeries.has(bg.entityId) ? "Show" : "Hide"} ${esc$3(bg.label)} ${esc$3(this._binaryOnLabel(bg.entityId))}"
        >
          <div class="legend-line" style="background:${esc$3(bg.color)};opacity:0.35"></div>
          ${esc$3(bg.label)} (${esc$3(this._binaryOnLabel(bg.entityId))})
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
    confirmDestructiveAction: confirmDestructiveAction$1,
    contrastColor: contrastColor$2,
    deleteEvent,
    DOMAIN: DOMAIN$1,
    deviceIcon,
    deviceName,
    entityIcon,
    entityName: entityName$1,
    esc: esc$2,
    fetchEvents: fetchEvents$2,
    fmtDateTime: fmtDateTime$1,
    labelIcon,
    labelName,
    navigateToDataPointsHistory: navigateToDataPointsHistory$1,
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
      }, `${DOMAIN$1}_event_recorded`).then((unsub) => {
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
      navigateToDataPointsHistory$1(this, {
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
        ${cfg.title ? `<div class="card-header">${esc$2(cfg.title)}</div>` : ""}
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
        this.shadowRoot.getElementById("search").addEventListener("input", (e) => {
          this._searchQuery = e.target.value.toLowerCase();
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
      const entityIds = cfg.entity ? [cfg.entity] : cfg.entities ? cfg.entities.map((e) => typeof e === "string" ? e : e.entity) : void 0;
      this._allEvents = await fetchEvents$2(
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
      return this._allEvents.filter((e) => {
        const haystack = [
          e.message.toLowerCase(),
          (e.annotation || "").toLowerCase(),
          ...(e.entity_ids || []).map((id) => id.toLowerCase())
        ];
        if (msgFilter && !haystack.some((h) => h.includes(msgFilter))) return false;
        if (this._searchQuery && !haystack.some((h) => h.includes(this._searchQuery))) return false;
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
      listEl.innerHTML = slice.map((e) => {
        const annText = e.annotation && e.annotation !== e.message ? e.annotation : "";
        const color = e.color || "#03a9f4";
        const icon = e.icon || "mdi:bookmark";
        const iconColor = contrastColor$2(color);
        const entities = e.entity_ids || [];
        const devices = e.device_ids || [];
        const areas = e.area_ids || [];
        const labels = e.label_ids || [];
        const hasRelated = entities.length || devices.length || areas.length || labels.length;
        const isExpandable = !showFullMessage && annText;
        const isHidden = (this._config.hidden_event_ids || []).includes(e.id);
        const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
        const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
        const historyLinkHref = this._getHistoryLinkForEvent(e);
        const historyLink = `<a class="ev-history-link" href="${esc$2(historyLinkHref)}" data-event-id="${esc$2(e.id)}" title="Open related data point history" aria-label="Open related data point history"><ha-icon icon="mdi:history"></ha-icon><span class="ev-time-below" title="${esc$2(fmtDateTime$1(e.timestamp))}">${esc$2(fmtDateTime$1(e.timestamp))}</span></a>`;
        const isSimple = !annText && !hasRelated;
        return `
        <div class="event-item${isExpandable ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}" data-id="${esc$2(e.id)}">
          <div class="ev-icon-wrap" style="background:${esc$2(color)}">
            <ha-icon class="ev-icon-main" icon="${esc$2(icon)}" style="--mdc-icon-size:18px;color:${esc$2(iconColor)}"></ha-icon>
            <button class="ev-visibility-btn" type="button" data-event-id="${esc$2(e.id)}" title="${esc$2(visibilityLabel)}" aria-label="${esc$2(visibilityLabel)}">
              <ha-icon icon="${esc$2(visibilityIcon)}"></ha-icon>
            </button>
          </div>
          <div class="ev-body">
            <div class="ev-header">
              <div class="ev-header-text">
                <span class="ev-message">
                  ${esc$2(e.message)}
                  ${e.dev ? `<span class="ev-dev-badge">DEV</span>` : ""}
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
            ${annText ? `<div class="ev-full-message${showFullMessage ? "" : " hidden"}">${esc$2(annText)}</div>` : ""}
            ${showEntities && hasRelated ? `
              <div class="ev-entities">
                ${entities.map((eid) => `
                  <button class="ev-entity-chip" data-entity="${esc$2(eid)}">
                    <ha-icon icon="${esc$2(entityIcon(this._hass, eid))}"></ha-icon>
                    ${esc$2(entityName$1(this._hass, eid))}
                  </button>`).join("")}
                ${devices.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc$2(deviceIcon(this._hass, id))}"></ha-icon>
                    ${esc$2(deviceName(this._hass, id))}
                  </span>`).join("")}
                ${areas.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc$2(areaIcon(this._hass, id))}"></ha-icon>
                    ${esc$2(areaName(this._hass, id))}
                  </span>`).join("")}
                ${labels.map((id) => `
                  <span class="ev-entity-chip">
                    <ha-icon icon="${esc$2(labelIcon(this._hass, id))}"></ha-icon>
                    ${esc$2(labelName(this._hass, id))}
                  </span>`).join("")}
              </div>
            ` : ""}
            ${showActions ? `
            <div class="edit-form" id="edit-${esc$2(e.id)}">
              <ha-textfield class="edit-msg" label="Message" style="width:100%"></ha-textfield>
              <ha-textarea class="edit-ann" label="Full message / annotation" autogrow style="width:100%"></ha-textarea>
              <div class="edit-row">
                <ha-icon-picker class="edit-icon-picker" style="flex:1"></ha-icon-picker>
                <button class="color-swatch-btn" title="Choose colour" style="background:${esc$2(color)}">
                  <span class="color-swatch-inner" style="background:${esc$2(color)}"></span>
                  <input type="color" class="edit-color" value="${esc$2(color)}" />
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
          item.addEventListener("click", (e) => {
            if (e.target.closest(".ev-actions, .ev-entity-chip, .edit-form, ha-icon-button, ha-button")) return;
            const ann = item.querySelector(".ev-full-message");
            if (ann) ann.classList.toggle("hidden");
          });
        });
      }
      listEl.querySelectorAll(".ev-history-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          const item = e.target.closest(".event-item");
          const id = item?.dataset.id;
          const record = this._allEvents.find((ev) => ev.id === id);
          if (record) this._navigateToEventHistory(record);
        });
      });
      listEl.querySelectorAll(".ev-visibility-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatchEvent(new CustomEvent("hass-datapoints-toggle-event-visibility", {
            bubbles: true,
            composed: true,
            detail: { eventId: btn.dataset.eventId }
          }));
        });
      });
      listEl.querySelectorAll(".ev-entity-chip").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const entityId = btn.dataset.entity;
          if (entityId) {
            const ev = new Event("hass-more-info", { bubbles: true, composed: true });
            ev.detail = { entityId };
            this.dispatchEvent(ev);
          }
        });
      });
      listEl.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const item = e.target.closest(".event-item");
          const id = item?.dataset.id;
          if (!id) return;
          const message = item.querySelector(".ev-message")?.textContent?.trim() || "this record";
          const confirmed = await confirmDestructiveAction$1(this, {
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
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const item = e.target.closest(".event-item");
          const id = item?.dataset.id;
          if (!id) return;
          const form = this.shadowRoot.getElementById(`edit-${id}`);
          if (!form) return;
          const isOpen = form.classList.contains("open");
          this.shadowRoot.querySelectorAll(".edit-form.open").forEach((f) => f.classList.remove("open"));
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
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const form = e.target.closest(".edit-form");
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
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.target.closest(".edit-form").classList.remove("open");
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
  class HassRecordsQuickCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
    }
    setConfig(config) {
      this._config = config || {};
      if (this._rendered) this._render();
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) this._render();
    }
    _render() {
      this._rendered = true;
      const cfg = this._config;
      const cfgIcon = cfg.icon || "mdi:bookmark";
      const cfgColor = cfg.color || AMBER;
      const hasTitle = !!cfg.title;
      const showAnnotation = !!cfg.show_annotation;
      this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
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
        .card-header { display: none; }
        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .input-row ha-textfield { flex: 1; }
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
          border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
          border-radius: 12px;
          background: var(--card-background-color, var(--primary-background-color, #fff));
          color: var(--primary-text-color);
          font: inherit;
          line-height: 1.45;
        }
        ha-button {
          --mdc-theme-primary: ${esc$3(cfgColor)};
        }
        ha-button ha-icon {
          --mdc-icon-size: 18px;
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
        .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
        .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
      </style>
      <ha-card>
        ${hasTitle ? `
        <div class="card-header">
          <ha-icon class="header-icon" icon="${esc$3(cfgIcon)}"></ha-icon>
          ${esc$3(cfg.title)}
        </div>` : ""}
        <div class="input-row">
          <ha-textfield id="msg" placeholder="${esc$3(cfg.placeholder || "Note something…")}" style="flex:1"></ha-textfield>
          <ha-button id="btn" raised>
            <ha-icon icon="${esc$3(cfgIcon)}" slot="icon"></ha-icon>
            Record
          </ha-button>
        </div>
        ${showAnnotation ? `
        <div class="annotation-row">
          <label class="annotation-label" for="ann">Annotation</label>
          <textarea id="ann" placeholder="Detailed note shown on chart hover…"></textarea>
        </div>
        ` : ""}
        <div class="feedback" id="feedback"></div>
      </ha-card>`;
      this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());
      const msgEl = this.shadowRoot.getElementById("msg");
      if (msgEl) {
        msgEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this._record();
          }
        });
      }
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
      const cfg = this._config;
      const data = {
        message,
        icon: cfg.icon || "mdi:bookmark",
        color: cfg.color || AMBER
      };
      const annEl = this.shadowRoot.getElementById("ann");
      const annotation = (annEl?.value || "").trim();
      if (annotation) data.annotation = annotation;
      const entityIds = cfg.entity ? [cfg.entity] : cfg.entities ? Array.isArray(cfg.entities) ? cfg.entities : [cfg.entities] : [];
      if (entityIds.length) data.entity_ids = entityIds;
      const fb = this.shadowRoot.getElementById("feedback");
      try {
        await this._hass.callService(DOMAIN$2, "record", data);
        window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
        msgEl.value = "";
        if (annEl) annEl.value = "";
        fb.className = "feedback ok";
        fb.textContent = "Recorded!";
        fb.style.display = "block";
        setTimeout(() => fb.style.display = "none", 2500);
      } catch (e) {
        fb.className = "feedback err";
        fb.textContent = `Error: ${e.message || "unknown error"}`;
        fb.style.display = "block";
        console.error("[hass-datapoints quick-card]", e);
      }
      btn.disabled = false;
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
  const {
    attachTooltipBehaviour,
    COLORS: COLORS$1,
    contrastColor: contrastColor$1,
    DOMAIN,
    esc: esc$1,
    fetchEvents: fetchEvents$1,
    fmtDateTime,
    fmtRelativeTime,
    hideTooltip,
    navigateToDataPointsHistory,
    setupCanvas,
    showTooltip,
    ChartRenderer
  } = shared;
  const SENSOR_STYLE = `
  :host { display: block; height: 100%; }
  ha-card {
    padding: 0;
    overflow: hidden;
    height: 100%;
  }

  .card-shell {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: calc(
      (var(--hr-body-rows, var(--row-size, 1)) * (var(--row-height, 1px) + var(--row-gap, 0px)))
      - var(--row-gap, 0px)
    );
    min-height: 0;
    position: relative;
  }

  /* Mirrors the default HA sensor card structure */
  .header {
    padding: 8px 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .name {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    line-height: 40px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--state-icon-color, var(--secondary-text-color));
  }
  .icon ha-state-icon {
    --mdc-icon-size: 24px;
  }

  .info {
    display: flex;
    align-items: baseline;
    padding: 0px 16px 16px;
    margin-top: -4px;
    line-height: var(--ha-line-height-condensed);
  }
  .value {
    font-size: var(--ha-font-size-3xl);
    font-weight: var(--ha-font-size-3xl);
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--primary-text-color);
  }
  .measurement {
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
  }

  .chart-wrap {
    position: relative;
    height: 100%;
    padding: 0;
    box-sizing: border-box;
    overflow: visible;
    min-height: 78px;
  }
  .chart-viewport {
    position: relative;
    height: 100%;
    overflow: hidden;
  }
  canvas { display: block; }
  .icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Annotation icon circles – border adapts to colour scheme */
  .ann-icon {
    position: absolute;
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    cursor: pointer;
    /* Use the card background so the ring blends with the theme */
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }
  @media (prefers-color-scheme: dark) {
    .ann-icon {
      box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1e);
    }
  }
  .ann-icon ha-icon {
    --mdc-icon-size: 12px;
    /* icon color set imperatively via contrastColor() */
  }
  .loading {
    text-align: center;
    padding: 28px 16px 24px;
    color: var(--secondary-text-color);
  }
  .tooltip {
    position: fixed;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8em;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: none;
    display: none;
    max-width: 220px;
    z-index: 10;
    color: var(--primary-text-color);
  }
  .tt-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
  }
  .tt-time { color: var(--secondary-text-color); margin-bottom: 3px; }
  .tt-value { color: var(--secondary-text-color); margin-bottom: 4px; }
  .tt-message { font-weight: 500; }
  .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
  .tt-entities { color: var(--secondary-text-color); margin-top: 6px; white-space: pre-wrap; }

  /* ── Row 4: Annotation list (optional) ── */
  .ann-section {
    border-top: 1px solid var(--divider-color, #eee);
    display: none;
    flex: 1 1 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .ann-list {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }
  .ann-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
    cursor: default;
  }
  .ann-item:last-child { border-bottom: none; }
  .ann-item.simple { align-items: center; }
  .ann-item.expandable { cursor: pointer; }

  /* Coloured icon circle – replaces the plain dot */
  .ann-icon-wrap {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }
  @media (prefers-color-scheme: dark) {
    .ann-icon-wrap { box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1e); }
  }
  .ann-icon-main {
    transition: opacity 120ms ease;
  }
  .ann-visibility-btn {
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
  .ann-visibility-btn ha-icon {
    --mdc-icon-size: 15px;
  }
  .ann-item:hover .ann-visibility-btn,
  .ann-item.is-hidden .ann-visibility-btn,
  .ann-visibility-btn:focus-visible {
    opacity: 1;
  }
  .ann-item:hover .ann-icon-main,
  .ann-item.is-hidden .ann-icon-main {
    opacity: 0.22;
  }

  .ann-body { flex: 1; min-width: 0; }
  .ann-header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: nowrap;
  }
  .ann-msg {
    font-size: 0.85em;
    font-weight: 500;
    color: var(--primary-text-color);
    word-break: break-word;
    flex: 1;
    min-width: 0;
  }
  .ann-dev-badge {
    display: inline-block;
    font-size: 0.68em; font-weight: 700; letter-spacing: 0.04em;
    color: #fff;
    background: #ff9800;
    padding: 1px 5px; border-radius: 4px;
    vertical-align: middle; margin-left: 4px;
  }
  .ann-time {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ann-time-wrap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .ann-history-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: var(--secondary-text-color);
    padding: 0;
    cursor: pointer;
  }
  .ann-history-btn ha-icon { --mdc-icon-size: 14px; }
  .ann-note {
    font-size: 0.78em;
    color: var(--secondary-text-color);
    margin-top: 2px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .ann-note.hidden { display: none; }

  /* "..." expand chip shown when annotation is hidden */
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
    background: var(--secondary-background-color, rgba(0,0,0,0.06));
    border: none;
    cursor: pointer;
    font-family: inherit;
  }
  .ann-expand-chip:hover { background: var(--divider-color, rgba(0,0,0,0.12)); }

  /* Pagination bar – sits outside the scroll area */
  .ann-pagination {
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-top: 1px solid var(--divider-color, #eee);
    font-size: 0.8em;
    color: var(--secondary-text-color);
  }
  .ann-empty {
    text-align: center;
    padding: 16px;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }
`;
  class HassRecordsSensorCard extends HTMLElement {
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
      this._annPage = 0;
      this._hiddenEventIds = /* @__PURE__ */ new Set();
      this._canvasClickHandler = null;
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
        // max number of records to show (null = all)
        ...config
      };
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._rendered = true;
        this._buildShell();
        this._setupAutoRefresh();
        this._setupResizeObserver();
        this._load();
      }
      this._updateState();
    }
    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }
    _buildShell() {
      const cfg = this._config;
      this.shadowRoot.innerHTML = `
      <style>${SENSOR_STYLE}</style>
      <ha-card class=" with-fixed-footer action">
        <div class="card-shell">
          <div class="card-body">
            <div class="header">
              <div class="name" id="sensor-name">${esc$1(cfg.name || cfg.entity)}</div>
              <div class="icon">
                <ha-state-icon id="sensor-state-icon"></ha-state-icon>
              </div>
            </div>
  
            <div class="info">
              <span class="value" id="sensor-value">—</span>
              <span class="measurement" id="sensor-unit"></span>
            </div>
  
            <div class="footer">
              <div class="chart-wrap">
                <div class="chart-viewport">
                  <div class="loading" id="loading">Loading…</div>
                  <canvas id="chart" style="display:none"></canvas>
                  <div class="icon-overlay" id="icon-overlay"></div>
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
          <div class="ann-section" id="ann-section">
            <div class="ann-list" id="ann-list"></div>
            <div class="ann-pagination" id="ann-pagination" style="display:none">
              <ha-icon-button id="ann-prev" label="Previous page">
                <ha-icon icon="mdi:chevron-left"></ha-icon>
              </ha-icon-button>
              <span id="ann-page-info"></span>
              <ha-icon-button id="ann-next" label="Next page">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </ha-icon-button>
            </div>
          </div>
        </div>
      </ha-card>`;
      this._applyLayoutSizing();
      this.shadowRoot.getElementById("ann-prev").addEventListener("click", () => {
        if (this._annPage > 0) {
          this._annPage--;
          this._renderAnnList(this._lastEvents || []);
          this.shadowRoot.getElementById("ann-list").scrollTop = 0;
        }
      });
      this.shadowRoot.getElementById("ann-next").addEventListener("click", () => {
        const total = (this._lastEvents || []).length;
        const pageSize = this._config.records_page_size;
        const pages = pageSize ? Math.ceil(total / pageSize) : 1;
        if (this._annPage < pages - 1) {
          this._annPage++;
          this._renderAnnList(this._lastEvents || []);
          this.shadowRoot.getElementById("ann-list").scrollTop = 0;
        }
      });
    }
    _updateState() {
      if (!this._hass || !this._config) return;
      const entityId = this._config.entity;
      const stateObj = this._hass.states[entityId];
      const nameEl = this.shadowRoot.getElementById("sensor-name");
      const valueEl = this.shadowRoot.getElementById("sensor-value");
      const unitEl = this.shadowRoot.getElementById("sensor-unit");
      const stateIconEl = this.shadowRoot.getElementById("sensor-state-icon");
      if (nameEl) {
        nameEl.textContent = this._config.name || stateObj && stateObj.attributes && stateObj.attributes.friendly_name || entityId;
      }
      if (!stateObj) return;
      if (valueEl) valueEl.textContent = stateObj.state;
      if (unitEl) unitEl.textContent = stateObj.attributes.unit_of_measurement || "";
      if (stateIconEl) {
        stateIconEl.stateObj = stateObj;
        stateIconEl.hass = this._hass;
      }
    }
    _setupAutoRefresh() {
      this._hass.connection.subscribeEvents(() => {
        this._load();
      }, `${DOMAIN}_event_recorded`).then((unsub) => {
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
      return (events || []).filter((ev) => !this._hiddenEventIds.has(ev.id));
    }
    _toggleEventVisibility(eventId) {
      if (this._hiddenEventIds.has(eventId)) this._hiddenEventIds.delete(eventId);
      else this._hiddenEventIds.add(eventId);
      if (this._lastHistResult !== null) {
        this._drawChart(this._lastHistResult, this._lastEvents || [], this._lastT0, this._lastT1);
      } else {
        this._renderAnnList(this._lastEvents || []);
      }
    }
    _navigateToEventHistory(ev) {
      navigateToDataPointsHistory(this, {
        entity_id: [
          this._config?.entity,
          ...ev && ev.entity_ids || []
        ].filter(Boolean),
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || []
      }, {
        start_time: Number.isFinite(this._lastT0) ? new Date(this._lastT0).toISOString() : null,
        end_time: Number.isFinite(this._lastT1) ? new Date(this._lastT1).toISOString() : null
      });
    }
    _applyLayoutSizing() {
      const body = this.shadowRoot?.querySelector(".card-body");
      const list = this.shadowRoot?.querySelector(".ann-list");
      if (!body) return;
      if (!this._config?.show_records) {
        body.style.setProperty("--hr-body-rows", String(this._gridRows()));
        if (list) list.style.setProperty("--hr-list-rows", "1");
        return;
      }
      const totalRows = Math.max(3, this._gridRows());
      const bodyRows = Math.max(2, this._bodyRows(totalRows));
      const listRows = Math.max(1, totalRows - bodyRows);
      body.style.setProperty("--hr-body-rows", String(bodyRows));
      if (list) list.style.setProperty("--hr-list-rows", String(listRows));
    }
    _bodyHeightPx() {
      const styles = getComputedStyle(this);
      const rowHeight = Number.parseFloat(styles.getPropertyValue("--row-height")) || 0;
      const rowGap = Number.parseFloat(styles.getPropertyValue("--row-gap")) || 0;
      const totalRows = Math.max(this._config?.show_records ? 3 : 2, this._gridRows());
      const bodyRows = this._config?.show_records ? Math.max(2, this._bodyRows(totalRows)) : totalRows;
      return Math.max(0, bodyRows * (rowHeight + rowGap) - rowGap);
    }
    async _load() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now - this._config.hours_to_show * 3600 * 1e3);
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
        this._drawChart(histResult || {}, events, t0, t1);
      } catch (err) {
        const loadEl = this.shadowRoot.getElementById("loading");
        if (loadEl) loadEl.textContent = "Failed to load data.";
        console.error("[hass-datapoints sensor-card]", err);
      }
    }
    _getHistoryStatesForEntity(entityId, histResult) {
      if (!histResult) return [];
      if (Array.isArray(histResult?.[entityId])) return histResult[entityId];
      if (Array.isArray(histResult)) {
        if (Array.isArray(histResult[0])) return histResult[0] || [];
        if (histResult.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
          return histResult.filter((entry) => entry.entity_id === entityId);
        }
      }
      if (histResult && typeof histResult === "object") {
        if (Array.isArray(histResult.result?.[entityId])) return histResult.result[entityId];
        if (Array.isArray(histResult.result?.[0])) return histResult.result[0] || [];
      }
      return [];
    }
    _drawChart(histResult, events, t0, t1) {
      this._lastHistResult = histResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;
      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const header = this.shadowRoot.querySelector(".header");
      const info = this.shadowRoot.querySelector(".info");
      const footer = this.shadowRoot.querySelector(".footer");
      const footerStyles = footer ? getComputedStyle(footer) : null;
      const reservedHeight = (header?.offsetHeight || 0) + (info?.offsetHeight || 0) + (Number.parseFloat(footerStyles?.marginTop || "0") || 0);
      const bodyHeight = this._bodyHeightPx();
      const chartHeight = Math.max(78, Math.round(bodyHeight - reservedHeight), wrap?.clientHeight || 0);
      const { w, h } = setupCanvas(canvas, wrap, chartHeight);
      const renderer = new ChartRenderer(canvas, w, h);
      const topPadPx = Math.max(6, Math.round(h * 0.05));
      renderer.pad = { top: topPadPx, right: 0, bottom: 0, left: 0 };
      renderer.clear();
      const series = [];
      const allVals = [];
      const entityId = this._config.entity;
      const lineColor = this._config.graph_color || COLORS$1[0];
      const unit = this._hass?.states?.[entityId]?.attributes?.unit_of_measurement || "";
      const stateList = this._getHistoryStatesForEntity(entityId, histResult);
      const pts = [];
      for (const s of stateList) {
        const v = parseFloat(s.s);
        if (!isNaN(v)) {
          pts.push([Math.round(s.lu * 1e3), v]);
          allVals.push(v);
        }
      }
      if (pts.length) {
        series.push({ entityId, pts, color: lineColor });
      }
      if (!allVals.length) {
        const loadEl = this.shadowRoot.getElementById("loading");
        if (loadEl) loadEl.textContent = "No numeric data in the selected time range.";
        return;
      }
      this.shadowRoot.getElementById("loading").style.display = "none";
      canvas.style.display = "block";
      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const range = vMax - vMin;
      const topPad = range * 0.54 || 0.8;
      const bottomPad = range * 0.03 || 0.2;
      const chartMin = vMin - bottomPad;
      const chartMax = vMax + topPad;
      for (const s of series) {
        renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax, { fillAlpha: 0.18 });
      }
      const visibleEvents = this._visibleEvents(events);
      const annotationStyle = this._config.annotation_style === "line" ? "line" : "circle";
      const hits = annotationStyle === "line" ? renderer.drawAnnotationLinesOnLine(visibleEvents, series, t0, t1, chartMin, chartMax) : renderer.drawAnnotationsOnLine(visibleEvents, series, t0, t1, chartMin, chartMax);
      const hitValues = new Map(hits.map((hit) => [hit.event.id, hit.value]));
      const enrichedEvents = visibleEvents.map((ev) => ({
        ...ev,
        chart_value: hitValues.get(ev.id),
        chart_unit: unit
      }));
      const overlay = this.shadowRoot.getElementById("icon-overlay");
      overlay.innerHTML = "";
      if (annotationStyle === "circle") {
        for (const hit of hits) {
          const bgColor = hit.event.color || "#03a9f4";
          const el = document.createElement("div");
          el.className = "ann-icon";
          el.style.left = `${hit.x}px`;
          el.style.top = `${hit.y}px`;
          el.style.background = bgColor;
          el.innerHTML = `<ha-icon icon="${esc$1(hit.event.icon || "mdi:bookmark")}" style="--mdc-icon-size:12px;color:${contrastColor$1(bgColor)}"></ha-icon>`;
          el.dataset.eventId = hit.event.id;
          el.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this._navigateToEventHistory(hit.event);
          });
          overlay.appendChild(el);
        }
      }
      this._attachSensorTooltips(canvas, renderer, enrichedEvents, hits, t0, t1);
      this._renderAnnList(events);
    }
    _renderAnnList(events) {
      const cfg = this._config;
      const sectionEl = this.shadowRoot.getElementById("ann-section");
      const listEl = this.shadowRoot.getElementById("ann-list");
      const pagEl = this.shadowRoot.getElementById("ann-pagination");
      if (!sectionEl || !listEl) return;
      if (!cfg.show_records) {
        sectionEl.style.display = "none";
        return;
      }
      const sorted = [...events || []].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      const limited = cfg.records_limit ? sorted.slice(0, cfg.records_limit) : sorted;
      const total = limited.length;
      if (!total) {
        sectionEl.style.display = "flex";
        listEl.innerHTML = `<div class="ann-empty">No records in this time window.</div>`;
        pagEl.style.display = "none";
        return;
      }
      sectionEl.style.display = "flex";
      const pageSize = cfg.records_page_size;
      const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      this._annPage = Math.min(this._annPage, pages - 1);
      const slice = pageSize ? limited.slice(this._annPage * pageSize, (this._annPage + 1) * pageSize) : limited;
      listEl.innerHTML = slice.map((ev) => {
        const color = ev.color || "#03a9f4";
        const icon = ev.icon || "mdi:bookmark";
        const iconColor = contrastColor$1(color);
        const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
        const showAnn = cfg.records_show_full_message !== false;
        const isHidden = this._hiddenEventIds.has(ev.id);
        const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
        const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
        const isSimple = !annText;
        return `
        <div class="ann-item${!showAnn && annText ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}">
          <div class="ann-icon-wrap" style="background:${esc$1(color)}">
            <ha-icon class="ann-icon-main" icon="${esc$1(icon)}" style="--mdc-icon-size:18px;color:${esc$1(iconColor)}"></ha-icon>
            <button class="ann-visibility-btn" type="button" data-event-id="${esc$1(ev.id)}" title="${esc$1(visibilityLabel)}" aria-label="${esc$1(visibilityLabel)}">
              <ha-icon icon="${esc$1(visibilityIcon)}"></ha-icon>
            </button>
          </div>
          <div class="ann-body">
            <div class="ann-header">
              <span class="ann-msg">
                ${esc$1(ev.message)}
                ${ev.dev ? `<span class="ann-dev-badge">DEV</span>` : ""}
                ${annText && !showAnn ? `<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
              </span>
              <span class="ann-time-wrap">
                <span class="ann-time" title="${esc$1(fmtDateTime(ev.timestamp))}">
                  ${fmtRelativeTime(ev.timestamp)}
                </span>
                <button class="ann-history-btn" type="button" data-event-id="${esc$1(ev.id)}" title="Open related history" aria-label="Open related history">
                  <ha-icon icon="mdi:history"></ha-icon>
                </button>
              </span>
            </div>
            ${annText ? `
              <div class="ann-note${showAnn ? "" : " hidden"}">${esc$1(annText)}</div>
            ` : ""}
          </div>
        </div>`;
      }).join("");
      listEl.querySelectorAll(".ann-history-btn").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const eventId = btn.dataset.eventId;
          const record = (events || []).find((item) => item.id === eventId);
          if (record) this._navigateToEventHistory(record);
        });
      });
      listEl.querySelectorAll(".ann-visibility-btn").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this._toggleEventVisibility(btn.dataset.eventId);
        });
      });
      if (cfg.records_show_full_message === false) {
        listEl.querySelectorAll(".ann-item.expandable").forEach((item) => {
          const toggle = () => {
            const note = item.querySelector(".ann-note");
            const chip = item.querySelector(".ann-expand-chip");
            if (!note) return;
            const hidden = note.classList.toggle("hidden");
            if (chip) chip.textContent = hidden ? "···" : "▲";
          };
          item.addEventListener("click", toggle);
        });
      }
      if (pageSize && pages > 1) {
        pagEl.style.display = "flex";
        this.shadowRoot.getElementById("ann-page-info").textContent = `Page ${this._annPage + 1} of ${pages}`;
        this.shadowRoot.getElementById("ann-prev").disabled = this._annPage === 0;
        this.shadowRoot.getElementById("ann-next").disabled = this._annPage >= pages - 1;
      } else {
        pagEl.style.display = "none";
      }
    }
    _attachSensorTooltips(canvas, renderer, events, hits, t0, t1) {
      const card = this;
      const overlay = this.shadowRoot.getElementById("icon-overlay");
      overlay.querySelectorAll(".ann-icon").forEach((el) => {
        const evId = el.dataset.eventId;
        const ev = events.find((e) => e.id === evId);
        if (!ev) return;
        el.addEventListener("mouseenter", (e) => {
          showTooltip(card, canvas, renderer, ev, e.clientX, e.clientY);
        });
        el.addEventListener("mousemove", (e) => {
          showTooltip(card, canvas, renderer, ev, e.clientX, e.clientY);
        });
        el.addEventListener("mouseleave", () => {
          hideTooltip(card);
        });
        el.addEventListener("touchstart", (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          showTooltip(card, canvas, renderer, ev, touch.clientX, touch.clientY);
          setTimeout(() => hideTooltip(card), 3e3);
        }, { passive: false });
      });
      attachTooltipBehaviour(card, canvas, renderer, events, t0, t1);
      if (this._canvasClickHandler) {
        canvas.removeEventListener("click", this._canvasClickHandler);
      }
      this._canvasClickHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const best = hits.reduce((closest, hit) => {
          const dx = hit.x - x;
          const dy = hit.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 18) return closest;
          if (!closest || dist < closest.dist) return { hit, dist };
          return closest;
        }, null);
        if (best) {
          e.preventDefault();
          e.stopPropagation();
          this._navigateToEventHistory(best.hit.event);
        }
      };
      canvas.addEventListener("click", this._canvasClickHandler);
    }
    static getConfigElement() {
      return document.createElement("hass-datapoints-sensor-card-editor");
    }
    static getStubConfig() {
      return { entity: "sensor.example", hours_to_show: 24 };
    }
    getGridOptions() {
      const rows = this._config?.show_records ? 3 : 2;
      return {
        rows,
        min_rows: rows
      };
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
        fetchEvents$3(this._hass, start.toISOString(), now.toISOString(), this._statIds).then((events) => {
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
      const { w, h } = setupCanvas$1(canvas, wrap, 220);
      const renderer = new ChartRenderer$1(canvas, w, h);
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
      const { w, h } = setupCanvas$1(canvas, wrap, 220);
      const renderer = new ChartRenderer$1(canvas, w, h);
      renderer.labelColor = resolveChartLabelColor(this);
      renderer.clear();
      const series = [];
      const allVals = [];
      let colorIdx = 0;
      for (const [statId, entries] of Object.entries(statsResult)) {
        for (const statType of this._config.stat_types) {
          const pts = [];
          for (const entry of entries) {
            const v = entry[statType];
            if (v === null || v === void 0) continue;
            const tRaw = entry.start;
            const t = typeof tRaw === "number" ? tRaw > 1e11 ? tRaw : tRaw * 1e3 : new Date(tRaw).getTime();
            pts.push([t, v]);
            allVals.push(v);
          }
          if (pts.length) {
            series.push({
              label: `${statId} (${statType})`,
              unit: this._hass?.states?.[statId]?.attributes?.unit_of_measurement || "",
              pts,
              color: COLORS$2[colorIdx % COLORS$2.length]
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
      for (const s of series) {
        renderer.drawLine(s.pts, s.color, t0, t1, chartMin, chartMax);
      }
      renderer.drawAnnotations(events, t0, t1);
      const legendEl = this.shadowRoot.getElementById("legend");
      legendEl.innerHTML = series.map(
        (s) => `
        <div class="legend-item">
          <div class="legend-line" style="background:${esc$3(s.color)}"></div>
          ${esc$3(s.label)}
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
  const {
    addUnit,
    COLORS,
    buildHistoryPagePreferencesPayload,
    buildHistorySeriesRows,
    clampNumber,
    confirmDestructiveAction,
    contrastColor,
    DAY_MS,
    downloadHistorySpreadsheet,
    ensureHaComponents,
    endOfUnit,
    entityName,
    esc,
    extractRangeValue,
    fetchEventBounds,
    fetchEvents,
    fetchUserData,
    formatContextLabel,
    formatPeriodSelectionLabel,
    formatRangeDateTime,
    formatRangeSummary,
    formatScaleLabel,
    historySeriesRowHasConfiguredAnalysis,
    makeDateWindowId,
    normalizeDateWindows,
    normalizeEntityIds,
    normalizeHistoryPagePreferences,
    normalizeHistorySeriesAnalysis,
    normalizeHistorySeriesRows,
    normalizeTargetValue,
    panelConfigTarget,
    parseDateValue,
    parseDateWindowsParam,
    parseSeriesColorsParam,
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
    readHistoryPageSessionState,
    resolveEntityIdsFromTarget,
    saveUserData,
    SECOND_MS,
    serializeDateWindowsParam,
    snapDateToUnit,
    startOfUnit,
    slugifySeriesName,
    writeHistoryPageSessionState,
    HOUR_MS,
    MINUTE_MS,
    PANEL_HISTORY_PREFERENCES_KEY,
    WEEK_MS
  } = shared;
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
  function renderAnalysisSelectOptions(options, selectedValue) {
    return options.map((option) => {
      return `<option value="${esc(option.value)}" ${selectedValue === option.value ? "selected" : ""}>${esc(option.label)}</option>`;
    }).join("");
  }
  function isAnalysisSupportedForRow(row) {
    return typeof row?.entity_id === "string" && !row.entity_id.startsWith("binary_sensor.");
  }
  function hasActiveSeriesAnalysis(analysis, hasSelectedComparisonWindow = false) {
    return analysis.show_trend_lines || analysis.show_summary_stats || analysis.show_rate_of_change || analysis.show_threshold_analysis || analysis.show_anomalies || analysis.show_delta_analysis && hasSelectedComparisonWindow;
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

  .content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, var(--content-top-size, 44%)) 24px minmax(240px, 1fr);
    min-width: 0;
    min-height: 0;
    height: 100%;
    align-self: stretch;
    box-sizing: border-box;
    overflow: hidden;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-lg);
  }

  .content.datapoints-hidden {
    grid-template-rows: minmax(280px, 1fr) 0 0;
    gap: 0;
  }

  .content.datapoints-hidden .content-splitter,
  .content.datapoints-hidden .list-host {
    display: none;
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
  function deriveSwatchIconColor(color) {
    const hex = String(color || "").trim();
    const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
    if (!normalizedHex) {
      return contrastColor(color);
    }
    const channels = normalizedHex.slice(1).match(/.{2}/g)?.map((part) => Number.parseInt(part, 16));
    if (!channels || channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
      return contrastColor(color);
    }
    const [red, green, blue] = channels;
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    const mixTarget = luminance > 0.62 ? 0 : 255;
    const mixStrength = luminance > 0.62 ? Math.min(0.82, 0.35 + (luminance - 0.62) * 1.6) : Math.min(0.78, 0.4 + (0.62 - luminance) * 0.9);
    const mixedChannels = [red, green, blue].map((channel) => {
      const mixed = Math.round(channel * (1 - mixStrength) + mixTarget * mixStrength);
      return Math.max(0, Math.min(255, mixed));
    });
    return `rgb(${mixedChannels[0]}, ${mixedChannels[1]}, ${mixedChannels[2]})`;
  }
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
      this._pendingAnomalyComparisonWindowEntityId = null;
      this._dateWindowDialogOpen = false;
      this._editingDateWindowId = null;
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
      this._targetRowsRenderKey = "";
      this._sidebarOptionsEl = null;
      this._dateControl = null;
      this._dateRangePickerEl = null;
      this._datePickerButtonEl = null;
      this._datePickerMenuEl = null;
      this._optionsButtonEl = null;
      this._optionsMenuEl = null;
      this._rangeScrollViewportEl = null;
      this._rangeTimelineEl = null;
      this._rangeJumpLeftEl = null;
      this._rangeJumpRightEl = null;
      this._rangeTrackEl = null;
      this._rangeTickLayerEl = null;
      this._rangeEventLayerEl = null;
      this._rangeLabelLayerEl = null;
      this._rangeContextLayerEl = null;
      this._rangeChartHoverLineEl = null;
      this._rangeChartHoverWindowLineEl = null;
      this._rangeHoverPreviewEl = null;
      this._rangeZoomHighlightEl = null;
      this._rangeZoomWindowHighlightEl = null;
      this._rangeSelectionEl = null;
      this._rangeStartHandle = null;
      this._rangeEndHandle = null;
      this._rangeStartTooltipEl = null;
      this._rangeEndTooltipEl = null;
      this._rangeCaptionEl = null;
      this._rangeBounds = null;
      this._rangeContentWidth = 0;
      this._draftStartTime = null;
      this._draftEndTime = null;
      this._rangeCommitTimer = null;
      this._autoZoomTimer = null;
      this._rangeInteractionActive = false;
      this._resolvedAutoZoomLevel = null;
      this._activeRangeHandle = null;
      this._hoveredRangeHandle = null;
      this._focusedRangeHandle = null;
      this._hoveredPeriodRange = null;
      this._chartHoverTimeMs = null;
      this._chartZoomRange = null;
      this._chartZoomCommittedRange = null;
      this._chartZoomStateCommitTimer = null;
      this._rangePointerId = null;
      this._timelinePointerId = null;
      this._timelinePointerStartX = 0;
      this._timelinePointerStartScrollLeft = 0;
      this._timelinePointerStartTimestamp = null;
      this._timelinePointerMode = null;
      this._timelineDragStartRangeMs = 0;
      this._timelineDragEndRangeMs = 0;
      this._timelineDragStartZoomRange = null;
      this._timelinePointerMoved = false;
      this._timelineTrackClickPending = false;
      this._zoomLevel = "auto";
      this._dateSnapping = "auto";
      this._recordsSearchQuery = "";
      this._hiddenEventIds = [];
      this._optionsMenuView = "root";
      this._restoredFromSession = false;
      this._datePickerOpen = false;
      this._optionsOpen = false;
      this._pageMenuOpen = false;
      this._exportBusy = false;
      this._contentSplitPointerId = null;
      this._onRangePointerMove = (ev) => this._handleRangePointerMove(ev);
      this._onRangePointerUp = (ev) => this._finishRangePointerInteraction(ev);
      this._onTimelinePointerMove = (ev) => this._handleTimelinePointerMove(ev);
      this._onTimelinePointerUp = (ev) => this._finishTimelinePointerInteraction(ev);
      this._onRangeViewportScroll = () => {
        this._syncVisibleRangeLabels();
        this._updateRangeTooltip();
        this._updateSelectionJumpControls();
      };
      this._onRangeViewportPointerMove = (ev) => this._handleRangeViewportPointerMove(ev);
      this._onRangeViewportPointerLeave = () => this._handleRangeViewportPointerLeave();
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
      this._detachRangePointerListeners();
      this._detachTimelinePointerListeners();
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
      if (Number.isFinite(sessionState?.content_split_ratio)) {
        this._contentSplitRatio = clampNumber(sessionState.content_split_ratio, 0.25, 0.75);
      }
      this._datapointScope = datapointsScopeFromUrl === "all" ? "all" : datapointsScopeFromUrl === "hidden" ? "hidden" : !datapointsScopeFromUrl && sessionState?.datapoint_scope === "all" ? "all" : !datapointsScopeFromUrl && sessionState?.datapoint_scope === "hidden" ? "hidden" : "linked";
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
      const nextTargetSelection = Object.keys(targetFromUrl).length ? targetFromUrl : !hasTargetInUrl && sessionState?.entities?.length ? normalizeTargetValue(sessionState.target_selection_raw || sessionState.target_selection || { entity_id: sessionState.entities }) : panelTarget;
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
            <div id="page-menu" class="page-menu" hidden>
              <button type="button" class="page-menu-item" id="page-download-spreadsheet">
                <ha-icon icon="mdi:file-excel-outline"></ha-icon>
                <span>Download spreadsheet</span>
              </button>
            </div>
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
      this._pageMenuEl?.querySelector("#page-download-spreadsheet")?.addEventListener("click", () => this._downloadSpreadsheet());
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
      this._uiReadyPromise = ensureHaComponents(componentTags).then((results) => {
        return results;
      }).then(() => {
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
        console.warn("[hass-datapoints panel] ensure UI components ready failed", {
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
      return slugifySeriesName(entityName(this._hass, entityId) || entityId);
    }
    _applyPreferredSeriesColors(rows, urlColorMap = null) {
      const queryColors = urlColorMap && typeof urlColorMap === "object" ? urlColorMap : {};
      return normalizeHistorySeriesRows(rows).map((row) => {
        const queryColor = queryColors[this._seriesColorQueryKey(row.entity_id)];
        const preferredColor = this._preferredSeriesColors?.[row.entity_id];
        const nextColor = /^#[0-9a-f]{6}$/i.test(queryColor || "") ? queryColor : /^#[0-9a-f]{6}$/i.test(preferredColor || "") ? preferredColor : row.color;
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
      if (!this._sidebarOptionsEl) return;
      this._sidebarOptionsEl.innerHTML = `
      <div class="sidebar-options-card">
        <div class="sidebar-options-section">
          <div class="sidebar-section-header">
            <div class="sidebar-section-title">Datapoints</div>
            <div class="sidebar-section-subtitle">Choose which annotation datapoints appear on the chart.</div>
          </div>
          <div class="sidebar-radio-group">
            <label class="sidebar-radio-option">
              <input type="radio" name="datapoint-scope" value="linked" ${this._datapointScope === "linked" ? "checked" : ""}>
              <span>Linked to selected targets</span>
            </label>
            <label class="sidebar-radio-option">
              <input type="radio" name="datapoint-scope" value="all" ${this._datapointScope === "all" ? "checked" : ""}>
              <span>All datapoints</span>
            </label>
            <label class="sidebar-radio-option">
              <input type="radio" name="datapoint-scope" value="hidden" ${this._datapointScope === "hidden" ? "checked" : ""}>
              <span>Hide datapoints</span>
            </label>
          </div>
        </div>
        <div class="sidebar-options-section">
          <div class="sidebar-section-header">
            <div class="sidebar-section-title">Datapoint Display</div>
            <div class="sidebar-section-subtitle">Control how annotation datapoints are rendered on the chart.</div>
          </div>
          <div class="sidebar-toggle-group">
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-datapoint-icons" ${this._showChartDatapointIcons ? "checked" : ""}>
              <span>Show datapoint icons</span>
            </label>
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-datapoint-lines" ${this._showChartDatapointLines ? "checked" : ""}>
              <span>Show dotted lines</span>
            </label>
          </div>
        </div>
        <div class="sidebar-options-section">
          <div class="sidebar-section-header">
            <div class="sidebar-section-title">Chart Display</div>
            <div class="sidebar-section-subtitle">Configure visual and interaction behaviour for the chart.</div>
          </div>
          <div class="sidebar-toggle-group">
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-tooltips" ${this._showChartTooltips ? "checked" : ""}>
              <span>Show tooltips</span>
            </label>
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-emphasized-hover-guides" ${this._showChartEmphasizedHoverGuides ? "checked" : ""}>
              <span>Emphasize hover guides</span>
            </label>
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-correlated-anomalies" ${this._showCorrelatedAnomalies ? "checked" : ""}>
              <span>Highlight correlated anomalies</span>
            </label>
            <label class="sidebar-toggle-option">
              <input type="checkbox" name="chart-show-data-gaps" ${this._showDataGaps ? "checked" : ""}>
              <span>Show data gaps</span>
            </label>
            <div class="sidebar-toggle-option" style="padding-left: 22px; opacity: ${this._showDataGaps ? "1" : "0.5"};">
              <select name="chart-data-gap-threshold" class="history-target-analysis-select" ${this._showDataGaps ? "" : "disabled"}>
                ${renderAnalysisSelectOptions(DATA_GAP_THRESHOLD_OPTIONS, this._dataGapThreshold)}
              </select>
              <span>Gap threshold</span>
            </div>
          </div>
          <div class="sidebar-radio-group" style="margin-top: var(--dp-spacing-sm);">
            <label class="sidebar-radio-option">
              <input type="radio" name="chart-y-axis-mode" value="combined" ${!this._delinkChartYAxis && !this._splitChartView ? "checked" : ""}>
              <span>Combine y-axis by unit</span>
            </label>
            <label class="sidebar-radio-option">
              <input type="radio" name="chart-y-axis-mode" value="unique" ${this._delinkChartYAxis && !this._splitChartView ? "checked" : ""}>
              <span>Unique y-axis per series</span>
            </label>
            <label class="sidebar-radio-option">
              <input type="radio" name="chart-y-axis-mode" value="split" ${this._splitChartView ? "checked" : ""}>
              <span>Split series into rows</span>
            </label>
          </div>
        </div>
      </div>
    `;
      this._sidebarOptionsEl.querySelectorAll("input[name='datapoint-scope']").forEach((input) => {
        input.addEventListener("change", () => {
          if (!input.checked || input.value === this._datapointScope) return;
          this._setDatapointScope(input.value);
        });
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-datapoint-icons']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("icons", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-datapoint-lines']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("lines", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-tooltips']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("tooltips", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-emphasized-hover-guides']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("hover_guides", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-correlated-anomalies']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("correlated_anomalies", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("input[name='chart-show-data-gaps']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("data_gaps", !!ev.currentTarget?.checked);
      });
      this._sidebarOptionsEl.querySelector("select[name='chart-data-gap-threshold']")?.addEventListener("change", (ev) => {
        this._setChartDatapointDisplayOption("data_gap_threshold", ev.currentTarget?.value || "2h");
      });
      this._sidebarOptionsEl.querySelectorAll("input[name='chart-y-axis-mode']").forEach((input) => {
        input.addEventListener("change", () => {
          if (!input.checked) {
            return;
          }
          this._setChartYAxisMode(input.value);
        });
      });
    }
    _formatComparisonLabel(start, end) {
      const fmt = (d) => d.toLocaleDateString(void 0, { month: "short", day: "numeric" });
      const fmtYear = (d) => d.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
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
    _getHoveredComparisonWindow() {
      if (!this._hoveredComparisonWindowId) return null;
      return this._comparisonWindows.find((window2) => window2.id === this._hoveredComparisonWindowId) || null;
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
      if (this._dateWindowDialogStartEl) {
        this._dateWindowDialogStartEl.value = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.start || null);
      }
      if (this._dateWindowDialogEndEl) {
        this._dateWindowDialogEndEl.value = this._formatDateWindowInputValue(this._dateWindowDialogDraftRange?.end || null);
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
      if (this._dateWindowDialogEl || !this.shadowRoot) return;
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
      if (this._dateWindowDialogEl) this._dateWindowDialogEl.open = true;
      if (this._dateWindowDialogEl) {
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
      const dialogStart = targetWindow ? parseDateValue(targetWindow.start_time) : this._startTime;
      const dialogEnd = targetWindow ? parseDateValue(targetWindow.end_time) : this._endTime;
      this._dateWindowDialogDraftRange = dialogStart && dialogEnd && dialogStart < dialogEnd ? { start: new Date(dialogStart), end: new Date(dialogEnd) } : null;
      this._syncDateWindowDialogInputs();
      window.requestAnimationFrame(() => this._dateWindowDialogNameEl?.focus());
    }
    _closeDateWindowDialog(fromClosedEvent = false) {
      this._dateWindowDialogOpen = false;
      this._editingDateWindowId = null;
      this._dateWindowDialogDraftRange = null;
      this._pendingAnomalyComparisonWindowEntityId = null;
      if (this._dateWindowDialogEl && !fromClosedEvent) this._dateWindowDialogEl.open = false;
    }
    _createDateWindowFromDialog() {
      const label = String(this._dateWindowDialogNameEl?.value || "").trim();
      const start = this._dateWindowDialogDraftRange?.start || null;
      const end = this._dateWindowDialogDraftRange?.end || null;
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
      const confirmed = await confirmDestructiveAction(this, {
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
      return;
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
      const icon = this._sidebarCollapsed ? "mdi:menu" : "mdi:menu-open";
      const label = this._sidebarCollapsed ? "Expand targets sidebar" : "Collapse targets sidebar";
      const iconEl = this._sidebarToggleButtonEl?.querySelector("ha-icon");
      if (iconEl) iconEl.icon = icon;
      if (this._sidebarToggleButtonEl) this._sidebarToggleButtonEl.label = label;
    }
    _applyContentSplitLayout() {
      const content = this.shadowRoot?.getElementById("content");
      if (!content) return;
      content.style.setProperty("--content-top-size", `${Math.round(this._contentSplitRatio * 1e3) / 10}%`);
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
      const nextScope = scope === "all" ? "all" : scope === "hidden" ? "hidden" : "linked";
      if (nextScope === this._datapointScope) return;
      this._datapointScope = nextScope;
      this._timelineEvents = [];
      this._timelineEventsKey = "";
      this._saveSessionState();
      this._renderSidebarOptions();
      this._renderRangeScale();
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
    _setChartAnalysisOption(kind, value) {
      if (kind === "show_trend_lines") {
        const normalized = !!value;
        if (this._showChartTrendLines === normalized) {
          return;
        }
        this._showChartTrendLines = normalized;
        if (!normalized && this._showChartTrendCrosshairs) {
          this._showChartTrendCrosshairs = false;
        }
      } else if (kind === "show_summary_stats") {
        const normalized = !!value;
        if (this._showChartSummaryStats === normalized) {
          return;
        }
        this._showChartSummaryStats = normalized;
      } else if (kind === "show_rate_of_change") {
        const normalized = !!value;
        if (this._showChartRateOfChange === normalized) {
          return;
        }
        this._showChartRateOfChange = normalized;
      } else if (kind === "show_threshold_analysis") {
        const normalized = !!value;
        if (this._showChartThresholdAnalysis === normalized) {
          return;
        }
        this._showChartThresholdAnalysis = normalized;
        if (!normalized && this._showChartThresholdShading) {
          this._showChartThresholdShading = false;
        }
      } else if (kind === "show_threshold_shading") {
        const normalized = !!value;
        if (this._showChartThresholdShading === normalized) {
          return;
        }
        this._showChartThresholdShading = normalized;
      } else if (kind === "show_anomalies") {
        const normalized = !!value;
        if (this._showChartAnomalies === normalized) {
          return;
        }
        this._showChartAnomalies = normalized;
      } else if (kind === "hide_source_series") {
        const normalized = !!value;
        if (this._hideChartSourceSeries === normalized) {
          return;
        }
        this._hideChartSourceSeries = normalized;
      } else if (kind === "show_trend_crosshairs") {
        const normalized = !!value;
        if (this._showChartTrendCrosshairs === normalized) {
          return;
        }
        this._showChartTrendCrosshairs = normalized;
      } else if (kind === "trend_method") {
        const normalized = ANALYSIS_TREND_METHOD_OPTIONS.some((option) => option.value === value) ? value : "rolling_average";
        if (this._chartTrendMethod === normalized) {
          return;
        }
        this._chartTrendMethod = normalized;
      } else if (kind === "trend_window") {
        const normalized = ANALYSIS_TREND_WINDOW_OPTIONS.some((option) => option.value === value) ? value : "24h";
        if (this._chartTrendWindow === normalized) {
          return;
        }
        this._chartTrendWindow = normalized;
      } else if (kind === "rate_window") {
        const normalized = ANALYSIS_RATE_WINDOW_OPTIONS.some((option) => option.value === value) ? value : "1h";
        if (this._chartRateWindow === normalized) {
          return;
        }
        this._chartRateWindow = normalized;
      } else if (kind === "anomaly_method") {
        const normalized = ANALYSIS_ANOMALY_METHOD_OPTIONS.some((option) => option.value === value) ? value : "trend_residual";
        if (this._chartAnomalyMethod === normalized) {
          return;
        }
        this._chartAnomalyMethod = normalized;
      } else if (kind === "anomaly_sensitivity") {
        const normalized = ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS.some((option) => option.value === value) ? value : "medium";
        if (this._chartAnomalySensitivity === normalized) {
          return;
        }
        this._chartAnomalySensitivity = normalized;
      } else if (kind === "anomaly_rate_window") {
        const normalized = ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS.some((option) => option.value === value) ? value : "1h";
        if (this._chartAnomalyRateWindow === normalized) {
          return;
        }
        this._chartAnomalyRateWindow = normalized;
      } else if (kind === "show_delta_analysis") {
        const normalized = !!value;
        if (this._showChartDeltaAnalysis === normalized) {
          return;
        }
        this._showChartDeltaAnalysis = normalized;
      } else if (kind === "show_delta_tooltip") {
        const normalized = !!value;
        if (this._showChartDeltaTooltip === normalized) {
          return;
        }
        this._showChartDeltaTooltip = normalized;
      } else if (kind === "show_delta_lines") {
        const normalized = !!value;
        if (this._showChartDeltaLines === normalized) {
          return;
        }
        this._showChartDeltaLines = normalized;
      } else {
        return;
      }
      this._saveSessionState();
      this._renderSidebarOptions();
      this._renderContent();
    }
    _setChartAnalysisThresholdValue(entityId, value) {
      if (!entityId) {
        return;
      }
      const normalized = String(value || "").trim();
      const nextValues = { ...this._chartThresholdValues || {} };
      if (!normalized) {
        delete nextValues[entityId];
      } else {
        nextValues[entityId] = normalized;
      }
      if (JSON.stringify(nextValues) === JSON.stringify(this._chartThresholdValues || {})) {
        return;
      }
      this._chartThresholdValues = nextValues;
      this._saveSessionState();
      this._renderContent();
    }
    _setChartAnalysisThresholdDirection(entityId, value) {
      if (!entityId) {
        return;
      }
      const normalized = value === "below" ? "below" : "above";
      const nextDirections = { ...this._chartThresholdDirections || {} };
      nextDirections[entityId] = normalized;
      if (JSON.stringify(nextDirections) === JSON.stringify(this._chartThresholdDirections || {})) {
        return;
      }
      this._chartThresholdDirections = nextDirections;
      this._saveSessionState();
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
        console.warn("[hass-datapoints] failed to load event bounds:", err);
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
        if (this._rendered) this._renderRangeScale();
        return;
      }
      const startIso = new Date(this._rangeBounds.min).toISOString();
      const endIso = new Date(this._rangeBounds.max).toISOString();
      const key = `${startIso}|${endIso}|${this._datapointScope}|${this._entities.join(",")}`;
      if (this._timelineEventsKey === key || this._timelineEventsPromise) return;
      this._timelineEventsPromise = fetchEvents(
        this._hass,
        startIso,
        endIso,
        this._datapointScope === "linked" ? this._entities : void 0
      ).then((events) => {
        this._timelineEvents = Array.isArray(events) ? events : [];
        this._timelineEventsKey = key;
        if (this._rendered) this._renderRangeScale();
      }).catch((err) => {
        console.warn("[hass-datapoints] failed to load timeline events:", err);
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
        console.warn("[hass-datapoints] failed to load panel preferences:", err);
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
        <div class="range-timeline-shell">
          <ha-icon-button
            id="range-jump-left"
            class="range-selection-jump left"
            label="Scroll to selected range"
            hidden
          >
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            id="range-jump-right"
            class="range-selection-jump right"
            label="Scroll to selected range"
            hidden
          >
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </ha-icon-button>
          <div id="range-scroll-viewport" class="range-scroll-viewport">
            <div id="range-timeline" class="range-timeline">
              <div id="range-context-layer" class="range-context-layer"></div>
              <div id="range-tick-layer" class="range-tick-layer"></div>
              <div id="range-event-layer" class="range-event-layer"></div>
              <div id="range-chart-hover-line" class="range-chart-hover-line" aria-hidden="true"></div>
              <div id="range-chart-hover-window-line" class="range-chart-hover-window-line" aria-hidden="true"></div>
              <div id="range-track" class="range-track">
                <div id="range-hover-preview" class="range-hover-preview"></div>
                <div id="range-comparison-preview" class="range-comparison-preview"></div>
                <div id="range-zoom-highlight" class="range-zoom-highlight"></div>
                <div id="range-zoom-window-highlight" class="range-zoom-window-highlight"></div>
                <div id="range-selection" class="range-selection"></div>
              </div>
              <div id="range-label-layer" class="range-label-layer"></div>
              <button id="range-start-handle" class="range-handle" type="button" aria-label="Start date and time"></button>
              <button id="range-end-handle" class="range-handle" type="button" aria-label="End date and time"></button>
            </div>
          </div>
          <div id="range-tooltip-start" class="range-tooltip start" aria-hidden="true"></div>
          <div id="range-tooltip-end" class="range-tooltip end" aria-hidden="true"></div>
          <div id="range-caption" class="range-caption"></div>
        </div>
        <div class="range-picker-wrap">
          <ha-icon-button id="range-picker-button" class="range-picker-button" label="Select date range" aria-haspopup="dialog" aria-expanded="false">
            <ha-icon icon="mdi:calendar-range"></ha-icon>
          </ha-icon-button>
          <div id="range-picker-menu" class="range-picker-menu" hidden>
            <ha-date-range-picker id="range-picker" class="range-picker"></ha-date-range-picker>
          </div>
        </div>
        <div class="range-options-wrap">
          <ha-icon-button id="range-options-button" class="range-options-button" label="Timeline options" aria-haspopup="menu" aria-expanded="false">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <div id="range-options-menu" class="range-options-menu" hidden>
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
          </div>
        </div>
      </div>
    `;
      this._rangeScrollViewportEl = dateControl.querySelector("#range-scroll-viewport");
      this._rangeJumpLeftEl = dateControl.querySelector("#range-jump-left");
      this._rangeJumpRightEl = dateControl.querySelector("#range-jump-right");
      this._rangeTimelineEl = dateControl.querySelector("#range-timeline");
      this._rangeTrackEl = dateControl.querySelector("#range-track");
      this._dateRangePickerEl = dateControl.querySelector("#range-picker");
      this._datePickerButtonEl = dateControl.querySelector("#range-picker-button");
      this._datePickerMenuEl = dateControl.querySelector("#range-picker-menu");
      this._optionsButtonEl = dateControl.querySelector("#range-options-button");
      this._optionsMenuEl = dateControl.querySelector("#range-options-menu");
      this._rangeTickLayerEl = dateControl.querySelector("#range-tick-layer");
      this._rangeEventLayerEl = dateControl.querySelector("#range-event-layer");
      this._rangeLabelLayerEl = dateControl.querySelector("#range-label-layer");
      this._rangeContextLayerEl = dateControl.querySelector("#range-context-layer");
      this._rangeChartHoverLineEl = dateControl.querySelector("#range-chart-hover-line");
      this._rangeChartHoverWindowLineEl = dateControl.querySelector("#range-chart-hover-window-line");
      this._rangeHoverPreviewEl = dateControl.querySelector("#range-hover-preview");
      this._rangeComparisonPreviewEl = dateControl.querySelector("#range-comparison-preview");
      this._rangeZoomHighlightEl = dateControl.querySelector("#range-zoom-highlight");
      this._rangeZoomWindowHighlightEl = dateControl.querySelector("#range-zoom-window-highlight");
      this._rangeStartTooltipEl = dateControl.querySelector("#range-tooltip-start");
      this._rangeEndTooltipEl = dateControl.querySelector("#range-tooltip-end");
      this._rangeSelectionEl = dateControl.querySelector("#range-selection");
      this._rangeStartHandle = dateControl.querySelector("#range-start-handle");
      this._rangeEndHandle = dateControl.querySelector("#range-end-handle");
      this._rangeStartHandle?.removeAttribute("title");
      this._rangeEndHandle?.removeAttribute("title");
      this._rangeCaptionEl = dateControl.querySelector("#range-caption");
      this._rangeScrollViewportEl.addEventListener("pointerdown", (ev) => this._handleTimelinePointerDown(ev));
      this._rangeScrollViewportEl.addEventListener("scroll", this._onRangeViewportScroll, { passive: true });
      this._rangeScrollViewportEl.addEventListener("pointermove", this._onRangeViewportPointerMove, { passive: true });
      this._rangeScrollViewportEl.addEventListener("pointerleave", this._onRangeViewportPointerLeave);
      this._rangeStartHandle.addEventListener("pointerdown", (ev) => this._beginRangePointerInteraction("start", ev));
      this._rangeEndHandle.addEventListener("pointerdown", (ev) => this._beginRangePointerInteraction("end", ev));
      this._rangeStartHandle.addEventListener("keydown", (ev) => this._handleRangeHandleKeyDown("start", ev));
      this._rangeEndHandle.addEventListener("keydown", (ev) => this._handleRangeHandleKeyDown("end", ev));
      this._rangeStartHandle.addEventListener("pointerenter", () => this._setRangeTooltipHoverHandle("start"));
      this._rangeEndHandle.addEventListener("pointerenter", () => this._setRangeTooltipHoverHandle("end"));
      this._rangeStartHandle.addEventListener("pointerleave", () => this._clearRangeTooltipHoverHandle("start"));
      this._rangeEndHandle.addEventListener("pointerleave", () => this._clearRangeTooltipHoverHandle("end"));
      this._rangeStartHandle.addEventListener("focus", () => this._setRangeTooltipFocusHandle("start"));
      this._rangeEndHandle.addEventListener("focus", () => this._setRangeTooltipFocusHandle("end"));
      this._rangeStartHandle.addEventListener("blur", () => this._clearRangeTooltipFocusHandle("start"));
      this._rangeEndHandle.addEventListener("blur", () => this._clearRangeTooltipFocusHandle("end"));
      this._datePickerButtonEl.addEventListener("click", () => this._toggleDatePickerMenu());
      this._dateRangePickerEl.addEventListener("change", (ev) => this._handleDatePickerChange(ev));
      this._dateRangePickerEl.addEventListener("value-changed", (ev) => this._handleDatePickerChange(ev));
      this._optionsButtonEl.addEventListener("click", () => this._toggleOptionsMenu());
      this._optionsMenuEl.querySelectorAll("[data-options-submenu]").forEach((button) => {
        button.addEventListener("click", () => this._setOptionsMenuView(button.dataset.optionsSubmenu || "root"));
      });
      this._optionsMenuEl.querySelectorAll("[data-options-back]").forEach((button) => {
        button.addEventListener("click", () => this._setOptionsMenuView("root"));
      });
      this._optionsMenuEl.querySelectorAll("[data-option-group]").forEach((button) => {
        button.addEventListener("click", () => this._handleOptionSelect(button));
      });
      this._rangeJumpLeftEl?.addEventListener("click", () => this._revealSelectionInTimeline("smooth"));
      this._rangeJumpRightEl?.addEventListener("click", () => this._revealSelectionInTimeline("smooth"));
      dateSlot.appendChild(dateControl);
      this._dateControl = dateControl;
      this._syncControls();
    }
    _renderTargetRows() {
      if (!this._targetRowsEl) return;
      const renderKey = JSON.stringify(this._seriesRows);
      if (this._targetRowsRenderKey === renderKey && this._targetRowsEl.childElementCount) return;
      this._targetRowsRenderKey = renderKey;
      const collapsedSummaryEl = this.shadowRoot?.getElementById("target-collapsed-summary");
      if (!this._seriesRows.length) {
        this._targetRowsEl.innerHTML = `<div class="history-target-empty">Add a target to start plotting series.</div>`;
        if (collapsedSummaryEl) {
          collapsedSummaryEl.innerHTML = `<div class="history-targets-collapsed-empty" title="No targets selected"></div>`;
        }
        return;
      }
      this._targetRowsEl.innerHTML = `
      <div class="history-target-table" role="table" aria-label="History chart targets">
        <div class="history-target-table-body" role="rowgroup">
          ${this._seriesRows.map((row, index) => {
        const analysis = normalizeHistorySeriesAnalysis(row.analysis);
        const supportsAnalysis = isAnalysisSupportedForRow(row);
        const hasConfiguredAnalysis = historySeriesRowHasConfiguredAnalysis(row);
        const isExpanded = supportsAnalysis && analysis.expanded === true;
        const canShowDeltaAnalysis = !!this._selectedComparisonWindowId;
        const hasActiveAnalysis = hasActiveSeriesAnalysis(analysis, canShowDeltaAnalysis);
        const rowName = entityName(this._hass, row.entity_id) || row.entity_id;
        const unit = this._hass?.states?.[row.entity_id]?.attributes?.unit_of_measurement || "";
        return `
            <div class="history-target-row ${row.visible === false ? "is-hidden" : ""} ${isExpanded ? "analysis-open" : ""}" role="row" data-series-reorder-index="${index}" ${supportsAnalysis ? `data-series-row-entity-id="${esc(row.entity_id)}"` : ""}>
              <button type="button" class="history-target-drag-handle" draggable="true" data-series-drag-index="${index}" aria-label="Drag to reorder ${esc(rowName)}" title="Drag to reorder">
                <ha-icon icon="mdi:drag-vertical"></ha-icon>
              </button>
              <div class="history-target-name" role="cell" title="${esc(entityName(this._hass, row.entity_id) || row.entity_id)}">
                <div role="cell" class="history-target-controls">
                  <label class="history-target-color-field" style="--row-color:${esc(row.color)};--row-icon-color:${deriveSwatchIconColor(row.color)}">
                    <input type="color" class="history-target-color" data-series-color-index="${index}" value="${esc(row.color)}" aria-label="Line color for ${esc(row.entity_id)}">
                    <span class="history-target-color-icon" aria-hidden="true">
                      <ha-state-icon data-series-icon-entity-id="${esc(row.entity_id)}"></ha-state-icon>
                    </span>
                  </label>
                </div>
                <div class="history-target-name-text">
                  ${esc(entityName(this._hass, row.entity_id) || row.entity_id)}
                  <div class="history-target-entity-id">${esc(row.entity_id)}</div>
                </div>
              </div>
              <div role="cell" class="history-target-actions">
                ${supportsAnalysis ? `
                  <button
                    type="button"
                    class="history-target-analysis-toggle ${hasConfiguredAnalysis ? "configured" : ""}"
                    data-series-analysis-toggle-entity-id="${esc(row.entity_id)}"
                    aria-label="${isExpanded ? "Collapse" : "Expand"} analysis options for ${esc(rowName)}"
                    aria-expanded="${isExpanded ? "true" : "false"}"
                    title="${hasConfiguredAnalysis ? "Analysis configured" : "Configure analysis"}"
                  >
                    <ha-icon icon="${isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon>
                  </button>
                ` : ""}
                <label class="history-target-visible-toggle" title="${row.visible === false ? "Show" : "Hide"} ${esc(entityName(this._hass, row.entity_id) || row.entity_id)}">
                  <input
                    type="checkbox"
                    data-series-visible-entity-id="${esc(row.entity_id)}"
                    aria-label="Show ${esc(entityName(this._hass, row.entity_id) || row.entity_id)} on chart"
                    ${row.visible === false ? "" : "checked"}
                  >
                  <span class="history-target-visible-toggle-track"></span>
                </label>
                <button type="button" class="history-target-remove" data-series-remove-index="${index}" aria-label="Remove ${esc(row.entity_id)}">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              ${supportsAnalysis && isExpanded ? `
                <div class="history-target-analysis" role="cell">
                  <div class="history-target-analysis-grid">
                    <label class="history-target-analysis-option ${!hasActiveAnalysis ? "is-disabled" : ""}">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::hide_source_series" ${analysis.hide_source_series && hasActiveAnalysis ? "checked" : ""} ${!hasActiveAnalysis ? "disabled" : ""}>
                      <span>Hide source series</span>
                    </label>
                    <div class="history-target-analysis-group ${analysis.show_trend_lines ? "is-open" : ""}">
                      <label class="history-target-analysis-option">
                        <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_trend_lines" ${analysis.show_trend_lines ? "checked" : ""}>
                        <span>Show trend lines</span>
                      </label>
                      ${analysis.show_trend_lines ? `
                        <div class="history-target-analysis-group-body">
                          <label class="history-target-analysis-option">
                            <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_trend_crosshairs" ${analysis.show_trend_crosshairs ? "checked" : ""}>
                            <span>Show trend crosshairs</span>
                          </label>
                          <label class="history-target-analysis-field">
                            <span class="history-target-analysis-field-label">Trend method</span>
                            <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::trend_method">
                              ${renderAnalysisSelectOptions(ANALYSIS_TREND_METHOD_OPTIONS, analysis.trend_method)}
                            </select>
                          </label>
                          ${analysis.trend_method === "rolling_average" ? `
                            <label class="history-target-analysis-field">
                              <span class="history-target-analysis-field-label">Trend window</span>
                              <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::trend_window">
                                ${renderAnalysisSelectOptions(ANALYSIS_TREND_WINDOW_OPTIONS, analysis.trend_window)}
                              </select>
                            </label>
                          ` : ""}
                        </div>
                      ` : ""}
                    </div>
                    <label class="history-target-analysis-option">
                      <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_summary_stats" ${analysis.show_summary_stats ? "checked" : ""}>
                      <span>Show min / max / mean</span>
                    </label>
                    <div class="history-target-analysis-group ${analysis.show_rate_of_change ? "is-open" : ""}">
                      <label class="history-target-analysis-option">
                        <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_rate_of_change" ${analysis.show_rate_of_change ? "checked" : ""}>
                        <span>Show rate of change</span>
                      </label>
                      ${analysis.show_rate_of_change ? `
                        <div class="history-target-analysis-group-body">
                          <label class="history-target-analysis-field">
                            <span class="history-target-analysis-field-label">Rate window</span>
                            <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::rate_window">
                              ${renderAnalysisSelectOptions(ANALYSIS_RATE_WINDOW_OPTIONS, analysis.rate_window)}
                            </select>
                          </label>
                        </div>
                      ` : ""}
                    </div>
                    <div class="history-target-analysis-group ${analysis.show_threshold_analysis ? "is-open" : ""}">
                      <label class="history-target-analysis-option">
                        <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_threshold_analysis" ${analysis.show_threshold_analysis ? "checked" : ""}>
                        <span>Show threshold analysis</span>
                      </label>
                      ${analysis.show_threshold_analysis ? `
                        <div class="history-target-analysis-group-body">
                          <label class="history-target-analysis-option">
                            <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_threshold_shading" ${analysis.show_threshold_shading ? "checked" : ""}>
                            <span>Shade threshold area</span>
                          </label>
                          <label class="history-target-analysis-field">
                            <span class="history-target-analysis-field-label">Threshold</span>
                            <div class="history-target-analysis-toggle-group">
                              <input
                                class="history-target-analysis-input"
                                type="number"
                                step="any"
                                inputmode="decimal"
                                data-series-analysis-input="${esc(row.entity_id)}::threshold_value"
                                value="${esc(analysis.threshold_value)}"
                                placeholder="Threshold"
                              >
                              <span class="sidebar-analysis-threshold-unit">${esc(unit)}</span>
                            </div>
                          </label>
                          ${analysis.show_threshold_shading ? `
                            <label class="history-target-analysis-field">
                              <span class="history-target-analysis-field-label">Shade area</span>
                              <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::threshold_direction">
                                <option value="above" ${analysis.threshold_direction !== "below" ? "selected" : ""}>Shade above</option>
                                <option value="below" ${analysis.threshold_direction === "below" ? "selected" : ""}>Shade below</option>
                              </select>
                            </label>
                          ` : ""}
                        </div>
                      ` : ""}
                    </div>
                    <div class="history-target-analysis-group ${analysis.show_anomalies ? "is-open" : ""}">
                      <label class="history-target-analysis-option">
                        <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_anomalies" ${analysis.show_anomalies ? "checked" : ""}>
                        <span>Show anomalies</span>
                      </label>
                      ${analysis.show_anomalies ? `
                        <div class="history-target-analysis-group-body">
                          <label class="history-target-analysis-field">
                            <span class="history-target-analysis-field-label">Sensitivity</span>
                            <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_sensitivity">
                              ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS, analysis.anomaly_sensitivity)}
                            </select>
                          </label>
                          <div class="history-target-analysis-method-list">
                            ${ANALYSIS_ANOMALY_METHOD_OPTIONS.map((opt) => {
          const isChecked = analysis.anomaly_methods.includes(opt.value);
          return `
                              <div class="history-target-analysis-method-item">
                                <label class="history-target-analysis-option">
                                  <input type="checkbox"
                                    data-series-analysis-option="${esc(row.entity_id)}::anomaly_method_toggle_${esc(opt.value)}"
                                    ${isChecked ? "checked" : ""}>
                                  <span>${esc(opt.label)}</span>
                                  ${opt.help ? `
                                    <span class="analysis-method-help" id="amh-${esc(row.entity_id.replace(/\./g, "-"))}-${esc(opt.value)}" tabindex="0">?</span>
                                    <ha-tooltip for="amh-${esc(row.entity_id.replace(/\./g, "-"))}-${esc(opt.value)}" placement="right" hoist>${esc(opt.help)}</ha-tooltip>
                                  ` : ""}
                                  ${isChecked ? `<span class="analysis-computing-spinner" data-analysis-spinner="${esc(row.entity_id)}"></span>` : ""}
                                </label>
                                ${isChecked && opt.value === "rate_of_change" ? `
                                  <div class="history-target-analysis-method-subopts">
                                    <label class="history-target-analysis-field">
                                      <span class="history-target-analysis-field-label">Rate window</span>
                                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_rate_window">
                                        ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS, analysis.anomaly_rate_window)}
                                      </select>
                                    </label>
                                  </div>
                                ` : ""}
                                ${isChecked && opt.value === "rolling_zscore" ? `
                                  <div class="history-target-analysis-method-subopts">
                                    <label class="history-target-analysis-field">
                                      <span class="history-target-analysis-field-label">Rolling window</span>
                                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_zscore_window">
                                        ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS, analysis.anomaly_zscore_window)}
                                      </select>
                                    </label>
                                  </div>
                                ` : ""}
                                ${isChecked && opt.value === "persistence" ? `
                                  <div class="history-target-analysis-method-subopts">
                                    <label class="history-target-analysis-field">
                                      <span class="history-target-analysis-field-label">Min flat duration</span>
                                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_persistence_window">
                                        ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS, analysis.anomaly_persistence_window)}
                                      </select>
                                    </label>
                                  </div>
                                ` : ""}
                                ${isChecked && opt.value === "comparison_window" ? `
                                  <div class="history-target-analysis-method-subopts">
                                    <label class="history-target-analysis-field">
                                      <span class="history-target-analysis-field-label">Compare to window</span>
                                      <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_comparison_window_id">
                                        <option value="" ${!analysis.anomaly_comparison_window_id ? "selected" : ""}>— select window —</option>
                                        ${this._comparisonWindows.map((win) => `<option value="${esc(win.id)}" ${analysis.anomaly_comparison_window_id === win.id ? "selected" : ""}>${esc(win.label || win.id)}</option>`).join("")}
                                        <option value="__add_new__">+ Add date window</option>
                                      </select>
                                    </label>
                                  </div>
                                ` : ""}
                              </div>`;
        }).join("")}
                          </div>
                          ${analysis.anomaly_methods.length >= 2 ? `
                            <label class="history-target-analysis-field">
                              <span class="history-target-analysis-field-label">When methods overlap</span>
                              <select class="history-target-analysis-select" data-series-analysis-select="${esc(row.entity_id)}::anomaly_overlap_mode">
                                ${renderAnalysisSelectOptions(ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS, analysis.anomaly_overlap_mode)}
                              </select>
                            </label>
                          ` : ""}
                        </div>
                      ` : ""}
                    </div>
                    <div class="history-target-analysis-group ${analysis.show_delta_analysis && canShowDeltaAnalysis ? "is-open" : ""}">
                      <label class="history-target-analysis-option top">
                        <input
                          type="checkbox"
                          data-series-analysis-option="${esc(row.entity_id)}::show_delta_analysis"
                          ${analysis.show_delta_analysis && canShowDeltaAnalysis ? "checked" : ""}
                          ${canShowDeltaAnalysis ? "" : "disabled"}
                        >
                        <span>Show delta vs selected date window<br />
                            ${!canShowDeltaAnalysis ? `
                            <span class="history-target-analysis-option-help-text">Select a date window tab to enable delta analysis.</span>
                 ` : ""}</span>
                      </label>
                      ${analysis.show_delta_analysis && canShowDeltaAnalysis ? `
                        <div class="history-target-analysis-group-body">
                          <label class="history-target-analysis-option">
                            <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_delta_tooltip" ${analysis.show_delta_tooltip ? "checked" : ""}>
                            <span>Show delta in tooltip</span>
                          </label>
                          <label class="history-target-analysis-option">
                            <input type="checkbox" data-series-analysis-option="${esc(row.entity_id)}::show_delta_lines" ${analysis.show_delta_lines ? "checked" : ""}>
                            <span>Show delta lines</span>
                          </label>
                        </div>
                      ` : ""}
                    </div>
                  </div>
                </div>
              ` : ""}
            </div>
          `;
      }).join("")}
        </div>
      </div>
    `;
      if (collapsedSummaryEl) {
        collapsedSummaryEl.innerHTML = this._seriesRows.map((row, index) => {
          const label = entityName(this._hass, row.entity_id) || row.entity_id;
          const itemId = `collapsed-series-${index}`;
          return `
          <button
            type="button"
            id="${itemId}"
            class="history-targets-collapsed-item ${row.visible === false ? "is-hidden" : ""}"
            data-series-collapsed-entity-id="${esc(row.entity_id)}"
            style="--row-color:${esc(row.color)}"
            aria-label="${esc(label)}"
            aria-pressed="${row.visible === false ? "false" : "true"}"
          >
            <ha-state-icon
              data-series-collapsed-icon-entity-id="${esc(row.entity_id)}"
              aria-hidden="true"
            ></ha-state-icon>
          </button>
          <ha-tooltip for="${itemId}" placement="right" distance="4">${esc(label)}</ha-tooltip>
        `;
        }).join("");
      }
      this._targetRowsEl.querySelectorAll("[data-series-color-index]").forEach((input) => {
        input.addEventListener("change", () => this._updateSeriesRowColor(Number.parseInt(input.dataset.seriesColorIndex || "", 10), input.value));
      });
      this._targetRowsEl.querySelectorAll("[data-series-analysis-toggle-entity-id]").forEach((button) => {
        button.addEventListener("click", () => this._toggleSeriesAnalysisExpanded(String(button.dataset.seriesAnalysisToggleEntityId || "")));
      });
      this._targetRowsEl.querySelectorAll("[data-series-row-entity-id]").forEach((rowEl) => {
        rowEl.addEventListener("click", (ev) => {
          const nameArea = rowEl.querySelector(".history-target-name");
          if (!nameArea || !nameArea.contains(ev.target)) {
            return;
          }
          if (ev.target.closest("button, input, select, textarea, a, label")) {
            return;
          }
          this._toggleSeriesAnalysisExpanded(String(rowEl.dataset.seriesRowEntityId || ""));
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-visible-entity-id]").forEach((input) => {
        input.addEventListener("change", () => this._updateSeriesRowVisibilityByEntityId(String(input.dataset.seriesVisibleEntityId || ""), input.checked));
      });
      this._targetRowsEl.querySelectorAll("[data-series-analysis-option]").forEach((input) => {
        input.addEventListener("change", () => {
          const [entityId, key] = String(input.dataset.seriesAnalysisOption || "").split("::");
          if (!entityId || !key) {
            return;
          }
          this._setSeriesAnalysisOption(entityId, key, !!input.checked);
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-analysis-select]").forEach((select) => {
        select.addEventListener("change", () => {
          const [entityId, key] = String(select.dataset.seriesAnalysisSelect || "").split("::");
          if (!entityId || !key) {
            return;
          }
          this._setSeriesAnalysisOption(entityId, key, select.value || "");
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-analysis-input]").forEach((input) => {
        input.addEventListener("change", () => {
          const [entityId, key] = String(input.dataset.seriesAnalysisInput || "").split("::");
          if (!entityId || !key) {
            return;
          }
          this._setSeriesAnalysisOption(entityId, key, input.value || "");
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-remove-index]").forEach((button) => {
        button.addEventListener("click", () => this._removeSeriesRow(Number.parseInt(button.dataset.seriesRemoveIndex || "", 10)));
      });
      this._targetRowsEl.querySelectorAll("[data-series-icon-entity-id]").forEach((iconEl) => {
        const entityId = iconEl.dataset.seriesIconEntityId;
        if (!entityId) return;
        iconEl.stateObj = this._hass?.states?.[entityId];
        iconEl.hass = this._hass;
      });
      collapsedSummaryEl?.querySelectorAll("[data-series-collapsed-icon-entity-id]").forEach((iconEl) => {
        const entityId = iconEl.dataset.seriesCollapsedIconEntityId;
        if (!entityId) return;
        iconEl.stateObj = this._hass?.states?.[entityId];
        iconEl.hass = this._hass;
      });
      collapsedSummaryEl?.querySelectorAll("[data-series-collapsed-entity-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const entityId = String(button.dataset.seriesCollapsedEntityId || "");
          const row = this._seriesRows.find((entry) => entry.entity_id === entityId);
          this._updateSeriesRowVisibilityByEntityId(entityId, row?.visible === false);
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-drag-index]").forEach((handle) => {
        handle.addEventListener("dragstart", (ev) => {
          const fromIndex = Number.parseInt(handle.dataset.seriesDragIndex || "", 10);
          this._dragSourceIndex = fromIndex;
          ev.dataTransfer.effectAllowed = "move";
          ev.dataTransfer.setData("text/plain", String(fromIndex));
          const rowEl = handle.closest(".history-target-row");
          setTimeout(() => rowEl?.classList.add("is-dragging"), 0);
        });
        handle.addEventListener("dragend", () => {
          this._dragSourceIndex = null;
          this._targetRowsEl.querySelectorAll(".history-target-row").forEach((r) => {
            r.classList.remove("is-dragging", "is-drag-over-before", "is-drag-over-after");
          });
        });
      });
      this._targetRowsEl.querySelectorAll("[data-series-reorder-index]").forEach((rowEl) => {
        rowEl.addEventListener("dragover", (ev) => {
          if (this._dragSourceIndex === null) {
            return;
          }
          ev.preventDefault();
          ev.dataTransfer.dropEffect = "move";
          const rect = rowEl.getBoundingClientRect();
          const isAbove = ev.clientY < rect.top + rect.height / 2;
          this._targetRowsEl.querySelectorAll(".history-target-row").forEach((r) => {
            r.classList.remove("is-drag-over-before", "is-drag-over-after");
          });
          rowEl.classList.add(isAbove ? "is-drag-over-before" : "is-drag-over-after");
        });
        rowEl.addEventListener("dragleave", (ev) => {
          if (!rowEl.contains(ev.relatedTarget)) {
            rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");
          }
        });
        rowEl.addEventListener("drop", (ev) => {
          ev.preventDefault();
          const fromIndex = Number.parseInt(ev.dataTransfer.getData("text/plain") || "", 10);
          const rowIndex = Number.parseInt(rowEl.dataset.seriesReorderIndex || "", 10);
          if (!Number.isFinite(fromIndex) || !Number.isFinite(rowIndex)) {
            return;
          }
          const rect = rowEl.getBoundingClientRect();
          const isAbove = ev.clientY < rect.top + rect.height / 2;
          const insertBeforeIndex = isAbove ? rowIndex : rowIndex + 1;
          const toIndex = fromIndex < insertBeforeIndex ? insertBeforeIndex - 1 : insertBeforeIndex;
          rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");
          this._reorderSeriesRows(fromIndex, toIndex);
        });
      });
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
        const nextMethods = value === true ? [.../* @__PURE__ */ new Set([...currentMethods, method])] : currentMethods.filter((m) => m !== method);
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
    _removeSeriesRow(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this._seriesRows.length) return;
      this._seriesRows = this._seriesRows.filter((_, rowIndex) => rowIndex !== index);
      this._syncSeriesState();
      this._saveSessionState();
      this._renderTargetRows();
      this._syncControls();
      this._updateUrl({ push: true });
      this._renderContent();
    }
    _reorderSeriesRows(fromIndex, toIndex) {
      if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
        return;
      }
      if (fromIndex < 0 || fromIndex >= this._seriesRows.length) {
        return;
      }
      if (toIndex < 0 || toIndex >= this._seriesRows.length) {
        return;
      }
      if (fromIndex === toIndex) {
        return;
      }
      const rows = [...this._seriesRows];
      const [removed] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, removed);
      this._seriesRows = rows;
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
        this._optionsMenuEl.hidden = !force;
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
        this._datePickerMenuEl.hidden = !force;
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
        this._pageMenuEl.hidden = !force;
        if (force) {
          this._positionPageMenu();
        }
      }
      if (this._pageMenuButtonEl) {
        this._pageMenuButtonEl.setAttribute("aria-expanded", String(force));
      }
    }
    _handleWindowPointerDown(ev) {
      const path = ev.composedPath ? ev.composedPath() : [];
      if (this._datePickerOpen) {
        const insideDatePicker = path.includes(this._datePickerButtonEl) || path.includes(this._datePickerMenuEl);
        if (!insideDatePicker) {
          this._toggleDatePickerMenu(false);
        }
      }
      if (this._optionsOpen) {
        const insideOptions = path.includes(this._optionsButtonEl) || path.includes(this._optionsMenuEl);
        if (!insideOptions) {
          this._toggleOptionsMenu(false);
        }
      }
      if (this._pageMenuOpen) {
        const insidePageMenu = path.includes(this._pageMenuButtonEl) || path.includes(this._pageMenuEl);
        if (!insidePageMenu) {
          this._togglePageMenu(false);
        }
      }
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
        console.error("[hass-datapoints panel] spreadsheet export:failed", error);
      } finally {
        this._exportBusy = false;
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
      this._pageMenuEl.style.setProperty("--page-menu-left", `${left}px`);
      this._pageMenuEl.style.setProperty("--page-menu-top", `${top}px`);
    }
    _getEffectiveZoomLevel() {
      if (this._zoomLevel !== "auto") return this._zoomLevel;
      if (!this._resolvedAutoZoomLevel) {
        const historySpanMs = this._historyStartTime && this._historyEndTime ? Math.max(
          this._historyEndTime.getTime() - this._historyStartTime.getTime(),
          RANGE_SLIDER_MIN_SPAN_MS
        ) : null;
        const referenceSpanMs = historySpanMs ?? Math.max(
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
      if (historyStartMs != null) {
        const min2 = startOfUnit(new Date(historyStartMs), config.boundsUnit).getTime();
        const futureReference = addUnit(
          new Date(historyEndMs ?? endMs),
          "year",
          RANGE_FUTURE_BUFFER_YEARS
        ).getTime();
        const maxReference = Math.max(
          futureReference,
          endMs,
          startMs + this._getSnapSpanMs(this._startTime || /* @__PURE__ */ new Date())
        );
        const max2 = endOfUnit(new Date(maxReference), config.boundsUnit).getTime();
        return { min: min2, max: Math.max(max2, min2 + SECOND_MS), config };
      }
      const selectionMs = Math.max(endMs - startMs, this._getSnapSpanMs(this._startTime || /* @__PURE__ */ new Date()));
      const visibleMs = Math.max(config.baselineMs, selectionMs * 1.6);
      const centerMs = startMs + (endMs - startMs) / 2;
      const rawMin = centerMs - visibleMs / 2;
      const rawMax = centerMs + visibleMs / 2;
      const min = startOfUnit(new Date(rawMin), config.boundsUnit).getTime();
      const max = endOfUnit(new Date(rawMax), config.boundsUnit).getTime();
      return { min, max, config };
    }
    _countUnitsInRange(startMs, endMs, unit) {
      const totalMs = Math.max(0, endMs - startMs);
      switch (unit) {
        case "second":
          return Math.ceil(totalMs / SECOND_MS);
        case "minute":
          return Math.ceil(totalMs / MINUTE_MS);
        case "hour":
          return Math.ceil(totalMs / HOUR_MS);
        case "day":
          return Math.ceil(totalMs / DAY_MS);
        case "week":
          return Math.ceil(totalMs / WEEK_MS);
        case "month": {
          const start = new Date(startMs);
          const end = new Date(endMs);
          return Math.max(
            1,
            (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
          );
        }
        case "quarter":
          return Math.max(1, Math.ceil(this._countUnitsInRange(startMs, endMs, "month") / 3));
        case "year": {
          const start = new Date(startMs);
          const end = new Date(endMs);
          return Math.max(1, end.getFullYear() - start.getFullYear() + 1);
        }
        default:
          return Math.max(1, Math.ceil(totalMs / DAY_MS));
      }
    }
    _syncTimelineWidth() {
      if (!this._rangeBounds || !this._rangeTimelineEl) return;
      const { config } = this._rangeBounds;
      const viewportWidth = Math.max(this._rangeScrollViewportEl?.clientWidth || 0, 320);
      const unitCount = this._countUnitsInRange(this._rangeBounds.min, this._rangeBounds.max, config.majorUnit);
      const contentWidth = Math.max(viewportWidth, unitCount * (config.pixelsPerUnit || 60));
      this._rangeContentWidth = contentWidth;
      this._rangeTimelineEl.style.width = `${contentWidth}px`;
    }
    _scrollTimelineToRange(range, behavior = "auto", { center = false } = {}) {
      if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !range) return;
      const viewportWidth = this._rangeScrollViewportEl.clientWidth;
      if (!viewportWidth || this._rangeContentWidth <= viewportWidth) return;
      const totalMs = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const visibleSpanMs = totalMs * Math.min(1, viewportWidth / this._rangeContentWidth);
      const maxScrollLeft = Math.max(0, this._rangeContentWidth - viewportWidth);
      const viewportRangeMs = Math.max(0, totalMs - visibleSpanMs);
      if (viewportRangeMs <= 0) return;
      const targetStart = center ? clampNumber(
        (range.start + range.end) / 2 - visibleSpanMs / 2,
        this._rangeBounds.min,
        this._rangeBounds.max - visibleSpanMs
      ) : clampNumber(range.start, this._rangeBounds.min, this._rangeBounds.max - visibleSpanMs);
      const ratio = (targetStart - this._rangeBounds.min) / viewportRangeMs;
      const nextLeft = clampNumber(ratio * maxScrollLeft, 0, maxScrollLeft);
      this._rangeScrollViewportEl.scrollTo({ left: nextLeft, behavior });
    }
    _revealSelectionInTimeline(behavior = "auto") {
      if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !this._startTime || !this._endTime) return;
      const focusRange = this._chartZoomCommittedRange || {
        start: this._startTime.getTime(),
        end: this._endTime.getTime()
      };
      this._scrollTimelineToRange(focusRange, behavior, { center: true });
    }
    _updateSelectionJumpControls() {
      if (!this._rangeScrollViewportEl || !this._rangeBounds || !this._rangeContentWidth || !this._startTime || !this._endTime) {
        if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = true;
        if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = true;
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const viewportWidth = this._rangeScrollViewportEl.clientWidth;
      const currentLeft = this._rangeScrollViewportEl.scrollLeft;
      const currentRight = currentLeft + viewportWidth;
      const startPx = (this._startTime.getTime() - this._rangeBounds.min) / total * this._rangeContentWidth;
      const endPx = (this._endTime.getTime() - this._rangeBounds.min) / total * this._rangeContentWidth;
      const isLeftHidden = endPx < currentLeft;
      const isRightHidden = startPx > currentRight;
      if (this._rangeJumpLeftEl) this._rangeJumpLeftEl.hidden = !isLeftHidden;
      if (this._rangeJumpRightEl) this._rangeJumpRightEl.hidden = !isRightHidden;
    }
    _getVisibleTimelineSpanMs() {
      if (!this._rangeBounds) return RANGE_SLIDER_WINDOW_MS;
      const viewportWidth = Math.max(this._rangeScrollViewportEl?.clientWidth || 0, 1);
      const contentWidth = Math.max(this._rangeContentWidth || viewportWidth, viewportWidth);
      const totalMs = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      return totalMs * Math.min(1, viewportWidth / contentWidth);
    }
    _syncRangeControl() {
      if (!this._dateControl || !this._rangeTrackEl || !this._rangeStartHandle || !this._rangeEndHandle) return;
      this._rangeBounds = this._deriveRangeBounds();
      void this._ensureTimelineEvents();
      this._draftStartTime = new Date(this._startTime);
      this._draftEndTime = new Date(this._endTime);
      this._syncTimelineWidth();
      this._updateHandleStacking();
      this._renderRangeScale();
      this._updateRangePreview();
      this._updateComparisonRangePreview();
      this._updateChartHoverIndicator();
      this._updateChartZoomHighlight();
      this._updateSelectionJumpControls();
      window.requestAnimationFrame(() => this._revealSelectionInTimeline("auto"));
    }
    _renderScaleMarkers(fragment, unit, className, total, step = 1) {
      let markerTime = addUnit(startOfUnit(new Date(this._rangeBounds.min), unit), unit, 0);
      if (markerTime.getTime() < this._rangeBounds.min) {
        markerTime = addUnit(markerTime, unit, step);
      }
      while (markerTime.getTime() < this._rangeBounds.max) {
        const tick = document.createElement("span");
        tick.className = `range-tick ${className}`;
        tick.style.left = `${(markerTime.getTime() - this._rangeBounds.min) / total * 100}%`;
        fragment.appendChild(tick);
        markerTime = addUnit(markerTime, unit, step);
      }
    }
    _buildRangePeriodButton(className, leftValue, total, text, unit, startTime) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `range-period-button ${className}`;
      button.style.left = `${(leftValue - this._rangeBounds.min) / total * 100}%`;
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
      const unitStart = Math.max(startOfUnit(new Date(startTime), unit).getTime(), this._rangeBounds?.min ?? -Infinity);
      const unitEnd = Math.min(endOfUnit(new Date(startTime), unit).getTime(), this._rangeBounds?.max ?? Infinity);
      if (anchor === "auto") {
        if (unit === "day" || unit === "week") {
          anchor = "center";
        } else {
          anchor = "start";
        }
      }
      if (anchor === "center") {
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
      if (!this._rangeBounds || !this._rangeContentWidth) return 1;
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      let current = startOfUnit(new Date(this._rangeBounds.min), unit);
      let previousMs = null;
      let minSpacingPx = Infinity;
      let maxLabelWidthPx = 0;
      let samples = 0;
      while (current.getTime() < this._rangeBounds.max && samples < 24) {
        const currentMs = Math.max(current.getTime(), this._rangeBounds.min);
        const text = formatter(current);
        maxLabelWidthPx = Math.max(
          maxLabelWidthPx,
          this._estimateRangeLabelWidth(text, className, minGap)
        );
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
    _updateRangeLabelVisibility(selector, minGap = RANGE_LABEL_MIN_GAP_PX) {
    }
    _syncVisibleRangeLabels() {
      if (!this._rangeScrollViewportEl) return;
      this._updateRangeLabelVisibility(".range-scale-label", RANGE_LABEL_MIN_GAP_PX);
      this._updateRangeLabelVisibility(".range-context-label", RANGE_CONTEXT_LABEL_MIN_GAP_PX);
    }
    _renderRangeScale() {
      if (!this._rangeBounds || !this._rangeTickLayerEl || !this._rangeLabelLayerEl || !this._rangeContextLayerEl || !this._rangeEventLayerEl) return;
      this._rangeTickLayerEl.innerHTML = "";
      this._rangeEventLayerEl.innerHTML = "";
      this._rangeLabelLayerEl.innerHTML = "";
      this._rangeContextLayerEl.innerHTML = "";
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const { config } = this._rangeBounds;
      const tickFragment = document.createDocumentFragment();
      const eventFragment = document.createDocumentFragment();
      const labelFragment = document.createDocumentFragment();
      const contextFragment = document.createDocumentFragment();
      const scaleLabelStride = config.labelUnit === "month" ? 1 : config.labelUnit === "day" ? 1 : this._computeRangeLabelStride(
        config.labelUnit,
        (value) => formatScaleLabel(value, config.labelUnit, this._getEffectiveZoomLevel()),
        "range-scale-label",
        RANGE_LABEL_MIN_GAP_PX
      );
      const contextLabelStride = config.contextUnit === "month" ? 1 : config.contextUnit === "day" ? 1 : this._computeRangeLabelStride(
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
      let labelRef = startOfUnit(new Date(this._rangeBounds.min), config.labelUnit);
      let labelIndex = 0;
      while (labelRef.getTime() < this._rangeBounds.max) {
        if (labelIndex % scaleLabelStride === 0) {
          const leftValue = this._getRangeUnitAnchorMs(labelRef, config.labelUnit, "auto");
          const label = this._buildRangePeriodButton(
            "range-scale-label",
            leftValue,
            total,
            formatScaleLabel(labelRef, config.labelUnit, this._getEffectiveZoomLevel()),
            config.labelUnit,
            labelRef
          );
          labelFragment.appendChild(label);
        }
        labelRef = addUnit(labelRef, config.labelUnit, 1);
        labelIndex += 1;
      }
      let contextRef = startOfUnit(new Date(this._rangeBounds.min), config.contextUnit);
      if (contextRef.getTime() < this._rangeBounds.min) {
        contextRef = addUnit(contextRef, config.contextUnit, 1);
      }
      let contextIndex = 0;
      while (contextRef.getTime() < this._rangeBounds.max) {
        const left = `${(contextRef.getTime() - this._rangeBounds.min) / total * 100}%`;
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
      for (const event of this._timelineEvents || []) {
        const timestamp = new Date(event.timestamp).getTime();
        if (!Number.isFinite(timestamp) || timestamp < this._rangeBounds.min || timestamp > this._rangeBounds.max) continue;
        const dot = document.createElement("span");
        dot.className = "range-event-dot";
        dot.style.left = `${(timestamp - this._rangeBounds.min) / total * 100}%`;
        dot.style.background = event.color || "#03a9f4";
        eventFragment.appendChild(dot);
      }
      this._rangeTickLayerEl.appendChild(tickFragment);
      this._rangeEventLayerEl.appendChild(eventFragment);
      this._rangeLabelLayerEl.appendChild(labelFragment);
      this._rangeContextLayerEl.appendChild(contextFragment);
      this._updateHoveredPeriodPreview();
      this._updateComparisonRangePreview();
      this._syncVisibleRangeLabels();
    }
    _handleRangePeriodSelect(unit, startTime, ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const periodStart = startOfUnit(new Date(startTime), unit);
      const periodEnd = endOfUnit(new Date(startTime), unit);
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      this._clearAutoZoomTimer();
      this._draftStartTime = new Date(periodStart);
      this._draftEndTime = new Date(periodEnd);
      this._updateRangePreview();
      this._applyCommittedRange(periodStart, periodEnd, { push: true });
    }
    _setHoveredPeriodRange(unit, startTime) {
      const start = startOfUnit(new Date(startTime), unit);
      const end = endOfUnit(new Date(startTime), unit);
      this._hoveredPeriodRange = {
        unit,
        start: start.getTime(),
        end: end.getTime()
      };
      this._updateHoveredPeriodPreview();
    }
    _setHoveredPeriodRangeFromTimestamp(timestamp, unit = this._rangeBounds?.config?.labelUnit) {
      if (timestamp == null || !unit) return;
      this._setHoveredPeriodRange(unit, new Date(timestamp));
    }
    _clearHoveredPeriodRange(unit, startTime) {
      if (!this._hoveredPeriodRange) return;
      const start = startOfUnit(new Date(startTime), unit).getTime();
      const end = endOfUnit(new Date(startTime), unit).getTime();
      if (this._hoveredPeriodRange.start === start && this._hoveredPeriodRange.end === end) {
        this._hoveredPeriodRange = null;
        this._updateHoveredPeriodPreview();
      }
    }
    _updateHoveredPeriodPreview() {
      if (!this._rangeHoverPreviewEl || !this._rangeBounds || !this._hoveredPeriodRange) {
        if (this._rangeHoverPreviewEl) {
          this._rangeHoverPreviewEl.classList.remove("visible");
        }
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const start = clampNumber(this._hoveredPeriodRange.start, this._rangeBounds.min, this._rangeBounds.max);
      const end = clampNumber(this._hoveredPeriodRange.end, this._rangeBounds.min, this._rangeBounds.max);
      const startPct = (start - this._rangeBounds.min) / total * 100;
      const endPct = (end - this._rangeBounds.min) / total * 100;
      this._rangeHoverPreviewEl.style.left = `${startPct}%`;
      this._rangeHoverPreviewEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      this._rangeHoverPreviewEl.classList.add("visible");
    }
    _updateComparisonRangePreview() {
      const comparisonWindow = this._getActiveComparisonWindow();
      if (!this._rangeComparisonPreviewEl || !this._rangeBounds || !comparisonWindow) {
        if (this._rangeComparisonPreviewEl) {
          this._rangeComparisonPreviewEl.classList.remove("visible");
        }
        this._updateZoomWindowHighlight();
        return;
      }
      const startMs = new Date(comparisonWindow.start_time).getTime();
      const endMs = new Date(comparisonWindow.end_time).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
        this._rangeComparisonPreviewEl.classList.remove("visible");
        this._updateZoomWindowHighlight();
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const start = clampNumber(startMs, this._rangeBounds.min, this._rangeBounds.max);
      const end = clampNumber(endMs, this._rangeBounds.min, this._rangeBounds.max);
      const startPct = (start - this._rangeBounds.min) / total * 100;
      const endPct = (end - this._rangeBounds.min) / total * 100;
      this._rangeComparisonPreviewEl.style.left = `${startPct}%`;
      this._rangeComparisonPreviewEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      this._rangeComparisonPreviewEl.classList.add("visible");
      this._updateZoomWindowHighlight();
    }
    _updateHandleStacking(activeHandle = this._activeRangeHandle) {
      if (!this._rangeStartHandle || !this._rangeEndHandle) return;
      this._rangeStartHandle.style.zIndex = activeHandle === "start" ? "5" : "3";
      this._rangeEndHandle.style.zIndex = activeHandle === "end" ? "5" : "4";
    }
    _getVisibleRangeTooltipHandles() {
      if (this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return ["start", "end"];
      const handle = this._activeRangeHandle || this._focusedRangeHandle || this._hoveredRangeHandle || null;
      return handle ? [handle] : [];
    }
    _handleRangeViewportPointerMove(ev) {
      if (this._timelinePointerId != null || this._rangePointerId != null) return;
      if (ev.target === this._rangeStartHandle || ev.target === this._rangeEndHandle) return;
      if (ev.target.closest?.(".range-period-button") || ev.target.closest?.(".range-selection")) return;
      const timestamp = this._timestampFromClientX(ev.clientX);
      if (timestamp == null) return;
      this._setHoveredPeriodRangeFromTimestamp(timestamp);
    }
    _handleRangeViewportPointerLeave() {
      if (this._timelinePointerId != null || this._rangePointerId != null) return;
      this._hoveredPeriodRange = null;
      this._updateHoveredPeriodPreview();
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
      if (!this._rangeChartHoverLineEl || !this._rangeBounds || this._chartHoverTimeMs == null) {
        if (this._rangeChartHoverLineEl) {
          this._rangeChartHoverLineEl.classList.remove("visible");
        }
        if (this._rangeChartHoverWindowLineEl) {
          this._rangeChartHoverWindowLineEl.classList.remove("visible");
        }
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const clamped = clampNumber(this._chartHoverTimeMs, this._rangeBounds.min, this._rangeBounds.max);
      const leftPct = (clamped - this._rangeBounds.min) / total * 100;
      this._rangeChartHoverLineEl.style.left = `${leftPct}%`;
      this._rangeChartHoverLineEl.classList.add("visible");
      const activeWindow = this._getActiveComparisonWindow();
      if (this._rangeChartHoverWindowLineEl && activeWindow && this._startTime) {
        const timeOffsetMs = new Date(activeWindow.start_time).getTime() - this._startTime.getTime();
        const windowTimeMs = this._chartHoverTimeMs + timeOffsetMs;
        const clampedWindow = clampNumber(windowTimeMs, this._rangeBounds.min, this._rangeBounds.max);
        const windowLeftPct = (clampedWindow - this._rangeBounds.min) / total * 100;
        this._rangeChartHoverWindowLineEl.style.left = `${windowLeftPct}%`;
        this._rangeChartHoverWindowLineEl.classList.add("visible");
      } else if (this._rangeChartHoverWindowLineEl) {
        this._rangeChartHoverWindowLineEl.classList.remove("visible");
      }
    }
    _updateChartZoomHighlight() {
      const highlightRange = this._chartZoomRange || this._chartZoomCommittedRange;
      if (!this._rangeZoomHighlightEl || !this._rangeBounds || !highlightRange) {
        if (this._rangeZoomHighlightEl) {
          this._rangeZoomHighlightEl.classList.remove("visible");
        }
        this._updateZoomWindowHighlight();
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const start = clampNumber(highlightRange.start, this._rangeBounds.min, this._rangeBounds.max);
      const end = clampNumber(highlightRange.end, this._rangeBounds.min, this._rangeBounds.max);
      const startPct = (start - this._rangeBounds.min) / total * 100;
      const endPct = (end - this._rangeBounds.min) / total * 100;
      this._rangeZoomHighlightEl.style.left = `${startPct}%`;
      this._rangeZoomHighlightEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      this._rangeZoomHighlightEl.classList.add("visible");
      this._updateZoomWindowHighlight();
    }
    _updateZoomWindowHighlight() {
      const activeWindow = this._getActiveComparisonWindow();
      const zoomRange = this._chartZoomRange || this._chartZoomCommittedRange;
      if (!this._rangeZoomWindowHighlightEl || !this._rangeBounds || !activeWindow || !zoomRange || !this._startTime) {
        if (this._rangeZoomWindowHighlightEl) {
          this._rangeZoomWindowHighlightEl.classList.remove("visible");
        }
        return;
      }
      const windowStartMs = new Date(activeWindow.start_time).getTime();
      const windowEndMs = new Date(activeWindow.end_time).getTime();
      if (!Number.isFinite(windowStartMs) || !Number.isFinite(windowEndMs) || windowStartMs >= windowEndMs) {
        this._rangeZoomWindowHighlightEl.classList.remove("visible");
        return;
      }
      const timeOffsetMs = windowStartMs - this._startTime.getTime();
      const zoomStartMs = +zoomRange.start + timeOffsetMs;
      const zoomEndMs = +zoomRange.end + timeOffsetMs;
      const intersectStart = Math.max(windowStartMs, zoomStartMs);
      const intersectEnd = Math.min(windowEndMs, zoomEndMs);
      if (intersectStart >= intersectEnd) {
        this._rangeZoomWindowHighlightEl.classList.remove("visible");
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const clampedStart = clampNumber(intersectStart, this._rangeBounds.min, this._rangeBounds.max);
      const clampedEnd = clampNumber(intersectEnd, this._rangeBounds.min, this._rangeBounds.max);
      if (clampedEnd <= clampedStart) {
        this._rangeZoomWindowHighlightEl.classList.remove("visible");
        return;
      }
      const startPct = (clampedStart - this._rangeBounds.min) / total * 100;
      const endPct = (clampedEnd - this._rangeBounds.min) / total * 100;
      this._rangeZoomWindowHighlightEl.style.left = `${startPct}%`;
      this._rangeZoomWindowHighlightEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      this._rangeZoomWindowHighlightEl.classList.add("visible");
    }
    _setRangeTooltipHoverHandle(handle) {
      if (handle !== "start" && handle !== "end") return;
      this._hoveredRangeHandle = handle;
      this._updateRangeTooltip();
    }
    _clearRangeTooltipHoverHandle(handle) {
      if (this._activeRangeHandle === handle) return;
      if (this._hoveredRangeHandle === handle) {
        this._hoveredRangeHandle = null;
      }
      this._updateRangeTooltip();
    }
    _setRangeTooltipFocusHandle(handle) {
      if (handle !== "start" && handle !== "end") return;
      this._focusedRangeHandle = handle;
      this._updateRangeTooltip();
    }
    _clearRangeTooltipFocusHandle(handle) {
      if (this._activeRangeHandle === handle) return;
      if (this._focusedRangeHandle === handle) {
        this._focusedRangeHandle = null;
      }
      this._updateRangeTooltip();
    }
    _updateRangeTooltip() {
      if (!this._rangeBounds || !this._rangeScrollViewportEl) return;
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
      if (!value || !this._rangeBounds || !this._rangeScrollViewportEl) {
        tooltip.classList.remove("visible");
        tooltip.setAttribute("aria-hidden", "true");
        return;
      }
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const contentWidth = Math.max(
        this._rangeContentWidth || 0,
        this._rangeScrollViewportEl.clientWidth || 0,
        1
      );
      const valuePx = (value.getTime() - this._rangeBounds.min) / total * contentWidth;
      const viewportX = valuePx - this._rangeScrollViewportEl.scrollLeft;
      const clampedX = clampNumber(viewportX, 0, this._rangeScrollViewportEl.clientWidth);
      tooltip.textContent = formatRangeDateTime(value);
      tooltip.style.left = `${clampedX}px`;
      tooltip.classList.add("visible");
      tooltip.setAttribute("aria-hidden", "false");
    }
    _handleTimelinePointerDown(ev) {
      if (ev.button !== 0) return;
      if (ev.target === this._rangeStartHandle || ev.target === this._rangeEndHandle) return;
      if (ev.target.closest?.(".range-period-button")) return;
      if (!this._rangeScrollViewportEl) return;
      const isSelectionDrag = !!ev.target.closest?.(".range-selection");
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
      this._timelinePointerMode = isSelectionDrag ? "selection" : isIntervalSelect ? "interval_select" : "pan";
      this._timelineDragStartRangeMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? 0;
      this._timelineDragEndRangeMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? 0;
      this._timelineDragStartZoomRange = this._chartZoomCommittedRange ? { ...this._chartZoomCommittedRange } : null;
      this._timelinePointerMoved = false;
      this._timelineTrackClickPending = !isSelectionDrag && !isIntervalSelect && !!ev.target.closest?.(".range-track");
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
      if (this._rangeScrollViewportEl) {
        this._rangeScrollViewportEl.classList.remove("dragging");
      }
      this._rangeSelectionEl?.classList.remove("dragging");
      this._timelinePointerId = null;
      this._timelinePointerStartTimestamp = null;
      this._timelinePointerMode = null;
      this._timelineDragStartZoomRange = null;
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
      const shouldSelectTrack = this._timelineTrackClickPending && !this._timelinePointerMoved;
      const clientX = ev.clientX;
      this._detachTimelinePointerListeners();
      if (mode === "selection") {
        this._focusedRangeHandle = null;
        this._hoveredRangeHandle = null;
        this._updateRangeTooltip();
        if (this._timelinePointerMoved) {
          this._chartZoomCommittedRange = this._chartZoomRange ? { ...this._chartZoomRange } : this._chartZoomCommittedRange;
          this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
          this._commitRangeSelection({ push: true });
        } else {
          this._chartZoomRange = this._chartZoomCommittedRange ? { ...this._chartZoomCommittedRange } : null;
          this._updateChartZoomHighlight();
        }
        return;
      }
      if (mode === "interval_select") {
        this._hoveredPeriodRange = null;
        this._updateHoveredPeriodPreview();
        this._updateRangeTooltip();
        if (this._timelinePointerMoved) {
          this._commitRangeSelection({ push: true });
        }
        return;
      }
      if (shouldSelectTrack) {
        this._handleTrackSelectionAtClientX(clientX);
      }
    }
    _timestampFromClientX(clientX) {
      if (!this._rangeBounds || !this._rangeTrackEl) return null;
      const rect = this._rangeTrackEl.getBoundingClientRect();
      if (!rect.width) return null;
      const ratio = clampNumber((clientX - rect.left) / rect.width, 0, 1);
      return this._rangeBounds.min + ratio * (this._rangeBounds.max - this._rangeBounds.min);
    }
    _getTimelineSelectionDragDeltaMs(timestamp) {
      if (timestamp == null || this._timelinePointerStartTimestamp == null) return 0;
      const snapUnit = this._getEffectiveSnapUnit();
      if (!snapUnit) return timestamp - this._timelinePointerStartTimestamp;
      const snappedStart = snapDateToUnit(new Date(this._timelinePointerStartTimestamp), snapUnit).getTime();
      const snappedCurrent = snapDateToUnit(new Date(timestamp), snapUnit).getTime();
      return snappedCurrent - snappedStart;
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
    _shiftDraftRangeByDelta(deltaMs) {
      if (!this._rangeBounds) return;
      const startMs = this._timelineDragStartRangeMs;
      const endMs = this._timelineDragEndRangeMs;
      const minDelta = this._rangeBounds.min - startMs;
      const maxDelta = this._rangeBounds.max - endMs;
      const clampedDelta = clampNumber(deltaMs, minDelta, maxDelta);
      this._draftStartTime = new Date(startMs + clampedDelta);
      this._draftEndTime = new Date(endMs + clampedDelta);
      if (this._timelineDragStartZoomRange) {
        this._chartZoomRange = {
          start: this._timelineDragStartZoomRange.start + clampedDelta,
          end: this._timelineDragStartZoomRange.end + clampedDelta
        };
        this._updateChartZoomHighlight();
      }
      this._updateRangePreview();
      this._scheduleAutoZoomUpdate();
      this._scheduleRangeCommit();
    }
    _setDraftRangeFromIntervalSelection(startTimestamp, endTimestamp) {
      if (!this._rangeBounds) return;
      const unit = this._rangeBounds.config?.labelUnit || this._getEffectiveSnapUnit();
      const startValue = Math.min(startTimestamp, endTimestamp);
      const endValue = Math.max(startTimestamp, endTimestamp);
      const rangeStart = clampNumber(startOfUnit(new Date(startValue), unit).getTime(), this._rangeBounds.min, this._rangeBounds.max);
      const rangeEnd = clampNumber(endOfUnit(new Date(endValue), unit).getTime(), this._rangeBounds.min, this._rangeBounds.max);
      if (rangeStart >= rangeEnd) return;
      this._draftStartTime = new Date(rangeStart);
      this._draftEndTime = new Date(rangeEnd);
      this._updateRangePreview();
    }
    _handleTrackSelectionAtClientX(clientX) {
      const timestamp = this._timestampFromClientX(clientX);
      if (timestamp == null) return;
      const startMs = this._draftStartTime?.getTime() ?? this._startTime?.getTime() ?? this._rangeBounds?.min;
      const endMs = this._draftEndTime?.getTime() ?? this._endTime?.getTime() ?? this._rangeBounds?.max;
      const handle = Math.abs(timestamp - startMs) <= Math.abs(timestamp - endMs) ? "start" : "end";
      this._setDraftRangeFromTimestamp(handle, timestamp);
    }
    _beginRangePointerInteraction(handle, ev) {
      if (!this._rangeTrackEl) return;
      ev.preventDefault();
      this._rangeInteractionActive = true;
      if (this._rangeCommitTimer) {
        window.clearTimeout(this._rangeCommitTimer);
        this._rangeCommitTimer = null;
      }
      this._activeRangeHandle = handle;
      this._hoveredRangeHandle = handle;
      this._rangePointerId = ev.pointerId;
      this._updateHandleStacking(handle);
      this._updateRangeTooltip();
      this._attachRangePointerListeners();
      const target = handle === "start" ? this._rangeStartHandle : this._rangeEndHandle;
      target?.focus();
      const timestamp = this._timestampFromClientX(ev.clientX);
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
        const ratio = clampNumber(
          (RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - leftDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
          0,
          1
        );
        delta = -Math.max(1, Math.round(ratio * RANGE_HANDLE_EDGE_SCROLL_MAX_STEP_PX));
      } else if (rightDistance < RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX) {
        const ratio = clampNumber(
          (RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX - rightDistance) / RANGE_HANDLE_EDGE_SCROLL_THRESHOLD_PX,
          0,
          1
        );
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
    _handleRangeHandleKeyDown(handle, ev) {
      if (!this._rangeBounds) return;
      const snapUnit = this._getEffectiveSnapUnit();
      const currentValue = handle === "start" ? this._draftStartTime?.getTime() ?? this._startTime?.getTime() : this._draftEndTime?.getTime() ?? this._endTime?.getTime();
      if (currentValue == null) return;
      let nextValue = null;
      if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") nextValue = addUnit(new Date(currentValue), snapUnit, -1).getTime();
      if (ev.key === "ArrowRight" || ev.key === "ArrowUp") nextValue = addUnit(new Date(currentValue), snapUnit, 1).getTime();
      if (ev.key === "PageDown") nextValue = addUnit(new Date(currentValue), this._getZoomConfig().majorUnit, -1).getTime();
      if (ev.key === "PageUp") nextValue = addUnit(new Date(currentValue), this._getZoomConfig().majorUnit, 1).getTime();
      if (ev.key === "Home") nextValue = this._rangeBounds.min;
      if (ev.key === "End") nextValue = this._rangeBounds.max;
      if (nextValue == null) return;
      ev.preventDefault();
      this._focusedRangeHandle = handle;
      this._setDraftRangeFromTimestamp(handle, nextValue);
    }
    _updateRangePreview() {
      if (!this._rangeBounds || !this._draftStartTime || !this._draftEndTime) return;
      const total = Math.max(1, this._rangeBounds.max - this._rangeBounds.min);
      const startPct = (this._draftStartTime.getTime() - this._rangeBounds.min) / total * 100;
      const endPct = (this._draftEndTime.getTime() - this._rangeBounds.min) / total * 100;
      if (this._rangeSelectionEl) {
        this._rangeSelectionEl.style.left = `${startPct}%`;
        this._rangeSelectionEl.style.width = `${Math.max(0, endPct - startPct)}%`;
      }
      if (this._rangeStartHandle) {
        this._rangeStartHandle.style.left = `${startPct}%`;
        this._rangeStartHandle.setAttribute("aria-valuetext", formatRangeDateTime(this._draftStartTime));
        this._rangeStartHandle.removeAttribute("title");
      }
      if (this._rangeEndHandle) {
        this._rangeEndHandle.style.left = `${endPct}%`;
        this._rangeEndHandle.setAttribute("aria-valuetext", formatRangeDateTime(this._draftEndTime));
        this._rangeEndHandle.removeAttribute("title");
      }
      if (this._rangeCaptionEl) {
        this._rangeCaptionEl.textContent = formatRangeSummary(this._draftStartTime, this._draftEndTime);
      }
      if (this._dateControl) {
        this._dateControl.title = formatRangeSummary(this._draftStartTime, this._draftEndTime);
      }
      this._updateRangeTooltip();
    }
    _scheduleRangeCommit() {
      if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
      if (this._rangeCommitTimer) window.clearTimeout(this._rangeCommitTimer);
      this._rangeCommitTimer = window.setTimeout(() => {
        this._rangeCommitTimer = null;
        this._commitRangeSelection({ push: false });
      }, 240);
    }
    _scheduleAutoZoomUpdate() {
      if (this._rangeInteractionActive || this._timelinePointerMode === "selection" || this._timelinePointerMode === "interval_select") return;
      if (this._zoomLevel !== "auto" || !this._rangeBounds) return;
      const start = this._draftStartTime || this._startTime;
      const end = this._draftEndTime || this._endTime;
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
        const latestStart = this._draftStartTime || this._startTime;
        const latestEnd = this._draftEndTime || this._endTime;
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
    _applyCommittedRange(start, end, { push = false } = {}) {
      if (!start || !end || start >= end) return;
      const nextStart = new Date(start);
      const nextEnd = new Date(end);
      const didChange = !this._startTime || !this._endTime || this._startTime.getTime() !== nextStart.getTime() || this._endTime.getTime() !== nextEnd.getTime();
      this._startTime = nextStart;
      this._endTime = nextEnd;
      this._hours = Math.max(1, Math.round((nextEnd.getTime() - nextStart.getTime()) / HOUR_MS));
      this._scheduleAutoZoomUpdate();
      this._syncControls();
      this._updateSelectionJumpControls();
      this._chartEl?.setExternalZoomRange?.(this._chartZoomCommittedRange);
      window.requestAnimationFrame(() => this._revealSelectionInTimeline(push ? "smooth" : "auto"));
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
      const renderKey = JSON.stringify({
        tabs: tabs.map((window2) => ({
          id: window2.id,
          label: window2.label,
          detail: window2.detail || "",
          active: !!window2.active,
          loading: this._loadingComparisonWindowIds.includes(window2.id),
          previewing: this._hoveredComparisonWindowId === window2.id
        }))
      });
      tabsEl.hidden = false;
      if (this._comparisonTabsHostEl !== tabsEl) {
        this._comparisonTabsHostEl = tabsEl;
        this._comparisonTabsRenderKey = "";
      }
      if (this._comparisonTabsRenderKey !== renderKey) {
        tabsEl.innerHTML = `
        <div class="chart-tabs-shell" id="chart-tabs-shell">
          <div class="chart-tabs-rail" id="chart-tabs-rail">
            <div class="chart-tabs">
              ${tabs.map((window2) => `
                <div
                  class="chart-tab ${window2.active ? "active" : ""} ${this._hoveredComparisonWindowId === window2.id ? "previewing" : ""} ${this._loadingComparisonWindowIds.includes(window2.id) ? "loading" : ""}"
                  data-comparison-id="${esc(window2.id)}"
                >
                  <button
                    type="button"
                    class="chart-tab-trigger"
                    data-comparison-trigger="${esc(window2.id)}"
                    ${window2.active ? 'aria-current="true"' : ""}
                  >
                    <span class="chart-tab-content">
                      <span class="chart-tab-main">
                        ${this._loadingComparisonWindowIds.includes(window2.id) ? '<span class="chart-tab-spinner" aria-hidden="true"></span>' : ""}
                        <span class="chart-tab-label">${esc(window2.label)}</span>
                      </span>
                      <span class="chart-tab-detail-row">
                        <span class="chart-tab-detail">${esc(window2.detail || "")}</span>
                      </span>
                    </span>
                  </button>
                  ${window2.editable ? `
                    <span class="chart-tab-actions">
                      <button type="button" class="chart-tab-action edit" data-date-window-edit="${esc(window2.id)}" aria-label="Edit ${esc(window2.label)}">
                        <ha-icon icon="mdi:pencil-outline"></ha-icon>
                      </button>
                      <button type="button" class="chart-tab-action delete" data-date-window-delete="${esc(window2.id)}" aria-label="Delete ${esc(window2.label)}">
                        <ha-icon icon="mdi:close"></ha-icon>
                      </button>
                    </span>
                  ` : ""}
                </div>
              `).join("")}
            </div>
          </div>
          <button type="button" class="chart-tabs-add" id="chart-tabs-add">
            <ha-icon icon="mdi:plus"></ha-icon>
            <span class="chart-tabs-add-label">Add date window</span>
          </button>
        </div>
      `;
        tabsEl.querySelector("#chart-tabs-add")?.addEventListener("click", () => this._openDateWindowDialog());
        tabsEl.querySelectorAll("[data-date-window-edit]").forEach((button) => {
          button.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const id = button.getAttribute("data-date-window-edit");
            const window2 = this._comparisonWindows.find((entry) => entry.id === id);
            if (window2) this._openDateWindowDialog(window2);
          });
        });
        tabsEl.querySelectorAll("[data-date-window-delete]").forEach((button) => {
          button.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const id = button.getAttribute("data-date-window-delete");
            if (id) this._deleteDateWindow(id);
          });
        });
        tabsEl.querySelectorAll("[data-comparison-id]").forEach((tab) => {
          const id = tab.dataset.comparisonId;
          const trigger = tab.querySelector("[data-comparison-trigger]");
          if (!id) {
            return;
          }
          if (id !== "current-range") {
            tab.addEventListener("mouseenter", () => this._handleComparisonTabHover(id));
            tab.addEventListener("mouseleave", () => this._handleComparisonTabLeave(id));
            trigger?.addEventListener("focus", () => this._handleComparisonTabHover(id));
            trigger?.addEventListener("blur", () => this._handleComparisonTabLeave(id));
          }
          trigger?.addEventListener("click", () => this._handleComparisonTabActivate(id));
        });
        this._comparisonTabsRenderKey = renderKey;
      }
      tabsEl.querySelectorAll("[data-comparison-id]").forEach((tab) => {
        const id = tab.dataset.comparisonId;
        tab.classList.toggle("previewing", !!id && id === this._hoveredComparisonWindowId);
      });
      this._updateComparisonTabsOverflow();
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
        content.innerHTML = `
        <div id="chart-host" class="chart-host">
          <div id="chart-card-host" class="chart-card-host"></div>
        </div>
        <button
          id="content-splitter"
          class="content-splitter"
          type="button"
          aria-label="Resize chart and records panes"
        ></button>
        <div id="list-host" class="list-host"></div>
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
        this._contentSplitterEl = content.querySelector("#content-splitter");
        this._contentSplitterEl?.addEventListener("pointerdown", (ev) => this._beginContentSplitPointer(ev));
        this._chartEl = chart;
        this._contentKey = contentKey;
        this._chartConfigKey = "";
        this._listConfigKey = "";
      }
      content.classList.toggle("datapoints-hidden", !showRecordsPanel);
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
      const nextChartConfigKey = JSON.stringify(chartConfig);
      if (this._chartEl && this._chartConfigKey !== nextChartConfigKey) {
        this._chartEl.setConfig(chartConfig);
        this._chartConfigKey = nextChartConfigKey;
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
  const registeredTypes = new Set(window.customCards.map((c) => c.type));
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
  console.info(
    "%c hass-datapoints %c v0.3.0 loaded ",
    "color:#fff;background:#03a9f4;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
    "color:#03a9f4;background:#fff;font-weight:bold;padding:2px 6px;border:1px solid #03a9f4;border-radius:0 3px 3px 0"
  );
})();
