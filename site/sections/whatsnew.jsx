/* What's new — recent additions, linking to the detailed sections */

const WN_ITEMS = [
  {
    tag: "Monitors",
    href: "#monitors",
    h: "Anomaly monitors, redesigned",
    p: "A three-step wizard with per-entity detection settings, individual or combined (AND / OR) monitors, and a list view with per-entity anomaly heatmaps, incidents and entity filtering.",
  },
  {
    tag: "Monitors",
    href: "#monitors",
    h: "A device for every monitor",
    p: "Each monitor gets an Enabled switch, six sensors, Problem and Stalled binary sensors, plus anomaly detected and resolved events for automations.",
  },
  {
    tag: "Charts",
    href: "#aggregates",
    h: "Aggregate series",
    p: "Per-row hourly, daily, weekly or monthly aggregates: mean, min, max, median, consumption, state counts, time in state and event counts.",
  },
  {
    tag: "Detection",
    href: "#detection",
    h: "Direction filters",
    p: "Restrict trend, rate-of-change, IQR, Z-score and comparison-window anomalies to upward or downward deviations only.",
  },
  {
    tag: "Detection",
    href: "#detection",
    h: "Rate-of-change windows",
    p: "Sudden-change detection can compare point to point or across eight window sizes, so slow ramps and sharp steps are both caught.",
  },
  {
    tag: "Integration",
    href: "#install",
    h: "Datapoint sensors",
    p: "The integration device reports datapoint count, last recorded time and message, time since last datapoint, recorded today and this week, and automation vs manual counts.",
  },
  {
    tag: "AI",
    href: "#playbook",
    h: "Localised AI query brief",
    p: "The structured brief for AI assistants is now available in German, Spanish, French, Portuguese, Finnish and Simplified Chinese.",
  },
];

function WhatsNew() {
  return (
    <section className="section section--tight" id="whats-new">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 36 }}>
          <div className="eyebrow">
            <span className="dot"></span> What's new
          </div>
          <h2>Recently added.</h2>
        </div>
        <div className="wn-grid">
          {WN_ITEMS.map((it) => (
            <a key={it.h} href={it.href} className="wn-item">
              <span className="power-badge">{it.tag}</span>
              <h4>{it.h}</h4>
              <p>{it.p}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

window.WhatsNew = WhatsNew;
