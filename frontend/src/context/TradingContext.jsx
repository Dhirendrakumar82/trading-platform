import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useLivePrices from "../hooks/useLivePrices.js";
import { errorMessage, getHealth, getPositions, getTrades } from "../services/api.js";

const TradingContext = createContext(null);

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used inside <TradingProvider>");
  return ctx;
}

/** Single source of truth for live prices, trades, positions and backend health. */
export function TradingProvider({ children }) {
  const { prices, history, status } = useLivePrices();
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");

  const loadHealth = useCallback(async () => {
    try {
      setHealth(await getHealth());
      setHealthError(null);
    } catch {
      setHealthError("Cannot reach the backend. Is the server running?");
    }
  }, []);

  const refreshTrades = useCallback(async () => {
    try {
      setTrades(await getTrades({ limit: 200 }));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    try {
      setPositions(await getPositions());
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  // App load: health/status first, then trade data. Health is re-checked periodically.
  useEffect(() => {
    loadHealth();
    refreshTrades();
    refreshPositions();
    const id = setInterval(loadHealth, 10000);
    return () => clearInterval(id);
  }, [loadHealth, refreshTrades, refreshPositions]);

  const instruments = useMemo(
    () => health?.instruments ?? Object.keys(prices),
    [health, prices],
  );

  useEffect(() => {
    if (!selected && instruments.length > 0) setSelected(instruments[0]);
  }, [instruments, selected]);

  // A placed order shows up in history immediately, then positions are re-read from the server.
  const onOrderPlaced = useCallback(
    (trade) => {
      setTrades((prev) => [trade, ...prev.filter((t) => t.trade_id !== trade.trade_id)]);
      refreshPositions();
    },
    [refreshPositions],
  );

  const notice = useMemo(() => {
    if (healthError && status !== "connected") return healthError;
    if (status === "error") return health?.auth_error || "The live price feed reported an error. Retrying…";
    if (status === "disconnected") return "Live price feed is disconnected. Reconnecting…";
    return null;
  }, [healthError, status, health]);

  const value = {
    prices, history, status, health, notice, instruments,
    trades, positions, loadError, refreshTrades, refreshPositions, onOrderPlaced,
    selected, setSelected, query, setQuery,
  };
  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
