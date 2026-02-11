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

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLastFetchAttempt(): string | null {
  try {
    return getDataFromLocalStorage("last_quote_fetch_attempt");
  } catch {
    return null;
  }
}

function setLastFetchAttempt() {
  setDataToLocalStorage("last_quote_fetch_attempt", getToday());
}

function getStoredContent(
  type: "quotes" | "shayari"
): ShayariQuoteResponse | null {
  try {
    const storageKey = type === "quotes" ? STORAGE_KEYS.QUOTE_DATA : STORAGE_KEYS.SHAYARI_DATA;
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
    return (saved === "quotes" || saved === "shayari") ? saved : "shayari";
  });

  const [content, setContent] = useState<{ text: string; author: string }>({
    text: "",
    author: "",
  });

  const [isFlipping, setIsFlipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Load content based on current type
  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      const today = getToday();
      
      // Check if we have fresh cached data for current type
      const cachedContent = getStoredContent(currentType);
      if (cachedContent && cachedContent.date === today) {
        setContent({ text: cachedContent.text, author: cachedContent.author });
        setIsLoading(false);
        return;
      }

      // Check if we need to fetch fresh data
      const shayariData = getStoredContent("shayari");
      const quotesData = getStoredContent("quotes");
      const lastFetchAttempt = getLastFetchAttempt();
      
      const needsFetch =
        (!shayariData || shayariData.date !== today) &&
        (!quotesData || quotesData.date !== today) &&
        lastFetchAttempt !== today;

      if (!needsFetch) {
        // We have today's data OR we already tried fetching today
        const currentData = getStoredContent(currentType);
        if (currentData) {
          setContent({ text: currentData.text, author: currentData.author });
        } else {
          // We already tried fetching today but got no data
          setContent({
            text: currentType === "quotes" 
              ? "No quote available today. Check back tomorrow!" 
              : "No shayari available today. Check back tomorrow!",
            author: "—",
          });
        }
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      setIsLoading(true);
      setHasError(false);

      try {
        const [shayariRes, quoteRes] = await Promise.all([
          getShayaris(),
          getQuotes(),
        ]);

        if (cancelled) return;

        // Mark that we attempted to fetch today
        setLastFetchAttempt();

        const shayariList = Array.isArray(shayariRes) ? shayariRes : [shayariRes];
        const quoteList = Array.isArray(quoteRes) ? quoteRes : [quoteRes];
        const shayariItem = shayariList.length > 0 ? shayariList[0] : null;
        const quoteItem = quoteList.length > 0 ? quoteList[0] : null;

        // Only save to localStorage if we have valid data
        if (shayariItem && shayariItem.text && shayariItem.author) {
          const shayariPayload: ShayariQuoteResponse = {
            text: shayariItem.text,
            author: shayariItem.author,
            date: today,
          };
          setDataToLocalStorage(STORAGE_KEYS.SHAYARI_DATA, shayariPayload);
        }

        if (quoteItem && quoteItem.text && quoteItem.author) {
          const quotePayload: ShayariQuoteResponse = {
            text: quoteItem.text,
            author: quoteItem.author,
            date: today,
          };
          setDataToLocalStorage(STORAGE_KEYS.QUOTE_DATA, quotePayload);
        }

        // Set the content for current type
        const currentData = getStoredContent(currentType);
        if (currentData) {
          setContent({
            text: currentData.text,
            author: currentData.author,
          });
        } else {
          // No data available, show placeholder but don't save it
          setContent({
            text: currentType === "quotes" 
              ? "No quote available today. Check back tomorrow!" 
              : "No shayari available today. Check back tomorrow!",
            author: "—",
          });
        }
      } catch (error) {
        console.error("Failed to fetch daily content:", error);
        setHasError(true);

        // Fallback to any cached data
        const fallback = currentType === "quotes" 
          ? (quotesData || shayariData)
          : (shayariData || quotesData);
          
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
  }, [currentType]); // Re-run when type changes

  const handleFlip = useCallback(() => {
    if (isFlipping || isLoading) return;

    setIsFlipping(true);

    setTimeout(() => {
      const newType: ContentType = currentType === "quotes" ? "shayari" : "quotes";
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
        <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed font-serif tracking-wide text-center min-h-[3rem] flex items-center justify-center">
          <span className="drop-shadow-sm">"{content.text}"</span>
        </p>

        {/* Author attribution */}
        <div className="mt-4 flex items-center justify-start gap-2">
          <div className="h-px w-6 bg-gradient-to-r from-white/20 to-transparent group-hover:w-12 transition-all duration-300" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest group-hover:text-white/70 transition-colors">
            {content.author}
          </p>
        </div>
      </div>

      {/* Type badge (shows on hover) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <span className="px-3 py-1 bg-gradient-to-r from-black/90 to-black/80 text-[10px] uppercase tracking-widest text-white/70 rounded-full border border-white/20 backdrop-blur-xl shadow-lg">
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
        <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse" title="Using cached content" />
      )}
    </div>
  );
}