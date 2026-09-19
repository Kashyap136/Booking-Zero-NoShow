import { api } from "./api";

export interface AppSettings {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  ivrEnabled: boolean;
  language: "en" | "mr" | "hi";
  upiId: string;
}

const SETTINGS_KEY = "booking-settings";

const DEFAULTS: AppSettings = {
  whatsappEnabled: true,
  smsEnabled: false,
  ivrEnabled: false,
  language: "en",
  upiId: "",
};

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveAppSettings(settings: Partial<AppSettings>): void {
  const current = getAppSettings();
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...current, ...settings }),
  );
}

// Backend is the source of truth for persisted settings (language, upiId).
// localStorage is used only as an offline fallback while a page is loading.
export interface ServerSettings {
  upiId: string;
  language: "en" | "mr" | "hi";
}

export async function getSettings(): Promise<ServerSettings> {
  const res = await api.get<ServerSettings>("/api/auth/settings");
  return res.data;
}

export async function saveLanguage(language: "en" | "mr" | "hi"): Promise<void> {
  await api.put("/api/auth/settings", { language });
}

export async function sendTestAlert(phone: string): Promise<void> {
  await api.post("/api/whatsapp/test", { phone });
}

export async function saveUpiId(upiId: string): Promise<void> {
  await api.put("/api/auth/settings", { upiId });
}