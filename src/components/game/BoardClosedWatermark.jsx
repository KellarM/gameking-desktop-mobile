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
          color: 'rgba(253, 224, 71, 0.30)',
          background: 'transparent',
          border: '2px solid rgba(253, 224, 71, 0.26)',
          borderRadius: 6,
          padding: '3px 14px',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          boxShadow: 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}