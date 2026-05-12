import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LandingPage() {
  const { token } = useAuth();

  return (
    <section className="page-shell hero">
      <p className="page-header__eyebrow">AI-assisted SAST</p>
      <h1 className="hero__title">Find risky patterns before they ship.</h1>
      <p className="hero__lead muted">
        Paste source code, run static analysis with Bandit and Semgrep-inspired rules, and review clear
        explanations with suggested fixes for issues like SQL injection, XSS, and weak input validation.
      </p>
      <div className="cta-row">
        {token ? (
          <Link className="btn btn-primary" to="/scan">
            Open code scanner
          </Link>
        ) : (
          <>
            <Link className="btn btn-primary" to="/register">
              Create account
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Sign in
            </Link>
          </>
        )}
      </div>

      <div className="grid-2">
        <article className="card card--lift">
          <div className="card__icon" aria-hidden="true">
            ◇
          </div>
          <h3>Static analysis pipeline</h3>
          <p>
            Python Bandit plus Semgrep-style checks produce structured findings with severity, locations, and
            remediation hints.
          </p>
        </article>
        <article className="card card--lift">
          <div className="card__icon" aria-hidden="true">
            ◈
          </div>
          <h3>Scan history</h3>
          <p>
            Authenticated users can persist scans in Supabase and revisit past results from the history view.
          </p>
        </article>
        <article className="card card--lift">
          <div className="card__icon" aria-hidden="true">
            ◆
          </div>
          <h3>Developer-friendly UI</h3>
          <p>
            A focused editor, vulnerability dashboard, and fix suggestions panel keep triage and remediation in
            one place.
          </p>
        </article>
      </div>
    </section>
  );
}
