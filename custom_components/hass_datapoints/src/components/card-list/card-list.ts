import { LitElement, html, css, type TemplateResult } from "lit";
import {
  buildDataPointsHistoryPath,
  confirmDestructiveAction,
  contrastColor,
  deleteEvent,
  DOMAIN,
  entityIcon,
  entityName,
  deviceIcon,
  deviceName,
  areaIcon,
  areaName,
  labelIcon,
  labelName,
  fetchEvents,
  fmtDateTime,
  navigateToDataPointsHistory,
  updateEvent,
} from "@/lib/shared";
import type { CardConfig, EventRecord, HassLike } from "@/lib/types";
import "@/atoms/interactive/dp-search-bar/dp-search-bar";
import "@/atoms/interactive/dp-pagination/dp-pagination";
import { logger } from "@/lib/logger.js";

// The API returns arrays; EventRecord in types.ts uses singular fields.
// This extended type covers both.
interface EventRecordFull extends EventRecord {
  entity_ids?: string[];
  device_ids?: string[];
  area_ids?: string[];
  label_ids?: string[];
}

/**
 * hass-datapoints-list-card – Activity-style datagrid with search, pagination, edit/delete.
 */
export class HassRecordsListCard extends LitElement {
  static properties = {
    _config: { state: true },
    _hass: { state: true },
    _allEvents: { state: true },
    _searchQuery: { state: true },
    _page: { state: true },
    _editingId: { state: true },
    _editColor: { state: true },
  };

  declare _config: CardConfig;

  declare _hass: HassLike | null;

  declare _allEvents: EventRecordFull[];

  declare _searchQuery: string;

  declare _page: number;

  declare _editingId: string | null;

  declare _editColor: string;

  private _pageSize = 15;

  private _unsubscribe: (() => void) | null = null;

  private _windowListener: (() => void) | null = null;

  private _initialized = false;

