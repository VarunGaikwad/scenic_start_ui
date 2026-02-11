import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { isMe } from "@/api";
import { deleteDataFromLocalStorage } from "@/utils";
import { STORAGE_KEYS } from "@/constants";
import type { AuthContextType } from "@/interface";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  });
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async (signal?: AbortSignal) => {
    setError(null);

    try {
      const { status } = await isMe();

      if (signal?.aborted) return;

      setAuthenticated(status === 200);

      if (status === 401) {
        deleteDataFromLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error: any) {
      if (signal?.aborted) return;

      if (error.response?.status === 401) {
        deleteDataFromLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
        setAuthenticated(false);
      } else if (!navigator.onLine) {
        setError("You're offline. Some features may be limited.");
        // Keep user logged in if they have a token
        const hasToken = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        setAuthenticated(hasToken);
      } else {
        setError("Unable to verify authentication");
        // Keep user logged in if they have a token
        const hasToken = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        setAuthenticated(hasToken);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(() => {
    deleteDataFromLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
    // Refresh token not used in current implementation but good to clear if added
    // deleteDataFromLocalStorage(STORAGE_KEYS.REFRESH_TOKEN);
    deleteDataFromLocalStorage(STORAGE_KEYS.USER_NAME);
    deleteDataFromLocalStorage(STORAGE_KEYS.USER_EMAIL);
    deleteDataFromLocalStorage(STORAGE_KEYS.COORDS);
    deleteDataFromLocalStorage(STORAGE_KEYS.WEATHER_INFO);

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

    // Re-check every 5 minutes
    const interval = setInterval(
      () => {
        if (!cancelled) checkAuth();
      },
      5 * 60 * 1000,
    );

    // Re-check when user returns to tab
    const handleFocus = () => {
      if (!cancelled) checkAuth();
    };

    // Re-check when back online
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
