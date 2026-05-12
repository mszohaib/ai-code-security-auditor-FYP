import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "acs_auditor_token";
const EMAIL_KEY = "acs_auditor_email";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(EMAIL_KEY));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(EMAIL_KEY, userEmail);
    } else {
      localStorage.removeItem(EMAIL_KEY);
    }
  }, [userEmail]);

  const login = useCallback((accessToken, email) => {
    setToken(accessToken);
    setUserEmail(email ?? "");
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      userEmail,
      loading,
      setLoading,
      login,
      logout,
    }),
    [token, userEmail, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
