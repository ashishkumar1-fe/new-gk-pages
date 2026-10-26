import { request } from '@/platform/http/client';
import { BASE } from '@/platform/config';
import { reportDrift } from '@/platform/telemetry';
import type { Page } from '@/domain/shared/entity';
import type { Product, ProductListItem, ProductInput, ProductStatus } from '@/domain/product/schema';
export type { ProductBulkEdit, VariantUpdateInput } from './product.transformer';
import {
  RawProductList,
  RawProductDetail,
  RawProductCreated,
  RawVariantResponse,
  RawBulkUpdate,
  RawContentResponse,
  RawStorefront,
} from './product.wire';
import {
  toProduct,
  toListItem,
  toWire,
  toVariant,
  toVariantWire,
  toBulkWire,
  type VariantUpdateInput,
  type ProductBulkEdit,
} from './product.transformer';
import type { Variant } from '@/domain/product/schema';
import { getStoreId } from '@/platform/merchant';

const ROOT = `${BASE}/api/v1/admin`;
export interface Opts {
  signal?: AbortSignal;
  idempotencyKey?: string;
}

/** Typed query in domain names; this module encodes it for the item service. */
export interface ProductQuery {
  search?: string;
  status?: ProductStatus;
  vendors?: string[];
  tags?: string[];
  productType?: string;
  page?: number;
  limit?: number;
}
const encode = (q: ProductQuery) => ({
  search: q.search,
  status: q.status,
  vendor: q.vendors?.join(','),
  tags: q.tags?.join(','),
  productType: q.productType,
  page: q.page ?? 1,
  limit: q.limit ?? 50,
});

export async function listProducts(q: ProductQuery, { signal }: Opts = {}): Promise<Page<ProductListItem>> {
  const { body } = await request(`${ROOT}/products/`, { params: encode(q), signal });
  const parsed = RawProductList.safeParse(body);
  if (!parsed.success) reportDrift('item', 'GET /products', parsed.error.issues);
  const data = parsed.success ? parsed.data : (body as ReturnType<typeof RawProductList.parse>);
  return {
    items: data.products.map(toListItem),
    page: data.pagination.page,
    limit: data.pagination.limit,
    total: data.pagination.total,
    hasNext: data.pagination.hasNext,
  };
}

export async function getProduct(id: string, { signal }: Opts = {}): Promise<Product> {
  const { body } = await request(`${ROOT}/products/${id}`, { signal });
  const parsed = RawProductDetail.safeParse(body);
  if (!parsed.success) reportDrift('item', 'GET /products/:id', parsed.error.issues);
  return toProduct((parsed.success ? parsed.data : (body as ReturnType<typeof RawProductDetail.parse>)).product);
}

export async function searchProducts(text: string, limit: number, { signal }: Opts = {}): Promise<ProductListItem[]> {
  return (await listProducts({ search: text, limit, status: 'active' }, { signal })).items;
}

export async function createProduct(i: ProductInput, { signal }: Opts = {}): Promise<Product> {
  const { body } = await request(`${ROOT}/products`, { method: 'POST', body: { product: toWire(i) }, signal });
  const { product } = RawProductCreated.parse(body);
  return getProduct(product.id, { signal });
}

export async function updateProduct(i: ProductInput & { id: string }, { signal }: Opts = {}): Promise<Product> {
  const { body } = await request(`${ROOT}/products/${i.id}`, {
    method: 'PUT',
    body: { product: { ...toWire(i), replaceVariants: true } },
    signal,
  });
  const parsed = RawProductDetail.safeParse(body);
  return parsed.success ? toProduct(parsed.data.product) : getProduct(i.id, { signal });
}

export async function deleteProduct(id: string, { signal }: Opts = {}): Promise<void> {
  await request(`${ROOT}/products/${id}`, { method: 'DELETE', signal });
}

export async function bulkDeleteProducts(ids: string[], { signal }: Opts = {}): Promise<{ deletedCount: number }> {
  const { body } = await request<{ deletedCount?: number }>(`${ROOT}/products/bulk`, {
    method: 'DELETE',
    body: { productIds: ids },
    signal,
  });
  return { deletedCount: body?.deletedCount ?? ids.length };
}

