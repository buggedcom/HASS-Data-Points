/* Interactive timeline dragger — the distinctive UX piece.
   Two draggable range handles + datapoint markers along the track. */

const {
  useEffect: tlEffect,
  useRef: tlRef,
  useState: tlState,
  useMemo: tlMemo,
} = React;

// Generate a synthetic set of datapoints spread across a 9-month range.
const TL_DATAPOINTS = [
  {
    day: 12,
    color: "var(--healthy)",
    icon: "wrench",
    label: "Boiler serviced",
    time: "08 Jan · 09:14",
  },
  {
    day: 38,
    color: "var(--accent)",
    icon: "snow",
    label: "Cold snap began",
    time: "07 Feb · 17:32",
  },
  {
    day: 64,
    color: "var(--warn)",
    icon: "filter",
    label: "HVAC filter replaced",
    time: "05 Mar · 11:05",
  },
  {
    day: 82,
    color: "var(--anomaly)",
    icon: "alert",
    label: "Heating mode → away",
    time: "23 Mar · 06:00",
  },
  {
    day: 96,
    color: "var(--purple)",
    icon: "house",
    label: "Insulation work · loft",
    time: "06 Apr · 14:20",
  },
  {
    day: 124,
    color: "var(--accent)",
    icon: "window",
    label: "Bedroom window open > 15 min",
    time: "04 May · 22:11",
  },
  {
    day: 152,
    color: "var(--anomaly)",
    icon: "alert",
    label: "Radiator temperature drift",
    time: "01 Jun · 02:40",
  },
  {
    day: 178,
    color: "var(--healthy)",
    icon: "wrench",
    label: "Annual service complete",
    time: "27 Jun · 10:00",
  },
  {
    day: 198,
    color: "var(--warn)",
    icon: "filter",
    label: "Pellet hopper refilled",
    time: "17 Jul · 09:30",
  },
  {
    day: 220,
    color: "var(--accent)",
    icon: "snow",
    label: "Guests arrived · party of 12",
    time: "08 Aug · 18:45",
  },
];

// Tick layout: 9 months, with ~weekly ticks
const TL_TOTAL_DAYS = 270;
const TL_MONTHS = [
  { label: "Jan 2026", day: 0 },
  { label: "Feb 2026", day: 31 },
  { label: "Mar 2026", day: 59 },
  { label: "Apr 2026", day: 90 },
  { label: "May 2026", day: 120 },
  { label: "Jun 2026", day: 151 },
  { label: "Jul 2026", day: 181 },
  { label: "Aug 2026", day: 212 },
  { label: "Sep 2026", day: 243 },
];

