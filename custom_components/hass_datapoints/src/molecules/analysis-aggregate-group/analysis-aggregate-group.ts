import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";

import { AnalysisGroupMixin } from "../analysis-group-shared/analysis-group.mixin";
import { sharedStyles } from "../analysis-group-shared/analysis-group-shared.styles";
import { styles } from "./analysis-aggregate-group.styles";
import {
  AGGREGATE_INTERVAL_OPTIONS,
  BINARY_AGGREGATE_KINDS,
  type BinaryAggregateKind,
  applyBinaryAggregateKind,
  MEASUREMENT_OPERATIONS,
  createBinaryAggregate,
  createMeasurementAggregate,
  getBinaryAggregateKind,
  getBinaryStateOptions,
} from "@/lib/domain/aggregation/labels";
import type {
  AggregateDefinition,
  AggregateInterval,
  AggregateOperation,
} from "@/lib/domain/aggregation/types";
import "@/atoms/form/inline-select/inline-select";

/**
 * Add, edit and remove aggregate series definitions for a binary row.
 * @fires dp-group-analysis-change - `{ entityId, key: "aggregates", value: AggregateDefinition[] }` — the full next list of definitions
 */
@localized()
export class AnalysisAggregateGroup extends AnalysisGroupMixin(LitElement) {
  /** HA device class of the source entity; selects Open/Closed style labels. */
  @property({ type: String, attribute: "device-class" })
  accessor deviceClass: string = "";

  /** `binary` offers state operations; `measurement` offers numeric summaries. */
  @property({ type: String })
  accessor variant: "binary" | "measurement" = "binary";

  /** Measurement operations suggested for the entity; the user still chooses. */
  @property({ type: Array, attribute: false })
  accessor operations: AggregateOperation[] = [];

  static styles = [sharedStyles, styles];

  private get _definitions(): AggregateDefinition[] {
    return this.analysis.aggregates ?? [];
  }

  private _commit(next: AggregateDefinition[]) {
    this._emit("aggregates", next);
  }

  private _update(
    id: string,
    patch: (d: AggregateDefinition) => AggregateDefinition
  ) {
    this._commit(this._definitions.map((d) => (d.id === id ? patch(d) : d)));
  }

  private _onAdd() {
    if (this.variant === "measurement") {
      const ids = this._definitions.map((d) => d.id);
      this._commit([
        ...this._definitions,
        createMeasurementAggregate(ids, this.operations[0] ?? "mean"),
      ]);
      return;
    }
    const defaultState = getBinaryStateOptions(this.deviceClass)[0].value;
    this._commit([
      ...this._definitions,
      createBinaryAggregate(
        this._definitions.map((d) => d.id),
        defaultState
      ),
    ]);
  }

  private _onRemove(id: string) {
    this._commit(this._definitions.filter((d) => d.id !== id));
  }

  private _selectValue(e: Event): string {
    return (e as CustomEvent<{ type: "select"; value: string }>).detail.value;
  }

  private _renderMeasurementDefinition(definition: AggregateDefinition) {
    const available = MEASUREMENT_OPERATIONS.filter(
      (o) =>
        this.operations.includes(o.value) || o.value === definition.operation
    );
    return html`
      <div
        class="definition"
        role="group"
        aria-label=${msg("Aggregate series")}
      >
        <inline-select
          .value=${definition.operation}
          .options=${this._localizedOptions(available)}
          aria-label=${msg("Aggregate operation")}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              operation: this._selectValue(e) as AggregateOperation,
            }))}
        ></inline-select>
        <inline-select
          .value=${definition.interval}
          .options=${this._localizedOptions(AGGREGATE_INTERVAL_OPTIONS)}
          aria-label=${msg("Aggregate interval")}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              interval: this._selectValue(e) as AggregateInterval,
            }))}
        ></inline-select>
        <button
          type="button"
          class="button remove"
          aria-label=${msg("Remove aggregate")}
          @click=${() => this._onRemove(definition.id)}
        >
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </div>
    `;
  }

  private _renderDefinition(definition: AggregateDefinition) {
    if (this.variant === "measurement") {
      return this._renderMeasurementDefinition(definition);
    }
    const kind = getBinaryAggregateKind(definition);
    const stateOptions = getBinaryStateOptions(this.deviceClass).map((o) => ({
      value: o.value,
      label: msg(o.label),
    }));
    const showState = kind !== "all_changes";
    return html`
      <div
        class="definition"
        role="group"
        aria-label=${msg("Aggregate series")}
      >
        <inline-select
          .value=${kind}
          .options=${this._localizedOptions(BINARY_AGGREGATE_KINDS)}
          aria-label=${msg("Aggregate operation")}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) =>
              applyBinaryAggregateKind(
                d,
                this._selectValue(e) as BinaryAggregateKind,
                stateOptions[0].value
              )
            )}
        ></inline-select>
        ${showState
          ? html`<inline-select
              .value=${definition.states?.[0] ?? stateOptions[0].value}
              .options=${stateOptions}
              aria-label=${msg("Aggregate state")}
              @dp-change=${(e: Event) =>
                this._update(definition.id, (d) => ({
                  ...d,
                  states: [this._selectValue(e)],
                }))}
            ></inline-select>`
          : nothing}
        <inline-select
          .value=${definition.interval}
          .options=${this._localizedOptions(AGGREGATE_INTERVAL_OPTIONS)}
          aria-label=${msg("Aggregate interval")}
          @dp-change=${(e: Event) =>
            this._update(definition.id, (d) => ({
              ...d,
              interval: this._selectValue(e) as AggregateInterval,
            }))}
        ></inline-select>
        <button
          type="button"
          class="button remove"
          aria-label=${msg("Remove aggregate")}
          @click=${() => this._onRemove(definition.id)}
        >
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="heading">${msg("Aggregate series")}</div>
      <div class="list">
        ${this._definitions.map((d) => this._renderDefinition(d))}
      </div>
      <button type="button" class="button add" @click=${this._onAdd}>
        <ha-icon icon="mdi:plus"></ha-icon>
        ${msg("Add aggregate")}
      </button>
    `;
  }
}

customElements.define("analysis-aggregate-group", AnalysisAggregateGroup);
