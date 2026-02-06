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
  visibility: number; // in meters
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  wind: {
    speed: number; // m/s
    deg: number;
  };
  location: {
    name: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
    sunrise: number; // Unix timestamp
    sunset: number; // Unix timestamp
  };
  timestamp: string; // ISO date string
}

export const UNITS = {
  temp: "°C",
  wind: "m/s",
  humidity: "%",
  pressure: "hPa",
  visibility: "km",
} as const;