  static styles = css`
    :host { display: block; height: 100%; }
    ha-card {
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 16px 16px 0;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
      flex: 0 0 auto;
    }
    .search-wrap {
      padding: 12px 16px 0;
      flex: 0 0 auto;
    }
    .list-scroll {
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
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
    }
    .event-item.simple { align-items: center; }
    .event-item:hover { background: var(--secondary-background-color, rgba(0,0,0,0.02)); }
    .event-item:last-child { border-bottom: none; }
    .event-item.is-hidden .ev-icon-main,
    .event-item:hover .ev-icon-main { opacity: 0.22; }
    .ev-icon-wrap {
      position: relative;
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .ev-icon-main { transition: opacity 120ms ease; }
    .ev-visibility-btn {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: 50%;
      background: color-mix(in srgb, var(--card-background-color, #fff) 84%, transparent);
      color: var(--primary-text-color);
      cursor: pointer; opacity: 0;
      transition: opacity 120ms ease;
      padding: 0; font: inherit;
    }
    .ev-visibility-btn ha-icon { --mdc-icon-size: 15px; }
    .event-item:hover .ev-visibility-btn,
    .event-item.is-hidden .ev-visibility-btn,
    .ev-visibility-btn:focus-visible { opacity: 1; outline: none; }
    .ev-body { flex: 1; min-width: 0; }
    .ev-header { display: flex; align-items: flex-start; gap: 6px; }
    .ev-header-text { flex: 1; min-width: 0; }
    .ev-message {
      display: block; font-weight: 600; font-size: 1rem;
      line-height: 1.45; color: var(--primary-text-color); word-break: break-word;
    }
    .ev-dev-badge {
      display: inline-block; font-size: 0.68em; font-weight: 700; letter-spacing: 0.04em;
      color: #fff; background: #ff9800; padding: 1px 5px; border-radius: 4px;
      vertical-align: middle; margin-left: 4px;
    }
    .ev-meta {
      margin-top: 6px; display: flex; align-items: center;
      gap: 8px; flex-wrap: wrap;
    }
    .ev-history-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--secondary-text-color); padding: 0; margin: 0;
      cursor: pointer; font: inherit; text-align: left;
      border-radius: 8px; text-decoration: none; border: none; background: none;
    }
    .ev-history-link:hover, .ev-history-link:focus-visible {
      color: var(--primary-text-color); outline: none;
    }
    .ev-time-below {
      font-size: 0.92rem; font-weight: 500; line-height: 1.35;
      color: var(--secondary-text-color); display: block;
    }
    .ev-history-link ha-icon { --mdc-icon-size: 18px; }
    .ann-expand-chip {
      display: inline-flex; align-items: center;
      margin-top: 4px; padding: 1px 8px; border-radius: 999px;
      font-size: 0.75em; font-weight: 600; letter-spacing: 0.05em;
      color: var(--secondary-text-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      border: none; cursor: pointer; font-family: inherit;
    }
    .ev-full-message {
      font-size: 1rem; line-height: 1.6; color: var(--primary-text-color);
      margin-top: 10px; white-space: pre-wrap; word-break: break-word;
    }
    .ev-full-message.hidden { display: none; }
    .ev-entities {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
    }
    .ev-entity-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.92em; line-height: 1.2;
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      padding: 6px 12px; border-radius: 999px;
      cursor: pointer; border: none; font-family: inherit;
      transition: background 0.15s;
    }
    .ev-entity-chip:hover {
      background: color-mix(in srgb, var(--primary-color) 22%, transparent);
    }
    .ev-entity-chip ha-icon { --mdc-icon-size: 16px; }
    .ev-actions {
      display: flex; gap: 0; flex-shrink: 0;
      opacity: 0; transition: opacity 0.15s;
    }
    .event-item:hover .ev-actions { opacity: 1; }
    .edit-form {
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 8px; padding: 10px; margin-top: 8px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .edit-form ha-textfield { display: block; width: 100%; }
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
    .color-swatch-inner {
      display: block; width: 100%; height: 100%;
      border-radius: 50%; pointer-events: none;
    }
    .annotation-edit {
      display: block; width: 100%; min-height: 72px; resize: vertical;
      box-sizing: border-box; padding: 8px 10px;
      border: 1px solid var(--divider-color, #9e9e9e);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color); font: inherit; line-height: 1.45;
    }
    .pagination-wrap {
      flex: 0 0 auto;
      border-top: 1px solid var(--divider-color, #eee);
    }
    .empty {
      text-align: center; padding: 32px 16px;
      color: var(--secondary-text-color); font-size: 0.9em;
    }
    .empty ha-icon { --mdc-icon-size: 32px; display: block; margin: 0 auto 8px; opacity: 0.5; }
  `;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._allEvents = [];
    this._searchQuery = "";
    this._page = 0;
    this._editingId = null;
    this._editColor = "#03a9f4";
  }

  setConfig(config: CardConfig) {
    const nextKey = JSON.stringify(config);
    if ((this as any)._configKey === nextKey) return;
    (this as any)._configKey = nextKey;
    this._config = config || {};
    if (config.page_size) this._pageSize = config.page_size as number;
    if (this._hass) this._load();
  }

  set hass(hass: HassLike) {
    const isFirst = !this._hass;
    this._hass = hass;
    if (isFirst) {
      this._load();
      this._setupAutoRefresh();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._windowListener = () => this._load();
    window.addEventListener("hass-datapoints-event-recorded", this._windowListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._windowListener) {
      window.removeEventListener("hass-datapoints-event-recorded", this._windowListener);
      this._windowListener = null;
    }
  }

  private _setupAutoRefresh() {
    if (!this._hass) return;
    this._hass.connection
      .subscribeEvents(() => this._load(), `${DOMAIN}_event_recorded`)
      .then((unsub: () => void) => {
        this._unsubscribe = unsub;
      })
      .catch(() => {});
  }

  async _load() {
    if (!this._hass || !this._config) return;
    const cfg = this._config;
    const endTime = (cfg.zoom_end_time || cfg.end_time || undefined) as string | undefined;
    let startTime = (cfg.zoom_start_time || cfg.start_time || undefined) as string | undefined;
    if (!startTime && cfg.hours_to_show) {
      const end = endTime ? new Date(endTime) : new Date();
      startTime = new Date(end.getTime() - (cfg.hours_to_show as number) * 3600 * 1000).toISOString();
    }
    const entityIds = cfg.entity
      ? [cfg.entity as string]
      : cfg.entities
        ? (cfg.entities as Array<string | { entity: string }>).map((e) =>
            typeof e === "string" ? e : e.entity,
          )
        : undefined;

    const events = await fetchEvents(
      this._hass,
      startTime,
      endTime,
      cfg.datapoint_scope === "all" ? undefined : entityIds,
    ) as EventRecordFull[];
    this._allEvents = [...events].reverse();
  }

  private _filtered(): EventRecordFull[] {
    const msgFilter = ((this._config.message_filter as string) || "").toLowerCase().trim();
    const searchQ = this._searchQuery.toLowerCase().trim();
    return this._allEvents.filter((e) => {
      const haystack = [
        e.message.toLowerCase(),
        (e.annotation || "").toLowerCase(),
        ...(e.entity_ids || []).map((id) => id.toLowerCase()),
      ];
      if (msgFilter && !haystack.some((h) => h.includes(msgFilter))) return false;
      if (searchQ && !haystack.some((h) => h.includes(searchQ))) return false;
      return true;
    });
  }

  private _onSearch(e: CustomEvent<{ query: string }>) {
    this._searchQuery = e.detail.query;
    this._page = 0;
  }

  private _onPageChange(e: CustomEvent<{ page: number }>) {
    this._page = e.detail.page;
    this.shadowRoot?.querySelector(".list-scroll")?.scrollTo(0, 0);
  }

  private _navigateToEventHistory(ev: EventRecordFull) {
    const range = this._getNavigationContextForEvent(ev);
    navigateToDataPointsHistory(
      this,
      {
        entity_id: ev?.entity_ids || [],
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || [],
      },
      {
        start_time: range?.start_time,
        end_time: range?.end_time,
        zoom_start_time: range?.zoom_start_time,
        zoom_end_time: range?.zoom_end_time,
        datapoint_scope: this._config?.datapoint_scope,
      },
    );
  }

  private _getNavigationContextForEvent(ev: EventRecordFull) {
    const cfg = this._config || {};
    const startTime = (cfg.start_time as string) || null;
    const endTime = (cfg.end_time as string) || null;
    const zoomStartTime = (cfg.zoom_start_time as string) || null;
    const zoomEndTime = (cfg.zoom_end_time as string) || null;
    if (startTime && endTime) {
      return { start_time: startTime, end_time: endTime, zoom_start_time: zoomStartTime, zoom_end_time: zoomEndTime };
    }
    const eventTime = ev?.timestamp ? new Date(ev.timestamp) : null;
    if (!eventTime || !Number.isFinite(eventTime.getTime())) return null;
    const start = new Date(eventTime.getTime() - 12 * 3600 * 1000);
    const end = new Date(eventTime.getTime() + 12 * 3600 * 1000);
    return { start_time: start.toISOString(), end_time: end.toISOString() };
  }

  private _openEdit(ev: EventRecordFull) {
    this._editingId = ev.id;
    this._editColor = ev.color || "#03a9f4";
  }

  private _closeEdit() {
    this._editingId = null;
  }

  private async _saveEdit(ev: EventRecordFull) {
    const form = this.shadowRoot?.getElementById(`edit-${ev.id}`);
    if (!form) return;
    const msgField = form.querySelector<HTMLElement & { value: string }>(".edit-msg");
    const annField = form.querySelector<HTMLTextAreaElement>(".edit-ann");
    const iconPicker = form.querySelector<HTMLElement & { value: string }>(".edit-icon-picker");
    const msg = (msgField?.value || "").trim();
    const ann = (annField?.value || "").trim();
    const icon = iconPicker?.value || "mdi:bookmark";
    const color = this._editColor;
    if (!msg) return;
    try {
      await updateEvent(this._hass, ev.id, { message: msg, annotation: ann || msg, icon, color });
      this._closeEdit();
      await this._load();
    } catch (err) {
       
      logger.error("[hass-datapoints list-card] update failed", err);
    }
  }

  private async _deleteEvent(ev: EventRecordFull) {
    const message = ev.message || "this record";
    const confirmed = await confirmDestructiveAction(this, {
      title: "Delete record",
      message: `Delete ${message}?`,
      confirmLabel: "Delete record",
    });
    if (!confirmed) return;
    try {
      await deleteEvent(this._hass, ev.id);
      await this._load();
    } catch (err) {
       
      logger.error("[hass-datapoints list-card] delete failed", err);
    }
  }

  private _toggleVisibility(ev: EventRecordFull) {
    this.dispatchEvent(
      new CustomEvent("hass-datapoints-toggle-event-visibility", {
        bubbles: true,
        composed: true,
        detail: { eventId: ev.id },
      }),
    );
  }

  private _fireMoreInfo(entityId: string) {
    const e = new Event("hass-more-info", { bubbles: true, composed: true }) as any;
    e.detail = { entityId };
    this.dispatchEvent(e);
  }

  private _renderEventItem(ev: EventRecordFull): TemplateResult {
    const cfg = this._config;
    const showActions = cfg.show_actions !== false;
    const showEntities = cfg.show_entities !== false;
    const showFullMessage = cfg.show_full_message !== false;
    const annText = ev.annotation && ev.annotation !== ev.message ? ev.annotation : "";
    const color = ev.color || "#03a9f4";
    const icon = ev.icon || "mdi:bookmark";
    const iconColor = contrastColor(color) as string;
    const entities = ev.entity_ids || [];
    const devices = ev.device_ids || [];
    const areas = ev.area_ids || [];
    const labels = ev.label_ids || [];
    const hasRelated = entities.length || devices.length || areas.length || labels.length;
    const isExpandable = !showFullMessage && !!annText;
    const isHidden = ((cfg.hidden_event_ids as string[]) || []).includes(ev.id);
    const visibilityIcon = isHidden ? "mdi:eye" : "mdi:eye-off";
    const visibilityLabel = isHidden ? "Show chart marker" : "Hide chart marker";
    const historyHref = buildDataPointsHistoryPath(
      { entity_id: ev.entity_ids || [], device_id: ev.device_ids || [], area_id: ev.area_ids || [], label_id: ev.label_ids || [] },
      { start_time: this._getNavigationContextForEvent(ev)?.start_time, end_time: this._getNavigationContextForEvent(ev)?.end_time, datapoint_scope: cfg.datapoint_scope },
    ) as string;
    const isEditing = this._editingId === ev.id;
    const isSimple = !annText && !hasRelated;

    return html`
      <div
        class="event-item${isExpandable ? " expandable" : ""}${isHidden ? " is-hidden" : ""}${isSimple ? " simple" : ""}"
        data-id=${ev.id}
        @click=${isExpandable
          ? (e: Event) => {
              const t = e.target as HTMLElement;
              if (t.closest(".ev-actions, .ev-entity-chip, .edit-form, ha-icon-button, ha-button")) return;
              const ann = (e.currentTarget as HTMLElement).querySelector(".ev-full-message");
              ann?.classList.toggle("hidden");
            }
          : undefined}
      >
        <div class="ev-icon-wrap" style="background:${color}">
          <ha-icon
            class="ev-icon-main"
            .icon=${icon}
            style="--mdc-icon-size:18px;color:${iconColor}"
          ></ha-icon>
          <button
            class="ev-visibility-btn"
            type="button"
            title=${visibilityLabel}
            aria-label=${visibilityLabel}
            @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this._toggleVisibility(ev); }}
          >
            <ha-icon .icon=${visibilityIcon}></ha-icon>
          </button>
        </div>
        <div class="ev-body">
          <div class="ev-header">
            <div class="ev-header-text">
              <span class="ev-message">
                ${ev.message}
                ${ev.dev ? html`<span class="ev-dev-badge">DEV</span>` : ""}
                ${isExpandable ? html`<button class="ann-expand-chip" title="Show annotation">···</button>` : ""}
              </span>
              <div class="ev-meta">
                <button
                  class="ev-history-link"
                  type="button"
                  title="Open related data point history"
                  aria-label="Open related data point history"
                  @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this._navigateToEventHistory(ev); }}
                >
                  <ha-icon icon="mdi:history"></ha-icon>
                  <span class="ev-time-below" title=${fmtDateTime(ev.timestamp) as string}>${fmtDateTime(ev.timestamp)}</span>
                </button>
              </div>
            </div>
            ${showActions
              ? html`
                  <div class="ev-actions">
                    <ha-icon-button
                      label="Edit record"
                      @click=${(e: Event) => { e.stopPropagation(); this._openEdit(ev); }}
                    >
                      <ha-icon icon="mdi:pencil-outline"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                      label="Delete record"
                      style="--icon-primary-color:var(--error-color,#f44336)"
                      @click=${(e: Event) => { e.stopPropagation(); this._deleteEvent(ev); }}
                    >
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </ha-icon-button>
                  </div>
                `
              : ""}
          </div>
          ${annText
            ? html`<div class="ev-full-message${showFullMessage ? "" : " hidden"}">${annText}</div>`
            : ""}
          ${showEntities && hasRelated
            ? html`
                <div class="ev-entities">
                  ${entities.map(
                    (eid) => html`
                      <button
                        class="ev-entity-chip"
                        @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this._fireMoreInfo(eid); }}
                      >
                        <ha-icon .icon=${entityIcon(this._hass, eid)}></ha-icon>
                        ${entityName(this._hass, eid)}
                      </button>
                    `,
                  )}
                  ${devices.map(
                    (id) => html`
                      <span class="ev-entity-chip">
                        <ha-icon .icon=${deviceIcon(this._hass, id)}></ha-icon>
                        ${deviceName(this._hass, id)}
                      </span>
                    `,
                  )}
                  ${areas.map(
                    (id) => html`
                      <span class="ev-entity-chip">
                        <ha-icon .icon=${areaIcon(this._hass, id)}></ha-icon>
                        ${areaName(this._hass, id)}
                      </span>
                    `,
                  )}
                  ${labels.map(
                    (id) => html`
                      <span class="ev-entity-chip">
                        <ha-icon .icon=${labelIcon(this._hass, id)}></ha-icon>
                        ${labelName(this._hass, id)}
                      </span>
                    `,
                  )}
                </div>
              `
            : ""}
          ${showActions && isEditing
            ? html`
                <div class="edit-form" id="edit-${ev.id}">
                  <ha-textfield class="edit-msg" label="Message" .value=${ev.message} style="width:100%"></ha-textfield>
                  <textarea
                    class="edit-ann annotation-edit"
                    placeholder="Annotation / full message"
                    .value=${annText}
                  ></textarea>
                  <div class="edit-row">
                    <ha-icon-picker
                      class="edit-icon-picker"
                      .value=${ev.icon || "mdi:bookmark"}
                      .hass=${this._hass}
                      style="flex:1"
                    ></ha-icon-picker>
                    <button
                      class="color-swatch-btn"
                      type="button"
                      title="Choose colour"
                      style="background:${this._editColor}"
                    >
                      <span class="color-swatch-inner" style="background:${this._editColor}"></span>
                      <input
                        type="color"
                        .value=${this._editColor}
                        @input=${(e: Event) => { this._editColor = (e.target as HTMLInputElement).value; }}
                      />
                    </button>
                  </div>
                  <div class="edit-row">
                    <ha-button raised @click=${() => this._saveEdit(ev)}>Save</ha-button>
                    <ha-button @click=${() => this._closeEdit()}>Cancel</ha-button>
                  </div>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  render() {
    const cfg = this._config;
    const showSearch = cfg.show_search !== false;

    const filtered = this._filtered();
    const total = filtered.length;
    const pageSize = this._pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(this._page, totalPages - 1);
    const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const showPagination = totalPages > 1;

    return html`
      <ha-card>
        ${cfg.title ? html`<div class="card-header">${cfg.title}</div>` : ""}
        ${showSearch
          ? html`
              <div class="search-wrap">
                <dp-search-bar
                  .query=${this._searchQuery}
                  placeholder="Search datapoints…"
                  @dp-search=${this._onSearch}
                ></dp-search-bar>
              </div>
            `
          : ""}
        <div class="list-scroll">
          <div class="event-list">
            ${total === 0
              ? html`
                  <div class="empty">
                    <ha-icon icon="mdi:bookmark-off-outline"></ha-icon>
                    ${this._searchQuery ? "No matching datapoints." : "No datapoints yet."}
                  </div>
                `
              : slice.map((ev) => this._renderEventItem(ev))}
          </div>
        </div>
        ${showPagination
          ? html`
              <div class="pagination-wrap">
                <dp-pagination
                  .page=${page}
                  .totalPages=${totalPages}
                  .totalItems=${total}
                  label="records"
                  @dp-page-change=${this._onPageChange}
                ></dp-pagination>
              </div>
            `
          : ""}
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-list-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getGridOptions() {
    const rows = this._config?.show_search !== false ? 4 : 3;
    return { rows, min_rows: rows };
  }
}
