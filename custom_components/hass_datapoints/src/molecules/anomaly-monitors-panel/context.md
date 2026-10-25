## Anomaly Monitors Panel

This directory owns the standalone anomaly monitor management surface rendered inside the datapoints panel overlay. The main entrypoint is [`anomaly-monitors-panel.ts`](/Users/ollie/Repos/HASS-Data-Points/custom_components/hass_datapoints/src/molecules/anomaly-monitors-panel/anomaly-monitors-panel.ts).

### Responsibilities

- Load persisted monitor records from the backend via `fetchMonitors()`.
- Render monitor cards, toggle/edit/delete actions, dismissal windows, and lazily fetched anomaly clusters.
- Open the anomaly monitor wizard for create/edit flows.
- Keep the list fresh from both local CRUD actions and external Home Assistant changes by subscribing to the backend `hass_datapoints_monitors_updated` event.

### Monitor card structure (#107 redesign)

Each card (`_renderMonitorCard`) is a structured shell, not the old sparkline row:

- **Header** (`.monitor-card-header`): `monitor-status-pill`, monitor name, a spacer,
  then the on/off control as a `button.monitor-switch[role="switch"][aria-checked]`
  (wired to `_onToggleEnabled`). Edit + delete live in `.monitor-header-actions` on wide
  cards; on narrow cards a container query hides them and shows the `.monitor-overflow`
  kebab (`.overflow-toggle`) that opens an `.overflow-menu` with the same edit/delete.
- **Body** (`.monitor-body`): a container-query grid — entity area (`_renderEntityDisplay`,
  unchanged; #108 will swap it for per-entity heatmap rows) beside the stats block on wide
  cards; stacked (stats first) when the card is narrow.
- **Stats block** (`_renderStatsBlock`): four stats from existing fields — Anomalous
  readings (latest `scan_history` count, tinted with the monitor's deterministic series
  colour from `COLORS`), Incidents (`active_cluster_count ?? last_cluster_count`), Last
  anomaly (`fmtRelativeTime`, or `—` when paused), and Checks every `<interval>` with a
  "Looks back `<lookback>`" caption.
- **Footer** (`.monitor-footer`): the trigger-logic sentence (`_triggerLogicLabel`:
  single-entity, or combined AND/OR from `overlap_mode`), a secondary "View series" action,
  and a prominent `.monitor-device-link` to the HA device (only when `device_id` is set).

Styling relies on HA theme vars + `color-mix` so cards read correctly in light and dark.

### Refresh behavior

- The panel still polls every 30 seconds as a safety net.
- Immediate consistency should come from the websocket event subscription, which reloads the list when a monitor is toggled or otherwise changed from outside this panel, such as from the Devices & Integrations view.

### Testing focus

- Subscribes to `hass_datapoints_monitors_updated` once `hass.connection` is available.
- Tears down the subscription on disconnect.
- Reloads monitor records when the backend pushes a monitor-updated event.
