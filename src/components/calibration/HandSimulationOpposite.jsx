import { useState, useEffect } from 'react';
import { Play, RefreshCw, Trash2, FlaskConical, FileDown } from 'lucide-react';
import { CARDED_HAND_PAYOUTS, COLOR_BOARD_PAYOUTS, RIVER_STATE_PAYOUTS } from '@/lib/payoutConstants';
import { PER_HAND_RANK_PAYOUTS } from '@/lib/perHandRankPayouts';
import { runHandSimulationRun, runHandSimulationRecalculate, clearHandSimulationBuffer, runHandSimulationExport } from '@/lib/handSimulationBridgeOpposite';
import HandBetsTable from './handSimulation/HandBetsTableOpposite';
import RankBetsTable, { RANK_KEYS } from './handSimulation/RankBetsTable';
import ColorBetsTable, { COLOR_KEYS } from './handSimulation/ColorBetsTable';
import LowHighBetTable from './handSimulation/LowHighBetTable';
import ColorStrategySelector from './handSimulation/ColorStrategySelector';
import PercentPaidTables from './handSimulation/PercentPaidTables';
import ResultsSummary from './handSimulation/ResultsSummary';
import RoundPayoutTable from './handSimulation/RoundPayoutTable';
import { clampRankBet, clampColorBet, handTotal, rankTotal, colorTotal } from '@/lib/simBetCaps';

const DEFAULT_HAND_BETS = Array(10).fill(0);
const DEFAULT_RANK_BETS = Object.fromEntries(RANK_KEYS.map(r => [r, 0]));
const DEFAULT_COLOR_BETS = Object.fromEntries(COLOR_KEYS.map(c => [c, 0]));
const DEFAULT_HAND_PCT = Array(11).fill(100);
const DEFAULT_RANK_PCT = Array(8).fill(100);
const DEFAULT_ROUNDS = 10000;
const DEFAULT_CHECKPOINTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

