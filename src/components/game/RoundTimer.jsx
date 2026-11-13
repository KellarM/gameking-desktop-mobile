import { useState, useEffect } from 'react';

/**
 * RoundTimer — live round clock for the desktop bottom bar.
 *
 * Starts on the first bet of the betting phase, runs through flop / turn / river,
 * freezes when the round resolves (winner phase) and resets on the next round.
 * Purely a display: it never affects game flow or timing.
 *
 * Tracking runs even while the clock is switched off, so switching it on mid-round
 * still shows the correct elapsed time.
 */
export default function RoundTimer({ enabled, roundId, gamePhase, totalBet }) {
  const [startedAt, setStartedAt] = useState(null);
  const [stoppedAt, setStoppedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  // New round → clear
  useEffect(() => {
    setStartedAt(null);
    setStoppedAt(null);
    setElapsed(0);
  }, [roundId]);

  // First bet placed → start
  useEffect(() => {
    if (startedAt === null && gamePhase === 'betting' && totalBet > 0) {
      setStartedAt(Date.now());
    }
  }, [gamePhase, totalBet, startedAt]);

  // Round resolved → freeze
  useEffect(() => {
    if (startedAt !== null && stoppedAt === null && gamePhase === 'winner') {
      setStoppedAt(Date.now());
    }
  }, [gamePhase, startedAt, stoppedAt]);

  // Tick (only while visible)
  useEffect(() => {
    if (!enabled || startedAt === null) return;
    if (stoppedAt !== null) {
      setElapsed(stoppedAt - startedAt);
      return;
    }
    setElapsed(Date.now() - startedAt);
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 50);
    return () => clearInterval(id);
  }, [enabled, startedAt, stoppedAt]);

  if (!enabled) return null;

  return (
    <div className="flex flex-col items-center">
      <span className="text-yellow-400/80 text-[10px] font-bold leading-none tracking-widest uppercase mb-0.5">Round Timer</span>
      <div className="flex items-center justify-center px-4 py-2 rounded-xl border-2 border-yellow-500 bg-black" style={{ minWidth: '110px' }}>
        <span className="text-yellow-400 font-black text-lg leading-none tracking-tight tabular-nums" style={{ textShadow: '0 0 8px rgba(251,191,36,0.7)' }}>
          {(elapsed / 1000).toFixed(2)}s
        </span>
      </div>
    </div>
  );
}