function PercentPaidColumn({ title, values, onChange, countLabel }) {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">{countLabel} Count</th>
            <th className="px-2 py-1.5 text-right">% Paid</th>
          </tr>
        </thead>
        <tbody>
          {values.map((pct, count) => (
            <tr key={count} className={count % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
              <td className="px-2 py-1 text-white font-bold">{count}</td>
              <td className="px-2 py-1 text-right">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pct}
                  onChange={e => onChange(count, Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-16 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide bg-slate-800 px-2 py-1 border-t border-slate-700 text-center">
        {title}
      </p>
    </div>
  );
}

export default function PercentPaidTables({ handPercentPaid, rankPercentPaid, onHandChange, onRankChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <PercentPaidColumn title="Hand Count % Paid" values={handPercentPaid} onChange={onHandChange} countLabel="Hand" />
      <PercentPaidColumn title="Rank Count % Paid" values={rankPercentPaid} onChange={onRankChange} countLabel="Rank" />
    </div>
  );
}