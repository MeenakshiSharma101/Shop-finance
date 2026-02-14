import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        setToken(parsed.token);
        setUser(parsed.user);
      }
      setLoading(false);
    })();
  }, []);

  const saveAuth = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(
      "auth",
      JSON.stringify({ token: nextToken, user: nextUser })
    );
  };

  const login = async (payload) => {
    const result = await api.login(payload);
    await saveAuth(result.token, result.user);
  };

  const register = async (payload) => {
    const result = await api.register(payload);
    await saveAuth(result.token, result.user);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("auth");
  };

  const value = useMemo(
    () => ({
      loading,
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
