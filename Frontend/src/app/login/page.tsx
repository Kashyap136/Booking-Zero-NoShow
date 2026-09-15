"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { signIn, register, isAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { CalendarCheck } from "lucide-react";

type Mode = "login" | "register";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  submit?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return undefined;
}

function validatePassword(pw: string): string | undefined {
  if (!pw) return "Password is required";
  if (pw.length < 6) return "Password must be at least 6 characters";
  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const [redirect] = useState<string>(() => {
    if (typeof window === "undefined") return "/dashboard";
    return new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
  });
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated()) router.replace(redirect);
  }, [router, redirect]);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (mode === "register") {
      if (!name.trim()) e.name = "Name is required";
      if (!phone.trim()) e.phone = "Phone is required";
      else if (!/^\d{7,15}$/.test(phone.replace(/[\s\-+()]/g, "")))
        e.phone = "Enter a valid phone number";
    }
    e.email = validateEmail(email);
    e.password = validatePassword(password);
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), phone.trim(), password);
      }
      router.push(redirect);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("Request failed.", 0);
      if (apiErr.status === 409) {
        setErrors({ submit: "An account with this email already exists. Try logging in." });
      } else if (apiErr.status === 401) {
        setErrors({ submit: "Invalid email or password." });
      } else {
        setErrors({ submit: apiErr.message || "Something went wrong. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-600 text-white mb-4">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            NoShow OS
          </h1>
          <p className="text-sm text-muted mt-1">
            Appointment Booking Zero No-Show
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {errors.submit && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger"
            >
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === "register" && (
              <>
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="e.g. Priya Sharma"
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  placeholder="+91 98765 43210"
                  required
                />
              </>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder={mode === "register" ? "Min. 6 characters" : "Enter your password"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} NoShow OS. All rights reserved.
        </p>
      </div>
    </div>
  );
}