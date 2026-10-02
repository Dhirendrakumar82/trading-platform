import AppShell from "../components/AppShell.jsx";
import PositionSummary from "../components/PositionSummary.jsx";
import Stat from "../components/Stat.jsx";
import { useTrading } from "../context/TradingContext.jsx";
import { formatMoney, pnlClass, totalPnl } from "../utils";

export default function Portfolio() {
  const { positions, prices, trades } = useTrading();
  const pnl = totalPnl(positions, prices);
  const long = positions.filter((p) => p.net_quantity > 0).length;
  return (
    <AppShell title="Portfolio">
      <div className="stats-grid">
        <Stat label="Open positions" value={positions.length} hint={`${long} long / ${positions.length - long} short`} />
        <Stat label="Unrealized P&L" value={formatMoney(pnl)} tone={pnlClass(pnl)} hint="At the latest live price" />
        <Stat label="Total trades" value={trades.length} />
        <Stat label="Realized P&L" value="n/a" hint="Not tracked in this prototype" />
      </div>
      <PositionSummary />
    </AppShell>
  );
}
