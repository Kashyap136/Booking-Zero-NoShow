"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api, toApiError } from "@/lib/api";
import { CalendarCheck, CheckCircle2, AlertTriangle } from "lucide-react";

function validatePassword(pw: string): string | undefined {
  if (!pw) return "Password is required";
  if (pw.length < 6) return "Password must be at least 6 characters";
  return undefined;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    api
      .post("/api/auth/reset-password", { token, password })
      .then(() => setDone(true))
      .catch((err) =>
        setError(toApiError(err).message || "Something went wrong. Please try again."),
      )
      .finally(() => setLoading(false));
  }

  if (!token.trim()) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger mb-4">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">
          Invalid reset link
        </h2>
        <p className="text-sm text-muted mb-6">
          This link is missing a reset token. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success mb-4">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">
          Password reset successful
        </h2>
        <p className="text-sm text-muted mb-6">
          Your password has been updated. You can now sign in with your new
          password.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
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
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 6 characters"
        required
        autoComplete="new-password"
        showToggle
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Re-enter your new password"
        required
        autoComplete="new-password"
        showToggle
      />
      <Button type="submit" className="w-full" loading={loading}>
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-600 text-white mb-4">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Reset password
          </h1>
          <p className="text-sm text-muted mt-1">
            NoShow OS — Appointment Booking Zero No-Show
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          <Suspense
            fallback={
              <p className="text-sm text-muted text-center py-4">Loading…</p>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} NoShow OS. All rights reserved.
        </p>
      </div>
    </div>
  );
}