export default function HandSimulationOpposite() {
  const [handBets, setHandBets] = useState(DEFAULT_HAND_BETS);
  const [rankBets, setRankBets] = useState(DEFAULT_RANK_BETS);
  const [colorBets, setColorBets] = useState(DEFAULT_COLOR_BETS);
  const [lowHighModes, setLowHighModes] = useState([]);
  const [colorStrategy, setColorStrategy] = useState('manual');
  const [handCandidates, setHandCandidates] = useState(Array(10).fill(false));
  const [handPercentPaid, setHandPercentPaid] = useState(DEFAULT_HAND_PCT);
  const [rankPercentPaid, setRankPercentPaid] = useState(DEFAULT_RANK_PCT);
  const [targetRTP, setTargetRTP] = useState(96.5);
  const [upperWarningBuffer, setUpperWarningBuffer] = useState(1.5);
  const [lowerWarningBuffer, setLowerWarningBuffer] = useState(6.5);
  const [numberOfRounds, setNumberOfRounds] = useState(DEFAULT_ROUNDS);
  const [roundCheckpoints, setRoundCheckpoints] = useState(DEFAULT_CHECKPOINTS);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [exporting, setExporting] = useState(false);

  const rankCapMet = handTotal(handBets) > 0 && rankTotal(rankBets) === handTotal(handBets);
  useEffect(() => {
    if (!rankCapMet) {
      if (colorStrategy !== 'manual') setColorStrategy('manual');
      if (lowHighModes.length) setLowHighModes([]);
      if (colorTotal(colorBets) > 0) setColorBets(DEFAULT_COLOR_BETS);
    }
  }, [rankCapMet]);

  const buildParams = () => ({
    rounds: numberOfRounds,
    handBets,
    rankBets,
    colorBets,
    lowHighModes,
    colorStrategy,
    handCandidates,
    handPayouts: CARDED_HAND_PAYOUTS,
    perHandRankPayouts: PER_HAND_RANK_PAYOUTS,
    colorPayouts: COLOR_BOARD_PAYOUTS,
    riverStatePayouts: RIVER_STATE_PAYOUTS,
    handPercentPaid,
    rankPercentPaid,
    roundCheckpoints,
  });

  const handleRunTest = async () => {
    setRunning(true);
    setProgress({ done: 0, total: numberOfRounds });
    try {
      const data = await runHandSimulationRun(buildParams(), (done, total) => setProgress({ done, total }));
      setResults(data);
      setHasRun(true);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  const handleCalculate = async () => {
    if (!hasRun) return;
    setRunning(true);
    setProgress({ done: 0, total: numberOfRounds });
    try {
      const data = await runHandSimulationRecalculate(buildParams(), (done, total) => setProgress({ done, total }));
      setResults(data);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  const handleClear = async () => {
    await clearHandSimulationBuffer();
    setHandBets(DEFAULT_HAND_BETS);
    setRankBets(DEFAULT_RANK_BETS);
    setColorBets(DEFAULT_COLOR_BETS);
    setLowHighModes([]);
    setColorStrategy('manual');
    setHandCandidates(Array(10).fill(false));
    setHandPercentPaid(DEFAULT_HAND_PCT);
    setRankPercentPaid(DEFAULT_RANK_PCT);
    setTargetRTP(96.5);
    setUpperWarningBuffer(1.5);
    setLowerWarningBuffer(6.5);
    setNumberOfRounds(DEFAULT_ROUNDS);
    setRoundCheckpoints(DEFAULT_CHECKPOINTS);
    setResults(null);
    setHasRun(false);
  };

  const handleExport = async () => {
    if (!hasRun) return;
    setExporting(true);
    try {
      const data = await runHandSimulationExport(buildParams());
      const csvRows = [data.csvHeader];
      data.rows.forEach(row => {
        csvRows.push([
          row.round,
          row.flopC1Rank, row.flopC1Suit,
          row.flopC2Rank, row.flopC2Suit,
          row.flopC3Rank, row.flopC3Suit,
          row.turnC4Rank, row.turnC4Suit,
          row.riverC5Rank, row.riverC5Suit,
          `"${row.winningHand}"`,
          `"${row.winningHand2}"`,
          row.winningRank,
          row.sharedWin,
          row.houseWin,
          row.rankException,
          row.red3, row.red4, row.red5,
          row.black3, row.black4, row.black5,
          row.low, row.high,
          row.lowHighWager.toFixed(2),
          row.bet.toFixed(2),
          row.won.toFixed(2),
          row.net.toFixed(2),
          row.runningBalance.toFixed(2),
        ].join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HandSimulation_Opposite_${data.roundsExported}rounds_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const checkpointPayouts = results?.checkpoints?.map(c => c.net);

  return (
    <div className="space-y-3">
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
        <div className="flex items-start gap-3">
          <FlaskConical className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-1">Hand Simulations — Opposite Deck</h3>
            <p className="text-gray-400 text-sm">
              <span className="text-green-400 font-semibold">Run Test</span> generates a new random round set using the opposite hand set. <span className="text-blue-400 font-semibold">Calculate</span> re-scores the same rounds with your updated bets/% Paid — no new randomness.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="space-y-3">
          <HandBetsTable handBets={handBets} onChange={(i, v) => setHandBets(prev => prev.map((b, idx) => idx === i ? v : b))} handCandidates={handCandidates} onCandidateChange={(i, v) => setHandCandidates(prev => prev.map((c, idx) => idx === i ? v : c))} />
          <RankBetsTable rankBets={rankBets} onChange={(rank, v) => setRankBets(prev => ({ ...prev, [rank]: clampRankBet(handBets, prev, rank, v) }))} />
          <ColorBetsTable colorBets={colorBets} disabled={colorStrategy !== 'manual' || !rankCapMet} onChange={(key, v) => setColorBets(prev => ({ ...prev, [key]: clampColorBet(handBets, rankBets, prev, key, v) }))} />
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-2.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Target RTP</span>
              <input type="number" step="0.1" value={targetRTP} onChange={e => setTargetRTP(parseFloat(e.target.value) || 0)}
                className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold text-xs outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Upper Warning Buffer</span>
              <input type="number" step="0.1" value={upperWarningBuffer} onChange={e => setUpperWarningBuffer(parseFloat(e.target.value) || 0)}
                className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold text-xs outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Lower Warning Buffer</span>
              <input type="number" step="0.1" value={lowerWarningBuffer} onChange={e => setLowerWarningBuffer(parseFloat(e.target.value) || 0)}
                className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold text-xs outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Number of Rounds</span>
              <input type="number" min="10" max="2000000" value={numberOfRounds}
                onChange={e => setNumberOfRounds(Math.min(2000000, Math.max(10, parseInt(e.target.value) || 10)))}
                className="w-24 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold text-xs outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          </div>

          <ResultsSummary results={results} targetRTP={targetRTP} upperWarningBuffer={upperWarningBuffer} lowerWarningBuffer={lowerWarningBuffer} />
          <ColorStrategySelector value={colorStrategy} onChange={setColorStrategy} disabled={!rankCapMet} />
        </div>

        <div className="space-y-2">
          <PercentPaidTables
            handPercentPaid={handPercentPaid}
            rankPercentPaid={rankPercentPaid}
            onHandChange={(count, v) => setHandPercentPaid(prev => prev.map((p, idx) => idx === count ? v : p))}
            onRankChange={(count, v) => setRankPercentPaid(prev => prev.map((p, idx) => idx === count ? v : p))}
          />

          <div className="flex gap-2">
            <button
              onClick={handleRunTest}
              disabled={running}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              <Play className="w-3.5 h-3.5" /> {running ? 'Running…' : 'Run Test'}
            </button>
            <button
              onClick={handleCalculate}
              disabled={running || !hasRun}
              title={!hasRun ? 'Run a test first' : 'Recalculate using the same simulated rounds'}
              className="flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold text-xs transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Calc
            </button>
            <button
              onClick={handleClear}
              disabled={running}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-600 text-gray-400 hover:text-red-400 hover:border-red-700 disabled:opacity-50 text-xs transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={running || exporting || !hasRun}
            title={!hasRun ? 'Run a test first' : 'Export up to 100,000 rounds as CSV (opens in Excel)'}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-700 text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-40 text-xs font-semibold transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> {exporting ? 'Exporting…' : 'Export to Excel (CSV)'}
          </button>

          {running && progress && (
            <div className="text-xs text-gray-400 text-center">
              {progress.done.toLocaleString()} / {progress.total.toLocaleString()} rounds
            </div>
          )}

          <div className="mt-10">
            <LowHighBetTable modes={lowHighModes} onChange={setLowHighModes} disabled={!rankCapMet} />
          </div>
        </div>

        <div>
          <RoundPayoutTable
            rounds={roundCheckpoints}
            payouts={checkpointPayouts}
            onChange={(i, v) => setRoundCheckpoints(prev => prev.map((r, idx) => idx === i ? v : r))}
          />
        </div>
      </div>
    </div>
  );
}