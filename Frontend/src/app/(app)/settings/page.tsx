"use client";

import { useState, useEffect } from "react";
import { getAppSettings, saveAppSettings, sendTestAlert, saveUpiId, saveLanguage, getSettings } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { toApiError } from "@/lib/api";
import { Settings as SettingsIcon, Send } from "lucide-react";

export default function SettingsPage() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(getAppSettings);
  const [testPhone, setTestPhone] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [languageSaving, setLanguageSaving] = useState<"en" | "mr" | "hi" | null>(null);

  // Load persisted settings (language, UPI) from the backend on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const server = await getSettings();
        if (cancelled) return;

        setSettings((prev) => ({
          ...prev,
          upiId: server.upiId ?? "",
          language: server.language ?? prev.language,
        }));

        saveAppSettings({
          upiId: server.upiId ?? "",
          language: server.language ?? getAppSettings().language,
        });
      } catch {
        // Backend unreachable: keep the localStorage fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveAppSettings({ [key]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLanguageSelect(value: "en" | "mr" | "hi") {
    if (value === settings.language || languageSaving !== null) return;

    const previous = settings.language;
    setLanguageSaving(value);

    // Optimistic update so the selection feels instant.
    setSettings((prev) => ({ ...prev, language: value }));
    saveAppSettings({ language: value });

    try {
      await saveLanguage(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSettings((prev) => ({ ...prev, language: previous }));
      saveAppSettings({ language: previous });
      addToast(
        toApiError(err).message || "Unable to save language preference. Please try again.",
        "error",
      );
    } finally {
      setLanguageSaving(null);
    }
  }

  async function handleTestAlert() {
    setTestLoading(true);
    try {
      await sendTestAlert(testPhone);
      addToast("Test alert sent", "success");
    } catch (err) {
      addToast(toApiError(err).message || "Test alert failed", "error");
    } finally {
      setTestLoading(false);
    }
  }

  async function handleUpiBlur() {
    try {
      await saveUpiId(settings.upiId);
      addToast("UPI ID saved", "success");
    } catch (err) {
      addToast(toApiError(err).message || "Failed to save UPI ID", "error");
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Configure your booking system" />

      {saved && (
        <div className="mb-4 rounded-lg bg-success-bg px-4 py-2 text-sm text-success">
          Settings saved.
        </div>
      )}

      <div className="space-y-6">
        {/* Communication channels */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-foreground">Communication</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: "whatsappEnabled" as const, label: "WhatsApp notifications", desc: "Send booking reminders via WhatsApp" },
              { key: "smsEnabled" as const, label: "SMS notifications", desc: "Send booking reminders via SMS" },
              { key: "ivrEnabled" as const, label: "IVR Call alerts", desc: "Automated voice call reminders" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={settings[item.key]}
                  onClick={() => update(item.key, !settings[item.key])}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                    settings[item.key] ? "bg-brand-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5 ${
                      settings[item.key] ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Language */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Language</h3>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: "en", label: "English" },
                { value: "mr", label: "Marathi" },
                { value: "hi", label: "Hindi" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageSelect(lang.value)}
                disabled={languageSaving !== null}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  settings.language === lang.value
                    ? "bg-brand-50 border-brand-300 text-brand-700"
                    : "border-line bg-white text-muted hover:bg-gray-50"
                }`}
              >
                {lang.label}
                {languageSaving === lang.value ? " • Saving…" : ""}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Your language preference is saved to your account and used for booking notification messages (WhatsApp and SMS).
          </p>
        </Card>

        {/* UPI ID */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">UPI ID</h3>
          <Input
            placeholder="e.g. yourname@upi"
            value={settings.upiId}
            onChange={(e) => update("upiId", e.target.value)}
            onBlur={handleUpiBlur}
            hint="Saved to your account and used for UPI payment links in booking notifications."
          />
        </Card>

        {/* Test Alert */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Test Alert</h3>
          <p className="text-sm text-muted mb-4">
            Send a test WhatsApp message to verify your configuration.
          </p>
          <div className="flex gap-3">
            <Input
              type="tel"
              placeholder="Phone number to test"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTestAlert}
              loading={testLoading}
              variant="secondary"
              disabled={!testPhone.trim()}
            >
              <Send className="h-4 w-4" /> Send Test
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}