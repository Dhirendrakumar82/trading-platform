export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const digits = n >= 1000 ? 2 : n >= 100 ? 3 : 5;
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatQty(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return (n > 0 ? "+" : "") + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

export function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString();
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** Unrealized PnL of one position using the live price (falls back to the server value). */
export function positionPnl(position, prices) {
  const live = prices[position.symbol]?.price;
  if (live == null) return position.unrealized_pnl ?? null;
  return (live - position.average_price) * position.net_quantity;
}

export function totalPnl(positions, prices) {
  if (positions.length === 0) return 0;
  let sum = 0;
  for (const p of positions) {
    const pnl = positionPnl(p, prices);
    if (pnl == null) return null; // a price is missing, so the total would be misleading
    sum += pnl;
  }
  return sum;
}

export function pnlClass(value) {
  return value > 0 ? "up" : value < 0 ? "down" : "";
}
