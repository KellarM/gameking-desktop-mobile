// ============================================================
// HAND SIMULATION WORKER — OPPOSITE DECK
// Mirrors handSimulationWorker.js using the Opposite Deck hand set.
// ============================================================

const RANK_LABELS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_LABELS = ['clubs','diamonds','hearts','spades'];

function enc(rankLabel, suitLabel) {
  return RANK_LABELS.indexOf(rankLabel) * 4 + SUIT_LABELS.indexOf(suitLabel);
}

function decodeCard(c) {
  return { rank: RANK_LABELS[c >> 2], suit: SUIT_LABELS[c & 3] };
}

const HAND_LABELS = ['A♣10♠','K♦K♥','Q♦J♥','Q♥10♥','J♦9♦','8♣6♣','7♣7♥','4♠2♠','3♦3♠','A♠5♣'];

const HANDS = [
  [enc('A','clubs'),    enc('10','spades')],
  [enc('K','diamonds'), enc('K','hearts')],
  [enc('Q','diamonds'), enc('J','hearts')],
  [enc('Q','hearts'),   enc('10','hearts')],
  [enc('J','diamonds'), enc('9','diamonds')],
  [enc('8','clubs'),    enc('6','clubs')],
  [enc('7','clubs'),    enc('7','hearts')],
  [enc('4','spades'),   enc('2','spades')],
  [enc('3','diamonds'), enc('3','spades')],
  [enc('A','spades'),   enc('5','clubs')],
];

const PLAYER_SET = new Set(HANDS.flat());
const DECK32_MASTER = [];
for (let r = 0; r < 13; r++) {
  for (let s = 0; s < 4; s++) {
    const c = r * 4 + s;
    if (!PLAYER_SET.has(c)) DECK32_MASTER.push(c);
  }
}
Object.freeze(DECK32_MASTER);

let _workDeck = new Int16Array(32);

function _secureRandInt(max) {
  if (max === 0) return 0;
  let mask = 1;
  while (mask <= max) mask = (mask << 1) | 1;
  const arr = new Uint32Array(1);
  let val;
  do {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
      val = arr[0] & mask;
    } else {
      return (Math.random() * (max + 1)) | 0;
    }
  } while (val > max);
  return val;
}

function shuffleAndDeal() {
  for (let i = 0; i < 32; i++) _workDeck[i] = DECK32_MASTER[i];
  for (let i = 31; i > 0; i--) {
    const j = _secureRandInt(i);
    const tmp = _workDeck[i]; _workDeck[i] = _workDeck[j]; _workDeck[j] = tmp;
  }
  return [_workDeck[1], _workDeck[2], _workDeck[3], _workDeck[5], _workDeck[7]];
}

const BASE = 14;
const B1 = BASE, B2 = BASE*BASE, B3 = BASE*BASE*BASE, B4 = BASE*BASE*BASE*BASE, B5 = BASE*BASE*BASE*BASE*BASE;

