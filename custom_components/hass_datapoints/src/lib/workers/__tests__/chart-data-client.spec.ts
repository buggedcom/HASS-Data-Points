import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockWorkerInstance {
  postMessage: ReturnType<typeof vi.fn>;
  addEventListener(type: string, handler: (event: unknown) => void): void;
  emit(type: string, event: unknown): void;
}

let currentMockWorker: MockWorkerInstance | null = null;

function MockChartDataWorker(this: unknown): MockWorkerInstance {
  const listeners: Record<string, Array<(event: unknown) => void>> = {};
  const instance: MockWorkerInstance = {
    postMessage: vi.fn(),
    addEventListener(type: string, handler: (event: unknown) => void) {
      (listeners[type] ??= []).push(handler);
    },
    emit(type: string, event: unknown) {
      listeners[type]?.forEach((listener) => listener(event));
    },
  };
  currentMockWorker = instance;
  return instance;
}

vi.mock("@/lib/workers/chart-data.worker.js?worker&inline", () => ({
  default: MockChartDataWorker,
}));

beforeEach(() => {
  vi.resetModules();
  currentMockWorker = null;
});

describe("chart-data-client.js", () => {
  describe("GIVEN a downsample request", () => {
    describe("WHEN the worker responds successfully", () => {
      it("THEN the promise resolves with the worker result", async () => {
        expect.assertions(2);
        const { downsampleInWorker } =
          await import("@/lib/workers/chart-data-client.js");

        const promise = downsampleInWorker(
          [
            [0, 1],
            [1000, 2],
          ],
          1000,
          "mean"
        );
        const id = currentMockWorker!.postMessage.mock.calls[0][0].id;

        currentMockWorker!.emit("message", {
          data: { id, result: [[0, 1.5]] },
        });

        await expect(promise).resolves.toEqual([[0, 1.5]]);
        expect(currentMockWorker!.postMessage).toHaveBeenCalledWith({
          id,
          type: "downsample",
          payload: {
            pts: [
              [0, 1],
              [1000, 2],
            ],
            intervalMs: 1000,
            aggregate: "mean",
          },
        });
      });
    });
  });

  describe("GIVEN a downsample request", () => {
    describe("WHEN the worker responds with an error field", () => {
      it("THEN the promise rejects with an Error", async () => {
        expect.assertions(1);
        const { downsampleInWorker } =
          await import("@/lib/workers/chart-data-client.js");

        const promise = downsampleInWorker([[0, 1]], 1000, "mean");
        const id = currentMockWorker!.postMessage.mock.calls[0][0].id;

        currentMockWorker!.emit("message", {
          data: { id, error: "bad worker" },
        });

        await expect(promise).rejects.toThrow("bad worker");
      });
    });
  });
});
