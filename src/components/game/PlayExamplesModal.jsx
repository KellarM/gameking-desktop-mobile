import { useState, useRef, useEffect } from 'react';

const SESSIONS = [
  {
    id: 'session_02',
    label: 'Exam 01 — Only Rank Survives',
    result: 'Net: -$1.69',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/c8871853d_session_02_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player bets Pocket Kings — K♣ K♠. Hedges with 5 of the 7 Rank bets and places bets on all 3 Black Color Board positions. Flop comes up 5♥, 10♦, 4♣. Board shows 2 Red, 1 Black. Kings take the early lead with One Pair.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/362e0cc9f_session_02_turn.png',
        phase: 'THE TURN',
        caption: "Turn: 4♥ — 4♣/2♠ hits Three of a Kind and steals the lead. A 3rd Red card appears — all Black Color Board bets are dead. Board shows 3 Low, 1 High. River bet opens: LOW 1.06:1 vs HIGH 0.79:1. Player maxes the cap on HIGH. \"Come on King, I need a King on the river!\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/cef12e139_session_02_river.png',
        phase: 'THE RIVER',
        caption: "River: 2♥ — LOW. The 4♣/2♠ hand completes a Full House — 4-4-4-2-2 — a decisive win. The player's HIGH River bet backfired. The 2♥ was exactly the card that killed it.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/a975d23c0_session_02_results.png',
        phase: 'THE RESULTS',
        caption: "Only the Rank — Full House — survives. 1 board out of 4 wins.\nTotal Win: $0.31\nTotal Bet: $2.00\nNet Result: -$1.69",
      },
    ],
  },
  {
    id: 'session_03',
    label: 'Exam 02 — Three of a Kind / 3 Boards Win',
    result: 'Net: +$1.32',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/1c7595a88_session_03_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player bets the 4/2 hand at 7.3:1. Targets the Flush Rank bet and bets 3 Black on the Color Board. Flop comes up J♣, A♥, 4♥. Board shows 2 Red, 1 Black. A♦/10♥ leads with One Pair.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/03da0f995_session_03_turn.png',
        phase: 'THE TURN',
        caption: "Q♦/J♥ now takes the lead by 2 Pair with a Q♠ on the Turn.\nColor board is still open with 2 Red & 2 Black cards showing.\nWith 3 High cards & 1 low card showing, Low is the favourite.\nPlayer bets the max cap on Low \"Come on Low card, make it Low & Black!!\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/521514cd1_session_03_river.png',
        phase: 'THE RIVER',
        caption: "River: 4♣ — LOW. The 4/2 hand completes Three of a Kind — 4-4-4. Board finishes 2 Red, 3 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/11ec1dc21_session_03_results.png',
        phase: 'THE RESULTS',
        caption: "3 out of 4 boards win — Card, Color, and River.\nThe Rank Flush bet lost — the winning hand was Three of a Kind.\nTotal Win: $2.12 | Total Bet: $0.80 | Net Result: +$1.32",
      },
    ],
  },
  {
    id: 'session_04',
    label: 'Exam 03 — Full House Overtake (Only 2 Boards Win)',
    result: 'Net: +$2.42',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/f3497b30b_session_04_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player bets only 1 card hand the 8/6 and targets both Flush and Straight Rank bets. Chooses to bet the cap on 3 black. Flop comes up 6♥, 7♦, 6♦. Board shows 3 Red, 0 Black. The Color board black bet is already lost. 7/7 takes a quick lead with a full house.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/604d30754_session_04_turn.png',
        phase: 'THE TURN',
        caption: "Dealer turns over: 8♥. 7/7 still leads with 7s full of 6s. 8/6 now has a Full House too — 6s full of 8s — but it is not enough. Board shows 3 Low, 1 High. HIGH is the favourite. Player bets the max cap on HIGH.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/23d20b5ec_session_04_river.png',
        phase: 'THE RIVER',
        caption: "River: 8♠ — HIGH. The 8/6 hand completes a Full House — 8-8-8-6-6 — overtaking 7/7. Board finishes 4 Red, 1 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/ad4c0a878_session_04_results.png',
        phase: 'THE RESULTS',
        caption: "Huge win on the river card. 2 out of 4 boards win — Card and River.\nTotal Win: $5.62 | Total Bet: $3.20 | Net Result: +$2.42",
      },
    ],
  },
  {
    id: 'session_05',
    label: 'Exam 04 — 5-Black Sweep (Only Rank + River Win)',
    result: 'Net: +$0.08',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/26dd50bd6_session_05_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player bets 1 card hand and covers ALL 7 Rank positions at 1¢ each. Bets Red on the Color Board. Flop comes up 4♠, 6♠, 6♣. Board shows 0 Red, 3 Black. The Color board Red bet is already lost. 8/6 takes the early lead with Three of a Kind — 6-6-6.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/2f7216ed2_session_05_turn.png',
        phase: 'THE TURN',
        caption: "Turn: 9♠ is dealt. Q♠ / 10♠ is now in the lead with a flush. Board shows 3 Low, 1 High. HIGH is the favourite. Player bets the max cap on HIGH.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/1594e70da_session_05_river.png',
        phase: 'THE RIVER',
        caption: "The river card is Dealt. A♠. K/K Wins with a Flush.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/d7b3fc04e_session_05_results.png',
        phase: 'THE RESULTS',
        caption: "Coverage saves the round. 2 out of 4 boards win — Rank and River.\nTotal Win: $0.64 | Total Bet: $0.56 | Net Result: +$0.08",
      },
    ],
  },
  {
    id: 'session_06',
    label: 'Exam 05 — Only Rank Fires (House Wins Decisively)',
    result: 'Net: -$0.54',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/2c6518869_session_06_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: 'Player bets on J♦ / 9♦ and covers All 7 Rank Positions at 1¢ each. Bets the Cap on 3 Black. Flop comes up 4♥, A♥, 6♦. Board shows 3 Red, 0 Black. The Black bet is already lost — "3 Black is impossible with only 2 cards remaining".',
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/b7e409cc8_session_06_turn.png',
        phase: 'THE TURN',
        caption: "Turn: 5♥. Board is now 4 Red, 0 Black. Q/10 takes the lead with a Flush. Board shows 3 Low, 1 High. HIGH is the favourite. Player bets the max cap on HIGH.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/e8ef29934_session_06_river.png',
        phase: 'THE RIVER',
        caption: "The dealer turns over a 4♣ on the river— Low Card. Q/10 remains with the win with a Flush. Board finishes 4 Red, 1 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/8e13fc681_session_06_results.png',
        phase: 'THE RESULTS',
        caption: "Only 1 board wins — Rank Flush at 0.75:1. The HIGH River bet missed.\nTotal Win: $0.02 | Total Bet: $0.56 | Net Result: -$0.54",
      },
    ],
  },
  {
    id: 'session_07',
    label: 'Exam 06 — Kings Overtaken / 3 Boards Win',
    result: 'Net: +$0.15',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/869a52324_session_07_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: 'Player places 7 separate Card Hand bets. Player then hedges the Rank board & Covers ALL Rank positions. Then Bets ALL Red — 3R, 4R, and 5R. The Dealers Flop comes up 5♥, Q♦, 8♣. Board shows 2 Red, 1 Black. K♣/K♠ takes the early lead with One Pair.',
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/5de13b3c2_session_07_turn.png',
        phase: 'THE TURN',
        caption: "Turn: 9♦. Board is now 3 Red, 1 Black. K♣/K♠ still leads with One Pair. Board shows 1 Low, 3 High. LOW is the favourite at 0.79:1. Player declines the River bet.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/938d5073e_session_07_river.png',
        phase: 'THE RIVER',
        caption: "River: 9♠ — HIGH. J♣/9♣ overtakes K♣/K♠ with Three of a Kind — 9-9-9. Board finishes 3 Red, 2 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/bbeb42573_session_07_results.png',
        phase: 'THE RESULTS',
        caption: "3 out of 4 boards win — Card, Color, and Rank. No River bet placed.\nTotal Win: $0.43 | Total Bet: $0.28 | Net Result: +$0.15",
      },
    ],
  },
  {
    id: 'session_08',
    label: 'Exam 07 — Q♥/10♥ Flush / 2 Boards Win',
    result: 'Net: -$0.16',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/b34d9fbd8_session_08_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: 'Player places 7 separate Card Hand bets. Hedges the Rank board & Covers ALL Rank positions. Bets the Cap on 3 Black. The Dealers Flop comes up 4♥, A♥, 10♣. Board shows 2 Red, 1 Black. A♣/10♠ takes the early lead with Two Pair. "Come on, I need more black cards!"',
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/723c0abce_session_08_turn.png',
        phase: 'THE TURN',
        caption: "Turn: 5♥. Board is now 3 Red, 1 Black. Q♥/10♥ surges into the lead with a Flush. The 3 Black bet is dead — only 1 card remaining. Board shows 2 Low, 2 High. River odds are even at 0.904:1. Player declines the River bet.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/ec14d3c93_session_08_river.png',
        phase: 'THE RIVER',
        caption: "River: 7♠ — LOW. Q♥/10♥ holds the Flush win. Board finishes 3 Red, 2 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/ef4d01f50_session_08_results.png',
        phase: 'THE RESULTS',
        caption: "2 out of 4 boards win — Card and Rank. Color 3 Black missed. No River bet placed.\nTotal Win: $0.12 | Total Bet: $0.28 | Net Result: -$0.16",
      },
    ],
  },
  {
    id: 'session_09',
    label: 'Exam 08 — Quiet Straight / Coverage Strategy',
    result: 'Net: +$0.16',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/c744a44c0_session_09_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player places multiple Card Hand bets and hedges the Rank Board covering ALL 7 positions. Bets 3 Black on the Color Board at 1.87:1. The DealerThe Dealer's Flop comes up 7♥, 6♣, 2♠. Board shows 1 Red, 2 Black. 7♦/7♠ takes the lead with Three of a Kind — pocket pair finds the board.\n\"Pocket Sevens hit the flop — beautiful. Just need one more Black for the Color!\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/6a6a94687_session_09_turn.png',
        phase: 'THE TURN',
        caption: "3♦ on the Turn. Board now 2 Red, 2 Black.\n7♦/7♠ holds the lead with Three of a Kind.\nColor Board still alive — needs 1 more Black on the River.\nWith 4 Low cards showing, HIGH is the favourite. Player skips the River bet.\n\"Let the Color ride — one more Black!\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/c39eb70db_session_09_river.png',
        phase: 'THE RIVER',
        caption: "River: 4♣ — LOW & BLACK.\nA♥/5♦ completes the Straight — A-2-3-4-5.\nBoard finishes 2 Red, 3 Black. Color Board 3 Black confirmed.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/2f2298822_session_09_results.png',
        phase: 'THE RESULTS',
        caption: "Color Board wins at 1.87:1 — $0.40 return.\nRank Board wins at 2.84:1 — $0.04 return.\nCard Board: No payout.\nRiver: No bet placed.\nTotal Win: $0.44 | Total Wagered: $0.28 | Net Result: +$0.16",
      },
    ],
  },
  {
    id: 'session_10',
    label: 'Exam 09 — K♣/K♠ Full House / Only Rank Survives',
    result: 'Net: -$0.57',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/446009b6c_session_10_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player bets 7♦/7♠ at 20¢ — one card hand. Targets 3 of a Kind and Full House on the Rank Board. Bets 3 Red on the Color Board. Total wagered: $0.80.\nThe Dealer's Flop comes up 2♠, J♥, 2♣. Board shows 1 Red, 2 Black. 4♥/2♥ takes the lead with Three of a Kind — 2-2-2.\n\"Not my hand, but the Rank bets are alive.\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/5bce544c9_session_10_turn.png',
        phase: 'THE TURN',
        caption: "9♠ on the Turn. Board now 1 Red, 3 Black.\n4♥/2♥ holds the lead with Three of a Kind.\nColor Board 3 Red is dead — only 1 Red showing.\nRiver is even — no favourite. Player skips the River bet.\n\"Come on 7 — Full House plus the Rank bet.\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/4061bfe32_session_10_river.png',
        phase: 'THE RIVER',
        caption: "River: K♦ — HIGH & RED.\nK♣/K♠ completes a Full House — K-K-K-2-2.\nBoard finishes 2 Red, 3 Black.",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/cd612f8a1_session_10_results.png',
        phase: 'THE RESULTS',
        caption: "Only Rank survives — Full House wins at 1.34:1. $0.23 return.\nCard & Color Board: Lost with no bet on the river placed.\nTotal Win: $0.23 | Total Wagered: $0.80 | Net Result: -$0.57",
      },
    ],
  },
  {
    id: 'session_11',
    label: 'Exam 10 — All-Red Board / Color Sweep',
    result: 'Net: +$1.52',
    slides: [
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/0509f5a7f_session_11_flop.png',
        phase: 'PRE-DEAL → FLOP',
        caption: "Player places 3 separate Card Hand bets. Targets 3 of a Kind and Full House on the Rank Board. Stacks 3 Red, 4 Red, and 5 Red on the Color Board. Total wagered: $1.20.\nThe Dealer's Flop comes up A♦, 5♦, A♥. Board shows 3 Red, 0 Black. Full House leads from the flop — two Aces on board.\n\"All Red on the Flop — Color bets are looking good!\"",
      },
      {
        image: 'https://base44.app/api/apps/69fcabf54838c8e18515a406/files/mp/public/69fcabf54838c8e18515a406/501f2df23_session_11_turn.png',
        phase: 'THE TURN',
        caption: "3♥ on the Turn. Board now 4 Red, 0 Black.\nFull House still leads.\n4 Red confirmed — 5 Red still alive.\nRiver is even — no favourite. Player skips the River bet.\n\"One more Red for the sweep!\"",
      },
      {
        image: 'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/bc95241e8_image.png',
        phase: 'THE RIVER',
        caption: "River: 7♥ — LOW & RED.\nA♣/5♣ wins with Full House — A-A-A-5-5.\nBoard finishes 5 Red, 0 Black.",
      },
      {
        image: 'https://media.base44.com/images/public/6a24d1b67868eaf6bfafdb67/dd37ac4dd_image.png',
        phase: 'THE RESULTS',
        caption: "Color & Rank win — 5 Red at 43:1 ($2.20) and Full House at 2.46:1 ($0.52).\nCard Board: Lost. No River bet placed.\nTotal Win: $2.72 | Total Wagered: $1.20 | Net Result: +$1.52",
      },
    ],
  },
];

