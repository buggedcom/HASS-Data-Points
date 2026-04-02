function getTrendWindowMs(value) {
  const windows = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "14d": 14 * 24 * 60 * 60 * 1000,
    "21d": 21 * 24 * 60 * 60 * 1000,
    "28d": 28 * 24 * 60 * 60 * 1000,
  };
  return windows[value] || windows["24h"];
}

function buildRollingAverageTrend(points, windowMs) {
  if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(windowMs) || windowMs <= 0) {
    return [];
  }
  const trendPoints = [];
  let windowStartIndex = 0;
  let windowSum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [time, value] = points[index];
    windowSum += value;
    while (windowStartIndex < index && (time - points[windowStartIndex][0]) > windowMs) {
      windowSum -= points[windowStartIndex][1];
      windowStartIndex += 1;
    }
    const count = index - windowStartIndex + 1;
    if (count > 0) {
      trendPoints.push([time, windowSum / count]);
    }
  }
  return trendPoints;
}

function buildLinearTrend(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  const origin = points[0][0];
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (const [time, value] of points) {
    const x = (time - origin) / (60 * 60 * 1000);
    sumX += x;
    sumY += value;
    sumXX += x * x;
    sumXY += x * value;
  }
  const count = points.length;
  const denominator = (count * sumXX) - (sumX * sumX);
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return [];
  }
  const slope = ((count * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / count;
  const firstTime = points[0][0];
  const lastTime = points[points.length - 1][0];
  const firstX = (firstTime - origin) / (60 * 60 * 1000);
  const lastX = (lastTime - origin) / (60 * 60 * 1000);
  return [
    [firstTime, intercept + (slope * firstX)],
    [lastTime, intercept + (slope * lastX)],
  ];
}

function buildTrendPoints(points, method, trendWindow) {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  if (method === "linear_trend") {
    return buildLinearTrend(points);
  }
  return buildRollingAverageTrend(points, getTrendWindowMs(trendWindow));
}

function getPersistenceWindowMs(value) {
  const windows = {
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "3h": 3 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  };
  return windows[value] || windows["1h"];
}

function buildIQRAnomalyClusters(points, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 4) {
    return [];
  }
  const sorted = points.map(([, v]) => v).sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const q2 = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  if (!Number.isFinite(iqr) || iqr <= 0.000001) {
    return [];
  }
  const k = anomalySensitivity === "low" ? 3.0 : anomalySensitivity === "high" ? 1.5 : 2.0;
  const lowerFence = q1 - k * iqr;
  const upperFence = q3 + k * iqr;
  const clusters = [];
  let currentCluster = [];
  const flushCluster = () => {
    if (currentCluster.length === 0) return;
    const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
    clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "iqr" });
    currentCluster = [];
  };
  for (const [timeMs, value] of points) {
    if (value < lowerFence || value > upperFence) {
      currentCluster.push({ timeMs, value, baselineValue: q2, residual: value - q2 });
    } else {
      flushCluster();
    }
  }
  flushCluster();
  return clusters.filter((c) => c.points.length > 0);
}

function buildRollingZScoreAnomalyClusters(points, windowMs, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(windowMs) || windowMs <= 0) {
    return [];
  }
  const threshold = getAnomalySensitivityThreshold(anomalySensitivity);
  const residuals = [];
  let windowStart = 0;
  let windowSum = 0;
  let windowSumSq = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [timeMs, value] = points[i];
    windowSum += value;
    windowSumSq += value * value;
    while (windowStart < i && (timeMs - points[windowStart][0]) > windowMs) {
      const old = points[windowStart][1];
      windowSum -= old;
      windowSumSq -= old * old;
      windowStart += 1;
    }
    const count = i - windowStart + 1;
    if (count < 3) {
      continue;
    }
    const mean = windowSum / count;
    const variance = Math.max(0, (windowSumSq / count) - (mean * mean));
    const std = Math.sqrt(variance);
    if (!Number.isFinite(std) || std <= 0.000001) {
      continue;
    }
    const zscore = (value - mean) / std;
    if (Math.abs(zscore) >= threshold) {
      residuals.push({ timeMs, value, baselineValue: mean, residual: value - mean, flagged: true });
    } else {
      residuals.push({ timeMs, flagged: false });
    }
  }
  const clusters = [];
  let currentCluster = [];
  const flushCluster = () => {
    if (currentCluster.length === 0) return;
    const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
    clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "rolling_zscore" });
    currentCluster = [];
  };
  for (const r of residuals) {
    if (r.flagged) {
      currentCluster.push(r);
    } else {
      flushCluster();
    }
  }
  flushCluster();
  return clusters.filter((c) => c.points.length > 0);
}

