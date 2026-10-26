import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

/** What the app means by a order. Fields from docs/architecture/domain/orders.md; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const OrderSchema = EntitySchema.extend({
  name: z.string(), // "#1042"
  status: z.enum(['open', 'archived', 'cancelled']),
  financialStatus: z.enum(['pending', 'partially_paid', 'paid', 'refund_pending', 'partially_refunded', 'refunded', 'voided']),
  fulfillmentStatus: z.enum(['unfulfilled', 'partially_fulfilled', 'fulfilled', 'shipped', 'delivered']),
  customer: z
    .object({
      id: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  lineItems: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      sku: z.string().optional(),
      quantity: z.number().int(),
      originalQuantity: z.number().int().optional(),
      currentQuantity: z.number().int(),
      fulfillableQuantity: z.number().int(),
      unitPrice: MoneySchema,
      discountAllocations: z.array(z.object({ amount: MoneySchema })),
    }),
  ),
  totals: z.object({ subtotal: MoneySchema, discounts: MoneySchema, tax: MoneySchema, total: MoneySchema, outstanding: MoneySchema }),
  payment: z.object({ method: z.string(), gateways: z.array(z.string()) }),
  discountCodes: z.array(z.object({ code: z.string(), amount: MoneySchema, type: z.string() })),
  // Only the fields the edit-block rule reads (modules/order/constants.ts:145); wire `target_selection` → targetSelection.
  discountApplications: z
    .array(z.object({ source: z.string().optional(), type: z.string().optional(), targetSelection: z.string().optional() }))
    .optional(),
  tags: z.array(z.string()),
  note: z.string().optional(),
  sourceName: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelReason: z.string().optional(),
  closedAt: z.string().optional(),
  statusUrl: z.string().optional(),
});
export type Order = z.infer<typeof OrderSchema>;
export const OrderListItemSchema = OrderSchema;
export type OrderListItem = Order;
export const OrderInputSchema = OrderSchema.partial().extend({ id: z.string().optional() });
export type OrderInput = z.infer<typeof OrderInputSchema>;
