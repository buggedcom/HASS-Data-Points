import { describe, expect, it } from "vitest";
import {
  deriveMonitorStatus,
  type MonitorStatusInput,
} from "@/lib/data/monitor-status";

/** A healthy, enabled baseline with no anomaly history whatsoever. */
function baseline(
  overrides: Partial<MonitorStatusInput> = {}
): MonitorStatusInput {
  return {
    enabled: true,
    last_cluster_count: 0,
    last_anomaly_at: null,
    scan_history: [],
    dismissed_windows: [],
    ...overrides,
  };
}

describe("deriveMonitorStatus", () => {
  describe("GIVEN a disabled monitor", () => {
    describe("WHEN its status is derived", () => {
      it("THEN it is Paused regardless of anomaly state", () => {
        expect(deriveMonitorStatus(baseline({ enabled: false }))).toBe(
          "paused"
        );
        expect(
          deriveMonitorStatus(
            baseline({ enabled: false, last_cluster_count: 3 })
          )
        ).toBe("paused");
      });
    });
  });

  describe("GIVEN an enabled monitor with active anomaly clusters", () => {
    describe("WHEN its status is derived", () => {
      it("THEN it is Triggered", () => {
        expect(deriveMonitorStatus(baseline({ last_cluster_count: 1 }))).toBe(
          "triggered"
        );
      });
    });
  });

  describe("GIVEN an enabled monitor with no active clusters but past anomalies", () => {
    describe("WHEN anomalies were seen before (last_anomaly_at set)", () => {
      it("THEN it is Warning", () => {
        expect(
          deriveMonitorStatus(
            baseline({ last_anomaly_at: "2026-10-20T00:00:00Z" })
          )
        ).toBe("warning");
      });
    });

    describe("WHEN there are dismissed detection windows", () => {
      it("THEN it is Warning", () => {
        expect(
          deriveMonitorStatus(
            baseline({
              dismissed_windows: [
                {
                  id: "w1",
                  start_ms: 1,
                  end_ms: 2,
                  dismissed_at: "2026-10-20T00:00:00Z",
                  expires_at: null,
                },
              ],
            })
          )
        ).toBe("warning");
      });
    });

    describe("WHEN scan history records a non-zero anomaly count", () => {
      it("THEN it is Warning", () => {
        expect(
          deriveMonitorStatus(
            baseline({
              scan_history: [
                { t: "2026-10-20T00:00:00Z", count: 0 },
                { t: "2026-10-20T01:00:00Z", count: 2 },
              ],
            })
          )
        ).toBe("warning");
      });
    });
  });

  describe("GIVEN an enabled monitor that has never seen an anomaly", () => {
    describe("WHEN its status is derived", () => {
      it("THEN it is Healthy", () => {
        expect(deriveMonitorStatus(baseline())).toBe("healthy");
      });

      it("THEN an all-zero scan history is still Healthy", () => {
        expect(
          deriveMonitorStatus(
            baseline({
              scan_history: [
                { t: "2026-10-20T00:00:00Z", count: 0 },
                { t: "2026-10-20T01:00:00Z", count: 0 },
              ],
            })
          )
        ).toBe("healthy");
      });
    });
  });

  describe("GIVEN a disabled monitor is prioritised over anomalies", () => {
    describe("WHEN both disabled and warning signals are present", () => {
      it("THEN Paused wins over Warning", () => {
        expect(
          deriveMonitorStatus(
            baseline({
              enabled: false,
              last_anomaly_at: "2026-10-20T00:00:00Z",
            })
          )
        ).toBe("paused");
      });
    });
  });
});
