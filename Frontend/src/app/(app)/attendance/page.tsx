"use client";

import { useState, useEffect, useCallback } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { getMonthString } from "@/lib/utils";
import { exportAttendanceToExcel, type AttendanceRow } from "@/lib/excel";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { attendanceStatusVariant } from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { ClipboardList, FileSpreadsheet } from "lucide-react";

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

const COLUMNS = [
  { key: "staffName", header: "Staff" },
  { key: "date", header: "Date" },
  { key: "clockIn", header: "Clock In" },
  { key: "clockOut", header: "Clock Out" },
  {
    key: "status",
    header: "Status",
    render: (item: AttendanceRecord) => (
      <Badge variant={attendanceStatusVariant(item.status)}>{item.status}</Badge>
    ),
  },
];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [month, setMonth] = useState<string>(() => getMonthString(new Date()));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/attendance/list", {
        params: { companyId: getCompanyId(), month },
      });
      setRecords(normalizeAttendance(res.data));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

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

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Staff attendance records"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              aria-label="Select month"
            />
            <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          {loading ? (
            <div className="p-5"><LoadingState rows={5} /></div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No attendance records"
              description="No attendance data available for this month."
            />
          ) : (
            <Table
              columns={COLUMNS}
              data={records as unknown as Record<string, unknown>[]}
              emptyMessage="No records found."
            />
          )}
        </Card>
      )}
    </div>
  );
}