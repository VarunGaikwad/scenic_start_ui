import { getDataFromLocalStorage } from "@/utils";
import { useEffect, useState } from "react";

export default function DigitalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const now = new Date();
    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setNow(new Date());

      const interval = setInterval(() => {
        setNow(new Date());
      }, 60_000);

      // cleanup interval
      return () => clearInterval(interval);
    }, msToNextMinute);

    return () => clearTimeout(timeout);
  }, []);

  // Determine greeting based on current hour
  const getGreeting = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="flex justify-between">
      <div className="space-y-2.5">
        <div className="text-5xl font-extrabold tracking-widest">
          {now.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })}
        </div>

        <div className="text-xl">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-extrabold">
          {getDataFromLocalStorage("name")}
        </div>
        <div className="font-semibold">{getGreeting(now)}</div>
      </div>
    </div>
  );
}
