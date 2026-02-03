import { useState, useEffect } from "react";
import { ScenicApp, KnowYourClient } from "@/pages";
import { isMe } from "@/api";
import { Background } from "./components";

export default function ProtectedApp() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { status } = await isMe();
        setAuthenticated(status === 200);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <Background>Checking authentication…</Background>;
  }

  return (
    <Background>
      {authenticated ? <ScenicApp /> : <KnowYourClient />}
    </Background>
  );
}
