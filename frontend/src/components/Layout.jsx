import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Layout() {
  const { token, userEmail, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          AI Code Security Auditor
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          {token ? (
            <>
              <NavLink to="/scan">Scan</NavLink>
              <NavLink to="/history">History</NavLink>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                {userEmail}
              </span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
