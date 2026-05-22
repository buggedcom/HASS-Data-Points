/* Recording cookbook (with YAML snippets), monitors section, install. */

const { useState: rState } = React;

const recipes = [
  {
    id: "schedule",
    title: "Heating schedule changed",
    when: "input_select change",
    why: "Future temperature and energy charts will show a shift — this datapoint explains it.",
    yaml: `automation:
  - alias: Record heating mode change
    triggers:
      - trigger: state
        entity_id: input_select.heating_mode
    actions:
      - action: hass_datapoints.record
        data:
          message: "Heating mode → {{ trigger.to_state.state }}"
          annotation: "Captured automatically to explain later trends."
          entity_ids:
            - climate.living_room
            - sensor.living_room_temperature
            - sensor.daily_energy
          icon: mdi:radiator
          color: "#ef4444"`,
  },
  {
    id: "window",
    title: "Window left open > 15 min",
    when: "for: 00:15:00",
    why: "Explains temperature drops and radiator compensation events on the same chart.",
    yaml: `automation:
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
          entity_ids:
            - binary_sensor.bedroom_window
            - sensor.bedroom_temperature
          icon: mdi:window-open-variant
          color: "#f59e0b"`,
  },
  {
    id: "maintenance",
    title: "HVAC filter replaced",
    when: "Event bus event",
    why: "Compare airflow, stability, and energy use before and after service in a single chart.",
    yaml: `automation:
  - alias: Record HVAC maintenance
    triggers:
      - trigger: event
        event_type: hvac_filter_replaced
    actions:
      - action: hass_datapoints.record
        data:
          message: "HVAC filter replaced"
          annotation: "Use for before/after airflow and energy comparison."
          entity_ids:
            - climate.downstairs
            - sensor.daily_energy
          icon: mdi:wrench
          color: "#10b981"`,
  },
  {
    id: "threshold",
    title: "Humidity above 75%",
    when: "numeric_state threshold",
    why: "Captures the window that explains future ventilation response and recovery times.",
    yaml: `automation:
  - alias: Record high humidity
    triggers:
      - trigger: numeric_state
        entity_id: sensor.bathroom_humidity
        above: 75
    actions:
      - action: hass_datapoints.record
        data:
          message: "Bathroom humidity > 75%"
          entity_ids:
            - sensor.bathroom_humidity
            - fan.bathroom_extract
          icon: mdi:water-percent
          color: "#3b82f6"`,
  },
];

// YAML syntax highlighter — tokenizer approach (escapes strings out of the way
// so subsequent regex passes don't mangle their contents).
function highlight(yaml) {
  yaml = yaml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return yaml
    .split("\n")
    .map((line) => {
      const strings = [];
      // wrap index in letters (S...E) so the digit-matcher below can't break the placeholder
      let s = line.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, (m) => {
        strings.push(m);
        return `\u0001S${strings.length - 1}E\u0002`;
      });

      // key:  (optionally preceded by indent + `- `)
      s = s.replace(
        /^(\s*-?\s*)([a-z_][a-z0-9_]*)(:)/i,
        '$1<span class="k">$2</span>$3'
      );

      // mdi:foo-bar (icons)
      s = s.replace(/\b(mdi:[a-z0-9-]+)\b/g, '<span class="v">$1</span>');

      // entity ids like sensor.foo / climate.bar_baz
      s = s.replace(/\b([a-z_]+\.[a-z_0-9.]+)\b/g, '<span class="e">$1</span>');

      // bare numbers (avoiding numbers inside words)
      s = s.replace(
        /(^|[^\w-])(\d+(?:\.\d+)?)(?![\w-])/g,
        '$1<span class="n">$2</span>'
      );

      // restore strings, with template-expression highlighting inside
      s = s.replace(/\u0001S(\d+)E\u0002/g, (_, i) => {
        const raw = strings[+i];
        const tpl = raw.replace(
          /(\{\{[^}]+\}\})/g,
          '</span><span class="t">$1</span><span class="s">'
        );
        return `<span class="s">${tpl}</span>`;
      });

      return s;
    })
    .join("\n");
}

