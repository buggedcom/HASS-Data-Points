import { html } from "lit";
import { AMBER } from "@/constants.js";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import { styles } from "./editor.styles";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/display/color-swatch/color-swatch";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-entity-picker/editor-entity-picker";
import "@/atoms/form/editor-icon-picker/editor-icon-picker";
import "@/atoms/form/editor-entity-list/editor-entity-list";

export class HassRecordsQuickCardEditor extends EditorBase {
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
          label="Input placeholder text"
          .value=${c.placeholder || ""}
          @dp-field-change=${(e) => this._set("placeholder", e.detail.value)}
        ></editor-text-field>

        <section-heading text="Icon & colour"></section-heading>
        <editor-icon-picker
          label="Icon"
          .value=${c.icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e) => this._set("icon", e.detail.value)}
        ></editor-icon-picker>
        <color-swatch
          label="Colour"
          .color=${c.color || AMBER}
          @dp-color-change=${(e) => this._set("color", e.detail.color)}
        ></color-swatch>

        <section-heading text="Related items"></section-heading>
        <div class="note">
          These items will be linked to every record made with this card.
        </div>
        <editor-entity-picker
          label="Single entity (optional)"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></editor-entity-picker>
        <section-heading text="Multiple entities"></section-heading>
        <editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          button-label="Add related items"
          @dp-entity-list-change=${(e) =>
            this._set(
              "entities",
              e.detail.entities.length ? e.detail.entities : undefined
            )}
        ></editor-entity-list>

        <section-heading text="Form fields"></section-heading>
        <editor-switch
          label="Show annotation field"
          .checked=${!!c.show_annotation}
          @dp-switch-change=${(e) =>
            this._set("show_annotation", e.detail.checked || undefined)}
        ></editor-switch>
      </div>
    `;
  }
}
