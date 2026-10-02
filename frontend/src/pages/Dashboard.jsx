import AppShell from "../components/AppShell.jsx";
import ConnectionStatus from "../components/ConnectionStatus.jsx";
import OrderPanel from "../components/OrderPanel.jsx";
import PositionSummary from "../components/PositionSummary.jsx";
import PriceTable from "../components/PriceTable.jsx";
import Stat from "../components/Stat.jsx";
import TradeHistory from "../components/TradeHistory.jsx";
import TradingChart from "../components/TradingChart.jsx";
import { useTrading } from "../context/TradingContext.jsx";
import { formatMoney, pnlClass, totalPnl } from "../utils";

export default function Dashboard() {
  const { trades, positions, prices, status } = useTrading();
  const today = new Date().toDateString();
  const tradesToday = trades.filter((t) => new Date(t.timestamp).toDateString() === today).length;
  const pnl = totalPnl(positions, prices);
  return (
    <AppShell title="Dashboard">
      <div className="stats-grid">
        <Stat label="Total trades today" value={tradesToday} />
        <Stat label="Open positions" value={positions.length} />
        <Stat label="Unrealized P&L" value={formatMoney(pnl)} tone={pnlClass(pnl)} />
        <Stat label="Price feed" value={<ConnectionStatus status={status} />} />
      </div>
      <div className="dashboard-grid">
        <TradingChart />
        <OrderPanel />
        <PriceTable />
      </div>
      <div className="split-2">
        <PositionSummary />
        <TradeHistory title="Recent Trades" limit={8} />
      </div>
    </AppShell>
  );
}
