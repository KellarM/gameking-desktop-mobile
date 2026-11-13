// Diagonal "BETTING CLOSED" stamp shown across a board once betting has
// closed (flop onward). Purely visual — never intercepts clicks, and sits
// below the win badges and chips so open positions stay readable.
export default function BoardClosedWatermark({
  active,
  label = 'Betting Closed',
  fontSize = '1.1rem',
}) {
  if (!active) return null;
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 7, overflow: 'hidden', borderRadius: 'inherit' }}
      aria-hidden="true"
    >
      <span
        style={{
          transform: 'rotate(-20deg)',
          fontFamily: "'Oswald', sans-serif",
          fontSize,
          fontWeight: 900,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'rgba(255, 235, 120, 0.95)',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '3px solid rgba(255, 235, 120, 0.9)',
          borderRadius: 8,
          padding: '4px 16px',
          textShadow: '0 0 10px rgba(0,0,0,0.95), 0 0 18px rgba(253,224,71,0.7), 0 2px 4px rgba(0,0,0,0.9)',
          boxShadow: '0 0 18px rgba(253,224,71,0.45), inset 0 0 12px rgba(253,224,71,0.15)',
        }}
      >
        {label}
      </span>
    </div>
  );
}