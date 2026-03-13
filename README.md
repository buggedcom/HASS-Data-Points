<img src="images/banner.png" alt="Hass Records" width="100%" />

<p align="center">
  <img src="images/logo.png" alt="Hass Records Logo" width="80" />
</p>

<h1 align="center">Hass Records</h1>

<p align="center">
  Record custom events in Home Assistant and view them as annotation markers on charts, in the logbook, and in a dedicated activity-style list card.
</p>

<p align="center">
  <a href="https://github.com/home-assistant/home-assistant.io"><img src="https://img.shields.io/badge/Home%20Assistant-integration-41BDF5?logo=home-assistant&logoColor=white" alt="Home Assistant" /></a>
  <a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-Custom-orange?logo=home-assistant-community-store&logoColor=white" alt="HACS" /></a>
  <img src="https://img.shields.io/github/license/yourusername/hass-records" alt="License" />
  <img src="https://img.shields.io/github/v/release/yourusername/hass-records" alt="Release" />
</p>

---

## What it does

- **`hass_records.record` action** — call from automations, scripts, or Developer Tools to stamp a timestamped event into persistent storage and the HA logbook.
- **6 Lovelace cards** bundled with the integration — auto-registered, no separate resource step required.
- **Full visual editors** for every card via the Lovelace UI editor panel.

| Card | Description |
|------|-------------|
| `hass-records-action-card` | Full form — message, annotation, icon picker, colour picker, entity selector. |
| `hass-records-quick-card` | One-field card — type a note and press Record. Icon and colour are configurable. |
| `hass-records-sensor-card` | Sensor value + line chart with annotation icons placed directly on the data line. |
| `hass-records-history-card` | History line chart with coloured annotation markers at event timestamps. |
| `hass-records-statistics-card` | Same as history but powered by HA long-term statistics. |
| `hass-records-list-card` | Activity / logbook-style datagrid — browse, search, edit and delete all recorded events. |

---

## HACS category

**Integration** — the frontend cards are bundled with the integration and auto-registered; no separate resource step is needed.

---

## Installation

### Via HACS (recommended)

1. Open HACS → **Integrations** → ⋮ → **Custom repositories**.
2. Add the URL of this repository and set the category to **Integration**.
3. Install **Hass Records**.
4. Restart Home Assistant.

### Manual

Copy the `custom_components/hass_records` folder into your HA `config/custom_components/` directory, then restart.

## Configuration

Add the integration from **Settings → Devices & Services → Add Integration → Hass Records**. No YAML configuration is required — the integration registers itself and auto-loads all Lovelace cards.

---

## Recording an event

### From the `hass_records.record` action

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
action: hass_records.record
data:
  message: "Something happened"
```

#### Full example

```yaml
action: hass_records.record
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
action: hass_records.record
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
      - action: hass_records.record
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
      - action: hass_records.record
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

> Events are persisted immediately to `.storage/hass_records.events` and fired on the HA event bus as `hass_records_event_recorded`, so they appear in the logbook in real time.

---

## Lovelace cards

All cards support the **Lovelace visual editor** — click the pencil icon on any card to open the UI editor panel instead of editing YAML.

### Action card

Full form for recording events — message, annotation, icon, colour, and entity selector.

```yaml
type: custom:hass-records-action-card
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
type: custom:hass-records-quick-card
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
type: custom:hass-records-quick-card
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
type: custom:hass-records-sensor-card
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
type: custom:hass-records-list-card
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

History line chart overlaying coloured annotation markers at event timestamps.

```yaml
type: custom:hass-records-history-card
title: Temperature with Events
entity: sensor.living_room_temperature
hours_to_show: 24
```

Multiple entities:

```yaml
type: custom:hass-records-history-card
entities:
  - sensor.living_room_temperature
  - sensor.bedroom_temperature
hours_to_show: 48
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | — | Card heading (hidden if omitted) |
| `entity` | entity ID | — | Single entity to chart |
| `entities` | list | — | Multiple entities to chart |
| `hours_to_show` | number | `24` | Time range in hours |

