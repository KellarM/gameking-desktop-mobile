import { CARDED_HAND_PAYOUTS } from '@/lib/payoutConstants';

export const HAND_LABELS = [
  'A♣ / 10♠', 'K♦ / K♥', 'Q♦ / J♥', 'Q♥ / 10♥', 'J♦ / 9♦',
  '8♣ / 6♣', '7♣ / 7♥', '4♠ / 2♠', '3♦ / 3♠', 'A♠ / 5♣',
];

export default function HandBetsTableOpposite({ handBets, onChange, handCandidates, onCandidateChange }) {
  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-2 py-1 bg-slate-800 text-[10px] text-gray-400 border-b border-slate-700">
        <span className="text-orange-400 font-semibold">Rot.</span> column marks hands in the rotation candidate pool — checked hands fill empty slots when an active hand wins (no checkmarks = standard fixed-bet test).
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800 text-gray-400">
            <th className="px-2 py-1.5 text-left">Odds</th>
            <th className="px-2 py-1.5 text-left">Carded Hand</th>
            <th className="px-2 py-1.5 text-center border-l-2 border-yellow-400/80">Rot.</th>
            <th className="px-2 py-1.5 text-right">Amount to Bet</th>
          </tr>
        </thead>
        <tbody>
          {HAND_LABELS.map((label, i) => {
            const checked = !!(handCandidates && handCandidates[i]);
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
                <td className="px-2 py-1 text-blue-300 font-semibold">{CARDED_HAND_PAYOUTS[i]}</td>
                <td className="px-2 py-1 text-white font-bold whitespace-nowrap">{label}</td>
                <td className="px-2 py-1 text-center border-l-2 border-yellow-400/80">
                  <button
                    type="button"
                    onClick={() => onCandidateChange && onCandidateChange(i, !checked)}
                    aria-label={checked ? `Remove ${label} from rotation` : `Add ${label} to rotation`}
                    title={checked ? 'In rotation candidate pool' : 'Add to rotation candidate pool'}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-400 hover:border-orange-400'}`}
                  >
                    {checked && (
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </td>
                <td className="px-2 py-1 text-right">
                  <input
                    type="number"
                    min="0"
                    value={handBets[i] || ''}
                    onChange={e => onChange(i, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 bg-yellow-100 text-black text-right rounded px-1.5 py-0.5 font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}