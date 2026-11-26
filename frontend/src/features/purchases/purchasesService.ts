
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  getAllPages,
} from "../../services/api";
import type {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderItem,
  PurchaseOrderItemInput,
  PurchaseOrderUpdate,
} from "../../types/api";

export function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  return getAllPages<PurchaseOrder>("/api/purchase-orders/");
}

export function getPurchaseOrder(id: number): Promise<PurchaseOrder> {
  return apiGet<PurchaseOrder>(`/api/purchase-orders/${id}/`);
}

export function createPurchaseOrder(
  input: PurchaseOrderInput,
): Promise<PurchaseOrder> {
  return apiPost<PurchaseOrder>("/api/purchase-orders/", input);
}

export function updatePurchaseOrder(
  id: number,
  input: PurchaseOrderUpdate,
): Promise<PurchaseOrder> {
  return apiPatch<PurchaseOrder>(`/api/purchase-orders/${id}/`, input);
}

export function deletePurchaseOrder(id: number): Promise<void> {
  return apiDelete(`/api/purchase-orders/${id}/`);
}

export function listOrderItems(orderId: number): Promise<PurchaseOrderItem[]> {
  return getAllPages<PurchaseOrderItem>(
    `/api/purchase-orders/${orderId}/items/`,
  );
}

export function createOrderItem(
  orderId: number,
  input: PurchaseOrderItemInput,
): Promise<PurchaseOrderItem> {
  return apiPost<PurchaseOrderItem>(
    `/api/purchase-orders/${orderId}/items/`,
    input,
  );
}

export function deleteOrderItem(itemId: number): Promise<void> {
  return apiDelete(`/api/purchase-orders/items/${itemId}/`);
}
