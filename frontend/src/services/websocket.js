const BASE_DELAY = 1000;
const MAX_DELAY = 15000;

function socketUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/prices/`;
}

/** WebSocket client with exponential-backoff reconnect. Statuses: connecting | connected | disconnected | error */
export function createPriceSocket({ onStatus, onMessage }) {
  let ws = null;
  let attempt = 0;
  let timer = null;
  let closed = false;

  function connect() {
    if (closed) return;
    onStatus("connecting");
    ws = new WebSocket(socketUrl());
    ws.onopen = () => {
      attempt = 0;
      onStatus("connected");
    };
    ws.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onerror = () => onStatus("error");
    ws.onclose = () => {
      if (closed) return;
      onStatus("disconnected");
      const delay = Math.min(MAX_DELAY, BASE_DELAY * 2 ** attempt++);
      timer = setTimeout(connect, delay);
    };
  }

  return {
    connect,
    close() {
      closed = true;
      clearTimeout(timer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    },
  };
}
