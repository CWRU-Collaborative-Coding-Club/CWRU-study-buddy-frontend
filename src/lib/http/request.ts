import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import https from "https";
import { getCookie } from "@/utils/cookies";

// Config
export const localBackend =
  process.env.NEXT_PUBLIC_LOCAL_BACKEND?.toUpperCase() === "TRUE";
const apiVersion = process.env.NEXT_PUBLIC_API_VERSION;
let baseURL = process.env.NEXT_PUBLIC_ONLINE_BASE_URL;
let environment = process.env.NEXT_PUBLIC_DEV_ENVIRONMENT;

// HTTP Agent config
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV !== "development",
});

// Set base URL based on environment
if (process.env.NODE_ENV === "development") {
  baseURL = localBackend
    ? process.env.NEXT_PUBLIC_LOCAL_BASE_URL
    : process.env.NEXT_PUBLIC_ONLINE_BASE_URL;
  environment = process.env.NEXT_PUBLIC_DEV_ENVIRONMENT;
} else if (process.env.NODE_ENV === "production") {
  baseURL = process.env.NEXT_PUBLIC_ONLINE_BASE_URL;
  environment =
    process.env.NEXT_PUBLIC_CURRENT_ENV === "production"
      ? process.env.NEXT_PUBLIC_PROD_ENVIRONMENT
      : process.env.NEXT_PUBLIC_DEV_ENVIRONMENT;
}

export const apiUrl = `${baseURL}/${environment}`;

// Create axios instance with base config
const client = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  httpsAgent,
});

// Request interceptor
client.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    try {
      // Get JWT token from cookies
      const token = getCookie("token");

      // If token exists, add it to the request headers
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config as any;
    } catch (error) {
      console.error("Error setting JWT token from cookies:", error);
    }

    return config as any;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "/auth/signin";
      } else if (status === 403) {
        // Forbidden - handle access denied
        console.error("Access denied:", error.response.data);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
