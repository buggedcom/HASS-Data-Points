export interface HistoryAnalysisPoint extends Array<number> {
  0: number;
  1: number;
}

export interface WorkerSeriesAnalysis {
  show_trend_lines: boolean;
  trend_method: "linear_trend" | "rolling_average";
  trend_window: string;
  show_summary_stats: boolean;
  show_rate_of_change: boolean;
  rate_window: string;
  show_delta_analysis: boolean;
}

export interface WorkerSeriesInput {
  entityId: string;
  pts: HistoryAnalysisPoint[];
  analysis?: Partial<Record<keyof WorkerSeriesAnalysis, unknown>>;
}

export interface ComparisonSeriesInput {
  entityId: string;
  pts: HistoryAnalysisPoint[];
}

export interface ComputeHistoryAnalysisPayload {
  series?: WorkerSeriesInput[];
  comparisonSeries?: ComparisonSeriesInput[];
  hasSelectedComparisonWindow?: boolean;
  allComparisonWindowsData?: Record<
    string,
    Record<string, HistoryAnalysisPoint[]>
  >;
  /** Per-entity analysis config used to compute comparisonWindowResults. */
  seriesAnalysisConfigs?: Record<string, Partial<WorkerSeriesAnalysis>>;
}

export interface ComparisonWindowAnalysis {
  trendPts: HistoryAnalysisPoint[];
  ratePts: HistoryAnalysisPoint[];
  summaryStats: Nullable<{ min: number; max: number; mean: number }>;
}

export interface TrendSeriesResult {
  entityId: string;
  pts: HistoryAnalysisPoint[];
}

export interface SummaryStatsResult {
  entityId: string;
  min: number;
  max: number;
  mean: number;
}

export interface HistoryAnalysisResult {
  trendSeries: TrendSeriesResult[];
  rateSeries: TrendSeriesResult[];
  deltaSeries: TrendSeriesResult[];
  summaryStats: SummaryStatsResult[];
  anomalySeries: unknown[];
  /** Pre-computed analysis per comparison window and entity. */
  comparisonWindowResults: Record<
    string,
    Record<string, ComparisonWindowAnalysis>
  >;
}

const HOUR_MS = 60 * 60 * 1000;

export function getTrendWindowMs(value: string): number {
  const windows: RecordWithNumericValues = {
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

export function buildRollingAverageTrend(
  points: HistoryAnalysisPoint[],
  windowMs: number
): HistoryAnalysisPoint[] {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    !Number.isFinite(windowMs) ||
    windowMs <= 0
  ) {
    return [];
  }
  const trendPoints: HistoryAnalysisPoint[] = [];
  let windowStartIndex = 0;
  let windowSum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [time, value] = points[index];
    windowSum += value;
    while (
      windowStartIndex < index &&
      time - points[windowStartIndex][0] > windowMs
    ) {
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

export function buildLinearTrend(
  points: HistoryAnalysisPoint[]
): HistoryAnalysisPoint[] {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  const origin = points[0][0];
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (const [time, value] of points) {
    const x = (time - origin) / HOUR_MS;
    sumX += x;
    sumY += value;
    sumXX += x * x;
    sumXY += x * value;
  }
  const count = points.length;
  const denominator = count * sumXX - sumX * sumX;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return [];
  }
  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;
  const firstTime = points[0][0];
  const lastTime = points[points.length - 1][0];
  const firstX = (firstTime - origin) / HOUR_MS;
  const lastX = (lastTime - origin) / HOUR_MS;
  return [
    [firstTime, intercept + slope * firstX],
    [lastTime, intercept + slope * lastX],
  ];
}

export function buildTrendPoints(
  points: HistoryAnalysisPoint[],
  method: string,
  trendWindow: string
): HistoryAnalysisPoint[] {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  if (method === "linear_trend") {
    return buildLinearTrend(points);
  }
  return buildRollingAverageTrend(points, getTrendWindowMs(trendWindow));
}

export function normalizeSeriesAnalysis(
  analysis:
    | Partial<Nullable<Record<keyof WorkerSeriesAnalysis, unknown>>>
    | undefined
): WorkerSeriesAnalysis {
  const source = analysis && typeof analysis === "object" ? analysis : {};

  return {
    show_trend_lines: source.show_trend_lines === true,
    trend_method:
      source.trend_method === "linear_trend"
        ? "linear_trend"
        : "rolling_average",
    trend_window:
      typeof source.trend_window === "string" && source.trend_window
        ? source.trend_window
        : "24h",
    show_summary_stats: source.show_summary_stats === true,
    show_rate_of_change: source.show_rate_of_change === true,
    rate_window:
      typeof source.rate_window === "string" && source.rate_window
        ? source.rate_window
        : "1h",
    show_delta_analysis: source.show_delta_analysis === true,
  };
}

export function interpolateSeriesValue(
  points: HistoryAnalysisPoint[],
  timeMs: number
): Nullable<number> {
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
      return startValue + (endValue - startValue) * fraction;
    }
  }
  return null;
}

