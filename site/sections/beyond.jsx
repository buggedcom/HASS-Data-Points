/* Beyond Anomalies — datapoints as a general-purpose event annotation system.
   Shows manual capture surfaces, mock list card, and varied use cases. */

const { useState: bState } = React;
const PointIcon = window.PointIcon;

const beyondUseCases = [
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14.7 6.3a4 4 0 11-5.4-5.4l2.7 2.7L9.3 6.3M4 20l4.5-4.5M14 13l7 7" />
      </svg>
    ),

    title: "Maintenance log",
    body: "Filter replaced, boiler serviced, water softener salted, sensor batteries swapped. The chart explains the gap, you explain the chart.",
    examples: [
      "Annual boiler service",
      "Water softener refilled",
      "Smoke detector battery",
    ],
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),

    title: "Travel & occupancy",
    body: "Away for the weekend, guests over for a week, kids back from college. Future-you investigating an energy spike will thank present-you.",
    examples: ["Away · 14–21 Apr", "Guests of 4 staying", "Back home"],
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
      </svg>
    ),

    title: "Operational changes",
    body: "Tariff switched, schedule overridden, manual zone set. Anything you'd answer 'what changed' with three months later.",
    examples: [
      "Switched to economy tariff",
      "Manual override · 22°C",
      "Schedule paused",
    ],
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),

    title: "One-off household events",
    body: "Big dinner party, oven on for six hours, holiday lights strung up. The everyday context that makes anomaly detection legible.",
    examples: [
      "Thanksgiving dinner prep",
      "Christmas lights on",
      "Sauna evening",
    ],
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3h18v18H3z" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),

    title: "Renovation milestones",
    body: "Insulation installed, new windows, heat pump commissioned. Compare consumption before and after with date windows + datapoints together.",
    examples: [
      "Loft insulation completed",
      "Triple-glazing fitted",
      "Heat pump commissioned",
    ],
  },
  {
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 1v6m0 10v6M4.2 4.2l4.3 4.3m7 7l4.3 4.3M1 12h6m10 0h6M4.2 19.8l4.3-4.3m7-7l4.3-4.3" />
      </svg>
    ),

    title: "Detection events",
    body: "Anomaly monitors emit detection events automatically — so the list card shows automated and manual entries side by side.",
    examples: ["Radiator drift detected", "Stuck sensor · 4h", "Z-score spike"],
  },
];

const surfaces = [
  {
    label: "Quick card",
    mode: "quick",
    desc: "One-tap. Pre-configured icon and color. Drop one per zone for easy logging from a wall tablet.",
  },
  {
    label: "Action card",
    mode: "action",
    desc: "Full form: message, annotation, related entities, icon, color. The primary capture surface for a dashboard.",
  },
  {
    label: "Developer Tools",
    mode: "devtools",
    desc: "Fire the service directly with structured data. Useful for ad-hoc captures and testing automation logic.",
  },
];

