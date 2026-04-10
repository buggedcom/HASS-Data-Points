<img src="images/banner.png" alt="Data Points" width="100%" />

<h1 align="center">Data Points</h1>

<p align="center">
  Record meaningful events in Home Assistant and analyze them directly alongside your entity history, long-term statistics, and chart annotations.
</p>

<p align="center">
  <a href="https://github.com/home-assistant/home-assistant.io"><img src="https://img.shields.io/badge/Home%20Assistant-integration-41BDF5?logo=home-assistant&logoColor=white" alt="Home Assistant" /></a>
  <a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-Custom-orange?logo=home-assistant-community-store&logoColor=white" alt="HACS" /></a>
  <a href="https://main--69cd024f27ae313c14343a9a.chromatic.com"><img src="https://img.shields.io/badge/Storybook-published-FF4785?logo=storybook&logoColor=white" alt="Storybook" /></a>
  <img src="https://img.shields.io/github/license/buggedcom/HASS-Data-Points" alt="License" />
  <img src="https://img.shields.io/github/v/release/buggedcom/HASS-Data-Points" alt="Release" />
</p>

![Screenshot.png](images/Screenshot.png)
![Screenshot2.png](images/Screenshot2.png)
![Screenshot3.png](images/Screenshot3.png)

---

## Overview

Data Points is a Home Assistant integration for recording timestamped events and using them as analytical context across charts, lists, and a dedicated history page.

It helps you answer questions like:

- What changed?
- When did it change?
- What system or entity was affected?
- Was the change expected?
- Does the related sensor behavior now look suspicious?

The integration bundles its Lovelace cards and panel frontend automatically. No separate Lovelace resource configuration is required.

---

## Why Data Points is useful

A plain chart tells you what changed. Data Points helps you understand **why** it changed by combining:

- raw measurements
- long-term statistics
- user-created or automation-created annotations
- target-aware chart overlays
- anomaly detection
- historical date-window comparison

That makes it much easier to investigate heating behavior, energy usage, sensor faults, maintenance effects, occupancy-driven changes, and operational regressions over time.

---

## What Data Points provides

- Record custom datapoints from automations, scripts, dashboards, and Developer Tools
- Attach datapoints to entities, devices, areas, or labels
- Render datapoints directly on history, statistics, and sensor charts
- Browse, search, edit, delete, and hide datapoints in a dedicated list card
- Investigate entity history with target rows, per-target analysis options, and date-window comparisons
- Create chart annotations directly from the chart while exploring data
- Backend-powered anomaly detection to highlight suspicious behavior
- Compare a current period against saved historical windows to find drift and regressions

---

## Documentation

| Topic                                                | Description                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| [Cards & UI](docs/cards.md)                          | All six cards, the history panel, and YAML configuration examples  |
| [Recording Datapoints](docs/recording-datapoints.md) | The `record` action, fields, automation patterns, and examples     |
| [History & Analysis](docs/history-and-analysis.md)   | Chart features, trend methods, anomaly detection, and date windows |
| [Development](docs/development.md)                   | Setup, build, tests, i18n, remote HA dev, WebSocket API, and CI    |

---

## Translations

Data Points ships with both Home Assistant integration translations and frontend card/panel translations.

### Included locales

- English
- Finnish
- French 🤖
- German 🤖
- Spanish 🤖
- Portuguese 🤖
- Simplified Chinese 🤖

English is the source language. Finnish translations were written by a non-native speaker. All other bundled locales are machine-translated — they are usable defaults rather than fully reviewed translations. Improvements are very welcome.

- Integration/service strings: `custom_components/hass_datapoints/translations/*.json`
- Frontend component strings: `custom_components/hass_datapoints/src/**/i18n/`

---

## Roadmap

### Planned features

- **Multiple saved views** — persist more than one named chart-and-panel state for reusable investigation setups.
- **Automatic historical period matching** — find similar historical periods automatically so the panel can suggest or create date windows.
- **Chart-driven anomaly automation creation** — turn chart analysis settings into Home Assistant automations for live monitoring.
- **Automatic anomaly-to-datapoint generation** — generate datapoints when configured anomaly conditions are met.
- **Backfilling tools** — create datapoints from recent history and long-term statistics after the fact.
- **Anomalies summary card** — dedicated card for highlighting current anomalies with deep-links into the history view.
- **Drop-in replacements for HA sensor and statistics cards** — equivalents that support datapoint overlays and richer contextual controls.

### Themes

- **Operational memory** — preserve and reuse saved investigative contexts.
- **Assisted comparison** — reduce the manual work needed to find meaningful historical baselines.
- **From analysis to action** — let anomaly configuration graduate into automations and auto-generated datapoints.
- **Dashboard-native investigation** — bring anomaly surfacing into smaller cards for everyday dashboards.

---

## Installation

### HACS

1. Open HACS.
2. Go to **Integrations**.
3. Add this repository as a custom repository with category **Integration**.
4. Install **Data Points**.
5. Restart Home Assistant.

### Manual

Copy `custom_components/hass_datapoints` into:

```text
config/custom_components/hass_datapoints
```

Then restart Home Assistant.

---

## Setup

Add the integration from:

**Settings → Devices & Services → Add Integration → Data Points**

No YAML setup is required.

---

## Quick start

Record a datapoint from Developer Tools → Actions:

```yaml
action: hass_datapoints.record
data:
  message: "Heating schedule changed"
  entity_ids:
    - climate.living_room
    - sensor.living_room_temperature
  icon: mdi:radiator
  color: "#ff5722"
```

Then add the history card to a dashboard:

```yaml
type: custom:hass-datapoints-history-card
title: Living room
entities:
  - sensor.living_room_temperature
hours_to_show: 72
```

See [Recording Datapoints](docs/recording-datapoints.md) and [Cards & UI](docs/cards.md) for the full reference.
