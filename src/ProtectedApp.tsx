import { useState, useEffect, useCallback } from "react";
import { ScenicApp, KnowYourClient } from "@/pages";
import { isMe } from "@/api";
import { Background } from "@/components";

export default function ProtectedApp() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setError(null);

    try {
      const response = await isMe();
      if (response.status === "active") {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setAuthenticated(false);
      } else if (!navigator.onLine) {
        setError("You're offline. Authentication cannot be verified.");
      } else {
        setError("Unable to verify authentication.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (!cancelled) {
        await checkAuth();
      }
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
