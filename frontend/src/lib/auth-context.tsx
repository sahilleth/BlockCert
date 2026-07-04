import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginApi, TOKEN_KEY, USER_KEY } from "./api";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True once we've read localStorage on the client. Never true during SSR. */
  hydrated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.localStorage.getItem(TOKEN_KEY);
    const u = window.localStorage.getItem(USER_KEY);
    if (t) setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u) as User);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    window.localStorage.setItem(TOKEN_KEY, res.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isAdmin: user?.role === "ADMIN",
      hydrated,
      login,
      logout,
    }),
    [user, token, hydrated, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
