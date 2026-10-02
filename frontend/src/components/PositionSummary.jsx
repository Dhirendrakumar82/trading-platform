import { useTrading } from "../context/TradingContext.jsx";
import { formatMoney, formatPrice, formatQty, pnlClass, positionPnl, totalPnl } from "../utils";

export default function PositionSummary() {
  const { positions, prices } = useTrading();
  const total = totalPnl(positions, prices);
  return (
    <section className="panel table-panel">
      <div className="panel-head"><h3>Positions</h3><span>Unrealized P&amp;L: <b className={pnlClass(total)}>{formatMoney(total)}</b></span></div>
      <table>
        <thead>
          <tr><th>Symbol</th><th>Net qty</th><th>Avg price</th><th>Last</th><th>Unrealized P&amp;L</th></tr>
        </thead>
        <tbody>
          {positions.length === 0 && <tr><td colSpan="5" className="muted">No open positions.</td></tr>}
          {positions.map((p) => {
            const pnl = positionPnl(p, prices);
            return (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{formatQty(p.net_quantity)}</td>
                <td>{formatPrice(p.average_price)}</td>
                <td>{formatPrice(prices[p.symbol]?.price)}</td>
                <td className={pnlClass(pnl)}>{formatMoney(pnl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
