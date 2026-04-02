<img src="images/banner.png" alt="Data Points" width="100%" />

<p align="center">
  <img src="images/logo.png" alt="Data Points Logo" width="80" />
</p>

<h1 align="center">Data Points</h1>

<p align="center">
  Record custom events in Home Assistant and view them as annotation markers on charts, in the logbook, and in a dedicated activity-style list card.
</p>

<p align="center">
  <a href="https://github.com/home-assistant/home-assistant.io"><img src="https://img.shields.io/badge/Home%20Assistant-integration-41BDF5?logo=home-assistant&logoColor=white" alt="Home Assistant" /></a>
  <a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-Custom-orange?logo=home-assistant-community-store&logoColor=white" alt="HACS" /></a>
  <img src="https://img.shields.io/github/license/buggedcom/hass-datapoints" alt="License" />
  <img src="https://img.shields.io/github/v/release/buggedcom/hass-datapoints" alt="Release" />
</p>

---

## What it does

- **`hass_datapoints.record` action** — call from automations, scripts, or Developer Tools to stamp a timestamped event into persistent storage and the HA logbook.
- **6 Lovelace cards** bundled with the integration — auto-registered, no separate resource step required.
- **Full visual editors** for every card via the Lovelace UI editor panel.

| Card | Description |
|------|-------------|
| `hass-datapoints-action-card` | Full form — message, annotation, icon picker, colour picker, entity selector. |
| `hass-datapoints-quick-card` | One-field card — type a note and press Record. Icon and colour are configurable. |
| `hass-datapoints-sensor-card` | Sensor value + line chart with annotation icons placed directly on the data line. |
| `hass-datapoints-history-card` | Multi-series history chart with advanced analysis, annotations, and split-series view. |
| `hass-datapoints-statistics-card` | Same as history but powered by HA long-term statistics. |
| `hass-datapoints-list-card` | Activity / logbook-style datagrid — browse, search, edit and delete all recorded events. |

---

## HACS category

**Integration** — the frontend cards are bundled with the integration and auto-registered; no separate resource step is needed.

---

## Installation

### Via HACS (recommended)

1. Open HACS → **Integrations** → ⋮ → **Custom repositories**.
2. Add the URL of this repository and set the category to **Integration**.
3. Install **Data Points**.
4. Restart Home Assistant.

### Manual

Copy the `custom_components/hass_datapoints` folder into your HA `config/custom_components/` directory, then restart.

## Configuration

Add the integration from **Settings → Devices & Services → Add Integration → Data Points**. No YAML configuration is required — the integration registers itself and auto-loads all Lovelace cards.

---

## Recording an event

### From the `hass_datapoints.record` action

Call from automations, scripts, or **Developer Tools → Actions**.

