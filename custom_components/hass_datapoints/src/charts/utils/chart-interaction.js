import {
  areaIcon,
  areaName,
  deviceIcon,
  deviceName,
  entityIcon,
  entityName,
  labelIcon,
  labelName,
} from "@/lib/ha/entity-name.js";
import { esc, fmtDateTime } from "@/lib/util/format.js";
import {
  clampChartValue,
  formatTooltipDisplayValue,
  formatTooltipValue,
} from "@/lib/chart/chart-shell.js";
import {
  positionTooltip,
  renderChartAxisHoverDots,
} from "@/charts/utils/chart-dom.js";

/**
 * Returns the DOM root that contains the chart's elements.
 * For cards with a shadow root (legacy HTMLElement-based cards) this is
 * `card.shadowRoot`. For sub-components that render into the parent's shadow
 * DOM (like `hass-datapoints-history-chart`) there is no own shadow root, so we fall back
 * to `getRootNode()` which returns the ancestor ShadowRoot.
 */
function getRoot(card) {
  return card.shadowRoot ?? card.getRootNode();
}

function formatTooltipDateTimeFromMs(timeMs) {
  if (!Number.isFinite(timeMs)) {
    return "";
  }
  return fmtDateTime(new Date(timeMs).toISOString());
}

const ANOMALY_METHOD_LABELS = {
  trend_residual: "Trend deviation",
  rate_of_change: "Sudden change",
  iqr: "Statistical outlier (IQR)",
  rolling_zscore: "Rolling Z-score",
  persistence: "Flat-line / stuck",
  comparison_window: "Comparison window",
};

