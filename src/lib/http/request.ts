import { getCookie } from "@/utils/cookies";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import https from "https";

// Supabase REST API configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Config
export const localBackend =
  process.env.NEXT_PUBLIC_LOCAL_BACKEND?.toUpperCase() === "TRUE";

// HTTP Agent config
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV !== "development",
});

// Create axios instance for Supabase REST API
const client = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  timeout: 10000,
  httpsAgent,
  headers: {
    "apikey": supabaseAnonKey,
    "Content-Type": "application/json",
  },
});

// Request interceptor - add JWT token if available
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
