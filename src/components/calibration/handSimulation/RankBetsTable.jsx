export const RANK_KEYS = [
  'Four of a Kind', 'Full House', 'Flush', 'Straight',
  'Three of a Kind', 'Two Pair', 'One Pair',
];

export default function RankBetsTable({ rankBets, onChange }) {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Odds</th>
            <th className="px-2 py-1.5 text-left">Ranked Hand</th>
            <th className="px-2 py-1.5 text-right">Bet</th>
          </tr>
        </thead>
        <tbody>
          {RANK_KEYS.map((rank, i) => (
            <tr key={rank} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
              <td className="px-2 py-1 text-gray-500 italic">Mixed</td>
              <td className="px-2 py-1 text-white font-bold whitespace-nowrap">{rank}</td>
              <td className="px-2 py-1 text-right">
                <input
                  type="number"
                  min="0"
                  value={rankBets[rank] || ''}
                  onChange={e => onChange(rank, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}