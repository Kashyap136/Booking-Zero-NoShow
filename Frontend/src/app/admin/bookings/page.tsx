"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { dateToKey, to12 } from "@/lib/utils";
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
import LoadingState from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import {
  Plus,
  CalendarDays,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  UserX,
  RotateCcw,
} from "lucide-react";

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  serviceId?: string;
  staffName?: string;
  slot: string;
  status: string;
  bookingDate?: string;
}

interface ServiceOption {
  id: string;
  name: string;
}

type StatusFilter = "all" | "booked" | "completed" | "cancelled" | "no-show";

const SLOT_OPTIONS = generateSlots();

function normalizeBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.bookings)) return d.bookings as Booking[];
  if (Array.isArray(d?.data)) return d.data as Booking[];
  return [];
}

function normalizeServices(raw: unknown): ServiceOption[] {
  if (Array.isArray(raw))
    return (raw as Record<string, unknown>[]).map((s) => ({
      id: String(s.id ?? s._id ?? ""),
      name: String(s.name ?? ""),
    }));
  const d = raw as Record<string, unknown>;
  const arr = (d?.services ?? d?.data) as Record<string, unknown>[] | undefined;
  return (arr ?? []).map((s) => ({
    id: String(s.id ?? s._id ?? ""),
    name: String(s.name ?? ""),
  }));
}

