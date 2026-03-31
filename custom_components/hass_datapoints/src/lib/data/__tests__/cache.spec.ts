import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadLegacyScripts, repoPath } from "@/lib/__tests__/load-legacy-script";

let cacheLib;

describe("cache lib", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00Z"));
    cacheLib = loadLegacyScripts(
      [repoPath("custom_components", "hass_datapoints", "src", "lib", "data", "cache.js")],
      [
        "normalizeCacheIdList",
        "shouldUseStableRangeCache",
        "getCachedRangePromise",
        "setCachedRangePromise",
        "withStableRangeCache",
      ],
    );
  });

  describe("GIVEN duplicate cache ids", () => {
    describe("WHEN normalizeCacheIdList is called", () => {
      it("THEN it returns a sorted unique list", () => {
        expect.assertions(1);
        expect(cacheLib.normalizeCacheIdList(["b", "a", "b", "", null])).toEqual(["a", "b"]);
      });
    });
  });

  describe("GIVEN an end time outside the live edge", () => {
    describe("WHEN shouldUseStableRangeCache is called", () => {
      it("THEN it returns true", () => {
        expect.assertions(1);
        expect(cacheLib.shouldUseStableRangeCache("2026-03-30T11:00:00Z")).toBe(true);
      });
    });
  });

  describe("GIVEN an invalid or recent end time", () => {
    describe("WHEN shouldUseStableRangeCache is called", () => {
      it("THEN it returns false", () => {
        expect.assertions(2);
        expect(cacheLib.shouldUseStableRangeCache("invalid")).toBe(false);
        expect(cacheLib.shouldUseStableRangeCache("2026-03-30T11:58:00Z")).toBe(false);
      });
    });
  });

  describe("GIVEN a cached promise", () => {
    describe("WHEN getCachedRangePromise is called before expiry", () => {
      it("THEN it returns that promise", async () => {
        expect.assertions(1);
        const promise = Promise.resolve("value");
        cacheLib.setCachedRangePromise("key-1", promise);

        await expect(cacheLib.getCachedRangePromise("key-1")).resolves.toBe("value");
      });
    });
  });

  describe("GIVEN an expired cached promise", () => {
    describe("WHEN getCachedRangePromise is called", () => {
      it("THEN it returns null", () => {
        expect.assertions(1);
        cacheLib.setCachedRangePromise("key-2", Promise.resolve("value"));
        vi.advanceTimersByTime(10 * 60 * 1000 + 1);

        expect(cacheLib.getCachedRangePromise("key-2")).toBeNull();
      });
    });
  });

  describe("GIVEN a stable range", () => {
    describe("WHEN withStableRangeCache is called twice", () => {
      it("THEN it reuses the cached loader result", async () => {
        expect.assertions(3);
        const loader = vi.fn(async () => "cached");

        const first = await cacheLib.withStableRangeCache("stable-key", "2026-03-30T11:00:00Z", loader);
        const second = await cacheLib.withStableRangeCache("stable-key", "2026-03-30T11:00:00Z", loader);

        expect(first).toBe("cached");
        expect(second).toBe("cached");
        expect(loader).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("GIVEN a live-edge range", () => {
    describe("WHEN withStableRangeCache is called twice", () => {
      it("THEN it bypasses the cache", async () => {
        expect.assertions(1);
        const loader = vi.fn(async () => "live");

        await cacheLib.withStableRangeCache("live-key", "2026-03-30T11:59:00Z", loader);
        await cacheLib.withStableRangeCache("live-key", "2026-03-30T11:59:00Z", loader);

        expect(loader).toHaveBeenCalledTimes(2);
      });
    });
  });
});
