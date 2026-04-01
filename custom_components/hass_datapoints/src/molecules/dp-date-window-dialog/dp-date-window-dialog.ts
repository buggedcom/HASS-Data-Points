import { LitElement, html, nothing } from "lit";
import { styles } from "./dp-date-window-dialog.styles";

/**
 * `dp-date-window-dialog` renders the Add / Edit date window dialog.
 * It wraps `ha-dialog` and provides a controlled form for setting a named date range.
 *
 * The component is fully controlled — all field values are passed via properties and
 * the parent is responsible for updating them in response to events.
 *
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * @fires dp-window-submit - `{ name: string, start: string, end: string }` fired when the submit button is clicked with valid inputs
 * @fires dp-window-delete - `{}` fired when the Delete button is clicked
 * @fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when a "Use previous/next range" shortcut is clicked
 * @fires dp-window-date-change - `{ start: string, end: string }` fired when either datetime input changes
 */
export class DpDateWindowDialog extends LitElement {
  static styles = styles;

  static properties = {
    open: { type: Boolean },
    heading: { type: String },
    name: { type: String },
    startValue: { type: String, attribute: "start-value" },
    endValue: { type: String, attribute: "end-value" },
    showDelete: { type: Boolean, attribute: "show-delete" },
    showShortcuts: { type: Boolean, attribute: "show-shortcuts" },
    submitLabel: { type: String, attribute: "submit-label" },
  };

  /** Whether the dialog is open. */
  declare open: boolean;

  /** Title shown in the dialog header. */
  declare heading: string;

  /** Current value of the name text field. */
  declare name: string;

  /** Current value of the start datetime-local input (ISO string or datetime-local format). */
  declare startValue: string;

  /** Current value of the end datetime-local input (ISO string or datetime-local format). */
  declare endValue: string;

  /** Whether the Delete button is shown (true when editing an existing window). */
  declare showDelete: boolean;

  /** Whether the "Use previous range" / "Use next range" shortcut buttons are shown. */
  declare showShortcuts: boolean;

  /** Label for the submit button (e.g. "Create date window" or "Save date window"). */
  declare submitLabel: string;

  constructor() {
    super();
    this.open = false;
    this.heading = "Add date window";
    this.name = "";
    this.startValue = "";
    this.endValue = "";
    this.showDelete = false;
    this.showShortcuts = false;
    this.submitLabel = "Create date window";
  }

  private _emit(name: string, detail: Record<string, unknown> = {}) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onDialogClosed() {
    this._emit("dp-window-close");
  }

  private _onCancel() {
    this._emit("dp-window-close");
  }

  private _onSubmit() {
    const nameInput = this.shadowRoot?.querySelector<HTMLInputElement>("#date-window-name");
    const startInput = this.shadowRoot?.querySelector<HTMLInputElement>("#date-window-start");
    const endInput = this.shadowRoot?.querySelector<HTMLInputElement>("#date-window-end");
    const nameVal = (nameInput as HTMLElement & { value?: string })?.value ?? this.name;
    this._emit("dp-window-submit", {
      name: String(nameVal ?? "").trim(),
      start: startInput?.value ?? this.startValue,
      end: endInput?.value ?? this.endValue,
    });
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
    const startInput = this.shadowRoot?.querySelector<HTMLInputElement>("#date-window-start");
    const endInput = this.shadowRoot?.querySelector<HTMLInputElement>("#date-window-end");
    this._emit("dp-window-date-change", {
      start: startInput?.value ?? "",
      end: endInput?.value ?? "",
    });
  }

  render() {
    return html`
      <ha-dialog
        ?open=${this.open}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        .heading=${this.heading}
        @closed=${this._onDialogClosed}
      >
        <div class="date-window-dialog-content">
          <div class="date-window-dialog-body">
            A date window saves a named date range as a tab, so you can quickly preview it against
            the selected range or jump the chart back to it later.
          </div>

          <div class="date-window-dialog-field name-field">
            <ha-textfield
              id="date-window-name"
              label="Name"
              placeholder="e.g. Heating season start"
              .value=${this.name}
            ></ha-textfield>
          </div>

          <div class="date-window-dialog-field">
            <label>Date range</label>
            <div class="date-window-dialog-dates">
              <div class="date-window-dialog-field">
                <label for="date-window-start">Start</label>
                <input
                  id="date-window-start"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.startValue}
                  @change=${this._onDateChange}
                />
              </div>
              <div class="date-window-dialog-field">
                <label for="date-window-end">End</label>
                <input
                  id="date-window-end"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.endValue}
                  @change=${this._onDateChange}
                />
              </div>
            </div>
          </div>

          ${this.showShortcuts
            ? html`
                <div class="date-window-dialog-shortcuts">
                  <ha-button @click=${this._onPreviousShortcut}>Use previous range</ha-button>
                  <ha-button @click=${this._onNextShortcut}>Use next range</ha-button>
                </div>
              `
            : nothing}

          <div class="date-window-dialog-actions">
            ${this.showDelete
              ? html`
                  <ha-button
                    class="date-window-dialog-delete"
                    @click=${this._onDelete}
                  >Delete date window</ha-button>
                `
              : nothing}
            <div class="date-window-dialog-actions-right">
              <ha-button
                class="date-window-dialog-cancel"
                @click=${this._onCancel}
              >Cancel</ha-button>
              <ha-button
                raised
                class="date-window-dialog-submit"
                @click=${this._onSubmit}
              >${this.submitLabel}</ha-button>
            </div>
          </div>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define("dp-date-window-dialog", DpDateWindowDialog);

declare global {
  interface HTMLElementTagNameMap {
    "dp-date-window-dialog": DpDateWindowDialog;
  }
}
