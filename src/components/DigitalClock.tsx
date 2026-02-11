import { STORAGE_KEYS } from "@/constants";
import { useEffect, useState, useMemo } from "react";

const GREETING_TIMES = {
  MORNING: { start: 5, end: 12 },
  AFTERNOON: { start: 12, end: 17 },
  EVENING: { start: 17, end: 21 },
} as const;

function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (
    hour >= GREETING_TIMES.MORNING.start &&
    hour < GREETING_TIMES.MORNING.end
  ) {
    return "Good Morning";
  }
  if (
    hour >= GREETING_TIMES.AFTERNOON.start &&
    hour < GREETING_TIMES.AFTERNOON.end
  ) {
    return "Good Afternoon";
  }
  if (
    hour >= GREETING_TIMES.EVENING.start &&
    hour < GREETING_TIMES.EVENING.end
  ) {
    return "Good Evening";
  }
  return "Good Night";
}

export default function DigitalClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [userName, setUserName] = useState<string>("Guest");

  // Initialize clock
  useEffect(() => {
    const currentTime = new Date();
    setNow(currentTime);

    const msToNextMinute =
      (60 - currentTime.getSeconds()) * 1000 - currentTime.getMilliseconds();

    let interval: ReturnType<typeof setInterval> | null = null;

    const timeout = setTimeout(() => {
      setNow(new Date());

      interval = setInterval(() => {
        setNow(new Date());
      }, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Load and sync user name
  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (storedName) setUserName(storedName);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "name") {
        setUserName(e.newValue || "Guest");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const greeting = useMemo(() => (now ? getGreeting(now) : ""), [now]);

  if (!now) {
    // Loading skeleton
    return (
      <div className="flex flex-col gap-1 w-48 animate-pulse">
        <div className="h-10 w-32 bg-white/10 rounded" />
        <div className="h-6 w-24 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col drop-shadow-lg text-white">
      <time
        className="text-6xl md:text-7xl font-bold tracking-tight leading-none"
        dateTime={now.toISOString()}
        style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
      >
        {now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })}
      </time>
      <div
        className="text-lg md:text-xl font-medium opacity-90 tracking-wide mt-1"
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
      >
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
      <div className="text-sm font-medium text-white/80 mt-2 uppercase tracking-widest">
        {greeting}, {userName}
      </div>
    </div>
  );
}
