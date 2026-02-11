import type { BookmarkTreeType } from "@/interface";
import client from "./client";

const PATH = `/auth`;

// ==================== TYPES ====================

export interface FavoriteLink {
  id: string;
  url: string;
  name: string;
  createdAt: string;
}

export interface BackgroundImage {
  id: string;
  image_url: string;
  is_welcome: boolean;
  media_type: "image" | "video";
  overlay_color: string;
  overlay_opacity: number;
  text_color: "light" | "dark";
}

export interface WeatherInfo {
  temperature: {
    current: number;
    feels_like: number;
  };
  weather: {
    icon: string;
    description: string;
  };
  wind: {
    speed: number;
  };
  humidity: number;
  pressure: number;
  visibility: number;
  location: {
    name: string;
    sunrise: number;
    sunset: number;
  };
}

export interface ShayariQuote {
  id: string;
  text: string;
  author?: string;
}

export interface WeatherParams {
  lat?: number;
  lon?: number;
}

// ==================== AUTH ====================

export const isMe = async (signal?: AbortSignal) => {
  const { data } = await client.get(`${PATH}/me`, { signal });
  return data;
};

// ==================== BACKGROUND ====================

export const getBackgroundImage = async (
  signal?: AbortSignal,
): Promise<BackgroundImage> => {
  const { data } = await client.get<BackgroundImage>(
    `${PATH}/background-images`,
    { signal },
  );
  return data;
};

// ==================== FAVORITES ====================

export const getFavoriteLinks = async (
  signal?: AbortSignal,
): Promise<FavoriteLink[]> => {
  const { data } = await client.get<FavoriteLink[]>(`${PATH}/favorite-links`, {
    signal,
  });
  return data;
};

export const postFavoriteLink = async (payload: {
  url: string;
  name: string;
}): Promise<FavoriteLink> => {
  const { data } = await client.post<FavoriteLink>(
    `${PATH}/favorite-links`,
    payload,
  );
  return data;
};

// ==================== WEATHER ====================

export const getWeatherInfo = async (
  params?: WeatherParams,
  signal?: AbortSignal,
): Promise<WeatherInfo> => {
  // Validate coordinates
  if (params) {
    if (params.lat !== undefined && (params.lat < -90 || params.lat > 90)) {
      throw new Error("Invalid latitude: must be between -90 and 90");
    }
    if (params.lon !== undefined && (params.lon < -180 || params.lon > 180)) {
      throw new Error("Invalid longitude: must be between -180 and 180");
    }
  }

  const { data } = await client.get<WeatherInfo>(`${PATH}/weather-info`, {
    params,
    signal,
  });
  return data;
};

// ==================== QUOTES ====================

type QuoteType = "shayari" | "quotes";

const getShayariQuotes = async (
  type: QuoteType,
  signal?: AbortSignal,
): Promise<ShayariQuote[]> => {
  const { data } = await client.get<ShayariQuote[]>(`${PATH}/shayari-quotes`, {
    params: { type },
    signal,
  });
  return data;
};

export const getShayaris = (signal?: AbortSignal) =>
  getShayariQuotes("shayari", signal);

export const getQuotes = (signal?: AbortSignal) =>
  getShayariQuotes("quotes", signal);

// ==================== BOOKMARKS ====================

export const getBookmarkTree = async (
  signal?: AbortSignal,
): Promise<BookmarkTreeType[]> => {
  const { data } = await client.get<BookmarkTreeType[]>(
    `${PATH}/bookmark/tree`,
    {
      signal,
    },
  );
  return data;
};

export const getBookmarks = async (
  parentId?: string | null,
  signal?: AbortSignal,
): Promise<BookmarkTreeType[]> => {
  const { data } = await client.get<BookmarkTreeType[]>(`${PATH}/bookmark`, {
    params: parentId ? { parentId } : undefined,
    signal,
  });
  return data;
};

export const getBookmarkById = async (
  id: string,
  signal?: AbortSignal,
): Promise<BookmarkTreeType> => {
  const { data } = await client.get<BookmarkTreeType>(
    `${PATH}/bookmark/${id}`,
    { signal },
  );
  return data;
};

export const postBookmarkFolder = async (
  title: string,
  parentId?: string | null,
): Promise<BookmarkTreeType> => {
  const { data } = await client.post<BookmarkTreeType>(`${PATH}/bookmark`, {
    type: "folder",
    title,
    parentId: parentId ?? null,
    children: [],
  });
  return data;
};

export const postBookmarkLink = async (
  title: string,
  url: string,
  parentId?: string | null,
): Promise<BookmarkTreeType> => {
  const { data } = await client.post<BookmarkTreeType>(`${PATH}/bookmark`, {
    type: "link",
    title,
    url,
    parentId: parentId ?? null,
  });
  return data;
};

// ==================== UPDATE ====================

export const putBookmark = async (
  id: string,
  updates: {
    title?: string;
    url?: string | null;
    parentId?: string | null;
  },
): Promise<BookmarkTreeType> => {
  const { data } = await client.put<BookmarkTreeType>(
    `${PATH}/bookmark/${id}`,
    updates,
  );
  return data;
};

// ==================== DELETE ====================

export const deleteBookmark = async (id: string): Promise<void> => {
  await client.delete(`${PATH}/bookmark/${id}`);
};

