import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_TIMING = {
  bettingClose: 14,
  flopReveal: 8,
  turnReveal: 2,
  riverBetting: 14,
  riverReveal: 5,
  endOfRound: 14,
  dealerMode: true, // default: Dealer Button mode (safe)
  mobileLayout: 'A', // default: Layout A (current mobile portrait arrangement)
  desktopLayout: '1', // default: Layout 1 (original desktop arrangement)
  suitVariation: true, // default: ON — matches game behavior since launch
  positionRotation: true, // default: ON — matches game behavior since launch
};

const DEALER_MODE_KEY = 'rfth_dealerMode';
const MOBILE_LAYOUT_KEY = 'rfth_mobileLayout';
const DESKTOP_LAYOUT_KEY = 'rfth_desktop_layout';
const SUIT_VARIATION_KEY = 'rfth_suitVariation';
const POSITION_ROTATION_KEY = 'rfth_positionRotation';

function readLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch { return fallback; }
}

function readLocalBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch { return fallback; }
}

function writeLocal(key, v) {
  try { localStorage.setItem(key, typeof v === 'boolean' ? String(v) : v); } catch {}
}

export function useGameTiming() {
  const [timing, setTiming] = useState(DEFAULT_TIMING);
  const [recordId, setRecordId] = useState(null);
  const timerRef = useRef(null);

  // All settings start from localStorage for instant render with no flash
  const [dealerMode, setDealerModeState] = useState(() => readLocalBool(DEALER_MODE_KEY, true));
  const [mobileLayout, setMobileLayoutState] = useState(() => readLocal(MOBILE_LAYOUT_KEY, 'A'));
  const [desktopLayout, setDesktopLayoutState] = useState(() => readLocal(DESKTOP_LAYOUT_KEY, '1'));
  const [suitVariation, setSuitVariationState] = useState(() => readLocalBool(SUIT_VARIATION_KEY, true));
  const [positionRotation, setPositionRotationState] = useState(() => readLocalBool(POSITION_ROTATION_KEY, true));

  const pendingRef = useRef({}); // stash values set before recordId is ready

  // Load from DB on mount — but DON'T overwrite localStorage values that are already set.
  // localStorage is the most recent change on this device; DB may be stale if a previous write failed.
  useEffect(() => {
    base44.entities.GameTiming.list().then(records => {
      if (records && records.length > 0) {
        const rec = records[0];
        setRecordId(rec.id);
        setTiming({ ...DEFAULT_TIMING, ...rec });

        // For each setting: only update from DB if localStorage doesn't already have a user-set value.
        // This prevents stale DB data from clobbering a change the user just made.

        if (rec.dealerMode !== undefined && rec.dealerMode !== null) {
          const localDealer = readLocalBool(DEALER_MODE_KEY, null);
          if (localDealer === null) {
            // First visit — no localStorage value yet, use DB
            setDealerModeState(!!rec.dealerMode);
            writeLocal(DEALER_MODE_KEY, !!rec.dealerMode);
          }
        }

        if (rec.mobileLayout) {
          const localMobile = readLocal(MOBILE_LAYOUT_KEY, null);
          if (localMobile === null) {
            setMobileLayoutState(rec.mobileLayout);
            writeLocal(MOBILE_LAYOUT_KEY, rec.mobileLayout);
          }
        }

        if (rec.desktopLayout) {
          const localDesktop = readLocal(DESKTOP_LAYOUT_KEY, null);
          if (localDesktop === null) {
            setDesktopLayoutState(rec.desktopLayout);
            writeLocal(DESKTOP_LAYOUT_KEY, rec.desktopLayout);
          }
        }

        if (rec.suitVariation !== undefined && rec.suitVariation !== null) {
          const localSuit = readLocalBool(SUIT_VARIATION_KEY, null);
          if (localSuit === null) {
            setSuitVariationState(!!rec.suitVariation);
            writeLocal(SUIT_VARIATION_KEY, !!rec.suitVariation);
          }
        }

        if (rec.positionRotation !== undefined && rec.positionRotation !== null) {
          const localPos = readLocalBool(POSITION_ROTATION_KEY, null);
          if (localPos === null) {
            setPositionRotationState(!!rec.positionRotation);
            writeLocal(POSITION_ROTATION_KEY, !!rec.positionRotation);
          }
        }

        // Flush any pending writes (values set before recordId was ready)
        const pending = pendingRef.current;
        if (Object.keys(pending).length > 0 && rec.id) {
          pendingRef.current = {};
          base44.entities.GameTiming.update(rec.id, pending).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  // Listen for timing updates saved from GameTimingModal
  // NOTE: This reloads TIMING fields only. It must NOT overwrite layout/control settings,
  // because those are managed independently and a timing save could race with a setting change.
  const reloadTiming = useCallback(() => {
    base44.entities.GameTiming.list().then(records => {
      if (records && records.length > 0) {
        const rec = records[0];
        setRecordId(rec.id);
        setTiming({ ...DEFAULT_TIMING, ...rec });
        // Deliberately NOT touching layout/control settings here
      }
    }).catch(() => {});
  }, []);

  const startTimer = useCallback((duration, onTick, onComplete) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let remaining = duration;
    onTick(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 0.1;
      onTick(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        onComplete?.();
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Generic setter factory — writes to localStorage (instant) + DB (backup)
  const makeSetter = useCallback((key, stateSetter, dbField) => {
    return (v) => {
      stateSetter(v);
      writeLocal(key, v);
      const payload = { [dbField]: v };
      if (recordId) {
        base44.entities.GameTiming.update(recordId, payload).catch(() => {});
      } else {
        // recordId not loaded yet — stash and persist when DB loads
        pendingRef.current = { ...pendingRef.current, ...payload };
      }
    };
  }, [recordId]);

  const setDealerMode = useCallback((v) => {
    setDealerModeState(v);
    writeLocal(DEALER_MODE_KEY, v);
    if (recordId) {
      base44.entities.GameTiming.update(recordId, { dealerMode: v }).catch(() => {});
    } else {
      pendingRef.current = { ...pendingRef.current, dealerMode: v };
    }
  }, [recordId]);

  const setMobileLayout = useCallback((v) => {
    setMobileLayoutState(v);
    writeLocal(MOBILE_LAYOUT_KEY, v);
    if (recordId) {
      base44.entities.GameTiming.update(recordId, { mobileLayout: v }).catch(() => {});
    } else {
      pendingRef.current = { ...pendingRef.current, mobileLayout: v };
    }
  }, [recordId]);

  const setDesktopLayout = useCallback((v) => {
    setDesktopLayoutState(v);
    writeLocal(DESKTOP_LAYOUT_KEY, v);
    if (recordId) {
      base44.entities.GameTiming.update(recordId, { desktopLayout: v }).catch(() => {});
    } else {
      pendingRef.current = { ...pendingRef.current, desktopLayout: v };
    }
  }, [recordId]);

  const setSuitVariation = useCallback((v) => {
    setSuitVariationState(v);
    writeLocal(SUIT_VARIATION_KEY, v);
    if (recordId) {
      base44.entities.GameTiming.update(recordId, { suitVariation: v }).catch(() => {});
    } else {
      pendingRef.current = { ...pendingRef.current, suitVariation: v };
    }
  }, [recordId]);

  const setPositionRotation = useCallback((v) => {
    setPositionRotationState(v);
    writeLocal(POSITION_ROTATION_KEY, v);
    if (recordId) {
      base44.entities.GameTiming.update(recordId, { positionRotation: v }).catch(() => {});
    } else {
      pendingRef.current = { ...pendingRef.current, positionRotation: v };
    }
  }, [recordId]);

  return {
    timing, recordId,
    dealerMode, setDealerMode,
    mobileLayout, setMobileLayout,
    desktopLayout, setDesktopLayout,
    suitVariation, setSuitVariation,
    positionRotation, setPositionRotation,
    startTimer, stopTimer, reloadTiming
  };
}
