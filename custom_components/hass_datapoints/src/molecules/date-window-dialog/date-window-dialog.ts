import { html, LitElement, nothing, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { localized, msg } from "@/lib/i18n/localize";
import { interpolatePlaceholders } from "@/lib/i18n/interpolate";

import { styles } from "./date-window-dialog.styles";
import { formatDateTimeRange } from "@/lib/domain/date-window";
import {
  DEFAULT_RELATIVE_DATE_WINDOW_PRESET,
  isRelativeDateWindowPreset,
  RELATIVE_DATE_WINDOW_PRESETS,
  type RelativeDateWindowPreset,
  relativeDateWindowPresetLabel,
  resolveRelativeDateWindow,
} from "@/lib/domain/relative-date-window";
import { formatRangeDuration } from "@/lib/timeline/timeline-scale";

export type DateWindowKind = "fixed" | "relative";

const KINDS: DateWindowKind[] = ["relative", "fixed"];

/**
 * `date-window-dialog` renders the Add / Edit date window dialog.
 * It wraps `ha-dialog` and provides a form for a named date window.
 *
 * Layout (top to bottom): a Relative | Fixed dates tab bar (Relative first),
 * one line explaining the chosen type, that type's fields, the optional name,
 * and the action row.
 *
 * Ownership model (see context.md): the dialog owns its **name**, window
 * **type** and relative **preset**. The incoming `name`, `kind` and `preset`
 * properties are only *seeds*, copied into internal `@state` on the open
 * transition, so parent re-renders never clobber what the user typed. The
 * start/end values remain controlled by the parent panel.
 *
 * The name is optional. Left empty it defaults to the preset label (relative)
 * or the fixed dates, shown as the field's placeholder. Create is disabled
 * while the fixed range is invalid; an invalid submit still shakes the dialog
 * and does **not** emit `dp-window-submit`.
 *
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * @fires dp-window-submit - `{ kind: "fixed", name, start, end }` or `{ kind: "relative", name, preset }`, fired only when the inputs are valid
 * @fires dp-window-delete - `{}` fired when the Delete button is clicked
 * @fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when the "Previous range" / "Next range" fill chip is clicked
 * @fires dp-window-date-change - `{ start: string, end: string }` fired when either datetime input changes or a fill chip sets both
 */
@localized()
export class DateWindowDialog extends LitElement {
  static styles = styles;

  /** Whether the dialog is open. */
  @property({ type: Boolean }) accessor open: boolean = false;

  /** Title shown in the dialog header. */
  @property({ type: String }) accessor heading: string = "Add date window";

  /** Seed for the name field, copied into internal state when the dialog opens. */
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

  /** Whether the "Fill from" chips are shown in the Fixed dates tab. */
  @property({ type: Boolean, attribute: "show-shortcuts" })
  accessor showShortcuts: boolean = false;

  /** Label for the submit button (e.g. "Create date window" or "Save date window"). */
  @property({ type: String, attribute: "submit-label" })
  accessor submitLabel: string = "Create date window";

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
   * Internal, dialog-owned name the user typed ("" means "use the default").
   * Seeded from the `name` property on the open transition.
   */
  @state() accessor _nameValue: string = "";

  /** Internal, dialog-owned window type. Seeded from `kind` on open. */
  @state() accessor _kindValue: DateWindowKind = "fixed";

  /** Internal, dialog-owned relative preset. Seeded from `preset` on open. */
  @state() accessor _presetValue: RelativeDateWindowPreset =
    DEFAULT_RELATIVE_DATE_WINDOW_PRESET;

  /**
   * The fixed-tab start/end as last seen, from the controlled props or the
   * user's own edits, so validity and the default name update as they type.
   */
  @state() accessor _fixedStart: string = "";

  @state() accessor _fixedEnd: string = "";

  /** Tracks the previous `open` value so we only seed on a false→true edge. */
  private _wasOpen = false;

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("startValue")) this._fixedStart = this.startValue;
    if (changed.has("endValue")) this._fixedEnd = this.endValue;
    if (changed.has("open")) {
      if (this.open && !this._wasOpen) {
        this._kindValue =
          this.allowRelative && this.kind === "relative" ? "relative" : "fixed";
        this._presetValue = isRelativeDateWindowPreset(this.preset)
          ? this.preset
          : DEFAULT_RELATIVE_DATE_WINDOW_PRESET;
        // A relative window still named after its preset keeps following the
        // preset, so its name field starts empty.
        const seeded = this.name.trim();
        this._nameValue =
          this._kindValue === "relative" &&
          seeded === relativeDateWindowPresetLabel(this._presetValue)
            ? ""
            : this.name;
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

  /**
   * Shake the dialog to signal an invalid submit. Driven internally by
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
    this._nameValue =
      (ev.target as HTMLInputElement & { value?: string })?.value ?? "";
  }

  /** Pressing Enter in the name field submits, like a regular form. */
  private _onNameKeydown(ev: KeyboardEvent) {
    if (ev.key === "Enter" && !ev.isComposing) {
      ev.preventDefault();
      this._onSubmit();
    }
  }

  /** The parsed fixed range, or null while it is incomplete or inverted. */
  private get _fixedRange(): Nullable<{ start: Date; end: Date }> {
    const start = this._parseValueToDate(this._fixedStart);
    const end = this._parseValueToDate(this._fixedEnd);
    return start && end && start.getTime() < end.getTime()
      ? { start, end }
      : null;
  }

  /** True when both fixed dates are filled in but the end is not after the start. */
  private get _fixedRangeInvalid(): boolean {
    return !!this._fixedStart && !!this._fixedEnd && !this._fixedRange;
  }

  /** The name used when the field is left empty. */
  private get _defaultName(): string {
    if (this._kindValue === "relative") {
      return relativeDateWindowPresetLabel(this._presetValue);
    }
    const range = this._fixedRange;
    return range
      ? formatDateTimeRange(range.start, range.end)
      : msg("Custom range");
  }

  private get _canSubmit(): boolean {
    return this._kindValue === "relative" || !!this._fixedRange;
  }

  private _onSubmit() {
    const typed = String(
      this._nameInput?.value ?? this._nameValue ?? ""
    ).trim();

    if (this._kindValue === "relative") {
      this._emit("dp-window-submit", {
        kind: "relative",
        name: typed || this._defaultName,
        preset: this._presetValue,
      });
      return;
    }

    this._fixedStart = this._startInput?.value ?? this._fixedStart;
    this._fixedEnd = this._endInput?.value ?? this._fixedEnd;
    if (!this._fixedRange) {
      this.shake();
      this._startInput?.focus?.();
      return;
    }

    this._emit("dp-window-submit", {
      kind: "fixed",
      name: typed || this._defaultName,
      start: this._fixedStart,
      end: this._fixedEnd,
    });
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

  private _selectKind(next: DateWindowKind) {
    if (next === this._kindValue) return;
    this._kindValue = next;
    if (next === "relative") return;
    // Relative → fixed: start from the dates the preset resolves to now, so
    // nothing visible jumps.
    const resolved = this._resolvePreset();
    if (resolved) {
      this._setFixedRange(resolved.start, resolved.end);
    }
  }

  /** Arrow keys move between the type tabs, as in a standard tab list. */
  private _onTabKeydown(ev: KeyboardEvent) {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    ev.preventDefault();
    const index = KINDS.indexOf(this._kindValue);
    const step = ev.key === "ArrowRight" ? 1 : -1;
    const next = KINDS[(index + step + KINDS.length) % KINDS.length];
    this._selectKind(next);
    this.updateComplete.then(() => {
      this.renderRoot
        .querySelector<HTMLElement>(`#date-window-tab-${next}`)
        ?.focus();
    });
  }

  private _onPresetChange(ev: Event) {
    const value = (ev.target as HTMLSelectElement | null)?.value;
    if (!isRelativeDateWindowPreset(value)) return;
    this._presetValue = value;
  }

  private _onDelete() {
    this._emit("dp-window-delete");
  }

  private _onFillSelected() {
    if (!this.rangeStart || !this.rangeEnd) return;
    this._setFixedRange(this.rangeStart, this.rangeEnd);
  }

  private _onPreviousShortcut() {
    this._emit("dp-window-shortcut", { direction: -1 });
  }

  private _onNextShortcut() {
    this._emit("dp-window-shortcut", { direction: 1 });
  }

  private _setFixedRange(start: Date, end: Date) {
    this._fixedStart = this._formatInputValue(start.getTime());
    this._fixedEnd = this._formatInputValue(end.getTime());
    this._emit("dp-window-date-change", {
      start: this._fixedStart,
      end: this._fixedEnd,
    });
  }

  private _onDateChange() {
    this._fixedStart = this._startInput?.value ?? "";
    this._fixedEnd = this._endInput?.value ?? "";
    this._emit("dp-window-date-change", {
      start: this._fixedStart,
      end: this._fixedEnd,
    });
  }

  /** Format epoch ms as a datetime-local input value (YYYY-MM-DDTHH:MM). */
  private _formatInputValue(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Parse a datetime-local value to a Date, or null when it is invalid. */
  private _parseValueToDate(value: string): Nullable<Date> {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private _renderTabs() {
    const tabs: Array<{ kind: DateWindowKind; label: string; icon: string }> = [
      {
        kind: "relative",
        label: msg("Relative"),
        icon: "mdi:calendar-sync",
      },
      { kind: "fixed", label: msg("Fixed dates"), icon: "mdi:calendar-range" },
    ];
    return html`
      <div
        class="date-window-dialog-tabs"
        role="tablist"
        aria-label=${msg("Date window type")}
        @keydown=${this._onTabKeydown}
      >
        ${tabs.map(
          ({ kind, label, icon }) => html`
            <button
              type="button"
              id="date-window-tab-${kind}"
              class="date-window-dialog-tab"
              role="tab"
              aria-selected=${this._kindValue === kind ? "true" : "false"}
              aria-controls="date-window-panel"
              tabindex=${this._kindValue === kind ? "0" : "-1"}
              @click=${() => this._selectKind(kind)}
            >
              <ha-icon icon=${icon} aria-hidden="true"></ha-icon>
              <span>${label}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  /** "Length …" for a valid range, an error for an inverted one, else nothing. */
  private _renderLength(range: Nullable<{ start: Date; end: Date }>) {
    if (range) {
      return html`<p id="date-window-length" class="date-window-dialog-length">
        ${interpolatePlaceholders(msg("Length {0}"), [
          formatRangeDuration(range.start, range.end),
        ])}
      </p>`;
    }
    if (!this._fixedRangeInvalid) return nothing;
    return html`<p
      id="date-window-length"
      class="date-window-dialog-length date-window-dialog-error"
      role="alert"
    >
      ${msg("End must be after start.")}
    </p>`;
  }

  private _renderFixedFields() {
    const range = this._fixedRange;
    return html`
      <p class="date-window-dialog-hint">
        ${msg(
          "Pins an exact start and end. The window stays put when the chart moves."
        )}
      </p>
      <div class="date-window-dialog-dates">
        <div class="date-window-dialog-field">
          <label for="date-window-start">${msg("Start")}</label>
          <input
            id="date-window-start"
            class="date-window-dialog-input"
            type="datetime-local"
            step="60"
            .value=${this._fixedStart}
            aria-invalid=${this._fixedRangeInvalid ? "true" : "false"}
            aria-describedby="date-window-length"
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
            .value=${this._fixedEnd}
            aria-invalid=${this._fixedRangeInvalid ? "true" : "false"}
            aria-describedby="date-window-length"
            @change=${this._onDateChange}
          />
        </div>
      </div>
      ${this._renderLength(range)}
      ${this.showShortcuts
        ? html`
            <div class="date-window-dialog-chips">
              <span class="date-window-dialog-chips-label"
                >${msg("Fill from")}</span
              >
              ${this.rangeStart && this.rangeEnd
                ? html`<button
                    type="button"
                    class="date-window-dialog-chip"
                    @click=${this._onFillSelected}
                  >
                    ${msg("Selected range")}
                  </button>`
                : nothing}
              <button
                type="button"
                class="date-window-dialog-chip"
                @click=${this._onPreviousShortcut}
              >
                ${msg("Previous range")}
              </button>
              <button
                type="button"
                class="date-window-dialog-chip"
                @click=${this._onNextShortcut}
              >
                ${msg("Next range")}
              </button>
            </div>
          `
        : nothing}
    `;
  }

  /** Thin strip showing where the window sits against the selected range. */
  private _renderStrip(selStart: Date, selEnd: Date, win: Date, winEnd: Date) {
    const lo = Math.min(selStart.getTime(), win.getTime());
    const hi = Math.max(selEnd.getTime(), winEnd.getTime());
    const span = hi - lo || 1;
    const pos = (a: Date, b: Date) =>
      `left:${((a.getTime() - lo) / span) * 100}%;width:${Math.max(
        ((b.getTime() - a.getTime()) / span) * 100,
        1.5
      )}%`;
    return html`
      <div class="date-window-dialog-strip" aria-hidden="true">
        <span class="is-selected" style=${pos(selStart, selEnd)}></span>
        <span class="is-window" style=${pos(win, winEnd)}></span>
      </div>
    `;
  }

  private _renderRelativeFields() {
    const resolved = this._resolvePreset();
    return html`
      <p class="date-window-dialog-hint">
        ${msg(
          "Follows the selected range. When you move the chart, this window moves with it and keeps the same length."
        )}
      </p>
      <div class="date-window-dialog-field">
        <label for="date-window-preset">${msg("Period")}</label>
        <select
          id="date-window-preset"
          class="date-window-dialog-input date-window-dialog-select"
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
      </div>
      ${resolved && this.rangeStart && this.rangeEnd
        ? html`
            <div class="date-window-dialog-preview" aria-live="polite">
              <div class="date-window-dialog-preview-row">
                <span class="swatch is-selected" aria-hidden="true"></span>
                <span class="key">${msg("Selected range")}</span>
                <span class="value"
                  >${formatDateTimeRange(this.rangeStart, this.rangeEnd)}</span
                >
              </div>
              <div class="date-window-dialog-preview-row">
                <span class="swatch is-window" aria-hidden="true"></span>
                <span class="key">${msg("This window")}</span>
                <span class="value"
                  >${formatDateTimeRange(resolved.start, resolved.end)}</span
                >
              </div>
              ${this._renderStrip(
                this.rangeStart,
                this.rangeEnd,
                resolved.start,
                resolved.end
              )}
              <p class="date-window-dialog-preview-note">
                ${interpolatePlaceholders(msg("Both are {0} long."), [
                  formatRangeDuration(this.rangeStart, this.rangeEnd),
                ])}
                ${resolved.available
                  ? nothing
                  : msg(
                      "No data yet for this period while the chart is up to date."
                    )}
              </p>
            </div>
          `
        : nothing}
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
          ${this.allowRelative ? this._renderTabs() : nothing}

          <div
            id="date-window-panel"
            class="date-window-dialog-panel"
            role=${this.allowRelative ? "tabpanel" : nothing}
            aria-labelledby=${this.allowRelative
              ? `date-window-tab-${this._kindValue}`
              : nothing}
          >
            ${this._kindValue === "relative"
              ? this._renderRelativeFields()
              : this._renderFixedFields()}

            <div class="date-window-dialog-field name-field">
              <label for="date-window-name"
                >${msg("Name")}
                <span class="date-window-dialog-optional"
                  >${msg("(optional)")}</span
                ></label
              >
              <input
                id="date-window-name"
                class="date-window-dialog-input"
                type="text"
                autocomplete="off"
                placeholder=${this._defaultName}
                .value=${this._nameValue}
                @input=${this._onNameInput}
                @keydown=${this._onNameKeydown}
              />
            </div>
          </div>

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
                ?disabled=${!this._canSubmit}
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
