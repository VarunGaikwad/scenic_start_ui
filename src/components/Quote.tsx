import { getQuotes, getShayaris } from "@/api";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { useEffect, useState, useCallback } from "react";

type ShayariQuoteResponseType = "quotes" | "shayari";

type ShayariQuoteResponse = {
  text: string;
  author: string;
  date: string;
};

const STORAGE_KEYS = {
  PREFERENCE: "preferredQuoteOrShayari",
  SHAYARI: "shayari",
  QUOTES: "quotes",
} as const;

const FLIP_DURATION_MS = 600;
const FLIP_HALFWAY_MS = FLIP_DURATION_MS / 2;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStoredContent(
  type: ShayariQuoteResponseType,
): ShayariQuoteResponse | null {
  try {
    const raw = getDataFromLocalStorage(type);
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
  const [currentType, setCurrentType] = useState<ShayariQuoteResponseType>(
    () => {
      return getDataFromLocalStorage(STORAGE_KEYS.PREFERENCE) || "shayari";
    },
  );

  const [content, setContent] = useState<{ text: string; author: string }>(
    () => {
      const localData = getStoredContent(currentType);
      return {
        text: localData?.text || "",
        author: localData?.author || "",
      };
    },
  );

  const [isFlipping, setIsFlipping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDailyContent() {
      const today = getToday();

      const shayariData = getStoredContent("shayari");
      const quotesData = getStoredContent("quotes");

      const needsFetch =
        !shayariData ||
        shayariData.date !== today ||
        !quotesData ||
        quotesData.date !== today;

      if (!needsFetch) {
        const currentData = getStoredContent(currentType);
        if (currentData) {
          setContent({ text: currentData.text, author: currentData.author });
        }
        return;
      }

      setIsLoading(true);

      try {
        const [shayariRes, quoteRes] = await Promise.all([
          getShayaris(),
          getQuotes(),
        ]);

        if (cancelled) return;

        const shayariPayload = { ...shayariRes.data, date: today };
        const quotePayload = { ...quoteRes.data, date: today };

        setDataToLocalStorage(STORAGE_KEYS.SHAYARI, shayariPayload);
        setDataToLocalStorage(STORAGE_KEYS.QUOTES, quotePayload);

        const selected =
          currentType === "quotes" ? quotePayload : shayariPayload;
        setContent({ text: selected.text, author: selected.author });
      } catch (error) {
        console.error("Failed to fetch daily content:", error);

        // Fallback to cached data even if old
        const fallback = shayariData || quotesData;
        if (fallback) {
          setContent({ text: fallback.text, author: fallback.author });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDailyContent();

    return () => {
      cancelled = true;
    };
  }, []); // Only run once on mount

  const handleFlip = useCallback(() => {
    if (isFlipping) return;

    setIsFlipping(true);

    setTimeout(() => {
      const newType: ShayariQuoteResponseType =
        currentType === "quotes" ? "shayari" : "quotes";
      setCurrentType(newType);
      setDataToLocalStorage(STORAGE_KEYS.PREFERENCE, newType);

      const newData = getStoredContent(newType);
      if (newData) {
        setContent({ text: newData.text, author: newData.author });
      }
    }, FLIP_HALFWAY_MS);

    setTimeout(() => {
      setIsFlipping(false);
    }, FLIP_DURATION_MS);
  }, [currentType, isFlipping]);

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-black/30">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/20 rounded w-20" />
          <div className="h-4 bg-white/20 rounded w-full" />
          <div className="h-4 bg-white/20 rounded w-3/4 ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleFlip}
      disabled={isFlipping}
      className="w-full text-left"
      style={{ perspective: "1000px" }}
      aria-label={`Switch to ${currentType === "quotes" ? "shayari" : "quotes"}`}
    >
      <div
        className="relative p-5 rounded-2xl bg-black/30 font-hindi cursor-pointer transition-transform duration-600 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <blockquote style={{ backfaceVisibility: "hidden" }}>
          <header className="capitalize mb-2.5 font-semibold text-sm opacity-75">
            {currentType}
          </header>
          <q className="block mb-2.5 text-center leading-relaxed">
            {content.text}
          </q>
          <footer className="text-right font-semibold text-sm">
            — {content.author}
          </footer>
        </blockquote>
      </div>
    </button>
  );
}
