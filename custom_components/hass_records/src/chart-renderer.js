/**
 * Canvas-based chart renderer – grids, lines, annotations.
 */

class ChartRenderer {
  constructor(canvas, cssWidth, cssHeight) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cssW = cssWidth;
    this.cssH = cssHeight;
    this.pad = { top: 24, right: 20, bottom: 36, left: 56 };
  }

  get cw() {
    return this.cssW - this.pad.left - this.pad.right;
  }
  get ch() {
    return this.cssH - this.pad.top - this.pad.bottom;
  }

  xOf(t, t0, t1) {
    return this.pad.left + ((t - t0) / (t1 - t0)) * this.cw;
  }

  yOf(v, vMin, vMax) {
    return this.pad.top + this.ch - ((v - vMin) / (vMax - vMin)) * this.ch;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(t0, t1, vMin, vMax, yTicks = 5) {
    const { ctx, pad } = this;
    const gridColor = "rgba(128,128,128,0.15)";
    const labelColor = "rgba(128,128,128,0.85)";

    ctx.font = "10px sans-serif";

    for (let i = 0; i <= yTicks; i++) {
      const v = vMin + (i / yTicks) * (vMax - vMin);
      const y = this.yOf(v, vMin, vMax);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + this.cw, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label =
        Math.abs(v) >= 1000
          ? (v / 1000).toFixed(1) + "k"
          : v.toFixed(v % 1 !== 0 ? 1 : 0);
      ctx.fillText(label, pad.left - 6, y);
    }

    const tickCount = Math.max(2, Math.min(6, Math.floor(this.cw / 80)));
    for (let i = 0; i <= tickCount; i++) {
      const t = t0 + (i / tickCount) * (t1 - t0);
      const x = this.xOf(t, t0, t1);

      ctx.strokeStyle = "rgba(128,128,128,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + this.ch);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(fmtTime(new Date(t).toISOString()), x, pad.top + this.ch + 6);
    }

    ctx.strokeStyle = "rgba(128,128,128,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + this.ch);
    ctx.lineTo(pad.left + this.cw, pad.top + this.ch);
    ctx.stroke();
  }

  drawLine(points, color, t0, t1, vMin, vMax) {
    if (!points.length) return;
    const { ctx, pad } = this;

    ctx.save();
    ctx.beginPath();
    let first = true;
    for (const [t, v] of points) {
      const x = this.xOf(t, t0, t1);
      const y = this.yOf(v, vMin, vMax);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const lastX = this.xOf(points[points.length - 1][0], t0, t1);
    const firstX = this.xOf(points[0][0], t0, t1);
    const baseY = pad.top + this.ch;

    ctx.beginPath();
    first = true;
    for (const [t, v] of points) {
      const x = this.xOf(t, t0, t1);
      const y = this.yOf(v, vMin, vMax);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(lastX, baseY);
    ctx.lineTo(firstX, baseY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + this.ch);
    grad.addColorStop(0, hexToRgba(color, 0.25));
    grad.addColorStop(1, hexToRgba(color, 0.02));
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    first = true;
    for (const [t, v] of points) {
      const x = this.xOf(t, t0, t1);
      const y = this.yOf(v, vMin, vMax);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.restore();
  }

  drawAnnotations(events, t0, t1) {
    const { ctx, pad } = this;
    const hits = [];

    for (const event of events) {
      const t = new Date(event.timestamp).getTime();
      if (t < t0 || t > t1) continue;

      const x = this.xOf(t, t0, t1);
      const color = event.color || "#03a9f4";

      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(x, pad.top + 8);
      ctx.lineTo(x, pad.top + this.ch);
      ctx.stroke();
      ctx.restore();

      const d = 5;
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, pad.top - d);
      ctx.lineTo(x + d, pad.top);
      ctx.lineTo(x, pad.top + d);
      ctx.lineTo(x - d, pad.top);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      hits.push({ event, x, y: pad.top });
    }

    return hits;
  }

  /**
   * Draw sensor-style vertical annotation lines that terminate on the data line
   * with a small circle marker.
   */
  drawAnnotationLinesOnLine(events, allSeries, t0, t1, vMin, vMax) {
    const { ctx, pad } = this;
    const firstPts = allSeries.length ? allSeries[0].pts : [];
    const hits = [];

    for (const event of events) {
      const t = new Date(event.timestamp).getTime();
      if (t < t0 || t > t1) continue;

      const x = this.xOf(t, t0, t1);
      const value = this._interpolateValue(firstPts, t);
      if (value === null) continue;
      const y = this.yOf(value, vMin, vMax);

      const color = event.color || "#03a9f4";

      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(x, pad.top + this.ch);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      hits.push({ event, x, y, value });
    }

    return hits;
  }

  /**
   * Interpolate the Y pixel position on a data series at a given timestamp.
   * Uses linear interpolation between surrounding data points.
   */
  _interpolateY(seriesPoints, t, t0, t1, vMin, vMax) {
    if (!seriesPoints.length) return null;
    // Before first or after last point – clamp to nearest
    if (t <= seriesPoints[0][0]) return this.yOf(seriesPoints[0][1], vMin, vMax);
    if (t >= seriesPoints[seriesPoints.length - 1][0])
      return this.yOf(seriesPoints[seriesPoints.length - 1][1], vMin, vMax);
    // Find the two surrounding points
    for (let i = 0; i < seriesPoints.length - 1; i++) {
      const [t1p, v1p] = seriesPoints[i];
      const [t2p, v2p] = seriesPoints[i + 1];
      if (t >= t1p && t <= t2p) {
        const frac = (t - t1p) / (t2p - t1p);
        const v = v1p + frac * (v2p - v1p);
        return this.yOf(v, vMin, vMax);
      }
    }
    return null;
  }

  _interpolateValue(seriesPoints, t) {
    if (!seriesPoints.length) return null;
    if (t <= seriesPoints[0][0]) return seriesPoints[0][1];
    if (t >= seriesPoints[seriesPoints.length - 1][0]) {
      return seriesPoints[seriesPoints.length - 1][1];
    }
    for (let i = 0; i < seriesPoints.length - 1; i++) {
      const [t1p, v1p] = seriesPoints[i];
      const [t2p, v2p] = seriesPoints[i + 1];
      if (t >= t1p && t <= t2p) {
        const frac = (t - t1p) / (t2p - t1p);
        return v1p + frac * (v2p - v1p);
      }
    }
    return null;
  }

  /**
   * Draw annotation markers directly on a sensor data line.
   * No vertical dotted line — only a coloured circle on the line.
   *
   * @param {Array} events    Recorded events array
   * @param {Array} allSeries Array of {pts} objects — first series used for Y
   * @param {number} t0       Start time ms
   * @param {number} t1       End time ms
   * @param {number} vMin     Y axis min
   * @param {number} vMax     Y axis max
   * @returns {Array}         Array of {event, x, y} for hit-testing
   */
  drawAnnotationsOnLine(events, allSeries, t0, t1, vMin, vMax) {
    const { ctx } = this;
    const firstPts = allSeries.length ? allSeries[0].pts : [];
    const hits = [];

    for (const event of events) {
      const t = new Date(event.timestamp).getTime();
      if (t < t0 || t > t1) continue;

      const x = this.xOf(t, t0, t1);
      const value = this._interpolateValue(firstPts, t);
      if (value === null) continue;
      const y = this.yOf(value, vMin, vMax);

      const color = event.color || "#03a9f4";
      const r = 10;

      // White outline circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.restore();

      // Coloured circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      hits.push({ event, x, y, value });
    }

    return hits;
  }
}
