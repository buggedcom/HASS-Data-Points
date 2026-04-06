import { LitElement, html } from "lit";
import { styles } from "./quick.styles";
import { AMBER, DOMAIN } from "@/constants";
import { logger } from "@/lib/logger";
import type { HassLike } from "@/lib/types";
import "@/atoms/display/feedback-banner/feedback-banner";
import "@/cards/quick/quick-annotation/quick-annotation";

export class HassRecordsQuickCard extends LitElement {
  static properties = {
    _config: { type: Object, state: true },
    _hass: { type: Object, state: true },
    _feedbackClass: { type: String, state: true },
    _feedbackText: { type: String, state: true },
    _feedbackVisible: { type: Boolean, state: true },
    _annotation: { type: String, state: true },
  };

  static styles = styles;

  declare _config: RecordWithUnknownValues;

  declare _hass: Nullable<HassLike>;

  declare _feedbackClass: string;

  declare _feedbackText: string;

  declare _feedbackVisible: boolean;

  declare _annotation: string;

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._feedbackClass = "";
    this._feedbackText = "";
    this._feedbackVisible = false;
    this._annotation = "";
  }

  setConfig(config: RecordWithUnknownValues) {
    this._config = config || {};
  }

  set hass(hass: HassLike) {
    this._hass = hass;
  }

  get hass(): Nullable<HassLike> {
    return this._hass;
  }

  firstUpdated() {
    const msgEl = this.shadowRoot?.querySelector<
      HTMLElement & {
        addEventListener(type: string, listener: EventListener): void;
      }
    >("#msg");
    if (msgEl) {
      msgEl.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this._record();
        }
      });
    }
  }

  async _record() {
    const msgEl = this.shadowRoot?.querySelector<
      HTMLElement & { value: string; focus: () => void }
    >("#msg");
    const message = (msgEl?.value || "").trim();
    if (!message) {
      msgEl?.focus();
      return;
    }

    const btn = this.shadowRoot?.querySelector<
      HTMLElement & { disabled: boolean }
    >("#btn");
    if (btn) {
      btn.disabled = true;
    }

    const cfg = this._config;
    const data: RecordWithUnknownValues = {
      message,
      icon: cfg.icon || "mdi:bookmark",
      color: cfg.color || AMBER,
    };

    const annotation = this._annotation.trim();
    if (annotation) {
      data.annotation = annotation;
    }

    let entityIds: string[];
    if (cfg.entity) {
      entityIds = [cfg.entity as string];
    } else if (cfg.entities) {
      entityIds = Array.isArray(cfg.entities)
        ? (cfg.entities as string[])
        : [cfg.entities as string];
    } else {
      entityIds = [];
    }

    if (entityIds.length) {
      data.entity_ids = entityIds;
    }

    try {
      const hass = this._hass;
      if (!hass) {
        return;
      }
      await hass.callService(DOMAIN, "record", data);
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      if (msgEl) {
        msgEl.value = "";
      }
      this._annotation = "";
      this._feedbackClass = "ok";
      this._feedbackText = "Recorded!";
      this._feedbackVisible = true;
      setTimeout(() => {
        if (this) {
          this._feedbackVisible = false;
        }
      }, 2500);
    } catch (e: unknown) {
      const error = e as Error;
      this._feedbackClass = "err";
      this._feedbackText = `Error: ${error.message || "unknown error"}`;
      this._feedbackVisible = true;
      logger.error("[hass-datapoints quick-card]", e);
    }

    if (btn) {
      btn.disabled = false;
    }
  }

  render() {
    const cfg = this._config;
    const cfgIcon = cfg.icon || "mdi:bookmark";
    const cfgColor = cfg.color || AMBER;
    const hasTitle = !!cfg.title;
    const showAnnotation = !!cfg.show_annotation;

    return html`
      <ha-card>
        ${hasTitle
          ? html`
              <div class="card-header">
                <ha-icon .icon=${cfgIcon}></ha-icon>
                ${cfg.title}
              </div>
            `
          : ""}
        <div class="input-row">
          <ha-textfield
            id="msg"
            .placeholder=${cfg.placeholder || "Note something…"}
          ></ha-textfield>
          <ha-button
            id="btn"
            raised
            style=${`--mdc-theme-primary: ${cfgColor}`}
            @click=${this._record}
          >
            <ha-icon .icon=${cfgIcon} slot="icon"></ha-icon>
            Record
          </ha-button>
        </div>
        ${showAnnotation
          ? html`
              <quick-annotation
                .value=${this._annotation}
                @dp-annotation-input=${(
                  event: CustomEvent<{ value: string }>
                ) => {
                  this._annotation = event.detail.value;
                }}
              ></quick-annotation>
            `
          : ""}
        <feedback-banner
          .kind=${this._feedbackClass}
          .text=${this._feedbackText}
          .visible=${this._feedbackVisible}
          variant="quick"
        ></feedback-banner>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("hass-datapoints-quick-card-editor");
  }

  static getStubConfig() {
    return { title: "Quick Record" };
  }

  getGridOptions() {
    const hasAnnotation = !!this._config?.show_annotation;
    return {
      rows: hasAnnotation ? 3 : 1,
      min_rows: hasAnnotation ? 3 : 1,
      max_rows: hasAnnotation ? 3 : 1,
    };
  }

  getCardSize() {
    return this._config?.show_annotation ? 3 : 1;
  }
}
