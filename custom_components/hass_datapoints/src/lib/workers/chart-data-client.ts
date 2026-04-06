import ChartDataWorker from "@/lib/workers/chart-data.worker.ts?worker&inline";
import type { ChartAggregate, ChartPoint } from "@/lib/workers/chart-data.worker";

interface WorkerHandlers<T> {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

interface ChartDataWorkerMessage<T> {
  id?: number;
  result?: T;
  error?: string;
}

let workerInstance: Nullable<Worker> = null;
let requestId = 0;
const pending = new Map<number, WorkerHandlers<ChartPoint[]>>();

function getChartDataWorker(): Worker {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new ChartDataWorker();
  workerInstance.addEventListener("message", (event: MessageEvent<ChartDataWorkerMessage<ChartPoint[]>>) => {
    const { id, result, error } = event.data || {};
    const handlers = pending.get(id || -1);
    if (!handlers) {
      return;
    }
    pending.delete(id || -1);
    if (error) {
      handlers.reject(new Error(error));
    } else {
      handlers.resolve(result || []);
    }
  });
  workerInstance.addEventListener("error", (err) => {
    pending.forEach(({ reject }) => {
      reject(err);
    });
    pending.clear();
    workerInstance = null;
  });
  return workerInstance;
}

/**
 * Downsample [[timeMs, value], ...] pts in a worker.
 * Returns a Promise that resolves with the downsampled pts array.
 */
export function downsampleInWorker(
  pts: ChartPoint[],
  intervalMs: number,
  aggregate: ChartAggregate
): Promise<ChartPoint[]> {
  const worker = getChartDataWorker();
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: "downsample",
      payload: { pts, intervalMs, aggregate },
    });
  });
}
