import { html, LitElement, nothing, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { localized, msg } from "@/lib/i18n/localize";

import { styles } from "./date-window-dialog.styles";
import type { RangeBounds } from "@/atoms/interactive/range-timeline/types";
import "@/atoms/interactive/range-timeline/range-timeline";

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
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * @fires dp-window-submit - `{ name: string, start: string, end: string }` fired only when the inputs are valid
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
      }
      this._wasOpen = this.open;
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
    if (this._error === "name" && value.trim()) {
      this._error = null;
    }
  }

  private _onSubmit() {
    const name = String(
      (this._nameInput as HTMLElement & { value?: string })?.value ??
        this._nameValue ??
        ""
    ).trim();
    const start = this._startInput?.value ?? this.startValue;
    const end = this._endInput?.value ?? this.endValue;

    if (!name) {
      this._showError("name");
      return;
    }

    if (!this._isValidRange(start, end)) {
      this._showError("range");
      return;
    }

    this._error = null;
    this._emit("dp-window-submit", { name, start, end });
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
    // Format as datetime-local value (YYYY-MM-DDTHH:MM) for the inputs
    const fmt = (ms: number) => {
      const d = new Date(ms);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const startStr = fmt(start);
    const endStr = fmt(end);
    // Update the datetime-local inputs directly so they reflect the slider commit
    if (this._startInput) this._startInput.value = startStr;
    if (this._endInput) this._endInput.value = endStr;
    this._maybeClearRangeError(startStr, endStr);
    this._emit("dp-window-date-change", { start: startStr, end: endStr });
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

  render() {
    return html`
      <ha-dialog
        class=${classMap({ "dp-shaking": this._shaking })}
        ?open=${this.open}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onDialogClosed}
        @animationend=${this._onShakeEnd}
      >
        <span slot="heading">${this.heading}</span>
        <div class="date-window-dialog-content">
          <div class="date-window-dialog-body">
            ${msg(
              "A date window saves a named date range as a tab, so you can quickly preview it against the selected range or jump the chart back to it later."
            )}
          </div>

          <div class="date-window-dialog-field name-field">
            <ha-textfield
              id="date-window-name"
              label=${msg("Name")}
              placeholder=${msg("e.g. Heating season start")}
              .value=${this._nameValue}
              aria-invalid=${this._error === "name" ? "true" : "false"}
              aria-describedby=${this._error === "name"
                ? "date-window-error-name"
                : nothing}
              @input=${this._onNameInput}
            ></ha-textfield>
            ${this._error === "name"
              ? this._renderError("date-window-error-name")
              : nothing}
          </div>

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
