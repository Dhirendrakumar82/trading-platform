import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import TradeHistory from "../components/TradeHistory.jsx";
import { useTrading } from "../context/TradingContext.jsx";

export default function History() {
  const { trades, instruments } = useTrading();
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("");
  const filtered = trades.filter((t) => (!symbol || t.symbol === symbol) && (!side || t.side === side));
  return (
    <AppShell title="Trade History">
      <div className="filters">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Filter by symbol">
          <option value="">All symbols</option>
          {instruments.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={side} onChange={(e) => setSide(e.target.value)} aria-label="Filter by side">
          <option value="">Buy &amp; Sell</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>
      <TradeHistory trades={filtered} title="Recent Activity" />
    </AppShell>
  );
}
