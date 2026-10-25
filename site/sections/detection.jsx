/* Detection methods interactive explorer — the centerpiece. */

const { useEffect: dEffect, useRef: dRef, useState: dState } = React;

const detectionMethods = [
  {
    id: "trend",
    name: "Trend deviation",
    short: "Points that drift away from a fitted trend line.",
    kind: "trend",
    catches:
      "Slow, sustained departures from expected behaviour — a radiator that gradually overshoots, a freezer slowly warming.",
    config: [
      "Trend method (linear / rolling / EMA / LOWESS / polynomial)",
      "Trend window — how much history to fit",
    ],
    pairsWith:
      "Comparison window — to confirm the drift is unusual versus a known-good baseline.",
    avoid:
      "Use Sudden change instead if the deviation is a single sharp event, not a sustained slope.",
    color: "oklch(0.7 0.16 305)",
  },
  {
    id: "sudden",
    name: "Sudden change",
    short: "Unusually fast rises or drops compared to normal rate of change.",
    kind: "sudden",
    catches:
      "Open windows, doors swung wide, pump kicks, surge events, sensor glitches.",
    config: [
      "Sensitivity (low / medium / high)",
      "Optional point-to-point or windowed comparison",
    ],
    pairsWith:
      'Datapoints recording the cause — "Window opened", "Heating restarted".',
    avoid:
      "Avoid on sensors with irregular update cadences — long gaps inflate rate of change artificially.",
    color: "oklch(0.78 0.135 230)",
  },
  {
    id: "outlier",
    name: "Statistical outlier (IQR)",
    short: "Values far outside the interquartile range of the series.",
    kind: "outlier",
    catches:
      "Sensor faults, transient spikes, mis-reads — anything that simply isn't compatible with the bulk of the data.",
    config: [
      "Sensitivity controls the IQR multiplier",
      "Best on stable, stationary signals",
    ],
    pairsWith:
      "Flat-line — to separate broken sensors from genuinely wild values.",
    avoid:
      "Highly variable signals (energy peaks, occupancy bursts) will produce false positives.",
    color: "oklch(0.78 0.135 230)",
  },
  {
    id: "zscore",
    name: "Rolling Z-score",
    short:
      "Readings unusual relative to a rolling mean and standard deviation.",
    kind: "zscore",
    catches:
      "Periods that are unusual for that time of day or season but wouldn't trigger a global threshold.",
    config: ["Rolling window (e.g. 7 days)", "Sensitivity = z-threshold"],
    pairsWith:
      'Trend deviation — gives you both "unusual versus local" and "unusual versus expected slope".',
    avoid:
      "Very short windows make every wiggle look anomalous. Match window to the cycle you care about.",
    color: "oklch(0.78 0.135 230)",
  },
  {
    id: "flat",
    name: "Flat-line / stuck value",
    short:
      "A sensor reporting nearly the same value for an unusually long time.",
    kind: "flat",
    catches:
      "Silent sensor failures — when a sensor stops updating but doesn't go unavailable.",
    config: [
      "Min flat duration",
      'Sensitivity controls how strict "nearly the same" is',
    ],
    pairsWith:
      "Sudden change — flat-line precedes the resume spike when a sensor reconnects.",
    avoid:
      "Genuinely steady states (a freezer that holds temp) need a longer min duration to avoid noise.",
    color: "oklch(0.82 0.16 80)",
  },
  {
    id: "compare",
    name: "Comparison window",
    short: "Current period diverges from a saved historical date window.",
    kind: "compare",
    catches:
      "Drift versus baseline — colder rooms after insulation, faster heating after maintenance, lower energy after a tariff change.",
    config: [
      'A saved date window (e.g. "Heating baseline")',
      "Sensitivity for divergence amplitude",
    ],
    pairsWith:
      "Anomaly trend override — fit the comparison curve differently from the chart's display trend.",
    avoid:
      "Without a clean baseline window, this method has nothing to compare against. Build the library first.",
    color: "oklch(0.78 0.135 230)",
  },
  {
    id: "similar",
    name: "Similar entity deviation",
    short: "Current entity diverges from siblings that should behave alike.",
    kind: "similar",
    catches:
      "One zone running cold while others stay warm. One floor sensor reading higher than its peers. A single radiator falling out of sync with the rest of the heating loop.",
    config: [
      "Pick one or more peer entities to compare against",
      "Sensitivity for divergence amplitude",
    ],
    pairsWith:
      "Trend deviation — to catch divergence both relative to peers and relative to the entity's own trajectory.",
    avoid:
      "If the peers aren't actually similar (different rooms, different sun exposure, different occupancy), this method will flood you with false positives.",
    color: "oklch(0.7 0.16 305)",
  },
];

