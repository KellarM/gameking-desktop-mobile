import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { savePass, tidyCode } from '@/lib/access';

// The front door for the studio's domains. Nothing behind it renders until the
// server has accepted a code, so a visitor cannot open the game, the simulation
// pages or the deck inspector by guessing a URL.

const GOLD = '#e8b84b';

export default function AccessGate({ onUnlock }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke('checkAccessCode', {
        code: tidyCode(code),
      });
      if (!data?.ok || !data?.token) {
        // One message for a wrong code, an expired code and a code that never
        // existed. The page must never confirm a near miss.
        setError('That code is not valid, or it has expired.');
      } else {
        onUnlock(savePass({ token: data.token, expires: data.expires, name: data.name }));
      }
    } catch {
      setError('Could not reach the studio. Check your connection and try again.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center px-5 py-14">
      <div className="w-full max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
          XFH Game Studio &middot; Edmonton, Alberta
        </p>

        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
          Rapid Fire Texas Hold&rsquo;em
        </h1>

        <div className="mt-6 h-px w-24" style={{ backgroundColor: GOLD }} />

        <p className="mt-6 text-[15px] leading-relaxed text-slate-300">
          A fast, high-frequency table game built on the hand rankings everyone already knows.
          Before each deal you wager across four boards at once: the card hands, the rank board,
          the colour board and the river. The flop and turn are dealt, the boards lock, and the
          river settles every wager at the same moment.
        </p>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
          The game runs on a measured 32-card community stock with a blended return of 96.4
          percent across the boards, built for electronic tables where the pace is set by the
          house rather than the dealer.
        </p>

        <form onSubmit={submit} className="mt-9">
          <label
            htmlFor="entry-code"
            className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400"
          >
            Entry code
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="entry-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Enter your code"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'entry-error' : undefined}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-[16px] tracking-[0.14em] text-slate-100 placeholder:tracking-normal placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color']: GOLD }}
            />
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="rounded-lg px-7 py-3 text-[15px] font-bold text-slate-950 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: GOLD }}
            >
              {busy ? 'Checking\u2026' : 'Enter'}
            </button>
          </div>

          {error && (
            <p id="entry-error" role="alert" className="mt-3 text-[14px] text-red-400">
              {error}
            </p>
          )}
        </form>

        <p className="mt-10 text-[12.5px] leading-relaxed text-slate-500">
          Access is by invitation and each code carries its own expiry date. If yours has lapsed,
          ask Michael for a new one.
        </p>
      </div>
    </div>
  );
}