export default function AdminBookingsPage() {
  const { addToast } = useToast();
  const companyId = getCompanyId();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<Map<string, Booking[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    { booking: Booking; action: string } | null
  >(null);
  const [acting, setActing] = useState(false);

  const key = dateToKey(selectedDate);
  const shown = monthData.get(key) ?? [];

  const [services, setServices] = useState<ServiceOption[]>([]);

  // ---- create booking state ----
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotConflict, setSlotConflict] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formSlot, setFormSlot] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();
    const total = new Date(year, month + 1, 0).getDate();
    const result = new Map<string, Booking[]>();
    try {
      const fetches: Promise<void>[] = [];
      for (let d = 1; d <= total; d++) {
        const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        fetches.push(
          api
            .get("/api/bookings/list", { params: { companyId, date: k } })
            .then((res) => {
              result.set(k, normalizeBookings(res.data));
            })
            .catch(() => {
              result.set(k, []);
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

  // Fetch service options when Add modal opens
  useEffect(() => {
    if (!createOpen) return;
    api
      .get("/api/services/list", { params: { companyId } })
      .then((res) => setServices(normalizeServices(res.data)))
      .catch(() => {});
  }, [createOpen, companyId]);

  const filtered = shown.filter((b) => {
    if (statusFilter !== "all" && b.status?.toLowerCase() !== statusFilter)
      return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.phone?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q)
    );
  });

  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const k = dateToKey(date);
      const dayBookings = monthData.get(k);
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

  function resetCreateForm() {
    setFormName("");
    setFormPhone("");
    setFormServiceId("");
    setFormSlot("");
    setFormErrors({});
    setSlotConflict("");
  }

  function validateCreate(): boolean {
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
    if (!validateCreate()) return;
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
      addToast("Booking created", "success");
      setCreateOpen(false);
      resetCreateForm();
      fetchMonth();
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.status === 409) {
        setSlotConflict(
          "That slot is already booked. Please choose another slot.",
        );
      } else {
        addToast(apiErr.message, "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const openDetails = useCallback((b: Booking) => {
    setSelectedBooking(b);
    setDetailsOpen(true);
  }, []);

  const requestAction = useCallback((b: Booking, action: string) => {
    setPendingAction({ booking: b, action });
    setConfirmOpen(true);
  }, []);

  const ACTION_LABELS: Record<string, string> = {
    completed: "Mark completed",
    cancelled: "Cancel booking",
    "no-show": "Mark as no-show",
    booked: "Restore to booked",
  };

  async function confirmAction() {
    if (!pendingAction) return;
    const { booking, action } = pendingAction;
    setActing(true);
    try {
      await api.post("/api/bookings/update-status", {
        companyId,
        bookingId: booking.id,
        status: action,
      });
      addToast(
        action === "cancelled"
          ? `Booking cancelled`
          : `Booking marked as ${action}`,
        "success",
      );
      setConfirmOpen(false);
      setPendingAction(null);
      fetchMonth();
    } catch (err) {
      addToast(toApiError(err).message, "error");
    } finally {
      setActing(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "customerName", header: "Customer" },
      { key: "phone", header: "Phone" },
      { key: "serviceName", header: "Service" },
      { key: "slot", header: "Slot", render: (b: Booking) => to12(b.slot.split("-")[0]) },
      {
        key: "status",
        header: "Status",
        render: (b: Booking) => (
          <Badge variant={bookingStatusVariant(b.status)}>{b.status}</Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (b: Booking) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openDetails(b)}
              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              aria-label={`View details for ${b.customerName}`}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {b.status?.toLowerCase() === "booked" && (
              <>
                <button
                  onClick={() => requestAction(b, "completed")}
                  className="rounded-lg p-1.5 text-success hover:bg-success-bg transition-colors"
                  aria-label={`Mark ${b.customerName} completed`}
                  title="Mark completed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => requestAction(b, "cancelled")}
                  className="rounded-lg p-1.5 text-warning hover:bg-warning-bg transition-colors"
                  aria-label={`Cancel ${b.customerName}`}
                  title="Cancel booking"
                >
                  <XCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => requestAction(b, "no-show")}
                  className="rounded-lg p-1.5 text-danger hover:bg-danger-bg transition-colors"
                  aria-label={`Mark ${b.customerName} as no-show`}
                  title="Mark as no-show"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </>
            )}
            {b.status?.toLowerCase() !== "booked" && (
              <button
                onClick={() => requestAction(b, "booked")}
                className="rounded-lg p-1.5 text-info hover:bg-info-bg transition-colors"
                aria-label={`Restore ${b.customerName}`}
                title="Restore to booked"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [requestAction, openDetails],
  );

  const serviceOptions = useMemo(
    () => services.map((s) => ({ value: s.id, label: s.name })),
    [services],
  );

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Search, filter, and manage all appointments"
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Booking
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchMonth} />}

      {!error && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5 xl:col-span-1">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Select a date
            </h3>
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
            {loading && (
              <p className="text-xs text-muted mt-3 flex items-center gap-1">
                <span className="animate-pulse">Loading bookings…</span>
              </p>
            )}
          </Card>

          <div className="xl:col-span-2">
            <Card className="p-0">
              <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    Bookings for{" "}
                    {selectedDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {shown.length} appointment{shown.length !== 1 ? "s" : ""}
                    {filtered.length !== shown.length
                      ? ` · ${filtered.length} shown`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      aria-label="Search bookings"
                      className="h-10 rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 w-full sm:w-48"
                    />
                  </div>
                  <Select
                    aria-label="Filter by status"
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "booked", label: "Booked" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                      { value: "no-show", label: "No-show" },
                    ]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-full sm:w-40"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-5">
                  <LoadingState rows={4} />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="No bookings match"
                  description="Try a different date, clear the search, or adjust the filters."
                />
              ) : (
                <Table
                  columns={columns}
                  data={filtered as unknown as Record<string, unknown>[]}
                  emptyMessage="No bookings found."
                />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Booking">
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
            options={serviceOptions}
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
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted mb-0.5">Customer</dt>
                <dd className="font-medium text-foreground">
                  {selectedBooking.customerName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Phone</dt>
                <dd className="font-medium text-foreground">
                  {selectedBooking.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Service</dt>
                <dd className="font-medium text-foreground">
                  {selectedBooking.serviceName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Staff</dt>
                <dd className="font-medium text-foreground">
                  {selectedBooking.staffName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Date</dt>
                <dd className="font-medium text-foreground">
                  {selectedBooking.bookingDate ?? dateToKey(selectedDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Slot</dt>
                <dd className="font-medium text-foreground">
                  {to12(selectedBooking.slot?.split("-")[0])}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Status</dt>
                <dd>
                  <Badge variant={bookingStatusVariant(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </dd>
              </div>
            </dl>
            {selectedBooking.status?.toLowerCase() !== "booked" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailsOpen(false);
                  requestAction(selectedBooking, "booked");
                }}
              >
                <RotateCcw className="h-4 w-4" /> Restore to booked
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm action Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!acting) {
            setConfirmOpen(false);
            setPendingAction(null);
          }
        }}
        title="Confirm action"
      >
        {pendingAction && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {pendingAction.action === "cancelled" && (
                <>
                  Cancel the booking for{" "}
                  <span className="font-semibold">
                    {pendingAction.booking.customerName}
                  </span>{" "}
                  on {dateToKey(selectedDate)} at{" "}
                  {to12(pendingAction.booking.slot.split("-")[0])}?
                </>
              )}
              {pendingAction.action === "completed" && (
                <>
                  Mark the booking for{" "}
                  <span className="font-semibold">
                    {pendingAction.booking.customerName}
                  </span>{" "}
                  as completed?
                </>
              )}
              {pendingAction.action === "no-show" && (
                <>
                  Mark the booking for{" "}
                  <span className="font-semibold">
                    {pendingAction.booking.customerName}
                  </span>{" "}
                  as a no-show? This will affect the no-show rate.
                </>
              )}
              {pendingAction.action === "booked" && (
                <>
                  Restore the booking for{" "}
                  <span className="font-semibold">
                    {pendingAction.booking.customerName}
                  </span>{" "}
                  back to booked status?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingAction(null);
                }}
                disabled={acting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                loading={acting}
                variant={
                  pendingAction.action === "cancelled" ||
                  pendingAction.action === "no-show"
                    ? "danger"
                    : "primary"
                }
              >
                {ACTION_LABELS[pendingAction.action]}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}