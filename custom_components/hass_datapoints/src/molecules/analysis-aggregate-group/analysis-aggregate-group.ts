import { LitElement, html, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";

import { AnalysisGroupMixin } from "../analysis-group-shared/analysis-group.mixin";
import { sharedStyles } from "../analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./analysis-aggregate-group.styles";
import {
  AGGREGATE_INTERVAL_OPTIONS,
  BINARY_AGGREGATE_KINDS,
  NUMERIC_AGGREGATE_OPERATIONS,
  applyBinaryAggregateKind,
  createBinaryAggregate,
  createEventAggregate,
  createMeasurementAggregate,
  getBinaryAggregateKind,
  getBinaryStateOptions,
} from "@/lib/domain/aggregation/labels";
import type {
  AggregateDefinition,
  AggregateInterval,
  AggregateOperation,
} from "@/lib/domain/aggregation/types";
import "@/atoms/analysis/analysis-group/analysis-group";
import "@/atoms/analysis/analysis-method-subopts/analysis-method-subopts";
import "@/atoms/form/inline-select/inline-select";

interface AggregateChoice {
  /** Stable key; also the id of the definition this choice creates. */
  key: string;
  label: string;
}

const CUMULATIVE_OPERATIONS: AggregateOperation[] = [
  "consumption",
  "transition_count",
  "state_duration",
  "event_count",
];

/**
 * Aggregate series for a row. Like the anomaly group, each aggregate is a
 * checkbox and its settings (state, interval, cumulative, ...) nest beneath it
 * while it is checked. One definition exists per checked choice.
 * @fires dp-group-analysis-change - `{ entityId, key: "aggregates", value: AggregateDefinition[] }` — the full next list of definitions
 */
@localized()
export class AnalysisAggregateGroup extends AnalysisGroupMixin(LitElement) {
  /** HA device class of the source entity; selects Open/Closed style labels. */
  @property({ type: String, attribute: "device-class" })
  accessor deviceClass: string = "";

  /** `binary` offers state operations; `measurement` numeric ones; `event` event counts. */
  @property({ type: String })
  accessor variant: "binary" | "measurement" | "event" = "binary";

  /** Numeric operations suggested for the entity; the user still chooses. */
  @property({ type: Array, attribute: false })
  accessor operations: AggregateOperation[] = [];

  /** Event types the entity can emit (HA `event_types` attribute). */
  @property({ type: Array, attribute: false })
  accessor eventTypes: string[] = [];

  /** Keeps the group open right after it is switched on, before any choice is checked. */
  @state() private accessor _open = false;

  static styles = [sharedStyles, styles];

  private get _definitions(): AggregateDefinition[] {
    return this.analysis.aggregates ?? [];
  }

  private _commit(next: AggregateDefinition[]) {
    this._emit("aggregates", next);
  }

  private _choices(): AggregateChoice[] {
    if (this.variant === "event") {
      return [{ key: "event_count", label: msg("Count events") }];
    }
    if (this.variant === "measurement") {
      return NUMERIC_AGGREGATE_OPERATIONS.filter((o) =>
        this.operations.includes(o.value)
      ).map((o) => ({ key: o.value, label: msg(o.label) }));
    }
    return BINARY_AGGREGATE_KINDS.map((k) => ({
      key: k.value,
      label: msg(k.label),
    }));
  }

  private _keyOf(definition: AggregateDefinition): string {
    if (this.variant === "binary") {
      return getBinaryAggregateKind(definition);
    }
    return definition.operation;
  }

  private _definitionFor(key: string): AggregateDefinition | undefined {
    return this._definitions.find((d) => this._keyOf(d) === key);
  }

  private _defaultState(): string {
    return getBinaryStateOptions(this.deviceClass)[0].value;
  }

  private _create(key: string): AggregateDefinition {
    const ids = this._definitions.map((d) => d.id);
    let created: AggregateDefinition;
    if (this.variant === "event") {
      created = createEventAggregate(ids);
    } else if (this.variant === "measurement") {
      created = createMeasurementAggregate(ids, key as AggregateOperation);
    } else {
      created = applyBinaryAggregateKind(
        createBinaryAggregate(ids, this._defaultState()),
        key as ReturnType<typeof getBinaryAggregateKind>,
        this._defaultState()
      );
    }
    return { ...created, id: ids.includes(key) ? created.id : key };
  }

  private _onGroupChange(e: CustomEvent) {
    const checked = (e.detail as { checked: boolean }).checked;
    this._open = checked;
    if (!checked) {
      this._commit([]);
    }
  }

  private _onToggle(key: string, checked: boolean) {
    this._commit(
      checked
        ? [...this._definitions, this._create(key)]
        : this._definitions.filter((d) => this._keyOf(d) !== key)
    );
  }

  private _update(
    id: string,
    patch: (d: AggregateDefinition) => AggregateDefinition
  ) {
    this._commit(this._definitions.map((d) => (d.id === id ? patch(d) : d)));
  }

  private _selectValue(e: Event): string {
    return (e as CustomEvent<{ type: "select"; value: string }>).detail.value;
  }

  private _renderIntervalField(definition: AggregateDefinition) {
    return html`
      <label class="field">
        <span class="field-label">${msg("Interval")}</span>
        <inline-select
          .value=${definition.interval}
          .options=${this._localizedOptions(AGGREGATE_INTERVAL_OPTIONS)}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              interval: this._selectValue(e) as AggregateInterval,
            }))}
        ></inline-select>
      </label>
    `;
  }

  private _renderStateField(definition: AggregateDefinition) {
    const options = getBinaryStateOptions(this.deviceClass).map((o) => ({
      value: o.value,
      label: msg(o.label),
    }));
    return html`
      <label class="field">
        <span class="field-label">${msg("State")}</span>
        <inline-select
          .value=${definition.states?.[0] ?? options[0].value}
          .options=${options}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              states: [this._selectValue(e)],
            }))}
        ></inline-select>
      </label>
    `;
  }

  /** Counts, durations and consumption can accumulate; percentages cannot. */
  private _renderCumulativeFields(definition: AggregateDefinition) {
    if (!CUMULATIVE_OPERATIONS.includes(definition.operation)) {
      return nothing;
    }
    const cumulative = definition.mode === "cumulative";
    return html`
      <label class="option">
        <input
          type="checkbox"
          class="cumulative"
          .checked=${cumulative}
          @change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              mode: (e.target as HTMLInputElement).checked
                ? "cumulative"
                : "interval",
            }))}
        />
        <span>${msg("Cumulative")}</span>
      </label>
      ${cumulative
        ? html`<label class="option">
            <input
              type="checkbox"
              class="reset-on-zoom"
              .checked=${definition.resetOnZoom}
              @change=${(e: Event) =>
                this._update(definition.id, (d) => ({
                  ...d,
                  resetOnZoom: (e.target as HTMLInputElement).checked,
                }))}
            />
            <span>${msg("Reset total to zoomed range")}</span>
          </label>`
        : nothing}
    `;
  }

  private _onEventTypeToggle(
    definition: AggregateDefinition,
    type: string,
    checked: boolean
  ) {
    const current = definition.eventTypes ?? [];
    const next = checked
      ? [...new Set([...current, type])]
      : current.filter((t) => t !== type);
    // Deselecting the last specific type falls back to All event types.
    this._update(definition.id, (d) => ({ ...d, eventTypes: next }));
  }

  private _renderEventTypeFields(definition: AggregateDefinition) {
    const selected = definition.eventTypes ?? [];
    const allTypes = selected.length === 0;
    return html`
      <label class="option">
        <input
          type="checkbox"
          class="all-types"
          .checked=${allTypes}
          @change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              eventTypes: (e.target as HTMLInputElement).checked
                ? []
                : this.eventTypes.slice(0, 1),
            }))}
        />
        <span>${msg("All event types")}</span>
      </label>
      ${allTypes
        ? nothing
        : this.eventTypes.map(
            (type) => html`
              <label class="option">
                <input
                  type="checkbox"
                  class="event-type"
                  .checked=${selected.includes(type)}
                  @change=${(e: Event) =>
                    this._onEventTypeToggle(
                      definition,
                      type,
                      (e.target as HTMLInputElement).checked
                    )}
                />
                <span>${type}</span>
              </label>
            `
          )}
    `;
  }

  private _renderSubopts(
    key: string,
    definition: AggregateDefinition
  ): TemplateResult {
    return html`
      <analysis-method-subopts>
        ${this.variant === "binary" && key !== "all_changes"
          ? this._renderStateField(definition)
          : nothing}
        ${this._renderIntervalField(definition)}
        ${this.variant === "event"
          ? this._renderEventTypeFields(definition)
          : nothing}
        ${this._renderCumulativeFields(definition)}
      </analysis-method-subopts>
    `;
  }

  render() {
    const choices = this._choices();
    return html`
      <analysis-group
        .label=${msg("Aggregate series")}
        .checked=${this._open || this._definitions.length > 0}
        @dp-group-change=${this._onGroupChange}
      >
        <div class="method-list">
          ${choices.map((choice) => {
            const definition = this._definitionFor(choice.key);
            return html`
              <div class="method-item">
                <label class="option">
                  <input
                    type="checkbox"
                    class="aggregate-choice"
                    data-key=${choice.key}
                    .checked=${definition !== undefined}
                    @change=${(e: Event) =>
                      this._onToggle(
                        choice.key,
                        (e.target as HTMLInputElement).checked
                      )}
                  />
                  <span>${choice.label}</span>
                </label>
                ${definition
                  ? this._renderSubopts(choice.key, definition)
                  : nothing}
              </div>
            `;
          })}
        </div>
      </analysis-group>
    `;
  }
}

customElements.define("analysis-aggregate-group", AnalysisAggregateGroup);
