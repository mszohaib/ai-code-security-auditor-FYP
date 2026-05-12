import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { postJson } from "../services/api.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const data = await postJson("/api/auth/register", { email, password });
      if (data.access_token) {
        login(data.access_token, data.user?.email || email);
        navigate("/scan");
      } else {
        setInfo(
          data.message ||
            "Account created. Confirm your email if required, then sign in."
        );
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <section className="page-shell page-narrow">
      <header className="page-header">
        <p className="page-header__eyebrow">Get started</p>
        <h1 className="page-header__title">Create account</h1>
        <p className="page-header__desc muted">Registers a Supabase user via the Node API.</p>
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        {info && <p className="muted text-small">{info}</p>}
        <button type="submit" className="btn btn-primary">
          Register
        </button>
        <p className="muted text-small">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
