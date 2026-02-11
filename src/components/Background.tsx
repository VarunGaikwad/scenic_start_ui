import { getBackgroundImage } from "@/api";
import type { CachedImage, ImageResponseType } from "@/interface";
import { useEffect, useState } from "react";

const CACHE_KEY = "app:dailyBackground:v1";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function preloadMedia(src: string, type: "image" | "video"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) return resolve();

    if (type === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
      video.src = src;
    } else {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    }
  });
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const FALLBACK_BACKGROUND: ImageResponseType = {
  id: "fallback",
  image_url: "",
  is_welcome: false,
  media_type: "image",
  overlay_color: "#1a1a1a",
  overlay_opacity: 1,
  text_color: "light",
};

export default function Background({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [imageObject, setImageObject] = useState<ImageResponseType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function loadDailyBackground() {
      const today = getToday();

      // Try cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedImage = JSON.parse(cached);

          if (parsed.date === today && parsed.image_url) {
            // Show cached immediately
            if (!cancelled) setImageObject(parsed);

            // Preload in background
            preloadMedia(parsed.image_url, parsed.media_type)
              .catch(console.warn)
              .finally(() => {
                if (!cancelled) setIsLoading(false);
              });
            return;
          }
        }
      } catch (error) {
        console.warn("Cache corrupted, clearing:", error);
        localStorage.removeItem(CACHE_KEY);
      }

      // Fetch new background
      try {
        const data = await getBackgroundImage();

        // Preload before showing
        await preloadMedia(data.image_url, data.media_type);

        const payload: CachedImage = { ...data, date: today };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));

        if (!cancelled) {
          setImageObject(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load background:", error);

        // Fallback to old cache if available
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsed: CachedImage = JSON.parse(cached);
            if (!cancelled) setImageObject(parsed);
          } else {
            if (!cancelled) setImageObject(FALLBACK_BACKGROUND);
          }
        } catch {
          if (!cancelled) setImageObject(FALLBACK_BACKGROUND);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }
    }

    loadDailyBackground();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!imageObject) {
    return (
      <div className="flex h-svh items-center justify-center bg-gray-900">
        {isLoading ? <div className="text-white/50">Loading...</div> : children}
      </div>
    );
  }

  const { image_url, overlay_color, overlay_opacity, text_color, media_type } =
    imageObject;

  return (
    <div className="relative h-svh w-screen overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0">
        {media_type === "video" ? (
          <video
            src={image_url}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-label="Daily background video"
          />
        ) : (
          <img src={image_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: hexToRgba(overlay_color, overlay_opacity),
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex h-svh"
        style={{ color: text_color === "light" ? "#ffffff" : "#000000" }}
      >
        {children}
      </div>
    </div>
  );
}
