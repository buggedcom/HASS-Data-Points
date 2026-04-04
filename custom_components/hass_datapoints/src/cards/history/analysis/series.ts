import type { Point } from "./types";
import { getTrendWindowMs } from "./windows";

export function buildRollingAverageTrend(
  points: Point[],
  windowMs: number
): Point[] {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    !Number.isFinite(windowMs) ||
    windowMs <= 0
  ) {
    return [];
  }
  const trendPoints: Point[] = [];
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

export function buildLinearTrend(points: Point[]): Point[] {
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
  const denominator = count * sumXX - sumX * sumX;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return [];
  }
  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;
  const firstTime = points[0][0];
  const lastTime = points[points.length - 1][0];
  const firstX = (firstTime - origin) / (60 * 60 * 1000);
  const lastX = (lastTime - origin) / (60 * 60 * 1000);
  return [
    [firstTime, intercept + slope * firstX],
    [lastTime, intercept + slope * lastX],
  ];
}

export function interpolateSeriesValue(
  points: Point[],
  timeMs: number
): number | null {
  if (!Array.isArray(points) || !points.length) {
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
      return startValue + fraction * (endValue - startValue);
    }
  }
  return null;
}

export function buildRateOfChangePoints(
  points: Point[],
  rateWindow = "1h"
): Point[] {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  const ratePoints: Point[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const [timeMs, value] = points[index];
    let comparisonPoint: Point | null = null;
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

export function buildDeltaPoints(
  sourcePoints: Point[],
  comparisonPoints: Point[]
): Point[] {
  if (
    !Array.isArray(sourcePoints) ||
    sourcePoints.length < 2 ||
    !Array.isArray(comparisonPoints) ||
    comparisonPoints.length < 2
  ) {
    return [];
  }
  const deltaPoints: Point[] = [];
  for (const [timeMs, value] of sourcePoints) {
    const comparisonValue = interpolateSeriesValue(comparisonPoints, timeMs);
    if (comparisonValue == null) {
      continue;
    }
    deltaPoints.push([timeMs, value - comparisonValue]);
  }
  return deltaPoints;
}
