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

  // Check for geolocation permission on mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (status.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              const newCoords = { lat: latitude, lon: longitude };
              setCoords(newCoords);
              setDataToLocalStorage(STORAGE_KEYS.COORDS, newCoords);
            },
            (error) => {
              console.warn("Geolocation error:", error);
            },
          );
        }
      })
      .catch((error) => {
        console.warn("Permission query error:", error);
      });
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
        const { data } = await getWeatherInfo(coords ?? undefined);
        setInfo(data);
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

  // Extract and compute weather data

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
      className="group relative flex flex-col gap-4 px-6 py-5 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-black/40 transition-all duration-300 shadow-2xl cursor-pointer select-none w-full max-w-[280px]"
      onClick={() => fetchWeather(true)}
      title="Click to refresh weather"
    >
      {/* Top Section: Icon + Main Temp */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-4xl font-bold leading-none text-white tracking-tight drop-shadow-lg">
            {Math.round(info.temperature.current)}°
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium mt-1">
            <MapPinned size={12} />
            <span className="truncate max-w-[100px]">{info.location.name}</span>
          </div>
        </div>

        <div className="relative">
          <img
            src={`https://openweathermap.org/img/wn/${info.weather.icon}@2x.png`}
            alt={info.weather.description}
            className="w-16 h-16 object-contain drop-shadow-md -my-2"
          />
          <RefreshCw
            size={14}
            className={`absolute top-0 right-0 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity ${
              isLoading ? "animate-spin opacity-100" : ""
            }`}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/10" />

      {/* Bottom Section: Grid of Details */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <DetailItem label="Wind" value={`${Math.round(info.wind.speed)} m/s`} />
        <DetailItem label="Humidity" value={`${info.humidity}%`} />
        <DetailItem label="Pressure" value={`${info.pressure} hPa`} />
        <DetailItem
          label="Visibility"
          value={
            info.visibility ? `${(info.visibility / 1000).toFixed(1)} km` : "—"
          }
        />
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
