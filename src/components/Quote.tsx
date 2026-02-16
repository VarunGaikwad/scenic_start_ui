import { getQuotes, getShayaris } from "@/api";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { useEffect, useState, useCallback } from "react";
import { STORAGE_KEYS, UI_CONSTANTS } from "@/constants";

type ContentType = "quotes" | "shayari";

type ShayariQuoteResponse = {
  text: string;
  author: string;
  date: string;
};

function getStoredContent(
  type: "quotes" | "shayari",
): ShayariQuoteResponse | null {
  try {
    const storageKey =
      type === "quotes" ? STORAGE_KEYS.QUOTE_DATA : STORAGE_KEYS.SHAYARI_DATA;
    const raw = getDataFromLocalStorage(storageKey);
    if (!raw) return null;

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (
      parsed &&
      typeof parsed.text === "string" &&
      typeof parsed.author === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Quote() {
  const [currentType, setCurrentType] = useState<ContentType>(() => {
    const saved = getDataFromLocalStorage(STORAGE_KEYS.QUOTE_PREFERENCE);
    return saved === "quotes" || saved === "shayari" ? saved : "shayari";
  });

  const [content, setContent] = useState<{ text: string; author: string }>({
    text: "",
    author: "",
  });

  const [isFlipping, setIsFlipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [shayariRes, quoteRes] = await Promise.all([
          getShayaris(),
          getQuotes(),
        ]);

        if (cancelled) return;

        const shayariList = Array.isArray(shayariRes)
          ? shayariRes
          : [shayariRes];
        const quoteList = Array.isArray(quoteRes) ? quoteRes : [quoteRes];

        const shayariItem = shayariList[0] ?? null;
        const quoteItem = quoteList[0] ?? null;

        // Save both to localStorage (no date restriction anymore)
        if (shayariItem?.text && shayariItem?.author) {
          setDataToLocalStorage(STORAGE_KEYS.SHAYARI_DATA, shayariItem);
        }

        if (quoteItem?.text && quoteItem?.author) {
          setDataToLocalStorage(STORAGE_KEYS.QUOTE_DATA, quoteItem);
        }

        // Set current type content
        const currentData = currentType === "quotes" ? quoteItem : shayariItem;

        if (
          currentData &&
          typeof currentData.text === "string" &&
          typeof currentData.author === "string"
        ) {
          setContent({
            text: currentData.text,
            author: currentData.author,
          });
        } else {
          setContent({
            text: `No ${currentType} available.`,
            author: "—",
          });
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
        setHasError(true);

        // Fallback to cached content
        const fallback = getStoredContent(currentType);

        if (fallback) {
          setContent({
            text: fallback.text,
            author: fallback.author,
          });
        } else {
          setContent({
            text: "Unable to load content. Please try again later.",
            author: "System",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [currentType]);

  const handleFlip = useCallback(() => {
    if (isFlipping || isLoading) return;

    setIsFlipping(true);

    setTimeout(() => {
      const newType: ContentType =
        currentType === "quotes" ? "shayari" : "quotes";
      setCurrentType(newType);
      setDataToLocalStorage(STORAGE_KEYS.QUOTE_PREFERENCE, newType);
    }, UI_CONSTANTS.FLIP_HALFWAY_MS);

    setTimeout(() => {
      setIsFlipping(false);
    }, UI_CONSTANTS.FLIP_DURATION_MS);
  }, [currentType, isFlipping, isLoading]);

  if (isLoading && !content.text) {
    return (
      <div className="max-w-xl rounded-3xl bg-black/20 backdrop-blur-md border border-white/5 px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-white/10 rounded w-3/4 mx-auto" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-5/6 mx-auto" />
          <div className="flex items-center gap-2 mt-4">
            <div className="h-px w-6 bg-white/10" />
            <div className="h-2 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative max-w-xl rounded-3xl bg-black/20 backdrop-blur-md border border-white/5 hover:border-white/10 px-6 py-5 text-left hover:bg-black/30 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl"
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      aria-label={`${currentType === "quotes" ? "Quote" : "Shayari"}. Click to switch.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      {/* Flip animation container */}
      <div
        className={`transition-all duration-500 transform ${
          isFlipping
            ? "scale-95 opacity-0 blur-sm rotate-y-180"
            : "scale-100 opacity-100 blur-0"
        }`}
      >
        {/* Quote/Shayari text */}
        <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed font-serif tracking-wide text-center min-h-12 flex items-center justify-center">
          <span className="drop-shadow-sm">"{content.text}"</span>
        </p>

        {/* Author attribution */}
        <div className="mt-4 flex items-center justify-start gap-2">
          <div className="h-px w-6 bg-linear-to-r from-white/20 to-transparent group-hover:w-12 transition-all duration-300" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest group-hover:text-white/70 transition-colors">
            {content.author}
          </p>
        </div>
      </div>

      {/* Type badge (shows on hover) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <span className="px-3 py-1 bg-linear-to-r from-black/90 to-black/80 text-[10px] uppercase tracking-widest text-white/70 rounded-full border border-white/20 backdrop-blur-xl shadow-lg">
          {currentType}
        </span>
      </div>

      {/* Click hint (shows on hover) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <span className="px-2 py-1 bg-black/80 text-[9px] uppercase tracking-wider text-white/40 rounded-full border border-white/10 backdrop-blur-xl">
          Click to flip
        </span>
      </div>

      {/* Error indicator */}
      {hasError && (
        <div
          className="absolute top-2 right-2 w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse"
          title="Using cached content"
        />
      )}
    </div>
  );
}
