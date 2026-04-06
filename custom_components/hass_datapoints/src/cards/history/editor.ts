import { CSSResultGroup, html } from "lit";
import { msg } from "@/lib/i18n/localize";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsHistoryCardEditor extends EditorBase {
  static styles: CSSResultGroup = [EditorBase.styles, styles];

  render() {
    const c = this._config;
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
          .value=${String(c.hours_to_show ?? 24)}
          @dp-field-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("hours_to_show", e.detail.value)}
        ></editor-text-field>

        <section-heading .text=${msg("Entity")}></section-heading>
        <editor-entity-picker
          .label=${msg("Single entity")}
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

        <section-heading .text=${msg("Display")}></section-heading>
        <editor-switch
          .label=${msg("Show data gaps")}
          .checked=${c.show_data_gaps !== false}
          .tooltip=${msg(
            "Highlight missing data ranges with dashed lines and boundary markers",
            { id: "Highlight missing data ranges with dashed lines and boundary markers" }
          )}
          @dp-switch-change=${(e: CustomEvent<{ checked: boolean }>) =>
            this._set("show_data_gaps", e.detail.checked ? undefined : false)}
        ></editor-switch>
      </div>
    `;
  }
}
