import { getDataFromLocalStorage, sliceString } from "@/utils";
import axios from "axios";

const client = axios.create({
  baseURL: "https://scenic-start-node-ten.vercel.app/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = getDataFromLocalStorage("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${sliceString(String(token), 27, 13)}`;
  }

  return config;
});

export default client;
