import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "../services/api";
import { AuthContext } from "./auth-context";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  // Resolve the profile only when a token exists but no cached user is present.
  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem("token")) && !readStoredUser(),
  );

  const saveUser = useCallback((profile) => {
    localStorage.setItem("user", JSON.stringify(profile));
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    // Nothing to resolve if we already have a cached user or no token.
    if (user || !localStorage.getItem("token")) return;

    let active = true;
    getProfile()
      .then(({ data }) => {
        if (active) saveUser(data.user ?? data);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [logout, saveUser, user]);

  const value = useMemo(
    () => ({ user, loading, saveUser, logout }),
    [user, loading, saveUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}