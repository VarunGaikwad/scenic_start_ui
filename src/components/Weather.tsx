import { getWeatherInfo } from "@/api";
import { UNITS, type WeatherApiResponse } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { MapPinned, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";

const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export default function Weather() {
  const [info, setInfo] = useState<WeatherApiResponse | null>(() => {
    try {
      return getDataFromLocalStorage("weatherInfo") ?? null;
    } catch {
      return null;
    }
  });

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    () => {
      try {
        return getDataFromLocalStorage("coords") ?? null;
      } catch {
        return null;
      }
    },
  );

  const [hasNavigatorAccess, setHasNavigatorAccess] = useState(() => {
    try {
      return getDataFromLocalStorage("coords") !== null;
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lon: longitude };
        setCoords(newCoords);
        setDataToLocalStorage("coords", newCoords);
        setHasNavigatorAccess(true);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Location unavailable");
        } else {
          setLocationError("Location timeout");
        }
      },
    );
  }, []);

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
              setDataToLocalStorage("coords", newCoords);
              setHasNavigatorAccess(true);
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
      setError(null);

      // Check cache freshness
      if (!force) {
        try {
          const cachedTime = getDataFromLocalStorage("weatherInfoTimestamp") as
            | number
            | undefined;
          if (cachedTime && Date.now() - cachedTime < WEATHER_CACHE_DURATION) {
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
        setDataToLocalStorage("weatherInfo", data);
        setDataToLocalStorage("weatherInfoTimestamp", Date.now());
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Failed to load weather");

        // Keep cached data on error
        try {
          const cached = getDataFromLocalStorage("weatherInfo");
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
  const weatherData = useMemo(() => {
    if (!info) return null;

    return {
      icon: info.weather?.icon ?? "01d",
      temp: Math.round(info.temperature.current),
      feelsLike: Math.round(info.temperature.feels_like),
      visibility: info.visibility ? (info.visibility / 1000).toFixed(1) : null,
      sunrise: info.location?.sunrise
        ? new Date(info.location.sunrise * 1000)
        : null,
      sunset: info.location?.sunset
        ? new Date(info.location.sunset * 1000)
        : null,
      locationName: info.location?.name ?? "—",
      description: info.weather?.description ?? "—",
      windSpeed: info.wind?.speed ?? null,
      humidity: info.humidity ?? null,
      pressure: info.pressure ?? null,
    };
  }, [info]);

  return (
    <div className="bg-black/30 shadow-2xl p-5 rounded-4xl w-full max-w-md">
      {/* Top: Location + Description */}
      <div className="mb-4">
        <div className="flex gap-2 items-center justify-between">
          <div className="text-lg font-bold truncate">
            {weatherData?.locationName ?? "—"}
          </div>

          <div className="flex items-center gap-2">
            {!hasNavigatorAccess && (
              <button
                onClick={requestLocation}
                className="opacity-60 hover:opacity-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1"
                title="Use current location"
                aria-label="Enable location"
              >
                <MapPinned className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => fetchWeather(true)}
              disabled={isLoading}
              className="opacity-60 hover:opacity-100 transition disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1"
              title="Refresh weather"
              aria-label="Refresh weather data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="text-xs capitalize text-inherit/70 truncate">
          {weatherData?.description ?? "—"}
        </div>

        {/* Error messages */}
        {error && <div className="text-xs text-red-400 mt-1">⚠️ {error}</div>}
        {locationError && (
          <div className="text-xs text-yellow-400 mt-1">📍 {locationError}</div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Icon + Temperature */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            className="w-16 h-16 shrink-0"
            src={`https://openweathermap.org/img/wn/${weatherData?.icon ?? "01d"}@2x.png`}
            alt="Weather icon"
          />

          <div className="leading-none min-w-0">
            <div className="text-5xl font-extrabold tracking-tight truncate">
              {weatherData?.temp ?? "--"}
              <span className="text-3xl align-top">{UNITS.temp}</span>
            </div>

            <div className="text-xs text-inherit/60 truncate">
              Feels like{" "}
              {weatherData?.feelsLike !== undefined
                ? `${weatherData.feelsLike}${UNITS.temp}`
                : "—"}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="hidden md:grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-semibold">
          <Metric
            label="Wind"
            value={
              weatherData?.windSpeed !== null &&
              weatherData?.windSpeed !== undefined
                ? `${weatherData.windSpeed.toFixed(1)} ${UNITS.wind}`
                : "—"
            }
          />

          <Metric
            label="Humidity"
            value={
              weatherData?.humidity !== null &&
              weatherData?.humidity !== undefined
                ? `${weatherData.humidity}${UNITS.humidity}`
                : "—"
            }
          />

          <Metric
            label="Pressure"
            value={
              weatherData?.pressure !== null &&
              weatherData?.pressure !== undefined
                ? `${weatherData.pressure} ${UNITS.pressure}`
                : "—"
            }
          />

          <Metric
            label="Visibility"
            value={
              weatherData?.visibility !== null
                ? `${weatherData?.visibility} ${UNITS.visibility}`
                : "—"
            }
          />

          <Metric
            label="Sunrise"
            value={
              weatherData?.sunrise
                ? weatherData.sunrise.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                  })
                : "—"
            }
          />

          <Metric
            label="Sunset"
            value={
              weatherData?.sunset
                ? weatherData.sunset.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                  })
                : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-xs">
      <div className="text-inherit truncate">{label}</div>
      <div className="text-inherit/50 text-xs truncate">{value}</div>
    </div>
  );
}
