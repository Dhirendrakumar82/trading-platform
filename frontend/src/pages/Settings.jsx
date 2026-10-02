import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import ConnectionStatus from "../components/ConnectionStatus.jsx";
import { useTrading } from "../context/TradingContext.jsx";
import { getAccount, getUser } from "../auth.js";
import { formatTime } from "../utils";

export default function Settings() {
  const user = getUser();
  const { health, status, instruments } = useTrading();
  const [name, setName] = useState(user.name || "");
  const [saved, setSaved] = useState(false);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("tradex_user", JSON.stringify({ ...user, name: trimmed }));
    const account = getAccount();
    if (account) localStorage.setItem("tradex_account", JSON.stringify({ ...account, name: trimmed }));
    setSaved(true);
  }

  return (
    <AppShell title="Settings">
      <div className="settings-grid">
        <section className="panel settings-panel">
          <h3>Profile</h3>
          <p>Demo profile stored in this browser only.</p>
          <label>Full name<input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} /></label>
          <label>Email address<input value={user.email || ""} disabled /></label>
          <button onClick={save} className="save-btn">Save changes</button>
          {saved && <span className="saved">Saved. Reload to see it in the header.</span>}
        </section>
        <section className="panel settings-panel">
          <h3>Connection</h3>
          <p>Live status reported by the backend.</p>
          <dl className="kv">
            <div><dt>Price feed</dt><dd><ConnectionStatus status={status} /></dd></div>
            <div><dt>External auth</dt><dd>{health?.external_auth === "authenticated" ? "Authenticated" : "Not authenticated"}</dd></div>
            <div><dt>Last price</dt><dd>{formatTime(health?.last_price_at)}</dd></div>
            <div><dt>Instruments</dt><dd>{instruments.join(", ") || "—"}</dd></div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}
