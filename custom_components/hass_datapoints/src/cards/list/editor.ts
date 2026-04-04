import { html } from "lit";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsListCardEditor extends EditorBase {
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
          label="Hours to show (blank = all time)"
          type="number"
          .value=${c.hours_to_show != null ? String(c.hours_to_show) : ""}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></editor-text-field>
        <editor-text-field
          label="Records per page"
          type="number"
          .value=${String(c.page_size ?? 15)}
          @dp-field-change=${(e) => this._set("page_size", e.detail.value)}
        ></editor-text-field>

        <section-heading text="Filtering"></section-heading>
        <editor-text-field
          label="Default message filter (always applied)"
          .value=${c.message_filter || ""}
          @dp-field-change=${(e) => this._set("message_filter", e.detail.value)}
        ></editor-text-field>

        <section-heading text="Visibility"></section-heading>
        <editor-switch
          label="Show search bar"
          .checked=${c.show_search !== false}
          @dp-switch-change=${(e) =>
            this._set("show_search", e.detail.checked ? undefined : false)}
        ></editor-switch>
        <editor-switch
          label="Show related entities"
          .checked=${c.show_entities !== false}
          @dp-switch-change=${(e) =>
            this._set("show_entities", e.detail.checked ? undefined : false)}
        ></editor-switch>
        <editor-switch
          label="Show edit & delete actions"
          .checked=${c.show_actions !== false}
          @dp-switch-change=${(e) =>
            this._set("show_actions", e.detail.checked ? undefined : false)}
        ></editor-switch>
        <editor-switch
          label="Show full message"
          .checked=${c.show_full_message !== false}
          tooltip="User will be able to expand the row if hidden"
          @dp-switch-change=${(e) =>
            this._set(
              "show_full_message",
              e.detail.checked ? undefined : false
            )}
        ></editor-switch>

        <section-heading text="Filter by entity"></section-heading>
        <editor-entity-picker
          label="Single entity (optional)"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></editor-entity-picker>

        <section-heading text="Multiple entity filter"></section-heading>
        <editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          button-label="Add default related items"
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
