/**
 * Static card image URLs for the 10 fixed hands in Rapid Fire Texas Hold'em.
 * Key format: "RANK_suit" (suit is lowercase full string matching gameEngine.js)
 */
export const CARD_IMAGES = {
  // Opposite deck: A♣ (swapped from A♦)
  'A_clubs':     'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/34d29c5a4_image.png',

  // Hand 1: A♦ / 10♥
  'A_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/906a8f36c_image.png',
  '10_hearts':   'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/05d9e3ffe_image.png',

  // Hand 2: K♣ / K♠
  'K_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/1ae5118f8_KingClubs.png',
  'K_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/4360c2a3e_KingSpades.png',

  // Opposite deck: K♦ / K♥ (swapped from K♣ / K♠)
  'K_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/69ae283f4_image.png',
  'K_hearts':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/3bac4eb35_image.png',

  // Hand 3: Q♣ / J♠
  'Q_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/1167af30e_QueenClubs.png',
  'J_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/2c1f2cc90_JackSpades.png',

  // Opposite deck: Q♦ / J♥ (swapped from Q♣ / J♠)
  'Q_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/b07242364_image.png',
  'J_hearts':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/3a69f0606_image.png',

  // Hand 4: Q♠ / 10♠
  'Q_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/2ed4637f5_QueenSpades.png',
  '10_spades':   'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/7947e0025_10Spades.png',

  // Opposite deck: Q♥ (swapped from Q♠; 10♥ already defined above)
  'Q_hearts':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/673f1ae8c_image.png',

  // Hand 5: J♣ / 9♣
  'J_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/af3dce297_JackClubs.png',
  '9_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/a3551efc3_9Clubs.png',

  // Opposite deck: J♦ / 9♦ (swapped from J♣ / 9♣)
  'J_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/3eede8b13_image.png',
  '9_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/a6bff6843_image.png',

  // Hand 6: 8♦ / 6♦
  '8_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/c330938f9_8Diamonds.png',
  '6_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/45c3f745e_6Diamonds.png',

  // Opposite deck: 8♣ / 6♣ (swapped from 8♦ / 6♦)
  '8_clubs':     'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/72008fdf8_image.png',
  '6_clubs':     'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/45b1fba60_image.png',

  // Hand 7: 7♦ / 7♠
  '7_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/c216c62e6_SevenDiamonds.png',
  '7_spades':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/19c0bcf83_7Spades.png',

  // Opposite deck: 7♣ / 7♥ (swapped from 7♦ / 7♠)
  '7_clubs':     'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/3233de0d0_image.png',
  '7_hearts':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/82d64deae_image.png',

  // Hand 8: 4♥ / 2♥
  '4_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/98cfa7eaa_4Hearts.png',
  '2_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/370ab55b9_2Hearts.png',

  // Opposite deck: 4♠ / 2♠ (swapped from 4♥ / 2♥)
  '4_spades':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/95d71df9d_image.png',
  '2_spades':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/c5d651cbd_image.png',

  // Hand 9: 3♣ / 3♥
  '3_clubs':     'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/de95f3ce0_3Clubs.png',
  '3_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/8aa990eb3_3Hearts.png',

  // Opposite deck: 3♦ / 3♠ (swapped from 3♣ / 3♥)
  '3_diamonds':  'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/5b67e282f_image.png',
  '3_spades':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/474d698d8_image.png',

  // Hand 10: A♥ / 5♦
  'A_hearts':    'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/075308c86_AceHearts.png',
  '5_diamonds':  'https://media.base44.com/images/public/69eff22784cd2fbeba98f9be/aac1d390c_5Diamonds.png',

  // Opposite deck: A♠ / 5♣ (swapped from A♥ / 5♦)
  'A_spades':    'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/e2cfa119c_image.png',
  '5_clubs':     'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/d66c16c80_image.png',
};

/**
 * Get the image URL for a card object { rank, suit }
 * suit values: 'diamonds', 'hearts', 'clubs', 'spades'
 */
export function getCardImageUrl(card) {
  if (!card) return null;
  const key = `${card.rank}_${card.suit}`;
  return CARD_IMAGES[key] ?? null;
}