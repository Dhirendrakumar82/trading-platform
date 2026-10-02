# TradeX frontend (React + Vite)

Live trading dashboard. All prices, trades and positions come from the Django backend:
the price table, chart and order panel use the backend WebSocket (`/ws/prices/`), trade
history and positions use the REST API (`/api/trades/`, `/api/positions/`, `/api/health/`).

## Run
```bash
npm install
npm run dev    # http://localhost:5173 (proxies /api and /ws to http://localhost:8000)
```

## Login
The assignment does not require a login; the register/login screens are a demo gate that
stores an account (password as SHA-256 hash) in `localStorage`. Register once, then log in.

## Structure
`context/TradingContext.jsx` (shared live state) · `hooks/useLivePrices.js` (batched WS client,
4 renders/s) · `services/` (axios + WebSocket reconnect) · `components/` · `pages/`.
