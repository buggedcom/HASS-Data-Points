import { describe, expect, it, vi } from "vitest";
import {
  activityIdentity,
  LIVE_ACTIVITY_TTL_MS,
  MonitorActivityController,
  type ActivityFetcher,
  type ActivityRange,
} from "@/lib/data/monitor-activity";
import type {
  AnomalyMonitor,
  MonitorAnomalyActivityResult,
} from "@/lib/data/monitors-api";

const NOW = Date.parse("2026-11-11T12:00:00Z");
const HOUR = 3_600_000;
const HISTORICAL: ActivityRange = {
  startMs: NOW - 48 * HOUR,
  endMs: NOW - 24 * HOUR,
};
const LIVE: ActivityRange = { startMs: NOW - 24 * HOUR, endMs: NOW };

function monitor(overrides: Partial<AnomalyMonitor> = {}): AnomalyMonitor {
  return {
    id: "m1",
    type: "individual",
    entity_id: "sensor.temp",
    name: "Climate",
    enabled: true,
    look_back_hours: 24,
    scan_interval_minutes: 15,
    created_at: "2026-11-01T00:00:00Z",
    last_scan_at: null,
    last_anomaly_at: null,
    last_cluster_count: 0,
    last_scan_data_points: null,
    scan_history: [],
    device_id: null,
    anomaly_methods: ["trend_residual", "rate_of_change"],
    anomaly_sensitivity: "medium",
    anomaly_overlap_mode: "all",
    anomaly_rate_window: "1h",
    anomaly_zscore_window: "24h",
    anomaly_persistence_window: "1h",
    anomaly_trend_method: "polynomial_trend",
    anomaly_trend_window: "24h",
    sample_interval: null,
    sample_aggregate: "mean",
    anomaly_use_sampled_data: false,
    baseline_entity_id: null,
    baseline_time_offset_hours: 0,
    dismissed_windows: [],
    ...overrides,
  } as AnomalyMonitor;
}

function result(total = 1): MonitorAnomalyActivityResult {
  return {
    monitor_id: "m1",
    start_ms: 0,
    end_ms: 1,
    bucket_ms: 1,
    total_anomalies: total,
    incident_count: total,
    entities: [],
  };
}

interface Deferred {
  resolve: (value: MonitorAnomalyActivityResult) => void;
  reject: (err: unknown) => void;
}

