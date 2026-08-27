import PlayingCard from './PlayingCard';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

const CARD_W = 70;
const CARD_H = 100;
const GAP = 10;
const GROUP_GAP = 20;
const LABEL_H = 18;
const LABEL_TOP_GAP = 6;

function CardSlot({ card, index, active, cardW = CARD_W, cardH = CARD_H, cardSize = 'community' }) {
  return (
    <div style={{ width: cardW, height: cardH, flexShrink: 0, position: 'relative' }}>
      {card ? (
        <motion.div
          key={`card-${index}-${card.rank}${card.suit}`}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 * index }}
          style={{ width: cardW, height: cardH }}
        >
          <PlayingCard card={card} size={cardSize} glow={active} />
        </motion.div>
      ) : (
        <div style={{ width: cardW, height: cardH, opacity: 0.9 }}>
          <img
            src="https://media.base44.com/images/public/69f3a45ad82dff5b772d4de2/1b33b172d_image.png"
            alt="Card back"
            style={{ width: cardW, height: cardH, borderRadius: '6px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}

function CardGroup({ cards, indices, label, hasCards, cardW = CARD_W, cardH = CARD_H, gap = GAP, labelH = LABEL_H, labelTopGap = LABEL_TOP_GAP, cardSize = 'community' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap }}>
        {indices.map((i) => (
          <CardSlot
            key={i}
            card={cards[i]}
            index={i}
            active={i === cards.length - 1 && cards.length > 0}
            cardW={cardW}
            cardH={cardH}
            cardSize={cardSize}
          />
        ))}
      </div>
      <div style={{
        height: labelH,
        marginTop: labelTopGap,
        fontSize: '0.65rem',
        fontWeight: 700,
        fontFamily: 'Oswald, sans-serif',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#e8b84b',
        textShadow: '0 0 2px #000, 1px 1px 2px #000, -1px -1px 2px #000, 2px 2px 0 #000',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
}

export default function CommunityCards({ cards = [], phase, cardW = CARD_W, cardH = CARD_H, gap = GAP, groupGap = GROUP_GAP, labelH = LABEL_H, labelTopGap = LABEL_TOP_GAP, showRiverBanner = false }) {
  // Three fixed-art tiers keyed to the exact card widths callers actually use:
  // 70px = Desktop Layout 1 ('community'), 59px = Desktop Layout 2 ('community-md'),
  // 42px = Mobile ('community-sm'). Threshold split at the midpoint of each gap.
  const cardSize = cardW >= CARD_W ? 'community' : (cardW >= 50 ? 'community-md' : 'community-sm');
  const prevPhaseRef = useRef(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (showRiverBanner && prevPhaseRef.current !== 'lowHighBetting' && phase === 'lowHighBetting') {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3500);
      return () => clearTimeout(timer);
    }
    prevPhaseRef.current = phase;
  }, [phase, showRiverBanner]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: groupGap,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* River Board Open banner */}
      {showBanner && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          padding: '4px 16px',
          borderRadius: 8,
          border: '3px solid #f6d860',
          background: 'rgba(10, 5, 0, 0.88)',
          boxShadow: '0 0 12px rgba(246,216,96,0.4), 0 2px 8px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'riverBannerPulse 0.6s ease-out',
        }}>
          <span style={{
            fontSize: cardW < CARD_W ? '0.62rem' : '0.8rem',
            fontWeight: 900,
            color: '#f6d860',
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textShadow: '0 0 4px rgba(246,216,96,0.5)',
          }}>River Board Open</span>
          <span style={{
            fontSize: cardW < CARD_W ? '0.7rem' : '0.9rem',
            color: '#f6d860',
            fontWeight: 900,
            lineHeight: 1,
          }}>↑</span>
        </div>
      )}
      <style>{`@keyframes riverBannerPulse { 0% { opacity: 0; transform: translateX(-50%) translateY(8px); } 100% { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      <CardGroup
        cards={cards}
        indices={[0, 1, 2]}
        label="Flop"
        hasCards={cards.length >= 3}
        cardW={cardW}
        cardH={cardH}
        gap={gap}
        labelH={labelH}
        labelTopGap={labelTopGap}
        cardSize={cardSize}
      />
      <CardGroup
        cards={cards}
        indices={[3]}
        label="Turn"
        hasCards={cards.length >= 4}
        cardW={cardW}
        cardH={cardH}
        gap={gap}
        labelH={labelH}
        labelTopGap={labelTopGap}
        cardSize={cardSize}
      />
      <CardGroup
        cards={cards}
        indices={[4]}
        label="River"
        hasCards={cards.length >= 5}
        cardW={cardW}
        cardH={cardH}
        gap={gap}
        labelH={labelH}
        labelTopGap={labelTopGap}
        cardSize={cardSize}
      />
    </div>
  );
}
