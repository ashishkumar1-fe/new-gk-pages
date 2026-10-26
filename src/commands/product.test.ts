import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '@/mocks/handlers';
import { runCommand } from './runCommand';
import { configureCommandHost } from './host';
import type { CommandContext } from './define';
import { money } from '@/domain/shared/money';
import { api } from '@/api';

/** Command tests assert the exact endpoint and payload (TRD 13.4, silent bugs). Same MSW handlers the browser uses. */
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ctx: CommandContext = {
  storeId: 'demo-store',
  staff: { id: 's1', name: 'Ashish', email: 'a@x.in' },
  can: () => true,
  route: '/products',
  surface: 'button',
};
const captured: { method: string; path: string; search: string; body: unknown }[] = [];
const spy = () => {
  captured.length = 0;
  server.events.removeAllListeners();
  server.events.on('request:start', async ({ request }) => {
    const u = new URL(request.url);
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
    captured.push({ method: request.method, path: u.pathname, search: u.search, body });
  });
};
const toast = vi.fn();
const copy = vi.fn(async () => {});
beforeEach(() => {
  toast.mockReset();
  copy.mockClear();
  configureCommandHost({ confirm: async () => true, toast, navigate: () => {}, copy, openForm: async (_t, _f, i) => i });
  spy();
});

