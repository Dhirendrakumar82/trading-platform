import { useState } from "react";
import { useTrading } from "../context/TradingContext.jsx";
import { errorMessage, placeOrder } from "../services/api";
import { formatPrice } from "../utils";

export default function OrderPanel() {
  const { instruments, prices, selected, setSelected, onOrderPlaced } = useTrading();
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, text }

  const quote = prices[selected];
  const qty = Number(quantity);
  const validQty = quantity.trim() !== "" && Number.isFinite(qty) && qty > 0;
  // Same rule as the server: BUY fills at the ask, SELL at the bid.
  const fill = quote ? (side === "BUY" ? quote.ask ?? quote.price : quote.bid ?? quote.price) : null;
  const estimate = fill != null && validQty ? fill * qty : null;

  function bump(delta) {
    const next = (validQty ? qty : 0) + delta;
    if (next > 0) setQuantity(String(Number(next.toFixed(8))));
  }

  async function submit() {
    if (!selected) return setFeedback({ ok: false, text: "Choose a symbol." });
    if (!validQty) return setFeedback({ ok: false, text: "Enter a quantity greater than 0." });
    if (!quote) return setFeedback({ ok: false, text: "Waiting for a live price for this symbol." });
    setBusy(true);
    setFeedback(null);
    try {
      const res = await placeOrder({ symbol: selected, side, quantity: quantity.trim() });
      setFeedback({ ok: true, text: `${res.trade.trade_id}: ${side} ${quantity} ${selected} filled at ${formatPrice(res.trade.price)}.` });
      onOrderPlaced(res.trade);
    } catch (err) {
      setFeedback({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="order-ticket" id="order-panel">
      <div className="buy-sell">
        <button type="button" className={side === "BUY" ? "selected buy" : ""} onClick={() => setSide("BUY")}>Buy</button>
        <button type="button" className={side === "SELL" ? "selected sell" : ""} onClick={() => setSide("SELL")}>Sell</button>
      </div>
      <label htmlFor="order-symbol">Symbol
        <select id="order-symbol" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {instruments.length === 0 && <option value="">Loading…</option>}
          {instruments.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label htmlFor="order-qty">Quantity
        <div className="qty">
          <button type="button" aria-label="Decrease quantity" onClick={() => bump(-1)}>−</button>
          <input id="order-qty" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <button type="button" aria-label="Increase quantity" onClick={() => bump(1)}>+</button>
        </div>
      </label>
      <dl>
        <div><dt>Bid / Ask</dt><dd>{quote ? `${formatPrice(quote.bid)} / ${formatPrice(quote.ask)}` : "—"}</dd></div>
        <div><dt>{side === "BUY" ? "Fill price (ask)" : "Fill price (bid)"}</dt><dd>{fill != null ? formatPrice(fill) : "—"}</dd></div>
        <div><dt>Estimated value</dt><dd>{estimate != null ? formatPrice(estimate) : "—"}</dd></div>
      </dl>
      <button type="button" className={`place-order ${side.toLowerCase()}`} disabled={busy || !quote || !validQty} onClick={submit}>
        {busy ? "Placing…" : `Place ${side === "BUY" ? "Buy" : "Sell"} Order`}
      </button>
      {!quote && selected && <p className="form-msg err">Waiting for a live price for {selected}…</p>}
      {feedback && <p className={`form-msg ${feedback.ok ? "ok" : "err"}`} role="alert">{feedback.text}</p>}
    </div>
  );
}
