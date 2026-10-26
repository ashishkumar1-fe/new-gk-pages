import type { Product, ProductListItem, ProductInput, Variant, ProductStatus } from '@/domain/product/schema';
import { deriveHandle, normalizeWeightUnit, tagsJoin, tagsSplit } from '@/domain/product/rules';
import { money, type Money } from '@/domain/shared/money';
import type { RawProduct, ProductWrite, VariantWrite, BulkProductWrite } from './product.wire';
import type { z } from 'zod';
import type { RawVariant } from './product.wire';

/** "44900.00" → { minor: 44900 }. Item sends paise as a decimal string on reads. */
const paiseString = (s: string | null | undefined): Money | undefined =>
  s === null || s === undefined || s === '' ? undefined : money(Number(s));

/** sales_channel arrives as a list or as { online, pos }; the domain keeps a list. */
const channelsOf = (c: RawProduct['sales_channel']): ('online' | 'pos')[] =>
  !c
    ? []
    : Array.isArray(c)
      ? c.filter((x): x is 'online' | 'pos' => x === 'online' || x === 'pos')
      : [...(c.online ? ['online' as const] : []), ...(c.pos ? ['pos' as const] : [])];

const statusOf = (s: string): ProductStatus => (s === 'draft' || s === 'archived' ? s : 'active');

export const toVariant = (productId: string, options: { name: string }[], v: z.infer<typeof RawVariant>, created: string): Variant => ({
  id: v.id,
  productId,
  title: v.title,
  selectedOptions: [v.option1, v.option2, v.option3]
    .map((val, i) => (val && options[i] ? { name: options[i]!.name, value: val } : undefined))
    .filter((x): x is { name: string; value: string } => Boolean(x)),
  sku: v.sku ?? undefined,
  barcode: v.barcode ?? undefined,
  price: paiseString(v.price) ?? money(0),
  compareAtPrice: paiseString(v.compare_at_price),
  costPerItem: paiseString(v.cost_per_item),
  taxable: v.taxable ?? false,
  requiresShipping: v.requires_shipping ?? true,
  weight:
    v.weight !== undefined && v.weight !== null && v.weight !== ''
      ? { value: Number(v.weight), unit: normalizeWeightUnit(v.weight_unit) }
      : undefined,
  inventoryTracked: v.inventory_management === 'shopify',
  inventoryPolicy: v.continue_selling_out_of_stock ? 'continue' : 'deny',
  inventoryQuantity: v.inventory_quantity ?? 0,
  createdAt: v.created_at ?? created,
  updatedAt: v.updated_at ?? created,
});

/** Transform once, into a new object. Nothing above this mutates the result. */
export const toProduct = (w: RawProduct): Product => {
  const options = (w.options ?? []).map((o) => ({ id: o.id, name: o.name, position: o.position as 1 | 2 | 3, values: o.values }));
  const variants = (w.variants ?? []).map((v) => toVariant(w.id, options, v, w.created_at));
  return {
    id: w.id,
    title: w.title,
    handle: w.handle,
    descriptionHtml: w.body_html ?? '',
    status: statusOf(w.status),
    vendor: w.vendor ?? undefined,
    productType: w.product_type ?? undefined,
    tags: tagsSplit(w.tags),
    options,
    variants: variants.length ? variants : [defaultVariant(w)],
    images: (w.images ?? []).map((i, idx) => ({ id: i.id, url: i.src, altText: i.alt ?? undefined, position: i.position ?? idx })),
    seo: { title: w.seo_title ?? undefined, description: w.seo_description ?? undefined },
    tax: { taxable: w.charge_tax ?? false, hsnCode: w.hs_code ?? undefined },
    publishedAt: w.published_at ?? undefined,
    category: w.product_category?.product_taxonomy_node_id
      ? {
          id: w.product_category.product_taxonomy_node_id,
          name: w.product_category.name ?? '',
          fullName: w.product_category.full_name ?? w.product_category.name ?? '',
        }
      : undefined,
    channels: channelsOf(w.sales_channel),
    templateSuffix: w.template_suffix ?? undefined,
    countryOfOrigin: w.country_of_origin ?? undefined,
    isPhysical: w.is_physical_product ?? false,
    hasSkuOrBarcode: w.has_sku_or_barcode ?? true,
    collectionIds: w.collectionIds ?? [],
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
};

const defaultVariant = (w: RawProduct): Variant => ({
  id: `${w.id}-default`,
  productId: w.id,
  title: 'Default Title',
  selectedOptions: [],
  price: money(0),
  taxable: false,
  requiresShipping: true,
  inventoryTracked: false,
  inventoryPolicy: 'deny',
  inventoryQuantity: 0,
  createdAt: w.created_at,
  updatedAt: w.updated_at,
});

export const toListItem = (w: RawProduct): ProductListItem => {
  const p = toProduct(w);
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    vendor: p.vendor,
    productType: p.productType,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category,
    channels: p.channels,
    variantsCount: w.variants_count ?? p.variants.length,
    inventoryQuantity: p.variants.reduce((n, v) => n + v.inventoryQuantity, 0),
    imageUrl: p.images[0]?.url,
  };
};