function Cookbook() {
  const [active, setActive] = rState(recipes[0]);
  const [copied, setCopied] = rState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <section className="section" id="recording">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Recording datapoints
          </div>
          <h2>Capture what changed. Explain the chart later.</h2>
          <p className="lead">
            <code className="mono">hass_datapoints.record</code> is an action
            you can call from automations, scripts, dashboards, or Developer
            Tools. The most valuable datapoints describe state changes, intent,
            or operating-mode transitions — not raw readings.
          </p>
        </div>

        <div className="recipe-tabs">
          {recipes.map((r) => (
            <button
              key={r.id}
              className={`recipe-tab ${r.id === active.id ? "is-active" : ""}`}
              onClick={() => setActive(r)}
            >
              {r.title}
            </button>
          ))}
        </div>

        <div className="recipe">
          <div className="recipe-card">
            <div className="when">{active.when}</div>
            <h4>{active.title}</h4>
            <p>{active.why}</p>
            <div
              className="card-title"
              style={{ marginTop: 18, marginBottom: 8 }}
            >
              Fields used
            </div>
            <ul className="bullets">
              <li>
                <b>message</b> — short, scan-friendly label
              </li>
              <li>
                <b>annotation</b> — longer context for future-you
              </li>
              <li>
                <b>entity_ids</b> — link the exact entities you'll inspect later
              </li>
              <li>
                <b>icon</b> &amp; <b>color</b> — make patterns easy to spot in
                charts
              </li>
            </ul>
          </div>
          <div className="code">
            <button className="copy-btn" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
            <div dangerouslySetInnerHTML={{ __html: highlight(active.yaml) }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- monitors mockup ----

function Monitors() {
  return (
    <section className="section" id="monitors">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Anomaly monitors
          </div>
          <h2>Promote any anomaly to a Home Assistant device.</h2>
          <p className="lead">
            When you find a pattern worth watching, save it as an Anomaly
            Monitor. The integration registers a device with sensors and
            switches that automations and MCP consumers can read, and state
            attributes carry compact, restart-safe anomaly summaries.
          </p>
        </div>

        <div>
          <Monitor
            status="triggered"
            name="Radiator temperature drift"
            meta="Downstairs Hallway Radiator · Dining Room Apple Tree"
            anomalies={38}
            clusters={4}
            barCount={9}
            barsLit={6}
            lastTrigger="2h ago"
            scan="30 min"
          />
          <Monitor
            status="healthy"
            name="Apple tree temperature"
            meta="Dining Room Apple Tree"
            anomalies={3}
            clusters={0}
            barCount={9}
            barsLit={3}
            lastTrigger="6d ago"
            scan="15 min"
          />
          <Monitor
            status="warning"
            name="Battery degradation"
            meta="Downstairs Hallway Radiator Battery"
            anomalies={9}
            clusters={1}
            barCount={9}
            barsLit={5}
            lastTrigger="8h ago"
            scan="6 h"
          />
          <Monitor
            status="paused"
            name="Valve opening anomalies"
            meta="Downstairs Hallway Valve · Upstairs Hallway Valve"
            anomalies={11}
            clusters={2}
            barCount={9}
            barsLit={4}
            lastTrigger="paused"
            scan="1 h"
          />
        </div>

        {/* HA entity screenshot — shows what the monitor exposes as a device in HA */}
        <div className="monitor-entity-row">
          <div className="monitor-entity-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              IN HOME ASSISTANT
            </div>
            <h3>
              Every monitor becomes a real device. With sensors. And switches.
            </h3>
            <p
              style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6 }}
            >
              Click into any monitor's entity card and you'll see HA's standard
              activity timeline — with the monitor's{" "}
              <b style={{ color: "var(--fg)" }}>current state</b>, a
              <b style={{ color: "var(--fg)" }}> history bar</b> showing healthy
              vs. triggered windows, and a full{" "}
              <b style={{ color: "var(--fg)" }}>activity feed</b> of detection
              events. Trigger automations from state changes, pause monitoring
              via the toggle, or expose the entity to MCP consumers — everything
              you can do with a native HA device is available here.
            </p>
            <ul className="bullets" style={{ marginTop: 16 }}>
              <li>
                <b>State entity</b> reflects current detection result (triggered
                / healthy)
              </li>
              <li>
                <b>Enable / disable switch</b> for pausing without losing config
              </li>
              <li>
                <b>Attributes</b> carry compact anomaly summaries —
                restart-safe, bounded
              </li>
              <li>
                <b>WebSocket payload</b> available to the panel for richer
                cluster detail
              </li>
            </ul>
          </div>
          <div className="monitor-entity-img">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">
                Home Assistant · anomaly monitor entity card
              </span>
            </div>
            <img
              src="images/activity-feed.png"
              alt="Anomaly monitor exposed as a Home Assistant entity with current state, history bar, and activity feed"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Monitor({
  status,
  name,
  meta,
  anomalies,
  clusters,
  barCount,
  barsLit,
  lastTrigger,
  scan,
}) {
  const bars = Array.from({ length: barCount }, (_, i) => (
    <i
      key={i}
      className={i < barsLit ? "active" : ""}
      style={{
        height: `${6 + (Math.sin(i + barCount) * 0.5 + 0.5) * 22}px`,
      }}
    ></i>
  ));
  return (
    <div className="monitor-mock">
      <span className={`status-pill ${status}`}>
        <span className="d"></span>
        {status}
      </span>
      <div className="monitor-title">
        <div className="t">{name}</div>
        <div className="m">{meta}</div>
      </div>
      <div className={`monitor-bars ${status}`}>{bars}</div>
      <div className="monitor-stat">
        <div className="v">{anomalies}</div>
        <div className="l">Anomalies</div>
      </div>
      <div className="monitor-stat">
        <div className="v">{clusters}</div>
        <div className="l">Clusters · {lastTrigger}</div>
      </div>
    </div>
  );
}

// ---- install ----

function Install() {
  return (
    <section className="section" id="install">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Get started
          </div>
          <h2>Up and running in five minutes.</h2>
          <p className="lead">
            The integration bundles its own Lovelace cards and panel — no
            separate resource configuration. Pick HACS for the easy path, or
            copy the component manually.
          </p>
        </div>

        <div className="install-grid">
          <div className="install-card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              <span className="dot"></span> Recommended
            </div>
            <h3>Install via HACS</h3>
            <p className="muted">
              The Home Assistant Community Store handles updates and dependency
              tracking.
            </p>
            <ol>
              <li>Open HACS in Home Assistant.</li>
              <li>
                Go to <b>Integrations</b>.
              </li>
              <li>
                Add this repo as a custom repository, category{" "}
                <b>Integration</b>.
              </li>
              <li>
                Install <b>Data Points</b>.
              </li>
              <li>Restart Home Assistant.</li>
              <li>
                Settings → Devices &amp; Services → Add Integration →{" "}
                <b>Data Points</b>.
              </li>
            </ol>
          </div>

          <div className="install-card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              <span className="dot"></span> Manual
            </div>
            <h3>Copy the component</h3>
            <p className="muted">
              Useful for offline installs or if you prefer to vendor
              integrations directly.
            </p>
            <div className="code" style={{ marginTop: 18 }}>
              {`config/
└── custom_components/
    └── hass_datapoints/   ← copy this folder`}
            </div>
            <p style={{ marginTop: 18 }} className="muted">
              Then restart Home Assistant and add the integration from{" "}
              <b className="fg">Settings → Devices &amp; Services</b>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Cookbook = Cookbook;
window.Monitors = Monitors;
window.Install = Install;
