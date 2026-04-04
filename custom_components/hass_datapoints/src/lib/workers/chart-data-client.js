import ChartDataWorker from "@/lib/workers/chart-data.worker.js?worker&inline";

let workerInstance = null;
let requestId = 0;
const pending = new Map();

function getChartDataWorker() {
  if (workerInstance) return workerInstance;
  workerInstance = new ChartDataWorker();
  workerInstance.addEventListener("message", (event) => {
    const { id, result, error } = event.data || {};
    const handlers = pending.get(id);
    if (!handlers) return;
    pending.delete(id);
    if (error) {
      handlers.reject(new Error(error));
    } else {
      handlers.resolve(result);
    }
  });
  workerInstance.addEventListener("error", (err) => {
    pending.forEach(({ reject }) => reject(err));
    pending.clear();
    workerInstance = null;
  });
  return workerInstance;
}

/**
 * Downsample [[timeMs, value], ...] pts in a worker.
 * Returns a Promise that resolves with the downsampled pts array.
 */
export function downsampleInWorker(pts, intervalMs, aggregate) {
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
