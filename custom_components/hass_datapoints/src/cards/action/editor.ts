import { html } from "lit";
import { styles } from "./editor.styles";
import { EditorBase } from "@/molecules/editor-base/editor-base";
import "@/atoms/display/section-heading/section-heading";
import "@/atoms/display/color-swatch/color-swatch";
import "@/atoms/form/editor-text-field/editor-text-field";
import "@/atoms/form/editor-switch/editor-switch";
import "@/atoms/form/editor-icon-picker/editor-icon-picker";

export class HassRecordsActionCardEditor extends EditorBase {
  static styles = [EditorBase.styles, styles];

  _onTargetChanged(e) {
    const val = e.detail.value;
    const isEmpty = !val || Object.values(val).every((v) => !v?.length);
    this._set("target", isEmpty ? undefined : val);
  }

  firstUpdated() {
    const tp = this.shadowRoot.querySelector("#target-picker");
    if (tp && this.hass) {
      tp.hass = this.hass;
      tp.value = this._config.target ?? {};
    }
  }

  updated(changedProps) {
    if (changedProps.has("hass") && this.hass) {
      this.shadowRoot.querySelectorAll("ha-selector").forEach((el) => {
        el.hass = this.hass;
      });
    }
  }

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

        <section-heading text="Related items"></section-heading>
        <div class="note">
          Pre-fill entities, devices, areas or labels that are always linked to
          recordings from this card.
        </div>
        <ha-selector
          id="target-picker"
          .selector=${{ target: {} }}
          @value-changed=${this._onTargetChanged}
          style="display:block;width:100%"
        ></ha-selector>
        <editor-switch
          label="Show always included targets on card"
          .checked=${c.show_config_targets !== false}
          @dp-switch-change=${(e) =>
            this._set(
              "show_config_targets",
              e.detail.checked ? undefined : false
            )}
        ></editor-switch>
        <editor-switch
          label="Allow user to add more related items"
          .checked=${c.show_target_picker !== false}
          @dp-switch-change=${(e) =>
            this._set(
              "show_target_picker",
              e.detail.checked ? undefined : false
            )}
        ></editor-switch>

        <section-heading text="Datapoint Appearance"></section-heading>
        <editor-icon-picker
          label="Default icon"
          .value=${c.default_icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e) => this._set("default_icon", e.detail.value)}
        ></editor-icon-picker>
        <color-swatch
          label="Default colour"
          .color=${c.default_color || "#03a9f4"}
          @dp-color-change=${(e) => this._set("default_color", e.detail.color)}
        ></color-swatch>

        <section-heading text="Form fields"></section-heading>
        <editor-switch
          label="Show date & time field"
          .checked=${c.show_date !== false}
          @dp-switch-change=${(e) =>
            this._set("show_date", e.detail.checked ? undefined : false)}
        ></editor-switch>
        <editor-switch
          label="Show annotation field"
          .checked=${c.show_annotation !== false}
          @dp-switch-change=${(e) =>
            this._set("show_annotation", e.detail.checked ? undefined : false)}
        ></editor-switch>
      </div>
    `;
  }
}
