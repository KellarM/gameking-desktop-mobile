// ============================================================
// WORKER BRIDGE — OPPOSITE DECK — Persistent Audit Worker
// Mirrors workerBridge.js but talks to auditWorkerOpposite.js so
// baseline and opposite audits run on fully independent workers/buffers.
// ============================================================

let _persistentWorker = null;
let _callId = 0;
const _pendingCalls = new Map();

function getPersistentWorker() {
  if (!_persistentWorker) {
    _persistentWorker = new Worker(
      new URL('../workers/auditWorkerOpposite.js', import.meta.url),
      { type: 'module' }
    );
    _persistentWorker.onmessage = (e) => {
      const { type, callId, data, done, total, chunk, message } = e.data;
      const pending = callId !== undefined ? _pendingCalls.get(callId) : null;

      if (type === 'PROGRESS') {
        if (pending?.onProgress) {
          const pct = (total > 0) ? done / total : 0;
          pending.onProgress(pct, done, total);
        }
        return;
      }

      if (type === 'CHECKPOINT') {
        if (pending?.onCheckpoint) {
          pending.onCheckpoint(e.data.checkpointAt, e.data.data);
        }
        return;
      }

      if (type === 'EXPORT_CHUNK') {
        if (pending?.onChunk) pending.onChunk(chunk);
        return;
      }

      if (type === 'RESULT' || type === 'MICROSCOPE_RESULT' || type === 'EXPORT_DONE') {
        if (pending) {
          _pendingCalls.delete(callId);
          pending.resolve(data ?? e.data);
        }
        return;
      }

      if (type === 'ERROR') {
        if (pending) {
          _pendingCalls.delete(callId);
          pending.reject(new Error(message));
        }
        return;
      }
    };
    _persistentWorker.onerror = (err) => {
      for (const [id, pending] of _pendingCalls) {
        pending.reject(err);
      }
      _pendingCalls.clear();
      _persistentWorker = null;
    };
  }
  return _persistentWorker;
}

export function resetPersistentWorker() {
  if (_persistentWorker) {
    _persistentWorker.terminate();
    _persistentWorker = null;
  }
  for (const pending of _pendingCalls.values()) {
    pending.reject(new Error('Worker reset'));
  }
  _pendingCalls.clear();
}

export function runBetAuditInWorker(params, onProgress) {
  const callId = ++_callId;
  const worker = getPersistentWorker();
  return new Promise((resolve, reject) => {
    _pendingCalls.set(callId, { resolve, reject, onProgress });
    worker.postMessage({ type: 'RUN', payload: { ...params, callId }, callId });
  });
}

export function runBetAuditWithAbort(params, onProgress, onCheckpoint) {
  const callId = ++_callId;
  const worker = getPersistentWorker();
  let aborted = false;

  const promise = new Promise((resolve, reject) => {
    _pendingCalls.set(callId, { resolve, reject, onProgress, onChunk: null, onCheckpoint: onCheckpoint || null });
    worker.postMessage({ type: 'RUN', payload: { ...params, callId }, callId });
  });

  return {
    promise,
    abort() {
      if (!aborted) {
        aborted = true;
        const pending = _pendingCalls.get(callId);
        if (pending) {
          _pendingCalls.delete(callId);
          pending.reject(new Error('Aborted'));
        }
        resetPersistentWorker();
      }
    },
  };
}

export function runMicroscopeWithAbort(params) {
  const callId = ++_callId;
  const worker = getPersistentWorker();
  let aborted = false;

  const promise = new Promise((resolve, reject) => {
    _pendingCalls.set(callId, { resolve, reject, onProgress: null, onChunk: null });
    worker.postMessage({ type: 'RUN_MICROSCOPE', payload: { ...params, callId }, callId });
  });

  return {
    promise,
    abort() {
      if (!aborted) {
        aborted = true;
        const pending = _pendingCalls.get(callId);
        if (pending) {
          _pendingCalls.delete(callId);
          pending.reject(new Error('Aborted'));
        }
      }
    },
  };
}

export function runExportWithAbort(params, onChunk, onProgress) {
  const callId = ++_callId;
  const worker = getPersistentWorker();
  let aborted = false;

  const promise = new Promise((resolve, reject) => {
    _pendingCalls.set(callId, {
      resolve,
      reject,
      onProgress: onProgress ? (pct) => onProgress(pct) : null,
      onChunk: onChunk ? (chunk) => onChunk(chunk) : null,
    });
    worker.postMessage({
      type: 'RUN_EXPORT',
      payload: { ...params, callId },
      callId,
    });
  });

  return {
    promise,
    abort() {
      if (!aborted) {
        aborted = true;
        const pending = _pendingCalls.get(callId);
        if (pending) {
          _pendingCalls.delete(callId);
          pending.reject(new Error('Aborted'));
        }
      }
    },
  };
}