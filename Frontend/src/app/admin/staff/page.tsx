"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  eSSLId: string;
  salary: number;
}

function normalizeStaff(raw: unknown): StaffMember[] {
  if (Array.isArray(raw)) return raw as StaffMember[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.staff)) return d.staff as StaffMember[];
  if (Array.isArray(d?.data)) return d.data as StaffMember[];
  return [];
}

export default function AdminStaffPage() {
  const { addToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEssl, setFormEssl] = useState("");
  const [formSalary, setFormSalary] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/staff/list", {
        params: { companyId: getCompanyId() },
      });
      setStaff(normalizeStaff(res.data));
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
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.eSSLId?.toLowerCase().includes(q),
    );
  }, [staff, search]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormPhone("");
    setFormEssl("");
    setFormSalary("");
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(m: StaffMember) {
    setEditing(m);
    setFormName(m.name ?? "");
    setFormPhone(m.phone ?? "");
    setFormEssl(m.eSSLId ?? "");
    setFormSalary(m.salary != null ? String(m.salary) : "");
    setFormErrors({});
    setModalOpen(true);
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = "Name is required";
    if (!formPhone.trim()) e.phone = "Phone is required";
    else if (!/^\d{7,15}$/.test(formPhone.replace(/[\s\-+()]/g, "")))
      e.phone = "Enter a valid phone number";
    if (!formSalary || Number(formSalary) < 0) e.salary = "Salary must be valid";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        companyId: getCompanyId(),
        name: formName.trim(),
        phone: formPhone.trim(),
        eSSLId: formEssl.trim(),
        salary: Number(formSalary),
      };
      if (editing) {
        await api.post("/api/staff/update", {
          staffId: editing.id,
          ...payload,
        });
        addToast("Staff member updated", "success");
      } else {
        await api.post("/api/staff/create", payload);
        addToast("Staff member added", "success");
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(toApiError(err).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteInProgress(true);
    try {
      await api.post("/api/staff/delete", {
        companyId: getCompanyId(),
        staffId: deleting.id,
      });
      addToast("Staff member removed", "success");
      setDeleting(null);
      fetchData();
    } catch (err) {
      addToast(toApiError(err).message, "error");
    } finally {
      setDeleteInProgress(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "name", header: "Name" },
      { key: "phone", header: "Phone" },
      { key: "eSSLId", header: "eSSL ID" },
      {
        key: "salary",
        header: "Salary",
        render: (m: StaffMember) => formatCurrency(m.salary),
      },
      {
        key: "actions",
        header: "",
        render: (m: StaffMember) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(m)}
              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              aria-label={`Edit ${m.name}`}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleting(m)}
              className="rounded-lg p-1.5 text-danger hover:bg-danger-bg transition-colors"
              aria-label={`Delete ${m.name}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
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
        title="Staff"
        subtitle="Manage staff members tied to bookings and attendance"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <p className="text-xs text-muted">
                {staff.length} staff member{staff.length !== 1 ? "s" : ""}
                {filtered.length !== staff.length ? ` · ${filtered.length} shown` : ""}
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
                placeholder="Search staff…"
                aria-label="Search staff"
                className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-5">
              <LoadingState rows={4} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No staff members"
              description={staff.length === 0
                ? "Add your first staff member to get started."
                : "No staff match your search."}
              action={
                staff.length === 0 ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add Staff
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={columns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyMessage="No staff found."
            />
          )}
        </Card>
      )}

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Staff Member" : "Add Staff Member"}>
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <Input
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.name}
            placeholder="e.g. Anjali Kulkarni"
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
          <Input
            label="eSSL ID"
            value={formEssl}
            onChange={(e) => setFormEssl(e.target.value)}
            placeholder="Biometric device ID"
          />
          <Input
            label="Salary"
            type="number"
            min={0}
            value={formSalary}
            onChange={(e) => setFormSalary(e.target.value)}
            error={formErrors.salary}
            placeholder="e.g. 15000"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add Staff"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => { if (!deleteInProgress) setDeleting(null); }} title="Remove staff member">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Remove <span className="font-semibold">{deleting.name}</span> from
              your staff? This may affect existing bookings and services assigned
              to them.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleting(null)}
                disabled={deleteInProgress}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteInProgress}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}