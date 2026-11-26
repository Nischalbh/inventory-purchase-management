
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  getAllPages,
} from "../../services/api";
import type { Product, ProductInput } from "../../types/api";

export function listProducts(): Promise<Product[]> {
  return getAllPages<Product>("/api/products/");
}

export function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/api/products/${id}/`);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiPost<Product>("/api/products/", input);
}

export function updateProduct(
  id: number,
  input: Partial<ProductInput>,
): Promise<Product> {
  return apiPatch<Product>(`/api/products/${id}/`, input);
}

export function deleteProduct(id: number): Promise<void> {
  return apiDelete(`/api/products/${id}/`);
}
