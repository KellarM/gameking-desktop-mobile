import React, { useState } from 'react';

export default function DesktopLayoutModal({ current = '1', onSelect, onClose }) {
  const [selected, setSelected] = useState(current);

  const layouts = [
    { id: '1', name: 'Layout 1', desc: '3-column (Hands | Board | Bets)' },
    { id: '2', name: 'Layout 2', desc: 'Stacked strips (River → Color → Rank → Hands)' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a1208 0%, #0d0804 100%)',
          border: '3px solid #e8b84b',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 0 30px rgba(232,184,75,0.4), 0 12px 48px rgba(0,0,0,0.8)',
        }}
      >
        <h2 style={{ color: '#e8c22a', fontSize: '1.25rem', fontWeight: 900, marginBottom: '20px', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Desktop Layout
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => {
                setSelected(layout.id);
                if (onSelect) onSelect(layout.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: '12px',
                border: selected === layout.id ? '3px solid #e8b84b' : '2px solid rgba(232,184,75,0.3)',
                background: selected === layout.id ? 'rgba(232,184,75,0.12)' : 'rgba(0,0,0,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid #e8b84b',
                background: selected === layout.id ? '#e8b84b' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selected === layout.id && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1a1208' }} />
                )}
              </div>
              <div>
                <div style={{ color: '#e8c22a', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                  {layout.name}
                </div>
                <div style={{ color: 'rgba(232,184,75,0.6)', fontSize: '0.75rem' }}>
                  {layout.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '2px solid rgba(232,184,75,0.4)',
            background: 'rgba(0,0,0,0.5)',
            color: '#e8c22a',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
