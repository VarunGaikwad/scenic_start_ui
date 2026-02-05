import { getWeatherInfo } from "@/api";
import { UNITS, type WeatherApiResponse } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { useEffect, useState } from "react";

export default function Weather() {
  const [info, setInfo] = useState<WeatherApiResponse | null>(() => {
    return getDataFromLocalStorage("weatherInfo") ?? null;
  });

  useEffect(() => {
    getWeatherInfo()
      .then(({ data }) => setInfo(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (info) {
      setDataToLocalStorage("weatherInfo", info);
    }
  }, [info]);

  const icon = info?.weather?.[0]?.icon ?? "01d";

  const temp = info ? Math.round(info.main.temp) : null;
  const feelsLike = info ? Math.round(info.main.feels_like) : null;
  const visibility = info ? (info.visibility / 1000).toFixed(1) : null;
  const sunrise = info ? new Date(info.sys.sunrise * 1000) : null;
  const sunset = info ? new Date(info.sys.sunset * 1000) : null;

  return (
    <div className="bg-black/15 shadow-2xl p-5 rounded-4xl w-full max-w-md">
      {/* Top: Location + Description */}
      <div className="mb-4">
        <div className="text-lg font-bold wrap-break-word truncate">
          {info?.name ?? "—"}
        </div>
        <div className="text-sm capitalize text-inherit/70 wrap-break-word truncate">
          {info?.weather?.[0]?.description ?? "—"}
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
            value={info ? `${info.wind.speed.toFixed(1)} ${UNITS.wind}` : "—"}
          />

          <Metric
            label="Humidity"
            value={info ? `${info.main.humidity}${UNITS.humidity}` : "—"}
          />

          <Metric
            label="Pressure"
            value={info ? `${info.main.pressure} ${UNITS.pressure}` : "—"}
          />

          <Metric
            label="Clouds"
            value={info ? `${info.clouds.all}${UNITS.humidity}` : "—"}
          />

          <Metric
            label="Sunrise"
            value={
              sunrise
                ? `${sunrise.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                  })}`
                : "—"
            }
          />
          <Metric
            label="Sunset"
            value={
              sunset
                ? `${sunset.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                  })}`
                : "—"
            }
          />

          <Metric
            label="Visibility"
            value={
              visibility !== null ? `${visibility} ${UNITS.visibility}` : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="wrap-break-word min-w-0">
      <div className="text-inherit truncate">{label}</div>
      <div className="text-inherit/50 text-xs truncate">{value}</div>
    </div>
  );
}
