// Diagonal "BETTING CLOSED" stamp shown across a board once betting has
// closed (flop onward). Purely visual — never intercepts clicks, and sits
// below the win badges and chips so open positions stay readable.
export default function BoardClosedWatermark({
  active,
  label = 'Betting Closed',
  fontSize = '0.7rem',
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
          color: 'rgba(253, 224, 71, 0.22)',
          border: '2px solid rgba(253, 224, 71, 0.22)',
          borderRadius: 6,
          padding: '3px 12px',
        }}
      >
        {label}
      </span>
    </div>
  );
}