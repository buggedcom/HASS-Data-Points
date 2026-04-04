import type { TemplateResult } from "lit";
import { html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { sharedStyles } from "../analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./analysis-anomaly-group.styles";
import { localized, msg } from "@/lib/i18n/localize";
import type {
  ComparisonWindow,
  NormalizedAnalysis,
} from "@/molecules/target-row/types";
import "@/atoms/analysis/analysis-group/analysis-group";
import "@/atoms/analysis/analysis-method-subopts/analysis-method-subopts";

export const ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const ANALYSIS_ANOMALY_METHOD_OPTIONS = [
  {
    value: "trend_residual",
    label: "Trend deviation",
    help: "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline.",
  },
  {
    value: "rate_of_change",
    label: "Sudden change",
    help: "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions.",
  },
  {
    value: "iqr",
    label: "Statistical outlier (IQR)",
    help: "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages.",
  },
  {
    value: "rolling_zscore",
    label: "Rolling Z-score",
    help: "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series.",
  },
  {
    value: "persistence",
    label: "Flat-line / stuck value",
    help: "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings.",
  },
  {
    value: "comparison_window",
    label: "Comparison window deviation",
    help: "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year.",
  },
];

export const ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

export const ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export const ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
];

export const ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS = [
  { value: "all", label: "Show all anomalies" },
  { value: "highlight", label: "Highlight overlaps" },
  { value: "only", label: "Overlaps only" },
];

@localized()
export class AnalysisAnomalyGroup extends LitElement {
  @property({ type: Object }) accessor analysis: NormalizedAnalysis =
    {} as NormalizedAnalysis;

  @property({ type: String, attribute: "entity-id" })
  accessor entityId: string = "";

  @property({ type: Array, attribute: "comparison-windows" })
  accessor comparisonWindows: ComparisonWindow[] = [];

  /** Whether analysis is currently being computed in the worker for this entity. */
  @property({ type: Boolean, attribute: false }) accessor computing: boolean =
    false;

  /** Overall analysis computation progress (0–100) shown in the group header. */
  @property({ type: Number, attribute: false })
  accessor computingProgress: number = 0;

  /** Set of anomaly method names still in-flight in the worker. Each method shows its own spinner. */
  @property({ type: Object, attribute: false })
  accessor computingMethods: Set<string> = new Set();

  static styles = [sharedStyles, styles];

