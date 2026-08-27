import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Payload sanitization for GameEvent.saveEvent ─────────────────────────
// Strict whitelist + type/bounds enforcement so a non-admin caller cannot
// persist fabricated/absurd round metrics (e.g. fake payouts, junk ranks).
const ALLOWED_RANKS = new Set([
  'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush',
  'Straight','Three of a Kind','Two Pair','One Pair','High Card',
]);
const NUM_CAP = 1e9;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clampNum(v, lo, hi) {
  const n = num(v);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
function str(v, max) {
  const s = typeof v === 'string' ? v : String(v ?? '');
  return s.slice(0, max);
}
function bool(v) { return v === true; }

function sanitizeBets(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || k.length > 48) continue;
    out[k] = clampNum(v, 0, NUM_CAP);
  }
  return out;
}

function sanitizeLowHighBet(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const type = str(raw.type, 8);
  if (type !== 'LOW' && type !== 'HIGH') return null;
  return { type, amount: clampNum(raw.amount, 0, NUM_CAP) };
}

function sanitizeGameEvent(raw) {
  const e = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const event_type = str(e.event_type, 64);
  if (!event_type) return null; // event_type is required
  const round_id = Math.trunc(clampNum(e.round_id, 0, NUM_CAP));

  const colorsRaw = Array.isArray(e.winning_colors) ? e.winning_colors : [];
  const winning_colors = colorsRaw.map(c => str(c, 8)).filter(c => /^[0-9]+[RB]$/.test(c)).slice(0, 6);

  const idsRaw = Array.isArray(e.winner_hand_ids) ? e.winner_hand_ids : [];
  const winner_hand_ids = idsRaw
    .map(h => Math.trunc(num(h)))
    .filter(h => h >= 1 && h <= 10)
    .slice(0, 10);

  return {
    event_type,
    round_id,
    session_id: str(e.session_id, 100),
    total_bet: clampNum(e.total_bet, 0, NUM_CAP),
    total_payout: clampNum(e.total_payout, 0, NUM_CAP),
    net_result: clampNum(e.net_result, -NUM_CAP, NUM_CAP),
    card_win: bool(e.card_win),
    rank_win: bool(e.rank_win),
    color_win: bool(e.color_win),
    river_win: bool(e.river_win),
    winning_rank: ALLOWED_RANKS.has(e.winning_rank) ? e.winning_rank : null,
    winning_colors,
    winning_low_high: ['LOW', 'HIGH'].includes(e.winning_low_high) ? e.winning_low_high : null,
    winner_hand_ids,
    hand_bets: sanitizeBets(e.hand_bets),
    rank_bets: sanitizeBets(e.rank_bets),
    color_bets: sanitizeBets(e.color_bets),
    low_high_bet: sanitizeLowHighBet(e.low_high_bet),
    kill_switch_active: bool(e.kill_switch_active),
    hand_bet_count: Math.trunc(clampNum(e.hand_bet_count, 0, 10)),
    is_board_win: bool(e.is_board_win),
    description: str(e.description, 1000),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me(); // may be null for guests on the published app

    const body = await req.json();
    const { action, eventData } = body;

    // ── Save event ─────────────────────────────────────────────────────────
    // Require an authenticated caller and use the user's own entity context so
    // RLS stamps created_by_id — prevents cross-user event forgery.
    if (action === 'saveEvent') {
      if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
      const clean = sanitizeGameEvent(eventData);
      if (!clean) return Response.json({ error: 'Invalid event payload' }, { status: 400 });
      const record = await base44.entities.GameEvent.create(clean);
      return Response.json({ ok: true, id: record.id });
    }

    // ── Summary (admin-only: aggregates all users' GameEvent records) ────────
    if (action === 'summary') {
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const events = [];
      let skip = 0;
      const pageSize = 5000;
      while (true) {
        const page = await base44.asServiceRole.entities.GameEvent.list('-created_date', pageSize, skip);
        events.push(...page);
        if (page.length < pageSize) break;
        skip += pageSize;
      }
      const settled = events.filter(e => e.event_type === 'round_settled');

      if (settled.length === 0) return Response.json(null);

      const totalRounds  = settled.length;
      const totalBet     = settled.reduce((s, e) => s + (e.total_bet || 0), 0);
      const totalPayout  = settled.reduce((s, e) => s + (e.total_payout || 0), 0);
      const netResult    = totalPayout - totalBet;
      const houseEdge    = totalBet > 0 ? (totalBet - totalPayout) / totalBet : 0;
      const avgBet       = totalBet / totalRounds;
      const avgPayout    = totalPayout / totalRounds;
      const wins         = settled.filter(e => (e.total_payout || 0) > (e.total_bet || 0)).length;
      const winRate      = wins / totalRounds;

      // Helper: safely check if an object field has any positive value
      // Handles cases where the field may be stored as a nested object or be null/undefined
      const hasBet = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        return Object.values(obj).some(v => Number(v) > 0);
      };
      const hasRiverBet = (e) => {
        const lh = e.low_high_bet;
        if (!lh) return false;
        if (typeof lh === 'object') return Number(lh.amount || 0) > 0;
        return false;
      };

      // Board win rates: wins / rounds where player actually placed a bet on that board
      const withCardBet  = settled.filter(e => hasBet(e.hand_bets));
      const withRankBet  = settled.filter(e => hasBet(e.rank_bets));
      const withColorBet = settled.filter(e => hasBet(e.color_bets));
      const withRiverBet = settled.filter(e => hasRiverBet(e));

      // Card win: player bet on a winning hand (their specific bet hand won)
      const cardWins  = withCardBet.filter(e => {
        const winnerIds = (e.winner_hand_ids || []).map(String);
        return winnerIds.some(wid => Number(e.hand_bets[wid] || e.hand_bets[Number(wid)] || 0) > 0);
      }).length;
      // Rank win: recomputed from raw data — player's exact bet key must match winning rank
      // (never trust saved rank_win boolean — old records may have been saved incorrectly)
      const rankWins  = withRankBet.filter(e => {
        if (!e.winning_rank) return false;
        const rb = e.rank_bets || {};
        return Object.entries(rb).some(([key, amt]) => Number(amt) > 0 && key === e.winning_rank);
      }).length;
      // Color win: recomputed from raw data — player's bet key must be in winning_colors
      const colorWins = withColorBet.filter(e => {
        const winColors = e.winning_colors || [];
        return winColors.some(wc => Number((e.color_bets || {})[wc] || 0) > 0);
      }).length;
      // River win: recomputed from raw data — player's bet type must match winning_low_high
      const riverWins = withRiverBet.filter(e => {
        const lh = e.low_high_bet;
        if (!lh || !e.winning_low_high) return false;
        const betType = typeof lh === 'object' ? lh.type : null;
        return betType === e.winning_low_high;
      }).length;

      const cardWinRate  = withCardBet.length  > 0 ? cardWins  / withCardBet.length  : null;
      const rankWinRate  = withRankBet.length  > 0 ? rankWins  / withRankBet.length  : null;
      const colorWinRate = withColorBet.length > 0 ? colorWins / withColorBet.length : null;
      const riverWinRate = withRiverBet.length > 0 ? riverWins / withRiverBet.length : null;

      // Per-board: Games / Board wins (house won) / Player wins
      const cardGames       = withCardBet.length;
      const cardPlayerWins  = cardWins;
      const cardBoardWins   = cardGames - cardPlayerWins;

      const rankGames       = withRankBet.length;
      const rankPlayerWins  = rankWins;
      const rankBoardWins   = rankGames - rankPlayerWins;

      const colorGames      = withColorBet.length;
      const colorPlayerWins = colorWins;
      const colorBoardWins  = colorGames - colorPlayerWins;

      const riverGames      = withRiverBet.length;
      const riverPlayerWins = riverWins;
      const riverBoardWins  = riverGames - riverPlayerWins;

      // Kill switch: rounds where player had hand+rank bets but no color or river (gate was closed)
      const killSwitchRounds = settled.filter(e => e.kill_switch_active).length;
      const gateClosedRounds = settled.filter(e => {
        return hasBet(e.hand_bets) && hasBet(e.rank_bets) && !hasBet(e.color_bets) && !hasRiverBet(e);
      }).length;
      const killSwitchRate = totalRounds > 0 ? (killSwitchRounds + gateClosedRounds) / totalRounds : 0;

      // ── Betting Pattern Breakdown ─────────────────────────────────────────
      const bettingPatterns = { cardsOnly: 0, cardsRank: 0, cardsRankColor: 0, cardsRankRiver: 0, allFour: 0, other: 0 };
      settled.forEach(e => {
        const hasHand  = hasBet(e.hand_bets);
        const hasRank  = hasBet(e.rank_bets);
        const hasColor = hasBet(e.color_bets);
        const hasRiver = hasRiverBet(e);
        if (!hasHand) { bettingPatterns.other++; return; }
        if (hasHand && hasRank && hasColor && hasRiver) bettingPatterns.allFour++;
        else if (hasHand && hasRank && hasColor)        bettingPatterns.cardsRankColor++;
        else if (hasHand && hasRank && hasRiver)        bettingPatterns.cardsRankRiver++;
        else if (hasHand && hasRank)                    bettingPatterns.cardsRank++;
        else                                            bettingPatterns.cardsOnly++;
      });

      // Rank breakdown
      const rankBreakdown = {};
      settled.forEach(e => {
        if (e.winning_rank) {
          rankBreakdown[e.winning_rank] = (rankBreakdown[e.winning_rank] || 0) + 1;
        }
      });

      // Color breakdown
      const colorBreakdown = {};
      settled.forEach(e => {
        (e.winning_colors || []).forEach(c => {
          colorBreakdown[c] = (colorBreakdown[c] || 0) + 1;
        });
      });

      // River breakdown
      const riverBreakdown = { LOW: 0, HIGH: 0 };
      settled.forEach(e => {
        if (e.winning_low_high === 'LOW') riverBreakdown.LOW++;
        if (e.winning_low_high === 'HIGH') riverBreakdown.HIGH++;
      });

      // ── Player-side breakdowns ─────────────────────────────────────────────

      // Player Hand breakdown: per hand ID the player bet on — games / wins / losses
      const playerHandBreakdown: Record<string, { games: number; wins: number; losses: number }> = {};
      withCardBet.forEach(e => {
        const hb = e.hand_bets || {};
        const winnerIds = (e.winner_hand_ids || []).map(String);
        Object.entries(hb).forEach(([hid, amt]) => {
          if (Number(amt) <= 0) return;
          if (!playerHandBreakdown[hid]) playerHandBreakdown[hid] = { games: 0, wins: 0, losses: 0 };
          playerHandBreakdown[hid].games++;
          if (winnerIds.includes(String(hid))) playerHandBreakdown[hid].wins++;
          else playerHandBreakdown[hid].losses++;
        });
      });

            // Player Rank breakdown: per rank key the player bet on — games / wins / losses
      const playerRankBreakdown: Record<string, { games: number; wins: number; losses: number }> = {};
      withRankBet.forEach(e => {
        const rb = e.rank_bets || {};
        const winningRank = e.winning_rank || null;
        Object.entries(rb).forEach(([key, amt]) => {
          if (Number(amt) <= 0) return;
          if (!playerRankBreakdown[key]) playerRankBreakdown[key] = { games: 0, wins: 0, losses: 0 };
          playerRankBreakdown[key].games++;
          if (key === winningRank) playerRankBreakdown[key].wins++;
          else playerRankBreakdown[key].losses++;
        });
      });

      // Player Color breakdown: per color key the player bet on — games / wins / losses
      const playerColorBreakdown: Record<string, { games: number; wins: number; losses: number }> = {};
      withColorBet.forEach(e => {
        const cb = e.color_bets || {};
        const winColors = e.winning_colors || [];
        Object.entries(cb).forEach(([key, amt]) => {
          if (Number(amt) <= 0) return;
          if (!playerColorBreakdown[key]) playerColorBreakdown[key] = { games: 0, wins: 0, losses: 0 };
          playerColorBreakdown[key].games++;
          if (winColors.includes(key)) playerColorBreakdown[key].wins++;
          else playerColorBreakdown[key].losses++;
        });
      });

      // Player River breakdown: LOW / HIGH — games / wins / losses
      const playerRiverBreakdown: Record<string, { games: number; wins: number; losses: number }> = {
        LOW:  { games: 0, wins: 0, losses: 0 },
        HIGH: { games: 0, wins: 0, losses: 0 },
      };
      withRiverBet.forEach(e => {
        const lh = e.low_high_bet;
        if (!lh) return;
        const betType: string = typeof lh === 'object' ? (lh as any).type : null;
        if (!betType || !['LOW','HIGH'].includes(betType)) return;
        playerRiverBreakdown[betType].games++;
        if (betType === e.winning_low_high) playerRiverBreakdown[betType].wins++;
        else playerRiverBreakdown[betType].losses++;
      });

      // Hand win breakdown
      const handWinBreakdown = {};
      settled.forEach(e => {
        (e.winner_hand_ids || []).forEach(hid => {
          handWinBreakdown[hid] = (handWinBreakdown[hid] || 0) + 1;
        });
      });

      // Hand bet breakdown
      const handBetBreakdown = {};
      settled.forEach(e => {
        Object.keys(e.hand_bets || {}).forEach(hid => {
          if ((e.hand_bets[hid] || 0) > 0) {
            handBetBreakdown[hid] = (handBetBreakdown[hid] || 0) + 1;
          }
        });
      });

      return Response.json({
        totalRounds, totalBet, totalPayout, netResult, houseEdge,
        avgBet, avgPayout, winRate,
        cardWinRate, rankWinRate, colorWinRate, riverWinRate,
        withCardBetCount: withCardBet.length,
        withRankBetCount: withRankBet.length,
        withColorBetCount: withColorBet.length,
        withRiverBetCount: withRiverBet.length,
        cardGames, cardBoardWins, cardPlayerWins,
        rankGames, rankBoardWins, rankPlayerWins,
        colorGames, colorBoardWins, colorPlayerWins,
        riverGames, riverBoardWins, riverPlayerWins,
        killSwitchRate,
        bettingPatterns,
        rankBreakdown, colorBreakdown, riverBreakdown,
        handWinBreakdown, handBetBreakdown,
        playerRankBreakdown, playerColorBreakdown, playerRiverBreakdown,
        playerHandBreakdown,
      });
    }

    // ── Clear (admin-only) ─────────────────────────────────────────────────
    if (action === 'clear') {
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const events = [];
      let skip = 0;
      const pageSize = 5000;
      while (true) {
        const page = await base44.asServiceRole.entities.GameEvent.list('-created_date', pageSize, skip);
        events.push(...page);
        if (page.length < pageSize) break;
        skip += pageSize;
      }
      await Promise.all(events.map(e => base44.asServiceRole.entities.GameEvent.delete(e.id)));
      return Response.json({ ok: true, deleted: events.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});