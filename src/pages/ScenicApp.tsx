import {
  Bookmarks,
  DigitalClock,
  Quote,
  SearchEngine,
  Weather,
} from "@/components";

export default function ScenicApp() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-inter overflow-hidden text-xs">
      <aside className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 gap-5 p-6">
        <DigitalClock />
        <Weather />
        <Quote />
      </aside>
      <main className="flex-1 flex flex-col gap-5 p-6 lg:p-8 overflow-y-auto">
        <SearchEngine />
        <Bookmarks />
      </main>
    </div>
  );
}
