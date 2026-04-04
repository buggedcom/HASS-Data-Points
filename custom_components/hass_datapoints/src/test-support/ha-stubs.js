/* eslint-disable max-classes-per-file */
/**
 * Stub HA custom elements for Storybook.
 *
 * Icons render real MDI SVG paths via @mdi/js.
 * Form elements render HA-styled outlined field placeholders.
 * Containers pass child content through a <slot>.
 */

import * as mdi from "@mdi/js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an MDI icon string to its @mdi/js export name.
 * e.g. "mdi:chevron-down" → "mdiChevronDown"
 */
function mdiKey(iconStr) {
  if (!iconStr || !iconStr.startsWith("mdi:")) {
    return null;
  }
  const name = iconStr.slice(4); // strip "mdi:"
  return `mdi${name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}`;
}

/**
 * Resolve an icon string to its SVG path data, or null if not found.
 */
function resolveMdiPath(iconStr) {
  const key = mdiKey(iconStr);
  return key && mdi[key] ? mdi[key] : null;
}

// ---------------------------------------------------------------------------
// Icon elements — ha-icon, ha-state-icon, ha-svg-icon
// ---------------------------------------------------------------------------

class HaIconStub extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._icon = null;
  }

  connectedCallback() {
    this._render();
  }

  static get observedAttributes() {
    return ["icon"];
  }

  attributeChangedCallback() {
    this._render();
  }

  /** Property setter — Lit uses `.icon=${value}` bindings, not attribute bindings. */
  set icon(value) {
    this._icon = value;
    this._render();
  }

  get icon() {
    return this._icon ?? this.getAttribute("icon") ?? "";
  }

  _resolveIcon() {
    return this._icon ?? this.getAttribute("icon") ?? "";
  }

  _render() {
    const iconStr = this._resolveIcon();
    const path = resolveMdiPath(iconStr);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--mdc-icon-size, 24px);
          height: var(--mdc-icon-size, 24px);
          flex-shrink: 0;
        }
        svg {
          width: 100%;
          height: 100%;
          display: block;
          fill: currentColor;
        }
      </style>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        ${
          path
            ? `<path d="${path}" />`
            : `<circle cx="12" cy="12" r="8" opacity="0.35" /><circle cx="12" cy="12" r="3" opacity="0.6" />`
        }
      </svg>
    `;
  }
}

customElements.define("ha-icon", class extends HaIconStub {});

customElements.define(
  "ha-state-icon",
  class extends HaIconStub {
    constructor() {
      super();
      this._stateObj = null;
    }

    /** Property setter — Lit passes stateObj as a property, not an attribute. */
    set stateObj(value) {
      this._stateObj = value;
      this._render();
    }

    get stateObj() {
      return this._stateObj;
    }

    /** hass is also set as a property; re-render in case stateObj icon depends on it. */
    set hass(value) {
      this._hass = value;
      this._render();
    }

    _resolveIcon() {
      if (this._stateObj?.attributes?.icon) {
        return this._stateObj.attributes.icon;
      }
      return this._icon ?? this.getAttribute("icon") ?? "";
    }
  }
);

customElements.define(
  "ha-svg-icon",
  class extends HaIconStub {
    _resolveIcon() {
      return this.getAttribute("icon") || "";
    }

    _render() {
      const path = this.path || null;
      const fallback = `<circle cx="12" cy="12" r="8" opacity="0.35" />`;
      this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--mdc-icon-size, 24px);
          height: var(--mdc-icon-size, 24px);
          flex-shrink: 0;
        }
        svg { width: 100%; height: 100%; display: block; fill: currentColor; }
      </style>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        ${path ? `<path d="${path}" />` : fallback}
      </svg>
    `;
    }
  }
);

// ---------------------------------------------------------------------------
// Button elements — ha-icon-button
// ---------------------------------------------------------------------------

