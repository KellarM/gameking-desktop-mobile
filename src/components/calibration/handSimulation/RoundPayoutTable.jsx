export default function RoundPayoutTable({ rounds, payouts, onChange }) {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Round</th>
            <th className="px-2 py-1.5 text-right">Win Payout</th>
          </tr>
        </thead>
        <tbody className="block w-full">
          {rounds.map((round, i) => {
            const net = payouts?.[i];
            return (
              <tr key={i} className="table w-full table-fixed bg-amber-800/30">
                <td className="px-2 py-1 w-1/2">
                  <input
                    type="number"
                    min="1"
                    value={round}
                    onChange={e => onChange(i, parseInt(e.target.value) || 0)}
                    className="w-full bg-yellow-100 text-black text-left rounded px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </td>
                <td className={`px-2 py-1 w-1/2 text-right font-bold ${net < 0 ? 'text-red-400' : 'text-amber-200'}`}>
                  {net === undefined || net === null ? '$0.00' : `$${net.toFixed(2)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}