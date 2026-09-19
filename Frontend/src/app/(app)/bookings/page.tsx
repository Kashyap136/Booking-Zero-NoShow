"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { dateToKey } from "@/lib/utils";
import { generateSlots } from "@/lib/slots";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge, { bookingStatusVariant } from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Plus, CalendarDays, CheckCircle2, XCircle, UserX } from "lucide-react";

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  slot: string;
  status: string;
  bookingDate?: string;
}

interface ServiceOption {
  id: string;
  name: string;
}

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const SLOT_OPTIONS = generateSlots();

function normalizeBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.bookings)) return d.bookings as Booking[];
  if (Array.isArray(d?.data)) return d.data as Booking[];
  return [];
}

function normalizeServices(raw: unknown): ServiceOption[] {
  if (Array.isArray(raw)) return (raw as Record<string, unknown>[]).map((s) => ({ id: String(s.id ?? s._id ?? ""), name: String(s.name ?? "") }));
  const d = raw as Record<string, unknown>;
  const arr = (d?.services ?? d?.data) as Record<string, unknown>[] | undefined;
  return (arr ?? []).map((s) => ({ id: String(s.id ?? s._id ?? ""), name: String(s.name ?? "") }));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function BookingsPage() {
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<Map<string, Booking[]>>(new Map());
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [monthError, setMonthError] = useState<ApiError | null>(null);
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [slotConflict, setSlotConflict] = useState("");

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formSlot, setFormSlot] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const companyId = getCompanyId();

  // Fetch bookings for all days of the active month
  const fetchMonth = useCallback(async () => {
    setLoadingMonth(true);
    setMonthError(null);
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const total = daysInMonth(year, month);
    const fetches: Promise<void>[] = [];
    const result = new Map<string, Booking[]>();

    for (let d = 1; d <= total; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      fetches.push(
        api
          .get("/api/bookings/list", { params: { companyId, date: key } })
          .then((res) => { result.set(key, normalizeBookings(res.data)); })
          .catch(() => { result.set(key, []); }),
      );
    }

    await Promise.allSettled(fetches);
    setMonthData(result);
    setLoadingMonth(false);
  }, [activeStartDate, companyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMonth();
  }, [fetchMonth]);

  // Fetch service options when modal opens
  useEffect(() => {
    if (!modalOpen) return;
    api
      .get("/api/services/list", { params: { companyId } })
      .then((res) => setServices(normalizeServices(res.data)))
      .catch(() => {});
  }, [modalOpen, companyId]);

  const selectedKey = dateToKey(selectedDate);
  const selectedBookings = monthData.get(selectedKey) ?? [];

  // Tile content: count badge for each day
  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const key = dateToKey(date);
      const dayBookings = monthData.get(key);
      if (!dayBookings || dayBookings.length === 0) return null;
      const count = dayBookings.length;
      const hasNoShow = dayBookings.some(
        (b) => b.status?.toLowerCase() === "no-show",
      );
      return (
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <span
            className={`text-[10px] font-semibold leading-none ${
              hasNoShow ? "text-danger" : "text-brand-600"
            }`}
          >
            {count}
          </span>
          <span
            className={`block w-1.5 h-1.5 rounded-full ${
              hasNoShow ? "bg-danger" : "bg-brand-500"
            }`}
            aria-hidden="true"
          />
        </div>
      );
    },
    [monthData],
  );

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormServiceId("");
    setFormSlot("");
    setFormErrors({});
    setSlotConflict("");
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.customerName = "Customer name is required";
    if (!formPhone.trim()) e.phone = "Phone is required";
    if (!formServiceId) e.service = "Please select a service";
    if (!formSlot) e.slot = "Please select a slot";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setSlotConflict("");
    try {
      await api.post("/api/bookings/create", {
        companyId,
        customerName: formName.trim(),
        phone: formPhone.trim(),
        serviceId: formServiceId,
        bookingDate: dateToKey(selectedDate),
        slot: formSlot,
      });
      addToast("Booking created successfully", "success");
      setModalOpen(false);
      resetForm();
      fetchMonth(); // Refresh calendar dots
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.status === 409) {
        setSlotConflict("That slot is already booked. Please choose another slot.");
      } else {
        addToast(apiErr.message, "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const calendarValue = useMemo<CalendarValue>(() => selectedDate, [selectedDate]);

  const updateStatus = useCallback(
    async (booking: Booking, status: "completed" | "no-show" | "cancelled") => {
      try {
        const res = await api.post<{ message: string }>("/api/bookings/status", {
          bookingId: booking.id,
          status,
        });
        addToast(res.data?.message || `Booking marked as ${status}`, "success");
        await fetchMonth();
      } catch (err) {
        addToast(toApiError(err).message, "error");
      }
    },
    [addToast, fetchMonth],
  );

  const columns = useMemo(
    () => [
      { key: "customerName", header: "Customer" },
      { key: "phone", header: "Phone" },
      { key: "serviceName", header: "Service" },
      { key: "slot", header: "Slot" },
      {
        key: "status",
        header: "Status",
        render: (item: Booking) => (
          <Badge variant={bookingStatusVariant(item.status)}>{item.status}</Badge>
        ),
      },
      {
        key: "actions",
        header: "Update",
        render: (item: Booking) => {
          if (item.status?.toLowerCase() !== "booked") return null;
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateStatus(item, "completed")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-success border border-line hover:bg-success-bg transition-colors"
                title="Mark as completed"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </button>
              <button
                type="button"
                onClick={() => updateStatus(item, "no-show")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger border border-line hover:bg-danger-bg transition-colors"
                title="Mark as no-show (charge advance)"
              >
                <UserX className="h-3.5 w-3.5" /> No-show
              </button>
              <button
                type="button"
                onClick={() => updateStatus(item, "cancelled")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted border border-line hover:bg-gray-100 transition-colors"
                title="Mark as cancelled"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          );
        },
      },
    ],
    [updateStatus],
  );

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Manage and view all appointments"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Booking
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="p-5 xl:col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Select a date</h3>
          <Calendar
            value={calendarValue}
            activeStartDate={activeStartDate}
            onActiveStartDateChange={({ activeStartDate: d }) => {
              if (d) setActiveStartDate(d);
            }}
            onChange={(value) => {
              if (value && !Array.isArray(value)) {
                setSelectedDate(value as Date);
              }
            }}
            tileContent={tileContent}
            showNeighboringMonth={false}
            locale="en-US"
          />
          {loadingMonth && (
            <p className="text-xs text-muted mt-3 flex items-center gap-1">
              <span className="animate-pulse">Loading bookings…</span>
            </p>
          )}
        </Card>

        {/* Bookings list for selected date */}
        <div className="xl:col-span-2">
          {monthError && (
            <ErrorState
              message={monthError.message}
              status={monthError.status}
              onRetry={fetchMonth}
            />
          )}

          {!monthError && (
            <Card className="p-0">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Bookings for {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {selectedBookings.length} appointment{selectedBookings.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add Booking
                </Button>
              </div>

              {selectedBookings.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="No bookings for this date"
                  description="Add a booking or select a different date."
                  action={
                    <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
                      <Plus className="h-4 w-4" /> Add Booking
                    </Button>
                  }
                />
              ) : (
                <Table
                  columns={columns}
                  data={selectedBookings as unknown as Record<string, unknown>[]}
                  emptyMessage="No bookings found."
                />
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Add Booking Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Booking">
        <form onSubmit={handleCreate} noValidate className="space-y-4">
          {slotConflict && (
            <div role="alert" className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
              {slotConflict}
            </div>
          )}
          <Input
            label="Customer Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.customerName}
            placeholder="e.g. Rahul Patil"
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            error={formErrors.phone}
            placeholder="+91 98765 43210"
            required
          />
          <Select
            label="Service"
            options={services.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select service"
            value={formServiceId}
            onChange={(e) => setFormServiceId(e.target.value)}
            error={formErrors.service}
            required
          />
          <Input
            label="Date"
            type="date"
            value={dateToKey(selectedDate)}
            readOnly
            hint="Date selected from calendar"
          />
          <Select
            label="Slot"
            options={SLOT_OPTIONS}
            placeholder="Select time slot"
            value={formSlot}
            onChange={(e) => setFormSlot(e.target.value)}
            error={formErrors.slot}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}