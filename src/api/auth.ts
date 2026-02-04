import client from "./client";

export const isMe = () => client.get("/auth/me");

export const currentUserWeather = () => client.get("/auth/temperature");

export const getBackgroundImage = () => client.get("/auth/background-images");
