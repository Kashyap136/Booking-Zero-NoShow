"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Calendar,
  Users,
  Scissors,
  ShieldCheck,
  BarChart3,
  ScrollText,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { href: "/admin/calendar", label: "Calendar", icon: Calendar },
      { href: "/admin/attendance", label: "Attendance", icon: ClipboardList },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/staff", label: "Staff", icon: Users },
      { href: "/admin/services", label: "Services", icon: Scissors },
      { href: "/admin/users", label: "Users", icon: ShieldCheck },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
] as const;

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full py-6">
      <div className="px-6 mb-6">
        <Link href="/admin/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-brand-600 tracking-tight">
            Admin
          </span>
        </Link>
        <p className="text-xs text-muted mt-1">NoShow OS Control Room</p>
      </div>

      <ul className="flex-1 overflow-y-auto slim-scroll flex flex-col gap-4 px-3">
        {NAV_GROUPS.map((group) => (
          <li key={group.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-muted uppercase tracking-wide">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href === "/admin/dashboard" &&
                    pathname === "/admin") ||
                  pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-muted hover:bg-gray-100 hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="px-3 mt-4 pt-3 border-t border-line">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          Back to App
        </Link>
      </div>
    </nav>
  );
}