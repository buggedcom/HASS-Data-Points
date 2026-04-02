import { LitElement, html, css } from "lit";
import { DOMAIN } from "@/lib/shared";
import type { ChipItem, HassLike, CardConfig } from "@/lib/types";
import "@/molecules/dp-chip-group/dp-chip-group";
import "@/atoms/display/dp-color-swatch/dp-color-swatch";
import { logger } from "@/lib/logger.js";

type TargetMap = {
  entity_id: string[];
  device_id: string[];
  area_id: string[];
  label_id: string[];
};

/**
 * hass-datapoints-action-card – Full form to record a custom event.
 *
 * Related items UI:
 *   - Config-set targets rendered as non-removable dp-chip-group chips.
 *   - A ha-selector (target schema) lets the user add extra items per recording.
 *   - On submit both are merged; the selector resets to empty afterwards.
 */
export class HassRecordsActionCard extends LitElement {
  static properties = {
    _config: { state: true },
    _hass: { state: true },
    _color: { state: true },
    _feedbackClass: { state: true },
    _feedbackText: { state: true },
    _feedbackVisible: { state: true },
  };

  declare _config: CardConfig;

  declare _hass: HassLike | null;

  declare _color: string;

  declare _feedbackClass: string;

  declare _feedbackText: string;

  declare _feedbackVisible: boolean;

  private _userTarget: Partial<TargetMap> = {};

