"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api, toApiError } from "@/lib/api";
import { CalendarCheck, MailCheck, AlertTriangle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(toApiError(err).message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-600 text-white mb-4">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Forgot password
          </h1>
          <p className="text-sm text-muted mt-1">
            NoShow OS — Appointment Booking Zero No-Show
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          {sent ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success mb-4">
                <MailCheck className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-muted mb-6">
                If an account with that email exists, a password reset link has
                been sent. The link expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="mb-2 flex items-start gap-2 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  {error}
                </div>
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted">
                Remembered it?{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} NoShow OS. All rights reserved.
        </p>
      </div>
    </div>
  );
}