/** PUT /variants/:id: the variants page keeps its own save, as today. */
export async function updateVariant(i: VariantUpdateInput, { signal }: Opts = {}): Promise<Variant> {
  const { body } = await request(`${ROOT}/variants/${i.id}`, { method: 'PUT', body: toVariantWire(i), signal });
  const parsed = RawVariantResponse.safeParse(body);
  if (!parsed.success) {
    reportDrift('item', 'PUT /variants/:id', parsed.error.issues);
    return (await getProduct(i.productId, { signal })).variants.find((v) => v.id === i.id)!;
  }
  const raw = 'data' in parsed.data ? parsed.data.data : parsed.data;
  return toVariant(
    i.productId,
    i.selectedOptions.map((o) => ({ name: o.name })),
    raw,
    raw.created_at ?? new Date().toISOString(),
  );
}

/**
 * POST /product-operations/bulk-update with each full product. Count only: the whole call succeeds or fails.
 * Each product is read first so the replace* flags never drop variants, options or images.
 */
export async function bulkUpdateProducts(edits: ProductBulkEdit[], { signal, idempotencyKey }: Opts = {}): Promise<{ updated: number }> {
  const products = await Promise.all(edits.map((e) => getProduct(e.id, { signal })));
  const { body } = await request(`${ROOT}/product-operations/bulk-update`, {
    method: 'POST',
    body: { storeId: getStoreId(), products: products.map((p, i) => toBulkWire(p, edits[i]!)) },
    headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : undefined,
    signal,
  });
  const r = RawBulkUpdate.safeParse(body);
  return { updated: (r.success ? (r.data.updatedCount ?? r.data.updated) : undefined) ?? edits.length };
}

export interface GenerateContentInput {
  productId?: string;
  idealProductId?: string;
  descriptionLength: number;
  userDescription?: string;
}
export interface GeneratedContent {
  requestId: string;
  title: string;
  description: string;
}
/** POST /content/title-and-description. No storeId on content calls. product_id is dropped when empty, as today. */
export async function generateContent(i: GenerateContentInput, { signal }: Opts = {}): Promise<GeneratedContent> {
  const { body } = await request(`${ROOT}/content/title-and-description`, {
    method: 'POST',
    signal,
    body: {
      ...(i.productId ? { product_id: i.productId } : {}),
      ...(i.idealProductId ? { ideal_product_id: i.idealProductId } : {}),
      description_length: i.descriptionLength,
      ...(i.userDescription ? { userDescription: i.userDescription } : {}),
    },
  });
  const p = RawContentResponse.parse(body);
  const c = 'data' in p ? p.data : p;
  return { requestId: c.requestId, title: c.generatedTitle, description: c.generatedDescription };
}
/** PATCH /content/:requestId/smart: records which generated text was applied. */
export async function applyContent(requestId: string, c: { title: string; description: string }, { signal }: Opts = {}): Promise<void> {
  await request(`${ROOT}/content/${requestId}/smart`, { method: 'PATCH', body: c, signal });
}

export interface StorefrontSettings {
  storefrontUrl: string;
  routeForProducts: string;
  routeForCollections: string;
}
/** GET /configs/storefront/default; the value may sit under data.value, value or data (gk-pages modules/storefrontSettings/api.ts:9). */
export async function getStorefrontSettings({ signal }: Opts = {}): Promise<StorefrontSettings> {
  const { body } = await request<Record<string, unknown>>(`${ROOT}/configs/storefront/default`, { signal });
  const b = body as { data?: { value?: unknown } & Record<string, unknown>; value?: unknown } | undefined;
  const raw = RawStorefront.safeParse(b?.data?.value ?? b?.value ?? b?.data ?? b ?? {});
  const v = raw.success ? raw.data : {};
  return {
    storefrontUrl: v.storefront_url ?? '',
    routeForProducts: v.routeForProducts ?? '',
    routeForCollections: v.routeForCollections ?? '',
  };
}

export interface ProductFilterLookups {
  vendors: string[];
  tags: string[];
  types: string[];
}
/** GET /filters: vendor, tag and type values for the product list filters (cache class 'lookup'). */
export async function listProductFilters({ signal }: Opts = {}): Promise<ProductFilterLookups> {
  const { body } = await request<{
    vendors?: string[];
    tags?: string[];
    types?: string[];
    data?: { vendors?: string[]; tags?: string[]; types?: string[] };
  }>(`${ROOT}/filters`, { params: { storeId: getStoreId() }, signal });
  const b = body?.data ?? body ?? {};
  return { vendors: b.vendors ?? [], tags: b.tags ?? [], types: b.types ?? [] };
}
