/**
 * Hass Records – Lovelace Cards  v0.2.0
 *
 * Cards:
 *   hass-records-action-card      – Record a custom event via a form
 *   hass-records-history-card     – History chart with event annotation markers
 *   hass-records-statistics-card  – Statistics chart with event annotation markers
 *   hass-records-list-card        – Browse, search, edit and delete all events
 */
(function () {
  "use strict";

  const DOMAIN = "hass_records";
  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];

  /* ─────────────────────────────────────────────────
   * Shared helpers
   * ───────────────────────────────────────────────── */

  async function fetchEvents(hass, startTime, endTime, entityIds) {
    try {
      const msg = {
        type: `${DOMAIN}/events`,
        start_time: startTime,
        end_time: endTime,
      };
      if (entityIds && entityIds.length) msg.entity_ids = entityIds;
      const result = await hass.connection.sendMessagePromise(msg);
      return result.events || [];
    } catch (err) {
      console.warn("[hass-records] fetchEvents failed:", err);
      return [];
    }
  }

  async function deleteEvent(hass, eventId) {
    return hass.connection.sendMessagePromise({
      type: `${DOMAIN}/events/delete`,
      event_id: eventId,
    });
  }

  async function updateEvent(hass, eventId, fields) {
    return hass.connection.sendMessagePromise({
      type: `${DOMAIN}/events/update`,
      event_id: eventId,
      ...fields,
    });
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function fmtDateTime(iso) {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /** Escape HTML for safe inline insertion */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ─────────────────────────────────────────────────
   * SVG Chart Renderer
   *
   * All drawing is done on a <canvas> element.
   * ───────────────────────────────────────────────── */

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

      // Horizontal lines + y-labels
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

      // X-axis ticks + time labels
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

      // Axes
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
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Filled area gradient
      const lastX = this.xOf(points[points.length - 1][0], t0, t1);
      const firstX = this.xOf(points[0][0], t0, t1);
      const baseY = pad.top + this.ch;

      ctx.beginPath();
      first = true;
      for (const [t, v] of points) {
        const x = this.xOf(t, t0, t1);
        const y = this.yOf(v, vMin, vMax);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(lastX, baseY);
      ctx.lineTo(firstX, baseY);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + this.ch);
      grad.addColorStop(0, hexToRgba(color, 0.25));
      grad.addColorStop(1, hexToRgba(color, 0.02));
      ctx.fillStyle = grad;
      ctx.fill();

      // Re-draw the line on top cleanly
      ctx.beginPath();
      first = true;
      for (const [t, v] of points) {
        const x = this.xOf(t, t0, t1);
        const y = this.yOf(v, vMin, vMax);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.restore();
    }

    /**
     * Draw vertical annotation lines with diamond markers at the top.
     * Returns an array of { event, x } for hit-testing.
     */
    drawAnnotations(events, t0, t1) {
      const { ctx, pad } = this;
      const hits = [];

      for (const event of events) {
        const t = new Date(event.timestamp).getTime();
        if (t < t0 || t > t1) continue;

        const x = this.xOf(t, t0, t1);
        const color = event.color || "#03a9f4";
        hits.push({ event, x });

        // Dashed vertical line
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

        // Diamond marker
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
      }

      return hits;
    }
  }

  /* ─────────────────────────────────────────────────
   * Shared chart card base behaviour
   * ───────────────────────────────────────────────── */

  const CHART_STYLE = `
    :host { display: block; }
    ha-card { padding: 0; overflow: hidden; }
    .card-header {
      padding: 16px 16px 0;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .chart-wrap {
      position: relative;
      padding: 8px 12px 12px;
      box-sizing: border-box;
    }
    canvas { display: block; }
    .loading {
      text-align: center;
      padding: 40px 16px;
      color: var(--secondary-text-color);
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
      padding: 0 12px 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78em;
      color: var(--secondary-text-color);
    }
    .legend-line { width: 14px; height: 3px; border-radius: 2px; }
    /* Tooltip */
    .tooltip {
      position: absolute;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.8em;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      display: none;
      max-width: 220px;
      z-index: 10;
      color: var(--primary-text-color);
    }
    .tt-dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      margin-right: 4px;
      flex-shrink: 0;
    }
    .tt-time { color: var(--secondary-text-color); margin-bottom: 3px; }
    .tt-message { font-weight: 500; }
    .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
  `;

  function buildChartCardShell(title) {
    return `
      <style>${CHART_STYLE}</style>
      <ha-card>
        ${title ? `<div class="card-header">${esc(title)}</div>` : ""}
        <div class="chart-wrap">
          <div class="loading" id="loading">Loading…</div>
          <canvas id="chart" style="display:none"></canvas>
          <div class="tooltip" id="tooltip">
            <div class="tt-time" id="tt-time"></div>
            <div style="display:flex;align-items:flex-start;gap:4px">
              <span class="tt-dot" id="tt-dot"></span>
              <span class="tt-message" id="tt-message"></span>
            </div>
            <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
          </div>
        </div>
        <div class="legend" id="legend"></div>
      </ha-card>`;
  }

  function setupCanvas(canvas, container, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth || 360;
    const h = cssHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.getContext("2d").scale(dpr, dpr);
    return { w, h };
  }

  function showTooltip(card, canvas, renderer, event, clientX, clientY, t0, t1) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    const ttTime = card.shadowRoot.getElementById("tt-time");
    const ttDot = card.shadowRoot.getElementById("tt-dot");
    const ttMsg = card.shadowRoot.getElementById("tt-message");
    const ttAnn = card.shadowRoot.getElementById("tt-annotation");
    const wrap = card.shadowRoot.querySelector(".chart-wrap");

    ttTime.textContent = fmtDateTime(event.timestamp);
    ttDot.style.background = event.color || "#03a9f4";
    ttMsg.textContent = event.message;
    const ann = event.annotation !== event.message ? event.annotation : "";
    ttAnn.textContent = ann || "";
    ttAnn.style.display = ann ? "block" : "none";

    tooltip.style.display = "block";
    const wrapRect = wrap.getBoundingClientRect();
    let left = clientX - wrapRect.left + 12;
    let top = clientY - wrapRect.top - 16;
    if (left + 230 > wrap.clientWidth) left = wrap.clientWidth - 234;
    if (top < 0) top = 0;
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  function hideTooltip(card) {
    const tooltip = card.shadowRoot.getElementById("tooltip");
    if (tooltip) tooltip.style.display = "none";
  }

  function attachTooltipBehaviour(card, canvas, renderer, events, t0, t1) {
    function findNearest(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const msPerPx = (t1 - t0) / renderer.cw;
      const threshold = 14 * msPerPx;
      const tAtX = t0 + ((x - renderer.pad.left) / renderer.cw) * (t1 - t0);

      let best = null;
      let bestDist = Infinity;
      for (const ev of events) {
        const t = new Date(ev.timestamp).getTime();
        if (t < t0 || t > t1) continue;
        const d = Math.abs(t - tAtX);
        if (d < threshold && d < bestDist) {
          bestDist = d;
          best = ev;
        }
      }
      return best;
    }

    // Mouse
    canvas.addEventListener("mousemove", (e) => {
      const best = findNearest(e.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, e.clientX, e.clientY, t0, t1);
        canvas.style.cursor = "crosshair";
      } else {
        hideTooltip(card);
        canvas.style.cursor = "default";
      }
    });

    canvas.addEventListener("mouseleave", () => hideTooltip(card));

    // Touch – show tooltip on tap, auto-dismiss after 3 s
    let touchTimer = null;
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY, t0, t1);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip(card), 3000);
      } else {
        hideTooltip(card);
      }
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const best = findNearest(touch.clientX);
      if (best) {
        showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY, t0, t1);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => hideTooltip(card), 3000);
      } else {
        hideTooltip(card);
      }
    }, { passive: false });
  }

  /* ─────────────────────────────────────────────────
   * hass-records-action-card
   * ───────────────────────────────────────────────── */

  class HassRecordsActionCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
    }

    setConfig(config) {
      this._config = config || {};
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._render();
        this._loadRecent();
      }
    }

    _render() {
      this._rendered = true;
      const cfg = this._config;
      const showEntityField = !cfg.entity;
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          ha-card { padding: 16px; }
          .card-header {
            font-size: 1.1em;
            font-weight: 500;
            margin-bottom: 16px;
            color: var(--primary-text-color);
          }
          .form-group { margin-bottom: 12px; }
          label {
            display: block;
            font-size: 0.8em;
            color: var(--secondary-text-color);
            margin-bottom: 3px;
          }
          input[type=text], textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 6px;
            background: var(--secondary-background-color, transparent);
            color: var(--primary-text-color);
            font-size: 0.95em;
            font-family: inherit;
          }
          input[type=text]:focus, textarea:focus {
            outline: none;
            border-color: var(--primary-color);
          }
          textarea { resize: vertical; min-height: 56px; }
          .row { display: flex; gap: 10px; }
          .row .form-group { flex: 1; }
          input[type=color] {
            width: 100%;
            height: 36px;
            padding: 2px;
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 6px;
            cursor: pointer;
            background: none;
          }
          .btn {
            width: 100%;
            margin-top: 6px;
            padding: 10px;
            background: var(--primary-color);
            color: var(--text-primary-color);
            border: none;
            border-radius: 6px;
            font-size: 0.95em;
            font-family: inherit;
            cursor: pointer;
            font-weight: 500;
            letter-spacing: 0.02em;
          }
          .btn:hover { opacity: 0.88; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .feedback {
            font-size: 0.82em;
            margin-top: 8px;
            padding: 6px 10px;
            border-radius: 6px;
            display: none;
          }
          .feedback.ok { background: rgba(76,175,80,0.12); color: var(--success-color, #4caf50); }
          .feedback.err { background: rgba(244,67,54,0.12); color: var(--error-color, #f44336); }
          .recent {
            margin-top: 16px;
            border-top: 1px solid var(--divider-color, #eee);
            padding-top: 12px;
          }
          .recent-title {
            font-size: 0.78em;
            font-weight: 500;
            color: var(--secondary-text-color);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 8px;
          }
          .ev {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            font-size: 0.83em;
            border-bottom: 1px solid var(--divider-color, #eee);
          }
          .ev:last-child { border: none; }
          .ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
          .ev-time { color: var(--secondary-text-color); white-space: nowrap; }
          .ev-msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .ev-actions { display: flex; gap: 4px; flex-shrink: 0; }
          .icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--secondary-text-color);
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 1em;
            line-height: 1;
          }
          .icon-btn:hover { color: var(--primary-text-color); background: var(--divider-color, #eee); }
          .edit-form {
            background: var(--secondary-background-color, #f5f5f5);
            border-radius: 6px;
            padding: 8px;
            margin-top: 4px;
            display: none;
            flex-direction: column;
            gap: 6px;
          }
          .edit-form input[type=text], .edit-form textarea {
            font-size: 0.88em;
            padding: 5px 8px;
          }
          .edit-form textarea { min-height: 40px; }
          .edit-row { display: flex; gap: 6px; }
          .edit-save {
            padding: 5px 12px;
            background: var(--primary-color);
            color: var(--text-primary-color);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
          }
          .edit-cancel {
            padding: 5px 12px;
            background: none;
            color: var(--secondary-text-color);
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
          }
        </style>
        <ha-card>
          <div class="card-header">${esc(cfg.title || "Record Event")}</div>
          <div class="form-group">
            <label>Message *</label>
            <input id="msg" type="text" placeholder="What happened?" />
          </div>
          <div class="form-group">
            <label>Annotation (tooltip text)</label>
            <textarea id="ann" placeholder="Detailed note shown on chart hover…"></textarea>
          </div>
          <div class="row">
            <div class="form-group">
              <label>Icon (MDI)</label>
              <input id="icon" type="text" placeholder="mdi:bookmark" />
            </div>
            <div class="form-group">
              <label>Color</label>
              <input id="color" type="color" value="#03a9f4" />
            </div>
          </div>
          ${
            showEntityField
              ? `<div class="form-group">
                   <label>Entities (optional, comma-separated)</label>
                   <input id="ent" type="text" placeholder="sensor.my_sensor, sensor.other" />
                 </div>`
              : ""
          }
          <button class="btn" id="btn">Record Event</button>
          <div class="feedback" id="feedback"></div>
          <div class="recent" id="recent" style="display:none">
            <div class="recent-title">Recent events</div>
            <div id="ev-list"></div>
          </div>
        </ha-card>`;

      this.shadowRoot.getElementById("btn").addEventListener("click", () => this._record());

      // Ctrl+Enter / Cmd+Enter in annotation textarea also submits
      this.shadowRoot.getElementById("ann").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this._record();
        }
      });
    }

    async _record() {
      const msgEl = this.shadowRoot.getElementById("msg");
      const message = msgEl.value.trim();
      if (!message) {
        msgEl.focus();
        return;
      }

      const btn = this.shadowRoot.getElementById("btn");
      btn.disabled = true;

      const data = { message };
      const ann = this.shadowRoot.getElementById("ann")?.value.trim();
      if (ann) data.annotation = ann;
      const icon = this.shadowRoot.getElementById("icon")?.value.trim();
      if (icon) data.icon = icon;
      data.color = this.shadowRoot.getElementById("color")?.value || "#03a9f4";

      // entity_ids: config entity takes priority, then the text field (comma-separated)
      const configEntity = this._config?.entity;
      const entEl = this.shadowRoot.getElementById("ent");
      const entRaw = entEl?.value.trim() || "";
      const entityIds = configEntity
        ? [configEntity]
        : entRaw
        ? entRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (entityIds.length) data.entity_ids = entityIds;

      const fb = this.shadowRoot.getElementById("feedback");
      try {
        await this._hass.callService(DOMAIN, "record", data);
        msgEl.value = "";
        if (this.shadowRoot.getElementById("ann"))
          this.shadowRoot.getElementById("ann").value = "";
        fb.className = "feedback ok";
        fb.textContent = "Event recorded!";
        fb.style.display = "block";
        setTimeout(() => (fb.style.display = "none"), 3000);
        this._loadRecent();
      } catch (e) {
        fb.className = "feedback err";
        fb.textContent = `Error: ${e.message || "unknown error"}`;
        fb.style.display = "block";
        console.error("[hass-records action-card]", e);
      }

      btn.disabled = false;
    }

    async _loadRecent() {
      const now = new Date();
      const start = new Date(now - 7 * 86400 * 1000).toISOString();
      const events = await fetchEvents(this._hass, start, now.toISOString());
      if (!events.length) {
        this.shadowRoot.getElementById("recent").style.display = "none";
        return;
      }
      this.shadowRoot.getElementById("recent").style.display = "block";
      const recent = [...events].reverse().slice(0, 6);
      const listEl = this.shadowRoot.getElementById("ev-list");
      listEl.innerHTML = recent
        .map(
          (e) => `
          <div class="ev" data-id="${esc(e.id)}">
            <span class="ev-dot" style="background:${esc(e.color)}"></span>
            <span class="ev-time">${fmtDateTime(e.timestamp)}</span>
            <span class="ev-msg" title="${esc(e.message)}">${esc(e.message)}</span>
            <span class="ev-actions">
              <button class="icon-btn edit-btn" title="Edit">✏️</button>
              <button class="icon-btn del-btn" title="Delete">×</button>
            </span>
          </div>
          <div class="edit-form" id="edit-${esc(e.id)}">
            <input type="text" class="edit-msg" placeholder="Message" value="${esc(e.message)}" />
            <textarea class="edit-ann" placeholder="Annotation">${esc(e.annotation !== e.message ? e.annotation : "")}</textarea>
            <div class="edit-row">
              <input type="text" class="edit-icon" placeholder="mdi:bookmark" value="${esc(e.icon || "")}" style="flex:1" />
              <input type="color" class="edit-color" value="${esc(e.color || "#03a9f4")}" style="width:44px" />
            </div>
            <div class="edit-row">
              <button class="edit-save">Save</button>
              <button class="edit-cancel">Cancel</button>
            </div>
          </div>`
        )
        .join("");

      // Wire up delete and edit buttons
      listEl.querySelectorAll(".del-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const row = e.target.closest(".ev");
          const id = row?.dataset.id;
          if (!id) return;
          try {
            await deleteEvent(this._hass, id);
            this._loadRecent();
          } catch (err) {
            console.error("[hass-records] delete failed", err);
          }
        });
      });

      listEl.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const row = e.target.closest(".ev");
          const id = row?.dataset.id;
          if (!id) return;
          const form = this.shadowRoot.getElementById(`edit-${id}`);
          if (!form) return;
          form.style.display = form.style.display === "flex" ? "none" : "flex";
        });
      });

      listEl.querySelectorAll(".edit-save").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const form = e.target.closest(".edit-form");
          if (!form) return;
          const id = form.id.replace("edit-", "");
          const msg = form.querySelector(".edit-msg").value.trim();
          const ann = form.querySelector(".edit-ann").value.trim();
          const icon = form.querySelector(".edit-icon").value.trim();
          const color = form.querySelector(".edit-color").value;
          if (!msg) return;
          try {
            await updateEvent(this._hass, id, { message: msg, annotation: ann || msg, icon, color });
            form.style.display = "none";
            this._loadRecent();
          } catch (err) {
            console.error("[hass-records] update failed", err);
          }
        });
      });

      listEl.querySelectorAll(".edit-cancel").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.target.closest(".edit-form").style.display = "none";
        });
      });
    }

    static getStubConfig() {
      return { title: "Record Event" };
    }
  }

  /* ─────────────────────────────────────────────────
   * Base mixin for chart cards (history + statistics)
   * ───────────────────────────────────────────────── */

  class ChartCardBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._unsubscribe = null;
      this._resizeObserver = null;
      this._lastHistResult = null;
      this._lastEvents = null;
      this._lastT0 = null;
      this._lastT1 = null;
    }

    get _entityIds() {
      // Subclasses provide this
      return [];
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._rendered = true;
        this.shadowRoot.innerHTML = buildChartCardShell(this._config.title);
        this._setupAutoRefresh();
        this._setupResizeObserver();
        this._load();
      }
    }

    disconnectedCallback() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
    }

    _setupAutoRefresh() {
      // Subscribe to HA event bus; re-load chart whenever an event is recorded
      this._hass.connection.subscribeEvents((event) => {
        this._load();
      }, `${DOMAIN}_event_recorded`).then((unsub) => {
        this._unsubscribe = unsub;
      }).catch(() => {
        // subscribeEvents not critical; chart will still load on init
      });
    }

    _setupResizeObserver() {
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      if (!wrap || !window.ResizeObserver) return;
      this._resizeObserver = new ResizeObserver(() => {
        if (this._lastHistResult !== null) {
          this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0, this._lastT1);
        }
      });
      this._resizeObserver.observe(wrap);
    }

    // Subclasses implement _load() and _drawChart()
  }

  /* ─────────────────────────────────────────────────
   * hass-records-history-card
   * ───────────────────────────────────────────────── */

  class HassRecordsHistoryCard extends ChartCardBase {
    setConfig(config) {
      if (!config.entity && !config.entities) {
        throw new Error("hass-records-history-card: define `entity` or `entities`");
      }
      this._config = { hours_to_show: 24, ...config };
    }

    get _entityIds() {
      if (this._config.entities) {
        return this._config.entities.map((e) =>
          typeof e === "string" ? e : e.entity
        );
      }
      return [this._config.entity];
    }

    async _load() {
      const now = new Date();
      const start = new Date(now - this._config.hours_to_show * 3600 * 1000);
      const t0 = start.getTime();
      const t1 = now.getTime();

      try {
        const [histResult, events] = await Promise.all([
          this._hass.connection.sendMessagePromise({
            type: "history/history_during_period",
            start_time: start.toISOString(),
            end_time: now.toISOString(),
            entity_ids: this._entityIds,
            include_start_time_state: true,
            significant_changes_only: false,
            no_attributes: true,
          }),
          fetchEvents(this._hass, start.toISOString(), now.toISOString(), this._entityIds),
        ]);

        this._drawChart(histResult || {}, events, t0, t1);
      } catch (err) {
        this.shadowRoot.getElementById("loading").textContent = "Failed to load data.";
        console.error("[hass-records history-card]", err);
      }
    }

    _drawChart(histResult, events, t0, t1) {
      this._lastHistResult = histResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;

      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const { w, h } = setupCanvas(canvas, wrap, 220);
      const renderer = new ChartRenderer(canvas, w, h);
      renderer.clear();

      const series = [];
      let allVals = [];

      Object.entries(histResult).forEach(([entityId, stateList], i) => {
        const pts = [];
        for (const s of stateList) {
          const v = parseFloat(s.s);
          if (!isNaN(v)) {
            pts.push([Math.round(s.lu * 1000), v]);
            allVals.push(v);
          }
        }
        if (pts.length) {
          series.push({ entityId, pts, color: COLORS[i % COLORS.length] });
        }
      });

      if (!allVals.length) {
        this.shadowRoot.getElementById("loading").textContent =
          "No numeric data in the selected time range.";
        return;
      }

      this.shadowRoot.getElementById("loading").style.display = "none";
      canvas.style.display = "block";

      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const vPad = (vMax - vMin) * 0.1 || 1;

      renderer.drawGrid(t0, t1, vMin - vPad, vMax + vPad);
      for (const s of series) {
        renderer.drawLine(s.pts, s.color, t0, t1, vMin - vPad, vMax + vPad);
      }
      renderer.drawAnnotations(events, t0, t1);

      const legendEl = this.shadowRoot.getElementById("legend");
      legendEl.innerHTML =
        series
          .map(
            (s) => `
          <div class="legend-item">
            <div class="legend-line" style="background:${esc(s.color)}"></div>
            ${esc(s.entityId)}
          </div>`
          )
          .join("") +
        (events.length
          ? `<div class="legend-item">
               <svg width="10" height="10" viewBox="-5 -5 10 10" style="flex-shrink:0">
                 <polygon points="0,-4 4,0 0,4 -4,0" fill="#03a9f4"/>
               </svg>
               ${events.length} event${events.length !== 1 ? "s" : ""}
             </div>`
          : "");

      attachTooltipBehaviour(this, canvas, renderer, events, t0, t1);
    }

    static getStubConfig() {
      return { title: "History with Events", entity: "sensor.example", hours_to_show: 24 };
    }
  }

  /* ─────────────────────────────────────────────────
   * hass-records-statistics-card
   * ───────────────────────────────────────────────── */

  class HassRecordsStatisticsCard extends ChartCardBase {
    setConfig(config) {
      if (!config.entity && !config.entities) {
        throw new Error(
          "hass-records-statistics-card: define `entity` or `entities`"
        );
      }
      this._config = {
        hours_to_show: 24,
        period: "hour",
        stat_types: ["mean"],
        ...config,
      };
    }

    get _statIds() {
      if (this._config.entities) {
        return this._config.entities.map((e) =>
          typeof e === "string" ? e : e.entity || e.statistics_id
        );
      }
      return [this._config.entity];
    }

    get _entityIds() {
      return this._statIds;
    }

    async _load() {
      const now = new Date();
      const start = new Date(now - this._config.hours_to_show * 3600 * 1000);
      const t0 = start.getTime();
      const t1 = now.getTime();

      try {
        const [statsResult, events] = await Promise.all([
          this._hass.connection.sendMessagePromise({
            type: "recorder/statistics_during_period",
            start_time: start.toISOString(),
            end_time: now.toISOString(),
            statistic_ids: this._statIds,
            period: this._config.period,
            types: this._config.stat_types,
            units: {},
          }),
          fetchEvents(this._hass, start.toISOString(), now.toISOString(), this._statIds),
        ]);

        this._drawChart(statsResult || {}, events, t0, t1);
      } catch (err) {
        this.shadowRoot.getElementById("loading").textContent = "Failed to load statistics.";
        console.error("[hass-records statistics-card]", err);
      }
    }

    _drawChart(statsResult, events, t0, t1) {
      this._lastHistResult = statsResult;
      this._lastEvents = events;
      this._lastT0 = t0;
      this._lastT1 = t1;

      const canvas = this.shadowRoot.getElementById("chart");
      const wrap = this.shadowRoot.querySelector(".chart-wrap");
      const { w, h } = setupCanvas(canvas, wrap, 220);
      const renderer = new ChartRenderer(canvas, w, h);
      renderer.clear();

      const series = [];
      let allVals = [];
      let colorIdx = 0;

      for (const [statId, entries] of Object.entries(statsResult)) {
        for (const statType of this._config.stat_types) {
          const pts = [];
          for (const entry of entries) {
            const v = entry[statType];
            if (v === null || v === undefined) continue;
            const tRaw = entry.start;
            const t =
              typeof tRaw === "number"
                ? tRaw * 1000
                : new Date(tRaw).getTime();
            pts.push([t, v]);
            allVals.push(v);
          }
          if (pts.length) {
            series.push({
              label: `${statId} (${statType})`,
              pts,
              color: COLORS[colorIdx % COLORS.length],
            });
            colorIdx++;
          }
        }
      }

      if (!allVals.length) {
        this.shadowRoot.getElementById("loading").textContent =
          "No statistics available in the selected time range.";
        return;
      }

      this.shadowRoot.getElementById("loading").style.display = "none";
      canvas.style.display = "block";

      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const vPad = (vMax - vMin) * 0.1 || 1;

      renderer.drawGrid(t0, t1, vMin - vPad, vMax + vPad);
      for (const s of series) {
        renderer.drawLine(s.pts, s.color, t0, t1, vMin - vPad, vMax + vPad);
      }
      renderer.drawAnnotations(events, t0, t1);

      const legendEl = this.shadowRoot.getElementById("legend");
      legendEl.innerHTML =
        series
          .map(
            (s) => `
          <div class="legend-item">
            <div class="legend-line" style="background:${esc(s.color)}"></div>
            ${esc(s.label)}
          </div>`
          )
          .join("") +
        (events.length
          ? `<div class="legend-item">
               <svg width="10" height="10" viewBox="-5 -5 10 10" style="flex-shrink:0">
                 <polygon points="0,-4 4,0 0,4 -4,0" fill="#03a9f4"/>
               </svg>
               ${events.length} event${events.length !== 1 ? "s" : ""}
             </div>`
          : "");

      attachTooltipBehaviour(this, canvas, renderer, events, t0, t1);
    }

    static getStubConfig() {
      return {
        title: "Statistics with Events",
        entity: "sensor.example",
        hours_to_show: 168,
        period: "hour",
        stat_types: ["mean"],
      };
    }
  }

  /* ─────────────────────────────────────────────────
   * hass-records-list-card
   * ───────────────────────────────────────────────── */

  class HassRecordsListCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._rendered = false;
      this._allEvents = [];
      this._searchQuery = "";
      this._page = 0;
      this._pageSize = 10;
    }

    setConfig(config) {
      this._config = { title: "Event Log", ...config };
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._rendered) {
        this._render();
        this._load();
      }
    }

    _render() {
      this._rendered = true;
      const cfg = this._config;
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          ha-card { padding: 16px; }
          .card-header {
            font-size: 1.1em;
            font-weight: 500;
            margin-bottom: 12px;
            color: var(--primary-text-color);
          }
          .search-wrap { position: relative; margin-bottom: 12px; }
          .search {
            width: 100%;
            box-sizing: border-box;
            padding: 7px 10px 7px 32px;
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 6px;
            background: var(--secondary-background-color, transparent);
            color: var(--primary-text-color);
            font-size: 0.9em;
            font-family: inherit;
          }
          .search:focus { outline: none; border-color: var(--primary-color); }
          .search-icon {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--secondary-text-color);
            font-size: 0.85em;
            pointer-events: none;
          }
          .empty {
            text-align: center;
            padding: 24px;
            color: var(--secondary-text-color);
            font-size: 0.9em;
          }
          .ev-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 8px 0;
            border-bottom: 1px solid var(--divider-color, #eee);
            font-size: 0.85em;
          }
          .ev-row:last-child { border: none; }
          .ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
          .ev-body { flex: 1; min-width: 0; }
          .ev-msg { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .ev-ann { color: var(--secondary-text-color); font-size: 0.9em; margin-top: 1px; white-space: pre-wrap; }
          .ev-meta { color: var(--secondary-text-color); font-size: 0.78em; margin-top: 2px; }
          .ev-actions { display: flex; gap: 4px; flex-shrink: 0; }
          .icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--secondary-text-color);
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 1em;
          }
          .icon-btn:hover { color: var(--primary-text-color); background: var(--divider-color, #eee); }
          .edit-form {
            background: var(--secondary-background-color, #f5f5f5);
            border-radius: 6px;
            padding: 8px;
            margin-top: 6px;
            display: none;
            flex-direction: column;
            gap: 6px;
          }
          .edit-form input[type=text], .edit-form textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 5px 8px;
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 5px;
            background: var(--card-background-color, #fff);
            color: var(--primary-text-color);
            font-size: 0.88em;
            font-family: inherit;
          }
          .edit-form textarea { min-height: 40px; resize: vertical; }
          .edit-row { display: flex; gap: 6px; align-items: center; }
          .edit-save {
            padding: 5px 12px;
            background: var(--primary-color);
            color: var(--text-primary-color);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
          }
          .edit-cancel {
            padding: 5px 12px;
            background: none;
            color: var(--secondary-text-color);
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
          }
          .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            font-size: 0.82em;
            color: var(--secondary-text-color);
          }
          .page-btn {
            background: none;
            border: 1px solid var(--divider-color, #ccc);
            border-radius: 5px;
            padding: 4px 10px;
            cursor: pointer;
            color: var(--primary-text-color);
            font-size: 0.9em;
          }
          .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        </style>
        <ha-card>
          <div class="card-header">${esc(cfg.title)}</div>
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input class="search" id="search" type="text" placeholder="Search events…" />
          </div>
          <div id="list"><div class="empty">Loading…</div></div>
          <div class="pagination" id="pagination" style="display:none">
            <button class="page-btn" id="prev">‹ Prev</button>
            <span id="page-info"></span>
            <button class="page-btn" id="next">Next ›</button>
          </div>
        </ha-card>`;

      this.shadowRoot.getElementById("search").addEventListener("input", (e) => {
        this._searchQuery = e.target.value.toLowerCase();
        this._page = 0;
        this._renderList();
      });

      this.shadowRoot.getElementById("prev").addEventListener("click", () => {
        if (this._page > 0) { this._page--; this._renderList(); }
      });

      this.shadowRoot.getElementById("next").addEventListener("click", () => {
        const pages = Math.ceil(this._filtered().length / this._pageSize);
        if (this._page < pages - 1) { this._page++; this._renderList(); }
      });
    }

    async _load() {
      const cfg = this._config;
      let startTime;
      if (cfg.hours_to_show) {
        startTime = new Date(Date.now() - cfg.hours_to_show * 3600 * 1000).toISOString();
      }
      const entityIds = cfg.entity
        ? [cfg.entity]
        : cfg.entities
        ? cfg.entities.map((e) => (typeof e === "string" ? e : e.entity))
        : undefined;

      this._allEvents = await fetchEvents(
        this._hass,
        startTime,
        undefined,
        entityIds
      );
      // Newest first
      this._allEvents = [...this._allEvents].reverse();
      this._renderList();
    }

    _filtered() {
      if (!this._searchQuery) return this._allEvents;
      return this._allEvents.filter(
        (e) =>
          e.message.toLowerCase().includes(this._searchQuery) ||
          (e.annotation || "").toLowerCase().includes(this._searchQuery)
      );
    }

    _renderList() {
      const filtered = this._filtered();
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / this._pageSize));
      this._page = Math.min(this._page, pages - 1);
      const slice = filtered.slice(this._page * this._pageSize, (this._page + 1) * this._pageSize);

      const listEl = this.shadowRoot.getElementById("list");
      const pagEl = this.shadowRoot.getElementById("pagination");

      if (!total) {
        listEl.innerHTML = `<div class="empty">${this._searchQuery ? "No matching events." : "No events recorded yet."}</div>`;
        pagEl.style.display = "none";
        return;
      }

      listEl.innerHTML = slice
        .map((e) => {
          const annText = e.annotation && e.annotation !== e.message ? e.annotation : "";
          const entities = (e.entity_ids || []).join(", ");
          return `
          <div class="ev-row" data-id="${esc(e.id)}">
            <span class="ev-dot" style="background:${esc(e.color)}"></span>
            <div class="ev-body">
              <div class="ev-msg">${esc(e.message)}</div>
              ${annText ? `<div class="ev-ann">${esc(annText)}</div>` : ""}
              <div class="ev-meta">${fmtDateTime(e.timestamp)}${entities ? " · " + esc(entities) : ""}</div>
              <div class="edit-form" id="ledit-${esc(e.id)}">
                <input type="text" class="edit-msg" placeholder="Message" value="${esc(e.message)}" />
                <textarea class="edit-ann" placeholder="Annotation">${esc(annText)}</textarea>
                <div class="edit-row">
                  <input type="text" class="edit-icon" placeholder="mdi:bookmark" value="${esc(e.icon || "")}" style="flex:1" />
                  <input type="color" class="edit-color" value="${esc(e.color || "#03a9f4")}" style="width:44px" />
                  <button class="edit-save">Save</button>
                  <button class="edit-cancel">Cancel</button>
                </div>
              </div>
            </div>
            <div class="ev-actions">
              <button class="icon-btn edit-btn" title="Edit">✏️</button>
              <button class="icon-btn del-btn" title="Delete">×</button>
            </div>
          </div>`;
        })
        .join("");

      // Pagination controls
      if (pages > 1) {
        pagEl.style.display = "flex";
        this.shadowRoot.getElementById("page-info").textContent =
          `Page ${this._page + 1} of ${pages} (${total} events)`;
        this.shadowRoot.getElementById("prev").disabled = this._page === 0;
        this.shadowRoot.getElementById("next").disabled = this._page >= pages - 1;
      } else {
        pagEl.style.display = "none";
      }

      // Wire delete buttons
      listEl.querySelectorAll(".del-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const row = e.target.closest(".ev-row");
          const id = row?.dataset.id;
          if (!id) return;
          try {
            await deleteEvent(this._hass, id);
            await this._load();
          } catch (err) {
            console.error("[hass-records list-card] delete failed", err);
          }
        });
      });

      // Wire edit toggles
      listEl.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const row = e.target.closest(".ev-row");
          const id = row?.dataset.id;
          if (!id) return;
          const form = this.shadowRoot.getElementById(`ledit-${id}`);
          if (!form) return;
          form.style.display = form.style.display === "flex" ? "none" : "flex";
        });
      });

      // Wire edit save
      listEl.querySelectorAll(".edit-save").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const form = e.target.closest(".edit-form");
          if (!form) return;
          const id = form.id.replace("ledit-", "");
          const msg = form.querySelector(".edit-msg").value.trim();
          const ann = form.querySelector(".edit-ann").value.trim();
          const icon = form.querySelector(".edit-icon").value.trim();
          const color = form.querySelector(".edit-color").value;
          if (!msg) return;
          try {
            await updateEvent(this._hass, id, { message: msg, annotation: ann || msg, icon, color });
            await this._load();
          } catch (err) {
            console.error("[hass-records list-card] update failed", err);
          }
        });
      });

      // Wire edit cancel
      listEl.querySelectorAll(".edit-cancel").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.target.closest(".edit-form").style.display = "none";
        });
      });
    }

    static getStubConfig() {
      return { title: "Event Log" };
    }
  }

  /* ─────────────────────────────────────────────────
   * Register custom elements
   * ───────────────────────────────────────────────── */

  if (!customElements.get("hass-records-action-card")) {
    customElements.define("hass-records-action-card", HassRecordsActionCard);
  }
  if (!customElements.get("hass-records-history-card")) {
    customElements.define("hass-records-history-card", HassRecordsHistoryCard);
  }
  if (!customElements.get("hass-records-statistics-card")) {
    customElements.define("hass-records-statistics-card", HassRecordsStatisticsCard);
  }
  if (!customElements.get("hass-records-list-card")) {
    customElements.define("hass-records-list-card", HassRecordsListCard);
  }

  // Register in Lovelace custom cards list once
  window.customCards = window.customCards || [];
  const registeredTypes = new Set(window.customCards.map((c) => c.type));
  const cardsToAdd = [
    {
      type: "hass-records-action-card",
      name: "Hass Records – Action Card",
      description: "Form card to record a custom event with a message and tooltip annotation.",
      preview: false,
    },
    {
      type: "hass-records-history-card",
      name: "Hass Records – History Card",
      description: "History line chart with coloured annotation markers for recorded events.",
      preview: false,
    },
    {
      type: "hass-records-statistics-card",
      name: "Hass Records – Statistics Card",
      description: "Statistics line chart with coloured annotation markers for recorded events.",
      preview: false,
    },
    {
      type: "hass-records-list-card",
      name: "Hass Records – List Card",
      description: "Browse, search, edit and delete all recorded events.",
      preview: false,
    },
  ];
  cardsToAdd.forEach((card) => {
    if (!registeredTypes.has(card.type)) {
      window.customCards.push(card);
    }
  });

  console.info(
    "%c HASS-RECORDS %c v0.2.0 loaded ",
    "color:#fff;background:#03a9f4;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
    "color:#03a9f4;background:#fff;font-weight:bold;padding:2px 6px;border:1px solid #03a9f4;border-radius:0 3px 3px 0"
  );
})();
