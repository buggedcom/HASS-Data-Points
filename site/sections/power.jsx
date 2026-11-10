/* Panel Power Tools — feature mosaic covering the rest of the chart capabilities */

const tools = [
  {
    id: "downsample",
    name: "Downsampling",
    badge: "Per-target",
    body: "Reduce dense data to fixed intervals (1m / 5m / 15m / 1h / 6h / 1d) with a chosen aggregate — mean, min, max, median, first, or last. Charts stay fast even on raw recorder data spanning months.",
    visual: <DownsampleViz />,
  },
  {
    id: "stepped",
    name: "Stepped or smooth series",
    badge: "Per-target",
    body: "Render every target as a stepped (state-like) or continuous line. Stepped is the right choice for binary sensors, presence, and discrete enums; smooth fits temperature, humidity, and energy.",
    visual: <SteppedViz />,
  },
  {
    id: "mmm",
    name: "Min / max / mean shading",
    badge: "Per-target",
    body: "Show the rolling minimum, maximum, and mean as a shaded envelope around the central line. Immediately reveals variance and outliers without having to scrutinize raw points.",
    visual: <MmmViz />,
  },
  {
    id: "gaps",
    name: "Data gap visibility",
    badge: "Display",
    body: "Render visible breaks where the recorder didn't report data — with a configurable gap threshold (2h / 6h / 24h). No more straight lines pretending a missing day was a steady state.",
    visual: <GapsViz />,
  },
  {
    id: "yaxis",
    name: "Y-axis modes",
    badge: "Display",
    body: "Combine series sharing units, give each series its own axis, or split into stacked rows. Switch instantly — the chart re-lays out and anomaly overlays follow.",
    visual: <YAxisViz />,
  },
  {
    id: "correlated",
    name: "Anomaly correlation",
    badge: "Investigation",
    body: "When multiple targets are visible, the panel highlights anomalies that occur on more than one series at the same time — exposing causal patterns the eye would miss.",
    visual: <CorrelatedViz />,
  },
  {
    id: "windows",
    name: "Date windows",
    badge: "Saved baselines",
    body: 'Name and save any historical period — "Heating baseline", "Before insulation", "Last cold snap" — and bring it back from a tab above the chart. The library that powers comparison-window anomaly detection.',
    visual: <WindowsViz />,
  },
  {
    id: "delta",
    name: "Delta vs date window",
    badge: "Comparison",
    body: "Overlay the difference between the current range and any saved date window — point-by-point. Positive deviations shade above the axis, negative below. The fastest way to see drift.",
    visual: <DeltaViz />,
  },
  {
    id: "export",
    name: "Spreadsheet download",
    badge: "Export",
    body: "Pull everything visible — raw history, downsampled aggregates, anomaly markers, and recorded datapoints — into a spreadsheet for offline analysis or sharing with collaborators.",
    visual: <ExportViz />,
  },
];

function PanelPowerTools() {
  return (
    <section className="section" id="power">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Panel power tools
          </div>
          <h2>Everything else the chart can do.</h2>
          <p className="lead">
            Anomaly detection sits on top of an opinionated, investigation-first
            chart engine. Downsampling, gap-aware rendering, multi-axis layouts,
            correlated anomaly highlights, date windows for baseline comparison,
            and a one-click export. Configured per target, persisted per view.
          </p>
        </div>

        <div className="power-grid">
          {tools.map((t) => (
            <div key={t.id} className="power-card">
              <div className="power-viz">{t.visual}</div>
              <div className="power-body">
                <div className="power-badge">{t.badge}</div>
                <h4>{t.name}</h4>
                <p>{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- mini visuals ---------- */

function DownsampleViz() {
  // top row: raw points (many)  bottom row: 5 aggregated bars
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <circle
          key={i}
          cx={20 + i * 5}
          cy={24 + Math.sin(i * 0.7) * 6}
          r="1.4"
          fill="oklch(0.78 0.135 230)"
          opacity="0.7"
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = 24 + i * 26;
        const h = 22 + Math.sin(i * 1.3) * 6;
        return (
          <rect
            key={i}
            x={x}
            y={92 - h}
            width="20"
            height={h}
            fill="oklch(0.66 0.21 250)"
            rx="2"
          />
        );
      })}
    </svg>
  );
}

function SteppedViz() {
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <path
        d="M20,60 L60,60 L60,30 L100,30 L100,60 L140,60 L140,40 L180,40 L180,55 L210,55"
        fill="none"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20,88 C40,82 60,72 100,80 S160,70 210,82"
        fill="none"
        stroke="oklch(0.78 0.16 80)"
        strokeWidth="2"
      />
    </svg>
  );
}

function MmmViz() {
  // shaded envelope with center line
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="mmm-grad" x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0"
            stopColor="oklch(0.66 0.21 250)"
            stopOpacity="0.35"
          />
          <stop
            offset="1"
            stopColor="oklch(0.66 0.21 250)"
            stopOpacity="0.05"
          />
        </linearGradient>
      </defs>
      <path
        d="M10,30 C30,15 60,32 100,18 S160,30 210,18 L210,75 C160,82 130,68 100,82 S40,68 10,82 Z"
        fill="url(#mmm-grad)"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="0.6"
        strokeDasharray="2,3"
      />
      <path
        d="M10,52 C40,42 70,60 100,50 S160,46 210,52"
        fill="none"
        stroke="oklch(0.86 0.14 220)"
        strokeWidth="2"
      />
    </svg>
  );
}

