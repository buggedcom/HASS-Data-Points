import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";
import { entityName } from "@/lib/ha/entity-name";
import { fmtDateTime, fmtDateTimeRange } from "@/lib/util/format";
import type {
  AnomalyActivityBucket,
  EntityAnomalyActivity,
} from "@/lib/data/monitors-api";
import type { HassLike } from "@/lib/types";

import { styles } from "./monitor-entity-heatmap.styles";

/** Number of shared x-axis date ticks. */
const TICK_COUNT = 5;

/** Detail of the `dp-heatmap-block-click` event. */
export interface HeatmapBlockClickDetail {
  entityId: string;
  startMs: number;
  endMs: number;
}

interface HoverState {
  entityId: string;
  bucket: AnomalyActivityBucket;
  /** Horizontal anchor as a percentage of the heatmap width. */
  leftPct: number;
  topPx: number;
}

/**
 * `monitor-entity-heatmap` renders one activity row per entity over a time
 * range: coloured blocks (one per bucket), the entity name + id, a per-entity
 * anomaly count and a shared x-axis of date ticks. Entities without activity
 * (empty/paused monitor, or a failed fetch) render a flat zero row.
 *
 * @fires dp-heatmap-entity-click — user clicked an entity label
 *   (`{ entityId: string }`)
 * @fires dp-heatmap-block-click — user clicked a non-empty block
 *   (`{ entityId: string; startMs: number; endMs: number }`)
 */
@localized()
export class MonitorEntityHeatmap extends LitElement {
  static styles = styles;

  @property({ type: Object }) accessor hass: Nullable<HassLike> = null;

  /** Entities to show a row for, in order. */
  @property({ type: Array }) accessor entityIds: string[] = [];

  /** Range-scoped activity per entity; null when unavailable. */
  @property({ type: Array }) accessor activity: Nullable<
    EntityAnomalyActivity[]
  > = null;

  @property({ type: Number }) accessor startMs: number = 0;

  @property({ type: Number }) accessor endMs: number = 0;

  @state() accessor _hover: Nullable<HoverState> = null;

  private _maxCount = 0;

  willUpdate() {
    let max = 0;
    for (const e of this.activity ?? []) {
      for (const b of e.buckets ?? []) {
        max = Math.max(max, b.anomaly_count);
      }
    }
    this._maxCount = max;
  }

  private _emit(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  private _emitBlockClick(entityId: string, bucket: AnomalyActivityBucket) {
    const detail: HeatmapBlockClickDetail = {
      entityId,
      startMs: bucket.start_ms,
      endMs: bucket.end_ms,
    };
    this._emit("dp-heatmap-block-click", detail);
  }

  private _emitEntityClick(entityId: string) {
    this._emit("dp-heatmap-entity-click", { entityId });
  }

  private _showTooltip(
    event: Event,
    entityId: string,
    bucket: AnomalyActivityBucket
  ) {
    const block = event.currentTarget as HTMLElement;
    const host = this.getBoundingClientRect();
    const rect = block.getBoundingClientRect();
    const width = host.width || 1;
    this._hover = {
      entityId,
      bucket,
      leftPct: ((rect.left + rect.width / 2 - host.left) / width) * 100,
      topPx: rect.top - host.top - 6,
    };
  }

  private _hideTooltip() {
    this._hover = null;
  }

  private _renderBlock(entityId: string, bucket: AnomalyActivityBucket) {
    const empty = bucket.anomaly_count <= 0;
    // Floor at 0.25 so any activity is visible against the empty background.
    const heat = empty
      ? 0
      : 0.25 + 0.75 * (bucket.anomaly_count / (this._maxCount || 1));
    const label = fmtDateTimeRange(bucket.start_ms, bucket.end_ms);
    return html`<button
      class="heatmap-block"
      type="button"
      data-empty=${empty ? "true" : "false"}
      style="--heat:${heat}"
      aria-label=${msg(`${label}: ${bucket.anomaly_count} anomalous readings`)}
      @mouseenter=${(e: Event) => this._showTooltip(e, entityId, bucket)}
      @focus=${(e: Event) => this._showTooltip(e, entityId, bucket)}
      @mouseleave=${() => this._hideTooltip()}
      @blur=${() => this._hideTooltip()}
      @click=${() => {
        if (!empty) {
          this._emitBlockClick(entityId, bucket);
        }
      }}
    ></button>`;
  }

  private _renderRow(entityId: string) {
    const data = this.activity?.find((e) => e.entity_id === entityId);
    const buckets = data?.buckets ?? [];
    const name = entityName(this.hass, entityId);
    return html`
      <div class="heatmap-row" data-entity-id=${entityId}>
        <button
          class="heatmap-label"
          type="button"
          aria-label=${msg(`View series for ${entityId}`)}
          @click=${() => this._emitEntityClick(entityId)}
        >
          <span class="heatmap-name">${name}</span>
          <span class="heatmap-id">${entityId}</span>
        </button>
        ${buckets.length > 0
          ? html`<div class="heatmap-track">
              ${buckets.map((b) => this._renderBlock(entityId, b))}
            </div>`
          : html`<div class="heatmap-flat"></div>`}
        <span class="heatmap-count">${data?.total ?? 0}</span>
      </div>
    `;
  }

  private _renderAxis() {
    if (!(this.endMs > this.startMs)) {
      return nothing;
    }
    const span = this.endMs - this.startMs;
    const ticks = Array.from({ length: TICK_COUNT }, (_, i) =>
      fmtDateTime(this.startMs + (span * i) / (TICK_COUNT - 1))
    );
    return html`<div class="heatmap-axis" aria-hidden="true">
      <div class="heatmap-ticks">
        ${ticks.map((t) => html`<span class="heatmap-tick">${t}</span>`)}
      </div>
    </div>`;
  }

  private _renderTooltip() {
    const hover = this._hover;
    if (!hover) {
      return nothing;
    }
    const { bucket } = hover;
    return html`<div
      class="heatmap-tooltip"
      role="tooltip"
      style="left:${hover.leftPct}%;top:${hover.topPx}px"
    >
      <div class="heatmap-tooltip-range">
        ${fmtDateTimeRange(bucket.start_ms, bucket.end_ms)}
      </div>
      <div>
        ${msg(`${bucket.anomaly_count} anomalous readings`)} ·
        ${msg(`${bucket.incident_count} incident(s)`)}
      </div>
    </div>`;
  }

  render() {
    return html`<div class="heatmap">
      ${this.entityIds.map((id) => this._renderRow(id))} ${this._renderAxis()}
      ${this._renderTooltip()}
    </div>`;
  }
}

customElements.define("monitor-entity-heatmap", MonitorEntityHeatmap);

declare global {
  interface HTMLElementTagNameMap {
    "monitor-entity-heatmap": MonitorEntityHeatmap;
  }
}
