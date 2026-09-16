"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import { getSession, logout } from "@/lib/auth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/services": "Services",
  "/bookings": "Bookings",
  "/staff": "Staff",
  "/attendance": "Attendance",
  "/calendar": "Calendar",
  "/settings": "Settings",
};

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const session = getSession();
  const title = PAGE_TITLES[pathname] ?? "NoShow OS";
  const userName = session?.user?.name || session?.user?.email || "User";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-surface border-b border-line sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-lg p-2 text-muted hover:bg-gray-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground leading-tight">
            {title}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
          <User className="h-4 w-4" />
          <span>{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-gray-100 hover:text-danger transition-colors"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}