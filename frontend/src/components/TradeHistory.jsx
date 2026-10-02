import { useTrading } from "../context/TradingContext.jsx";
import { formatDateTime, formatPrice, formatQty } from "../utils";

export default function TradeHistory({ trades: given, title = "Trade History", limit }) {
  const { trades: all, loadError } = useTrading();
  const source = given ?? all;
  const rows = limit ? source.slice(0, limit) : source;

  return (
    <section className="panel table-panel">
      <div className="panel-head"><h3>{title}</h3><span>{rows.length} of {source.length}</span></div>
      {loadError && <p className="form-msg err">{loadError}</p>}
      <table>
        <thead>
          <tr><th>Trade ID</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="7" className="muted">No trades yet. Place a Buy or Sell order to see it here.</td></tr>}
          {rows.map((t) => (
            <tr key={t.trade_id}>
              <td className="muted">{t.trade_id}</td>
              <td>{t.symbol}</td>
              <td><b className={`trade-pill ${t.side.toLowerCase()}`}>{t.side === "BUY" ? "Buy" : "Sell"}</b></td>
              <td>{formatQty(t.quantity)}</td>
              <td>{formatPrice(t.price)}</td>
              <td><span className="status-dot">●</span> {t.status === "FILLED" ? "Filled" : "Rejected"}</td>
              <td>{formatDateTime(t.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
