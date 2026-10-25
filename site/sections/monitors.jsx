/* Anomaly monitors — what, why, how, the HA devices they create, events and automations */

const MON_METHODS = [
  ["trend", "Trend deviation"],
  ["sudden", "Sudden change"],
  ["iqr", "Statistical outlier (IQR)"],
  ["zscore", "Rolling Z-score"],
  ["flat", "Flat-line / stuck value"],
  ["window", "Comparison window"],
  ["similar", "Similar entity deviation"],
];
const MON_ENTS = [
  {
    id: "a",
    name: "Hallway radiator valve",
    eid: "sensor.hallway_radiator_valve",
    area: "Hallway ▸ Tado TRV",
  },
  {
    id: "b",
    name: "Living room temperature",
    eid: "sensor.living_room_temperature",
    area: "Living room ▸ Aqara TH",
  },
];
const MON_DEVICE_ENTITIES = 9;

function MonitorWizardDemo() {
  const [step, setStep] = React.useState(0);
  const [tab, setTab] = React.useState("a");
  const [cfg, setCfg] = React.useState({
    a: { trend: true, sudden: true },
    b: { trend: true, flat: true },
  });
  const [mode, setMode] = React.useState("individual");
  const [overlap, setOverlap] = React.useState("all");
  const [sens, setSens] = React.useState({ a: "Medium", b: "High" });
  const rules = Object.values(cfg).reduce(
    (n, c) => n + Object.values(c).filter(Boolean).length,
    0
  );
  const devices =
    mode === "individual" ? MON_ENTS.map((e) => e.name) : ["Hallway comfort"];
  const toggle = (m) =>
    setCfg((c) => ({ ...c, [tab]: { ...c[tab], [m]: !c[tab][m] } }));
  const steps = ["Entities", "Analysis", "Schedule"];
  const copy = [
    {
      h: "Pick what to watch.",
      p: "Choose one or more entities from the standard Home Assistant entity picker, with area and device shown for each. Selecting several lets you decide later whether they become separate monitors or one combined monitor.",
    },
    {
      h: "Tune detection per entity.",
      p: "Each entity gets its own tab with its own sensitivity and methods, so a noisy valve and a steady thermostat are not forced to share settings. Methods with options (trend method and window, minimum flat duration) open inline. “Copy from” clones one entity's setup to another.",
    },
    {
      h: "Schedule it and decide its shape.",
      p: "Set how much history each scan reads (look-back) and how often it runs (scan interval). With several entities, create individual monitors or one combined monitor. A combined monitor flags only when all entities are anomalous together (AND), or when any one is (OR).",
    },
  ];
  return (
    <div className="wiz">
      <div className="wiz-copy">
        <div className="wiz-steps" role="tablist">
          {steps.map((s, i) => (
            <button
              key={s}
              role="tab"
              aria-selected={step === i}
              className={
                "wiz-step" +
                (step === i ? " is-active" : "") +
                (i < step ? " is-done" : "")
              }
              onClick={() => setStep(i)}
            >
              <span className="n">{i + 1}</span>
              {s}
            </button>
          ))}
        </div>
        <h3>{copy[step].h}</h3>
        <p>{copy[step].p}</p>
        <div className="wiz-out">
          <div className="card-title" style={{ color: "var(--accent)" }}>
            Creates in Home Assistant
          </div>
          {devices.map((d) => (
            <div key={d} className="wiz-dev">
              <span className="wiz-dev-ic"></span>
              <div style={{ minWidth: 0 }}>
                <b>{d}</b>
                <span>
                  <span>Anomaly Monitor device</span> · {MON_DEVICE_ENTITIES}{" "}
                  <span>entities</span>
                </span>
              </div>
            </div>
          ))}
          <div className="wiz-sum">
            <span>{devices.length}</span>{" "}
            <span>{devices.length === 1 ? "device" : "devices"}</span> ·{" "}
            <span>{rules}</span>{" "}
            <span>{rules === 1 ? "detection rule" : "detection rules"}</span>
            {mode === "combined" && (
              <span data-no-i18n=""> · {overlap === "all" ? "AND" : "OR"}</span>
            )}
          </div>
        </div>
      </div>
      <div className="wiz-ui">
        <div className="wiz-ui-head">
          <b>New anomaly monitor</b>
          <span>
            <span>Step</span> {step + 1}/3 · <span>{steps[step]}</span>
          </span>
        </div>
        <div className="wiz-ui-body">
          {step === 0 && (
            <div className="wiz-ents">
              <div className="wiz-ents-h">
                <span>Entities</span>: {MON_ENTS.length}
              </div>
              {MON_ENTS.map((e) => (
                <div key={e.id} className="wiz-ent">
                  <span className="wiz-ent-ic"></span>
                  <div>
                    <b>{e.name}</b>
                    <span>{e.area}</span>
                  </div>
                </div>
              ))}
              <div className="wiz-search">Search entities…</div>
            </div>
          )}
          {step === 1 && (
            <div>
              <div className="wiz-tabs">
                {MON_ENTS.map((e) => (
                  <button
                    key={e.id}
                    className={"wiz-tab" + (tab === e.id ? " is-active" : "")}
                    onClick={() => setTab(e.id)}
                  >
                    {e.name}
                    <span className="cnt">
                      {Object.values(cfg[e.id]).filter(Boolean).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="wiz-field">
                <span>Sensitivity</span>
                <div className="seg">
                  {["Low", "Medium", "High"].map((s) => (
                    <button
                      key={s}
                      className={sens[tab] === s ? "is-active" : ""}
                      onClick={() => setSens((x) => ({ ...x, [tab]: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wiz-methods">
                {MON_METHODS.map(([k, l]) => (
                  <label
                    key={k}
                    className={"wiz-check" + (cfg[tab][k] ? " on" : "")}
                  >
                    <input
                      type="checkbox"
                      checked={!!cfg[tab][k]}
                      onChange={() => toggle(k)}
                    />
                    <span className="box"></span>
                    {l}
                  </label>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="wiz-sched">
              <div className="wiz-grid2">
                <div className="wiz-field col">
                  <span>Look-back period</span>
                  <div className="wiz-select">24 hours</div>
                  <em>History each scan considers.</em>
                </div>
                <div className="wiz-field col">
                  <span>Scan interval</span>
                  <div className="wiz-select">30 minutes</div>
                  <em>How often the monitor re-evaluates.</em>
                </div>
              </div>
              <div className="wiz-field col">
                <span>Sensor type</span>
                <div className="wiz-grid2">
                  {[
                    [
                      "individual",
                      "Individual sensors",
                      "2 devices · one per entity",
                    ],
                    ["combined", "Combined sensor", "1 device · merged signal"],
                  ].map(([v, t, s]) => (
                    <button
                      key={v}
                      className={"wiz-radio" + (mode === v ? " is-active" : "")}
                      onClick={() => setMode(v)}
                    >
                      <span className="r"></span>
                      <div>
                        <b>{t}</b>
                        <span>{s}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {mode === "combined" && (
                <div className="wiz-field col">
                  <span>Overlap mode</span>
                  <div className="seg">
                    <button
                      className={overlap === "all" ? "is-active" : ""}
                      onClick={() => setOverlap("all")}
                    >
                      All anomalies overlap
                    </button>
                    <button
                      className={overlap === "any" ? "is-active" : ""}
                      onClick={() => setOverlap("any")}
                    >
                      Any anomaly from any series
                    </button>
                  </div>
                  <em>
                    {overlap === "all"
                      ? "Fewer alerts, more likely to be real."
                      : "More alerts, some may be noise."}
                  </em>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="wiz-ui-foot">
          <button
            className="btn btn--ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              className="btn btn--primary"
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => setStep(0)}>
              {devices.length > 1
                ? `Create ${devices.length} anomaly monitors`
                : "Create anomaly monitor"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function monHeat(seed, intensity, n = 60) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = Math.max(
      0,
      Math.sin(i * 0.37 + seed) * Math.sin(i * 0.11 + seed * 2) -
        (1 - intensity)
    );
    out.push(v > 0.05 ? Math.min(1, v * 2.4) : 0);
  }
  return out;
}

function MonCard({
  status,
  name,
  ents,
  logic,
  readings,
  incidents,
  last,
  every,
  back,
  seed,
  intensity,
}) {
  const rows = ents.map((e, i) => ({
    ...e,
    heat: monHeat(seed + i * 1.7, intensity * (i ? 0.75 : 1)),
  }));
  const tot = rows.map((r) => r.heat.reduce((a, b) => a + b, 0));
  const sum = tot.reduce((a, b) => a + b, 0) || 1;
  let left = readings;
  rows.forEach((r, i) => {
    r.count =
      i === rows.length - 1 ? left : Math.round((readings * tot[i]) / sum);
    left -= r.count;
  });
  return (
    <div className="mon-card">
      <div className="mon-card-h">
        <span className={`status-pill ${status}`}>
          <span className="d"></span>
          {status}
        </span>
        <b>{name}</b>
        <span style={{ flex: 1 }}></span>
        <span
          className={"mon-toggle" + (status === "paused" ? "" : " on")}
          aria-hidden="true"
        ></span>
      </div>
      <div className="mon-card-b">
        <div className="mon-rows">
          {rows.map((r) => (
            <div key={r.eid} className="mon-row">
              <div className="mon-row-n">
                <b>{r.name}</b>
                <span className="mono">{r.eid}</span>
              </div>
              <div className="mon-heat">
                {r.heat.map((v, i) => (
                  <i
                    key={i}
                    style={{
                      opacity: v ? 0.25 + v * 0.75 : 1,
                      background: v ? "var(--anomaly)" : undefined,
                    }}
                  ></i>
                ))}
              </div>
              <div className="mon-row-c mono">{r.count}</div>
            </div>
          ))}
          <div className="mon-axis mono">
            <span>20 Mar</span>
            <span>10 Apr</span>
            <span>1 May</span>
            <span>19 May</span>
          </div>
        </div>
        <div className="mon-stats">
          <div>
            <span>Anomalous readings</span>
            <b style={{ color: readings ? "var(--anomaly)" : undefined }}>
              {readings}
            </b>
            <em>Flagged in range</em>
          </div>
          <div>
            <span>Incidents</span>
            <b>{incidents}</b>
            <em>Groups of nearby readings</em>
          </div>
          <div>
            <span>Last anomaly</span>
            <b>{status === "paused" ? "—" : last}</b>
            {status === "paused" && <em>Monitor paused</em>}
          </div>
          <div>
            <span>Checks every</span>
            <b>{every}</b>
            <em>Looks back {back}</em>
          </div>
        </div>
      </div>
      <div className="mon-card-f">
        <span>
          {logic ? (
            <>
              Triggers when{" "}
              <b>{logic === "AND" ? "all entities" : "any entity"}</b> is
              anomalous ({logic})
            </>
          ) : (
            "Single-entity monitor"
          )}
        </span>
        <span className="mon-link">Open HASS Datapoints device ↗</span>
      </div>
    </div>
  );
}

const MON_ENTITY_ROWS = [
  [
    "Controls",
    "switch",
    "Enabled",
    "on / off",
    "Pause scanning without losing configuration. Automations can toggle it, for example to mute a monitor while you are on holiday.",
  ],
  [
    "Sensors",
    "sensor",
    "<Monitor name>",
    "0",
    "The main sensor. State is the number of active anomaly clusters from the latest scan. Attributes carry methods, sensitivity, look-back, active cluster summaries (start, end, method, max deviation, point count), last scan and dismissed windows.",
  ],
  [
    "Sensors",
    "sensor",
    "Consecutive anomalous scans",
    "3 scans",
    "How many scans in a row have found an anomaly. Use it to ignore one-off blips and act on persistent problems.",
  ],
  [
    "Sensors",
    "sensor",
    "Anomaly duration",
    "90 min",
    "How long the current anomaly has lasted (consecutive scans × scan interval). 0 when healthy.",
  ],
  [
    "Sensors",
    "sensor",
    "Last anomaly detected",
    "timestamp",
    "When the monitor last moved from healthy to anomalous.",
  ],
  [
    "Sensors",
    "sensor",
    "Data points in last scan",
    "412 points",
    "How much history the last scan actually read. A sudden drop points at a sensor or recorder problem.",
  ],
  [
    "Sensors",
    "binary_sensor",
    "Problem",
    "Yes / No",
    "On when the monitor itself is unhealthy: it has stalled, or the last scan had fewer than 3 data points.",
  ],
  [
    "Sensors",
    "binary_sensor",
    "Stalled",
    "Yes / No",
    "On when an enabled monitor has not scanned within twice its scan interval.",
  ],
  [
    "Diagnostic",
    "sensor",
    "Last scan",
    "timestamp",
    "Time of the most recent scan. Disabled by default; enable it from the device page (“+1 disabled entity”).",
  ],
];

const MON_YAML = {
  notify: `alias: Tell me when a monitor trips
triggers:
  - trigger: event
    event_type: hass_datapoints_anomaly_detected
actions:
  - action: notify.mobile_app_phone
    data:
      title: "Anomaly: {{ trigger.event.data.monitor_name }}"
      message: "{{ trigger.event.data.cluster_count }} cluster(s) found"
  - action: hass_datapoints.record
    data:
      message: "Anomaly flagged by {{ trigger.event.data.monitor_name }}"
      icon: mdi:alert-circle
      color: "#ef4444"`,
  persist: `alias: Escalate persistent anomalies
triggers:
  - trigger: numeric_state
    entity_id: sensor.radiator_drift_consecutive_anomalous_scans
    above: 3
actions:
  - action: climate.set_hvac_mode
    target:
      entity_id: climate.hallway_radiator
    data:
      hvac_mode: "off"`,
  health: `alias: Monitor health check
triggers:
  - trigger: state
    entity_id: binary_sensor.radiator_drift_problem
    to: "on"
    for: "01:00:00"
actions:
  - action: persistent_notification.create
    data:
      title: Anomaly monitor needs attention
      message: "Radiator drift has stalled or is short of data."`,
  dash: `type: conditional
conditions:
  - condition: numeric_state
    entity: sensor.hass_data_points_anomaly_monitors_active
    above: 0
card:
  type: entities
  title: Active anomalies
  entities:
    - sensor.hass_data_points_anomaly_monitors_active`,
};

function yamlHL(src) {
  return src.split("\n").map((line, i) => {
    const m = line.match(/^(\s*-?\s*)([\w.]+)(:)(.*)$/);
    if (!m) return <div key={i}>{line || " "}</div>;
    const v = m[4];
    const cls = /\{\{/.test(v)
      ? "t"
      : /^\s*["']/.test(v)
        ? "s"
        : /^\s*-?\d/.test(v)
          ? "n"
          : /^\s*mdi:/.test(v)
            ? "v"
            : /^\s*\w+\.\w+/.test(v)
              ? "e"
              : "";
    return (
      <div key={i}>
        {m[1]}
        <span className="k">{m[2]}</span>
        {m[3]}
        <span className={cls}>{v}</span>
      </div>
    );
  });
}

function Monitors() {
  const [yamlTab, setYamlTab] = React.useState("notify");
  return (
    <section className="section" id="monitors">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Anomaly monitors
          </div>
          <h2>Detection that keeps running after you close the panel.</h2>
          <p className="lead">
            Anomaly overlays in the panel answer “what looks wrong in this
            range?” while you are looking. An anomaly monitor asks the same
            question on a schedule, in the background, forever. Each monitor
            becomes a Home Assistant device with a switch, sensors and binary
            sensors, and fires events when anomalies start and stop, so
            automations, dashboards and AI assistants can react.
          </p>
        </div>

        <div className="mon-why">
          <div>
            <div className="card-title">Why</div>
            <h4>Problems rarely happen while you are watching.</h4>
            <p>
              A stuck sensor, a radiator that stops heating or a freezer
              drifting warm usually goes unnoticed for days. A monitor catches
              it within one scan interval.
            </p>
          </div>
          <div>
            <div className="card-title">What</div>
            <h4>Your panel analysis, saved and scheduled.</h4>
            <p>
              The same seven detection methods, sensitivity and trend settings
              you use in the panel, applied to a rolling look-back window every
              15 minutes to 6 hours.
            </p>
          </div>
          <div>
            <div className="card-title">How</div>
            <h4>Native Home Assistant entities and events.</h4>
            <p>
              No YAML to write and no template sensors to maintain. Trigger on
              events, states or attributes exactly as you would with any other
              device.
            </p>
          </div>
        </div>

        <div className="mon-sub">
          <h3>Create one in three steps</h3>
          <p>
            In the panel, open <b>Anomaly monitors</b> and choose{" "}
            <b>New monitor</b>, or save the anomaly configuration you are
            already looking at. Try the wizard below.
          </p>
        </div>
        <MonitorWizardDemo />

        <div className="mon-sub">
          <h3>See every monitor at a glance</h3>
          <p>
            The list shows each monitor's status, its entities, and a heatmap of
            when anomalous readings occurred across the selected date range,
            with a per-entity count. Readings close together are grouped into{" "}
            <b>incidents</b>, so one bad afternoon counts once. Filter by entity
            to find every monitor that watches a sensor, pause with the toggle,
            edit, delete with undo, or jump straight to the monitor's device.
          </p>
        </div>
        <div className="mon-list">
          <MonCard
            status="triggered"
            name="Hallway comfort"
            logic="AND"
            readings={38}
            incidents={4}
            last="2 h ago"
            every="30 min"
            back="24 h"
            seed={1.2}
            intensity={0.55}
            ents={[
              {
                name: "Hallway radiator valve",
                eid: "sensor.hallway_radiator_valve",
              },
              {
                name: "Living room temperature",
                eid: "sensor.living_room_temperature",
              },
            ]}
          />
          <MonCard
            status="healthy"
            name="Freezer temperature"
            readings={3}
            incidents={1}
            last="6 d ago"
            every="15 min"
            back="12 h"
            seed={4.1}
            intensity={0.2}
            ents={[
              {
                name: "Freezer temperature",
                eid: "sensor.freezer_temperature",
              },
            ]}
          />
          <MonCard
            status="paused"
            name="Valve battery"
            readings={9}
            incidents={2}
            last="—"
            every="6 h"
            back="7 d"
            seed={2.6}
            intensity={0.35}
            ents={[
              {
                name: "Hallway radiator battery",
                eid: "sensor.hallway_radiator_battery",
              },
            ]}
          />
        </div>

        <div className="monitor-entity-row">
          <div className="monitor-entity-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              IN HOME ASSISTANT
            </div>
            <h3>Every monitor is a real device.</h3>
            <p
              style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6 }}
            >
              Monitors appear under{" "}
              <b style={{ color: "var(--fg)" }}>
                Settings → Devices &amp; services → Hass Data Points
              </b>{" "}
              as
              <b style={{ color: "var(--fg)" }}> Anomaly Monitor</b> devices,
              connected via the main integration device. The device page gives
              you the usual controls, sensors, activity log, and one-click
              automations, scenes and scripts.
            </p>
            <p
              style={{
                color: "var(--fg-mute)",
                fontSize: 16,
                lineHeight: 1.6,
                marginBottom: 0,
              }}
            >
              The integration device also gains{" "}
              <span className="mono" style={{ color: "var(--fg)" }}>
                Anomaly monitors active
              </span>
              , a single sensor that counts enabled monitors currently reporting
              anomalies. One entity is enough for a dashboard badge or a
              “something is wrong at home” notification.
            </p>
          </div>
          <div className="monitor-entity-img">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">
                Settings › Devices › Anomaly Monitor
              </span>
            </div>
            <img
              src="images/anomaly-monitor-device.png"
              alt="Anomaly monitor device page in Home Assistant showing the Enabled switch, sensors and activity"
            />
          </div>
        </div>

        <div
          className="ent-table"
          role="table"
          aria-label="Entities created per anomaly monitor"
        >
          <div className="ent-tr ent-th" role="row">
            <span>Entity</span>
            <span>Platform</span>
            <span>Example</span>
            <span>What it is for</span>
          </div>
          {MON_ENTITY_ROWS.map(([grp, plat, name, ex, desc]) => (
            <div key={name} className="ent-tr" role="row">
              <span>
                <b>{name}</b>
                <em>{grp}</em>
              </span>
              <span className="mono">{plat}</span>
              <span className="mono">{ex}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>

        <div className="mon-events">
          <div className="mon-events-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              EVENTS &amp; AUTOMATIONS
            </div>
            <h3>React the moment something changes.</h3>
            <p>
              Monitors fire two events on the Home Assistant event bus, only on
              transitions, so you are not spammed every scan:
            </p>
            <ul className="bullets">
              <li>
                <span>
                  <span className="mono">hass_datapoints_anomaly_detected</span>{" "}
                  when a healthy monitor finds anomalies. Includes monitor id
                  and name, entity id(s), cluster count, cluster summaries and
                  consecutive anomalous scans.
                </span>
              </li>
              <li>
                <span>
                  <span className="mono">hass_datapoints_anomaly_resolved</span>{" "}
                  when it returns to healthy, with the clusters that just
                  resolved.
                </span>
              </li>
            </ul>
            <p style={{ marginTop: 14 }}>
              Combine them with the device's sensors to notify, escalate, record
              a datapoint, or switch something off.
            </p>
          </div>
          <div>
            <div className="recipe-tabs">
              {[
                ["notify", "Notify + record"],
                ["persist", "Escalate"],
                ["health", "Monitor health"],
                ["dash", "Dashboard"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  className={"recipe-tab" + (yamlTab === k ? " is-active" : "")}
                  onClick={() => setYamlTab(k)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="code mon-code">{yamlHL(MON_YAML[yamlTab])}</div>
            <div className="mon-fine">
              Entity IDs are generated from your monitor's name; check the
              device page for the exact IDs.
            </div>
          </div>
        </div>

        <div className="mon-sub">
          <h3>Built to run unattended</h3>
        </div>
        <div className="mon-robust">
          <div>
            <h4>Dismiss known periods</h4>
            <p>
              Mark a time window as expected (a party, a deliberate heating
              test) and clusters inside it stop counting, without retuning the
              monitor.
            </p>
          </div>
          <div>
            <h4>Direction filters</h4>
            <p>
              Per method, keep only upward, only downward, or both kinds of
              deviation. Watch a freezer for warming without alerts when it
              pulls colder.
            </p>
          </div>
          <div>
            <h4>Downsample before detecting</h4>
            <p>
              Optionally resample history to a fixed interval using mean, min,
              max, median, first or last before scanning. Dense sensors scan
              faster with less noise.
            </p>
          </div>
          <div>
            <h4>Gentle on Home Assistant</h4>
            <p>
              Scans start staggered, share a concurrency limit and a 30-second
              timeout, and run off the event loop. Results are cached and warmed
              at startup.
            </p>
          </div>
          <div>
            <h4>Restart-safe</h4>
            <p>
              Configuration, scan history and cluster summaries persist across
              restarts. Attributes are bounded to the 25 most recent clusters so
              the recorder stays lean.
            </p>
          </div>
          <div>
            <h4>Recoverable deletes</h4>
            <p>
              Deleting a monitor offers an undo; deleted monitors are kept for
              30 days and their entities do not come back on reboot.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Monitors = Monitors;
