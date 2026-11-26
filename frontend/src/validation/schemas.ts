
import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const nonNegativeNumber = z
  .string()
  .trim()
  .min(1, "Value is required.")
  .refine(
    (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
    "Must be a non-negative number.",
  );

const nonNegativeInteger = nonNegativeNumber.refine(
  (value) => Number.isInteger(Number(value)),
  "Must be a whole number.",
);

const positiveInteger = z
  .string()
  .trim()
  .min(1, "Value is required.")
  .refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
    "Must be at least 1.",
  );

export const loginSchema = z.object({
  username: requiredText("Username"),
  password: requiredText("Password"),
});

export const productSchema = z.object({
  name: requiredText("Name"),
  sku: requiredText("SKU")
    .min(2, "SKU must be at least 2 characters.")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "SKU may only contain letters, numbers, dots, dashes or underscores.",
    ),
  category: requiredText("Category"),
  description: z.string(),
  cost_price: nonNegativeNumber,
  selling_price: nonNegativeNumber,
  current_stock: nonNegativeInteger,
  reorder_level: nonNegativeInteger,
});

export const supplierSchema = z.object({
  name: requiredText("Name"),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: requiredText("Phone"),
  address: requiredText("Address"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const purchaseOrderSchema = z.object({
  supplier: requiredText("Supplier"),
  expected_delivery_date: z.string(),
  notes: z.string(),
  status: z.enum(["DRAFT", "SUBMITTED", "RECEIVED", "CANCELLED"]),
});

export const orderItemSchema = z.object({
  product: positiveInteger,
  quantity: positiveInteger,
  unit_cost: nonNegativeNumber,
});

export const inventorySchema = z
  .object({
    product: positiveInteger,
    transaction_type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
    quantity: nonNegativeInteger,
    notes: z.string(),
  })
  .superRefine((data, ctx) => {
    if (
      data.transaction_type !== "ADJUSTMENT" &&
      Number(data.quantity) < 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be at least 1.",
      });
    }
  });

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
