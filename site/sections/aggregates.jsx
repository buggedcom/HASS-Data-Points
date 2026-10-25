/* Aggregate series — interactive demo of per-row aggregates */

const AGG_H = 326; // 13 days + 14 h → last day/week are partial
const AGG_START = new Date(2026, 2, 2); // Mon 2 Mar 2026

function aggRng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const AGG_DATA = (() => {
  const r = aggRng(7);
  const temp = [];
  for (let i = 0; i < AGG_H * 4; i++) {
    const t = i / 4, day = Math.floor(t / 24);
    const snap = day === 8 ? -2.2 * Math.sin(Math.PI * (t % 24) / 24) : 0;
    temp.push(20.4 + 1.5 * Math.sin(2 * Math.PI * ((t % 24) - 10) / 24) + snap + (r() - 0.5) * 0.5);
  }
  const energy = [], opens = [], openMin = [], ev = [];
  for (let h = 0; h < AGG_H; h++) {
    const hod = h % 24, day = Math.floor(h / 24), we = day % 7 >= 5;
    let e = 0.3 + (hod < 6 ? 0.5 : 0) + (hod >= 6 && hod < 9 ? 1.1 : 0) + (hod >= 17 && hod < 22 ? 1.4 : 0) + (we && hod >= 10 && hod < 16 ? 0.6 : 0) + (day === 8 ? 0.9 : 0) + r() * 0.35;
    energy.push(e);
    const awake = hod >= 7 && hod < 23;
    const o = awake ? Math.floor(r() * (we ? 5 : 3.2)) : 0;
    opens.push(o);
    let m = 0; for (let k = 0; k < o; k++) m += 1 + r() * 7;
    openMin.push(Math.min(60, m));
    ev.push({ single_press: awake ? Math.floor(r() * 2.2) : 0, double_press: awake && r() < 0.15 ? 1 : 0, long_press: awake && r() < 0.05 ? 1 : 0 });
  }
  return { temp, energy, opens, openMin, ev };
})();

const AGG_SOURCES = [
  { id: "temp", name: "Living room temperature", eid: "sensor.living_room_temperature", kind: "measurement", unit: "°C", color: "oklch(0.78 0.2 245)", note: "state_class: measurement" },
  { id: "energy", name: "Heat pump energy", eid: "sensor.heat_pump_energy", kind: "consumption", unit: "kWh", color: "oklch(0.82 0.16 80)", note: "state_class: total_increasing" },
  { id: "door", name: "Back door", eid: "binary_sensor.back_door", kind: "binary", unit: "", color: "oklch(0.78 0.16 150)", note: "device_class: door" },
  { id: "button", name: "Hallway button", eid: "event.hallway_button", kind: "event", unit: "events", color: "oklch(0.75 0.16 305)", note: "event_types: single, double, long press" }
];
const AGG_OPS = {
  measurement: [["mean", "Mean"], ["min", "Minimum"], ["max", "Maximum"], ["median", "Median"], ["first", "First reading"], ["last", "Last reading"]],
  consumption: [["consumption", "Consumption"]],
  binary: [["transition_count", "Count changes to a state"], ["all_changes", "Count all state changes"], ["state_duration", "Time in a state"], ["state_percentage", "Percentage of time in a state"]],
  event: [["event_count", "Count events"]]
};
const AGG_DASH = { mean: "10 4", min: "2 4", max: "2 4 10 4", median: "6 3 2 3", first: "1 5", last: "1 3 1 3 8 3" };
const AGG_CUMULATIVE = ["consumption", "transition_count", "all_changes", "state_duration", "event_count"];
const AGG_INTERVALS = [["hour", "Hourly", 1], ["day", "Daily", 24], ["week", "Weekly", 168]];
const AGG_EVTYPES = ["single_press", "double_press", "long_press"];

