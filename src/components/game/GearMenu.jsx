import { useState } from 'react';
import { useRef, useEffect } from 'react';
import GameRulesModal from '@/components/game/GameRulesModal';
import PlayExamplesModal from '@/components/game/PlayExamplesModal';

const COLORS = [
  { id: 'red',   label: 'Red',   dot: '#dc2626' },
  { id: 'blue',  label: 'Blue',  dot: '#2563eb' },
  { id: 'green', label: 'Green', dot: '#16a34a' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLE TOKENS — Oswald everywhere, gold casino aesthetic
// ═══════════════════════════════════════════════════════════════════════════
const FONT = "'Oswald', sans-serif";
const GOLD = '#e8b84b';
const GOLD_BRIGHT = '#fde047';
const GOLD_DIM = 'rgba(232,184,75,0.4)';

const panelStyle = {
  position: 'absolute', bottom: '44px', right: 0,
  background: 'linear-gradient(170deg, #1a0f00 0%, #0a0500 100%)',
  border: `3px solid ${GOLD}`,
  borderRadius: '14px',
  width: '290px',
  boxShadow: `0 0 0 1px #000 inset, 0 8px 40px rgba(0,0,0,0.85), 0 0 20px rgba(232,184,75,0.15)`,
  zIndex: 200,
  padding: '0',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
};

const sectionDivider = {
  height: 0,
  borderTop: `1px solid ${GOLD_DIM}`,
  margin: 0,
};

const sectionLabel = {
  fontSize: '11px', fontWeight: 700, color: 'rgba(253,224,71,0.65)',
  letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT,
  marginBottom: '8px',
};

// Gold-gradient pill style — matches the Rank Board position buttons
const actionBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
  padding: '14px 18px', cursor: 'pointer', fontSize: '15px',
  color: '#1a1200', fontWeight: 800, borderRadius: '10px',
  border: '2px solid #8a6218',
  background: 'linear-gradient(145deg, #ffe873 0%, #e8b84b 45%, #c8922e 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 5px rgba(0,0,0,0.45)',
  width: '100%',
  fontFamily: FONT, letterSpacing: '0.02em',
  transition: 'all 0.15s', textAlign: 'left',
};

const actionBtnHover = {
  background: 'linear-gradient(145deg, #fff29b 0%, #f0c860 45%, #d8a23e 100%)',
  border: '2px solid #a8792a',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 3px 8px rgba(0,0,0,0.55)',
};

export default function GearMenu({ soundManager, boardTheme, setBoardTheme, onHowToPlay, onResetBank, onOpenStats, onOpenDesktopLayout }) {
  const [open, setOpen] = useState(false);
  const [showPlayExamples, setShowPlayExamples] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const ref = useRef(null);

  useEffect(() => {
    if (soundManager) soundManager.setAmbientVolume(muted ? 0 : volume);
  }, [muted, volume, soundManager]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
        {/* Gear button */}
        <button
          onClick={() => setOpen(o => !o)}
          title="Settings"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer',
            border: open ? `2px solid ${GOLD}` : `1px solid ${GOLD_DIM}`,
            background: open ? 'rgba(120,70,0,0.5)' : 'rgba(0,0,0,0.5)',
            color: GOLD_BRIGHT, fontSize: '20px', lineHeight: 1,
            transition: 'all 0.15s',
            boxShadow: open ? `0 0 10px rgba(232,184,75,0.3)` : 'none',
          }}
        >
          ⚙
        </button>

        {open && (
          <div style={panelStyle} onClick={e => e.stopPropagation()}>

            {/* ═══ TITLE BAR ═══ */}
            <div style={{
              padding: '14px 16px 12px',
              background: 'linear-gradient(180deg, rgba(232,184,75,0.12) 0%, transparent 100%)',
              borderBottom: `2px solid ${GOLD}`,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '17px', fontWeight: 900, color: GOLD_BRIGHT, letterSpacing: '0.16em', fontFamily: FONT }}>
                SETTINGS
              </span>
            </div>

            {/* ═══ ACTION BUTTONS ═══ */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Reset Bank */}
              <button
                style={actionBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, actionBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, actionBtn)}
                onClick={() => { onResetBank(); setOpen(false); }}
              >
                Reset Bank
              </button>

              {/* Game Rules */}
              <GameRulesModal asMenuItem buttonStyle={actionBtn} buttonHoverStyle={actionBtnHover} />

              {/* How To Play */}
              <button
                style={actionBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, actionBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, actionBtn)}
                onClick={() => { onHowToPlay(); setOpen(false); }}
              >
                How To Play
              </button>

              {/* Player Stats */}
              <button
                style={actionBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, actionBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, actionBtn)}
                onClick={() => { onOpenStats(); setOpen(false); }}
              >
                Player Stats
              </button>

              {/* Play Examples */}
              <button
                style={actionBtn}
                onMouseEnter={e => Object.assign(e.currentTarget.style, actionBtnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, actionBtn)}
                onClick={() => { setShowPlayExamples(true); setOpen(false); }}
              >
                Play Examples
              </button>
            </div>

            <div style={sectionDivider} />

            {/* ═══ BOARD COLOR ═══ */}
            <div style={{ padding: '12px 14px' }}>
              <div style={sectionLabel}>Board Color</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {COLORS.map(t => {
                  const selected = boardTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setBoardTheme(t.id)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        padding: '10px 6px', borderRadius: '10px', cursor: 'pointer',
                        fontFamily: FONT, fontWeight: 700, fontSize: '13px',
                        color: selected ? GOLD_BRIGHT : '#94a3b8',
                        border: selected ? `2.5px solid ${GOLD}` : `1.5px solid ${GOLD_DIM}`,
                        background: selected ? 'rgba(100,60,0,0.6)' : 'rgba(0,0,0,0.3)',
                        transition: 'all 0.15s',
                        boxShadow: selected ? `0 0 10px rgba(232,184,75,0.2)` : 'none',
                      }}
                    >
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: t.dot,
                        border: selected ? `2px solid ${GOLD_BRIGHT}` : '2px solid rgba(255,255,255,0.25)',
                        display: 'block',
                        boxShadow: selected ? `0 0 8px ${t.dot}` : 'none',
                      }} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={sectionDivider} />

            {/* ═══ DESKTOP LAYOUT ═══ */}
            {onOpenDesktopLayout && (
              <div style={{ padding: '10px 14px' }}>
                <div style={sectionLabel}>Layout</div>
                <button
                  onClick={() => { onOpenDesktopLayout(); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${GOLD_DIM}`,
                    background: 'rgba(232,184,75,0.08)',
                    color: GOLD_BRIGHT,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>⊞</span>
                  <span>Desktop Layout</span>
                </button>
              </div>
            )}

            <div style={sectionDivider} />

            {/* ═══ SOUND (Bottom section) ═══ */}
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={sectionLabel}>Sound</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                border: `1.5px solid ${GOLD_DIM}`,
                background: 'rgba(0,0,0,0.35)',
              }}>
                {/* Mute button */}
                <button
                  onClick={() => setMuted(m => !m)}
                  title={muted ? 'Unmute' : 'Mute'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${muted ? '#dc2626' : GOLD}`,
                    background: muted ? 'rgba(220,38,38,0.15)' : 'rgba(232,184,75,0.1)',
                    color: muted ? '#f87171' : GOLD_BRIGHT,
                    fontSize: '16px', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {muted ? '🔇' : '🔊'}
                </button>

                {/* Volume slider — inline, not popup */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, fontFamily: FONT, letterSpacing: '0.06em',
                      color: muted ? '#6b7280' : 'rgba(253,224,71,0.7)',
                    }}>
                      VOL
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 800, fontFamily: FONT,
                      color: muted ? '#6b7280' : GOLD_BRIGHT,
                    }}>
                      {muted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                    style={{
                      width: '100%', height: '6px', cursor: 'pointer',
                      accentColor: GOLD,
                      flexShrink: 1,
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {showPlayExamples && (
        <PlayExamplesModal onClose={() => setShowPlayExamples(false)} />
      )}
    </>
  );
}
