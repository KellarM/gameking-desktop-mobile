const OPTIONS = [
  { key: '3_1', label: '3 / 1' },
  { key: '4_0', label: '4 / 0' },
];

export default function LowHighBetTable({ modes, onChange, disabled }) {
  const isNoBet = modes.length === 0;

  const toggle = (key) => {
    if (disabled) return;
    onChange(modes.includes(key) ? modes.filter(m => m !== key) : [...modes, key]);
  };

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Low / High Strategy</th>
            <th className="px-2 py-1.5 text-right">Select</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-slate-900/40">
            <td className="px-2 py-1.5 text-white font-bold">No Bet</td>
            <td className="px-2 py-1.5 text-right">
              <input
                type="checkbox"
                checked={isNoBet}
                onChange={() => onChange([])}
                className="w-4 h-4 accent-yellow-400 cursor-pointer"
              />
            </td>
          </tr>
          {OPTIONS.map((opt, i) => (
            <tr key={opt.key} className={i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/40'}>
              <td className="px-2 py-1.5 text-white font-bold">{opt.label}</td>
              <td className="px-2 py-1.5 text-right">
                <input
                  type="checkbox"
                  checked={modes.includes(opt.key)}
                  onChange={() => toggle(opt.key)}
                  disabled={disabled}
                  className="w-4 h-4 accent-yellow-400 cursor-pointer"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {disabled && (
        <div className="px-2 py-1.5 bg-amber-900/30 border-t border-amber-700 text-amber-300 text-[10px] leading-snug font-semibold">
          ⛔ Locked — Rank board cap not met. Rank total must equal Hand total to unlock River strategies.
        </div>
      )}
      <p className="text-gray-500 text-[10px] px-2 py-1.5 border-t border-slate-700 leading-snug">
        3/1: wagers half of the total (Hand+Rank+Color) bets on the likely side whenever the board shows a 3-1 Low/High split. 4/0: wagers the full total whenever the board shows a 4-0 split. Both can be selected together.
      </p>
    </div>
  );
}