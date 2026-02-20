import {
  Background,
  Dashboard,
  DigitalClock,
  Quote,
  SearchEngine,
  Weather,
  CalendarWidget,
} from "@/components";

export default function ScenicApp() {
  return (
    <div className="relative h-screen w-full overflow-hidden text-xs select-none font-inter text-white">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <Background />
      </div>

      {/* Floating Header Components */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <div className="pointer-events-auto hover:scale-105 transition-transform duration-300">
          <DigitalClock />
        </div>
        <div className="pointer-events-auto hover:scale-105 transition-transform duration-300">
          <Quote />
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      {/* z-10 ensures it's above background but below z-50 header/footer */}
      {/* py-32 ensures content starts below header and ends above footer */}
      {/* Main Content Area - Scrollable */}
      {/* z-10 ensures it's above background but below z-50 header/footer */}
      {/* pb-48 ensures content ends well above the bottom fixed search bar */}
      <main className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide pt-60 md:pt-48 lg:pt-32 xl:pt-28 pb-48 px-4 md:px-12 flex flex-col items-center min-h-screen">
        <div className="w-full max-w-7xl flex flex-col items-center gap-12 flex-1 justify-center">
          {/* Dashboard Grid */}
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <Dashboard />
          </div>
        </div>
      </main>

      {/* Fixed Bottom Search Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 pointer-events-auto transform hover:scale-[1.01] transition-transform duration-500">
        <SearchEngine />
      </div>

      {/* Floating Footer Components */}
      <footer className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end z-50 pointer-events-none gap-8">
        <div className="pointer-events-auto hover:scale-105 transition-transform duration-300">
          <Weather />
        </div>
        <div className="pointer-events-auto hover:scale-105 transition-transform duration-300 hidden md:block">
          <CalendarWidget />
        </div>
      </footer>
    </div>
  );
}
