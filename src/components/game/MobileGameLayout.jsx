import React from 'react';
import { getCardImageUrl } from '@/lib/cardImages';
import HistoryRail from './HistoryRail';
import { evaluateBestHand, FIXED_HANDS, getTotalHandBets, getTotalRankBets, getTotalColorBets, cardColor } from '@/lib/gameEngine';
import { HAND_RANK_PAYOUTS, COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT, RIVER_STATE_PAYOUTS } from '@/lib/payoutConstants';
import { getRankOddsRange } from '@/lib/perHandRankPayouts';
import CommunityCards from './CommunityCards';
import RankBets, { RANK_BET_OPTIONS } from './RankBets';
import SideBets from './SideBets';
import DealerAnnouncement from './DealerAnnouncement';
import Chip from './Chip';
import CountdownClock from './CountdownClock';
import DetailedPayoutDisplay from './DetailedPayoutDisplay';
import GameRulesModal from './GameRulesModal';
import HowToPlayOverlay from './HowToPlayOverlay';
import HandBetLimitAlert from './HandBetLimitAlert';
import RankBetLimitAlert from './RankBetLimitAlert';
import InsufficientFundsAlert from './InsufficientFundsAlert';
import AutoTrimToast from './AutoTrimToast';
import ColorSideAlert from './ColorSideAlert';
import VolumeControl from './VolumeControl';

const CHIP_VALUES = [0.25, 0.05, 0.02, 0.01];

const LOGO_URLS = {
  red:   'https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/2667063a3_image.png',
  blue:  'https://media.base44.com/images/public/69fbe99a6a81578f42265ae6/864b277e3_RapidFireGreenLogo.png',
  green: 'https://media.base44.com/images/public/69fbe99a6a81578f42265ae6/864b277e3_RapidFireGreenLogo.png',
};

