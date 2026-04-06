import { html, LitElement } from "lit";

import { styles } from "./sensor.styles";
import { DOMAIN } from "@/constants";
import { navigateToDataPointsHistory } from "@/lib/ha/navigation";
import { fetchEvents } from "@/lib/data/events-api";
import type { CardConfig, EventRecordFull, HassLike } from "@/lib/types";
import { logger } from "@/lib/logger";
import type { SensorChart } from "./sensor-chart/sensor-chart";
import "@/atoms/interactive/pagination/pagination";
import "./sensor-header/sensor-header";
import "./sensor-chart/sensor-chart";
import "./sensor-records/sensor-records";

/**
 * hass-datapoints-sensor-card – Sensor card with inline annotation icons.
 * Canvas rendering is delegated to sensor-chart; annotation list to sensor-records.
 */
export class HassRecordsSensorCard extends LitElement {
  static properties = {
    _config: { state: true },
    _hass: { state: true },
    _annEvents: { state: true },
    _hiddenEventIds: { state: true },
  };

  declare _config: CardConfig;

  declare _hass: Nullable<HassLike>;

  declare _annEvents: EventRecordFull[];

  declare _hiddenEventIds: Set<string>;

  private _initialized = false;

  private _lastHistResult: unknown = null;

  private _lastEvents: EventRecordFull[] = [];

  private _lastT0: Nullable<number> = null;

  private _lastT1: Nullable<number> = null;

  private _unsubscribe: NullableCleanup = null;

  private _resizeObserver: Nullable<ResizeObserver> = null;

