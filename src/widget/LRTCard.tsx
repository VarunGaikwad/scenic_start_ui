"use client";

import { useEffect, useMemo, useState } from "react";
import { TrainFront, MapPin, ArrowRightLeft, Clock } from "lucide-react";

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

export default function LRTCard() {
  const [source, setSource] = useState<"kashi" | "mine">("kashi");
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

  if (!data) {
    return (
      <div className="p-5 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 animate-pulse w-full max-w-70">
        Loading...
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col gap-5 px-6 py-5 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-black/40 transition-all duration-300 shadow-2xl cursor-pointer select-none w-full max-w-70">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrainFront className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-white drop-shadow-md">
          Next LRT Train
        </h2>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSource("kashi")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition 
            ${source === "kashi" ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          かしの森公園前
        </button>
        <button
          onClick={() => setSource("mine")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition 
            ${source === "mine" ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          峰
        </button>
      </div>

      {/* Route Info */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        <MapPin className="w-4 h-4" />
        <span>{selectedRoute?.from}</span>
        <ArrowRightLeft className="w-4 h-4" />
        <span>{selectedRoute?.to}</span>
      </div>

      {/* Catchable Trains */}
      {tripsWithLeaveTime.length > 0 ? (
        <div className="space-y-4">
          {tripsWithLeaveTime.map((trip, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1"
            >
              <div className="flex justify-between text-white font-medium">
                <span>Departure</span>
                <span>{trip.departure}</span>
              </div>
              <div className="flex justify-between text-white/90 font-medium">
                <span>Arrival</span>
                <span>{trip.arrival}</span>
              </div>
              {trip.leaveIn > 0 ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Leave in {trip.leaveIn} min
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Leave now!
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-red-500 font-medium">No more trains today.</div>
      )}

      {/* Current Time */}
      <div className="text-xs text-white/40 pt-2 border-t border-white/10">
        Current time:{" "}
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
