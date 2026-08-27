// observerAnalysis — live game observer engine v4 (SDK-based, fixed persistence)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const THEORETICAL = {
  handWinFreq: { 1: 0.0284, 2: 0.1042, 3: 0.0381, 4: 0.0521, 5: 0.0612, 6: 0.0743, 7: 0.1042, 8: 0.0743, 9: 0.0892, 10: 0.0284, board: 0.1820 },
  rankFreq: { 'High Card': 0.1741, 'One Pair': 0.4384, 'Two Pair': 0.2356, 'Three of a Kind': 0.0481, 'Straight': 0.0462, 'Flush': 0.0303, 'Full House': 0.0256, 'Four of a Kind': 0.0024, 'Straight Flush': 0.00139, 'Royal Flush': 0.000032 },
  colorFreq: { '3R': 0.3125, '3B': 0.3125, '4R': 0.1563, '4B': 0.1563, '5R': 0.0313, '5B': 0.0313 },
  lowHighFreq: { LOW: 0.4615, HIGH: 0.5385 }
};
const HAND_NAMES = ['A♦10♥','K♣K♠','Q♣J♠','Q♦10♠','J♣9♣','8♦6♦','7♦7♠','4♥2♥','3♣3♥','A♥5♦'];
const pct = (x) => (x * 100).toFixed(2) + '%';
const ddiff = (o, t) => ((o - t) * 100).toFixed(2);
const dL = (o, t) => Math.abs(o - t) >= 0.06 ? 'critical' : Math.abs(o - t) >= 0.03 ? 'warning' : 'ok';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action = 'analyze', question = '' } = body;

    // ── CLEAR ALL ROUNDS (admin-only) ────────────────────────────
    if (action === 'clearRounds') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const all = await base44.asServiceRole.entities.ObserverRound.list('-created_date', 5000);
      if (all.length) {
        await base44.asServiceRole.entities.ObserverRound.deleteMany({ id: { $in: all.map(r => r.id) } });
      }
      return Response.json({ success: true, deleted: all.length });
    }

    // ── SAVE A SINGLE ROUND ─────────────────────────────────────
    // NOTE: the frontend (Observer.jsx) already builds the record using the
    // ObserverRound entity's own snake_case field names — accept those directly.
    if (action === 'saveRound') {
      const { roundData } = body;
      if (!roundData) return Response.json({ error: 'No roundData provided' }, { status: 400 });
      // Use the caller's own context so RLS stamps created_by_id — prevents
      // cross-user injection of fabricated round data into the shared pool.
      const record = await base44.entities.ObserverRound.create({
        session_id: roundData.session_id || 'live',
        round_number: roundData.round_number,
        community_cards: roundData.community_cards || [],
        winner_hand_ids: roundData.winner_hand_ids || [],
        winning_rank: roundData.winning_rank || null,
        winning_colors: roundData.winning_colors || [],
        winning_low_high: roundData.winning_low_high || null,
        is_board_win: roundData.is_board_win || false,
        hand_bets: roundData.hand_bets || {},
        rank_bets: roundData.rank_bets || {},
        color_bets: roundData.color_bets || {},
        low_high_bet: roundData.low_high_bet || null,
        kill_switch_active: roundData.kill_switch_active || false,
        hand_bet_count: roundData.hand_bet_count || 0,
        total_bet: roundData.total_bet || 0,
        total_payout: roundData.total_payout || 0,
        net_result: roundData.net_result || 0,
        balance_before: roundData.balance_before || 0,
        balance_after: roundData.balance_after || 0,
        reds_count: roundData.reds_count || 0,
        blacks_count: roundData.blacks_count || 0,
        river_card: roundData.river_card || null,
      });
      return Response.json({ success: true, id: record.id });
    }

    // ── LOAD ROUNDS — all devices, all sessions (admin-only) ─────
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const rounds = await base44.asServiceRole.entities.ObserverRound.list('-created_date', 5000);
    const n = rounds.length;

    if (action === 'status') return Response.json({ roundsLoaded: n, ready: n >= 250 });
    if (n < 50) return Response.json({ error: 'Insufficient data', roundsLoaded: n, needed: 50 });

    // ── CRUNCH DATA ──────────────────────────────────────────────
    const hW = { board: 0 };
    for (let i = 1; i <= 10; i++) hW[i] = 0;
    const rC = {}, cC = { '3R': 0, '3B': 0, '4R': 0, '4B': 0, '5R': 0, '5B': 0 }, lC = { LOW: 0, HIGH: 0 }, bU = {};
    let ks = 0, tb = 0, tp = 0;

    for (const r of rounds) {
      if (r.is_board_win) hW.board++;
      else (r.winner_hand_ids || []).forEach((h) => { hW[h] = (hW[h] || 0) + 1; });
      if (r.winning_rank) rC[r.winning_rank] = (rC[r.winning_rank] || 0) + 1;
      (r.winning_colors || []).forEach((c) => { if (cC[c] !== undefined) cC[c]++; });
      if (r.winning_low_high) lC[r.winning_low_high]++;
      if (r.kill_switch_active) ks++;
      tb += r.total_bet || 0; tp += r.total_payout || 0;
      if (r.hand_bets) Object.keys(r.hand_bets).forEach((k) => { bU['hand_' + k] = (bU['hand_' + k] || 0) + 1; });
      if (r.color_bets) Object.keys(r.color_bets).forEach((k) => { bU['color_' + k] = (bU['color_' + k] || 0) + 1; });
      if (r.rank_bets) Object.keys(r.rank_bets).forEach((k) => { bU['rank_' + k] = (bU['rank_' + k] || 0) + 1; });
      if (r.low_high_bet?.type) bU['lh_' + r.low_high_bet.type] = (bU['lh_' + r.low_high_bet.type] || 0) + 1;
    }

    const df = [];
    const hD = Object.entries(hW).map(([id, w]) => {
      const o = w / n, t = THEORETICAL.handWinFreq[id] || 0, lv = dL(o, t);
      const nm = id === 'board' ? 'Board Win' : `Hand ${id} (${HAND_NAMES[Number(id) - 1]})`;
      if (lv !== 'ok') df.push({ category: 'Hand Win', position: nm, obs: pct(o), theo: pct(t), drift: ddiff(o, t) + 'pp', level: lv });
      return { hid: id, name: nm, obs: o, theo: t, level: lv, wins: w };
    });
    Object.entries(rC).forEach(([r, c]) => { const o = c / n, t = THEORETICAL.rankFreq[r] || 0, lv = dL(o, t); if (lv !== 'ok') df.push({ category: 'Rank', position: r, obs: pct(o), theo: pct(t), drift: ddiff(o, t) + 'pp', level: lv }); });
    Object.entries(cC).forEach(([k, c]) => { const o = c / n, t = THEORETICAL.colorFreq[k] || 0, lv = dL(o, t); if (lv !== 'ok') df.push({ category: 'Color', position: k, obs: pct(o), theo: pct(t), drift: ddiff(o, t) + 'pp', level: lv }); });
    ['LOW', 'HIGH'].forEach(t => { const o = lC[t] / n, th = THEORETICAL.lowHighFreq[t], lv = dL(o, th); if (lv !== 'ok') df.push({ category: 'River', position: t, obs: pct(o), theo: pct(th), drift: ddiff(o, th) + 'pp', level: lv }); });

    const ex = hD.filter(h => h.obs > (h.theo + 0.04) && h.wins >= 5).sort((a, b) => (b.obs - b.theo) - (a.obs - a.theo)).map(h => ({ position: h.name, observedFreq: pct(h.obs), theoreticalFreq: pct(h.theo), overFrequency: ddiff(h.obs, h.theo) + 'pp', severity: h.obs - h.theo >= 0.08 ? 'HIGH' : 'MEDIUM' }));
    const tb2 = Object.entries(bU).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p, c]) => ({ position: p, usageRate: pct(c / n) }));
    const ksr = ks / n, rtp = tb > 0 ? (tp / tb) * 100 : null, he = rtp ? (100 - rtp).toFixed(2) + '%' : null;
    const cr = df.filter(f => f.level === 'critical'), wr = df.filter(f => f.level === 'warning');
    const recs = [];
    if (!cr.length && !wr.length) recs.push('All frequencies within variance. No calibration needed.');
    cr.forEach(f => recs.push('CRITICAL: ' + f.position + ' drifting ' + f.drift + ' from theory.'));
    wr.forEach(f => recs.push('WARNING: ' + f.position + ' showing ' + f.drift + ' drift.'));
    if (ex.length) recs.push(ex.length + ' exploit candidate(s) detected.');
    if (rtp) { const r = +rtp.toFixed(2); recs.push(r > 97 ? 'RTP ' + r.toFixed(2) + '% above 97% ceiling.' : r < 88 ? 'RTP ' + r.toFixed(2) + '% unusually low.' : 'RTP ' + r.toFixed(2) + '% within range.'); }

    // ── PARTNER ASSIST ───────────────────────────────────────────
    let ans = null;
    if (action === 'ask' && question) {
      const q = question.toLowerCase();
      if (q.includes('rtp') || q.includes('house edge')) {
        ans = rtp ? `Based on ${n} rounds: ${rtp.toFixed(2)}% RTP (house edge: ${he}). ${rtp > 96 ? 'Above 96% target — check high-payout hands for drift.' : rtp < 90 ? 'Below healthy floor — verify tie-split logic.' : 'Healthy range.'}` : 'No bet data yet.';
      } else if (q.includes('exploit') || q.includes('weakness')) {
        ans = ex.length === 0 ? `No exploit candidates in ${n} rounds. ${n < 500 ? 'Small sample — keep observing.' : 'Good sign.'}` : `${ex.length} target(s): ${ex.map((e) => e.position + ' (+' + e.overFrequency + ')').join(', ')}. Run simulation to quantify edge.`;
      } else if (q.includes('kill') || q.includes('switch')) {
        ans = `Kill-switch: ${(ksr * 100).toFixed(1)}% of rounds (${ks}/${n}). ${ksr > 0.4 ? 'High — 3+ hand play frequent.' : ksr < 0.05 ? 'Low — not stress-tested yet.' : 'Normal range.'}`;
      } else if (q.includes('payout') || q.includes('calibrat') || q.includes('adjust')) {
        const top = df.sort((a, b) => Math.abs(+b.drift) - Math.abs(+a.drift)).slice(0, 3);
        ans = top.length === 0 ? `All within variance. Good data in, good data out. Run to 500+ rounds first.` : `Top drift: ${top.map((d) => d.position + ' (' + d.drift + ')').join(', ')}. Need 500+ rounds for confidence. At ${n} now.`;
      } else {
        ans = `${n} rounds observed.\nRTP: ${rtp ? rtp.toFixed(2) + '%' : 'pending'}\nKill-switch: ${(ksr * 100).toFixed(1)}%\nDrift flags: ${df.length} (${cr.length} critical, ${wr.length} warning)\nExploits: ${ex.length}\nAsk about RTP, exploits, kill-switch, or payout calibration.`;
      }
    }

    return Response.json({
      roundsAnalyzed: n,
      readyForSecurity: n >= 250,
      observedRTP: rtp ? +rtp.toFixed(2) : null,
      houseEdge: he,
      killSwitchRate: pct(ksr),
      driftFlags: df,
      exploitCandidates: ex,
      recommendations: recs,
      topBetPositions: tb2,
      handDrift: hD.map(h => ({ ...h, obs: pct(h.obs), theo: pct(h.theo) })),
      partnerAnswer: ans
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});