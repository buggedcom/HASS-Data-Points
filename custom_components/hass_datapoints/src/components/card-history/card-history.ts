import { html } from "lit";
import { ChartCardBase } from "../card-chart-base/card-chart-base";
import {
  createChartZoomRange,
  createHiddenEventIdSet,
  createHiddenSeriesSet,
} from "@/lib/shared";
import { HistoryAnnotationDialogController } from "../annotation-dialog/annotation-dialog.js";
import type { CardConfig } from "@/lib/types";

export class HassRecordsHistoryCard extends ChartCardBase {
  private _hiddenSeries: Set<string> = new Set();

  private _hiddenEventIds: Set<string> = new Set();

  private _zoomRange: unknown = null;

  private _configKey: string | undefined;

  private _annotationDialog: { teardown(): void; open(...args: unknown[]): void };

  constructor() {
    super();
    this._annotationDialog = new HistoryAnnotationDialogController(this as never);
  }

  override disconnectedCallback(): void {
    this._annotationDialog?.teardown();
    super.disconnectedCallback();
  }

  override setConfig(config: CardConfig): void {
    if (!config.entity && !config.entities) {
      throw new Error("hass-datapoints-history-card: define `entity` or `entities`");
    }
    const nextConfig: CardConfig = {
      hours_to_show: 24,
      ...config,
      show_trend_lines: config.show_trend_lines === true,
      show_delta_tooltip: (config.show_delta_tooltip as boolean) !== false,
      show_data_gaps: (config.show_data_gaps as boolean) !== false,
    };
    const nextKey = JSON.stringify(nextConfig);
    if (nextKey === this._configKey) {
      return;
    }
    this._config = nextConfig;
    this._configKey = nextKey;
    this._hiddenSeries = createHiddenSeriesSet(nextConfig.series_settings as never);
    this._hiddenEventIds = createHiddenEventIdSet(nextConfig.hidden_event_ids as never);
    this._zoomRange = createChartZoomRange(
      nextConfig.zoom_start_time as never,
      nextConfig.zoom_end_time as never,
    );
    this.requestUpdate();
  }

  get _entityIds(): string[] {
    if (this._config.entities) {
      return (this._config.entities as Array<string | Record<string, string>>).map(
        (e) => (typeof e === "string" ? e : (e.entity_id ?? e.entity)),
      );
    }
    return [this._config.entity as string];
  }

  protected async _load(): Promise<void> {
    // Stub: full loading handled by the JS implementation.
  }

  protected _drawChart(): void {
    // Stub: full drawing handled by the JS implementation.
  }

  render() {
    return html`
      <ha-card>
        ${this._config?.title
          ? html`<div class="card-header">${this._config.title as string}</div>`
          : ""}
        <div class="card-content chart-wrap">
          <canvas></canvas>
        </div>
        <div id="legend" class="legend"></div>
      </ha-card>
    `;
  }

  static override getStubConfig(): CardConfig {
    return { title: "History with Events", entity: "sensor.example", hours_to_show: 24 };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("hass-datapoints-history-card-editor");
  }
}

customElements.define("hass-datapoints-history-card", HassRecordsHistoryCard);
