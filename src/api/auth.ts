import client from "./client";

export const isMe = () => client.get("/auth/me");

export const getBackgroundImage = () => client.get("/auth/background-images");

export const getFavoriteLinks = () => client.get("/auth/favorite-links");

export const getWeatherInfo = () => client.get("/auth/weather-info");

export const postFavoriteLink = (payload: { url: string; name: string }) =>
  client.post("/auth/favorite-links", payload);