function TimelineDragger() {
  const trackRef = tlRef(null);
  const [range, setRange] = tlState({ a: 70, b: 165 });
  const [drag, setDrag] = tlState(null); // "a" | "b" | "range" | null
  const [hover, setHover] = tlState(null);

  const dayToPct = (d) => (d / TL_TOTAL_DAYS) * 100;

  const pxToDay = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round(pct * TL_TOTAL_DAYS);
  };

  tlEffect(() => {
    if (!drag) return;
    const startMouse = drag.startX;
    const startRange = { ...drag.startRange };

    const onMove = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const r = trackRef.current.getBoundingClientRect();
      const dxDays = ((x - startMouse) / r.width) * TL_TOTAL_DAYS;

      let { a, b } = startRange;
      if (drag.kind === "a")
        a = Math.max(0, Math.min(b - 4, Math.round(startRange.a + dxDays)));
      else if (drag.kind === "b")
        b = Math.min(
          TL_TOTAL_DAYS,
          Math.max(a + 4, Math.round(startRange.b + dxDays))
        );
      else if (drag.kind === "range") {
        const len = startRange.b - startRange.a;
        let na = Math.round(startRange.a + dxDays);
        na = Math.max(0, Math.min(TL_TOTAL_DAYS - len, na));
        a = na;
        b = na + len;
      }
      setRange({ a, b });
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [drag]);

  const startDrag = (kind) => (e) => {
    e.preventDefault();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDrag({ kind, startX: x, startRange: range });
  };

  const visiblePoints = tlMemo(() => {
    return TL_DATAPOINTS.filter((p) => p.day >= range.a && p.day <= range.b);
  }, [range.a, range.b]);

  // Days-in-range label
  const rangeDays = range.b - range.a;
  const startLabel = monthLabel(range.a);
  const endLabel = monthLabel(range.b);

  return (
    <section className="section" id="timeline">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Timeline dragger
          </div>
          <h2>Drag the range. Everything follows.</h2>
          <p className="lead">
            The timeline at the top of the panel is more than a date picker.
            Drag either handle to expand or contract the range, drag the middle
            to pan, or click a tick to jump. The chart, sidebar, datapoint list,
            and anomaly detection all recompute against the visible window.
          </p>
        </div>

        <div className="tl-wrap">
          <div className="tl-readout">
            <div>
              <span className="card-title">RANGE</span>
              <div className="tl-readout-v">
                {startLabel} → {endLabel}
              </div>
            </div>
            <div className="right">
              <span className="card-title">SPAN</span>
              <div className="tl-readout-v">{rangeDays} days</div>
            </div>
            <div className="right">
              <span className="card-title">DATAPOINTS IN VIEW</span>
              <div className="tl-readout-v">
                {visiblePoints.length} of {TL_DATAPOINTS.length}
              </div>
            </div>
          </div>

          {/* timeline track */}
          <div
            className="tl-track"
            ref={trackRef}
            onMouseLeave={() => setHover(null)}
          >
            {/* Month labels */}
            <div className="tl-months">
              {TL_MONTHS.map((m) => (
                <span key={m.label} style={{ left: `${dayToPct(m.day)}%` }}>
                  {m.label}
                </span>
              ))}
            </div>

            {/* Tick rail */}
            <div className="tl-ticks">
              {Array.from(
                { length: TL_TOTAL_DAYS / 7 + 1 },
                (_, i) => i * 7
              ).map((d) => (
                <span
                  key={d}
                  className={`tl-tick ${d % 28 === 0 ? "tl-tick--major" : ""}`}
                  style={{ left: `${dayToPct(d)}%` }}
                />
              ))}
            </div>

            {/* Selected range */}
            <div
              className="tl-range"
              style={{
                left: `${dayToPct(range.a)}%`,
                width: `${dayToPct(range.b - range.a)}%`,
              }}
              onMouseDown={startDrag("range")}
              onTouchStart={startDrag("range")}
            />

            {/* Handles */}
            <div
              className={`tl-handle ${drag?.kind === "a" ? "is-dragging" : ""}`}
              style={{ left: `${dayToPct(range.a)}%` }}
              onMouseDown={startDrag("a")}
              onTouchStart={startDrag("a")}
              title={`Start: ${startLabel}`}
            >
              <span className="tl-handle-dot"></span>
            </div>
            <div
              className={`tl-handle ${drag?.kind === "b" ? "is-dragging" : ""}`}
              style={{ left: `${dayToPct(range.b)}%` }}
              onMouseDown={startDrag("b")}
              onTouchStart={startDrag("b")}
              title={`End: ${endLabel}`}
            >
              <span className="tl-handle-dot"></span>
            </div>

            {/* Datapoint markers */}
            <div className="tl-points">
              {TL_DATAPOINTS.map((p, i) => {
                const inRange = p.day >= range.a && p.day <= range.b;
                return (
                  <button
                    key={i}
                    className={`tl-point ${inRange ? "is-in" : ""} ${hover === i ? "is-hover" : ""}`}
                    style={{ left: `${dayToPct(p.day)}%`, "--c": p.color }}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRange({
                        a: Math.max(0, p.day - 10),
                        b: Math.min(TL_TOTAL_DAYS, p.day + 10),
                      });
                    }}
                  >
                    <PointIcon icon={p.icon} />
                  </button>
                );
              })}
              {hover != null && (
                <div
                  className="tl-tip"
                  style={{ left: `${dayToPct(TL_DATAPOINTS[hover].day)}%` }}
                >
                  <span className="tl-tip-time">
                    {TL_DATAPOINTS[hover].time}
                  </span>
                  <span className="tl-tip-label">
                    {TL_DATAPOINTS[hover].label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* hint row */}
          <div className="tl-hints">
            <span>
              <kbd>drag</kbd> handles to resize
            </span>
            <span>
              <kbd>drag</kbd> middle to pan
            </span>
            <span>
              <kbd>click</kbd> a datapoint to zoom in
            </span>
          </div>
        </div>

        {/* Datapoints list view as a result of the timeline range */}
        <div className="tl-list">
          <div className="tl-list-head">
            <div className="card-title">
              DATAPOINTS · {startLabel} → {endLabel}
            </div>
            <div className="muted mono" style={{ fontSize: 12 }}>
              {visiblePoints.length} shown
            </div>
          </div>
          {visiblePoints.length === 0 ? (
            <div className="tl-list-empty">
              No datapoints in this range. Drag the handles wider, or record
              some new annotations.
            </div>
          ) : (
            <div className="tl-list-rows">
              {visiblePoints.map((p, i) => (
                <div key={i} className="tl-list-row">
                  <span
                    className="tl-list-icon"
                    style={{
                      background: `oklch(from ${p.color} l c h / 0.18)`,
                      color: p.color,
                    }}
                  >
                    <PointIcon icon={p.icon} />
                  </span>
                  <span className="tl-list-time">{p.time}</span>
                  <span className="tl-list-label">{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function monthLabel(day) {
  // find which month range this day falls into
  let cur = TL_MONTHS[0].label;
  let curDay = 1;
  for (let i = 0; i < TL_MONTHS.length; i++) {
    const start = TL_MONTHS[i].day;
    const end = i + 1 < TL_MONTHS.length ? TL_MONTHS[i + 1].day : TL_TOTAL_DAYS;
    if (day >= start && day < end) {
      cur = TL_MONTHS[i].label.split(" ")[0]; // short month
      curDay = day - start + 1;
      break;
    }
  }
  return `${curDay} ${cur}`;
}

function PointIcon({ icon }) {
  const common = {
    width: 12,
    height: 12,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (icon) {
    case "wrench":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M14.7 6.3a4 4 0 11-5.4-5.4l2.7 2.7L9.3 6.3M4 20l4.5-4.5M14 13l7 7" />
        </svg>
      );
    case "snow":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 4h18l-7 9v6l-4 2v-8z" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M10.3 3.86a2 2 0 013.4 0l8 14a2 2 0 01-1.7 3H4a2 2 0 01-1.7-3l8-14zM12 9v4M12 17h.01" />
        </svg>
      );
    case "house":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 11l9-8 9 8M5 10v10h14V10" />
        </svg>
      );
    case "window":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M12 3v18M4 12h16" />
        </svg>
      );
    default:
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
  }
}

window.TimelineDragger = TimelineDragger;
window.PointIcon = PointIcon;
