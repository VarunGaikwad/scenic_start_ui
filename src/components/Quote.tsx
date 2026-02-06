import { getQuotes, getShayaris } from "@/api";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { useEffect, useState } from "react";

type ShayariQuoteResponseType = "quotes" | "shayari";
const KEY = "preferredQuoteOrShayari";
type ShayariQuoteResponse = {
  text: string;
  author: string;
  date: string;
};

export default function Quote() {
  const [currentType, setCurrentType] = useState<ShayariQuoteResponseType>(
    getDataFromLocalStorage(KEY) || "shayari",
  );

  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const localData = getDataFromLocalStorage<ShayariQuoteResponse | null>(
      currentType,
    );

    if (localData) {
      setText(localData.text);
      setAuthor(localData.author);
    }

    (async () => {
      const today = new Date().toISOString().slice(0, 10);

      if (!localData || localData.date !== today) {
        const [{ data: shayari }, { data: quote }] = await Promise.all([
          getShayaris(),
          getQuotes(),
        ]);

        setDataToLocalStorage("shayari", shayari);
        setDataToLocalStorage("quotes", quote);

        const selected = currentType === "quotes" ? quote : shayari;
        setText(selected.text);
        setAuthor(selected.author);
      }
    })();
  }, [currentType]);

  const handleFlip = () => {
    if (isFlipping) return;

    setIsFlipping(true);

    setTimeout(() => {
      setCurrentType((prev) => {
        const answer = prev === "quotes" ? "shayari" : "quotes";
        setDataToLocalStorage(KEY, answer);

        return answer;
      });
    }, 300);

    setTimeout(() => {
      setIsFlipping(false);
    }, 600);
  };

  return (
    <div className="perspective cursor-pointer" onClick={handleFlip}>
      <div
        className={`
          relative p-5 rounded-4xl bg-black/15 text-sm font-hindi
          transition-transform duration-600 ease-in-out
          transform-style-preserve-3d
          ${isFlipping ? "rotate-y-180" : ""}
        `}
      >
        <blockquote className="backface-hidden">
          <header className="capitalize mb-2.5 font-semibold">
            {currentType}
          </header>
          <q className="block mb-2.5 text-center">{text}</q>
          <footer className="text-right font-semibold">— {author}</footer>
        </blockquote>
      </div>
    </div>
  );
}
