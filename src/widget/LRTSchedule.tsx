import { getStations, getSchedule } from "@/api";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrainFront,
  ArrowRight,
  Clock,
  ArrowLeftRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { STORAGE_KEYS } from "@/constants";

const WALK_BUFFER = 15;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return Infinity;
  return h * 60 + m;
};

const todayDate = () => new Date().toISOString().split("T")[0];

const leaveByTime = (departure: string) => {
  const [h, m] = departure.split(":").map(Number);
  const totalMinutes = h * 60 + m - WALK_BUFFER;
  const lh = Math.floor(totalMinutes / 60) % 24;
  const lm = totalMinutes % 60;
  return `${String(lh).padStart(2, "0")}:${String(lm).padStart(2, "0")}`;
};

function StationDropdown({
  value,
  stations,
  onChange,
  align = "left",
}: {
  value: string;
  stations: string[];
  onChange: (v: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/[0.07] transition-all duration-200"
      >
        <span className="text-xs font-semibold text-white/75 truncate">
          {value || "—"}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-white/30 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-52 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/8 shadow-2xl overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="p-1.5 max-h-56 overflow-y-auto scrollbar-none">
            {stations.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                  s === value
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-white/60 hover:bg-white/6 hover:text-white/90"
                }`}
              >
                <span className="text-xs font-medium truncate">{s}</span>
                {s === value && (
                  <Check className="w-3 h-3 text-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LRTSchedule() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stations, setStations] = useState<string[]>([]);
  const [origin, setOrigin] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.LRT_SOURCE) ?? "",
  );
  const [destination, setDestination] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.LRT_DESTINATION) ?? "",
  );
  const [schedule, setSchedule] = useState<Record<string, string[]> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Align to minute boundary, then tick every 60s
  useEffect(() => {
    const tick = () => setNow(new Date());
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;

    const timeout = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    getStations().then((data) => {
      setStations(data);
      if (!localStorage.getItem(STORAGE_KEYS.LRT_SOURCE) && data.length > 0)
        setOrigin(data[0]);
      if (
        !localStorage.getItem(STORAGE_KEYS.LRT_DESTINATION) &&
        data.length > 1
      )
        setDestination(data[1]);
    });
  }, []);

  const handleOriginChange = (v: string) => {
    setOrigin(v);
    localStorage.setItem(STORAGE_KEYS.LRT_SOURCE, v);
  };

  const handleDestinationChange = (v: string) => {
    setDestination(v);
    localStorage.setItem(STORAGE_KEYS.LRT_DESTINATION, v);
  };

  const swapStations = () => {
    handleOriginChange(destination);
    handleDestinationChange(origin);
  };

  useEffect(() => {
    if (!origin || !destination || origin === destination) return;
    setLoading(true);
    setSchedule(null);
    getSchedule({ origin, destination, date: todayDate() })
      .then(setSchedule)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [origin, destination]);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const upcomingTrips = useMemo(() => {
    if (!schedule) return [];
    const keys = Object.keys(schedule);
    if (keys.length < 2) return [];

    const originTimes = schedule[keys[0]];
    const destTimes = schedule[keys[keys.length - 1]];
    if (!originTimes || !destTimes) return [];

    const arrivalAtStation = currentMinutes + WALK_BUFFER;
    const valid: { departure: string; arrival: string; leaveIn: number }[] = [];

    for (let i = 0; i < originTimes.length; i++) {
      const dep = originTimes[i];
      const arr = destTimes[i];
      if (dep === "…" || arr === "…") continue;
      if (toMinutes(dep) >= arrivalAtStation) {
        valid.push({
          departure: dep,
          arrival: arr,
          leaveIn: toMinutes(dep) - WALK_BUFFER - currentMinutes,
        });
      }
      if (valid.length === 3) break;
    }
    return valid;
  }, [schedule, currentMinutes]);

  const nextTrain = upcomingTrips[0];
  const isUrgent = nextTrain && nextTrain.leaveIn <= 0;
  const isSoon = nextTrain && nextTrain.leaveIn > 0 && nextTrain.leaveIn <= 10;

  return (
    <div className="w-full rounded-2xl bg-white/3 backdrop-blur-xl border border-white/6 shadow-xl overflow-visible select-none">
      {/* Route selector */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <TrainFront className="w-4 h-4 text-blue-400 shrink-0" />
        <StationDropdown
          value={origin}
          stations={stations}
          onChange={handleOriginChange}
          align="left"
        />
        <button
          onClick={swapStations}
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
        </button>
        <StationDropdown
          value={destination}
          stations={stations}
          onChange={handleDestinationChange}
          align="right"
        />
      </div>

      <div className="h-px bg-white/5 mx-4" />

      {/* Body */}
      <div className="px-4 py-4 space-y-2.5">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[108, 56, 56].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="rounded-2xl bg-white/4"
              />
            ))}
          </div>
        ) : origin === destination ? (
          <p className="text-center py-6 text-sm text-white/25">
            Select different stations
          </p>
        ) : upcomingTrips.length === 0 ? (
          <p className="text-center py-6 text-sm text-white/25">
            No more trains today
          </p>
        ) : (
          <>
            {/* Hero — next train */}
            {nextTrain && (
              <div
                className={`relative rounded-2xl px-5 py-4 border transition-all duration-500 ${
                  isUrgent
                    ? "bg-red-500/10 border-red-500/20"
                    : isSoon
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-blue-500/8 border-blue-500/15"
                }`}
              >
                {/* Status row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                      isUrgent
                        ? "text-red-400"
                        : isSoon
                          ? "text-amber-400"
                          : "text-blue-400"
                    }`}
                  >
                    {isUrgent
                      ? "Leave now!"
                      : isSoon
                        ? "Leave soon"
                        : "Next train"}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                      isUrgent
                        ? "bg-red-500/20 text-red-300"
                        : isSoon
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-blue-500/15 text-blue-300"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {nextTrain.leaveIn > 0
                      ? `${nextTrain.leaveIn} min`
                      : "Now!"}
                  </div>
                </div>

                {/* Leave by banner */}
                <div
                  className={`flex items-center justify-center gap-2 mb-3 py-2 rounded-xl ${
                    isUrgent
                      ? "bg-red-500/10"
                      : isSoon
                        ? "bg-amber-500/8"
                        : "bg-white/4"
                  }`}
                >
                  <span className="text-[10px] text-white/35 uppercase tracking-wider">
                    Leave by
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      isUrgent
                        ? "text-red-300"
                        : isSoon
                          ? "text-amber-300"
                          : "text-white/80"
                    }`}
                  >
                    {leaveByTime(nextTrain.departure)}
                  </span>
                </div>

                {/* Departure → Arrival */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-white leading-none">
                      {nextTrain.departure}
                    </p>
                    <p className="text-[10px] text-white/35 mt-1">Departs</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-px bg-white/10" />
                    <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-white leading-none">
                      {nextTrain.arrival}
                    </p>
                    <p className="text-[10px] text-white/35 mt-1">Arrives</p>
                  </div>
                </div>
              </div>
            )}

            {/* Later trains */}
            {upcomingTrips.slice(1).map((trip, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/2 border border-white/4 hover:bg-white/4 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold tabular-nums text-white/50">
                    {trip.departure}
                  </span>
                  <ArrowRight className="w-3 h-3 text-white/15" />
                  <span className="text-sm tabular-nums text-white/35">
                    {trip.arrival}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 tabular-nums">
                    leave {leaveByTime(trip.departure)}
                  </span>
                  <span className="text-xs tabular-nums text-white/25">
                    in {trip.leaveIn}m
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className="text-[10px] text-white/20">
          {WALK_BUFFER} min walk included
        </span>
        <span className="text-[10px] text-white/20 tabular-nums">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
