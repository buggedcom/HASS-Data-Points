import { html, LitElement, nothing } from "lit";
import { property, query } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";
import { styles } from "./series-preview-dialog.styles";

/** The imperative surface of `hass-datapoints-history-card` used here. */
type PreviewChartElement = HTMLElement & {
  hass?: unknown;
  setConfig(config: RecordWithUnknownValues): void;
};

/** Tag of the main datapoints history chart card. */
export const PREVIEW_CHART_TAG = "hass-datapoints-history-card";

/**
 * `series-preview-dialog` is a quick popup preview of the main datapoints
 * history chart: the same `hass-datapoints-history-card`, configured by the
 * caller (typically a monitor's entities with the anomaly overlay on).
 *
 * The chart card is imperative (`setConfig`), so the dialog mounts one chart
 * element into its body and re-configures it whenever `chartConfig` changes.
 *
 * @fires dp-series-preview-close     — `{}` dialog dismissed
 * @fires dp-series-preview-open-chart — `{}` "Open in chart" clicked; the
 *   parent swaps the main chart to the previewed series
 */
@localized()
export class SeriesPreviewDialog extends LitElement {
  static styles = styles;

  @property({ type: Boolean }) accessor open: boolean = false;

  @property({ type: String }) accessor heading: string = "";

  /** Optional secondary line under the chart, e.g. the previewed range. */
  @property({ type: String }) accessor subheading: string = "";

  @property({ attribute: false }) accessor hass: unknown = null;

  /** `setConfig` payload for the history card; `null` renders no chart. */
  @property({ attribute: false })
  accessor chartConfig: Nullable<RecordWithUnknownValues> = null;

  /** Whether to offer the "Open in chart" action. */
  @property({ type: Boolean, attribute: "show-open-chart" })
  accessor showOpenChart: boolean = true;

  @query(".series-preview-chart")
  accessor _chartHostEl: Nullable<HTMLElement> = null;

  private _chartEl: Nullable<PreviewChartElement> = null;

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("chartConfig") || changed.has("open")) {
      this._syncChart();
    } else if (changed.has("hass") && this._chartEl && this.hass) {
      this._chartEl.hass = this.hass;
    }
  }

  private _syncChart() {
    const host = this._chartHostEl;
    if (!host) {
      return;
    }
    if (!this.open || !this.chartConfig) {
      host.replaceChildren();
      this._chartEl = null;
      return;
    }
    if (!this._chartEl) {
      this._chartEl = document.createElement(
        PREVIEW_CHART_TAG
      ) as PreviewChartElement;
      host.replaceChildren(this._chartEl);
    }
    if (typeof this._chartEl.setConfig === "function") {
      this._chartEl.setConfig(this.chartConfig);
    }
    if (this.hass) {
      this._chartEl.hass = this.hass;
    }
  }

  private _emit(name: string) {
    this.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true })
    );
  }

  private _onClose() {
    this._emit("dp-series-preview-close");
  }

  private _onOpenChart() {
    this._emit("dp-series-preview-open-chart");
  }

  render() {
    return html`
      <ha-dialog
        ?open=${this.open}
        .headerTitle=${this.heading}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onClose}
      >
        <div class="series-preview-content">
          <div class="series-preview-chart"></div>
          ${this.subheading
            ? html`<p class="series-preview-subheading">${this.subheading}</p>`
            : nothing}
          <div class="series-preview-actions">
            <ha-button class="series-preview-close" @click=${this._onClose}
              >${msg("Close")}</ha-button
            >
            ${this.showOpenChart
              ? html`<ha-button
                  class="series-preview-open-chart"
                  raised
                  @click=${this._onOpenChart}
                  >${msg("Open in chart")}</ha-button
                >`
              : nothing}
          </div>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define("series-preview-dialog", SeriesPreviewDialog);

declare global {
  interface HTMLElementTagNameMap {
    "series-preview-dialog": SeriesPreviewDialog;
  }
}