// ── Portrait-optimised hand card ─────────────────────────────────────────
function MobileHandCard({
  hand, isLeading, isWinner, communityCards,
  betAmount, onBet, onRemoveBet,
  gamePhase, disabled, disabledByConstraint, onAttemptLockedBet,
}) {
  const isBettingPhase = gamePhase === 'betting';
  const isActive = isLeading || isWinner;

  let borderCls;
  if (isActive)                  borderCls = 'border-black shadow-black/60 shadow-xl';
  else if (disabledByConstraint) borderCls = 'slot-border-dormant bg-black/25';
  else if (betAmount > 0)        borderCls = 'slot-border-active bg-black/25';
  else                           borderCls = 'slot-border-dormant bg-black/25';

  const W = 29, H = 40;
  const card0 = hand.cards[0];
  const card1 = hand.cards[1];
  const img0 = getCardImageUrl(card0);
  const img1 = getCardImageUrl(card1);

  return (
    <div
      className={`relative rounded-lg border-2 cursor-pointer select-none flex flex-col items-center justify-between overflow-visible ${borderCls}`}
      style={{
        padding: '1px 2px 1px',
        height: '100%',
        ...(isActive ? { background: 'linear-gradient(135deg,#b8860b 0%,#d4a017 30%,#c9900e 60%,#8B6914 100%)' } : {}),
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if (isBettingPhase) {
          if (disabledByConstraint) onAttemptLockedBet?.();
          else onBet(hand.id);
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (!isBettingPhase) return;
        if (disabledByConstraint) { onAttemptLockedBet?.(); return; }
        // Tap on chip overlay = remove; tap elsewhere = add
        if (betAmount > 0 && e.target.closest('[data-chip-overlay]')) {
          onRemoveBet(hand.id);
        } else {
          onBet(hand.id);
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); if (isBettingPhase) onRemoveBet(hand.id); }}
    >
      {/* Payout label */}
      <div style={{
        fontSize: '0.55rem',
        color: isActive ? '#000' : '#e8b84b',
        fontWeight: isActive ? 900 : 700,
        lineHeight: 1,
        textAlign: 'center',
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}>
        {hand.payout}:1
      </div>

      {/* Cards */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0 3px', position: 'relative' }}>
        <div style={{ flexShrink: 0 }}>
          {img0
            ? <img src={img0} alt={card0?.rank} className="rounded shadow-md" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />
            : <div className="bg-white rounded text-black flex items-center justify-center font-bold" style={{ width: W, height: H, fontSize: '0.5rem' }}>{card0?.rank}</div>
          }
        </div>
        <div style={{ flexShrink: 0 }}>
          {img1
            ? <img src={img1} alt={card1?.rank} className="rounded shadow-md" style={{ width: W, height: H, objectFit: 'cover', display: 'block' }} />
            : <div className="bg-white rounded text-black flex items-center justify-center font-bold" style={{ width: W, height: H, fontSize: '0.5rem' }}>{card1?.rank}</div>
          }
        </div>
        {betAmount > 0 && (
          <div data-chip-overlay="true" style={{ position: 'absolute', bottom: -6, left: -2, zIndex: 10, pointerEvents: 'auto', cursor: 'pointer' }}>
            <Chip amount={betAmount} scale={0.42} />
          </div>
        )}
      </div>

      {/* Rank eval */}
      {communityCards && communityCards.length > 0 && (() => {
        const ev = evaluateBestHand(hand.cards, communityCards);
        return ev && ev.name !== 'No Hand' && ev.name !== 'High Card'
          ? <div style={{ fontSize: '0.38rem', color: isActive ? '#000' : '#a8956a', fontWeight: 800, lineHeight: 1, textAlign: 'center', flexShrink: 0 }}>{ev.name}</div>
          : <div style={{ fontSize: '0.38rem', lineHeight: 1, flexShrink: 0 }}>&nbsp;</div>;
      })()}

      {/* WIN! badge — top-right, black bg / gold text (v12 spec) */}
      {isWinner && (
        <div
          className="absolute -top-2 -right-2 font-black rounded-full"
          style={{ fontSize: '0.5rem', padding: '2px 5px', zIndex: 20, background: '#000', color: '#ffd700', letterSpacing: '0.04em', boxShadow: '0 0 6px 2px rgba(251,191,36,0.7)' }}
        >
          WIN!
        </div>
      )}

      {/* Lock overlay */}
      {disabledByConstraint && (
        <div className="absolute inset-0 rounded-lg pointer-events-none flex flex-col items-center justify-center" style={{ zIndex: 20 }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}>🔒</span>
          <span style={{ color: '#ff4444', fontSize: '0.42rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3, textShadow: '0 1px 4px #000' }}>LOCKED</span>
        </div>
      )}
    </div>
  );
}

// ── Layout D strip components ────────────────────────────────────────────
// Compact horizontal strips for Layout D — each side-bet board becomes one
// full-width row with odds displayed above each position (like card hand boxes).

const RANK_SHORT_LABELS = {
  'Four of a Kind':  '4OAK',
  'Full House':      'Full',
  'Flush':           'Flush',
  'Straight':        'Str8',
  'Three of a Kind': '3OAK',
  'Two Pair':        '2Pair',
  'One Pair':        '1Pair',
};

const STRIP_BORDER = '3px solid #e8b84b';
const STRIP_SHADOW = '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)';

// Gold shimmer that traces a board's real border while it's active/bettable.
// Real markup (not a ::after) so it aligns with the parent's border via the
// masking technique in index.css (.board-shimmer-ring / .board-shimmer-spin).
function BoardShimmer({ isActive }) {
  if (!isActive) return null;
  return (
    <div className="board-shimmer-ring" aria-hidden="true">
      <div className="board-shimmer-spin" />
    </div>
  );
}

const goldGrad = 'linear-gradient(135deg, #f6d860 0%, #e8c22a 30%, #fef08a 55%, #c9960a 80%, #e8c22a 100%)';
const goldDimGrad = 'linear-gradient(135deg, #c9a820 0%, #b08a14 30%, #d4b830 55%, #8a6504 80%, #b08a14 100%)';

// ── Gold Bar — a raised, embossed bullion-bar look for every betting
// position (2026-08-16): vertical sheen top-to-bottom + a hard bottom
// edge that gives the bar physical thickness/lift off the felt, framed
// in a bronze/dark-gold edge instead of a flat black border. Used as the
// uniform base for every position on Rank/Color/River; GOLD_BAR_WINNER
// is the same shape, brighter, with an outer glow, for the winning spot.
const GOLD_BAR = {
  background: 'linear-gradient(180deg, #fff8d6 0%, #ffe98a 14%, #f6d860 32%, #e8c22a 56%, #c9960a 80%, #8a6504 100%)',
  border: '2px solid #5c4200',
  boxShadow: '0 3px 0 #6b4d02, 0 4px 6px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,255,255,0.75), inset 0 -3px 4px rgba(90,55,0,0.55)',
};
const GOLD_BAR_WINNER = {
  background: 'linear-gradient(180deg, #fffce0 0%, #fff176 14%, #ffd600 34%, #ffab00 60%, #c9960a 85%, #8a6504 100%)',
  border: '2px solid #5c4200',
  boxShadow: '0 3px 0 #6b4d02, 0 0 16px rgba(255,200,50,0.85), 0 4px 8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.9), inset 0 -3px 4px rgba(90,55,0,0.5)',
};

// ── Rank Strip D ──────────────────────────────────────────────────────────
function RankStripD({
  rankBets, allRankBets, playerCount, onRankBet, onRemoveRankBet,
  gamePhase, winningRank, leadingRank, disabled, killSwitchActive,
  handBetCount, maxRankSlots, rankBetCount, activePlayerId,
  matchCapRemaining, rankLockThreshold = 1, chipScale = 0.42,
  isActive = false,
}) {
  const canBet = gamePhase === 'betting' && !disabled && !killSwitchActive;
  const noHandBets = !handBetCount || handBetCount === 0;
  const currentRankSlots = Object.keys(rankBets).length;

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.45)', padding: '4px 6px', border: STRIP_BORDER, boxShadow: STRIP_SHADOW, flex: 1, minHeight: 0 }}>
      <BoardShimmer isActive={isActive} />
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: '#e8c22a', textShadow: '0 1px 2px rgba(0,0,0,0.8)', textTransform: 'uppercase' }}>
          Ranking
        </span>
        {!noHandBets && !killSwitchActive && (
          <span style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(234,179,8,0.5)', color: '#fbbf24', fontSize: '0.5rem', fontWeight: 900, padding: '1px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            Match Cap: ${matchCapRemaining.toLocaleString()}
          </span>
        )}
      </div>

      {/* Blackout — no hand bets */}
      {noHandBets && !killSwitchActive && gamePhase === 'betting' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{ backdropFilter: 'blur(6px)', background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(10,8,4,0.88) 100%)' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15', letterSpacing: '0.06em' }}>RANK BOARD LOCKED</span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(253,224,71,0.5)', marginTop: 4 }}>Place a Card bet to unlock</span>
        </div>
      )}

      {/* Blackout — kill switch */}
      {killSwitchActive && gamePhase === 'betting' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{ backdropFilter: 'blur(6px)', background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(10,8,4,0.88) 100%)' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15', letterSpacing: '0.06em' }}>RANK BOARD LOCKED</span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(253,224,71,0.5)', marginTop: 4 }}>{rankLockThreshold}+ Hands — select fewer</span>
        </div>
      )}

      {/* Slot row — 7 positions horizontal */}
      <div style={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
        {RANK_BET_OPTIONS.map(opt => {
          const bet = rankBets[opt.key] || 0;
          const isWinner = winningRank === opt.key;
          const isLeading = leadingRank === opt.key && !isWinner;
          const isActive = isWinner || isLeading;
          const slotLimitReached = maxRankSlots > 0 && !rankBets[opt.key] && currentRankSlots >= maxRankSlots;
          const fullyLocked = noHandBets || killSwitchActive || slotLimitReached;
          const showOdds = isActive || bet > 0 || (!fullyLocked && canBet);
          const oddsRange = getRankOddsRange(opt.key);
          const oddsMin = oddsRange ? `${oddsRange.min}-` : '';
          const oddsMax = oddsRange ? `${oddsRange.max}:1` : '';

          // Every position — winner, losing bet, locked, or open — uses the
          // same raised gold-bar base. Only the winner gets the brighter
          // variant + outer glow + WIN badge; nothing darkens or dims.
          let style, textColor, oddsColor;
          if (isActive) {
            style = { ...GOLD_BAR_WINNER };
          } else {
            style = { ...GOLD_BAR, cursor: (!fullyLocked && canBet) ? 'pointer' : 'default' };
          }
          textColor = '#000'; oddsColor = '#000';

          const chipsHere = [];
          for (let i = 0; i < (playerCount || 1); i++) {
            const amt = (allRankBets?.[i] || {})[opt.key] || 0;
            if (amt > 0) chipsHere.push({ pid: i, amt });
          }

          return (
            <button
              key={opt.key}
              onMouseDown={(e) => { if (e.button !== 0) return; if (e.target.closest('[data-chip]')) return; if (gamePhase === 'betting' && !fullyLocked) onRankBet(opt.key); }}
              onTouchEnd={(e) => { e.preventDefault(); if (gamePhase !== 'betting' || noHandBets || killSwitchActive) return; if (bet > 0 && e.target.closest('[data-chip]')) { onRemoveRankBet(opt.key); } else if (!fullyLocked) { onRankBet(opt.key); } }}
              onContextMenu={(e) => { e.preventDefault(); if (gamePhase === 'betting' && bet > 0) onRemoveRankBet(opt.key); }}
              onDragOver={(e) => { if (gamePhase === 'betting' && !killSwitchActive) { e.preventDefault(); e.stopPropagation(); } }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (gamePhase !== 'betting' || killSwitchActive) return; const data = e.dataTransfer.getData('text/plain'); if (!data) return; try { const { from, type, pid: dragPid } = JSON.parse(data); if (type === 'rank' && from !== opt.key) { onRemoveRankBet(from); onRankBet(opt.key); } } catch (_) {} }}
              style={{ ...style, flex: 1, borderRadius: 6, position: 'relative', overflow: 'visible', pointerEvents: noHandBets || killSwitchActive ? 'none' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3, paddingBottom: 3 }}
            >
              {/* Odds — top of the position */}
              {showOdds && oddsMin && oddsMax && (
                <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: 'auto' }}>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, lineHeight: 1.1, color: oddsColor, whiteSpace: 'nowrap', overflow: 'hidden', textShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {oddsMin}
                  </div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, lineHeight: 1.1, color: oddsColor, whiteSpace: 'nowrap', overflow: 'hidden', textShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {oddsMax}
                  </div>
                </div>
              )}
              {/* Label — locked to the bottom of the position */}
              <div style={{ fontSize: '0.5rem', fontWeight: 900, lineHeight: 1, textAlign: 'center', color: textColor, letterSpacing: '0.01em', whiteSpace: 'nowrap', marginTop: 'auto' }}>
                {RANK_SHORT_LABELS[opt.key]}
              </div>
              {/* Chip overlay — left-aligned */}
              {chipsHere.length > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start" style={{ overflow: 'visible', paddingLeft: 2 }}>
                  {chipsHere.length === 1 ? (
                    <Chip key={chipsHere[0].pid} playerId={chipsHere[0].pid} amount={chipsHere[0].amt} scale={chipScale}
                      draggable={gamePhase === 'betting' && chipsHere[0].pid === activePlayerId}
                      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rank', pid: chipsHere[0].pid, amount: bet })); e.dataTransfer.effectAllowed = 'move'; }}
                      data-chip="true" style={{ pointerEvents: 'auto', flexShrink: 0 }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, maxWidth: '100%' }}>
                      {chipsHere.map(c => <Chip key={c.pid} playerId={c.pid} amount={c.amt} scale={chipScale * 0.7} data-chip="true" style={{ pointerEvents: 'auto', flexShrink: 0 }} />)}
                    </div>
                  )}
                </div>
              )}
              {/* WIN badge */}
              {isWinner && (
                <div style={{ position: 'absolute', top: -6, right: -4, fontSize: '0.38rem', fontWeight: 900, padding: '1px 3px', borderRadius: 999, background: '#000', color: '#ffd700', zIndex: 20, boxShadow: '0 0 4px 2px rgba(251,191,36,0.7)', whiteSpace: 'nowrap' }}>WIN!</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Color Strip D ──────────────────────────────────────────────────────────
function ColorStripD({
  communityCards, allRedBlackBets, redBlackBets, onRedBlackBet, onRemoveRedBlackBet,
  gamePhase, winningRedBlack, disabled, killSwitchActive, rankBetActive,
  playerCount, colorCap, activeColorSide, onColorSideConflict, chipScale = 0.42,
  isActive = false,
}) {
  const colorLocked = killSwitchActive || !rankBetActive;
  const redSideLocked = colorLocked || activeColorSide === 'black';
  const blackSideLocked = colorLocked || activeColorSide === 'red';
  const canBetRed = gamePhase === 'betting' && !disabled && !redSideLocked;
  const canBetBlack = gamePhase === 'betting' && !disabled && !blackSideLocked;

  const reds = communityCards.filter(c => cardColor(c) === 'red').length;
  const blacks = communityCards.filter(c => cardColor(c) === 'black').length;
  const liveRedBlack = [];
  if (reds === 3) liveRedBlack.push('3R');
  if (reds === 4) liveRedBlack.push('4R');
  if (reds === 5) liveRedBlack.push('5R');
  if (blacks === 3) liveRedBlack.push('3B');
  if (blacks === 4) liveRedBlack.push('4B');
  if (blacks === 5) liveRedBlack.push('5B');

  const OPTIONS = [
    { key: '3R', number: '3', payout: COLOR_BOARD_PAYOUTS['3R'], isRed: true },
    { key: '4R', number: '4', payout: COLOR_BOARD_PAYOUTS['4R'], isRed: true },
    { key: '5R', number: '5', payout: COLOR_BOARD_PAYOUTS['5R'], isRed: true },
    { key: '3B', number: '3', payout: COLOR_BOARD_PAYOUTS['3B'], isRed: false },
    { key: '4B', number: '4', payout: COLOR_BOARD_PAYOUTS['4B'], isRed: false },
    { key: '5B', number: '5', payout: COLOR_BOARD_PAYOUTS['5B'], isRed: false },
  ];

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.45)', padding: '4px 6px', border: STRIP_BORDER, boxShadow: STRIP_SHADOW, flex: 1, minHeight: 0 }}>
      <BoardShimmer isActive={isActive} />
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: '#e8c22a', textShadow: '0 1px 2px rgba(0,0,0,0.8)', textTransform: 'uppercase' }}>
          Color
        </span>
        {!colorLocked && (
          <span style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(234,179,8,0.5)', color: '#fbbf24', fontSize: '0.5rem', fontWeight: 900, padding: '1px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            Match Cap: ${colorCap.toLocaleString()}
          </span>
        )}
      </div>

      {/* Kill switch overlay */}
      {killSwitchActive && gamePhase === 'betting' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.82)' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15' }}>LOCKED</span>
        </div>
      )}

      {/* Rank gate overlay */}
      {!killSwitchActive && !rankBetActive && (gamePhase === 'betting' || gamePhase === 'flop' || gamePhase === 'lowHighBetting') && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{ backdropFilter: 'blur(6px)', background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(15,10,5,0.82) 100%)' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15', letterSpacing: '0.04em' }}>UPGRADE YOUR WIN</span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(253,224,71,0.5)', marginTop: 4 }}>Match Rank to Hand total</span>
        </div>
      )}

      {/* Slot row — 6 positions horizontal */}
      <div style={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
        {OPTIONS.map(opt => {
          const isWinner = winningRedBlack && winningRedBlack.includes(opt.key);
          const isLive = liveRedBlack.includes(opt.key) && !isWinner && communityCards.length > 0 && communityCards.length < 5;
          const hasBet = (redBlackBets[opt.key] || 0) > 0;
          const isActive = isWinner || isLive;
          const canBetThisCell = opt.isRed ? canBetRed : canBetBlack;
          const isSideLocked = opt.isRed ? redSideLocked : blackSideLocked;

          // Color board: Red positions are red, Black positions are black.
          // Winner gets gold winner styling + glow. No darkening of non-
          // winners — every position stays full color. Raised bar shape
          // via bottom-edge shadow for the 3D ingot look.
          const RED_BAR = {
            background: 'linear-gradient(180deg, #ff4444 0%, #dc1414 40%, #a00808 80%, #700404 100%)',
            border: '2px solid #4a0202',
            boxShadow: '0 3px 0 #5a0303, 0 4px 6px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,180,180,0.4), inset 0 -3px 4px rgba(60,0,0,0.5)',
          };
          const BLACK_BAR = {
            background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 40%, #111 80%, #000 100%)',
            border: '2px solid #1a1a1a',
            boxShadow: '0 3px 0 #0a0a0a, 0 4px 6px rgba(0,0,0,0.5), inset 0 2px 3px rgba(200,200,200,0.3), inset 0 -3px 4px rgba(0,0,0,0.6)',
          };
          let style, textColor, oddsColor;
          if (isActive) {
            style = { ...GOLD_BAR_WINNER };
            textColor = '#000'; oddsColor = '#000';
          } else {
            style = opt.isRed ? { ...RED_BAR, cursor: canBetThisCell ? 'pointer' : 'default' }
                              : { ...BLACK_BAR, cursor: canBetThisCell ? 'pointer' : 'default' };
            textColor = '#fef08a'; oddsColor = '#facc15';
          }

          const chipsHere = [];
          for (let i = 0; i < (playerCount || 1); i++) {
            const amt = (allRedBlackBets[i] || {})[opt.key] || 0;
            if (amt > 0) chipsHere.push({ pid: i, amt });
          }

          return (
            <button
              key={opt.key}
              onMouseDown={(e) => { if (e.button !== 0) return; if (gamePhase !== 'betting') return; if (isSideLocked && !colorLocked && !hasBet) { onColorSideConflict(); return; } onRedBlackBet(opt.key); }}
              onTouchEnd={(e) => { e.preventDefault(); if (gamePhase !== 'betting') return; if (e.target.closest('[data-chip="true"]')) { onRemoveRedBlackBet(opt.key); return; } if (isSideLocked && !colorLocked) { onColorSideConflict(); return; } onRedBlackBet(opt.key); }}
              onContextMenu={(e) => { e.preventDefault(); if (gamePhase === 'betting') onRemoveRedBlackBet(opt.key); }}
              onDragOver={(e) => { if (gamePhase === 'betting') { e.preventDefault(); e.stopPropagation(); } }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (gamePhase !== 'betting') return; const data = e.dataTransfer.getData('text/plain'); if (!data) return; try { const { from, type } = JSON.parse(data); if (type === 'rb' && from !== opt.key) { onRemoveRedBlackBet(from); onRedBlackBet(opt.key); } } catch (_) {} }}
              style={{ ...style, flex: 1, borderRadius: 6, position: 'relative', overflow: 'visible', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3, paddingBottom: 3 }}
            >
              {/* Odds above — bigger, more legible */}
              <div style={{ fontSize: '0.58rem', fontWeight: 900, lineHeight: 1, textAlign: 'center', color: oddsColor, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}>
                {opt.payout}:1
              </div>
              {/* Count number (big) + RED/BLACK word (below) — spelled out per Michael's request */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, lineHeight: 1, color: textColor, whiteSpace: 'nowrap' }}>
                  {opt.number}
                </div>
                <div style={{ fontSize: '0.44rem', fontWeight: 900, lineHeight: 1.1, color: textColor, letterSpacing: '0.06em', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {opt.isRed ? 'RED' : 'BLACK'}
                </div>
              </div>
              {/* Chip overlay — left-aligned */}
              {chipsHere.length > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start" style={{ overflow: 'visible', paddingLeft: 2 }}>
                  {chipsHere.length === 1 ? (
                    <Chip key={chipsHere[0].pid} playerId={chipsHere[0].pid} amount={chipsHere[0].amt} scale={chipScale}
                      draggable={gamePhase === 'betting'} data-chip="true"
                      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', JSON.stringify({ from: opt.key, type: 'rb', pid: chipsHere[0].pid, amount: redBlackBets[opt.key] || 0 })); e.dataTransfer.effectAllowed = 'move'; }}
                      style={{ pointerEvents: 'auto', flexShrink: 0 }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, maxWidth: '100%' }}>
                      {chipsHere.map(c => <Chip key={c.pid} playerId={c.pid} amount={c.amt} scale={chipScale * 0.7} data-chip="true" style={{ pointerEvents: 'auto', flexShrink: 0 }} />)}
                    </div>
                  )}
                </div>
              )}
              {/* WIN badge */}
              {isWinner && (
                <div style={{ position: 'absolute', top: -6, right: -4, fontSize: '0.38rem', fontWeight: 900, padding: '1px 3px', borderRadius: 999, background: '#000', color: '#ffd700', zIndex: 20, boxShadow: '0 0 4px 2px rgba(251,191,36,0.7)', whiteSpace: 'nowrap' }}>WIN!</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── River Strip D ──────────────────────────────────────────────────────────
function RiverStripD({
  communityCards, allLowHighBets, lowHighBet, onLowHighBet, onRemoveLowHighBet,
  gamePhase, winningLowHigh, disabled, killSwitchActive, rankBetActive,
  playerCount, riverCap, chipScale = 0.42,
  isActive = false,
}) {
  const riverLocked = !rankBetActive;
  const riverBoardOpen = !riverLocked && gamePhase !== 'betting' && gamePhase !== 'flop';
  const canBetLH = gamePhase === 'lowHighBetting' && !disabled && !riverLocked;

  const LOW_RANKS = new Set(['2','3','4','5','6','7']);
  let turnBoardState = null;
  if (communityCards && communityCards.length >= 4) {
    const turnCards = communityCards.slice(0, 4);
    const lowCount = turnCards.filter(c => LOW_RANKS.has(c.rank)).length;
    turnBoardState = `${lowCount}L${4 - lowCount}H`;
  }
  const riverPayouts = {
    LOW:  (turnBoardState && RIVER_STATE_PAYOUTS[turnBoardState]) ? RIVER_STATE_PAYOUTS[turnBoardState].LOW : LOW_HIGH_PAYOUT,
    HIGH: (turnBoardState && RIVER_STATE_PAYOUTS[turnBoardState]) ? RIVER_STATE_PAYOUTS[turnBoardState].HIGH : LOW_HIGH_PAYOUT,
  };

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.45)', padding: '4px 6px', border: STRIP_BORDER, boxShadow: STRIP_SHADOW, flex: 1, minHeight: 0 }}>
      <BoardShimmer isActive={isActive} />
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', color: '#e8c22a', textShadow: '0 1px 2px rgba(0,0,0,0.8)', textTransform: 'uppercase' }}>
          River
        </span>
        {riverBoardOpen && (
          <span style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(234,179,8,0.5)', color: '#fbbf24', fontSize: '0.5rem', fontWeight: 900, padding: '1px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            Match Cap: ${riverCap.toLocaleString()}
          </span>
        )}
      </div>

      {/* Lock overlay — before turn or rank gate not met */}
      {(gamePhase === 'betting' || gamePhase === 'flop' || (gamePhase === 'lowHighBetting' && !rankBetActive)) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
          style={{ backdropFilter: 'blur(6px)', background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(5,10,20,0.82) 100%)' }}>
          {(gamePhase === 'betting' || gamePhase === 'flop') ? (
            <>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15' }}>OPENS AFTER TURN</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(253,224,71,0.5)', marginTop: 4 }}>River bet available</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15' }}>UPGRADE YOUR WIN</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(253,224,71,0.5)', marginTop: 4 }}>Match Rank to Hand total</span>
            </>
          )}
        </div>
      )}

      {/* Slot row — 2 positions horizontal */}
      <div style={{ display: 'flex', gap: 4, flex: 1, minHeight: 0 }}>
        {['LOW', 'HIGH'].map(type => {
          const isWinner = winningLowHigh === type;
          const hasBet = lowHighBet && lowHighBet.type === type && lowHighBet.amount > 0;
          const payout = riverPayouts[type];

          // Every position — winner, losing bet, locked, or open — uses the
          // same raised gold-bar base. Only the winner gets the brighter
          // variant + outer glow; nothing darkens or dims.
          let style, textColor, oddsColor;
          if (isWinner) {
            style = { ...GOLD_BAR_WINNER };
          } else {
            style = { ...GOLD_BAR, cursor: canBetLH ? 'pointer' : 'default' };
          }
          textColor = '#000'; oddsColor = '#000';

          const chipsHere = [];
          for (let i = 0; i < (playerCount || 1); i++) {
            const plh = allLowHighBets[i];
            if (plh && plh.type === type && plh.amount > 0) chipsHere.push({ pid: i, amt: plh.amount });
          }

          return (
            <button
              key={type}
              onMouseDown={(e) => { if (e.button !== 0) return; if (gamePhase !== 'lowHighBetting') return; onLowHighBet(type); }}
              onTouchEnd={(e) => { e.preventDefault(); if (gamePhase !== 'lowHighBetting') return; if (e.target.closest('[data-chip="true"]')) { onRemoveLowHighBet(); return; } onLowHighBet(type); }}
              onContextMenu={(e) => { e.preventDefault(); if (gamePhase === 'lowHighBetting' && hasBet) onRemoveLowHighBet(); }}
              style={{ ...style, flex: 1, borderRadius: 6, position: 'relative', overflow: 'visible', cursor: canBetLH ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3, paddingBottom: 3 }}
            >
              {/* Odds above — much bigger, boxes are wide with room to spare */}
              <div style={{ fontSize: '0.85rem', fontWeight: 900, lineHeight: 1, textAlign: 'center', color: oddsColor, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {payout}:1
              </div>
              {/* Label below — much bigger */}
              <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, textAlign: 'center', color: textColor, letterSpacing: '0.03em', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {type === 'LOW' ? 'LOW (2-7)' : 'HIGH (8-A)'}
              </div>
              {/* Chip overlay — left-aligned */}
              {chipsHere.length > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start" style={{ overflow: 'visible', paddingLeft: 2 }}>
                  {chipsHere.length === 1 ? (
                    <Chip key={chipsHere[0].pid} playerId={chipsHere[0].pid} amount={chipsHere[0].amt} scale={chipScale}
                      draggable={gamePhase === 'lowHighBetting'} data-chip="true"
                      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'lh', pid: chipsHere[0].pid, amount: lowHighBet?.amount || 0 })); e.dataTransfer.effectAllowed = 'move'; }}
                      style={{ pointerEvents: 'auto', flexShrink: 0 }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, maxWidth: '100%' }}>
                      {chipsHere.map(c => <Chip key={c.pid} playerId={c.pid} amount={c.amt} scale={chipScale * 0.7} data-chip="true" style={{ pointerEvents: 'auto', flexShrink: 0 }} />)}
                    </div>
                  )}
                </div>
              )}
              {/* WIN badge */}
              {isWinner && (
                <div style={{ position: 'absolute', top: -6, right: -4, fontSize: '0.38rem', fontWeight: 900, padding: '1px 3px', borderRadius: 999, background: '#000', color: '#ffd700', zIndex: 20, boxShadow: '0 0 4px 2px rgba(251,191,36,0.7)', whiteSpace: 'nowrap' }}>WIN!</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────
export default function MobileGameLayout({
  gamePhase,
  communityCards,
  maxHandBetsAllowed = 1,
  rankLockThreshold = undefined,
  dealerMessage,
  leadingHandIds,
  winnerHandIds,
  winningRedBlack,
  winningLowHigh,
  winningRank,
  leadingRank,
  lastWinInfo,
  playerCount,
  activePlayer,
  balances,
  selectedChip,
  handBets,
  redBlackBets,
  rankBets,
  lowHighBets,
  countdownTime,
  countdownActive,
  onCloseWinDisplay,
  killSwitchActive,
  showUnlockFlash = false,
  onDismissUnlockFlash = null,
  sideBetGateOpen,
  handBetCount,
  rankBetCount,
  maxRankSlots,
  luminosityClass,
  hoveredRankRow,
  hoveredRiverType,
  riverWinFlash,
  isRankBetPlaced,
  totalBet,
  history,
  // Alerts
  showHandLimitAlert,
  showRankLimitAlert,
  rankAlertType,
  showCapAlert,
  capAlertType,
  showInsufficientFunds,
  showAutoTrimToast,
  showColorSideAlert,
  // Handlers
  onHandBet,
  onRemoveHandBet,
  onDropChip,
  onRankBet,
  onRemoveRankBet,
  onMoveRankBet,
  onRedBlackBet,
  onRemoveRedBlackBet,
  onLowHighBet,
  onRemoveLowHighBet,
  onSelectChip,
  onClearBets,
  onCloseHandAlert,
  onCloseRankAlert,
  onCloseCapAlert,
  onCloseInsufficientFunds,
  onHideAutoTrimToast,
  onCloseColorSideAlert,
  // Tools
  onOpenStats,
  onOpenMollySimulator,
  onOpenArchetypeBattle,
  onOpenExploitHunter,
  onOpenComplianceReport,
  onOpenKsStrategyTest,
  onOpenObserver,
  onOpenGameTiming,
  onOpenAnalytics,
  onOpenVersions,
  onOpenBellCurve,
  toolsVisible,
  onSetHoveredRankRow,
  onSetHoveredRiverType,
  // v12-specific
  handDisplayOrder,
  boardTheme,
  soundManager,
  resetBankVisible,
  onResetBank,
  activeColorSide,
  preloadSounds,
  onSetTheme,
  onOpenHelp,
  onOpenMobileLayout,
  onDealerButton,
  mobileLayout = 'A',
  suppressHowToPlay = false,
  versions = {},
  versionsReady = false,
}) {
  const pid = activePlayer;
  const balance = balances[pid] ?? 20;
  const [gearMenuOpen, setGearMenuOpen] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);


  // Mobile lock-board copy must mirror the live Versions setting.
  // Prefer DB-loaded versions, then local cached Versions during load, then the explicit parent prop.
  const cachedRankLockThreshold = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('rapidFireGameVersions');
      if (!saved) return undefined;
      const parsed = JSON.parse(saved);
      return parsed?.rankLockThreshold;
    } catch {
      return undefined;
    }
  }, [versionsReady, versions?.rankLockThreshold, rankLockThreshold]);

  const rankLockAt = Number(
    (versionsReady ? versions?.rankLockThreshold : undefined) ??
    cachedRankLockThreshold ??
    rankLockThreshold ??
    versions?.rankLockThreshold ??
    1
  );
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(0.4);
  React.useEffect(() => {
    if (soundManager) soundManager.setAmbientVolume(muted ? 0 : volume);
  }, [muted, volume, soundManager]);
  const pHandBets = handBets[pid] || {};
  const pRedBlackBets = redBlackBets[pid] || {};
  const pRankBets = rankBets[pid] || {};
  const pLowHighBet = lowHighBets[pid] || null;
  const activeHandIds = Object.keys(pHandBets).map(Number);
  // ── Match cap calculations (same formulas as desktop layout) ──
  const _totalHandAmt = getTotalHandBets(pHandBets);
  const _totalRankAmt = getTotalRankBets(pRankBets);
  const _totalColorAmt = getTotalColorBets(pRedBlackBets);
  const matchCapRemaining = Math.max(0, _totalHandAmt - _totalRankAmt);
  const colorCap = Math.max(0, (_totalHandAmt + _totalRankAmt) - _totalColorAmt);
  const riverCap = Math.max(0, (_totalHandAmt + _totalRankAmt + _totalColorAmt) - (pLowHighBet?.amount || 0));
  const displayOrder = handDisplayOrder && handDisplayOrder.length === 10
    ? handDisplayOrder
    : FIXED_HANDS.map(h => h.id);


  // ── Landscape mode — 2-col layout ────────────────────────────────────────
  // Landscape mode DISABLED — portrait only until landscape layout is finalized
  // To re-enable: replace the line below with the full detection hook
  const isLandscape = false;

  if (isLandscape) {
    const panelBorder = '1px solid rgba(202,138,4,0.4)';

    return (
      <div
        className={`velvet-board text-white theme-${boardTheme || 'red'}`}
        style={{ width:'100dvw', height:'100dvh', display:'flex', overflow:'hidden' }}
        onClick={preloadSounds}
      >
        {/* ── Alerts ── */}
        <HandBetLimitAlert isOpen={showHandLimitAlert} onClose={onCloseHandAlert} />
        <RankBetLimitAlert isOpen={showRankLimitAlert} onClose={onCloseRankAlert} currentHandBets={handBetCount} alertType={rankAlertType} maxRankSlots={maxRankSlots} />
        <RankBetLimitAlert isOpen={showCapAlert} onClose={onCloseCapAlert} alertType={capAlertType} currentHandBets={handBetCount} />
        <InsufficientFundsAlert isVisible={showInsufficientFunds} onClose={onCloseInsufficientFunds} />
        <AutoTrimToast isVisible={showAutoTrimToast} onHide={onHideAutoTrimToast} />
        <ColorSideAlert isOpen={!!showColorSideAlert} onClose={onCloseColorSideAlert} />

        {/* Unlock flash */}
        {showUnlockFlash && (
          <div style={{ position:'fixed', top:'10%', left:'31%', transform:'translateX(-50%)', zIndex:9999,
            display:'flex', flexDirection:'column', alignItems:'center', borderRadius:8,
            background:'linear-gradient(160deg,rgba(0,0,0,0.97),rgba(25,12,0,0.98))',
            border:'2px solid #eab308', animation:'rfUnlockFadeOut 8s ease forwards',
            pointerEvents:'none', padding:'6px 12px', gap:2 }}>
            <span style={{fontSize:9,fontWeight:900,color:'#eab308',letterSpacing:'0.1em',textTransform:'uppercase'}}>🔓 Bonus Bets Unlocked</span>
            <span style={{fontSize:8,color:'#f87171',fontWeight:800}}>🔴 Color Board Open</span>
            <span style={{fontSize:8,color:'#60a5fa',fontWeight:800}}>🌊 River Bet — After Turn</span>
          </div>
        )}

        {/* ════════════════════════════════════════════
            LEFT COLUMN — 60% — dealer bar INSIDE here
            ════════════════════════════════════════════ */}
        <div style={{ width:'60%', display:'flex', flexDirection:'column',
          borderRight:'1.5px solid rgba(202,138,4,0.4)', overflow:'hidden' }}>

          {/* Dealer bar — left col only, 18px, single line, no wrap */}
          <div style={{ flexShrink:0, height:18, display:'flex', alignItems:'center',
            padding:'0 8px', overflow:'hidden',
            background:'linear-gradient(90deg,rgba(55,22,0,0.95),rgba(70,28,0,0.95))',
            border:'3px solid #e8b84b',
            boxShadow:'0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            whiteSpace:'nowrap' }}>
            <DealerAnnouncement message={dealerMessage} phase={gamePhase} fontSize="0.6rem" height="16px" lineHeight="16px" />
          </div>

          {/* Community cards — 30px hard cap, scale(0.40) */}
          <div style={{ flexShrink:0, height:30, maxHeight:30, overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.5)', borderBottom:panelBorder, padding:'0 4px' }}>
            <img src={LOGO_URLS[boardTheme]||LOGO_URLS.red} alt=""
              style={{width:9,height:'auto',borderRadius:2,flexShrink:0,opacity:0.7}} />
            <div style={{ transform:'scale(0.40)', transformOrigin:'center center',
              display:'flex', alignItems:'center', flexShrink:0,
              width:'78%', justifyContent:'center', pointerEvents:'none' }}>
              <CommunityCards cards={communityCards} phase={gamePhase} cardW={42} cardH={60} gap={4} groupGap={8} labelH={14} labelTopGap={3} showRiverBanner={mobileLayout !== 'A'} />
            </div>
            <img src={LOGO_URLS[boardTheme]||LOGO_URLS.red} alt=""
              style={{width:9,height:'auto',borderRadius:2,flexShrink:0,opacity:0.7}} />
          </div>

          {/* Win display */}
          <div style={{flexShrink:0}}>
            <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={onCloseWinDisplay} />
          </div>

          {/* 5×2 Hand grid — flex:1 but capped so cards stay compact */}
          <div style={{ flex:1, minHeight:0, display:'grid',
            gridTemplateColumns:'repeat(5,1fr)', gridTemplateRows:'repeat(2,1fr)',
            gap:2, padding:'2px', maxHeight:'calc(100% - 80px)' }}>
            {displayOrder.map(hid => {
              const hand = FIXED_HANDS.find(h => h.id === hid);
              if (!hand) return null;
              return (
                <MobileHandCard
                  key={hand.id} hand={hand}
                  isLeading={leadingHandIds.includes(hand.id)}
                  isWinner={winnerHandIds.includes(hand.id)}
                  communityCards={communityCards}
                  betAmount={pHandBets[hand.id]||0}
                  onBet={onHandBet} onRemoveBet={onRemoveHandBet}
                  gamePhase={gamePhase}
                  disabled={balance < selectedChip && !pHandBets[hand.id]}
                  disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                  onAttemptLockedBet={()=>{}}
                />
              );
            })}
          </div>

          {/* Action bar — chips, countdown, balance, clear, gear */}
          <div style={{ flexShrink:0, height:32, display:'flex', alignItems:'center',
            gap:3, padding:'0 5px',
            borderTop:'1px solid rgba(202,138,4,0.3)', background:'rgba(0,0,0,0.65)' }}>

            <div style={{display:'flex',gap:1,alignItems:'center',flexShrink:0}}>
              {CHIP_VALUES.map(v => (
                <button key={v} onClick={()=>onSelectChip(v)}
                  style={{ lineHeight:0, border:'none', background:'transparent', padding:0, cursor:'pointer',
                    transform: selectedChip===v ? 'scale(1.18)':'scale(1)',
                    filter: selectedChip===v ? 'drop-shadow(0 0 4px rgba(251,191,36,0.9))':'none',
                    opacity: selectedChip===v ? 1:0.6, transition:'all 0.15s' }}>
                  <Chip amount={v} scale={0.34} />
                </button>
              ))}
            </div>

            <div style={{flexShrink:0}}>
              <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
            </div>

            <div style={{flex:1}} />

            <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0,
              padding:'2px 6px', borderRadius:5, border:'1.5px solid #eab308', background:'#000' }}>
              <span style={{fontSize:7,fontWeight:900,color:'#facc15'}}>P{pid+1}</span>
              <span style={{fontSize:10,fontWeight:900,color:'#facc15',textShadow:'0 0 5px rgba(251,191,36,0.7)'}}>
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {gamePhase==='betting' && totalBet>0 && (
              <button onClick={onClearBets} style={{flexShrink:0,padding:'2px 4px',borderRadius:4,
                border:'1px solid rgba(239,68,68,0.5)',background:'rgba(127,29,29,0.4)',
                color:'#fca5a5',fontSize:8,fontWeight:800,cursor:'pointer'}}>Clear</button>
            )}

            <button onClick={()=>setGearMenuOpen(o=>!o)}
              style={{flexShrink:0,width:22,height:22,borderRadius:5,
                border:'1px solid rgba(234,179,8,0.5)',
                background:gearMenuOpen?'rgba(234,179,8,0.2)':'rgba(0,0,0,0.5)',
                color:'#1a1200',display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,cursor:'pointer'}}>⚙️</button>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT COLUMN — 40%
            No dealer bar — full height for rank + color/river
            ════════════════════════════════════════════ */}
        <div style={{ width:'40%', flexShrink:0, display:'flex', flexDirection:'column' }}>

          {/* RANK BOARD — top 52% of right col */}
          <div style={{ flex:'52 1 0', minHeight:0, display:'flex', flexDirection:'column',
            background:'rgba(0,0,0,0.55)', borderBottom:'1.5px solid rgba(202,138,4,0.4)',
            overflow:'hidden', padding:'2px' }}>
            <RankBets
              rankBets={pRankBets} allRankBets={rankBets} playerCount={playerCount}
              onRankBet={onRankBet} onRemoveRankBet={onRemoveRankBet} onMoveRankBet={onMoveRankBet}
              gamePhase={gamePhase} winningRank={winningRank} leadingRank={leadingRank}
              disabled={balance < selectedChip} killSwitchActive={killSwitchActive}
              handBetCount={handBetCount} maxRankSlots={maxRankSlots} rankBetCount={rankBetCount}
              unlockedRanks={new Set()} activePlayerId={pid} activeHandIds={activeHandIds}
              onAttemptLockedRank={()=>{}} onHoverRankRow={onSetHoveredRankRow}
              rankLockThreshold={rankLockAt}
            />
          </div>

          {/* COLOR + RIVER — bottom 48% of right col
              overflow visible + position relative so river buttons never get clipped */}
          <div className={luminosityClass} style={{ flex:'48 1 0', minHeight:0,
            display:'flex', flexDirection:'column',
            background:'rgba(0,0,0,0.55)', overflow:'visible', position:'relative',
            padding:'2px' }}>
            <SideBets
              communityCards={communityCards}
              allRedBlackBets={redBlackBets} allLowHighBets={lowHighBets}
              redBlackBets={pRedBlackBets} lowHighBet={pLowHighBet}
              onRedBlackBet={onRedBlackBet} onRemoveRedBlackBet={onRemoveRedBlackBet}
              onLowHighBet={onLowHighBet} onRemoveLowHighBet={onRemoveLowHighBet}
              gamePhase={gamePhase} winningRedBlack={winningRedBlack} winningLowHigh={winningLowHigh}
              disabled={balance < selectedChip}
              killSwitchActive={killSwitchActive} rankBetActive={sideBetGateOpen}
              playerCount={playerCount} totalInvestment={totalBet}
              hoveredRiverType={hoveredRiverType} onHoverRiver={onSetHoveredRiverType}
              riverWinFlash={riverWinFlash} selectedChip={selectedChip}
              hoveredRankRow={hoveredRankRow} isRankBetPlaced={isRankBetPlaced}
              activeColorSide={activeColorSide} onColorSideConflict={onCloseColorSideAlert}
              compactLandscape={true}
              rankLockThreshold={rankLockAt}
            />
          </div>
        </div>

        {/* Gear dropdown */}
        {gearMenuOpen && (
          <div style={{ position:'fixed', bottom:36, right:4, width:190, zIndex:500,
            background:'linear-gradient(170deg,#1a0f00 0%,#0a0500 100%)',
            border:'3px solid #e8b84b', borderRadius:14,
            boxShadow:'0 0 0 1px #000 inset, 0 -4px 24px rgba(0,0,0,0.8), 0 0 16px rgba(232,184,75,0.15)',
            padding:0, maxHeight:'75vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>

            {/* Title */}
            <div style={{ padding:'10px 14px 8px',
              background:'linear-gradient(180deg, rgba(232,184,75,0.12) 0%, transparent 100%)',
              borderBottom:'2px solid #e8b84b' }}>
              <span style={{fontSize:13,fontWeight:900,color:'#fde047',letterSpacing:'0.14em',fontFamily:"'Oswald', sans-serif"}}>SETTINGS</span>
            </div>

            {/* Action buttons */}
            <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
              {resetBankVisible && (
                <button onClick={()=>{onResetBank();setGearMenuOpen(false);}}
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                    border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                    color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                    letterSpacing:'0.04em',textAlign:'left'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)';e.currentTarget.style.border='2px solid #a8792a';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)';e.currentTarget.style.border='2px solid #8a6218';}}
                >Reset Bank</button>
              )}

              <GameRulesModal asMenuItem buttonStyle={{
                width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                letterSpacing:'0.04em',textAlign:'left',display:'flex',alignItems:'center',
              }} buttonHoverStyle={{ background:'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)', border:'2px solid #a8792a' }} />

              <button onClick={()=>{setShowHistory(true);setGearMenuOpen(false);}}
                style={{width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                  border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                  color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                  letterSpacing:'0.04em',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)';e.currentTarget.style.border='2px solid #a8792a';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)';e.currentTarget.style.border='2px solid #8a6218';}}
              >Hand History</button>

              <button onClick={()=>{if(onOpenHelp)onOpenHelp();else setShowHowToPlay(true);setGearMenuOpen(false);}}
                style={{width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                  border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                  color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                  letterSpacing:'0.04em',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)';e.currentTarget.style.border='2px solid #a8792a';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)';e.currentTarget.style.border='2px solid #8a6218';}}
              >How To Play</button>

              <button onClick={()=>{onOpenStats();setGearMenuOpen(false);}}
                style={{width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                  border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                  color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                  letterSpacing:'0.04em',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)';e.currentTarget.style.border='2px solid #a8792a';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)';e.currentTarget.style.border='2px solid #8a6218';}}
              >Player Stats</button>

              {/* Mobile Layout — all layouts */}
              <button
                onClick={() => { if (onOpenMobileLayout) onOpenMobileLayout(); setGearMenuOpen(false); }}
                style={{width:'100%',padding:'9px 12px',borderRadius:8,cursor:'pointer',
                  border:'2px solid #8a6218',background:'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                  color:'#1a1200',fontSize:12,fontWeight:800,fontFamily:"'Oswald', sans-serif",
                  letterSpacing:'0.04em',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)';e.currentTarget.style.border='2px solid #a8792a';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)';e.currentTarget.style.border='2px solid #8a6218';}}
              >Mobile Layout</button>
            </div>

            <div style={{height:0,borderTop:'1px solid rgba(232,184,75,0.4)'}} />

            {/* Board Color */}
            <div style={{ padding:'10px 12px' }}>
              <div style={{fontSize:9,fontWeight:800,color:'rgba(253,224,71,0.65)',letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Oswald', sans-serif",marginBottom:6}}>Board Color</div>
              <div style={{display:'flex',gap:6}}>
                {[{id:'red',label:'Red',dot:'#dc2626'},{id:'blue',label:'Blue',dot:'#2563eb'},{id:'green',label:'Green',dot:'#16a34a'}].map(t=>{
                  const selected = boardTheme===t.id;
                  return (
                    <button key={t.id} onClick={()=>{if(onSetTheme)onSetTheme(t.id);}}
                      style={{flex:1,padding:'7px 4px',borderRadius:8,cursor:'pointer',
                        fontFamily:"'Oswald', sans-serif",fontSize:10,fontWeight:800,
                        color:selected?'#fde047':'#94a3b8',
                        border:selected?'2.5px solid #e8b84b':'1.5px solid rgba(232,184,75,0.4)',
                        background:selected?'rgba(100,60,0,0.5)':'rgba(0,0,0,0.3)',
                        display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                        boxShadow:selected?'0 0 8px rgba(232,184,75,0.2)':'none'}}>
                      <span style={{width:16,height:16,borderRadius:'50%',background:t.dot,display:'block',
                        border:selected?'2px solid #fde047':'1.5px solid rgba(255,255,255,0.25)',
                        boxShadow:selected?`0 0 6px ${t.dot}`:'none'}} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{height:0,borderTop:'1px solid rgba(232,184,75,0.4)'}} />

            {/* Sound (bottom) */}
            <div style={{ padding:'10px 12px 12px' }}>
              <div style={{fontSize:9,fontWeight:800,color:'rgba(253,224,71,0.65)',letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Oswald', sans-serif",marginBottom:6}}>Sound</div>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,
                border:'2px solid #8a6218',background:'rgba(0,0,0,0.35)'}}>
                <button onClick={()=>setMuted(m=>!m)}
                  style={{padding:'0 10px',height:30,borderRadius:6,cursor:'pointer',flexShrink:0,
                    border:`1.5px solid ${muted?'#dc2626':'#e8b84b'}`,
                    background:muted?'rgba(220,38,38,0.15)':'rgba(232,184,75,0.1)',
                    color:muted?'#f87171':'#fde047',fontSize:10,fontWeight:800,
                    fontFamily:"'Oswald', sans-serif",letterSpacing:'0.05em',whiteSpace:'nowrap'}}>
                  {muted?'MUTED':'MUTE'}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={muted?0:volume}
                  onChange={e=>{setVolume(parseFloat(e.target.value));setMuted(false);}}
                  style={{flex:1,height:5,cursor:'pointer',accentColor:'#e8b84b'}} />
              </div>
            </div>

          </div>
        )}

        {/* History overlay */}
        {showHistory && (
          <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,0.96)',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'8px 12px',borderBottom:'1px solid rgba(234,179,8,0.3)',
              background:'rgba(20,8,0,0.98)',flexShrink:0}}>
              <span style={{color:'#1a1200',fontWeight:800,fontSize:12,letterSpacing:'0.08em',textTransform:'uppercase'}}>📜 Hand History</span>
              <button onClick={()=>setShowHistory(false)}
                style={{width:28,height:28,borderRadius:6,border:'1px solid rgba(234,179,8,0.5)',
                  background:'rgba(234,179,8,0.15)',color:'#1a1200',fontSize:14,fontWeight:900,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1,minHeight:0,padding:'8px',overflowY:'auto'}}>
              <HistoryRail history={history} />
            </div>
          </div>
        )}
        {/* ── Rank Abbreviations Overlay (Layout D only) ── */}
        <HowToPlayOverlay versions={versions} versionsReady={versionsReady} forceOpen={showHowToPlay} onClose={()=>setShowHowToPlay(false)} suppress={suppressHowToPlay} />
      </div>
    );
  }
  // ── End landscape ─────────────────────────────────────────────────────────

  return (
    <div
      className={`velvet-board w-full flex flex-col text-white overflow-hidden theme-${boardTheme || 'red'}`}
      style={{ height: '100dvh' }}
      onClick={preloadSounds}
      onTouchStart={preloadSounds}
    >
      {/* ── Alerts ── */}
      <HandBetLimitAlert isOpen={showHandLimitAlert} onClose={onCloseHandAlert} />
      <RankBetLimitAlert isOpen={showRankLimitAlert} onClose={onCloseRankAlert} currentHandBets={handBetCount} alertType={rankAlertType} maxRankSlots={maxRankSlots} />
      <RankBetLimitAlert isOpen={showCapAlert} onClose={onCloseCapAlert} alertType={capAlertType} currentHandBets={handBetCount} />
      <InsufficientFundsAlert isVisible={showInsufficientFunds} onClose={onCloseInsufficientFunds} />
      <AutoTrimToast isVisible={showAutoTrimToast} onHide={onHideAutoTrimToast} />
      <ColorSideAlert isOpen={!!showColorSideAlert} onClose={onCloseColorSideAlert} />

      {/* ── Dealer message bar — fixed height, never moves (Layout D has its own positioned lower) ── */}
      {mobileLayout !== 'D' && (
      <div className="flex-shrink-0 px-2 pt-1.5">
        <div style={{
          height: '26px',
          minHeight: '26px',
          maxHeight: '26px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '0.4rem',
          border: '3px solid #e8b84b',
          boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
          background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          <DealerAnnouncement message={dealerMessage} phase={gamePhase} fontSize="0.75rem" height="24px" lineHeight="24px" />
        </div>
      </div>
      )}

      {/* Bonus Bets Unlocked — moved into River board wrappers below */}

      {mobileLayout === 'B' ? (
        <>
{/* ── Main game area ── */}
      <div className="flex-1 min-h-0 px-0.5 pt-2 pb-0 flex flex-col gap-2" style={{ touchAction: 'none' }} onClick={showUnlockFlash ? onDismissUnlockFlash : undefined}>

        {/* Rank + Color/River — clock floats at the top boundary overlapping both */}
        <div className="flex-1 min-h-0 flex gap-1.5" style={{ position: 'relative' }}>
          {/* Clock overlaps bottom of hand grid and top of rank/color boards */}
          <div style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>

          {/* Rank board */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', padding: '6px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)' }}>
            <BoardShimmer isActive={gamePhase === 'betting' && !killSwitchActive && handBetCount > 0} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <RankBets
                rankBets={pRankBets}
                allRankBets={rankBets}
                playerCount={playerCount}
                onRankBet={onRankBet}
                onRemoveRankBet={onRemoveRankBet}
                onMoveRankBet={onMoveRankBet}
                gamePhase={gamePhase}
                winningRank={winningRank}
                leadingRank={leadingRank}
                disabled={balance < selectedChip}
                killSwitchActive={killSwitchActive}
                handBetCount={handBetCount}
                maxRankSlots={maxRankSlots}
                rankBetCount={rankBetCount}
                unlockedRanks={new Set()}
                activePlayerId={pid}
                activeHandIds={activeHandIds}
                onAttemptLockedRank={() => {}}
                onHoverRankRow={onSetHoveredRankRow}
                rankLockThreshold={rankLockAt}
                fontScale={0.85}
                chipScale={0.42}
                compactHeader={true}
                matchCapRemaining={matchCapRemaining}
              />
            </div>
          </div>

          {/* Color + River board — River on bottom, popup anchored here */}
          <div className={`flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden ${luminosityClass}`} style={{ background: 'transparent', padding: '0px', position: 'relative' }}>
            {showUnlockFlash && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '38%',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                background: 'linear-gradient(160deg, rgba(0,0,0,0.97) 0%, rgba(25,12,0,0.98) 100%)',
                border: '2px solid #eab308',
                boxShadow: '0 0 20px rgba(234,179,8,0.5)',
                opacity: 1,
                pointerEvents: 'none',
                padding: '4px 6px',
                gap: 1,
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#eab308', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>🔓 Bonus Bets Unlocked</span>
                <span style={{ fontSize: 8, color: '#f87171', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🔴 Color Board Open</span>
                <span style={{ fontSize: 8, color: '#60a5fa', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🌊 River After Turn</span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <SideBets
                communityCards={communityCards}
                allRedBlackBets={redBlackBets}
                allLowHighBets={lowHighBets}
                redBlackBets={pRedBlackBets}
                lowHighBet={pLowHighBet}
                onRedBlackBet={onRedBlackBet}
                onRemoveRedBlackBet={onRemoveRedBlackBet}
                onLowHighBet={onLowHighBet}
                onRemoveLowHighBet={onRemoveLowHighBet}
                gamePhase={gamePhase}
                winningRedBlack={winningRedBlack}
                winningLowHigh={winningLowHigh}
                disabled={gamePhase === 'betting' ? balance < selectedChip : gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
                killSwitchActive={killSwitchActive}
                rankBetActive={sideBetGateOpen}
                playerCount={playerCount}
                totalInvestment={totalBet}
                hoveredRiverType={hoveredRiverType}
                onHoverRiver={onSetHoveredRiverType}
                riverWinFlash={riverWinFlash}
                selectedChip={selectedChip}
                hoveredRankRow={hoveredRankRow}
                isRankBetPlaced={isRankBetPlaced}
                activeColorSide={activeColorSide}
                onColorSideConflict={onCloseColorSideAlert}
                chipScale={0.42}
                compactHeader={true}
                colorCap={colorCap}
                riverCap={riverCap}
              />
            </div>
          </div>
        </div>

        {/* 10-hand grid — crypto-shuffled each round */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            height: '36%',
            border: '3px solid #e8b84b',
            borderRadius: '0.75rem',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
            padding: '4px',
          }}
        >
          <BoardShimmer isActive={gamePhase === 'betting'} />
          {displayOrder.map(hid => {
            const hand = FIXED_HANDS.find(h => h.id === hid);
            if (!hand) return null;
            return (
              <MobileHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                onBet={onHandBet}
                onRemoveBet={onRemoveHandBet}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                onAttemptLockedBet={() => {}}
              />
            );
          })}
        </div>
      </div>

      {/* ── Community Cards ── */}
      <div className="flex-shrink-0 pt-2">
        <div className="rounded-xl bg-black/35 flex items-center justify-center" style={{ height: 96, padding: '4px 6px', margin: '2px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
            <CommunityCards cards={communityCards} phase={gamePhase} cardW={42} cardH={60} gap={4} groupGap={8} labelH={14} labelTopGap={3} showRiverBanner={mobileLayout !== 'A'} />
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── Win/No-Win Modal ── */}
      <div className="flex-shrink-0 px-2">
        <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={onCloseWinDisplay} />
      </div>

              </>
      ) : mobileLayout === 'C' ? (
        <>
{/* ── Layout C: Rank/Color on top, Hands below, Community Cards at bottom ── */}
      <div className="flex-1 min-h-0 px-0.5 pt-1 pb-0 flex flex-col gap-1" style={{ touchAction: 'none' }} onClick={showUnlockFlash ? onDismissUnlockFlash : undefined}>

        {/* Rank + Color/River — at the top */}
        <div className="flex-1 min-h-0 flex gap-1.5" style={{ position: 'relative' }}>
          {/* Clock overlaps top of rank/color boards */}
          <div style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>

          {/* Rank board */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', padding: '6px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)' }}>
            <BoardShimmer isActive={gamePhase === 'betting' && !killSwitchActive && handBetCount > 0} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <RankBets
                rankBets={pRankBets}
                allRankBets={rankBets}
                playerCount={playerCount}
                onRankBet={onRankBet}
                onRemoveRankBet={onRemoveRankBet}
                onMoveRankBet={onMoveRankBet}
                gamePhase={gamePhase}
                winningRank={winningRank}
                leadingRank={leadingRank}
                disabled={balance < selectedChip}
                killSwitchActive={killSwitchActive}
                handBetCount={handBetCount}
                maxRankSlots={maxRankSlots}
                rankBetCount={rankBetCount}
                unlockedRanks={new Set()}
                activePlayerId={pid}
                activeHandIds={activeHandIds}
                onAttemptLockedRank={() => {}}
                onHoverRankRow={onSetHoveredRankRow}
                rankLockThreshold={rankLockAt}
                fontScale={0.85}
                chipScale={0.42}
                compactHeader={true}
                matchCapRemaining={matchCapRemaining}
              />
            </div>
          </div>

          {/* Color + River board — River on top in Layout C, popup anchored here */}
          <div className={`flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden ${luminosityClass}`} style={{ background: 'transparent', padding: '0px', position: 'relative' }}>
            {showUnlockFlash && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '38%',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                background: 'linear-gradient(160deg, rgba(0,0,0,0.97) 0%, rgba(25,12,0,0.98) 100%)',
                border: '2px solid #eab308',
                boxShadow: '0 0 20px rgba(234,179,8,0.5)',
                opacity: 1,
                pointerEvents: 'none',
                padding: '4px 6px',
                gap: 1,
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#eab308', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>🔓 Bonus Bets Unlocked</span>
                <span style={{ fontSize: 8, color: '#f87171', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🔴 Color Board Open</span>
                <span style={{ fontSize: 8, color: '#60a5fa', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🌊 River After Turn</span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <SideBets
                communityCards={communityCards}
                allRedBlackBets={redBlackBets}
                allLowHighBets={lowHighBets}
                redBlackBets={pRedBlackBets}
                lowHighBet={pLowHighBet}
                onRedBlackBet={onRedBlackBet}
                onRemoveRedBlackBet={onRemoveRedBlackBet}
                onLowHighBet={onLowHighBet}
                onRemoveLowHighBet={onRemoveLowHighBet}
                gamePhase={gamePhase}
                winningRedBlack={winningRedBlack}
                winningLowHigh={winningLowHigh}
                disabled={gamePhase === 'betting' ? balance < selectedChip : gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
                killSwitchActive={killSwitchActive}
                rankBetActive={sideBetGateOpen}
                playerCount={playerCount}
                totalInvestment={totalBet}
                hoveredRiverType={hoveredRiverType}
                onHoverRiver={onSetHoveredRiverType}
                riverWinFlash={riverWinFlash}
                selectedChip={selectedChip}
                hoveredRankRow={hoveredRankRow}
                isRankBetPlaced={isRankBetPlaced}
                activeColorSide={activeColorSide}
                onColorSideConflict={onCloseColorSideAlert}
                chipScale={0.42}
                compactHeader={true}
                riverFirst={true}
                colorCap={colorCap}
                riverCap={riverCap}
              />
            </div>
          </div>
        </div>

        {/* 10-hand grid — below Rank/Color */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            height: '44%',
            border: '3px solid #e8b84b',
            borderRadius: '0.75rem',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
            padding: '4px',
          }}
        >
          <BoardShimmer isActive={gamePhase === 'betting'} />
          {displayOrder.map(hid => {
            const hand = FIXED_HANDS.find(h => h.id === hid);
            if (!hand) return null;
            return (
              <MobileHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                onBet={onHandBet}
                onRemoveBet={onRemoveHandBet}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                onAttemptLockedBet={() => {}}
              />
            );
          })}
        </div>
      </div>

      {/* ── Win/No-Win Modal ── */}
      <div className="flex-shrink-0 px-2">
        <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={onCloseWinDisplay} />
      </div>

              </>
      ) : mobileLayout === 'D' ? (
        <>
{/* ── Layout D: Full-width horizontal strips (River → Color → Rank → Hands → Community Cards) ── */}
      {/* ── Win/No-Win Modal ── */}
      <div className="flex-shrink-0 px-2">
        <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={onCloseWinDisplay} />
      </div>

      {/* ── Main game area ── */}
      <div className="flex-1 min-h-0 px-1 pt-1 pb-0 flex flex-col gap-0.5 justify-end" style={{ touchAction: 'none' }} onClick={showUnlockFlash ? onDismissUnlockFlash : undefined}>

        {/* Clock — floats above strips */}
        <div style={{ position: 'relative', height: 0 }}>
          <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'none' }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>
        </div>

        {/* River strip — full width, 2 positions */}
        <RiverStripD
          communityCards={communityCards}
          allLowHighBets={lowHighBets}
          lowHighBet={pLowHighBet}
          onLowHighBet={onLowHighBet}
          onRemoveLowHighBet={onRemoveLowHighBet}
          gamePhase={gamePhase}
          winningLowHigh={winningLowHigh}
          disabled={gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
          killSwitchActive={killSwitchActive}
          rankBetActive={sideBetGateOpen}
          playerCount={playerCount}
          riverCap={riverCap}
          chipScale={0.42}
          isActive={gamePhase === 'lowHighBetting' && !killSwitchActive && sideBetGateOpen}
        />

        {/* Color strip — full width, 6 positions */}
        <ColorStripD
          communityCards={communityCards}
          allRedBlackBets={redBlackBets}
          redBlackBets={pRedBlackBets}
          onRedBlackBet={onRedBlackBet}
          onRemoveRedBlackBet={onRemoveRedBlackBet}
          gamePhase={gamePhase}
          winningRedBlack={winningRedBlack}
          disabled={gamePhase === 'betting' ? balance < selectedChip : true}
          killSwitchActive={killSwitchActive}
          rankBetActive={sideBetGateOpen}
          playerCount={playerCount}
          colorCap={colorCap}
          activeColorSide={activeColorSide}
          onColorSideConflict={onCloseColorSideAlert}
          chipScale={0.42}
          isActive={gamePhase === 'betting' && !killSwitchActive && sideBetGateOpen}
        />

        {/* Rank strip — full width, 7 positions */}
        <RankStripD
          rankBets={pRankBets}
          allRankBets={rankBets}
          playerCount={playerCount}
          onRankBet={onRankBet}
          onRemoveRankBet={onRemoveRankBet}
          gamePhase={gamePhase}
          winningRank={winningRank}
          leadingRank={leadingRank}
          disabled={balance < selectedChip}
          killSwitchActive={killSwitchActive}
          handBetCount={handBetCount}
          maxRankSlots={maxRankSlots}
          rankBetCount={rankBetCount}
          activePlayerId={pid}
          matchCapRemaining={matchCapRemaining}
          rankLockThreshold={rankLockAt}
          chipScale={0.42}
          isActive={gamePhase === 'betting' && !killSwitchActive && handBetCount > 0}
        />

        {/* 10-hand grid — fixed height, minimal padding */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            height: '148px',
            border: '3px solid #e8b84b',
            borderRadius: '0.75rem',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
            padding: '2px',
          }}
        >
          <BoardShimmer isActive={gamePhase === 'betting'} />
          {displayOrder.map(hid => {
            const hand = FIXED_HANDS.find(h => h.id === hid);
            if (!hand) return null;
            return (
              <MobileHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                onBet={onHandBet}
                onRemoveBet={onRemoveHandBet}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                onAttemptLockedBet={() => {}}
              />
            );
          })}
        </div>

        {/* Dealer Dialogue bar */}
        <div className="flex-shrink-0">
          <div style={{
            height: '24px',
            minHeight: '24px',
            maxHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '0.4rem',
            border: '3px solid #e8b84b',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'linear-gradient(90deg, rgba(78,47,0,0.5) 0%, rgba(83,37,0,0.5) 100%)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            <DealerAnnouncement message={dealerMessage} phase={gamePhase} fontSize="0.65rem" height="22px" lineHeight="22px" />
          </div>
        </div>
      </div>

      {/* ── Community Cards ── */}
      <div className="flex-shrink-0 pt-1">
        <div className="rounded-xl bg-black/35 flex items-center justify-center" style={{ height: 96, padding: '4px 6px', margin: '2px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
            <CommunityCards cards={communityCards} phase={gamePhase} cardW={42} cardH={60} gap={4} groupGap={8} labelH={14} labelTopGap={3} showRiverBanner={mobileLayout !== 'A'} />
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
          </div>
        </div>
      </div>
              </>
      ) : (
        <>
{/* ── Community Cards ── */}
      <div className="flex-shrink-0 pt-1">
        <div className="rounded-xl bg-black/35 flex items-center justify-center" style={{ height: 96, padding: '4px 6px', margin: '2px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
            <CommunityCards cards={communityCards} phase={gamePhase} cardW={42} cardH={60} gap={4} groupGap={8} labelH={14} labelTopGap={3} showRiverBanner={mobileLayout !== 'A'} />
            <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── Win/No-Win Modal ── */}
      <div className="flex-shrink-0 px-2">
        <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={onCloseWinDisplay} />
      </div>

      {/* ── Main game area ── */}
      <div className="flex-1 min-h-0 px-0.5 pt-1 pb-0 flex flex-col gap-1.5" style={{ touchAction: 'none' }}>

        {/* 10-hand grid — crypto-shuffled each round */}
        <div
          className="flex-shrink-0 relative grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            height: '36%',
            border: '3px solid #e8b84b',
            borderRadius: '0.75rem',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
            padding: '4px',
          }}
        >
          <BoardShimmer isActive={gamePhase === 'betting'} />
          {displayOrder.map(hid => {
            const hand = FIXED_HANDS.find(h => h.id === hid);
            if (!hand) return null;
            return (
              <MobileHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                onBet={onHandBet}
                onRemoveBet={onRemoveHandBet}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                onAttemptLockedBet={() => {}}
              />
            );
          })}
        </div>

        {/* Rank + Color/River — clock floats at the top boundary overlapping both */}
        <div className="flex-1 min-h-0 flex gap-1.5" style={{ position: 'relative' }}>
          {/* Clock overlaps bottom of hand grid and top of rank/color boards */}
          <div style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
          </div>

          {/* Rank board */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', padding: '6px', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)' }}>
            <BoardShimmer isActive={gamePhase === 'betting' && !killSwitchActive && handBetCount > 0} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <RankBets
                rankBets={pRankBets}
                allRankBets={rankBets}
                playerCount={playerCount}
                onRankBet={onRankBet}
                onRemoveRankBet={onRemoveRankBet}
                onMoveRankBet={onMoveRankBet}
                gamePhase={gamePhase}
                winningRank={winningRank}
                leadingRank={leadingRank}
                disabled={balance < selectedChip}
                killSwitchActive={killSwitchActive}
                handBetCount={handBetCount}
                maxRankSlots={maxRankSlots}
                rankBetCount={rankBetCount}
                unlockedRanks={new Set()}
                activePlayerId={pid}
                activeHandIds={activeHandIds}
                onAttemptLockedRank={() => {}}
                onHoverRankRow={onSetHoveredRankRow}
                rankLockThreshold={rankLockAt}
                fontScale={0.85}
                chipScale={0.42}
                compactHeader={true}
                matchCapRemaining={matchCapRemaining}
                reverseOrder={true}
              />
            </div>
          </div>

          {/* Color + River board — River on bottom, popup anchored here */}
          <div className={`flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden ${luminosityClass}`} style={{ background: 'transparent', padding: '0px', position: 'relative' }}>
            {showUnlockFlash && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '38%',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                background: 'linear-gradient(160deg, rgba(0,0,0,0.97) 0%, rgba(25,12,0,0.98) 100%)',
                border: '2px solid #eab308',
                boxShadow: '0 0 20px rgba(234,179,8,0.5)',
                opacity: 1,
                pointerEvents: 'none',
                padding: '4px 6px',
                gap: 1,
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#eab308', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>🔓 Bonus Bets Unlocked</span>
                <span style={{ fontSize: 8, color: '#f87171', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🔴 Color Board Open</span>
                <span style={{ fontSize: 8, color: '#60a5fa', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>🌊 River After Turn</span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <SideBets
                communityCards={communityCards}
                allRedBlackBets={redBlackBets}
                allLowHighBets={lowHighBets}
                redBlackBets={pRedBlackBets}
                lowHighBet={pLowHighBet}
                onRedBlackBet={onRedBlackBet}
                onRemoveRedBlackBet={onRemoveRedBlackBet}
                onLowHighBet={onLowHighBet}
                onRemoveLowHighBet={onRemoveLowHighBet}
                gamePhase={gamePhase}
                winningRedBlack={winningRedBlack}
                winningLowHigh={winningLowHigh}
                disabled={gamePhase === 'betting' ? balance < selectedChip : gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
                killSwitchActive={killSwitchActive}
                rankBetActive={sideBetGateOpen}
                playerCount={playerCount}
                totalInvestment={totalBet}
                hoveredRiverType={hoveredRiverType}
                onHoverRiver={onSetHoveredRiverType}
                riverWinFlash={riverWinFlash}
                selectedChip={selectedChip}
                hoveredRankRow={hoveredRankRow}
                isRankBetPlaced={isRankBetPlaced}
                activeColorSide={activeColorSide}
                onColorSideConflict={onCloseColorSideAlert}
                chipScale={0.42}
                compactHeader={true}
                colorCap={colorCap}
                riverCap={riverCap}
              />
            </div>
          </div>
        </div>
      </div>

              </>
      )}{/* ── Bottom action bar — gold-bordered like desktop ── */}
      <div className="flex-shrink-0 px-2 py-1.5 flex items-center gap-1"
        style={{
          border: '3px solid #e8b84b',
          boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '0.75rem',
          margin: '2px',
        }}>

        {/* Chips */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {CHIP_VALUES.map(v => (
            <button
              key={v}
              onClick={() => onSelectChip(v)}
              className={`relative transition-all duration-150 rounded-full border-0 bg-transparent p-0
                ${selectedChip === v ? 'scale-125 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
              style={{ lineHeight: 0 }}
            >
              <Chip amount={v} scale={0.58} />
            </button>
          ))}
        </div>

        {/* Clear button — fixed-width slot, visibility toggled to prevent layout shift */}
        <div style={{ flexShrink: 0, width: 44, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onClearBets}
            className="px-2 py-1 rounded-lg border border-red-700/50 bg-red-900/30 text-red-300 font-semibold"
            style={{ fontSize: '0.65rem', visibility: (gamePhase === 'betting' && totalBet > 0) ? 'visible' : 'hidden' }}
          >
            Clear
          </button>
        </div>

        {/* Dealer button — fixed-width slot, visibility toggled to prevent layout shift */}
        <div style={{ flexShrink: 0, width: 52, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onDealerButton}
            disabled={gamePhase === 'betting' && Object.keys(pHandBets).length === 0}
            style={{
              padding: '4px 8px', borderRadius: 8, border: '2px solid #4ade80',
              background: '#15803d', color: '#fff', fontWeight: 900, fontSize: '0.65rem',
              cursor: 'pointer', letterSpacing: '0.04em',
              visibility: (gamePhase === 'betting' || gamePhase === 'flop' || gamePhase === 'lowHighBetting' || gamePhase === 'winner') && onDealerButton ? 'visible' : 'hidden',
              opacity: (gamePhase === 'betting' && Object.keys(pHandBets).length === 0) ? 0.4 : 1,
            }}
          >
            DEAL
          </button>
        </div>

        {/* Balance — no P1 label, compact */}
        <div className="flex items-center px-2 py-1 rounded-xl border-2 border-yellow-500 bg-black flex-shrink-0">
          <span className="text-yellow-400 font-black" style={{ fontSize: '0.85rem', textShadow: '0 0 8px rgba(251,191,36,0.7)' }}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Gear menu button + dropdown */}
        <div className="flex items-center gap-1 flex-shrink-0" style={{ position: 'relative' }}>

          {/* ⚙️ Gear button */}
          <button
            onClick={() => setGearMenuOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(234,179,8,0.5)',
              background: gearMenuOpen ? 'rgba(234,179,8,0.2)' : 'rgba(0,0,0,0.5)',
              color: '#1a1200', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 16,
            }}
          >
            ⚙️
          </button>

          {/* Gear dropdown — scrollable, pops up above. Fixed to true viewport
              edges (not the small gear-button wrapper) with a width clamp so it
              can never render partially off-screen regardless of container width. */}
          {gearMenuOpen && (
            <>
            {/* Click-away backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'transparent' }}
              onClick={() => setGearMenuOpen(false)}
            />
            <div
              className="no-scrollbar"
              style={{
                position: 'fixed', bottom: 58, right: 8,
                width: 230,
                maxWidth: 'calc(100vw - 16px)',
                maxHeight: 'calc(100vh - 66px)',
                overflowY: 'auto',
                background: 'linear-gradient(170deg, #1a0f00 0%, #0a0500 100%)',
                border: '3px solid #e8b84b',
                borderRadius: 14,
                boxShadow: '0 0 0 1px #000 inset, 0 -4px 24px rgba(0,0,0,0.7), 0 0 16px rgba(232,184,75,0.15)',
                zIndex: 300,
                padding: 0,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ═══ TITLE BAR ═══ */}
              <div style={{
                padding: '10px 14px 8px',
                background: 'linear-gradient(180deg, rgba(232,184,75,0.12) 0%, transparent 100%)',
                borderBottom: '2px solid #e8b84b',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fde047', letterSpacing: '0.14em', fontFamily: "'Oswald', sans-serif" }}>
                  SETTINGS
                </span>
              </div>

              {/* ═══ ACTION BUTTONS ═══ */}
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

                {/* Reset Bank */}
                {resetBankVisible && (
                  <button
                    onClick={() => { onResetBank(); setGearMenuOpen(false); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '2px solid #8a6218',
                      background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                      color: '#1a1200', fontSize: 13, fontWeight: 800,
                      fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)'; e.currentTarget.style.border = '2px solid #a8792a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)'; e.currentTarget.style.border = '2px solid #8a6218'; }}
                  >
                    Reset Bank
                  </button>
                )}

                {/* Game Rules */}
                <GameRulesModal asMenuItem buttonStyle={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '2px solid #8a6218',
                  background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                  color: '#1a1200', fontSize: 13, fontWeight: 800,
                  fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                  transition: 'all 0.15s', textAlign: 'left',
                }} buttonHoverStyle={{ background: 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)', border: '2px solid #a8792a' }} />

                {/* Hand History */}
                <button
                  onClick={() => { setShowHistory(true); setGearMenuOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '2px solid #8a6218',
                    background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                    color: '#1a1200', fontSize: 13, fontWeight: 800,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)'; e.currentTarget.style.border = '2px solid #a8792a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)'; e.currentTarget.style.border = '2px solid #8a6218'; }}
                >
                  Hand History
                </button>

                {/* How To Play */}
                <button
                  onClick={() => {
                    if (onOpenHelp) onOpenHelp();
                    else setShowHowToPlay(true);
                    setGearMenuOpen(false);
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '2px solid #8a6218',
                    background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                    color: '#1a1200', fontSize: 13, fontWeight: 800,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)'; e.currentTarget.style.border = '2px solid #a8792a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)'; e.currentTarget.style.border = '2px solid #8a6218'; }}
                >
                  How To Play
                </button>

                {/* Player Stats */}
                <button
                  onClick={() => { onOpenStats(); setGearMenuOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '2px solid #8a6218',
                    background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                    color: '#1a1200', fontSize: 13, fontWeight: 800,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)'; e.currentTarget.style.border = '2px solid #a8792a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)'; e.currentTarget.style.border = '2px solid #8a6218'; }}
                >
                  Player Stats
                </button>

                {/* Mobile Layout — all layouts */}
                <button
                  onClick={() => { if (onOpenMobileLayout) onOpenMobileLayout(); setGearMenuOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '2px solid #8a6218',
                    background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
                    color: '#1a1200', fontSize: 13, fontWeight: 800,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)'; e.currentTarget.style.border = '2px solid #a8792a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)'; e.currentTarget.style.border = '2px solid #8a6218'; }}
                >
                  Mobile Layout
                </button>
              </div>

              {/* ═══ BOARD COLOR ═══ */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: 'rgba(253,224,71,0.65)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontFamily: "'Oswald', sans-serif", marginBottom: 7,
                }}>
                  Board Color
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[
                    { id: 'red',   label: 'Red',   dot: '#dc2626' },
                    { id: 'blue',  label: 'Blue',  dot: '#2563eb' },
                    { id: 'green', label: 'Green', dot: '#16a34a' },
                  ].map(t => {
                    const selected = boardTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { if (onSetTheme) onSetTheme(t.id); }}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8,
                          border: selected ? '2.5px solid #e8b84b' : '1.5px solid rgba(232,184,75,0.4)',
                          background: selected ? 'rgba(100,60,0,0.5)' : 'rgba(0,0,0,0.3)',
                          color: selected ? '#fde047' : '#94a3b8',
                          fontSize: 11, fontWeight: 800,
                          fontFamily: "'Oswald', sans-serif",
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'all 0.15s',
                          boxShadow: selected ? '0 0 8px rgba(232,184,75,0.2)' : 'none',
                        }}
                      >
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', background: t.dot,
                          display: 'block',
                          border: selected ? '2px solid #fde047' : '1.5px solid rgba(255,255,255,0.25)',
                          boxShadow: selected ? `0 0 6px ${t.dot}` : 'none',
                        }} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 0, borderTop: '1px solid rgba(232,184,75,0.4)' }} />

              {/* ═══ SOUND (Bottom section) ═══ */}
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: 'rgba(253,224,71,0.65)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontFamily: "'Oswald', sans-serif", marginBottom: 7,
                }}>
                  Sound
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  border: '2px solid #8a6218',
                  background: 'rgba(0,0,0,0.35)',
                }}>
                  {/* Mute button — text only */}
                  <button
                    onClick={() => setMuted(m => !m)}
                    style={{
                      padding: '0 12px', height: 34, borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${muted ? '#dc2626' : '#e8b84b'}`,
                      background: muted ? 'rgba(220,38,38,0.15)' : 'rgba(232,184,75,0.1)',
                      color: muted ? '#f87171' : '#fde047',
                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                      fontFamily: "'Oswald', sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {muted ? 'MUTED' : 'MUTE'}
                  </button>

                  {/* Volume slider — inline */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.06em',
                        color: muted ? '#6b7280' : 'rgba(253,224,71,0.7)',
                      }}>
                        VOL
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, fontFamily: "'Oswald', sans-serif",
                        color: muted ? '#6b7280' : '#fde047',
                      }}>
                        {muted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                      style={{ width: '100%', height: 5, cursor: 'pointer', accentColor: '#e8b84b' }}
                    />
                  </div>
                </div>
              </div>

            </div>
            </>
          )}
        </div>
      </div>

      {/* ── Community Cards (Layout C only — below footer) ── */}
      {mobileLayout === 'C' && (
        <div className="flex-shrink-0 pt-0 pb-1">
          <div className="bg-black/35 flex items-center justify-center" style={{ height: 88, padding: '4px 6px', margin: '2px', border: '3px solid #e8b84b', borderRadius: '0.75rem', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
            <div className="flex items-center justify-center gap-2 w-full h-full">
              <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
              <CommunityCards cards={communityCards} phase={gamePhase} cardW={42} cardH={60} gap={4} groupGap={8} labelH={14} labelTopGap={3} showRiverBanner={mobileLayout !== 'A'} />
              <img src={LOGO_URLS[boardTheme] || LOGO_URLS.red} alt="logo" style={{ width: 34, height: 'auto', borderRadius: 5, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── How To Play Overlay ── */}
          <HowToPlayOverlay
            versions={versions}
            versionsReady={versionsReady}
            forceOpen={showHowToPlay}
            onClose={() => setShowHowToPlay(false)}
            suppress={suppressHowToPlay}
          />

          {/* ── History Rail Overlay ── */}
          {showHistory && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Header bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(234,179,8,0.3)',
                background: 'rgba(20,8,0,0.95)',
                flexShrink: 0,
              }}>
                <span style={{ color: '#1a1200', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  📜 Hand History
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid rgba(234,179,8,0.5)',
                    background: 'rgba(234,179,8,0.15)',
                    color: '#1a1200', fontSize: 18, fontWeight: 900,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Rail content */}
              <div style={{ flex: 1, minHeight: 0, padding: '12px 12px', overflowY: 'auto' }}>
                <HistoryRail history={history} />
              </div>
            </div>
          )}

          {/* ── Rank Abbreviations Overlay (Layout D only) ── */}
    </div>
  );
}