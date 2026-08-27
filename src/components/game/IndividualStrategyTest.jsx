// ============================================================
// EXPLOIT HUNTER
// Scans all 70 bet positions for RTP ceiling violations.
// Plain-English explanation of every finding. Full CSV export.
//
// The heavy scan runs in a Web Worker (src/workers/exploitHunterWorker.js)
// so the UI stays responsive during 10k–250k round scans.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, RefreshCw, ShieldAlert, Download, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { CARDED_HAND_PAYOUTS, COLOR_BOARD_PAYOUTS, LOW_HIGH_PAYOUT } from '@/lib/payoutConstants';
import { PER_HAND_RANK_PAYOUTS } from '@/lib/perHandRankPayouts';

// ── CSV export (UI-side, runs against the results objects returned by the worker) ──
function exportCSV(results, rtpCeiling, rounds) {
  const rows = [
    `Exploit Hunter Scan — Rounds: ${rounds.toLocaleString()} | RTP Ceiling: ${rtpCeiling}% | Date: ${new Date().toLocaleString()}`,
    '',
    'Group,Position,Type,Payout,HandWins,Wins,WinFreq%,RTP%,OverUnder%,FairOdds,For96.5%,For95%,Flagged,Severity,Explanation',
  ];
  for (const r of results) {
    rows.push([
      `"${r.group}"`, `"${r.label}"`, r.type, r.payout,
      Math.round(r.handWins), Math.round(r.wins),
      r.winFreq, r.rtp, r.overUnder,
      r.fairOdds, r.for965, r.for95,
      r.flagged?'YES':'NO', r.severity,
      `"${r.explanation}"`,
    ].join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `RapidFire_ExploitScan_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

const GROUP_ORDER = ['Carded Hands','Hand Ranks','Color Board','Low / High'];
const SEV_STYLES = {
  HIGH:   'bg-red-700 text-white',
  MEDIUM: 'bg-orange-600 text-white',
  LOW:    'bg-yellow-600 text-white',
  OK:     'bg-slate-700 text-slate-300',
};

export default function ExploitHunter({ onClose }) {
  const [rounds, setRounds]           = useState(50000);
  const [rtpCeiling, setRtpCeiling]   = useState(98.5);
  const [results, setResults]         = useState(null);
  const [running, setRunning]         = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [expandedPos, setExpandedPos] = useState(null);
  const [showAll, setShowAll]         = useState(false);
  const [error, setError]             = useState(null);
  const workerRef = useRef(null);
  const callIdRef = useRef(0);

  // Spin up the worker once for the component's lifetime
  useEffect(() => {
    const w = new Worker(new URL('../../workers/exploitHunterWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e) => {
      const { type, pct, results: r, error: err } = e.data;
      if (type === 'PROGRESS') setProgressPct(pct ?? 0);
      else if (type === 'RESULT') { setResults(r); setRunning(false); setProgressPct(100); }
      else if (type === 'ERROR') { setError(err || 'Scan failed'); setRunning(false); }
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, []);

  function run() {
    setError(null);
    setRunning(true);
    setResults(null);
    setExpandedPos(null);
    setProgressPct(0);
    callIdRef.current += 1;
    const callId = callIdRef.current;
    workerRef.current?.postMessage({
      type: 'SCAN', callId, rounds, rtpCeiling,
      cardedPayouts: CARDED_HAND_PAYOUTS,
      colorPayouts: COLOR_BOARD_PAYOUTS,
      lowHighPayout: LOW_HIGH_PAYOUT,
      perHandRankPayouts: PER_HAND_RANK_PAYOUTS,
    });
  }

  const flagged = results?.filter(r => r.flagged).sort((a,b) => b.rtpNum - a.rtpNum) ?? [];
  const clean   = results?.filter(r => !r.flagged) ?? [];

  const groupedAll = results
    ? GROUP_ORDER.map(g => ({ group: g, items: results.filter(r => r.group === g).sort((a,b) => b.rtpNum - a.rtpNum) }))
    : [];

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
        <motion.div initial={{scale:0.95,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}}
          className="w-full max-w-4xl bg-slate-950 border border-red-700/30 rounded-2xl shadow-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400"/>
              <div>
                <h2 className="text-lg font-bold text-white">Exploit Hunter</h2>
                <p className="text-xs text-slate-400">Scans all 70 bet positions for RTP ceiling violations — with plain-English findings</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-lg font-bold">×</button>
          </div>

          <div className="p-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end mb-5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rounds per position</label>
                <select value={rounds} onChange={e => setRounds(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
                  <option value={10000}>10,000 (fast, rough)</option>
                  <option value={50000}>50,000 (balanced)</option>
                  <option value={100000}>100,000 (accurate)</option>
                  <option value={250000}>250,000 (high confidence)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">RTP Ceiling</label>
                <select value={rtpCeiling} onChange={e => setRtpCeiling(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
                  <option value={98}>98.0% (GLI strict)</option>
                  <option value={98.5}>98.5% (house standard)</option>
                  <option value={99}>99.0% (lenient)</option>
                </select>
              </div>
              <button onClick={run} disabled={running}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-900/40 border border-red-700 text-white font-bold text-sm hover:bg-red-900/60 transition-colors disabled:opacity-50">
                {running ? <><RefreshCw className="w-4 h-4 animate-spin"/>Scanning...</> : <><Search className="w-4 h-4"/>Run Scan</>}
              </button>
              {results && (
                <button onClick={() => exportCSV(results, rtpCeiling, rounds)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-colors">
                  <Download className="w-4 h-4"/>Export CSV
                </button>
              )}
            </div>

            {/* Live progress bar */}
            {running && (
              <div className="mb-5">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-red-500 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.2 }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-right">{progressPct.toFixed(0)}% — scanning in background, UI stays responsive</p>
              </div>
            )}

            {error && (
              <div className="mb-5 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-xs text-red-200">
                Scan error: {error}
              </div>
            )}

            {/* How to read this */}
            <div className="flex items-start gap-2 bg-slate-800/40 border border-slate-700/40 rounded-lg px-4 py-3 mb-5 text-xs text-slate-400">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500"/>
              <span><strong className="text-slate-300">How to read this:</strong> A violation means the payout odds for that bet are too generous relative to how often it actually wins. The RTP exceeds your ceiling. Click any flagged position to see a plain-English explanation of what's wrong and what odds would fix it. Export to CSV for a full breakdown of all 70 positions.</span>
            </div>

            {results && (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 text-center">
                    <div className="text-xs text-slate-400">Scanned</div>
                    <div className="text-xl font-bold text-white">{results.length}</div>
                  </div>
                  <div className={`rounded-lg p-3 border text-center ${flagged.length>0?'bg-red-900/20 border-red-700/40':'bg-green-900/20 border-green-700/40'}`}>
                    <div className="text-xs text-slate-400">Violations</div>
                    <div className={`text-xl font-bold ${flagged.length>0?'text-red-400':'text-green-400'}`}>{flagged.length}</div>
                  </div>
                  <div className="bg-green-900/20 rounded-lg p-3 border border-green-700/40 text-center">
                    <div className="text-xs text-slate-400">Clean</div>
                    <div className="text-xl font-bold text-green-400">{clean.length}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 text-center">
                    <div className="text-xs text-slate-400">Rounds/Position</div>
                    <div className="text-xl font-bold text-white">{rounds.toLocaleString()}</div>
                  </div>
                </div>

                {/* Violations */}
                {flagged.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⚠ Violations — above {rtpCeiling}% ceiling</div>
                    <div className="space-y-2">
                      {flagged.map(r => (
                        <div key={r.key} className="rounded-lg border border-red-800/40 bg-red-950/20 overflow-hidden">
                          <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                            onClick={() => setExpandedPos(p => p===r.key?null:r.key)}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded font-bold ${SEV_STYLES[r.severity]}`}>{r.severity}</span>
                              <span className="text-sm text-white font-medium">{r.label}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-slate-400">Win rate: <strong className="text-white">{r.winFreq}%</strong></span>
                              <span className="text-slate-400">RTP: <strong className="text-red-300">{r.rtp}%</strong></span>
                              <span className="text-slate-400">Over by: <strong className="text-red-300">+{r.overUnder}%</strong></span>
                              <span className="text-slate-400">Fix → <strong className="text-yellow-300">{r.for965}:1</strong></span>
                              {expandedPos===r.key?<ChevronDown className="w-4 h-4 text-slate-400"/>:<ChevronRight className="w-4 h-4 text-slate-400"/>}
                            </div>
                          </button>
                          {expandedPos===r.key && (
                            <div className="px-4 pb-4 border-t border-red-900/30">
                              <div className="mt-3 bg-slate-900/60 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">{r.explanation}</div>
                              <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                                <div className="bg-slate-800/60 rounded p-2"><div className="text-slate-500">Current Payout</div><div className="font-bold text-white">{r.payout}:1</div></div>
                                <div className="bg-slate-800/60 rounded p-2"><div className="text-slate-500">Fair Odds (100%)</div><div className="font-bold text-yellow-300">{r.fairOdds}:1</div></div>
                                <div className="bg-slate-800/60 rounded p-2"><div className="text-slate-500">For 95% RTP</div><div className="font-bold text-green-300">{r.for95}:1</div></div>
                                <div className="bg-slate-800/60 rounded p-2"><div className="text-slate-500">For 96.5% RTP</div><div className="font-bold text-green-300">{r.for965}:1</div></div>
                              </div>
                              {r.type==='perHandRank' && (
                                <div className="mt-2 text-xs text-slate-500">Note: RTP for hand+rank bets is calculated conditionally — only counting rounds where that hand won, then measuring how often it hit the specific rank.</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {flagged.length===0 && (
                  <div className="flex items-center gap-3 bg-green-900/20 border border-green-700/40 rounded-xl px-5 py-4 mb-5">
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0"/>
                    <div>
                      <div className="font-bold text-green-300">No violations detected</div>
                      <div className="text-xs text-slate-400">All {results.length} positions are within the {rtpCeiling}% RTP ceiling across {rounds.toLocaleString()} simulated rounds.</div>
                    </div>
                  </div>
                )}

                {/* Full table toggle */}
                <button onClick={() => setShowAll(s => !s)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3">
                  {showAll?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
                  {showAll?'Hide':'Show'} full table — all {results.length} positions
                </button>

                {showAll && (
                  <div className="space-y-4">
                    {groupedAll.map(({group, items}) => (
                      <div key={group}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</div>
                        <div className="rounded-lg overflow-hidden border border-slate-700/50">
                          <table className="w-full text-xs">
                            <thead><tr className="bg-slate-800/80 text-slate-400">
                              <th className="text-left px-3 py-2">Position</th>
                              <th className="text-right px-3 py-2">Win %</th>
                              <th className="text-right px-3 py-2">RTP</th>
                              <th className="text-right px-3 py-2">Payout</th>
                              <th className="text-right px-3 py-2">Fair Odds</th>
                              <th className="text-right px-3 py-2">For 96.5%</th>
                              <th className="text-center px-3 py-2">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-800">
                              {items.map(r => (
                                <tr key={r.key} className={r.flagged?'bg-red-950/15':''}>
                                  <td className="px-3 py-1.5 text-slate-300">{r.shortLabel}</td>
                                  <td className="px-3 py-1.5 text-right text-slate-400">{r.winFreq}%</td>
                                  <td className={`px-3 py-1.5 text-right font-bold ${r.flagged?'text-red-400':'text-green-400'}`}>{r.rtp}%</td>
                                  <td className="px-3 py-1.5 text-right text-slate-400">{r.payout}:1</td>
                                  <td className="px-3 py-1.5 text-right text-slate-400">{r.fairOdds}:1</td>
                                  <td className="px-3 py-1.5 text-right text-slate-400">{r.for965}:1</td>
                                  <td className="px-3 py-1.5 text-center">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${SEV_STYLES[r.severity]}`}>{r.severity}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}