
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  getAllPages,
} from "../../services/api";
import type { Supplier, SupplierInput } from "../../types/api";

export function listSuppliers(): Promise<Supplier[]> {
  return getAllPages<Supplier>("/api/suppliers/");
}

export function getSupplier(id: number): Promise<Supplier> {
  return apiGet<Supplier>(`/api/suppliers/${id}/`);
}

export function createSupplier(input: SupplierInput): Promise<Supplier> {
  return apiPost<Supplier>("/api/suppliers/", input);
}

/**
 * The backend supplier repository only persists the first field of a
 * multi-field PATCH, so each changed field is sent as its own request.
 */
export async function updateSupplier(
  id: number,
  input: Partial<SupplierInput>,
): Promise<Supplier> {
  let latest: Supplier | undefined;

  for (const [field, value] of Object.entries(input)) {
    latest = await apiPatch<Supplier>(`/api/suppliers/${id}/`, {
      [field]: value,
    });
  }

  return latest ?? getSupplier(id);
}

export function deleteSupplier(id: number): Promise<void> {
  return apiDelete(`/api/suppliers/${id}/`);
}