function aggCompute(src, op, size, opts) {
  const n = Math.ceil(AGG_H / size), out = [];
  for (let b = 0; b < n; b++) {
    const h0 = b * size, h1 = Math.min(AGG_H, h0 + size);
    let v;
    if (src.kind === "measurement") {
      const s = AGG_DATA.temp.slice(h0 * 4, h1 * 4);
      if (op === "mean") v = s.reduce((a, x) => a + x, 0) / s.length;
      else if (op === "min") v = Math.min(...s);
      else if (op === "max") v = Math.max(...s);
      else if (op === "median") { const q = [...s].sort((a, c) => a - c); const m = q.length >> 1; v = q.length % 2 ? q[m] : (q[m - 1] + q[m]) / 2; }
      else if (op === "first") v = s[0];
      else v = s[s.length - 1];
    } else {
      v = 0;
      for (let h = h0; h < h1; h++) {
        if (op === "consumption") v += AGG_DATA.energy[h];
        else if (op === "transition_count") v += AGG_DATA.opens[h];
        else if (op === "all_changes") v += AGG_DATA.opens[h] * 2;
        else if (op === "state_duration" || op === "state_percentage") v += opts.state === "on" ? AGG_DATA.openMin[h] : 60 - AGG_DATA.openMin[h];
        else if (op === "event_count") opts.types.forEach((t) => { v += AGG_DATA.ev[h][t]; });
      }
      if (op === "state_duration") v = v / 60;
      if (op === "state_percentage") v = (v / ((h1 - h0) * 60)) * 100;
    }
    out.push({ b, h0, h1, v, partial: h1 - h0 < size });
  }
  if (opts.cumulative && AGG_CUMULATIVE.includes(op)) { let run = 0; out.forEach((p) => { run += p.v; p.v = run; }); }
  return out;
}

function aggUnit(src, op) {
  if (src.kind === "measurement") return "°C";
  if (op === "consumption") return "kWh";
  if (op === "state_duration") return "h";
  if (op === "state_percentage") return "%";
  if (op === "event_count") return "events";
  return "changes";
}
const aggFmt = (v, u) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + (u === "%" ? "%" : " " + u);

