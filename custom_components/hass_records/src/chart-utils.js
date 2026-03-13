/**
 * Shared chart card utilities – styles, shell HTML, canvas setup, tooltips.
 */

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
  .tooltip {
    position: fixed;
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
  .tt-value { color: var(--secondary-text-color); margin-bottom: 4px; }
  .tt-message { font-weight: 500; }
  .tt-annotation { color: var(--secondary-text-color); margin-top: 4px; white-space: pre-wrap; }
  .tt-entities { color: var(--secondary-text-color); margin-top: 6px; white-space: pre-wrap; }
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
          <div class="tt-value" id="tt-value" style="display:none"></div>
          <div style="display:flex;align-items:flex-start;gap:4px">
            <span class="tt-dot" id="tt-dot"></span>
            <span class="tt-message" id="tt-message"></span>
          </div>
          <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
          <div class="tt-entities" id="tt-entities" style="display:none"></div>
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
  canvas.style.width = '100%';
  canvas.style.height = h + "px";
  canvas.getContext("2d").scale(dpr, dpr);
  return { w, h };
}

function showTooltip(card, canvas, renderer, event, clientX, clientY) {
  const tooltip = card.shadowRoot.getElementById("tooltip");
  const ttTime = card.shadowRoot.getElementById("tt-time");
  const ttValue = card.shadowRoot.getElementById("tt-value");
  const ttDot = card.shadowRoot.getElementById("tt-dot");
  const ttMsg = card.shadowRoot.getElementById("tt-message");
  const ttAnn = card.shadowRoot.getElementById("tt-annotation");
  const ttEntities = card.shadowRoot.getElementById("tt-entities");

  ttTime.textContent = fmtDateTime(event.timestamp);
  const hasValue = event.chart_value != null && event.chart_value !== "";
  ttValue.textContent = hasValue
    ? `${Number(event.chart_value).toFixed(2).replace(/\.00$/, "")}${event.chart_unit ? ` ${event.chart_unit}` : ""}`
    : "";
  ttValue.style.display = hasValue ? "block" : "none";
  ttDot.style.background = event.color || "#03a9f4";
  ttMsg.textContent = event.message;
  const ann = event.annotation !== event.message ? event.annotation : "";
  ttAnn.textContent = ann || "";
  ttAnn.style.display = ann ? "block" : "none";
  const entities = (event.entity_ids || [])
    .map((entityId) => entityName(card._hass, entityId))
    .filter(Boolean);
  ttEntities.textContent = entities.length ? `Related: ${entities.join(", ")}` : "";
  ttEntities.style.display = entities.length ? "block" : "none";

  tooltip.style.display = "block";
  const tipRect = tooltip.getBoundingClientRect();
  const tipW = tipRect.width || 220;
  const tipH = tipRect.height || 64;
  const gap = 12;

  let left = clientX + gap;
  if (left + tipW > window.innerWidth - gap) {
    left = clientX - tipW - gap;
  }

  let top = clientY - tipH - gap;
  if (top < gap) {
    top = clientY + gap;
  }

  left = Math.min(Math.max(left, gap), window.innerWidth - gap - tipW);
  top = Math.min(Math.max(top, gap), window.innerHeight - gap - tipH);

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

  canvas.addEventListener("mousemove", (e) => {
    const best = findNearest(e.clientX);
    if (best) {
      showTooltip(card, canvas, renderer, best, e.clientX, e.clientY);
      canvas.style.cursor = "pointer";
    } else {
      hideTooltip(card);
      canvas.style.cursor = "default";
    }
  });

  canvas.addEventListener("mouseleave", () => hideTooltip(card));

  let touchTimer = null;
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const best = findNearest(touch.clientX);
    if (best) {
      showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
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
      showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => hideTooltip(card), 3000);
    } else {
      hideTooltip(card);
    }
  }, { passive: false });
}
