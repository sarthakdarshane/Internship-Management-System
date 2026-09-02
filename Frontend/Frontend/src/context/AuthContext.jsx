import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProfile } from "../services/api";

export const AuthContext = createContext(null);
const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("token")) && !storedUser(),
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
    if (!localStorage.getItem("token") || user) {
      setLoading(false);
      return;
    }
    getProfile()
      .then(({ data }) => saveUser(data.user ?? data))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout, saveUser, user]);
  const value = useMemo(
    () => ({ user, loading, saveUser, logout }),
    [user, loading, saveUser, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
