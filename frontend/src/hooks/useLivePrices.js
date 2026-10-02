import { useEffect, useRef, useState } from "react";
import { createPriceSocket } from "../services/websocket";

const FLUSH_MS = 250; // UI renders at most 4x per second regardless of tick rate
const HISTORY_POINTS = 150; // ticks kept per symbol for the chart

/**
 * Subscribes to the backend price stream. Incoming ticks are buffered and flushed on a timer
 * so high-frequency markets do not cause a React render per tick.
 * Returns { prices, history, status }. `status` combines the browser socket state with the
 * backend's external-feed state (connected | connecting | disconnected | error).
 */
export default function useLivePrices() {
  const [data, setData] = useState({ prices: {}, history: {} });
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [feedStatus, setFeedStatus] = useState("connecting");
  const pending = useRef({});
  const feed = useRef(null);
  const dirty = useRef(false);

  useEffect(() => {
    const socket = createPriceSocket({
      onStatus: setSocketStatus,
      onMessage: (msg) => {
        if (msg.prices) Object.assign(pending.current, msg.prices);
        if (msg.status) feed.current = msg.status;
        dirty.current = true;
      },
    });

    const timer = setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;
      const incoming = pending.current;
      pending.current = {};
      if (feed.current) setFeedStatus(feed.current);
      if (Object.keys(incoming).length === 0) return;
      setData((prev) => {
        const prices = { ...prev.prices };
        const history = { ...prev.history };
        for (const [symbol, quote] of Object.entries(incoming)) {
          if (!quote || typeof quote.price !== "number") continue; // ignore malformed entries
          const old = prev.prices[symbol];
          let direction = "flat";
          if (old) direction = quote.price > old.price ? "up" : quote.price < old.price ? "down" : old.direction;
          prices[symbol] = { ...quote, direction, open: old?.open ?? quote.price };
          history[symbol] = [...(prev.history[symbol] || []).slice(-(HISTORY_POINTS - 1)), quote.price];
        }
        return { prices, history };
      });
    }, FLUSH_MS);

    socket.connect();
    return () => {
      clearInterval(timer);
      socket.close();
    };
  }, []);

  const status = socketStatus !== "connected" ? socketStatus : feedStatus;
  return { prices: data.prices, history: data.history, status };
}
