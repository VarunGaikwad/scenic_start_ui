import { getWeatherInfo } from "@/api";
import { UNITS, type WeatherApiResponse } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

export default function Weather() {
  const [info, setInfo] = useState<WeatherApiResponse | null>(() => {
    return getDataFromLocalStorage("weatherInfo") ?? null;
  });
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    () => getDataFromLocalStorage("coords") ?? null,
  );
  const [hasNavigatorAccess, setHasNavigatorAccess] = useState(() => {
    // If we have coords in localStorage, we already have access
    return getDataFromLocalStorage("coords") !== null;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lon: longitude };
        setCoords(newCoords);
        setDataToLocalStorage("coords", newCoords);
        setHasNavigatorAccess(true);
      },
      () => {
        // Location denied
      },
    );
  };

  // Check for geolocation permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsInitialized(true);
      return;
    }

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
              setIsInitialized(true);
            },
            () => {
              setIsInitialized(true);
            },
          );
        } else {
          setIsInitialized(true);
        }
      })
      .catch(() => {
        setIsInitialized(true);
      });
  }, []);

  // Fetch weather info when coords change or on initialization
  useEffect(() => {
    if (!isInitialized) return;

    const fetchWeather = async () => {
      try {
        const { data } = await getWeatherInfo(coords ?? undefined);
        setInfo(data);
        setDataToLocalStorage("weatherInfo", data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchWeather();
  }, [coords, isInitialized]);

  // Save coords to localStorage when they change
  useEffect(() => {
    if (coords) {
      setDataToLocalStorage("coords", coords);
    }
  }, [coords]);

  // Extract data from new API format
  const icon = info?.weather?.icon ?? "01d";
  const temp = info ? Math.round(info.temperature.current) : null;
  const feelsLike = info ? Math.round(info.temperature.feels_like) : null;
  const visibility = info?.visibility
    ? (info.visibility / 1000).toFixed(1)
    : null;
  const sunrise = info?.location?.sunrise
    ? new Date(info.location.sunrise * 1000)
    : null;
  const sunset = info?.location?.sunset
    ? new Date(info.location.sunset * 1000)
    : null;

  // NEW: Extract other fields from new API format
  const locationName = info?.location?.name ?? "—";
  const weatherDescription = info?.weather?.description ?? "—";
  const windSpeed = info?.wind?.speed ?? null;
  const humidity = info?.humidity ?? null;
  const pressure = info?.pressure ?? null;

  return (
    <div className="bg-black/15 shadow-2xl p-5 rounded-4xl w-full max-w-md">
      {/* Top: Location + Description */}
      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <div className="text-lg font-bold truncate">{locationName}</div>

          {!hasNavigatorAccess && (
            <button
              onClick={requestLocation}
              className="opacity-60 hover:opacity-100 transition"
              title="Use current location"
            >
              <MapPinned className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-sm capitalize text-inherit/70 truncate">
          {weatherDescription}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Icon + Temperature */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            className="w-16 h-16 shrink-0"
            src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
            alt="weather icon"
          />

          <div className="leading-none min-w-0">
            <div className="text-6xl font-extrabold tracking-tight truncate">
              {temp !== null ? temp : "--"}
              <span className="text-3xl align-top">{UNITS.temp}</span>
            </div>

            <div className="text-xs text-inherit/60 truncate">
              Feels like{" "}
              {feelsLike !== null ? `${feelsLike}${UNITS.temp}` : "—"}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="lg:grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-semibold mt-4 md:mt-0 hidden">
          <Metric
            label="Wind"
            value={
              windSpeed !== null ? `${windSpeed.toFixed(1)} ${UNITS.wind}` : "—"
            }
          />

          <Metric
            label="Humidity"
            value={humidity !== null ? `${humidity}${UNITS.humidity}` : "—"}
          />

          <Metric
            label="Pressure"
            value={pressure !== null ? `${pressure} ${UNITS.pressure}` : "—"}
          />

          <Metric
            label="Visibility"
            value={
              visibility !== null ? `${visibility} ${UNITS.visibility}` : "—"
            }
          />

          <Metric
            label="Sunrise"
            value={
              sunrise
                ? sunrise.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                  })
                : "—"
            }
          />

          <Metric
            label="Sunset"
            value={
              sunset
                ? sunset.toLocaleTimeString("en-US", {
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
    <div className="min-w-0">
      <div className="text-inherit truncate">{label}</div>
      <div className="text-inherit/50 text-xs truncate">{value}</div>
    </div>
  );
}
