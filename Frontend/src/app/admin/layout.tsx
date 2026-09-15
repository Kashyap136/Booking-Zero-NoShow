"use client";

import AdminGate from "@/components/layout/AdminGate";
import AdminAppShell from "@/components/layout/AdminAppShell";
import { ToastProvider } from "@/components/ui/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <ToastProvider>
        <AdminAppShell>{children}</AdminAppShell>
      </ToastProvider>
    </AdminGate>
  );
}