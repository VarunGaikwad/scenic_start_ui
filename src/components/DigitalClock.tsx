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
    const storedName = localStorage.getItem("name");
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
      <div className="flex justify-between animate-pulse">
        <div className="space-y-2.5">
          <div className="h-12 w-32 bg-gray-700 rounded" />
          <div className="h-6 w-48 bg-gray-700 rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-6 w-24 bg-gray-700 rounded ml-auto" />
          <div className="h-5 w-32 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      <div className="space-y-2.5">
        <time
          className="text-5xl font-extrabold tracking-widest block"
          dateTime={now.toISOString()}
        >
          {now.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })}
        </time>

        <div className="text-xl">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-extrabold">{userName}</div>
        <div className="font-semibold">{greeting}</div>
      </div>
    </div>
  );
}