/** Editor draft from a product (single-variant editing in the demo). */
export const toInput = (p: Product): ProductInput => {
  const v = p.variants[0]!;
  return {
    id: p.id,
    title: p.title,
    descriptionHtml: p.descriptionHtml,
    status: p.status,
    vendor: p.vendor,
    productType: p.productType,
    tags: p.tags,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    costPerItem: v.costPerItem,
    sku: v.sku,
    taxable: p.tax.taxable,
    hsnCode: p.tax.hsnCode,
    seoTitle: p.seo.title,
    seoDescription: p.seo.description,
    handle: p.handle,
    templateSuffix: p.templateSuffix,
    channels: p.channels,
    isPhysical: p.isPhysical,
    weight: v.weight,
    countryOfOrigin: p.countryOfOrigin ?? 'US',
    categoryId: p.category?.id,
    collectionIds: p.collectionIds,
  };
};

/** Domain input → wire body. Commands never see these names. */
export const toWire = (i: ProductInput): ProductWrite => ({
  title: i.title,
  body_html: i.descriptionHtml,
  vendor: i.vendor ?? '',
  product_type: i.productType ?? '',
  handle: deriveHandle(i.title, i.handle),
  status: i.status,
  tags: tagsJoin(i.tags),
  price: i.price.minor,
  compare_at_price: i.compareAtPrice?.minor ?? null,
  cost_per_item: i.costPerItem?.minor ?? null,
  charge_tax: i.taxable,
  hs_code: i.hsnCode ?? '',
  sku: i.sku ?? '',
  seo_title: i.seoTitle ?? '',
  seo_description: i.seoDescription ?? '',
  seo_url_handle: deriveHandle(i.title, i.handle),
  template_suffix: i.templateSuffix || null,
  sales_channel: i.channels,
  is_physical_product: i.isPhysical,
  has_sku_or_barcode: true,
  weight: i.weight?.value ?? 0,
  weight_unit: normalizeWeightUnit(i.weight?.unit),
  country_of_origin: i.countryOfOrigin,
  collectionIds: i.collectionIds,
  ...(i.categoryId ? { product_category: { product_taxonomy_node_id: i.categoryId } } : {}),
  variants: [
    {
      title: 'Default Title',
      price: i.price.minor,
      compareAtPrice: i.compareAtPrice?.minor ?? null,
      costPerItem: i.costPerItem?.minor ?? null,
      sku: i.sku ?? '',
      taxable: i.taxable,
    },
  ],
});

