import { getCookie } from "@/utils/cookies";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { getClientBaseURL, isLocalBackend } from "./apiConfig";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const localBackend = isLocalBackend();

const client = axios.create({
  baseURL: getClientBaseURL(),
  timeout: 120000,
  headers: localBackend
    ? {
        "Content-Type": "application/json",
      }
    : {
        apikey: supabaseAnonKey ?? "",
        "Content-Type": "application/json",
      },
});

function isPublicUserRoute(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/user/signin") ||
    url.includes("/user/signup")
  );
}

client.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    try {
      if (config.data instanceof FormData && config.headers) {
        delete (config.headers as Record<string, unknown>)["Content-Type"];
      }

      const path = typeof config.url === "string" ? config.url : "";
      const token = getCookie("token");
      if (token && config.headers && !isPublicUserRoute(path)) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
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

client.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401 && typeof window !== "undefined") {
        window.location.href = "/auth/signin";
      } else if (status === 403) {
        const reqUrl = String(error.config?.url ?? "");
        const isPublicAuth =
          reqUrl.includes("/user/signin") || reqUrl.includes("/user/signup");
        if (!isPublicAuth && typeof window !== "undefined") {
          const raw = error.response?.data;
          let msg: string;
          if (typeof raw === "string") {
            msg = raw;
          } else if (raw && typeof raw === "object" && "detail" in raw) {
            const d = (raw as { detail: unknown }).detail;
            msg =
              typeof d === "string"
                ? d
                : Array.isArray(d)
                  ? JSON.stringify(d)
                  : JSON.stringify(raw);
          } else {
            msg =
              error.response?.statusText ||
              `HTTP ${status}`;
          }
          console.error("Access denied:", msg);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default client;