  static styles = css`
    :host { display: block; }
    ha-card { padding: 16px; }
    .card-header {
      font-size: 1.1em;
      font-weight: 500;
      margin-bottom: 16px;
      color: var(--primary-text-color);
    }
    .form-group { margin-bottom: 12px; }
    .row { display: flex; gap: 10px; align-items: flex-end; }
    .row .form-group { flex: 1; min-width: 0; }
    .color-col {
      max-width: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    ha-textfield { display: block; width: 100%; }
    ha-icon-picker { display: block; width: 100%; }
    .field-label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.84rem;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .annotation-input {
      display: block;
      width: 100%;
      min-height: 104px;
      resize: vertical;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
      border-radius: 12px;
      background: var(--card-background-color, var(--primary-background-color, #fff));
      color: var(--primary-text-color);
      font: inherit;
      line-height: 1.45;
    }
    .annotation-input::placeholder { color: var(--secondary-text-color); }
    .annotation-input:focus {
      outline: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 40%, transparent);
      outline-offset: 1px;
    }
    ha-button {
      display: block;
      margin-top: 8px;
      --mdc-theme-primary: var(--primary-color);
    }
    .feedback {
      font-size: 0.82em;
      margin-top: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      display: none;
    }
    .feedback.visible { display: block; }
    .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
    .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
  `;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._color = "#03a9f4";
    this._feedbackClass = "";
    this._feedbackText = "";
    this._feedbackVisible = false;
  }

  setConfig(config: CardConfig) {
    this._config = config || {};
    this._color = (config?.default_color as string) || "#03a9f4";
  }

  set hass(hass: HassLike) {
    this._hass = hass;
  }

  private _nowStr(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private _configTarget(): TargetMap {
    const cfg = this._config;
    const norm = (v: unknown): string[] =>
      !v ? [] : Array.isArray(v) ? (v as string[]) : [v as string];
    let raw: Record<string, unknown> | undefined;
    if (cfg.target) raw = cfg.target as Record<string, unknown>;
    else if (cfg.entity) raw = { entity_id: [cfg.entity] };
    else if ((cfg.entities as string[])?.length) raw = { entity_id: cfg.entities };
    else return { entity_id: [], device_id: [], area_id: [], label_id: [] };
    return {
      entity_id: norm(raw.entity_id),
      device_id: norm(raw.device_id),
      area_id: norm(raw.area_id),
      label_id: norm(raw.label_id),
    };
  }

  private _configChipItems(): ChipItem[] {
    const t = this._configTarget();
    const items: ChipItem[] = [];
    t.entity_id.forEach((id) => items.push({ type: "entity", id }));
    t.device_id.forEach((id) => items.push({ type: "device", id }));
    t.area_id.forEach((id) => items.push({ type: "area", id }));
    t.label_id.forEach((id) => items.push({ type: "label", id }));
    return items;
  }

  private _mergeTargets(a: TargetMap, b: Partial<TargetMap>): TargetMap {
    const norm = (v: unknown): string[] =>
      !v ? [] : Array.isArray(v) ? (v as string[]) : [v as string];
    const merge = (x: unknown, y: unknown) => [...new Set([...norm(x), ...norm(y)])];
    return {
      entity_id: merge(a.entity_id, b.entity_id),
      device_id: merge(a.device_id, b.device_id),
      area_id: merge(a.area_id, b.area_id),
      label_id: merge(a.label_id, b.label_id),
    };
  }

  async _record() {
    const msgEl = this.shadowRoot!.querySelector<HTMLElement & { value: string }>("#msg");
    const message = (msgEl?.value || "").trim();
    if (!message) {
      msgEl?.focus();
      return;
    }

    const btn = this.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>("#btn");
    if (btn) btn.disabled = true;

    const data: Record<string, unknown> = { message };

    const annEl = this.shadowRoot!.querySelector<HTMLTextAreaElement>("#ann");
    const ann = (annEl?.value || "").trim();
    if (ann) data.annotation = ann;

    const iconPicker = this.shadowRoot!.querySelector<HTMLElement & { value: string }>("#icon-picker");
    const icon = iconPicker?.value;
    if (icon) data.icon = icon;

    data.color = this._color;

    const dateEl = this.shadowRoot!.querySelector<HTMLElement & { value: string }>("#date");
    const dateVal = (dateEl?.value || "").trim();
    if (dateVal) data.date = dateVal;

    const merged = this._mergeTargets(this._configTarget(), this._userTarget);
    if (merged.entity_id.length) data.entity_ids = merged.entity_id;
    if (merged.device_id.length) data.device_ids = merged.device_id;
    if (merged.area_id.length) data.area_ids = merged.area_id;
    if (merged.label_id.length) data.label_ids = merged.label_id;

    try {
      await this._hass!.callService(DOMAIN, "record", data);
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      this.dispatchEvent(
        new CustomEvent("hass-datapoints-action-recorded", {
          bubbles: true,
          composed: true,
          detail: { ...data },
        }),
      );
      if (msgEl) msgEl.value = "";
      if (annEl) annEl.value = "";
      if (dateEl) dateEl.value = (this._config.default_date as string) || this._nowStr();
      this._userTarget = {};
      const targetSel = this.shadowRoot!.querySelector<HTMLElement & { value: unknown }>("#target-sel");
      if (targetSel) targetSel.value = {};
      this._feedbackClass = "ok";
      this._feedbackText = "Event recorded!";
      this._feedbackVisible = true;
      setTimeout(() => (this._feedbackVisible = false), 3000);
    } catch (e: unknown) {
      const err = e as Error;
      this._feedbackClass = "err";
      this._feedbackText = `Error: ${err.message || "unknown error"}`;
      this._feedbackVisible = true;
       
      logger.error("[hass-datapoints action-card]", e);
    }

    if (btn) btn.disabled = false;
  }

  private _onColorChange(e: CustomEvent<{ color: string }>) {
    this._color = e.detail.color;
  }

  private _onTargetChanged(e: CustomEvent<{ value: Partial<TargetMap> }>) {
    this._userTarget = e.detail.value || {};
  }

  private _onAnnKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this._record();
    }
  }

  render() {
    const cfg = this._config;
    const hasTitle = !!cfg.title;
    const showDate = cfg.show_date !== false;
    const showAnnotation = cfg.show_annotation !== false;
    const showConfigTargets = cfg.show_config_targets !== false;
    const showTargetPicker = cfg.show_target_picker !== false;
    const configChips = this._configChipItems();
    const hasChips = configChips.length > 0;

    return html`
      <ha-card>
        ${hasTitle ? html`<div class="card-header">${cfg.title}</div>` : ""}

        <div class="form-group">
          <ha-textfield
            id="msg"
            label="Message *"
            placeholder="What happened?"
            style="width:100%"
          ></ha-textfield>
        </div>

        ${showAnnotation
          ? html`
              <div class="form-group">
                <label class="field-label" for="ann">Annotation</label>
                <textarea
                  id="ann"
                  class="annotation-input"
                  placeholder="Detailed note shown on chart hover…"
                  @keydown=${this._onAnnKeydown}
                ></textarea>
              </div>
            `
          : ""}

        ${showDate
          ? html`
              <div class="form-group">
                <ha-textfield
                  id="date"
                  label="Date & Time"
                  type="datetime-local"
                  .value=${(cfg.default_date as string) || this._nowStr()}
                  style="width:100%"
                ></ha-textfield>
              </div>
            `
          : ""}

        <div class="row">
          <div class="form-group">
            <ha-icon-picker
              id="icon-picker"
              label="Icon"
              .value=${(cfg.default_icon as string) || "mdi:bookmark"}
              .hass=${this._hass}
            ></ha-icon-picker>
          </div>
          <div class="form-group color-col">
            <dp-color-swatch
              .color=${this._color}
              @dp-color-change=${this._onColorChange}
            ></dp-color-swatch>
          </div>
        </div>

        <div class="form-group" id="target-wrap">
          ${showConfigTargets && hasChips
            ? html`
                <dp-chip-group
                  .items=${configChips}
                  .hass=${this._hass}
                  .removable=${false}
                  label="Data point will be associated with"
                ></dp-chip-group>
              `
            : ""}
          ${showTargetPicker
            ? html`
                <ha-selector
                  id="target-sel"
                  .selector=${{ target: {} }}
                  .hass=${this._hass}
                  .value=${{}}
                  @value-changed=${this._onTargetChanged}
                ></ha-selector>
              `
            : ""}
        </div>

        <ha-button id="btn" raised @click=${this._record}>
          ${cfg.submit_label || "Record Event"}
        </ha-button>

        <div
          class="feedback ${this._feedbackClass} ${this._feedbackVisible ? "visible" : ""}"
        >
          ${this._feedbackText}
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-action-card-editor");
  }

  static getStubConfig() {
    return { title: "Record Event" };
  }

  getGridOptions() {
    const hasAnnotation = this._config?.show_annotation !== false;
    return {
      rows: hasAnnotation ? 10 : 7,
      min_rows: hasAnnotation ? 10 : 7,
      max_rows: hasAnnotation ? 10 : 7,
    };
  }

  getCardSize() {
    return this._config?.show_annotation !== false ? 10 : 7;
  }
}
