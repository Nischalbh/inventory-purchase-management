
import Modal from "../../components/common/Modal";
import type { Supplier } from "../../types/api";

interface Props {
  supplier: Supplier;
  onClose: () => void;
}

function SupplierDetails({ supplier, onClose }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: supplier.name },
    { label: "Email", value: supplier.email },
    { label: "Phone", value: supplier.phone },
    { label: "Address", value: supplier.address },
    { label: "Status", value: supplier.status },
  ];

  return (
    <Modal title="Supplier Details" subtitle={supplier.name} onClose={onClose}>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 py-3"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="max-w-[60%] text-right text-sm font-medium text-slate-800">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default SupplierDetails;