function eval5strength(c0, c1, c2, c3, c4) {
  const r0=c0>>2, r1=c1>>2, r2=c2>>2, r3=c3>>2, r4=c4>>2;
  const s0=c0&3,  s1=c1&3,  s2=c2&3,  s3=c3&3,  s4=c4&3;
  const flush = (s0===s1 && s1===s2 && s2===s3 && s3===s4);

  const rs = [r0,r1,r2,r3,r4].sort((a,b)=>b-a);
  const [a,b,c,d,e] = rs;

  const cnt = new Int8Array(13);
  cnt[r0]++; cnt[r1]++; cnt[r2]++; cnt[r3]++; cnt[r4]++;

  const isWheel = (a===12 && b===3 && c===2 && d===1 && e===0);
  const isStraight = isWheel || (new Set(rs).size===5 && a-e===4);
  const straightHigh = isWheel ? 3 : a;

  if (flush && isStraight) {
    if (a===12 && b===11 && c===10 && d===9 && e===8) return 9 * B5;
    return 8 * B5 + straightHigh;
  }

  const groups = [];
  for (let v=12; v>=0; v--) if (cnt[v]) groups.push([v, cnt[v]]);
  groups.sort((x,y) => y[1]-x[1] || y[0]-x[0]);

  const maxCnt = groups[0][1];
  const secCnt = groups.length > 1 ? groups[1][1] : 0;

  if (maxCnt === 4) return 7*B5 + groups[0][0]*B4 + groups[1][0];
  if (maxCnt === 3 && secCnt === 2) return 6*B5 + groups[0][0]*B4 + groups[1][0];
  if (flush) return 5*B5 + a*B4 + b*B3 + c*B2 + d*B1 + e;
  if (isStraight) return 4*B5 + straightHigh;
  if (maxCnt === 3) return 3*B5 + groups[0][0]*B4 + groups[1][0]*B3 + groups[2][0]*B2;
  if (maxCnt === 2 && secCnt === 2) return 2*B5 + groups[0][0]*B4 + groups[1][0]*B3 + groups[2][0]*B2;
  if (maxCnt === 2) return 1*B5 + groups[0][0]*B4 + groups[1][0]*B3 + groups[2][0]*B2 + groups[3][0]*B1;
  return 0*B5 + a*B4 + b*B3 + c*B2 + d*B1 + e;
}

function rankCatFromStrength(s) { return Math.floor(s / B5) - 1; }

function best7strength(h0, h1, b0, b1, b2, b3, b4) {
  const all = [h0, h1, b0, b1, b2, b3, b4];
  let best = -1;
  for (let i=0;i<3;i++) for (let j=i+1;j<4;j++) for (let k=j+1;k<5;k++)
    for (let l=k+1;l<6;l++) for (let m=l+1;m<7;m++) {
      const s = eval5strength(all[i],all[j],all[k],all[l],all[m]);
      if (s > best) best = s;
    }
  return best;
}

function evalAllHands(b0, b1, b2, b3, b4) {
  const strengths = new Float64Array(10);
  let bestStr = -1;
  for (let h=0; h<10; h++) {
    const s = best7strength(HANDS[h][0], HANDS[h][1], b0, b1, b2, b3, b4);
    strengths[h] = s;
    if (s > bestStr) bestStr = s;
  }
  const winners = new Uint8Array(10);
  let winnerCount = 0;
  for (let h=0; h<10; h++) {
    if (strengths[h] === bestStr) { winners[h] = 1; winnerCount++; }
  }
  return { strengths, winners, winnerCount };
}

const RANK_NAMES_BY_CAT = {
  0: 'One Pair', 1: 'Two Pair', 2: 'Three of a Kind', 3: 'Straight',
  4: 'Flush', 5: 'Full House', 6: 'Four of a Kind', 7: 'Straight Flush', 8: 'Royal Flush',
};

function calculateTiePayout(originalOdds, numberOfWinners) {
  if (numberOfWinners <= 1) return originalOdds;
  return ((originalOdds + 1) / 2) * 1.05 - 1;
}

function popcount10(mask) {
  let c = 0;
  while (mask) { c += mask & 1; mask >>= 1; }
  return c;
}

const PROGRESS_UPDATE_INTERVAL = 50_000;
const EXPORT_ROUND_CAP = 100_000;

let _buffer = { winnersMask: null, rankCat: null, redsCount: null, lowCount4: null, riverLow: null, boards: null, boardCap: 0, size: 0 };

