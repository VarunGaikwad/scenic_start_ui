import {
  Background,
  Bookmarks,
  DigitalClock,
  Quote,
  SearchEngine,
  Weather,
  CalendarWidget,
} from "@/components";

export default function ScenicApp() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-inter overflow-hidden text-xs relative select-none">
      <div className="absolute inset-0 z-0">
        <Background />
      </div>

      {/* Header Elements */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <DigitalClock />
        </div>
        <div className="pointer-events-auto">
          <Weather />
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="absolute inset-0 flex flex-col items-center justify-start p-6 z-10 overflow-y-auto scrollbar-hide pt-24 pb-48">
        <div className="w-full max-w-5xl flex flex-col items-center gap-16">
          <div className="w-full max-w-2xl transform hover:scale-[1.01] transition-transform duration-500 z-50 sticky top-4">
            <SearchEngine />
          </div>

          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 z-0">
            <Bookmarks />
          </div>
        </div>
      </main>

      {/* Footer Elements */}
      <footer className="absolute bottom-0 left-0 w-full p-6 z-20 pointer-events-none">
        {/* Quote Widget - Bottom Left */}
        <div className="absolute bottom-6 left-6 pointer-events-auto">
          <Quote />
        </div>

        {/* Calendar Widget - Bottom Right */}
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <CalendarWidget />
        </div>
      </footer>
    </div>
  );
}