function buildPersistenceAnomalyClusters(points, minDurationMs, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(minDurationMs) || minDurationMs <= 0) {
    return [];
  }
  let totalMin = Infinity;
  let totalMax = -Infinity;
  for (const [, v] of points) {
    if (v < totalMin) totalMin = v;
    if (v > totalMax) totalMax = v;
  }
  const totalRange = totalMax - totalMin;
  if (!Number.isFinite(totalRange) || totalRange <= 0.000001) {
    return [];
  }
  const flatFraction = anomalySensitivity === "low" ? 0.005 : anomalySensitivity === "high" ? 0.05 : 0.02;
  const flatThreshold = flatFraction * totalRange;
  const clusters = [];
  let runStart = 0;
  let runMin = points[0][1];
  let runMax = points[0][1];
  const flushRun = (runEnd) => {
    const duration = points[runEnd][0] - points[runStart][0];
    if (duration >= minDurationMs && runEnd > runStart) {
      const mid = (runMin + runMax) / 2;
      const clusterPoints = [];
      for (let k = runStart; k <= runEnd; k += 1) {
        clusterPoints.push({ timeMs: points[k][0], value: points[k][1], baselineValue: mid, residual: points[k][1] - mid });
      }
      clusters.push({
        points: clusterPoints,
        maxDeviation: runMax - runMin,
        anomalyMethod: "persistence",
        flatRange: runMax - runMin,
      });
    }
  };
  for (let i = 1; i < points.length; i += 1) {
    const v = points[i][1];
    const nextMin = Math.min(runMin, v);
    const nextMax = Math.max(runMax, v);
    if (nextMax - nextMin > flatThreshold) {
      flushRun(i - 1);
      runStart = i;
      runMin = v;
      runMax = v;
    } else {
      runMin = nextMin;
      runMax = nextMax;
    }
  }
  flushRun(points.length - 1);
  return clusters.filter((c) => c.points.length > 0);
}

function buildComparisonWindowAnomalyClusters(points, comparisonPoints, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 3 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 3) {
    return [];
  }
  const deltaPoints = [];
  for (const [timeMs, value] of points) {
    const compValue = interpolateSeriesValue(comparisonPoints, timeMs);
    if (!Number.isFinite(compValue)) {
      continue;
    }
    deltaPoints.push({ timeMs, value, compValue, delta: value - compValue });
  }
  if (deltaPoints.length < 3) {
    return [];
  }
  let sumDeltas = 0;
  for (const p of deltaPoints) {
    sumDeltas += p.delta;
  }
  const meanDelta = sumDeltas / deltaPoints.length;
  let sumSqDev = 0;
  for (const p of deltaPoints) {
    const dev = p.delta - meanDelta;
    sumSqDev += dev * dev;
  }
  const rmsDeviation = Math.sqrt(sumSqDev / deltaPoints.length);
  if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 0.000001) {
    return [];
  }
  const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);
  const clusters = [];
  let currentCluster = [];
  const flushCluster = () => {
    if (currentCluster.length === 0) return;
    const maxDeviation = currentCluster.reduce((m, p) => Math.max(m, Math.abs(p.residual)), 0);
    clusters.push({ points: currentCluster.slice(), maxDeviation, anomalyMethod: "comparison_window" });
    currentCluster = [];
  };
  for (const { timeMs, value, compValue, delta } of deltaPoints) {
    const residual = delta - meanDelta;
    if (Math.abs(residual) >= threshold) {
      currentCluster.push({ timeMs, value, baselineValue: compValue, residual: value - compValue });
    } else {
      flushCluster();
    }
  }
  flushCluster();
  return clusters.filter((c) => c.points.length > 0);
}

