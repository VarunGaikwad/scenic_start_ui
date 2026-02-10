// Updated interface for the new API response format

export interface WeatherApiResponse {
  temperature: {
    current: number;
    feels_like: number;
    min: number;
    max: number;
  };
  humidity: number;
  pressure: number;
  visibility: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  wind: {
    speed: number;
    deg: number;
  };
  location: {
    name: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
    sunrise: number;
    sunset: number;
  };
  timestamp: string;
}

export interface Coord {
  lon: number;
  lat: number;
}

export interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level: number;
  grnd_level: number;
}

export interface Wind {
  speed: number;
  deg: number;
}

export interface Clouds {
  all: number;
}

export interface Sys {
  type: number;
  id: number;
  country: string; // JP
  sunrise: number; // unix timestamp
  sunset: number; // unix timestamp
}

export const UNITS = {
  temp: "°C",
  wind: "m/s",
  humidity: "%",
  pressure: "hPa",
  visibility: "km",
} as const;
