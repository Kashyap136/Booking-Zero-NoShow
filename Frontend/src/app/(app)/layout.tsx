"use client";

import AuthGate from "@/components/layout/AuthGate";
import AppShell from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </AuthGate>
  );
}