import { getWeatherInfo } from "@/api";
import { type WeatherApiResponse } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { STORAGE_KEYS, CACHE_DURATIONS } from "@/constants";
import { MapPinned, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export default function Weather() {
  const [info, setInfo] = useState<WeatherApiResponse | null>(() => {
    try {
      return getDataFromLocalStorage(STORAGE_KEYS.WEATHER_INFO) ?? null;
    } catch {
      return null;
    }
  });

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    () => {
      try {
        return getDataFromLocalStorage(STORAGE_KEYS.COORDS) ?? null;
      } catch {
        return null;
      }
    },
  );

  const [isLoading, setIsLoading] = useState(false);

  // Attempt to get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Check if we already have coords in storage
    const storedCoords = getDataFromLocalStorage(STORAGE_KEYS.COORDS) as {
      lat: number;
      lon: number;
    } | null;

    if (storedCoords) {
      setCoords(storedCoords);
      return;
    }

    // Request position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lon: longitude };
        console.log("Got location:", newCoords);
        setCoords(newCoords);
        setDataToLocalStorage(STORAGE_KEYS.COORDS, newCoords);
      },
      (error) => {
        console.warn("Geolocation denied or error:", error);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Fetch weather with cache check
  const fetchWeather = useCallback(
    async (force = false) => {
      // Check cache freshness
      if (!force) {
        try {
          const cachedTime = getDataFromLocalStorage(
            STORAGE_KEYS.WEATHER_TIMESTAMP,
          ) as number | undefined;
          if (cachedTime && Date.now() - cachedTime < CACHE_DURATIONS.WEATHER) {
            return; // Cache is fresh
          }
        } catch {
          // Ignore cache errors
        }
      }

      setIsLoading(true);

      try {
        const data = await getWeatherInfo(coords ?? undefined);
        setInfo(data as WeatherApiResponse);
        setDataToLocalStorage(STORAGE_KEYS.WEATHER_INFO, data);
        setDataToLocalStorage(STORAGE_KEYS.WEATHER_TIMESTAMP, Date.now());
      } catch (err) {
        console.error("Weather fetch error:", err);

        // Keep cached data on error
        try {
          const cached = getDataFromLocalStorage(STORAGE_KEYS.WEATHER_INFO);
          if (cached && !info) {
            setInfo(cached as WeatherApiResponse);
          }
        } catch {
          // Ignore
        }
      } finally {
        setIsLoading(false);
      }
    },
    [coords, info],
  );

  // Fetch weather when coords change
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  if (!info) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="space-y-1">
          <div className="w-16 h-4 rounded bg-white/10" />
          <div className="w-12 h-3 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col gap-5 px-6 py-5 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-black/40 transition-all duration-300 shadow-2xl cursor-pointer select-none w-full min-w-[340px]"
      onClick={() => fetchWeather(true)}
      title="Click to refresh weather"
    >
      {/* Top Section: Location & Status */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium uppercase tracking-wider">
            <MapPinned size={12} />
            <span className="truncate max-w-[140px]">{info.location.name}</span>
          </div>
          <span className="text-lg font-medium text-white/90 mt-0.5">
            {info.weather.description.charAt(0).toUpperCase() +
              info.weather.description.slice(1)}
          </span>
        </div>
        <div className="relative">
          <RefreshCw
            size={14}
            className={`text-white/30 transition-opacity ${
              isLoading
                ? "animate-spin opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}
          />
        </div>
      </div>

      {/* Middle Section: Big Temp & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-6xl font-bold leading-none text-white tracking-tighter drop-shadow-xl">
          {Math.round(info.temperature.current)}°
        </span>
        <img
          src={`https://openweathermap.org/img/wn/${info.weather.icon}@4x.png`}
          alt={info.weather.description}
          className="w-24 h-24 object-contain drop-shadow-2xl -my-6 -mr-4"
        />
      </div>

      {/* Bottom Section: Grid of Details */}
      <div className="grid grid-cols-3 gap-y-3 gap-x-2 pt-2 border-t border-white/10">
        <DetailItem
          label="Feels Like"
          value={`${Math.round(info.temperature.feels_like)}°`}
        />
        <DetailItem label="Wind" value={`${Math.round(info.wind.speed)} m/s`} />
        <DetailItem label="Humidity" value={`${info.humidity}%`} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
        {label}
      </span>
      <span className="text-sm font-medium text-white/90">{value}</span>
    </div>
  );
}
