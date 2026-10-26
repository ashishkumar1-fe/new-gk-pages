import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

/** What the app means by a refund. Fields from docs/architecture/domain/orders.md#refund; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const RefundSchema = EntitySchema.extend({
  orderId: z.string(),
  status: z.enum(['pending', 'processing', 'success', 'failed']),
  trigger: z.enum(['cancellation', 'merchant_initiated', 'edit_triggered', 'return']),
  restock: z.enum(['cancel', 'no_restock']),
  lines: z.array(
    z.object({
      lineItemId: z.string(),
      quantity: z.number().int(),
      unitPrice: MoneySchema,
      tax: MoneySchema,
      discount: MoneySchema,
      total: MoneySchema,
      restocked: z.boolean(),
    }),
  ),
  amounts: z.object({ subtotal: MoneySchema, tax: MoneySchema, discount: MoneySchema, shipping: MoneySchema, total: MoneySchema }),
  processedAt: z.string().optional(),
});
export type Refund = z.infer<typeof RefundSchema>;
export const RefundListItemSchema = RefundSchema;
export type RefundListItem = Refund;
export const RefundInputSchema = RefundSchema.partial().extend({ id: z.string().optional() });
export type RefundInput = z.infer<typeof RefundInputSchema>;
