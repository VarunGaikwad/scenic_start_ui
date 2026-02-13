import axios from "axios";

// Configuration
const BASE_URL = "https://scenic-start-node-ten.vercel.app";
const TIMEOUT = 30000;

// Create axios instance
const client = axios.create({
  withCredentials: true,
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.request.use((config) => {
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