function generateBuffer(rounds, callId) {
  const winnersMask = new Uint16Array(rounds);
  const rankCat = new Int8Array(rounds);
  const redsCount = new Int8Array(rounds);
  const lowCount4 = new Int8Array(rounds);
  const riverLow = new Uint8Array(rounds);
  const boardCap = Math.min(rounds, EXPORT_ROUND_CAP);
  const boards = new Uint8Array(boardCap * 5);

  for (let i = 0; i < rounds; i++) {
    if (i > 0 && i % PROGRESS_UPDATE_INTERVAL === 0) {
      self.postMessage({ type: 'PROGRESS', callId, done: i, total: rounds });
    }
    const [b0, b1, b2, b3, b4] = shuffleAndDeal();
    const { strengths, winners, winnerCount } = evalAllHands(b0, b1, b2, b3, b4);

    let mask = 0;
    let firstWinner = -1;
    for (let h = 0; h < 10; h++) {
      if (winners[h]) { mask |= (1 << h); if (firstWinner < 0) firstWinner = h; }
    }
    winnersMask[i] = mask;
    rankCat[i] = winnerCount === 10 ? -1 : (firstWinner >= 0 ? rankCatFromStrength(strengths[firstWinner]) : -1);

    let reds = 0;
    if ((b0&3)===1||(b0&3)===2) reds++;
    if ((b1&3)===1||(b1&3)===2) reds++;
    if ((b2&3)===1||(b2&3)===2) reds++;
    if ((b3&3)===1||(b3&3)===2) reds++;
    if ((b4&3)===1||(b4&3)===2) reds++;
    redsCount[i] = reds;

    let low4 = 0;
    if ((b0 >> 2) <= 5) low4++;
    if ((b1 >> 2) <= 5) low4++;
    if ((b2 >> 2) <= 5) low4++;
    if ((b3 >> 2) <= 5) low4++;
    lowCount4[i] = low4;
    riverLow[i] = (b4 >> 2) <= 5 ? 1 : 0;

    if (i < boardCap) {
      const off = i * 5;
      boards[off] = b0; boards[off+1] = b1; boards[off+2] = b2; boards[off+3] = b3; boards[off+4] = b4;
    }
  }

  _buffer = { winnersMask, rankCat, redsCount, lowCount4, riverLow, boards, boardCap, size: rounds };
}

function lowHighDecision(mode, low4) {
  if (mode !== '3_1' && mode !== '4_0') return null;
  const high4 = 4 - low4;
  if (mode === '3_1') {
    if (low4 === 3 && high4 === 1) return { state: '3L1H', direction: 'HIGH' };
    if (low4 === 1 && high4 === 3) return { state: '1L3H', direction: 'LOW' };
  } else {
    if (low4 === 4 && high4 === 0) return { state: '4L0H', direction: 'HIGH' };
    if (low4 === 0 && high4 === 4) return { state: '0L4H', direction: 'LOW' };
  }
  return null;
}

function resolveLowHighModes(lowHighModes, low4, isLow, totalBetPerRound, riverStatePayouts) {
  let wager = 0;
  let won = 0;
  for (const mode of (lowHighModes || [])) {
    const decision = lowHighDecision(mode, low4);
    if (!decision) continue;
    const modeWager = mode === '3_1' ? totalBetPerRound / 2 : totalBetPerRound;
    wager += modeWager;
    const actualDirection = isLow ? 'LOW' : 'HIGH';
    if (actualDirection === decision.direction) {
      const ratio = riverStatePayouts?.[decision.state]?.[decision.direction] ?? 0;
      won += modeWager * (1 + ratio);
    }
  }
  return { wager, won };
}

function colorWinKey(reds) {
  const blacks = 5 - reds;
  if (reds === 3) return '3R';
  if (reds === 4) return '4R';
  if (reds === 5) return '5R';
  if (blacks === 3) return '3B';
  if (blacks === 4) return '4B';
  if (blacks === 5) return '5B';
  return null;
}

