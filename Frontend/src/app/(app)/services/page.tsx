"use client";

import { useState, useEffect, useCallback } from "react";
import { api, toApiError, ApiError } from "@/lib/api";
import { getCompanyId } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Scissors, Plus } from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  staffName: string;
  staffId: string;
}

interface StaffOption {
  id: string;
  name: string;
}

function normalizeServices(raw: unknown): Service[] {
  const items = Array.isArray(raw)
    ? raw
    : ((raw as Record<string, unknown>)?.services as unknown[]) ??
      ((raw as Record<string, unknown>)?.data as unknown[]) ??
      [];
  return items.map((item) => {
    const s = item as Record<string, unknown>;
    return {
      id: String(s._id ?? s.id ?? ""),
      name: (s.title as string) ?? (s.name as string) ?? "",
      category: (s.category as string) ?? "",
      duration: Number(s.durationMins ?? s.duration ?? 0),
      price: Number(s.price ?? 0),
      staffName: (s.staffName as string) ?? "",
      staffId: String(s.staffId ?? ""),
    };
  });
}

function normalizeStaff(raw: unknown): StaffOption[] {
  const arr = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.staff ?? (raw as Record<string, unknown>)?.data) as StaffOption[] | undefined;
  return (arr ?? []).map((s: Record<string, unknown>) => ({
    id: String(s.id ?? s._id ?? ""),
    name: String(s.name ?? "Staff"),
  }));
}

const COLUMNS = [
  { key: "name", header: "Service" },
  { key: "category", header: "Category" },
  { key: "duration", header: "Duration", render: (item: Service) => `${item.duration} min` },
  { key: "price", header: "Price", render: (item: Service) => formatCurrency(item.price) },
  { key: "staffName", header: "Staff" },
];

export default function ServicesPage() {
  const { addToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStaffId, setFormStaffId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyId = getCompanyId();
      const [svcRes, staffRes] = await Promise.all([
        api.get("/api/services/list", { params: { companyId } }),
        api.get("/api/staff/list", { params: { companyId } }),
      ]);
      const options = normalizeStaff(staffRes.data);
      const byId = new Map(options.map((s) => [s.id, s.name]));
      setServices(
        normalizeServices(svcRes.data).map((service) => ({
          ...service,
          staffName: service.staffName || byId.get(service.staffId) || "—",
        })),
      );
      setStaffOptions(options);
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
    setFormDuration("");
    setFormPrice("");
    setFormCategory("");
    setFormStaffId("");
    setFormErrors({});
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = "Service name is required";
    if (!formDuration || Number(formDuration) <= 0) e.duration = "Duration must be positive";
    if (!formPrice || Number(formPrice) < 0) e.price = "Price must be valid";
    if (!formCategory.trim()) e.category = "Category is required";
    if (!formStaffId) e.staffId = "Please select a staff member";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const companyId = getCompanyId();
      await api.post("/api/services/create", {
        companyId,
        title: formName.trim(),
        durationMins: Number(formDuration),
        price: Number(formPrice),
        category: formCategory.trim(),
        staffId: formStaffId,
      });
      addToast("Service created successfully", "success");
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      const apiErr = toApiError(err);
      addToast(apiErr.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Manage the services you offer"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          {loading ? (
            <div className="p-5"><LoadingState rows={4} /></div>
          ) : services.length === 0 ? (
            <EmptyState
              icon={<Scissors className="h-6 w-6" />}
              title="No services yet"
              description="Create your first service to start accepting bookings."
              action={
                <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add Service
                </Button>
              }
            />
          ) : (
            <Table
              columns={COLUMNS}
              data={services as unknown as Record<string, unknown>[]}
              emptyMessage="No services found."
            />
          )}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Service">
        <form onSubmit={handleCreate} noValidate className="space-y-4">
          <Input
            label="Service Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.name}
            placeholder="e.g. Haircut"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={formDuration}
              onChange={(e) => setFormDuration(e.target.value)}
              error={formErrors.duration}
              placeholder="30"
              required
            />
            <Input
              label="Price"
              type="number"
              min={0}
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              error={formErrors.price}
              placeholder="500"
              required
            />
          </div>
          <Input
            label="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            error={formErrors.category}
            placeholder="e.g. Hair, Facial, Massage"
            required
          />
          <Select
            label="Staff"
            options={staffOptions.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select staff member"
            value={formStaffId}
            onChange={(e) => setFormStaffId(e.target.value)}
            error={formErrors.staffId}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}