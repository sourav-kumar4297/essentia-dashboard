"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/bd-types";
import { isFullAccess } from "@/lib/rbac";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  applyUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  exitImpersonation: () => Promise<{ ok: boolean; error?: string }>;
  isAdmin: boolean;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyUser = useCallback((next: AuthUser) => {
    setUser(next);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    const res = await fetch("/api/auth/switch-user", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = (await res.json()) as { error?: string; user?: AuthUser };
    if (!res.ok || !data.user) {
      return { ok: false, error: data.error || "Could not switch user." };
    }
    setUser(data.user);
    return { ok: true };
  }, []);

  const exitImpersonation = useCallback(async () => {
    const res = await fetch("/api/auth/switch-user", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    const data = (await res.json()) as { error?: string; user?: AuthUser };
    if (!res.ok || !data.user) {
      return { ok: false, error: data.error || "Could not exit." };
    }
    setUser(data.user);
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      applyUser,
      logout,
      switchUser,
      exitImpersonation,
      isAdmin: user ? isFullAccess(user.role) : false,
      isImpersonating: Boolean(user?.impersonator),
    }),
    [
      user,
      loading,
      refresh,
      applyUser,
      logout,
      switchUser,
      exitImpersonation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
