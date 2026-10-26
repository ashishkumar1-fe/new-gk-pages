import { z } from 'zod';
import { EntitySchema } from '@/domain/shared/entity';

/**
 * Content library: one media asset (image, video or document) the store uploaded. Backed by os-resources
 * (docs/architecture/gateway/media-apps.md). Fields in domain names; the wire shape lives in api/media-apps.
 */
export const AssetKind = z.enum(['image', 'video', 'document']);
export type AssetKind = z.infer<typeof AssetKind>;

export const LibrarySchema = EntitySchema.extend({
  title: z.string(),
  fileName: z.string(),
  kind: AssetKind,
  mimeType: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  sizeBytes: z.number().int(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()),
  folder: z.string().optional(),
  /** places this asset is referenced (products, pages); 0 = safe to delete */
  usedIn: z.number().int(),
});
export type Library = z.infer<typeof LibrarySchema>;

export const LibraryListItemSchema = LibrarySchema;
export type LibraryListItem = Library;

/** Editor draft: what the asset editor holds. The file itself never changes here; upload is a command. */
export const LibraryInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Title is required'),
  altText: z.string().max(125, 'Keep alt text under 125 characters').optional(),
  tags: z.array(z.string()).default([]),
  folder: z.string().optional(),
});
export type LibraryInput = z.infer<typeof LibraryInputSchema>;
