import { http, HttpResponse, delay } from 'msw';
import list from './fixtures/library.list.json';
import type { LibraryWrite, RawLibrary } from './library.wire';

/** In-memory os-resources media API seeded from the recorded fixture. Same shapes the real service sends. */
const store = new Map<string, RawLibrary>((list.items as RawLibrary[]).map((a) => [a.id, a]));
let seq = 2000;
const now = () => new Date().toISOString();
const reqId = () => ({ 'x-request-id': Math.random().toString(16).slice(2, 18) });
const kindOf = (m: string) => (m.startsWith('image/') ? 'image' : m.startsWith('video/') ? 'video' : 'document');

export const libraryHandlers = [
  http.get('*/api/v1/admin/media/assets', async ({ request }) => {
    await delay(250);
    const u = new URL(request.url);
    const search = (u.searchParams.get('search') ?? '').toLowerCase();
    const type = u.searchParams.get('type');
    const folder = u.searchParams.get('folder');
    const page = Number(u.searchParams.get('page') ?? 1);
    const limit = Number(u.searchParams.get('limit') ?? 50);
    let rows = [...store.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (search) rows = rows.filter((a) => `${a.title ?? ''} ${a.file_name} ${(a.tags ?? []).join(' ')}`.toLowerCase().includes(search));
    if (type) rows = rows.filter((a) => kindOf(a.mime_type) === type);
    if (folder) rows = rows.filter((a) => a.folder === folder);
    return HttpResponse.json({ items: rows.slice((page - 1) * limit, page * limit), total: rows.length }, { headers: reqId() });
  }),
  http.get('*/api/v1/admin/media/assets/:id', async ({ params }) => {
    await delay(150);
    const a = store.get(String(params.id));
    return a
      ? HttpResponse.json(a, { headers: reqId() })
      : HttpResponse.json({ code: 'NOT_FOUND', message: 'Asset not found' }, { status: 404, headers: reqId() });
  }),
  http.post('*/api/v1/admin/media/assets', async ({ request }) => {
    await delay(400);
    const b = (await request.json()) as { url: string; title?: string | null; folder?: string | null };
    if (!/^https?:\/\//.test(b.url ?? ''))
      return HttpResponse.json(
        { message: 'Enter a valid URL', errors: [{ field: 'url', message: 'Enter a valid URL' }] },
        { status: 400, headers: reqId() },
      );
    const file = b.url.split('/').pop() || 'asset';
    const ext = (file.split('.').pop() ?? '').toLowerCase();
    const mime = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
      ? `image/${ext === 'jpg' ? 'jpeg' : ext}`
      : ext === 'mp4'
        ? 'video/mp4'
        : ext === 'pdf'
          ? 'application/pdf'
          : 'image/jpeg';
    const a: RawLibrary = {
      id: `ast_${++seq}`,
      title: b.title ?? null,
      file_name: file,
      mime_type: mime,
      url: b.url,
      thumbnail_url: mime.startsWith('image/') ? b.url : null,
      size_bytes: 120000 + Math.floor(Math.random() * 900000),
      width: 1200,
      height: 800,
      alt_text: null,
      tags: [],
      folder: b.folder ?? null,
      used_in: 0,
      created_at: now(),
      updated_at: now(),
    };
    store.set(a.id, a);
    return HttpResponse.json(a, { status: 201, headers: reqId() });
  }),
  http.put('*/api/v1/admin/media/assets/:id', async ({ params, request }) => {
    await delay(300);
    const prev = store.get(String(params.id));
    if (!prev) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Asset not found' }, { status: 404, headers: reqId() });
    const b = (await request.json()) as LibraryWrite;
    const next: RawLibrary = { ...prev, title: b.title, alt_text: b.alt_text, tags: b.tags, folder: b.folder, updated_at: now() };
    store.set(next.id, next);
    return HttpResponse.json(next, { headers: reqId() });
  }),
  http.delete('*/api/v1/admin/media/assets/bulk', async ({ request }) => {
    await delay(300);
    const { ids } = (await request.json()) as { ids: string[] };
    const failed: { id: string; reason: string }[] = [];
    let deleted = 0;
    for (const id of ids) {
      const a = store.get(id);
      if (!a) continue;
      if ((a.used_in ?? 0) > 0) failed.push({ id, reason: `Used in ${a.used_in} place${a.used_in === 1 ? '' : 's'}` });
      else {
        store.delete(id);
        deleted++;
      }
    }
    return HttpResponse.json({ deleted, failed }, { headers: reqId() });
  }),
  http.delete('*/api/v1/admin/media/assets/:id', async ({ params }) => {
    await delay(200);
    const a = store.get(String(params.id));
    if (!a) return HttpResponse.json({ message: 'Not found' }, { status: 404, headers: reqId() });
    if ((a.used_in ?? 0) > 0)
      return HttpResponse.json({ code: 'ASSET_IN_USE', message: `Used in ${a.used_in} places` }, { status: 409, headers: reqId() });
    store.delete(a.id);
    return new HttpResponse(null, { status: 204, headers: reqId() });
  }),
  http.post('*/api/v1/admin/media/upload', async ({ request }) => {
    await delay(600);
    const fd = await request.formData();
    const f = fd.get('file') as File | null;
    if (!f) return HttpResponse.json({ message: 'file is required' }, { status: 400, headers: reqId() });
    const a: RawLibrary = {
      id: `ast_${++seq}`,
      title: (fd.get('title') as string) || null,
      file_name: f.name,
      mime_type: f.type || 'application/octet-stream',
      url: `https://picsum.photos/seed/${seq}/1200/800`,
      thumbnail_url: f.type.startsWith('image/') ? `https://picsum.photos/seed/${seq}/160/160` : null,
      size_bytes: f.size,
      width: f.type.startsWith('image/') ? 1200 : null,
      height: f.type.startsWith('image/') ? 800 : null,
      alt_text: null,
      tags: [],
      folder: (fd.get('folder') as string) || null,
      used_in: 0,
      created_at: now(),
      updated_at: now(),
    };
    store.set(a.id, a);
    return HttpResponse.json(a, { status: 201, headers: reqId() });
  }),
];
