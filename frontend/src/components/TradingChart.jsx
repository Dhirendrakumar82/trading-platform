import { useTrading } from "../context/TradingContext.jsx";
import { formatPercent, formatPrice } from "../utils";

/** Live line chart of the selected symbol, drawn from the ticks received in this session. */
export default function TradingChart() {
  const { history, prices, selected } = useTrading();
  const data = history[selected] || [];
  const quote = prices[selected];
  const change = quote ? ((quote.price - quote.open) / quote.open) * 100 : null;

  let points = null;
  let min = 0;
  let max = 0;
  if (data.length >= 2) {
    min = Math.min(...data);
    max = Math.max(...data);
    const span = max - min || 1;
    points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${92 - ((v - min) / span) * 78}`).join(" ");
  }

  return (
    <div className="chart-wrap">
      <div className="chart-head">
        <div>
          <div className="chart-title"><span className="market-icon mini blue">{selected ? selected[0] : "·"}</span><b>{selected || "—"}</b><em>LIVE</em></div>
          <div className="chart-price">{quote ? formatPrice(quote.price) : "Waiting for price…"}
            {quote && <span className={change < 0 ? "down" : ""}> {formatPercent(change)} this session</span>}</div>
        </div>
      </div>
      <div className="ohlc">
        Bid <b>{quote ? formatPrice(quote.bid) : "—"}</b> Ask <b>{quote ? formatPrice(quote.ask) : "—"}</b>
        Ticks <b>{data.length}</b>
      </div>
      <div className="chart-area">
        {points ? (
          <>
            <div className="y-labels"><span>{formatPrice(max)}</span><span>{formatPrice((max + min) / 2)}</span><span>{formatPrice(min)}</span></div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart" role="img" aria-label={`${selected} live price`}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(0,210,164,.35)" /><stop offset="1" stopColor="rgba(0,210,164,0)" />
                </linearGradient>
              </defs>
              <polygon points={`0,100 ${points} 100,100`} fill="url(#fill)" />
              <polyline points={points} fill="none" stroke="#10d9a5" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            </svg>
          </>
        ) : <div className="chart-empty">Waiting for live ticks…</div>}
      </div>
    </div>
  );
}
