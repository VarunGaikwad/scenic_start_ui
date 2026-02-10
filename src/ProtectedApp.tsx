import { useState, useEffect, useCallback } from "react";
import { ScenicApp, KnowYourClient } from "@/pages";
import { isMe } from "@/api";
import { Background } from "./components";
import { deleteDataFromLocalStorage, getDataFromLocalStorage } from "./utils";

const TOKEN = "app:authToken:v1";

export default function ProtectedApp() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(() => {
    return !!getDataFromLocalStorage(TOKEN);
  });
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setError(null);
    try {
      const { status } = await isMe();
      if (status === 200) {
        setAuthenticated(true);
      } else if (status === 401) {
        deleteDataFromLocalStorage(TOKEN);
        setAuthenticated(false);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        deleteDataFromLocalStorage(TOKEN);
        setAuthenticated(false);
      } else if (!navigator.onLine) {
        setError("You're offline. Some features may be limited.");
        const hasToken = !!localStorage.getItem(TOKEN);
        setAuthenticated(hasToken);
      } else {
        setError("Unable to verify authentication.");
        const hasToken = !!localStorage.getItem(TOKEN);
        setAuthenticated(hasToken);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (!cancelled) await checkAuth();
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

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAuth]);

  return (
    <Background>
      {loading ? (
        // ✅ Proper loading state - no protected content shown
        <div className="flex items-center justify-center h-screen w-screen">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <div className="text-white/70">Verifying authentication...</div>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
              <span>{error}</span>
              <button
                onClick={checkAuth}
                className="underline hover:no-underline text-sm"
              >
                Retry
              </button>
            </div>
          )}
          {authenticated ? <ScenicApp /> : <KnowYourClient />}
        </>
      )}
    </Background>
  );
}
