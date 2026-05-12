import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function navClass({ isActive }) {
  return `nav-link${isActive ? " nav-link--active" : ""}`;
}

export function Layout() {
  const { token, userEmail, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden="true" />
            <span className="brand__text">AI Code Security Auditor</span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            {token ? (
              <>
                <NavLink to="/scan" className={navClass}>
                  Scan
                </NavLink>
                <NavLink to="/history" className={navClass}>
                  History
                </NavLink>
                <span className="nav-user muted text-small">{userEmail}</span>
                <button type="button" className="btn btn--sm btn-ghost" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main-inner">
        <Outlet />
      </main>
    </div>
  );
}