customElements.define(
  "ha-icon-button",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: transparent;
            cursor: pointer;
            box-sizing: border-box;
            transition: background 120ms;
          }
          :host(:hover) { background: rgba(128, 128, 128, 0.12); }
          ::slotted(*), slot { pointer-events: none; }
        </style>
        <slot></slot>
      `;
    }
  }
);

// ---------------------------------------------------------------------------
// Form / input elements — HA outlined-field appearance
//
// HA uses MDC (Material Design Components) outlined text fields. These stubs
// approximate that appearance: a rounded-corner outlined box with a floating
// label, matching the colours from the HA theme CSS variables.
// ---------------------------------------------------------------------------

const HA_FIELD_STYLES = `
  :host {
    display: block;
    font-family: Roboto, Noto, sans-serif;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
  }
  .field-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 56px;
    padding: 0 12px;
    border: 1px solid var(--input-outlined-idle-border-color, rgba(255,255,255,0.24));
    border-radius: 4px;
    box-sizing: border-box;
    background: transparent;
    gap: 8px;
    transition: border-color 120ms;
    cursor: pointer;
  }
  .field-wrapper:hover {
    border-color: var(--primary-text-color, #e1e1e1);
  }
  .field-label {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    font-size: 1rem;
    color: var(--secondary-text-color, #9e9e9e);
    pointer-events: none;
    transition: top 100ms, font-size 100ms, color 100ms;
    background: var(--card-background-color, #1c1c1c);
    padding: 0 2px;
  }
  .field-wrapper.has-value .field-label,
  .field-wrapper.has-placeholder .field-label {
    top: 0;
    font-size: 0.75rem;
    color: var(--secondary-text-color, #9e9e9e);
  }
  .field-value {
    flex: 1;
    font-size: 1rem;
    color: var(--primary-text-color, #e1e1e1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 8px;
  }
  .field-arrow {
    color: var(--secondary-text-color, #9e9e9e);
    font-size: 12px;
    flex-shrink: 0;
  }
`;

class HaFieldStub extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render();
  }

  static get observedAttributes() {
    return ["label", "placeholder", "value"];
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const label =
      this.getAttribute("label") || this.getAttribute("placeholder") || "";
    const value =
      this.getAttribute("value") || (this.value ? String(this.value) : "");
    const hasValue = Boolean(value);
    this.shadowRoot.innerHTML = `
      <style>${HA_FIELD_STYLES}</style>
      <div class="field-wrapper ${hasValue ? "has-value" : ""} ${label ? "has-placeholder" : ""}">
        ${label ? `<span class="field-label">${label}</span>` : ""}
        ${hasValue ? `<span class="field-value">${value}</span>` : ""}
        <span class="field-arrow">▾</span>
      </div>
    `;
  }
}

const FIELD_ELEMENTS = [
  "ha-textfield",
  "ha-selector",
  "ha-select",
  "ha-icon-picker",
  "ha-entity-picker",
  "ha-color-picker",
  "ha-date-range-picker",
  "ha-target-picker",
];

for (const tag of FIELD_ELEMENTS) {
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends HaFieldStub {});
  }
}

// ---------------------------------------------------------------------------
// Switch / toggle — ha-switch
// ---------------------------------------------------------------------------

if (!customElements.get("ha-switch")) {
  customElements.define(
    "ha-switch",
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._renderSwitch();
      }

      static get observedAttributes() {
        return ["checked"];
      }

      attributeChangedCallback() {
        this._renderSwitch();
      }

      _renderSwitch() {
        const checked = this.hasAttribute("checked") || this.checked;
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: inline-flex;
              align-items: center;
              cursor: pointer;
            }
            .track {
              width: 36px;
              height: 20px;
              border-radius: 10px;
              background: var(--disabled-text-color, #bdbdbd);
              position: relative;
              transition: background 120ms;
            }
            :host([checked]) .track,
            .track.on { background: var(--primary-color, #03a9f4); }
            .thumb {
              position: absolute;
              top: 2px;
              left: 2px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #fff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              transition: transform 120ms;
            }
            :host([checked]) .thumb,
            .track.on .thumb { transform: translateX(16px); }
          </style>
          <div class="track ${checked ? "on" : ""}">
            <div class="thumb"></div>
          </div>
        `;
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Slot-passthrough elements — containers, dialogs, cards, etc.
// ---------------------------------------------------------------------------

const SLOT_ELEMENTS = [
  "ha-form",
  "ha-formfield",
  "ha-dialog",
  "ha-sortable",
  "ha-alert",
  "ha-badge",
  "ha-button",
  "ha-card",
  "ha-top-app-bar-fixed",
  "ha-tooltip",
  "ha-menu-button",
];

for (const tag of SLOT_ELEMENTS) {
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
          this.shadowRoot.innerHTML = `<slot></slot>`;
        }
      }
    );
  }
}
