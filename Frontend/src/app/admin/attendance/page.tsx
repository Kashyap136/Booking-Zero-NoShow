"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { getMonthString } from "@/lib/utils";
import {
  exportAttendanceToExcel,
  type AttendanceRow,
} from "@/lib/excel";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge, { attendanceStatusVariant } from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ClipboardList, FileSpreadsheet, Pencil } from "lucide-react";

interface AttendanceRecord {
  id: string;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
}

function normalizeAttendance(raw: unknown): AttendanceRecord[] {
  if (Array.isArray(raw)) return raw as AttendanceRecord[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.attendance)) return d.attendance as AttendanceRecord[];
  if (Array.isArray(d?.records)) return d.records as AttendanceRecord[];
  if (Array.isArray(d?.data)) return d.data as AttendanceRecord[];
  return [];
}

export default function AdminAttendancePage() {
  const { addToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [month, setMonth] = useState<string>(() => getMonthString(new Date()));

  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formClockIn, setFormClockIn] = useState("");
  const [formClockOut, setFormClockOut] = useState("");
  const [formStatus, setFormStatus] = useState("");

  const companyId = getCompanyId();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/attendance/list", {
        params: { companyId, month },
      });
      setRecords(normalizeAttendance(res.data));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [companyId, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  function openEdit(r: AttendanceRecord) {
    setEditing(r);
    setFormClockIn(r.clockIn ?? "");
    setFormClockOut(r.clockOut ?? "");
    setFormStatus(r.status ?? "");
    setFormErrors({});
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formClockIn) e.clockIn = "Clock in is required";
    if (!formStatus) e.status = "Status is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing || !validateForm()) return;
    setSaving(true);
    try {
      await api.post("/api/attendance/update", {
        companyId,
        attendanceId: editing.id,
        clockIn: formClockIn,
        clockOut: formClockOut,
        status: formStatus,
      });
      addToast("Attendance record updated", "success");
      setEditing(null);
      fetchData();
    } catch (err) {
      addToast(toApiError(err).message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const rows: AttendanceRow[] = records.map((r) => ({
      staffName: r.staffName,
      date: r.date,
      clockIn: r.clockIn || "-",
      clockOut: r.clockOut || "-",
      status: r.status,
    }));
    exportAttendanceToExcel(rows, month);
  }

  const columns = useMemo(
    () => [
      { key: "staffName", header: "Staff" },
      { key: "date", header: "Date" },
      { key: "clockIn", header: "Clock In" },
      { key: "clockOut", header: "Clock Out" },
      {
        key: "status",
        header: "Status",
        render: (r: AttendanceRecord) => (
          <Badge variant={attendanceStatusVariant(r.status)}>{r.status}</Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (r: AttendanceRecord) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(r)}
              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              aria-label={`Edit attendance for ${r.staffName}`}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Staff attendance records, corrected by admins"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              aria-label="Select month"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={records.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          {loading ? (
            <div className="p-5">
              <LoadingState rows={5} />
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No attendance records"
              description="No attendance data available for this month."
            />
          ) : (
            <Table
              columns={columns}
              data={records as unknown as Record<string, unknown>[]}
              emptyMessage="No records found."
            />
          )}
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit Attendance – ${editing.staffName}` : "Edit Attendance"}
      >
        {editing && (
          <form onSubmit={handleSave} noValidate className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={editing.date ?? ""}
              readOnly
              hint="Use the backend to change which day a record belongs to."
            />
            <Input
              label="Clock In"
              type="time"
              value={formClockIn}
              onChange={(e) => setFormClockIn(e.target.value)}
              error={formErrors.clockIn}
              required
            />
            <Input
              label="Clock Out"
              type="time"
              value={formClockOut}
              onChange={(e) => setFormClockOut(e.target.value)}
              error={formErrors.clockOut}
            />
            <Input
              label="Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              error={formErrors.status}
              placeholder="present / absent"
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}