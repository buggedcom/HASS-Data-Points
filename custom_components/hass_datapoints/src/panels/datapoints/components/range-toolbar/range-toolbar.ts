import { html, LitElement, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { formatDateWindowInputValue } from "@/lib/domain/date-window";

import { styles } from "./range-toolbar.styles";
import { localized, msg } from "@/lib/i18n/localize";
import {
  RANGE_SNAP_OPTIONS,
  RANGE_ZOOM_OPTIONS,
} from "@/lib/timeline/timeline-scale";
import type { HassLike } from "@/lib/types";
import "@/molecules/floating-menu/floating-menu";
import "@/molecules/panel-timeline/panel-timeline";
import "@/atoms/form/date-time-input/date-time-input";

/**
 * `range-toolbar` renders the date-range toolbar for the Datapoints panel.
 *
 * It contains:
 * - a sidebar toggle button (mobile only)
 * - mobile date inputs (mobile only, replace the timeline at ≤720 px)
 * - the `panel-timeline` slider
 * - a date-range picker button + floating menu
 * - a timeline options button + floating menu (zoom level, snap mode)
 *
 * @fires dp-range-commit         — `{ start: Date, end: Date, push?: boolean }` range committed by timeline or date picker
 * @fires dp-range-draft          — `{ start: Date, end: Date }` range being previewed (not committed)
 * @fires dp-toolbar-sidebar-toggle — `{}` mobile sidebar toggle button clicked
 * @fires dp-zoom-level-change    — `{ value: string }` zoom level changed via options menu
 * @fires dp-snap-change          — `{ value: string }` snap mode changed via options menu
 * @fires dp-date-picker-change   — `{ start: Date, end: Date }` date range picker value changed
 */
@localized()
export class RangeToolbar extends LitElement {
  static styles = styles;

  /** Home Assistant instance forwarded to the date picker. */
  @property({ attribute: false }) accessor hass: Nullable<HassLike> = null;

  /** Current chart start time. */
  @property({ type: Object }) accessor startTime: Nullable<Date> = null;

  /** Current chart end time. */
  @property({ type: Object }) accessor endTime: Nullable<Date> = null;

  /** Timeline bounds — passed to panel-timeline. */
  @property({ type: Object }) accessor rangeBounds: Nullable<unknown> = null;

  /** Current zoom level value (e.g. "auto", "day", "week_expanded"). */
  @property({ type: String, attribute: "zoom-level" })
  accessor zoomLevel: string = "auto";

  /** Current date snapping mode (e.g. "hour", "day"). */
  @property({ type: String, attribute: "date-snapping" })
  accessor dateSnapping: string = "hour";

  /** Whether the sidebar is collapsed — used to set the sidebar toggle icon direction. */
  @property({ type: Boolean, attribute: "sidebar-collapsed" })
  accessor sidebarCollapsed: boolean = false;

  /** Whether the current range is at the live edge. */
  @property({ type: Boolean, attribute: "is-live-edge" })
  accessor isLiveEdge: boolean = false;

  /** Timeline event markers. */
  @property({ type: Array, attribute: false })
  accessor timelineEvents: unknown[] = [];

  /** Comparison overlay range in timeline coordinates. */
  @property({ type: Object, attribute: false })
  accessor comparisonPreview: Nullable<{ start: number; end: number }> = null;

  /** Main chart zoom highlight range. */
  @property({ type: Object, attribute: false }) accessor zoomRange: Nullable<{
    start: number;
    end: number;
  }> = null;

  /** Comparison window zoom highlight range. */
  @property({ type: Object, attribute: false })
  accessor zoomWindowRange: Nullable<{ start: number; end: number }> = null;

  /** Chart hover line timestamp. */
  @property({ type: Number, attribute: false })
  accessor chartHoverTimeMs: Nullable<number> = null;

  /** Comparison window hover line timestamp. */
  @property({ type: Number, attribute: false })
  accessor chartHoverWindowTimeMs: Nullable<number> = null;

  @state() accessor _optionsView: string = "root";

  @state() accessor _optionsOpen: boolean = false;

  @state() accessor _pickerOpen: boolean = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  @state() private accessor _mobileStartValue = "";

  @state() private accessor _mobileEndValue = "";

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("startTime")) {
      this._mobileStartValue = formatDateWindowInputValue(this.startTime);
    }
    if (changed.has("endTime")) {
      this._mobileEndValue = formatDateWindowInputValue(this.endTime);
    }
  }

  /** Close all open floating menus. */
  closeMenus(): void {
    if (this._pickerOpen) this._pickerOpen = false;
    if (this._optionsOpen) {
      this._optionsOpen = false;
      this._optionsView = "root";
    }
  }

  /** Forward revealSelection to the inner timeline without exposing shadow DOM internals. */
  revealSelection(): void {
    const panelTimeline = this.shadowRoot?.querySelector<
      HTMLElement & { revealSelection?: () => void }
    >("#range-panel-timeline");
    if (!panelTimeline) {
      return;
    }
    panelTimeline.revealSelection?.();
  }

  syncZoomHighlights(
    zoomRange: Nullable<{ start: number; end: number }>,
    zoomWindowRange: Nullable<{ start: number; end: number }>
  ): void {
    const panelTimeline = this.shadowRoot?.querySelector<
      HTMLElement & {
        syncZoomHighlights?: (
          zoomRange: Nullable<{ start: number; end: number }>,
          zoomWindowRange: Nullable<{ start: number; end: number }>
        ) => void;
      }
    >("#range-panel-timeline");
    if (!panelTimeline) {
      return;
    }
    panelTimeline.syncZoomHighlights?.(zoomRange, zoomWindowRange);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _emit(name: string, detail: RecordWithUnknownValues = {}): void {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  private _computeMenuPosition(
    anchorEl: HTMLElement,
    menuWidth: number
  ): { left: number; top: number } {
    const viewportPadding = 8;
    const anchorRect = anchorEl.getBoundingClientRect();
    const left = Math.max(
      viewportPadding,
      Math.min(
        anchorRect.right - menuWidth,
        window.innerWidth - menuWidth - viewportPadding
      )
    );
    const top = Math.max(viewportPadding, anchorRect.bottom + 8);
    return { left, top };
  }

  private _toggleOptions(force?: boolean): void {
    const next = force !== undefined ? force : !this._optionsOpen;
    if (next) this._pickerOpen = false;
    this._optionsOpen = next;
    if (!next) this._optionsView = "root";
    if (next) {
      const menuEl = this.shadowRoot?.querySelector<HTMLElement>(
        "#range-options-menu"
      );
      const btnEl = this.shadowRoot?.querySelector<HTMLElement>(
        "#range-options-button"
      );
      if (menuEl && btnEl) {
        const { left, top } = this._computeMenuPosition(
          btnEl,
          Math.max(280, menuEl.offsetWidth || 280)
        );
        menuEl.style.setProperty("--floating-menu-left", `${left}px`);
        menuEl.style.setProperty("--floating-menu-top", `${top}px`);
      }
    }
  }

  private _togglePicker(force?: boolean): void {
    const next = force !== undefined ? force : !this._pickerOpen;
    if (next) this._optionsOpen = false;
    this._pickerOpen = next;
    if (next) {
      const menuEl =
        this.shadowRoot?.querySelector<HTMLElement>("#range-picker-menu");
      const btnEl = this.shadowRoot?.querySelector<HTMLElement>(
        "#range-picker-button"
      );
      if (menuEl && btnEl) {
        const { left, top } = this._computeMenuPosition(
          btnEl,
          Math.max(320, menuEl.offsetWidth || 320)
        );
        menuEl.style.setProperty("--floating-menu-left", `${left}px`);
        menuEl.style.setProperty("--floating-menu-top", `${top}px`);
      }
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  private _onSidebarToggle(): void {
    this._emit("dp-toolbar-sidebar-toggle");
  }

  private _onTimelineRangeCommit(
    ev: CustomEvent<{ start: Date; end: Date; push?: boolean }>
  ): void {
    ev.stopPropagation();
    this._emit("dp-range-commit", {
      start: ev.detail.start,
      end: ev.detail.end,
      push: ev.detail.push ?? false,
    });
  }

  private _onTimelineRangeDraft(
    ev: CustomEvent<{ start: Date; end: Date }>
  ): void {
    ev.stopPropagation();
    this._emit("dp-range-draft", {
      start: ev.detail.start,
      end: ev.detail.end,
    });
  }

  private _onPickerButtonClick(): void {
    this._togglePicker();
  }

  private _onPickerMenuClose(): void {
    this._togglePicker(false);
  }

  private _onDatePickerChange(ev: Event): void {
    const value =
      (ev as CustomEvent & { detail: { value?: { start?: Date; end?: Date } } })
        .detail?.value ??
      (ev as CustomEvent & { detail: { start?: Date; end?: Date } }).detail;
    if (!value) return;
    const start =
      value.start instanceof Date
        ? value.start
        : (value as RecordWithUnknownValues).start;
    const end =
      value.end instanceof Date
        ? value.end
        : (value as RecordWithUnknownValues).end;
    if (start && end) {
      this._emit("dp-date-picker-change", { start, end });
      this._togglePicker(false);
    }
  }

  private _onOptionsButtonClick(): void {
    this._toggleOptions();
  }

  private _onOptionsMenuClose(): void {
    this._toggleOptions(false);
  }

  private _onOptionsBack(): void {
    this._optionsView = "root";
  }

  private _onOptionsSubmenu(submenu: string): void {
    this._optionsView = submenu;
  }

  private _onOptionSelect(group: string, value: string): void {
    if (group === "zoom") {
      this._emit("dp-zoom-level-change", { value });
    } else if (group === "snap") {
      this._emit("dp-snap-change", { value });
    }
    this._toggleOptions(false);
  }

  private _onMobileStartChange(ev: CustomEvent<{ value: string }>): void {
    this._mobileStartValue = ev.detail.value;
    this._commitMobileDates();
  }

  private _onMobileEndChange(ev: CustomEvent<{ value: string }>): void {
    this._mobileEndValue = ev.detail.value;
    this._commitMobileDates();
  }

  private _commitMobileDates(): void {
    const startVal = this._mobileStartValue;
    const endVal = this._mobileEndValue;
    if (!startVal || !endVal) {
      return;
    }
    const start = new Date(startVal);
    const end = new Date(endVal);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      return;
    }
    this._emit("dp-range-commit", { start, end, push: true });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private _renderZoomOptions() {
    return RANGE_ZOOM_OPTIONS.map(
      (option) => html`
        <button
          type="button"
          class=${`range-option${option.value === this.zoomLevel ? " selected" : ""}`}
          data-option-group="zoom"
          data-option-value=${option.value}
          @click=${() => this._onOptionSelect("zoom", option.value)}
        >
          <span class="range-option-label">${msg(option.label)}</span>
        </button>
      `
    );
  }

  private _renderSnapOptions() {
    return RANGE_SNAP_OPTIONS.map(
      (option) => html`
        <button
          type="button"
          class=${`range-option${option.value === this.dateSnapping ? " selected" : ""}`}
          data-option-group="snap"
          data-option-value=${option.value}
          @click=${() => this._onOptionSelect("snap", option.value)}
        >
          <span class="range-option-label">${msg(option.label)}</span>
        </button>
      `
    );
  }

  render() {
    const sidebarToggleIcon = this.sidebarCollapsed
      ? "mdi:chevron-right"
      : "mdi:chevron-left";

    return html`
      <div class="range-toolbar">
        <ha-icon-button
          id="range-sidebar-toggle"
          class="range-sidebar-toggle"
          label=${msg("Toggle sidebar")}
          @click=${this._onSidebarToggle}
        >
          <ha-icon icon=${sidebarToggleIcon}></ha-icon>
        </ha-icon-button>

        <div class="range-mobile-dates">
          <date-time-input
            id="range-mobile-start"
            .value=${this._mobileStartValue}
            label=${msg("Start")}
            @dp-change=${this._onMobileStartChange}
          ></date-time-input>
          <date-time-input
            id="range-mobile-end"
            .value=${this._mobileEndValue}
            label=${msg("End")}
            @dp-change=${this._onMobileEndChange}
          ></date-time-input>
        </div>

        <div class="range-timeline-wrap">
          <panel-timeline
            id="range-panel-timeline"
            .startTime=${this.startTime}
            .endTime=${this.endTime}
            .rangeBounds=${this.rangeBounds}
            .zoomLevel=${this.zoomLevel}
            .dateSnapping=${this.dateSnapping}
            .isLiveEdge=${this.isLiveEdge}
            .locale=${this.hass?.locale?.language ?? this.hass?.language ?? ""}
            .events=${this.timelineEvents}
            .comparisonPreview=${this.comparisonPreview}
            .zoomRange=${this.zoomRange}
            .zoomWindowRange=${this.zoomWindowRange}
            .chartHoverTimeMs=${this.chartHoverTimeMs}
            .chartHoverWindowTimeMs=${this.chartHoverWindowTimeMs}
            @dp-range-commit=${this._onTimelineRangeCommit}
            @dp-range-draft=${this._onTimelineRangeDraft}
          ></panel-timeline>
        </div>

        <div class="range-picker-wrap">
          <ha-icon-button
            id="range-picker-button"
            class="range-picker-button"
            label=${msg("Select date range")}
            aria-haspopup="dialog"
            aria-expanded=${this._pickerOpen ? "true" : "false"}
            @click=${this._onPickerButtonClick}
          >
            <ha-icon icon="mdi:calendar-range"></ha-icon>
          </ha-icon-button>
          <floating-menu
            id="range-picker-menu"
            .open=${this._pickerOpen}
            @dp-menu-close=${this._onPickerMenuClose}
          >
            <ha-date-range-picker
              id="range-picker"
              class="range-picker"
              .hass=${this.hass}
              .startDate=${this.startTime}
              .endDate=${this.endTime}
              .value=${{
                startDate: this.startTime,
                endDate: this.endTime,
              }}
              @change=${this._onDatePickerChange}
              @value-changed=${this._onDatePickerChange}
            ></ha-date-range-picker>
          </floating-menu>
        </div>

        <div class="range-options-wrap">
          <ha-icon-button
            id="range-options-button"
            class="range-options-button"
            label=${msg("Timeline options")}
            aria-haspopup="menu"
            aria-expanded=${this._optionsOpen ? "true" : "false"}
            @click=${this._onOptionsButtonClick}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <floating-menu
            id="range-options-menu"
            .open=${this._optionsOpen}
            @dp-menu-close=${this._onOptionsMenuClose}
          >
            <div
              class="range-options-view"
              ?hidden=${this._optionsView !== "root"}
            >
              <div class="range-options-list">
                <button
                  type="button"
                  class="range-submenu-trigger"
                  @click=${() => this._onOptionsSubmenu("zoom")}
                >
                  <span class="range-option-label">${msg("Zoom level")}</span>
                  <span class="range-submenu-meta" data-options-current="zoom"
                    >${msg(
                      RANGE_ZOOM_OPTIONS.find(
                        (option) => option.value === this.zoomLevel
                      )?.label ?? "Auto"
                    )}</span
                  >
                </button>
                <button
                  type="button"
                  class="range-submenu-trigger"
                  @click=${() => this._onOptionsSubmenu("snap")}
                >
                  <span class="range-option-label"
                    >${msg("Date snapping")}</span
                  >
                  <span class="range-submenu-meta" data-options-current="snap"
                    >${msg(
                      RANGE_SNAP_OPTIONS.find(
                        (option) => option.value === this.dateSnapping
                      )?.label ?? "Hour"
                    )}</span
                  >
                </button>
              </div>
            </div>

            <div
              class="range-options-view"
              ?hidden=${this._optionsView !== "zoom"}
            >
              <div class="range-options-header">
                <button
                  type="button"
                  class="range-options-header-trigger"
                  @click=${this._onOptionsBack}
                >
                  <span class="range-options-back" aria-hidden="true"
                    ><span>‹</span></span
                  >
                  <div class="range-options-title">${msg("Zoom level")}</div>
                </button>
              </div>
              <div class="range-options-list">${this._renderZoomOptions()}</div>
            </div>

            <div
              class="range-options-view"
              ?hidden=${this._optionsView !== "snap"}
            >
              <div class="range-options-header">
                <button
                  type="button"
                  class="range-options-header-trigger"
                  @click=${this._onOptionsBack}
                >
                  <span class="range-options-back" aria-hidden="true"
                    ><span>‹</span></span
                  >
                  <div class="range-options-title">${msg("Date snapping")}</div>
                </button>
              </div>
              <div class="range-options-list">${this._renderSnapOptions()}</div>
            </div>
          </floating-menu>
        </div>
      </div>
    `;
  }
}

customElements.define("range-toolbar", RangeToolbar);

declare global {
  interface HTMLElementTagNameMap {
    "range-toolbar": RangeToolbar;
  }
}
