import {
  useMemo,
  useEffect,
  useState,
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

export default function SearchEngine() {
  // ENGINES is now stable across renders
  const ENGINES: Engine[] = useMemo(
    () => [
      {
        name: "Bing",
        src: "./icons/bing.svg",
        query: "https://www.bing.com/search?q=",
      },
      {
        name: "Google",
        src: "./icons/google.svg",
        query: "https://www.google.com/search?q=",
      },
      {
        name: "Yahoo",
        src: "./icons/yahoo.svg",
        query: "https://search.yahoo.com/search?p=",
      },
      {
        name: "Duck Duck Go",
        src: "./icons/duckduckgo.png",
        query: "https://duckduckgo.com/?q=",
      },
    ],
    [],
  );

  const [currentEngine, setCurrentEngine] = useState<number>(() => {
    const storedEngine = getDataFromLocalStorage(
      "preferredSearchEngine",
    ) as string;
    const index = ENGINES.findIndex(
      (engine) => engine.name === (storedEngine || "Google"),
    );
    return index !== -1 ? index : 1;
  });

  const [searchText, setSearchText] = useState<string>("");

  const handleIconClick = (): void => {
    setCurrentEngine((prev) => (prev + 1) % ENGINES.length);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && searchText.trim() !== "") {
      const searchURL =
        ENGINES[currentEngine].query + encodeURIComponent(searchText);
      window.open(searchURL, "_blank");
      setSearchText("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  useEffect(() => {
    setDataToLocalStorage("preferredSearchEngine", ENGINES[currentEngine].name);
  }, [ENGINES, currentEngine]);

  return (
    <div className="w-full bg-black/15 flex items-center rounded-full p-2.5">
      <Search />
      <input
        type="text"
        className="w-full outline-none pl-2.5 bg-transparent"
        placeholder={`Search ${ENGINES[currentEngine].name}...`}
        value={searchText}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
      />
      <img
        src={ENGINES[currentEngine].src}
        className="cursor-pointer h-8 w-8 object-contain"
        onClick={handleIconClick}
        alt={`Search engine ${ENGINES[currentEngine].name}`}
      />
    </div>
  );
}
