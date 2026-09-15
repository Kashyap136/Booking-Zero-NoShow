"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { to12 } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/excel";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { bookingStatusVariant } from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import {
  BarChart3,
  CalendarDays,
  CalendarCheck,
  XCircle,
  UserX,
  CheckCircle2,
  FileSpreadsheet,
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

function normalizeBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.bookings)) return d.bookings as Booking[];
  if (Array.isArray(d?.data)) return d.data as Booking[];
  return [];
}

function daysBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
        cur.getDate(),
      ).padStart(2, "0")}`,
    );
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const companyId = getCompanyId();
  const today = new Date();

  const [start, setStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return toDateInput(d);
  });
  const [end, setEnd] = useState(() => toDateInput(today));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    if (start > end) {
      addToast("Start date must be on or before end date", "error");
      return;
    }
    setLoading(true);
    setError(null);
    const days = daysBetween(new Date(`${start}T00:00:00`), new Date(`${end}T00:00:00`));
    if (days.length > 45) {
      setLoading(false);
      addToast("Range too large. Pick 45 days or fewer.", "error");
      return;
    }
    const result: Booking[] = [];
    try {
      const fetches = days.map((date) =>
        api
          .get("/api/bookings/list", { params: { companyId, date } })
          .then((res) => result.push(...normalizeBookings(res.data)))
          .catch(() => {}),
      );
      await Promise.allSettled(fetches);
      setBookings(result);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [start, end, companyId, addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  const counts = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(
      (b) => b.status?.toLowerCase() === "completed",
    ).length;
    const cancelled = bookings.filter(
      (b) => b.status?.toLowerCase() === "cancelled",
    ).length;
    const noShow = bookings.filter(
      (b) => b.status?.toLowerCase() === "no-show",
    ).length;
    const booked = total - completed - cancelled - noShow;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
    return { total, completed, cancelled, noShow, booked, noShowRate };
  }, [bookings]);

  const byService = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.serviceName || "Unknown", (map.get(b.serviceName || "Unknown") ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  const byStaff = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      const key = b.staffName || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportRowsToExcel(
        [
          { header: "Date", key: "bookingDate", width: 14 },
          { header: "Customer", key: "customerName", width: 24 },
          { header: "Phone", key: "phone", width: 16 },
          { header: "Service", key: "serviceName", width: 20 },
          { header: "Staff", key: "staffName", width: 20 },
          { header: "Slot", key: "slot", width: 12 },
          { header: "Status", key: "status", width: 14 },
        ],
        bookings.map((b) => ({
          ...b,
          slot: b.slot ? to12(b.slot.split("-")[0]) : "-",
        })) as unknown as Record<string, unknown>[],
        `bookings-report-${start}-to-${end}.xlsx`,
        "Bookings",
      );
      addToast("Report exported", "success");
    } catch {
      addToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "bookingDate", header: "Date", render: (b: Booking) => b.bookingDate || "-" },
      { key: "customerName", header: "Customer" },
      { key: "phone", header: "Phone" },
      { key: "serviceName", header: "Service" },
      { key: "staffName", header: "Staff", render: (b: Booking) => b.staffName || "—" },
      { key: "slot", header: "Slot", render: (b: Booking) => to12(b.slot.split("-")[0]) },
      {
        key: "status",
        header: "Status",
        render: (b: Booking) => (
          <Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Booking performance within a date range"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            loading={exporting}
            disabled={bookings.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
        }
      />

      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-start" className="text-sm font-medium text-foreground">
              From
            </label>
            <input
              id="report-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-end" className="text-sm font-medium text-foreground">
              To
            </label>
            <input
              id="report-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <Button onClick={fetchReport} loading={loading} className="sm:ml-auto">
            Generate
          </Button>
        </div>
        <p className="text-xs text-muted mt-3">
          Data is aggregated from the date-range booking endpoint. Ranges over 45
          days are capped.
        </p>
      </Card>

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchReport} />}

      {!error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings"
              value={counts.total}
              icon={<BarChart3 className="h-5 w-5" />}
              sub={`${start} → ${end}`}
              loading={loading}
            />
            <StatCard
              title="Completed"
              value={counts.completed}
              icon={<CheckCircle2 className="h-5 w-5" />}
              loading={loading}
            />
            <StatCard
              title="Cancelled"
              value={counts.cancelled}
              icon={<XCircle className="h-5 w-5" />}
              loading={loading}
            />
            <StatCard
              title="No-Shows"
              value={counts.noShow}
              icon={<UserX className="h-5 w-5" />}
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="No-Show Rate"
              value={`${counts.noShowRate}%`}
              icon={<UserX className="h-5 w-5" />}
              sub="No-shows / total in range"
              loading={loading}
            />
            <StatCard
              title="Still Booked"
              value={counts.booked}
              icon={<CalendarCheck className="h-5 w-5" />}
              sub="Open appointments"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-foreground mb-3">
                Bookings by Service
              </h3>
              {byService.length === 0 ? (
                <p className="text-sm text-muted">No data in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {byService.map((s) => (
                    <li key={s.name} className="py-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground truncate">{s.name}</span>
                      <span className="text-sm font-semibold text-foreground">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="text-base font-semibold text-foreground mb-3">
                Bookings by Staff
              </h3>
              {byStaff.length === 0 ? (
                <p className="text-sm text-muted">No data in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {byStaff.map((s) => (
                    <li key={s.name} className="py-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground truncate">{s.name}</span>
                      <span className="text-sm font-semibold text-foreground">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-0">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-base font-semibold text-foreground">
                Booking Detail
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {bookings.length} record{bookings.length !== 1 ? "s" : ""} in range
              </p>
            </div>
            {loading ? (
              <div className="p-5">
                <LoadingState rows={4} />
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No bookings in range"
                description="Adjust the date range or check back later."
              />
            ) : (
              <Table
                columns={columns}
                data={bookings as unknown as Record<string, unknown>[]}
                emptyMessage="No bookings found."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}