function BeyondAnomalies() {
  const [active, setActive] = bState(surfaces[0]);

  return (
    <section className="section" id="beyond">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Datapoints in their own right
          </div>
          <h2>
            Anomalies are just one shape. Datapoints capture <em>everything</em>{" "}
            else.
          </h2>
          <p className="lead">
            Datapoints are{" "}
            <b style={{ color: "var(--fg)" }}>persistent annotations</b> that
            live inside Home Assistant alongside its history and statistics —
            unlike binary sensors or logbook lines, they are{" "}
            <b style={{ color: "var(--fg)" }}>never discarded</b> by the
            recorder's retention or purge cycles. Each one can be{" "}
            <b style={{ color: "var(--fg)" }}>
              cross-linked to many entities at once
            </b>{" "}
            — open a window and the same datapoint can tag the window contact,
            the room temperature sensor, the radiator climate entity, and the
            boiler. Wire automations to capture these moments and you slowly
            build a permanent, diagnostic history of your home that you can
            refer back to months or years later.
          </p>
        </div>

        {/* Use cases grid */}
        <div className="beyond-grid">
          {beyondUseCases.map((u) => (
            <div key={u.title} className="beyond-card">
              <div className="beyond-icon">{u.icon}</div>
              <h4>{u.title}</h4>
              <p>{u.body}</p>
              <div className="beyond-examples">
                {u.examples.map((e) => (
                  <span key={e}>"{e}"</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chart-driven datapoint creation */}
        <div className="chart-create">
          <div className="chart-create-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              FROM THE CHART
            </div>
            <h3>Right-click to annotate. Anywhere.</h3>
            <p
              style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6 }}
            >
              The Datapoints history page (and the history card) let you create
              a datapoint directly from the chart.{" "}
              <b style={{ color: "var(--fg)" }}>Right-click any point</b> on a
              visible series — or click the <span className="kbd-icon">＋</span>{" "}
              action floating above an inspected time — and a dialog opens
              prefilled with the timestamp and related entities from the visible
              target rows. Type your message, save, and the marker appears
              immediately on the chart and in the list.
            </p>
            <ul className="bullets" style={{ marginTop: 18 }}>
              <li>
                <b>Right-click</b> on any point of a target series
              </li>
              <li>
                Or click the floating <span className="kbd-icon">＋</span> when
                hovering an anomaly region
              </li>
              <li>
                <b>Click an existing annotation marker</b> on the chart to edit
                or duplicate it through the same dialog
              </li>
              <li>
                Related entities are <b>prefilled</b> from currently-visible
                target rows
              </li>
              <li>
                The marker drops onto the chart and the list{" "}
                <b>without a reload</b>
              </li>
            </ul>
          </div>
          <div className="chart-create-demo">
            <ChartCreateDemo />
          </div>
        </div>

        {/* Manual capture surfaces */}
        <div className="beyond-capture">
          <div className="beyond-capture-copy">
            <h3>Capture from anywhere.</h3>
            <p className="lead" style={{ fontSize: 16 }}>
              Three first-class manual capture surfaces, plus the same{" "}
              <span className="mono">hass_datapoints.record</span> service in
              every automation, script, and webhook handler.
            </p>
            <div className="beyond-tabs">
              {surfaces.map((s) => (
                <button
                  key={s.mode}
                  className={`beyond-tab ${s.mode === active.mode ? "is-active" : ""}`}
                  onClick={() => setActive(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 16, color: "var(--fg-mute)" }}>
              {active.desc}
            </p>
            <div className="bullets" style={{ marginTop: 16 }}>
              <ul className="bullets">
                <li>
                  <b>Stored</b> in HA's{" "}
                  <span className="mono">.storage/hass_datapoints.events</span>{" "}
                  — survives restarts &amp; recorder purges
                </li>
                <li>
                  <b>Emitted</b> on the event bus as{" "}
                  <span className="mono">hass_datapoints_event_recorded</span>
                </li>
                <li>
                  <b>Surfaced</b> in the HA logbook and on every linked entity's
                  activity feed
                </li>
                <li>
                  <b>Available</b> to MCP / AI assistants via the AI Query Brief
                  action
                </li>
              </ul>
            </div>
          </div>

          <div className="beyond-capture-demo">
            {active.mode === "quick" && <QuickCardMock />}
            {active.mode === "action" && <ActionCardMock />}
            {active.mode === "devtools" && <DevToolsMock />}
          </div>
        </div>

        {/* The list / activity feed - actual screenshot */}
        <div className="list-shot-wrap">
          <div className="list-shot-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              HASS-DATAPOINTS-LIST-CARD &amp; ENTITY ACTIVITY
            </div>
            <h3>
              Surfaced everywhere — list card, panel, and entity popovers.
            </h3>
            <p
              style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6 }}
            >
              The List card renders a searchable, paged feed of every datapoint
              over the visible range — manual notes, automation captures, and
              detection events side by side. Beyond Lovelace, each linked
              entity's activity feed picks up the same records too (shown here
              on the right). Drag rows to reorder; admins can edit, hide, or
              delete inline.
            </p>
            <div className="bullets" style={{ marginTop: 16 }}>
              <li>
                <b>Searchable</b> by message, annotation, or linked entity
              </li>
              <li>
                <b>Filtered</b> by the current timeline range automatically
              </li>
              <li>
                <b>Linked</b> — click any row to jump the chart to that moment
              </li>
              <li>
                <b>Auto-tagged</b> when monitors fire detections (look for the{" "}
                <span className="auto-tag-inline">auto</span> chip)
              </li>
            </div>
          </div>
          <div className="list-shot-img">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">Entity card · activity feed</span>
            </div>
            <img
              src="images/activity-feed.png"
              alt="Entity activity feed showing recorded datapoints"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* Mini chart with right-click → dialog UI demo */
function ChartCreateDemo() {
  const [showDialog, setShowDialog] = bState(false);
  return (
    <div className="cc-frame">
      <div className="anatomy-chrome small">
        <span className="anatomy-url">
          Datapoints panel · right-click on chart
        </span>
      </div>
      <div
        className="cc-chart"
        onContextMenu={(e) => {
          e.preventDefault();
          setShowDialog(true);
        }}
        onClick={() => setShowDialog(true)}
      >
        <svg
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
          width="100%"
          height="180"
        >
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line
              key={i}
              x1="0"
              y1={180 * f}
              x2="400"
              y2={180 * f}
              stroke="oklch(0.27 0.012 245)"
              strokeWidth="0.5"
              strokeDasharray="2,3"
            />
          ))}
          {/* main series */}
          <path
            d="M0,90 L20,86 L40,98 L60,88 L80,78 L100,84 L120,92 L140,100 L160,86 L180,72 L200,82 L220,78 L240,88 L260,96 L280,82 L300,76 L320,80 L340,68 L360,72 L380,82 L400,78"
            fill="none"
            stroke="#41bdf5"
            strokeWidth="1.6"
          />

          {/* anomaly oval */}
          <ellipse
            cx="180"
            cy="80"
            rx="22"
            ry="20"
            fill="oklch(0.66 0.21 250 / 0.16)"
            stroke="oklch(0.66 0.21 250)"
            strokeWidth="0.8"
          />
          {/* + cursor pip */}
          <g transform="translate(220, 60)">
            <circle
              r="10"
              fill="var(--bg-card)"
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            <path
              d="M-4 0h8M0 -4v8"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
        {!showDialog && (
          <div className="cc-hint">
            <kbd>click</kbd> the chart to record a datapoint
          </div>
        )}
        {showDialog && (
          <div className="cc-dialog">
            <div className="cc-dialog-head">
              <strong>Record datapoint</strong>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDialog(false);
                }}
                className="cc-close"
              >
                ×
              </button>
            </div>
            <div className="cc-dialog-body">
              <label>Message</label>
              <div className="cc-input">Window opened — bedroom</div>
              <label>
                Linked entities{" "}
                <span className="cc-pre">prefilled from chart</span>
              </label>
              <div className="cc-chips">
                <span>binary_sensor.bedroom_window</span>
                <span>sensor.bedroom_temperature</span>
                <span>climate.bedroom</span>
              </div>
              <div className="cc-time">12 Apr · 18:30 — from chart</div>
              <button
                className="cc-save"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDialog(false);
                }}
              >
                Save datapoint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListRow({ time, icon, color, label, note, entities, auto }) {
  return (
    <div className="lcm-row">
      <span
        className="lcm-icon"
        style={{ background: `oklch(from ${color} l c h / 0.16)`, color }}
      >
        <PointIcon icon={icon} />
      </span>
      <div className="lcm-meta">
        <div className="lcm-time mono">{time}</div>
        <div className="lcm-label">
          {label}
          {auto && <span className="lcm-auto">auto</span>}
        </div>
        <div className="lcm-note">{note}</div>
        <div className="lcm-ent">
          {entities.map((e) => (
            <span key={e} className="lcm-pill">
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- mock cards ---- */

function QuickCardMock() {
  return (
    <div className="ha-card">
      <div className="ha-card-head">
        <span
          className="ha-icon"
          style={{
            background: "oklch(0.82 0.16 80 / 0.18)",
            color: "var(--warn)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4h14a1 1 0 011 1v15.4l-7-3.5-7 3.5V5a1 1 0 011-1z" />
          </svg>
        </span>
        <div>
          <div className="ha-card-title">Quick note</div>
          <div className="ha-card-sub">Saves with one tap</div>
        </div>
      </div>
      <button className="ha-button ha-button--primary">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M5 12h14M12 5v14" />
        </svg>
        Record
      </button>
    </div>
  );
}

function ActionCardMock() {
  return (
    <div className="ha-card">
      <div className="ha-card-head">
        <span
          className="ha-icon"
          style={{
            background: "oklch(0.78 0.135 230 / 0.18)",
            color: "var(--accent)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z" />
          </svg>
        </span>
        <div>
          <div className="ha-card-title">Record event</div>
          <div className="ha-card-sub">Message · entities · icon · color</div>
        </div>
      </div>
      <div className="ha-field">
        <label>Message</label>
        <div className="ha-input">Heating mode → away</div>
      </div>
      <div className="ha-field">
        <label>Annotation</label>
        <div className="ha-input ha-input--ta">
          Out for the long weekend, manual override active until Monday evening.
        </div>
      </div>
      <div className="ha-field-row">
        <div className="ha-field">
          <label>Icon</label>
          <div className="ha-input mono">
            <span style={{ color: "var(--accent)" }}>mdi:</span>airplane
          </div>
        </div>
        <div className="ha-field">
          <label>Color</label>
          <div className="ha-input">
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 3,
                background: "#ef4444",
                verticalAlign: "-2px",
                marginRight: 8,
              }}
            ></span>
            <span className="mono">#ef4444</span>
          </div>
        </div>
      </div>
      <div className="ha-field">
        <label>Related entities</label>
        <div className="ha-chips">
          <span className="ha-chip">climate.living_room</span>
          <span className="ha-chip">sensor.daily_energy</span>
          <span className="ha-chip ha-chip--add">+ add</span>
        </div>
      </div>
      <button
        className="ha-button ha-button--primary"
        style={{ alignSelf: "flex-end" }}
      >
        Save datapoint
      </button>
    </div>
  );
}

function DevToolsMock() {
  return (
    <div className="ha-card ha-card--code">
      <div className="ha-card-head">
        <span
          className="ha-icon"
          style={{
            background: "oklch(0.7 0.16 305 / 0.16)",
            color: "var(--purple)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
        </span>
        <div>
          <div className="ha-card-title">Developer Tools → Actions</div>
          <div className="ha-card-sub mono">hass_datapoints.record</div>
        </div>
      </div>
      <pre className="ha-yaml">
        {`action: hass_datapoints.record
data:
  message: "Holiday lights on"
  annotation: "Strung along the front facade and trees."
  entity_ids:
    - sensor.daily_energy
    - light.front_porch
  icon: mdi:string-lights
  color: "#10b981"`}
      </pre>
      <button
        className="ha-button ha-button--primary"
        style={{ alignSelf: "flex-end" }}
      >
        Perform action
      </button>
    </div>
  );
}

window.BeyondAnomalies = BeyondAnomalies;
