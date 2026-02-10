import { STORAGE_KEYS } from "@/constants";
import {
  getDataFromLocalStorage,
  setDataToLocalStorage,
  deleteDataFromLocalStorage,
} from "@/utils";
import axios from "axios";

// Configuration
const BASE_URL =
  import.meta.env.REACT_APP_API_URL ||
  "https://scenic-start-node-ten.vercel.app";
const TIMEOUT = 30000;
const STORAGE_KEY = STORAGE_KEYS.AUTH_TOKEN;

// Create axios instance
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - add auth token
client.interceptors.request.use(
  (config) => {
    try {
      const token = getDataFromLocalStorage(STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to read auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors globally
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = getDataFromLocalStorage("refreshToken");

        if (refreshToken) {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          // Save new tokens
          setDataToLocalStorage(STORAGE_KEY, data.token);
          if (data.refreshToken) {
            setDataToLocalStorage("refreshToken", data.refreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, log out user
        deleteDataFromLocalStorage(STORAGE_KEY);
        deleteDataFromLocalStorage("refreshToken");

        // Emit custom event for React to handle logout
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshError);
      }
    }

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;

      console.warn(`Rate limited. Retrying after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return client(originalRequest);
    }

    // Handle network errors
    if (!error.response) {
      if (!navigator.onLine) {
        error.message =
          "You appear to be offline. Please check your connection.";
      } else if (error.code === "ECONNABORTED") {
        error.message = "Request timed out. Please try again.";
      } else {
        error.message = "Network error. Please check your connection.";
      }
    }

    return Promise.reject(error);
  },
);

// Development logging
if (import.meta.env.NODE_ENV === "development") {
  client.interceptors.request.use((config) => {
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      console.log(`✅ [API] ${response.status} ${response.config.url}`, {
        data: response.data,
      });
      return response;
    },
    (error) => {
      console.error(
        `❌ [API] ${error.response?.status || "ERR"} ${error.config?.url}`,
        {
          error: error.response?.data || error.message,
        },
      );
      return Promise.reject(error);
    },
  );
}

export default client;
