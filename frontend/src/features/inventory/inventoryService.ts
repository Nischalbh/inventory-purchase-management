
import { apiGet, apiPost, getAllPages } from "../../services/api";
import type { InventoryTransaction, InventoryTransactionInput } from "../../types/api";

export function listInventoryTransactions(filters?: {
  product?: number;
  type?: string;
}): Promise<InventoryTransaction[]> {
  const params = new URLSearchParams();
  if (filters?.product) params.set("product", String(filters.product));
  if (filters?.type) params.set("type", filters.type);

  const query = params.toString();
  const endpoint = `/api/inventory/transactions/${query ? `?${query}` : ""}`;
  return getAllPages<InventoryTransaction>(endpoint);
}

export function getInventoryTransaction(
  id: number,
): Promise<InventoryTransaction> {
  return apiGet<InventoryTransaction>(`/api/inventory/transactions/${id}/`);
}

export function createInventoryTransaction(
  input: InventoryTransactionInput,
): Promise<InventoryTransaction> {
  return apiPost<InventoryTransaction>("/api/inventory/transactions/", input);
}
