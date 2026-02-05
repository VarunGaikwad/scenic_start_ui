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

  return (
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
  );
}
