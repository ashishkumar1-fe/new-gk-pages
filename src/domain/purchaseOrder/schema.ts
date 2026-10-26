import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

const ShippingSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
});

/** What the app means by a purchaseOrder. Fields from docs/architecture/domain/inventory.md#purchase-order; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const PurchaseOrderSchema = EntitySchema.extend({
  referenceNumber: z.string().optional(),
  supplier: z.object({ id: z.string(), companyName: z.string() }),
  destinationLocationId: z.string(),
  status: z.enum(['draft', 'ordered', 'partially_received', 'received', 'closed']),
  expectedAt: z.string().optional(),
  receivedAt: z.string().optional(),
  paymentTerms: z.string().optional(),
  supplierCurrency: z.string().optional(),
  shipping: ShippingSchema.optional(),
  noteToSupplier: z.string().optional(),
  tags: z.array(z.string()),
  quantityOrdered: z.number().int(),
  quantityReceived: z.number().int(),
  lines: z.array(
    z.object({
      id: z.string(),
      inventoryItemId: z.string(),
      variantId: z.string().optional(),
      productId: z.string().optional(),
      title: z.string(),
      sku: z.string().optional(),
      supplierSku: z.string().optional(),
      quantityOrdered: z.number().int(),
      quantityReceived: z.number().int(),
      quantityRejected: z.number().int(),
      costPerUnit: MoneySchema,
      lineTotal: MoneySchema,
      tax: z.string().optional(), // rupee decimal string as sent; display only, not in totals
    }),
  ),
  totalCost: MoneySchema,
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export const PurchaseOrderListItemSchema = PurchaseOrderSchema;
export type PurchaseOrderListItem = PurchaseOrder;
export const PurchaseOrderInputSchema = PurchaseOrderSchema.partial().extend({ id: z.string().optional() });
export type PurchaseOrderInput = z.infer<typeof PurchaseOrderInputSchema>;
