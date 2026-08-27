// Shared Snowball-Cap enforcement for Hand Simulation bet inputs.
// Mirrors the live-game integrity rules from gameEngine.js (checkRankCap / checkColorCap):
//   Rank total  ≤  Hand total
//   Color total ≤  Hand total + Rank total
// (River/LowHigh is strategy-driven in the sim and wagers a fraction of Hand+Rank+Color,
//  so it is inherently capped and needs no extra clamping here.)
//
// Each helper returns the largest value the chosen field may hold without breaching the cap.

export function clampRankBet(handBets, rankBets, rankKey, newValue) {
  const totalHand = Object.values(handBets || {}).reduce((s, v) => s + (+v || 0), 0);
  const otherRankTotal = Object.entries(rankBets || {})
    .filter(([k]) => k !== rankKey)
    .reduce((s, [, v]) => s + (+v || 0), 0);
  const maxForThis = Math.max(0, totalHand - otherRankTotal);
  return Math.min(newValue, maxForThis);
}

export function clampColorBet(handBets, rankBets, colorBets, colorKey, newValue) {
  const totalHand = Object.values(handBets || {}).reduce((s, v) => s + (+v || 0), 0);
  const totalRank = Object.values(rankBets || {}).reduce((s, v) => s + (+v || 0), 0);
  const ceiling = totalHand + totalRank;
  const otherColorTotal = Object.entries(colorBets || {})
    .filter(([k]) => k !== colorKey)
    .reduce((s, [, v]) => s + (+v || 0), 0);
  const maxForThis = Math.max(0, ceiling - otherColorTotal);
  return Math.min(newValue, maxForThis);
}

// Totals — used for cap feedback in the UI
export function handTotal(handBets) {
  return Object.values(handBets || {}).reduce((s, v) => s + (+v || 0), 0);
}
export function rankTotal(rankBets) {
  return Object.values(rankBets || {}).reduce((s, v) => s + (+v || 0), 0);
}
export function colorTotal(colorBets) {
  return Object.values(colorBets || {}).reduce((s, v) => s + (+v || 0), 0);
}