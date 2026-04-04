import { html } from "lit";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-select/editor-select";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsStatisticsCardEditor extends EditorBase {
  static styles = [EditorBase.styles, styles];

  _onStatTypeChange(st, checked) {
    const cur = [...(this._config.stat_types || ["mean"])];
    if (checked) {
      if (!cur.includes(st)) {
        cur.push(st);
      }
    } else {
      const i = cur.indexOf(st);
      if (i !== -1) {
        cur.splice(i, 1);
      }
    }
    this._set("stat_types", cur.length ? cur : ["mean"]);
  }

  render() {
    const c = this._config;
    const statTypes = c.stat_types || ["mean"];

    return html`
      <div class="ed">
        <section-heading text="General"></section-heading>
        <editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></editor-text-field>
        <editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c.hours_to_show ?? 168)}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></editor-text-field>

        <section-heading text="Period"></section-heading>
        <editor-select
          label="Period"
          .value=${c.period || "hour"}
          .options=${[
            { value: "5minute", label: "5 minutes" },
            { value: "hour", label: "Hour" },
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
          @dp-select-change=${(e) => this._set("period", e.detail.value)}
        ></editor-select>

        <section-heading text="Stat types"></section-heading>
        ${["mean", "min", "max", "sum", "state"].map(
          (st) => html`
            <editor-switch
              label=${st}
              .checked=${statTypes.includes(st)}
              @dp-switch-change=${(e) =>
                this._onStatTypeChange(st, e.detail.checked)}
            ></editor-switch>
          `
        )}

        <section-heading text="Entity / statistic ID"></section-heading>
        <editor-entity-picker
          label="Single entity / statistic ID"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></editor-entity-picker>

        <section-heading text="Multiple entities"></section-heading>
        <editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e) =>
            this._set(
              "entities",
              e.detail.entities.length ? e.detail.entities : undefined
            )}
        ></editor-entity-list>
      </div>
    `;
  }
}
