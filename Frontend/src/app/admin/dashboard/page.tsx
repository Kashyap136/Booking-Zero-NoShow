"use client";

import { useState, useEffect, useCallback } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { getTodayString, formatCurrency, to12 } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge, { bookingStatusVariant } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import {
  CalendarCheck,
  TrendingDown,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  XCircle,
  UserX,
  Users,
  Scissors,
} from "lucide-react";

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  staffName?: string;
  slot: string;
  status: string;
  bookingDate?: string;
}

interface StatsData {
  totalBookings: number;
  noShowRate: number;
  revenueToday: number;
}

function normalizeStats(raw: unknown): StatsData {
  const d = raw as Record<string, unknown>;
  if (!d || typeof d !== "object")
    return { totalBookings: 0, noShowRate: 0, revenueToday: 0 };
  const stats = (d.stats ?? d) as Record<string, unknown>;
  return {
    totalBookings:
      (stats.todayBookings as number) ??
      (stats.totalBookings as number) ??
      (stats.bookings as number) ??
      0,
    noShowRate:
      (stats.noShowRate as number) ??
      (stats.noShowPercentage as number) ??
      (stats.noShow as number) ??
      0,
    revenueToday:
      (stats.revenueToday as number) ??
      (stats.revenue as number) ??
      0,
  };
}

function normalizeBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.bookings)) return d.bookings as Booking[];
  if (Array.isArray(d?.data)) return d.data as Booking[];
  return [];
}

function normalizeCount(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length;
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.staff)) return d.staff.length;
  if (Array.isArray(d?.services)) return d.services.length;
  if (Array.isArray(d?.data)) return d.data.length;
  return 0;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const companyId = getCompanyId();
  const today = getTodayString();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, bookingsRes, staffRes, servicesRes] = await Promise.all([
        api.get("/api/bookings/stats", { params: { companyId, date: today } }),
        api.get("/api/bookings/list", { params: { companyId, date: today } }),
        api.get("/api/staff/list", { params: { companyId } }),
        api.get("/api/services/list", { params: { companyId } }),
      ]);
      setStats(normalizeStats(statsRes.data));
      setBookings(normalizeBookings(bookingsRes.data));
      setStaffCount(normalizeCount(staffRes.data));
      setServicesCount(normalizeCount(servicesRes.data));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [companyId, today]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const completed = bookings.filter(
    (b) => b.status?.toLowerCase() === "completed",
  ).length;
  const cancelled = bookings.filter(
    (b) => b.status?.toLowerCase() === "cancelled",
  ).length;
  const noShows = bookings.filter(
    (b) => b.status?.toLowerCase() === "no-show",
  ).length;

  const upcoming = bookings
    .filter((b) => b.status?.toLowerCase() === "booked")
    .sort((a, b) => a.slot.localeCompare(b.slot));

  const recentCancellations = bookings
    .filter((b) => b.status?.toLowerCase() === "cancelled")
    .slice(0, 5);
  const recentNoShows = bookings
    .filter((b) => b.status?.toLowerCase() === "no-show")
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Operational overview for ${today}`}
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <ErrorState message={error.message} status={error.status} onRetry={fetchData} />
      )}

      {!error && (
        <div className="space-y-8">
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today's Bookings"
              value={stats?.totalBookings ?? 0}
              icon={<CalendarCheck className="h-5 w-5" />}
              sub="Appointments today"
              loading={loading}
            />
            <StatCard
              title="Completed Today"
              value={completed}
              icon={<CheckCircle2 className="h-5 w-5" />}
              sub="Fully served"
              loading={loading}
            />
            <StatCard
              title="Cancelled Today"
              value={cancelled}
              icon={<XCircle className="h-5 w-5" />}
              sub="By customer or staff"
              loading={loading}
            />
            <StatCard
              title="No-Shows Today"
              value={noShows}
              icon={<UserX className="h-5 w-5" />}
              sub="Missed appointments"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="No-Show Rate"
              value={stats?.noShowRate != null ? `${stats.noShowRate}%` : "0%"}
              icon={<TrendingDown className="h-5 w-5" />}
              sub="Missed / total today"
              loading={loading}
            />
            <StatCard
              title="Revenue Today"
              value={formatCurrency(stats?.revenueToday ?? 0)}
              icon={<IndianRupee className="h-5 w-5" />}
              sub="Booking revenue"
              loading={loading}
            />
            <StatCard
              title="Active Staff"
              value={staffCount}
              icon={<Users className="h-5 w-5" />}
              sub="On your team"
              loading={loading}
            />
            <StatCard
              title="Active Services"
              value={servicesCount}
              icon={<Scissors className="h-5 w-5" />}
              sub="Bookable services"
              loading={loading}
            />
          </div>

          {/* Operational overview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="p-0 xl:col-span-2">
              <div className="px-5 py-4 border-b border-line">
                <h3 className="text-base font-semibold text-foreground">
                  Today&apos;s Schedule
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {bookings.length} appointment{bookings.length !== 1 ? "s" : ""} on {today}
                </p>
              </div>
              {loading ? (
                <div className="p-5">
                  <LoadingState rows={3} />
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="No bookings today"
                  description="There are no appointments scheduled for today."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {(upcoming.length > 0 ? upcoming : [...bookings].sort((a, b) => a.slot.localeCompare(b.slot))).map((b) => (
                    <li
                      key={b.id}
                      className="px-5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {b.serviceName}
                          {b.staffName ? ` · ${b.staffName}` : ""} ·{" "}
                          {to12(b.slot.split("-")[0])}
                        </p>
                      </div>
                      <Badge variant={bookingStatusVariant(b.status)}>
                        {b.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="flex flex-col gap-6">
              {/* No-show analytics */}
              <Card className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No-Show Analytics
                </h3>
                <p className="text-xs text-muted mb-4">
                  Based on today&apos;s data. Broader trends appear once the
                  backend aggregates historical stats.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Rate</span>
                    <span className="text-sm font-semibold text-foreground">
                      {stats?.noShowRate != null ? `${stats.noShowRate}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">No-shows</span>
                    <span className="text-sm font-semibold text-foreground">
                      {noShows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-sm font-semibold text-foreground">
                      {completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Cancelled</span>
                    <span className="text-sm font-semibold text-foreground">
                      {cancelled}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Recent cancellations */}
              <Card className="p-0">
                <div className="px-5 py-4 border-b border-line">
                  <h3 className="text-base font-semibold text-foreground">
                    Recent Cancellations
                  </h3>
                </div>
                {recentCancellations.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted text-center">
                    No cancellations today.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {recentCancellations.map((b) => (
                      <li
                        key={b.id}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {b.customerName}
                          </p>
                          <p className="text-xs text-muted">
                            {b.serviceName} · {to12(b.slot.split("-")[0])}
                          </p>
                        </div>
                        <Badge variant="warning">Cancelled</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Recent no-shows */}
              <Card className="p-0">
                <div className="px-5 py-4 border-b border-line">
                  <h3 className="text-base font-semibold text-foreground">
                    Recent No-Shows
                  </h3>
                </div>
                {recentNoShows.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted text-center">
                    No no-shows today.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {recentNoShows.map((b) => (
                      <li
                        key={b.id}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {b.customerName}
                          </p>
                          <p className="text-xs text-muted">
                            {b.serviceName} · {to12(b.slot.split("-")[0])}
                          </p>
                        </div>
                        <Badge variant="danger">No-show</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}