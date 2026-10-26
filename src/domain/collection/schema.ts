import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a collection. Fields from docs/architecture/domain/catalog.md#collection; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const CollectionSchema = EntitySchema.extend({
  title: z.string(),
  handle: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  kind: z.enum(['manual', 'smart']),
  rules: z
    .object({ match: z.enum(['all', 'any']), rules: z.array(z.object({ field: z.string(), operator: z.string(), value: z.string() })) })
    .optional(),
  sortOrder: z.enum(['manual', 'web', '']),
  productsCount: z.number().int(),
  published: z.boolean(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }),
  templateSuffix: z.string().optional(),
});
export type Collection = z.infer<typeof CollectionSchema>;
export const CollectionListItemSchema = CollectionSchema;
export type CollectionListItem = Collection;
export const CollectionInputSchema = CollectionSchema.partial().extend({ id: z.string().optional() });
export type CollectionInput = z.infer<typeof CollectionInputSchema>;
