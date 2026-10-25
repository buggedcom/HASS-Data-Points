/* Hero section — animated anomaly chart + headline copy */

const { useEffect, useRef, useState } = React;

function Hero() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    let last = performance.now();

    const draw = (now) => {
      const dt = now - last;
      last = now;
      frame += dt;
      // animate by shifting seed slowly
      const seed = 4 + Math.floor(frame / 2200);
      const { values, anomalies } = window.Charts.generateSeries({
        n: 220,
        seed,
        kind: "mix",
      });
      // Add a subtle live wobble
      const wobble = Math.sin(frame / 800) * 0.15;
      const v = values.map(
        (x, i) => x + wobble * Math.sin(i / 10 + frame / 1200)
      );

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.height = "440px";
      window.Charts.drawChart(canvas, {
        values: v,
        anomalies,
        color: "oklch(0.86 0.12 230)",
        showAxis: true,
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  // pulse tooltip near the visible chart
  useEffect(() => {
    const id = setInterval(() => {
      const w = wrapRef.current;
      if (!w) return;
      const rect = w.getBoundingClientRect();
      const x = rect.width * (0.42 + Math.random() * 0.32);
      const y = rect.height * (0.28 + Math.random() * 0.3);
      setTooltip({ visible: true, x, y });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero">
      <div className="hero-grid"></div>
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot"></span>
            Home Assistant · HACS integration
          </div>
          <h1>
            See <em>what changed</em>, when it changed,
            <br />
            and whether it should worry you.
          </h1>
          <p className="hero-sub">
            Data Points is a Home Assistant integration that records meaningful
            events, highlights anomalous behaviour across your sensors, and
            gives you the surfaces to actually investigate what's going on —
            charts, lists, monitors, and an AI-ready brief.
          </p>
          <div className="hero-actions">
            <a className="btn btn--primary" href="#install">
              Install via HACS
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
            <a className="btn btn--ghost" href="#detection">
              Explore detection methods
            </a>
          </div>
          <div className="hero-meta">
            <span>
              <span className="pill">v0.6</span> Anomaly monitors as HA devices
            </span>
            <span>
              <span className="pill">6 cards</span> + dedicated history panel
            </span>
            <span>
              <span className="pill">7 locales</span> EN · FI · DE · ES · FR ·
              PT · 中文
            </span>
          </div>
        </div>

        <div className="hero-viz" ref={wrapRef}>
          <div className="hero-viz-head">
            <div className="legend">
              <span>
                <i style={{ background: "oklch(0.86 0.12 230)" }}></i>Dining
                Room · Radiator temp
              </span>
              <span>
                <i
                  style={{
                    background: "transparent",
                    border: "1.5px solid oklch(0.78 0.135 230)",
                    borderRadius: "50%",
                  }}
                ></i>
                detected anomaly
              </span>
            </div>
            <div>20 Mar — 19 May · °C</div>
          </div>
          <div className="chart-wrap">
            <canvas ref={canvasRef}></canvas>
            {tooltip.visible && (
              <div
                className="chart-overlay-tooltip"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <div className="head">⚠ ANOMALY INSIGHT</div>
                Trend deviation · −6.2 °C from baseline 20.1
                <br />
                <span style={{ color: "var(--fg-mute)" }}>
                  12 Apr 16:00 → 12 Apr 19:00 · sensitivity: medium
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