function GapsViz() {
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <path
        d="M10,50 C30,46 50,58 80,52 S100,50 110,48"
        fill="none"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="2"
      />
      {/* gap */}
      <path
        d="M110,48 L170,42"
        fill="none"
        stroke="oklch(0.66 0.21 250 / 0.35)"
        strokeWidth="2"
        strokeDasharray="3,4"
      />
      {/* boundary markers, as drawn by the chart: \\ where data stops, // where it resumes */}
      {[
        [110, 48, 1],
        [170, 42, -1],
      ].map(([x, y, dir]) => (
        <g
          key={x}
          stroke="oklch(0.66 0.21 250)"
          strokeWidth="1.5"
          opacity="0.55"
          strokeLinecap="round"
        >
          {[-2, 2].map((d) => (
            <line
              key={d}
              x1={x + d - 3 * dir}
              y1={y - 7}
              x2={x + d + 3 * dir}
              y2={y + 7}
            />
          ))}
        </g>
      ))}
      <path
        d="M170,42 C190,46 200,58 210,52"
        fill="none"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="2"
      />
      {/* axis */}
      <line
        x1="10"
        y1="80"
        x2="210"
        y2="80"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function YAxisViz() {
  // three layouts side by side; axes are coloured to the series they scale, grey when shared
  const BLUE = "oklch(0.66 0.21 250)",
    AMBER = "oklch(0.78 0.16 80)",
    GREY = "oklch(0.6 0.02 245)";
  const PANEL = "oklch(0.22 0.014 245)",
    GRID = "oklch(0.3 0.014 245)";
  const axis = (x, y0, y1, color, side) => {
    const ticks = [0, 1, 2, 3].map((i) => y0 + 4 + ((y1 - y0 - 8) * i) / 3);
    const dx = side === "right" ? 3 : -3;
    return (
      <g stroke={color} strokeWidth="1.4" strokeLinecap="round">
        <line x1={x} y1={y0 + 2} x2={x} y2={y1 - 2} />
        {ticks.map((t) => (
          <line key={t} x1={x} y1={t} x2={x + dx} y2={t} />
        ))}
      </g>
    );
  };
  const grid = (x0, x1, y0, y1) =>
    [0, 1, 2, 3].map((i) => {
      const y = y0 + 4 + ((y1 - y0 - 8) * i) / 3;
      return (
        <line
          key={i}
          x1={x0}
          x2={x1}
          y1={y}
          y2={y}
          stroke={GRID}
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      );
    });
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      {/* combined: one shared axis, both series on the same scale */}
      <rect x="4" y="12" width="64" height="76" rx="4" fill={PANEL} />
      {grid(14, 64, 12, 88)}
      {axis(14, 12, 88, GREY, "left")}
      <path
        d="M17,58 C26,50 34,66 42,56 S56,48 64,54"
        stroke={BLUE}
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M17,48 C26,52 34,40 42,46 S56,56 64,44"
        stroke={AMBER}
        strokeWidth="1.6"
        fill="none"
      />

      {/* unique: each series has its own axis, left and right */}
      <rect x="78" y="12" width="64" height="76" rx="4" fill={PANEL} />
      {grid(86, 134, 12, 88)}
      {axis(86, 12, 88, BLUE, "left")}
      {axis(134, 12, 88, AMBER, "right")}
      <path
        d="M89,74 C98,30 106,80 114,40 S126,20 131,62"
        stroke={BLUE}
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M89,26 C98,60 106,22 114,70 S126,78 131,34"
        stroke={AMBER}
        strokeWidth="1.6"
        fill="none"
      />

      {/* split rows: stacked panels, one series and one axis each */}
      <rect x="152" y="12" width="64" height="36" rx="3" fill={PANEL} />
      {grid(160, 212, 12, 48)}
      {axis(160, 12, 48, BLUE, "left")}
      <path
        d="M163,40 C172,18 182,44 192,24 S206,20 212,34"
        stroke={BLUE}
        strokeWidth="1.6"
        fill="none"
      />
      <rect x="152" y="52" width="64" height="36" rx="3" fill={PANEL} />
      {grid(160, 212, 52, 88)}
      {axis(160, 52, 88, AMBER, "left")}
      <path
        d="M163,64 C172,82 182,58 192,78 S206,82 212,62"
        stroke={AMBER}
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}

function CorrelatedViz() {
  // two parallel lines with linked vertical highlight band
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <rect
        x="92"
        y="6"
        width="36"
        height="86"
        fill="oklch(0.66 0.21 250 / 0.18)"
        stroke="oklch(0.66 0.21 250 / 0.7)"
        strokeWidth="0.5"
      />
      <path
        d="M10,30 C30,26 50,38 80,32 C100,30 110,52 130,48 C150,46 180,36 210,30"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M10,70 C30,66 50,72 80,68 C100,66 110,86 130,82 C150,80 180,74 210,68"
        stroke="oklch(0.78 0.16 80)"
        strokeWidth="1.6"
        fill="none"
      />
      <line
        x1="10"
        y1="50"
        x2="210"
        y2="50"
        stroke="oklch(0.27 0.012 245)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function WindowsViz() {
  // tabs at top + chart with ghost baseline
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <rect
        x="10"
        y="8"
        width="58"
        height="14"
        rx="3"
        fill="oklch(0.66 0.21 250)"
      />
      <text
        x="39"
        y="18"
        fontFamily="JetBrains Mono"
        fontSize="7"
        textAnchor="middle"
        fill="oklch(0.13 0.012 245)"
      >
        Selected
      </text>
      <rect
        x="72"
        y="8"
        width="48"
        height="14"
        rx="3"
        fill="oklch(0.22 0.014 245)"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
      <text
        x="96"
        y="18"
        fontFamily="JetBrains Mono"
        fontSize="7"
        textAnchor="middle"
        fill="oklch(0.74 0.012 245)"
      >
        Baseline
      </text>
      <rect
        x="124"
        y="8"
        width="64"
        height="14"
        rx="3"
        fill="oklch(0.22 0.014 245)"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
      <text
        x="156"
        y="18"
        fontFamily="JetBrains Mono"
        fontSize="7"
        textAnchor="middle"
        fill="oklch(0.74 0.012 245)"
      >
        Cold snap
      </text>

      {/* chart */}
      <path
        d="M10,60 C30,52 50,72 80,62 S130,56 160,68 S190,58 210,62"
        stroke="oklch(0.66 0.21 250)"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M10,72 C30,68 50,80 80,74 S130,68 160,76 S190,70 210,72"
        stroke="oklch(0.74 0.012 245)"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="3,3"
      />
    </svg>
  );
}

