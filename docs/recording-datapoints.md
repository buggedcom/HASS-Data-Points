# Recording Datapoints

Datapoints are timestamped annotations you create from automations, scripts, dashboards, or Developer Tools. They appear as markers on charts and in the list card, giving you a record of what changed and why.

---

## The `hass_datapoints.record` action

Use this action wherever you can call a Home Assistant action:

- automations
- scripts
- dashboards
- **Developer Tools → Actions**

### Action fields

| Field        | Required | Description                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------- |
| `message`    | Yes      | Short label shown in lists, chips, chart tooltips, and the logbook.                    |
| `annotation` | No       | Longer note or context. Defaults to the message when omitted.                          |
| `entity_ids` | No       | Entities related to the datapoint. These are the most useful links for chart analysis. |
| `icon`       | No       | MDI icon used for the datapoint marker and related UI.                                 |
| `color`      | No       | Marker color. Accepts a hex string or an RGB list.                                     |

### Minimal example

```yaml
action: hass_datapoints.record
data:
  message: "Something happened"
```

### Full example

```yaml
action: hass_datapoints.record
data:
  message: "Heating schedule changed"
  annotation: >-
    Switched the house to the weekday daytime profile after school pickup.
    This was done manually because the normal automation was paused.
  entity_ids:
    - climate.living_room
    - sensor.living_room_temperature
  icon: mdi:radiator
  color: "#ff5722"
```

### RGB color example

```yaml
action: hass_datapoints.record
data:
  message: "Critical alert"
  color:
    - 255
    - 0
    - 0
```

---

## How datapoints appear

When a datapoint is recorded:

1. It is stored in `.storage/hass_datapoints.events`.
2. It is emitted on the HA event bus as `hass_datapoints_event_recorded`.
3. It appears in the Home Assistant logbook.
4. It becomes available to the cards and history page.

### Chart placement behavior

On history and statistics charts, datapoints are placed:

- on the related visible series when linked to a visible target
- on the chart baseline when linked to something not currently charted
- on a fallback position when they are global and have no explicit series link

On the sensor card, datapoints are drawn directly on the sensor series.

---

## Using automations to create useful analytical datapoints

Datapoints are most valuable when they explain future chart behavior.

The best automations record changes in state, intent, or operating mode rather than just mirroring every raw metric update.

### Good datapoints to automate

Automate datapoints for events like:

- heating mode changes
- occupancy transitions
- windows or doors open for long periods
- maintenance actions
- manual overrides
- pump, fan, HVAC, or schedule changes
- tariff or price mode changes
- threshold crossings that explain later anomalies
- weather-driven operational mode changes

### Good analytical habits

Prefer datapoints that answer:

- what changed
- why it changed
- what system it affected
- whether it was manual or automatic
- what later chart behavior it might explain

### Recommended message style

Keep `message` short and scan-friendly:

- `Heating switched to away mode`
- `Bedroom window opened`
- `Filter replaced`
- `Boiler restarted`

Put the detailed context in `annotation`:

- who triggered it
- why it happened
- expected duration
- what behavior to compare against later

### Best practice for related items

When an automation records a datapoint for analysis:

- link it to the exact entities you expect to inspect later
- include the primary measured series plus the controlling entity when possible
- use a clear icon and color to make patterns easy to spot in charts and lists

For example, if you are investigating heating behavior, link the datapoint to:

- the climate entity
- the relevant room temperature sensor
- any related window or valve entity

---

## Automation examples

### Record when a window stays open

```yaml
automation:
  - alias: Record long window opening
    triggers:
      - trigger: state
        entity_id: binary_sensor.bedroom_window
        to: "on"
        for: "00:15:00"
    actions:
      - action: hass_datapoints.record
        data:
          message: "Bedroom window open > 15 min"
          annotation: "May explain a temperature drop or radiator compensation."
          entity_ids:
            - binary_sensor.bedroom_window
            - sensor.bedroom_temperature
          icon: mdi:window-open-variant
          color: "#f59e0b"
```

### Record heating profile changes

```yaml
automation:
  - alias: Record heating schedule change
    triggers:
      - trigger: state
        entity_id: input_select.heating_mode
    actions:
      - action: hass_datapoints.record
        data:
          message: "Heating mode changed to {{ trigger.to_state.state }}"
          annotation: "Captured automatically to explain later temperature and energy trends."
          entity_ids:
            - climate.living_room
            - sensor.living_room_temperature
            - sensor.daily_energy
          icon: mdi:radiator
          color: "#ef4444"
```

### Record maintenance

```yaml
automation:
  - alias: Record HVAC maintenance completion
    triggers:
      - trigger: event
        event_type: hvac_filter_replaced
    actions:
      - action: hass_datapoints.record
        data:
          message: "HVAC filter replaced"
          annotation: "Use this to compare airflow, temperature stability, and energy use before and after service."
          entity_ids:
            - climate.downstairs
            - sensor.daily_energy
          icon: mdi:wrench
          color: "#10b981"
```

### Record threshold crossings that explain anomalies later

```yaml
automation:
  - alias: Record high humidity period
    triggers:
      - trigger: numeric_state
        entity_id: sensor.bathroom_humidity
        above: 75
    actions:
      - action: hass_datapoints.record
        data:
          message: "Bathroom humidity above 75%"
          annotation: "Useful for comparing ventilation response and recovery time."
          entity_ids:
            - sensor.bathroom_humidity
            - fan.bathroom_extract
          icon: mdi:water-percent
          color: "#3b82f6"
```

### Combining automations with anomaly detection

The most useful combination is:

1. automate datapoints for state changes or interventions
2. use anomaly detection to find unusual sensor behavior
3. compare the anomaly regions against your recorded datapoints
4. save date windows around known good and bad periods for future comparison

That gives you both the signal and the likely explanation. See [History & Analysis](./history-and-analysis.md) for more on anomaly detection and date windows.
