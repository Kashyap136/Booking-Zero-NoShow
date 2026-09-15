"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Scissors, Plus, Pencil, Trash2, Search } from "lucide-react";

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
  if (Array.isArray(raw)) return raw as Service[];
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d?.services)) return d.services as Service[];
  if (Array.isArray(d?.data)) return d.data as Service[];
  return [];
}

function normalizeStaff(raw: unknown): StaffOption[] {
  const arr = Array.isArray(raw)
    ? raw
    : ((raw as Record<string, unknown>)?.staff ??
      (raw as Record<string, unknown>)?.data) as StaffOption[] | undefined;
  return (arr ?? []).map((s: Record<string, unknown>) => ({
    id: String(s.id ?? s._id ?? ""),
    name: String(s.name ?? "Staff"),
  }));
}

export default function AdminServicesPage() {
  const { addToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
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
      setServices(normalizeServices(svcRes.data));
      setStaffOptions(normalizeStaff(staffRes.data));
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
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.staffName?.toLowerCase().includes(q),
    );
  }, [services, search]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDuration("");
    setFormPrice("");
    setFormCategory("");
    setFormStaffId("");
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setFormName(s.name ?? "");
    setFormDuration(s.duration != null ? String(s.duration) : "");
    setFormPrice(s.price != null ? String(s.price) : "");
    setFormCategory(s.category ?? "");
    setFormStaffId(s.staffId ?? "");
    setFormErrors({});
    setModalOpen(true);
  }

  function validateForm(): boolean {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = "Service name is required";
    if (!formDuration || Number(formDuration) <= 0)
      e.duration = "Duration must be positive";
    if (formPrice === "" || Number(formPrice) < 0) e.price = "Price must be valid";
    if (!formCategory.trim()) e.category = "Category is required";
    if (!formStaffId) e.staffId = "Please select a staff member";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const companyId = getCompanyId();
      const payload = {
        companyId,
        name: formName.trim(),
        duration: Number(formDuration),
        price: Number(formPrice),
        category: formCategory.trim(),
        staffId: formStaffId,
      };
      if (editing) {
        await api.post("/api/services/update", { serviceId: editing.id, ...payload });
        addToast("Service updated", "success");
      } else {
        await api.post("/api/services/create", payload);
        addToast("Service created", "success");
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
      await api.post("/api/services/delete", {
        companyId: getCompanyId(),
        serviceId: deleting.id,
      });
      addToast("Service removed", "success");
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
      { key: "name", header: "Service" },
      { key: "category", header: "Category" },
      {
        key: "duration",
        header: "Duration",
        render: (s: Service) => `${s.duration} min`,
      },
      {
        key: "price",
        header: "Price",
        render: (s: Service) => formatCurrency(s.price),
      },
      { key: "staffName", header: "Staff" },
      {
        key: "actions",
        header: "",
        render: (s: Service) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(s)}
              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              aria-label={`Edit ${s.name}`}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleting(s)}
              className="rounded-lg p-1.5 text-danger hover:bg-danger-bg transition-colors"
              aria-label={`Delete ${s.name}`}
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
        title="Services"
        subtitle="Manage the services you offer and how they are priced"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      {error && <ErrorState message={error.message} status={error.status} onRetry={fetchData} />}

      {!error && (
        <Card className="p-0">
          <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <p className="text-xs text-muted">
                {services.length} service{services.length !== 1 ? "s" : ""}
                {filtered.length !== services.length ? ` · ${filtered.length} shown` : ""}
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
                placeholder="Search services…"
                aria-label="Search services"
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
              icon={<Scissors className="h-6 w-6" />}
              title="No services"
              description={services.length === 0
                ? "Create your first service to start accepting bookings."
                : "No services match your search."}
              action={
                services.length === 0 ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add Service
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={columns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyMessage="No services found."
            />
          )}
        </Card>
      )}

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Service" : "Add Service"}>
        <form onSubmit={handleSave} noValidate className="space-y-4">
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
              {editing ? "Save changes" : "Create Service"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => { if (!deleteInProgress) setDeleting(null); }} title="Remove service">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Remove <span className="font-semibold">{deleting.name}</span> from
              your services? Existing bookings for this service will keep their
              history.
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