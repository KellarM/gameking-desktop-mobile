// Money on the tables always shows two decimals — $0.50, never $0.5 — and keeps
// the thousands grouping on the bigger caps.
export default function formatMoney(amount) {
  const value = Number(amount);
  return (Number.isFinite(value) ? value : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}