// Color Board strategy resolver — dynamic side (Red/Black) streak betting.
// When a strategy is active, the manual color inputs are ignored and the
// budget (the unlocked ceiling = Hand+Rank totals) is split across the active
// side using the strategy's ratio. After each round the side switches on a
// loss, otherwise the streak continues. Always starts on Red.
function colorStrategyBets(strategy, side, budget) {
  if (budget <= 0) return {};
  if (strategy === '70_20_10') {
    return { ['3'+side]: budget * 0.70, ['4'+side]: budget * 0.20, ['5'+side]: budget * 0.10 };
  }
  if (strategy === 'three') {
    return { ['3'+side]: budget };
  }
  return {};
}
function resolveColorStrategy(strategy, reds, side, budget, colorPayouts) {
  const bets = colorStrategyBets(strategy, side, budget);
  const colorKey = colorWinKey(reds);
  let won = 0;
  let sideWon = false;
  if (colorKey && bets[colorKey] != null && bets[colorKey] > 0) {
    won = bets[colorKey] * (1 + (colorPayouts[colorKey] ?? 0));
    sideWon = true;
  }
  return { wager: budget, won, sideWon };
}

// ── Hand Rotation Strategy ──────────────────────────────────
// The Carded Hand table exposes a per-hand candidate checkbox. When at least
// one candidate is checked AND at least one hand has a bet, rotation mode is
// active. The active set = hands carrying a bet (each with its bet amount).
// Each round we bet on the active set only. After a round, any active hand that
// was part of the board's winning set is rotated OUT; its slot is filled by the
// best-odds candidate (lowest payout ratio = highest win probability) that is
// not currently active and did not just win. The replacement inherits the
// rotated-out slot's bet amount, so the per-round hand wager stays constant.
// When no candidate is checked this returns null and the run is a standard
// fixed-bet test (bets never change across rounds).
function createRotationState(handBets, handCandidates, handPayouts) {
  if (!handCandidates || !handBets || !handPayouts) return null;
  let hasCandidate = false;
  let hasBet = false;
  for (let h = 0; h < 10; h++) {
    if (handCandidates[h]) hasCandidate = true;
    if (handBets[h] > 0) hasBet = true;
  }
  if (!hasCandidate || !hasBet) return null;

  let activeHands = [];
  for (let h = 0; h < 10; h++) {
    if (handBets[h] > 0) activeHands.push({ index: h, bet: handBets[h] });
  }
  const candidateIndices = [];
  for (let h = 0; h < 10; h++) if (handCandidates[h]) candidateIndices.push(h);
  candidateIndices.sort((a, b) => handPayouts[a] - handPayouts[b]);
  if (candidateIndices.length === 0) return null;

  const currentBets = new Array(10).fill(0);
  function rebuild() {
    currentBets.fill(0);
    for (const a of activeHands) currentBets[a.index] = a.bet;
  }
  rebuild();

  return {
    currentBets,
    advance(mask) {
      const winning = [];
      const kept = [];
      for (const a of activeHands) {
        if ((mask & (1 << a.index)) !== 0) winning.push(a);
        else kept.push(a);
      }
      const justWon = new Set(winning.map(a => a.index));
      const available = candidateIndices.filter(
        c => !kept.some(a => a.index === c) && !justWon.has(c)
      );
      const nextActive = kept;
      for (let r = 0; r < winning.length && r < available.length; r++) {
        nextActive.push({ index: available[r], bet: winning[r].bet });
      }
      activeHands = nextActive;
      rebuild();
    },
  };
}

