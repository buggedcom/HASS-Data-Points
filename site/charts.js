/* Chart utilities — seeded data generator + canvas renderer for the docs site.
   Designed for showing anomalies and trend lines in a stylized way. */

// Seeded PRNG (mulberry32)
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate a temperature-like signal with anomalies of various kinds.
// kind: which anomaly type to emphasize
//   "trend"   — gradual drift away from rolling average
//   "sudden"  — sharp spikes/drops
//   "outlier" — far-from-IQR points
//   "zscore"  — rolling z-score outliers
//   "flat"    — stuck/flat-line region
//   "compare" — current period diverges vs baseline
//   "mix"     — hero demo, multiple kinds
function generateSeries({
  n = 200,
  seed = 1,
  kind = "mix",
  baseline = 21,
} = {}) {
  const rng = makeRng(seed);
  const t = [];
  for (let i = 0; i < n; i++) {
    // base diurnal-ish cycle
    const day = Math.sin((i / n) * Math.PI * 6) * 1.2;
    // slow drift
    const drift = Math.sin((i / n) * Math.PI * 1.4) * 0.6;
    // noise
    const noise = (rng() - 0.5) * 0.8;
    t.push(baseline + day + drift + noise);
  }

  const anomalies = []; // { i, type, span }

  const placeAnomaly = (start, end, delta, type) => {
    for (let i = start; i <= end && i < n; i++) {
      const fade =
        1 - Math.abs((i - (start + end) / 2) / ((end - start) / 2 + 0.001));
      t[i] += delta * Math.max(0.4, fade);
    }
    anomalies.push({ start, end, type });
  };

  const placeFlat = (start, len, value) => {
    for (let i = start; i < start + len && i < n; i++) t[i] = value;
    anomalies.push({ start, end: start + len - 1, type: "flat" });
  };

  if (kind === "trend") {
    // gradual upward drift in middle
    for (let i = 60; i < 120; i++) t[i] += ((i - 60) / 60) * 3;
    anomalies.push({ start: 75, end: 120, type: "trend" });
  } else if (kind === "sudden") {
    placeAnomaly(48, 53, -6, "sudden");
    placeAnomaly(130, 134, 5, "sudden");
  } else if (kind === "outlier") {
    t[55] -= 8;
    t[110] += 7;
    t[160] -= 6;
    anomalies.push({ start: 54, end: 56, type: "outlier" });
    anomalies.push({ start: 109, end: 111, type: "outlier" });
    anomalies.push({ start: 159, end: 161, type: "outlier" });
  } else if (kind === "zscore") {
    // sustained run of high values
    for (let i = 70; i < 90; i++) t[i] += 3.2 + Math.sin(i) * 0.5;
    anomalies.push({ start: 70, end: 90, type: "zscore" });
    t[140] += 5;
    anomalies.push({ start: 139, end: 141, type: "zscore" });
  } else if (kind === "flat") {
    placeFlat(60, 50, 19.4);
  } else if (kind === "compare") {
    // baseline is lower than current → mark current as elevated
    for (let i = 40; i < n; i++) t[i] += 1.5 + Math.sin(i / 8) * 0.4;
    anomalies.push({ start: 40, end: n - 1, type: "compare" });
  } else if (kind === "similar") {
    // current series drifts away from its peers in two zones
    for (let i = 50; i < 80; i++) t[i] -= 1.5 + ((i - 50) / 30) * 1.5;
    for (let i = 140; i < 170; i++) t[i] += 2 + Math.sin(i / 4) * 0.5;
    anomalies.push({ start: 50, end: 80, type: "similar" });
    anomalies.push({ start: 140, end: 170, type: "similar" });
  } else {
    // mix
    placeAnomaly(28, 34, -5, "sudden");
    t[78] -= 7;
    anomalies.push({ start: 77, end: 79, type: "outlier" });
    placeFlat(108, 22, 19.2);
    for (let i = 150; i < 175; i++) t[i] += ((i - 150) / 25) * 3;
    anomalies.push({ start: 155, end: 175, type: "trend" });
    placeAnomaly(190, 195, 4, "sudden");
  }

  return { values: t, anomalies };
}