function MethodDemoChart({ method }) {
  const ref = dRef(null);
  dEffect(() => {
    const draw = () => {
      const { values, anomalies } = window.Charts.generateSeries({
        n: 220,
        seed: 11,
        kind: method.kind,
        baseline: 21,
      });
      let trend = null;
      if (method.kind === "trend") trend = window.Charts.rollingAvg(values, 18);
      if (method.kind === "zscore")
        trend = window.Charts.rollingAvg(values, 24);

      let baseline = null;
      if (method.kind === "compare") {
        // baseline = the data without the post-40 elevation
        const fresh = window.Charts.generateSeries({
          n: 220,
          seed: 11,
          kind: "none",
          baseline: 21,
        });
        baseline = fresh.values;
      }
      if (method.kind === "similar") {
        // 2 peer entities — slight variations of the same base, no anomaly
        const peer1 = window.Charts.generateSeries({
          n: 220,
          seed: 21,
          kind: "none",
          baseline: 21,
        });
        const peer2 = window.Charts.generateSeries({
          n: 220,
          seed: 33,
          kind: "none",
          baseline: 21.3,
        });
        baseline = [peer1.values, peer2.values];
      }

      ref.current.style.height = "220px";
      window.Charts.drawChart(ref.current, {
        values,
        anomalies,
        trend,
        baseline,
        color: "oklch(0.86 0.12 230)",
        trendColor: "oklch(0.82 0.16 80)",
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [method.id]);

  return <canvas ref={ref}></canvas>;
}

function Detection() {
  const [active, setActive] = dState(detectionMethods[0]);

  return (
    <section className="section" id="detection">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Anomaly detection
          </div>
          <h2>Seven ways to find what's wrong.</h2>
          <p className="lead">
            Every method answers a different question. Pick one — or stack
            several — and let the backend flag suspicious regions directly on
            the chart. Click each method below to see what it catches and when
            to reach for it.
          </p>
          <div className="docs-note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              These charts are indicative for documentation purposes — charts
              within the integration look different.
            </span>
          </div>
        </div>

        <div className="explorer">
          <div className="method-list">
            {detectionMethods.map((m, i) => {
              const isActive = m.id === active.id;
              return (
                <button
                  key={m.id}
                  className={`method-item ${isActive ? "is-active" : ""}`}
                  onClick={() => setActive(m)}
                >
                  <span className="badge">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <div className="title">{m.name}</div>
                    <div className="desc">{m.short}</div>
                  </span>
                  <span className="chev">→</span>
                </button>
              );
            })}
          </div>

          <div className="method-detail">
            <div className="method-detail-head">
              <h3>{active.name}</h3>
              <span className="tag">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active.color,
                    display: "inline-block",
                  }}
                ></span>
                Method · {active.id}
              </span>
            </div>

            <div className="demo-chart">
              <div className="demo-meta">
                <span>sensor.demo_temperature · last 7 days · °C</span>
                <span style={{ color: active.color }}>
                  ● {active.name.toLowerCase()}
                </span>
              </div>
              <MethodDemoChart method={active} />
            </div>

            <div className="copy">
              <p>
                <b>What it catches.</b> {active.catches}
              </p>
              <div className="method-grid-2">
                <div>
                  <div className="card-title" style={{ marginBottom: 8 }}>
                    Configure
                  </div>
                  <ul className="bullets">
                    {active.config.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="card-title" style={{ marginBottom: 8 }}>
                    Pairs well with
                  </div>
                  <p style={{ marginTop: 0 }}>{active.pairsWith}</p>
                </div>
              </div>
              <div className="note" style={{ marginTop: 16 }}>
                <b>When not to use it.</b> {active.avoid}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Detection = Detection;