function buildRateOfChangeAnomalyClusters(points, rateWindow, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 3) {
    return [];
  }
  const ratePoints = buildRateOfChangePoints(points, rateWindow);
  if (!Array.isArray(ratePoints) || ratePoints.length < 3) {
    return [];
  }

  let sumRates = 0;
  for (const [, rate] of ratePoints) {
    sumRates += rate;
  }
  const meanRate = sumRates / ratePoints.length;

  let sumSqDev = 0;
  for (const [, rate] of ratePoints) {
    const dev = rate - meanRate;
    sumSqDev += dev * dev;
  }
  const rmsDeviation = Math.sqrt(sumSqDev / ratePoints.length);
  if (!Number.isFinite(rmsDeviation) || rmsDeviation <= 0.000001) {
    return [];
  }

  const threshold = rmsDeviation * getAnomalySensitivityThreshold(anomalySensitivity);
  const clusters = [];
  let currentCluster = [];

  const flushCluster = () => {
    if (currentCluster.length === 0) {
      return;
    }
    const maxDeviation = currentCluster.reduce((maxVal, point) => Math.max(maxVal, Math.abs(point.residual)), 0);
    clusters.push({
      points: currentCluster.slice(),
      maxDeviation,
      anomalyMethod: "rate_of_change",
    });
    currentCluster = [];
  };

  for (const [timeMs, rate] of ratePoints) {
    const residual = rate - meanRate;
    if (Math.abs(residual) >= threshold) {
      const sourceValue = interpolateSeriesValue(points, timeMs);
      if (!Number.isFinite(sourceValue)) {
        flushCluster();
        continue;
      }
      currentCluster.push({
        timeMs,
        value: sourceValue,
        baselineValue: meanRate,
        residual,
      });
    } else {
      flushCluster();
    }
  }
  flushCluster();

  return clusters.filter((cluster) => cluster.points.length > 0);
}

const VALID_ANOMALY_METHODS = ["trend_residual", "rate_of_change", "iqr", "rolling_zscore", "persistence", "comparison_window"];

function normalizeSeriesAnalysis(analysis) {
  const source = analysis && typeof analysis === "object" ? analysis : {};
  const legacyMethod = VALID_ANOMALY_METHODS.includes(source.anomaly_method) ? source.anomaly_method : null;
  return {
    show_trend_lines: source.show_trend_lines === true,
    trend_method: source.trend_method === "linear_trend" ? "linear_trend" : "rolling_average",
    trend_window: typeof source.trend_window === "string" && source.trend_window ? source.trend_window : "24h",
    show_summary_stats: source.show_summary_stats === true,
    show_rate_of_change: source.show_rate_of_change === true,
    rate_window: typeof source.rate_window === "string" && source.rate_window ? source.rate_window : "1h",
    show_anomalies: source.show_anomalies === true,
    anomaly_methods: Array.isArray(source.anomaly_methods)
      ? source.anomaly_methods.filter((m) => VALID_ANOMALY_METHODS.includes(m))
      : (legacyMethod ? [legacyMethod] : []),
    anomaly_overlap_mode: ["all", "highlight", "only"].includes(source.anomaly_overlap_mode) ? source.anomaly_overlap_mode : "all",
    anomaly_sensitivity: typeof source.anomaly_sensitivity === "string" && source.anomaly_sensitivity ? source.anomaly_sensitivity : "medium",
    anomaly_rate_window: typeof source.anomaly_rate_window === "string" && source.anomaly_rate_window ? source.anomaly_rate_window : "1h",
    anomaly_zscore_window: typeof source.anomaly_zscore_window === "string" && source.anomaly_zscore_window ? source.anomaly_zscore_window : "24h",
    anomaly_persistence_window: typeof source.anomaly_persistence_window === "string" && source.anomaly_persistence_window ? source.anomaly_persistence_window : "1h",
    anomaly_comparison_window_id: typeof source.anomaly_comparison_window_id === "string" && source.anomaly_comparison_window_id ? source.anomaly_comparison_window_id : null,
    show_delta_analysis: source.show_delta_analysis === true,
  };
}

