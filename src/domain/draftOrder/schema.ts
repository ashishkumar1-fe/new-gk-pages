import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

/** What the app means by a draftOrder. Fields from docs/architecture/domain/orders.md#draft-order; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const DraftOrderSchema = EntitySchema.extend({
  number: z.number().int().optional(),
  status: z.enum(['open', 'invoice_sent', 'completed']),
  invoiceUrl: z.string().optional(),
  orderId: z.string().optional(),
  completedAt: z.string().optional(),
  customer: z.object({ id: z.string(), firstName: z.string().optional(), lastName: z.string().optional() }).optional(),
  lineItems: z.array(
    z.object({ id: z.string(), title: z.string(), quantity: z.number().int(), unitPrice: MoneySchema, custom: z.boolean().optional() }),
  ),
  totals: z.object({ subtotal: MoneySchema, discounts: MoneySchema, tax: MoneySchema, total: MoneySchema, outstanding: MoneySchema }),
  tags: z.array(z.string()),
  note: z.string().optional(),
});
export type DraftOrder = z.infer<typeof DraftOrderSchema>;
export const DraftOrderListItemSchema = DraftOrderSchema;
export type DraftOrderListItem = DraftOrder;
export const DraftOrderInputSchema = DraftOrderSchema.partial().extend({ id: z.string().optional() });
export type DraftOrderInput = z.infer<typeof DraftOrderInputSchema>;
