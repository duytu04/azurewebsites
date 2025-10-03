import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, register as registerRequest, type LoginPayload, type RegisterPayload } from "../api/auth";
import type { UserProfile } from "../types";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
}

const STORAGE_KEY = "sales.auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as AuthState;
    return parsed;
  } catch (error) {
    console.warn("Failed to parse auth cache", error);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredAuth());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.token && state.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    const user: UserProfile = {
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      expiresAt: response.expiresAt
    };
    setState({ token: response.token, user });
    return user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    const user: UserProfile = {
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      expiresAt: response.expiresAt
    };
    setState({ token: response.token, user });
    return user;
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token: state.token,
    user: state.user,
    isAuthenticated: Boolean(state.token),
    login,
    register,
    logout
  }), [login, logout, register, state.token, state.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