function applyAnomalyOverlapMode(clustersByMethod, overlapMode) {
  const methodKeys = Object.keys(clustersByMethod);
  if (methodKeys.length <= 1 || overlapMode === "all") {
    return methodKeys.flatMap((m) => clustersByMethod[m]);
  }

  const flaggedByMethod = {};
  for (const m of methodKeys) {
    flaggedByMethod[m] = new Set(clustersByMethod[m].flatMap((c) => c.points.map((p) => p.timeMs)));
  }

  const overlapTimes = new Set();
  for (const m of methodKeys) {
    for (const t of flaggedByMethod[m]) {
      if (methodKeys.some((other) => other !== m && flaggedByMethod[other].has(t))) {
        overlapTimes.add(t);
      }
    }
  }

  if (overlapMode === "only") {
    const seen = new Set();
    const result = [];
    for (const m of methodKeys) {
      for (const cluster of clustersByMethod[m]) {
        const pts = cluster.points.filter((p) => overlapTimes.has(p.timeMs));
        if (pts.length === 0) continue;
        const key = pts.map((p) => p.timeMs).join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        const detectedByMethods = methodKeys.filter((other) => pts.some((p) => flaggedByMethod[other].has(p.timeMs)));
        result.push({
          ...cluster,
          points: pts,
          maxDeviation: pts.reduce((maxVal, p) => Math.max(maxVal, Math.abs(p.residual || 0)), 0),
          isOverlap: true,
          detectedByMethods,
        });
      }
    }
    return result;
  }

  // "highlight" mode: tag overlapping clusters
  const result = [];
  for (const m of methodKeys) {
    for (const cluster of clustersByMethod[m]) {
      const hasOverlap = cluster.points.some((p) => overlapTimes.has(p.timeMs));
      const detectedByMethods = hasOverlap
        ? methodKeys.filter((other) => cluster.points.some((p) => flaggedByMethod[other].has(p.timeMs)))
        : [m];
      result.push({ ...cluster, isOverlap: hasOverlap, detectedByMethods });
    }
  }
  return result;
}

function interpolateSeriesValue(points, timeMs) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }
  if (timeMs < points[0][0] || timeMs > points[points.length - 1][0]) {
    return null;
  }
  if (timeMs === points[0][0]) {
    return points[0][1];
  }
  if (timeMs === points[points.length - 1][0]) {
    return points[points.length - 1][1];
  }
  for (let index = 0; index < points.length - 1; index += 1) {
    const [startTime, startValue] = points[index];
    const [endTime, endValue] = points[index + 1];
    if (timeMs >= startTime && timeMs <= endTime) {
      const fraction = (timeMs - startTime) / (endTime - startTime);
      return startValue + ((endValue - startValue) * fraction);
    }
  }
  return null;
}

function buildRateOfChangePoints(points, rateWindow) {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  const ratePoints = [];
  for (let index = 1; index < points.length; index += 1) {
    const [timeMs, value] = points[index];
    let comparisonPoint = null;
    if (rateWindow === "point_to_point") {
      comparisonPoint = points[index - 1];
    } else {
      const windowMs = getTrendWindowMs(rateWindow);
      if (!Number.isFinite(windowMs) || windowMs <= 0) {
        continue;
      }
      for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {
        const candidatePoint = points[candidateIndex];
        if ((timeMs - candidatePoint[0]) >= windowMs) {
          comparisonPoint = candidatePoint;
          break;
        }
      }
      if (!comparisonPoint) {
        comparisonPoint = points[0];
      }
    }
    if (!Array.isArray(comparisonPoint) || comparisonPoint.length < 2) {
      continue;
    }
    const deltaMs = timeMs - comparisonPoint[0];
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      continue;
    }
    const deltaHours = deltaMs / (60 * 60 * 1000);
    if (!Number.isFinite(deltaHours) || deltaHours <= 0) {
      continue;
    }
    const rateValue = (value - comparisonPoint[1]) / deltaHours;
    if (!Number.isFinite(rateValue)) {
      continue;
    }
    ratePoints.push([timeMs, rateValue]);
  }
  return ratePoints;
}

