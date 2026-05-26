import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthUserDto {
  id: string;
  email: string;
  username: string;
}

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
  const [loading] = useState(false);

  const login = useCallback((_emailOrUsername: string, _password: string) => {
    // TODO: Fase 4 — Implementar llamadas reales a /auth/login
    return Promise.reject(new Error("Auth not implemented yet"));
  }, []);

  const register = useCallback((_email: string, _username: string, _password: string) => {
    // TODO: Fase 4
    return Promise.reject(new Error("Auth not implemented yet"));
  }, []);

  const loginGoogle = useCallback((_idToken: string) => {
    // TODO: Fase 4
    return Promise.reject(new Error("Auth not implemented yet"));
  }, []);

  const logout = useCallback(() => {
    // TODO: Fase 4
    setUser(null);
    setAccessToken(null);
    return Promise.resolve();
  }, []);

  const refreshAccessToken = useCallback((): Promise<string | null> => {
    // TODO: Fase 4 — Usa httpOnly cookie automáticamente
    return Promise.resolve(null);
  }, []);

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
