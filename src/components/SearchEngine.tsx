import {
  useEffect,
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Search, ExternalLink } from "lucide-react";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { STORAGE_KEYS } from "@/constants";
import type { BookmarkTreeType } from "@/interface";

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
    const storedEngine = getDataFromLocalStorage(STORAGE_KEYS.SEARCH_ENGINE);
    const engineName =
      typeof storedEngine === "string" ? storedEngine : DEFAULT_ENGINE;
    const index = ENGINES.findIndex((engine) => engine.name === engineName);
    return index !== -1 ? index : 0; // Default to first engine (Google)
  });

  const [searchText, setSearchText] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [allBookmarks, setAllBookmarks] = useState<BookmarkTreeType[]>([]);
  const [suggestions, setSuggestions] = useState<BookmarkTreeType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Load and flatten bookmarks
  useEffect(() => {
    const tree = getDataFromLocalStorage(STORAGE_KEYS.BOOKMARK_TREE) as
      | BookmarkTreeType[]
      | null;

    if (tree) {
      const flatten = (nodes: BookmarkTreeType[]): BookmarkTreeType[] => {
        let acc: BookmarkTreeType[] = [];
        for (const node of nodes) {
          if (node.url && node.type !== "folder") {
            acc.push(node);
          }
          if (node.children && node.children.length > 0) {
            acc = acc.concat(flatten(node.children));
          }
        }
        return acc;
      };
      setAllBookmarks(flatten(tree));
    }
  }, []);

  const handleIconClick = (): void => {
    setCurrentEngine((prev) => (prev + 1) % ENGINES.length);
  };

  const openSearch = (query: string) => {
    setIsSearching(true);
    const searchURL = ENGINES[currentEngine].query + encodeURIComponent(query);
    window.open(searchURL, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      setSearchText("");
      setIsSearching(false);
      setSuggestions([]);
    }, 150);
  };

  const openBookmark = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setSearchText("");
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    // Navigation for suggestions
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // If a suggestion is selected, open it
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        openBookmark(suggestions[selectedIndex].url!);
        return;
      }

      const sanitizedSearch = searchText.trim().replace(/\s+/g, " ");
      if (sanitizedSearch) {
        openSearch(sanitizedSearch);
      }
    } else if (e.key === "Escape") {
      setSearchText("");
      setSuggestions([]);
      setSelectedIndex(-1);
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchText(value);
    setSelectedIndex(-1);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = value.toLowerCase();
    const matches = allBookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(lowerQuery) ||
          (b.url && b.url.toLowerCase().includes(lowerQuery)),
      )
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(matches);
  };

  // Save engine preference
  useEffect(() => {
    setDataToLocalStorage(
      STORAGE_KEYS.SEARCH_ENGINE,
      ENGINES[currentEngine].name,
    );
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
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className="w-full bg-black/40 backdrop-blur-md flex items-center rounded-full p-2.5 px-5 gap-3 border border-white/10 shadow-lg focus-within:bg-black/60 focus-within:border-white/20 transition-all">
        <Search className="shrink-0 text-white/50" size={20} />

        <input
          ref={inputRef}
          type="text"
          className={`w-full outline-none bg-transparent placeholder:text-white/30 transition-opacity text-white/90 ${
            isSearching ? "opacity-50" : ""
          }`}
          placeholder={`Search ${ENGINES[currentEngine].name} or bookmarks...`}
          value={searchText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          aria-label={`Search with ${ENGINES[currentEngine].name}`}
        />

        <button
          type="button"
          onClick={handleIconClick}
          className="relative group flex items-center justify-center h-8 w-8 shrink-0 rounded-full hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label={`Switch search engine (current: ${ENGINES[currentEngine].name})`}
          title="Click to switch search engine"
        >
          <img
            src={ENGINES[currentEngine].src}
            className="h-5 w-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-60">
          <div className="px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/5">
            Bookmark Matches
          </div>
          <ul>
            {suggestions.map((bookmark, index) => {
              const hostname = new URL(bookmark.url!).hostname;
              const faviconUrl = `https://scenic-start-node-ten.vercel.app/auth/favorite-icon?domain=${hostname}`;

              return (
                <li key={bookmark._id}>
                  <button
                    onClick={() => openBookmark(bookmark.url!)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-5 h-5 rounded-sm opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {bookmark.title}
                      </div>
                      <div className="text-xs text-white/40 truncate">
                        {bookmark.url}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <ExternalLink size={14} className="text-white/40" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
