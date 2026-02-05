import {
  Bookmarks,
  DigitalClock,
  Quote,
  SearchEngine,
  Weather,
} from "@/components";

export default function ScenicApp() {
  return (
    <div className="px-10 py-5 h-svh w-screen flex flex-col md:flex-row font-normal">
      <div className="w-1/3 space-y-5 px-3.5">
        <DigitalClock />
        <Weather />
        <Quote />
      </div>
      <div className="flex-1 flex flex-col space-y-5 px-3.5">
        <SearchEngine />
        <Bookmarks />
      </div>
    </div>
  );
}
