import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/** What the app means by a inventory. Fields from docs/architecture/domain/inventory.md; wire shapes live in api/. Verify against a real sandbox response before freezing. */
export const InventorySchema = EntitySchema.extend({
  inventoryItemId: z.string(),
  locationId: z.string(),
  available: z.number().int(),
  committed: z.number().int(), // order-driven; never set by the admin
  codCommitted: z.number().int(),
  onHand: z.number().int(),
  unavailable: z.object({
    reserved: z.number().int(),
    damaged: z.number().int(),
    qualityControl: z.number().int(),
    safetyStock: z.number().int(),
  }),
  incoming: z.number().int(), // total only
  reorderPoint: z.number().int().optional(),
  version: z.number().int(),
});
export type Inventory = z.infer<typeof InventorySchema>;
export const InventoryListItemSchema = InventorySchema;
export type InventoryListItem = Inventory;
export const InventoryInputSchema = InventorySchema.partial().extend({ id: z.string().optional() });
export type InventoryInput = z.infer<typeof InventoryInputSchema>;

/** Quantity buckets a level carries. docs/architecture/domain/inventory.md */
export type QuantityName = 'available' | 'committed' | 'incoming' | 'reserved' | 'damaged' | 'safetyStock' | 'qualityControl';
/** What the adjust popover can set; committed is order-driven. */
export type MutableQuantityName = Exclude<QuantityName, 'committed'> | 'onHand';
/** Admin-written adjustment reasons (VariantAdjustPopover.tsx:55, must stay inside V3AdjustmentReason). */
export type AdjustReason = 'correction' | 'received' | 'damaged' | 'safetyStockSet' | 'import' | 'other';
