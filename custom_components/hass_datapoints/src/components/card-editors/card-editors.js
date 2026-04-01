import { html, css } from "lit";
import { AMBER, COLORS } from "@/lib/shared";
import { DpEditorBase } from "@/molecules/dp-editor-base/dp-editor-base";
import "@/atoms/display/dp-section-heading/dp-section-heading";
import "@/atoms/display/dp-color-swatch/dp-color-swatch";
import "@/atoms/form/dp-editor-text-field/dp-editor-text-field";
import "@/atoms/form/dp-editor-switch/dp-editor-switch";
import "@/atoms/form/dp-editor-entity-picker/dp-editor-entity-picker";
import "@/atoms/form/dp-editor-icon-picker/dp-editor-icon-picker";
import "@/atoms/form/dp-editor-select/dp-editor-select";
import "@/atoms/form/dp-editor-entity-list/dp-editor-entity-list";

/**
 * Lovelace card editors for all Hass Records cards.
 *
 * HA contract:
 *   - HA calls  el.setConfig(config)  then sets  el.hass = hass
 *   - Editor must fire CustomEvent("config-changed", { detail: { config } })
 *     bubbles:true, composed:true whenever the user changes anything.
 */

// ---------------------------------------------------------------------------
// Shared editor styles
// ---------------------------------------------------------------------------
const editorStyles = css`
  .note {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
  }
`;