describe('product commands (defs/catalog.md)', () => {
  it('setStatus sends each full product to bulk-update with every variant kept', async () => {
    const r = await runCommand(
      'product.setStatus',
      { ids: ['p_1001'], status: 'draft' },
      { ...ctx, selection: { resource: 'product', ids: ['p_1001'], rows: [] } },
    );
    expect(r.status).toBe('success');
    const call = captured.find((c) => c.path.endsWith('/product-operations/bulk-update'))!;
    const body = call.body as {
      storeId: string;
      products: { id: string; data: { status: string; replaceVariants: boolean; variants: unknown[] } }[];
    };
    expect(call.method).toBe('POST');
    expect(body.storeId).toBe('demo-store');
    expect(body.products[0]).toMatchObject({ id: 'p_1001', data: { status: 'draft', replaceVariants: true } });
    expect(body.products[0]!.data.variants).toHaveLength(3);
    expect(toast).toHaveBeenCalledWith('1 products updated', 'default');
  });
  it('bulkEdit applies vendor to all and a variant price in integer paise, keeping the rest', async () => {
    const before = await api.item.getProduct('p_1001');
    const v = before.variants[1]!;
    const r = await runCommand(
      'product.bulkEdit',
      { ids: ['p_1001'], vendor: 'Acme', variants: [{ productId: 'p_1001', id: v.id, price: money(55500) }] },
      ctx,
    );
    expect(r.status).toBe('success');
    const body = captured.find((c) => c.path.endsWith('/bulk-update'))!.body as {
      products: { data: { vendor: string; status: string; variants: { id: string; price: number; sku: string }[] } }[];
    };
    const d = body.products[0]!.data;
    expect(d.vendor).toBe('Acme');
    expect(d.status).toBe(before.status);
    expect(d.variants.find((x) => x.id === v.id)!.price).toBe(55500);
    expect(d.variants.find((x) => x.id === before.variants[0]!.id)!.price).toBe(before.variants[0]!.price.minor);
  });
  it('bulkEdit with nothing to change is invalid and calls nothing', async () => {
    const r = await runCommand('product.bulkEdit', { ids: ['p_1001'] }, ctx);
    expect(r).toMatchObject({ status: 'invalid' });
    expect(captured.some((c) => c.path.endsWith('/bulk-update'))).toBe(false);
  });
  it('updateVariant PUTs /variants/:id with paise as strings', async () => {
    const p = await api.item.getProduct('p_1001');
    const v = p.variants[0]!;
    const r = await runCommand('product.updateVariant', { ...v, productId: p.id, price: money(49900), sku: 'NEW-SKU' }, ctx);
    expect(r.status).toBe('success');
    const call = captured.find((c) => c.method === 'PUT' && c.path.endsWith(`/variants/${v.id}`))!;
    expect(call.body).toMatchObject({ price: '49900', sku: 'NEW-SKU', inventory_management: 'shopify', position: 1 });
  });
  it('copyLink builds the storefront URL from settings and copies it', async () => {
    const p = await api.item.getProduct('p_1001');
    const r = await runCommand('product.copyLink', undefined, { ...ctx, record: p });
    expect(r.status).toBe('success');
    expect(copy).toHaveBeenCalledWith(`https://demo-store.example/products/${p.handle}`);
    expect(toast).toHaveBeenCalledWith('Link copied', 'default');
  });
  it('copyLink without storefront settings fails with the reason and copies nothing', async () => {
    server.use(http.get('*/api/v1/admin/configs/storefront/default', () => HttpResponse.json({ data: { value: {} } })));
    const p = await api.item.getProduct('p_1001');
    const r = await runCommand('product.copyLink', undefined, { ...ctx, record: p });
    expect(r).toMatchObject({ status: 'error', message: 'Set the storefront URL in Settings' });
    expect(copy).not.toHaveBeenCalled();
  });
  it('generateContent posts without storeId and returns a draft patch; a failed apply only warns', async () => {
    server.use(http.patch('*/api/v1/admin/content/:id/smart', () => HttpResponse.json({ message: 'down' }, { status: 500 })));
    const r = await runCommand<{ draftPatch: { title: string } }>('product.generateContent', undefined, {
      ...ctx,
      record: { id: 'p_1001' },
    });
    expect(r.status).toBe('success');
    const call = captured.find((c) => c.path.endsWith('/content/title-and-description'))!;
    expect(call.body).toEqual({ product_id: 'p_1001', description_length: 120 });
    expect(call.search).not.toContain('storeId');
    if (r.status === 'success') expect(r.warnings?.length).toBe(1);
  });
  it('duplicate navigates to create with the source id', async () => {
    const navigate = vi.fn();
    configureCommandHost({ navigate });
    await runCommand('product.duplicate', undefined, { ...ctx, record: { id: 'p_1001', title: 'Blue Cotton Shirt', status: 'active' } });
    expect(navigate).toHaveBeenCalledWith('/products/new?sourceId=p_1001');
  });
  it('export: preview builds entities from the template with requester params, then process starts the job', async () => {
    const pre = await runCommand<{ jobId: string }>('product.exportPreview', { format: 'xlsx', groups: { basic: ['title'] } }, ctx);
    expect(pre.status).toBe('success');
    const call = captured.find((c) => c.path.endsWith('/export/preview'))!;
    expect(call.search).toContain('user-email=a%40x.in');
    expect(call.search).toContain('store-id=demo-store');
    const ent = call.body as {
      entities: {
        entityType: string;
        configuration: { groups: Record<string, { include: boolean; columns: { name: string; include: boolean }[] }> };
      }[];
      fileFormat: string;
    };
    expect(ent.fileFormat).toBe('xlsx');
    expect(ent.entities[0]!.entityType).toBe('products');
    expect(ent.entities[0]!.configuration.groups.basic!.columns.filter((c) => c.include).map((c) => c.name)).toEqual(['title']);
    expect(ent.entities[0]!.configuration.groups.pricing!.include).toBe(false);
    const jobId = pre.status === 'success' ? pre.data.jobId : '';
    const r = await runCommand('product.export', { jobId }, ctx);
    expect(r.status).toBe('success');
    expect(captured.some((c) => c.method === 'POST' && c.path.endsWith(`/export/process/${jobId}`))).toBe(true);
    expect(toast).toHaveBeenCalledWith('Export started. The file will be emailed to a@x.in.', 'default');
  });
  it('import: preview is multipart with entityType product; import asks to confirm with the row count', async () => {
    const pre = await runCommand<{ jobId: string; totalRows: number }>(
      'product.importPreview',
      { file: new File(['title\nShirt'], 'p.csv') },
      ctx,
    );
    expect(pre).toMatchObject({ status: 'success', data: { jobId: 'job_import_1', isValid: true, totalRows: 12 } });
    const confirm = vi.fn(async () => true);
    configureCommandHost({ confirm });
    await runCommand('product.import', { jobId: 'job_import_1', rows: 12 }, ctx);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import 12 rows?', body: 'Existing products may be updated.', confirmLabel: 'Start import' }),
    );
    expect(captured.some((c) => c.path.endsWith('/import/job_import_1'))).toBe(true);
  });
});
