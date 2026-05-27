import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { setAccessToken as setClientToken, clearAccessToken as clearClientToken } from "../lib/api/client.js";
import {
  loginApi,
  registerApi,
  loginGoogleApi,
  logoutApi,
  fetchMe,
} from "../lib/api/auth.js";
import { AuthError } from "../lib/api/client.js";
import type { AuthUserDto } from "../types/api.js";

interface AuthContextValue {
  user: AuthUserDto | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        setUser(null);
        clearClientToken();
      })
      .finally(() => { setLoading(false); });
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const res = await loginApi(emailOrUsername, password);
    setClientToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await registerApi(email, username, password);
    setClientToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const loginGoogle = useCallback(async (idToken: string) => {
    const res = await loginGoogleApi(idToken);
    setClientToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore network errors on logout */
    }
    setUser(null);
    setAccessToken(null);
    clearClientToken();
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        void logout();
        return null;
      }
      const body = (await res.json()) as { accessToken: string };
      setClientToken(body.accessToken);
      setAccessToken(body.accessToken);
      return body.accessToken;
    } catch {
      void logout();
      return null;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isAuthenticated: user !== null && accessToken !== null,
        login,
        register,
        loginGoogle,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthError };
