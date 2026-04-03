import HistoryAnalysisWorker from "./history-analysis.worker.js?worker&inline";

let workerInstance = null;
let requestId = 0;
const pending = new Map();

function getHistoryAnalysisWorker() {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new HistoryAnalysisWorker();
  workerInstance.addEventListener("message", (event) => {
    const { id, type, value, result, error, entityId, method, clusters } = event.data || {};
    const handlers = pending.get(id);
    if (!handlers) {
      return;
    }
    if (type === "progress") {
      console.log(`[analysis-client] progress ${value}%`);
      handlers.onProgress?.(value);
      return; // intermediate message — keep the request in the pending map
    }
    if (type === "anomaly-partial") {
      console.log(`[analysis-client] anomaly-partial: ${method} for ${entityId} → ${clusters?.length ?? 0} cluster(s)`);
      handlers.onAnomalyPartial?.(entityId, method, clusters);
      return; // intermediate message — keep the request in the pending map
    }
    pending.delete(id);
    if (error) {
      handlers.reject(new Error(error));
      return;
    }
    handlers.resolve(result);
  });
  workerInstance.addEventListener("error", (error) => {
    pending.forEach((handlers) => {
      handlers.reject(error);
    });
    pending.clear();
    workerInstance = null;
  });
  return workerInstance;
}

/**
 * Abort all in-flight analysis requests and terminate the worker.
 * Called when a new draw request supersedes an in-progress one so the worker
 * is not left computing a result that will be thrown away.
 */
export function terminateHistoryAnalysisWorker() {
  if (pending.size > 0) {
    pending.forEach(({ reject }) => {
      reject(new Error("Aborted: superseded by newer analysis"));
    });
    pending.clear();
  }
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

export function computeHistoryAnalysisInWorker(payload, options = {}) {
  const worker = getHistoryAnalysisWorker();
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, {
      resolve,
      reject,
      onProgress: options.onProgress ?? null,
      onAnomalyPartial: options.onAnomalyPartial ?? null,
    });
    worker.postMessage({ id, payload });
  });
}
