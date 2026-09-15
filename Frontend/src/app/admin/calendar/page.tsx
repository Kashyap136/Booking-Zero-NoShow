"use client";

import { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { dateToKey, to12 } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge, { bookingStatusVariant } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import { CalendarDays } from "lucide-react";

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  staffName?: string;
  slot: string;
  status: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function normalizeBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.bookings)) return d.bookings as Booking[];
  if (Array.isArray(d?.data)) return d.data as Booking[];
  return [];
}

export default function AdminCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<Map<string, Booking[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const companyId = getCompanyId();
  const selectedKey = dateToKey(selectedDate);
  const selectedBookings = monthData.get(selectedKey) ?? [];

  const counts = {
    booked: selectedBookings.filter((b) => b.status?.toLowerCase() === "booked")
      .length,
    completed: selectedBookings.filter(
      (b) => b.status?.toLowerCase() === "completed",
    ).length,
    cancelled: selectedBookings.filter(
      (b) => b.status?.toLowerCase() === "cancelled",
    ).length,
    noShow: selectedBookings.filter(
      (b) => b.status?.toLowerCase() === "no-show",
    ).length,
  };

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const total = daysInMonth(year, month);
    const result = new Map<string, Booking[]>();

    try {
      const fetches: Promise<void>[] = [];
      for (let d = 1; d <= total; d++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        fetches.push(
          api
            .get("/api/bookings/list", { params: { companyId, date: key } })
            .then((res) => {
              result.set(key, normalizeBookings(res.data));
            })
            .catch(() => {
              result.set(key, []);
            }),
        );
      }
      await Promise.allSettled(fetches);
      setMonthData(result);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [activeStartDate, companyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMonth();
  }, [fetchMonth]);

  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const key = dateToKey(date);
      const dayBookings = monthData.get(key);
      if (!dayBookings || dayBookings.length === 0) return null;
      const count = dayBookings.length;
      const hasBooked = dayBookings.some(
        (b) => b.status?.toLowerCase() === "booked",
      );
      const hasNoShow = dayBookings.some(
        (b) => b.status?.toLowerCase() === "no-show",
      );
      return (
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <span className="text-[10px] font-semibold leading-none text-foreground">
            {count}
          </span>
          <div className="flex gap-0.5">
            {hasBooked && (
              <span
                className="block w-1.5 h-1.5 rounded-full bg-success"
                aria-label="Booked"
              />
            )}
            {hasNoShow && (
              <span
                className="block w-1.5 h-1.5 rounded-full bg-danger"
                aria-label="No-show"
              />
            )}
          </div>
        </div>
      );
    },
    [monthData],
  );

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Monthly booking overview with status indicators"
        actions={
          <Button variant="outline" size="sm" onClick={fetchMonth} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchMonth} />}

      {!error && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5 xl:col-span-2">
            <Calendar
              value={selectedDate}
              activeStartDate={activeStartDate}
              onActiveStartDateChange={({ activeStartDate: d }) => {
                if (d) setActiveStartDate(d);
              }}
              onChange={(value) => {
                if (value && !Array.isArray(value)) setSelectedDate(value as Date);
              }}
              tileContent={tileContent}
              showNeighboringMonth={false}
              locale="en-US"
            />
            <div className="flex items-center gap-4 mt-4 text-xs text-muted">
              <span className="flex items-center gap-1">
                <span className="block w-2 h-2 rounded-full bg-success" /> Booked
              </span>
              <span className="flex items-center gap-1">
                <span className="block w-2 h-2 rounded-full bg-danger" /> No-show
              </span>
              {loading && <span className="animate-pulse">Loading…</span>}
            </div>
          </Card>

          <Card className="p-0 xl:col-span-1">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-base font-semibold text-foreground">
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="text-xs text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>{selectedBookings.length} appointments</span>
                {counts.completed > 0 && <span className="text-success">{counts.completed} done</span>}
                {counts.cancelled > 0 && <span className="text-warning">{counts.cancelled} cancelled</span>}
                {counts.noShow > 0 && <span className="text-danger">{counts.noShow} no-show</span>}
              </p>
            </div>

            {selectedBookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No bookings"
                description="No appointments on this date."
              />
            ) : (
              <ul className="divide-y divide-line">
                {selectedBookings.map((b) => (
                  <li
                    key={b.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {b.customerName}
                      </p>
                      <p className="text-xs text-muted">
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
        </div>
      )}
    </div>
  );
}