function AggregateDemo() {
  const [srcId, setSrcId] = React.useState("energy");
  const [ops, setOps] = React.useState({ temp: ["mean", "max"], energy: ["consumption"], door: ["transition_count"], button: ["event_count"] });
  const [interval, setInterval_] = React.useState("day");
  const [cumulative, setCumulative] = React.useState(false);
  const [state, setState] = React.useState("on");
  const [types, setTypes] = React.useState(AGG_EVTYPES);
  const [hover, setHover] = React.useState(null);
  const src = AGG_SOURCES.find((s) => s.id === srcId);
  const size = AGG_INTERVALS.find((i) => i[0] === interval)[2];
  const sel = ops[srcId];
  const multi = src.kind === "measurement";
  const pick = (op) => setOps((o) => ({ ...o, [srcId]: multi ? (o[srcId].includes(op) ? o[srcId].filter((x) => x !== op) : [...o[srcId], op]) : [op] }));
  const canCum = !multi && sel.some((o) => AGG_CUMULATIVE.includes(o));
  const cum = canCum && cumulative;
  const series = sel.map((op) => ({ op, pts: aggCompute(src, op, size, { cumulative: cum, state, types: types.length ? types : AGG_EVTYPES }) }));
  const bars = !multi && !cum;
  const unit = aggUnit(src, sel[0]);

  const W = 900, L = 56, R = 14, T = 78, B = 268, PW = W - L - R;
  const xOf = (h) => L + (h / AGG_H) * PW;
  const all = series.flatMap((s) => s.pts.map((p) => p.v));
  let lo = multi ? Math.min(...all) : 0, hi = Math.max(...all, 0.001);
  if (multi) { const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad; } else hi *= 1.12;
  const yOf = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);

  // raw source strip
  let rawPath = "", rawBars = null;
  if (src.kind === "measurement") {
    const d = AGG_DATA.temp, mn = Math.min(...d), mx = Math.max(...d);
    rawPath = d.map((v, i) => `${i ? "L" : "M"}${xOf(i / 4).toFixed(1)},${(60 - ((v - mn) / (mx - mn)) * 44).toFixed(1)}`).join("");
  } else {
    const raw = src.kind === "consumption" ? AGG_DATA.energy : src.kind === "binary" ? AGG_DATA.openMin : AGG_DATA.ev.map((e) => e.single_press + e.double_press + e.long_press);
    const mx = Math.max(...raw);
    rawBars = raw.map((v, h) => v ? <rect key={h} x={xOf(h)} y={60 - (v / mx) * 44} width={Math.max(1, PW / AGG_H - 0.6)} height={(v / mx) * 44} fill={src.color} opacity="0.45"></rect> : null);
  }

  const days = Array.from({ length: 14 }, (_, d) => d);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    if (x < L || x > W - R) return setHover(null);
    setHover(Math.min(Math.floor((((x - L) / PW) * AGG_H) / size), series[0].pts.length - 1));
  };
  const hp = hover != null ? series.map((s) => ({ op: s.op, p: s.pts[hover] })) : null;
  const dateOf = (h) => { const d = new Date(AGG_START.getTime() + h * 3600e3); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + (size === 1 ? " " + String(d.getHours()).padStart(2, "0") + ":00" : ""); };
  const opLabel = (op) => (AGG_OPS[src.kind].find((o) => o[0] === op) || [op, op])[1];

  return (
    <div className="agg-demo">
      <div className="agg-controls">
        <div className="agg-ctl">
          <span className="agg-lbl">Source row</span>
          <div className="agg-srcs">
            {AGG_SOURCES.map((s) => (
              <button key={s.id} className={"agg-src" + (s.id === srcId ? " is-active" : "")} onClick={() => { setSrcId(s.id); setHover(null); }}>
                <span className="sw" style={{ background: s.color }}></span>
                <span><b>{s.name}</b><em className="mono">{s.eid}</em></span>
              </button>
            ))}
          </div>
        </div>
        <div className="agg-ctl">
          <span className="agg-lbl">Aggregate series {multi ? "· pick any" : ""}</span>
          <div className="agg-ops">
            {AGG_OPS[src.kind].map(([k, l]) => (
              <label key={k} className={"wiz-check" + (sel.includes(k) ? " on" : "")}>
                <input type="checkbox" checked={sel.includes(k)} onChange={() => pick(k)} />
                <span className="box"></span>{l}
                {multi && <svg width="34" height="8" style={{ marginLeft: "auto" }}><line x1="0" y1="4" x2="34" y2="4" stroke={src.color} strokeWidth="2" strokeDasharray={AGG_DASH[k]}></line></svg>}
              </label>
            ))}
          </div>
          {src.kind === "consumption" && <div className="agg-hint">Numeric rows also offer mean, min, max, median, first and last. Consumption appears for <span className="mono">total</span> and <span className="mono">total_increasing</span> sensors and handles meter resets.</div>}
        </div>
        <div className="agg-ctl agg-row">
          <div>
            <span className="agg-lbl">Interval</span>
            <div className="seg">{AGG_INTERVALS.map(([k, l]) => <button key={k} className={interval === k ? "is-active" : ""} onClick={() => { setInterval_(k); setHover(null); }}>{l}</button>)}</div>
          </div>
          {src.kind === "binary" && sel[0] !== "all_changes" && (
            <div>
              <span className="agg-lbl">State</span>
              <div className="seg">{[["on", "Open"], ["off", "Closed"]].map(([k, l]) => <button key={k} className={state === k ? "is-active" : ""} onClick={() => setState(k)}>{l}</button>)}</div>
            </div>
          )}
          {canCum && (
            <label className={"wiz-check" + (cumulative ? " on" : "")} style={{ alignSelf: "flex-end" }}>
              <input type="checkbox" checked={cumulative} onChange={() => setCumulative((c) => !c)} />
              <span className="box"></span>Cumulative
            </label>
          )}
        </div>
        {src.kind === "event" && (
          <div className="agg-ctl">
            <span className="agg-lbl">Event types</span>
            <div className="agg-types">
              {AGG_EVTYPES.map((t) => (
                <label key={t} className={"wiz-check" + (types.includes(t) ? " on" : "")}>
                  <input type="checkbox" checked={types.includes(t)} onChange={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} />
                  <span className="box"></span><span className="mono">{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="agg-chart">
        <div className="agg-readout">
          {hp ? (
            <>
              <span className="mono agg-when">{dateOf(hp[0].p.h0)}{size > 1 ? " – " + dateOf(hp[0].p.h1 - 1) : ""}</span>
              {hp.map(({ op, p }) => <span key={op}><em>{opLabel(op)}{cum ? " (cumulative)" : ""}</em> <b>{aggFmt(p.v, unit)}</b>{p.partial && <i> · incomplete</i>}</span>)}
            </>
          ) : <span className="agg-when">Hover the chart to read each period. Dashed outlines mark incomplete periods.</span>}
        </div>
        <svg viewBox={`0 0 ${W} 300`} width="100%" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Aggregate series chart">
          <defs>
            <pattern id="agg-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke={src.color} strokeWidth="2" opacity="0.6"></line></pattern>
          </defs>
          <text x={L} y="11" className="agg-ax">raw · {src.name}</text>
          {rawPath && <path d={rawPath} fill="none" stroke={src.color} strokeWidth="1" opacity="0.55"></path>}
          {rawBars}
          <line x1={L} x2={W - R} y1="66" y2="66" stroke="var(--line)" strokeWidth="0.6"></line>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={L} x2={W - R} y1={yOf(t)} y2={yOf(t)} stroke="var(--line)" strokeWidth="0.5" strokeDasharray={i ? "2 4" : ""}></line>
              <text x={L - 6} y={yOf(t) + 3} textAnchor="end" className="agg-ax">{aggFmt(t, unit).replace(" changes", "").replace(" events", "")}</text>
            </g>
          ))}
          {hover != null && <rect x={xOf(series[0].pts[hover].h0)} y={T - 6} width={xOf(series[0].pts[hover].h1) - xOf(series[0].pts[hover].h0)} height={B - T + 6} fill="var(--fg)" opacity="0.06"></rect>}
          {bars && series[0].pts.map((p) => {
            const x = xOf(p.h0), w = Math.max(1, xOf(p.h1) - x - (size > 1 ? 4 : 0.6)), y = yOf(p.v);
            return <rect key={p.b} x={x + (size > 1 ? 2 : 0)} y={y} width={w} height={B - y} rx={size > 1 ? 3 : 0}
              fill={p.partial ? "url(#agg-hatch)" : src.color} opacity={p.partial ? 1 : 0.85} stroke={p.partial ? src.color : "none"} strokeDasharray="3 3"></rect>;
          })}
          {!bars && series.map(({ op, pts }) => {
            const d = cum
              ? pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.h1).toFixed(1)},${yOf(p.v).toFixed(1)}`).join("")
              : pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.h0).toFixed(1)},${yOf(p.v).toFixed(1)}H${xOf(p.h1).toFixed(1)}`).join("");
            return <path key={op} d={(cum ? `M${xOf(0)},${yOf(0)}` : "") + (cum ? d.replace(/^M/, "L") : d)} fill="none" stroke={src.color} strokeWidth="2.2" strokeDasharray={multi ? AGG_DASH[op] : ""} strokeLinejoin="round"></path>;
          })}
          {days.map((d) => d % (size === 168 ? 7 : 2) === 0 && (
            <text key={d} x={xOf(d * 24)} y="288" className="agg-ax">{new Date(AGG_START.getTime() + d * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</text>
          ))}
        </svg>
        <div className="chart-note-mini">Indicative for documentation purposes — charts in the integration look different.</div>
      </div>
    </div>
  );
}

function Aggregates() {
  return (
    <section className="section" id="aggregates">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow"><span className="dot"></span> Aggregate series</div>
          <h2>Roll any entity up by hour, day, week or month.</h2>
          <p className="lead">
            Raw history answers “what was the value at 14:05?”. Most questions are about periods: how much energy
            did the heat pump use each day, how often was the back door opened, what share of the week was the
            dehumidifier running. Aggregate series compute those answers per target row and draw them on the
            same chart as the raw data, datapoints and anomalies.
          </p>
        </div>

        <AggregateDemo />

        <div className="agg-facts">
          <div>
            <h4>Operations follow the entity</h4>
            <ul className="bullets">
              <li><span><b>Numeric sensors:</b> mean, minimum, maximum, median, first and last reading.</span></li>
              <li><span><b>Meters</b> (<span className="mono">total</span>, <span className="mono">total_increasing</span>): consumption per period, using Home Assistant's statistics.</span></li>
              <li><span><b>Binary and text states:</b> count changes to a state, count all changes, time in a state, percentage of time in a state. Labels follow the device class (Open/Closed, Detected/Clear, Locked/Unlocked).</span></li>
              <li><span><b>Event entities:</b> count events, for all event types or only the ones you pick.</span></li>
            </ul>
          </div>
          <div>
            <h4>Periods you can trust</h4>
            <ul className="bullets">
              <li><span><b>Intervals:</b> every minute, 15 minutes, 30 minutes, hourly, daily, weekly and monthly.</span></li>
              <li><span><b>Calendar-aligned</b> to Home Assistant's configured time zone, never the browser's, so a “day” is your day.</span></li>
              <li><span><b>Incomplete periods are flagged</b> when a period is cut off by the range or has missing data, and the chart tells you why.</span></li>
              <li><span><b>Cumulative mode</b> for counts, durations and consumption, with an option to reset the running total to the zoomed range.</span></li>
            </ul>
          </div>
          <div>
            <h4>Readable on a busy chart</h4>
            <ul className="bullets">
              <li><span>Aggregates keep the source row's colour. Each operation has its own <b>dash pattern</b>, so mean and max are distinguishable at a glance.</span></li>
              <li><span>Counts, durations and consumption draw as <b>bars</b>; measurements draw as stepped <b>lines</b>.</span></li>
              <li><span>Hiding a row hides its aggregates. Several aggregates can sit on one row at once.</span></li>
              <li><span>Configured per row in the analysis panel and saved with the view.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Aggregates = Aggregates;
