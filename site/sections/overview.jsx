/* Overview stats + the 6 Lovelace cards showcase with mini illustrations */

function Overview() {
  return (
    <section className="section section--tight" id="overview">
      <div className="container">
        <div className="stats">
          <div className="stat">
            <div className="v">6</div>
            <div className="l">Lovelace cards</div>
          </div>
          <div className="stat">
            <div className="v">7</div>
            <div className="l">Anomaly detection methods</div>
          </div>
          <div className="stat">
            <div className="v">6</div>
            <div className="l">Trend analysis methods</div>
          </div>
          <div className="stat">
            <div className="v">1,000+</div>
            <div className="l">Frontend &amp; backend tests</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- mini card illustrations (miniature mockups) ----- */

function MiniAction() {
  return (
    <div className="mini mini--action">
      <div className="mini-row">
        <div className="mini-bar w-30"></div>
      </div>
      <div className="mini-input"></div>
      <div className="mini-row">
        <div className="mini-bar w-20"></div>
      </div>
      <div className="mini-input mini-input--ta"></div>
      <div className="mini-row mini-row--chips">
        <span className="mini-chip"></span>
        <span className="mini-chip"></span>
        <span className="mini-chip mini-chip--add"></span>
      </div>
      <div className="mini-btn">Save</div>
    </div>
  );
}

function MiniQuick() {
  return (
    <div className="mini mini--quick">
      <div className="mini-quick-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4h14a1 1 0 011 1v15.4l-7-3.5-7 3.5V5a1 1 0 011-1z" />
        </svg>
      </div>
      <div className="mini-row" style={{ justifyContent: "center" }}>
        <div className="mini-bar w-40" style={{ height: 8 }}></div>
      </div>
      <div className="mini-btn mini-btn--big">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M5 12h14M12 5v14" />
        </svg>
        Record
      </div>
    </div>
  );
}

function MiniList() {
  const rows = [
    { c: "#10b981", w: 56 },
    { c: "#3b82f6", w: 38 },
    { c: "#ef4444", w: 46 },
    { c: "#a855f7", w: 32 },
  ];

  return (
    <div className="mini mini--list">
      <div className="mini-list-search">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="mini-list-row">
          <span className="mini-list-dot" style={{ background: r.c }}></span>
          <div className="mini-list-bars">
            <div className="mini-bar" style={{ width: r.w + "%" }}></div>
            <div
              className="mini-bar mini-bar--xs"
              style={{ width: r.w - 20 + "%" }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniChart({ withTargets = false, withAnomaly = true, dense = false }) {
  // tiny inline SVG chart
  const W = 200,
    H = dense ? 80 : 92;
  const pts = [];
  let y = H / 2;
  for (let i = 0; i < 40; i++) {
    y += Math.sin(i * 0.6) * 4 + (Math.random() - 0.5) * 4;
    y = Math.max(15, Math.min(H - 15, y));
    pts.push([i * (W / 39), y]);
  }
  const d =
    "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L");
  return (
    <div className={`mini ${dense ? "mini--sensor" : "mini--history"}`}>
      {withTargets && (
        <div className="mini-targets">
          <span style={{ background: "#41bdf5" }}></span>
          <span style={{ background: "#a855f7" }}></span>
          <span style={{ background: "#10b981" }}></span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mini-svg"
      >
        <line
          x1="0"
          y1={H - 1}
          x2={W}
          y2={H - 1}
          stroke="oklch(0.85 0.005 245)"
          strokeWidth="0.5"
        />
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1="0"
            y1={H * f}
            x2={W}
            y2={H * f}
            stroke="oklch(0.92 0.005 245)"
            strokeWidth="0.4"
            strokeDasharray="1.5,1.5"
          />
        ))}
        {withAnomaly && (
          <ellipse
            cx={W * 0.42}
            cy={H * 0.7}
            rx="14"
            ry="10"
            fill="oklch(0.66 0.21 250 / 0.18)"
            stroke="oklch(0.66 0.21 250)"
            strokeWidth="0.8"
          />
        )}
        <path
          d={d}
          fill="none"
          stroke="#41bdf5"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* datapoint markers */}
        <circle
          cx={W * 0.18}
          cy="20"
          r="3"
          fill="white"
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <circle
          cx={W * 0.62}
          cy="20"
          r="3"
          fill="white"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        {withTargets && (
          <circle
            cx={W * 0.88}
            cy="20"
            r="3"
            fill="white"
            stroke="#a855f7"
            strokeWidth="1.5"
          />
        )}
      </svg>
      {!dense && (
        <div className="mini-timeline">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}

function MiniDevTool() {
  return (
    <div className="mini mini--dev">
      <div className="mini-dev-line">
        <span className="mini-dev-prefix">$</span>
        <div className="mini-bar w-50"></div>
      </div>
      <div className="mini-dev-line">
        <span className="mini-dev-prefix mini-dev-ok">✓</span>
        <div className="mini-bar w-40 mini-bar--green"></div>
      </div>
      <div className="mini-dev-line">
        <span className="mini-dev-prefix mini-dev-ok">✓</span>
        <div className="mini-bar w-32 mini-bar--green"></div>
      </div>
      <div className="mini-dev-line">
        <span className="mini-dev-prefix mini-dev-ok">✓</span>
        <div className="mini-bar w-46 mini-bar--green"></div>
      </div>
      <div className="mini-dev-actions">
        <span className="mini-btn-sm">Generate</span>
        <span className="mini-btn-sm mini-btn-sm--ghost">Clean up</span>
      </div>
    </div>
  );
}

const cards = [
  {
    type: "action-card",
    name: "Action card",
    desc: "Full recording form — message, annotation, related entities, icon, and color. Use it as the dashboard's primary capture surface.",
    mini: <MiniAction />,
    badge: null,
  },
  {
    type: "quick-card",
    name: "Quick card",
    desc: "One-tap logging for observations, maintenance, and manual interventions. Pre-configured icon and color for friction-free wall-tablet capture.",
    mini: <MiniQuick />,
    badge: null,
  },
  {
    type: "list-card",
    name: "List card",
    desc: "Searchable, paged datapoint browser. Admins also get inline edit, delete, and hide. Drag rows to reorder; click to jump the chart to that point.",
    mini: <MiniList />,
    badge: null,
  },
  {
    type: "history-card",
    name: "History card",
    desc: "A drop-in replacement for the standard Lovelace history card — same place, same shape, but with target rows, anomaly overlays, date-window tabs, the timeline slider, and inline datapoint creation. The full history-panel feature set in a fixed Lovelace tile.",
    mini: <MiniChart withTargets={true} />,
    badge: "Drop-in replacement",
  },
  {
    type: "sensor-card",
    name: "Sensor card",
    desc: "A drop-in replacement for the standard Lovelace sensor card. Identical placement, plus inline datapoint markers drawn directly on the series.",
    mini: <MiniChart withTargets={false} withAnomaly={false} dense />,
    badge: "Drop-in replacement",
  },
  {
    type: "dev-tool-card",
    name: "Dev tool card",
    desc: "Seed development datapoints from HA history for testing, then bulk-delete dev datapoints when you're done.",
    mini: <MiniDevTool />,
    badge: null,
  },
];

function Cards() {
  return (
    <section className="section" id="cards">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Surfaces
          </div>
          <h2>Six cards. One dedicated history panel.</h2>
          <p className="lead">
            Each card ships with a{" "}
            <b style={{ color: "var(--fg)" }}>full visual editor</b> in Lovelace
            — no handwritten YAML required for any configuration option. Drop a
            card into a dashboard, pick entities and options from native
            HA-style controls, and the underlying YAML is generated for you. The{" "}
            <b style={{ color: "var(--fg)" }}>history</b> and
            <b style={{ color: "var(--fg)" }}> sensor</b> cards are drop-in
            replacements for the standard Lovelace equivalents — same surfaces,
            with datapoint overlays added.
          </p>
        </div>
        <div className="card-grid">
          {cards.map((c) => (
            <div key={c.type} className="card card--with-mini">
              <div className="card-mini-wrap">{c.mini}</div>
              <div className="card-body">
                {c.badge && <div className="card-badge">{c.badge}</div>}
                <div className="card-title">
                  custom:hass-datapoints-{c.type}
                </div>
                <h4>{c.name}</h4>
                <p>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cards-foot">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />
          </svg>
          <span>
            All cards are configured via visual editors. YAML is shown in this
            site for documentation only.
          </span>
        </div>
      </div>
    </section>
  );
}

window.Overview = Overview;
window.Cards = Cards;
