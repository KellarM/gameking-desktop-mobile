import { COLOR_BOARD_PAYOUTS } from '@/lib/payoutConstants';

export const COLOR_KEYS = ['3R', '4R', '5R', '3B', '4B', '5B'];
const COLOR_LABELS = { '3R': '3 Red', '4R': '4 Red', '5R': '5 Red', '3B': '3 Black', '4B': '4 Black', '5B': '5 Black' };

export default function ColorBetsTable({ colorBets, onChange, disabled }) {
  return (
    <div className={`rounded-lg border border-slate-700 overflow-hidden ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Odds</th>
            <th className="px-2 py-1.5 text-left">Color Board</th>
            <th className="px-2 py-1.5 text-right">Bet</th>
          </tr>
        </thead>
        <tbody>
          {COLOR_KEYS.map((key, i) => (
            <tr key={key} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
              <td className="px-2 py-1 text-blue-300 font-semibold">{COLOR_BOARD_PAYOUTS[key]}:1</td>
              <td className={`px-2 py-1 font-bold whitespace-nowrap ${key.endsWith('R') ? 'text-red-400' : 'text-gray-300'}`}>{COLOR_LABELS[key]}</td>
              <td className="px-2 py-1 text-right">
                <input
                  type="number"
                  min="0"
                  value={colorBets[key] || ''}
                  onChange={e => onChange(key, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  disabled={disabled}
                  className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {disabled && (
        <p className="text-amber-400 text-[10px] px-2 py-1.5 border-t border-amber-700/60 leading-snug font-semibold">
          ⛔ Manual bets locked — Rank board cap not met or a color strategy is active.
        </p>
      )}
    </div>
  );
}