import { describe, expect, it, vi } from "vitest";
import {
  fetchDeletedMonitors,
  fetchMonitorAnomalyActivity,
  purgeMonitor,
  restoreMonitor,
  type AnomalyMonitor,
  type MonitorAnomalyActivityResult,
} from "@/lib/data/monitors-api";

const monitor = {
  id: "m1",
  type: "individual",
  name: "Deleted one",
  entity_id: "sensor.a",
  deleted_at: "2026-10-01T00:00:00+00:00",
} as unknown as AnomalyMonitor;

function makeHass(impl: () => Promise<unknown>) {
  const sendMessagePromise = vi.fn(impl);
  return { hass: { connection: { sendMessagePromise } }, sendMessagePromise };
}

describe("monitors-api trash calls", () => {
  describe("GIVEN a hass resolving a monitor", () => {
    describe("WHEN restoreMonitor is called", () => {
      it("THEN sends the restore command and resolves the monitor", async () => {
        const { hass, sendMessagePromise } = makeHass(async () => ({
          monitor,
        }));
        await expect(restoreMonitor(hass, "m1")).resolves.toBe(monitor);
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/monitors/restore",
          monitor_id: "m1",
        });
      });
    });
    describe("AND the response has no monitor", () => {
      it("THEN restoreMonitor rejects", async () => {
        const { hass } = makeHass(async () => ({}));
        await expect(restoreMonitor(hass, "m1")).rejects.toThrow(
          "restoreMonitor: no monitor in response"
        );
      });
    });
  });

  describe("GIVEN a mock hass", () => {
    describe("WHEN purgeMonitor is called", () => {
      it("THEN sends the purge command with monitor_id", async () => {
        const { hass, sendMessagePromise } = makeHass(async () => undefined);
        await purgeMonitor(hass, "m1");
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/monitors/purge",
          monitor_id: "m1",
        });
      });
    });
  });

  describe("GIVEN a hass resolving monitors", () => {
    describe("WHEN fetchDeletedMonitors is called", () => {
      it("THEN returns the array via trash/list", async () => {
        const { hass, sendMessagePromise } = makeHass(async () => ({
          monitors: [monitor],
        }));
        await expect(fetchDeletedMonitors(hass)).resolves.toEqual([monitor]);
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/monitors/trash/list",
        });
      });
    });
  });

  describe("GIVEN a hass that rejects", () => {
    describe("WHEN fetchDeletedMonitors is called", () => {
      it("THEN returns an empty array", async () => {
        const { hass } = makeHass(async () => {
          throw new Error("boom");
        });
        await expect(fetchDeletedMonitors(hass)).resolves.toEqual([]);
      });
    });
  });
});

describe("fetchMonitorAnomalyActivity", () => {
  const activity: MonitorAnomalyActivityResult = {
    monitor_id: "m1",
    start_ms: 1000,
    end_ms: 2000,
    bucket_ms: 500,
    total_anomalies: 2,
    incident_count: 1,
    entities: [
      {
        entity_id: "sensor.a",
        total: 2,
        incident_count: 1,
        buckets: [
          { start_ms: 1000, end_ms: 1500, anomaly_count: 2, incident_count: 1 },
          { start_ms: 1500, end_ms: 2000, anomaly_count: 0, incident_count: 0 },
        ],
      },
    ],
  };

  describe("GIVEN a hass resolving an activity result", () => {
    describe("WHEN called with a range and bucket count", () => {
      it("THEN sends ISO bounds and bucket_count and resolves the result", async () => {
        const { hass, sendMessagePromise } = makeHass(async () => activity);
        await expect(
          fetchMonitorAnomalyActivity(hass, "m1", 1000, 2000, 2)
        ).resolves.toBe(activity);
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/monitors/anomaly_activity",
          monitor_id: "m1",
          start_time: "1970-01-01T00:00:01.000Z",
          end_time: "1970-01-01T00:00:02.000Z",
          bucket_count: 2,
        });
      });
    });
    describe("WHEN called without a bucket count", () => {
      it("THEN omits bucket_count so the server default applies", async () => {
        const { hass, sendMessagePromise } = makeHass(async () => activity);
        await fetchMonitorAnomalyActivity(hass, "m1", 1000, 2000);
        expect(sendMessagePromise.mock.calls[0][0]).not.toHaveProperty(
          "bucket_count"
        );
      });
    });
  });
});
