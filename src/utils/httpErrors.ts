import { AxiosError } from "axios";

/** True when the browser could not connect (backend down, wrong host/port, CORS preflight failed before response, etc.). */
export function isAxiosNetworkError(err: unknown): boolean {
  return (
    err instanceof AxiosError &&
    (err.code === "ERR_NETWORK" || err.message === "Network Error")
  );
}

export function localBackendUnreachableMessage(): string {
  const base =
    process.env.NEXT_PUBLIC_LOCAL_BASE_URL?.trim() || "http://localhost:8000";
  return `Cannot reach the API at ${base}. Start the API in a second terminal: from the backend folder run npm run dev (or npm run dev:backend), or from the frontend folder run npm run dev:backend. You can also run: python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 from the backend directory (with your venv activated). Then reload this page. If you use another port, set NEXT_PUBLIC_LOCAL_BASE_URL in frontend/.env.local to match.`;
}
