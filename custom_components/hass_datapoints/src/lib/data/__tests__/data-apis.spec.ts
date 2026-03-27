import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadLegacyScripts, repoPath } from "../../__tests__/load-legacy-script.ts";

function createHass(sendMessagePromise = vi.fn(), callService = vi.fn()) {
  return {
    connection: {
      sendMessagePromise,
    },
    callService,
  };
}

describe("data api libs", () => {
  let withStableRangeCache;
  let normalizeCacheIdList;
  let clearStableRangeCacheMatching;

  beforeEach(() => {
    const cacheLib = loadLegacyScripts(
      [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "cache.js")],
      ["withStableRangeCache", "normalizeCacheIdList", "clearStableRangeCacheMatching"],
    );
    withStableRangeCache = cacheLib.withStableRangeCache;
    normalizeCacheIdList = cacheLib.normalizeCacheIdList;
    clearStableRangeCacheMatching = cacheLib.clearStableRangeCacheMatching;
  });

  describe("GIVEN history request inputs", () => {
    describe("WHEN fetchHistoryDuringPeriod is called", () => {
      it("THEN it shapes a normalized websocket request", async () => {
        expect.assertions(2);
        const sendMessagePromise = vi.fn(async (payload) => payload);
        const hass = createHass(sendMessagePromise);
        const historyApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "history-api.js")],
          ["fetchHistoryDuringPeriod"],
          { withStableRangeCache, normalizeCacheIdList },
        );

        const result = await historyApi.fetchHistoryDuringPeriod(hass, "start", "end", ["sensor.b", "sensor.a"], {
          include_start_time_state: false,
          significant_changes_only: true,
          no_attributes: false,
        });

        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "history/history_during_period",
          start_time: "start",
          end_time: "end",
          entity_ids: ["sensor.a", "sensor.b"],
          include_start_time_state: false,
          significant_changes_only: true,
          no_attributes: false,
        });
        expect(result.entity_ids).toEqual(["sensor.a", "sensor.b"]);
      });
    });
  });

  describe("GIVEN statistics request inputs", () => {
    describe("WHEN fetchStatisticsDuringPeriod is called", () => {
      it("THEN it normalizes ids and types", async () => {
        expect.assertions(2);
        const sendMessagePromise = vi.fn(async (payload) => payload);
        const hass = createHass(sendMessagePromise);
        const statisticsApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "statistics-api.js")],
          ["fetchStatisticsDuringPeriod"],
          { withStableRangeCache, normalizeCacheIdList },
        );

        const result = await statisticsApi.fetchStatisticsDuringPeriod(hass, "start", "end", ["b", "a", "a"], {
          types: ["sum", "mean", "mean"],
          units: { a: "%" },
        });

        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "recorder/statistics_during_period",
          start_time: "start",
          end_time: "end",
          statistic_ids: ["a", "b"],
          period: "hour",
          types: ["mean", "sum"],
          units: { a: "%" },
        });
        expect(result.statistic_ids).toEqual(["a", "b"]);
      });
    });
  });

  describe("GIVEN a successful event request", () => {
    describe("WHEN fetchEvents is called", () => {
      it("THEN it returns the events payload", async () => {
        expect.assertions(2);
        const sendMessagePromise = vi.fn(async () => ({ events: [{ id: "evt-1" }] }));
        const hass = createHass(sendMessagePromise);
        const eventsApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "events-api.js")],
          ["fetchEvents", "fetchEventBounds", "deleteEvent", "updateEvent"],
          {
            withStableRangeCache,
            normalizeCacheIdList,
            DOMAIN: "hass_datapoints",
            console: { warn: vi.fn() },
          },
        );

        const result = await eventsApi.fetchEvents(hass, "start", "end", ["sensor.b", "sensor.a"]);

        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/events",
          start_time: "start",
          end_time: "end",
          entity_ids: ["sensor.a", "sensor.b"],
        });
        expect(result).toEqual([{ id: "evt-1" }]);
      });
    });
  });

  describe("GIVEN an event request failure", () => {
    describe("WHEN fetchEvents is called", () => {
      it("THEN it returns an empty array", async () => {
        expect.assertions(2);
        const warn = vi.fn();
        const sendMessagePromise = vi.fn(async () => {
          throw new Error("boom");
        });
        const hass = createHass(sendMessagePromise);
        const eventsApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "events-api.js")],
          ["fetchEvents"],
          {
            withStableRangeCache,
            normalizeCacheIdList,
            DOMAIN: "hass_datapoints",
            console: { warn },
          },
        );

        const result = await eventsApi.fetchEvents(hass, "start", "end", []);

        expect(result).toEqual([]);
        expect(warn).toHaveBeenCalled();
      });
    });
  });

  describe("GIVEN event bounds and mutation requests", () => {
    describe("WHEN the event helpers are called", () => {
      it("THEN they shape the expected websocket payloads", async () => {
        expect.assertions(3);
        const sendMessagePromise = vi.fn(async (payload) => {
          if (payload.type === "hass_datapoints/events_bounds") {
            return { start_time: "2026-01-01T00:00:00Z", end_time: "2026-02-01T00:00:00Z" };
          }
          return payload;
        });
        const hass = createHass(sendMessagePromise);
        const eventsApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "events-api.js")],
          ["fetchEventBounds", "deleteEvent", "updateEvent"],
          {
            withStableRangeCache,
            normalizeCacheIdList,
            clearStableRangeCacheMatching,
            DOMAIN: "hass_datapoints",
            console: { warn: vi.fn() },
            window: { dispatchEvent: vi.fn() },
          },
        );

        await expect(eventsApi.fetchEventBounds(hass)).resolves.toEqual({
          start: "2026-01-01T00:00:00Z",
          end: "2026-02-01T00:00:00Z",
        });
        await eventsApi.deleteEvent(hass, "evt-1");
        await eventsApi.updateEvent(hass, "evt-1", { message: "Updated" });

        expect(sendMessagePromise).toHaveBeenNthCalledWith(2, {
          type: "hass_datapoints/events/delete",
          event_id: "evt-1",
        });
        expect(sendMessagePromise).toHaveBeenNthCalledWith(3, {
          type: "hass_datapoints/events/update",
          event_id: "evt-1",
          message: "Updated",
        });
      });
    });
  });

  describe("GIVEN frontend user-data requests", () => {
    describe("WHEN the preferences helpers are called", () => {
      it("THEN they read, write, and fall back correctly", async () => {
        expect.assertions(5);
        const warn = vi.fn();
        const sendMessagePromise = vi.fn(async (payload) => {
          if (payload.type === "frontend/get_user_data") {
            return { value: { theme: "dark" } };
          }
          return {};
        });
        const hass = createHass(sendMessagePromise);
        const preferencesApi = loadLegacyScripts(
          [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "preferences-api.js")],
          ["fetchUserData", "saveUserData"],
          { console: { warn } },
        );

        await expect(preferencesApi.fetchUserData(hass, "key", null)).resolves.toEqual({ theme: "dark" });
        await preferencesApi.saveUserData(hass, "key", { theme: "light" });

        expect(sendMessagePromise).toHaveBeenNthCalledWith(1, {
          type: "frontend/get_user_data",
          key: "key",
        });
        expect(sendMessagePromise).toHaveBeenNthCalledWith(2, {
          type: "frontend/set_user_data",
          key: "key",
          value: { theme: "light" },
        });

        sendMessagePromise.mockImplementationOnce(async () => {
          throw new Error("nope");
        });
        await expect(preferencesApi.fetchUserData(hass, "missing", "fallback")).resolves.toBe("fallback");
        expect(warn).toHaveBeenCalled();
      });
    });
  });
});
