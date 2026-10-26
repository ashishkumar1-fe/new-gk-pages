import { z } from 'zod';
import { EntitySchema, AddressSchema } from '@/domain/shared/entity';

/** What the app means by a location. Fields from docs/architecture/domain/inventory.md#location; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const LocationSchema = EntitySchema.extend({
  name: z.string(),
  address: AddressSchema.partial(),
  phone: z.string().optional(),
  active: z.boolean(),
  isDefault: z.boolean(),
  fulfillsOnlineOrders: z.boolean(),
  inventorySource: z.enum(['ratio', 'shopify', 'oms']),
  gstin: z.string().optional(),
  omsProvider: z.string().optional(), // set on create, fixed after
  facilityCode: z.string().optional(), // set on create, fixed after
});
export type Location = z.infer<typeof LocationSchema>;
export const LocationListItemSchema = LocationSchema;
export type LocationListItem = Location;
export const LocationInputSchema = LocationSchema.partial().extend({ id: z.string().optional() });
export type LocationInput = z.infer<typeof LocationInputSchema>;