function buildDeltaPoints(sourcePoints, comparisonPoints) {
  if (!Array.isArray(sourcePoints) || sourcePoints.length < 2 || !Array.isArray(comparisonPoints) || comparisonPoints.length < 2) {
    return [];
  }
  const deltaPoints = [];
  for (const [timeMs, value] of sourcePoints) {
    const comparisonValue = interpolateSeriesValue(comparisonPoints, timeMs);
    if (comparisonValue == null) {
      continue;
    }
    deltaPoints.push([timeMs, value - comparisonValue]);
  }
  return deltaPoints;
}

function buildSummaryStats(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  for (const point of points) {
    const value = Number(point?.[1]);
    if (!Number.isFinite(value)) {
      continue;
    }
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    sum += value;
    count += 1;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || count === 0) {
    return null;
  }
  return {
    min,
    max,
    mean: sum / count,
  };
}

function getAnomalySensitivityThreshold(sensitivity) {
  if (sensitivity === "low") {
    return 2.8;
  }
  if (sensitivity === "high") {
    return 1.6;
  }
  return 2.2;
}

function buildAnomalyClusters(points, method, trendWindow, anomalySensitivity) {
  if (!Array.isArray(points) || points.length < 3) {
    return [];
  }
  const baselinePoints = buildTrendPoints(points, method, trendWindow);
  if (!Array.isArray(baselinePoints) || baselinePoints.length < 2) {
    return [];
  }

  const residualPoints = [];
  for (const [timeMs, value] of points) {
    const baselineValue = interpolateSeriesValue(baselinePoints, timeMs);
    if (!Number.isFinite(baselineValue)) {
      continue;
    }
    residualPoints.push({
      timeMs,
      value,
      baselineValue,
      residual: value - baselineValue,
    });
  }

  if (residualPoints.length < 3) {
    return [];
  }

  let sumSquares = 0;
  residualPoints.forEach((point) => {
    sumSquares += point.residual * point.residual;
  });
  const rmsResidual = Math.sqrt(sumSquares / residualPoints.length);
  if (!Number.isFinite(rmsResidual) || rmsResidual <= 0.000001) {
    return [];
  }

  const threshold = rmsResidual * getAnomalySensitivityThreshold(anomalySensitivity);
  const clusters = [];
  let currentCluster = [];

  const flushCluster = () => {
    if (currentCluster.length === 0) {
      return;
    }
    const maxDeviation = currentCluster.reduce((maxValue, point) => Math.max(maxValue, Math.abs(point.residual)), 0);
    clusters.push({
      points: currentCluster.slice(),
      maxDeviation,
      anomalyMethod: "trend_residual",
    });
    currentCluster = [];
  };

  residualPoints.forEach((point) => {
    if (Math.abs(point.residual) >= threshold) {
      currentCluster.push(point);
    } else {
      flushCluster();
    }
  });
  flushCluster();

  return clusters.filter((cluster) => cluster.points.length > 0);
}

