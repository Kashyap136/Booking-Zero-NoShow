"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Users, Plus } from "lucide-react";

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

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone" },
  { key: "eSSLId", header: "eSSL ID" },
  { key: "salary", header: "Salary", render: (item: StaffMember) => formatCurrency(item.salary) },
];

export default function StaffPage() {
  const { addToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormEssl("");
    setFormSalary("");
    setFormErrors({});
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

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await api.post("/api/staff/create", {
        companyId: getCompanyId(),
        name: formName.trim(),
        phone: formPhone.trim(),
        eSSLId: formEssl.trim(),
        salary: Number(formSalary),
      });
      addToast("Staff member added", "success");
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      addToast(toApiError(err).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage your staff members"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          {loading ? (
            <div className="p-5"><LoadingState rows={4} /></div>
          ) : staff.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No staff members yet"
              description="Add your first staff member to get started."
              action={
                <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
              }
            />
          ) : (
            <Table
              columns={COLUMNS}
              data={staff as unknown as Record<string, unknown>[]}
              emptyMessage="No staff found."
            />
          )}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleCreate} noValidate className="space-y-4">
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
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}