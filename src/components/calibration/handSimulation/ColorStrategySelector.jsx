export const COLOR_STRATEGIES = [
  { key: 'manual', label: 'Manual' },
  { key: '70_20_10', label: '70 / 20 / 10' },
  { key: 'three', label: 'Three' },
];

export default function ColorStrategySelector({ value, onChange, disabled }) {
  const safeValue = disabled ? 'manual' : value;
  return (
    <div className={`rounded-lg border overflow-hidden ${disabled ? 'border-amber-700/70 opacity-70' : 'border-slate-700'}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Color Board Strategy</th>
            <th className="px-2 py-1.5 text-right">Select</th>
          </tr>
        </thead>
        <tbody>
          {COLOR_STRATEGIES.map((opt, i) => (
            <tr key={opt.key} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
              <td className="px-2 py-1.5 text-white font-bold">{opt.label}</td>
              <td className="px-2 py-1.5 text-right">
                <input
                  type="radio"
                  name="colorStrategy"
                  checked={safeValue === opt.key}
                  onChange={() => onChange(opt.key)}
                  disabled={disabled && opt.key !== 'manual'}
                  className="w-4 h-4 accent-yellow-400 cursor-pointer"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {disabled && (
        <div className="px-2 py-1.5 bg-amber-900/30 border-t border-amber-700 text-amber-300 text-[10px] leading-snug font-semibold">
          ⛔ Locked — Rank board cap not met. Rank total must equal Hand total to unlock Color strategies.
        </div>
      )}
      <p className="text-gray-500 text-[10px] px-2 py-1.5 border-t border-slate-700 leading-snug">
        Only one mode may be active at a time. Manual: bet the 6 color board choices by hand. 70/20/10: wager the full Card+Rank total split 70% / 20% / 10% on 3 / 4 / 5 of the active side — starts Red, rides the winning streak, switches sides after a loss. Three: wager 100% of the Card+Rank total on 3 of the active side — same streak / loss-swap rule.
      </p>
    </div>
  );
}