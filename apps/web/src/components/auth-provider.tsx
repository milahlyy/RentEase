"use client";

import type { User } from "@rentease/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearStoredToken, fetchCurrentUser, getStoredToken } from "../lib/auth-client";

type AuthContextValue = {
  error: string | null;
  hasToken: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();

    setError(null);

    if (!token) {
      setUser(null);
      setHasToken(false);
      setIsLoading(false);
      return;
    }

    setHasToken(true);
    setIsLoading(true);

    const response = await fetchCurrentUser(token);

    if (response.success) {
      setUser(response.data.user);
      setHasToken(true);
    } else {
      clearStoredToken();
      setUser(null);
      setHasToken(false);
      setError(response.error);
    }

    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setHasToken(false);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshUser();

    function handleAuthChanged() {
      void refreshUser();
    }

    window.addEventListener("rentease-auth-changed", handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);

    return () => {
      window.removeEventListener("rentease-auth-changed", handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ error, hasToken, isLoading, logout, refreshUser, user }),
    [error, hasToken, isLoading, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within AuthProvider");
  }

  return context;
}
