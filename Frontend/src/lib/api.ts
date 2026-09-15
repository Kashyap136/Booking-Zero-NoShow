import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  try {
    const raw = localStorage.getItem("booking-auth");
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed?.token) config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  } catch {
    /* corrupt storage – ignore */
  }
  return config;
});

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code = "ERROR",
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface BackendErrorBody {
  error?: { message?: string; code?: string; fields?: Record<string, string> };
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<BackendErrorBody>;
    const status = ax.response?.status ?? 0;
    const body = ax.response?.data?.error;
    const msg =
      body?.message ??
      (status === 0
        ? "Network error – server may be unreachable."
        : `Request failed (${status}).`);
    return new ApiError(msg, status, body?.code ?? "ERROR", body?.fields);
  }
  return new ApiError("An unexpected error occurred.", 0);
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("booking-auth");
      if (!window.location.pathname.startsWith("/login")) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);