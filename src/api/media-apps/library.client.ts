import { request, uploadToPresignedUrl } from '@/platform/http/client';
import { RESOURCES } from '@/platform/config';
import { reportDrift } from '@/platform/telemetry';
import type { Page } from '@/domain/shared/entity';
import type { AssetKind, Library, LibraryInput, LibraryListItem } from '@/domain/library/schema';
import { kindOf, titleFromFileName } from '@/domain/library/rules';
import { RawLibrary, RawLibraryList, type LibraryWrite, type RawLibrary as Raw } from './library.wire';

/** os-resources media API (gateway/media-apps.md): GET/PUT/DELETE /media/assets, POST /media/upload, presigned PUT for big files. */
const ROOT = `${RESOURCES}/api/v1/admin/media`;
interface Opts {
  signal?: AbortSignal;
}
export interface LibraryQuery {
  search?: string;
  kind?: AssetKind;
  folder?: string;
  page?: number;
  limit?: number;
}

/** Transform once, into a new object. Nothing above this mutates the result. */
export const toAsset = (w: Raw): Library => ({
  id: w.id,
  title: w.title?.trim() || titleFromFileName(w.file_name),
  fileName: w.file_name,
  kind: kindOf(w.mime_type),
  mimeType: w.mime_type,
  url: w.url,
  thumbnailUrl: w.thumbnail_url ?? undefined,
  sizeBytes: w.size_bytes,
  width: w.width ?? undefined,
  height: w.height ?? undefined,
  altText: w.alt_text ?? undefined,
  tags: w.tags ?? [],
  folder: w.folder ?? undefined,
  usedIn: w.used_in ?? 0,
  createdAt: w.created_at,
  updatedAt: w.updated_at,
});
export const toWire = (i: LibraryInput): LibraryWrite => ({
  title: i.title,
  alt_text: i.altText || null,
  tags: i.tags,
  folder: i.folder || null,
});

export async function listAssets(q: LibraryQuery, { signal }: Opts = {}): Promise<Page<LibraryListItem>> {
  const page = q.page ?? 1;
  const limit = q.limit ?? 50;
  const { body } = await request(`${ROOT}/assets`, { params: { search: q.search, type: q.kind, folder: q.folder, page, limit }, signal });
  const parsed = RawLibraryList.safeParse(body);
  if (!parsed.success) reportDrift('media-apps', 'GET /media/assets', parsed.error.issues);
  const data = parsed.success ? parsed.data : (body as ReturnType<typeof RawLibraryList.parse>);
  return { items: data.items.map(toAsset), page, limit, total: data.total, hasNext: page * limit < data.total };
}
export async function getAsset(id: string, { signal }: Opts = {}): Promise<Library> {
  const { body } = await request(`${ROOT}/assets/${id}`, { signal });
  return toAsset(RawLibrary.parse(body));
}
export async function searchAssets(text: string, limit: number, { signal }: Opts = {}): Promise<LibraryListItem[]> {
  return (await listAssets({ search: text, limit }, { signal })).items;
}
export async function updateAsset(i: LibraryInput & { id: string }, { signal }: Opts = {}): Promise<Library> {
  const { body } = await request(`${ROOT}/assets/${i.id}`, { method: 'PUT', body: toWire(i), signal });
  return toAsset(RawLibrary.parse(body));
}
export async function deleteAsset(id: string, { signal }: Opts = {}): Promise<void> {
  await request(`${ROOT}/assets/${id}`, { method: 'DELETE', signal });
}
export async function bulkDeleteAssets(
  ids: string[],
  { signal }: Opts = {},
): Promise<{ deleted: number; failed: { id: string; reason: string }[] }> {
  const { body } = await request<{ deleted?: number; failed?: { id: string; reason: string }[] }>(`${ROOT}/assets/bulk`, {
    method: 'DELETE',
    body: { ids },
    signal,
  });
  return { deleted: body?.deleted ?? ids.length, failed: body?.failed ?? [] };
}

/** Add by URL (the store already hosts the file): POST /media/assets with the link; the service fetches metadata. */
export async function addAssetFromUrl(i: { url: string; title?: string; folder?: string }, { signal }: Opts = {}): Promise<Library> {
  const { body } = await request(`${ROOT}/assets`, {
    method: 'POST',
    body: { url: i.url, title: i.title || null, folder: i.folder || null },
    signal,
  });
  return toAsset(RawLibrary.parse(body));
}

/** Upload a file: multipart to /media/upload for small files; presign + PUT + confirm above 8 MB (gateway/media-apps.md). */
export async function uploadAsset(file: File, meta: { title?: string; folder?: string } = {}, { signal }: Opts = {}): Promise<Library> {
  if (file.size <= 8 * 1024 * 1024) {
    const fd = new FormData();
    fd.append('file', file);
    if (meta.title) fd.append('title', meta.title);
    if (meta.folder) fd.append('folder', meta.folder);
    const { body } = await request(`${ROOT}/upload`, { method: 'POST', formData: fd, signal });
    return toAsset(RawLibrary.parse(body));
  }
  const { body: pre } = await request<{ asset_id: string; upload_url: string }>(`${ROOT}/upload/presign`, {
    method: 'POST',
    body: { file_name: file.name, mime_type: file.type, size_bytes: file.size, ...meta },
    signal,
  });
  await uploadToPresignedUrl(pre.upload_url, file);
  const { body } = await request(`${ROOT}/upload/confirm/${pre.asset_id}`, { method: 'POST', signal });
  return toAsset(RawLibrary.parse(body));
}
