import * as shared from "../../lib/shared.js";

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
  fmtRelativeTime,
  labelIcon,
  labelName,
  navigateToDataPointsHistory,
  normalizeTargetSelection,
  updateEvent,
} = shared;

/**
 * hass-datapoints-list-card – Activity-style datagrid with search, pagination, edit/delete.
 */

export class HassRecordsListCard extends HTMLElement {
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
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
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
    }).catch(() => {});

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
      label_id: ev?.label_ids || [],
    }, {
      start_time: range?.start_time,
      end_time: range?.end_time,
      zoom_start_time: range?.zoom_start_time,
      zoom_end_time: range?.zoom_end_time,
      datapoint_scope: this._config?.datapoint_scope,
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
        zoom_end_time: zoomEndTime,
      };
    }
    const eventTime = ev?.timestamp ? new Date(ev.timestamp) : null;
    if (!eventTime || !Number.isFinite(eventTime.getTime())) return null;
    const start = new Date(eventTime.getTime() - (12 * 3600 * 1000));
    const end = new Date(eventTime.getTime() + (12 * 3600 * 1000));
    return {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
  }

  _getHistoryLinkForEvent(ev) {
    const range = this._getNavigationContextForEvent(ev);
    return buildDataPointsHistoryPath({
      entity_id: ev?.entity_ids || [],
      device_id: ev?.device_ids || [],
      area_id: ev?.area_ids || [],
      label_id: ev?.label_ids || [],
    }, {
      start_time: range?.start_time,
      end_time: range?.end_time,
      zoom_start_time: range?.zoom_start_time,
      zoom_end_time: range?.zoom_end_time,
      datapoint_scope: this._config?.datapoint_scope,
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
      this.shadowRoot.getElementById("search").addEventListener("input", (e) => {
        this._searchQuery = e.target.value.toLowerCase();
        this._page = 0;
        this.dispatchEvent(new CustomEvent("hass-datapoints-records-search", {
          bubbles: true,
          composed: true,
          detail: { query: this._searchQuery },
        }));
        this._renderList();
      });
    }

    this.shadowRoot.getElementById("prev").addEventListener("click", () => {
      if (this._page > 0) { this._page--; this._renderList(); this.shadowRoot.getElementById("list-scroll").scrollTop = 0; }
    });

    this.shadowRoot.getElementById("next").addEventListener("click", () => {
      const pages = Math.ceil(this._filtered().length / this._pageSize);
      if (this._page < pages - 1) { this._page++; this._renderList(); this.shadowRoot.getElementById("list-scroll").scrollTop = 0; }
    });
  }

  async _load() {
    const cfg = this._config;
    const endTime = cfg.zoom_end_time || cfg.end_time || undefined;
    let startTime = cfg.zoom_start_time || cfg.start_time || undefined;
    if (!startTime && cfg.hours_to_show) {
      const end = endTime ? new Date(endTime) : new Date();
      startTime = new Date(end.getTime() - cfg.hours_to_show * 3600 * 1000).toISOString();
    }
    let entityIds;
    if (cfg.entity) {
      entityIds = [cfg.entity];
    } else if (cfg.entities) {
      entityIds = cfg.entities.map((e) => (typeof e === "string" ? e : e.entity));
    } else {
      entityIds = undefined;
    }

    this._allEvents = await fetchEvents(
      this._hass,
      startTime,
      endTime,
      this._config.datapoint_scope === "all" ? undefined : entityIds,
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
        ...(e.entity_ids || []).map((id) => id.toLowerCase()),
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
    const showActions = cfg.show_actions !== false; // default true

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
      const iconColor = contrastColor(color);
      const entities = e.entity_ids || [];
      const devices  = e.device_ids || [];
      const areas    = e.area_ids   || [];
      const labels   = e.label_ids  || [];
      const hasRelated = entities.length || devices.length || areas.length || labels.length;
      const isExpandable = !showFullMessage && annText;
      const isHidden = (this._config.hidden_event_ids || []).includes(e.id);
      const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
      const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
      const historyLinkHref = this._getHistoryLinkForEvent(e);
      const historyLink = `<a class="ev-history-link" href="${esc(historyLinkHref)}" data-event-id="${esc(e.id)}" title="Open related data point history" aria-label="Open related data point history"><ha-icon icon="mdi:history"></ha-icon><span class="ev-time-below" title="${esc(fmtDateTime(e.timestamp))}">${esc(fmtDateTime(e.timestamp))}</span></a>`;

      const isSimple = !annText && !hasRelated;
      return `
        <div class="event-item${isExpandable ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}" data-id="${esc(e.id)}">
          <div class="ev-icon-wrap" style="background:${esc(color)}">
            <ha-icon class="ev-icon-main" icon="${esc(icon)}" style="--mdc-icon-size:18px;color:${esc(iconColor)}"></ha-icon>
            <button class="ev-visibility-btn" type="button" data-event-id="${esc(e.id)}" title="${esc(visibilityLabel)}" aria-label="${esc(visibilityLabel)}">
              <ha-icon icon="${esc(visibilityIcon)}"></ha-icon>
            </button>
          </div>
          <div class="ev-body">
            <div class="ev-header">
              <div class="ev-header-text">
                <span class="ev-message">
                  ${esc(e.message)}
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
            <div class="edit-form" id="edit-${esc(e.id)}">
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

    // Pagination
    if (pages > 1) {
      pagEl.style.display = "flex";
      this.shadowRoot.getElementById("page-info").textContent =
        `Page ${this._page + 1} of ${pages} · ${total} records`;
      this.shadowRoot.getElementById("prev").disabled = this._page === 0;
      this.shadowRoot.getElementById("next").disabled = this._page >= pages - 1;
    } else {
      pagEl.style.display = "none";
    }

    // Click-to-expand full message (when show_full_message is false)
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
        if (
          e.defaultPrevented
          || e.button !== 0
          || e.metaKey
          || e.ctrlKey
          || e.shiftKey
          || e.altKey
        ) {
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
          detail: { eventId: btn.dataset.eventId },
        }));
      });
    });

    // Entity chips → HA more-info dialog
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

    // Delete
    listEl.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const item = e.target.closest(".event-item");
        const id = item?.dataset.id;
        if (!id) return;
        const message = item.querySelector(".ev-message")?.textContent?.trim() || "this record";
        const confirmed = await confirmDestructiveAction(this, {
          title: "Delete record",
          message: `Delete ${message}?`,
          confirmLabel: "Delete record",
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

    // Edit toggle
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
          const ev = this._allEvents.find((ev) => ev.id === id);
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

    // Save edit
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

    // Cancel edit
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
      min_rows: rows,
    };
  }
}