---

### Statistics card

Same as the history card but powered by HA long-term statistics.

```yaml
type: custom:hass-records-statistics-card
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

1. It is persisted to `.storage/hass_records.events`.
2. It is fired on the HA event bus as `hass_records_event_recorded`.
3. It is written to the HA logbook (with icon, icon colour, message, and entity link).
4. Chart cards fetch events via WebSocket when they render, placing markers at the correct timestamps.

**History / Statistics cards** draw a dashed vertical line and coloured diamond marker at each event timestamp. Hovering shows a tooltip with the message and annotation.

**Sensor card** places coloured icon circles **directly on the sensor data line** at the interpolated Y position — no vertical dotted line. Each circle shows the event's MDI icon. Icon colour automatically contrasts with the circle background using the WCAG relative-luminance formula (so a bright green background gets a black icon, a dark blue gets white).

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
| `hass_records/events` | `start_time`, `end_time`, `entity_ids` (all optional) | `{ events: [...] }` |
| `hass_records/events/update` | `event_id`, `message`, `annotation`, `entity_ids`, `icon`, `color` | `{ updated: true, event: {...} }` |
| `hass_records/events/delete` | `event_id` | `{ deleted: true/false }` |

Events are stored in `.storage/hass_records.events` (HA's standard JSON storage).

---

## Development

### Setup

```bash
git clone https://github.com/yourusername/hass-records.git
cd hass-records
./scripts/install-hooks.sh   # install the pre-commit hook
```

### Building the frontend

Source files live in `custom_components/hass_records/src/`. The build script concatenates them into a single IIFE in `hass-records-cards.js`:

```bash
bash scripts/build.sh
```

A **pre-commit hook** runs automatically — whenever you stage changes to any `src/` file, the hook rebuilds `hass-records-cards.js` and stages it so your commit always includes an up-to-date build.

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
   bash scripts/dev-sync.sh
   ```
4. Or run watch mode for local development:
   ```bash
   bash scripts/dev-watch.sh
   ```

What this does:
- Rebuilds `hass-records-cards.js`
- Syncs `custom_components/hass_records/` to the remote HA config
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
  constants.js        – shared constants (DOMAIN, COLORS, AMBER)
  helpers.js          – fetchEvents, deleteEvent, updateEvent, fmtTime, contrastColor, …
  entity-name.js      – entityName() helper
  chart-renderer.js   – canvas drawing primitives
  chart-utils.js      – shared chart shell / tooltip helpers
  card-action.js      – hass-records-action-card
  card-quick.js       – hass-records-quick-card
  card-chart-base.js  – ChartCardBase (shared base for history + statistics)
  card-history.js     – hass-records-history-card
  card-statistics.js  – hass-records-statistics-card
  card-sensor.js      – hass-records-sensor-card
  card-list.js        – hass-records-list-card
  card-editors.js     – visual editors for all 6 cards
  register.js         – customElements.define + window.customCards registration
```

### CI

Every push to `main` and every pull request runs the **CI** workflow (`.github/workflows/ci.yml`):

- Python syntax checks on all integration modules
- JS build + syntax verification
- Checks the committed `hass-records-cards.js` matches what `bash scripts/build.sh` produces
- Validates `manifest.json`, `strings.json`, `services.yaml`, `hacs.json`
- Runs the official HACS validation action

### Releasing

1. Update the version in `custom_components/hass_records/manifest.json`.
2. Commit and tag:
   ```bash
   git tag v1.0.0
   git push && git push --tags
   ```
3. The **Release** workflow (`.github/workflows/release.yml`) automatically:
   - Stamps the tag version into `manifest.json` and the JS build
   - Runs all syntax checks
   - Packages `custom_components/hass_records/` into a zip (excluding `src/`)
   - Creates a GitHub Release with auto-generated release notes and the zip attached