/** A variant edit → PUT /variants/:id body. Paise as strings here (gateway/item.md). */
export interface VariantUpdateInput {
  id: string;
  productId: string;
  title: string;
  price: Money;
  compareAtPrice?: Money;
  costPerItem?: Money;
  sku?: string;
  barcode?: string;
  taxable: boolean;
  inventoryTracked: boolean;
  inventoryPolicy: 'deny' | 'continue';
  selectedOptions: { name: string; value: string }[];
  weight?: { value: number; unit: string };
}
export const toVariantWire = (v: VariantUpdateInput): VariantWrite => ({
  title: v.title,
  price: String(v.price.minor),
  compare_at_price: v.compareAtPrice ? String(v.compareAtPrice.minor) : null,
  cost_per_item: v.costPerItem?.minor ?? 0,
  position: 1,
  sku: v.sku ?? '',
  barcode: v.barcode ?? '',
  taxable: v.taxable,
  requires_shipping: true,
  fulfillment_service: 'manual',
  inventory_policy: v.inventoryPolicy,
  inventory_management: v.inventoryTracked ? 'shopify' : null,
  continue_selling_out_of_stock: v.inventoryPolicy === 'continue',
  option1: v.selectedOptions[0]?.value ?? null,
  option2: v.selectedOptions[1]?.value ?? null,
  option3: v.selectedOptions[2]?.value ?? null,
  weight: v.weight?.value ?? 0,
  weight_unit: v.weight?.unit ?? 'kg',
});

/** Fields a bulk edit may change (status, vendor, type per product; price, SKU per variant). Anything absent is kept. */
export interface ProductBulkEdit {
  id: string;
  status?: ProductStatus;
  vendor?: string;
  productType?: string;
  variants?: { id: string; price?: Money; sku?: string }[];
}
/** The full product with the edit applied, in integer paise, every variant kept (replaceVariants is true on this endpoint). */
export const toBulkWire = (p: Product, e: ProductBulkEdit): BulkProductWrite => {
  const edits = new Map((e.variants ?? []).map((v) => [v.id, v]));
  const first = p.variants[0];
  const variants = p.variants.map((v) => {
    const ed = edits.get(v.id);
    const opt = (i: number) => v.selectedOptions[i]?.value ?? null;
    return {
      id: v.id,
      title: v.title,
      price: (ed?.price ?? v.price).minor,
      compareAtPrice: v.compareAtPrice?.minor ?? null,
      costPerItem: v.costPerItem?.minor ?? null,
      sku: ed?.sku ?? v.sku ?? '',
      barcode: v.barcode ?? '',
      taxable: v.taxable,
      option1: opt(0),
      option2: opt(1),
      option3: opt(2),
      inventoryQuantity: v.inventoryQuantity,
    };
  });
  const head = variants[0];
  return {
    id: p.id,
    data: {
      title: p.title,
      body_html: p.descriptionHtml,
      vendor: e.vendor ?? p.vendor ?? '',
      product_type: e.productType ?? p.productType ?? '',
      handle: p.handle,
      status: e.status ?? p.status,
      tags: tagsJoin(p.tags),
      price: head?.price ?? 0,
      compare_at_price: head?.compareAtPrice ?? null,
      cost_per_item: head?.costPerItem ?? null,
      charge_tax: p.tax.taxable,
      hs_code: p.tax.hsnCode ?? '',
      sku: head?.sku ?? first?.sku ?? '',
      seo_title: p.seo.title ?? '',
      seo_description: p.seo.description ?? '',
      seo_url_handle: p.handle,
      template_suffix: p.templateSuffix ?? null,
      sales_channel: p.channels,
      is_physical_product: p.isPhysical,
      has_sku_or_barcode: p.hasSkuOrBarcode,
      weight: first?.weight?.value ?? 0,
      weight_unit: normalizeWeightUnit(first?.weight?.unit),
      country_of_origin: p.countryOfOrigin ?? '',
      collectionIds: p.collectionIds,
      ...(p.category ? { product_category: { product_taxonomy_node_id: p.category.id } } : {}),
      replaceVariants: true,
      replaceOptionValues: true,
      replaceImages: true,
      variants,
    },
  };
};
