
import { useState, type FormEvent } from "react";
import Modal from "../../components/common/Modal";
import {
  errorMessageFrom,
  type Supplier,
  type SupplierInput,
} from "../../types/api";
import { formatZodError, supplierSchema } from "../../validation/schemas";

interface Props {
  supplier: Supplier | null;
  onSubmit: (input: SupplierInput) => Promise<void>;
  onClose: () => void;
}

function SupplierForm({ supplier, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    address: supplier?.address ?? "",
    status: supplier?.status ?? ("ACTIVE" as Supplier["status"]),
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = supplierSchema.safeParse(form);
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address,
        status: parsed.data.status,
      });
      onClose();
    } catch (err) {
      setError(
        err && typeof err === "object" && "data" in err
          ? errorMessageFrom(
              (err as { data: unknown }).data,
              err instanceof Error ? err.message : "Unable to save supplier.",
            )
          : err instanceof Error
            ? err.message
            : "Unable to save supplier.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal
      title={supplier ? "Edit Supplier" : "Add Supplier"}
      subtitle={
        supplier ? "Update supplier details." : "Register a new supplier."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(event) => setField("status", event.target.value)}
              className={inputClass}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              required
              rows={3}
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : supplier
                ? "Save Changes"
                : "Create Supplier"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SupplierForm;