function DeltaViz() {
  // mirrored bar showing positive deviations above + negative below
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <line
        x1="10"
        y1="50"
        x2="210"
        y2="50"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
      <text
        x="6"
        y="20"
        fontFamily="JetBrains Mono"
        fontSize="8"
        fill="oklch(0.78 0.16 150)"
      >
        +Δ
      </text>
      <text
        x="6"
        y="86"
        fontFamily="JetBrains Mono"
        fontSize="8"
        fill="oklch(0.7 0.2 25)"
      >
        −Δ
      </text>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 26 + i * 13;
        const d = (Math.sin(i * 0.8) + Math.sin(i * 0.3)) * 14;
        const h = Math.abs(d);
        const above = d > 0;
        return (
          <rect
            key={i}
            x={x}
            y={above ? 50 - h : 50}
            width="9"
            height={h}
            fill={
              above ? "oklch(0.78 0.16 150 / 0.6)" : "oklch(0.7 0.2 25 / 0.6)"
            }
            rx="1"
          />
        );
      })}
    </svg>
  );
}

function ExportViz() {
  return (
    <svg
      viewBox="0 0 220 100"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
    >
      <rect
        x="74"
        y="14"
        width="72"
        height="64"
        rx="4"
        fill="oklch(0.22 0.014 245)"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
      {/* spreadsheet grid */}
      <line
        x1="74"
        y1="24"
        x2="146"
        y2="24"
        stroke="oklch(0.36 0.014 245)"
        strokeWidth="0.5"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="74"
          y1={36 + i * 10}
          x2="146"
          y2={36 + i * 10}
          stroke="oklch(0.27 0.012 245)"
          strokeWidth="0.5"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={74 + (i + 1) * 18}
          y1="14"
          x2={74 + (i + 1) * 18}
          y2="78"
          stroke="oklch(0.27 0.012 245)"
          strokeWidth="0.5"
        />
      ))}
      <text
        x="110"
        y="22"
        fontFamily="JetBrains Mono"
        fontSize="6"
        textAnchor="middle"
        fill="oklch(0.78 0.16 150)"
      >
        CSV
      </text>
      {/* download arrow */}
      <g transform="translate(180, 50)">
        <circle r="14" fill="oklch(0.66 0.21 250)" />
        <path
          d="M0,-6 L0,5 M-5,0 L0,6 L5,0"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

window.PanelPowerTools = PanelPowerTools;
