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
  const token = getDataFromLocalStorage("app:authToken:v1");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default client;