export function buildRateOfChangePoints(
  points: HistoryAnalysisPoint[],
  rateWindow: string
): HistoryAnalysisPoint[] {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  const ratePoints: HistoryAnalysisPoint[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const [timeMs, value] = points[index];
    let comparisonPoint: Nullable<HistoryAnalysisPoint> = null;
    if (rateWindow === "point_to_point") {
      comparisonPoint = points[index - 1];
    } else {
      const windowMs = getTrendWindowMs(rateWindow);
      if (!Number.isFinite(windowMs) || windowMs <= 0) {
        continue;
      }
      for (
        let candidateIndex = index - 1;
        candidateIndex >= 0;
        candidateIndex -= 1
      ) {
        const candidatePoint = points[candidateIndex];
        if (timeMs - candidatePoint[0] >= windowMs) {
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
    const deltaHours = deltaMs / HOUR_MS;
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

export function buildDeltaPoints(
  sourcePoints: HistoryAnalysisPoint[],
  comparisonPoints: HistoryAnalysisPoint[]
): HistoryAnalysisPoint[] {
  if (
    !Array.isArray(sourcePoints) ||
    sourcePoints.length < 2 ||
    !Array.isArray(comparisonPoints) ||
    comparisonPoints.length < 2
  ) {
    return [];
  }
  const deltaPoints: HistoryAnalysisPoint[] = [];
  for (const [timeMs, value] of sourcePoints) {
    const comparisonValue = interpolateSeriesValue(comparisonPoints, timeMs);
    if (comparisonValue == null) {
      continue;
    }
    deltaPoints.push([timeMs, value - comparisonValue]);
  }
  return deltaPoints;
}

export function buildSummaryStats(
  points: HistoryAnalysisPoint[]
): Nullable<{ min: number; max: number; mean: number }> {
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

export function computeHistoryAnalysis(
  payload: ComputeHistoryAnalysisPayload
): HistoryAnalysisResult {
  const series = (Array.isArray(payload?.series) ? payload.series : []).map(
    (seriesItem) => ({
      ...seriesItem,
      analysis: normalizeSeriesAnalysis(seriesItem?.analysis),
    })
  );
  const comparisonSeries = new Map(
    (Array.isArray(payload?.comparisonSeries) ? payload.comparisonSeries : [])
      .filter((entry) => entry?.entityId)
      .map((entry) => [entry.entityId, entry])
  );
  const result: HistoryAnalysisResult = {
    trendSeries: [],
    rateSeries: [],
    deltaSeries: [],
    summaryStats: [],
    anomalySeries: [],
    comparisonWindowResults: {},
  };

  for (const seriesItem of series) {
    const points = Array.isArray(seriesItem?.pts) ? seriesItem.pts : [];
    const analysis = normalizeSeriesAnalysis(seriesItem?.analysis);
    if (points.length < 2) {
      continue;
    }

    if (analysis.show_trend_lines === true) {
      const trendPoints = buildTrendPoints(
        points,
        analysis.trend_method,
        analysis.trend_window
      );
      if (trendPoints.length >= 2) {
        result.trendSeries.push({
          entityId: seriesItem.entityId,
          pts: trendPoints,
        });
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

    if (
      analysis.show_delta_analysis === true &&
      payload?.hasSelectedComparisonWindow === true
    ) {
      const comparisonEntry = comparisonSeries.get(seriesItem.entityId);
      const comparisonPoints = comparisonEntry?.pts ?? [];
      if (comparisonPoints.length >= 2) {
        const deltaPoints = buildDeltaPoints(points, comparisonPoints);
        if (deltaPoints.length >= 2) {
          result.deltaSeries.push({
            entityId: seriesItem.entityId,
            pts: deltaPoints,
          });
        }
      }
    }
  }

  // Comparison window analysis — per-window, per-entity trend/rate/summary.
  const seriesAnalysisConfigs =
    typeof payload?.seriesAnalysisConfigs === "object" &&
    payload.seriesAnalysisConfigs !== null
      ? payload.seriesAnalysisConfigs
      : {};
  const allComparisonWindowsData =
    typeof payload?.allComparisonWindowsData === "object" &&
    payload.allComparisonWindowsData !== null
      ? payload.allComparisonWindowsData
      : {};

  for (const [windowId, entityPtsMap] of Object.entries(
    allComparisonWindowsData
  )) {
    result.comparisonWindowResults[windowId] = {};
    for (const [entityId, pts] of Object.entries(entityPtsMap)) {
      const winAnalysis = normalizeSeriesAnalysis(
        seriesAnalysisConfigs[entityId]
      );
      result.comparisonWindowResults[windowId][entityId] = {
        trendPts:
          winAnalysis.show_trend_lines && pts.length >= 2
            ? buildTrendPoints(
                pts,
                winAnalysis.trend_method,
                winAnalysis.trend_window
              )
            : [],
        ratePts:
          winAnalysis.show_rate_of_change && pts.length >= 2
            ? buildRateOfChangePoints(pts, winAnalysis.rate_window)
            : [],
        summaryStats: winAnalysis.show_summary_stats
          ? buildSummaryStats(pts)
          : null,
      };
    }
  }

  return result;
}

const workerScope = globalThis as typeof globalThis & {
  onmessage: Nullable<
    (
      event: MessageEvent<{
        id?: number;
        payload: ComputeHistoryAnalysisPayload;
      }>
    ) => void
  >;
  postMessage: (message: unknown) => void;
};

workerScope.onmessage = (
  event: MessageEvent<{ id?: number; payload: ComputeHistoryAnalysisPayload }>
) => {
  const { id, payload } = event.data || {};
  try {
    const result = computeHistoryAnalysis(payload);
    workerScope.postMessage({ id, result });
  } catch (error) {
    workerScope.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
