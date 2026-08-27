import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Chip from './Chip';
import { getRankOddsRange } from '@/lib/perHandRankPayouts';

export const RANK_BET_OPTIONS = [
  { key: 'Four of a Kind',  label: '4 Of A Kind'  },
  { key: 'Full House',      label: 'Full House'    },
  { key: 'Flush',           label: 'Flush'         },
  { key: 'Straight',        label: 'Straight'      },
  { key: 'Three of a Kind', label: '3 Of A Kind'   },
  { key: 'Two Pair',        label: '2 Pair'        },
  { key: 'One Pair',        label: '1 Pair'        },
];

// Odds range (lowest–highest across all 10 card hands) shown once the rank board unlocks
const RANK_ODDS_LABELS = Object.fromEntries(RANK_BET_OPTIONS.map(opt => {
  const range = getRankOddsRange(opt.key);
  return [opt.key, range ? `${range.min.toFixed(1)} - ${range.max.toFixed(1)} :1` : null];
}));

function useUnlockPulse(rankKey, unlockedRanks) {
  const [pulseActive, setPulseActive] = useState(false);
  const prevUnlocked = useRef(false);

  useEffect(() => {
    const nowUnlocked = unlockedRanks && unlockedRanks.has(rankKey);
    if (!prevUnlocked.current && nowUnlocked) {
      setPulseActive(true);
      const t = setTimeout(() => setPulseActive(false), 900);
      return () => clearTimeout(t);
    }
    prevUnlocked.current = !!nowUnlocked;
  }, [rankKey, unlockedRanks]);

  return pulseActive;
}

const CARDS_IMG = 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/427629ce8_cards_transparent.png';

