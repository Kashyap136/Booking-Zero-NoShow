"use client";

import { useState, useEffect, useCallback } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { getTodayString, formatCurrency } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import Badge, { bookingStatusVariant } from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import PageHeader from "@/components/ui/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  CalendarCheck,
  TrendingDown,
  IndianRupee,
  CalendarDays,
} from "lucide-react";

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
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

  const total =
    (stats.todayBookings as number) ??
    (stats.totalBookings as number) ??
    (stats.total as number) ??
    (stats.bookings as number) ??
    0;

  const rated =
    (stats.noShowRate as number) ?? (stats.noShowPercentage as number);

  const noShowCount = (stats.noShow as number) ?? 0;

  const noShowRate =
    rated ?? (total > 0 ? Math.round((noShowCount / total) * 100) : 0);

  return {
    totalBookings: total,
    noShowRate,
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

const COLUMNS = [
  { key: "customerName", header: "Customer" },
  { key: "phone", header: "Phone" },
  { key: "serviceName", header: "Service" },
  { key: "slot", header: "Slot" },
  {
    key: "status",
    header: "Status",
    render: (item: Booking) => (
      <Badge variant={bookingStatusVariant(item.status)}>
        {item.status}
      </Badge>
    ),
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const companyId = getCompanyId();
    const today = getTodayString();
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.get("/api/bookings/stats", { params: { companyId, date: today } }),
        api.get("/api/bookings/list", { params: { companyId, date: today } }),
      ]);
      setStats(normalizeStats(statsRes.data));
      setBookings(normalizeBookings(bookingsRes.data));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${getTodayString()}`}
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <ErrorState
          message={error.message}
          status={error.status}
          onRetry={fetchData}
        />
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Today's Bookings"
              value={stats?.totalBookings ?? 0}
              icon={<CalendarCheck className="h-5 w-5" />}
              sub="Confirmed appointments"
              loading={loading}
            />
            <StatCard
              title="No-Show Rate"
              value={stats?.noShowRate != null ? `${stats.noShowRate}%` : "0%"}
              icon={<TrendingDown className="h-5 w-5" />}
              sub="Missed appointments"
              loading={loading}
            />
            <StatCard
              title="Revenue Today"
              value={formatCurrency(stats?.revenueToday ?? 0)}
              icon={<IndianRupee className="h-5 w-5" />}
              sub="Booking revenue"
              loading={loading}
            />
          </div>

          <Card className="p-0">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-base font-semibold text-foreground">
                Today&apos;s Bookings
              </h3>
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
              <Table
                columns={COLUMNS}
                data={bookings as unknown as Record<string, unknown>[]}
                emptyMessage="No bookings found."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}