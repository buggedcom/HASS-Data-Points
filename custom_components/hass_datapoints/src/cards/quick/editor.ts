import { CSSResultGroup, html } from "lit";
import { msg } from "@/lib/i18n/localize";
import { AMBER } from "@/constants";
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
          .label=${msg("Input placeholder text")}
          .value=${c.placeholder || ""}
          @dp-field-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("placeholder", e.detail.value)}
        ></editor-text-field>

        <section-heading .text=${msg("Icon & colour")}></section-heading>
        <editor-icon-picker
          .label=${msg("Icon")}
          .value=${c.icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("icon", e.detail.value)}
        ></editor-icon-picker>
        <color-swatch
          .label=${msg("Colour")}
          .color=${c.color || AMBER}
          @dp-color-change=${(e: CustomEvent<{ color: string }>) =>
            this._set("color", e.detail.color)}
        ></color-swatch>

        <section-heading .text=${msg("Related items")}></section-heading>
        <div class="note">
          ${msg(
            "These items will be linked to every record made with this card.",
            { id: "These items will be linked to every record made with this card." }
          )}
        </div>
        <editor-entity-picker
          .label=${msg("Single entity (optional)")}
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e: CustomEvent<{ value: string }>) =>
            this._set("entity", e.detail.value)}
        ></editor-entity-picker>
        <section-heading .text=${msg("Multiple entities")}></section-heading>
        <editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          .buttonLabel=${msg("Add related items")}
          @dp-entity-list-change=${(e: CustomEvent<{ entities: string[] }>) =>
            this._set(
              "entities",
              e.detail.entities.length ? e.detail.entities : undefined
            )}
        ></editor-entity-list>

        <section-heading .text=${msg("Form fields")}></section-heading>
        <editor-switch
          .label=${msg("Show annotation field")}
          .checked=${!!c.show_annotation}
          @dp-switch-change=${(e: CustomEvent<{ checked: boolean }>) =>
            this._set("show_annotation", e.detail.checked || undefined)}
        ></editor-switch>
      </div>
    `;
  }
}
