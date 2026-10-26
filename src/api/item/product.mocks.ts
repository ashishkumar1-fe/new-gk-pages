import { http, HttpResponse, delay } from 'msw';
import list from './fixtures/product.list.json';
import type { RawProduct, ProductWrite, BulkProductWrite, VariantWrite } from './product.wire';

/** In-memory item service seeded from the recorded fixture. Same shapes the real service sends. */
const store = new Map<string, RawProduct>((list.products as RawProduct[]).map((p) => [p.id, p]));
let seq = 2000;
const now = () => new Date().toISOString();
const reqId = () => ({ 'x-request-id': Math.random().toString(16).slice(2, 18) });

const fromWrite = (id: string, w: ProductWrite, prev?: RawProduct): RawProduct => ({
  id,
  title: w.title,
  handle: w.handle,
  body_html: w.body_html,
  vendor: w.vendor,
  product_type: w.product_type,
  status: w.status,
  tags: w.tags,
  created_at: prev?.created_at ?? now(),
  updated_at: now(),
  published_at: w.status === 'active' ? (prev?.published_at ?? now()) : null,
  charge_tax: w.charge_tax,
  hs_code: w.hs_code,
  seo_title: w.seo_title,
  seo_description: w.seo_description,
  options: prev?.options ?? [],
  images: prev?.images ?? [],
  template_suffix: w.template_suffix,
  sales_channel: w.sales_channel,
  is_physical_product: w.is_physical_product,
  has_sku_or_barcode: w.has_sku_or_barcode,
  weight: String(w.weight),
  weight_unit: w.weight_unit,
  country_of_origin: w.country_of_origin,
  collectionIds: w.collectionIds,
  product_category: w.product_category
    ? {
        product_taxonomy_node_id: w.product_category.product_taxonomy_node_id,
        name: prev?.product_category?.name,
        full_name: prev?.product_category?.full_name,
      }
    : prev?.product_category,
  variants: w.variants.map((v, i) => ({
    id: prev?.variants?.[i]?.id ?? `v_${id}_${i}`,
    title: v.title,
    price: v.price.toFixed(2),
    compare_at_price: v.compareAtPrice === null ? null : v.compareAtPrice.toFixed(2),
    cost_per_item: v.costPerItem === null ? null : v.costPerItem.toFixed(2),
    sku: v.sku,
    option1: prev?.variants?.[i]?.option1 ?? null,
    taxable: v.taxable,
    requires_shipping: true,
    inventory_management: prev?.variants?.[i]?.inventory_management ?? 'shopify',
    inventory_quantity: prev?.variants?.[i]?.inventory_quantity ?? 0,
  })),
  variants_count: w.variants.length,
});