function computeHistoryAnalysis(payload) {
  const series = (Array.isArray(payload?.series) ? payload.series : []).map((seriesItem) => ({
      ...seriesItem,
      analysis: normalizeSeriesAnalysis(seriesItem?.analysis),
    }));
  const comparisonSeries = new Map(
    (Array.isArray(payload?.comparisonSeries) ? payload.comparisonSeries : [])
      .filter((entry) => entry?.entityId)
      .map((entry) => [entry.entityId, entry]),
  );
  // allComparisonWindowsData: { [windowId]: { [entityId]: pts[] } }
  const allComparisonWindowsData = payload?.allComparisonWindowsData && typeof payload.allComparisonWindowsData === "object"
    ? payload.allComparisonWindowsData : {};
  const result = {
    trendSeries: [],
    rateSeries: [],
    deltaSeries: [],
    summaryStats: [],
    anomalySeries: [],
  };

  for (const seriesItem of series) {
    const points = Array.isArray(seriesItem?.pts) ? seriesItem.pts : [];
    const analysis = normalizeSeriesAnalysis(seriesItem?.analysis);
    if (points.length < 2) {
      continue;
    }

    const anomalyMethods = analysis.anomaly_methods;
    const needsTrend = analysis.show_trend_lines === true
      || (analysis.show_anomalies === true && anomalyMethods.includes("trend_residual"));
    if (needsTrend) {
      const trendPoints = buildTrendPoints(points, analysis.trend_method, analysis.trend_window);
      if (analysis.show_trend_lines === true && trendPoints.length >= 2) {
        result.trendSeries.push({
          entityId: seriesItem.entityId,
          pts: trendPoints,
        });
      }
    }

    if (analysis.show_anomalies === true) {
      const clustersByMethod = {};

      if (anomalyMethods.includes("trend_residual")) {
        const clusters = buildAnomalyClusters(points, analysis.trend_method, analysis.trend_window, analysis.anomaly_sensitivity);
        if (clusters.length > 0) clustersByMethod.trend_residual = clusters;
      }
      if (anomalyMethods.includes("rate_of_change")) {
        const clusters = buildRateOfChangeAnomalyClusters(points, analysis.anomaly_rate_window, analysis.anomaly_sensitivity);
        if (clusters.length > 0) clustersByMethod.rate_of_change = clusters;
      }
      if (anomalyMethods.includes("iqr")) {
        const clusters = buildIQRAnomalyClusters(points, analysis.anomaly_sensitivity);
        if (clusters.length > 0) clustersByMethod.iqr = clusters;
      }
      if (anomalyMethods.includes("rolling_zscore")) {
        const windowMs = getTrendWindowMs(analysis.anomaly_zscore_window);
        const clusters = buildRollingZScoreAnomalyClusters(points, windowMs, analysis.anomaly_sensitivity);
        if (clusters.length > 0) clustersByMethod.rolling_zscore = clusters;
      }
      if (anomalyMethods.includes("persistence")) {
        const minDurationMs = getPersistenceWindowMs(analysis.anomaly_persistence_window);
        const clusters = buildPersistenceAnomalyClusters(points, minDurationMs, analysis.anomaly_sensitivity);
        if (clusters.length > 0) clustersByMethod.persistence = clusters;
      }
      if (anomalyMethods.includes("comparison_window") && analysis.anomaly_comparison_window_id) {
        const windowData = allComparisonWindowsData[analysis.anomaly_comparison_window_id];
        const comparisonPts = windowData && typeof windowData === "object" ? windowData[seriesItem.entityId] : null;
        if (Array.isArray(comparisonPts) && comparisonPts.length >= 3) {
          const clusters = buildComparisonWindowAnomalyClusters(points, comparisonPts, analysis.anomaly_sensitivity);
          if (clusters.length > 0) clustersByMethod.comparison_window = clusters;
        }
      }

      const anomalyClusters = applyAnomalyOverlapMode(clustersByMethod, analysis.anomaly_overlap_mode);
      if (anomalyClusters.length > 0) {
        result.anomalySeries.push({ entityId: seriesItem.entityId, anomalyClusters });
      }
    }

    if (analysis.show_rate_of_change === true) {
      const ratePoints = buildRateOfChangePoints(points, analysis.rate_window);
      if (ratePoints.length >= 2) {
        result.rateSeries.push({
          entityId: seriesItem.entityId,
          pts: ratePoints,
        });
      }
    }

    if (analysis.show_summary_stats === true) {
      const summaryStats = buildSummaryStats(points);
      if (summaryStats) {
        result.summaryStats.push({
          entityId: seriesItem.entityId,
          ...summaryStats,
        });
      }
    }

    if (analysis.show_delta_analysis === true && payload?.hasSelectedComparisonWindow === true) {
      const comparisonEntry = comparisonSeries.get(seriesItem.entityId);
      if (comparisonEntry?.pts?.length >= 2) {
        const deltaPoints = buildDeltaPoints(points, comparisonEntry.pts);
        if (deltaPoints.length >= 2) {
          result.deltaSeries.push({
            entityId: seriesItem.entityId,
            pts: deltaPoints,
          });
        }
      }
    }
  }

  return result;
}

self.onmessage = (event) => {
  const { id, payload } = event.data || {};
  try {
    const result = computeHistoryAnalysis(payload);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
