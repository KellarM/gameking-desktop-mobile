import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FIXED_HANDS, shuffleDeck, DEALER_DECK, getSecureRandomBoard, findLeadingHand,
  setActiveDeckSet,
  resolveRedBlack, resolveLowHigh, cardColor, isLowCard,
  SUITS, cardDisplay, evaluateBestHand,
  MAX_HAND_BETS, isKillSwitchActive,
  checkRankCap, checkColorCap, checkRiverCap,
  getTotalHandBets, getTotalRankBets, getTotalColorBets, hasRankBet,
  calculateTiePayout,
  isSideBetGateOpen } from
'@/lib/gameEngine';
import { COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT, RIVER_STATE_PAYOUTS, calculatePayout } from '@/lib/payoutConstants';
import { getPerHandRankPayout } from '@/lib/perHandRankPayouts';
import { trackRoundOutcome } from '@/lib/analytics';
import FixedHandCard from '@/components/game/FixedHandCard';
import CommunityCards from '@/components/game/CommunityCards';
import SideBets from '@/components/game/SideBets';
import HistoryRail from '@/components/game/HistoryRail';
import DealerAnnouncement from '@/components/game/DealerAnnouncement';
import RankBets from '@/components/game/RankBets';
import PayoutTable from '@/components/game/PayoutTable';
import NewPlayerButton from '@/components/game/NewPlayerButton';
import Chip from '@/components/game/Chip';
import PlayerSeat from '@/components/game/PlayerSeat';
import PlayerStatsPanel from '@/components/game/PlayerStatsPanel';
import ToolsMenu from '@/components/game/ToolsMenu';
import ControlPanel, { getControlSettings } from '@/components/game/ControlPanel';
import GameRulesModal from '@/components/game/GameRulesModal';
import DetailedPayoutDisplay from '@/components/game/DetailedPayoutDisplay';
import HandBetLimitAlert from '@/components/game/HandBetLimitAlert';
import RankBetLimitAlert from '@/components/game/RankBetLimitAlert';
import ColorSideAlert from '@/components/game/ColorSideAlert';
import InsufficientFundsAlert from '@/components/game/InsufficientFundsAlert';
import AutoTrimToast from '@/components/game/AutoTrimToast';
import { useGreedEngineState } from '@/components/game/GreedEngine';
import MollySimulator from '@/components/game/MollySimulator';
import ExploitHunter from '@/components/game/IndividualStrategyTest';
import KillSwitchStrategyTest from '@/components/game/KillSwitchStrategyTest';
import AnalyticsDashboard from '@/components/game/AnalyticsDashboard';
import RegulatoryComplianceReport from '@/components/game/TwoHandRankTest';

import GameTimingModal from '@/components/game/GameTimingModal';
import GameVersionsModal from '@/components/game/GameVersionsModal';
import BellCurveModal from '@/components/game/BellCurveModal';
import { useBellCurveConfig } from '@/hooks/useBellCurveConfig';
import { base44 } from '@/api/base44Client';
import DealerButton from '@/components/game/DealerButton';
import HowToPlayOverlay from '@/components/game/HowToPlayOverlay';
import { useGameTiming } from '@/hooks/useGameTiming';
import CountdownClock from '@/components/game/CountdownClock';
import { useGameVersions } from '@/hooks/useGameVersions';
import { usePlayerSession } from '@/hooks/usePlayerSession';
import { useAuditRound } from '@/hooks/useAuditRound';
import { useIncompleteRoundRecovery } from '@/hooks/useIncompleteRoundRecovery';
import RoundRecoveryModal from '@/components/game/RoundRecoveryModal';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useDropChip } from '@/hooks/useDropChip';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileGameLayout from '@/components/game/MobileGameLayout';
import GearMenu from '@/components/game/GearMenu';
import DesktopLayout2 from '@/components/game/DesktopLayout2';
import DesktopLayoutModal from '@/components/game/DesktopLayoutModal';
import MobileLayoutModal from '@/components/game/MobileLayoutModal';
import OnboardingIndicator from '@/components/game/OnboardingIndicator';


// STARTING_BALANCE = 100 (managed server-side via usePlayerSession)
const CHIP_VALUES = [0.50, 0.25, 0.10, 0.05, 0.02, 0.01];
const MAX_HAND_BET_AMOUNT = 5000;
const DEFAULT_CHIP = 0.01;
const PLAYER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MIN_BET = 0.01;

const LOGO_URLS = {
  red:   'https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/2667063a3_image.png',
  blue:  'https://base44.app/api/apps/69fbe99a6a81578f42265ae6/files/mp/public/69fbe99a6a81578f42265ae6/f79922844_12cba61b1_RapidFireBlueLogo.png',
  green: 'https://base44.app/api/apps/69fbe99a6a81578f42265ae6/files/mp/public/69fbe99a6a81578f42265ae6/1c8b70f1a_864b277e3_RapidFireGreenLogo.png',
};

// Must match PLAYER_CHIP_COLORS in child components
const PLAYER_TAB_STYLES = [
{ active: 'border-yellow-400 bg-yellow-500 text-black', inactive: 'border-yellow-700/40 bg-yellow-900/20 text-yellow-400' },
{ active: 'border-blue-400 bg-blue-500 text-white', inactive: 'border-blue-700/40 bg-blue-900/20 text-blue-400' },
{ active: 'border-pink-400 bg-pink-500 text-white', inactive: 'border-pink-700/40 bg-pink-900/20 text-pink-400' },
{ active: 'border-green-400 bg-green-500 text-black', inactive: 'border-green-700/40 bg-green-900/20 text-green-400' },
{ active: 'border-orange-400 bg-orange-500 text-black', inactive: 'border-orange-700/40 bg-orange-900/20 text-orange-400' },
{ active: 'border-cyan-400 bg-cyan-500 text-black', inactive: 'border-cyan-700/40 bg-cyan-900/20 text-cyan-400' },
{ active: 'border-red-400 bg-red-500 text-white', inactive: 'border-red-700/40 bg-red-900/20 text-red-400' },
{ active: 'border-lime-400 bg-lime-500 text-black', inactive: 'border-lime-700/40 bg-lime-900/20 text-lime-400' },
{ active: 'border-violet-400 bg-violet-500 text-white', inactive: 'border-violet-700/40 bg-violet-900/20 text-violet-400' },
{ active: 'border-amber-400 bg-amber-500 text-black', inactive: 'border-amber-700/40 bg-amber-900/20 text-amber-400' }];


// Phases: 'betting' | 'flop' | 'turn' | 'lowHighBetting' | 'river' | 'settlement' | 'winner'
const PHASE_LABELS = {
  betting: 'Place Your Bets',
  flop: 'Flop',
  turn: 'Turn',
  lowHighBetting: 'Low / High Betting Open',
  river: 'River',
  settlement: 'Settling...',
  winner: 'Round Complete'
};

// Low ranks for river board state detection
const RIVER_LOW_RANKS = new Set(['2','3','4','5','6','7']);

function getRiverBoardState(cards) {
  if (!cards || cards.length < 4) return null;
  const lowCount = cards.slice(0, 4).filter(c => RIVER_LOW_RANKS.has(c.rank)).length;
  return `${lowCount}L${4 - lowCount}H`;
}

function getDynamicRiverPayout(finalComm, direction) {
  const state = getRiverBoardState(finalComm);
  if (state && RIVER_STATE_PAYOUTS[state]) return RIVER_STATE_PAYOUTS[state][direction];
  return LOW_HIGH_PAYOUT;
}


