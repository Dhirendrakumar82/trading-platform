import AppShell from "../components/AppShell.jsx";
import MarketCards from "../components/MarketCards.jsx";
import PriceTable from "../components/PriceTable.jsx";
import TradingChart from "../components/TradingChart.jsx";

export default function Markets() {
  return (
    <AppShell title="Markets">
      <MarketCards />
      <div className="split-2">
        <TradingChart />
        <PriceTable />
      </div>
    </AppShell>
  );
}
