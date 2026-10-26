import { z } from 'zod';

/** What os-resources sends for a media asset (docs/architecture/gateway/media-apps.md). Shaped from fixtures/library.list.json. */
export const RawLibrary = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  file_name: z.string(),
  mime_type: z.string(),
  url: z.string(),
  thumbnail_url: z.string().nullable().optional(),
  size_bytes: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  alt_text: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  folder: z.string().nullable().optional(),
  used_in: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RawLibrary = z.infer<typeof RawLibrary>;
export const RawLibraryList = z.object({ items: z.array(RawLibrary), total: z.number() });

/** PUT /media/assets/:id body: metadata only; the file never changes through this call. */
export interface LibraryWrite {
  title: string;
  alt_text: string | null;
  tags: string[];
  folder: string | null;
}