export default function RapidFireGame() {
  const [playerCount, setPlayerCount] = useState(1);
  // balances[i] = balance for player i+1
  // balances & setBalances now come from usePlayerSession hook (server-authoritative)
  const [selectedChip, setSelectedChip] = useState(DEFAULT_CHIP);
  // handBets[playerId][handId], redBlackBets[playerId][key], rankBets[playerId][key]
  const [handBets, setHandBets] = useState({}); // { [pid]: { handId: amount } }
  // handDisplayOrder — which hand id occupies each grid slot (shuffled each round after round 1)
  const [handDisplayOrder, setHandDisplayOrder] = useState([1,2,3,4,5,6,7,8,9,10]);
  const [redBlackBets, setRedBlackBets] = useState({}); // { [pid]: { key: amount } }
  const [rankBets, setRankBets] = useState({});

  // ── Live-value refs — always hold current state, readable in stale closures ──
  const handBetsRef      = useRef({});
  const rankBetsRef      = useRef({});
  const redBlackBetsRef  = useRef({});
  const lowHighBetsRef   = useRef({});
  const balancesRef      = useRef([]);
  const activePlayerRef  = useRef(0);
  const versionsRef      = useRef(null); // { [pid]: { key: amount } }
  const [lowHighBets, setLowHighBets] = useState({}); // { [pid]: { type, amount } }
  const [activePlayer, setActivePlayer] = useState(0); // which player is placing bets
  const [communityCards, setCommunityCards] = useState([]);
  const [gamePhase, setGamePhase] = useState('betting');
  const [deck, setDeck] = useState(() => getSecureRandomBoard());
  const [deckIndex, setDeckIndex] = useState(0);
  const [dealerMessage, setDealerMessage] = useState("1. Board is ready & open for play. 2. Place Hand, Rank, & Color bets now.");
  const [leadingHandIds, setLeadingHandIds] = useState([]);
  const [winnerHandIds, setWinnerHandIds] = useState([]);
  const [winningRedBlack, setWinningRedBlack] = useState([]);
  const [winningLowHigh, setWinningLowHigh] = useState(null);
  const [history, setHistory] = useState(() => { try { const s = localStorage.getItem('rfth_history'); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [playerStats, setPlayerStats] = useState({});
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showMollySimulator, setShowMollySimulator] = useState(false);

  const [showExploitHunter, setShowExploitHunter] = useState(false);
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [showKsStrategyTest, setShowKsStrategyTest] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [showGameTiming, setShowGameTiming] = useState(false);
  const [showMobileLayout, setShowMobileLayout] = useState(false);
  const [showDesktopLayout, setShowDesktopLayout] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showBellCurve, setShowBellCurve] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const { config: bellCurveConfig, saveConfig: saveBellCurveConfig } = useBellCurveConfig();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [roundId, setRoundId] = useState(1);

  const [lastWinInfo, setLastWinInfo] = useState(null);
  const [winningRank, setWinningRank] = useState(null);
  const [leadingRank, setLeadingRank] = useState(null);
  // Casino profit tracking
  const [casinoProfit, setCasinoProfit] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showHandLimitAlert, setShowHandLimitAlert] = useState(false);
  const [showRankLimitAlert, setShowRankLimitAlert] = useState(false);
  const [rankAlertType, setRankAlertType] = useState('limit');
  const [showColorSideAlert, setShowColorSideAlert] = useState(false);
  // snowball cap alert: 'rank_cap' | 'color_cap' | 'river_cap'
  const [showCapAlert, setShowCapAlert] = useState(false);
  const [capAlertType, setCapAlertType] = useState('rank_cap');
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showAutoTrimToast, setShowAutoTrimToast] = useState(false);
  const [displayWindowVisible, setDisplayWindowVisible] = useState(false);
  const [previousBets, setPreviousBets] = useState(null);
  const [boardTheme, setBoardTheme] = useState(() => {
    try { return localStorage.getItem('rfth_theme') || 'red'; } catch { return 'red'; }
  });
  const {
    hoveredHandId, setHoveredHandId,
    hoveredRiverType, setHoveredRiverType,
    riverWinFlash, triggerRiverWin
  } = useGreedEngineState();
  const [hoveredRankRow, setHoveredRankRow] = useState(null);

  useEffect(() => {
    const h = (e) => setBoardTheme(e.detail.theme);
    window.addEventListener('rfth:themechange', h);
    return () => window.removeEventListener('rfth:themechange', h);
  }, []);
  useEffect(() => {
    document.body.classList.remove('theme-red','theme-blue','theme-green');
    document.body.classList.add('theme-'+boardTheme);
    try { localStorage.setItem('rfth_theme', boardTheme); } catch {}
  }, [boardTheme]);

  // Game timing
  const { timing, dealerMode, setDealerMode, mobileLayout, setMobileLayout, desktopLayout, setDesktopLayout, suitVariation, setSuitVariation, positionRotation, setPositionRotation, startTimer, stopTimer, reloadTiming } = useGameTiming();

  // ── Mode: true (default) = Dealer Button, false = Timing Feature ──────────
  // Dealer mode = current live behaviour (player-controlled via DealerButton).
  // Timing mode = auto-progression with visible countdown clocks.
  // Source of truth: useGameTiming hook (DB + localStorage).
  const dealerModeRef = useRef(dealerMode);
  useEffect(() => { dealerModeRef.current = dealerMode; }, [dealerMode]);

  // Countdown display state (Timing mode only)
  const [countdownTime, setCountdownTime] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const { versions, recordId: versionsRecordId, dbLoaded: versionsReady } = useGameVersions();

  // ── Server-authoritative balance & session (GLI-19 Phase 1) ──────────────
  const {
    balances,
    setBalance,
    setBalances,
    persistBalance,
    forceBalance,
    resetAllBalances,
    recordRoundResult,
    deviceId,
    sessionId,
    dbReady,
  } = usePlayerSession();

  // ── Phase 2 GLI-19: per-round immutable audit trail ───────────────────────
  const { openRound, settleRound, abandonRound, resumeRound, getNextRoundNumber } = useAuditRound({
    deviceId,
    sessionId,
  });

  // ── Keep live-value refs in sync with state ────────────────────────────────
  useEffect(() => { handBetsRef.current     = handBets;     }, [handBets]);
  useEffect(() => { rankBetsRef.current     = rankBets;     }, [rankBets]);
  useEffect(() => { redBlackBetsRef.current = redBlackBets; }, [redBlackBets]);
  useEffect(() => { lowHighBetsRef.current  = lowHighBets;  }, [lowHighBets]);
  useEffect(() => { balancesRef.current     = balances;     }, [balances]);
  useEffect(() => { activePlayerRef.current = activePlayer; }, [activePlayer]);
  useEffect(() => { versionsRef.current     = versions;     }, [versions]);

  // Capture balance BEFORE any bets are placed this round
  const balanceBeforeRoundRef = useRef(null);

  // ── Phase 3 GLI-19: incomplete round recovery ─────────────────────────────
  const isResumingRound = useRef(false); // true during a recovery resume — skips openRound
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveredState,    setRecoveredState]    = useState(null);
  const {
    checking:          recoveryChecking,
    incompleteRound,
    getRestoredBetState,
    abandonIncompleteRound,
    clearRecovery,
  } = useIncompleteRoundRecovery({
    deviceId,
    onRecordId: (rid) => {
      // Pre-wire the existing record into the audit hook before player decides
      resumeRound(rid);
    },
  });

  // When recovery check completes and finds an open round, show the modal
  // GLI-19: If total_wagered is 0 (phantom round from a timer-triggered deal with no bets),
  // auto-abandon silently instead of showing the recovery modal to the player.
  useEffect(() => {
    if (!recoveryChecking && incompleteRound) {
      const state = getRestoredBetState();
      console.log('[RECOVERY] Open round found:', JSON.stringify({ totalWagered: state?.totalWagered, handBets: state?.handBets, balanceBefore: state?.balanceBefore }));
      // Phantom record check: auto-abandon if no bets AND total_wagered is 0
      const hasAnyBets = Object.keys(state?.handBets || {}).length > 0 ||
                         Object.keys(state?.rankBets || {}).length > 0 ||
                         Object.keys(state?.colorBets || {}).length > 0 ||
                         (state?.lowHighBet?.amount > 0);
      if (!state || (!hasAnyBets && (state.totalWagered || 0) === 0)) {
        // Phantom record — no bets were placed. Auto-abandon and move on.
        abandonIncompleteRound().catch(() => {});
        return;
      }
      setRecoveredState(state);
      setShowRecoveryModal(true);
    }
  }, [recoveryChecking, incompleteRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sound effects — declared here so playCardDeal is available in handleRecoveryResume
  const { playChipPlace, playChipRemove, playCardDeal, preloadSounds, soundManager } = useGameSounds();

  const handleRecoveryResume = useCallback(() => {
    if (!recoveredState) return;
    const pid = activePlayer;

    // ── Restore all bet state for the active player ──────────────────────────
    setHandBets({ [pid]: recoveredState.handBets });
    setRankBets({ [pid]: recoveredState.rankBets });
    setRedBlackBets({ [pid]: recoveredState.colorBets });
    // lowHighBet is stored as the bet object directly (not per-player map) — restore correctly
    if (recoveredState.lowHighBet && recoveredState.lowHighBet.amount > 0) {
      setLowHighBets({ [pid]: recoveredState.lowHighBet });
    } else {
      setLowHighBets({ [pid]: null });
    }

    // ── Restore authoritative balance from AuditRound record ─────────────────
    // balanceBefore (from AuditRound) = balance BEFORE any bets were deducted.
    // Correct post-bet balance = balanceBefore - totalWagered.
    // Use forceBalance so the override ref protects this value against any
    // subsequent loadSessions() re-run that might overwrite with stale DB data.
    if (recoveredState.balanceBefore != null && recoveredState.totalWagered != null) {
      const correctBalance = recoveredState.balanceBefore - recoveredState.totalWagered;
      // forceBalance: sets UI + override ref + persists to DB (fire-and-forget ok here)
      forceBalance(pid, correctBalance).catch(() => {});
      console.log('[Recovery] Balance restored from AuditRound:', correctBalance,
        '(balanceBefore:', recoveredState.balanceBefore, '- wagered:', recoveredState.totalWagered, ')');
    }

    // ── Restore the exact deck that was dealt — same cards, same order ───────
    // boardCards: array of { rank, suit } objects saved to AuditRound at deal time.
    // If no boardCards saved (older record pre-fix), fall back to fresh deal.
    const savedBoard = recoveredState.boardCards;
    if (savedBoard && savedBoard.length === 5) {
      // Ensure the correct deck-set (baseline/opposite) is active for this round BEFORE
      // evaluating hands — setRoundId below only syncs it asynchronously via useEffect.
      if (recoveredState.roundNumber) setActiveDeckSet(recoveredState.roundNumber % 2 === 0 ? 1 : 0);
      // Restore the exact 5-card board from the DB
      const flop = [savedBoard[0], savedBoard[1], savedBoard[2]];
      setCommunityCards(flop);
      setDeck(savedBoard);
      setDeckIndex(3);  // turn is at index 3, river at index 4

      const leader = findLeadingHand(flop);
      setLeadingHandIds(leader ? leader.handIds : []);
      setLeadingRank(leader ? leader.handResult.name : null);
      const leaderHand = leader ? FIXED_HANDS.find((h) => h.id === leader.handIds[0]) : null;
      const leaderCards = leaderHand ? leaderHand.cards.map((c) => `${c.rank}${SUITS[c.suit]}`).join(' & ') : '';
      setDealerMessage(
        leader
          ? `Flop: ${flop.map(cardDisplay).join(' ')} — ${leaderCards} leads (${leader.handResult.name}) [RESUMED]`
          : `Flop: ${flop.map(cardDisplay).join(' ')} [RESUMED]`
      );

      // Restore the round counter to the interrupted round (not a new round)
      if (recoveredState.roundNumber) setRoundId(recoveredState.roundNumber);
      // Mark as resuming so handleDealFlop (if somehow called) skips new AuditRound
      isResumingRound.current = true;
      setShowRecoveryModal(false);
      clearRecovery();
      // Set phase directly — no need to call handleDealFlop at all
      setGamePhase('flop');
      playCardDeal();
    } else {
      // Fallback: no saved board — resume via handleDealFlop (fresh deal, old behaviour)
      console.warn('[Recovery] No saved boardCards — falling back to fresh deal');
      setShowRecoveryModal(false);
      clearRecovery();
      isResumingRound.current = true;
      handleDealFlop();
    }
    // NOTE: Do NOT re-deduct balance here — already persisted to DB.
  }, [recoveredState, activePlayer, clearRecovery, playCardDeal, forceBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecoveryAbandon = useCallback(async () => {
    // ── REFUND: restore the player's balance to what it was BEFORE bets were placed ──
    // Abandoning = voiding the round = the wager is returned in full.
    // CRITICAL: we AWAIT persistBalance() so the DB write is confirmed BEFORE
    // abandonIncompleteRound() marks the AuditRound as abandoned.
    // This prevents a race where loadSessions() on the next reload reads the
    // stale post-bet balance from DB before our write completes.
    if (recoveredState?.balanceBefore != null) {
      const pid = activePlayer;
      const refundedBalance = recoveredState.balanceBefore; // full pre-bet balance
      // Use forceBalance: sets UI state + sets remount-proof override + awaits DB write.
      // This is the critical triple-guarantee:
      //   1. UI shows correct balance immediately
      //   2. balanceOverrideRef ensures any remount-triggered loadSessions uses this value
      //   3. DB write is confirmed before we mark the AuditRound as abandoned
      try {
        await forceBalance(pid, refundedBalance);
        console.log('[Abandon] Balance force-written and confirmed:', refundedBalance);
      } catch (e) {
        // DB write failed — override ref still protects against remount overwrite
        console.error('[Abandon] Balance DB write failed, override still active:', e);
      }
      console.log('[Abandon] Balance restored to', refundedBalance,
        '(was', recoveredState.balanceBefore, '- wagered', recoveredState.totalWagered, ')');
    }
    await abandonIncompleteRound();
    setShowRecoveryModal(false);
    setRecoveredState(null);
  }, [abandonIncompleteRound, recoveredState, activePlayer, forceBalance]);
  // ─────────────────────────────────────────────────────────────────────────

  // reloadTiming is passed as onSaved to GameTimingModal — no event listener needed
  // dealerMode is managed by useGameTiming hook (DB + localStorage)
  const timerActiveRef = useRef(false);
  const handleDealRiverRef = useRef(null);
  const settleRef = useRef(null);

  // Game progress persistence — roundId/casinoProfit/roundsPlayed still use localStorage
  // Balance is now server-authoritative via usePlayerSession
  useEffect(() => {
    try {
      const savedGame = localStorage.getItem('rapidFireGameState');
      if (savedGame) {
        const state = JSON.parse(savedGame);
        if (state.roundId) {
          // Sync deck set to match the restored round BEFORE the re-render this triggers
          setActiveDeckSet(state.roundId % 2 === 0 ? 1 : 0);
          setRoundId(state.roundId);
        }
        if (state.casinoProfit !== undefined) setCasinoProfit(state.casinoProfit);
        if (state.roundsPlayed !== undefined) setRoundsPlayed(state.roundsPlayed);
      }
    } catch (e) {
      console.log('Could not restore game state');
    }
  }, []);

  useEffect(() => {
    const p = new Set();
    const onDown = (e) => {
      const k = (e.key || '').toLowerCase();
      if (!k) return;
      p.add(k);
      if (p.has('control') && p.has('alt') && p.has('j') && p.has('l')) { e.preventDefault(); setToolbarVisible(v=>!v); }
    };
    const onUp = (e) => {
      const k = (e.key || '').toLowerCase();
      if (k) p.delete(k);
    };
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // Auto-save non-balance game state (balance is server-authoritative via usePlayerSession)
  useEffect(() => {
    const gameState = { roundId, casinoProfit, roundsPlayed };
    localStorage.setItem('rapidFireGameState', JSON.stringify(gameState));
  }, [roundId, casinoProfit, roundsPlayed]);

  // Active player helpers
  const pid = activePlayer;
  const balance = balances[pid] ?? 20;
  const pHandBets = handBets[pid] || {};
  const pRedBlackBets = redBlackBets[pid] || {};
  const pRankBets = rankBets[pid] || {};
  const pLowHighBet = lowHighBets[pid] || null;

  // Live bet totals — used for the Match Cap / Snowball Cap HUD pills
  const totalHandAmt = getTotalHandBets(pHandBets);
  const totalRankAmt = getTotalRankBets(pRankBets);
  const totalColorAmt = getTotalColorBets(pRedBlackBets);

  // Count bets in each category (always scoped to active player)
  const handBetCount = Object.keys(pHandBets).length;
  const rankBetCount = Object.keys(pRankBets).length;

  // Kill switch: 4 hands locks all side markets
  const killSwitchActive = handBetCount >= (versions?.rankLockThreshold ?? 1);

  // Phase 4 gate: Color Board and River require total rank === total hand bets
  const sideBetGateOpen = !killSwitchActive && isSideBetGateOpen(pHandBets, pRankBets);

  // Unlock flash state
// Gold shimmer that traces a board's border while it's active/bettable.
function BoardShimmer({ isActive }) {
  if (!isActive) return null;
  return (
    <div className="board-shimmer-ring" aria-hidden="true">
      <div className="board-shimmer-spin" />
    </div>
  );
}

  const [showUnlockFlash, setShowUnlockFlash] = useState(false);
  const prevGateRef = useRef(false);
  const unlockFlashTimerRef = useRef(null);
  useEffect(() => {
    if (sideBetGateOpen && !prevGateRef.current) {
      setShowUnlockFlash(true);
      if (unlockFlashTimerRef.current) clearTimeout(unlockFlashTimerRef.current);
      unlockFlashTimerRef.current = setTimeout(() => setShowUnlockFlash(false), 4000);
      prevGateRef.current = true;
      return () => { if (unlockFlashTimerRef.current) clearTimeout(unlockFlashTimerRef.current); };
    }
    if (!sideBetGateOpen) {
      prevGateRef.current = false;
      setShowUnlockFlash(false);
    }
  }, [sideBetGateOpen]);

  // Early-kill: if River betting phase opens before the 8s timer expires,
  // clear the popup immediately so the River board is fully visible.
  useEffect(() => {
    if (gamePhase === 'lowHighBetting' && showUnlockFlash) {
      if (unlockFlashTimerRef.current) clearTimeout(unlockFlashTimerRef.current);
      setShowUnlockFlash(false);
    }
  }, [gamePhase, showUnlockFlash]);

  // Click-to-dismiss: any tap on the board instantly clears the unlock flash.
  const dismissUnlockFlash = () => {
    if (unlockFlashTimerRef.current) clearTimeout(unlockFlashTimerRef.current);
    setShowUnlockFlash(false);
  };

  // Greed Engine: live total investment for active player
  const totalInvestment =
  Object.values(pHandBets).reduce((s, v) => s + v, 0) +
  Object.values(pRankBets).reduce((s, v) => s + v, 0) +
  Object.values(pRedBlackBets).reduce((s, v) => s + v, 0) + (
  pLowHighBet?.amount || 0);

  // Luminous Path: derive glow state (0–3) for Color/River panel borders
  const isHandBetPlaced = handBetCount > 0 && !killSwitchActive;
  const isRankBetPlaced = rankBetCount > 0;
  const isRankHovered = hoveredRankRow !== null;

  // All 7 rank slots are available when kill-switch is off (any rank can win regardless of hand selection)
  const activeHandIds = Object.keys(pHandBets).map(Number);

  // Max rank slots: independent cap, zeroed when hand count hits rankLockThreshold
  const maxRankSlots = (() => {
    const lockAt = versions?.rankLockThreshold ?? 1;
    if (handBetCount >= lockAt) return 0;
    return versions?.maxRankSlots ?? 1;
  })();

  const maxHandBetsAllowed = versions?.maxCardHands ?? 1;

  const totalBet = Object.values(pHandBets).reduce((s, v) => s + v, 0) +
  Object.values(pRedBlackBets).reduce((s, v) => s + v, 0) +
  Object.values(pRankBets).reduce((s, v) => s + v, 0) + (
  pLowHighBet ? pLowHighBet.amount : 0);

  // ---- BETTING ----
  const handleHandBet = useCallback((handId) => {
    if (gamePhase !== 'betting') return;
    const existing = (handBets[pid] || {})[handId] || 0;
    const currentCount = Object.keys(handBets[pid] || {}).length;

    // Enforce versions.maxCardHands — configurable max hands per round
    const maxHandsAllowed = versions?.maxCardHands ?? 1;
    if (existing === 0 && currentCount >= maxHandsAllowed) {
      setShowHandLimitAlert(true);
      return;
    }

    // Enforce $500 max per card hand
    if (existing + selectedChip > MAX_HAND_BET_AMOUNT) return;

    // Enforce minimum bet
    if (selectedChip < MIN_BET) return;

    // Check insufficient funds
    if (existing === 0 && balance < selectedChip) {
      setShowInsufficientFunds(true);
      return;
    }

    // Right-click / if already bet: remove it
    if (existing > 0 && balance < selectedChip) {
      setHandBets((prev) => {const n = { ...(prev[pid] || {}) };delete n[handId];return { ...prev, [pid]: n };});
      setBalances((b) => {const n = [...b];n[pid] += existing;return n;});
      return;
    }
    if (balance <= 0 || balance < selectedChip) return;

    // Check if this new hand bet will close the side bet gate
    const simulatedHandBets = { ...(handBets[pid] || {}), [handId]: existing + selectedChip };
    const gateWasOpen = isSideBetGateOpen(pHandBets, pRankBets);
    const gateWillClose = gateWasOpen && !isSideBetGateOpen(simulatedHandBets, pRankBets);

    if (gateWillClose) {
      const colorRefund = Object.values(pRedBlackBets).reduce((s, v) => s + v, 0);
      const riverRefund = pLowHighBet?.amount || 0;
      if (colorRefund > 0 || riverRefund > 0) {
        setRedBlackBets((prev) => ({ ...prev, [pid]: {} }));
        setLowHighBets((prev) => ({ ...prev, [pid]: null }));
        setBalances((b) => {const n = [...b];n[pid] += colorRefund + riverRefund - selectedChip;return n;});
        setHandBets((prev) => ({ ...prev, [pid]: simulatedHandBets }));
        setShowAutoTrimToast(true);
        return;
      }
    }

    // Check if adding this hand triggers rank lock — auto-refund rank bets if so
    const newHandCountAfterAdd = Object.keys({ ...(handBets[pid] || {}), [handId]: 1 }).length;
    const rankLockAtAdd = versions?.rankLockThreshold ?? 1;
    if (newHandCountAfterAdd >= rankLockAtAdd) {
      const rankRefundAdd = Object.values(rankBets[pid] || {}).reduce((s, v) => s + v, 0);
      const colorRefundAdd = Object.values(pRedBlackBets).reduce((s, v) => s + v, 0);
      const riverRefundAdd = pLowHighBet?.amount || 0;
      const totalRefundAdd = rankRefundAdd + colorRefundAdd + riverRefundAdd;
      if (totalRefundAdd > 0) {
        setRankBets((prev) => ({ ...prev, [pid]: {} }));
        setRedBlackBets((prev) => ({ ...prev, [pid]: {} }));
        setLowHighBets((prev) => ({ ...prev, [pid]: null }));
        setHandBets((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [handId]: existing + selectedChip } }));
        setBalances((b) => {const n = [...b];n[pid] += totalRefundAdd - selectedChip;return n;});
        setShowAutoTrimToast(true);
        playChipPlace();
        return;
      }
    }

    setHandBets((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [handId]: existing + selectedChip } }));
    setBalances((b) => {const n = [...b];n[pid] -= selectedChip;return n;});
    playChipPlace();

    // ── Timing mode: start betting countdown on first bet ──────────────
    if (!dealerModeRef.current && Object.keys(pHandBets).length === 0 && !timerActiveRef.current) {
      timerActiveRef.current = true;
      setCountdownActive(true);
      startTimer(
        timing.bettingClose,
        (remaining) => setCountdownTime(remaining),
        () => {
          timerActiveRef.current = false;
          setCountdownActive(false);
          setTimeout(() => handleDealFlop(), 100);
        }
      );
    }
  }, [gamePhase, balance, selectedChip, pid, handBets, pHandBets, pRankBets, pRedBlackBets, pLowHighBet, versions, timing, startTimer]);

  const handleRemoveHandBet = useCallback((handId) => {
    if (gamePhase !== 'betting') return;
    const existing = (handBets[pid] || {})[handId] || 0;
    if (existing <= 0) return;

    // Remove the entire bet on right-click
    const removeAmount = existing;
    const newHandBetAmount = existing - removeAmount;

    // Build updated hand bets (remove slot entirely if zeroed out)
    const updatedHandBets = { ...(handBets[pid] || {}) };
    if (newHandBetAmount <= 0) {
      delete updatedHandBets[handId];
    } else {
      updatedHandBets[handId] = newHandBetAmount;
    }

    const isLastHandBet = Object.keys(updatedHandBets).length === 0;

    if (isLastHandBet) {
      // No hand bets left — refund everything
      const rankRefund = Object.values(rankBets[pid] || {}).reduce((s, v) => s + v, 0);
      const colorRefund = Object.values(redBlackBets[pid] || {}).reduce((s, v) => s + v, 0);
      const riverRefund = lowHighBets[pid]?.amount || 0;
      const newHandBets = { ...handBets, [pid]: updatedHandBets };
      const newRedBlackBets = { ...redBlackBets, [pid]: {} };
      const newRankBets = { ...rankBets, [pid]: {} };
      const newLowHighBets = { ...lowHighBets, [pid]: null };
      setHandBets(newHandBets);
      setRankBets(newRankBets);
      setRedBlackBets(newRedBlackBets);
      setLowHighBets(newLowHighBets);
      setBalances((b) => {const n = [...b];n[pid] += removeAmount + rankRefund + colorRefund + riverRefund;return n;});
      if (colorRefund > 0 || riverRefund > 0) setShowAutoTrimToast(true);
      playChipRemove();
      checkAndResetIfNoBets(newHandBets, newRedBlackBets, newRankBets, newLowHighBets);
      return;
    }

    // --- Hand bets still remain. Cascade-trim rank/color/river to fit new totals. ---

    // Step 1: enforce rank slot limits and mathematical possibility
    const remainingHandCount = Object.keys(updatedHandBets).length;
    // Versions-aware rank slot calculation on hand removal
    const rankLockAtRemove = versions?.rankLockThreshold ?? 1;
    const slotsAllowed = remainingHandCount >= rankLockAtRemove
      ? 0
      : (versions?.maxRankSlots ?? 1);
    let rankRefund = 0;
    let updatedRankBets = { ...(rankBets[pid] || {}) };

    // Remove excess rank slots
    while (Object.keys(updatedRankBets).length > slotsAllowed) {
      const keyToRemove = Object.keys(updatedRankBets)[Object.keys(updatedRankBets).length - 1];
      rankRefund += updatedRankBets[keyToRemove];
      delete updatedRankBets[keyToRemove];
    }

    // Step 2: trim rank bet amounts so total rank ≤ total hand
    const newHandTotal = Object.values(updatedHandBets).reduce((s, v) => s + v, 0);
    let newRankTotal = Object.values(updatedRankBets).reduce((s, v) => s + v, 0);
    if (newRankTotal > newHandTotal) {
      let excess = newRankTotal - newHandTotal;
      const rankKeys = Object.keys(updatedRankBets);
      for (let i = rankKeys.length - 1; i >= 0 && excess > 0; i--) {
        const k = rankKeys[i];
        const trim = Math.min(updatedRankBets[k], excess);
        updatedRankBets[k] -= trim;
        if (updatedRankBets[k] <= 0) delete updatedRankBets[k];
        rankRefund += trim;
        excess -= trim;
      }
      newRankTotal = newHandTotal;
    }

    // Step 3: if rank total no longer equals hand total, gate closes → refund all color/river
    const gateStillOpen = isSideBetGateOpen(updatedHandBets, updatedRankBets);
    let colorRefund = 0;
    let riverRefund = 0;
    let updatedColorBets = { ...(redBlackBets[pid] || {}) };
    let updatedRiver = lowHighBets[pid] ? { ...lowHighBets[pid] } : null;

    if (!gateStillOpen) {
      // Gate closed — refund all color and river bets
      colorRefund = Object.values(updatedColorBets).reduce((s, v) => s + v, 0);
      riverRefund = updatedRiver?.amount || 0;
      updatedColorBets = {};
      updatedRiver = null;
    } else {
      // Gate still open — trim color/river to snowball caps
      const newFoundation = newHandTotal + newRankTotal;

      const colorTotal = Object.values(updatedColorBets).reduce((s, v) => s + v, 0);
      if (colorTotal > newFoundation) {
        let excess = colorTotal - newFoundation;
        const colorKeys = Object.keys(updatedColorBets);
        for (let i = colorKeys.length - 1; i >= 0 && excess > 0; i--) {
          const k = colorKeys[i];
          const trim = Math.min(updatedColorBets[k], excess);
          updatedColorBets[k] -= trim;
          if (updatedColorBets[k] <= 0) delete updatedColorBets[k];
          colorRefund += trim;
          excess -= trim;
        }
      }

      const riverAmt = updatedRiver?.amount || 0;
      if (riverAmt > newFoundation) {
        riverRefund = riverAmt - newFoundation;
        if (newFoundation <= 0) {
          updatedRiver = null;
        } else {
          updatedRiver = { ...updatedRiver, amount: newFoundation };
        }
      }
    }

    setHandBets((prev) => ({ ...prev, [pid]: updatedHandBets }));
    setRankBets((prev) => ({ ...prev, [pid]: updatedRankBets }));
    setRedBlackBets((prev) => ({ ...prev, [pid]: updatedColorBets }));
    setLowHighBets((prev) => ({ ...prev, [pid]: updatedRiver }));
    setBalances((b) => {const n = [...b];n[pid] += removeAmount + rankRefund + colorRefund + riverRefund;return n;});
    if (rankRefund > 0 || colorRefund > 0 || riverRefund > 0) setShowAutoTrimToast(true);
  }, [gamePhase, pid, selectedChip, handBets, rankBets, redBlackBets, lowHighBets]);

  const handleRankBet = useCallback((key) => {
    if (gamePhase !== 'betting') return;
    const existing = (rankBets[pid] || {})[key] || 0;

    // If already bet and player cannot afford to add more, treat as removal — bypass all cap checks
    if (existing > 0 && balance < selectedChip) {
      const remainingRankBets = { ...(rankBets[pid] || {}) };
      delete remainingRankBets[key];
      const gateStillOpen = isSideBetGateOpen(handBets[pid] || {}, remainingRankBets);
      if (!gateStillOpen) {
        const colorRefund = Object.values(redBlackBets[pid] || {}).reduce((s, v) => s + v, 0);
        const riverRefund = lowHighBets[pid]?.amount || 0;
        setRankBets((prev) => ({ ...prev, [pid]: remainingRankBets }));
        setRedBlackBets((prev) => ({ ...prev, [pid]: {} }));
        setLowHighBets((prev) => ({ ...prev, [pid]: null }));
        setBalances((b) => {const n = [...b];n[pid] += existing + colorRefund + riverRefund;return n;});
        if (colorRefund > 0 || riverRefund > 0) setShowAutoTrimToast(true);
      } else {
        setRankBets((prev) => ({ ...prev, [pid]: remainingRankBets }));
        setBalances((b) => {const n = [...b];n[pid] += existing;return n;});
      }
      return;
    }

    // --- ADD intent from here down ---

    // Versions config: rank locks when hands >= rankLockThreshold
    const rankLockAt = versions?.rankLockThreshold ?? 1;
    const currentHandCountForRank = Object.keys(handBets[pid] || {}).length;
    if (currentHandCountForRank >= rankLockAt) {
      setRankAlertType('closed');
      setShowRankLimitAlert(true);
      return;
    }

    // Must have at least 1 hand bet to place rank bets
    if (Object.keys(handBets[pid] || {}).length === 0) {
      setRankAlertType('no_hands');
      setShowRankLimitAlert(true);
      return;
    }

    // Versions config: rank slot limit driven by combined max
    const currentHandCount = Object.keys(handBets[pid] || {}).length;
    const currentRankSlots = Object.keys(pRankBets).length;
    const slotsAllowed = versions?.maxRankSlots ?? 1;
    if (!pRankBets[key] && currentRankSlots >= slotsAllowed) {
      setRankAlertType('limit');
      setShowRankLimitAlert(true);
      return;
    }

    // Snowball Rank Cap: total rank bets ≤ total hand bets (ADD only — moves/removals bypass this)
    if (!checkRankCap(handBets[pid] || {}, rankBets[pid] || {}, selectedChip, false)) {
      setCapAlertType('rank_cap');
      setShowCapAlert(true);
      return;
    }

    // Enforce minimum bet
    if (selectedChip < MIN_BET) return;

    // Insufficient funds to add
    if (balance < selectedChip) {
      setShowInsufficientFunds(true);
      return;
    }
    if (balance <= 0) return;

    setRankBets((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [key]: existing + selectedChip } }));
    setBalances((b) => {const n = [...b];n[pid] -= selectedChip;return n;});
    playChipPlace();
  }, [gamePhase, balance, selectedChip, pid, rankBets, handBets, pRankBets, versions]);

  const handleRemoveRankBet = useCallback((key) => {
    if (gamePhase !== 'betting') return;
    const existing = (rankBets[pid] || {})[key] || 0;
    if (existing <= 0) return;

    const remainingRankBets = { ...(rankBets[pid] || {}) };
    delete remainingRankBets[key];
    const isLastRankBet = !hasRankBet(remainingRankBets);

    // After removing this rank bet, check if the Phase 4 gate is still open
    const gateStillOpen = isSideBetGateOpen(handBets[pid] || {}, remainingRankBets);

    if (!gateStillOpen) {
      // Gate closed: cascade out all color and river bets
      const colorRefund = Object.values(redBlackBets[pid] || {}).reduce((s, v) => s + v, 0);
      const riverRefund = lowHighBets[pid]?.amount || 0;
      setRankBets((prev) => ({ ...prev, [pid]: remainingRankBets }));
      setRedBlackBets((prev) => ({ ...prev, [pid]: {} }));
      setLowHighBets((prev) => ({ ...prev, [pid]: null }));
      setBalances((b) => {const n = [...b];n[pid] += existing + colorRefund + riverRefund;return n;});
      if (colorRefund > 0 || riverRefund > 0) setShowAutoTrimToast(true);
    } else {
      // Gate still open: just remove this rank bet, color/river stay
      setRankBets((prev) => ({ ...prev, [pid]: remainingRankBets }));
      setBalances((b) => {const n = [...b];n[pid] += existing;return n;});
    }
    playChipRemove();
  }, [gamePhase, pid, rankBets, handBets, redBlackBets, lowHighBets, versions]);

  const handleMoveRankBet = useCallback((fromKey, toKey) => {
    if (gamePhase !== 'betting') return;
    if (fromKey === toKey) return;
    const currentRankBets = rankBets[pid] || {};
    const fromAmt = currentRankBets[fromKey] || 0;
    if (fromAmt <= 0) return;

    const currentHandCount = Object.keys(handBets[pid] || {}).length;
    const rlAt = versions?.rankLockThreshold ?? 1;
    const slotsAllowed = currentHandCount >= rlAt ? 0 : (versions?.maxRankSlots ?? 1);
    const toAmt = currentRankBets[toKey] || 0;

    // Build the updated rank bets after the move
    const updated = { ...currentRankBets };
    delete updated[fromKey];
    updated[toKey] = toAmt + fromAmt;

    // Check slot count — moving to an empty slot must stay within limit
    const newSlotCount = Object.keys(updated).length;
    if (newSlotCount > slotsAllowed) return;

    // Enforce total rank bets <= total hand bets (amounts don't change on a move, so this always passes)
    const totalHandAmt = getTotalHandBets(handBets[pid] || {});
    const totalRankAmt = Object.values(updated).reduce((s, v) => s + v, 0);
    if (totalRankAmt > totalHandAmt) return;

    setRankBets((prev) => ({ ...prev, [pid]: updated }));
  }, [gamePhase, pid, rankBets, handBets]);

  const handleRedBlackBet = useCallback((key) => {
    if (gamePhase !== 'betting') return;
    const existing = (redBlackBets[pid] || {})[key] || 0;

    // Removal path: existing bet + insufficient funds to add more → refund and remove
    if (existing > 0 && balance < selectedChip) {
      setRedBlackBets((prev) => {const n = { ...(prev[pid] || {}) };delete n[key];return { ...prev, [pid]: n };});
      setBalances((b) => {const n = [...b];n[pid] += existing;return n;});
      return;
    }

    // --- ADD intent from here down ---

    // Versions config: color market locks at rankLockThreshold hands
    const colorHandCount = Object.keys(handBets[pid] || {}).length;
    if (colorHandCount >= (versions?.rankLockThreshold ?? 1)) {
      setCapAlertType('color_locked');
      setShowCapAlert(true);
      return;
    }

    // Phase 4 Gate: Color Board requires rank total === hand total
    if (!isSideBetGateOpen(handBets[pid] || {}, rankBets[pid] || {})) {
      setCapAlertType('color_needs_rank');
      setShowCapAlert(true);
      return;
    }

    // Color Side Lock: player may only bet Red OR Black — not both
    const currentColorBets = redBlackBets[pid] || {};
    const hasRedBet  = ['3R','4R','5R'].some(k => (currentColorBets[k] || 0) > 0);
    const hasBlackBet = ['3B','4B','5B'].some(k => (currentColorBets[k] || 0) > 0);
    const isRedKey   = ['3R','4R','5R'].includes(key);
    const isBlackKey = ['3B','4B','5B'].includes(key);
    // Versions config: color both sides allowed?
    if (!versions?.colorBothSides) {
      if (isRedKey && hasBlackBet) { setShowColorSideAlert(true); return; }
      if (isBlackKey && hasRedBet) { setShowColorSideAlert(true); return; }
    }

    // Snowball Color Cap: total color bets ≤ total hand bets + total rank bets (ADD only)
    if (!checkColorCap(handBets[pid] || {}, rankBets[pid] || {}, redBlackBets[pid] || {}, selectedChip)) {
      setCapAlertType('color_cap');
      setShowCapAlert(true);
      return;
    }

    // Enforce minimum bet
    if (selectedChip < MIN_BET) return;

    // Insufficient funds to add
    if (balance < selectedChip) {
      setShowInsufficientFunds(true);
      return;
    }
    if (balance <= 0) return;

    setRedBlackBets((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [key]: existing + selectedChip } }));
    setBalances((b) => {const n = [...b];n[pid] -= selectedChip;return n;});
    playChipPlace();
  }, [gamePhase, balance, selectedChip, pid, redBlackBets, handBets, rankBets]);

  const handleRemoveRedBlackBet = useCallback((key) => {
    if (gamePhase !== 'betting') return;
    const existing = (redBlackBets[pid] || {})[key] || 0;
    if (existing <= 0) return;
    setRedBlackBets((prev) => {const n = { ...(prev[pid] || {}) };delete n[key];return { ...prev, [pid]: n };});
    setBalances((b) => {const n = [...b];n[pid] += existing;return n;});
    playChipRemove();
  }, [gamePhase, pid, redBlackBets]);

  const handleLowHighBet = useCallback((type) => {
    if (gamePhase !== 'lowHighBetting') return;
    const currentRiverAmt = pLowHighBet?.amount || 0;

    // Phase 4 Gate: River requires rank total === hand total
    if (!isSideBetGateOpen(handBets[pid] || {}, rankBets[pid] || {})) {
      setCapAlertType('river_needs_rank');
      setShowCapAlert(true);
      return;
    }

    // Snowball River Cap: river bet ≤ total hand + rank + color
    if (!checkRiverCap(handBets[pid] || {}, rankBets[pid] || {}, redBlackBets[pid] || {}, currentRiverAmt, selectedChip)) {
      setCapAlertType('river_cap');
      setShowCapAlert(true);
      return;
    }

    // Also enforce the legacy board-total cap (River ≤ board total)
    const boardBet = Object.values(handBets[pid] || {}).reduce((s, v) => s + v, 0) +
    Object.values(redBlackBets[pid] || {}).reduce((s, v) => s + v, 0) +
    Object.values(rankBets[pid] || {}).reduce((s, v) => s + v, 0);
    const current = pLowHighBet && pLowHighBet.type === type ? pLowHighBet.amount : 0;
    const remaining = boardBet - current;
    if (remaining <= 0) return;
    const addAmount = Math.min(selectedChip, remaining);

    if (balance <= 0 || balance < addAmount) return;
    setLowHighBets((prev) => ({ ...prev, [pid]: { type, amount: (prev[pid]?.type === type ? prev[pid].amount : 0) + addAmount } }));
    setBalances((b) => {const n = [...b];n[pid] -= addAmount;return n;});
    playChipPlace();
  }, [gamePhase, balance, selectedChip, handBets, redBlackBets, rankBets, pLowHighBet, pid]);

  const handleRemoveLowHighBet = useCallback(() => {
    // Can only remove Low/High bet during lowHighBetting phase (after turn, before river)
    if (gamePhase !== 'lowHighBetting') return;
    if (!pLowHighBet || pLowHighBet.amount <= 0) return;
    setBalances((b) => {const n = [...b];n[pid] += pLowHighBet.amount;return n;});
    setLowHighBets((prev) => ({ ...prev, [pid]: null }));
    playChipRemove();
  }, [gamePhase, pid, pLowHighBet]);

  // Drag-drop: see hooks/useDropChip.js (extracted to reduce file size)
  const handleDropChip = useDropChip({ gamePhase, handBets, rankBets, redBlackBets, lowHighBets, versions, setHandBets, setRankBets, setRedBlackBets, setLowHighBets, setBalances, setShowAutoTrimToast });

  // Helper: check if ALL players have zero bets and reset board if timer is active
  const checkAndResetIfNoBets = (updatedHandBets, updatedRedBlackBets, updatedRankBets, updatedLowHighBets) => {
    const anyBetsRemain = Array.from({ length: playerCount }, (_, i) => i).some((i) => {
      return (
        Object.keys(updatedHandBets[i] || {}).length > 0 ||
        Object.keys(updatedRedBlackBets[i] || {}).length > 0 ||
        Object.keys(updatedRankBets[i] || {}).length > 0 ||
        (updatedLowHighBets[i]?.amount || 0) > 0);
    });
    // Timing mode: if all bets are removed, cancel the betting countdown
    if (!anyBetsRemain && timerActiveRef.current) {
      stopTimer();
      timerActiveRef.current = false;
      setCountdownActive(false);
      setCountdownTime(0);
    }
  };

  const clearBets = () => {
    // Timing mode: cancel any active countdown
    if (timerActiveRef.current) {
      stopTimer();
      timerActiveRef.current = false;
      setCountdownActive(false);
      setCountdownTime(0);
    }
    const riverRefund = pLowHighBet?.amount || 0;
    const refund = Object.values(pHandBets).reduce((s, v) => s + v, 0) +
    Object.values(pRedBlackBets).reduce((s, v) => s + v, 0) +
    Object.values(pRankBets).reduce((s, v) => s + v, 0) +
    riverRefund;
    setBalances((b) => {const n = [...b];n[pid] += refund;return n;});
    const newHandBets = { ...handBets, [pid]: {} };
    const newRedBlackBets = { ...redBlackBets, [pid]: {} };
    const newRankBets = { ...rankBets, [pid]: {} };
    const newLowHighBets = { ...lowHighBets, [pid]: null };
    setHandBets(newHandBets);
    setRedBlackBets(newRedBlackBets);
    setRankBets(newRankBets);
    setLowHighBets(newLowHighBets);
    checkAndResetIfNoBets(newHandBets, newRedBlackBets, newRankBets, newLowHighBets);
  };

  // ---- GAME FLOW ----
  const handleDealFlop = useCallback(() => {
    if (gamePhase !== 'betting') return;
    stopTimer();
    timerActiveRef.current = false;
    setCountdownActive(false);

    // ── Phase 2 GLI-19: open AuditRound record (bets now locked) ─────────────
    // IMPORTANT: read from REFS not closure variables — refs always hold current state.
    // Skip if we are resuming a recovered round — record already exists in DB
    // Generate board BEFORE audit block so it can be saved for crash recovery
    const board5 = getSecureRandomBoard();

    if (!isResumingRound.current) {
    const pid             = activePlayerRef.current;
    const liveHandBets    = handBetsRef.current;
    const liveRankBets    = rankBetsRef.current;
    const liveColorBets   = redBlackBetsRef.current;
    const liveLowHighBets = lowHighBetsRef.current;
    const liveBalances    = balancesRef.current;
    const liveVersions    = versionsRef.current;

    const auditHandBets   = liveHandBets[pid]   || {};
    const auditRankBets   = liveRankBets[pid]   || {};
    const auditColorBets  = liveColorBets[pid]  || {};
    const auditLowHighBet = liveLowHighBets[pid] || null;

    const auditTotalWagered =
      Object.values(auditHandBets).reduce((s,v)=>s+v,0)  +
      Object.values(auditRankBets).reduce((s,v)=>s+v,0)  +
      Object.values(auditColorBets).reduce((s,v)=>s+v,0) +
      (auditLowHighBet?.amount || 0);

    // balanceBefore = current balance + bets already deducted = pre-bet balance
    const balanceBefore = (liveBalances[pid] ?? 0) + auditTotalWagered;

    if (auditTotalWagered > 0) {
      const auditRoundNum = getNextRoundNumber();
      openRound({
        roundNumber:      auditRoundNum,
        balanceBefore:    balanceBefore,
        handBets:         auditHandBets,
        rankBets:         auditRankBets,
        colorBets:        auditColorBets,
        lowHighBet:       auditLowHighBet,
        totalWagered:     auditTotalWagered,
        killSwitchActive: isKillSwitchActive(Object.keys(auditHandBets).length, liveVersions?.rankLockThreshold ?? 1),
        playerSlot:       pid,
        versionsSnapshot: liveVersions ? { ...liveVersions } : {},
        boardCards:       board5,   // save full 5-card board for crash recovery
      });
    } // end auditTotalWagered > 0 guard
    } // end !isResumingRound guard
    isResumingRound.current = false; // reset for next round
    // ─────────────────────────────────────────────────────────────────────────

    // board5 was generated above (before the audit block) and passed to openRound for recovery
    const flop = [board5[0], board5[1], board5[2]];
    setCommunityCards(flop);
    setDeck(board5);
    setDeckIndex(3);
    playCardDeal();

    const leader = findLeadingHand(flop);
    setLeadingHandIds(leader ? leader.handIds : []);
    setLeadingRank(leader ? leader.handResult.name : null);

    const leaderHand = leader ? FIXED_HANDS.find((h) => h.id === leader.handIds[0]) : null;
    const leaderCards = leaderHand ? leaderHand.cards.map((c) => `${c.rank}${SUITS[c.suit]}`).join(' & ') : '';
    setDealerMessage(
      leader ?
      `Flop: ${flop.map(cardDisplay).join(' ')} — ${leaderCards} leads (${leader.handResult.name})` :
      `Flop: ${flop.map(cardDisplay).join(' ')}`
    );
    setGamePhase('flop');
  }, [gamePhase, stopTimer, openRound, getNextRoundNumber]);

  const handleDealTurn = useCallback(() => {
    if (gamePhase !== 'flop') return;
    const turnCard = deck[deckIndex];
    const newComm = [...communityCards, turnCard];
    setCommunityCards(newComm);
    setDeckIndex((i) => i + 1);
    playCardDeal();

    const leader = findLeadingHand(newComm);
    setLeadingHandIds(leader ? leader.handIds : []);
    setLeadingRank(leader ? leader.handResult.name : null);

    const leaderHand = leader ? FIXED_HANDS.find((h) => h.id === leader.handIds[0]) : null;
    const leaderCards = leaderHand ? leaderHand.cards.map((c) => `${c.rank}${SUITS[c.suit]}`).join(' & ') : '';

    setDealerMessage(
      `Turn: ${cardDisplay(turnCard)}${leaderCards ? ` — ${leaderCards} leads (${leader.handResult.name})` : ''} — River bet now open!`
    );
    setGamePhase('lowHighBetting');

    // ── Timing mode: start river betting countdown ───────────────────────
    if (!dealerModeRef.current) {
      timerActiveRef.current = true;
      setCountdownActive(true);
      startTimer(
        timing.riverBetting,
        (remaining) => setCountdownTime(remaining),
        () => {
          timerActiveRef.current = false;
          setCountdownActive(false);
          setTimeout(() => handleDealRiverRef.current?.(), 100);
        }
      );
    }
  }, [gamePhase, deck, deckIndex, communityCards, timing, startTimer]);

  const handleDealRiver = useCallback(() => {
    if (gamePhase !== 'lowHighBetting') return;
    stopTimer();
    timerActiveRef.current = false;
    setCountdownActive(false);

    const riverCard = deck[deckIndex];
    const newComm = [...communityCards, riverCard];
    setCommunityCards(newComm);
    setDeckIndex((i) => i + 1);
    playCardDeal();

    const leader = findLeadingHand(newComm);
    setLeadingHandIds([]);
    setLeadingRank(null);
    setWinnerHandIds(leader ? leader.handIds : []);
    setWinningRank(leader?.handResult?.name ?? null);

    const winRB = resolveRedBlack(newComm);
    const winLH = resolveLowHigh(riverCard);
    setWinningRedBlack(winRB);
    setWinningLowHigh(winLH);

    const reds = newComm.filter((c) => cardColor(c) === 'red').length;
    const blacks = newComm.length - reds;
    const leaderHand = leader && !leader.communityBoardWin ? FIXED_HANDS.find((h) => h.id === leader.handIds[0]) : null;
    const leaderCards = leaderHand ? leaderHand.cards.map((c) => `${c.rank}${SUITS[c.suit]}`).join(' & ') : '';

    setDealerMessage(
      leader?.communityBoardWin ?
      `Board Wins! All Hand bets lose. Board: ${reds}R / ${blacks}B — River: ${winLH}` :
      leader ?
      `Winner: ${leaderCards} — ${leader.handResult.name}! Board: ${reds}R / ${blacks}B — River: ${winLH}` :
      `River: ${cardDisplay(riverCard)}`
    );
    setGamePhase('river');

    const leaderResult = leader?.handResult;
    const snapHandBets = { ...handBets };
    const snapRedBlackBets = { ...redBlackBets };
    const snapRankBets = { ...rankBets };
    const snapLowHighBets = { ...lowHighBets };

    timerActiveRef.current = true;
    setTimeout(() => {
      settleRef.current?.(newComm, leader, winRB, winLH, leaderHand, leaderResult, snapHandBets, snapRedBlackBets, snapRankBets, snapLowHighBets);
    }, timing.riverReveal * 1000);
  }, [gamePhase, deck, deckIndex, communityCards, handBets, redBlackBets, rankBets, lowHighBets, timing, stopTimer]);

  // Keep ref in sync so handleDealTurn can call the latest version without circular dependency
  handleDealRiverRef.current = handleDealRiver;

  const settle = (finalComm, leader, winRB, winLH, leaderHand, handResult, snapHandBets, snapRedBlackBets, snapRankBets, snapLowHighBets) => {
    const bellCurveReductions = {
      hand: bellCurveConfig.handReductions,
      rank: bellCurveConfig.rankReductions,
    };
    // Use centralized payouts (imported at top of file)

    let totalBetsAllPlayers = 0;
    let totalWinningsAllPlayers = 0;
    const playerWinnings = [];

    const playerPayouts = [];

    for (let i = 0; i < playerCount; i++) {
      const ph = snapHandBets[i] || {};
      const prb = snapRedBlackBets[i] || {};
      const prk = snapRankBets[i] || {};
      const plh = snapLowHighBets[i] || null;

      let w = 0;
      const wins = [];

      // Carded hand bets
      if (leader) {
        const numWinners = leader.handIds.length;
        leader.handIds.forEach((wid) => {
          const bet = ph[wid] || 0;
          if (bet > 0) {
            const hand = FIXED_HANDS.find((h) => h.id === wid);
            const playerHandBetCount = Object.values(ph).filter(b => b > 0).length;
            const handReductionPct = bellCurveReductions.hand[Math.min(playerHandBetCount - 1, bellCurveReductions.hand.length - 1)] || 0;
            const baseRatio = calculateTiePayout(hand.payout, numWinners);
            const effectiveRatio = baseRatio * (1 - handReductionPct / 100);
            const payout = calculatePayout(bet, effectiveRatio);
            w += payout;
            const oddsLabel = numWinners > 1
              ? `${effectiveRatio.toFixed(2)}:1 (tie/${numWinners}${handReductionPct > 0 ? `, -${handReductionPct}%` : ''})`
              : handReductionPct > 0 ? `${effectiveRatio.toFixed(2)}:1 (-${handReductionPct}%)` : `${hand.payout}:1`;
            wins.push({
              label: `Hand ${wid}`,
              bet,
              odds: oddsLabel,
              payout,
              boardType: 'card'
            });
          }
        });
      }

      // Red/Black
      winRB.forEach((key) => {
        const bet = prb[key] || 0;
        if (bet > 0) {
          const ratio = COLOR_BOARD_PAYOUTS[key];
          const payout = calculatePayout(bet, ratio);
          w += payout;
          wins.push({
            label: key,
            bet,
            odds: `${ratio}:1`,
            payout,
            boardType: 'color'
          });
        }
      });

      // Low/High — payout uses state-specific odds based on 4-card turn board
      if (plh && winLH === plh.type) {
        const lhRatio = getDynamicRiverPayout(finalComm, plh.type);
        const payout = calculatePayout(plh.amount, lhRatio);
        w += payout;
        wins.push({
          label: plh.type,
          bet: plh.amount,
          odds: `${lhRatio}:1`,
          payout,
          boardType: 'river'
        });
        if (i === activePlayer) triggerRiverWin();
      }

      if (leader && !leader.communityBoardWin && Object.keys(prk).length > 0) {
        // All tied winners share the same rank — find it from the first winner.
        let actualWinnerRankName = null;
        for (const wid of leader.handIds) {
          const hand = FIXED_HANDS.find((h) => h.id === wid);
          if (!hand) continue;
          const result = evaluateBestHand(hand.cards, finalComm);
          if (result) { actualWinnerRankName = result.name; break; }
        }

        if (actualWinnerRankName) {
          // Average the per-hand rank odds across ALL winning hands for fairness.
          // When 2+ hands share a win, paying only one hand's odds felt arbitrary;
          // the mean of every winning hand's odds is now the settled Rank payout.
          const winnerOdds = [];
          for (const wid of leader.handIds) {
            const ratio = getPerHandRankPayout(wid, actualWinnerRankName);
            if (ratio !== null && ratio !== undefined) winnerOdds.push(ratio);
          }
          const isAveraged = winnerOdds.length > 1;
          const baseRankRatio = winnerOdds.length > 0
            ? (isAveraged ? winnerOdds.reduce((s, r) => s + r, 0) / winnerOdds.length : winnerOdds[0])
            : null;

          if (baseRankRatio !== null) {
            for (const [rankKey, rankBetAmt] of Object.entries(prk)) {
              if (rankBetAmt <= 0) continue;
              if (rankKey === actualWinnerRankName) {
                const playerRankBetCount = Object.values(prk).filter(b => b > 0).length;
                const rankReductionPct = bellCurveReductions.rank[Math.min(playerRankBetCount - 1, bellCurveReductions.rank.length - 1)] || 0;
                const effectiveRankRatio = baseRankRatio * (1 - rankReductionPct / 100);
                const payout = calculatePayout(rankBetAmt, effectiveRankRatio);
                w += payout;
                wins.push({
                  label: rankKey,
                  bet: rankBetAmt,
                  odds: rankReductionPct > 0
                    ? `${effectiveRankRatio.toFixed(2)}:1 (-${rankReductionPct}%)`
                    : (isAveraged ? `${baseRankRatio.toFixed(2)}:1 (avg/${winnerOdds.length})` : `${baseRankRatio}:1`),
                  payout,
                  boardType: 'rank'
                });
              }
            }
          }
        }
      }

      // Total bets for this player
      const playerTotalBet =
      Object.values(ph).reduce((s, v) => s + v, 0) +
      Object.values(prb).reduce((s, v) => s + v, 0) +
      Object.values(prk).reduce((s, v) => s + v, 0) + (
      plh?.amount || 0);

      totalBetsAllPlayers += playerTotalBet;
      totalWinningsAllPlayers += w;
      // Push total payout (balance update will add this to current balance)
      playerWinnings.push(w);

      // Build payout display data (net = payout - bet)
      // Build placed-bets snapshot for non-winning quadrant display
      const placedBets = {
        card: Object.entries(ph)
          .filter(([, amt]) => amt > 0)
          .map(([hid, amt]) => {
            const hand = FIXED_HANDS.find(h => h.id === parseInt(hid));
            return { label: hand ? `Hand ${hand.id}` : `Hand ${hid}`, bet: amt };
          }),
        color: Object.entries(prb)
          .filter(([, amt]) => amt > 0)
          .map(([key, amt]) => ({ label: key, bet: amt })),
        rank: Object.entries(prk)
          .filter(([, amt]) => amt > 0)
          .map(([key, amt]) => ({ label: key, bet: amt })),
        river: plh && plh.amount > 0 ? [{ label: plh.type, bet: plh.amount }] : [],
      };

      playerPayouts.push({
        wins,
        placedBets,
        totalBet: playerTotalBet,
        netWin: w - playerTotalBet
      });
    }

    setPreviousBets({
      handBets: snapHandBets,
      redBlackBets: snapRedBlackBets,
      rankBets: snapRankBets,
      totalBet: totalBetsAllPlayers
    });

    setBalances((prev) => {
      const n = [...prev];
      for (let i = 0; i < playerCount; i++) { n[i] = Math.max(0, n[i] + playerWinnings[i]); }
      return n;
    });

    // Update player stats
    setPlayerStats((prev) => {
      const updated = { ...prev };
      for (let i = 0; i < playerCount; i++) {
        const playerBet = Object.values(snapHandBets[i] || {}).reduce((s, v) => s + v, 0) +
        Object.values(snapRedBlackBets[i] || {}).reduce((s, v) => s + v, 0) +
        Object.values(snapRankBets[i] || {}).reduce((s, v) => s + v, 0) + (
        snapLowHighBets[i]?.amount || 0);

        const playerWin = playerWinnings[i] || 0;
        const multiplier = playerBet > 0 ? playerWin / playerBet : 0;

        const prev_i = updated[i] || { totalBets: 0, totalWins: 0, roundsPlayed: 0, roundsWon: 0, highestMultiplier: 0, highestBalance: null, highestBalanceRound: null, lowestBalance: null, lowestBalanceRound: null };
        const postRoundBalance = Math.max(0, (balancesRef.current[i] ?? balances[i] ?? 0) + playerWin);
        const currentRound = roundsPlayed + 1;
        const newHighest = prev_i.highestBalance === null || postRoundBalance > prev_i.highestBalance;
        const newLowest = prev_i.lowestBalance === null || postRoundBalance < prev_i.lowestBalance;
        updated[i] = {
          totalBets: prev_i.totalBets + playerBet,
          totalWins: prev_i.totalWins + playerWin,
          roundsPlayed: prev_i.roundsPlayed + (playerBet > 0 ? 1 : 0),
          roundsWon: prev_i.roundsWon + (playerWin > playerBet ? 1 : 0),
          highestMultiplier: Math.max(prev_i.highestMultiplier, multiplier),
          highestBalance: newHighest ? postRoundBalance : prev_i.highestBalance,
          highestBalanceRound: newHighest ? currentRound : prev_i.highestBalanceRound,
          lowestBalance: newLowest ? postRoundBalance : prev_i.lowestBalance,
          lowestBalanceRound: newLowest ? currentRound : prev_i.lowestBalanceRound
        };
      }
      return updated;
    });

    // Casino profit = total bets - total winnings paid out
    const roundProfit = totalBetsAllPlayers - totalWinningsAllPlayers;
    setCasinoProfit((p) => p + roundProfit);
    setRoundsPlayed((r) => r + 1);

    // Phase 1 GLI-19: persist session stats to DB after every settled round
    const activePlayerTotalBet2 = Object.values(snapHandBets[activePlayer] || {}).reduce((s,v)=>s+v,0)
      + Object.values(snapRedBlackBets[activePlayer] || {}).reduce((s,v)=>s+v,0)
      + Object.values(snapRankBets[activePlayer] || {}).reduce((s,v)=>s+v,0)
      + ((snapLowHighBets[activePlayer] || null)?.amount || 0);
    if (activePlayerTotalBet2 > 0) {
      recordRoundResult(activePlayer, {
        wagered:  activePlayerTotalBet2,
        returned: playerWinnings[activePlayer] || 0,
      });
    }

    // ── Phase 2 GLI-19: settle AuditRound with full outcome ──────────────────
    {
      const ap = activePlayer;
      const apHandBets  = snapHandBets[ap]    || {};
      const apColorBets = snapRedBlackBets[ap]|| {};
      const apRankBets  = snapRankBets[ap]    || {};
      const apLowHighBet= snapLowHighBets[ap] || null;
      const apPayout    = playerWinnings[ap]  || 0;
      const apBetTotal  = Object.values(apHandBets).reduce((s,v)=>s+v,0)
        + Object.values(apColorBets).reduce((s,v)=>s+v,0)
        + Object.values(apRankBets).reduce((s,v)=>s+v,0)
        + (apLowHighBet?.amount || 0);
      const balBefore = balancesRef.current[ap] ?? balances[ap] ?? 0;
      const balAfter  = Math.max(0, balBefore + apPayout);

      const apCardWin  = (leader?.handIds || []).some(wid => apHandBets[wid] > 0) || (leader?.communityBoardWin && Object.values(apHandBets).some(v=>v>0));
      const apRankWin  = !!(handResult?.name && Object.entries(apRankBets).some(([k,v])=>v>0 && k===handResult.name));
      const apColorWin = winRB.length > 0 && winRB.some(wc => (apColorBets[wc]||0) > 0);
      const apRiverWin = !!(winLH && apLowHighBet?.amount > 0 && apLowHighBet?.type === winLH);

      settleRound({
        communityCards: finalComm.map(c => ({ rank: c.rank, suit: SUITS[c.suit] })),
        winnerHandIds:  leader?.handIds || [],
        winningRank:    handResult?.name || null,
        winningColors:  winRB || [],
        winningLowHigh: winLH || null,
        isBoardWin:     leader?.communityBoardWin || false,
        cardWin:        apCardWin,
        rankWin:        apRankWin,
        colorWin:       apColorWin,
        riverWin:       apRiverWin,
        totalReturned:  apPayout,
        balanceAfter:   balAfter,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    setGamePhase('winner');

    // Delay display window by 1 second
    setTimeout(() => {
      setLastWinInfo({
        playerPayouts,
        playerCount
      });
      setDisplayWindowVisible(true);
    }, 1000);

    const reds = finalComm.filter((c) => cardColor(c) === 'red').length;
    const blacks = finalComm.length - reds;
    const colorResult = (winRB && winRB.length > 0) ? winRB[winRB.length - 1] : (reds >= blacks ? `${reds}R` : `${blacks}B`);

    const isBoardWin = leader?.communityBoardWin === true;
    const winnerHandA = !isBoardWin && leader?.handIds?.length >= 1 ?
    FIXED_HANDS.find((h) => h.id === leader.handIds[0]) :
    null;
    const winnerHandB = !isBoardWin && leader?.handIds?.length >= 2 ?
    FIXED_HANDS.find((h) => h.id === leader.handIds[1]) :
    null;

    // ── Analytics data capture ────────────────────────────────────────────────
    const redsCount = finalComm.filter(c => cardColor(c) === 'red').length;
    const activePlayerHandBets = snapHandBets[activePlayer] || {};
    const activePlayerColorBets = snapRedBlackBets[activePlayer] || {};
    const activePlayerRankBets = snapRankBets[activePlayer] || {};
    const activePlayerLowHighBet = snapLowHighBets[activePlayer] || null;
    const activePlayerTotalBet = Object.values(activePlayerHandBets).reduce((s, v) => s + v, 0) +
      Object.values(activePlayerColorBets).reduce((s, v) => s + v, 0) +
      Object.values(activePlayerRankBets).reduce((s, v) => s + v, 0) +
      (activePlayerLowHighBet?.amount || 0);
    const activePlayerPayout = playerWinnings[activePlayer] || 0;
    const activeBal = balancesRef.current[activePlayer] ?? balances[activePlayer] ?? 0;
    const roundData = {
      roundId,
      sessionId: 'live_' + Date.now(),
      communityCards: finalComm.map(c => ({ rank: c.rank, suit: SUITS[c.suit] })),
      winnerHandIds: leader?.handIds || [],
      winningRank: handResult?.name || null,
      winningColors: winRB || [],
      winningLowHigh: winLH || null,
      isBoardWin: leader?.communityBoardWin || false,
      handBets: activePlayerHandBets,
      rankBets: activePlayerRankBets,
      colorBets: activePlayerColorBets,
      lowHighBet: activePlayerLowHighBet,
      killSwitchActive: isKillSwitchActive(Object.keys(activePlayerHandBets).length, versions?.rankLockThreshold ?? 1),
      handBetCount: Object.keys(activePlayerHandBets).filter(k => (activePlayerHandBets[k] || 0) > 0).length,
      totalBet: activePlayerTotalBet,
      totalPayout: activePlayerPayout,
      netResult: activePlayerPayout - activePlayerTotalBet,
      balanceBefore: activeBal,
      balanceAfter: Math.max(0, activeBal + activePlayerPayout),
      redsCount,
      blacksCount: finalComm.length - redsCount,
      riverCard: finalComm.length > 0 ? finalComm[finalComm.length-1]?.rank + SUITS[finalComm[finalComm.length-1]?.suit] : null,
    };
    // ── GA4 Event Tracking — card, rank, color, river outcomes ──────────────
    trackRoundOutcome(roundData);
    // ── Analytics DB — fire-and-forget save to GameEvent entity ──────────────
    console.log('[Analytics] saveEvent firing', { roundId: roundData.roundId, totalBet: roundData.totalBet });
    base44.functions.invoke('gameAnalytics', {
      action: 'saveEvent',
      eventData: {
        event_type: 'round_settled',
        round_id: roundData.roundId,
        session_id: String(roundData.sessionId || 'live'),
        total_bet: roundData.totalBet || 0,
        total_payout: roundData.totalPayout || 0,
        net_result: (roundData.totalPayout || 0) - (roundData.totalBet || 0),
        card_win: (roundData.winnerHandIds || []).length > 0 || roundData.isBoardWin,
        // rank_win: true only if player's specific bet rank matches the actual winning rank
        rank_win: !!(roundData.winningRank &&
          Object.entries(roundData.rankBets || {}).some(([key, amt]) => amt > 0 && key === roundData.winningRank)),
        color_win: (roundData.winningColors || []).length > 0 &&
          (roundData.winningColors || []).some(wc => Number((roundData.colorBets || {})[wc] || 0) > 0),
        // river_win: true only if player's bet side (LOW/HIGH) matches the board outcome
        river_win: !!(roundData.winningLowHigh &&
          roundData.lowHighBet?.amount > 0 &&
          roundData.lowHighBet?.type === roundData.winningLowHigh),
        winning_rank: roundData.winningRank || null,
        winning_colors: roundData.winningColors || [],
        winning_low_high: roundData.winningLowHigh || null,
        winner_hand_ids: roundData.winnerHandIds || [],
        hand_bets: roundData.handBets || {},
        rank_bets: roundData.rankBets || {},
        color_bets: roundData.colorBets || {},
        low_high_bet: roundData.lowHighBet || null,
        kill_switch_active: roundData.killSwitchActive || false,
        hand_bet_count: roundData.handBetCount || 0,
        is_board_win: roundData.isBoardWin || false,
      }
    }).then((res) => { console.log('[Analytics] saveEvent OK', res?.data); })
      .catch((e) => { console.error('[Analytics saveEvent failed]', e?.response?.data || e?.message || e); }); // never blocks gameplay
    // ─────────────────────────────────────────────────────────────────────────

    setHistory((prev) => {
      const next = [{ _key: `${Date.now()}_${Math.random()}`, roundId, isBoardWin, handRank: handResult?.name || 'No Hand', cardsA: winnerHandA?.cards || [], cardsB: winnerHandB?.cards || [], colorResult, colorWinners: winRB, lowHighResult: winLH || '-' }, ...prev].slice(0, 200);
      try { localStorage.setItem('rfth_history', JSON.stringify(next)); } catch {}
      return next;
    });

    timerActiveRef.current = true;
  };
  settleRef.current = settle;

  // Reset Bank handler — shared by desktop and mobile
  const handleResetBank = () => {
    abandonRound(); // Phase 2 GLI-19: mark any open AuditRound as abandoned
    resetAllBalances(); // server-authoritative reset via usePlayerSession
    setActiveDeckSet(0); // reset to baseline deck set to match round 1
    // Reset Bank also resets hand display order to original positions
    setHandDisplayOrder([1,2,3,4,5,6,7,8,9,10]);
    setRoundId(1);
    setCasinoProfit(0);
    setRoundsPlayed(0);
  };

  const handleNewRound = useCallback(() => {
    stopTimer();
    timerActiveRef.current = false;
    setCountdownActive(false);
    setHandBets({}); setRedBlackBets({}); setRankBets({}); setLowHighBets({});
    setCommunityCards([]); setLeadingHandIds([]); setWinnerHandIds([]);
    setWinningRedBlack([]); setWinningLowHigh(null); setWinningRank(null);
    setLeadingRank(null); setLastWinInfo(null);
    setDisplayWindowVisible(false);
    setRoundId((r) => {
      const next = r + 1;
      // Switch deck set — only if suit variation is enabled in Control settings
      const ctrlSettings = getControlSettings();
      if (ctrlSettings.suitVariation) {
        setActiveDeckSet(next % 2 === 0 ? 1 : 0);
      } else {
        setActiveDeckSet(0); // locked to Original deck
      }
      return next;
    });
    setDeck(getSecureRandomBoard()); setDeckIndex(0);
    setDealerMessage("Bets open — Place Hand, Rank & Color bets now.");
    setGamePhase('betting');
    setActivePlayer(0);
    // Shuffle hand display order — only if position rotation is enabled in Control settings
    const ctrlSettings2 = getControlSettings();
    if (ctrlSettings2.positionRotation) {
      setHandDisplayOrder(() => {
        const ids = [1,2,3,4,5,6,7,8,9,10];
        const buf = new Uint32Array(1);
        const randBelow = (n) => {
          const limit = Math.floor(4294967296 / n) * n;
          let v;
          do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
          return v % n;
        };
        for (let i = ids.length - 1; i > 0; i--) {
          const j = randBelow(i + 1);
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        return ids;
      });
    } else {
      setHandDisplayOrder([1,2,3,4,5,6,7,8,9,10]); // locked to original positions
    }
    // NOTE: history is intentionally NOT cleared here — it accumulates across rounds
  }, [stopTimer]);

  // ── Auto-progression (Timing mode only) ──────────────────────────────────
  // Flop → Turn: auto-deal after flopReveal seconds
  useEffect(() => {
    if (gamePhase !== 'flop') return;
    if (dealerModeRef.current) return; // skip in Dealer mode

    // Resume guard: skip auto-timer for one render cycle after crash recovery
    if (isResumingRound.current) {
      isResumingRound.current = false;
      const resumeTimer = setTimeout(() => handleDealTurn(), timing.flopReveal * 1000);
      return () => clearTimeout(resumeTimer);
    }

    const timer = setTimeout(() => {
      handleDealTurn();
    }, timing.flopReveal * 1000);
    return () => clearTimeout(timer);
  }, [gamePhase, timing.flopReveal, handleDealTurn]);

  // Winner → New Round: auto-start after endOfRound seconds
  useEffect(() => {
    if (gamePhase !== 'winner') return;
    if (dealerModeRef.current) return; // skip in Dealer mode

    const timer = setTimeout(() => {
      handleNewRound();
    }, timing.endOfRound * 1000);
    return () => clearTimeout(timer);
  }, [gamePhase, timing.endOfRound, handleNewRound]);

  const handleDealButtonPress = useCallback(() => {
    if (gamePhase === 'betting' && totalBet > 0) handleDealFlop();
    else if (gamePhase === 'flop') handleDealTurn();
    else if (gamePhase === 'lowHighBetting') handleDealRiver();
    else if (gamePhase === 'winner') handleNewRound();
  }, [gamePhase, totalBet, handleDealFlop, handleDealTurn, handleDealRiver, handleNewRound]);

  // ── Mobile layout ────────────────────────────────────────────────────────
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <>
        <RoundRecoveryModal
          isOpen={showRecoveryModal}
          restoredState={recoveredState}
          onResume={handleRecoveryResume}
          onAbandon={handleRecoveryAbandon}
        />
        <style>{`@keyframes rfUnlockFadeOut{0%{opacity:0}5%{opacity:1}88%{opacity:1}100%{opacity:0}}`}</style>
        <MobileGameLayout
          gamePhase={gamePhase}
          communityCards={communityCards}
          maxHandBetsAllowed={maxHandBetsAllowed}
          rankLockThreshold={versions?.rankLockThreshold}
          dealerMessage={dealerMessage}
          leadingHandIds={leadingHandIds}
          winnerHandIds={winnerHandIds}
          winningRedBlack={winningRedBlack}
          winningLowHigh={winningLowHigh}
          winningRank={winningRank}
          leadingRank={leadingRank}
          lastWinInfo={lastWinInfo}
          playerCount={playerCount}
          activePlayer={activePlayer}
          balances={balances}
          selectedChip={selectedChip}
          handBets={handBets}
          redBlackBets={redBlackBets}
          rankBets={rankBets}
          lowHighBets={lowHighBets}
          countdownTime={countdownTime}
          countdownActive={countdownActive}
          onCloseWinDisplay={() => setLastWinInfo(null)}
          killSwitchActive={killSwitchActive}
          showUnlockFlash={showUnlockFlash}
          onDismissUnlockFlash={dismissUnlockFlash}
          sideBetGateOpen={sideBetGateOpen}
          handBetCount={handBetCount}
          rankBetCount={rankBetCount}
          maxRankSlots={maxRankSlots}
          luminosityClass=""
          hoveredRankRow={hoveredRankRow}
          hoveredRiverType={hoveredRiverType}
          riverWinFlash={riverWinFlash}
          isRankBetPlaced={isRankBetPlaced}
          totalBet={totalBet}
          history={history}
          // Alerts
          showHandLimitAlert={showHandLimitAlert}
          showRankLimitAlert={showRankLimitAlert}
          rankAlertType={rankAlertType}
          showCapAlert={showCapAlert}
          capAlertType={capAlertType}
          showInsufficientFunds={showInsufficientFunds}
          showAutoTrimToast={showAutoTrimToast}
          showColorSideAlert={showColorSideAlert}
          // Handlers
          onHandBet={handleHandBet}
          onRemoveHandBet={handleRemoveHandBet}
          onDropChip={handleDropChip}
          onRankBet={handleRankBet}
          onRemoveRankBet={handleRemoveRankBet}
          onMoveRankBet={handleMoveRankBet}
          onRedBlackBet={handleRedBlackBet}
          onRemoveRedBlackBet={handleRemoveRedBlackBet}
          onLowHighBet={handleLowHighBet}
          onRemoveLowHighBet={handleRemoveLowHighBet}
          onSelectChip={setSelectedChip}
          onClearBets={clearBets}
          onCloseHandAlert={() => setShowHandLimitAlert(false)}
          onCloseRankAlert={() => setShowRankLimitAlert(false)}
          onCloseCapAlert={() => setShowCapAlert(false)}
          onCloseInsufficientFunds={() => setShowInsufficientFunds(false)}
          onHideAutoTrimToast={() => setShowAutoTrimToast(false)}
          onCloseColorSideAlert={() => setShowColorSideAlert(false)}
          // Tools
          onOpenStats={() => setShowStatsPanel(true)}
          onOpenMollySimulator={() => setShowMollySimulator(true)}
          onOpenExploitHunter={() => setShowExploitHunter(true)}
          onOpenComplianceReport={() => setShowComplianceReport(true)}
          onOpenKsStrategyTest={() => setShowKsStrategyTest(true)}
          onOpenGameTiming={() => setShowGameTiming(true)}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onOpenVersions={() => setShowVersions(true)}
          onOpenBellCurve={() => setShowBellCurve(true)}
          onOpenControl={() => setShowControl(true)}
          onOpenArchetypeBattle={() => {}}
          onOpenObserver={() => {}}
          toolsVisible={toolbarVisible}
          onSetHoveredRankRow={setHoveredRankRow}
          onSetHoveredRiverType={setHoveredRiverType}
          // v12-specific
          handDisplayOrder={handDisplayOrder}
          boardTheme={boardTheme}
          soundManager={soundManager}
          resetBankVisible={true}
          onResetBank={handleResetBank}
          activeColorSide={versions?.colorBothSides ? null : (['3R','4R','5R'].some(k => (pRedBlackBets[k]||0) > 0) ? 'red' : ['3B','4B','5B'].some(k => (pRedBlackBets[k]||0) > 0) ? 'black' : null)}
          preloadSounds={preloadSounds}
          onSetTheme={(t) => setBoardTheme(t)}
          mobileLayout={mobileLayout}
          onOpenHelp={() => setShowHowToPlay(true)}
          onOpenMobileLayout={() => setShowMobileLayout(true)}
          onDealerButton={handleDealButtonPress}
          suppressHowToPlay={recoveryChecking || showRecoveryModal}
          versions={versions}
          versionsReady={versionsReady}
        />
        {showMobileLayout && (
          <MobileLayoutModal current={mobileLayout} onSelect={(v) => { setMobileLayout(v); setShowMobileLayout(false); }} onClose={() => setShowMobileLayout(false)} />
        )}
      </>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────
  return (
  <>
      {/* Phase 3 GLI-19: Incomplete round recovery modal */}
      <RoundRecoveryModal
        isOpen={showRecoveryModal}
        restoredState={recoveredState}
        onResume={handleRecoveryResume}
        onAbandon={handleRecoveryAbandon}
      />
      <style>{`@keyframes rfUnlockFadeOut{0%{opacity:0}5%{opacity:1}88%{opacity:1}100%{opacity:0}}`}</style>
      <div className={`velvet-board h-screen w-screen overflow-hidden text-white flex flex-col theme-${boardTheme}`} onClick={preloadSounds} onTouchStart={preloadSounds}>

      {/* Alerts */}
      <HandBetLimitAlert
        isOpen={showHandLimitAlert}
        onClose={() => setShowHandLimitAlert(false)}
        maxHands={maxHandBetsAllowed} />
      
      <RankBetLimitAlert
        isOpen={showRankLimitAlert}
        onClose={() => setShowRankLimitAlert(false)}
        currentHandBets={handBetCount}
        alertType={rankAlertType}
        maxRankSlots={maxRankSlots} />
      
      <RankBetLimitAlert
        isOpen={showCapAlert}
        onClose={() => setShowCapAlert(false)}
        alertType={capAlertType}
        currentHandBets={handBetCount} />
      
      <ColorSideAlert
        isOpen={showColorSideAlert}
        onClose={() => setShowColorSideAlert(false)} />

      <InsufficientFundsAlert
        isVisible={showInsufficientFunds}
        onClose={() => setShowInsufficientFunds(false)} />
      
      <AutoTrimToast
        isVisible={showAutoTrimToast}
        onHide={() => setShowAutoTrimToast(false)} />
      



      {/* Player Stats Panel */}
      <PlayerStatsPanel
        isOpen={showStatsPanel}
        onClose={() => setShowStatsPanel(false)}
        playerStats={playerStats}
        playerCount={playerCount} />
      

      {/* Molly Simulator */}
      <AnimatePresence>
        {showMollySimulator &&
        <MollySimulator onClose={() => setShowMollySimulator(false)} />
        }
      </AnimatePresence>

      {/* Exploit Hunter */}
      <AnimatePresence>
        {showExploitHunter &&
        <ExploitHunter onClose={() => setShowExploitHunter(false)} />
        }
      </AnimatePresence>

      {/* Compliance Report */}
      <AnimatePresence>
        {showComplianceReport &&
        <RegulatoryComplianceReport onClose={() => setShowComplianceReport(false)} />
        }
      </AnimatePresence>

      {/* Kill-Switch Strategy Test */}
      <AnimatePresence>
        {showKsStrategyTest &&
        <KillSwitchStrategyTest onClose={() => setShowKsStrategyTest(false)} />
        }
      </AnimatePresence>

      {/* Game Timing Modal */}

      {/* Analytics Dashboard */}
      <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />

      <GameTimingModal isOpen={showGameTiming} onClose={() => setShowGameTiming(false)} onSaved={reloadTiming} dealerMode={dealerMode} onDealerModeChange={setDealerMode} />
      {showMobileLayout && (
        <MobileLayoutModal current={mobileLayout} onSelect={(v) => { setMobileLayout(v); setShowMobileLayout(false); }} onClose={() => setShowMobileLayout(false)} />
      )}
      {showDesktopLayout && (
        <DesktopLayoutModal current={desktopLayout} onSelect={(v) => { setDesktopLayout(v); setShowDesktopLayout(false); }} onClose={() => setShowDesktopLayout(false)} />
      )}
      <GameVersionsModal isOpen={showVersions} onClose={() => setShowVersions(false)} />
      <ControlPanel isOpen={showControl} onClose={() => setShowControl(false)} suitVariation={suitVariation} setSuitVariation={setSuitVariation} positionRotation={positionRotation} setPositionRotation={setPositionRotation} />
      {showBellCurve && (
        <BellCurveModal
          onClose={() => setShowBellCurve(false)}
          initialConfig={bellCurveConfig}
          onSave={(cfg) => { saveBellCurveConfig(cfg); setShowBellCurve(false); }}
        />
      )}
      <HowToPlayOverlay
        versions={versions}
        versionsReady={versionsReady}
        forceOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        suppress={recoveryChecking || showRecoveryModal}
      />

      {desktopLayout === '2' ? (
        <DesktopLayout2
          gamePhase={gamePhase}
          communityCards={communityCards}
          dealerMessage={dealerMessage}
          history={history}
          boardTheme={boardTheme}
          setBoardTheme={setBoardTheme}
          soundManager={soundManager}
          FIXED_HANDS={FIXED_HANDS}
          handDisplayOrder={handDisplayOrder}
          leadingHandIds={leadingHandIds}
          winnerHandIds={winnerHandIds}
          pHandBets={pHandBets}
          handBets={handBets}
          playerCount={playerCount}
          pid={pid}
          handleHandBet={handleHandBet}
          handleRemoveHandBet={handleRemoveHandBet}
          handleDropChip={handleDropChip}
          selectedChip={selectedChip}
          balance={balance}
          handBetCount={handBetCount}
          maxHandBetsAllowed={maxHandBetsAllowed}
          setShowHandLimitAlert={setShowHandLimitAlert}
          pRankBets={pRankBets}
          rankBets={rankBets}
          handleRankBet={handleRankBet}
          handleRemoveRankBet={handleRemoveRankBet}
          handleMoveRankBet={handleMoveRankBet}
          winningRank={winningRank}
          leadingRank={leadingRank}
          killSwitchActive={killSwitchActive}
          maxRankSlots={maxRankSlots}
          rankBetCount={rankBetCount}
          versions={versions}
          totalHandAmt={totalHandAmt}
          totalRankAmt={totalRankAmt}
          setShowRankLimitAlert={setShowRankLimitAlert}
          setHoveredRankRow={setHoveredRankRow}
          pRedBlackBets={pRedBlackBets}
          pLowHighBet={pLowHighBet}
          redBlackBets={redBlackBets}
          lowHighBets={lowHighBets}
          handleRedBlackBet={handleRedBlackBet}
          handleRemoveRedBlackBet={handleRemoveRedBlackBet}
          handleLowHighBet={handleLowHighBet}
          handleRemoveLowHighBet={handleRemoveLowHighBet}
          winningRedBlack={winningRedBlack}
          winningLowHigh={winningLowHigh}
          sideBetGateOpen={sideBetGateOpen}
          setShowColorSideAlert={setShowColorSideAlert}
          totalInvestment={totalInvestment}
          hoveredRiverType={hoveredRiverType}
          setHoveredRiverType={setHoveredRiverType}
          riverWinFlash={riverWinFlash}
          hoveredRankRow={hoveredRankRow}
          isRankBetPlaced={isRankBetPlaced}
          totalColorAmt={totalColorAmt}
          lastWinInfo={lastWinInfo}
          setLastWinInfo={setLastWinInfo}
          CHIP_VALUES={CHIP_VALUES}
          setSelectedChip={setSelectedChip}
          balances={balances}
          activePlayer={activePlayer}
          totalBet={totalBet}
          dealerMode={dealerMode}
          handleDealButtonPress={handleDealButtonPress}
          clearBets={clearBets}
          setShowHowToPlay={setShowHowToPlay}
          setShowStatsPanel={setShowStatsPanel}
          handleResetBank={handleResetBank}
          setShowMobileLayout={setShowMobileLayout}
          setShowDesktopLayout={setShowDesktopLayout}
          countdownTime={countdownTime}
          countdownActive={countdownActive}
          showUnlockFlash={showUnlockFlash}
          onDismissUnlockFlash={dismissUnlockFlash}
          toolbarVisible={toolbarVisible}
          setToolbarVisible={setToolbarVisible}
          setShowMollySimulator={setShowMollySimulator}
          setShowExploitHunter={setShowExploitHunter}
          setShowComplianceReport={setShowComplianceReport}
          setShowKsStrategyTest={setShowKsStrategyTest}
          setShowAnalytics={setShowAnalytics}
          setShowGameTiming={setShowGameTiming}
          setShowVersions={setShowVersions}
          setShowBellCurve={setShowBellCurve}
          setShowControl={setShowControl}
          LOGO_URLS={LOGO_URLS}
        />
      ) : (
      <>
      {/* Main Layout: full-width footer, 3 columns above */}
      <div className="flex flex-col gap-1.5 p-1.5 flex-1 min-h-0">
        <div className="flex gap-1.5 flex-1 min-h-0">

        {/* LEFT: History + Jackpots */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-1.5 overflow-hidden">
          <HistoryRail history={history} />
        </div>

        {/* CENTER: Main Game Board */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0 items-center">

          {/* Dealer Announcement — fixed height, never expands */}
          <div
            style={{
              height: '32px',
              minHeight: '32px',
              maxHeight: '32px',
              width: '100%',
              flexShrink: 0,
              overflow: 'visible',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
              borderRadius: '0.5rem',
              border: '3px solid #e8b84b',
              background: 'rgba(0,0,0,0.45)',
              boxShadow: '0 0 0 1px #000 inset, 0 0 14px 1px rgba(232,184,75,0.55), 0 2px 8px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
              position: 'relative',
            }}>
            <BoardShimmer isActive={gamePhase === 'betting'} />
            <DealerAnnouncement message={dealerMessage} phase={gamePhase} />
          </div>

          {/* Bonus Bets Unlocked — fixed overlay, zero layout impact */}
          {showUnlockFlash && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -60%)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
              background: 'linear-gradient(160deg, rgba(0,0,0,0.97) 0%, rgba(25,12,0,0.98) 100%)',
              border: '2px solid #eab308',
              boxShadow: '0 0 40px rgba(234,179,8,0.5), 0 8px 32px rgba(0,0,0,0.8)',
              animation: 'rfUnlockFadeOut 8s ease forwards',
              pointerEvents: 'none',
              padding: '16px 28px',
              gap: 0,
              minWidth: '220px',
            }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#eab308', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>🔓 Bonus Bets Unlocked</span>
              <div style={{ height: 8 }} />
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700, textAlign: 'center' }}>🔴 Color Board Open</span>
              <div style={{ height: 4 }} />
              <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700, textAlign: 'center' }}>🌊 River Bet Available After The Turn</span>
            </div>
          )}

          {/* Community Cards — expanded canvas for labels, assets stay fixed size */}
          <div
            style={{
              height: '191px',
              minHeight: '191px',
              maxHeight: '191px',
              width: '100%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderRadius: '0.75rem',
              border: '3px solid #e8b84b',
              background: 'rgba(0,0,0,0.35)',
              boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
              overflow: 'visible',
              position: 'relative',
            }}>

            {/* Board color — now in ⚙ Gear menu */}
            
            {/* Logo — left side, with ToolsMenu button below */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none', gap: '4px' }}>
              <img src={LOGO_URLS[boardTheme]} alt="Rapid Fire Texas Hold'em" style={{ width: '72px', height: 'auto', display: 'block', borderRadius: '8px' }} />
              <ToolsMenu onOpenStats={() => setShowStatsPanel(true)} onOpenMollySimulator={() => setShowMollySimulator(true)} onOpenExploitHunter={() => setShowExploitHunter(true)} onOpenComplianceReport={() => setShowComplianceReport(true)} onOpenKsStrategyTest={() => setShowKsStrategyTest(true)} onOpenAnalytics={() => setShowAnalytics(true)} onOpenGameTiming={() => setShowGameTiming(true)} onOpenMobileLayout={() => setShowMobileLayout(true)} onOpenVersions={() => setShowVersions(true)} onOpenBellCurve={() => setShowBellCurve(true)}
          onOpenControl={() => setShowControl(true)} toolsVisible={toolbarVisible} onHideTools={() => setToolbarVisible(false)} />
            </div>

            <CommunityCards cards={communityCards} phase={gamePhase} />

            {/* Mirror logo — right side */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
              <img src={LOGO_URLS[boardTheme]} alt="Rapid Fire Texas Hold'em" style={{ width: '72px', height: 'auto', display: 'block', borderRadius: '8px' }} />
            </div>
          </div>

          {/* Detailed Payout Display */}
          <DetailedPayoutDisplay winInfo={lastWinInfo} playerCount={playerCount} onClose={() => setLastWinInfo(null)} />

          {/* 10 Fixed Hands Grid */}
          <div className="flex-1 min-h-0 w-full" style={{
            position: 'relative',
            border: '3px solid #e8b84b',
            borderRadius: '0.75rem',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
            padding: '4px',
            overflow: 'visible',
          }}>
            {/* Countdown clock overlay — Timing mode, centered over hand grid */}
            {!dealerMode && (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                pointerEvents: 'none',
              }}>
                <CountdownClock timeRemaining={countdownTime} isActive={countdownActive} phase={gamePhase} />
              </div>
            )}
            <div className="grid grid-cols-5 gap-1.5 h-full auto-rows-fr">
              {handDisplayOrder.map((hid) => {
              const hand = FIXED_HANDS.find(h => h.id === hid);
              if (!hand) return null;
              return (
              <FixedHandCard
                key={hand.id}
                hand={hand}
                isLeading={leadingHandIds.includes(hand.id)}
                isWinner={winnerHandIds.includes(hand.id)}
                communityCards={communityCards}
                betAmount={pHandBets[hand.id] || 0}
                allHandBets={handBets}
                playerCount={playerCount}
                activePlayerId={pid}
                onBet={handleHandBet}
                onRemoveBet={handleRemoveHandBet}
                onDropChip={handleDropChip}
                gamePhase={gamePhase}
                disabled={balance < selectedChip && !pHandBets[hand.id]}
                disabledByConstraint={!pHandBets[hand.id] && handBetCount >= maxHandBetsAllowed}
                onAttemptLockedBet={() => setShowHandLimitAlert(true)} />
              );
            })}
            </div>
          </div>

        </div>

        {/* RIGHT: Rank Bets | Side Bets | Payout Table */}
        <div className="flex-shrink-0 flex flex-col gap-1.5" style={{ width: 263, overflow: 'visible' }}>
          {/* Rank Bets panel */}
          <div className="rounded-xl p-2 flex flex-col" style={{ flex: '6.5 1 0', background: 'rgba(0,0,0,0.45)', border: '3px solid #e8b84b', boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)', overflow: 'visible' }}>
            <BoardShimmer isActive={gamePhase === 'betting' && !killSwitchActive && handBetCount > 0} />
            <RankBets
              rankBets={pRankBets}
              allRankBets={rankBets}
              playerCount={playerCount}
              onRankBet={handleRankBet}
              onRemoveRankBet={handleRemoveRankBet}
              onMoveRankBet={handleMoveRankBet}
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
              matchCapRemaining={Math.max(0, totalHandAmt - totalRankAmt)}
              onAttemptLockedRank={(type) => {
                setRankAlertType(type);
                setShowRankLimitAlert(true);
              }}
              onHoverRankRow={setHoveredRankRow}
              rankLockThreshold={versions?.rankLockThreshold ?? 1} />
            
          </div>
          {/* Side Bets panel */}
          <div className="flex flex-col" style={{ flex: '5.5 1 0', overflow: 'visible' }}>
            <SideBets
              communityCards={communityCards}
              allRedBlackBets={redBlackBets}
              allLowHighBets={lowHighBets}
              redBlackBets={pRedBlackBets}
              lowHighBet={pLowHighBet}
              onRedBlackBet={handleRedBlackBet}
              onRemoveRedBlackBet={handleRemoveRedBlackBet}
              onLowHighBet={handleLowHighBet}
              onRemoveLowHighBet={handleRemoveLowHighBet}
              gamePhase={gamePhase}
              winningRedBlack={winningRedBlack}
              winningLowHigh={winningLowHigh}
              disabled={gamePhase === 'betting' ? balance < selectedChip : gamePhase === 'lowHighBetting' ? balance < selectedChip : true}
              killSwitchActive={killSwitchActive}
              rankBetActive={sideBetGateOpen}
              activeColorSide={versions?.colorBothSides ? null : (['3R','4R','5R'].some(k => (pRedBlackBets[k]||0) > 0) ? 'red' : ['3B','4B','5B'].some(k => (pRedBlackBets[k]||0) > 0) ? 'black' : null)}
              onColorSideConflict={() => setShowColorSideAlert(true)}
              playerCount={playerCount}
              totalInvestment={totalInvestment}
              hoveredRiverType={hoveredRiverType}
              onHoverRiver={setHoveredRiverType}
              riverWinFlash={riverWinFlash}
              selectedChip={selectedChip}
              hoveredRankRow={hoveredRankRow}
              isRankBetPlaced={isRankBetPlaced}
              colorCap={Math.max(0, (totalHandAmt + totalRankAmt) - totalColorAmt)}
              riverCap={Math.max(0, (totalHandAmt + totalRankAmt + totalColorAmt) - (pLowHighBet?.amount || 0))}
              rankLockThreshold={versions?.rankLockThreshold ?? 1} />
            
          </div>
        </div>
      </div>

        {/* Full-width footer bar — spans under all 3 columns */}
        {/* Bottom controls */}
        <div className="flex items-center gap-2 rounded-xl pt-1.5 px-3 pb-1.5 flex-shrink-0 w-full"
          style={{
            border: '3px solid #e8b84b',
            boxShadow: '0 0 0 1px #000 inset, 0 0 8px rgba(232,184,75,0.3), 0 2px 8px rgba(0,0,0,0.6)',
            background: 'rgba(0,0,0,0.35)',
          }}>
          {/* LEFT section: chips — flex:1 so it mirrors the right section's width */}
          <div className="flex items-center" style={{ flex: 1, justifyContent: 'flex-start' }}>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {CHIP_VALUES.map((v) =>
              <button
                key={v}
                onClick={() => setSelectedChip(v)}
                className={`relative flex-shrink-0 transition-all duration-150 rounded-full border-0 bg-transparent p-0
                    ${selectedChip === v ? 'scale-125 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]' : 'opacity-75 hover:opacity-100 hover:scale-110'}`}
                style={{ lineHeight: 0 }}
              >
                <Chip amount={v} scale={0.72} />
              </button>
              )}
            </div>
          </div>

          {/* CENTER: Player Bank + Dealer Button + Bet Sum — stays in normal flow (no absolute) so it keeps contributing height. True-centered because LEFT and RIGHT wrappers are both flex:1 and grow equally. */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-yellow-400/80 text-[10px] font-bold leading-none tracking-widest uppercase mb-0.5">Players Bank</span>
              <div className="flex items-center justify-center px-4 py-2 rounded-xl border-2 border-yellow-500 bg-black" style={{ minWidth: '110px' }}>
                <span className="text-yellow-400 font-black text-lg leading-none tracking-tight" style={{ textShadow: '0 0 8px rgba(251,191,36,0.7)' }}>${(balances[activePlayer] ?? 20).toFixed(2)}</span>
              </div>
            </div>
            {dealerMode ? (
              <DealerButton gamePhase={gamePhase} totalBet={totalBet} onDeal={handleDealButtonPress} />
            ) : (
              <div style={{ width: 120, flexShrink: 0 }} />
            )}
            <div className="flex flex-col items-center">
              <span className="text-yellow-400/80 text-[10px] font-bold leading-none tracking-widest uppercase mb-0.5">Bet Sum Count</span>
              <div className="flex items-center justify-center px-4 py-2 rounded-xl border-2 border-yellow-500 bg-black" style={{ minWidth: '110px' }}>
                <span className="text-yellow-400 font-black text-lg leading-none tracking-tight" style={{ textShadow: '0 0 8px rgba(251,191,36,0.7)' }}>${totalBet.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT section: Clear + Gear — flex:1, mirrors LEFT section's width so CENTER lands at true midpoint */}
          <div className="flex items-center gap-2" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '80px', justifyContent: 'flex-end' }}>
              {gamePhase === 'betting' && totalBet > 0 &&
              <button
                onClick={clearBets}
                className="px-3 py-1.5 rounded-lg border border-red-700/50 bg-red-900/30 text-red-300 text-xs font-semibold hover:bg-red-900/50 transition-all">
                  Clear
                </button>
              }
            </div>

            {/* ⚙ Gear Button — always visible */}
            <OnboardingIndicator>
              <GearMenu
                soundManager={soundManager}
                boardTheme={boardTheme}
                setBoardTheme={setBoardTheme}
                onHowToPlay={() => setShowHowToPlay(true)}
                onOpenStats={() => setShowStatsPanel(true)}
                onResetBank={handleResetBank}
                onOpenDesktopLayout={() => setShowDesktopLayout(true)}
              />
            </OnboardingIndicator>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  </>);

}