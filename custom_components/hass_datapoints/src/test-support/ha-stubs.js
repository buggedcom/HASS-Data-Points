/**
 * Stub HA custom elements for testing and Storybook.
 *
 * These lightweight stubs accept properties and render minimal DOM
 * so that components depending on HA elements can be tested outside
 * of a real Home Assistant environment.
 */

const HA_ELEMENTS = [
  "ha-form",
  "ha-icon",
  "ha-icon-button",
  "ha-selector",
  "ha-textfield",
  "ha-icon-picker",
  "ha-entity-picker",
  "ha-select",
  "ha-dialog",
  "ha-sortable",
  "ha-svg-icon",
  "ha-alert",
  "ha-button",
  "ha-color-picker",
  "ha-badge",
  "ha-target-picker",
  "ha-date-range-picker",
  "ha-card",
  "ha-switch",
  "ha-formfield",
  "ha-state-icon",
  "ha-menu-button",
  "ha-top-app-bar-fixed",
  "ha-tooltip",
];

class HaStubElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<slot></slot>`;
  }
}

for (const tag of HA_ELEMENTS) {
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends HaStubElement {
        static get tag() {
          return tag;
        }
      },
    );
  }
}
