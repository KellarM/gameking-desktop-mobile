function StatBox({ label, value, round }) {
  const isNegative = typeof value === 'string' && value.includes('-');
  return (
    <div className="bg-amber-900/20 border border-amber-700/40 rounded px-2 py-1.5 flex justify-between items-center gap-2">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`font-bold text-sm ${isNegative ? 'text-red-400' : 'text-amber-300'}`}>{value}</span>
        {round != null && <span className="text-gray-500 text-[10px]">(rnd {round.toLocaleString()})</span>}
      </span>
    </div>
  );
}

export default function ResultsSummary({ results, targetRTP, upperWarningBuffer, lowerWarningBuffer, handBetCount, rankBetCount }) {
  const scenario = (() => {
    if (!results) return 'NO SIMULATION RUN';
    if (results.noBets) return 'NO BETS SELECTED';
    const low = targetRTP - lowerWarningBuffer;
    const high = targetRTP + upperWarningBuffer;
    if (results.rtp >= low && results.rtp <= high) return 'WITHIN TARGET RANGE';
    return 'OUT OF TARGET RANGE';
  })();

  const r = results && !results.noBets ? results : null;

  return (
    <div className="space-y-2">
      <StatBox label="Rounds Tested" value={r ? r.roundsTested.toLocaleString() : '0'} />
      <StatBox label="Total Bet" value={r ? `$${r.totalBet.toFixed(2)}` : '$0.00'} />
      <StatBox label="Total Won" value={r ? `$${r.totalWon.toFixed(2)}` : '$0.00'} />
      <StatBox label="Total Net" value={r ? `$${r.totalNet.toFixed(2)}` : '$0.00'} />
      <StatBox label="RTP" value={r ? `${r.rtp.toFixed(2)}%` : '0.00%'} />
      <StatBox label="House Edge" value={r ? `${r.houseEdge.toFixed(2)}%` : '0.00%'} />
      <StatBox label="Hit Frequency" value={r ? `${r.hitFrequency.toFixed(3)}%` : '0.000%'} />
      <StatBox label="Net-Win Frequency" value={r ? `${r.netWinFrequency.toFixed(3)}%` : '0.000%'} />
      <StatBox label="Best Run-Up" value={r ? `$${r.bestRunUp.toFixed(2)}` : '$0.00'} round={r ? r.bestRunUpRound : null} />
      <StatBox label="Worst Run" value={r ? `$${r.worstRun.toFixed(2)}` : '$0.00'} round={r ? r.worstRunRound : null} />
      <div className={`rounded px-2 py-2 text-center font-bold text-xs
        ${scenario === 'NO BETS SELECTED' ? 'bg-red-900/30 border border-red-700 text-red-300'
          : scenario === 'WITHIN TARGET RANGE' ? 'bg-green-900/30 border border-green-700 text-green-300'
          : scenario === 'OUT OF TARGET RANGE' ? 'bg-red-900/30 border border-red-700 text-red-300'
          : 'bg-slate-800 border border-slate-700 text-gray-400'}`}>
        {scenario}
      </div>
    </div>
  );
}