function computeFromBuffer(payload) {
  const {
    callId,
    handBets, rankBets, colorBets, lowHighModes, handPayouts, perHandRankPayouts, colorPayouts, riverStatePayouts,
    handPercentPaid, rankPercentPaid, roundCheckpoints, handCandidates,
  } = payload;

  const { winnersMask, rankCat, redsCount, lowCount4, riverLow, size } = _buffer;
  const rotState = createRotationState(handBets, handCandidates, handPayouts);

  const rankNames = Object.keys(rankBets).filter(k => rankBets[k] > 0);
  const colorNames = Object.keys(colorBets || {}).filter(k => colorBets[k] > 0);
  const handBetCount = handBets.filter(b => b > 0).length;
  const rankBetCount = rankNames.length;
  const totalHand = handBets.reduce((s, b) => s + (b || 0), 0);
  const totalRank = rankNames.reduce((s, k) => s + rankBets[k], 0);
  const rankCapMet = totalHand > 0 && totalRank === totalHand;
  const colorStrategy = (payload.colorStrategy && rankCapMet) ? payload.colorStrategy : 'manual';
  const manualColorTotal = (colorStrategy === 'manual' && rankCapMet) ? colorNames.reduce((s, k) => s + colorBets[k], 0) : 0;
  const colorBudget = colorStrategy !== 'manual' ? (totalHand + totalRank) : 0;
  const totalBetPerRound = totalHand + totalRank + manualColorTotal + colorBudget;
  let colorSide = 'R';

  const checkpointNet = new Map();
  (roundCheckpoints || []).forEach(r => checkpointNet.set(r, null));

  if (totalBetPerRound <= 0) {
    self.postMessage({ type: 'RESULT', callId, data: { success: true, noBets: true, roundsTested: size, checkpoints: (roundCheckpoints || []).map(r => ({ round: r, net: null })) } });
    return;
  }

  const handPct = (handPercentPaid[handBetCount] ?? 100) / 100;
  const rankPct = (rankPercentPaid[rankBetCount] ?? 100) / 100;

  let totalWon = 0;
  let totalBetAccum = 0;
  let hitCount = 0;
  let netWinCount = 0;
  let runningBalance = 0;
  let bestRunUp = 0;
  let bestRunUpRound = 0;
  let worstRun = 0;
  let worstRunRound = 0;

  for (let i = 0; i < size; i++) {
    if (i > 0 && i % PROGRESS_UPDATE_INTERVAL === 0) {
      self.postMessage({ type: 'PROGRESS', callId, done: i, total: size });
    }

    const mask = winnersMask[i];
    const isBoardWin = mask === 1023;
    let roundWon = 0;

    // Per-round effective hand bets — rotation strategy may change the active set each round
    let roundBets = handBets;
    let roundHandPct = handPct;
    let roundColorBudget = colorBudget;
    let roundTotalBet = totalBetPerRound;
    if (rotState) {
      roundBets = rotState.currentBets;
      let rh = 0;
      let rhc = 0;
      for (let h = 0; h < 10; h++) { const b = roundBets[h]; if (b > 0) { rh += b; rhc++; } }
      roundColorBudget = colorStrategy !== 'manual' ? (rh + totalRank) : 0;
      roundTotalBet = rh + totalRank + manualColorTotal + roundColorBudget;
      roundHandPct = (handPercentPaid[rhc] ?? 100) / 100;
    }

    if (!isBoardWin) {
      const winnerCount = popcount10(mask);
      for (let h = 0; h < 10; h++) {
        const bet = roundBets[h];
        if (bet > 0 && (mask & (1 << h))) {
          const odds = calculateTiePayout(handPayouts[h], winnerCount);
          roundWon += bet * (1 + odds * roundHandPct);
        }
      }

      const rc = rankCat[i];
      const winningRankName = rc >= 0 ? RANK_NAMES_BY_CAT[rc] : null;
      if (winningRankName) {
        // Average per-hand rank odds across ALL winning hands (fairness rule).
        const winnerOdds = [];
        for (let h = 0; h < 10; h++) {
          if (mask & (1 << h)) {
            const hid = h + 1;
            const pf = perHandRankPayouts[hid] ?? perHandRankPayouts[String(hid)];
            const r = pf ? pf[winningRankName] : null;
            if (r != null) winnerOdds.push(r);
          }
        }
        const ratio = winnerOdds.length > 0
          ? (winnerOdds.length > 1 ? winnerOdds.reduce((s, r) => s + r, 0) / winnerOdds.length : winnerOdds[0])
          : null;
        if (ratio != null) {
          for (const rk of rankNames) {
            if (rk === winningRankName) {
              roundWon += rankBets[rk] * (1 + ratio * rankPct);
            }
          }
        }
      }
    }

    // Color Board — manual exact-match, or dynamic streak strategy
    if (colorStrategy === 'manual') {
      const colorKey = colorWinKey(redsCount[i]);
      if (rankCapMet && colorKey && colorBets[colorKey] > 0) {
        const ratio = colorPayouts[colorKey];
        roundWon += colorBets[colorKey] * (1 + ratio);
      }
    } else if (roundColorBudget > 0) {
      const res = resolveColorStrategy(colorStrategy, redsCount[i], colorSide, roundColorBudget, colorPayouts);
      roundWon += res.won;
      if (!res.sideWon) colorSide = colorSide === 'R' ? 'B' : 'R';
    }

    const { wager: lhWager, won: lhWon } = resolveLowHighModes(rankCapMet ? lowHighModes : [], lowCount4[i], riverLow[i] === 1, roundTotalBet, riverStatePayouts);
    const roundBet = roundTotalBet + lhWager;
    roundWon += lhWon;

    totalWon += roundWon;
    if (roundWon > 0) hitCount++;
    const net = roundWon - roundBet;
    if (net > 0) netWinCount++;
    totalBetAccum += roundBet;

    runningBalance += net;
    const roundNumber = i + 1;
    if (runningBalance > bestRunUp) { bestRunUp = runningBalance; bestRunUpRound = roundNumber; }
    if (runningBalance < worstRun) { worstRun = runningBalance; worstRunRound = roundNumber; }

    if (checkpointNet.has(roundNumber)) checkpointNet.set(roundNumber, runningBalance);

    if (rotState) rotState.advance(mask);
  }

  const totalBet = totalBetAccum;
  const totalNet = totalWon - totalBet;
  const rtp = totalBet > 0 ? (totalWon / totalBet) * 100 : 0;
  const houseEdge = 100 - rtp;
  const hitFrequency = size > 0 ? (hitCount / size) * 100 : 0;
  const netWinFrequency = size > 0 ? (netWinCount / size) * 100 : 0;

  self.postMessage({
    type: 'RESULT',
    callId,
    data: {
      success: true,
      noBets: false,
      roundsTested: size,
      totalBet,
      totalWon,
      totalNet,
      rtp,
      houseEdge,
      hitFrequency,
      netWinFrequency,
      bestRunUp,
      bestRunUpRound,
      worstRun,
      worstRunRound,
      checkpoints: (roundCheckpoints || []).map(r => ({ round: r, net: checkpointNet.get(r) ?? null })),
    },
  });
}

