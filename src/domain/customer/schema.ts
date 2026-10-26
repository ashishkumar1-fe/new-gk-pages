import { z } from 'zod';
import { EntitySchema, AddressSchema, DateOnly } from '@/domain/shared/entity';
import { MoneySchema } from '@/domain/shared/money';

/**
 * What the app means by a customer. Fields from docs/architecture/domain/customers.md; wire shapes live in api/. Verify against a real sandbox response before freezing.
 *
 * Known conflicts, kept as today (see rules.ts `customerFormDefaults` / `customerReadDefaults`):
 * - taxSetting: the create form defaults to DONT_COLLECT_TAX (gk-pages components/customers/CreateCustomerForm.tsx:100)
 *   while the reader defaults to COLLECT_TAX (modules/customers/transformer.ts:52).
 * - language: the form schema defaults to 'English [Default]' (schemas/customerSchema.ts:17)
 *   while the transformer defaults to 'en' (modules/customers/transformer.ts:49).
 */
export const CustomerSchema = EntitySchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  emailDomain: z.string().optional(),
  phone: z.string().optional(), // primary identifier for many Indian customers
  company: z.string().optional(),
  status: z.enum(['active', 'blocked']),
  isDeleted: z.boolean(),
  defaultAddress: AddressSchema.optional(),
  tags: z.array(z.string()),
  note: z.string().optional(),
  language: z.string(),
  taxSetting: z.enum(['COLLECT_TAX', 'DONT_COLLECT_TAX']),
  marketing: z.object({ email: z.boolean(), sms: z.boolean(), push: z.boolean() }),
  anniversaryDate: DateOnly.optional(),
  stats: z.object({
    ordersCount: z.number().int(),
    amountSpent: MoneySchema,
    averageOrderValue: MoneySchema,
    firstOrderAt: z.string().optional(),
    lastOrderAt: z.string().optional(),
    abandonedCheckoutAt: z.string().optional(),
  }),
});
export type Customer = z.infer<typeof CustomerSchema>;
export const CustomerListItemSchema = CustomerSchema;
export type CustomerListItem = Customer;
export const CustomerInputSchema = CustomerSchema.partial().extend({ id: z.string().optional() });
export type CustomerInput = z.infer<typeof CustomerInputSchema>;
