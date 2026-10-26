import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a segment. Fields from docs/architecture/domain/customers.md#segment; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const SegmentSchema = EntitySchema.extend({
  name: z.string(),
  description: z.string(),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.unknown() })),
  logic: z.enum(['AND', 'OR']),
  customerCount: z.number().int(),
  active: z.boolean(),
});
export type Segment = z.infer<typeof SegmentSchema>;
export const SegmentListItemSchema = SegmentSchema;
export type SegmentListItem = Segment;
export const SegmentInputSchema = SegmentSchema.partial().extend({ id: z.string().optional() });
export type SegmentInput = z.infer<typeof SegmentInputSchema>;
