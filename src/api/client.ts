import { STORAGE_KEYS } from "@/constants";
import { getDataFromLocalStorage } from "@/utils";
import axios from "axios";

const client = axios.create({
  baseURL: "https://scenic-start-node-ten.vercel.app",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = getDataFromLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default client;
