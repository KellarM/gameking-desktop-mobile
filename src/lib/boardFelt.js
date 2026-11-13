// Board felt brightness — darkens/lightens only the table background.
// The felt gradient colours live in CSS variables on <body> (--felt-1/2/3),
// so every .velvet-board surface (desktop + both mobile layouts) follows.

export const BRIGHTNESS_KEY = 'rfth_boardBrightness';
export const DEFAULT_BRIGHTNESS = 100;

// Base felt stops per theme — must match the theme definitions in index.css
const FELT_THEMES = {
  red: ['#b30000', '#7a0000', '#3d0000'],
  blue: ['#0d3b8c', '#071e52', '#020b2a'],
  green: ['#0d6e2e', '#074a1c', '#022610'],
};

export function readBrightness() {
  try {
    const v = parseFloat(localStorage.getItem(BRIGHTNESS_KEY));
    return Number.isFinite(v) ? v : DEFAULT_BRIGHTNESS;
  } catch {
    return DEFAULT_BRIGHTNESS;
  }
}

function scaleHex(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (c) => Math.max(0, Math.min(255, Math.round(c * factor)));
  const r = clamp((n >> 16) & 255);
  const g = clamp((n >> 8) & 255);
  const b = clamp(n & 255);
  return `rgb(${r},${g},${b})`;
}

// Writes the brightness-adjusted felt colours onto <body> as CSS variables.
export function applyFeltBrightness(theme, brightness) {
  const stops = FELT_THEMES[theme] || FELT_THEMES.red;
  const factor = Math.max(0.2, Math.min(1.8, (brightness || DEFAULT_BRIGHTNESS) / 100));
  const s = document.body.style;
  s.setProperty('--felt-1', scaleHex(stops[0], factor));
  s.setProperty('--felt-2', scaleHex(stops[1], factor));
  s.setProperty('--felt-3', scaleHex(stops[2], factor));
}