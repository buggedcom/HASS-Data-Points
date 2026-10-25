/* Trend analysis methods — interactive explorer */

const { useEffect: tEffect, useRef: tRef, useState: tState } = React;

const trendMethods = [
  {
    id: "linear",
    name: "Linear",
    short: "A straight line fitted to the whole window.",
    detail:
      "Confirms long-term drift or compares slope between periods. The simplest signal: is the value going up, down, or flat overall.",
    avoid: "Curved or periodic data — a line cannot represent it.",
  },
  {
    id: "rolling",
    name: "Rolling average",
    short: "Sliding-window mean. Smooths noise; lags the signal.",
    detail:
      "Best when you want a clear local level — temperature, humidity, energy — and the window matches the natural timescale of what you're investigating.",
    avoid:
      "When you need fast response to sharp transitions — a wide window will hide them.",
  },
  {
    id: "ema",
    name: "EMA",
    short: "Exponentially-weighted: recent points matter more.",
    detail:
      "Same smoothing intent as rolling average, but with less lag. Reacts to step changes immediately rather than after the window moves.",
    avoid:
      'When you need a hard interpretable window like "average of the last hour" — EMA blends all history.',
  },
  {
    id: "polynomial",
    name: "Polynomial (deg 2)",
    short: "Quadratic curve fitted globally.",
    detail:
      "Tells you whether the change is accelerating or decelerating. Useful for recovery curves and non-linear drift.",
    avoid:
      "On periodic or highly variable data — endpoint values distort the fit.",
  },
  {
    id: "lowess",
    name: "LOWESS",
    short: "Locally-weighted regression. Follows complex shapes.",
    detail:
      "Non-parametric. Excels when the underlying shape rises, plateaus, transitions, and reverses — like a room that heats fast, holds, then drops overnight.",
    avoid:
      "Very short series — local regression needs enough neighbours to be stable.",
  },
  {
    id: "rate",
    name: "Rate of change",
    short: "Per-hour change, point-to-point or windowed.",
    detail:
      "Highlights how fast a value is moving rather than where it is. Spikes appear as large positive/negative excursions.",
    avoid:
      "Sensors with long gaps — rate over a gap can be misleadingly extreme.",
  },
];

function TrendDemoChart({ method }) {
  const ref = tRef(null);
  tEffect(() => {
    const { values } = window.Charts.generateSeries({
      n: 220,
      seed: 19,
      kind: "none",
      baseline: 21,
    });

    let trend = null;
    const C = window.Charts;
    switch (method.id) {
      case "linear":
        trend = C.linearFit(values);
        break;
      case "rolling":
        trend = C.rollingAvg(values, 16);
        break;
      case "ema":
        trend = C.ema(values, 0.12);
        break;
      case "polynomial":
        trend = C.polyFit(values);
        break;
      case "lowess":
        trend = C.lowess(values, 14);
        break;
      case "rate": {
        const r = C.rateOfChange(values);
        // re-scale to overlay on chart: shift around the mean of values
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        trend = r.map((x) => mean + x * 6);
        break;
      }
    }
    const draw = () => {
      ref.current.style.height = "220px";
      window.Charts.drawChart(ref.current, {
        values,
        trend,
        color: "oklch(0.86 0.12 230)",
        trendColor: "oklch(0.78 0.16 80)",
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [method.id]);

  return <canvas ref={ref}></canvas>;
}

function Trends() {
  const [active, setActive] = tState(trendMethods[1]);

  return (
    <section className="section" id="trends">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Trend analysis
          </div>
          <h2>Pick the right curve for the question.</h2>
          <p className="lead">
            Trend lines overlay a computed signal on the raw data. The shape you
            choose determines what you can see — direction, level, acceleration,
            shape, or speed.
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
            {trendMethods.map((m, i) => {
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
                    background: "oklch(0.78 0.16 80)",
                    display: "inline-block",
                  }}
                ></span>
                Trend overlay
              </span>
            </div>

            <div className="demo-chart">
              <div className="demo-meta">
                <span>sensor.demo_temperature · trend overlay</span>
                <span style={{ color: "oklch(0.78 0.16 80)" }}>
                  —— {active.name.toLowerCase()}
                </span>
              </div>
              <TrendDemoChart method={active} />
            </div>

            <div className="copy">
              <p>{active.detail}</p>
              <div className="note">
                <b>Avoid when:</b> {active.avoid}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Trends = Trends;