// Compute rolling average
function rollingAvg(vals, w) {
  const out = new Array(vals.length).fill(0);
  for (let i = 0; i < vals.length; i++) {
    let s = 0,
      c = 0;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) {
      s += vals[j];
      c++;
    }
    out[i] = s / c;
  }
  return out;
}

// Compute linear regression line
function linearFit(vals) {
  const n = vals.length;
  let sx = 0,
    sy = 0,
    sxy = 0,
    sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += vals[i];
    sxy += i * vals[i];
    sxx += i * i;
  }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return vals.map((_, i) => m * i + b);
}

// Polynomial degree-2 fit via normal equations.
function polyFit(vals) {
  const n = vals.length;
  // build sums
  let S0 = n,
    S1 = 0,
    S2 = 0,
    S3 = 0,
    S4 = 0;
  let T0 = 0,
    T1 = 0,
    T2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i,
      y = vals[i];
    S1 += x;
    S2 += x * x;
    S3 += x * x * x;
    S4 += x * x * x * x;
    T0 += y;
    T1 += x * y;
    T2 += x * x * y;
  }
  // solve 3x3 by Cramer
  const det = (a, b, c, d, e, f, g, h, i) =>
    a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const D = det(S0, S1, S2, S1, S2, S3, S2, S3, S4);
  const Da = det(T0, S1, S2, T1, S2, S3, T2, S3, S4);
  const Db = det(S0, T0, S2, S1, T1, S3, S2, T2, S4);
  const Dc = det(S0, S1, T0, S1, S2, T1, S2, S3, T2);
  const a = Da / D,
    b = Db / D,
    c = Dc / D;
  return vals.map((_, x) => a + b * x + c * x * x);
}

