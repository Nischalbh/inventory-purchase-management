
import Modal from "../../components/common/Modal";
import type { Product } from "../../types/api";

interface Props {
  product: Product;
  onClose: () => void;
}

function ProductDetails({ product, onClose }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: product.name },
    { label: "SKU", value: product.sku },
    { label: "Category", value: product.category },
    { label: "Description", value: product.description || "—" },
    { label: "Cost Price", value: Number(product.cost_price).toFixed(2) },
    { label: "Selling Price", value: Number(product.selling_price).toFixed(2) },
    { label: "Current Stock", value: String(product.current_stock) },
    { label: "Reorder Level", value: String(product.reorder_level) },
    {
      label: "Stock Status",
      value:
        product.current_stock <= product.reorder_level ? "Low stock" : "Healthy",
    },
  ];

  return (
    <Modal title="Product Details" subtitle={product.sku} onClose={onClose}>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-3"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-slate-800">
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

export default ProductDetails;