function harness() {
  let now = NOW;
  let ids = 0;
  const pending: Deferred[] = [];
  const fetcher: ActivityFetcher = {
    fetch: vi.fn(
      () =>
        new Promise<MonitorAnomalyActivityResult>((resolve, reject) => {
          pending.push({ resolve, reject });
        })
    ),
    cancel: vi.fn(),
    createRequestId: () => `req-${++ids}`,
  };
  const onChange = vi.fn();
  const controller = new MonitorActivityController(
    fetcher,
    onChange,
    () => now
  );
  return {
    controller,
    fetcher,
    onChange,
    pending,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe("MonitorActivityController", () => {
  describe("GIVEN a successful historical result", () => {
    describe("WHEN the list refreshes with only status/count changes", () => {
      it("THEN no new activity request is made", async () => {
        expect.assertions(2);
        const { controller, fetcher, pending } = harness();
        controller.sync([monitor()], HISTORICAL);
        pending[0].resolve(result());
        await flush();

        controller.sync(
          [
            monitor({
              name: "Renamed",
              last_scan_at: "2026-11-11T11:45:00Z",
              last_cluster_count: 4,
              last_scan_status: "running",
            } as Partial<AnomalyMonitor>),
          ],
          HISTORICAL
        );
        controller.sync([monitor()], HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(1);
        expect(controller.state("m1")?.status).toBe("success");
      });
    });

    describe("WHEN the range changes and later returns", () => {
      it("THEN the old range is served from the component cache", async () => {
        expect.assertions(2);
        const { controller, fetcher, pending } = harness();
        controller.sync([monitor()], HISTORICAL);
        pending[0].resolve(result(1));
        await flush();
        controller.sync([monitor()], {
          ...HISTORICAL,
          startMs: HISTORICAL.startMs - HOUR,
        });
        pending[1].resolve(result(2));
        await flush();

        controller.sync([monitor()], HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(2);
        const state = controller.state("m1");
        expect(
          state?.status === "success" && state.result.total_anomalies
        ).toBe(1);
      });
    });
  });

  describe("GIVEN identical syncs while a request is in flight", () => {
    describe("WHEN sync is called repeatedly", () => {
      it("THEN the requests are coalesced into one", () => {
        expect.assertions(1);
        const { controller, fetcher } = harness();

        controller.sync([monitor()], HISTORICAL);
        controller.sync([monitor()], HISTORICAL);
        controller.sync([monitor()], HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("GIVEN a request in flight", () => {
    describe("WHEN the detection config changes", () => {
      it("THEN the old request is cancelled and its late result is ignored", async () => {
        expect.assertions(3);
        const { controller, fetcher, pending } = harness();
        controller.sync([monitor()], HISTORICAL);

        controller.sync([monitor({ anomaly_sensitivity: "high" })], HISTORICAL);
        pending[0].resolve(result(9));
        await flush();

        expect(fetcher.cancel).toHaveBeenCalledWith("req-1");
        expect(controller.state("m1")?.status).toBe("loading");
        pending[1].resolve(result(3));
        await flush();
        const state = controller.state("m1");
        expect(
          state?.status === "success" && state.result.total_anomalies
        ).toBe(3);
      });
    });
  });

  describe("GIVEN a failed request", () => {
    describe("WHEN the list is polled again with the same identity", () => {
      it("THEN it stays an error and is not retried automatically", async () => {
        expect.assertions(2);
        const { controller, fetcher, pending } = harness();
        controller.sync([monitor()], HISTORICAL);
        pending[0].reject({ code: "detection_timeout", message: "x" });
        await flush();

        controller.sync([monitor()], HISTORICAL);
        controller.sync([monitor()], HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(1);
        expect(controller.state("m1")).toMatchObject({
          status: "error",
          code: "detection_timeout",
        });
      });
    });

    describe("WHEN the user retries", () => {
      it("THEN exactly one new request is made", async () => {
        expect.assertions(2);
        const { controller, fetcher, pending } = harness();
        controller.sync([monitor()], HISTORICAL);
        pending[0].reject({ code: "detection_busy" });
        await flush();

        controller.retry(monitor(), HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(2);
        expect(controller.state("m1")?.status).toBe("loading");
      });
    });

    describe("WHEN a refresh of a previously successful live result fails", () => {
      it("THEN the old payload is kept only as explicitly stale", async () => {
        expect.assertions(2);
        const { controller, pending, advance } = harness();
        controller.sync([monitor()], LIVE);
        pending[0].resolve(result(5));
        await flush();
        advance(LIVE_ACTIVITY_TTL_MS + 1);

        controller.sync([monitor()], LIVE);
        pending[1].reject({ code: "detection_timeout" });
        await flush();

        const state = controller.state("m1");
        expect(state?.status).toBe("error");
        expect(state?.status === "error" && state.stale?.total_anomalies).toBe(
          5
        );
      });
    });
  });

  describe("GIVEN one monitor fails and another succeeds", () => {
    describe("WHEN both settle", () => {
      it("THEN each keeps its own state", async () => {
        expect.assertions(2);
        const { controller, pending } = harness();
        controller.sync([monitor(), monitor({ id: "m2" })], HISTORICAL);

        pending[0].reject({ code: "detection_error" });
        pending[1].resolve(result(2));
        await flush();

        expect(controller.state("m1")?.status).toBe("error");
        expect(controller.state("m2")?.status).toBe("success");
      });
    });
  });

  describe("GIVEN a live-edge success", () => {
    describe("WHEN 60 seconds pass", () => {
      it("THEN the next poll refreshes it once", async () => {
        expect.assertions(2);
        const { controller, fetcher, pending, advance } = harness();
        controller.sync([monitor()], LIVE);
        pending[0].resolve(result());
        await flush();

        advance(LIVE_ACTIVITY_TTL_MS - 1);
        controller.sync([monitor()], LIVE);
        expect(fetcher.fetch).toHaveBeenCalledTimes(1);

        advance(2);
        controller.sync([monitor()], LIVE);
        controller.sync([monitor()], LIVE);
        expect(fetcher.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("GIVEN a timed dismissal and unchanged monitor JSON", () => {
    describe("WHEN the dismissal expires between polls", () => {
      it("THEN exactly one activity reload happens", async () => {
        expect.assertions(2);
        const dismissed = monitor({
          last_scan_status: "timeout",
          dismissed_windows: [
            {
              id: "w1",
              start_ms: HISTORICAL.startMs,
              end_ms: HISTORICAL.endMs,
              dismissed_at: "2026-11-11T11:00:00Z",
              expires_at: new Date(NOW + 5 * 60_000).toISOString(),
            },
          ],
        } as Partial<AnomalyMonitor>);
        const { controller, fetcher, pending, advance } = harness();
        controller.sync([dismissed], HISTORICAL);
        pending[0].resolve(result(0));
        await flush();

        advance(4 * 60_000);
        controller.sync([dismissed], HISTORICAL);
        expect(fetcher.fetch).toHaveBeenCalledTimes(1);

        advance(2 * 60_000);
        controller.sync([dismissed], HISTORICAL);
        controller.sync([dismissed], HISTORICAL);
        expect(fetcher.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("GIVEN a paused monitor", () => {
    describe("WHEN synced", () => {
      it("THEN no activity is requested and any in-flight request is cancelled", () => {
        expect.assertions(3);
        const { controller, fetcher } = harness();
        controller.sync([monitor()], HISTORICAL);

        controller.sync([monitor({ enabled: false })], HISTORICAL);

        expect(fetcher.fetch).toHaveBeenCalledTimes(1);
        expect(fetcher.cancel).toHaveBeenCalledWith("req-1");
        expect(controller.state("m1")).toBeNull();
      });
    });
  });

  describe("GIVEN in-flight requests", () => {
    describe("WHEN the component disposes the controller", () => {
      it("THEN they are cancelled and late results are dropped", async () => {
        expect.assertions(2);
        const { controller, fetcher, onChange, pending } = harness();
        controller.sync([monitor(), monitor({ id: "m2" })], HISTORICAL);
        onChange.mockClear();

        controller.dispose();
        pending[0].resolve(result());
        await flush();

        expect(fetcher.cancel).toHaveBeenCalledTimes(2);
        expect(onChange).not.toHaveBeenCalled();
      });
    });
  });
});

describe("MonitorActivityController expiry timer", () => {
  describe("GIVEN a live-edge success", () => {
    describe("WHEN its 60 s lifetime ends with no poll", () => {
      it("THEN the owner is asked to re-sync once, right after expiry", async () => {
        expect.assertions(2);
        vi.useFakeTimers();
        try {
          let now = NOW;
          let resolve: (r: MonitorAnomalyActivityResult) => void = () => {};
          const onExpire = vi.fn();
          const controller = new MonitorActivityController(
            {
              fetch: vi.fn(
                () =>
                  new Promise<MonitorAnomalyActivityResult>((r) => {
                    resolve = r;
                  })
              ),
              cancel: vi.fn(),
              createRequestId: () => "req",
            },
            vi.fn(),
            () => now,
            onExpire
          );
          controller.sync([monitor()], LIVE);
          resolve(result());
          await vi.advanceTimersByTimeAsync(0);

          now += LIVE_ACTIVITY_TTL_MS - 1;
          await vi.advanceTimersByTimeAsync(LIVE_ACTIVITY_TTL_MS - 1);
          expect(onExpire).not.toHaveBeenCalled();

          now += 2;
          await vi.advanceTimersByTimeAsync(2);
          expect(onExpire).toHaveBeenCalledTimes(1);
          controller.dispose();
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });
});

describe("activityIdentity", () => {
  describe("GIVEN fields that do not affect detection", () => {
    describe("WHEN they change", () => {
      it("THEN the identity is unchanged", () => {
        expect.assertions(2);
        const base = activityIdentity(monitor(), HISTORICAL, 48, NOW).key;

        expect(
          activityIdentity(
            monitor({
              name: "Other",
              last_cluster_count: 9,
              last_scan_at: "2026-11-11T11:00:00Z",
            }),
            HISTORICAL,
            48,
            NOW
          ).key
        ).toBe(base);
        expect(
          activityIdentity(
            monitor({ anomaly_methods: ["rate_of_change", "trend_residual"] }),
            HISTORICAL,
            48,
            NOW
          ).key
        ).toBe(base);
      });
    });
  });

  describe("GIVEN a historical range with no timed dismissals", () => {
    describe("WHEN its identity is computed", () => {
      it("THEN the success never expires", () => {
        expect.assertions(1);
        expect(
          activityIdentity(monitor(), HISTORICAL, 48, NOW).validUntil
        ).toBeNull();
      });
    });
  });
});
