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

export async function sendTestAlert(phone: string): Promise<void> {
  void phone; // Will be used when backend integration is connected
  // Backend stub — will call POST /api/whatsapp/send when backend is ready.
  // Keeping placeholder here so pages can call without wrapping in try/catch.
  await new Promise((r) => setTimeout(r, 600));
  throw new Error(
    "WhatsApp API not connected yet. Test alert pending backend integration.",
  );
}