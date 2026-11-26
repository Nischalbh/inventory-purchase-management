export interface DraftOrderItem {
  key: string;
  product: number | "";
  quantity: string;
  unit_cost: string;
}

export function createDraftItem(): DraftOrderItem {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    product: "",
    quantity: "1",
    unit_cost: "0",
  };
}

export function lineTotal(item: DraftOrderItem): number {
  const quantity = Number(item.quantity);
  const cost = Number(item.unit_cost);
  if (Number.isNaN(quantity) || Number.isNaN(cost)) return 0;
  return quantity * cost;
}
