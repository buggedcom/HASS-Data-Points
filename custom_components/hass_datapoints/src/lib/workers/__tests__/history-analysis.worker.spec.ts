import { describe, expect, it } from "vitest";

import { loadLegacyScripts, repoPath } from "@/lib/__tests__/load-legacy-script";

const {
  getTrendWindowMs,
  buildRollingAverageTrend,
  buildLinearTrend,
  buildTrendPoints,
  interpolateSeriesValue,
  buildRateOfChangePoints,
  buildDeltaPoints,
  buildSummaryStats,
  getAnomalySensitivityThreshold,
  buildIQRAnomalyClusters,
  buildRollingZScoreAnomalyClusters,
  buildPersistenceAnomalyClusters,
  buildComparisonWindowAnomalyClusters,
  buildRateOfChangeAnomalyClusters,
  buildAnomalyClusters,
  applyAnomalyOverlapMode,
  normalizeSeriesAnalysis,
  computeHistoryAnalysis,
} = loadLegacyScripts(
  [repoPath("custom_components", "hass_datapoints", "src", "lib", "workers", "history-analysis.worker.js")],
  [
    "getTrendWindowMs",
    "buildRollingAverageTrend",
    "buildLinearTrend",
    "buildTrendPoints",
    "interpolateSeriesValue",
    "buildRateOfChangePoints",
    "buildDeltaPoints",
    "buildSummaryStats",
    "getAnomalySensitivityThreshold",
    "buildIQRAnomalyClusters",
    "buildRollingZScoreAnomalyClusters",
    "buildPersistenceAnomalyClusters",
    "buildComparisonWindowAnomalyClusters",
    "buildRateOfChangeAnomalyClusters",
    "buildAnomalyClusters",
    "applyAnomalyOverlapMode",
    "normalizeSeriesAnalysis",
    "computeHistoryAnalysis",
  ],
  { self: { onmessage: null } },
);

const H = 60 * 60 * 1000; // 1 hour in ms
const D = 24 * H;          // 1 day in ms

/** Build n points at 1-hour intervals starting from 0 */
function hourly(values: number[]): [number, number][] {
  return values.map((v, i) => [i * H, v]);
}

// ─────────────────────────────────────────────────────────────────────────────
// getTrendWindowMs
// ─────────────────────────────────────────────────────────────────────────────

