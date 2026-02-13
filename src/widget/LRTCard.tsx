"use client";

import { useEffect, useMemo, useState } from "react";
import { TrainFront, ArrowRight, Clock } from "lucide-react";
import { STORAGE_KEYS } from "@/constants";

type Trip = {
  departure: string;
  arrival: string;
};

type Route = {
  from: string;
  to: string;
  trips: Trip[];
};

const WALK_BUFFER = 15; // minutes to reach station

type Props = {
  variant?: "default" | "minimal";
};

export default function LRTCard({ variant = "default" }: Props) {
  const [source, setSource] = useState<"kashi" | "mine">(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LRT_SOURCE);
    if (stored === "kashi" || stored === "mine") return stored;
    return "kashi";
  });
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<{ routes: Route[] } | null>(null);

  useEffect(() => {
    fetch("/lrt/lrt.json")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const currentMinutes = useMemo(
    () => now.getHours() * 60 + now.getMinutes(),
    [now],
  );

  const selectedRoute = useMemo(() => {
    if (!data) return undefined;
    if (source === "kashi")
      return data.routes.find((r) => r.from === "かしの森公園前");
    return data.routes.find((r) => r.from === "峰");
  }, [data, source]);

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const catchableTrips = useMemo(() => {
    if (!selectedRoute) return [];

    const arrivalAtStationMinutes = currentMinutes + WALK_BUFFER;
    const trips = selectedRoute.trips.filter(
      (trip) => toMinutes(trip.departure) >= arrivalAtStationMinutes,
    );

    if (trips.length === 0) return selectedRoute.trips.slice(0, 3);
    return trips.slice(0, 3);
  }, [selectedRoute, currentMinutes]);

  const tripsWithLeaveTime = useMemo(() => {
    return catchableTrips.map((trip) => {
      const departureMinutes = toMinutes(trip.departure);
      const leaveIn = departureMinutes - WALK_BUFFER - currentMinutes;
      return { ...trip, leaveIn };
    });
  }, [catchableTrips, currentMinutes]);

  const toggleSource = () => {
    const next = source === "kashi" ? "mine" : "kashi";
    setSource(next);
    localStorage.setItem(STORAGE_KEYS.LRT_SOURCE, next);
  };

  if (!data) {
    return (
      <div
        className={`w-full rounded-2xl animate-pulse ${
          variant === "default"
            ? "p-5 bg-white/[0.04] border border-white/[0.06]"
            : ""
        }`}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-5 h-5 rounded bg-white/10" />
          <div className="h-4 w-28 rounded bg-white/10" />
        </div>
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-white/[0.04]" />
          <div className="h-14 rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full select-none ${
        variant === "default"
          ? "rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300 shadow-lg overflow-hidden"
          : ""
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <TrainFront className="w-4.5 h-4.5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white/90 tracking-tight">
            Next Train
          </h2>
        </div>
        <span className="text-[10px] text-white/30 font-medium">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Station toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={toggleSource}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.05] transition-all duration-200 group"
        >
          <span className="text-xs font-medium text-white/70">
            {selectedRoute?.from}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
          <span className="text-xs font-medium text-white/70">
            {selectedRoute?.to}
          </span>
        </button>
      </div>

      {/* Trips list */}
      <div className="px-4 pb-4 space-y-2">
        {tripsWithLeaveTime.length > 0 ? (
          tripsWithLeaveTime.map((trip, idx) => {
            const isUrgent = trip.leaveIn <= 0;
            const isSoon = trip.leaveIn > 0 && trip.leaveIn <= 10;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                  idx === 0
                    ? isUrgent
                      ? "bg-red-500/10 border-red-500/20"
                      : isSoon
                        ? "bg-amber-500/10 border-amber-500/15"
                        : "bg-blue-500/10 border-blue-500/15"
                    : "bg-white/[0.02] border-white/[0.04]"
                }`}
              >
                {/* Times */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      idx === 0 ? "text-white" : "text-white/60"
                    }`}
                  >
                    {trip.departure}
                  </span>
                  <ArrowRight
                    className={`w-3 h-3 ${
                      idx === 0 ? "text-white/40" : "text-white/20"
                    }`}
                  />
                  <span
                    className={`text-sm tabular-nums ${
                      idx === 0 ? "text-white/80" : "text-white/40"
                    }`}
                  >
                    {trip.arrival}
                  </span>
                </div>

                {/* Leave time badge */}
                <div className="flex items-center gap-1.5">
                  <Clock
                    className={`w-3 h-3 ${
                      isUrgent
                        ? "text-red-400"
                        : isSoon
                          ? "text-amber-400"
                          : "text-white/30"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      isUrgent
                        ? "text-red-400"
                        : isSoon
                          ? "text-amber-400"
                          : "text-white/40"
                    }`}
                  >
                    {trip.leaveIn > 0 ? `${trip.leaveIn}m` : "Now!"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-sm text-white/30">
            No more trains today
          </div>
        )}
      </div>
    </div>
  );
}
