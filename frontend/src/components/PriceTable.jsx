import { useTrading } from "../context/TradingContext.jsx";
import { formatPercent, formatPrice, formatTime } from "../utils";

export default function PriceTable() {
  const { instruments, prices, status, selected, setSelected, query } = useTrading();
  const symbols = instruments.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));
  const stale = status !== "connected";

  function trade(symbol) {
    setSelected(symbol);
    document.getElementById("order-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className={`panel table-panel ${stale ? "is-stale" : ""}`}>
      <div className="panel-head"><h3>Live Prices</h3><span>{stale ? "Feed not live" : "Streaming"}</span></div>
      <table>
        <thead>
          <tr><th>Symbol</th><th>Bid</th><th>Ask</th><th>Last</th><th>Session %</th><th>Updated</th><th /></tr>
        </thead>
        <tbody>
          {symbols.length === 0 && <tr><td colSpan="7" className="muted">No instruments to show.</td></tr>}
          {symbols.map((symbol) => {
            const q = prices[symbol];
            const dir = q?.direction || "flat";
            const change = q ? ((q.price - q.open) / q.open) * 100 : null;
            return (
              <tr key={symbol} className={selected === symbol ? "row-selected" : ""}>
                <td>{symbol}</td>
                <td>{q ? formatPrice(q.bid) : "—"}</td>
                <td>{q ? formatPrice(q.ask) : "—"}</td>
                <td key={q?.price} className={q ? `flash-${dir}` : ""}>{q ? formatPrice(q.price) : "Waiting…"}</td>
                <td className={change > 0 ? "up" : change < 0 ? "down" : ""}>{formatPercent(change)}</td>
                <td className="muted">{q ? formatTime(q.updated_at) : "—"}</td>
                <td><button type="button" className="row-btn" onClick={() => trade(symbol)}>Trade</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
