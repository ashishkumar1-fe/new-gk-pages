import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a priceSchedule. Fields from docs/architecture/domain/pricing-tax.md#price-schedules; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const RecurrenceTimeSchema = z.object({
  hour: z.number().int(),
  minute: z.number().int(),
  second: z.number().int(),
  dayOfWeek: z.number().int().optional(),
  dayOfMonth: z.number().int().optional(),
  month: z.number().int().optional(),
});
export type RecurrenceTime = z.infer<typeof RecurrenceTimeSchema>;

export const PriceScheduleSchema = EntitySchema.extend({
  name: z.string(),
  description: z.string().optional(),
  status: z.string(),
  // value: percent, or paise for change_to and amounts
  action: z.object({
    field: z.enum(['price', 'compare_at_price']),
    kind: z.enum(['change_to', 'increase_percent', 'decrease_percent', 'increase_amount', 'decrease_amount']),
    value: z.number(),
  }),
  roundToNearest: z.boolean(),
  keepOldPriceAsCompareAt: z.boolean(),
  products: z.union([z.object({ all: z.literal(true) }), z.object({ filters: z.record(z.unknown()) })]).optional(),
  execution: z.union([
    z.object({ type: z.literal('once'), startAt: z.string().optional() }),
    z.object({
      type: z.literal('recurring'),
      pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      at: RecurrenceTimeSchema.optional(),
      endAt: z.string(),
    }),
  ]),
  notifyCustomers: z.boolean().optional(),
});
export type PriceSchedule = z.infer<typeof PriceScheduleSchema>;
export const PriceScheduleListItemSchema = PriceScheduleSchema;
export type PriceScheduleListItem = PriceSchedule;
export const PriceScheduleInputSchema = PriceScheduleSchema.partial().extend({ id: z.string().optional() });
export type PriceScheduleInput = z.infer<typeof PriceScheduleInputSchema>;
