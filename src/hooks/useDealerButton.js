/**
 * useDealerButton.js
 *
 * Replaces the automatic ticking clock with a manual "Deal" button flow.
 * The player controls game pace by pressing the dealer button at each stage.
 *
 * Phases and what the deal button does at each:
 *   'betting'       → Deal Flop (3 cards)
 *   'flop'          → Deal Turn (4th card)
 *   'lowHighBetting'→ Deal River (5th card) — player has had time to place river bet
 *   'river'/'winner'→ disabled (settlement/reset handled separately)
 */
export function getDealButtonState(gamePhase, totalBet) {
  switch (gamePhase) {
    case 'betting':
      return {
        label: 'DEAL',
        sublabel: 'Deal Flop',
        enabled: totalBet > 0,
        disabledReason: totalBet <= 0 ? 'Place a bet to deal' : null,
      };
    case 'flop':
      return {
        label: 'DEAL',
        sublabel: 'Deal Turn',
        enabled: true,
        disabledReason: null,
      };
    case 'lowHighBetting':
      return {
        label: 'DEAL',
        sublabel: 'Deal River',
        enabled: true,
        disabledReason: null,
      };
    case 'river':
    case 'settlement':
      return {
        label: 'DEALING...',
        sublabel: 'Settling bets',
        enabled: false,
        disabledReason: null,
      };
    case 'winner':
      return {
        label: 'NEW ROUND',
        sublabel: 'Start next round',
        enabled: true,
        disabledReason: null,
      };
    default:
      return {
        label: 'DEAL',
        sublabel: '',
        enabled: false,
        disabledReason: null,
      };
  }
}