export default function PlayExamplesModal({ onClose }) {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const session = SESSIONS[sessionIdx];
  const slide = session.slides[slideIdx];
  const scrollRef = useRef(null);

  // Re-check scroll bounds whenever slide/image/session changes
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };

  // Reset to top + re-check on slide change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    checkScroll();
  }, [sessionIdx, slideIdx]);

  const pickSession = (idx) => {
    setSessionIdx(idx);
    setSlideIdx(0);
  };

  // Advance to the next slide. On the last slide of an example, jump to slide 1
  // of the next example — wrapping from the 10th example back to the first.
  const goNext = () => {
    if (slideIdx < session.slides.length - 1) {
      setSlideIdx(i => i + 1);
    } else {
      const nextSession = sessionIdx < SESSIONS.length - 1 ? sessionIdx + 1 : 0;
      pickSession(nextSession);
    }
  };

  // Go back to the previous slide. On slide 1 of an example, jump to the last
  // slide of the previous example — wrapping from Exam 01 back to Exam 10 slide 4.
  const goPrev = () => {
    if (slideIdx > 0) {
      setSlideIdx(i => i - 1);
    } else {
      const prevSession = sessionIdx > 0 ? sessionIdx - 1 : SESSIONS.length - 1;
      setSessionIdx(prevSession);
      setSlideIdx(SESSIONS[prevSession].slides.length - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-1.5">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl h-[calc(100vh-12px)] rounded-2xl flex flex-col overflow-hidden z-10"
        style={{
          background: 'linear-gradient(160deg, #1a0f00 0%, #0f0800 100%)',
          border: '2px solid rgba(202,138,4,0.5)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-yellow-700/30 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>🎬</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#facc15', letterSpacing: '0.1em', fontFamily: 'Oswald, sans-serif' }}>
              PLAY EXAMPLES
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Session tabs */}
        <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0 border-b border-yellow-700/20">
          {SESSIONS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => pickSession(idx)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: idx === sessionIdx ? 'rgba(234,179,8,0.18)' : 'rgba(0,0,0,0.3)',
                border: idx === sessionIdx ? '1px solid rgba(234,179,8,0.8)' : '1px solid rgba(202,138,4,0.3)',
                color: idx === sessionIdx ? '#fde047' : '#94a3b8',
              }}
            >
              {s.label.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {/* Session title + result — phase pill pinned to the exact geometric center */}
        <div className="relative px-6 py-1.5 flex items-center justify-between flex-shrink-0 gap-3">
          <span className="text-sm font-bold text-white whitespace-nowrap z-10">{session.label.split('—').slice(1).join('—').trim()}</span>
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-block px-3 py-0.5 rounded-md text-xs font-bold tracking-widest uppercase z-0"
            style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.4)' }}
          >
            {slide.phase}
          </span>
          <span className={`text-sm font-black whitespace-nowrap z-10 ${session.result.startsWith('Net: +') ? 'text-green-400' : 'text-red-400'}`}>{session.result}</span>
        </div>

        {/* Slide content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col items-center gap-3 min-h-0"
        >
          <div className="relative w-full flex justify-center shrink-0">
            <img
              src={slide.image}
              alt={slide.phase}
              onLoad={checkScroll}
              className="rounded-xl max-h-[50vh] w-auto object-contain shrink-0"
              style={{ flexShrink: 0, border: '2px solid rgba(202,138,4,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
            />
          </div>
          <div className="w-full text-center">
            <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{slide.caption}</p>
          </div>
        </div>

        {/* Floating scroll-down indicator — appears when content extends below view */}
        {canScrollDown && (
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              bottom: '62px',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              animation: 'rfthScrollBounce 1.2s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: '#facc15', letterSpacing: '0.1em', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              SCROLL
            </span>
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" style={{ filter: 'drop-shadow(2px 3px 3px rgba(0,0,0,0.9))' }}>
              <path d="M2 2 L11 11 L20 2" stroke="#facc15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Footer: slide nav */}
        <div className="flex items-center justify-between px-6 py-[9px] border-t border-yellow-700/30 bg-black/30 flex-shrink-0">
          <button
            onClick={goPrev}
            className="rounded-lg text-sm font-bold transition-all px-4 py-1"
            style={{ background: 'rgba(60,35,0,0.5)', border: '1px solid rgba(234,179,8,0.7)', color: '#fde047', cursor: 'pointer' }}
          >
            ← Prev
          </button>
          <span className="text-[10px] text-gray-500 italic font-medium px-2 flex-1 text-center" style={{ maxWidth: '420px' }}>
            All examples depict true, unaltered gameplay; outcomes are not determined, predicted, or influenced in advance.
          </span>
          <span className="text-xs text-gray-400 font-semibold">
            Slide {slideIdx + 1} / {session.slides.length}
          </span>
          <button
            onClick={goNext}
            className="rounded-lg text-sm font-bold transition-all px-4 py-1"
            style={{ background: 'rgba(60,35,0,0.5)', border: '1px solid rgba(234,179,8,0.7)', color: '#fde047', cursor: 'pointer' }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}