export const productHandlers = [
  http.get('*/api/v1/admin/products/', async ({ request }) => {
    await delay(300);
    const u = new URL(request.url);
    const search = (u.searchParams.get('search') ?? '').toLowerCase();
    const status = u.searchParams.get('status');
    const vendors = (u.searchParams.get('vendor') ?? '').split(',').filter(Boolean);
    const page = Number(u.searchParams.get('page') ?? 1);
    const limit = Number(u.searchParams.get('limit') ?? 50);
    let rows = [...store.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (search) rows = rows.filter((p) => p.title.toLowerCase().includes(search) || (p.vendor ?? '').toLowerCase().includes(search));
    if (status) rows = rows.filter((p) => p.status === status);
    if (vendors.length) rows = rows.filter((p) => vendors.includes(p.vendor ?? ''));
    const tags = (u.searchParams.get('tags') ?? '').split(',').filter(Boolean);
    if (tags.length)
      rows = rows.filter((p) =>
        (p.tags ?? '')
          .split(',')
          .map((t) => t.trim())
          .some((t) => tags.includes(t)),
      );
    const type = u.searchParams.get('productType');
    if (type) rows = rows.filter((p) => p.product_type === type);
    const total = rows.length;
    const items = rows.slice((page - 1) * limit, page * limit);
    return HttpResponse.json(
      {
        products: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasNext: page * limit < total,
          hasPrevious: page > 1,
        },
      },
      { headers: reqId() },
    );
  }),
  http.get('*/api/v1/admin/products/:id', async ({ params }) => {
    await delay(200);
    const p = store.get(String(params.id));
    return p
      ? HttpResponse.json({ product: p }, { headers: reqId() })
      : HttpResponse.json({ code: 'NOT_FOUND', message: 'Product not found' }, { status: 404, headers: reqId() });
  }),
  http.post('*/api/v1/admin/products', async ({ request }) => {
    await delay(400);
    const { product } = (await request.json()) as { product: ProductWrite };
    if (!product.title?.trim())
      return HttpResponse.json(
        { message: 'Title is required', errors: [{ field: 'title', message: 'Title is required' }] },
        { status: 400, headers: reqId() },
      );
    const id = `p_${++seq}`;
    store.set(id, fromWrite(id, product));
    return HttpResponse.json({ product: { id } }, { status: 201, headers: reqId() });
  }),
  http.put('*/api/v1/admin/products/:id', async ({ params, request }) => {
    await delay(400);
    const prev = store.get(String(params.id));
    if (!prev) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Product not found' }, { status: 404, headers: reqId() });
    const { product } = (await request.json()) as { product: ProductWrite };
    if (product.title.toLowerCase().includes('boom'))
      return HttpResponse.json({ message: 'Simulated server error' }, { status: 500, headers: reqId() });
    const next = fromWrite(prev.id, product, prev);
    store.set(prev.id, next);
    return HttpResponse.json({ product: next }, { headers: reqId() });
  }),
  http.delete('*/api/v1/admin/products/bulk', async ({ request }) => {
    await delay(400);
    const { productIds } = (await request.json()) as { productIds: string[] };
    let n = 0;
    productIds.forEach((id) => {
      if (store.delete(id)) n++;
    });
    return HttpResponse.json({ deletedCount: n }, { headers: reqId() });
  }),
  http.delete('*/api/v1/admin/products/:id', async ({ params }) => {
    await delay(300);
    return store.delete(String(params.id))
      ? new HttpResponse(null, { status: 204, headers: reqId() })
      : HttpResponse.json({ message: 'Not found' }, { status: 404, headers: reqId() });
  }),
  http.post('*/api/v1/admin/product-operations/bulk-update', async ({ request }) => {
    await delay(400);
    const { storeId, products } = (await request.json()) as { storeId?: string; products: BulkProductWrite[] };
    if (!storeId || !Array.isArray(products))
      return HttpResponse.json({ message: 'storeId and products are required' }, { status: 400, headers: reqId() });
    let n = 0;
    for (const { id, data } of products) {
      const prev = store.get(id);
      if (!prev || !data.replaceVariants) continue;
      store.set(id, {
        ...prev,
        status: data.status,
        vendor: data.vendor,
        product_type: data.product_type,
        updated_at: now(),
        variants: data.variants.map((v) => {
          const old = prev.variants?.find((x) => x.id === v.id);
          return {
            ...(old ?? { id: v.id, title: v.title }),
            id: v.id,
            title: v.title,
            price: v.price.toFixed(2),
            sku: v.sku,
            compare_at_price: v.compareAtPrice === null ? null : v.compareAtPrice.toFixed(2),
          };
        }),
      });
      n++;
    }
    return HttpResponse.json({ updatedCount: n }, { headers: reqId() });
  }),
  http.put('*/api/v1/admin/variants/:id', async ({ params, request }) => {
    await delay(300);
    const w = (await request.json()) as VariantWrite;
    for (const p of store.values()) {
      const i = p.variants?.findIndex((v) => v.id === params.id) ?? -1;
      if (i < 0) continue;
      const v = {
        ...p.variants![i]!,
        title: w.title,
        price: Number(w.price).toFixed(2),
        compare_at_price: w.compare_at_price === null ? null : Number(w.compare_at_price).toFixed(2),
        sku: w.sku,
        barcode: w.barcode,
        taxable: w.taxable,
        inventory_management: w.inventory_management,
        continue_selling_out_of_stock: w.continue_selling_out_of_stock,
        updated_at: now(),
      };
      store.set(p.id, { ...p, variants: p.variants!.map((x, j) => (j === i ? v : x)), updated_at: now() });
      return HttpResponse.json({ data: v }, { headers: reqId() });
    }
    return HttpResponse.json({ message: 'Variant not found' }, { status: 404, headers: reqId() });
  }),
  http.post('*/api/v1/admin/content/title-and-description', async ({ request }) => {
    await delay(500);
    const b = (await request.json()) as { product_id?: string; description_length: number; userDescription?: string };
    const p = b.product_id ? store.get(b.product_id) : undefined;
    const title = p ? `${p.title} | Premium quality` : 'New arrival';
    const description = (b.userDescription ?? `A well made ${p?.product_type?.toLowerCase() ?? 'product'} for everyday use.`).slice(
      0,
      b.description_length,
    );
    return HttpResponse.json(
      { data: { requestId: `cnt_${++seq}`, generatedTitle: title, generatedDescription: description, processingTime: 420 } },
      { headers: reqId() },
    );
  }),
  http.get('*/api/v1/admin/filters', async () => {
    const all = [...store.values()];
    const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();
    return HttpResponse.json(
      {
        vendors: uniq(all.map((p) => p.vendor)),
        tags: uniq(all.flatMap((p) => (p.tags ?? '').split(',').map((t) => t.trim()))),
        types: uniq(all.map((p) => p.product_type)),
      },
      { headers: reqId() },
    );
  }),
  http.patch('*/api/v1/admin/content/:requestId/smart', async () => new HttpResponse(null, { status: 204, headers: reqId() })),
  http.get('*/api/v1/admin/configs/storefront/default', async () =>
    HttpResponse.json(
      {
        data: {
          value: { storefront_url: 'https://demo-store.example/', routeForProducts: 'products', routeForCollections: 'collections' },
        },
      },
      { headers: reqId() },
    ),
  ),
];
