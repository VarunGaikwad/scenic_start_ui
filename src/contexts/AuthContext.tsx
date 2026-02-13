import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { isMe, logoutUser } from "@/api";
import type { AuthContextType } from "@/interface";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async (signal?: AbortSignal) => {
    setError(null);

    try {
      const response = await isMe();

      if (signal?.aborted) return;

      setAuthenticated(response.status === 200);
    } catch (error: any) {
      if (signal?.aborted) return;

      if (error.response?.status === 401) {
        setAuthenticated(false);
      } else if (!navigator.onLine) {
        setError("You're offline. Authentication cannot be verified.");
      } else {
        setError("Unable to verify authentication.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(); // backend should clear cookie
    } catch {
      // ignore network failure
    }

    setAuthenticated(false);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const runCheck = () => {
      if (!cancelled) checkAuth(controller.signal);
    };

    runCheck();

    const interval = setInterval(
      () => {
        if (!cancelled) checkAuth();
      },
      5 * 60 * 1000,
    );

    const handleFocus = () => {
      if (!cancelled) checkAuth();
    };

    const handleOnline = () => {
      setError(null);
      if (!cancelled) checkAuth();
    };

    const handleOffline = () => {
      setError("You're offline. Some features may be limited.");
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{ authenticated, loading, error, checkAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
