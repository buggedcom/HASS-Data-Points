import { html } from "lit";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsHistoryCardEditor extends EditorBase {
  static styles = [EditorBase.styles, styles];

  render() {
    const c = this._config;
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
          .value=${String(c.hours_to_show ?? 24)}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></editor-text-field>

        <section-heading text="Entity"></section-heading>
        <editor-entity-picker
          label="Single entity"
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

        <section-heading text="Display"></section-heading>
        <editor-switch
          label="Show data gaps"
          .checked=${c.show_data_gaps !== false}
          tooltip="Highlight missing data ranges with dashed lines and boundary markers"
          @dp-switch-change=${(e) =>
            this._set("show_data_gaps", e.detail.checked ? undefined : false)}
        ></editor-switch>
      </div>
    `;
  }
}
