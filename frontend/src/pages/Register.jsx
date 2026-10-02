import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { hashPassword } from "../auth.js";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    const passwordHash = await hashPassword(form.password);
    localStorage.setItem("tradex_account", JSON.stringify({ name: form.name.trim(), email: form.email.trim(), passwordHash }));
    nav("/login");
  }

  return (
    <div className="auth-page">
      <div className="auth-visual"><div className="auth-visual-inner"><Logo />
        <h2>Your market. Your control.</h2>
        <p>Create a demo account and get your trading workspace ready in seconds.</p>
      </div></div>
      <div className="auth-panel"><div className="auth-card"><Logo />
        <h1>Create account</h1>
        <p>Demo account stored in this browser only. Register first, then login.</p>
        <form className="auth-form" onSubmit={submit}>
          {error && <div className="auth-error">{error}</div>}
          <label>Full name<input name="name" required value={form.name} onChange={update} placeholder="Your name" /></label>
          <label>Email address<input name="email" type="email" required value={form.email} onChange={update} placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" required value={form.password} onChange={update} placeholder="Minimum 6 characters" /></label>
          <label>Confirm password<input name="confirm" type="password" required value={form.confirm} onChange={update} placeholder="Repeat your password" /></label>
          <button className="auth-submit">Create TradeX Account</button>
          <p className="auth-switch">Already registered? <Link to="/login">Login here</Link></p>
        </form>
      </div></div>
    </div>
  );
}
