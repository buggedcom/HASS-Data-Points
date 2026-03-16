/**
 * Register all custom elements and advertise them to the Lovelace card picker.
 */

// ── Card elements ──────────────────────────────────────────────────────────
if (!customElements.get("hass-records-action-card")) {
  customElements.define("hass-records-action-card", HassRecordsActionCard);
}
if (!customElements.get("hass-records-quick-card")) {
  customElements.define("hass-records-quick-card", HassRecordsQuickCard);
}
if (!customElements.get("hass-records-history-card")) {
  customElements.define("hass-records-history-card", HassRecordsHistoryCard);
}
if (!customElements.get("hass-records-statistics-card")) {
  customElements.define("hass-records-statistics-card", HassRecordsStatisticsCard);
}
if (!customElements.get("hass-records-sensor-card")) {
  customElements.define("hass-records-sensor-card", HassRecordsSensorCard);
}
if (!customElements.get("hass-records-list-card")) {
  customElements.define("hass-records-list-card", HassRecordsListCard);
}
if (!customElements.get("hass-records-history-panel")) {
  customElements.define("hass-records-history-panel", HassRecordsHistoryPanel);
}

// ── Editor elements ────────────────────────────────────────────────────────
if (!customElements.get("hass-records-action-card-editor")) {
  customElements.define("hass-records-action-card-editor", HassRecordsActionCardEditor);
}
if (!customElements.get("hass-records-quick-card-editor")) {
  customElements.define("hass-records-quick-card-editor", HassRecordsQuickCardEditor);
}
if (!customElements.get("hass-records-history-card-editor")) {
  customElements.define("hass-records-history-card-editor", HassRecordsHistoryCardEditor);
}
if (!customElements.get("hass-records-statistics-card-editor")) {
  customElements.define("hass-records-statistics-card-editor", HassRecordsStatisticsCardEditor);
}
if (!customElements.get("hass-records-sensor-card-editor")) {
  customElements.define("hass-records-sensor-card-editor", HassRecordsSensorCardEditor);
}
if (!customElements.get("hass-records-list-card-editor")) {
  customElements.define("hass-records-list-card-editor", HassRecordsListCardEditor);
}


// ── Register in Lovelace custom cards list ─────────────────────────────────
window.customCards = window.customCards || [];
const registeredTypes = new Set(window.customCards.map((c) => c.type));
const cardsToAdd = [
  {
    type: "hass-records-action-card",
    name: "Hass Records – Action Card",
    description: "Full form to record a custom event with message, annotation, icon, colour and entity association.",
    preview: false,
  },
  {
    type: "hass-records-quick-card",
    name: "Hass Records – Quick Card",
    description: "Simple one-field card to quickly record a note with a bookmark icon.",
    preview: false,
  },
  {
    type: "hass-records-history-card",
    name: "Hass Records – History Card",
    description: "History line chart with coloured annotation markers for recorded events.",
    preview: false,
  },
  {
    type: "hass-records-statistics-card",
    name: "Hass Records – Statistics Card",
    description: "Statistics line chart with coloured annotation markers for recorded events.",
    preview: false,
  },
  {
    type: "hass-records-sensor-card",
    name: "Hass Records – Sensor Card",
    description: "Sensor card with line chart — annotations shown as icons on the data line.",
    preview: false,
  },
  {
    type: "hass-records-list-card",
    name: "Hass Records – List Card",
    description: "Activity-style datagrid to browse, search, edit and delete all recorded events.",
    preview: false,
  },
];
cardsToAdd.forEach((card) => {
  if (!registeredTypes.has(card.type)) {
    window.customCards.push(card);
  }
});

console.info(
  "%c HASS-RECORDS %c v0.3.0 loaded ",
  "color:#fff;background:#03a9f4;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
  "color:#03a9f4;background:#fff;font-weight:bold;padding:2px 6px;border:1px solid #03a9f4;border-radius:0 3px 3px 0"
);