// EMA
function ema(vals, alpha) {
  const out = [vals[0]];
  for (let i = 1; i < vals.length; i++) {
    out.push(alpha * vals[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

// LOWESS-ish (simple tricubic local weighted mean over window)
function lowess(vals, bw) {
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    let sw = 0,
      sv = 0;
    for (
      let j = Math.max(0, i - bw);
      j <= Math.min(vals.length - 1, i + bw);
      j++
    ) {
      const u = Math.abs(i - j) / (bw + 1);
      if (u >= 1) continue;
      const w = Math.pow(1 - u * u * u, 3);
      sw += w;
      sv += w * vals[j];
    }
    out.push(sv / sw);
  }
  return out;
}

// Rate of change per step
function rateOfChange(vals) {
  const out = [0];
  for (let i = 1; i < vals.length; i++) out.push(vals[i] - vals[i - 1]);
  return out;
}

// Canvas chart drawer.
// opts:
//   width, height in CSS px
//   values: number[] required
//   yMin, yMax: optional, auto if absent
//   color: stroke color
//   trend: number[] | null
//   trendColor
//   anomalies: { start, end, type }[]
//   anomalyColor (default blue)
//   baseline: number[] | null (for compare)
//   baselineColor
//   showAxis: bool
//   fillFromBaseline: bool
function drawChart(canvas, opts) {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight || 240;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cw, ch);

  const pad = { l: 36, r: 12, t: 10, b: 22 };
  const vals = opts.values;
  let yMin = opts.yMin,
    yMax = opts.yMax;
  if (yMin == null || yMax == null) {
    const all = [...vals];
    if (opts.baseline) {
      const peers = Array.isArray(opts.baseline[0])
        ? opts.baseline
        : [opts.baseline];
      for (const p of peers) all.push(...p);
    }
    yMin = Math.min(...all);
    yMax = Math.max(...all);
    const pad1 = (yMax - yMin) * 0.15 + 0.5;
    yMin -= pad1;
    yMax += pad1;
  }

  const W = cw - pad.l - pad.r;
  const H = ch - pad.t - pad.b;
  const xs = (i) => pad.l + (i / (vals.length - 1)) * W;
  const ys = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * H;

  // grid + axis
  ctx.strokeStyle = "oklch(0.27 0.012 245)";
  ctx.lineWidth = 1;
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = "oklch(0.55 0.013 245)";
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (g / 4) * H;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(cw - pad.r, y);
    ctx.globalAlpha = g === 4 ? 0.6 : 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (opts.showAxis !== false) {
      const v = yMax - (g / 4) * (yMax - yMin);
      ctx.fillText(v.toFixed(0), 6, y + 4);
    }
  }

  // x labels
  if (opts.xLabels) {
    const labels = opts.xLabels;
    const stride = Math.max(1, Math.floor(labels.length / 5));
    for (let i = 0; i < labels.length; i += stride) {
      const x = xs(Math.round((i / (labels.length - 1)) * (vals.length - 1)));
      ctx.fillText(labels[i], x - 12, ch - 4);
    }
  }

  // anomaly overlays (drawn behind line)
  if (opts.anomalies) {
    const colorMap = {
      sudden: "oklch(0.78 0.135 230 / 0.18)",
      outlier: "oklch(0.78 0.135 230 / 0.20)",
      trend: "oklch(0.7 0.16 305 / 0.20)",
      zscore: "oklch(0.78 0.135 230 / 0.18)",
      flat: "oklch(0.82 0.16 80 / 0.16)",
      compare: "oklch(0.78 0.135 230 / 0.14)",
      similar: "oklch(0.7 0.16 305 / 0.18)",
    };
    const strokeMap = {
      sudden: "oklch(0.78 0.135 230 / 0.6)",
      outlier: "oklch(0.78 0.135 230 / 0.6)",
      trend: "oklch(0.7 0.16 305 / 0.7)",
      zscore: "oklch(0.78 0.135 230 / 0.6)",
      flat: "oklch(0.82 0.16 80 / 0.7)",
      compare: "oklch(0.78 0.135 230 / 0.5)",
      similar: "oklch(0.7 0.16 305 / 0.6)",
    };

    for (const a of opts.anomalies) {
      const x0 = xs(a.start),
        x1 = xs(a.end);
      // compute local y bounds for the slice
      let vMin = Infinity,
        vMax = -Infinity;
      for (let i = a.start; i <= a.end; i++) {
        if (vals[i] < vMin) vMin = vals[i];
        if (vals[i] > vMax) vMax = vals[i];
      }
      const yMid = (ys(vMin) + ys(vMax)) / 2;
      const yRadius = Math.max(8, (ys(vMin) - ys(vMax)) / 2 + 6);
      const xMid = (x0 + x1) / 2;
      const xRadius = Math.max(8, (x1 - x0) / 2 + 4);
      ctx.fillStyle = colorMap[a.type] || colorMap.sudden;
      ctx.strokeStyle = strokeMap[a.type] || strokeMap.sudden;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(xMid, yMid, xRadius, yRadius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // baseline (ghost) — supports single series or array of peer series
  if (opts.baseline) {
    const peers = Array.isArray(opts.baseline[0])
      ? opts.baseline
      : [opts.baseline];
    const baseColor = opts.baselineColor || "oklch(0.55 0.013 245 / 0.8)";
    for (const peer of peers) {
      ctx.strokeStyle = baseColor;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < peer.length; i++) {
        const x = xs(i),
          y = ys(peer[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // main line
  ctx.strokeStyle = opts.color || "oklch(0.78 0.135 230)";
  ctx.lineWidth = 1.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < vals.length; i++) {
    const x = xs(i),
      y = ys(vals[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // trend overlay (drawn on top)
  if (opts.trend) {
    ctx.strokeStyle = opts.trendColor || "oklch(0.82 0.16 80)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let i = 0; i < opts.trend.length; i++) {
      const x = xs(i),
        y = ys(opts.trend[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // optional rate-of-change band (small chart underneath, not used inline)
  return { xs, ys, pad, W, H };
}

window.Charts = {
  makeRng,
  generateSeries,
  rollingAvg,
  linearFit,
  polyFit,
  ema,
  lowess,
  rateOfChange,
  drawChart,
};
