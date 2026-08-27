// ============================================================
// HAND SIMULATION WORKER BRIDGE
// ============================================================

let _worker = null;
let _callId = 0;
const _pending = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('../workers/handSimulationWorker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const { type, callId, data, done, total, message } = e.data;
      const pending = _pending.get(callId);
      if (!pending) return;
      if (type === 'PROGRESS') { pending.onProgress?.(done, total); return; }
      if (type === 'RESULT') { _pending.delete(callId); pending.resolve(data); return; }
      if (type === 'ERROR') { _pending.delete(callId); pending.reject(new Error(message)); return; }
    };
    _worker.onerror = (err) => {
      for (const p of _pending.values()) p.reject(err);
      _pending.clear();
      _worker = null;
    };
  }
  return _worker;
}

function callWorker(type, params, onProgress) {
  const callId = ++_callId;
  const worker = getWorker();
  return new Promise((resolve, reject) => {
    _pending.set(callId, { resolve, reject, onProgress });
    worker.postMessage({ type, payload: { ...params, callId } });
  });
}

// Starts a brand new simulation — generates fresh random rounds.
export function runHandSimulationRun(params, onProgress) {
  return callWorker('RUN', params, onProgress);
}

// Re-scores the EXISTING simulated rounds with new bets / % Paid tables.
export function runHandSimulationRecalculate(params, onProgress) {
  return callWorker('RECALCULATE', params, onProgress);
}

export function clearHandSimulationBuffer() {
  return callWorker('CLEAR', {});
}

// Exports up to 100,000 rounds of the current simulation buffer, re-scored with current bets/% Paid.
export function runHandSimulationExport(params, onProgress) {
  return callWorker('EXPORT', params, onProgress);
}