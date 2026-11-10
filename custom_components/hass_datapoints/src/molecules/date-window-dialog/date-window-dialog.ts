import { html, LitElement, nothing, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { localized, msg } from "@/lib/i18n/localize";

import { styles } from "./date-window-dialog.styles";
import type { RangeBounds } from "@/atoms/interactive/range-timeline/types";
import type { DpChangeDetail } from "@/lib/events";
import { formatComparisonLabel } from "@/lib/domain/date-window";
import {
  DEFAULT_RELATIVE_DATE_WINDOW_PRESET,
  isRelativeDateWindowPreset,
  RELATIVE_DATE_WINDOW_PRESETS,
  type RelativeDateWindowPreset,
  relativeDateWindowPresetLabel,
  resolveRelativeDateWindow,
} from "@/lib/domain/relative-date-window";
import "@/atoms/interactive/range-timeline/range-timeline";
import "@/atoms/form/radio-group/radio-group";

export type DateWindowKind = "fixed" | "relative";

/**
 * `date-window-dialog` renders the Add / Edit date window dialog.
 * It wraps `ha-dialog` and provides a form for setting a named date range.
 *
 * Ownership model (see context.md): the dialog owns its **name** state and its
 * own **validation**. The incoming `name` property is only a *seed* — it is
 * copied into internal `@state` on the open transition, after which the user's
 * typed value is authoritative and parent re-renders (e.g. from date changes)
 * no longer clobber it. The start/end values, range bounds, zoom level and
 * date snapping remain controlled by the parent panel.
 *
 * On submit the dialog self-validates (non-empty trimmed name, parseable start
 * strictly before end). Invalid submits shake the dialog, surface an inline
 * error and do **not** emit `dp-window-submit`; only valid submits emit it.
 *
 * The dialog also owns the window **type** (fixed dates or relative to the
 * selected range) and the relative **preset**, seeded from `kind` / `preset`
 * on open like the name. In relative mode the name is auto-filled with the
 * preset label until the user types in the name field.
 *
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * @fires dp-window-submit - `{ kind: "fixed", name, start, end }` or `{ kind: "relative", name, preset }`, fired only when the inputs are valid
 * @fires dp-window-delete - `{}` fired when the Delete button is clicked
 * @fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when a "Use previous/next range" shortcut is clicked
 * @fires dp-window-date-change - `{ start: string, end: string }` fired when either datetime input changes
 */
@localized()
export class DateWindowDialog extends LitElement {
  static styles = styles;

  /** Whether the dialog is open. */
  @property({ type: Boolean }) accessor open: boolean = false;

  /** Title shown in the dialog header. */
  @property({ type: String }) accessor heading: string = "Add date window";

  /** Current value of the name text field. */
  @property({ type: String }) accessor name: string = "";

  /** Current value of the start datetime-local input (ISO string or datetime-local format). */
  @property({ type: String, attribute: "start-value" })
  accessor startValue: string = "";

  /** Current value of the end datetime-local input (ISO string or datetime-local format). */
  @property({ type: String, attribute: "end-value" })
  accessor endValue: string = "";

  /** Whether the Delete button is shown (true when editing an existing window). */
  @property({ type: Boolean, attribute: "show-delete" })
  accessor showDelete: boolean = false;

  /** Whether the "Use previous range" / "Use next range" shortcut buttons are shown. */
  @property({ type: Boolean, attribute: "show-shortcuts" })
  accessor showShortcuts: boolean = false;

  /** Label for the submit button (e.g. "Create date window" or "Save date window"). */
  @property({ type: String, attribute: "submit-label" })
  accessor submitLabel: string = "Create date window";

  /** Optional range bounds from the parent panel — used to set the timeline slider context. */
  @property({ type: Object }) accessor rangeBounds: Nullable<RangeBounds> =
    null;

  /** Effective zoom level for the timeline slider (already resolved from "auto"). */
  @property({ type: String, attribute: "zoom-level" })
  accessor zoomLevel: string = "auto";

  /** Date snapping mode passed to the timeline slider. */
  @property({ type: String, attribute: "date-snapping" })
  accessor dateSnapping: string = "hour";

  /** Seed for the window type, copied into internal state when the dialog opens. */
  @property({ type: String }) accessor kind: DateWindowKind = "fixed";

  /** Seed for the relative preset, copied into internal state when the dialog opens. */
  @property({ type: String }) accessor preset: Nullable<string> = null;

  /** Whether relative windows can be chosen (false when creating a window for an anomaly comparison). */
  @property({ type: Boolean, attribute: "allow-relative" })
  accessor allowRelative: boolean = true;

  /** Start of the range selected on the chart; relative presets resolve against it. */
  @property({ attribute: false }) accessor rangeStart: Nullable<Date> = null;

  /** End of the range selected on the chart. */
  @property({ attribute: false }) accessor rangeEnd: Nullable<Date> = null;

  /** Override for "now" (tests and stories); defaults to the current time. */
  @property({ attribute: false }) accessor now: Nullable<Date> = null;

  // DOM refs via @query
  @query("ha-dialog") accessor _dialogEl: Nullable<HTMLElement> = null;

  @query("#date-window-name")
  accessor _nameInput: Nullable<HTMLInputElement> = null;

  @query("#date-window-start")
  accessor _startInput: Nullable<HTMLInputElement> = null;

  @query("#date-window-end")
  accessor _endInput: Nullable<HTMLInputElement> = null;

  @state() accessor _shaking: boolean = false;

  /**
   * Internal, dialog-owned name value. Seeded from the `name` property on the
   * open transition, then owned here so parent re-renders don't wipe what the
   * user typed.
   */
  @state() accessor _nameValue: string = "";

  /** Which field (if any) currently has a validation error shown inline. */
  @state() accessor _error: Nullable<"name" | "range"> = null;

  /** Internal, dialog-owned window type. Seeded from `kind` on open. */
  @state() accessor _kindValue: DateWindowKind = "fixed";

  /** Internal, dialog-owned relative preset. Seeded from `preset` on open. */
  @state() accessor _presetValue: RelativeDateWindowPreset =
    DEFAULT_RELATIVE_DATE_WINDOW_PRESET;

  /** True once the user has typed in the name field (stops relative auto-fill). */
  private _nameEdited = false;

  /** Tracks the previous `open` value so we only seed name on a false→true edge. */
  private _wasOpen = false;

  /**
   * Seed the internal name from the `name` prop only when the dialog opens.
   * Binding `.value` directly to the reactive `name` prop would re-apply a
   * stale value on every parent re-render (the original wipe bug).
   */
  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("open")) {
      if (this.open && !this._wasOpen) {
        this._nameValue = this.name;
        this._error = null;
        // An existing name is the user's; only an empty one may be auto-filled.
        this._nameEdited = !!this.name.trim();
        this._kindValue =
          this.allowRelative && this.kind === "relative" ? "relative" : "fixed";
        this._presetValue = isRelativeDateWindowPreset(this.preset)
          ? this.preset
          : DEFAULT_RELATIVE_DATE_WINDOW_PRESET;
      }
      this._wasOpen = this.open;
    }
  }

  /**
   * Keep the native preset `<select>` in step with `_presetValue`. Options are
   * rendered in the same pass as the select, so its `value` is set afterwards.
   */
  protected updated() {
    const select = this.renderRoot.querySelector<HTMLSelectElement>(
      "#date-window-preset"
    );
    if (select && select.value !== this._presetValue) {
      select.value = this._presetValue;
    }
  }

  /** Localized text for the current inline error, or "" when there is none. */
  private get _errorMessage(): string {
    if (this._error === "name") {
      return msg("Enter a name for this date window.");
    }
    if (this._error === "range") {
      return msg("The start date must be before the end date.");
    }
    return "";
  }

  /**
   * Shake the dialog to signal an invalid submit. Now driven internally by
   * `_onSubmit`; kept public for backwards compatibility with earlier callers.
   */
  shake() {
    if (!this._dialogEl) return;
    this._shaking = false;
    // eslint-disable-next-line no-void
    void this._dialogEl.offsetWidth; // force reflow to restart animation
    this._shaking = true;
  }

  private _onShakeEnd() {
    this._shaking = false;
  }

  private _emit(name: string, detail: RecordWithUnknownValues = {}) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onDialogClosed() {
    this._emit("dp-window-close");
  }

  private _onCancel() {
    this._emit("dp-window-close");
  }

  private _onNameInput(ev: Event) {
    const value =
      (ev.target as HTMLInputElement & { value?: string })?.value ?? "";
    this._nameValue = value;
    this._nameEdited = true;
    if (this._error === "name" && value.trim()) {
      this._error = null;
    }
  }

  /** Pressing Enter in the name field submits, like a regular form. */
  private _onNameKeydown(ev: KeyboardEvent) {
    if (ev.key === "Enter" && !ev.isComposing) {
      ev.preventDefault();
      this._onSubmit();
    }
  }

  private _onSubmit() {
    const name = String(this._nameInput?.value ?? this._nameValue ?? "").trim();

    if (!name) {
      this._showError("name");
      return;
    }

    if (this._kindValue === "relative") {
      this._error = null;
      this._emit("dp-window-submit", {
        kind: "relative",
        name,
        preset: this._presetValue,
      });
      return;
    }

    const start = this._startInput?.value ?? this.startValue;
    const end = this._endInput?.value ?? this.endValue;

    if (!this._isValidRange(start, end)) {
      this._showError("range");
      return;
    }

    this._error = null;
    this._emit("dp-window-submit", { kind: "fixed", name, start, end });
  }

  /** True when both values parse and the start is strictly before the end. */
  private _isValidRange(start: string, end: string): boolean {
    const startDate = this._parseValueToDate(start);
    const endDate = this._parseValueToDate(end);
    return !!startDate && !!endDate && startDate.getTime() < endDate.getTime();
  }

  /** Surface an inline error for a field, shake, and focus it for announcement. */
  private _showError(field: "name" | "range") {
    this._error = field;
    this.shake();
    const target = field === "name" ? this._nameInput : this._startInput;
    (target as Nullable<HTMLElement & { focus?: () => void }>)?.focus?.();
  }

  /** Clear a shown range error once the start/end become a valid range again. */
  private _maybeClearRangeError(start: string, end: string) {
    if (this._error !== "range") return;
    if (this._isValidRange(start, end)) {
      this._error = null;
    }
  }

  /** The selected preset resolved against the chart's selected range, or null. */
  private _resolvePreset() {
    if (!this.rangeStart || !this.rangeEnd) return null;
    return resolveRelativeDateWindow(
      this._presetValue,
      this.rangeStart,
      this.rangeEnd,
      this.now ?? new Date()
    );
  }

  /** Auto-fill the name with the preset label until the user types a name. */
  private _autoFillName() {
    if (this._nameEdited) return;
    this._nameValue = relativeDateWindowPresetLabel(this._presetValue);
    if (this._error === "name") {
      this._error = null;
    }
  }

  private _onKindChange(ev: CustomEvent<DpChangeDetail>) {
    const next = (ev.detail as { type: "radio"; value: string }).value;
    if (next !== "fixed" && next !== "relative") return;
    if (next === this._kindValue) return;
    this._kindValue = next;
    this._error = null;
    if (next === "relative") {
      this._autoFillName();
      return;
    }
    // Relative → fixed: start from the dates the preset resolves to now, so
    // nothing visible jumps.
    const resolved = this._resolvePreset();
    if (resolved) {
      const start = this._formatInputValue(resolved.start.getTime());
      const end = this._formatInputValue(resolved.end.getTime());
      this._emit("dp-window-date-change", { start, end });
    }
  }

  private _onPresetChange(ev: Event) {
    const value = (ev.target as HTMLSelectElement | null)?.value;
    if (!isRelativeDateWindowPreset(value)) return;
    this._presetValue = value;
    this._autoFillName();
  }

  private _onDelete() {
    this._emit("dp-window-delete");
  }

  private _onPreviousShortcut() {
    this._emit("dp-window-shortcut", { direction: -1 });
  }

  private _onNextShortcut() {
    this._emit("dp-window-shortcut", { direction: 1 });
  }

  private _onDateChange() {
    const start = this._startInput?.value ?? "";
    const end = this._endInput?.value ?? "";
    this._maybeClearRangeError(start, end);
    this._emit("dp-window-date-change", { start, end });
  }

  private _onRangeCommit(ev: CustomEvent<{ start: number; end: number }>) {
    const { start, end } = ev.detail ?? {};
    if (!start || !end) return;
    const startStr = this._formatInputValue(start);
    const endStr = this._formatInputValue(end);
    // Update the datetime-local inputs directly so they reflect the slider commit
    if (this._startInput) this._startInput.value = startStr;
    if (this._endInput) this._endInput.value = endStr;
    this._maybeClearRangeError(startStr, endStr);
    this._emit("dp-window-date-change", { start: startStr, end: endStr });
  }

  /** Format epoch ms as a datetime-local input value (YYYY-MM-DDTHH:MM). */
  private _formatInputValue(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Parse the startValue / endValue strings to Date objects for the timeline. */
  private _parseValueToDate(value: string): Nullable<Date> {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Inline, localized validation message for the field named by `id`. */
  private _renderError(id: string) {
    return html`<p id=${id} class="date-window-dialog-error" role="alert">
      ${this._errorMessage}
    </p>`;
  }

  private _renderFixedFields() {
    return html`
      <div class="date-window-dialog-field date-range-group">
        <label>${msg("Date range")}</label>
        <div class="date-window-dialog-dates">
          <div class="date-window-dialog-field">
            <label for="date-window-start">${msg("Start")}</label>
            <input
              id="date-window-start"
              class="date-window-dialog-input"
              type="datetime-local"
              step="60"
              .value=${this.startValue}
              aria-invalid=${this._error === "range" ? "true" : "false"}
              aria-describedby=${this._error === "range"
                ? "date-window-error-range"
                : nothing}
              @change=${this._onDateChange}
            />
          </div>
          <div class="date-window-dialog-field">
            <label for="date-window-end">${msg("End")}</label>
            <input
              id="date-window-end"
              class="date-window-dialog-input"
              type="datetime-local"
              step="60"
              .value=${this.endValue}
              aria-invalid=${this._error === "range" ? "true" : "false"}
              aria-describedby=${this._error === "range"
                ? "date-window-error-range"
                : nothing}
              @change=${this._onDateChange}
            />
          </div>
        </div>
        ${this._error === "range"
          ? this._renderError("date-window-error-range")
          : nothing}
      </div>

      ${this.rangeBounds
        ? html`
            <div class="date-window-dialog-timeline">
              <range-timeline
                .startTime=${this._parseValueToDate(this.startValue)}
                .endTime=${this._parseValueToDate(this.endValue)}
                .rangeBounds=${this.rangeBounds}
                .zoomLevel=${this.zoomLevel}
                .dateSnapping=${this.dateSnapping}
                @dp-range-commit=${this._onRangeCommit}
              ></range-timeline>
            </div>
          `
        : nothing}
      ${this.showShortcuts
        ? html`
            <div class="date-window-dialog-shortcuts">
              <ha-button @click=${this._onPreviousShortcut}
                >${msg("Use previous range")}</ha-button
              >
              <ha-button @click=${this._onNextShortcut}
                >${msg("Use next range")}</ha-button
              >
            </div>
          `
        : nothing}
    `;
  }

  private _renderRelativeFields() {
    const resolved = this._resolvePreset();
    return html`
      <div class="date-window-dialog-field date-range-group">
        <label for="date-window-preset">${msg("Period")}</label>
        <select
          id="date-window-preset"
          class="date-window-dialog-input"
          @change=${this._onPresetChange}
        >
          ${RELATIVE_DATE_WINDOW_PRESETS.map(
            (preset) => html`
              <option value=${preset}>
                ${relativeDateWindowPresetLabel(preset)}
              </option>
            `
          )}
        </select>
        ${resolved
          ? html`<p class="date-window-dialog-preview" aria-live="polite">
              ${msg("Currently")}
              <strong
                >${formatComparisonLabel(resolved.start, resolved.end)}</strong
              >
              ${resolved.available
                ? nothing
                : html`<span class="date-window-dialog-preview-note"
                    >${msg(
                      "No data yet for this period while the chart is up to date."
                    )}</span
                  >`}
            </p>`
          : nothing}
        <p class="date-window-dialog-hint">
          ${msg(
            "The window always has the same length as the selected range and moves with it."
          )}
        </p>
      </div>
    `;
  }

  render() {
    return html`
      <ha-dialog
        class=${classMap({ "dp-shaking": this._shaking })}
        ?open=${this.open}
        .headerTitle=${this.heading}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onDialogClosed}
        @animationend=${this._onShakeEnd}
      >
        <div class="date-window-dialog-content">
          <div class="date-window-dialog-body">
            ${msg(
              "A date window saves a date range as a tab, either fixed dates or a period relative to the selected range, so you can preview it against the selected range or jump the chart to it."
            )}
          </div>

          ${this.allowRelative
            ? html`
                <div class="date-window-dialog-field type-field">
                  <span class="date-window-dialog-label" id="date-window-type"
                    >${msg("Type")}</span
                  >
                  <radio-group
                    aria-labelledby="date-window-type"
                    name="date-window-type"
                    .value=${this._kindValue}
                    .options=${[
                      { value: "fixed", label: msg("Fixed dates") },
                      {
                        value: "relative",
                        label: msg("Relative to selected range"),
                      },
                    ]}
                    @dp-change=${this._onKindChange}
                  ></radio-group>
                </div>
              `
            : nothing}

          <div class="date-window-dialog-field name-field">
            <label for="date-window-name">${msg("Name")}</label>
            <input
              id="date-window-name"
              class="date-window-dialog-input"
              type="text"
              autocomplete="off"
              placeholder=${msg("e.g. Heating season start")}
              .value=${this._nameValue}
              aria-invalid=${this._error === "name" ? "true" : "false"}
              aria-describedby=${this._error === "name"
                ? "date-window-error-name"
                : nothing}
              @input=${this._onNameInput}
              @keydown=${this._onNameKeydown}
            />
            ${this._error === "name"
              ? this._renderError("date-window-error-name")
              : nothing}
          </div>

          ${this._kindValue === "relative"
            ? this._renderRelativeFields()
            : this._renderFixedFields()}

          <div class="date-window-dialog-actions">
            ${this.showDelete
              ? html`
                  <ha-button
                    class="date-window-dialog-delete"
                    @click=${this._onDelete}
                    >${msg("Delete date window")}</ha-button
                  >
                `
              : nothing}
            <div class="date-window-dialog-actions-right">
              <ha-button
                class="date-window-dialog-cancel"
                @click=${this._onCancel}
                >${msg("Cancel")}</ha-button
              >
              <ha-button
                raised
                class="date-window-dialog-submit"
                @click=${this._onSubmit}
                >${this.submitLabel}</ha-button
              >
            </div>
          </div>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define("date-window-dialog", DateWindowDialog);

declare global {
  interface HTMLElementTagNameMap {
    "date-window-dialog": DateWindowDialog;
  }
}
