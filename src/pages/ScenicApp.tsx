import { FavoriteIcon, SearchBar, Temperature } from "@/components";

export default function ScenicApp() {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr_auto] overflow-hidden">
      <header className="p-5">
        <div
          className="
          grid items-center gap-5
          grid-cols-1 md:grid-cols-3
        "
        >
          <FavoriteIcon />
          <SearchBar />
          <Temperature />
        </div>
      </header>

      <main className="p-5 overflow-auto">2</main>

      <footer className="p-5">3</footer>
    </div>
  );
}
