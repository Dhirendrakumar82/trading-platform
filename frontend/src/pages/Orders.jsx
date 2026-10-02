import AppShell from "../components/AppShell.jsx";
import Stat from "../components/Stat.jsx";
import TradeHistory from "../components/TradeHistory.jsx";
import { useTrading } from "../context/TradingContext.jsx";

export default function Orders() {
  const { trades } = useTrading();
  const count = (fn) => trades.filter(fn).length;
  return (
    <AppShell title="Orders">
      <div className="stats-grid">
        <Stat label="Total orders" value={trades.length} />
        <Stat label="Filled" value={count((t) => t.status === "FILLED")} />
        <Stat label="Buy orders" value={count((t) => t.side === "BUY")} />
        <Stat label="Sell orders" value={count((t) => t.side === "SELL")} />
      </div>
      <TradeHistory title="All Orders" />
    </AppShell>
  );
}
