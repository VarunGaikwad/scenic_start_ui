import { getBackgroundImage } from "@/api";
import { useEffect, useState } from "react";

type ImageResponseType = {
  id: string;
  image_url: string;
  is_welcome: boolean;
  overlay_color: string;
  overlay_opacity: number;
  text_color: "light" | "dark";
};

type CachedImage = ImageResponseType & {
  date: string;
};

const CACHE_KEY = "dailyBackground";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => resolve(); // fail open
  });
}

export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  const [imageObject, setImageObject] = useState<ImageResponseType | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function loadDailyBackground() {
      const today = getToday();
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        const parsed: CachedImage = JSON.parse(cached);

        if (parsed.date === today && parsed.image_url) {
          await preloadImage(parsed.image_url);
          if (!cancelled) setImageObject(parsed);
          return;
        }
      }

      const { data } = await getBackgroundImage();

      await preloadImage(data.image_url);

      const payload: CachedImage = { ...data, date: today };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));

      if (!cancelled) setImageObject(data);
    }

    loadDailyBackground().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!imageObject) {
    return (
      <div className="flex h-svh items-center justify-center">{children}</div>
    );
  }

  const { image_url, overlay_color, overlay_opacity, text_color } = imageObject;

  return (
    <div className="relative h-svh w-screen">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${image_url})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlay_color,
          opacity: overlay_opacity,
        }}
      />
      <div
        className="relative z-10 flex h-svh"
        style={{ color: text_color === "light" ? "#fff" : "#000" }}
      >
        {children}
      </div>
    </div>
  );
}
