import { getQuotes, getShayaris } from "@/api";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";

import { useEffect, useState, useCallback } from "react";
import { STORAGE_KEYS, UI_CONSTANTS } from "@/constants";

type ValueOf<T> = T[keyof T];

type ShayariQuoteResponseType = ValueOf<
  Pick<typeof STORAGE_KEYS, "QUOTE_DATA" | "SHAYARI_DATA">
>;

type ShayariQuoteResponse = {
  text: string;
  author: string;
  date: string;
};

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
      return (
        (getDataFromLocalStorage(
          STORAGE_KEYS.QUOTE_PREFERENCE,
        ) as ShayariQuoteResponseType) || "shayari"
      );
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
      const shayariData = getStoredContent(STORAGE_KEYS.SHAYARI_DATA);
      const quotesData = getStoredContent(STORAGE_KEYS.QUOTE_DATA);
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

        const shayariPayload = { ...shayariRes[0], date: today };
        const quotePayload = { ...quoteRes[0], date: today };

        setDataToLocalStorage(STORAGE_KEYS.SHAYARI_DATA, shayariPayload);
        setDataToLocalStorage(STORAGE_KEYS.QUOTE_DATA, quotePayload);

        const selected =
          currentType === "quotes" ? quotePayload : shayariPayload;
        setContent({
          text: selected?.text || "",
          author: selected?.author || "",
        });
      } catch (error) {
        console.error("Failed to fetch daily content:", error);

        // Fallback to cached data even if old
        const fallback = shayariData || quotesData;
        if (fallback) {
          setContent({
            text: fallback?.text || "",
            author: fallback?.author || "",
          });
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
      setDataToLocalStorage(STORAGE_KEYS.QUOTE_PREFERENCE, newType);

      const newData = getStoredContent(newType);
      if (newData) {
        setContent({ text: newData.text, author: newData.author });
      }
    }, UI_CONSTANTS.FLIP_HALFWAY_MS);

    setTimeout(() => {
      setIsFlipping(false);
    }, UI_CONSTANTS.FLIP_DURATION_MS);
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
    <div
      className="group relative max-w-xl rounded-3xl bg-black/20 backdrop-blur-md border border-white/5 px-6 py-4 text-left hover:bg-black/30 transition-all duration-500 cursor-pointer"
      onClick={handleFlip}
    >
      <div
        className={`transition-all duration-500 transform ${isFlipping ? "scale-95 opacity-50 blur-sm" : "scale-100 opacity-100"}`}
      >
        <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed font-serif tracking-wide drop-shadow-sm text-center">
          "{content.text}"
        </p>
        <div className="mt-2 flex items-center justify-start gap-2">
          <div className="h-px w-6 bg-white/20 group-hover:w-10 transition-all" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest group-hover:text-white/70 transition-colors">
            {content.author}
          </p>
        </div>
      </div>

      {/* Type badge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="px-3 py-1 bg-black/80 text-[10px] uppercase tracking-widest text-white/60 rounded-full border border-white/10 backdrop-blur-xl shadow-xl">
          {currentType}
        </span>
      </div>
    </div>
  );
}
