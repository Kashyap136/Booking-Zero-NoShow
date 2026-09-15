import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoShow OS — Appointment Booking Zero No-Show",
  description:
    "Manage appointments, staff attendance, and reduce no-shows with zero-effort booking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}