  private _emit(key: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent("dp-group-analysis-change", {
        detail: { entityId: this.entityId, key, value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _renderSelect(
    key: string,
    options: { value: string; label: string }[],
    value: string
  ): TemplateResult {
    return html`
      <select
        class="select"
        @change=${(e: Event) =>
          this._emit(key, (e.target as HTMLSelectElement).value)}
      >
        ${options.map(
          (opt) =>
            html`<option value=${opt.value} ?selected=${opt.value === value}>
              ${opt.label}
            </option>`
        )}
      </select>
    `;
  }

  private _onGroupChange(e: CustomEvent) {
    this._emit("show_anomalies", e.detail.checked);
  }

  private _localizedOptions(
    options: Array<{ value: string; label: string; help?: string }>
  ): Array<{ value: string; label: string; help?: string }> {
    return options.map((option) => ({
      ...option,
      label: msg(option.label, { id: option.label }),
      help: option.help ? msg(option.help, { id: option.help }) : undefined,
    }));
  }

  private _renderMethodSubopts(
    opt: { value: string },
    a: NormalizedAnalysis
  ): TemplateResult | typeof nothing {
    if (opt.value === "rate_of_change") {
      return html`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label"
              >${msg("Rate window", { id: "Rate window" })}</span
            >
            ${this._renderSelect(
              "anomaly_rate_window",
              this._localizedOptions(ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS),
              a.anomaly_rate_window
            )}
          </label>
        </analysis-method-subopts>
      `;
    }
    if (opt.value === "rolling_zscore") {
      return html`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label"
              >${msg("Rolling window", { id: "Rolling window" })}</span
            >
            ${this._renderSelect(
              "anomaly_zscore_window",
              this._localizedOptions(ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS),
              a.anomaly_zscore_window
            )}
          </label>
        </analysis-method-subopts>
      `;
    }
    if (opt.value === "persistence") {
      return html`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label"
              >${msg("Min flat duration", { id: "Min flat duration" })}</span
            >
            ${this._renderSelect(
              "anomaly_persistence_window",
              this._localizedOptions(
                ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS
              ),
              a.anomaly_persistence_window
            )}
          </label>
        </analysis-method-subopts>
      `;
    }
    if (opt.value === "comparison_window") {
      return html`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label"
              >${msg("Compare to window", { id: "Compare to window" })}</span
            >
            <select
              class="select"
              @change=${(e: Event) =>
                this._emit(
                  "anomaly_comparison_window_id",
                  (e.target as HTMLSelectElement).value
                )}
            >
              <option value="" ?selected=${!a.anomaly_comparison_window_id}>
                ${msg("— select window —", { id: "— select window —" })}
              </option>
              ${this.comparisonWindows.map(
                (win) => html`
                  <option
                    value=${win.id}
                    ?selected=${a.anomaly_comparison_window_id === win.id}
                  >
                    ${win.label || win.id}
                  </option>
                `
              )}
            </select>
          </label>
        </analysis-method-subopts>
      `;
    }
    return nothing;
  }

  render() {
    const a = this.analysis;
    const sensitivityOptions = this._localizedOptions(
      ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS
    );
    const methodOptions = this._localizedOptions(
      ANALYSIS_ANOMALY_METHOD_OPTIONS
    );
    const overlapOptions = this._localizedOptions(
      ANALYSIS_ANOMALY_OVERLAP_MODE_OPTIONS
    );
    return html`
      <analysis-group
        .label=${msg("Show anomalies", { id: "Show anomalies" })}
        .checked=${a.show_anomalies}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label"
            >${msg("Sensitivity", { id: "Sensitivity" })}</span
          >
          ${this._renderSelect(
            "anomaly_sensitivity",
            sensitivityOptions,
            a.anomaly_sensitivity
          )}
        </label>
        ${a.sample_interval && a.sample_interval !== "raw"
          ? html`
              <label class="option">
                <input
                  type="checkbox"
                  .checked=${a.anomaly_use_sampled_data !== false}
                  @change=${(e: Event) =>
                    this._emit(
                      "anomaly_use_sampled_data",
                      (e.target as HTMLInputElement).checked
                    )}
                />
                <span
                  >${msg("Use downsampled data for detection", {
                    id: "Use downsampled data for detection",
                  })}</span
                >
              </label>
            `
          : nothing}
        <div class="method-list">
          ${methodOptions.map((opt) => {
            const isChecked =
              Array.isArray(a.anomaly_methods) &&
              a.anomaly_methods.includes(opt.value);
            const isComputing =
              isChecked && (this.computingMethods?.has(opt.value) ?? false);
            const helpId = `anomaly-help-${opt.value}`;
            return html`
              <div class="method-item">
                <label class="option">
                  <input
                    type="checkbox"
                    .checked=${isChecked}
                    @change=${(e: Event) =>
                      this._emit(
                        `anomaly_method_toggle_${opt.value}`,
                        (e.target as HTMLInputElement).checked
                      )}
                  />
                  <span>${opt.label}</span>
                  ${opt.help
                    ? html`
                        <button
                          id=${helpId}
                          class="method-help"
                          type="button"
                          aria-label=${`${opt.label} explanation`}
                        >
                          ?
                        </button>
                        <ha-tooltip
                          class="method-tooltip"
                          for=${helpId}
                          placement="right"
                          distance="8"
                          hoist
                          style="--ha-tooltip-padding: var(--dp-spacing-md, calc(var(--spacing, 8px) * 1.5));"
                        >
                          ${opt.help}
                        </ha-tooltip>
                      `
                    : nothing}
                  ${isComputing
                    ? html`
                        <span
                          class="method-computing-indicator"
                          aria-label=${msg("Computing…", { id: "Computing…" })}
                        >
                          <span class="method-computing-spinner"></span>
                          <span class="method-computing-progress"
                            >${this.computingProgress}%</span
                          >
                        </span>
                      `
                    : nothing}
                </label>
                ${isChecked ? this._renderMethodSubopts(opt, a) : nothing}
              </div>
            `;
          })}
        </div>
        ${Array.isArray(a.anomaly_methods) && a.anomaly_methods.length >= 2
          ? html`
              <label class="field">
                <span class="field-label"
                  >${msg("When methods overlap", {
                    id: "When methods overlap",
                  })}</span
                >
                ${this._renderSelect(
                  "anomaly_overlap_mode",
                  overlapOptions,
                  a.anomaly_overlap_mode
                )}
              </label>
            `
          : nothing}
      </analysis-group>
    `;
  }
}

customElements.define("analysis-anomaly-group", AnalysisAnomalyGroup);
