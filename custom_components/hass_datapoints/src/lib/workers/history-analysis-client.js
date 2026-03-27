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
    const { id, result, error } = event.data || {};
    const handlers = pending.get(id);
    if (!handlers) {
      return;
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

export function computeHistoryAnalysisInWorker(payload) {
  const worker = getHistoryAnalysisWorker();
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, payload });
  });
}
