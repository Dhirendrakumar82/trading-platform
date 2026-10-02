import AppShell from "../components/AppShell.jsx";
import OrderPanel from "../components/OrderPanel.jsx";
import PriceTable from "../components/PriceTable.jsx";
import TradeHistory from "../components/TradeHistory.jsx";
import TradingChart from "../components/TradingChart.jsx";

export default function Trade() {
  return (
    <AppShell title="Trade">
      <div className="trade-layout"><TradingChart /><OrderPanel /></div>
      <div className="split-2">
        <PriceTable />
        <TradeHistory title="Recent Trades" limit={8} />
      </div>
    </AppShell>
  );
}
