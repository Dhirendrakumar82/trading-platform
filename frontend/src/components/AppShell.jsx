import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo.jsx";
import ConnectionStatus from "./ConnectionStatus.jsx";
import { useTrading } from "../context/TradingContext.jsx";
import { getUser } from "../auth.js";

const links = [
  ["/", "⌂", "Dashboard"],
  ["/markets", "◫", "Markets"],
  ["/trade", "⇄", "Trade"],
  ["/portfolio", "▣", "Portfolio"],
  ["/orders", "▤", "Orders"],
  ["/history", "◷", "History"],
  ["/settings", "⚙", "Settings"],
];

export default function AppShell({ children, title = "Dashboard" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { status, notice, query, setQuery } = useTrading();
  const user = getUser();
  const initials = (user.name || "Trader").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  function logout() {
    localStorage.removeItem("tradex_user");
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell-x">
      <aside className={`side-nav ${open ? "open" : ""}`}>
        <div className="side-top"><Logo /><button className="close-side" aria-label="Close menu" onClick={() => setOpen(false)}>×</button></div>
        <nav className="main-nav">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}><i>{icon}</i><span>{label}</span></NavLink>
          ))}
        </nav>
      </aside>
      {open && <button className="side-overlay" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="main-area">
        <header className="top-nav">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
          <div className="search-box">
            <span>⌕</span>
            <input placeholder="Filter symbols…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter symbols" />
          </div>
          <div className="top-actions">
            <ConnectionStatus status={status} />
            <div className="profile">
              <span className="avatar">{initials}</span>
              <span className="profile-name">{user.name || "Trader"}</span>
              <span>⌄</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading"><div><h1>{title}</h1><p>Live market data and your trading activity</p></div></div>
          {notice && <div className="notice" role="alert">{notice}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