// ---------------------------------------------------------------------------
// 1. Action Card editor
// ---------------------------------------------------------------------------
export class HassRecordsActionCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

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
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Related items"></dp-section-heading>
        <div class="note">Pre-fill entities, devices, areas or labels that are always linked to recordings from this card.</div>
        <ha-selector
          id="target-picker"
          .selector=${{ target: {} }}
          @value-changed=${this._onTargetChanged}
          style="display:block;width:100%"
        ></ha-selector>
        <dp-editor-switch
          label="Show always included targets on card"
          .checked=${c.show_config_targets !== false}
          @dp-switch-change=${(e) => this._set("show_config_targets", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Allow user to add more related items"
          .checked=${c.show_target_picker !== false}
          @dp-switch-change=${(e) => this._set("show_target_picker", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>

        <dp-section-heading text="Datapoint Appearance"></dp-section-heading>
        <dp-editor-icon-picker
          label="Default icon"
          .value=${c.default_icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e) => this._set("default_icon", e.detail.value)}
        ></dp-editor-icon-picker>
        <dp-color-swatch
          label="Default colour"
          .color=${c.default_color || "#03a9f4"}
          @dp-color-change=${(e) => this._set("default_color", e.detail.color)}
        ></dp-color-swatch>

        <dp-section-heading text="Form fields"></dp-section-heading>
        <dp-editor-switch
          label="Show date & time field"
          .checked=${c.show_date !== false}
          @dp-switch-change=${(e) => this._set("show_date", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show annotation field"
          .checked=${c.show_annotation !== false}
          @dp-switch-change=${(e) => this._set("show_annotation", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// 2. Quick Card editor
// ---------------------------------------------------------------------------
export class HassRecordsQuickCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

  render() {
    const c = this._config;
    return html`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Input placeholder text"
          .value=${c.placeholder || ""}
          @dp-field-change=${(e) => this._set("placeholder", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Icon & colour"></dp-section-heading>
        <dp-editor-icon-picker
          label="Icon"
          .value=${c.icon || "mdi:bookmark"}
          .hass=${this.hass}
          @dp-icon-change=${(e) => this._set("icon", e.detail.value)}
        ></dp-editor-icon-picker>
        <dp-color-swatch
          label="Colour"
          .color=${c.color || AMBER}
          @dp-color-change=${(e) => this._set("color", e.detail.color)}
        ></dp-color-swatch>

        <dp-section-heading text="Related items"></dp-section-heading>
        <div class="note">These items will be linked to every record made with this card.</div>
        <dp-editor-entity-picker
          label="Single entity (optional)"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></dp-editor-entity-picker>
        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          button-label="Add related items"
          @dp-entity-list-change=${(e) => this._set("entities", e.detail.entities.length ? e.detail.entities : undefined)}
        ></dp-editor-entity-list>

        <dp-section-heading text="Form fields"></dp-section-heading>
        <dp-editor-switch
          label="Show annotation field"
          .checked=${!!c.show_annotation}
          @dp-switch-change=${(e) => this._set("show_annotation", e.detail.checked || undefined)}
        ></dp-editor-switch>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// 3. History Card editor
// ---------------------------------------------------------------------------
export class HassRecordsHistoryCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

  render() {
    const c = this._config;
    return html`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c.hours_to_show ?? 24)}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e) => this._set("entities", e.detail.entities.length ? e.detail.entities : undefined)}
        ></dp-editor-entity-list>

        <dp-section-heading text="Display"></dp-section-heading>
        <dp-editor-switch
          label="Show data gaps"
          .checked=${c.show_data_gaps !== false}
          tooltip="Highlight missing data ranges with dashed lines and boundary markers"
          @dp-switch-change=${(e) => this._set("show_data_gaps", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// 4. Statistics Card editor
// ---------------------------------------------------------------------------
export class HassRecordsStatisticsCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

  _onStatTypeChange(st, checked) {
    const cur = [...(this._config.stat_types || ["mean"])];
    if (checked) {
      if (!cur.includes(st)) cur.push(st);
    } else {
      const i = cur.indexOf(st);
      if (i !== -1) cur.splice(i, 1);
    }
    this._set("stat_types", cur.length ? cur : ["mean"]);
  }

  render() {
    const c = this._config;
    const statTypes = c.stat_types || ["mean"];

    return html`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c.hours_to_show ?? 168)}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Period"></dp-section-heading>
        <dp-editor-select
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
        ></dp-editor-select>

        <dp-section-heading text="Stat types"></dp-section-heading>
        ${["mean", "min", "max", "sum", "state"].map(
          (st) => html`
            <dp-editor-switch
              label=${st}
              .checked=${statTypes.includes(st)}
              @dp-switch-change=${(e) => this._onStatTypeChange(st, e.detail.checked)}
            ></dp-editor-switch>
          `,
        )}

        <dp-section-heading text="Entity / statistic ID"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity / statistic ID"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entities"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          @dp-entity-list-change=${(e) => this._set("entities", e.detail.entities.length ? e.detail.entities : undefined)}
        ></dp-editor-entity-list>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// 5. Sensor Card editor
// ---------------------------------------------------------------------------
export class HassRecordsSensorCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

  render() {
    const c = this._config;
    const showRecords = !!c.show_records;

    return html`
      <div class="ed">
        <dp-section-heading text="Entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Sensor entity *"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Display"></dp-section-heading>
        <dp-editor-text-field
          label="Override display name (optional)"
          .value=${c.name || ""}
          @dp-field-change=${(e) => this._set("name", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show"
          type="number"
          .value=${String(c.hours_to_show ?? 24)}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></dp-editor-text-field>
        <dp-color-swatch
          label="Graph colour"
          .color=${c.graph_color || COLORS[0]}
          @dp-color-change=${(e) => this._set("graph_color", e.detail.color)}
        ></dp-color-swatch>
        <dp-editor-select
          label="Annotation style"
          .value=${c.annotation_style || ""}
          .options=${[
            { value: "circle", label: "Circle on line" },
            { value: "line", label: "Dotted vertical line" },
          ]}
          @dp-select-change=${(e) => this._set("annotation_style", e.detail.value)}
        ></dp-editor-select>

        <dp-section-heading text="Records list"></dp-section-heading>
        <dp-editor-switch
          label="Show records list below graph"
          .checked=${showRecords}
          @dp-switch-change=${(e) => this._set("show_records", e.detail.checked || undefined)}
        ></dp-editor-switch>
        <dp-editor-text-field
          label="Records per page (blank = show all)"
          type="number"
          .value=${c.records_page_size != null ? String(c.records_page_size) : ""}
          @dp-field-change=${(e) => this._set("records_page_size", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Max records to show (blank = all)"
          type="number"
          .value=${c.records_limit != null ? String(c.records_limit) : ""}
          @dp-field-change=${(e) => this._set("records_limit", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-switch
          label="Show full message"
          .checked=${c.records_show_full_message !== false}
          tooltip="User will be able to expand the row if hidden"
          @dp-switch-change=${(e) => this._set("records_show_full_message", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// 6. List Card editor
// ---------------------------------------------------------------------------
export class HassRecordsListCardEditor extends DpEditorBase {
  static styles = [DpEditorBase.styles, editorStyles];

  render() {
    const c = this._config;
    return html`
      <div class="ed">
        <dp-section-heading text="General"></dp-section-heading>
        <dp-editor-text-field
          label="Card title (optional)"
          .value=${c.title || ""}
          @dp-field-change=${(e) => this._set("title", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Hours to show (blank = all time)"
          type="number"
          .value=${c.hours_to_show != null ? String(c.hours_to_show) : ""}
          @dp-field-change=${(e) => this._set("hours_to_show", e.detail.value)}
        ></dp-editor-text-field>
        <dp-editor-text-field
          label="Records per page"
          type="number"
          .value=${String(c.page_size ?? 15)}
          @dp-field-change=${(e) => this._set("page_size", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Filtering"></dp-section-heading>
        <dp-editor-text-field
          label="Default message filter (always applied)"
          .value=${c.message_filter || ""}
          @dp-field-change=${(e) => this._set("message_filter", e.detail.value)}
        ></dp-editor-text-field>

        <dp-section-heading text="Visibility"></dp-section-heading>
        <dp-editor-switch
          label="Show search bar"
          .checked=${c.show_search !== false}
          @dp-switch-change=${(e) => this._set("show_search", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show related entities"
          .checked=${c.show_entities !== false}
          @dp-switch-change=${(e) => this._set("show_entities", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show edit & delete actions"
          .checked=${c.show_actions !== false}
          @dp-switch-change=${(e) => this._set("show_actions", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>
        <dp-editor-switch
          label="Show full message"
          .checked=${c.show_full_message !== false}
          tooltip="User will be able to expand the row if hidden"
          @dp-switch-change=${(e) => this._set("show_full_message", e.detail.checked ? undefined : false)}
        ></dp-editor-switch>

        <dp-section-heading text="Filter by entity"></dp-section-heading>
        <dp-editor-entity-picker
          label="Single entity (optional)"
          .value=${c.entity || ""}
          .hass=${this.hass}
          @dp-entity-change=${(e) => this._set("entity", e.detail.value)}
        ></dp-editor-entity-picker>

        <dp-section-heading text="Multiple entity filter"></dp-section-heading>
        <dp-editor-entity-list
          .entities=${c.entities || []}
          .hass=${this.hass}
          button-label="Add default related items"
          @dp-entity-list-change=${(e) => this._set("entities", e.detail.entities.length ? e.detail.entities : undefined)}
        ></dp-editor-entity-list>
      </div>
    `;
  }
}