  static styles = styles;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._annEvents = [];
    this._hiddenEventIds = new Set();
  }

  setConfig(config: CardConfig) {
    if (!config.entity) {
      throw new Error("hass-datapoints-sensor-card: `entity` is required");
    }
    this._config = {
      hours_to_show: 24,
      annotation_style: "circle",
      show_records: false,
      records_page_size: null,
      records_limit: null,
      ...config,
    };
  }

  set hass(hass: HassLike) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._setupAutoRefresh();
    }
  }

  get hass(): Nullable<HassLike> {
    return this._hass;
  }

  firstUpdated() {
    this._setupResizeObserver();
    if (this._hass) this._load();
  }

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    if (this._initialized && this._hass) this._load();
  }

  disconnectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  private _setupAutoRefresh() {
    if (!this.hass) return;
    this.hass.connection
      .subscribeEvents(() => this._load(), `${DOMAIN}_event_recorded`)
      .then((unsub: () => void) => {
        this._unsubscribe = unsub;
      })
      .catch(() => {});
  }

  private _setupResizeObserver() {
    if (!window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      this._applyLayoutSizing();
      // sensor-chart has its own ResizeObserver and will redraw itself
    });
    this._resizeObserver.observe(this);
  }

  private _applyLayoutSizing() {
    const shell = this.shadowRoot?.querySelector<HTMLElement>(".card-shell");
    if (!shell) return;
    const gridRows = this._gridRows();
    if (!this._config?.show_records) {
      shell.style.setProperty("--hr-body-rows", String(gridRows));
      return;
    }
    const totalRows = Math.max(3, gridRows);
    const bodyRows = Math.max(2, this._bodyRows(totalRows));
    shell.style.setProperty("--hr-body-rows", String(bodyRows));
  }

  private _gridRows(): number {
    const raw = getComputedStyle(this).getPropertyValue("--row-size").trim();
    const rows = Number.parseInt(raw, 10);
    if (Number.isFinite(rows) && rows > 0) return rows;
    return this._config?.show_records ? 4 : 3;
  }

  private _bodyRows(totalRows: number): number {
    if (!this._config?.show_records) return totalRows;
    return Math.min(
      totalRows - 1,
      3 + Math.floor(Math.max(0, totalRows - 4) / 4)
    );
  }

  private _toggleEventVisibility(eventId: string) {
    const next = new Set(this._hiddenEventIds);
    if (next.has(eventId)) next.delete(eventId);
    else next.add(eventId);
    this._hiddenEventIds = next;
    if (this._lastHistResult !== null) {
      this._drawChart(
        this._lastHistResult,
        this._lastEvents,
        this._lastT0!,
        this._lastT1!
      );
    }
  }

  private _navigateToEventHistory(ev: EventRecordFull) {
    navigateToDataPointsHistory(
      this,
      {
        entity_id: [
          this._config?.entity as string,
          ...(ev?.entity_ids || []),
        ].filter(Boolean),
        device_id: ev?.device_ids || [],
        area_id: ev?.area_ids || [],
        label_id: ev?.label_ids || [],
      },
      {
        start_time: Number.isFinite(this._lastT0)
          ? new Date(this._lastT0!).toISOString()
          : null,
        end_time: Number.isFinite(this._lastT1)
          ? new Date(this._lastT1!).toISOString()
          : null,
      }
    );
  }

  async _load() {
    if (!this.hass) return;
    const now = new Date();
    const start = new Date(
      now.getTime() - (this._config.hours_to_show as number) * 3600 * 1000
    );
    const t0 = start.getTime();
    const t1 = now.getTime();
    const entityIds = [this._config.entity as string];

    try {
      const [histResult, events] = await Promise.all([
        this.hass.connection.sendMessagePromise({
          type: "history/history_during_period",
          start_time: start.toISOString(),
          end_time: now.toISOString(),
          entity_ids: entityIds,
          include_start_time_state: true,
          significant_changes_only: false,
          no_attributes: true,
        }),
        fetchEvents(
          this.hass,
          start.toISOString(),
          now.toISOString(),
          entityIds
        ) as Promise<EventRecordFull[]>,
      ]);

      this._drawChart(histResult || {}, events || [], t0, t1);
    } catch (err) {
      logger.error("[hass-datapoints sensor-card]", err);
    }
  }

  private _drawChart(
    histResult: unknown,
    events: EventRecordFull[],
    t0: number,
    t1: number
  ) {
    this._lastHistResult = histResult;
    this._lastEvents = events;
    this._lastT0 = t0;
    this._lastT1 = t1;
    this._annEvents = events;

    const chartEl = this.shadowRoot?.querySelector<SensorChart>("sensor-chart");
    if (!chartEl) return;

    chartEl.hass = this.hass;
    const entityId = this._config.entity as string;
    const unit =
      (this.hass?.states?.[entityId]?.attributes
        ?.unit_of_measurement as string) || "";
    chartEl.draw(
      histResult,
      events,
      t0,
      t1,
      this._config,
      unit,
      this._hiddenEventIds
    );
  }

  private _onAnnotationClick(e: CustomEvent<{ event: EventRecordFull }>) {
    this._navigateToEventHistory(e.detail.event);
  }

  render() {
    const stateObj = this.hass?.states?.[this._config?.entity as string];
    const sensorName =
      (this._config?.name as string) ||
      (stateObj?.attributes?.friendly_name as string) ||
      (this._config?.entity as string) ||
      "—";
    const sensorValue = stateObj?.state ?? "—";
    const sensorUnit =
      (stateObj?.attributes?.unit_of_measurement as string) || "";

    return html`
      <ha-card>
        <div class="card-shell">
          <div class="card-body">
            <sensor-header
              .name=${sensorName}
              .value=${sensorValue}
              .unit=${sensorUnit}
              .stateObj=${stateObj}
              .hass=${this.hass}
            ></sensor-header>
          </div>
          <sensor-chart
            @dp-sensor-annotation-click=${this._onAnnotationClick}
          ></sensor-chart>
          ${this._config?.show_records
            ? html`
                <sensor-records
                  .events=${this._annEvents}
                  .hiddenEventIds=${this._hiddenEventIds}
                  .pageSize=${(this._config
                    .records_page_size as Nullable<number>) ?? null}
                  .limit=${(this._config.records_limit as Nullable<number>) ??
                  null}
                  .showFullMessage=${this._config.records_show_full_message !==
                  false}
                  @dp-sensor-record-toggle-visibility=${(
                    e: CustomEvent<{ id: string }>
                  ) => {
                    this._toggleEventVisibility(e.detail.id);
                  }}
                  @dp-sensor-record-navigate=${(
                    e: CustomEvent<{ event: EventRecordFull }>
                  ) => {
                    this._navigateToEventHistory(e.detail.event);
                  }}
                ></sensor-records>
              `
            : ""}
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
    if (this._config?.show_records) {
      return { rows: 4, min_rows: 4, max_rows: 12 };
    }
    return { rows: 3, min_rows: 2, max_rows: 5 };
  }
}
