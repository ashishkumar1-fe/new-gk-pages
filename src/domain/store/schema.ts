import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a store. Fields from docs/architecture/domain/store.md; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const StoreSchema = EntitySchema.extend({
  merchantNumber: z.number().int(),
  name: z.string(),
  platform: z.string(),
  products: z.record(z.boolean()), // config.selected_products; pages = entitlement
  mode: z.enum(['live', 'test']),
  currency: z.string(),
  timezone: z.string(),
  seoDefaults: z.object({ title: z.string().optional(), description: z.string().optional() }),
});
export type Store = z.infer<typeof StoreSchema>;
export const StoreListItemSchema = StoreSchema;
export type StoreListItem = Store;
export const StoreInputSchema = StoreSchema.partial().extend({ id: z.string().optional() });
export type StoreInput = z.infer<typeof StoreInputSchema>;
