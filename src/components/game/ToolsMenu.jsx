import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Award, PieChart, Layers, Timer, LineChart, SlidersHorizontal, Shuffle, Settings, Smartphone } from 'lucide-react';

const TOOLS = [
  { icon: LineChart,  label: 'Analytics',                   type: 'analytics',        badge: 'NEW', badgeColor: 'bg-green-700/60 text-green-300 border-green-600/40' },
  { icon: Award,      label: 'Gaming License Calibration', href: '/gaming-license' },
  { icon: Award,      label: 'Gaming License Calibration 2', href: '/gaming-license-2', badge: 'OPP', badgeColor: 'bg-cyan-700/60 text-cyan-300 border-cyan-600/40' },
  { icon: PieChart,   label: 'Game Stats',                 href: '/game-stats'     },
  { icon: Shuffle,    label: 'Opposite Game Stats',        href: '/opposite-game-stats' },
  { icon: Layers,     label: 'Deck Inspector',             href: '/deck-inspector' },
  { icon: Timer,      label: 'Game Timing',                type: 'gameTiming'      },
  { icon: Smartphone, label: 'Mobile Layout',              type: 'mobileLayout',     badge: 'NEW', badgeColor: 'bg-blue-700/60 text-blue-300 border-blue-600/40' },
  { icon: SlidersHorizontal, label: 'Versions',             type: 'versions',         badge: 'NEW', badgeColor: 'bg-purple-700/60 text-purple-300 border-purple-600/40' },
  { icon: SlidersHorizontal, label: 'Bell Curve',           type: 'bellCurve',        badge: 'NEW', badgeColor: 'bg-red-700/60 text-red-300 border-red-600/40' },
  { icon: Settings,    label: 'Control',                   type: 'control',          badge: 'NEW', badgeColor: 'bg-emerald-700/60 text-emerald-300 border-emerald-600/40' },
];

export default function ToolsMenu({
  onOpenAnalytics,
  onOpenGameTiming,
  onOpenMobileLayout,
  onOpenVersions,
  onOpenBellCurve,
  onOpenControl,
  toolsVisible = true,
  onHideTools,
  password = 'Mi@Ke091134',
}) {
  const [open, setOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const pwRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (promptOpen) {
      setTimeout(() => pwRef.current?.focus(), 50);
    }
  }, [promptOpen]);

  function handle(fn) {
    fn?.();
    setOpen(false);
  }

  function submitPassword(e) {
    e?.preventDefault();
    if (pwInput === password) {
      setPromptOpen(false);
      setPwInput('');
      setPwError(false);
      setOpen(true);
    } else {
      setPwError(true);
      setTimeout(() => {
        setPromptOpen(false);
        setPwInput('');
        setPwError(false);
        onHideTools?.();
      }, 1200);
    }
  }

  function onToolClick() {
    if (!open && !promptOpen) {
      setPromptOpen(true);
    } else {
      setOpen(false);
      setPromptOpen(false);
    }
  }

  const typeHandlers = {
    analytics:        onOpenAnalytics,
    gameTiming:        onOpenGameTiming,
    mobileLayout:      onOpenMobileLayout,
    versions:          onOpenVersions,
    bellCurve:         onOpenBellCurve,
    control:          onOpenControl,
  };

  return (
    <div className="relative" ref={ref} style={{ visibility: toolsVisible ? 'visible' : 'hidden' }}>
      <button
        onClick={onToolClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all
          ${open
            ? 'border-yellow-400 bg-yellow-700/40 text-yellow-200'
            : 'border-yellow-700/50 bg-yellow-900/20 text-yellow-300 hover:border-yellow-500 hover:bg-yellow-900/40'
          }`}
      >
        <Wrench className="w-3.5 h-3.5" />
        Tools
        <span className={`transition-transform duration-200 text-yellow-400/60 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {promptOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-yellow-700/40 rounded-xl shadow-2xl shadow-black/60 z-50 p-3">
          <p className="text-yellow-400/70 text-xs font-semibold tracking-wider uppercase mb-2">Tools Access</p>
          <form onSubmit={submitPassword}>
            <input
              ref={pwRef}
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Enter password"
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors
                ${pwError ? 'border-red-600' : 'border-slate-600 focus:border-yellow-500'}`}
            />
            {pwError && <p className="text-red-400 text-[10px] mt-1 font-semibold">Incorrect — hiding Tools.</p>}
            <button type="submit"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-yellow-700/40 border border-yellow-600 text-yellow-100 text-sm font-bold hover:bg-yellow-700/60 transition-colors">
              Unlock
            </button>
          </form>
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-yellow-700/40 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-yellow-700/20">
            <p className="text-yellow-400/60 text-xs font-semibold tracking-wider uppercase">Game Tools</p>
          </div>

          {TOOLS.map(({ icon: Icon, label, href, type, badge, badgeColor }) => {
            if (type) {
              return (
                <button key={label} onClick={() => handle(typeHandlers[type])}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-900/20 hover:text-yellow-200 transition-colors text-left">
                  <Icon className="w-4 h-4 text-yellow-500/70 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>{badge}</span>
                  )}
                </button>
              );
            }
            return (
              <Link key={label} to={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-900/20 hover:text-yellow-200 transition-colors">
                <Icon className="w-4 h-4 text-yellow-500/70 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>{badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}