import { LitElement, html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";

import { styles } from "./target-row.styles";
import type { HassLike, HassState } from "@/lib/types";
import { getAggregateOperations } from "@/lib/domain/aggregation/aggregation";
import { isNumericAggregateOperation } from "@/lib/domain/aggregation/labels";
import {
  type BinaryDisplayMode,
  isBinarySensorEntity,
  resolveBinaryDisplayMode,
} from "@/lib/domain/history-series";
import "@/atoms/form/inline-select/inline-select";

// ---------------------------------------------------------------------------
// Types (defined in ./types, re-exported here for backwards compatibility)
// ---------------------------------------------------------------------------

import type {
  NormalizedAnalysis,
  ComparisonWindow,
  HassEntityState,
} from "./types";

import "@/molecules/analysis-sample-group/analysis-sample-group";
import "@/molecules/analysis-trend-group/analysis-trend-group";
import "@/molecules/analysis-summary-group/analysis-summary-group";
import "@/molecules/analysis-rate-group/analysis-rate-group";
import "@/molecules/analysis-threshold-group/analysis-threshold-group";
import "@/molecules/analysis-anomaly-group/analysis-anomaly-group";
import "@/molecules/analysis-delta-group/analysis-delta-group";
import "@/molecules/analysis-aggregate-group/analysis-aggregate-group";

export type { NormalizedAnalysis, ComparisonWindow, HassEntityState };

export function deriveSwatchIconColor(color: string): string {
  const hex = String(color || "").trim();
  const normalizedHex = /^#([0-9a-f]{6})$/i.test(hex) ? hex : null;
  if (!normalizedHex) {
    return "#ffffff";
  }
  const channels = normalizedHex
    .slice(1)
    .match(/.{2}/g)
    ?.map((p) => parseInt(p, 16));
  if (!channels || channels.length !== 3) {
    return "#ffffff";
  }
  const [r, g, b] = channels;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const mixTarget = luminance > 0.62 ? 0 : 255;
  const mixStrength =
    luminance > 0.62
      ? Math.min(0.82, 0.35 + (luminance - 0.62) * 1.6)
      : Math.min(0.78, 0.4 + (0.62 - luminance) * 0.9);
  const mixed = [r, g, b].map((c) =>
    Math.max(
      0,
      Math.min(255, Math.round(c * (1 - mixStrength) + mixTarget * mixStrength))
    )
  );
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function hasAggregates(a: NormalizedAnalysis): boolean {
  return (a.aggregates?.length ?? 0) > 0;
}

export function _hasConfiguredAnalysis(a: NormalizedAnalysis): boolean {
  return (
    a.show_trend_lines ||
    a.show_summary_stats ||
    a.show_rate_of_change ||
    a.show_threshold_analysis ||
    a.show_anomalies ||
    a.show_delta_analysis ||
    a.stepped_series ||
    a.hide_source_series ||
    hasAggregates(a)
  );
}

export function _hasActiveAnalysis(
  a: NormalizedAnalysis,
  hasComparisonWindow: boolean
): boolean {
  return (
    a.show_trend_lines ||
    a.show_summary_stats ||
    a.show_rate_of_change ||
    a.show_threshold_analysis ||
    a.show_anomalies ||
    (a.show_delta_analysis && hasComparisonWindow) ||
    hasAggregates(a)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Single entity row in the target list with color, visibility, and analysis controls.
 * @fires dp-row-color-change - `{ index, color: string }` — color picker changed
 * @fires dp-row-visibility-change - `{ entityId, visible: boolean }` — visibility checkbox toggled
 * @fires dp-row-binary-display-change - `{ index, entityId, mode: "background" | "row" }` — binary display toggle (binary_sensor rows only)
 * @fires dp-row-toggle-analysis - `{ entityId }` — analysis panel expand/collapse
 * @fires dp-row-remove - `{ index }` — row remove button clicked
 * @fires dp-row-analysis-change - `{ entityId, key, value }` — an analysis field changed
 * @fires dp-row-copy-analysis-to-all - `{ entityId, analysis }` — copy-to-all triggered
 */
@localized()
export class TargetRow extends LitElement {
  @property({ type: String }) accessor color: string = "#03a9f4";

  @property({ type: Boolean }) accessor visible: boolean = true;

  @property({ type: Object }) accessor analysis: NormalizedAnalysis =
    {} as NormalizedAnalysis;

  @property({ type: Number }) accessor index: number = 0;

  /** Config entity ID — always available, used as fallback before HA state loads. */
  @property({ type: String, attribute: "entity-id" })
  accessor entityId: string = "";

  @property({ type: Boolean, attribute: "can-show-delta-analysis" })
  accessor canShowDeltaAnalysis: boolean = false;

  /** HA entity state object. Provides entity_id, display name, unit, and icon for the row. */
  @property({ type: Object, attribute: false })
  accessor stateObj: Nullable<HassState> = null;

  /** HA hass object. Required by ha-state-icon to resolve entity icons correctly. */
  @property({ type: Object, attribute: false })
  accessor hass: Nullable<HassLike> = null;

  @property({ type: Array, attribute: "comparison-windows" })
  accessor comparisonWindows: ComparisonWindow[] = [];

  /** Whether this entity's analysis is currently being computed in the worker. */
  @property({ type: Boolean, attribute: false }) accessor computing: boolean =
    false;

  /** Analysis computation progress (0–100), shown alongside the spinner. */
  @property({ type: Number, attribute: false })
  accessor computingProgress: number = 0;

  /** Set of anomaly method names still in-flight in the worker for this entity. */
  @property({ type: Object, attribute: false })
  accessor computingMethods: Set<string> = new Set();

  /** Total number of rows in the list — used to hide "Copy to all" when there is only one target. */
  @property({ type: Number, attribute: false }) accessor rowCount: number = 1;

  /** True when all rows share identical analysis settings — used to disable the "Copy to all" button. */
  @property({ type: Boolean, attribute: false })
  accessor allAnalysisSame: boolean = false;

  /** When true, the drag handle button is hidden (e.g. when rendered inside a tooltip popup). */
  @property({ type: Boolean, attribute: "hide-drag-handle" })
  accessor hideDragHandle: boolean = false;

  /**
   * Optional override label. When set, replaces the friendly name derived from
   * the HA state object. Used to show disambiguated names when multiple
   * entities share the same friendly name.
   */
  @property({ type: String, attribute: false })
  accessor label: Nullable<string> = null;

  /** Current binary display mode for a binary_sensor row (ignored otherwise). */
  @property({ type: String, attribute: "binary-display" })
  accessor binaryDisplay: BinaryDisplayMode = "background";

  /**
   * Opt-in: show the background/row display toggle for binary_sensor rows.
   * Off by default so the control only appears where it is wired up (the
   * history target list), not in unrelated hosts (e.g. the anomaly wizard).
   */
  @property({ type: Boolean, attribute: "show-binary-display" })
  accessor showBinaryDisplay: boolean = false;

  static styles = styles;

  // Derived from stateObj / entityId / label — recomputed in willUpdate, not getters,
  // so the values are stable across the full render pass without extra re-renders.
  private _entityId = "";

  private _entityName = "";

  private _unit = "";

  private _supportsAnalysis = false;

  private _isBinary = false;

  private _isEvent = false;

  override willUpdate(changed: PropertyValues) {
    if (
      changed.has("stateObj") ||
      changed.has("entityId") ||
      changed.has("label")
    ) {
      this._entityId =
        (this.stateObj?.entity_id as string) ?? this.entityId ?? "";
      const attrs = this.stateObj?.attributes as
        | RecordWithUnknownValues
        | undefined;
      this._entityName =
        this.label ?? (attrs?.friendly_name as string) ?? this._entityId;
      this._unit = (attrs?.unit_of_measurement as string) ?? "";
      this._supportsAnalysis =
        Boolean(this._entityId) && !this._entityId.startsWith("binary_sensor.");
      this._isBinary = isBinarySensorEntity(this._entityId);
      this._isEvent = this._entityId.startsWith("event.");
    }
  }

  private _emit(name: string, detail: RecordWithUnknownValues) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  private _onColorChange(e: Event) {
    this._emit("dp-row-color-change", {
      index: this.index,
      color: (e.target as HTMLInputElement).value,
    });
  }

  private _onVisibilityChange(e: Event) {
    this._emit("dp-row-visibility-change", {
      entityId: this._entityId,
      visible: (e.target as HTMLInputElement).checked,
    });
  }

  private _onBinaryDisplayChange(e: CustomEvent<{ value: string }>) {
    this._emit("dp-row-binary-display-change", {
      index: this.index,
      entityId: this._entityId,
      mode: resolveBinaryDisplayMode(e.detail?.value),
    });
  }

  private _onAnalysisToggle() {
    this._emit("dp-row-toggle-analysis", { entityId: this._entityId });
  }

  private _onRemove() {
    this._emit("dp-row-remove", { index: this.index });
  }

  private _onCheckbox(key: string, e: Event) {
    this._emit("dp-row-analysis-change", {
      entityId: this._entityId,
      key,
      value: (e.target as HTMLInputElement).checked,
    });
  }

  private _onCopyAnalysisToAll() {
    this._emit("dp-row-copy-analysis-to-all", {
      entityId: this._entityId,
      analysis: this.analysis,
    });
  }

  private _onGroupAnalysisChange(e: CustomEvent) {
    this._emit("dp-row-analysis-change", e.detail as RecordWithUnknownValues);
  }

  render() {
    const a = this.analysis || ({} as NormalizedAnalysis);
    const hasConfigured = _hasConfiguredAnalysis(a);
    const hasActive = _hasActiveAnalysis(a, this.canShowDeltaAnalysis);
    // Binary sensors have no analysis, but when the display toggle is enabled
    // they still get an expandable options row that reuses the same chevron and
    // expanded-panel mechanics as numeric sensors' analysis options.
    const hasBinaryDisplayOption = this._isBinary && this.showBinaryDisplay;
    const canExpand = this._supportsAnalysis || hasBinaryDisplayOption;
    const expanded = this.analysis?.expanded === true;
    const toggleNoun = this._supportsAnalysis ? "analysis" : "display";
    let toggleTitle = msg("Chart display options");
    if (this._supportsAnalysis) {
      toggleTitle = hasConfigured
        ? msg("Analysis configured")
        : msg("Configure analysis");
    }

    const rowClass = [
      "history-target-row",
      this.visible === false ? "is-hidden" : "",
      this.analysis?.expanded ? "analysis-open" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return html`
      <div class=${rowClass} role="row">
        ${this.hideDragHandle
          ? nothing
          : html` <button
              type="button"
              class="history-target-drag-handle"
              draggable="true"
              aria-label="Drag to reorder ${this._entityName}"
              title="Drag to reorder"
            >
              <ha-icon icon="mdi:drag-vertical"></ha-icon>
            </button>`}

        <div
          class="history-target-name"
          role="cell"
          title=${this._entityName}
          @click=${canExpand ? this._onAnalysisToggle : nothing}
          style=${canExpand ? "cursor:pointer" : ""}
        >
          <div class="history-target-controls">
            <label
              class="history-target-color-field"
              style="--row-color:${this
                .color};--row-icon-color:${deriveSwatchIconColor(this.color)}"
              @click=${(e: Event) => e.stopPropagation()}
            >
              <input
                type="color"
                class="history-target-color"
                .value=${this.color}
                aria-label="Line color for ${this._entityId}"
                @input=${this._onColorChange}
                @change=${this._onColorChange}
              />
              <span class="history-target-color-icon" aria-hidden="true">
                ${this.stateObj
                  ? html`<ha-state-icon
                      .stateObj=${this.stateObj}
                      .hass=${this.hass ?? null}
                    ></ha-state-icon>`
                  : html`<span class="skeleton skeleton-icon"></span>`}
              </span>
            </label>
          </div>
          <div class="history-target-name-text">
            ${this.stateObj
              ? html`${this._entityName}
                  <div class="history-target-entity-id">${this._entityId}</div>`
              : html`<span class="skeleton skeleton-name"></span>
                  <div class="history-target-entity-id">
                    <span class="skeleton skeleton-entity-id"></span>
                  </div>`}
          </div>
        </div>

        <div class="history-target-actions" role="cell">
          ${canExpand
            ? html`
                <button
                  type="button"
                  class="history-target-analysis-toggle ${expanded
                    ? "is-open"
                    : ""} ${this._supportsAnalysis && hasConfigured
                    ? "configured"
                    : ""}"
                  aria-label="${expanded
                    ? "Collapse"
                    : "Expand"} ${toggleNoun} options for ${this._entityName}"
                  aria-expanded=${expanded}
                  title=${toggleTitle}
                  @click=${this._onAnalysisToggle}
                >
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              `
            : nothing}

          <label
            class="history-target-visible-toggle"
            title="${this.visible === false ? "Show" : "Hide"} ${this
              ._entityName}"
          >
            <input
              type="checkbox"
              aria-label="Show ${this._entityName} on chart"
              .checked=${this.visible !== false}
              @change=${this._onVisibilityChange}
            />
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

        ${this._supportsAnalysis && !this._isEvent && this.analysis?.expanded
          ? html`
              <div class="history-target-analysis" role="cell">
                <div class="history-target-analysis-grid">
                  <analysis-sample-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-sample-group>
                  <label class="history-target-analysis-option">
                    <input
                      type="checkbox"
                      .checked=${a.stepped_series === true}
                      @change=${(e: Event) =>
                        this._onCheckbox("stepped_series", e)}
                    />
                    <span>${msg("Stepped series")}</span>
                  </label>
                  <analysis-aggregate-group
                    variant="measurement"
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .operations=${getAggregateOperations({
                      entity_id: this._entityId,
                      state: this.stateObj?.state,
                      attributes: this.stateObj?.attributes,
                    }).filter(isNumericAggregateOperation)}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-aggregate-group>
                  <analysis-trend-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-trend-group>
                  <analysis-summary-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-summary-group>
                  <analysis-rate-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-rate-group>
                  <analysis-threshold-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .unit=${this._unit}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-threshold-group>
                  <analysis-anomaly-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .hass=${this.hass}
                    .comparisonWindows=${this.comparisonWindows}
                    .computing=${this.computing}
                    .computingProgress=${this.computingProgress}
                    .computingMethods=${this.computingMethods}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-anomaly-group>
                  <analysis-delta-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-delta-group>
                  <div class="history-target-analysis-bottom-row">
                    <label
                      class="history-target-analysis-option ${!hasActive
                        ? "is-disabled"
                        : ""}"
                    >
                      <input
                        type="checkbox"
                        .checked=${a.hide_source_series && hasActive}
                        ?disabled=${!hasActive}
                        @change=${(e: Event) =>
                          this._onCheckbox("hide_source_series", e)}
                      />
                      <span>${msg("Hide source series")}</span>
                    </label>
                    ${this.rowCount > 1
                      ? html`
                          <button
                            type="button"
                            class="history-target-analysis-copy-btn"
                            title=${this.allAnalysisSame
                              ? msg(
                                  "All targets already have the same settings"
                                )
                              : msg(
                                  "Copy these analysis settings to all targets"
                                )}
                            ?disabled=${this.allAnalysisSame}
                            @click=${this._onCopyAnalysisToAll}
                          >
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                            ${msg("Copy to all targets")}
                          </button>
                        `
                      : nothing}
                  </div>
                </div>
              </div>
            `
          : nothing}
        ${this._isEvent && expanded
          ? html`
              <div class="history-target-analysis" role="cell">
                <div class="history-target-analysis-grid">
                  <analysis-aggregate-group
                    variant="event"
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .eventTypes=${(Array.isArray(
                      this.stateObj?.attributes?.event_types
                    )
                      ? this.stateObj.attributes.event_types
                      : []) as string[]}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-aggregate-group>
                </div>
              </div>
            `
          : nothing}
        ${hasBinaryDisplayOption && expanded
          ? html`
              <div class="history-target-analysis" role="cell">
                <div class="history-target-analysis-grid">
                  <label
                    class="history-target-analysis-option history-target-binary-display-option"
                  >
                    <span>${msg("Chart display")}</span>
                    <inline-select
                      class="history-target-binary-display"
                      data-binary-entity=${this._entityId}
                      .value=${resolveBinaryDisplayMode(this.binaryDisplay)}
                      .options=${[
                        { value: "background", label: msg("Background band") },
                        { value: "row", label: msg("Row strip") },
                      ]}
                      aria-label="Chart display style for ${this._entityName}"
                      @dp-change=${this._onBinaryDisplayChange}
                    ></inline-select>
                  </label>
                  <analysis-aggregate-group
                    .analysis=${a}
                    .entityId=${this._entityId}
                    .deviceClass=${String(
                      this.stateObj?.attributes?.device_class ?? ""
                    )}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-aggregate-group>
                  <div class="history-target-analysis-bottom-row">
                    <label
                      class="history-target-analysis-option ${!hasActive
                        ? "is-disabled"
                        : ""}"
                    >
                      <input
                        type="checkbox"
                        .checked=${a.hide_source_series && hasActive}
                        ?disabled=${!hasActive}
                        @change=${(e: Event) =>
                          this._onCheckbox("hide_source_series", e)}
                      />
                      <span>${msg("Hide source series")}</span>
                    </label>
                  </div>
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define("target-row", TargetRow);