describe("getTrendWindowMs", () => {
  describe("GIVEN a known window key", () => {
    describe("WHEN called with '1h'", () => {
      it("THEN returns 3 600 000 ms", () => {
        expect.assertions(1);
        expect(getTrendWindowMs("1h")).toBe(H);
      });
    });

    describe("WHEN called with '7d'", () => {
      it("THEN returns 7 days in ms", () => {
        expect.assertions(1);
        expect(getTrendWindowMs("7d")).toBe(7 * D);
      });
    });

    describe("WHEN called with '28d'", () => {
      it("THEN returns 28 days in ms", () => {
        expect.assertions(1);
        expect(getTrendWindowMs("28d")).toBe(28 * D);
      });
    });
  });

  describe("GIVEN an unknown window key", () => {
    describe("WHEN called with an unrecognised string", () => {
      it("THEN falls back to 24h", () => {
        expect.assertions(1);
        expect(getTrendWindowMs("999x")).toBe(D);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildRollingAverageTrend
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRollingAverageTrend", () => {
  describe("GIVEN empty or too-short input", () => {
    describe("WHEN called with an empty array", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRollingAverageTrend([], H)).toEqual([]);
      });
    });

    describe("WHEN called with a single point", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRollingAverageTrend([[0, 10]], H)).toEqual([]);
      });
    });

    describe("WHEN called with windowMs = 0", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRollingAverageTrend(hourly([10, 20]), 0)).toEqual([]);
      });
    });
  });

  describe("GIVEN constant-value points", () => {
    describe("WHEN the window covers all points", () => {
      it("THEN every trend point equals the constant", () => {
        expect.assertions(1);
        const pts = hourly([5, 5, 5, 5, 5]);
        const result = buildRollingAverageTrend(pts, D);
        expect(result.every(([, v]) => v === 5)).toBe(true);
      });
    });
  });

  describe("GIVEN points spaced further apart than the window", () => {
    describe("WHEN each point falls outside the previous point's window", () => {
      it("THEN each trend value equals the point's own value", () => {
        // Points at 2H intervals, window=1H → each point is isolated in its window
        expect.assertions(1);
        const pts: [number, number][] = [[0, 10], [2 * H, 20], [4 * H, 30]];
        const result = buildRollingAverageTrend(pts, H);
        expect(result).toEqual([[0, 10], [2 * H, 20], [4 * H, 30]]);
      });
    });
  });

  describe("GIVEN rising values with a large window", () => {
    describe("WHEN the window covers all previous points", () => {
      it("THEN each trend value is the running cumulative average", () => {
        // [0,4],[1H,8] with window=24H
        // t=0: avg(4)=4; t=1H: avg(4,8)=6
        expect.assertions(1);
        const result = buildRollingAverageTrend([[0, 4], [H, 8]], D);
        expect(result).toEqual([[0, 4], [H, 6]]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildLinearTrend
// ─────────────────────────────────────────────────────────────────────────────

describe("buildLinearTrend", () => {
  describe("GIVEN empty or too-short input", () => {
    describe("WHEN called with an empty array", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildLinearTrend([])).toEqual([]);
      });
    });

    describe("WHEN called with a single point", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildLinearTrend([[0, 5]])).toEqual([]);
      });
    });
  });

  describe("GIVEN a perfectly linear series", () => {
    describe("WHEN the points lie exactly on a line y=x (in hours)", () => {
      it("THEN the returned endpoints match the first and last source values", () => {
        // [0,0],[1H,1],[2H,2] → slope=1/h, intercept=0
        expect.assertions(1);
        const result = buildLinearTrend([[0, 0], [H, 1], [2 * H, 2]]);
        expect(result).toEqual([[0, 0], [2 * H, 2]]);
      });
    });

    describe("WHEN all points share the same timestamp", () => {
      it("THEN returns [] (denominator is zero)", () => {
        expect.assertions(1);
        expect(buildLinearTrend([[H, 1], [H, 2], [H, 3]])).toEqual([]);
      });
    });
  });

  describe("GIVEN a two-point series", () => {
    describe("WHEN called with two distinct points", () => {
      it("THEN returns exactly those two points", () => {
        expect.assertions(1);
        const result = buildLinearTrend([[0, 0], [H, 10]]);
        expect(result).toEqual([[0, 0], [H, 10]]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTrendPoints
// ─────────────────────────────────────────────────────────────────────────────

describe("buildTrendPoints", () => {
  describe("GIVEN method='linear_trend'", () => {
    describe("WHEN called with a perfect linear series", () => {
      it("THEN returns two endpoint values (delegates to buildLinearTrend)", () => {
        expect.assertions(1);
        const result = buildTrendPoints([[0, 0], [H, 1], [2 * H, 2]], "linear_trend", "24h");
        expect(result).toHaveLength(2);
      });
    });
  });

  describe("GIVEN method='rolling_average'", () => {
    describe("WHEN called with constant values", () => {
      it("THEN all trend values equal the constant", () => {
        expect.assertions(1);
        const pts = hourly([7, 7, 7, 7]);
        const result = buildTrendPoints(pts, "rolling_average", "24h");
        expect(result.every(([, v]) => v === 7)).toBe(true);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// interpolateSeriesValue
// ─────────────────────────────────────────────────────────────────────────────

describe("interpolateSeriesValue", () => {
  describe("GIVEN an empty series", () => {
    describe("WHEN queried at any time", () => {
      it("THEN returns null", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue([], H)).toBeNull();
      });
    });
  });

  describe("GIVEN a series with two endpoints", () => {
    const pts: [number, number][] = [[0, 0], [H, 10]];

    describe("WHEN queried before the first point", () => {
      it("THEN returns null", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, -1)).toBeNull();
      });
    });

    describe("WHEN queried after the last point", () => {
      it("THEN returns null", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, H + 1)).toBeNull();
      });
    });

    describe("WHEN queried at the first point's timestamp", () => {
      it("THEN returns the first point's value exactly", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, 0)).toBe(0);
      });
    });

    describe("WHEN queried at the last point's timestamp", () => {
      it("THEN returns the last point's value exactly", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, H)).toBe(10);
      });
    });

    describe("WHEN queried at the midpoint", () => {
      it("THEN returns the linearly interpolated value", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, H / 2)).toBe(5);
      });
    });
  });

  describe("GIVEN a three-point series with a peak in the middle", () => {
    const pts: [number, number][] = [[0, 0], [H, 100], [2 * H, 0]];

    describe("WHEN queried at 1.5H", () => {
      it("THEN interpolates between the second and third point", () => {
        expect.assertions(1);
        expect(interpolateSeriesValue(pts, 1.5 * H)).toBe(50);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildRateOfChangePoints
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRateOfChangePoints", () => {
  describe("GIVEN fewer than 2 points", () => {
    describe("WHEN called with an empty array", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRateOfChangePoints([], "1h")).toEqual([]);
      });
    });

    describe("WHEN called with a single point", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRateOfChangePoints([[0, 10]], "1h")).toEqual([]);
      });
    });
  });

  describe("GIVEN evenly-spaced points in point_to_point mode", () => {
    describe("WHEN values increase by 10 per hour", () => {
      it("THEN every rate is 10 per hour", () => {
        // [0,0],[1H,10],[2H,20] → rates at 1H and 2H are both 10/h
        expect.assertions(1);
        const pts: [number, number][] = [[0, 0], [H, 10], [2 * H, 20]];
        const result = buildRateOfChangePoints(pts, "point_to_point");
        expect(result).toEqual([[H, 10], [2 * H, 10]]);
      });
    });
  });

  describe("GIVEN points with a 1h window", () => {
    describe("WHEN the window finds a point exactly 1h back", () => {
      it("THEN rate is computed against that comparison point", () => {
        // [0,0],[1H,10],[2H,30] with window=1H
        // At 1H: compare against t=0 (delta=1h), rate=(10-0)/1=10
        // At 2H: compare against t=1H (delta=1h), rate=(30-10)/1=20
        expect.assertions(1);
        const pts: [number, number][] = [[0, 0], [H, 10], [2 * H, 30]];
        const result = buildRateOfChangePoints(pts, "1h");
        expect(result).toEqual([[H, 10], [2 * H, 20]]);
      });
    });
  });

  describe("GIVEN points spaced 2h apart with a 1h window", () => {
    describe("WHEN no point is old enough, the first point is used as fallback", () => {
      it("THEN rate is computed from the very first point", () => {
        // [0,0],[2H,20],[4H,40] with window=1H
        // At 2H: no point >= 1H back except 0 (2H > 1H) → compare against [0,0], rate=20/2=10
        // At 4H: compare against [2H,20] (diff=2H >= 1H), rate=(40-20)/2=10
        expect.assertions(1);
        const pts: [number, number][] = [[0, 0], [2 * H, 20], [4 * H, 40]];
        const result = buildRateOfChangePoints(pts, "1h");
        expect(result).toEqual([[2 * H, 10], [4 * H, 10]]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildDeltaPoints
// ─────────────────────────────────────────────────────────────────────────────

describe("buildDeltaPoints", () => {
  describe("GIVEN too-short inputs", () => {
    describe("WHEN source has fewer than 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildDeltaPoints([[0, 5]], [[0, 5], [H, 5]])).toEqual([]);
      });
    });

    describe("WHEN comparison has fewer than 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildDeltaPoints([[0, 5], [H, 5]], [[0, 5]])).toEqual([]);
      });
    });
  });

  describe("GIVEN aligned source and comparison series", () => {
    describe("WHEN source values are double the comparison values", () => {
      it("THEN delta at each point equals the source value", () => {
        // source [0,10],[1H,20],[2H,30], comparison [0,5],[1H,10],[2H,15]
        // deltas: 5, 10, 15
        expect.assertions(1);
        const src: [number, number][] = [[0, 10], [H, 20], [2 * H, 30]];
        const cmp: [number, number][] = [[0, 5], [H, 10], [2 * H, 15]];
        expect(buildDeltaPoints(src, cmp)).toEqual([[0, 5], [H, 10], [2 * H, 15]]);
      });
    });
  });

  describe("GIVEN source timestamps outside the comparison range", () => {
    describe("WHEN a source point has no interpolatable comparison value", () => {
      it("THEN that point is omitted from the delta series", () => {
        // source spans 0..3H, comparison spans 0..1H only → points at 2H and 3H skipped
        expect.assertions(1);
        const src: [number, number][] = [[0, 10], [H, 20], [2 * H, 30], [3 * H, 40]];
        const cmp: [number, number][] = [[0, 0], [H, 0]];
        const result = buildDeltaPoints(src, cmp);
        expect(result).toEqual([[0, 10], [H, 20]]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildSummaryStats
// ─────────────────────────────────────────────────────────────────────────────

describe("buildSummaryStats", () => {
  describe("GIVEN an empty array", () => {
    describe("WHEN called with no points", () => {
      it("THEN returns null", () => {
        expect.assertions(1);
        expect(buildSummaryStats([])).toBeNull();
      });
    });
  });

  describe("GIVEN points with non-numeric values", () => {
    describe("WHEN all values are non-numeric", () => {
      it("THEN returns null", () => {
        expect.assertions(1);
        expect(buildSummaryStats([[0, NaN], [H, Infinity]])).toBeNull();
      });
    });
  });

  describe("GIVEN a mix of valid and invalid values", () => {
    describe("WHEN some values are non-numeric", () => {
      it("THEN skips non-finite values and computes stats on valid ones", () => {
        expect.assertions(3);
        const result = buildSummaryStats([[0, NaN], [H, 10], [2 * H, 20]]);
        expect(result?.min).toBe(10);
        expect(result?.max).toBe(20);
        expect(result?.mean).toBe(15);
      });
    });
  });

  describe("GIVEN [10, 20, 30]", () => {
    describe("WHEN called with three numeric points", () => {
      it("THEN returns correct min, max and mean", () => {
        expect.assertions(3);
        const result = buildSummaryStats(hourly([10, 20, 30]));
        expect(result?.min).toBe(10);
        expect(result?.max).toBe(30);
        expect(result?.mean).toBe(20);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAnomalySensitivityThreshold
// ─────────────────────────────────────────────────────────────────────────────

describe("getAnomalySensitivityThreshold", () => {
  describe("GIVEN sensitivity='low'", () => {
    it("THEN returns 2.8", () => {
      expect.assertions(1);
      expect(getAnomalySensitivityThreshold("low")).toBe(2.8);
    });
  });

  describe("GIVEN sensitivity='medium'", () => {
    it("THEN returns 2.2", () => {
      expect.assertions(1);
      expect(getAnomalySensitivityThreshold("medium")).toBe(2.2);
    });
  });

  describe("GIVEN sensitivity='high'", () => {
    it("THEN returns 1.6", () => {
      expect.assertions(1);
      expect(getAnomalySensitivityThreshold("high")).toBe(1.6);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildIQRAnomalyClusters
// ─────────────────────────────────────────────────────────────────────────────

describe("buildIQRAnomalyClusters", () => {
  describe("GIVEN fewer than 4 points", () => {
    describe("WHEN called with 3 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildIQRAnomalyClusters(hourly([1, 2, 3]), "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN all identical values", () => {
    describe("WHEN IQR is zero", () => {
      it("THEN returns [] (no spread to detect outliers against)", () => {
        expect.assertions(1);
        expect(buildIQRAnomalyClusters(hourly([5, 5, 5, 5, 5]), "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with a clear high outlier", () => {
    // [0,1],[1H,2],[2H,3],[3H,4],[4H,100]
    // q1=sorted[1]=2, q2=sorted[2]=3, q3=sorted[3]=4, IQR=2
    // medium k=2.0 → upper fence = 4+4=8; 100>8 → outlier
    const pts = hourly([1, 2, 3, 4, 100]);

    describe("WHEN sensitivity is medium", () => {
      it("THEN detects 1 cluster", () => {
        expect.assertions(1);
        expect(buildIQRAnomalyClusters(pts, "medium")).toHaveLength(1);
      });

      it("THEN cluster has anomalyMethod='iqr'", () => {
        expect.assertions(1);
        const [cluster] = buildIQRAnomalyClusters(pts, "medium");
        expect(cluster.anomalyMethod).toBe("iqr");
      });

      it("THEN cluster point has correct baselineValue (q2)", () => {
        expect.assertions(1);
        const [cluster] = buildIQRAnomalyClusters(pts, "medium");
        expect(cluster.points[0].baselineValue).toBe(3);
      });
    });

    describe("WHEN sensitivity is high (lower threshold)", () => {
      it("THEN still detects the same outlier", () => {
        // high k=1.5 → upper fence = 4+1.5*2=7; 100>7 → outlier
        expect.assertions(1);
        expect(buildIQRAnomalyClusters(pts, "high")).toHaveLength(1);
      });
    });
  });

  describe("GIVEN consecutive outliers above the upper fence", () => {
    describe("WHEN two adjacent points exceed the fence", () => {
      it("THEN they are merged into a single cluster", () => {
        // [1,2,3,4,100,200] → both 100 and 200 exceed the upper fence
        const pts = hourly([1, 2, 3, 4, 100, 200]);
        expect.assertions(1);
        const clusters = buildIQRAnomalyClusters(pts, "medium");
        expect(clusters).toHaveLength(1);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildRollingZScoreAnomalyClusters
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRollingZScoreAnomalyClusters", () => {
  describe("GIVEN fewer than 3 points", () => {
    describe("WHEN called with 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRollingZScoreAnomalyClusters(hourly([1, 2]), D, "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN constant values", () => {
    describe("WHEN std is zero", () => {
      it("THEN returns [] (no deviation possible)", () => {
        expect.assertions(1);
        expect(buildRollingZScoreAnomalyClusters(hourly([5, 5, 5, 5, 5]), D, "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN 10 points with 9 zeros and one spike", () => {
    // z-score of the spike = sqrt(n-1) = sqrt(9) = 3.0 (proven analytically)
    // medium threshold=2.2, so spike is always flagged
    const pts = hourly([0, 0, 0, 0, 0, 0, 0, 0, 0, 100]);

    describe("WHEN sensitivity is medium", () => {
      it("THEN detects exactly 1 cluster at the spike", () => {
        expect.assertions(2);
        const clusters = buildRollingZScoreAnomalyClusters(pts, D, "medium");
        expect(clusters).toHaveLength(1);
        expect(clusters[0].anomalyMethod).toBe("rolling_zscore");
      });
    });

    describe("WHEN sensitivity is low (threshold 2.8)", () => {
      it("THEN still detects the spike (z-score 3.0 > 2.8)", () => {
        expect.assertions(1);
        expect(buildRollingZScoreAnomalyClusters(pts, D, "low")).toHaveLength(1);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPersistenceAnomalyClusters
// ─────────────────────────────────────────────────────────────────────────────

describe("buildPersistenceAnomalyClusters", () => {
  describe("GIVEN fewer than 3 points", () => {
    describe("WHEN called with 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildPersistenceAnomalyClusters(hourly([10, 10]), H, "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN all-constant values", () => {
    describe("WHEN totalRange is zero", () => {
      it("THEN returns [] (no dynamic range to judge flatness against)", () => {
        expect.assertions(1);
        expect(buildPersistenceAnomalyClusters(hourly([10, 10, 10, 10, 10]), H, "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with a sustained flat plateau", () => {
    // [0,10],[1H,20],[2H,10],[3H,10],[4H,10],[5H,10],[6H,20]
    // totalRange=10, flatThreshold=0.2 (medium 2%), plateau at 2H..5H (3H duration)
    // minDuration=1H → cluster emitted
    const pts = hourly([10, 20, 10, 10, 10, 10, 20]);

    describe("WHEN min duration is 1h", () => {
      it("THEN detects 1 cluster for the plateau", () => {
        expect.assertions(2);
        const clusters = buildPersistenceAnomalyClusters(pts, H, "medium");
        expect(clusters).toHaveLength(1);
        expect(clusters[0].anomalyMethod).toBe("persistence");
      });

      it("THEN the cluster spans 4 points (2H..5H)", () => {
        expect.assertions(1);
        const [cluster] = buildPersistenceAnomalyClusters(pts, H, "medium");
        expect(cluster.points).toHaveLength(4);
      });
    });

    describe("WHEN min duration is longer than the plateau", () => {
      it("THEN returns [] (plateau too short)", () => {
        expect.assertions(1);
        // plateau is 3H long; require 4H minimum → no cluster
        expect(buildPersistenceAnomalyClusters(pts, 4 * H, "medium")).toEqual([]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildComparisonWindowAnomalyClusters
// ─────────────────────────────────────────────────────────────────────────────

describe("buildComparisonWindowAnomalyClusters", () => {
  describe("GIVEN too-short inputs", () => {
    describe("WHEN source has fewer than 3 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        const cmp = hourly([0, 0, 0, 0]);
        expect(buildComparisonWindowAnomalyClusters(hourly([1, 2]), cmp, "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with a large divergence from its comparison at the end", () => {
    // source:     10 flat for 9 points, then 110 (+100 from comparison)
    // comparison: 10 flat throughout
    // deltas: 9×0 + 100; mean=10, residuals: 9×(-10), 1×90
    // rmsDeviation=30, threshold=30*2.2=66; |90|>66 → anomaly
    const src = hourly([10, 10, 10, 10, 10, 10, 10, 10, 10, 110]);
    const cmp = hourly([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);

    describe("WHEN sensitivity is medium", () => {
      it("THEN detects 1 cluster", () => {
        expect.assertions(2);
        const clusters = buildComparisonWindowAnomalyClusters(src, cmp, "medium");
        expect(clusters).toHaveLength(1);
        expect(clusters[0].anomalyMethod).toBe("comparison_window");
      });
    });
  });

  describe("GIVEN perfectly identical source and comparison", () => {
    describe("WHEN all deltas are zero", () => {
      it("THEN returns [] (no deviation)", () => {
        expect.assertions(1);
        const pts = hourly([5, 5, 5, 5, 5]);
        expect(buildComparisonWindowAnomalyClusters(pts, pts, "medium")).toEqual([]);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildRateOfChangeAnomalyClusters
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRateOfChangeAnomalyClusters", () => {
  describe("GIVEN fewer than 3 points", () => {
    describe("WHEN called with 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildRateOfChangeAnomalyClusters(hourly([1, 2]), "1h", "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a constant-rate series", () => {
    describe("WHEN the rate of change is uniform", () => {
      it("THEN returns [] (no anomalous rate spike)", () => {
        expect.assertions(1);
        expect(buildRateOfChangeAnomalyClusters(hourly([0, 1, 2, 3, 4, 5]), "1h", "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with a sudden rate spike at the end", () => {
    // [0,0],[1H,0],[2H,0],[3H,0],[4H,0],[5H,0],[6H,0],[7H,0],[8H,0],[9H,1000]
    // rates (window=1H): all ~0 for first 9, then ~1000/h for last
    // The spike should stand out well above medium threshold
    const pts = hourly([0, 0, 0, 0, 0, 0, 0, 0, 0, 1000]);

    describe("WHEN sensitivity is medium", () => {
      it("THEN detects at least 1 cluster at the spike", () => {
        expect.assertions(2);
        const clusters = buildRateOfChangeAnomalyClusters(pts, "1h", "medium");
        expect(clusters.length).toBeGreaterThan(0);
        expect(clusters[0].anomalyMethod).toBe("rate_of_change");
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildAnomalyClusters (trend_residual)
// ─────────────────────────────────────────────────────────────────────────────

describe("buildAnomalyClusters", () => {
  describe("GIVEN fewer than 3 points", () => {
    describe("WHEN called with 2 points", () => {
      it("THEN returns []", () => {
        expect.assertions(1);
        expect(buildAnomalyClusters(hourly([1, 2]), "rolling_average", "24h", "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN constant values", () => {
    describe("WHEN all residuals are zero", () => {
      it("THEN returns [] (no deviation from flat trend)", () => {
        expect.assertions(1);
        expect(buildAnomalyClusters(hourly([5, 5, 5, 5, 5]), "rolling_average", "24h", "medium")).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with a large spike at the end", () => {
    // 9 points at 10, one at 100; trend (rolling avg, 24h) lags behind spike
    // residual of the spike >> RMS residual of the steady part → anomaly
    const pts = hourly([10, 10, 10, 10, 10, 10, 10, 10, 10, 100]);

    describe("WHEN method is rolling_average with 24h window", () => {
      it("THEN detects 1 cluster at the spike", () => {
        expect.assertions(2);
        const clusters = buildAnomalyClusters(pts, "rolling_average", "24h", "medium");
        expect(clusters).toHaveLength(1);
        expect(clusters[0].anomalyMethod).toBe("trend_residual");
      });
    });

    describe("WHEN method is linear_trend", () => {
      it("THEN also detects the spike as an anomaly", () => {
        expect.assertions(1);
        const clusters = buildAnomalyClusters(pts, "linear_trend", "24h", "medium");
        expect(clusters.length).toBeGreaterThan(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyAnomalyOverlapMode
// ─────────────────────────────────────────────────────────────────────────────

describe("applyAnomalyOverlapMode", () => {
  // Two methods each with one cluster; they share timestamp 2000
  const clusterIqr = {
    anomalyMethod: "iqr",
    points: [{ timeMs: 1000, value: 5, baselineValue: 3, residual: 2 }, { timeMs: 2000, value: 10, baselineValue: 3, residual: 7 }],
    maxDeviation: 7,
  };
  const clusterZscore = {
    anomalyMethod: "rolling_zscore",
    points: [{ timeMs: 2000, value: 10, baselineValue: 3, residual: 7 }, { timeMs: 3000, value: 8, baselineValue: 3, residual: 5 }],
    maxDeviation: 7,
  };
  const clustersByMethod = { iqr: [clusterIqr], rolling_zscore: [clusterZscore] };

  describe("GIVEN a single method", () => {
    describe("WHEN mode is 'all'", () => {
      it("THEN returns all clusters unchanged", () => {
        expect.assertions(1);
        const result = applyAnomalyOverlapMode({ iqr: [clusterIqr] }, "all");
        expect(result).toHaveLength(1);
      });
    });
  });

  describe("GIVEN two methods with overlapping timestamps", () => {
    describe("WHEN mode is 'all'", () => {
      it("THEN returns all clusters from all methods", () => {
        expect.assertions(1);
        expect(applyAnomalyOverlapMode(clustersByMethod, "all")).toHaveLength(2);
      });
    });

    describe("WHEN mode is 'only'", () => {
      it("THEN returns only points present in both methods", () => {
        expect.assertions(2);
        const result = applyAnomalyOverlapMode(clustersByMethod, "only");
        expect(result).toHaveLength(1);
        expect(result[0].points.every((p: any) => p.timeMs === 2000)).toBe(true);
      });

      it("THEN marks clusters as isOverlap=true", () => {
        expect.assertions(1);
        const [cluster] = applyAnomalyOverlapMode(clustersByMethod, "only");
        expect(cluster.isOverlap).toBe(true);
      });
    });

    describe("WHEN mode is 'highlight'", () => {
      it("THEN returns all clusters with isOverlap flags set correctly", () => {
        expect.assertions(2);
        const result = applyAnomalyOverlapMode(clustersByMethod, "highlight");
        expect(result).toHaveLength(2);
        // Both clusters contain t=2000 which is in both methods → both are overlapping
        expect(result.every((c: any) => c.isOverlap === true)).toBe(true);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeSeriesAnalysis
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeSeriesAnalysis", () => {
  describe("GIVEN null input", () => {
    describe("WHEN called with null", () => {
      it("THEN returns all defaults", () => {
        expect.assertions(6);
        const result = normalizeSeriesAnalysis(null);
        expect(result.show_trend_lines).toBe(false);
        expect(result.trend_method).toBe("rolling_average");
        expect(result.trend_window).toBe("24h");
        expect(result.anomaly_methods).toEqual([]);
        expect(result.anomaly_sensitivity).toBe("medium");
        expect(result.anomaly_comparison_window_id).toBeNull();
      });
    });
  });

  describe("GIVEN a legacy anomaly_method string", () => {
    describe("WHEN anomaly_method='iqr' is set", () => {
      it("THEN anomaly_methods becomes ['iqr']", () => {
        expect.assertions(1);
        const result = normalizeSeriesAnalysis({ anomaly_method: "iqr" });
        expect(result.anomaly_methods).toEqual(["iqr"]);
      });
    });
  });

  describe("GIVEN anomaly_methods with invalid entries", () => {
    describe("WHEN the array contains unrecognised method names", () => {
      it("THEN filters out invalid methods", () => {
        expect.assertions(1);
        const result = normalizeSeriesAnalysis({ anomaly_methods: ["iqr", "bogus", "rolling_zscore"] });
        expect(result.anomaly_methods).toEqual(["iqr", "rolling_zscore"]);
      });
    });
  });

  describe("GIVEN a full valid object", () => {
    describe("WHEN all fields are provided", () => {
      it("THEN preserves valid values", () => {
        expect.assertions(4);
        const result = normalizeSeriesAnalysis({
          show_trend_lines: true,
          trend_method: "linear_trend",
          trend_window: "7d",
          show_anomalies: true,
          anomaly_methods: ["iqr"],
          anomaly_sensitivity: "high",
          anomaly_overlap_mode: "only",
        });
        expect(result.show_trend_lines).toBe(true);
        expect(result.trend_method).toBe("linear_trend");
        expect(result.anomaly_sensitivity).toBe("high");
        expect(result.anomaly_overlap_mode).toBe("only");
      });
    });
  });

  describe("GIVEN an anomaly_overlap_mode value outside the allowed set", () => {
    describe("WHEN mode is an invalid string", () => {
      it("THEN defaults to 'all'", () => {
        expect.assertions(1);
        const result = normalizeSeriesAnalysis({ anomaly_overlap_mode: "invalid" });
        expect(result.anomaly_overlap_mode).toBe("all");
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHistoryAnalysis
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHistoryAnalysis", () => {
  describe("GIVEN an empty payload", () => {
    describe("WHEN called with no series", () => {
      it("THEN returns all empty result arrays", () => {
        expect.assertions(5);
        const result = computeHistoryAnalysis({});
        expect(result.trendSeries).toEqual([]);
        expect(result.rateSeries).toEqual([]);
        expect(result.deltaSeries).toEqual([]);
        expect(result.summaryStats).toEqual([]);
        expect(result.anomalySeries).toEqual([]);
      });
    });
  });

  describe("GIVEN a series with fewer than 2 points", () => {
    describe("WHEN the series has only 1 point", () => {
      it("THEN the series is skipped and results are empty", () => {
        expect.assertions(1);
        const result = computeHistoryAnalysis({
          series: [{ entityId: "sensor.a", pts: [[0, 10]], analysis: { show_trend_lines: true } }],
        });
        expect(result.trendSeries).toEqual([]);
      });
    });
  });

  describe("GIVEN show_trend_lines=true", () => {
    describe("WHEN a series has sufficient points", () => {
      it("THEN trendSeries contains one entry for that entity", () => {
        expect.assertions(2);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.a",
            pts: hourly([10, 10, 10, 10, 10]),
            analysis: { show_trend_lines: true },
          }],
        });
        expect(result.trendSeries).toHaveLength(1);
        expect(result.trendSeries[0].entityId).toBe("sensor.a");
      });
    });
  });

  describe("GIVEN show_summary_stats=true", () => {
    describe("WHEN a series has numeric values", () => {
      it("THEN summaryStats contains min, max, mean for the entity", () => {
        expect.assertions(4);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.b",
            pts: hourly([10, 20, 30]),
            analysis: { show_summary_stats: true },
          }],
        });
        expect(result.summaryStats).toHaveLength(1);
        expect(result.summaryStats[0].min).toBe(10);
        expect(result.summaryStats[0].max).toBe(30);
        expect(result.summaryStats[0].mean).toBe(20);
      });
    });
  });

  describe("GIVEN show_rate_of_change=true", () => {
    describe("WHEN the series has a constant rate", () => {
      it("THEN rateSeries contains one entry", () => {
        expect.assertions(1);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.c",
            pts: hourly([0, 10, 20, 30]),
            analysis: { show_rate_of_change: true, rate_window: "1h" },
          }],
        });
        expect(result.rateSeries).toHaveLength(1);
      });
    });
  });

  describe("GIVEN show_delta_analysis=true with a comparison series", () => {
    describe("WHEN hasSelectedComparisonWindow=true", () => {
      it("THEN deltaSeries contains the difference between source and comparison", () => {
        expect.assertions(2);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.d",
            pts: hourly([10, 20, 30]),
            analysis: { show_delta_analysis: true },
          }],
          comparisonSeries: [{ entityId: "sensor.d", pts: hourly([0, 10, 20]) }],
          hasSelectedComparisonWindow: true,
        });
        expect(result.deltaSeries).toHaveLength(1);
        expect(result.deltaSeries[0].pts).toEqual([[0, 10], [H, 10], [2 * H, 10]]);
      });
    });

    describe("WHEN hasSelectedComparisonWindow=false", () => {
      it("THEN deltaSeries remains empty", () => {
        expect.assertions(1);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.d",
            pts: hourly([10, 20, 30]),
            analysis: { show_delta_analysis: true },
          }],
          comparisonSeries: [{ entityId: "sensor.d", pts: hourly([0, 10, 20]) }],
          hasSelectedComparisonWindow: false,
        });
        expect(result.deltaSeries).toEqual([]);
      });
    });
  });

  describe("GIVEN show_anomalies=true with method='iqr'", () => {
    describe("WHEN the series contains a clear IQR outlier", () => {
      it("THEN anomalySeries contains one entry for that entity", () => {
        expect.assertions(2);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.e",
            pts: hourly([1, 2, 3, 4, 100]),
            analysis: { show_anomalies: true, anomaly_methods: ["iqr"], anomaly_sensitivity: "medium" },
          }],
        });
        expect(result.anomalySeries).toHaveLength(1);
        expect(result.anomalySeries[0].entityId).toBe("sensor.e");
      });
    });
  });

  describe("GIVEN multiple series with different analysis options", () => {
    describe("WHEN one series shows trends and another shows stats", () => {
      it("THEN each result array contains the relevant entity", () => {
        expect.assertions(4);
        const result = computeHistoryAnalysis({
          series: [
            { entityId: "sensor.trend", pts: hourly([1, 2, 3, 4, 5]), analysis: { show_trend_lines: true } },
            { entityId: "sensor.stats", pts: hourly([10, 20, 30, 40, 50]), analysis: { show_summary_stats: true } },
          ],
        });
        expect(result.trendSeries).toHaveLength(1);
        expect(result.trendSeries[0].entityId).toBe("sensor.trend");
        expect(result.summaryStats).toHaveLength(1);
        expect(result.summaryStats[0].entityId).toBe("sensor.stats");
      });
    });
  });

  describe("GIVEN show_anomalies=true with method='comparison_window'", () => {
    describe("WHEN allComparisonWindowsData provides matching comparison points", () => {
      it("THEN anomalySeries is populated when divergence exceeds threshold", () => {
        expect.assertions(1);
        const src = hourly([10, 10, 10, 10, 10, 10, 10, 10, 10, 110]);
        const cmp = hourly([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
        const result = computeHistoryAnalysis({
          series: [{
            entityId: "sensor.f",
            pts: src,
            analysis: {
              show_anomalies: true,
              anomaly_methods: ["comparison_window"],
              anomaly_sensitivity: "medium",
              anomaly_comparison_window_id: "window_1",
            },
          }],
          allComparisonWindowsData: { window_1: { "sensor.f": cmp } },
        });
        expect(result.anomalySeries).toHaveLength(1);
      });
    });
  });
});