function buildAnomalyMethodSection(region) {
  // Returns { methodLabel, description, alert } for a single region, or null if invalid.
  if (!region?.cluster?.points?.length) return null;
  const points = region.cluster.points;
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const peakPoint = points.reduce(
    (peak, p) =>
      !peak || Math.abs(p.residual) > Math.abs(peak.residual) ? p : peak,
    null
  );
  if (!peakPoint) return null;

  const label = region.label || region.relatedEntityId || "Series";
  const unit = region.unit || "";
  const cluster = region.cluster;
  const method = cluster.anomalyMethod;
  const methodLabel = ANOMALY_METHOD_LABELS[method] || method;

  let description;
  let alert;
  if (method === "rate_of_change") {
    const rateUnit = unit ? `${unit}/h` : "units/h";
    description = `${label} shows an unusual rate of change between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak rate deviation: ${formatTooltipValue(peakPoint.residual, rateUnit)} from a typical rate of ${formatTooltipValue(peakPoint.baselineValue, rateUnit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "iqr") {
    description = `${label} contains statistical outliers between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak value: ${formatTooltipValue(peakPoint.value, unit)}, deviating ${formatTooltipValue(Math.abs(peakPoint.residual), unit)} from the median at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "rolling_zscore") {
    description = `${label} shows statistically unusual values between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a rolling mean of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "persistence") {
    const flatRange =
      typeof cluster.flatRange === "number" ? cluster.flatRange : null;
    const rangeStr =
      flatRange !== null
        ? ` (range: ${formatTooltipValue(flatRange, unit)})`
        : "";
    description = `${label} appears stuck or flat between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}${rangeStr}.`;
    alert = `Value remained near ${formatTooltipValue(peakPoint.baselineValue, unit)} for an unusually long period.`;
  } else if (method === "comparison_window") {
    description = `${label} deviates significantly from the comparison window between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation from comparison: ${formatTooltipValue(peakPoint.residual, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else {
    description = `${label} deviates from its expected trend between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a baseline of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  }
  return { methodLabel, description, alert };
}

function buildAnomalyTooltipContent(regions) {
  let regionsArray;
  if (Array.isArray(regions)) {
    regionsArray = regions;
  } else if (regions) {
    regionsArray = [regions];
  } else {
    regionsArray = [];
  }
  if (regionsArray.length === 0) return null;

  const sections = regionsArray.map(buildAnomalyMethodSection).filter(Boolean);
  if (sections.length === 0) return null;

  const instruction = "Click the highlighted circle to add an annotation.";

  // Single region — check for "only" mode overlap (single cluster confirmed by multiple methods)
  if (sections.length === 1) {
    const section = sections[0];
    const cluster = regionsArray[0]?.cluster;
    const detectedByMethods =
      Array.isArray(cluster?.detectedByMethods) &&
      cluster.detectedByMethods.length > 1
        ? cluster.detectedByMethods
        : null;
    const isMultiMethod = detectedByMethods !== null;
    const title = isMultiMethod
      ? "⚠️ Multi-method Anomaly"
      : "⚠️ Anomaly Insight";
    const confirmedNote = isMultiMethod
      ? `\nConfirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m) => ANOMALY_METHOD_LABELS[m] || m).join(", ")}.`
      : "";
    return {
      title,
      description: section.description + confirmedNote,
      alert: `Alert: ${section.alert}`,
      instruction,
    };
  }

  // Multiple regions — show each method's finding separately
  const description = sections
    .map((s) => `${s.methodLabel}:\n${s.description}`)
    .join("\n\n");
  const alert = sections.map((s) => `${s.methodLabel}: ${s.alert}`).join("\n");
  return {
    title: "⚠️ Multi-method Anomaly",
    description,
    alert,
    instruction,
  };
}

function positionAnomalyTooltip(
  tooltip,
  clientX,
  clientY,
  mainTooltip,
  bounds = null
) {
  if (!tooltip) return;
  tooltip.style.display = "block";
  const tipRect = tooltip.getBoundingClientRect();
  const tipW = tipRect.width || 220;
  const tipH = tipRect.height || 64;
  const gap = 12; // same gap as the main tooltip
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right)
    ? bounds.right
    : window.innerWidth - gap;
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom)
    ? bounds.bottom
    : window.innerHeight - gap;

  // Primary position: left of crosshair with the same gap as the main tooltip
  // → right edge of anomaly tooltip lands at clientX - gap (symmetric with main tooltip)
  let left = clientX - gap - tipW;
  if (left < minLeft) {
    // No room on the left — fall back to right of main tooltip
    const mainRect = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
    left = mainRect ? mainRect.right + gap : clientX + gap;
  }

  // Vertically align with the top of the main tooltip
  const mainRect = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
  let top = mainRect ? mainRect.top : clientY - tipH - gap;
  if (top + tipH > maxTop) top = Math.max(minTop, maxTop - tipH);

  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipW));
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipH));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function positionSecondaryTooltip(tooltip, anchorTooltip, bounds = null) {
  if (!tooltip || !anchorTooltip) {
    return;
  }
  tooltip.style.display = "block";
  const anchorRect = anchorTooltip.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const gap = 10;
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right)
    ? bounds.right
    : window.innerWidth - gap;
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom)
    ? bounds.bottom
    : window.innerHeight - gap;

  let left = anchorRect.right + gap;
  if (left + tipRect.width > maxLeft) {
    left = anchorRect.left - tipRect.width - gap;
  }

  let top = anchorRect.top;
  if (top + tipRect.height > maxTop) {
    top = Math.max(minTop, maxTop - tipRect.height);
  }

  left = Math.min(
    Math.max(left, minLeft),
    Math.max(minLeft, maxLeft - tipRect.width)
  );
  top = Math.min(
    Math.max(top, minTop),
    Math.max(minTop, maxTop - tipRect.height)
  );

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function positionTooltipBelow(tooltip, anchorTooltip, bounds = null) {
  if (!tooltip || !anchorTooltip) {
    return;
  }
  tooltip.style.display = "block";
  const anchorRect = anchorTooltip.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const gap = 8;
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right)
    ? bounds.right
    : window.innerWidth - gap;
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom)
    ? bounds.bottom
    : window.innerHeight - gap;

  let left = anchorRect.left;
  if (left + tipRect.width > maxLeft) {
    left = Math.max(minLeft, maxLeft - tipRect.width);
  }

  let top = anchorRect.bottom + gap;
  if (top + tipRect.height > maxTop) {
    top = Math.max(minTop, anchorRect.top - tipRect.height - gap);
  }

  left = Math.min(
    Math.max(left, minLeft),
    Math.max(minLeft, maxLeft - tipRect.width)
  );
  top = Math.min(
    Math.max(top, minTop),
    Math.max(minTop, maxTop - tipRect.height)
  );

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function getAnnotationTooltipContainer(card) {
  if (!card || !getRoot(card)) {
    return null;
  }
  return getRoot(card).getElementById("annotation-tooltips");
}

function clearAnnotationTooltips(card) {
  const container = getAnnotationTooltipContainer(card);
  if (!container) {
    return;
  }
  container.innerHTML = "";
}

function buildAnnotationTooltip(card, event) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip secondary annotation-tooltip";

  const hasValue = event?.chart_value != null && event.chart_value !== "";
  const valueMarkup = hasValue
    ? `<div class="tt-value">${esc(formatTooltipValue(event.chart_value, event.chart_unit))}</div>`
    : "";
  const message = event?.message || "Data point";
  const annotation =
    event?.annotation && event.annotation !== event.message
      ? event.annotation
      : "";
  const relatedMarkup = buildTooltipRelatedChips(card?._hass, event);

  tooltip.innerHTML = `
    <div class="tt-time">${esc(fmtDateTime(event.timestamp))}</div>
    ${valueMarkup}
    <div class="tt-message-row">
      <span class="tt-dot" style="background:${esc(event?.color || "#03a9f4")}"></span>
      <span class="tt-message">${esc(message)}</span>
    </div>
    <div class="tt-annotation" style="display:${annotation ? "block" : "none"}">${esc(annotation)}</div>
    <div class="tt-entities" style="display:${relatedMarkup ? "flex" : "none"}">${relatedMarkup}</div>
  `;
  return tooltip;
}

function renderAnnotationTooltips(card, hover, anchorTooltip, bounds = null) {
  const container = getAnnotationTooltipContainer(card);
  if (!container) {
    return [];
  }
  clearAnnotationTooltips(card);
  const annotationEvents = Array.isArray(hover?.events) ? hover.events : [];
  if (!annotationEvents.length) {
    return [];
  }

  const renderedTooltips = [];
  let anchorEl = anchorTooltip;
  for (const event of annotationEvents) {
    const tooltip = buildAnnotationTooltip(card, event);
    container.appendChild(tooltip);
    if (renderedTooltips.length === 0) {
      positionSecondaryTooltip(tooltip, anchorEl, bounds);
    } else {
      positionTooltipBelow(tooltip, anchorEl, bounds);
    }
    renderedTooltips.push(tooltip);
    anchorEl = tooltip;
  }
  return renderedTooltips;
}

export function showTooltip(card, canvas, renderer, event, clientX, clientY) {
  const tooltip = getRoot(card).getElementById("tooltip");
  const ttTime = getRoot(card).getElementById("tt-time");
  const ttValue = getRoot(card).getElementById("tt-value");
  const ttSeries = getRoot(card).getElementById("tt-series");
  const ttMessageRow = getRoot(card).getElementById("tt-message-row");
  const ttDot = getRoot(card).getElementById("tt-dot");
  const ttMsg = getRoot(card).getElementById("tt-message");
  const ttAnn = getRoot(card).getElementById("tt-annotation");
  const ttEntities = getRoot(card).getElementById("tt-entities");

  ttTime.textContent = fmtDateTime(event.timestamp);
  const hasValue = event.chart_value != null && event.chart_value !== "";
  ttValue.textContent = hasValue
    ? formatTooltipValue(event.chart_value, event.chart_unit)
    : "";
  ttValue.style.display = hasValue ? "block" : "none";
  if (ttSeries) {
    ttSeries.innerHTML = "";
    ttSeries.style.display = "none";
  }
  ttDot.style.background = event.color || "#03a9f4";
  ttMsg.textContent = event.message;
  if (ttMessageRow) ttMessageRow.style.display = "flex";
  const ann = event.annotation !== event.message ? event.annotation : "";
  ttAnn.textContent = ann || "";
  ttAnn.style.display = ann ? "block" : "none";
  const relatedMarkup = buildTooltipRelatedChips(card._hass, event);
  ttEntities.innerHTML = relatedMarkup;
  ttEntities.style.display = relatedMarkup ? "flex" : "none";

  const chartBounds = (
    getRoot(card)?.querySelector(".chart-wrap") ?? card
  )?.getBoundingClientRect();
  positionTooltip(
    tooltip,
    clientX,
    clientY,
    chartBounds
      ? {
          left: chartBounds.left + 8,
          right: chartBounds.right - 8,
          top: chartBounds.top + 8,
          bottom: chartBounds.bottom - 8,
        }
      : null
  );
}

export function hideTooltip(card) {
  const tooltip = getRoot(card).getElementById("tooltip");
  const anomalyTooltip = getRoot(card).getElementById("anomaly-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
  if (anomalyTooltip) {
    anomalyTooltip.style.display = "none";
  }
  clearAnnotationTooltips(card);
}

function resolveTooltipSeriesLabel(entry) {
  const isSubordinate = entry.grouped === true && entry.rawVisible === true;
  const isComparisonDerived =
    entry.comparisonDerived === true && entry.grouped === true;
  if (entry.comparison === true) {
    if (entry.grouped === true) {
      return entry.windowLabel || "Date window";
    }
    return `${entry.windowLabel || "Date window"}: ${entry.label || ""}`;
  }
  if (entry.trend === true) {
    if (isSubordinate || isComparisonDerived) {
      return "Trend";
    }
    return `Trend: ${entry.baseLabel || entry.label || ""}`;
  }
  if (entry.rate === true) {
    if (isSubordinate || isComparisonDerived) {
      return "Rate";
    }
    return `Rate: ${entry.baseLabel || entry.label || ""}`;
  }
  if (entry.delta === true) {
    if (isSubordinate || isComparisonDerived) {
      return "Delta";
    }
    return `Delta: ${entry.baseLabel || entry.label || ""}`;
  }
  if (entry.summary === true) {
    const summaryLabel = String(entry.summaryType || "").toUpperCase();
    if (isSubordinate || isComparisonDerived) {
      return summaryLabel;
    }
    return `${summaryLabel}: ${entry.baseLabel || entry.label || ""}`;
  }
  if (entry.threshold === true) {
    if (isSubordinate || isComparisonDerived) {
      return "Threshold";
    }
    return `Threshold: ${entry.baseLabel || entry.label || ""}`;
  }
  return entry.label || "";
}

export function showLineChartTooltip(card, hover, clientX, clientY) {
  const tooltip = getRoot(card).getElementById("tooltip");
  const ttTime = getRoot(card).getElementById("tt-time");
  const ttValue = getRoot(card).getElementById("tt-value");
  const ttSeries = getRoot(card).getElementById("tt-series");
  const anomalyTooltip = getRoot(card).getElementById("anomaly-tooltip");
  const ttSecondaryTitle = getRoot(card).getElementById("tt-secondary-title");
  const ttSecondaryDescription = getRoot(card).getElementById(
    "tt-secondary-description"
  );
  const ttSecondaryAlert = getRoot(card).getElementById("tt-secondary-alert");
  const ttSecondaryInstruction = getRoot(card).getElementById(
    "tt-secondary-instruction"
  );
  const ttMessageRow = getRoot(card).getElementById("tt-message-row");
  const ttMsg = getRoot(card).getElementById("tt-message");
  const ttAnn = getRoot(card).getElementById("tt-annotation");
  const ttEntities = getRoot(card).getElementById("tt-entities");
  if (
    !tooltip ||
    !ttTime ||
    !ttValue ||
    !ttMessageRow ||
    !ttMsg ||
    !ttAnn ||
    !ttEntities
  ) {
    return;
  }

  const rangeStartMs = Number.isFinite(hover.rangeStartMs)
    ? hover.rangeStartMs
    : hover.timeMs;
  const rangeEndMs = Number.isFinite(hover.rangeEndMs)
    ? hover.rangeEndMs
    : hover.timeMs;
  ttTime.textContent =
    rangeStartMs === rangeEndMs
      ? fmtDateTime(new Date(hover.timeMs).toISOString())
      : `${fmtDateTime(new Date(rangeStartMs).toISOString())} - ${fmtDateTime(new Date(rangeEndMs).toISOString())}`;

  const values = Array.isArray(hover.values) ? hover.values : [];
  const trendValues = Array.isArray(hover.trendValues) ? hover.trendValues : [];
  const rateValues = Array.isArray(hover.rateValues) ? hover.rateValues : [];
  const deltaValues = Array.isArray(hover.deltaValues) ? hover.deltaValues : [];
  const summaryValues = Array.isArray(hover.summaryValues)
    ? hover.summaryValues
    : [];
  const thresholdValues = Array.isArray(hover.thresholdValues)
    ? hover.thresholdValues
    : [];
  const binaryValues = Array.isArray(hover.binaryValues)
    ? hover.binaryValues
    : [];
  const comparisonValues = Array.isArray(hover.comparisonValues)
    ? hover.comparisonValues
    : [];
  const displayRows = [];
  const usedTrendRows = new Set();
  const usedRateRows = new Set();
  const usedDeltaRows = new Set();
  const usedSummaryRows = new Set();
  const usedThresholdRows = new Set();
  const usedComparisonRows = new Set();
  const pushComparisonDerivedRows = (comparisonEntry, comparisonIndex) => {
    trendValues.forEach((trendEntry, trendIndex) => {
      if (usedTrendRows.has(trendIndex)) {
        return;
      }
      if (
        trendEntry.comparisonParentId !== comparisonEntry.entityId &&
        !(
          trendEntry.relatedEntityId === comparisonEntry.relatedEntityId &&
          trendEntry.windowLabel === comparisonEntry.windowLabel
        )
      ) {
        return;
      }
      usedTrendRows.add(trendIndex);
      displayRows.push({
        ...trendEntry,
        rawVisible: true,
        comparisonDerived: true,
        grouped: true,
        key: `comparison-trend-${comparisonIndex}-${trendIndex}`,
      });
    });
    rateValues.forEach((rateEntry, rateIndex) => {
      if (usedRateRows.has(rateIndex)) {
        return;
      }
      if (
        rateEntry.comparisonParentId !== comparisonEntry.entityId &&
        !(
          rateEntry.relatedEntityId === comparisonEntry.relatedEntityId &&
          rateEntry.windowLabel === comparisonEntry.windowLabel
        )
      ) {
        return;
      }
      usedRateRows.add(rateIndex);
      displayRows.push({
        ...rateEntry,
        rawVisible: true,
        comparisonDerived: true,
        grouped: true,
        key: `comparison-rate-${comparisonIndex}-${rateIndex}`,
      });
    });
    summaryValues.forEach((summaryEntry, summaryIndex) => {
      if (usedSummaryRows.has(summaryIndex)) {
        return;
      }
      if (
        summaryEntry.comparisonParentId !== comparisonEntry.entityId &&
        !(
          summaryEntry.relatedEntityId === comparisonEntry.relatedEntityId &&
          summaryEntry.windowLabel === comparisonEntry.windowLabel
        )
      ) {
        return;
      }
      usedSummaryRows.add(summaryIndex);
      displayRows.push({
        ...summaryEntry,
        rawVisible: true,
        comparisonDerived: true,
        grouped: true,
        key: `comparison-summary-${comparisonIndex}-${summaryIndex}`,
      });
    });
    thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
      if (usedThresholdRows.has(thresholdIndex)) {
        return;
      }
      if (
        thresholdEntry.comparisonParentId !== comparisonEntry.entityId &&
        !(
          thresholdEntry.relatedEntityId === comparisonEntry.relatedEntityId &&
          thresholdEntry.windowLabel === comparisonEntry.windowLabel
        )
      ) {
        return;
      }
      usedThresholdRows.add(thresholdIndex);
      displayRows.push({
        ...thresholdEntry,
        rawVisible: true,
        comparisonDerived: true,
        grouped: true,
        key: `comparison-threshold-${comparisonIndex}-${thresholdIndex}`,
      });
    });
  };
  values.forEach((entry, index) => {
    displayRows.push(entry);
    trendValues.forEach((trendEntry, trendIndex) => {
      if (usedTrendRows.has(trendIndex)) {
        return;
      }
      const sameEntity =
        trendEntry.relatedEntityId &&
        trendEntry.relatedEntityId === entry.entityId;
      const sameLabel =
        !trendEntry.relatedEntityId &&
        trendEntry.baseLabel &&
        trendEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedTrendRows.add(trendIndex);
      displayRows.push({
        ...trendEntry,
        rawVisible: trendEntry.rawVisible !== false,
        grouped: true,
        key: `trend-${index}-${trendIndex}`,
      });
    });
    rateValues.forEach((rateEntry, rateIndex) => {
      if (usedRateRows.has(rateIndex)) {
        return;
      }
      const sameEntity =
        rateEntry.relatedEntityId &&
        rateEntry.relatedEntityId === entry.entityId;
      const sameLabel =
        !rateEntry.relatedEntityId &&
        rateEntry.baseLabel &&
        rateEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedRateRows.add(rateIndex);
      displayRows.push({
        ...rateEntry,
        rawVisible: rateEntry.rawVisible !== false,
        grouped: true,
        key: `rate-${index}-${rateIndex}`,
      });
    });
    deltaValues.forEach((deltaEntry, deltaIndex) => {
      if (usedDeltaRows.has(deltaIndex)) {
        return;
      }
      const sameEntity =
        deltaEntry.relatedEntityId &&
        deltaEntry.relatedEntityId === entry.entityId;
      const sameLabel =
        !deltaEntry.relatedEntityId &&
        deltaEntry.baseLabel &&
        deltaEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedDeltaRows.add(deltaIndex);
      displayRows.push({
        ...deltaEntry,
        rawVisible: deltaEntry.rawVisible !== false,
        grouped: true,
        key: `delta-${index}-${deltaIndex}`,
      });
    });
    summaryValues.forEach((summaryEntry, summaryIndex) => {
      if (usedSummaryRows.has(summaryIndex)) {
        return;
      }
      const sameEntity =
        summaryEntry.relatedEntityId &&
        summaryEntry.relatedEntityId === entry.entityId;
      const sameLabel =
        !summaryEntry.relatedEntityId &&
        summaryEntry.baseLabel &&
        summaryEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedSummaryRows.add(summaryIndex);
      displayRows.push({
        ...summaryEntry,
        rawVisible: summaryEntry.rawVisible !== false,
        grouped: true,
        key: `summary-${index}-${summaryIndex}`,
      });
    });
    thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
      if (usedThresholdRows.has(thresholdIndex)) {
        return;
      }
      const sameEntity =
        thresholdEntry.relatedEntityId &&
        thresholdEntry.relatedEntityId === entry.entityId;
      const sameLabel =
        !thresholdEntry.relatedEntityId &&
        thresholdEntry.baseLabel &&
        thresholdEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedThresholdRows.add(thresholdIndex);
      displayRows.push({
        ...thresholdEntry,
        rawVisible: thresholdEntry.rawVisible !== false,
        grouped: true,
        key: `threshold-${index}-${thresholdIndex}`,
      });
    });
    comparisonValues.forEach((compEntry, compIndex) => {
      if (usedComparisonRows.has(compIndex)) {
        return;
      }
      if (
        !compEntry.relatedEntityId ||
        compEntry.relatedEntityId !== entry.entityId
      ) {
        return;
      }
      usedComparisonRows.add(compIndex);
      const groupedEntry = {
        ...compEntry,
        grouped: true,
        comparison: true,
        key: `comparison-${index}-${compIndex}`,
      };
      displayRows.push(groupedEntry);
      pushComparisonDerivedRows(groupedEntry, compIndex);
    });
  });
  trendValues.forEach((trendEntry, trendIndex) => {
    if (usedTrendRows.has(trendIndex)) {
      return;
    }
    if (
      trendEntry.comparisonDerived === true ||
      typeof trendEntry.comparisonParentId === "string"
    ) {
      return;
    }
    displayRows.push({
      ...trendEntry,
      rawVisible: trendEntry.rawVisible !== false,
    });
  });
  rateValues.forEach((rateEntry, rateIndex) => {
    if (usedRateRows.has(rateIndex)) {
      return;
    }
    if (
      rateEntry.comparisonDerived === true ||
      typeof rateEntry.comparisonParentId === "string"
    ) {
      return;
    }
    displayRows.push({
      ...rateEntry,
      rawVisible: rateEntry.rawVisible !== false,
    });
  });
  deltaValues.forEach((deltaEntry, deltaIndex) => {
    if (usedDeltaRows.has(deltaIndex)) {
      return;
    }
    displayRows.push({
      ...deltaEntry,
      rawVisible: deltaEntry.rawVisible !== false,
    });
  });
  summaryValues.forEach((summaryEntry, summaryIndex) => {
    if (usedSummaryRows.has(summaryIndex)) {
      return;
    }
    if (
      summaryEntry.comparisonDerived === true ||
      typeof summaryEntry.comparisonParentId === "string"
    ) {
      return;
    }
    displayRows.push({
      ...summaryEntry,
      rawVisible: summaryEntry.rawVisible !== false,
    });
  });
  thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
    if (usedThresholdRows.has(thresholdIndex)) {
      return;
    }
    if (
      thresholdEntry.comparisonDerived === true ||
      typeof thresholdEntry.comparisonParentId === "string"
    ) {
      return;
    }
    displayRows.push({
      ...thresholdEntry,
      rawVisible: thresholdEntry.rawVisible !== false,
    });
  });
  comparisonValues.forEach((compEntry, compIndex) => {
    if (usedComparisonRows.has(compIndex)) {
      return;
    }
    const groupedEntry = { ...compEntry, comparison: true };
    displayRows.push(groupedEntry);
    pushComparisonDerivedRows(groupedEntry, compIndex);
  });
  displayRows.push(...binaryValues);
  const useSingleValueMode =
    displayRows.length === 1 &&
    trendValues.length === 0 &&
    rateValues.length === 0 &&
    deltaValues.length === 0 &&
    summaryValues.length === 0 &&
    thresholdValues.length === 0 &&
    comparisonValues.length === 0 &&
    binaryValues.length === 0 &&
    displayRows[0]?.comparison !== true;
  if (useSingleValueMode) {
    const value = displayRows[0];
    ttValue.textContent = value
      ? formatTooltipDisplayValue(value.value, value.unit)
      : "";
    ttValue.style.display = value ? "block" : "none";
    if (ttSeries) {
      ttSeries.innerHTML = "";
      ttSeries.style.display = "none";
    }
  } else {
    ttValue.textContent = "";
    ttValue.style.display = "none";
    if (ttSeries) {
      ttSeries.innerHTML = displayRows
        .map(
          (entry) => `
        <div class="tt-series-row ${entry.grouped === true && entry.rawVisible === true ? "subordinate" : ""}">
          <div class="tt-series-main">
            ${
              entry.grouped === true && entry.rawVisible === true
                ? ""
                : `<span class="tt-dot" style="background:${esc(entry.color || "#03a9f4")}"></span>`
            }
            <span class="tt-series-label">${esc(resolveTooltipSeriesLabel(entry))}</span>
          </div>
          <span class="tt-series-value">${esc(formatTooltipDisplayValue(entry.value, entry.unit))}</span>
        </div>
      `
        )
        .join("");
      ttSeries.style.display = displayRows.length ? "grid" : "none";
    }
  }

  ttMessageRow.style.display = "none";
  ttMsg.textContent = "";
  ttAnn.textContent = "";
  ttAnn.style.display = "none";
  ttEntities.innerHTML = "";
  ttEntities.style.display = "none";

  if (
    anomalyTooltip &&
    ttSecondaryTitle &&
    ttSecondaryDescription &&
    ttSecondaryAlert &&
    ttSecondaryInstruction
  ) {
    const anomalyContent = buildAnomalyTooltipContent(hover.anomalyRegions);
    if (anomalyContent) {
      ttSecondaryTitle.textContent = anomalyContent.title;
      ttSecondaryDescription.textContent = anomalyContent.description;
      ttSecondaryAlert.textContent = anomalyContent.alert;
      ttSecondaryInstruction.textContent = anomalyContent.instruction;
    } else {
      ttSecondaryTitle.textContent = "";
      ttSecondaryDescription.textContent = "";
      ttSecondaryAlert.textContent = "";
      ttSecondaryInstruction.textContent = "";
      anomalyTooltip.style.display = "none";
    }
  }

  const chartBounds = (
    getRoot(card)?.querySelector(".chart-wrap") ?? card
  )?.getBoundingClientRect();
  positionTooltip(
    tooltip,
    clientX,
    clientY,
    chartBounds
      ? {
          left: chartBounds.left + 8,
          right: chartBounds.right - 8,
          top: chartBounds.top + 8,
          bottom: chartBounds.bottom - 8,
        }
      : null
  );
  if (anomalyTooltip && hover.anomalyRegions?.length > 0) {
    positionAnomalyTooltip(
      anomalyTooltip,
      clientX,
      clientY,
      tooltip,
      chartBounds
        ? {
            left: chartBounds.left + 8,
            right: chartBounds.right - 8,
            top: chartBounds.top + 8,
            bottom: chartBounds.bottom - 8,
          }
        : null
    );
  }
  if (Array.isArray(hover.events) && hover.events.length > 0) {
    renderAnnotationTooltips(
      card,
      hover,
      tooltip,
      chartBounds
        ? {
            left: chartBounds.left + 8,
            right: chartBounds.right - 8,
            top: chartBounds.top + 8,
            bottom: chartBounds.bottom - 8,
          }
        : null
    );
  } else {
    clearAnnotationTooltips(card);
  }
}

export function buildTooltipRelatedChips(hass, event) {
  const entities = Array.isArray(event?.entity_ids) ? event.entity_ids : [];
  const devices = Array.isArray(event?.device_ids) ? event.device_ids : [];
  const areas = Array.isArray(event?.area_ids) ? event.area_ids : [];
  const labels = Array.isArray(event?.label_ids) ? event.label_ids : [];
  const chips = [
    ...entities.map((id) => ({
      icon: entityIcon(hass, id),
      label: entityName(hass, id),
    })),
    ...devices.map((id) => ({
      icon: deviceIcon(hass, id),
      label: deviceName(hass, id),
    })),
    ...areas.map((id) => ({
      icon: areaIcon(hass, id),
      label: areaName(hass, id),
    })),
    ...labels.map((id) => ({
      icon: labelIcon(hass, id),
      label: labelName(hass, id),
    })),
  ].filter((chip) => chip.label);
  if (!chips.length) return "";
  return chips
    .map(
      (chip) => `
    <span class="tt-entity-chip" title="${esc(chip.label)}">
      <ha-icon icon="${esc(chip.icon)}"></ha-icon>
      <span>${esc(chip.label)}</span>
    </span>
  `
    )
    .join("");
}

export function showLineChartCrosshair(card, renderer, hover) {
  const overlay = getRoot(card).getElementById("chart-crosshair");
  const vertical = getRoot(card).getElementById("crosshair-vertical");
  const horizontal = getRoot(card).getElementById("crosshair-horizontal");
  const points = getRoot(card).getElementById("crosshair-points");
  const addButton = getRoot(card).getElementById("chart-add-annotation");
  if (!overlay || !vertical || !horizontal || !points) return;

  overlay.hidden = false;
  vertical.style.left = `${hover.x}px`;
  if (hover.splitVertical) {
    vertical.style.top = `${hover.splitVertical.top}px`;
    vertical.style.height = `${hover.splitVertical.height}px`;
  } else {
    vertical.style.top = `${renderer.pad.top}px`;
    vertical.style.height = `${renderer.ch}px`;
  }
  horizontal.hidden = true;
  const crosshairValues = [
    ...(hover.values || []),
    ...(hover.showTrendCrosshairs === true
      ? (hover.trendValues || []).filter(
          (entry) => entry.showCrosshair === true
        )
      : []),
    ...(hover.showRateCrosshairs === true
      ? (hover.rateValues || []).filter((entry) => entry.showCrosshair === true)
      : []),
    ...(hover.comparisonValues || []),
  ];
  points.innerHTML = `
    ${crosshairValues
      .filter((entry) => entry.hasValue !== false)
      .map(
        (entry) => `
      <span
        class="crosshair-line horizontal series ${hover.emphasizeGuides ? "emphasized" : "subtle"}"
        style="top:${entry.y}px;color:${esc(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
      ></span>
    `
      )
      .join("")}
    ${crosshairValues
      .filter((entry) => entry.hasValue !== false)
      .map(
        (entry) => `
    <span
      class="crosshair-point"
      style="left:${entry.x}px;top:${entry.y}px;background:${esc(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
    ></span>
    `
      )
      .join("")}
  `;
  renderChartAxisHoverDots(card, crosshairValues);
  if (addButton) {
    addButton.hidden = false;
    addButton.style.left = `${hover.x}px`;
    if (hover.splitVertical) {
      addButton.style.top = `${hover.splitVertical.top + hover.splitVertical.height}px`;
    } else {
      addButton.style.top = `${renderer.pad.top + renderer.ch}px`;
    }
  }
}

export function dispatchLineChartHover(card, hover) {
  card.dispatchEvent(
    new CustomEvent("hass-datapoints-chart-hover", {
      bubbles: true,
      composed: true,
      detail: hover ? { timeMs: hover.timeMs } : { timeMs: null },
    })
  );
}

function findNearestSeriesPointTime(seriesPoints, timeMs) {
  if (!Array.isArray(seriesPoints) || seriesPoints.length === 0) {
    return null;
  }
  let lo = 0;
  let hi = seriesPoints.length - 1;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (seriesPoints[mid][0] <= timeMs) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const left = seriesPoints[lo]?.[0];
  const right = seriesPoints[hi]?.[0];
  if (!Number.isFinite(left) && !Number.isFinite(right)) {
    return null;
  }
  if (!Number.isFinite(left)) {
    return right;
  }
  if (!Number.isFinite(right)) {
    return left;
  }
  return Math.abs(left - timeMs) <= Math.abs(right - timeMs) ? left : right;
}

export function resolveLineChartHoverTime(
  series,
  timeMs,
  mode = "follow_series"
) {
  if (mode !== "snap_to_data_points") {
    return timeMs;
  }
  let bestTime = null;
  let bestDistance = Infinity;
  for (const seriesItem of Array.isArray(series) ? series : []) {
    const candidateTime = findNearestSeriesPointTime(seriesItem?.pts, timeMs);
    if (!Number.isFinite(candidateTime)) {
      continue;
    }
    const distance = Math.abs(candidateTime - timeMs);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTime = candidateTime;
    }
  }
  return Number.isFinite(bestTime) ? bestTime : timeMs;
}

export function hideLineChartHover(card) {
  dispatchLineChartHover(card, null);
  hideTooltip(card);
  const overlay = getRoot(card).getElementById("chart-crosshair");
  const points = getRoot(card).getElementById("crosshair-points");
  const addButton = getRoot(card).getElementById("chart-add-annotation");
  if (overlay) overlay.hidden = true;
  if (points) points.innerHTML = "";
  renderChartAxisHoverDots(card, []);
  const horizontal = getRoot(card).getElementById("crosshair-horizontal");
  if (horizontal) horizontal.hidden = true;
  if (addButton) addButton.hidden = true;
}

export function attachLineChartHover(
  card,
  canvas,
  renderer,
  series,
  events,
  t0,
  t1,
  vMin,
  vMax,
  axes = null,
  options = {}
) {
  if (!canvas || !renderer) return;
  if (card._chartHoverCleanup) {
    card._chartHoverCleanup();
    card._chartHoverCleanup = null;
  }

  const eventThresholdMs = renderer.cw ? 14 * ((t1 - t0) / renderer.cw) : 0;
  const binaryStates = Array.isArray(options.binaryStates)
    ? options.binaryStates
    : [];
  const comparisonSeries = Array.isArray(options.comparisonSeries)
    ? options.comparisonSeries
    : [];
  const trendSeries = Array.isArray(options.trendSeries)
    ? options.trendSeries
    : [];
  const rateSeries = Array.isArray(options.rateSeries)
    ? options.rateSeries
    : [];
  const deltaSeries = Array.isArray(options.deltaSeries)
    ? options.deltaSeries
    : [];
  const summarySeries = Array.isArray(options.summarySeries)
    ? options.summarySeries
    : [];
  const thresholdSeries = Array.isArray(options.thresholdSeries)
    ? options.thresholdSeries
    : [];
  const anomalyRegions = Array.isArray(options.anomalyRegions)
    ? options.anomalyRegions
    : [];
  if (
    !series?.length &&
    !binaryStates.length &&
    !comparisonSeries.length &&
    !trendSeries.length &&
    !rateSeries.length &&
    !deltaSeries.length &&
    !summarySeries.length &&
    !thresholdSeries.length &&
    !anomalyRegions.length
  )
    return;
  const hoverSurfaceEl = options.hoverSurfaceEl || null;
  const addAnnotationButton =
    getRoot(card)?.getElementById("chart-add-annotation") || null;
  const findAnomalyRegions = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return [];
    }
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const hits = [];
    for (const region of anomalyRegions) {
      const radiusX = Number(region?.radiusX) || 0;
      const radiusY = Number(region?.radiusY) || 0;
      if (radiusX <= 0 || radiusY <= 0) {
        continue;
      }
      const dx = (localX - region.centerX) / radiusX;
      const dy = (localY - region.centerY) / radiusY;
      if (dx * dx + dy * dy <= 1) {
        hits.push(region);
      }
    }
    return hits;
  };
  const buildHoverState = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !renderer.cw || !renderer.ch)
      return null;

    const localX = clampChartValue(
      clientX - rect.left,
      renderer.pad.left,
      renderer.pad.left + renderer.cw
    );
    const localY = clampChartValue(
      clientY - rect.top,
      renderer.pad.top,
      renderer.pad.top + renderer.ch
    );
    const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
    const rawTimeMs = t0 + ratio * (t1 - t0);
    const timeMs = resolveLineChartHoverTime(
      series,
      rawTimeMs,
      options.hoverSnapMode || "follow_series"
    );
    const x = renderer.xOf(timeMs, t0, t1);

    const values = series.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          label: seriesItem.label || seriesItem.entityId || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        };
      }
      return {
        entityId: seriesItem.entityId,
        label: seriesItem.label || seriesItem.entityId || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
      };
    });

    const comparisonValues = comparisonSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
      };
    });

    const trendValues = trendSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          trend: true,
          rawVisible: seriesItem.rawVisible !== false,
          comparisonDerived: seriesItem.comparisonDerived === true,
          showCrosshair: seriesItem.showCrosshair === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        trend: true,
        rawVisible: seriesItem.rawVisible !== false,
        comparisonDerived: seriesItem.comparisonDerived === true,
        showCrosshair: seriesItem.showCrosshair === true,
      };
    });
    const rateValues = rateSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          rate: true,
          rawVisible: seriesItem.rawVisible !== false,
          comparisonDerived: seriesItem.comparisonDerived === true,
          showCrosshair: seriesItem.showCrosshair === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        rate: true,
        rawVisible: seriesItem.rawVisible !== false,
        comparisonDerived: seriesItem.comparisonDerived === true,
        showCrosshair: seriesItem.showCrosshair === true,
      };
    });
    const deltaValues = deltaSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          delta: true,
          rawVisible: seriesItem.rawVisible !== false,
          comparisonDerived: seriesItem.comparisonDerived === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        delta: true,
        rawVisible: seriesItem.rawVisible !== false,
        comparisonDerived: seriesItem.comparisonDerived === true,
      };
    });
    const summaryValues = summarySeries.map((seriesItem) => {
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      const value = Number(seriesItem.value);
      if (!Number.isFinite(value)) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          summaryType: seriesItem.summaryType || "",
          summary: true,
          rawVisible: seriesItem.rawVisible !== false,
          comparisonDerived: seriesItem.comparisonDerived === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        summaryType: seriesItem.summaryType || "",
        summary: true,
        rawVisible: seriesItem.rawVisible !== false,
        comparisonDerived: seriesItem.comparisonDerived === true,
      };
    });
    const thresholdValues = thresholdSeries.map((seriesItem) => {
      const axis = seriesItem.axis ||
        (axes && axes[0]) || { min: vMin, max: vMax };
      const value = Number(seriesItem.value);
      if (!Number.isFinite(value)) {
        return {
          entityId: seriesItem.entityId,
          comparisonParentId: seriesItem.comparisonParentId || "",
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          windowLabel: seriesItem.windowLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity)
            ? seriesItem.hoverOpacity
            : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          threshold: true,
          rawVisible: seriesItem.rawVisible !== false,
          comparisonDerived: seriesItem.comparisonDerived === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        comparisonParentId: seriesItem.comparisonParentId || "",
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        windowLabel: seriesItem.windowLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity)
          ? seriesItem.hoverOpacity
          : 1,
        hasValue: true,
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        threshold: true,
        rawVisible: seriesItem.rawVisible !== false,
        comparisonDerived: seriesItem.comparisonDerived === true,
      };
    });

    const plottedValues = [
      ...values.filter((entry) => entry?.hasValue !== false),
      ...comparisonValues.filter((entry) => entry?.hasValue !== false),
      ...rateValues.filter((entry) => entry?.hasValue !== false),
      ...(options.showTrendCrosshairs === true
        ? trendValues.filter(
            (entry) => entry?.hasValue !== false && entry.showCrosshair === true
          )
        : []),
    ];

    let rangeStartMs = timeMs;
    let rangeEndMs = timeMs;
    let primary = plottedValues[0] || null;
    if (primary) {
      for (const entry of plottedValues) {
        if (Math.abs(entry.y - localY) < Math.abs(primary.y - localY)) {
          primary = entry;
        }
      }
    }
    const activePrimarySeries = primary
      ? series.find((seriesItem) => seriesItem.entityId === primary.entityId) ||
        null
      : null;
    if (activePrimarySeries?.pts?.length) {
      const pts = activePrimarySeries.pts;
      const pLen = pts.length;
      // Binary search for the rightmost index whose timestamp <= timeMs.
      let lo = 0;
      let hi = pLen - 1;
      let previousIndex = -1;
      if (pts[0][0] <= timeMs) {
        while (lo + 1 < hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (pts[mid][0] <= timeMs) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
        previousIndex = pts[hi][0] <= timeMs ? hi : lo;
      }
      const nextIndex = previousIndex < pLen - 1 ? previousIndex + 1 : -1;
      const previous = previousIndex >= 0 ? pts[previousIndex] : null;
      let next = null;
      if (nextIndex >= 0) {
        next = pts[nextIndex];
      } else if (previousIndex < 0) {
        next = pts[0];
      }
      if (previous && next) {
        const prevPrev = pts[Math.max(0, previousIndex - 1)] || previous;
        const nextNext = pts[Math.min(pLen - 1, nextIndex + 1)] || next;
        rangeStartMs =
          previous === next
            ? previous[0]
            : Math.round((previous[0] + prevPrev[0]) / 2);
        rangeEndMs =
          previous === next ? next[0] : Math.round((next[0] + nextNext[0]) / 2);
      } else if (previous) {
        rangeStartMs = previous[0];
        rangeEndMs = previous[0];
      } else if (next) {
        rangeStartMs = next[0];
        rangeEndMs = next[0];
      }
    }

    const binaryValues = binaryStates
      .map((entry) => {
        const activeSpan = (entry.spans || []).find(
          (span) => timeMs >= span.start && timeMs <= span.end
        );
        return {
          label: entry.label || entry.entityId || "",
          value: activeSpan ? entry.onLabel || "on" : entry.offLabel || "off",
          unit: "",
          color: entry.color,
          active: !!activeSpan,
        };
      })
      .filter(Boolean);
    if (
      !values.length &&
      !binaryValues.length &&
      !trendValues.length &&
      !rateValues.length &&
      !deltaValues.length &&
      !summaryValues.length &&
      !thresholdValues.length &&
      !comparisonValues.length
    ) {
      return null;
    }

    const fallbackY = renderer.pad.top + 12;
    const hoverY = primary ? primary.y : fallbackY;

    const hoveredEvents = [];
    for (const event of events || []) {
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime < t0 || eventTime > t1) {
        continue;
      }
      const distance = Math.abs(eventTime - timeMs);
      if (distance <= eventThresholdMs) {
        hoveredEvents.push({
          ...event,
          _hoverDistanceMs: distance,
        });
      }
    }
    hoveredEvents.sort((left, right) => {
      const distanceDelta =
        (left._hoverDistanceMs || 0) - (right._hoverDistanceMs || 0);
      if (distanceDelta !== 0) {
        return distanceDelta;
      }
      return (
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
      );
    });
    const normalizedHoveredEvents = hoveredEvents.map((event) =>
      Object.fromEntries(
        Object.entries(event).filter(([key]) => key !== "_hoverDistanceMs")
      )
    );

    return {
      x,
      y: hoverY,
      timeMs,
      rangeStartMs,
      rangeEndMs,
      values,
      trendValues,
      rateValues,
      deltaValues: options.showDeltaTooltip === true ? deltaValues : [],
      summaryValues,
      thresholdValues,
      comparisonValues,
      binaryValues,
      primary,
      event: normalizedHoveredEvents[0] || null,
      events: normalizedHoveredEvents,
      emphasizeGuides: options.emphasizeHoverGuides === true,
      showTrendCrosshairs: options.showTrendCrosshairs === true,
      showRateCrosshairs: options.showRateCrosshairs === true,
      hideRawData: options.hideRawData === true,
    };
  };

  const showFromPointer = (clientX, clientY) => {
    if (card._chartZoomDragging) return;
    const anomalyRegionsHit = findAnomalyRegions(clientX, clientY);
    const hover = buildHoverState(clientX, clientY);
    if (!hover) {
      card._chartLastHover = null;
      hideLineChartHover(card);
      canvas.style.cursor = "default";
      return;
    }
    hover.anomalyRegions = anomalyRegionsHit;
    card._chartLastHover = hover;
    showLineChartCrosshair(card, renderer, hover);
    if (
      options.showTooltip !== false ||
      (Array.isArray(hover.events) && hover.events.length > 0)
    ) {
      showLineChartTooltip(card, hover, clientX, clientY);
    } else {
      hideTooltip(card);
    }
    dispatchLineChartHover(card, hover);
    canvas.style.cursor =
      anomalyRegionsHit.length > 0 ? "pointer" : "crosshair";
  };

  const hideHover = () => {
    card._chartLastHover = null;
    hideLineChartHover(card);
    canvas.style.cursor = "default";
  };

  // Throttle mousemove processing to one frame — intermediate positions are
  // dropped because the visible result of each frame overwrites the last.
  let _rafHandle = null;
  let _pendingX = 0;
  let _pendingY = 0;
  const onMouseMove = (ev) => {
    _pendingX = ev.clientX;
    _pendingY = ev.clientY;
    if (_rafHandle !== null) return;
    _rafHandle = requestAnimationFrame(() => {
      _rafHandle = null;
      showFromPointer(_pendingX, _pendingY);
    });
  };
  const onMouseLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (nextTarget && hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget))
      return;
    if (
      nextTarget &&
      addAnnotationButton &&
      addAnnotationButton.contains(nextTarget)
    )
      return;
    hideHover();
  };
  const onOverlayMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
  const onOverlayLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (nextTarget && canvas.contains(nextTarget)) return;
    if (
      nextTarget &&
      addAnnotationButton &&
      addAnnotationButton.contains(nextTarget)
    )
      return;
    hideHover();
  };
  const onAddButtonLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (
      nextTarget &&
      (canvas.contains(nextTarget) ||
        (hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget)))
    )
      return;
    hideHover();
  };
  const onAddButtonClick = (ev) => {
    if (typeof options.onAddAnnotation !== "function" || !card._chartLastHover)
      return;
    ev.preventDefault();
    ev.stopPropagation();
    options.onAddAnnotation(card._chartLastHover, ev);
  };
  const onContextMenu = (ev) => {
    if (typeof options.onContextMenu !== "function") return;
    const hover = buildHoverState(ev.clientX, ev.clientY);
    if (!hover) return;
    ev.preventDefault();
    card._chartLastHover = hover;
    showLineChartCrosshair(card, renderer, hover);
    showLineChartTooltip(card, hover, ev.clientX, ev.clientY);
    dispatchLineChartHover(card, hover);
    options.onContextMenu(hover, ev);
  };
  const onClick = (ev) => {
    if (typeof options.onAnomalyClick !== "function") {
      return;
    }
    const regions = findAnomalyRegions(ev.clientX, ev.clientY);
    if (!regions.length) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    options.onAnomalyClick(regions, ev);
  };

  let touchTimer = null;
  const scheduleTouchHide = () => {
    if (touchTimer) window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(() => hideHover(), 1800);
  };
  const onTouchStart = (ev) => {
    ev.preventDefault();
    const touch = ev.touches[0];
    if (!touch) return;
    showFromPointer(touch.clientX, touch.clientY);
    scheduleTouchHide();
  };
  const onTouchMove = (ev) => {
    ev.preventDefault();
    const touch = ev.touches[0];
    if (!touch) return;
    showFromPointer(touch.clientX, touch.clientY);
    scheduleTouchHide();
  };
  const onTouchEnd = () => scheduleTouchHide();

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);
  canvas.addEventListener("touchcancel", onTouchEnd);
  hoverSurfaceEl?.addEventListener("mousemove", onOverlayMove);
  hoverSurfaceEl?.addEventListener("mouseleave", onOverlayLeave);
  addAnnotationButton?.addEventListener("mouseleave", onAddButtonLeave);
  addAnnotationButton?.addEventListener("click", onAddButtonClick);

  card._chartHoverCleanup = () => {
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseleave", onMouseLeave);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("touchcancel", onTouchEnd);
    hoverSurfaceEl?.removeEventListener("mousemove", onOverlayMove);
    hoverSurfaceEl?.removeEventListener("mouseleave", onOverlayLeave);
    addAnnotationButton?.removeEventListener("mouseleave", onAddButtonLeave);
    addAnnotationButton?.removeEventListener("click", onAddButtonClick);
    if (_rafHandle !== null) {
      cancelAnimationFrame(_rafHandle);
      _rafHandle = null;
    }
    if (touchTimer) {
      window.clearTimeout(touchTimer);
      touchTimer = null;
    }
    hideHover();
  };
}

export function attachLineChartRangeZoom(
  card,
  canvas,
  renderer,
  t0,
  t1,
  options = {}
) {
  if (!canvas || !renderer) return;
  if (card._chartZoomCleanup) {
    card._chartZoomCleanup();
    card._chartZoomCleanup = null;
  }

  const selection = getRoot(card).getElementById("chart-zoom-selection");
  if (!selection) return;

  let pointerId = null;
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const hideSelection = () => {
    selection.hidden = true;
    selection.classList.remove("visible");
  };

  const clientXToTime = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const localX = clampChartValue(
      clientX - rect.left,
      renderer.pad.left,
      renderer.pad.left + renderer.cw
    );
    const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
    return t0 + ratio * (t1 - t0);
  };

  const inPlotBounds = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    return (
      localX >= renderer.pad.left &&
      localX <= renderer.pad.left + renderer.cw &&
      localY >= renderer.pad.top &&
      localY <= renderer.pad.top + renderer.ch
    );
  };

  const renderSelection = () => {
    const left = Math.min(startX, currentX);
    const width = Math.abs(currentX - startX);
    selection.style.left = `${left}px`;
    selection.style.top = `${renderer.pad.top}px`;
    selection.style.width = `${width}px`;
    selection.style.height = `${renderer.ch}px`;
    selection.hidden = false;
    selection.classList.add("visible");
  };

  const emitPreview = () => {
    if (!dragging || Math.abs(currentX - startX) < 8) {
      options.onPreview?.(null);
      return;
    }
    const rectLeft = canvas.getBoundingClientRect().left;
    const startTime = Math.min(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + currentX)
    );
    const endTime = Math.max(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + currentX)
    );
    options.onPreview?.({ startTime, endTime });
  };

  const resetDragging = (clearPreview = true) => {
    pointerId = null;
    dragging = false;
    card._chartZoomDragging = false;
    hideSelection();
    if (clearPreview) options.onPreview?.(null);
  };

  const onPointerMove = (ev) => {
    if (pointerId == null || ev.pointerId !== pointerId) return;
    currentX = clampChartValue(
      ev.clientX - canvas.getBoundingClientRect().left,
      renderer.pad.left,
      renderer.pad.left + renderer.cw
    );
    const movedPx = Math.abs(currentX - startX);
    if (!dragging && movedPx < 6) return;
    dragging = true;
    card._chartZoomDragging = true;
    hideLineChartHover(card);
    renderSelection();
    emitPreview();
    ev.preventDefault();
  };

  const finish = (ev) => {
    if (pointerId == null || ev.pointerId !== pointerId) return;
    const didDrag = dragging;
    const endX = currentX;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    if (!didDrag || Math.abs(endX - startX) < 8) {
      resetDragging(true);
      return;
    }
    const rectLeft = canvas.getBoundingClientRect().left;
    const startTime = Math.min(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + endX)
    );
    const endTime = Math.max(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + endX)
    );
    options.onZoom?.({ startTime, endTime });
    resetDragging(false);
  };

  const onPointerDown = (ev) => {
    if (ev.button !== 0 || !inPlotBounds(ev.clientX, ev.clientY)) return;
    pointerId = ev.pointerId;
    const rect = canvas.getBoundingClientRect();
    startX = clampChartValue(
      ev.clientX - rect.left,
      renderer.pad.left,
      renderer.pad.left + renderer.cw
    );
    currentX = startX;
    dragging = false;
    card._chartZoomDragging = false;
    options.onPreview?.(null);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const onDoubleClick = (ev) => {
    if (!inPlotBounds(ev.clientX, ev.clientY)) return;
    if (!options.onReset) return;
    ev.preventDefault();
    options.onReset();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("dblclick", onDoubleClick);

  card._chartZoomCleanup = () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("dblclick", onDoubleClick);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    resetDragging();
  };
}

export function attachTooltipBehaviour(card, canvas, renderer, events, t0, t1) {
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
  canvas.addEventListener(
    "touchstart",
    (e) => {
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
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
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
    },
    { passive: false }
  );
}
