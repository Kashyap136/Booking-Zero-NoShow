"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { formatDate, to12 } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { ScrollText, RotateCcw } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp?: string;
  action?: string;
  resource?: string;
  description?: string;
  performedBy?: string;
  status?: string;
}

function normalizeLogs(raw: unknown): AuditEntry[] {
  if (Array.isArray(raw)) return raw as AuditEntry[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.logs)) return d.logs as AuditEntry[];
  if (Array.isArray(d?.data)) return d.data as AuditEntry[];
  return [];
}

function actionVariant(
  action: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  const a = action?.toLowerCase() ?? "";
  if (a.includes("delete") || a.includes("remove")) return "danger";
  if (a.includes("create") || a.includes("add")) return "success";
  if (a.includes("update") || a.includes("edit") || a.includes("change"))
    return "info";
  if (a.includes("cancel")) return "warning";
  return "neutral";
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/audit-logs/list", {
        params: { companyId: getCompanyId() },
      });
      setLogs(normalizeLogs(res.data));
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

  const columns = useMemo(
    () => [
      {
        key: "timestamp",
        header: "When",
        render: (r: AuditEntry) => {
          if (!r.timestamp) return "—";
          try {
            return (
              <>
                {formatDate(r.timestamp)}
                {r.timestamp.includes("T")
                  ? ` ${to12(r.timestamp.split("T")[1]?.slice(0, 5) ?? "")}`
                  : ""}
              </>
            );
          } catch {
            return r.timestamp;
          }
        },
      },
      {
        key: "action",
        header: "Action",
        render: (r: AuditEntry) =>
          r.action ? (
            <Badge variant={actionVariant(r.action)}>{r.action}</Badge>
          ) : (
            "—"
          ),
      },
      { key: "resource", header: "Resource", render: (r: AuditEntry) => r.resource || "—" },
      { key: "description", header: "Description", render: (r: AuditEntry) => r.description || "—" },
      { key: "performedBy", header: "By", render: (r: AuditEntry) => r.performedBy || "—" },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="History of important changes in your workspace"
        actions={
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      {error && (
        <Card className="p-0">
          <ErrorState
            message={error.message}
            status={error.status}
            onRetry={fetchData}
          />
        </Card>
      )}

      {!error && !loading && logs.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={<ScrollText className="h-6 w-6" />}
            title="No audit logs"
            description="Once the backend exposes /api/audit-logs/list, a complete history of changes will appear here. Audit logs cannot be modified or deleted."
          />
        </Card>
      )}

      {!error && logs.length > 0 && (
        <Card className="p-0">
          {loading ? (
            <div className="p-5">
              <LoadingState rows={5} />
            </div>
          ) : (
            <Table
              columns={columns}
              data={logs as unknown as Record<string, unknown>[]}
              emptyMessage="No audit logs found."
            />
          )}
        </Card>
      )}
    </div>
  );
}