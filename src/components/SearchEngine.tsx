import {
  useEffect,
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Search } from "lucide-react";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";

interface Engine {
  name: string;
  src: string;
  query: string;
}

const ENGINES: readonly Engine[] = [
  {
    name: "Google",
    src: "/icons/google.svg",
    query: "https://www.google.com/search?q=",
  },
  {
    name: "Bing",
    src: "/icons/bing.svg",
    query: "https://www.bing.com/search?q=",
  },
  {
    name: "Duck Duck Go",
    src: "/icons/duckduckgo.png",
    query: "https://duckduckgo.com/?q=",
  },
  {
    name: "Yahoo",
    src: "/icons/yahoo.svg",
    query: "https://search.yahoo.com/search?p=",
  },
] as const;

const DEFAULT_ENGINE = "Google";

export default function SearchEngine() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentEngine, setCurrentEngine] = useState<number>(() => {
    const storedEngine = getDataFromLocalStorage("preferredSearchEngine");
    const engineName =
      typeof storedEngine === "string" ? storedEngine : DEFAULT_ENGINE;
    const index = ENGINES.findIndex((engine) => engine.name === engineName);
    return index !== -1 ? index : 0; // Default to first engine (Google)
  });

  const [searchText, setSearchText] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleIconClick = (): void => {
    setCurrentEngine((prev) => (prev + 1) % ENGINES.length);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    const sanitizedSearch = searchText.trim().replace(/\s+/g, " ");

    if (e.key === "Enter" && sanitizedSearch) {
      setIsSearching(true);
      const searchURL =
        ENGINES[currentEngine].query + encodeURIComponent(sanitizedSearch);
      window.open(searchURL, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        setSearchText("");
        setIsSearching(false);
      }, 150);
    } else if (e.key === "Escape") {
      setSearchText("");
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  // Save engine preference
  useEffect(() => {
    setDataToLocalStorage("preferredSearchEngine", ENGINES[currentEngine].name);
  }, [currentEngine]);

  // Global "/" shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyPress = (e: globalThis.KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyPress);
    return () => window.removeEventListener("keydown", handleGlobalKeyPress);
  }, []);

  return (
    <div className="w-full bg-black/30 flex items-center rounded-full p-2.5 px-5 gap-3">
      <Search className="shrink-0 text-white/70" size={20} />

      <input
        ref={inputRef}
        type="text"
        className={`w-full outline-none bg-transparent placeholder:text-white/50 transition-opacity ${
          isSearching ? "opacity-50" : ""
        }`}
        placeholder={`Search ${ENGINES[currentEngine].name}... (Press / to focus)`}
        value={searchText}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        disabled={isSearching}
        aria-label={`Search with ${ENGINES[currentEngine].name}`}
      />

      <button
        type="button"
        onClick={handleIconClick}
        className="relative group flex items-center justify-center h-8 w-8 shrink-0 rounded hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label={`Switch search engine (current: ${ENGINES[currentEngine].name})`}
        title="Click to switch search engine"
      >
        <img
          src={ENGINES[currentEngine].src}
          className="h-6 w-6 object-contain transition-transform group-hover:scale-110"
          alt=""
          aria-hidden="true"
        />

        {/* Tooltip */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {ENGINES[currentEngine].name}
        </span>
      </button>
    </div>
  );
}
