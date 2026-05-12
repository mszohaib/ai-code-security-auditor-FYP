import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { postJson } from "../services/api.js";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await postJson("/api/auth/login", { email, password });
      login(data.access_token, data.user?.email || email);
      navigate("/scan");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <section className="page-shell page-narrow">
      <header className="page-header">
        <p className="page-header__eyebrow">Welcome back</p>
        <h1 className="page-header__title">Sign in</h1>
        <p className="page-header__desc muted">Use the credentials you registered with Supabase-backed auth.</p>
      </header>
      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Continue
        </button>
        <p className="muted text-small">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </section>
  );
}