const CSV_HEADER = 'Seq,Flop_C1_Rank,Flop_C1_Suit,Flop_C2_Rank,Flop_C2_Suit,Flop_C3_Rank,Flop_C3_Suit,Turn_C4_Rank,Turn_C4_Suit,River_C5_Rank,River_C5_Suit,Winning_Hand,Winning_Hand_2,Winning_Rank,Shared_Win,House_Win,Rank_Exception,3_Red,4_Red,5_Red,3_Black,4_Black,5_Black,Low,High,LowHigh_Wager,Bet,Won,Net,Running_Balance';

function exportRounds(payload) {
  const { callId, handBets, rankBets, colorBets, lowHighModes, handPayouts, perHandRankPayouts, colorPayouts, riverStatePayouts, handPercentPaid, rankPercentPaid, handCandidates } = payload;
  const { winnersMask, rankCat, boards, boardCap, size } = _buffer;
  const rotState = createRotationState(handBets, handCandidates, handPayouts);

  const rankNames = Object.keys(rankBets).filter(k => rankBets[k] > 0);
  const colorNames = Object.keys(colorBets || {}).filter(k => colorBets[k] > 0);
  const handBetCount = handBets.filter(b => b > 0).length;
  const rankBetCount = rankNames.length;
  const totalHand = handBets.reduce((s, b) => s + (b || 0), 0);
  const totalRank = rankNames.reduce((s, k) => s + rankBets[k], 0);
  const rankCapMet = totalHand > 0 && totalRank === totalHand;
  const colorStrategy = (payload.colorStrategy && rankCapMet) ? payload.colorStrategy : 'manual';
  const manualColorTotal = (colorStrategy === 'manual' && rankCapMet) ? colorNames.reduce((s, k) => s + colorBets[k], 0) : 0;
  const colorBudget = colorStrategy !== 'manual' ? (totalHand + totalRank) : 0;
  const totalBetPerRound = totalHand + totalRank + manualColorTotal + colorBudget;
  let colorSide = 'R';
  const handPct = (handPercentPaid[handBetCount] ?? 100) / 100;
  const rankPct = (rankPercentPaid[rankBetCount] ?? 100) / 100;

  const rowCount = Math.min(size, boardCap);
  const rows = new Array(rowCount);
  let runningBalance = 0;

  for (let i = 0; i < rowCount; i++) {
    const mask = winnersMask[i];
    const isBoardWin = mask === 1023;
    let roundWon = 0;
    let winningRankName = null;

    // Per-round effective hand bets — rotation strategy may change the active set each round
    let roundBets = handBets;
    let roundHandPct = handPct;
    let roundColorBudget = colorBudget;
    let roundTotalBet = totalBetPerRound;
    if (rotState) {
      roundBets = rotState.currentBets;
      let rh = 0;
      let rhc = 0;
      for (let h = 0; h < 10; h++) { const b = roundBets[h]; if (b > 0) { rh += b; rhc++; } }
      roundColorBudget = colorStrategy !== 'manual' ? (rh + totalRank) : 0;
      roundTotalBet = rh + totalRank + manualColorTotal + roundColorBudget;
      roundHandPct = (handPercentPaid[rhc] ?? 100) / 100;
    }

    const winnerIndices = [];
    for (let h = 0; h < 10; h++) { if (mask & (1 << h)) winnerIndices.push(h); }

    if (!isBoardWin) {
      const winnerCount = popcount10(mask);
      for (let h = 0; h < 10; h++) {
        const bet = roundBets[h];
        if (bet > 0 && (mask & (1 << h))) {
          const odds = calculateTiePayout(handPayouts[h], winnerCount);
          roundWon += bet * (1 + odds * roundHandPct);
        }
      }
      const rc = rankCat[i];
      const rn = rc >= 0 ? RANK_NAMES_BY_CAT[rc] : null;
      if (rn) {
        // Average per-hand rank odds across ALL winning hands (fairness rule).
        const winnerOdds = [];
        for (const wi of winnerIndices) {
          const hid = wi + 1;
          const pf = perHandRankPayouts[hid] ?? perHandRankPayouts[String(hid)];
          const r = pf ? pf[rn] : null;
          if (r != null) winnerOdds.push(r);
        }
        const ratio = winnerOdds.length > 0
          ? (winnerOdds.length > 1 ? winnerOdds.reduce((s, r) => s + r, 0) / winnerOdds.length : winnerOdds[0])
          : null;
        if (ratio != null) {
          for (const rk of rankNames) {
            if (rk === rn) {
              roundWon += rankBets[rk] * (1 + ratio * rankPct);
              winningRankName = rn;
            }
          }
        }
      }
    }

    const off = i * 5;
    const b0 = boards[off], b1 = boards[off+1], b2 = boards[off+2], b3 = boards[off+3], b4 = boards[off+4];
    const c0 = decodeCard(b0), c1 = decodeCard(b1), c2 = decodeCard(b2), c3 = decodeCard(b3), c4 = decodeCard(b4);

    const rc = rankCat[i];
    const rankException = (rc === 0 || rc === 7 || rc === 8) ? 1 : 0;
    const rankName = rc >= 0 ? RANK_NAMES_BY_CAT[rc] : 'High Card';
    const sharedWin = (!isBoardWin && winnerIndices.length > 1) ? 1 : 0;
    const winnerLabelRaw = isBoardWin ? 'House Win' : (winnerIndices.length > 0 ? HAND_LABELS[winnerIndices[0]] : 'None');
    const winnerLabel2Raw = (!isBoardWin && winnerIndices.length > 1) ? HAND_LABELS[winnerIndices[1]] : '';

    let reds = 0;
    if ((b0&3)===1||(b0&3)===2) reds++;
    if ((b1&3)===1||(b1&3)===2) reds++;
    if ((b2&3)===1||(b2&3)===2) reds++;
    if ((b3&3)===1||(b3&3)===2) reds++;
    if ((b4&3)===1||(b4&3)===2) reds++;
    const blacks = 5 - reds;
    const isLow = (b4 >> 2) <= 5;

    if (colorStrategy === 'manual') {
      const colorKey = colorWinKey(reds);
      if (rankCapMet && colorKey && colorBets[colorKey] > 0) {
        roundWon += colorBets[colorKey] * (1 + colorPayouts[colorKey]);
      }
    } else if (roundColorBudget > 0) {
      const res = resolveColorStrategy(colorStrategy, reds, colorSide, roundColorBudget, colorPayouts);
      roundWon += res.won;
      if (!res.sideWon) colorSide = colorSide === 'R' ? 'B' : 'R';
    }

    const low4 = ((b0>>2)<=5?1:0) + ((b1>>2)<=5?1:0) + ((b2>>2)<=5?1:0) + ((b3>>2)<=5?1:0);
    const { wager: lowHighWager, won: lhWon } = resolveLowHighModes(rankCapMet ? lowHighModes : [], low4, (b4 >> 2) <= 5, roundTotalBet, riverStatePayouts);
    const roundBet = roundTotalBet + lowHighWager;
    roundWon += lhWon;

    const net = roundWon - roundBet;
    runningBalance += net;

    if (rotState) rotState.advance(mask);

    rows[i] = {
      round: i + 1,
      flopC1Rank: c0.rank, flopC1Suit: c0.suit,
      flopC2Rank: c1.rank, flopC2Suit: c1.suit,
      flopC3Rank: c2.rank, flopC3Suit: c2.suit,
      turnC4Rank: c3.rank, turnC4Suit: c3.suit,
      riverC5Rank: c4.rank, riverC5Suit: c4.suit,
      winningHand: winnerLabelRaw,
      winningHand2: winnerLabel2Raw,
      winningRank: rankName,
      sharedWin,
      houseWin: isBoardWin ? 1 : 0,
      rankException,
      red3: reds===3?1:0, red4: reds===4?1:0, red5: reds===5?1:0,
      black3: blacks===3?1:0, black4: blacks===4?1:0, black5: blacks===5?1:0,
      low: isLow?1:0, high: isLow?0:1,
      lowHighWager,
      bet: roundBet,
      won: roundWon,
      net,
      runningBalance,
      isBoardWin,
      winningRankName,
    };
  }

  self.postMessage({ type: 'RESULT', callId, data: { success: true, rows, roundsExported: rowCount, roundsTested: size, csvHeader: CSV_HEADER } });
}

self.onmessage = function(e) {
  const { type, payload } = e.data;
  const { callId } = payload || {};
  try {
    if (type === 'RUN') {
      generateBuffer(payload.rounds, callId);
      computeFromBuffer(payload);
    } else if (type === 'RECALCULATE') {
      if (!_buffer.size) {
        self.postMessage({ type: 'ERROR', callId, message: 'No simulation buffer — run a test first.' });
        return;
      }
      computeFromBuffer(payload);
    } else if (type === 'EXPORT') {
      if (!_buffer.size) {
        self.postMessage({ type: 'ERROR', callId, message: 'No simulation buffer — run a test first.' });
        return;
      }
      exportRounds(payload);
    } else if (type === 'CLEAR') {
      _buffer = { winnersMask: null, rankCat: null, redsCount: null, lowCount4: null, riverLow: null, boards: null, boardCap: 0, size: 0 };
      self.postMessage({ type: 'RESULT', callId, data: { success: true, cleared: true } });
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', callId, message: err?.message ?? String(err) });
  }
};