export default function DealerAnnouncement({ message, fontSize = '1.2rem', height = '40px', lineHeight = '40px' }) {
  const text = message || '';

  return (
    <div
      style={{
        width: '100%',
        height: height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {text && (
        <span
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: fontSize,
            fontWeight: 700,
            fontStyle: 'italic',
            lineHeight: lineHeight,
            height: height,
            transform: 'skewX(-8deg)',
            display: 'inline',
            color: '#f6d860',
            textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(180,130,40,0.4)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
