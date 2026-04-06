import { CSSResultGroup, html } from "lit";
import { msg } from "@/lib/i18n/localize";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-select/editor-select";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsStatisticsCardEditor extends EditorBase {
  static styles: CSSResultGroup = [EditorBase.styles, styles];

  _onStatTypeChange(statType: string, checked: boolean): void {
    const current = Array.isArray(this._config.stat_types)
      ? [...(this._config.stat_types as string[])]
      : ["mean"];
    if (checked) {
      if (!current.includes(statType)) {
        current.push(statType);
      }
    } else {
      const index = current.indexOf(statType);
      if (index !== -1) {
        current.splice(index, 1);
      }
    }
    this._set("stat_types", current.length ? current : ["mean"]);
  }

  render() {
    const c = this._config;
    const statTypes = Array.isArray(c.stat_types)
      ? (c.stat_types as string[])
      : ["mean"];

    return html`
      <div class="ed">
        <section-heading .text=${msg("General")}></section-heading>
        <editor-text-field
          .label=${msg("Card title (optional)")}
          .value=${c.title || ""}
          @dp-field-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("title", e.detail.value)}
        ></editor-text-field>
        <editor-text-field
          .label=${msg("Hours to show")}
          type="number"
          .value=${String(c.hours_to_show ?? 168)}
          @dp-field-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("hours_to_show", e.detail.value)}
        ></editor-text-field>

        <section-heading .text=${msg("Period")}></section-heading>
        <editor-select
          .label=${msg("Period")}
          .value=${c.period || "hour"}
          .options=${[
            { value: "5minute", label: msg("5 minutes") },
            { value: "hour", label: msg("Hour") },
            { value: "day", label: msg("Day") },
            { value: "week", label: msg("Week") },
            { value: "month", label: msg("Month") },
          ]}
          @dp-select-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("period", e.detail.value)}
        ></editor-select>

        <section-heading .text=${msg("Stat types")}></section-heading>
        ${["mean", "min", "max", "sum", "state"].map(
          (statType: string) => html`
            <editor-switch
              label=${statType}
              .checked=${statTypes.includes(statType)}
              @dp-switch-change=${(e: CustomEvent<{ checked: boolean }>) =>
                this._onStatTypeChange(statType, e.detail.checked)}
            ></editor-switch>
          `
        )}

        <section-heading .text=${msg("Entity / statistic ID")}></section-heading>
        <editor-entity-picker
          .label=${msg("Single entity / statistic ID")}
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("entity", e.detail.value)}
        ></editor-entity-picker>

        <section-heading .text=${msg("Multiple entities")}></section-heading>
        <editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e: CustomEvent<{ entities: string[] }>) =>
            this._set(
              "entities",
              e.detail.entities.length ? e.detail.entities : undefined
            )}
        ></editor-entity-list>
      </div>
    `;
  }
}
