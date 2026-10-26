import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

const ShippingSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
});

/** What the app means by a transfer. Fields from docs/architecture/domain/inventory.md#transfer; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const TransferSchema = EntitySchema.extend({
  referenceNumber: z.string().optional(),
  originLocationId: z.string(),
  destinationLocationId: z.string(),
  status: z.enum(['draft', 'pending', 'partially_received', 'received']),
  expectedAt: z.string().optional(),
  completedAt: z.string().optional(),
  shipping: ShippingSchema.optional(),
  note: z.string().optional(),
  tags: z.array(z.string()),
  lines: z.array(
    z.object({
      id: z.string(),
      inventoryItemId: z.string(),
      variantId: z.string().optional(),
      productId: z.string().optional(),
      title: z.string(),
      sku: z.string().optional(),
      quantityOrdered: z.number().int(),
      quantityReceived: z.number().int(),
      quantityRejected: z.number().int(),
    }),
  ),
});
export type Transfer = z.infer<typeof TransferSchema>;
export const TransferListItemSchema = TransferSchema;
export type TransferListItem = Transfer;
export const TransferInputSchema = TransferSchema.partial().extend({ id: z.string().optional() });
export type TransferInput = z.infer<typeof TransferInputSchema>;
