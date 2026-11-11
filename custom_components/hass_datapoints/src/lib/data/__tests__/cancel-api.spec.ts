import { beforeEach, describe, expect, it, vi } from "vitest";

// Re-import the module fresh before each test so the module-level Map is reset.
// vitest's module registry is shared; we isolate by using vi.resetModules().
beforeEach(() => {
  vi.resetModules();
});

describe("cancel-api", () => {
  describe("GIVEN a tracked in-flight request", () => {
    describe("WHEN cancelPending is called for that slot", () => {
      it("THEN sends a cancel message with the tracked request_id", async () => {
        const { trackRequest, cancelPending } =
          await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        trackRequest("slot:a", "req-uuid-1");
        cancelPending(hass, "slot:a");

        expect(sendMessagePromise).toHaveBeenCalledOnce();
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/cancel",
          request_id: "req-uuid-1",
        });
      });

      it("THEN removes the slot from the in-flight map so a second cancel is no-op", async () => {
        const { trackRequest, cancelPending } =
          await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        trackRequest("slot:b", "req-uuid-2");
        cancelPending(hass, "slot:b");
        cancelPending(hass, "slot:b"); // second call — nothing tracked

        expect(sendMessagePromise).toHaveBeenCalledOnce();
      });
    });

    describe("WHEN cancelPending is called for an unknown slot", () => {
      it("THEN does not send any message", async () => {
        const { cancelPending } = await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        cancelPending(hass, "slot:nonexistent");

        expect(sendMessagePromise).not.toHaveBeenCalled();
      });
    });

    describe("WHEN clearRequest is called", () => {
      it("THEN removes the slot so subsequent cancelPending is a no-op", async () => {
        const { trackRequest, cancelPending, clearRequest } =
          await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        trackRequest("slot:c", "req-uuid-3");
        clearRequest("slot:c");
        cancelPending(hass, "slot:c");

        expect(sendMessagePromise).not.toHaveBeenCalled();
      });
    });

    describe("WHEN multiple slots are tracked", () => {
      it("THEN each slot is cancelled independently", async () => {
        const { trackRequest, cancelPending } =
          await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        trackRequest("slot:x", "req-x");
        trackRequest("slot:y", "req-y");
        cancelPending(hass, "slot:x");

        expect(sendMessagePromise).toHaveBeenCalledOnce();
        expect(sendMessagePromise).toHaveBeenCalledWith(
          expect.objectContaining({ request_id: "req-x" })
        );

        // slot:y still tracked — cancel it
        cancelPending(hass, "slot:y");
        expect(sendMessagePromise).toHaveBeenCalledTimes(2);
        expect(sendMessagePromise).toHaveBeenLastCalledWith(
          expect.objectContaining({ request_id: "req-y" })
        );
      });
    });
  });

  describe("GIVEN owned request slots", () => {
    describe("WHEN a slot starts a new generation", () => {
      it("THEN only that slot's previous request is cancelled", async () => {
        expect.assertions(5);
        const { beginOwnedRequest } = await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };

        const chartA = beginOwnedRequest(hass, "chart#1:anomalies:primary:s.a");
        const chartB = beginOwnedRequest(hass, "chart#2:anomalies:primary:s.a");
        const chartANext = beginOwnedRequest(
          hass,
          "chart#1:anomalies:primary:s.a"
        );

        expect(sendMessagePromise).toHaveBeenCalledTimes(1);
        expect(sendMessagePromise).toHaveBeenCalledWith({
          type: "hass_datapoints/cancel",
          request_id: chartA.requestId,
        });
        expect(chartA.isCurrent()).toBe(false);
        expect(chartB.isCurrent()).toBe(true);
        expect(chartANext.isCurrent()).toBe(true);
      });
    });

    describe("WHEN an old generation releases late", () => {
      it("THEN the newer generation stays registered", async () => {
        expect.assertions(1);
        const { beginOwnedRequest } = await import("@/lib/data/cancel-api");
        const hass = {
          connection: {
            sendMessagePromise: vi.fn().mockResolvedValue(undefined),
          },
        };
        const old = beginOwnedRequest(hass, "slot");
        const next = beginOwnedRequest(hass, "slot");

        old.release();

        expect(next.isCurrent()).toBe(true);
      });
    });

    describe("WHEN an owner is cancelled on disconnect", () => {
      it("THEN only its own slots are cancelled", async () => {
        expect.assertions(2);
        const { beginOwnedRequest, cancelOwnedRequests } =
          await import("@/lib/data/cancel-api");
        const sendMessagePromise = vi.fn().mockResolvedValue(undefined);
        const hass = { connection: { sendMessagePromise } };
        const mine = beginOwnedRequest(hass, "chart#1:anomalies:primary:s.a");
        const comparison = beginOwnedRequest(
          hass,
          "chart#1:anomalies:comparison:w1:s.a"
        );
        const other = beginOwnedRequest(hass, "chart#12:anomalies:primary:s.a");

        cancelOwnedRequests(hass, "chart#1");

        expect(
          sendMessagePromise.mock.calls.map(([m]) => m.request_id).sort()
        ).toEqual([mine.requestId, comparison.requestId].sort());
        expect(other.isCurrent()).toBe(true);
      });
    });
  });
});
