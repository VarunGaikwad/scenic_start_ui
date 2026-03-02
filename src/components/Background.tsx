import { getBackgroundImage } from "@/api";
import type { ImageResponseType } from "@/interface";
import { useEffect, useRef, useState } from "react";

const SLIDESHOW_INTERVAL = 5 * 60_000; // 5 minutes

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
  image_url: "/image.png",
  is_welcome: false,
  media_type: "image",
  overlay_color: "#111827",
  overlay_opacity: 0.5,
  text_color: "light",
};

export default function Background({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [imageObject, setImageObject] = useState<ImageResponseType | null>(
    FALLBACK_BACKGROUND,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const cancelledRef = useRef(false);
  const isFetchingRef = useRef(false);

  async function fetchAndSetBackground() {
    if (isFetchingRef.current || cancelledRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const data = await getBackgroundImage();
      await preloadMedia(data.image_url, data.media_type);

      if (cancelledRef.current) return;

      // Trigger fade-out, swap, then fade-in
      setIsFading(true);
      setTimeout(() => {
        if (cancelledRef.current) return;
        setImageObject(data);
        setIsFading(false);
      }, 500); // match CSS transition duration
    } catch (error) {
      console.error("Failed to load background:", error);
      if (!cancelledRef.current) {
        setImageObject(FALLBACK_BACKGROUND);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    cancelledRef.current = false;

    // Initial load
    fetchAndSetBackground();

    // Rotate every 30 seconds
    const interval = setInterval(() => {
      fetchAndSetBackground();
    }, SLIDESHOW_INTERVAL);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  const { image_url, overlay_color, overlay_opacity, text_color, media_type } =
    imageObject!;

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-gray-900">
      {/* Background Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isFading ? 0 : 1 }}
      >
        {media_type === "video" ? (
          <video
            src={image_url}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-label="Background video"
          />
        ) : (
          <img src={image_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundColor: hexToRgba(overlay_color, overlay_opacity),
          opacity: isFading ? 0 : 1,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex h-svh w-full"
        style={{ color: text_color === "light" ? "#ffffff" : "#000000" }}
      >
        {children}
        {isLoading && (
          <div className="absolute bottom-4 right-4 text-white/20 text-xs pointer-events-none">
            Updating background...
          </div>
        )}
      </div>
    </div>
  );
}
