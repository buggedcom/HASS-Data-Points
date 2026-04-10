# Cards & UI

Data Points ships six Lovelace cards and a dedicated history panel. All cards include visual editors — no YAML is required for typical setups.

---

## Available cards

| Card                            | Purpose                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `hass-datapoints-action-card`   | Full recording form with message, annotation, icon, color, and related items.                                                      |
| `hass-datapoints-quick-card`    | Lightweight card for quick operational notes.                                                                                      |
| `hass-datapoints-list-card`     | Searchable, editable, hide/show capable datapoint list.                                                                            |
| `hass-datapoints-dev-tool-card` | Generate useful development datapoints from HA history and clean up development datapoints.                                        |
| `hass-datapoints-history-card`  | Multi-series analysis chart with target rows, anomaly overlays, date windows, zoom, timeline slider, and chart-created datapoints. |
| `hass-datapoints-sensor-card`   | Sensor-focused chart with inline datapoint markers.                                                                                |

### Visual editors

All bundled cards include Lovelace visual editors. The dev-tool editor is intentionally minimal because the card itself does not expose configurable options.

The typical setup flow is:

1. Add the card in Lovelace.
2. Configure it entirely through the visual editor.
3. Drop into YAML only if you prefer hand-tuned configuration.

---

## Card configurations

### Action card

Use this when you want a complete form for recording rich operational notes.

```yaml
type: custom:hass-datapoints-action-card
title: Record event
```

### Quick card

Use this for lightweight logging such as:

- maintenance notes
- household observations
- manual interventions
- quick analytical breadcrumbs

```yaml
type: custom:hass-datapoints-quick-card
title: Quick note
icon: mdi:bookmark
color: "#ff9800"
```

### List card

Use this to browse, search, and hide datapoints. Admin users also see edit and delete buttons for each record.

```yaml
type: custom:hass-datapoints-list-card
title: All datapoints
page_size: 20
```

### Sensor card

Use this for a single entity with inline datapoint markers.

```yaml
type: custom:hass-datapoints-sensor-card
entity: sensor.living_room_temperature
hours_to_show: 24
```

### History card

Use this for multi-series exploration, date-window comparison, anomaly review, and chart-driven datapoint creation.

```yaml
type: custom:hass-datapoints-history-card
title: Room temperatures
entities:
  - sensor.living_room_temperature
  - sensor.bedroom_temperature
hours_to_show: 72
```

### Dev tool card

Use this for seeding and cleanup workflows:

- generate development datapoints from HA history
- create repeatable analytical markers for testing
- bulk delete development datapoints

```yaml
type: custom:hass-datapoints-dev-tool-card
```

---

## Dedicated history panel

The integration also provides a full history page experience (accessible from the sidebar) with:

- target rows for each visible series
- per-target analysis controls
- collapsible options sidebar
- collapsed target rail with add-target and preferences controls
- date-window tab bar above the chart
- timeline slider with zoom highlight synchronization
- resizable chart/list split panes
- chart-created datapoints and hover-driven comparison preview

For details on analysis features available in the history card and panel, see [History & Analysis](./history-and-analysis.md).
