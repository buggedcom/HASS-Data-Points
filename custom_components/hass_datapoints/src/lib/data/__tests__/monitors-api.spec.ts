import { describe, expect, it, vi } from "vitest";
import {
  fetchDeletedMonitors,
  purgeMonitor,
  restoreMonitor,
  type AnomalyMonitor,
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
