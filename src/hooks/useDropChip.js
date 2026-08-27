import { useCallback } from 'react';
import { isSideBetGateOpen } from '@/lib/gameEngine';

/**
 * Extracted drag-drop chip handler to keep RapidFireGame.jsx under size limit.
 */
export function useDropChip({ gamePhase, handBets, rankBets, redBlackBets, lowHighBets, versions, setHandBets, setRankBets, setRedBlackBets, setLowHighBets, setBalances, setShowAutoTrimToast }) {
  return useCallback((fromHandId, toHandId, dragPid) => {
    if (gamePhase !== 'betting') return;
    const fromAmt = (handBets[dragPid] || {})[fromHandId] || 0;
    if (fromAmt <= 0) return;

    if (toHandId === 'bank') {
      const remainingHandBets = { ...(handBets[dragPid] || {}) };
      delete remainingHandBets[fromHandId];
      const isLastHandBet = Object.keys(remainingHandBets).length === 0;

      if (isLastHandBet) {
        const rankRefund = Object.values(rankBets[dragPid] || {}).reduce((s, v) => s + v, 0);
        const colorRefund = Object.values(redBlackBets[dragPid] || {}).reduce((s, v) => s + v, 0);
        const riverRefund = lowHighBets[dragPid]?.amount || 0;
        setHandBets(p => ({ ...p, [dragPid]: remainingHandBets }));
        setRankBets(p => ({ ...p, [dragPid]: {} }));
        setRedBlackBets(p => ({ ...p, [dragPid]: {} }));
        setLowHighBets(p => ({ ...p, [dragPid]: null }));
        setBalances(b => { const n=[...b]; n[dragPid]+=fromAmt+rankRefund+colorRefund+riverRefund; return n; });
        return;
      }

      const rlAtDrop = versions?.rankLockThreshold ?? 1;
      const remHC = Object.keys(remainingHandBets).length;
      const slotsAllowed = remHC >= rlAtDrop ? 0 : (versions?.maxRankSlots ?? 1);
      let rankRefund = 0;
      let updRank = { ...(rankBets[dragPid] || {}) };
      while (Object.keys(updRank).length > slotsAllowed) {
        const k = Object.keys(updRank)[Object.keys(updRank).length - 1];
        rankRefund += updRank[k]; delete updRank[k];
      }
      const newHT = Object.values(remainingHandBets).reduce((s,v)=>s+v,0);
      const newRT = Object.values(updRank).reduce((s,v)=>s+v,0);
      const newFnd = newHT + newRT;
      let colorRefund = 0;
      let updColor = { ...(redBlackBets[dragPid] || {}) };
      const colorTotal = Object.values(updColor).reduce((s,v)=>s+v,0);
      if (colorTotal > newFnd) {
        let excess = colorTotal - newFnd;
        for (const k of Object.keys(updColor).reverse()) {
          const trim = Math.min(updColor[k], excess);
          updColor[k] -= trim; if (updColor[k]<=0) delete updColor[k];
          colorRefund += trim; excess -= trim; if (excess<=0) break;
        }
      }
      let riverRefund = 0;
      let updRiver = lowHighBets[dragPid] ? { ...lowHighBets[dragPid] } : null;
      if ((updRiver?.amount||0) > newFnd) {
        riverRefund = updRiver.amount - newFnd;
        updRiver = newFnd <= 0 ? null : { ...updRiver, amount: newFnd };
      }
      setHandBets(p => { const n={...(p[dragPid]||{})}; delete n[fromHandId]; return {...p,[dragPid]:n}; });
      setRankBets(p => ({ ...p, [dragPid]: updRank }));
      setRedBlackBets(p => ({ ...p, [dragPid]: updColor }));
      setLowHighBets(p => ({ ...p, [dragPid]: updRiver }));
      setBalances(b => { const n=[...b]; n[dragPid]+=fromAmt+rankRefund+colorRefund+riverRefund; return n; });
      if (colorRefund > 0 || riverRefund > 0) setShowAutoTrimToast(true);
    } else {
      const updHB = { ...(handBets[dragPid] || {}) };
      delete updHB[fromHandId]; updHB[toHandId] = fromAmt;
      const rlD2 = versions?.rankLockThreshold ?? 1;
      const remHC2 = Object.keys(updHB).length;
      const slots2 = remHC2 >= rlD2 ? 0 : (versions?.maxRankSlots ?? 1);
      let rankRefund = 0;
      let updRank2 = { ...(rankBets[dragPid] || {}) };
      while (Object.keys(updRank2).length > slots2) {
        const k = Object.keys(updRank2)[Object.keys(updRank2).length-1];
        rankRefund += updRank2[k]; delete updRank2[k];
      }
      const newHT2 = Object.values(updHB).reduce((s,v)=>s+v,0);
      let newRT2 = Object.values(updRank2).reduce((s,v)=>s+v,0);
      if (newRT2 > newHT2) {
        let excess = newRT2 - newHT2;
        for (const k of Object.keys(updRank2).reverse()) {
          const trim = Math.min(updRank2[k], excess);
          updRank2[k] -= trim; if (updRank2[k]<=0) delete updRank2[k];
          rankRefund += trim; excess -= trim; newRT2 -= trim; if (excess<=0) break;
        }
      }
      const gateOpen = isSideBetGateOpen(updHB, updRank2);
      let colorRefund = 0, riverRefund = 0;
      let updColor2 = { ...(redBlackBets[dragPid] || {}) };
      let updRiver2 = lowHighBets[dragPid] ? { ...lowHighBets[dragPid] } : null;
      if (!gateOpen) {
        colorRefund = Object.values(updColor2).reduce((s,v)=>s+v,0);
        riverRefund = updRiver2?.amount || 0;
        updColor2 = {}; updRiver2 = null;
      }
      setHandBets(p => ({ ...p, [dragPid]: updHB }));
      setRankBets(p => ({ ...p, [dragPid]: updRank2 }));
      setRedBlackBets(p => ({ ...p, [dragPid]: updColor2 }));
      setLowHighBets(p => ({ ...p, [dragPid]: updRiver2 }));
      if (rankRefund > 0 || colorRefund > 0 || riverRefund > 0) {
        setBalances(b => { const n=[...b]; n[dragPid]+=rankRefund+colorRefund+riverRefund; return n; });
        setShowAutoTrimToast(true);
      }
    }
  }, [gamePhase, handBets, rankBets, redBlackBets, lowHighBets, versions]);
}