#### Action fields reference

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `message` | ✅ | string | — | Short description shown in the logbook and as the marker label on charts. |
| `annotation` | No | string | Same as `message` | Longer tooltip text shown on chart hover. Supports multiline. |
| `entity_ids` | No | list of entity IDs | `[]` (global) | Entities to associate the event with. Events with no entities appear on all charts. |
| `icon` | No | string | `mdi:bookmark` | [MDI icon](https://pictogrammers.com/library/mdi/) for the annotation marker. |
| `color` | No | hex string or RGB list | `#03a9f4` | Colour of the annotation marker. Accepts a hex string `"#ff5722"` **or** an RGB list `[255, 87, 34]`. |

#### Minimal example

```yaml
action: hass_datapoints.record
data:
  message: "Something happened"
```

#### Full example

```yaml
action: hass_datapoints.record
data:
  message: "Switched to summer mode"
  annotation: >-
    Thermostat set to 22 °C for the summer schedule.
    Running daily from 06:00 to 22:00.
  entity_ids:
    - climate.living_room
    - sensor.living_room_temperature
  icon: mdi:thermometer
  color: "#ff5722"
```

#### Colour as an RGB list

The HA `color_rgb` selector sends colour as a three-element list — this is fully supported:

```yaml
action: hass_datapoints.record
data:
  message: "High temperature alert"
  color:
    - 255
    - 0
    - 0
```

The list `[255, 0, 0]` is automatically converted to `#ff0000` before storage.

#### Automation example

```yaml
automation:
  - alias: "Record when front door opens"
    triggers:
      - trigger: state
        entity_id: binary_sensor.front_door
        to: "on"
    actions:
      - action: hass_datapoints.record
        data:
          message: "Front door opened"
          annotation: "The front door was opened at {{ now().strftime('%H:%M') }}"
          entity_ids:
            - binary_sensor.front_door
          icon: mdi:door-open
          color:
            - 255
            - 152
            - 0
```

#### Script example

```yaml
script:
  record_maintenance:
    alias: "Record maintenance event"
    sequence:
      - action: hass_datapoints.record
        data:
          message: "{{ task }}"
          annotation: "{{ details }}"
          icon: mdi:wrench
          color: "#4caf50"
    fields:
      task:
        description: Short description of the maintenance task
        example: "Replaced HVAC filter"
      details:
        description: Detailed notes
        example: "Installed 3M Filtrete 1900, next replacement in 90 days"
```

> Events are persisted immediately to `.storage/hass_datapoints.events` and fired on the HA event bus as `hass_datapoints_event_recorded`, so they appear in the logbook in real time.

---

## Lovelace cards

All cards support the **Lovelace visual editor** — click the pencil icon on any card to open the UI editor panel instead of editing YAML.

### Action card

Full form for recording events — message, annotation, icon, colour, and entity selector.

```yaml
type: custom:hass-datapoints-action-card
title: Record Event
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `default_icon` | string | `mdi:bookmark` | Icon pre-selected in the icon picker |
| `default_color` | hex string | `#03a9f4` | Colour pre-selected in the colour picker |
| `entity` | entity ID | — | Pre-fill a single entity association |
| `entities` | list | — | Pre-fill multiple entity associations |

- Click **Add related entity** (secondary button) to add entity association rows dynamically.
- Icon colour automatically contrasts with the chosen background colour (WCAG luminance formula).
- Press **Ctrl+Enter** in the annotation field to submit.

---

### Quick card

Streamlined one-field card for fast note-taking.

```yaml
type: custom:hass-datapoints-quick-card
title: Quick Note
icon: mdi:bookmark
color: "#ff9800"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `placeholder` | string | `Note something…` | Input placeholder text |
| `icon` | string | `mdi:bookmark` | MDI icon shown in the header and on the Record button; stored with every record from this card |
| `color` | hex string | `#ff9800` | Colour used for the icon, button, and every record from this card |
| `entity` | entity ID | — | Associate all records with this entity |
| `entities` | list | — | Associate all records with these entities |

```yaml
type: custom:hass-datapoints-quick-card
title: Maintenance Log
icon: mdi:wrench
color: "#4caf50"
placeholder: "What maintenance was done?"
entity: sensor.boiler_temperature
```

---

### Sensor card

Sensor-style card showing the entity's current value with a line chart. Annotation markers appear as **coloured icon circles directly on the data line** — no vertical dotted lines.

```yaml
type: custom:hass-datapoints-sensor-card
entity: sensor.living_room_temperature
hours_to_show: 24
name: Living Room
graph_color: "#ef4444"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | entity ID | — | **Required.** The sensor entity to display. |
| `name` | string | Entity friendly name | Override the display name. |
| `hours_to_show` | number | `24` | Time range in hours for the chart. |
| `graph_color` | hex string | `#3b82f6` | Line chart and header icon colour. |
| `annotation_style` | string | `circle` | Annotation style: `circle` for inline icon circles on the line, or `line` for a dotted vertical marker. |
| `show_records` | boolean | `false` | Show a scrollable list of records below the chart. |
| `records_page_size` | number | — | Records per page in the list. Omit to show all. Pagination controls appear outside the scrollable area. |
| `records_limit` | number | — | Maximum total number of records to show in the list. |
| `records_show_annotation` | boolean | `true` | Show annotation text inline. Set to `false` to collapse annotations — click a row to expand. |

When `show_records: true`, the card requests a minimum dashboard layout height of 3 rows.

**Annotation list rows** each show:
- A **coloured icon circle** (icon + background colour from the record, with auto-contrasting icon colour)
- **Message** and **time** on the same line
- **Annotation text** — optionally collapsible with click-to-expand

---

### List card

Activity / logbook-style datagrid for browsing, searching, editing and deleting all records.

```yaml
type: custom:hass-datapoints-list-card
title: All Records
page_size: 20
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `page_size` | number | `15` | Records per page |
| `hours_to_show` | number | — | Limit to records from the last N hours (omit for all time) |
| `max_height` | number | — | Max height of the scrollable list area in pixels |
| `message_filter` | string | — | Static text filter always AND-ed with the live search bar |
| `show_search` | boolean | `true` | Show the search bar |
| `show_entities` | boolean | `true` | Show linked entity chips |
| `show_annotation` | boolean | `true` | Show annotation text inline; `false` collapses it — click a row to expand |
| `entity` | entity ID | — | Filter to records associated with this entity |
| `entities` | list | — | Filter to records associated with these entities |

**Features:**
- Coloured icon circle per record (icon colour auto-contrasts with background)
- Message and relative timestamp inline on the same line (full date/time on hover)
- Entity links as clickable pill badges — opens the HA more-info dialog
- Search bar filters by message, annotation, or entity ID (AND-ed with any `message_filter`)
- Inline edit (pencil icon) — edit message, annotation, icon, and colour
- Delete (trash icon) — removes the record permanently
- Edit/delete buttons appear on hover

---

### History card

Multi-series history chart with annotation markers, a full per-series analysis panel, split-series view, and date window comparison tabs.

```yaml
type: custom:hass-datapoints-history-card
title: Temperature with Events
entity: sensor.living_room_temperature
hours_to_show: 24
```

Multiple entities:

```yaml
type: custom:hass-datapoints-history-card
entities:
  - sensor.living_room_temperature
  - sensor.bedroom_temperature
hours_to_show: 48
```

#### Basic configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `entity` | entity ID | — | Single entity to chart |
| `entities` | list | — | Multiple entities to chart |
| `hours_to_show` | number | `24` | Time range in hours |

#### Annotation markers on the chart

Each recorded event is drawn as a **coloured icon circle** on the chart at the event's timestamp. The marker is placed:

- **On the series line** — if the event is linked (`entity_ids`) to a target in the chart, the marker is interpolated to sit directly on that target's data line at the correct Y value.
- **On the x-axis baseline** — if the event is linked to an entity that is not one of the chart's targets, the marker appears at the bottom of the chart rather than on an unrelated line.
- **On any available line** (fallback) — if the event has no `entity_ids` (a global event), it is placed on the nearest series with data at that timestamp.

Hovering a marker shows a **tooltip** with the event message, annotation text, icon, colour swatch, and timestamp. Clicking the marker navigates to the event history.

#### Datapoint scope

The sidebar **Datapoints** section controls which annotation markers appear:

| Scope | Behaviour |
|-------|-----------|
| `linked` (default) | Only events linked to the currently selected targets are shown. |
| `all` | All recorded events are shown regardless of their entity associations. |
| `hidden` | No annotation markers are shown. |

#### Per-series analysis

Each series (target) has an expandable **analysis panel** opened by clicking the chevron button on its row. Analysis settings are per-series and persist in the card config.

| Feature | Description |
|---------|-------------|
| **Trend lines** | Overlay a trend line using linear, polynomial, or moving-average regression. |
| **Summary statistics** | Draw horizontal min, mean, and max lines across the visible time range. Optional gradient shading fills the band between each extreme and the mean. Shading is rendered in both combined and **split-series** view. |
| **Rate of change** | Overlay the first derivative of the series on a secondary Y axis. |
| **Threshold analysis** | Draw a horizontal threshold line; optionally shade the area above or below it. |
| **Anomaly detection** | Highlight statistically unusual clusters using configurable sensitivity. |
| **Delta / comparison** | Compare the series against a named date window (see below) as a delta or offset line. |
| **Hide source series** | When analysis overlays are active you can hide the raw data line to reduce clutter. |

The **Copy to all targets** button in each analysis panel copies that series' settings to every other target in one click. The button is hidden when only one target exists, and disabled when all targets already share identical analysis settings.

#### Split-series view

Setting **Y-axis mode** to **Split** (`y_axis_mode: split`) renders each series in its own chart row with an independent Y axis. All analysis overlays — including trend lines, summary stat lines, min/max/mean gradient shading, anomaly clusters, and threshold lines — are drawn per-row in split view.

#### Date window comparison tabs

Named date windows appear as tabs above the chart. Each window saves a start/end range that you can instantly preview or jump to. The dialog for creating and editing date windows **shakes** if you submit it without filling in required fields.

#### Drag-to-reorder targets

Target rows in the sidebar can be dragged to reorder them. During a drag the **cursor changes to a grabbing hand** globally, overriding the browser's default drag cursor so the interaction remains clear even when the drag ghost image overlaps the pointer.

---

### Statistics card

Same as the history card but powered by HA long-term statistics.

```yaml
type: custom:hass-datapoints-statistics-card
title: Energy with Events
entity: sensor.daily_energy
hours_to_show: 168
period: hour
stat_types:
  - mean
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `entity` | entity ID | — | Single entity / statistic ID |
| `entities` | list | — | Multiple entities / statistic IDs |
| `hours_to_show` | number | `168` | Time range in hours |
| `period` | string | `hour` | `5minute`, `hour`, `day`, `week`, or `month` |
| `stat_types` | list | `["mean"]` | One or more of `mean`, `min`, `max`, `sum`, `state` |

---

## How annotations work

When an event is recorded:

1. It is persisted to `.storage/hass_datapoints.events`.
2. It is fired on the HA event bus as `hass_datapoints_event_recorded`.
3. It is written to the HA logbook (with icon, icon colour, message, and entity link).
4. Chart cards fetch events via WebSocket when they render, placing markers at the correct timestamps.

**History / Statistics cards** place coloured icon circles on the chart at each event timestamp. The Y position is:
- Interpolated on the matching series' data line if the event is linked to that target.
- Placed at the x-axis baseline if the event is linked to a different (non-charted) entity.
- Interpolated on the nearest available series if the event has no entity associations (global event).

Hovering an icon marker shows a **tooltip** with the full event details.

**Sensor card** places coloured icon circles **directly on the sensor data line** at the interpolated Y position — no vertical dotted line. Each circle shows the event's MDI icon.

**Icon contrast** — all icon circles across all cards use the WCAG luminance formula to choose black or white for the icon colour, ensuring readability against any background colour.

---

## Logbook integration

Every recorded event appears in **History → Logbook** automatically. Each entry includes:
- The configured **icon** (e.g. `mdi:thermometer`)
- The **icon colour** matching the event colour
- The **message** text
- A link to the first associated entity (if any)

---

## WebSocket API

The integration exposes three WebSocket commands consumed by the cards:

| Type | Parameters | Returns |
|------|-----------|---------|
| `hass_datapoints/events` | `start_time`, `end_time`, `entity_ids` (all optional) | `{ events: [...] }` |
| `hass_datapoints/events/update` | `event_id`, `message`, `annotation`, `entity_ids`, `icon`, `color` | `{ updated: true, event: {...} }` |
| `hass_datapoints/events/delete` | `event_id` | `{ deleted: true/false }` |

Events are stored in `.storage/hass_datapoints.events` (HA's standard JSON storage).

---

## Development

### Setup

```bash
git clone https://github.com/buggedcom/hass-datapoints.git
cd hass-datapoints
corepack enable              # optional, but recommended for pnpm
pnpm install
pnpm hooks:install          # install the pre-commit hook
```

### Building the frontend

Source files live in `custom_components/hass_datapoints/src/`. The build script bundles them into a single IIFE in `hass-datapoints-cards.js`:

```bash
pnpm build
```

A **pre-commit hook** runs automatically — whenever you stage changes to any `src/` file, the hook rebuilds `hass-datapoints-cards.js` and stages it so your commit always includes an up-to-date build.

### Storybook

The component library has a Storybook instance covering every atom and molecule. Stories live in a `stories/` subdirectory colocated with each component.

```bash
pnpm storybook          # start the dev server on http://localhost:6006
```

All atoms and molecules have stories covering their main variants and interactive states. The preview runs with the **HA Dark** theme and stub implementations of HA custom elements (`ha-textfield`, `ha-switch`, `ha-selector`, etc.) so components render correctly without a live HA instance.

### Remote Home Assistant development

If you want to develop on your Mac but test against a Home Assistant instance elsewhere on your network, this repo includes a simple SSH + `rsync` workflow.

1. Copy the example environment file:
   ```bash
   cp .env.dev.example .env.dev
   ```
2. Edit `.env.dev` and set:
   - `HA_DEV_HOST` to your Home Assistant host or IP
   - `HA_DEV_USER` / `HA_DEV_PORT` for SSH access
   - `HA_DEV_CONFIG_PATH` to the HA config directory on that machine
3. Run a one-off sync:
   ```bash
   pnpm dev:sync
   ```
4. Or run watch mode for local development:
   ```bash
   pnpm dev:watch
   ```

What this does:
- Rebuilds `hass-datapoints-cards.js`
- Syncs `custom_components/hass_datapoints/` to the remote HA config
- Optionally runs a restart command if you set `HA_DEV_RESTART_COMMAND`

Example restart command:

```bash
HA_DEV_RESTART_COMMAND="ha core restart"
```

Notes:
- Frontend-only changes often just need a browser refresh after the sync.
- Python/backend changes usually require a Home Assistant restart.
- `rsync` uses `--delete` by default so the remote copy matches the repo.

### Source layout

```
src/
  atoms/
    display/          – dp-chart-message, dp-color-swatch, dp-empty-state,
                        dp-form-group, dp-loading-indicator, dp-section-heading,
                        dp-sidebar-options-section, dp-sidebar-section-header
    form/             – dp-analysis-checkbox, dp-checkbox-list, dp-color-picker-field,
                        dp-date-time-input, dp-editor-entity-list, dp-editor-entity-picker,
                        dp-editor-icon-picker, dp-editor-select, dp-editor-switch,
                        dp-editor-text-field, dp-entity-chip, dp-inline-select,
                        dp-number-input, dp-radio-group
    interactive/      – dp-annotation-chip, dp-drag-handle, dp-legend-item,
                        dp-page-menu-item, dp-pagination, dp-range-timeline,
                        dp-resizable-panes, dp-search-bar, dp-toggle-switch,
                        dp-visibility-toggle
  molecules/
    dp-analysis-*/    – per-feature analysis option groups (trend, summary, rate, …)
    dp-target-row/    – single series row with analysis panel
    dp-target-row-list/ – drag-to-reorder list of target rows
    dp-date-window-dialog/ – named date range dialog
    dp-sidebar-options/    – collapsible sidebar option groups
    dp-chart-legend/       – interactive chart legend
    …
  components/
    card-history/     – hass-datapoints-history-card
    card-statistics/  – hass-datapoints-statistics-card
    card-sensor/      – hass-datapoints-sensor-card
    card-action/      – hass-datapoints-action-card
    card-quick/       – hass-datapoints-quick-card
    card-list/        – hass-datapoints-list-card
    annotation-dialog/ – annotation creation dialog controller
  panels/
    datapoints/       – sidebar panel (target rows, collapsed summary, comparison windows)
  lib/
    chart-renderer.js – canvas drawing primitives (lines, bands, annotations, …)
    chart-utils.js    – tooltip helpers, annotation tooltip rendering
    shared.js         – shared helpers (entityName, esc, contrastColor, …)
    logger.js         – scoped logger
```

Each atom and molecule has:
- A TypeScript (or JS) component file
- A `stories/` subdirectory with Storybook CSF stories
- An optional `__tests__/` subdirectory with Vitest unit tests

### CI

Every push to `main` and every pull request runs the **CI** workflow (`.github/workflows/ci.yml`):

- Python syntax checks on all integration modules
- JS build + syntax verification
- Checks the committed `hass-datapoints-cards.js` matches what `pnpm build` produces
- Validates `manifest.json`, `strings.json`, `services.yaml`, `hacs.json`
- Runs the official HACS validation action

### Releasing

1. Update the version in `custom_components/hass_datapoints/manifest.json`.
2. Commit and tag:
   ```bash
   git tag v1.0.0
   git push && git push --tags
   ```
3. The **Release** workflow (`.github/workflows/release.yml`) automatically:
   - Stamps the tag version into `manifest.json` and the JS build
   - Runs all syntax checks
   - Packages `custom_components/hass_datapoints/` into a zip (excluding `src/`)
   - Creates a GitHub Release with auto-generated release notes and the zip attached