function RankSlot({
  opt, rankBets, allRankBets, playerCount, canBet,
  isWinner, isLeading, isKillLocked, isSlotLocked,
  onRankBet, onRemoveRankBet, onMoveRankBet, gamePhase, unlockedRanks, killSwitchActive, rankLockThreshold = 1,
  noHandBets, activePlayerId, activeHandIds, oddsLabel,
  fontScale = 1, chipScale = 0.65,
}) {
  const bet = rankBets[opt.key] || 0;
  const unlockPulse = useUnlockPulse(opt.key, unlockedRanks);

  const hardLocked = noHandBets || isKillLocked;
  const fullyLocked = hardLocked || isSlotLocked;

  const chipsHere = [];
  for (let i = 0; i < (playerCount || 1); i++) {
    const amt = (allRankBets?.[i] || {})[opt.key] || 0;
    if (amt > 0) chipsHere.push({ pid: i, amt });
  }

  const goldBase = {
    background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,200,0.6), inset 0 -1px 2px rgba(100,60,0,0.5), 0 1px 4px rgba(0,0,0,0.5)',
  };
  const goldDim = {
    background: 'linear-gradient(135deg, #c9a820 0%, #b08a14 30%, #d4b830 55%, #8a6504 80%, #b08a14 100%)',
    boxShadow: 'inset 0 1px 2px rgba(200,170,80,0.3), inset 0 -1px 2px rgba(80,40,0,0.5)',
    opacity: 0.72,
  };
  const redVelvet = {
    background: 'linear-gradient(135deg, rgba(80,10,10,0.85) 0%, rgba(40,5,5,0.95) 100%)',
    boxShadow: 'inset 0 0 14px rgba(197,100,50,0.25)',
  };

  let slotCls, textColor, oddsColor, buttonStyle, showDarkLock;

  const isActive = isWinner || isLeading;
  if (isActive) {
    // Solid gold bg + black border + black bold text — consistent with hand card treatment
    slotCls = 'border-black shadow-xl';
    textColor = 'text-black';
    oddsColor = 'text-black';
    buttonStyle = {
      background: 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)',
      boxShadow: '0 0 16px rgba(255,200,50,0.7), inset 0 1px 2px rgba(255,255,200,0.6)',
    };
    showDarkLock = false;
  } else if (bet > 0) {
    slotCls = 'slot-border-active shadow-md cursor-pointer';
    textColor = 'text-yellow-100';
    oddsColor = 'text-yellow-400/90 text-halo';
    buttonStyle = redVelvet;
    showDarkLock = false;
  } else if (!fullyLocked && canBet) {
    slotCls = 'border-black cursor-pointer hover:brightness-110 transition-all';
    textColor = 'text-black';
    oddsColor = 'text-black';
    buttonStyle = goldBase;
    showDarkLock = false;
  } else if (fullyLocked) {
    slotCls = 'border-black';
    textColor = 'text-black/60';
    oddsColor = 'text-black/60';
    buttonStyle = goldDim;
    showDarkLock = false;
  } else {
    slotCls = 'border-black';
    textColor = 'text-black/50';
    oddsColor = 'text-black/50';
    buttonStyle = goldDim;
    showDarkLock = false;
  }

  const showOdds = isActive || bet > 0 || (!fullyLocked && canBet);

  return (
    <motion.button
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        // Ignore mousedown from a draggable chip — it's a drag, not a new bet
        if (e.target.closest('[data-chip]')) return;
        if (gamePhase === 'betting' && !fullyLocked) onRankBet(opt.key);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (gamePhase !== 'betting' || hardLocked) return;
        // Tap on chip = remove; tap elsewhere = add
        if (bet > 0 && e.target.closest('[data-chip]')) {
          onRemoveRankBet(opt.key);
        } else if (!fullyLocked) {
          onRankBet(opt.key);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (gamePhase === 'betting' && bet > 0) onRemoveRankBet(opt.key);
      }}
      onDragOver={(e) => {
        if (gamePhase === 'betting' && !hardLocked) { e.preventDefault(); e.stopPropagation(); }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gamePhase !== 'betting' || hardLocked) return;
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;
        try {
          const { from, type, pid: dragPid } = JSON.parse(data);
          if (type === 'rank' && from !== opt.key) {
            const amt = (allRankBets?.[dragPid] || {})[from] || 0;
            if (amt > 0 && onMoveRankBet) { onMoveRankBet(from, opt.key); }
          }
        } catch (_) {}
      }}
      whileTap={canBet && !fullyLocked ? { scale: 0.96 } : {}}
      style={{ ...buttonStyle, pointerEvents: hardLocked ? 'none' : 'auto', overflow: 'visible' }}
      className={`relative w-full h-full rounded-lg border transition-all duration-300
        ${slotCls}
        ${canBet && !fullyLocked ? 'lp-magnetic' : ''}
      `}
    >
      {/* Unlock gold pulse */}
      <AnimatePresence>
        {unlockPulse && (
          <motion.div
            initial={{ opacity: 0.85, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg pointer-events-none z-20"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(253,224,100,0.5) 0%, rgba(197,160,89,0.15) 55%, transparent 100%)',
              boxShadow: '0 0 20px 6px rgba(197,160,89,0.45)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Text layer — always centered, never displaced by chips */}
      <div
        className="absolute inset-0 flex items-center z-0 pointer-events-none"
        style={{ padding: '0 10px' }}
      >
        <span
          className={`text-left whitespace-nowrap ${textColor}`}
          style={{ fontSize: `${0.96 * fontScale}rem`, fontWeight: 900, letterSpacing: '0.01em', lineHeight: 1, flex: '0 0 auto', WebkitTextStroke: '0.4px currentColor' }}
        >
          {opt.label}
        </span>
        <div className="flex items-center justify-end flex-1 min-w-0" style={{ paddingLeft: 6 }}>
          {showOdds && oddsLabel ? (
            <span className={`whitespace-nowrap ${oddsColor}`} style={{ fontSize: `${0.864 * fontScale}rem`, fontWeight: 900, lineHeight: 1, WebkitTextStroke: '0.4px currentColor' }}>
              {oddsLabel}
            </span>
          ) : null}
        </div>
      </div>

      {/* Chip overlay — absolute, floats over text, pointer-events none so clicks pass through */}
      {chipsHere.length > 0 && (
        <div
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
          style={{ overflow: 'visible' }}
        >
          {chipsHere.length === 1 ? (
            /* Single player — one chip dead-center on the button */
            <Chip
              key={chipsHere[0].pid}
              playerId={chipsHere[0].pid}
              amount={chipsHere[0].amt}
              scale={chipScale}
              draggable={gamePhase === 'betting' && chipsHere[0].pid === activePlayerId}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rank', pid: chipsHere[0].pid, amount: rankBets[opt.key] || 0 }));
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="transition-transform hover:scale-110"
              title={`P${chipsHere[0].pid + 1}: $${chipsHere[0].amt}`}
              style={{ pointerEvents: 'auto', flexShrink: 0 }}
            />
          ) : (
            /* Multi-player — 2-row grid, centered */
            <div className="flex flex-col justify-around" style={{ width: '100%', height: '100%', padding: '3px 6px', overflow: 'visible' }}>
              {/* Row 1: P1–P5 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, overflow: 'visible' }}>
                {Array.from({ length: 5 }, (_, i) => {
                  const chip = chipsHere.find(c => c.pid === i);
                  if (!chip) return <span key={i} style={{ width: Math.round(24 * chipScale), height: Math.round(24 * chipScale) + 4, display: 'inline-block', flexShrink: 0 }} />;
                  return (
                    <Chip
                      key={i}
                      playerId={chip.pid}
                      amount={chip.amt}
                      scale={chipScale}
                      draggable={gamePhase === 'betting' && chip.pid === activePlayerId}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rank', pid: chip.pid, amount: rankBets[opt.key] || 0 }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="transition-transform hover:scale-110"
                      title={`P${chip.pid + 1}: $${chip.amt}`}
                      style={{ pointerEvents: 'auto', flexShrink: 0 }}
                    />
                  );
                })}
              </div>
              {/* Row 2: P6–P10 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, overflow: 'visible' }}>
                {Array.from({ length: 5 }, (_, i) => {
                  const pid = i + 5;
                  const chip = chipsHere.find(c => c.pid === pid);
                  if (!chip) return <span key={pid} style={{ width: Math.round(24 * chipScale), height: Math.round(24 * chipScale) + 4, display: 'inline-block', flexShrink: 0 }} />;
                  return (
                    <Chip
                      key={pid}
                      playerId={chip.pid}
                      amount={chip.amt}
                      scale={chipScale}
                      draggable={gamePhase === 'betting' && chip.pid === activePlayerId}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rank', pid: chip.pid, amount: rankBets[opt.key] || 0 }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="transition-transform hover:scale-110"
                      title={`P${chip.pid + 1}: $${chip.amt}`}
                      style={{ pointerEvents: 'auto', flexShrink: 0 }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2.5 -right-2.5 bg-black text-yellow-400 text-xs font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-20 pointer-events-none">
          WIN!
        </motion.div>
      )}
    </motion.button>
  );
}

export default function RankBets({
  rankBets, allRankBets, playerCount, onRankBet, onRemoveRankBet, onMoveRankBet,
  gamePhase, winningRank, leadingRank, disabled, killSwitchActive,
  handBetCount, maxRankSlots, rankBetCount, unlockedRanks,
  activePlayerId, activeHandIds,
  onAttemptLockedRank, onHoverRankRow,
  rankLockThreshold = 1,
  matchCapRemaining = 0,
  fontScale = 1,
  chipScale = 0.65,
  compactHeader = false,
  reverseOrder = false,
}) {
  const canBet = gamePhase === 'betting' && !disabled && !killSwitchActive;
  // hasMathFilter removed: all ranks available when kill-switch is off
  const noHandBets = !handBetCount || handBetCount === 0;

  return (
    <div className="relative flex flex-col h-full" style={{ overflow: 'visible' }}>
      {/* Header row — label left, Match Cap pill right, same flex row */}
      <div className="flex items-center justify-between flex-shrink-0 mb-1">
        <span
          className="text-xs font-black tracking-wider uppercase"
          style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#e8c22a', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {compactHeader ? 'Ranking' : 'Hand Ranking'}
        </span>
        {!noHandBets && !killSwitchActive && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(234,179,8,0.5)', color: '#fbbf24' }}
          >
            Match Cap: ${matchCapRemaining.toLocaleString()}
          </span>
        )}
      </div>

      {/* Blackout Overlay — No Card Bets Yet */}
      {noHandBets && !killSwitchActive && gamePhase === 'betting' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{
            backdropFilter: 'blur(6px)',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(10,8,4,0.88) 100%)',
            border: 'none',
            boxShadow: 'inset 0 0 20px rgba(251,191,36,0.05)',
          }}
        >
          <img
            src={CARDS_IMG}
            alt="cards"
            style={{ width: 48, height: 'auto', marginBottom: 8, filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }}
          />
          <span className="text-yellow-400 font-black text-sm mb-1 text-center px-2 leading-tight">
            RANK BOARD LOCKED
          </span>
          <span className="text-yellow-300/60 text-sm text-center px-3 leading-snug">
            Place a Card bet to unlock Rankings
          </span>
        </div>
      )}

      {/* Blackout Overlay — Kill Switch (too many hands) */}
      {killSwitchActive && gamePhase === 'betting' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{
            backdropFilter: 'blur(6px)',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(10,8,4,0.88) 100%)',
            border: 'none',
            boxShadow: 'inset 0 0 20px rgba(251,191,36,0.05)',
          }}
        >
          <img
            src={CARDS_IMG}
            alt="cards"
            style={{ width: 48, height: 'auto', marginBottom: 8, filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }}
          />
          <span className="text-yellow-400 font-black text-sm mb-1 text-center px-2 leading-tight">
            RANK BOARD LOCKED
          </span>
          <span className="text-yellow-300/60 text-sm text-center px-3 leading-snug">
            {rankLockThreshold}+ Hands selected — select fewer to unlock
          </span>
        </div>
      )}

      {/* Rank slot rows */}
      <div className="flex flex-col flex-1 min-h-0 gap-1">
        {(reverseOrder ? [...RANK_BET_OPTIONS].reverse() : RANK_BET_OPTIONS).map(opt => {
          const bet = rankBets[opt.key] || 0;
          const isWinner = winningRank === opt.key;
          const isLeading = leadingRank === opt.key && !isWinner;

          const currentRankSlots = Object.keys(rankBets).length;
          const slotLimitReached = maxRankSlots > 0 && !rankBets[opt.key] && currentRankSlots >= maxRankSlots;
          const isKillLocked = !!killSwitchActive;
          const isSlotLocked = slotLimitReached;
          const isMathLocked = false; // Removed: all ranks open regardless of hand selection

          return (
            <div
              key={opt.key}
              className="relative flex-1 min-h-0"
              onMouseEnter={() => onHoverRankRow && !noHandBets && onHoverRankRow(opt.key)}
              onMouseLeave={() => onHoverRankRow && onHoverRankRow(null)}
            >
              <RankSlot
                opt={opt}
                rankBets={rankBets}
                allRankBets={allRankBets}
                playerCount={playerCount}
                canBet={canBet}
                isWinner={isWinner}
                isLeading={isLeading}
                isKillLocked={isKillLocked}
                isSlotLocked={isSlotLocked}
                noHandBets={noHandBets}
                onRankBet={onRankBet}
                onRemoveRankBet={onRemoveRankBet}
                onMoveRankBet={onMoveRankBet}
                gamePhase={gamePhase}
                unlockedRanks={unlockedRanks}
                killSwitchActive={killSwitchActive}
                activePlayerId={activePlayerId}
                activeHandIds={activeHandIds}
                oddsLabel={RANK_ODDS_LABELS[opt.key]}
                fontScale={fontScale}
                chipScale={chipScale}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}