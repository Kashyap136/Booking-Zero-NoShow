"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import Badge from "@/components/ui/Badge";
import { Search, Users } from "lucide-react";

interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

function normalizeUsers(raw: unknown): UserRecord[] {
  if (Array.isArray(raw)) return raw as UserRecord[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.users)) return d.users as UserRecord[];
  if (Array.isArray(d?.data)) return d.data as UserRecord[];
  return [];
}

function roleVariant(role: string): "brand" | "neutral" | "info" | "success" {
  switch (role?.toLowerCase()) {
    case "admin":
      return "brand";
    case "staff":
      return "info";
    case "active":
      return "success";
    default:
      return "neutral";
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/users/list", {
        params: { companyId: getCompanyId() },
      });
      setUsers(normalizeUsers(res.data));
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Name", render: (u: UserRecord) => u.name || "—" },
      { key: "email", header: "Email", render: (u: UserRecord) => u.email || "—" },
      { key: "phone", header: "Phone", render: (u: UserRecord) => u.phone || "—" },
      {
        key: "role",
        header: "Role",
        render: (u: UserRecord) => (
          <Badge variant={roleVariant(u.role ?? "")}>{u.role || "—"}</Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Accounts with access to this company workspace"
      />

      {error && (
        <ErrorState
          message={error.message}
          status={error.status}
          onRetry={fetchData}
        />
      )}

      {!error && users.length === 0 && !loading && (
        <Card className="p-0">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No user accounts"
            description="Once the backend exposes /api/users/list, accounts for this company will appear here."
          />
        </Card>
      )}

      {!error && users.length > 0 && (
        <Card className="p-0">
          <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <p className="text-xs text-muted">
                {users.length} user{users.length !== 1 ? "s" : ""}
                {filtered.length !== users.length
                  ? ` · ${filtered.length} shown`
                  : ""}
              </p>
            </div>
            <div className="relative sm:ml-auto sm:w-56">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                aria-label="Search users"
                className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-5">
              <LoadingState rows={4} />
            </div>
          ) : (
            <Table
              columns={columns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyMessage="No users found."
            />
          )}
        </Card>
      )}
    </div>
  );
}