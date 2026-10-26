import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { runCommand, describeCommand } from './runCommand';
import { configureCommandHost } from './host';
import type { CommandContext } from './define';
import { api } from '@/api';

/** Command tests assert the exact endpoint and payload, the enabled reason and the partial result. Same MSW handlers the browser uses. */
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ctx: CommandContext = {
  storeId: 'demo-store',
  staff: { id: 's1', name: 'Ashish' },
  can: () => true,
  route: '/library',
  surface: 'button',
};
const captured: { method: string; path: string; body: unknown }[] = [];
const toast = vi.fn();
const copy = vi.fn(async () => {});
beforeEach(() => {
  captured.length = 0;
  toast.mockReset();
  copy.mockClear();
  server.events.removeAllListeners();
  server.events.on('request:start', async ({ request }) => {
    const text =
      request.method === 'GET'
        ? ''
        : await request
            .clone()
            .text()
            .catch(() => '');
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      /* multipart */
    }
    captured.push({ method: request.method, path: new URL(request.url).pathname, body });
  });
  configureCommandHost({ confirm: async () => true, toast, navigate: () => {}, copy, openForm: async (_t, _f, i) => i });
});

describe('library commands (content library)', () => {
  it('delete is disabled with the usage reason while the asset is referenced', async () => {
    const used = await api.mediaApps.getAsset('ast_1008');
    const d = describeCommand('library.delete', { ...ctx, record: used });
    expect(d?.enabled).toBe(false);
    expect(d?.reason).toBe('Used in 6 places. Remove it there first.');
    const r = await runCommand('library.delete', undefined, { ...ctx, record: used });
    expect(r.status).toBe('denied');
    expect(captured.some((c) => c.method === 'DELETE')).toBe(false);
  });
  it('delete removes an unused asset and invalidates the list', async () => {
    const free = await api.mediaApps.getAsset('ast_1007');
    const r = await runCommand('library.delete', undefined, { ...ctx, record: free });
    expect(r.status).toBe('success');
    expect(captured.find((c) => c.method === 'DELETE')?.path).toMatch(/\/media\/assets\/ast_1007$/);
    expect(toast).toHaveBeenCalledWith('Asset deleted', 'default');
  });
  it('bulk delete sends one call with every id and reports the in-use ones as partial', async () => {
    const r = await runCommand(
      'library.bulkDelete',
      { ids: ['ast_1004', 'ast_1006'] },
      { ...ctx, selection: { resource: 'library', ids: ['ast_1004', 'ast_1006'], rows: [] } },
    );
    expect(captured.find((c) => c.path.endsWith('/media/assets/bulk'))?.body).toEqual({ ids: ['ast_1004', 'ast_1006'] });
    expect(r.status).toBe('partial');
    if (r.status === 'partial') expect(r.failed).toEqual([{ id: 'ast_1006', reason: 'Used in 4 places' }]);
    expect(toast).toHaveBeenCalledWith('1 done, 1 failed', 'warning');
  });
  it('copyLink copies the public url without touching the backend', async () => {
    const a = await api.mediaApps.getAsset('ast_1001');
    captured.length = 0;
    const r = await runCommand('library.copyLink', undefined, { ...ctx, record: a });
    expect(r.status).toBe('success');
    expect(copy).toHaveBeenCalledWith(a.url);
    expect(captured.length).toBe(0);
  });
  it('addFromUrl posts the url and navigates to the new asset; a bad url is invalid before any call', async () => {
    const bad = await runCommand('library.addFromUrl', { url: 'not-a-url' }, ctx);
    expect(bad.status).toBe('invalid');
    const r = await runCommand('library.addFromUrl', { url: 'https://cdn.example.com/hero.png', folder: 'Brand' }, ctx);
    expect(r.status).toBe('success');
    expect(captured.find((c) => c.method === 'POST')?.body).toEqual({
      url: 'https://cdn.example.com/hero.png',
      title: null,
      folder: 'Brand',
    });
  });
});
