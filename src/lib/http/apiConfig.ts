/**
 * When NEXT_PUBLIC_LOCAL_BACKEND is TRUE, the browser talks to the FastAPI app
 * (see repo `backend/main.py`) instead of Supabase PostgREST.
 */
export function isLocalBackend(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_BACKEND?.toUpperCase() === "TRUE";
}

/** Backend route prefix: `/dev` or `/prod` (matches `backend/main.py`). */
export function getApiEnvironmentPrefix(): "dev" | "prod" {
  return process.env.NEXT_PUBLIC_DEV_ENVIRONMENT === "prod" ? "prod" : "dev";
}

/**
 * Axios base URL for JSON + multipart calls from the browser.
 * - Local backend: `NEXT_PUBLIC_LOCAL_BASE_URL` + `/dev` or `/prod`
 * - Otherwise: Supabase PostgREST base `.../rest/v1`
 */
export function getClientBaseURL(): string {
  if (isLocalBackend()) {
    const raw =
      process.env.NEXT_PUBLIC_LOCAL_BASE_URL?.trim() || "http://localhost:8000";
    const base = raw.replace(/\/$/, "");
    return `${base}/${getApiEnvironmentPrefix()}`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required when not using the local backend.");
  }
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
}
