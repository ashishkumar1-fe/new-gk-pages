import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a discountSet. Fields from docs/architecture/domain/discounts.md#discount (bulk codes); wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const DiscountSetSchema = EntitySchema.extend({
  title: z.string(),
  kind: z.enum(['order', 'product', 'gift_with_purchase']),
  code: z.string().optional(),
  status: z.enum(['draft', 'published', 'inactive', 'deleted']),
  bulkCampaign: z
    .object({
      id: z.string(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      codeLength: z.number().int(),
      totalCodes: z.number().int(),
      usesPerCode: z.number().int(),
      status: z.string(),
      codesFileKey: z.string().optional(),
    })
    .optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
});
export type DiscountSet = z.infer<typeof DiscountSetSchema>;
export const DiscountSetListItemSchema = DiscountSetSchema;
export type DiscountSetListItem = DiscountSet;
export const DiscountSetInputSchema = DiscountSetSchema.partial().extend({ id: z.string().optional() });
export type DiscountSetInput = z.infer<typeof DiscountSetInputSchema>;
