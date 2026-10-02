import { useTrading } from "../context/TradingContext.jsx";
import { formatPercent, formatPrice } from "../utils";

export default function MarketCards() {
  const { instruments, prices, selected, setSelected } = useTrading();
  return (
    <div className="market-cards">
      {instruments.map((symbol) => {
        const q = prices[symbol];
        const change = q ? ((q.price - q.open) / q.open) * 100 : null;
        const tone = q?.direction === "down" ? "down" : "up";
        return (
          <button type="button" key={symbol} className={`market-card ${selected === symbol ? "is-selected" : ""}`}
            onClick={() => setSelected(symbol)}>
            <div className="market-icon blue">{symbol[0]}</div>
            <div>
              <div className="market-symbol">{symbol}</div>
              <strong key={q?.price} className={q ? `flash-${q.direction}` : ""}>{q ? formatPrice(q.price) : "Waiting…"}</strong>
              <small className={tone}>{q?.direction === "down" ? "↘" : "↗"} {formatPercent(change)} this session</small>
            </div>
          </button>
        );
      })}
    </div>
  );
}
