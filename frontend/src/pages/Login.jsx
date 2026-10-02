import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { getAccount, hashPassword } from "../auth.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const saved = getAccount();
    if (!saved) return setError("Account not found. Please register first.");
    const hash = await hashPassword(password);
    // `saved.password` is the legacy plain-text format from an older build; migrate it on login.
    const ok = saved.passwordHash ? saved.passwordHash === hash : saved.password === password;
    if (saved.email.toLowerCase() !== email.trim().toLowerCase() || !ok) return setError("Invalid email or password.");
    if (!saved.passwordHash) localStorage.setItem("tradex_account", JSON.stringify({ name: saved.name, email: saved.email, passwordHash: hash }));
    localStorage.setItem("tradex_user", JSON.stringify({ name: saved.name, email: saved.email }));
    navigate(location.state?.from || "/", { replace: true });
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Login to access your TradeX dashboard.">
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="auth-error">{error}</div>}
        <label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
        <button className="auth-submit">Login to TradeX</button>
        <p className="auth-switch">Don't have an account? <Link to="/register">Create account</Link></p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-visual"><div className="auth-visual-inner"><Logo />
        <h2>Trade with clarity.</h2>
        <p>Live prices, one-click Buy/Sell orders and an instant trade history in one workspace.</p>
      </div></div>
      <div className="auth-panel"><div className="auth-card"><Logo /><h1>{title}</h1><p>{subtitle}</p>{children}</div></div>
    </div>
  );
}
