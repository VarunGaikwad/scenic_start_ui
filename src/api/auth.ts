import type { BookmarkTreeType } from "@/interface";
import client from "./client";

const PATH = `/auth`;

export const isMe = () => client.get(`${PATH}/me`);

export const getBackgroundImage = () => client.get(`${PATH}/background-images`);

export const getFavoriteLinks = () => client.get(`${PATH}/favorite-links`);

export const getWeatherInfo = (params?: { lat?: number; lon?: number }) =>
  client.get(`${PATH}/weather-info`, {
    params,
  });

export const postFavoriteLink = (payload: { url: string; name: string }) =>
  client.post(`${PATH}/favorite-links`, payload);

export const getShayaris = () =>
  client.get(`${PATH}/shayari-quotes?type=shayari`);

export const getQuotes = () => client.get(`${PATH}/shayari-quotes?type=quotes`);

export const getBookmarkTree = () => client.get(`${PATH}/bookmark/tree`);

export const getBookmarks = (parentId?: string | null) =>
  client.get(`${PATH}/bookmark`, {
    params: { parentId: parentId ?? undefined },
  });

export const getBookmarkById = (id: string) =>
  client.get(`${PATH}/bookmark/${id}`);

export const postBookmarkFolder = (title: string, parentId?: string | null) =>
  client.post(`${PATH}/bookmark`, {
    type: "folder",
    title,
    parentId: parentId ?? null,
    children: [],
  });

export type Bookmark = {
  id: string;
  title: string;
  url: string;
};
export const postBookmarkLink = async (
  title: string,
  url: string,
  parentId?: string | null,
): Promise<BookmarkTreeType> => {
  const res = await client.post<BookmarkTreeType>(`${PATH}/bookmark`, {
    type: "link",
    title,
    url,
    parentId: parentId ?? null,
  });

  return res.data;
};

// ------------------ UPDATE ------------------

export const putBookmark = (
  id: string,
  data: {
    title?: string;
    url?: string | null;
    parentId?: string | null;
  },
) => client.put(`${PATH}/bookmark/${id}`, data);

// ------------------ DELETE ------------------

// Delete a bookmark (folder or link) by ID
export const deleteBookmark = (id: string) =>
  client.delete(`${PATH}/bookmark/${id}`);
